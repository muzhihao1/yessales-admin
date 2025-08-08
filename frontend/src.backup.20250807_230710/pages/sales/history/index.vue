<template>
  <view class="history-page">
    <SalesHeader title="我的报价" :show-back="false" :fixed="true" />

    <view class="history-content">
      <!-- Search Section -->
      <view class="search-section">
        <view class="search-bar">
          <view class="search-input-wrapper">
            <text class="search-icon">🔍</text>
            <input
              v-model="searchKeyword"
              class="search-input"
              placeholder="搜索客户姓名、报价单号或产品"
              @input="handleSearch"
            />
            <view v-if="searchKeyword" class="clear-search" @click="clearSearch">
              <text class="clear-icon">×</text>
            </view>
          </view>

          <SalesButton
            size="small"
            :type="showFilters ? 'primary' : 'default'"
            @click="toggleFilters"
          >
            筛选
          </SalesButton>
        </view>

        <!-- Active Filters -->
        <view v-if="hasActiveFilters" class="active-filters">
          <view
            v-for="filter in activeFilters"
            :key="filter.key"
            class="filter-chip"
            @click="removeFilter(filter.key)"
          >
            <text class="filter-text">{{ filter.label }}</text>
            <text class="filter-remove">×</text>
          </view>
          <SalesButton size="mini" type="plain" @click="clearAllFilters"> 清除全部 </SalesButton>
        </view>
      </view>

      <!-- Filter Panel -->
      <view v-if="showFilters" class="filter-panel">
        <!-- Status Filter -->
        <view class="filter-group">
          <text class="filter-title">报价状态</text>
          <view class="filter-options">
            <view
              v-for="status in statusOptions"
              :key="status.value"
              class="filter-option"
              :class="{ 'filter-option--active': filters.status === status.value }"
              @click="setStatusFilter(status.value)"
            >
              <text class="option-text">{{ status.label }}</text>
            </view>
          </view>
        </view>

        <!-- Date Filter -->
        <view class="filter-group">
          <text class="filter-title">创建时间</text>
          <view class="filter-options">
            <view
              v-for="period in datePeriods"
              :key="period.value"
              class="filter-option"
              :class="{ 'filter-option--active': filters.datePeriod === period.value }"
              @click="setDateFilter(period.value)"
            >
              <text class="option-text">{{ period.label }}</text>
            </view>
          </view>
        </view>

        <!-- Amount Filter -->
        <view class="filter-group">
          <text class="filter-title">报价金额</text>
          <view class="amount-filter">
            <SalesInput
              v-model.number="filters.minAmount"
              placeholder="最低金额"
              type="number"
              size="small"
              @input="handleAmountFilter"
            />
            <text class="amount-separator">-</text>
            <SalesInput
              v-model.number="filters.maxAmount"
              placeholder="最高金额"
              type="number"
              size="small"
              @input="handleAmountFilter"
            />
          </view>
        </view>

        <!-- Sort Options -->
        <view class="filter-group">
          <text class="filter-title">排序方式</text>
          <SalesSelector
            v-model="filters.sortBy"
            :options="sortOptions"
            @change="handleSortChange"
          />
        </view>

        <view class="filter-actions">
          <SalesButton type="default" @click="resetFilters">重置</SalesButton>
          <SalesButton type="primary" @click="applyFilters">应用筛选</SalesButton>
        </view>
      </view>

      <!-- Statistics Overview -->
      <view class="stats-section">
        <view class="stats-cards">
          <view class="stat-card">
            <text class="stat-number">{{ stats.total }}</text>
            <text class="stat-label">总报价单</text>
          </view>
          <view class="stat-card">
            <text class="stat-number">{{ stats.thisMonth }}</text>
            <text class="stat-label">本月新增</text>
          </view>
          <view class="stat-card">
            <text class="stat-number">{{ stats.pending }}</text>
            <text class="stat-label">待确认</text>
          </view>
          <view class="stat-card">
            <text class="stat-number">¥{{ formatPrice(stats.totalAmount) }}</text>
            <text class="stat-label">总金额</text>
          </view>
        </view>
      </view>

      <!-- Quotes List -->
      <view class="quotes-section">
        <!-- Loading State -->
        <view v-if="loading" class="loading-container">
          <view class="loading-spinner"></view>
          <text class="loading-text">加载中...</text>
        </view>

        <!-- Empty State -->
        <view v-else-if="filteredQuotes.length === 0" class="empty-container">
          <image class="empty-icon" src="/static/images/empty-quotes.png" mode="aspectFit" />
          <text class="empty-text">{{ searchKeyword ? '未找到相关报价单' : '暂无报价单' }}</text>
          <SalesButton type="primary" @click="createNewQuote">
            {{ searchKeyword ? '新建报价' : '创建第一个报价' }}
          </SalesButton>
        </view>

        <!-- Quote Cards -->
        <view v-else class="quotes-list">
          <view
            v-for="quote in paginatedQuotes"
            :key="quote.id"
            class="quote-card"
            @click="viewQuote(quote)"
          >
            <!-- Card Header -->
            <view class="card-header">
              <view class="customer-info">
                <text class="customer-name">{{ quote.customerName }}</text>
                <text class="customer-phone">{{ quote.customerPhone }}</text>
              </view>
              <view class="quote-status" :class="`status-${quote.status}`">
                <text class="status-text">{{ getStatusText(quote.status) }}</text>
              </view>
            </view>

            <!-- Card Content -->
            <view class="card-content">
              <view class="quote-info">
                <text class="quote-number">{{ quote.quoteNumber }}</text>
                <text class="quote-date">{{ formatDate(quote.createdAt) }}</text>
              </view>

              <view class="quote-details">
                <text class="item-count">{{ quote.itemCount }} 种产品</text>
                <text class="quote-amount">¥{{ formatPrice(quote.totalAmount) }}</text>
              </view>
            </view>

            <!-- Card Footer -->
            <view class="card-footer">
              <view class="validity-info">
                <text
                  class="validity-text"
                  :class="{ 'validity-expired': isExpired(quote.validUntil) }"
                >
                  {{ getValidityText(quote.validUntil) }}
                </text>
              </view>

              <view class="card-actions">
                <SalesButton size="mini" type="plain" @click.stop="editQuote(quote)">
                  编辑
                </SalesButton>
                <SalesButton size="mini" type="plain" @click.stop="duplicateQuote(quote)">
                  复制
                </SalesButton>
                <SalesButton size="mini" type="plain" @click.stop="showQuoteActions(quote)">
                  更多
                </SalesButton>
              </view>
            </view>
          </view>
        </view>

        <!-- Load More -->
        <view v-if="hasMore && !loading" class="load-more" @click="loadMore">
          <text class="load-more-text">加载更多</text>
        </view>
      </view>
    </view>

    <!-- Floating Action Button -->
    <view class="fab" @click="createNewQuote">
      <text class="fab-icon">+</text>
    </view>

    <!-- Footer Navigation -->
    <SalesFooter
      company-name="耶氏台球斗南销售中心"
      slogan="专业台球设备供应商"
      :show-contact="true"
      phone="400-888-8888"
      :show-bottom-bar="true"
      :bottom-bar-items="bottomBarItems"
      :active-index="2"
      @bar-item-click="handleBottomBarClick"
    />
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import SalesHeader from '@/components/sales/SalesHeader.vue'
import SalesButton from '@/components/sales/SalesButton.vue'
import SalesInput from '@/components/sales/SalesInput.vue'
import SalesSelector from '@/components/sales/SalesSelector.vue'
import SalesFooter from '@/components/layout/SalesFooter.vue'

