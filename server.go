package main

import (
	"io/fs"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gorilla/mux"
	"github.com/rachelos/go-daf/api/accesskey"
	"github.com/rachelos/go-daf/api/auth"
	apiConfig "github.com/rachelos/go-daf/api/config"
	"github.com/rachelos/go-daf/api/correction"
	"github.com/rachelos/go-daf/api/detect"
	"github.com/rachelos/go-daf/api/health"
	"github.com/rachelos/go-daf/api/user"
	"github.com/rachelos/go-daf/api/word"
	"github.com/rachelos/go-daf/pkg/ai"
	"github.com/rachelos/go-daf/pkg/config"
	"github.com/rachelos/go-daf/pkg/corrector"
	"github.com/rachelos/go-daf/pkg/daf"
	"github.com/rachelos/go-daf/pkg/embed"
	applogger "github.com/rachelos/go-daf/pkg/logger"
)

// APIServer 提供敏感词检测和管理的HTTP API服务
type APIServer struct {
	router            *mux.Router
	jwtManager        *auth.JWTManager
	authMW            *auth.AKAuthMiddleware
	userHandler       *user.Handler
	detectHandler     *detect.Handler
	correctionHandler *correction.Handler
	wordHandler       *word.Handler
	healthHandler     *health.Handler
	accessKeyHandler  *accesskey.Handler
	configHandler     *apiConfig.Handler
	config            *config.Config
	detectionLogStore *detect.DBDetectionLogStore
	aiClient          *ai.AIClient
}

