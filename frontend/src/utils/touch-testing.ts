/**
 * Touch Testing Utilities
 *
 * Provides comprehensive touch interaction testing for mobile applications,
 * including gesture recognition, touch target validation, and accessibility testing.
 */

import { computed, reactive, ref } from 'vue'
import { useDeviceDetection } from './device-detection'

/**
 * Touch event types
 */
export type TouchEventType = 'tap' | 'doubletap' | 'press' | 'swipe' | 'pinch' | 'rotate' | 'pan'

/**
 * Touch gesture configuration
 */
export interface TouchGestureConfig {
  // Timing thresholds
  tapMaxDuration: number // ms
  pressMinDuration: number // ms
  doubleTapMaxInterval: number // ms

  // Distance thresholds
  tapMaxDistance: number // px
  swipeMinDistance: number // px
  panMinDistance: number // px

  // Multi-touch thresholds
  pinchMinScale: number
  rotateMinAngle: number // degrees

  // Touch target requirements
  minTouchTargetSize: number // px
  minTouchTargetSpacing: number // px
}

/**
 * Touch point information
 */
export interface TouchPoint {
  x: number
  y: number
  timestamp: number
  pressure?: number
  identifier: number
}

/**
 * Touch gesture event
 */
export interface TouchGestureEvent {
  type: TouchEventType
  startPoint: TouchPoint
  currentPoint: TouchPoint
  endPoint?: TouchPoint
  duration: number
  distance: number
  velocity: number
  direction?: 'up' | 'down' | 'left' | 'right'
  scale?: number // For pinch gestures
  rotation?: number // For rotation gestures
  isValid: boolean
}

/**
 * Touch target test result
 */
export interface TouchTargetTest {
  selector: string
  element: {
    width: number
    height: number
    x: number
    y: number
  }
  minSize: number
  actualSize: number
  hasAdequateSpacing: boolean
  isAccessible: boolean
  status: 'pass' | 'fail' | 'warning'
  issues: string[]
  recommendations: string[]
}

/**
 * Touch interaction test result
 */
export interface TouchInteractionTest {
  gestureType: TouchEventType
  target: string
  success: boolean
  responseTime: number // ms
  accuracy: number // 0-100 score
  issues: TouchIssue[]
  metrics: TouchMetrics
}

/**
 * Touch issue
 */
export interface TouchIssue {
  severity: 'error' | 'warning' | 'info'
  category: 'target_size' | 'spacing' | 'responsiveness' | 'accessibility' | 'gesture'
  message: string
  element?: string
  recommendation: string
}

/**
 * Touch metrics
 */
export interface TouchMetrics {
  touchLatency: number // ms
  gestureRecognitionTime: number // ms
  falsePositiveRate: number // 0-1
  falseNegativeRate: number // 0-1
  accuracyScore: number // 0-100
}

/**
 * Touch testing configuration
 */
export interface TouchTestConfig {
  gestures: TouchGestureConfig
  enableAccessibilityTesting: boolean
  enablePerformanceTesting: boolean
  enableGestureRecognition: boolean
  testSelectors: string[]
  simulationDelay: number // ms between simulated touches
}

/**
 * Default touch gesture configuration
 */
const DEFAULT_GESTURE_CONFIG: TouchGestureConfig = {
  tapMaxDuration: 200,
  pressMinDuration: 500,
  doubleTapMaxInterval: 300,

  tapMaxDistance: 10,
  swipeMinDistance: 30,
  panMinDistance: 10,

  pinchMinScale: 0.1,
  rotateMinAngle: 15,

  minTouchTargetSize: 44,
  minTouchTargetSpacing: 8
}

/**
 * Default touch testing configuration
 */
const DEFAULT_TOUCH_CONFIG: TouchTestConfig = {
  gestures: DEFAULT_GESTURE_CONFIG,
  enableAccessibilityTesting: true,
  enablePerformanceTesting: true,
  enableGestureRecognition: true,
  testSelectors: [
    'button',
    '.tap-target',
    '.clickable',
    '.touch-area',
    'input',
    'textarea',
    'select',
    '.card',
    '.list-item',
    '.navigation-item'
  ],
  simulationDelay: 100
}

