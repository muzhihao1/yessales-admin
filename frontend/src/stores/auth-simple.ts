import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { User } from '@/types/models'
import type { LoginRequest } from '@/types/api'

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

  // Simplified actions for web environment
  async function login(credentials: LoginRequest) {
    isLoading.value = true
    error.value = null

    try {
      // Simplified mock login for testing
      console.log('Login attempt:', credentials.username)
      
      // Mock successful response
      user.value = {
        id: '1',
        username: credentials.username,
        role: 'admin',
        name: 'Test User',
        is_active: true,
        created_at: new Date().toISOString()
      }
      token.value = 'mock-token-123'

      // Store in localStorage for web
      localStorage.setItem('auth_token', 'mock-token-123')
      localStorage.setItem('auth_user', JSON.stringify(user.value))

      return { success: true }
    } catch (err) {
      error.value = 'Login failed'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  async function logout() {
    // Clear state
    user.value = null
    token.value = null

    // Clear localStorage
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')

    console.log('User logged out')
  }

  async function checkAuth() {
    // Check localStorage for existing auth
    const storedToken = localStorage.getItem('auth_token')
    const storedUser = localStorage.getItem('auth_user')

    if (storedToken && storedUser) {
      try {
        token.value = storedToken
        user.value = JSON.parse(storedUser)
        return true
      } catch (err) {
        console.error('Error parsing stored user:', err)
        return false
      }
    }

    return false
  }

  async function initializeAuth() {
    console.log('🔐 Initializing auth...')
    await checkAuth()
  }

  async function checkAuthStatus() {
    if (token.value && !user.value) {
      await checkAuth()
    }
  }

  async function initAuth() {
    await initializeAuth()
  }

  // Mock permission check
  function hasPermission(permission: string): boolean {
    if (!user.value) return false
    if (user.value.role === 'admin') return true
    return false
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
    logout,
    checkAuth,
    initializeAuth,
    initAuth,
    checkAuthStatus,
    hasPermission
  }
})