/**
 * Performance Optimization Utilities
 *
 * Provides comprehensive performance optimization tools including
 * bundle analysis, runtime profiling, memory management, and optimization strategies.
 */

import { computed, nextTick, onMounted, onUnmounted, reactive, ref } from 'vue'
import { defineStore } from 'pinia'

// Type declarations for Chrome's memory API
interface ChromePerformanceMemory {
  usedJSHeapSize: number
  totalJSHeapSize: number
  jsHeapSizeLimit: number
}

interface PerformanceWithMemory extends Performance {
  memory?: ChromePerformanceMemory
}

interface PerformanceNavigationWithTransferSize {
  transferSize?: number
}

// Extended performance entry types
interface LayoutShiftEntry extends PerformanceEntry {
  value: number
  hadRecentInput: boolean
}

interface FirstInputEntry extends PerformanceEntry {
  processingStart: number
}

// Global type extensions
declare global {
  interface Window {
    __webpack_require__?: {
      cache: Record<string, any>
    }
    __YESSALES_PERFORMANCE__?: any
  }
}

// Environment variable type
declare const process: {
  env: {
    NODE_ENV: string
  }
}

/**
 * Performance metrics
 */
export interface PerformanceMetrics {
  // Bundle metrics
  bundleSize: number
  initialLoadTime: number
  firstContentfulPaint: number
  largestContentfulPaint: number
  cumulativeLayoutShift: number

  // Runtime metrics
  componentRenderTime: number
  storeOperationTime: number
  apiResponseTime: number

  // Memory metrics
  memoryUsage: number
  memoryLimit: number
  memoryLeaks: string[]

  // Network metrics
  totalRequests: number
  cachedRequests: number
  failedRequests: number
  averageResponseTime: number

  // User experience metrics
  timeToInteractive: number
  inputDelay: number
  visualStability: number
}

/**
 * Performance optimization configuration
 */
export interface PerformanceConfig {
  enableProfiling?: boolean
  enableMemoryMonitoring?: boolean
  enableNetworkMonitoring?: boolean
  enableComponentProfiling?: boolean

  // Thresholds
  memoryWarningThreshold?: number // MB
  slowOperationThreshold?: number // ms
  apiTimeoutThreshold?: number // ms

  // Optimization settings
  enableLazyLoading?: boolean
  enableImageOptimization?: boolean
  enableCodeSplitting?: boolean
  enablePrefetching?: boolean
}

/**
 * Component performance data
 */
export interface ComponentPerformance {
  name: string
  renderCount: number
  totalRenderTime: number
  averageRenderTime: number
  memoryUsage: number
  lastRenderTime: number
}

/**
 * Network request performance data
 */
export interface RequestPerformance {
  url: string
  method: string
  duration: number
  size: number
  cached: boolean
  timestamp: number
  status: number
}

/**
 * Default performance configuration
 */
const DEFAULT_PERF_CONFIG: Required<PerformanceConfig> = {
  enableProfiling: process.env.NODE_ENV === 'development',
  enableMemoryMonitoring: true,
  enableNetworkMonitoring: true,
  enableComponentProfiling: process.env.NODE_ENV === 'development',

  memoryWarningThreshold: 100, // 100MB
  slowOperationThreshold: 100, // 100ms
  apiTimeoutThreshold: 5000, // 5s

  enableLazyLoading: true,
  enableImageOptimization: true,
  enableCodeSplitting: true,
  enablePrefetching: true
}

/**
 * Performance monitoring store
 */
