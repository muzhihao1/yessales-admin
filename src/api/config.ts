import { SupabaseClient, createClient } from '@supabase/supabase-js'

/**
 * API 配置接口
 */
export interface ApiConfig {
  supabaseUrl: string
  supabaseAnonKey: string
  timeout: number
  retryAttempts: number
  retryDelay: number
  enableCache: boolean
}

/**
 * 获取 API 配置
 */
const getApiConfig = (): ApiConfig => {
  return {
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
    supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
    timeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '10000'),
    retryAttempts: parseInt(import.meta.env.VITE_API_RETRY_ATTEMPTS || '3'),
    retryDelay: parseInt(import.meta.env.VITE_API_RETRY_DELAY || '1000'),
    enableCache: import.meta.env.VITE_ENABLE_API_CACHE !== 'false'
  }
}

export const apiConfig = getApiConfig()

/**
 * Web存储适配器 - 使用标准localStorage API
 */
const createStorageAdapter = () => {
  return {
    getItem: (key: string) => {
      try {
        // 使用标准localStorage
        if (typeof window !== 'undefined' && window.localStorage) {
          return localStorage.getItem(key)
        }

        return null
      } catch (error) {
        console.warn('[Storage] Failed to get item:', key, error)
        return null
      }
    },

    setItem: (key: string, value: string) => {
      try {
        // 使用标准localStorage
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem(key, value)
          return
        }

        console.warn('[Storage] No storage method available')
      } catch (error) {
        console.warn('[Storage] Failed to set item:', key, error)
        throw error
      }
    },

    removeItem: (key: string) => {
      try {
        // 使用标准localStorage
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.removeItem(key)
          return
        }

        console.warn('[Storage] No storage method available')
      } catch (error) {
        console.warn('[Storage] Failed to remove item:', key, error)
        throw error
      }
    }
  }
}

/**
 * 创建增强的 Supabase 客户端
 */
export const supabase: SupabaseClient = createClient(
  apiConfig.supabaseUrl,
  apiConfig.supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      storage: createStorageAdapter()
    },
    // 全局配置
    global: {
      headers: {
        'X-Client-Info': 'yessales-uniapp',
        'X-Client-Version': '1.0.0'
      }
    }
  }
)

/**
 * 验证 API 配置
 */
export const validateApiConfig = (): boolean => {
  if (!apiConfig.supabaseUrl) {
    console.error('❌ VITE_SUPABASE_URL 环境变量未配置')
    return false
  }

  if (!apiConfig.supabaseAnonKey) {
    console.error('❌ VITE_SUPABASE_ANON_KEY 环境变量未配置')
    return false
  }

  console.log('✅ API 配置验证通过')
  return true
}

export const API_TIMEOUT = apiConfig.timeout

export const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  INVALID_INPUT: 'INVALID_INPUT',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
  SERVER_ERROR: 'SERVER_ERROR'
} as const

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  SERVER_ERROR: 500
} as const
