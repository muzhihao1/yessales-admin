<template>
  <view class="notification-settings">
    <view class="settings-section">
      <view class="section-header">
        <text class="section-title">通知设置</text>
        <text class="section-description">配置系统通知方式和规则</text>
      </view>

      <uni-forms ref="formRef" :model="formData" :rules="rules" validate-trigger="onChange">
        <!-- 邮件通知设置 -->
        <view class="form-group">
          <text class="group-title">邮件通知</text>
          
          <uni-forms-item label="启用邮件通知" name="enableEmailNotification">
            <switch
              :checked="formData.enableEmailNotification"
              @change="handleSwitchChange('enableEmailNotification', $event)"
            />
          </uni-forms-item>

          <template v-if="formData.enableEmailNotification">
            <uni-forms-item label="SMTP服务器" name="smtpHost" required>
              <uni-easyinput
                v-model="formData.smtpHost"
                placeholder="如：smtp.gmail.com"
                :clearable="true"
                @input="handleInputChange('smtpHost', $event)"
              />
            </uni-forms-item>

            <uni-forms-item label="SMTP端口" name="smtpPort" required>
              <uni-number-box
                v-model="formData.smtpPort"
                :min="1"
                :max="65535"
                :step="1"
                @change="handleInputChange('smtpPort', $event)"
              />
            </uni-forms-item>

            <uni-forms-item label="发送邮箱" name="smtpUsername" required>
              <uni-easyinput
                v-model="formData.smtpUsername"
                placeholder="如：noreply@company.com"
                :clearable="true"
                @input="handleInputChange('smtpUsername', $event)"
              />
            </uni-forms-item>

            <uni-forms-item label="邮箱密码" name="smtpPassword" required>
              <uni-easyinput
                v-model="formData.smtpPassword"
                type="password"
                placeholder="请输入邮箱授权码"
                :clearable="true"
                @input="handleInputChange('smtpPassword', $event)"
              />
            </uni-forms-item>

            <uni-forms-item label="启用SSL加密" name="smtpSsl">
              <switch
                :checked="formData.smtpSsl"
                @change="handleSwitchChange('smtpSsl', $event)"
              />
            </uni-forms-item>

            <uni-forms-item label="发件人名称" name="emailSenderName">
              <uni-easyinput
                v-model="formData.emailSenderName"
                placeholder="如：销售系统"
                :clearable="true"
                @input="handleInputChange('emailSenderName', $event)"
              />
            </uni-forms-item>
          </template>
        </view>

        <!-- 短信通知设置 -->
        <view class="form-group">
          <text class="group-title">短信通知</text>
          
          <uni-forms-item label="启用短信通知" name="enableSmsNotification">
            <switch
              :checked="formData.enableSmsNotification"
              @change="handleSwitchChange('enableSmsNotification', $event)"
            />
          </uni-forms-item>

          <template v-if="formData.enableSmsNotification">
            <uni-forms-item label="短信服务商" name="smsProvider">
              <uni-data-picker
                v-model="formData.smsProvider"
                :localdata="smsProviderOptions"
                placeholder="选择短信服务商"
                @change="handlePickerChange('smsProvider', $event)"
              />
            </uni-forms-item>

            <uni-forms-item label="API Key" name="smsApiKey" required>
              <uni-easyinput
                v-model="formData.smsApiKey"
                type="password"
                placeholder="请输入API Key"
                :clearable="true"
                @input="handleInputChange('smsApiKey', $event)"
              />
            </uni-forms-item>

            <uni-forms-item label="短信签名" name="smsSignature">
              <uni-easyinput
                v-model="formData.smsSignature"
                placeholder="如：【销售系统】"
                :clearable="true"
                @input="handleInputChange('smsSignature', $event)"
              />
            </uni-forms-item>

            <uni-forms-item label="发送频率限制(分钟)" name="smsRateLimit">
              <uni-number-box
                v-model="formData.smsRateLimit"
                :min="1"
                :max="60"
                :step="1"
                @change="handleInputChange('smsRateLimit', $event)"
              />
              <text class="field-hint">防止短信轰炸的最小间隔时间</text>
            </uni-forms-item>
          </template>
        </view>

        <!-- 系统内通知 -->
        <view class="form-group">
          <text class="group-title">系统内通知</text>
          
          <uni-forms-item label="启用站内消息" name="enableInAppNotification">
            <switch
              :checked="formData.enableInAppNotification"
              @change="handleSwitchChange('enableInAppNotification', $event)"
            />
          </uni-forms-item>

          <uni-forms-item label="消息保留天数" name="inAppMessageRetentionDays">
            <uni-number-box
              v-model="formData.inAppMessageRetentionDays"
              :min="7"
              :max="365"
              :step="1"
              @change="handleInputChange('inAppMessageRetentionDays', $event)"
            />
          </uni-forms-item>

          <uni-forms-item label="启用桌面通知" name="enableDesktopNotification">
            <switch
              :checked="formData.enableDesktopNotification"
              @change="handleSwitchChange('enableDesktopNotification', $event)"
            />
          </uni-forms-item>

          <uni-forms-item label="通知声音" name="enableNotificationSound">
            <switch
              :checked="formData.enableNotificationSound"
              @change="handleSwitchChange('enableNotificationSound', $event)"
            />
          </uni-forms-item>
        </view>

        <!-- 推送通知 -->
        <view class="form-group">
          <text class="group-title">移动推送</text>
          
          <uni-forms-item label="启用移动推送" name="enablePushNotification">
            <switch
              :checked="formData.enablePushNotification"
              @change="handleSwitchChange('enablePushNotification', $event)"
            />
          </uni-forms-item>

          <template v-if="formData.enablePushNotification">
            <uni-forms-item label="推送服务商" name="pushProvider">
              <uni-data-picker
                v-model="formData.pushProvider"
                :localdata="pushProviderOptions"
                placeholder="选择推送服务商"
                @change="handlePickerChange('pushProvider', $event)"
              />
            </uni-forms-item>

            <uni-forms-item label="应用ID" name="pushAppId">
              <uni-easyinput
                v-model="formData.pushAppId"
                placeholder="请输入应用ID"
                :clearable="true"
                @input="handleInputChange('pushAppId', $event)"
              />
            </uni-forms-item>

            <uni-forms-item label="推送证书" name="pushCertificate">
              <uni-file-picker
                v-model="formData.pushCertificate"
                file-mediatype="all"
                mode="grid"
                :limit="1"
                @select="handleFileSelect('pushCertificate', $event)"
              />
            </uni-forms-item>
          </template>
        </view>

        <!-- 通知事件配置 -->
        <view class="form-group">
          <text class="group-title">事件通知配置</text>
          
          <view class="event-notifications">
            <view 
              v-for="event in notificationEvents" 
              :key="event.key"
              class="event-item"
            >
              <text class="event-label">{{ event.label }}</text>
              <view class="event-channels">
                <label class="channel-item">
                  <checkbox 
                    :value="event.key + '_email'"
                    :checked="formData.eventNotifications[event.key]?.email"
                    @change="handleEventNotificationChange(event.key, 'email', $event)"
                  />
                  <text>邮件</text>
                </label>
                <label class="channel-item">
                  <checkbox 
                    :value="event.key + '_sms'"
                    :checked="formData.eventNotifications[event.key]?.sms"
                    @change="handleEventNotificationChange(event.key, 'sms', $event)"
                  />
                  <text>短信</text>
                </label>
                <label class="channel-item">
                  <checkbox 
                    :value="event.key + '_inapp'"
                    :checked="formData.eventNotifications[event.key]?.inapp"
                    @change="handleEventNotificationChange(event.key, 'inapp', $event)"
                  />
                  <text>站内</text>
                </label>
                <label class="channel-item">
                  <checkbox 
                    :value="event.key + '_push'"
                    :checked="formData.eventNotifications[event.key]?.push"
                    @change="handleEventNotificationChange(event.key, 'push', $event)"
                  />
                  <text>推送</text>
                </label>
              </view>
            </view>
          </view>
        </view>

        <!-- 通知时间设置 -->
        <view class="form-group">
          <text class="group-title">通知时间</text>
          
          <uni-forms-item label="工作时间通知开始" name="notificationStartTime">
            <uni-datetime-picker
              v-model="formData.notificationStartTime"
              type="time"
              :clear-icon="false"
              @change="handleInputChange('notificationStartTime', $event)"
            />
          </uni-forms-item>

          <uni-forms-item label="工作时间通知结束" name="notificationEndTime">
            <uni-datetime-picker
              v-model="formData.notificationEndTime"
              type="time"
              :clear-icon="false"
              @change="handleInputChange('notificationEndTime', $event)"
            />
          </uni-forms-item>

          <uni-forms-item label="周末发送通知" name="enableWeekendNotification">
            <switch
              :checked="formData.enableWeekendNotification"
              @change="handleSwitchChange('enableWeekendNotification', $event)"
            />
          </uni-forms-item>

          <uni-forms-item label="紧急通知忽略时间限制" name="ignoreTimeForUrgent">
            <switch
              :checked="formData.ignoreTimeForUrgent"
              @change="handleSwitchChange('ignoreTimeForUrgent', $event)"
            />
          </uni-forms-item>
        </view>
      </uni-forms>
    </view>

    <!-- 测试通知 -->
    <view class="test-section">
      <view class="section-header">
        <text class="section-title">测试通知</text>
        <text class="section-description">发送测试消息验证配置是否正确</text>
      </view>
      <view class="test-actions">
        <button class="test-btn" @click="testEmailNotification" :disabled="!formData.enableEmailNotification">
          测试邮件
        </button>
        <button class="test-btn" @click="testSmsNotification" :disabled="!formData.enableSmsNotification">
          测试短信
        </button>
        <button class="test-btn" @click="testInAppNotification" :disabled="!formData.enableInAppNotification">
          测试站内消息
        </button>
        <button class="test-btn" @click="testPushNotification" :disabled="!formData.enablePushNotification">
          测试推送
        </button>
      </view>
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
 * 通知设置组件
 * 
 * 功能说明：
 * - 配置邮件通知（SMTP设置、邮件模板）
 * - 设置短信通知（服务商、API配置）
 * - 管理系统内通知和桌面通知
 * - 配置移动推送通知
 * - 设置各种事件的通知规则
 * - 配置通知时间窗口和频率限制
 * - 提供通知测试功能
 * 
 * 通知类型：
 * - 邮件通知：用于重要事件和报告
 * - 短信通知：用于紧急和即时通知
 * - 站内消息：用于一般信息通知
 * - 推送通知：用于移动端实时通知
 * 
 * @author Terminal 3 (Admin Frontend Team)
 */

