#!/bin/bash

# 备份系统初始化脚本
# 用于设置备份环境和权限

set -euo pipefail

echo "========================================="
echo "耶氏台球报价系统 - 备份环境初始化"
echo "========================================="

# 检查是否以 root 或具有 sudo 权限运行
if [ "$EUID" -ne 0 ] && ! sudo -n true 2>/dev/null; then 
    echo "请以 root 用户运行或使用 sudo"
    exit 1
fi

# 设置变量
BACKUP_ROOT="/backup/postgres"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_USER="postgres"
BACKUP_GROUP="postgres"

echo "1. 创建备份目录结构..."
sudo mkdir -p ${BACKUP_ROOT}/{daily,weekly,monthly,logs,temp,restore_safety,verify_temp}

echo "2. 设置目录权限..."
sudo chown -R ${BACKUP_USER}:${BACKUP_GROUP} ${BACKUP_ROOT}
sudo chmod -R 750 ${BACKUP_ROOT}

echo "3. 设置脚本执行权限..."
chmod +x ${SCRIPT_DIR}/*.sh

echo "4. 创建环境变量配置文件..."
if [ ! -f "${SCRIPT_DIR}/../../.env.backup" ]; then
    cat > "${SCRIPT_DIR}/../../.env.backup" <<EOF
# 数据库连接配置
POSTGRES_HOST=db.xxxxx.supabase.co
POSTGRES_PORT=5432
POSTGRES_DB=postgres
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password_here

# 备份配置
BACKUP_DIR=${BACKUP_ROOT}
BACKUP_RETENTION_DAYS=30
BACKUP_COMPRESSION=gzip

# 云存储配置（可选）
# OSS_ENDPOINT=oss-cn-hangzhou.aliyuncs.com
# OSS_BUCKET=yessales-backup
# OSS_ACCESS_KEY_ID=your_access_key
# OSS_ACCESS_KEY_SECRET=your_secret_key

# 通知配置（可选）
# NOTIFICATION_WEBHOOK=https://dingtalk.com/webhook/xxx
# NOTIFICATION_EMAIL=admin@yessales.com
EOF
    echo "   已创建 .env.backup 配置文件模板"
    echo "   请编辑此文件填写实际的配置信息"
else
    echo "   .env.backup 文件已存在，跳过创建"
fi

echo "5. 检查系统依赖..."
MISSING_DEPS=()

# 检查 PostgreSQL 客户端
if ! command -v psql &> /dev/null; then
    MISSING_DEPS+=("postgresql-client")
fi

if ! command -v pg_dump &> /dev/null; then
    MISSING_DEPS+=("postgresql-client")
fi

# 检查压缩工具
if ! command -v gzip &> /dev/null; then
    MISSING_DEPS+=("gzip")
fi

# 检查其他工具
if ! command -v curl &> /dev/null; then
    MISSING_DEPS+=("curl")
fi

if ! command -v jq &> /dev/null; then
    MISSING_DEPS+=("jq")
fi

if [ ${#MISSING_DEPS[@]} -ne 0 ]; then
    echo "   缺少以下依赖："
    printf '   - %s\n' "${MISSING_DEPS[@]}"
    echo ""
    echo "   安装命令："
    echo "   sudo apt-get update && sudo apt-get install -y ${MISSING_DEPS[*]}"
else
    echo "   ✓ 所有依赖已安装"
fi

echo "6. 创建日志轮转配置..."
sudo tee /etc/logrotate.d/postgres-backup > /dev/null <<EOF
${BACKUP_ROOT}/logs/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 0640 ${BACKUP_USER} ${BACKUP_GROUP}
}
EOF
echo "   ✓ 日志轮转配置已创建"

echo "7. 创建 cron 任务模板..."
CRON_FILE="${SCRIPT_DIR}/cron-tasks.txt"
cat > ${CRON_FILE} <<EOF
# 耶氏台球报价系统备份任务
# 安装方法: crontab ${CRON_FILE}

# 每日备份 (凌晨 3:00)
0 3 * * * ${SCRIPT_DIR}/daily-backup.sh >> ${BACKUP_ROOT}/logs/cron.log 2>&1

# 每周全量备份 (周日凌晨 2:00)
0 2 * * 0 ${SCRIPT_DIR}/weekly-backup.sh >> ${BACKUP_ROOT}/logs/cron.log 2>&1

# 每日备份验证 (早上 6:00)
0 6 * * * ${SCRIPT_DIR}/verify-backup.sh >> ${BACKUP_ROOT}/logs/cron.log 2>&1

# 清理过期备份 (每月15日凌晨 5:00)
0 5 15 * * find ${BACKUP_ROOT}/daily -name "*.gz" -mtime +${BACKUP_RETENTION_DAYS:-30} -delete >> ${BACKUP_ROOT}/logs/cron.log 2>&1
EOF
echo "   ✓ Cron 任务模板已创建: ${CRON_FILE}"

echo "8. 测试数据库连接..."
if [ -f "${SCRIPT_DIR}/../../.env.backup" ]; then
    source "${SCRIPT_DIR}/../../.env.backup"
    if [ -n "${POSTGRES_PASSWORD}" ] && [ "${POSTGRES_PASSWORD}" != "your_password_here" ]; then
        if PGPASSWORD="${POSTGRES_PASSWORD}" psql -h "${POSTGRES_HOST}" -p "${POSTGRES_PORT}" -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -c "SELECT version();" &> /dev/null; then
            echo "   ✓ 数据库连接成功"
        else
            echo "   ✗ 数据库连接失败，请检查配置"
        fi
    else
        echo "   ⚠ 请先配置数据库密码"
    fi
fi

echo ""
echo "========================================="
echo "初始化完成！"
echo "========================================="
echo ""
echo "后续步骤："
echo "1. 编辑 .env.backup 文件，填写实际的配置信息"
echo "2. 测试备份脚本："
echo "   ${SCRIPT_DIR}/daily-backup.sh"
echo "3. 安装 cron 任务："
echo "   crontab ${CRON_FILE}"
echo "4. 查看备份脚本文档："
echo "   cat ${SCRIPT_DIR}/README.md"
echo ""
echo "重要提示："
echo "- 定期检查备份日志: tail -f ${BACKUP_ROOT}/logs/*.log"
echo "- 每月至少执行一次恢复测试"
echo "- 保持备份策略文档更新"
echo ""