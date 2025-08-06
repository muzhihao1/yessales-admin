<template>
  <view class="maintenance-settings">
    <view class="settings-section">
      <view class="section-header">
        <text class="section-title">维护设置</text>
        <text class="section-description">配置系统维护和监控参数</text>
      </view>

      <uni-forms ref="formRef" :model="formData" :rules="rules" validate-trigger="onChange">
        <!-- 系统维护 -->
        <view class="form-group">
          <text class="group-title">系统维护</text>
          
          <uni-forms-item label="启用维护模式" name="enableMaintenanceMode">
            <switch
              :checked="formData.enableMaintenanceMode"
              @change="handleSwitchChange('enableMaintenanceMode', $event)"
            />
            <text class="field-hint">开启后用户将无法访问系统</text>
          </uni-forms-item>

          <uni-forms-item label="维护提示信息" name="maintenanceMessage" v-if="formData.enableMaintenanceMode">
            <uni-easyinput
              v-model="formData.maintenanceMessage"
              type="textarea"
              placeholder="系统正在维护中，请稍后访问..."
              :auto-height="true"
              maxlength="500"
              @input="handleInputChange('maintenanceMessage', $event)"
            />
          </uni-forms-item>

          <uni-forms-item label="允许维护期间访问的IP" name="maintenanceAllowedIps" v-if="formData.enableMaintenanceMode">
            <uni-easyinput
              v-model="formData.maintenanceAllowedIps"
              type="textarea"
              placeholder="每行一个IP地址，例如：192.168.1.100"
              :auto-height="true"
              maxlength="1000"
              @input="handleInputChange('maintenanceAllowedIps', $event)"
            />
            <text class="field-hint">管理员IP地址，维护期间可正常访问</text>
          </uni-forms-item>

          <uni-forms-item label="自动维护时间窗口" name="autoMaintenanceWindow">
            <view class="time-range">
              <uni-datetime-picker
                v-model="formData.autoMaintenanceStartTime"
                type="time"
                :clear-icon="false"
                @change="handleInputChange('autoMaintenanceStartTime', $event)"
              />
              <text class="time-separator">至</text>
              <uni-datetime-picker
                v-model="formData.autoMaintenanceEndTime"
                type="time"
                :clear-icon="false"
                @change="handleInputChange('autoMaintenanceEndTime', $event)"
              />
            </view>
            <text class="field-hint">自动维护任务的执行时间窗口</text>
          </uni-forms-item>

          <uni-forms-item label="维护通知提前时间(分钟)" name="maintenanceNotificationMinutes">
            <uni-number-box
              v-model="formData.maintenanceNotificationMinutes"
              :min="5"
              :max="1440"
              :step="5"
              @change="handleInputChange('maintenanceNotificationMinutes', $event)"
            />
          </uni-forms-item>
        </view>

        <!-- 数据清理 -->
        <view class="form-group">
          <text class="group-title">数据清理</text>
          
          <uni-forms-item label="启用自动数据清理" name="enableAutoDataCleanup">
            <switch
              :checked="formData.enableAutoDataCleanup"
              @change="handleSwitchChange('enableAutoDataCleanup', $event)"
            />
          </uni-forms-item>

          <template v-if="formData.enableAutoDataCleanup">
            <uni-forms-item label="清理频率" name="dataCleanupFrequency">
              <uni-data-picker
                v-model="formData.dataCleanupFrequency"
                :localdata="cleanupFrequencyOptions"
                placeholder="选择清理频率"
                @change="handlePickerChange('dataCleanupFrequency', $event)"
              />
            </uni-forms-item>

            <uni-forms-item label="清理内容" name="dataCleanupTypes">
              <view class="checkbox-group">
                <checkbox-group @change="handleDataCleanupTypesChange">
                  <label class="checkbox-item" v-for="type in dataCleanupTypeOptions" :key="type.value">
                    <checkbox 
                      :value="type.value" 
                      :checked="formData.dataCleanupTypes.includes(type.value)"
                    />
                    <text>{{ type.text }}</text>
                    <text class="cleanup-desc">{{ type.description }}</text>
                  </label>
                </checkbox-group>
              </view>
            </uni-forms-item>

            <uni-forms-item label="临时文件保留期(天)" name="tempFileRetentionDays">
              <uni-number-box
                v-model="formData.tempFileRetentionDays"
                :min="1"
                :max="30"
                :step="1"
                @change="handleInputChange('tempFileRetentionDays', $event)"
              />
            </uni-forms-item>

            <uni-forms-item label="系统日志保留期(天)" name="systemLogRetentionDays">
              <uni-number-box
                v-model="formData.systemLogRetentionDays"
                :min="7"
                :max="365"
                :step="1"
                @change="handleInputChange('systemLogRetentionDays', $event)"
              />
            </uni-forms-item>

            <uni-forms-item label="操作日志保留期(天)" name="operationLogRetentionDays">
              <uni-number-box
                v-model="formData.operationLogRetentionDays"
                :min="30"
                :max="365"
                :step="1"
                @change="handleInputChange('operationLogRetentionDays', $event)"
              />
            </uni-forms-item>
          </template>
        </view>

        <!-- 性能监控 -->
        <view class="form-group">
          <text class="group-title">性能监控</text>
          
          <uni-forms-item label="启用性能监控" name="enablePerformanceMonitoring">
            <switch
              :checked="formData.enablePerformanceMonitoring"
              @change="handleSwitchChange('enablePerformanceMonitoring', $event)"
            />
          </uni-forms-item>

          <template v-if="formData.enablePerformanceMonitoring">
            <uni-forms-item label="CPU使用率警告阈值(%)" name="cpuWarningThreshold">
              <uni-number-box
                v-model="formData.cpuWarningThreshold"
                :min="50"
                :max="95"
                :step="5"
                @change="handleInputChange('cpuWarningThreshold', $event)"
              />
            </uni-forms-item>

            <uni-forms-item label="内存使用率警告阈值(%)" name="memoryWarningThreshold">
              <uni-number-box
                v-model="formData.memoryWarningThreshold"
                :min="50"
                :max="95"
                :step="5"
                @change="handleInputChange('memoryWarningThreshold', $event)"
              />
            </uni-forms-item>

            <uni-forms-item label="磁盘使用率警告阈值(%)" name="diskWarningThreshold">
              <uni-number-box
                v-model="formData.diskWarningThreshold"
                :min="70"
                :max="95"
                :step="5"
                @change="handleInputChange('diskWarningThreshold', $event)"
              />
            </uni-forms-item>

            <uni-forms-item label="响应时间警告阈值(毫秒)" name="responseTimeWarningThreshold">
              <uni-number-box
                v-model="formData.responseTimeWarningThreshold"
                :min="1000"
                :max="10000"
                :step="100"
                @change="handleInputChange('responseTimeWarningThreshold', $event)"
              />
            </uni-forms-item>

            <uni-forms-item label="监控数据保留期(天)" name="monitoringDataRetentionDays">
              <uni-number-box
                v-model="formData.monitoringDataRetentionDays"
                :min="7"
                :max="90"
                :step="1"
                @change="handleInputChange('monitoringDataRetentionDays', $event)"
              />
            </uni-forms-item>
          </template>
        </view>

        <!-- 健康检查 -->
        <view class="form-group">
          <text class="group-title">健康检查</text>
          
          <uni-forms-item label="启用自动健康检查" name="enableHealthCheck">
            <switch
              :checked="formData.enableHealthCheck"
              @change="handleSwitchChange('enableHealthCheck', $event)"
            />
          </uni-forms-item>

          <template v-if="formData.enableHealthCheck">
            <uni-forms-item label="检查间隔(分钟)" name="healthCheckInterval">
              <uni-number-box
                v-model="formData.healthCheckInterval"
                :min="1"
                :max="60"
                :step="1"
                @change="handleInputChange('healthCheckInterval', $event)"
              />
            </uni-forms-item>

            <uni-forms-item label="检查项目" name="healthCheckItems">
              <view class="checkbox-group">
                <checkbox-group @change="handleHealthCheckItemsChange">
                  <label class="checkbox-item" v-for="item in healthCheckItemOptions" :key="item.value">
                    <checkbox 
                      :value="item.value" 
                      :checked="formData.healthCheckItems.includes(item.value)"
                    />
                    <text>{{ item.text }}</text>
                  </label>
                </checkbox-group>
              </view>
            </uni-forms-item>

            <uni-forms-item label="健康检查超时时间(秒)" name="healthCheckTimeout">
              <uni-number-box
                v-model="formData.healthCheckTimeout"
                :min="5"
                :max="60"
                :step="1"
                @change="handleInputChange('healthCheckTimeout', $event)"
              />
            </uni-forms-item>

            <uni-forms-item label="失败后重试次数" name="healthCheckRetryCount">
              <uni-number-box
                v-model="formData.healthCheckRetryCount"
                :min="1"
                :max="5"
                :step="1"
                @change="handleInputChange('healthCheckRetryCount', $event)"
              />
            </uni-forms-item>
          </template>
        </view>

        <!-- 更新检查 -->
        <view class="form-group">
          <text class="group-title">系统更新</text>
          
          <uni-forms-item label="启用自动更新检查" name="enableAutoUpdateCheck">
            <switch
              :checked="formData.enableAutoUpdateCheck"
              @change="handleSwitchChange('enableAutoUpdateCheck', $event)"
            />
          </uni-forms-item>

          <template v-if="formData.enableAutoUpdateCheck">
            <uni-forms-item label="检查更新频率" name="updateCheckFrequency">
              <uni-data-picker
                v-model="formData.updateCheckFrequency"
                :localdata="updateCheckFrequencyOptions"
                placeholder="选择检查频率"
                @change="handlePickerChange('updateCheckFrequency', $event)"
              />
            </uni-forms-item>

            <uni-forms-item label="更新通道" name="updateChannel">
              <uni-data-picker
                v-model="formData.updateChannel"
                :localdata="updateChannelOptions"
                placeholder="选择更新通道"
                @change="handlePickerChange('updateChannel', $event)"
              />
            </uni-forms-item>

            <uni-forms-item label="自动下载更新" name="autoDownloadUpdates">
              <switch
                :checked="formData.autoDownloadUpdates"
                @change="handleSwitchChange('autoDownloadUpdates', $event)"
              />
              <text class="field-hint">检测到更新时自动下载，但不自动安装</text>
            </uni-forms-item>

            <uni-forms-item label="更新通知邮箱" name="updateNotificationEmail">
              <uni-easyinput
                v-model="formData.updateNotificationEmail"
                placeholder="admin@company.com"
                :clearable="true"
                @input="handleInputChange('updateNotificationEmail', $event)"
              />
            </uni-forms-item>
          </template>
        </view>
      </uni-forms>
    </view>

    <!-- 系统状态 -->
    <view class="system-status">
      <view class="section-header">
        <text class="section-title">系统状态</text>
        <text class="section-description">当前系统运行状态监控</text>
      </view>
      
      <view class="status-cards">
        <view class="status-card" v-for="status in systemStatus" :key="status.key">
          <view class="status-header">
            <text class="status-name">{{ status.name }}</text>
            <view class="status-value" :class="getStatusClass(status.status)">
              {{ status.value }}
            </view>
          </view>
          <view class="status-bar">
            <view 
              class="status-progress" 
              :class="getStatusClass(status.status)"
              :style="{ width: status.percentage + '%' }"
            ></view>
          </view>
          <text class="status-desc">{{ status.description }}</text>
        </view>
      </view>

      <view class="maintenance-actions">
        <button class="action-btn" @click="runSystemCheck">系统检查</button>
        <button class="action-btn" @click="cleanupTempFiles">清理临时文件</button>
        <button class="action-btn" @click="optimizeDatabase">优化数据库</button>
        <button class="action-btn" @click="checkForUpdates">检查更新</button>
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
 * 维护设置组件
 * 
 * 功能说明：
 * - 配置系统维护模式和维护窗口
 * - 设置自动数据清理策略
 * - 监控系统性能指标和阈值
 * - 配置系统健康检查
 * - 管理系统更新检查和通知
 * - 提供系统维护工具和操作
 * 
 * 维护类型：
 * - 系统维护：维护模式、IP白名单、通知
 * - 数据清理：临时文件、日志、缓存清理
 * - 性能监控：CPU、内存、磁盘、响应时间
 * - 健康检查：数据库、缓存、服务状态
 * - 系统更新：版本检查、自动更新配置
 * 
 * 运维特性：
 * - 实时系统状态监控
 * - 自动化维护任务
 * - 性能阈值预警
 * - 一键维护操作
 * 
 * @author Terminal 3 (Admin Frontend Team)
 */

