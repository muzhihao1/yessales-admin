<template>
  <view class="operation-progress-modal" :class="{ show: visible }" v-if="visible">
    <!-- Backdrop -->
    <view class="modal-backdrop"></view>

    <!-- Modal Container -->
    <view class="modal-container" :class="[`status-${currentStatus}`]">
      <!-- Header -->
      <view class="modal-header">
        <view class="header-left">
          <text class="status-icon">{{ statusIcon }}</text>
          <view class="header-text">
            <text class="modal-title">{{ title }}</text>
            <text class="modal-subtitle">{{ subtitle }}</text>
          </view>
        </view>
        <button v-if="canClose && !processing" class="close-btn" @click="handleClose">
          <text>✕</text>
        </button>
      </view>

      <!-- Progress Section -->
      <view class="modal-content">
        <!-- Overall Progress -->
        <view v-if="showProgress" class="progress-section">
          <view class="progress-header">
            <text class="progress-title">{{ progressTitle }}</text>
            <text class="progress-stats">{{ progressText }}</text>
          </view>

          <!-- Progress Bar -->
          <view class="progress-bar-container">
            <view
              class="progress-bar"
              :class="{ indeterminate: !determinate }"
              :style="{ width: progressPercentage + '%' }"
            ></view>
          </view>

          <!-- Current Step -->
          <text v-if="currentStepText" class="current-step">{{ currentStepText }}</text>
        </view>

        <!-- Steps List -->
        <view v-if="steps && steps.length > 0" class="steps-section">
          <text class="steps-title">操作步骤:</text>
          <view class="steps-list">
            <view
              v-for="(step, index) in steps"
              :key="index"
              class="step-item"
              :class="[
                `status-${step.status || 'pending'}`,
                { current: index === currentStepIndex }
              ]"
            >
              <view class="step-icon">
                <text v-if="step.status === 'completed'">✅</text>
                <text v-else-if="step.status === 'error'">❌</text>
                <text v-else-if="step.status === 'processing'">⏳</text>
                <text v-else>⚪</text>
              </view>
              <view class="step-content">
                <text class="step-title">{{ step.title }}</text>
                <text v-if="step.description" class="step-description">{{ step.description }}</text>
                <text v-if="step.error" class="step-error">{{ step.error }}</text>
              </view>
            </view>
          </view>
        </view>

        <!-- Results Section -->
        <view v-if="results" class="results-section">
          <!-- Success Results -->
          <view v-if="results.success !== undefined" class="result-summary">
            <view class="summary-item success" v-if="results.success > 0">
              <text class="summary-icon">✅</text>
              <text class="summary-text">成功: {{ results.success }} 项</text>
            </view>
            <view class="summary-item error" v-if="results.error > 0">
              <text class="summary-icon">❌</text>
              <text class="summary-text">失败: {{ results.error }} 项</text>
            </view>
            <view class="summary-item warning" v-if="results.warning > 0">
              <text class="summary-icon">⚠️</text>
              <text class="summary-text">警告: {{ results.warning }} 项</text>
            </view>
            <view class="summary-item skipped" v-if="results.skipped > 0">
              <text class="summary-icon">⏭️</text>
              <text class="summary-text">跳过: {{ results.skipped }} 项</text>
            </view>
          </view>

          <!-- Error Details -->
          <view v-if="results.errors && results.errors.length > 0" class="error-details">
            <text class="error-title">错误详情:</text>
            <view class="error-list">
              <view v-for="(error, index) in displayedErrors" :key="index" class="error-item">
                <text class="error-message">{{ typeof error === 'object' ? error.message : error }}</text>
                <text v-if="typeof error === 'object' && error.item" class="error-item-name">项目: {{ error.item }}</text>
              </view>
              <button
                v-if="results.errors.length > maxErrorDisplay"
                class="show-more-errors"
                @click="showAllErrors = !showAllErrors"
              >
                {{ showAllErrors ? '收起' : `查看全部 ${results.errors.length} 个错误` }}
              </button>
            </view>
          </view>

          <!-- Download Links -->
          <view v-if="downloadLinks && downloadLinks.length > 0" class="download-section">
            <text class="download-title">下载文件:</text>
            <view class="download-list">
              <button
                v-for="(link, index) in downloadLinks"
                :key="index"
                class="download-btn"
                @click="handleDownload(link)"
              >
                <text class="download-icon">📄</text>
                <text class="download-name">{{ link.name }}</text>
                <text class="download-size">{{ formatFileSize(link.size) }}</text>
              </button>
            </view>
          </view>
        </view>

        <!-- Custom Content Slot -->
        <slot name="content"></slot>
      </view>

      <!-- Actions -->
      <view class="modal-actions">
        <slot name="actions" :close="handleClose" :cancel="handleCancel" :retry="handleRetry">
          <!-- Cancel Button (only when processing) -->
          <button
            v-if="processing && canCancel"
            class="action-btn secondary"
            @click="handleCancel"
            :disabled="cancelling"
          >
            <view v-if="cancelling" class="btn-spinner"></view>
            <text>{{ cancelling ? '取消中...' : '取消操作' }}</text>
          </button>

          <!-- Retry Button (on error) -->
          <button
            v-if="currentStatus === 'error' && canRetry"
            class="action-btn retry"
            @click="handleRetry"
          >
            <text>重试操作</text>
          </button>

          <!-- Close Button (when done or can close) -->
          <button v-if="canClose" class="action-btn primary" @click="handleClose">
            <text>{{ processing ? '后台运行' : '关闭' }}</text>
          </button>
        </slot>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

