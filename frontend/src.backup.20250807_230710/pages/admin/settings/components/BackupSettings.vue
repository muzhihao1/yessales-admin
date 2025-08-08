<template>
  <view class="backup-settings">
    <view class="settings-section">
      <view class="section-header">
        <text class="section-title">备份设置</text>
        <text class="section-description">配置数据备份和恢复策略</text>
      </view>

      <uni-forms ref="formRef" :model="formData" :rules="rules" validate-trigger="onChange">
        <!-- 自动备份 -->
        <view class="form-group">
          <text class="group-title">自动备份</text>

          <uni-forms-item label="启用自动备份" name="enableAutoBackup">
            <switch
              :checked="formData.enableAutoBackup"
              @change="handleSwitchChange('enableAutoBackup', $event)"
            />
          </uni-forms-item>

          <template v-if="formData.enableAutoBackup">
            <uni-forms-item label="备份频率" name="backupFrequency" required>
              <uni-data-picker
                v-model="formData.backupFrequency"
                :localdata="backupFrequencyOptions"
                placeholder="选择备份频率"
                @change="handlePickerChange('backupFrequency', $event)"
              />
            </uni-forms-item>

            <uni-forms-item label="备份时间" name="backupTime" required>
              <uni-datetime-picker
                v-model="formData.backupTime"
                type="time"
                :clear-icon="false"
                @change="handleInputChange('backupTime', $event)"
              />
              <text class="field-hint">建议选择业务空闲时间进行备份</text>
            </uni-forms-item>

            <uni-forms-item label="备份内容" name="backupContent">
              <view class="checkbox-group">
                <checkbox-group @change="handleBackupContentChange">
                  <label
                    class="checkbox-item"
                    v-for="content in backupContentOptions"
                    :key="content.value"
                  >
                    <checkbox
                      :value="content.value"
                      :checked="formData.backupContent.includes(content.value)"
                    />
                    <text>{{ content.text }}</text>
                  </label>
                </checkbox-group>
              </view>
            </uni-forms-item>

            <uni-forms-item label="备份压缩" name="enableBackupCompression">
              <switch
                :checked="formData.enableBackupCompression"
                @change="handleSwitchChange('enableBackupCompression', $event)"
              />
              <text class="field-hint">压缩备份文件可节省存储空间</text>
            </uni-forms-item>

            <uni-forms-item label="备份加密" name="enableBackupEncryption">
              <switch
                :checked="formData.enableBackupEncryption"
                @change="handleSwitchChange('enableBackupEncryption', $event)"
              />
            </uni-forms-item>

            <uni-forms-item
              label="加密密码"
              name="backupEncryptionPassword"
              v-if="formData.enableBackupEncryption"
            >
              <uni-easyinput
                v-model="formData.backupEncryptionPassword"
                type="password"
                placeholder="请输入备份加密密码"
                :clearable="true"
                @input="handleInputChange('backupEncryptionPassword', $event)"
              />
              <text class="field-hint">请妥善保管加密密码，丢失将无法恢复备份</text>
            </uni-forms-item>
          </template>
        </view>

        <!-- 存储配置 -->
        <view class="form-group">
          <text class="group-title">存储配置</text>

          <uni-forms-item label="主存储位置" name="primaryStorageType" required>
            <uni-data-picker
              v-model="formData.primaryStorageType"
              :localdata="storageTypeOptions"
              placeholder="选择存储类型"
              @change="handlePickerChange('primaryStorageType', $event)"
            />
          </uni-forms-item>

          <!-- 本地存储配置 -->
          <template v-if="formData.primaryStorageType === 'local'">
            <uni-forms-item label="本地存储路径" name="localStoragePath" required>
              <uni-easyinput
                v-model="formData.localStoragePath"
                placeholder="/var/backups/yessales"
                :clearable="true"
                @input="handleInputChange('localStoragePath', $event)"
              />
            </uni-forms-item>
          </template>

          <!-- 云存储配置 -->
          <template
            v-if="['aliyun_oss', 'tencent_cos', 'aws_s3'].includes(formData.primaryStorageType)"
          >
            <uni-forms-item label="访问密钥ID" name="cloudAccessKeyId" required>
              <uni-easyinput
                v-model="formData.cloudAccessKeyId"
                placeholder="请输入访问密钥ID"
                :clearable="true"
                @input="handleInputChange('cloudAccessKeyId', $event)"
              />
            </uni-forms-item>

            <uni-forms-item label="访问密钥Secret" name="cloudAccessKeySecret" required>
              <uni-easyinput
                v-model="formData.cloudAccessKeySecret"
                type="password"
                placeholder="请输入访问密钥Secret"
                :clearable="true"
                @input="handleInputChange('cloudAccessKeySecret', $event)"
              />
            </uni-forms-item>

            <uni-forms-item label="存储桶名称" name="cloudBucketName" required>
              <uni-easyinput
                v-model="formData.cloudBucketName"
                placeholder="请输入存储桶名称"
                :clearable="true"
                @input="handleInputChange('cloudBucketName', $event)"
              />
            </uni-forms-item>

            <uni-forms-item label="存储区域" name="cloudRegion">
              <uni-easyinput
                v-model="formData.cloudRegion"
                placeholder="如：cn-hangzhou"
                :clearable="true"
                @input="handleInputChange('cloudRegion', $event)"
              />
            </uni-forms-item>

            <uni-forms-item label="存储路径前缀" name="cloudStoragePrefix">
              <uni-easyinput
                v-model="formData.cloudStoragePrefix"
                placeholder="backups/yessales/"
                :clearable="true"
                @input="handleInputChange('cloudStoragePrefix', $event)"
              />
            </uni-forms-item>
          </template>

          <!-- FTP存储配置 -->
          <template v-if="formData.primaryStorageType === 'ftp'">
            <uni-forms-item label="FTP服务器地址" name="ftpHost" required>
              <uni-easyinput
                v-model="formData.ftpHost"
                placeholder="ftp.example.com"
                :clearable="true"
                @input="handleInputChange('ftpHost', $event)"
              />
            </uni-forms-item>

            <uni-forms-item label="FTP端口" name="ftpPort">
              <uni-number-box
                v-model="formData.ftpPort"
                :min="1"
                :max="65535"
                :step="1"
                @change="handleInputChange('ftpPort', $event)"
              />
            </uni-forms-item>

            <uni-forms-item label="FTP用户名" name="ftpUsername" required>
              <uni-easyinput
                v-model="formData.ftpUsername"
                placeholder="请输入FTP用户名"
                :clearable="true"
                @input="handleInputChange('ftpUsername', $event)"
              />
            </uni-forms-item>

            <uni-forms-item label="FTP密码" name="ftpPassword" required>
              <uni-easyinput
                v-model="formData.ftpPassword"
                type="password"
                placeholder="请输入FTP密码"
                :clearable="true"
                @input="handleInputChange('ftpPassword', $event)"
              />
            </uni-forms-item>

            <uni-forms-item label="FTP目录" name="ftpDirectory">
              <uni-easyinput
                v-model="formData.ftpDirectory"
                placeholder="/backups"
                :clearable="true"
                @input="handleInputChange('ftpDirectory', $event)"
              />
            </uni-forms-item>
          </template>

          <uni-forms-item label="备份副本数量" name="backupCopies">
            <uni-number-box
              v-model="formData.backupCopies"
              :min="1"
              :max="10"
              :step="1"
              @change="handleInputChange('backupCopies', $event)"
            />
            <text class="field-hint">同时保留多少个备份文件</text>
          </uni-forms-item>
        </view>

        <!-- 保留策略 -->
        <view class="form-group">
          <text class="group-title">保留策略</text>

          <uni-forms-item label="备份保留期(天)" name="backupRetentionDays">
            <uni-number-box
              v-model="formData.backupRetentionDays"
              :min="7"
              :max="365"
              :step="1"
              @change="handleInputChange('backupRetentionDays', $event)"
            />
          </uni-forms-item>

          <uni-forms-item label="最大备份大小(GB)" name="maxBackupSize">
            <uni-number-box
              v-model="formData.maxBackupSize"
              :min="1"
              :max="1000"
              :step="1"
              @change="handleInputChange('maxBackupSize', $event)"
            />
            <text class="field-hint">超过此大小的备份将被自动删除</text>
          </uni-forms-item>

          <uni-forms-item label="自动清理过期备份" name="autoCleanupExpiredBackups">
            <switch
              :checked="formData.autoCleanupExpiredBackups"
              @change="handleSwitchChange('autoCleanupExpiredBackups', $event)"
            />
          </uni-forms-item>

          <uni-forms-item label="存储空间预警阈值(%)" name="storageWarningThreshold">
            <uni-number-box
              v-model="formData.storageWarningThreshold"
              :min="50"
              :max="95"
              :step="5"
              @change="handleInputChange('storageWarningThreshold', $event)"
            />
            <text class="field-hint">存储空间使用率达到此值时发送警告</text>
          </uni-forms-item>
        </view>

        <!-- 通知配置 -->
        <view class="form-group">
          <text class="group-title">通知配置</text>

          <uni-forms-item label="备份完成通知" name="notifyBackupComplete">
            <switch
              :checked="formData.notifyBackupComplete"
              @change="handleSwitchChange('notifyBackupComplete', $event)"
            />
          </uni-forms-item>

          <uni-forms-item label="备份失败通知" name="notifyBackupFailure">
            <switch
              :checked="formData.notifyBackupFailure"
              @change="handleSwitchChange('notifyBackupFailure', $event)"
            />
          </uni-forms-item>

          <uni-forms-item label="存储空间警告通知" name="notifyStorageWarning">
            <switch
              :checked="formData.notifyStorageWarning"
              @change="handleSwitchChange('notifyStorageWarning', $event)"
            />
          </uni-forms-item>

          <uni-forms-item label="通知接收邮箱" name="notificationEmail">
            <uni-easyinput
              v-model="formData.notificationEmail"
              placeholder="admin@company.com"
              :clearable="true"
              @input="handleInputChange('notificationEmail', $event)"
            />
          </uni-forms-item>
        </view>
      </uni-forms>
    </view>

    <!-- 备份状态和历史 -->
    <view class="backup-status">
      <view class="section-header">
        <text class="section-title">备份状态</text>
        <text class="section-description">当前备份状态和历史记录</text>
      </view>

      <view class="status-info">
        <view class="info-card">
          <text class="info-label">最后备份时间</text>
          <text class="info-value">{{ backupStatus.lastBackupTime }}</text>
        </view>
        <view class="info-card">
          <text class="info-label">备份状态</text>
          <text class="info-value" :class="backupStatus.status">{{
            getBackupStatusText(backupStatus.status)
          }}</text>
        </view>
        <view class="info-card">
          <text class="info-label">备份大小</text>
          <text class="info-value">{{ backupStatus.lastBackupSize }}</text>
        </view>
        <view class="info-card">
          <text class="info-label">下次备份</text>
          <text class="info-value">{{ backupStatus.nextBackupTime }}</text>
        </view>
      </view>

      <view class="backup-actions">
        <button
          class="action-btn primary"
          @click="createManualBackup"
          :disabled="backupStatus.isRunning"
        >
          <text v-if="backupStatus.isRunning">备份进行中...</text>
          <text v-else>立即备份</text>
        </button>
        <button class="action-btn secondary" @click="testBackupConnection">测试连接</button>
        <button class="action-btn secondary" @click="viewBackupHistory">查看历史</button>
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
import { computed, onMounted, ref, watch } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { showModal, showToast } from '@/utils/ui'
import type { SystemSettings } from '@/types/settings'

