<template>
  <view class="realtime-customer-management">
    <AdminLayout>
      <!-- 页面标题和状态指示器 -->
      <view class="page-header">
        <view class="header-left">
          <text class="page-title">客户管理 - 实时更新演示</text>
          <text class="page-subtitle">展示实时数据同步和冲突解决功能</text>
        </view>
        <view class="header-right">
          <view class="connection-status" :class="{ online: isOnline, offline: !isOnline }">
            <view class="status-indicator"></view>
            <text class="status-text">{{ isOnline ? '实时连接' : '离线模式' }}</text>
          </view>
          <button class="admin-btn admin-btn-secondary" @click="handleManualSync">
            {{ syncing ? '同步中...' : '手动同步' }}
          </button>
          <button class="admin-btn admin-btn-primary" @click="handleCreateCustomer">
            <text>+ 新增客户</text>
          </button>
        </view>
      </view>

      <!-- 实时状态面板 -->
      <view class="realtime-status-panel admin-card">
        <view class="status-grid">
          <view class="status-item">
            <text class="status-label">连接状态:</text>
            <text class="status-value" :class="isOnline ? 'online' : 'offline'">
              {{ isOnline ? '在线' : '离线' }}
            </text>
          </view>
          <view class="status-item">
            <text class="status-label">待同步:</text>
            <text class="status-value">{{ hasPendingUpdates ? '有更新' : '已同步' }}</text>
          </view>
          <view class="status-item">
            <text class="status-label">数据冲突:</text>
            <text class="status-value" :class="hasConflicts ? 'warning' : 'normal'">
              {{ conflicts.length }} 个冲突
            </text>
          </view>
          <view class="status-item">
            <text class="status-label">最后同步:</text>
            <text class="status-value">{{ lastSyncTime }}</text>
          </view>
        </view>

        <!-- 健康检查面板 -->
        <view class="health-check">
          <text class="health-title">系统健康状态</text>
          <view class="health-indicators">
            <view class="health-item" :class="{ healthy: healthCheck.tableReady }">
              <text class="indicator">{{ healthCheck.tableReady ? '✅' : '⚠️' }}</text>
              <text>表格就绪</text>
            </view>
            <view class="health-item" :class="{ healthy: healthCheck.realtimeConnected }">
              <text class="indicator">{{ healthCheck.realtimeConnected ? '✅' : '⚠️' }}</text>
              <text>实时连接</text>
            </view>
            <view class="health-item" :class="{ healthy: healthCheck.cachingActive }">
              <text class="indicator">{{ healthCheck.cachingActive ? '✅' : '⚠️' }}</text>
              <text>缓存活跃</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 冲突解决对话框 -->
      <view v-if="hasConflicts" class="conflict-resolution admin-card">
        <view class="conflict-header">
          <text class="conflict-title">检测到数据冲突</text>
          <text class="conflict-subtitle">请选择如何解决以下冲突</text>
        </view>

        <view v-for="(conflict, index) in conflicts" :key="index" class="conflict-item">
          <view class="conflict-info">
            <text class="conflict-id">客户 ID: {{ conflict.local.id }}</text>
            <text class="conflict-time"
              >冲突时间: {{ formatDate(conflict.local._lastModified) }}</text
            >
          </view>

          <view class="conflict-comparison">
            <view class="conflict-version local">
              <text class="version-label">本地版本</text>
              <view class="version-data">
                <text>姓名: {{ conflict.local.name }}</text>
                <text>电话: {{ conflict.local.phone }}</text>
                <text>状态: {{ conflict.local.status }}</text>
              </view>
            </view>

            <view class="conflict-version remote">
              <text class="version-label">远程版本</text>
              <view class="version-data">
                <text>姓名: {{ conflict.remote.name }}</text>
                <text>电话: {{ conflict.remote.phone }}</text>
                <text>状态: {{ conflict.remote.status }}</text>
              </view>
            </view>
          </view>

          <view class="conflict-actions">
            <button class="conflict-btn local-btn" @click="handleResolveConflict(index, 'local')">
              使用本地版本
            </button>
            <button class="conflict-btn remote-btn" @click="handleResolveConflict(index, 'remote')">
              使用远程版本
            </button>
            <button class="conflict-btn merge-btn" @click="handleResolveConflict(index, 'merge')">
              智能合并
            </button>
          </view>
        </view>
      </view>

      <!-- 搜索和筛选 -->
      <view class="filter-section admin-card">
        <view class="filter-row">
          <view class="filter-item filter-search">
            <input
              v-model="searchKeyword"
              class="search-input"
              type="text"
              placeholder="搜索客户姓名、电话或公司"
              @confirm="handleSearch"
            />
            <button class="search-btn" @click="handleSearch">搜索</button>
          </view>

          <view class="filter-item">
            <picker
              mode="selector"
              :range="statusOptions"
              :value="statusIndex"
              @change="handleStatusChange"
            >
              <view class="filter-picker">
                <text>{{ selectedStatus || '全部状态' }}</text>
                <text class="picker-arrow">▼</text>
              </view>
            </picker>
          </view>

          <button class="filter-reset" @click="handleReset">重置</button>
        </view>
      </view>

      <!-- 虚拟滚动表格 -->
      <view class="customer-table admin-card">
        <!-- Table Header -->
        <view class="table-header">
          <view class="header-row">
            <view v-if="selectedCount > 0" class="header-selector">
              <checkbox
                :checked="selectAll"
                :indeterminate="indeterminate"
                @change="handleSelectAll"
              />
            </view>
            <view
              v-for="column in tableColumns"
              :key="column.key"
              class="header-cell"
              :class="[`align-${column.align || 'left'}`, { sortable: column.sortable }]"
              :style="{ width: column.width, flex: column.flex }"
              @click="column.sortable && handleSort(column.key)"
            >
              <text class="header-title">{{ column.title }}</text>
              <text v-if="column.sortable" class="sort-icon">
                {{ getSortIcon(column.key) }}
              </text>
            </view>
          </view>
        </view>

        <!-- Virtual Table Container with Real-time Updates -->
        <VirtualTableContainer
          :load-data="loadRealtimeData"
          :columns="enhancedColumns"
          :actions="customerActions"
          :selectable="true"
          :is-selected="id => isSelected(id)"
          :preset="'default'"
          :container-height="600"
          :page-size="50"
          :touch-optimized="true"
          :show-debug-info="showDebugInfo"
          @select="handleRowSelect"
          @click="handleRowClick"
          @action="handleRowAction"
          @height-change="handleRowHeightChange"
          @error="handleVirtualError"
        >
          <!-- Custom customer avatar cell -->
          <template #cell-avatar="{ item }">
            <view class="customer-avatar">
              <image
                v-if="item.avatar_url"
                :src="item.avatar_url"
                mode="aspectFill"
                class="avatar-image"
              />
              <view v-else class="avatar-placeholder">
                {{ item.name ? item.name.charAt(0) : '?' }}
              </view>
            </view>
          </template>

          <!-- Custom customer info cell -->
          <template #cell-name="{ item }">
            <view class="customer-info">
              <text class="customer-name">{{ item.name }}</text>
              <text class="customer-company">{{ item.company || '个人客户' }}</text>
              <view v-if="item._lastModified" class="update-indicator">
                <text class="update-time">{{ formatRelativeTime(item._lastModified) }}</text>
                <view v-if="hasPendingUpdate(item.id)" class="pending-indicator">
                  <text>同步中...</text>
                </view>
              </view>
            </view>
          </template>

          <!-- Custom status cell with real-time updates -->
          <template #cell-status="{ item }">
            <view class="status-cell">
              <view class="status-tag" :class="`status-${getStatusType(item.status)}`">
                {{ getStatusLabel(item.status) }}
              </view>
              <view v-if="item._version" class="version-info">
                <text>v{{ item._version }}</text>
              </view>
            </view>
          </template>

          <!-- Empty state -->
          <template #empty>
            <view class="custom-empty-state">
              <text class="empty-icon">👥</text>
              <text class="empty-text">暂无客户数据</text>
              <text class="empty-subtitle">添加客户来开始管理您的客户关系</text>
              <button class="empty-action" @click="handleCreateCustomer">添加客户</button>
            </view>
          </template>
        </VirtualTableContainer>
      </view>

      <!-- Batch Operations Bar -->
      <BatchOperationBar
        :selected-count="selectedCount"
        :operations="batchOperations"
        :show-progress="batchOperating"
        :current-progress="batchProgress"
        :progress-text="batchProgressText"
        :select-all-checked="selectAll"
        :select-all-indeterminate="indeterminate"
        @operation="handleBatchOperation"
        @clear-selection="clearSelection"
        @select-all="handleSelectAll"
      />

      <!-- Real-time Activity Log -->
      <view v-if="showActivityLog" class="activity-log admin-card">
        <view class="log-header">
          <text class="log-title">实时活动日志</text>
          <button class="log-toggle" @click="showActivityLog = false">✕</button>
        </view>
        <view class="log-content">
          <view
            v-for="(activity, index) in realtimeActivities"
            :key="index"
            class="log-item"
            :class="`activity-${activity.type}`"
          >
            <text class="activity-time">{{ formatTime(activity.timestamp) }}</text>
            <text class="activity-message">{{ activity.message }}</text>
          </view>
        </view>
      </view>

      <!-- Floating Activity Log Toggle -->
      <button v-if="!showActivityLog" class="activity-log-btn" @click="showActivityLog = true">
        📊 活动日志 ({{ realtimeActivities.length }})
      </button>

      <!-- Debug Panel -->
      <view v-if="showDebugInfo" class="debug-panel admin-card">
        <view class="debug-header">
          <text class="debug-title">实时更新调试信息</text>
          <button class="debug-toggle" @click="showDebugInfo = false">✕</button>
        </view>
        <view class="debug-content">
          <view class="debug-section">
            <text class="debug-section-title">实时状态</text>
            <text>连接状态: {{ isOnline ? '在线' : '离线' }}</text>
            <text>待同步更新: {{ hasPendingUpdates ? '是' : '否' }}</text>
            <text>数据冲突数: {{ conflicts.length }}</text>
            <text>缓存项目数: {{ Object.keys(cacheStats).length }}</text>
          </view>
          <view class="debug-section">
            <text class="debug-section-title">表格状态</text>
            <text>选中项目: {{ selectedCount }}</text>
            <text>当前筛选: {{ JSON.stringify(filters) }}</text>
            <text>当前排序: {{ sortBy }} {{ sortOrder }}</text>
            <text>虚拟滚动: {{ virtualScrollingEnabled ? '启用' : '禁用' }}</text>
          </view>
        </view>
      </view>

      <!-- Floating Debug Toggle -->
      <button v-if="!showDebugInfo" class="debug-float-btn" @click="showDebugInfo = true">
        🐛
      </button>
    </AdminLayout>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import {
  enhancedTablePresets,
  useEnhancedTableWithRealtime
} from '@/composables/useEnhancedTableWithRealtime'
import { type DataItem } from '@/composables/useRealTimeUpdates'
import VirtualTableContainer from '@/components/admin/table/VirtualTableContainer.vue'
import BatchOperationBar from '@/components/admin/BatchOperationBar.vue'
import AdminLayout from '@/layouts/AdminLayout.vue'

