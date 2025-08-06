-- 数据库性能监控脚本
-- 用于定期检查和优化数据库性能

-- 1. 查找慢查询（执行时间 > 1秒）
SELECT 
    query,
    mean_exec_time,
    calls,
    total_exec_time,
    rows,
    100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
FROM pg_stat_statements
WHERE mean_exec_time > 1000
ORDER BY mean_exec_time DESC
LIMIT 20;

-- 2. 查找最频繁的查询
SELECT 
    query,
    calls,
    mean_exec_time,
    total_exec_time,
    rows
FROM pg_stat_statements
ORDER BY calls DESC
LIMIT 20;

-- 3. 查找缺失索引的表
SELECT 
    schemaname,
    tablename,
    seq_scan,
    seq_tup_read,
    idx_scan,
    idx_tup_fetch,
    CASE 
        WHEN seq_scan + idx_scan = 0 THEN 0
        ELSE round(100.0 * seq_scan / (seq_scan + idx_scan), 2)
    END as seq_scan_ratio
FROM pg_stat_user_tables
WHERE seq_scan > 1000
    AND schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY seq_scan_ratio DESC;

-- 4. 检查索引使用情况
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY idx_scan ASC
LIMIT 20;

-- 5. 查看表大小和膨胀情况
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
    pg_size_pretty(pg_indexes_size(schemaname||'.'||tablename)) as indexes_size,
    round(100 * pg_indexes_size(schemaname||'.'||tablename) / 
          nullif(pg_total_relation_size(schemaname||'.'||tablename), 0), 2) as index_ratio_percent
FROM pg_stat_user_tables
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- 6. 检查死锁和锁等待
SELECT 
    blocked_locks.pid AS blocked_pid,
    blocked_activity.usename AS blocked_user,
    blocking_locks.pid AS blocking_pid,
    blocking_activity.usename AS blocking_user,
    blocked_activity.query AS blocked_statement,
    blocking_activity.query AS blocking_statement
FROM pg_catalog.pg_locks blocked_locks
JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
JOIN pg_catalog.pg_locks blocking_locks 
    ON blocking_locks.locktype = blocked_locks.locktype
    AND blocking_locks.database IS NOT DISTINCT FROM blocked_locks.database
    AND blocking_locks.relation IS NOT DISTINCT FROM blocked_locks.relation
    AND blocking_locks.page IS NOT DISTINCT FROM blocked_locks.page
    AND blocking_locks.tuple IS NOT DISTINCT FROM blocked_locks.tuple
    AND blocking_locks.virtualxid IS NOT DISTINCT FROM blocked_locks.virtualxid
    AND blocking_locks.transactionid IS NOT DISTINCT FROM blocked_locks.transactionid
    AND blocking_locks.classid IS NOT DISTINCT FROM blocked_locks.classid
    AND blocking_locks.objid IS NOT DISTINCT FROM blocked_locks.objid
    AND blocking_locks.objsubid IS NOT DISTINCT FROM blocked_locks.objsubid
    AND blocking_locks.pid != blocked_locks.pid
JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
WHERE NOT blocked_locks.granted;

-- 7. 检查连接数和活动会话
SELECT 
    state,
    count(*) as count,
    max(now() - query_start) as max_duration,
    avg(now() - query_start) as avg_duration
FROM pg_stat_activity
WHERE state != 'idle'
GROUP BY state
ORDER BY count DESC;

-- 8. 检查缓存命中率
SELECT 
    'index hit rate' AS name,
    sum(idx_blks_hit) / nullif(sum(idx_blks_hit + idx_blks_read), 0) AS ratio
FROM pg_statio_user_indexes
UNION ALL
SELECT 
    'table hit rate' AS name,
    sum(heap_blks_hit) / nullif(sum(heap_blks_hit + heap_blks_read), 0) AS ratio
FROM pg_statio_user_tables;

-- 9. 查看长时间运行的查询
SELECT 
    pid,
    now() - pg_stat_activity.query_start AS duration,
    query,
    state
FROM pg_stat_activity
WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes'
    AND state != 'idle'
ORDER BY duration DESC;

-- 10. 检查表的自动清理状态
SELECT 
    schemaname,
    tablename,
    last_vacuum,
    last_autovacuum,
    last_analyze,
    last_autoanalyze,
    vacuum_count,
    autovacuum_count,
    analyze_count,
    autoanalyze_count
FROM pg_stat_user_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY last_autovacuum ASC NULLS FIRST;

-- 11. 生成性能优化建议
WITH table_stats AS (
    SELECT 
        schemaname,
        tablename,
        seq_scan,
        idx_scan,
        n_tup_ins + n_tup_upd + n_tup_del as total_writes
    FROM pg_stat_user_tables
    WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
)
SELECT 
    'Consider adding index on ' || schemaname || '.' || tablename AS suggestion,
    'High sequential scan ratio' AS reason,
    seq_scan AS seq_scans,
    idx_scan AS index_scans
FROM table_stats
WHERE seq_scan > 1000 
    AND seq_scan > idx_scan * 5
    AND total_writes < seq_scan / 10
ORDER BY seq_scan DESC
LIMIT 10;