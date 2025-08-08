/**
 * Bundle Optimization Utilities
 *
 * Provides code splitting, lazy loading, and bundle analysis utilities
 * for optimal application performance and loading times.
 */

import { type AsyncComponentLoader, type Component, defineAsyncComponent } from 'vue'

/**
 * Bundle optimization configuration
 */
export interface BundleOptimizationConfig {
  enableCodeSplitting: boolean
  enablePreloading: boolean
  enablePrefetching: boolean
  chunkRetryLimit: number
  chunkRetryDelay: number
  enableBundleAnalysis: boolean
  lazyLoadingDelay: number
}

/**
 * Chunk loading state
 */
export interface ChunkLoadingState {
  loading: boolean
  loaded: boolean
  error: boolean
  retryCount: number
}

/**
 * Bundle analysis data
 */
export interface BundleAnalysis {
  totalSize: number
  initialSize: number
  asyncChunks: Array<{
    name: string
    size: number
    modules: string[]
  }>
  dependencies: Record<string, string[]>
  duplicates: Array<{
    module: string
    locations: string[]
    size: number
  }>
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: BundleOptimizationConfig = {
  enableCodeSplitting: true,
  enablePreloading: true,
  enablePrefetching: false,
  chunkRetryLimit: 3,
  chunkRetryDelay: 1000,
  enableBundleAnalysis: process.env.NODE_ENV === 'development',
  lazyLoadingDelay: 0
}

/**
 * Global state
 */
const config = { ...DEFAULT_CONFIG }
const chunkStates = new Map<string, ChunkLoadingState>()
const loadedChunks = new Set<string>()

/**
 * Create async component with error handling and retry logic
 */
export function createAsyncComponent<T extends Component>(
  loader: AsyncComponentLoader<T>,
  options: {
    name?: string
    delay?: number
    timeout?: number
    loadingComponent?: Component
    errorComponent?: Component
    retryLimit?: number
    enablePreload?: boolean
    enablePrefetch?: boolean
  } = {}
): T {
  const componentName = options.name || 'AsyncComponent'

  // Create loading state
  const state: ChunkLoadingState = {
    loading: false,
    loaded: false,
    error: false,
    retryCount: 0
  }
  chunkStates.set(componentName, state)

  // Enhanced loader with retry logic
  const enhancedLoader = async (): Promise<T> => {
    state.loading = true
    state.error = false

    const maxRetries = options.retryLimit || config.chunkRetryLimit

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          // Delay before retry
          await new Promise(resolve => setTimeout(resolve, config.chunkRetryDelay * attempt))
          console.log(`🔄 Retrying to load ${componentName} (attempt ${attempt + 1})`)
        }

        const component = await loader()

        state.loaded = true
        state.loading = false
        loadedChunks.add(componentName)

        console.log(`✅ Successfully loaded ${componentName}`)
        return component
      } catch (error) {
        state.retryCount++
        console.warn(`❌ Failed to load ${componentName} (attempt ${attempt + 1}):`, error)

        if (attempt === maxRetries) {
          state.error = true
          state.loading = false
          throw error
        }
      }
    }

    throw new Error(`Failed to load ${componentName} after ${maxRetries} attempts`)
  }

  // Create async component with enhanced options
  return defineAsyncComponent({
    loader: enhancedLoader,
    delay: options.delay || config.lazyLoadingDelay,
    timeout: options.timeout || 10000,
    loadingComponent: options.loadingComponent || createLoadingComponent(componentName),
    errorComponent: options.errorComponent || createErrorComponent(componentName),
    onError: (error, retry, fail, attempts) => {
      console.error(`Component loading error for ${componentName}:`, error)

      if (attempts <= (options.retryLimit || config.chunkRetryLimit)) {
        console.log(`Retrying ${componentName} loading...`)
        retry()
      } else {
        console.error(`Giving up on ${componentName} after ${attempts} attempts`)
        fail()
      }
    }
  }) as T
}

/**
 * Default loading component
 */
function createLoadingComponent(componentName: string): Component {
  return {
    name: `${componentName}Loading`,
    template: `
      <view class="async-component-loading">
        <view class="loading-spinner"></view>
        <text class="loading-text">加载中...</text>
      </view>
    `,
    styles: [
      `
      .async-component-loading {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 40rpx;
      }
      
      .loading-spinner {
        width: 60rpx;
        height: 60rpx;
        border: 4rpx solid #e5e7eb;
        border-top: 4rpx solid #3b82f6;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-bottom: 20rpx;
      }
      
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      .loading-text {
        color: #6b7280;
        font-size: 26rpx;
      }
    `
    ]
  }
}

/**
 * Default error component
 */
