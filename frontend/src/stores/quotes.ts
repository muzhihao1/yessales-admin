import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { QuotesApi } from '@/api/quotes'
import type { Customer, Quote } from '@/types/models'
import type { QueryParams } from '@/types/api'

export const useQuotesStore = defineStore('quotes', () => {
  // State
  const quotes = ref<Quote[]>([])
  const currentQuote = ref<Quote | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Pagination
  const currentPage = ref(1)
  const pageSize = ref(20)
  const total = ref(0)

  // Filters
  const searchKeyword = ref('')
  const statusFilter = ref<string>('')
  const dateRange = ref<[string, string] | null>(null)
  const customerPhone = ref('')

  // Getters
  const totalPages = computed(() => Math.ceil(total.value / pageSize.value))

  const pendingQuotes = computed(() => quotes.value.filter(q => q.status === 'pending'))

  const approvedQuotes = computed(() => quotes.value.filter(q => q.status === 'approved'))

  const rejectedQuotes = computed(() => quotes.value.filter(q => q.status === 'rejected'))

  const totalQuotesAmount = computed(() => quotes.value.reduce((sum, q) => sum + q.total_price, 0))

  const filteredQuotes = computed(() => {
    let result = [...quotes.value]

    // 关键词搜索 (报价单号、客户名称、客户电话)
    if (searchKeyword.value) {
      const keyword = searchKeyword.value.toLowerCase()
      result = result.filter(
        q =>
          q.quote_no.toLowerCase().includes(keyword) ||
          q.customer?.name?.toLowerCase().includes(keyword) ||
          q.customer?.phone?.includes(keyword)
      )
    }

    // 状态筛选
    if (statusFilter.value) {
      result = result.filter(q => q.status === statusFilter.value)
    }

    // 日期范围筛选
    if (dateRange.value) {
      const [start, end] = dateRange.value
      result = result.filter(q => {
        const quoteDate = new Date(q.created_at)
        return quoteDate >= new Date(start) && quoteDate <= new Date(end)
      })
    }

    return result
  })

  // Actions
  async function fetchQuotes(params?: QueryParams) {
    isLoading.value = true
    error.value = null

    try {
      const queryParams: QueryParams = {
        page: currentPage.value,
        page_size: pageSize.value,
        sort_by: 'created_at',
        sort_order: 'desc',
        ...params
      }

      const response = await QuotesApi.getQuotes(queryParams)

      if (response.success && response.data) {
        quotes.value = response.data
        total.value = response.pagination?.total || response.data.length
      } else {
        error.value = response.error?.message || '获取报价单列表失败'
      }
    } catch (err) {
      error.value = '网络错误，请稍后重试'
      console.error('Fetch quotes error:', err)
    } finally {
      isLoading.value = false
    }
  }

  async function fetchQuote(id: string) {
    isLoading.value = true
    error.value = null

    try {
      const response = await QuotesApi.getQuote(id)

      if (response.success && response.data) {
        currentQuote.value = response.data
        return response.data
      } else {
        error.value = response.error?.message || '获取报价单详情失败'
        return null
      }
    } catch (err) {
      error.value = '网络错误，请稍后重试'
      console.error('Fetch quote error:', err)
      return null
    } finally {
      isLoading.value = false
    }
  }

  async function approveQuote(id: string) {
    isLoading.value = true
    error.value = null

    try {
      const response = await QuotesApi.approveQuote(id)

      if (response.success && response.data) {
        // 更新列表中的状态
        const index = quotes.value.findIndex(q => q.id === id)
        if (index > -1) {
          quotes.value[index] = response.data
        }
        // 更新当前报价单
        if (currentQuote.value?.id === id) {
          currentQuote.value = response.data
        }
        return { success: true, data: response.data }
      } else {
        error.value = response.error?.message || '审批失败'
        return { success: false, error: error.value }
      }
    } catch (err) {
      error.value = '网络错误，请稍后重试'
      console.error('Approve quote error:', err)
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  async function rejectQuote(id: string, reason?: string) {
    isLoading.value = true
    error.value = null

    try {
      const response = await QuotesApi.rejectQuote(id, reason)

      if (response.success && response.data) {
        // 更新列表中的状态
        const index = quotes.value.findIndex(q => q.id === id)
        if (index > -1) {
          quotes.value[index] = response.data
        }
        // 更新当前报价单
        if (currentQuote.value?.id === id) {
          currentQuote.value = response.data
        }
        return { success: true, data: response.data }
      } else {
        error.value = response.error?.message || '拒绝失败'
        return { success: false, error: error.value }
      }
    } catch (err) {
      error.value = '网络错误，请稍后重试'
      console.error('Reject quote error:', err)
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  async function deleteQuote(id: string) {
    isLoading.value = true
    error.value = null

    try {
      const response = await QuotesApi.deleteQuote(id)

      if (response.success) {
        quotes.value = quotes.value.filter(q => q.id !== id)
        total.value--
        return { success: true }
      } else {
        error.value = response.error?.message || '删除报价单失败'
        return { success: false, error: error.value }
      }
    } catch (err) {
      error.value = '网络错误，请稍后重试'
      console.error('Delete quote error:', err)
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  async function exportQuotes(params: { startDate: string; endDate: string; status?: string }) {
    isLoading.value = true
    error.value = null

    try {
      const response = await QuotesApi.exportQuotes(params)

      if (response.success && response.data) {
        // 创建下载链接
        const blob = response.data
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `quotes_${params.startDate}_${params.endDate}.xlsx`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        return { success: true }
      } else {
        error.value = response.error?.message || '导出失败'
        return { success: false, error: error.value }
      }
    } catch (err) {
      error.value = '网络错误，请稍后重试'
      console.error('Export quotes error:', err)
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  async function searchByPhone(phone: string) {
    if (!phone.trim()) {
      return { success: true, data: [] }
    }

    isLoading.value = true
    error.value = null

    try {
      const response = await QuotesApi.getQuotesByPhone(phone)

      if (response.success) {
        return { success: true, data: response.data || [] }
      } else {
        error.value = response.error?.message || '搜索失败'
        return { success: false, error: error.value, data: [] }
      }
    } catch (err) {
      error.value = '网络错误，请稍后重试'
      console.error('Search quotes by phone error:', err)
      return { success: false, error: error.value, data: [] }
    } finally {
      isLoading.value = false
    }
  }

  // 工具方法
  function resetFilters() {
    searchKeyword.value = ''
    statusFilter.value = ''
    dateRange.value = null
    customerPhone.value = ''
    currentPage.value = 1
  }

  function setPage(page: number) {
    currentPage.value = page
    fetchQuotes()
  }

  function setPageSize(size: number) {
    pageSize.value = size
    currentPage.value = 1
    fetchQuotes()
  }

  // 统计方法
  function getQuoteStats() {
    const totalCount = quotes.value.length
    const pendingCount = pendingQuotes.value.length
    const approvedCount = approvedQuotes.value.length
    const rejectedCount = rejectedQuotes.value.length

    const totalAmount = totalQuotesAmount.value
    const pendingAmount = pendingQuotes.value.reduce((sum, q) => sum + q.total_price, 0)
    const approvedAmount = approvedQuotes.value.reduce((sum, q) => sum + q.total_price, 0)

    return {
      counts: {
        total: totalCount,
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount
      },
      amounts: {
        total: totalAmount,
        pending: pendingAmount,
        approved: approvedAmount
      }
    }
  }

  return {
    // State
    quotes,
    currentQuote,
    isLoading,
    error,

    // Pagination
    currentPage,
    pageSize,
    total,
    totalPages,

    // Filters
    searchKeyword,
    statusFilter,
    dateRange,
    customerPhone,

    // Getters
    pendingQuotes,
    approvedQuotes,
    rejectedQuotes,
    totalQuotesAmount,
    filteredQuotes,

    // Actions
    fetchQuotes,
    fetchQuote,
    approveQuote,
    rejectQuote,
    deleteQuote,
    exportQuotes,
    searchByPhone,
    resetFilters,
    setPage,
    setPageSize,
    getQuoteStats
  }
})
