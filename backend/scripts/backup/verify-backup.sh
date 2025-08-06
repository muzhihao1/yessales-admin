#!/bin/bash

# 备份验证脚本
# 定期验证备份文件的完整性和可恢复性

set -euo pipefail

# 加载环境变量
if [ -f "$(dirname "$0")/../../.env.backup" ]; then
    export $(cat "$(dirname "$0")/../../.env.backup" | sed 's/#.*//g' | xargs)
fi

# 配置变量
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VERIFY_DATE=$(date +%Y%m%d_%H%M%S)
LOG_FILE="${BACKUP_DIR}/logs/verify_${VERIFY_DATE}.log"
TEMP_DIR="${BACKUP_DIR}/verify_temp"
VERIFY_DB="verify_test_${VERIFY_DATE}"

# 创建必要的目录
mkdir -p "${BACKUP_DIR}/logs"
mkdir -p "${TEMP_DIR}"

# 验证结果统计
TOTAL_FILES=0
VERIFIED_FILES=0
FAILED_FILES=0
WARNINGS=0

# 日志函数
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "${LOG_FILE}"
}

# 错误处理函数
handle_error() {
    local exit_code=$?
    log "ERROR: 验证过程出错，退出码: ${exit_code}"
    
    # 清理测试数据库
    cleanup_test_database
    
    # 清理临时文件
    cleanup_temp_files
    
    exit ${exit_code}
}

# 设置错误处理
trap 'handle_error' ERR INT TERM