/**
 * 备份设置组件
 *
 * 功能说明：
 * - 配置自动备份计划和频率
 * - 设置多种存储方式（本地、云存储、FTP）
 * - 管理备份保留策略和清理规则
 * - 配置备份加密和压缩选项
 * - 监控备份状态和历史记录
 * - 提供手动备份和测试功能
 * - 设置备份通知和警告
 *
 * 存储类型：
 * - 本地存储：服务器本地磁盘
 * - 云存储：阿里云OSS、腾讯云COS、AWS S3
 * - FTP存储：远程FTP服务器
 *
 * 安全特性：
 * - 备份加密保护敏感数据
 * - 多副本冗余存储
 * - 自动清理过期备份
 * - 存储空间监控和预警
 *
 * @author Terminal 3 (Admin Frontend Team)
 */

interface BackupSettingsForm {
  // 自动备份
  enableAutoBackup: boolean
  backupFrequency: string
  backupTime: string
  backupContent: string[]
  enableBackupCompression: boolean
  enableBackupEncryption: boolean
  backupEncryptionPassword: string

  // 存储配置
  primaryStorageType: string
  localStoragePath: string
  cloudAccessKeyId: string
  cloudAccessKeySecret: string
  cloudBucketName: string
  cloudRegion: string
  cloudStoragePrefix: string
  ftpHost: string
  ftpPort: number
  ftpUsername: string
  ftpPassword: string
  ftpDirectory: string
  backupCopies: number