function createErrorComponent(componentName: string): Component {
  return {
    name: `${componentName}Error`,
    template: `
      <view class="async-component-error">
        <view class="error-icon">⚠️</view>
        <text class="error-title">加载失败</text>
        <text class="error-message">组件 ${componentName} 加载失败</text>
        <button class="error-retry" @click="handleRetry">重试</button>
      </view>
    `,
    methods: {
      handleRetry() {
        window.location.reload()
      }
    },
    styles: [
      `
      .async-component-error {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 40rpx;
        text-align: center;
      }
      
      .error-icon {
        font-size: 80rpx;
        margin-bottom: 20rpx;
      }
      
      .error-title {
        font-size: 32rpx;
        font-weight: 600;
        color: #dc2626;
        margin-bottom: 10rpx;
      }
      
      .error-message {
        font-size: 26rpx;
        color: #6b7280;
        margin-bottom: 30rpx;
      }
      
      .error-retry {
        background: #3b82f6;
        color: white;
        border: none;
        border-radius: 8rpx;
        padding: 16rpx 32rpx;
        font-size: 26rpx;
      }
    `
    ]
  }
}

/**
 * Preload chunks for better performance
 */
export function preloadChunks(chunkNames: string[]): Promise<void[]> {
  const preloadPromises = chunkNames.map(async chunkName => {
    if (loadedChunks.has(chunkName)) {
      return // Already loaded
    }

    try {
      // For Vite/Webpack, we can use dynamic imports to preload
      const chunkPath = `/src/pages/${chunkName}.vue` // Adjust path as needed
      await import(/* webpackPreload: true */ chunkPath)

      loadedChunks.add(chunkName)
      console.log(`📦 Preloaded chunk: ${chunkName}`)
    } catch (error) {
      console.warn(`Failed to preload chunk ${chunkName}:`, error)
    }
  })

  return Promise.all(preloadPromises)
}

/**
 * Prefetch chunks for future use
 */
export function prefetchChunks(chunkNames: string[]): void {
  if (!config.enablePrefetching) return

  chunkNames.forEach(chunkName => {
    if (loadedChunks.has(chunkName)) return

    try {
      // Use link rel="prefetch" for better resource hints
      const link = document.createElement('link')
      link.rel = 'prefetch'
      link.href = `/src/pages/${chunkName}.vue` // Adjust path as needed
      document.head.appendChild(link)

      console.log(`🔮 Prefetching chunk: ${chunkName}`)
    } catch (error) {
      console.warn(`Failed to prefetch chunk ${chunkName}:`, error)
    }
  })
}

/**
 * Route-based code splitting utility
 */
export function createRouteComponent(routeName: string, importFn: () => Promise<any>): Component {
  return createAsyncComponent(importFn, {
    name: routeName,
    enablePreload: true,
    enablePrefetch: config.enablePrefetching
  })
}

/**
 * Feature-based code splitting utility
 */
export function createFeatureComponent(
  featureName: string,
  importFn: () => Promise<any>,
  options: {
    criticalFeature?: boolean
    preloadCondition?: () => boolean
  } = {}
): Component {
  const shouldPreload =
    options.criticalFeature || (options.preloadCondition && options.preloadCondition())

  return createAsyncComponent(importFn, {
    name: featureName,
    enablePreload: shouldPreload,
    delay: options.criticalFeature ? 0 : config.lazyLoadingDelay
  })
}

/**
 * Analyze bundle composition (development only)
 */
export function analyzeBundleComposition(): BundleAnalysis | null {
  if (!config.enableBundleAnalysis || process.env.NODE_ENV !== 'development') {
    return null
  }

  try {
    // This would integrate with webpack-bundle-analyzer or similar
    // For now, we'll provide a mock analysis
    const analysis: BundleAnalysis = {
      totalSize: 0,
      initialSize: 0,
      asyncChunks: [],
      dependencies: {},
      duplicates: []
    }

    // In a real implementation, this would analyze the webpack stats
    console.log('📊 Bundle analysis:', analysis)
    return analysis
  } catch (error) {
    console.error('Failed to analyze bundle:', error)
    return null
  }
}

/**
 * Get chunk loading statistics
 */
export function getChunkStats() {
  const states = Array.from(chunkStates.entries())

  return {
    totalChunks: states.length,
    loadedChunks: Array.from(loadedChunks),
    failedChunks: states.filter(([, state]) => state.error).map(([name]) => name),
    loadingChunks: states.filter(([, state]) => state.loading).map(([name]) => name),
    retryStats: states.reduce(
      (acc, [name, state]) => {
        if (state.retryCount > 0) {
          acc[name] = state.retryCount
        }
        return acc
      },
      {} as Record<string, number>
    )
  }
}

/**
 * Bundle optimization for Uniapp pages
 */
