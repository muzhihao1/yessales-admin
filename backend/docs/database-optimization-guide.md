# 数据库优化实施指南

## 概述

本指南详细说明如何实施数据库性能优化，包括索引创建、查询优化和性能监控。

## 1. 执行优化步骤

### 1.1 创建性能索引

首先执行索引创建迁移：

```bash
# 在 Supabase 项目中执行
supabase db push

# 或者直接在 SQL 编辑器中执行
# 运行 migrations/20240102000000_performance_indexes.sql
```

### 1.2 创建优化视图

创建查询优化视图和物化视图：

```bash
# 运行 migrations/20240103000000_query_optimization_views.sql
```

### 1.3 验证索引创建

```sql
-- 查看所有索引
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

## 2. 性能监控

### 2.1 定期运行性能监控脚本

```bash
# 每周运行一次性能监控
psql -d your_database -f scripts/monitor-database-performance.sql > performance_report_$(date +%Y%m%d).txt
```

### 2.2 关键性能指标监控

#### 慢查询监控
```sql
-- 实时查看慢查询
SELECT 
    query,
    mean_exec_time,
    calls
FROM pg_stat_statements
WHERE mean_exec_time > 1000
ORDER BY mean_exec_time DESC
LIMIT 10;
```

#### 缓存命中率
```sql
-- 目标：> 95%
SELECT 
    sum(heap_blks_hit) / nullif(sum(heap_blks_hit + heap_blks_read), 0) AS cache_hit_ratio
FROM pg_statio_user_tables;
```

### 2.3 设置告警

在 Supabase 控制台中设置以下告警：

1. **查询响应时间**: 平均响应时间 > 1秒
2. **连接数**: 活跃连接数 > 80
3. **缓存命中率**: 缓存命中率 < 90%
4. **死锁检测**: 任何死锁发生

## 3. 查询优化实施

### 3.1 部署优化查询

```sql
-- 在数据库中创建所有优化查询
\i scripts/optimize-common-queries.sql

-- 预热缓存
SELECT warmup_cache();
```

### 3.2 更新应用代码

更新 API 服务层使用优化后的查询：

```typescript
// 示例：使用优化的报价单列表查询
async getQuotes(page: number = 1, pageSize: number = 20) {
  const offset = (page - 1) * pageSize;
  
  const { data, error } = await supabase
    .rpc('optimized_quote_list', { 
      limit_param: pageSize, 
      offset_param: offset 
    });
    
  return { data, error };
}
```

## 4. 性能测试

### 4.1 基准测试

运行性能基准测试：

```sql
-- 测试查询性能
SELECT * FROM test_query_performance(
    'SELECT * FROM quotes ORDER BY created_at DESC LIMIT 100', 
    10
);

-- 对比优化前后
SELECT 
    'Before' as version,
    avg(execution_time) as avg_time,
    min(execution_time) as min_time,
    max(execution_time) as max_time
FROM test_query_performance('原始查询', 10)
UNION ALL
SELECT 
    'After' as version,
    avg(execution_time) as avg_time,
    min(execution_time) as min_time,
    max(execution_time) as max_time
FROM test_query_performance('优化查询', 10);
```

### 4.2 负载测试

使用 k6 进行负载测试：

```javascript
// k6-performance-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '2m', target: 100 }, // 逐步增加到100个虚拟用户
    { duration: '5m', target: 100 }, // 保持100个用户5分钟
    { duration: '2m', target: 0 },   // 逐步降低到0
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'], // 95%的请求必须在1秒内完成
    http_req_failed: ['rate<0.1'],     // 错误率必须低于10%
  },
};

export default function () {
  // 测试报价单列表API
  let res = http.get('http://localhost:54321/rest/v1/quotes?limit=20');
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 1000ms': (r) => r.timings.duration < 1000,
  });
  
  sleep(1);
}
```

运行测试：
```bash
k6 run k6-performance-test.js
```

## 5. 维护计划

### 5.1 日常维护

```sql
-- 每日执行
VACUUM ANALYZE;

-- 刷新物化视图
SELECT refresh_monthly_sales_report();
```

### 5.2 周维护

1. 运行性能监控脚本
2. 检查慢查询日志
3. 分析索引使用情况
4. 清理无用索引

### 5.3 月度优化

1. 分析查询模式变化
2. 调整索引策略
3. 优化新出现的慢查询
4. 更新物化视图定义

## 6. 常见问题处理

### 问题1: 索引未被使用

```sql
-- 强制使用索引
SET enable_seqscan = OFF;
EXPLAIN ANALYZE SELECT ...;
SET enable_seqscan = ON;

-- 更新统计信息
ANALYZE table_name;
```

### 问题2: 查询计划不优

```sql
-- 重置查询计划
DISCARD PLANS;

-- 调整统计目标
ALTER TABLE table_name ALTER COLUMN column_name SET STATISTICS 1000;
ANALYZE table_name;
```

### 问题3: 连接池耗尽

```sql
-- 查看连接状态
SELECT * FROM v_database_connections;

-- 终止空闲连接
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE state = 'idle' 
  AND state_change < now() - interval '10 minutes';
```

## 7. 性能优化检查清单

- [ ] 所有索引已创建并验证
- [ ] 优化视图已部署
- [ ] 物化视图刷新计划已设置
- [ ] 查询优化脚本已部署
- [ ] 应用代码已更新使用优化查询
- [ ] 性能基准测试已完成
- [ ] 负载测试通过
- [ ] 监控告警已配置
- [ ] 维护计划已制定
- [ ] 团队已培训相关知识

## 8. 参考命令

```bash
# 连接到 Supabase 数据库
psql postgresql://postgres:[password]@[host]:[port]/postgres

# 执行 SQL 文件
psql -U postgres -d postgres -f script.sql

# 导出查询计划
EXPLAIN (ANALYZE, BUFFERS) SELECT ...;

# 查看实时活动
SELECT * FROM pg_stat_activity WHERE state != 'idle';

# 查看表统计信息
SELECT * FROM pg_stat_user_tables WHERE schemaname = 'public';
```

---

通过遵循本指南，可以系统地实施数据库性能优化，确保耶氏台球报价系统在生产环境中高效运行。