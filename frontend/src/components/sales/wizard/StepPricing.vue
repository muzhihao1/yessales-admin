<!--
  Quote Wizard - Step 3: Pricing Configuration
  Real-time price calculation with advanced pricing controls
-->
<template>
  <view class="step-pricing">
    <view class="step-header">
      <text class="step-title">价格配置</text>
      <text class="step-subtitle">设置折扣、税费和附加服务，实时查看价格变化</text>
    </view>

    <!-- Real-time Price Calculator (Sticky) -->
    <view class="price-calculator">
      <view class="calculator-header">
        <text class="calc-title">💰 价格明细</text>
        <view class="calc-toggle" @click="showCalculator = !showCalculator">
          <text class="toggle-text">{{ showCalculator ? '收起' : '展开' }}</text>
          <text class="toggle-icon">{{ showCalculator ? '▲' : '▼' }}</text>
        </view>
      </view>

      <view v-if="showCalculator" class="calculator-content">
        <!-- Product Summary -->
        <view class="price-row">
          <text class="row-label">产品小计 ({{ selectedProducts.length }}种)</text>
          <text class="row-value">¥{{ subtotal.toFixed(2) }}</text>
        </view>

        <!-- Customer Type Discount -->
        <view v-if="customerTypeDiscount > 0" class="price-row discount-row">
          <text class="row-label">{{ customerTypeText }}优惠</text>
          <text class="row-value discount-value">-¥{{ customerTypeDiscount.toFixed(2) }}</text>
        </view>

        <!-- Additional Discount -->
        <view v-if="additionalDiscount > 0" class="price-row discount-row">
          <text class="row-label">额外折扣</text>
          <text class="row-value discount-value">-¥{{ additionalDiscount.toFixed(2) }}</text>
        </view>

        <!-- Subtotal After Discount -->
        <view class="price-row subtotal-row">
          <text class="row-label">折扣后小计</text>
          <text class="row-value">¥{{ discountedSubtotal.toFixed(2) }}</text>
        </view>

        <!-- Additional Charges -->
        <view v-if="totalAdditionalCharges > 0" class="price-row">
          <text class="row-label">附加费用</text>
          <text class="row-value">+¥{{ totalAdditionalCharges.toFixed(2) }}</text>
        </view>

        <!-- Tax -->
        <view v-if="taxAmount > 0" class="price-row">
          <text class="row-label">税费 ({{ localConfig.taxRate }}%)</text>
          <text class="row-value">+¥{{ taxAmount.toFixed(2) }}</text>
        </view>

        <!-- Final Total -->
        <view class="price-row total-row">
          <text class="row-label">合计金额</text>
          <text class="row-value total-value">¥{{ finalTotal.toFixed(2) }}</text>
        </view>
      </view>
    </view>

    <!-- Discount Configuration -->
    <view class="config-section">
      <view class="section-header">
        <text class="section-icon">🎫</text>
        <text class="section-title">折扣设置</text>
      </view>

      <!-- Discount Type Toggle -->
      <view class="discount-type-selector">
        <view
          class="type-option"
          :class="{ 'type-option--active': localConfig.discountType === 'percentage' }"
          @click="selectDiscountType('percentage')"
        >
          <text class="option-icon">%</text>
          <text class="option-label">按比例</text>
          <text class="option-hint">0-50%</text>
        </view>
        <view
          class="type-option"
          :class="{ 'type-option--active': localConfig.discountType === 'fixed' }"
          @click="selectDiscountType('fixed')"
        >
          <text class="option-icon">¥</text>
          <text class="option-label">固定金额</text>
          <text class="option-hint">具体金额</text>
        </view>
      </view>

      <!-- Discount Value Input -->
      <view class="discount-input-section">
        <SalesInput
          v-model.number="localConfig.discountValue"
          :label="discountLabel"
          :placeholder="discountPlaceholder"
          type="number"
          :min="0"
          :max="discountMax"
          :error="discountError"
          @input="handleDiscountInput"
          @blur="validateDiscount"
        >
          <template #suffix>
            <text class="input-unit">{{ discountUnit }}</text>
          </template>
          <template #help>
            <text v-if="additionalDiscount > 0" class="discount-preview">
              节省 ¥{{ additionalDiscount.toFixed(2) }}
            </text>
          </template>
        </SalesInput>

        <!-- Quick Discount Presets -->
        <view class="discount-presets">
          <text class="presets-label">快速选择：</text>
          <view class="preset-buttons">
            <SalesButton
              v-for="preset in discountPresets"
              :key="preset.value"
              size="mini"
              type="plain"
              @click="applyDiscountPreset(preset)"
            >
              {{ preset.label }}
            </SalesButton>
          </view>
        </view>
      </view>
    </view>

    <!-- Advanced Pricing (Collapsible) -->
    <view class="config-section">
      <view class="section-header" @click="showAdvanced = !showAdvanced">
        <text class="section-icon">⚙️</text>
        <text class="section-title">高级设置</text>
        <text class="section-toggle">{{ showAdvanced ? '▲' : '▼' }}</text>
      </view>

      <view v-if="showAdvanced" class="advanced-content">
        <!-- Tax Configuration -->
        <view class="config-subsection">
          <text class="subsection-title">税费配置</text>

          <view class="form-row">
            <SalesInput
              v-model.number="localConfig.taxRate"
              label="税率 (%)"
              placeholder="13"
              type="number"
              :min="0"
              :max="30"
              @input="emitConfigUpdate"
            />

            <view class="tax-included-option" @click="toggleTaxIncluded">
              <view class="checkbox" :class="{ 'checkbox--checked': localConfig.taxIncluded }">
                <text v-if="localConfig.taxIncluded" class="checkbox-check">✓</text>
              </view>
              <text class="checkbox-label">含税价格</text>
            </view>
          </view>
        </view>

        <!-- Additional Charges -->
        <view class="config-subsection">
          <text class="subsection-title">附加费用</text>

          <view class="form-grid">
            <SalesInput
              v-model.number="localConfig.deliveryFee"
              label="配送费 (¥)"
              placeholder="0"
              type="number"
              :min="0"
              @input="emitConfigUpdate"
            >
              <template #prefix>
                <text class="input-icon">🚚</text>
              </template>
            </SalesInput>

            <SalesInput
              v-model.number="localConfig.installationFee"
              label="安装费 (¥)"
              placeholder="0"
              type="number"
              :min="0"
              @input="emitConfigUpdate"
            >
              <template #prefix>
                <text class="input-icon">🔧</text>
              </template>
            </SalesInput>
          </view>

          <!-- Other Charges -->
          <view v-if="localConfig.otherCharges?.length" class="other-charges">
            <view
              v-for="(charge, index) in localConfig.otherCharges"
              :key="charge.id"
              class="charge-item"
            >
              <SalesInput
                v-model="charge.name"
                placeholder="费用名称"
                @input="emitConfigUpdate"
                class="charge-name"
              />

              <view class="charge-controls">
                <view class="charge-type-toggle">
                  <SalesButton
                    :type="charge.type === 'fixed' ? 'primary' : 'default'"
                    size="mini"
                    @click="toggleChargeType(index, 'fixed')"
                  >
                    固定
                  </SalesButton>
                  <SalesButton
                    :type="charge.type === 'percentage' ? 'primary' : 'default'"
                    size="mini"
                    @click="toggleChargeType(index, 'percentage')"
                  >
                    比例
                  </SalesButton>
                </view>

                <SalesInput
                  v-model.number="charge.amount"
                  :placeholder="charge.type === 'percentage' ? '百分比' : '金额'"
                  type="number"
                  :min="0"
                  @input="emitConfigUpdate"
                  class="charge-amount"
                />

                <SalesButton size="mini" type="danger" @click="removeOtherCharge(index)">
                  删除
                </SalesButton>
              </view>
            </view>
          </view>

          <SalesButton type="plain" size="small" @click="addOtherCharge">
            + 添加其他费用
          </SalesButton>
        </view>

        <!-- Quote Metadata -->
        <view class="config-subsection">
          <text class="subsection-title">报价信息</text>

          <view class="form-grid">
            <SalesInput
              v-model.number="quoteValidityDays"
              label="有效期 (天)"
              placeholder="30"
              type="number"
              :min="1"
              :max="365"
              @input="$emit('update:validityDays', quoteValidityDays)"
            >
              <template #help>
                <text class="validity-hint"> 有效至：{{ getValidUntilDate() }} </text>
              </template>
            </SalesInput>

            <SalesSelector
              v-model="quotePaymentTerms"
              label="付款条件"
              :options="paymentOptions"
              @change="$emit('update:paymentTerms', quotePaymentTerms)"
            />
          </view>
        </view>
      </view>
    </view>

    <!-- Price Impact Visualization -->
    <view class="price-impact">
      <text class="impact-title">价格影响分析</text>
      <view class="impact-chart">
        <view class="chart-bar">
          <view class="bar-segment original" :style="{ width: '100%' }">
            <text class="segment-label">原价</text>
            <text class="segment-value">¥{{ subtotal.toFixed(2) }}</text>
          </view>
          <view
            v-if="totalDiscountAmount > 0"
            class="bar-segment discount"
            :style="{ width: `${(totalDiscountAmount / subtotal) * 100}%` }"
          >
            <text class="segment-label">优惠</text>
            <text class="segment-value">-¥{{ totalDiscountAmount.toFixed(2) }}</text>
          </view>
        </view>
        <view class="final-price">
          <text class="final-label">最终价格</text>
          <text class="final-value">¥{{ finalTotal.toFixed(2) }}</text>
          <text v-if="totalDiscountAmount > 0" class="savings-badge">
            省¥{{ totalDiscountAmount.toFixed(2) }}
          </text>
        </view>
      </view>
    </view>

    <!-- Step Actions -->
    <view class="step-actions">
      <SalesButton type="default" @click="goBack"> 上一步 </SalesButton>

      <SalesButton type="primary" @click="handleNext" class="next-button">
        下一步：确认提交
      </SalesButton>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import SalesInput from '../SalesInput.vue'