export const usePerformanceStore = defineStore('performance', () => {
  // Configuration
  const config = ref<Required<PerformanceConfig>>(DEFAULT_PERF_CONFIG)

  // Metrics
  const metrics = reactive<Partial<PerformanceMetrics>>({})

  // Component performance tracking
  const componentPerformance = reactive<Map<string, ComponentPerformance>>(new Map())

  // Network request tracking
  const requestPerformance = reactive<RequestPerformance[]>([])

  // Memory monitoring
  const memoryHistory = reactive<{ timestamp: number; usage: number }[]>([])

  // Performance warnings
  const warnings = reactive<{ type: string; message: string; timestamp: number }[]>([])

  // Computed properties
  const isMemoryWarning = computed(
    () => (metrics.memoryUsage || 0) > config.value.memoryWarningThreshold
  )

  const slowComponents = computed(() =>
    Array.from(componentPerformance.values())
      .filter(comp => comp.averageRenderTime > config.value.slowOperationThreshold)
      .sort((a, b) => b.averageRenderTime - a.averageRenderTime)
  )

  const slowRequests = computed(() =>
    requestPerformance
      .filter(req => req.duration > config.value.slowOperationThreshold)
      .sort((a, b) => b.duration - a.duration)
  )

  const cacheHitRate = computed(() => {
    const total = requestPerformance.length
    if (total === 0) return 0

    const cached = requestPerformance.filter(req => req.cached).length
    return Math.round((cached / total) * 100)
  })

  // Performance monitoring methods
  function startPerformanceMonitoring() {
    if (!config.value.enableProfiling) return

    console.log('🚀 启动性能监控')

    // Monitor Web Vitals
    monitorWebVitals()

    // Monitor memory usage
    if (config.value.enableMemoryMonitoring) {
      startMemoryMonitoring()
    }

    // Monitor network requests
    if (config.value.enableNetworkMonitoring) {
      monitorNetworkRequests()
    }
  }

  function monitorWebVitals() {
    // First Contentful Paint
    if (typeof window !== 'undefined' && 'performance' in window) {
      const observer = new PerformanceObserver(list => {
        const entries = list.getEntries()

        entries.forEach(entry => {
          switch (entry.entryType) {
            case 'paint':
              if (entry.name === 'first-contentful-paint') {
                metrics.firstContentfulPaint = entry.startTime
              }
              break

            case 'largest-contentful-paint':
              metrics.largestContentfulPaint = entry.startTime
              break

            case 'layout-shift':
              const layoutEntry = entry as LayoutShiftEntry
              if (!layoutEntry.hadRecentInput) {
                metrics.cumulativeLayoutShift =
                  (metrics.cumulativeLayoutShift || 0) + layoutEntry.value
              }
              break

            case 'first-input':
              const firstInputEntry = entry as FirstInputEntry
              metrics.inputDelay = firstInputEntry.processingStart - entry.startTime
              break
          }
        })
      })

      try {
        observer.observe({
          entryTypes: ['paint', 'largest-contentful-paint', 'layout-shift', 'first-input']
        })
      } catch (error) {
        console.warn('Performance Observer not fully supported:', error)
      }
    }
  }

  function startMemoryMonitoring() {
    const checkMemory = () => {
      if (
        typeof window !== 'undefined' &&
        'performance' in window
      ) {
        const performance = window.performance as PerformanceWithMemory
        const memory = performance.memory
        
        if (!memory) return
        
        const usageInMB = Math.round(memory.usedJSHeapSize / 1024 / 1024)
        const limitInMB = Math.round(memory.jsHeapSizeLimit / 1024 / 1024)

        metrics.memoryUsage = usageInMB
        metrics.memoryLimit = limitInMB

        // Record memory history
        memoryHistory.push({
          timestamp: Date.now(),
          usage: usageInMB
        })

        // Keep only last 100 records
        if (memoryHistory.length > 100) {
          memoryHistory.splice(0, memoryHistory.length - 100)
        }

        // Check for memory warning
        if (usageInMB > config.value.memoryWarningThreshold) {
          addWarning('memory', `内存使用过高: ${usageInMB}MB / ${limitInMB}MB`)
        }

        // Detect potential memory leaks
        if (memoryHistory.length >= 10) {
          const recent = memoryHistory.slice(-10)
          const trend = recent.reduce((sum, record, index) => {
            if (index === 0) return 0
            return sum + (record.usage - recent[index - 1].usage)
          }, 0)

          if (trend > 20) {
            // Growing by more than 20MB in recent samples
            addWarning('memory-leak', '检测到可能的内存泄漏')
          }
        }
      }
    }

    // Check memory every 10 seconds
    const memoryInterval = setInterval(checkMemory, 10000)
    checkMemory() // Initial check

    return () => clearInterval(memoryInterval)
  }

  function monitorNetworkRequests() {
    // Override fetch to monitor requests
    if (typeof window !== 'undefined' && window.fetch) {
      const originalFetch = window.fetch

      window.fetch = async function (...args) {
        const start = performance.now()
        const url = typeof args[0] === 'string' ? args[0] : (args[0] as any).url || '[Unknown URL]'
        const method = args[1]?.method || 'GET'

        try {
          const response = await originalFetch.apply(this, args)
          const duration = performance.now() - start

          recordRequest({
            url,
            method,
            duration,
            size: parseInt(response.headers.get('content-length') || '0'),
            cached: response.headers.get('x-cache') === 'HIT',
            timestamp: Date.now(),
            status: response.status
          })

          return response
        } catch (error) {
          const duration = performance.now() - start

          recordRequest({
            url,
            method,
            duration,
            size: 0,
            cached: false,
            timestamp: Date.now(),
            status: 0
          })

          throw error
        }
      }
    }
  }

  function recordRequest(request: RequestPerformance) {
    requestPerformance.push(request)

    // Keep only last 100 requests
    if (requestPerformance.length > 100) {
      requestPerformance.splice(0, requestPerformance.length - 100)
    }

    // Update metrics
    const total = requestPerformance.length
    const failed = requestPerformance.filter(req => req.status >= 400 || req.status === 0).length
    const cached = requestPerformance.filter(req => req.cached).length
    const avgDuration = requestPerformance.reduce((sum, req) => sum + req.duration, 0) / total

    metrics.totalRequests = total
    metrics.failedRequests = failed
    metrics.cachedRequests = cached
    metrics.averageResponseTime = Math.round(avgDuration)

    // Check for slow requests
    if (request.duration > config.value.apiTimeoutThreshold) {
      addWarning('slow-request', `请求响应缓慢: ${request.url} (${Math.round(request.duration)}ms)`)
    }
  }

  function recordComponentPerformance(
    componentName: string,
    renderTime: number,
    memoryDelta: number = 0
  ) {
    if (!config.value.enableComponentProfiling) return

    const existing = componentPerformance.get(componentName)

    if (existing) {
      existing.renderCount++
      existing.totalRenderTime += renderTime
      existing.averageRenderTime = existing.totalRenderTime / existing.renderCount
      existing.memoryUsage += memoryDelta
      existing.lastRenderTime = renderTime
    } else {
      componentPerformance.set(componentName, {
        name: componentName,
        renderCount: 1,
        totalRenderTime: renderTime,
        averageRenderTime: renderTime,
        memoryUsage: memoryDelta,
        lastRenderTime: renderTime
      })
    }

    // Check for slow components
    if (renderTime > config.value.slowOperationThreshold) {
      addWarning('slow-component', `组件渲染缓慢: ${componentName} (${Math.round(renderTime)}ms)`)
    }
  }

  function addWarning(type: string, message: string) {
    warnings.push({
      type,
      message,
      timestamp: Date.now()
    })

    // Keep only last 50 warnings
    if (warnings.length > 50) {
      warnings.splice(0, warnings.length - 50)
    }

    console.warn(`⚠️ 性能警告 [${type}]: ${message}`)
  }

  function clearWarnings() {
    warnings.length = 0
  }

  function getPerformanceReport() {
    return {
      metrics: { ...metrics },
      componentStats: {
        total: componentPerformance.size,
        slow: slowComponents.value.length,
        topSlow: slowComponents.value.slice(0, 5)
      },
      networkStats: {
        totalRequests: requestPerformance.length,
        cacheHitRate: cacheHitRate.value,
        slowRequests: slowRequests.value.length,
        averageResponseTime: metrics.averageResponseTime
      },
      memoryStats: {
        current: metrics.memoryUsage,
        limit: metrics.memoryLimit,
        isWarning: isMemoryWarning.value,
        history: memoryHistory.slice(-20) // Last 20 samples
      },
      warnings: warnings.slice(-10) // Last 10 warnings
    }
  }

  return {
    // Configuration
    config: computed(() => config.value),
    updateConfig: (newConfig: Partial<PerformanceConfig>) => {
      Object.assign(config.value, newConfig)
    },

    // State
    metrics: computed(() => metrics),
    componentPerformance: computed(() => Array.from(componentPerformance.values())),
    requestPerformance: computed(() => requestPerformance),
    memoryHistory: computed(() => memoryHistory),
    warnings: computed(() => warnings),

    // Computed stats
    isMemoryWarning,
    slowComponents,
    slowRequests,
    cacheHitRate,

    // Methods
    startPerformanceMonitoring,
    recordComponentPerformance,
    addWarning,
    clearWarnings,
    getPerformanceReport
  }
})

