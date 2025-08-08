<template>
  <view v-if="visible" class="modal-overlay" @click="handleOverlayClick">
    <view class="modal-container" @click.stop>
      <view class="modal-header">
        <text class="modal-title">{{ title }}</text>
        <button class="modal-close" @click="handleCancel">
          <text class="close-icon">×</text>
        </button>
      </view>
      <view class="modal-body">
        <slot></slot>
      </view>
      <view class="modal-footer">
        <button class="modal-btn modal-btn-cancel" @click="handleCancel">
          {{ cancelText }}
        </button>
        <button class="modal-btn modal-btn-confirm" @click="handleConfirm">
          {{ confirmText }}
        </button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { defineEmits, defineProps } from 'vue'

interface Props {
  visible: boolean
  title?: string
  confirmText?: string
  cancelText?: string
  closeOnClickOverlay?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  confirmText: '确定',
  cancelText: '取消',
  closeOnClickOverlay: true
})

const emit = defineEmits<{
  'update:visible': [value: boolean]
  confirm: []
  cancel: []
}>()

function handleOverlayClick() {
  if (props.closeOnClickOverlay) {
    handleCancel()
  }
}

function handleConfirm() {
  emit('confirm')
}

function handleCancel() {
  emit('update:visible', false)
  emit('cancel')
}
</script>

<style lang="scss">
@import '@/styles/variables.scss';

.modal-overlay {
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
  animation: fadeIn 0.3s ease;

  .modal-container {
    background: white;
    border-radius: 8px;
    width: 90%;
    max-width: 500px;
    max-height: 80vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
    animation: slideUp 0.3s ease;

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px;
      border-bottom: 1px solid $border-color;

      .modal-title {
        font-size: 18px;
        font-weight: 600;
        color: $text-color;
      }

      .modal-close {
        width: 32px;
        height: 32px;
        border: none;
        background: transparent;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        border-radius: 4px;
        transition: all 0.3s ease;

        &:hover {
          background: #f5f5f5;
        }

        .close-icon {
          font-size: 24px;
          color: $text-color-secondary;
        }
      }
    }

    .modal-body {
      padding: 20px;
      flex: 1;
      overflow-y: auto;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 20px;
      border-top: 1px solid $border-color;

      .modal-btn {
        padding: 10px 20px;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.3s ease;
        border: none;

        &-cancel {
          background: white;
          color: $text-color-secondary;
          border: 1px solid $border-color;

          &:hover {
            background: #f5f5f5;
          }
        }

        &-confirm {
          background: $primary-color;
          color: white;

          &:hover {
            background: darken($primary-color, 10%);
          }
        }
      }
    }
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

// Mobile responsive
@media (max-width: 768px) {
  .modal-overlay {
    .modal-container {
      width: 95%;
      max-height: 90vh;

      .modal-header {
        padding: 16px;

        .modal-title {
          font-size: 16px;
        }
      }

      .modal-body {
        padding: 16px;
      }

      .modal-footer {
        padding: 16px;
        flex-direction: column-reverse;

        .modal-btn {
          width: 100%;
          padding: 12px;
        }
      }
    }
  }
}
</style>
