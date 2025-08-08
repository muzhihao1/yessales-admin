import { ApiClient, AuthApi, ProductsApi, QuotesApi } from './index'
import type { ApiResponse, CreateQuoteRequest, QueryParams } from '@/types/api'
import type { Accessory, Product, Quote } from '@/types/models'

/**
 * 统一的API服务类
 * 提供与MockService相同的接口，使用真实的Supabase API
 * 可以无缝替换MockService，无需修改业务代码
 */
export class ApiService {
  // ============= 产品相关API =============

  /**
   * 获取产品列表
   * @param params 查询参数
   * @returns 产品列表
   */
  static async getProducts(params?: QueryParams): Promise<ApiResponse<Product[]>> {
    return ProductsApi.getProducts(params)
  }

  /**
   * 获取单个产品
   * @param id 产品ID
   * @returns 产品详情
   */
  static async getProduct(id: string): Promise<ApiResponse<Product>> {
    return ProductsApi.getProduct(id)
  }

  /**
   * 获取配件列表
   * @param params 查询参数
   * @returns 配件列表
   */
  static async getAccessories(params?: QueryParams): Promise<ApiResponse<Accessory[]>> {
    return ProductsApi.getAccessories(params)
  }

  /**
   * 搜索产品
   * @param keyword 搜索关键词
   * @returns 搜索结果
   */
  static async searchProducts(keyword: string): Promise<ApiResponse<Product[]>> {
    return ProductsApi.searchProducts(keyword)
  }

  // ============= 报价单相关API =============

  /**
   * 获取报价单列表
   * @param params 查询参数
   * @returns 报价单列表
   */
  static async getQuotes(params?: QueryParams): Promise<ApiResponse<Quote[]>> {
    return QuotesApi.getQuotes(params)
  }

  /**
   * 获取单个报价单
   * @param id 报价单ID
   * @returns 报价单详情
   */
  static async getQuote(id: string): Promise<ApiResponse<Quote>> {
    return QuotesApi.getQuote(id)
  }

  /**
   * 根据手机号查询报价单
   * @param phone 手机号
   * @returns 报价单列表
   */
  static async getQuotesByPhone(phone: string): Promise<ApiResponse<Quote[]>> {
    return QuotesApi.getQuotesByPhone(phone)
  }

  /**
   * 创建报价单
   * @param data 报价单数据
   * @returns 创建结果
   */
  static async createQuote(data: CreateQuoteRequest): Promise<ApiResponse<Quote>> {
    return QuotesApi.createQuote(data)
  }

  /**
   * 更新报价单
   * @param id 报价单ID
   * @param data 更新数据
   * @returns 更新结果
   */
  static async updateQuote(id: string, data: Partial<Quote>): Promise<ApiResponse<Quote>> {
    return QuotesApi.updateQuote(id, data)
  }

  /**
   * 删除报价单
   * @param id 报价单ID
   * @returns 删除结果
   */
  static async deleteQuote(id: string): Promise<ApiResponse> {
    return QuotesApi.deleteQuote(id)
  }

  /**
   * 批准报价单
   * @param id 报价单ID
   * @returns 批准结果
   */
  static async approveQuote(id: string): Promise<ApiResponse<Quote>> {
    return QuotesApi.approveQuote(id)
  }

  /**
   * 拒绝报价单
   * @param id 报价单ID
   * @param reason 拒绝原因
   * @returns 拒绝结果
   */
  static async rejectQuote(id: string, reason?: string): Promise<ApiResponse<Quote>> {
    return QuotesApi.rejectQuote(id, reason)
  }

  // ============= 用户认证相关API =============

  /**
   * 用户登录
   * @param credentials 登录凭据
   * @returns 登录结果
   */
  static async login(credentials: { username: string; password: string }): Promise<ApiResponse> {
    return AuthApi.login(credentials)
  }

  /**
   * 用户登出
   * @returns 登出结果
   */
  static async logout(): Promise<ApiResponse> {
    return AuthApi.logout()
  }

  /**
   * 获取当前用户
   * @returns 当前用户信息
   */
  static async getCurrentUser(): Promise<ApiResponse> {
    return AuthApi.getCurrentUser()
  }

