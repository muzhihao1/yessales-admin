<template>
  <view class="customers-page">
    <!-- Header -->
    <view class="page-header">
      <view class="header-content">
        <text class="page-title">客户管理</text>
        <view class="header-stats">
          <text class="stat-item">
            <text class="stat-value">{{ customersStore.totalCount }}</text>
            <text class="stat-label">总客户</text>
          </text>
          <text class="stat-item">
            <text class="stat-value">{{ customersStore.statistics.active }}</text>
            <text class="stat-label">活跃客户</text>
          </text>
          <text class="stat-item">
            <text class="stat-value">{{ customersStore.statistics.business }}</text>
            <text class="stat-label">企业客户</text>
          </text>
          <text class="stat-item">
            <text class="stat-value"
              >¥{{ formatAmount(customersStore.statistics.total_revenue) }}</text
            >
            <text class="stat-label">总成交额</text>
          </text>
        </view>
      </view>
      <view class="header-actions">
        <button class="action-btn add-btn" @click="handleAddCustomer">
          <text class="btn-icon">+</text>
          新增客户
        </button>
        <button class="action-btn import-btn" @click="handleImport">
          <text class="btn-icon">📥</text>
          导入客户
        </button>
        <button class="action-btn export-btn" @click="handleExport" :loading="exporting">
          <text class="btn-icon">📊</text>
          导出数据
        </button>
      </view>
    </view>

    <!-- Filters -->
    <view class="filters-section">
      <view class="filters-row">
        <view class="filter-item">
          <input
            v-model="searchQuery"
            class="search-input"
            placeholder="搜索姓名、电话、公司"
            @input="debounceSearch"
          />
        </view>
        <view class="filter-item">
          <picker
            mode="selector"
            :range="customerTypeOptions"
            :range-key="'label'"
            :value="customerTypeIndex"
            @change="handleCustomerTypeChange"
          >
            <view class="filter-picker">
              <text>{{ customerTypeOptions[customerTypeIndex].label }}</text>
              <text class="picker-arrow">▼</text>
            </view>
          </picker>
        </view>
        <view class="filter-item">
          <picker
            mode="selector"
            :range="statusOptions"
            :range-key="'label'"
            :value="statusIndex"
            @change="handleStatusChange"
          >
            <view class="filter-picker">
              <text>{{ statusOptions[statusIndex].label }}</text>
              <text class="picker-arrow">▼</text>
            </view>
          </picker>
        </view>
        <view class="filter-item">
          <picker
            mode="selector"
            :range="sourceOptions"
            :range-key="'label'"
            :value="sourceIndex"
            @change="handleSourceChange"
          >
            <view class="filter-picker">
              <text>{{ sourceOptions[sourceIndex].label }}</text>
              <text class="picker-arrow">▼</text>
            </view>
          </picker>
        </view>
        <view class="filter-item">
          <input
            v-model="cityFilter"
            class="search-input"
            placeholder="城市筛选"
            @input="debounceSearch"
          />
        </view>
        <button class="filter-reset" @click="resetFilters">重置</button>
      </view>

      <!-- Advanced Filters Toggle -->
      <view class="advanced-filters" v-if="showAdvancedFilters">
        <view class="advanced-filters-row">
          <view class="filter-item">
            <text class="filter-label">创建时间</text>
            <view class="date-range">
              <picker mode="date" :value="startDate" @change="handleStartDateChange">
                <view class="date-picker">
                  <text>{{ startDate || '开始日期' }}</text>
                </view>
              </picker>
              <text class="date-separator">至</text>
              <picker mode="date" :value="endDate" @change="handleEndDateChange">
                <view class="date-picker">
                  <text>{{ endDate || '结束日期' }}</text>
                </view>
              </picker>
            </view>
          </view>
          <view class="filter-item">
            <text class="filter-label">成交金额</text>
            <view class="amount-range">
              <input
                v-model="minAmount"
                class="amount-input"
                placeholder="最小金额"
                type="number"
                @input="debounceSearch"
              />
              <text class="amount-separator">-</text>
              <input
                v-model="maxAmount"
                class="amount-input"
                placeholder="最大金额"
                type="number"
                @input="debounceSearch"
              />
            </view>
          </view>
          <view class="filter-checkbox">
            <checkbox v-model="hasQuotesOnly" @change="handleHasQuotesChange" color="#007AFF" />
            <text class="checkbox-label">仅显示有报价记录的客户</text>
          </view>
        </view>
      </view>

      <button class="advanced-toggle" @click="showAdvancedFilters = !showAdvancedFilters">
        {{ showAdvancedFilters ? '收起高级筛选' : '展开高级筛选' }}
        <text class="toggle-icon">{{ showAdvancedFilters ? '▲' : '▼' }}</text>
      </button>
    </view>

    <!-- Enhanced Data Table -->
    <view class="enhanced-table">
      <!-- Table Header -->
      <view class="table-header">
        <view class="header-row">
          <view v-if="selectedItems.length > 0" class="header-selector">
            <checkbox
              :checked="selectAllChecked"
              :indeterminate="selectAllIndeterminate"
              @change="handleSelectAll"
            />
          </view>
          <view
            v-for="column in columns"
            :key="column.key"
            class="header-cell"
            :class="[`align-${column.align || 'left'}`, { sortable: column.sortable }]"
            :style="{ width: column.width, flex: column.flex }"
            @click="column.sortable && handleSort(column.key)"
          >
            <text class="header-title">{{ column.label }}</text>
            <text v-if="column.sortable" class="sort-icon">
              {{ getSortIcon(column.key) }}
            </text>
          </view>
        </view>
      </view>

      <!-- Table Body -->
      <view class="table-body">
        <!-- Loading State -->
        <TableLoadingSkeleton
          v-if="customersStore.loading"
          :rows="pageSize"
          :columns="columns.length"
          :has-selection="true"
          :show-header="false"
        />

        <!-- Data Rows -->
        <template v-else>
          <DataTableRow
            v-for="customer in customersStore.customers"
            :key="customer.id"
            :item="customer"
            :columns="columns"
            :selectable="true"
            :selected="selectedItems.includes(customer.id)"
            :actions="customerActions"
            :touch-optimized="true"
            @select="handleRowSelect"
            @click="handleRowClick"
            @action="handleRowAction"
          >
            <!-- Custom customer info cell -->
            <template #cell-customer="{ item }">
              <view class="customer-cell">
                <view class="customer-main">
                  <text class="customer-name">{{
                    customersStore.getCustomerDisplayName(item)
                  }}</text>
                  <text class="customer-phone">{{ item.phone }}</text>
                </view>
                <view class="customer-tags">
                  <view :class="['customer-type-tag', `type-${item.customer_type}`]">
                    <text>{{ getCustomerTypeLabel(item.customer_type) }}</text>
                  </view>
                </view>
              </view>
            </template>

            <!-- Custom contact cell -->
            <template #cell-contact="{ item }">
              <view class="contact-cell">
                <text v-if="item.email" class="contact-item">📧 {{ item.email }}</text>
                <text v-if="item.wechat_id" class="contact-item">💬 {{ item.wechat_id }}</text>
                <text v-if="item.address" class="contact-item"
                  >📍 {{ item.city }}{{ item.district }}</text
                >
              </view>
            </template>

            <!-- Custom business metrics cell -->
            <template #cell-business_metrics="{ item }">
              <view class="metrics-cell">
                <text class="metric-item">
                  <text class="metric-value">{{ item.total_quotes || 0 }}</text>
                  <text class="metric-label">报价</text>
                </text>
                <text class="metric-item">
                  <text class="metric-value">¥{{ formatAmount(item.total_amount || 0) }}</text>
                  <text class="metric-label">成交额</text>
                </text>
              </view>
            </template>

            <!-- Custom last activity cell -->
            <template #cell-last_activity="{ item }">
              <text class="date-cell">
                {{ item.last_quote_at ? formatDate(item.last_quote_at) : '无记录' }}
              </text>
            </template>
          </DataTableRow>
        </template>

        <!-- Empty State -->
        <view
          v-if="!customersStore.loading && customersStore.customers.length === 0"
          class="empty-state"
        >
          <text class="empty-text">暂无客户数据</text>
          <button class="empty-action" @click="handleAddCustomer">新增客户</button>
        </view>
      </view>

      <!-- Pagination -->
      <view v-if="customersStore.totalCount > pageSize" class="table-pagination">
        <view class="pagination-info">
          共 {{ customersStore.totalCount }} 条，第 {{ currentPage }}/{{ totalPages }} 页
        </view>
        <view class="pagination-controls">
          <button
            class="pagination-btn"
            :disabled="currentPage <= 1"
            @click="handlePageChange(currentPage - 1)"
          >
            上一页
          </button>
          <button
            class="pagination-btn"
            :disabled="currentPage >= totalPages"
            @click="handlePageChange(currentPage + 1)"
          >
            下一页
          </button>
        </view>
      </view>
    </view>

    <!-- Batch Operations Bar -->
    <BatchOperationBar
      :selected-count="selectedItems.length"
      :operations="batchOperations"
      :show-progress="batchOperating"
      :current-progress="batchProgress"
      :progress-text="batchProgressText"
      :select-all-checked="selectAllChecked"
      :select-all-indeterminate="selectAllIndeterminate"
      @operation="handleBatchOperation"
      @clear-selection="clearSelection"
      @select-all="handleSelectAll"
    />

    <!-- Add Customer Modal -->
    <modal
      v-model:visible="showAddModal"
      title="新增客户"
      @confirm="confirmAddCustomer"
      @cancel="cancelAddCustomer"
    >
      <view class="customer-form">
        <view class="form-row">
          <view class="form-item">
            <text class="form-label">客户姓名 *</text>
            <input v-model="newCustomer.name" class="form-input" placeholder="请输入客户姓名" />
          </view>
          <view class="form-item">
            <text class="form-label">联系电话 *</text>
            <input
              v-model="newCustomer.phone"
              class="form-input"
              placeholder="请输入手机号"
              type="tel"
            />
          </view>
        </view>

        <view class="form-row">
          <view class="form-item">
            <text class="form-label">客户类型 *</text>
            <picker
              mode="selector"
              :range="customerTypeOptions.slice(1)"
              :range-key="'label'"
              :value="newCustomerTypeIndex"
              @change="handleNewCustomerTypeChange"
            >
              <view class="form-picker">
                <text>{{
                  customerTypeOptions[newCustomerTypeIndex + 1]?.label || '请选择类型'
                }}</text>
                <text class="picker-arrow">▼</text>
              </view>
            </picker>
          </view>
          <view class="form-item">
            <text class="form-label">客户来源</text>
            <picker
              mode="selector"
              :range="sourceOptions.slice(1)"
              :range-key="'label'"
              :value="newCustomerSourceIndex"
              @change="handleNewCustomerSourceChange"
            >
              <view class="form-picker">
                <text>{{ sourceOptions[newCustomerSourceIndex + 1]?.label || '请选择来源' }}</text>
                <text class="picker-arrow">▼</text>
              </view>
            </picker>
          </view>
        </view>

        <view class="form-item" v-if="newCustomer.customer_type === 'business'">
          <text class="form-label">公司名称</text>
          <input v-model="newCustomer.company" class="form-input" placeholder="请输入公司名称" />
        </view>

        <view class="form-row">
          <view class="form-item">
            <text class="form-label">邮箱地址</text>
            <input
              v-model="newCustomer.email"
              class="form-input"
              placeholder="请输入邮箱"
              type="email"
            />
          </view>
          <view class="form-item">
            <text class="form-label">微信号</text>
            <input v-model="newCustomer.wechat_id" class="form-input" placeholder="请输入微信号" />
          </view>
        </view>

        <view class="form-row">
          <view class="form-item">
            <text class="form-label">城市</text>
            <input v-model="newCustomer.city" class="form-input" placeholder="请输入城市" />
          </view>
          <view class="form-item">
            <text class="form-label">区域</text>
            <input v-model="newCustomer.district" class="form-input" placeholder="请输入区域" />
          </view>
        </view>

        <view class="form-item">
          <text class="form-label">详细地址</text>
          <input v-model="newCustomer.address" class="form-input" placeholder="请输入详细地址" />
        </view>

        <view class="form-item">
          <text class="form-label">备注信息</text>
          <textarea
            v-model="newCustomer.notes"
            class="form-textarea"
            placeholder="请输入备注信息..."
            maxlength="200"
          />
        </view>
      </view>
    </modal>

    <!-- Export Options Modal -->
    <modal
      v-model:visible="showExportModal"
      title="导出客户数据"
      @confirm="confirmExport"
      @cancel="cancelExport"
    >
      <view class="export-form">
        <view class="form-item">
          <text class="form-label">导出格式</text>
          <picker
            mode="selector"
            :range="exportFormatOptions"
            :range-key="'label'"
            :value="exportFormatIndex"
            @change="handleExportFormatChange"
          >
            <view class="form-picker">
              <text>{{ exportFormatOptions[exportFormatIndex].label }}</text>
              <text class="picker-arrow">▼</text>
            </view>
          </picker>
        </view>

        <view class="form-checkboxes">
          <text class="form-section-title">包含数据</text>
          <view class="checkbox-group">
            <view class="checkbox-item">
              <checkbox v-model="exportOptions.includeQuoteHistory" color="#007AFF" />
              <text class="checkbox-label">报价历史</text>
            </view>
            <view class="checkbox-item">
              <checkbox v-model="exportOptions.includeActivities" color="#007AFF" />
              <text class="checkbox-label">活动记录</text>
            </view>
          </view>
        </view>

        <view class="form-note">
          <text>导出将包含当前筛选条件下的所有客户数据</text>
        </view>
      </view>
    </modal>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from '@dcloudio/uni-app'
