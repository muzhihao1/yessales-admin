#!/bin/bash

# 数据恢复脚本
# 用于从备份中恢复数据库和文件

set -euo pipefail

# 加载环境变量
if [ -f "$(dirname "$0")/../../.env.backup" ]; then
    export $(cat "$(dirname "$0")/../../.env.backup" | sed 's/#.*//g' | xargs)
fi

# 配置变量
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RESTORE_DATE=$(date +%Y%m%d_%H%M%S)
LOG_FILE="${BACKUP_DIR}/logs/restore_${RESTORE_DATE}.log"
TEMP_DIR="${BACKUP_DIR}/restore_temp"

# 创建必要的目录
mkdir -p "${BACKUP_DIR}/logs"
mkdir -p "${TEMP_DIR}"

# 默认参数
RESTORE_TYPE=""
BACKUP_FILE=""
TARGET_DB=""
RESTORE_POINT=""
DRY_RUN=false
FORCE=false

# 日志函数
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "${LOG_FILE}"
}

# 错误处理函数
handle_error() {
    local exit_code=$?
    log "ERROR: 恢复失败，退出码: ${exit_code}"
    log "错误详情: ${1:-未知错误}"
    
    # 清理临时文件
    cleanup_temp_files
    
    exit ${exit_code}
}

# 设置错误处理
trap 'handle_error "脚本执行中断"' ERR INT TERM

# 显示使用帮助
show_usage() {
    cat <<EOF
使用方法: $0 [选项]

选项:
    -t, --type <type>           恢复类型 (full|incremental|table|pitr)
    -f, --file <path>           备份文件路径
    -d, --database <name>       目标数据库名称
    -p, --point <timestamp>     恢复到指定时间点 (PITR)
    -T, --table <name>          只恢复指定表
    --dry-run                   模拟运行，不实际执行恢复
    --force                     强制恢复，不进行确认
    -h, --help                  显示此帮助信息

示例:
    # 全量恢复
    $0 -t full -f /backup/weekly/db_full_2024_W01.sql.gz -d postgres

    # 恢复到指定时间点
    $0 -t pitr -p "2024-01-15 10:30:00" -d postgres

    # 只恢复特定表
    $0 -t table -f /backup/daily/tables_csv_20240115.tar.gz -T quotes
EOF
}

# 解析命令行参数
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -t|--type)
                RESTORE_TYPE="$2"
                shift 2
                ;;
            -f|--file)
                BACKUP_FILE="$2"
                shift 2
                ;;
            -d|--database)
                TARGET_DB="$2"
                shift 2
                ;;
            -p|--point)
                RESTORE_POINT="$2"
                shift 2
                ;;
            -T|--table)
                TABLE_NAME="$2"
                shift 2
                ;;
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            --force)
                FORCE=true
                shift
                ;;
            -h|--help)
                show_usage
                exit 0
                ;;
            *)
                echo "未知选项: $1"
                show_usage
                exit 1
                ;;
        esac
    done
}

# 确认恢复操作
confirm_restore() {
    if [ "${FORCE}" = true ]; then
        return 0
    fi
    
    echo "========================================"
    echo "恢复操作确认"
    echo "========================================"
    echo "恢复类型: ${RESTORE_TYPE}"
    echo "备份文件: ${BACKUP_FILE:-N/A}"
    echo "目标数据库: ${TARGET_DB}"
    echo "恢复时间点: ${RESTORE_POINT:-N/A}"
    echo "========================================"
    echo ""
    echo "警告: 此操作将覆盖现有数据！"
    echo ""
    
    read -p "确定要继续吗? (yes/no): " confirm
    if [ "${confirm}" != "yes" ]; then
        log "用户取消恢复操作"
        exit 0
    fi
}

