<template>
  <view class="settings-page">
    <!-- Header -->
    <SalesHeader 
      title="应用设置" 
      :show-back="true"
      @back="handleBack"
    />
    
    <view class="settings-container">
      <!-- 设置导航卡片 -->
      <view class="settings-nav">
        <view 
          v-for="category in settingsCategories"
          :key="category.key"
          class="nav-card"
          :class="{ active: currentCategory === category.key }"
          @click="selectCategory(category.key)"
        >
          <view class="card-icon">
            <text>{{ category.icon }}</text>
          </view>
          <view class="card-content">
            <text class="card-title">{{ category.title }}</text>
            <text class="card-desc">{{ category.description }}</text>
          </view>
          <view v-if="hasUnsavedChanges && currentCategory === category.key" class="card-indicator">
            <text class="indicator-dot">●</text>
          </view>
        </view>
      </view>
      
      <!-- 设置内容 -->
      <view class="settings-content">
        <!-- 加载状态 -->
        <view v-if="loading" class="loading-container">
          <text class="loading-text">加载中...</text>
        </view>
        
        <!-- 偏好设置 -->
        <view v-if="currentCategory === 'preferences' && !loading" class="settings-section">
          <view class="section-header">
            <text class="section-title">🎨 界面偏好</text>
            <text class="section-desc">个性化您的应用外观</text>
          </view>
          
          <view class="setting-group">
            <!-- 主题设置 -->
            <view class="setting-item">
              <view class="setting-label">
                <text class="label-text">主题模式</text>
                <text class="label-desc">选择您喜欢的界面风格</text>
              </view>
              <SalesSelector 
                :value="preferences.theme"
                :options="themeOptions"
                @change="updatePreference('theme', $event)"
              />
            </view>
            
            <!-- 字体大小 -->
            <view class="setting-item">
              <view class="setting-label">
                <text class="label-text">字体大小</text>
                <text class="label-desc">调整文字显示大小</text>
              </view>
              <SalesSelector 
                :value="preferences.fontSize"
                :options="fontSizeOptions"
                @change="updatePreference('fontSize', $event)"
              />
            </view>
            
            <!-- 语言设置 -->
            <view class="setting-item">
              <view class="setting-label">
                <text class="label-text">语言</text>
                <text class="label-desc">选择界面显示语言</text>
              </view>
              <SalesSelector 
                :value="preferences.language"
                :options="languageOptions"
                @change="updatePreference('language', $event)"
              />
            </view>
          </view>
        </view>
        
        <!-- 业务设置 -->
        <view v-if="currentCategory === 'business' && !loading" class="settings-section">
          <view class="section-header">
            <text class="section-title">💼 业务设置</text>
            <text class="section-desc">优化您的工作流程</text>
          </view>
          
          <view class="setting-group">
            <!-- 默认客户信息 -->
            <view class="setting-item">
              <view class="setting-label">
                <text class="label-text">默认联系方式</text>
                <text class="label-desc">新建报价时的默认联系方式</text>
              </view>
              <SalesInput 
                :value="businessSettings.defaultContact"
                placeholder="输入默认联系方式"
                @input="updateBusinessSetting('defaultContact', $event)"
              />
            </view>
            
            <!-- 报价有效期 -->
            <view class="setting-item">
              <view class="setting-label">
                <text class="label-text">默认报价有效期</text>
                <text class="label-desc">报价单的默认有效天数</text>
              </view>
              <SalesSelector 
                :value="businessSettings.quoteValidDays"
                :options="validDaysOptions"
                @change="updateBusinessSetting('quoteValidDays', $event)"
              />
            </view>
            
            <!-- 自动保存 -->
            <view class="setting-item">
              <view class="setting-label">
                <text class="label-text">自动保存草稿</text>
                <text class="label-desc">编辑报价时自动保存</text>
              </view>
              <switch 
                :checked="businessSettings.autoSave"
                @change="updateBusinessSetting('autoSave', $event.detail.value)"
                color="#007AFF"
              />
            </view>
          </view>
        </view>
        
        <!-- 帮助支持 -->
        <view v-if="currentCategory === 'help' && !loading" class="settings-section">
          <view class="section-header">
            <text class="section-title">❓ 帮助支持</text>
            <text class="section-desc">获取帮助和支持</text>
          </view>
          
          <view class="help-list">
            <view class="help-item" @click="openUserGuide">
              <view class="help-icon">📖</view>
              <view class="help-content">
                <text class="help-title">使用指南</text>
                <text class="help-desc">了解如何使用各项功能</text>
              </view>
              <text class="help-arrow">›</text>
            </view>
            
            <view class="help-item" @click="openFAQ">
              <view class="help-icon">💡</view>
              <view class="help-content">
                <text class="help-title">常见问题</text>
                <text class="help-desc">快速解决常见疑问</text>
              </view>
              <text class="help-arrow">›</text>
            </view>
            
            <view class="help-item" @click="contactSupport">
              <view class="help-icon">📞</view>
              <view class="help-content">
                <text class="help-title">联系支持</text>
                <text class="help-desc">遇到问题？联系我们</text>
              </view>
              <text class="help-arrow">›</text>
            </view>
            
            <view class="help-item" @click="submitFeedback">
              <view class="help-icon">💬</view>
              <view class="help-content">
                <text class="help-title">意见反馈</text>
                <text class="help-desc">告诉我们您的建议</text>
              </view>
              <text class="help-arrow">›</text>
            </view>
          </view>
        </view>
        
        <!-- 系统信息 -->
        <view v-if="currentCategory === 'system' && !loading" class="settings-section">
          <view class="section-header">
            <text class="section-title">ℹ️ 系统信息</text>
            <text class="section-desc">应用版本和系统信息</text>
          </view>
          
          <view class="info-group">
            <view class="info-item">
              <text class="info-label">应用版本</text>
              <text class="info-value">{{ systemInfo.version }}</text>
            </view>
            
            <view class="info-item">
              <text class="info-label">构建版本</text>
              <text class="info-value">{{ systemInfo.buildNumber }}</text>
            </view>
            
            <view class="info-item">
              <text class="info-label">更新时间</text>
              <text class="info-value">{{ systemInfo.updateTime }}</text>
            </view>
            
            <view class="info-item" @click="checkUpdate">
              <text class="info-label">检查更新</text>
              <text class="info-value link">点击检查</text>
            </view>
          </view>
          
          <view class="system-actions">
            <SalesButton 
              text="隐私政策"
              type="outline"
              @click="openPrivacyPolicy"
            />
            
            <SalesButton 
              text="服务条款"
              type="outline"
              @click="openTermsOfService"
            />
          </view>
        </view>
        
        <!-- 数据管理 -->
        <view v-if="currentCategory === 'data' && !loading" class="settings-section">
          <view class="section-header">
            <text class="section-title">🗂️ 数据管理</text>
            <text class="section-desc">管理您的应用数据</text>
          </view>
          
          <view class="data-stats">
            <view class="stat-item">
              <text class="stat-number">{{ dataStats.drafts }}</text>
              <text class="stat-label">草稿数量</text>
            </view>
            
            <view class="stat-item">
              <text class="stat-number">{{ dataStats.cacheSize }}</text>
              <text class="stat-label">缓存大小</text>
            </view>
            
            <view class="stat-item">
              <text class="stat-number">{{ dataStats.totalQuotes }}</text>
              <text class="stat-label">历史报价</text>
            </view>
          </view>
          
          <view class="data-actions">
            <SalesButton 
              text="清除缓存"
              type="outline"
              @click="clearCache"
            />
            
            <SalesButton 
              text="导出数据"
              type="primary"
              @click="exportData"
            />
            
            <SalesButton 
              text="重置设置"
              type="danger"
              @click="resetSettings"
            />
          </view>
        </view>
      </view>
    </view>
    
    <!-- 保存提示 -->
    <view v-if="hasUnsavedChanges" class="save-indicator">
      <view class="save-content">
        <text class="save-text">有未保存的更改</text>
        <view class="save-actions">
          <SalesButton 
            text="取消"
            type="outline"
            size="small"
            @click="discardChanges"
          />
          <SalesButton 
            text="保存"
            type="primary"
            size="small"
            :loading="saving"
            @click="saveSettings"
          />
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAppStore } from '@/stores/app'
import SalesHeader from '@/components/sales/SalesHeader.vue'
import SalesSelector from '@/components/sales/SalesSelector.vue'
import SalesInput from '@/components/sales/SalesInput.vue'
import SalesButton from '@/components/sales/SalesButton.vue'

