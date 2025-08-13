#!/bin/bash
# 自动部署脚本
# 在服务器上执行此脚本完成部署

set -e

NGINX_ROOT=${NGINX_ROOT:-"/var/www/html"}
BACKUP_DIR="/tmp/yessales-admin-backup-$(date +%s)"

echo "开始部署 YesSales Admin..."

# 备份旧版本
if [ -d "$NGINX_ROOT" ]; then
    echo "备份当前版本到: $BACKUP_DIR"
    mv "$NGINX_ROOT" "$BACKUP_DIR"
fi

# 创建新目录
mkdir -p "$NGINX_ROOT"

# 复制新文件
echo "复制新版本文件..."
cp -r ./* "$NGINX_ROOT/"

# 设置权限
chmod -R 755 "$NGINX_ROOT"

# 重启服务
if command -v systemctl &> /dev/null; then
    echo "重启 Nginx 服务..."
    sudo systemctl reload nginx
fi

echo "部署完成！"
echo "备份位置: $BACKUP_DIR"