/**
 * 操作进度模态框组件
 *
 * 功能特性：
 * - 详细的操作进度跟踪和步骤显示
 * - 支持取消操作和错误重试
 * - 操作结果汇总和错误详情显示
 * - 文件下载链接管理
 * - 可自定义的内容和操作按钮
 * - 专业的视觉反馈和状态指示
 *
 * @author Terminal 3 (Admin Frontend Team)
 */

interface OperationStep {
  title: string
  description?: string
  status?: 'pending' | 'processing' | 'completed' | 'error'
  error?: string
}

interface OperationResults {
  success?: number
  error?: number
  warning?: number
  skipped?: number
  errors?: Array<
    | {
        message: string
        item?: string
        code?: string
      }
    | string
  >
}

interface DownloadLink {
  name: string
  url: string
  size?: number
  type?: string
}

interface Props {
  visible: boolean
  title: string
  subtitle?: string

  // Progress
  showProgress?: boolean
  progress?: number
  total?: number
  determinate?: boolean
  progressTitle?: string
  currentStepText?: string

  // Steps
  steps?: OperationStep[]
  currentStepIndex?: number

  // Status
  processing?: boolean
  currentStatus?: 'processing' | 'completed' | 'error' | 'cancelled'

  // Results
  results?: OperationResults
  downloadLinks?: DownloadLink[]

  // Behavior
  canClose?: boolean
  canCancel?: boolean
  canRetry?: boolean
  maxErrorDisplay?: number
}

const props = withDefaults(defineProps<Props>(), {
  showProgress: true,
  progress: 0,
  total: 100,
  determinate: true,
  currentStepIndex: -1,
  currentStatus: 'processing',
  canClose: true,
  canCancel: true,
  canRetry: true,
  maxErrorDisplay: 5
})

const emit = defineEmits<{
  close: []
  cancel: []
  retry: []
  download: [link: DownloadLink]
  'update:visible': [visible: boolean]
}>()

// Component state
const showAllErrors = ref(false)
const cancelling = ref(false)

// Computed properties
const statusIcon = computed(() => {
  const iconMap = {
    processing: '⏳',
    completed: '✅',
    error: '❌',
    cancelled: '⏹️'
  }
  return iconMap[props.currentStatus] || '⏳'
})

const progressPercentage = computed(() => {
  if (!props.determinate) return 100
  if (props.total === 0) return 0
  return Math.round((props.progress / props.total) * 100)
})

const progressText = computed(() => {
  if (!props.determinate) return '进行中...'
  return `${props.progress}/${props.total} (${progressPercentage.value}%)`
})

const displayedErrors = computed(() => {
  if (!props.results?.errors) return []

  if (showAllErrors.value) {
    return props.results.errors
  }

  return props.results.errors.slice(0, props.maxErrorDisplay)
})

// Watch for status changes
watch(
  () => props.currentStatus,
  newStatus => {
    if (newStatus !== 'processing') {
      cancelling.value = false
    }
  }
)

// Methods
function handleClose() {
  emit('close')
  emit('update:visible', false)
}

function handleCancel() {
  if (props.processing) {
    cancelling.value = true
    emit('cancel')
  } else {
    handleClose()
  }
}

function handleRetry() {
  emit('retry')
}

