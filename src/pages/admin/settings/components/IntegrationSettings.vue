<template>
  <view class="integration-settings">
    <view class="settings-section">
      <view class="section-header">
        <text class="section-title">集成设置</text>
        <text class="section-description">配置第三方系统和服务集成</text>
      </view>

      <uni-forms ref="formRef" :model="formData" :rules="rules" validate-trigger="onChange">
        <!-- CRM集成 -->
        <view class="form-group">
          <text class="group-title">CRM系统集成</text>

          <uni-forms-item label="启用CRM集成" name="enableCrmIntegration">
            <switch
              :checked="formData.enableCrmIntegration"
              @change="handleSwitchChange('enableCrmIntegration', $event)"
            />
          </uni-forms-item>

          <template v-if="formData.enableCrmIntegration">
            <uni-forms-item label="CRM系统类型" name="crmSystemType" required>
              <uni-data-picker
                v-model="formData.crmSystemType"
                :localdata="crmSystemOptions"
                placeholder="选择CRM系统"
                @change="handlePickerChange('crmSystemType', $event)"
              />
            </uni-forms-item>

            <uni-forms-item label="API地址" name="crmApiUrl" required>
              <uni-easyinput
                v-model="formData.crmApiUrl"
                placeholder="https://api.crm.com"
                :clearable="true"
                @input="handleInputChange('crmApiUrl', $event)"
              />
            </uni-forms-item>

            <uni-forms-item label="API密钥" name="crmApiKey" required>
              <uni-easyinput
                v-model="formData.crmApiKey"
                type="password"
                placeholder="请输入API密钥"
                :clearable="true"
                @input="handleInputChange('crmApiKey', $event)"
              />
            </uni-forms-item>

            <uni-forms-item label="同步频率(分钟)" name="crmSyncInterval">
              <uni-number-box
                v-model="formData.crmSyncInterval"
                :min="5"
                :max="1440"
                :step="5"
                @change="handleInputChange('crmSyncInterval', $event)"
              />
            </uni-forms-item>

            <uni-forms-item label="双向同步" name="crmBidirectionalSync">
              <switch
                :checked="formData.crmBidirectionalSync"
                @change="handleSwitchChange('crmBidirectionalSync', $event)"
              />
              <text class="field-hint">启用后数据将在两个系统间双向同步</text>
            </uni-forms-item>
          </template>
        </view>

        <!-- ERP集成 -->
        <view class="form-group">
          <text class="group-title">ERP系统集成</text>

          <uni-forms-item label="启用ERP集成" name="enableErpIntegration">
            <switch
              :checked="formData.enableErpIntegration"
              @change="handleSwitchChange('enableErpIntegration', $event)"
            />
          </uni-forms-item>

          <template v-if="formData.enableErpIntegration">
            <uni-forms-item label="ERP系统类型" name="erpSystemType" required>
              <uni-data-picker
                v-model="formData.erpSystemType"
                :localdata="erpSystemOptions"
                placeholder="选择ERP系统"
                @change="handlePickerChange('erpSystemType', $event)"
              />
            </uni-forms-item>

            <uni-forms-item label="数据库连接串" name="erpConnectionString" required>
              <uni-easyinput
                v-model="formData.erpConnectionString"
                type="password"
                placeholder="请输入数据库连接串"
                :clearable="true"
                @input="handleInputChange('erpConnectionString', $event)"
              />
            </uni-forms-item>

            <uni-forms-item label="同步模块" name="erpSyncModules">
              <view class="checkbox-group">
                <checkbox-group @change="handleErpModulesChange">
                  <label
                    class="checkbox-item"
                    v-for="module in erpModuleOptions"
                    :key="module.value"
                  >
                    <checkbox
                      :value="module.value"
                      :checked="formData.erpSyncModules.includes(module.value)"
                    />
                    <text>{{ module.text }}</text>
                  </label>
                </checkbox-group>
              </view>
            </uni-forms-item>
          </template>
        </view>

        <!-- 支付网关 -->
        <view class="form-group">
          <text class="group-title">支付网关</text>

          <uni-forms-item label="启用在线支付" name="enablePaymentGateway">
            <switch
              :checked="formData.enablePaymentGateway"
              @change="handleSwitchChange('enablePaymentGateway', $event)"
            />
          </uni-forms-item>

          <template v-if="formData.enablePaymentGateway">
            <uni-forms-item label="主要支付网关" name="primaryPaymentGateway" required>
              <uni-data-picker
                v-model="formData.primaryPaymentGateway"
                :localdata="paymentGatewayOptions"
                placeholder="选择支付网关"
                @change="handlePickerChange('primaryPaymentGateway', $event)"
              />
            </uni-forms-item>

            <uni-forms-item label="商户号" name="paymentMerchantId" required>
              <uni-easyinput
                v-model="formData.paymentMerchantId"
                placeholder="请输入商户号"
                :clearable="true"
                @input="handleInputChange('paymentMerchantId', $event)"
              />
            </uni-forms-item>

            <uni-forms-item label="商户密钥" name="paymentMerchantKey" required>
              <uni-easyinput
                v-model="formData.paymentMerchantKey"
                type="password"
                placeholder="请输入商户密钥"
                :clearable="true"
                @input="handleInputChange('paymentMerchantKey', $event)"
              />
            </uni-forms-item>

            <uni-forms-item label="支持的支付方式" name="supportedPaymentMethods">
              <view class="checkbox-group">
                <checkbox-group @change="handlePaymentMethodsChange">
                  <label
                    class="checkbox-item"
                    v-for="method in paymentMethodOptions"
                    :key="method.value"
                  >
                    <checkbox
                      :value="method.value"
                      :checked="formData.supportedPaymentMethods.includes(method.value)"
                    />
                    <text>{{ method.text }}</text>
                  </label>
                </checkbox-group>
              </view>
            </uni-forms-item>

            <uni-forms-item label="沙盒模式" name="paymentSandboxMode">
              <switch
                :checked="formData.paymentSandboxMode"
                @change="handleSwitchChange('paymentSandboxMode', $event)"
              />
              <text class="field-hint">测试环境使用，生产环境请关闭</text>
            </uni-forms-item>
          </template>
        </view>

        <!-- 物流配送 -->
        <view class="form-group">
          <text class="group-title">物流配送</text>

          <uni-forms-item label="启用物流集成" name="enableShippingIntegration">
            <switch
              :checked="formData.enableShippingIntegration"
              @change="handleSwitchChange('enableShippingIntegration', $event)"
            />
          </uni-forms-item>

          <template v-if="formData.enableShippingIntegration">
            <uni-forms-item label="物流服务商" name="shippingProviders">
              <view class="checkbox-group">
                <checkbox-group @change="handleShippingProvidersChange">
                  <label
                    class="checkbox-item"
                    v-for="provider in shippingProviderOptions"
                    :key="provider.value"
                  >
                    <checkbox
                      :value="provider.value"
                      :checked="formData.shippingProviders.includes(provider.value)"
                    />
                    <text>{{ provider.text }}</text>
                  </label>
                </checkbox-group>
              </view>
            </uni-forms-item>

            <uni-forms-item label="自动获取运费" name="autoCalculateShipping">
              <switch
                :checked="formData.autoCalculateShipping"
                @change="handleSwitchChange('autoCalculateShipping', $event)"
              />
            </uni-forms-item>

            <uni-forms-item label="物流跟踪" name="enableShippingTracking">
              <switch
                :checked="formData.enableShippingTracking"
                @change="handleSwitchChange('enableShippingTracking', $event)"
              />
            </uni-forms-item>
          </template>
        </view>

        <!-- 数据分析 -->
        <view class="form-group">
          <text class="group-title">数据分析</text>

          <uni-forms-item label="启用Google Analytics" name="enableGoogleAnalytics">
            <switch
              :checked="formData.enableGoogleAnalytics"
              @change="handleSwitchChange('enableGoogleAnalytics', $event)"
            />
          </uni-forms-item>

          <uni-forms-item
            label="GA跟踪ID"
            name="googleAnalyticsId"
            v-if="formData.enableGoogleAnalytics"
          >
            <uni-easyinput
              v-model="formData.googleAnalyticsId"
              placeholder="GA-XXXXXXXXX-X"
              :clearable="true"
              @input="handleInputChange('googleAnalyticsId', $event)"
            />
          </uni-forms-item>

          <uni-forms-item label="启用百度统计" name="enableBaiduAnalytics">
            <switch
              :checked="formData.enableBaiduAnalytics"
              @change="handleSwitchChange('enableBaiduAnalytics', $event)"
            />
          </uni-forms-item>

          <uni-forms-item
            label="百度统计ID"
            name="baiduAnalyticsId"
            v-if="formData.enableBaiduAnalytics"
          >
            <uni-easyinput
              v-model="formData.baiduAnalyticsId"
              placeholder="请输入百度统计ID"
              :clearable="true"
              @input="handleInputChange('baiduAnalyticsId', $event)"
            />
          </uni-forms-item>
        </view>

        <!-- Webhook配置 -->
        <view class="form-group">
          <text class="group-title">Webhook配置</text>

          <uni-forms-item label="启用Webhook" name="enableWebhooks">
            <switch
              :checked="formData.enableWebhooks"
              @change="handleSwitchChange('enableWebhooks', $event)"
            />
          </uni-forms-item>

          <template v-if="formData.enableWebhooks">
            <uni-forms-item label="Webhook地址列表" name="webhookUrls">
              <uni-easyinput
                v-model="formData.webhookUrls"
                type="textarea"
                placeholder="每行一个URL地址"
                :auto-height="true"
                maxlength="2000"
                @input="handleInputChange('webhookUrls', $event)"
              />
              <text class="field-hint">多个URL请分行输入</text>
            </uni-forms-item>

            <uni-forms-item label="Webhook密钥" name="webhookSecret">
              <uni-easyinput
                v-model="formData.webhookSecret"
                type="password"
                placeholder="用于验证请求的密钥"
                :clearable="true"
                @input="handleInputChange('webhookSecret', $event)"
              />
            </uni-forms-item>

            <uni-forms-item label="重试次数" name="webhookRetryCount">
              <uni-number-box
                v-model="formData.webhookRetryCount"
                :min="0"
                :max="10"
                :step="1"
                @change="handleInputChange('webhookRetryCount', $event)"
              />
            </uni-forms-item>

            <uni-forms-item label="超时时间(秒)" name="webhookTimeout">
              <uni-number-box
                v-model="formData.webhookTimeout"
                :min="5"
                :max="60"
                :step="1"
                @change="handleInputChange('webhookTimeout', $event)"
              />
            </uni-forms-item>
          </template>
        </view>

        <!-- API管理 -->
        <view class="form-group">
          <text class="group-title">API管理</text>

          <uni-forms-item label="启用API访问" name="enableApiAccess">
            <switch
              :checked="formData.enableApiAccess"
              @change="handleSwitchChange('enableApiAccess', $event)"
            />
          </uni-forms-item>

          <uni-forms-item label="API版本" name="apiVersion">
            <uni-data-picker
              v-model="formData.apiVersion"
              :localdata="apiVersionOptions"
              placeholder="选择API版本"
              @change="handlePickerChange('apiVersion', $event)"
            />
          </uni-forms-item>

          <uni-forms-item label="API频率限制" name="apiRateLimit">
            <uni-number-box
              v-model="formData.apiRateLimit"
              :min="10"
              :max="10000"
              :step="10"
              @change="handleInputChange('apiRateLimit', $event)"
            />
            <text class="field-hint">每小时最大请求数</text>
          </uni-forms-item>

          <uni-forms-item label="API文档访问" name="enableApiDocs">
            <switch
              :checked="formData.enableApiDocs"
              @change="handleSwitchChange('enableApiDocs', $event)"
            />
          </uni-forms-item>
        </view>
      </uni-forms>
    </view>

    <!-- 集成状态 -->
    <view class="integration-status">
      <view class="section-header">
        <text class="section-title">集成状态</text>
        <text class="section-description">各个系统的连接状态和健康检查</text>
      </view>
      <view class="status-grid">
        <view class="status-card" v-for="integration in integrationStatus" :key="integration.name">
          <view class="status-header">
            <text class="status-name">{{ integration.name }}</text>
            <view class="status-indicator" :class="integration.status">
              <text class="status-dot"></text>
              <text class="status-text">{{ getStatusText(integration.status) }}</text>
            </view>
          </view>
          <text class="status-description">{{ integration.description }}</text>
          <text class="last-sync">最后同步：{{ integration.lastSync }}</text>
          <view class="status-actions">
            <button class="test-btn" @click="testIntegration(integration.key)">测试连接</button>
            <button
              class="sync-btn"
              @click="syncIntegration(integration.key)"
              :disabled="integration.status !== 'connected'"
            >
              立即同步
            </button>
          </view>
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
import { computed, onMounted, ref, watch } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { showModal, showToast } from '@/utils/ui'
import type { SystemSettings } from '@/types/settings'

