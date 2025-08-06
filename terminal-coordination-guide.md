# 三终端协作指南 - 快速参考手册

## 一、终端职责一览表

| 终端 | 负责人 | 主要职责 | 关键交付物 |
|------|--------|----------|------------|
| **Terminal 1 (后端)** | Backend Lead | Supabase 配置、数据库、API、认证 | API文档、数据库Schema、Edge Functions |
| **Terminal 2 (销售前端)** | Sales Frontend Lead | 销售端UI、无登录报价流程、移动适配 | 销售端H5应用、组件库 |
| **Terminal 3 (管理前端)** | Admin Frontend Lead | 管理端UI、登录系统、数据管理 | 管理端Web应用、统计报表 |

## 二、每日协作流程

### 2.1 每日站会 (9:00 AM)
```
会议结构 (15分钟):
1. Terminal 1 汇报 (5分钟)
   - API 完成进度
   - 今日计划
   - 需要协助事项

2. Terminal 2 汇报 (5分钟)
   - 页面开发进度
   - API 集成状态
   - 遇到的问题

3. Terminal 3 汇报 (5分钟)
   - 管理功能进度
   - 数据对接情况
   - 风险提示
```

### 2.2 关键同步点

| 时间 | 事项 | 责任方 | 输出 |
|------|------|--------|------|
| Day 1 | API 规范发布 | Terminal 1 | OpenAPI 文档 |
| Day 2 | Mock 数据提供 | Terminal 1 | Mock JSON 文件 |
| Day 3 | 共享组件确认 | Terminal 2&3 | 组件列表 |
| Day 5 | 首批 API 就绪 | Terminal 1 | 测试环境地址 |
| Day 10 | API 集成开始 | Terminal 2&3 | 集成计划 |
| Day 15 | 功能联调 | 所有终端 | 测试报告 |

## 三、技术接口约定

### 3.1 API 命名规范
```
GET    /api/{resource}          # 获取列表
GET    /api/{resource}/{id}     # 获取详情
POST   /api/{resource}          # 创建资源
PUT    /api/{resource}/{id}     # 更新资源
DELETE /api/{resource}/{id}     # 删除资源

示例:
GET    /api/products           # 获取产品列表
POST   /api/quotes             # 创建报价单
```

### 3.2 统一响应格式
```typescript
// 成功响应
{
  "success": true,
  "data": { ... },
  "pagination": {
    "page": 1,
    "page_size": 20,
    "total": 100
  }
}

// 错误响应
{
  "success": false,
  "error": {
    "code": "INVALID_INPUT",
    "message": "手机号格式不正确",
    "field": "phone"
  }
}
```

### 3.3 错误代码表

| 错误代码 | 说明 | HTTP状态码 |
|---------|------|-----------|
| UNAUTHORIZED | 未授权 | 401 |
| FORBIDDEN | 无权限 | 403 |
| NOT_FOUND | 资源不存在 | 404 |
| INVALID_INPUT | 输入无效 | 400 |
| DUPLICATE_ENTRY | 重复数据 | 409 |
| SERVER_ERROR | 服务器错误 | 500 |

## 四、文件共享约定

### 4.1 共享文件位置
```
shared/
├── api-docs/          # API 文档 (Terminal 1 维护)
│   ├── openapi.yaml
│   └── postman.json
├── types/             # TypeScript 类型 (共同维护)
│   ├── models.ts
│   └── api.ts
├── mock/              # Mock 数据 (Terminal 1 提供)
│   ├── products.json
│   └── quotes.json
└── assets/            # 设计资源 (Terminal 2&3 共享)
    ├── logo.png
    └── icons/
```

### 4.2 代码提交规范
```
<type>(<scope>): <subject>

type: feat|fix|docs|style|refactor|test|chore
scope: backend|sales|admin|shared

示例:
feat(backend): 添加报价单生成API
fix(sales): 修复产品选择器样式问题
docs(shared): 更新API文档
```

## 五、冲突解决机制

### 5.1 技术冲突处理

