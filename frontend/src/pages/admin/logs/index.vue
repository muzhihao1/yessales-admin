<template>
  <view class="logs-page">
    <!-- Header with controls -->
    <view class="page-header">
      <view class="header-left">
        <text class="page-title">操作日志</text>
        <view class="stats-summary" v-if="statistics">
          <text class="stat-item">总计: {{ statistics.total_entries }}</text>
          <text class="stat-item error-count">错误: {{ statistics.entries_by_level.error + statistics.entries_by_level.critical }}</text>
          <text class="stat-item security-count">安全事件: {{ statistics.security_events }}</text>
        </view>
      </view>
      
      <view class="header-actions">
        <!-- Real-time indicator -->
        <RealtimeIndicator />
        
        <!-- Auto-refresh toggle -->
        <view 
          class="refresh-toggle"
          :class="{ active: autoRefresh }"
          @click="toggleAutoRefresh"
        >
          <text class="refresh-icon">🔄</text>
          <text class="refresh-text">{{ autoRefresh ? '自动刷新' : '手动刷新' }}</text>
        </view>
        
        <!-- Export button -->
        <button 
          class="export-btn"
          @click="showExportModal"
        >
          <text>导出日志</text>
        </button>
        
        <!-- Refresh button -->
        <button 
          class="refresh-btn"
          @click="refreshLogs"
          :disabled="loading"
        >
          <text>{{ loading ? '刷新中...' : '刷新' }}</text>
        </button>
      </view>
    </view>

    <!-- Filters and search -->
    <view class="filters-section">
      <view class="filter-row">
        <!-- Search input -->
        <view class="search-container">
          <input 
            v-model="searchTerm"
            placeholder="搜索日志内容、用户、资源..."
            class="search-input"
            @input="onSearchInput"
          />
          <text class="search-icon">🔍</text>
        </view>
        
        <!-- Quick filters -->
        <view class="quick-filters">
          <button 
            v-for="level in quickLevelFilters"
            :key="level"
            class="quick-filter"
            :class="{ active: isLevelSelected(level) }"
            @click="toggleLevelFilter(level)"
          >
            <view 
              class="filter-dot"
              :style="{ backgroundColor: getLogLevelColor(level) }"
            ></view>
            <text>{{ getLogLevelText(level) }}</text>
          </button>
        </view>
        
        <!-- Advanced filters toggle -->
        <button 
          class="advanced-toggle"
          @click="showAdvancedFilters = !showAdvancedFilters"
        >
          <text>高级筛选</text>
          <text class="toggle-icon">{{ showAdvancedFilters ? '▼' : '▶' }}</text>
        </button>
      </view>
      
      <!-- Advanced filters -->
      <view v-if="showAdvancedFilters" class="advanced-filters">
        <view class="filter-group">
          <text class="filter-label">分类</text>
          <picker 
            mode="multiSelector"
            :range="categoryOptions"
            range-key="label"
            @change="onCategoryChange"
          >
            <view class="picker-display">
              {{ selectedCategories.length ? `已选择 ${selectedCategories.length} 个分类` : '选择分类' }}
            </view>
          </picker>
        </view>
        
        <view class="filter-group">
          <text class="filter-label">操作</text>
          <picker 
            mode="multiSelector"
            :range="actionOptions"
            range-key="label"
            @change="onActionChange"
          >
            <view class="picker-display">
              {{ selectedActions.length ? `已选择 ${selectedActions.length} 个操作` : '选择操作' }}
            </view>
          </picker>
        </view>
        
        <view class="filter-group">
          <text class="filter-label">时间范围</text>
          <view class="date-range">
            <picker 
              mode="date"
              :value="dateFrom"
              @change="onDateFromChange"
            >
              <view class="date-picker">
                {{ dateFrom || '开始日期' }}
              </view>
            </picker>
            <text class="date-separator">至</text>
            <picker 
              mode="date"
              :value="dateTo"
              @change="onDateToChange"
            >
              <view class="date-picker">
                {{ dateTo || '结束日期' }}
              </view>
            </picker>
          </view>
        </view>
        
        <view class="filter-actions">
          <button class="clear-btn" @click="clearAllFilters">
            <text>清除筛选</text>
          </button>
          <button class="apply-btn" @click="applyFilters">
            <text>应用筛选</text>
          </button>
        </view>
      </view>
    </view>

    <!-- Statistics cards -->
    <view v-if="statistics && !showAdvancedFilters" class="stats-cards">
      <view class="stat-card">
        <view class="stat-header">
          <text class="stat-title">日志级别分布</text>
        </view>
        <view class="level-stats">
          <view 
            v-for="(count, level) in statistics.entries_by_level"
            :key="level"
            class="level-stat"
          >
            <view 
              class="level-dot"
              :style="{ backgroundColor: getLogLevelColor(level) }"
            ></view>
            <text class="level-name">{{ getLogLevelText(level) }}</text>
            <text class="level-count">{{ count }}</text>
          </view>
        </view>
      </view>
      
      <view class="stat-card">
        <view class="stat-header">
          <text class="stat-title">活跃用户</text>
        </view>
        <view class="user-stats">
          <view 
            v-for="user in statistics.top_users.slice(0, 5)"
            :key="user.user_id"
            class="user-stat"
          >
            <text class="user-name">{{ user.user_name }}</text>
            <text class="user-count">{{ user.count }}</text>
          </view>
        </view>
      </view>
      
      <view class="stat-card">
        <view class="stat-header">
          <text class="stat-title">错误摘要</text>
        </view>
        <view class="error-stats">
          <view 
            v-for="error in statistics.error_summary"
            :key="error.error_code"
            class="error-stat"
          >
            <text class="error-code">{{ error.error_code }}</text>
            <text class="error-count">{{ error.count }}</text>
            <text class="error-time">{{ formatTime(error.last_occurrence) }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- Loading state -->
    <view v-if="loading" class="loading-container">
      <text class="loading-text">加载日志中...</text>
    </view>

    <!-- Error state -->
    <view v-if="error" class="error-container">
      <text class="error-text">{{ error }}</text>
      <button class="retry-btn" @click="refreshLogs">
        <text>重试</text>
      </button>
    </view>

    <!-- Logs table -->
    <view v-if="!loading && !error" class="logs-table-container">
      <DataTable
        :columns="logColumns"
        :data="paginatedLogs"
        :loading="loading"
        :empty-text="hasLogs ? '没有找到匹配的日志' : '暂无日志数据'"
        @row-click="onLogClick"
      >
        <!-- Custom column renders -->
        <template #level="{ row }">
          <view class="level-badge" :class="`level-${row.level}`">
            <view 
              class="level-dot"
              :style="{ backgroundColor: getLogLevelColor(row.level) }"
            ></view>
            <text>{{ getLogLevelText(row.level) }}</text>
          </view>
        </template>
        
        <template #user="{ row }">
          <view v-if="row.user_name" class="user-info">
            <text class="user-name">{{ row.user_name }}</text>
            <text class="user-role">{{ row.user_role }}</text>
          </view>
          <text v-else class="system-user">系统</text>
        </template>
        
        <template #action="{ row }">
          <view class="action-info">
            <text class="category">{{ getCategoryText(row.category) }}</text>
            <text class="action">{{ getActionText(row.action) }}</text>
          </view>
        </template>
        
        <template #resource="{ row }">
          <view v-if="row.resource_name" class="resource-info">
            <text class="resource-name">{{ row.resource_name }}</text>
            <text class="resource-type">{{ row.resource_type }}</text>
          </view>
          <text v-else class="no-resource">-</text>
        </template>
        
        <template #timestamp="{ row }">
          <view class="time-info">
            <text class="time">{{ formatTime(row.timestamp) }}</text>
            <text class="date">{{ formatDate(row.timestamp) }}</text>
          </view>
        </template>
        
        <template #actions="{ row }">
          <view class="row-actions">
            <button 
              class="action-btn view"
              @click.stop="viewLogDetails(row)"
            >
              <text>详情</text>
            </button>
            <button 
              v-if="row.level === 'error' || row.level === 'critical'"
              class="action-btn resolve"
              @click.stop="resolveError(row)"
            >
              <text>处理</text>
            </button>
          </view>
        </template>
      </DataTable>
    </view>

    <!-- Pagination -->
    <view v-if="!loading && hasLogs" class="pagination-container">
      <DataPagination
        :current-page="currentPage"
        :total-pages="totalPages"
        :total-items="totalEntries"
        :page-size="pageSize"
        @page-change="changePage"
        @page-size-change="changePageSize"
      />
    </view>

    <!-- Log details modal -->
    <LogDetailsModal
      v-if="selectedLog"
      :log="selectedLog"
      :visible="showDetailsModal"
      @close="closeDetailsModal"
      @resolve="resolveError"
    />

    <!-- Export modal -->
    <LogExportModal
      :visible="showExportModal"
      :filters="currentFilter"
      @close="closeExportModal"
      @export="exportLogs"
    />
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useLogsStore } from '@/stores/logs'
import { usePermissions } from '@/composables/usePermissions'
import DataTable from '@/components/common/DataTable.vue'
import DataPagination from '@/components/common/DataPagination.vue'
import RealtimeIndicator from '@/components/admin/RealtimeIndicator.vue'
import LogDetailsModal from '@/components/admin/LogDetailsModal.vue'
import LogExportModal from '@/components/admin/LogExportModal.vue'
import type { LogAction, LogCategory, LogEntry, LogFilter, LogLevel } from '@/types/logs'

