<template>
  <view class="general-settings">
    <view class="settings-section">
      <view class="section-header">
        <text class="section-title">基本信息</text>
        <text class="section-description">配置应用的基本信息和显示设置</text>
      </view>

      <uni-forms ref="formRef" :model="formData" :rules="rules" validate-trigger="onChange">
        <!-- 应用信息 -->
        <view class="form-group">
          <text class="group-title">应用配置</text>
          
          <uni-forms-item label="应用名称" name="appName" required>
            <uni-easyinput
              v-model="formData.appName"
              placeholder="请输入应用名称"
              :clearable="true"
              @input="handleInputChange('appName', $event)"
            />
          </uni-forms-item>

          <uni-forms-item label="应用描述" name="appDescription">
            <uni-easyinput
              v-model="formData.appDescription"
              type="textarea"
              placeholder="请输入应用描述"
              :auto-height="true"
              maxlength="500"
              @input="handleInputChange('appDescription', $event)"
            />
          </uni-forms-item>

          <uni-forms-item label="应用版本" name="appVersion">
            <uni-easyinput
              v-model="formData.appVersion"
              placeholder="请输入版本号"
              :clearable="true"
              @input="handleInputChange('appVersion', $event)"
            />
          </uni-forms-item>
        </view>

        <!-- 区域和语言设置 -->
        <view class="form-group">
          <text class="group-title">区域设置</text>
          
          <uni-forms-item label="默认语言" name="defaultLanguage" required>
            <uni-data-picker
              v-model="formData.defaultLanguage"
              :localdata="languageOptions"
              placeholder="选择默认语言"
              @change="handlePickerChange('defaultLanguage', $event)"
            />
          </uni-forms-item>

          <uni-forms-item label="时区设置" name="timezone" required>
            <uni-data-picker
              v-model="formData.timezone"
              :localdata="timezoneOptions"
              placeholder="选择时区"
              @change="handlePickerChange('timezone', $event)"
            />
          </uni-forms-item>

          <uni-forms-item label="默认货币" name="defaultCurrency" required>
            <uni-data-picker
              v-model="formData.defaultCurrency"
              :localdata="currencyOptions"
              placeholder="选择默认货币"
              @change="handlePickerChange('defaultCurrency', $event)"
            />
          </uni-forms-item>

          <uni-forms-item label="日期格式" name="dateFormat">
            <uni-data-picker
              v-model="formData.dateFormat"
              :localdata="dateFormatOptions"
              placeholder="选择日期格式"
              @change="handlePickerChange('dateFormat', $event)"
            />
          </uni-forms-item>

          <uni-forms-item label="时间格式" name="timeFormat">
            <uni-data-picker
              v-model="formData.timeFormat"
              :localdata="timeFormatOptions"
              placeholder="选择时间格式"
              @change="handlePickerChange('timeFormat', $event)"
            />
          </uni-forms-item>
        </view>

        <!-- 系统设置 -->
        <view class="form-group">
          <text class="group-title">系统配置</text>
          
          <uni-forms-item label="会话超时(分钟)" name="sessionTimeout">
            <uni-number-box
              v-model="formData.sessionTimeout"
              :min="5"
              :max="1440"
              :step="5"
              @change="handleInputChange('sessionTimeout', $event)"
            />
          </uni-forms-item>

          <uni-forms-item label="默认页面大小" name="defaultPageSize">
            <uni-data-picker
              v-model="formData.defaultPageSize"
              :localdata="pageSizeOptions"
              placeholder="选择默认页面大小"
              @change="handlePickerChange('defaultPageSize', $event)"
            />
          </uni-forms-item>

          <uni-forms-item label="启用调试模式" name="enableDebugMode">
            <switch
              :checked="formData.enableDebugMode"
              @change="handleSwitchChange('enableDebugMode', $event)"
            />
          </uni-forms-item>

          <uni-forms-item label="启用数据缓存" name="enableDataCache">
            <switch
              :checked="formData.enableDataCache"
              @change="handleSwitchChange('enableDataCache', $event)"
            />
          </uni-forms-item>
        </view>

        <!-- 公司信息 -->
        <view class="form-group">
          <text class="group-title">公司信息</text>
          
          <uni-forms-item label="公司名称" name="companyName">
            <uni-easyinput
              v-model="formData.companyName"
              placeholder="请输入公司名称"
              :clearable="true"
              @input="handleInputChange('companyName', $event)"
            />
          </uni-forms-item>

          <uni-forms-item label="公司地址" name="companyAddress">
            <uni-easyinput
              v-model="formData.companyAddress"
              type="textarea"
              placeholder="请输入公司地址"
              :auto-height="true"
              maxlength="200"
              @input="handleInputChange('companyAddress', $event)"
            />
          </uni-forms-item>

          <uni-forms-item label="联系电话" name="companyPhone">
            <uni-easyinput
              v-model="formData.companyPhone"
              placeholder="请输入联系电话"
              :clearable="true"
              @input="handleInputChange('companyPhone', $event)"
            />
          </uni-forms-item>

          <uni-forms-item label="联系邮箱" name="companyEmail">
            <uni-easyinput
              v-model="formData.companyEmail"
              placeholder="请输入联系邮箱"
              :clearable="true"
              @input="handleInputChange('companyEmail', $event)"
            />
          </uni-forms-item>

          <uni-forms-item label="公司网站" name="companyWebsite">
            <uni-easyinput
              v-model="formData.companyWebsite"
              placeholder="请输入公司网站"
              :clearable="true"
              @input="handleInputChange('companyWebsite', $event)"
            />
          </uni-forms-item>
        </view>
      </uni-forms>
    </view>

    <!-- 操作按钮 -->
    <view class="actions">
      <button class="btn-secondary" @click="handleReset">重置</button>
      <button class="btn-primary" :disabled="!hasChanges || loading" @click="handleSave">
        <text v-if="loading">保存中...</text>
        <text v-else>保存设置</text>
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { showToast, showModal } from '@/utils/ui'
import type { SystemSettings } from '@/types/settings'