| 冲突类型 | 解决方案 | 决策者 |
|---------|---------|--------|
| API 接口变更 | 提前通知，向后兼容 | Terminal 1 Lead |
| 组件样式冲突 | 使用命名空间隔离 | Terminal 2&3 协商 |
| 数据格式不一致 | 以 API 文档为准 | Terminal 1 Lead |
| 功能理解偏差 | 参考 PRD，产品确认 | 产品经理 |

### 5.2 紧急问题处理流程
```
1. 发现问题 → 在群组中 @相关负责人
2. 15分钟内响应 → 评估影响范围
3. 确定解决方案 → 通知所有相关方
4. 执行修复 → 更新文档
5. 验证完成 → 关闭问题
```

## 六、测试协作

### 6.1 测试环境

| 环境 | 用途 | 访问地址 | 维护方 |
|------|------|---------|--------|
| Dev | 开发自测 | dev.yessales.com | 各终端 |
| Test | 集成测试 | test.yessales.com | Terminal 1 |
| UAT | 验收测试 | uat.yessales.com | 所有终端 |

### 6.2 测试数据账号
```
销售端 (无需登录)
- 直接访问: https://sales.yessales.com

管理端测试账号:
- 管理员: admin / Test@123
- 销售员: sales01 / Test@123
```

## 七、关键检查点

### 7.1 每周检查清单

**周一**
- [ ] 更新本周任务计划
- [ ] 同步上周未完成事项
- [ ] 确认本周集成计划

**周三**
- [ ] 中期进度检查
- [ ] API 集成问题汇总
- [ ] 风险评估

**周五**
- [ ] 本周完成情况总结
- [ ] 下周计划确认
- [ ] 文档更新

### 7.2 里程碑检查

| 里程碑 | 时间 | 检查项 |
|--------|------|--------|
| M1: 基础框架 | Day 5 | 项目可运行、基础API可用 |
| M2: 核心功能 | Day 10 | 主要功能完成50% |
| M3: 功能完成 | Day 15 | 所有功能开发完成 |
| M4: 测试修复 | Day 18 | Bug修复、性能优化 |
| M5: 上线准备 | Day 20 | 部署就绪、文档完整 |

## 八、常见问题快速解答

### Q1: API 还没好，前端怎么开发？
**A**: 使用 Terminal 1 提供的 Mock 数据，先完成 UI 和交互逻辑。

### Q2: 接口字段变更了怎么办？
**A**: Terminal 1 需提前一天通知，并更新文档，保持向后兼容。

### Q3: 样式冲突了怎么处理？
**A**: Sales 组件使用 `.sales-` 前缀，Admin 组件使用 `.admin-` 前缀。

### Q4: 发现 PRD 理解有偏差？
**A**: 立即在群里讨论，必要时找产品经理确认。

### Q5: 某个终端进度落后怎么办？
**A**: 日站会上提出，其他终端评估是否可以支援。

## 九、工具和资源

### 9.1 开发工具
- **代码仓库**: GitHub - github.com/yessales/quotation-system
- **API 测试**: Postman - 团队工作空间已共享
- **设计稿**: Figma - [设计链接]
- **项目管理**: GitHub Projects
- **即时通讯**: 钉钉群 - 耶氏报价系统开发组

### 9.2 重要链接
- [API 文档](http://localhost:3000/api-docs)
- [PRD 文档](/PRD.md)
- [技术架构](/technical-architecture.md)
- [开发计划](/development-plan.md)

## 十、联系人清单

| 角色 | 姓名 | 职责 | 联系方式 |
|------|------|------|----------|
| 项目经理 | - | 整体协调 | - |
| Terminal 1 Lead | - | 后端开发 | - |
| Terminal 2 Lead | - | 销售前端 | - |
| Terminal 3 Lead | - | 管理前端 | - |
| 产品经理 | - | 需求确认 | - |
| 测试负责人 | - | 质量保证 | - |

---

**重要提醒**:
1. 保持文档同步更新
2. 有问题及时沟通
3. 代码提交前先 pull 最新代码
4. 关注每日站会通知
5. 遵循代码规范和提交规范

**紧急联系**: 如遇阻塞问题，请在钉钉群 @all 或直接联系相关 Lead。