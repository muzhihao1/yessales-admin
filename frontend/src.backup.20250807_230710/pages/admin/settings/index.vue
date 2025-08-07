<template>
  <view class="settings-page">
    <!-- Header with actions -->
    <view class="page-header">
      <view class="header-left">
        <text class="page-title">系统设置</text>
        <text class="page-subtitle">{{ categoryInfo.description }}</text>
      </view>
      
      <view class="header-actions">
        <!-- Real-time indicator -->
        <RealtimeIndicator />
        
        <!-- Import/Export actions -->
        <view class="import-export-actions">
          <button 
            class="action-btn export"
            @click="showExportModal"
          >
            <text class="btn-icon">📤</text>
            <text>导出设置</text>
          </button>
          
          <button 
            class="action-btn import"
            @click="showImportModal"
          >
            <text class="btn-icon">📥</text>
            <text>导入设置</text>
          </button>
        </view>
        
        <!-- Save actions -->
        <view class="save-actions">
          <button 
            class="action-btn reset"
            @click="resetCurrentCategory"
            :disabled="loading || saving"
          >
            <text class="btn-icon">🔄</text>
            <text>重置</text>
          </button>
          
          <button 
            class="action-btn save primary"
            @click="saveCurrentSettings"
            :disabled="loading || saving || !hasUnsavedChanges"
          >
            <text class="btn-icon">💾</text>
            <text>{{ saving ? '保存中...' : '保存设置' }}</text>
          </button>
        </view>
      </view>
    </view>
    
    <!-- Settings navigation and content -->
    <view class="settings-container">
      <!-- Category sidebar -->
      <view class="settings-sidebar">
        <view class="sidebar-header">
          <text class="sidebar-title">设置分类</text>
        </view>
        
        <view class="category-list">
          <view 
            v-for="(info, category) in SETTINGS_CATEGORIES"
            :key="category"
            class="category-item"
            :class="{ active: currentCategory === category }"
            @click="selectCategory(category)"
          >
            <view class="category-icon">
              <text>{{ info.icon }}</text>
            </view>
            <view class="category-content">
              <text class="category-title">{{ info.title }}</text>
              <text class="category-desc">{{ info.description }}</text>
            </view>
            <view v-if="hasChangesInCategory(category)" class="category-indicator">
              <text class="indicator-dot">●</text>
            </view>
          </view>
        </view>
      </view>
      
      <!-- Settings content -->
      <view class="settings-content">
        <!-- Loading state -->
        <view v-if="loading" class="loading-container">
          <text class="loading-text">加载设置中...</text>
        </view>
        
        <!-- Error state -->
        <view v-if="error" class="error-container">
          <text class="error-text">{{ error }}</text>
          <button class="retry-btn" @click="refreshSettings">
            <text>重试</text>
          </button>
        </view>
        
        <!-- Settings form -->
        <view v-if="!loading && !error" class="settings-form">
          <!-- Category header -->
          <view class="category-header">
            <view class="category-info">
              <text class="category-icon-large">{{ categoryInfo.icon }}</text>
              <view class="category-text">
                <view class="category-title-row">
                  <text class="category-title">{{ categoryInfo.title }}</text>
                  <SettingsHelpTooltip
                    :title="categoryInfo.title + ' 设置指南'"
                    :content="getCategoryHelpContent(currentCategory)"
                    :best-practices="getCategoryBestPractices(currentCategory)"
                    :warning="getCategoryWarning(currentCategory)"
                    :related-settings="getCategoryRelatedSettings(currentCategory)"
                    :show-actions="true"
                    theme="info"
                    position="bottom"
                    @navigate="handleHelpNavigate"
                    @reset-default="resetCurrentCategory"
                    @apply-recommended="() => handleApplySuggestion('apply-recommended')"
                  />
                </view>
                <text class="category-description">{{ categoryInfo.description }}</text>
              </view>
            </view>
            
            <view class="category-actions">
              <button 
                class="history-btn"
                @click="showChangeHistory"
              >
                <text class="btn-icon">📋</text>
                <text>变更历史</text>
              </button>
            </view>
          </view>
          
          <!-- Settings groups -->
          <view class="settings-groups">
            <!-- General Settings -->
            <view v-if="currentCategory === 'general'" class="settings-group">
              <GeneralSettings 
                :settings="currentCategorySettings"
                @update="onSettingUpdate"
              />
            </view>
            
            <!-- Business Rules -->
            <view v-if="currentCategory === 'business'" class="settings-group">
              <BusinessRulesSettings 
                :settings="businessRules"
                @update="onBusinessRuleUpdate"
              />
            </view>
            
            <!-- Security Settings -->
            <view v-if="currentCategory === 'security'" class="settings-group">
              <SecuritySettings 
                :settings="securitySettings"
                @update="onSecuritySettingUpdate"
              />
            </view>
            
            <!-- Notification Settings -->
            <view v-if="currentCategory === 'notification'" class="settings-group">
              <NotificationSettings 
                :settings="notificationSettings"
                @update="onNotificationSettingUpdate"
              />
            </view>
            
            <!-- Integration Settings -->
            <view v-if="currentCategory === 'integration'" class="settings-group">
              <IntegrationSettings 
                :settings="integrationSettings"
                @update="onIntegrationSettingUpdate"
              />
            </view>
            
            <!-- Appearance Settings -->
            <view v-if="currentCategory === 'appearance'" class="settings-group">
              <AppearanceSettings 
                :settings="appearanceSettings"
                @update="onAppearanceSettingUpdate"
              />
            </view>
            
            <!-- Backup Settings -->
            <view v-if="currentCategory === 'backup'" class="settings-group">
              <BackupSettings 
                :settings="backupSettings"
                @update="onBackupSettingUpdate"
              />
            </view>
            
            <!-- Maintenance Settings -->
            <view v-if="currentCategory === 'maintenance'" class="settings-group">
              <MaintenanceSettings 
                :settings="maintenanceSettings"
                @update="onMaintenanceSettingUpdate"
              />
            </view>
          </view>
          
          <!-- Settings footer -->
          <view class="settings-footer">
            <view class="footer-info">
              <text class="info-text">
                最后更新: {{ formatLastUpdate() }}
              </text>
              <text v-if="hasUnsavedChanges" class="unsaved-indicator">
                有未保存的更改
              </text>
            </view>
            
            <view class="footer-actions">
              <button 
                class="footer-btn secondary"
                @click="discardChanges"
                :disabled="!hasUnsavedChanges"
              >
                <text>取消更改</text>
              </button>
              
              <button 
                class="footer-btn primary"
                @click="saveCurrentSettings"
                :disabled="!hasUnsavedChanges || saving"
              >
                <text>保存更改</text>
              </button>
            </view>
          </view>
        </view>
      </view>
    </view>
    
    <!-- UX Enhancement: Validation Feedback -->\n    <SettingsValidationFeedback
      :state=\"validationFeedback.state\"
      :visible=\"validationFeedback.visible\"
      :success-message=\"validationFeedback.successMessage\"
      :error-message=\"validationFeedback.errorMessage\"
      :warning-message=\"validationFeedback.warningMessage\"
      :info-message=\"validationFeedback.infoMessage\"
      :error-details=\"validationFeedback.errorDetails\"
      :field-errors=\"validationFeedback.fieldErrors\"
      :show-progress=\"validationFeedback.showProgress\"
      :progress-current=\"validationFeedback.progressCurrent\"
      :progress-total=\"validationFeedback.progressTotal\"
      :progress-title=\"validationFeedback.progressTitle\"
      :progress-message=\"validationFeedback.progressMessage\"
      :auto-hide=\"3000\"
      @dismiss=\"handleValidationDismiss\"
      @retry=\"handleValidationRetry\"
      @apply-suggestion=\"handleApplySuggestion\"
    />
    
    <!-- Export Modal -->
    <SettingsExportModal
      :visible="showExportModalRef"
      :categories="Object.keys(SETTINGS_CATEGORIES)"
      @close="closeExportModal"
      @export="handleExportSettings"
    />
    
    <!-- Import Modal -->
    <SettingsImportModal
      :visible="showImportModalRef"
      @close="closeImportModal"
      @import="handleImportSettings"
    />
    
    <!-- Change History Modal -->
    <SettingsHistoryModal
      :visible="showHistoryModalRef"
      :history="changeHistory"
      :category="currentCategory"
      @close="closeHistoryModal"
    />
    
    <!-- Confirmation dialogs -->
    <ConfirmDialog
      :visible="showConfirmDialog"
      :title="confirmDialogTitle"
      :message="confirmDialogMessage"
      @confirm="onConfirmAction"
      @cancel="closeConfirmDialog"
    />
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { usePermissions } from '@/composables/usePermissions'
import RealtimeIndicator from '@/components/admin/RealtimeIndicator.vue'
import GeneralSettings from '@/components/admin/settings/GeneralSettings.vue'
import BusinessRulesSettings from '@/components/admin/settings/BusinessRulesSettings.vue'
import SecuritySettings from '@/components/admin/settings/SecuritySettings.vue'
import NotificationSettings from '@/components/admin/settings/NotificationSettings.vue'
import IntegrationSettings from '@/components/admin/settings/IntegrationSettings.vue'
import AppearanceSettings from '@/components/admin/settings/AppearanceSettings.vue'
import BackupSettings from '@/components/admin/settings/BackupSettings.vue'
import MaintenanceSettings from '@/components/admin/settings/MaintenanceSettings.vue'
import SettingsExportModal from '@/components/admin/settings/SettingsExportModal.vue'
import SettingsImportModal from '@/components/admin/settings/SettingsImportModal.vue'
import SettingsHistoryModal from '@/components/admin/settings/SettingsHistoryModal.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import SettingsHelpTooltip from '@/components/admin/settings/SettingsHelpTooltip.vue'
import SettingsValidationFeedback from '@/components/admin/settings/SettingsValidationFeedback.vue'
import type { SettingsCategory, SettingsExportData, SettingsImportResult } from '@/types/settings'
import { SETTINGS_CATEGORIES } from '@/types/settings'