/**
 * 集成设置组件
 *
 * 功能说明：
 * - 配置CRM、ERP等第三方系统集成
 * - 设置支付网关和物流服务商
 * - 管理数据分析工具集成
 * - 配置Webhook和API访问
 * - 监控集成状态和连接健康度
 * - 提供集成测试和同步功能
 *
 * 集成类型：
 * - CRM系统：客户关系管理
 * - ERP系统：企业资源规划
 * - 支付网关：在线支付处理
 * - 物流配送：订单履行和跟踪
 * - 数据分析：业务智能和统计
 * - Webhook：事件通知和自动化
 * - API：第三方应用访问
 *
 * @author Terminal 3 (Admin Frontend Team)
 */

interface IntegrationSettingsForm {
  // CRM集成
  enableCrmIntegration: boolean
  crmSystemType: string
  crmApiUrl: string
  crmApiKey: string
  crmSyncInterval: number
  crmBidirectionalSync: boolean

  // ERP集成
  enableErpIntegration: boolean
  erpSystemType: string
  erpConnectionString: string
  erpSyncModules: string[]

  // 支付网关
  enablePaymentGateway: boolean
  primaryPaymentGateway: string
  paymentMerchantId: string
  paymentMerchantKey: string
  supportedPaymentMethods: string[]
  paymentSandboxMode: boolean

