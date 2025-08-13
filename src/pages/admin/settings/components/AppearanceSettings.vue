<template>
  <view class="appearance-settings">
    <view class="settings-section">
      <view class="section-header">
        <text class="section-title">外观设置</text>
        <text class="section-description">自定义系统界面外观和用户体验</text>
      </view>

      <uni-forms ref="formRef" :model="formData" :rules="rules" validate-trigger="onChange">
        <!-- 主题设置 -->
        <view class="form-group">
          <text class="group-title">主题配置</text>

          <uni-forms-item label="默认主题" name="defaultTheme">
            <uni-data-picker
              v-model="formData.defaultTheme"
              :localdata="themeOptions"
              placeholder="选择默认主题"
              @change="handlePickerChange('defaultTheme', $event)"
            />
          </uni-forms-item>

          <uni-forms-item label="允许用户切换主题" name="allowThemeSwitching">
            <switch
              :checked="formData.allowThemeSwitching"
              @change="handleSwitchChange('allowThemeSwitching', $event)"
            />
          </uni-forms-item>

          <uni-forms-item label="主品牌色" name="primaryColor">
            <view class="color-picker-container">
              <input
                type="color"
                :value="formData.primaryColor"
                @input="handleColorChange('primaryColor', $event)"
                class="color-picker"
              />
              <uni-easyinput
                v-model="formData.primaryColor"
                placeholder="#007AFF"
                :clearable="true"
                @input="handleInputChange('primaryColor', $event)"
                class="color-input"
              />
            </view>
          </uni-forms-item>

          <uni-forms-item label="辅助品牌色" name="secondaryColor">
            <view class="color-picker-container">
              <input
                type="color"
                :value="formData.secondaryColor"
                @input="handleColorChange('secondaryColor', $event)"
                class="color-picker"
              />
              <uni-easyinput
                v-model="formData.secondaryColor"
                placeholder="#34C759"
                :clearable="true"
                @input="handleInputChange('secondaryColor', $event)"
                class="color-input"
              />
            </view>
          </uni-forms-item>

          <uni-forms-item label="成功色" name="successColor">
            <view class="color-picker-container">
              <input
                type="color"
                :value="formData.successColor"
                @input="handleColorChange('successColor', $event)"
                class="color-picker"
              />
              <uni-easyinput
                v-model="formData.successColor"
                placeholder="#52c41a"
                :clearable="true"
                @input="handleInputChange('successColor', $event)"
                class="color-input"
              />
            </view>
          </uni-forms-item>

          <uni-forms-item label="警告色" name="warningColor">
            <view class="color-picker-container">
              <input
                type="color"
                :value="formData.warningColor"
                @input="handleColorChange('warningColor', $event)"
                class="color-picker"
              />
              <uni-easyinput
                v-model="formData.warningColor"
                placeholder="#faad14"
                :clearable="true"
                @input="handleInputChange('warningColor', $event)"
                class="color-input"
              />
            </view>
          </uni-forms-item>

          <uni-forms-item label="错误色" name="errorColor">
            <view class="color-picker-container">
              <input
                type="color"
                :value="formData.errorColor"
                @input="handleColorChange('errorColor', $event)"
                class="color-picker"
              />
              <uni-easyinput
                v-model="formData.errorColor"
                placeholder="#ff4d4f"
                :clearable="true"
                @input="handleInputChange('errorColor', $event)"
                class="color-input"
              />
            </view>
          </uni-forms-item>
        </view>

        <!-- 品牌标识 -->
        <view class="form-group">
          <text class="group-title">品牌标识</text>

          <uni-forms-item label="系统Logo" name="systemLogo">
            <view class="logo-upload-container">
              <uni-file-picker
                v-model="formData.systemLogo"
                file-mediatype="image"
                mode="grid"
                :limit="1"
                :image-styles="{ width: '100px', height: '100px' }"
                @select="handleFileSelect('systemLogo', $event)"
                @delete="handleFileDelete('systemLogo')"
              />
              <text class="upload-hint">建议尺寸：200x60px，支持PNG、JPG格式</text>
            </view>
          </uni-forms-item>

          <uni-forms-item label="登录页Logo" name="loginLogo">
            <view class="logo-upload-container">
              <uni-file-picker
                v-model="formData.loginLogo"
                file-mediatype="image"
                mode="grid"
                :limit="1"
                :image-styles="{ width: '100px', height: '100px' }"
                @select="handleFileSelect('loginLogo', $event)"
                @delete="handleFileDelete('loginLogo')"
              />
              <text class="upload-hint">建议尺寸：300x100px，支持PNG、JPG格式</text>
            </view>
          </uni-forms-item>

          <uni-forms-item label="网站图标(Favicon)" name="favicon">
            <view class="logo-upload-container">
              <uni-file-picker
                v-model="formData.favicon"
                file-mediatype="image"
                mode="grid"
                :limit="1"
                :image-styles="{ width: '50px', height: '50px' }"
                @select="handleFileSelect('favicon', $event)"
                @delete="handleFileDelete('favicon')"
              />
              <text class="upload-hint">建议尺寸：32x32px或16x16px，ICO或PNG格式</text>
            </view>
          </uni-forms-item>

          <uni-forms-item label="品牌名称" name="brandName">
            <uni-easyinput
              v-model="formData.brandName"
              placeholder="请输入品牌名称"
              :clearable="true"
              @input="handleInputChange('brandName', $event)"
            />
          </uni-forms-item>

          <uni-forms-item label="品牌标语" name="brandSlogan">
            <uni-easyinput
              v-model="formData.brandSlogan"
              placeholder="请输入品牌标语"
              :clearable="true"
              @input="handleInputChange('brandSlogan', $event)"
            />
          </uni-forms-item>
        </view>

        <!-- 布局设置 -->
        <view class="form-group">
          <text class="group-title">布局配置</text>

          <uni-forms-item label="侧边栏样式" name="sidebarStyle">
            <uni-data-picker
              v-model="formData.sidebarStyle"
              :localdata="sidebarStyleOptions"
              placeholder="选择侧边栏样式"
              @change="handlePickerChange('sidebarStyle', $event)"
            />
          </uni-forms-item>

          <uni-forms-item label="导航栏位置" name="navbarPosition">
            <uni-data-picker
              v-model="formData.navbarPosition"
              :localdata="navbarPositionOptions"
              placeholder="选择导航栏位置"
              @change="handlePickerChange('navbarPosition', $event)"
            />
          </uni-forms-item>

          <uni-forms-item label="面包屑导航" name="enableBreadcrumb">
            <switch
              :checked="formData.enableBreadcrumb"
              @change="handleSwitchChange('enableBreadcrumb', $event)"
            />
          </uni-forms-item>

          <uni-forms-item label="页脚信息" name="showFooter">
            <switch
              :checked="formData.showFooter"
              @change="handleSwitchChange('showFooter', $event)"
            />
          </uni-forms-item>

          <uni-forms-item label="紧凑模式" name="compactMode">
            <switch
              :checked="formData.compactMode"
              @change="handleSwitchChange('compactMode', $event)"
            />
            <text class="field-hint">减少界面元素间距，显示更多内容</text>
          </uni-forms-item>
        </view>

        <!-- 字体设置 -->
        <view class="form-group">
          <text class="group-title">字体配置</text>

          <uni-forms-item label="默认字体大小" name="defaultFontSize">
            <uni-data-picker
              v-model="formData.defaultFontSize"
              :localdata="fontSizeOptions"
              placeholder="选择字体大小"
              @change="handlePickerChange('defaultFontSize', $event)"
            />
          </uni-forms-item>

          <uni-forms-item label="字体族" name="fontFamily">
            <uni-data-picker
              v-model="formData.fontFamily"
              :localdata="fontFamilyOptions"
              placeholder="选择字体族"
              @change="handlePickerChange('fontFamily', $event)"
            />
          </uni-forms-item>

          <uni-forms-item label="行高" name="lineHeight">
            <uni-data-picker
              v-model="formData.lineHeight"
              :localdata="lineHeightOptions"
              placeholder="选择行高"
              @change="handlePickerChange('lineHeight', $event)"
            />
          </uni-forms-item>

          <uni-forms-item label="字体抗锯齿" name="fontSmoothing">
            <switch
              :checked="formData.fontSmoothing"
              @change="handleSwitchChange('fontSmoothing', $event)"
            />
          </uni-forms-item>
        </view>

        <!-- 动画设置 -->
        <view class="form-group">
          <text class="group-title">动画效果</text>

          <uni-forms-item label="启用页面切换动画" name="enablePageTransition">
            <switch
              :checked="formData.enablePageTransition"
              @change="handleSwitchChange('enablePageTransition', $event)"
            />
          </uni-forms-item>

          <uni-forms-item label="启用元素动画" name="enableElementAnimation">
            <switch
              :checked="formData.enableElementAnimation"
              @change="handleSwitchChange('enableElementAnimation', $event)"
            />
          </uni-forms-item>

          <uni-forms-item label="动画速度" name="animationSpeed">
            <uni-data-picker
              v-model="formData.animationSpeed"
              :localdata="animationSpeedOptions"
              placeholder="选择动画速度"
              @change="handlePickerChange('animationSpeed', $event)"
            />
          </uni-forms-item>

          <uni-forms-item label="减少动画(可访问性)" name="reduceMotion">
            <switch
              :checked="formData.reduceMotion"
              @change="handleSwitchChange('reduceMotion', $event)"
            />
            <text class="field-hint">为动作敏感用户减少动画效果</text>
          </uni-forms-item>
        </view>

        <!-- 自定义CSS -->
        <view class="form-group">
          <text class="group-title">高级自定义</text>

          <uni-forms-item label="启用自定义CSS" name="enableCustomCss">
            <switch
              :checked="formData.enableCustomCss"
              @change="handleSwitchChange('enableCustomCss', $event)"
            />
          </uni-forms-item>

          <uni-forms-item label="自定义CSS代码" name="customCss" v-if="formData.enableCustomCss">
            <uni-easyinput
              v-model="formData.customCss"
              type="textarea"
              placeholder="请输入自定义CSS代码"
              :auto-height="true"
              maxlength="5000"
              @input="handleInputChange('customCss', $event)"
            />
            <text class="field-hint">请谨慎使用，错误的CSS可能影响系统正常显示</text>
          </uni-forms-item>

          <uni-forms-item label="启用自定义JS" name="enableCustomJs">
            <switch
              :checked="formData.enableCustomJs"
              @change="handleSwitchChange('enableCustomJs', $event)"
            />
          </uni-forms-item>

          <uni-forms-item
            label="自定义JavaScript代码"
            name="customJs"
            v-if="formData.enableCustomJs"
          >
            <uni-easyinput
              v-model="formData.customJs"
              type="textarea"
              placeholder="请输入自定义JavaScript代码"
              :auto-height="true"
              maxlength="5000"
              @input="handleInputChange('customJs', $event)"
            />
            <text class="field-hint">请谨慎使用，错误的JS可能影响系统功能</text>
          </uni-forms-item>
        </view>
      </uni-forms>
    </view>

    <!-- 预览区域 -->
    <view class="preview-section">
      <view class="section-header">
        <text class="section-title">样式预览</text>
        <text class="section-description">预览当前主题配置效果</text>
      </view>
      <view class="preview-content" :style="previewStyles">
        <view class="preview-header">
          <text class="preview-brand">{{ formData.brandName || '销售系统' }}</text>
          <text class="preview-slogan">{{ formData.brandSlogan || '高效管理，智能销售' }}</text>
        </view>
        <view class="preview-body">
          <view class="preview-card">
            <text class="card-title">示例卡片标题</text>
            <text class="card-content"
              >这是一段示例内容，用于展示当前主题的文字样式和颜色配置效果。</text
            >
            <view class="card-actions">
              <button class="btn-primary">主要按钮</button>
              <button class="btn-secondary">次要按钮</button>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 操作按钮 -->
    <view class="actions">
      <button class="btn-secondary" @click="handleReset">重置</button>
      <button class="btn-secondary" @click="handlePreviewReset">重置预览</button>
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
 * 外观设置组件
 *
 * 功能说明：
 * - 配置系统主题和颜色方案
 * - 管理品牌标识和Logo上传
 * - 设置界面布局和导航样式
 * - 配置字体样式和大小
 * - 控制动画效果和性能选项
 * - 支持自定义CSS和JavaScript
 * - 提供实时预览功能
 *
 * 用户体验：
 * - 直观的颜色选择器
 * - 实时预览配置效果
 * - 响应式设计适配
 * - 可访问性选项支持
 *
 * @author Terminal 3 (Admin Frontend Team)
 */