  // 保留策略
  backupRetentionDays: number
  maxBackupSize: number
  autoCleanupExpiredBackups: boolean
  storageWarningThreshold: number

  // 通知配置
  notifyBackupComplete: boolean
  notifyBackupFailure: boolean
  notifyStorageWarning: boolean
  notificationEmail: string
}

const settingsStore = useSettingsStore()

// 表单引用和状态
const formRef = ref()
const loading = ref(false)
const originalData = ref<BackupSettingsForm>({} as BackupSettingsForm)

// 表单数据
const formData = ref<BackupSettingsForm>({
  // 自动备份
  enableAutoBackup: true,
  backupFrequency: 'daily',
  backupTime: '02:00',
  backupContent: ['database', 'files', 'config'],
  enableBackupCompression: true,
  enableBackupEncryption: false,
  backupEncryptionPassword: '',

  // 存储配置
  primaryStorageType: 'local',
  localStoragePath: '/var/backups/yessales',
  cloudAccessKeyId: '',
  cloudAccessKeySecret: '',
  cloudBucketName: '',
  cloudRegion: '',
  cloudStoragePrefix: 'backups/yessales/',
  ftpHost: '',
  ftpPort: 21,
  ftpUsername: '',
  ftpPassword: '',
  ftpDirectory: '/backups',
  backupCopies: 7,

  // 保留策略
  backupRetentionDays: 30,
  maxBackupSize: 10,
  autoCleanupExpiredBackups: true,
  storageWarningThreshold: 80,

  // 通知配置
  notifyBackupComplete: false,
  notifyBackupFailure: true,
  notifyStorageWarning: true,
  notificationEmail: ''
})