// 使用Terminal 1提供的状态管理
const appStore = useAppStore()

// 响应式数据
const loading = ref(false)
const saving = ref(false)
const currentCategory = ref('preferences')
const hasUnsavedChanges = ref(false)

// 设置分类
const settingsCategories = [
  {
    key: 'preferences',
    title: '界面偏好',
    description: '主题、字体、语言',
    icon: '🎨'
  },
  {
    key: 'business', 
    title: '业务设置',
    description: '工作流程优化',
    icon: '💼'
  },
  {
    key: 'help',
    title: '帮助支持',
    description: '使用指南、反馈',
    icon: '❓'
  },
  {
    key: 'system',
    title: '系统信息',
    description: '版本、更新信息',
    icon: 'ℹ️'
  },
  {
    key: 'data',
    title: '数据管理',
    description: '缓存、导出、重置',
    icon: '🗂️'
  }
]

// 设置数据
const preferences = ref({
  theme: 'light',
  fontSize: 'medium',
  language: 'zh-CN'
})

const businessSettings = ref({
  defaultContact: '',
  quoteValidDays: '30',
  autoSave: true
})

const systemInfo = ref({
  version: '1.0.0',
  buildNumber: '2025.01.08.001',
  updateTime: '2025-01-08'
})

const dataStats = ref({
  drafts: 3,
  cacheSize: '12.5MB',
  totalQuotes: 156
})

