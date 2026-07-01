# 登录401错误排查指南

## 🔍 常见原因

### 1. **Spring Security未正确配置AuthenticationProvider** ❌ (已修复)
- **问题**: AuthenticationManager没有使用自定义的UserDetailsService
- **解决**: 在SecurityConfig中显式配置DaoAuthenticationProvider

### 2. **MongoDB中没有用户数据** ❌
- **问题**: 数据库中没有用户，或者用户密码未正确加密
- **解决**: 运行初始化脚本或重启应用自动初始化

### 3. **密码加密不匹配** ❌
- **问题**: 数据库中的密码与输入的密码不匹配
- **解决**: 确保使用BCrypt加密

### 4. **用户enabled字段为false** ❌
- **问题**: 用户被禁用
- **解决**: 检查并更新用户的enabled字段为true

## 🚀 解决步骤

### 步骤1: 初始化MongoDB数据

```bash
# 启动MongoDB
brew services start mongodb-community

# 运行测试脚本
mongo aurorae_sso < one-security/docs/test-login.js
```

### 步骤2: 验证用户数据

```bash
# 连接MongoDB
mongo

# 使用数据库
use aurorae_sso

# 查看所有用户（不显示密码）
db.users.find({}, {password: 0}).pretty()
```

应该看到：
```json
{
    "_id": ObjectId("..."),
    "username": "admin",
    "email": "admin@aurorae.com",
    "phone": "13800138000",
    "role": "ADMIN",
    "enabled": true,
    "deleted": false,
    "createTime": ISODate("..."),
    "updateTime": ISODate("...")
}
```

### 步骤3: 重启后端服务

```bash
cd one-security/one-security-service
mvn spring-boot:run
```

### 步骤4: 测试登录API

使用curl测试：

```bash
# 测试登录
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"username":"admin","password":"admin123"}'

# 应该返回：
# {"code":200,"message":"登录成功","data":{"id":"...","username":"admin",...}}
```

## 🔧 详细排查

### 检查1: MongoDB连接

查看应用日志，确认MongoDB连接成功：
```
Started SsoServiceApplication in X seconds
```

### 检查2: 用户数据初始化

查看日志，应该看到：
```
Starting user data initialization...
Created default admin user: admin
Created default test user: testuser
User data initialization completed!
```

### 检查3: 登录认证过程

查看日志，应该看到：
```
Login request: admin
Loading user by username: admin
User found: admin, enabled: true
Login successful: admin
```

### 检查4: 错误日志

如果还是401，查看具体错误：
```
Login failed: Bad credentials
```

## 📝 快速修复

### 方法1: 删除并重新创建用户

```bash
mongo aurorae_sso

# 删除所有用户
db.users.deleteMany({})

# 退出
exit

# 重启应用，会自动创建
mvn spring-boot:run
```

### 方法2: 手动创建用户

```bash
mongo aurorae_sso

# 手动插入admin用户
db.users.insertOne({
    username: "admin",
    password: "$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi",
    email: "admin@aurorae.com",
    phone: "13800138000",
    role: "ADMIN",
    enabled: true,
    deleted: false,
    createTime: new Date(),
    updateTime: new Date()
});

# 验证
db.users.find().pretty()
```

## ✅ 验证清单

- [ ] MongoDB服务正在运行
- [ ] 数据库`aurorae_sso`存在
- [ ] `users`集合存在且有数据
- [ ] admin用户的enabled字段为true
- [ ] admin用户的密码是BCrypt加密的
- [ ] 后端服务正在运行（端口8080）
- [ ] Spring Security配置正确（DaoAuthenticationProvider）

## 🆘 如果还是不行

1. **检查端口占用**:
   ```bash
   lsof -i :8080
   ```

2. **清理Redis缓存**:
   ```bash
   redis-cli
   FLUSHALL
   ```

3. **清理浏览器Cookie**:
   - 打开开发者工具
   - 删除所有localhost的Cookie

4. **重启所有服务**:
   ```bash
   # 停止所有服务
   # 启动MongoDB
   brew services restart mongodb-community
   # 启动Redis
   brew services restart redis
   # 启动后端
   mvn spring-boot:run
   ```

5. **查看完整日志**:
   ```bash
   mvn spring-boot:run 2>&1 | grep -A 5 -B 5 "ERROR\|Exception\|Login"
   ```

## 📞 获取帮助

如果以上方法都不能解决，请提供：
1. 后端启动日志（最后50行）
2. 登录请求的curl命令
3. MongoDB中的用户数据（不包含密码）
4. 完整的错误信息