import SalesButton from '../SalesButton.vue'
import SalesSelector from '../SalesSelector.vue'
import type { SelectedProduct } from '@/components/business/ProductSelector.vue'

interface PricingConfig {
  discountType: 'percentage' | 'fixed'
  discountValue: number
  taxRate: number
  taxIncluded: boolean
  deliveryFee: number
  installationFee: number
  otherCharges: Array<{
    id: string
    name: string
    amount: number
    type: 'fixed' | 'percentage'
  }>
}

interface Props {
  config: PricingConfig
  selectedProducts: SelectedProduct[]
  customerType: 'individual' | 'company' | 'dealer' | 'club'
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:config': [config: PricingConfig]
  'update:validityDays': [days: number]
  'update:paymentTerms': [terms: string]
  next: []
  back: []
}>()

// Local config to prevent prop mutation
const localConfig = reactive({ ...props.config })

// UI State
const showCalculator = ref(true)
const showAdvanced = ref(false)
const discountError = ref('')

// Quote metadata (should be moved to parent component ideally)
const quoteValidityDays = ref(30)
const quotePaymentTerms = ref('immediate')

// Payment options
const paymentOptions = [
  { value: 'immediate', label: '立即付款' },
  { value: '30days', label: '30天账期' },
  { value: '60days', label: '60天账期' },
  { value: 'cod', label: '货到付款' }
]

