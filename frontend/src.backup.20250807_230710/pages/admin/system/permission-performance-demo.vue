<template>
  <view class="permission-performance-demo">
    <AdminLayout>
      <!-- 页面标题和系统状态 -->
      <view class="page-header">
        <view class="header-left">
          <text class="page-title">权限系统性能演示</text>
          <text class="page-subtitle">展示缓存优化和API批处理的性能提升效果</text>
        </view>
        <view class="header-right">
          <view class="system-status" :class="{ healthy: systemStatus.healthy }">
            <view class="status-indicator"></view>
            <text>{{ systemStatus.healthy ? '系统健康' : '性能降级' }}</text>
          </view>
          <button class="admin-btn admin-btn-secondary" @click="handleOptimizePerformance">
            性能优化
          </button>
          <button class="admin-btn admin-btn-primary" @click="handleRunBenchmark">
            运行基准测试
          </button>
        </view>
      </view>

      <!-- 系统健康仪表板 -->
      <view class="health-dashboard admin-card">
        <view class="dashboard-header">
          <text class="dashboard-title">系统健康监控</text>
          <text class="health-score" :class="healthScoreClass">{{ healthScore }}/100</text>
        </view>

        <view class="health-grid">
          <!-- 缓存状态 -->
          <view class="health-item cache-health">
            <view class="health-icon">🗄️</view>
            <view class="health-details">
              <text class="health-label">权限缓存</text>
              <text class="health-value" :class="health.cache.status">{{
                getCacheStatusText(health.cache.status)
              }}</text>
              <text class="health-metric">命中率: {{ health.cache.hitRate.toFixed(1) }}%</text>
              <text class="health-metric">大小: {{ formatBytes(health.cache.memoryUsage) }}</text>
            </view>
          </view>

          <!-- API状态 -->
          <view class="health-item api-health">
            <view class="health-icon">🌐</view>
            <view class="health-details">
              <text class="health-label">API服务</text>
              <text class="health-value" :class="health.api.status">{{
                getAPIStatusText(health.api.status)
              }}</text>
              <text class="health-metric"
                >响应时间: {{ health.api.responseTime.toFixed(0) }}ms</text
              >
              <text class="health-metric">错误率: {{ health.api.errorRate.toFixed(2) }}%</text>
            </view>
          </view>

          <!-- 性能指标 -->
          <view class="health-item performance-health">
            <view class="health-icon">⚡</view>
            <view class="health-details">
              <text class="health-label">性能指标</text>
              <text class="health-value excellent">优秀</text>
              <text class="health-metric"
                >平均延迟: {{ performanceMetrics.averageResponseTime }}ms</text
              >
              <text class="health-metric"
                >API调用减少: {{ performanceMetrics.apiCallReduction }}%</text
              >
            </view>
          </view>

          <!-- 队列状态 -->
          <view class="health-item queue-health">
            <view class="health-icon">📤</view>
            <view class="health-details">
              <text class="health-label">请求队列</text>
              <text
                class="health-value"
                :class="health.api.queueSize > 10 ? 'degraded' : 'healthy'"
              >
                {{ health.api.queueSize > 0 ? '处理中' : '空闲' }}
              </text>
              <text class="health-metric">队列长度: {{ health.api.queueSize }}</text>
              <text class="health-metric"
                >断路器: {{ health.api.circuitBreakerOpen ? '开启' : '正常' }}</text
              >
            </view>
          </view>
        </view>

        <!-- 优化建议 -->
        <view v-if="health.recommendations.length > 0" class="recommendations">
          <text class="recommendations-title">优化建议</text>
          <view class="recommendation-list">
            <text
              v-for="(rec, index) in health.recommendations"
              :key="index"
              class="recommendation-item"
            >
              💡 {{ rec }}
            </text>
          </view>
        </view>
      </view>

      <!-- 性能对比测试 -->
      <view class="performance-comparison admin-card">
        <view class="comparison-header">
          <text class="comparison-title">性能对比测试</text>
          <button class="test-btn" @click="runPerformanceTest" :disabled="testRunning">
            {{ testRunning ? '测试中...' : '运行测试' }}
          </button>
        </view>

        <!-- 测试配置 -->
        <view class="test-config">
          <view class="config-row">
            <text class="config-label">测试用户数：</text>
            <input
              v-model.number="testConfig.userCount"
              type="number"
              class="config-input"
              min="1"
              max="100"
            />
          </view>
          <view class="config-row">
            <text class="config-label">权限检查次数：</text>
            <input
              v-model.number="testConfig.permissionCount"
              type="number"
              class="config-input"
              min="10"
              max="1000"
            />
          </view>
          <view class="config-row">
            <text class="config-label">测试模式：</text>
            <picker
              mode="selector"
              :range="testModes"
              :value="testModeIndex"
              @change="handleTestModeChange"
            >
              <view class="config-picker">
                {{ testModes[testModeIndex] }}
                <text class="picker-arrow">▼</text>
              </view>
            </picker>
          </view>
        </view>

        <!-- 测试结果 -->
        <view v-if="testResults.length > 0" class="test-results">
          <view class="results-header">
            <text class="results-title">测试结果对比</text>
          </view>

          <view class="results-table">
            <!-- 表头 -->
            <view class="table-header">
              <text class="header-cell">测试方式</text>
              <text class="header-cell">总耗时</text>
              <text class="header-cell">平均延迟</text>
              <text class="header-cell">API调用次数</text>
              <text class="header-cell">缓存命中率</text>
              <text class="header-cell">错误次数</text>
            </view>

            <!-- 数据行 -->
            <view
              v-for="result in testResults"
              :key="result.name"
              class="table-row"
              :class="result.name === 'enhanced' ? 'enhanced-row' : ''"
            >
              <text class="table-cell">{{ getTestName(result.name) }}</text>
              <text class="table-cell">{{ result.totalTime.toFixed(0) }}ms</text>
              <text class="table-cell">{{ result.averageTime.toFixed(2) }}ms</text>
              <text class="table-cell">{{ result.apiCalls }}</text>
              <text class="table-cell">{{ (result.cacheHitRate * 100).toFixed(1) }}%</text>
              <text class="table-cell">{{ result.errors }}</text>
            </view>
          </view>

          <!-- 性能提升指标 -->
          <view v-if="performanceImprovement" class="improvement-stats">
            <text class="improvement-title">性能提升</text>
            <view class="improvement-grid">
              <view class="improvement-item positive">
                <text class="improvement-label">总耗时减少</text>
                <text class="improvement-value"
                  >{{ performanceImprovement.timeReduction.toFixed(1) }}%</text
                >
              </view>
              <view class="improvement-item positive">
                <text class="improvement-label">API调用减少</text>
                <text class="improvement-value"
                  >{{ performanceImprovement.apiReduction.toFixed(1) }}%</text
                >
              </view>
              <view class="improvement-item positive">
                <text class="improvement-label">延迟降低</text>
                <text class="improvement-value"
                  >{{ performanceImprovement.latencyReduction.toFixed(1) }}%</text
                >
              </view>
              <view class="improvement-item positive">
                <text class="improvement-label">可靠性提升</text>
                <text class="improvement-value"
                  >{{ performanceImprovement.reliabilityImprovement.toFixed(1) }}%</text
                >
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 实时权限检查演示 -->
      <view class="realtime-demo admin-card">
        <view class="demo-header">
          <text class="demo-title">实时权限检查演示</text>
          <view class="demo-controls">
            <button class="demo-btn" @click="startRealtimeDemo">
              {{ realtimeDemoRunning ? '停止演示' : '开始演示' }}
            </button>
            <button class="demo-btn secondary" @click="clearDemoResults">清空记录</button>
          </view>
        </view>

        <view class="demo-content">
          <!-- 演示统计 -->
          <view class="demo-stats">
            <view class="stat-item">
              <text class="stat-value">{{ realtimeStats.totalChecks }}</text>
              <text class="stat-label">总检查次数</text>
            </view>
            <view class="stat-item">
              <text class="stat-value">{{ realtimeStats.cacheHits }}</text>
              <text class="stat-label">缓存命中</text>
            </view>
            <view class="stat-item">
              <text class="stat-value">{{ realtimeStats.avgResponseTime.toFixed(1) }}ms</text>
              <text class="stat-label">平均延迟</text>
            </view>
            <view class="stat-item">
              <text class="stat-value">{{ realtimeStats.successRate.toFixed(1) }}%</text>
              <text class="stat-label">成功率</text>
            </view>
          </view>

          <!-- 权限检查日志 -->
          <view class="demo-log">
            <view class="log-header">
              <text class="log-title">权限检查日志</text>
              <text class="log-subtitle">实时显示权限检查结果和性能指标</text>
            </view>
            <view class="log-content" ref="logContent">
              <view
                v-for="(log, index) in permissionLogs.slice(-20)"
                :key="index"
                class="log-entry"
                :class="[log.granted ? 'granted' : 'denied', log.fromCache ? 'cached' : 'api']"
              >
                <text class="log-time">{{ formatTime(log.timestamp) }}</text>
                <text class="log-user">用户{{ log.userId.slice(-2) }}</text>
                <text class="log-permission">{{ log.resource }}.{{ log.action }}</text>
                <text class="log-result">{{ log.granted ? '✅ 允许' : '❌ 拒绝' }}</text>
                <text class="log-source">{{ log.fromCache ? '📋 缓存' : '🌐 API' }}</text>
                <text class="log-time-ms">{{ log.responseTime.toFixed(1) }}ms</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 缓存管理控制台 -->
      <view class="cache-console admin-card">
        <view class="console-header">
          <text class="console-title">缓存管理控制台</text>
          <view class="console-actions">
            <button class="console-btn" @click="handleWarmupCache">预热缓存</button>
            <button class="console-btn warning" @click="handleClearCache">清空缓存</button>
            <button class="console-btn danger" @click="handleResetSystem">重置系统</button>
          </view>
        </view>

        <view class="console-content">
          <!-- 缓存统计 -->
          <view class="cache-stats">
            <view class="stats-grid">
              <view class="cache-stat-item">
                <text class="stat-number">{{ cache.metrics.cacheSize }}</text>
                <text class="stat-desc">缓存条目</text>
              </view>
              <view class="cache-stat-item">
                <text class="stat-number">{{ cache.cacheHitRate.value }}%</text>
                <text class="stat-desc">命中率</text>
              </view>
              <view class="cache-stat-item">
                <text class="stat-number">{{ formatBytes(cache.metrics.memoryUsage) }}</text>
                <text class="stat-desc">内存使用</text>
              </view>
              <view class="cache-stat-item">
                <text class="stat-number">{{ cache.metrics.hits }}</text>
                <text class="stat-desc">缓存命中次数</text>
              </view>
            </view>
          </view>

          <!-- API队列状态 -->
          <view class="api-queue-status">
            <text class="queue-title">API请求队列状态</text>
            <view class="queue-details">
              <view class="queue-item">
                <text class="queue-label">队列大小:</text>
                <text class="queue-value">{{ api.queueStatus.value.size }}</text>
              </view>
              <view class="queue-item">
                <text class="queue-label">高优先级:</text>
                <text class="queue-value">{{ api.queueStatus.value.highPriorityCount }}</text>
              </view>
              <view class="queue-item">
                <text class="queue-label">处理中:</text>
                <text class="queue-value">{{
                  api.queueStatus.value.processing ? '是' : '否'
                }}</text>
              </view>
              <view class="queue-item">
                <text class="queue-label">去重减少:</text>
                <text class="queue-value">{{ api.performanceStats.value.deduplicationRate }}%</text>
              </view>
            </view>
          </view>

          <!-- 性能建议 -->
          <view v-if="performanceRecommendations.length > 0" class="performance-suggestions">
            <text class="suggestions-title">性能优化建议</text>
            <view class="suggestions-list">
              <text
                v-for="(suggestion, index) in performanceRecommendations"
                :key="index"
                class="suggestion-item"
              >
                🎯 {{ suggestion }}
              </text>
            </view>
          </view>
        </view>
      </view>
    </AdminLayout>
  </view>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, reactive, ref } from 'vue'