import { useCustomersStore } from '@/stores/customers'
import type { CreateCustomerData, Customer, CustomerExportData } from '@/types/customer'
import TableLoadingSkeleton from '@/components/admin/TableLoadingSkeleton.vue'
import DataTableRow from '@/components/admin/DataTableRow.vue'
import ActionButtonGroup from '@/components/admin/ActionButtonGroup.vue'
import BatchOperationBar from '@/components/admin/BatchOperationBar.vue'
import { useTableEnhancements } from '@/composables/useTableEnhancements'
import { commonActions, commonBatchOperations } from '@/components/admin/ActionButtonGroup.vue'
import type { TableColumn } from '@/components/admin/DataTableRow.vue'
import type { ActionItem } from '@/components/admin/ActionButtonGroup.vue'

/**
 * 客户管理页面 - 增强表格版本
 *
 * 功能特性：
 * - 使用增强表格组件系统，提供专业的加载状态和交互体验
 * - 符合PRD要求，客户管理操作简化为[查看][导出] (PRD Line 883)
 * - 支持批量导出功能，提升管理效率
 * - iPad和移动端触控优化
 * - 集成状态管理和选择功能
 *
 * @author Terminal 3 (Admin Frontend Team)
 */

const router = useRouter()
const customersStore = useCustomersStore()

