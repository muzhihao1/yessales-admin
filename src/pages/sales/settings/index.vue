<template>
  <view class="settings-page">
    <!-- Header -->
    <SalesHeader title="应用设置" :show-back="true" @back="handleBack" />

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
                :model-value="preferences.theme"
                :options="themeOptions"
                @update:model-value="updatePreference('theme', $event)"
              />
            </view>

            <!-- 字体大小 -->
            <view class="setting-item">
              <view class="setting-label">
                <text class="label-text">字体大小</text>
                <text class="label-desc">调整文字显示大小</text>
              </view>
              <SalesSelector
                :model-value="preferences.fontSize"
                :options="fontSizeOptions"
                @update:model-value="updatePreference('fontSize', $event)"
              />
            </view>

            <!-- 语言设置 -->
            <view class="setting-item">
              <view class="setting-label">
                <text class="label-text">语言</text>
                <text class="label-desc">选择界面显示语言</text>
              </view>
              <SalesSelector
                :model-value="preferences.language"
                :options="languageOptions"
                @update:model-value="updatePreference('language', $event)"
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
                :model-value="businessSettings.contactInfo"
                placeholder="输入默认联系方式"
                @update:model-value="updateBusinessSetting('contactInfo', $event)"
              />
            </view>

            <!-- 报价有效期 -->
            <view class="setting-item">
              <view class="setting-label">
                <text class="label-text">默认报价有效期</text>
                <text class="label-desc">报价单的默认有效天数</text>
              </view>
              <SalesSelector
                :model-value="String(businessSettings.quotationValidDays)"
                :options="validDaysOptions"
                @update:model-value="updateBusinessSetting('quotationValidDays', Number($event))"
              />
            </view>

            <!-- 自动保存 -->
            <view class="setting-item">
              <view class="setting-label">
                <text class="label-text">自动保存草稿</text>
                <text class="label-desc">编辑报价时自动保存</text>
              </view>
              <switch
                :checked="preferences.autoSave || false"
                @change="updatePreference('autoSave', ($event.target as HTMLInputElement).checked)"
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
            <SalesButton text="隐私政策" type="default" @click="openPrivacyPolicy" />

            <SalesButton text="服务条款" type="default" @click="openTermsOfService" />
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
            <SalesButton text="清除缓存" type="default" @click="clearCache" />

            <SalesButton text="导出数据" type="primary" @click="exportData" />

            <SalesButton text="重置设置" type="danger" @click="resetSettings" />
          </view>
        </view>
      </view>
    </view>

    <!-- 保存提示 -->
    <view v-if="hasUnsavedChanges" class="save-indicator">
      <view class="save-content">
        <text class="save-text">有未保存的更改</text>
        <view class="save-actions">
          <SalesButton text="取消" type="default" size="small" @click="discardChanges" />
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
import { computed, onMounted, ref } from 'vue'
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
  language: 'zh-CN',
  timezone: 'Asia/Shanghai',
  dateFormat: 'YYYY-MM-DD',
  currency: 'CNY',
  autoSave: true
})

const businessSettings = ref({
  companyName: '耶氏台球斗南销售中心',
  contactInfo: '',
  defaultTaxRate: 0.13,
  quotationValidDays: 30
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
    const confirmSwitch = confirm('切换分类\n当前有未保存的更改，切换分类将丢失这些更改。确定要继续吗？')
    if (confirmSwitch) {
      discardChanges()
      currentCategory.value = category
    }
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

    console.log('设置已保存')
    alert('设置已保存')
  } catch (error) {
    console.error('保存设置失败:', error)

    console.error('保存失败')
    alert('保存失败')
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
    const confirmLeave = confirm('未保存更改\n您有未保存的更改，确定要离开吗？')
    if (confirmLeave) {
      window.history.back()
    }
  } else {
    window.history.back()
  }
}

// 帮助功能
function openUserGuide() {
  console.log('即将打开使用指南')
  alert('即将打开使用指南')
}

function openFAQ() {
  console.log('即将打开常见问题')
  alert('即将打开常见问题')
}

function contactSupport() {
  const options = ['拨打客服电话', '发送邮件', '在线客服']
  const choice = confirm(`联系客服\n\n选择方式：\n1. ${options[0]}\n2. ${options[1]}\n3. ${options[2]}\n\n点击确定选择第一个选项`)
  if (choice) {
    console.log(`选择了: ${options[0]}`)
    alert(`选择了: ${options[0]}`)
  }
}

function submitFeedback() {
  window.location.href = '/pages/sales/feedback/index'
}

// 系统功能
function checkUpdate() {
  console.log('检查中...')
  alert('正在检查更新...')

  setTimeout(() => {
    console.log('已是最新版本')
    alert('已是最新版本')
  }, 2000)
}

function openPrivacyPolicy() {
  console.log('即将打开隐私政策')
  alert('即将打开隐私政策')
}

function openTermsOfService() {
  console.log('即将打开服务条款')
  alert('即将打开服务条款')
}