# 清理临时文件
cleanup_temp_files() {
    log "清理临时文件..."
    rm -rf "${TEMP_DIR}"/*
}

# 检查备份文件
check_backup_file() {
    local file=$1
    
    if [ ! -f "${file}" ]; then
        log "ERROR: 备份文件不存在: ${file}"
        exit 1
    fi
    
    # 检查文件完整性
    if [[ "${file}" =~ \.gz$ ]]; then
        if ! gzip -t "${file}" 2>/dev/null; then
            log "ERROR: 备份文件损坏: ${file}"
            exit 1
        fi
    fi
    
    # 检查校验和
    if [ -f "${file}.sha256" ]; then
        if ! sha256sum -c "${file}.sha256" >/dev/null 2>&1; then
            log "ERROR: 备份文件校验和不匹配: ${file}"
            exit 1
        fi
    fi
    
    log "备份文件检查通过: ${file}"
}

# 备份当前数据库
backup_current_database() {
    log "备份当前数据库..."
    
    local safety_backup="${BACKUP_DIR}/restore_safety/before_restore_${RESTORE_DATE}.sql.gz"
    mkdir -p "$(dirname ${safety_backup})"
    
    if [ "${DRY_RUN}" = false ]; then
        PGPASSWORD="${POSTGRES_PASSWORD}" pg_dump \
            -h "${POSTGRES_HOST}" \
            -p "${POSTGRES_PORT}" \
            -U "${POSTGRES_USER}" \
            -d "${TARGET_DB}" \
            --no-owner \
            --no-privileges \
            --format=custom \
            --file="${safety_backup%.gz}"
        
        gzip "${safety_backup%.gz}"
        log "安全备份创建: ${safety_backup}"
    else
        log "[DRY RUN] 将创建安全备份: ${safety_backup}"
    fi
}

# 全量恢复
restore_full() {
    log "开始全量数据库恢复..."
    
    check_backup_file "${BACKUP_FILE}"
    
    # 解压备份文件
    local uncompressed_file="${TEMP_DIR}/$(basename ${BACKUP_FILE%.gz})"
    log "解压备份文件..."
    gunzip -c "${BACKUP_FILE}" > "${uncompressed_file}"
    
    # 备份当前数据库
    backup_current_database
    
    if [ "${DRY_RUN}" = false ]; then
        # 清空目标数据库
        log "清空目标数据库..."
        PGPASSWORD="${POSTGRES_PASSWORD}" psql \
            -h "${POSTGRES_HOST}" \
            -p "${POSTGRES_PORT}" \
            -U "${POSTGRES_USER}" \
            -d "${TARGET_DB}" \
            -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
        
        # 恢复数据
        log "恢复数据库..."
        PGPASSWORD="${POSTGRES_PASSWORD}" pg_restore \
            -h "${POSTGRES_HOST}" \
            -p "${POSTGRES_PORT}" \
            -U "${POSTGRES_USER}" \
            -d "${TARGET_DB}" \
            --no-owner \
            --no-privileges \
            --verbose \
            "${uncompressed_file}"
        
        # 重新创建索引和约束
        log "重建索引..."
        PGPASSWORD="${POSTGRES_PASSWORD}" psql \
            -h "${POSTGRES_HOST}" \
            -p "${POSTGRES_PORT}" \
            -U "${POSTGRES_USER}" \
            -d "${TARGET_DB}" \
            -c "REINDEX DATABASE ${TARGET_DB};"
        
        # 更新统计信息
        log "更新统计信息..."
        PGPASSWORD="${POSTGRES_PASSWORD}" psql \
            -h "${POSTGRES_HOST}" \
            -p "${POSTGRES_PORT}" \
            -U "${POSTGRES_USER}" \
            -d "${TARGET_DB}" \
            -c "ANALYZE;"
    else
        log "[DRY RUN] 将执行全量恢复"
    fi
    
    log "全量恢复完成"
}

# 增量恢复
restore_incremental() {
    log "开始增量恢复..."
    
    check_backup_file "${BACKUP_FILE}"
    
    # 解压备份文件
    local sql_file="${TEMP_DIR}/$(basename ${BACKUP_FILE%.gz})"
    gunzip -c "${BACKUP_FILE}" > "${sql_file}"
    
    if [ "${DRY_RUN}" = false ]; then
        # 应用增量更新
        log "应用增量更新..."
        PGPASSWORD="${POSTGRES_PASSWORD}" psql \
            -h "${POSTGRES_HOST}" \
            -p "${POSTGRES_PORT}" \
            -U "${POSTGRES_USER}" \
            -d "${TARGET_DB}" \
            -f "${sql_file}"
    else
        log "[DRY RUN] 将应用增量更新"
    fi
    
    log "增量恢复完成"
}

# 表级恢复
restore_table() {
    log "开始表级恢复: ${TABLE_NAME}"
    
    check_backup_file "${BACKUP_FILE}"
    
    # 解压备份文件
    local extract_dir="${TEMP_DIR}/tables"
    mkdir -p "${extract_dir}"
    
    log "解压表备份..."
    tar -xzf "${BACKUP_FILE}" -C "${extract_dir}"
    
    # 查找表文件
    local table_file="${extract_dir}/tables_csv/${TABLE_NAME}.csv.gz"
    if [ ! -f "${table_file}" ]; then
        log "ERROR: 未找到表备份文件: ${TABLE_NAME}"
        exit 1
    fi
    
    # 解压 CSV 文件
    gunzip "${table_file}"
    local csv_file="${table_file%.gz}"
    
    if [ "${DRY_RUN}" = false ]; then
        # 备份当前表
        log "备份当前表..."
        PGPASSWORD="${POSTGRES_PASSWORD}" pg_dump \
            -h "${POSTGRES_HOST}" \
            -p "${POSTGRES_PORT}" \
            -U "${POSTGRES_USER}" \
            -d "${TARGET_DB}" \
            -t "${TABLE_NAME}" \
            --file="${TEMP_DIR}/${TABLE_NAME}_backup_${RESTORE_DATE}.sql"
        
        # 清空表
        log "清空表 ${TABLE_NAME}..."
        PGPASSWORD="${POSTGRES_PASSWORD}" psql \
            -h "${POSTGRES_HOST}" \
            -p "${POSTGRES_PORT}" \
            -U "${POSTGRES_USER}" \
            -d "${TARGET_DB}" \
            -c "TRUNCATE TABLE ${TABLE_NAME} CASCADE;"
        
        # 导入数据
        log "导入表数据..."
        PGPASSWORD="${POSTGRES_PASSWORD}" psql \
            -h "${POSTGRES_HOST}" \
            -p "${POSTGRES_PORT}" \
            -U "${POSTGRES_USER}" \
            -d "${TARGET_DB}" \
            -c "\COPY ${TABLE_NAME} FROM '${csv_file}' WITH CSV HEADER"
    else
        log "[DRY RUN] 将恢复表: ${TABLE_NAME}"
    fi
    
    log "表恢复完成: ${TABLE_NAME}"
}

# Point-in-Time Recovery (PITR)
restore_pitr() {
    log "开始时间点恢复 (PITR): ${RESTORE_POINT}"
    
    # 注：Supabase 的 PITR 需要通过控制台或 API 执行
    # 这里提供命令行提示
    
    cat <<EOF

Point-in-Time Recovery (PITR) 步骤:

1. 登录 Supabase 控制台
2. 进入项目设置 > 数据库
3. 选择 "Point-in-Time Recovery"
4. 选择恢复时间点: ${RESTORE_POINT}
5. 确认恢复操作

或使用 Supabase CLI:
    supabase db restore --point-in-time "${RESTORE_POINT}"

注意：PITR 操作将创建新的数据库实例，不会覆盖现有数据。

EOF
    
    if [ "${DRY_RUN}" = false ]; then
        log "请按照上述步骤手动执行 PITR"
    else
        log "[DRY RUN] PITR 需要通过 Supabase 控制台执行"
    fi
}

# 验证恢复结果
verify_restore() {
    log "验证恢复结果..."
    
    if [ "${DRY_RUN}" = true ]; then
        log "[DRY RUN] 跳过验证"
        return
    fi
    
    # 检查表数量
    local table_count=$(PGPASSWORD="${POSTGRES_PASSWORD}" psql \
        -h "${POSTGRES_HOST}" \
        -p "${POSTGRES_PORT}" \
        -U "${POSTGRES_USER}" \
        -d "${TARGET_DB}" \
        -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'")
    
    log "数据库表数量: ${table_count}"
    
    # 检查关键表的记录数
    local tables=("customers" "products" "quotes")
    for table in "${tables[@]}"; do
        local count=$(PGPASSWORD="${POSTGRES_PASSWORD}" psql \
            -h "${POSTGRES_HOST}" \
            -p "${POSTGRES_PORT}" \
            -U "${POSTGRES_USER}" \
            -d "${TARGET_DB}" \
            -t -c "SELECT COUNT(*) FROM ${table}" 2>/dev/null || echo "0")
        
        log "表 ${table} 记录数: ${count}"
    done
    
    # 运行基本查询测试
    log "运行查询测试..."
    PGPASSWORD="${POSTGRES_PASSWORD}" psql \
        -h "${POSTGRES_HOST}" \
        -p "${POSTGRES_PORT}" \
        -U "${POSTGRES_USER}" \
        -d "${TARGET_DB}" \
        -c "SELECT version();" >/dev/null
    
    log "恢复验证完成"
}

# 生成恢复报告
generate_restore_report() {
    local report_file="${BACKUP_DIR}/logs/restore_report_${RESTORE_DATE}.json"
    
    cat > "${report_file}" <<EOF
{
    "restore_id": "${RESTORE_DATE}",
    "restore_type": "${RESTORE_TYPE}",
    "backup_file": "${BACKUP_FILE}",
    "target_database": "${TARGET_DB}",
    "restore_point": "${RESTORE_POINT:-null}",
    "dry_run": ${DRY_RUN},
    "start_time": "$(date -Iseconds)",
    "duration_seconds": ${SECONDS},
    "status": "completed",
    "operator": "${USER}",
    "log_file": "${LOG_FILE}"
}
EOF
    
    log "恢复报告生成: ${report_file}"
}

# 主函数
main() {
    parse_args "$@"
    
    # 验证必需参数
    if [ -z "${RESTORE_TYPE}" ]; then
        echo "ERROR: 必须指定恢复类型 (-t)"
        show_usage
        exit 1
    fi
    
    if [ -z "${TARGET_DB}" ]; then
        TARGET_DB="${POSTGRES_DB}"
    fi
    
    log "========== 开始数据恢复 =========="
    log "恢复类型: ${RESTORE_TYPE}"
    log "目标数据库: ${TARGET_DB}"
    log "模拟运行: ${DRY_RUN}"
    
    # 确认恢复操作
    confirm_restore
    
    # 执行恢复
    case "${RESTORE_TYPE}" in
        full)
            restore_full
            ;;
        incremental)
            restore_incremental
            ;;
        table)
            restore_table
            ;;
        pitr)
            restore_pitr
            ;;
        *)
            log "ERROR: 未知的恢复类型: ${RESTORE_TYPE}"
            exit 1
            ;;
    esac
    
    # 验证恢复结果
    verify_restore
    
    # 生成恢复报告
    generate_restore_report
    
    # 清理临时文件
    cleanup_temp_files
    
    log "========== 数据恢复完成 =========="
    log "总耗时: ${SECONDS} 秒"
    
    if [ "${DRY_RUN}" = true ]; then
        log "这是模拟运行，未执行实际恢复操作"
    fi
}

# 执行主函数
main "$@"