  // 物流配送
  enableShippingIntegration: boolean
  shippingProviders: string[]
  autoCalculateShipping: boolean
  enableShippingTracking: boolean

  // 数据分析
  enableGoogleAnalytics: boolean
  googleAnalyticsId: string
  enableBaiduAnalytics: boolean
  baiduAnalyticsId: string

  // Webhook
  enableWebhooks: boolean
  webhookUrls: string
  webhookSecret: string
  webhookRetryCount: number
  webhookTimeout: number

  // API管理
  enableApiAccess: boolean
  apiVersion: string
  apiRateLimit: number
  enableApiDocs: boolean
}

const settingsStore = useSettingsStore()

// 表单引用和状态
const formRef = ref()
const loading = ref(false)
const originalData = ref<IntegrationSettingsForm>({} as IntegrationSettingsForm)

// 表单数据
const formData = ref<IntegrationSettingsForm>({
  // CRM集成
  enableCrmIntegration: false,
  crmSystemType: 'salesforce',
  crmApiUrl: '',
  crmApiKey: '',
  crmSyncInterval: 60,
  crmBidirectionalSync: false,

  // ERP集成
  enableErpIntegration: false,
  erpSystemType: 'sap',
  erpConnectionString: '',
  erpSyncModules: [],

  // 支付网关
  enablePaymentGateway: false,
  primaryPaymentGateway: 'alipay',
  paymentMerchantId: '',
  paymentMerchantKey: '',
  supportedPaymentMethods: [],
  paymentSandboxMode: true,

  // 物流配送
  enableShippingIntegration: false,
  shippingProviders: [],
  autoCalculateShipping: true,
  enableShippingTracking: true,

  // 数据分析
  enableGoogleAnalytics: false,
  googleAnalyticsId: '',
  enableBaiduAnalytics: false,
  baiduAnalyticsId: '',

  // Webhook
  enableWebhooks: false,
  webhookUrls: '',
  webhookSecret: '',
  webhookRetryCount: 3,
  webhookTimeout: 30,

  // API管理
  enableApiAccess: true,
  apiVersion: 'v1',
  apiRateLimit: 1000,
  enableApiDocs: true
})

