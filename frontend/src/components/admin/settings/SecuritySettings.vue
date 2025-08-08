<template>
  <view class="security-settings">
    <view class="settings-section">
      <text class="section-title">身份认证</text>
      
      <view class="settings-group">
        <view class="setting-item">
          <view class="setting-label">
            <text class="label-text">密码最小长度</text>
            <text class="label-desc">用户密码的最小字符数要求</text>
          </view>
          <view class="setting-control">
            <input
              v-model.number="localSettings.min_password_length"
              class="setting-input"
              type="number"
              min="6"
              max="50"
              @blur="handleUpdate('min_password_length', localSettings.min_password_length)"
            />
            <text class="unit">字符</text>
          </view>
        </view>
        
        <view class="setting-item">
          <view class="setting-label">
            <text class="label-text">密码复杂度要求</text>
            <text class="label-desc">密码必须包含大小写字母、数字和特殊字符</text>
          </view>
          <switch
            :checked="localSettings.require_password_complexity"
            @change="handleSwitchChange('require_password_complexity', $event)"
            color="#2563eb"
          />
        </view>
        
        <view class="setting-item">
          <view class="setting-label">
            <text class="label-text">启用双因素认证</text>
            <text class="label-desc">要求用户使用短信或邮箱验证码登录</text>
          </view>
          <switch
            :checked="localSettings.enable_2fa"
            @change="handleSwitchChange('enable_2fa', $event)"
            color="#16a34a"
          />
        </view>
      </view>
    </view>
    
    <view class="settings-section">
      <text class="section-title">会话管理</text>
      
      <view class="settings-group">
        <view class="setting-item">
          <view class="setting-label">
            <text class="label-text">会话超时时间</text>
            <text class="label-desc">用户无操作后自动退出的时间</text>
          </view>
          <view class="setting-control">
            <input
              v-model.number="localSettings.session_timeout_minutes"
              class="setting-input"
              type="number"
              min="5"
              max="1440"
              @blur="handleUpdate('session_timeout_minutes', localSettings.session_timeout_minutes)"
            />
            <text class="unit">分钟</text>
          </view>
        </view>
        
        <view class="setting-item">
          <view class="setting-label">
            <text class="label-text">记住登录状态</text>
            <text class="label-desc">允许用户选择保持登录状态</text>
          </view>
          <switch
            :checked="localSettings.allow_remember_me"
            @change="handleSwitchChange('allow_remember_me', $event)"
            color="#2563eb"
          />
        </view>
        
        <view class="setting-item">
          <view class="setting-label">
            <text class="label-text">单点登录</text>
            <text class="label-desc">同一账号只能在一个设备上登录</text>
          </view>
          <switch
            :checked="localSettings.single_session_only"
            @change="handleSwitchChange('single_session_only', $event)"
            color="#dc2626"
          />
        </view>
      </view>
    </view>
    
    <view class="settings-section">
      <text class="section-title">访问控制</text>
      
      <view class="settings-group">
        <view class="setting-item">
          <view class="setting-label">
            <text class="label-text">登录失败锁定</text>
            <text class="label-desc">连续登录失败后锁定账户</text>
          </view>
          <switch
            :checked="localSettings.enable_login_lockout"
            @change="handleSwitchChange('enable_login_lockout', $event)"
            color="#dc2626"
          />
        </view>
        
        <view class="setting-item">
          <view class="setting-label">
            <text class="label-text">最大失败次数</text>
            <text class="label-desc">账户锁定前允许的最大登录失败次数</text>
          </view>
          <view class="setting-control">
            <input
              v-model.number="localSettings.max_login_attempts"
              class="setting-input"
              type="number"
              min="3"
              max="10"
              @blur="handleUpdate('max_login_attempts', localSettings.max_login_attempts)"
            />
            <text class="unit">次</text>
          </view>
        </view>
        
        <view class="setting-item">
          <view class="setting-label">
            <text class="label-text">锁定持续时间</text>
            <text class="label-desc">账户锁定后的解锁等待时间</text>
          </view>
          <view class="setting-control">
            <input
              v-model.number="localSettings.lockout_duration_minutes"
              class="setting-input"
              type="number"
              min="5"
              max="1440"
              @blur="handleUpdate('lockout_duration_minutes', localSettings.lockout_duration_minutes)"
            />
            <text class="unit">分钟</text>
          </view>
        </view>
        
        <view class="setting-item">
          <view class="setting-label">
            <text class="label-text">IP访问限制</text>
            <text class="label-desc">限制只能从特定IP地址访问系统</text>
          </view>
          <switch
            :checked="localSettings.enable_ip_restriction"
            @change="handleSwitchChange('enable_ip_restriction', $event)"
            color="#dc2626"
          />
        </view>
      </view>
    </view>
    
    <view class="settings-section">
      <text class="section-title">数据保护</text>
      
      <view class="settings-group">
        <view class="setting-item">
          <view class="setting-label">
            <text class="label-text">启用数据加密</text>
            <text class="label-desc">对敏感数据进行加密存储</text>
          </view>
          <switch
            :checked="localSettings.enable_data_encryption"
            @change="handleSwitchChange('enable_data_encryption', $event)"
            color="#16a34a"
          />
        </view>
        
        <view class="setting-item">
          <view class="setting-label">
            <text class="label-text">审计日志</text>
            <text class="label-desc">记录用户操作和系统变更日志</text>
          </view>
          <switch
            :checked="localSettings.enable_audit_logging"
            @change="handleSwitchChange('enable_audit_logging', $event)"
            color="#2563eb"
          />
        </view>
        
        <view class="setting-item">
          <view class="setting-label">
            <text class="label-text">日志保留期限</text>
            <text class="label-desc">安全日志的保留天数</text>
          </view>
          <view class="setting-control">
            <input
              v-model.number="localSettings.log_retention_days"
              class="setting-input"
              type="number"
              min="30"
              max="3650"
              @blur="handleUpdate('log_retention_days', localSettings.log_retention_days)"
            />
            <text class="unit">天</text>
          </view>
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