/**
 * Touch testing state
 */
const config = ref<TouchTestConfig>(DEFAULT_TOUCH_CONFIG)
const activeGestures = reactive<Map<number, TouchGestureEvent>>(new Map())
const testResults = reactive<TouchInteractionTest[]>([])
const touchTargetResults = reactive<TouchTargetTest[]>([])
const isTestingActive = ref(false)
const currentTouchPoints = reactive<Map<number, TouchPoint>>(new Map())

/**
 * Touch gesture recognizer
 */
class TouchGestureRecognizer {
  private startTouches = new Map<number, TouchPoint>()
  private currentTouches = new Map<number, TouchPoint>()
  private gestureStartTime = 0

  /**
   * Start gesture recognition
   */
  startGesture(touches: TouchPoint[]): void {
    this.gestureStartTime = Date.now()
    this.startTouches.clear()
    this.currentTouches.clear()

    touches.forEach(touch => {
      this.startTouches.set(touch.identifier, touch)
      this.currentTouches.set(touch.identifier, touch)
    })
  }

  /**
   * Update gesture state
   */
  updateGesture(touches: TouchPoint[]): void {
    this.currentTouches.clear()
    touches.forEach(touch => {
      this.currentTouches.set(touch.identifier, touch)
    })
  }

  /**
   * End gesture and get result
   */
  endGesture(): TouchGestureEvent | null {
    if (this.startTouches.size === 0) return null

    const duration = Date.now() - this.gestureStartTime
    const startTouch = Array.from(this.startTouches.values())[0]
    const endTouch = Array.from(this.currentTouches.values())[0] || startTouch

    const distance = this.calculateDistance(startTouch, endTouch)
    const velocity = duration > 0 ? distance / duration : 0
    const direction = this.calculateDirection(startTouch, endTouch)

    // Recognize gesture type
    const gestureType = this.recognizeGestureType(
      this.startTouches.size,
      duration,
      distance,
      velocity
    )

    return {
      type: gestureType,
      startPoint: startTouch,
      currentPoint: endTouch,
      endPoint: endTouch,
      duration,
      distance,
      velocity,
      direction,
      isValid: this.validateGesture(gestureType, duration, distance)
    }
  }

  /**
   * Calculate distance between two points
   */
  private calculateDistance(point1: TouchPoint, point2: TouchPoint): number {
    const dx = point2.x - point1.x
    const dy = point2.y - point1.y
    return Math.sqrt(dx * dx + dy * dy)
  }

  /**
   * Calculate direction between two points
   */
  private calculateDirection(start: TouchPoint, end: TouchPoint): 'up' | 'down' | 'left' | 'right' {
    const dx = end.x - start.x
    const dy = end.y - start.y

    if (Math.abs(dx) > Math.abs(dy)) {
      return dx > 0 ? 'right' : 'left'
    } else {
      return dy > 0 ? 'down' : 'up'
    }
  }

  /**
   * Recognize gesture type based on characteristics
   */
  private recognizeGestureType(
    touchCount: number,
    duration: number,
    distance: number,
    velocity: number
  ): TouchEventType {
    if (touchCount > 1) {
      return 'pinch' // Simplified - could be pinch, rotate, etc.
    }

    if (
      duration < config.value.gestures.tapMaxDuration &&
      distance < config.value.gestures.tapMaxDistance
    ) {
      return 'tap'
    }

    if (duration >= config.value.gestures.pressMinDuration) {
      return 'press'
    }

    if (distance >= config.value.gestures.swipeMinDistance && velocity > 0.5) {
      return 'swipe'
    }

    if (distance >= config.value.gestures.panMinDistance) {
      return 'pan'
    }

    return 'tap' // Default fallback
  }

  /**
   * Validate gesture against configuration
   */
  private validateGesture(type: TouchEventType, duration: number, distance: number): boolean {
    const cfg = config.value.gestures

    switch (type) {
      case 'tap':
        return duration <= cfg.tapMaxDuration && distance <= cfg.tapMaxDistance
      case 'press':
        return duration >= cfg.pressMinDuration
      case 'swipe':
        return distance >= cfg.swipeMinDistance
      case 'pan':
        return distance >= cfg.panMinDistance
      default:
        return true
    }
  }
}

