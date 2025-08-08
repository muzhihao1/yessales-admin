/**
 * Store Middleware Index
 *
 * Provides unified middleware plugins and store enhancers for Pinia.
 */

import type { PiniaPluginContext } from 'pinia'
import {
  useCacheStore,
  useDebugStore,
  useGlobalLoadingStore,
  useOptimisticStore,
  usePersistenceStore,
  useValidationStore
} from '../utils'
import type {
  DebugConfig,
  ErrorHandlerConfig,
  LoadingConfig,
  OptimisticConfig,
  PersistenceConfig,
  ValidationSchema
} from '../utils'

/**
 * Middleware configuration for individual stores
 */
export interface StoreMiddlewareConfig {
  // Error handling
  errorHandler?: Partial<ErrorHandlerConfig>

  // Loading state
  loading?: Partial<LoadingConfig> & {
    enableGlobal?: boolean
  }

  // Optimistic updates
  optimistic?: Partial<OptimisticConfig> & {
    enableAutoRollback?: boolean
  }

  // Caching
  cache?: {
    enableAutoCache?: boolean
    defaultTTL?: number
    tags?: string[]
  }

  // Persistence
  persistence?: Partial<PersistenceConfig> & {
    enableAutoPersist?: boolean
  }

  // Validation
  validation?: {
    schemas?: Record<string, ValidationSchema>
    enableAutoValidation?: boolean
  }

  // Debugging
  debug?: Partial<DebugConfig> & {
    enableInProduction?: boolean
  }
}

/**
 * Global middleware configuration
 */
export interface GlobalMiddlewareConfig {
  enableErrorHandling?: boolean
  enableLoadingState?: boolean
  enableOptimisticUpdates?: boolean
  enableCaching?: boolean
  enablePersistence?: boolean
  enableValidation?: boolean
  enableDebugging?: boolean

  // Development mode settings
  developmentOnly?: boolean

  // Store-specific overrides
  storeConfigs?: Record<string, StoreMiddlewareConfig>
}

/**
 * Default global configuration
 */
const DEFAULT_GLOBAL_CONFIG: Required<GlobalMiddlewareConfig> = {
  enableErrorHandling: true,
  enableLoadingState: true,
  enableOptimisticUpdates: true,
  enableCaching: true,
  enablePersistence: true,
  enableValidation: true,
  enableDebugging: process.env.NODE_ENV === 'development',
  developmentOnly: false,
  storeConfigs: {}
}

/**
 * Store enhancement utilities
 */
export class StoreEnhancer {
  constructor(
    private storeId: string,
    private config: StoreMiddlewareConfig = {}
  ) {}

  /**
   * Enhance store with error handling
   */
  withErrorHandling<T extends Record<string, any>>(store: T): T {
    if (!this.shouldEnable('errorHandler')) return store

    // Wrap all store methods with error handling
    const enhanced = { ...store }

    for (const [key, value] of Object.entries(store)) {
      if (typeof value === 'function') {
        enhanced[key] = async (...args: any[]) => {
          try {
            return await value.apply(store, args)
          } catch (error) {
            // Error will be handled by the error handler utility
            throw error
          }
        }
      }
    }

    return enhanced
  }

  /**
   * Enhance store with loading state management
   */
  withLoadingState<T extends Record<string, any>>(store: T): T {
    if (!this.shouldEnable('loading')) return store

    // Loading state will be managed by the loading-state utility
    return store
  }

  /**
   * Enhance store with caching
   */
  withCaching<T extends Record<string, any>>(store: T): T {
    if (!this.shouldEnable('cache')) return store

    // Caching will be handled by the cache-manager utility
    return store
  }

  /**
   * Enhance store with persistence
   */
  withPersistence<T extends Record<string, any>>(store: T): T {
    if (!this.shouldEnable('persistence')) return store

    // Persistence will be handled by the persistence utility
    return store
  }

  /**
   * Enhance store with validation
   */
  withValidation<T extends Record<string, any>>(store: T): T {
    if (!this.shouldEnable('validation')) return store

    // Validation will be handled by the validation utility
    return store
  }

  /**
   * Enhance store with debugging
   */
  withDebugging<T extends Record<string, any>>(store: T): T {
    if (!this.shouldEnable('debug')) return store

    // Debugging will be handled by the debug utility
    return store
  }

  /**
   * Apply all enhancements
   */
  enhance<T extends Record<string, any>>(store: T): T {
    let enhanced = store

    enhanced = this.withErrorHandling(enhanced)
    enhanced = this.withLoadingState(enhanced)
    enhanced = this.withCaching(enhanced)
    enhanced = this.withPersistence(enhanced)
    enhanced = this.withValidation(enhanced)
    enhanced = this.withDebugging(enhanced)

    return enhanced
  }

  /**
   * Check if a feature should be enabled
   */
  private shouldEnable(feature: keyof StoreMiddlewareConfig): boolean {
    return this.config[feature] !== undefined && this.config[feature] !== false
  }
}

/**
 * Create Pinia plugin for store middleware
 */
