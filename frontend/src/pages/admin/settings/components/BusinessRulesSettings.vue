<template>
  <view class="business-rules-settings">
    <view class="settings-section">
      <view class="section-header">
        <text class="section-title">业务规则设置</text>
        <text class="section-description">配置销售流程和业务逻辑规则</text>
      </view>

      <uni-forms ref="formRef" :model="formData" :rules="rules" validate-trigger="onChange">
        <!-- 报价规则 -->
        <view class="form-group">
          <text class="group-title">报价管理</text>
          
          <uni-forms-item label="报价有效期(天)" name="quoteValidityDays" required>
            <uni-number-box
              v-model="formData.quoteValidityDays"
              :min="1"
              :max="365"
              :step="1"
              @change="handleInputChange('quoteValidityDays', $event)"
            />
          </uni-forms-item>

          <uni-forms-item label="自动报价编号格式" name="quoteNumberFormat">
            <uni-data-picker
              v-model="formData.quoteNumberFormat"
              :localdata="quoteNumberFormatOptions"
              placeholder="选择编号格式"
              @change="handlePickerChange('quoteNumberFormat', $event)"
            />
          </uni-forms-item>

          <uni-forms-item label="最大折扣权限(%)" name="maxDiscountPercent">
            <uni-number-box
              v-model="formData.maxDiscountPercent"
              :min="0"
              :max="100"
              :step="0.1"
              @change="handleInputChange('maxDiscountPercent', $event)"
            />
          </uni-forms-item>

          <uni-forms-item label="需要审批的折扣阈值(%)" name="discountApprovalThreshold">
            <uni-number-box
              v-model="formData.discountApprovalThreshold"
              :min="0"
              :max="100"
              :step="0.1"
              @change="handleInputChange('discountApprovalThreshold', $event)"
            />
          </uni-forms-item>

          <uni-forms-item label="启用报价模板" name="enableQuoteTemplates">
            <switch
              :checked="formData.enableQuoteTemplates"
              @change="handleSwitchChange('enableQuoteTemplates', $event)"
            />
          </uni-forms-item>

          <uni-forms-item label="允许修改已发送报价" name="allowEditSentQuotes">
            <switch
              :checked="formData.allowEditSentQuotes"
              @change="handleSwitchChange('allowEditSentQuotes', $event)"
            />
          </uni-forms-item>
        </view>

        <!-- 定价策略 -->
        <view class="form-group">
          <text class="group-title">定价策略</text>
          
          <uni-forms-item label="默认定价策略" name="defaultPricingStrategy" required>
            <uni-data-picker
              v-model="formData.defaultPricingStrategy"
              :localdata="pricingStrategyOptions"
              placeholder="选择定价策略"
              @change="handlePickerChange('defaultPricingStrategy', $event)"
            />
          </uni-forms-item>

          <uni-forms-item label="启用批量定价" name="enableBulkPricing">
            <switch
              :checked="formData.enableBulkPricing"
              @change="handleSwitchChange('enableBulkPricing', $event)"
            />
          </uni-forms-item>

          <uni-forms-item label="动态定价调整系数" name="dynamicPricingFactor">
            <uni-number-box
              v-model="formData.dynamicPricingFactor"
              :min="0.1"
              :max="5.0"
              :step="0.1"
              @change="handleInputChange('dynamicPricingFactor', $event)"
            />
            <text class="field-hint">基于市场情况自动调整价格的系数</text>
          </uni-forms-item>

          <uni-forms-item label="最低利润率(%)" name="minimumProfitMargin">
            <uni-number-box
              v-model="formData.minimumProfitMargin"
              :min="0"
              :max="100"
              :step="0.1"
              @change="handleInputChange('minimumProfitMargin', $event)"
            />
          </uni-forms-item>

          <uni-forms-item label="启用竞争对手价格监控" name="enableCompetitorPriceMonitoring">
            <switch
              :checked="formData.enableCompetitorPriceMonitoring"
              @change="handleSwitchChange('enableCompetitorPriceMonitoring', $event)"
            />
          </uni-forms-item>
        </view>

        <!-- 客户管理 -->
        <view class="form-group">
          <text class="group-title">客户管理</text>
          
          <uni-forms-item label="默认信用限额" name="defaultCreditLimit">
            <uni-number-box
              v-model="formData.defaultCreditLimit"
              :min="0"
              :max="10000000"
              :step="1000"
              @change="handleInputChange('defaultCreditLimit', $event)"
            />
          </uni-forms-item>

          <uni-forms-item label="自动客户等级评估" name="enableAutoCustomerRating">
            <switch
              :checked="formData.enableAutoCustomerRating"
              @change="handleSwitchChange('enableAutoCustomerRating', $event)"
            />
          </uni-forms-item>

          <uni-forms-item label="客户等级评估周期(天)" name="customerRatingCycle">
            <uni-number-box
              v-model="formData.customerRatingCycle"
              :min="7"
              :max="365"
              :step="1"
              @change="handleInputChange('customerRatingCycle', $event)"
            />
          </uni-forms-item>

          <uni-forms-item label="VIP客户折扣率(%)" name="vipCustomerDiscountRate">
            <uni-number-box
              v-model="formData.vipCustomerDiscountRate"
              :min="0"
              :max="50"
              :step="0.1"
              @change="handleInputChange('vipCustomerDiscountRate', $event)"
            />
          </uni-forms-item>

          <uni-forms-item label="启用客户生命周期管理" name="enableCustomerLifecycleManagement">
            <switch
              :checked="formData.enableCustomerLifecycleManagement"
              @change="handleSwitchChange('enableCustomerLifecycleManagement', $event)"
            />
          </uni-forms-item>
        </view>

        <!-- 销售流程 -->
        <view class="form-group">
          <text class="group-title">销售流程</text>
          
          <uni-forms-item label="默认销售阶段" name="defaultSalesStage">
            <uni-data-picker
              v-model="formData.defaultSalesStage"
              :localdata="salesStageOptions"
              placeholder="选择默认销售阶段"
              @change="handlePickerChange('defaultSalesStage', $event)"
            />
          </uni-forms-item>

          <uni-forms-item label="自动阶段推进" name="enableAutoStageProgression">
            <switch
              :checked="formData.enableAutoStageProgression"
              @change="handleSwitchChange('enableAutoStageProgression', $event)"
            />
          </uni-forms-item>

          <uni-forms-item label="销售机会过期天数" name="opportunityExpiryDays">
            <uni-number-box
              v-model="formData.opportunityExpiryDays"
              :min="1"
              :max="365"
              :step="1"
              @change="handleInputChange('opportunityExpiryDays', $event)"
            />
          </uni-forms-item>

          <uni-forms-item label="需要经理审批的金额阈值" name="managerApprovalThreshold">
            <uni-number-box
              v-model="formData.managerApprovalThreshold"
              :min="0"
              :max="10000000"
              :step="1000"
              @change="handleInputChange('managerApprovalThreshold', $event)"
            />
          </uni-forms-item>

          <uni-forms-item label="启用销售预测" name="enableSalesForecasting">
            <switch
              :checked="formData.enableSalesForecasting"
              @change="handleSwitchChange('enableSalesForecasting', $event)"
            />
          </uni-forms-item>
        </view>

        <!-- 产品管理 -->
        <view class="form-group">
          <text class="group-title">产品管理</text>
          
          <uni-forms-item label="低库存警告阈值" name="lowStockThreshold">
            <uni-number-box
              v-model="formData.lowStockThreshold"
              :min="0"
              :max="1000"
              :step="1"
              @change="handleInputChange('lowStockThreshold', $event)"
            />
          </uni-forms-item>

          <uni-forms-item label="自动库存补充" name="enableAutoStockReplenishment">
            <switch
              :checked="formData.enableAutoStockReplenishment"
              @change="handleSwitchChange('enableAutoStockReplenishment', $event)"
            />
          </uni-forms-item>

          <uni-forms-item label="产品生命周期管理" name="enableProductLifecycleManagement">
            <switch
              :checked="formData.enableProductLifecycleManagement"
              @change="handleSwitchChange('enableProductLifecycleManagement', $event)"
            />
          </uni-forms-item>

          <uni-forms-item label="允许负库存销售" name="allowNegativeStockSales">
            <switch
              :checked="formData.allowNegativeStockSales"
              @change="handleSwitchChange('allowNegativeStockSales', $event)"
            />
          </uni-forms-item>

          <uni-forms-item label="产品推荐引擎" name="enableProductRecommendation">
            <switch
              :checked="formData.enableProductRecommendation"
              @change="handleSwitchChange('enableProductRecommendation', $event)"
            />
          </uni-forms-item>
        </view>

        <!-- 佣金和激励 -->
        <view class="form-group">
          <text class="group-title">佣金设置</text>
          
          <uni-forms-item label="默认佣金比例(%)" name="defaultCommissionRate">
            <uni-number-box
              v-model="formData.defaultCommissionRate"
              :min="0"
              :max="50"
              :step="0.1"
              @change="handleInputChange('defaultCommissionRate', $event)"
            />
          </uni-forms-item>

          <uni-forms-item label="佣金计算方式" name="commissionCalculationMethod">
            <uni-data-picker
              v-model="formData.commissionCalculationMethod"
              :localdata="commissionCalculationOptions"
              placeholder="选择计算方式"
              @change="handlePickerChange('commissionCalculationMethod', $event)"
            />
          </uni-forms-item>

          <uni-forms-item label="团队佣金分配" name="enableTeamCommissionSharing">
            <switch
              :checked="formData.enableTeamCommissionSharing"
              @change="handleSwitchChange('enableTeamCommissionSharing', $event)"
            />
          </uni-forms-item>

          <uni-forms-item label="达成目标奖励比例(%)" name="targetAchievementBonusRate">
            <uni-number-box
              v-model="formData.targetAchievementBonusRate"
              :min="0"
              :max="100"
              :step="0.1"
              @change="handleInputChange('targetAchievementBonusRate', $event)"
            />
          </uni-forms-item>

          <uni-forms-item label="启用销售竞赛" name="enableSalesCompetition">
            <switch
              :checked="formData.enableSalesCompetition"
              @change="handleSwitchChange('enableSalesCompetition', $event)"
            />
          </uni-forms-item>
        </view>
      </uni-forms>
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
 * 业务规则设置组件
 * 
 * 功能说明：
 * - 配置报价管理规则和流程
 * - 设置定价策略和利润控制
 * - 管理客户等级和信用政策
 * - 配置销售流程和审批规则
 * - 设置产品管理和库存控制
 * - 配置佣金计算和激励机制
 * 
 * 业务影响：
 * - 直接影响销售流程效率
 * - 控制业务风险和合规性
 * - 影响销售团队激励
 * - 决定客户体验质量
 * 
 * @author Terminal 3 (Admin Frontend Team)
 */

