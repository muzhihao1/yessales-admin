/**
 * Responsive Testing Utilities
 *
 * Provides tools for testing responsive design across different screen sizes,
 * orientations, and device types in Uniapp applications.
 */

import { computed, nextTick, reactive, ref } from 'vue'
import { type DeviceInfo as _DeviceInfo, useDeviceDetection } from './device-detection'

/**
 * Responsive breakpoint definition
 */
export interface ResponsiveBreakpoint {
  name: string
  minWidth: number
  maxWidth: number
  description: string
  targetDevices: string[]
}

/**
 * Responsive test configuration
 */
export interface ResponsiveTestConfig {
  breakpoints: ResponsiveBreakpoint[]
  testOrientations: ('portrait' | 'landscape')[]
  testZoomLevels: number[]
  enableAnimationTesting: boolean
  enableScrollTesting: boolean
  enableKeyboardTesting: boolean
}

/**
 * Layout test result
 */
export interface LayoutTestResult {
  breakpoint: string
  orientation: 'portrait' | 'landscape'
  zoomLevel: number
  passes: LayoutCheck[]
  failures: LayoutCheck[]
  warnings: LayoutCheck[]
  score: number
  screenshot?: string
}

/**
 * Layout check definition
 */
export interface LayoutCheck {
  id: string
  name: string
  description: string
  category: 'layout' | 'typography' | 'spacing' | 'navigation' | 'content'
  selector: string
  expectedValue: any
  actualValue: any
  status: 'pass' | 'fail' | 'warning'
  message: string
}

/**
 * Element measurement
 */
export interface ElementMeasurement {
  selector: string
  width: number
  height: number
  x: number
  y: number
  visible: boolean
  overflow: boolean
  zIndex: number
  computedStyle: Record<string, string>
}

/**
 * Viewport information
 */
export interface ViewportInfo {
  width: number
  height: number
  orientation: 'portrait' | 'landscape'
  pixelRatio: number
  safeAreaInsets: {
    top: number
    right: number
    bottom: number
    left: number
  }
}

/**
 * Default responsive breakpoints
 */
export const DEFAULT_BREAKPOINTS: ResponsiveBreakpoint[] = [
  {
    name: 'xs',
    minWidth: 0,
    maxWidth: 374,
    description: '超小屏手机',
    targetDevices: ['iPhone SE', 'Android Small']
  },
  {
    name: 'sm',
    minWidth: 375,
    maxWidth: 413,
    description: '小屏手机',
    targetDevices: ['iPhone 6/7/8', 'iPhone 12', 'Android Medium']
  },
  {
    name: 'md',
    minWidth: 414,
    maxWidth: 767,
    description: '大屏手机',
    targetDevices: ['iPhone Plus', 'iPhone Pro Max', 'Android Large']
  },
  {
    name: 'lg',
    minWidth: 768,
    maxWidth: 1023,
    description: '平板竖屏',
    targetDevices: ['iPad', 'Android Tablet']
  },
  {
    name: 'xl',
    minWidth: 1024,
    maxWidth: 1365,
    description: '平板横屏/小桌面',
    targetDevices: ['iPad Pro', 'Desktop Small']
  },
  {
    name: 'xxl',
    minWidth: 1366,
    maxWidth: 9999,
    description: '桌面端',
    targetDevices: ['Desktop Large']
  }
]

/**
 * Default test configuration
 */
const DEFAULT_CONFIG: ResponsiveTestConfig = {
  breakpoints: DEFAULT_BREAKPOINTS,
  testOrientations: ['portrait', 'landscape'],
  testZoomLevels: [1, 1.25, 1.5, 2],
  enableAnimationTesting: true,
  enableScrollTesting: true,
  enableKeyboardTesting: true
}

/**
 * Responsive testing state
 */
const config = ref<ResponsiveTestConfig>(DEFAULT_CONFIG)
const testResults = reactive<Map<string, LayoutTestResult>>(new Map())
const currentViewport = ref<ViewportInfo | null>(null)
const isTestingInProgress = ref(false)

