# 耶氏台球斗南销售中心报价系统 - 技术架构详细设计

## 一、系统技术架构图

```
┌────────────────────────────────────────────────────────────────────┐
│                          客户端层 (Client Layer)                     │
├──────────────────────────┬─────────────────────────────────────────┤
│      销售端 (H5/小程序)    │           管理端 (H5/Web)              │
│    Uniapp + Vue3 + TS    │        Uniapp + Vue3 + TS             │
│      Terminal 2          │            Terminal 3                   │
├──────────────────────────┴─────────────────────────────────────────┤
│                      网络层 (Network Layer)                         │
│                    HTTPS + WebSocket (实时通知)                     │
├────────────────────────────────────────────────────────────────────┤
│                      API 网关层 (API Gateway)                       │
│                  Supabase REST API + Edge Functions                │
│                         Terminal 1                                  │
├────────────────────────────────────────────────────────────────────┤
│                    业务逻辑层 (Business Logic)                      │
│              Edge Functions (TypeScript/Deno Runtime)              │
├────────────────────────────────────────────────────────────────────┤
│                     数据访问层 (Data Access)                        │
│                    Supabase Client + RLS Policies                  │
├────────────────────────────────────────────────────────────────────┤
│                      数据存储层 (Data Storage)                      │
├─────────────────────────────┬──────────────────────────────────────┤
│   PostgreSQL Database       │      Supabase Storage               │
│   (结构化数据)               │      (文件/图片存储)                 │
└─────────────────────────────┴──────────────────────────────────────┘
```

## 二、详细数据库设计

### 2.1 数据库 ER 关系图

```sql
-- 1. 客户表 (customers)
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(20) NOT NULL,
    phone VARCHAR(11) NOT NULL,
    wechat VARCHAR(50),
    address VARCHAR(200),
    remark TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 产品表 (products)
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    model VARCHAR(50) NOT NULL,
    category VARCHAR(50) NOT NULL,
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    unit VARCHAR(10) NOT NULL DEFAULT '台',
    image_url TEXT,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 产品SKU表 (product_skus) - 用于地毯等多规格产品
CREATE TABLE product_skus (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    spec VARCHAR(50),
    color VARCHAR(30),
    price DECIMAL(10,2) NOT NULL,
    stock INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 配件表 (accessories)
CREATE TABLE accessories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    unit VARCHAR(10) NOT NULL DEFAULT '个',
    image_url TEXT,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 用户表 (users)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'sales')),
    name VARCHAR(50) NOT NULL,
    phone VARCHAR(11),
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. 报价单表 (quotes)
CREATE TABLE quotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quote_no VARCHAR(30) UNIQUE NOT NULL,
    customer_id UUID NOT NULL REFERENCES customers(id),
    sales_id UUID REFERENCES users(id),
    total_price DECIMAL(12,2) NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
    remark TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. 报价单明细表 (quote_items)
CREATE TABLE quote_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
    product_id UUID,
    product_sku_id UUID REFERENCES product_skus(id),
    accessory_id UUID REFERENCES accessories(id),
    type VARCHAR(20) NOT NULL CHECK (type IN ('product', 'accessory')),
    name VARCHAR(100) NOT NULL,
    model VARCHAR(50),
    spec VARCHAR(50),
    unit_price DECIMAL(10,2) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    total_price DECIMAL(12,2) NOT NULL,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CHECK (
        (type = 'product' AND product_id IS NOT NULL) OR
        (type = 'accessory' AND accessory_id IS NOT NULL)
    )
);

-- 8. 操作日志表 (operation_logs)
CREATE TABLE operation_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(50) NOT NULL,
    target_type VARCHAR(50) NOT NULL,
    target_id UUID,
    detail JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引优化查询性能
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_quotes_customer_id ON quotes(customer_id);
CREATE INDEX idx_quotes_sales_id ON quotes(sales_id);
CREATE INDEX idx_quotes_status ON quotes(status);
CREATE INDEX idx_quotes_created_at ON quotes(created_at DESC);
CREATE INDEX idx_quote_items_quote_id ON quote_items(quote_id);
CREATE INDEX idx_logs_user_id ON operation_logs(user_id);
CREATE INDEX idx_logs_created_at ON operation_logs(created_at DESC);
```

### 2.2 RLS (Row Level Security) 策略