// 选项数据
const crmSystemOptions = [
  { value: 'salesforce', text: 'Salesforce' },
  { value: 'hubspot', text: 'HubSpot' },
  { value: 'zoho', text: 'Zoho CRM' },
  { value: 'pipedrive', text: 'Pipedrive' },
  { value: 'custom', text: '自定义系统' }
]

const erpSystemOptions = [
  { value: 'sap', text: 'SAP ERP' },
  { value: 'oracle', text: 'Oracle ERP' },
  { value: 'microsoft', text: 'Microsoft Dynamics' },
  { value: 'kingdee', text: '金蝶' },
  { value: 'ufida', text: '用友' },
  { value: 'custom', text: '自定义系统' }
]

const erpModuleOptions = [
  { value: 'inventory', text: '库存管理' },
  { value: 'finance', text: '财务管理' },
  { value: 'purchasing', text: '采购管理' },
  { value: 'manufacturing', text: '生产管理' },
  { value: 'hrm', text: '人力资源' }
]

const paymentGatewayOptions = [
  { value: 'alipay', text: '支付宝' },
  { value: 'wechatpay', text: '微信支付' },
  { value: 'stripe', text: 'Stripe' },
  { value: 'paypal', text: 'PayPal' },
  { value: 'unionpay', text: '银联支付' }
]

