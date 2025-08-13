#!/bin/bash

# YesSales 部署监控脚本
# 监控 Vercel 部署状态和资源可用性

echo "🔍 YesSales 部署监控开始..."
echo "==============================================="

# 获取最新提交信息
LATEST_COMMIT=$(git log -1 --format="%h - %s")
echo "📝 最新提交: $LATEST_COMMIT"
echo

# 监控函数
check_deployment_status() {
    echo "🌐 检查部署状态 - $(date '+%H:%M:%S')"
    
    # 检查主页面
    MAIN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://yessales-admin.vercel.app/ --max-time 10)
    echo "   主页面状态: $MAIN_STATUS"
    
    # 检查资源文件 (use current deployed filename)
    ASSETS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://yessales-admin.vercel.app/assets/index-ClvP5PA7.js --max-time 10)
    echo "   资源文件状态: $ASSETS_STATUS"
    
    # 检查 admin 路由
    ADMIN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://yessales-admin.vercel.app/admin --max-time 10)
    echo "   Admin路由状态: $ADMIN_STATUS"
    
    # 检查 sales 路由
    SALES_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://yessales-admin.vercel.app/sales --max-time 10)
    echo "   Sales路由状态: $SALES_STATUS"
    
    echo "   ---"
    
    # 判断部署是否成功
    if [ "$MAIN_STATUS" = "200" ] && [ "$ASSETS_STATUS" = "200" ] && [ "$ADMIN_STATUS" = "200" ] && [ "$SALES_STATUS" = "200" ]; then
        echo "✅ 部署成功！所有路由和资源都可访问"
        echo
        echo "🚀 可用的访问地址:"
        echo "   - 主页面: https://yessales-admin.vercel.app/"
        echo "   - 销售端: https://yessales-admin.vercel.app/sales"
        echo "   - 管理端: https://yessales-admin.vercel.app/admin"
        echo
        echo "📋 后续步骤:"
        echo "   1. ✅ 验证所有页面功能正常"
        echo "   2. ⏳ 配置自定义域名 (admin.yessales.cn, app.yessales.cn)"
        echo "   3. ⏳ 进行完整的功能测试"
        echo "   4. ⏳ 配置监控和告警"
        return 0
    elif [ "$MAIN_STATUS" = "200" ] && [ "$ASSETS_STATUS" = "200" ]; then
        echo "⚠️ 基础部署成功，但SPA路由需要修复"
        echo "   主页面和资源文件可访问，但路由重写规则可能需要调整"
        return 1
    else
        echo "❌ 部署仍有问题，需要等待或进一步修复"
        echo "   主页面: $MAIN_STATUS, 资源文件: $ASSETS_STATUS"
        return 1
    fi
}

# 执行检查
if check_deployment_status; then
    echo "🎉 监控完成 - 部署成功！"
    exit 0
else
    echo "⏳ 部署可能仍在进行中..."
    echo
    echo "💡 建议："
    echo "   - 等待 2-3 分钟后再次运行此脚本"
    echo "   - 检查 Vercel Dashboard: https://vercel.com/dashboard"
    echo "   - 检查 GitHub Actions: https://github.com/muzhihao1/yessales-admin/actions"
    echo
    echo "🔄 要继续监控，请再次运行: ./monitor-deployment.sh"
    exit 1
fi