/**
 * 客户管理实时更新演示页面
 *
 * 功能展示：
 * - 实时数据同步和更新
 * - 智能冲突检测和解决
 * - 防抖更新和批量处理
 * - 乐观更新和回滚机制
 * - 虚拟滚动与实时更新的完美结合
 * - 实时活动日志和调试信息
 *
 * @author Terminal 3 (Admin Frontend Team)
 */

interface Customer extends DataItem {
  name: string
  phone: string
  email: string
  company?: string
  status: 'active' | 'inactive' | 'pending' | 'blocked'
  avatar_url?: string
  last_contact?: string
  created_at: string
  tags?: string[]
}

// 响应式数据
const showDebugInfo = ref(false)
const showActivityLog = ref(false)
const searchKeyword = ref('')
const selectedStatus = ref('')
const statusIndex = ref(0)
const batchOperating = ref(false)
const batchProgress = ref(0)
const batchProgressText = ref('')

// 筛选状态
const filters = reactive({
  keyword: '',
  status: ''
})

// 排序状态
const sortBy = ref('created_at')
const sortOrder = ref<'asc' | 'desc'>('desc')

// 实时活动日志
const realtimeActivities = ref<
  Array<{
    type: 'create' | 'update' | 'delete' | 'sync' | 'conflict'
    message: string
    timestamp: Date
  }>