interface BusinessRulesSettingsForm {
  // 报价规则
  quoteValidityDays: number
  quoteNumberFormat: string
  maxDiscountPercent: number
  discountApprovalThreshold: number
  enableQuoteTemplates: boolean
  allowEditSentQuotes: boolean
  
  // 定价策略
  defaultPricingStrategy: string
  enableBulkPricing: boolean
  dynamicPricingFactor: number
  minimumProfitMargin: number
  enableCompetitorPriceMonitoring: boolean
  
  // 客户管理
  defaultCreditLimit: number
  enableAutoCustomerRating: boolean
  customerRatingCycle: number
  vipCustomerDiscountRate: number
  enableCustomerLifecycleManagement: boolean
  
  // 销售流程
  defaultSalesStage: string
  enableAutoStageProgression: boolean
  opportunityExpiryDays: number
  managerApprovalThreshold: number
  enableSalesForecasting: boolean
  
  // 产品管理
  lowStockThreshold: number
  enableAutoStockReplenishment: boolean
  enableProductLifecycleManagement: boolean
  allowNegativeStockSales: boolean
  enableProductRecommendation: boolean
  
  // 佣金设置
  defaultCommissionRate: number
  commissionCalculationMethod: string
  enableTeamCommissionSharing: boolean
  targetAchievementBonusRate: number
  enableSalesCompetition: boolean
}

