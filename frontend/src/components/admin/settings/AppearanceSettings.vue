<template>
  <view class="appearance-settings">
    <view class="settings-section">
      <text class="section-title">外观设置</text>
      
      <view class="settings-group">
        <view class="setting-item">
          <view class="setting-label">
            <text class="label-text">主题模式</text>
            <text class="label-desc">选择界面主题色调</text>
          </view>
          <switch
            :checked="localSettings.dark_mode"
            @change="handleSwitchChange('dark_mode', $event)"
            color="#2563eb"
          />
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

interface Props {
  settings: Record<string, any>
}

const props = defineProps<Props>()
const emit = defineEmits<{ update: [key: string, value: any] }>()

const localSettings = ref<Record<string, any>>({
  dark_mode: false,
  ...props.settings
})

function handleSwitchChange(key: string, e: any) {
  const value = e.detail.value
  localSettings.value[key] = value
  emit('update', key, value)
}

watch(() => props.settings, (newSettings) => {
  localSettings.value = { ...localSettings.value, ...newSettings }
}, { deep: true })
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.appearance-settings {
  .settings-section {
    .section-title {
      font-size: $font-size-large;
      font-weight: 600;
      color: $text-color;
      display: block;
      margin-bottom: $spacing-lg;
      padding-bottom: $spacing-xs;
      border-bottom: 2px solid $success-color;
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
    }
  }
}
</style>