function handleDownload(link: DownloadLink) {
  emit('download', link)

  // Simulate download trigger (in real implementation, this would handle the actual download)
  if (link.url) {
    console.log('Download file:', link.name, link.url)
  }
}

function formatFileSize(size?: number): string {
  if (!size) return ''

  const units = ['B', 'KB', 'MB', 'GB']
  let index = 0
  let fileSize = size

  while (fileSize >= 1024 && index < units.length - 1) {
    fileSize /= 1024
    index++
  }

  return `${fileSize.toFixed(1)} ${units[index]}`
}
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.operation-progress-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2500;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease;

  &.show {
    opacity: 1;
    visibility: visible;

    .modal-container {
      transform: scale(1) translateY(0);
      opacity: 1;
    }
  }

  .modal-backdrop {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(4px);
  }

  .modal-container {
    position: relative;
    width: 90%;
    max-width: 700px;
    max-height: 85vh;
    background: white;
    border-radius: 12px;
    box-shadow: 0 25px 80px rgba(0, 0, 0, 0.3);
    transform: scale(0.95) translateY(-20px);
    opacity: 0;
    transition: all 0.3s ease;
    overflow: hidden;

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 24px;
      border-bottom: 1px solid var(--border-color-light, #e9ecef);

      .header-left {
        display: flex;
        align-items: center;
        gap: 16px;

        .status-icon {
          font-size: 32px;
        }

        .header-text {
          .modal-title {
            display: block;
            font-size: 20px;
            font-weight: 600;
            color: var(--text-color-primary, #495057);
            margin-bottom: 4px;
          }

          .modal-subtitle {
            font-size: 14px;
            color: var(--text-color-secondary, #6c757d);
          }
        }
      }

      .close-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        background: transparent;
        border: none;
        color: var(--text-color-secondary, #6c757d);
        cursor: pointer;
        border-radius: 6px;
        transition: all 0.2s;

        &:hover {
          background: rgba(0, 0, 0, 0.1);
          color: var(--text-color-primary, #495057);
        }
      }
    }

    .modal-content {
      padding: 24px;
      max-height: 500px;
      overflow-y: auto;

      .progress-section {
        margin-bottom: 24px;

        .progress-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;

          .progress-title {
            font-size: 16px;
            font-weight: 600;
            color: var(--text-color-primary, #495057);
          }

          .progress-stats {
            font-size: 14px;
            color: var(--text-color-secondary, #6c757d);
            font-weight: 500;
          }
        }

        .progress-bar-container {
          width: 100%;
          height: 12px;
          background: var(--color-grey-200, #e9ecef);
          border-radius: 6px;
          overflow: hidden;
          margin-bottom: 8px;

          .progress-bar {
            height: 100%;
            background: linear-gradient(
              90deg,
              var(--color-primary, #007aff),
              var(--color-success, #28a745)
            );
            border-radius: 6px;
            transition: width 0.3s ease;

            &.indeterminate {
              width: 100% !important;
              background: linear-gradient(
                90deg,
                transparent,
                var(--color-primary, #007aff),
                transparent
              );
              background-size: 200% 100%;
              animation: indeterminate 2s linear infinite;
            }
          }
        }

        .current-step {
          font-size: 14px;
          color: var(--text-color-secondary, #6c757d);
          font-style: italic;
        }
      }

      .steps-section {
        margin-bottom: 24px;

        .steps-title {
          display: block;
          font-size: 16px;
          font-weight: 600;
          color: var(--text-color-primary, #495057);
          margin-bottom: 16px;
        }

        .steps-list {
          .step-item {
            display: flex;
            gap: 12px;
            padding: 12px;
            border-radius: 8px;
            margin-bottom: 8px;
            transition: all 0.2s;

            &.current {
              background: rgba(var(--color-primary-rgb, 0, 122, 255), 0.1);
              border-left: 3px solid var(--color-primary, #007aff);
            }

            .step-icon {
              flex: none;
              font-size: 16px;
              width: 20px;
              text-align: center;
            }

            .step-content {
              flex: 1;

              .step-title {
                display: block;
                font-size: 14px;
                font-weight: 500;
                color: var(--text-color-primary, #495057);
                margin-bottom: 4px;
              }

              .step-description {
                display: block;
                font-size: 13px;
                color: var(--text-color-secondary, #6c757d);
                line-height: 1.4;
              }

              .step-error {
                display: block;
                font-size: 13px;
                color: var(--color-danger, #dc3545);
                line-height: 1.4;
                margin-top: 4px;
              }
            }

            &.status-completed {
              .step-title {
                color: var(--color-success, #28a745);
              }
            }

            &.status-error {
              background: rgba(var(--color-danger-rgb, 220, 53, 69), 0.1);

              .step-title {
                color: var(--color-danger, #dc3545);
              }
            }
          }
        }
      }

      .results-section {
        .result-summary {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 12px;
          margin-bottom: 20px;

          .summary-item {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 12px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;

            .summary-icon {
              font-size: 16px;
            }

            &.success {
              background: rgba(var(--color-success-rgb, 40, 167, 69), 0.1);
              color: var(--color-success-dark, #1e7e34);
            }

            &.error {
              background: rgba(var(--color-danger-rgb, 220, 53, 69), 0.1);
              color: var(--color-danger-dark, #721c24);
            }

            &.warning {
              background: rgba(var(--color-warning-rgb, 255, 193, 7), 0.1);
              color: var(--color-warning-dark, #856404);
            }

            &.skipped {
              background: var(--color-grey-100, #f8f9fa);
              color: var(--text-color-secondary, #6c757d);
            }
          }
        }

        .error-details {
          margin-bottom: 20px;

          .error-title {
            display: block;
            font-size: 16px;
            font-weight: 600;
            color: var(--color-danger, #dc3545);
            margin-bottom: 12px;
          }

          .error-list {
            .error-item {
              padding: 12px;
              background: rgba(var(--color-danger-rgb, 220, 53, 69), 0.05);
              border-left: 3px solid var(--color-danger, #dc3545);
              border-radius: 6px;
              margin-bottom: 8px;

              .error-message {
                display: block;
                font-size: 14px;
                color: var(--color-danger-dark, #721c24);
                line-height: 1.4;
                margin-bottom: 4px;
              }

              .error-item-name {
                font-size: 12px;
                color: var(--text-color-secondary, #6c757d);
              }
            }

            .show-more-errors {
              width: 100%;
              padding: 8px;
              background: transparent;
              color: var(--color-primary, #007aff);
              border: 1px solid var(--color-primary, #007aff);
              border-radius: 6px;
              font-size: 14px;
              cursor: pointer;
              transition: all 0.2s;

              &:hover {
                background: var(--color-primary, #007aff);
                color: white;
              }
            }
          }
        }

        .download-section {
          .download-title {
            display: block;
            font-size: 16px;
            font-weight: 600;
            color: var(--text-color-primary, #495057);
            margin-bottom: 12px;
          }

          .download-list {
            .download-btn {
              display: flex;
              align-items: center;
              gap: 12px;
              width: 100%;
              padding: 12px 16px;
              background: var(--color-grey-50, #f8f9fa);
              border: 1px solid var(--border-color, #dee2e6);
              border-radius: 8px;
              margin-bottom: 8px;
              cursor: pointer;
              transition: all 0.2s;

              &:hover {
                background: var(--color-primary-light, #e3f2fd);
                border-color: var(--color-primary, #007aff);
              }

              .download-icon {
                font-size: 20px;
              }

              .download-name {
                flex: 1;
                font-size: 14px;
                font-weight: 500;
                color: var(--text-color-primary, #495057);
                text-align: left;
              }

              .download-size {
                font-size: 12px;
                color: var(--text-color-secondary, #6c757d);
              }
            }
          }
        }
      }
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 20px 24px;
      border-top: 1px solid var(--border-color-light, #e9ecef);
      background: var(--color-grey-25, #f8f9fa);

      .action-btn {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 20px;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;

        &:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        &.secondary {
          background: white;
          color: var(--text-color-primary, #495057);
          border: 1px solid var(--border-color, #dee2e6);

          &:hover:not(:disabled) {
            background: var(--color-grey-50, #f8f9fa);
          }
        }

        &.retry {
          background: var(--color-warning, #ffc107);
          color: var(--color-warning-dark, #856404);
          border: 1px solid var(--color-warning, #ffc107);

          &:hover:not(:disabled) {
            background: var(--color-warning-dark, #e0a800);
            color: white;
          }
        }

        &.primary {
          background: var(--color-primary, #007aff);
          color: white;
          border: 1px solid var(--color-primary, #007aff);

          &:hover:not(:disabled) {
            background: var(--color-primary-dark, #0056b3);
          }
        }
      }
    }

    // Status-specific styling
    &.status-completed {
      .modal-header {
        background: rgba(var(--color-success-rgb, 40, 167, 69), 0.1);
      }
    }

    &.status-error {
      .modal-header {
        background: rgba(var(--color-danger-rgb, 220, 53, 69), 0.1);
      }
    }

    &.status-cancelled {
      .modal-header {
        background: var(--color-grey-100, #f8f9fa);
      }
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

@keyframes indeterminate {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

// Enhanced Responsive Design - Using new mixins
@import '@/styles/mixins.scss';

@include respond-to('phone') {
  .operation-progress-modal {
    align-items: flex-end;
    padding: 10px;

    .modal-container {
      width: 100%;
      max-width: none;
      max-height: 90vh;
      border-radius: 12px 12px 0 0;
      transform: translateY(100%);

      &.show {
        .modal-container {
          transform: translateY(0);
        }
      }

      .modal-header {
        @include ipad-spacing('padding', 16px, 20px, 24px);

        .header-left {
          gap: 12px;

          .status-icon {
            font-size: 24px;
          }

          .header-text {
            .modal-title {
              font-size: 18px;
            }

            .modal-subtitle {
              font-size: 13px;
            }
          }
        }

        .close-btn {
          @include touch-friendly;
        }
      }

      .modal-content {
        @include ipad-spacing('padding', 16px, 20px, 24px);
        max-height: 60vh;

        .progress-section {
          .progress-bar-container {
            height: 8px;

            .progress-bar {
              height: 100%;
            }
          }

          .current-step {
            font-size: 13px;
          }
        }

        .steps-section {
          .steps-list {
            .step-item {
              padding: 8px;

              .step-content {
                .step-title {
                  font-size: 13px;
                }

                .step-description,
                .step-error {
                  font-size: 12px;
                }
              }
            }
          }
        }

        .results-section {
          .result-summary {
            grid-template-columns: 1fr;
            gap: 8px;

            .summary-item {
              padding: 8px;
              font-size: 13px;
            }
          }

          .error-details {
            .error-list {
              .error-item {
                padding: 8px;

                .error-message {
                  font-size: 13px;
                }

                .error-item-name {
                  font-size: 11px;
                }
              }

              .show-more-errors {
                @include touch-friendly;
                font-size: 13px;
              }
            }
          }

          .download-section {
            .download-list {
              @include horizontal-scroll;
              display: flex;
              gap: 8px;

              .download-btn {
                @include touch-friendly;
                flex: none;
                min-width: 200px;
                padding: 12px;
              }
            }
          }
        }
      }

      .modal-actions {
        flex-direction: column-reverse;
        gap: 8px;
        @include ipad-spacing('padding', 16px, 20px, 24px);

        .action-btn {
          width: 100%;
          justify-content: center;
          @include touch-friendly;
          font-size: 16px;
        }
      }
    }
  }
}

@include respond-to('tablet') {
  .operation-progress-modal {
    padding: 40px 20px;

    .modal-container {
      width: 85%;
      max-width: 600px;

      .modal-header {
        @include ipad-spacing('padding', 20px, 24px, 24px);

        .header-left {
          .status-icon {
            font-size: 28px;
          }
        }
      }

      .modal-content {
        @include ipad-spacing('padding', 20px, 24px, 24px);
        max-height: 70vh;

        .progress-section {
          .progress-bar-container {
            height: 10px;
          }
        }

        .results-section {
          .result-summary {
            grid-template-columns: repeat(2, 1fr);
          }

          .download-section {
            .download-list {
              .download-btn {
                @include touch-friendly;
                padding: 12px 16px;
              }
            }
          }
        }
      }

      .modal-actions {
        @include ipad-spacing('padding', 20px, 24px, 24px);

        .action-btn {
          @include touch-friendly;
          padding: 12px 24px;
        }
      }
    }
  }
}

@include respond-to('ipad-pro') {
  .operation-progress-modal {
    .modal-container {
      max-width: 800px;

      .modal-content {
        max-height: 75vh;

        .results-section {
          .result-summary {
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          }

          .error-details {
            .error-list {
              max-height: 200px;
              overflow-y: auto;
              @include scrollbar;
            }
          }
        }
      }
    }
  }
}

@include respond-to('desktop-and-up') {
  .operation-progress-modal {
    .modal-container {
      .modal-content {
        .results-section {
          .result-summary {
            grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          }
        }
      }
    }
  }
}
</style>