>([])

// 表格列配置
const tableColumns = [
  { key: 'avatar', title: '头像', width: '60px', align: 'center' as const },
  { key: 'name', title: '客户信息', flex: '2', sortable: true },
  { key: 'phone', title: '联系电话', width: '140px', sortable: true },
  { key: 'email', title: '邮箱', width: '180px', sortable: true },
  { key: 'status', title: '状态', width: '100px', align: 'center' as const, sortable: true },
  { key: 'last_contact', title: '最后联系', width: '120px', sortable: true },
  { key: 'created_at', title: '创建时间', width: '140px', sortable: true }
]

// 增强列配置
const enhancedColumns = computed(() =>
  tableColumns.map(col => ({
    ...col,
    type:
      col.key === 'avatar'
        ? 'image'
        : col.key === 'status'
          ? 'status'
          : col.key === 'last_contact' || col.key === 'created_at'
            ? 'date'
            : 'text'
  }))
)

// 状态选项
const statusOptions = ['全部状态', '活跃', '未激活', '待审核', '已屏蔽']

// 客户操作配置
const customerActions = [
  { key: 'view', label: '查看', icon: '👁', type: 'default' as const },
  { key: 'edit', label: '编辑', icon: '✏️', type: 'primary' as const },
  { key: 'contact', label: '联系', icon: '📞', type: 'default' as const },
  {
    key: 'block',
    label: '屏蔽',
    icon: '🚫',
    type: 'danger' as const,
    visible: (item: Customer) => item.status !== 'blocked'
  }
]