interface AppearanceSettingsForm {
  // 主题设置
  defaultTheme: string
  allowThemeSwitching: boolean
  primaryColor: string
  secondaryColor: string
  successColor: string
  warningColor: string
  errorColor: string

  // 品牌标识
  systemLogo: string
  loginLogo: string
  favicon: string
  brandName: string
  brandSlogan: string

  // 布局设置
  sidebarStyle: string
  navbarPosition: string
  enableBreadcrumb: boolean
  showFooter: boolean
  compactMode: boolean

  // 字体设置
  defaultFontSize: string
  fontFamily: string
  lineHeight: string
  fontSmoothing: boolean

  // 动画设置
  enablePageTransition: boolean
  enableElementAnimation: boolean
  animationSpeed: string
  reduceMotion: boolean

  // 自定义样式
  enableCustomCss: boolean
  customCss: string
  enableCustomJs: boolean
  customJs: string
}

const settingsStore = useSettingsStore()

// 表单引用和状态
const formRef = ref()
const loading = ref(false)
const originalData = ref<AppearanceSettingsForm>({} as AppearanceSettingsForm)

// 表单数据
const formData = ref<AppearanceSettingsForm>({
  // 主题设置
  defaultTheme: 'light',
  allowThemeSwitching: true,
  primaryColor: '#007AFF',
  secondaryColor: '#34C759',
  successColor: '#52c41a',
  warningColor: '#faad14',
  errorColor: '#ff4d4f',

  // 品牌标识
  systemLogo: '',
  loginLogo: '',
  favicon: '',
  brandName: '销售系统',
  brandSlogan: '高效管理，智能销售',

  // 布局设置
  sidebarStyle: 'fixed',
  navbarPosition: 'top',
  enableBreadcrumb: true,
  showFooter: true,
  compactMode: false,

  // 字体设置
  defaultFontSize: 'medium',
  fontFamily: 'system-ui',
  lineHeight: 'normal',
  fontSmoothing: true,

  // 动画设置
  enablePageTransition: true,
  enableElementAnimation: true,
  animationSpeed: 'normal',
  reduceMotion: false,

  // 自定义样式
  enableCustomCss: false,
  customCss: '',
  enableCustomJs: false,
  customJs: ''
})

