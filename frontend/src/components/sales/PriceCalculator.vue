<!--
  Real-time Price Calculator Component
  Provides instant pricing feedback with animations and breakdowns
-->
<template>
  <view class="price-calculator" :class="{ 'price-calculator--sticky': sticky }">
    <!-- Calculator Header -->
    <view class="calculator-header" @click="toggleExpanded">
      <view class="header-left">
        <text class="calculator-icon">💰</text>
        <text class="calculator-title">价格计算</text>
      </view>

      <view class="header-right">
        <text class="total-price">¥{{ animatedTotal }}</text>
        <text class="expand-icon">{{ expanded ? '▲' : '▼' }}</text>
      </view>
    </view>

    <!-- Expandable Content -->
    <view v-if="expanded" class="calculator-content">
      <!-- Product Summary -->
      <view class="calculation-section">
        <text class="section-title">产品明细</text>
        <view class="items-summary">
          <view
            v-for="(item, index) in selectedProducts"
            :key="`${item.product.id}-${item.skuId || 'default'}`"
            class="item-row"
            :class="{ 'item-row--highlight': highlightIndex === index }"
          >
            <view class="item-info">
              <text class="item-name">{{ item.product.name }}</text>
              <text class="item-spec">
                {{ item.quantity }}{{ item.product.unit || '个' }}
                <text v-if="item.skuName"> × {{ item.skuName }}</text>
              </text>
            </view>
            <text class="item-total">¥{{ item.subtotal.toFixed(2) }}</text>
          </view>

          <view class="subtotal-row">
            <text class="subtotal-label">产品小计</text>
            <text class="subtotal-value">¥{{ productSubtotal.toFixed(2) }}</text>
          </view>
        </view>
      </view>

      <!-- Discount Section -->
      <view v-if="hasDiscounts" class="calculation-section discount-section">
        <text class="section-title">优惠折扣</text>
        <view class="discount-breakdown">
          <!-- Customer Type Discount -->
          <view v-if="customerTypeDiscount > 0" class="discount-row">
            <view class="discount-info">
              <text class="discount-name">{{ customerTypeName }}优惠</text>
              <text class="discount-rate">({{ (customerDiscountRate * 100).toFixed(0) }}%)</text>
            </view>
            <text class="discount-amount">-¥{{ customerTypeDiscount.toFixed(2) }}</text>
          </view>

          <!-- Additional Discount -->
          <view v-if="additionalDiscount > 0" class="discount-row">
            <view class="discount-info">
              <text class="discount-name">额外折扣</text>
              <text class="discount-rate">
                ({{ discountType === 'percentage' ? `${discountValue}%` : `¥${discountValue}` }})
              </text>
            </view>
            <text class="discount-amount">-¥{{ additionalDiscount.toFixed(2) }}</text>
          </view>

          <!-- Total Savings -->
          <view class="savings-row">
            <text class="savings-label">共节省</text>
            <text class="savings-amount">¥{{ totalSavings.toFixed(2) }}</text>
          </view>
        </view>
      </view>

      <!-- Additional Charges -->
      <view v-if="hasAdditionalCharges" class="calculation-section">
        <text class="section-title">附加费用</text>
        <view class="charges-breakdown">
          <view v-if="deliveryFee > 0" class="charge-row">
            <text class="charge-name">配送费</text>
            <text class="charge-amount">+¥{{ deliveryFee.toFixed(2) }}</text>
          </view>

          <view v-if="installationFee > 0" class="charge-row">
            <text class="charge-name">安装费</text>
            <text class="charge-amount">+¥{{ installationFee.toFixed(2) }}</text>
          </view>

          <view v-for="charge in otherCharges" :key="charge.id" class="charge-row">
            <text class="charge-name">{{ charge.name || '其他费用' }}</text>
            <text class="charge-amount">+¥{{ calculateChargeAmount(charge).toFixed(2) }}</text>
          </view>
        </view>
      </view>

      <!-- Tax Section -->
      <view v-if="taxAmount > 0" class="calculation-section">
        <text class="section-title">税费计算</text>
        <view class="tax-breakdown">
          <view class="tax-row">
            <view class="tax-info">
              <text class="tax-name">增值税</text>
              <text class="tax-rate">({{ taxRate }}%)</text>
            </view>
            <text class="tax-amount">+¥{{ taxAmount.toFixed(2) }}</text>
          </view>

          <view v-if="taxIncluded" class="tax-note">
            <text class="note-text">* 以上为含税价格</text>
          </view>
        </view>
      </view>

      <!-- Final Total -->
      <view class="total-section">
        <view class="total-breakdown">
          <view class="total-row">
            <text class="total-label">最终金额</text>
            <text class="final-amount">¥{{ finalTotal.toFixed(2) }}</text>
          </view>

          <!-- Savings Indicator -->
          <view v-if="totalSavings > 0" class="savings-indicator">
            <text class="savings-text">相比原价节省了 ¥{{ totalSavings.toFixed(2) }}</text>
            <text class="savings-percentage">
              ({{ ((totalSavings / (productSubtotal + totalSavings)) * 100).toFixed(1) }}%)
            </text>
          </view>
        </view>
      </view>

      <!-- Quick Actions -->
      <view class="calculator-actions">
        <SalesButton size="small" type="plain" @click="exportCalculation"> 导出明细 </SalesButton>

        <SalesButton size="small" type="plain" @click="resetCalculation"> 重新计算 </SalesButton>
      </view>
    </view>

    <!-- Price Change Animation -->
    <view v-if="showPriceChange" class="price-change-indicator" :class="priceChangeClass">
      <text class="change-icon">{{ priceChangeIcon }}</text>
      <text class="change-text">{{ priceChangeText }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import SalesButton from './SalesButton.vue'
import type { SelectedProduct } from '@/components/business/ProductSelector.vue'

interface Props {
  selectedProducts: SelectedProduct[]
  customerType: 'individual' | 'company' | 'dealer' | 'club'
  discountType: 'percentage' | 'fixed'
  discountValue: number
  deliveryFee: number
  installationFee: number
  otherCharges: Array<{
    id: string
    name: string
    amount: number
    type: 'fixed' | 'percentage'
  }>
  taxRate: number
  taxIncluded: boolean
  sticky?: boolean
  autoExpand?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  sticky: false,
  autoExpand: false
})