import {
  enhancedPermissionPresets,
  useEnhancedPermissionSystem
} from '@/composables/useEnhancedPermissionSystem'
import type { PermissionCheckResult, SystemHealth } from '@/composables/useEnhancedPermissionSystem'
import AdminLayout from '@/layouts/AdminLayout.vue'
import { showToast } from '@/utils/ui'

/**
 * 权限系统性能演示页面
 *
 * 功能展示：
 * - 权限缓存系统性能监控
 * - API优化效果对比测试
 * - 实时权限检查演示
 * - 系统健康状况监控
 * - 缓存管理和优化控制
 *
 * @author Terminal 3 (Admin Frontend Team)
 */

// 初始化增强权限系统
const permissionSystem = useEnhancedPermissionSystem({
  ...enhancedPermissionPresets.enterprise,
  debug: true,
  enableMetrics: true
})

// 响应式数据
const testRunning = ref(false)
const testResults = ref<
  Array<{
    name: string
    totalTime: number
    averageTime: number
    apiCalls: number
    cacheHitRate: number
    errors: number
  }>
>([])

const testConfig = reactive({
  userCount: 20,
  permissionCount: 100,
  mode: 'mixed'
})

const testModes = ['顺序检查', '随机检查', '混合模式', '批量检查']
const testModeIndex = ref(2)

