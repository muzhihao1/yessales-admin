# API服务集成层文档

## 概述

本API服务集成层提供了完整的Supabase API集成，替换了之前的Mock服务，提供生产级别的API调用功能。

## 架构组成

### 核心模块

- **config.ts** - API配置和Supabase客户端设置
- **client.ts** - 增强的API客户端，包含重试机制、缓存、拦截器
- **service.ts** - 统一的API服务入口，提供与MockService相同的接口
- **init.ts** - API初始化和健康检查功能

### 功能模块

- **auth.ts** - 用户认证相关API
- **products.ts** - 产品管理相关API  
- **quotes.ts** - 报价单管理相关API

## 快速使用

### 1. 应用初始化

在应用启动时调用初始化函数：

```typescript
import { initializeApi } from '@/api';

// 在main.ts或App.vue中调用
initializeApi();
```

### 2. 基本使用

```typescript
import { ApiService } from '@/api';

// 获取产品列表
const products = await ApiService.getProducts();

// 创建报价单
const quote = await ApiService.createQuote(quoteData);

// 用户登录
const loginResult = await ApiService.login({ username, password });
```

### 3. 响应格式

所有API调用都返回统一的响应格式：

```typescript
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  pagination?: {
    page: number;
    page_size: number;
    total: number;
  };
}
```

## 主要功能

### 产品管理

```typescript
// 获取产品列表
await ApiService.getProducts({ limit: 10, category: 'billiard' });

// 获取单个产品
await ApiService.getProduct(productId);

// 搜索产品
await ApiService.searchProducts(keyword);

// 获取配件列表
await ApiService.getAccessories();
```

### 报价单管理

```typescript
// 获取报价单列表
await ApiService.getQuotes({ page: 1, page_size: 20 });

// 创建报价单
await ApiService.createQuote({
  customer: { name, phone, address },
  items: [{ product_id, quantity, unit_price }],
  remark: '备注信息'
});

// 根据手机号查询报价单
await ApiService.getQuotesByPhone(phone);

// 批准/拒绝报价单
await ApiService.approveQuote(quoteId);
await ApiService.rejectQuote(quoteId, reason);
```

### 用户认证

```typescript
// 用户登录
await ApiService.login({ username, password });

// 获取当前用户
await ApiService.getCurrentUser();

// 用户登出
await ApiService.logout();

// 检查认证状态
const isAuth = ApiService.isAuthenticated();
```

### 统计功能

```typescript
// 获取销售统计
await ApiService.getSalesStats({
  startDate: '2024-01-01',
  endDate: '2024-12-31'
});
```

### 文件上传

```typescript
// 上传文件
await ApiService.uploadFile(file, 'attachments', 'path/to/file');
```

## 高级功能

### 请求拦截器

```typescript
import { ApiClient } from '@/api';

// 添加请求拦截器
ApiClient.addRequestInterceptor((request) => {
  // 添加自定义请求头
  request.headers = request.headers || {};
  request.headers['X-Custom-Header'] = 'value';
  return request;
});
```

### 响应拦截器

```typescript
// 添加响应拦截器
ApiClient.addResponseInterceptor((response) => {
  // 处理全局错误
  if (!response.success) {
    console.error('API Error:', response.error);
  }
  return response;
});
```

### 缓存控制

API客户端自动缓存GET请求结果（5分钟TTL），可以通过以下方式控制：

```typescript
// 禁用特定请求的缓存
await ApiService.getProducts({ enableCache: false });

// 手动清理过期缓存
ApiClient.clearExpiredCache();
```

### 重试机制

客户端自动重试失败的请求：
- 网络错误：自动重试
- 服务器错误（5xx）：自动重试
- 限流错误（429）：自动重试
- 客户端错误（4xx）：不重试

重试配置可通过环境变量设置：
```env
VITE_API_RETRY_ATTEMPTS=3
VITE_API_RETRY_DELAY=1000
```

## 错误处理

### 错误类型

```typescript
enum ERROR_CODES {
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN', 
  NOT_FOUND = 'NOT_FOUND',
  INVALID_INPUT = 'INVALID_INPUT',
  DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',
  SERVER_ERROR = 'SERVER_ERROR'
}
```

### 错误处理示例

```typescript
const result = await ApiService.getProducts();

if (!result.success) {
  switch (result.error?.code) {
    case 'UNAUTHORIZED':
      // 处理未授权错误
      uni.navigateTo({ url: '/pages/auth/login' });
      break;
    case 'SERVER_ERROR':
      // 处理服务器错误
      uni.showToast({ title: '服务器错误，请稍后重试', icon: 'none' });
      break;
    default:
      // 处理其他错误  
      uni.showToast({ title: result.error?.message || '请求失败', icon: 'none' });
  }
}
```

## 健康检查

```typescript
import { checkApiHealth } from '@/api';

// 检查API服务健康状态
const isHealthy = await checkApiHealth();
if (!isHealthy) {
  console.warn('API服务状态异常');
}
```

## 环境配置

确保在.env文件中配置必要的环境变量：

```env
# Supabase配置
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# API配置
VITE_API_TIMEOUT=10000
VITE_API_RETRY_ATTEMPTS=3
VITE_API_RETRY_DELAY=1000
VITE_ENABLE_API_CACHE=true

# 开发模式配置
VITE_USE_REAL_API=true
```

## 迁移指南

### 从MockService迁移

原来使用MockService的代码：
```typescript
import { MockService } from '@/mock';
const products = await MockService.getProducts();
```

现在使用ApiService：
```typescript
import { ApiService } from '@/api';
const products = await ApiService.getProducts();
```

接口保持100%兼容，无需修改业务逻辑代码。

## 注意事项

1. **认证状态**：API会自动处理认证状态，认证失败时会清除本地存储并跳转到登录页
2. **缓存策略**：GET请求会自动缓存5分钟，可通过enableCache参数控制
3. **重试机制**：网络错误和服务器错误会自动重试，客户端错误不会重试
4. **错误处理**：建议在业务代码中检查response.success并处理错误情况
5. **性能优化**：客户端支持请求并发和指数退避重试策略

## 支持

如有问题请查看：
1. 浏览器开发者工具的Console和Network面板
2. Supabase仪表板的日志和监控
3. 本项目的docs/api/目录下的详细文档