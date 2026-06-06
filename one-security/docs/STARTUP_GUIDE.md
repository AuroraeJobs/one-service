# Aurorae SSO + MongoDB 启动指南

## 🚀 启动步骤

### 1. 确保服务正在运行

```bash
# 启动MongoDB
brew services start mongodb-community

# 启动Redis
brew services start redis

# 验证服务状态
brew services list
```

### 2. 初始化MongoDB数据

```bash
# 进入项目目录
cd /Users/aurorae/Program/Hello/aurorae-service

# 初始化测试数据
mongo test < aurorae-sso/docs/init-mongodb.js
```

### 3. 启动后端服务

```bash
# 编译项目
cd aurorae-sso
mvn clean install

# 启动应用（通过aurorae-starter）
cd ../aurorae-starter
mvn spring-boot:run
```

服务将在 http://localhost:8888 启动

### 4. 启动前端

```bash
cd aurorae-frontend-pro
npm install
npm run dev
```

前端将在 http://localhost:5173 启动

## 📝 关键配置

### MongoDB配置
- **数据库名**: `test`
- **连接地址**: `mongodb://localhost:27017/test`
- **配置位置**: [aurorae-starter/src/main/resources/application.yml](aurorae-starter/src/main/resources/application.yml)

### Redis配置
- **地址**: `localhost:6379`
- **数据库**: `0`
- **Session命名空间**: `aurorae:session`
- **Session超时**: `7200s` (2小时)

## 🧪 测试登录API

### 使用curl测试

```bash
# 1. 注册新用户
curl -X POST http://localhost:8888/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"test123"}'

# 2. 登录
curl -X POST http://localhost:8888/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"username":"admin","password":"admin123"}'

# 3. 获取当前用户
curl http://localhost:8888/auth/me \
  -b cookies.txt

# 4. 登出
curl -X POST http://localhost:8888/auth/logout \
  -b cookies.txt
```

### 默认账号

| 用户名 | 密码 | 角色 |
|--------|------|------|
| admin | admin123 | ADMIN |
| testuser | test123 | USER |

## 🔍 排查登录401错误

### 1. 检查MongoDB连接

```bash
# 连接MongoDB
mongo test

# 查看所有用户
db.users.find({}, {password: 0}).pretty()
```

### 2. 检查Redis连接

```bash
redis-cli
ping
# 应该返回 PONG
```

### 3. 查看应用日志

启动时应该看到：
```
Started SsoServiceApplication in X seconds
Starting user data initialization...
Created default admin user: admin
Created default test user: testuser
User data initialization completed!
```

### 4. 测试认证流程

登录时应该看到：
```
Login request: admin
Loading user by username: admin
User found: admin, enabled: true
Login successful: admin
```

## 📁 项目结构

```
aurorae-service/
├── aurorae-starter/                 # 启动入口
│   └── src/main/java/
│       └── com/aurorae/
│           └── ApplicationStarter.java
│   └── src/main/resources/
│       └── application.yml         # 主配置
│
├── aurorae-sso/                    # SSO模块
│   ├── aurorae-sso-service/        # 服务层
│   │   └── src/main/java/org/aurorae/sso/
│   │       ├── config/
│   │       │   └── SecurityConfig.java
│   │       ├── controller/
│   │       │   └── AuthController.java
│   │       └── service/impl/
│   │           ├── CustomUserDetailsService.java
│   │           └── DataInitializationService.java
│   │
│   ├── aurorae-sso-repository/     # Repository层
│   │   └── src/main/java/org/aurorae/sso/repository/
│   │       └── UserRepository.java
│   │
│   ├── aurorae-sso-model/          # 模型层
│   │   └── src/main/java/org/aurorae/sso/model/
│   │       └── User.java
│   │
│   └── docs/
│       ├── init-mongodb.js         # MongoDB初始化脚本
│       └── TROUBLESHOOTING.md      # 排查指南
│
└── aurorae-frontend-pro/          # 前端
    └── src/
        ├── components/
        │   ├── Login.tsx
        │   └── Register.tsx
        └── contexts/
            └── AuthContext.tsx
```

## ⚠️ 注意事项

1. **端口**: 后端默认8888，不是8080
2. **数据库**: MongoDB数据库名是 `test`
3. **配置**: 所有配置在 `aurorae-starter/application.yml`
4. **启动**: 必须通过 `aurorae-starter` 启动

## 🆘 常见问题

### 问题1: 连接MongoDB失败
```bash
# 检查MongoDB是否运行
brew services list | grep mongodb

# 如果没运行，启动它
brew services start mongodb-community
```

### 问题2: 连接Redis失败
```bash
# 检查Redis是否运行
brew services list | grep redis

# 如果没运行，启动它
brew services start redis
```

### 问题3: 用户不存在
```bash
# 重启应用，会自动创建默认用户
cd aurorae-starter
mvn spring-boot:run
```

### 问题4: 401错误
1. 检查MongoDB中是否有用户
2. 检查用户密码是否正确
3. 查看后端日志
4. 参考 [TROUBLESHOOTING.md](aurorae-sso/docs/TROUBLESHOOTING.md)

## 📞 获取帮助

如果还是有问题，请提供：
1. 后端启动日志
2. MongoDB查询结果：`db.users.find({}, {password: 0}).pretty()`
3. curl测试结果
