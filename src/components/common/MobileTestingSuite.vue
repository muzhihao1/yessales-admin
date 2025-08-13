<template>
  <view class="mobile-testing-suite">
    <!-- Testing Header -->
    <view class="testing-header">
      <view class="header-title">
        <text class="title">移动端适配测试套件</text>
        <view class="device-info" v-if="deviceDetection.isReady.value">
          <text class="device-name">{{ deviceInfo.name }}</text>
          <text class="device-specs">{{ deviceInfo.specs }}</text>
        </view>
      </view>

      <view class="header-actions">
        <button class="btn btn-primary" @click="runFullTest" :disabled="isTestingActive">
          <text v-if="!isTestingActive">🧪 运行完整测试</text>
          <text v-else>⏳ 测试中...</text>
        </button>
      </view>
    </view>

    <!-- Test Progress -->
    <view class="test-progress" v-if="isTestingActive">
      <view class="progress-header">
        <text class="progress-title">测试进度</text>
        <text class="progress-text">{{ currentTestStep }}</text>
      </view>
      <view class="progress-bar">
        <view class="progress-fill" :style="{ width: `${testProgress}%` }"></view>
      </view>
    </view>

    <!-- Test Categories -->
    <view class="test-categories">
      <scroll-view class="category-tabs" :scroll-x="true">
        <view
          v-for="category in testCategories"
          :key="category.id"
          class="category-tab"
          :class="{ active: activeCategory === category.id }"
          @click="setActiveCategory(category.id)"
        >
          <text class="tab-icon">{{ category.icon }}</text>
          <text class="tab-name">{{ category.name }}</text>
          <view
            v-if="category.hasResults"
            class="tab-badge"
            :class="getBadgeClass(category.status)"
          >
            <text class="badge-text">{{ category.testCount }}</text>
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- Test Content -->
    <view class="test-content">
      <!-- Device Detection Tab -->
      <view v-show="activeCategory === 'device'" class="test-panel">
        <view class="panel-header">
          <text class="panel-title">设备检测与兼容性</text>
          <button
            class="btn btn-secondary btn-sm"
            @click="runDeviceTest"
            :disabled="isTestingActive"
          >
            单独测试
          </button>
        </view>

        <view class="device-detection-results">
          <view class="info-grid">
            <view class="info-item">
              <text class="info-label">设备型号</text>
              <text class="info-value">{{ deviceDetection.info.value?.model || '未知' }}</text>
            </view>
            <view class="info-item">
              <text class="info-label">屏幕尺寸</text>
              <text class="info-value">{{ screenSize }}</text>
            </view>
            <view class="info-item">
              <text class="info-label">像素密度</text>
              <text class="info-value">{{ deviceDetection.info.value?.pixelRatio || 'N/A' }}</text>
            </view>
            <view class="info-item">
              <text class="info-label">设备类别</text>
              <text class="info-value">{{ deviceDetection.deviceCategory.value }}</text>
            </view>
            <view class="info-item">
              <text class="info-label">性能等级</text>
              <text class="info-value">{{ performanceLevel }}</text>
            </view>
            <view class="info-item">
              <text class="info-label">支持能力</text>
              <text class="info-value">{{ supportedCapabilities }}</text>
            </view>
          </view>

          <view v-if="deviceTestResults.length > 0" class="test-results">
            <view
              v-for="result in deviceTestResults"
              :key="result.id"
              class="result-item"
              :class="getResultClass(result.status)"
            >
              <view class="result-header">
                <text class="result-title">{{ getTestTypeTitle(result.testType) }}</text>
                <view class="result-badge" :class="result.status">
                  <text>{{ getStatusText(result.status) }}</text>
                </view>
              </view>
              <view class="result-metrics">
                <text v-for="(value, key) in result.details.metrics" :key="key" class="metric">
                  {{ formatMetric(String(key), value) }}
                </text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- Responsive Design Tab -->
      <view v-show="activeCategory === 'responsive'" class="test-panel">
        <view class="panel-header">
          <text class="panel-title">响应式设计测试</text>
          <button
            class="btn btn-secondary btn-sm"
            @click="runResponsiveTest"
            :disabled="isTestingActive"
          >
            单独测试
          </button>
        </view>

        <view class="responsive-controls">
          <view class="breakpoint-selector">
            <text class="selector-label">测试断点:</text>
            <picker
              :range="availableBreakpoints"
              :range-key="'name'"
              @change="onBreakpointChange"
              class="picker"
            >
              <view class="picker-display">
                {{ selectedBreakpoint?.name || '选择断点' }}
              </view>
            </picker>
          </view>

          <view class="orientation-toggle">
            <text class="toggle-label">屏幕方向:</text>
            <button
              class="btn btn-outline"
              :class="{ active: testOrientation === 'portrait' }"
              @click="testOrientation = 'portrait'"
            >
              竖屏
            </button>
            <button
              class="btn btn-outline"
              :class="{ active: testOrientation === 'landscape' }"
              @click="testOrientation = 'landscape'"
            >
              横屏
            </button>
          </view>
        </view>

        <view v-if="responsiveTestResults.length > 0" class="responsive-results">
          <view class="results-summary">
            <view class="summary-card">
              <text class="summary-title">测试覆盖</text>
              <text class="summary-value">{{ responsiveReport.summary.breakpointCoverage }}%</text>
            </view>
            <view class="summary-card">
              <text class="summary-title">通过率</text>
              <text class="summary-value">{{ responsiveReport.summary.passRate }}%</text>
            </view>
            <view class="summary-card">
              <text class="summary-title">平均分数</text>
              <text class="summary-value">{{ responsiveReport.summary.avgScore }}</text>
            </view>
          </view>

          <view class="breakpoint-results">
            <view
              v-for="result in responsiveReport.breakpointResults"
              :key="result.breakpoint"
              class="breakpoint-item"
              :class="result.status"
            >
              <text class="breakpoint-name">{{ result.breakpoint }}</text>
              <text class="breakpoint-score">{{ result.score }}</text>
              <view class="breakpoint-status" :class="result.status">
                <text>{{ getStatusText(result.status) }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- Touch Interaction Tab -->
      <view v-show="activeCategory === 'touch'" class="test-panel">
        <view class="panel-header">
          <text class="panel-title">触摸交互测试</text>
          <button
            class="btn btn-secondary btn-sm"
            @click="runTouchTest"
            :disabled="isTestingActive"
          >
            单独测试
          </button>
        </view>

        <view v-if="touchTestResults" class="touch-results">
          <!-- Touch Targets Analysis -->
          <view class="touch-section">
            <text class="section-title">触摸目标分析</text>
            <view class="touch-stats">
              <view class="stat-item">
                <text class="stat-label">总目标</text>
                <text class="stat-value">{{ touchTestResults.targetAnalysis.totalTargets }}</text>
              </view>
              <view class="stat-item">
                <text class="stat-label">合格率</text>
                <text class="stat-value">
                  {{
                    Math.round(
                      (touchTestResults.targetAnalysis.passedTargets /
                        touchTestResults.targetAnalysis.totalTargets) *
                        100
                    )
                  }}%
                </text>
              </view>
              <view class="stat-item">
                <text class="stat-label">平均尺寸</text>
                <text class="stat-value">{{ touchTestResults.targetAnalysis.avgSize }}px</text>
              </view>
            </view>

            <view
              v-if="touchTestResults.targetAnalysis.commonIssues.length > 0"
              class="common-issues"
            >
              <text class="issues-title">常见问题:</text>
              <text
                v-for="issue in touchTestResults.targetAnalysis.commonIssues"
                :key="issue"
                class="issue-item"
              >
                • {{ issue }}
              </text>
            </view>
          </view>

          <!-- Interaction Performance -->
          <view class="interaction-section">
            <text class="section-title">交互性能</text>
            <view class="interaction-stats">
              <view class="stat-item">
                <text class="stat-label">成功率</text>
                <text class="stat-value"
                  >{{ touchTestResults.interactionAnalysis.successRate }}%</text
                >
              </view>
              <view class="stat-item">
                <text class="stat-label">响应时间</text>
                <text class="stat-value"
                  >{{ touchTestResults.interactionAnalysis.avgResponseTime }}ms</text
                >
              </view>
              <view class="stat-item">
                <text class="stat-label">辅助功能</text>
                <text class="stat-value">{{ touchTestResults.accessibilityScore }}%</text>
              </view>
            </view>

            <view
              v-if="touchTestResults.interactionAnalysis.mostAccurateGesture"
              class="gesture-accuracy"
            >
              <text class="accuracy-title">手势识别:</text>
              <text class="accuracy-best">
                最佳: {{ touchTestResults.interactionAnalysis.mostAccurateGesture }}
              </text>
              <text
                v-if="touchTestResults.interactionAnalysis.leastAccurateGesture"
                class="accuracy-worst"
              >
                待改进: {{ touchTestResults.interactionAnalysis.leastAccurateGesture }}
              </text>
            </view>
          </view>
        </view>
      </view>

      <!-- Performance Tab -->
      <view v-show="activeCategory === 'performance'" class="test-panel">
        <view class="panel-header">
          <text class="panel-title">性能基准测试</text>
          <button
            class="btn btn-secondary btn-sm"
            @click="runPerformanceTest"
            :disabled="isTestingActive"
          >
            单独测试
          </button>
        </view>

        <view v-if="performanceTestResults.length > 0" class="performance-results">
          <view class="performance-metrics">
            <view
              v-for="result in performanceTestResults"
              :key="result.id"
              class="metric-card"
              :class="getResultClass(result.status)"
            >
              <text class="metric-title">{{ getTestTypeTitle(result.testType) }}</text>
              <text class="metric-score">{{ result.score }}/100</text>

              <view class="metric-details">
                <view v-for="(value, key) in result.details.metrics" :key="key" class="detail-item">
                  <text class="detail-label">{{ formatMetricLabel(String(key)) }}</text>
                  <text class="detail-value">{{ formatMetricValue(String(key), value) }}</text>
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- Test Report Tab -->
      <view v-show="activeCategory === 'report'" class="test-panel">
        <view class="panel-header">
          <text class="panel-title">测试报告</text>
          <view class="report-actions">
            <button
              class="btn btn-secondary btn-sm"
              @click="exportReport"
              :disabled="!hasTestResults"
            >
              导出报告
            </button>
            <button class="btn btn-outline btn-sm" @click="clearResults">清除结果</button>
          </view>
        </view>

        <view v-if="testReport" class="test-report">
          <view class="report-summary">
            <view class="summary-header">
              <text class="summary-title">测试总结</text>
              <text class="summary-date">{{ formatDate(testReport.timestamp) }}</text>
            </view>

            <view class="summary-grid">
              <view class="summary-item">
                <text class="item-label">总测试数</text>
                <text class="item-value">{{ testReport.summary.total }}</text>
              </view>
              <view class="summary-item">
                <text class="item-label">通过测试</text>
                <text class="item-value success">{{ testReport.summary.passed }}</text>
              </view>
              <view class="summary-item">
                <text class="item-label">失败测试</text>
                <text class="item-value error">{{ testReport.summary.failed }}</text>
              </view>
              <view class="summary-item">
                <text class="item-label">通过率</text>
                <text class="item-value" :class="getPassRateClass(testReport.summary.passRate)">
                  {{ testReport.summary.passRate }}%
                </text>
              </view>
            </view>
          </view>

          <view v-if="testReport.criticalIssues.length > 0" class="critical-issues">
            <text class="issues-title">⚠️ 关键问题</text>
            <view
              v-for="issue in testReport.criticalIssues.slice(0, 5)"
              :key="`${issue.category}-${issue.message}`"
              class="critical-issue"
            >
              <view class="issue-header">
                <text class="issue-severity" :class="issue.severity">{{
                  getSeverityIcon(issue.severity)
                }}</text>
                <text class="issue-category">{{ issue.category }}</text>
              </view>
              <text class="issue-message">{{ issue.message }}</text>
            </view>
          </view>

          <view class="recommendations">
            <text class="recommendations-title">💡 优化建议</text>
            <view
              v-for="(recommendation, index) in combinedRecommendations.slice(0, 8)"
              :key="index"
              class="recommendation-item"
            >
              <text class="recommendation-text">{{ recommendation }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- Test Toast -->
    <view v-if="testToast.show" class="test-toast" :class="testToast.type">
      <text class="toast-message">{{ testToast.message }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref } from 'vue'
import { useDeviceDetection } from '@/utils/device-detection'
import { useMobileTestingStore } from '@/stores/mobile-testing'
import { useResponsiveTesting } from '@/utils/responsive-testing'
import { useTouchTesting } from '@/utils/touch-testing'
import { useComponentPerformance } from '@/utils/performance'

/**
 * Component performance tracking
 */
const { startRender, endRender } = useComponentPerformance('MobileTestingSuite')

/**
 * Store and utilities
 */
const deviceDetection = useDeviceDetection()
const mobileTestingStore = useMobileTestingStore()
const responsiveTesting = useResponsiveTesting()
const touchTesting = useTouchTesting()

/**
 * Component state
 */
const activeCategory = ref('device')
const isTestingActive = ref(false)
const testProgress = ref(0)
const currentTestStep = ref('')
const testOrientation = ref<'portrait' | 'landscape'>('portrait')
const selectedBreakpoint = ref(null)

// Test results
const deviceTestResults = ref([])
const responsiveTestResults = ref([])
const touchTestResults = ref(null)
const performanceTestResults = ref([])

/**
 * Toast notification
 */
const testToast = reactive({
  show: false,
  type: 'info' as 'success' | 'error' | 'warning' | 'info',
  message: ''
})

/**
 * Test categories configuration
 */
const testCategories = computed(() => [
  {
    id: 'device',
    name: '设备检测',
    icon: '📱',
    hasResults: deviceTestResults.value.length > 0,
    testCount: deviceTestResults.value.length,
    status: getOverallStatus(deviceTestResults.value)
  },
  {
    id: 'responsive',
    name: '响应式',
    icon: '📐',
    hasResults: responsiveTestResults.value.length > 0,
    testCount: responsiveTestResults.value.length,
    status: getOverallStatus(responsiveTestResults.value)
  },
  {
    id: 'touch',
    name: '触摸交互',
    icon: '👆',
    hasResults: touchTestResults.value !== null,
    testCount: touchTestResults.value?.summary?.totalTests || 0,
    status: touchTestResults.value?.summary?.passRate >= 80 ? 'pass' : 'warning'
  },
  {
    id: 'performance',
    name: '性能测试',
    icon: '⚡',
    hasResults: performanceTestResults.value.length > 0,
    testCount: performanceTestResults.value.length,
    status: getOverallStatus(performanceTestResults.value)
  },
  {
    id: 'report',
    name: '测试报告',
    icon: '📊',
    hasResults: hasTestResults.value,
    testCount: totalTestCount.value,
    status: overallPassRate.value >= 80 ? 'pass' : 'warning'
  }
])

/**
 * Device info computed
 */
const deviceInfo = computed(() => {
  const info = deviceDetection.info.value
  if (!info) return { name: '未知设备', specs: '' }

  return {
    name: `${info.brand || ''} ${info.model || ''}`.trim() || '未知设备',
    specs: `${info.windowWidth}×${info.windowHeight} @${info.pixelRatio}x`
  }
})

const screenSize = computed(() => {
  const info = deviceDetection.info.value
  return info ? `${info.windowWidth}×${info.windowHeight}` : 'N/A'
})

const performanceLevel = computed(() => {
  const level = deviceDetection.performanceLevel.value
  const levelMap = {
    high: '高性能',
    medium: '中等性能',
    low: '低性能'
  }
  return levelMap[level] || '未知'
})

const supportedCapabilities = computed(() => {
  const capabilities = deviceDetection.info.value?.capabilities
  if (!capabilities) return 'N/A'

  const supportedCount = Object.values(capabilities).filter(Boolean).length
  const totalCount = Object.keys(capabilities).length
  return `${supportedCount}/${totalCount}`
})

/**
 * Responsive testing computed
 */
const availableBreakpoints = computed(() => responsiveTesting.DEFAULT_BREAKPOINTS)

const responsiveReport = computed(() => {
  if (responsiveTestResults.value.length === 0) {
    return {
      summary: { breakpointCoverage: 0, passRate: 0, avgScore: 0 },
      breakpointResults: []
    }
  }
  return responsiveTesting.generateResponsiveReport()
})

/**
 * Test results computed
 */
const hasTestResults = computed(
  () =>
    deviceTestResults.value.length > 0 ||
    responsiveTestResults.value.length > 0 ||
    touchTestResults.value !== null ||
    performanceTestResults.value.length > 0
)

const totalTestCount = computed(
  () =>
    deviceTestResults.value.length +
    responsiveTestResults.value.length +
    (touchTestResults.value?.summary?.totalTests || 0) +
    performanceTestResults.value.length
)

const overallPassRate = computed(() => {
  if (!hasTestResults.value) return 0

  const devicePassed = deviceTestResults.value.filter(r => r.status === 'pass').length
  const responsivePassed = responsiveTestResults.value.filter(r => r.score >= 80).length
  const touchPassed = touchTestResults.value?.summary?.passedTests || 0
  const performancePassed = performanceTestResults.value.filter(r => r.status === 'pass').length

  const totalPassed = devicePassed + responsivePassed + touchPassed + performancePassed

  return totalTestCount.value > 0 ? Math.round((totalPassed / totalTestCount.value) * 100) : 0
})

const testReport = computed(() => {
  if (!hasTestResults.value) return null

  return mobileTestingStore.generateTestReport()
})

const combinedRecommendations = computed(() => {
  const recommendations = []

  if (responsiveReport.value && typeof responsiveReport.value === 'object' && 'recommendations' in responsiveReport.value && Array.isArray(responsiveReport.value.recommendations)) {
    recommendations.push(...responsiveReport.value.recommendations)
  }

  if (touchTestResults.value?.recommendations) {
    recommendations.push(...touchTestResults.value.recommendations)
  }

  // Add device-specific recommendations
  if (deviceDetection.performanceLevel.value === 'low') {
    recommendations.push('启用性能优化模式以适配低性能设备')
  }

  if (deviceDetection.isPhone.value) {
    recommendations.push('优化单手操作体验')
  }

  if (deviceDetection.isTablet.value) {
    recommendations.push('充分利用平板大屏空间')
  }

  return [...new Set(recommendations)] // Remove duplicates
})

/**
 * Methods
 */

/**
 * Set active test category
 */
function setActiveCategory(categoryId: string) {
  activeCategory.value = categoryId
}

/**
 * Show toast notification
 */
function showToast(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') {
  testToast.message = message
  testToast.type = type
  testToast.show = true

  setTimeout(() => {
    testToast.show = false
  }, 3000)
}

/**
 * Update test progress
 */
function updateProgress(step: string, progress: number) {
  currentTestStep.value = step
  testProgress.value = progress
}

/**
 * Run full comprehensive test
 */
async function runFullTest() {
  if (isTestingActive.value) return

  isTestingActive.value = true
  startRender()

  try {
    showToast('开始移动端适配测试', 'info')

    // Step 1: Device Detection
    updateProgress('设备信息检测...', 10)
    await runDeviceTest()

    // Step 2: Responsive Design
    updateProgress('响应式设计测试...', 30)
    await runResponsiveTest()

    // Step 3: Touch Interaction
    updateProgress('触摸交互测试...', 60)
    await runTouchTest()

    // Step 4: Performance Testing
    updateProgress('性能基准测试...', 80)
    await runPerformanceTest()

    updateProgress('生成测试报告...', 90)

    // Switch to report view
    setTimeout(() => {
      activeCategory.value = 'report'
      updateProgress('测试完成', 100)
      showToast('移动端适配测试完成', 'success')
    }, 500)
  } catch (error) {
    console.error('Full test failed:', error)
    showToast('测试过程中发生错误', 'error')
  } finally {
    setTimeout(() => {
      isTestingActive.value = false
      testProgress.value = 0
      currentTestStep.value = ''
    }, 1000)

    endRender()
  }
}

/**
 * Run device detection test
 */
async function runDeviceTest() {
  try {
    const result = await mobileTestingStore.runMobileTest('device-detection')
    deviceTestResults.value = [result]

    if (!isTestingActive.value) {
      showToast('设备检测测试完成', 'success')
    }
  } catch (error) {
    console.error('Device test failed:', error)
    showToast('设备检测测试失败', 'error')
  }
}

/**
 * Run responsive design test
 */
async function runResponsiveTest() {
  try {
    const results = await responsiveTesting.runFullResponsiveTest()
    responsiveTestResults.value = results

    if (!isTestingActive.value) {
      showToast('响应式设计测试完成', 'success')
    }
  } catch (error) {
    console.error('Responsive test failed:', error)
    showToast('响应式设计测试失败', 'error')
  }
}

/**
 * Run touch interaction test
 */
async function runTouchTest() {
  try {
    const results = await touchTesting.runComprehensiveTouchTests()
    touchTestResults.value = {
      ...results,
      ...touchTesting.generateTouchTestReport()
    }

    if (!isTestingActive.value) {
      showToast('触摸交互测试完成', 'success')
    }
  } catch (error) {
    console.error('Touch test failed:', error)
    showToast('触摸交互测试失败', 'error')
  }
}

/**
 * Run performance test
 */
async function runPerformanceTest() {
  try {
    const result = await mobileTestingStore.runMobileTest('performance-benchmark')
    performanceTestResults.value = [result]

    if (!isTestingActive.value) {
      showToast('性能测试完成', 'success')
    }
  } catch (error) {
    console.error('Performance test failed:', error)
    showToast('性能测试失败', 'error')
  }
}

/**
 * Handle breakpoint selection
 */
function onBreakpointChange(e: any) {
  const index = e.detail.value
  selectedBreakpoint.value = availableBreakpoints.value[index]
}

/**
 * Export test report
 */
function exportReport() {
  try {
    const report = testReport.value
    if (!report) return

    // In a real implementation, this would generate and download a report file
    console.log('Exporting test report:', report)
    showToast('测试报告已导出', 'success')
  } catch (error) {
    console.error('Export failed:', error)
    showToast('导出失败', 'error')
  }
}

/**
 * Clear test results
 */
function clearResults() {
  deviceTestResults.value = []
  responsiveTestResults.value = []
  touchTestResults.value = null
  performanceTestResults.value = []

  showToast('测试结果已清除', 'info')
}

/**
 * Helper functions
 */

function getOverallStatus(results: any[]): 'pass' | 'fail' | 'warning' {
  if (results.length === 0) return 'warning'

  const passed = results.filter(r => r.status === 'pass' || r.score >= 80).length
  const passRate = passed / results.length

  return passRate >= 0.8 ? 'pass' : passRate >= 0.6 ? 'warning' : 'fail'
}

function getBadgeClass(status: string): string {
  return `badge-${status}`
}

function getResultClass(status: string): string {
  return `result-${status}`
}

function getStatusText(status: string): string {
  const statusMap = {
    pass: '通过',
    fail: '失败',
    warning: '警告'
  }
  return statusMap[status] || status
}

function getTestTypeTitle(testType: string): string {
  const titleMap = {
    'device-detection': '设备检测',
    'responsive-design': '响应式设计',
    'touch-interaction': '触摸交互',
    'performance-benchmark': '性能基准',
    'accessibility-audit': '可访问性审核',
    'network-adaptation': '网络适配'
  }
  return titleMap[testType] || testType
}

function formatMetric(key: string, value: any): string {
  const formatMap = {
    screenWidth: `宽度: ${value}px`,
    screenHeight: `高度: ${value}px`,
    pixelRatio: `像素密度: ${value}`,
    memoryUsage: `内存: ${value}MB`,
    averageResponseTime: `响应: ${value}ms`,
    devicePerformanceLevel: `性能: ${value === 3 ? '高' : value === 2 ? '中' : '低'}`
  }
  return formatMap[key] || `${key}: ${value}`
}

function formatMetricLabel(key: string): string {
  const labelMap = {
    memoryUsage: '内存使用',
    averageResponseTime: '响应时间',
    devicePerformanceLevel: '设备性能',
    networkType: '网络类型'
  }
  return labelMap[key] || key
}

function formatMetricValue(key: string, value: any): string {
  if (key === 'memoryUsage') return `${value}MB`
  if (key === 'averageResponseTime') return `${value}ms`
  if (key === 'devicePerformanceLevel') return value === 3 ? '高' : value === 2 ? '中' : '低'
  return String(value)
}

function getPassRateClass(passRate: number): string {
  return passRate >= 80 ? 'success' : passRate >= 60 ? 'warning' : 'error'
}

function getSeverityIcon(severity: string): string {
  const iconMap = {
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  }
  return iconMap[severity] || '•'
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString('zh-CN')
}

/**
 * Lifecycle
 */
onMounted(async () => {
  console.log('🚀 移动端测试套件已加载')

  // Initialize mobile testing system
  await mobileTestingStore.initializeTesting()

  // Auto-run basic device detection
  if (deviceDetection.isReady.value) {
    runDeviceTest()
  }
})
</script>

<style lang="scss" scoped>
.mobile-testing-suite {
  min-height: 100vh;
  background: #f8fafc;
  padding: 20rpx;
}

.testing-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30rpx;
  padding: 30rpx;
  background: white;
  border-radius: 16rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.1);
}

