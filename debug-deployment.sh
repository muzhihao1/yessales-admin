#!/bin/bash

# YesSales 部署调试脚本
# 用于诊断 Vercel 和 GitHub Actions 构建问题

echo "🔍 YesSales 部署调试报告"
echo "=========================="
echo "时间: $(date)"
echo

echo "📂 Git 仓库结构检查:"
echo "Git根目录: $(git rev-parse --show-toplevel)"
echo "当前分支: $(git branch --show-current)"
echo "最新提交: $(git log -1 --format='%h - %s')"
echo

echo "📁 根目录文件结构:"
ls -la $(git rev-parse --show-toplevel) | head -20
echo

echo "📁 Frontend目录检查:"
if [ -d "$(git rev-parse --show-toplevel)/frontend" ]; then
    echo "✅ frontend目录存在"
    echo "Frontend目录内容:"
    ls -la $(git rev-parse --show-toplevel)/frontend | head -15
    echo
    
    echo "📦 package.json存在性:"
    if [ -f "$(git rev-parse --show-toplevel)/frontend/package.json" ]; then
        echo "✅ frontend/package.json 存在"
        echo "Node.js构建脚本:"
        grep -A3 -B3 '"build":\|"build:h5":' $(git rev-parse --show-toplevel)/frontend/package.json
    else
        echo "❌ frontend/package.json 不存在"
    fi
    echo
    
    echo "🔧 依赖检查:"
    if [ -f "$(git rev-parse --show-toplevel)/frontend/package-lock.json" ]; then
        echo "✅ package-lock.json 存在"
    else
        echo "❌ package-lock.json 不存在"
    fi
else
    echo "❌ frontend目录不存在"
fi
echo

echo "⚙️  Vercel 配置检查:"
if [ -f "$(git rev-parse --show-toplevel)/vercel.json" ]; then
    echo "✅ vercel.json 存在"
    echo "当前配置:"
    cat $(git rev-parse --show-toplevel)/vercel.json
else
    echo "❌ vercel.json 不存在"
fi
echo

echo "🔄 GitHub Actions 配置检查:"
if [ -f "$(git rev-parse --show-toplevel)/.github/workflows/ci.yml" ]; then
    echo "✅ GitHub Actions CI 配置存在"
    echo "工作目录设置:"
    grep -A2 -B2 "working-directory" $(git rev-parse --show-toplevel)/.github/workflows/ci.yml
else
    echo "❌ GitHub Actions 配置不存在"
fi
echo

echo "🌐 当前部署状态:"
echo "检查主页面:"
curl -s -I https://yessales-admin.vercel.app/ | head -3
echo
echo "检查资源文件:"
curl -s -I https://yessales-admin.vercel.app/assets/index-C_Px2wwp.js | head -3
echo

echo "💡 推荐的故障排除步骤:"
echo "1. 检查 Vercel Dashboard 中的项目根目录设置"
echo "2. 尝试在 Vercel 中手动触发重新部署"  
echo "3. 清除 Vercel 构建缓存并重新部署"
echo "4. 验证 GitHub 仓库中的文件结构是否正确"
echo
echo "🔗 快速链接:"
echo "- GitHub仓库: https://github.com/muzhihao1/yessales-admin"
echo "- GitHub Actions: https://github.com/muzhihao1/yessales-admin/actions"
echo "- Vercel Dashboard: https://vercel.com/dashboard"
echo "- 部署URL: https://yessales-admin.vercel.app"

echo
echo "📊 调试完成 $(date)"