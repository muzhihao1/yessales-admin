#!/bin/bash

# Vercel 部署专用构建脚本
# 解决 UniApp 在 Vercel 环境下的构建问题

set -e

echo "🚀 开始 YesSales UniApp 构建..."

# 设置环境变量
export NODE_ENV=production
export UNI_PLATFORM=h5

# 清理可能的缓存问题
echo "🧹 清理缓存..."
rm -rf node_modules/.vite
rm -rf dist

# 安装依赖，处理 peer dependency 冲突
echo "📦 安装依赖..."
npm ci --legacy-peer-deps --prefer-offline

# 验证关键依赖是否正确安装
if [ ! -d "node_modules/@vitejs/plugin-vue" ]; then
    echo "❌ 关键依赖 @vitejs/plugin-vue 缺失，尝试单独安装..."
    npm install @vitejs/plugin-vue --legacy-peer-deps
fi

if [ ! -d "node_modules/@vue/tsconfig" ]; then
    echo "⚠️ @vue/tsconfig 缺失，但构建将继续..."
fi

# 执行构建
echo "🔨 开始构建..."
npm run build:h5

# 验证构建结果
if [ ! -d "dist" ]; then
    echo "❌ 构建失败：dist 目录不存在"
    exit 1
fi

if [ ! -f "dist/index.html" ]; then
    echo "❌ 构建失败：index.html 不存在"
    exit 1
fi

echo "✅ 构建成功完成！"
ls -la dist/

exit 0