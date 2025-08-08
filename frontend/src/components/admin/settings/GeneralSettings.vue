<template>
  <view class="general-settings">
    <view class="settings-section">
      <text class="section-title">基本配置</text>
      
      <view class="settings-group">
        <view class="setting-item">
          <view class="setting-label">
            <text class="label-text">系统名称</text>
            <text class="label-desc">显示在系统顶部的应用名称</text>
          </view>
          <input
            v-model="localSettings.system_name"
            class="setting-input"
            placeholder="请输入系统名称"
            @blur="handleUpdate('system_name', localSettings.system_name)"
          />
        </view>
        
        <view class="setting-item">
          <view class="setting-label">
            <text class="label-text">公司名称</text>
            <text class="label-desc">显示在报价单等文档上的公司名称</text>
          </view>
          <input
            v-model="localSettings.company_name"
            class="setting-input"
            placeholder="请输入公司名称"
            @blur="handleUpdate('company_name', localSettings.company_name)"
          />
        </view>
        
        <view class="setting-item">
          <view class="setting-label">
            <text class="label-text">联系电话</text>
            <text class="label-desc">客户联系时显示的电话号码</text>
          </view>
          <input
            v-model="localSettings.contact_phone"
            class="setting-input"
            placeholder="请输入联系电话"
            @blur="handleUpdate('contact_phone', localSettings.contact_phone)"
          />
        </view>
      </view>
    </view>
    
    <view class="settings-section">
      <text class="section-title">界面配置</text>
      
      <view class="settings-group">
        <view class="setting-item">
          <view class="setting-label">
            <text class="label-text">默认语言</text>
            <text class="label-desc">系统默认显示语言</text>
          </view>
          <picker
            mode="selector"
            :range="languageOptions"
            :range-key="'label'"
            :value="languageIndex"
            @change="handleLanguageChange"
          >
            <view class="setting-picker">
              <text>{{ localSettings.default_language || '简体中文' }}</text>
              <text class="picker-arrow">▼</text>
            </view>
          </picker>
        </view>
        
        <view class="setting-item">
          <view class="setting-label">
            <text class="label-text">时区设置</text>
            <text class="label-desc">系统时间显示时区</text>
          </view>
          <picker
            mode="selector"
            :range="timezoneOptions"
            :range-key="'label'"
            :value="timezoneIndex"
            @change="handleTimezoneChange"
          >
            <view class="setting-picker">
              <text>{{ localSettings.timezone || '东八区 (UTC+8)' }}</text>
              <text class="picker-arrow">▼</text>
            </view>
          </picker>
        </view>
        
        <view class="setting-item">
          <view class="setting-label">
            <text class="label-text">每页显示条数</text>
            <text class="label-desc">列表页面默认每页显示的数据条数</text>
          </view>
          <picker
            mode="selector"
            :range="pageSizeOptions"
            :value="pageSizeIndex"
            @change="handlePageSizeChange"
          >
            <view class="setting-picker">
              <text>{{ localSettings.default_page_size || '20' }} 条/页</text>
              <text class="picker-arrow">▼</text>
            </view>
          </picker>
        </view>
      </view>
    </view>
    
    <view class="settings-section">
      <text class="section-title">功能开关</text>
      
      <view class="settings-group">
        <view class="setting-item">
          <view class="setting-label">
            <text class="label-text">启用调试模式</text>
            <text class="label-desc">开启后将显示详细的错误信息和调试日志</text>
          </view>
          <switch
            :checked="localSettings.debug_mode"
            @change="handleSwitchChange('debug_mode', $event)"
            color="#2563eb"
          />
        </view>
        
        <view class="setting-item">
          <view class="setting-label">
            <text class="label-text">启用维护模式</text>
            <text class="label-desc">开启后系统将显示维护页面，仅管理员可访问</text>
          </view>
          <switch
            :checked="localSettings.maintenance_mode"
            @change="handleSwitchChange('maintenance_mode', $event)"
            color="#dc2626"
          />
        </view>
        
        <view class="setting-item">
          <view class="setting-label">
            <text class="label-text">允许用户注册</text>
            <text class="label-desc">关闭后新用户无法自主注册，需要管理员邀请</text>
          </view>
          <switch
            :checked="localSettings.allow_registration"
            @change="handleSwitchChange('allow_registration', $event)"
            color="#16a34a"
          />
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