const settingsStore = useSettingsStore()

// 表单引用和状态
const formRef = ref()
const loading = ref(false)
const originalData = ref<BusinessRulesSettingsForm>({} as BusinessRulesSettingsForm)

// 表单数据
const formData = ref<BusinessRulesSettingsForm>({
  // 报价规则
  quoteValidityDays: 30,
  quoteNumberFormat: 'Q{YYYY}{MM}{DD}-{###}',
  maxDiscountPercent: 20,
  discountApprovalThreshold: 10,
  enableQuoteTemplates: true,
  allowEditSentQuotes: false,
  
  // 定价策略
  defaultPricingStrategy: 'standard',
  enableBulkPricing: true,
  dynamicPricingFactor: 1.0,
  minimumProfitMargin: 15,
  enableCompetitorPriceMonitoring: false,
  
  // 客户管理
  defaultCreditLimit: 100000,
  enableAutoCustomerRating: true,
  customerRatingCycle: 30,
  vipCustomerDiscountRate: 5,
  enableCustomerLifecycleManagement: true,
  
  // 销售流程
  defaultSalesStage: 'prospect',
  enableAutoStageProgression: true,
  opportunityExpiryDays: 90,
  managerApprovalThreshold: 50000,
  enableSalesForecasting: true,
  
  // 产品管理
  lowStockThreshold: 10,
  enableAutoStockReplenishment: false,
  enableProductLifecycleManagement: true,
  allowNegativeStockSales: false,
  enableProductRecommendation: true,
  
  // 佣金设置
  defaultCommissionRate: 5,
  commissionCalculationMethod: 'net_sales',
  enableTeamCommissionSharing: false,
  targetAchievementBonusRate: 10,
  enableSalesCompetition: true
})