// 实时演示数据
const realtimeDemoRunning = ref(false)
const permissionLogs = ref<
  Array<
    PermissionCheckResult & {
      userId: string
      resource: string
      action: string
      timestamp: Date
    }
  >
>([])

const realtimeStats = reactive({
  totalChecks: 0,
  cacheHits: 0,
  avgResponseTime: 0,
  successRate: 100
})

let realtimeDemoTimer: number | null = null

// 解构权限系统
const {
  systemStatus,
  performanceMetrics,
  checkPermission,
  checkPermissionsBatch,
  getSystemHealth,
  optimizePerformance,
  cache,
  api,
  resetSystem
} = permissionSystem

// 系统健康状况
const health = ref<SystemHealth>(getSystemHealth())

// 更新健康状况
const updateHealth = () => {
  health.value = getSystemHealth()
}

setInterval(updateHealth, 5000) // 每5秒更新一次

// 计算属性
const healthScore = computed(() => {
  const scores = {
    excellent: 100,
    good: 80,
    fair: 60,
    poor: 30
  }
  return scores[health.value.overall] || 0
})

const healthScoreClass = computed(() => {
  if (healthScore.value >= 90) return 'excellent'
  if (healthScore.value >= 70) return 'good'
  if (healthScore.value >= 50) return 'fair'
  return 'poor'
})

