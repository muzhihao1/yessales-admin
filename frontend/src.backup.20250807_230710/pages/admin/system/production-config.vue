<template>
  <view class="production-config-manager">
    <AdminLayout>
      <!-- 页面标题和环境指示器 -->
      <view class="page-header">
        <view class="header-left">
          <text class="page-title">生产环境配置管理</text>
          <text class="page-subtitle">管理生产环境部署配置和性能优化设置</text>
        </view>
        <view class="header-right">
          <view class="env-indicator" :class="currentEnv">
            <view class="env-dot"></view>
            <text>{{ getEnvLabel(currentEnv) }}</text>
          </view>
          <button class="admin-btn admin-btn-secondary" @click="handleValidateConfig">
            验证配置
          </button>
          <button class="admin-btn admin-btn-primary" @click="handleExportConfig">
            导出配置
          </button>
        </view>
      </view>

      <!-- 配置概览面板 -->
      <view class="config-overview admin-card">
        <view class="overview-header">
          <text class="overview-title">配置概览</text>
          <picker
            mode="selector"
            :range="configPresets"
            :value="selectedPresetIndex"
            @change="handlePresetChange"
          >
            <view class="preset-picker">
              配置预设: {{ configPresets[selectedPresetIndex] }}
              <text class="picker-arrow">▼</text>
            </view>
          </picker>
        </view>
        
        <view class="overview-grid">
          <view class="overview-item">
            <view class="item-icon">🏗️</view>
            <view class="item-details">
              <text class="item-title">构建配置</text>
              <text class="item-desc">{{ configSummary.build }}</text>
            </view>
          </view>
          
          <view class="overview-item">
            <view class="item-icon">🔒</view>
            <view class="item-details">
              <text class="item-title">安全设置</text>
              <text class="item-desc">{{ configSummary.security }}</text>
            </view>
          </view>
          
          <view class="overview-item">
            <view class="item-icon">⚡</view>
            <view class="item-details">
              <text class="item-title">性能优化</text>
              <text class="item-desc">{{ configSummary.performance }}</text>
            </view>
          </view>
          
          <view class="overview-item">
            <view class="item-icon">📊</view>
            <view class="item-details">
              <text class="item-title">监控设置</text>
              <text class="item-desc">{{ configSummary.monitoring }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 配置验证结果 -->
      <view v-if="validationResult" class="validation-result admin-card">
        <view class="validation-header">
          <text class="validation-title">配置验证结果</text>
          <view class="validation-status" :class="validationResult.valid ? 'valid' : 'invalid'">
            <text>{{ validationResult.valid ? '✅ 配置有效' : '❌ 配置无效' }}</text>
          </view>
        </view>
        
        <view v-if="validationResult.errors.length > 0" class="validation-errors">
          <text class="section-title">错误信息</text>
          <view 
            v-for="(error, index) in validationResult.errors" 
            :key="index"
            class="error-item"
          >
            <text class="error-icon">🚨</text>
            <text class="error-message">{{ error }}</text>
          </view>
        </view>
        
        <view v-if="validationResult.warnings.length > 0" class="validation-warnings">
          <text class="section-title">警告信息</text>
          <view 
            v-for="(warning, index) in validationResult.warnings" 
            :key="index"
            class="warning-item"
          >
            <text class="warning-icon">⚠️</text>
            <text class="warning-message">{{ warning }}</text>
          </view>
        </view>
      </view>

      <!-- 配置分类面板 -->
      <view class="config-tabs">
        <view 
          v-for="tab in configTabs" 
          :key="tab.key"
          class="tab-item"
          :class="{ active: activeTab === tab.key }"
          @click="activeTab = tab.key"
        >
          <text class="tab-icon">{{ tab.icon }}</text>
          <text class="tab-label">{{ tab.label }}</text>
        </view>
      </view>

      <!-- 应用基础配置 -->
      <view v-show="activeTab === 'app'" class="config-section admin-card">
        <text class="section-title">应用基础配置</text>
        
        <view class="config-form">
          <view class="form-group">
            <text class="form-label">应用名称</text>
            <input 
              v-model="config.app.name" 
              class="form-input"
              placeholder="应用名称"
            />
          </view>
          
          <view class="form-group">
            <text class="form-label">应用版本</text>
            <input 
              v-model="config.app.version" 
              class="form-input"
              placeholder="1.0.0"
              pattern="\\d+\\.\\d+\\.\\d+"
            />
          </view>
          
          <view class="form-group">
            <text class="form-label">构建编号</text>
            <input 
              v-model="config.app.build" 
              class="form-input"
              placeholder="自动生成"
              readonly
            />
          </view>
          
          <view class="form-group">
            <text class="form-label">调试模式</text>
            <switch 
              :checked="config.app.debug" 
              @change="config.app.debug = $event.detail.value"
              color="#007AFF"
            />
          </view>
        </view>
      </view>

      <!-- API配置 -->
      <view v-show="activeTab === 'api'" class="config-section admin-card">
        <text class="section-title">API 配置</text>
        
        <view class="config-form">
          <view class="form-group">
            <text class="form-label">API 基础地址</text>
            <input 
              v-model="config.api.baseURL" 
              class="form-input"
              placeholder="https://api.example.com/v1"
              type="url"
            />
          </view>
          
          <view class="form-group">
            <text class="form-label">请求超时时间 (毫秒)</text>
            <input 
              v-model.number="config.api.timeout" 
              class="form-input"
              type="number"
              min="1000"
              max="60000"
            />
          </view>
          
          <view class="form-group">
            <text class="form-label">重试次数</text>
            <input 
              v-model.number="config.api.retryAttempts" 
              class="form-input"
              type="number"
              min="0"
              max="10"
            />
          </view>
          
          <view class="form-group">
            <text class="form-label">最大并发请求数</text>
            <input 
              v-model.number="config.api.maxConcurrentRequests" 
              class="form-input"
              type="number"
              min="1"
              max="50"
            />
          </view>
          
          <view class="form-group">
            <text class="form-label">启用压缩</text>
            <switch 
              :checked="config.api.enableCompression" 
              @change="config.api.enableCompression = $event.detail.value"
              color="#007AFF"
            />
          </view>
          
          <view class="form-group">
            <text class="form-label">启用缓存</text>
            <switch 
              :checked="config.api.enableCaching" 
              @change="config.api.enableCaching = $event.detail.value"
              color="#007AFF"
            />
          </view>
        </view>
      </view>

      <!-- 安全配置 -->
      <view v-show="activeTab === 'security'" class="config-section admin-card">
        <text class="section-title">安全配置</text>
        
        <view class="config-form">
          <view class="form-group">
            <text class="form-label">启用 HTTPS</text>
            <switch 
              :checked="config.security.enableHTTPS" 
              @change="config.security.enableHTTPS = $event.detail.value"
              color="#007AFF"
            />
          </view>
          
          <view class="form-group">
            <text class="form-label">启用 CSP</text>
            <switch 
              :checked="config.security.enableCSP" 
              @change="config.security.enableCSP = $event.detail.value"
              color="#007AFF"
            />
          </view>
          
          <view class="form-group">
            <text class="form-label">CSP 策略</text>
            <textarea 
              v-model="config.security.cspPolicy"
              class="form-textarea"
              placeholder="Content Security Policy"
              :disabled="!config.security.enableCSP"
            />
          </view>
          
          <view class="form-group">
            <text class="form-label">会话超时时间 (毫秒)</text>
            <input 
              v-model.number="config.security.sessionTimeout" 
              class="form-input"
              type="number"
              min="300000"
              max="7200000"
            />
          </view>
          
          <view class="form-group">
            <text class="form-label">最大登录尝试次数</text>
            <input 
              v-model.number="config.security.maxLoginAttempts" 
              class="form-input"
              type="number"
              min="3"
              max="10"
            />
          </view>
        </view>
      </view>

      <!-- 性能配置 -->
      <view v-show="activeTab === 'performance'" class="config-section admin-card">
        <text class="section-title">性能优化配置</text>
        
        <view class="config-form">
          <view class="form-group">
            <text class="form-label">启用 Service Worker</text>
            <switch 
              :checked="config.cache.enableServiceWorker" 
              @change="config.cache.enableServiceWorker = $event.detail.value"
              color="#007AFF"
            />
          </view>
          
          <view class="form-group">
            <text class="form-label">最大缓存大小 (字节)</text>
            <input 
              v-model.number="config.cache.maxCacheSize" 
              class="form-input"
              type="number"
              min="10485760"
              max="524288000"
            />
          </view>
          
          <view class="form-group">
            <text class="form-label">缓存策略</text>
            <picker
              mode="selector"
              :range="cacheStrategies"
              :value="cacheStrategyIndex"
              @change="handleCacheStrategyChange"
            >
              <view class="config-picker">
                {{ cacheStrategies[cacheStrategyIndex] }}
                <text class="picker-arrow">▼</text>
              </view>
            </picker>
          </view>
          
          <view class="form-group">
            <text class="form-label">CDN URL</text>
            <input 
              v-model="config.resources.cdnURL" 
              class="form-input"
              placeholder="https://cdn.example.com"
              type="url"
            />
          </view>
          
          <view class="form-group">
            <text class="form-label">启用图片优化</text>
            <switch 
              :checked="config.resources.enableImageOptimization" 
              @change="config.resources.enableImageOptimization = $event.detail.value"
              color="#007AFF"
            />
          </view>
          
          <view class="form-group">
            <text class="form-label">图片质量 (%)</text>
            <slider
              v-model="config.resources.imageQuality"
              min="50"
              max="100"
              show-value
              activeColor="#007AFF"
              :disabled="!config.resources.enableImageOptimization"
            />
          </view>
          
          <view class="form-group">
            <text class="form-label">启用虚拟滚动</text>
            <switch 
              :checked="config.ui.enableVirtualScrolling" 
              @change="config.ui.enableVirtualScrolling = $event.detail.value"
              color="#007AFF"
            />
          </view>
          
          <view class="form-group">
            <text class="form-label">虚拟滚动阈值</text>
            <input 
              v-model.number="config.ui.virtualScrollThreshold" 
              class="form-input"
              type="number"
              min="50"
              max="1000"
              :disabled="!config.ui.enableVirtualScrolling"
            />
          </view>
        </view>
      </view>

      <!-- 监控配置 -->
      <view v-show="activeTab === 'monitoring'" class="config-section admin-card">
        <text class="section-title">监控和日志配置</text>
        
        <view class="config-form">
          <view class="form-group">
            <text class="form-label">启用性能追踪</text>
            <switch 
              :checked="config.monitoring.enablePerformanceTracking" 
              @change="config.monitoring.enablePerformanceTracking = $event.detail.value"
              color="#007AFF"
            />
          </view>
          
          <view class="form-group">
            <text class="form-label">启用错误追踪</text>
            <switch 
              :checked="config.monitoring.enableErrorTracking" 
              @change="config.monitoring.enableErrorTracking = $event.detail.value"
              color="#007AFF"
            />
          </view>
          
          <view class="form-group">
            <text class="form-label">采样率</text>
            <slider
              v-model="config.monitoring.sampleRate"
              min="0.01"
              max="1"
              step="0.01"
              show-value
              activeColor="#007AFF"
            />
          </view>
          
          <view class="form-group">
            <text class="form-label">日志级别</text>
            <picker
              mode="selector"
              :range="logLevels"
              :value="logLevelIndex"
              @change="handleLogLevelChange"
            >
              <view class="config-picker">
                {{ logLevels[logLevelIndex] }}
                <text class="picker-arrow">▼</text>
              </view>
            </picker>
          </view>
          
          <view class="form-group">
            <text class="form-label">启用远程日志</text>
            <switch 
              :checked="config.logging.enableRemoteLogging" 
              @change="config.logging.enableRemoteLogging = $event.detail.value"
              color="#007AFF"
            />
          </view>
          
          <view class="form-group">
            <text class="form-label">敏感数据掩码</text>
            <switch 
              :checked="config.logging.sensitiveDataMask" 
              @change="config.logging.sensitiveDataMask = $event.detail.value"
              color="#007AFF"
            />
          </view>
        </view>
      </view>

      <!-- 功能开关 -->
      <view v-show="activeTab === 'features'" class="config-section admin-card">
        <text class="section-title">功能开关配置</text>
        
        <view class="config-form">
          <view class="form-group">
            <text class="form-label">启用实时更新</text>
            <switch 
              :checked="config.features.enableRealTimeUpdates" 
              @change="config.features.enableRealTimeUpdates = $event.detail.value"
              color="#007AFF"
            />
          </view>
          
          <view class="form-group">
            <text class="form-label">启用离线模式</text>
            <switch 
              :checked="config.features.enableOfflineMode" 
              @change="config.features.enableOfflineMode = $event.detail.value"
              color="#007AFF"
            />
          </view>
          
          <view class="form-group">
            <text class="form-label">启用推送通知</text>
            <switch 
              :checked="config.features.enablePushNotifications" 
              @change="config.features.enablePushNotifications = $event.detail.value"
              color="#007AFF"
            />
          </view>
          
          <view class="form-group">
            <text class="form-label">启用分析统计</text>
            <switch 
              :checked="config.features.enableAnalytics" 
              @change="config.features.enableAnalytics = $event.detail.value"
              color="#007AFF"
            />
          </view>
          
          <view class="form-group">
            <text class="form-label">启用高级过滤器</text>
            <switch 
              :checked="config.features.enableAdvancedFilters" 
              @change="config.features.enableAdvancedFilters = $event.detail.value"
              color="#007AFF"
            />
          </view>
          
          <view class="form-group">
            <text class="form-label">最大上传文件大小 (字节)</text>
            <input 
              v-model.number="config.features.maxUploadFileSize" 
              class="form-input"
              type="number"
              min="1048576"
              max="104857600"
            />
          </view>
        </view>
      </view>

      <!-- 配置操作面板 -->
      <view class="config-actions admin-card">
        <view class="actions-header">
          <text class="actions-title">配置操作</text>
        </view>
        
        <view class="actions-grid">
          <button class="action-btn save" @click="handleSaveConfig">
            <text class="btn-icon">💾</text>
            <text class="btn-text">保存配置</text>
          </button>
          
          <button class="action-btn reset" @click="handleResetConfig">
            <text class="btn-icon">🔄</text>
            <text class="btn-text">重置配置</text>
          </button>
          
          <button class="action-btn validate" @click="handleValidateConfig">
            <text class="btn-icon">✅</text>
            <text class="btn-text">验证配置</text>
          </button>
          
          <button class="action-btn export" @click="handleExportConfig">
            <text class="btn-icon">📤</text>
            <text class="btn-text">导出配置</text>
          </button>
          
          <button class="action-btn import" @click="handleImportConfig">
            <text class="btn-icon">📥</text>
            <text class="btn-text">导入配置</text>
          </button>
          
          <button class="action-btn deploy" @click="handlePrepareDeploy" :disabled="!validationResult?.valid">
            <text class="btn-icon">🚀</text>
            <text class="btn-text">准备部署</text>
          </button>
        </view>
      </view>
    </AdminLayout>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue'
import { getProductionConfig, ConfigValidator, productionPresets } from '@/config/production'
import type { ProductionConfig } from '@/config/production'
import AdminLayout from '@/layouts/AdminLayout.vue'
import { showToast } from '@/utils/ui'

/**
 * 生产环境配置管理页面
 * 
 * 功能展示：
 * - 可视化配置管理界面
 * - 配置验证和优化建议
 * - 多种配置预设支持
 * - 配置导入导出功能
 * - 部署准备和检查清单
 * 
 * @author Terminal 3 (Admin Frontend Team)
 */

// 响应式数据
const activeTab = ref('app')
const selectedPresetIndex = ref(0)
const validationResult = ref<{
  valid: boolean
  warnings: string[]
  errors: string[]
} | null>(null)

// 配置数据
const config = reactive<ProductionConfig>(getProductionConfig())

// 当前环境
const currentEnv = computed(() => {
  return import.meta.env.MODE || 'development'
})

// 配置选项
const configPresets = ['标准', '高性能', '高安全性', '低资源']
const presetMap = {
  0: 'standard',
  1: 'highPerformance', 
  2: 'highSecurity',
  3: 'lowResource'
} as const

const configTabs = [
  { key: 'app', label: '应用配置', icon: '⚙️' },
  { key: 'api', label: 'API配置', icon: '🌐' },
  { key: 'security', label: '安全配置', icon: '🔒' },
  { key: 'performance', label: '性能配置', icon: '⚡' },
  { key: 'monitoring', label: '监控配置', icon: '📊' },
  { key: 'features', label: '功能开关', icon: '🎛️' }
]

const cacheStrategies = ['网络优先', '缓存优先', '仅网络']
const cacheStrategyIndex = computed({
  get: () => {
    const strategies = ['networkFirst', 'cacheFirst', 'networkOnly']
    return strategies.indexOf(config.cache.cacheStrategy)
  },
  set: (index) => {
    const strategies: ('networkFirst' | 'cacheFirst' | 'networkOnly')[] = ['networkFirst', 'cacheFirst', 'networkOnly']
    config.cache.cacheStrategy = strategies[index]
  }
})

const logLevels = ['错误', '警告', '信息', '调试']
const logLevelIndex = computed({
  get: () => {
    const levels = ['error', 'warn', 'info', 'debug']
    return levels.indexOf(config.logging.level)
  },
  set: (index) => {
    const levels: ('error' | 'warn' | 'info' | 'debug')[] = ['error', 'warn', 'info', 'debug']
    config.logging.level = levels[index]
  }
})

// 配置摘要
const configSummary = computed(() => {
  return {
    build: `${config.app.name} v${config.app.version}`,
    security: `HTTPS: ${config.security.enableHTTPS ? '启用' : '禁用'}, CSP: ${config.security.enableCSP ? '启用' : '禁用'}`,
    performance: `缓存: ${formatBytes(config.cache.maxCacheSize)}, 虚拟滚动: ${config.ui.enableVirtualScrolling ? '启用' : '禁用'}`,
    monitoring: `性能追踪: ${config.monitoring.enablePerformanceTracking ? '启用' : '禁用'}, 采样率: ${(config.monitoring.sampleRate * 100).toFixed(1)}%`
  }
})

// 事件处理函数
const handlePresetChange = (event: any) => {
  selectedPresetIndex.value = event.detail.value
  const presetKey = presetMap[selectedPresetIndex.value as keyof typeof presetMap]
  
  if (presetKey in productionPresets) {
    const newConfig = productionPresets[presetKey as keyof typeof productionPresets]()
    Object.assign(config, newConfig)
    showToast(`已应用 ${configPresets[selectedPresetIndex.value]} 配置预设`, 'success')
  }
}

const handleCacheStrategyChange = (event: any) => {
  cacheStrategyIndex.value = event.detail.value
}

const handleLogLevelChange = (event: any) => {
  logLevelIndex.value = event.detail.value
}

const handleValidateConfig = () => {
  try {
    validationResult.value = ConfigValidator.validateConfig(config)
    
    if (validationResult.value.valid) {
      showToast('配置验证通过', 'success')
    } else {
      showToast(`配置验证失败：${validationResult.value.errors.length} 个错误`, 'error')
    }
  } catch (error) {
    showToast('配置验证失败', 'error')
    console.error('Config validation error:', error)
  }
}

const handleSaveConfig = () => {
  try {
    // 这里应该保存配置到后端或本地存储
    const configData = JSON.stringify(config, null, 2)
    localStorage.setItem('production-config', configData)
    
    showToast('配置已保存', 'success')
  } catch (error) {
    showToast('配置保存失败', 'error')
    console.error('Save config error:', error)
  }
}

const handleResetConfig = () => {
  try {
    const defaultConfig = getProductionConfig()
    Object.assign(config, defaultConfig)
    validationResult.value = null
    
    showToast('配置已重置为默认值', 'success')
  } catch (error) {
    showToast('配置重置失败', 'error')
  }
}

const handleExportConfig = () => {
  try {
    const configData = JSON.stringify(config, null, 2)
    const blob = new Blob([configData], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    
    // 创建下载链接
    const a = document.createElement('a')
    a.href = url
    a.download = `yessales-production-config-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    showToast('配置已导出', 'success')
  } catch (error) {
    showToast('配置导出失败', 'error')
    console.error('Export config error:', error)
  }
}

const handleImportConfig = () => {
  try {
    // 创建文件输入
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    
    input.onchange = async (event: any) => {
      const file = event.target.files[0]
      if (!file) return
      
      try {
        const text = await file.text()
        const importedConfig = JSON.parse(text) as ProductionConfig
        
        // 验证导入的配置
        const validation = ConfigValidator.validateConfig(importedConfig)
        
        if (validation.valid) {
          Object.assign(config, importedConfig)
          validationResult.value = validation
          showToast('配置导入成功', 'success')
        } else {
          showToast(`配置文件有问题：${validation.errors.length} 个错误`, 'error')
          validationResult.value = validation
        }
      } catch (error) {
        showToast('配置文件格式无效', 'error')
      }
    }
    
    input.click()
  } catch (error) {
    showToast('配置导入失败', 'error')
    console.error('Import config error:', error)
  }
}

const handlePrepareDeploy = () => {
  if (!validationResult.value?.valid) {
    showToast('请先验证配置', 'warning')
    return
  }
  
  // 生成部署清单
  const deployChecklist = {
    timestamp: new Date().toISOString(),
    config: config,
    validation: validationResult.value,
    environment: currentEnv.value,
    checklist: [
      '✅ 配置验证通过',
      '⚠️ 确认 API 服务地址可访问',
      '⚠️ 确认 CDN 资源配置正确',
      '⚠️ 确认数据库连接配置',
      '⚠️ 确认第三方服务密钥',
      '⚠️ 执行构建脚本: ./scripts/build-production.sh',
      '⚠️ 在测试环境验证功能',
      '⚠️ 备份当前生产环境',
      '⚠️ 执行部署脚本',
      '⚠️ 验证部署结果'
    ]
  }
  
  const checklistData = JSON.stringify(deployChecklist, null, 2)
  const blob = new Blob([checklistData], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  
  const a = document.createElement('a')
  a.href = url
  a.download = `deployment-checklist-${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  
  showToast('部署清单已生成', 'success')
}

// 工具函数
const getEnvLabel = (env: string) => {
  const labels = {
    development: '开发环境',
    staging: '测试环境',
    production: '生产环境'
  }
  return labels[env as keyof typeof labels] || env
}

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

// 生命周期
onMounted(() => {
  // 尝试从本地存储加载配置
  try {
    const savedConfig = localStorage.getItem('production-config')
    if (savedConfig) {
      const parsedConfig = JSON.parse(savedConfig)
      Object.assign(config, parsedConfig)
    }
  } catch (error) {
    console.warn('Failed to load saved config:', error)
  }
  
  // 自动验证当前配置
  handleValidateConfig()
})
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.production-config-manager {
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    
    .header-left {
      .page-title {
        font-size: 24px;
        font-weight: 600;
        color: var(--text-color-primary);
        margin-bottom: 4px;
        display: block;
      }
      
      .page-subtitle {
        font-size: 14px;
        color: var(--text-color-secondary);
      }
    }
    
    .header-right {
      display: flex;
      align-items: center;
      gap: 12px;
      
      .env-indicator {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 6px 12px;
        border-radius: 16px;
        font-size: 12px;
        background: rgba(var(--color-grey-rgb), 0.1);
        color: var(--text-color-secondary);
        
        .env-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--color-grey-500);
        }
        
        &.development {
          background: rgba(var(--color-primary-rgb), 0.1);
          color: var(--color-primary);
          
          .env-dot {
            background: var(--color-primary);
          }
        }
        
        &.production {
          background: rgba(var(--color-error-rgb), 0.1);
          color: var(--color-error);
          
          .env-dot {
            background: var(--color-error);
            animation: pulse 2s infinite;
          }
        }
      }
    }
  }
  
  .config-overview {
    margin-bottom: 24px;
    
    .overview-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      
      .overview-title {
        font-size: 18px;
        font-weight: 600;
        color: var(--text-color-primary);
      }
      
      .preset-picker {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        border: 1px solid var(--border-color);
        border-radius: 6px;
        background: white;
        font-size: 14px;
      }
    }
    
    .overview-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 20px;
      
      .overview-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px;
        background: var(--bg-color-secondary);
        border-radius: 8px;
        border: 1px solid var(--border-color-light);
        
        .item-icon {
          font-size: 24px;
        }
        
        .item-details {
          flex: 1;
          
          .item-title {
            font-size: 14px;
            font-weight: 600;
            color: var(--text-color-primary);
            display: block;
            margin-bottom: 4px;
          }
          
          .item-desc {
            font-size: 12px;
            color: var(--text-color-secondary);
            line-height: 1.4;
          }
        }
      }
    }
  }
  
  .validation-result {
    margin-bottom: 24px;
    
    .validation-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      
      .validation-title {
        font-size: 16px;
        font-weight: 600;
        color: var(--text-color-primary);
      }
      
      .validation-status {
        padding: 4px 12px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 500;
        
        &.valid {
          background: rgba(var(--color-success-rgb), 0.1);
          color: var(--color-success);
        }
        
        &.invalid {
          background: rgba(var(--color-error-rgb), 0.1);
          color: var(--color-error);
        }
      }
    }
    
    .validation-errors,
    .validation-warnings {
      .section-title {
        font-size: 14px;
        font-weight: 600;
        margin-bottom: 12px;
        display: block;
      }
      
      .error-item,
      .warning-item {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        margin-bottom: 8px;
        padding: 8px 12px;
        border-radius: 6px;
        
        .error-icon,
        .warning-icon {
          flex-shrink: 0;
        }
        
        .error-message,
        .warning-message {
          font-size: 13px;
          line-height: 1.4;
        }
      }
      
      .error-item {
        background: rgba(var(--color-error-rgb), 0.05);
        border: 1px solid rgba(var(--color-error-rgb), 0.2);
        color: var(--color-error);
      }
      
      .warning-item {
        background: rgba(var(--color-warning-rgb), 0.05);
        border: 1px solid rgba(var(--color-warning-rgb), 0.2);
        color: var(--color-warning);
      }
    }
  }
  
  .config-tabs {
    display: flex;
    gap: 4px;
    margin-bottom: 24px;
    background: var(--bg-color-secondary);
    padding: 4px;
    border-radius: 8px;
    overflow-x: auto;
    
    .tab-item {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s ease;
      white-space: nowrap;
      
      .tab-icon {
        font-size: 16px;
      }
      
      .tab-label {
        font-size: 13px;
        color: var(--text-color-secondary);
      }
      
      &.active {
        background: white;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
        
        .tab-label {
          color: var(--color-primary);
          font-weight: 500;
        }
      }
    }
  }
  
  .config-section {
    margin-bottom: 24px;
    
    .section-title {
      font-size: 18px;
      font-weight: 600;
      color: var(--text-color-primary);
      margin-bottom: 24px;
      display: block;
    }
    
    .config-form {
      .form-group {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 20px;
        
        .form-label {
          font-size: 14px;
          color: var(--text-color-primary);
          font-weight: 500;
          flex-shrink: 0;
          width: 180px;
        }
        
        .form-input {
          flex: 1;
          padding: 8px 12px;
          border: 1px solid var(--border-color);
          border-radius: 6px;
          font-size: 14px;
          max-width: 300px;
          
          &:focus {
            border-color: var(--color-primary);
            outline: none;
          }
          
          &:disabled {
            background: var(--bg-color-disabled);
            color: var(--text-color-disabled);
          }
        }
        
        .form-textarea {
          flex: 1;
          padding: 8px 12px;
          border: 1px solid var(--border-color);
          border-radius: 6px;
          font-size: 14px;
          min-height: 80px;
          max-width: 400px;
          resize: vertical;
          
          &:focus {
            border-color: var(--color-primary);
            outline: none;
          }
          
          &:disabled {
            background: var(--bg-color-disabled);
            color: var(--text-color-disabled);
          }
        }
        
        .config-picker {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 12px;
          border: 1px solid var(--border-color);
          border-radius: 6px;
          background: white;
          min-width: 200px;
          max-width: 300px;
          font-size: 14px;
        }
      }
    }
  }
  
  .config-actions {
    .actions-header {
      margin-bottom: 20px;
      
      .actions-title {
        font-size: 18px;
        font-weight: 600;
        color: var(--text-color-primary);
      }
    }
    
    .actions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 16px;
      
      .action-btn {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        padding: 16px 12px;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s ease;
        
        .btn-icon {
          font-size: 24px;
        }
        
        .btn-text {
          font-size: 12px;
          font-weight: 500;
        }
        
        &.save {
          background: var(--color-primary);
          color: white;
          
          &:hover {
            background: var(--color-primary-dark);
          }
        }
        
        &.reset {
          background: var(--color-warning);
          color: white;
          
          &:hover {
            background: var(--color-warning-dark);
          }
        }
        
        &.validate {
          background: var(--color-success);
          color: white;
          
          &:hover {
            background: var(--color-success-dark);
          }
        }
        
        &.export,
        &.import {
          background: var(--color-info);
          color: white;
          
          &:hover {
            background: var(--color-info-dark);
          }
        }
        
        &.deploy {
          background: var(--color-error);
          color: white;
          
          &:hover:not(:disabled) {
            background: var(--color-error-dark);
          }
          
          &:disabled {
            background: var(--color-grey-300);
            color: var(--color-grey-500);
            cursor: not-allowed;
          }
        }
      }
    }
  }
}

@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    opacity: 1;
  }
}

// 响应式优化
@include respond-to('phone') {
  .production-config-manager {
    .page-header {
      flex-direction: column;
      gap: 16px;
      align-items: stretch;
      
      .header-right {
        justify-content: center;
        flex-wrap: wrap;
      }
    }
    
    .overview-grid {
      grid-template-columns: 1fr;
    }
    
    .config-tabs {
      flex-wrap: nowrap;
      overflow-x: auto;
      
      .tab-item {
        flex-shrink: 0;
      }
    }
    
    .config-form .form-group {
      flex-direction: column;
      align-items: stretch;
      gap: 8px;
      
      .form-label {
        width: auto;
        margin-bottom: 4px;
      }
      
      .form-input,
      .form-textarea,
      .config-picker {
        max-width: none;
      }
    }
    
    .actions-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }
}
</style>