// Customer type configurations
const customerTypeConfig = {
  individual: { discount: 0, name: '个人客户' },
  company: { discount: 0.05, name: '企业客户' },
  dealer: { discount: 0.1, name: '经销商' },
  club: { discount: 0.08, name: '俱乐部' }
}

// Discount presets
const discountPresets = computed(() => {
  if (localConfig.discountType === 'percentage') {
    return [
      { label: '5%', value: 5 },
      { label: '10%', value: 10 },
      { label: '15%', value: 15 },
      { label: '20%', value: 20 }
    ]
  } else {
    const baseAmounts = [100, 200, 500, 1000]
    return baseAmounts.map(amount => ({
      label: `¥${amount}`,
      value: amount
    }))
  }
})

// Computed properties
const subtotal = computed(() => {
  return props.selectedProducts.reduce((sum, item) => sum + item.subtotal, 0)
})

const customerTypeDiscount = computed(() => {
  const config = customerTypeConfig[props.customerType]
  return subtotal.value * config.discount
})

const customerTypeText = computed(() => {
  return customerTypeConfig[props.customerType].name
})

const additionalDiscount = computed(() => {
  if (localConfig.discountType === 'percentage') {
    return subtotal.value * (localConfig.discountValue / 100)
  } else {
    return Math.min(localConfig.discountValue, subtotal.value)
  }
})

