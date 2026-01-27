# 敏感词检测平台 
一个高性能的敏感词检测和过滤库，基于 Go 语言开发，采用整洁架构设计。专注于中文文本的敏感词检测，支持多种检测策略和灵活的扩展机制。
## 主要特性

- 🚀 超高性能：基于优化的 Trie 和 AC 自动机算法
- 📚 并发安全：支持高并发场景，内置多重并发优化机制
- 📚 海量词库：内置20W+敏感词，经过深度优化和去重后保留7W+高质量词条
- 🎯 精准检测：支持多种文本匹配策略
- 🔄 灵活分类：支持多种敏感词分类（涉黄、涉政、暴力等），可独立开关
- 🛠 可扩展：支持自定义词库扩展，支持动态更新
- 📦 轻量级：无外部依赖，即插即用
- 🔒 安全性：内置多种反规避机制
- 💡 智能匹配：支持模糊匹配、变体识别
- 🤖 AI辅助：支持OpenAI、Anthropic等多种AI模型进行智能检测


# Quick Start
```
docker run -d  --name daf  -p 8088:8088 -v ./data:/app/data  ghcr.io/rachelos/go-daf:latest
```

# Quick Upgrade
```
docker stop daf
docker rm daf
docker pull ghcr.io/rachelos/daf:latest
# If you added other parameters, please modify accordingly
docker run -d  --name we-mp-rss  -p 8088:8088 -v ./data:/app/data  ghcr.io/rachelos/go-daf:latest
```

# Official Image
```
docker run -d  --name daf  -p 8088:8088 -v ./data:/app/data  rachelos/go-daf:latest
```
# Proxy Mirror for Faster Access (Faster access in China)
```
docker run -d  --name daf  -p 8088:8088 -v ./data:/app/data  docker.1ms.run/rachelos/go-daf:latest  
```

## Compose Example
```yaml
version: '3.8'
services:
  daf:
    image: rachelos/go-daf:latest
    ports:
      - "8088:8088"
    volumes:
      - ./config.yml:/app/config.yml:ro
      - ./data:/app/data
    environment:
      - SERVER_PORT=8088
```
## 界面预览
登录
<img alt="image" src="https://github.com/user-attachments/assets/a8894c9d-9ce6-49e4-a158-33313024dcee" />
数据统计
<img alt="image" src="https://github.com/user-attachments/assets/a5982489-803c-4dd1-881c-e165fc7ddd6a" />
文本检测
<img alt="image" src="https://github.com/user-attachments/assets/212dcc0d-d2bf-4c77-9b6e-7c2649864c3d" />
文本过滤
<img alt="image" src="https://github.com/user-attachments/assets/de45dc05-624b-4bea-82fa-4529ae94af9c" />
词库管理
<img alt="image" src="https://github.com/user-attachments/assets/24ab68e8-cb3c-4835-a46a-78ad1e12e88e" />
词库列表
<img alt="image" src="https://github.com/user-attachments/assets/65bd9c98-0368-4eaa-901f-a857ad71cd1b" />
分类信息
<img alt="image" src="https://github.com/user-attachments/assets/311fdbaa-eb73-4be6-8e60-97188dc75b4e" />
系统配置
<img alt="image" src="https://github.com/user-attachments/assets/742be816-19f5-4c9d-abd9-22e48839cd2d" />
<img alt="image" src="https://github.com/user-attachments/assets/ffb421bf-02fe-40e2-a327-14f6c8e59753" />
检测日志
<img alt="image" src="https://github.com/user-attachments/assets/e147b8c6-00d6-4c85-9f49-a71fb27aab47" />
日志分析
<img alt="image" src="https://github.com/user-attachments/assets/625c5a88-f9e6-482b-9238-bfd741e12d25" />
用户管理
<img alt="image" src="https://github.com/user-attachments/assets/64d9372f-2aef-4a0b-b53f-f8d1fe3a910e" />
AK管理
<img alt="image" src="https://github.com/user-attachments/assets/f61d19bb-ac5e-4fc6-8cb2-ca4ad1b66ae8" />
<img width="608" height="883" alt="image" src="https://github.com/user-attachments/assets/a7d8126c-a7a1-41a6-a131-7c7afa456be8" />




## 技术栈

- Vite 5 - 快速构建工具
- Vue 3 - 渐进式 JavaScript 框架
- TypeScript - 类型安全的 JavaScript
- Arco Design - 字节跳动企业级设计系统
- Axios - HTTP 请求库
- Pinia - Vue 状态管理

## 安装依赖

```bash
npm install
```

## 开发模式

```bash
npm run dev
```

访问 http://localhost:3000

## 构建生产版本

```bash
npm run build
```

## 预览生产构建

```bash
npm run preview
```

## 默认账号

- 管理员: admin / admin123

## API 配置

API 地址默认配置为 `http://localhost:8081`，可在 `vite.config.ts` 中修改代理配置。

## 目录结构

```
src/
├── api/           # API 接口定义
├── stores/        # Pinia 状态管理
├── views/         # 页面组件
├── router/        # 路由配置
├── App.vue        # 根组件
└── main.ts        # 入口文件
```