/**
 * Get current viewport information
 */
export function getCurrentViewport(): ViewportInfo {
  const deviceDetection = useDeviceDetection()
  const info = deviceDetection.info.value

  if (!info) {
    throw new Error('设备信息未初始化')
  }

  return {
    width: info.windowWidth,
    height: info.windowHeight,
    orientation: info.windowWidth > info.windowHeight ? 'landscape' : 'portrait',
    pixelRatio: info.pixelRatio,
    safeAreaInsets: {
      top: info.safeAreaTop,
      right: (info.screenWidth || 0) - (info.safeAreaRight || 0),
      bottom: (info.screenHeight || 0) - (info.safeAreaBottom || 0),
      left: info.safeAreaLeft
    }
  }
}

/**
 * Get breakpoint for current viewport
 */
export function getCurrentBreakpoint(): ResponsiveBreakpoint | null {
  const viewport = getCurrentViewport()

  return (
    config.value.breakpoints.find(
      bp => viewport.width >= bp.minWidth && viewport.width <= bp.maxWidth
    ) || null
  )
}

/**
 * Simulate viewport size change (for testing)
 */
export async function simulateViewport(width: number, height: number): Promise<void> {
  // In a real implementation, this would use viewport manipulation APIs
  // For now, we'll simulate the viewport change

  console.log(`📱 模拟视口变更: ${width}x${height}`)

  // Update current viewport
  currentViewport.value = {
    width,
    height,
    orientation: width > height ? 'landscape' : 'portrait',
    pixelRatio: window.devicePixelRatio || 1,
    safeAreaInsets: {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0
    }
  }

  // Wait for DOM updates
  await nextTick()
}

/**
 * Measure DOM element
 */
export function measureElement(selector: string): Promise<ElementMeasurement | null> {
  // For web, use standard DOM APIs
  return new Promise(resolve => {
    const element = document.querySelector(selector)
    
    if (!element) {
      resolve(null)
      return
    }
    
    const rect = element.getBoundingClientRect()
    const computedStyle = window.getComputedStyle(element)
    
    const measurement: ElementMeasurement = {
      selector,
      width: rect.width,
      height: rect.height,
      x: rect.left,
      y: rect.top,
      visible: rect.width > 0 && rect.height > 0,
      overflow: computedStyle.overflow === 'hidden' || computedStyle.overflow === 'scroll',
      zIndex: parseInt(computedStyle.zIndex) || 0,
      computedStyle: {
        display: computedStyle.display,
        position: computedStyle.position,
        overflow: computedStyle.overflow
      }
    }
    
    resolve(measurement)
  })
}

/**
 * Test responsive layout
 */
export async function testResponsiveLayout(
  selectors: string[],
  breakpoint?: string
): Promise<LayoutTestResult> {
  const currentBp = breakpoint
    ? config.value.breakpoints.find(bp => bp.name === breakpoint)
    : getCurrentBreakpoint()

  if (!currentBp) {
    throw new Error('无法确定测试断点')
  }

  const viewport = getCurrentViewport()
  const testId = `${currentBp.name}_${viewport.orientation}_${Date.now()}`

  console.log(`🧪 开始响应式布局测试: ${currentBp.name}`)

  const passes: LayoutCheck[] = []
  const failures: LayoutCheck[] = []
  const warnings: LayoutCheck[] = []

  // Test each selector
  for (const selector of selectors) {
    const checks = await runLayoutChecks(selector, currentBp, viewport)

    for (const check of checks) {
      switch (check.status) {
        case 'pass':
          passes.push(check)
          break
        case 'fail':
          failures.push(check)
          break
        case 'warning':
          warnings.push(check)
          break
      }
    }
  }

  // Calculate score
  const totalChecks = passes.length + failures.length + warnings.length
  const score =
    totalChecks > 0 ? Math.round(((passes.length + warnings.length * 0.5) / totalChecks) * 100) : 0

  const result: LayoutTestResult = {
    breakpoint: currentBp.name,
    orientation: viewport.orientation,
    zoomLevel: 1, // Default zoom level
    passes,
    failures,
    warnings,
    score
  }

  testResults.set(testId, result)

  console.log(`✅ 响应式测试完成: ${currentBp.name}, 分数: ${score}`)
  return result
}

