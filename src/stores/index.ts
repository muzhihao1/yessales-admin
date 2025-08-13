import { createPinia } from 'pinia'
import { useAppStore } from './app'
import { useAuthStore } from './auth'
import { useProductsStore } from './products'
import { useQuotesStore } from './quotes'
import { useCustomersStore } from './customers'
import { useUsersStore } from './users'

// Import middleware and utilities
import { type GlobalMiddlewareConfig, createStoreMiddleware, middlewarePresets } from './middleware'
import { type ErrorHandlerConfig, devTools, globalCache, handleStoreError } from './utils'

/**
 * 创建并配置Pinia实例 (简化版本，避免初始化问题)
 */
export function createAppPinia(middlewareConfig?: Partial<GlobalMiddlewareConfig>) {
  const pinia = createPinia()

  // 简化配置：仅在开发环境添加基本日志
  if (process.env.NODE_ENV === 'development') {
    pinia.use(({ store }) => {
      store.$subscribe((mutation, state) => {
        console.log(`🔄 [${store.$id}] ${mutation.type}:`, mutation.events || 'state_change')
      })
    })
  }

  return pinia
}

/**
 * 创建并配置Pinia实例 (完整版本，问题解决后使用)
 */
export function createAppPiniaFull(middlewareConfig?: Partial<GlobalMiddlewareConfig>) {
  const pinia = createPinia()

  // 配置中间件
  const config =
    middlewareConfig ||
    (process.env.NODE_ENV === 'development'
      ? middlewarePresets.development()
      : middlewarePresets.production())

  // 应用store中间件
  pinia.use(createStoreMiddleware(config))

  // 开发环境特殊配置
  if (process.env.NODE_ENV === 'development') {
    // 基础的mutation日志（保持原有功能）
    pinia.use(({ store }) => {
      store.$subscribe((mutation, state) => {
        console.log(`🔄 [${store.$id}] ${mutation.type}:`, mutation.events || 'state_change')
      })
    })

    // Note: devTools.enable() will be called after Pinia is mounted to avoid initialization issues
  }

  return pinia
}

/**
 * 初始化所有stores
 * 在应用启动时调用，确保所有store都正确初始化
 */
export async function initializeStores() {
  try {
    console.log('🚀 开始初始化Stores...')

    // 1. 首先初始化App Store（全局状态）
    const appStore = useAppStore()
    await appStore.initializeApp()
    console.log('✅ App Store 初始化完成')

    // 2. 初始化Auth Store（用户认证）
    const authStore = useAuthStore()
    await authStore.initializeAuth()
    console.log('✅ Auth Store 初始化完成')

    // 3. 清理过期缓存
    const cleanedCount = globalCache.cleanExpired()
    if (cleanedCount > 0) {
      console.log(`🧹 清理了 ${cleanedCount} 个过期缓存项`)
    }

    // 4. 其他业务stores在需要时懒加载
    console.log('✅ 所有关键Stores初始化完成')
  } catch (error) {
    console.error('❌ Stores初始化失败:', error)

    // 使用统一错误处理
    await handleStoreError(error, {
      context: {
        store: 'system',
        action: 'initializeStores'
      }
    })

    // 显示用户友好的错误提示
    try {
      const appStore = useAppStore()
      appStore.setGlobalError({
        code: 'STORE_INIT_FAILED',
        message: '应用初始化失败，请刷新页面重试',
        details: error
      })
    } catch (appError) {
      // 如果连App Store都无法使用，直接显示原生提示
      console.error('应用初始化失败')
    }

    throw error
  }
}

/**
 * 获取所有业务stores的实例
 * 提供统一的store访问接口
 */
export function useStores() {
  return {
    app: useAppStore(),
    auth: useAuthStore(),
    products: useProductsStore(),
    quotes: useQuotesStore(),
    customers: useCustomersStore(),
    users: useUsersStore()
  }
}

/**
 * 重置所有stores到初始状态
 * 主要用于用户登出时清理状态
 */