// Store and permissions
const logsStore = useLogsStore()
const { checkPermission } = usePermissions()

// Reactive state
const searchTerm = ref('')
const showAdvancedFilters = ref(false)
const selectedLog = ref<LogEntry | null>(null)
const showDetailsModal = ref(false)
const showExportModalRef = ref(false)
const selectedCategories = ref<LogCategory[]>([])
const selectedActions = ref<LogAction[]>([])
const dateFrom = ref('')
const dateTo = ref('')

// Quick filter levels
const quickLevelFilters: LogLevel[] = ['critical', 'error', 'warn', 'info']

// Extract store state
const {
  logs,
  statistics,
  loading,
  error,
  currentPage,
  pageSize,
  totalEntries,
  totalPages,
  hasLogs,
  filteredLogs,
  currentFilter,
  autoRefresh,
  
  fetchLogs,
  fetchStatistics,
  searchLogs,
  applyFilter,
  clearFilter,
  changePage: storeChangePage,
  exportLogs: storeExportLogs,
  startAutoRefresh,
  stopAutoRefresh,
  getLogLevelColor,
  getLogLevelText,
  getCategoryText,
  getActionText
} = logsStore

// Computed properties
const paginatedLogs = computed(() => {
  const startIndex = (currentPage.value - 1) * pageSize.value
  const endIndex = startIndex + pageSize.value
  return filteredLogs.value.slice(startIndex, endIndex)
})