/**
 * Run layout checks for a specific element
 */
async function runLayoutChecks(
  selector: string,
  breakpoint: ResponsiveBreakpoint,
  viewport: ViewportInfo
): Promise<LayoutCheck[]> {
  const checks: LayoutCheck[] = []

  try {
    const measurement = await measureElement(selector)

    if (!measurement) {
      checks.push({
        id: `${selector}_exists`,
        name: '元素存在性',
        description: '检查元素是否存在于DOM中',
        category: 'layout',
        selector,
        expectedValue: true,
        actualValue: false,
        status: 'fail',
        message: '元素未找到'
      })
      return checks
    }

    // Check visibility
    checks.push({
      id: `${selector}_visible`,
      name: '元素可见性',
      description: '检查元素是否可见',
      category: 'layout',
      selector,
      expectedValue: true,
      actualValue: measurement.visible,
      status: measurement.visible ? 'pass' : 'fail',
      message: measurement.visible ? '元素可见' : '元素不可见'
    })

    // Check minimum width for touch targets
    if (selector.includes('button') || selector.includes('tap') || selector.includes('click')) {
      const minTouchTarget = 44 // 44px minimum recommended
      checks.push({
        id: `${selector}_touch_target`,
        name: '触摸目标大小',
        description: '检查触摸目标是否足够大',
        category: 'layout',
        selector,
        expectedValue: minTouchTarget,
        actualValue: Math.min(measurement.width, measurement.height),
        status: Math.min(measurement.width, measurement.height) >= minTouchTarget ? 'pass' : 'fail',
        message:
          Math.min(measurement.width, measurement.height) >= minTouchTarget
            ? '触摸目标大小合适'
            : `触摸目标过小: ${Math.min(measurement.width, measurement.height)}px`
      })
    }

    // Check element doesn't overflow viewport
    const rightEdge = measurement.x + measurement.width
    const bottomEdge = measurement.y + measurement.height

    checks.push({
      id: `${selector}_viewport_fit`,
      name: '视口适配',
      description: '检查元素是否适配当前视口',
      category: 'layout',
      selector,
      expectedValue: 'within_viewport',
      actualValue:
        rightEdge <= viewport.width && bottomEdge <= viewport.height
          ? 'within_viewport'
          : 'overflow',
      status: rightEdge <= viewport.width && bottomEdge <= viewport.height ? 'pass' : 'warning',
      message:
        rightEdge <= viewport.width && bottomEdge <= viewport.height
          ? '元素适配视口'
          : '元素可能溢出视口'
    })

    // Responsive behavior checks based on breakpoint
    if (breakpoint.name === 'xs' || breakpoint.name === 'sm') {
      // Small screen specific checks
      if (measurement.width > viewport.width * 0.9) {
        checks.push({
          id: `${selector}_small_screen_width`,
          name: '小屏宽度适配',
          description: '检查元素在小屏上的宽度适配',
          category: 'layout',
          selector,
          expectedValue: 'responsive_width',
          actualValue: 'too_wide',
          status: 'warning',
          message: '元素在小屏上可能过宽'
        })
      }
    }

    if (breakpoint.name === 'lg' || breakpoint.name === 'xl') {
      // Large screen specific checks
      if (measurement.width < viewport.width * 0.3) {
        checks.push({
          id: `${selector}_large_screen_utilization`,
          name: '大屏空间利用',
          description: '检查元素是否充分利用大屏空间',
          category: 'layout',
          selector,
          expectedValue: 'good_utilization',
          actualValue: 'underutilized',
          status: 'warning',
          message: '元素可以更好地利用大屏空间'
        })
      }
    }
  } catch (error) {
    checks.push({
      id: `${selector}_measurement_error`,
      name: '测量错误',
      description: '元素测量过程中发生错误',
      category: 'layout',
      selector,
      expectedValue: 'success',
      actualValue: 'error',
      status: 'fail',
      message: error instanceof Error ? error.message : '未知错误'
    })
  }

  return checks
}

