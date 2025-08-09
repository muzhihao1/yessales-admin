/**
 * Vue Router Configuration for Standard Web Build
 * Converts UniApp pages.json structure to Vue Router routes
 */

import { type RouteRecordRaw, createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/composables/useAuth'

// Import all page components
// Sales pages
const SalesIndex = () => import('@/pages/sales/index.vue')
const SalesQuoteCreate = () => import('@/pages/sales/quote/create.vue')
const SalesQuotePreview = () => import('@/pages/sales/quote/preview.vue')
const SalesHistory = () => import('@/pages/sales/history/index.vue')
const SalesSettings = () => import('@/pages/sales/settings/index.vue')

// Admin pages
const AdminLogin = () => import('@/pages/admin/login/index.vue')
const AdminDashboard = () => import('@/pages/admin/dashboard/index.vue')
const AdminQuotes = () => import('@/pages/admin/quotes/index.vue')
const AdminQuoteDetail = () => import('@/pages/admin/quotes/detail.vue')
const AdminProducts = () => import('@/pages/admin/products/index.vue')
const AdminProductEdit = () => import('@/pages/admin/products/edit.vue')
const AdminUsers = () => import('@/pages/admin/users/index.vue')
const AdminCustomers = () => import('@/pages/admin/customers/index.vue')
const AdminCustomerDetail = () => import('@/pages/admin/customers/detail.vue')
const AdminCustomerEdit = () => import('@/pages/admin/customers/edit.vue')
const AdminLogs = () => import('@/pages/admin/logs/index.vue')
const AdminSettings = () => import('@/pages/admin/settings/index.vue')

// Test pages
const TestIntegration = () => import('@/pages/test/integration.vue')
const TestMobileAdaptation = () => import('@/pages/test/mobile-adaptation.vue')

/**
 * Route definitions based on pages.json structure
 */
const routes: RouteRecordRaw[] = [
  // 智能引导根路径 - 根据用户身份和意图自动导向
  {
    path: '/',
    name: 'Home',
    beforeEnter: (to, from, next) => {
      const authStore = useAuthStore()

      // 如果已经是管理员身份且token有效，引导到管理后台
      if (authStore.isAdmin) {
        next('/admin/dashboard')
      }
      // 检查URL参数或来源，判断用户意图
      else if (to.query.admin || to.hash === '#admin') {
        next('/admin/login')
      }
      // 默认引导到销售端（符合PRD要求：用户端无需登录）
      else {
        next('/sales')
      }
    }
  },

  // Sales routes
  {
    path: '/sales',
    name: 'Sales',
    component: SalesIndex,
    meta: { title: '耶氏台球报价系统' }
  },
  {
    path: '/sales/quote/create',
    name: 'SalesQuoteCreate',
    component: SalesQuoteCreate,
    meta: { title: '新建报价' }
  },
  {
    path: '/sales/quote/preview',
    name: 'SalesQuotePreview',
    component: SalesQuotePreview,
    meta: { title: '报价预览' }
  },
  {
    path: '/sales/history',
    name: 'SalesHistory',
    component: SalesHistory,
    meta: { title: '我的报价' }
  },
  {
    path: '/sales/settings',
    name: 'SalesSettings',
    component: SalesSettings,
    meta: { title: '应用设置' }
  },

  // Admin routes - 管理端路由组
  {
    path: '/admin',
    beforeEnter: (to, from, next) => {
      const authStore = useAuthStore()

      // 如果已经登录，重定向到仪表盘
      if (authStore.isAdmin) {
        next('/admin/dashboard')
      }
      // 未登录则重定向到登录页
      else {
        next('/admin/login')
      }
    }
  },
  {
    path: '/admin/login',
    name: 'AdminLogin',
    component: AdminLogin,
    meta: {
      title: '登录',
      allowGuest: true // 允许未登录用户访问
    }
  },
  {
    path: '/admin/dashboard',
    name: 'AdminDashboard',
    component: AdminDashboard,
    meta: {
      title: '仪表盘',
      requiresAuth: true,
      requiresPermission: 'dashboard:read'
    }
  },
  {
    path: '/admin/quotes',
    name: 'AdminQuotes',
    component: AdminQuotes,
    meta: {
      title: '报价单管理',
      requiresAuth: true,
      requiresPermission: 'quotes:read'
    }
  },
  {
    path: '/admin/quotes/detail',
    name: 'AdminQuoteDetail',
    component: AdminQuoteDetail,
    meta: {
      title: '报价单详情',
      requiresAuth: true,
      requiresPermission: 'quotes:read'
    }
  },
  {
    path: '/admin/products',
    name: 'AdminProducts',
    component: AdminProducts,
    meta: {
      title: '产品管理',
      requiresAuth: true,
      requiresPermission: 'products:read'
    }
  },
  {
    path: '/admin/products/edit',
    name: 'AdminProductEdit',
    component: AdminProductEdit,
    meta: {
      title: '编辑产品',
      requiresAuth: true,
      requiresPermission: 'products:write'
    }
  },
  {
    path: '/admin/users',
    name: 'AdminUsers',
    component: AdminUsers,
    meta: {
      title: '用户管理',
      requiresAuth: true,
      requiresPermission: 'users:read'
    }
  },
  {
    path: '/admin/customers',
    name: 'AdminCustomers',
    component: AdminCustomers,
    meta: {
      title: '客户管理',
      requiresAuth: true,
      requiresPermission: 'customers:read'
    }
  },
  {
    path: '/admin/customers/detail',
    name: 'AdminCustomerDetail',
    component: AdminCustomerDetail,
    meta: {
      title: '客户详情',
      requiresAuth: true,
      requiresPermission: 'customers:read'
    }
  },
  {
    path: '/admin/customers/edit',
    name: 'AdminCustomerEdit',
    component: AdminCustomerEdit,
    meta: {
      title: '编辑客户',
      requiresAuth: true,
      requiresPermission: 'customers:write'
    }
  },
  {
    path: '/admin/logs',
    name: 'AdminLogs',
    component: AdminLogs,
    meta: {
      title: '操作日志',
      requiresAuth: true,
      requiresPermission: 'logs:read'
    }
  },
  {
    path: '/admin/settings',
    name: 'AdminSettings',
    component: AdminSettings,
    meta: {
      title: '系统设置',
      requiresAuth: true,
      requiresPermission: 'settings:read'
    }
  },

  // Test routes
  {
    path: '/test/integration',
    name: 'TestIntegration',
    component: TestIntegration,
    meta: { title: '集成测试' }
  },
  {
    path: '/test/mobile-adaptation',
    name: 'TestMobileAdaptation',
    component: TestMobileAdaptation,
    meta: { title: '移动端适配测试' }
  },

  // 404 fallback
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    redirect: '/sales'
  }
]

