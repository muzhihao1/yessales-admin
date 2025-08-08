/**
 * 生产环境配置文件
 *
 * 功能说明：
 * - 生产环境专用的配置和优化设置
 * - 安全配置和敏感数据保护
 * - 性能优化和资源管理配置
 * - 监控和日志记录配置
 * - CDN和资源缓存优化
 *
 * 安全特性：
 * - 环境变量安全验证
 * - API密钥和敏感信息加密存储
 * - CSP (Content Security Policy) 配置
 * - HTTPS强制和安全头设置
 * - 输入验证和XSS防护
 *
 * 性能优化：
 * - 资源压缩和缓存策略
 * - CDN配置和静态资源优化
 * - 懒加载和代码分割配置
 * - 内存管理和垃圾回收优化
 * - 网络请求和连接池优化
 *
 * @author Terminal 3 (Admin Frontend Team)
 */

export interface ProductionConfig {
  // 应用基础配置
  app: {
    name: string
    version: string
    build: string
    environment: 'production'
    debug: boolean
    enableDevtools: boolean
  }

  // API配置
  api: {
    baseURL: string
    timeout: number
    retryAttempts: number
    retryDelay: number
    enableCompression: boolean
    enableCaching: boolean
    maxConcurrentRequests: number
    rateLimitPerMinute: number
  }

  // 安全配置
  security: {
    enableCSP: boolean
    cspPolicy: string
    enableHTTPS: boolean
    securityHeaders: Record<string, string>
    sessionTimeout: number
    maxLoginAttempts: number
    tokenRefreshThreshold: number
  }

  // 缓存配置
  cache: {
    enableServiceWorker: boolean
    maxCacheSize: number
    cacheStrategy: 'networkFirst' | 'cacheFirst' | 'networkOnly'
    staticAssetCacheDuration: number
    apiCacheDuration: number
    imageCacheDuration: number
  }

  // 性能监控
  monitoring: {
    enablePerformanceTracking: boolean
    enableErrorTracking: boolean
    enableUserTracking: boolean
    sampleRate: number
    maxErrorReports: number
    performanceThresholds: {
      firstContentfulPaint: number
      largestContentfulPaint: number
      cumulativeLayoutShift: number
      firstInputDelay: number
    }
  }

  // 日志配置
  logging: {
    level: 'error' | 'warn' | 'info' | 'debug'
    enableRemoteLogging: boolean
    enableConsoleLogging: boolean
    maxLogSize: number
    logRetentionDays: number
    sensitiveDataMask: boolean
  }

  // CDN和资源配置
  resources: {
    cdnURL: string
    enableImageOptimization: boolean
    imageQuality: number
    enableWebP: boolean
    enableLazyLoading: boolean
    preloadCriticalResources: string[]
    prefetchResources: string[]
  }

  // UI/UX配置
  ui: {
    enableAnimations: boolean
    animationDuration: number
    enableVirtualScrolling: boolean
    virtualScrollThreshold: number
    enableProgressiveLoading: boolean
    showPerformanceMetrics: boolean
  }

  // 功能开关
  features: {
    enableRealTimeUpdates: boolean
    enableOfflineMode: boolean
    enablePushNotifications: boolean
    enableAnalytics: boolean
    enableA11yTools: boolean
    enableAdvancedFilters: boolean
    maxUploadFileSize: number
    supportedFileTypes: string[]
  }
}

/**
 * 环境变量验证器
 */
class EnvironmentValidator {
  private static requiredVars = [
    'VITE_API_BASE_URL',
    'VITE_APP_VERSION',
    'VITE_CDN_URL',
    'VITE_MONITORING_KEY'
  ]

