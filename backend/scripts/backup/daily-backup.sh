#!/bin/bash

# 每日增量备份脚本
# 用于执行数据库和文件的增量备份

set -euo pipefail

# 加载环境变量
if [ -f "$(dirname "$0")/../../.env.backup" ]; then
    export $(cat "$(dirname "$0")/../../.env.backup" | sed 's/#.*//g' | xargs)
fi

# 配置变量
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_TYPE="daily"
LOG_FILE="${BACKUP_DIR}/logs/backup_${BACKUP_DATE}.log"
TEMP_DIR="${BACKUP_DIR}/temp"

# 创建必要的目录
mkdir -p "${BACKUP_DIR}/daily"
mkdir -p "${BACKUP_DIR}/logs"
mkdir -p "${TEMP_DIR}"

# 日志函数
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "${LOG_FILE}"
}

# 错误处理函数
handle_error() {
    local exit_code=$?
    log "ERROR: 备份失败，退出码: ${exit_code}"
    
    # 发送失败通知
    send_notification "failed" "备份任务失败: ${1:-未知错误}"
    
    # 清理临时文件
    cleanup_temp_files
    
    exit ${exit_code}
}

# 设置错误处理
trap 'handle_error "脚本执行中断"' ERR INT TERM

# 发送通知函数
send_notification() {
    local status=$1
    local message=$2
    
    if [ -n "${NOTIFICATION_WEBHOOK:-}" ]; then
        curl -s -X POST "${NOTIFICATION_WEBHOOK}" \
            -H "Content-Type: application/json" \
            -d "{
                \"msgtype\": \"text\",
                \"text\": {
                    \"content\": \"数据备份${status}: ${message}\"
                }
            }" > /dev/null || true
    fi
}

# 清理临时文件
cleanup_temp_files() {
    log "清理临时文件..."
    rm -rf "${TEMP_DIR}"/*
}

# 获取上次备份时间戳
get_last_backup_timestamp() {
    local timestamp_file="${BACKUP_DIR}/.last_backup_timestamp"
    if [ -f "${timestamp_file}" ]; then
        cat "${timestamp_file}"
    else
        # 如果没有上次备份记录，返回24小时前
        date -d "24 hours ago" '+%Y-%m-%d %H:%M:%S'
    fi
}

# 保存当前备份时间戳
save_backup_timestamp() {
    local timestamp_file="${BACKUP_DIR}/.last_backup_timestamp"
    date '+%Y-%m-%d %H:%M:%S' > "${timestamp_file}"
}

# 数据库增量备份
backup_database_incremental() {
    log "开始数据库增量备份..."
    
    local last_backup=$(get_last_backup_timestamp)
    local backup_file="${TEMP_DIR}/db_incremental_${BACKUP_DATE}.sql"
    
    # 导出自上次备份以来的变更数据
    PGPASSWORD="${POSTGRES_PASSWORD}" pg_dump \
        -h "${POSTGRES_HOST}" \
        -p "${POSTGRES_PORT}" \
        -U "${POSTGRES_USER}" \
        -d "${POSTGRES_DB}" \
        --no-owner \
        --no-privileges \
        --verbose \
        --file="${backup_file}" \
        --where="updated_at >= '${last_backup}' OR created_at >= '${last_backup}'" \
        --table=quotes \
        --table=quote_items \
        --table=customers \
        --table=products \
        --table=accessories \
        --table=operation_logs
    
    # 压缩备份文件
    log "压缩备份文件..."
    gzip "${backup_file}"
    
    # 移动到备份目录
    local final_file="${BACKUP_DIR}/daily/db_incremental_${BACKUP_DATE}.sql.gz"
    mv "${backup_file}.gz" "${final_file}"
    
    log "数据库增量备份完成: ${final_file}"
    echo "${final_file}"
}

# WAL 归档备份
backup_wal_archives() {
    log "开始 WAL 归档备份..."
    
    # 注：Supabase 管理 WAL，这里只是示例
    # 实际使用时需要配置 WAL 归档
    
    local wal_dir="${BACKUP_DIR}/wal"
    mkdir -p "${wal_dir}"
    
    # 这里添加实际的 WAL 备份逻辑
    log "WAL 归档备份完成"
}

# 关键表实时备份
backup_critical_tables() {
    log "备份关键业务表..."
    
    local tables=("quotes" "customers" "products")
    local backup_files=()
    
    for table in "${tables[@]}"; do
        local table_file="${TEMP_DIR}/${table}_${BACKUP_DATE}.csv"
        
        # 导出为 CSV 格式
        PGPASSWORD="${POSTGRES_PASSWORD}" psql \
            -h "${POSTGRES_HOST}" \
            -p "${POSTGRES_PORT}" \
            -U "${POSTGRES_USER}" \
            -d "${POSTGRES_DB}" \
            -c "\COPY (SELECT * FROM ${table}) TO '${table_file}' WITH CSV HEADER"
        
        # 压缩
        gzip "${table_file}"
        backup_files+=("${table_file}.gz")
    done
    
    # 打包所有关键表
    local archive="${BACKUP_DIR}/daily/critical_tables_${BACKUP_DATE}.tar.gz"
    tar -czf "${archive}" -C "${TEMP_DIR}" --files-from <(printf '%s\n' "${backup_files[@]##*/}")
    
    log "关键表备份完成: ${archive}"
}

