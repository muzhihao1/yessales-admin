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
    // Production config environment variables
    readonly VITE_API_BASE_URL?: string
    readonly VITE_CDN_URL?: string
    readonly VITE_APP_VERSION?: string
    readonly VITE_BUILD_NUMBER?: string
    readonly VITE_CONFIG_PRESET?: string
    readonly VITE_MONITORING_ENDPOINT?: string
    readonly VITE_ERROR_REPORTING_ENDPOINT?: string
    readonly VITE_MONITORING_KEY?: string
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