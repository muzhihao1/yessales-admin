<template>
  <button
    class="sales-btn"
    :class="[
      `sales-btn-${type}`,
      `sales-btn-${size}`,
      {
        'sales-btn-block': block,
        'sales-btn-plain': plain,
        'sales-btn-round': round,
        'sales-btn-disabled': disabled,
        'sales-btn-loading': loading
      }
    ]"
    :disabled="disabled || loading"
    @click="handleClick"
  >
    <view v-if="loading" class="sales-btn-loading-icon"></view>
    <text v-if="icon && !loading" class="sales-btn-icon" :class="icon"></text>
    <text class="sales-btn-text">
      <slot>{{ text }}</slot>
    </text>
  </button>
</template>

<script setup lang="ts">
import { defineEmits, defineProps } from 'vue'

interface Props {
  type?: 'primary' | 'success' | 'warning' | 'danger' | 'default'
  size?: 'large' | 'medium' | 'small'
  text?: string
  icon?: string
  block?: boolean
  plain?: boolean
  round?: boolean
  disabled?: boolean
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  type: 'default',
  size: 'medium',
  text: '',
  block: false,
  plain: false,
  round: false,
  disabled: false,
  loading: false
})

const emit = defineEmits<{
  click: [event: Event]
}>()

const handleClick = (event: Event) => {
  if (!props.disabled && !props.loading) {
    emit('click', event)
  }
}
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.sales-btn {
  @include button-base;
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  text-align: center;
  font-weight: 500;
  border: 1px solid transparent;
  cursor: pointer;
  user-select: none;
  transition: $transition-base;

  &:active:not(.sales-btn-disabled) {
    transform: translateY(1px);
  }

  // 尺寸
  &-large {
    height: 52px;
    padding: 0 $spacing-xl;
    font-size: $font-size-large;
    border-radius: $border-radius-base;
  }

  &-medium {
    height: 44px;
    padding: 0 $spacing-lg;
    font-size: $font-size-base;
    border-radius: $border-radius-base;
  }

  &-small {
    height: 32px;
    padding: 0 $spacing-base;
    font-size: $font-size-small;
    border-radius: $border-radius-sm;
  }

  // 类型
  &-primary {
    @include button-variant($primary-color);
  }

  &-success {
    @include button-variant($success-color);
  }

  &-warning {
    @include button-variant($warning-color);
  }

  &-danger {
    @include button-variant($danger-color);
  }

  &-default {
    background-color: $bg-color-white;
    color: $text-color;
    border-color: $border-color;

    &:hover:not(.sales-btn-disabled) {
      color: $primary-color;
      border-color: $primary-color;
    }

    &:active:not(.sales-btn-disabled) {
      color: darken($primary-color, 10%);
      border-color: darken($primary-color, 10%);
    }
  }

  // 朴素按钮
  &-plain {
    background-color: transparent;

    &.sales-btn-primary {
      color: $primary-color;
      border-color: $primary-color;

      &:hover:not(.sales-btn-disabled) {
        background-color: rgba($primary-color, 0.1);
      }
    }

    &.sales-btn-success {
      color: $success-color;
      border-color: $success-color;

      &:hover:not(.sales-btn-disabled) {
        background-color: rgba($success-color, 0.1);
      }
    }

    &.sales-btn-warning {
      color: $warning-color;
      border-color: $warning-color;

      &:hover:not(.sales-btn-disabled) {
        background-color: rgba($warning-color, 0.1);
      }
    }

    &.sales-btn-danger {
      color: $danger-color;
      border-color: $danger-color;

      &:hover:not(.sales-btn-disabled) {
        background-color: rgba($danger-color, 0.1);
      }
    }
  }

  // 块级按钮
  &-block {
    display: block;
    width: 100%;
  }

  // 圆角按钮
  &-round {
    border-radius: 999px;
  }

  // 禁用状态
  &-disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  // 加载状态
  &-loading {
    opacity: 0.8;
    cursor: default;
  }

  &-loading-icon {
    @include loading;
    width: 16px;
    height: 16px;
    margin-right: $spacing-xs;
    border-width: 2px;
  }

  &-icon {
    margin-right: $spacing-xs;
    font-size: inherit;
  }

  &-text {
    display: inline-block;
  }
}

// 暗色主题按钮内的加载图标
.sales-btn-primary,
.sales-btn-success,
.sales-btn-warning,
.sales-btn-danger {
  .sales-btn-loading-icon {
    border-color: rgba(255, 255, 255, 0.3);
    border-top-color: #fff;
  }
}
</style>