/**
 * 通用设置组件
 * 
 * 功能说明：
 * - 管理应用的基本配置信息
 * - 处理区域化设置（语言、时区、货币等）
 * - 配置系统行为参数
 * - 管理公司基本信息
 * 
 * @author Terminal 3 (Admin Frontend Team)
 */

interface GeneralSettingsForm {
  // 应用信息
  appName: string
  appDescription: string
  appVersion: string
  
  // 区域设置
  defaultLanguage: string
  timezone: string
  defaultCurrency: string
  dateFormat: string
  timeFormat: string
  
  // 系统设置
  sessionTimeout: number
  defaultPageSize: number
  enableDebugMode: boolean
  enableDataCache: boolean
  
  // 公司信息
  companyName: string
  companyAddress: string
  companyPhone: string
  companyEmail: string
  companyWebsite: string
}

const settingsStore = useSettingsStore()

// 表单引用和状态
const formRef = ref()
const loading = ref(false)
const originalData = ref<GeneralSettingsForm>({} as GeneralSettingsForm)

// 表单数据
const formData = ref<GeneralSettingsForm>({
  appName: '',
  appDescription: '',
  appVersion: '1.0.0',
  defaultLanguage: 'zh-CN',
  timezone: 'Asia/Shanghai',
  defaultCurrency: 'CNY',
  dateFormat: 'YYYY-MM-DD',
  timeFormat: '24h',
  sessionTimeout: 30,
  defaultPageSize: 20,
  enableDebugMode: false,
  enableDataCache: true,
  companyName: '',
  companyAddress: '',
  companyPhone: '',
  companyEmail: '',
  companyWebsite: ''
})

// 表单验证规则
const rules = {
  appName: {
    rules: [
      { required: true, errorMessage: '请输入应用名称' },
      { minLength: 2, maxLength: 50, errorMessage: '应用名称长度应在2-50个字符之间' }
    ]
  },
  appDescription: {
    rules: [
      { maxLength: 500, errorMessage: '应用描述不能超过500个字符' }
    ]
  },
  appVersion: {
    rules: [
      { pattern: /^\d+\.\d+\.\d+$/, errorMessage: '版本号格式应为 x.x.x' }
    ]
  },
  defaultLanguage: {
    rules: [
      { required: true, errorMessage: '请选择默认语言' }
    ]
  },
  timezone: {
    rules: [
      { required: true, errorMessage: '请选择时区' }
    ]
  },
  defaultCurrency: {
    rules: [
      { required: true, errorMessage: '请选择默认货币' }
    ]
  },
  sessionTimeout: {
    rules: [
      { type: 'number', min: 5, max: 1440, errorMessage: '会话超时时间应在5-1440分钟之间' }
    ]
  },
  companyEmail: {
    rules: [
      { format: 'email', errorMessage: '请输入正确的邮箱地址' }
    ]
  },
  companyWebsite: {
    rules: [
      { format: 'url', errorMessage: '请输入正确的网站地址' }
    ]
  }
}

// 选项数据
const languageOptions = [
  { value: 'zh-CN', text: '简体中文' },
  { value: 'zh-TW', text: '繁体中文' },
  { value: 'en-US', text: 'English' },
  { value: 'ja-JP', text: '日本語' },
  { value: 'ko-KR', text: '한국어' }
]

const timezoneOptions = [
  { value: 'Asia/Shanghai', text: '北京时间 (UTC+8)' },
  { value: 'Asia/Tokyo', text: '东京时间 (UTC+9)' },
  { value: 'America/New_York', text: '纽约时间 (UTC-5)' },
  { value: 'Europe/London', text: '伦敦时间 (UTC+0)' },
  { value: 'UTC', text: '协调世界时 (UTC)' }
]

const currencyOptions = [
  { value: 'CNY', text: '人民币 ¥' },
  { value: 'USD', text: '美元 $' },
  { value: 'EUR', text: '欧元 €' },
  { value: 'JPY', text: '日元 ¥' },
  { value: 'KRW', text: '韩元 ₩' }
]