const gestureRecognizer = new TouchGestureRecognizer()

/**
 * Test touch targets on the page
 */
export async function testTouchTargets(): Promise<TouchTargetTest[]> {
  console.log('🔍 开始触摸目标测试...')

  const results: TouchTargetTest[] = []
  const selectors = config.value.testSelectors

  for (const selector of selectors) {
    try {
      const elements = await queryElements(selector)

      for (const element of elements) {
        const test = await analyzeTouchTarget(selector, element)
        results.push(test)
      }
    } catch (error) {
      console.warn(`Failed to test selector ${selector}:`, error)
    }
  }

  touchTargetResults.length = 0
  touchTargetResults.push(...results)

  console.log(`✅ 触摸目标测试完成，测试了 ${results.length} 个元素`)
  return results
}

/**
 * Query elements using Uniapp selector API
 */
async function queryElements(selector: string): Promise<any[]> {
  return new Promise(resolve => {
    const query = uni.createSelectorQuery()

    query
      .selectAll(selector)
      .boundingClientRect(rects => {
        resolve(Array.isArray(rects) ? rects : [])
      })
      .exec()
  })
}

/**
 * Analyze a single touch target
 */
async function analyzeTouchTarget(selector: string, element: any): Promise<TouchTargetTest> {
  const issues: string[] = []
  const recommendations: string[] = []

  const width = element.width || 0
  const height = element.height || 0
  const x = element.left || 0
  const y = element.top || 0

  const minSize = config.value.gestures.minTouchTargetSize
  const actualSize = Math.min(width, height)

  // Check minimum size
  if (actualSize < minSize) {
    issues.push(`触摸目标过小: ${actualSize}px < ${minSize}px`)
    recommendations.push(`增大触摸目标至至少 ${minSize}px`)
  }

  // Check spacing (simplified - would need to check nearby elements)
  const hasAdequateSpacing = true // Placeholder - would need complex logic

  // Accessibility checks
  const isAccessible = width >= 44 && height >= 44 // iOS guideline

  if (!isAccessible) {
    issues.push('不符合iOS辅助功能指南（最小44pt）')
    recommendations.push('增大触摸目标至44pt以符合辅助功能要求')
  }

  const status: 'pass' | 'fail' | 'warning' =
    actualSize >= minSize && isAccessible
      ? 'pass'
      : actualSize >= minSize * 0.8
        ? 'warning'
        : 'fail'

  return {
    selector,
    element: { width, height, x, y },
    minSize,
    actualSize,
    hasAdequateSpacing,
    isAccessible,
    status,
    issues,
    recommendations
  }
}

/**
 * Simulate touch gesture
 */
