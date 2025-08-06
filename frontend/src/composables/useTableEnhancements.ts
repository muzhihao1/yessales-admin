import { ref, computed, reactive, type Ref } from 'vue'
import { showModal, showToast } from '@/utils/ui'
import { useVirtualScrolling, type VirtualScrollPreset, type VirtualScrollItem } from './useVirtualScrolling'

/**
 * 增强数据表格功能组合式API
 * 
 * 功能说明：
 * - 提供表格行选择和批量操作功能
 * - 管理表格加载状态和错误处理
 * - 提供排序、筛选和分页支持
 * - 统一的批量操作确认和进度显示
 * - 响应式数据状态管理
 * 
 * 使用场景：
 * - 客户管理表格
 * - 产品管理表格  
 * - 报价记录表格
 * - 任何需要增强交互的数据表格
 * 
 * @author Terminal 3 (Admin Frontend Team)
 */

export interface TableItem {
  id: string
  [key: string]: any
}

export interface TableColumn {
  key: string
  label: string
  sortable?: boolean
  width?: string
  align?: 'left' | 'center' | 'right'
}

export interface BatchOperation {
  key: string
  label: string
  icon?: string
  type?: 'default' | 'danger' | 'warning'
  confirmMessage?: string
  requiresConfirmation?: boolean
}

export interface TableState {
  items: TableItem[]
  loading: boolean
  error: string | null
  total: number
  currentPage: number
  pageSize: number
  sortBy: string | null
  sortOrder: 'asc' | 'desc'
  filters: Record<string, any>
}

export interface VirtualScrollingConfig {
  enabled: boolean
  preset?: VirtualScrollPreset
  itemHeight?: number
  containerHeight?: number
  overscan?: number
  threshold?: number
  loadData: (page: number, pageSize: number, filters?: Record<string, any>, sort?: { by: string, order: 'asc' | 'desc' }) => Promise<{
    items: TableItem[]
    total: number
    hasMore: boolean
  }>
}

/**
 * 表格选择功能
 */
export function useTableSelection() {
  const selectedIds = ref<Set<string>>(new Set())
  const selectAll = ref(false)
  const indeterminate = ref(false)

  // 选择的项目数量
  const selectedCount = computed(() => selectedIds.value.size)

  // 是否有选择项
  const hasSelection = computed(() => selectedCount.value > 0)

  // 检查项目是否被选中
  const isSelected = (id: string) => selectedIds.value.has(id)

  // 切换单项选择
  const toggleSelection = (id: string) => {
    if (selectedIds.value.has(id)) {
      selectedIds.value.delete(id)
    } else {
      selectedIds.value.add(id)
    }
    
    updateSelectAllState()
  }

  // 切换全选
  const toggleSelectAll = (items: TableItem[]) => {
    if (selectAll.value) {
      selectedIds.value.clear()
    } else {
      items.forEach(item => selectedIds.value.add(item.id))
    }
    
    updateSelectAllState()
  }

  // 清空选择
  const clearSelection = () => {
    selectedIds.value.clear()
    updateSelectAllState()
  }

  // 更新全选状态
  const updateSelectAllState = () => {
    const count = selectedIds.value.size
    selectAll.value = count > 0 && indeterminate.value === false
    indeterminate.value = count > 0 && !selectAll.value
  }

  // 根据总数更新全选状态
  const updateSelectAllStateWithTotal = (totalItems: number) => {
    const count = selectedIds.value.size
    if (count === 0) {
      selectAll.value = false
      indeterminate.value = false
    } else if (count === totalItems) {
      selectAll.value = true
      indeterminate.value = false
    } else {
      selectAll.value = false
      indeterminate.value = true
    }
  }

  // 获取选中的项目
  const getSelectedItems = (items: TableItem[]) => {
    return items.filter(item => selectedIds.value.has(item.id))
  }

  return {
    selectedIds: computed(() => Array.from(selectedIds.value)),
    selectedCount,
    hasSelection,
    selectAll,
    indeterminate,
    isSelected,
    toggleSelection,
    toggleSelectAll,
    clearSelection,
    updateSelectAllStateWithTotal,
    getSelectedItems
  }
}

/**
 * 批量操作功能
 */
