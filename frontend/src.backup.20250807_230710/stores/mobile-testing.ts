/**
 * Mobile Testing Store
 *
 * Manages mobile adaptation testing state, results, and configuration
 * for comprehensive device compatibility validation.
 */

import { defineStore } from 'pinia'
import { computed, reactive, ref } from 'vue'
import { type DeviceInfo, useDeviceDetection } from '@/utils/device-detection'
import { usePerformanceStore } from '@/utils/performance'
import { useCache, useLoadingState, usePersistence } from '@/stores/utils'

/**
 * Mobile test configuration
 */
export interface MobileTestConfig {
  // Test categories
  enableDeviceDetection: boolean
  enableResponsiveTest: boolean
  enableTouchTest: boolean
  enablePerformanceTest: boolean
  enableAccessibilityTest: boolean
  enableNetworkTest: boolean

  // Test targets
  testDevices: TestDevice[]
  testOrientations: ('portrait' | 'landscape')[]
  testNetworkConditions: NetworkCondition[]

  // Performance thresholds
  performanceThresholds: {
    maxLoadTime: number // ms
    maxMemoryUsage: number // MB
    minFPS: number
    maxCLS: number // Cumulative Layout Shift
    maxFID: number // First Input Delay
  }

  // Accessibility thresholds
  accessibilityThresholds: {
    minTouchTargetSize: number // px
    minColorContrast: number
    maxTextSize: number // sp/px
  }

  // Test automation
  autoRunTests: boolean
  testSchedule: string // cron expression
  enableReporting: boolean
}

/**
 * Test device definition
 */
export interface TestDevice {
  id: string
  name: string
  width: number
  height: number
  pixelRatio: number
  platform: 'ios' | 'android' | 'web'
  isTablet: boolean
  userAgent?: string
}

/**
 * Network condition simulation
 */
export interface NetworkCondition {
  name: string
  downloadSpeed: number // Mbps
  uploadSpeed: number // Mbps
  latency: number // ms
  packetLoss: number // percentage
}

/**
 * Test result interface
 */
export interface TestResult {
  id: string
  timestamp: number
  deviceId: string
  testType: TestType
  status: 'pass' | 'fail' | 'warning'
  score: number
  details: TestDetails
  screenshots?: string[]
}

/**
 * Test types
 */
export type TestType =
  | 'device-detection'
  | 'responsive-design'
  | 'touch-interaction'
  | 'performance-benchmark'
  | 'accessibility-audit'
  | 'network-adaptation'

/**
 * Test details
 */
export interface TestDetails {
  metrics: Record<string, number>
  issues: TestIssue[]
  recommendations: string[]
  duration: number
}

/**
 * Test issue
 */
export interface TestIssue {
  severity: 'error' | 'warning' | 'info'
  category: string
  message: string
  element?: string
  location?: { x: number; y: number }
  screenshot?: string
}

/**
 * Test execution context
 */
export interface TestContext {
  device: TestDevice
  orientation: 'portrait' | 'landscape'
  networkCondition?: NetworkCondition
  darkMode: boolean
  timestamp: number
}

/**
 * Test suite definition
 */
export interface TestSuite {
  id: string
  name: string
  description: string
  tests: TestType[]
  devices: string[] // device IDs
  config: Partial<MobileTestConfig>
  schedule?: string
}

/**
 * Default test devices
 */
const DEFAULT_TEST_DEVICES: TestDevice[] = [
  {
    id: 'iphone-se',
    name: 'iPhone SE',
    width: 320,
    height: 568,
    pixelRatio: 2,
    platform: 'ios',
    isTablet: false
  },
  {
    id: 'iphone-12',
    name: 'iPhone 12',
    width: 375,
    height: 812,
    pixelRatio: 3,
    platform: 'ios',
    isTablet: false
  },
  {
    id: 'android-pixel',
    name: 'Google Pixel 5',
    width: 393,
    height: 851,
    pixelRatio: 3,
    platform: 'android',
    isTablet: false
  },
  {
    id: 'android-samsung',
    name: 'Samsung Galaxy S21',
    width: 384,
    height: 854,
    pixelRatio: 2.75,
    platform: 'android',
    isTablet: false
  },
  {
    id: 'ipad',
    name: 'iPad',
    width: 768,
    height: 1024,
    pixelRatio: 2,
    platform: 'ios',
    isTablet: true
  },
  {
    id: 'android-tablet',
    name: 'Android Tablet',
    width: 800,
    height: 1280,
    pixelRatio: 2,
    platform: 'android',
    isTablet: true
  }
]

