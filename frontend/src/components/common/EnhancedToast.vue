<template>
  <view v-if="show" class="toast-container" :class="[`toast-${type}`, `toast-${position}`]">
    <transition name="toast-fade" appear>
      <view class="toast-content" @click="handleToastClick">
        <!-- Icon -->
        <view class="toast-icon">
          <text class="icon-text">{{ iconText }}</text>
        </view>

        <!-- Content -->
        <view class="toast-body">
          <text v-if="title" class="toast-title">{{ title }}</text>
          <text class="toast-message">{{ message }}</text>

          <!-- Progress bar for auto-dismiss -->
          <view v-if="showProgress && duration > 0" class="toast-progress">
            <view
              class="progress-bar"
              :style="{
                width: progressWidth + '%',
                animationDuration: duration + 'ms'
              }"
            ></view>
          </view>
        </view>

        <!-- Close button -->
        <view v-if="closable" class="toast-close" @click.stop="handleClose">
          <text class="close-icon">×</text>
        </view>

        <!-- Action button -->
        <view v-if="actionText" class="toast-action" @click.stop="handleAction">
          <text class="action-text">{{ actionText }}</text>
        </view>
      </view>
    </transition>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'

interface Props {
  type?: 'success' | 'error' | 'warning' | 'info' | 'loading'
  title?: string
  message: string
  duration?: number // 0 means no auto-dismiss
  position?: 'top' | 'center' | 'bottom'
  closable?: boolean
  showProgress?: boolean
  actionText?: string
  vibrate?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  type: 'info',
  duration: 3000,
  position: 'top',
  closable: true,
  showProgress: false,
  vibrate: false
})

const emit = defineEmits<{
  close: []
  action: []
  click: []
}>()

// State
const show = ref(true)
const progressWidth = ref(100)
let timer: number | null = null
let progressTimer: number | null = null

// Computed
const iconText = computed(() => {
  const iconMap = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
    loading: '⟳'
  }
  return iconMap[props.type]
})

// Methods
const handleClose = () => {
  show.value = false
  clearTimers()
  emit('close')
}

const handleAction = () => {
  emit('action')
  if (props.type !== 'loading') {
    handleClose()
  }
}

const handleToastClick = () => {
  emit('click')
}

const clearTimers = () => {
  if (timer) {
    clearTimeout(timer)
    timer = null
  }
  if (progressTimer) {
    clearInterval(progressTimer)
    progressTimer = null
  }
}

const startAutoDismiss = () => {
  if (props.duration > 0 && props.type !== 'loading') {
    // Start auto-dismiss timer
    timer = setTimeout(() => {
      handleClose()
    }, props.duration)

    // Start progress bar animation
    if (props.showProgress) {
      progressWidth.value = 0
      const progressInterval = 50
      const totalSteps = props.duration / progressInterval
      let currentStep = 0

      progressTimer = setInterval(() => {
        currentStep++
        progressWidth.value = 100 - (currentStep / totalSteps) * 100

        if (currentStep >= totalSteps) {
          clearInterval(progressTimer!)
          progressTimer = null
        }
      }, progressInterval)
    }
  }
}

// Lifecycle
onMounted(() => {
  // Vibrate on error/warning
  if (props.vibrate && (props.type === 'error' || props.type === 'warning')) {
    // #ifndef H5
    uni.vibrateShort()
    // #endif
  }

  startAutoDismiss()
})

onUnmounted(() => {
  clearTimers()
})

// Watch for prop changes
watch(
  () => props.type,
  () => {
    if (props.type === 'loading') {
      clearTimers()
    } else {
      startAutoDismiss()
    }
  }
)

// Expose methods for parent component
defineExpose({
  close: handleClose
})
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';
@import '@/styles/responsive.scss';

.toast-container {
  position: fixed;
  left: 50%;
  transform: translateX(-50%);
  z-index: $z-index-notification;
  max-width: 90vw;
  min-width: 280px;

  // Position variants
  &.toast-top {
    top: calc(var(--status-bar-height, 0px) + 80px);
  }

  &.toast-center {
    top: 50%;
    transform: translate(-50%, -50%);
  }

  &.toast-bottom {
    bottom: calc(var(--safe-area-inset-bottom, 0px) + 80px);
  }
}