// 批量操作配置
const batchOperations = [
  { key: 'export', label: '批量导出', icon: '📤', type: 'default' as const },
  { key: 'contact', label: '批量联系', icon: '📞', type: 'default' as const },
  { key: 'activate', label: '批量激活', icon: '✅', type: 'default' as const },
  { key: 'deactivate', label: '批量停用', icon: '❌', type: 'warning' as const },
  { key: 'delete', label: '批量删除', icon: '🗑', type: 'danger' as const }
]

// 实时更新配置
const realtimeOptions = {
  ...enhancedTablePresets.customerManagement,
  realtimeOptions: {
    websocketUrl: 'ws://localhost:8080/ws/customers',
    debounceDelay: 300,
    cacheExpiry: 5 * 60 * 1000 // 5分钟缓存
  }
}

// 使用增强表格与实时更新
const {
  // 表格功能
  selectedCount,
  selectAll,
  indeterminate,
  isSelected,
  clearSelection,

  // 实时状态
  realtimeState,
  isOnline,
  hasPendingUpdates,
  hasConflicts,
  conflicts,
  healthCheck,
  syncing,

  // 数据操作
  createItem,
  updateItem,
  deleteItem,
  batchOperations: enhancedBatchOps,

  // 其他功能
  smartRefresh,
  resolveConflict,
  connect,
  disconnect,
  clearCache,
  loadData
} = useEnhancedTableWithRealtime<Customer>({
  dataKey: 'customers',
  ...realtimeOptions,

  // 数据加载函数
  loadData: async (page, pageSize, filters, sort) => {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 150))

    const startIndex = (page - 1) * pageSize
    const items = generateMockCustomers(startIndex, pageSize, filters, sort)

    // 记录活动
    addActivity('sync', `加载第${page}页数据，共${items.length}条`)

    return {
      items,
      total: 50000, // 模拟大量客户数据
      hasMore: startIndex + pageSize < 50000
    }
  },

  // 数据更新函数
  updateData: async (id, updates) => {
    await new Promise(resolve => setTimeout(resolve, 100))
    const mockCustomer = { id, ...updates } as Customer
    addActivity('update', `更新客户 ${id}`)
    return mockCustomer
  },

  // 数据创建函数
  createData: async data => {
    await new Promise(resolve => setTimeout(resolve, 150))
    const newCustomer = {
      ...data,
      id: `customer_${Date.now()}`,
      _version: 1,
      _lastModified: new Date().toISOString()
    } as Customer
    addActivity('create', `创建客户 ${newCustomer.name}`)
    return newCustomer
  },

  // 数据删除函数
  deleteData: async id => {
    await new Promise(resolve => setTimeout(resolve, 100))
    addActivity('delete', `删除客户 ${id}`)
  }
})

