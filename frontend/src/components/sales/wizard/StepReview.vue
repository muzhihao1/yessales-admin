<!--
  Quote Wizard - Step 4: Review & Submit
  Final review with comprehensive quote summary
-->
<template>
  <view class="step-review">
    <view class="step-header">
      <text class="step-title">确认报价</text>
      <text class="step-subtitle">请仔细核对以下信息，确认无误后提交报价</text>
    </view>

    <!-- Quote Summary Header -->
    <view class="quote-header">
      <view class="quote-number">
        <text class="number-label">报价编号</text>
        <text class="number-value">{{ quoteMetadata.quoteNumber }}</text>
      </view>
      <view class="quote-meta">
        <text class="meta-item">有效期: {{ quoteMetadata.validityDays }}天</text>
        <text class="meta-item">创建时间: {{ formatDate(new Date()) }}</text>
      </view>
    </view>

    <!-- Customer Information Review -->
    <view class="review-section">
      <view class="section-header">
        <text class="section-icon">👤</text>
        <text class="section-title">客户信息</text>
        <SalesButton size="mini" type="plain" @click="editStep(1)"> 修改 </SalesButton>
      </view>

      <view class="info-grid">
        <view class="info-item">
          <text class="info-label">姓名</text>
          <text class="info-value">{{ customerForm.customerName }}</text>
        </view>
        <view class="info-item">
          <text class="info-label">电话</text>
          <text class="info-value">{{ formatPhone(customerForm.customerPhone) }}</text>
        </view>
        <view v-if="customerForm.customerWechat" class="info-item">
          <text class="info-label">微信</text>
          <text class="info-value">{{ customerForm.customerWechat }}</text>
        </view>
        <view v-if="customerForm.customerEmail" class="info-item">
          <text class="info-label">邮箱</text>
          <text class="info-value">{{ customerForm.customerEmail }}</text>
        </view>
        <view class="info-item">
          <text class="info-label">客户类型</text>
          <view class="customer-type-badge">
            <text class="badge-text">{{ getCustomerTypeName(customerForm.customerType) }}</text>
            <text v-if="getCustomerDiscount(customerForm.customerType) > 0" class="badge-discount">
              {{ getCustomerDiscount(customerForm.customerType) }}%优惠
            </text>
          </view>
        </view>
      </view>

      <!-- Address (if provided) -->
      <view v-if="customerForm.customerAddress" class="address-section">
        <text class="info-label">地址</text>
        <text class="info-value">
          {{ customerForm.customerProvince }} {{ customerForm.customerCity }}
          {{ customerForm.customerAddress }}
        </text>
      </view>

      <!-- Remarks (if provided) -->
      <view v-if="customerForm.customerRemark" class="remarks-section">
        <text class="info-label">备注</text>
        <text class="info-value">{{ customerForm.customerRemark }}</text>
      </view>
    </view>

    <!-- Products Review -->
    <view class="review-section">
      <view class="section-header">
        <text class="section-icon">📦</text>
        <text class="section-title">选择产品 ({{ selectedProducts.length }}种)</text>
        <SalesButton size="mini" type="plain" @click="editStep(2)"> 修改 </SalesButton>
      </view>

      <view class="products-list">
        <view
          v-for="(item, index) in selectedProducts"
          :key="`${item.product.id}-${item.skuId || 'default'}`"
          class="product-item"
        >
          <image
            class="product-image"
            :src="item.product.image || '/static/images/default-product.png'"
            mode="aspectFill"
          />
          <view class="product-details">
            <text class="product-name">{{ item.product.name }}</text>
            <text class="product-spec">
              {{ item.product.model }}
              <text v-if="item.skuName"> - {{ item.skuName }}</text>
            </text>
            <view class="product-pricing">
              <text class="unit-price">单价: ¥{{ item.price }}</text>
              <text class="quantity">数量: {{ item.quantity }}{{ item.product.unit || '个' }}</text>
              <text class="subtotal">小计: ¥{{ item.subtotal.toFixed(2) }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- Pricing Review -->
    <view class="review-section">
      <view class="section-header">
        <text class="section-icon">💰</text>
        <text class="section-title">价格配置</text>
        <SalesButton size="mini" type="plain" @click="editStep(3)"> 修改 </SalesButton>
      </view>

      <view class="pricing-breakdown">
        <!-- Base Pricing -->
        <view class="breakdown-group">
          <text class="group-title">基础费用</text>
          <view class="breakdown-item">
            <text class="item-label">产品小计</text>
            <text class="item-value">¥{{ productSubtotal.toFixed(2) }}</text>
          </view>
        </view>

        <!-- Discounts -->
        <view v-if="hasDiscounts" class="breakdown-group discount-group">
          <text class="group-title">优惠折扣</text>
          <view v-if="customerTypeDiscount > 0" class="breakdown-item">
            <text class="item-label">{{ getCustomerTypeName(customerForm.customerType) }}优惠</text>
            <text class="item-value discount-value">-¥{{ customerTypeDiscount.toFixed(2) }}</text>
          </view>
          <view v-if="additionalDiscount > 0" class="breakdown-item">
            <text class="item-label">
              额外折扣 ({{
                pricingConfig.discountType === 'percentage'
                  ? `${pricingConfig.discountValue}%`
                  : `¥${pricingConfig.discountValue}`
              }})
            </text>
            <text class="item-value discount-value">-¥{{ additionalDiscount.toFixed(2) }}</text>
          </view>
          <view class="breakdown-item subtotal-item">
            <text class="item-label">折扣后小计</text>
            <text class="item-value">¥{{ discountedSubtotal.toFixed(2) }}</text>
          </view>
        </view>

        <!-- Additional Charges -->
        <view v-if="hasAdditionalCharges" class="breakdown-group">
          <text class="group-title">附加费用</text>
          <view v-if="pricingConfig.deliveryFee > 0" class="breakdown-item">
            <text class="item-label">配送费</text>
            <text class="item-value">+¥{{ pricingConfig.deliveryFee.toFixed(2) }}</text>
          </view>
          <view v-if="pricingConfig.installationFee > 0" class="breakdown-item">
            <text class="item-label">安装费</text>
            <text class="item-value">+¥{{ pricingConfig.installationFee.toFixed(2) }}</text>
          </view>
          <view
            v-for="charge in pricingConfig.otherCharges"
            :key="charge.id"
            class="breakdown-item"
          >
            <text class="item-label">{{ charge.name }}</text>
            <text class="item-value">+¥{{ calculateOtherChargeAmount(charge).toFixed(2) }}</text>
          </view>
        </view>

        <!-- Tax -->
        <view v-if="taxAmount > 0" class="breakdown-group">
          <text class="group-title">税费</text>
          <view class="breakdown-item">
            <text class="item-label">增值税 ({{ pricingConfig.taxRate }}%)</text>
            <text class="item-value">+¥{{ taxAmount.toFixed(2) }}</text>
          </view>
        </view>

        <!-- Final Total -->
        <view class="breakdown-group total-group">
          <view class="breakdown-item total-item">
            <text class="item-label">合计金额</text>
            <text class="item-value total-value">¥{{ totalPrice.toFixed(2) }}</text>
          </view>
          <view v-if="totalSavings > 0" class="savings-summary">
            <text class="savings-text">已为您节省 ¥{{ totalSavings.toFixed(2) }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- Quote Terms -->
    <view class="review-section">
      <view class="section-header">
        <text class="section-icon">📋</text>
        <text class="section-title">报价条款</text>
      </view>

      <view class="terms-list">
        <view class="term-item">
          <text class="term-label">报价有效期</text>
          <text class="term-value"
            >{{ quoteMetadata.validityDays }}天 (至{{ getValidUntilDate() }})</text
          >
        </view>
        <view class="term-item">
          <text class="term-label">付款条件</text>
          <text class="term-value">{{ getPaymentTermsText(quoteMetadata.paymentTerms) }}</text>
        </view>
        <view v-if="pricingConfig.taxIncluded" class="term-item">
          <text class="term-label">价格说明</text>
          <text class="term-value">以上价格为含税价格</text>
        </view>
        <view class="term-item">
          <text class="term-label">报价说明</text>
          <text class="term-value">本报价仅对本次询价有效，如有变动恕不另行通知</text>
        </view>
      </view>
    </view>

    <!-- Additional Notes (if any) -->
    <view v-if="quoteMetadata.specialTerms" class="review-section">
      <view class="section-header">
        <text class="section-icon">📝</text>
        <text class="section-title">特殊条款</text>
      </view>
      <view class="special-terms">
        <text class="terms-text">{{ quoteMetadata.specialTerms }}</text>
      </view>
    </view>

    <!-- Final Actions -->
    <view class="review-actions">
      <view class="action-summary">
        <text class="summary-text">请确认以上信息无误</text>
        <view class="final-total">
          <text class="total-label">合计金额：</text>
          <text class="total-amount">¥{{ totalPrice.toFixed(2) }}</text>
        </view>
      </view>

      <view class="action-buttons">
        <SalesButton type="default" @click="goBack"> 返回修改 </SalesButton>

        <SalesButton
          type="primary"
          @click="handleSubmit"
          :loading="submitting"
          class="submit-button"
        >
          确认生成报价
        </SalesButton>
      </view>
    </view>

    <!-- Success Animation Placeholder -->
    <view v-if="showSuccess" class="success-overlay">
      <view class="success-content">
        <text class="success-icon">✅</text>
        <text class="success-title">报价生成成功！</text>
        <text class="success-subtitle">正在跳转到报价预览...</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import SalesButton from '../SalesButton.vue'
import { dialog, toast } from '@/utils/platform-adapter'
import type { SelectedProduct } from '@/components/business/ProductSelector.vue'

interface CustomerForm {
  customerName: string
  customerPhone: string
  customerWechat: string
  customerEmail: string
  customerProvince: string
  customerCity: string
  customerAddress: string
  customerType: 'individual' | 'company' | 'dealer' | 'club'
  customerRemark: string
  saveCustomer: boolean
}

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

interface QuoteMetadata {
  quoteNumber: string
  validityDays: number
  paymentTerms: 'immediate' | '30days' | '60days' | 'cod'
  specialTerms: string
}

interface Props {
  customerForm: CustomerForm
  selectedProducts: SelectedProduct[]
  pricingConfig: PricingConfig
  quoteMetadata: QuoteMetadata
  totalPrice: number
  submitting: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  submit: []
  back: []
}>()

// UI State
const showSuccess = ref(false)

// Customer type configurations
const customerTypeConfig = {
  individual: { discount: 0, name: '个人客户' },
  company: { discount: 0.05, name: '企业客户' },
  dealer: { discount: 0.1, name: '经销商' },
  club: { discount: 0.08, name: '俱乐部' }
}

// Payment terms mapping
const paymentTermsMapping = {
  immediate: '立即付款',
  '30days': '30天账期',
  '60days': '60天账期',
  cod: '货到付款'
}

// Computed properties
const productSubtotal = computed(() => {
  return props.selectedProducts.reduce((sum, item) => sum + item.subtotal, 0)
})

const customerTypeDiscount = computed(() => {
  const config = customerTypeConfig[props.customerForm.customerType]
  return productSubtotal.value * config.discount
})

const additionalDiscount = computed(() => {
  if (props.pricingConfig.discountType === 'percentage') {
    return productSubtotal.value * (props.pricingConfig.discountValue / 100)
  } else {
    return Math.min(props.pricingConfig.discountValue, productSubtotal.value)
  }
})

const totalDiscountAmount = computed(() => {
  return customerTypeDiscount.value + additionalDiscount.value
})

const discountedSubtotal = computed(() => {
  return Math.max(0, productSubtotal.value - totalDiscountAmount.value)
})

const totalAdditionalCharges = computed(() => {
  let charges = props.pricingConfig.deliveryFee + props.pricingConfig.installationFee

  props.pricingConfig.otherCharges?.forEach(charge => {
    charges += calculateOtherChargeAmount(charge)
  })

  return charges
})

const taxAmount = computed(() => {
  if (props.pricingConfig.taxIncluded) {
    return 0
  }
  return (
    (discountedSubtotal.value + totalAdditionalCharges.value) * (props.pricingConfig.taxRate / 100)
  )
})

const hasDiscounts = computed(() => {
  return customerTypeDiscount.value > 0 || additionalDiscount.value > 0
})

const hasAdditionalCharges = computed(() => {
  return totalAdditionalCharges.value > 0
})

const totalSavings = computed(() => {
  return totalDiscountAmount.value
})

// Methods
const formatDate = (date: Date) => {
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

const formatPhone = (phone: string) => {
  if (phone.length === 11) {
    return phone.replace(/(\d{3})(\d{4})(\d{4})/, '$1 $2 $3')
  }
  return phone
}

const getCustomerTypeName = (type: string) => {
  return customerTypeConfig[type]?.name || '个人客户'
}

const getCustomerDiscount = (type: string) => {
  return (customerTypeConfig[type]?.discount || 0) * 100
}

const getValidUntilDate = () => {
  const date = new Date()
  date.setDate(date.getDate() + props.quoteMetadata.validityDays)
  return date.toLocaleDateString('zh-CN')
}

const getPaymentTermsText = (terms: string) => {
  return paymentTermsMapping[terms] || '立即付款'
}

const calculateOtherChargeAmount = (charge: { amount: number; type: 'fixed' | 'percentage' }) => {
  if (charge.type === 'percentage') {
    return discountedSubtotal.value * (charge.amount / 100)
  } else {
    return charge.amount || 0
  }
}

const editStep = async (stepNumber: number) => {
  // This would typically emit an event to go back to a specific step
  const confirmed = await dialog.confirm({
    title: '返回修改',
    content: `确定要返回第${stepNumber}步进行修改吗？`
  })

  if (confirmed) {
    // In a real implementation, this would navigate back to the specific step
    emit('back')
  }
}

const goBack = () => {
  emit('back')
}

const handleSubmit = () => {
  // Show loading state
  showSuccess.value = true

  // Emit submit event
  emit('submit')

  // In case of success, the parent component should handle navigation
  // The success animation will be shown until navigation occurs
}
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.step-review {
  max-width: 700px;
  margin: 0 auto;
  padding-bottom: $spacing-base; // Reduce excessive padding
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

// Quote Header
.quote-header {
  @include card;
  background: linear-gradient(135deg, $primary-color, $primary-light);
  color: white;
  padding: $spacing-lg;
  margin-bottom: $spacing-lg;
  text-align: center;
}

.quote-number {
  margin-bottom: $spacing-base;
}

.number-label {
  font-size: $font-size-small;
  display: block;
  opacity: 0.9;
  margin-bottom: $spacing-xs;
}

.number-value {
  font-size: $font-size-large;
  font-weight: $font-weight-bold;
  font-family: 'Courier New', monospace;
}

.quote-meta {
  display: flex;
  justify-content: center;
  gap: $spacing-lg;
}

.meta-item {
  font-size: $font-size-small;
  opacity: 0.9;
}

// Review Sections
.review-section {
  @include card;
  margin-bottom: $spacing-lg;
  padding: $spacing-lg;
  border-left: 4px solid $primary-color;
}

.section-header {
  display: flex;
  align-items: center;
  margin-bottom: $spacing-base;
  padding-bottom: $spacing-sm;
  border-bottom: 1px solid $border-color-lighter;
}

.section-icon {
  font-size: $font-size-large;
  margin-right: $spacing-sm;
}

.section-title {
  font-size: $font-size-medium;
  font-weight: $font-weight-semibold;
  color: $text-color;
  flex: 1;
}

// Customer Information
.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $spacing-base;
  margin-bottom: $spacing-base;
}

.info-item {
  display: flex;
  flex-direction: column;
}

.info-label {
  font-size: $font-size-small;
  color: $text-color-secondary;
  margin-bottom: $spacing-xs;
}

.info-value {
  font-size: $font-size-base;
  color: $text-color;
  font-weight: $font-weight-medium;
}

.customer-type-badge {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
}

.badge-text {
  background-color: $primary-bg;
  color: $primary-color;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: $font-size-small;
  font-weight: $font-weight-medium;
}

.badge-discount {
  background-color: $success-color;
  color: white;
  padding: 2px 6px;
  border-radius: 8px;
  font-size: $font-size-extra-small;
  font-weight: $font-weight-medium;
}

.address-section,
.remarks-section {
  margin-top: $spacing-base;
  padding-top: $spacing-base;
  border-top: 1px solid $border-color-extra-light;
}

// Products List
.products-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-base;
}

.product-item {
  display: flex;
  align-items: flex-start;
  background-color: $bg-color-page;
  padding: $spacing-base;
  border-radius: $border-radius-base;
}

.product-image {
  width: 80px;
  height: 80px;
  border-radius: $border-radius-base;
  margin-right: $spacing-base;
  background-color: $bg-color-white;
}

.product-details {
  flex: 1;
}

.product-name {
  font-size: $font-size-base;
  font-weight: $font-weight-medium;
  color: $text-color;
  display: block;
  margin-bottom: $spacing-xs;
}

.product-spec {
  font-size: $font-size-small;
  color: $text-color-secondary;
  display: block;
  margin-bottom: $spacing-sm;
}

.product-pricing {
  display: flex;
  gap: $spacing-base;
}

.unit-price,
.quantity,
.subtotal {
  font-size: $font-size-small;
  color: $text-color-secondary;
}

.subtotal {
  color: $danger-color;
  font-weight: $font-weight-semibold;
}

// Pricing Breakdown
.pricing-breakdown {
  display: flex;
  flex-direction: column;
  gap: $spacing-base;
}

.breakdown-group {
  background-color: $bg-color-page;
  padding: $spacing-base;
  border-radius: $border-radius-base;

  &.discount-group {
    background-color: $success-bg;
  }

  &.total-group {
    background: linear-gradient(135deg, $primary-bg, $info-bg);
    border: 2px solid $primary-color;
  }
}

.group-title {
  font-size: $font-size-small;
  font-weight: $font-weight-semibold;
  color: $text-color-secondary;
  display: block;
  margin-bottom: $spacing-sm;
  padding-bottom: $spacing-xs;
  border-bottom: 1px solid $border-color-lighter;
}

.breakdown-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $spacing-xs 0;

  &:not(:last-child) {
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  }

  &.subtotal-item {
    margin-top: $spacing-xs;
    padding-top: $spacing-sm;
    border-top: 2px solid $border-color;
    font-weight: $font-weight-medium;
  }

  &.total-item {
    font-size: $font-size-medium;
    font-weight: $font-weight-bold;
    padding: $spacing-sm 0;
  }
}

.item-label {
  font-size: $font-size-base;
  color: $text-color;
}

.item-value {
  font-size: $font-size-base;
  color: $text-color;
  font-weight: $font-weight-medium;

  &.discount-value {
    color: $success-color;
  }

  &.total-value {
    color: $danger-color;
    font-size: $font-size-large;
  }
}

.savings-summary {
  text-align: center;
  margin-top: $spacing-sm;
}

.savings-text {
  background-color: $success-color;
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: $font-size-small;
  font-weight: $font-weight-medium;
}

// Terms
.terms-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}