const emit = defineEmits<{
  export: [calculation: any]
  reset: []
  highlight: [productIndex: number]
}>()

// UI State
const expanded = ref(props.autoExpand)
const highlightIndex = ref(-1)
const showPriceChange = ref(false)
const priceChangeDirection = ref<'up' | 'down'>('up')
const animatedTotal = ref('0.00')

// Customer type configurations
const customerTypeConfig = {
  individual: { discount: 0, name: '个人客户' },
  company: { discount: 0.05, name: '企业客户' },
  dealer: { discount: 0.1, name: '经销商' },
  club: { discount: 0.08, name: '俱乐部' }
}

// Computed properties
const productSubtotal = computed(() => {
  return props.selectedProducts.reduce((sum, item) => sum + item.subtotal, 0)
})

const customerDiscountRate = computed(() => {
  return customerTypeConfig[props.customerType]?.discount || 0
})

const customerTypeName = computed(() => {
  return customerTypeConfig[props.customerType]?.name || '个人客户'
})

const customerTypeDiscount = computed(() => {
  return productSubtotal.value * customerDiscountRate.value
})

const additionalDiscount = computed(() => {
  if (props.discountType === 'percentage') {
    return productSubtotal.value * (props.discountValue / 100)
  } else {
    return Math.min(props.discountValue, productSubtotal.value)
  }
})

const totalSavings = computed(() => {
  return customerTypeDiscount.value + additionalDiscount.value
})

const discountedSubtotal = computed(() => {
  return Math.max(0, productSubtotal.value - totalSavings.value)
})

const totalAdditionalCharges = computed(() => {
  let charges = props.deliveryFee + props.installationFee

  props.otherCharges?.forEach(charge => {
    charges += calculateChargeAmount(charge)
  })

  return charges
})