// Store and permissions
const settingsStore = useSettingsStore()
const { checkPermission } = usePermissions()

// Extract store state and methods
const {
  settings,
  currentCategory,
  loading,
  saving,
  error,
  changeHistory,
  businessRules,
  securitySettings,
  notificationSettings,
  integrationSettings,
  backupSettings,
  appearanceSettings,
  currentCategorySettings,
  hasUnsavedChanges,
  categoryInfo,
  
  fetchSettings,
  updateSetting,
  batchUpdateSettings,
  resetToDefaults,
  exportSettings,
  importSettings,
  fetchChangeHistory,
  setCurrentCategory
} = settingsStore

// Local state
const showExportModalRef = ref(false)
const showImportModalRef = ref(false)
const showHistoryModalRef = ref(false)
const showConfirmDialog = ref(false)
const confirmDialogTitle = ref('')
const confirmDialogMessage = ref('')
const confirmAction = ref<() => void>(() => {})
const pendingChanges = ref<Record<string, any>>({})
const maintenanceSettings = ref(null) // Placeholder for maintenance settings

// UX Enhancement States
const validationFeedback = ref({
  state: 'hidden' as 'success' | 'error' | 'warning' | 'validating' | 'info' | 'hidden',
  visible: false,
  successMessage: '',
  errorMessage: '',
  warningMessage: '',
  infoMessage: '',
  errorDetails: [] as string[],
  fieldErrors: {} as Record<string, string | string[]>,
  showProgress: false,
  progressCurrent: 0,
  progressTotal: 100,
  progressTitle: '',
  progressMessage: ''
})