const performanceImprovement = computed(() => {
  if (testResults.value.length < 2) return null

  const baseline = testResults.value.find(r => r.name === 'baseline')
  const enhanced = testResults.value.find(r => r.name === 'enhanced')

  if (!baseline || !enhanced) return null

  return {
    timeReduction: ((baseline.totalTime - enhanced.totalTime) / baseline.totalTime) * 100,
    apiReduction: ((baseline.apiCalls - enhanced.apiCalls) / baseline.apiCalls) * 100,
    latencyReduction: ((baseline.averageTime - enhanced.averageTime) / baseline.averageTime) * 100,
    reliabilityImprovement:
      ((enhanced.cacheHitRate - baseline.cacheHitRate) / baseline.cacheHitRate) * 100
  }
})

const performanceRecommendations = computed(() => {
  const recommendations: string[] = []

  if (parseFloat(performanceMetrics.value.cacheHitRate) < 70) {
    recommendations.push('缓存命中率偏低，建议增加缓存预热或调整TTL设置')
  }

  if (parseFloat(performanceMetrics.value.averageResponseTime) > 50) {
    recommendations.push('平均响应时间偏高，建议启用更积极的批处理策略')
  }

  if (health.value.api.queueSize > 20) {
    recommendations.push('API请求队列积压，建议增加并发处理数量')
  }

  if (parseFloat(performanceMetrics.value.errorRate) > 5) {
    recommendations.push('错误率偏高，请检查网络连接和API服务状态')
  }

  if (health.value.cache.memoryUsage > 100 * 1024 * 1024) {
    // 100MB
    recommendations.push('缓存内存使用过高，建议清理过期数据或降低缓存大小')
  }

  return recommendations
})

// 模拟权限数据
const mockPermissions = [
  { resource: 'customers', action: 'read' },
  { resource: 'customers', action: 'write' },
  { resource: 'customers', action: 'delete' },
  { resource: 'products', action: 'read' },
  { resource: 'products', action: 'write' },
  { resource: 'products', action: 'delete' },
  { resource: 'quotes', action: 'read' },
  { resource: 'quotes', action: 'write' },
  { resource: 'quotes', action: 'approve' },
  { resource: 'reports', action: 'read' },
  { resource: 'reports', action: 'export' },
  { resource: 'settings', action: 'read' },
  { resource: 'settings', action: 'write' },
  { resource: 'users', action: 'read' },
  { resource: 'users', action: 'manage' }
]

// 事件处理函数
const handleOptimizePerformance = async () => {
  try {
    const optimizedHealth = await optimizePerformance()
    health.value = optimizedHealth
    showToast('性能优化完成', 'success')
  } catch (error) {
    showToast('性能优化失败', 'error')
  }
}

const handleRunBenchmark = async () => {
  await runPerformanceTest()
}