// 数据管理
function clearCache() {
  const confirmClear = confirm('清除缓存\n确定要清除应用缓存吗？这不会影响您的报价数据。')
  if (confirmClear) {
    console.log('清除中...')
    alert('正在清除缓存...')

    setTimeout(() => {
      dataStats.value.cacheSize = '0MB'
      console.log('缓存已清除')
      alert('缓存已清除')
    }, 1500)
  }
}

function exportData() {
  console.log('导出中...')
  alert('正在导出数据...')

  setTimeout(() => {
    console.log('数据导出完成')
    alert('数据导出完成')
  }, 2000)
}

function resetSettings() {
  const confirmReset = confirm('重置设置\n确定要将所有设置重置为默认值吗？此操作不可撤销。')
  if (confirmReset) {
    preferences.value = {
      theme: 'light',
      fontSize: 'medium',
      language: 'zh-CN',
      timezone: 'Asia/Shanghai',
      dateFormat: 'YYYY-MM-DD',
      currency: 'CNY',
      autoSave: true
    }

    businessSettings.value = {
      companyName: '耶氏台球斗南销售中心',
      contactInfo: '',
      defaultTaxRate: 0.13,
      quotationValidDays: 30
    }

    hasUnsavedChanges.value = true

    console.log('设置已重置')
    alert('设置已重置')
  }
}

// 生命周期
onMounted(() => {
  loadSettings()

  // 设置页面标题 (在网页中不需要)
  document.title = '应用设置'
})
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/animations.scss';

.settings-page {
  min-height: 100vh;
  background: $bg-color;
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
    background: $bg-color-white;
    border-radius: $border-radius-lg;
    border: 2px solid transparent;
    cursor: pointer;
    transition: all $animation-duration-base $ease-out-smooth;
    position: relative;
    @include button-press-feedback;
    @include ripple-effect(rgba($primary-color, 0.2));

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
    }

    &.active {
      border-color: $primary-color;
      background: rgba($primary-color, 0.05);

      .card-title {
        color: $primary-color;
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
      background: rgba($primary-color, 0.1);
      border-radius: $border-radius-base;
    }

    .card-content {
      flex: 1;

      .card-title {
        font-size: $font-size-medium;
        font-weight: 500;
        color: $text-color;
        display: block;
        margin-bottom: $spacing-xs;
      }

      .card-desc {
        font-size: $font-size-small;
        color: $text-color-secondary;
        line-height: 1.4;
      }
    }

    .card-indicator {
      position: absolute;
      top: $spacing-sm;
      right: $spacing-sm;

      .indicator-dot {
        color: $warning-color;
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
      font-size: $font-size-medium;
      color: $text-color-secondary;
    }
  }

  .settings-section {
    background: $bg-color-white;
    border-radius: $border-radius-lg;
    overflow: hidden;

    .section-header {
      padding: $spacing-lg;
      border-bottom: 1px solid $border-color;

      .section-title {
        font-size: $font-size-large;
        font-weight: 600;
        color: $text-color;
        display: block;
        margin-bottom: $spacing-xs;
      }

      .section-desc {
        font-size: $font-size-small;
        color: $text-color-secondary;
      }
    }

    .setting-group {
      .setting-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: $spacing-lg;
        border-bottom: 1px solid $border-color;

        &:last-child {
          border-bottom: none;
        }

        .setting-label {
          flex: 1;
          margin-right: $spacing-md;

          .label-text {
            font-size: $font-size-medium;
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
      }
    }

    .help-list {
      .help-item {
        display: flex;
        align-items: center;
        gap: $spacing-md;
        padding: $spacing-lg;
        border-bottom: 1px solid $border-color;
        cursor: pointer;
        transition: background-color 0.3s ease;

        &:last-child {
          border-bottom: none;
        }

        &:hover {
          background: rgba($primary-color, 0.03);
        }

        .help-icon {
          font-size: 24px;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba($primary-color, 0.1);
          border-radius: $border-radius-sm;
        }

        .help-content {
          flex: 1;

          .help-title {
            font-size: $font-size-medium;
            font-weight: 500;
            color: $text-color;
            display: block;
            margin-bottom: $spacing-xs;
          }

          .help-desc {
            font-size: $font-size-small;
            color: $text-color-secondary;
          }
        }

        .help-arrow {
          font-size: 20px;
          color: $text-color-placeholder;
        }
      }
    }

    .info-group {
      .info-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: $spacing-lg;
        border-bottom: 1px solid $border-color;

        &:last-child {
          border-bottom: none;
        }

        .info-label {
          font-size: $font-size-medium;
          color: $text-color;
          font-weight: 500;
        }

        .info-value {
          font-size: $font-size-small;
          color: $text-color-secondary;

          &.link {
            color: $primary-color;
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
      border-bottom: 1px solid $border-color;

      .stat-item {
        text-align: center;

        .stat-number {
          font-size: $font-size-extra-large;
          font-weight: 600;
          color: $primary-color;
          display: block;
          margin-bottom: $spacing-xs;
        }

        .stat-label {
          font-size: $font-size-small;
          color: $text-color-secondary;
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
  background: $bg-color-white;
  border-top: 1px solid $border-color;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  z-index: 100;

  .save-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: $spacing-md $spacing-lg;

    .save-text {
      font-size: $font-size-small;
      color: $warning-color;
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