interface MaintenanceSettingsForm {
  // 系统维护
  enableMaintenanceMode: boolean
  maintenanceMessage: string
  maintenanceAllowedIps: string
  autoMaintenanceStartTime: string
  autoMaintenanceEndTime: string
  maintenanceNotificationMinutes: number
  
  // 数据清理
  enableAutoDataCleanup: boolean
  dataCleanupFrequency: string
  dataCleanupTypes: string[]
  tempFileRetentionDays: number
  systemLogRetentionDays: number
  operationLogRetentionDays: number
  
  // 性能监控
  enablePerformanceMonitoring: boolean
  cpuWarningThreshold: number
  memoryWarningThreshold: number
  diskWarningThreshold: number
  responseTimeWarningThreshold: number
  monitoringDataRetentionDays: number
  
  // 健康检查
  enableHealthCheck: boolean
  healthCheckInterval: number
  healthCheckItems: string[]
  healthCheckTimeout: number
  healthCheckRetryCount: number
  
  // 系统更新
  enableAutoUpdateCheck: boolean
  updateCheckFrequency: string
  updateChannel: string
  autoDownloadUpdates: boolean
  updateNotificationEmail: string
}

const settingsStore = useSettingsStore()

// 表单引用和状态
const formRef = ref()
const loading = ref(false)
const originalData = ref<MaintenanceSettingsForm>({} as MaintenanceSettingsForm)

