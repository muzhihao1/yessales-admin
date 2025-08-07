<template>
  <view class="security-settings">
    <view class="settings-section">
      <view class="section-header">
        <text class="section-title">安全设置</text>
        <text class="section-description">配置系统安全策略和认证规则</text>
      </view>

      <uni-forms ref="formRef" :model="formData" :rules="rules" validate-trigger="onChange">
        <!-- 密码策略 -->
        <view class="form-group">
          <text class="group-title">密码策略</text>
          
          <uni-forms-item label="最小密码长度" name="minPasswordLength">
            <uni-number-box
              v-model="formData.minPasswordLength"
              :min="6"
              :max="32"
              :step="1"
              @change="handleInputChange('minPasswordLength', $event)"
            />
          </uni-forms-item>

          <uni-forms-item label="密码复杂度要求" name="passwordComplexity">
            <view class="checkbox-group">
              <checkbox-group @change="handlePasswordComplexityChange">
                <label class="checkbox-item">
                  <checkbox 
                    value="uppercase" 
                    :checked="formData.passwordComplexity.includes('uppercase')"
                  />
                  <text>包含大写字母</text>
                </label>
                <label class="checkbox-item">
                  <checkbox 
                    value="lowercase" 
                    :checked="formData.passwordComplexity.includes('lowercase')"
                  />
                  <text>包含小写字母</text>
                </label>
                <label class="checkbox-item">
                  <checkbox 
                    value="numbers" 
                    :checked="formData.passwordComplexity.includes('numbers')"
                  />
                  <text>包含数字</text>
                </label>
                <label class="checkbox-item">
                  <checkbox 
                    value="symbols" 
                    :checked="formData.passwordComplexity.includes('symbols')"
                  />
                  <text>包含特殊字符</text>
                </label>
              </checkbox-group>
            </view>
          </uni-forms-item>

          <uni-forms-item label="密码有效期(天)" name="passwordExpiryDays">
            <uni-number-box
              v-model="formData.passwordExpiryDays"
              :min="0"
              :max="365"
              :step="1"
              @change="handleInputChange('passwordExpiryDays', $event)"
            />
            <text class="field-hint">0表示永不过期</text>
          </uni-forms-item>

          <uni-forms-item label="密码历史检查" name="passwordHistoryCount">
            <uni-number-box
              v-model="formData.passwordHistoryCount"
              :min="0"
              :max="10"
              :step="1"
              @change="handleInputChange('passwordHistoryCount', $event)"
            />
            <text class="field-hint">防止重复使用最近N个密码</text>
          </uni-forms-item>
        </view>

        <!-- 登录安全 -->
        <view class="form-group">
          <text class="group-title">登录安全</text>
          
          <uni-forms-item label="启用双因子认证" name="enableTwoFactorAuth">
            <switch
              :checked="formData.enableTwoFactorAuth"
              @change="handleSwitchChange('enableTwoFactorAuth', $event)"
            />
          </uni-forms-item>

          <uni-forms-item label="最大登录失败次数" name="maxLoginAttempts">
            <uni-number-box
              v-model="formData.maxLoginAttempts"
              :min="3"
              :max="20"
              :step="1"
              @change="handleInputChange('maxLoginAttempts', $event)"
            />
          </uni-forms-item>

          <uni-forms-item label="账户锁定时间(分钟)" name="accountLockoutDuration">
            <uni-number-box
              v-model="formData.accountLockoutDuration"
              :min="5"
              :max="1440"
              :step="5"
              @change="handleInputChange('accountLockoutDuration', $event)"
            />
          </uni-forms-item>

          <uni-forms-item label="强制首次登录修改密码" name="forcePasswordChangeOnFirstLogin">
            <switch
              :checked="formData.forcePasswordChangeOnFirstLogin"
              @change="handleSwitchChange('forcePasswordChangeOnFirstLogin', $event)"
            />
          </uni-forms-item>

          <uni-forms-item label="记住登录状态天数" name="rememberMeDays">
            <uni-number-box
              v-model="formData.rememberMeDays"
              :min="1"
              :max="30"
              :step="1"
              @change="handleInputChange('rememberMeDays', $event)"
            />
          </uni-forms-item>
        </view>

        <!-- 会话管理 -->
        <view class="form-group">
          <text class="group-title">会话管理</text>
          
          <uni-forms-item label="会话超时时间(分钟)" name="sessionTimeout">
            <uni-number-box
              v-model="formData.sessionTimeout"
              :min="5"
              :max="480"
              :step="5"
              @change="handleInputChange('sessionTimeout', $event)"
            />
          </uni-forms-item>

          <uni-forms-item label="同时在线会话数" name="maxConcurrentSessions">
            <uni-number-box
              v-model="formData.maxConcurrentSessions"
              :min="1"
              :max="10"
              :step="1"
              @change="handleInputChange('maxConcurrentSessions', $event)"
            />
          </uni-forms-item>

          <uni-forms-item label="会话固化保护" name="enableSessionFixationProtection">
            <switch
              :checked="formData.enableSessionFixationProtection"
              @change="handleSwitchChange('enableSessionFixationProtection', $event)"
            />
            <text class="field-hint">登录后重新生成会话ID</text>
          </uni-forms-item>

          <uni-forms-item label="检测异常登录位置" name="enableLocationBasedSecurity">
            <switch
              :checked="formData.enableLocationBasedSecurity"
              @change="handleSwitchChange('enableLocationBasedSecurity', $event)"
            />
          </uni-forms-item>
        </view>

        <!-- 数据保护 -->
        <view class="form-group">
          <text class="group-title">数据保护</text>
          
          <uni-forms-item label="强制HTTPS连接" name="enforceHttps">
            <switch
              :checked="formData.enforceHttps"
              @change="handleSwitchChange('enforceHttps', $event)"
            />
          </uni-forms-item>

          <uni-forms-item label="启用数据加密" name="enableDataEncryption">
            <switch
              :checked="formData.enableDataEncryption"
              @change="handleSwitchChange('enableDataEncryption', $event)"
            />
          </uni-forms-item>

          <uni-forms-item label="API请求频率限制" name="apiRateLimit">
            <uni-number-box
              v-model="formData.apiRateLimit"
              :min="10"
              :max="1000"
              :step="10"
              @change="handleInputChange('apiRateLimit', $event)"
            />
            <text class="field-hint">每分钟最大请求数</text>
          </uni-forms-item>

          <uni-forms-item label="启用API密钥验证" name="enableApiKeyAuth">
            <switch
              :checked="formData.enableApiKeyAuth"
              @change="handleSwitchChange('enableApiKeyAuth', $event)"
            />
          </uni-forms-item>
        </view>

        <!-- 审计日志 -->
        <view class="form-group">
          <text class="group-title">审计日志</text>
          
          <uni-forms-item label="启用操作审计" name="enableAuditLogging">
            <switch
              :checked="formData.enableAuditLogging"
              @change="handleSwitchChange('enableAuditLogging', $event)"
            />
          </uni-forms-item>

          <uni-forms-item label="日志保留期(天)" name="auditLogRetentionDays">
            <uni-number-box
              v-model="formData.auditLogRetentionDays"
              :min="30"
              :max="365"
              :step="1"
              @change="handleInputChange('auditLogRetentionDays', $event)"
            />
          </uni-forms-item>

          <uni-forms-item label="记录敏感操作" name="logSensitiveOperations">
            <switch
              :checked="formData.logSensitiveOperations"
              @change="handleSwitchChange('logSensitiveOperations', $event)"
            />
          </uni-forms-item>

          <uni-forms-item label="启用实时安全监控" name="enableSecurityMonitoring">
            <switch
              :checked="formData.enableSecurityMonitoring"
              @change="handleSwitchChange('enableSecurityMonitoring', $event)"
            />
          </uni-forms-item>
        </view>

        <!-- IP访问控制 -->
        <view class="form-group">
          <text class="group-title">IP访问控制</text>
          
          <uni-forms-item label="启用IP白名单" name="enableIpWhitelist">
            <switch
              :checked="formData.enableIpWhitelist"
              @change="handleSwitchChange('enableIpWhitelist', $event)"
            />
          </uni-forms-item>

          <uni-forms-item label="IP白名单" name="ipWhitelist" v-if="formData.enableIpWhitelist">
            <uni-easyinput
              v-model="formData.ipWhitelist"
              type="textarea"
              placeholder="每行一个IP地址或IP段，例如：192.168.1.1 或 192.168.1.0/24"
              :auto-height="true"
              maxlength="1000"
              @input="handleInputChange('ipWhitelist', $event)"
            />
          </uni-forms-item>

          <uni-forms-item label="启用IP黑名单" name="enableIpBlacklist">
            <switch
              :checked="formData.enableIpBlacklist"
              @change="handleSwitchChange('enableIpBlacklist', $event)"
            />
          </uni-forms-item>

          <uni-forms-item label="IP黑名单" name="ipBlacklist" v-if="formData.enableIpBlacklist">
            <uni-easyinput
              v-model="formData.ipBlacklist"
              type="textarea"
              placeholder="每行一个IP地址或IP段"
              :auto-height="true"
              maxlength="1000"
              @input="handleInputChange('ipBlacklist', $event)"
            />
          </uni-forms-item>
        </view>
      </uni-forms>
    </view>

    <!-- 安全状态检查 -->
    <view class="security-status">
      <view class="status-header">
        <text class="status-title">安全状态检查</text>
      </view>
      <view class="status-items">
        <view class="status-item" :class="{ 'status-warning': !securityStatus.httpsEnabled }">
          <text class="status-icon">{{ securityStatus.httpsEnabled ? '✅' : '⚠️' }}</text>
          <text class="status-text">HTTPS连接</text>
        </view>
        <view class="status-item" :class="{ 'status-warning': !securityStatus.passwordPolicyStrong }">
          <text class="status-icon">{{ securityStatus.passwordPolicyStrong ? '✅' : '⚠️' }}</text>
          <text class="status-text">密码策略</text>
        </view>
        <view class="status-item" :class="{ 'status-warning': !securityStatus.twoFactorEnabled }">
          <text class="status-icon">{{ securityStatus.twoFactorEnabled ? '✅' : '⚠️' }}</text>
          <text class="status-text">双因子认证</text>
        </view>
        <view class="status-item" :class="{ 'status-warning': !securityStatus.auditLogEnabled }">
          <text class="status-icon">{{ securityStatus.auditLogEnabled ? '✅' : '⚠️' }}</text>
          <text class="status-text">审计日志</text>
        </view>
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
 * 安全设置组件
 * 
 * 功能说明：
 * - 管理密码策略和复杂度要求
 * - 配置登录安全和双因子认证
 * - 设置会话管理和超时策略
 * - 配置数据保护和加密选项
 * - 管理审计日志和安全监控
 * - 设置IP访问控制（白名单/黑名单）
 * 
 * 安全最佳实践：
 * - 所有安全配置都在服务端验证
 * - 敏感操作需要额外确认
 * - 遵循最小权限原则
 * - 实时安全状态监控
 * 
 * @author Terminal 3 (Admin Frontend Team)
 */