interface QuoteListItem {
  id: string
  quoteNumber: string
  customerName: string
  customerPhone: string
  status: 'draft' | 'sent' | 'approved' | 'rejected'
  totalAmount: number
  itemCount: number
  createdAt: string
  updatedAt: string
  validUntil: string
}

// State
const loading = ref(true)
const searchKeyword = ref('')
const showFilters = ref(false)
const quotes = ref<QuoteListItem[]>([])
const currentPage = ref(1)
const pageSize = 10

// Filters
const filters = reactive({
  status: 'all' as string,
  datePeriod: 'all' as string,
  minAmount: undefined as number | undefined,
  maxAmount: undefined as number | undefined,
  sortBy: 'createdAt_desc' as string
})

// Statistics
const stats = reactive({
  total: 0,
  thisMonth: 0,
  pending: 0,
  totalAmount: 0
})

// Options
const statusOptions = [
  { value: 'all', label: '全部状态' },
  { value: 'draft', label: '草稿' },
  { value: 'sent', label: '已发送' },
  { value: 'approved', label: '已确认' },
  { value: 'rejected', label: '已拒绝' }
]

const datePeriods = [
  { value: 'all', label: '全部时间' },
  { value: 'today', label: '今天' },
  { value: 'week', label: '本周' },
  { value: 'month', label: '本月' },
  { value: 'quarter', label: '本季度' }
]

