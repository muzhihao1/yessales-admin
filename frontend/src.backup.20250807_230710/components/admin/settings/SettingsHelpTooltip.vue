<template>
  <view class="settings-help-tooltip" :class="{ 'show': visible }">
    <!-- Trigger button -->
    <button 
      class="help-trigger"
      @click="toggleTooltip"
      @mouseenter="showOnHover && (visible = true)"
      @mouseleave="showOnHover && (visible = false)"
    >
      <text class="help-icon">{{ icon }}</text>
    </button>
    
    <!-- Tooltip content -->
    <view 
      v-if="visible" 
      class="tooltip-content"
      :class="[`position-${position}`, `theme-${theme}`]"
    >
      <!-- Header -->
      <view v-if="title" class="tooltip-header">
        <text class="tooltip-title">{{ title }}</text>
        <button class="close-btn" @click="hideTooltip">
          <text>✕</text>
        </button>
      </view>
      
      <!-- Content -->
      <view class="tooltip-body">
        <text v-if="content" class="tooltip-text">{{ content }}</text>
        
        <!-- Best practices -->
        <view v-if="bestPractices && bestPractices.length > 0" class="best-practices">
          <text class="section-title">💡 最佳实践：</text>
          <view class="practices-list">
            <text 
              v-for="(practice, index) in bestPractices"
              :key="index"
              class="practice-item"
            >
              • {{ practice }}
            </text>
          </view>
        </view>
        
        <!-- Warning -->
        <view v-if="warning" class="warning-section">
          <text class="warning-title">⚠️ 注意：</text>
          <text class="warning-text">{{ warning }}</text>
        </view>
        
        <!-- Related settings -->
        <view v-if="relatedSettings && relatedSettings.length > 0" class="related-settings">
          <text class="section-title">🔗 相关设置：</text>
          <view class="related-list">
            <button 
              v-for="related in relatedSettings"
              :key="related.key"
              class="related-item"
              @click="$emit('navigate', related.key)"
            >
              <text class="related-label">{{ related.label }}</text>
              <text class="related-arrow">→</text>
            </button>
          </view>
        </view>
        
        <!-- Action buttons -->
        <view v-if="showActions" class="tooltip-actions">
          <button class="action-btn secondary" @click="$emit('reset-default')">
            重置默认值
          </button>
          <button class="action-btn primary" @click="$emit('apply-recommended')">
            应用推荐设置
          </button>
        </view>
      </view>
    </view>
    
    <!-- Backdrop -->
    <view 
      v-if="visible && !showOnHover" 
      class="tooltip-backdrop"
      @click="hideTooltip"
    ></view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'

/**
 * 设置帮助提示组件
 * 
 * 功能特性：
 * - 提供设置项的详细说明和使用指导
 * - 支持最佳实践建议和警告提示
 * - 支持相关设置的快速导航
 * - 多种显示主题和位置配置
 * - iPad友好的触控交互
 * 
 * @author Terminal 3 (Admin Frontend Team)
 */

interface RelatedSetting {
  key: string
  label: string
}

interface Props {
  title?: string
  content: string
  position?: 'top' | 'bottom' | 'left' | 'right'
  theme?: 'default' | 'primary' | 'warning' | 'info'
  icon?: string
  showOnHover?: boolean
  bestPractices?: string[]
  warning?: string
  relatedSettings?: RelatedSetting[]
  showActions?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  position: 'bottom',
  theme: 'default',
  icon: '?',
  showOnHover: false,
  showActions: false
})

const emit = defineEmits<{
  navigate: [key: string]
  'reset-default': []
  'apply-recommended': []
}>()

// Component state
const visible = ref(false)

// Methods
function toggleTooltip() {
  visible.value = !visible.value
}