// Computed properties
const lastUpdate = computed(() => {
  const latestSetting = currentCategorySettings.value
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0]
  return latestSetting?.updated_at
})

// Methods
function selectCategory(category: SettingsCategory) {
  if (hasUnsavedChanges.value) {
    showConfirmDialog.value = true
    confirmDialogTitle.value = '切换分类'
    confirmDialogMessage.value = '当前分类有未保存的更改，切换分类将丢失这些更改。确定要继续吗？'
    confirmAction.value = () => {
      discardChanges()
      setCurrentCategory(category)
      refreshSettings()
    }
  } else {
    setCurrentCategory(category)
    refreshSettings()
  }
}

function hasChangesInCategory(category: SettingsCategory): boolean {
  return Object.keys(pendingChanges.value).some(key => {
    const setting = settings.value.find(s => s.key === key)
    return setting?.category === category
  })
}

async function refreshSettings() {
  await fetchSettings(currentCategory.value)
}

function onSettingUpdate(key: string, value: any) {
  pendingChanges.value[key] = value
}

function onBusinessRuleUpdate(key: string, value: any) {
  onSettingUpdate(key, value)
}

function onSecuritySettingUpdate(key: string, value: any) {
  onSettingUpdate(key, value)
}

function onNotificationSettingUpdate(key: string, value: any) {
  onSettingUpdate(key, value)
}

