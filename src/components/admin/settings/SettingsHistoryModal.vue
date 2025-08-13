<template>
  <view v-if="visible" class="modal-overlay" @click="handleClose">
    <view class="modal-container" @click.stop>
      <view class="modal-header">
        <text class="modal-title">变更历史</text>
        <button class="close-btn" @click="handleClose">×</button>
      </view>

      <view class="modal-content">
        <text class="modal-description">
          查看 {{ getCategoryName(category) }} 的设置变更历史记录
        </text>

        <view class="history-list">
          <view v-if="history.length === 0" class="empty-state">
            <text>暂无变更记录</text>
          </view>
          <view v-else v-for="item in history" :key="item.id" class="history-item">
            <view class="history-content">
              <text class="history-action">{{ item.action }}</text>
              <text class="history-details">{{ item.details }}</text>
              <text class="history-time">{{ formatTime(item.created_at) }}</text>
            </view>
          </view>
        </view>
      </view>

      <view class="modal-actions">
        <button class="modal-btn primary" @click="handleClose">关闭</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
interface Props {
  visible: boolean
  history: any[]
  category: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
}>()

function getCategoryName(category: string): string {
  const names: Record<string, string> = {
    general: '常规设置',
    business: '业务规则',
    security: '安全设置',
    notification: '通知设置',
    integration: '集成设置',
    appearance: '外观设置',
    backup: '备份设置',
    maintenance: '维护设置'
  }
  return names[category] || category
}

function formatTime(timestamp: string): string {
  return new Date(timestamp).toLocaleString('zh-CN')
}

function handleClose() {
  emit('close')
}
</script>

<style lang="scss" scoped>
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
}

.modal-container {
  background: $bg-color-white;
  border-radius: $border-radius-lg;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $spacing-lg;
  border-bottom: 1px solid $border-color;

  .modal-title {
    font-size: $font-size-large;
    font-weight: 600;
    color: $text-color;
  }

  .close-btn {
    width: 32px;
    height: 32px;
    border: none;
    background: none;
    font-size: 24px;
    cursor: pointer;
  }
}

.modal-content {
  padding: $spacing-lg;
  max-height: 400px;
  overflow-y: auto;

  .modal-description {
    display: block;
    font-size: $font-size-base;
    color: $text-color-secondary;
    margin-bottom: $spacing-lg;
    line-height: 1.5;
  }

  .history-list {
    .empty-state {
      text-align: center;
      padding: $spacing-xl;
      color: $text-color-secondary;
      font-style: italic;
    }

    .history-item {
      padding: $spacing-base;
      border-bottom: 1px solid $border-color-light;

      &:last-child {
        border-bottom: none;
      }

      .history-content {
        .history-action {
          font-size: $font-size-base;
          font-weight: 500;
          color: $text-color;
          display: block;
          margin-bottom: $spacing-xs;
        }

        .history-details {
          font-size: $font-size-small;
          color: $text-color-secondary;
          display: block;
          margin-bottom: $spacing-xs;
        }

        .history-time {
          font-size: $font-size-small;
          color: $text-color-placeholder;
        }
      }
    }
  }
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: $spacing-base;
  padding: $spacing-lg;
  border-top: 1px solid $border-color;

  .modal-btn {
    padding: $spacing-sm $spacing-lg;
    border-radius: $border-radius-base;
    font-size: $font-size-base;
    cursor: pointer;

    &.primary {
      background: $primary-color;
      color: white;
      border: 1px solid $primary-color;
    }
  }
}
</style>