const categoryOptions = computed(() => [
  { value: 'auth', label: '认证' },
  { value: 'user', label: '用户' },
  { value: 'customer', label: '客户' },
  { value: 'product', label: '产品' },
  { value: 'quote', label: '报价' },
  { value: 'system', label: '系统' },
  { value: 'security', label: '安全' },
  { value: 'api', label: 'API' },
  { value: 'data', label: '数据' },
  { value: 'export', label: '导出' }
])

const actionOptions = computed(() => [
  { value: 'create', label: '创建' },
  { value: 'read', label: '查看' },
  { value: 'update', label: '更新' },
  { value: 'delete', label: '删除' },
  { value: 'login', label: '登录' },
  { value: 'logout', label: '登出' },
  { value: 'approve', label: '批准' },
  { value: 'reject', label: '拒绝' },
  { value: 'export', label: '导出' }
])

// Table columns configuration
const logColumns = [
  { key: 'level', title: '级别', width: '80px', slot: true },
  { key: 'timestamp', title: '时间', width: '150px', slot: true },
  { key: 'user', title: '用户', width: '120px', slot: true },
  { key: 'action', title: '操作', width: '120px', slot: true },
  { key: 'resource', title: '资源', width: '150px', slot: true },
  { key: 'message', title: '消息', flex: 1 },
  { key: 'actions', title: '操作', width: '120px', slot: true }
]

