<template>
  <view class="enhanced-confirmation-dialog" :class="{ 'show': visible }" v-if="visible">
    <!-- Backdrop -->
    <view class="dialog-backdrop" @click="handleBackdropClick"></view>
    
    <!-- Dialog Container -->
    <view class="dialog-container" :class="[`severity-${severity}`, { 'input-mode': inputRequired }]">
      <!-- Header -->
      <view class="dialog-header">
        <view class="header-icon" v-if="icon || severityIcon">
          <text class="icon-text">{{ icon || severityIcon }}</text>
        </view>
        <text class="dialog-title">{{ title }}</text>
        <button v-if="showClose" class="close-btn" @click="handleCancel">
          <text>✕</text>
        </button>
      </view>
      
      <!-- Content -->
      <view class="dialog-content">
        <!-- Main Message -->
        <text v-if="message" class="dialog-message">{{ message }}</text>
        
        <!-- Custom Content Slot -->
        <slot name="content"></slot>
        
        <!-- Warning Section -->
        <view v-if="warning" class="warning-section">
          <view class="warning-header">
            <text class="warning-icon">⚠️</text>
            <text class="warning-title">注意事项</text>
          </view>
          <text class="warning-text">{{ warning }}</text>
        </view>
        
        <!-- Details List -->
        <view v-if="details && details.length > 0" class="details-section">
          <text class="details-title">详细信息：</text>
          <view class="details-list">
            <text 
              v-for="(detail, index) in details"
              :key="index"
              class="detail-item"
            >
              • {{ detail }}
            </text>
          </view>
        </view>
        
        <!-- Input Section -->
        <view v-if="inputRequired" class="input-section">
          <text class="input-label">{{ inputLabel || '请输入以确认操作' }}</text>
          <input
            v-if="inputType === 'text'"
            v-model="inputValue"
            class="confirmation-input"
            :placeholder="inputPlaceholder"
            @input="handleInputChange"
          />
          <textarea
            v-else-if="inputType === 'textarea'"
            v-model="inputValue"
            class="confirmation-textarea"
            :placeholder="inputPlaceholder"
            @input="handleInputChange"
          />
          <view v-else-if="inputType === 'checkbox'" class="checkbox-group">
            <checkbox
              v-model="checkboxValue"
              class="confirmation-checkbox"
              @change="handleCheckboxChange"
            />
            <text class="checkbox-label">{{ inputPlaceholder || '我已确认此操作' }}</text>
          </view>
          
          <!-- Input Validation Error -->
          <text v-if="inputError" class="input-error">{{ inputError }}</text>
        </view>
        
        <!-- Affected Items Preview -->
        <view v-if="affectedItems && affectedItems.length > 0" class="affected-items">
          <text class="affected-title">将要{{ operationText }}的项目 ({{ affectedItems.length }}个)：</text>
          <view class="affected-list">
            <text 
              v-for="(item, index) in displayedItems"
              :key="index"
              class="affected-item"
            >
              {{ item }}
            </text>
            <text v-if="affectedItems.length > maxDisplayItems" class="more-items">
              ...以及其他 {{ affectedItems.length - maxDisplayItems }} 个项目
            </text>
          </view>
        </view>
      </view>
      
      <!-- Actions -->
      <view class="dialog-actions">
        <!-- Custom Actions Slot -->
        <slot name="actions" :confirm="handleConfirm" :cancel="handleCancel">
          <button 
            class="dialog-btn secondary" 
            @click="handleCancel"
            :disabled="processing"
          >
            {{ cancelText || '取消' }}
          </button>
          <button 
            class="dialog-btn primary"
            :class="[`severity-${severity}`]"
            @click="handleConfirm"
            :disabled="!canConfirm || processing"
          >
            <view v-if="processing" class="btn-spinner"></view>
            <text>{{ processing ? processingText : (confirmText || '确认') }}</text>
          </button>
        </slot>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