// 备份状态数据
const backupStatus = ref({
  lastBackupTime: '2024-01-15 02:00:00',
  status: 'success',
  lastBackupSize: '2.5 GB',
  nextBackupTime: '2024-01-16 02:00:00',
  isRunning: false
})

// 选项数据
const backupFrequencyOptions = [
  { value: 'hourly', text: '每小时' },
  { value: 'daily', text: '每天' },
  { value: 'weekly', text: '每周' },
  { value: 'monthly', text: '每月' }
]

const backupContentOptions = [
  { value: 'database', text: '数据库' },
  { value: 'files', text: '上传文件' },
  { value: 'config', text: '配置文件' },
  { value: 'logs', text: '日志文件' }
]

const storageTypeOptions = [
  { value: 'local', text: '本地存储' },
  { value: 'aliyun_oss', text: '阿里云OSS' },
  { value: 'tencent_cos', text: '腾讯云COS' },
  { value: 'aws_s3', text: 'AWS S3' },
  { value: 'ftp', text: 'FTP服务器' }
]

// 表单验证规则
const rules = {
  backupFrequency: {
    rules: [{ required: true, errorMessage: '请选择备份频率' }]
  },
  backupTime: {
    rules: [{ required: true, errorMessage: '请设置备份时间' }]
  },
  primaryStorageType: {
    rules: [{ required: true, errorMessage: '请选择存储类型' }]
  },
  localStoragePath: {
    rules: [{ required: true, errorMessage: '请输入本地存储路径' }]
  },
  cloudAccessKeyId: {
    rules: [{ required: true, errorMessage: '请输入访问密钥ID' }]
  },
  cloudAccessKeySecret: {
    rules: [{ required: true, errorMessage: '请输入访问密钥Secret' }]
  },
  cloudBucketName: {
    rules: [{ required: true, errorMessage: '请输入存储桶名称' }]
  },
  ftpHost: {
    rules: [{ required: true, errorMessage: '请输入FTP服务器地址' }]
  },
  ftpUsername: {
    rules: [{ required: true, errorMessage: '请输入FTP用户名' }]
  },
  ftpPassword: {
    rules: [{ required: true, errorMessage: '请输入FTP密码' }]
  },
  notificationEmail: {
    rules: [{ format: 'email', errorMessage: '请输入正确的邮箱地址' }]
  }
}

