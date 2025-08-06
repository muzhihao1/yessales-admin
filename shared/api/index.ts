// API 客户端和工具函数
export { supabase, handleError, getPaginationParams, API_CONFIG } from './client'

// API 服务模块
export { productsApi } from './products'
export { accessoriesApi } from './accessories'
export { quotesApi } from './quotes'
export { customersApi } from './customers'
export { authApi } from './auth'
export { uploadApi } from './upload'
export { loggingApi, LogActions, LogTargetTypes, logUtils } from './logging'

// 类型定义
export * from '../types/models'
export * from '../types/api'
export * from '../types/database'

// 统一的 API 对象，方便使用
export const API = {
  products: require('./products').productsApi,
  accessories: require('./accessories').accessoriesApi,
  quotes: require('./quotes').quotesApi,
  customers: require('./customers').customersApi,
  auth: require('./auth').authApi,
  upload: require('./upload').uploadApi
}

// Edge Functions 调用封装
export const EdgeFunctions = {
  /**
   * 生成报价单号
   */
  async generateQuoteNo() {
    const { data, error } = await supabase.functions.invoke('generate-quote-no')
    if (error) throw error
    return data
  },

  /**
   * 计算报价总价
   */
  async calculateQuoteTotal(items: Array<{ unit_price: number; quantity: number }>) {
    const { data, error } = await supabase.functions.invoke('calculate-quote-total', {
      body: { items }
    })
    if (error) throw error
    return data
  },

  /**
   * 导出报价单
   */
  async exportQuotes(params: { startDate?: string; endDate?: string; status?: string } = {}) {
    const { data, error } = await supabase.functions.invoke('export-quotes', {
      body: params
    })
    if (error) throw error
    return data
  }
}

// 辅助函数
export const Utils = {
  /**
   * 格式化价格
   */
  formatPrice(price: number): string {
    return `¥${price.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  },

  /**
   * 格式化日期
   */
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString('zh-CN')
  },

  /**
   * 格式化状态
   */
  formatStatus(status: string): string {
    const statusMap: Record<string, string> = {
      'pending': '待确认',
      'approved': '已确认',
      'rejected': '已拒绝',
      'completed': '已完成'
    }
    return statusMap[status] || status
  },

  /**
   * 验证手机号
   */
  validatePhone(phone: string): boolean {
    return /^\d{11}$/.test(phone)
  },

  /**
   * 生成唯一ID
   */
  generateId(): string {
    return crypto.randomUUID ? crypto.randomUUID() : 
           'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
             const r = Math.random() * 16 | 0
             const v = c === 'x' ? r : (r & 0x3 | 0x8)
             return v.toString(16)
           })
  }
}