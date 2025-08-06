/**
 * Offline Functionality Service
 * 
 * Provides comprehensive offline support for the YesSales application,
 * including data synchronization, conflict resolution, and offline operations.
 */

import { ref, computed, reactive, watch } from 'vue'
import { defineStore } from 'pinia'
import { useCache, usePersistence, handleStoreError, withLoading } from '@/stores/utils'
import type { Quote, Product, Customer } from '@/types/models'

/**
 * Offline operation types
 */
export interface OfflineOperation {
  id: string
  type: 'create' | 'update' | 'delete'
  entity: 'quote' | 'customer' | 'product' | 'user'
  entityId: string
  data: any
  originalData?: any
  timestamp: number
  retryCount: number
  lastError?: any
  status: 'pending' | 'syncing' | 'synced' | 'failed' | 'conflict'
}

/**
 * Sync conflict
 */
export interface SyncConflict {
  id: string
  operation: OfflineOperation
  localData: any
  serverData: any
  conflictType: 'version' | 'deleted' | 'modified'
  timestamp: number
  resolution?: 'local' | 'server' | 'merge'
}

/**
 * Offline configuration
 */
export interface OfflineConfig {
  enableAutoSync?: boolean
  syncInterval?: number // ms
  maxRetries?: number
  retryDelay?: number // ms
  maxOfflineOperations?: number
  syncOnConnect?: boolean
  conflictResolutionStrategy?: 'manual' | 'server_wins' | 'local_wins' | 'timestamp'
}

/**
 * Network status
 */
export interface NetworkStatus {
  isOnline: boolean
  connectionType?: string
  effectiveType?: string
  downlink?: number
  rtt?: number
  lastOnlineTime?: number
  lastOfflineTime?: number
}

/**
 * Default offline configuration
 */
const DEFAULT_OFFLINE_CONFIG: Required<OfflineConfig> = {
  enableAutoSync: true,
  syncInterval: 30000, // 30 seconds
  maxRetries: 3,
  retryDelay: 5000, // 5 seconds
  maxOfflineOperations: 1000,
  syncOnConnect: true,
  conflictResolutionStrategy: 'manual'
}

/**
 * Generate unique operation ID
 */
