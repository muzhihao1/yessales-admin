<template>
  <div class="logs-page">
    <!-- Header with controls -->
    <div class="page-header">
      <div class="header-left">
        <span class="page-title">操作日志</span>
        <div class="stats-summary" v-if="statistics">
          <span class="stat-item">总计: {{ statistics.total_entries }}</span>
          <span class="stat-item error-count">错误: {{ statistics.entries_by_level.error + statistics.entries_by_level.critical }}</span>
          <span class="stat-item security-count">安全事件: {{ statistics.security_events }}</span>
        </div>
      </div>
      
      <div class="header-actions">
        <!-- Real-time indicator -->
        <RealtimeIndicator />
        
        <!-- Auto-refresh toggle -->
        <div 
          class="refresh-toggle"
          :class="{ active: autoRefresh }"
          @click="toggleAutoRefresh"
        >
          <span class="refresh-icon">🔄</span>
          <span class="refresh-text">{{ autoRefresh ? '自动刷新' : '手动刷新' }}</span>
        </div>
        
        <!-- Export button -->
        <button 
          class="export-btn"
          @click="showExportModal"
        >
          <span>导出日志</span>
        </button>
        
        <!-- Refresh button -->
        <button 
          class="refresh-btn"
          @click="refreshLogs"
          :disabled="loading"
        >
          <span>{{ loading ? '刷新中...' : '刷新' }}</span>
        </button>
      </div>
    </div>

    <!-- Filters and search -->
    <div class="filters-section">
      <div class="filter-row">
        <!-- Search input -->
        <div class="search-container">
          <input 
            v-model="searchTerm"
            placeholder="搜索日志内容、用户、资源..."
            class="search-input"
            @input="onSearchInput"
          />
          <span class="search-icon">🔍</span>
        </div>
        
        <!-- Quick filters -->
        <div class="quick-filters">
          <button 
            v-for="level in quickLevelFilters"
            :key="level"
            class="quick-filter"
            :class="{ active: isLevelSelected(level) }"
            @click="toggleLevelFilter(level)"
          >
            <div 
              class="filter-dot"
              :style="{ backgroundColor: getLogLevelColor(level) }"
            ></div>
            <span>{{ getLogLevelText(level) }}</span>
          </button>
        </div>
        
        <!-- Advanced filters toggle -->
        <button 
          class="advanced-toggle"
          @click="showAdvancedFilters = !showAdvancedFilters"
        >
          <span>高级筛选</span>
          <span class="toggle-icon">{{ showAdvancedFilters ? '▼' : '▶' }}</span>
        </button>
      </div>
      
      <!-- Advanced filters -->
      <div v-if="showAdvancedFilters" class="advanced-filters">
        <div class="filter-group">
          <span class="filter-label">分类</span>
          <div class="filter-picker" @click="showCategorySelect = !showCategorySelect">
            <span :class="['picker-text', { placeholder: !selectedCategories.length }]">
              {{ selectedCategories.length ? `已选择 ${selectedCategories.length} 个分类` : '选择分类' }}
            </span>
            <span class="picker-arrow">▼</span>
          </div>
          <div v-if="showCategorySelect" class="picker-options">
            <div 
              v-for="(option, index) in categoryOptions" 
              :key="index"
              class="picker-option"
              @click="toggleCategory(option.value, index)"
            >
              <input 
                type="checkbox" 
                :checked="selectedCategories.includes(option.value)"
                @click.stop
              />
              <span>{{ option.label }}</span>
            </div>
          </div>
        </div>
        
        <div class="filter-group">
          <span class="filter-label">操作</span>
          <div class="filter-picker" @click="showActionSelect = !showActionSelect">
            <span :class="['picker-text', { placeholder: !selectedActions.length }]">
              {{ selectedActions.length ? `已选择 ${selectedActions.length} 个操作` : '选择操作' }}
            </span>
            <span class="picker-arrow">▼</span>
          </div>
          <div v-if="showActionSelect" class="picker-options">
            <div 
              v-for="(option, index) in actionOptions" 
              :key="index"
              class="picker-option"
              @click="toggleAction(option.value, index)"
            >
              <input 
                type="checkbox" 
                :checked="selectedActions.includes(option.value)"
                @click.stop
              />
              <span>{{ option.label }}</span>
            </div>
          </div>
        </div>
        
        <div class="filter-group">
          <span class="filter-label">时间范围</span>
          <div class="date-range">
            <input 
              type="date" 
              v-model="dateFrom"
              class="date-picker"
              placeholder="开始日期"
            />
            <span class="date-separator">至</span>
            <input 
              type="date" 
              v-model="dateTo"
              class="date-picker"
              placeholder="结束日期"
            />
          </div>
        </div>
        
        <div class="filter-actions">
          <button class="clear-btn" @click="clearAllFilters">
            <span>清除筛选</span>
          </button>
          <button class="apply-btn" @click="applyFilters">
            <span>应用筛选</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Statistics cards -->
    <div v-if="statistics && !showAdvancedFilters" class="stats-cards">
      <div class="stat-card">
        <div class="stat-header">
          <span class="stat-title">日志级别分布</span>
        </div>
        <div class="level-stats">
          <div 
            v-for="(count, level) in statistics.entries_by_level"
            :key="level"
            class="level-stat"
          >
            <div 
              class="level-dot"
              :style="{ backgroundColor: getLogLevelColor(level) }"
            ></div>
            <span class="level-name">{{ getLogLevelText(level) }}</span>
            <span class="level-count">{{ count }}</span>
          </div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-header">
          <span class="stat-title">活跃用户</span>
        </div>
        <div class="user-stats">
          <div 
            v-for="user in statistics.top_users.slice(0, 5)"
            :key="user.user_id"
            class="user-stat"
          >
            <span class="user-name">{{ user.user_name }}</span>
            <span class="user-count">{{ user.count }}</span>
          </div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-header">
          <span class="stat-title">错误摘要</span>
        </div>
        <div class="error-stats">
          <div 
            v-for="error in statistics.error_summary"
            :key="error.error_code"
            class="error-stat"
          >
            <span class="error-code">{{ error.error_code }}</span>
            <span class="error-count">{{ error.count }}</span>
            <span class="error-time">{{ formatTime(error.last_occurrence) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="loading-container">
      <span class="loading-text">加载日志中...</span>
    </div>

    <!-- Error state -->
    <div v-if="error" class="error-container">
      <span class="error-text">{{ error }}</span>
      <button class="retry-btn" @click="refreshLogs">
        <span>重试</span>
      </button>
    </div>

    <!-- Logs table -->
    <div v-if="!loading && !error" class="logs-table-container">
      <DataTable
        :columns="logColumns"
        :data="paginatedLogs"
        :loading="loading"
        :empty-text="hasLogs ? '没有找到匹配的日志' : '暂无日志数据'"
        @row-click="onLogClick"
      >
        <!-- Custom column renders -->
        <template #level="{ row }">
          <div class="level-badge" :class="`level-${row.level}`">
            <div 
              class="level-dot"
              :style="{ backgroundColor: getLogLevelColor(row.level) }"
            ></div>
            <span>{{ getLogLevelText(row.level) }}</span>
          </div>
        </template>
        
        <template #user="{ row }">
          <div v-if="row.user_name" class="user-info">
            <span class="user-name">{{ row.user_name }}</span>
            <span class="user-role">{{ row.user_role }}</span>
          </div>
          <span v-else class="system-user">系统</span>
        </template>
        
        <template #action="{ row }">
          <div class="action-info">
            <span class="category">{{ getCategoryText(row.category) }}</span>
            <span class="action">{{ getActionText(row.action) }}</span>
          </div>
        </template>
        
        <template #resource="{ row }">
          <div v-if="row.resource_name" class="resource-info">
            <span class="resource-name">{{ row.resource_name }}</span>
            <span class="resource-type">{{ row.resource_type }}</span>
          </div>
          <span v-else class="no-resource">-</span>
        </template>
        
        <template #timestamp="{ row }">
          <div class="time-info">
            <span class="time">{{ formatTime(row.timestamp) }}</span>
            <span class="date">{{ formatDate(row.timestamp) }}</span>
          </div>
        </template>
        
        <template #actions="{ row }">
          <div class="row-actions">
            <button 
              class="action-btn view"
              @click.stop="viewLogDetails(row)"
            >
              <span>详情</span>
            </button>
            <button 
              v-if="row.level === 'error' || row.level === 'critical'"
              class="action-btn resolve"
              @click.stop="resolveError(row)"
            >
              <span>处理</span>
            </button>
          </div>
        </template>
      </DataTable>
    </div>

    <!-- Pagination -->
    <div v-if="!loading && hasLogs" class="pagination-container">
      <DataPagination
        :current-page="currentPage"
        :total-pages="totalPages"
        :total-items="totalEntries"
        :page-size="pageSize"
        @page-change="changePage"
        @page-size-change="changePageSize"
      />
    </div>

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
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useLogsStore } from '@/stores/logs'
import { usePermissions } from '@/composables/usePermissions'
import DataTable from '@/components/common/DataTable.vue'
import DataPagination from '@/components/common/DataPagination.vue'
import RealtimeIndicator from '@/components/admin/RealtimeIndicator.vue'
import LogDetailsModal from '@/components/admin/LogDetailsModal.vue'
import LogExportModal from '@/components/admin/LogExportModal.vue'
import type { LogAction, LogCategory, LogEntry, LogFilter, LogLevel } from '@/types/logs'

// Store, router and permissions
const router = useRouter()
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

// Custom dropdown states
const showCategorySelect = ref(false)
const showActionSelect = ref(false)

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

function toggleCategory(value: LogCategory, index: number) {
  if (selectedCategories.value.includes(value)) {
    selectedCategories.value = selectedCategories.value.filter(cat => cat !== value)
  } else {
    selectedCategories.value.push(value)
  }
}

function toggleAction(value: LogAction, index: number) {
  if (selectedActions.value.includes(value)) {
    selectedActions.value = selectedActions.value.filter(action => action !== value)
  } else {
    selectedActions.value.push(value)
  }
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
  if (confirm('确认要将此错误标记为已处理吗？')) {
    // Implementation for resolving error
    console.log('错误已标记为已处理')
    alert('错误已标记为已处理')
  }
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
    console.warn('权限不足')
    alert('权限不足')
    router.back()
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
    
    // Custom dropdown styles
    .filter-picker {
      position: relative;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 6px 12px;
      border: 1px solid $border-color;
      border-radius: $border-radius-sm;
      background: $bg-color-white;
      font-size: $font-size-small;
      color: $text-color-secondary;
      min-width: 150px;
      cursor: pointer;
      
      &:hover {
        border-color: $primary-color;
      }
      
      .picker-text {
        &.placeholder {
          color: $text-color-placeholder;
        }
      }
      
      .picker-arrow {
        font-size: 10px;
      }
    }
    
    .picker-options {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      z-index: 10;
      background: white;
      border: 1px solid $border-color;
      border-top: none;
      border-radius: 0 0 $border-radius-sm $border-radius-sm;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
      max-height: 200px;
      overflow-y: auto;
      
      .picker-option {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        font-size: $font-size-small;
        color: $text-color;
        cursor: pointer;
        transition: background-color 0.2s;
        
        &:hover {
          background-color: $bg-color;
        }
        
        input[type="checkbox"] {
          margin: 0;
        }
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