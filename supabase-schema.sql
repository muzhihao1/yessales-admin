-- YesSales 生产数据库结构
-- ====================================
-- 基于PRD文档的ER图设计
-- 支持报价系统的完整业务流程

-- 启用必要的扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 客户表
CREATE TABLE customers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    wechat VARCHAR(50),
    address TEXT,
    remark TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(phone)
);

-- 产品表
CREATE TABLE products (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    model VARCHAR(50),
    category VARCHAR(50) NOT NULL,
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    unit VARCHAR(10) DEFAULT '台',
    image_url TEXT,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 产品SKU表（支持地毯多规格）
CREATE TABLE product_skus (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    spec VARCHAR(50), -- 规格
    color VARCHAR(30), -- 颜色
    price DECIMAL(10,2) NOT NULL,
    stock INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 配件表
CREATE TABLE accessories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    unit VARCHAR(10) DEFAULT '个',
    image_url TEXT,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 用户表（销售人员和管理员）
CREATE TABLE users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'sales', -- 'sales' or 'admin'
    name VARCHAR(50) NOT NULL,
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 报价单表
CREATE TABLE quotes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    customer_id UUID REFERENCES customers(id),
    sales_id UUID REFERENCES users(id),
    total_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'completed'
    remark TEXT,
    quote_no VARCHAR(50) UNIQUE NOT NULL, -- 报价单编号
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 报价单明细表
CREATE TABLE quote_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE,
    product_id UUID, -- 可能是product或accessory的ID
    type VARCHAR(20) NOT NULL, -- 'product' or 'accessory'
    name VARCHAR(100) NOT NULL,
    model VARCHAR(50),
    unit_price DECIMAL(10,2) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    total_price DECIMAL(10,2) NOT NULL
);

-- 操作日志表
CREATE TABLE logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    action VARCHAR(50) NOT NULL,
    target_type VARCHAR(50), -- 操作对象类型
    target_id UUID, -- 操作对象ID
    detail TEXT, -- 操作详情
    created_at TIMESTAMP DEFAULT NOW()
);

-- 创建索引提升查询性能
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_created_at ON customers(created_at);

CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_is_active ON products(is_active);
CREATE INDEX idx_products_created_at ON products(created_at);

CREATE INDEX idx_quotes_customer_id ON quotes(customer_id);
CREATE INDEX idx_quotes_sales_id ON quotes(sales_id);
CREATE INDEX idx_quotes_status ON quotes(status);
CREATE INDEX idx_quotes_quote_no ON quotes(quote_no);
CREATE INDEX idx_quotes_created_at ON quotes(created_at);

CREATE INDEX idx_quote_items_quote_id ON quote_items(quote_id);
CREATE INDEX idx_quote_items_type ON quote_items(type);

CREATE INDEX idx_logs_user_id ON logs(user_id);
CREATE INDEX idx_logs_action ON logs(action);
CREATE INDEX idx_logs_created_at ON logs(created_at);

-- 创建报价单编号生成函数
CREATE OR REPLACE FUNCTION generate_quote_no()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.quote_no IS NULL THEN
        NEW.quote_no := TO_CHAR(NOW(), 'YYYYMMDD') || '-' || 
                       LPAD((SELECT COALESCE(MAX(
                           CAST(SPLIT_PART(quote_no, '-', 2) AS INTEGER)
                       ), 0) + 1 FROM quotes WHERE quote_no LIKE TO_CHAR(NOW(), 'YYYYMMDD') || '-%'), 3, '0');
    END IF;
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器自动生成报价单编号
CREATE TRIGGER trigger_generate_quote_no
    BEFORE INSERT OR UPDATE ON quotes
    FOR EACH ROW
    EXECUTE FUNCTION generate_quote_no();

-- 插入初始管理员账号（密码需要在应用中加密处理）
INSERT INTO users (username, password_hash, role, name, phone) VALUES 
('admin', '$2b$10$placeholder_hash', 'admin', '系统管理员', '13800000000');

-- 插入示例产品数据
INSERT INTO products (name, model, category, price, unit, description, is_active) VALUES 
('专业台球桌A型', 'TB-A-2024', '台球桌', 12000.00, '台', '高端专业台球桌，适合比赛使用', TRUE),
('休闲台球桌B型', 'TB-B-2024', '台球桌', 8000.00, '台', '家用休闲台球桌', TRUE),
('台球杆套装', 'CUE-SET-01', '配件', 580.00, '套', '专业台球杆套装', TRUE),
('台球', 'BALL-SET-01', '配件', 280.00, '套', '标准台球一套', TRUE);

-- 插入示例配件数据
INSERT INTO accessories (name, price, unit, description, is_active) VALUES 
('台球杆', 120.00, '支', '单支专业台球杆', TRUE),
('粉球', 25.00, '个', '标准粉球', TRUE),
('台球刷', 35.00, '个', '台球桌专用清洁刷', TRUE);

-- 设置RLS (Row Level Security) 策略
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_skus ENABLE ROW LEVEL SECURITY;
ALTER TABLE accessories ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;

-- 管理员可以访问所有数据
CREATE POLICY "Admins can do everything" ON customers
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can do everything" ON products
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can do everything" ON quotes
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- 销售人员只能访问自己的数据
CREATE POLICY "Sales can manage own quotes" ON quotes
    FOR ALL USING (sales_id = (auth.jwt() ->> 'sub')::uuid);

CREATE POLICY "Sales can read products" ON products
    FOR SELECT USING (is_active = TRUE);

-- 公开表（无需认证即可访问，用于前台销售界面）
CREATE POLICY "Public read access" ON products
    FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Public read access" ON accessories  
    FOR SELECT USING (is_active = TRUE);