# Vercel 部署环境变量配置指南

## 🚀 必需的环境变量配置

在 Vercel 项目设置中，需要配置以下环境变量以确保应用正常运行：

### 1. Supabase 核心配置 (必需)

```bash
# Supabase 项目 URL - 从 Supabase 项目设置中获取
VITE_SUPABASE_URL=https://your-project-ref.supabase.co

# Supabase 匿名密钥 - 从 Supabase 项目设置 > API 中获取
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 2. API 配置 (必需)

```bash
# 启用实际 API (生产环境必须为 true)
VITE_USE_REAL_API=true

# API 超时设置 (毫秒)
VITE_API_TIMEOUT=30000

# API 重试配置
VITE_API_RETRY_ATTEMPTS=3
VITE_API_RETRY_DELAY=1000

# 启用 API 缓存
VITE_ENABLE_API_CACHE=true
```

### 3. 应用基本信息 (推荐)

```bash
# 应用名称和版本
VITE_APP_NAME="YesSales Admin"
VITE_APP_VERSION="1.0.0"
VITE_ENVIRONMENT="production"
```

### 4. 功能开关 (可选)

```bash
# 实时功能
VITE_ENABLE_REAL_TIME=true

# 分析和监控
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_ERROR_TRACKING=true

# 性能优化
VITE_ENABLE_VIRTUAL_SCROLLING=true
VITE_ENABLE_ADVANCED_FILTERS=true
```

## 📋 Vercel 环境变量设置步骤

### 方法 1: 通过 Vercel 控制面板

1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 进入项目：`yessales-admin`
3. 点击 **Settings** 标签页
4. 找到 **Environment Variables** 部分
5. 点击 **Add** 按钮
6. 逐个添加上述环境变量：
   - **Name**: 变量名 (如: `VITE_SUPABASE_URL`)
   - **Value**: 变量值 (如: `https://your-project-ref.supabase.co`)
   - **Environment**: 选择 `Production` (生产环境)

### 方法 2: 通过 Vercel CLI (推荐)

```bash
# 安装 Vercel CLI (如果尚未安装)
npm i -g vercel

# 登录 Vercel
vercel login

# 设置环境变量
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
vercel env add VITE_USE_REAL_API
vercel env add VITE_API_TIMEOUT
```

## 🔐 获取 Supabase 凭据

### 1. 登录 Supabase Dashboard
访问 [https://supabase.com/dashboard](https://supabase.com/dashboard)

### 2. 创建或选择项目
- 如果是新项目，点击 **New Project**
- 如果已有项目，选择对应的项目

### 3. 获取 API 凭据
1. 在项目面板中，点击左侧菜单的 **Settings**
2. 点击 **API** 标签页
3. 复制以下值：
   - **Project URL** → `VITE_SUPABASE_URL`
   - **Project API keys** 下的 **anon public** → `VITE_SUPABASE_ANON_KEY`

## ✅ 验证配置

### 检查构建日志

部署后，在 Vercel 的构建日志中检查：

1. 环境变量是否正确加载
2. Supabase 连接是否成功
3. 构建过程是否无错误完成

### 测试应用功能

部署完成后测试：

1. 应用是否能正常加载
2. API 调用是否正常工作
3. 用户认证是否可用
4. 数据是否能正确显示

## 🚨 安全注意事项

### 环境变量安全

- ✅ **VITE_SUPABASE_URL**: 可以公开，这是公开的 API 端点
- ✅ **VITE_SUPABASE_ANON_KEY**: 可以公开，这是匿名公钥
- ❌ **不要** 在前端暴露 **service_role** 密钥
- ❌ **不要** 提交真实密钥到 Git 仓库

### Supabase 安全配置

确保在 Supabase 中配置了正确的：

1. **Row Level Security (RLS)** 策略
2. **域名白名单** (在 Authentication > URL Configuration)
3. **CORS 设置** 允许 Vercel 域名

## 📊 部署后监控

建议设置以下监控：

1. **Vercel Analytics**: 自动启用，监控性能指标
2. **Supabase Dashboard**: 监控 API 使用情况和错误
3. **Error Tracking**: 配置错误报告服务 (如 Sentry)

## 🔄 常见问题排查

### 构建失败

```bash
# 检查是否所有必需变量都已设置
Error: VITE_SUPABASE_URL is not defined
```

**解决方案**: 确保在 Vercel 中设置了所有必需的环境变量

### 运行时错误

```bash
# API 连接失败
Failed to fetch from Supabase
```

**解决方案**:
1. 验证 Supabase URL 和密钥是否正确
2. 检查 Supabase 项目是否处于活动状态
3. 验证域名是否在 Supabase 的允许列表中

### 认证问题

**解决方案**:
1. 检查 Supabase Authentication 设置
2. 确认重定向 URL 包含 Vercel 域名
3. 验证 RLS 策略配置

## 🎯 下一步操作

配置完成后，建议进行：

1. **端到端测试**: 验证所有核心功能
2. **性能监控**: 设置性能基线
3. **备份策略**: 配置数据库备份
4. **域名配置**: 设置自定义域名 (可选)

---

💡 **提示**: 保存此文档以备将来参考，并定期检查环境变量的有效性。