const totalDiscountAmount = computed(() => {
  return customerTypeDiscount.value + additionalDiscount.value
})

const discountedSubtotal = computed(() => {
  return Math.max(0, subtotal.value - totalDiscountAmount.value)
})

const totalAdditionalCharges = computed(() => {
  let charges = localConfig.deliveryFee + localConfig.installationFee

  localConfig.otherCharges?.forEach(charge => {
    if (charge.type === 'percentage') {
      charges += discountedSubtotal.value * (charge.amount / 100)
    } else {
      charges += charge.amount || 0
    }
  })

  return charges
})

const taxAmount = computed(() => {
  if (localConfig.taxIncluded) {
    return 0
  }
  return (discountedSubtotal.value + totalAdditionalCharges.value) * (localConfig.taxRate / 100)
})

const finalTotal = computed(() => {
  return discountedSubtotal.value + totalAdditionalCharges.value + taxAmount.value
})

const discountLabel = computed(() => {
  return localConfig.discountType === 'percentage' ? '折扣比例' : '折扣金额'
})

const discountPlaceholder = computed(() => {
  return localConfig.discountType === 'percentage' ? '输入0-50' : '输入折扣金额'
})

const discountUnit = computed(() => {
  return localConfig.discountType === 'percentage' ? '%' : '¥'
})

const discountMax = computed(() => {
  return localConfig.discountType === 'percentage' ? 50 : subtotal.value
})

// Methods
const selectDiscountType = (type: 'percentage' | 'fixed') => {
  localConfig.discountType = type
  localConfig.discountValue = 0
  discountError.value = ''
  emitConfigUpdate()
}

const handleDiscountInput = (value: number) => {
  localConfig.discountValue = value || 0
  discountError.value = ''
  emitConfigUpdate()
}

const validateDiscount = () => {
  const value = localConfig.discountValue

  if (localConfig.discountType === 'percentage') {
    if (value < 0 || value > 50) {
      discountError.value = '折扣比例应在0-50%之间'
      localConfig.discountValue = Math.max(0, Math.min(50, value))
    }
  } else {
    if (value > subtotal.value) {
      discountError.value = '折扣金额不能超过小计'
      localConfig.discountValue = subtotal.value
    }
    if (value < 0) {
      localConfig.discountValue = 0
    }
  }

  emitConfigUpdate()
}

const applyDiscountPreset = (preset: { label: string; value: number }) => {
  localConfig.discountValue = preset.value
  discountError.value = ''
  emitConfigUpdate()

  uni.showToast({
    title: `已应用${preset.label}折扣`,
    icon: 'success',
    duration: 1000
  })
}

const toggleTaxIncluded = () => {
  localConfig.taxIncluded = !localConfig.taxIncluded
  emitConfigUpdate()
}

const addOtherCharge = () => {
  if (!localConfig.otherCharges) {
    localConfig.otherCharges = []
  }

  localConfig.otherCharges.push({
    id: Date.now().toString(),
    name: '',
    amount: 0,
    type: 'fixed'
  })

  emitConfigUpdate()
}

const removeOtherCharge = (index: number) => {
  localConfig.otherCharges?.splice(index, 1)
  emitConfigUpdate()
}

const toggleChargeType = (index: number, type: 'fixed' | 'percentage') => {
  if (localConfig.otherCharges?.[index]) {
    localConfig.otherCharges[index].type = type
    emitConfigUpdate()
  }
}

const getValidUntilDate = () => {
  const date = new Date()
  date.setDate(date.getDate() + quoteValidityDays.value)
  return date.toLocaleDateString('zh-CN')
}

const emitConfigUpdate = () => {
  emit('update:config', { ...localConfig })
}

const goBack = () => {
  emit('back')
}

const handleNext = () => {
  validateDiscount()
  if (!discountError.value) {
    emit('next')
  }
}

// Watch for external config changes
watch(
  () => props.config,
  newConfig => {
    Object.assign(localConfig, newConfig)
  },
  { deep: true }
)
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.step-pricing {
  max-width: 600px;
  margin: 0 auto;
  padding-bottom: 80px;
}

.step-header {
  text-align: center;
  margin-bottom: $spacing-xl;
}

.step-title {
  font-size: $font-size-extra-large;
  font-weight: $font-weight-semibold;
  color: $text-color;
  display: block;
  margin-bottom: $spacing-xs;
}

