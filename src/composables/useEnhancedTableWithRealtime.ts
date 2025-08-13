import { computed, ref, watch } from 'vue'
import {
  type TableItem,
  type VirtualScrollingConfig,
  useTableEnhancements
} from './useTableEnhancements'
import {
  type DataItem,
  type RealTimeUpdateOptions,
  realtimeUpdatePresets,
  useRealTimeUpdates
} from './useRealTimeUpdates'

/**
 * 增强表格与实时更新集成功能组合式API
 *
 * 功能说明：
 * - 将实时更新功能无缝集成到现有的表格增强系统中
 * - 支持虚拟滚动表格的实时数据同步
 * - 提供智能缓存和冲突解决机制
 * - 统一管理表格状态和实时数据状态
 * - 优化性能，减少不必要的重新渲染
 *
 * 应用场景：
 * - 客户管理表格的实时状态更新
 * - 产品库存的实时数量变化
 * - 报价审批流程的实时进度更新
 * - 多用户协作场景下的数据同步
 * - 系统监控面板的实时数据展示
 *
 * 性能特性：
 * - 智能增量更新：只更新变化的行
 * - 防抖合并：避免频繁的UI重新渲染
 * - 虚拟滚动兼容：与虚拟滚动无缝协作
 * - 内存优化：自动清理过期缓存
 * - 冲突处理：优雅处理并发更新冲突
 *
 * @author Terminal 3 (Admin Frontend Team)
 */

export interface EnhancedTableRealtimeOptions<T extends TableItem & DataItem> {
  /** 表格数据唯一标识 */
  dataKey: string

  /** 实时更新配置 */
  realtimeOptions?: Partial<RealTimeUpdateOptions>

  /** 虚拟滚动配置 */
  virtualConfig?: VirtualScrollingConfig<T>

  /** 数据加载函数 */
  loadData: (
    page: number,
    pageSize: number,
    filters?: Record<string, any>,
    sort?: { by: string; order: 'asc' | 'desc' }
  ) => Promise<{
    items: T[]
    total: number
    hasMore: boolean
  }>

  /** 数据更新函数 */
  updateData?: (id: string | number, updates: Partial<T>) => Promise<T>

  /** 数据创建函数 */
  createData?: (data: Omit<T, 'id'>) => Promise<T>

  /** 数据删除函数 */
  deleteData?: (id: string | number) => Promise<void>

  /** 批量操作函数 */
  batchOperations?: {
    update?: (ids: Array<string | number>, updates: Partial<T>) => Promise<T[]>
    delete?: (ids: Array<string | number>) => Promise<void>
    create?: (items: Array<Omit<T, 'id'>>) => Promise<T[]>
  }

  /** 实时更新预设 */
  realtimePreset?: keyof typeof realtimeUpdatePresets

  /** 是否启用冲突检测 */
  enableConflictDetection?: boolean

  /** 冲突解决策略 */
  conflictResolutionStrategy?: 'local' | 'remote' | 'merge' | 'prompt'
}

/**
 * 增强表格与实时更新的集成管理
 */
