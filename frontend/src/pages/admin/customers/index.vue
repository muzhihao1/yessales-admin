<template>
  <div class="customers-page">
    <!-- Header -->
    <div class="page-header">
      <div class="header-content">
        <span class="page-title">客户管理</span>
        <div class="header-stats">
          <span class="stat-item">
            <span class="stat-value">{{ customersStore.totalCount }}</span>
            <span class="stat-label">总客户</span>
          </span>
          <span class="stat-item">
            <span class="stat-value">{{ customersStore.statistics?.active || 0 }}</span>
            <span class="stat-label">活跃客户</span>
          </span>
          <span class="stat-item">
            <span class="stat-value">{{ customersStore.statistics?.business || 0 }}</span>
            <span class="stat-label">企业客户</span>
          </span>
          <span class="stat-item">
            <span class="stat-value"
              >¥{{ formatAmount(customersStore.statistics?.total_revenue || 0) }}</span
            >
            <span class="stat-label">总成交额</span>
          </span>
        </div>
      </div>
      <div class="header-actions">
        <button class="action-btn add-btn" @click="handleAddCustomer">
          <span class="btn-icon">+</span>
          新增客户
        </button>
        <button class="action-btn import-btn" @click="handleImport">
          <span class="btn-icon">📥</span>
          导入客户
        </button>
        <button class="action-btn export-btn" @click="handleExport" :disabled="exporting">
          <span class="btn-icon">📊</span>
          导出数据
        </button>
      </div>
    </div>

    <!-- Filters -->
    <div class="filters-section">
      <div class="filters-row">
        <div class="filter-item">
          <input
            v-model="searchQuery"
            class="search-input"
            placeholder="搜索姓名、电话、公司"
            @input="debounceSearch"
          />
        </div>
        <div class="filter-item">
          <select
            v-model="customerTypeIndex"
            class="filter-select"
            @change="handleCustomerTypeChange"
          >
            <option
              v-for="(option, index) in customerTypeOptions || []"
              :key="option.value"
              :value="index"
            >
              {{ option.label }}
            </option>
          </select>
        </div>
        <div class="filter-item">
          <select v-model="statusIndex" class="filter-select" @change="handleStatusChange">
            <option
              v-for="(option, index) in statusOptions || []"
              :key="option.value"
              :value="index"
            >
              {{ option.label }}
            </option>
          </select>
        </div>
        <div class="filter-item">
          <select v-model="sourceIndex" class="filter-select" @change="handleSourceChange">
            <option
              v-for="(option, index) in sourceOptions || []"
              :key="option.value"
              :value="index"
            >
              {{ option.label }}
            </option>
          </select>
        </div>
        <div class="filter-item">
          <input
            v-model="cityFilter"
            class="search-input"
            placeholder="城市筛选"
            @input="debounceSearch"
          />
        </div>
        <button class="filter-reset" @click="resetFilters">重置</button>
      </div>

      <!-- Advanced Filters Toggle -->
      <div class="advanced-filters" v-if="showAdvancedFilters">
        <div class="advanced-filters-row">
          <div class="filter-item">
            <span class="filter-label">创建时间</span>
            <div class="date-range">
              <div class="date-picker" @click="handleStartDateClick">
                <span>{{ startDate || '开始日期' }}</span>
              </div>
              <span class="date-separator">至</span>
              <div class="date-picker" @click="handleEndDateClick">
                <span>{{ endDate || '结束日期' }}</span>
              </div>
            </div>
          </div>
          <div class="filter-item">
            <span class="filter-label">成交金额</span>
            <div class="amount-range">
              <input
                v-model="minAmount"
                class="amount-input"
                placeholder="最小金额"
                type="number"
                @input="debounceSearch"
              />
              <span class="amount-separator">-</span>
              <input
                v-model="maxAmount"
                class="amount-input"
                placeholder="最大金额"
                type="number"
                @input="debounceSearch"
              />
            </div>
          </div>
          <div class="filter-checkbox">
            <input type="checkbox" v-model="hasQuotesOnly" @change="handleHasQuotesChange" />
            <span class="checkbox-label">仅显示有报价记录的客户</span>
          </div>
        </div>
      </div>

      <button class="advanced-toggle" @click="showAdvancedFilters = !showAdvancedFilters">
        {{ showAdvancedFilters ? '收起高级筛选' : '展开高级筛选' }}
        <span class="toggle-icon">{{ showAdvancedFilters ? '▲' : '▼' }}</span>
      </button>
    </div>

    <!-- Enhanced Data Table -->
    <div class="enhanced-table">
      <!-- Table Header -->
      <div class="table-header">
        <div class="header-row">
          <div v-if="(selectedItems || []).length > 0" class="header-selector">
            <input
              type="checkbox"
              :checked="selectAllChecked"
              :indeterminate="selectAllIndeterminate"
              @change="handleSelectAll"
            />
          </div>
          <div
            v-for="column in columns"
            :key="column.key"
            class="header-cell"
            :class="[`align-${column.align || 'left'}`, { sortable: column.sortable }]"
            :style="{ width: column.width, flex: column.flex }"
            @click="column.sortable && handleSort(column.key)"
          >
            <span class="header-title">{{ column.label }}</span>
            <span v-if="column.sortable" class="sort-icon">
              {{ getSortIcon(column.key) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Table Body -->
      <div class="table-body">
        <!-- Loading State -->
        <div v-if="customersStore.loading" class="loading-state">
          <span>加载中...</span>
        </div>

        <!-- Data Rows -->
        <template v-else>
          <div
            v-for="customer in customersStore.customers || []"
            :key="customer.id"
            class="table-row"
            @click="handleRowClick(customer)"
          >
            <div class="row-content">
              <div class="row-checkbox">
                <input
                  type="checkbox"
                  :checked="(selectedItems || []).includes(customer.id)"
                  @change="handleRowSelect($event.target.checked, customer)"
                />
              </div>
              <!-- Customer info cell -->
              <div class="customer-cell">
                <div class="customer-main">
                  <span class="customer-name">{{
                    customersStore.getCustomerDisplayName(customer)
                  }}</span>
                  <span class="customer-phone">{{ customer.phone }}</span>
                </div>
                <div class="customer-tags">
                  <div :class="['customer-type-tag', `type-${customer.customer_type}`]">
                    <span>{{ getCustomerTypeLabel(customer.customer_type) }}</span>
                  </div>
                </div>
              </div>

              <!-- Contact cell -->
              <div class="contact-cell">
                <span v-if="customer.email" class="contact-item">📧 {{ customer.email }}</span>
                <span v-if="customer.wechat_id" class="contact-item"
                  >💬 {{ customer.wechat_id }}</span
                >
                <span v-if="customer.address" class="contact-item"
                  >📍 {{ customer.city }}{{ customer.district }}</span
                >
              </div>

              <!-- Business metrics cell -->
              <div class="metrics-cell">
                <span class="metric-item">
                  <span class="metric-value">{{ customer.total_quotes || 0 }}</span>
                  <span class="metric-label">报价</span>
                </span>
                <span class="metric-item">
                  <span class="metric-value">¥{{ formatAmount(customer.total_amount || 0) }}</span>
                  <span class="metric-label">成交额</span>
                </span>
              </div>

              <!-- Last activity cell -->
              <span class="date-cell">
                {{ customer.last_quote_at ? formatDate(customer.last_quote_at) : '无记录' }}
              </span>

              <!-- Actions cell -->
              <div class="actions-cell">
                <button class="action-btn action-view" @click.stop="handleView(customer)">
                  查看
                </button>
                <button class="action-btn action-export" @click.stop="handleExportSingle(customer)">
                  导出
                </button>
              </div>
            </div>
          </div>
        </template>

        <!-- Empty State -->
        <div
          v-if="
            !customersStore.loading &&
            (!customersStore.customers || customersStore.customers.length === 0)
          "
          class="empty-state"
        >
          <span class="empty-text">暂无客户数据</span>
          <button class="empty-action" @click="handleAddCustomer">新增客户</button>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="customersStore.totalCount > pageSize" class="table-pagination">
        <div class="pagination-info">
          共 {{ customersStore.totalCount }} 条，第 {{ currentPage }}/{{ totalPages }} 页
        </div>
        <div class="pagination-controls">
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
        </div>
      </div>
    </div>

    <!-- Batch Operations Bar -->
    <div v-if="(selectedItems || []).length > 0" class="batch-operations-bar">
      <div class="batch-info">
        <span>已选择 {{ (selectedItems || []).length }} 项</span>
      </div>
      <div class="batch-actions">
        <button class="batch-btn export-btn" @click="handleBatchExport">批量导出</button>
        <button class="batch-btn clear-btn" @click="clearSelection">清空选择</button>
      </div>
    </div>

    <!-- Add Customer Modal -->
    <div v-if="showAddModal" class="modal-backdrop" @click.self="cancelAddCustomer">
      <div class="modal">
        <div class="modal-header">
          <span class="modal-title">新增客户</span>
          <button class="modal-close" @click="cancelAddCustomer">×</button>
        </div>
        <div class="modal-body">
          <div class="customer-form">
            <div class="form-row">
              <div class="form-item">
                <span class="form-label">客户姓名 *</span>
                <input v-model="newCustomer.name" class="form-input" placeholder="请输入客户姓名" />
              </div>
              <div class="form-item">
                <span class="form-label">联系电话 *</span>
                <input
                  v-model="newCustomer.phone"
                  class="form-input"
                  placeholder="请输入手机号"
                  type="tel"
                />
              </div>
            </div>

            <div class="form-row">
              <div class="form-item">
                <span class="form-label">客户类型 *</span>
                <select
                  v-model="newCustomerTypeIndex"
                  class="form-select"
                  @change="handleNewCustomerTypeSelect"
                >
                  <option
                    v-for="(option, index) in customerTypeOptions.slice(1)"
                    :key="option.value"
                    :value="index"
                  >
                    {{ option.label }}
                  </option>
                </select>
              </div>
              <div class="form-item">
                <span class="form-label">客户来源</span>
                <select
                  v-model="newCustomerSourceIndex"
                  class="form-select"
                  @change="handleNewCustomerSourceSelect"
                >
                  <option
                    v-for="(option, index) in sourceOptions.slice(1)"
                    :key="option.value"
                    :value="index"
                  >
                    {{ option.label }}
                  </option>
                </select>
              </div>
            </div>

            <div class="form-item" v-if="newCustomer.customer_type === 'business'">
              <span class="form-label">公司名称</span>
              <input
                v-model="newCustomer.company"
                class="form-input"
                placeholder="请输入公司名称"
              />
            </div>

            <div class="form-row">
              <div class="form-item">
                <span class="form-label">邮箱地址</span>
                <input
                  v-model="newCustomer.email"
                  class="form-input"
                  placeholder="请输入邮箱"
                  type="email"
                />
              </div>
              <div class="form-item">
                <span class="form-label">微信号</span>
                <input
                  v-model="newCustomer.wechat_id"
                  class="form-input"
                  placeholder="请输入微信号"
                />
              </div>
            </div>

            <div class="form-row">
              <div class="form-item">
                <span class="form-label">城市</span>
                <input v-model="newCustomer.city" class="form-input" placeholder="请输入城市" />
              </div>
              <div class="form-item">
                <span class="form-label">区域</span>
                <input v-model="newCustomer.district" class="form-input" placeholder="请输入区域" />
              </div>
            </div>

            <div class="form-item">
              <span class="form-label">详细地址</span>
              <input
                v-model="newCustomer.address"
                class="form-input"
                placeholder="请输入详细地址"
              />
            </div>

            <div class="form-item">
              <span class="form-label">备注信息</span>
              <textarea
                v-model="newCustomer.notes"
                class="form-textarea"
                placeholder="请输入备注信息..."
                maxlength="200"
              />
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="cancelAddCustomer">取消</button>
          <button class="btn-confirm" @click="confirmAddCustomer">确定</button>
        </div>
      </div>
    </div>

    <!-- Export Options Modal -->
    <div v-if="showExportModal" class="modal-backdrop" @click.self="cancelExport">
      <div class="modal">
        <div class="modal-header">
          <span class="modal-title">导出客户数据</span>
          <button class="modal-close" @click="cancelExport">×</button>
        </div>
        <div class="modal-body">
          <div class="export-form">
            <div class="form-item">
              <span class="form-label">导出格式</span>
              <select
                v-model="exportFormatIndex"
                class="form-select"
                @change="handleExportFormatSelect"
              >
                <option
                  v-for="(option, index) in exportFormatOptions"
                  :key="option.value"
                  :value="index"
                >
                  {{ option.label }}
                </option>
              </select>
            </div>

            <div class="form-checkboxes">
              <span class="form-section-title">包含数据</span>
              <div class="checkbox-group">
                <div class="checkbox-item">
                  <input type="checkbox" v-model="exportOptions.includeQuoteHistory" />
                  <span class="checkbox-label">报价历史</span>
                </div>
                <div class="checkbox-item">
                  <input type="checkbox" v-model="exportOptions.includeActivities" />
                  <span class="checkbox-label">活动记录</span>
                </div>
              </div>
            </div>

            <div class="form-note">
              <span>导出将包含当前筛选条件下的所有客户数据</span>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="cancelExport">取消</button>
          <button class="btn-confirm" @click="confirmExport">确定</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useCustomersStore } from '@/stores/customers'
import type { CreateCustomerData, Customer, CustomerExportData } from '@/types/customer'
// Removed unused imports for cleaner web implementation
// import TableLoadingSkeleton from '@/components/admin/TableLoadingSkeleton.vue'
// import DataTableRow from '@/components/admin/DataTableRow.vue'
// import ActionButtonGroup from '@/components/admin/ActionButtonGroup.vue'
// import BatchOperationBar from '@/components/admin/BatchOperationBar.vue'
// import { useTableEnhancements } from '@/composables/useTableEnhancements'
// import { commonActions, commonBatchOperations } from '@/utils/common-actions'
// import type { TableColumn } from '@/components/admin/DataTableRow.vue'
// import type { ActionItem } from '@/components/admin/ActionButtonGroup.vue'

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

// Simple state management for table selection
const selectedItems = ref<string[]>([])
const selectAllChecked = computed(() => {
  const customerIds = (customersStore.customers || []).map(c => c.id)
  return customerIds.length > 0 && selectedItems.value.length === customerIds.length
})
const selectAllIndeterminate = computed(() => {
  const customerIds = (customersStore.customers || []).map(c => c.id)
  return selectedItems.value.length > 0 && selectedItems.value.length < customerIds.length
})

function toggleSelection(id: string) {
  const index = selectedItems.value.indexOf(id)
  if (index > -1) {
    selectedItems.value.splice(index, 1)
  } else {
    selectedItems.value.push(id)
  }
}

function selectAll(ids: string[], checked: boolean) {
  if (checked) {
    selectedItems.value = [...ids]
  } else {
    selectedItems.value = []
  }
}

function clearSelection() {
  selectedItems.value = []
}

// Simplified table configuration without complex types
const columns = [
  { key: 'customer', label: '客户信息', width: '250px' },
  { key: 'contact', label: '联系方式', width: '200px' },
  { key: 'status', label: '状态', width: '100px' },
  { key: 'source', label: '来源', width: '100px' },
  { key: 'business_metrics', label: '业务数据', width: '150px' },
  { key: 'last_activity', label: '最后活动', width: '120px', sortable: true },
  { key: 'created_at', label: '创建时间', width: '120px', sortable: true }
]

// Actions configuration (PRD compliant - only view and export)
const customerActions = [
  { key: 'view', label: '查看', type: 'primary' },
  { key: 'export', label: '导出', type: 'default' }
]

// Batch operations (customers support export only per PRD)
const batchOperations = [{ key: 'export', label: '批量导出', type: 'primary' }]

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
  customerTypeIndex.value = e.target.value
  currentPage.value = 1
  loadCustomers()
}

