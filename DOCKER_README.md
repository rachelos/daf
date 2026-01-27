# DAF Docker 部署指南

## 快速开始

### 使用 Docker Compose（推荐）

```bash
# 构建并启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

### 使用 Docker 命令

```bash
# 构建镜像
docker build -t daf-sensitive-detection .

# 运行容器
docker run -d \
  --name daf \
  -p 8088:8088 \
  -v $(pwd)/config.yml:/app/config.yml:ro \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/data/logs:/app/data/logs \
  --restart unless-stopped \
  daf-sensitive-detection
```

## 配置说明

### 端口映射

- **8088**: 应用主端口（可在 config.yml 中修改）

### 数据卷

- **config.yml**: 主配置文件（只读挂载）
- **data**: 包含词库文件和用户数据库
- **data/logs**: 日志文件目录

### 环境变量

你可以在 docker-compose.yml 或 docker run 命令中添加环境变量来覆盖配置：

```yaml
environment:
  - SERVER_PORT=8088
  - SERVER_JWT_SECRET=your-secret-key
  - DB_TYPE=sqlite
```

## 生产环境部署建议

### 1. 修改默认配置

```bash
# 复制环境变量示例
cp .env.example .env

# 编辑 .env 文件，设置安全的 JWT 密钥和数据库配置
```

### 2. 使用外部数据库（推荐）

SQLite 适用于开发环境，生产环境建议使用 MySQL 或 PostgreSQL：

```yaml
# 在 config.yml 中配置
user_db:
  type: "mysql"  # 或 "postgres"
  mysql:
    host: "your-db-host"
    port: 3306
    database: "sensitive_words"
    username: "your_username"
    password: "your_secure_password"
```

### 3. 使用 Docker Secrets（Swarm 模式）

```bash
echo "your-secret-key" | docker secret create jwt_secret -
```

在 docker-compose.yml 中使用：

```yaml
secrets:
  - jwt_secret

secrets:
  jwt_secret:
    external: true
```

### 4. 备份数据

定期备份 `data` 目录：

```bash
# 创建备份
tar -czf daf-backup-$(date +%Y%m%d).tar.gz data/

# 恢复备份
tar -xzf daf-backup-20250123.tar.gz
```

## 健康检查

容器包含健康检查配置，会自动检测服务状态：

```bash
# 查看健康状态
docker ps

# 手动检查
docker exec daf wget --spider http://localhost:8088/health
```

## 日志查看

```bash
# 实时查看日志
docker logs -f daf

# 查看最近 100 行日志
docker logs --tail 100 daf

# 查看日志文件（从挂载的卷）
tail -f data/logs/app.log
```

## 更新服务

```bash
# 拉取最新代码
git pull origin main

# 重新构建并启动
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# 清理旧镜像
docker image prune -f
```

## 性能调优

### 调整容器资源限制

在 docker-compose.yml 中添加：

```yaml
deploy:
  resources:
    limits:
      cpus: '2'
      memory: 2G
    reservations:
      cpus: '0.5'
      memory: 512M
```

### 调整数据库连接池

在 config.yml 中：

```yaml
user_db:
  max_open_conns: 50      # 根据并发量调整
  max_idle_conns: 10
  max_lifetime: 300
```

## 故障排查

### 容器无法启动

```bash
# 查看详细错误
docker logs daf

# 进入容器检查
docker exec -it daf sh

# 检查配置文件
docker exec daf cat config.yml
```

### 端口冲突

如果 8088 端口被占用，修改 docker-compose.yml：

```yaml
ports:
  - "8089:8088"  # 宿主机端口:容器端口
```

### 权限问题

如果遇到文件权限问题：

```bash
# 修正数据目录权限
sudo chown -R 1000:1000 data/
```

## 安全建议

1. **修改默认 JWT 密钥**: 务必在 config.yml 中修改 `jwt_secret`
2. **使用 HTTPS**: 在生产环境使用反向代理（Nginx/Caddy）配置 SSL
3. **限制访问**: 使用防火墙限制对 8088 端口的访问
4. **定期更新**: 及时更新镜像以获取安全补丁

## 使用外部反向代理

### Nginx 配置示例

```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:8088;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Caddy 配置示例

```caddyfile
your-domain.com {
    reverse_proxy localhost:8088
}
```

## 多实例部署

使用 Docker Compose 部署多个实例：

```yaml
version: '3.8'

services:
  daf-1:
    build: .
    ports:
      - "8088:8088"
    volumes:
      - ./config.yml:/app/config.yml:ro
      - ./data:/app/data
    environment:
      - SERVER_PORT=8088

  daf-2:
    build: .
    ports:
      - "8089:8088"
    volumes:
      - ./config.yml:/app/config.yml:ro
      - ./data:/app/data
    environment:
      - SERVER_PORT=8088
```

## 监控

### 查看容器资源使用

```bash
docker stats daf
```

### 集成监控工具

可以集成 Prometheus、Grafana 等监控工具，暴露 `/metrics` 端点。