# 文件存储增量备份
backup_storage_incremental() {
    log "开始文件存储增量备份..."
    
    # 使用 rsync 进行增量备份
    # 注：需要配置 Supabase Storage 访问
    
    local storage_backup="${BACKUP_DIR}/daily/storage_${BACKUP_DATE}.tar.gz"
    
    # 这里添加实际的存储备份逻辑
    # 示例：备份最近修改的文件
    find /path/to/storage -type f -mtime -1 -print0 | \
        tar --null -czf "${storage_backup}" --files-from -
    
    log "文件存储备份完成: ${storage_backup}"
}

# 上传到云存储
upload_to_oss() {
    local file=$1
    log "上传备份文件到 OSS: ${file}"
    
    # 使用 ossutil 或其他工具上传
    # ossutil cp "${file}" "oss://${OSS_BUCKET}/daily/$(basename ${file})"
    
    # 这里添加实际的上传逻辑
    log "上传完成: ${file}"
}

# 清理过期备份
cleanup_old_backups() {
    log "清理过期备份文件..."
    
    # 删除超过保留期的备份
    find "${BACKUP_DIR}/daily" -name "*.gz" -type f -mtime +${BACKUP_RETENTION_DAYS} -delete
    
    log "过期备份清理完成"
}

# 验证备份
verify_backup() {
    local backup_file=$1
    log "验证备份文件: ${backup_file}"
    
    # 检查文件完整性
    if [ -f "${backup_file}" ]; then
        # 测试压缩文件
        gzip -t "${backup_file}" 2>/dev/null
        if [ $? -eq 0 ]; then
            log "备份文件验证通过"
            return 0
        else
            log "ERROR: 备份文件损坏"
            return 1
        fi
    else
        log "ERROR: 备份文件不存在"
        return 1
    fi
}

# 生成备份报告
generate_backup_report() {
    local backup_files=("$@")
    local report_file="${BACKUP_DIR}/daily/backup_report_${BACKUP_DATE}.json"
    
    cat > "${report_file}" <<EOF
{
    "backup_date": "${BACKUP_DATE}",
    "backup_type": "${BACKUP_TYPE}",
    "status": "success",
    "files": [
EOF
    
    local first=true
    for file in "${backup_files[@]}"; do
        if [ "${first}" = true ]; then
            first=false
        else
            echo "," >> "${report_file}"
        fi
        
        local size=$(stat -c%s "${file}" 2>/dev/null || echo "0")
        cat >> "${report_file}" <<EOF
        {
            "name": "$(basename ${file})",
            "path": "${file}",
            "size": ${size},
            "created": "$(date '+%Y-%m-%d %H:%M:%S')"
        }
EOF
    done
    
    cat >> "${report_file}" <<EOF
    ],
    "total_size": $(du -cb "${backup_files[@]}" | tail -1 | cut -f1),
    "duration_seconds": $SECONDS
}
EOF
    
    log "备份报告生成: ${report_file}"
}

# 主函数
main() {
    log "========== 开始每日增量备份 =========="
    log "备份类型: ${BACKUP_TYPE}"
    log "备份日期: ${BACKUP_DATE}"
    
    local backup_files=()
    
    # 1. 数据库增量备份
    local db_backup=$(backup_database_incremental)
    if verify_backup "${db_backup}"; then
        backup_files+=("${db_backup}")
        upload_to_oss "${db_backup}"
    fi
    
    # 2. WAL 归档备份
    backup_wal_archives
    
    # 3. 关键表备份
    backup_critical_tables
    
    # 4. 文件存储备份
    # backup_storage_incremental
    
    # 5. 清理过期备份
    cleanup_old_backups
    
    # 6. 生成备份报告
    generate_backup_report "${backup_files[@]}"
    
    # 7. 保存备份时间戳
    save_backup_timestamp
    
    # 8. 清理临时文件
    cleanup_temp_files
    
    # 9. 发送成功通知
    send_notification "成功" "备份任务完成，共备份 ${#backup_files[@]} 个文件"
    
    log "========== 每日增量备份完成 =========="
    log "总耗时: ${SECONDS} 秒"
}

# 执行主函数
main "$@"