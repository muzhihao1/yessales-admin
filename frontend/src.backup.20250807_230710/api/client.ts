import { ERROR_CODES, HTTP_STATUS, apiConfig, supabase, validateApiConfig } from './config'
import type { ApiError, ApiResponse } from '@/types/api'

/**
 * 增强的 API 客户端
 * 提供重试机制、请求拦截器、响应处理器等高级功能
 */
export class ApiClient {
  private static requestInterceptors: Array<(request: any) => Promise<any> | any> = []
  private static responseInterceptors: Array<(response: any) => Promise<any> | any> = []
  private static cache = new Map<string, { data: any; timestamp: number }>()
  private static readonly CACHE_TTL = 5 * 60 * 1000 // 5分钟缓存

  /**
   * 初始化 API 客户端
   */
  static init(): boolean {
    if (!validateApiConfig()) {
      throw new Error('API 配置验证失败，请检查环境变量')
    }

    // 设置默认请求拦截器
    this.addRequestInterceptor(request => {
      console.log(`🚀 [API Request] ${request.method} ${request.table}`, request.options)
      return request
    })

    // 设置默认响应拦截器
    this.addResponseInterceptor(response => {
      if (response.success) {
        console.log('✅ [API Response] Success', response.data)
      } else {
        console.error('❌ [API Response] Error', response.error)
      }
      return response
    })

    return true
  }

  /**
   * 添加请求拦截器
   */
  static addRequestInterceptor(interceptor: (request: any) => Promise<any> | any): void {
    this.requestInterceptors.push(interceptor)
  }

  /**
   * 添加响应拦截器
   */
  static addResponseInterceptor(interceptor: (response: any) => Promise<any> | any): void {
    this.responseInterceptors.push(interceptor)
  }

  /**
   * 执行请求拦截器
   */
  private static async executeRequestInterceptors(request: any): Promise<any> {
    let result = request
    for (const interceptor of this.requestInterceptors) {
      result = await interceptor(result)
    }
    return result
  }

  /**
   * 执行响应拦截器
   */
  private static async executeResponseInterceptors(response: any): Promise<any> {
    let result = response
    for (const interceptor of this.responseInterceptors) {
      result = await interceptor(result)
    }
    return result
  }

  /**
   * 获取缓存键
   */
  private static getCacheKey(method: string, table: string, options?: any): string {
    return `${method}_${table}_${JSON.stringify(options || {})}`
  }

  /**
   * 获取缓存数据
   */
  private static getCache(key: string): any | null {
    if (!apiConfig.enableCache) return null

    const cached = this.cache.get(key)
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      console.log('📦 [Cache Hit]', key)
      return cached.data
    }

