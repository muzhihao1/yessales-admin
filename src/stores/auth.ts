import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { AuthApi } from '@/api/auth'
import type { User } from '@/types/models'
import type { LoginRequest } from '@/types/api'
import { navigation, storage } from '@/utils/platform-adapter'

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const isAdmin = computed(() => user.value?.role === 'admin')
  const userName = computed(() => user.value?.name || user.value?.username || '')

  // Actions
  async function login(credentials: LoginRequest) {
    isLoading.value = true
    error.value = null

    try {
      const response = await AuthApi.login(credentials)

      if (response.success && response.data) {
        user.value = {
          id: response.data.user.id,
          username: response.data.user.username,
          role: response.data.user.role,
          name: response.data.user.name,
          is_active: true,
          created_at: new Date().toISOString()
        }
        token.value = response.data.access_token

        // 存储到本地
        storage.setItem('auth_token', response.data.access_token)
        storage.setJSON('auth_user', user.value)

        return { success: true }
      } else {
        error.value = response.error?.message || '登录失败'
        return { success: false, error: error.value }
      }
    } catch (err) {
      error.value = '网络错误，请稍后重试'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  async function logout() {
    isLoading.value = true
    error.value = null

    try {
      await AuthApi.logout()
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      // 清除状态
      user.value = null
      token.value = null

      // 清除本地存储
      storage.removeItem('auth_token')
      storage.removeItem('auth_user')

      isLoading.value = false

      // 跳转到登录页
      navigation.reLaunch('/admin/login')
    }
  }

  async function refreshToken() {
    try {
      const response = await AuthApi.refreshToken()

      if (response.success && response.data) {
        token.value = response.data.access_token
        storage.setItem('auth_token', response.data.access_token)
        return true
      }

      return false
    } catch (err) {
      console.error('Refresh token error:', err)
      return false
    }
  }

  async function checkAuth() {
    // 从本地存储恢复状态
    const storedToken = storage.getItem('auth_token')
    const storedUser = storage.getJSON('auth_user')

    if (storedToken && storedUser) {
      token.value = storedToken
      user.value = storedUser

      // 验证 token 是否有效
      const response = await AuthApi.getCurrentUser()

      if (response.success && response.data) {
        user.value = response.data
        return true
      } else {
        // Token 无效，清除状态
        await logout()
        return false
      }
    }

    return false
  }

  async function updatePassword(oldPassword: string, newPassword: string) {
    isLoading.value = true
    error.value = null

    try {
      const response = await AuthApi.changePassword(oldPassword, newPassword)

      if (response.success) {
        return { success: true }
      } else {
        error.value = response.error?.message || '修改密码失败'
        return { success: false, error: error.value }
      }
    } catch (err) {
      error.value = '网络错误，请稍后重试'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  async function loginAdmin(credentials: LoginRequest) {
    // 管理员登录使用相同的login逻辑，但添加管理员权限验证
    const result = await login(credentials)

    if (result.success && user.value?.role !== 'admin') {
      error.value = '权限不足，请使用管理员账号登录'
      await logout()
      return { success: false, error: error.value }
    }

    return result
  }

  async function getCurrentUser() {
    try {
      const response = await AuthApi.getCurrentUser()

      if (response.success && response.data) {
        user.value = response.data
        storage.setJSON('auth_user', response.data)
      }

      return response
    } catch (err) {
      console.error('Get current user error:', err)
      return { success: false, error: { message: '获取用户信息失败' } }
    }
  }

  async function initializeAuth() {
    // 初始化时检查认证状态
    await checkAuth()
  }

  async function checkAuthStatus() {
    // 检查认证状态，如果token存在但用户信息不存在则重新获取
    if (token.value && !user.value) {
      await getCurrentUser()
    }
  }

  return {
    // State
    user,
    token,
    isLoading,
    error,

    // Getters
    isAuthenticated,
    isAdmin,
    userName,

    // Actions
    login,
    loginAdmin,
    logout,
    refreshToken,
    checkAuth,
    getCurrentUser,
    initializeAuth,
    checkAuthStatus,
    updatePassword
  }
})
