// 测试脚本 - 验证MongoDB连接和登录功能

// 1. 连接数据库
use aurorae_sso;

// 2. 查看所有用户
print("===== 所有用户 =====");
db.users.find().pretty();

// 3. 检查admin用户
print("\n===== 检查admin用户 =====");
var admin = db.users.findOne({username: "admin"});
if (admin) {
    print("Admin用户存在:");
    printjson(admin);
} else {
    print("Admin用户不存在，需要创建");
}

// 4. 创建admin用户（如果不存在）
if (!admin) {
    print("\n===== 创建admin用户 =====");
    db.users.createIndex({username: 1}, {unique: true});
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
    print("Admin用户创建成功");
}

// 5. 创建testuser（如果不存在）
var testuser = db.users.findOne({username: "testuser"});
if (!testuser) {
    print("\n===== 创建testuser =====");
    db.users.insertOne({
        username: "testuser",
        password: "$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW",
        email: "test@aurorae.com",
        phone: "13900139000",
        role: "USER",
        enabled: true,
        deleted: false,
        createTime: new Date(),
        updateTime: new Date()
    });
    print("Testuser创建成功");
}

// 6. 最终检查
print("\n===== 最终用户列表 =====");
db.users.find({}, {password: 0}).pretty();

print("\n===== 测试完成 =====");
print("密码说明:");
print("admin123的BCrypt加密结果: $2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi");
print("test123的BCrypt加密结果: $2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW");