interface SecuritySettingsForm {
  // 密码策略
  minPasswordLength: number
  passwordComplexity: string[]
  passwordExpiryDays: number
  passwordHistoryCount: number
  
  // 登录安全
  enableTwoFactorAuth: boolean
  maxLoginAttempts: number
  accountLockoutDuration: number
  forcePasswordChangeOnFirstLogin: boolean
  rememberMeDays: number
  
  // 会话管理
  sessionTimeout: number
  maxConcurrentSessions: number
  enableSessionFixationProtection: boolean
  enableLocationBasedSecurity: boolean
  
  // 数据保护
  enforceHttps: boolean
  enableDataEncryption: boolean
  apiRateLimit: number
  enableApiKeyAuth: boolean
  
  // 审计日志
  enableAuditLogging: boolean
  auditLogRetentionDays: number
  logSensitiveOperations: boolean
  enableSecurityMonitoring: boolean
  
  // IP访问控制
  enableIpWhitelist: boolean
  ipWhitelist: string
  enableIpBlacklist: boolean
  ipBlacklist: string
}

const settingsStore = useSettingsStore()

// 表单引用和状态
const formRef = ref()
const loading = ref(false)
const originalData = ref<SecuritySettingsForm>({} as SecuritySettingsForm)

// 表单数据
const formData = ref<SecuritySettingsForm>({
  // 密码策略
  minPasswordLength: 8,
  passwordComplexity: ['lowercase', 'numbers'],
  passwordExpiryDays: 90,
  passwordHistoryCount: 5,
  
  // 登录安全
  enableTwoFactorAuth: false,
  maxLoginAttempts: 5,
  accountLockoutDuration: 15,
  forcePasswordChangeOnFirstLogin: true,
  rememberMeDays: 7,
  
  // 会话管理
  sessionTimeout: 30,
  maxConcurrentSessions: 3,
  enableSessionFixationProtection: true,
  enableLocationBasedSecurity: true,
  
  // 数据保护
  enforceHttps: true,
  enableDataEncryption: true,
  apiRateLimit: 100,
  enableApiKeyAuth: true,
  
  // 审计日志
  enableAuditLogging: true,
  auditLogRetentionDays: 90,
  logSensitiveOperations: true,
  enableSecurityMonitoring: true,
  
  // IP访问控制
  enableIpWhitelist: false,
  ipWhitelist: '',
  enableIpBlacklist: false,
  ipBlacklist: ''
})

