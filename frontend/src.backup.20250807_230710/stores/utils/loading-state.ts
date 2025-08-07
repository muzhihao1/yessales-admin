/**
 * Loading State Management Utility
 * 
 * Provides centralized loading state management for all Pinia stores with
 * store-scoped operations, global loading aggregation, and automatic cleanup.
 */

import { ref, computed, reactive, onUnmounted } from 'vue'
import { defineStore } from 'pinia'
import { handleStoreError, withErrorHandling } from './error-handler'
import type { ErrorHandlerConfig } from './error-handler'

/**
 * Loading state for individual operations
 */
export interface LoadingOperation {
  id: string
  store: string
  operation: string
  startTime: number
  timeout?: number
}

/**
 * Loading state configuration
 */
export interface LoadingConfig {
  timeout?: number // Auto-cleanup after timeout (ms)
  showGlobalIndicator?: boolean // Include in global loading state
  priority?: 'low' | 'medium' | 'high' // Priority for UI indicators
}

/**
 * Global loading state store using Pinia
 */
export const useGlobalLoadingStore = defineStore('globalLoading', () => {
  // Active loading operations
  const operations = reactive<Map<string, LoadingOperation>>(new Map())
  
  // Computed loading states
  const isGlobalLoading = computed(() => operations.size > 0)
  
  const loadingByStore = computed(() => {
    const storeLoading: Record<string, boolean> = {}
    for (const operation of operations.values()) {
      storeLoading[operation.store] = true
    }
    return storeLoading
  })
  
  const loadingOperations = computed(() => Array.from(operations.values()))
  
  const highPriorityLoading = computed(() => 
    loadingOperations.value.some(op => {
      // High priority operations should block UI
      return op.operation.includes('delete') || 
             op.operation.includes('create') || 
             op.operation.includes('update')
    })
  )
  
  // Actions
  function startOperation(operation: LoadingOperation) {
    operations.set(operation.id, operation)
    
    // Auto-cleanup with timeout
    if (operation.timeout) {
      setTimeout(() => {
        stopOperation(operation.id)
      }, operation.timeout)
    }
  }
  
  function stopOperation(operationId: string) {
    operations.delete(operationId)
  }
  
  function stopAllOperations(store?: string) {
    if (store) {
      // Stop all operations for specific store
      for (const [id, operation] of operations.entries()) {
        if (operation.store === store) {
          operations.delete(id)
        }
      }
    } else {
      // Stop all operations
      operations.clear()
    }
  }
  
  function getOperation(operationId: string): LoadingOperation | undefined {
    return operations.get(operationId)
  }
  
  function isOperationActive(operationId: string): boolean {
    return operations.has(operationId)
  }
  
  function isStoreLoading(store: string): boolean {
    for (const operation of operations.values()) {
      if (operation.store === store) {
        return true
      }
    }
    return false
  }
  
  return {
    // State
    operations: computed(() => Array.from(operations.values())),
    isGlobalLoading,
    loadingByStore,
    loadingOperations,
    highPriorityLoading,
    
    // Actions
    startOperation,
    stopOperation,
    stopAllOperations,
    getOperation,
    isOperationActive,
    isStoreLoading
  }
})

/**
 * Generate unique operation ID
 */