const runPerformanceTest = async () => {
  if (testRunning.value) return

  testRunning.value = true
  testResults.value = []

  try {
    showToast('开始性能测试...', 'info')

    // 生成测试用例
    const testCases = generateTestCases(testConfig.userCount, testConfig.permissionCount)

    // 基准测试（无优化）
    const baselineResult = await runBaselineTest(testCases)
    testResults.value.push(baselineResult)

    // 增强系统测试
    const enhancedResult = await runEnhancedTest(testCases)
    testResults.value.push(enhancedResult)

    showToast('性能测试完成', 'success')
  } catch (error) {
    console.error('Performance test failed:', error)
    showToast('性能测试失败', 'error')
  } finally {
    testRunning.value = false
  }
}

const generateTestCases = (userCount: number, permissionCount: number) => {
  const cases: Array<{ userId: string; resource: string; action: string }> = []

  for (let i = 0; i < permissionCount; i++) {
    const userId = `user_${Math.floor(Math.random() * userCount) + 1}`
    const permission = mockPermissions[Math.floor(Math.random() * mockPermissions.length)]

    cases.push({
      userId,
      resource: permission.resource,
      action: permission.action
    })
  }

  return cases
}

const runBaselineTest = async (
  testCases: Array<{ userId: string; resource: string; action: string }>
) => {
  const startTime = performance.now()
  let apiCalls = 0
  let errors = 0
  let totalResponseTime = 0

  // 模拟无缓存的逐个API调用
  for (const testCase of testCases) {
    const checkStart = performance.now()

    try {
      // 模拟API延迟（50-200ms）
      const delay = 50 + Math.random() * 150
      await new Promise(resolve => setTimeout(resolve, delay))

      apiCalls++
      totalResponseTime += performance.now() - checkStart
    } catch (error) {
      errors++
    }
  }

  const totalTime = performance.now() - startTime

  return {
    name: 'baseline',
    totalTime,
    averageTime: totalResponseTime / testCases.length,
    apiCalls,
    cacheHitRate: 0, // 基准测试无缓存
    errors
  }
}

const runEnhancedTest = async (
  testCases: Array<{ userId: string; resource: string; action: string }>
) => {
  const startTime = performance.now()
  const initialApiCalls = parseInt(performanceMetrics.value.apiCallReduction)

  // 使用批量检查进行测试
  const batchResult = await checkPermissionsBatch(
    testCases.map(tc => ({
      ...tc,
      priority: 'medium' as const
    }))
  )

  const totalTime = performance.now() - startTime
  const finalApiCalls = parseInt(performanceMetrics.value.apiCallReduction)
  const apiCalls = Math.max(1, finalApiCalls - initialApiCalls) // 估算API调用次数

  return {
    name: 'enhanced',
    totalTime,
    averageTime: batchResult.summary.averageResponseTime,
    apiCalls,
    cacheHitRate: batchResult.summary.cached / batchResult.summary.total,
    errors: batchResult.summary.errors
  }
}

const handleTestModeChange = (event: any) => {
  testModeIndex.value = event.detail.value
  testConfig.mode = ['sequential', 'random', 'mixed', 'batch'][testModeIndex.value]
}

const startRealtimeDemo = () => {
  if (realtimeDemoRunning.value) {
    stopRealtimeDemo()
    return
  }

  realtimeDemoRunning.value = true

  const runCheck = async () => {
    if (!realtimeDemoRunning.value) return

    const userId = `user_${Math.floor(Math.random() * 10) + 1}`
    const permission = mockPermissions[Math.floor(Math.random() * mockPermissions.length)]

    try {
      const result = await checkPermission(userId, permission.resource, permission.action)

      permissionLogs.value.push({
        ...result,
        userId,
        resource: permission.resource,
        action: permission.action,
        timestamp: new Date()
      })

      // 更新统计
      realtimeStats.totalChecks++
      if (result.fromCache) realtimeStats.cacheHits++

      realtimeStats.avgResponseTime =
        (realtimeStats.avgResponseTime * (realtimeStats.totalChecks - 1) + result.responseTime) /
        realtimeStats.totalChecks

      realtimeStats.successRate =
        ((realtimeStats.totalChecks - (result.error ? 1 : 0)) / realtimeStats.totalChecks) * 100

      // 限制日志数量
      if (permissionLogs.value.length > 100) {
        permissionLogs.value = permissionLogs.value.slice(-50)
      }
    } catch (error) {
      console.error('Realtime demo check failed:', error)
    }

    // 随机间隔（100-1000ms）
    const nextDelay = 100 + Math.random() * 900
    realtimeDemoTimer = setTimeout(runCheck, nextDelay) as unknown as number
  }

  runCheck()
}

