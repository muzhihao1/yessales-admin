<template>
  <view class="quotes-page">
    <!-- Header -->
    <view class="page-header">
      <view class="header-content">
        <text class="page-title">报价单管理</text>
        <view class="header-stats">
          <text class="stat-item">
            <text class="stat-value">{{ quotesStore.totalCount }}</text>
            <text class="stat-label">总报价单</text>
          </text>
          <text class="stat-item">
            <text class="stat-value">{{ quotesStore.statistics.pending }}</text>
            <text class="stat-label">待审批</text>
          </text>
        </view>
      </view>
      <view class="header-actions">
        <button class="export-btn" @click="handleExport" :loading="exporting">
          <text class="btn-icon">📊</text>
          导出报表
        </button>
      </view>
    </view>

    <!-- Filters -->
    <view class="filters-section">
      <view class="filters-row">
        <view class="filter-item">
          <input
            v-model="searchPhone"
            class="search-input"
            placeholder="搜索手机号码"
            @input="debounceSearch"
          />
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
          <picker mode="date" :value="startDate" @change="handleStartDateChange">
            <view class="filter-picker">
              <text>{{ startDate || '开始日期' }}</text>
              <text class="picker-arrow">▼</text>
            </view>
          </picker>
        </view>
        <view class="filter-item">
          <picker mode="date" :value="endDate" @change="handleEndDateChange">
            <view class="filter-picker">
              <text>{{ endDate || '结束日期' }}</text>
              <text class="picker-arrow">▼</text>
            </view>
          </picker>
        </view>
        <button class="filter-reset" @click="resetFilters">重置</button>
      </view>
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
            <text class="header-title">{{ column.title }}</text>
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
          v-if="quotesStore.loading"
          :rows="pageSize"
          :columns="columns.length"
          :has-selection="true"
          :show-header="false"
        />

        <!-- Data Rows -->
        <template v-else>
          <DataTableRow
            v-for="quote in quotesStore.quotes"
            :key="quote.id"
            :item="quote"
            :columns="enhancedColumns"
            :selectable="true"
            :selected="selectedItems.includes(quote.id)"
            :actions="getQuoteActions(quote)"
            :touch-optimized="true"
            @select="handleRowSelect"
            @click="handleRowClick"
            @action="handleRowAction"
          >
            <!-- Custom customer cell -->
            <template #cell-customer="{ item }">
              <view class="customer-cell">
                <text class="customer-name">{{ item.customer_name }}</text>
                <text class="customer-phone">{{ item.customer_phone }}</text>
              </view>
            </template>

            <!-- Custom products cell -->
            <template #cell-products="{ item }">
              <view class="products-cell">
                <text class="product-count">{{ item.items?.length || 0 }} 个产品</text>
              </view>
            </template>

            <!-- Custom amount cell -->
            <template #cell-amount="{ item }">
              <text class="amount-cell">¥{{ formatAmount(item.total_amount) }}</text>
            </template>
          </DataTableRow>
        </template>

        <!-- Empty State -->
        <view v-if="!quotesStore.loading && quotesStore.quotes.length === 0" class="empty-state">
          <text class="empty-text">暂无报价单数据</text>
        </view>
      </view>

      <!-- Pagination -->
      <view v-if="quotesStore.totalCount > pageSize" class="table-pagination">
        <view class="pagination-info">
          共 {{ quotesStore.totalCount }} 条，第 {{ currentPage }}/{{ totalPages }} 页
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

    <!-- Reject Modal -->
    <modal
      v-model:visible="showRejectModal"
      title="拒绝报价单"
      @confirm="confirmReject"
      @cancel="cancelReject"
    >
      <view class="reject-modal">
        <text class="modal-label">拒绝原因（可选）：</text>
        <textarea
          v-model="rejectReason"
          class="reject-textarea"
          placeholder="请输入拒绝原因..."
          maxlength="200"
        />
      </view>
    </modal>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from '@dcloudio/uni-app'
