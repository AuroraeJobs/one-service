// 初始化MongoDB test数据库数据

// 使用test数据库
use test;

// 删除已有数据
db.users.deleteMany({});

// 插入管理员用户（密码: admin123，BCrypt加密）
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

// 插入测试用户（密码: test123，BCrypt加密）
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

// 创建唯一索引
db.users.createIndex({ username: 1 }, { unique: true });
db.users.createIndex({ email: 1 }, { unique: true, sparse: true });
db.users.createIndex({ phone: 1 }, { unique: true, sparse: true });

// 查询所有用户
print("===== 用户列表 =====");
db.users.find({}, {password: 0}).pretty();

print("\n初始化完成！");
print("默认账号：");
print("  admin / admin123");
print("  testuser / test123");