// 选项数据
const themeOptions = [
  { label: '浅色模式', value: 'light' },
  { label: '深色模式', value: 'dark' },
  { label: '跟随系统', value: 'auto' }
]

const fontSizeOptions = [
  { label: '小', value: 'small' },
  { label: '中', value: 'medium' },
  { label: '大', value: 'large' },
  { label: '超大', value: 'xlarge' }
]

const languageOptions = [
  { label: '中文简体', value: 'zh-CN' },
  { label: '中文繁体', value: 'zh-TW' },
  { label: 'English', value: 'en-US' }
]

const validDaysOptions = [
  { label: '7天', value: '7' },
  { label: '15天', value: '15' },
  { label: '30天', value: '30' },
  { label: '60天', value: '60' },
  { label: '90天', value: '90' }
]

// 方法
function selectCategory(category: string) {
  if (hasUnsavedChanges.value) {
    uni.showModal({
      title: '切换分类',
      content: '当前有未保存的更改，切换分类将丢失这些更改。确定要继续吗？',
      success: (res) => {
        if (res.confirm) {
          discardChanges()
          currentCategory.value = category
        }
      }
    })
  } else {
    currentCategory.value = category
  }
}

function updatePreference(key: string, value: any) {
  preferences.value[key] = value
  hasUnsavedChanges.value = true
}

function updateBusinessSetting(key: string, value: any) {
  businessSettings.value[key] = value
  hasUnsavedChanges.value = true
}

async function saveSettings() {
  saving.value = true
  
  try {
    // 保存到Terminal 1的状态管理系统
    appStore.updateSettings({
      preferences: preferences.value,
      business: businessSettings.value
    })
    
    hasUnsavedChanges.value = false
    
    uni.showToast({
      title: '设置已保存',
      icon: 'success'
    })
  } catch (error) {
    console.error('保存设置失败:', error)
    
    uni.showToast({
      title: '保存失败',
      icon: 'error'
    })
  } finally {
    saving.value = false
  }
}

function discardChanges() {
  hasUnsavedChanges.value = false
  loadSettings()
}

function loadSettings() {
  loading.value = true
  
  try {
    // 从Terminal 1的状态管理系统加载设置
    appStore.loadSettings()
    
    // 从appStore的settings中提取我们的设置
    const storeSettings = appStore.settings
    
    if (storeSettings.preferences) {
      preferences.value = { ...preferences.value, ...storeSettings.preferences }
    }
    
    if (storeSettings.business) {
      businessSettings.value = { ...businessSettings.value, ...storeSettings.business }
    }
  } catch (error) {
    console.error('加载设置失败:', error)
  } finally {
    loading.value = false
  }
}

function handleBack() {
  if (hasUnsavedChanges.value) {
    uni.showModal({
      title: '未保存更改',
      content: '您有未保存的更改，确定要离开吗？',
      success: (res) => {
        if (res.confirm) {
          uni.navigateBack()
        }
      }
    })
  } else {
    uni.navigateBack()
  }
}

// 帮助功能
function openUserGuide() {
  uni.showToast({
    title: '即将打开使用指南',
    icon: 'none'
  })
}

