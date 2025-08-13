/**
 * 域名智能路由系统
 * 根据域名和路径自动导向适当的应用入口
 */

interface DomainConfig {
  domain: string
  defaultRoute: string
  appType: 'sales' | 'admin' | 'main'
}

const DOMAIN_CONFIGS: DomainConfig[] = [
  {
    domain: 'admin.yessales.cn',
    defaultRoute: '/admin/dashboard',
    appType: 'admin'
  },
  {
    domain: 'app.yessales.cn',
    defaultRoute: '/sales',
    appType: 'sales'
  },
  {
    domain: 'yessales.cn',
    defaultRoute: '/sales', // 主域名默认到销售端
    appType: 'main'
  }
]

export class DomainRouter {
  private currentDomain: string
  private currentPath: string

  constructor() {
    this.currentDomain = window.location.hostname
    this.currentPath = window.location.pathname
  }

  /**
   * 获取当前域名的应用类型
   */
  getAppType(): 'sales' | 'admin' | 'main' {
    const config = this.getDomainConfig()
    return config?.appType || 'main'
  }

  /**
   * 检查是否需要重定向
   */
  shouldRedirect(): { redirect: boolean; targetPath?: string } {
    const config = this.getDomainConfig()

    if (!config) {
      return { redirect: false }
    }

    // 如果是管理端域名但访问的不是管理页面
    if (config.appType === 'admin' && !this.currentPath.startsWith('/admin')) {
      return {
        redirect: true,
        targetPath: config.defaultRoute
      }
    }

    // 如果是销售端域名但访问的不是销售页面
    if (config.appType === 'sales' && !this.currentPath.startsWith('/sales')) {
      return {
        redirect: true,
        targetPath: config.defaultRoute
      }
    }

    // 如果是根路径，重定向到默认页面
    if (this.currentPath === '/' || this.currentPath === '/index.html') {
      return {
        redirect: true,
        targetPath: config.defaultRoute
      }
    }

    return { redirect: false }
  }

  /**
   * 执行自动重定向
   */
  autoRedirect(): void {
    const { redirect, targetPath } = this.shouldRedirect()

    if (redirect && targetPath) {
      console.log(`[DomainRouter] Redirecting to: ${targetPath}`)

      // 使用vue-router进行导航
      if (window.history && window.history.pushState) {
        window.history.pushState({}, '', targetPath)
        window.location.reload()
      } else {
        window.location.href = targetPath
      }
    }
  }

  /**
   * 获取当前域名配置
   */
  private getDomainConfig(): DomainConfig | undefined {
    // 优先精确匹配
    let config = DOMAIN_CONFIGS.find(c => c.domain === this.currentDomain)

    // 如果没有精确匹配，尝试匹配localhost和vercel域名
    if (!config) {
      if (this.currentDomain.includes('localhost') || this.currentDomain.includes('127.0.0.1')) {
        // 本地开发环境，根据路径判断
        if (this.currentPath.startsWith('/admin') || this.currentPath.includes('admin')) {
          config = DOMAIN_CONFIGS.find(c => c.appType === 'admin')
        } else {
          config = DOMAIN_CONFIGS.find(c => c.appType === 'sales')
        }
      } else if (this.currentDomain.includes('vercel.app')) {
        // Vercel预览环境，默认为主应用
        config = DOMAIN_CONFIGS.find(c => c.appType === 'main')
      }
    }

    return config
  }

  /**
   * 获取应用标题
   */
  getAppTitle(): string {
    const appType = this.getAppType()

    switch (appType) {
      case 'admin':
        return '耶氏台球 - 管理后台'
      case 'sales':
        return '耶氏台球 - 报价系统'
      default:
        return '耶氏台球报价系统'
    }
  }

  /**
   * 检查当前用户是否应该访问管理端
   */
  isAdminAccess(): boolean {
    return this.getAppType() === 'admin'
  }

  /**
   * 检查当前用户是否应该访问销售端
   */
  isSalesAccess(): boolean {
    return this.getAppType() === 'sales'
  }
}

// 导出单例
export const domainRouter = new DomainRouter()

// 开发调试功能
if (process.env.NODE_ENV === 'development') {
  ;(window as any).__domainRouter = domainRouter
  console.log('[DomainRouter] Debug mode enabled, access via window.__domainRouter')
}
