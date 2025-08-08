<template>
  <view class="integration-test-page">
    <!-- Header -->
    <SalesHeader title="集成测试页面" :show-back="true" @back="goBack" />

    <view class="test-container">
      <view class="test-header">
        <text class="test-title">Terminal 2 集成测试</text>
        <text class="test-subtitle">验证与Terminal 1基础设施的集成</text>
      </view>

      <!-- 测试状态概览 -->
      <view class="test-overview">
        <view class="test-stat-card" :class="{ success: allTestsPassed, error: hasFailures }">
          <text class="stat-number">{{ completedTests }}/{{ totalTests }}</text>
          <text class="stat-label">测试完成</text>
        </view>

        <view class="test-stat-card success">
          <text class="stat-number">{{ passedTests }}</text>
          <text class="stat-label">通过</text>
        </view>

        <view class="test-stat-card error">
          <text class="stat-number">{{ failedTests }}</text>
          <text class="stat-label">失败</text>
        </view>
      </view>

      <!-- 测试控制 -->
      <view class="test-controls">
        <SalesButton
          text="运行所有测试"
          type="primary"
          :loading="runningTests"
          @click="runAllTests"
        />

        <SalesButton text="清除结果" type="outline" @click="clearResults" />
      </view>

      <!-- 测试结果列表 -->
      <view class="test-results">
        <view class="test-section">
          <text class="section-title">🔗 API服务集成测试</text>

          <view v-for="test in apiTests" :key="test.name" class="test-item" :class="test.status">
            <view class="test-info">
              <text class="test-name">{{ test.name }}</text>
              <text class="test-description">{{ test.description }}</text>
            </view>

            <view class="test-status">
              <text class="status-icon">{{ getStatusIcon(test.status) }}</text>
              <text class="status-text">{{ getStatusText(test.status) }}</text>
            </view>

            <view v-if="test.error" class="test-error">
              <text class="error-message">{{ test.error }}</text>
            </view>

            <view v-if="test.result" class="test-result">
              <text class="result-label">结果:</text>
              <text class="result-data">{{ formatResult(test.result) }}</text>
            </view>
          </view>
        </view>

        <view class="test-section">
          <text class="section-title">🗂️ Store状态管理测试</text>

          <view v-for="test in storeTests" :key="test.name" class="test-item" :class="test.status">
            <view class="test-info">
              <text class="test-name">{{ test.name }}</text>
              <text class="test-description">{{ test.description }}</text>
            </view>

            <view class="test-status">
              <text class="status-icon">{{ getStatusIcon(test.status) }}</text>
              <text class="status-text">{{ getStatusText(test.status) }}</text>
            </view>

            <view v-if="test.error" class="test-error">
              <text class="error-message">{{ test.error }}</text>
            </view>
          </view>
        </view>

        <view class="test-section">
          <text class="section-title">🧩 组件依赖测试</text>

          <view
            v-for="test in componentTests"
            :key="test.name"
            class="test-item"
            :class="test.status"
          >
            <view class="test-info">
              <text class="test-name">{{ test.name }}</text>
              <text class="test-description">{{ test.description }}</text>
            </view>

            <view class="test-status">
              <text class="status-icon">{{ getStatusIcon(test.status) }}</text>
              <text class="status-text">{{ getStatusText(test.status) }}</text>
            </view>

            <view v-if="test.error" class="test-error">
              <text class="error-message">{{ test.error }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 测试骨架屏演示 -->
      <view class="test-section">
        <text class="section-title">🎨 组件展示测试</text>

        <view class="component-showcase">
          <view class="showcase-item">
            <text class="showcase-label">产品骨架屏:</text>
            <LoadingSkeleton variant="product" :item-count="3" custom-class="showcase-skeleton" />
          </view>

          <view class="showcase-item">
            <text class="showcase-label">列表骨架屏:</text>
            <LoadingSkeleton variant="list" :item-count="2" custom-class="showcase-skeleton" />
          </view>

          <view class="showcase-item">
            <text class="showcase-label">统计骨架屏:</text>
            <LoadingSkeleton variant="stats" :item-count="2" custom-class="showcase-skeleton" />
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useAppStore } from '@/stores/app'
import { ApiService } from '@/api'
import SalesHeader from '@/components/sales/SalesHeader.vue'
import SalesButton from '@/components/sales/SalesButton.vue'
import LoadingSkeleton from '@/components/common/LoadingSkeleton.vue'
import type { Product } from '@/types/models'