const sortOptions = [
  { value: 'createdAt_desc', label: '创建时间 (新到旧)' },
  { value: 'createdAt_asc', label: '创建时间 (旧到新)' },
  { value: 'amount_desc', label: '金额 (高到低)' },
  { value: 'amount_asc', label: '金额 (低到高)' },
  { value: 'customer_asc', label: '客户姓名 (A-Z)' }
]

// Bottom navigation
const bottomBarItems = ref([
  {
    text: '首页',
    icon: '/static/icons/home.png',
    activeIcon: '/static/icons/home-active.png',
    page: '/pages/sales/index'
  },
  {
    text: '新建报价',
    icon: '/static/icons/create.png',
    activeIcon: '/static/icons/create-active.png',
    page: '/pages/sales/quote/create'
  },
  {
    text: '我的报价',
    icon: '/static/icons/quotes.png',
    activeIcon: '/static/icons/quotes-active.png',
    page: '/pages/sales/history/index'
  },
  {
    text: '我的',
    icon: '/static/icons/profile.png',
    activeIcon: '/static/icons/profile-active.png',
    page: '/pages/sales/profile/index'
  }
])

// Computed properties
const filteredQuotes = computed(() => {
  let result = [...quotes.value]

  // Search filter
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(
      quote =>
        quote.customerName.toLowerCase().includes(keyword) ||
        quote.quoteNumber.toLowerCase().includes(keyword) ||
        quote.customerPhone.includes(keyword)
    )
  }

  // Status filter
  if (filters.status !== 'all') {
    result = result.filter(quote => quote.status === filters.status)
  }

  // Date filter
  if (filters.datePeriod !== 'all') {
    const now = new Date()
    const filterDate = getDateFilterRange(filters.datePeriod)
    result = result.filter(quote => {
      const quoteDate = new Date(quote.createdAt)
      return quoteDate >= filterDate
    })
  }

  // Amount filter
  if (filters.minAmount !== undefined) {
    result = result.filter(quote => quote.totalAmount >= filters.minAmount!)
  }
  if (filters.maxAmount !== undefined) {
    result = result.filter(quote => quote.totalAmount <= filters.maxAmount!)
  }

  // Sort
  result.sort((a, b) => {
    const [field, direction] = filters.sortBy.split('_')
    let comparison = 0

    switch (field) {
      case 'createdAt':
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        break
      case 'amount':
        comparison = a.totalAmount - b.totalAmount
        break
      case 'customer':
        comparison = a.customerName.localeCompare(b.customerName)
        break
    }

    return direction === 'desc' ? -comparison : comparison
  })

  return result
})

const paginatedQuotes = computed(() => {
  return filteredQuotes.value.slice(0, currentPage.value * pageSize)
})

const hasMore = computed(() => {
  return filteredQuotes.value.length > currentPage.value * pageSize
})

const hasActiveFilters = computed(() => {
  return (
    filters.status !== 'all' ||
    filters.datePeriod !== 'all' ||
    filters.minAmount !== undefined ||
    filters.maxAmount !== undefined ||
    searchKeyword.value !== ''
  )
})

const activeFilters = computed(() => {
  const active = []

  if (searchKeyword.value) {
    active.push({ key: 'search', label: `搜索: ${searchKeyword.value}` })
  }

  if (filters.status !== 'all') {
    const statusOption = statusOptions.find(opt => opt.value === filters.status)
    active.push({ key: 'status', label: `状态: ${statusOption?.label}` })
  }

  if (filters.datePeriod !== 'all') {
    const dateOption = datePeriods.find(opt => opt.value === filters.datePeriod)
    active.push({ key: 'date', label: `时间: ${dateOption?.label}` })
  }

  if (filters.minAmount !== undefined || filters.maxAmount !== undefined) {
    const min = filters.minAmount || 0
    const max = filters.maxAmount || '无限'
    active.push({ key: 'amount', label: `金额: ¥${min} - ¥${max}` })
  }

  return active
})

