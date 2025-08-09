<template>
  <view class="test-index-page">
    <!-- Header -->
    <SalesHeader title="测试中心" :show-back="true" @back="goBack" />

    <view class="test-container">
      <view class="test-header">
        <text class="test-title">YesSales 测试中心</text>
        <text class="test-subtitle">全方位验证系统功能、性能和用户体验</text>
      </view>

      <!-- Quick Stats -->
      <view class="quick-stats">
        <view class="stat-card">
          <text class="stat-number">3</text>
          <text class="stat-label">测试套件</text>
        </view>
        <view class="stat-card">
          <text class="stat-number">{{ totalTestCount }}+</text>
          <text class="stat-label">测试用例</text>
        </view>
        <view class="stat-card">
          <text class="stat-number">100%</text>
          <text class="stat-label">覆盖率目标</text>
        </view>
      </view>

      <!-- Test Suites -->
      <view class="test-suites">
        <!-- Comprehensive Test Suite -->
        <view class="test-suite-card featured" @click="navigateToComprehensive">
          <view class="suite-header">
            <view class="suite-icon">🧪</view>
            <view class="suite-info">
              <text class="suite-name">综合功能测试</text>
              <text class="suite-description">全面的功能、性能、可访问性和移动端测试</text>
            </view>
            <view class="suite-badge">
              <text class="badge-text">推荐</text>
            </view>
          </view>
          
          <view class="suite-features">
            <text class="feature-item">✅ 报价创建流程测试</text>
            <text class="feature-item">⚡ 性能和内存监控</text>
            <text class="feature-item">♿ 可访问性合规验证</text>
            <text class="feature-item">📱 移动端交互测试</text>
            <text class="feature-item">📊 详细报告导出</text>
          </view>
          
          <view class="suite-action">
            <SalesButton size="small" type="primary">开始综合测试</SalesButton>
          </view>
        </view>

        <!-- API Integration Tests -->
        <view class="test-suite-card" @click="navigateToIntegration">
          <view class="suite-header">
            <view class="suite-icon">🔗</view>
            <view class="suite-info">
              <text class="suite-name">API集成测试</text>
              <text class="suite-description">验证后端API服务和数据层集成</text>
            </view>
          </view>
          
          <view class="suite-features">
            <text class="feature-item">🔌 API服务连接性</text>
            <text class="feature-item">📡 数据获取和处理</text>
            <text class="feature-item">🏪 Store状态管理</text>
            <text class="feature-item">🧩 组件依赖验证</text>
          </view>
          
          <view class="suite-action">
            <SalesButton size="small" type="default">集成测试</SalesButton>
          </view>
        </view>

        <!-- Mobile Adaptation Tests -->
        <view class="test-suite-card" @click="navigateToMobile">
          <view class="suite-header">
            <view class="suite-icon">📱</view>
            <view class="suite-info">
              <text class="suite-name">移动端适配测试</text>
              <text class="suite-description">响应式设计和移动交互体验验证</text>
            </view>
          </view>
          
          <view class="suite-features">
            <text class="feature-item">📐 响应式断点测试</text>
            <text class="feature-item">👆 触摸目标验证</text>
            <text class="feature-item">🎬 动画性能测试</text>
            <text class="feature-item">🛡️ 安全区域适配</text>
          </view>
          
          <view class="suite-action">
            <SalesButton size="small" type="default">移动测试</SalesButton>
          </view>
        </view>
      </view>

      <!-- Quick Actions -->
      <view class="quick-actions">
        <text class="section-title">快速操作</text>
        
        <view class="action-grid">
          <view class="action-item" @click="runAllTests">
            <view class="action-icon">🚀</view>
            <text class="action-label">运行全部测试</text>
          </view>
          
          <view class="action-item" @click="viewReports">
            <view class="action-icon">📊</view>
            <text class="action-label">查看测试报告</text>
          </view>
          
          <view class="action-item" @click="exportResults">
            <view class="action-icon">💾</view>
            <text class="action-label">导出测试结果</text>
          </view>
          
          <view class="action-item" @click="clearCache">
            <view class="action-icon">🗑️</view>
            <text class="action-label">清除缓存</text>
          </view>
        </view>
      </view>

      <!-- Testing Guidelines -->
      <view class="testing-guidelines">
        <text class="section-title">测试指南</text>
        
        <view class="guideline-card">
          <text class="guideline-title">📋 测试前准备</text>
          <text class="guideline-content">
            确保网络连接稳定，建议在不同设备和屏幕尺寸下进行测试。
          </text>
        </view>
        
        <view class="guideline-card">
          <text class="guideline-title">⚡ 性能测试建议</text>
          <text class="guideline-content">
            关闭其他应用以获得准确的内存和性能指标，避免测试期间的干扰。
          </text>
        </view>
        
        <view class="guideline-card">
          <text class="guideline-title">♿ 可访问性测试</text>
          <text class="guideline-content">
            使用键盘导航测试焦点顺序，检查色彩对比度和屏幕阅读器兼容性。
          </text>
        </view>
        
        <view class="guideline-card">
          <text class="guideline-title">📱 移动端测试</text>
          <text class="guideline-content">
            旋转设备测试横屏适配，验证触摸目标尺寸符合最小44px标准。
          </text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import SalesHeader from '@/components/sales/SalesHeader.vue'
