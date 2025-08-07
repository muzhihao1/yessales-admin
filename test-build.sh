#!/bin/bash

# 本地构建测试脚本
# 模拟 Vercel 环境测试构建流程

echo "🧪 开始本地构建测试..."

cd frontend

# 清理环境
echo "🧹 清理构建环境..."
rm -rf node_modules dist

# 模拟 Vercel 安装过程
echo "📦 模拟 Vercel 依赖安装..."
npm ci --legacy-peer-deps

# 执行构建脚本
echo "🔨 执行构建脚本..."
./build-vercel.sh

# 验证结果
if [ -d "dist" ] && [ -f "dist/index.html" ]; then
    echo "✅ 本地构建测试成功！"
    echo "📊 构建结果："
    ls -la dist/
    du -sh dist/
else
    echo "❌ 本地构建测试失败"
    exit 1
fi

echo "🎉 准备提交到远程仓库进行 Vercel 部署测试"