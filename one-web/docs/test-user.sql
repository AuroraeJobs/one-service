-- 创建测试用户数据
-- 注意：在实际使用前，请先在数据库中执行此脚本

-- 插入测试租户
INSERT INTO `sys_tenant` (`id`, `name`, `code`, `enable`, `create_time`, `update_time`) 
VALUES (1, 'aurorae', 'aurorae', 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `enable` = 1;

-- 插入测试用户 (密码: aurorae123)
-- 密码是 MD5("aurorae123" + salt)，salt是随机生成的
-- 默认密码是 "jobs"，但这里我们需要先添加用户再获取salt

-- 用户名：admin
-- 密码：aurorae123
-- 确保用户名以字母开头，长度3-16位