const paymentMethodOptions = [
  { value: 'alipay_web', text: '支付宝网页版' },
  { value: 'alipay_mobile', text: '支付宝手机版' },
  { value: 'wechat_web', text: '微信扫码支付' },
  { value: 'wechat_mobile', text: '微信手机支付' },
  { value: 'bank_card', text: '银行卡支付' },
  { value: 'credit_card', text: '信用卡支付' }
]

const shippingProviderOptions = [
  { value: 'sf_express', text: '顺丰速运' },
  { value: 'ems', text: '中国邮政EMS' },
  { value: 'yto', text: '圆通速递' },
  { value: 'sto', text: '申通快递' },
  { value: 'zto', text: '中通快递' },
  { value: 'fedex', text: 'FedEx' },
  { value: 'ups', text: 'UPS' },
  { value: 'dhl', text: 'DHL' }
]

const apiVersionOptions = [
  { value: 'v1', text: 'API v1.0' },
  { value: 'v2', text: 'API v2.0' },
  { value: 'v3', text: 'API v3.0 (Beta)' }
]

// 集成状态数据
const integrationStatus = ref([
  {
    key: 'crm',
    name: 'CRM系统',
    description: '客户关系管理系统集成',
    status: 'disconnected',
    lastSync: '从未同步'
  },
  {
    key: 'erp',
    name: 'ERP系统',
    description: '企业资源规划系统集成',
    status: 'disconnected',
    lastSync: '从未同步'
  },
  {
    key: 'payment',
    name: '支付网关',
    description: '在线支付服务集成',
    status: 'connected',
    lastSync: '2分钟前'
  },
  {
    key: 'shipping',
    name: '物流服务',
    description: '快递物流服务集成',
    status: 'warning',
    lastSync: '1小时前'
  }
])