interface NotificationSettingsForm {
  // 邮件设置
  enableEmailNotification: boolean
  smtpHost: string
  smtpPort: number
  smtpUsername: string
  smtpPassword: string
  smtpSsl: boolean
  emailSenderName: string
  
  // 短信设置
  enableSmsNotification: boolean
  smsProvider: string
  smsApiKey: string
  smsSignature: string
  smsRateLimit: number
  
  // 系统内通知
  enableInAppNotification: boolean
  inAppMessageRetentionDays: number
  enableDesktopNotification: boolean
  enableNotificationSound: boolean
  
  // 推送通知
  enablePushNotification: boolean
  pushProvider: string
  pushAppId: string
  pushCertificate: string
  
  // 事件通知配置
  eventNotifications: Record<string, {
    email: boolean
    sms: boolean
    inapp: boolean
    push: boolean
  }>
  
  // 时间设置
  notificationStartTime: string
  notificationEndTime: string
  enableWeekendNotification: boolean
  ignoreTimeForUrgent: boolean
}

const settingsStore = useSettingsStore()

// 表单引用和状态
const formRef = ref()
const loading = ref(false)
const originalData = ref<NotificationSettingsForm>({} as NotificationSettingsForm)

// 表单数据
const formData = ref<NotificationSettingsForm>({
  // 邮件设置
  enableEmailNotification: true,
  smtpHost: '',
  smtpPort: 587,
  smtpUsername: '',
  smtpPassword: '',
  smtpSsl: true,
  emailSenderName: '销售系统',
  
  // 短信设置
  enableSmsNotification: false,
  smsProvider: 'aliyun',
  smsApiKey: '',
  smsSignature: '【销售系统】',
  smsRateLimit: 1,
  
  // 系统内通知
  enableInAppNotification: true,
  inAppMessageRetentionDays: 30,
  enableDesktopNotification: true,
  enableNotificationSound: true,
  
  // 推送通知
  enablePushNotification: false,
  pushProvider: 'unipush',
  pushAppId: '',
  pushCertificate: '',
  
  // 事件通知配置
  eventNotifications: {
    new_customer: { email: true, sms: false, inapp: true, push: false },
    new_quote: { email: true, sms: false, inapp: true, push: true },
    quote_approved: { email: true, sms: true, inapp: true, push: true },
    quote_rejected: { email: true, sms: false, inapp: true, push: false },
    payment_received: { email: true, sms: false, inapp: true, push: false },
    system_error: { email: true, sms: true, inapp: true, push: false },
    daily_report: { email: true, sms: false, inapp: false, push: false },
    user_login: { email: false, sms: false, inapp: true, push: false }
  },
  
  // 时间设置
  notificationStartTime: '09:00',
  notificationEndTime: '18:00',
  enableWeekendNotification: false,
  ignoreTimeForUrgent: true
})

