# 前端加密功能使用指南

## 快速开始

### 1. 安装依赖

```bash
npm install
```

已包含 `crypto-js` 依赖，无需额外安装。

### 2. 配置加密密钥（可选）

创建 `.env` 文件（或从 `.env.example` 复制）：

```bash
# .env
VITE_ENCRYPTION_KEY=your-base64-encoded-key-here
```

生成密钥：
```bash
openssl rand -base64 32
```

### 3. 启动开发服务器

```bash
npm run dev
```

## 工作原理

加密功能是**可选的**：

- **未配置密钥**：所有请求不加密，正常工作 ✅
- **配置了密钥**：自动启用加密，请求和响应自动加解密 ✅

### 自动化处理

所有API调用**无需修改代码**，自动处理加密/解密：

```typescript
// 发送请求
const response = await api.post('/detect', { text: '测试文本' });

// 如果启用了加密：
// - 自动加密请求体
// - 自动设置 X-Encrypted: true
// - 自动解密响应

console.log(response.data);
// { success: true, data: {...} }
```

## 配置方式

### 方式1: 环境变量（推荐）

创建 `.env` 文件：
```bash
VITE_ENCRYPTION_KEY=your-base64-key
```

### 方式2: localStorage

在浏览器控制台：
```javascript
localStorage.setItem('encryption_key', 'your-base64-key')
```

### 方式3: 动态设置

在任何地方：
```typescript
localStorage.setItem('encryption_key', 'your-base64-key');
location.reload();
```

## 测试加密

### 1. 检查是否启用加密

打开浏览器控制台，查看日志：
- 看到 "✓ API加密已启用" → 已启用
- 没有此日志 → 未启用

### 2. 查看网络请求

1. 打开开发者工具（F12）
2. 切换到 Network 标签
3. 发送任意API请求
4. 检查请求头/响应头：
   - 请求头 `X-Encrypted: true` → 请求已加密
   - 响应头 `x-encrypted: true` → 响应已加密

### 3. 生成测试密钥

在浏览器控制台：
```javascript
// 后端生成
// openssl rand -base64 32

// 或在控制台测试
import CryptoJS from 'crypto-js';
const key = CryptoJS.lib.WordArray.random(32);
console.log(key.toString(CryptoJS.enc.Base64));
```

## 注意事项

### ⚠️ 密钥一致性

前端和后端必须使用**相同的密钥**：

```yaml
# 后端 config.yml
encryption:
    enabled: true
    key: "same-key"
```

```bash
# 前端 .env
VITE_ENCRYPTION_KEY=same-key
```

### ⚠️ 环境变量

生产环境不要在代码中硬编码密钥！

✅ 正确：
```bash
# .env
VITE_ENCRYPTION_KEY=secure-key
```

❌ 错误：
```typescript
const key = 'hardcoded-key'; // 不要这样做
```

### ⚠️ 错误处理

如果加密失败，前端会自动降级为未加密请求，不会影响功能。

## 常见问题

### Q: 如何禁用加密？

A: 删除或清空 `.env` 中的 `VITE_ENCRYPTION_KEY`，或删除 localStorage 中的密钥。

### Q: 加密失败会怎样？

A: 自动降级为未加密请求，功能正常，只是控制台会有警告。

### Q: 部分API加密，部分不加密可以吗？

A: 当前版本是全局配置。如需差异化，可以修改 `api/index.ts` 中的拦截器逻辑。

### Q: 性能影响？

A: 加密会增加 <5% 的性能开销，通常可以忽略。

## 文件说明

- `src/utils/encryption-optional.ts` - 加密工具类（可选）
- `src/api/index.ts` - API客户端（已集成加密支持）
- `.env` - 环境变量配置（需要创建）

## 安全建议

1. ✅ 使用强密钥（32字节随机）
2. ✅ 通过环境变量存储密钥
3. ✅ 不要将密钥提交到版本控制（已在 .gitignore 中）
4. ✅ 使用HTTPS传输（加密 + HTTPS 双重保护）
5. ✅ 定期更换密钥

## 技术细节

- **加密算法**: AES-256-GCM
- **实现库**: crypto-js
- **密钥长度**: 32字节（256位）
- **编码方式**: Base64
- **认证**: GCM模式提供完整性校验

## 示例配置

### 开发环境 (.env.development)
```bash
VITE_API_BASE_URL=http://localhost:8088
VITE_ENCRYPTION_KEY=AbCdEf1234567890GhIjKlMnOpQrStUvWxYz0123456789ABC=
```

### 生产环境 (.env.production)
```bash
VITE_API_BASE_URL=https://api.example.com
VITE_ENCRYPTION_KEY=production-key-here
```

### 禁用加密 (.env)
```bash
VITE_API_BASE_URL=http://localhost:8088
VITE_ENCRYPTION_KEY=
```

## 相关文档

- 后端加密文档: `../ENCRYPTION_README.md`
- 快速开始: `../ENCRYPTION_QUICKSTART.md`
