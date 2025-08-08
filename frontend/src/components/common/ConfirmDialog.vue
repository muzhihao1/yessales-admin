<template>
  <view v-if="visible" class="confirm-dialog-overlay" @click="handleOverlayClick">
    <view class="confirm-dialog" @click.stop>
      <!-- Header -->
      <view class="dialog-header">
        <text class="dialog-title">{{ title }}</text>
        <button class="close-btn" @click="handleCancel">
          <text>×</text>
        </button>
      </view>

      <!-- Content -->
      <view class="dialog-content">
        <view v-if="icon" class="dialog-icon">
          <text :class="iconClass">{{ iconText }}</text>
        </view>
        <view class="dialog-message">
          <text class="message-text">{{ message }}</text>
          <view v-if="details" class="message-details">
            <text v-for="detail in details" :key="detail" class="detail-item">
              {{ detail }}
            </text>
          </view>
        </view>
      </view>

      <!-- Actions -->
      <view class="dialog-actions">
        <button class="dialog-btn cancel-btn" @click="handleCancel">
          <text>{{ cancelText }}</text>
        </button>
        <button
          class="dialog-btn confirm-btn"
          :class="confirmButtonClass"
          @click="handleConfirm"
          :disabled="loading"
        >
          <text>{{ loading ? loadingText : confirmText }}</text>
        </button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  visible: boolean
  title: string
  message: string
  details?: string[]
  confirmText?: string
  cancelText?: string
  loadingText?: string
  type?: 'default' | 'danger' | 'warning' | 'info' | 'success'
  icon?: boolean
  loading?: boolean
  closeOnOverlay?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  confirmText: '确认',
  cancelText: '取消',
  loadingText: '处理中...',
  type: 'default',
  icon: true,
  loading: false,
  closeOnOverlay: true
})

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

// Computed properties
const confirmButtonClass = computed(() => {
  return `btn-${props.type}`
})

const iconClass = computed(() => {
  return `icon icon-${props.type}`
})

const iconText = computed(() => {
  const icons = {
    default: '?',
    danger: '⚠',
    warning: '⚠',
    info: 'ℹ',
    success: '✓'
  }
  return icons[props.type] || icons.default
})

// Methods
function handleConfirm() {
  if (props.loading) return
  emit('confirm')
}

function handleCancel() {
  emit('cancel')
}

function handleOverlayClick() {
  if (props.closeOnOverlay) {
    handleCancel()
  }
}
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.confirm-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: $spacing-lg;
}

.confirm-dialog {
  background: $bg-color-white;
  border-radius: $border-radius-lg;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  min-width: 400px;
  max-width: 500px;
  width: 100%;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $spacing-lg;
  border-bottom: 1px solid $border-color;

  .dialog-title {
    font-size: $font-size-large;
    font-weight: 600;
    color: $text-color;
  }

  .close-btn {
    width: 32px;
    height: 32px;
    border: none;
    background: none;
    color: $text-color-secondary;
    font-size: 24px;
    cursor: pointer;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
      background: $bg-color;
      color: $text-color;
    }
  }
}

.dialog-content {
  padding: $spacing-lg;
  flex: 1;
  overflow-y: auto;

  .dialog-icon {
    text-align: center;
    margin-bottom: $spacing-lg;

    .icon {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      font-weight: bold;

      &.icon-default {
        background: rgba($primary-color, 0.1);
        color: $primary-color;
      }

      &.icon-danger {
        background: rgba($danger-color, 0.1);
        color: $danger-color;
      }

      &.icon-warning {
        background: rgba($warning-color, 0.1);
        color: $warning-color;
      }

      &.icon-info {
        background: rgba($info-color, 0.1);
        color: $info-color;
      }

      &.icon-success {
        background: rgba($success-color, 0.1);
        color: $success-color;
      }
    }
  }

  .dialog-message {
    .message-text {
      font-size: $font-size-base;
      color: $text-color;
      line-height: 1.5;
      display: block;
    }

    .message-details {
      margin-top: $spacing-base;
      padding: $spacing-sm;
      background: $bg-color;
      border-radius: $border-radius-base;

      .detail-item {
        display: block;
        font-size: $font-size-small;
        color: $text-color-secondary;
        line-height: 1.4;
        margin-bottom: $spacing-xs;

        &:last-child {
          margin-bottom: 0;
        }

        &:before {
          content: '•';
          margin-right: $spacing-xs;
          color: $primary-color;
        }
      }
    }
  }
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: $spacing-base;
  padding: $spacing-lg;
  border-top: 1px solid $border-color;
  background: $bg-color;

  .dialog-btn {
    padding: $spacing-sm $spacing-lg;
    border-radius: $border-radius-base;
    font-size: $font-size-base;
    cursor: pointer;
    transition: all 0.3s ease;
    min-width: 80px;

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }

  .cancel-btn {
    background: $bg-color-white;
    color: $text-color-secondary;
    border: 1px solid $border-color;

    &:hover:not(:disabled) {
      background: $bg-color;
      color: $text-color;
    }
  }

  .confirm-btn {
    color: white;
    border: none;

    &.btn-default {
      background: $primary-color;

      &:hover:not(:disabled) {
        background: $primary-dark;
      }
    }

    &.btn-danger {
      background: $danger-color;

      &:hover:not(:disabled) {
        background: $danger-dark;
      }
    }

    &.btn-warning {
      background: $warning-color;

      &:hover:not(:disabled) {
        background: $warning-dark;
      }
    }

    &.btn-info {
      background: $info-color;

      &:hover:not(:disabled) {
        background: $info-dark;
      }
    }

    &.btn-success {
      background: $success-color;

      &:hover:not(:disabled) {
        background: $success-dark;
      }
    }
  }
}

// Responsive design
@media (max-width: 768px) {
  .confirm-dialog-overlay {
    padding: $spacing-base;
  }

  .confirm-dialog {
    min-width: 0;
    width: 100%;
    max-width: none;
  }

  .dialog-actions {
    .dialog-btn {
      flex: 1;
    }
  }
}
</style>