import { useQuotesStore } from '@/stores/quotes'
import type { Quote } from '@/types/quote'
import TableLoadingSkeleton from '@/components/admin/TableLoadingSkeleton.vue'
import DataTableRow from '@/components/admin/DataTableRow.vue'
import BatchOperationBar from '@/components/admin/BatchOperationBar.vue'
import { useTableEnhancements } from '@/composables/useTableEnhancements'
import { commonActions, commonBatchOperations } from '@/components/admin/ActionButtonGroup.vue'
import type { TableColumn } from '@/components/admin/DataTableRow.vue'
import type { ActionItem } from '@/components/admin/ActionButtonGroup.vue'

/**
 * 报价管理页面 - 增强表格版本
 *
 * 功能特性：
 * - 使用增强表格组件系统，提供专业的加载状态和交互体验
 * - 支持报价审批流程：查看、批准、拒绝、编辑（根据状态动态显示）
 * - 支持批量操作：导出、批量审批
 * - iPad和移动端触控优化
 * - 集成状态管理和选择功能
 *
 * @author Terminal 3 (Admin Frontend Team)
 */

const router = useRouter()
const quotesStore = useQuotesStore()

// Enhanced table management
const {
  selectedItems,
  selectAllChecked,
  selectAllIndeterminate,
  toggleSelection,
  selectAll,
  clearSelection
} = useTableEnhancements()

// Table configuration
const columns: TableColumn[] = [
  {
    key: 'quote_number',
    title: '报价单号',
    width: '150px',
    sortable: true
  },
  {
    key: 'customer',
    title: '客户信息',
    width: '200px'
  },
  {
    key: 'products',
    title: '产品',
    width: '120px'
  },
  {
    key: 'amount',
    title: '总金额',
    width: '120px',
    align: 'right',
    sortable: true
  },
  {
    key: 'status',
    title: '状态',
    width: '100px',
    align: 'center'
  },
  {
    key: 'created_at',
    title: '创建时间',
    width: '150px',
    sortable: true
  }
]

// Enhanced columns for DataTableRow (converted from old format)
const enhancedColumns: TableColumn[] = columns.map(col => ({
  key: col.key,
  label: col.title,
  width: col.width,
  align: col.align,
  sortable: col.sortable,
  type:
    col.key === 'amount'
      ? 'price'
      : col.key === 'created_at'
        ? 'date'
        : col.key === 'status'
          ? 'status'
          : 'text'
}))

// Dynamic actions based on quote status
function getQuoteActions(quote: Quote): ActionItem[] {
  const actions: ActionItem[] = [commonActions.quotes.view]

  if (quote.status === 'submitted') {
    actions.push(commonActions.quotes.approve, commonActions.quotes.reject)
  } else if (quote.status === 'draft') {
    actions.push(commonActions.quotes.edit)
  }

  return actions
}

// Batch operations (quotes support export and batch approval)
const batchOperations = commonBatchOperations.quotes

// Sort state
const sortKey = ref('')
const sortOrder = ref<'asc' | 'desc'>('asc')

// Batch operation state
const batchOperating = ref(false)
const batchProgress = ref(0)
const batchProgressText = ref('')

// Computed properties
const totalPages = computed(() => Math.ceil(quotesStore.totalCount / pageSize.value))

// Filter states
const searchPhone = ref('')
const statusIndex = ref(0)
const startDate = ref('')
const endDate = ref('')
const currentPage = ref(1)
const pageSize = ref(20)

const statusOptions = [
  { value: '', label: '全部状态' },
  { value: 'draft', label: '草稿' },
  { value: 'submitted', label: '待审批' },
  { value: 'approved', label: '已批准' },
  { value: 'rejected', label: '已拒绝' }
]

// Modal states
const showRejectModal = ref(false)
const selectedQuote = ref<Quote | null>(null)
const rejectReason = ref('')
const exporting = ref(false)

// Load quotes on mount
onMounted(() => {
  loadQuotes()
})

// Debounced search
let searchTimer: NodeJS.Timeout
const debounceSearch = () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    currentPage.value = 1
    loadQuotes()
  }, 500)
}

