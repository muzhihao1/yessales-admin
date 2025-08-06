-- 常见查询优化脚本
-- 包含应用中最常见查询的优化版本

-- 1. 优化报价单列表查询（带分页）
-- 原查询可能导致全表扫描，优化后使用索引
PREPARE optimized_quote_list (integer, integer) AS
SELECT 
    q.id,
    q.quote_no,
    q.created_at,
    q.status,
    q.total_price,
    q.remark,
    -- 使用 JSON 聚合减少关联查询
    jsonb_build_object(
        'id', c.id,
        'name', c.name,
        'phone', c.phone
    ) as customer,
    jsonb_build_object(
        'id', u.id,
        'name', u.name,
        'username', u.username
    ) as sales,
    -- 使用子查询获取项目数量，避免 JOIN
    (SELECT COUNT(*) FROM quote_items qi WHERE qi.quote_id = q.id) as item_count
FROM quotes q
INNER JOIN customers c ON q.customer_id = c.id
INNER JOIN users u ON q.sales_id = u.id
ORDER BY q.created_at DESC
LIMIT $1 OFFSET $2;

-- 2. 优化客户报价历史查询
-- 使用窗口函数提高性能
PREPARE optimized_customer_history (uuid) AS
WITH customer_quotes AS (
    SELECT 
        q.*,
        ROW_NUMBER() OVER (ORDER BY q.created_at DESC) as rn,
        COUNT(*) OVER () as total_count,
        SUM(q.total_price) OVER () as total_amount
    FROM quotes q
    WHERE q.customer_id = $1
)
SELECT 
    id,
    quote_no,
    created_at,
    status,
    total_price,
    remark,
    total_count,
    total_amount
FROM customer_quotes
WHERE rn <= 50;  -- 限制返回最近50条

-- 3. 优化产品搜索查询
-- 使用全文搜索和 GIN 索引
PREPARE optimized_product_search (text, text) AS
SELECT 
    p.id,
    p.name,
    p.model,
    p.category,
    p.price,
    p.unit,
    p.image_url,
    p.description,
    -- 预加载 SKU 数据为 JSON
    COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'id', ps.id,
                'specification', ps.specification,
                'unit', ps.unit,
                'is_active', ps.is_active
            ) ORDER BY ps.specification
        ) FILTER (WHERE ps.id IS NOT NULL),
        '[]'::jsonb
    ) as skus
FROM products p
LEFT JOIN product_skus ps ON p.id = ps.product_id AND ps.is_active = true
WHERE p.is_active = true
    AND ($1 IS NULL OR p.category = $1)
    AND ($2 IS NULL OR p.name ILIKE '%' || $2 || '%')
GROUP BY p.id
ORDER BY p.created_at DESC;

-- 4. 优化销售业绩统计查询
-- 使用 LATERAL JOIN 提高效率
PREPARE optimized_sales_performance (date, date) AS
SELECT 
    u.id,
    u.name,
    u.username,
    COALESCE(stats.quote_count, 0) as quote_count,
    COALESCE(stats.approved_count, 0) as approved_count,
    COALESCE(stats.total_amount, 0) as total_amount,
    COALESCE(stats.avg_amount, 0) as avg_amount
FROM users u
LEFT JOIN LATERAL (
    SELECT 
        COUNT(*) as quote_count,
        COUNT(*) FILTER (WHERE status = 'approved') as approved_count,
        SUM(total_price) as total_amount,
        AVG(total_price) as avg_amount
    FROM quotes q
    WHERE q.sales_id = u.id
        AND q.created_at >= $1
        AND q.created_at <= $2
) stats ON true
WHERE u.role = 'sales'
ORDER BY stats.total_amount DESC NULLS LAST;

-- 5. 优化报价单详情查询
-- 使用单次查询获取所有数据
PREPARE optimized_quote_detail (uuid) AS
WITH quote_data AS (
    SELECT 
        q.*,
        c.name as customer_name,
        c.phone as customer_phone,
        c.wechat as customer_wechat,
        c.address as customer_address,
        u.name as sales_name,
        u.username as sales_username
    FROM quotes q
    JOIN customers c ON q.customer_id = c.id
    JOIN users u ON q.sales_id = u.id
    WHERE q.id = $1
),
items_data AS (
    SELECT 
        quote_id,
        jsonb_agg(
            jsonb_build_object(
                'id', id,
                'type', type,
                'name', name,
                'specification', specification,
                'unit', unit,
                'quantity', quantity,
                'unit_price', unit_price,
                'total_price', total_price,
                'image_url', image_url,
                'remark', remark
            ) ORDER BY created_at
        ) as items
    FROM quote_items
    WHERE quote_id = $1
    GROUP BY quote_id
)
SELECT 
    q.*,
    COALESCE(i.items, '[]'::jsonb) as items
