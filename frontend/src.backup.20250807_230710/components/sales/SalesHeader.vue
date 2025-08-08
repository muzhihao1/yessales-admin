<template>
  <view class="sales-header">
    <view class="sales-header-content">
      <view class="sales-header-left" @click="handleBack">
        <text v-if="showBack" class="sales-header-back-icon">‹</text>
        <slot name="left"></slot>
      </view>

      <view class="sales-header-center">
        <text class="sales-header-title">{{ title }}</text>
        <slot name="center"></slot>
      </view>

      <view class="sales-header-right">
        <slot name="right"></slot>
      </view>
    </view>

    <!-- 占位元素，防止内容被固定头部遮挡 -->
    <view v-if="fixed" class="sales-header-placeholder"></view>
  </view>
</template>

<script setup lang="ts">
import { defineEmits, defineProps } from 'vue'

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

const handleBack = () => {
  if (props.showBack) {
    uni.navigateBack({
      delta: 1,
      fail: () => {
        // 如果无法返回，则跳转到首页
        uni.switchTab({
          url: '/pages/sales/index'
        })
      }
    })
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

// H5 平台不需要适配状态栏
/* #ifdef H5 */
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
/* #endif */
</style>
