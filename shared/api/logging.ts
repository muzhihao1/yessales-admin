import { supabase, handleError, getPaginationParams } from './client'
import type { OperationLog } from '../types/models'
import type { ApiResponse, PaginationParams } from '../types/api'

export const loggingApi = {
  /**
   * 记录操作日志
   */
  async logOperation(logData: {
    action: string
    target_type: string
    target_id?: string
    detail?: any
    user_id?: string
  }): Promise<ApiResponse<OperationLog>> {
    try {
      // 获取客户端信息
      const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : undefined
      
      const { data, error } = await supabase
        .from('operation_logs')
        .insert({
          ...logData,
          user_agent: userAgent,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      return {
        success: true,
        data: data as OperationLog
      }
    } catch (error) {
      return handleError(error)
    }
  },

  /**
   * 获取操作日志列表
   */
  async getOperationLogs(params: PaginationParams & {
    user_id?: string
    action?: string
    target_type?: string
    start_date?: string
    end_date?: string
  } = {}): Promise<ApiResponse<OperationLog[]>> {
    try {
      const { 
        page = 1, 
        page_size = 20, 
        user_id, 
        action, 
        target_type, 
        start_date, 
        end_date,
        sort_by = 'created_at',
        sort_order = 'desc'
      } = params
      const { from, to } = getPaginationParams(page, page_size)

      let query = supabase
        .from('operation_logs')
        .select(`
          *,
          user:users(id, name, username)
        `, { count: 'exact' })
        .range(from, to)
        .order(sort_by, { ascending: sort_order === 'asc' })

      // 应用过滤条件
      if (user_id) {
        query = query.eq('user_id', user_id)
      }
      if (action) {
        query = query.eq('action', action)
      }
      if (target_type) {
        query = query.eq('target_type', target_type)
      }
      if (start_date) {
        query = query.gte('created_at', start_date)
      }
      if (end_date) {
        query = query.lte('created_at', end_date)
      }

      const { data, error, count } = await query

      if (error) throw error

      return {
        success: true,
        data: data as OperationLog[],
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
   * 获取操作统计
   */
  async getOperationStats(): Promise<ApiResponse<any>> {
    try {
      // 获取今日操作统计
      const today = new Date().toISOString().split('T')[0]
      
      const [todayLogs, actionStats, userStats] = await Promise.all([
        // 今日操作数量
        supabase
          .from('operation_logs')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', today),
        
        // 操作类型统计
        supabase
          .from('operation_logs')
          .select('action')
          .gte('created_at', today)
          .then(({ data }) => {
            const stats: Record<string, number> = {}
            data?.forEach(log => {
              stats[log.action] = (stats[log.action] || 0) + 1
            })
            return stats
          }),
        
        // 用户操作统计
        supabase
          .from('operation_logs')
          .select('user_id, user:users(name)')
          .gte('created_at', today)
          .then(({ data }) => {
            const stats: Record<string, number> = {}
            data?.forEach(log => {
              const userName = log.user?.name || '系统'
              stats[userName] = (stats[userName] || 0) + 1
            })
            return stats
          })
      ])

      return {
        success: true,
        data: {
          todayCount: todayLogs.count || 0,
          actionStats,
          userStats
        }
      }
    } catch (error) {
      return handleError(error)
    }
  }
}

// 预定义的操作类型
export const LogActions = {
  // 产品相关
  CREATE_PRODUCT: 'CREATE_PRODUCT',
  UPDATE_PRODUCT: 'UPDATE_PRODUCT',
  DELETE_PRODUCT: 'DELETE_PRODUCT',
  
  // 配件相关
  CREATE_ACCESSORY: 'CREATE_ACCESSORY',
  UPDATE_ACCESSORY: 'UPDATE_ACCESSORY',
  DELETE_ACCESSORY: 'DELETE_ACCESSORY',
  
  // 报价单相关
  CREATE_QUOTE: 'CREATE_QUOTE',
  UPDATE_QUOTE: 'UPDATE_QUOTE',
  DELETE_QUOTE: 'DELETE_QUOTE',
  APPROVE_QUOTE: 'APPROVE_QUOTE',
  REJECT_QUOTE: 'REJECT_QUOTE',
  
  // 客户相关
  CREATE_CUSTOMER: 'CREATE_CUSTOMER',
  UPDATE_CUSTOMER: 'UPDATE_CUSTOMER',
  DELETE_CUSTOMER: 'DELETE_CUSTOMER',
  
  // 用户相关
  CREATE_USER: 'CREATE_USER',
  UPDATE_USER: 'UPDATE_USER',
  DISABLE_USER: 'DISABLE_USER',
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  
  // 文件相关
  UPLOAD_IMAGE: 'UPLOAD_IMAGE',
  DELETE_IMAGE: 'DELETE_IMAGE',
  
  // 导出相关
  EXPORT_QUOTES: 'EXPORT_QUOTES',
  EXPORT_CUSTOMERS: 'EXPORT_CUSTOMERS'
}

// 目标类型
export const LogTargetTypes = {
  PRODUCT: 'product',
  ACCESSORY: 'accessory',
  QUOTE: 'quote',
  CUSTOMER: 'customer',
  USER: 'user',
  FILE: 'file',
  SYSTEM: 'system'
}

// 日志工具函数
export const logUtils = {
  /**
   * 记录产品操作
   */
  async logProductOperation(action: string, productId: string, detail?: any, userId?: string) {
    return loggingApi.logOperation({
      action,
      target_type: LogTargetTypes.PRODUCT,
      target_id: productId,
      detail,
      user_id: userId
    })
  },

  /**
   * 记录报价单操作
   */
  async logQuoteOperation(action: string, quoteId: string, detail?: any, userId?: string) {
    return loggingApi.logOperation({
      action,
      target_type: LogTargetTypes.QUOTE,
      target_id: quoteId,
      detail,
      user_id: userId
    })
  },

  /**
   * 记录客户操作
   */
  async logCustomerOperation(action: string, customerId: string, detail?: any, userId?: string) {
    return loggingApi.logOperation({
      action,
      target_type: LogTargetTypes.CUSTOMER,
      target_id: customerId,
      detail,
      user_id: userId
    })
  },

  /**
   * 记录用户操作
   */
  async logUserOperation(action: string, targetUserId?: string, detail?: any, userId?: string) {
    return loggingApi.logOperation({
      action,
      target_type: LogTargetTypes.USER,
      target_id: targetUserId,
      detail,
      user_id: userId
    })
  },

  /**
   * 记录系统操作
   */
  async logSystemOperation(action: string, detail?: any, userId?: string) {
    return loggingApi.logOperation({
      action,
      target_type: LogTargetTypes.SYSTEM,
      detail,
      user_id: userId
    })
  }
}