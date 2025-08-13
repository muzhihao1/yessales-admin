/**
 * Enhanced Quotes Store with Offline Support
 *
 * Extends the original quotes store with offline functionality,
 * caching, optimistic updates, and error handling.
 */

import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { QuotesApi } from '@/api/quotes'
import { useOffline } from '@/services/offline'
import {
  cachePatterns,
  handleStoreError,
  useCache,
  useLoadingState,
  useOptimisticUpdates,
  usePersistence,
  withLoading
} from '@/stores/utils'
import type { Customer, Quote } from '@/types/models'
import type { QueryParams, CreateQuoteRequest } from '@/types/api'

export const useQuotesStore = defineStore('quotes', () => {
  // Core state
  const quotes = ref<Quote[]>([])
  const currentQuote = ref<Quote | null>(null)
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

  // Utilities
  const { isLoading, startLoading, stopLoading } = useLoadingState('quotes')
  const cache = useCache('quotes', { ttl: 5 * 60 * 1000 }) // 5 minutes
  const { createOffline, updateOffline, deleteOffline } = useOffline('quote')
  const { optimisticCreate, optimisticUpdate, optimisticDelete } = useOptimisticUpdates('quotes')
  const persistence = usePersistence('quotes', {
    include: ['quotes', 'currentQuote', 'currentPage', 'pageSize', 'total']
  })

  // Initialize persistence
  persistence.initializePersistence({
    quotes: quotes.value,
    currentQuote: currentQuote.value,
    currentPage: currentPage.value,
    pageSize: pageSize.value,
    total: total.value
  })

  // Computed properties
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
          q.quote_no?.toLowerCase().includes(keyword) ||
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

  // Enhanced Actions with Offline Support

  /**
   * Fetch quotes with caching and offline support
   */
  async function fetchQuotes(params?: QueryParams) {
    const cacheKey = `quotes_${JSON.stringify(params || {})}_${currentPage.value}_${pageSize.value}`

    // Try cache first
    const cached = cache.get<{ quotes: Quote[]; total: number }>(cacheKey)
    if (cached && !params?.forceRefresh) {
      quotes.value = cached.quotes
      total.value = cached.total
      return { success: true, data: cached.quotes }
    }

    return await withLoading('quotes', 'fetchQuotes', async () => {
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

          // Cache the result
          cache.set(
            cacheKey,
            {
              quotes: response.data,
              total: total.value
            },
            cachePatterns.quote()
          )

          return { success: true, data: response.data }
        } else {
          throw new Error(response.error?.message || '获取报价单列表失败')
        }
      } catch (err) {
        await handleStoreError(err, {
          context: { store: 'quotes', action: 'fetchQuotes' }
        })
        return { success: false, error: error.value }
      }
    })
  }

  /**
   * Fetch single quote with caching
   */
  async function fetchQuote(id: string) {
    const cacheKey = `quote_${id}`

    // Try cache first
    const cached = cache.get<Quote>(cacheKey)
    if (cached) {
      currentQuote.value = cached
      return cached
    }

    return await withLoading('quotes', 'fetchQuote', async () => {
      try {
        const response = await QuotesApi.getQuote(id)

        if (response.success && response.data) {
          currentQuote.value = response.data

          // Cache the result
          cache.set(cacheKey, response.data, cachePatterns.quote(id))

          return response.data
        } else {
          throw new Error(response.error?.message || '获取报价单详情失败')
        }
      } catch (err) {
        await handleStoreError(err, {
          context: { store: 'quotes', action: 'fetchQuote', payload: { id } }
        })
        return null
      }
    })
  }

  /**
   * Create quote with offline support and optimistic updates
   */
  async function createQuote(quoteData: CreateQuoteRequest) {
    const tempId = `temp_${Date.now()}`
    const tempQuoteNo = `QT${Date.now()}`
    
    // Calculate total price from items
    const totalPrice = quoteData.items.reduce((sum, item) => sum + item.total_price, 0)
    
    const tempQuote: Quote = {
      id: tempId,
      quote_no: tempQuoteNo,
      customer_id: tempId, // Will be updated when saved to server
      total_price: totalPrice,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: 'draft',
      customer: {
        ...quoteData.customer,
        id: tempId, // Temporary ID, will be updated when saved
        created_at: new Date().toISOString()
      },
      items: quoteData.items
    }

    return await optimisticCreate(
      `quote_${tempId}`,
      tempQuote,
      async () => {
        return await createOffline(
          tempQuote,
          async () => {
            const response = await QuotesApi.createQuote(quoteData)
            if (!response.success) {
              throw new Error(response.error?.message || '创建报价单失败')
            }
            return response.data!
          },
          tempId
        )
      },
      {
        addToList: quote => {
          quotes.value.unshift(quote)
          total.value++
        },
        removeFromList: quote => {
          const index = quotes.value.findIndex(q => q.id === quote.id)
          if (index > -1) {
            quotes.value.splice(index, 1)
            total.value--
          }
        },
        onSuccess: result => {
          if (result) {
            // Replace temp quote with real quote
            const index = quotes.value.findIndex(q => q.id === tempId)
            if (index > -1) {
              quotes.value[index] = result
            }

            // Invalidate related cache
            cache.invalidateByTag('quote')
          }
        }
      }
    )
  }

  /**
   * Update quote with offline support and optimistic updates
   */
  async function updateQuote(id: string, updates: Partial<Quote>) {
    const originalQuote = quotes.value.find(q => q.id === id)
    if (!originalQuote) {
      throw new Error('报价单不存在')
    }

    const updatedQuote = {
      ...originalQuote,
      ...updates,
      updated_at: new Date().toISOString()
    }

    return await optimisticUpdate(
      `quote_${id}`,
      originalQuote,
      updates,
      async () => {
        return await updateOffline(
          id,
          updates,
          async () => {
            const response = await QuotesApi.updateQuote(id, updates)
            if (!response.success) {
              throw new Error(response.error?.message || '更新报价单失败')
            }
            return response.data!
          },
          originalQuote
        )
      },
      {
        updateInList: (original, updated) => {
          const index = quotes.value.findIndex(q => q.id === original.id)
          if (index > -1) {
            quotes.value[index] = { ...original, ...updated }
          }

          // Update current quote if it's the same
          if (currentQuote.value?.id === original.id) {
            currentQuote.value = { ...original, ...updated }
          }
        },
        revertInList: original => {
          const index = quotes.value.findIndex(q => q.id === original.id)
          if (index > -1) {
            quotes.value[index] = original
          }

          // Revert current quote if it's the same
          if (currentQuote.value?.id === original.id) {
            currentQuote.value = original
          }
        },
        onSuccess: result => {
          if (result) {
            // Invalidate cache for this quote
            cache.invalidateByTag(`quote:${id}`)
          }
        }
      }
    )
  }

  /**
   * Approve quote with optimistic updates
   */
  async function approveQuote(id: string) {
    return await updateQuoteStatus(id, 'approved', '审批通过')
  }

  /**
   * Reject quote with optimistic updates
   */
  async function rejectQuote(id: string, reason?: string) {
    return await updateQuoteStatus(id, 'rejected', '已拒绝', { rejection_reason: reason })
  }

  /**
   * Helper function to update quote status
   */
  async function updateQuoteStatus(
    id: string,
    status: Quote['status'],
    successMessage: string,
    additionalData: Record<string, any> = {}
  ) {
    const updates = {
      status,
      ...additionalData,
      updated_at: new Date().toISOString()
    }

    const result = await updateQuote(id, updates)

    if (result) {
      console.log(successMessage)
      alert(successMessage)
    }

    return result
  }

  /**
   * Delete quote with offline support and optimistic updates
   */
  async function deleteQuote(id: string) {
    const quoteToDelete = quotes.value.find(q => q.id === id)
    if (!quoteToDelete) {
      throw new Error('报价单不存在')
    }

    return await optimisticDelete(
      `quote_${id}`,
      quoteToDelete,
      async () => {
        return await deleteOffline(id, async () => {
          const response = await QuotesApi.deleteQuote(id)
          if (!response.success) {
            throw new Error(response.error?.message || '删除报价单失败')
          }
        })
      },
      {
        removeFromList: quote => {
          const index = quotes.value.findIndex(q => q.id === quote.id)
          if (index > -1) {
            quotes.value.splice(index, 1)
            total.value--
          }

          // Clear current quote if it's the same
          if (currentQuote.value?.id === quote.id) {
            currentQuote.value = null
          }
        },
        addToList: quote => {
          quotes.value.push(quote)
          total.value++
        },
        onSuccess: () => {
          // Invalidate cache
          cache.invalidateByTag(`quote:${id}`)
          cache.invalidateByTag('quote')

          console.log('删除成功')
          alert('删除成功')
        }
      }
    )
  }

  /**
   * Export quotes (online only)
   */
  async function exportQuotes(params: { startDate: string; endDate: string; status?: string }) {
    return await withLoading('quotes', 'exportQuotes', async () => {
      try {
        const response = await QuotesApi.exportQuotes(params)

        if (response.success && response.data) {
          try {
            // Handle file download in web browser
            const downloadUrl = response.data as unknown as string
            
            // Create a temporary link element to trigger download
            const link = document.createElement('a')
            link.href = downloadUrl
            link.download = `quotes_export_${new Date().toISOString().split('T')[0]}.xlsx` // Default filename
            link.style.display = 'none'
            
            // Append to body, click, and remove
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            
            console.log('导出成功')
            alert('导出成功')
            
            return { success: true }
          } catch (error) {
            console.error('保存失败:', error)
            alert('保存失败')
            throw error
          }
        } else {
          throw new Error(response.error?.message || '导出失败')
        }
      } catch (err) {
        await handleStoreError(err, {
          context: { store: 'quotes', action: 'exportQuotes', payload: params }
        })
        return { success: false, error: error.value }
      }
    })
  }

  /**
   * Search quotes by phone with caching
   */
  async function searchByPhone(phone: string) {
    if (!phone.trim()) {
      return { success: true, data: [] }
    }

    const cacheKey = `quotes_search_${phone}`

    // Try cache first
    const cached = cache.get<Quote[]>(cacheKey)
    if (cached) {
      return { success: true, data: cached }
    }

    return await withLoading('quotes', 'searchByPhone', async () => {
      try {
        const response = await QuotesApi.getQuotesByPhone(phone)

        if (response.success) {
          const data = response.data || []

          // Cache search results for short time
          cache.set(cacheKey, data, cachePatterns.shortLived())

          return { success: true, data }
        } else {
          throw new Error(response.error?.message || '搜索失败')
        }
      } catch (err) {
        await handleStoreError(err, {
          context: { store: 'quotes', action: 'searchByPhone', payload: { phone } }
        })
        return { success: false, error: error.value, data: [] }
      }
    })
  }

  // Utility methods
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

  /**
   * Clear all cached data
   */
  function clearCache() {
    cache.clear()
  }

  /**
   * Refresh data (force reload)
   */
  async function refresh() {
    clearCache()
    return await fetchQuotes({ forceRefresh: true })
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

    // Computed
    pendingQuotes,
    approvedQuotes,
    rejectedQuotes,
    totalQuotesAmount,
    filteredQuotes,

    // Actions
    fetchQuotes,
    fetchQuote,
    createQuote,
    updateQuote,
    approveQuote,
    rejectQuote,
    deleteQuote,
    exportQuotes,
    searchByPhone,

    // Utilities
    resetFilters,
    setPage,
    setPageSize,
    getQuoteStats,
    clearCache,
    refresh
  }
})
