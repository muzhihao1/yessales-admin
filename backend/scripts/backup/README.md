# 备份脚本使用指南

## 概述

本目录包含耶氏台球报价系统的自动化备份脚本，实现数据库和文件的定期备份、验证和恢复功能。

## 脚本说明

### 1. daily-backup.sh - 每日增量备份
- 功能：执行数据库和文件的增量备份
- 运行时间：每日凌晨 3:00
- 保留期：7天

### 2. weekly-backup.sh - 每周全量备份
- 功能：执行完整的数据库和文件备份
- 运行时间：每周日凌晨 2:00
- 保留期：30天

### 3. restore-backup.sh - 数据恢复
- 功能：从备份文件恢复数据
- 支持：全量恢复、增量恢复、表级恢复、PITR

### 4. verify-backup.sh - 备份验证
- 功能：验证备份文件完整性和可恢复性
- 运行时间：每日早上 6:00

## 快速开始

### 1. 环境准备

```bash
# 创建备份目录
sudo mkdir -p /backup/postgres/{daily,weekly,logs,restore_safety}
sudo chown -R postgres:postgres /backup/postgres

# 安装依赖
sudo apt-get update
sudo apt-get install postgresql-client gzip curl jq

# 赋予脚本执行权限
chmod +x *.sh
```

### 2. 配置环境变量

创建 `.env.backup` 文件：

```bash
cp .env.backup.example .env.backup
vim .env.backup

# 填写以下配置
POSTGRES_HOST=db.xxxxx.supabase.co
POSTGRES_PORT=5432
POSTGRES_DB=postgres
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password

BACKUP_DIR=/backup/postgres
BACKUP_RETENTION_DAYS=30

# 通知配置（可选）
NOTIFICATION_WEBHOOK=https://dingtalk.com/webhook/xxx
NOTIFICATION_EMAIL=admin@yessales.com
```

### 3. 测试备份脚本

```bash
# 测试每日备份
./daily-backup.sh

# 测试每周备份
./weekly-backup.sh

# 验证备份
./verify-backup.sh
```

### 4. 设置定时任务

```bash
# 编辑 crontab
crontab -e

# 添加备份任务（参考 backup-cron.conf）
0 3 * * * /path/to/daily-backup.sh
0 2 * * 0 /path/to/weekly-backup.sh
```

## 使用示例

### 执行手动备份

```bash
# 立即执行每日备份
./daily-backup.sh

# 立即执行全量备份
./weekly-backup.sh
```

### 恢复数据

```bash
# 查看帮助
./restore-backup.sh --help

# 全量恢复
./restore-backup.sh -t full -f /backup/weekly/db_full_2024_W01.sql.gz -d postgres

# 恢复特定表
./restore-backup.sh -t table -f /backup/daily/tables_csv_20240115.tar.gz -T quotes

# 模拟恢复（不实际执行）
./restore-backup.sh -t full -f backup.sql.gz --dry-run
```

### 验证备份

```bash
# 手动验证所有备份
./verify-backup.sh

# 查看验证报告
cat /backup/postgres/logs/verification_report_*.html
```

## 监控和告警

### 检查备份状态

```bash
# 查看最近的备份
ls -lht /backup/postgres/daily/ | head -10

# 查看备份日志
tail -f /backup/postgres/logs/backup_*.log

# 检查存储空间
df -h /backup/postgres
```

### 告警配置

1. **钉钉告警**
   - 配置 NOTIFICATION_WEBHOOK
   - 备份失败时自动发送通知

2. **邮件告警**
   - 配置 NOTIFICATION_EMAIL
   - 需要配置系统邮件服务

## 故障排查

### 常见问题

1. **备份失败：权限不足**
```bash
# 检查目录权限
ls -la /backup/postgres

# 修复权限
sudo chown -R postgres:postgres /backup/postgres
```

2. **备份失败：空间不足**
```bash
# 清理过期备份
find /backup/postgres -name "*.gz" -mtime +30 -delete

# 检查大文件
du -sh /backup/postgres/* | sort -hr | head -10
```

3. **数据库连接失败**
```bash
# 测试连接
PGPASSWORD=your_password psql -h host -U user -d postgres -c "SELECT 1"

# 检查网络
ping db.xxxxx.supabase.co
```

### 日志位置

- 备份日志：`/backup/postgres/logs/backup_*.log`
- 恢复日志：`/backup/postgres/logs/restore_*.log`
- 验证日志：`/backup/postgres/logs/verify_*.log`
- Cron 日志：`/var/log/cron` 或 `/backup/postgres/logs/cron.log`

## 最佳实践

1. **定期测试恢复**
   - 每月至少执行一次完整恢复测试
   - 记录恢复时间和结果

2. **监控备份大小**
   - 备份大小异常变化可能表示问题
   - 设置大小变化告警

3. **多地备份**
   - 本地备份用于快速恢复
   - 云存储备份用于灾难恢复

4. **文档更新**
   - 记录任何配置变更
   - 更新恢复流程文档

## 性能优化

1. **并行备份**
   - 大表可以分区并行备份
   - 使用 `--jobs` 参数

2. **压缩优化**
   - 调整压缩级别平衡速度和大小
   - 使用 `pigz` 替代 `gzip` 提升性能

3. **网络优化**
   - 使用内网连接减少延迟
   - 避免高峰期执行备份

## 安全建议

1. **加密备份**
```bash
# 加密备份文件
gpg --encrypt -r admin@yessales.com backup.sql.gz

# 解密备份文件
gpg --decrypt backup.sql.gz.gpg > backup.sql.gz
```

2. **访问控制**
   - 限制备份目录访问权限
   - 使用专用备份用户

3. **审计日志**
   - 记录所有备份和恢复操作
   - 定期审查访问日志

## 维护计划

### 每日检查
- [ ] 备份任务执行状态
- [ ] 存储空间使用率
- [ ] 最新备份文件

### 每周任务
- [ ] 验证备份完整性
- [ ] 清理过期备份
- [ ] 更新备份文档

### 每月任务
- [ ] 完整恢复演练
- [ ] 备份策略评审
- [ ] 性能优化分析

## 联系支持

- 技术支持：tech@yessales.com
- 紧急联系：13800138000
- 文档更新：https://github.com/yessales/backup-docs