const stopRealtimeDemo = () => {
  realtimeDemoRunning.value = false
  if (realtimeDemoTimer) {
    clearTimeout(realtimeDemoTimer)
    realtimeDemoTimer = null
  }
}

const clearDemoResults = () => {
  permissionLogs.value = []
  Object.assign(realtimeStats, {
    totalChecks: 0,
    cacheHits: 0,
    avgResponseTime: 0,
    successRate: 100
  })
}

const handleWarmupCache = async () => {
  try {
    showToast('开始预热缓存...', 'info')

    // 为前10个用户预热权限
    const users = Array.from({ length: 10 }, (_, i) => `user_${i + 1}`)
    const resources = ['customers', 'products', 'quotes', 'reports']

    for (const userId of users) {
      await permissionSystem.preloadPermissions(userId, resources)
    }

    showToast('缓存预热完成', 'success')
    updateHealth()
  } catch (error) {
    showToast('缓存预热失败', 'error')
  }
}

const handleClearCache = () => {
  cache.clearAllCache()
  showToast('缓存已清空', 'success')
  updateHealth()
}

const handleResetSystem = async () => {
  try {
    await resetSystem()
    testResults.value = []
    clearDemoResults()
    showToast('系统已重置', 'success')
    updateHealth()
  } catch (error) {
    showToast('系统重置失败', 'error')
  }
}

// 工具函数
const getCacheStatusText = (status: string) => {
  const statusTexts = {
    healthy: '健康',
    degraded: '降级',
    failed: '故障'
  }
  return statusTexts[status as keyof typeof statusTexts] || status
}

const getAPIStatusText = (status: string) => {
  const statusTexts = {
    healthy: '正常',
    degraded: '降级',
    failed: '故障'
  }
  return statusTexts[status as keyof typeof statusTexts] || status
}

