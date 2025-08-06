# YesSales 生产环境设置指南

## 概述

本指南详细说明如何从零开始设置 YesSales 的生产环境，包括所有必要的服务配置和部署步骤。

## 系统架构图

```mermaid
graph TB
    subgraph "用户层"
        A[Web浏览器] --> B[CDN/Vercel]
    end
    
    subgraph "应用层"
        B --> C[Next.js应用]
        C --> D[API路由]
    end
    
    subgraph "数据层"
        D --> E[Supabase PostgreSQL]
        D --> F[Supabase Auth]
        D --> G[Supabase Storage]
        D --> H[Edge Functions]
    end
    
    subgraph "监控层"
        I[监控系统] --> E
        I --> C
        J[日志收集] --> C
        J --> H
    end
    
    subgraph "外部服务"
        K[钉钉通知]
        L[邮件服务]
        M[备份存储]
    end
```

---

## 前期准备

### 1. 域名和SSL证书

#### 1.1 域名购买和配置
```bash
# 推荐域名注册商：阿里云、腾讯云、Cloudflare
# 域名示例：yessales.com

# DNS记录配置
# A记录：yessales.com -> [Vercel IP]
# CNAME：www.yessales.com -> yessales.com
# CNAME：api.yessales.com -> [Supabase项目域名]
```

#### 1.2 SSL证书配置
- Vercel 自动提供 Let's Encrypt 证书
- Supabase 使用自有SSL证书
- 确保所有子域名都有SSL覆盖

### 2. 账户准备

需要注册以下服务账户：

#### 必需服务
- [ ] **Supabase** - 数据库和后端服务
- [ ] **Vercel** - 前端部署和CDN
- [ ] **GitHub** - 代码仓库和CI/CD

#### 可选服务
- [ ] **阿里云OSS/AWS S3** - 额外文件存储
- [ ] **SendGrid/阿里云邮件** - 邮件发送服务
- [ ] **Sentry** - 错误监控
- [ ] **DataDog/Grafana** - 高级监控

---

## Supabase 生产环境设置

### 1. 创建生产项目

#### 1.1 项目创建
```bash
# 1. 登录 Supabase Dashboard
# 2. 点击 "New Project"
# 3. 选择合适的区域（推荐：Singapore/Tokyo）
# 4. 设置项目名称：yessales-prod
# 5. 设置强密码
```

#### 1.2 基础配置
```sql
-- 连接到生产数据库
psql "postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres"

-- 创建扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_cron";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- 设置时区
SET timezone = 'Asia/Shanghai';
```

### 2. 数据库设置

#### 2.1 执行迁移脚本
```bash
# 按顺序执行所有迁移文件
psql $DATABASE_URL -f supabase/migrations/20250105_initial_schema.sql
psql $DATABASE_URL -f supabase/migrations/20250106_security_policies.sql
psql $DATABASE_URL -f supabase/migrations/20250107_performance_indexes.sql
psql $DATABASE_URL -f supabase/migrations/20250107_backup_triggers.sql
psql $DATABASE_URL -f supabase/migrations/20250108_monitoring_tables.sql
psql $DATABASE_URL -f supabase/migrations/20250108_monitoring_functions.sql
```

#### 2.2 初始数据导入
```sql
-- 创建管理员用户
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'admin@yessales.com',
  crypt('admin_password', gen_salt('bf')),
  NOW(),
  '{"role": "admin", "name": "系统管理员"}',
  NOW(),
  NOW()
);

-- 插入基础配置数据
INSERT INTO system_config (key, value, description) VALUES
  ('app_name', 'YesSales', '应用名称'),
  ('version', '1.0.0', '当前版本'),
  ('maintenance_mode', 'false', '维护模式'),
  ('max_file_size', '10485760', '最大文件大小(10MB)'),
  ('allowed_file_types', '["image/jpeg", "image/png", "application/pdf"]', '允许的文件类型');
```

### 3. 安全配置

#### 3.1 RLS策略启用
```sql
-- 确保所有表都启用了RLS
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = false;

-- 如有未启用的表，手动启用
-- ALTER TABLE [table_name] ENABLE ROW LEVEL SECURITY;
```

#### 3.2 API密钥管理
```bash
# 在 Supabase Dashboard > Settings > API 中：
# 1. 记录 anon key（客户端使用）
# 2. 记录 service_role key（服务端使用，严格保密）
# 3. 设置自定义JWT密钥（生产环境推荐）
```

### 4. Edge Functions 部署

#### 4.1 安装Supabase CLI
```bash
# macOS
brew install supabase/tap/supabase

# Linux
curl -fsSL https://supabase.com/install.sh | sh

# 登录
supabase login
```

