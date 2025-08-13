<template>
  <view class="maintenance-settings">
    <view class="settings-section">
      <text class="section-title">维护设置</text>

      <view class="settings-group">
        <view class="setting-item">
          <view class="setting-label">
            <text class="label-text">日志级别</text>
            <text class="label-desc">系统日志记录级别</text>
          </view>
          <picker
            mode="selector"
            :range="logLevelOptions"
            :value="logLevelIndex"
            @change="handleLogLevelChange"
          >
            <view class="setting-picker">
              <text>{{ localSettings.log_level || 'info' }}</text>
              <text class="picker-arrow">▼</text>
            </view>
          </picker>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

interface Props {
  settings: Record<string, any>
}

const props = defineProps<Props>()
const emit = defineEmits<{ update: [key: string, value: any] }>()

const localSettings = ref<Record<string, any>>({
  log_level: 'info',
  ...props.settings
})

const logLevelOptions = ['debug', 'info', 'warn', 'error']

const logLevelIndex = computed(() => {
  return logLevelOptions.findIndex(option => option === localSettings.value.log_level)
})

function handleLogLevelChange(e: any) {
  const selectedLevel = logLevelOptions[e.detail.value]
  localSettings.value.log_level = selectedLevel
  emit('update', 'log_level', selectedLevel)
}

watch(
  () => props.settings,
  newSettings => {
    localSettings.value = { ...localSettings.value, ...newSettings }
  },
  { deep: true }
)
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.maintenance-settings {
  .settings-section {
    .section-title {
      font-size: $font-size-large;
      font-weight: 600;
      color: $text-color;
      display: block;
      margin-bottom: $spacing-lg;
      padding-bottom: $spacing-xs;
      border-bottom: 2px solid $warning-color;
    }
  }

  .settings-group {
    background: $bg-color-white;
    border-radius: $border-radius-lg;
    border: 1px solid $border-color;
    overflow: hidden;

    .setting-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: $spacing-lg;
      border-bottom: 1px solid $border-color-light;

      &:last-child {
        border-bottom: none;
      }

      .setting-label {
        flex: 1;
        margin-right: $spacing-lg;

        .label-text {
          font-size: $font-size-base;
          font-weight: 500;
          color: $text-color;
          display: block;
          margin-bottom: $spacing-xs;
        }

        .label-desc {
          font-size: $font-size-small;
          color: $text-color-secondary;
          line-height: 1.4;
        }
      }

      .setting-picker {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 120px;
        padding: $spacing-sm $spacing-base;
        border: 1px solid $border-color;
        border-radius: $border-radius-base;
        background: $bg-color-white;
        cursor: pointer;

        &:hover {
          border-color: $warning-color;
        }

        .picker-arrow {
          font-size: 12px;
          color: $text-color-secondary;
        }
      }
    }
  }
}
</style>