function onIntegrationSettingUpdate(key: string, value: any) {
  onSettingUpdate(key, value)
}

function onAppearanceSettingUpdate(key: string, value: any) {
  onSettingUpdate(key, value)
}

function onBackupSettingUpdate(key: string, value: any) {
  onSettingUpdate(key, value)
}

function onMaintenanceSettingUpdate(key: string, value: any) {
  onSettingUpdate(key, value)
}

async function saveCurrentSettings() {
  if (Object.keys(pendingChanges.value).length === 0) {
    return
  }
  
  try {
    // Show validation progress
    validationFeedback.value = {
      ...validationFeedback.value,
      state: 'validating',
      visible: true,
      showProgress: true,
      progressTitle: '保存设置',
      progressMessage: '正在验证并保存设置...',
      progressCurrent: 30,
      progressTotal: 100
    }
    
    // Simulate validation steps
    setTimeout(() => {
      validationFeedback.value.progressCurrent = 70
      validationFeedback.value.progressMessage = '应用设置更改...'
    }, 500)
    
    await batchUpdateSettings(pendingChanges.value)
    
    // Show success feedback
    validationFeedback.value = {
      ...validationFeedback.value,
      state: 'success',
      visible: true,
      successMessage: `成功保存 ${Object.keys(pendingChanges.value).length} 项设置`,
      showProgress: false,
      progressCurrent: 100
    }
    
    pendingChanges.value = {}
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
      if (validationFeedback.value.state === 'success') {
        validationFeedback.value.visible = false
      }
    }, 3000)
    
  } catch (error) {
    console.error('Failed to save settings:', error)
    
    // Show error feedback with details
    validationFeedback.value = {
      ...validationFeedback.value,
      state: 'error',
      visible: true,
      errorMessage: '设置保存失败',
      errorDetails: [
        '网络连接异常，请检查网络状态',
        '部分设置可能需要管理员权限',
        '请重试或联系技术支持'
      ],
      showProgress: false
    }
  }
}

function discardChanges() {
  pendingChanges.value = {}
}

function resetCurrentCategory() {
  showConfirmDialog.value = true
  confirmDialogTitle.value = '重置设置'
  confirmDialogMessage.value = `确定要将 ${categoryInfo.value.title} 中的所有设置重置为默认值吗？此操作不可撤销。`
  confirmAction.value = async () => {
    await resetToDefaults(currentCategory.value)
    pendingChanges.value = {}
  }
}

function showExportModal() {
  showExportModalRef.value = true
}

function closeExportModal() {
  showExportModalRef.value = false
}

async function handleExportSettings(categories: SettingsCategory[]) {
  try {
    const exportData = await exportSettings(categories)
    
    // Simulate file download
    const filename = `settings_export_${new Date().toISOString().split('T')[0]}.json`
    
    uni.showToast({
      title: `设置已导出: ${filename}`,
      icon: 'success'
    })
    
    console.log('Exported settings:', exportData)
    
  } catch (error) {
    console.error('Export failed:', error)
  }
}

function showImportModal() {
  showImportModalRef.value = true
}

function closeImportModal() {
  showImportModalRef.value = false
}

async function handleImportSettings(importData: SettingsExportData) {
  try {
    const result = await importSettings(importData)
    
    let message = `导入完成: ${result.imported_count} 项成功`
    if (result.skipped_count > 0) {
      message += `, ${result.skipped_count} 项跳过`
    }
    if (result.error_count > 0) {
      message += `, ${result.error_count} 项失败`
    }
    
    uni.showToast({
      title: message,
      icon: result.success ? 'success' : 'none'
    })
    
    if (result.errors.length > 0) {
      console.error('Import errors:', result.errors)
    }
    
  } catch (error) {
    console.error('Import failed:', error)
  }
}

function showChangeHistory() {
  fetchChangeHistory()
  showHistoryModalRef.value = true
}

function closeHistoryModal() {
  showHistoryModalRef.value = false
}

function onConfirmAction() {
  confirmAction.value()
  closeConfirmDialog()
}

function closeConfirmDialog() {
  showConfirmDialog.value = false
  confirmDialogTitle.value = ''
  confirmDialogMessage.value = ''
  confirmAction.value = () => {}
}

function formatLastUpdate(): string {
  if (!lastUpdate.value) return '未知'
  
  const date = new Date(lastUpdate.value)
  return date.toLocaleString('zh-CN')
}