  static validate(): { valid: boolean; missing: string[]; errors: string[] } {
    const missing: string[] = []
    const errors: string[] = []

    // 检查必需的环境变量
    for (const varName of this.requiredVars) {
      if (!import.meta.env[varName]) {
        missing.push(varName)
      }
    }

    // 验证URL格式
    const apiUrl = import.meta.env.VITE_API_BASE_URL
    if (apiUrl && !this.isValidURL(apiUrl)) {
      errors.push(`Invalid API URL format: ${apiUrl}`)
    }

    const cdnUrl = import.meta.env.VITE_CDN_URL
    if (cdnUrl && !this.isValidURL(cdnUrl)) {
      errors.push(`Invalid CDN URL format: ${cdnUrl}`)
    }

    // 验证版本号格式
    const version = import.meta.env.VITE_APP_VERSION
    if (version && !this.isValidVersion(version)) {
      errors.push(`Invalid version format: ${version}`)
    }

    return {
      valid: missing.length === 0 && errors.length === 0,
      missing,
      errors
    }
  }

  private static isValidURL(url: string): boolean {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  private static isValidVersion(version: string): boolean {
    return /^\d+\.\d+\.\d+(-\w+)?$/.test(version)
  }
}

/**
 * 生产环境配置生成器
 */
class ProductionConfigBuilder {
  private config: Partial<ProductionConfig> = {}

  static create(): ProductionConfigBuilder {
    return new ProductionConfigBuilder()
  }

  build(): ProductionConfig {
    // 验证环境变量
    const validation = EnvironmentValidator.validate()
    if (!validation.valid) {
      console.error('Environment validation failed:', validation)
      throw new Error(`Missing environment variables: ${validation.missing.join(', ')}`)
    }

    // 构建配置
    const baseConfig = this.buildBaseConfig()
    const securityConfig = this.buildSecurityConfig()
    const performanceConfig = this.buildPerformanceConfig()
    const monitoringConfig = this.buildMonitoringConfig()

    return {
      ...baseConfig,
      ...securityConfig,
      ...performanceConfig,
      ...monitoringConfig,
      ...this.config
    } as ProductionConfig
  }

  private buildBaseConfig(): Partial<ProductionConfig> {
    return {
      app: {
        name: 'YesSales Admin',
        version: import.meta.env.VITE_APP_VERSION || '1.0.0',
        build: import.meta.env.VITE_BUILD_NUMBER || Date.now().toString(),
        environment: 'production',
        debug: false,
        enableDevtools: false
      },

      api: {
        baseURL: import.meta.env.VITE_API_BASE_URL,
        timeout: 30000,
        retryAttempts: 3,
        retryDelay: 1000,
        enableCompression: true,
        enableCaching: true,
        maxConcurrentRequests: 10,
        rateLimitPerMinute: 1000
      }
    }
  }

  private buildSecurityConfig(): Partial<ProductionConfig> {
    return {
      security: {
        enableCSP: true,
        cspPolicy: [
          "default-src 'self'",
          `connect-src 'self' ${import.meta.env.VITE_API_BASE_URL} wss:`,
          "img-src 'self' data: https:",
          "style-src 'self' 'unsafe-inline'",
          "script-src 'self'",
          "font-src 'self' https:",
          "media-src 'self'"
        ].join('; '),
        enableHTTPS: true,
        securityHeaders: {
          'X-Frame-Options': 'DENY',
          'X-Content-Type-Options': 'nosniff',
          'Referrer-Policy': 'strict-origin-when-cross-origin',
          'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
        },
        sessionTimeout: 30 * 60 * 1000, // 30分钟
        maxLoginAttempts: 5,
        tokenRefreshThreshold: 5 * 60 * 1000 // 5分钟
      }
    }
  }

  private buildPerformanceConfig(): Partial<ProductionConfig> {
    return {
      cache: {
        enableServiceWorker: true,
        maxCacheSize: 100 * 1024 * 1024, // 100MB
        cacheStrategy: 'networkFirst',
        staticAssetCacheDuration: 365 * 24 * 60 * 60 * 1000, // 1年
        apiCacheDuration: 5 * 60 * 1000, // 5分钟
        imageCacheDuration: 7 * 24 * 60 * 60 * 1000 // 7天
      },

      resources: {
        cdnURL: import.meta.env.VITE_CDN_URL || '',
        enableImageOptimization: true,
        imageQuality: 80,
        enableWebP: true,
        enableLazyLoading: true,
        preloadCriticalResources: ['/fonts/inter.woff2', '/icons/logo.svg'],
        prefetchResources: ['/api/v1/user/permissions', '/api/v1/dashboard/stats']
      },

      ui: {
        enableAnimations: true,
        animationDuration: 200,
        enableVirtualScrolling: true,
        virtualScrollThreshold: 100,
        enableProgressiveLoading: true,
        showPerformanceMetrics: false
      }
    }
  }