// 表单验证规则
const rules = {
  crmApiUrl: {
    rules: [
      { required: true, errorMessage: '请输入CRM API地址' },
      { format: 'url', errorMessage: '请输入正确的URL格式' }
    ]
  },
  crmApiKey: {
    rules: [{ required: true, errorMessage: '请输入CRM API密钥' }]
  },
  paymentMerchantId: {
    rules: [{ required: true, errorMessage: '请输入商户号' }]
  },
  paymentMerchantKey: {
    rules: [{ required: true, errorMessage: '请输入商户密钥' }]
  }
}

// 计算属性
const hasChanges = computed(() => {
  return JSON.stringify(formData.value) !== JSON.stringify(originalData.value)
})

// 辅助函数
const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    connected: '已连接',
    disconnected: '未连接',
    warning: '异常',
    error: '错误'
  }
  return statusMap[status] || '未知'
}

// 事件处理
const handleInputChange = (field: keyof IntegrationSettingsForm, value: any) => {
  ;(formData.value as any)[field] = value
}

const handlePickerChange = (field: keyof IntegrationSettingsForm, event: any) => {
  ;(formData.value as any)[field] = event.detail.value
}

const handleSwitchChange = (field: keyof IntegrationSettingsForm, event: any) => {
  ;(formData.value as any)[field] = event.detail.value
}

const handleErpModulesChange = (event: any) => {
  formData.value.erpSyncModules = event.detail.value
}

const handlePaymentMethodsChange = (event: any) => {
  formData.value.supportedPaymentMethods = event.detail.value
}

const handleShippingProvidersChange = (event: any) => {
  formData.value.shippingProviders = event.detail.value
}

