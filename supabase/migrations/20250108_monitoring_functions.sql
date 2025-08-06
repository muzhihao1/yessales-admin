-- 监控系统辅助函数

-- 获取数据库统计信息
CREATE OR REPLACE FUNCTION get_database_stats()
RETURNS TABLE (
  total_size BIGINT,
  table_count INTEGER,
  index_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pg_database_size(current_database()) as total_size,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public')::INTEGER as table_count,
    (SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public')::INTEGER as index_count;
END;
$$ LANGUAGE plpgsql;

-- 获取当前连接数
CREATE OR REPLACE FUNCTION get_connection_count()
RETURNS TABLE (
  count INTEGER,
  max_connections INTEGER,
  usage_percent NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM pg_stat_activity)::INTEGER as count,
    current_setting('max_connections')::INTEGER as max_connections,
    ROUND(((SELECT COUNT(*) FROM pg_stat_activity)::NUMERIC / current_setting('max_connections')::NUMERIC) * 100, 2) as usage_percent;
END;
$$ LANGUAGE plpgsql;

-- 获取慢查询统计
CREATE OR REPLACE FUNCTION get_slow_queries(duration_ms INTEGER DEFAULT 1000)
RETURNS TABLE (
  query TEXT,
  calls BIGINT,
  total_time NUMERIC,
  mean_time NUMERIC,
  max_time NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pg_stat_statements.query,
    pg_stat_statements.calls,
    pg_stat_statements.total_exec_time as total_time,
    pg_stat_statements.mean_exec_time as mean_time,
    pg_stat_statements.max_exec_time as max_time
  FROM pg_stat_statements
  WHERE pg_stat_statements.mean_exec_time > duration_ms
  ORDER BY pg_stat_statements.mean_exec_time DESC
  LIMIT 20;
EXCEPTION
  WHEN undefined_table THEN
    -- pg_stat_statements 扩展未启用
    RETURN;
END;
$$ LANGUAGE plpgsql;

-- 获取表大小统计
CREATE OR REPLACE FUNCTION get_table_sizes()
RETURNS TABLE (
  table_name TEXT,
  size_bytes BIGINT,
  size_pretty TEXT,
  row_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    schemaname||'.'||tablename AS table_name,
    pg_total_relation_size(schemaname||'.'||tablename) AS size_bytes,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size_pretty,
    n_live_tup AS row_count
  FROM pg_stat_user_tables
  ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
  LIMIT 20;
END;
$$ LANGUAGE plpgsql;

-- 聚合指标数据（用于仪表板）
CREATE OR REPLACE FUNCTION get_metrics_summary(
  p_metric_source TEXT,
  p_metric_name TEXT,
  p_time_range INTERVAL DEFAULT '24 hours'
)
RETURNS TABLE (
  metric_name TEXT,
  current_value NUMERIC,
  avg_value NUMERIC,
  min_value NUMERIC,
  max_value NUMERIC,
  data_points INTEGER
) AS $$
BEGIN
  IF p_metric_source = 'system' THEN
    RETURN QUERY
    SELECT 
      p_metric_name,
      (SELECT metric_value FROM system_metrics 
       WHERE metric_name = p_metric_name 
       ORDER BY recorded_at DESC LIMIT 1) as current_value,
      AVG(metric_value) as avg_value,
      MIN(metric_value) as min_value,
      MAX(metric_value) as max_value,
      COUNT(*)::INTEGER as data_points
    FROM system_metrics
    WHERE metric_name = p_metric_name
      AND recorded_at >= NOW() - p_time_range;
  ELSE
    RETURN QUERY
    SELECT 
      p_metric_name,
      (SELECT metric_value FROM business_metrics 
       WHERE metric_name = p_metric_name 
       ORDER BY recorded_at DESC LIMIT 1) as current_value,
      AVG(metric_value) as avg_value,
      MIN(metric_value) as min_value,
      MAX(metric_value) as max_value,
      COUNT(*)::INTEGER as data_points
    FROM business_metrics
    WHERE metric_name = p_metric_name
      AND recorded_at >= NOW() - p_time_range;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 获取时间序列数据（用于图表）
CREATE OR REPLACE FUNCTION get_metrics_timeseries(
  p_metric_source TEXT,
  p_metric_name TEXT,
  p_time_range INTERVAL DEFAULT '24 hours',
  p_interval TEXT DEFAULT '1 hour'
)
RETURNS TABLE (
  time_bucket TIMESTAMPTZ,
  avg_value NUMERIC,
  min_value NUMERIC,
  max_value NUMERIC
) AS $$
BEGIN
  IF p_metric_source = 'system' THEN
    RETURN QUERY
    SELECT 
      date_trunc(p_interval, recorded_at) as time_bucket,
      AVG(metric_value) as avg_value,
      MIN(metric_value) as min_value,
      MAX(metric_value) as max_value
    FROM system_metrics
    WHERE metric_name = p_metric_name
      AND recorded_at >= NOW() - p_time_range
    GROUP BY date_trunc(p_interval, recorded_at)
    ORDER BY time_bucket;
  ELSE
    RETURN QUERY
    SELECT 
      date_trunc(p_interval, recorded_at) as time_bucket,
      AVG(metric_value) as avg_value,
      MIN(metric_value) as min_value,
      MAX(metric_value) as max_value
    FROM business_metrics
    WHERE metric_name = p_metric_name
      AND recorded_at >= NOW() - p_time_range
    GROUP BY date_trunc(p_interval, recorded_at)
    ORDER BY time_bucket;
  END IF;
END;
$$ LANGUAGE plpgsql;