// Enhanced table management
const {
  selectedItems,
  selectAllChecked,
  selectAllIndeterminate,
  toggleSelection,
  selectAll,
  clearSelection,
  handleRowSelect: baseHandleRowSelect
} = useTableEnhancements()

// Table configuration
const columns: TableColumn[] = [
  {
    key: 'customer',
    label: '客户信息',
    width: '250px',
    type: 'text'
  },
  {
    key: 'contact',
    label: '联系方式',
    width: '200px',
    type: 'text'
  },
  {
    key: 'status',
    label: '状态',
    width: '100px',
    align: 'center',
    type: 'status'
  },
  {
    key: 'source',
    label: '来源',
    width: '100px',
    align: 'center',
    type: 'status'
  },
  {
    key: 'business_metrics',
    label: '业务数据',
    width: '150px',
    align: 'center',
    type: 'text'
  },
  {
    key: 'last_activity',
    label: '最后活动',
    width: '120px',
    sortable: true,
    type: 'date'
  },
  {
    key: 'created_at',
    label: '创建时间',
    width: '120px',
    sortable: true,
    type: 'date'
  }
]

// Actions configuration (PRD compliant - only view and export)
const customerActions: ActionItem[] = [commonActions.customers.view, commonActions.customers.export]

// Batch operations (customers support export only per PRD)
const batchOperations = commonBatchOperations.customers