const taxAmount = computed(() => {
  if (props.taxIncluded) {
    return 0
  }
  return (discountedSubtotal.value + totalAdditionalCharges.value) * (props.taxRate / 100)
})

const finalTotal = computed(() => {
  return discountedSubtotal.value + totalAdditionalCharges.value + taxAmount.value
})

const hasDiscounts = computed(() => {
  return totalSavings.value > 0
})

const hasAdditionalCharges = computed(() => {
  return totalAdditionalCharges.value > 0
})

const priceChangeClass = computed(() => {
  return `price-change--${priceChangeDirection.value}`
})

const priceChangeIcon = computed(() => {
  return priceChangeDirection.value === 'up' ? '📈' : '📉'
})

const priceChangeText = computed(() => {
  return priceChangeDirection.value === 'up' ? '价格上涨' : '价格下降'
})

// Methods
const calculateChargeAmount = (charge: { amount: number; type: 'fixed' | 'percentage' }) => {
  if (charge.type === 'percentage') {
    return discountedSubtotal.value * (charge.amount / 100)
  } else {
    return charge.amount || 0
  }
}

const toggleExpanded = () => {
  expanded.value = !expanded.value
}

const animateTotal = (newTotal: number) => {
  const currentTotal = parseFloat(animatedTotal.value)
  const diff = newTotal - currentTotal
  const steps = 20
  const stepSize = diff / steps
  let current = currentTotal

  const animate = () => {
    current += stepSize
    animatedTotal.value =
      Math.abs(current - newTotal) < 0.01 ? newTotal.toFixed(2) : current.toFixed(2)

    if (Math.abs(current - newTotal) > 0.01) {
      requestAnimationFrame(animate)
    }
  }

  animate()
}

const showPriceChangeAnimation = (direction: 'up' | 'down') => {
  priceChangeDirection.value = direction
  showPriceChange.value = true

  setTimeout(() => {
    showPriceChange.value = false
  }, 2000)
}

const highlightProduct = (index: number) => {
  highlightIndex.value = index
  emit('highlight', index)

  setTimeout(() => {
    highlightIndex.value = -1
  }, 1500)
}

const exportCalculation = () => {
  const calculationData = {
    products: props.selectedProducts,
    subtotal: productSubtotal.value,
    discounts: {
      customerType: {
        name: customerTypeName.value,
        amount: customerTypeDiscount.value,
        rate: customerDiscountRate.value
      },
      additional: {
        type: props.discountType,
        value: props.discountValue,
        amount: additionalDiscount.value
      },
      total: totalSavings.value
    },
    charges: {
      delivery: props.deliveryFee,
      installation: props.installationFee,
      other: props.otherCharges.map(charge => ({
        ...charge,
        calculatedAmount: calculateChargeAmount(charge)
      })),
      total: totalAdditionalCharges.value
    },
    tax: {
      rate: props.taxRate,
      amount: taxAmount.value,
      included: props.taxIncluded
    },
    final: finalTotal.value,
    timestamp: new Date().toISOString()
  }

  emit('export', calculationData)

  uni.showToast({
    title: '计算明细已导出',
    icon: 'success'
  })
}

const resetCalculation = () => {
  uni.showModal({
    title: '重新计算',
    content: '确定要重置所有计算数据吗？',
    success: res => {
      if (res.confirm) {
        emit('reset')
      }
    }
  })
}

// Watchers
watch(
  () => finalTotal.value,
  (newTotal, oldTotal) => {
    if (oldTotal !== undefined) {
      animateTotal(newTotal)

      if (newTotal > oldTotal) {
        showPriceChangeAnimation('up')
      } else if (newTotal < oldTotal) {
        showPriceChangeAnimation('down')
      }
    } else {
      animatedTotal.value = newTotal.toFixed(2)
    }
  },
  { immediate: true }
)

