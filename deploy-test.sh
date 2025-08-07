#!/bin/bash

# YesSales 部署测试脚本
# 验证多入口部署配置

echo "🧪 开始YesSales多入口部署测试..."

cd frontend

# 清理构建环境
echo "🧹 清理环境..."
rm -rf dist node_modules/.vite

# 安装依赖
echo "📦 安装依赖..."
npm ci --legacy-peer-deps

# 执行构建
echo "🔨 执行构建..."
./build-vercel.sh

# 验证构建产物
if [ ! -d "dist" ]; then
    echo "❌ 构建失败：dist目录不存在"
    exit 1
fi

echo "✅ 构建成功！产物验证："
echo "📁 构建目录大小："
du -sh dist/

echo "📄 关键文件检查："
ls -la dist/ | head -10

echo "🔍 验证HTML入口文件："
if [ -f "dist/index.html" ]; then
    echo "✅ index.html 存在"
    echo "📝 HTML文件大小: $(wc -c < dist/index.html) bytes"
else
    echo "❌ index.html 不存在"
    exit 1
fi

echo "🌐 验证静态资源："
ASSETS_COUNT=$(find dist/assets -name "*.js" -o -name "*.css" | wc -l)
echo "📊 静态资源文件数量: $ASSETS_COUNT"

if [ $ASSETS_COUNT -gt 0 ]; then
    echo "✅ 静态资源生成成功"
else
    echo "⚠️ 静态资源较少，请检查构建配置"
fi

echo ""
echo "🎉 构建测试完成！"
echo ""
echo "📋 部署信息："
echo "   - 应用类型: 单体多入口应用"
echo "   - 支持路由: /sales/* 和 /admin/*"
echo "   - 域名策略: admin.yessales.cn -> 管理端"
echo "              app.yessales.cn -> 销售端"
echo ""
echo "🚀 准备推送到Git触发Vercel部署"
echo "   git add . && git commit -m \"feat: 实现多入口域名路由部署\" && git push"