export async function simulateTouchGesture(
  selector: string,
  gestureType: TouchEventType,
  options: {
    duration?: number
    distance?: number
    direction?: 'up' | 'down' | 'left' | 'right'
    startPoint?: { x: number; y: number }
  } = {}
): Promise<TouchInteractionTest> {
  console.log(`👆 模拟触摸手势: ${gestureType} on ${selector}`)

  const startTime = Date.now()
  const issues: TouchIssue[] = []

  try {
    // Get element position
    const element = await queryElements(selector)
    if (element.length === 0) {
      issues.push({
        severity: 'error',
        category: 'target_size',
        message: '目标元素未找到',
        element: selector,
        recommendation: '检查选择器是否正确'
      })

      throw new Error(`Element not found: ${selector}`)
    }

    const targetElement = element[0]
    const centerX = targetElement.left + targetElement.width / 2
    const centerY = targetElement.top + targetElement.height / 2

    // Create touch points
    const startPoint: TouchPoint = {
      x: options.startPoint?.x || centerX,
      y: options.startPoint?.y || centerY,
      timestamp: Date.now(),
      identifier: 0
    }

    // Simulate gesture based on type
    const gestureResult = await executeGestureSimulation(gestureType, startPoint, options)

    const responseTime = Date.now() - startTime
    const accuracy = calculateGestureAccuracy(gestureType, gestureResult)

    // Performance metrics
    const metrics: TouchMetrics = {
      touchLatency: responseTime,
      gestureRecognitionTime: gestureResult.duration,
      falsePositiveRate: 0, // Would need real testing data
      falseNegativeRate: 0, // Would need real testing data
      accuracyScore: accuracy
    }

    // Check for common issues
    if (responseTime > 100) {
      issues.push({
        severity: 'warning',
        category: 'responsiveness',
        message: `触摸响应较慢: ${responseTime}ms`,
        recommendation: '优化事件处理性能'
      })
    }

    if (accuracy < 80) {
      issues.push({
        severity: 'warning',
        category: 'gesture',
        message: `手势识别准确率较低: ${accuracy}%`,
        recommendation: '调整手势识别参数'
      })
    }

    const test: TouchInteractionTest = {
      gestureType,
      target: selector,
      success: gestureResult.isValid && issues.filter(i => i.severity === 'error').length === 0,
      responseTime,
      accuracy,
      issues,
      metrics
    }

    testResults.push(test)
    return test
  } catch (error) {
    const test: TouchInteractionTest = {
      gestureType,
      target: selector,
      success: false,
      responseTime: Date.now() - startTime,
      accuracy: 0,
      issues: [
        {
          severity: 'error',
          category: 'gesture',
          message: error instanceof Error ? error.message : '未知错误',
          recommendation: '检查元素是否存在且可交互'
        }
      ],
      metrics: {
        touchLatency: 0,
        gestureRecognitionTime: 0,
        falsePositiveRate: 1,
        falseNegativeRate: 0,
        accuracyScore: 0
      }
    }

    testResults.push(test)
    return test
  }
}

/**
 * Execute gesture simulation
 */
async function executeGestureSimulation(
  gestureType: TouchEventType,
  startPoint: TouchPoint,
  options: any
): Promise<TouchGestureEvent> {
  const duration = options.duration || getDefaultDuration(gestureType)
  const distance = options.distance || getDefaultDistance(gestureType)
  const direction = options.direction || 'right'

  // Calculate end point based on gesture type
  let endPoint: TouchPoint = { ...startPoint }

  switch (gestureType) {
    case 'tap':
      endPoint = { ...startPoint, timestamp: startPoint.timestamp + duration }
      break

    case 'swipe':
    case 'pan':
      const deltaX = direction === 'left' ? -distance : direction === 'right' ? distance : 0
      const deltaY = direction === 'up' ? -distance : direction === 'down' ? distance : 0

      endPoint = {
        x: startPoint.x + deltaX,
        y: startPoint.y + deltaY,
        timestamp: startPoint.timestamp + duration,
        identifier: startPoint.identifier
      }
      break

    case 'press':
      endPoint = { ...startPoint, timestamp: startPoint.timestamp + duration }
      break
  }

  // Simulate the gesture
  gestureRecognizer.startGesture([startPoint])

  // Simulate intermediate points for complex gestures
  if (gestureType === 'swipe' || gestureType === 'pan') {
    await simulateIntermediatePoints(startPoint, endPoint, duration)
  } else {
    // Simple delay for taps and presses
    await new Promise(resolve => setTimeout(resolve, duration))
  }

  gestureRecognizer.updateGesture([endPoint])
  const result = gestureRecognizer.endGesture()

  return (
    result || {
      type: gestureType,
      startPoint,
      currentPoint: endPoint,
      endPoint,
      duration,
      distance: calculatePointDistance(startPoint, endPoint),
      velocity: duration > 0 ? distance / duration : 0,
      direction,
      isValid: true
    }
  )
}

/**
 * Simulate intermediate points for smooth gestures
 */
async function simulateIntermediatePoints(
  start: TouchPoint,
  end: TouchPoint,
  totalDuration: number
): Promise<void> {
  const steps = Math.max(3, Math.floor(totalDuration / 50)) // ~50ms per step
  const stepDuration = totalDuration / steps

  for (let i = 1; i <= steps; i++) {
    const progress = i / steps
    const currentPoint: TouchPoint = {
      x: start.x + (end.x - start.x) * progress,
      y: start.y + (end.y - start.y) * progress,
      timestamp: start.timestamp + stepDuration * i,
      identifier: start.identifier
    }

    gestureRecognizer.updateGesture([currentPoint])
    await new Promise(resolve => setTimeout(resolve, stepDuration))
  }
}