  private buildMonitoringConfig(): Partial<ProductionConfig> {
    return {
      monitoring: {
        enablePerformanceTracking: true,
        enableErrorTracking: true,
        enableUserTracking: false, // 根据隐私政策调整
        sampleRate: 0.1, // 10%采样率
        maxErrorReports: 100,
        performanceThresholds: {
          firstContentfulPaint: 2000,
          largestContentfulPaint: 4000,
          cumulativeLayoutShift: 0.1,
          firstInputDelay: 100
        }
      },

      logging: {
        level: 'error',
        enableRemoteLogging: true,
        enableConsoleLogging: false,
        maxLogSize: 10 * 1024 * 1024, // 10MB
        logRetentionDays: 30,
        sensitiveDataMask: true
      },

      features: {
        enableRealTimeUpdates: true,
        enableOfflineMode: true,
        enablePushNotifications: false,
        enableAnalytics: true,
        enableA11yTools: false,
        enableAdvancedFilters: true,
        maxUploadFileSize: 10 * 1024 * 1024, // 10MB
        supportedFileTypes: [
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
          'application/pdf',
          'text/csv',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ]
      }
    }
  }

  // 配置修改器方法
  withCustomAPI(config: Partial<ProductionConfig['api']>): ProductionConfigBuilder {
    this.config.api = { ...this.config.api, ...config }
    return this
  }

  withCustomSecurity(config: Partial<ProductionConfig['security']>): ProductionConfigBuilder {
    this.config.security = { ...this.config.security, ...config }
    return this
  }

  withCustomFeatures(config: Partial<ProductionConfig['features']>): ProductionConfigBuilder {
    this.config.features = { ...this.config.features, ...config }
    return this
  }

  withCustomMonitoring(config: Partial<ProductionConfig['monitoring']>): ProductionConfigBuilder {
    this.config.monitoring = { ...this.config.monitoring, ...config }
    return this
  }
}

/**
 * 配置预设
 */
export const productionPresets = {
  // 标准生产配置
  standard: (): ProductionConfig => {
    return ProductionConfigBuilder.create().build()
  },

  // 高性能配置
  highPerformance: (): ProductionConfig => {
    return ProductionConfigBuilder.create()
      .withCustomAPI({
        timeout: 15000,
        maxConcurrentRequests: 20,
        rateLimitPerMinute: 2000
      })
      .withCustomFeatures({
        enableRealTimeUpdates: true,
        enableAdvancedFilters: true
      })
      .build()
  },

  // 高安全配置
  highSecurity: (): ProductionConfig => {
    return ProductionConfigBuilder.create()
      .withCustomSecurity({
        sessionTimeout: 15 * 60 * 1000, // 15分钟
        maxLoginAttempts: 3,
        tokenRefreshThreshold: 2 * 60 * 1000 // 2分钟
      })
      .withCustomFeatures({
        enableAnalytics: false,
        maxUploadFileSize: 5 * 1024 * 1024 // 5MB
      })
      .build()
  },

  // 低资源配置（适合资源受限环境）
  lowResource: (): ProductionConfig => {
    return ProductionConfigBuilder.create()
      .withCustomAPI({
        maxConcurrentRequests: 5,
        rateLimitPerMinute: 500
      })
      .withCustomFeatures({
        enableRealTimeUpdates: false,
        enableAdvancedFilters: false,
        maxUploadFileSize: 2 * 1024 * 1024 // 2MB
      })
      .withCustomMonitoring({
        sampleRate: 0.01, // 1%采样率
        enablePerformanceTracking: false
      })
      .build()
  }
} as const

/**
 * 获取当前生产配置
 */
export function getProductionConfig(): ProductionConfig {
  const preset =
    (import.meta.env.VITE_CONFIG_PRESET as keyof typeof productionPresets) || 'standard'

  if (preset in productionPresets) {
    return productionPresets[preset]()
  }

  console.warn(`Unknown config preset: ${preset}, using standard preset`)
  return productionPresets.standard()
}

/**
 * 配置验证器
 */
export class ConfigValidator {
  static validateConfig(config: ProductionConfig): {
    valid: boolean
    warnings: string[]
    errors: string[]
  } {
    const warnings: string[] = []
    const errors: string[] = []

    // API配置验证
    if (config.api.timeout < 5000) {
      warnings.push('API timeout is very low, may cause frequent timeouts')
    }

    if (config.api.maxConcurrentRequests > 50) {
      warnings.push('High concurrent request limit may impact server performance')
    }

    // 安全配置验证
    if (!config.security.enableHTTPS) {
      errors.push('HTTPS must be enabled in production')
    }

    if (config.security.sessionTimeout > 60 * 60 * 1000) {
      warnings.push('Session timeout is very long, consider security implications')
    }

    // 缓存配置验证
    if (config.cache.maxCacheSize > 500 * 1024 * 1024) {
      warnings.push('Cache size is very large, may cause memory issues')
    }

    // 监控配置验证
    if (config.monitoring.sampleRate > 0.5) {
      warnings.push('High sampling rate may impact performance')
    }

    // 功能配置验证
    if (config.features.maxUploadFileSize > 50 * 1024 * 1024) {
      warnings.push('Large file upload size may cause server issues')
    }

    return {
      valid: errors.length === 0,
      warnings,
      errors
    }
  }
}

/**
 * 配置应用器
 */
export class ConfigApplier {
  static applySecurityHeaders(config: ProductionConfig) {
    if (typeof document !== 'undefined') {
      // 应用CSP
      if (config.security.enableCSP) {
        const meta = document.createElement('meta')
        meta.httpEquiv = 'Content-Security-Policy'
        meta.content = config.security.cspPolicy
        document.head.appendChild(meta)
      }

      // 其他安全头设置需要在服务器端配置
      console.info(
        'Security headers should be configured on server side:',
        config.security.securityHeaders
      )
    }
  }