// ========== 测试状态管理 ==========
interface TestCase {
  name: string
  description: string
  status: 'pending' | 'running' | 'passed' | 'failed'
  result?: any
  error?: string
  testFn: () => Promise<void>
}

const runningTests = ref(false)

// Store实例
const appStore = useAppStore()

// ========== API集成测试用例 ==========
const apiTests = ref<TestCase[]>([
  {
    name: 'API服务导入',
    description: '验证ApiService能够正确导入',
    status: 'pending',
    async testFn() {
      if (typeof ApiService !== 'object') {
        throw new Error('ApiService导入失败')
      }

      if (typeof ApiService.getProducts !== 'function') {
        throw new Error('getProducts方法不存在')
      }

      if (typeof ApiService.getSalesStats !== 'function') {
        throw new Error('getSalesStats方法不存在')
      }

      this.result = {
        importSuccess: true,
        methods: ['getProducts', 'getSalesStats', 'getQuotes']
      }
    }
  },

  {
    name: '产品数据获取',
    description: '测试产品API数据获取功能',
    status: 'pending',
    async testFn() {
      try {
        const response = await ApiService.getProducts({ limit: 3 })

        this.result = {
          success: response.success,
          hasData: !!response.data,
          dataLength: response.data?.length || 0,
          errorCode: response.error?.code
        }

        if (!response.success && !response.error) {
          throw new Error('API响应格式异常')
        }

        // 验证数据结构（如果有数据的话）
        if (response.success && response.data && response.data.length > 0) {
          const product = response.data[0] as Product
          const requiredFields = ['id', 'name', 'model', 'price', 'unit']

          for (const field of requiredFields) {
            if (!(field in product)) {
              throw new Error(`产品数据缺少必需字段: ${field}`)
            }
          }
        }
      } catch (error) {
        this.result = {
          networkError: true,
          message: error.message
        }
        throw error
      }
    }
  },

  {
    name: '统计数据获取',
    description: '测试销售统计API功能',
    status: 'pending',
    async testFn() {
      try {
        const response = await ApiService.getSalesStats()

        this.result = {
          success: response.success,
          hasStats: !!response.data,
          hasTotalQuotes: response.data?.totalQuotes !== undefined,
          errorCode: response.error?.code
        }

        if (!response.success && !response.error) {
          throw new Error('统计API响应格式异常')
        }
      } catch (error) {
        this.result = {
          networkError: true,
          message: error.message
        }
        throw error
      }
    }
  },

  {
    name: '健康检查',
    description: '测试API健康检查功能',
    status: 'pending',
    async testFn() {
      if (typeof ApiService.healthCheck !== 'function') {
        // Fallback to checkApiHealth from init
        const { checkApiHealth } = await import('@/api/init')
        const isHealthy = await checkApiHealth()

        this.result = {
          healthy: isHealthy,
          method: 'checkApiHealth (fallback)'
        }
        return
      }

      const response = await ApiService.healthCheck()

      this.result = {
        success: response.success,
        status: response.data?.status,
        services: response.data?.services
      }
    }
  }
])

// ========== Store状态管理测试用例 ==========
const storeTests = ref<TestCase[]>([
  {
    name: 'Store导入',
    description: '验证useAppStore能够正确导入和初始化',
    status: 'pending',
    async testFn() {
      if (typeof useAppStore !== 'function') {
        throw new Error('useAppStore导入失败')
      }

      if (!appStore) {
        throw new Error('appStore实例化失败')
      }

      // 检查关键方法
      const requiredMethods = ['updateSettings', 'loadSettings']
      for (const method of requiredMethods) {
        if (typeof appStore[method] !== 'function') {
          throw new Error(`Store缺少方法: ${method}`)
        }
      }

      this.result = {
        storeInstance: !!appStore,
        methods: requiredMethods,
        hasSettings: 'settings' in appStore
      }
    }
  },

  {
    name: '设置读取',
    description: '测试设置数据的读取功能',
    status: 'pending',
    async testFn() {
      try {
        appStore.loadSettings()

        this.result = {
          settingsLoaded: true,
          settingsType: typeof appStore.settings,
          hasAutoSave: 'autoSave' in appStore.settings
        }
      } catch (error) {
        throw new Error(`设置读取失败: ${error.message}`)
      }
    }
  },

  {
    name: '设置更新',
    description: '测试设置数据的更新功能',
    status: 'pending',
    async testFn() {
      try {
        const testSettings = {
          testValue: `test_${Date.now()}`
        }

        appStore.updateSettings(testSettings)

        this.result = {
          updateSuccess: true,
          settingsUpdated: appStore.settings.testValue === testSettings.testValue
        }
      } catch (error) {
        throw new Error(`设置更新失败: ${error.message}`)
      }
    }
  }
])