/**
 * Get default duration for gesture type
 */
function getDefaultDuration(gestureType: TouchEventType): number {
  switch (gestureType) {
    case 'tap':
      return 100
    case 'doubletap':
      return 200
    case 'press':
      return 800
    case 'swipe':
      return 300
    case 'pan':
      return 500
    case 'pinch':
      return 600
    case 'rotate':
      return 600
    default:
      return 200
  }
}

/**
 * Get default distance for gesture type
 */
function getDefaultDistance(gestureType: TouchEventType): number {
  switch (gestureType) {
    case 'tap':
      return 0
    case 'press':
      return 0
    case 'swipe':
      return 100
    case 'pan':
      return 50
    default:
      return 0
  }
}

/**
 * Calculate distance between two points
 */
function calculatePointDistance(point1: TouchPoint, point2: TouchPoint): number {
  const dx = point2.x - point1.x
  const dy = point2.y - point1.y
  return Math.sqrt(dx * dx + dy * dy)
}

/**
 * Calculate gesture accuracy
 */
function calculateGestureAccuracy(
  expectedType: TouchEventType,
  actualGesture: TouchGestureEvent
): number {
  if (actualGesture.type === expectedType && actualGesture.isValid) {
    return 100
  }

  // Partial credit for similar gestures
  const similarGestures: Record<TouchEventType, TouchEventType[]> = {
    tap: ['press'],
    press: ['tap'],
    swipe: ['pan'],
    pan: ['swipe'],
    pinch: ['rotate'],
    rotate: ['pinch'],
    doubletap: ['tap']
  }

  const similar = similarGestures[expectedType] || []
  if (similar.includes(actualGesture.type)) {
    return 60
  }

  return actualGesture.isValid ? 30 : 0
}

/**
 * Run comprehensive touch tests
 */
export async function runComprehensiveTouchTests(): Promise<{
  touchTargets: TouchTargetTest[]
  interactions: TouchInteractionTest[]
  summary: {
    totalTests: number
    passedTests: number
    failedTests: number
    passRate: number
    avgAccuracy: number
  }
}> {
  console.log('🧪 开始综合触摸测试...')

  isTestingActive.value = true

  try {
    // Test touch targets
    const touchTargets = await testTouchTargets()

    // Test basic interactions
    const interactions: TouchInteractionTest[] = []
    const basicSelectors = ['button', '.tap-target', '.clickable']

    for (const selector of basicSelectors) {
      for (const gestureType of ['tap', 'press', 'swipe'] as TouchEventType[]) {
        try {
          const result = await simulateTouchGesture(selector, gestureType)
          interactions.push(result)

          // Add delay between tests
          await new Promise(resolve => setTimeout(resolve, config.value.simulationDelay))
        } catch (error) {
          console.warn(`Touch test failed: ${gestureType} on ${selector}`, error)
        }
      }
    }

    // Calculate summary
    const totalTests = touchTargets.length + interactions.length
    const passedTargets = touchTargets.filter(t => t.status === 'pass').length
    const passedInteractions = interactions.filter(i => i.success).length
    const passedTests = passedTargets + passedInteractions

    const passRate = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0
    const avgAccuracy =
      interactions.length > 0
        ? Math.round(interactions.reduce((sum, i) => sum + i.accuracy, 0) / interactions.length)
        : 0

    const summary = {
      totalTests,
      passedTests,
      failedTests: totalTests - passedTests,
      passRate,
      avgAccuracy
    }

    console.log('✅ 综合触摸测试完成:', summary)

    return {
      touchTargets,
      interactions,
      summary
    }
  } finally {
    isTestingActive.value = false
  }
}

/**
 * Generate touch test report
 */
