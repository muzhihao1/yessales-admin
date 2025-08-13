/**
 * System Settings Store
 *
 * Manages system configuration settings, business rules, security policies,
 * and user preferences across the admin application.
 */

import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  DEFAULT_BUSINESS_RULES,
  DEFAULT_SECURITY_SETTINGS,
  SETTINGS_CATEGORIES
} from '@/types/settings'
import type {
  AppearanceSettings,
  BackupSettings,
  BusinessRuleSettings,
  IntegrationSettings,
  NotificationSettings,
  SecuritySettings,
  SettingsCategory,
  SettingsChangeHistory,
  SettingsExportData,
  SettingsFormData,
  SettingsGroup,
  SettingsImportResult,
  SettingsValidationResult,
  SystemSettings
} from '@/types/settings'

export const useSettingsStore = defineStore('settings', () => {
  // State
  const settings = ref<SystemSettings[]>([])
  const settingsGroups = ref<SettingsGroup[]>([])
  const currentCategory = ref<SettingsCategory>('general')
  const loading = ref(false)
  const saving = ref(false)
  const error = ref<string | null>(null)
  const changeHistory = ref<SettingsChangeHistory[]>([])

  // Typed settings objects
  const businessRules = ref<BusinessRuleSettings>(DEFAULT_BUSINESS_RULES)
  const securitySettings = ref<SecuritySettings>(DEFAULT_SECURITY_SETTINGS)
  const notificationSettings = ref<NotificationSettings | null>(null)
  const integrationSettings = ref<IntegrationSettings | null>(null)
  const backupSettings = ref<BackupSettings | null>(null)
  const appearanceSettings = ref<AppearanceSettings | null>(null)

  // Computed properties
  const settingsByCategory = computed(() => {
    const grouped: Record<SettingsCategory, SystemSettings[]> = {
      general: [],
      business: [],
      security: [],
      notification: [],
      integration: [],
      appearance: [],
      backup: [],
      maintenance: []
    }

    settings.value.forEach(setting => {
      if (grouped[setting.category]) {
        grouped[setting.category].push(setting)
      }
    })

    return grouped
  })

  const currentCategorySettings = computed(() => {
    return settingsByCategory.value[currentCategory.value] || []
  })

  const hasUnsavedChanges = computed(() => {
    // Check if any settings have been modified but not saved
    return settings.value.some(setting => setting.updated_at === 'pending')
  })

  const categoryInfo = computed(() => {
    return SETTINGS_CATEGORIES[currentCategory.value]
  })

  // Actions
  async function fetchSettings(category?: SettingsCategory) {
    loading.value = true
    error.value = null

    try {
      // Mock API call - replace with actual API integration
      const mockSettings: SystemSettings[] = [
        // General settings
        {
          id: 'gen_001',
          category: 'general',
          key: 'system_name',
          value: 'YesSales 报价系统',
          label: '系统名称',
          description: '显示在浏览器标题栏和页面标题中的系统名称',
          type: 'string',
          is_public: true,
          is_required: true,
          default_value: 'YesSales 报价系统',
          updated_at: new Date().toISOString(),
          created_at: new Date().toISOString()
        },
        {
          id: 'gen_002',
          category: 'general',
          key: 'company_name',
          value: '耶氏台球斗南销售中心',
          label: '公司名称',
          description: '公司正式名称，用于报价单和文档',
          type: 'string',
          is_public: true,
          is_required: true,
          default_value: '',
          updated_at: new Date().toISOString(),
          created_at: new Date().toISOString()
        },
        // Business rules
        {
          id: 'bus_001',
          category: 'business',
          key: 'default_tax_rate',
          value: 0.13,
          label: '默认税率',
          description: '新建报价单时的默认税率（小数形式，如0.13表示13%）',
          type: 'number',
          validation: [
            { type: 'min', value: 0, message: '税率不能为负数' },
            { type: 'max', value: 1, message: '税率不能超过100%' }
          ],
          is_public: false,
          is_required: true,
          default_value: 0.13,
          updated_at: new Date().toISOString(),
          created_at: new Date().toISOString()
        },
        {
          id: 'bus_002',
          category: 'business',
          key: 'max_discount_percentage',
          value: 20,
          label: '最大折扣百分比',
          description: '报价单允许的最大折扣百分比',
          type: 'number',
          validation: [
            { type: 'min', value: 0, message: '折扣不能为负数' },
            { type: 'max', value: 100, message: '折扣不能超过100%' }
          ],
          is_public: false,
          is_required: true,
          default_value: 20,
          updated_at: new Date().toISOString(),
          created_at: new Date().toISOString()
        },
        // Security settings
        {
          id: 'sec_001',
          category: 'security',
          key: 'password_min_length',
          value: 8,
          label: '密码最小长度',
          description: '用户密码的最小长度要求',
          type: 'number',
          validation: [
            { type: 'min', value: 6, message: '密码长度至少6位' },
            { type: 'max', value: 32, message: '密码长度不能超过32位' }
          ],
          is_public: false,
          is_required: true,
          default_value: 8,
          updated_at: new Date().toISOString(),
          created_at: new Date().toISOString()
        },
        {
          id: 'sec_002',
          category: 'security',
          key: 'max_login_attempts',
          value: 5,
          label: '最大登录尝试次数',
          description: '账户锁定前允许的最大登录失败次数',
          type: 'number',
          validation: [
            { type: 'min', value: 3, message: '至少允许3次尝试' },
            { type: 'max', value: 10, message: '不能超过10次尝试' }
          ],
          is_public: false,
          is_required: true,
          default_value: 5,
          updated_at: new Date().toISOString(),
          created_at: new Date().toISOString()
        },
        // Notification settings
        {
          id: 'not_001',
          category: 'notification',
          key: 'email_enabled',
          value: true,
          label: '启用邮件通知',
          description: '是否启用系统邮件通知功能',
          type: 'boolean',
          is_public: false,
          is_required: true,
          default_value: false,
          updated_at: new Date().toISOString(),
          created_at: new Date().toISOString()
        }
      ]

      // Filter by category if specified
      if (category) {
        settings.value = mockSettings.filter(s => s.category === category)
      } else {
        settings.value = mockSettings
      }

      // Update specialized setting objects
      updateSpecializedSettings()
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取设置失败'
      console.error('Failed to fetch settings:', err)
    } finally {
      loading.value = false
    }
  }

  async function updateSetting(settingKey: string, value: any) {
    saving.value = true
    error.value = null

    try {
      const setting = settings.value.find(s => s.key === settingKey)
      if (!setting) {
        throw new Error(`设置项 ${settingKey} 不存在`)
      }

      // Validate the new value
      const validation = validateSettingValue(setting, value)
      if (!validation.isValid) {
        throw new Error(validation.errors[settingKey]?.[0] || '设置值无效')
      }

      // Store old value for history
      const oldValue = setting.value

      // Update the setting
      setting.value = value
      setting.updated_at = new Date().toISOString()

      // Mock API call - replace with actual API integration
      await new Promise(resolve => setTimeout(resolve, 500))

      // Add to change history
      changeHistory.value.unshift({
        id: `change_${Date.now()}`,
        setting_key: settingKey,
        old_value: oldValue,
        new_value: value,
        changed_by: 'current_user', // Replace with actual user
        changed_at: new Date().toISOString(),
        reason: '通过设置页面修改'
      })

      // Update specialized settings
      updateSpecializedSettings()

      console.log('设置已保存')
      alert('设置已保存')
    } catch (err) {
      error.value = err instanceof Error ? err.message : '保存设置失败'
      console.error('保存设置失败:', error.value)
      alert(error.value)
      console.error('Failed to update setting:', err)
    } finally {
      saving.value = false
    }
  }

  async function batchUpdateSettings(updates: Record<string, any>) {
    saving.value = true
    error.value = null

    try {
      const updatedSettings: SystemSettings[] = []
      const validationErrors: string[] = []

      // Validate all updates first
      for (const [key, value] of Object.entries(updates)) {
        const setting = settings.value.find(s => s.key === key)
        if (!setting) {
          validationErrors.push(`设置项 ${key} 不存在`)
          continue
        }

        const validation = validateSettingValue(setting, value)
        if (!validation.isValid) {
          validationErrors.push(...(validation.errors[key] || []))
          continue
        }

        updatedSettings.push({
          ...setting,
          value,
          updated_at: new Date().toISOString()
        })
      }

      if (validationErrors.length > 0) {
        throw new Error(validationErrors.join('; '))
      }

      // Mock API call - replace with actual API integration
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Apply all updates
      updatedSettings.forEach(updatedSetting => {
        const index = settings.value.findIndex(s => s.id === updatedSetting.id)
        if (index !== -1) {
          settings.value[index] = updatedSetting
        }
      })

      // Update specialized settings
      updateSpecializedSettings()

      console.log(`已保存 ${updatedSettings.length} 项设置`)
      alert(`已保存 ${updatedSettings.length} 项设置`)
    } catch (err) {
      error.value = err instanceof Error ? err.message : '批量保存设置失败'
      console.error('批量保存失败:', error.value)
      alert(error.value)
      console.error('Failed to batch update settings:', err)
    } finally {
      saving.value = false
    }
  }

  async function resetToDefaults(category?: SettingsCategory) {
    try {
      const confirmText = category
        ? `确定要将 ${SETTINGS_CATEGORIES[category].title} 重置为默认值吗？`
        : '确定要将所有设置重置为默认值吗？'
      
      const confirmed = confirm(`重置设置\n\n${confirmText}`)
      
      if (confirmed) {
        saving.value = true

        // Filter settings to reset
        const settingsToReset = category
          ? settings.value.filter(s => s.category === category)
          : settings.value

        // Reset to default values
        settingsToReset.forEach(setting => {
          setting.value = setting.default_value
          setting.updated_at = new Date().toISOString()
        })

        // Mock API call
        await new Promise(resolve => setTimeout(resolve, 500))

        updateSpecializedSettings()
        saving.value = false

        console.log('设置已重置')
        alert('设置已重置')
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '重置设置失败'
      console.error('Failed to reset settings:', err)
    }
  }

  async function exportSettings(categories?: SettingsCategory[]): Promise<SettingsExportData> {
    try {
      const settingsToExport = categories
        ? settings.value.filter(s => categories.includes(s.category))
        : settings.value

      const exportData: SettingsExportData = {
        version: '1.0.0',
        exported_at: new Date().toISOString(),
        exported_by: 'current_user', // Replace with actual user
        categories: categories || (Object.keys(SETTINGS_CATEGORIES) as SettingsCategory[]),
        settings: settingsToExport,
        checksum: generateChecksum(settingsToExport)
      }

      return exportData
    } catch (err) {
      error.value = err instanceof Error ? err.message : '导出设置失败'
      console.error('Failed to export settings:', err)
      throw err
    }
  }

  async function importSettings(importData: SettingsExportData): Promise<SettingsImportResult> {
    saving.value = true
    error.value = null

    try {
      // Validate import data
      if (!importData.settings || !Array.isArray(importData.settings)) {
        throw new Error('导入数据格式无效')
      }

      // Verify checksum
      const calculatedChecksum = generateChecksum(importData.settings)
      if (calculatedChecksum !== importData.checksum) {
        throw new Error('导入数据校验失败，文件可能已损坏')
      }

      let importedCount = 0
      let skippedCount = 0
      let errorCount = 0
      const errors: string[] = []
      const warnings: string[] = []

      // Process each setting
      for (const importedSetting of importData.settings) {
        try {
          const existingSetting = settings.value.find(s => s.key === importedSetting.key)

          if (!existingSetting) {
            warnings.push(`设置项 ${importedSetting.key} 在当前系统中不存在，已跳过`)
            skippedCount++
            continue
          }

          // Validate imported value
          const validation = validateSettingValue(existingSetting, importedSetting.value)
          if (!validation.isValid) {
            errors.push(
              `设置项 ${importedSetting.key} 的值无效: ${validation.errors[importedSetting.key]?.[0]}`
            )
            errorCount++
            continue
          }

          // Update the setting
          existingSetting.value = importedSetting.value
          existingSetting.updated_at = new Date().toISOString()
          importedCount++
        } catch (err) {
          errors.push(
            `处理设置项 ${importedSetting.key} 时出错: ${err instanceof Error ? err.message : '未知错误'}`
          )
          errorCount++
        }
      }

      // Mock API call to save changes
      await new Promise(resolve => setTimeout(resolve, 1000))

      updateSpecializedSettings()

      const result: SettingsImportResult = {
        success: errorCount === 0,
        imported_count: importedCount,
        skipped_count: skippedCount,
        error_count: errorCount,
        errors,
        warnings
      }

      return result
    } catch (err) {
      error.value = err instanceof Error ? err.message : '导入设置失败'
      console.error('Failed to import settings:', err)
      throw err
    } finally {
      saving.value = false
    }
  }

  async function fetchChangeHistory(settingKey?: string) {
    loading.value = true
    error.value = null

    try {
      // Mock API call - replace with actual API integration
      const mockHistory: SettingsChangeHistory[] = [
        {
          id: 'hist_001',
          setting_key: 'default_tax_rate',
          old_value: 0.1,
          new_value: 0.13,
          changed_by: 'admin',
          changed_at: new Date(Date.now() - 86400000).toISOString(),
          reason: '税率调整通知',
          ip_address: '192.168.1.100'
        },
        {
          id: 'hist_002',
          setting_key: 'max_discount_percentage',
          old_value: 15,
          new_value: 20,
          changed_by: 'manager',
          changed_at: new Date(Date.now() - 172800000).toISOString(),
          reason: '促销活动调整'
        }
      ]

      changeHistory.value = settingKey
        ? mockHistory.filter(h => h.setting_key === settingKey)
        : mockHistory
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取变更历史失败'
      console.error('Failed to fetch change history:', err)
    } finally {
      loading.value = false
    }
  }

  function setCurrentCategory(category: SettingsCategory) {
    currentCategory.value = category
  }

  function validateSettingValue(setting: SystemSettings, value: any): SettingsValidationResult {
    const errors: Record<string, string[]> = {}
    const warnings: Record<string, string[]> = {}
    const settingErrors: string[] = []

    if (!setting.validation) {
      return { isValid: true, errors, warnings }
    }

    for (const rule of setting.validation) {
      switch (rule.type) {
        case 'required':
          if (value === null || value === undefined || value === '') {
            settingErrors.push(rule.message)
          }
          break
        case 'min':
          if (typeof value === 'number' && value < rule.value) {
            settingErrors.push(rule.message)
          }
          if (typeof value === 'string' && value.length < rule.value) {
            settingErrors.push(rule.message)
          }
          break
        case 'max':
          if (typeof value === 'number' && value > rule.value) {
            settingErrors.push(rule.message)
          }
          if (typeof value === 'string' && value.length > rule.value) {
            settingErrors.push(rule.message)
          }
          break
        case 'pattern':
          if (typeof value === 'string' && rule.value instanceof RegExp) {
            if (!rule.value.test(value)) {
              settingErrors.push(rule.message)
            }
          }
          break
      }
    }

    if (settingErrors.length > 0) {
      errors[setting.key] = settingErrors
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      warnings
    }
  }

  function updateSpecializedSettings() {
    // Update business rules
    const businessSettings = settings.value.filter(s => s.category === 'business')
    const updatedBusinessRules = { ...businessRules.value }

    businessSettings.forEach(setting => {
      if (setting.key in updatedBusinessRules) {
        ;(updatedBusinessRules as any)[setting.key] = setting.value
      }
    })

    businessRules.value = updatedBusinessRules

    // Update security settings
    const securitySettingsData = settings.value.filter(s => s.category === 'security')
    const updatedSecuritySettings = { ...securitySettings.value }

    securitySettingsData.forEach(setting => {
      if (setting.key in updatedSecuritySettings) {
        ;(updatedSecuritySettings as any)[setting.key] = setting.value
      }
    })

    securitySettings.value = updatedSecuritySettings
  }

  function generateChecksum(data: any): string {
    // Simple checksum generation - in production, use a proper hash function
    const jsonString = JSON.stringify(data)
    let hash = 0
    for (let i = 0; i < jsonString.length; i++) {
      const char = jsonString.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16)
  }

  function getSetting(key: string): SystemSettings | undefined {
    return settings.value.find(s => s.key === key)
  }

  function getSettingValue<T = any>(key: string, defaultValue?: T): T {
    const setting = getSetting(key)
    return setting ? setting.value : defaultValue
  }

  // Alias methods for backward compatibility with existing components
  async function updateSettings(settingUpdates: Partial<SystemSettings>[]) {
    // Convert array of partial settings to key-value updates format
    const updates: Record<string, any> = {}
    settingUpdates.forEach(setting => {
      if (setting.key) {
        updates[setting.key] = setting.value
      }
    })
    return await batchUpdateSettings(updates)
  }

  function getSettingsByCategory(category: SettingsCategory): SystemSettings[] {
    return settingsByCategory.value[category] || []
  }

  return {
    // State
    settings,
    settingsGroups,
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

    // Computed
    settingsByCategory,
    currentCategorySettings,
    hasUnsavedChanges,
    categoryInfo,

    // Actions
    fetchSettings,
    updateSetting,
    batchUpdateSettings,
    updateSettings,
    resetToDefaults,
    exportSettings,
    importSettings,
    fetchChangeHistory,
    setCurrentCategory,
    validateSettingValue,
    getSetting,
    getSettingValue,
    getSettingsByCategory
  }
})