// 表单数据
const formData = ref<MaintenanceSettingsForm>({
  // 系统维护
  enableMaintenanceMode: false,
  maintenanceMessage: '系统正在维护中，预计1小时后恢复服务。',
  maintenanceAllowedIps: '',
  autoMaintenanceStartTime: '02:00',
  autoMaintenanceEndTime: '04:00',
  maintenanceNotificationMinutes: 30,
  
  // 数据清理
  enableAutoDataCleanup: true,
  dataCleanupFrequency: 'weekly',
  dataCleanupTypes: ['temp_files', 'system_logs', 'cache'],
  tempFileRetentionDays: 3,
  systemLogRetentionDays: 30,
  operationLogRetentionDays: 90,
  
  // 性能监控
  enablePerformanceMonitoring: true,
  cpuWarningThreshold: 80,
  memoryWarningThreshold: 85,
  diskWarningThreshold: 90,
  responseTimeWarningThreshold: 2000,
  monitoringDataRetentionDays: 30,
  
  // 健康检查
  enableHealthCheck: true,
  healthCheckInterval: 5,
  healthCheckItems: ['database', 'cache', 'storage', 'services'],
  healthCheckTimeout: 30,
  healthCheckRetryCount: 3,
  
  // 系统更新
  enableAutoUpdateCheck: true,
  updateCheckFrequency: 'weekly',
  updateChannel: 'stable',
  autoDownloadUpdates: false,
  updateNotificationEmail: ''
})