```sql
-- 启用 RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 客户表策略：所有人可读，仅登录用户可写
CREATE POLICY "Customers readable by all" ON customers
    FOR SELECT USING (true);

CREATE POLICY "Customers writable by authenticated" ON customers
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 产品表策略：所有人可读，仅管理员可写
CREATE POLICY "Products readable by all" ON products
    FOR SELECT USING (true);

CREATE POLICY "Products writable by admin" ON products
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- 报价单策略：创建者和管理员可见
CREATE POLICY "Quotes viewable by creator or admin" ON quotes
    FOR SELECT USING (
        sales_id = auth.uid() OR 
        auth.jwt() ->> 'role' = 'admin'
    );

-- 用户表策略：仅管理员可见
CREATE POLICY "Users viewable by admin" ON users
    FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');
```

## 三、API 接口详细设计

### 3.1 认证接口

```typescript
// 登录接口
POST /auth/v1/token?grant_type=password
Request:
{
  "email": "admin@example.com",
  "password": "password123"
}

Response:
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 3600,
  "refresh_token": "v1.MYu5xLKC7NSNLBFR3LqLxn2M-R...",
  "user": {
    "id": "uuid",
    "email": "admin@example.com",
    "role": "admin"
  }
}
```

### 3.2 Edge Functions 设计

```typescript
// Edge Function: 生成报价单编号
// /functions/generate-quote-no/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  // 生成格式：YYYYMMDD-XXX
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  
  // 查询今日已有的最大编号
  const { data, error } = await supabase
    .from('quotes')
    .select('quote_no')
    .like('quote_no', `${today}-%`)
    .order('quote_no', { ascending: false })
    .limit(1)

  let sequence = 1
  if (data && data.length > 0) {
    const lastNo = data[0].quote_no
    sequence = parseInt(lastNo.split('-')[1]) + 1
  }

  const quoteNo = `${today}-${sequence.toString().padStart(3, '0')}`

  return new Response(
    JSON.stringify({ quote_no: quoteNo }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})

// Edge Function: 计算报价总价
// /functions/calculate-quote-total/index.ts
interface QuoteItem {
  unit_price: number
  quantity: number
}

export const calculateTotal = (items: QuoteItem[]): number => {
  return items.reduce((sum, item) => {
    return sum + (item.unit_price * item.quantity)
  }, 0)
}

// Edge Function: 导出报价单Excel
// /functions/export-quotes/index.ts
import * as XLSX from 'https://cdn.sheetjs.com/xlsx-0.19.3/package/xlsx.mjs'

serve(async (req) => {
  const { startDate, endDate, status } = await req.json()
  
  // 查询报价数据
  const { data: quotes } = await supabase
    .from('quotes')
    .select(`
      *,
      customer:customers(*),
      sales:users(*),
      items:quote_items(*)
    `)
    .gte('created_at', startDate)
    .lte('created_at', endDate)
    .eq('status', status)

  // 转换为Excel格式
  const worksheet = XLSX.utils.json_to_sheet(quotes.map(quote => ({
    '报价单号': quote.quote_no,
    '客户名称': quote.customer.name,
    '客户电话': quote.customer.phone,
    '销售人员': quote.sales?.name || '系统',
    '总金额': quote.total_price,
    '状态': quote.status,
    '创建时间': quote.created_at
  })))

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, '报价单列表')
  
  const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
  
  return new Response(excelBuffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="quotes_${startDate}_${endDate}.xlsx"`
    }
  })
})
```

## 四、前端架构设计

### 4.1 项目结构

```
frontend/
├── src/
│   ├── api/                    # API 服务层
│   │   ├── client.ts          # Supabase 客户端初始化
│   │   ├── auth.ts            # 认证相关 API
│   │   ├── products.ts        # 产品相关 API
│   │   ├── quotes.ts          # 报价单相关 API
│   │   └── types.ts           # API 类型定义
│   │
│   ├── components/            # 组件库
│   │   ├── common/           # 通用组件
│   │   │   ├── AppHeader.vue
│   │   │   ├── AppFooter.vue
│   │   │   ├── Loading.vue
│   │   │   └── ErrorBoundary.vue
│   │   ├── sales/            # 销售端组件
│   │   │   ├── ProductSelector.vue
│   │   │   ├── CustomerForm.vue
│   │   │   └── QuotePreview.vue
│   │   └── admin/            # 管理端组件
│   │       ├── DataTable.vue
│   │       ├── StatCard.vue
│   │       └── ChartWidget.vue
│   │
│   ├── composables/          # 组合式函数
│   │   ├── useAuth.ts
│   │   ├── useApi.ts
│   │   ├── useForm.ts
│   │   └── useNotification.ts
│   │
│   ├── pages/
│   │   ├── sales/           # 销售端页面
│   │   │   ├── index.vue    # 首页
│   │   │   ├── quote/
│   │   │   │   ├── create.vue
│   │   │   │   └── preview.vue
│   │   │   └── history.vue
│   │   └── admin/           # 管理端页面
│   │       ├── login.vue
│   │       ├── dashboard.vue
│   │       ├── quotes/
│   │       ├── products/
│   │       └── users/
│   │
│   ├── stores/              # Pinia 状态管理
│   │   ├── auth.ts
│   │   ├── products.ts
│   │   └── quotes.ts
│   │
│   ├── styles/              # 样式文件
│   │   ├── variables.scss   # 变量定义
│   │   ├── mixins.scss     # 混入
│   │   └── global.scss     # 全局样式
│   │
│   └── utils/               # 工具函数
│       ├── validators.ts    # 验证函数
│       ├── formatters.ts    # 格式化函数
│       └── constants.ts     # 常量定义
```

### 4.2 核心组件设计

```vue
<!-- ProductSelector.vue - 产品选择组件 -->
<template>
  <div class="product-selector">
    <uni-search-bar 
      v-model="searchKeyword"
      placeholder="搜索产品名称或型号"
      @confirm="handleSearch"
    />
    
    <scroll-view 
      scroll-y 
      class="product-list"
      @scrolltolower="loadMore"
    >
      <div
        v-for="product in filteredProducts"
        :key="product.id"
        class="product-item"
        @click="selectProduct(product)"
      >
        <image 
          :src="product.image_url" 
          mode="aspectFill"
          class="product-image"
        />
        <div class="product-info">
          <text class="product-name">{{ product.name }}</text>
          <text class="product-model">型号: {{ product.model }}</text>
          <text class="product-price">¥{{ product.price }}/{{ product.unit }}</text>
        </div>
        <div v-if="product.skus?.length > 0" class="sku-selector">
          <picker
            mode="selector"
            :range="product.skus"
            range-key="spec"
            @change="(e) => selectSku(product, e.detail.value)"
          >
            <view class="uni-input">选择规格</view>
          </picker>
        </div>
      </div>
    </scroll-view>
    
    <div class="selected-products">
      <div 
        v-for="(item, index) in selectedItems"
        :key="index"
        class="selected-item"
      >
        <text>{{ item.name }} x {{ item.quantity }}</text>
        <text>¥{{ item.total_price }}</text>
        <button @click="removeItem(index)">删除</button>
      </div>
    </div>
    
    <div class="total-section">
      <text>合计: ¥{{ totalPrice }}</text>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useProductStore } from '@/stores/products'
