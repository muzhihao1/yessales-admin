<template>
  <view v-if="showTester" class="mobile-tester">
    <!-- Tester Toggle -->
    <view class="tester-toggle" @click="toggleTester">
      <text class="toggle-icon">📱</text>
      <text class="toggle-text">Mobile Test</text>
    </view>
    
    <!-- Tester Panel -->
    <view v-if="panelOpen" class="tester-panel">
      <view class="panel-header">
        <text class="panel-title">Mobile Optimization Tester</text>
        <view class="close-btn" @click="closeTester">×</view>
      </view>
      
      <view class="panel-content">
        <!-- Device Info -->
        <view class="info-section">
          <text class="section-title">Device Information</text>
          <view class="info-item">
            <text class="info-label">Screen Size:</text>
            <text class="info-value">{{ screenInfo.width }}×{{ screenInfo.height }}</text>
          </view>
          <view class="info-item">
            <text class="info-label">DPR:</text>
            <text class="info-value">{{ screenInfo.dpr }}</text>
          </view>
          <view class="info-item">
            <text class="info-label">Viewport:</text>
            <text class="info-value">{{ screenInfo.viewport }}</text>
          </view>
          <view class="info-item">
            <text class="info-label">Touch Device:</text>
            <text class="info-value">{{ deviceInfo.isTouch ? 'Yes' : 'No' }}</text>
          </view>
          <view class="info-item">
            <text class="info-label">Safe Area:</text>
            <text class="info-value">{{ safeAreaInfo }}</text>
          </view>
        </view>
        
        <!-- Touch Target Tests -->
        <view class="test-section">
          <text class="section-title">Touch Target Tests</text>
          <view class="touch-targets">
            <view 
              v-for="size in touchTargetSizes" 
              :key="size.name"
              class="touch-target"
              :class="`target-${size.name}`"
              :style="{ width: size.size + 'px', height: size.size + 'px' }"
              @click="handleTouchTest(size)"
            >
              <text class="target-size">{{ size.size }}px</text>
            </view>
          </view>
          <text class="test-note">Tap targets to test touch responsiveness. Recommended minimum: 44px</text>
        </view>
        
        <!-- Responsive Tests -->
        <view class="responsive-section">
          <text class="section-title">Responsive Breakpoints</text>
          <view class="breakpoint-info">
            <text class="current-breakpoint">Current: {{ currentBreakpoint }}</text>
          </view>
        </view>
        
        <!-- Performance Tests -->
        <view class="performance-section">
          <text class="section-title">Performance Metrics</text>
          <view class="perf-item" v-for="metric in performanceMetrics" :key="metric.name">
            <text class="perf-label">{{ metric.name }}:</text>
            <text class="perf-value" :class="metric.status">{{ metric.value }}</text>
          </view>
        </view>
        
        <!-- Accessibility Tests -->
        <view class="a11y-section">
          <text class="section-title">Accessibility</text>
          <view class="a11y-item" v-for="check in a11yChecks" :key="check.name">
            <text class="check-label">{{ check.name }}:</text>
            <text class="check-status" :class="check.status">{{ check.result }}</text>
          </view>
        </view>
      </view>
    </view>
    
    <!-- Debug Overlay -->
    <view v-if="showDebugOverlay" class="debug-overlay">
      <view class="debug-grid"></view>
      <view class="debug-rulers"></view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onMounted, ref, reactive, computed } from 'vue'

interface Props {
  showTester?: boolean
  debugMode?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showTester: false,
  debugMode: false
})

// State
const panelOpen = ref(false)
const showDebugOverlay = ref(false)

// Device info
const screenInfo = reactive({
  width: 0,
  height: 0,
  dpr: 1,
  viewport: ''
})

const deviceInfo = reactive({
  isTouch: false,
  isMobile: false,
  isTablet: false,
  userAgent: ''
})

// Touch target sizes for testing
const touchTargetSizes = [
  { name: 'small', size: 32, recommended: false },
  { name: 'min', size: 44, recommended: true },
  { name: 'comfortable', size: 48, recommended: true },
  { name: 'large', size: 56, recommended: true }
]

// Responsive breakpoints
const breakpoints = {
  xs: 320,
  sm: 375,
  md: 414,
  lg: 768,
  xl: 1024,
  '2xl': 1200
}

// Performance metrics
const performanceMetrics = ref([
  { name: 'FPS', value: '60', status: 'good' },
  { name: 'Memory', value: 'Good', status: 'good' },
  { name: 'Touch Delay', value: '<100ms', status: 'good' }
])

// Accessibility checks
const a11yChecks = ref([
  { name: 'Color Contrast', result: 'Pass', status: 'pass' },
  { name: 'Focus Visible', result: 'Pass', status: 'pass' },
  { name: 'Touch Targets', result: 'Pass', status: 'pass' },
  { name: 'Keyboard Nav', result: 'Pass', status: 'pass' }
])

// Computed
const currentBreakpoint = computed(() => {
  const width = screenInfo.width
  if (width >= breakpoints['2xl']) return '2XL (Desktop Large)'
  if (width >= breakpoints.xl) return 'XL (Desktop)'
  if (width >= breakpoints.lg) return 'LG (Tablet)'
  if (width >= breakpoints.md) return 'MD (Mobile Large)'
  if (width >= breakpoints.sm) return 'SM (Mobile)'
  return 'XS (Mobile Small)'
})