.step-subtitle {
  font-size: $font-size-small;
  color: $text-color-secondary;
  line-height: 1.4;
}

// Price Calculator
.price-calculator {
  @include card;
  margin-bottom: $spacing-lg;
  padding: 0;
  border-left: 4px solid $primary-color;
}

.calculator-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $spacing-base;
  border-bottom: 1px solid $border-color-lighter;
}

.calc-title {
  font-size: $font-size-base;
  font-weight: $font-weight-medium;
  color: $text-color;
}

.calc-toggle {
  display: flex;
  align-items: center;
  cursor: pointer;
  gap: $spacing-xs;
}

.toggle-text {
  font-size: $font-size-small;
  color: $primary-color;
}

.toggle-icon {
  font-size: $font-size-small;
  color: $primary-color;
}

.calculator-content {
  padding: $spacing-base;
}

.price-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $spacing-sm 0;

  &:not(:last-child) {
    border-bottom: 1px solid $border-color-extra-light;
  }

  &.discount-row {
    .row-value {
      color: $success-color;
    }
  }

  &.subtotal-row {
    border-top: 2px solid $border-color-light;
    border-bottom: 2px solid $border-color-light;
    margin: $spacing-xs 0;
    font-weight: $font-weight-medium;
  }

  &.total-row {
    border-top: 2px solid $primary-color;
    margin-top: $spacing-sm;
    padding-top: $spacing-base;
    font-weight: $font-weight-semibold;

    .row-label,
    .row-value {
      font-size: $font-size-medium;
    }

    .total-value {
      color: $danger-color;
    }
  }
}

.row-label {
  font-size: $font-size-base;
  color: $text-color-secondary;
}

.row-value {
  font-size: $font-size-base;
  color: $text-color;
  font-weight: $font-weight-medium;
}

.discount-value {
  color: $success-color;
}

// Configuration Sections
.config-section {
  @include card;
  margin-bottom: $spacing-lg;
  padding: $spacing-lg;
}

.section-header {
  display: flex;
  align-items: center;
  margin-bottom: $spacing-base;
  cursor: pointer;
}

.section-icon {
  font-size: $font-size-large;
  margin-right: $spacing-sm;
}

.section-title {
  font-size: $font-size-medium;
  font-weight: $font-weight-medium;
  color: $text-color;
  flex: 1;
}

.section-toggle {
  font-size: $font-size-small;
  color: $text-color-secondary;
}

// Discount Type Selector
.discount-type-selector {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $spacing-sm;
  margin-bottom: $spacing-base;
}

.type-option {
  @include card;
  padding: $spacing-base;
  text-align: center;
  cursor: pointer;
  transition: $transition-base;
  border: 2px solid transparent;

  &:active {
    transform: scale(0.98);
  }

  &--active {
    border-color: $primary-color;
    background-color: $primary-bg;
  }
}

.option-icon {
  font-size: $font-size-extra-large;
  font-weight: $font-weight-bold;
  display: block;
  margin-bottom: $spacing-xs;

  .type-option--active & {
    color: $primary-color;
  }
}

.option-label {
  font-size: $font-size-base;
  font-weight: $font-weight-medium;
  color: $text-color;
  display: block;
  margin-bottom: 2px;

  .type-option--active & {
    color: $primary-color;
  }
}

.option-hint {
  font-size: $font-size-small;
  color: $text-color-secondary;
}

.discount-input-section {
  margin-bottom: $spacing-base;
}

.input-unit {
  font-size: $font-size-base;
  color: $text-color-secondary;
  font-weight: $font-weight-medium;
}

.discount-preview {
  font-size: $font-size-small;
  color: $success-color;
  font-weight: $font-weight-medium;
}

.discount-presets {
  margin-top: $spacing-base;
}

.presets-label {
  font-size: $font-size-small;
  color: $text-color-secondary;
  display: block;
  margin-bottom: $spacing-sm;
}

.preset-buttons {
  display: flex;
  gap: $spacing-sm;
  flex-wrap: wrap;
}

// Advanced Content
.advanced-content {
  animation: slideDown 0.3s ease-out;
}

.config-subsection {
  margin-bottom: $spacing-xl;

  &:last-child {
    margin-bottom: 0;
  }
}