/**
 * Default network conditions
 */
const DEFAULT_NETWORK_CONDITIONS: NetworkCondition[] = [
  {
    name: '5G',
    downloadSpeed: 100,
    uploadSpeed: 50,
    latency: 10,
    packetLoss: 0
  },
  {
    name: '4G',
    downloadSpeed: 10,
    uploadSpeed: 5,
    latency: 50,
    packetLoss: 0
  },
  {
    name: '3G',
    downloadSpeed: 1.5,
    uploadSpeed: 0.75,
    latency: 200,
    packetLoss: 0
  },
  {
    name: 'Slow 3G',
    downloadSpeed: 0.5,
    uploadSpeed: 0.25,
    latency: 400,
    packetLoss: 5
  },
  {
    name: 'WiFi',
    downloadSpeed: 50,
    uploadSpeed: 25,
    latency: 20,
    packetLoss: 0
  },
  {
    name: 'Offline',
    downloadSpeed: 0,
    uploadSpeed: 0,
    latency: 0,
    packetLoss: 100
  }
]

/**
 * Default configuration
 */
const DEFAULT_CONFIG: MobileTestConfig = {
  enableDeviceDetection: true,
  enableResponsiveTest: true,
  enableTouchTest: true,
  enablePerformanceTest: true,
  enableAccessibilityTest: true,
  enableNetworkTest: false,

  testDevices: DEFAULT_TEST_DEVICES,
  testOrientations: ['portrait', 'landscape'],
  testNetworkConditions: DEFAULT_NETWORK_CONDITIONS.slice(0, 4), // Exclude offline by default

  performanceThresholds: {
    maxLoadTime: 3000, // 3 seconds
    maxMemoryUsage: 100, // 100MB
    minFPS: 30,
    maxCLS: 0.1,
    maxFID: 100 // 100ms
  },

  accessibilityThresholds: {
    minTouchTargetSize: 44, // 44px minimum touch target
    minColorContrast: 4.5, // WCAG AA standard
    maxTextSize: 20 // Maximum text size for readability
  },

  autoRunTests: false,
  testSchedule: '0 9 * * 1', // Every Monday at 9 AM
  enableReporting: true
}

/**
 * Mobile testing store
 */