.term-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: $spacing-sm;
  background-color: $bg-color-page;
  border-radius: $border-radius-base;
}

.term-label {
  font-size: $font-size-small;
  color: $text-color-secondary;
  font-weight: $font-weight-medium;
}

.term-value {
  font-size: $font-size-small;
  color: $text-color;
  text-align: right;
  max-width: 60%;
}

.special-terms {
  background-color: $warning-bg;
  border: 1px solid $warning-color;
  border-radius: $border-radius-base;
  padding: $spacing-base;
}

.terms-text {
  font-size: $font-size-base;
  color: $text-color;
  line-height: 1.6;
}

// Final Actions
.review-actions {
  @include card;
  margin-top: $spacing-xl;
  padding: $spacing-lg;
  border: 2px solid $primary-color;
  background: linear-gradient(135deg, $primary-bg, $bg-color-white);
}

.action-summary {
  text-align: center;
  margin-bottom: $spacing-lg;
}

.summary-text {
  font-size: $font-size-base;
  color: $text-color-secondary;
  display: block;
  margin-bottom: $spacing-base;
}

.final-total {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: $spacing-sm;
}

.total-label {
  font-size: $font-size-large;
  color: $text-color;
  font-weight: $font-weight-medium;
}

.total-amount {
  font-size: $font-size-extra-large;
  font-weight: $font-weight-bold;
  color: $danger-color;
}

