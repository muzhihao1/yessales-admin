import { mockAccessories, mockProducts } from './products'
import { mockCustomers, mockQuotes } from './quotes'
import type { ApiResponse } from '@/types/api'

export class MockService {
  private static delay(ms: number = 300): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  static async getProducts(): Promise<ApiResponse> {
    await this.delay()
    return {
      success: true,
      data: mockProducts
    }
  }

  static async getProduct(id: string): Promise<ApiResponse> {
    await this.delay()
    const product = mockProducts.find(p => p.id === id)

    if (!product) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: '产品不存在'
        }
      }
    }

    return {
      success: true,
      data: product
    }
  }

  static async getAccessories(): Promise<ApiResponse> {
    await this.delay()
    return {
      success: true,
      data: mockAccessories
    }
  }

  static async searchProducts(keyword: string): Promise<ApiResponse> {
    await this.delay()
    const results = mockProducts.filter(
      p => p.name.includes(keyword) || p.model.includes(keyword) || p.category.includes(keyword)
    )

    return {
      success: true,
      data: results
    }
  }

  static async getQuotes(): Promise<ApiResponse> {
    await this.delay()
    return {
      success: true,
      data: mockQuotes
    }
  }

  static async getQuote(id: string): Promise<ApiResponse> {
    await this.delay()
    const quote = mockQuotes.find(q => q.id === id)

    if (!quote) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: '报价单不存在'
        }
      }
    }

    return {
      success: true,
      data: quote
    }
  }

  static async getQuotesByPhone(phone: string): Promise<ApiResponse> {
    await this.delay()
    const customer = mockCustomers.find(c => c.phone === phone)

    if (!customer) {
      return {
        success: true,
        data: []
      }
    }

    const quotes = mockQuotes.filter(q => q.customer_id === customer.id)

    return {
      success: true,
      data: quotes
    }
  }

  static async createQuote(data: any): Promise<ApiResponse> {
    await this.delay()

    const newQuote = {
      id: `q${Date.now()}`,
      quote_no: `${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(mockQuotes.length + 1).padStart(3, '0')}`,
      customer_id: `c${Date.now()}`,
      total_price: data.items.reduce((sum: number, item: any) => sum + item.total_price, 0),
      status: 'pending' as const,
      remark: data.remark,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      customer: {
        id: `c${Date.now()}`,
        ...data.customer,
        created_at: new Date().toISOString()
      },
      items: data.items.map((item: any, index: number) => ({
        id: `qi${Date.now()}_${index}`,
        quote_id: `q${Date.now()}`,
        ...item
      }))
    }

    mockQuotes.unshift(newQuote)

    return {
      success: true,
      data: newQuote
    }
  }

  static async login(credentials: { username: string; password: string }): Promise<ApiResponse> {
    await this.delay(500)

    // 模拟登录验证
    if (credentials.username === 'admin' && credentials.password === 'admin123') {
      return {
        success: true,
        data: {
          access_token: `mock_token_${Date.now()}`,
          token_type: 'bearer',
          expires_in: 3600,
          refresh_token: `mock_refresh_${Date.now()}`,
          user: {
            id: 'u1',
            username: 'admin',
            role: 'admin',
            name: '管理员'
          }
        }
      }
    } else if (credentials.username === 'sales' && credentials.password === 'sales123') {
      return {
        success: true,
        data: {
          access_token: `mock_token_${Date.now()}`,
          token_type: 'bearer',
          expires_in: 3600,
          refresh_token: `mock_refresh_${Date.now()}`,
          user: {
            id: 'u2',
            username: 'sales',
            role: 'sales',
            name: '销售员小王'
          }
        }
      }
    }

    return {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: '用户名或密码错误'
      }
    }
  }
}

// 开发环境下使用 Mock 数据
export const useMockInDev =
  process.env.NODE_ENV === 'development' && !import.meta.env.VITE_USE_REAL_API

export default MockService
