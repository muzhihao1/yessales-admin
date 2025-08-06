# YesSales 生产部署清单

## 概述

本清单用于确保 YesSales 系统在部署到生产环境前完成所有必要的准备工作。请按顺序逐项检查。

## 部署前检查清单

### 1. 代码准备 ✓

- [ ] 所有功能已开发完成并通过测试
- [ ] 代码已通过 Code Review
- [ ] 无未解决的 Critical/High 级别 Bug
- [ ] 所有临时代码和调试信息已移除
- [ ] 版本号已更新（package.json）
- [ ] CHANGELOG 已更新

### 2. 环境配置 ⚙️

#### 2.1 Supabase 配置
- [ ] 生产项目已创建
- [ ] 环境变量已配置：
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`（仅服务端）
  - [ ] `DATABASE_URL`
- [ ] 自定义域名已配置（如适用）

#### 2.2 第三方服务
- [ ] 钉钉 Webhook 已配置
- [ ] 邮件服务已配置（如使用）
- [ ] 文件存储服务已配置
- [ ] CDN 已配置（如使用）

### 3. 数据库部署 🗄️

- [ ] 所有 migrations 已准备就绪
- [ ] 执行顺序：
  ```bash
  # 1. 基础表结构
  supabase migration up 20250105_initial_schema.sql
  
  # 2. 安全配置
  supabase migration up 20250106_security_policies.sql
  
  # 3. 性能优化
  supabase migration up 20250107_performance_indexes.sql
  
  # 4. 触发器和函数
  supabase migration up 20250107_backup_triggers.sql
  
  # 5. 监控系统
  supabase migration up 20250108_monitoring_tables.sql
  supabase migration up 20250108_monitoring_functions.sql
  ```
- [ ] 初始数据已准备（管理员账号、基础配置等）
- [ ] 数据库备份策略已配置
- [ ] 数据库访问权限已正确设置

### 4. Edge Functions 部署 🚀

- [ ] 所有 Edge Functions 已测试
- [ ] 部署命令：
  ```bash
  # 备份函数
  supabase functions deploy database-backup
  supabase functions deploy backup-to-storage
  
  # 监控函数
  supabase functions deploy collect-metrics
  supabase functions deploy check-alerts
  ```
- [ ] 函数权限已正确配置
- [ ] 函数环境变量已设置

### 5. 应用部署 📱

#### 5.1 构建检查
- [ ] 生产构建成功：`npm run build`
- [ ] 无构建警告或错误
- [ ] Bundle 大小在合理范围内
- [ ] 所有依赖版本已锁定（package-lock.json）

#### 5.2 部署配置
- [ ] 部署平台已选择（Vercel/Netlify/其他）
- [ ] 环境变量已在部署平台配置
- [ ] 自定义域名已配置
- [ ] SSL 证书已配置

### 6. 安全检查 🔒

- [ ] 所有敏感信息使用环境变量
- [ ] RLS 策略已启用并测试
- [ ] API 密钥已正确保护
- [ ] CORS 配置正确
- [ ] 输入验证已实施
- [ ] SQL 注入防护已实施
- [ ] XSS 防护已实施
- [ ] HTTPS 强制启用
- [ ] 安全响应头已配置

### 7. 性能优化 ⚡

- [ ] 数据库索引已创建
- [ ] 查询性能已优化
- [ ] 图片已优化和压缩
- [ ] 静态资源已启用缓存
- [ ] API 响应时间符合要求（< 2秒）
- [ ] 页面加载时间符合要求（< 3秒）

### 8. 监控配置 📊

- [ ] 监控系统已部署
- [ ] 告警规则已配置
- [ ] 通知渠道已测试
- [ ] 定时任务已配置：
  ```sql
  -- pg_cron 配置
  SELECT cron.schedule('collect-metrics', '*/5 * * * *', 'SELECT collect_metrics();');
  SELECT cron.schedule('check-alerts', '*/5 * * * *', 'SELECT check_alerts();');
  SELECT cron.schedule('cleanup-metrics', '0 2 * * *', 'SELECT cleanup_old_metrics();');
  ```
- [ ] 日志收集已配置

### 9. 备份和恢复 💾

- [ ] 自动备份已配置
- [ ] 备份存储位置已确认
- [ ] 恢复流程已测试
- [ ] 备份监控已启用
- [ ] 灾难恢复计划已制定

### 10. 文档准备 📚

- [ ] API 文档已更新
- [ ] 用户手册已准备
- [ ] 管理员手册已准备
- [ ] 部署文档已完成
- [ ] 故障处理手册已准备

### 11. 测试验证 ✅

#### 11.1 功能测试
- [ ] 用户注册/登录流程
- [ ] 产品管理功能
- [ ] 报价单生成功能
- [ ] 文件上传/下载功能
- [ ] 权限控制功能

#### 11.2 性能测试
- [ ] 负载测试已完成
- [ ] 并发用户测试已完成
- [ ] 响应时间测试已完成

#### 11.3 安全测试
- [ ] 渗透测试已完成（如适用）
- [ ] 权限越界测试已完成
- [ ] 输入验证测试已完成

### 12. 发布准备 🎯

- [ ] 发布时间已确定
- [ ] 发布通知已准备
- [ ] 回滚方案已准备
- [ ] 紧急联系人已确定
- [ ] 发布后验证计划已制定

## 部署步骤

### 步骤 1: 数据库部署
```bash
# 1. 备份现有数据（如有）
pg_dump $OLD_DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. 执行 migrations
supabase db push

# 3. 验证表结构
supabase db diff

# 4. 导入初始数据
psql $DATABASE_URL < initial_data.sql
```

### 步骤 2: Edge Functions 部署
```bash
# 1. 部署所有函数
supabase functions deploy --all

# 2. 验证函数状态
supabase functions list
```

### 步骤 3: 应用部署
```bash
# 1. 构建应用
npm run build

# 2. 部署到 Vercel（示例）
vercel --prod

# 3. 验证部署
curl https://your-domain.com/api/health
```

### 步骤 4: 部署后验证
```bash
# 1. 检查应用健康状态
curl https://your-domain.com/api/health

# 2. 测试核心功能
npm run test:e2e

# 3. 检查监控指标
SELECT * FROM system_metrics ORDER BY created_at DESC LIMIT 10;
```

## 回滚方案

如果部署出现问题，执行以下回滚步骤：

1. **应用回滚**：
   ```bash
   # Vercel 回滚到上一个版本
   vercel rollback
   ```

2. **数据库回滚**：
   ```bash
   # 恢复备份
   psql $DATABASE_URL < backup_latest.sql
   ```

3. **Edge Functions 回滚**：
   ```bash
   # 部署上一个版本的函数
   git checkout [previous-tag]
   supabase functions deploy --all
   ```

## 紧急联系人

- 技术负责人：[姓名] - [电话]
- 运维负责人：[姓名] - [电话]
- 产品负责人：[姓名] - [电话]

## 检查确认

- [ ] 我已完成所有检查项
- [ ] 所有测试已通过
- [ ] 回滚方案已准备就绪
- [ ] 团队已准备就绪

**部署负责人签字**：________________

**日期**：________________