export function createStoreMiddleware(globalConfig: Partial<GlobalMiddlewareConfig> = {}) {
  const config = { ...DEFAULT_GLOBAL_CONFIG, ...globalConfig }

  return ({ store, options }: PiniaPluginContext) => {
    // Skip if disabled for this environment
    if (config.developmentOnly && process.env.NODE_ENV !== 'development') {
      return
    }

    const storeId = store.$id
    const storeConfig = config.storeConfigs?.[storeId] || {}

    // Initialize global stores if enabled
    if (config.enableLoadingState) {
      useGlobalLoadingStore()
    }

    if (config.enableOptimisticUpdates) {
      useOptimisticStore()
    }

    if (config.enableCaching) {
      useCacheStore()
    }

    if (config.enableValidation) {
      useValidationStore()
    }

    if (config.enableDebugging) {
      const debugStore = useDebugStore()

      // Auto-track store actions in debug mode
      store.$onAction(({ name, args, after, onError }) => {
        const startTime = performance.now()

        after(result => {
          const duration = performance.now() - startTime
          debugStore.logAction(storeId, name, args, duration, result)
          debugStore.recordPerformance(storeId, name, duration)
        })

        onError(error => {
          const duration = performance.now() - startTime
          debugStore.logAction(storeId, name, args, duration, undefined, error)
        })
      })

      // Auto-track state changes
      store.$subscribe((mutation, state) => {
        debugStore.takeStateSnapshot(storeId, state, mutation.type)
        debugStore.trackMemoryUsage(storeId, state)
      })
    }

    if (config.enablePersistence) {
      usePersistenceStore()
    }

    // Add store enhancer to options for manual use
    ;(store as any).$enhancer = new StoreEnhancer(storeId, storeConfig)
  }
}

/**
 * Enhanced store factory
 */
export function createEnhancedStore<T extends Record<string, any>>(
  storeId: string,
  storeFactory: () => T,
  config: StoreMiddlewareConfig = {}
): T {
  const store = storeFactory()
  const enhancer = new StoreEnhancer(storeId, config)

  return enhancer.enhance(store)
}

/**
 * Store middleware composable
 */
export function useStoreMiddleware(storeId: string, config: StoreMiddlewareConfig = {}) {
  const enhancer = new StoreEnhancer(storeId, config)

  return {
    enhancer,

    // Quick enhancement methods
    withErrorHandling: <T>(store: T) => enhancer.withErrorHandling(store),
    withLoadingState: <T>(store: T) => enhancer.withLoadingState(store),
    withCaching: <T>(store: T) => enhancer.withCaching(store),
    withPersistence: <T>(store: T) => enhancer.withPersistence(store),
    withValidation: <T>(store: T) => enhancer.withValidation(store),
    withDebugging: <T>(store: T) => enhancer.withDebugging(store),
    enhance: <T>(store: T) => enhancer.enhance(store)
  }
}

/**
 * Predefined middleware configurations for common use cases
 */
export const middlewarePresets = {
  /**
   * Full-featured configuration with all middleware enabled
   */
  full: (): GlobalMiddlewareConfig => ({
    enableErrorHandling: true,
    enableLoadingState: true,
    enableOptimisticUpdates: true,
    enableCaching: true,
    enablePersistence: true,
    enableValidation: true,
    enableDebugging: true
  }),

  /**
   * Production-ready configuration
   */
  production: (): GlobalMiddlewareConfig => ({
    enableErrorHandling: true,
    enableLoadingState: true,
    enableOptimisticUpdates: true,
    enableCaching: true,
    enablePersistence: true,
    enableValidation: true,
    enableDebugging: false
  }),

  /**
   * Development configuration with enhanced debugging
   */
  development: (): GlobalMiddlewareConfig => ({
    enableErrorHandling: true,
    enableLoadingState: true,
    enableOptimisticUpdates: true,
    enableCaching: true,
    enablePersistence: true,
    enableValidation: true,
    enableDebugging: true,
    developmentOnly: false
  }),

  /**
   * Minimal configuration for basic stores
   */
  minimal: (): GlobalMiddlewareConfig => ({
    enableErrorHandling: true,
    enableLoadingState: true,
    enableOptimisticUpdates: false,
    enableCaching: false,
    enablePersistence: false,
    enableValidation: false,
    enableDebugging: false
  }),

  /**
   * Performance-focused configuration
   */
  performance: (): GlobalMiddlewareConfig => ({
    enableErrorHandling: true,
    enableLoadingState: true,
    enableOptimisticUpdates: true,
    enableCaching: true,
    enablePersistence: false,
    enableValidation: false,
    enableDebugging: false
  })
}

/**
 * Store middleware utilities
 */
export const middlewareUtils = {
  /**
   * Check if store has specific middleware enabled
   */
  hasMiddleware(store: any, middleware: keyof StoreMiddlewareConfig): boolean {
    return store.$enhancer?.shouldEnable(middleware) || false
  },

  /**
   * Get middleware configuration for store
   */
  getConfig(store: any): StoreMiddlewareConfig {
    return store.$enhancer?.config || {}
  },

  /**
   * Apply middleware to existing store
   */
  applyMiddleware<T>(store: T, config: StoreMiddlewareConfig): T {
    const enhancer = new StoreEnhancer((store as any).$id, config)
    return enhancer.enhance(store)
  }
}