# 清理临时文件
cleanup_temp_files() {
    rm -rf "${TEMP_DIR}"/*
}

# 清理测试数据库
cleanup_test_database() {
    if [ -n "${VERIFY_DB}" ]; then
        PGPASSWORD="${POSTGRES_PASSWORD}" psql \
            -h "${POSTGRES_HOST}" \
            -p "${POSTGRES_PORT}" \
            -U "${POSTGRES_USER}" \
            -d postgres \
            -c "DROP DATABASE IF EXISTS ${VERIFY_DB}" 2>/dev/null || true
    fi
}

# 验证备份文件完整性
verify_file_integrity() {
    local file=$1
    local status="PASS"
    local message=""
    
    ((TOTAL_FILES++))
    
    log "验证文件: ${file}"
    
    # 检查文件是否存在
    if [ ! -f "${file}" ]; then
        status="FAIL"
        message="文件不存在"
        ((FAILED_FILES++))
    else
        # 检查文件大小
        local size=$(stat -c%s "${file}" 2>/dev/null || echo "0")
        if [ "${size}" -eq 0 ]; then
            status="FAIL"
            message="文件大小为0"
            ((FAILED_FILES++))
        else
            # 检查压缩文件完整性
            if [[ "${file}" =~ \.gz$ ]]; then
                if gzip -t "${file}" 2>/dev/null; then
                    ((VERIFIED_FILES++))
                    message="压缩文件完整"
                else
                    status="FAIL"
                    message="压缩文件损坏"
                    ((FAILED_FILES++))
                fi
            else
                ((VERIFIED_FILES++))
                message="文件存在"
            fi
            
            # 检查校验和
            if [ -f "${file}.sha256" ]; then
                if sha256sum -c "${file}.sha256" >/dev/null 2>&1; then
                    message="${message}, 校验和匹配"
                else
                    status="WARN"
                    message="${message}, 校验和不匹配"
                    ((WARNINGS++))
                fi
            fi
        fi
    fi
    
    log "  状态: ${status} - ${message}"
    
    # 记录到验证报告
    echo "${file}|${status}|${message}|$(date)" >> "${BACKUP_DIR}/logs/verify_results.csv"
}

# 验证数据库备份可恢复性
verify_database_restore() {
    local backup_file=$1
    log "测试数据库备份恢复: ${backup_file}"
    
    # 创建测试数据库
    log "创建测试数据库: ${VERIFY_DB}"
    PGPASSWORD="${POSTGRES_PASSWORD}" psql \
        -h "${POSTGRES_HOST}" \
        -p "${POSTGRES_PORT}" \
        -U "${POSTGRES_USER}" \
        -d postgres \
        -c "CREATE DATABASE ${VERIFY_DB}"
    
    # 尝试恢复备份
    local restore_success=true
    local temp_file="${TEMP_DIR}/$(basename ${backup_file%.gz})"
    
    # 解压文件
    gunzip -c "${backup_file}" > "${temp_file}"
    
    # 执行恢复
    if [[ "${temp_file}" =~ \.sql$ ]]; then
        # SQL 格式
        PGPASSWORD="${POSTGRES_PASSWORD}" psql \
            -h "${POSTGRES_HOST}" \
            -p "${POSTGRES_PORT}" \
            -U "${POSTGRES_USER}" \
            -d "${VERIFY_DB}" \
            -f "${temp_file}" >/dev/null 2>&1 || restore_success=false
    else
        # Custom 格式
        PGPASSWORD="${POSTGRES_PASSWORD}" pg_restore \
            -h "${POSTGRES_HOST}" \
            -p "${POSTGRES_PORT}" \
            -U "${POSTGRES_USER}" \
            -d "${VERIFY_DB}" \
            --no-owner \
            --no-privileges \
            "${temp_file}" >/dev/null 2>&1 || restore_success=false
    fi
    
    if [ "${restore_success}" = true ]; then
        # 验证恢复的数据
        local table_count=$(PGPASSWORD="${POSTGRES_PASSWORD}" psql \
            -h "${POSTGRES_HOST}" \
            -p "${POSTGRES_PORT}" \
            -U "${POSTGRES_USER}" \
            -d "${VERIFY_DB}" \
            -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'" 2>/dev/null || echo "0")
        
        if [ "${table_count}" -gt 0 ]; then
            log "  恢复测试通过，表数量: ${table_count}"
        else
            log "  WARNING: 恢复后无表数据"
            ((WARNINGS++))
        fi
    else
        log "  ERROR: 恢复测试失败"
        ((FAILED_FILES++))
    fi
    
    # 清理测试数据库
    cleanup_test_database
    
    # 清理临时文件
    rm -f "${temp_file}"
}

# 验证 CSV 备份
verify_csv_backup() {
    local archive_file=$1
    log "验证 CSV 备份: ${archive_file}"
    
    # 解压到临时目录
    local extract_dir="${TEMP_DIR}/csv_verify"
    mkdir -p "${extract_dir}"
    
    if tar -tzf "${archive_file}" >/dev/null 2>&1; then
        tar -xzf "${archive_file}" -C "${extract_dir}"
        
        # 统计 CSV 文件
        local csv_count=$(find "${extract_dir}" -name "*.csv.gz" | wc -l)
        log "  CSV 文件数量: ${csv_count}"
        
        # 验证每个 CSV 文件
        find "${extract_dir}" -name "*.csv.gz" | while read csv_file; do
            if gzip -t "${csv_file}" 2>/dev/null; then
                log "  ✓ $(basename ${csv_file})"
            else
                log "  ✗ $(basename ${csv_file}) - 文件损坏"
                ((FAILED_FILES++))
            fi
        done
    else
        log "  ERROR: 无法解压归档文件"
        ((FAILED_FILES++))
    fi
    
    # 清理
    rm -rf "${extract_dir}"
}

# 检查备份覆盖率
check_backup_coverage() {
    log "检查备份覆盖率..."
    
    # 获取当前日期信息
    local today=$(date +%Y%m%d)
    local this_week=$(date +%Y_W%U)
    local yesterday=$(date -d "yesterday" +%Y%m%d)
    
    # 检查今日备份
    local daily_backup=$(find "${BACKUP_DIR}/daily" -name "*${today}*" -type f 2>/dev/null | head -1)
    if [ -n "${daily_backup}" ]; then
        log "  ✓ 今日备份存在"
    else
        log "  ✗ 今日备份缺失"
        ((WARNINGS++))
    fi
    
    # 检查本周全量备份
    local weekly_backup=$(find "${BACKUP_DIR}/weekly" -name "*${this_week}*" -type f 2>/dev/null | head -1)
    if [ -n "${weekly_backup}" ]; then
        log "  ✓ 本周全量备份存在"
    else
        log "  ⚠ 本周全量备份未找到"
        ((WARNINGS++))
    fi
    
    # 检查备份连续性（最近7天）
    local missing_days=0
    for i in {1..7}; do
        local check_date=$(date -d "${i} days ago" +%Y%m%d)
        local backup_exists=$(find "${BACKUP_DIR}" -name "*${check_date}*" -type f 2>/dev/null | head -1)
        if [ -z "${backup_exists}" ]; then
            ((missing_days++))
        fi
    done
    
    if [ ${missing_days} -eq 0 ]; then
        log "  ✓ 最近7天备份完整"
    else
        log "  ⚠ 最近7天有 ${missing_days} 天备份缺失"
        ((WARNINGS++))
    fi
}

# 检查存储空间
check_storage_space() {
    log "检查存储空间..."
    
    # 检查备份目录空间
    local backup_size=$(du -sh "${BACKUP_DIR}" 2>/dev/null | cut -f1)
    local available_space=$(df -h "${BACKUP_DIR}" | tail -1 | awk '{print $4}')
    local used_percent=$(df "${BACKUP_DIR}" | tail -1 | awk '{print $5}' | sed 's/%//')
    
    log "  备份总大小: ${backup_size}"
    log "  可用空间: ${available_space}"
    log "  使用率: ${used_percent}%"
    
    if [ ${used_percent} -gt 80 ]; then
        log "  WARNING: 存储空间使用率超过80%"
        ((WARNINGS++))
    fi
    
    # 检查最大的备份文件
    log "  最大的5个备份文件:"
    find "${BACKUP_DIR}" -type f -name "*.gz" -exec du -h {} \; | sort -hr | head -5 | while read size file; do
        log "    ${size} - $(basename ${file})"
    done
}

# 生成验证报告
generate_verification_report() {
    local report_file="${BACKUP_DIR}/logs/verification_report_${VERIFY_DATE}.html"
    
    cat > "${report_file}" <<EOF
<!DOCTYPE html>
<html>
<head>
    <title>备份验证报告 - ${VERIFY_DATE}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background-color: #f0f0f0; padding: 10px; }
        .summary { margin: 20px 0; }
        .pass { color: green; }
        .fail { color: red; }
        .warn { color: orange; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #4CAF50; color: white; }
    </style>
</head>
<body>
    <div class="header">
        <h1>备份验证报告</h1>
        <p>生成时间: $(date)</p>
    </div>
    
    <div class="summary">
        <h2>验证摘要</h2>
        <p>总文件数: ${TOTAL_FILES}</p>
        <p class="pass">验证通过: ${VERIFIED_FILES}</p>
        <p class="fail">验证失败: ${FAILED_FILES}</p>
        <p class="warn">警告: ${WARNINGS}</p>
    </div>
    
    <h2>详细结果</h2>
    <table>
        <tr>
            <th>文件名</th>
            <th>状态</th>
            <th>说明</th>
            <th>验证时间</th>
        </tr>
EOF
    
    # 添加验证结果
    if [ -f "${BACKUP_DIR}/logs/verify_results.csv" ]; then
        tail -n 50 "${BACKUP_DIR}/logs/verify_results.csv" | while IFS='|' read -r file status message time; do
            local status_class="pass"
            [ "${status}" = "FAIL" ] && status_class="fail"
            [ "${status}" = "WARN" ] && status_class="warn"
            
            cat >> "${report_file}" <<EOF
        <tr>
            <td>$(basename ${file})</td>
            <td class="${status_class}">${status}</td>
            <td>${message}</td>
            <td>${time}</td>
        </tr>
EOF
        done
    fi
    
    cat >> "${report_file}" <<EOF
    </table>
    
    <div class="footer">
        <p>报告生成于: $(hostname) by ${USER}</p>
    </div>
</body>
</html>
EOF
    
    log "验证报告生成: ${report_file}"
}

# 发送验证报告
send_verification_report() {
    local status="成功"
    local emoji="✅"
    
    if [ ${FAILED_FILES} -gt 0 ]; then
        status="失败"
        emoji="❌"
    elif [ ${WARNINGS} -gt 0 ]; then
        status="警告"
        emoji="⚠️"
    fi
    
    local message="${emoji} 备份验证${status}
总文件: ${TOTAL_FILES}
通过: ${VERIFIED_FILES}
失败: ${FAILED_FILES}
警告: ${WARNINGS}"
    
    # 发送钉钉通知
    if [ -n "${NOTIFICATION_WEBHOOK:-}" ]; then
        curl -s -X POST "${NOTIFICATION_WEBHOOK}" \
            -H "Content-Type: application/json" \
            -d "{
                \"msgtype\": \"text\",
                \"text\": {
                    \"content\": \"${message}\"
                }
            }" > /dev/null || true
    fi
    
    # 发送邮件（如果配置）
    if [ -n "${NOTIFICATION_EMAIL:-}" ]; then
        echo "${message}" | mail -s "备份验证报告 - ${VERIFY_DATE}" "${NOTIFICATION_EMAIL}" || true
    fi
}

# 主函数
main() {
    log "========== 开始备份验证 =========="
    log "验证时间: $(date)"
    
    # 1. 检查备份覆盖率
    check_backup_coverage
    
    # 2. 检查存储空间
    check_storage_space
    
    # 3. 验证最近的备份文件
    log "验证最近的备份文件..."
    
    # 验证今日备份
    find "${BACKUP_DIR}/daily" -name "*.gz" -mtime -1 -type f | while read file; do
        verify_file_integrity "${file}"
    done
    
    # 验证本周全量备份
    find "${BACKUP_DIR}/weekly" -name "*.gz" -mtime -7 -type f | while read file; do
        verify_file_integrity "${file}"
        
        # 对数据库备份进行恢复测试
        if [[ "${file}" =~ db_full.*\.gz$ ]]; then
            verify_database_restore "${file}"
        fi
        
        # 对 CSV 备份进行验证
        if [[ "${file}" =~ tables_csv.*\.tar\.gz$ ]]; then
            verify_csv_backup "${file}"
        fi
    done
    
    # 4. 生成验证报告
    generate_verification_report
    
    # 5. 发送验证结果
    send_verification_report
    
    # 6. 清理临时文件
    cleanup_temp_files
    
    log "========== 备份验证完成 =========="
    log "验证统计: 总计=${TOTAL_FILES}, 通过=${VERIFIED_FILES}, 失败=${FAILED_FILES}, 警告=${WARNINGS}"
    
    # 根据结果返回适当的退出码
    if [ ${FAILED_FILES} -gt 0 ]; then
        exit 1
    elif [ ${WARNINGS} -gt 0 ]; then
        exit 2
    else
        exit 0
    fi
}

# 执行主函数
main "$@"