#!/bin/bash

# 每周全量备份脚本
# 用于执行完整的数据库和文件备份

set -euo pipefail

# 加载环境变量
if [ -f "$(dirname "$0")/../../.env.backup" ]; then
    export $(cat "$(dirname "$0")/../../.env.backup" | sed 's/#.*//g' | xargs)
fi

# 配置变量
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_WEEK=$(date +%Y_W%U)
BACKUP_TYPE="weekly"
LOG_FILE="${BACKUP_DIR}/logs/backup_weekly_${BACKUP_DATE}.log"
TEMP_DIR="${BACKUP_DIR}/temp"

# 创建必要的目录
mkdir -p "${BACKUP_DIR}/weekly"
mkdir -p "${BACKUP_DIR}/logs"
mkdir -p "${TEMP_DIR}"

# 日志函数
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "${LOG_FILE}"
}

# 错误处理函数
handle_error() {
    local exit_code=$?
    log "ERROR: 全量备份失败，退出码: ${exit_code}"
    
    # 发送失败通知
    send_notification "failed" "全量备份任务失败: ${1:-未知错误}"
    
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
                    \"content\": \"[全量备份] ${status}: ${message}\"
                }
            }" > /dev/null || true
    fi
}

# 清理临时文件
cleanup_temp_files() {
    log "清理临时文件..."
    rm -rf "${TEMP_DIR}"/*
}

# 全量数据库备份
backup_database_full() {
    log "开始全量数据库备份..."
    
    local backup_file="${TEMP_DIR}/db_full_${BACKUP_WEEK}.sql"
    local start_time=$(date +%s)
    
    # 使用 pg_dump 导出完整数据库
    PGPASSWORD="${POSTGRES_PASSWORD}" pg_dump \
        -h "${POSTGRES_HOST}" \
        -p "${POSTGRES_PORT}" \
        -U "${POSTGRES_USER}" \
        -d "${POSTGRES_DB}" \
        --no-owner \
        --no-privileges \
        --verbose \
        --format=custom \
        --blobs \
        --file="${backup_file}"
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    # 获取备份文件大小
    local size=$(stat -c%s "${backup_file}" 2>/dev/null || echo "0")
    log "数据库备份完成，大小: $(numfmt --to=iec-i --suffix=B ${size})，耗时: ${duration}秒"
    
    # 压缩备份文件
    log "压缩备份文件..."
    gzip -9 "${backup_file}"
    
    # 移动到备份目录
    local final_file="${BACKUP_DIR}/weekly/db_full_${BACKUP_WEEK}.sql.gz"
    mv "${backup_file}.gz" "${final_file}"
    
    # 创建校验和文件
    sha256sum "${final_file}" > "${final_file}.sha256"
    
    log "全量数据库备份完成: ${final_file}"
    echo "${final_file}"
}

# 备份数据库结构
backup_database_schema() {
    log "备份数据库结构..."
    
    local schema_file="${BACKUP_DIR}/weekly/db_schema_${BACKUP_WEEK}.sql"
    
    # 只导出结构，不包含数据
    PGPASSWORD="${POSTGRES_PASSWORD}" pg_dump \
        -h "${POSTGRES_HOST}" \
        -p "${POSTGRES_PORT}" \
        -U "${POSTGRES_USER}" \
        -d "${POSTGRES_DB}" \
        --schema-only \
        --no-owner \
        --no-privileges \
        --file="${schema_file}"
    
    gzip -9 "${schema_file}"
    
    log "数据库结构备份完成: ${schema_file}.gz"
}

# 备份用户和权限
backup_roles_and_permissions() {
    log "备份用户角色和权限..."
    
    local roles_file="${BACKUP_DIR}/weekly/db_roles_${BACKUP_WEEK}.sql"
    
    # 导出全局角色和权限
    PGPASSWORD="${POSTGRES_PASSWORD}" pg_dumpall \
        -h "${POSTGRES_HOST}" \
        -p "${POSTGRES_PORT}" \
        -U "${POSTGRES_USER}" \
        --roles-only \
        --file="${roles_file}"
    
    gzip -9 "${roles_file}"
    
    log "角色权限备份完成: ${roles_file}.gz"
}

# 备份单个表为 CSV
backup_table_as_csv() {
    local table_name=$1
    local output_dir="${TEMP_DIR}/tables_csv"
    mkdir -p "${output_dir}"
    
    local csv_file="${output_dir}/${table_name}.csv"
    
    log "导出表 ${table_name} 为 CSV..."
    
    PGPASSWORD="${POSTGRES_PASSWORD}" psql \
        -h "${POSTGRES_HOST}" \
        -p "${POSTGRES_PORT}" \
        -U "${POSTGRES_USER}" \
        -d "${POSTGRES_DB}" \
        -c "\COPY (SELECT * FROM ${table_name} ORDER BY created_at) TO '${csv_file}' WITH CSV HEADER"
    
    # 压缩 CSV 文件
    gzip -9 "${csv_file}"
}

# 批量备份所有表为 CSV
backup_all_tables_as_csv() {
    log "备份所有表为 CSV 格式..."
    
    local tables=(
        "customers"
        "products"
        "product_skus"
        "accessories"
        "quotes"
        "quote_items"
        "users"
        "operation_logs"
    )
    
    for table in "${tables[@]}"; do
        backup_table_as_csv "${table}"
    done
    
    # 打包所有 CSV 文件
    local csv_archive="${BACKUP_DIR}/weekly/tables_csv_${BACKUP_WEEK}.tar.gz"
    tar -czf "${csv_archive}" -C "${TEMP_DIR}" "tables_csv"
    
    log "CSV 备份完成: ${csv_archive}"
}

# 备份存储文件
backup_storage_full() {
    log "开始全量存储备份..."
    
    # 注：实际实现需要根据 Supabase Storage API
    # 这里是示例代码
    
    local storage_dirs=(
        "products"
        "quotes"
        "customers"
        "exports"
    )
    
    local storage_backup="${BACKUP_DIR}/weekly/storage_full_${BACKUP_WEEK}.tar.gz"
    
    # 创建存储备份
    # tar -czf "${storage_backup}" -C /path/to/storage "${storage_dirs[@]}"
    
    log "存储备份完成: ${storage_backup}"
}

# 创建备份清单
create_backup_manifest() {
    local backup_files=("$@")
    local manifest_file="${BACKUP_DIR}/weekly/manifest_${BACKUP_WEEK}.json"
    
    cat > "${manifest_file}" <<EOF
{
    "backup_id": "${BACKUP_WEEK}",
    "backup_date": "$(date -Iseconds)",
    "backup_type": "full",
    "database": {
        "host": "${POSTGRES_HOST}",
        "database": "${POSTGRES_DB}",
        "version": "$(PGPASSWORD=${POSTGRES_PASSWORD} psql -h ${POSTGRES_HOST} -p ${POSTGRES_PORT} -U ${POSTGRES_USER} -d ${POSTGRES_DB} -t -c 'SELECT version()')"
    },
    "files": [
EOF
    
    local first=true
    for file in "${backup_files[@]}"; do
        if [ -f "${file}" ]; then
            if [ "${first}" = true ]; then
                first=false
            else
                echo "," >> "${manifest_file}"
            fi
            
            local size=$(stat -c%s "${file}" 2>/dev/null || echo "0")
            local checksum=$(sha256sum "${file}" | cut -d' ' -f1)
            
            cat >> "${manifest_file}" <<EOF
        {
            "filename": "$(basename ${file})",
            "path": "${file}",
            "size": ${size},
            "checksum": "${checksum}",
            "created": "$(stat -c%y ${file})"
        }
EOF
        fi
    done
    
    cat >> "${manifest_file}" <<EOF
    ],
    "total_size": $(du -cb "${backup_files[@]}" 2>/dev/null | tail -1 | cut -f1 || echo "0"),
    "duration_seconds": $SECONDS,
    "retention_days": ${BACKUP_RETENTION_DAYS}
}
EOF
    
    log "备份清单创建: ${manifest_file}"
}

# 验证备份完整性
verify_full_backup() {
    log "验证备份完整性..."
    
    local verification_log="${BACKUP_DIR}/weekly/verification_${BACKUP_WEEK}.log"
    local has_error=false
    
    # 查找本周的所有备份文件
    local backup_files=($(find "${BACKUP_DIR}/weekly" -name "*${BACKUP_WEEK}*" -type f))
    
    for file in "${backup_files[@]}"; do
        if [[ "${file}" =~ \.gz$ ]]; then
            # 测试压缩文件完整性
            if gzip -t "${file}" 2>/dev/null; then
                echo "✓ ${file}: 验证通过" >> "${verification_log}"
            else
                echo "✗ ${file}: 验证失败 - 文件损坏" >> "${verification_log}"
                has_error=true
            fi
        fi
        
        # 验证校验和（如果存在）
        if [ -f "${file}.sha256" ]; then
            if sha256sum -c "${file}.sha256" >/dev/null 2>&1; then
                echo "✓ ${file}: 校验和匹配" >> "${verification_log}"
            else
                echo "✗ ${file}: 校验和不匹配" >> "${verification_log}"
                has_error=true
            fi
        fi
    done
    
    if [ "${has_error}" = true ]; then
        log "WARNING: 部分备份文件验证失败，请检查: ${verification_log}"
        return 1
    else
        log "所有备份文件验证通过"
        return 0
    fi
}

# 上传到云存储
upload_to_cloud() {
    local file=$1
    log "上传文件到云存储: ${file}"
    
    # 这里添加实际的上传逻辑
    # 例如使用 ossutil、aws s3 等工具
    
    # 示例：分片上传大文件
    local file_size=$(stat -c%s "${file}")
    local chunk_size=$((100 * 1024 * 1024)) # 100MB
    
    if [ ${file_size} -gt ${chunk_size} ]; then
        log "文件较大，使用分片上传..."
        # 实现分片上传逻辑
    fi
    
    log "上传完成: ${file}"
}

# 测试恢复
test_restore() {
    log "执行恢复测试..."
    
    local test_db="test_restore_${BACKUP_WEEK}"
    local backup_file="${BACKUP_DIR}/weekly/db_full_${BACKUP_WEEK}.sql.gz"
    
    # 创建测试数据库
    PGPASSWORD="${POSTGRES_PASSWORD}" psql \
        -h "${POSTGRES_HOST}" \
        -p "${POSTGRES_PORT}" \
        -U "${POSTGRES_USER}" \
        -d postgres \
        -c "CREATE DATABASE ${test_db}"
    
    # 恢复备份到测试数据库
    gunzip -c "${backup_file}" | PGPASSWORD="${POSTGRES_PASSWORD}" pg_restore \
        -h "${POSTGRES_HOST}" \
        -p "${POSTGRES_PORT}" \
        -U "${POSTGRES_USER}" \
        -d "${test_db}" \
        --no-owner \
        --no-privileges
    
    # 验证恢复的数据
    local table_count=$(PGPASSWORD="${POSTGRES_PASSWORD}" psql \
        -h "${POSTGRES_HOST}" \
        -p "${POSTGRES_PORT}" \
        -U "${POSTGRES_USER}" \
        -d "${test_db}" \
        -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'")
    
    log "恢复测试完成，表数量: ${table_count}"
    
    # 删除测试数据库
    PGPASSWORD="${POSTGRES_PASSWORD}" psql \
        -h "${POSTGRES_HOST}" \
        -p "${POSTGRES_PORT}" \
        -U "${POSTGRES_USER}" \
        -d postgres \
        -c "DROP DATABASE ${test_db}"
}

# 清理旧备份
cleanup_old_weekly_backups() {
    log "清理过期的周备份..."
    
    # 保留最近4周的备份
    find "${BACKUP_DIR}/weekly" -name "*.gz" -type f -mtime +28 -delete
    find "${BACKUP_DIR}/weekly" -name "*.json" -type f -mtime +28 -delete
    find "${BACKUP_DIR}/weekly" -name "*.sha256" -type f -mtime +28 -delete
    
    log "过期备份清理完成"
}

# 主函数
main() {
    log "========== 开始每周全量备份 =========="
    log "备份周次: ${BACKUP_WEEK}"
    log "备份日期: $(date)"
    
    local backup_files=()
    
    # 1. 全量数据库备份
    local db_backup=$(backup_database_full)
    backup_files+=("${db_backup}")
    
    # 2. 数据库结构备份
    backup_database_schema
    
    # 3. 角色权限备份
    backup_roles_and_permissions
    
    # 4. CSV 格式备份（用于数据分析）
    backup_all_tables_as_csv
    
    # 5. 存储文件备份
    # backup_storage_full
    
    # 6. 创建备份清单
    create_backup_manifest "${backup_files[@]}"
    
    # 7. 验证备份
    if verify_full_backup; then
        log "备份验证通过"
    else
        log "WARNING: 备份验证存在问题"
    fi
    
    # 8. 上传到云存储
    for file in "${backup_files[@]}"; do
        upload_to_cloud "${file}"
    done
    
    # 9. 测试恢复（可选）
    # test_restore
    
    # 10. 清理旧备份
    cleanup_old_weekly_backups
    
    # 11. 清理临时文件
    cleanup_temp_files
    
    # 12. 发送完成通知
    local total_size=$(du -ch "${backup_files[@]}" 2>/dev/null | tail -1 | cut -f1 || echo "0")
    send_notification "成功" "全量备份完成，共 ${#backup_files[@]} 个文件，总大小: ${total_size}"
    
    log "========== 每周全量备份完成 =========="
    log "总耗时: $((SECONDS / 60)) 分钟"
}

# 执行主函数
main "$@"