/**
 * Optimistic Updates Utility
 *
 * Provides optimistic UI updates for better user experience during
 * async operations, with automatic rollback on failure.
 */

import { computed, reactive, ref } from 'vue'
import { defineStore } from 'pinia'
import { handleStoreError } from './error-handler'
import { useLoadingState } from './loading-state'
import type { ErrorHandlerConfig } from './error-handler'

/**
 * Optimistic update operation
 */
export interface OptimisticOperation<T = any> {
  id: string
  type: 'create' | 'update' | 'delete' | 'custom'
  target: string // Resource identifier (e.g., 'user:123', 'product:456')
  store: string
  action: string
  timestamp: number

  // Original state backup
  originalData?: T

  // Optimistic changes
  optimisticData?: T

  // Operation status
  status: 'pending' | 'confirmed' | 'failed' | 'rolled_back'

  // Error information if failed
  error?: any

  // Rollback function
  rollback?: () => void

  // Confirmation function
  confirm?: () => void
}

/**
 * Optimistic update configuration
 */
export interface OptimisticConfig {
  timeout?: number // Auto-rollback timeout (default: 30 seconds)
  enableRollback?: boolean // Allow automatic rollback on failure
  showRollbackToast?: boolean // Show toast on rollback
  retryOnFailure?: boolean // Retry operation on failure
  maxRetries?: number // Max retry attempts
}

/**
 * Default optimistic update configuration
 */
const DEFAULT_CONFIG: Required<OptimisticConfig> = {
  timeout: 30000, // 30 seconds
  enableRollback: true,
  showRollbackToast: true,
  retryOnFailure: false,
  maxRetries: 3
}

/**
 * Generate unique operation ID
 */