// Load quotes with filters
async function loadQuotes() {
  const filters: any = {
    page: currentPage.value,
    pageSize: pageSize.value
  }

  if (searchPhone.value) {
    filters.phone = searchPhone.value
  }

  const selectedStatus = statusOptions[statusIndex.value].value
  if (selectedStatus) {
    filters.status = selectedStatus
  }

  if (startDate.value) {
    filters.startDate = startDate.value
  }

  if (endDate.value) {
    filters.endDate = endDate.value
  }

  await quotesStore.fetchQuotes(filters)
}

// Enhanced table event handlers
function handleRowSelect(selected: boolean, quote: Quote) {
  toggleSelection(quote.id)
}

function handleRowClick(quote: Quote) {
  handleView(quote)
}

function handleRowAction(actionKey: string, quote: Quote) {
  switch (actionKey) {
    case 'view':
      handleView(quote)
      break
    case 'approve':
      handleApprove(quote)
      break
    case 'reject':
      handleReject(quote)
      break
    case 'edit':
      handleEdit(quote)
      break
    default:
      console.warn('Unknown action:', actionKey)
  }
}

function handleSelectAll(event: any) {
  const checked = event.detail ? event.detail.value : event
  selectAll(
    quotesStore.quotes.map(q => q.id),
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
  loadQuotes()
}

function getSortIcon(columnKey: string) {
  if (sortKey.value !== columnKey) return '↕'
  return sortOrder.value === 'asc' ? '↑' : '↓'
}

// Batch operations handler
async function handleBatchOperation(operationKey: string, count: number) {
  switch (operationKey) {
    case 'export':
      await handleBatchExport()
      break
    case 'approve':
      await handleBatchApprove()
      break
  }
}

// Batch export
async function handleBatchExport() {
  try {
    batchOperating.value = true
    batchProgress.value = 0
    batchProgressText.value = `导出 ${selectedItems.value.length} 个报价单...`

    // Simulate progress
    const progressInterval = setInterval(() => {
      if (batchProgress.value < 90) {
        batchProgress.value += 15
      }
    }, 200)

    await quotesStore.exportQuotes({
      quoteIds: selectedItems.value
    })

    clearInterval(progressInterval)
    batchProgress.value = 100
    batchProgressText.value = '导出完成'

    uni.showToast({
      title: `成功导出 ${selectedItems.value.length} 个报价单`,
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

// Batch approve
async function handleBatchApprove() {
  try {
    batchOperating.value = true
    batchProgress.value = 0
    batchProgressText.value = `批准 ${selectedItems.value.length} 个报价单...`

    // Simulate progress
    const progressInterval = setInterval(() => {
      if (batchProgress.value < 90) {
        batchProgress.value += 10
      }
    }, 300)

    await quotesStore.batchApproveQuotes(selectedItems.value)

    clearInterval(progressInterval)
    batchProgress.value = 100
    batchProgressText.value = '批准完成'

    uni.showToast({
      title: `成功批准 ${selectedItems.value.length} 个报价单`,
      icon: 'success'
    })

    clearSelection()
    loadQuotes() // Refresh the table
  } catch (error) {
    uni.showToast({
      title: '批量批准失败',
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

// Handle filter changes
function handleStatusChange(e: any) {
  statusIndex.value = e.detail.value
  currentPage.value = 1
  loadQuotes()
}

function handleStartDateChange(e: any) {
  startDate.value = e.detail.value
  currentPage.value = 1
  loadQuotes()
}

function handleEndDateChange(e: any) {
  endDate.value = e.detail.value
  currentPage.value = 1
  loadQuotes()
}

function resetFilters() {
  searchPhone.value = ''
  statusIndex.value = 0
  startDate.value = ''
  endDate.value = ''
  currentPage.value = 1
  loadQuotes()
}

// Handle table events
function handlePageChange(page: number) {
  currentPage.value = page
  loadQuotes()
}

function handleSortChange(sortConfig: { key: string; order: 'asc' | 'desc' }) {
  // Implement sorting logic if needed
  loadQuotes()
}

// Handle actions
function handleView(quote: Quote) {
  uni.navigateTo({
    url: `/pages/admin/quotes/detail?id=${quote.id}`
  })
}

function handleEdit(quote: Quote) {
  uni.navigateTo({
    url: `/pages/admin/quotes/edit?id=${quote.id}`
  })
}

async function handleApprove(quote: Quote) {
  uni.showModal({
    title: '确认批准',
    content: `确定要批准报价单 ${quote.quote_number} 吗？`,
    success: async res => {
      if (res.confirm) {
        try {
          await quotesStore.approveQuote(quote.id)
          uni.showToast({
            title: '批准成功',
            icon: 'success'
          })
          loadQuotes()
        } catch (error) {
          uni.showToast({
            title: '批准失败',
            icon: 'none'
          })
        }
      }
    }
  })
}

function handleReject(quote: Quote) {
  selectedQuote.value = quote
  rejectReason.value = ''
  showRejectModal.value = true
}

async function confirmReject() {
  if (!selectedQuote.value) return

  try {
    await quotesStore.rejectQuote(selectedQuote.value.id, rejectReason.value)
    uni.showToast({
      title: '拒绝成功',
      icon: 'success'
    })
    showRejectModal.value = false
    loadQuotes()
  } catch (error) {
    uni.showToast({
      title: '拒绝失败',
      icon: 'none'
    })
  }
}

function cancelReject() {
  showRejectModal.value = false
  selectedQuote.value = null
  rejectReason.value = ''
}

async function handleExport() {
  exporting.value = true
  try {
    await quotesStore.exportQuotes({
      status: statusOptions[statusIndex.value].value,
      startDate: startDate.value,
      endDate: endDate.value
    })
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
    exporting.value = false
  }
}

// Utility functions
function formatAmount(amount: number): string {
  return amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

function formatDate(date: string): string {
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function getStatusLabel(status: string): string {
  const statusMap: Record<string, string> = {
    draft: '草稿',
    submitted: '待审批',
    approved: '已批准',
    rejected: '已拒绝'
  }
  return statusMap[status] || status
}
</script>

<style lang="scss">
@import '@/styles/variables.scss';

.quotes-page {
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
      .export-btn {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 20px;
        background: $primary-color;
        color: white;
        border: none;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.3s ease;

        &:hover {
          background: darken($primary-color, 10%);
          transform: translateY(-1px);
        }

        &[loading='true'] {
          opacity: 0.7;
          pointer-events: none;
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
    flex-direction: column;
    gap: 4px;

    .customer-name {
      font-weight: 500;
      color: $text-primary;
    }

    .customer-phone {
      font-size: 12px;
      color: $text-secondary;
    }
  }

  .products-cell {
    .product-count {
      font-size: 14px;
      color: $text-secondary;
    }
  }

  .amount-cell {
    font-weight: 600;
    color: $primary-color;
    font-size: 16px;
  }

  .status-badge {
    display: inline-flex;
    padding: 4px 12px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 500;

    &.status-draft {
      background: #f0f0f0;
      color: #666;
    }

    &.status-submitted {
      background: #fff3cd;
      color: #856404;
    }

    &.status-approved {
      background: #d4edda;
      color: #155724;
    }

    &.status-rejected {
      background: #f8d7da;
      color: #721c24;
    }
  }

  .date-cell {
    font-size: 13px;
    color: $text-secondary;
  }

  .actions-cell {
    display: flex;
    gap: 8px;
    justify-content: center;

    .action-btn {
      padding: 6px 12px;
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

      &.action-approve {
        background: #28a745;
        color: white;

        &:hover {
          background: #218838;
        }
      }

      &.action-reject {
        background: #dc3545;
        color: white;

        &:hover {
          background: #c82333;
        }
      }

      &.action-edit {
        background: $primary-color;
        color: white;

        &:hover {
          background: darken($primary-color, 10%);
        }
      }
    }
  }

  // Reject modal
  .reject-modal {
    padding: 20px 0;

    .modal-label {
      display: block;
      margin-bottom: 12px;
      font-size: 14px;
      color: $text-primary;
    }

    .reject-textarea {
      width: 100%;
      min-height: 100px;
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
  }
}

// Responsive design
@media (max-width: 768px) {
  .quotes-page {
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

          .stat-item {
            .stat-value {
              font-size: 18px;
            }
          }
        }
      }

      .header-actions {
        width: 100%;

        .export-btn {
          width: 100%;
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
    }

    .actions-cell {
      flex-wrap: wrap;
    }
  }
}
</style>
