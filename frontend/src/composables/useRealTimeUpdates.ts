import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { showToast } from '@/utils/ui'

/**
 * 实时更新和数据同步功能组合式API
 *
 * 功能说明：
 * - 防抖更新机制：避免频繁的API调用和UI刷新
 * - 增量数据同步：只更新变化的记录，提升性能
 * - 智能缓存管理：TTL缓存和智能失效策略
 * - 乐观更新：立即更新UI，后台同步数据
 * - 冲突解决：处理并发更新和数据冲突
 * - WebSocket支持：实时数据推送和事件处理
 *
 * 应用场景：
 * - 客户管理页面的实时状态更新
 * - 产品库存的实时数量变化
 * - 报价状态的实时审批进度
 * - 系统通知的实时推送
 * - 多用户协作时的数据同步
 *
 * 性能优化：
 * - 智能防抖：不同操作类型使用不同的防抖延迟
 * - 批量更新：合并多个更新请求为单个批次
 * - 缓存策略：减少重复的网络请求
 * - 增量同步：只传输变化的数据字段
 * - 内存优化：自动清理过期的缓存数据
 *
 * @author Terminal 3 (Admin Frontend Team)
 */

export interface RealTimeUpdateOptions {
  /** 防抖延迟时间（毫秒） */
  debounceDelay: number
  /** 缓存过期时间（毫秒） */
  cacheExpiry: number
  /** 最大重试次数 */
  maxRetries: number
  /** 批量更新的最大数量 */
  batchSize: number
  /** 是否启用乐观更新 */
  optimisticUpdates: boolean
  /** WebSocket连接URL */
  websocketUrl?: string
  /** 自动重连间隔（毫秒） */
  reconnectInterval: number
}

export interface DataItem {
  id: string | number
  [key: string]: any
  _version?: number // 版本号，用于冲突检测
  _lastModified?: string // 最后修改时间
}

export interface UpdateOperation {
  id: string | number
  type: 'create' | 'update' | 'delete'
  data?: Partial<DataItem>
  timestamp: number
  optimistic?: boolean
}

export interface CacheEntry<T> {
  data: T
  timestamp: number
  expiry: number
}

export interface WebSocketMessage {
  type: 'update' | 'create' | 'delete' | 'batch'
  id?: string | number
  data?: any
}

export interface RealtimeBatchOperation {
  type: 'update' | 'create' | 'delete'
  id: string | number
  data?: any
}

const DEFAULT_OPTIONS: RealTimeUpdateOptions = {
  debounceDelay: 300,
  cacheExpiry: 5 * 60 * 1000, // 5分钟
  maxRetries: 3,
  batchSize: 10,
  optimisticUpdates: true,
  reconnectInterval: 3000
}

/**
 * 实时更新管理核心逻辑
 */