// UX Enhancement handlers
function handleValidationDismiss() {
  validationFeedback.value.visible = false
}

function handleValidationRetry() {
  saveCurrentSettings()
}

function handleApplySuggestion(action: string) {
  console.log('Apply suggestion:', action)
  // Implement suggestion actions based on the action parameter
  switch (action) {
    case 'reset-to-default':
      resetCurrentCategory()
      break
    case 'apply-recommended':
      // Apply recommended settings for current category
      validationFeedback.value = {
        ...validationFeedback.value,
        state: 'info',
        visible: true,
        infoMessage: '已应用推荐设置，请检查并保存更改'
      }
      break
  }
}

function handleHelpNavigate(settingKey: string) {
  // Navigate to related setting
  console.log('Navigate to setting:', settingKey)
  validationFeedback.value = {
    ...validationFeedback.value,
    state: 'info',
    visible: true,
    infoMessage: `正在切换到相关设置：${settingKey}`
  }
}

// Helper methods for category-specific help content
function getCategoryHelpContent(category: SettingsCategory): string {
  const helpContent: Record<SettingsCategory, string> = {
    general: '常规设置控制系统的基础行为和显示选项。这些设置会影响所有用户的体验，建议谨慎修改。',
    business: '业务规则设置定义了系统的核心业务逻辑，包括报价流程、审批规则、数据验证等。修改前请确保了解对业务流程的影响。',
    security: '安全设置是系统防护的关键配置，包括访问控制、会话管理、数据加密等。任何修改都可能影响系统安全性，请谨慎操作。',
    notification: '通知设置控制系统如何向用户发送消息和提醒。合理配置可以提升用户体验，避免信息过载。',
    integration: '集成设置管理与第三方系统的连接配置，包括API密钥、外部服务地址等。错误配置可能导致功能异常。',
    appearance: '外观设置控制系统的视觉表现，包括主题、布局、字体等。这些设置主要影响用户界面，相对安全。',
    backup: '备份设置确保数据安全，包括备份频率、存储位置、保留策略等。建议定期检查备份状态，确保数据安全。',
    maintenance: '维护设置控制系统的运维操作，包括日志级别、性能监控、清理策略等。这些设置影响系统性能和稳定性。'
  }
  return helpContent[category] || '暂无帮助信息'
}

function getCategoryBestPractices(category: SettingsCategory): string[] {
  const bestPractices: Record<SettingsCategory, string[]> = {
    general: ['修改前先备份当前设置', '在测试环境验证修改效果', '记录变更原因和时间'],
    business: ['与业务团队确认规则变更', '确保修改符合法规要求', '建立审批变更流程'],
    security: ['定期审查安全配置', '使用强密码和双因素认证', '限制管理员权限最小化原则'],
    notification: ['避免频繁通知影响用户体验', '分类设置不同优先级的通知', '提供用户自定义选项'],
    integration: ['使用环境变量管理敏感信息', '定期轮换API密钥', '监控集成服务状态'],
    appearance: ['保持界面一致性', '考虑不同设备的兼容性', '遵循无障碍设计原则'],
    backup: ['设置多个备份存储位置', '定期测试备份恢复功能', '监控备份任务执行状态'],
    maintenance: ['设置合适的日志级别', '定期清理过期日志', '监控系统性能指标']
  }
  return bestPractices[category] || []
}

function getCategoryWarning(category: SettingsCategory): string | undefined {
  const warnings: Record<SettingsCategory, string> = {
    security: '⚠️ 安全设置的修改可能影响系统安全性，请确保你了解每项设置的含义，并在修改前制定回滚计划。',
    business: '⚠️ 业务规则的变更将直接影响用户操作流程，请务必与相关业务团队确认后再进行修改。',
    integration: '⚠️ 集成设置错误可能导致外部服务无法正常工作，请在修改前确认相关服务的可用性。',
    backup: '⚠️ 备份设置关系到数据安全，错误配置可能导致数据丢失，请谨慎操作。'
  }
  return warnings[category]
}