export function useBatchOperations() {
  const loading = ref(false)
  const progress = ref(0)

  // 执行批量操作
  const executeBatchOperation = async <T extends TableItem>(
    operation: BatchOperation,
    selectedItems: T[],
    operationHandler: (items: T[]) => Promise<void>,
    options?: {
      showProgress?: boolean
      onProgress?: (completed: number, total: number) => void
    }
  ) => {
    // 确认操作
    if (operation.requiresConfirmation !== false) {
      const message = operation.confirmMessage || 
        `确定要对选中的 ${selectedItems.length} 个项目执行"${operation.label}"操作吗？`
      
      const result = await showModal({
        title: '确认批量操作',
        content: message,
        showCancel: true
      })

      if (!result.confirm) {
        return false
      }
    }

    try {
      loading.value = true
      progress.value = 0

      if (options?.showProgress) {
        // 分批处理以显示进度
        const batchSize = Math.ceil(selectedItems.length / 10) || 1
        const batches = []
        
        for (let i = 0; i < selectedItems.length; i += batchSize) {
          batches.push(selectedItems.slice(i, i + batchSize))
        }

        for (let i = 0; i < batches.length; i++) {
          await operationHandler(batches[i])
          progress.value = Math.round(((i + 1) / batches.length) * 100)
          options.onProgress?.(i + 1, batches.length)
        }
      } else {
        // 一次性处理所有项目
        await operationHandler(selectedItems)
        progress.value = 100
      }

      showToast(`成功${operation.label} ${selectedItems.length} 个项目`)
      return true
    } catch (error) {
      console.error('批量操作失败:', error)
      showToast(`${operation.label}操作失败`, 'error')
      return false
    } finally {
      loading.value = false
      progress.value = 0
    }
  }

  return {
    loading,
    progress,
    executeBatchOperation
  }
}

/**
 * 表格状态管理
 */
export function useTableState(initialState?: Partial<TableState>) {
  const state = reactive<TableState>({
    items: [],
    loading: false,
    error: null,
    total: 0,
    currentPage: 1,
    pageSize: 20,
    sortBy: null,
    sortOrder: 'asc',
    filters: {},
    ...initialState
  })

  // 设置加载状态
  const setLoading = (loading: boolean) => {
    state.loading = loading
    if (loading) {
      state.error = null
    }
  }

  // 设置错误状态
  const setError = (error: string | null) => {
    state.error = error
    state.loading = false
  }

  // 设置数据
  const setData = (items: TableItem[], total?: number) => {
    state.items = items
    state.total = total ?? items.length
    state.loading = false
    state.error = null
  }

  // 更新排序
  const updateSort = (sortBy: string) => {
    if (state.sortBy === sortBy) {
      state.sortOrder = state.sortOrder === 'asc' ? 'desc' : 'asc'
    } else {
      state.sortBy = sortBy
      state.sortOrder = 'asc'
    }
  }

  // 更新筛选
  const updateFilters = (filters: Record<string, any>) => {
    state.filters = { ...state.filters, ...filters }
    state.currentPage = 1 // 筛选时重置到第一页
  }

  // 清空筛选
  const clearFilters = () => {
    state.filters = {}
    state.currentPage = 1
  }

  // 更新分页
  const updatePage = (page: number) => {
    state.currentPage = page
  }

  // 更新每页数量
  const updatePageSize = (pageSize: number) => {
    state.pageSize = pageSize
    state.currentPage = 1
  }

  // 刷新数据
  const refresh = () => {
    // 这个方法通常由使用者实现具体的数据获取逻辑
  }

  // 计算属性
  const hasData = computed(() => state.items.length > 0)
  const isEmpty = computed(() => !state.loading && state.items.length === 0)
  const totalPages = computed(() => Math.ceil(state.total / state.pageSize))
  const hasMore = computed(() => state.currentPage < totalPages.value)

  return {
    state,
    setLoading,
    setError, 
    setData,
    updateSort,
    updateFilters,
    clearFilters,
    updatePage,
    updatePageSize,
    refresh,
    hasData,
    isEmpty,
    totalPages,
    hasMore
  }
}

/**
 * 虚拟滚动表格增强功能
 */