import SalesButton from '@/components/sales/SalesButton.vue'
import { useToast } from '@/composables/useToast'

const router = useRouter()
const toast = useToast()

// Estimated total test count across all suites
const totalTestCount = computed(() => {
  return 15 // Approximate total across comprehensive + integration + mobile tests
})

// Navigation methods
function navigateToComprehensive() {
  console.log('🧪 Navigate to Comprehensive Tests')
  if (typeof window !== 'undefined' && window.location) {
    router.push('/test/comprehensive')
  } else {
    uni.navigateTo({
      url: '/pages/test/comprehensive'
    })
  }
}

function navigateToIntegration() {
  console.log('🔗 Navigate to Integration Tests')
  if (typeof window !== 'undefined' && window.location) {
    router.push('/test/integration')
  } else {
    uni.navigateTo({
      url: '/pages/test/integration'
    })
  }
}

function navigateToMobile() {
  console.log('📱 Navigate to Mobile Tests')
  if (typeof window !== 'undefined' && window.location) {
    router.push('/test/mobile-adaptation')
  } else {
    uni.navigateTo({
      url: '/pages/test/mobile-adaptation'
    })
  }
}

function goBack() {
  if (typeof window !== 'undefined' && window.history.length > 1) {
    window.history.back()
  } else {
    uni.navigateBack()
  }
}

// Quick actions
function runAllTests() {
  toast.info('即将启动全面测试套件...')
  setTimeout(() => {
    navigateToComprehensive()
  }, 1000)
}

function viewReports() {
  toast.info('测试报告功能开发中')
}

function exportResults() {
  toast.info('请在综合测试页面进行结果导出')
}

function clearCache() {
  // Clear local storage cache
  try {
    localStorage.clear()
    toast.success('缓存已清除')
  } catch (error) {
    toast.error('缓存清除失败')
  }
}

onMounted(() => {
  console.log('🏠 Test Center loaded')
  
  uni.setNavigationBarTitle({
    title: '测试中心'
  })
})
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';
@import '@/styles/responsive.scss';

.test-index-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
}

.test-container {
  padding: 0 $spacing-base;
  padding-top: calc(44px + var(--status-bar-height, 0) + #{$spacing-base});
  padding-bottom: $spacing-xl;
  
  @include safe-area-padding;
}

.test-header {
  text-align: center;
  margin-bottom: $spacing-xl;
  
  .test-title {
    font-size: $font-size-extra-large;
    font-weight: 600;
    color: $text-color;
    display: block;
    margin-bottom: $spacing-xs;
  }
  
  .test-subtitle {
    font-size: $font-size-base;
    color: $text-color-secondary;
    line-height: 1.5;
  }
}

.quick-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: $spacing-base;
  margin-bottom: $spacing-xl;
  
  .stat-card {
    background: $bg-color-white;
    padding: $spacing-lg;
    border-radius: $border-radius-lg;
    text-align: center;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    
    .stat-number {
      font-size: $font-size-extra-large;
      font-weight: 600;
      color: $primary-color;
      display: block;
      margin-bottom: $spacing-xs;
    }
    
    .stat-label {
      font-size: $font-size-small;
      color: $text-color-secondary;
    }
  }
}

