import { supabase, handleError, getPaginationParams } from './client'
import type { Customer } from '../types/models'
import type { ApiResponse, PaginationParams } from '../types/api'

export const customersApi = {
  /**
   * 获取客户列表
   */
  async getCustomers(params: PaginationParams & { search?: string } = {}): Promise<ApiResponse<Customer[]>> {
    try {
      const { page = 1, page_size = 20, search, sort_by = 'created_at', sort_order = 'desc' } = params
      const { from, to } = getPaginationParams(page, page_size)

      let query = supabase
        .from('customers')
        .select('*', { count: 'exact' })
        .range(from, to)
        .order(sort_by, { ascending: sort_order === 'asc' })

      if (search) {
        query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%`)
      }

      const { data, error, count } = await query

      if (error) throw error

      return {
        success: true,
        data: data as Customer[],
        pagination: {
          page,
          page_size,
          total: count || 0
        }
      }
    } catch (error) {
      return handleError(error)
    }
  },

  /**
   * 获取客户详情
   */
  async getCustomer(id: string): Promise<ApiResponse<Customer>> {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error

      return {
        success: true,
        data: data as Customer
      }
    } catch (error) {
      return handleError(error)
    }
  },

  /**
   * 通过手机号查找客户
   */
  async getCustomerByPhone(phone: string): Promise<ApiResponse<Customer | null>> {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('phone', phone)
        .maybeSingle()

      if (error) throw error

      return {
        success: true,
        data: data as Customer | null
      }
    } catch (error) {
      return handleError(error)
    }
  },

  /**
   * 创建客户
   */
  async createCustomer(customer: Omit<Customer, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<Customer>> {
    try {
      // 验证手机号格式
      if (!/^\d{11}$/.test(customer.phone)) {
        return {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: '手机号格式不正确，请输入11位数字',
            field: 'phone'
          }
        }
      }

      // 验证姓名长度
      if (customer.name.length > 20) {
        return {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: '姓名长度不能超过20个字符',
            field: 'name'
          }
        }
      }

      const { data, error } = await supabase
        .from('customers')
        .insert(customer)
        .select()
        .single()

      if (error) throw error

      return {
        success: true,
        data: data as Customer
      }
    } catch (error) {
      return handleError(error)
    }
  },

  /**
   * 更新客户信息
   */
  async updateCustomer(id: string, updates: Partial<Customer>): Promise<ApiResponse<Customer>> {
    try {
      // 验证更新的数据
      if (updates.phone && !/^\d{11}$/.test(updates.phone)) {
        return {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: '手机号格式不正确，请输入11位数字',
            field: 'phone'
          }
        }
      }

      if (updates.name && updates.name.length > 20) {
        return {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: '姓名长度不能超过20个字符',
            field: 'name'
          }
        }
      }

      const { data, error } = await supabase
        .from('customers')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      return {
        success: true,
        data: data as Customer
      }
    } catch (error) {
      return handleError(error)
    }
  },

  /**
   * 删除客户
   */
  async deleteCustomer(id: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id)

      if (error) throw error

      return {
        success: true
      }
    } catch (error) {
      return handleError(error)
    }
  },

  /**
   * 获取客户的报价历史
   */
  async getCustomerQuotes(customerId: string): Promise<ApiResponse<any[]>> {
    try {
      const { data, error } = await supabase
        .from('quotes')
        .select(`
          *,
          items:quote_items(*)
        `)
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })

      if (error) throw error

      return {
        success: true,
        data: data || []
      }
    } catch (error) {
      return handleError(error)
    }
  },

  /**
   * 批量导入客户
   */
  async importCustomers(customers: Array<Omit<Customer, 'id' | 'created_at' | 'updated_at'>>): Promise<ApiResponse<Customer[]>> {
    try {
      // 验证所有客户数据
      for (const customer of customers) {
        if (!/^\d{11}$/.test(customer.phone)) {
          return {
            success: false,
            error: {
              code: 'INVALID_INPUT',
              message: `客户 ${customer.name} 的手机号格式不正确`
            }
          }
        }
        if (customer.name.length > 20) {
          return {
            success: false,
            error: {
              code: 'INVALID_INPUT',
              message: `客户 ${customer.name} 的姓名长度超过限制`
            }
          }
        }
      }

      const { data, error } = await supabase
        .from('customers')
        .insert(customers)
        .select()

      if (error) throw error

      return {
        success: true,
        data: data as Customer[]
      }
    } catch (error) {
      return handleError(error)
    }
  }
}