-- 插入测试用户数据
INSERT INTO users (username, password_hash, role, name, phone) VALUES
('admin', crypt('Admin@123', gen_salt('bf')), 'admin', '管理员', '13800000000'),
('sales01', crypt('Sales@123', gen_salt('bf')), 'sales', '张三', '13800000001'),
('sales02', crypt('Sales@123', gen_salt('bf')), 'sales', '李四', '13800000002');

-- 插入产品数据
INSERT INTO products (name, model, category, price, unit, description, image_url) VALUES
('标准美式台球桌', 'YS-AM-001', '台球桌', 12800, '台', '专业级美式台球桌，适合比赛使用', 'https://example.com/pool-table-1.jpg'),
('豪华美式台球桌', 'YS-AM-002', '台球桌', 18800, '台', '豪华版美式台球桌，实木材质', 'https://example.com/pool-table-2.jpg'),
('标准中式台球桌', 'YS-CN-001', '台球桌', 9800, '台', '标准中式台球桌，适合娱乐场所', 'https://example.com/pool-table-3.jpg'),
('专业斯诺克台球桌', 'YS-SN-001', '台球桌', 25800, '台', '国际标准斯诺克台球桌', 'https://example.com/pool-table-4.jpg'),
('台球桌专用地毯', 'YS-CP-001', '地毯', 180, '平米', '高密度台球室专用地毯', 'https://example.com/carpet-1.jpg');

-- 为地毯产品添加SKU
INSERT INTO product_skus (product_id, spec, color, price) VALUES
((SELECT id FROM products WHERE model = 'YS-CP-001'), '3mm厚', '深蓝色', 180),
((SELECT id FROM products WHERE model = 'YS-CP-001'), '3mm厚', '墨绿色', 180),
((SELECT id FROM products WHERE model = 'YS-CP-001'), '5mm厚', '深蓝色', 220),
((SELECT id FROM products WHERE model = 'YS-CP-001'), '5mm厚', '墨绿色', 220),
((SELECT id FROM products WHERE model = 'YS-CP-001'), '5mm厚', '酒红色', 220);

-- 插入配件数据
INSERT INTO accessories (name, price, unit, description, image_url) VALUES
('专业球杆', 580, '支', '进口白蜡木球杆，适合专业选手', 'https://example.com/cue-1.jpg'),
('普通球杆', 180, '支', '普通练习用球杆', 'https://example.com/cue-2.jpg'),
('比赛用球', 380, '套', '国际标准比赛用球，16颗装', 'https://example.com/balls-1.jpg'),
('练习用球', 180, '套', '普通练习用球，16颗装', 'https://example.com/balls-2.jpg'),
('球杆架', 280, '个', '实木球杆架，可放置6支球杆', 'https://example.com/rack-1.jpg'),
('记分牌', 180, '个', '电子记分牌', 'https://example.com/scoreboard-1.jpg'),
('台球灯', 1280, '套', 'LED专业台球灯，三头设计', 'https://example.com/light-1.jpg'),
('巧克粉', 20, '盒', '防滑巧克粉', 'https://example.com/chalk-1.jpg');

-- 插入测试客户数据
INSERT INTO customers (name, phone, wechat, address, remark) VALUES
('王先生', '13900000001', 'wang123', '昆明市斗南花卉市场A区', '老客户，要求质量最好的产品'),
('刘老板', '13900000002', 'liuboss', '昆明市呈贡区万达广场', '新开台球厅，需要全套设备'),
('张经理', '13900000003', 'zhangmgr', '昆明市五华区金碧路', '连锁台球厅采购负责人');

-- 插入测试报价单数据
INSERT INTO quotes (quote_no, customer_id, sales_id, total_price, status, remark) VALUES
('20240101-001', 
 (SELECT id FROM customers WHERE phone = '13900000001'),
 (SELECT id FROM users WHERE username = 'sales01'),
 26560, 'pending', '客户考虑中'),
('20240101-002', 
 (SELECT id FROM customers WHERE phone = '13900000002'),
 (SELECT id FROM users WHERE username = 'sales01'),
 85920, 'approved', '已确认订单'),
('20240102-001', 
 (SELECT id FROM customers WHERE phone = '13900000003'),
 (SELECT id FROM users WHERE username = 'sales02'),
 51600, 'completed', '已完成交付');

-- 插入报价单明细数据
-- 报价单1明细
INSERT INTO quote_items (quote_id, product_id, type, name, model, unit_price, quantity, total_price) VALUES
((SELECT id FROM quotes WHERE quote_no = '20240101-001'),
 (SELECT id FROM products WHERE model = 'YS-AM-001'),
 'product', '标准美式台球桌', 'YS-AM-001', 12800, 2, 25600);

INSERT INTO quote_items (quote_id, accessory_id, type, name, unit_price, quantity, total_price) VALUES
((SELECT id FROM quotes WHERE quote_no = '20240101-001'),
 (SELECT id FROM accessories WHERE name = '专业球杆'),
 'accessory', '专业球杆', 580, 4, 2320),
((SELECT id FROM quotes WHERE quote_no = '20240101-001'),
 (SELECT id FROM accessories WHERE name = '比赛用球'),
 'accessory', '比赛用球', 380, 2, 760);

-- 报价单2明细
INSERT INTO quote_items (quote_id, product_id, type, name, model, unit_price, quantity, total_price) VALUES
((SELECT id FROM quotes WHERE quote_no = '20240101-002'),
 (SELECT id FROM products WHERE model = 'YS-AM-002'),
 'product', '豪华美式台球桌', 'YS-AM-002', 18800, 4, 75200),
((SELECT id FROM quotes WHERE quote_no = '20240101-002'),
 (SELECT id FROM products WHERE model = 'YS-CP-001'),
 'product', '台球桌专用地毯', 'YS-CP-001', 220, 48, 10560);

INSERT INTO quote_items (quote_id, accessory_id, type, name, unit_price, quantity, total_price) VALUES
((SELECT id FROM quotes WHERE quote_no = '20240101-002'),
 (SELECT id FROM accessories WHERE name = '台球灯'),
 'accessory', '台球灯', 1280, 4, 5120);

-- 插入操作日志示例
INSERT INTO operation_logs (user_id, action, target_type, target_id, detail) VALUES
((SELECT id FROM users WHERE username = 'sales01'), 
 'CREATE_QUOTE', 
 'quote',
 (SELECT id FROM quotes WHERE quote_no = '20240101-001'),
 '{"customer_name": "王先生", "total_price": 26560}'::jsonb),
((SELECT id FROM users WHERE username = 'admin'), 
 'UPDATE_PRODUCT', 
 'product',
 (SELECT id FROM products WHERE model = 'YS-AM-001'),
 '{"old_price": 12000, "new_price": 12800}'::jsonb);