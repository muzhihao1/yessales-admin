import { supabase, handleError, getPaginationParams } from './client'
import type { Quote, QuoteItem, Customer } from '../types/models'
import type { ApiResponse, QuoteListParams, CreateQuoteRequest, UpdateQuoteRequest } from '../types/api'

export const quotesApi = {
  /**
   * 获取报价单列表
   */
  async getQuotes(params: QuoteListParams = {}): Promise<ApiResponse<Quote[]>> {
    try {
      const { 
        page = 1, 
        page_size = 20, 
        status, 
        customer_id, 
        sales_id, 
        start_date, 
        end_date, 
        search,
        sort_by = 'created_at',
        sort_order = 'desc'
      } = params
      const { from, to } = getPaginationParams(page, page_size)

      let query = supabase
        .from('quotes')
        .select(`
          *,
          customer:customers(*),
          sales:users(*),
          items:quote_items(*)
        `, { count: 'exact' })
        .range(from, to)
        .order(sort_by, { ascending: sort_order === 'asc' })

      // 应用过滤条件
      if (status) {
        query = query.eq('status', status)
      }
      if (customer_id) {
        query = query.eq('customer_id', customer_id)
      }
      if (sales_id) {
        query = query.eq('sales_id', sales_id)
      }
      if (start_date) {
        query = query.gte('created_at', start_date)
      }
      if (end_date) {
        query = query.lte('created_at', end_date)
      }
      if (search) {
        query = query.or(`quote_no.ilike.%${search}%`)
      }

      const { data, error, count } = await query

      if (error) throw error

      return {
        success: true,
        data: data as Quote[],
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
   * 获取报价单详情
   */
  async getQuote(id: string): Promise<ApiResponse<Quote>> {
    try {
      const { data, error } = await supabase
        .from('quotes')
        .select(`
          *,
          customer:customers(*),
          sales:users(*),
          items:quote_items(*)
        `)
        .eq('id', id)
        .single()

      if (error) throw error

      return {
        success: true,
        data: data as Quote
      }
    } catch (error) {
      return handleError(error)
    }
  },

  /**
   * 创建报价单
   */
  async createQuote(request: CreateQuoteRequest): Promise<ApiResponse<Quote>> {
    try {
      // 1. 处理客户信息
      let customerId = request.customer_id
      
      if (!customerId && request.customer) {
        // 创建新客户
        const { data: newCustomer, error: customerError } = await supabase
          .from('customers')
          .insert(request.customer)
          .select()
          .single()

        if (customerError) throw customerError
        customerId = newCustomer.id
      }

      if (!customerId) {
        throw new Error('客户信息不能为空')
      }

      // 2. 调用 Edge Function 生成报价单号
      const { data: quoteNoData, error: quoteNoError } = await supabase.functions
        .invoke('generate-quote-no')

      if (quoteNoError) throw quoteNoError

      const { quote_no } = quoteNoData.data

      // 3. 计算总价
      const totalPrice = request.items.reduce((sum, item) => sum + item.total_price, 0)

      // 4. 创建报价单
      const { data: quote, error: quoteError } = await supabase
        .from('quotes')
        .insert({
          quote_no,
          customer_id: customerId,
          sales_id: null, // 销售端无需登录，不设置销售员
          total_price: totalPrice,
          status: 'pending',
          remark: request.remark
        })
        .select()
        .single()

      if (quoteError) throw quoteError

      // 5. 创建报价明细
      const quoteItems = request.items.map(item => ({
        ...item,
        quote_id: quote.id
      }))

      const { error: itemsError } = await supabase
        .from('quote_items')
        .insert(quoteItems)

      if (itemsError) {
        // 如果明细创建失败，删除报价单
        await supabase.from('quotes').delete().eq('id', quote.id)
        throw itemsError
      }

      // 6. 返回完整的报价单信息
      return await this.getQuote(quote.id)
    } catch (error) {
      return handleError(error)
    }
  },

  /**
   * 更新报价单
   */
  async updateQuote(id: string, updates: UpdateQuoteRequest): Promise<ApiResponse<Quote>> {
    try {
      const updateData: any = {}
      
      if (updates.status) {
        updateData.status = updates.status
      }
      if (updates.remark !== undefined) {
        updateData.remark = updates.remark
      }

      const { error } = await supabase
        .from('quotes')
        .update(updateData)
        .eq('id', id)

      if (error) throw error

      // 如果更新了明细项
      if (updates.items) {
        // 删除原有明细
        await supabase
          .from('quote_items')
          .delete()
          .eq('quote_id', id)

        // 插入新明细
        const quoteItems = updates.items.map(item => ({
          ...item,
          quote_id: id
        }))

        const { error: itemsError } = await supabase
          .from('quote_items')
          .insert(quoteItems)

        if (itemsError) throw itemsError

        // 更新总价
        const totalPrice = updates.items.reduce((sum, item) => sum + item.total_price, 0)
        await supabase
          .from('quotes')
          .update({ total_price: totalPrice })
          .eq('id', id)
      }

      return await this.getQuote(id)
    } catch (error) {
      return handleError(error)
    }
  },

  /**
   * 删除报价单
   */
  async deleteQuote(id: string): Promise<ApiResponse<void>> {
    try {
      // 由于设置了 CASCADE，删除报价单会自动删除明细
      const { error } = await supabase
        .from('quotes')
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
   * 导出报价单
   */
  async exportQuotes(params: { startDate?: string; endDate?: string; status?: string } = {}): Promise<Blob> {
    try {
      const { data, error } = await supabase.functions
        .invoke('export-quotes', {
          body: params
        })

      if (error) throw error

      return data as Blob
    } catch (error) {
      throw error
    }
  },

  /**
   * 获取报价单统计数据
   */
  async getQuoteStatistics(): Promise<ApiResponse<any>> {
    try {
      // 获取今日、本周、本月的报价单统计
      const today = new Date().toISOString().split('T')[0]
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

      const [todayData, weekData, monthData] = await Promise.all([
        supabase
          .from('quotes')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', today),
        supabase
          .from('quotes')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', weekAgo),
        supabase
          .from('quotes')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', monthAgo)
      ])

      // 获取各状态数量
      const { data: statusData } = await supabase
        .from('quotes')
        .select('status')

      const statusCount = statusData?.reduce((acc: any, item) => {
        acc[item.status] = (acc[item.status] || 0) + 1
        return acc
      }, {})

      return {
        success: true,
        data: {
          today: todayData.count || 0,
          week: weekData.count || 0,
          month: monthData.count || 0,
          statusCount
        }
      }
    } catch (error) {
      return handleError(error)
    }
  }
}