// Sort state
const sortKey = ref('')
const sortOrder = ref<'asc' | 'desc'>('asc')

// Batch operation state
const batchOperating = ref(false)
const batchProgress = ref(0)
const batchProgressText = ref('')

// Computed properties
const totalPages = computed(() => Math.ceil(customersStore.totalCount / pageSize.value))

// Filter states
const searchQuery = ref('')
const cityFilter = ref('')
const customerTypeIndex = ref(0)
const statusIndex = ref(0)
const sourceIndex = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)
const startDate = ref('')
const endDate = ref('')
const minAmount = ref('')
const maxAmount = ref('')
const hasQuotesOnly = ref(false)
const showAdvancedFilters = ref(false)
const exporting = ref(false)

// Filter options
const customerTypeOptions = [
  { value: '', label: '全部类型' },
  { value: 'individual', label: '个人客户' },
  { value: 'business', label: '企业客户' }
]

const statusOptions = [
  { value: '', label: '全部状态' },
  { value: 'active', label: '活跃' },
  { value: 'inactive', label: '停用' },
  { value: 'potential', label: '潜在客户' },
  { value: 'blacklist', label: '黑名单' }
]

const sourceOptions = [
  { value: '', label: '全部来源' },
  { value: 'walk_in', label: '到店咨询' },
  { value: 'referral', label: '朋友推荐' },
  { value: 'online', label: '网络咨询' },
  { value: 'phone', label: '电话咨询' },
  { value: 'exhibition', label: '展会' },
  { value: 'other', label: '其他' }
]

// Modal states
const showAddModal = ref(false)
const showExportModal = ref(false)

// Form states
const newCustomer = ref<CreateCustomerData>({
  name: '',
  phone: '',
  email: '',
  wechat_id: '',
  company: '',
  address: '',
  city: '',
  district: '',
  customer_type: 'individual',
  source: 'walk_in',
  notes: ''
})

const newCustomerTypeIndex = ref(0)
const newCustomerSourceIndex = ref(0)

// Export states
const exportOptions = ref<CustomerExportData>({
  includeQuoteHistory: true,
  includeActivities: false,
  format: 'excel'
})

const exportFormatIndex = ref(0)
const exportFormatOptions = [
  { value: 'excel', label: 'Excel (.xlsx)' },
  { value: 'csv', label: 'CSV (.csv)' }
]

// Load customers on mount
onMounted(() => {
  loadCustomers()
})

// Debounced search
let searchTimer: NodeJS.Timeout
const debounceSearch = () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    currentPage.value = 1
    loadCustomers()
  }, 500)
}

// Load customers with filters
async function loadCustomers() {
  const filters: any = {
    page: currentPage.value,
    pageSize: pageSize.value
  }

  if (searchQuery.value) {
    filters.search = searchQuery.value
  }

  if (cityFilter.value) {
    filters.city = cityFilter.value
  }

  const selectedType = customerTypeOptions[customerTypeIndex.value].value
  if (selectedType) {
    filters.customer_type = selectedType
  }

  const selectedStatus = statusOptions[statusIndex.value].value
  if (selectedStatus) {
    filters.status = selectedStatus
  }

  const selectedSource = sourceOptions[sourceIndex.value].value
  if (selectedSource) {
    filters.source = selectedSource
  }

  if (startDate.value) {
    filters.startDate = startDate.value
  }

  if (endDate.value) {
    filters.endDate = endDate.value
  }

  if (minAmount.value) {
    filters.minAmount = parseFloat(minAmount.value)
  }

  if (maxAmount.value) {
    filters.maxAmount = parseFloat(maxAmount.value)
  }

  if (hasQuotesOnly.value) {
    filters.hasQuotes = true
  }

  await customersStore.fetchCustomers(filters)
}

// Handle filter changes
function handleCustomerTypeChange(e: any) {
  customerTypeIndex.value = e.detail.value
  currentPage.value = 1
  loadCustomers()
}

function handleStatusChange(e: any) {
  statusIndex.value = e.detail.value
  currentPage.value = 1
  loadCustomers()
}

function handleSourceChange(e: any) {
  sourceIndex.value = e.detail.value
  currentPage.value = 1
  loadCustomers()
}

function handleStartDateChange(e: any) {
  startDate.value = e.detail.value
  currentPage.value = 1
  loadCustomers()
}

function handleEndDateChange(e: any) {
  endDate.value = e.detail.value
  currentPage.value = 1
  loadCustomers()
}

function handleHasQuotesChange() {
  currentPage.value = 1
  loadCustomers()
}