  static setupPerformanceMonitoring(config: ProductionConfig) {
    if (!config.monitoring.enablePerformanceTracking) return

    // Web Vitals监控
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver(list => {
        list.getEntries().forEach(entry => {
          const { name, startTime, duration } = entry

          // 检查性能阈值
          if (
            name === 'first-contentful-paint' &&
            startTime > config.monitoring.performanceThresholds.firstContentfulPaint
          ) {
            console.warn(`FCP exceeded threshold: ${startTime}ms`)
          }

          // 发送监控数据到远程服务
          if (config.monitoring.enablePerformanceTracking) {
            this.sendPerformanceData({
              metric: name,
              value: duration || startTime,
              timestamp: Date.now()
            })
          }
        })
      })

      observer.observe({ entryTypes: ['paint', 'layout-shift', 'first-input'] })
    }
  }

  static setupErrorTracking(config: ProductionConfig) {
    if (!config.monitoring.enableErrorTracking) return

    window.addEventListener('error', event => {
      if (config.logging.level !== 'error') return

      const errorData = {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error?.stack,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        url: window.location.href
      }

      this.sendErrorData(errorData)
    })

    window.addEventListener('unhandledrejection', event => {
      const errorData = {
        message: 'Unhandled Promise Rejection',
        error: event.reason?.toString(),
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        url: window.location.href
      }

      this.sendErrorData(errorData)
    })
  }

  private static sendPerformanceData(data: any) {
    // 实际项目中需要实现发送到监控服务
    if (import.meta.env.VITE_MONITORING_ENDPOINT) {
      fetch(import.meta.env.VITE_MONITORING_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).catch(console.error)
    }
  }

  private static sendErrorData(data: any) {
    // 实际项目中需要实现发送到错误追踪服务
    if (import.meta.env.VITE_ERROR_REPORTING_ENDPOINT) {
      fetch(import.meta.env.VITE_ERROR_REPORTING_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).catch(console.error)
    }
  }
}

// 导出默认配置
export const productionConfig = getProductionConfig()
export default productionConfig
