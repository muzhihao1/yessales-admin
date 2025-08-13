<template>
  <view v-if="visible" class="modal-overlay" @click="handleClose">
    <view class="modal-container" @click.stop>
      <view class="modal-header">
        <text class="modal-title">导入设置</text>
        <button class="close-btn" @click="handleClose">×</button>
      </view>

      <view class="modal-content">
        <text class="modal-description">
          选择要导入的设置文件，系统将验证文件格式并导入配置。
        </text>

        <view class="file-upload">
          <button class="upload-btn" @click="selectFile">
            <text>选择文件</text>
          </button>
          <text v-if="selectedFile" class="file-name">{{ selectedFile.name }}</text>
        </view>
      </view>

      <view class="modal-actions">
        <button class="modal-btn secondary" @click="handleClose">取消</button>
        <button class="modal-btn primary" @click="handleImport" :disabled="!selectedFile">
          导入设置
        </button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  visible: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
  import: [data: any]
}>()

const selectedFile = ref<File | null>(null)

function selectFile() {
  // Simulate file selection
  selectedFile.value = { name: 'settings_export.json' } as File
}

function handleClose() {
  emit('close')
  selectedFile.value = null
}

function handleImport() {
  if (selectedFile.value) {
    // Simulate import data
    const importData = {
      version: '1.0',
      categories: ['general', 'security'],
      settings: {}
    }
    emit('import', importData)
    handleClose()
  }
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

  .file-upload {
    display: flex;
    align-items: center;
    gap: $spacing-base;

    .upload-btn {
      padding: $spacing-sm $spacing-lg;
      background: $primary-color;
      color: white;
      border: 1px solid $primary-color;
      border-radius: $border-radius-base;
      cursor: pointer;
    }

    .file-name {
      font-size: $font-size-base;
      color: $text-color;
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