// 选项数据
const themeOptions = [
  { value: 'light', text: '浅色主题' },
  { value: 'dark', text: '深色主题' },
  { value: 'auto', text: '跟随系统' }
]

const sidebarStyleOptions = [
  { value: 'fixed', text: '固定侧边栏' },
  { value: 'collapsible', text: '可收缩侧边栏' },
  { value: 'overlay', text: '覆盖式侧边栏' }
]

const navbarPositionOptions = [
  { value: 'top', text: '顶部导航' },
  { value: 'left', text: '左侧导航' },
  { value: 'both', text: '双重导航' }
]

const fontSizeOptions = [
  { value: 'small', text: '小号 (12px)' },
  { value: 'medium', text: '中号 (14px)' },
  { value: 'large', text: '大号 (16px)' },
  { value: 'extra-large', text: '超大 (18px)' }
]

const fontFamilyOptions = [
  { value: 'system-ui', text: '系统默认' },
  { value: 'helvetica', text: 'Helvetica' },
  { value: 'arial', text: 'Arial' },
  { value: 'noto-sans', text: 'Noto Sans CJK' }
]

const lineHeightOptions = [
  { value: 'tight', text: '紧凑 (1.2)' },
  { value: 'normal', text: '标准 (1.5)' },
  { value: 'loose', text: '宽松 (1.8)' }
]