const handleReset = async () => {
  const result = await showModal({
    title: '确认重置',
    content: '确定要重置所有集成设置吗？这可能会断开现有的第三方服务连接。'
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

    if (formData.value.enableCrmIntegration) {
      const crmValid = await formRef.value.validateField(['crmApiUrl', 'crmApiKey'])
      isValid = isValid && crmValid
    }

    if (formData.value.enablePaymentGateway) {
      const paymentValid = await formRef.value.validateField([
        'paymentMerchantId',
        'paymentMerchantKey'
      ])
      isValid = isValid && paymentValid
    }

    if (!isValid) {
      showToast('请完善必填字段', 'error')
      return
    }

    loading.value = true

    // 转换为设置格式
    const settings: Partial<SystemSettings>[] = Object.entries(formData.value).map(
      ([key, value]) => ({
        category: 'integration' as const,
        key,
        value,
        type: Array.isArray(value)
          ? 'multiselect'
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

    showToast('集成设置保存成功')
  } catch (error) {
    console.error('保存集成设置失败:', error)
    showToast('保存失败，请稍后重试', 'error')
  } finally {
    loading.value = false
  }
}

// 集成测试和同步
const testIntegration = async (integrationKey: string) => {
  try {
    showToast(`正在测试${getIntegrationName(integrationKey)}连接...`)

    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 2000))

    // 更新状态
    const integration = integrationStatus.value.find(item => item.key === integrationKey)
    if (integration) {
      integration.status = Math.random() > 0.5 ? 'connected' : 'error'
      integration.lastSync = integration.status === 'connected' ? '刚刚' : '连接失败'
    }

    if (integration?.status === 'connected') {
      showToast('连接测试成功')
    } else {
      showToast('连接测试失败，请检查配置', 'error')
    }
  } catch (error) {
    console.error('集成测试失败:', error)
    showToast('测试失败', 'error')
  }
}

const syncIntegration = async (integrationKey: string) => {
  try {
    showToast(`正在同步${getIntegrationName(integrationKey)}数据...`)

    // 模拟同步过程
    await new Promise(resolve => setTimeout(resolve, 3000))

    // 更新最后同步时间
    const integration = integrationStatus.value.find(item => item.key === integrationKey)
    if (integration) {
      integration.lastSync = '刚刚'
    }

    showToast('数据同步完成')
  } catch (error) {
    console.error('数据同步失败:', error)
    showToast('同步失败，请稍后重试', 'error')
  }
}

const getIntegrationName = (key: string) => {
  const nameMap: Record<string, string> = {
    crm: 'CRM系统',
    erp: 'ERP系统',
    payment: '支付网关',
    shipping: '物流服务'
  }
  return nameMap[key] || '未知系统'
}

// 加载设置数据
const loadSettings = async () => {
  try {
    const integrationSettings = settingsStore.getSettingsByCategory('integration')

    // 将设置数据填充到表单
    integrationSettings.forEach(setting => {
      if (setting.key in formData.value) {
        ;(formData.value as any)[setting.key] = setting.value
      }
    })

    // 保存原始数据用于重置
    originalData.value = { ...formData.value }
  } catch (error) {
    console.error('加载集成设置失败:', error)
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
.integration-settings {
  .settings-section,
  .integration-status {
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

  .integration-status {
    .status-grid {
      padding: 20px;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 16px;

      .status-card {
        padding: 16px;
        border: 1px solid var(--border-color-light);
        border-radius: 8px;
        background: #fff;

        .status-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;

          .status-name {
            font-weight: 500;
            color: var(--text-color-primary);
          }

          .status-indicator {
            display: flex;
            align-items: center;

            .status-dot {
              width: 8px;
              height: 8px;
              border-radius: 50%;
              margin-right: 6px;
            }

            .status-text {
              font-size: 12px;
            }

            &.connected {
              .status-dot {
                background: var(--color-success);
              }
              .status-text {
                color: var(--color-success);
              }
            }

            &.disconnected {
              .status-dot {
                background: var(--color-grey-400);
              }
              .status-text {
                color: var(--color-grey-400);
              }
            }

            &.warning {
              .status-dot {
                background: var(--color-warning);
              }
              .status-text {
                color: var(--color-warning);
              }
            }

            &.error {
              .status-dot {
                background: var(--color-error);
              }
              .status-text {
                color: var(--color-error);
              }
            }
          }
        }

        .status-description {
          font-size: 13px;
          color: var(--text-color-secondary);
          margin-bottom: 8px;
          display: block;
        }

        .last-sync {
          font-size: 12px;
          color: var(--text-color-tertiary);
          margin-bottom: 12px;
          display: block;
        }

        .status-actions {
          display: flex;
          gap: 8px;

          .test-btn,
          .sync-btn {
            padding: 6px 12px;
            font-size: 12px;
            border-radius: 4px;
            border: none;
            cursor: pointer;
            transition: all 0.2s;

            &:disabled {
              opacity: 0.5;
              cursor: not-allowed;
            }
          }

          .test-btn {
            background: var(--color-info-light);
            color: var(--color-info);

            &:hover:not(:disabled) {
              background: var(--color-info);
              color: #fff;
            }
          }

          .sync-btn {
            background: var(--color-success-light);
            color: var(--color-success);

            &:hover:not(:disabled) {
              background: var(--color-success);
              color: #fff;
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
  .integration-settings {
    .settings-section,
    .integration-status {
      margin: 0 -16px 16px;
      border-radius: 0;

      .section-header,
      .form-group,
      .status-grid {
        padding: 16px;
      }
    }

    .integration-status .status-grid {
      grid-template-columns: 1fr;
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
