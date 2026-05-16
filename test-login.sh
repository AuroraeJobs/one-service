#!/bin/bash

# Aurorae SSO 快速测试脚本

echo "================================"
echo "Aurorae SSO 登录测试"
echo "================================"

BASE_URL="http://localhost:8888"

# 1. 测试登录
echo ""
echo "1. 测试登录 admin/admin123..."
echo ""

RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}')

echo "响应:"
echo "$RESPONSE" | jq .

# 检查是否成功
if echo "$RESPONSE" | jq -e '.code == 200' > /dev/null 2>&1; then
    echo ""
    echo "✓ 登录成功！"
    echo ""
    echo "用户信息:"
    echo "$RESPONSE" | jq '.data'
else
    echo ""
    echo "✗ 登录失败！"
    echo "错误信息:"
    echo "$RESPONSE" | jq '.message'
    echo ""
    echo "请检查:"
    echo "  1. MongoDB是否运行: brew services list"
    echo "  2. MongoDB中是否有用户: mongo test --eval 'db.users.find({}, {password: 0}).pretty()'"
    echo "  3. 后端服务是否运行: 检查8888端口"
fi

echo ""
echo "================================"