export const pageComponents = {
  // Admin pages (heavy, load on demand)
  AdminDashboard: () =>
    createRouteComponent('admin-dashboard', () => import('../pages/admin/dashboard/index.vue')),

  AdminProducts: () =>
    createRouteComponent('admin-products', () => import('../pages/admin/products/index.vue')),

  AdminQuotes: () =>
    createRouteComponent('admin-quotes', () => import('../pages/admin/quotes/index.vue')),

  AdminCustomers: () =>
    createRouteComponent('admin-customers', () => import('../pages/admin/customers/index.vue')),

  AdminUsers: () =>
    createRouteComponent('admin-users', () => import('../pages/admin/users/index.vue')),

  // Sales pages (critical, preload)
  SalesHome: () => createRouteComponent('sales-home', () => import('../pages/sales/index.vue')),

  SalesQuoteCreate: () =>
    createFeatureComponent('sales-quote-create', () => import('../pages/sales/quote/create.vue'), {
      criticalFeature: true
    }),

  SalesQuotePreview: () =>
    createFeatureComponent(
      'sales-quote-preview',
      () => import('../pages/sales/quote/preview.vue'),
      { criticalFeature: true }
    )
}

/**
 * Component bundles for feature-based splitting
 */
export const featureComponents = {
  // Charts and analytics (load when needed)
  ChartWidget: () =>
    createFeatureComponent('chart-widget', () => import('../components/admin/ChartWidget.vue')),

  // Data table (heavy, lazy load)
  DataTable: () =>
    createFeatureComponent('data-table', () => import('../components/admin/DataTable.vue')),

  // Image upload (load when needed)
  ImageUpload: () =>
    createFeatureComponent('image-upload', () => import('../components/sales/ImageUpload.vue')),

  // Product selector (critical for sales)
  ProductSelector: () =>
    createFeatureComponent(
      'product-selector',
      () => import('../components/business/ProductSelector.vue'),
      { criticalFeature: true }
    )
}

/**
 * Smart preloading based on user behavior
 */
export class SmartPreloader {
  private userPatterns = new Map<string, number>()
  private preloadQueue = new Set<string>()

  /**
   * Track user navigation patterns
   */
  trackNavigation(from: string, to: string) {
    const pattern = `${from}->${to}`
    const count = this.userPatterns.get(pattern) || 0
    this.userPatterns.set(pattern, count + 1)

    // If pattern is frequent, preload related components
    if (count >= 3) {
      this.suggestPreload(to)
    }
  }

  /**
   * Suggest components to preload based on patterns
   */
  private suggestPreload(currentRoute: string) {
    const suggestions: Record<string, string[]> = {
      'sales-home': ['sales-quote-create'],
      'sales-quote-create': ['sales-quote-preview'],
      'admin-dashboard': ['admin-products', 'admin-quotes'],
      'admin-products': ['admin-quotes', 'admin-customers']
    }

    const componentsToPreload = suggestions[currentRoute] || []
    componentsToPreload.forEach(component => {
      if (!this.preloadQueue.has(component)) {
        this.preloadQueue.add(component)
        this.schedulePreload(component)
      }
    })
  }

  /**
   * Schedule preloading with idle time
   */
  private schedulePreload(component: string) {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        this.executePreload(component)
      })
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(() => {
        this.executePreload(component)
      }, 100)
    }
  }

  /**
   * Execute the preload
   */
  private async executePreload(component: string) {
    try {
      await preloadChunks([component])
      this.preloadQueue.delete(component)
    } catch (error) {
      console.warn(`Smart preload failed for ${component}:`, error)
      this.preloadQueue.delete(component)
    }
  }

  /**
   * Get preloading statistics
   */
  getStats() {
    return {
      patterns: Object.fromEntries(this.userPatterns),
      queueSize: this.preloadQueue.size,
      queuedComponents: Array.from(this.preloadQueue)
    }
  }
}

/**
 * Global smart preloader instance
 */
export const smartPreloader = new SmartPreloader()

/**
 * Update bundle optimization configuration
 */
export function updateBundleConfig(newConfig: Partial<BundleOptimizationConfig>) {
  Object.assign(config, newConfig)
}

/**
 * Get current configuration
 */
export function getBundleConfig(): BundleOptimizationConfig {
  return { ...config }
}

/**
 * Bundle optimization development tools
 */
export const bundleDevTools = {
  /**
   * Enable bundle optimization debugging
   */
  enable() {
    if (process.env.NODE_ENV !== 'development') {
      console.warn('Bundle dev tools should only be enabled in development')
      return
    }

    ;(window as any).__YESSALES_BUNDLE__ = {
      config,
      chunkStates,
      loadedChunks,
      smartPreloader,
      stats: getChunkStats,
      analyze: analyzeBundleComposition,
      preload: preloadChunks,
      prefetch: prefetchChunks
    }

    console.log('🔧 YesSales bundle optimization tools enabled')
  },

  /**
   * Generate bundle report
   */
  generateReport() {
    const stats = getChunkStats()
    const analysis = analyzeBundleComposition()
    const smartStats = smartPreloader.getStats()

    console.group('📦 Bundle Optimization Report')
    console.table(stats)
    console.table(smartStats)
    if (analysis) console.table(analysis)
    console.groupEnd()

    return { stats, analysis, smartStats }
  }
}