// Methods
function isLevelSelected(level: LogLevel): boolean {
  return currentFilter.value.level?.includes(level) || false
}

function toggleLevelFilter(level: LogLevel) {
  const currentLevels = currentFilter.value.level || []
  let newLevels: LogLevel[]
  
  if (currentLevels.includes(level)) {
    newLevels = currentLevels.filter(l => l !== level)
  } else {
    newLevels = [...currentLevels, level]
  }
  
  applyFilter({
    ...currentFilter.value,
    level: newLevels.length ? newLevels : undefined
  })
}

function onSearchInput() {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  
  searchTimeout = setTimeout(() => {
    searchLogs(searchTerm.value)
  }, 500)
}

let searchTimeout: NodeJS.Timeout | null = null

function onCategoryChange(event: any) {
  const indices = event.detail.value
  selectedCategories.value = indices.map((i: number) => categoryOptions.value[i].value)
}

function onActionChange(event: any) {
  const indices = event.detail.value
  selectedActions.value = indices.map((i: number) => actionOptions.value[i].value)
}

function onDateFromChange(event: any) {
  dateFrom.value = event.detail.value
}

function onDateToChange(event: any) {
  dateTo.value = event.detail.value
}

function applyFilters() {
  const filter: LogFilter = {
    ...currentFilter.value,
    category: selectedCategories.value.length ? selectedCategories.value : undefined,
    action: selectedActions.value.length ? selectedActions.value : undefined,
    date_from: dateFrom.value || undefined,
    date_to: dateTo.value || undefined
  }
  
  applyFilter(filter)
  showAdvancedFilters.value = false
}

function clearAllFilters() {
  selectedCategories.value = []
  selectedActions.value = []
  dateFrom.value = ''
  dateTo.value = ''
  searchTerm.value = ''
  clearFilter()
}

function refreshLogs() {
  fetchLogs(currentFilter.value)
  fetchStatistics()
}

function toggleAutoRefresh() {
  if (autoRefresh.value) {
    stopAutoRefresh()
  } else {
    startAutoRefresh()
  }
}

function onLogClick(log: LogEntry) {
  viewLogDetails(log)
}

function viewLogDetails(log: LogEntry) {
  selectedLog.value = log
  showDetailsModal.value = true
}

function closeDetailsModal() {
  showDetailsModal.value = false
  selectedLog.value = null
}

function resolveError(log: LogEntry) {
  uni.showModal({
    title: '处理错误',
    content: '确认要将此错误标记为已处理吗？',
    success: (res) => {
      if (res.confirm) {
        // Implementation for resolving error
        uni.showToast({
          title: '错误已标记为已处理',
          icon: 'success'
        })
      }
    }
  })
}

function showExportModal() {
  showExportModalRef.value = true
}

function closeExportModal() {
  showExportModalRef.value = false
}

function changePage(page: number) {
  storeChangePage(page)
}

function changePageSize(size: number) {
  pageSize.value = size
  currentPage.value = 1
  fetchLogs(currentFilter.value)
}

// Utility functions
function formatTime(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString('zh-CN')
}

function formatDate(timestamp: string): string {
  return new Date(timestamp).toLocaleDateString('zh-CN')
}

