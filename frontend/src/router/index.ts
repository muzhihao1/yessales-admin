/**
 * Vue Router Configuration for Standard Web Build
 * Converts UniApp pages.json structure to Vue Router routes
 */

import { type RouteRecordRaw, createRouter, createWebHistory } from 'vue-router'

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
  // Default redirect
  {
    path: '/',
    redirect: '/sales'
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

  // Admin routes
  {
    path: '/admin',
    redirect: '/admin/dashboard'
  },
  {
    path: '/admin/login',
    name: 'AdminLogin',
    component: AdminLogin,
    meta: { title: '登录' }
  },
  {
    path: '/admin/dashboard',
    name: 'AdminDashboard',
    component: AdminDashboard,
    meta: { title: '仪表盘' }
  },
  {
    path: '/admin/quotes',
    name: 'AdminQuotes',
    component: AdminQuotes,
    meta: { title: '报价单管理' }
  },
  {
    path: '/admin/quotes/detail',
    name: 'AdminQuoteDetail',
    component: AdminQuoteDetail,
    meta: { title: '报价单详情' }
  },
  {
    path: '/admin/products',
    name: 'AdminProducts',
    component: AdminProducts,
    meta: { title: '产品管理' }
  },
  {
    path: '/admin/products/edit',
    name: 'AdminProductEdit',
    component: AdminProductEdit,
    meta: { title: '编辑产品' }
  },
  {
    path: '/admin/users',
    name: 'AdminUsers',
    component: AdminUsers,
    meta: { title: '用户管理' }
  },
  {
    path: '/admin/customers',
    name: 'AdminCustomers',
    component: AdminCustomers,
    meta: { title: '客户管理' }
  },
  {
    path: '/admin/customers/detail',
    name: 'AdminCustomerDetail',
    component: AdminCustomerDetail,
    meta: { title: '客户详情' }
  },
  {
    path: '/admin/customers/edit',
    name: 'AdminCustomerEdit',
    component: AdminCustomerEdit,
    meta: { title: '编辑客户' }
  },
  {
    path: '/admin/logs',
    name: 'AdminLogs',
    component: AdminLogs,
    meta: { title: '操作日志' }
  },
  {
    path: '/admin/settings',
    name: 'AdminSettings',
    component: AdminSettings,
    meta: { title: '系统设置' }
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
 * Global navigation guards
 */
router.beforeEach((to, from, next) => {
  // Set page title from route meta
  if (to.meta?.title) {
    document.title = to.meta.title as string
  }

  // Add any auth checks here if needed
  next()
})

router.afterEach((to, from) => {
  // Track route changes for analytics if needed
  console.log('Route changed:', to.path)
})

export default router