/**
 * Component performance tracking composable
 */
export function useComponentPerformance(componentName: string) {
  const performanceStore = usePerformanceStore()
  let renderStart = 0

  function startRender() {
    renderStart = performance.now()
  }

  function endRender() {
    if (renderStart > 0) {
      const renderTime = performance.now() - renderStart
      performanceStore.recordComponentPerformance(componentName, renderTime)
      renderStart = 0
    }
  }

  // Auto-track render performance
  onMounted(() => {
    startRender()
    nextTick(endRender)
  })

  return {
    startRender,
    endRender
  }
}

/**
 * Memory leak detector
 */
export function useMemoryLeakDetector(componentName: string) {
  const performanceStore = usePerformanceStore()
  let initialMemory = 0
  const timers: number[] = []
  const listeners: Array<{ element: any; event: string; handler: Function }> = []

  onMounted(() => {
    if (
      typeof window !== 'undefined' &&
      'performance' in window
    ) {
      const performance = window.performance as PerformanceWithMemory
      if (performance.memory) {
        initialMemory = performance.memory.usedJSHeapSize
      }
    }
  })

  onUnmounted(() => {
    // Clear all timers
    timers.forEach(timer => clearTimeout(timer))
    timers.length = 0

    // Remove all listeners
    listeners.forEach(({ element, event, handler }) => {
      element.removeEventListener(event, handler)
    })
    listeners.length = 0

    // Check for memory leaks
    if (
      initialMemory > 0 &&
      typeof window !== 'undefined' &&
      'performance' in window
    ) {
      const performance = window.performance as PerformanceWithMemory
      if (performance.memory) {
        const finalMemory = performance.memory.usedJSHeapSize
        const memoryDelta = finalMemory - initialMemory

        if (memoryDelta > 1024 * 1024) {
          // More than 1MB
          performanceStore.addWarning(
            'potential-memory-leak',
            `组件 ${componentName} 可能存在内存泄漏 (+${Math.round(memoryDelta / 1024 / 1024)}MB)`
          )
        }
      }
    }
  })

  // Helper to track timers
  function addTimer(timer: number) {
    timers.push(timer)
  }

  // Helper to track event listeners
  function addListener(element: any, event: string, handler: Function) {
    element.addEventListener(event, handler)
    listeners.push({ element, event, handler })
  }

  return {
    addTimer,
    addListener
  }
}