function resetFilters() {
  searchQuery.value = ''
  cityFilter.value = ''
  customerTypeIndex.value = 0
  statusIndex.value = 0
  sourceIndex.value = 0
  startDate.value = ''
  endDate.value = ''
  minAmount.value = ''
  maxAmount.value = ''
  hasQuotesOnly.value = false
  currentPage.value = 1
  loadCustomers()
}

// Enhanced table event handlers
function handleRowSelect(selected: boolean, customer: Customer) {
  toggleSelection(customer.id)
}

function handleRowClick(customer: Customer) {
  // Optional: navigate to detail view on row click
  // handleView(customer)
}

function handleRowAction(actionKey: string, customer: Customer) {
  switch (actionKey) {
    case 'view':
      handleView(customer)
      break
    case 'export':
      handleExportSingle(customer)
      break
    default:
      console.warn('Unknown action:', actionKey)
  }
}

function handleSelectAll(event: any) {
  const checked = event.detail ? event.detail.value : event
  selectAll(
    customersStore.customers.map(c => c.id),
    checked
  )
}

function handleSort(columnKey: string) {
  if (sortKey.value === columnKey) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = columnKey
    sortOrder.value = 'asc'
  }
  currentPage.value = 1
  loadCustomers()
}

function getSortIcon(columnKey: string) {
  if (sortKey.value !== columnKey) return '↕'
  return sortOrder.value === 'asc' ? '↑' : '↓'
}

// Handle table events
function handlePageChange(page: number) {
  currentPage.value = page
  loadCustomers()
}

function handleSortChange(sortConfig: { key: string; order: 'asc' | 'desc' }) {
  loadCustomers()
}

// Batch operations handler
async function handleBatchOperation(operationKey: string, count: number) {
  if (operationKey === 'export') {
    await handleBatchExport()
  }
}

// Single customer export
async function handleExportSingle(customer: Customer) {
  try {
    batchOperating.value = true
    batchProgress.value = 50
    batchProgressText.value = '导出客户数据...'

    const exportData: CustomerExportData = {
      ...exportOptions.value,
      customerIds: [customer.id]
    }

    await customersStore.exportCustomers(exportData)

    batchProgress.value = 100
    batchProgressText.value = '导出完成'

    uni.showToast({
      title: '导出成功',
      icon: 'success'
    })
  } catch (error) {
    uni.showToast({
      title: '导出失败',
      icon: 'none'
    })
  } finally {
    setTimeout(() => {
      batchOperating.value = false
      batchProgress.value = 0
      batchProgressText.value = ''
    }, 1000)
  }
}

// Batch export
async function handleBatchExport() {
  try {
    batchOperating.value = true
    batchProgress.value = 0
    batchProgressText.value = `导出 ${selectedItems.value.length} 个客户...`

    const exportData: CustomerExportData = {
      ...exportOptions.value,
      customerIds: selectedItems.value
    }

    // Simulate progress
    const progressInterval = setInterval(() => {
      if (batchProgress.value < 90) {
        batchProgress.value += 10
      }
    }, 200)

    await customersStore.exportCustomers(exportData)

    clearInterval(progressInterval)
    batchProgress.value = 100
    batchProgressText.value = '导出完成'

    uni.showToast({
      title: `成功导出 ${selectedItems.value.length} 个客户`,
      icon: 'success'
    })

    clearSelection()
  } catch (error) {
    uni.showToast({
      title: '批量导出失败',
      icon: 'none'
    })
  } finally {
    setTimeout(() => {
      batchOperating.value = false
      batchProgress.value = 0
      batchProgressText.value = ''
    }, 1000)
  }
}

// Handle customer actions
function handleView(customer: Customer) {
  uni.navigateTo({
    url: `/pages/admin/customers/detail?id=${customer.id}`
  })
}

function handleEdit(customer: Customer) {
  uni.navigateTo({
    url: `/pages/admin/customers/edit?id=${customer.id}`
  })
}

function handleCreateQuote(customer: Customer) {
  // Navigate to quote creation with pre-filled customer info
  uni.navigateTo({
    url: `/pages/admin/quotes/edit?customer_id=${customer.id}`
  })
}

async function handleActivate(customer: Customer) {
  try {
    await customersStore.updateCustomerStatus(customer.id, 'active')
    uni.showToast({
      title: '启用成功',
      icon: 'success'
    })
    loadCustomers()
  } catch (error) {
    uni.showToast({
      title: '启用失败',
      icon: 'none'
    })
  }
}

async function handleDeactivate(customer: Customer) {
  uni.showModal({
    title: '确认停用',
    content: `确定要停用客户 ${customer.name} 吗？`,
    success: async res => {
      if (res.confirm) {
        try {
          await customersStore.updateCustomerStatus(customer.id, 'inactive')
          uni.showToast({
            title: '停用成功',
            icon: 'success'
          })
          loadCustomers()
        } catch (error) {
          uni.showToast({
            title: '停用失败',
            icon: 'none'
          })
        }
      }
    }
  })
}

async function handleDelete(customer: Customer) {
  uni.showModal({
    title: '确认删除',
    content: `确定要删除客户 ${customer.name} 吗？此操作不可撤销。`,
    success: async res => {
      if (res.confirm) {
        try {
          await customersStore.deleteCustomer(customer.id)
          uni.showToast({
            title: '删除成功',
            icon: 'success'
          })
          loadCustomers()
        } catch (error) {
          uni.showToast({
            title: '删除失败',
            icon: 'none'
          })
        }
      }
    }
  })
}