watch(
  () => props.selectedProducts.length,
  (newLength, oldLength) => {
    if (oldLength !== undefined && newLength > oldLength) {
      // Auto expand when products are added
      expanded.value = true
    }
  }
)
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.price-calculator {
  @include card;
  margin-bottom: $spacing-base;
  padding: 0;
  border-left: 4px solid $primary-color;
  overflow: hidden;
  transition: $transition-base;
  position: relative;

  &--sticky {
    position: sticky;
    top: calc(44px + var(--status-bar-height, 0) + #{$spacing-base});
    z-index: $z-index-sticky;
    box-shadow: $box-shadow-light;
  }
}

// Calculator Header
.calculator-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $spacing-base;
  cursor: pointer;
  background-color: $bg-color-white;
  transition: $transition-base;

  &:hover {
    background-color: $bg-color-page;
  }
}

.header-left {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
}

.calculator-icon {
  font-size: $font-size-large;
}

.calculator-title {
  font-size: $font-size-base;
  font-weight: $font-weight-medium;
  color: $text-color;
}

.header-right {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
}

.total-price {
  font-size: $font-size-large;
  font-weight: $font-weight-bold;
  color: $danger-color;
  font-family: 'Courier New', monospace;
}

.expand-icon {
  font-size: $font-size-small;
  color: $text-color-secondary;
  transition: transform 0.2s ease;
}

// Calculator Content
.calculator-content {
  border-top: 1px solid $border-color-lighter;
  padding: $spacing-base;
  background-color: $bg-color-page;
  animation: slideDown 0.3s ease-out;
}

.calculation-section {
  margin-bottom: $spacing-lg;

  &:last-child {
    margin-bottom: 0;
  }

  &.discount-section {
    background-color: $success-bg;
    padding: $spacing-base;
    border-radius: $border-radius-base;
  }
}

.section-title {
  font-size: $font-size-small;
  font-weight: $font-weight-semibold;
  color: $text-color-secondary;
  display: block;
  margin-bottom: $spacing-sm;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

// Items Summary
.items-summary {
  background-color: $bg-color-white;
  border-radius: $border-radius-base;
  padding: $spacing-sm;
}

.item-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $spacing-xs $spacing-sm;
  border-radius: $border-radius-sm;
  transition: $transition-base;

  &:not(:last-child) {
    margin-bottom: 2px;
  }

  &--highlight {
    background-color: $primary-bg;
    animation: highlight 1.5s ease-out;
  }
}

.item-info {
  flex: 1;
}

.item-name {
  font-size: $font-size-small;
  color: $text-color;
  display: block;
  margin-bottom: 2px;
}

.item-spec {
  font-size: $font-size-extra-small;
  color: $text-color-secondary;
}

.item-total {
  font-size: $font-size-small;
  font-weight: $font-weight-semibold;
  color: $text-color;
  font-family: 'Courier New', monospace;
}

.subtotal-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $spacing-sm;
  margin-top: $spacing-xs;
  border-top: 2px solid $border-color;
  background-color: $bg-color-page;
  border-radius: $border-radius-sm;
}

.subtotal-label {
  font-size: $font-size-base;
  font-weight: $font-weight-medium;
  color: $text-color;
}

.subtotal-value {
  font-size: $font-size-base;
  font-weight: $font-weight-bold;
  color: $text-color;
  font-family: 'Courier New', monospace;
}

// Discount Breakdown
.discount-breakdown {
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: $border-radius-base;
  padding: $spacing-sm;
}

.discount-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $spacing-xs $spacing-sm;

  &:not(:last-child) {
    margin-bottom: $spacing-xs;
  }
}

.discount-info {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
}

.discount-name {
  font-size: $font-size-small;
  color: $text-color;
}

.discount-rate {
  font-size: $font-size-extra-small;
  color: $text-color-secondary;
}

.discount-amount {
  font-size: $font-size-small;
  font-weight: $font-weight-semibold;
  color: $success-color;
  font-family: 'Courier New', monospace;
}

.savings-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $spacing-sm;
  margin-top: $spacing-xs;
  background-color: $success-color;
  color: white;
  border-radius: $border-radius-sm;
}

.savings-label {
  font-size: $font-size-base;
  font-weight: $font-weight-medium;
}

.savings-amount {
  font-size: $font-size-base;
  font-weight: $font-weight-bold;
  font-family: 'Courier New', monospace;
}