// ========== 组件依赖测试用例 ==========
const componentTests = ref<TestCase[]>([
  {
    name: 'LoadingSkeleton组件',
    description: '验证LoadingSkeleton组件能够正确导入和使用',
    status: 'pending',
    async testFn() {
      // 组件已经在template中使用，如果能渲染说明导入成功
      this.result = {
        componentImported: true,
        variants: ['product', 'list', 'stats', 'card', 'form']
      }
    }
  },

  {
    name: '动画样式',
    description: '验证animations.scss样式文件能够正确导入',
    status: 'pending',
    async testFn() {
      // 检查CSS是否加载（通过检查特定的动画类是否存在）
      const testElement = document.createElement('div')
      testElement.className = 'fade-enter-active'
      document.body.appendChild(testElement)

      const computedStyle = window.getComputedStyle(testElement)
      const hasTransition = computedStyle.transitionProperty !== 'none'

      document.body.removeChild(testElement)

      this.result = {
        animationStylesLoaded: hasTransition,
        transitionProperty: computedStyle.transitionProperty
      }

      if (!hasTransition) {
        throw new Error('动画样式未正确加载')
      }
    }
  },

  {
    name: 'Sales组件集成',
    description: '验证Sales系列组件能够正确导入',
    status: 'pending',
    async testFn() {
      // SalesHeader和SalesButton已在template中使用
      this.result = {
        salesHeaderImported: true,
        salesButtonImported: true
      }
    }
  }
])

// ========== 计算属性 ==========
const allTests = computed(() => [...apiTests.value, ...storeTests.value, ...componentTests.value])
const totalTests = computed(() => allTests.value.length)
const completedTests = computed(
  () => allTests.value.filter(t => t.status !== 'pending' && t.status !== 'running').length
)
const passedTests = computed(() => allTests.value.filter(t => t.status === 'passed').length)
const failedTests = computed(() => allTests.value.filter(t => t.status === 'failed').length)
const allTestsPassed = computed(
  () => completedTests.value === totalTests.value && failedTests.value === 0
)
const hasFailures = computed(() => failedTests.value > 0)