export function generateTouchTestReport(): {
  targetAnalysis: {
    totalTargets: number
    passedTargets: number
    avgSize: number
    commonIssues: string[]
  }
  interactionAnalysis: {
    totalInteractions: number
    successRate: number
    avgResponseTime: number
    mostAccurateGesture: TouchEventType | null
    leastAccurateGesture: TouchEventType | null
  }
  recommendations: string[]
  accessibilityScore: number
} {
  const targets = touchTargetResults
  const interactions = testResults

  // Target analysis
  const passedTargets = targets.filter(t => t.status === 'pass').length
  const avgSize =
    targets.length > 0
      ? Math.round(targets.reduce((sum, t) => sum + t.actualSize, 0) / targets.length)
      : 0

  const allIssues = targets.flatMap(t => t.issues)
  const issueFrequency = new Map<string, number>()
  allIssues.forEach(issue => {
    issueFrequency.set(issue, (issueFrequency.get(issue) || 0) + 1)
  })
  const commonIssues = Array.from(issueFrequency.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([issue]) => issue)

  // Interaction analysis
  const successfulInteractions = interactions.filter(i => i.success).length
  const successRate =
    interactions.length > 0 ? Math.round((successfulInteractions / interactions.length) * 100) : 0

  const avgResponseTime =
    interactions.length > 0
      ? Math.round(interactions.reduce((sum, i) => sum + i.responseTime, 0) / interactions.length)
      : 0

  // Find most/least accurate gestures
  const gestureAccuracy = new Map<TouchEventType, number[]>()
  interactions.forEach(i => {
    if (!gestureAccuracy.has(i.gestureType)) {
      gestureAccuracy.set(i.gestureType, [])
    }
    gestureAccuracy.get(i.gestureType)!.push(i.accuracy)
  })

  let mostAccurateGesture: TouchEventType | null = null
  let leastAccurateGesture: TouchEventType | null = null
  let maxAccuracy = -1
  let minAccuracy = 101

  gestureAccuracy.forEach((accuracies, gesture) => {
    const avgAccuracy = accuracies.reduce((sum, acc) => sum + acc, 0) / accuracies.length
    if (avgAccuracy > maxAccuracy) {
      maxAccuracy = avgAccuracy
      mostAccurateGesture = gesture
    }
    if (avgAccuracy < minAccuracy) {
      minAccuracy = avgAccuracy
      leastAccurateGesture = gesture
    }
  })

  // Generate recommendations
  const recommendations: string[] = []

  if (passedTargets / targets.length < 0.8) {
    recommendations.push('大部分触摸目标过小，建议增大至44px以上')
  }

  if (successRate < 80) {
    recommendations.push('触摸交互成功率较低，检查事件处理逻辑')
  }

  if (avgResponseTime > 100) {
    recommendations.push('触摸响应时间较长，优化性能')
  }

  if (commonIssues.length > 0) {
    recommendations.push(`解决常见问题: ${commonIssues[0]}`)
  }

  if (recommendations.length === 0) {
    recommendations.push('触摸交互表现良好')
  }

  // Calculate accessibility score
  const accessibleTargets = targets.filter(t => t.isAccessible).length
  const accessibilityScore =
    targets.length > 0 ? Math.round((accessibleTargets / targets.length) * 100) : 0

  return {
    targetAnalysis: {
      totalTargets: targets.length,
      passedTargets,
      avgSize,
      commonIssues
    },
    interactionAnalysis: {
      totalInteractions: interactions.length,
      successRate,
      avgResponseTime,
      mostAccurateGesture,
      leastAccurateGesture
    },
    recommendations,
    accessibilityScore
  }
}

/**
 * Touch testing composable
 */
export function useTouchTesting() {
  const deviceDetection = useDeviceDetection()

  const isSupported = computed(
    () =>
      deviceDetection.info.value?.platform === 'ios' ||
      deviceDetection.info.value?.platform === 'android'
  )

  const testingSummary = computed(() => ({
    targetsTotal: touchTargetResults.length,
    targetsPassed: touchTargetResults.filter(t => t.status === 'pass').length,
    interactionsTotal: testResults.length,
    interactionsPassed: testResults.filter(t => t.success).length
  }))

  return {
    // Configuration
    config,

    // State
    isTestingActive,
    touchTargetResults,
    testResults,
    currentTouchPoints,

    // Computed
    isSupported,
    testingSummary,

    // Methods
    testTouchTargets,
    simulateTouchGesture,
    runComprehensiveTouchTests,
    generateTouchTestReport,

    // Constants
    DEFAULT_GESTURE_CONFIG,
    DEFAULT_TOUCH_CONFIG
  }
}