export function resetAllStores() {
  const stores = useStores()

  // 重置业务stores
  stores.products.$reset()
  stores.quotes.$reset()
  stores.customers.$reset()
  stores.users.$reset()

  // 清理所有缓存
  globalCache.clearAllOnLogout()

  // 保持app store和auth store的某些状态
  console.log('🔄 所有业务Stores已重置')
}

/**
 * 检查所有stores的健康状态
 * 用于应用健康检查和调试
 */
export function checkStoresHealth() {
  const stores = useStores()
  const health = {
    app: {
      initialized: !!stores.app.systemInfo.platform,
      online: stores.app.isOnline,
      errors: stores.app.errorHistory.length
    },
    auth: {
      initialized: stores.auth.isAuthenticated || stores.auth.token !== null,
      authenticated: stores.auth.isAuthenticated,
      user: !!stores.auth.user
    },
    products: {
      loaded: stores.products.products.length > 0,
      loading: stores.products.isLoading,
      error: !!stores.products.error
    },
    quotes: {
      loaded: stores.quotes.quotes.length > 0,
      loading: stores.quotes.isLoading,
      error: !!stores.quotes.error
    }
  }

  console.log('🏥 Stores健康状态:', health)
  return health
}

/**
 * 预加载关键数据
 * 在应用启动后预加载用户可能需要的数据
 */
export async function preloadCriticalData() {
  try {
    const stores = useStores()

    // 如果用户已认证，预加载关键业务数据
    if (stores.auth.isAuthenticated) {
      console.log('🔄 预加载关键数据...')

      // 并行加载产品和报价数据
      await Promise.allSettled([
        stores.products.fetchProducts({ limit: 10 }), // 加载最新的10个产品
        stores.quotes.fetchQuotes({ limit: 5 }) // 加载最新的5个报价
      ])

      console.log('✅ 关键数据预加载完成')
    }
  } catch (error) {
    console.warn('⚠️ 预加载数据失败，不影响应用正常使用:', error)
  }
}

/**
 * 优雅关闭所有stores
 * 在应用关闭或页面卸载时调用
 */
export async function shutdownStores() {
  try {
    console.log('🔄 开始关闭Stores...')

    // 停止所有优化更新操作
    const stores = useStores()

    // 清理调试数据
    if (process.env.NODE_ENV === 'development') {
      devTools.disable()
    }

    console.log('✅ Stores优雅关闭完成')
  } catch (error) {
    console.error('❌ Stores关闭失败:', error)
  }
}

/**
 * 获取系统性能统计
 * 用于性能监控和优化
 */
export function getPerformanceStats() {
  if (process.env.NODE_ENV === 'development') {
    return devTools.generatePerformanceReport()
  }

  return {
    message: '性能统计仅在开发模式下可用',
    stores: Object.keys(useStores()).length,
    timestamp: Date.now()
  }
}

// 导出所有store hooks
export {
  useAppStore,
  useAuthStore,
  useProductsStore,
  useQuotesStore,
  useCustomersStore,
  useUsersStore
}

// 导出中间件和工具
export { createStoreMiddleware, middlewarePresets } from './middleware'
export { devTools, globalCache } from './utils'

// Temporarily disable some exports to debug infinite recursion
export {
  handleStoreError,
  useLoadingState
  // useCache,
  // useOptimisticUpdates,
  // usePersistence,
  // useValidation,
  // useStoreDebug,
  // withLoading
} from './utils'

// 导出类型
export type {
  GlobalMiddlewareConfig,
  StoreMiddlewareConfig,
  ErrorHandlerConfig,
  LoadingConfig,
  CacheConfig,
  OptimisticConfig,
  PersistenceConfig,
  ValidationSchema,
  DebugConfig
} from './middleware'

export type { StoreError, ValidationResult, ActionLogEntry, StateSnapshot } from './utils'

// 导出模型类型
export type {} from '@/types/models'
