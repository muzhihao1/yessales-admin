/**
 * Store Utilities Index
 * 
 * Centralized export for all store utilities and helper functions.
 */

// Core utilities
export * from './error-handler'
export * from './loading-state'
export * from './cache-manager'
export * from './optimistic-updates'
export * from './persistence'
export * from './validation'
export * from './debug'

// Re-export commonly used types and interfaces
export type {
  StoreError,
  ErrorCategory,
  ErrorSeverity,
  ErrorHandlerConfig
} from './error-handler'

export type {
  LoadingOperation,
  LoadingConfig
} from './loading-state'

export type {
  CacheEntry,
  CacheConfig,
  CacheStats
} from './cache-manager'

export type {
  OptimisticOperation,
  OptimisticConfig
} from './optimistic-updates'

export type {
  PersistenceConfig
} from './persistence'

export type {
  ValidationSchema,
  ValidationResult,
  ValidationError,
  BusinessRule,
  FieldSchema
} from './validation'

export type {
  ActionLogEntry,
  StateSnapshot,
  PerformanceMetrics,
  DebugConfig
} from './debug'

// Utility function collections
export { cachePatterns, globalCache } from './cache-manager'
export { optimisticPatterns } from './optimistic-updates'
export { persistencePatterns, migrationHelpers } from './persistence'
export { commonSchemas } from './validation'
export { timeTravel, devTools } from './debug'
export { loadingDebug } from './loading-state'