function hideTooltip() {
  visible.value = false
}
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.settings-help-tooltip {
  position: relative;
  display: inline-flex;
  align-items: center;

  .help-trigger {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    background: rgba(var(--color-primary-rgb, 0, 122, 255), 0.1);
    color: var(--color-primary, #007aff);
    border: 1px solid rgba(var(--color-primary-rgb, 0, 122, 255), 0.2);
    border-radius: 50%;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: rgba(var(--color-primary-rgb, 0, 122, 255), 0.15);
      border-color: var(--color-primary, #007aff);
      transform: scale(1.1);
    }

    .help-icon {
      font-weight: 600;
      font-size: 11px;
    }
  }

  .tooltip-content {
    position: absolute;
    z-index: 1000;
    min-width: 280px;
    max-width: 420px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
    border: 1px solid var(--border-color-light, #e9ecef);
    opacity: 0;
    transform: translateY(-8px);
    animation: tooltipFadeIn 0.2s ease forwards;

    &.position-bottom {
      top: calc(100% + 8px);
      left: 50%;
      transform: translateX(-50%) translateY(-8px);
      
      &::before {
        content: '';
        position: absolute;
        top: -6px;
        left: 50%;
        transform: translateX(-50%);
        width: 0;
        height: 0;
        border-left: 6px solid transparent;
        border-right: 6px solid transparent;
        border-bottom: 6px solid white;
      }
    }

    &.position-top {
      bottom: calc(100% + 8px);
      left: 50%;
      transform: translateX(-50%) translateY(8px);
      
      &::before {
        content: '';
        position: absolute;
        bottom: -6px;
        left: 50%;
        transform: translateX(-50%);
        width: 0;
        height: 0;
        border-left: 6px solid transparent;
        border-right: 6px solid transparent;
        border-top: 6px solid white;
      }
    }

    &.position-right {
      top: 50%;
      left: calc(100% + 8px);
      transform: translateY(-50%) translateX(-8px);
      
      &::before {
        content: '';
        position: absolute;
        top: 50%;
        left: -6px;
        transform: translateY(-50%);
        width: 0;
        height: 0;
        border-top: 6px solid transparent;
        border-bottom: 6px solid transparent;
        border-right: 6px solid white;
      }
    }

    &.position-left {
      top: 50%;
      right: calc(100% + 8px);
      transform: translateY(-50%) translateX(8px);
      
      &::before {
        content: '';
        position: absolute;
        top: 50%;
        right: -6px;
        transform: translateY(-50%);
        width: 0;
        height: 0;
        border-top: 6px solid transparent;
        border-bottom: 6px solid transparent;
        border-left: 6px solid white;
      }
    }

    &.theme-primary {
      background: var(--color-primary, #007aff);
      color: white;
      border-color: var(--color-primary, #007aff);

      &::before {
        border-bottom-color: var(--color-primary, #007aff);
      }
    }

    &.theme-warning {
      background: var(--color-warning-light, #fff3cd);
      color: var(--color-warning-dark, #856404);
      border-color: var(--color-warning, #ffc107);

      &::before {
        border-bottom-color: var(--color-warning-light, #fff3cd);
      }
    }

    &.theme-info {
      background: var(--color-info-light, #d1ecf1);
      color: var(--color-info-dark, #0c5460);
      border-color: var(--color-info, #17a2b8);

      &::before {
        border-bottom-color: var(--color-info-light, #d1ecf1);
      }
    }

    .tooltip-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      border-bottom: 1px solid var(--border-color-light, #e9ecef);

      .tooltip-title {
        font-size: 14px;
        font-weight: 600;
        color: var(--text-color-primary, #495057);
      }

      .close-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 20px;
        height: 20px;
        background: transparent;
        border: none;
        color: var(--text-color-secondary, #6c757d);
        cursor: pointer;
        border-radius: 4px;
        transition: background-color 0.2s;

        &:hover {
          background: var(--color-grey-100, #f8f9fa);
        }
      }
    }

    .tooltip-body {
      padding: 16px;

      .tooltip-text {
        display: block;
        font-size: 13px;
        color: var(--text-color-primary, #495057);
        line-height: 1.5;
        margin-bottom: 12px;
      }

      .section-title {
        display: block;
        font-size: 12px;
        font-weight: 600;
        color: var(--text-color-primary, #495057);
        margin-bottom: 8px;
        margin-top: 16px;

        &:first-child {
          margin-top: 0;
        }
      }

      .best-practices {
        .practices-list {
          .practice-item {
            display: block;
            font-size: 12px;
            color: var(--text-color-secondary, #6c757d);
            line-height: 1.4;
            margin-bottom: 4px;
          }
        }
      }

      .warning-section {
        padding: 12px;
        background: rgba(var(--color-warning-rgb, 255, 193, 7), 0.1);
        border-radius: 6px;
        margin-top: 12px;

        .warning-title {
          display: block;
          font-size: 12px;
          font-weight: 600;
          color: var(--color-warning-dark, #856404);
          margin-bottom: 4px;
        }

        .warning-text {
          font-size: 12px;
          color: var(--color-warning-dark, #856404);
          line-height: 1.4;
        }
      }

      .related-settings {
        .related-list {
          .related-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            width: 100%;
            padding: 8px 12px;
            background: var(--color-grey-50, #f8f9fa);
            border: 1px solid var(--border-color-light, #e9ecef);
            border-radius: 4px;
            margin-bottom: 6px;
            cursor: pointer;
            transition: all 0.2s ease;

            &:hover {
              background: var(--color-primary-light, #e3f2fd);
              border-color: var(--color-primary, #007aff);
            }

            .related-label {
              font-size: 12px;
              color: var(--text-color-primary, #495057);
            }

            .related-arrow {
              font-size: 12px;
              color: var(--text-color-secondary, #6c757d);
            }
          }
        }
      }

      .tooltip-actions {
        display: flex;
        gap: 8px;
        margin-top: 16px;
        padding-top: 16px;
        border-top: 1px solid var(--border-color-light, #e9ecef);

        .action-btn {
          flex: 1;
          padding: 8px 12px;
          font-size: 12px;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s ease;

          &.secondary {
            background: white;
            color: var(--text-color-primary, #495057);
            border: 1px solid var(--border-color, #dee2e6);

            &:hover {
              background: var(--color-grey-50, #f8f9fa);
            }
          }

          &.primary {
            background: var(--color-primary, #007aff);
            color: white;
            border: 1px solid var(--color-primary, #007aff);

            &:hover {
              background: var(--color-primary-dark, #0056b3);
            }
          }
        }
      }
    }
  }

  .tooltip-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 999;
    background: transparent;
  }

  &.show {
    .tooltip-content {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
  }
}

@keyframes tooltipFadeIn {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

// Enhanced Responsive Design - Using new mixins
@import '@/styles/mixins.scss';

@include respond-to('phone') {
  .settings-help-tooltip {
    .help-trigger {
      @include touch-friendly;
      width: 32px;
      height: 32px;
      
      .help-icon {
        font-size: 14px;
      }
    }

    .tooltip-content {
      position: fixed !important;
      top: auto !important;
      left: 10px !important;
      right: 10px !important;
      bottom: 10px !important;
      transform: none !important;
      min-width: auto;
      max-width: none;
      max-height: 70vh;
      overflow-y: auto;
      border-radius: 12px;
      animation: tooltipSlideUp 0.3s ease forwards;

      // Remove all position arrows on mobile
      &::before {
        display: none !important;
      }

      // All position variants behave the same on mobile
      &.position-top,
      &.position-bottom,
      &.position-left,
      &.position-right {
        position: fixed !important;
        top: auto !important;
        left: 10px !important;
        right: 10px !important;
        bottom: 10px !important;
        transform: none !important;
      }

      .tooltip-header {
        @include ipad-spacing('padding', 12px, 16px, 16px);
        position: sticky;
        top: 0;
        background: inherit;
        z-index: 1;

        .tooltip-title {
          font-size: 16px;
        }

        .close-btn {
          @include touch-friendly;
          width: 28px;
          height: 28px;
        }
      }

      .tooltip-body {
        @include ipad-spacing('padding', 12px, 16px, 16px);

        .tooltip-text {
          font-size: 15px;
          line-height: 1.6;
        }

        .section-title {
          font-size: 14px;
          margin-top: 20px;
        }

        .best-practices {
          .practices-list {
            .practice-item {
              font-size: 14px;
              line-height: 1.6;
              margin-bottom: 8px;
            }
          }
        }

        .warning-section {
          @include ipad-spacing('padding', 12px, 16px, 16px);

          .warning-title,
          .warning-text {
            font-size: 14px;
          }
        }

        .related-settings {
          .related-list {
            .related-item {
              @include touch-friendly;
              @include ipad-spacing('padding', 12px, 16px, 16px);
              margin-bottom: 8px;

              .related-label {
                font-size: 14px;
              }

              .related-arrow {
                font-size: 14px;
              }
            }
          }
        }

        .tooltip-actions {
          flex-direction: column;
          gap: 12px;
          margin-top: 20px;
          padding-top: 20px;

          .action-btn {
            @include touch-friendly;
            font-size: 16px;
            padding: 12px;
          }
        }
      }
    }

    .tooltip-backdrop {
      background: rgba(0, 0, 0, 0.3);
    }
  }
}

@include respond-to('tablet') {
  .settings-help-tooltip {
    .help-trigger {
      @include touch-friendly;
      width: 28px;
      height: 28px;
      
      .help-icon {
        font-size: 13px;
      }
    }

    .tooltip-content {
      min-width: 320px;
      max-width: 480px;

      .tooltip-header {
        @include ipad-spacing('padding', 14px, 16px, 18px);

        .tooltip-title {
          font-size: 15px;
        }

        .close-btn {
          @include touch-friendly;
          width: 24px;
          height: 24px;
        }
      }

      .tooltip-body {
        @include ipad-spacing('padding', 14px, 16px, 18px);

        .tooltip-text {
          font-size: 14px;
        }

        .section-title {
          font-size: 13px;
        }

        .related-settings {
          .related-list {
            .related-item {
              @include touch-friendly;
              padding: 10px 14px;
            }
          }
        }

        .tooltip-actions {
          .action-btn {
            @include touch-friendly;
            padding: 10px 14px;
            font-size: 13px;
          }
        }
      }
    }
  }
}

@include respond-to('ipad') {
  .settings-help-tooltip {
    .tooltip-content {
      min-width: 340px;
      max-width: 500px;

      // Better positioning for iPad landscape
      &.position-left,
      &.position-right {
        max-width: 400px;
      }
    }
  }
}

@include respond-to('ipad-pro') {
  .settings-help-tooltip {
    .tooltip-content {
      min-width: 360px;
      max-width: 520px;

      .tooltip-body {
        .related-settings {
          .related-list {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;

            .related-item {
              margin-bottom: 0;
            }
          }
        }
      }
    }
  }
}

@keyframes tooltipSlideUp {
  from {
    opacity: 0;
    transform: translateY(100%);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>