// Lifecycle
onMounted(() => {
  loadQuotes()
  loadStats()
})

// Methods
const loadQuotes = async () => {
  try {
    loading.value = true

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800))

    // Mock data
    const mockQuotes: QuoteListItem[] = [
      {
        id: '1',
        quoteNumber: 'YS-20241206-0001',
        customerName: '张先生',
        customerPhone: '13800138000',
        status: 'sent',
        totalAmount: 19586.25,
        itemCount: 2,
        createdAt: '2024-12-06T10:30:00Z',
        updatedAt: '2024-12-06T10:30:00Z',
        validUntil: '2025-01-05T10:30:00Z'
      },
      {
        id: '2',
        quoteNumber: 'YS-20241205-0002',
        customerName: '李女士',
        customerPhone: '13900139000',
        status: 'approved',
        totalAmount: 8500,
        itemCount: 1,
        createdAt: '2024-12-05T14:20:00Z',
        updatedAt: '2024-12-05T16:45:00Z',
        validUntil: '2025-01-04T14:20:00Z'
      },
      {
        id: '3',
        quoteNumber: 'YS-20241204-0003',
        customerName: '王总',
        customerPhone: '13700137000',
        status: 'draft',
        totalAmount: 35600,
        itemCount: 5,
        createdAt: '2024-12-04T09:15:00Z',
        updatedAt: '2024-12-04T09:15:00Z',
        validUntil: '2025-01-03T09:15:00Z'
      },
      {
        id: '4',
        quoteNumber: 'YS-20241203-0004',
        customerName: '陈经理',
        customerPhone: '13600136000',
        status: 'rejected',
        totalAmount: 12800,
        itemCount: 3,
        createdAt: '2024-12-03T16:45:00Z',
        updatedAt: '2024-12-03T18:20:00Z',
        validUntil: '2025-01-02T16:45:00Z'
      },
      {
        id: '5',
        quoteNumber: 'YS-20241202-0005',
        customerName: '刘俱乐部',
        customerPhone: '13500135000',
        status: 'approved',
        totalAmount: 68900,
        itemCount: 8,
        createdAt: '2024-12-02T11:30:00Z',
        updatedAt: '2024-12-02T13:15:00Z',
        validUntil: '2025-01-01T11:30:00Z'
      }
    ]

    quotes.value = mockQuotes
  } catch (error) {
    console.error('Failed to load quotes:', error)
    uni.showToast({
      title: '加载失败，请重试',
      icon: 'none'
    })
  } finally {
    loading.value = false
  }
}

const loadStats = async () => {
  try {
    // Calculate stats from quotes
    stats.total = quotes.value.length
    stats.pending = quotes.value.filter(q => q.status === 'sent').length
    stats.totalAmount = quotes.value.reduce((sum, q) => sum + q.totalAmount, 0)

    // Calculate this month's quotes
    const thisMonth = new Date()
    thisMonth.setDate(1)
    thisMonth.setHours(0, 0, 0, 0)

    stats.thisMonth = quotes.value.filter(q => {
      return new Date(q.createdAt) >= thisMonth
    }).length
  } catch (error) {
    console.error('Failed to load stats:', error)
  }
}

const handleSearch = () => {
  // Debounce search in real implementation
  currentPage.value = 1
}

const clearSearch = () => {
  searchKeyword.value = ''
  currentPage.value = 1
}

const toggleFilters = () => {
  showFilters.value = !showFilters.value
}

const setStatusFilter = (status: string) => {
  filters.status = status
}

const setDateFilter = (period: string) => {
  filters.datePeriod = period
}

const handleAmountFilter = () => {
  // Debounce amount filter
  currentPage.value = 1
}

const handleSortChange = () => {
  currentPage.value = 1
}

