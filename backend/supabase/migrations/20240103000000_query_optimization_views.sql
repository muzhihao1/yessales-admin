-- 查询优化视图和物化视图
-- 预聚合常用查询以提高性能

-- 1. 报价单统计视图
CREATE OR REPLACE VIEW v_quote_statistics AS
SELECT 
    date_trunc('day', created_at) as date,
    status,
    COUNT(*) as quote_count,
    SUM(total_price) as total_amount,
    AVG(total_price) as avg_amount,
    COUNT(DISTINCT customer_id) as unique_customers
FROM quotes
GROUP BY date_trunc('day', created_at), status;

COMMENT ON VIEW v_quote_statistics IS '报价单每日统计视图';

-- 2. 销售人员业绩视图
CREATE OR REPLACE VIEW v_sales_performance AS
SELECT 
    u.id as sales_id,
    u.name as sales_name,
    u.username,
    COUNT(q.id) as quote_count,
    COUNT(CASE WHEN q.status = 'approved' THEN 1 END) as approved_count,
    COUNT(CASE WHEN q.status = 'pending' THEN 1 END) as pending_count,
    SUM(q.total_price) as total_sales_amount,
    AVG(q.total_price) as avg_quote_amount,
    COUNT(DISTINCT q.customer_id) as unique_customers,
    MAX(q.created_at) as last_quote_date
FROM users u
LEFT JOIN quotes q ON u.id = q.sales_id
WHERE u.role = 'sales'
GROUP BY u.id, u.name, u.username;

COMMENT ON VIEW v_sales_performance IS '销售人员业绩统计视图';

-- 3. 客户报价历史视图
CREATE OR REPLACE VIEW v_customer_quote_history AS
SELECT 
    c.id as customer_id,
    c.name as customer_name,
    c.phone as customer_phone,
    COUNT(q.id) as quote_count,
    SUM(q.total_price) as total_amount,
    AVG(q.total_price) as avg_amount,
    MAX(q.created_at) as last_quote_date,
    ARRAY_AGG(q.status ORDER BY q.created_at DESC) as status_history
FROM customers c
LEFT JOIN quotes q ON c.id = q.customer_id
GROUP BY c.id, c.name, c.phone;

COMMENT ON VIEW v_customer_quote_history IS '客户报价历史统计视图';

-- 4. 产品销售统计视图
CREATE OR REPLACE VIEW v_product_sales_stats AS
SELECT 
    p.id as product_id,
    p.name as product_name,
    p.category,
    p.model,
    COUNT(DISTINCT qi.quote_id) as quote_count,
    SUM(qi.quantity) as total_quantity,
    SUM(qi.total_price) as total_sales_amount,
    AVG(qi.unit_price) as avg_unit_price
FROM products p
LEFT JOIN quote_items qi ON p.name = qi.name AND qi.type = 'product'
GROUP BY p.id, p.name, p.category, p.model;

COMMENT ON VIEW v_product_sales_stats IS '产品销售统计视图';

-- 5. 最近报价单详情视图（带完整关联信息）
CREATE OR REPLACE VIEW v_recent_quotes_detail AS
SELECT 
    q.id,
    q.quote_no,
    q.created_at,
    q.status,
    q.total_price,
    q.remark,
    c.name as customer_name,
    c.phone as customer_phone,
    u.name as sales_name,
    u.username as sales_username,
    COUNT(qi.id) as item_count,
    STRING_AGG(DISTINCT qi.name, ', ') as item_names
FROM quotes q
JOIN customers c ON q.customer_id = c.id
JOIN users u ON q.sales_id = u.id
LEFT JOIN quote_items qi ON q.id = qi.quote_id
WHERE q.created_at > CURRENT_DATE - INTERVAL '30 days'
GROUP BY q.id, q.quote_no, q.created_at, q.status, q.total_price, q.remark,
         c.name, c.phone, u.name, u.username
ORDER BY q.created_at DESC;

COMMENT ON VIEW v_recent_quotes_detail IS '最近30天报价单详情视图';

-- 6. 物化视图：月度销售报表（定期刷新）
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_monthly_sales_report AS
SELECT 
    date_trunc('month', q.created_at) as month,
    COUNT(DISTINCT q.id) as total_quotes,
    COUNT(DISTINCT CASE WHEN q.status = 'approved' THEN q.id END) as approved_quotes,
    COUNT(DISTINCT q.customer_id) as unique_customers,
    COUNT(DISTINCT q.sales_id) as active_sales,
    SUM(q.total_price) as total_revenue,
    AVG(q.total_price) as avg_quote_value,
    SUM(CASE WHEN q.status = 'approved' THEN q.total_price ELSE 0 END) as approved_revenue,
    COUNT(DISTINCT qi.name) as unique_products_sold,
    SUM(qi.quantity) as total_items_sold
FROM quotes q
LEFT JOIN quote_items qi ON q.id = qi.quote_id
GROUP BY date_trunc('month', q.created_at)
WITH DATA;

-- 创建索引以加速物化视图查询
CREATE INDEX idx_mv_monthly_sales_month ON mv_monthly_sales_report(month DESC);

COMMENT ON MATERIALIZED VIEW mv_monthly_sales_report IS '月度销售报表物化视图';

-- 创建刷新物化视图的函数
CREATE OR REPLACE FUNCTION refresh_monthly_sales_report()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_monthly_sales_report;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION refresh_monthly_sales_report() IS '刷新月度销售报表物化视图';

-- 7. 创建查询性能监控表
CREATE TABLE IF NOT EXISTS query_performance_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    query_hash TEXT NOT NULL,
    query_text TEXT NOT NULL,
    execution_count INTEGER DEFAULT 1,
    total_time_ms NUMERIC DEFAULT 0,
    mean_time_ms NUMERIC DEFAULT 0,
    min_time_ms NUMERIC DEFAULT 0,
    max_time_ms NUMERIC DEFAULT 0,
    last_execution TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_query_stats_hash ON query_performance_stats(query_hash);
CREATE INDEX idx_query_stats_mean_time ON query_performance_stats(mean_time_ms DESC);

COMMENT ON TABLE query_performance_stats IS '查询性能统计表';

-- 8. 创建数据库连接池监控视图
CREATE OR REPLACE VIEW v_database_connections AS
SELECT 
    datname as database_name,
    count(*) as connection_count,
    count(*) FILTER (WHERE state = 'active') as active_connections,
    count(*) FILTER (WHERE state = 'idle') as idle_connections,
    count(*) FILTER (WHERE state = 'idle in transaction') as idle_in_transaction,
    max(backend_start) as oldest_connection,
    avg(EXTRACT(EPOCH FROM (now() - backend_start))) as avg_connection_age_seconds
FROM pg_stat_activity
WHERE datname = current_database()
GROUP BY datname;

COMMENT ON VIEW v_database_connections IS '数据库连接池监控视图';

-- 9. 设置物化视图自动刷新（通过 pg_cron 扩展，如果可用）
-- 注意：这需要在 Supabase 控制台中启用 pg_cron 扩展
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
-- SELECT cron.schedule('refresh-monthly-sales', '0 2 * * *', 'SELECT refresh_monthly_sales_report();');