import ApiClient from './client'
import { supabase } from './config'
import type { Quote, QuoteExportParams } from '@/types/models'
import type { ApiResponse, CreateQuoteRequest, QueryParams } from '@/types/api'

export class QuotesApi {
  static async getQuotes(params?: QueryParams): Promise<ApiResponse<Quote[]>> {
    return ApiClient.request<Quote[]>('GET', 'quotes', {
      query: params,
      select: `
        *,
        customer:customers(*),
        sales:users(*),
        items:quote_items(*)
      `
    })
  }

  static async getQuote(id: string): Promise<ApiResponse<Quote>> {
    return ApiClient.request<Quote>('GET', 'quotes', {
      id,
      select: `
        *,
        customer:customers(*),
        sales:users(*),
        items:quote_items(*)
      `
    })
  }

  static async createQuote(request: CreateQuoteRequest): Promise<ApiResponse<Quote>> {
    try {
      // 1. 创建或查找客户
      let customerId: string
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('id')
        .eq('phone', request.customer.phone)
        .single()

      if (existingCustomer) {
        customerId = existingCustomer.id
        // 更新客户信息
        await supabase
          .from('customers')
          .update({
            ...request.customer,
            updated_at: new Date().toISOString()
          })
          .eq('id', customerId)
      } else {
        // 创建新客户
        const { data: newCustomer, error: customerError } = await supabase
          .from('customers')
          .insert(request.customer)
          .select()
          .single()

        if (customerError) throw customerError
        customerId = newCustomer.id
      }

      // 2. 生成报价单号
      const { data: quoteNoData, error: quoteNoError } =
        await supabase.functions.invoke('generate-quote-no')

      if (quoteNoError) throw quoteNoError

      // 3. 计算总价
      const totalPrice = request.items.reduce((sum, item) => sum + item.total_price, 0)

      // 4. 创建报价单
      const { data: quote, error: quoteError } = await supabase
        .from('quotes')
        .insert({
          quote_no: quoteNoData.quote_no,
          customer_id: customerId,
          total_price: totalPrice,
          status: 'pending',
          remark: request.remark
        })
        .select()
        .single()

      if (quoteError) throw quoteError

      // 5. 创建报价明细
      const items = request.items.map(item => ({
        ...item,
        quote_id: quote.id
      }))

      const { error: itemsError } = await supabase.from('quote_items').insert(items)

      if (itemsError) throw itemsError

      // 6. 返回完整的报价单信息
      return this.getQuote(quote.id)
    } catch (error) {
      return ApiClient.handleError(error)
    }
  }

  static async updateQuote(id: string, quote: Partial<Quote>): Promise<ApiResponse<Quote>> {
    return ApiClient.request<Quote>('PUT', 'quotes', {
      id,
      data: {
        ...quote,
        updated_at: new Date().toISOString()
      }
    })
  }

  static async deleteQuote(id: string): Promise<ApiResponse> {
    return ApiClient.request('DELETE', 'quotes', { id })
  }

  static async getQuotesByPhone(phone: string): Promise<ApiResponse<Quote[]>> {
    try {
      // 先查询客户
      const { data: customers, error: customerError } = await supabase
        .from('customers')
        .select('id')
        .eq('phone', phone)

      if (customerError) throw customerError
      if (!customers || customers.length === 0) {
        return {
          success: true,
          data: []
        }
      }

      const customerIds = customers.map(c => c.id)

      // 查询报价单
      const { data: quotes, error: quotesError } = await supabase
        .from('quotes')
        .select(
          `
          *,
          customer:customers(*),
          sales:users(*),
          items:quote_items(*)
        `
        )
        .in('customer_id', customerIds)
        .order('created_at', { ascending: false })

      if (quotesError) throw quotesError

      return {
        success: true,
        data: quotes || []
      }
    } catch (error) {
      return ApiClient.handleError(error)
    }
  }

  static async approveQuote(id: string): Promise<ApiResponse<Quote>> {
    return this.updateQuote(id, { status: 'approved' })
  }

  static async rejectQuote(id: string, reason?: string): Promise<ApiResponse<Quote>> {
    return this.updateQuote(id, {
      status: 'rejected',
      remark: reason
    })
  }

  static async exportQuotes(params: QuoteExportParams): Promise<ApiResponse<Blob>> {
    try {
      const { data, error } = await supabase.functions.invoke('export-quotes', {
        body: params
      })

      if (error) throw error

      return {
        success: true,
        data
      }
    } catch (error) {
      return ApiClient.handleError(error)
    }
  }
}

export default QuotesApi