// Lifecycle
onMounted(async () => {
  // Check permissions
  if (!checkPermission.canPerformAction('read', 'logs')) {
    uni.showToast({
      title: '权限不足',
      icon: 'none'
    })
    uni.navigateBack()
    return
  }
  
  // Load initial data
  await Promise.all([
    fetchLogs(),
    fetchStatistics()
  ])
})

onUnmounted(() => {
  stopAutoRefresh()
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
})

// Navigation title
uni.setNavigationBarTitle({
  title: '操作日志'
})
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.logs-page {
  padding: $spacing-md;
  background: $bg-color;
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: $spacing-lg;
  
  .header-left {
    flex: 1;
    
    .page-title {
      font-size: $font-size-extra-large;
      font-weight: 600;
      color: $text-color;
      margin-bottom: $spacing-sm;
      display: block;
    }
    
    .stats-summary {
      display: flex;
      gap: $spacing-md;
      
      .stat-item {
        font-size: $font-size-small;
        color: $text-color-secondary;
        
        &.error-count {
          color: $danger-color;
          font-weight: 500;
        }
        
        &.security-count {
          color: $warning-color;
          font-weight: 500;
        }
      }
    }
  }
  
  .header-actions {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    
    .refresh-toggle {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 6px 12px;
      border-radius: $border-radius-base;
      border: 1px solid $border-color;
      background: $bg-color-white;
      cursor: pointer;
      transition: all 0.3s ease;
      
      &.active {
        background: $primary-color;
        color: white;
        border-color: $primary-color;
      }
      
      .refresh-icon {
        font-size: 12px;
      }
      
      .refresh-text {
        font-size: $font-size-small;
      }
    }
    
    .export-btn,
    .refresh-btn {
      padding: 8px 16px;
      border-radius: $border-radius-base;
      border: 1px solid $border-color;
      background: $bg-color-white;
      color: $text-color;
      font-size: $font-size-small;
      cursor: pointer;
      transition: all 0.3s ease;
      
      &:hover {
        background: $bg-color;
      }
      
      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }
    
    .export-btn {
      background: $primary-color;
      color: white;
      border-color: $primary-color;
      
      &:hover {
        background: darken($primary-color, 10%);
      }
    }
  }
}