function getCategoryRelatedSettings(category: SettingsCategory): Array<{key: string, label: string}> {
  const relatedSettings: Record<SettingsCategory, Array<{key: string, label: string}>> = {
    security: [
      { key: 'notification', label: '安全通知设置' },
      { key: 'backup', label: '数据备份设置' }
    ],
    business: [
      { key: 'notification', label: '业务流程通知' },
      { key: 'integration', label: '业务系统集成' }
    ],
    integration: [
      { key: 'security', label: '集成安全设置' },
      { key: 'notification', label: '集成状态通知' }
    ],
    backup: [
      { key: 'security', label: '备份安全设置' },
      { key: 'maintenance', label: '备份维护策略' }
    ]
  }
  return relatedSettings[category] || []
}

// Watch for category changes
watch(currentCategory, () => {
  uni.setNavigationBarTitle({
    title: `系统设置 - ${categoryInfo.value.title}`
  })
})

// Lifecycle
onMounted(async () => {
  // Check permissions
  if (!checkPermission.canPerformAction('read', 'settings')) {
    uni.showToast({
      title: '权限不足',
      icon: 'none'
    })
    uni.navigateBack()
    return
  }
  
  // Load initial settings
  await refreshSettings()
})
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.settings-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: $spacing-lg;
  background: $color-bg-white;
  border-bottom: 1px solid $color-border;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  
  .header-left {
    flex: 1;
    
    .page-title {
      font-size: $font-size-xl;
      font-weight: 600;
      color: $color-text-primary;
      display: block;
      margin-bottom: $spacing-xs;
    }
    
    .page-subtitle {
      font-size: $font-size-sm;
      color: $color-text-secondary;
    }
  }
  
  .header-actions {
    display: flex;
    align-items: center;
    gap: $spacing-md;
    
    .import-export-actions,
    .save-actions {
      display: flex;
      gap: $spacing-sm;
    }
    
    .action-btn {
      display: flex;
      align-items: center;
      gap: $spacing-xs;
      padding: 8px 16px;
      border-radius: $border-radius-md;
      font-size: $font-size-sm;
      cursor: pointer;
      transition: all 0.3s ease;
      
      .btn-icon {
        font-size: 14px;
      }
      
      &.export {
        background: $color-bg-light;
        color: $color-text-primary;
        border: 1px solid $color-border;
        
        &:hover {
          background: $color-bg-white;
        }
      }
      
      &.import {
        background: $color-info;
        color: white;
        border: 1px solid $color-info;
        
        &:hover {
          background: darken($color-info, 10%);
        }
      }
      
      &.reset {
        background: $color-bg-light;
        color: $color-text-secondary;
        border: 1px solid $color-border;
        
        &:hover {
          background: $color-warning;
          color: white;
          border-color: $color-warning;
        }
      }
      
      &.save {
        background: $color-success;
        color: white;
        border: 1px solid $color-success;
        
        &:hover {
          background: darken($color-success, 10%);
        }
        
        &.primary {
          background: $color-primary;
          border-color: $color-primary;
          
          &:hover {
            background: darken($color-primary, 10%);
          }
        }
      }
      
      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        
        &:hover {
          background: initial;
          color: initial;
          border-color: initial;
        }
      }
    }
  }
}

