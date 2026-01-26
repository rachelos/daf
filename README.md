# 敏感词检测管理系统 - Web UI

基于 Vite + Vue 3 + TypeScript + Arco Design 的前端项目。

## 功能特性

- 文本检测 - 快速检测和全量检测敏感词
- 文本过滤 - 自动过滤文本中的敏感词
- 词汇管理 - 批量添加/删除敏感词
- 用户管理 - 管理系统用户和权限（管理员）
- 分类信息 - 查看系统支持的敏感词分类
- 用户认证 - JWT Token 认证登录

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