.filters-section {
  background: $bg-color-white;
  border-radius: $border-radius-lg;
  padding: $spacing-md;
  margin-bottom: $spacing-lg;
  border: 1px solid $border-color;
  
  .filter-row {
    display: flex;
    align-items: center;
    gap: $spacing-md;
    margin-bottom: $spacing-md;
    
    .search-container {
      position: relative;
      flex: 1;
      max-width: 300px;
      
      .search-input {
        width: 100%;
        padding: 8px 12px 8px 36px;
        border: 1px solid $border-color;
        border-radius: $border-radius-base;
        font-size: $font-size-small;
        
        &:focus {
          border-color: $primary-color;
          outline: none;
        }
      }
      
      .search-icon {
        position: absolute;
        left: 12px;
        top: 50%;
        transform: translateY(-50%);
        color: $text-color-placeholder;
        font-size: 14px;
      }
    }
    
    .quick-filters {
      display: flex;
      gap: $spacing-sm;
      
      .quick-filter {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 4px 8px;
        border: 1px solid $border-color;
        border-radius: $border-radius-sm;
        background: $bg-color-white;
        font-size: $font-size-small;
        cursor: pointer;
        transition: all 0.3s ease;
        
        &.active {
          background: $primary-color;
          color: white;
          border-color: $primary-color;
        }
        
        .filter-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
      }
    }
    
    .advanced-toggle {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 6px 12px;
      border: 1px solid $border-color;
      border-radius: $border-radius-base;
      background: $bg-color-white;
      color: $text-color-secondary;
      font-size: $font-size-small;
      cursor: pointer;
      
      .toggle-icon {
        font-size: 10px;
      }
    }
  }
  
  .advanced-filters {
    border-top: 1px solid $border-color;
    padding-top: $spacing-md;
    
    .filter-group {
      display: flex;
      align-items: center;
      gap: $spacing-md;
      margin-bottom: $spacing-sm;
      
      .filter-label {
        min-width: 60px;
        font-size: $font-size-small;
        font-weight: 500;
        color: $text-color;
      }
      
      .picker-display {
        padding: 6px 12px;
        border: 1px solid $border-color;
        border-radius: $border-radius-sm;
        background: $bg-color-white;
        font-size: $font-size-small;
        color: $text-color-secondary;
        min-width: 150px;
      }
      
      .date-range {
        display: flex;
        align-items: center;
        gap: $spacing-sm;
        
        .date-picker {
          padding: 6px 12px;
          border: 1px solid $border-color;
          border-radius: $border-radius-sm;
          background: $bg-color-white;
          font-size: $font-size-small;
          color: $text-color-secondary;
          min-width: 120px;
        }
        
        .date-separator {
          color: $text-color-placeholder;
          font-size: $font-size-small;
        }
      }
    }
    
    .filter-actions {
      display: flex;
      gap: $spacing-sm;
      margin-top: $spacing-md;
      
      .clear-btn,
      .apply-btn {
        padding: 6px 16px;
        border-radius: $border-radius-sm;
        font-size: $font-size-small;
        cursor: pointer;
      }
      
      .clear-btn {
        border: 1px solid $border-color;
        background: $bg-color-white;
        color: $text-color-secondary;
      }
      
      .apply-btn {
        border: 1px solid $primary-color;
        background: $primary-color;
        color: white;
      }
    }
  }
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: $spacing-md;
  margin-bottom: $spacing-lg;
  
  .stat-card {
    background: $bg-color-white;
    border-radius: $border-radius-lg;
    padding: $spacing-md;
    border: 1px solid $border-color;
    
    .stat-header {
      margin-bottom: $spacing-sm;
      
      .stat-title {
        font-size: $font-size-medium;
        font-weight: 600;
        color: $text-color;
      }
    }
    
    .level-stats {
      display: flex;
      flex-direction: column;
      gap: $spacing-xs;
      
      .level-stat {
        display: flex;
        align-items: center;
        gap: $spacing-sm;
        
        .level-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
        
        .level-name {
          flex: 1;
          font-size: $font-size-small;
          color: $text-color;
        }
        
        .level-count {
          font-size: $font-size-small;
          font-weight: 500;
          color: $text-color-secondary;
        }
      }
    }
    
    .user-stats {
      display: flex;
      flex-direction: column;
      gap: $spacing-xs;
      
      .user-stat {
        display: flex;
        justify-content: space-between;
        align-items: center;
        
        .user-name {
          font-size: $font-size-small;
          color: $text-color;
        }
        
        .user-count {
          font-size: $font-size-small;
          font-weight: 500;
          color: $text-color-secondary;
        }
      }
    }
    
    .error-stats {
      display: flex;
      flex-direction: column;
      gap: $spacing-xs;
      
      .error-stat {
        display: flex;
        align-items: center;
        gap: $spacing-sm;
        
        .error-code {
          flex: 1;
          font-size: $font-size-small;
          color: $danger-color;
          font-family: monospace;
        }
        
        .error-count {
          font-size: $font-size-small;
          font-weight: 500;
          color: $text-color-secondary;
        }
        
        .error-time {
          font-size: $font-size-extra-small;
          color: $text-color-placeholder;
        }
      }
    }
  }
}

.loading-container,
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: $bg-color-white;
  border-radius: $border-radius-lg;
  padding: $spacing-xl;
  border: 1px solid $border-color;
  
  .loading-text,
  .error-text {
    font-size: $font-size-medium;
    color: $text-color-secondary;
    margin-bottom: $spacing-md;
  }
  
  .retry-btn {
    padding: 8px 16px;
    background: $primary-color;
    color: white;
    border: none;
    border-radius: $border-radius-base;
    font-size: $font-size-small;
    cursor: pointer;
  }
}

