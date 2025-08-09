<template>
  <view :class="['brand-logo', `brand-logo--${size}`]" @click="handleClick">
    <image
      :src="logoSrc"
      :mode="mode"
      class="logo-image"
      :alt="alt"
      @error="handleImageError"
      @load="handleImageLoad"
    />

    <!-- Fallback text logo if image fails to load -->
    <view v-if="showFallback" class="logo-fallback">
      <text class="company-name">耶氏台球</text>
      <text v-if="showSubtitle" class="company-subtitle">斗南销售中心</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

interface Props {
  size?: 'small' | 'medium' | 'large' | 'extra-large'
  showSubtitle?: boolean
  clickable?: boolean
  mode?: 'scaleToFill' | 'aspectFit' | 'aspectFill' | 'widthFix' | 'heightFix'
  alt?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: 'medium',
  showSubtitle: true,
  clickable: false,
  mode: 'aspectFit',
  alt: '耶氏台球斗南销售中心'
})

const emit = defineEmits<{
  click: []
  imageError: []
  imageLoad: []
}>()

// State
const showFallback = ref(false)

// Computed
const logoSrc = computed(() => {
  // Try SVG first, fallback to PNG if needed
  return '/static/logo.svg'
})

// Methods
const handleClick = () => {
  if (props.clickable) {
    emit('click')
  }
}

const handleImageError = () => {
  showFallback.value = true
  emit('imageError')
}

const handleImageLoad = () => {
  showFallback.value = false
  emit('imageLoad')
}
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.brand-logo {
  display: inline-flex;
  align-items: center;
  position: relative;
  user-select: none;

  &--small {
    .logo-image {
      width: 80rpx;
      height: 24rpx;
    }

    .company-name {
      font-size: $font-size-small;
    }

    .company-subtitle {
      font-size: $font-size-extra-small;
    }
  }

  &--medium {
    .logo-image {
      width: 120rpx;
      height: 36rpx;
    }

    .company-name {
      font-size: $font-size-base;
    }

    .company-subtitle {
      font-size: $font-size-small;
    }
  }

  &--large {
    .logo-image {
      width: 160rpx;
      height: 48rpx;
    }

    .company-name {
      font-size: $font-size-large;
    }

    .company-subtitle {
      font-size: $font-size-base;
    }
  }

  &--extra-large {
    .logo-image {
      width: 200rpx;
      height: 60rpx;
    }

    .company-name {
      font-size: $font-size-extra-large;
    }

    .company-subtitle {
      font-size: $font-size-medium;
    }
  }
}

.logo-image {
  transition: $transition-base;
}

.brand-logo[class*='clickable'] {
  cursor: pointer;

  &:hover .logo-image {
    transform: scale(1.05);
  }

  &:active .logo-image {
    transform: scale(0.98);
  }
}

.logo-fallback {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2rpx;
}

.company-name {
  color: $primary-color;
  font-weight: $font-weight-bold;
  line-height: 1.2;
}

.company-subtitle {
  color: $text-color-secondary;
  line-height: 1.2;
  margin-top: -2rpx;
}

// Animation for logo loading
@keyframes logoFadeIn {
  from {
    opacity: 0;
    transform: translateY(-10rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.brand-logo {
  animation: logoFadeIn 0.5s ease-out;
}

// Print styles
@media print {
  .brand-logo {
    .logo-image {
      filter: none !important;
    }

    .company-name {
      color: #000 !important;
    }

    .company-subtitle {
      color: #666 !important;
    }
  }
}
</style>