.header-title {
  flex: 1;
}

.title {
  font-size: 36rpx;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 10rpx;
}

.device-info {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.device-name {
  font-size: 28rpx;
  color: #4a5568;
  font-weight: 500;
}

.device-specs {
  font-size: 24rpx;
  color: #718096;
}

.btn {
  padding: 20rpx 32rpx;
  border-radius: 12rpx;
  font-size: 28rpx;
  font-weight: 500;
  border: none;

  &.btn-primary {
    background: #3b82f6;
    color: white;

    &:disabled {
      background: #94a3b8;
    }
  }

  &.btn-secondary {
    background: #e2e8f0;
    color: #4a5568;
  }

  &.btn-outline {
    background: transparent;
    color: #4a5568;
    border: 2rpx solid #e2e8f0;

    &.active {
      background: #3b82f6;
      color: white;
      border-color: #3b82f6;
    }
  }

  &.btn-sm {
    padding: 12rpx 20rpx;
    font-size: 24rpx;
  }
}

.test-progress {
  margin-bottom: 30rpx;
  padding: 24rpx;
  background: white;
  border-radius: 12rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.progress-title {
  font-size: 28rpx;
  font-weight: 500;
  color: #1a1a1a;
}

.progress-text {
  font-size: 24rpx;
  color: #6b7280;
}

.progress-bar {
  height: 8rpx;
  background: #e5e7eb;
  border-radius: 4rpx;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #1d4ed8);
  border-radius: 4rpx;
  transition: width 0.3s ease;
}

.test-categories {
  margin-bottom: 30rpx;
}

.category-tabs {
  white-space: nowrap;
}

.category-tab {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  padding: 20rpx 24rpx;
  margin-right: 16rpx;
  background: white;
  border-radius: 12rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
  position: relative;
  min-width: 120rpx;

  &.active {
    background: #3b82f6;

    .tab-icon,
    .tab-name {
      color: white;
    }
  }
}

.tab-icon {
  font-size: 32rpx;
  margin-bottom: 8rpx;
}

.tab-name {
  font-size: 24rpx;
  color: #4a5568;
  font-weight: 500;
}

.tab-badge {
  position: absolute;
  top: -8rpx;
  right: -8rpx;
  min-width: 32rpx;
  height: 32rpx;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;

  &.badge-pass {
    background: #10b981;
  }

  &.badge-warning {
    background: #f59e0b;
  }

  &.badge-fail {
    background: #ef4444;
  }
}

.badge-text {
  font-size: 20rpx;
  color: white;
  font-weight: 600;
}

.test-content {
  background: white;
  border-radius: 16rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.1);
  min-height: 600rpx;
}

.test-panel {
  padding: 30rpx;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30rpx;
  padding-bottom: 20rpx;
  border-bottom: 2rpx solid #e5e7eb;
}

.panel-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #1a1a1a;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20rpx;
  margin-bottom: 30rpx;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.info-label {
  font-size: 24rpx;
  color: #6b7280;
}

.info-value {
  font-size: 28rpx;
  color: #1a1a1a;
  font-weight: 500;
}

.result-item {
  padding: 24rpx;
  margin-bottom: 16rpx;
  border-radius: 12rpx;
  border-left: 6rpx solid;

  &.result-pass {
    background: #f0fdf4;
    border-color: #10b981;
  }

  &.result-warning {
    background: #fffbeb;
    border-color: #f59e0b;
  }

  &.result-fail {
    background: #fef2f2;
    border-color: #ef4444;
  }
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12rpx;
}

.result-title {
  font-size: 28rpx;
  font-weight: 500;
  color: #1a1a1a;
}

.result-badge {
  padding: 6rpx 12rpx;
  border-radius: 6rpx;
  font-size: 20rpx;
  font-weight: 500;

  &.pass {
    background: #10b981;
    color: white;
  }

  &.warning {
    background: #f59e0b;
    color: white;
  }

  &.fail {
    background: #ef4444;
    color: white;
  }
}

.result-metrics {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.metric {
  font-size: 24rpx;
  color: #6b7280;
  padding: 8rpx 16rpx;
  background: #f9fafb;
  border-radius: 8rpx;
}

.test-toast {
  position: fixed;
  bottom: 100rpx;
  left: 50%;
  transform: translateX(-50%);
  padding: 16rpx 24rpx;
  border-radius: 8rpx;
  color: white;
  font-size: 28rpx;
  z-index: 1000;

  &.success {
    background: #10b981;
  }

  &.error {
    background: #ef4444;
  }

  &.warning {
    background: #f59e0b;
  }

  &.info {
    background: #3b82f6;
  }
}

// Additional styles for responsive, touch, and performance sections
.responsive-controls,
.touch-section,
.interaction-section {
  margin-bottom: 30rpx;
}

.summary-card,
.stat-item {
  text-align: center;
  padding: 20rpx;
  background: #f8fafc;
  border-radius: 8rpx;
}

.summary-value,
.stat-value {
  font-size: 32rpx;
  font-weight: 600;
  color: #3b82f6;
  margin-top: 8rpx;
}

.recommendations {
  margin-top: 30rpx;
  padding: 24rpx;
  background: #f0f9ff;
  border-radius: 12rpx;
}

.recommendation-item {
  padding: 12rpx 0;
  border-bottom: 1rpx solid #e0e7ff;
}

.recommendation-text {
  font-size: 26rpx;
  color: #1e40af;
  line-height: 1.5;
}
</style>
