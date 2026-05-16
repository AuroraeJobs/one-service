#!/bin/bash

# Aurorae SSO 快速启动脚本

echo "================================"
echo "Aurorae SSO 启动脚本"
echo "================================"

# 1. 检查MongoDB
echo ""
echo "1. 检查MongoDB..."
if brew services list | grep -q "mongodb-community.*started"; then
    echo "✓ MongoDB正在运行"
else
    echo "✗ MongoDB未运行，正在启动..."
    brew services start mongodb-community
    sleep 2
fi

# 2. 检查Redis
echo ""
echo "2. 检查Redis..."
if brew services list | grep -q "redis.*started"; then
    echo "✓ Redis正在运行"
else
    echo "✗ Redis未运行，正在启动..."
    brew services start redis
    sleep 2
fi

# 3. 初始化MongoDB数据
echo ""
echo "3. 初始化MongoDB数据..."
mongo test < aurorae-sso/docs/init-mongodb.js

# 4. 启动后端
echo ""
echo "4. 启动后端服务..."
echo "后端将在 http://localhost:8888 启动"
echo "按 Ctrl+C 停止服务"
echo ""

cd aurorae-starter
mvn spring-boot:run