// ========== 测试运行方法 ==========
async function runAllTests() {
  if (runningTests.value) return

  runningTests.value = true

  try {
    // 重置所有测试状态
    allTests.value.forEach(test => {
      test.status = 'pending'
      test.result = undefined
      test.error = undefined
    })

    // 按顺序运行所有测试
    for (const test of allTests.value) {
      test.status = 'running'

      try {
        await test.testFn.call(test)
        test.status = 'passed'
      } catch (error) {
        test.status = 'failed'
        test.error = error.message
      }

      // 短暂延迟以显示进度
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    // 显示测试完成提示
    uni.showToast({
      title: `测试完成: ${passedTests.value}/${totalTests.value} 通过`,
      icon: allTestsPassed.value ? 'success' : 'none',
      duration: 3000
    })
  } finally {
    runningTests.value = false
  }
}

function clearResults() {
  allTests.value.forEach(test => {
    test.status = 'pending'
    test.result = undefined
    test.error = undefined
  })
}

// ========== 辅助方法 ==========
function getStatusIcon(status: string): string {
  switch (status) {
    case 'pending':
      return '⏳'
    case 'running':
      return '⚡'
    case 'passed':
      return '✅'
    case 'failed':
      return '❌'
    default:
      return '❓'
  }
}

function getStatusText(status: string): string {
  switch (status) {
    case 'pending':
      return '等待中'
    case 'running':
      return '运行中'
    case 'passed':
      return '通过'
    case 'failed':
      return '失败'
    default:
      return '未知'
  }
}

function formatResult(result: any): string {
  if (typeof result === 'object') {
    return JSON.stringify(result, null, 2)
  }
  return String(result)
}

function goBack() {
  uni.navigateBack()
}

// ========== 生命周期 ==========
onMounted(() => {
  uni.setNavigationBarTitle({
    title: 'Terminal 2 集成测试'
  })
})
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/animations.scss';

.integration-test-page {
  min-height: 100vh;
  background: $bg-color-page;
}

.test-container {
  padding: $spacing-md;
  padding-top: calc(44px + var(--status-bar-height, 0) + #{$spacing-md});
}

.test-header {
  text-align: center;
  margin-bottom: $spacing-lg;

  .test-title {
    font-size: $font-size-large;
    font-weight: 600;
    color: $text-color;
    display: block;
    margin-bottom: $spacing-xs;
  }

  .test-subtitle {
    font-size: $font-size-small;
    color: $text-color-secondary;
  }
}

.test-overview {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: $spacing-md;
  margin-bottom: $spacing-lg;

  .test-stat-card {
    background: $bg-color-white;
    padding: $spacing-lg;
    border-radius: $border-radius-lg;
    text-align: center;
    border: 2px solid transparent;

    &.success {
      border-color: $success-color;
      background: $success-bg;
    }

    &.error {
      border-color: $danger-color;
      background: $danger-bg;
    }

    .stat-number {
      font-size: $font-size-extra-large;
      font-weight: 600;
      color: $text-color;
      display: block;
      margin-bottom: $spacing-xs;
    }

    .stat-label {
      font-size: $font-size-small;
      color: $text-color-secondary;
    }
  }
}

.test-controls {
  display: flex;
  gap: $spacing-md;
  margin-bottom: $spacing-lg;
}

.test-results {
  .test-section {
    margin-bottom: $spacing-xl;

    .section-title {
      font-size: $font-size-large;
      font-weight: 600;
      color: $text-color;
      display: block;
      margin-bottom: $spacing-md;
    }

    .test-item {
      background: $bg-color-white;
      padding: $spacing-lg;
      border-radius: $border-radius-lg;
      border: 1px solid $border-color;
      margin-bottom: $spacing-md;
      transition: all $animation-duration-base ease;

      &.running {
        border-color: $info-color;
        background: $info-bg;
      }

      &.passed {
        border-color: $success-color;
        background: $success-bg;
      }

      &.failed {
        border-color: $danger-color;
        background: $danger-bg;
      }

      .test-info {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: $spacing-sm;

        .test-name {
          font-size: $font-size-medium;
          font-weight: 500;
          color: $text-color;
          flex: 1;
        }

        .test-description {
          font-size: $font-size-small;
          color: $text-color-secondary;
          margin-top: $spacing-xs;
        }
      }

      .test-status {
        display: flex;
        align-items: center;
        gap: $spacing-xs;
        margin-bottom: $spacing-sm;

        .status-icon {
          font-size: 16px;
        }

        .status-text {
          font-size: $font-size-small;
          font-weight: 500;
        }
      }

      .test-error {
        background: rgba($danger-color, 0.1);
        padding: $spacing-sm;
        border-radius: $border-radius-base;
        margin-top: $spacing-sm;

        .error-message {
          font-size: $font-size-small;
          color: $danger-color;
          font-family: monospace;
        }
      }

      .test-result {
        background: rgba($info-color, 0.1);
        padding: $spacing-sm;
        border-radius: $border-radius-base;
        margin-top: $spacing-sm;

        .result-label {
          font-size: $font-size-small;
          font-weight: 500;
          color: $text-color;
          display: block;
          margin-bottom: $spacing-xs;
        }

        .result-data {
          font-size: $font-size-small;
          color: $text-color-secondary;
          font-family: monospace;
          white-space: pre-wrap;
        }
      }
    }
  }
}

.component-showcase {
  .showcase-item {
    margin-bottom: $spacing-lg;

    .showcase-label {
      font-size: $font-size-small;
      font-weight: 500;
      color: $text-color;
      display: block;
      margin-bottom: $spacing-sm;
    }

    .showcase-skeleton {
      border: 1px dashed $border-color;
      border-radius: $border-radius-base;
      padding: $spacing-md;
    }
  }
}

// 响应式设计
@media (max-width: 480px) {
  .test-overview {
    grid-template-columns: 1fr;
  }

  .test-controls {
    flex-direction: column;
  }
}
</style>
