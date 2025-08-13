import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { ApiService } from '@/api'
import type {
  CreateCustomerData,
  Customer,
  CustomerActivity,
  CustomerDetail,
  CustomerExportData,
  CustomerFilters,
  CustomerQuoteSummary,
  CustomerStatistics,
  UpdateCustomerData
} from '@/types/customer'

export const useCustomersStore = defineStore('customers', () => {
  // State
  const customers = ref<Customer[]>([])
  const currentCustomer = ref<CustomerDetail | null>(null)
  const totalCount = ref(0)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Computed statistics
  const statistics = computed<CustomerStatistics>(() => {
    const stats: CustomerStatistics = {
      total: customers.value.length,
      individual: 0,
      business: 0,
      active: 0,
      inactive: 0,
      potential: 0,
      blacklist: 0,
      walk_in: 0,
      referral: 0,
      online: 0,
      phone: 0,
      exhibition: 0,
      other: 0,
      total_revenue: 0,
      average_quote_value: 0,
      active_customers_with_quotes: 0
    }

    customers.value.forEach(customer => {
      // Customer type statistics
      if (customer.customer_type === 'individual') {
        stats.individual++
      } else {
        stats.business++
      }

      // Status statistics
      switch (customer.status) {
        case 'active':
          stats.active++
          break
        case 'inactive':
          stats.inactive++
          break
        case 'potential':
          stats.potential++
          break
        case 'blacklist':
          stats.blacklist++
          break
      }

      // Source statistics
      switch (customer.source) {
        case 'walk_in':
          stats.walk_in++
          break
        case 'referral':
          stats.referral++
          break
        case 'online':
          stats.online++
          break
        case 'phone':
          stats.phone++
          break
        case 'exhibition':
          stats.exhibition++
          break
        case 'other':
          stats.other++
          break
      }

      // Business metrics
      if (customer.total_amount) {
        stats.total_revenue += customer.total_amount
        if (customer.total_quotes && customer.total_quotes > 0) {
          stats.active_customers_with_quotes++
        }
      }
    })

    // Calculate average quote value
    if (stats.active_customers_with_quotes > 0) {
      stats.average_quote_value = stats.total_revenue / stats.active_customers_with_quotes
    }

    return stats
  })

  // Actions
  async function fetchCustomers(filters: CustomerFilters = {}) {
    loading.value = true
    error.value = null

    try {
      const response = await ApiService.get('/api/customers', {
        params: {
          page: filters.page || 1,
          pageSize: filters.pageSize || 20,
          search: filters.search,
          customer_type: filters.customer_type,
          status: filters.status,
          source: filters.source,
          city: filters.city,
          district: filters.district,
          sortBy: filters.sortBy || 'created_at',
          sortOrder: filters.sortOrder || 'desc',
          startDate: filters.startDate,
          endDate: filters.endDate,
          hasQuotes: filters.hasQuotes,
          minAmount: filters.minAmount,
          maxAmount: filters.maxAmount,
          lastQuoteBefore: filters.lastQuoteBefore,
          lastQuoteAfter: filters.lastQuoteAfter
        }
      })

      customers.value = response.data.data
      totalCount.value = response.data.total
    } catch (err: any) {
      error.value = err.message || '获取客户列表失败'
      console.error('Failed to fetch customers:', err)
    } finally {
      loading.value = false
    }
  }

  async function fetchCustomerById(id: string, includeQuotes = true, includeActivities = true) {
    loading.value = true
    error.value = null

    try {
      const response = await ApiService.get(`/api/customers/${id}`, {
        params: {
          include_quotes: includeQuotes,
          include_activities: includeActivities
        }
      })
      currentCustomer.value = response.data
      return response.data
    } catch (err: any) {
      error.value = err.message || '获取客户详情失败'
      console.error('Failed to fetch customer:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createCustomer(customerData: CreateCustomerData) {
    loading.value = true
    error.value = null

    try {
      const response = await ApiService.post('/api/customers', customerData)
      customers.value.unshift(response.data)
      totalCount.value++
      return response.data
    } catch (err: any) {
      error.value = err.message || '创建客户失败'
      console.error('Failed to create customer:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateCustomer(id: string, customerData: UpdateCustomerData) {
    loading.value = true
    error.value = null

    try {
      const response = await ApiService.put(`/api/customers/${id}`, customerData)
      const index = customers.value.findIndex(c => c.id === id)
      if (index !== -1) {
        customers.value[index] = { ...customers.value[index], ...response.data }
      }
      if (currentCustomer.value?.id === id) {
        currentCustomer.value = { ...currentCustomer.value, ...response.data }
      }
      return response.data
    } catch (err: any) {
      error.value = err.message || '更新客户失败'
      console.error('Failed to update customer:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteCustomer(id: string) {
    loading.value = true
    error.value = null

    try {
      await ApiService.delete(`/api/customers/${id}`)
      customers.value = customers.value.filter(c => c.id !== id)
      totalCount.value--
    } catch (err: any) {
      error.value = err.message || '删除客户失败'
      console.error('Failed to delete customer:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateCustomerStatus(id: string, status: Customer['status']) {
    return updateCustomer(id, { status })
  }

  async function searchCustomersByPhone(phone: string) {
    loading.value = true
    error.value = null

    try {
      const response = await ApiService.get('/api/customers/search', {
        params: { phone }
      })
      return response.data
    } catch (err: any) {
      error.value = err.message || '搜索客户失败'
      console.error('Failed to search customers:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function getCustomerQuotes(customerId: string, page = 1, pageSize = 10) {
    loading.value = true
    error.value = null

    try {
      const response = await ApiService.get(`/api/customers/${customerId}/quotes`, {
        params: { page, pageSize }
      })
      return response.data
    } catch (err: any) {
      error.value = err.message || '获取客户报价记录失败'
      console.error('Failed to fetch customer quotes:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function getCustomerActivities(customerId: string, page = 1, pageSize = 20) {
    loading.value = true
    error.value = null

    try {
      const response = await ApiService.get(`/api/customers/${customerId}/activities`, {
        params: { page, pageSize }
      })
      return response.data
    } catch (err: any) {
      error.value = err.message || '获取客户活动记录失败'
      console.error('Failed to fetch customer activities:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function addCustomerActivity(
    customerId: string,
    activity: {
      type: CustomerActivity['type']
      description: string
      metadata?: Record<string, any>
    }
  ) {
    loading.value = true
    error.value = null

    try {
      const response = await ApiService.post(`/api/customers/${customerId}/activities`, activity)

      // Update current customer activities if loaded
      if (currentCustomer.value?.id === customerId && currentCustomer.value.recent_activities) {
        currentCustomer.value.recent_activities.unshift(response.data)
      }

      return response.data
    } catch (err: any) {
      error.value = err.message || '添加客户活动记录失败'
      console.error('Failed to add customer activity:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function exportCustomers(exportData: CustomerExportData = {}) {
    loading.value = true
    error.value = null

    try {
      const response = await ApiService.get('/api/customers/export', {
        params: {
          ...exportData,
          format: exportData.format || 'excel'
        }
      })

      // Create download link
      const blob = new Blob([response.data], {
        type:
          exportData.format === 'csv'
            ? 'text/csv'
            : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url

      const fileName = `customers_${new Date().toISOString().split('T')[0]}.${exportData.format || 'xlsx'}`
      link.download = fileName
      link.click()
      window.URL.revokeObjectURL(url)
    } catch (err: any) {
      error.value = err.message || '导出客户数据失败'
      console.error('Failed to export customers:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function bulkCreateCustomers(customersData: Partial<Customer>[]) {
    loading.value = true
    error.value = null

    try {
      const response = await ApiService.post('/api/customers/bulk', {
        customers: customersData
      })

      // Add new customers to the beginning of the list
      customers.value.unshift(...response.data)
      totalCount.value += response.data.length

      return { success: true, data: response.data }
    } catch (err: any) {
      error.value = err.message || '批量创建客户失败'
      console.error('Failed to bulk create customers:', err)
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  async function mergeCustomers(primaryCustomerId: string, duplicateCustomerId: string) {
    loading.value = true
    error.value = null

    try {
      const response = await ApiService.post('/api/customers/merge', {
        primary_customer_id: primaryCustomerId,
        duplicate_customer_id: duplicateCustomerId
      })

      // Remove duplicate customer from list
      customers.value = customers.value.filter(c => c.id !== duplicateCustomerId)
      totalCount.value--

      // Update primary customer with merged data
      const primaryIndex = customers.value.findIndex(c => c.id === primaryCustomerId)
      if (primaryIndex !== -1) {
        customers.value[primaryIndex] = response.data
      }

      return response.data
    } catch (err: any) {
      error.value = err.message || '合并客户失败'
      console.error('Failed to merge customers:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function getCustomerStatistics() {
    loading.value = true
    error.value = null

    try {
      const response = await ApiService.get('/api/customers/statistics')
      return response.data
    } catch (err: any) {
      error.value = err.message || '获取客户统计失败'
      console.error('Failed to fetch customer statistics:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  function clearError() {
    error.value = null
  }

  function clearCurrentCustomer() {
    currentCustomer.value = null
  }

  // Helper functions
  function findCustomerByPhone(phone: string): Customer | undefined {
    return customers.value.find(customer => customer.phone === phone)
  }

  function getCustomerDisplayName(customer: Customer): string {
    if (customer.customer_type === 'business' && customer.company) {
      return `${customer.company} (${customer.name})`
    }
    return customer.name
  }

  function isCustomerActive(customer: Customer): boolean {
    return customer.status === 'active'
  }

  return {
    // State
    customers,
    currentCustomer,
    totalCount,
    loading,
    error,
    statistics,

    // Actions
    fetchCustomers,
    fetchCustomerById,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    updateCustomerStatus,
    searchCustomersByPhone,
    getCustomerQuotes,
    getCustomerActivities,
    addCustomerActivity,
    exportCustomers,
    bulkCreateCustomers,
    mergeCustomers,
    getCustomerStatistics,
    clearError,
    clearCurrentCustomer,

    // Helper functions
    findCustomerByPhone,
    getCustomerDisplayName,
    isCustomerActive
  }
})