export function useRealTimeUpdates<T extends DataItem>(
  dataKey: string,
  options: Partial<RealTimeUpdateOptions> = {}
) {
  const opts = { ...DEFAULT_OPTIONS, ...options }

  // 响应式状态 - Use ref for array to avoid unwrapping issues
  const state = reactive({
    items: [] as any[],
    loading: false,
    syncing: false,
    connected: false,
    lastSync: null as Date | null,
    pendingUpdates: [] as UpdateOperation[],
    conflicts: [] as Array<{ local: any; remote: any }>
  })

  // 缓存管理
  const cache = new Map<string, CacheEntry<T>>()
  const updateQueue = new Map<string | number, UpdateOperation>()

  // WebSocket连接
  let ws: WebSocket | null = null
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null

  // 防抖定时器
  const debounceTimers = new Map<string, ReturnType<typeof setTimeout>>()
  const batchTimer: ReturnType<typeof setTimeout> | null = null

  /**
   * 智能防抖函数 - 根据操作类型使用不同延迟
   */
  const debouncedUpdate = (key: string, operation: () => Promise<void>, delay?: number) => {
    // 清除已存在的定时器
    if (debounceTimers.has(key)) {
      clearTimeout(debounceTimers.get(key)!)
    }

    const actualDelay = delay || opts.debounceDelay
    const timer = setTimeout(async () => {
      try {
        await operation()
        debounceTimers.delete(key)
      } catch (error) {
        console.error(`Debounced operation failed for key ${key}:`, error)
      }
    }, actualDelay)

    debounceTimers.set(key, timer)
  }

  /**
   * 缓存管理
   */
  const getCached = (id: string | number): T | null => {
    const key = `${dataKey}_${id}`
    const entry = cache.get(key)

    if (!entry) return null

    // 检查是否过期
    if (Date.now() > entry.expiry) {
      cache.delete(key)
      return null
    }

    return entry.data
  }

  const setCached = (id: string | number, data: T) => {
    const key = `${dataKey}_${id}`
    cache.set(key, {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + opts.cacheExpiry
    })
  }

  const clearCache = (id?: string | number) => {
    if (id) {
      const key = `${dataKey}_${id}`
      cache.delete(key)
    } else {
      // 清除所有相关缓存
      for (const key of cache.keys()) {
        if (key.startsWith(dataKey)) {
          cache.delete(key)
        }
      }
    }
  }

  /**
   * 增量数据更新 - 只更新变化的字段
   */
  const mergeDataChanges = (current: T, updates: Partial<T>): T => {
    const merged = { ...current }
    let hasChanges = false

    for (const [key, value] of Object.entries(updates)) {
      if ((current as any)[key] !== value) {
        ;(merged as any)[key] = value
        hasChanges = true
      }
    }

    if (hasChanges) {
      merged._lastModified = new Date().toISOString()
      merged._version = (current._version || 0) + 1
    }

    return merged
  }

  /**
   * 乐观更新 - 立即更新UI，后台同步数据
   */
  const optimisticUpdate = (
    id: string | number,
    updates: Partial<T>,
    syncOperation: () => Promise<T>
  ) => {
    if (!opts.optimisticUpdates) {
      return syncOperation()
    }

    // 立即更新本地数据
    const index = state.items.findIndex(item => item.id === id)
    if (index !== -1) {
      const current = state.items[index]
      const optimisticData = mergeDataChanges(current, updates)
      state.items[index] = optimisticData
      setCached(id, optimisticData)
    }

    // 后台同步，失败时回滚
    return syncOperation().catch(error => {
      // 回滚乐观更新
      const cachedOriginal = getCached(id)
      if (cachedOriginal && index !== -1) {
        state.items[index] = cachedOriginal
      }

      showToast('数据同步失败，已恢复原始状态', 'error')
      throw error
    })
  }

  /**
   * 批量更新处理
   */
  const processBatchUpdates = async () => {
    if (updateQueue.size === 0) return

    const batch = Array.from(updateQueue.values()).slice(0, opts.batchSize)
    updateQueue.clear()

    try {
      state.syncing = true

      // 按类型分组批量操作
      const grouped = {
        create: batch.filter(op => op.type === 'create'),
        update: batch.filter(op => op.type === 'update'),
        delete: batch.filter(op => op.type === 'delete')
      }

      // 并行执行批量操作
      const promises = []

      if (grouped.create.length > 0) {
        promises.push(batchCreate(grouped.create))
      }

      if (grouped.update.length > 0) {
        promises.push(batchUpdate(grouped.update))
      }

      if (grouped.delete.length > 0) {
        promises.push(batchDelete(grouped.delete))
      }

      await Promise.all(promises)
      state.lastSync = new Date()
    } catch (error) {
      console.error('Batch update failed:', error)
      // 重新加入队列稍后重试
      batch.forEach(op => updateQueue.set(op.id, op))
    } finally {
      state.syncing = false
    }
  }

  /**
   * 批量操作实现（需要根据实际API调整）
   */
  const batchCreate = async (operations: UpdateOperation[]) => {
    // 实际实现中需要调用相应的批量创建API
    console.log('Batch create operations:', operations)
  }

  const batchUpdate = async (operations: UpdateOperation[]) => {
    // 实际实现中需要调用相应的批量更新API
    console.log('Batch update operations:', operations)
  }

  const batchDelete = async (operations: UpdateOperation[]) => {
    // 实际实现中需要调用相应的批量删除API
    console.log('Batch delete operations:', operations)
  }

  /**
   * 冲突检测和解决
   */
  const detectConflicts = (localData: T, remoteData: T): boolean => {
    // 基于版本号的简单冲突检测
    if (localData._version && remoteData._version) {
      return localData._version !== remoteData._version
    }

    // 基于时间戳的冲突检测
    if (localData._lastModified && remoteData._lastModified) {
      return new Date(localData._lastModified) > new Date(remoteData._lastModified)
    }

    return false
  }

  const resolveConflict = (
    local: T,
    remote: T,
    strategy: 'local' | 'remote' | 'merge' = 'remote'
  ): T => {
    switch (strategy) {
      case 'local':
        return local
      case 'remote':
        return remote
      case 'merge':
        // 智能合并策略：保留最新的字段
        const merged = { ...remote }
        for (const [key, value] of Object.entries(local)) {
          if (key.startsWith('_')) continue // 跳过元数据字段

          const localTime = new Date(local._lastModified || 0)
          const remoteTime = new Date(remote._lastModified || 0)

          if (localTime > remoteTime) {
            ;(merged as any)[key] = value
          }
        }
        merged._version = Math.max(local._version || 0, remote._version || 0) + 1
        return merged
      default:
        return remote
    }
  }

  /**
   * WebSocket实时连接
   */
  const connectWebSocket = () => {
    if (!opts.websocketUrl || ws?.readyState === WebSocket.OPEN) {
      return
    }

    try {
      ws = new WebSocket(opts.websocketUrl)

      ws.onopen = () => {
        state.connected = true
        console.log(`WebSocket connected for ${dataKey}`)

        // 清除重连定时器
        if (reconnectTimer) {
          clearTimeout(reconnectTimer)
          reconnectTimer = null
        }
      }

      ws.onmessage = event => {
        try {
          const message = JSON.parse(event.data)
          handleRealtimeMessage(message)
        } catch (error) {
          console.error('WebSocket message parse error:', error)
        }
      }

      ws.onclose = () => {
        state.connected = false
        console.log(`WebSocket disconnected for ${dataKey}`)

        // 自动重连
        reconnectTimer = setTimeout(() => {
          connectWebSocket()
        }, opts.reconnectInterval)
      }

      ws.onerror = error => {
        console.error(`WebSocket error for ${dataKey}:`, error)
      }
    } catch (error) {
      console.error('WebSocket connection failed:', error)
    }
  }

  /**
   * 处理实时消息
   */
  const handleRealtimeMessage = (message: WebSocketMessage) => {
    const { type, data, id } = message

    switch (type) {
      case 'update':
        if (id !== undefined) {
          handleRealtimeUpdate(id, data)
        }
        break
      case 'create':
        if (data) {
          handleRealtimeCreate(data)
        }
        break
      case 'delete':
        if (id !== undefined) {
          handleRealtimeDelete(id)
        }
        break
      case 'batch':
        if (data) {
          handleRealtimeBatch(data)
        }
        break
      default:
        console.warn('Unknown realtime message type:', type)
    }
  }

  const handleRealtimeUpdate = (id: string | number, updates: Partial<T>) => {
    const index = state.items.findIndex(item => item.id === id)
    if (index !== -1) {
      const current = state.items[index]
      const updated = mergeDataChanges(current, updates)

      // 检查冲突
      if (detectConflicts(current, updated)) {
        state.conflicts.push({ local: current, remote: updated })
        return
      }

      state.items[index] = updated
      setCached(id, updated)
    }
  }

  const handleRealtimeCreate = (data: T) => {
    const exists = state.items.find(item => item.id === data.id)
    if (!exists) {
      state.items.push(data)
      setCached(data.id, data)
    }
  }

  const handleRealtimeDelete = (id: string | number) => {
    const index = state.items.findIndex(item => item.id === id)
    if (index !== -1) {
      state.items.splice(index, 1)
      clearCache(id)
    }
  }

  const handleRealtimeBatch = (operations: RealtimeBatchOperation[]) => {
    operations.forEach(op => {
      switch (op.type) {
        case 'update':
          if (op.data) {
            handleRealtimeUpdate(op.id, op.data)
          }
          break
        case 'create':
          if (op.data) {
            handleRealtimeCreate(op.data)
          }
          break
        case 'delete':
          handleRealtimeDelete(op.id)
          break
      }
    })
  }

  /**
   * 公共API方法
   */
  const queueUpdate = (id: string | number, type: UpdateOperation['type'], data?: Partial<T>) => {
    const operation: UpdateOperation = {
      id,
      type,
      data,
      timestamp: Date.now(),
      optimistic: opts.optimisticUpdates
    }

    updateQueue.set(id, operation)

    // 防抖批量处理
    debouncedUpdate('batch_process', processBatchUpdates, opts.debounceDelay)
  }

  const updateItem = async (id: string | number, updates: Partial<T>) => {
    return optimisticUpdate(id, updates, async () => {
      queueUpdate(id, 'update', updates)
      // 这里需要返回实际的API调用结果
      const current = state.items.find(item => item.id === id)!
      return mergeDataChanges(current as T, updates)
    })
  }

  const createItem = async (data: Omit<T, 'id'>) => {
    const newItem = {
      ...data,
      id: `temp_${Date.now()}`, // 临时ID，实际创建后会替换
      _version: 1,
      _lastModified: new Date().toISOString()
    } as T

    // 乐观创建
    if (opts.optimisticUpdates) {
      state.items.push(newItem)
      setCached(newItem.id, newItem)
    }

    queueUpdate(newItem.id, 'create', newItem)
    return newItem
  }

  const deleteItem = async (id: string | number) => {
    // 乐观删除
    if (opts.optimisticUpdates) {
      const index = state.items.findIndex(item => item.id === id)
      if (index !== -1) {
        state.items.splice(index, 1)
        clearCache(id)
      }
    }

    queueUpdate(id, 'delete')
  }

  const refreshData = async () => {
    clearCache()
    // 这里需要实现实际的数据刷新逻辑
    state.lastSync = new Date()
  }

  const forceSync = async () => {
    await processBatchUpdates()
  }

  // 清理函数
  const cleanup = () => {
    // 清理所有定时器
    debounceTimers.forEach(timer => clearTimeout(timer))
    debounceTimers.clear()

    if (batchTimer) {
      clearTimeout(batchTimer)
    }

    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
    }

    // 关闭WebSocket连接
    if (ws) {
      ws.close()
      ws = null
    }

    // 清理缓存
    cache.clear()
    updateQueue.clear()
  }

  // 生命周期
  onMounted(() => {
    if (opts.websocketUrl) {
      connectWebSocket()
    }
  })

  onUnmounted(() => {
    cleanup()
  })

  // 计算属性
  const hasPendingUpdates = computed(() => updateQueue.size > 0)
  const hasConflicts = computed(() => state.conflicts.length > 0)
  const isOnline = computed(() => state.connected || !opts.websocketUrl)

  return {
    // 状态
    state,

    // 计算属性
    hasPendingUpdates,
    hasConflicts,
    isOnline,

    // 核心方法
    updateItem,
    createItem,
    deleteItem,
    refreshData,
    forceSync,

    // 缓存管理
    getCached,
    setCached,
    clearCache,

    // 冲突解决
    resolveConflict: (index: number, strategy: 'local' | 'remote' | 'merge' = 'remote') => {
      if (index >= 0 && index < state.conflicts.length) {
        const conflict = state.conflicts[index]
        const resolved = resolveConflict(conflict.local, conflict.remote, strategy)

        // 更新数据
        const itemIndex = state.items.findIndex(item => item.id === resolved.id)
        if (itemIndex !== -1) {
          state.items[itemIndex] = resolved
          setCached(resolved.id, resolved)
        }

        // 移除冲突
        state.conflicts.splice(index, 1)

        return resolved
      }
    },

    // WebSocket控制
    connect: connectWebSocket,
    disconnect: () => {
      if (ws) {
        ws.close()
        ws = null
      }
      state.connected = false
    },

    // 工具方法
    debouncedUpdate,
    cleanup
  }
}

/**
 * 预定义的实时更新配置
 */
export const realtimeUpdatePresets = {
  // 高频更新（如实时聊天）
  highFrequency: {
    debounceDelay: 100,
    cacheExpiry: 1 * 60 * 1000, // 1分钟
    batchSize: 5,
    optimisticUpdates: true
  },

  // 标准更新（如数据表格）
  standard: {
    debounceDelay: 300,
    cacheExpiry: 5 * 60 * 1000, // 5分钟
    batchSize: 10,
    optimisticUpdates: true
  },

  // 低频更新（如系统设置）
  lowFrequency: {
    debounceDelay: 1000,
    cacheExpiry: 15 * 60 * 1000, // 15分钟
    batchSize: 20,
    optimisticUpdates: false
  },

  // 移动端优化
  mobile: {
    debounceDelay: 500,
    cacheExpiry: 3 * 60 * 1000, // 3分钟
    batchSize: 5,
    optimisticUpdates: true
  }
} as const

export type RealtimeUpdatePreset = keyof typeof realtimeUpdatePresets