/**
 * Test orientation changes
 */
export async function testOrientationChange(): Promise<LayoutTestResult[]> {
  const results: LayoutTestResult[] = []
  const selectors = [
    '.main-container',
    '.navigation',
    '.content',
    '.sidebar',
    'button',
    '.form-input'
  ]

  for (const orientation of config.value.testOrientations) {
    console.log(`🔄 测试方向: ${orientation}`)

    // Simulate orientation change
    const viewport = getCurrentViewport()
    const newWidth =
      orientation === 'landscape'
        ? Math.max(viewport.width, viewport.height)
        : Math.min(viewport.width, viewport.height)
    const newHeight =
      orientation === 'landscape'
        ? Math.min(viewport.width, viewport.height)
        : Math.max(viewport.width, viewport.height)

    await simulateViewport(newWidth, newHeight)

    // Run layout tests
    const result = await testResponsiveLayout(selectors)
    results.push(result)
  }

  return results
}

/**
 * Test breakpoint transitions
 */
export async function testBreakpointTransitions(): Promise<LayoutTestResult[]> {
  const results: LayoutTestResult[] = []
  const selectors = [
    '.main-container',
    '.grid-container',
    '.flex-container',
    '.navigation',
    '.sidebar'
  ]

  for (const breakpoint of config.value.breakpoints) {
    console.log(`📏 测试断点: ${breakpoint.name}`)

    // Test at breakpoint boundary
    const testWidth = breakpoint.minWidth + 10
    const testHeight = 800 // Standard height for testing

    await simulateViewport(testWidth, testHeight)

    const result = await testResponsiveLayout(selectors, breakpoint.name)
    results.push(result)
  }

  return results
}

/**
 * Test text scaling
 */
export async function testTextScaling(): Promise<LayoutCheck[]> {
  const checks: LayoutCheck[] = []
  const textSelectors = ['text', '.title', '.subtitle', '.body-text', '.caption', 'button text']

  for (const selector of textSelectors) {
    const measurement = await measureElement(selector)

    if (measurement) {
      // Check if text is readable on current device
      const viewport = getCurrentViewport()
      const devicePixelRatio = viewport.pixelRatio

      // Estimate font size based on element height (rough approximation)
      const estimatedFontSize = measurement.height * 0.7
      const physicalFontSize = estimatedFontSize / devicePixelRatio

      checks.push({
        id: `${selector}_readability`,
        name: '文本可读性',
        description: '检查文本在当前设备上的可读性',
        category: 'typography',
        selector,
        expectedValue: 16, // Minimum recommended font size
        actualValue: physicalFontSize,
        status: physicalFontSize >= 16 ? 'pass' : physicalFontSize >= 14 ? 'warning' : 'fail',
        message:
          physicalFontSize >= 16 ? '文本大小合适' : `文本可能过小: ${physicalFontSize.toFixed(1)}px`
      })
    }
  }

  return checks
}

/**
 * Generate responsive test report
 */