.logs-table-container {
  background: $bg-color-white;
  border-radius: $border-radius-lg;
  border: 1px solid $border-color;
  overflow: hidden;
  margin-bottom: $spacing-lg;
  
  // Custom table styles
  :deep(.level-badge) {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 2px 6px;
    border-radius: $border-radius-sm;
    font-size: $font-size-extra-small;
    font-weight: 500;
    
    &.level-info {
      background: rgba($info-color, 0.1);
      color: $info-color;
    }
    
    &.level-warn {
      background: rgba($warning-color, 0.1);
      color: $warning-color;
    }
    
    &.level-error {
      background: rgba($danger-color, 0.1);
      color: $danger-color;
    }
    
    &.level-critical {
      background: rgba($danger-color, 0.2);
      color: darken($danger-color, 10%);
    }
    
    &.level-debug {
      background: rgba($text-color-secondary, 0.1);
      color: $text-color-secondary;
    }
    
    .level-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
    }
  }
  
  :deep(.user-info) {
    display: flex;
    flex-direction: column;
    
    .user-name {
      font-size: $font-size-small;
      font-weight: 500;
      color: $text-color;
    }
    
    .user-role {
      font-size: $font-size-extra-small;
      color: $text-color-secondary;
    }
  }
  
  :deep(.system-user) {
    font-size: $font-size-small;
    color: $text-color-placeholder;
    font-style: italic;
  }
  
  :deep(.action-info) {
    display: flex;
    flex-direction: column;
    
    .category {
      font-size: $font-size-extra-small;
      color: $text-color-secondary;
      text-transform: uppercase;
    }
    
    .action {
      font-size: $font-size-small;
      color: $text-color;
      font-weight: 500;
    }
  }
  
  :deep(.resource-info) {
    display: flex;
    flex-direction: column;
    
    .resource-name {
      font-size: $font-size-small;
      color: $text-color;
      font-weight: 500;
    }
    
    .resource-type {
      font-size: $font-size-extra-small;
      color: $text-color-secondary;
    }
  }
  
  :deep(.no-resource) {
    color: $text-color-placeholder;
    font-style: italic;
  }
  
  :deep(.time-info) {
    display: flex;
    flex-direction: column;
    
    .time {
      font-size: $font-size-small;
      color: $text-color;
      font-weight: 500;
    }
    
    .date {
      font-size: $font-size-extra-small;
      color: $text-color-secondary;
    }
  }
  
  :deep(.row-actions) {
    display: flex;
    gap: $spacing-xs;
    
    .action-btn {
      padding: 2px 8px;
      border-radius: $border-radius-sm;
      font-size: $font-size-extra-small;
      cursor: pointer;
      
      &.view {
        background: rgba($info-color, 0.1);
        color: $info-color;
        border: 1px solid rgba($info-color, 0.3);
      }
      
      &.resolve {
        background: rgba($success-color, 0.1);
        color: $success-color;
        border: 1px solid rgba($success-color, 0.3);
      }
    }
  }
}

.pagination-container {
  display: flex;
  justify-content: center;
}

// Responsive design
@media (max-width: 768px) {
  .logs-page {
    padding: $spacing-sm;
  }
  
  .page-header {
    flex-direction: column;
    gap: $spacing-md;
    
    .header-actions {
      width: 100%;
      justify-content: space-between;
    }
  }
  
  .filter-row {
    flex-direction: column;
    align-items: stretch;
    
    .search-container {
      max-width: none;
    }
    
    .quick-filters {
      flex-wrap: wrap;
    }
  }
  
  .stats-cards {
    grid-template-columns: 1fr;
  }
  
  .advanced-filters {
    .filter-group {
      flex-direction: column;
      align-items: stretch;
      
      .filter-label {
        min-width: auto;
        margin-bottom: $spacing-xs;
      }
    }
  }
}
</style>