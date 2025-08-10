# UniApp to Vue 3 + PWA Migration Guide

本文档指导如何将YesSales项目从UniApp架构迁移到纯Vue 3 + PWA架构。

## 迁移概述

### 架构变更
- **从**: Vue 3 + UniApp (多终端方案)
- **到**: Vue 3 + PWA (现代Web应用)

### 主要收益
- 开发复杂度降低70%
- 构建配置简化(单一配置文件)
- 更好的调试体验和工具支持  
- 标准Web技术栈，更广泛的生态支持
- PWA功能提供接近原生体验

## 技术栈对比

| 组件 | UniApp架构 | 新架构 |
|------|------------|-------|
| 路由 | UniApp页面路由 | Vue Router |
| UI组件 | uni-* 组件 | Element Plus/Naive UI |
| 样式 | rpx单位 | rem/px + 响应式CSS |
| 构建 | 双Vite配置 | 单一Vite配置 + PWA插件 |
| 部署 | H5 + 小程序包 | 静态Web托管 |
| 移动端 | 小程序原生 | PWA + 响应式设计 |

## 迁移步骤

### 阶段1: 环境准备

1. **备份当前代码**
   ```bash
   git checkout -b backup-uniapp-architecture
   git push origin backup-uniapp-architecture
   ```

2. **分析现有组件依赖**
   ```bash
   # 搜索UniApp特定组件使用
   grep -r "uni-" frontend/src/
   grep -r "uni\." frontend/src/
   ```

### 阶段2: 创建新项目结构

1. **初始化新的Vue 3项目**
   ```bash
   cd frontend/
   npm create vue@latest . --typescript --router --pinia --eslint --prettier
   ```

2. **安装UI库和PWA插件**
   ```bash
   # 选择UI库 (二选一)
   npm install element-plus  # 桌面优先
   npm install naive-ui      # 轻量现代
   
   # PWA支持
   npm install -D vite-plugin-pwa
   npm install -D @types/node
   ```

3. **配置Vite + PWA**
   ```javascript
   // vite.config.ts
   import { defineConfig } from 'vite'
   import vue from '@vitejs/plugin-vue'
   import { VitePWA } from 'vite-plugin-pwa'

   export default defineConfig({
     plugins: [
       vue(),
       VitePWA({
         registerType: 'autoUpdate',
         workbox: {
           globPatterns: ['**/*.{js,css,html,ico,png,svg}']
         },
         manifest: {
           name: 'YesSales 报价系统',
           short_name: 'YesSales',
           description: '耶氏台球斗南销售中心报价系统',
           theme_color: '#ffffff',
           icons: [
             {
               src: 'icon-192.png',
               sizes: '192x192',
               type: 'image/png'
             }
           ]
         }
       })
     ]
   })
   ```

### 阶段3: 组件迁移映射

#### 3.1 UI组件替换
```vue
<!-- 原UniApp组件 -->
<uni-button type="primary" @click="handleClick">提交</uni-button>
<uni-input v-model="value" placeholder="请输入" />
<uni-navigator url="/pages/detail">详情</uni-navigator>

<!-- 新Vue 3组件 (Element Plus示例) -->
<el-button type="primary" @click="handleClick">提交</el-button>
<el-input v-model="value" placeholder="请输入" />
<router-link to="/detail">详情</router-link>
```

#### 3.2 API调用替换
```javascript
// 原UniApp API
uni.showModal({
  title: '提示',
  content: '确认删除吗？'
})

uni.showToast({
  title: '成功',
  icon: 'success'
})

// 新Web API (Element Plus示例)
ElMessageBox.confirm('确认删除吗？', '提示')
ElMessage.success('成功')
```

#### 3.3 存储API替换
```javascript
// 原UniApp存储
uni.setStorageSync('key', value)
const value = uni.getStorageSync('key')

// 新Web存储
localStorage.setItem('key', JSON.stringify(value))
const value = JSON.parse(localStorage.getItem('key') || '{}')
```

### 阶段4: 路由迁移

1. **创建路由配置**
   ```typescript
   // router/index.ts
   import { createRouter, createWebHistory } from 'vue-router'
   
   const routes = [
     {
       path: '/',
       name: 'Home',
       component: () => import('@/views/HomeView.vue')
     },
     {
       path: '/sales',
       name: 'Sales',
       component: () => import('@/views/sales/SalesView.vue')
     },
     // ... 其他路由
   ]

   export default createRouter({
     history: createWebHistory(),
     routes
   })
   ```

2. **页面组件迁移**
   - 将 `pages/` 目录下的页面移动到 `views/`
   - 移除UniApp页面配置(`onLoad`、`onShow`等)
   - 使用Vue Router的路由守卫替代

### 阶段5: 样式迁移

1. **单位转换**
   ```css
   /* 原rpx单位 */
   .container {
     width: 750rpx;
     padding: 20rpx;
   }

   /* 新响应式CSS */
   .container {
     width: 100%;
     max-width: 1200px;
     padding: 1rem;
     margin: 0 auto;
   }
   
   @media (max-width: 768px) {
     .container {
       padding: 0.5rem;
     }
   }
   ```

