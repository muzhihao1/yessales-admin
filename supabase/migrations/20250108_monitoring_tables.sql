-- 监控系统表结构
-- 系统性能指标表
CREATE TABLE IF NOT EXISTS system_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_type VARCHAR(50) NOT NULL,
  metric_name VARCHAR(100) NOT NULL,
  metric_value NUMERIC NOT NULL,
  metric_unit VARCHAR(20),
  tags JSONB DEFAULT '{}',
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 业务指标表
CREATE TABLE IF NOT EXISTS business_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_type VARCHAR(50) NOT NULL,
  metric_name VARCHAR(100) NOT NULL,
  metric_value NUMERIC NOT NULL,
  dimensions JSONB DEFAULT '{}',
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 告警规则表
CREATE TABLE IF NOT EXISTS alert_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name VARCHAR(100) NOT NULL UNIQUE,
  rule_type VARCHAR(50) NOT NULL,
  metric_source VARCHAR(50) NOT NULL,
  metric_name VARCHAR(100) NOT NULL,
  condition VARCHAR(20) NOT NULL,
  threshold NUMERIC NOT NULL,
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('critical', 'warning', 'info')),
  notification_channels JSONB DEFAULT '[]',
  evaluation_interval INTEGER DEFAULT 300, -- seconds
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 告警历史表
CREATE TABLE IF NOT EXISTS alert_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID REFERENCES alert_rules(id),
  alert_status VARCHAR(20) NOT NULL CHECK (alert_status IN ('triggered', 'resolved', 'acknowledged')),
  metric_value NUMERIC,
  threshold_value NUMERIC,
  message TEXT,
  notification_sent BOOLEAN DEFAULT false,
  triggered_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 监控仪表板配置表
CREATE TABLE IF NOT EXISTS monitoring_dashboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dashboard_name VARCHAR(100) NOT NULL,
  dashboard_type VARCHAR(50) NOT NULL,
  config JSONB NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_system_metrics_type_time ON system_metrics(metric_type, recorded_at DESC);
CREATE INDEX idx_system_metrics_name_time ON system_metrics(metric_name, recorded_at DESC);
CREATE INDEX idx_business_metrics_type_time ON business_metrics(metric_type, recorded_at DESC);
CREATE INDEX idx_business_metrics_name_time ON business_metrics(metric_name, recorded_at DESC);
CREATE INDEX idx_alert_history_rule_time ON alert_history(rule_id, triggered_at DESC);
CREATE INDEX idx_alert_history_status ON alert_history(alert_status);

-- 启用 RLS
ALTER TABLE system_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitoring_dashboards ENABLE ROW LEVEL SECURITY;

-- 系统指标只允许服务角色写入，管理员可读
CREATE POLICY "Service role can insert system metrics" ON system_metrics
  FOR INSERT TO service_role
  USING (true);

CREATE POLICY "Admins can view system metrics" ON system_metrics
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  ));

-- 业务指标策略
CREATE POLICY "Service role can insert business metrics" ON business_metrics
  FOR INSERT TO service_role
  USING (true);

CREATE POLICY "Authenticated users can view business metrics" ON business_metrics
  FOR SELECT TO authenticated
  USING (true);

-- 告警规则只有管理员可以管理
CREATE POLICY "Admins can manage alert rules" ON alert_rules
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  ));

-- 告警历史管理员可查看和确认
CREATE POLICY "Admins can view alert history" ON alert_history
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  ));

CREATE POLICY "Admins can acknowledge alerts" ON alert_history
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  ));

-- 仪表板配置管理
CREATE POLICY "Users can view dashboards" ON monitoring_dashboards
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can manage dashboards" ON monitoring_dashboards
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  ));

-- 插入默认告警规则
INSERT INTO alert_rules (rule_name, rule_type, metric_source, metric_name, condition, threshold, severity, notification_channels) VALUES
  ('高错误率告警', 'threshold', 'system', 'error_rate', '>', 5, 'critical', '["dingtalk", "email"]'),
  ('API响应时间告警', 'threshold', 'system', 'api_response_time', '>', 2000, 'warning', '["dingtalk"]'),
  ('存储空间告警', 'threshold', 'system', 'storage_usage_percent', '>', 90, 'critical', '["dingtalk", "email"]'),
  ('数据库连接数告警', 'threshold', 'system', 'db_connections', '>', 90, 'warning', '["dingtalk"]'),
  ('备份失败告警', 'threshold', 'system', 'backup_success', '=', 0, 'critical', '["dingtalk", "email"]'),
  ('日报价单数量异常', 'threshold', 'business', 'daily_quotes', '<', 10, 'info', '["dingtalk"]');