const getTestName = (name: string) => {
  const testNames = {
    baseline: '基准测试（无优化）',
    enhanced: '增强系统（缓存+批处理）'
  }
  return testNames[name as keyof typeof testNames] || name
}

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B'

  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatTime = (date: Date) => {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}.${String(date.getMilliseconds()).padStart(3, '0')}`
}

// 生命周期
onMounted(() => {
  updateHealth()
  showToast('权限系统性能演示已就绪', 'success')
})

onUnmounted(() => {
  stopRealtimeDemo()
  permissionSystem.cleanup()
})
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.permission-performance-demo {
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    .header-left {
      .page-title {
        font-size: 24px;
        font-weight: 600;
        color: var(--text-color-primary);
        margin-bottom: 4px;
        display: block;
      }

      .page-subtitle {
        font-size: 14px;
        color: var(--text-color-secondary);
      }
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 12px;

      .system-status {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 8px 16px;
        border-radius: 20px;
        font-size: 12px;
        background: rgba(var(--color-error-rgb), 0.1);
        color: var(--color-error);

        .status-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--color-error);
        }

        &.healthy {
          background: rgba(var(--color-success-rgb), 0.1);
          color: var(--color-success);

          .status-indicator {
            background: var(--color-success);
            animation: pulse 2s infinite;
          }
        }
      }
    }
  }

  .health-dashboard {
    margin-bottom: 24px;

    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;

      .dashboard-title {
        font-size: 18px;
        font-weight: 600;
        color: var(--text-color-primary);
      }

      .health-score {
        font-size: 24px;
        font-weight: 700;

        &.excellent {
          color: var(--color-success);
        }

        &.good {
          color: #52c41a;
        }

        &.fair {
          color: var(--color-warning);
        }

        &.poor {
          color: var(--color-error);
        }
      }
    }

    .health-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 20px;
      margin-bottom: 24px;

      .health-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px;
        border: 1px solid var(--border-color-light);
        border-radius: 8px;
        background: var(--bg-color-secondary);

        .health-icon {
          font-size: 24px;
        }

        .health-details {
          flex: 1;

          .health-label {
            font-size: 12px;
            color: var(--text-color-secondary);
            margin-bottom: 4px;
            display: block;
          }

          .health-value {
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 8px;
            display: block;

            &.healthy {
              color: var(--color-success);
            }

            &.degraded {
              color: var(--color-warning);
            }

            &.failed {
              color: var(--color-error);
            }

            &.excellent {
              color: var(--color-success);
            }
          }

          .health-metric {
            font-size: 11px;
            color: var(--text-color-tertiary);
            display: block;
            margin-bottom: 2px;
          }
        }
      }
    }

    .recommendations {
      padding: 16px;
      background: rgba(var(--color-primary-rgb), 0.05);
      border: 1px solid rgba(var(--color-primary-rgb), 0.2);
      border-radius: 8px;

      .recommendations-title {
        font-size: 14px;
        font-weight: 600;
        color: var(--color-primary);
        margin-bottom: 12px;
        display: block;
      }

      .recommendation-list {
        .recommendation-item {
          font-size: 13px;
          color: var(--text-color-secondary);
          display: block;
          margin-bottom: 8px;
          line-height: 1.5;
        }
      }
    }
  }

  .performance-comparison {
    margin-bottom: 24px;

    .comparison-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;

      .comparison-title {
        font-size: 18px;
        font-weight: 600;
        color: var(--text-color-primary);
      }

      .test-btn {
        padding: 8px 16px;
        background: var(--color-primary);
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;

        &:disabled {
          background: var(--color-grey-400);
          cursor: not-allowed;
        }
      }
    }

    .test-config {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 24px;

      .config-row {
        display: flex;
        align-items: center;
        gap: 8px;

        .config-label {
          font-size: 14px;
          color: var(--text-color-secondary);
          white-space: nowrap;
        }

        .config-input {
          flex: 1;
          padding: 6px 8px;
          border: 1px solid var(--border-color);
          border-radius: 4px;
          font-size: 14px;
        }

        .config-picker {
          flex: 1;
          padding: 6px 8px;
          border: 1px solid var(--border-color);
          border-radius: 4px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 14px;
        }
      }
    }

    .test-results {
      .results-header {
        margin-bottom: 16px;

        .results-title {
          font-size: 16px;
          font-weight: 600;
          color: var(--text-color-primary);
        }
      }

      .results-table {
        .table-header {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr;
          gap: 12px;
          padding: 12px 16px;
          background: var(--bg-color-secondary);
          border-radius: 6px 6px 0 0;
          border: 1px solid var(--border-color-light);

          .header-cell {
            font-size: 12px;
            font-weight: 600;
            color: var(--text-color-secondary);
            text-align: center;
          }
        }

        .table-row {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr;
          gap: 12px;
          padding: 12px 16px;
          border: 1px solid var(--border-color-light);
          border-top: none;

          &.enhanced-row {
            background: rgba(var(--color-success-rgb), 0.05);
            border-left: 3px solid var(--color-success);
          }

          .table-cell {
            font-size: 13px;
            text-align: center;
            color: var(--text-color-primary);
          }
        }
      }

      .improvement-stats {
        margin-top: 20px;
        padding: 16px;
        background: rgba(var(--color-success-rgb), 0.05);
        border: 1px solid rgba(var(--color-success-rgb), 0.2);
        border-radius: 8px;

        .improvement-title {
          font-size: 16px;
          font-weight: 600;
          color: var(--color-success);
          margin-bottom: 16px;
          display: block;
        }

        .improvement-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 16px;

          .improvement-item {
            text-align: center;

            &.positive .improvement-value {
              color: var(--color-success);
              font-size: 20px;
              font-weight: 700;
            }

            .improvement-label {
              font-size: 12px;
              color: var(--text-color-secondary);
              margin-bottom: 4px;
              display: block;
            }
          }
        }
      }
    }
  }

  .realtime-demo {
    margin-bottom: 24px;

    .demo-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;

      .demo-title {
        font-size: 18px;
        font-weight: 600;
        color: var(--text-color-primary);
      }

      .demo-controls {
        display: flex;
        gap: 8px;

        .demo-btn {
          padding: 6px 12px;
          background: var(--color-primary);
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;

          &.secondary {
            background: var(--color-grey-500);
          }
        }
      }
    }

    .demo-content {
      .demo-stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: 16px;
        margin-bottom: 24px;

        .stat-item {
          text-align: center;
          padding: 12px;
          background: var(--bg-color-secondary);
          border-radius: 6px;

          .stat-value {
            font-size: 24px;
            font-weight: 700;
            color: var(--color-primary);
            display: block;
            margin-bottom: 4px;
          }

          .stat-label {
            font-size: 12px;
            color: var(--text-color-secondary);
          }
        }
      }

      .demo-log {
        .log-header {
          margin-bottom: 16px;

          .log-title {
            font-size: 16px;
            font-weight: 600;
            color: var(--text-color-primary);
            display: block;
            margin-bottom: 4px;
          }

          .log-subtitle {
            font-size: 13px;
            color: var(--text-color-secondary);
          }
        }

        .log-content {
          max-height: 400px;
          overflow-y: auto;
          background: #1a1a1a;
          border-radius: 6px;
          padding: 12px;

          .log-entry {
            display: grid;
            grid-template-columns: auto auto 1fr auto auto auto;
            gap: 12px;
            padding: 4px 8px;
            border-radius: 3px;
            margin-bottom: 2px;
            font-family: monospace;
            font-size: 11px;

            &.granted {
              background: rgba(34, 197, 94, 0.1);
              color: #22c55e;
            }

            &.denied {
              background: rgba(239, 68, 68, 0.1);
              color: #ef4444;
            }

            &.cached {
              border-left: 3px solid #3b82f6;
            }

            &.api {
              border-left: 3px solid #f59e0b;
            }

            .log-time {
              color: #94a3b8;
            }

            .log-user {
              color: #60a5fa;
            }

            .log-permission {
              color: #a78bfa;
            }

            .log-result {
              color: inherit;
            }

            .log-source {
              color: #fbbf24;
            }

            .log-time-ms {
              color: #10b981;
              text-align: right;
            }
          }
        }
      }
    }
  }

  .cache-console {
    .console-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;

      .console-title {
        font-size: 18px;
        font-weight: 600;
        color: var(--text-color-primary);
      }

      .console-actions {
        display: flex;
        gap: 8px;

        .console-btn {
          padding: 6px 12px;
          background: var(--color-primary);
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;

          &.warning {
            background: var(--color-warning);
          }

          &.danger {
            background: var(--color-error);
          }
        }
      }
    }

    .console-content {
      .cache-stats {
        margin-bottom: 24px;

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 16px;

          .cache-stat-item {
            text-align: center;
            padding: 16px;
            background: var(--bg-color-secondary);
            border-radius: 6px;

            .stat-number {
              font-size: 20px;
              font-weight: 700;
              color: var(--color-primary);
              display: block;
              margin-bottom: 4px;
            }

            .stat-desc {
              font-size: 11px;
              color: var(--text-color-secondary);
            }
          }
        }
      }

      .api-queue-status {
        margin-bottom: 24px;

        .queue-title {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-color-primary);
          margin-bottom: 12px;
          display: block;
        }

        .queue-details {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 12px;

          .queue-item {
            display: flex;
            justify-content: space-between;
            padding: 8px 12px;
            background: var(--bg-color-secondary);
            border-radius: 4px;

            .queue-label {
              font-size: 12px;
              color: var(--text-color-secondary);
            }

            .queue-value {
              font-size: 12px;
              font-weight: 600;
              color: var(--text-color-primary);
            }
          }
        }
      }

      .performance-suggestions {
        .suggestions-title {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-color-primary);
          margin-bottom: 12px;
          display: block;
        }

        .suggestions-list {
          .suggestion-item {
            font-size: 13px;
            color: var(--text-color-secondary);
            display: block;
            margin-bottom: 8px;
            line-height: 1.5;
          }
        }
      }
    }
  }
}

@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    opacity: 1;
  }
}

// 响应式优化
@include respond-to('phone') {
  .permission-performance-demo {
    .page-header {
      flex-direction: column;
      gap: 16px;
      align-items: stretch;

      .header-right {
        justify-content: center;
      }
    }

    .health-grid {
      grid-template-columns: 1fr;
    }

    .test-config {
      grid-template-columns: 1fr;
    }

    .results-table {
      .table-header,
      .table-row {
        grid-template-columns: 1fr;
        gap: 8px;

        .header-cell,
        .table-cell {
          text-align: left;
          padding: 4px 0;
          border-bottom: 1px solid var(--border-color-light);
        }
      }
    }

    .demo-stats {
      grid-template-columns: repeat(2, 1fr);
    }

    .log-content .log-entry {
      grid-template-columns: 1fr;
      gap: 4px;
    }

    .stats-grid {
      grid-template-columns: repeat(2, 1fr);
    }

    .queue-details {
      grid-template-columns: 1fr;
    }
  }
}
</style>