function generateOperationId(store: string, operation: string): string {
  return `${store}:${operation}:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Loading state composable for individual stores
 */
export function useLoadingState(store: string, defaultOperation?: string) {
  const globalLoading = useGlobalLoadingStore()
  
  // Local loading states for this store instance
  const localOperations = ref<Set<string>>(new Set())
  
  // Computed states
  const isLoading = computed(() => {
    if (defaultOperation) {
      // Check if specific operation is loading
      return Array.from(localOperations.value).some(id => 
        globalLoading.getOperation(id)?.operation === defaultOperation
      )
    } else {
      // Check if any operation in this store is loading
      return localOperations.value.size > 0
    }
  })
  
  const isStoreLoading = computed(() => globalLoading.isStoreLoading(store))
  const isGlobalLoading = computed(() => globalLoading.isGlobalLoading)
  
  // Get active operations for this store
  const activeOperations = computed(() => 
    globalLoading.loadingOperations.filter(op => op.store === store)
  )
  
  // Actions
  function startLoading(
    operation: string = defaultOperation || 'default',
    config: LoadingConfig = {}
  ): string {
    const operationId = generateOperationId(store, operation)
    
    const loadingOperation: LoadingOperation = {
      id: operationId,
      store,
      operation,
      startTime: Date.now(),
      timeout: config.timeout
    }
    
    // Add to global loading state
    globalLoading.startOperation(loadingOperation)
    
    // Track locally
    localOperations.value.add(operationId)
    
    return operationId
  }
  
  function stopLoading(operationId?: string) {
    if (operationId) {
      // Stop specific operation
      globalLoading.stopOperation(operationId)
      localOperations.value.delete(operationId)
    } else if (defaultOperation) {
      // Stop all operations of default type
      const opsToStop = Array.from(localOperations.value).filter(id => {
        const op = globalLoading.getOperation(id)
        return op?.operation === defaultOperation
      })
      
      opsToStop.forEach(id => {
        globalLoading.stopOperation(id)
        localOperations.value.delete(id)
      })
    } else {
      // Stop all operations for this store
      localOperations.value.forEach(id => {
        globalLoading.stopOperation(id)
      })
      localOperations.value.clear()
    }
  }
  
  function stopAll() {
    localOperations.value.forEach(id => {
      globalLoading.stopOperation(id)
    })
    localOperations.value.clear()
  }
  
  // Cleanup on component unmount
  onUnmounted(() => {
    stopAll()
  })
  
  return {
    // State
    isLoading,
    isStoreLoading,
    isGlobalLoading,
    activeOperations,
    
    // Actions
    startLoading,
    stopLoading,
    stopAll,
    
    // Utilities
    operationCount: computed(() => localOperations.value.size)
  }
}

/**
 * Loading wrapper function for async operations
 */
export async function withLoading<T>(
  store: string,
  operation: string,
  asyncFn: () => Promise<T>,
  config: LoadingConfig & ErrorHandlerConfig = {}
): Promise<T | null> {
  const { startLoading, stopLoading } = useLoadingState(store)
  
  const operationId = startLoading(operation, config)
  
  try {
    const result = await asyncFn()
    return result
  } catch (error) {
    // Use error handler for consistent error management
    await handleStoreError(error, {
      ...config,
      context: {
        store,
        action: operation,
        ...(config.context || {})
      }
    })
    return null
  } finally {
    stopLoading(operationId)
  }
}

/**
 * Advanced loading wrapper with retry and error handling
 */
export async function withLoadingAndRetry<T>(
  store: string,
  operation: string,
  asyncFn: () => Promise<T>,
  config: LoadingConfig & ErrorHandlerConfig & {
    maxRetries?: number
    retryDelay?: number
    backoff?: boolean
  } = {}
): Promise<T | null> {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    backoff = true,
    ...loadingConfig
  } = config
  
  const { startLoading, stopLoading } = useLoadingState(store)
  
  const operationId = startLoading(operation, loadingConfig)
  
  try {
    let lastError: any
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await asyncFn()
        return result
      } catch (error) {
        lastError = error
        
        if (attempt < maxRetries) {
          // Wait before retrying
          const waitTime = backoff ? retryDelay * Math.pow(2, attempt - 1) : retryDelay
          await new Promise(resolve => setTimeout(resolve, waitTime))
          console.log(`Retrying ${store}.${operation} (attempt ${attempt + 1}/${maxRetries})`)
        }
      }
    }
    
    // All retries failed
    await handleStoreError(lastError, {
      ...loadingConfig,
      context: {
        store,
        action: operation,
        ...(loadingConfig.context || {})
      }
    })
    return null
    
  } finally {
    stopLoading(operationId)
  }
}

/**
 * Batch loading operations
 */
export async function withBatchLoading<T>(
  store: string,
  baseOperation: string,
  operations: Array<{
    name: string
    fn: () => Promise<T>
  }>,
  config: LoadingConfig = {}
): Promise<(T | null)[]> {
  const { startLoading, stopLoading } = useLoadingState(store)
  
  const operationId = startLoading(`${baseOperation}:batch`, config)
  
  try {
    const results = await Promise.allSettled(
      operations.map(async (op, index) => {
        return await withErrorHandling(op.fn, {
          context: {
            store,
            action: `${baseOperation}:${op.name}`,
            batchIndex: index
          }
        })
      })
    )
    
    return results.map(result => 
      result.status === 'fulfilled' ? result.value : null
    )
  } finally {
    stopLoading(operationId)
  }
}

/**
 * Sequential loading operations
 */
export async function withSequentialLoading<T>(
  store: string,
  baseOperation: string,
  operations: Array<{
    name: string
    fn: () => Promise<T>
    dependency?: string // Wait for this operation to complete first
  }>,
  config: LoadingConfig = {}
): Promise<(T | null)[]> {
  const { startLoading, stopLoading } = useLoadingState(store)
  
  const operationId = startLoading(`${baseOperation}:sequential`, config)
  const results: (T | null)[] = []
  const completed = new Set<string>()
  
  try {
    for (const op of operations) {
      // Wait for dependency if specified
      if (op.dependency && !completed.has(op.dependency)) {
        throw new Error(`Dependency ${op.dependency} not completed for ${op.name}`)
      }
      
      const result = await withErrorHandling(op.fn, {
        context: {
          store,
          action: `${baseOperation}:${op.name}`
        }
      })
      
      results.push(result)
      completed.add(op.name)
    }
    
    return results
  } finally {
    stopLoading(operationId)
  }
}

/**
 * Loading state debugging utilities
 */
export const loadingDebug = {
  /**
   * Get current loading state summary
   */
  getLoadingStats() {
    const globalLoading = useGlobalLoadingStore()
    const operations = globalLoading.loadingOperations
    
    const stats = {
      total: operations.length,
      byStore: {} as Record<string, number>,
      byOperation: {} as Record<string, number>,
      longRunning: [] as LoadingOperation[],
      averageDuration: 0
    }
    
    const now = Date.now()
    let totalDuration = 0
    
    operations.forEach(op => {
      // Count by store
      stats.byStore[op.store] = (stats.byStore[op.store] || 0) + 1
      
      // Count by operation
      stats.byOperation[op.operation] = (stats.byOperation[op.operation] || 0) + 1
      
      // Check for long-running operations (>10 seconds)
      const duration = now - op.startTime
      totalDuration += duration
      
      if (duration > 10000) {
        stats.longRunning.push(op)
      }
    })
    
    stats.averageDuration = operations.length > 0 ? totalDuration / operations.length : 0
    
    return stats
  },
  
  /**
   * Log current loading state
   */
  logLoadingState() {
    const stats = this.getLoadingStats()
    console.table(stats)
  },
  
  /**
   * Force stop all operations (for debugging)
   */
  forceStopAll() {
    const globalLoading = useGlobalLoadingStore()
    globalLoading.stopAllOperations()
    console.log('All loading operations stopped')
  }
}