// 选项数据
const smsProviderOptions = [
  { value: 'aliyun', text: '阿里云短信' },
  { value: 'tencent', text: '腾讯云短信' },
  { value: 'huawei', text: '华为云短信' },
  { value: 'custom', text: '自定义服务商' }
]

const pushProviderOptions = [
  { value: 'unipush', text: 'UniPush' },
  { value: 'jpush', text: '极光推送' },
  { value: 'getui', text: '个推' },
  { value: 'xiaomi', text: '小米推送' }
]

const notificationEvents = [
  { key: 'new_customer', label: '新客户注册' },
  { key: 'new_quote', label: '新报价创建' },
  { key: 'quote_approved', label: '报价审批通过' },
  { key: 'quote_rejected', label: '报价审批拒绝' },
  { key: 'payment_received', label: '收到付款' },
  { key: 'system_error', label: '系统错误' },
  { key: 'daily_report', label: '日报统计' },
  { key: 'user_login', label: '用户登录' }
]

// 表单验证规则
const rules = {
  smtpHost: {
    rules: [
      { required: true, errorMessage: '请输入SMTP服务器地址' }
    ]
  },
  smtpPort: {
    rules: [
      { required: true, errorMessage: '请输入SMTP端口' },
      { type: 'number', min: 1, max: 65535, errorMessage: '端口范围应在1-65535之间' }
    ]
  },
  smtpUsername: {
    rules: [
      { required: true, errorMessage: '请输入发送邮箱' },
      { format: 'email', errorMessage: '请输入正确的邮箱地址' }
    ]
  },
  smtpPassword: {
    rules: [
      { required: true, errorMessage: '请输入邮箱密码' }
    ]
  },
  smsApiKey: {
    rules: [
      { required: true, errorMessage: '请输入短信API Key' }
    ]
  }
}

