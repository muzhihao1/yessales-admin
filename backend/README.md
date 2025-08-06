# 耶氏台球斗南销售中心报价系统 - 后端 (Terminal 1)

## 项目概述

这是报价系统的后端部分，使用 Supabase 作为后端服务，提供数据库、认证、存储和 API 功能。

## 技术栈

- **数据库**: PostgreSQL (Supabase)
- **认证**: Supabase Auth
- **存储**: Supabase Storage
- **API**: REST API + Edge Functions
- **运行时**: Deno (Edge Functions)

## 项目结构

```
backend/
├── supabase/
│   ├── config.toml          # Supabase 配置文件
│   ├── migrations/          # 数据库迁移文件
│   │   ├── 20240101000000_initial_schema.sql    # 初始表结构
│   │   └── 20240101000001_rls_policies.sql      # RLS 策略
│   ├── functions/           # Edge Functions
│   │   ├── generate-quote-no/    # 生成报价单号
│   │   ├── calculate-quote-total/ # 计算报价总价
│   │   ├── export-quotes/        # 导出报价单
│   │   └── upload-image/         # 图片上传
│   └── seed.sql            # 测试数据
└── docs/                   # 文档
```

## 快速开始

### 1. 安装 Supabase CLI

```bash
# macOS
brew install supabase/tap/supabase

# Windows (使用 Scoop)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# Linux
wget -qO- https://github.com/supabase/cli/releases/download/v1.123.4/supabase_linux_amd64.tar.gz | tar xvz
sudo mv supabase /usr/local/bin/
```

### 2. 启动本地 Supabase

```bash
cd backend
supabase start
```

这将启动以下服务：
- **API URL**: http://localhost:54321
- **GraphQL URL**: http://localhost:54321/graphql/v1
- **DB URL**: postgresql://postgres:postgres@localhost:54322/postgres
- **Studio URL**: http://localhost:54323
- **Inbucket URL**: http://localhost:54324 (邮件测试)
- **anon key**: 将在启动时显示
- **service_role key**: 将在启动时显示

### 3. 应用数据库迁移

```bash
# 应用所有迁移
supabase db reset

# 这将执行：
# 1. 创建所有表结构
# 2. 设置 RLS 策略
# 3. 插入测试数据 (seed.sql)
```

### 4. 部署 Edge Functions

```bash
# 部署所有函数
supabase functions deploy

# 或部署单个函数
supabase functions deploy generate-quote-no
```

### 5. 测试 API

```bash
# 测试生成报价单号
curl -X POST http://localhost:54321/functions/v1/generate-quote-no \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json"

# 测试计算总价
curl -X POST http://localhost:54321/functions/v1/calculate-quote-total \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {"unit_price": 100, "quantity": 2},
      {"unit_price": 50, "quantity": 3}
    ]
  }'
```

## 数据库表结构

1. **customers** - 客户信息表
2. **products** - 产品信息表
3. **product_skus** - 产品SKU表（用于地毯等多规格产品）
4. **accessories** - 配件信息表
5. **users** - 用户表（销售员和管理员）
6. **quotes** - 报价单表
7. **quote_items** - 报价单明细表
8. **operation_logs** - 操作日志表

## API 接口

详细的 API 文档请查看 `/shared/api-docs/openapi.yaml`

### 主要接口

- **产品管理**: GET/POST/PUT/DELETE `/rest/v1/products`
- **配件管理**: GET/POST/PUT/DELETE `/rest/v1/accessories`
- **报价单管理**: GET/POST/PUT `/rest/v1/quotes`
- **客户管理**: GET/POST/PUT `/rest/v1/customers`
- **用户认证**: POST `/auth/v1/token`

### Edge Functions

- **生成报价单号**: POST `/functions/v1/generate-quote-no`
- **计算报价总价**: POST `/functions/v1/calculate-quote-total`
- **导出报价单**: POST `/functions/v1/export-quotes`
- **上传图片**: POST `/functions/v1/upload-image`

## Mock 数据

为了方便前端开发，我们提供了 Mock 数据文件：

- `/shared/mock/products.json` - 产品数据
- `/shared/mock/accessories.json` - 配件数据
- `/shared/mock/quotes.json` - 报价单数据
- `/shared/mock/customers.json` - 客户数据
- `/shared/mock/auth.json` - 认证相关数据

## 测试账号

- **管理员**: admin / Admin@123
- **销售员1**: sales01 / Sales@123
- **销售员2**: sales02 / Sales@123

## 环境变量

创建 `.env` 文件：

```env
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

## 部署到生产环境

1. 在 [Supabase Dashboard](https://app.supabase.com) 创建项目
2. 获取项目 URL 和密钥
3. 链接本地项目到远程：

```bash
supabase link --project-ref your-project-ref
```

4. 推送数据库迁移：

```bash
supabase db push
```

5. 部署 Edge Functions：

```bash
supabase functions deploy
```

## 注意事项

1. **RLS 策略**: 所有表都启用了 RLS，确保数据安全
2. **销售端无需登录**: 报价单创建接口允许匿名访问
3. **管理端需要认证**: 管理功能需要 admin 角色
4. **图片上传限制**: 最大 5MB，仅支持 JPEG/PNG/WebP
5. **报价单编号**: 格式为 YYYYMMDD-XXX，每日重新计数

## 故障排除

### 数据库连接失败
```bash
# 检查 Supabase 是否运行
supabase status

# 重启服务
supabase stop
supabase start
```

### Edge Function 部署失败
```bash
# 查看函数日志
supabase functions logs generate-quote-no

# 本地测试函数
supabase functions serve generate-quote-no
```

### RLS 策略问题
```sql
-- 临时禁用 RLS 进行调试
ALTER TABLE your_table DISABLE ROW LEVEL SECURITY;

-- 记得重新启用
ALTER TABLE your_table ENABLE ROW LEVEL SECURITY;
```

## 联系方式

- Terminal 1 Lead: [联系信息]
- 项目群组: 耶氏报价系统开发组

---

**Phase 1 完成检查清单**:
- ✅ Supabase 项目配置
- ✅ 数据库表结构创建
- ✅ RLS 策略配置
- ✅ API 文档 (OpenAPI)
- ✅ Mock 数据文件
- ✅ Edge Functions 基础结构
- ✅ README 文档