// 计算属性
const hasChanges = computed(() => {
  return JSON.stringify(formData.value) !== JSON.stringify(originalData.value)
})

// 辅助函数
const getBackupStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    success: '备份成功',
    failed: '备份失败',
    running: '备份中',
    pending: '待执行'
  }
  return statusMap[status] || '未知状态'
}

// 事件处理
const handleInputChange = (field: keyof BackupSettingsForm, value: any) => {
  ;(formData.value as any)[field] = value
}

const handlePickerChange = (field: keyof BackupSettingsForm, event: any) => {
  ;(formData.value as any)[field] = event.detail.value
}

const handleSwitchChange = (field: keyof BackupSettingsForm, event: any) => {
  ;(formData.value as any)[field] = event.detail.value
}

const handleBackupContentChange = (event: any) => {
  formData.value.backupContent = event.detail.value
}

const handleReset = async () => {
  const result = await showModal({
    title: '确认重置',
    content: '确定要重置所有备份设置吗？这可能会影响数据备份计划。'
  })

  if (result.confirm) {
    formData.value = { ...originalData.value }
    showToast('已重置到上次保存的状态')
  }
}

const handleSave = async () => {
  try {
    // 表单验证
    let isValid = true

    // 根据存储类型验证相应字段
    if (formData.value.primaryStorageType === 'local') {
      const localValid = await formRef.value.validateField(['localStoragePath'])
      isValid = isValid && localValid
    } else if (
      ['aliyun_oss', 'tencent_cos', 'aws_s3'].includes(formData.value.primaryStorageType)
    ) {
      const cloudValid = await formRef.value.validateField([
        'cloudAccessKeyId',
        'cloudAccessKeySecret',
        'cloudBucketName'
      ])
      isValid = isValid && cloudValid
    } else if (formData.value.primaryStorageType === 'ftp') {
      const ftpValid = await formRef.value.validateField(['ftpHost', 'ftpUsername', 'ftpPassword'])
      isValid = isValid && ftpValid
    }

    if (!isValid) {
      showToast('请完善必填字段', 'error')
      return
    }

    // 安全检查
    if (formData.value.enableBackupEncryption && !formData.value.backupEncryptionPassword) {
      showToast('启用加密后必须设置加密密码', 'error')
      return
    }

    loading.value = true

    // 转换为设置格式
    const settings: Partial<SystemSettings>[] = Object.entries(formData.value).map(
      ([key, value]) => ({
        category: 'backup' as const,
        key,
        value,
        type: Array.isArray(value)
          ? 'array'
          : typeof value === 'boolean'
            ? 'boolean'
            : typeof value === 'number'
              ? 'number'
              : 'string'
      })
    )

    // 保存设置
    await settingsStore.updateSettings(settings)

    // 更新原始数据
    originalData.value = { ...formData.value }

    showToast('备份设置保存成功')
  } catch (error) {
    console.error('保存备份设置失败:', error)
    showToast('保存失败，请稍后重试', 'error')
  } finally {
    loading.value = false
  }
}