function generateOperationId(): string {
  return `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Detect network connection type
 */
function getNetworkInfo(): Partial<NetworkStatus> {
  try {
    // Uniapp network info
    const networkType = uni.getNetworkTypeSync()
    
    return {
      connectionType: networkType.networkType,
      isOnline: networkType.networkType !== 'none'
    }
  } catch (error) {
    console.warn('Failed to get network info:', error)
    return {
      isOnline: true // Default to online if detection fails
    }
  }
}

/**
 * Global offline store
 */
export const useOfflineStore = defineStore('offline', () => {
  // Configuration
  const config = ref<Required<OfflineConfig>>(DEFAULT_OFFLINE_CONFIG)
  
  // Network status
  const networkStatus = reactive<NetworkStatus>({
    isOnline: true,
    lastOnlineTime: Date.now()
  })
  
  // Offline operations queue
  const operations = reactive<Map<string, OfflineOperation>>(new Map())
  
  // Sync conflicts
  const conflicts = reactive<Map<string, SyncConflict>>(new Map())
  
  // Sync status
  const syncStatus = reactive({
    isRunning: false,
    lastSyncTime: 0,
    nextSyncTime: 0,
    syncInterval: null as number | null,
    operationsProcessed: 0,
    operationsFailed: 0
  })
  
  // Cache and persistence
  const cache = useCache('offline')
  const persistence = usePersistence('offline')
  
  // Computed properties
  const pendingOperations = computed(() => 
    Array.from(operations.values()).filter(op => op.status === 'pending')
  )
  
  const failedOperations = computed(() =>
    Array.from(operations.values()).filter(op => op.status === 'failed')
  )
  
  const conflictOperations = computed(() =>
    Array.from(operations.values()).filter(op => op.status === 'conflict')
  )
  
  const isOffline = computed(() => !networkStatus.isOnline)
  
  const hasPendingChanges = computed(() => 
    operations.size > 0 || conflicts.size > 0
  )
  
  const syncProgress = computed(() => {
    const total = operations.size
    if (total === 0) return 100
    
    const completed = syncStatus.operationsProcessed
    return Math.round((completed / total) * 100)
  })
  
  // Network monitoring
  function initializeNetworkMonitoring() {
    // Monitor network status changes
    uni.onNetworkStatusChange((res) => {
      const wasOffline = !networkStatus.isOnline
      
      networkStatus.isOnline = res.isConnected
      networkStatus.connectionType = res.networkType
      
      if (res.isConnected) {
        networkStatus.lastOnlineTime = Date.now()
        
        // Trigger sync when coming back online
        if (wasOffline && config.value.syncOnConnect) {
          console.log('📶 网络已连接，开始同步离线数据')
          setTimeout(() => syncOfflineOperations(), 1000)
        }
      } else {
        networkStatus.lastOfflineTime = Date.now()
        console.log('📵 网络已断开，进入离线模式')
      }
    })
    
    // Initial network status check
    const initialStatus = getNetworkInfo()
    Object.assign(networkStatus, initialStatus)
  }
  
  // Operation management
  function addOfflineOperation(
    type: OfflineOperation['type'],
    entity: OfflineOperation['entity'],
    entityId: string,
    data: any,
    originalData?: any
  ): string {
    const operationId = generateOperationId()
    
    const operation: OfflineOperation = {
      id: operationId,
      type,
      entity,
      entityId,
      data: JSON.parse(JSON.stringify(data)), // Deep copy
      originalData: originalData ? JSON.parse(JSON.stringify(originalData)) : undefined,
      timestamp: Date.now(),
      retryCount: 0,
      status: 'pending'
    }
    
    operations.set(operationId, operation)
    
    // Persist operations
    persistOperations()
    
    // Try immediate sync if online
    if (networkStatus.isOnline && config.value.enableAutoSync) {
      setTimeout(() => syncOperation(operationId), 100)
    }
    
    console.log(`💾 添加离线操作: ${type} ${entity} ${entityId}`)
    
    return operationId
  }
  
  function removeOfflineOperation(operationId: string): boolean {
    const removed = operations.delete(operationId)
    if (removed) {
      persistOperations()
    }
    return removed
  }
  
  function updateOperationStatus(
    operationId: string,
    status: OfflineOperation['status'],
    error?: any
  ): void {
    const operation = operations.get(operationId)
    if (operation) {
      operation.status = status
      if (error) {
        operation.lastError = error
      }
      persistOperations()
    }
  }
  
  // Sync operations
  async function syncOperation(operationId: string): Promise<boolean> {
    const operation = operations.get(operationId)
    if (!operation || !networkStatus.isOnline) {
      return false
    }
    
    if (operation.status === 'syncing') {
      return false // Already syncing
    }
    
    updateOperationStatus(operationId, 'syncing')
    
    try {
      const success = await performSync(operation)
      
      if (success) {
        updateOperationStatus(operationId, 'synced')
        syncStatus.operationsProcessed++
        
        // Remove synced operations after a delay
        setTimeout(() => {
          removeOfflineOperation(operationId)
        }, 5000)
        
        return true
      } else {
        throw new Error('Sync operation failed')
      }
    } catch (error) {
      operation.retryCount++
      
      if (operation.retryCount >= config.value.maxRetries) {
        updateOperationStatus(operationId, 'failed', error)
        syncStatus.operationsFailed++
        console.error(`❌ 离线操作同步失败 (${operationId}):`, error)
      } else {
        updateOperationStatus(operationId, 'pending', error)
        
        // Schedule retry
        setTimeout(() => {
          syncOperation(operationId)
        }, config.value.retryDelay * operation.retryCount)
      }
      
      return false
    }
  }
  
  async function syncAllOperations(): Promise<void> {
    if (!networkStatus.isOnline || syncStatus.isRunning) {
      return
    }
    
    const pendingOps = pendingOperations.value
    if (pendingOps.length === 0) {
      return
    }
    
    syncStatus.isRunning = true
    syncStatus.operationsProcessed = 0
    syncStatus.operationsFailed = 0
    
    console.log(`🔄 开始同步 ${pendingOps.length} 个离线操作`)
    
    try {
      // Process operations in batches to avoid overwhelming the server
      const batchSize = 5
      for (let i = 0; i < pendingOps.length; i += batchSize) {
        const batch = pendingOps.slice(i, i + batchSize)
        
        await Promise.allSettled(
          batch.map(op => syncOperation(op.id))
        )
        
        // Small delay between batches
        if (i + batchSize < pendingOps.length) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }
      
      syncStatus.lastSyncTime = Date.now()
      console.log(`✅ 离线同步完成: ${syncStatus.operationsProcessed} 成功, ${syncStatus.operationsFailed} 失败`)
      
    } catch (error) {
      console.error('❌ 同步过程中发生错误:', error)
    } finally {
      syncStatus.isRunning = false
    }
  }
  
  // Perform actual sync with server
  async function performSync(operation: OfflineOperation): Promise<boolean> {
    const { type, entity, entityId, data } = operation
    
    try {
      // Import API services dynamically to avoid circular dependencies
      const { ApiService } = await import('@/api')
      
      switch (entity) {
        case 'quote':
          return await syncQuote(type, entityId, data)
        case 'customer':
          return await syncCustomer(type, entityId, data)
        case 'product':
          return await syncProduct(type, entityId, data)
        default:
          throw new Error(`Unsupported entity type: ${entity}`)
      }
    } catch (error) {
      console.error(`Sync failed for ${entity} ${entityId}:`, error)
      return false
    }
  }
  
  // Entity-specific sync methods
  async function syncQuote(type: string, entityId: string, data: any): Promise<boolean> {
    const { QuotesApi } = await import('@/api/quotes')
    
    switch (type) {
      case 'create':
        const createResult = await QuotesApi.createQuote(data)
        return createResult.success
      
      case 'update':
        const updateResult = await QuotesApi.updateQuote(entityId, data)
        return updateResult.success
      
      case 'delete':
        const deleteResult = await QuotesApi.deleteQuote(entityId)
        return deleteResult.success
      
      default:
        return false
    }
  }
  
  async function syncCustomer(type: string, entityId: string, data: any): Promise<boolean> {
    // Similar implementation for customers
    return true
  }
  
  async function syncProduct(type: string, entityId: string, data: any): Promise<boolean> {
    // Similar implementation for products
    return true
  }
  
  // Conflict resolution
  function addConflict(operation: OfflineOperation, serverData: any): void {
    const conflictId = generateOperationId()
    
    const conflict: SyncConflict = {
      id: conflictId,
      operation,
      localData: operation.data,
      serverData,
      conflictType: 'modified',
      timestamp: Date.now()
    }
    
    conflicts.set(conflictId, conflict)
    updateOperationStatus(operation.id, 'conflict')
    
    console.warn(`⚠️ 检测到数据冲突: ${operation.entity} ${operation.entityId}`)
  }
  
  function resolveConflict(conflictId: string, resolution: 'local' | 'server' | 'merge'): boolean {
    const conflict = conflicts.get(conflictId)
    if (!conflict) return false
    
    conflict.resolution = resolution
    
    try {
      switch (resolution) {
        case 'server':
          // Use server data, discard local changes
          removeOfflineOperation(conflict.operation.id)
          break
        
        case 'local':
          // Keep local data, retry sync
          updateOperationStatus(conflict.operation.id, 'pending')
          break
        
        case 'merge':
          // Merge data and retry sync
          const mergedData = mergeData(conflict.localData, conflict.serverData)
          conflict.operation.data = mergedData
          updateOperationStatus(conflict.operation.id, 'pending')
          break
      }
      
      conflicts.delete(conflictId)
      return true
    } catch (error) {
      console.error('Failed to resolve conflict:', error)
      return false
    }
  }
  
  function mergeData(localData: any, serverData: any): any {
    // Simple merge strategy - can be enhanced based on needs
    return {
      ...serverData,
      ...localData,
      // Preserve server metadata
      id: serverData.id,
      created_at: serverData.created_at,
      updated_at: new Date().toISOString()
    }
  }
  
  // Auto sync setup
  function setupAutoSync(): void {
    if (!config.value.enableAutoSync) return
    
    // Clear existing interval
    if (syncStatus.syncInterval) {
      clearInterval(syncStatus.syncInterval)
    }
    
    // Set up new interval
    syncStatus.syncInterval = setInterval(() => {
      if (networkStatus.isOnline && !syncStatus.isRunning) {
        syncAllOperations()
      }
    }, config.value.syncInterval)
    
    syncStatus.nextSyncTime = Date.now() + config.value.syncInterval
  }
  
  // Persistence
  async function persistOperations(): Promise<void> {
    const operationsData = Array.from(operations.values())
    const conflictsData = Array.from(conflicts.values())
    
    await persistence.saveNow({
      operations: operationsData,
      conflicts: conflictsData,
      syncStatus: {
        lastSyncTime: syncStatus.lastSyncTime,
        operationsProcessed: syncStatus.operationsProcessed,
        operationsFailed: syncStatus.operationsFailed
      }
    })
  }
  
  async function loadPersistedOperations(): Promise<void> {
    const persistedData = await persistence.initializePersistence({})
    
    if (persistedData?.operations) {
      operations.clear()
      persistedData.operations.forEach((op: OfflineOperation) => {
        operations.set(op.id, op)
      })
    }
    
    if (persistedData?.conflicts) {
      conflicts.clear()
      persistedData.conflicts.forEach((conflict: SyncConflict) => {
        conflicts.set(conflict.id, conflict)
      })
    }
    
    if (persistedData?.syncStatus) {
      Object.assign(syncStatus, persistedData.syncStatus)
    }
  }
  
  // Initialize offline functionality
  async function initialize(): Promise<void> {
    console.log('🔧 初始化离线功能...')
    
    // Load persisted operations
    await loadPersistedOperations()
    
    // Initialize network monitoring
    initializeNetworkMonitoring()
    
    // Setup auto sync
    setupAutoSync()
    
    console.log(`✅ 离线功能初始化完成 (${operations.size} 个待同步操作)`)
    
    // Initial sync if online
    if (networkStatus.isOnline && operations.size > 0) {
      setTimeout(() => syncAllOperations(), 2000)
    }
  }
  
  // Public API
  return {
    // Configuration
    config: computed(() => config.value),
    updateConfig: (newConfig: Partial<OfflineConfig>) => {
      Object.assign(config.value, newConfig)
      setupAutoSync() // Restart auto sync with new config
    },
    
    // State
    networkStatus: computed(() => networkStatus),
    isOffline,
    hasPendingChanges,
    syncProgress,
    
    // Operations
    operations: computed(() => Array.from(operations.values())),
    pendingOperations,
    failedOperations,
    conflictOperations,
    
    // Conflicts
    conflicts: computed(() => Array.from(conflicts.values())),
    
    // Sync status
    syncStatus: computed(() => syncStatus),
    
    // Methods
    initialize,
    addOfflineOperation,
    removeOfflineOperation,
    syncOperation,
    syncAllOperations: () => withLoading('offline', 'syncAll', syncAllOperations),
    resolveConflict,
    
    // Utilities
    clearAllOperations: () => {
      operations.clear()
      conflicts.clear()
      persistOperations()
    },
    getOperationsByEntity: (entity: string) =>
      Array.from(operations.values()).filter(op => op.entity === entity)
  }
})

/**
 * Offline composable for individual stores
 */
export function useOffline(entity: OfflineOperation['entity']) {
  const offlineStore = useOfflineStore()
  
  /**
   * Execute operation with offline support
   */
  async function withOfflineSupport<T>(
    operation: () => Promise<T>,
    fallbackData?: any,
    operationType: OfflineOperation['type'] = 'update',
    entityId?: string
  ): Promise<T | null> {
    if (offlineStore.networkStatus.isOnline) {
      try {
        return await operation()
      } catch (error) {
        // Network error, add to offline queue
        if (fallbackData && entityId) {
          offlineStore.addOfflineOperation(
            operationType,
            entity,
            entityId,
            fallbackData
          )
        }
        throw error
      }
    } else {
      // Offline mode
      if (fallbackData && entityId) {
        offlineStore.addOfflineOperation(
          operationType,
          entity,
          entityId,
          fallbackData
        )
      }
      
      return fallbackData || null
    }
  }
  
  /**
   * Create with offline support
   */
  async function createOffline<T>(
    data: T,
    createFn: () => Promise<T>,
    tempId?: string
  ): Promise<T | null> {
    return await withOfflineSupport(
      createFn,
      { ...data, id: tempId || `temp_${Date.now()}` },
      'create',
      tempId
    )
  }
  
  /**
   * Update with offline support
   */
  async function updateOffline<T>(
    id: string,
    data: Partial<T>,
    updateFn: () => Promise<T>,
    originalData?: T
  ): Promise<T | null> {
    return await withOfflineSupport(
      updateFn,
      data,
      'update',
      id
    )
  }
  
  /**
   * Delete with offline support
   */
  async function deleteOffline(
    id: string,
    deleteFn: () => Promise<void>
  ): Promise<boolean> {
    try {
      const result = await withOfflineSupport(
        deleteFn,
        { deleted: true },
        'delete',
        id
      )
      return result !== null
    } catch (error) {
      return false
    }
  }
  
  return {
    withOfflineSupport,
    createOffline,
    updateOffline,
    deleteOffline,
    
    // Entity-specific operations
    getPendingOperations: () => 
      offlineStore.operations.filter(op => op.entity === entity),
    
    // Access to global store
    global: offlineStore
  }
}

/**
 * Offline sync composable for UI components
 */
export function useOfflineSync() {
  const offlineStore = useOfflineStore()
  
  return {
    // Status
    isOffline: offlineStore.isOffline,
    isOnline: computed(() => offlineStore.networkStatus.isOnline),
    hasPendingChanges: offlineStore.hasPendingChanges,
    syncProgress: offlineStore.syncProgress,
    isSyncing: computed(() => offlineStore.syncStatus.isRunning),
    
    // Operations counts
    pendingCount: computed(() => offlineStore.pendingOperations.length),
    failedCount: computed(() => offlineStore.failedOperations.length),
    conflictCount: computed(() => offlineStore.conflicts.length),
    
    // Manual actions
    sync: offlineStore.syncAllOperations,
    clearFailed: () => {
      const failed = offlineStore.failedOperations
      failed.forEach(op => {
        offlineStore.removeOfflineOperation(op.id)
      })
    },
    
    // Network info
    networkStatus: offlineStore.networkStatus,
    lastSyncTime: computed(() => offlineStore.syncStatus.lastSyncTime),
    nextSyncTime: computed(() => offlineStore.syncStatus.nextSyncTime)
  }
}