function handleStatusChange(e: any) {
  statusIndex.value = e.target.value
  currentPage.value = 1
  loadCustomers()
}

function handleSourceChange(e: any) {
  sourceIndex.value = e.target.value
  currentPage.value = 1
  loadCustomers()
}

function handleStartDateClick() {
  const dateInput = document.createElement('input')
  dateInput.type = 'date'
  dateInput.value = startDate.value
  dateInput.onchange = (e: any) => {
    startDate.value = e.target.value
    currentPage.value = 1
    loadCustomers()
  }
  dateInput.click()
}

function handleEndDateClick() {
  const dateInput = document.createElement('input')
  dateInput.type = 'date'
  dateInput.value = endDate.value
  dateInput.onchange = (e: any) => {
    endDate.value = e.target.value
    currentPage.value = 1
    loadCustomers()
  }
  dateInput.click()
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
  const checked = event.target ? event.target.checked : event
  selectAll(
    (customersStore.customers || []).map(c => c.id),
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

    console.log('导出成功')
    alert('导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    alert('导出失败')
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
    batchProgressText.value = `导出 ${(selectedItems.value || []).length} 个客户...`

    const exportData: CustomerExportData = {
      ...exportOptions.value,
      customerIds: selectedItems.value || []
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

    console.log(`成功导出 ${(selectedItems.value || []).length} 个客户`)
    alert(`成功导出 ${(selectedItems.value || []).length} 个客户`)

    clearSelection()
  } catch (error) {
    console.error('批量导出失败:', error)
    alert('批量导出失败')
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
  router.push(`/admin/customers/detail?id=${customer.id}`)
}

function handleEdit(customer: Customer) {
  router.push(`/admin/customers/edit?id=${customer.id}`)
}

function handleCreateQuote(customer: Customer) {
  // Navigate to quote creation with pre-filled customer info
  router.push(`/admin/quotes/edit?customer_id=${customer.id}`)
}

async function handleActivate(customer: Customer) {
  try {
    await customersStore.updateCustomerStatus(customer.id, 'active')
    console.log('启用成功')
    alert('启用成功')
    loadCustomers()
  } catch (error) {
    console.error('启用失败:', error)
    alert('启用失败')
  }
}

async function handleDeactivate(customer: Customer) {
  if (confirm(`确定要停用客户 ${customer.name} 吗？`)) {
    try {
      await customersStore.updateCustomerStatus(customer.id, 'inactive')
      console.log('停用成功')
      alert('停用成功')
      loadCustomers()
    } catch (error) {
      console.error('停用失败:', error)
      alert('停用失败')
    }
  }
}

async function handleDelete(customer: Customer) {
  if (confirm(`确定要删除客户 ${customer.name} 吗？此操作不可撤销。`)) {
    try {
      await customersStore.deleteCustomer(customer.id)
      console.log('删除成功')
      alert('删除成功')
      loadCustomers()
    } catch (error) {
      console.error('删除失败:', error)
      alert('删除失败')
    }
  }
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

function handleNewCustomerTypeSelect() {
  newCustomer.value.customer_type = customerTypeOptions[newCustomerTypeIndex.value + 1].value as any
}

function handleNewCustomerSourceSelect() {
  newCustomer.value.source = sourceOptions[newCustomerSourceIndex.value + 1].value as any
}

async function confirmAddCustomer() {
  if (!newCustomer.value.name || !newCustomer.value.phone) {
    alert('请填写必填项')
    return
  }

  try {
    await customersStore.createCustomer(newCustomer.value)
    console.log('添加成功')
    alert('添加成功')
    showAddModal.value = false
    loadCustomers()
  } catch (error) {
    console.error('添加失败:', error)
    alert('添加失败')
  }
}

function cancelAddCustomer() {
  showAddModal.value = false
}

function handleImport() {
  alert('导入功能开发中')
}

function handleExport() {
  showExportModal.value = true
}

function handleExportFormatSelect() {
  exportOptions.value.format = exportFormatOptions[exportFormatIndex.value].value as any
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
    console.log('导出成功')
    alert('导出成功')
    showExportModal.value = false
  } catch (error) {
    console.error('导出失败:', error)
    alert('导出失败')
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
  background-color: $bg-color;
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
        color: $text-color;
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
            color: $text-color-secondary;
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
          color: $text-color;
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

        .filter-select {
          width: 100%;
          padding: 10px 16px;
          border: 1px solid $border-color;
          border-radius: 6px;
          font-size: 14px;
          background: white;
          cursor: pointer;
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
            color: $text-color-secondary;
          }
        }
      }

      .filter-reset {
        padding: 10px 20px;
        background: white;
        color: $text-color-secondary;
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
            color: $text-color;
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
              color: $text-color-secondary;
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
              color: $text-color-secondary;
            }
          }
        }

        .filter-checkbox {
          display: flex;
          align-items: center;
          gap: 8px;

          .checkbox-label {
            font-size: 14px;
            color: $text-color;
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

  // Table row styles
  .table-row {
    border-bottom: 1px solid var(--border-color-light, #e9ecef);
    cursor: pointer;
    transition: background-color 0.2s;

    &:hover {
      background-color: var(--color-grey-25, #f8f9fa);
    }

    .row-content {
      display: flex;
      align-items: center;
      padding: 12px;
      gap: 16px;

      .row-checkbox {
        flex: none;
        width: 48px;
        display: flex;
        justify-content: center;
      }
    }
  }

  .loading-state {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 60px 20px;
    color: var(--text-color-secondary, #6c757d);
  }

  .batch-operations-bar {
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: white;
    padding: 16px 24px;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    display: flex;
    align-items: center;
    gap: 20px;
    z-index: 1000;

    .batch-info {
      font-size: 14px;
      color: var(--text-color-primary, #495057);
      font-weight: 500;
    }

    .batch-actions {
      display: flex;
      gap: 12px;

      .batch-btn {
        padding: 8px 16px;
        border: none;
        border-radius: 6px;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.2s;

        &.export-btn {
          background: var(--color-primary, #007aff);
          color: white;

          &:hover {
            background: var(--color-primary-dark, #0056b3);
          }
        }

        &.clear-btn {
          background: var(--color-grey-200, #e9ecef);
          color: var(--text-color-secondary, #6c757d);

          &:hover {
            background: var(--color-grey-300, #dee2e6);
          }
        }
      }
    }
  }

  // Modal styles
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 2000;

    .modal {
      background: white;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
      max-width: 600px;
      width: 90vw;
      max-height: 90vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;

      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px 24px;
        border-bottom: 1px solid var(--border-color-light, #e9ecef);

        .modal-title {
          font-size: 18px;
          font-weight: 600;
          color: var(--text-color-primary, #495057);
        }

        .modal-close {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: var(--text-color-secondary, #6c757d);

          &:hover {
            color: var(--text-color-primary, #495057);
          }
        }
      }

      .modal-body {
        padding: 24px;
        overflow-y: auto;
        flex: 1;
      }

      .modal-footer {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        padding: 20px 24px;
        border-top: 1px solid var(--border-color-light, #e9ecef);

        .btn-cancel {
          padding: 10px 20px;
          background: var(--color-grey-200, #e9ecef);
          color: var(--text-color-secondary, #6c757d);
          border: none;
          border-radius: 6px;
          cursor: pointer;

          &:hover {
            background: var(--color-grey-300, #dee2e6);
          }
        }

        .btn-confirm {
          padding: 10px 20px;
          background: var(--color-primary, #007aff);
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;

          &:hover {
            background: var(--color-primary-dark, #0056b3);
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
    flex: 1;
    min-width: 250px;

    .customer-main {
      display: flex;
      flex-direction: column;
      gap: 4px;

      .customer-name {
        font-weight: 500;
        color: $text-color;
        font-size: 15px;
      }

      .customer-phone {
        font-size: 13px;
        color: $text-color-secondary;
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
    flex: 1;
    min-width: 200px;

    .contact-item {
      font-size: 12px;
      color: $text-color-secondary;
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
    flex: 1;
    min-width: 150px;

    .metric-item {
      display: flex;
      align-items: center;
      gap: 4px;

      .metric-value {
        font-weight: 500;
        color: $text-color;
        font-size: 13px;
      }

      .metric-label {
        font-size: 11px;
        color: $text-color-secondary;
      }
    }
  }

  .date-cell {
    font-size: 13px;
    color: $text-color-secondary;
    flex: 1;
    min-width: 120px;
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
        color: $text-color;
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

      .form-select {
        width: 100%;
        padding: 12px;
        border: 1px solid $border-color;
        border-radius: 6px;
        font-size: 14px;
        background: white;
        cursor: pointer;

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
          color: $text-color-secondary;
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
      color: $text-color;
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
          color: $text-color;
        }
      }
    }

    .form-note {
      margin-top: 16px;
      padding: 12px;
      background: #f8f9fa;
      border-radius: 6px;
      font-size: 13px;
      color: $text-color-secondary;
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