.subsection-title {
  font-size: $font-size-base;
  font-weight: $font-weight-medium;
  color: $text-color;
  display: block;
  margin-bottom: $spacing-base;
  padding-bottom: $spacing-sm;
  border-bottom: 1px solid $border-color-lighter;
}

.form-row {
  display: flex;
  align-items: flex-end;
  gap: $spacing-base;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $spacing-base;
  margin-bottom: $spacing-base;
}

.tax-included-option {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: $spacing-sm;
  border-radius: $border-radius-base;
  transition: $transition-base;

  &:active {
    background-color: $bg-color-page;
  }
}

.checkbox {
  width: 20px;
  height: 20px;
  border: 2px solid $border-color;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: $spacing-sm;
  transition: $transition-base;

  &--checked {
    background-color: $primary-color;
    border-color: $primary-color;
  }
}

.checkbox-check {
  color: white;
  font-size: $font-size-small;
  font-weight: $font-weight-bold;
}

.checkbox-label {
  font-size: $font-size-base;
  color: $text-color;
}

.input-icon {
  font-size: $font-size-base;
  margin-right: $spacing-xs;
}

// Other Charges
.other-charges {
  margin: $spacing-base 0;
}

.charge-item {
  background-color: $bg-color-page;
  border-radius: $border-radius-base;
  padding: $spacing-base;
  margin-bottom: $spacing-base;

  &:last-child {
    margin-bottom: 0;
  }
}

.charge-name {
  margin-bottom: $spacing-sm;
}

.charge-controls {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
}

.charge-type-toggle {
  display: flex;
  gap: $spacing-xs;
}

.charge-amount {
  flex: 1;
}

.validity-hint {
  font-size: $font-size-small;
  color: $success-color;
}

// Price Impact Visualization
.price-impact {
  @include card;
  margin-bottom: $spacing-lg;
  padding: $spacing-lg;
  background: linear-gradient(135deg, $primary-bg, $success-bg);
}

.impact-title {
  font-size: $font-size-base;
  font-weight: $font-weight-medium;
  color: $text-color;
  display: block;
  margin-bottom: $spacing-base;
}

.impact-chart {
  margin-bottom: $spacing-base;
}

.chart-bar {
  height: 40px;
  border-radius: $border-radius-base;
  overflow: hidden;
  position: relative;
  margin-bottom: $spacing-base;
  box-shadow: $box-shadow-base;
}

.bar-segment {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: $font-weight-medium;
  position: absolute;
  top: 0;

  &.original {
    background: linear-gradient(90deg, $danger-color, $danger-light);
    left: 0;
  }

  &.discount {
    background: linear-gradient(90deg, $success-color, $success-light);
    right: 0;
  }
}

.segment-label {
  font-size: $font-size-small;
  display: block;
}

.segment-value {
  font-size: $font-size-base;
  font-weight: $font-weight-semibold;
}

.final-price {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.9);
  padding: $spacing-base;
  border-radius: $border-radius-base;
}

.final-label {
  font-size: $font-size-base;
  color: $text-color-secondary;
}

.final-value {
  font-size: $font-size-large;
  font-weight: $font-weight-bold;
  color: $danger-color;
}

.savings-badge {
  background-color: $success-color;
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: $font-size-small;
  font-weight: $font-weight-medium;
}

// Step Actions
.step-actions {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: $bg-color-white;
  border-top: 1px solid $border-color-lighter;
  padding: $spacing-base;
  padding-bottom: calc(#{$spacing-base} + env(safe-area-inset-bottom));
  display: flex;
  gap: $spacing-base;
  z-index: $z-index-fixed;
}

.next-button {
  flex: 2;
}

// Animations
@keyframes slideDown {
  from {
    opacity: 0;
    max-height: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    max-height: 1000px;
    transform: translateY(0);
  }
}

// Responsive Design
@media (max-width: $breakpoint-sm) {
  .form-grid {
    grid-template-columns: 1fr;
  }

  .form-row {
    flex-direction: column;
    align-items: stretch;
  }

  .discount-type-selector {
    grid-template-columns: 1fr;
  }

  .charge-controls {
    flex-wrap: wrap;
  }
}

@media (min-width: $breakpoint-lg) {
  .discount-type-selector {
    max-width: 400px;
  }

  .preset-buttons {
    max-width: 500px;
  }
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .type-option,
  .advanced-content {
    animation: none;
    transition: none;
  }
}
</style>