const emit = defineEmits<{
  update: [key: string, value: any]
}>()

// Local settings state
const localSettings = ref<Record<string, any>>({
  min_password_length: 8,
  require_password_complexity: true,
  enable_2fa: false,
  session_timeout_minutes: 120,
  allow_remember_me: true,
  single_session_only: false,
  enable_login_lockout: true,
  max_login_attempts: 5,
  lockout_duration_minutes: 30,
  enable_ip_restriction: false,
  enable_data_encryption: true,
  enable_audit_logging: true,
  log_retention_days: 365,
  ...props.settings
})

// Methods
function handleUpdate(key: string, value: any) {
  localSettings.value[key] = value
  emit('update', key, value)
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

.security-settings {
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
      border-bottom: 2px solid $danger-color;
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
      
      .setting-control {
        display: flex;
        align-items: center;
        gap: $spacing-xs;
        
        .unit {
          font-size: $font-size-base;
          color: $text-color-secondary;
        }
      }
      
      .setting-input {
        width: 120px;
        padding: $spacing-sm $spacing-base;
        border: 1px solid $border-color;
        border-radius: $border-radius-base;
        font-size: $font-size-base;
        text-align: right;
        
        &:focus {
          border-color: $danger-color;
          outline: none;
        }
      }
    }
  }
}

// Responsive design
@media (max-width: 768px) {
  .security-settings {
    .settings-group {
      .setting-item {
        flex-direction: column;
        align-items: stretch;
        gap: $spacing-base;
        
        .setting-label {
          margin-right: 0;
        }
        
        .setting-control {
          width: 100%;
          justify-content: flex-start;
        }
        
        .setting-input {
          width: 120px;
        }
      }
    }
  }
}
</style>