// 系统状态数据
const systemStatus = ref([
  {
    key: 'cpu',
    name: 'CPU使用率',
    value: '45%',
    percentage: 45,
    status: 'normal',
    description: '当前CPU使用率正常'
  },
  {
    key: 'memory',
    name: '内存使用率',
    value: '68%',
    percentage: 68,
    status: 'normal',
    description: '当前内存使用率正常'
  },
  {
    key: 'disk',
    name: '磁盘使用率',
    value: '92%',
    percentage: 92,
    status: 'warning',
    description: '磁盘空间使用率较高，建议清理'
  },
  {
    key: 'response',
    name: '平均响应时间',
    value: '180ms',
    percentage: 18,
    status: 'good',
    description: '系统响应速度良好'
  }
])

// 选项数据
const cleanupFrequencyOptions = [
  { value: 'daily', text: '每天' },
  { value: 'weekly', text: '每周' },
  { value: 'monthly', text: '每月' }
]

const dataCleanupTypeOptions = [
  { value: 'temp_files', text: '临时文件', description: '清理系统临时文件和缓存' },
  { value: 'system_logs', text: '系统日志', description: '清理过期的系统运行日志' },
  { value: 'operation_logs', text: '操作日志', description: '清理过期的用户操作日志' },
  { value: 'cache', text: '应用缓存', description: '清理应用程序缓存数据' },
  { value: 'sessions', text: '会话数据', description: '清理过期的用户会话' }
]