/**
 * 增强确认对话框组件
 * 
 * 功能特性：
 * - 多种严重级别的确认对话框（info, warning, danger, success）
 * - 支持输入验证的确认操作
 * - 受影响项目预览
 * - 可自定义的操作按钮和内容
 * - 专业的视觉设计和动画效果
 * - iPad友好的触控交互
 * 
 * @author Terminal 3 (Admin Frontend Team)
 */

interface AffectedItem {
  id: string | number
  name: string
  [key: string]: any
}

interface Props {
  visible: boolean
  title: string
  message?: string
  severity?: 'info' | 'warning' | 'danger' | 'success'
  icon?: string
  showClose?: boolean
  
  // Warning and details
  warning?: string
  details?: string[]
  
  // Input validation
  inputRequired?: boolean
  inputType?: 'text' | 'textarea' | 'checkbox'
  inputLabel?: string
  inputPlaceholder?: string
  inputValidation?: (value: string) => string | null
  confirmationText?: string // Required text to type for confirmation
  
  // Affected items preview
  affectedItems?: (string | AffectedItem)[]
  maxDisplayItems?: number
  operationText?: string
  
  // Button customization
  confirmText?: string
  cancelText?: string
  processing?: boolean
  processingText?: string
  
  // Behavior
  closeOnBackdrop?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  severity: 'info',
  showClose: true,
  inputType: 'text',
  maxDisplayItems: 5,
  operationText: '处理',
  closeOnBackdrop: true,
  processingText: '处理中...'
})

const emit = defineEmits<{
  confirm: [inputValue?: string]
  cancel: []
  'update:visible': [visible: boolean]
}>()

// Component state
const inputValue = ref('')
const checkboxValue = ref(false)
const inputError = ref('')

// Computed properties
const severityIcon = computed(() => {
  const iconMap = {
    info: 'ℹ️',
    warning: '⚠️',
    danger: '🚨',
    success: '✅'
  }
  return iconMap[props.severity]
})

const displayedItems = computed(() => {
  if (!props.affectedItems) return []
  
  const items = props.affectedItems.slice(0, props.maxDisplayItems)
  return items.map(item => 
    typeof item === 'string' ? item : item.name || item.id?.toString() || '未知项目'
  )
})

const canConfirm = computed(() => {
  if (props.processing) return false
  
  if (props.inputRequired) {
    if (props.inputType === 'checkbox') {
      return checkboxValue.value
    }
    
    if (props.confirmationText) {
      return inputValue.value.toLowerCase().trim() === props.confirmationText.toLowerCase().trim()
    }
    
    if (props.inputValidation) {
      return !props.inputValidation(inputValue.value)
    }
    
    return inputValue.value.trim().length > 0
  }
  
  return true
})

// Watch for visibility changes
watch(() => props.visible, (newVal) => {
  if (newVal) {
    // Reset input when dialog opens
    inputValue.value = ''
    checkboxValue.value = false
    inputError.value = ''
  }
})

// Methods
function handleConfirm() {
  if (!canConfirm.value) return
  
  // Validate input if required
  if (props.inputRequired && props.inputValidation) {
    const error = props.inputValidation(inputValue.value)
    if (error) {
      inputError.value = error
      return
    }
  }
  
  emit('confirm', inputValue.value)
}

function handleCancel() {
  emit('cancel')
  emit('update:visible', false)
}

function handleBackdropClick() {
  if (props.closeOnBackdrop && !props.processing) {
    handleCancel()
  }
}

function handleInputChange() {
  inputError.value = ''
  
  if (props.inputValidation) {
    const error = props.inputValidation(inputValue.value)
    if (error) {
      inputError.value = error
    }
  }
}