.test-suites {
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;
  margin-bottom: $spacing-xl;
}

.test-suite-card {
  background: $bg-color-white;
  border-radius: $border-radius-lg;
  padding: $spacing-lg;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  cursor: pointer;
  border: 2px solid transparent;
  
  &.featured {
    border-color: $primary-color;
    box-shadow: 0 8px 16px rgba(37, 99, 235, 0.15);
  }
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
  }
  
  &:active {
    transform: scale(0.98);
  }
}

.suite-header {
  display: flex;
  align-items: flex-start;
  gap: $spacing-base;
  margin-bottom: $spacing-base;
  position: relative;
  
  .suite-icon {
    font-size: 32px;
    flex-shrink: 0;
  }
  
  .suite-info {
    flex: 1;
    
    .suite-name {
      font-size: $font-size-large;
      font-weight: 600;
      color: $text-color;
      display: block;
      margin-bottom: $spacing-xs;
    }
    
    .suite-description {
      font-size: $font-size-small;
      color: $text-color-secondary;
      line-height: 1.4;
    }
  }
  
  .suite-badge {
    position: absolute;
    top: -4px;
    right: 0;
    background: $primary-color;
    color: white;
    padding: 2px 8px;
    border-radius: 12px;
    
    .badge-text {
      font-size: $font-size-extra-small;
      font-weight: 500;
    }
  }
}

.suite-features {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
  margin-bottom: $spacing-lg;
  
  .feature-item {
    font-size: $font-size-small;
    color: $text-color-secondary;
    padding-left: $spacing-sm;
  }
}

.suite-action {
  display: flex;
  justify-content: flex-end;
}

.quick-actions,
.testing-guidelines {
  margin-bottom: $spacing-xl;
  
  .section-title {
    font-size: $font-size-large;
    font-weight: 600;
    color: $text-color;
    display: block;
    margin-bottom: $spacing-base;
  }
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $spacing-base;
  
  @include tablet-up {
    grid-template-columns: repeat(4, 1fr);
  }
}

.action-item {
  background: $bg-color-white;
  padding: $spacing-lg;
  border-radius: $border-radius-lg;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  cursor: pointer;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
  
  &:active {
    transform: scale(0.98);
  }
  
  .action-icon {
    font-size: 24px;
    margin-bottom: $spacing-sm;
  }
  
  .action-label {
    font-size: $font-size-small;
    color: $text-color;
    font-weight: 500;
  }
}

.guideline-card {
  background: $bg-color-white;
  padding: $spacing-base;
  border-radius: $border-radius-base;
  margin-bottom: $spacing-sm;
  border-left: 4px solid $primary-color;
  
  .guideline-title {
    font-size: $font-size-base;
    font-weight: 600;
    color: $text-color;
    display: block;
    margin-bottom: $spacing-xs;
  }
  
  .guideline-content {
    font-size: $font-size-small;
    color: $text-color-secondary;
    line-height: 1.5;
  }
}

// Mobile optimizations
@include mobile-only {
  .quick-stats {
    grid-template-columns: 1fr;
    text-align: center;
    
    .stat-card {
      display: flex;
      align-items: center;
      justify-content: space-between;
      text-align: left;
      
      .stat-number {
        margin-bottom: 0;
      }
    }
  }
  
  .action-grid {
    grid-template-columns: 1fr;
  }
  
  .suite-header {
    flex-direction: column;
    text-align: center;
    
    .suite-badge {
      position: static;
      align-self: center;
      margin-top: $spacing-xs;
    }
  }
}
</style>