// Charges & Tax
.charges-breakdown,
.tax-breakdown {
  background-color: $bg-color-white;
  border-radius: $border-radius-base;
  padding: $spacing-sm;
}

.charge-row,
.tax-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $spacing-xs $spacing-sm;

  &:not(:last-child) {
    margin-bottom: 2px;
  }
}

.charge-name,
.tax-name {
  font-size: $font-size-small;
  color: $text-color;
}

.tax-info {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
}

.tax-rate {
  font-size: $font-size-extra-small;
  color: $text-color-secondary;
}

.charge-amount,
.tax-amount {
  font-size: $font-size-small;
  font-weight: $font-weight-semibold;
  color: $warning-color;
  font-family: 'Courier New', monospace;
}

.tax-note {
  padding: $spacing-xs $spacing-sm;
  margin-top: $spacing-xs;
  background-color: $info-bg;
  border-radius: $border-radius-sm;
}

.note-text {
  font-size: $font-size-extra-small;
  color: $info-color;
  font-style: italic;
}

// Total Section
.total-section {
  background: linear-gradient(135deg, $primary-bg, $success-bg);
  border-radius: $border-radius-base;
  padding: $spacing-base;
  border: 2px solid $primary-color;
}

.total-breakdown {
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: $border-radius-base;
  padding: $spacing-base;
}

.total-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $spacing-sm;
}

.total-label {
  font-size: $font-size-large;
  font-weight: $font-weight-bold;
  color: $text-color;
}

.final-amount {
  font-size: $font-size-extra-large;
  font-weight: $font-weight-bold;
  color: $danger-color;
  font-family: 'Courier New', monospace;
}

.savings-indicator {
  text-align: center;
  padding: $spacing-sm;
  background-color: $success-bg;
  border-radius: $border-radius-sm;
  border: 1px solid $success-color;
}

.savings-text {
  font-size: $font-size-small;
  color: $success-color;
  font-weight: $font-weight-medium;
  display: block;
  margin-bottom: 2px;
}

.savings-percentage {
  font-size: $font-size-extra-small;
  color: $success-color;
  font-weight: $font-weight-bold;
}

// Calculator Actions
.calculator-actions {
  display: flex;
  justify-content: center;
  gap: $spacing-base;
  margin-top: $spacing-lg;
  padding-top: $spacing-base;
  border-top: 1px solid $border-color-lighter;
}

// Price Change Indicator
.price-change-indicator {
  position: absolute;
  top: 10px;
  right: 80px;
  background-color: $info-color;
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: $font-size-extra-small;
  font-weight: $font-weight-medium;
  display: flex;
  align-items: center;
  gap: 4px;
  animation: slideInFade 2s ease-out;
  z-index: 2;

  &--up {
    background-color: $danger-color;
  }

  &--down {
    background-color: $success-color;
  }
}

.change-icon {
  font-size: $font-size-small;
}

// Animations
@keyframes slideDown {
  from {
    opacity: 0;
    max-height: 0;
  }
  to {
    opacity: 1;
    max-height: 800px;
  }
}

@keyframes highlight {
  0%,
  100% {
    background-color: transparent;
  }
  50% {
    background-color: $primary-bg;
  }
}

@keyframes slideInFade {
  0% {
    opacity: 0;
    transform: translateX(20px);
  }
  20% {
    opacity: 1;
    transform: translateX(0);
  }
  80% {
    opacity: 1;
    transform: translateX(0);
  }
  100% {
    opacity: 0;
    transform: translateX(-20px);
  }
}

// Responsive Design
@media (max-width: $breakpoint-sm) {
  .calculator-header {
    padding: $spacing-sm;
  }

  .calculator-content {
    padding: $spacing-sm;
  }

  .total-row {
    flex-direction: column;
    gap: $spacing-xs;
    text-align: center;
  }

  .calculator-actions {
    flex-direction: column;
  }
}

// Accessibility
@media (prefers-reduced-motion: reduce) {
  .calculator-content,
  .price-change-indicator {
    animation: none;
  }

  .expand-icon {
    transition: none;
  }
}
</style>