export function generateResponsiveReport(): {
  summary: {
    totalTests: number
    passRate: number
    avgScore: number
    breakpointCoverage: number
  }
  breakpointResults: Array<{
    breakpoint: string
    score: number
    status: 'pass' | 'fail' | 'warning'
  }>
  commonIssues: Array<{
    issue: string
    frequency: number
    severity: 'error' | 'warning' | 'info'
  }>
  recommendations: string[]
} {
  const results = Array.from(testResults.values())

  if (results.length === 0) {
    return {
      summary: {
        totalTests: 0,
        passRate: 0,
        avgScore: 0,
        breakpointCoverage: 0
      },
      breakpointResults: [],
      commonIssues: [],
      recommendations: ['请先运行响应式测试']
    }
  }

  const totalTests = results.length
  const passCount = results.filter(r => r.score >= 80).length
  const passRate = Math.round((passCount / totalTests) * 100)
  const avgScore = Math.round(results.reduce((sum, r) => sum + r.score, 0) / totalTests)

  const testedBreakpoints = new Set(results.map(r => r.breakpoint))
  const breakpointCoverage = Math.round(
    (testedBreakpoints.size / config.value.breakpoints.length) * 100
  )

  const breakpointResults = config.value.breakpoints.map(bp => {
    const bpResults = results.filter(r => r.breakpoint === bp.name)
    const bpScore =
      bpResults.length > 0
        ? Math.round(bpResults.reduce((sum, r) => sum + r.score, 0) / bpResults.length)
        : 0

    return {
      breakpoint: bp.name,
      score: bpScore,
      status:
        bpScore >= 80 ? ('pass' as const) : bpScore >= 60 ? ('warning' as const) : ('fail' as const)
    }
  })

  // Analyze common issues
  const allIssues = results.flatMap(r => [...r.failures, ...r.warnings])
  const issueFrequency = new Map<string, number>()

  allIssues.forEach(issue => {
    const key = issue.name
    issueFrequency.set(key, (issueFrequency.get(key) || 0) + 1)
  })

  const commonIssues = Array.from(issueFrequency.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([issue, frequency]) => ({
      issue,
      frequency,
      severity:
        frequency > totalTests * 0.5
          ? ('error' as const)
          : frequency > totalTests * 0.25
            ? ('warning' as const)
            : ('info' as const)
    }))

  // Generate recommendations
  const recommendations: string[] = []

  if (passRate < 80) {
    recommendations.push('响应式设计需要改进，建议优化布局适配')
  }

  if (breakpointCoverage < 80) {
    recommendations.push('增加更多断点的测试覆盖，确保全设备兼容')
  }

  commonIssues.forEach(issue => {
    if (issue.issue.includes('触摸目标')) {
      recommendations.push('增大触摸目标尺寸至少44px')
    }
    if (issue.issue.includes('视口')) {
      recommendations.push('检查元素溢出，优化视口适配')
    }
    if (issue.issue.includes('文本')) {
      recommendations.push('优化文本大小和可读性')
    }
  })

  if (recommendations.length === 0) {
    recommendations.push('响应式设计表现良好，继续保持')
  }

  return {
    summary: {
      totalTests,
      passRate,
      avgScore,
      breakpointCoverage
    },
    breakpointResults,
    commonIssues,
    recommendations
  }
}

/**
 * Responsive testing composable
 */
export function useResponsiveTesting() {
  const currentBp = computed(() => getCurrentBreakpoint())
  const viewport = computed(() => getCurrentViewport())
  const testInProgress = computed(() => isTestingInProgress.value)

  async function runFullResponsiveTest(
    selectors: string[] = ['.main-container', '.navigation', '.content', 'button', '.form-input']
  ): Promise<LayoutTestResult[]> {
    isTestingInProgress.value = true
    const results: LayoutTestResult[] = []

    try {
      console.log('🧪 开始全面响应式测试...')

      // Test current breakpoint
      const currentResult = await testResponsiveLayout(selectors)
      results.push(currentResult)

      // Test breakpoint transitions
      const transitionResults = await testBreakpointTransitions()
      results.push(...transitionResults)

      // Test orientation changes
      const orientationResults = await testOrientationChange()
      results.push(...orientationResults)

      console.log('✅ 响应式测试完成')
      return results
    } finally {
      isTestingInProgress.value = false
    }
  }

  return {
    // State
    config,
    testResults,
    currentViewport,
    testInProgress,

    // Computed
    currentBp,
    viewport,

    // Methods
    getCurrentBreakpoint,
    getCurrentViewport,
    simulateViewport,
    measureElement,
    testResponsiveLayout,
    testBreakpointTransitions,
    testOrientationChange,
    testTextScaling,
    generateResponsiveReport,
    runFullResponsiveTest,

    // Constants
    DEFAULT_BREAKPOINTS
  }
}