// 生成模拟客户数据
function generateMockCustomers(
  startIndex: number,
  count: number,
  filters?: any,
  sort?: any
): Customer[] {
  const statuses: Customer['status'][] = ['active', 'inactive', 'pending', 'blocked']
  const companies = [
    '腾讯科技',
    '阿里巴巴',
    '字节跳动',
    '美团',
    '滴滴出行',
    '京东',
    '小米科技',
    null
  ]
  const customers: Customer[] = []

  for (let i = 0; i < count; i++) {
    const index = startIndex + i
    const customer: Customer = {
      id: `customer_${index}`,
      name: `客户${index + 1}`,
      phone: `138${String(index).padStart(8, '0')}`,
      email: `customer${index + 1}@example.com`,
      company: companies[index % companies.length] || undefined,
      status: statuses[index % statuses.length],
      avatar_url: index % 4 === 0 ? `https://picsum.photos/40/40?random=${index}` : undefined,
      last_contact: new Date(
        Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000
      ).toISOString(),
      created_at: new Date(
        Date.now() - Math.floor(Math.random() * 365) * 24 * 60 * 60 * 1000
      ).toISOString(),
      _version: Math.floor(Math.random() * 5) + 1,
      _lastModified: new Date(
        Date.now() - Math.floor(Math.random() * 24) * 60 * 60 * 1000
      ).toISOString(),
      tags: index % 3 === 0 ? ['VIP', '重要客户'] : undefined
    }

    // 应用筛选
    if (
      filters?.keyword &&
      !customer.name.includes(filters.keyword) &&
      !customer.phone.includes(filters.keyword)
    ) {
      continue
    }
    if (filters?.status && customer.status !== filters.status) {
      continue
    }

    customers.push(customer)
  }

  // 应用排序
  if (sort?.by) {
    customers.sort((a, b) => {
      const aVal = a[sort.by as keyof Customer]
      const bVal = b[sort.by as keyof Customer]
      const result = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
      return sort.order === 'desc' ? -result : result
    })
  }

  return customers
}

// 实时数据加载函数
const loadRealtimeData = async (page: number, pageSize: number) => {
  return loadData(page, pageSize, filters, {
    by: sortBy.value,
    order: sortOrder.value
  })
}

// 添加活动记录
const addActivity = (
  type: 'create' | 'update' | 'delete' | 'sync' | 'conflict',
  message: string
) => {
  realtimeActivities.value.unshift({
    type,
    message,
    timestamp: new Date()
  })

  // 限制日志数量
  if (realtimeActivities.value.length > 100) {
    realtimeActivities.value.pop()
  }
}

// 事件处理函数
const handleSearch = () => {
  filters.keyword = searchKeyword.value
  smartRefresh(true)
}

const handleStatusChange = (event: any) => {
  statusIndex.value = event.detail.value
  selectedStatus.value = statusOptions[statusIndex.value]
  filters.status = selectedStatus.value === '全部状态' ? '' : getStatusValue(selectedStatus.value)
  smartRefresh(true)
}

const handleReset = () => {
  searchKeyword.value = ''
  selectedStatus.value = ''
  statusIndex.value = 0
  Object.assign(filters, { keyword: '', status: '' })
  smartRefresh(true)
}

const handleSort = (column: string) => {
  if (sortBy.value === column) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortBy.value = column
    sortOrder.value = 'asc'
  }
  smartRefresh(true)
}