const resetFilters = () => {
  filters.status = 'all'
  filters.datePeriod = 'all'
  filters.minAmount = undefined
  filters.maxAmount = undefined
  filters.sortBy = 'createdAt_desc'
  searchKeyword.value = ''
  currentPage.value = 1
}

const applyFilters = () => {
  showFilters.value = false
  currentPage.value = 1
}

const removeFilter = (filterKey: string) => {
  switch (filterKey) {
    case 'search':
      searchKeyword.value = ''
      break
    case 'status':
      filters.status = 'all'
      break
    case 'date':
      filters.datePeriod = 'all'
      break
    case 'amount':
      filters.minAmount = undefined
      filters.maxAmount = undefined
      break
  }
  currentPage.value = 1
}

const clearAllFilters = () => {
  resetFilters()
}

const loadMore = () => {
  currentPage.value++
}

// Helper functions
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('zh-CN')
}

const formatPrice = (price: number) => {
  return price.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

const getStatusText = (status: string) => {
  const statusMap = {
    draft: '草稿',
    sent: '已发送',
    approved: '已确认',
    rejected: '已拒绝'
  }
  return statusMap[status] || '未知'
}

const isExpired = (validUntil: string) => {
  return new Date(validUntil) < new Date()
}

const getValidityText = (validUntil: string) => {
  const validDate = new Date(validUntil)
  const now = new Date()

  if (validDate < now) {
    return '已过期'
  }

  const diffDays = Math.ceil((validDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays <= 3) {
    return `${diffDays}天后过期`
  }

  return `有效至${validDate.toLocaleDateString('zh-CN')}`
}

const getDateFilterRange = (period: string) => {
  const now = new Date()

  switch (period) {
    case 'today':
      return new Date(now.setHours(0, 0, 0, 0))
    case 'week':
      return new Date(now.setDate(now.getDate() - 7))
    case 'month':
      return new Date(now.setMonth(now.getMonth() - 1))
    case 'quarter':
      return new Date(now.setMonth(now.getMonth() - 3))
    default:
      return new Date(0)
  }
}

// Action handlers
const createNewQuote = () => {
  uni.navigateTo({
    url: '/pages/sales/quote/create'
  })
}

const viewQuote = (quote: QuoteListItem) => {
  uni.navigateTo({
    url: `/pages/sales/quote/preview?id=${quote.id}`
  })
}

const editQuote = (quote: QuoteListItem) => {
  uni.navigateTo({
    url: `/pages/sales/quote/create?id=${quote.id}&mode=edit`
  })
}

const duplicateQuote = (quote: QuoteListItem) => {
  uni.navigateTo({
    url: `/pages/sales/quote/create?id=${quote.id}&mode=duplicate`
  })
}

const showQuoteActions = (quote: QuoteListItem) => {
  const actions = ['删除报价', '分享报价', '导出PDF']

  if (quote.status === 'draft') {
    actions.unshift('发送给客户')
  }

  uni.showActionSheet({
    itemList: actions,
    success: res => {
      switch (res.tapIndex) {
        case 0:
          if (quote.status === 'draft') {
            sendQuote(quote)
          } else {
            deleteQuote(quote)
          }
          break
        case 1:
          if (quote.status === 'draft') {
            shareQuote(quote)
          } else {
            shareQuote(quote)
          }
          break
        case 2:
          if (quote.status === 'draft') {
            exportQuote(quote)
          } else {
            exportQuote(quote)
          }
          break
        case 3:
          deleteQuote(quote)
          break
      }
    }
  })
}

const sendQuote = (quote: QuoteListItem) => {
  uni.showToast({
    title: '发送功能开发中',
    icon: 'none'
  })
}

const shareQuote = (quote: QuoteListItem) => {
  uni.showToast({
    title: '分享功能开发中',
    icon: 'none'
  })
}

const exportQuote = (quote: QuoteListItem) => {
  uni.showToast({
    title: '导出功能开发中',
    icon: 'none'
  })
}

const deleteQuote = (quote: QuoteListItem) => {
  uni.showModal({
    title: '删除确认',
    content: '确定要删除这个报价单吗？此操作不可恢复。',
    success: res => {
      if (res.confirm) {
        const index = quotes.value.findIndex(q => q.id === quote.id)
        if (index > -1) {
          quotes.value.splice(index, 1)
          uni.showToast({
            title: '删除成功',
            icon: 'success'
          })
          loadStats() // Refresh stats
        }
      }
    }
  })
}

const handleBottomBarClick = (item: any, index: number) => {
  if (index === 2) {
    // Current page, do nothing
    return
  }

  uni.switchTab({
    url: item.page,
    fail: () => {
      uni.navigateTo({
        url: item.page,
        fail: () => {
          uni.showToast({
            title: '页面开发中',
            icon: 'none'
          })
        }
      })
    }
  })
}
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.history-page {
  min-height: 100vh;
  background-color: $bg-color-page;
  padding-bottom: 160rpx; // Space for footer and fab
}

.history-content {
  padding-top: calc(44px + var(--status-bar-height, 0) + #{$spacing-base});
  padding-bottom: $spacing-base;
}

// Search Section
.search-section {
  padding: 0 $spacing-base $spacing-base;
}

.search-bar {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  margin-bottom: $spacing-base;
}

.search-input-wrapper {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
  background-color: $bg-color-white;
  border-radius: $border-radius-large;
  padding: 0 $spacing-base;
  box-shadow: $box-shadow-base;
}

.search-icon {
  font-size: $font-size-base;
  color: $text-color-secondary;
  margin-right: $spacing-xs;
}

.search-input {
  flex: 1;
  height: 80rpx;
  font-size: $font-size-base;
  color: $text-color;

  &::placeholder {
    color: $text-color-placeholder;
  }
}

.clear-search {
  padding: $spacing-xs;
  cursor: pointer;
}

.clear-icon {
  font-size: $font-size-large;
  color: $text-color-secondary;
}

// Active Filters
.active-filters {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-xs;
  align-items: center;
}

.filter-chip {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
  background-color: $primary-bg;
  color: $primary-color;
  padding: 6rpx $spacing-sm;
  border-radius: 16rpx;
  font-size: $font-size-small;
  cursor: pointer;
}

.filter-text {
  font-size: $font-size-small;
}

.filter-remove {
  font-size: $font-size-base;
  font-weight: $font-weight-bold;
}

// Filter Panel
.filter-panel {
  background-color: $bg-color-white;
  margin: 0 $spacing-base $spacing-base;
  border-radius: $border-radius-base;
  padding: $spacing-lg;
  box-shadow: $box-shadow-base;
}

.filter-group {
  margin-bottom: $spacing-lg;

  &:last-child {
    margin-bottom: 0;
  }
}

.filter-title {
  display: block;
  font-size: $font-size-base;
  font-weight: $font-weight-semibold;
  color: $text-color;
  margin-bottom: $spacing-base;
}

.filter-options {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-sm;
}

.filter-option {
  padding: $spacing-sm $spacing-base;
  background-color: $bg-color-page;
  border-radius: $border-radius-base;
  cursor: pointer;
  transition: $transition-base;

  &--active {
    background-color: $primary-color;
    color: $bg-color-white;
  }
}

.option-text {
  font-size: $font-size-small;
}

.amount-filter {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
}

.amount-separator {
  font-size: $font-size-base;
  color: $text-color-secondary;
}

.filter-actions {
  display: flex;
  gap: $spacing-sm;
  margin-top: $spacing-lg;
  padding-top: $spacing-lg;
  border-top: 1px solid $border-color-lighter;
}

// Statistics Section
.stats-section {
  padding: 0 $spacing-base $spacing-base;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $spacing-sm;
}

.stat-card {
  @include card;
  @include flex-center;
  flex-direction: column;
  padding: $spacing-lg $spacing-base;
  text-align: center;
}

.stat-number {
  font-size: $font-size-extra-large;
  font-weight: $font-weight-bold;
  color: $primary-color;
  margin-bottom: $spacing-xs;
}

.stat-label {
  font-size: $font-size-small;
  color: $text-color-secondary;
}

// Quotes Section
.quotes-section {
  padding: 0 $spacing-base;
}

.loading-container {
  @include flex-center;
  flex-direction: column;
  padding: $spacing-xxl 0;
}

.loading-spinner {
  width: 40rpx;
  height: 40rpx;
  border: 3rpx solid #e0e0e0;
  border-top-color: $primary-color;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: $spacing-base;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-text {
  font-size: $font-size-base;
  color: $text-color-secondary;
}

.empty-container {
  @include flex-center;
  flex-direction: column;
  padding: $spacing-xxl 0;
  text-align: center;
}

.empty-icon {
  width: 200rpx;
  height: 200rpx;
  opacity: 0.6;
  margin-bottom: $spacing-lg;
}

.empty-text {
  font-size: $font-size-base;
  color: $text-color-secondary;
  margin-bottom: $spacing-lg;
}

// Quote Cards
.quotes-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-base;
}

.quote-card {
  @include card;
  padding: $spacing-lg;
  cursor: pointer;
  transition: $transition-base;

  &:active {
    transform: scale(0.995);
  }
}

.card-header {
  @include flex-between;
  margin-bottom: $spacing-base;
}

.customer-info {
  flex: 1;
}

.customer-name {
  display: block;
  font-size: $font-size-large;
  font-weight: $font-weight-semibold;
  color: $text-color;
  margin-bottom: 4rpx;
}

.customer-phone {
  font-size: $font-size-small;
  color: $text-color-secondary;
}

.quote-status {
  padding: 6rpx $spacing-sm;
  border-radius: 16rpx;
  font-size: $font-size-small;
  font-weight: $font-weight-medium;

  &.status-draft {
    background-color: $warning-bg;
    color: $warning-color;
  }

  &.status-sent {
    background-color: $info-bg;
    color: $info-color;
  }

  &.status-approved {
    background-color: $success-bg;
    color: $success-color;
  }

  &.status-rejected {
    background-color: $danger-bg;
    color: $danger-color;
  }
}

.card-content {
  margin-bottom: $spacing-base;
}

.quote-info {
  @include flex-between;
  margin-bottom: $spacing-sm;
}

.quote-number {
  font-size: $font-size-base;
  font-weight: $font-weight-medium;
  color: $text-color;
}

.quote-date {
  font-size: $font-size-small;
  color: $text-color-secondary;
}

.quote-details {
  @include flex-between;
}

.item-count {
  font-size: $font-size-small;
  color: $text-color-secondary;
}

.quote-amount {
  font-size: $font-size-large;
  font-weight: $font-weight-bold;
  color: $danger-color;
}

.card-footer {
  @include flex-between;
  padding-top: $spacing-base;
  border-top: 1px solid $border-color-lighter;
}

.validity-info {
  flex: 1;
}

.validity-text {
  font-size: $font-size-small;
  color: $text-color-secondary;

  &.validity-expired {
    color: $danger-color;
    font-weight: $font-weight-medium;
  }
}

.card-actions {
  display: flex;
  gap: $spacing-xs;
}

// Load More
.load-more {
  @include flex-center;
  padding: $spacing-lg 0;
  cursor: pointer;
}

.load-more-text {
  font-size: $font-size-base;
  color: $primary-color;
}

// Floating Action Button
.fab {
  position: fixed;
  right: $spacing-lg;
  bottom: 200rpx;
  width: 120rpx;
  height: 120rpx;
  background-color: $primary-color;
  border-radius: 50%;
  @include flex-center;
  box-shadow: $box-shadow-large;
  z-index: $z-index-floating;
  cursor: pointer;
  transition: $transition-base;

  &:active {
    transform: scale(0.95);
  }
}

.fab-icon {
  font-size: 48rpx;
  font-weight: $font-weight-bold;
  color: $bg-color-white;
}

// Responsive Design
@media (min-width: 768px) {
  .stats-cards {
    grid-template-columns: repeat(4, 1fr);
  }

  .filter-options {
    gap: $spacing-base;
  }

  .filter-option {
    padding: $spacing-base $spacing-lg;
  }

  .amount-filter {
    max-width: 400rpx;
  }
}

@media (min-width: 1024px) {
  .history-content {
    max-width: 800px;
    margin: 0 auto;
    padding-left: $spacing-base;
    padding-right: $spacing-base;
  }
}

/* #ifdef H5 */
.history-content {
  padding-bottom: 0;
}

.fab {
  bottom: $spacing-xl;
}
/* #endif */
</style>
