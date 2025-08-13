<template>
  <view class="settings-validation-feedback">
    <!-- Success state -->
    <view v-if="state === 'success'" class="feedback-container success" :class="{ show: visible }">
      <view class="feedback-icon">
        <text>✓</text>
      </view>
      <view class="feedback-content">
        <text class="feedback-title">设置已保存</text>
        <text v-if="successMessage" class="feedback-message">{{ successMessage }}</text>
      </view>
      <button v-if="dismissible" class="feedback-close" @click="dismiss">
        <text>✕</text>
      </button>
    </view>

    <!-- Error state -->
    <view v-if="state === 'error'" class="feedback-container error" :class="{ show: visible }">
      <view class="feedback-icon">
        <text>✕</text>
      </view>
      <view class="feedback-content">
        <text class="feedback-title">保存失败</text>
        <text class="feedback-message">{{ errorMessage || '请检查输入内容并重试' }}</text>

        <!-- Error details -->
        <view v-if="errorDetails && errorDetails.length > 0" class="error-details">
          <text class="details-title">详细信息：</text>
          <view class="details-list">
            <text v-for="(detail, index) in errorDetails" :key="index" class="detail-item">
              • {{ detail }}
            </text>
          </view>
        </view>
      </view>

      <view class="feedback-actions">
        <button class="action-btn retry" @click="$emit('retry')">
          <text>重试</text>
        </button>
        <button v-if="dismissible" class="action-btn dismiss" @click="dismiss">
          <text>✕</text>
        </button>
      </view>
    </view>

    <!-- Warning state -->
    <view v-if="state === 'warning'" class="feedback-container warning" :class="{ show: visible }">
      <view class="feedback-icon">
        <text>⚠</text>
      </view>
      <view class="feedback-content">
        <text class="feedback-title">需要注意</text>
        <text class="feedback-message">{{ warningMessage }}</text>

        <!-- Warning suggestions -->
        <view v-if="suggestions && suggestions.length > 0" class="warning-suggestions">
          <text class="suggestions-title">建议：</text>
          <view class="suggestions-list">
            <button
              v-for="(suggestion, index) in suggestions"
              :key="index"
              class="suggestion-item"
              @click="$emit('apply-suggestion', suggestion.action)"
            >
              <text class="suggestion-text">{{ suggestion.text }}</text>
              <text class="suggestion-arrow">→</text>
            </button>
          </view>
        </view>
      </view>

      <button v-if="dismissible" class="feedback-close" @click="dismiss">
        <text>✕</text>
      </button>
    </view>

    <!-- Validation state -->
    <view
      v-if="state === 'validating'"
      class="feedback-container validating"
      :class="{ show: visible }"
    >
      <view class="feedback-icon">
        <view class="loading-spinner"></view>
      </view>
      <view class="feedback-content">
        <text class="feedback-title">验证中...</text>
        <text class="feedback-message">正在检查设置的有效性</text>
      </view>
    </view>

    <!-- Info state -->
    <view v-if="state === 'info'" class="feedback-container info" :class="{ show: visible }">
      <view class="feedback-icon">
        <text>ℹ</text>
      </view>
      <view class="feedback-content">
        <text class="feedback-title">信息提示</text>
        <text class="feedback-message">{{ infoMessage }}</text>

        <!-- Additional info -->
        <view v-if="additionalInfo" class="additional-info">
          <text class="additional-text">{{ additionalInfo }}</text>
        </view>
      </view>

      <button v-if="dismissible" class="feedback-close" @click="dismiss">
        <text>✕</text>
      </button>
    </view>

    <!-- Field-specific validation errors -->
    <view v-if="fieldErrors && Object.keys(fieldErrors).length > 0" class="field-errors">
      <text class="field-errors-title">请修正以下问题：</text>
      <view class="field-errors-list">
        <view v-for="(errors, fieldName) in fieldErrors" :key="fieldName" class="field-error-group">
          <text class="field-name">{{ getFieldLabel(fieldName) }}:</text>
          <view class="field-error-messages">
            <text
              v-for="(error, index) in Array.isArray(errors) ? errors : [errors]"
              :key="index"
              class="field-error-message"
            >
              • {{ error }}
            </text>
          </view>
        </view>
      </view>
    </view>

    <!-- Progress indicator for batch operations -->
    <view v-if="showProgress" class="progress-container" :class="{ show: visible }">
      <view class="progress-header">
        <text class="progress-title">{{ progressTitle || '处理中...' }}</text>
        <text class="progress-stats">{{ progressCurrent }}/{{ progressTotal }}</text>
      </view>

      <view class="progress-bar-container">
        <view class="progress-bar" :style="{ width: progressPercentage + '%' }"></view>
      </view>

      <text v-if="progressMessage" class="progress-message">{{ progressMessage }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

/**
 * 设置验证反馈组件
 *
 * 功能特性：
 * - 多种状态的反馈显示（成功、错误、警告、验证中、信息）
 * - 字段级别的验证错误显示
 * - 进度指示器支持批量操作
 * - 建议操作和重试机制
 * - 自动消失和手动关闭
 * - iPad友好的视觉设计
 *
 * @author Terminal 3 (Admin Frontend Team)
 */

interface Suggestion {
  text: string
  action: string
}

interface Props {
  state: 'success' | 'error' | 'warning' | 'validating' | 'info' | 'hidden'
  visible?: boolean
  dismissible?: boolean
  autoHide?: number // Auto hide after milliseconds

  // Messages
  successMessage?: string
  errorMessage?: string
  warningMessage?: string
  infoMessage?: string
  additionalInfo?: string

  // Error details
  errorDetails?: string[]
  fieldErrors?: Record<string, string | string[]>

  // Suggestions
  suggestions?: Suggestion[]

  // Progress
  showProgress?: boolean
  progressTitle?: string
  progressMessage?: string
  progressCurrent?: number
  progressTotal?: number
}

const props = withDefaults(defineProps<Props>(), {
  visible: true,
  dismissible: true,
  autoHide: 0,
  progressCurrent: 0,
  progressTotal: 100
})

const emit = defineEmits<{
  dismiss: []
  retry: []
  'apply-suggestion': [action: string]
}>()

// Component state
const isVisible = ref(props.visible)

// Computed properties
const progressPercentage = computed(() => {
  if (props.progressTotal === 0) return 0
  return Math.round((props.progressCurrent / props.progressTotal) * 100)
})

// Watch for visibility changes
watch(
  () => props.visible,
  newValue => {
    isVisible.value = newValue

    // Auto hide functionality
    if (newValue && props.autoHide > 0) {
      setTimeout(() => {
        if (props.dismissible) {
          dismiss()
        }
      }, props.autoHide)
    }
  }
)

// Methods
function dismiss() {
  isVisible.value = false
  emit('dismiss')
}

function getFieldLabel(fieldName: string): string {
  // Convert field names to user-friendly labels
  const labelMap: Record<string, string> = {
    email: '邮箱地址',
    password: '密码',
    phone: '电话号码',
    company_name: '公司名称',
    api_key: 'API密钥',
    webhook_url: 'Webhook地址',
    max_file_size: '文件大小限制',
    session_timeout: '会话超时时间',
    backup_frequency: '备份频率',
    notification_email: '通知邮箱'
  }

  return labelMap[fieldName] || fieldName
}
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.settings-validation-feedback {
  .feedback-container {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 16px;
    border-radius: 8px;
    margin: 16px 0;
    opacity: 0;
    transform: translateY(-8px);
    transition: all 0.3s ease;

    &.show {
      opacity: 1;
      transform: translateY(0);
    }

    .feedback-icon {
      flex: none;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      font-size: 14px;
      font-weight: bold;

      .loading-spinner {
        width: 16px;
        height: 16px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-top: 2px solid white;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }
    }

    .feedback-content {
      flex: 1;
      min-width: 0;

      .feedback-title {
        display: block;
        font-size: 14px;
        font-weight: 600;
        margin-bottom: 4px;
      }

      .feedback-message {
        display: block;
        font-size: 13px;
        line-height: 1.5;
        opacity: 0.9;
      }

      .error-details,
      .warning-suggestions,
      .additional-info {
        margin-top: 12px;
        padding: 12px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 6px;

        .details-title,
        .suggestions-title {
          display: block;
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 8px;
        }

        .details-list {
          .detail-item {
            display: block;
            font-size: 12px;
            line-height: 1.4;
            margin-bottom: 4px;
            opacity: 0.9;
          }
        }

        .suggestions-list {
          .suggestion-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            width: 100%;
            padding: 8px 12px;
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 4px;
            margin-bottom: 6px;
            cursor: pointer;
            transition: all 0.2s ease;

            &:hover {
              background: rgba(255, 255, 255, 0.2);
            }

            .suggestion-text {
              font-size: 12px;
            }

            .suggestion-arrow {
              font-size: 12px;
              opacity: 0.7;
            }
          }
        }

        .additional-text {
          font-size: 12px;
          line-height: 1.4;
          opacity: 0.9;
        }
      }
    }

    .feedback-actions {
      display: flex;
      gap: 8px;
      align-items: center;

      .action-btn {
        padding: 6px 12px;
        font-size: 12px;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.2s ease;

        &.retry {
          background: rgba(255, 255, 255, 0.2);
          color: inherit;
          border: 1px solid rgba(255, 255, 255, 0.3);

          &:hover {
            background: rgba(255, 255, 255, 0.3);
          }
        }

        &.dismiss {
          background: transparent;
          border: none;
          color: inherit;
          opacity: 0.7;

          &:hover {
            opacity: 1;
          }
        }
      }
    }

    .feedback-close {
      flex: none;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      background: transparent;
      border: none;
      color: inherit;
      opacity: 0.7;
      cursor: pointer;
      border-radius: 4px;
      transition: all 0.2s ease;

      &:hover {
        opacity: 1;
        background: rgba(255, 255, 255, 0.1);
      }
    }

    // State-specific styles
    &.success {
      background: linear-gradient(135deg, #28a745, #20c997);
      color: white;
      box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);

      .feedback-icon {
        background: rgba(255, 255, 255, 0.2);
      }
    }

    &.error {
      background: linear-gradient(135deg, #dc3545, #fd7e14);
      color: white;
      box-shadow: 0 4px 12px rgba(220, 53, 69, 0.3);

      .feedback-icon {
        background: rgba(255, 255, 255, 0.2);
      }
    }

    &.warning {
      background: linear-gradient(135deg, #ffc107, #fd7e14);
      color: #212529;
      box-shadow: 0 4px 12px rgba(255, 193, 7, 0.3);

      .feedback-icon {
        background: rgba(0, 0, 0, 0.1);
      }
    }

    &.validating {
      background: linear-gradient(135deg, #6f42c1, #007bff);
      color: white;
      box-shadow: 0 4px 12px rgba(111, 66, 193, 0.3);

      .feedback-icon {
        background: rgba(255, 255, 255, 0.2);
      }
    }

    &.info {
      background: linear-gradient(135deg, #17a2b8, #6f42c1);
      color: white;
      box-shadow: 0 4px 12px rgba(23, 162, 184, 0.3);

      .feedback-icon {
        background: rgba(255, 255, 255, 0.2);
      }
    }
  }

  .field-errors {
    background: #fff5f5;
    border: 1px solid #fed7d7;
    border-radius: 8px;
    padding: 16px;
    margin: 16px 0;

    .field-errors-title {
      display: block;
      font-size: 14px;
      font-weight: 600;
      color: #c53030;
      margin-bottom: 12px;
    }

    .field-errors-list {
      .field-error-group {
        margin-bottom: 12px;

        &:last-child {
          margin-bottom: 0;
        }

        .field-name {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: #2d3748;
          margin-bottom: 4px;
        }

        .field-error-messages {
          .field-error-message {
            display: block;
            font-size: 12px;
            color: #e53e3e;
            line-height: 1.4;
            margin-bottom: 2px;
          }
        }
      }
    }
  }

  .progress-container {
    background: white;
    border: 1px solid var(--border-color, #dee2e6);
    border-radius: 8px;
    padding: 16px;
    margin: 16px 0;
    opacity: 0;
    transform: translateY(-8px);
    transition: all 0.3s ease;

    &.show {
      opacity: 1;
      transform: translateY(0);
    }

    .progress-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;

      .progress-title {
        font-size: 14px;
        font-weight: 600;
        color: var(--text-color-primary, #495057);
      }

      .progress-stats {
        font-size: 12px;
        color: var(--text-color-secondary, #6c757d);
        font-weight: 500;
      }
    }

    .progress-bar-container {
      width: 100%;
      height: 8px;
      background: var(--color-grey-200, #e9ecef);
      border-radius: 4px;
      overflow: hidden;
      margin-bottom: 8px;

      .progress-bar {
        height: 100%;
        background: linear-gradient(
          90deg,
          var(--color-primary, #007aff),
          var(--color-success, #28a745)
        );
        border-radius: 4px;
        transition: width 0.3s ease;
      }
    }

    .progress-message {
      font-size: 12px;
      color: var(--text-color-secondary, #6c757d);
      line-height: 1.4;
    }
  }
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

// Enhanced Responsive Design - Using new mixins
@import '@/styles/mixins.scss';

@include respond-to('phone') {
  .settings-validation-feedback {
    .feedback-container {
      @include ipad-spacing('padding', 12px, 14px, 16px);
      gap: 12px;
      border-radius: 10px;
      margin: 12px 0;

      .feedback-icon {
        width: 28px;
        height: 28px;
        font-size: 16px;

        .loading-spinner {
          width: 20px;
          height: 20px;
        }
      }

      .feedback-content {
        .feedback-title {
          font-size: 16px;
          margin-bottom: 6px;
        }

        .feedback-message {
          font-size: 14px;
          line-height: 1.6;
        }

        .error-details,
        .warning-suggestions,
        .additional-info {
          @include ipad-spacing('padding', 12px, 14px, 16px);
          margin-top: 16px;
          border-radius: 8px;

          .details-title,
          .suggestions-title {
            font-size: 14px;
            margin-bottom: 12px;
          }

          .details-list {
            .detail-item {
              font-size: 13px;
              line-height: 1.6;
              margin-bottom: 6px;
            }
          }

          .suggestions-list {
            .suggestion-item {
              @include touch-friendly;
              @include ipad-spacing('padding', 12px, 14px, 16px);
              margin-bottom: 8px;
              border-radius: 6px;

              .suggestion-text {
                font-size: 14px;
              }

              .suggestion-arrow {
                font-size: 14px;
              }
            }
          }

          .additional-text {
            font-size: 13px;
            line-height: 1.6;
          }
        }
      }

      .feedback-actions {
        flex-direction: column;
        gap: 8px;
        width: 100%;

        .action-btn {
          width: 100%;
          @include touch-friendly;
          padding: 12px;
          font-size: 16px;
          justify-content: center;
        }
      }

      .feedback-close {
        @include touch-friendly;
        width: 28px;
        height: 28px;
        border-radius: 6px;
      }
    }

    .field-errors {
      @include ipad-spacing('padding', 12px, 14px, 16px);
      border-radius: 10px;
      margin: 12px 0;

      .field-errors-title {
        font-size: 16px;
        margin-bottom: 16px;
      }

      .field-errors-list {
        .field-error-group {
          margin-bottom: 16px;

          .field-name {
            font-size: 14px;
            margin-bottom: 6px;
          }

          .field-error-messages {
            .field-error-message {
              font-size: 13px;
              line-height: 1.6;
              margin-bottom: 4px;
            }
          }
        }
      }
    }

    .progress-container {
      @include ipad-spacing('padding', 12px, 14px, 16px);
      border-radius: 10px;
      margin: 12px 0;

      .progress-header {
        margin-bottom: 16px;

        .progress-title {
          font-size: 16px;
        }

        .progress-stats {
          font-size: 14px;
        }
      }

      .progress-bar-container {
        height: 10px;
        border-radius: 5px;
        margin-bottom: 12px;

        .progress-bar {
          border-radius: 5px;
        }
      }

      .progress-message {
        font-size: 13px;
        line-height: 1.6;
      }
    }
  }
}

@include respond-to('tablet') {
  .settings-validation-feedback {
    .feedback-container {
      @include ipad-spacing('padding', 14px, 16px, 18px);
      gap: 14px;

      .feedback-icon {
        width: 26px;
        height: 26px;
        font-size: 15px;

        .loading-spinner {
          width: 18px;
          height: 18px;
        }
      }

      .feedback-content {
        .feedback-title {
          font-size: 15px;
        }

        .feedback-message {
          font-size: 13px;
        }

        .error-details,
        .warning-suggestions,
        .additional-info {
          @include ipad-spacing('padding', 14px, 16px, 18px);

          .suggestions-list {
            .suggestion-item {
              @include touch-friendly;
              padding: 10px 14px;

              .suggestion-text {
                font-size: 13px;
              }
            }
          }
        }
      }

      .feedback-actions {
        .action-btn {
          @include touch-friendly;
          padding: 10px 16px;
          font-size: 14px;
        }
      }

      .feedback-close {
        @include touch-friendly;
        width: 24px;
        height: 24px;
      }
    }

    .field-errors {
      @include ipad-spacing('padding', 14px, 16px, 18px);

      .field-errors-title {
        font-size: 15px;
      }

      .field-errors-list {
        .field-error-group {
          .field-name {
            font-size: 13px;
          }

          .field-error-messages {
            .field-error-message {
              font-size: 12px;
            }
          }
        }
      }
    }

    .progress-container {
      @include ipad-spacing('padding', 14px, 16px, 18px);

      .progress-header {
        .progress-title {
          font-size: 15px;
        }

        .progress-stats {
          font-size: 13px;
        }
      }

      .progress-bar-container {
        height: 9px;
      }

      .progress-message {
        font-size: 12px;
      }
    }
  }
}

@include respond-to('ipad-pro') {
  .settings-validation-feedback {
    .feedback-container {
      .feedback-content {
        .warning-suggestions {
          .suggestions-list {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;

            .suggestion-item {
              margin-bottom: 0;
            }
          }
        }
      }
    }

    .field-errors {
      .field-errors-list {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;

        .field-error-group {
          margin-bottom: 0;
        }
      }
    }
  }
}

@include respond-to('desktop-and-up') {
  .settings-validation-feedback {
    .feedback-container {
      .feedback-content {
        .error-details {
          .details-list {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;

            .detail-item {
              margin-bottom: 0;
            }
          }
        }
      }
    }
  }
}
</style>