#### 4.2 部署所有函数
```bash
# 部署备份函数
supabase functions deploy database-backup --project-ref [YOUR_PROJECT_REF]
supabase functions deploy backup-to-storage --project-ref [YOUR_PROJECT_REF]

# 部署监控函数
supabase functions deploy collect-metrics --project-ref [YOUR_PROJECT_REF]
supabase functions deploy check-alerts --project-ref [YOUR_PROJECT_REF]
```

#### 4.3 设置函数环境变量
```bash
# 在 Supabase Dashboard > Edge Functions > [函数名] > Settings
# 设置以下环境变量：

# 钉钉通知
DINGTALK_WEBHOOK_URL=https://oapi.dingtalk.com/robot/send?access_token=xxx

# 邮件服务（可选）
SENDGRID_API_KEY=xxx
EMAIL_FROM=noreply@yessales.com

# 备份存储
BACKUP_STORAGE_URL=xxx
BACKUP_ACCESS_KEY=xxx
BACKUP_SECRET_KEY=xxx
```

---

## Vercel 生产部署

### 1. 项目创建和配置

#### 1.1 连接GitHub仓库
```bash
# 1. 登录 Vercel Dashboard
# 2. 点击 "New Project"
# 3. 连接GitHub仓库：yessales
# 4. 选择框架：Next.js
# 5. 配置项目设置
```

#### 1.2 环境变量配置
```bash
# 在 Vercel Dashboard > Project > Settings > Environment Variables

# Supabase配置
NEXT_PUBLIC_SUPABASE_URL=https://[ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon_key]
SUPABASE_SERVICE_ROLE_KEY=[service_role_key]

# 应用配置
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://yessales.com

# 第三方服务
DINGTALK_WEBHOOK_URL=[webhook_url]
SENDGRID_API_KEY=[api_key]

# 安全配置
JWT_SECRET=[random_32_char_string]
ENCRYPTION_KEY=[random_32_char_string]
```

#### 1.3 构建配置
```json
// vercel.json
{
  "build": {
    "env": {
      "NODE_ENV": "production"
    }
  },
  "functions": {
    "app/api/**/*.js": {
      "maxDuration": 30
    }
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "camera=(), microphone=(), geolocation=()"
        }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/$1"
    }
  ]
}
```

### 2. 自定义域名配置

#### 2.1 域名添加
```bash
# 在 Vercel Dashboard > Project > Settings > Domains
# 1. 添加域名：yessales.com
# 2. 添加域名：www.yessales.com
# 3. 配置DNS记录（Vercel会提供具体指导）
```

#### 2.2 SSL证书验证
```bash
# Vercel会自动配置Let's Encrypt证书
# 验证SSL配置：
curl -I https://yessales.com
# 应该返回: HTTP/2 200
```

---

## 监控和日志设置

### 1. Supabase监控配置

#### 1.1 启用定时任务
```sql
-- 在Supabase SQL Editor中执行
SELECT cron.schedule(
  'collect-metrics',
  '*/5 * * * *',
  $$
    SELECT net.http_post(
      url := 'https://[project-ref].supabase.co/functions/v1/collect-metrics',
      headers := jsonb_build_object(
        'Authorization', 'Bearer [service-role-key]',
        'Content-Type', 'application/json'
      )
    );
  $$
);

SELECT cron.schedule(
  'check-alerts',  
  '*/5 * * * *',
  $$
    SELECT net.http_post(
      url := 'https://[project-ref].supabase.co/functions/v1/check-alerts',
      headers := jsonb_build_object(
        'Authorization', 'Bearer [service-role-key]',
        'Content-Type', 'application/json'
      )
    );
  $$
);
```

#### 1.2 数据清理任务
```sql
SELECT cron.schedule(
  'cleanup-old-data',
  '0 2 * * *',
  $$
    DELETE FROM system_metrics WHERE created_at < NOW() - INTERVAL '30 days';
    DELETE FROM business_metrics WHERE created_at < NOW() - INTERVAL '30 days';
    DELETE FROM alert_history WHERE created_at < NOW() - INTERVAL '90 days';
  $$
);
```

### 2. 第三方监控集成

#### 2.1 Sentry错误监控（可选）
```typescript
// sentry.client.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  debug: false,
  integrations: [
    new Sentry.BrowserTracing({
      tracePropagationTargets: ["localhost", "yessales.com"]
    })
  ]
});
```

#### 2.2 日志聚合（可选）
```typescript
// lib/logger.ts
import winston from 'winston';

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'yessales-prod' },
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});
```

---

## 备份策略实施

### 1. 自动备份配置

#### 1.1 数据库备份
```sql
-- 在Supabase中设置定时备份
SELECT cron.schedule(
  'daily-backup',
  '0 3 * * *',  -- 每天凌晨3点
  $$
    SELECT net.http_post(
      url := 'https://[project-ref].supabase.co/functions/v1/database-backup',
      headers := jsonb_build_object(
        'Authorization', 'Bearer [service-role-key]'
      )
    );
  $$
);
```