const emit = defineEmits<{
  update: [key: string, value: any]
}>()

// Local settings state
const localSettings = ref<Record<string, any>>({
  system_name: '',
  company_name: '',
  contact_phone: '',
  default_language: '简体中文',
  timezone: 'Asia/Shanghai',
  default_page_size: 20,
  debug_mode: false,
  maintenance_mode: false,
  allow_registration: true,
  ...props.settings
})

// Options
const languageOptions = [
  { value: 'zh-CN', label: '简体中文' },
  { value: 'zh-TW', label: '繁体中文' },
  { value: 'en-US', label: 'English' }
]

const timezoneOptions = [
  { value: 'Asia/Shanghai', label: '东八区 (UTC+8)' },
  { value: 'Asia/Tokyo', label: '东九区 (UTC+9)' },
  { value: 'America/New_York', label: '西五区 (UTC-5)' },
  { value: 'Europe/London', label: '零时区 (UTC+0)' }
]

const pageSizeOptions = ['10', '20', '50', '100']

// Computed properties
const languageIndex = computed(() => {
  return languageOptions.findIndex(option => option.label === localSettings.value.default_language)
})

const timezoneIndex = computed(() => {
  return timezoneOptions.findIndex(option => option.value === localSettings.value.timezone)
})

const pageSizeIndex = computed(() => {
  return pageSizeOptions.findIndex(option => option === String(localSettings.value.default_page_size))
})

// Methods
function handleUpdate(key: string, value: any) {
  localSettings.value[key] = value
  emit('update', key, value)
}

function handleLanguageChange(e: any) {
  const selectedLanguage = languageOptions[e.detail.value]
  localSettings.value.default_language = selectedLanguage.label
  localSettings.value.language_code = selectedLanguage.value
  emit('update', 'default_language', selectedLanguage.label)
  emit('update', 'language_code', selectedLanguage.value)
}

function handleTimezoneChange(e: any) {
  const selectedTimezone = timezoneOptions[e.detail.value]
  localSettings.value.timezone = selectedTimezone.value
  emit('update', 'timezone', selectedTimezone.value)
}

function handlePageSizeChange(e: any) {
  const selectedPageSize = parseInt(pageSizeOptions[e.detail.value])
  localSettings.value.default_page_size = selectedPageSize
  emit('update', 'default_page_size', selectedPageSize)
}

function handleSwitchChange(key: string, e: any) {
  const value = e.detail.value
  localSettings.value[key] = value
  emit('update', key, value)
}

// Watch for props changes
watch(() => props.settings, (newSettings) => {
  localSettings.value = { ...localSettings.value, ...newSettings }
}, { deep: true })
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.general-settings {
  .settings-section {
    margin-bottom: $spacing-xl;
    
    &:last-child {
      margin-bottom: 0;
    }
    
    .section-title {
      font-size: $font-size-large;
      font-weight: 600;
      color: $text-color;
      display: block;
      margin-bottom: $spacing-lg;
      padding-bottom: $spacing-xs;
      border-bottom: 2px solid $primary-color;
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
      
      .setting-input {
        width: 200px;
        padding: $spacing-sm $spacing-base;
        border: 1px solid $border-color;
        border-radius: $border-radius-base;
        font-size: $font-size-base;
        
        &:focus {
          border-color: $primary-color;
          outline: none;
        }
      }
      
      .setting-picker {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 200px;
        padding: $spacing-sm $spacing-base;
        border: 1px solid $border-color;
        border-radius: $border-radius-base;
        background: $bg-color-white;
        cursor: pointer;
        
        &:hover {
          border-color: $primary-color;
        }
        
        .picker-arrow {
          font-size: 12px;
          color: $text-color-secondary;
        }
      }
    }
  }
}

// Responsive design
@media (max-width: 768px) {
  .general-settings {
    .settings-group {
      .setting-item {
        flex-direction: column;
        align-items: stretch;
        gap: $spacing-base;
        
        .setting-label {
          margin-right: 0;
        }
        
        .setting-input,
        .setting-picker {
          width: 100%;
        }
      }
    }
  }
}
</style>