// 备份操作
const createManualBackup = async () => {
  try {
    const result = await showModal({
      title: '确认备份',
      content: '确定要立即执行手动备份吗？这可能需要一些时间。'
    })

    if (!result.confirm) return

    backupStatus.value.isRunning = true
    showToast('正在创建备份，请稍候...')

    // 模拟备份过程
    await new Promise(resolve => setTimeout(resolve, 5000))

    // 更新备份状态
    backupStatus.value = {
      ...backupStatus.value,
      lastBackupTime: new Date().toLocaleString(),
      status: 'success',
      lastBackupSize: '2.8 GB',
      isRunning: false
    }

    showToast('手动备份创建成功')
  } catch (error) {
    console.error('手动备份失败:', error)
    backupStatus.value.isRunning = false
    backupStatus.value.status = 'failed'
    showToast('备份失败，请检查配置', 'error')
  }
}

const testBackupConnection = async () => {
  try {
    showToast('正在测试备份连接...')

    // 模拟连接测试
    await new Promise(resolve => setTimeout(resolve, 2000))

    // 随机模拟成功或失败
    if (Math.random() > 0.2) {
      showToast('备份连接测试成功')
    } else {
      showToast('连接测试失败，请检查存储配置', 'error')
    }
  } catch (error) {
    console.error('连接测试失败:', error)
    showToast('测试失败', 'error')
  }
}

const viewBackupHistory = () => {
  showToast('跳转到备份历史页面')
  // 这里可以跳转到备份历史页面
  // uni.navigateTo({ url: '/pages/admin/backup/history' })
}

// 加载设置数据
const loadSettings = async () => {
  try {
    const backupSettings = settingsStore.getSettingsByCategory('backup')

    // 将设置数据填充到表单
    backupSettings.forEach(setting => {
      if (setting.key in formData.value) {
        ;(formData.value as any)[setting.key] = setting.value
      }
    })

    // 保存原始数据用于重置
    originalData.value = { ...formData.value }
  } catch (error) {
    console.error('加载备份设置失败:', error)
    showToast('加载设置失败', 'error')
  }
}

// 生命周期
onMounted(() => {
  loadSettings()
})

// 监听设置变化
watch(
  () => settingsStore.settings,
  () => {
    loadSettings()
  },
  { deep: true }
)
</script>

<style lang="scss" scoped>
.backup-settings {
  .settings-section,
  .backup-status {
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
    }
  }

  .backup-status {
    .status-info {
      padding: 20px;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;

      .info-card {
        padding: 16px;
        border: 1px solid var(--border-color-light);
        border-radius: 6px;
        text-align: center;

        .info-label {
          font-size: 12px;
          color: var(--text-color-secondary);
          display: block;
          margin-bottom: 8px;
        }

        .info-value {
          font-size: 16px;
          font-weight: 500;
          color: var(--text-color-primary);

          &.success {
            color: var(--color-success);
          }

          &.failed {
            color: var(--color-error);
          }

          &.running {
            color: var(--color-warning);
          }
        }
      }
    }

    .backup-actions {
      padding: 20px;
      border-top: 1px solid var(--border-color-light);
      display: flex;
      gap: 12px;
      justify-content: center;

      .action-btn {
        padding: 10px 20px;
        border-radius: 6px;
        font-size: 14px;
        border: none;
        cursor: pointer;
        transition: all 0.2s;

        &:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        &.primary {
          background: var(--color-primary);
          color: #fff;

          &:hover:not(:disabled) {
            background: var(--color-primary-dark);
          }
        }

        &.secondary {
          background: var(--color-grey-100);
          color: var(--text-color-secondary);
          border: 1px solid var(--border-color-light);

          &:hover:not(:disabled) {
            background: var(--color-grey-200);
          }
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

    .btn-secondary,
    .btn-primary {
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
  .backup-settings {
    .settings-section,
    .backup-status {
      margin: 0 -16px 16px;
      border-radius: 0;

      .section-header,
      .form-group,
      .status-info,
      .backup-actions {
        padding: 16px;
      }
    }

    .backup-status {
      .status-info {
        grid-template-columns: repeat(2, 1fr);
      }

      .backup-actions {
        flex-direction: column;

        .action-btn {
          text-align: center;
        }
      }
    }

    .actions {
      margin: 0 -16px;
      border-radius: 0;
      padding: 16px;

      .btn-secondary,
      .btn-primary {
        flex: 1;
        text-align: center;
      }
    }
  }
}
</style>