/**
 * Performance optimization utilities
 */
export const performanceUtils = {
  /**
   * Lazy load images
   */
  lazyLoadImage(imgElement: HTMLImageElement, src: string, placeholder?: string) {
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement
            img.src = src
            img.onload = () => {
              img.classList.add('loaded')
            }
            observer.unobserve(img)
          }
        })
      })

      if (placeholder) {
        imgElement.src = placeholder
      }
      imgElement.classList.add('lazy')
      observer.observe(imgElement)
    } else {
      // Fallback for browsers without IntersectionObserver
      imgElement.src = src
    }
  },

  /**
   * Debounce function to limit execution frequency
   */
  debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
    let timeout: number
    return ((...args: any[]) => {
      clearTimeout(timeout)
      timeout = setTimeout(() => func.apply(this, args), wait) as any
    }) as T
  },

  /**
   * Throttle function to limit execution rate
   */
  throttle<T extends (...args: any[]) => any>(func: T, limit: number): T {
    let inThrottle: boolean
    return ((...args: any[]) => {
      if (!inThrottle) {
        func.apply(this, args)
        inThrottle = true
        setTimeout(() => (inThrottle = false), limit)
      }
    }) as T
  },

  /**
   * Request animation frame wrapper
   */
  raf(callback: FrameRequestCallback): number {
    return requestAnimationFrame(callback)
  },

  /**
   * Bundle analyzer (development only)
   */
  analyzeBundleSize() {
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Bundle 分析:')
      const navigationTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming & PerformanceNavigationWithTransferSize
      console.log(`Initial bundle size: ${(navigationTiming?.transferSize || 0) / 1024}KB`)

      // Log loaded modules (if webpack is available)
      if (window.__webpack_require__?.cache) {
        const loadedModules = Object.keys(window.__webpack_require__.cache).length
        console.log(`Loaded modules: ${loadedModules}`)
      }
    }
  },

  /**
   * Preload critical resources
   */
  preloadResource(url: string, type: 'script' | 'style' | 'image' | 'font') {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.href = url

    switch (type) {
      case 'script':
        link.as = 'script'
        break
      case 'style':
        link.as = 'style'
        break
      case 'image':
        link.as = 'image'
        break
      case 'font':
        link.as = 'font'
        link.crossOrigin = 'anonymous'
        break
    }

    document.head.appendChild(link)
  }
}

/**
 * Development performance tools
 */
export const devPerformanceTools = {
  /**
   * Enable performance monitoring in development
   */
  enable() {
    if (process.env.NODE_ENV !== 'development') {
      console.warn('Performance tools should only be enabled in development')
      return
    }

    const performanceStore = usePerformanceStore()
    performanceStore.startPerformanceMonitoring()

    // Add global performance methods
    ;(window as any).__YESSALES_PERFORMANCE__ = {
      store: performanceStore,
      report: performanceStore.getPerformanceReport,
      clear: performanceStore.clearWarnings,
      utils: performanceUtils
    }

    console.log('🔧 YesSales performance tools enabled')
  },

  /**
   * Generate performance report
   */
  generateReport() {
    const performanceStore = usePerformanceStore()
    const report = performanceStore.getPerformanceReport()

    console.group('📊 Performance Report')
    console.table(report.componentStats)
    console.table(report.networkStats)
    console.table(report.memoryStats)
    console.groupEnd()

    return report
  },

  /**
   * Analyze component performance
   */
  analyzeComponents() {
    const performanceStore = usePerformanceStore()
    const components = performanceStore.componentPerformance

    console.group('🔍 Component Analysis')
    components.forEach(comp => {
      console.log(`${comp.name}:`, {
        renders: comp.renderCount,
        avgTime: `${comp.averageRenderTime.toFixed(2)}ms`,
        memory: `${comp.memoryUsage}B`
      })
    })
    console.groupEnd()

    return components
  }
}