const animationSpeedOptions = [
  { value: 'fast', text: '快速 (0.15s)' },
  { value: 'normal', text: '标准 (0.3s)' },
  { value: 'slow', text: '慢速 (0.5s)' }
]

// 表单验证规则
const rules = {
  primaryColor: {
    rules: [{ pattern: /^#[0-9A-Fa-f]{6}$/, errorMessage: '请输入正确的颜色值格式 (#RRGGBB)' }]
  },
  secondaryColor: {
    rules: [{ pattern: /^#[0-9A-Fa-f]{6}$/, errorMessage: '请输入正确的颜色值格式 (#RRGGBB)' }]
  }
}

// 计算属性
const hasChanges = computed(() => {
  return JSON.stringify(formData.value) !== JSON.stringify(originalData.value)
})

const previewStyles = computed(() => {
  return {
    '--primary-color': formData.value.primaryColor,
    '--secondary-color': formData.value.secondaryColor,
    '--success-color': formData.value.successColor,
    '--warning-color': formData.value.warningColor,
    '--error-color': formData.value.errorColor,
    '--font-family': getFontFamilyValue(formData.value.fontFamily),
    '--font-size': getFontSizeValue(formData.value.defaultFontSize),
    '--line-height': getLineHeightValue(formData.value.lineHeight)
  }
})

// 辅助函数
const getFontFamilyValue = (value: string) => {
  const fontFamilyMap: Record<string, string> = {
    'system-ui': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    helvetica: '"Helvetica Neue", Helvetica, Arial, sans-serif',
    arial: 'Arial, sans-serif',
    'noto-sans': '"Noto Sans CJK SC", sans-serif'
  }
  return fontFamilyMap[value] || fontFamilyMap['system-ui']
}

const getFontSizeValue = (value: string) => {
  const fontSizeMap: Record<string, string> = {
    small: '12px',
    medium: '14px',
    large: '16px',
    'extra-large': '18px'
  }
  return fontSizeMap[value] || fontSizeMap['medium']
}

const getLineHeightValue = (value: string) => {
  const lineHeightMap: Record<string, string> = {
    tight: '1.2',
    normal: '1.5',
    loose: '1.8'
  }
  return lineHeightMap[value] || lineHeightMap['normal']
}

// 事件处理
const handleInputChange = (field: keyof AppearanceSettingsForm, value: any) => {
  ;(formData.value as any)[field] = value
}

const handlePickerChange = (field: keyof AppearanceSettingsForm, event: any) => {
  ;(formData.value as any)[field] = event.detail.value
}

const handleSwitchChange = (field: keyof AppearanceSettingsForm, event: any) => {
  ;(formData.value as any)[field] = event.detail.value
}

const handleColorChange = (field: keyof AppearanceSettingsForm, event: any) => {
  ;(formData.value as any)[field] = event.target.value
}

const handleFileSelect = (field: keyof AppearanceSettingsForm, event: any) => {
  if (event.tempFiles && event.tempFiles.length > 0) {
    ;(formData.value as any)[field] = event.tempFiles[0].path
  }
}

const handleFileDelete = (field: keyof AppearanceSettingsForm) => {
  ;(formData.value as any)[field] = ''
}

const handleReset = async () => {
  const result = await showModal({
    title: '确认重置',
    content: '确定要重置所有外观设置吗？未保存的更改将丢失。'
  })

  if (result.confirm) {
    formData.value = { ...originalData.value }
    showToast('已重置到上次保存的状态')
  }
}

const handlePreviewReset = () => {
  // 重置预览样式到默认值
  const defaultStyles = {
    defaultTheme: 'light',
    primaryColor: '#007AFF',
    secondaryColor: '#34C759',
    successColor: '#52c41a',
    warningColor: '#faad14',
    errorColor: '#ff4d4f',
    fontFamily: 'system-ui',
    defaultFontSize: 'medium',
    lineHeight: 'normal'
  }

  Object.assign(formData.value, defaultStyles)
  showToast('预览已重置为默认样式')
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
    const settings: Partial<SystemSettings>[] = Object.entries(formData.value).map(
      ([key, value]) => ({
        category: 'appearance' as const,
        key,
        value,
        type: typeof value === 'boolean' ? 'boolean' : 'string'
      })
    )

    // 保存设置 - 转换数组格式为Record格式
    const updates: Record<string, any> = {}
    settings.forEach(setting => {
      updates[setting.key] = setting.value
    })
    await settingsStore.batchUpdateSettings(updates)

    // 更新原始数据
    originalData.value = { ...formData.value }

    showToast('外观设置保存成功')
  } catch (error) {
    console.error('保存外观设置失败:', error)
    showToast('保存失败，请稍后重试', 'error')
  } finally {
    loading.value = false
  }
}

// 加载设置数据
const loadSettings = async () => {
  try {
    const appearanceSettings = settingsStore.settingsByCategory.appearance

    // 将设置数据填充到表单
    appearanceSettings.forEach(setting => {
      if (setting.key in formData.value) {
        ;(formData.value as any)[setting.key] = setting.value
      }
    })

    // 保存原始数据用于重置
    originalData.value = { ...formData.value }
  } catch (error) {
    console.error('加载外观设置失败:', error)
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
.appearance-settings {
  .settings-section,
  .preview-section {
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

  .color-picker-container {
    display: flex;
    align-items: center;
    gap: 12px;

    .color-picker {
      width: 40px;
      height: 40px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
    }

    .color-input {
      flex: 1;
    }
  }

  .logo-upload-container {
    .upload-hint {
      font-size: 12px;
      color: var(--text-color-tertiary);
      margin-top: 8px;
      display: block;
    }
  }

  .preview-section {
    .preview-content {
      padding: 20px;
      font-family: var(--font-family);
      font-size: var(--font-size);
      line-height: var(--line-height);

      .preview-header {
        text-align: center;
        margin-bottom: 20px;
        padding: 20px;
        border-radius: 8px;
        background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
        color: #fff;

        .preview-brand {
          font-size: 24px;
          font-weight: 600;
          display: block;
          margin-bottom: 8px;
        }

        .preview-slogan {
          font-size: 14px;
          opacity: 0.9;
        }
      }

      .preview-body {
        .preview-card {
          padding: 20px;
          border-radius: 8px;
          border: 1px solid var(--border-color-light);
          background: #fff;

          .card-title {
            font-size: 18px;
            font-weight: 500;
            color: var(--primary-color);
            display: block;
            margin-bottom: 12px;
          }

          .card-content {
            font-size: var(--font-size);
            color: var(--text-color-primary);
            line-height: var(--line-height);
            margin-bottom: 20px;
            display: block;
          }

          .card-actions {
            display: flex;
            gap: 12px;

            .btn-primary,
            .btn-secondary {
              padding: 8px 16px;
              border-radius: 4px;
              font-size: 14px;
              border: none;
              cursor: pointer;
            }

            .btn-primary {
              background: var(--primary-color);
              color: #fff;
            }

            .btn-secondary {
              background: var(--color-grey-100);
              color: var(--text-color-secondary);
              border: 1px solid var(--border-color-light);
            }
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
  .appearance-settings {
    .settings-section,
    .preview-section {
      margin: 0 -16px 16px;
      border-radius: 0;

      .section-header,
      .form-group,
      .preview-content {
        padding: 16px;
      }
    }

    .color-picker-container {
      flex-direction: column;
      align-items: stretch;
    }

    .preview-section {
      .preview-header {
        .preview-brand {
          font-size: 20px;
        }
      }

      .preview-body .card-actions {
        flex-direction: column;

        .btn-primary,
        .btn-secondary {
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