// Handle modals
function handleAddCustomer() {
  newCustomer.value = {
    name: '',
    phone: '',
    email: '',
    wechat_id: '',
    company: '',
    address: '',
    city: '',
    district: '',
    customer_type: 'individual',
    source: 'walk_in',
    notes: ''
  }
  newCustomerTypeIndex.value = 0
  newCustomerSourceIndex.value = 0
  showAddModal.value = true
}

function handleNewCustomerTypeChange(e: any) {
  newCustomerTypeIndex.value = e.detail.value
  newCustomer.value.customer_type = customerTypeOptions[e.detail.value + 1].value as any
}

function handleNewCustomerSourceChange(e: any) {
  newCustomerSourceIndex.value = e.detail.value
  newCustomer.value.source = sourceOptions[e.detail.value + 1].value as any
}

async function confirmAddCustomer() {
  if (!newCustomer.value.name || !newCustomer.value.phone) {
    uni.showToast({
      title: '请填写必填项',
      icon: 'none'
    })
    return
  }

  try {
    await customersStore.createCustomer(newCustomer.value)
    uni.showToast({
      title: '添加成功',
      icon: 'success'
    })
    showAddModal.value = false
    loadCustomers()
  } catch (error) {
    uni.showToast({
      title: '添加失败',
      icon: 'none'
    })
  }
}

function cancelAddCustomer() {
  showAddModal.value = false
}

function handleImport() {
  uni.showToast({
    title: '导入功能开发中',
    icon: 'none'
  })
}

function handleExport() {
  showExportModal.value = true
}

function handleExportFormatChange(e: any) {
  exportFormatIndex.value = e.detail.value
  exportOptions.value.format = exportFormatOptions[e.detail.value].value as any
}

async function confirmExport() {
  exporting.value = true
  try {
    // Include current filters in export
    const exportData: CustomerExportData = {
      ...exportOptions.value,
      customer_type: customerTypeOptions[customerTypeIndex.value].value as any,
      status: statusOptions[statusIndex.value].value as any,
      source: sourceOptions[sourceIndex.value].value as any,
      city: cityFilter.value || undefined,
      startDate: startDate.value || undefined,
      endDate: endDate.value || undefined
    }

    await customersStore.exportCustomers(exportData)
    uni.showToast({
      title: '导出成功',
      icon: 'success'
    })
    showExportModal.value = false
  } catch (error) {
    uni.showToast({
      title: '导出失败',
      icon: 'none'
    })
  } finally {
    exporting.value = false
  }
}

function cancelExport() {
  showExportModal.value = false
}