export function useVirtualTableEnhancements<T extends TableItem & VirtualScrollItem>(
  virtualConfig: VirtualScrollingConfig,
  initialState?: Partial<TableState>
) {
  const selection = useTableSelection()
  const batchOps = useBatchOperations()
  const tableState = useTableState(initialState)

  // 创建数据加载函数，集成筛选和排序
  const loadDataWithFiltersAndSort = async (page: number, pageSize: number) => {
    const sort = tableState.state.sortBy ? {
      by: tableState.state.sortBy,
      order: tableState.state.sortOrder
    } : undefined

    return await virtualConfig.loadData(page, pageSize, tableState.state.filters, sort)
  }

  // 使用虚拟滚动
  const virtualScrolling = useVirtualScrolling<T>(
    loadDataWithFiltersAndSort,
    {
      preset: virtualConfig.preset,
      itemHeight: virtualConfig.itemHeight,
      containerHeight: virtualConfig.containerHeight,
      overscan: virtualConfig.overscan,
      threshold: virtualConfig.threshold,
      pageSize: initialState?.pageSize || tableState.state.pageSize
    }
  )

  // 同步虚拟滚动数据到表格状态
  const syncedItems = computed(() => virtualScrolling.state.items as T[])
  const syncedTotal = computed(() => virtualScrolling.state.total)
  const syncedLoading = computed(() => virtualScrolling.state.loading)
  const syncedError = computed(() => virtualScrolling.state.error)

  // 重写排序方法以支持虚拟滚动
  const updateSort = (sortBy: string) => {
    tableState.updateSort(sortBy)
    // 虚拟滚动需要重新加载数据
    virtualScrolling.refresh()
  }

  // 重写筛选方法以支持虚拟滚动
  const updateFilters = (filters: Record<string, any>) => {
    tableState.updateFilters(filters)
    // 虚拟滚动需要重新加载数据
    virtualScrolling.refresh()
  }

  // 重写清空筛选方法
  const clearFilters = () => {
    tableState.clearFilters()
    virtualScrolling.refresh()
  }

  return {
    // 选择功能
    ...selection,
    
    // 批量操作功能
    ...batchOps,
    
    // 表格状态管理（部分重写以支持虚拟滚动）
    state: {
      ...tableState.state,
      items: syncedItems.value,
      total: syncedTotal.value,
      loading: syncedLoading.value,
      error: syncedError.value
    },
    setLoading: tableState.setLoading,
    setError: tableState.setError,
    updateSort,
    updateFilters,
    clearFilters,
    updatePage: tableState.updatePage, // 虚拟滚动中页码概念较弱，但保留兼容性
    updatePageSize: (pageSize: number) => {
      tableState.updatePageSize(pageSize)
      // 虚拟滚动需要重新配置
      virtualScrolling.refresh()
    },
    refresh: virtualScrolling.refresh,
    hasData: virtualScrolling.hasData,
    isEmpty: virtualScrolling.isEmpty,
    totalPages: tableState.totalPages,
    hasMore: virtualScrolling.hasMore,

    // 虚拟滚动特有功能
    virtualScrolling,
    visibleItems: virtualScrolling.visibleItems,
    scrollToItem: virtualScrolling.scrollToItem,
    scrollToIndex: (index: number) => {
      if (virtualScrolling.state.items[index]) {
        virtualScrolling.scrollToItem(virtualScrolling.state.items[index].id)
      }
    },

    // 便捷方法：处理数据变化时的选择状态更新
    onDataChange: (items: T[]) => {
      selection.updateSelectAllStateWithTotal(items.length)
    },

    // 便捷方法：清空选择并刷新数据
    refreshWithClearSelection: () => {
      selection.clearSelection()
      virtualScrolling.refresh()
    },

    // 虚拟滚动特有方法：处理可见项变化
    onVisibleItemsChange: () => {
      // 当可见项变化时，更新选择状态
      selection.updateSelectAllStateWithTotal(syncedItems.value.length)
    }
  }
}

/**
 * 综合表格增强功能（传统模式）
 */
export function useTableEnhancements<T extends TableItem>(
  initialState?: Partial<TableState>,
  virtualConfig?: VirtualScrollingConfig
) {
  // 如果启用虚拟滚动，使用虚拟滚动版本
  if (virtualConfig?.enabled) {
    return useVirtualTableEnhancements<T & VirtualScrollItem>(virtualConfig, initialState)
  }

  // 传统表格模式
  const selection = useTableSelection()
  const batchOps = useBatchOperations()
  const tableState = useTableState(initialState)

  // 组合所有功能
  return {
    // 选择功能
    ...selection,
    
    // 批量操作功能
    ...batchOps,
    
    // 表格状态管理
    ...tableState,

    // 便捷方法：处理数据变化时的选择状态更新
    onDataChange: (items: T[]) => {
      selection.updateSelectAllStateWithTotal(items.length)
    },

    // 便捷方法：清空选择并刷新数据
    refreshWithClearSelection: () => {
      selection.clearSelection()
      tableState.refresh()
    },

    // 虚拟滚动占位方法（保持API一致性）
    virtualScrolling: null,
    visibleItems: computed(() => []),
    scrollToItem: () => {},
    scrollToIndex: () => {},
    onVisibleItemsChange: () => {}
  }
}

// 预定义的常用批量操作
export const commonBatchOperations: Record<string, BatchOperation> = {
  delete: {
    key: 'delete',
    label: '批量删除',
    icon: 'delete',
    type: 'danger',
    confirmMessage: '确定要删除选中的项目吗？此操作不可撤销。',
    requiresConfirmation: true
  },
  export: {
    key: 'export',
    label: '批量导出',
    icon: 'download',
    type: 'default',
    requiresConfirmation: false
  },
  enable: {
    key: 'enable',
    label: '批量启用',
    icon: 'check',
    type: 'default',
    requiresConfirmation: false
  },
  disable: {
    key: 'disable',
    label: '批量禁用',
    icon: 'close',
    type: 'warning',
    confirmMessage: '确定要禁用选中的项目吗？',
    requiresConfirmation: true
  }
}