const getSortIcon = (column: string) => {
  if (sortBy.value !== column) return '↕️'
  return sortOrder.value === 'asc' ? '↑' : '↓'
}

const handleSelectAll = () => {
  // 实现全选逻辑
}

const handleRowSelect = (id: string | number, selected: boolean) => {
  // 实现行选择逻辑
}

const handleRowClick = (item: Customer) => {
  console.log('Row clicked:', item)
  addActivity('update', `查看客户 ${item.name}`)
}

const handleRowAction = (action: string, item: Customer) => {
  console.log('Row action:', action, item)
  addActivity('update', `对客户 ${item.name} 执行操作：${action}`)
}

const handleRowHeightChange = (id: string | number, height: number) => {
  // 处理行高变化
}

const handleVirtualError = (error: string) => {
  console.error('Virtual scrolling error:', error)
}

const handleCreateCustomer = () => {
  console.log('Create new customer')
  addActivity('create', '开始创建新客户')
}

const handleManualSync = async () => {
  try {
    await smartRefresh(true)
    addActivity('sync', '手动同步完成')
  } catch (error) {
    addActivity('sync', `同步失败: ${error}`)
  }
}

const handleBatchOperation = (operation: string) => {
  console.log('Batch operation:', operation)
  addActivity('update', `执行批量操作：${operation}`)
}

const handleResolveConflict = async (index: number, strategy: 'local' | 'remote' | 'merge') => {
  try {
    const resolved = await resolveConflict(index, strategy)
    if (resolved) {
      addActivity('conflict', `解决冲突：客户 ${resolved.id}，策略：${strategy}`)
    }
  } catch (error) {
    addActivity('conflict', `冲突解决失败: ${error}`)
  }
}

// 工具函数
const getStatusValue = (statusLabel: string): Customer['status'] => {
  const statusMap: Record<string, Customer['status']> = {
    活跃: 'active',
    未激活: 'inactive',
    待审核: 'pending',
    已屏蔽: 'blocked'
  }
  return statusMap[statusLabel] || 'active'
}

const getStatusType = (status: Customer['status']) => {
  const statusTypes = {
    active: 'success',
    inactive: 'default',
    pending: 'warning',
    blocked: 'danger'
  }
  return statusTypes[status] || 'default'
}

const getStatusLabel = (status: Customer['status']) => {
  const statusLabels = {
    active: '活跃',
    inactive: '未激活',
    pending: '待审核',
    blocked: '已屏蔽'
  }
  return statusLabels[status] || status
}

const formatDate = (dateString: string) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

const formatRelativeTime = (dateString: string) => {
  if (!dateString) return ''
  const now = new Date()
  const date = new Date(dateString)
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 1) return '刚刚更新'
  if (diffMins < 60) return `${diffMins}分钟前更新`
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)}小时前更新`
  return `${Math.floor(diffMins / 1440)}天前更新`
}

const formatTime = (date: Date) => {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`
}

const hasPendingUpdate = (id: string | number) => {
  // 检查是否有待处理的更新
  return false // 简化实现
}

// 计算属性
const lastSyncTime = computed(() => {
  return realtimeState.lastSync ? formatDate(realtimeState.lastSync.toISOString()) : '从未同步'
})

const virtualScrollingEnabled = computed(() => true)

const cacheStats = computed(() => {
  return {} // 简化实现
})