    if (cached) {
      this.cache.delete(key)
    }
    return null
  }

  /**
   * 设置缓存数据
   */
  private static setCache(key: string, data: any): void {
    if (!apiConfig.enableCache) return

    this.cache.set(key, {
      data,
      timestamp: Date.now()
    })
  }

  /**
   * 清理过期缓存
   */
  static clearExpiredCache(): void {
    const now = Date.now()
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp >= this.CACHE_TTL) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * 延迟函数
   */
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * 增强的错误处理
   */
  static async handleError(error: any, attempt: number = 1): Promise<ApiResponse> {
    console.error(`API Error (Attempt ${attempt}):`, error)

    let apiError: ApiError = {
      code: ERROR_CODES.SERVER_ERROR,
      message: '服务器错误，请稍后重试',
      details: error
    }

    if (error.status === HTTP_STATUS.UNAUTHORIZED) {
      apiError = {
        code: ERROR_CODES.UNAUTHORIZED,
        message: '未授权，请重新登录'
      }
    } else if (error.status === HTTP_STATUS.FORBIDDEN) {
      apiError = {
        code: ERROR_CODES.FORBIDDEN,
        message: '无权限访问该资源'
      }
    } else if (error.status === HTTP_STATUS.NOT_FOUND) {
      apiError = {
        code: ERROR_CODES.NOT_FOUND,
        message: '请求的资源不存在'
      }
    } else if (error.status === HTTP_STATUS.BAD_REQUEST) {
      apiError = {
        code: ERROR_CODES.INVALID_INPUT,
        message: error.message || '请求参数错误'
      }
    } else if (error.status === HTTP_STATUS.CONFLICT) {
      apiError = {
        code: ERROR_CODES.DUPLICATE_ENTRY,
        message: error.message || '数据已存在'
      }
    }

    return {
      success: false,
      error: apiError
    }
  }

  /**
   * 带重试机制的请求方法
   */
  static async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    table: string,
    options?: {
      id?: string
      data?: any
      query?: any
      select?: string
      enableCache?: boolean
    }
  ): Promise<ApiResponse<T>> {
    const requestPayload = { method, table, options }

    // 执行请求拦截器
    const interceptedRequest = await this.executeRequestInterceptors(requestPayload)

    // 对于 GET 请求检查缓存
    if (method === 'GET' && options?.enableCache !== false) {
      const cacheKey = this.getCacheKey(method, table, options)
      const cachedData = this.getCache(cacheKey)
      if (cachedData) {
        return this.executeResponseInterceptors(cachedData)
      }
    }

    // 带重试的请求执行
    return this.executeWithRetry(interceptedRequest)
  }

  /**
   * 执行带重试机制的请求
   */
  private static async executeWithRetry<T>(
    requestPayload: any,
    attempt: number = 1
  ): Promise<ApiResponse<T>> {
    try {
      const { method, table, options } = requestPayload
      const response = await this.executeRequest<T>(method, table, options)

      // 对于成功的 GET 请求设置缓存
      if (response.success && method === 'GET' && options?.enableCache !== false) {
        const cacheKey = this.getCacheKey(method, table, options)
        this.setCache(cacheKey, response)
      }

      return this.executeResponseInterceptors(response)
    } catch (error) {
      // 判断是否需要重试
      if (attempt < apiConfig.retryAttempts && this.shouldRetry(error)) {
        console.log(`🔄 [API Retry] Attempt ${attempt + 1}/${apiConfig.retryAttempts}`)
        await this.delay(apiConfig.retryDelay * attempt) // 指数退避
        return this.executeWithRetry<T>(requestPayload, attempt + 1)
      }

      const errorResponse = await this.handleError(error, attempt)
      return this.executeResponseInterceptors(errorResponse)
    }
  }

  /**
   * 判断错误是否应该重试
   */
  private static shouldRetry(error: any): boolean {
    // 网络错误或服务器错误需要重试
    if (!error.status) return true // 网络错误
    if (error.status >= 500) return true // 服务器错误
    if (error.status === 429) return true // 限流错误
    return false
  }

  /**
   * 实际执行请求
   */
  private static async executeRequest<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    table: string,
    options?: {
      id?: string
      data?: any
      query?: any
      select?: string
    }
  ): Promise<ApiResponse<T>> {
    const request = supabase.from(table)

    if (method === 'GET' && options?.id) {
      const { data, error } = await request
        .select(options.select || '*')
        .eq('id', options.id)
        .single()

      if (error) throw error

      return {
        success: true,
        data
      }
    }

    if (method === 'GET') {
      let query = request.select(options?.select || '*')

      // 构建查询条件
      if (options?.query) {
        Object.entries(options.query).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (key === 'limit') {
              query = query.limit(value)
            } else if (key === 'offset') {
              query = query.range(value, value + (options.query.limit || 20) - 1)
            } else if (key === 'order') {
              const [column, direction] = value.split(',')
              query = query.order(column, { ascending: direction === 'asc' })
            } else {
              query = query.eq(key, value)
            }
          }
        })
      }

      const { data, error, count } = await query

      if (error) throw error

      return {
        success: true,
        data,
        pagination: options?.query?.page
          ? {
              page: options.query.page,
              page_size: options.query.page_size || 20,
              total: count || 0
            }
          : undefined
      }
    }

    if (method === 'POST') {
      const { data, error } = await request.insert(options?.data).select().single()

      if (error) throw error

      return {
        success: true,
        data
      }
    }

    if (method === 'PUT' && options?.id) {
      const { data, error } = await request
        .update(options.data)
        .eq('id', options.id)
        .select()
        .single()

      if (error) throw error

      return {
        success: true,
        data
      }
    }

    if (method === 'DELETE' && options?.id) {
      const { error } = await request.delete().eq('id', options.id)

      if (error) throw error

      return {
        success: true
      }
    }

    throw new Error('Invalid request parameters')
  }

  static async uploadFile(
    file: File | Blob,
    bucket: string,
    path: string
  ): Promise<ApiResponse<{ url: string }>> {
    try {
      const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
        cacheControl: '3600',
        upsert: false
      })

      if (error) throw error

      const {
        data: { publicUrl }
      } = supabase.storage.from(bucket).getPublicUrl(data.path)

      return {
        success: true,
        data: { url: publicUrl }
      }
    } catch (error) {
      return this.handleError(error)
    }
  }
}

export default ApiClient