// 表单验证规则
const rules = {
  minPasswordLength: {
    rules: [
      { type: 'number', min: 6, max: 32, errorMessage: '密码长度应在6-32位之间' }
    ]
  },
  maxLoginAttempts: {
    rules: [
      { type: 'number', min: 3, max: 20, errorMessage: '登录失败次数应在3-20次之间' }
    ]
  },
  accountLockoutDuration: {
    rules: [
      { type: 'number', min: 5, max: 1440, errorMessage: '锁定时间应在5-1440分钟之间' }
    ]
  },
  sessionTimeout: {
    rules: [
      { type: 'number', min: 5, max: 480, errorMessage: '会话超时时间应在5-480分钟之间' }
    ]
  },
  apiRateLimit: {
    rules: [
      { type: 'number', min: 10, max: 1000, errorMessage: 'API频率限制应在10-1000次/分钟之间' }
    ]
  },
  auditLogRetentionDays: {
    rules: [
      { type: 'number', min: 30, max: 365, errorMessage: '日志保留期应在30-365天之间' }
    ]
  }
}

// 计算属性
const hasChanges = computed(() => {
  return JSON.stringify(formData.value) !== JSON.stringify(originalData.value)
})

const securityStatus = computed(() => {
  return {
    httpsEnabled: formData.value.enforceHttps,
    passwordPolicyStrong: formData.value.minPasswordLength >= 8 && 
                         formData.value.passwordComplexity.length >= 3,
    twoFactorEnabled: formData.value.enableTwoFactorAuth,
    auditLogEnabled: formData.value.enableAuditLogging
  }
})

