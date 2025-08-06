import { supabase, handleError } from './client'
import type { User } from '../types/models'
import type { ApiResponse, LoginRequest, LoginResponse, CreateUserRequest } from '../types/api'

export const authApi = {
  /**
   * 用户登录
   */
  async login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    try {
      // 首先查询用户信息
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('username', credentials.username)
        .eq('is_active', true)
        .single()

      if (userError || !userData) {
        return {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: '用户名或密码错误'
          }
        }
      }

      // 使用 Supabase Auth 进行登录
      // 注意：这里假设已经在 Supabase Auth 中创建了对应的用户
      const { data, error } = await supabase.auth.signInWithPassword({
        email: `${credentials.username}@yessales.local`, // 使用虚拟邮箱
        password: credentials.password
      })

      if (error) {
        return {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: '用户名或密码错误'
          }
        }
      }

      // 更新最后登录时间
      await supabase
        .from('users')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', userData.id)

      return {
        success: true,
        data: {
          token: data.session?.access_token || '',
          user: {
            id: userData.id,
            username: userData.username,
            role: userData.role,
            name: userData.name
          }
        }
      }
    } catch (error) {
      return handleError(error)
    }
  },

  /**
   * 退出登录
   */
  async logout(): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase.auth.signOut()

      if (error) throw error

      return {
        success: true
      }
    } catch (error) {
      return handleError(error)
    }
  },

  /**
   * 获取当前用户信息
   */
  async getCurrentUser(): Promise<ApiResponse<User | null>> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()

      if (error || !user) {
        return {
          success: true,
          data: null
        }
      }

      // 获取用户详细信息
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (userError) throw userError

      return {
        success: true,
        data: userData as User
      }
    } catch (error) {
      return handleError(error)
    }
  },

  /**
   * 刷新令牌
   */
  async refreshToken(): Promise<ApiResponse<string>> {
    try {
      const { data, error } = await supabase.auth.refreshSession()

      if (error) throw error

      return {
        success: true,
        data: data.session?.access_token || ''
      }
    } catch (error) {
      return handleError(error)
    }
  },

  /**
   * 创建用户（仅管理员）
   */
  async createUser(userData: CreateUserRequest): Promise<ApiResponse<User>> {
    try {
      // 创建 Auth 用户
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: `${userData.username}@yessales.local`,
        password: userData.password,
        email_confirm: true
      })

      if (authError) throw authError

      // 创建用户表记录
      const { data, error } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          username: userData.username,
          password_hash: 'auth_managed', // 密码由 Supabase Auth 管理
          role: userData.role,
          name: userData.name,
          phone: userData.phone
        })
        .select()
        .single()

      if (error) {
        // 如果创建失败，删除 Auth 用户
        await supabase.auth.admin.deleteUser(authData.user.id)
        throw error
      }

      return {
        success: true,
        data: data as User
      }
    } catch (error) {
      return handleError(error)
    }
  },

  /**
   * 更新用户信息（仅管理员）
   */
  async updateUser(id: string, updates: Partial<User>): Promise<ApiResponse<User>> {
    try {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      return {
        success: true,
        data: data as User
      }
    } catch (error) {
      return handleError(error)
    }
  },

  /**
   * 禁用/启用用户（仅管理员）
   */
  async toggleUserStatus(id: string, isActive: boolean): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase
        .from('users')
        .update({ is_active: isActive })
        .eq('id', id)

      if (error) throw error

      return {
        success: true
      }
    } catch (error) {
      return handleError(error)
    }
  },

  /**
   * 重置密码（仅管理员）
   */
  async resetPassword(userId: string, newPassword: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase.auth.admin.updateUserById(userId, {
        password: newPassword
      })

      if (error) throw error

      return {
        success: true
      }
    } catch (error) {
      return handleError(error)
    }
  },

  /**
   * 获取用户列表（仅管理员）
   */
  async getUsers(): Promise<ApiResponse<User[]>> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      return {
        success: true,
        data: data as User[]
      }
    } catch (error) {
      return handleError(error)
    }
  }
}