.action-buttons {
  display: flex;
  gap: $spacing-base;
}

.submit-button {
  flex: 2;
  height: 50px;
  font-size: $font-size-medium;
  font-weight: $font-weight-semibold;
}

// Success Overlay
.success-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: $z-index-modal;
}

.success-content {
  background-color: white;
  padding: $spacing-xl;
  border-radius: $border-radius-lg;
  text-align: center;
  max-width: 300px;
  animation: scaleIn 0.3s ease-out;
}

.success-icon {
  font-size: 60px;
  display: block;
  margin-bottom: $spacing-base;
  animation: bounce 0.6s ease-in-out;
}

.success-title {
  font-size: $font-size-large;
  font-weight: $font-weight-semibold;
  color: $text-color;
  display: block;
  margin-bottom: $spacing-sm;
}

.success-subtitle {
  font-size: $font-size-base;
  color: $text-color-secondary;
}

// Animations
@keyframes scaleIn {
  from {
    transform: scale(0.8);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes bounce {
  0%,
  20%,
  60%,
  100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-10px);
  }
  80% {
    transform: translateY(-5px);
  }
}

// Responsive Design
@media (max-width: $breakpoint-sm) {
  .info-grid {
    grid-template-columns: 1fr;
  }

  .product-pricing {
    flex-direction: column;
    gap: 2px;
  }

  .term-item {
    flex-direction: column;
    align-items: stretch;
    gap: $spacing-xs;
  }

  .term-value {
    text-align: left;
    max-width: 100%;
  }

  .action-buttons {
    flex-direction: column;
  }

  .quote-meta {
    flex-direction: column;
    gap: $spacing-xs;
  }
}

@media (min-width: $breakpoint-lg) {
  .info-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .products-list {
    max-height: 400px;
    overflow-y: auto;
    padding-right: $spacing-xs;
  }
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .success-content,
  .success-icon {
    animation: none;
  }
}

/* Print styles for quote review */
@media print {
  .section-header button,
  .action-buttons {
    display: none !important;
  }

  .review-section {
    break-inside: avoid;
    margin-bottom: $spacing-base;
  }
}
</style>