.toast-content {
  @include flex-between;
  align-items: flex-start;
  gap: $spacing-sm;
  background: $bg-color-white;
  border-radius: $border-radius-lg;
  padding: $spacing-base $spacing-lg;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  border-left: 4px solid;
  min-height: 48px;
  position: relative;
  overflow: hidden;

  // Touch feedback
  @include touch-feedback(0.98, 0.1s);

  // GPU acceleration for smooth animations
  @include gpu-accelerated;
}

// Type-specific styling
.toast-success .toast-content {
  border-left-color: $success-color;
  background: linear-gradient(135deg, $success-bg 0%, $bg-color-white 100%);
}

.toast-error .toast-content {
  border-left-color: $danger-color;
  background: linear-gradient(135deg, $danger-bg 0%, $bg-color-white 100%);
}

.toast-warning .toast-content {
  border-left-color: $warning-color;
  background: linear-gradient(135deg, $warning-bg 0%, $bg-color-white 100%);
}

.toast-info .toast-content {
  border-left-color: $info-color;
  background: linear-gradient(135deg, $info-bg 0%, $bg-color-white 100%);
}

.toast-loading .toast-content {
  border-left-color: $primary-color;
  background: linear-gradient(135deg, $primary-bg 0%, $bg-color-white 100%);
}

// Icon styling
.toast-icon {
  @include flex-center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  flex-shrink: 0;
}

.toast-success .toast-icon {
  background: $success-color;
  color: white;
}

.toast-error .toast-icon {
  background: $danger-color;
  color: white;
}

.toast-warning .toast-icon {
  background: $warning-color;
  color: white;
}

.toast-info .toast-icon {
  background: $info-color;
  color: white;
}

.toast-loading .toast-icon {
  background: $primary-color;
  color: white;

  .icon-text {
    animation: rotate 1s linear infinite;
  }
}

.icon-text {
  font-size: 16px;
  font-weight: $font-weight-bold;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

// Body content
.toast-body {
  flex: 1;
  min-width: 0;
}

.toast-title {
  display: block;
  font-size: $font-size-base;
  font-weight: $font-weight-semibold;
  color: $text-color;
  margin-bottom: $spacing-xs;
  @include text-ellipsis;
}

.toast-message {
  display: block;
  font-size: $font-size-small;
  color: $text-color-secondary;
  line-height: 1.4;
  word-break: break-word;
}

// Close button
.toast-close {
  @include flex-center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: $transition-base;
  flex-shrink: 0;

  &:hover {
    background: rgba(0, 0, 0, 0.15);
  }

  &:active {
    transform: scale(0.9);
  }
}

.close-icon {
  font-size: 16px;
  color: $text-color-secondary;
  font-weight: $font-weight-bold;
}

// Action button
.toast-action {
  padding: $spacing-xs $spacing-sm;
  border-radius: $border-radius-base;
  background: $primary-color;
  cursor: pointer;
  transition: $transition-base;
  flex-shrink: 0;

  &:hover {
    background: $primary-dark;
  }

  &:active {
    transform: scale(0.95);
  }
}

.action-text {
  font-size: $font-size-small;
  color: white;
  font-weight: $font-weight-medium;
}

// Progress bar
.toast-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: currentColor;
  transition: width linear;
}

.toast-success .progress-bar {
  background: $success-color;
}

.toast-error .progress-bar {
  background: $danger-color;
}

.toast-warning .progress-bar {
  background: $warning-color;
}

.toast-info .progress-bar {
  background: $info-color;
}

.toast-loading .progress-bar {
  background: $primary-color;
}

// Animations
.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.toast-fade-enter-from {
  opacity: 0;
  transform: translateX(-50%) translateY(-20px);
}

.toast-fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-20px);
}

// Mobile optimizations
@include mobile-only {
  .toast-container {
    min-width: auto;
    left: $mobile-padding-x;
    right: $mobile-padding-x;
    transform: none;
    max-width: none;
  }

  .toast-content {
    padding: $mobile-padding-y $mobile-padding-x;
  }

  .toast-message {
    font-size: $font-size-base;
  }
}

// Reduced motion support
@include reduced-motion-safe {
  .toast-fade-enter-active,
  .toast-fade-leave-active {
    transition-duration: 0.01ms !important;
  }

  .icon-text {
    animation: none !important;
  }

  .progress-bar {
    transition: none !important;
  }
}
</style>
