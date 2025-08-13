/**
 * API Service Layer - Bridge between Frontend and Terminal 1 APIs
 *
 * This service layer provides a unified API interface that bridges the gap between
 * the frontend expectations and Terminal 1's Supabase-based APIs.
 */

import { ApiClient } from '@/api/client'
import { supabase } from '@/api/config'
import type { ApiResponse } from '@/types/api'

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
      const query: any = {}
      if (params.search) {
        // For search, we'll use a text search on name or phone
        query.or = `name.ilike.%${params.search}%,phone.ilike.%${params.search}%`
      }
      if (params.sortBy) {
        query.order = `${params.sortBy}.${params.sortOrder || 'asc'}`
      }
      if (params.page && params.pageSize) {
        query.limit = params.pageSize
        query.offset = (params.page - 1) * params.pageSize
      }

      return await ApiClient.request('GET', 'customers', {
        query,
        select: '*'
      })
    }

    if (endpoint.startsWith('/api/customers/') && endpoint.includes('/quotes')) {
      const customerId = endpoint.split('/')[3]
      const response = await ApiClient.request('GET', 'quotes', {
        query: { customer_id: customerId },
        select: '*'
      })
      return {
        data: {
          data: response.data,
          total: Array.isArray(response.data) ? response.data.length : 0
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
      const response = await ApiClient.request('GET', 'customers', {
        id: customerId,
        select: '*'
      })

      // Transform the response to include additional customer details structure
      if (response.success && response.data) {
        const customerDetail = {
          ...(response.data as object),
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
          const quotesResponse = await ApiClient.request('GET', 'quotes', {
            query: { customer_id: customerId },
            select: '*'
          })
          if (quotesResponse.success && quotesResponse.data && Array.isArray(quotesResponse.data)) {
            customerDetail.quotes = quotesResponse.data.map((quote: any) => ({
              id: quote.id,
              quote_number: quote.quote_no || quote.id,
              total_amount: quote.total_price || quote.total_amount || 0,
              items_count: quote.items?.length || 0,
              created_at: quote.created_at,
              status: quote.status
            }))
            customerDetail.total_quotes = quotesResponse.data.length
            customerDetail.total_amount = quotesResponse.data.reduce(
              (sum: number, q: any) => sum + (q.total_price || q.total_amount || 0),
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
        const response = await ApiClient.request('GET', 'customers', {
          query: { phone: params.phone },
          select: '*'
        })
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
      return await ApiClient.request('POST', 'customers', { data })
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
      const response = await ApiClient.request('GET', 'customers', {
        id: data.primary_customer_id,
        select: '*'
      })
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
      return await ApiClient.request('PUT', 'customers', { 
        id: customerId, 
        data 
      })
    }

    throw new Error(`Unhandled PUT endpoint: ${endpoint}`)
  },

  /**
   * DELETE request handler
   */
  async delete(endpoint: string) {
    if (endpoint.startsWith('/api/customers/')) {
      const customerId = endpoint.split('/')[3]
      return await ApiClient.request('DELETE', 'customers', { id: customerId })
    }

    throw new Error(`Unhandled DELETE endpoint: ${endpoint}`)
  }
}

/**
 * Auth API wrapper
 */
export const authService = {
  async login(credentials: { email: string; password: string }) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      })
      
      if (error) {
        return {
          success: false,
          error: {
            code: 'AUTH_ERROR',
            message: error.message
          }
        }
      }
      
      return {
        success: true,
        data: {
          user: data.user,
          session: data.session
        }
      }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'AUTH_ERROR',
          message: 'Login failed'
        }
      }
    }
  },

  async logout() {
    try {
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        return {
          success: false,
          error: {
            code: 'AUTH_ERROR',
            message: error.message
          }
        }
      }
      
      return {
        success: true
      }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'AUTH_ERROR',
          message: 'Logout failed'
        }
      }
    }
  },

  async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error) {
        return {
          success: false,
          error: {
            code: 'AUTH_ERROR',
            message: error.message
          }
        }
      }
      
      return {
        success: true,
        data: user
      }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'AUTH_ERROR',
          message: 'Failed to get current user'
        }
      }
    }
  }
}

/**
 * Upload service wrapper
 */
export const uploadService = {
  async uploadFile(file: File, path: string) {
    return await ApiClient.uploadFile(file, 'uploads', path)
  }
}
