<template>
  <view :class="['branded-loading', `branded-loading--${type}`]">
    <view class="loading-container">
      <!-- Brand Logo -->
      <view class="logo-container">
        <BrandLogo :size="logoSize" :show-subtitle="showSubtitle" class="loading-logo" />
      </view>

      <!-- Loading Animation -->
      <view class="loading-animation">
        <view v-if="type === 'spinner'" class="spinner-container">
          <view class="spinner"></view>
        </view>

        <view v-else-if="type === 'dots'" class="dots-container">
          <view
            v-for="i in 3"
            :key="i"
            class="dot"
            :style="{ animationDelay: `${i * 0.1}s` }"
          ></view>
        </view>

        <view v-else-if="type === 'billiard'" class="billiard-container">
          <view class="billiard-ball">
            <text class="ball-number">8</text>
          </view>
        </view>
      </view>

      <!-- Loading Text -->
      <view class="loading-text">
        <text class="loading-message">{{ message }}</text>
        <text v-if="subtitle" class="loading-subtitle">{{ subtitle }}</text>
      </view>
    </view>

    <!-- Overlay background -->
    <view v-if="overlay" class="loading-overlay"></view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import BrandLogo from './BrandLogo.vue'

interface Props {
  type?: 'spinner' | 'dots' | 'billiard'
  message?: string
  subtitle?: string
  logoSize?: 'small' | 'medium' | 'large'
  showSubtitle?: boolean
  overlay?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  type: 'billiard',
  message: '加载中...',
  subtitle: '',
  logoSize: 'medium',
  showSubtitle: false,
  overlay: false
})

const emit = defineEmits<{
  timeout: []
}>()
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.branded-loading {
  position: relative;
  width: 100%;
  height: 100%;
  @include flex-center;
  flex-direction: column;

  &--spinner,
  &--dots,
  &--billiard {
    min-height: 200px;
  }
}

.loading-container {
  @include flex-center;
  flex-direction: column;
  gap: $spacing-lg;
  padding: $spacing-xl;
  z-index: 2;
}

.logo-container {
  .loading-logo {
    opacity: 0.9;
    animation: logoFadeIn 1s ease-in-out infinite alternate;
  }
}

@keyframes logoFadeIn {
  0% {
    opacity: 0.6;
  }
  100% {
    opacity: 0.9;
  }
}

// Spinner Animation
.spinner-container {
  @include flex-center;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid $border-color-lighter;
  border-top-color: $primary-color;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

// Dots Animation
.dots-container {
  @include flex-center;
  gap: $spacing-sm;
}

.dot {
  width: 12px;
  height: 12px;
  background-color: $primary-color;
  border-radius: 50%;
  animation: bounce 1.4s infinite ease-in-out;
}

@keyframes bounce {
  0%,
  80%,
  100% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

// Billiard Ball Animation
.billiard-container {
  @include flex-center;
}

.billiard-ball {
  width: 50px;
  height: 50px;
  background-color: $primary-color;
  border-radius: 50%;
  @include flex-center;
  border: 2px solid $primary-dark;
  animation: billiardRoll 2s linear infinite;
  box-shadow: 0 4px 8px rgba(37, 99, 235, 0.3);
}

.ball-number {
  color: white;
  font-size: $font-size-large;
  font-weight: $font-weight-bold;
}

@keyframes billiardRoll {
  0% {
    transform: rotate(0deg) translateX(0);
  }
  25% {
    transform: rotate(90deg) translateX(10px);
  }
  50% {
    transform: rotate(180deg) translateX(0);
  }
  75% {
    transform: rotate(270deg) translateX(-10px);
  }
  100% {
    transform: rotate(360deg) translateX(0);
  }
}

// Loading Text
.loading-text {
  text-align: center;
}

.loading-message {
  display: block;
  font-size: $font-size-base;
  color: $text-color-secondary;
  font-weight: $font-weight-medium;
  margin-bottom: $spacing-xs;
}

.loading-subtitle {
  display: block;
  font-size: $font-size-small;
  color: $text-color-placeholder;
}

// Overlay
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(4px);
  z-index: 1;
}

// Size Variants
.branded-loading--small {
  .loading-container {
    gap: $spacing-base;
    padding: $spacing-lg;
  }

  .billiard-ball {
    width: 35px;
    height: 35px;
  }

  .spinner {
    width: 30px;
    height: 30px;
  }

  .dot {
    width: 8px;
    height: 8px;
  }
}

.branded-loading--large {
  .loading-container {
    gap: $spacing-xl;
    padding: $spacing-xl * 2;
  }

  .billiard-ball {
    width: 60px;
    height: 60px;
  }

  .spinner {
    width: 50px;
    height: 50px;
  }

  .dot {
    width: 14px;
    height: 14px;
  }
}

// Dark Mode
@media (prefers-color-scheme: dark) {
  .loading-overlay {
    background-color: rgba(0, 0, 0, 0.8);
  }

  .loading-message {
    color: #ffffff;
  }

  .loading-subtitle {
    color: #cccccc;
  }
}
</style>