#### 1.2 文件备份
```bash
# 创建备份脚本
cat > /scripts/backup-files.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backup/files_$DATE"

# 备份Supabase Storage文件
# 注意：需要根据实际情况调整
supabase storage download --recursive user-uploads $BACKUP_DIR/

# 压缩备份
tar -czf "/backup/files_backup_$DATE.tar.gz" $BACKUP_DIR
rm -rf $BACKUP_DIR

# 上传到云存储（可选）
# aws s3 cp "/backup/files_backup_$DATE.tar.gz" s3://yessales-backup/

echo "File backup completed: files_backup_$DATE.tar.gz"
EOF

chmod +x /scripts/backup-files.sh

# 设置定时任务
echo "0 4 * * * /scripts/backup-files.sh" | crontab -
```

---

## 安全配置实施

### 1. 网络安全

#### 1.1 Cloudflare配置（推荐）
```bash
# 如果使用Cloudflare作为CDN和安全层
# 1. 添加域名到Cloudflare
# 2. 启用以下安全功能：
#    - DDoS防护
#    - Web应用防火墙(WAF)
#    - Bot管理
#    - 速率限制
```

#### 1.2 IP白名单（管理界面）
```typescript
// middleware.ts - IP访问控制
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const ADMIN_ALLOWED_IPS = process.env.ADMIN_ALLOWED_IPS?.split(',') || []

export function middleware(request: NextRequest) {
  // 管理界面IP限制
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
    
    if (ADMIN_ALLOWED_IPS.length > 0 && !ADMIN_ALLOWED_IPS.includes(ip)) {
      return new Response('Access Denied', { status: 403 })
    }
  }
  
  return NextResponse.next()
}
```

### 2. 数据安全

#### 2.1 敏感数据加密
```sql
-- 启用透明数据加密（如果Supabase支持）
-- 或在应用层加密敏感字段

-- 创建加密函数
CREATE OR REPLACE FUNCTION encrypt_sensitive_data(data text)
RETURNS text AS $$
BEGIN
  -- 使用pgcrypto扩展加密数据
  RETURN pgp_sym_encrypt(data, '[encryption_key]');
END;
$$ LANGUAGE plpgsql;
```

#### 2.2 审计日志
```sql
-- 创建审计日志表
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name VARCHAR(100) NOT NULL,
  operation VARCHAR(10) NOT NULL,
  old_data JSONB,
  new_data JSONB,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建审计触发器函数
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (table_name, operation, old_data, user_id)
    VALUES (TG_TABLE_NAME, TG_OP, to_jsonb(OLD), auth.uid());
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_logs (table_name, operation, old_data, new_data, user_id)
    VALUES (TG_TABLE_NAME, TG_OP, to_jsonb(OLD), to_jsonb(NEW), auth.uid());
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (table_name, operation, new_data, user_id)
    VALUES (TG_TABLE_NAME, TG_OP, to_jsonb(NEW), auth.uid());
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 为关键表创建审计触发器
CREATE TRIGGER audit_users_trigger
  AFTER INSERT OR UPDATE OR DELETE ON users
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_quotes_trigger
  AFTER INSERT OR UPDATE OR DELETE ON quotes
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
```

---

## 性能优化配置

### 1. 数据库性能调优

#### 1.1 连接池配置
```sql
-- 在Supabase Dashboard > Settings > Database
-- 调整以下参数：
-- max_connections = 100
-- shared_buffers = 256MB
-- effective_cache_size = 1GB
-- work_mem = 4MB
-- maintenance_work_mem = 64MB
```

#### 1.2 查询优化
```sql
-- 启用查询统计
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- 定期分析慢查询
SELECT 
  query,
  calls,
  total_exec_time,
  mean_exec_time,
  max_exec_time
FROM pg_stat_statements
WHERE mean_exec_time > 100  -- 超过100ms的查询
ORDER BY mean_exec_time DESC
LIMIT 20;
```

### 2. 应用性能优化

#### 2.1 Next.js优化配置
```typescript
// next.config.js
const nextConfig = {
  // 启用实验性功能
  experimental: {
    optimizeCss: true,
    scrollRestoration: true
  },
  
  // 图片优化
  images: {
    domains: ['[supabase-project-ref].supabase.co'],
    formats: ['image/webp', 'image/avif']
  },
  
  // 压缩配置
  compress: true,
  
  // 缓存配置
  async headers() {
    return [
      {
        source: '/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      }
    ]
  }
}
```

#### 2.2 CDN和缓存策略
```typescript
// lib/cache.ts
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!
})

export async function getCachedData(key: string, ttl: number = 3600) {
  try {
    const cached = await redis.get(key)
    if (cached) return cached
    
    // 如果缓存不存在，从数据库获取并缓存
    const data = await fetchFromDatabase(key)
    await redis.setex(key, ttl, JSON.stringify(data))
    return data
    
  } catch (error) {
    console.error('Cache error:', error)
    return await fetchFromDatabase(key)
  }
}
```