const healthCheckItemOptions = [
  { value: 'database', text: '数据库连接' },
  { value: 'cache', text: '缓存服务' },
  { value: 'storage', text: '存储服务' },
  { value: 'services', text: '核心服务' },
  { value: 'network', text: '网络连接' }
]

const updateCheckFrequencyOptions = [
  { value: 'daily', text: '每天' },
  { value: 'weekly', text: '每周' },
  { value: 'monthly', text: '每月' }
]

const updateChannelOptions = [
  { value: 'stable', text: '稳定版' },
  { value: 'beta', text: '测试版' },
  { value: 'dev', text: '开发版' }
]

// 表单验证规则
const rules = {
  updateNotificationEmail: {
    rules: [
      { format: 'email', errorMessage: '请输入正确的邮箱地址' }
    ]
  }
}

// 计算属性
const hasChanges = computed(() => {
  return JSON.stringify(formData.value) !== JSON.stringify(originalData.value)
})

// 辅助函数
const getStatusClass = (status: string) => {
  const classMap: Record<string, string> = {
    good: 'status-good',
    normal: 'status-normal',
    warning: 'status-warning',
    error: 'status-error'
  }
  return classMap[status] || 'status-normal'
}

// 事件处理
const handleInputChange = (field: keyof MaintenanceSettingsForm, value: any) => {
  (formData.value as any)[field] = value
}

const handlePickerChange = (field: keyof MaintenanceSettingsForm, event: any) => {
  (formData.value as any)[field] = event.detail.value
}

const handleSwitchChange = (field: keyof MaintenanceSettingsForm, event: any) => {
  (formData.value as any)[field] = event.detail.value
}

const handleDataCleanupTypesChange = (event: any) => {
  formData.value.dataCleanupTypes = event.detail.value
}

const handleHealthCheckItemsChange = (event: any) => {
  formData.value.healthCheckItems = event.detail.value
}