2. **响应式设计断点**
   ```css
   /* 移动优先设计 */
   .component {
     /* 手机样式 */
     font-size: 14px;
     padding: 8px;
   }
   
   @media (min-width: 768px) {
     .component {
       /* 平板样式 */
       font-size: 16px;
       padding: 12px;
     }
   }
   
   @media (min-width: 1024px) {
     .component {
       /* 桌面样式 */
       font-size: 18px;
       padding: 16px;
     }
   }
   ```

### 阶段6: 状态管理迁移

Pinia状态管理可以保持不变，只需要移除UniApp特定的持久化方案：

```typescript
// stores/user.ts
import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', () => {
  const user = ref<User | null>(null)
  
  // 使用Web API替代UniApp API
  const saveToStorage = (userData: User) => {
    localStorage.setItem('user', JSON.stringify(userData))
  }
  
  const loadFromStorage = () => {
    const stored = localStorage.getItem('user')
    return stored ? JSON.parse(stored) : null
  }
  
  return { user, saveToStorage, loadFromStorage }
})
```

### 阶段7: 构建和部署

1. **更新package.json脚本**
   ```json
   {
     "scripts": {
       "dev": "vite",
       "build": "vue-tsc && vite build",
       "preview": "vite preview",
       "lint": "eslint . --ext .vue,.js,.jsx,.cjs,.mjs,.ts,.tsx,.cts,.mts --fix --ignore-path .gitignore",
       "type-check": "vue-tsc --noEmit"
     }
   }
   ```

2. **部署到静态托管**
   ```bash
   # 构建
   npm run build
   
   # 部署到Netlify/Vercel/阿里云OSS等
   # dist/ 目录包含完整的静态网站
   ```

## 功能对等性检查

### 核心功能验证
- [ ] 用户认证和授权
- [ ] 产品目录浏览
- [ ] 报价创建和管理
- [ ] 客户数据管理
- [ ] 文件上传功能
- [ ] 移动端响应式适配

### PWA功能验证
- [ ] 离线缓存工作正常
- [ ] 可安装到桌面
- [ ] 服务工作线程更新
- [ ] 图标和启动画面

## 性能优化建议

1. **代码分割**
   ```typescript
   // 路由懒加载
   const Sales = () => import('@/views/SalesView.vue')
   
   // 组件懒加载
   const HeavyComponent = defineAsyncComponent(() => 
     import('@/components/HeavyComponent.vue')
   )
   ```

2. **图片优化**
   ```vue
   <template>
     <img 
       :src="imageUrl" 
       loading="lazy"
       :alt="description"
       style="max-width: 100%; height: auto;"
     />
   </template>
   ```

3. **缓存策略**
   ```javascript
   // vite.config.ts PWA配置
   VitePWA({
     workbox: {
       runtimeCaching: [
         {
           urlPattern: /^https:\/\/api\./,
           handler: 'NetworkFirst',
           options: {
             cacheName: 'api-cache'
           }
         }
       ]
     }
   })
   ```

## 潜在问题和解决方案

### 1. 微信生态集成
**问题**: 失去小程序原生能力  
**解决方案**: 使用微信JSSDK集成微信功能

### 2. 移动端体验
**问题**: Web应用可能不如原生流畅  
**解决方案**: PWA + 性能优化 + 响应式设计

### 3. 离线功能
**问题**: 网络依赖性  
**解决方案**: Service Worker缓存关键资源

## 测试计划

### 1. 功能测试
- 所有原有功能的等价性测试
- 新增PWA功能测试
- 跨浏览器兼容性测试

### 2. 性能测试  
- 页面加载速度对比
- 内存使用情况监控
- 移动端性能测试

### 3. 用户体验测试
- 移动端触控体验
- 响应式设计适配
- 离线使用场景测试

## 迁移时间预估

- **阶段1-2 (环境准备)**: 1-2天
- **阶段3-4 (组件和路由迁移)**: 3-5天  
- **阶段5-6 (样式和状态迁移)**: 2-3天
- **阶段7 (构建部署)**: 1天
- **测试和优化**: 2-3天

**总计**: 约10-15个工作日

## 风险评估

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| 功能缺失 | 高 | 详细功能对比和测试 |
| 性能下降 | 中 | 性能优化和PWA缓存 |  
| 用户适应 | 低 | 渐进式发布和用户培训 |
| 开发延期 | 中 | 详细计划和预留缓冲时间 |

## 后续维护建议

1. **监控和分析**
   - 使用Google Analytics跟踪用户行为
   - 实施性能监控(如Lighthouse CI)
   - 错误追踪(如Sentry)

2. **持续优化**
   - 定期更新依赖包
   - 监控Bundle大小变化
   - 优化核心Web指标(Core Web Vitals)

3. **功能增强**  
   - 探索更多PWA功能(推送通知、后台同步)
   - 考虑使用Web Components提升复用性
   - 实施微前端架构支持更大规模扩展