function handleCheckboxChange(event: any) {
  checkboxValue.value = event.detail ? event.detail.value : event.target.checked
}
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.enhanced-confirmation-dialog {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease;

  &.show {
    opacity: 1;
    visibility: visible;

    .dialog-container {
      transform: scale(1) translateY(0);
      opacity: 1;
    }
  }

  .dialog-backdrop {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(2px);
  }

  .dialog-container {
    position: relative;
    width: 90%;
    max-width: 500px;
    max-height: 80vh;
    background: white;
    border-radius: 12px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
    transform: scale(0.95) translateY(-20px);
    opacity: 0;
    transition: all 0.3s ease;
    overflow: hidden;

    &.input-mode {
      max-width: 600px;
    }

    .dialog-header {
      display: flex;
      align-items: center;
      padding: 20px 24px;
      border-bottom: 1px solid var(--border-color-light, #e9ecef);
      background: var(--color-grey-25, #f8f9fa);

      .header-icon {
        flex: none;
        margin-right: 12px;

        .icon-text {
          font-size: 24px;
        }
      }

      .dialog-title {
        flex: 1;
        font-size: 18px;
        font-weight: 600;
        color: var(--text-color-primary, #495057);
      }

      .close-btn {
        flex: none;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        background: transparent;
        border: none;
        color: var(--text-color-secondary, #6c757d);
        cursor: pointer;
        border-radius: 4px;
        transition: background-color 0.2s;

        &:hover {
          background: rgba(0, 0, 0, 0.1);
        }
      }
    }

    .dialog-content {
      padding: 24px;
      max-height: 400px;
      overflow-y: auto;

      .dialog-message {
        display: block;
        font-size: 16px;
        line-height: 1.5;
        color: var(--text-color-primary, #495057);
        margin-bottom: 16px;
      }

      .warning-section {
        background: rgba(var(--color-warning-rgb, 255, 193, 7), 0.1);
        border: 1px solid var(--color-warning, #ffc107);
        border-radius: 8px;
        padding: 16px;
        margin: 16px 0;

        .warning-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;

          .warning-icon {
            font-size: 16px;
          }

          .warning-title {
            font-weight: 600;
            color: var(--color-warning-dark, #856404);
            font-size: 14px;
          }
        }

        .warning-text {
          font-size: 14px;
          color: var(--color-warning-dark, #856404);
          line-height: 1.4;
        }
      }

      .details-section {
        margin: 16px 0;

        .details-title {
          display: block;
          font-weight: 600;
          color: var(--text-color-primary, #495057);
          font-size: 14px;
          margin-bottom: 8px;
        }

        .details-list {
          .detail-item {
            display: block;
            font-size: 14px;
            color: var(--text-color-secondary, #6c757d);
            line-height: 1.4;
            margin-bottom: 4px;
          }
        }
      }

      .input-section {
        margin: 16px 0;

        .input-label {
          display: block;
          font-weight: 600;
          color: var(--text-color-primary, #495057);
          font-size: 14px;
          margin-bottom: 8px;
        }

        .confirmation-input,
        .confirmation-textarea {
          width: 100%;
          padding: 12px 16px;
          border: 1px solid var(--border-color, #dee2e6);
          border-radius: 6px;
          font-size: 14px;
          transition: border-color 0.2s;

          &:focus {
            outline: none;
            border-color: var(--color-primary, #007aff);
          }
        }

        .confirmation-textarea {
          min-height: 80px;
          resize: vertical;
        }

        .checkbox-group {
          display: flex;
          align-items: center;
          gap: 8px;

          .confirmation-checkbox {
            transform: scale(1.1);
          }

          .checkbox-label {
            font-size: 14px;
            color: var(--text-color-primary, #495057);
          }
        }

        .input-error {
          display: block;
          color: var(--color-danger, #dc3545);
          font-size: 12px;
          margin-top: 4px;
        }
      }

      .affected-items {
        margin: 16px 0;
        padding: 16px;
        background: var(--color-grey-25, #f8f9fa);
        border-radius: 8px;

        .affected-title {
          display: block;
          font-weight: 600;
          color: var(--text-color-primary, #495057);
          font-size: 14px;
          margin-bottom: 8px;
        }

        .affected-list {
          .affected-item {
            display: block;
            font-size: 13px;
            color: var(--text-color-secondary, #6c757d);
            line-height: 1.4;
            margin-bottom: 2px;
          }

          .more-items {
            display: block;
            font-size: 12px;
            color: var(--text-color-tertiary, #868e96);
            font-style: italic;
            margin-top: 4px;
          }
        }
      }
    }

    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 20px 24px;
      border-top: 1px solid var(--border-color-light, #e9ecef);
      background: var(--color-grey-25, #f8f9fa);

      .dialog-btn {
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

        &.primary {
          color: white;
          border: 1px solid transparent;

          &.severity-info {
            background: var(--color-primary, #007aff);
            
            &:hover:not(:disabled) {
              background: var(--color-primary-dark, #0056b3);
            }
          }

          &.severity-success {
            background: var(--color-success, #28a745);
            
            &:hover:not(:disabled) {
              background: var(--color-success-dark, #1e7e34);
            }
          }

          &.severity-warning {
            background: var(--color-warning, #ffc107);
            color: var(--color-warning-dark, #856404);
            
            &:hover:not(:disabled) {
              background: var(--color-warning-dark, #e0a800);
              color: white;
            }
          }

          &.severity-danger {
            background: var(--color-danger, #dc3545);
            
            &:hover:not(:disabled) {
              background: var(--color-danger-dark, #c82333);
            }
          }
        }
      }
    }

    // Severity-specific styling
    &.severity-danger {
      .dialog-header {
        background: rgba(var(--color-danger-rgb, 220, 53, 69), 0.1);
        border-bottom-color: rgba(var(--color-danger-rgb, 220, 53, 69), 0.2);
      }
    }

    &.severity-warning {
      .dialog-header {
        background: rgba(var(--color-warning-rgb, 255, 193, 7), 0.1);
        border-bottom-color: rgba(var(--color-warning-rgb, 255, 193, 7), 0.2);
      }
    }

    &.severity-success {
      .dialog-header {
        background: rgba(var(--color-success-rgb, 40, 167, 69), 0.1);
        border-bottom-color: rgba(var(--color-success-rgb, 40, 167, 69), 0.2);
      }
    }
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

// Responsive design - Enhanced with new mixins
@include respond-to('phone') {
  .enhanced-confirmation-dialog {
    align-items: flex-end;
    padding: 10px;
    
    .dialog-container {
      width: 100%;
      max-width: none;
      max-height: 90vh;
      border-radius: 12px 12px 0 0;
      transform: translateY(100%);
      
      &.show {
        .dialog-container {
          transform: translateY(0);
        }
      }
      
      .dialog-header {
        @include ipad-spacing('padding', 16px, 20px, 24px);
        
        .dialog-title {
          font-size: 16px;
        }
        
        .close-btn {
          @include touch-friendly;
        }
      }
      
      .dialog-content {
        @include ipad-spacing('padding', 16px, 20px, 24px);
        max-height: 60vh;
        
        .dialog-message {
          font-size: 15px;
          line-height: 1.6;
        }
        
        .input-section {
          .confirmation-input,
          .confirmation-textarea {
            @include touch-friendly;
            font-size: 16px; // 防止iOS缩放
            padding: 12px 16px;
          }
        }
      }
      
      .dialog-actions {
        flex-direction: column-reverse;
        gap: 8px;
        @include ipad-spacing('padding', 16px, 20px, 24px);
        
        .dialog-btn {
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
  .enhanced-confirmation-dialog {
    padding: 40px 20px;
    
    .dialog-container {
      width: 90%;
      max-width: 500px;
      
      .dialog-header {
        @include ipad-spacing('padding', 20px, 24px, 24px);
      }
      
      .dialog-content {
        @include ipad-spacing('padding', 20px, 24px, 24px);
        
        .affected-items {
          .affected-list {
            @include horizontal-scroll;
            
            .affected-item {
              display: inline-block;
              margin-right: 16px;
              white-space: nowrap;
            }
          }
        }
      }
      
      .dialog-actions {
        @include ipad-spacing('padding', 20px, 24px, 24px);
        
        .dialog-btn {
          @include touch-friendly;
          padding: 12px 24px;
        }
      }
    }
  }
}

@include respond-to('ipad-pro') {
  .enhanced-confirmation-dialog {
    .dialog-container {
      max-width: 600px;
      
      &.input-mode {
        max-width: 700px;
      }
      
      .dialog-content {
        max-height: 70vh;
      }
    }
  }
}
</style>