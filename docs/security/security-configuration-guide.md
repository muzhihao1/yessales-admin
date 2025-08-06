# YesSales 安全配置指南

## 概述

本文档提供 YesSales 系统的详细安全配置说明，确保系统达到最佳安全状态。

## 1. Supabase 安全配置

### 1.1 Row Level Security (RLS) 配置

所有数据表都已启用 RLS，确保数据访问控制：

```sql
-- 启用 RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

-- 用户只能访问自己的数据
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

-- 管理员可以访问所有数据
CREATE POLICY "Admins can view all data" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );
```

### 1.2 API 密钥管理

```bash
# 生产环境使用服务密钥
SUPABASE_SERVICE_ROLE_KEY=eyJhbG... # 仅服务端使用

# 客户端使用匿名密钥
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG... # 客户端可见

# 定期轮换密钥（建议每90天）
```

### 1.3 数据库连接安全

```sql
-- 限制连接数
ALTER SYSTEM SET max_connections = 100;

-- 设置连接超时
ALTER SYSTEM SET statement_timeout = '30s';
ALTER SYSTEM SET idle_in_transaction_session_timeout = '60s';

-- 启用连接SSL
ALTER SYSTEM SET ssl = on;
ALTER SYSTEM SET ssl_prefer_server_ciphers = on;
```

## 2. Next.js 应用安全配置

### 2.1 HTTP 安全头配置

```typescript
// next.config.js
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self'",
              "connect-src 'self' https://*.supabase.co",
              "frame-ancestors 'none'"
            ].join('; ')
          }
        ]
      }
    ]
  }
}
```

### 2.2 环境变量安全

```bash
# .env.local (生产环境)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...  # 仅服务端

# 敏感配置不暴露给客户端
DATABASE_URL=postgresql://...  # 不使用 NEXT_PUBLIC_ 前缀
WEBHOOK_SECRET=xxx
ENCRYPTION_KEY=xxx
```

### 2.3 输入验证配置

```typescript
// lib/validation.ts
import { z } from 'zod'

export const userSchema = z.object({
  name: z.string().min(2).max(50).regex(/^[a-zA-Z\u4e00-\u9fa5\s]+$/),
  email: z.string().email(),
  phone: z.string().regex(/^1[3-9]\d{9}$/),
  password: z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
})

export const productSchema = z.object({
  name: z.string().min(1).max(100),
  price: z.number().min(0).max(9999999.99),
  description: z.string().max(1000),
  category: z.string().min(1).max(50)
})
```

## 3. 文件上传安全配置

### 3.1 Supabase Storage 安全策略

```sql
-- 文件上传权限控制
CREATE POLICY "Users can upload own files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'user-uploads' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- 文件访问权限控制  
CREATE POLICY "Users can view own files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'user-uploads' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
```

### 3.2 文件类型和大小限制

```typescript
// lib/file-validation.ts
const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png', 
  'image/webp',
  'application/pdf',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
]

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export function validateFile(file: File) {
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    throw new Error('不支持的文件类型')
  }
  
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('文件大小不能超过10MB')
  }
  
  return true
}
```

## 4. API 安全配置

### 4.1 速率限制

```typescript
// lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!
})

export const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 m'), // 每分钟最多10次请求
  analytics: true
})

// API 路由中使用
export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') || 'anonymous'
  const { success } = await ratelimit.limit(ip)
  
  if (!success) {
    return new Response('Too Many Requests', { status: 429 })
  }
  
  // 处理请求...
}
```

### 4.2 CORS 配置

```typescript
// lib/cors.ts
export const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.NODE_ENV === 'production' 
    ? 'https://yessales.com' 
    : 'http://localhost:3000',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400'
}
```

## 5. 认证和授权配置

### 5.1 JWT 配置

```typescript
// lib/auth.ts
export const jwtConfig = {
  secret: process.env.JWT_SECRET!,
  expiresIn: '2h',
  issuer: 'yessales.com',
  audience: 'yessales-users'
}

export function verifyToken(token: string) {
  try {
    const payload = jwt.verify(token, jwtConfig.secret, {
      issuer: jwtConfig.issuer,
      audience: jwtConfig.audience
    })
    return payload
  } catch (error) {
    throw new Error('Invalid token')
  }
}
```

### 5.2 密码安全配置

```typescript
// lib/password.ts
import bcrypt from 'bcryptjs'

const SALT_ROUNDS = 12

export async function hashPassword(password: string) {
  return bcrypt.hash(password, SALT_ROUNDS)
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash)
}

// 密码强度检查
export function validatePasswordStrength(password: string) {
  const minLength = 8
  const hasUpperCase = /[A-Z]/.test(password)
  const hasLowerCase = /[a-z]/.test(password)
  const hasNumbers = /\d/.test(password)
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)
  
  return {
    isValid: password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar,
    score: [password.length >= minLength, hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar].filter(Boolean).length
  }
}
```