function generateOptimisticId(): string {
  return `opt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Global optimistic updates store
 */
export const useOptimisticStore = defineStore('optimistic', () => {
  // Active optimistic operations
  const operations = reactive<Map<string, OptimisticOperation>>(new Map())

  // Computed states
  const pendingOperations = computed(() =>
    Array.from(operations.values()).filter(op => op.status === 'pending')
  )

  const failedOperations = computed(() =>
    Array.from(operations.values()).filter(op => op.status === 'failed')
  )

  const operationsByStore = computed(() => {
    const byStore: Record<string, OptimisticOperation[]> = {}

    for (const operation of operations.values()) {
      if (!byStore[operation.store]) {
        byStore[operation.store] = []
      }
      byStore[operation.store].push(operation)
    }

    return byStore
  })

  const operationsByTarget = computed(() => {
    const byTarget: Record<string, OptimisticOperation[]> = {}

    for (const operation of operations.values()) {
      if (!byTarget[operation.target]) {
        byTarget[operation.target] = []
      }
      byTarget[operation.target].push(operation)
    }

    return byTarget
  })

  // Actions
  function addOperation(operation: OptimisticOperation): void {
    operations.set(operation.id, operation)

    // Auto-cleanup with timeout
    if (operation.status === 'pending') {
      setTimeout(() => {
        const currentOp = operations.get(operation.id)
        if (currentOp?.status === 'pending') {
          rollbackOperation(operation.id, 'Operation timed out')
        }
      }, DEFAULT_CONFIG.timeout)
    }
  }

  function confirmOperation(operationId: string): void {
    const operation = operations.get(operationId)
    if (operation) {
      operation.status = 'confirmed'

      // Execute confirmation callback
      if (operation.confirm) {
        operation.confirm()
      }

      // Clean up after confirmation
      setTimeout(() => {
        operations.delete(operationId)
      }, 1000)
    }
  }

  function rollbackOperation(operationId: string, reason?: string): void {
    const operation = operations.get(operationId)
    if (operation) {
      operation.status = 'rolled_back'
      operation.error = reason

      // Execute rollback callback
      if (operation.rollback) {
        operation.rollback()
      }

      // Show rollback notification
      if (DEFAULT_CONFIG.showRollbackToast) {
        uni.showToast({
          title: reason || '操作已撤销',
          icon: 'none',
          duration: 2000
        })
      }
    }
  }

  function failOperation(operationId: string, error: any): void {
    const operation = operations.get(operationId)
    if (operation) {
      operation.status = 'failed'
      operation.error = error

      // Auto-rollback if enabled
      if (DEFAULT_CONFIG.enableRollback) {
        rollbackOperation(operationId, '操作失败，已自动撤销')
      }
    }
  }

  function removeOperation(operationId: string): void {
    operations.delete(operationId)
  }

  function clearOperations(store?: string): void {
    if (store) {
      // Clear operations for specific store
      for (const [id, operation] of operations.entries()) {
        if (operation.store === store) {
          operations.delete(id)
        }
      }
    } else {
      // Clear all operations
      operations.clear()
    }
  }

  function getOperation(operationId: string): OptimisticOperation | undefined {
    return operations.get(operationId)
  }

  function getOperationsByTarget(target: string): OptimisticOperation[] {
    return Array.from(operations.values()).filter(op => op.target === target)
  }

  function hasPendingOperations(store?: string, target?: string): boolean {
    const pending = pendingOperations.value

    if (store) {
      return pending.some(op => op.store === store)
    }

    if (target) {
      return pending.some(op => op.target === target)
    }

    return pending.length > 0
  }

  return {
    // State
    operations: computed(() => Array.from(operations.values())),
    pendingOperations,
    failedOperations,
    operationsByStore,
    operationsByTarget,

    // Actions
    addOperation,
    confirmOperation,
    rollbackOperation,
    failOperation,
    removeOperation,
    clearOperations,
    getOperation,
    getOperationsByTarget,
    hasPendingOperations
  }
})

/**
 * Optimistic updates composable
 */
export function useOptimisticUpdates(store: string) {
  const optimisticStore = useOptimisticStore()
  const { startLoading, stopLoading } = useLoadingState(store)

  /**
   * Create optimistic update operation
   */
  async function withOptimisticUpdate<T, R>(config: {
    type: OptimisticOperation['type']
    target: string
    action: string

    // Data transformations
    getOriginalData?: () => T
    applyOptimisticChange: (original?: T) => T

    // Operation to perform
    operation: () => Promise<R>

    // Callbacks
    onSuccess?: (result: R, optimisticData: T) => void
    onFailure?: (error: any, originalData?: T) => void
    onRollback?: (originalData?: T) => void

    // Configuration
    optimisticConfig?: Partial<OptimisticConfig>
  }): Promise<R | null> {
    const finalConfig = { ...DEFAULT_CONFIG, ...config.optimisticConfig }
    const operationId = generateOptimisticId()

    // Get original data before changes
    const originalData = config.getOriginalData?.()

    // Apply optimistic changes
    const optimisticData = config.applyOptimisticChange(originalData)

    // Create operation record
    const operation: OptimisticOperation<T> = {
      id: operationId,
      type: config.type,
      target: config.target,
      store,
      action: config.action,
      timestamp: Date.now(),
      originalData,
      optimisticData,
      status: 'pending',

      // Rollback function
      rollback: () => {
        if (config.onRollback) {
          config.onRollback(originalData)
        }
      },

      // Confirmation function
      confirm: () => {
        if (config.onSuccess) {
          // Will be called with the actual result
        }
      }
    }

    // Add to optimistic store
    optimisticStore.addOperation(operation)

    // Start loading state
    const loadingId = startLoading(config.action)

    try {
      // Perform the actual operation
      const result = await config.operation()

      // Confirm the optimistic update
      optimisticStore.confirmOperation(operationId)

      // Call success callback
      if (config.onSuccess) {
        config.onSuccess(result, optimisticData)
      }

      return result
    } catch (error) {
      // Handle failure
      optimisticStore.failOperation(operationId, error)

      // Call failure callback
      if (config.onFailure) {
        config.onFailure(error, originalData)
      }

      // Handle error with standard error handler
      await handleStoreError(error, {
        context: {
          store,
          action: config.action,
          target: config.target
        }
      })

      return null
    } finally {
      stopLoading(loadingId)
    }
  }

  /**
   * Optimistic create operation
   */
  async function optimisticCreate<TData, TResult>(
    target: string,
    newData: TData,
    operation: () => Promise<TResult>,
    callbacks: {
      addToList: (data: TData) => void
      removeFromList: (data: TData) => void
      onSuccess?: (result: TResult) => void
      onFailure?: (error: any) => void
    }
  ): Promise<TResult | null> {
    return await withOptimisticUpdate({
      type: 'create',
      target,
      action: 'create',

      applyOptimisticChange: () => {
        callbacks.addToList(newData)
        return newData
      },

      operation,

      onSuccess: callbacks.onSuccess,

      onFailure: error => {
        callbacks.onFailure?.(error)
      },

      onRollback: () => {
        callbacks.removeFromList(newData)
      }
    })
  }

  /**
   * Optimistic update operation
   */
  async function optimisticUpdate<TData, TResult>(
    target: string,
    originalData: TData,
    updatedData: Partial<TData>,
    operation: () => Promise<TResult>,
    callbacks: {
      updateInList: (original: TData, updated: Partial<TData>) => void
      revertInList: (original: TData) => void
      onSuccess?: (result: TResult) => void
      onFailure?: (error: any) => void
    }
  ): Promise<TResult | null> {
    return await withOptimisticUpdate({
      type: 'update',
      target,
      action: 'update',

      getOriginalData: () => originalData,

      applyOptimisticChange: () => {
        callbacks.updateInList(originalData, updatedData)
        return { ...originalData, ...updatedData }
      },

      operation,

      onSuccess: callbacks.onSuccess,

      onFailure: error => {
        callbacks.onFailure?.(error)
      },

      onRollback: () => {
        callbacks.revertInList(originalData)
      }
    })
  }

  /**
   * Optimistic delete operation
   */
  async function optimisticDelete<TData, TResult>(
    target: string,
    dataToDelete: TData,
    operation: () => Promise<TResult>,
    callbacks: {
      removeFromList: (data: TData) => void
      addToList: (data: TData) => void
      onSuccess?: (result: TResult) => void
      onFailure?: (error: any) => void
    }
  ): Promise<TResult | null> {
    return await withOptimisticUpdate({
      type: 'delete',
      target,
      action: 'delete',

      getOriginalData: () => dataToDelete,

      applyOptimisticChange: () => {
        callbacks.removeFromList(dataToDelete)
        return dataToDelete
      },

      operation,

      onSuccess: callbacks.onSuccess,

      onFailure: error => {
        callbacks.onFailure?.(error)
      },

      onRollback: () => {
        callbacks.addToList(dataToDelete)
      }
    })
  }

  /**
   * Check if target has pending operations
   */
  function hasPendingOperations(target?: string): boolean {
    return optimisticStore.hasPendingOperations(store, target)
  }

  /**
   * Get pending operations for store
   */
  function getPendingOperations(target?: string): OptimisticOperation[] {
    const storeOperations = optimisticStore.operationsByStore[store] || []

    if (target) {
      return storeOperations.filter(op => op.target === target && op.status === 'pending')
    }

    return storeOperations.filter(op => op.status === 'pending')
  }

  /**
   * Manually rollback operation
   */
  function rollbackOperation(operationId: string, reason?: string): void {
    optimisticStore.rollbackOperation(operationId, reason)
  }

  /**
   * Clear all optimistic operations for this store
   */
  function clearOperations(): void {
    optimisticStore.clearOperations(store)
  }

  return {
    // Core operations
    withOptimisticUpdate,
    optimisticCreate,
    optimisticUpdate,
    optimisticDelete,

    // State queries
    hasPendingOperations,
    getPendingOperations,

    // Manual controls
    rollbackOperation,
    clearOperations,

    // Access to global store
    global: optimisticStore
  }
}

/**
 * Optimistic update patterns for common operations
 */
export const optimisticPatterns = {
  /**
   * List item creation pattern
   */
  createListItem<T>(list: T[], newItem: T, getId: (item: T) => string | number) {
    return {
      addToList: (data: T) => {
        list.unshift(data) // Add to beginning of list
      },
      removeFromList: (data: T) => {
        const id = getId(data)
        const index = list.findIndex(item => getId(item) === id)
        if (index > -1) {
          list.splice(index, 1)
        }
      }
    }
  },

  /**
   * List item update pattern
   */
  updateListItem<T>(list: T[], getId: (item: T) => string | number) {
    return {
      updateInList: (original: T, updated: Partial<T>) => {
        const id = getId(original)
        const index = list.findIndex(item => getId(item) === id)
        if (index > -1) {
          list[index] = { ...original, ...updated }
        }
      },
      revertInList: (original: T) => {
        const id = getId(original)
        const index = list.findIndex(item => getId(item) === id)
        if (index > -1) {
          list[index] = original
        }
      }
    }
  },

  /**
   * List item deletion pattern
   */
  deleteListItem<T>(list: T[], getId: (item: T) => string | number) {
    return {
      removeFromList: (data: T) => {
        const id = getId(data)
        const index = list.findIndex(item => getId(item) === id)
        if (index > -1) {
          list.splice(index, 1)
        }
      },
      addToList: (data: T) => {
        list.push(data) // Add back to end
      }
    }
  }
}