/**
 * Create and configure Vue Router instance
 */
const router = createRouter({
  history: createWebHistory('/'),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

/**
 * Global navigation guards - 全局路由守卫
 */
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  // 初始化身份验证状态（仅在应用启动时执行一次）
  if (to.path !== from.path || !from.path) {
    await authStore.initializeAuth()
  }

  // 设置页面标题
  if (to.meta?.title) {
    document.title = to.meta.title as string
  }

  // 权限验证逻辑
  const requiresAuth = to.meta?.requiresAuth as boolean
  const requiresPermission = to.meta?.requiresPermission as string
  const allowGuest = to.meta?.allowGuest as boolean

  // 如果路由需要管理员身份验证
  if (requiresAuth && !allowGuest) {
    // 检查是否已登录
    if (!authStore.isAdmin) {
      console.log('🔒 未登录用户尝试访问管理端，重定向到登录页')
      next('/admin/login?redirect=' + encodeURIComponent(to.fullPath))
      return
    }

    // 检查是否有必要的权限
    if (requiresPermission && !authStore.hasPermission(requiresPermission)) {
      console.error('🚫 权限不足，需要权限:', requiresPermission)
      // 可以重定向到无权限页面或仪表盘
      next('/admin/dashboard')
      return
    }
  }

  // 如果已登录用户访问登录页，重定向到仪表盘
  if (to.name === 'AdminLogin' && authStore.isAdmin) {
    console.log('✅ 已登录用户访问登录页，重定向到仪表盘')
    next('/admin/dashboard')
    return
  }

  // 验证通过，允许导航
  next()
})

router.afterEach((to, from) => {
  // Track route changes for analytics if needed
  console.log('Route changed:', to.path)
})

export default router
