/**
 * 身份验证系统 - 严格按照PRD要求实现
 * 销售端：无需登录，直接使用
 * 管理端：必须登录验证
 */

import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { defineStore } from 'pinia'

// 身份验证接口定义
export interface LoginCredentials {
  username: string
  password: string
}

export interface AdminUser {
  id: string
  username: string
  name: string
  role: 'admin'
  permissions: string[]
}

export interface AuthState {
  adminToken: string | null
  adminUser: AdminUser | null
  isLoading: boolean
  error: string | null
}

// 身份验证Store
export const useAuthStore = defineStore('auth', () => {
  const router = useRouter()

  // 状态管理
  const adminToken = ref<string | null>(localStorage.getItem('admin_token'))
  const adminUser = ref<AdminUser | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // 计算属性
  const isAdmin = computed(() => !!adminToken.value && !!adminUser.value)
  const isSales = computed(() => !isAdmin.value) // 销售端默认可用
  const hasPermission = (permission: string) => {
    return adminUser.value?.permissions?.includes(permission) || false
  }

  // 监听token变化，自动同步localStorage
  watch(adminToken, newToken => {
    if (newToken) {
      localStorage.setItem('admin_token', newToken)
    } else {
      localStorage.removeItem('admin_token')
      adminUser.value = null
    }
  })

  /**
   * 管理员登录
   * PRD要求：仅管理员需要登录
   */
  const loginAdmin = async (credentials: LoginCredentials) => {
    isLoading.value = true
    error.value = null

    try {
      // 模拟登录API调用 - 后续集成Supabase Auth
      if (credentials.username === 'admin' && credentials.password === 'admin123') {
        const mockAdmin: AdminUser = {
          id: 'admin-001',
          username: 'admin',
          name: '系统管理员',
          role: 'admin',
          permissions: [
            'dashboard:read',
            'quotes:read',
            'quotes:write',
            'quotes:delete',
            'products:read',
            'products:write',
            'products:delete',
            'customers:read',
            'customers:write',
            'users:read',
            'users:write',
            'logs:read',
            'settings:read',
            'settings:write'
          ]
        }

        adminToken.value = 'mock-admin-token-' + Date.now()
        adminUser.value = mockAdmin

        return { success: true, user: mockAdmin }
      } else {
        throw new Error('用户名或密码错误')
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '登录失败'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 管理员登出
   */
  const logoutAdmin = () => {
    adminToken.value = null
    adminUser.value = null
    error.value = null

    // 重定向到管理端登录页
    router.push('/admin/login')
  }

  /**
   * 验证管理员token有效性
   */
  const validateAdminToken = async () => {
    if (!adminToken.value) return false

    try {
      // 模拟token验证 - 后续集成Supabase Auth
      if (adminToken.value.startsWith('mock-admin-token-')) {
        adminUser.value = {
          id: 'admin-001',
          username: 'admin',
          name: '系统管理员',
          role: 'admin',
          permissions: [
            'dashboard:read',
            'quotes:read',
            'quotes:write',
            'quotes:delete',
            'products:read',
            'products:write',
            'products:delete',
            'customers:read',
            'customers:write',
            'users:read',
            'users:write',
            'logs:read',
            'settings:read',
            'settings:write'
          ]
        }
        return true
      }
      return false
    } catch (err) {
      console.error('Token validation failed:', err)
      logoutAdmin()
      return false
    }
  }

  /**
   * 初始化身份验证状态
   */
  const initializeAuth = async () => {
    if (adminToken.value) {
      await validateAdminToken()
    }
  }

  return {
    // 状态
    adminToken,
    adminUser,
    isLoading,
    error,

    // 计算属性
    isAdmin,
    isSales,

    // 方法
    hasPermission,
    loginAdmin,
    logoutAdmin,
    validateAdminToken,
    initializeAuth
  }
})

/**
 * 身份验证Composable
 * 提供统一的身份验证接口
 */
export const useAuth = () => {
  const authStore = useAuthStore()

  return {
    // 状态
    ...authStore,

    // 权限检查工具
    requireAdmin: () => {
      if (!authStore.isAdmin) {
        throw new Error('需要管理员权限')
      }
    },

    requirePermission: (permission: string) => {
      if (!authStore.hasPermission(permission)) {
        throw new Error(`缺少权限: ${permission}`)
      }
    },

    // 角色检查工具
    canAccessAdmin: computed(() => authStore.isAdmin),
    canAccessSales: computed(() => true), // 销售端始终可访问

    // 页面权限检查
    canViewQuotes: computed(() => authStore.isSales || authStore.hasPermission('quotes:read')),
    canEditQuotes: computed(() => authStore.isSales || authStore.hasPermission('quotes:write')),
    canDeleteQuotes: computed(() => authStore.hasPermission('quotes:delete')),
    canManageProducts: computed(() => authStore.hasPermission('products:write')),
    canManageUsers: computed(() => authStore.hasPermission('users:write'))
  }
}