FROM quote_data q
LEFT JOIN items_data i ON i.quote_id = q.id;

-- 6. 优化仪表板统计查询
-- 使用单次查询获取多个统计数据
PREPARE optimized_dashboard_stats AS
WITH date_range AS (
    SELECT 
        CURRENT_DATE - INTERVAL '30 days' as start_date,
        CURRENT_DATE as end_date
),
stats AS (
    SELECT 
        COUNT(*) as total_quotes,
        COUNT(*) FILTER (WHERE status = 'approved') as approved_quotes,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_quotes,
        COUNT(DISTINCT customer_id) as unique_customers,
        SUM(total_price) as total_revenue,
        AVG(total_price) as avg_quote_value,
        COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) as today_quotes,
        SUM(total_price) FILTER (WHERE created_at >= CURRENT_DATE) as today_revenue
    FROM quotes, date_range
    WHERE created_at >= date_range.start_date
),
top_products AS (
    SELECT 
        jsonb_agg(
            jsonb_build_object(
                'name', name,
                'count', count,
                'revenue', revenue
            ) ORDER BY revenue DESC
        ) as products
    FROM (
        SELECT 
            qi.name,
            COUNT(*) as count,
            SUM(qi.total_price) as revenue
        FROM quote_items qi
        JOIN quotes q ON qi.quote_id = q.id
        WHERE q.created_at >= (SELECT start_date FROM date_range)
        GROUP BY qi.name
        ORDER BY revenue DESC
        LIMIT 10
    ) t
)
SELECT 
    s.*,
    tp.products as top_products
FROM stats s, top_products tp;

-- 7. 创建查询计划缓存函数
CREATE OR REPLACE FUNCTION cache_query_plan(query_name text)
RETURNS void AS $$
BEGIN
    -- 根据查询名称预热查询计划
    CASE query_name
        WHEN 'quote_list' THEN
            EXECUTE 'EXECUTE optimized_quote_list(20, 0)';
        WHEN 'dashboard_stats' THEN
            EXECUTE 'EXECUTE optimized_dashboard_stats';
        WHEN 'product_search' THEN
            EXECUTE 'EXECUTE optimized_product_search(NULL, NULL)';
        ELSE
            RAISE NOTICE 'Unknown query name: %', query_name;
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- 8. 创建批量预热缓存的函数
CREATE OR REPLACE FUNCTION warmup_cache()
RETURNS void AS $$
DECLARE
    query_names text[] := ARRAY['quote_list', 'dashboard_stats', 'product_search'];
    query_name text;
BEGIN
    -- 预热所有常用查询
    FOREACH query_name IN ARRAY query_names
    LOOP
        PERFORM cache_query_plan(query_name);
    END LOOP;
    
    -- 预热物化视图
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_monthly_sales_report;
    
    RAISE NOTICE 'Cache warmup completed';
END;
$$ LANGUAGE plpgsql;

-- 9. 创建查询性能测试函数
CREATE OR REPLACE FUNCTION test_query_performance(
    query_text text,
    iterations integer DEFAULT 10
)
RETURNS TABLE(
    execution_time numeric,
    rows_returned bigint
) AS $$
DECLARE
    start_time timestamp;
    end_time timestamp;
    row_count bigint;
BEGIN
    FOR i IN 1..iterations LOOP
        start_time := clock_timestamp();
        EXECUTE query_text;
        GET DIAGNOSTICS row_count = ROW_COUNT;
        end_time := clock_timestamp();
        
        execution_time := EXTRACT(EPOCH FROM (end_time - start_time)) * 1000;
        rows_returned := row_count;
        RETURN NEXT;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 使用示例：
-- SELECT * FROM test_query_performance('SELECT * FROM quotes LIMIT 100', 5);