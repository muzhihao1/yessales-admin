-- 启用 RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_skus ENABLE ROW LEVEL SECURITY;
ALTER TABLE accessories ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE operation_logs ENABLE ROW LEVEL SECURITY;

-- 客户表策略：所有人可读，仅登录用户可写
CREATE POLICY "Customers readable by all" ON customers
    FOR SELECT USING (true);

CREATE POLICY "Customers insertable by authenticated" ON customers
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Customers updatable by authenticated" ON customers
    FOR UPDATE USING (auth.role() = 'authenticated');

-- 产品表策略：所有人可读，仅管理员可写
CREATE POLICY "Products readable by all" ON products
    FOR SELECT USING (true);

CREATE POLICY "Products writable by admin" ON products
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- 产品SKU表策略：所有人可读，仅管理员可写
CREATE POLICY "Product SKUs readable by all" ON product_skus
    FOR SELECT USING (true);

CREATE POLICY "Product SKUs writable by admin" ON product_skus
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- 配件表策略：所有人可读，仅管理员可写
CREATE POLICY "Accessories readable by all" ON accessories
    FOR SELECT USING (true);

CREATE POLICY "Accessories writable by admin" ON accessories
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- 报价单策略：创建者和管理员可见
CREATE POLICY "Quotes viewable by creator or admin" ON quotes
    FOR SELECT USING (
        sales_id = auth.uid() OR 
        auth.jwt() ->> 'role' = 'admin' OR
        auth.role() = 'anon' -- 允许匿名用户查看（销售端无需登录）
    );

CREATE POLICY "Quotes insertable by all" ON quotes
    FOR INSERT WITH CHECK (true); -- 销售端无需登录即可创建报价

CREATE POLICY "Quotes updatable by creator or admin" ON quotes
    FOR UPDATE USING (
        sales_id = auth.uid() OR 
        auth.jwt() ->> 'role' = 'admin'
    );

-- 报价单明细策略：跟随报价单权限
CREATE POLICY "Quote items follow quote permissions" ON quote_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM quotes 
            WHERE quotes.id = quote_items.quote_id
            AND (
                quotes.sales_id = auth.uid() OR 
                auth.jwt() ->> 'role' = 'admin' OR
                auth.role() = 'anon'
            )
        )
    );

CREATE POLICY "Quote items insertable" ON quote_items
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Quote items updatable" ON quote_items
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM quotes 
            WHERE quotes.id = quote_items.quote_id
            AND (
                quotes.sales_id = auth.uid() OR 
                auth.jwt() ->> 'role' = 'admin'
            )
        )
    );

-- 用户表策略：仅管理员可见
CREATE POLICY "Users viewable by admin" ON users
    FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Users manageable by admin" ON users
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- 操作日志策略：仅管理员可见
CREATE POLICY "Logs viewable by admin" ON operation_logs
    FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Logs insertable by authenticated" ON operation_logs
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');