import type { Product, QuoteItem } from '@/api/types'

const productStore = useProductStore()
const searchKeyword = ref('')
const selectedItems = ref<QuoteItem[]>([])

const filteredProducts = computed(() => {
  return productStore.products.filter(p => 
    p.name.includes(searchKeyword.value) || 
    p.model.includes(searchKeyword.value)
  )
})

const totalPrice = computed(() => {
  return selectedItems.value.reduce((sum, item) => sum + item.total_price, 0)
})

const selectProduct = (product: Product) => {
  const existingItem = selectedItems.value.find(item => item.product_id === product.id)
  if (existingItem) {
    existingItem.quantity++
    existingItem.total_price = existingItem.unit_price * existingItem.quantity
  } else {
    selectedItems.value.push({
      product_id: product.id,
      type: 'product',
      name: product.name,
      model: product.model,
      unit_price: product.price,
      quantity: 1,
      total_price: product.price,
      image_url: product.image_url
    })
  }
}

const emit = defineEmits<{
  update: [items: QuoteItem[]]
}>()

watch(selectedItems, (items) => {
  emit('update', items)
}, { deep: true })
</script>
```

### 4.3 状态管理设计

```typescript
// stores/quotes.ts
import { defineStore } from 'pinia'
import { supabase } from '@/api/client'
import type { Quote, QuoteItem } from '@/api/types'