const dateFormatOptions = [
  { value: 'YYYY-MM-DD', text: '2024-01-01' },
  { value: 'DD/MM/YYYY', text: '01/01/2024' },
  { value: 'MM/DD/YYYY', text: '01/01/2024' },
  { value: 'DD-MM-YYYY', text: '01-01-2024' }
]

const timeFormatOptions = [
  { value: '24h', text: '24小时制' },
  { value: '12h', text: '12小时制' }
]

const pageSizeOptions = [
  { value: 10, text: '10条/页' },
  { value: 20, text: '20条/页' },
  { value: 50, text: '50条/页' },
  { value: 100, text: '100条/页' }
]

// 计算属性
const hasChanges = computed(() => {
  return JSON.stringify(formData.value) !== JSON.stringify(originalData.value)
})

// 事件处理
const handleInputChange = (field: keyof GeneralSettingsForm, value: any) => {
  (formData.value as any)[field] = value
}

const handlePickerChange = (field: keyof GeneralSettingsForm, event: any) => {
  (formData.value as any)[field] = event.detail.value
}

const handleSwitchChange = (field: keyof GeneralSettingsForm, event: any) => {
  (formData.value as any)[field] = event.detail.value
}

const handleReset = async () => {
  const result = await showModal({
    title: '确认重置',
    content: '确定要重置所有设置吗？未保存的更改将丢失。'
  })
  
  if (result.confirm) {
    formData.value = { ...originalData.value }
    showToast('已重置到上次保存的状态')
  }
}

const handleSave = async () => {
  try {
    // 表单验证
    const valid = await formRef.value.validate()
    if (!valid) {
      showToast('请检查表单输入', 'error')
      return
    }

    loading.value = true

    // 转换为设置格式
    const settings: Partial<SystemSettings>[] = Object.entries(formData.value).map(([key, value]) => ({
      category: 'general' as const,
      key,
      value,
      type: typeof value === 'boolean' ? 'boolean' : 
            typeof value === 'number' ? 'number' : 'string'
    }))

    // 保存设置
    await settingsStore.updateSettings(settings)
    
    // 更新原始数据
    originalData.value = { ...formData.value }
    
    showToast('设置保存成功')
  } catch (error) {
    console.error('保存设置失败:', error)
    showToast('保存失败，请稍后重试', 'error')
  } finally {
    loading.value = false
  }
}

// 加载设置数据
const loadSettings = async () => {
  try {
    const generalSettings = settingsStore.getSettingsByCategory('general')
    
    // 将设置数据填充到表单
    generalSettings.forEach(setting => {
      if (setting.key in formData.value) {
        (formData.value as any)[setting.key] = setting.value
      }
    })
    
    // 保存原始数据用于重置
    originalData.value = { ...formData.value }
  } catch (error) {
    console.error('加载设置失败:', error)
    showToast('加载设置失败', 'error')
  }
}

// 生命周期
onMounted(() => {
  loadSettings()
})

// 监听设置变化
watch(() => settingsStore.settings, () => {
  loadSettings()
}, { deep: true })
</script>

<style lang="scss" scoped>
.general-settings {
  .settings-section {
    background: #fff;
    border-radius: 8px;
    margin-bottom: 16px;
    
    .section-header {
      padding: 20px;
      border-bottom: 1px solid var(--border-color-light);
      
      .section-title {
        font-size: 18px;
        font-weight: 600;
        color: var(--text-color-primary);
        display: block;
        margin-bottom: 4px;
      }
      
      .section-description {
        font-size: 14px;
        color: var(--text-color-secondary);
      }
    }
    
    .form-group {
      padding: 20px;
      
      &:not(:last-child) {
        border-bottom: 1px solid var(--border-color-light);
      }
      
      .group-title {
        font-size: 16px;
        font-weight: 500;
        color: var(--text-color-primary);
        display: block;
        margin-bottom: 16px;
      }
    }
  }
  
  .actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding: 20px;
    background: #fff;
    border-radius: 8px;
    
    .btn-secondary, .btn-primary {
      padding: 10px 24px;
      border-radius: 6px;
      font-size: 14px;
      border: none;
      cursor: pointer;
      transition: all 0.2s;
      
      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }
    
    .btn-secondary {
      background: var(--color-grey-100);
      color: var(--text-color-secondary);
      
      &:hover:not(:disabled) {
        background: var(--color-grey-200);
      }
    }
    
    .btn-primary {
      background: var(--color-primary);
      color: #fff;
      
      &:hover:not(:disabled) {
        background: var(--color-primary-dark);
      }
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .general-settings {
    .settings-section {
      margin: 0 -16px 16px;
      border-radius: 0;
      
      .section-header,
      .form-group {
        padding: 16px;
      }
    }
    
    .actions {
      margin: 0 -16px;
      border-radius: 0;
      padding: 16px;
      
      .btn-secondary, .btn-primary {
        flex: 1;
        text-align: center;
      }
    }
  }
}
</style>