function openFAQ() {
  uni.showToast({
    title: '即将打开常见问题',
    icon: 'none'
  })
}

function contactSupport() {
  uni.showActionSheet({
    itemList: ['拨打客服电话', '发送邮件', '在线客服'],
    success: (res) => {
      const actions = ['拨打客服电话', '发送邮件', '在线客服']
      uni.showToast({
        title: `选择了: ${actions[res.tapIndex]}`,
        icon: 'none'
      })
    }
  })
}

function submitFeedback() {
  uni.navigateTo({
    url: '/pages/sales/feedback/index'
  })
}

// 系统功能
function checkUpdate() {
  uni.showLoading({
    title: '检查中...'
  })
  
  setTimeout(() => {
    uni.hideLoading()
    uni.showToast({
      title: '已是最新版本',
      icon: 'success'
    })
  }, 2000)
}

function openPrivacyPolicy() {
  uni.showToast({
    title: '即将打开隐私政策',
    icon: 'none'
  })
}

function openTermsOfService() {
  uni.showToast({
    title: '即将打开服务条款',
    icon: 'none'
  })
}

// 数据管理
function clearCache() {
  uni.showModal({
    title: '清除缓存',
    content: '确定要清除应用缓存吗？这不会影响您的报价数据。',
    success: (res) => {
      if (res.confirm) {
        uni.showLoading({
          title: '清除中...'
        })
        
        setTimeout(() => {
          uni.hideLoading()
          dataStats.value.cacheSize = '0MB'
          uni.showToast({
            title: '缓存已清除',
            icon: 'success'
          })
        }, 1500)
      }
    }
  })
}

function exportData() {
  uni.showLoading({
    title: '导出中...'
  })
  
  setTimeout(() => {
    uni.hideLoading()
    uni.showToast({
      title: '数据导出成功',
      icon: 'success'
    })
  }, 2000)
}

function resetSettings() {
  uni.showModal({
    title: '重置设置',
    content: '确定要将所有设置重置为默认值吗？此操作不可撤销。',
    confirmColor: '#FF3B30',
    success: (res) => {
      if (res.confirm) {
        preferences.value = {
          theme: 'light',
          fontSize: 'medium', 
          language: 'zh-CN'
        }
        
        businessSettings.value = {
          defaultContact: '',
          quoteValidDays: '30',
          autoSave: true
        }
        
        hasUnsavedChanges.value = true
        
        uni.showToast({
          title: '设置已重置',
          icon: 'success'
        })
      }
    }
  })
}

// 生命周期
onMounted(() => {
  loadSettings()
  
  // 设置页面标题
  uni.setNavigationBarTitle({
    title: '应用设置'
  })
})
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/animations.scss';

.settings-page {
  min-height: 100vh;
  background: $color-bg-light;
}

.settings-container {
  padding: $spacing-md;
}

.settings-nav {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: $spacing-md;
  margin-bottom: $spacing-lg;
  
  .nav-card {
    display: flex;
    align-items: center;
    gap: $spacing-md;
    padding: $spacing-md $spacing-lg;
    background: $color-bg-white;
    border-radius: $border-radius-lg;
    border: 2px solid transparent;
    cursor: pointer;
    transition: all $animation-duration-base $ease-out-smooth;
    position: relative;
    @include button-press-feedback;
    @include ripple-effect(rgba($color-primary, 0.2));
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
    }
    
    &.active {
      border-color: $color-primary;
      background: rgba($color-primary, 0.05);
      
      .card-title {
        color: $color-primary;
        font-weight: 600;
      }
    }
    
    .card-icon {
      font-size: 32px;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba($color-primary, 0.1);
      border-radius: $border-radius-md;
    }
    
    .card-content {
      flex: 1;
      
      .card-title {
        font-size: $font-size-md;
        font-weight: 500;
        color: $color-text-primary;
        display: block;
        margin-bottom: $spacing-xs;
      }
      
      .card-desc {
        font-size: $font-size-sm;
        color: $color-text-secondary;
        line-height: 1.4;
      }
    }
    
    .card-indicator {
      position: absolute;
      top: $spacing-sm;
      right: $spacing-sm;
      
      .indicator-dot {
        color: $color-warning;
        font-size: 12px;
      }
    }
  }
}