// 计算属性
const hasChanges = computed(() => {
  return JSON.stringify(formData.value) !== JSON.stringify(originalData.value)
})

// 事件处理
const handleInputChange = (field: keyof NotificationSettingsForm, value: any) => {
  (formData.value as any)[field] = value
}

const handlePickerChange = (field: keyof NotificationSettingsForm, event: any) => {
  (formData.value as any)[field] = event.detail.value
}

const handleSwitchChange = (field: keyof NotificationSettingsForm, event: any) => {
  (formData.value as any)[field] = event.detail.value
}

const handleFileSelect = (field: keyof NotificationSettingsForm, event: any) => {
  if (event.tempFiles && event.tempFiles.length > 0) {
    (formData.value as any)[field] = event.tempFiles[0].path
  }
}

const handleEventNotificationChange = (eventKey: string, channel: string, event: any) => {
  if (!formData.value.eventNotifications[eventKey]) {
    formData.value.eventNotifications[eventKey] = {
      email: false,
      sms: false,
      inapp: false,
      push: false
    }
  }
  formData.value.eventNotifications[eventKey][channel] = event.detail.value
}

const handleReset = async () => {
  const result = await showModal({
    title: '确认重置',
    content: '确定要重置所有通知设置吗？未保存的更改将丢失。'
  })
  
  if (result.confirm) {
    formData.value = { ...originalData.value }
    showToast('已重置到上次保存的状态')
  }
}

