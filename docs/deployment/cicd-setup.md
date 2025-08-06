# CI/CD 管道配置指南

## 概述

YesSales 使用 GitHub Actions 实现完整的 CI/CD 管道，包括自动化测试、安全扫描、部署和回滚等功能。

## 工作流概览

### 1. CI 管道 (ci.yml)

**触发条件**：
- Push 到 `main` 或 `develop` 分支
- Pull Request 到 `main` 分支

**包含任务**：
- 代码质量检查（ESLint、TypeScript）
- 单元测试和集成测试
- 安全扫描（npm audit、Snyk、Trufflehog）
- E2E 测试（仅在 PR 时运行）

### 2. CD 管道 (cd.yml)

**触发条件**：
- Push 到 `main` 分支（部署到 Staging）
- 推送标签 `v*`（部署到 Production）

**包含任务**：
- 构建应用
- 部署 Supabase Functions
- 部署到 Vercel
- 健康检查和烟雾测试
- 自动回滚（如果失败）

### 3. 数据库迁移 (db-migration.yml)

**触发条件**：手动触发（workflow_dispatch）

**功能**：
- 数据库备份
- 预览迁移变更
- 执行迁移
- 自动回滚（如果失败）

### 4. 依赖更新 (dependency-update.yml)

**触发条件**：
- 每周一自动运行
- 手动触发

**功能**：
- 检查依赖更新
- 安全漏洞扫描
- 自动创建更新 PR

## 环境配置

### GitHub Secrets 配置

在 GitHub 仓库的 Settings > Secrets and variables > Actions 中配置以下密钥：

#### 通用配置
```
GITHUB_TOKEN                 # GitHub 自动生成，用于创建 PR 等
```

#### Supabase 配置
```
SUPABASE_ACCESS_TOKEN        # Supabase CLI 访问令牌

# Staging 环境
STAGING_SUPABASE_URL         # Staging Supabase 项目 URL
STAGING_SUPABASE_ANON_KEY    # Staging 匿名密钥
STAGING_PROJECT_REF          # Staging 项目引用
STAGING_DB_URL               # Staging 数据库连接 URL
STAGING_URL                  # Staging 应用 URL

# Production 环境
PROD_SUPABASE_URL            # Production Supabase 项目 URL
PROD_SUPABASE_ANON_KEY       # Production 匿名密钥
PROD_PROJECT_REF             # Production 项目引用
PROD_DB_URL                  # Production 数据库连接 URL
PROD_URL                     # Production 应用 URL

# 测试环境
TEST_SUPABASE_URL            # 测试环境 Supabase URL
TEST_SUPABASE_ANON_KEY       # 测试环境匿名密钥
```

#### Vercel 配置
```
VERCEL_TOKEN                 # Vercel 部署令牌
VERCEL_ORG_ID               # Vercel 组织 ID
VERCEL_PROJECT_ID           # Vercel 项目 ID
```

#### 安全扫描配置
```
SNYK_TOKEN                  # Snyk 安全扫描令牌
CODECOV_TOKEN               # Codecov 代码覆盖率令牌
```

#### 通知配置
```
SLACK_WEBHOOK               # Slack 通知 Webhook URL
```

### 环境保护规则

在 GitHub 仓库的 Settings > Environments 中配置：

#### Staging 环境
- **保护规则**：无需审批
- **部署分支**：仅 `main` 分支
- **环境密钥**：配置 Staging 相关密钥

#### Production 环境
- **保护规则**：需要 1 人审批
- **审批人员**：项目负责人
- **部署分支**：仅标签
- **环境密钥**：配置 Production 相关密钥

## 部署流程

### 日常开发部署

1. **功能开发**：
   ```bash
   git checkout -b feature/new-feature
   # 开发功能...
   git add .
   git commit -m "feat: add new feature"
   git push origin feature/new-feature
   ```

2. **创建 Pull Request**：
   - 创建 PR 到 `main` 分支
   - CI 管道自动运行（包括 E2E 测试）
   - 代码审查完成后合并

3. **自动部署到 Staging**：
   - 合并到 `main` 后自动触发
   - 部署到 Staging 环境
   - 运行烟雾测试

### 生产发布

1. **创建发布标签**：
   ```bash
   git checkout main
   git pull origin main
   git tag -a v1.0.0 -m "Release version 1.0.0"
   git push origin v1.0.0
   ```