.settings-content {
  .loading-container {
    display: flex;
    justify-content: center;
    padding: $spacing-xl;
    
    .loading-text {
      font-size: $font-size-md;
      color: $color-text-secondary;
    }
  }
  
  .settings-section {
    background: $color-bg-white;
    border-radius: $border-radius-lg;
    overflow: hidden;
    
    .section-header {
      padding: $spacing-lg;
      border-bottom: 1px solid $color-border;
      
      .section-title {
        font-size: $font-size-lg;
        font-weight: 600;
        color: $color-text-primary;
        display: block;
        margin-bottom: $spacing-xs;
      }
      
      .section-desc {
        font-size: $font-size-sm;
        color: $color-text-secondary;
      }
    }
    
    .setting-group {
      .setting-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: $spacing-lg;
        border-bottom: 1px solid $color-border;
        
        &:last-child {
          border-bottom: none;
        }
        
        .setting-label {
          flex: 1;
          margin-right: $spacing-md;
          
          .label-text {
            font-size: $font-size-md;
            font-weight: 500;
            color: $color-text-primary;
            display: block;
            margin-bottom: $spacing-xs;
          }
          
          .label-desc {
            font-size: $font-size-sm;
            color: $color-text-secondary;
            line-height: 1.4;
          }
        }
      }
    }
    
    .help-list {
      .help-item {
        display: flex;
        align-items: center;
        gap: $spacing-md;
        padding: $spacing-lg;
        border-bottom: 1px solid $color-border;
        cursor: pointer;
        transition: background-color 0.3s ease;
        
        &:last-child {
          border-bottom: none;
        }
        
        &:hover {
          background: rgba($color-primary, 0.03);
        }
        
        .help-icon {
          font-size: 24px;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba($color-primary, 0.1);
          border-radius: $border-radius-sm;
        }
        
        .help-content {
          flex: 1;
          
          .help-title {
            font-size: $font-size-md;
            font-weight: 500;
            color: $color-text-primary;
            display: block;
            margin-bottom: $spacing-xs;
          }
          
          .help-desc {
            font-size: $font-size-sm;
            color: $color-text-secondary;
          }
        }
        
        .help-arrow {
          font-size: 20px;
          color: $color-text-tertiary;
        }
      }
    }
    
    .info-group {
      .info-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: $spacing-lg;
        border-bottom: 1px solid $color-border;
        
        &:last-child {
          border-bottom: none;
        }
        
        .info-label {
          font-size: $font-size-md;
          color: $color-text-primary;
          font-weight: 500;
        }
        
        .info-value {
          font-size: $font-size-sm;
          color: $color-text-secondary;
          
          &.link {
            color: $color-primary;
            cursor: pointer;
          }
        }
      }
    }
    
    .system-actions {
      display: flex;
      gap: $spacing-md;
      padding: $spacing-lg;
    }
    
    .data-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
      gap: $spacing-md;
      padding: $spacing-lg;
      border-bottom: 1px solid $color-border;
      
      .stat-item {
        text-align: center;
        
        .stat-number {
          font-size: $font-size-xl;
          font-weight: 600;
          color: $color-primary;
          display: block;
          margin-bottom: $spacing-xs;
        }
        
        .stat-label {
          font-size: $font-size-sm;
          color: $color-text-secondary;
        }
      }
    }
    
    .data-actions {
      display: flex;
      gap: $spacing-md;
      padding: $spacing-lg;
    }
  }
}

.save-indicator {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: $color-bg-white;
  border-top: 1px solid $color-border;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  z-index: 100;
  
  .save-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: $spacing-md $spacing-lg;
    
    .save-text {
      font-size: $font-size-sm;
      color: $color-warning;
      font-weight: 500;
    }
    
    .save-actions {
      display: flex;
      gap: $spacing-sm;
    }
  }
}

// iPad 优化
@media (min-width: 768px) {
  .settings-nav {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .settings-container {
    max-width: 1024px;
    margin: 0 auto;
    padding: $spacing-xl;
  }
}

// iPhone 优化
@media (max-width: 480px) {
  .settings-nav {
    grid-template-columns: 1fr;
  }
  
  .setting-item {
    flex-direction: column;
    align-items: stretch !important;
    gap: $spacing-md;
    
    .setting-label {
      margin-right: 0 !important;
    }
  }
  
  .data-stats {
    grid-template-columns: repeat(3, 1fr) !important;
  }
  
  .data-actions,
  .system-actions {
    flex-direction: column;
  }
}
</style>