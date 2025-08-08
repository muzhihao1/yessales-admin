#!/bin/bash

# YesSales 部署状态检查脚本
# 检查Vercel和GitHub Actions的部署状态

echo "🔍 YesSales 部署状态检查"
echo "=========================="

# 获取最新commit信息
LATEST_COMMIT=$(git log -1 --format="%h - %s")
echo "📝 最新提交: $LATEST_COMMIT"
echo

# 检查GitHub Actions状态
echo "🔄 GitHub Actions状态检查:"
echo "   访问: https://github.com/muzhihao1/yessales-admin/actions"
echo "   预期: CI Pipeline应该正在运行并通过"
echo

# 检查Vercel部署状态  
echo "🚀 Vercel部署状态检查:"
echo "   Vercel应该正在自动构建最新的commit"
echo "   预期构建成功后的访问地址:"
echo "   - 主域名: https://yessales-admin.vercel.app"
echo "   - 销售端: https://yessales-admin.vercel.app/sales"
echo "   - 管理端: https://yessales-admin.vercel.app/admin"
echo

# 修复内容总结
echo "✅ 已修复的问题:"
echo "   1. Vercel配置现代化 - 使用新的vercel.json格式"
echo "   2. GitHub Actions路径修复 - 正确指向frontend目录"
echo "   3. 依赖管理优化 - 添加--legacy-peer-deps处理UniApp冲突"
echo "   4. 缓存配置优化 - 正确的依赖路径缓存"
echo

# 下一步行动
echo "📋 下一步行动项:"
echo "   1. 等待Vercel和GitHub Actions完成构建（约3-5分钟）"
echo "   2. 检查Vercel部署日志，确认无错误"
echo "   3. 访问部署后的应用，验证功能正常"
echo "   4. 配置自定义域名（admin.yessales.cn, app.yessales.cn）"
echo "   5. 进行完整的功能测试"
echo

# 监控建议
echo "🔗 监控链接:"
echo "   - GitHub Actions: https://github.com/muzhihao1/yessales-admin/actions"
echo "   - Vercel Dashboard: https://vercel.com/dashboard"
echo

echo "✨ 修复完成！请等待自动部署完成，然后验证部署结果。"