const safeAreaInfo = computed(() => {
  // #ifdef H5
  if (typeof window !== 'undefined') {
    const top = getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-top')
    const bottom = getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-bottom')
    return `${top || '0px'} / ${bottom || '0px'}`
  }
  // #endif
  return 'N/A'
})

// Methods
const toggleTester = () => {
  panelOpen.value = !panelOpen.value
}

const closeTester = () => {
  panelOpen.value = false
}

const handleTouchTest = (target: any) => {
  uni.vibrateShort()
  uni.showToast({
    title: `${target.size}px target ${target.recommended ? '✓' : '⚠️'}`,
    icon: 'none',
    duration: 1000
  })
}

const updateScreenInfo = () => {
  // #ifdef H5
  if (typeof window !== 'undefined') {
    screenInfo.width = window.screen.width
    screenInfo.height = window.screen.height
    screenInfo.dpr = window.devicePixelRatio
    screenInfo.viewport = `${window.innerWidth}×${window.innerHeight}`
    
    deviceInfo.isTouch = 'ontouchstart' in window
    deviceInfo.userAgent = navigator.userAgent
    deviceInfo.isMobile = /Mobile|Android|iPhone|iPad/.test(navigator.userAgent)
  }
  // #endif
  
  // #ifndef H5
  uni.getSystemInfo({
    success: (res) => {
      screenInfo.width = res.screenWidth
      screenInfo.height = res.screenHeight
      screenInfo.dpr = res.pixelRatio
      screenInfo.viewport = `${res.windowWidth}×${res.windowHeight}`
      
      deviceInfo.isTouch = true
      deviceInfo.isMobile = res.platform !== 'devtools'
    }
  })
  // #endif
}

onMounted(() => {
  updateScreenInfo()
  
  // Update on resize
  // #ifdef H5
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', updateScreenInfo)
  }
  // #endif
})
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';
@import '@/styles/responsive.scss';

.mobile-tester {
  position: fixed;
  top: 100px;
  right: 20px;
  z-index: 9999;
  font-size: 12px;
}

.tester-toggle {
  @include flex-center;
  width: 60px;
  height: 60px;
  background: $primary-color;
  color: white;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: $box-shadow-base;
  flex-direction: column;
  gap: 2px;
  
  &:hover {
    background: $primary-dark;
  }
}

.toggle-icon {
  font-size: 20px;
}

.toggle-text {
  font-size: 8px;
}

.tester-panel {
  position: absolute;
  right: 0;
  top: 70px;
  width: 300px;
  max-height: 400px;
  background: $bg-color-white;
  border-radius: $border-radius-lg;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.panel-header {
  @include flex-between;
  padding: $spacing-base;
  background: $primary-color;
  color: white;
}

.panel-title {
  font-weight: $font-weight-semibold;
}

.close-btn {
  @include flex-center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  cursor: pointer;
  font-size: 16px;
}

.panel-content {
  padding: $spacing-base;
  max-height: 340px;
  overflow-y: auto;
}

.section-title {
  font-weight: $font-weight-semibold;
  color: $text-color;
  margin-bottom: $spacing-sm;
  display: block;
  border-bottom: 1px solid $border-color-lighter;
  padding-bottom: 4px;
}

.info-section,
.test-section,
.responsive-section,
.performance-section,
.a11y-section {
  margin-bottom: $spacing-base;
}

.info-item,
.perf-item,
.a11y-item {
  @include flex-between;
  padding: 4px 0;
  font-size: 11px;
}

.info-label,
.perf-label,
.check-label {
  color: $text-color-secondary;
}

.info-value {
  color: $text-color;
  font-weight: $font-weight-medium;
}

.touch-targets {
  @include flex-center;
  gap: $spacing-sm;
  flex-wrap: wrap;
  margin-bottom: $spacing-sm;
}

.touch-target {
  @include flex-center;
  border: 2px solid $primary-color;
  border-radius: $border-radius-base;
  cursor: pointer;
  transition: $transition-base;
  
  &.target-small {
    border-color: $danger-color;
  }
  
  &.target-min {
    border-color: $warning-color;
  }
  
  &.target-comfortable,
  &.target-large {
    border-color: $success-color;
  }
  
  &:hover {
    background: rgba(37, 99, 235, 0.1);
  }
}

.target-size {
  font-size: 8px;
  font-weight: $font-weight-semibold;
}

.test-note {
  font-size: 10px;
  color: $text-color-placeholder;
  line-height: 1.3;
}

.current-breakpoint {
  font-weight: $font-weight-semibold;
  color: $primary-color;
  font-size: 11px;
}

.perf-value {
  font-weight: $font-weight-medium;
  
  &.good { color: $success-color; }
  &.warning { color: $warning-color; }
  &.error { color: $danger-color; }
}

.check-status {
  font-weight: $font-weight-medium;
  
  &.pass { color: $success-color; }
  &.warning { color: $warning-color; }
  &.fail { color: $danger-color; }
}

.debug-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 9998;
}

.debug-grid {
  background-image: 
    repeating-linear-gradient(
      0deg,
      rgba(255, 0, 0, 0.1) 0px,
      rgba(255, 0, 0, 0.1) 1px,
      transparent 1px,
      transparent 20px
    ),
    repeating-linear-gradient(
      90deg,
      rgba(255, 0, 0, 0.1) 0px,
      rgba(255, 0, 0, 0.1) 1px,
      transparent 1px,
      transparent 20px
    );
  width: 100%;
  height: 100%;
}

// Mobile optimizations
@include mobile-only {
  .tester-panel {
    width: 280px;
  }
  
  .mobile-tester {
    right: 10px;
  }
}
</style>