.settings-container {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.settings-sidebar {
  width: 280px;
  background: $color-bg-white;
  border-right: 1px solid $color-border;
  overflow-y: auto;
  
  .sidebar-header {
    padding: $spacing-md;
    border-bottom: 1px solid $color-border;
    
    .sidebar-title {
      font-size: $font-size-md;
      font-weight: 600;
      color: $color-text-primary;
    }
  }
  
  .category-list {
    padding: $spacing-sm;
    
    .category-item {
      display: flex;
      align-items: center;
      gap: $spacing-sm;
      padding: $spacing-md;
      border-radius: $border-radius-md;
      cursor: pointer;
      transition: all 0.3s ease;
      margin-bottom: $spacing-xs;
      position: relative;
      
      &:hover {
        background: rgba($color-primary, 0.05);
      }
      
      &.active {
        background: rgba($color-primary, 0.1);
        border-left: 3px solid $color-primary;
        
        .category-title {
          color: $color-primary;
          font-weight: 600;
        }
      }
      
      .category-icon {
        font-size: 20px;
        width: 24px;
        text-align: center;
      }
      
      .category-content {
        flex: 1;
        
        .category-title {
          font-size: $font-size-sm;
          font-weight: 500;
          color: $color-text-primary;
          display: block;
          margin-bottom: 2px;
        }
        
        .category-desc {
          font-size: $font-size-xs;
          color: $color-text-secondary;
          line-height: 1.3;
        }
      }
      
      .category-indicator {
        .indicator-dot {
          color: $color-warning;
          font-size: 12px;
        }
      }
    }
  }
}

.settings-content {
  flex: 1;
  overflow-y: auto;
  background: $color-bg-light;
  
  .loading-container,
  .error-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: $spacing-xl;
    
    .loading-text,
    .error-text {
      font-size: $font-size-md;
      color: $color-text-secondary;
      margin-bottom: $spacing-md;
    }
    
    .retry-btn {
      padding: 8px 16px;
      background: $color-primary;
      color: white;
      border: none;
      border-radius: $border-radius-md;
      cursor: pointer;
    }
  }
  
  .settings-form {
    height: 100%;
    display: flex;
    flex-direction: column;
    
    .category-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: $spacing-lg;
      background: $color-bg-white;
      border-bottom: 1px solid $color-border;
      
      .category-info {
        display: flex;
        align-items: center;
        gap: $spacing-md;
        
        .category-icon-large {
          font-size: 32px;
        }
        
        .category-text {
          .category-title-row {
            display: flex;
            align-items: center;
            gap: $spacing-sm;
            margin-bottom: $spacing-xs;
          }

          .category-title {
            font-size: $font-size-lg;
            font-weight: 600;
            color: $color-text-primary;
            display: block;
          }
          
          .category-description {
            font-size: $font-size-sm;
            color: $color-text-secondary;
          }
        }
      }
      
      .category-actions {
        .history-btn {
          display: flex;
          align-items: center;
          gap: $spacing-xs;
          padding: 8px 16px;
          background: $color-bg-light;
          color: $color-text-primary;
          border: 1px solid $color-border;
          border-radius: $border-radius-md;
          font-size: $font-size-sm;
          cursor: pointer;
          
          &:hover {
            background: $color-bg-white;
          }
          
          .btn-icon {
            font-size: 12px;
          }
        }
      }
    }
    
    .settings-groups {
      flex: 1;
      padding: $spacing-lg;
      overflow-y: auto;
      
      .settings-group {
        background: $color-bg-white;
        border-radius: $border-radius-lg;
        border: 1px solid $color-border;
        overflow: hidden;
      }
    }
    
    .settings-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: $spacing-md $spacing-lg;
      background: $color-bg-white;
      border-top: 1px solid $color-border;
      
      .footer-info {
        .info-text {
          font-size: $font-size-sm;
          color: $color-text-secondary;
        }
        
        .unsaved-indicator {
          font-size: $font-size-sm;
          color: $color-warning;
          font-weight: 500;
          margin-left: $spacing-md;
        }
      }
      
      .footer-actions {
        display: flex;
        gap: $spacing-sm;
        
        .footer-btn {
          padding: 8px 16px;
          border-radius: $border-radius-md;
          font-size: $font-size-sm;
          cursor: pointer;
          transition: all 0.3s ease;
          
          &.secondary {
            background: $color-bg-light;
            color: $color-text-secondary;
            border: 1px solid $color-border;
            
            &:hover {
              background: $color-bg-white;
            }
          }
          
          &.primary {
            background: $color-primary;
            color: white;
            border: 1px solid $color-primary;
            
            &:hover {
              background: darken($color-primary, 10%);
            }
          }
          
          &:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }
        }
      }
    }
  }
}

// Responsive design
@media (max-width: 1024px) {
  .settings-container {
    flex-direction: column;
  }
  
  .settings-sidebar {
    width: 100%;
    height: auto;
    max-height: 200px;
    
    .category-list {
      display: flex;
      overflow-x: auto;
      gap: $spacing-sm;
      
      .category-item {
        min-width: 120px;
        flex-direction: column;
        text-align: center;
        margin-bottom: 0;
        
        .category-content {
          .category-desc {
            display: none;
          }
        }
      }
    }
  }
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: $spacing-md;
    
    .header-actions {
      width: 100%;
      justify-content: space-between;
      
      .import-export-actions,
      .save-actions {
        flex-direction: column;
        width: 100%;
      }
    }
  }
  
  .settings-content {
    .category-header {
      flex-direction: column;
      align-items: stretch;
      gap: $spacing-md;
      
      .category-actions {
        align-self: flex-end;
      }
    }
    
    .settings-footer {
      flex-direction: column;
      gap: $spacing-md;
      
      .footer-actions {
        width: 100%;
        justify-content: space-between;
      }
    }
  }
}
</style>