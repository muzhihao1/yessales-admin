# API 性能优化指南

## 概述

本文档提供了耶氏台球报价系统的 API 性能优化最佳实践，帮助确保系统在生产环境中高效运行。

## 1. 数据库查询优化

### 1.1 使用正确的索引

我们已经创建的索引：
```sql
-- 客户表索引
CREATE INDEX idx_customers_phone ON customers(phone);

-- 产品表索引  
CREATE INDEX idx_products_category ON products(category);

-- 报价单表索引
CREATE INDEX idx_quotes_customer_id ON quotes(customer_id);
CREATE INDEX idx_quotes_sales_id ON quotes(sales_id);
CREATE INDEX idx_quotes_status ON quotes(status);
CREATE INDEX idx_quotes_created_at ON quotes(created_at DESC);

-- 报价明细表索引
CREATE INDEX idx_quote_items_quote_id ON quote_items(quote_id);

-- 日志表索引
CREATE INDEX idx_logs_user_id ON operation_logs(user_id);
CREATE INDEX idx_logs_created_at ON operation_logs(created_at DESC);
```

### 1.2 查询优化建议

#### 避免 N+1 查询问题
```typescript
// ❌ 错误：N+1 查询
const quotes = await supabase.from('quotes').select('*')
for (const quote of quotes.data) {
  const customer = await supabase.from('customers').select('*').eq('id', quote.customer_id).single()
}

// ✅ 正确：一次查询获取关联数据
const quotes = await supabase
  .from('quotes')
  .select(`
    *,
    customer:customers(*),
    items:quote_items(*)
  `)
```

#### 使用分页减少数据传输
```typescript
// ✅ 使用分页
const { data, count } = await supabase
  .from('products')
  .select('*', { count: 'exact' })
  .range(0, 19)  // 获取前20条
  .order('created_at', { ascending: false })
```

#### 只选择需要的字段
```typescript
// ❌ 错误：选择所有字段
const products = await supabase.from('products').select('*')

// ✅ 正确：只选择需要的字段
const products = await supabase
  .from('products')
  .select('id, name, price, image_url')
```

## 2. API 响应优化

### 2.1 响应缓存策略

```typescript
// 在 Edge Function 中添加缓存头
return new Response(JSON.stringify(data), {
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=300', // 缓存5分钟
    'ETag': generateETag(data)
  }
})
```

### 2.2 数据压缩

Supabase 自动处理 gzip 压缩，但要确保：
- 响应数据结构紧凑
- 避免冗余数据
- 使用适当的数据类型

### 2.3 并发请求优化

```typescript
// ✅ 并行请求多个资源
const [products, accessories, customers] = await Promise.all([
  productsApi.getProducts(),
  accessoriesApi.getAccessories(),
  customersApi.getCustomers()
])
```

## 3. 前端性能优化

### 3.1 实现请求去重

```typescript
// 请求去重工具
const pendingRequests = new Map()

export async function dedupeRequest(key: string, requestFn: () => Promise<any>) {
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key)
  }

  const promise = requestFn()
  pendingRequests.set(key, promise)
  
  try {
    const result = await promise
    return result
  } finally {
    pendingRequests.delete(key)
  }
}

// 使用示例
const products = await dedupeRequest('products', () => productsApi.getProducts())
```

### 3.2 实现数据缓存

```typescript
// 简单的内存缓存
class ApiCache {
  private cache = new Map<string, { data: any; timestamp: number }>()
  private ttl = 5 * 60 * 1000 // 5分钟

  get(key: string) {
    const cached = this.cache.get(key)
    if (!cached) return null
    
    if (Date.now() - cached.timestamp > this.ttl) {
      this.cache.delete(key)
      return null
    }
    
    return cached.data
  }

  set(key: string, data: any) {
    this.cache.set(key, { data, timestamp: Date.now() })
  }

  clear() {
    this.cache.clear()
  }
}

export const apiCache = new ApiCache()
```

### 3.3 懒加载和虚拟滚动

```typescript
// 产品列表虚拟滚动配置
export const virtualScrollConfig = {
  itemHeight: 120, // 每个产品项的高度
  buffer: 5, // 缓冲区项目数
  threshold: 0.8 // 触发加载更多的滚动位置
}

// 图片懒加载
export const lazyLoadImages = {
  root: null,
  rootMargin: '50px',
  threshold: 0.1
}
```

## 4. Edge Functions 优化

### 4.1 函数冷启动优化

```typescript
// 将常用的导入放在函数外部
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// 复用客户端实例
let supabaseClient: any

function getSupabaseClient() {
  if (!supabaseClient) {
    supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
  }
  return supabaseClient
}
```

### 4.2 批处理优化