// NewAPIServer 创建新的API服务器
func NewAPIServer(configPath string) (*APIServer, error) {
	// 加载配置
	cfg, err := config.LoadConfigOrDefault(configPath)
	if err != nil {
		log.Printf("加载配置文件失败，使用默认配置: %v", err)
		cfg = config.GetDefaultConfig()
	} else {
		log.Println("成功加载配置文件:", configPath)
	}

	// 初始化日志系统
	loggerCfg := applogger.Config{
		LogLevel:     cfg.Logger.LogLevel,
		LogDir:       cfg.Logger.LogDir,
		EnableFile:   cfg.Logger.EnableFile,
		EnableStdout: cfg.Logger.EnableStdout,
	}
	if err := applogger.Init(&loggerCfg); err != nil {
		log.Printf("初始化日志系统失败: %v", err)
		return nil, err
	}
	applogger.Info("日志系统初始化成功")
	applogger.Info("日志级别: %s, 日志目录: %s", cfg.Logger.LogLevel, cfg.Logger.LogDir)

	// 创建敏感词检测器
	applogger.Info("配置信息:")
	applogger.Info("  - 加载默认词库: %v", cfg.Dictionary.LoadDefaultWords)
	applogger.Info("  - 忽略大小写: %v", cfg.Detection.IgnoreCase)
	applogger.Info("  - 忽略全角半角: %v", cfg.Detection.IgnoreWidth)
	applogger.Info("  - 启用拼音检测: %v", cfg.Detection.EnablePinyin)
	applogger.Info("  - 启用同音字检测: %v", cfg.Detection.EnableHomophone)
	applogger.Info("  - 启用形近字检测: %v", cfg.Detection.EnableSimilarShape)
	applogger.Info("  - 启用异体字检测: %v", cfg.Detection.EnableVariantForm)
	applogger.Info("  - 启用中文拼音混合: %v", cfg.Detection.EnableZhPYMix)
	applogger.Info("  - 启用通配符检测: %v", cfg.Detection.EnableWildcard)
	applogger.Info("  - 跳过敏感词检测纠错: %v", cfg.Correction.SkipSensitiveCheck)
	applogger.Info("  - 外部词库目录: %s", cfg.Dictionary.ExternalWordDir)
	applogger.Info("  - 纠错词库目录: %s", cfg.Dictionary.CorrectionWordDir)

	// 使用 NewWithConfig 创建 DAF 引擎，自动加载外部词库
	detector, err := daf.NewWithConfig(cfg)
	if err != nil {
		applogger.Error("创建敏感词检测器失败: %v", err)
		return nil, err
	}
	applogger.Info("敏感词检测器创建成功")

	// 创建JWT管理器和用户存储
	jwtManager := auth.NewJWTManager(cfg.Server.JWTSecret, time.Hour*24)
	// 使用数据库存储用户信息
	userStore, err := auth.NewDBUserStoreWithConfig(&cfg.Server.UserDB)
	if err != nil {
		applogger.Error("创建用户存储失败: %v", err)
		return nil, err
	}
	applogger.Info("用户存储创建成功，数据库类型: %s", cfg.Server.UserDB.Type)

	// 创建Access Key存储
	accessKeyStore, err := auth.NewDBAccessKeyStore(&cfg.Server.UserDB)
	if err != nil {
		applogger.Error("创建Access Key存储失败: %v", err)
		return nil, err
	}
	applogger.Info("Access Key存储创建成功，数据库类型: %s", cfg.Server.UserDB.Type)

	// 创建检测日志存储
	applogger.Info("初始化检测日志存储...")
	detectionLogStore, err := detect.NewDBDetectionLogStore(&cfg.Server.UserDB)
	if err != nil {
		applogger.Error("创建检测日志存储失败: %v", err)
		return nil, err
	}
	applogger.Info("检测日志存储创建成功，数据库类型: %s", cfg.Server.UserDB.Type)

	// 创建支持AK认证的中间件
	authMW := auth.NewAKAuthMiddleware(jwtManager, userStore, accessKeyStore)

	// 创建纠错器管理器
	correctionManager := corrector.NewCorrectionManager(cfg.Dictionary.CorrectionWordDir)
	applogger.Info("纠错器管理器创建成功，词库目录: %s", cfg.Dictionary.CorrectionWordDir)

	// 创建AI客户端（如果启用）
	var aiClient *ai.AIClient
	if cfg.AI.Enabled {
		applogger.Info("AI检测功能已启用")
		applogger.Info("  - 提供商: %s", cfg.AI.Provider)
		applogger.Info("  - 模型: %s", cfg.AI.Model)
		applogger.Info("  - 端点: %s", func() string {
			if cfg.AI.Endpoint == "" {
				return "默认"
			}
			return cfg.AI.Endpoint
		}())
	applogger.Info("  - 最大Tokens: %d", cfg.AI.MaxTokens)
	applogger.Info("  - 温度参数: %.2f", cfg.AI.Temperature)
	applogger.Info("  - 超时时间: %d秒", cfg.AI.Timeout)
	applogger.Info("  - 判定阈值: %.2f", cfg.AI.Threshold)

	// 打印级联配置信息
	if cfg.Cascade.Enabled {
		applogger.Info("级联功能已启用")
		applogger.Info("  - 上级端点: %s", cfg.Cascade.Endpoint)
		applogger.Info("  - 超时时间: %d秒", cfg.Cascade.Timeout)
		applogger.Info("  - 级联模式: %s", cfg.Cascade.Mode)
		applogger.Info("  - 本地缓存: %v", cfg.Cascade.LocalCache)
	} else {
		applogger.Info("级联功能未启用")
	}

	// 转换为AI配置
		aiCfg := &ai.Config{
			Enabled:     cfg.AI.Enabled,
			Provider:    cfg.AI.Provider,
			APIKey:      cfg.AI.APIKey,
			APISecret:   cfg.AI.APISecret,
			Model:       cfg.AI.Model,
			Endpoint:    cfg.AI.Endpoint,
			MaxTokens:   cfg.AI.MaxTokens,
			Temperature: cfg.AI.Temperature,
			Timeout:     cfg.AI.Timeout,
			Threshold:   cfg.AI.Threshold,
		}
		aiClient = ai.NewAIClient(aiCfg)
		applogger.Info("AI客户端创建成功")
	} else {
		applogger.Info("AI检测功能未启用")
	}

	// 创建各功能处理器
	userHandler := user.NewHandler(userStore)
	detectHandler := detect.NewHandlerWithCascade(detector, aiClient, detectionLogStore, &cfg.Cascade)
	correctionHandler := correction.NewHandler(correctionManager, detector)
	wordHandler := word.NewHandler(detector, cfg)
	healthHandler := health.NewHandler()
	accessKeyHandler := accesskey.NewHandler(accessKeyStore)
	configHandler := apiConfig.NewHandler(detector, cfg)
	configHandler.SetConfigPath(configPath)

	server := &APIServer{
		router:            mux.NewRouter(),
		jwtManager:        jwtManager,
		authMW:            authMW,
		userHandler:       userHandler,
		detectHandler:     detectHandler,
		correctionHandler: correctionHandler,
		wordHandler:       wordHandler,
		healthHandler:     healthHandler,
		accessKeyHandler:  accessKeyHandler,
		configHandler:     configHandler,
		config:            cfg,
		detectionLogStore: detectionLogStore,
		aiClient:          aiClient,
	}

	// 设置路由
	server.setupRoutes()

	return server, nil
}