## 6. 日志和监控配置

### 6.1 安全日志配置

```typescript
// lib/security-logger.ts
import winston from 'winston'

export const securityLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/security.log' }),
    new winston.transports.Console()
  ]
})

export function logSecurityEvent(event: string, details: any) {
  securityLogger.warn('SECURITY_EVENT', {
    event,
    details,
    timestamp: new Date().toISOString(),
    ip: details.ip,
    userAgent: details.userAgent
  })
}
```

### 6.2 异常活动监控

```typescript
// lib/security-monitor.ts
export class SecurityMonitor {
  private static loginAttempts = new Map<string, number>()
  
  static async trackLoginAttempt(ip: string, success: boolean) {
    const key = `login_${ip}`
    
    if (success) {
      this.loginAttempts.delete(key)
      return
    }
    
    const attempts = this.loginAttempts.get(key) || 0
    this.loginAttempts.set(key, attempts + 1)
    
    if (attempts >= 5) {
      await this.blockIP(ip)
      logSecurityEvent('BRUTE_FORCE_ATTEMPT', { ip, attempts: attempts + 1 })
    }
  }
  
  private static async blockIP(ip: string) {
    // 实施IP封锁逻辑
    securityLogger.error('IP_BLOCKED', { ip, reason: 'Too many failed login attempts' })
  }
}
```

## 7. 数据加密配置

### 7.1 敏感数据加密

```typescript
// lib/encryption.ts
import crypto from 'crypto'

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!
const ALGORITHM = 'aes-256-gcm'

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipher(ALGORITHM, ENCRYPTION_KEY)
  cipher.setAAD(Buffer.from('YesSales'))
  
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  const authTag = cipher.getAuthTag()
  
  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted
}

export function decrypt(encryptedData: string): string {
  const parts = encryptedData.split(':')
  const iv = Buffer.from(parts[0], 'hex')
  const authTag = Buffer.from(parts[1], 'hex')
  const encrypted = parts[2]
  
  const decipher = crypto.createDecipher(ALGORITHM, ENCRYPTION_KEY)
  decipher.setAAD(Buffer.from('YesSales'))
  decipher.setAuthTag(authTag)
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  
  return decrypted
}
```

## 8. 生产环境配置检查清单

### 8.1 部署前检查

- [ ] 所有环境变量已配置
- [ ] 生产数据库 RLS 策略已启用
- [ ] HTTPS 证书已配置
- [ ] CDN 安全配置已完成
- [ ] 日志系统已配置
- [ ] 监控告警已设置

### 8.2 运行时检查

```bash
# 检查 HTTPS 配置
curl -I https://your-domain.com

# 检查安全头
curl -I https://your-domain.com | grep -E "(X-Frame-Options|X-Content-Type-Options|Content-Security-Policy)"

# 检查数据库连接
psql $DATABASE_URL -c "SELECT version();"

# 检查 RLS 状态
psql $DATABASE_URL -c "SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';"
```

## 9. 安全更新流程

### 9.1 依赖更新

```bash
# 检查安全漏洞
npm audit

# 自动修复
npm audit fix

# 手动更新关键依赖
npm update
```

### 9.2 密钥轮换

1. **API 密钥轮换**（每90天）：
   - 生成新的 Supabase API 密钥
   - 更新环境变量
   - 验证应用正常运行
   - 撤销旧密钥

2. **JWT 密钥轮换**（每30天）：
   - 生成新的 JWT 密钥
   - 支持双密钥验证期间
   - 逐步切换到新密钥
   - 撤销旧密钥

## 10. 应急响应配置

### 10.1 自动封锁机制

```typescript
// lib/emergency-response.ts
export class EmergencyResponse {
  static async enableMaintenanceMode() {
    // 启用维护模式
    await redis.set('maintenance_mode', 'true', 'EX', 3600) // 1小时
  }
  
  static async blockSuspiciousIPs(ips: string[]) {
    for (const ip of ips) {
      await redis.sadd('blocked_ips', ip)
    }
  }
  
  static async emergencyLogout() {
    // 强制所有用户登出
    await redis.flushdb() // 清除所有会话
  }
}
```

### 10.2 监控告警

```typescript
// lib/alerting.ts
export async function sendSecurityAlert(alert: SecurityAlert) {
  const webhook = process.env.SECURITY_WEBHOOK_URL
  
  await fetch(webhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: `🚨 安全告警: ${alert.title}`,
      attachments: [{
        color: 'danger',
        fields: [
          { title: '事件类型', value: alert.type, short: true },
          { title: '严重级别', value: alert.severity, short: true },
          { title: '描述', value: alert.description, short: false }
        ]
      }]
    })
  })
}
```

这个配置指南提供了具体的实施细节，配合安全审计清单使用，可以确保系统达到最佳安全状态。