// 选项数据
const quoteNumberFormatOptions = [
  { value: 'Q{YYYY}{MM}{DD}-{###}', text: 'Q20240101-001' },
  { value: 'QT-{YYYY}-{###}', text: 'QT-2024-001' },
  { value: '{YYYY}{MM}-Q{###}', text: '202401-Q001' },
  { value: 'QUOTE-{###}', text: 'QUOTE-001' }
]

const pricingStrategyOptions = [
  { value: 'standard', text: '标准定价' },
  { value: 'competitive', text: '竞争定价' },
  { value: 'value_based', text: '价值定价' },
  { value: 'cost_plus', text: '成本加成' },
  { value: 'dynamic', text: '动态定价' }
]

const salesStageOptions = [
  { value: 'prospect', text: '潜在客户' },
  { value: 'qualified', text: '合格线索' },
  { value: 'proposal', text: '方案提案' },
  { value: 'negotiation', text: '商务谈判' },
  { value: 'closing', text: '成交确认' }
]

const commissionCalculationOptions = [
  { value: 'gross_sales', text: '基于总销售额' },
  { value: 'net_sales', text: '基于净销售额' },
  { value: 'profit_margin', text: '基于利润率' },
  { value: 'tiered', text: '阶梯式计算' }
]

// 表单验证规则
const rules = {
  quoteValidityDays: {
    rules: [
      { required: true, errorMessage: '请设置报价有效期' },
      { type: 'number', min: 1, max: 365, errorMessage: '报价有效期应在1-365天之间' }
    ]
  },
  maxDiscountPercent: {
    rules: [
      { type: 'number', min: 0, max: 100, errorMessage: '折扣比例应在0-100%之间' }
    ]
  },
  minimumProfitMargin: {
    rules: [
      { type: 'number', min: 0, max: 100, errorMessage: '最低利润率应在0-100%之间' }
    ]
  },
  defaultCreditLimit: {
    rules: [
      { type: 'number', min: 0, errorMessage: '信用限额不能为负数' }
    ]
  },
  defaultCommissionRate: {
    rules: [
      { type: 'number', min: 0, max: 50, errorMessage: '佣金比例应在0-50%之间' }
    ]
  }
}

// 计算属性
const hasChanges = computed(() => {
  return JSON.stringify(formData.value) !== JSON.stringify(originalData.value)
})

// 事件处理
const handleInputChange = (field: keyof BusinessRulesSettingsForm, value: any) => {
  (formData.value as any)[field] = value
}

const handlePickerChange = (field: keyof BusinessRulesSettingsForm, event: any) => {
  (formData.value as any)[field] = event.detail.value
}

const handleSwitchChange = (field: keyof BusinessRulesSettingsForm, event: any) => {
  (formData.value as any)[field] = event.detail.value
}

const handleReset = async () => {
  const result = await showModal({
    title: '确认重置',
    content: '确定要重置所有业务规则设置吗？这可能会影响销售流程。'
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

    // 业务规则检查
    if (formData.value.maxDiscountPercent < formData.value.discountApprovalThreshold) {
      showToast('最大折扣权限不应小于审批阈值', 'error')
      return
    }

    if (formData.value.minimumProfitMargin > formData.value.maxDiscountPercent) {
      const result = await showModal({
        title: '业务规则警告',
        content: '最低利润率设置高于最大折扣权限，这可能导致销售困难。确定要继续吗？'
      })
      
      if (!result.confirm) {
        return
      }
    }

    loading.value = true

    // 转换为设置格式
    const settings: Partial<SystemSettings>[] = Object.entries(formData.value).map(([key, value]) => ({
      category: 'business' as const,
      key,
      value,
      type: typeof value === 'boolean' ? 'boolean' : 
            typeof value === 'number' ? 'number' : 'string'
    }))

    // 保存设置
    await settingsStore.updateSettings(settings)
    
    // 更新原始数据
    originalData.value = { ...formData.value }
    
    showToast('业务规则设置保存成功')
  } catch (error) {
    console.error('保存业务规则设置失败:', error)
    showToast('保存失败，请稍后重试', 'error')
  } finally {
    loading.value = false
  }
}

// 加载设置数据
const loadSettings = async () => {
  try {
    const businessSettings = settingsStore.getSettingsByCategory('business')
    
    // 将设置数据填充到表单
    businessSettings.forEach(setting => {
      if (setting.key in formData.value) {
        (formData.value as any)[setting.key] = setting.value
      }
    })
    
    // 保存原始数据用于重置
    originalData.value = { ...formData.value }
  } catch (error) {
    console.error('加载业务规则设置失败:', error)
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
.business-rules-settings {
  .settings-section {
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
  .business-rules-settings {
    .settings-section {
      margin: 0 -16px 16px;
      border-radius: 0;
      
      .section-header,
      .form-group {
        padding: 16px;
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