  /**
   * 刷新令牌
   * @returns 新的令牌信息
   */
  static async refreshToken(): Promise<ApiResponse> {
    return AuthApi.refreshToken()
  }

  /**
   * 修改密码
   * @param oldPassword 旧密码
   * @param newPassword 新密码
   * @returns 修改结果
   */
  static async changePassword(oldPassword: string, newPassword: string): Promise<ApiResponse> {
    return AuthApi.changePassword(oldPassword, newPassword)
  }

  /**
   * 检查是否已认证
   * @returns 认证状态
   */
  static isAuthenticated(): boolean {
    return AuthApi.isAuthenticated()
  }

  /**
   * 获取认证令牌
   * @returns 认证令牌
   */
  static getAuthToken(): string | null {
    return AuthApi.getAuthToken()
  }

  // ============= 业务统计相关API =============

  /**
   * 获取销售统计
   * @param params 查询参数
   * @returns 统计数据
   */
  static async getSalesStats(params?: {
    startDate?: string
    endDate?: string
    userId?: string
  }): Promise<
    ApiResponse<{
      totalQuotes: number
      totalAmount: number
      approvedQuotes: number
      pendingQuotes: number
      rejectedQuotes: number
    }>
  > {
    try {
      const { data: quotes, error } = await QuotesApi.getQuotes({
        ...params,
        startDate: params?.startDate,
        endDate: params?.endDate
      })

      if (!quotes.success || error) {
        return {
          success: false,
          error: {
            code: 'FETCH_ERROR',
            message: '获取统计数据失败'
          }
        }
      }

      const quoteList = quotes.data as Quote[]

      const stats = {
        totalQuotes: quoteList.length,
        totalAmount: quoteList.reduce((sum, quote) => sum + (quote.total_price || 0), 0),
        approvedQuotes: quoteList.filter(q => q.status === 'approved').length,
        pendingQuotes: quoteList.filter(q => q.status === 'pending').length,
        rejectedQuotes: quoteList.filter(q => q.status === 'rejected').length
      }

      return {
        success: true,
        data: stats
      }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'CALCULATION_ERROR',
          message: '计算统计数据失败'
        }
      }
    }
  }

  /**
   * 导出报价单
   * @param params 导出参数
   * @returns 导出结果
   */
  static async exportQuotes(params: {
    startDate: string
    endDate: string
    status?: string
  }): Promise<ApiResponse<Blob>> {
    return QuotesApi.exportQuotes(params)
  }

  // ============= 文件上传相关API =============

  /**
   * 上传文件
   * @param file 文件对象
   * @param bucket 存储桶名称
   * @param path 文件路径
   * @returns 上传结果
   */
  static async uploadFile(
    file: File | Blob,
    bucket: string = 'attachments',
    path?: string
  ): Promise<ApiResponse<{ url: string }>> {
    const fileName = path || `uploads/${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    return ApiClient.uploadFile(file, bucket, fileName)
  }

  // ============= 健康检查相关API =============

  /**
   * API健康检查
   * @returns 健康状态
   */
  static async healthCheck(): Promise<
    ApiResponse<{
      status: 'healthy' | 'unhealthy'
      timestamp: string
      services: {
        database: boolean
        auth: boolean
        storage: boolean
      }
    }>
  > {
    try {
      // 检查数据库连接
      const dbResult = await ProductsApi.getProducts({ limit: 1 })
      const dbHealthy = dbResult.success

      // 检查认证服务
      const authResult = await AuthApi.getCurrentUser()
      const authHealthy = authResult.success || authResult.error?.code !== 'SERVER_ERROR'

      // 存储服务检查（暂时标记为健康）
      const storageHealthy = true

      const allHealthy = dbHealthy && authHealthy && storageHealthy

      return {
        success: true,
        data: {
          status: allHealthy ? 'healthy' : 'unhealthy',
          timestamp: new Date().toISOString(),
          services: {
            database: dbHealthy,
            auth: authHealthy,
            storage: storageHealthy
          }
        }
      }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'HEALTH_CHECK_FAILED',
          message: '健康检查失败'
        }
      }
    }
  }
}

export default ApiService
