<template>
  <view v-if="visible" class="modal-overlay" @click="handleClose">
    <view class="modal-container" @click.stop>
      <view class="modal-header">
        <text class="modal-title">导出设置</text>
        <button class="close-btn" @click="handleClose">×</button>
      </view>

      <view class="modal-content">
        <text class="modal-description">
          选择要导出的设置分类，导出的文件可以在其他系统中导入使用。
        </text>

        <view class="category-list">
          <view v-for="category in categories" :key="category" class="category-item">
            <checkbox
              :checked="selectedCategories.includes(category)"
              @change="toggleCategory(category)"
            />
            <text class="category-label">{{ getCategoryLabel(category) }}</text>
          </view>
        </view>
      </view>

      <view class="modal-actions">
        <button class="modal-btn secondary" @click="handleClose">取消</button>
        <button
          class="modal-btn primary"
          @click="handleExport"
          :disabled="selectedCategories.length === 0"
        >
          导出设置
        </button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  visible: boolean
  categories: string[]
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
  export: [categories: string[]]
}>()

const selectedCategories = ref<string[]>([])

function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    general: '常规设置',
    business: '业务规则',
    security: '安全设置',
    notification: '通知设置',
    integration: '集成设置',
    appearance: '外观设置',
    backup: '备份设置',
    maintenance: '维护设置'
  }
  return labels[category] || category
}

function toggleCategory(category: string) {
  const index = selectedCategories.value.indexOf(category)
  if (index > -1) {
    selectedCategories.value.splice(index, 1)
  } else {
    selectedCategories.value.push(category)
  }
}

function handleClose() {
  emit('close')
  selectedCategories.value = []
}

function handleExport() {
  emit('export', selectedCategories.value)
  handleClose()
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
  max-width: 500px;
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

  .modal-description {
    display: block;
    font-size: $font-size-base;
    color: $text-color-secondary;
    margin-bottom: $spacing-lg;
    line-height: 1.5;
  }

  .category-list {
    .category-item {
      display: flex;
      align-items: center;
      gap: $spacing-sm;
      padding: $spacing-sm 0;

      .category-label {
        font-size: $font-size-base;
        color: $text-color;
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

    &.secondary {
      background: $bg-color-white;
      color: $text-color-secondary;
      border: 1px solid $border-color;
    }

    &.primary {
      background: $primary-color;
      color: white;
      border: 1px solid $primary-color;

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }
  }
}
</style>
