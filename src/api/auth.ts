import { supabase } from './config'
import ApiClient from './client'
import MockService from '@/mock'
import type { ApiResponse, LoginRequest, LoginResponse } from '@/types/api'
import type { User } from '@/types/models'

// 检查是否使用 Mock API
const useMockApi =
  !import.meta.env.VITE_USE_REAL_API || import.meta.env.VITE_USE_REAL_API === 'false'

export class AuthApi {
  static async login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    // 如果启用 Mock API 或者 Supabase 连接失败，使用 Mock 服务
    if (useMockApi) {
      console.log('🔧 Using Mock API for login')
      return MockService.login(credentials)
    }

    try {
      // Supabase Auth 需要 email 格式，这里我们将 username 作为 email 使用
      const email = credentials.username.includes('@')
        ? credentials.username
        : `${credentials.username}@yessales.local`

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: credentials.password
      })

      if (error) throw error

      if (!data.user || !data.session) {
        throw new Error('登录失败')
      }

      // 获取用户详细信息
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single()

      if (userError) throw userError

      return {
        success: true,
        data: {
          access_token: data.session.access_token,
          token_type: 'bearer',
          expires_in: data.session.expires_in || 3600,
          refresh_token: data.session.refresh_token,
          user: {
            id: userData.id,
            username: userData.username,
            role: userData.role,
            name: userData.name
          }
        }
      }
    } catch (error: any) {
      console.error('Login error:', error)

      // 如果 Supabase 连接失败，fallback 到 Mock API
      if (error.message?.includes('Failed to fetch') || error.name?.includes('FetchError')) {
        console.log('🔧 Supabase connection failed, falling back to Mock API')
        return MockService.login(credentials)
      }

      let message = '登录失败，请检查用户名和密码'
      if (error.message?.includes('Invalid login credentials')) {
        message = '用户名或密码错误'
      } else if (error.message?.includes('Email not confirmed')) {
        message = '账号未激活，请联系管理员'
      }

      return {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message
        }
      }
    }
  }

  static async logout(): Promise<ApiResponse> {
    // 如果使用 Mock API，直接返回成功
    if (useMockApi) {
      console.log('🔧 Using Mock API for logout')
      return { success: true }
    }

    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      // 清除本地存储 - 使用 platform adapter
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('supabase.auth.token')
        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_user')
      }

      return {
        success: true
      }
    } catch (error) {
      return ApiClient.handleError(error)
    }
  }

  static async getCurrentUser(): Promise<ApiResponse<User | null>> {
    try {
      const {
        data: { user }
      } = await supabase.auth.getUser()

      if (!user) {
        return {
          success: true,
          data: null
        }
      }

      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) throw error

      return {
        success: true,
        data: userData
      }
    } catch (error) {
      return ApiClient.handleError(error)
    }
  }

  static async refreshToken(): Promise<ApiResponse<LoginResponse>> {
    try {
      const { data, error } = await supabase.auth.refreshSession()

      if (error) throw error
      if (!data.session) throw new Error('刷新令牌失败')

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user!.id)
        .single()

      if (userError) throw userError

      return {
        success: true,
        data: {
          access_token: data.session.access_token,
          token_type: 'bearer',
          expires_in: data.session.expires_in || 3600,
          refresh_token: data.session.refresh_token,
          user: {
            id: userData.id,
            username: userData.username,
            role: userData.role,
            name: userData.name
          }
        }
      }
    } catch (error) {
      return ApiClient.handleError(error)
    }
  }

  static async changePassword(oldPassword: string, newPassword: string): Promise<ApiResponse> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) throw error

      return {
        success: true
      }
    } catch (error) {
      return ApiClient.handleError(error)
    }
  }

  static isAuthenticated(): boolean {
    const token = localStorage.getItem('supabase.auth.token')
    return !!token
  }

  static getAuthToken(): string | null {
    const token = localStorage.getItem('supabase.auth.token')
    return token || null
  }
}

export default AuthApi