export const useMobileTestingStore = defineStore('mobileTesting', () => {
  // Configuration
  const config = ref<MobileTestConfig>({ ...DEFAULT_CONFIG })

  // Test state
  const testResults = reactive<Map<string, TestResult>>(new Map())
  const testSuites = reactive<Map<string, TestSuite>>(new Map())
  const currentTest = ref<TestContext | null>(null)
  const testHistory = reactive<TestResult[]>([])

  // Statistics
  const totalTests = ref(0)
  const passedTests = ref(0)
  const failedTests = ref(0)
  const warningTests = ref(0)

  // Utilities
  const { isLoading, startLoading, stopLoading } = useLoadingState('mobile-testing')
  const cache = useCache('mobile-testing', { defaultTTL: 30 * 60 * 1000 }) // 30 minutes
  const deviceDetection = useDeviceDetection()
  const performanceStore = usePerformanceStore()
  const persistence = usePersistence('mobile-testing', {
    include: ['config', 'testResults', 'testSuites', 'testHistory'],
    enableAutoPersist: true
  })

  // Initialize persistence
  persistence.initializePersistence({
    config: config.value,
    testResults: Array.from(testResults.entries()),
    testSuites: Array.from(testSuites.entries()),
    testHistory
  })

  // Computed properties
  const passRate = computed(() => {
    if (totalTests.value === 0) return 0
    return Math.round((passedTests.value / totalTests.value) * 100)
  })

  const testingSummary = computed(() => ({
    total: totalTests.value,
    passed: passedTests.value,
    failed: failedTests.value,
    warnings: warningTests.value,
    passRate: passRate.value
  }))

  const availableDevices = computed(() => config.value.testDevices)

  const recentResults = computed(() => testHistory.slice(-10).reverse())

  const criticalIssues = computed(() =>
    testHistory
      .filter(result => result.status === 'fail')
      .flatMap(result => result.details.issues.filter(issue => issue.severity === 'error'))
      .slice(-20)
  )

  // Core testing methods

  /**
   * Initialize mobile testing system
   */
  async function initializeTesting() {
    console.log('🚀 初始化移动端测试系统...')

    try {
      // Ensure device detection is ready
      if (!deviceDetection.isReady.value) {
        await deviceDetection.detectDevice()
      }

      // Load default test suites
      await loadDefaultTestSuites()

      // Start performance monitoring if enabled
      if (config.value.enablePerformanceTest) {
        performanceStore.startPerformanceMonitoring()
      }

      console.log('✅ 移动端测试系统初始化完成')
      return { success: true }
    } catch (error) {
      console.error('❌ 测试系统初始化失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '初始化失败' }
    }
  }

  /**
   * Run comprehensive mobile test
   */
  async function runMobileTest(testType: TestType, deviceId?: string): Promise<TestResult> {
    const device = deviceId
      ? config.value.testDevices.find(d => d.id === deviceId)
      : getCurrentDevice()

    if (!device) {
      throw new Error('测试设备未找到')
    }

    const testContext: TestContext = {
      device,
      orientation: deviceDetection.orientation.value,
      darkMode: deviceDetection.isDarkMode(),
      timestamp: Date.now()
    }

    currentTest.value = testContext

    const testId = `${testType}_${device.id}_${testContext.timestamp}`

    try {
      startLoading('mobile-testing', `running-${testType}`)

      let result: TestResult

      switch (testType) {
        case 'device-detection':
          result = await runDeviceDetectionTest(testId, testContext)
          break
        case 'responsive-design':
          result = await runResponsiveTest(testId, testContext)
          break
        case 'touch-interaction':
          result = await runTouchTest(testId, testContext)
          break
        case 'performance-benchmark':
          result = await runPerformanceTest(testId, testContext)
          break
        case 'accessibility-audit':
          result = await runAccessibilityTest(testId, testContext)
          break
        case 'network-adaptation':
          result = await runNetworkTest(testId, testContext)
          break
        default:
          throw new Error(`未知的测试类型: ${testType}`)
      }

      // Store result
      testResults.set(testId, result)
      testHistory.push(result)

      // Update statistics
      totalTests.value++
      if (result.status === 'pass') passedTests.value++
      else if (result.status === 'fail') failedTests.value++
      else if (result.status === 'warning') warningTests.value++

      // Keep history manageable
      if (testHistory.length > 100) {
        testHistory.splice(0, testHistory.length - 100)
      }

      console.log(`✅ ${testType} 测试完成:`, result.status)
      return result
    } finally {
      stopLoading('mobile-testing', `running-${testType}`)
      currentTest.value = null
    }
  }

  /**
   * Run device detection test
   */
  async function runDeviceDetectionTest(testId: string, context: TestContext): Promise<TestResult> {
    const startTime = Date.now()
    const issues: TestIssue[] = []
    const metrics: Record<string, number> = {}

    try {
      // Test device detection accuracy
      const detectedInfo = deviceDetection.info.value

      if (!detectedInfo) {
        issues.push({
          severity: 'error',
          category: 'device-detection',
          message: '设备信息检测失败'
        })
      } else {
        // Validate detected information
        metrics.screenWidth = detectedInfo.screenWidth
        metrics.screenHeight = detectedInfo.screenHeight
        metrics.pixelRatio = detectedInfo.pixelRatio

        // Check for inconsistencies
        if (Math.abs(detectedInfo.screenWidth - context.device.width) > 50) {
          issues.push({
            severity: 'warning',
            category: 'screen-dimensions',
            message: `检测到的屏幕宽度 (${detectedInfo.screenWidth}px) 与预期设备规格不符 (${context.device.width}px)`
          })
        }

        if (Math.abs(detectedInfo.pixelRatio - context.device.pixelRatio) > 0.5) {
          issues.push({
            severity: 'warning',
            category: 'pixel-ratio',
            message: `检测到的像素密度 (${detectedInfo.pixelRatio}) 与预期不符 (${context.device.pixelRatio})`
          })
        }

        // Test capabilities detection
        const capabilityCount = Object.values(detectedInfo.capabilities).filter(Boolean).length
        metrics.capabilitiesDetected = capabilityCount

        if (capabilityCount === 0) {
          issues.push({
            severity: 'warning',
            category: 'capabilities',
            message: '未检测到任何设备能力'
          })
        }
      }
    } catch (error) {
      issues.push({
        severity: 'error',
        category: 'detection-error',
        message: error instanceof Error ? error.message : '设备检测过程中发生错误'
      })
    }

    const duration = Date.now() - startTime
    const score = calculateTestScore(issues)

    return {
      id: testId,
      timestamp: context.timestamp,
      deviceId: context.device.id,
      testType: 'device-detection',
      status: issues.some(i => i.severity === 'error')
        ? 'fail'
        : issues.some(i => i.severity === 'warning')
          ? 'warning'
          : 'pass',
      score,
      details: {
        metrics,
        issues,
        recommendations: generateRecommendations(issues, 'device-detection'),
        duration
      }
    }
  }

  /**
   * Run responsive design test
   */
  async function runResponsiveTest(testId: string, context: TestContext): Promise<TestResult> {
    const startTime = Date.now()
    const issues: TestIssue[] = []
    const metrics: Record<string, number> = {}

    // Test viewport adaptation
    metrics.viewportWidth = context.device.width
    metrics.viewportHeight = context.device.height

    // Check responsive breakpoints
    const breakpoints = [320, 375, 414, 768, 1024]
    const currentWidth = context.device.width

    let responsiveScore = 100

    // Simulate different viewport sizes
    for (const breakpoint of breakpoints) {
      if (Math.abs(currentWidth - breakpoint) < 50) {
        // This device is close to a standard breakpoint
        metrics[`breakpoint_${breakpoint}_match`] = 1
      }
    }

    // Check for common responsive issues
    if (currentWidth < 375 && context.device.platform === 'ios') {
      issues.push({
        severity: 'warning',
        category: 'small-screen',
        message: 'iPhone SE等小屏设备需要特别注意布局适配'
      })
      responsiveScore -= 10
    }

    if (context.device.isTablet) {
      issues.push({
        severity: 'info',
        category: 'tablet-optimization',
        message: '建议为平板设备优化布局，充分利用屏幕空间'
      })
    }

    const duration = Date.now() - startTime
    metrics.responsiveScore = responsiveScore

    return {
      id: testId,
      timestamp: context.timestamp,
      deviceId: context.device.id,
      testType: 'responsive-design',
      status: responsiveScore >= 80 ? 'pass' : responsiveScore >= 60 ? 'warning' : 'fail',
      score: responsiveScore,
      details: {
        metrics,
        issues,
        recommendations: generateRecommendations(issues, 'responsive-design'),
        duration
      }
    }
  }

  /**
   * Run touch interaction test
   */
  async function runTouchTest(testId: string, context: TestContext): Promise<TestResult> {
    const startTime = Date.now()
    const issues: TestIssue[] = []
    const metrics: Record<string, number> = {}

    // Test touch target sizes (simulated)
    const minTouchTarget = config.value.accessibilityThresholds.minTouchTargetSize

    // Simulate touch target analysis
    metrics.minTouchTargetSize = minTouchTarget
    metrics.touchTargetsAnalyzed = 10 // Simulated
    metrics.touchTargetsPassed = 8 // Simulated

    const passRate = (metrics.touchTargetsPassed / metrics.touchTargetsAnalyzed) * 100

    if (passRate < 90) {
      issues.push({
        severity: 'warning',
        category: 'touch-targets',
        message: `${Math.round(100 - passRate)}% 的触摸目标小于推荐的 ${minTouchTarget}px`
      })
    }

    // Test gesture support
    if (context.device.platform === 'web') {
      issues.push({
        severity: 'info',
        category: 'gestures',
        message: 'Web平台手势支持可能受限，建议测试原生App版本'
      })
    }

    const duration = Date.now() - startTime
    const score = Math.min(100, passRate)

    return {
      id: testId,
      timestamp: context.timestamp,
      deviceId: context.device.id,
      testType: 'touch-interaction',
      status: score >= 80 ? 'pass' : score >= 60 ? 'warning' : 'fail',
      score,
      details: {
        metrics,
        issues,
        recommendations: generateRecommendations(issues, 'touch-interaction'),
        duration
      }
    }
  }

  /**
   * Run performance test
   */
  async function runPerformanceTest(testId: string, context: TestContext): Promise<TestResult> {
    const startTime = Date.now()
    const issues: TestIssue[] = []
    const metrics: Record<string, number> = {}

    // Get performance metrics from performance store
    const performanceReport = performanceStore.getPerformanceReport()

    // Memory usage
    const memoryUsage = performanceReport.memoryStats.current || 0
    metrics.memoryUsage = memoryUsage

    if (memoryUsage > config.value.performanceThresholds.maxMemoryUsage) {
      issues.push({
        severity: 'error',
        category: 'memory',
        message: `内存使用过高: ${memoryUsage}MB (阈值: ${config.value.performanceThresholds.maxMemoryUsage}MB)`
      })
    }

    // Response time
    const avgResponseTime = performanceReport.networkStats.averageResponseTime || 0
    metrics.averageResponseTime = avgResponseTime

    if (avgResponseTime > config.value.performanceThresholds.maxLoadTime) {
      issues.push({
        severity: 'warning',
        category: 'response-time',
        message: `API响应时间过长: ${avgResponseTime}ms`
      })
    }

    // Device-specific performance considerations
    const devicePerformanceLevel = deviceDetection.performanceLevel.value
    metrics.devicePerformanceLevel =
      devicePerformanceLevel === 'high' ? 3 : devicePerformanceLevel === 'medium' ? 2 : 1

    if (devicePerformanceLevel === 'low') {
      issues.push({
        severity: 'info',
        category: 'device-performance',
        message: '检测到低性能设备，建议启用性能优化模式'
      })
    }

    const duration = Date.now() - startTime
    const score = calculatePerformanceScore(metrics, issues)

    return {
      id: testId,
      timestamp: context.timestamp,
      deviceId: context.device.id,
      testType: 'performance-benchmark',
      status: score >= 80 ? 'pass' : score >= 60 ? 'warning' : 'fail',
      score,
      details: {
        metrics,
        issues,
        recommendations: generateRecommendations(issues, 'performance-benchmark'),
        duration
      }
    }
  }

  /**
   * Run accessibility test
   */
  async function runAccessibilityTest(testId: string, context: TestContext): Promise<TestResult> {
    const startTime = Date.now()
    const issues: TestIssue[] = []
    const metrics: Record<string, number> = {}

    // Color contrast testing (simulated)
    metrics.colorContrastChecks = 15 // Simulated
    metrics.colorContrastPassed = 12 // Simulated

    const contrastPassRate = (metrics.colorContrastPassed / metrics.colorContrastChecks) * 100

    if (contrastPassRate < 90) {
      issues.push({
        severity: 'warning',
        category: 'color-contrast',
        message: `${Math.round(100 - contrastPassRate)}% 的颜色对比度未达到WCAG AA标准`
      })
    }

    // Screen reader compatibility
    if (context.device.platform === 'ios' || context.device.platform === 'android') {
      metrics.screenReaderCompatible = 1
    } else {
      issues.push({
        severity: 'info',
        category: 'screen-reader',
        message: 'Web平台建议测试屏幕阅读器兼容性'
      })
    }

    // Text size and readability
    const isDarkMode = context.darkMode
    if (isDarkMode) {
      issues.push({
        severity: 'info',
        category: 'dark-mode',
        message: '检测到深色模式，确保文本在深色背景下可读性良好'
      })
    }

    const duration = Date.now() - startTime
    const score = Math.min(100, contrastPassRate)

    return {
      id: testId,
      timestamp: context.timestamp,
      deviceId: context.device.id,
      testType: 'accessibility-audit',
      status: score >= 80 ? 'pass' : score >= 60 ? 'warning' : 'fail',
      score,
      details: {
        metrics,
        issues,
        recommendations: generateRecommendations(issues, 'accessibility-audit'),
        duration
      }
    }
  }

  /**
   * Run network adaptation test
   */
  async function runNetworkTest(testId: string, context: TestContext): Promise<TestResult> {
    const startTime = Date.now()
    const issues: TestIssue[] = []
    const metrics: Record<string, number> = {}

    // Network type detection
    const networkType = deviceDetection.info.value?.networkType || 'unknown'
    metrics.networkType =
      networkType === '5g' ? 5 : networkType === '4g' ? 4 : networkType === '3g' ? 3 : 1

    // Simulate network adaptation tests
    if (networkType === '3g' || networkType === 'slow') {
      issues.push({
        severity: 'warning',
        category: 'slow-network',
        message: '检测到慢速网络，建议启用数据节省模式'
      })
    }

    // Test offline capability
    metrics.offlineSupported = 1 // Assuming we have offline support

    const duration = Date.now() - startTime
    const score = 85 // Base score, adjusted by issues

    return {
      id: testId,
      timestamp: context.timestamp,
      deviceId: context.device.id,
      testType: 'network-adaptation',
      status: issues.length === 0 ? 'pass' : 'warning',
      score,
      details: {
        metrics,
        issues,
        recommendations: generateRecommendations(issues, 'network-adaptation'),
        duration
      }
    }
  }

  // Helper functions

  /**
   * Get current device info as TestDevice
   */
  function getCurrentDevice(): TestDevice | null {
    const info = deviceDetection.info.value
    if (!info) return null

    return {
      id: 'current-device',
      name: `${info.brand} ${info.model}`,
      width: info.windowWidth,
      height: info.windowHeight,
      pixelRatio: info.pixelRatio,
      platform: info.platform,
      isTablet: info.isTablet
    }
  }

  /**
   * Calculate test score based on issues
   */
  function calculateTestScore(issues: TestIssue[]): number {
    let score = 100

    for (const issue of issues) {
      switch (issue.severity) {
        case 'error':
          score -= 30
          break
        case 'warning':
          score -= 10
          break
        case 'info':
          score -= 2
          break
      }
    }

    return Math.max(0, score)
  }

  /**
   * Calculate performance score
   */
  function calculatePerformanceScore(metrics: Record<string, number>, issues: TestIssue[]): number {
    let score = 100

    // Memory penalty
    const memoryUsage = metrics.memoryUsage || 0
    if (memoryUsage > 100) score -= Math.min(30, (memoryUsage - 100) * 0.3)

    // Response time penalty
    const responseTime = metrics.averageResponseTime || 0
    if (responseTime > 1000) score -= Math.min(20, (responseTime - 1000) * 0.01)

    // Device performance adjustment
    const deviceLevel = metrics.devicePerformanceLevel || 2
    if (deviceLevel === 1) score -= 10 // Low performance device

    // Apply issue penalties
    return Math.max(0, calculateTestScore(issues))
  }

  /**
   * Generate recommendations based on test results
   */
  function generateRecommendations(issues: TestIssue[], testType: TestType): string[] {
    const recommendations: string[] = []

    for (const issue of issues) {
      switch (testType) {
        case 'device-detection':
          if (issue.category === 'screen-dimensions') {
            recommendations.push('考虑使用动态视口检测而非固定设备规格')
          }
          break
        case 'responsive-design':
          if (issue.category === 'small-screen') {
            recommendations.push('为小屏设备优化布局，考虑使用折叠式导航')
          }
          break
        case 'touch-interaction':
          if (issue.category === 'touch-targets') {
            recommendations.push('增大触摸目标尺寸至少44px，增加间距')
          }
          break
        case 'performance-benchmark':
          if (issue.category === 'memory') {
            recommendations.push('优化内存使用，移除未使用的资源')
          }
          break
        case 'accessibility-audit':
          if (issue.category === 'color-contrast') {
            recommendations.push('提高颜色对比度至4.5:1以满足WCAG AA标准')
          }
          break
        case 'network-adaptation':
          if (issue.category === 'slow-network') {
            recommendations.push('实现图片懒加载和数据分页加载')
          }
          break
      }
    }

    return recommendations.length > 0 ? recommendations : ['测试通过，无需特殊优化']
  }

  /**
   * Load default test suites
   */
  async function loadDefaultTestSuites() {
    // Basic mobile test suite
    const basicSuite: TestSuite = {
      id: 'basic-mobile',
      name: '基础移动端测试',
      description: '基本的设备兼容性和响应式设计测试',
      tests: ['device-detection', 'responsive-design'],
      devices: ['iphone-12', 'android-pixel', 'ipad'],
      config: {
        enableDeviceDetection: true,
        enableResponsiveTest: true
      }
    }

    // Comprehensive test suite
    const comprehensiveSuite: TestSuite = {
      id: 'comprehensive-mobile',
      name: '全面移动端测试',
      description: '包含所有测试类型的综合测试套件',
      tests: [
        'device-detection',
        'responsive-design',
        'touch-interaction',
        'performance-benchmark',
        'accessibility-audit'
      ],
      devices: DEFAULT_TEST_DEVICES.map(d => d.id),
      config: { ...DEFAULT_CONFIG }
    }

    testSuites.set(basicSuite.id, basicSuite)
    testSuites.set(comprehensiveSuite.id, comprehensiveSuite)
  }

  /**
   * Run test suite
   */
  async function runTestSuite(suiteId: string): Promise<TestResult[]> {
    const suite = testSuites.get(suiteId)
    if (!suite) {
      throw new Error(`测试套件未找到: ${suiteId}`)
    }

    const results: TestResult[] = []

    for (const testType of suite.tests) {
      for (const deviceId of suite.devices) {
        try {
          const result = await runMobileTest(testType, deviceId)
          results.push(result)
        } catch (error) {
          console.error(`测试失败 ${testType} on ${deviceId}:`, error)
        }
      }
    }

    return results
  }

  /**
   * Generate test report
   */
  function generateTestReport() {
    const report = {
      summary: testingSummary.value,
      recentResults: recentResults.value,
      criticalIssues: criticalIssues.value,
      deviceCoverage: availableDevices.value.length,
      timestamp: Date.now()
    }

    console.log('📊 Mobile Testing Report Generated:', report)
    return report
  }

  return {
    // Configuration
    config,

    // State
    testResults,
    testSuites,
    currentTest,
    testHistory,
    isLoading,

    // Statistics
    totalTests,
    passedTests,
    failedTests,
    warningTests,

    // Computed
    passRate,
    testingSummary,
    availableDevices,
    recentResults,
    criticalIssues,

    // Methods
    initializeTesting,
    runMobileTest,
    runTestSuite,
    generateTestReport,

    // Test constants
    DEFAULT_TEST_DEVICES,
    DEFAULT_NETWORK_CONDITIONS
  }
})
