# One Security Service - Spring Security + Spring Session + MongoDB

## 📋 功能特性

- ✅ Spring Security 用户认证
- ✅ Spring Session + Redis 会话管理
- ✅ BCrypt 密码加密
- ✅ MongoDB 数据存储
- ✅ RESTful API 接口
- ✅ 用户注册和登录
- ✅ 获取当前用户信息
- ✅ 用户登出
- ✅ 自动初始化默认用户

## 🏗️ 技术栈

- **Spring Boot 2.6.x**
- **Spring Security 5.x**
- **Spring Session + Redis**
- **Spring Data MongoDB**
- **MongoDB 4.x+**

## 📦 项目结构

```
one-security/
├── one-security-service/
│   ├── src/main/java/com/one/security/
│   │   ├── config/
│   │   │   └── SecurityConfig.java          # Spring Security配置
│   │   ├── controller/
│   │   │   └── AuthController.java           # 认证控制器
│   │   ├── dto/
│   │   │   ├── LoginRequest.java             # 登录请求
│   │   │   ├── RegisterRequest.java           # 注册请求
│   │   │   ├── Response.java                  # 统一响应
│   │   │   └── UserInfo.java                  # 用户信息
│   │   ├── exception/
│   │   │   └── GlobalExceptionHandler.java    # 全局异常处理
│   │   ├── model/
│   │   │   └── SysUser.java                  # 用户实体
│   │   └── service/impl/
│   │       ├── CustomUserDetailsService.java  # 自定义UserDetailsService
│   │       └── DataInitializationService.java # 数据初始化服务
│   └── src/main/resources/
│       └── application.yml                   # 应用配置
├── one-security-repository/
│   └── src/main/java/com/one/security/repository/
│       └── UserRepository.java               # MongoDB Repository
├── one-security-model/
│   └── src/main/java/com/one/security/model/
│       └── User.java                        # 用户实体类
└── docs/
    └── init-mongodb.js                       # MongoDB初始化脚本
```

## 🚀 快速开始

### 1. 环境要求

- JDK 8+
- MongoDB 4.x+
- Redis 6+

### 2. 启动MongoDB

确保MongoDB服务正在运行：

```bash
# 启动MongoDB（macOS）
brew services start mongodb-community

# 或者直接启动
mongod --dbpath /usr/local/var/mongodb
```

### 3. 初始化数据

数据初始化会在应用启动时自动完成，也可以手动执行脚本：

```bash
mongo < one-security/docs/init-mongodb.js
```

### 4. 修改配置文件

编辑 `one-security-service/src/main/resources/application.yml`:

```yaml
spring:
  data:
    mongodb:
      uri: mongodb://localhost:27017/test
      auto-index-creation: true
  
  redis:
    host: localhost
    port: 6379
```

### 5. 启动服务

```bash
cd one-security/one-security-service
mvn spring-boot:run
```

服务将运行在 http://localhost:8080

## 📡 API 接口

### 1. 用户注册

**POST** `/auth/register`

Request:
```json
{
  "username": "newuser",
  "password": "password123",
  "email": "user@example.com",
  "phone": "13800138000"
}
```

Response:
```json
{
  "code": 200,
  "message": "注册成功",
  "data": null
}
```

### 2. 用户登录

**POST** `/auth/login`

Request:
```json
{
  "username": "admin",
  "password": "admin123"
}
```

Response:
```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "id": "5f8e1b9d9e3d4e1f2a3b4c5d",
    "username": "admin",
    "email": "admin@aurorae.com",
    "phone": "13800138000",
    "role": "ADMIN"
  }
}
```

### 3. 获取当前用户信息

**GET** `/auth/me`

Headers:
```
Cookie: SESSION=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

Response:
```json
{
  "code": 200,
  "message": "操作成功",
  "data": {
    "id": "5f8e1b9d9e3d4e1f2a3b4c5d",
    "username": "admin",
    "email": "admin@aurorae.com",
    "phone": "13800138000",
    "role": "ADMIN"
  }
}
```

### 4. 用户登出

**POST** `/auth/logout`

Headers:
```
Cookie: SESSION=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

Response:
```json
{
  "code": 200,
  "message": "退出成功",
  "data": null
}
```

## 🔐 默认账号

应用启动时会自动创建以下账号：

| 用户名 | 密码 | 角色 |
|--------|------|------|
| admin | admin123 | ADMIN |
| testuser | test123 | USER |

**⚠️ 注意：** 生产环境请务必修改默认密码！

## 🧪 测试

### 使用 curl 测试

```bash
# 1. 注册新用户
curl -X POST http://localhost:8080/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser2","password":"test123456"}'

# 2. 登录
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"username":"admin","password":"admin123"}'

# 3. 获取当前用户（使用保存的session）
curl http://localhost:8080/auth/me \
  -b cookies.txt

# 4. 登出
curl -X POST http://localhost:8080/auth/logout \
  -b cookies.txt
```

### MongoDB 查询

```bash
# 连接MongoDB
mongo

# 使用数据库
use aurorae_sso

# 查询所有用户
db.users.find().pretty()

# 按用户名查询
db.users.findOne({ username: "admin" })
```

## 🔧 配置说明

### MongoDB 配置

```yaml
spring:
  data:
    mongodb:
      uri: mongodb://localhost:27017/aurorae_sso
      auto-index-creation: true
```

### Redis Session 配置

```yaml
spring:
  session:
    store-type: redis
    redis:
      namespace: aurorae:session
    timeout: 7200s  # Session过期时间：2小时
```

### Security 配置

- `/auth/**` - 公开接口，无需认证
- `/api/auth/**` - 公开接口，无需认证
- 其他请求需要认证

### CORS 配置

默认允许以下Origins：
- `http://localhost:5173` (Vite开发服务器)
- `http://localhost:3000` (React开发服务器)

## 🛡️ 安全说明

1. **密码加密**：使用BCrypt算法加密存储
2. **Session管理**：使用Redis存储，支持分布式
3. **CSRF防护**：已禁用（REST API使用Cookie认证）
4. **CORS配置**：只允许特定Origins
5. **唯一索引**：username, email, phone字段已建立唯一索引

## 📝 MongoDB 数据模型

```javascript
{
  _id: ObjectId,
  username: String,  // 唯一
  email: String,     // 唯一，可选
  phone: String,     // 唯一，可选
  password: String,  // BCrypt加密
  role: String,      // ADMIN / USER
  enabled: Boolean,
  deleted: Boolean,
  createTime: Date,
  updateTime: Date
}
```

## 🔗 相关文档

- [Spring Security Documentation](https://spring.io/projects/spring-security)
- [Spring Session Documentation](https://spring.io/projects/spring-session)
- [Spring Data MongoDB Documentation](https://spring.io/projects/spring-data-mongodb)

## 📧 联系方式

如有问题，请联系：aurorae_jobs@hotmail.com