const handleReset = async () => {
  const result = await showModal({
    title: '确认重置',
    content: '确定要重置所有维护设置吗？这可能会影响系统监控和维护计划。'
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
      category: 'maintenance' as const,
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
    
    showToast('维护设置保存成功')
  } catch (error) {
    console.error('保存维护设置失败:', error)
    showToast('保存失败，请稍后重试', 'error')
  } finally {
    loading.value = false
  }
}

// 系统维护操作
const runSystemCheck = async () => {
  try {
    showToast('正在执行系统检查...')
    
    // 模拟系统检查过程
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    showToast('系统检查完成，一切正常')
  } catch (error) {
    console.error('系统检查失败:', error)
    showToast('系统检查失败', 'error')
  }
}

const cleanupTempFiles = async () => {
  try {
    const result = await showModal({
      title: '确认清理',
      content: '确定要清理临时文件吗？此操作不可撤销。'
    })
    
    if (!result.confirm) return

    showToast('正在清理临时文件...')
    
    // 模拟清理过程
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    showToast('临时文件清理完成，释放了500MB空间')
  } catch (error) {
    console.error('清理临时文件失败:', error)
    showToast('清理失败', 'error')
  }
}

const optimizeDatabase = async () => {
  try {
    const result = await showModal({
      title: '确认优化',
      content: '确定要优化数据库吗？这可能需要几分钟时间。'
    })
    
    if (!result.confirm) return

    showToast('正在优化数据库...')
    
    // 模拟优化过程
    await new Promise(resolve => setTimeout(resolve, 4000))
    
    showToast('数据库优化完成')
  } catch (error) {
    console.error('数据库优化失败:', error)
    showToast('优化失败', 'error')
  }
}

const checkForUpdates = async () => {
  try {
    showToast('正在检查系统更新...')
    
    // 模拟更新检查
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // 随机模拟有无更新
    if (Math.random() > 0.5) {
      showToast('发现新版本 v2.1.0，建议更新')
    } else {
      showToast('当前已是最新版本')
    }
  } catch (error) {
    console.error('检查更新失败:', error)
    showToast('更新检查失败', 'error')
  }
}

// 加载设置数据
const loadSettings = async () => {
  try {
    const maintenanceSettings = settingsStore.getSettingsByCategory('maintenance')
    
    // 将设置数据填充到表单
    maintenanceSettings.forEach(setting => {
      if (setting.key in formData.value) {
        (formData.value as any)[setting.key] = setting.value
      }
    })
    
    // 保存原始数据用于重置
    originalData.value = { ...formData.value }
  } catch (error) {
    console.error('加载维护设置失败:', error)
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
.maintenance-settings {
  .settings-section, .system-status {
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
      
      .time-range {
        display: flex;
        align-items: center;
        gap: 12px;
        
        .time-separator {
          font-size: 14px;
          color: var(--text-color-secondary);
        }
      }
      
      .checkbox-group {
        .checkbox-item {
          display: flex;
          align-items: flex-start;
          margin-bottom: 12px;
          
          checkbox {
            margin-right: 8px;
            margin-top: 2px;
          }
          
          text {
            font-size: 14px;
            color: var(--text-color-primary);
          }
          
          .cleanup-desc {
            font-size: 12px;
            color: var(--text-color-tertiary);
            margin-left: 8px;
            flex: 1;
          }
        }
      }
    }
  }
  
  .system-status {
    .status-cards {
      padding: 20px;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 16px;
      
      .status-card {
        padding: 16px;
        border: 1px solid var(--border-color-light);
        border-radius: 8px;
        
        .status-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          
          .status-name {
            font-size: 14px;
            color: var(--text-color-primary);
          }
          
          .status-value {
            font-size: 16px;
            font-weight: 600;
            
            &.status-good {
              color: var(--color-success);
            }
            
            &.status-normal {
              color: var(--color-primary);
            }
            
            &.status-warning {
              color: var(--color-warning);
            }
            
            &.status-error {
              color: var(--color-error);
            }
          }
        }
        
        .status-bar {
          height: 6px;
          background: var(--color-grey-200);
          border-radius: 3px;
          margin-bottom: 8px;
          overflow: hidden;
          
          .status-progress {
            height: 100%;
            transition: width 0.3s ease;
            
            &.status-good {
              background: var(--color-success);
            }
            
            &.status-normal {
              background: var(--color-primary);
            }
            
            &.status-warning {
              background: var(--color-warning);
            }
            
            &.status-error {
              background: var(--color-error);
            }
          }
        }
        
        .status-desc {
          font-size: 12px;
          color: var(--text-color-tertiary);
        }
      }
    }
    
    .maintenance-actions {
      padding: 20px;
      border-top: 1px solid var(--border-color-light);
      display: flex;
      gap: 12px;
      justify-content: center;
      flex-wrap: wrap;
      
      .action-btn {
        padding: 8px 16px;
        background: var(--color-primary);
        color: #fff;
        border: none;
        border-radius: 4px;
        font-size: 13px;
        cursor: pointer;
        transition: all 0.2s;
        
        &:hover {
          background: var(--color-primary-dark);
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
  .maintenance-settings {
    .settings-section, .system-status {
      margin: 0 -16px 16px;
      border-radius: 0;
      
      .section-header,
      .form-group,
      .status-cards,
      .maintenance-actions {
        padding: 16px;
      }
    }
    
    .system-status {
      .status-cards {
        grid-template-columns: 1fr;
      }
      
      .maintenance-actions {
        .action-btn {
          flex: 1;
          text-align: center;
        }
      }
    }
    
    .form-group .time-range {
      flex-direction: column;
      align-items: stretch;
      
      .time-separator {
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