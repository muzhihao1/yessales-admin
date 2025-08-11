import { ApiClient } from './index'

/**
 * 初始化API客户端
 * 在应用启动时调用，配置API客户端和拦截器
 */
export function initializeApi(): void {
  try {
    // 初始化API客户端
    ApiClient.init()

    // 设置全局请求拦截器
    ApiClient.addRequestInterceptor(request => {
      // 在请求中添加时间戳（用于避免缓存）
      if (request.method === 'GET') {
        request.options = request.options || {}
        request.options.query = request.options.query || {}
        request.options.query._t = Date.now()
      }

      return request
    })

    // 设置全局响应拦截器
    ApiClient.addResponseInterceptor(response => {
      // 统一处理认证失败
      if (!response.success && response.error?.code === 'UNAUTHORIZED') {
        // 清除本地存储的认证信息
        localStorage.removeItem('supabase.auth.token')

        // 显示登录过期消息
        console.warn('登录已过期，请重新登录')

        // 延迟跳转到登录页
        setTimeout(() => {
          window.location.href = '/admin/login'
        }, 1500)
      }

      return response
    })

    // 定期清理过期缓存
    setInterval(
      () => {
        ApiClient.clearExpiredCache()
      },
      5 * 60 * 1000
    ) // 每5分钟清理一次

    console.log('✅ API客户端初始化完成')
  } catch (error) {
    console.error('❌ API客户端初始化失败:', error)
    throw error
  }
}

/**
 * API健康检查
 * 检查API服务是否正常工作
 */
export async function checkApiHealth(): Promise<boolean> {
  try {
    const { ApiService } = await import('./service')
    const result = await ApiService.healthCheck()

    if (result.success && result.data?.status === 'healthy') {
      console.log('✅ API健康检查通过')
      return true
    } else {
      console.warn('⚠️ API健康检查失败:', result)
      return false
    }
  } catch (error) {
    console.error('❌ API健康检查异常:', error)
    return false
  }
}

export default {
  initializeApi,
  checkApiHealth
}