export function useEnhancedTableWithRealtime<T extends TableItem & DataItem>(
  options: EnhancedTableRealtimeOptions<T>
) {
  // 获取预设配置
  const realtimeConfig = options.realtimePreset
    ? { ...realtimeUpdatePresets[options.realtimePreset], ...options.realtimeOptions }
    : options.realtimeOptions || {}

  // 初始化表格增强功能
  const tableEnhancements = useTableEnhancements<T>({ pageSize: 20 }, options.virtualConfig)

  // 初始化实时更新功能
  const realtimeUpdates = useRealTimeUpdates<T>(options.dataKey, realtimeConfig)

  // 同步标志，防止循环更新
  const syncingFromRealtime = ref(false)
  const syncingToRealtime = ref(false)

  /**
   * 数据同步：实时更新 -> 表格状态
   */
  const syncRealtimeToTable = () => {
    if (syncingToRealtime.value) return

    syncingFromRealtime.value = true

    try {
      // 同步基础数据
      if (realtimeUpdates.state.items.length > 0) {
        if (options.virtualConfig?.enabled) {
          // 虚拟滚动模式：通过虚拟滚动系统更新
          tableEnhancements.virtualScrolling?.refresh()
        } else {
          // 传统模式：直接更新表格状态
          // Note: setData is available through the spread tableState in traditional mode
          if ('setData' in tableEnhancements) {
            (tableEnhancements as any).setData(realtimeUpdates.state.items, realtimeUpdates.state.items.length)
          }
        }
      }

      // 同步加载状态
      if (realtimeUpdates.state.syncing !== tableEnhancements.state.loading) {
        tableEnhancements.setLoading(realtimeUpdates.state.syncing)
      }
    } finally {
      syncingFromRealtime.value = false
    }
  }

  /**
   * 数据同步：表格操作 -> 实时更新
   */
  const syncTableToRealtime = async (
    operation: 'create' | 'update' | 'delete',
    id: string | number,
    data?: Partial<T>
  ) => {
    if (syncingFromRealtime.value) return

    syncingToRealtime.value = true

    try {
      switch (operation) {
        case 'create':
          if (data && options.createData) {
            await realtimeUpdates.createItem(data as Omit<T, 'id'>)
          }
          break

        case 'update':
          if (data && options.updateData) {
            await realtimeUpdates.updateItem(id, data)
          }
          break

        case 'delete':
          if (options.deleteData) {
            await realtimeUpdates.deleteItem(id)
          }
          break
      }
    } finally {
      syncingToRealtime.value = false
    }
  }

  /**
   * 集成的数据加载函数
   */
  const enhancedLoadData = async (
    page: number,
    pageSize: number,
    filters?: Record<string, any>,
    sort?: { by: string; order: 'asc' | 'desc' }
  ) => {
    // 首先尝试从缓存获取
    const cacheKey = `${options.dataKey}_page_${page}_${JSON.stringify({ pageSize, filters, sort })}`
    const cached = realtimeUpdates.getCached(cacheKey as any)

    if (cached) {
      return {
        items: [cached] as T[], // 缓存是单个项目，这里需要调整逻辑
        total: 1, // Cached single item count
        hasMore: true
      }
    }

    // 调用原始加载函数
    const result = await options.loadData(page, pageSize, filters, sort)

    // 缓存结果
    result.items.forEach(item => {
      realtimeUpdates.setCached(item.id, item)
    })

    return result
  }

  /**
   * 冲突处理UI组件数据
   */
  const conflictResolutionData = computed(() => {
    return realtimeUpdates.state.conflicts.map((conflict, index) => ({
      index,
      local: conflict.local,
      remote: conflict.remote,
      canResolve: true
    }))
  })

  /**
   * 解决数据冲突
   */
  const resolveConflict = async (
    index: number,
    strategy: 'local' | 'remote' | 'merge' = 'remote'
  ) => {
    if (!options.enableConflictDetection) return

    const resolved = realtimeUpdates.resolveConflict?.(index, strategy)
    if (resolved) {
      // 更新表格数据
      syncRealtimeToTable()
    }

    return resolved
  }

  /**
   * 批量操作增强
   */
  const enhancedBatchOperations = {
    async update(ids: Array<string | number>, updates: Partial<T>) {
      if (options.batchOperations?.update) {
        const results = await options.batchOperations.update(ids, updates)

        // 更新实时数据
        for (const result of results) {
          await realtimeUpdates.updateItem(result.id, result)
        }

        return results
      }

      // 回退到单个更新
      const results: T[] = []
      for (const id of ids) {
        const result = await realtimeUpdates.updateItem(id, updates)
        results.push(result as T)
      }

      return results
    },

    async delete(ids: Array<string | number>) {
      if (options.batchOperations?.delete) {
        await options.batchOperations.delete(ids)

        // 更新实时数据
        for (const id of ids) {
          await realtimeUpdates.deleteItem(id)
        }
      } else {
        // 回退到单个删除
        for (const id of ids) {
          await realtimeUpdates.deleteItem(id)
        }
      }
    },

    async create(items: Array<Omit<T, 'id'>>) {
      if (options.batchOperations?.create) {
        const results = await options.batchOperations.create(items)

        // 更新实时数据
        for (const result of results) {
          realtimeUpdates.setCached(result.id, result)
        }

        return results
      }

      // 回退到单个创建
      const results: T[] = []
      for (const item of items) {
        const result = await realtimeUpdates.createItem(item)
        results.push(result as T)
      }

      return results
    }
  }

  /**
   * 智能刷新：只在必要时刷新数据
   */
  const smartRefresh = async (force = false) => {
    if (!force && !realtimeUpdates.hasPendingUpdates.value) {
      return // 没有待更新数据，跳过刷新
    }

    // 强制同步待处理的更新
    await realtimeUpdates.forceSync()

    // 刷新表格数据
    if (options.virtualConfig?.enabled) {
      tableEnhancements.virtualScrolling?.refresh()
    } else {
      await tableEnhancements.refresh()
    }
  }

  // 监听实时数据变化，同步到表格
  watch(
    () => [
      realtimeUpdates.state.items.length,
      realtimeUpdates.state.syncing,
      realtimeUpdates.state.lastSync
    ],
    () => {
      syncRealtimeToTable()
    },
    { deep: true }
  )

  // 监听表格筛选和排序变化，更新实时数据加载参数
  watch(
    () => [
      tableEnhancements.state.filters,
      tableEnhancements.state.sortBy,
      tableEnhancements.state.sortOrder
    ],
    () => {
      // 重新加载数据以应用新的筛选和排序
      smartRefresh(true)
    },
    { deep: true }
  )

  /**
   * 集成的表格操作方法
   */
  const createItem = async (data: Omit<T, 'id'>) => {
    const result = await realtimeUpdates.createItem(data)
    syncRealtimeToTable()
    return result
  }

  const updateItem = async (id: string | number, updates: Partial<T>) => {
    const result = await realtimeUpdates.updateItem(id, updates)
    syncRealtimeToTable()
    return result
  }

  const deleteItem = async (id: string | number) => {
    await realtimeUpdates.deleteItem(id)
    syncRealtimeToTable()
  }

  return {
    // 表格增强功能
    ...tableEnhancements,

    // 实时更新状态
    realtimeState: realtimeUpdates.state,
    isOnline: realtimeUpdates.isOnline,
    hasPendingUpdates: realtimeUpdates.hasPendingUpdates,
    hasConflicts: realtimeUpdates.hasConflicts,

    // 增强的数据操作
    createItem,
    updateItem,
    deleteItem,
    smartRefresh,

    // 批量操作
    batchOperations: enhancedBatchOperations,

    // 冲突解决
    conflicts: conflictResolutionData,
    resolveConflict,

    // 实时连接控制
    connect: realtimeUpdates.connect,
    disconnect: realtimeUpdates.disconnect,

    // 缓存管理
    clearCache: realtimeUpdates.clearCache,

    // 工具方法
    forceSync: realtimeUpdates.forceSync,

    // 增强的数据加载（带缓存）
    loadData: enhancedLoadData,

    // 状态指示器
    syncing: computed(() => syncingFromRealtime.value || syncingToRealtime.value),

    // 健康检查
    healthCheck: computed(() => ({
      tableReady: !tableEnhancements.state.loading,
      realtimeConnected: realtimeUpdates.isOnline.value,
      cachingActive: true,
      conflictsCount: realtimeUpdates.state.conflicts.length,
      pendingUpdates: realtimeUpdates.hasPendingUpdates.value
    }))
  }
}

/**
 * 预定义的集成配置
 */
export const enhancedTablePresets = {
  // 客户管理场景
  customerManagement: {
    realtimePreset: 'standard' as const,
    enableConflictDetection: true,
    conflictResolutionStrategy: 'prompt' as const
  },

  // 产品管理场景
  productManagement: {
    realtimePreset: 'standard' as const,
    enableConflictDetection: true,
    conflictResolutionStrategy: 'merge' as const
  },

  // 报价管理场景（需要更快的实时更新）
  quoteManagement: {
    realtimePreset: 'highFrequency' as const,
    enableConflictDetection: true,
    conflictResolutionStrategy: 'remote' as const
  },

  // 监控面板场景
  monitoring: {
    realtimePreset: 'highFrequency' as const,
    enableConflictDetection: false,
    conflictResolutionStrategy: 'remote' as const
  },

  // 移动端场景
  mobile: {
    realtimePreset: 'mobile' as const,
    enableConflictDetection: true,
    conflictResolutionStrategy: 'prompt' as const
  }
} as const

export type EnhancedTablePreset = keyof typeof enhancedTablePresets
