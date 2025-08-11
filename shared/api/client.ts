import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'

// Supabase 客户端配置
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'http://localhost:54321'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// 创建 Supabase 客户端实例
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// API 基础配置
export const API_CONFIG = {
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
}

// 错误处理辅助函数
export const handleError = (error: any) => {
  console.error('API Error:', error)
  
  if (error.code === 'PGRST116') {
    return {
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: '请求的资源不存在'
      }
    }
  }
  
  if (error.code === '23505') {
    return {
      success: false,
      error: {
        code: 'DUPLICATE_ENTRY',
        message: '数据已存在，请勿重复创建'
      }
    }
  }
  
  if (error.code === '42501') {
    return {
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: '您没有权限执行此操作'
      }
    }
  }
  
  return {
    success: false,
    error: {
      code: 'SERVER_ERROR',
      message: error.message || '服务器错误，请稍后再试'
    }
  }
}

// 分页参数处理
export const getPaginationParams = (page: number = 1, pageSize: number = 20) => {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  return { from, to }
}