// 事件处理
const handleInputChange = (field: keyof SecuritySettingsForm, value: any) => {
  (formData.value as any)[field] = value
}

const handleSwitchChange = (field: keyof SecuritySettingsForm, event: any) => {
  (formData.value as any)[field] = event.detail.value
}

const handlePasswordComplexityChange = (event: any) => {
  formData.value.passwordComplexity = event.detail.value
}

const handleReset = async () => {
  const result = await showModal({
    title: '确认重置',
    content: '确定要重置所有安全设置吗？这可能会影响系统安全性。'
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

    // 安全检查确认
    if (!formData.value.enforceHttps || !formData.value.enableDataEncryption) {
      const result = await showModal({
        title: '安全警告',
        content: '您选择了较低的安全设置，这可能会增加安全风险。确定要继续吗？'
      })
      
      if (!result.confirm) {
        return
      }
    }

    loading.value = true

    // 转换为设置格式
    const settings: Partial<SystemSettings>[] = Object.entries(formData.value).map(([key, value]) => ({
      category: 'security' as const,
      key,
      value,
      type: Array.isArray(value) ? 'array' :
            typeof value === 'boolean' ? 'boolean' : 
            typeof value === 'number' ? 'number' : 'string'
    }))

    // 保存设置
    await settingsStore.updateSettings(settings)
    
    // 更新原始数据
    originalData.value = { ...formData.value }
    
    showToast('安全设置保存成功')
  } catch (error) {
    console.error('保存安全设置失败:', error)
    showToast('保存失败，请稍后重试', 'error')
  } finally {
    loading.value = false
  }
}

// 加载设置数据
const loadSettings = async () => {
  try {
    const securitySettings = settingsStore.getSettingsByCategory('security')
    
    // 将设置数据填充到表单
    securitySettings.forEach(setting => {
      if (setting.key in formData.value) {
        (formData.value as any)[setting.key] = setting.value
      }
    })
    
    // 保存原始数据用于重置
    originalData.value = { ...formData.value }
  } catch (error) {
    console.error('加载安全设置失败:', error)
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
.security-settings {
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
      
      .checkbox-group {
        .checkbox-item {
          display: flex;
          align-items: center;
          margin-bottom: 8px;
          
          checkbox {
            margin-right: 8px;
          }
          
          text {
            font-size: 14px;
            color: var(--text-color-primary);
          }
        }
      }
      
      .field-hint {
        font-size: 12px;
        color: var(--text-color-tertiary);
        margin-top: 4px;
        display: block;
      }
    }
  }
  
  .security-status {
    background: #fff;
    border-radius: 8px;
    margin-bottom: 16px;
    
    .status-header {
      padding: 20px;
      border-bottom: 1px solid var(--border-color-light);
      
      .status-title {
        font-size: 16px;
        font-weight: 500;
        color: var(--text-color-primary);
      }
    }
    
    .status-items {
      padding: 20px;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      
      .status-item {
        display: flex;
        align-items: center;
        padding: 12px;
        border-radius: 6px;
        background: var(--color-success-light);
        
        &.status-warning {
          background: var(--color-warning-light);
        }
        
        .status-icon {
          font-size: 16px;
          margin-right: 8px;
        }
        
        .status-text {
          font-size: 14px;
          color: var(--text-color-primary);
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
  .security-settings {
    .settings-section, .security-status {
      margin: 0 -16px 16px;
      border-radius: 0;
      
      .section-header,
      .status-header,
      .form-group,
      .status-items {
        padding: 16px;
      }
    }
    
    .security-status .status-items {
      grid-template-columns: 1fr;
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