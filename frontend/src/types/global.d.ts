/**
 * Global type definitions for YesSales application
 */

import type { UniAPI } from '@/utils/uni-compat'

declare global {
  interface Window {
    uni?: UniAPI
  }

  interface ImportMetaEnv {
    readonly VITE_SUPABASE_URL: string
    readonly VITE_SUPABASE_ANON_KEY: string
    readonly VITE_USE_REAL_API?: string
    readonly VITE_API_TIMEOUT?: string
    readonly VITE_API_RETRY_ATTEMPTS?: string
    readonly VITE_API_RETRY_DELAY?: string
    readonly VITE_ENABLE_API_CACHE?: string
    // 添加其他可能用到的环境变量
    readonly DEV: boolean
    readonly PROD: boolean
    readonly MODE: string
    readonly BASE_URL: string
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv
  }
}