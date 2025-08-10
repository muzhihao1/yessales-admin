<template>
  <div class="sales-header">
    <div class="sales-header-content">
      <div class="sales-header-left" @click="handleBack">
        <span v-if="showBack" class="sales-header-back-icon">‹</span>
        <slot name="left"></slot>
      </div>

      <div class="sales-header-center">
        <span class="sales-header-title">{{ title }}</span>
        <slot name="center"></slot>
      </div>

      <div class="sales-header-right">
        <slot name="right"></slot>
      </div>
    </div>

    <!-- 占位元素，防止内容被固定头部遮挡 -->
    <div v-if="fixed" class="sales-header-placeholder"></div>
  </div>
</template>

<script setup lang="ts">
import { defineEmits, defineProps } from 'vue'
import { useRouter } from 'vue-router'

interface Props {
  title?: string
  showBack?: boolean
  fixed?: boolean
  backgroundColor?: string
  textColor?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  showBack: true,
  fixed: true,
  backgroundColor: '#ffffff',
  textColor: '#303133'
})

const emit = defineEmits<{
  back: []
}>()

const router = useRouter()

const handleBack = () => {
  if (props.showBack) {
    // Try to go back in history
    if (window.history.length > 1) {
      router.back()
    } else {
      // If no history, navigate to sales home
      router.replace('/sales')
    }
    emit('back')
  }
}
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.sales-header {
  &-content {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: $z-index-fixed;
    height: 44px;
    background-color: v-bind(backgroundColor);
    color: v-bind(textColor);
    @include flex-between;
    padding: 0 $spacing-base;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);

    // 适配刘海屏
    padding-top: var(--status-bar-height, 0);
    height: calc(44px + var(--status-bar-height, 0));
  }

  &-placeholder {
    height: 44px;
    padding-top: var(--status-bar-height, 0);
    height: calc(44px + var(--status-bar-height, 0));
  }

  &-left,
  &-right {
    flex: 0 0 auto;
    @include flex-center;
    height: 44px;
  }

  &-center {
    flex: 1;
    @include flex-center;
    height: 44px;
    overflow: hidden;
  }

  &-title {
    font-size: $font-size-large;
    font-weight: $font-weight-medium;
    @include text-ellipsis;
  }

  &-back-icon {
    font-size: 24px;
    padding: 0 $spacing-sm;
    margin-left: -$spacing-sm;
  }
}

// Web platform - no need for status bar adaptation
.sales-header {
  &-content {
    padding-top: 0;
    height: 44px;
  }

  &-placeholder {
    padding-top: 0;
    height: 44px;
  }
}
</style>
