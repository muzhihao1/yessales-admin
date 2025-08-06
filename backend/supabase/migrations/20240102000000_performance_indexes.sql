-- 性能优化索引
-- 创建索引以提高查询性能

-- 客户表索引
-- 手机号查询索引
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);

-- 产品表索引
-- 按分类查询产品
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
-- 按激活状态和分类查询
CREATE INDEX IF NOT EXISTS idx_products_active_category ON products(is_active, category);
-- 按名称模糊搜索
CREATE INDEX IF NOT EXISTS idx_products_name_gin ON products USING gin(name gin_trgm_ops);

-- 报价单表索引
-- 客户查询索引
CREATE INDEX IF NOT EXISTS idx_quotes_customer_id ON quotes(customer_id);
-- 销售人员查询索引
CREATE INDEX IF NOT EXISTS idx_quotes_sales_id ON quotes(sales_id);
-- 状态筛选索引
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
-- 时间排序索引
CREATE INDEX IF NOT EXISTS idx_quotes_created_at ON quotes(created_at DESC);
-- 复合索引：按销售人员和状态查询
CREATE INDEX IF NOT EXISTS idx_quotes_sales_status ON quotes(sales_id, status);
-- 复合索引：按客户和时间查询
CREATE INDEX IF NOT EXISTS idx_quotes_customer_created ON quotes(customer_id, created_at DESC);

-- 报价明细表索引
-- 按报价单查询明细
CREATE INDEX IF NOT EXISTS idx_quote_items_quote_id ON quote_items(quote_id);
-- 按类型查询明细
CREATE INDEX IF NOT EXISTS idx_quote_items_type ON quote_items(type);

-- 操作日志表索引
-- 用户操作查询索引
CREATE INDEX IF NOT EXISTS idx_logs_user_id ON operation_logs(user_id);
-- 时间排序索引
CREATE INDEX IF NOT EXISTS idx_logs_created_at ON operation_logs(created_at DESC);
-- 操作类型索引
CREATE INDEX IF NOT EXISTS idx_logs_action ON operation_logs(action);
-- 复合索引：按用户和时间查询
CREATE INDEX IF NOT EXISTS idx_logs_user_created ON operation_logs(user_id, created_at DESC);

-- 用户表索引
-- 用户名登录索引
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
-- 角色筛选索引
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 产品SKU表索引
-- 按产品ID查询
CREATE INDEX IF NOT EXISTS idx_product_skus_product_id ON product_skus(product_id);

-- 配件表索引
-- 按激活状态查询
CREATE INDEX IF NOT EXISTS idx_accessories_active ON accessories(is_active);
-- 按名称模糊搜索
CREATE INDEX IF NOT EXISTS idx_accessories_name_gin ON accessories USING gin(name gin_trgm_ops);

-- 启用 pg_trgm 扩展以支持模糊搜索
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 更新统计信息
ANALYZE customers;
ANALYZE products;
ANALYZE product_skus;
ANALYZE accessories;
ANALYZE quotes;
ANALYZE quote_items;
ANALYZE users;
ANALYZE operation_logs;

-- 添加注释说明索引用途
COMMENT ON INDEX idx_customers_phone IS '客户手机号查询索引';
COMMENT ON INDEX idx_products_category IS '产品分类查询索引';
COMMENT ON INDEX idx_products_active_category IS '产品激活状态和分类复合索引';
COMMENT ON INDEX idx_products_name_gin IS '产品名称模糊搜索索引';
COMMENT ON INDEX idx_quotes_customer_id IS '报价单客户查询索引';
COMMENT ON INDEX idx_quotes_sales_id IS '报价单销售人员查询索引';
COMMENT ON INDEX idx_quotes_status IS '报价单状态筛选索引';
COMMENT ON INDEX idx_quotes_created_at IS '报价单时间排序索引';
COMMENT ON INDEX idx_quotes_sales_status IS '报价单销售人员和状态复合索引';
COMMENT ON INDEX idx_quotes_customer_created IS '报价单客户和时间复合索引';
COMMENT ON INDEX idx_quote_items_quote_id IS '报价明细查询索引';
COMMENT ON INDEX idx_quote_items_type IS '报价明细类型索引';
COMMENT ON INDEX idx_logs_user_id IS '操作日志用户查询索引';
COMMENT ON INDEX idx_logs_created_at IS '操作日志时间排序索引';
COMMENT ON INDEX idx_logs_action IS '操作日志操作类型索引';
COMMENT ON INDEX idx_logs_user_created IS '操作日志用户和时间复合索引';
COMMENT ON INDEX idx_users_username IS '用户登录索引';
COMMENT ON INDEX idx_users_role IS '用户角色筛选索引';
COMMENT ON INDEX idx_product_skus_product_id IS '产品SKU查询索引';
COMMENT ON INDEX idx_accessories_active IS '配件激活状态索引';
COMMENT ON INDEX idx_accessories_name_gin IS '配件名称模糊搜索索引';