export const useQuoteStore = defineStore('quotes', {
  state: () => ({
    quotes: [] as Quote[],
    currentQuote: null as Quote | null,
    loading: false,
    error: null as string | null
  }),

  getters: {
    pendingQuotes: (state) => 
      state.quotes.filter(q => q.status === 'pending'),
    
    totalQuotesAmount: (state) => 
      state.quotes.reduce((sum, q) => sum + q.total_price, 0)
  },

  actions: {
    async fetchQuotes() {
      this.loading = true
      try {
        const { data, error } = await supabase
          .from('quotes')
          .select(`
            *,
            customer:customers(*),
            items:quote_items(*)
          `)
          .order('created_at', { ascending: false })
        
        if (error) throw error
        this.quotes = data
      } catch (error) {
        this.error = error.message
      } finally {
        this.loading = false
      }
    },

    async createQuote(quoteData: Partial<Quote>) {
      this.loading = true
      try {
        // 1. 生成报价单号
        const { data: { quote_no } } = await supabase
          .functions.invoke('generate-quote-no')
        
        // 2. 创建报价单
        const { data: quote, error } = await supabase
          .from('quotes')
          .insert({
            ...quoteData,
            quote_no,
            status: 'pending'
          })
          .select()
          .single()
        
        if (error) throw error
        
        // 3. 创建报价明细
        const items = quoteData.items?.map(item => ({
          ...item,
          quote_id: quote.id
        }))
        
        await supabase
          .from('quote_items')
          .insert(items)
        
        this.quotes.unshift(quote)
        return quote
      } catch (error) {
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    }
  }
})
```

## 五、安全架构设计

### 5.1 认证流程

```
┌─────────┐      ┌──────────┐      ┌──────────┐
│  用户   │      │  前端应用  │      │ Supabase │
└────┬────┘      └─────┬────┘      └─────┬────┘
     │                 │                  │
     │   1. 输入账号密码 │                  │
     │────────────────>│                  │
     │                 │                  │
     │                 │  2. 调用登录API   │
     │                 │─────────────────>│
     │                 │                  │
     │                 │  3. 验证并返回JWT │
     │                 │<─────────────────│
     │                 │                  │
     │  4. 登录成功跳转  │                  │
     │<────────────────│                  │
     │                 │                  │
     │                 │  5. 携带JWT请求   │
     │─────────────────────────────────>│
     │                 │                  │
     │                 │  6. RLS验证权限  │
     │                 │                  │
     │  7. 返回数据     │                  │
     │<─────────────────────────────────│
```

### 5.2 数据加密策略

1. **传输加密**
   - 所有 API 通信使用 HTTPS
   - WebSocket 使用 WSS

2. **存储加密**
   - 密码使用 bcrypt 加密
   - 敏感数据字段使用 pgcrypto 加密

3. **文件安全**
   - 图片上传限制类型和大小
   - 使用签名 URL 访问私有文件

## 六、性能优化策略

### 6.1 前端优化

1. **代码分割**
```javascript
// 路由懒加载
const routes = [
  {
    path: '/admin/dashboard',
    component: () => import('@/pages/admin/dashboard.vue')
  }
]
```

2. **图片优化**
- 使用 WebP 格式
- 懒加载图片
- 缩略图预加载

3. **缓存策略**
```typescript
// 使用 localStorage 缓存产品数据
const CACHE_KEY = 'products_cache'
const CACHE_DURATION = 1000 * 60 * 5 // 5分钟

export const getCachedProducts = () => {
  const cached = localStorage.getItem(CACHE_KEY)
  if (cached) {
    const { data, timestamp } = JSON.parse(cached)
    if (Date.now() - timestamp < CACHE_DURATION) {
      return data
    }
  }
  return null
}
```

### 6.2 后端优化

1. **数据库优化**
- 合理使用索引
- 使用物化视图优化统计查询
- 连接池配置

2. **API 优化**
- 分页查询
- 字段筛选
- 批量操作

## 七、监控和日志

### 7.1 前端监控

```typescript
// 错误监控
window.addEventListener('unhandledrejection', event => {
  console.error('Unhandled promise rejection:', event.reason)
  // 上报到监控系统
  reportError({
    type: 'unhandledRejection',
    error: event.reason,
    url: window.location.href,
    userAgent: navigator.userAgent
  })
})

// 性能监控
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (entry.entryType === 'navigation') {
      console.log('Page load time:', entry.loadEventEnd - entry.fetchStart)
    }
  }
})
observer.observe({ entryTypes: ['navigation'] })
```

### 7.2 后端监控

```sql
-- 创建监控视图
CREATE VIEW api_performance AS
SELECT 
  date_trunc('hour', created_at) as hour,
  action,
  COUNT(*) as request_count,
  AVG(response_time) as avg_response_time,
  MAX(response_time) as max_response_time
FROM operation_logs
GROUP BY date_trunc('hour', created_at), action;

-- 慢查询监控
CREATE INDEX CONCURRENTLY idx_logs_response_time 
ON operation_logs(response_time) 
WHERE response_time > 1000; -- 超过1秒的请求
```

## 八、部署架构

### 8.1 环境配置

```yaml
# .env.development
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
VITE_API_TIMEOUT=30000

# .env.production
VITE_SUPABASE_URL=https://prod.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
VITE_API_TIMEOUT=10000
VITE_SENTRY_DSN=xxx
```

### 8.2 CI/CD 流程

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run tests
        run: npm test
        
      - name: Build
        run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
          
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

---

此技术架构设计为三个终端提供了详细的实现指南，确保开发团队能够高效协作，按时交付高质量的报价系统。