2. **自动部署到生产**：
   - 推送标签后自动触发
   - 运行完整测试套件
   - 部署到生产环境
   - 创建 GitHub Release

### 数据库迁移

1. **准备迁移文件**：
   ```bash
   # 创建迁移文件
   supabase migration new add_new_table
   ```

2. **执行迁移**：
   - 在 GitHub Actions 中手动触发 "Database Migration" 工作流
   - 选择目标环境（staging/production）
   - 选择是否为预览模式（dry run）

3. **迁移验证**：
   - 检查备份是否创建
   - 验证迁移结果
   - 运行后置测试

## 监控和通知

### Slack 通知

所有重要事件都会发送 Slack 通知：

- **#deployments**：Staging 部署通知
- **#production**：生产部署通知
- **#database**：数据库迁移通知
- **#security**：安全漏洞通知

### 部署状态监控

- **健康检查**：每次部署后自动运行
- **烟雾测试**：验证核心功能正常
- **错误监控**：集成应用错误报告

## 故障处理

### 自动回滚

系统具备自动回滚功能：

1. **应用回滚**：Vercel 部署失败时自动回滚
2. **数据库回滚**：迁移失败时从备份恢复
3. **通知告警**：所有回滚操作都会发送通知

### 手动回滚

如需手动回滚：

1. **应用回滚**：
   ```bash
   # 在 Vercel Dashboard 中回滚
   # 或使用 CLI
   vercel rollback
   ```

2. **数据库回滚**：
   ```bash
   # 从备份恢复
   psql $DATABASE_URL < backup_file.sql
   ```

## 最佳实践

### 1. 分支策略

- **main**：主分支，自动部署到 Staging
- **feature/**：功能分支，开发新功能
- **hotfix/**：紧急修复分支，可直接合并到 main
- **release/**：发布准备分支（可选）

### 2. 提交规范

使用 Conventional Commits 规范：

```
feat: 新功能
fix: Bug 修复
docs: 文档更新
style: 代码格式化
refactor: 代码重构
test: 测试相关
chore: 构建过程或辅助工具的变动
```

### 3. 标签规范

- **v1.0.0**：正式版本发布
- **v1.0.0-beta.1**：Beta 版本
- **v1.0.0-alpha.1**：Alpha 版本

### 4. 环境隔离

- **Development**：本地开发环境
- **Staging**：测试环境，模拟生产
- **Production**：生产环境

### 5. 安全考虑

- 定期更新依赖
- 运行安全扫描
- 保护敏感密钥
- 限制环境访问权限

## 性能优化

### 1. 缓存策略

- **NPM 缓存**：缓存 node_modules
- **构建缓存**：缓存 Next.js 构建结果
- **Docker 缓存**：缓存 Docker 镜像层

### 2. 并行执行

- 测试任务并行运行
- 安全扫描与功能测试并行
- 多环境部署并行执行

### 3. 增量构建

- 仅在相关文件变更时运行特定任务
- 使用路径过滤器优化工作流

## 扩展功能

### 集成其他服务

可以扩展集成：

- **监控服务**：DataDog、New Relic
- **错误跟踪**：Sentry
- **性能监控**：Lighthouse CI
- **代码质量**：SonarQube

### 自定义工作流

根据需要添加自定义工作流：

- 性能测试
- 安全审计
- 文档生成
- 多环境同步

## 问题排查

### 常见问题

1. **构建失败**：
   - 检查依赖版本
   - 验证环境变量
   - 查看构建日志

2. **测试失败**：
   - 本地运行测试
   - 检查测试数据
   - 验证测试环境

3. **部署失败**：
   - 检查密钥配置
   - 验证网络连接
   - 查看部署日志

### 调试技巧

- 使用 `workflow_dispatch` 手动触发工作流
- 添加调试输出语句
- 使用 SSH 调试（如 tmate）
- 检查 Actions 运行历史

## 维护清单

### 每周

- [ ] 检查依赖更新 PR
- [ ] 审查安全扫描结果
- [ ] 清理旧的工作流运行

### 每月

- [ ] 更新 Actions 版本
- [ ] 审查和优化工作流
- [ ] 清理旧的部署和备份

### 每季度

- [ ] 评估 CI/CD 性能
- [ ] 更新最佳实践
- [ ] 培训团队成员