// Utility functions
function formatAmount(amount: number): string {
  return amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

function formatDate(date: string): string {
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function getCustomerTypeLabel(type: string): string {
  const typeMap: Record<string, string> = {
    individual: '个人',
    business: '企业'
  }
  return typeMap[type] || type
}

function getStatusLabel(status: string): string {
  const statusMap: Record<string, string> = {
    active: '活跃',
    inactive: '停用',
    potential: '潜在',
    blacklist: '黑名单'
  }
  return statusMap[status] || status
}

function getSourceLabel(source: string): string {
  const sourceMap: Record<string, string> = {
    walk_in: '到店',
    referral: '推荐',
    online: '网络',
    phone: '电话',
    exhibition: '展会',
    other: '其他'
  }
  return sourceMap[source] || source
}
</script>

<style lang="scss">
@import '@/styles/variables.scss';

.customers-page {
  padding: 20px;
  background-color: $background-color;
  min-height: 100vh;

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 24px;
    background: white;
    padding: 24px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

    .header-content {
      .page-title {
        font-size: 24px;
        font-weight: 600;
        color: $text-primary;
        margin-bottom: 12px;
        display: block;
      }

      .header-stats {
        display: flex;
        gap: 24px;

        .stat-item {
          display: flex;
          flex-direction: column;
          gap: 4px;

          .stat-value {
            font-size: 20px;
            font-weight: 600;
            color: $primary-color;
          }

          .stat-label {
            font-size: 12px;
            color: $text-secondary;
          }
        }
      }
    }

    .header-actions {
      display: flex;
      gap: 12px;

      .action-btn {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 16px;
        border: none;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.3s ease;

        &.add-btn {
          background: $primary-color;
          color: white;

          &:hover {
            background: darken($primary-color, 10%);
          }
        }

        &.import-btn {
          background: $success-color;
          color: white;

          &:hover {
            background: darken($success-color, 10%);
          }
        }

        &.export-btn {
          background: white;
          color: $text-primary;
          border: 1px solid $border-color;

          &:hover {
            background: #f5f5f5;
          }

          &[loading='true'] {
            opacity: 0.7;
            pointer-events: none;
          }
        }

        .btn-icon {
          font-size: 16px;
        }
      }
    }
  }

  .filters-section {
    background: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    margin-bottom: 20px;

    .filters-row {
      display: flex;
      gap: 16px;
      align-items: center;
      flex-wrap: wrap;

      .filter-item {
        flex: 1;
        min-width: 200px;

        .search-input {
          width: 100%;
          padding: 10px 16px;
          border: 1px solid $border-color;
          border-radius: 6px;
          font-size: 14px;
          transition: all 0.3s ease;

          &:focus {
            border-color: $primary-color;
            outline: none;
          }
        }

        .filter-picker {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 16px;
          border: 1px solid $border-color;
          border-radius: 6px;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.3s ease;

          &:hover {
            border-color: $primary-color;
          }

          .picker-arrow {
            font-size: 12px;
            color: $text-secondary;
          }
        }
      }

      .filter-reset {
        padding: 10px 20px;
        background: white;
        color: $text-secondary;
        border: 1px solid $border-color;
        border-radius: 6px;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.3s ease;

        &:hover {
          color: $primary-color;
          border-color: $primary-color;
        }
      }
    }

    .advanced-filters {
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid $border-color;

      .advanced-filters-row {
        display: flex;
        gap: 20px;
        align-items: flex-end;
        flex-wrap: wrap;

        .filter-item {
          .filter-label {
            display: block;
            margin-bottom: 8px;
            font-size: 14px;
            color: $text-primary;
            font-weight: 500;
          }

          .date-range {
            display: flex;
            align-items: center;
            gap: 12px;

            .date-picker {
              padding: 10px 16px;
              border: 1px solid $border-color;
              border-radius: 6px;
              font-size: 14px;
              cursor: pointer;
              min-width: 120px;
            }

            .date-separator {
              font-size: 14px;
              color: $text-secondary;
            }
          }

          .amount-range {
            display: flex;
            align-items: center;
            gap: 12px;

            .amount-input {
              width: 120px;
              padding: 10px 16px;
              border: 1px solid $border-color;
              border-radius: 6px;
              font-size: 14px;

              &:focus {
                border-color: $primary-color;
                outline: none;
              }
            }

            .amount-separator {
              font-size: 14px;
              color: $text-secondary;
            }
          }
        }

        .filter-checkbox {
          display: flex;
          align-items: center;
          gap: 8px;

          .checkbox-label {
            font-size: 14px;
            color: $text-primary;
          }
        }
      }
    }

    .advanced-toggle {
      margin-top: 16px;
      padding: 8px 16px;
      background: transparent;
      color: $primary-color;
      border: 1px solid $primary-color;
      border-radius: 6px;
      font-size: 14px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;

      &:hover {
        background: $primary-color;
        color: white;
      }

      .toggle-icon {
        font-size: 12px;
      }
    }
  }

  // Enhanced Table Styles
  .enhanced-table {
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    overflow: hidden;

    .table-header {
      background: var(--color-grey-25, #f8f9fa);
      border-bottom: 1px solid var(--border-color-light, #e9ecef);

      .header-row {
        display: flex;
        align-items: center;
        padding: 0 12px;
        min-height: 48px;

        .header-selector {
          flex: none;
          width: 48px;
          display: flex;
          justify-content: center;
          align-items: center;

          checkbox {
            transform: scale(1.1);
          }
        }

        .header-cell {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 8px;
          font-weight: 600;
          color: var(--text-color-primary, #495057);
          font-size: 14px;

          &.sortable {
            cursor: pointer;
            transition: color 0.2s;

            &:hover {
              color: var(--color-primary, #007aff);
            }
          }

          &.align-center {
            justify-content: center;
          }

          &.align-right {
            justify-content: flex-end;
          }

          .header-title {
            white-space: nowrap;
          }

          .sort-icon {
            font-size: 12px;
            color: var(--text-color-secondary, #6c757d);
            font-weight: normal;
          }
        }
      }
    }

    .table-body {
      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 60px 20px;
        background: #fff;

        .empty-text {
          font-size: 16px;
          color: var(--text-color-secondary, #6c757d);
          margin-bottom: 16px;
        }

        .empty-action {
          padding: 10px 20px;
          background: var(--color-primary, #007aff);
          color: #fff;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          cursor: pointer;
          transition: background-color 0.2s;

          &:hover {
            background: var(--color-primary-dark, #0056b3);
          }
        }
      }
    }

    .table-pagination {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      border-top: 1px solid var(--border-color-light, #e9ecef);
      background: var(--color-grey-25, #f8f9fa);

      .pagination-info {
        font-size: 14px;
        color: var(--text-color-secondary, #6c757d);
      }

      .pagination-controls {
        display: flex;
        gap: 8px;

        .pagination-btn {
          padding: 8px 16px;
          border: 1px solid var(--border-color, #dee2e6);
          background: #fff;
          color: var(--text-color-primary, #495057);
          border-radius: 4px;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;

          &:hover:not(:disabled) {
            background: var(--color-primary, #007aff);
            color: #fff;
            border-color: var(--color-primary, #007aff);
          }

          &:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            background: var(--color-grey-100, #f8f9fa);
          }
        }
      }
    }
  }

  // Custom cell styles
  .customer-cell {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;

    .customer-main {
      display: flex;
      flex-direction: column;
      gap: 4px;

      .customer-name {
        font-weight: 500;
        color: $text-primary;
        font-size: 15px;
      }

      .customer-phone {
        font-size: 13px;
        color: $text-secondary;
      }
    }

    .customer-tags {
      .customer-type-tag {
        display: inline-flex;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 500;

        &.type-individual {
          background: #e3f2fd;
          color: #1565c0;
        }

        &.type-business {
          background: #f3e5f5;
          color: #7b1fa2;
        }
      }
    }
  }

  .contact-cell {
    display: flex;
    flex-direction: column;
    gap: 4px;

    .contact-item {
      font-size: 12px;
      color: $text-secondary;
    }
  }

  .status-badge {
    display: inline-flex;
    padding: 4px 12px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 500;

    &.status-active {
      background: #d4edda;
      color: #155724;
    }

    &.status-inactive {
      background: #f8d7da;
      color: #721c24;
    }

    &.status-potential {
      background: #fff3cd;
      color: #856404;
    }

    &.status-blacklist {
      background: #f0f0f0;
      color: #666;
    }
  }

  .source-badge {
    display: inline-flex;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 500;
    background: #f8f9fa;
    color: #495057;
  }

  .metrics-cell {
    display: flex;
    flex-direction: column;
    gap: 4px;

    .metric-item {
      display: flex;
      align-items: center;
      gap: 4px;

      .metric-value {
        font-weight: 500;
        color: $text-primary;
        font-size: 13px;
      }

      .metric-label {
        font-size: 11px;
        color: $text-secondary;
      }
    }
  }

  .date-cell {
    font-size: 13px;
    color: $text-secondary;
  }

  .actions-cell {
    display: flex;
    gap: 6px;
    justify-content: center;
    flex-wrap: wrap;

    .action-btn {
      padding: 4px 8px;
      border: none;
      border-radius: 4px;
      font-size: 12px;
      cursor: pointer;
      transition: all 0.3s ease;

      &.action-view {
        background: #e9ecef;
        color: #495057;

        &:hover {
          background: #dee2e6;
        }
      }

      &.action-edit {
        background: $primary-color;
        color: white;

        &:hover {
          background: darken($primary-color, 10%);
        }
      }

      &.action-quote {
        background: $success-color;
        color: white;

        &:hover {
          background: darken($success-color, 10%);
        }
      }

      &.action-activate {
        background: $success-color;
        color: white;

        &:hover {
          background: darken($success-color, 10%);
        }
      }

      &.action-deactivate {
        background: $warning-color;
        color: white;

        &:hover {
          background: darken($warning-color, 10%);
        }
      }

      &.action-delete {
        background: $danger-color;
        color: white;

        &:hover {
          background: darken($danger-color, 10%);
        }
      }
    }
  }

  // Form styles
  .customer-form {
    .form-row {
      display: flex;
      gap: 16px;

      .form-item {
        flex: 1;
      }
    }

    .form-item {
      margin-bottom: 20px;

      .form-label {
        display: block;
        margin-bottom: 8px;
        font-size: 14px;
        color: $text-primary;
        font-weight: 500;
      }

      .form-input {
        width: 100%;
        padding: 12px;
        border: 1px solid $border-color;
        border-radius: 6px;
        font-size: 14px;

        &:focus {
          border-color: $primary-color;
          outline: none;
        }
      }

      .form-textarea {
        width: 100%;
        min-height: 80px;
        padding: 12px;
        border: 1px solid $border-color;
        border-radius: 6px;
        font-size: 14px;
        resize: vertical;

        &:focus {
          border-color: $primary-color;
          outline: none;
        }
      }

      .form-picker {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px;
        border: 1px solid $border-color;
        border-radius: 6px;
        font-size: 14px;
        cursor: pointer;

        &:hover {
          border-color: $primary-color;
        }

        .picker-arrow {
          font-size: 12px;
          color: $text-secondary;
        }
      }
    }
  }

  .export-form {
    .form-section-title {
      display: block;
      margin-bottom: 12px;
      font-size: 14px;
      font-weight: 600;
      color: $text-primary;
    }

    .checkbox-group {
      display: flex;
      flex-direction: column;
      gap: 12px;

      .checkbox-item {
        display: flex;
        align-items: center;
        gap: 8px;

        .checkbox-label {
          font-size: 14px;
          color: $text-primary;
        }
      }
    }

    .form-note {
      margin-top: 16px;
      padding: 12px;
      background: #f8f9fa;
      border-radius: 6px;
      font-size: 13px;
      color: $text-secondary;
    }
  }
}

// Responsive design
@media (max-width: 768px) {
  .customers-page {
    padding: 16px;

    .page-header {
      flex-direction: column;
      gap: 16px;

      .header-content {
        width: 100%;

        .page-title {
          font-size: 20px;
        }

        .header-stats {
          gap: 16px;
          flex-wrap: wrap;

          .stat-item {
            .stat-value {
              font-size: 18px;
            }
          }
        }
      }

      .header-actions {
        width: 100%;
        flex-wrap: wrap;

        .action-btn {
          flex: 1;
          justify-content: center;
        }
      }
    }

    .filters-section {
      .filters-row {
        flex-direction: column;

        .filter-item {
          width: 100%;
          min-width: auto;
        }

        .filter-reset {
          width: 100%;
        }
      }

      .advanced-filters {
        .advanced-filters-row {
          flex-direction: column;
          align-items: stretch;

          .filter-item {
            .date-range,
            .amount-range {
              flex-direction: column;
              align-items: stretch;
              gap: 8px;

              .date-separator,
              .amount-separator {
                display: none;
              }
            }
          }
        }
      }
    }

    .customer-form {
      .form-row {
        flex-direction: column;
        gap: 0;
      }
    }

    .actions-cell {
      flex-direction: column;
      gap: 4px;

      .action-btn {
        width: 60px;
        text-align: center;
      }
    }
  }
}
</style>