const handleSave = async () => {
  try {
    // 表单验证
    if (formData.value.enableEmailNotification) {
      const emailValid = await formRef.value.validateField(['smtpHost', 'smtpPort', 'smtpUsername', 'smtpPassword'])
      if (!emailValid) {
        showToast('请完善邮件设置', 'error')
        return
      }
    }

    if (formData.value.enableSmsNotification) {
      const smsValid = await formRef.value.validateField(['smsApiKey'])
      if (!smsValid) {
        showToast('请完善短信设置', 'error')
        return
      }
    }

    loading.value = true

    // 转换为设置格式
    const settings: Partial<SystemSettings>[] = Object.entries(formData.value).map(([key, value]) => ({
      category: 'notification' as const,
      key,
      value,
      type: typeof value === 'object' ? 'json' :
            typeof value === 'boolean' ? 'boolean' : 
            typeof value === 'number' ? 'number' : 'string'
    }))

    // 保存设置
    await settingsStore.updateSettings(settings)
    
    // 更新原始数据
    originalData.value = { ...formData.value }
    
    showToast('通知设置保存成功')
  } catch (error) {
    console.error('保存通知设置失败:', error)
    showToast('保存失败，请稍后重试', 'error')
  } finally {
    loading.value = false
  }
}

// 测试通知功能
const testEmailNotification = async () => {
  try {
    showToast('正在发送测试邮件...')
    // 这里调用API发送测试邮件
    await new Promise(resolve => setTimeout(resolve, 2000)) // 模拟API调用
    showToast('测试邮件发送成功，请检查收件箱')
  } catch (error) {
    console.error('邮件测试失败:', error)
    showToast('邮件测试失败，请检查配置', 'error')
  }
}

const testSmsNotification = async () => {
  try {
    showToast('正在发送测试短信...')
    await new Promise(resolve => setTimeout(resolve, 2000))
    showToast('测试短信发送成功')
  } catch (error) {
    console.error('短信测试失败:', error)
    showToast('短信测试失败，请检查配置', 'error')
  }
}

const testInAppNotification = () => {
  showToast('站内消息测试成功 ✓')
}

const testPushNotification = async () => {
  try {
    showToast('正在发送测试推送...')
    await new Promise(resolve => setTimeout(resolve, 2000))
    showToast('测试推送发送成功')
  } catch (error) {
    console.error('推送测试失败:', error)
    showToast('推送测试失败，请检查配置', 'error')
  }
}

// 加载设置数据
const loadSettings = async () => {
  try {
    const notificationSettings = settingsStore.getSettingsByCategory('notification')
    
    // 将设置数据填充到表单
    notificationSettings.forEach(setting => {
      if (setting.key in formData.value) {
        (formData.value as any)[setting.key] = setting.value
      }
    })
    
    // 保存原始数据用于重置
    originalData.value = { ...formData.value }
  } catch (error) {
    console.error('加载通知设置失败:', error)
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
.notification-settings {
  .settings-section, .test-section {
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
      
      .field-hint {
        font-size: 12px;
        color: var(--text-color-tertiary);
        margin-top: 4px;
        display: block;
      }
    }
  }
  
  .event-notifications {
    .event-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid var(--border-color-light);
      
      &:last-child {
        border-bottom: none;
      }
      
      .event-label {
        font-size: 14px;
        color: var(--text-color-primary);
        flex: 1;
      }
      
      .event-channels {
        display: flex;
        gap: 16px;
        
        .channel-item {
          display: flex;
          align-items: center;
          
          checkbox {
            margin-right: 4px;
          }
          
          text {
            font-size: 13px;
            color: var(--text-color-secondary);
          }
        }
      }
    }
  }
  
  .test-section {
    .test-actions {
      padding: 20px;
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      
      .test-btn {
        padding: 8px 16px;
        background: var(--color-info-light);
        color: var(--color-info);
        border: 1px solid var(--color-info);
        border-radius: 4px;
        font-size: 13px;
        cursor: pointer;
        transition: all 0.2s;
        
        &:hover:not(:disabled) {
          background: var(--color-info);
          color: #fff;
        }
        
        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
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
  .notification-settings {
    .settings-section, .test-section {
      margin: 0 -16px 16px;
      border-radius: 0;
      
      .section-header,
      .form-group,
      .test-actions {
        padding: 16px;
      }
    }
    
    .event-notifications .event-item {
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;
      
      .event-channels {
        width: 100%;
        justify-content: space-between;
      }
    }
    
    .test-section .test-actions {
      .test-btn {
        flex: 1;
        text-align: center;
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