// 生命周期
onMounted(() => {
  addActivity('sync', '页面初始化完成，开始加载数据')
})
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.realtime-customer-management {
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    .header-left {
      .page-title {
        font-size: 24px;
        font-weight: 600;
        color: var(--text-color-primary);
        margin-bottom: 4px;
        display: block;
      }

      .page-subtitle {
        font-size: 14px;
        color: var(--text-color-secondary);
      }
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 12px;

      .connection-status {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 6px 12px;
        border-radius: 16px;
        font-size: 12px;

        .status-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        &.online {
          background: rgba(var(--color-success-rgb), 0.1);
          color: var(--color-success);

          .status-indicator {
            background: var(--color-success);
            animation: pulse 2s infinite;
          }
        }

        &.offline {
          background: rgba(var(--color-error-rgb), 0.1);
          color: var(--color-error);

          .status-indicator {
            background: var(--color-error);
          }
        }
      }
    }
  }

  .realtime-status-panel {
    margin-bottom: 20px;
    padding: 16px 20px;

    .status-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 20px;
      margin-bottom: 20px;

      .status-item {
        .status-label {
          font-size: 12px;
          color: var(--text-color-secondary);
          display: block;
          margin-bottom: 4px;
        }

        .status-value {
          font-size: 14px;
          font-weight: 500;

          &.online {
            color: var(--color-success);
          }

          &.offline {
            color: var(--color-error);
          }

          &.warning {
            color: var(--color-warning);
          }
        }
      }
    }

    .health-check {
      .health-title {
        font-size: 14px;
        font-weight: 600;
        margin-bottom: 12px;
        display: block;
      }

      .health-indicators {
        display: flex;
        gap: 16px;

        .health-item {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;

          &.healthy {
            color: var(--color-success);
          }

          &:not(.healthy) {
            color: var(--color-warning);
          }
        }
      }
    }
  }

  .conflict-resolution {
    margin-bottom: 20px;
    padding: 16px 20px;
    background: rgba(var(--color-warning-rgb), 0.05);
    border: 1px solid rgba(var(--color-warning-rgb), 0.2);

    .conflict-header {
      margin-bottom: 16px;

      .conflict-title {
        font-size: 16px;
        font-weight: 600;
        color: var(--color-warning);
        display: block;
        margin-bottom: 4px;
      }

      .conflict-subtitle {
        font-size: 14px;
        color: var(--text-color-secondary);
      }
    }

    .conflict-item {
      border: 1px solid var(--border-color-light);
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 16px;
      background: white;

      .conflict-info {
        margin-bottom: 12px;

        .conflict-id {
          font-weight: 600;
          display: block;
          margin-bottom: 4px;
        }

        .conflict-time {
          font-size: 12px;
          color: var(--text-color-secondary);
        }
      }

      .conflict-comparison {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
        margin-bottom: 16px;

        .conflict-version {
          border: 1px solid var(--border-color-light);
          border-radius: 6px;
          padding: 12px;

          &.local {
            border-color: var(--color-primary);
            background: rgba(var(--color-primary-rgb), 0.05);
          }

          &.remote {
            border-color: var(--color-success);
            background: rgba(var(--color-success-rgb), 0.05);
          }

          .version-label {
            font-size: 12px;
            font-weight: 600;
            margin-bottom: 8px;
            display: block;
          }

          .version-data text {
            font-size: 13px;
            display: block;
            margin-bottom: 4px;
          }
        }
      }

      .conflict-actions {
        display: flex;
        gap: 8px;

        .conflict-btn {
          padding: 6px 12px;
          border: 1px solid var(--border-color);
          background: white;
          border-radius: 4px;
          font-size: 12px;
          cursor: pointer;

          &.local-btn:hover {
            border-color: var(--color-primary);
            color: var(--color-primary);
          }

          &.remote-btn:hover {
            border-color: var(--color-success);
            color: var(--color-success);
          }

          &.merge-btn:hover {
            border-color: var(--color-warning);
            color: var(--color-warning);
          }
        }
      }
    }
  }

  .activity-log {
    position: fixed;
    top: 20px;
    right: 20px;
    width: 350px;
    max-height: 400px;
    z-index: 1000;

    .log-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      border-bottom: 1px solid var(--border-color-light);

      .log-title {
        font-weight: 600;
      }

      .log-toggle {
        background: none;
        border: none;
        cursor: pointer;
      }
    }

    .log-content {
      padding: 0;
      max-height: 300px;
      overflow-y: auto;

      .log-item {
        padding: 8px 16px;
        border-bottom: 1px solid var(--border-color-light);

        .activity-time {
          font-size: 11px;
          color: var(--text-color-tertiary);
          display: block;
          margin-bottom: 2px;
        }

        .activity-message {
          font-size: 12px;
          color: var(--text-color-secondary);
        }

        &.activity-create {
          border-left: 3px solid var(--color-success);
        }

        &.activity-update {
          border-left: 3px solid var(--color-primary);
        }

        &.activity-delete {
          border-left: 3px solid var(--color-error);
        }

        &.activity-conflict {
          border-left: 3px solid var(--color-warning);
        }
      }
    }
  }

  .activity-log-btn {
    position: fixed;
    bottom: 80px;
    right: 20px;
    padding: 8px 12px;
    background: var(--color-primary);
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 12px;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    z-index: 1000;
  }

  .debug-panel {
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 300px;
    max-height: 350px;
    z-index: 1000;

    .debug-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      border-bottom: 1px solid var(--border-color-light);

      .debug-title {
        font-weight: 600;
        font-size: 14px;
      }

      .debug-toggle {
        background: none;
        border: none;
        cursor: pointer;
      }
    }

    .debug-content {
      padding: 12px 16px;
      max-height: 280px;
      overflow-y: auto;

      .debug-section {
        margin-bottom: 16px;

        .debug-section-title {
          font-size: 12px;
          font-weight: 600;
          color: var(--color-primary);
          margin-bottom: 8px;
          display: block;
        }

        text {
          font-size: 11px;
          font-family: monospace;
          color: var(--text-color-secondary);
          display: block;
          margin-bottom: 4px;
        }
      }
    }
  }

  .debug-float-btn {
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: var(--color-primary);
    color: white;
    border: none;
    font-size: 18px;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    z-index: 1000;

    &:hover {
      transform: scale(1.1);
    }
  }

  .customer-avatar {
    .avatar-image {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      object-fit: cover;
    }

    .avatar-placeholder {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: var(--color-primary);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      font-weight: 600;
    }
  }

  .customer-info {
    .customer-name {
      display: block;
      font-weight: 500;
      margin-bottom: 2px;
    }

    .customer-company {
      font-size: 12px;
      color: var(--text-color-secondary);
      display: block;
      margin-bottom: 4px;
    }

    .update-indicator {
      display: flex;
      align-items: center;
      gap: 6px;

      .update-time {
        font-size: 11px;
        color: var(--text-color-tertiary);
      }

      .pending-indicator {
        font-size: 10px;
        color: var(--color-warning);
        background: rgba(var(--color-warning-rgb), 0.1);
        padding: 1px 4px;
        border-radius: 2px;
      }
    }
  }

  .status-cell {
    display: flex;
    align-items: center;
    gap: 8px;

    .status-tag {
      display: inline-flex;
      align-items: center;
      padding: 3px 8px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 500;

      &.status-success {
        color: var(--color-success);
        background: rgba(var(--color-success-rgb), 0.1);
      }

      &.status-warning {
        color: var(--color-warning);
        background: rgba(var(--color-warning-rgb), 0.1);
      }

      &.status-danger {
        color: var(--color-error);
        background: rgba(var(--color-error-rgb), 0.1);
      }

      &.status-default {
        color: var(--text-color-secondary);
        background: var(--color-grey-100);
      }
    }

    .version-info {
      font-size: 10px;
      color: var(--text-color-tertiary);
      font-family: monospace;
    }
  }
}

@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    opacity: 1;
  }
}

// 响应式优化
@include respond-to('phone') {
  .realtime-customer-management {
    .page-header {
      flex-direction: column;
      gap: 16px;
      align-items: stretch;

      .header-right {
        justify-content: center;
      }
    }

    .realtime-status-panel {
      .status-grid {
        grid-template-columns: 1fr 1fr;
      }

      .health-indicators {
        flex-direction: column;
        gap: 8px;
      }
    }

    .conflict-resolution {
      .conflict-comparison {
        grid-template-columns: 1fr;
      }

      .conflict-actions {
        flex-direction: column;
      }
    }

    .activity-log {
      top: 10px;
      left: 10px;
      right: 10px;
      width: auto;
    }

    .debug-panel {
      bottom: 10px;
      left: 10px;
      right: 10px;
      width: auto;
    }
  }
}
</style>