// setupRoutes 设置API路由
func (s *APIServer) setupRoutes() {
	api := s.router.PathPrefix("/api/v1").Subrouter()

	// 注册公开路由
	auth.RegisterAuthRoutes(api, s.jwtManager, s.authMW.GetUserStore())
	s.healthHandler.RegisterRoutes(api)
	s.wordHandler.RegisterRoutes(api)

	// 系统标题接口（无需授权）
	api.HandleFunc("/system/title", s.configHandler.HandleGetSystemTitle).Methods("GET")

	// 注册需要认证的路由
	s.detectHandler.RegisterRoutes(api, s.authMW)
	s.correctionHandler.RegisterRoutes(api, s.authMW)
	s.userHandler.RegisterAuthRoutes(api, s.authMW)

	// 注册需要管理员或词库管理员权限的路由
	s.wordHandler.RegisterProtectedRoutes(api, s.authMW)
	s.correctionHandler.RegisterAdminRoutes(api, s.authMW)
	s.userHandler.RegisterAdminRoutes(api, s.authMW)

	// 注册Access Key管理路由（需要admin权限）
	s.accessKeyHandler.RegisterRoutes(api, s.authMW)

	// 注册日志管理路由（需要admin权限）
	logHandler := detect.NewLogHandler(s.detectionLogStore)
	logHandler.RegisterLogRoutes(api, s.authMW)

	// 注册配置信息路由（需要认证）
	api.Handle("/config", s.authMW.Middleware(http.HandlerFunc(s.configHandler.HandleGetConfig))).Methods("GET")
	api.Handle("/config/update", s.authMW.Middleware(http.HandlerFunc(s.configHandler.HandleUpdateConfig))).Methods("POST")
	api.Handle("/config/reload", s.authMW.Middleware(http.HandlerFunc(s.configHandler.HandleReloadConfig))).Methods("POST")
	api.Handle("/config/restart", s.authMW.Middleware(http.HandlerFunc(s.configHandler.HandleRestartServer))).Methods("POST")

	// 静态文件服务 - 管理界面（使用嵌入的文件系统）
	rawFS := embed.GetEmbedFS()
	spaFS, err := fs.Sub(rawFS, "web")
	if err != nil {
		applogger.Error("加载嵌入的Web文件失败: %v", err)
		// 继续启动，但不提供Web界面
	} else {
		// 创建SPA文件系统处理器，支持Vue history模式路由
		fileServer := http.FileServer(http.FS(spaFS))
		s.router.PathPrefix("/").Handler(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// 检查是否是API请求，如果是则跳过静态文件服务
			if strings.HasPrefix(r.URL.Path, "/api/") {
				s.router.NotFoundHandler.ServeHTTP(w, r)
				return
			}
			if !strings.HasPrefix(r.URL.Path, "/assets/") {
				r.URL.Path = "/"
			}
			// 服务文件或index.html
			fileServer.ServeHTTP(w, r)
		}))
	}

	// 添加HTTP日志中间件
	s.router.Use(applogger.HTTPMiddlewareFunc())

	// 添加CORS中间件
	s.router.Use(s.corsMiddleware)
}

// corsMiddleware CORS中间件
func (s *APIServer) corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

// Start 启动服务器
func (s *APIServer) Start() error {
	addr := ":" + strconv.Itoa(s.config.Server.Port)
	applogger.Info("敏感词检测API服务启动在端口 %d", s.config.Server.Port)
	applogger.Info("健康检查: http://localhost:%d/api/v1/health", s.config.Server.Port)
	applogger.Info("API文档请参考: http://localhost:%d/api/v1/categories", s.config.Server.Port)

	return http.ListenAndServe(addr, s.router)
}

func main() {
	// 配置文件路径
	configPath := "config.yml"

	server, err := NewAPIServer(configPath)
	if err != nil {
		log.Fatal("创建API服务器失败:", err)
	}
	defer applogger.GetLogger().Close()

	// 启动服务器
	if err := server.Start(); err != nil {
		applogger.Fatal("启动服务器失败: %v", err)
	}
}
