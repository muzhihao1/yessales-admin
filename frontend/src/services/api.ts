/**
 * API Service Layer - Bridge between Frontend and Terminal 1 APIs
 *
 * This service layer provides a unified API interface that bridges the gap between
 * the frontend expectations and Terminal 1's Supabase-based APIs.
 */

import { customersApi } from '../../../shared/api/customers'
import { productsApi } from '../../../shared/api/products'
import { quotesApi } from '../../../shared/api/quotes'
import { authApi } from '../../../shared/api/auth'
import type { ApiResponse } from '../../../shared/types/api'

/**
 * HTTP-like API client that translates REST-style calls to Supabase API calls
 */
export const api = {
  /**
   * GET request handler
   */
  async get(
    endpoint: string,
    options: { params?: Record<string, any>; responseType?: string } = {}
  ) {
    const { params = {}, responseType } = options

    // Handle different endpoints
    if (endpoint === '/api/customers') {
      return await customersApi.getCustomers({
        page: params.page,
        page_size: params.pageSize,
        search: params.search,
        sort_by: params.sortBy,
        sort_order: params.sortOrder
      })
    }

    if (endpoint.startsWith('/api/customers/') && endpoint.includes('/quotes')) {
      const customerId = endpoint.split('/')[3]
      const response = await customersApi.getCustomerQuotes(customerId)
      return {
        data: {
          data: response.data,
          total: response.data?.length || 0
        }
      }
    }

    if (endpoint.startsWith('/api/customers/') && endpoint.includes('/activities')) {
      const customerId = endpoint.split('/')[3]
      // For now, return empty activities since this API isn't implemented yet
      return {
        data: {
          data: [],
          total: 0
        }
      }
    }

    if (endpoint.startsWith('/api/customers/') && !endpoint.includes('/')) {
      const customerId = endpoint.split('/')[3]
      const response = await customersApi.getCustomer(customerId)

      // Transform the response to include additional customer details structure
      if (response.success && response.data) {
        const customerDetail = {
          ...response.data,
          quotes: [],
          recent_activities: [],
          total_quotes: 0,
          total_amount: 0,
          last_quote_at: null,
          created_by_name: '系统',
          updated_by_name: '系统'
        }

        // Fetch customer quotes if needed
        try {
          const quotesResponse = await customersApi.getCustomerQuotes(customerId)
          if (quotesResponse.success && quotesResponse.data) {
            customerDetail.quotes = quotesResponse.data.map((quote: any) => ({
              id: quote.id,
              quote_number: quote.quote_no,
              total_amount: quote.total_price,
              items_count: quote.items?.length || 0,
              created_at: quote.created_at,
              status: quote.status
            }))
            customerDetail.total_quotes = quotesResponse.data.length
            customerDetail.total_amount = quotesResponse.data.reduce(
              (sum: number, q: any) => sum + (q.total_price || 0),
              0
            )
            if (quotesResponse.data.length > 0) {
              customerDetail.last_quote_at = quotesResponse.data[0].created_at
            }
          }
        } catch (error) {
          console.warn('Failed to fetch customer quotes:', error)
        }

        return customerDetail
      }
      return response.data
    }

    if (endpoint === '/api/customers/search') {
      if (params.phone) {
        const response = await customersApi.getCustomerByPhone(params.phone)
        return {
          data: response.data ? [response.data] : []
        }
      }
      return { data: [] }
    }

    if (endpoint === '/api/customers/statistics') {
      // Return mock statistics for now
      return {
        data: {
          total: 0,
          individual: 0,
          business: 0,
          active: 0,
          inactive: 0,
          potential: 0,
          blacklist: 0
        }
      }
    }

    if (endpoint === '/api/customers/export' && responseType === 'blob') {
      // Create a mock export for now
      const csvContent = 'Name,Phone\nSample Customer,13800138000'
      const blob = new Blob([csvContent], { type: 'text/csv' })
      return { data: blob }
    }

    throw new Error(`Unhandled GET endpoint: ${endpoint}`)
  },

  /**
   * POST request handler
   */
  async post(endpoint: string, data: any) {
    if (endpoint === '/api/customers') {
      return await customersApi.createCustomer(data)
    }

    if (endpoint.startsWith('/api/customers/') && endpoint.includes('/activities')) {
      const customerId = endpoint.split('/')[3]
      // For now, return a mock response since activities API isn't fully implemented
      return {
        data: {
          id: Date.now().toString(),
          customer_id: customerId,
          type: data.type,
          description: data.description,
          metadata: data.metadata || {},
          created_at: new Date().toISOString(),
          created_by: '当前用户'
        }
      }
    }

    if (endpoint === '/api/customers/merge') {
      // Mock merge functionality for now
      const response = await customersApi.getCustomer(data.primary_customer_id)
      return response
    }

    throw new Error(`Unhandled POST endpoint: ${endpoint}`)
  },

  /**
   * PUT request handler
   */
  async put(endpoint: string, data: any) {
    if (endpoint.startsWith('/api/customers/')) {
      const customerId = endpoint.split('/')[3]
      return await customersApi.updateCustomer(customerId, data)
    }

    throw new Error(`Unhandled PUT endpoint: ${endpoint}`)
  },

  /**
   * DELETE request handler
   */
  async delete(endpoint: string) {
    if (endpoint.startsWith('/api/customers/')) {
      const customerId = endpoint.split('/')[3]
      return await customersApi.deleteCustomer(customerId)
    }

    throw new Error(`Unhandled DELETE endpoint: ${endpoint}`)
  }
}

/**
 * Auth API wrapper
 */
export const authService = {
  async login(credentials: { email: string; password: string }) {
    return await authApi.login(credentials.email, credentials.password)
  },

  async logout() {
    return await authApi.logout()
  },

  async getCurrentUser() {
    return await authApi.getCurrentUser()
  }
}

/**
 * Upload service wrapper
 */
export const uploadService = {
  async uploadFile(file: File, path: string) {
    // For now, return a mock upload response
    return {
      success: true,
      data: {
        url: `https://placeholder.image/400x300?text=${encodeURIComponent(file.name)}`
      }
    }
  }
}