---

## 部署后验证

### 1. 功能验证

#### 1.1 基础功能测试
```bash
# 健康检查
curl -f https://yessales.com/api/health

# 用户认证测试
curl -X POST https://yessales.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass"}'

# 数据库连接测试
curl -f https://yessales.com/api/test/db-connection
```

#### 1.2 性能测试
```bash
# 使用 Apache Bench 进行负载测试
ab -n 1000 -c 10 https://yessales.com/

# 使用 wrk 进行性能测试
wrk -t12 -c400 -d30s https://yessales.com/

# 页面加载速度测试
curl -w "@curl-format.txt" -o /dev/null -s https://yessales.com/
```

### 2. 安全验证

#### 2.1 SSL证书检查
```bash
# 检查SSL证书
openssl s_client -connect yessales.com:443 -servername yessales.com

# 使用在线工具检查SSL评级
# https://www.ssllabs.com/ssltest/
```

#### 2.2 安全头检查
```bash
# 检查安全响应头
curl -I https://yessales.com/ | grep -E "(X-Frame-Options|X-Content-Type-Options|Content-Security-Policy)"

# 使用安全扫描工具
nmap -sS yessales.com
```

### 3. 监控验证

#### 3.1 监控数据检查
```sql
-- 检查监控数据是否正常收集
SELECT COUNT(*) FROM system_metrics WHERE created_at > NOW() - INTERVAL '1 hour';
SELECT COUNT(*) FROM business_metrics WHERE created_at > NOW() - INTERVAL '1 hour';

-- 检查告警规则是否正常
SELECT * FROM alert_rules WHERE is_active = true;
```

#### 3.2 告警测试
```bash
# 手动触发告警测试
curl -X POST https://[project-ref].supabase.co/functions/v1/check-alerts \
  -H "Authorization: Bearer [service-role-key]"
```

---

## 运维指南

### 1. 日常维护

#### 1.1 每日检查清单
- [ ] 系统健康状态检查
- [ ] 错误日志查看
- [ ] 性能指标监控
- [ ] 备份状态确认
- [ ] 安全告警检查

#### 1.2 每周维护任务
- [ ] 数据库性能分析
- [ ] 依赖安全更新检查
- [ ] 存储空间监控
- [ ] 用户反馈处理
- [ ] 监控告警规则调整

#### 1.3 每月维护任务
- [ ] 全面安全审计
- [ ] 备份恢复测试
- [ ] 性能优化评估
- [ ] 容量规划更新
- [ ] 灾难恢复演练

### 2. 故障处理

#### 2.1 常见问题解决
```bash
# 应用无法访问
curl -I https://yessales.com
dig yessales.com
nslookup yessales.com

# 数据库连接问题
psql $DATABASE_URL -c "SELECT 1;"

# Edge Function问题
supabase functions logs [function-name] --project-ref [ref]
```

#### 2.2 紧急回滚程序
```bash
# Vercel应用回滚
vercel rollback --token [token]

# 数据库回滚
psql $DATABASE_URL < backup_latest.sql

# 配置回滚
git revert [commit-hash]
git push origin main
```

---

## 扩展和升级

### 1. 横向扩展

#### 1.1 数据库扩展
- 考虑读写分离
- 实施数据分片
- 使用连接池优化

#### 1.2 应用扩展
- 增加Vercel并发限制
- 使用Redis缓存
- CDN配置优化

### 2. 垂直升级

#### 2.1 Supabase套餐升级
- Pro套餐：更高性能和更多功能
- Team套餐：团队协作功能
- Enterprise：企业级功能

#### 2.2 第三方服务集成
- 高级监控服务
- 专业备份服务
- 安全加固服务

---

## 总结检查清单

### 部署完成检查

- [ ] Supabase项目配置完成
- [ ] 数据库迁移执行成功
- [ ] Edge Functions部署完成
- [ ] Vercel应用部署成功
- [ ] 自定义域名配置完成
- [ ] SSL证书配置正确
- [ ] 环境变量配置完整
- [ ] 监控系统正常运行
- [ ] 备份策略实施完成
- [ ] 安全配置验证通过
- [ ] 性能测试结果满意
- [ ] 运维文档准备完成

### 上线准备确认

- [ ] 生产数据已导入
- [ ] 管理员账户已创建
- [ ] 用户通知已准备
- [ ] 客服支持已就绪
- [ ] 监控告警已配置
- [ ] 应急响应计划已激活
- [ ] 团队培训已完成
- [ ] 文档已更新完整

---

**文档版本**：v1.0  
**最后更新**：2025-01-08  
**维护负责人**：[技术团队]