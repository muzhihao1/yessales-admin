# 监控系统定时任务配置

## 概述

监控系统需要配置以下定时任务来自动收集指标和检查告警。

## 定时任务列表

### 1. 指标收集任务

**频率**: 每5分钟执行一次  
**Cron表达式**: `*/5 * * * *`  
**Edge Function**: `collect-metrics`

```bash
# Supabase Cron Job 配置
curl -X POST https://[PROJECT_REF].supabase.co/functions/v1/collect-metrics \
  -H "Authorization: Bearer [SERVICE_ROLE_KEY]" \
  -H "Content-Type: application/json"
```

### 2. 告警检查任务

**频率**: 每5分钟执行一次  
**Cron表达式**: `*/5 * * * *`  
**Edge Function**: `check-alerts`

```bash
# Supabase Cron Job 配置
curl -X POST https://[PROJECT_REF].supabase.co/functions/v1/check-alerts \
  -H "Authorization: Bearer [SERVICE_ROLE_KEY]" \
  -H "Content-Type: application/json"
```

### 3. 指标清理任务

**频率**: 每天凌晨2点执行  
**Cron表达式**: `0 2 * * *`  
**SQL脚本**: 清理超过30天的历史数据

```sql
-- 清理超过30天的系统指标
DELETE FROM system_metrics 
WHERE recorded_at < NOW() - INTERVAL '30 days';

-- 清理超过30天的业务指标
DELETE FROM business_metrics 
WHERE recorded_at < NOW() - INTERVAL '30 days';

-- 清理超过90天的告警历史
DELETE FROM alert_history 
WHERE created_at < NOW() - INTERVAL '90 days';
```

## 配置方法

### 使用 pg_cron 扩展

1. 启用 pg_cron 扩展：
```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;
```

2. 配置定时任务：
```sql
-- 指标收集任务
SELECT cron.schedule(
  'collect-metrics',
  '*/5 * * * *',
  $$
    SELECT net.http_post(
      url := 'https://[PROJECT_REF].supabase.co/functions/v1/collect-metrics',
      headers := jsonb_build_object(
        'Authorization', 'Bearer [SERVICE_ROLE_KEY]',
        'Content-Type', 'application/json'
      )
    );
  $$
);

-- 告警检查任务
SELECT cron.schedule(
  'check-alerts',
  '*/5 * * * *',
  $$
    SELECT net.http_post(
      url := 'https://[PROJECT_REF].supabase.co/functions/v1/check-alerts',
      headers := jsonb_build_object(
        'Authorization', 'Bearer [SERVICE_ROLE_KEY]',
        'Content-Type', 'application/json'
      )
    );
  $$
);

-- 数据清理任务
SELECT cron.schedule(
  'cleanup-metrics',
  '0 2 * * *',
  $$
    DELETE FROM system_metrics WHERE recorded_at < NOW() - INTERVAL '30 days';
    DELETE FROM business_metrics WHERE recorded_at < NOW() - INTERVAL '30 days';
    DELETE FROM alert_history WHERE created_at < NOW() - INTERVAL '90 days';
  $$
);
```

### 使用外部调度器

如果 pg_cron 不可用，可以使用外部调度器：

1. **GitHub Actions**:
```yaml
name: Monitoring Tasks

on:
  schedule:
    - cron: '*/5 * * * *'

jobs:
  collect-metrics:
    runs-on: ubuntu-latest
    steps:
      - name: Collect Metrics
        run: |
          curl -X POST ${{ secrets.SUPABASE_URL }}/functions/v1/collect-metrics \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_KEY }}" \
            -H "Content-Type: application/json"
            
      - name: Check Alerts
        run: |
          curl -X POST ${{ secrets.SUPABASE_URL }}/functions/v1/check-alerts \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_KEY }}" \
            -H "Content-Type: application/json"
```

2. **系统 Crontab**:
```bash
# 添加到服务器的 crontab
*/5 * * * * /usr/bin/curl -X POST https://[PROJECT_REF].supabase.co/functions/v1/collect-metrics -H "Authorization: Bearer [SERVICE_ROLE_KEY]"
*/5 * * * * /usr/bin/curl -X POST https://[PROJECT_REF].supabase.co/functions/v1/check-alerts -H "Authorization: Bearer [SERVICE_ROLE_KEY]"
```

## 监控定时任务

### 检查任务状态

```sql
-- 查看所有定时任务
SELECT * FROM cron.job;

-- 查看任务执行历史
SELECT * FROM cron.job_run_details 
ORDER BY start_time DESC 
LIMIT 50;
```

### 任务失败处理

1. 检查 Edge Function 日志
2. 验证服务密钥是否正确
3. 确认网络连接正常
4. 查看错误详情并修复

## 注意事项

1. **服务密钥安全**: 永远不要在客户端代码中暴露服务密钥
2. **频率限制**: 避免过于频繁的调用，以免影响性能
3. **错误处理**: 确保任务有适当的错误处理和重试机制
4. **监控任务本身**: 设置额外的监控来确保定时任务正常运行