```typescript
// 批量处理报价单导出
export async function batchExportQuotes(quoteIds: string[]) {
  const batchSize = 50
  const results = []
  
  for (let i = 0; i < quoteIds.length; i += batchSize) {
    const batch = quoteIds.slice(i, i + batchSize)
    const batchResults = await supabase
      .from('quotes')
      .select('*')
      .in('id', batch)
    
    results.push(...batchResults.data)
  }
  
  return results
}
```

## 5. 监控和性能指标

### 5.1 关键性能指标 (KPIs)

1. **API 响应时间**
   - 目标: P95 < 500ms
   - 警告: P95 > 1000ms

2. **数据库查询时间**
   - 目标: 平均 < 100ms
   - 警告: 平均 > 300ms

3. **并发用户数**
   - 目标: 支持 100+ 并发
   - 警告: 性能下降 @ 50 并发

4. **错误率**
   - 目标: < 0.1%
   - 警告: > 1%

### 5.2 性能监控代码

```typescript
// API 性能监控中间件
export function performanceMiddleware(handler: Function) {
  return async (req: Request) => {
    const start = Date.now()
    const requestId = crypto.randomUUID()
    
    try {
      const response = await handler(req)
      const duration = Date.now() - start
      
      // 记录性能数据
      await loggingApi.logOperation({
        action: 'API_REQUEST',
        target_type: 'system',
        detail: {
          requestId,
          method: req.method,
          url: req.url,
          duration,
          status: response.status
        }
      })
      
      // 添加性能头
      response.headers.set('X-Request-ID', requestId)
      response.headers.set('X-Response-Time', `${duration}ms`)
      
      return response
    } catch (error) {
      const duration = Date.now() - start
      
      // 记录错误
      await loggingApi.logOperation({
        action: 'API_ERROR',
        target_type: 'system',
        detail: {
          requestId,
          method: req.method,
          url: req.url,
          duration,
          error: error.message
        }
      })
      
      throw error
    }
  }
}
```

## 6. 生产环境优化清单

### 数据库层
- [ ] 确认所有必要的索引已创建
- [ ] 运行 `ANALYZE` 更新统计信息
- [ ] 配置连接池大小
- [ ] 启用查询计划缓存
- [ ] 设置合理的 statement_timeout

### API 层
- [ ] 启用 HTTP/2
- [ ] 配置 CORS 正确
- [ ] 启用响应压缩
- [ ] 设置合理的超时时间
- [ ] 实现速率限制

### 前端层
- [ ] 启用生产构建优化
- [ ] 实现代码分割
- [ ] 配置 CDN
- [ ] 启用 Service Worker 缓存
- [ ] 优化图片加载

### 监控层
- [ ] 配置 APM (Application Performance Monitoring)
- [ ] 设置性能告警
- [ ] 配置错误追踪
- [ ] 启用用户行为分析

## 7. 性能测试脚本

```bash
# 使用 Apache Bench 进行压力测试
ab -n 1000 -c 10 -H "Authorization: Bearer YOUR_TOKEN" \
   -H "apikey: YOUR_ANON_KEY" \
   http://localhost:54321/rest/v1/products

# 使用 k6 进行场景测试
k6 run performance-test.js
```

```javascript
// performance-test.js
import http from 'k6/http'
import { check } from 'k6'

export let options = {
  stages: [
    { duration: '30s', target: 10 },
    { duration: '1m', target: 50 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% 的请求必须在 500ms 内完成
  },
}

export default function () {
  const res = http.get('http://localhost:54321/rest/v1/products', {
    headers: {
      'Authorization': 'Bearer YOUR_TOKEN',
      'apikey': 'YOUR_ANON_KEY',
    },
  })
  
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  })
}
```

## 8. 常见性能问题及解决方案

### 问题 1: 报价单列表加载缓慢
**原因**: 关联数据过多，未使用分页
**解决**: 
- 实现分页加载
- 只在详情页加载完整数据
- 使用数据库视图预聚合数据

### 问题 2: 图片上传超时
**原因**: 图片文件过大
**解决**:
- 前端压缩图片
- 实现分片上传
- 使用 WebP 格式

### 问题 3: 搜索功能响应慢
**原因**: 使用 LIKE 查询，未建立索引
**解决**:
- 使用全文搜索索引
- 实现搜索结果缓存
- 限制搜索结果数量

## 9. 性能优化路线图

### 短期 (1-2 周)
1. 实施基础查询优化
2. 添加响应缓存
3. 配置监控告警

### 中期 (1-2 月)
1. 实现高级缓存策略
2. 优化 Edge Functions
3. 添加 CDN 支持

### 长期 (3-6 月)
1. 实现读写分离
2. 添加数据分片
3. 微服务架构改造

---

通过遵循这些优化建议，可以确保耶氏台球报价系统在生产环境中提供快速、可靠的服务。