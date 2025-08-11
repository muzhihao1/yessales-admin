<!--
  Step 4: Quote Review & Confirmation - Redesigned
  Eliminates z-index conflicts and improves mobile UX
-->
<template>
  <div class="quote-review">
    <!-- Mobile-optimized sticky progress header -->
    <div class="review-progress">
      <div class="progress-content">
        <div class="progress-info">
          <Icon name="check-circle" size="lg" class="progress-icon" />
          <div class="progress-text">
            <h3 class="progress-title">确认提交</h3>
            <p class="progress-subtitle">请仔细核对报价信息，确认无误后提交</p>
          </div>
        </div>
        <div class="progress-total">
          <div class="total-label">报价总计</div>
          <div class="total-amount">¥{{ finalTotal.toFixed(2) }}</div>
        </div>
      </div>
    </div>

    <!-- Clean scrollable content area -->
    <div class="review-content">
      <!-- Quote Summary Card -->
      <section class="review-card quote-summary-card">
        <div class="card-header">
          <div class="card-title">
            <Icon name="document-text" class="card-icon" />
            <span>确认报价</span>
          </div>
          <button class="preview-btn" @click="previewQuote">
            <Icon name="eye" size="sm" />
            预览
          </button>
        </div>
        <div class="quote-meta">
          <div class="meta-item">
            <span class="meta-label">报价编号</span>
            <span class="meta-value">{{ quoteData.quoteNumber }}</span>
          </div>
          <div class="meta-row">
            <div class="meta-item">
              <span class="meta-label">有效期</span>
              <span class="meta-value">{{ quoteData.validityDays }}天</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">创建时间</span>
              <span class="meta-value">{{ formatDate(quoteData.createdAt) }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Customer Information Card -->
      <section class="review-card">
        <div class="card-header">
          <div class="card-title">
            <Icon name="user" class="card-icon" />
            <span>客户信息</span>
          </div>
          <button class="edit-btn" @click="editSection('customer')">
            <Icon name="pencil" size="sm" />
            修改
          </button>
        </div>
        <div class="customer-info">
          <div class="customer-primary">
            <div class="info-row">
              <div class="info-item">
                <span class="info-label">姓名</span>
                <span class="info-value">{{ customerData.name || '未填写' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">电话</span>
                <span class="info-value">{{ customerData.phone || '未填写' }}</span>
              </div>
            </div>
            <div class="info-row">
              <div class="info-item">
                <span class="info-label">客户类型</span>
                <span class="info-value customer-type">{{
                  getCustomerTypeName(customerData.type)
                }}</span>
              </div>
              <div class="info-item" v-if="customerData.email">
                <span class="info-label">邮箱</span>
                <span class="info-value">{{ customerData.email }}</span>
              </div>
            </div>
          </div>

          <!-- Collapsible address details -->
          <div v-if="hasAddressInfo" class="customer-details">
            <button class="details-toggle" @click="showCustomerDetails = !showCustomerDetails">
              <span>地址信息</span>
              <Icon
                name="chevron-down"
                :class="['toggle-icon', { 'toggle-icon--rotated': showCustomerDetails }]"
              />
            </button>
            <div v-show="showCustomerDetails" class="details-content">
              <div class="info-row">
                <div class="info-item" v-if="customerData.province">
                  <span class="info-label">省份</span>
                  <span class="info-value">{{ customerData.province }}</span>
                </div>
                <div class="info-item" v-if="customerData.city">
                  <span class="info-label">城市</span>
                  <span class="info-value">{{ customerData.city }}</span>
                </div>
              </div>
              <div class="info-item" v-if="customerData.address">
                <span class="info-label">详细地址</span>
                <span class="info-value">{{ customerData.address }}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Product Selection Card -->
      <section class="review-card">
        <div class="card-header">
          <div class="card-title">
            <Icon name="shopping-bag" class="card-icon" />
            <span>选择产品 ({{ selectedProducts.length }}种)</span>
          </div>
          <button class="edit-btn" @click="editSection('products')">
            <Icon name="pencil" size="sm" />
            修改
          </button>
        </div>
        <div class="products-summary">
          <!-- Compact product overview -->
          <div class="products-overview">
            <div class="overview-stats">
              <div class="stat-item">
                <span class="stat-label">产品种类</span>
                <span class="stat-value">{{ selectedProducts.length }}种</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">总数量</span>
                <span class="stat-value">{{ totalQuantity }}件</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">产品小计</span>
                <span class="stat-value">¥{{ productsSubtotal.toFixed(2) }}</span>
              </div>
            </div>
          </div>

          <!-- Collapsible detailed product list -->
          <div class="products-details">
            <button class="details-toggle" @click="showProductDetails = !showProductDetails">
              <span>产品明细</span>
              <Icon
                name="chevron-down"
                :class="['toggle-icon', { 'toggle-icon--rotated': showProductDetails }]"
              />
            </button>
            <div v-show="showProductDetails" class="details-content">
              <div
                v-for="(item, _index) in selectedProducts"
                :key="`${item.product.id}-${item.skuId}`"
                class="product-item"
              >
                <div class="product-info">
                  <div class="product-name">{{ item.product.name }}</div>
                  <div class="product-meta">
                    <span class="product-model">{{ item.product.model }}</span>
                    <span v-if="item.skuName" class="product-sku">{{ item.skuName }}</span>
                  </div>
                </div>
                <div class="product-pricing">
                  <div class="pricing-line">
                    <span class="price-unit">单价: ¥{{ item.price }}</span>
                    <span class="price-qty"
                      >数量: {{ item.quantity }}{{ item.product.unit || '个' }}</span
                    >
                  </div>
                  <div class="price-subtotal">小计: ¥{{ item.subtotal.toFixed(2) }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Pricing Configuration Card -->
      <section class="review-card">
        <div class="card-header">
          <div class="card-title">
            <Icon name="currency-dollar" class="card-icon" />
            <span>价格配置</span>
          </div>
          <button class="edit-btn" @click="editSection('pricing')">
            <Icon name="pencil" size="sm" />
            修改
          </button>
        </div>
        <div class="pricing-breakdown">
          <div class="pricing-section">
            <h4 class="section-title">基础费用</h4>
            <div class="pricing-line">
              <span class="line-label">产品小计</span>
              <span class="line-value">¥{{ productsSubtotal.toFixed(2) }}</span>
            </div>
            <div v-if="discountAmount > 0" class="pricing-line discount-line">
              <span class="line-label">优惠折扣</span>
              <span class="line-value savings">-¥{{ discountAmount.toFixed(2) }}</span>
            </div>
          </div>

          <div class="pricing-section">
            <h4 class="section-title">税费</h4>
            <div class="pricing-line">
              <span class="line-label">增值税 ({{ pricingConfig.taxRate }}%)</span>
              <span class="line-value">+¥{{ taxAmount.toFixed(2) }}</span>
            </div>
            <div v-if="pricingConfig.deliveryFee > 0" class="pricing-line">
              <span class="line-label">配送费</span>
              <span class="line-value">+¥{{ pricingConfig.deliveryFee.toFixed(2) }}</span>
            </div>
          </div>

          <div class="pricing-total">
            <div class="total-line">
              <span class="total-label">合计金额</span>
              <span class="total-value">¥{{ finalTotal.toFixed(2) }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Terms & Conditions Card -->
      <section class="review-card">
        <div class="card-header">
          <div class="card-title">
            <Icon name="document-text" class="card-icon" />
            <span>报价条款</span>
          </div>
        </div>
        <div class="terms-content">
          <div class="terms-grid">
            <div class="term-item">
              <span class="term-label">报价有效期</span>
              <span class="term-value"
                >{{ quoteData.validityDays }}天 (至{{ formatExpiryDate() }})</span
              >
            </div>
            <div class="term-item">
              <span class="term-label">付款条件</span>
              <span class="term-value">{{ getPaymentTerms() }}</span>
            </div>
          </div>
          <div class="terms-note">
            <p>{{ getQuoteNote() }}</p>
          </div>
        </div>
      </section>

      <!-- Final Confirmation Card -->
      <section class="review-card confirmation-card">
        <div class="confirmation-content">
          <div class="confirmation-text">
            <Icon name="check-circle" size="lg" class="confirmation-icon" />
            <div>
              <h3 class="confirmation-title">请确认以上信息无误</h3>
              <p class="confirmation-subtitle">确认后将生成正式报价单</p>
            </div>
          </div>
          <div class="confirmation-total">
            <div class="final-total">
              <span class="final-label">合计金额：</span>
              <span class="final-amount">¥{{ finalTotal.toFixed(2) }}</span>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- Fixed bottom action bar -->
    <div class="action-bar">
      <div class="action-content">
        <button class="action-btn action-btn--secondary" @click="goBack">
          <Icon name="arrow-left" size="sm" />
          返回修改
        </button>
        <button
          class="action-btn action-btn--primary"
          @click="confirmQuote"
          :disabled="isSubmitting"
        >
          <span v-if="!isSubmitting">确认生成报价</span>
          <span v-else>生成中...</span>
          <Icon name="check" size="sm" />
        </button>
      </div>
      <div class="action-summary">
        <div class="summary-info">
          <Icon name="shopping-bag" size="sm" class="summary-icon" />
          <span>共 {{ selectedProducts.length }} 项产品</span>
        </div>
        <div class="summary-total">¥{{ finalTotal.toFixed(2) }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import Icon from '@/components/ui/Icon.vue'
import type { SelectedProduct } from '@/types/quote'

interface Props {
  customerData: {
    name: string
    phone: string
    email?: string
    type: 'individual' | 'business'
    province?: string
    city?: string
    address?: string
    wechat?: string
  }
  selectedProducts: SelectedProduct[]
  pricingConfig: {
    discountType: 'percentage' | 'fixed'
    discountValue: number
    taxRate: number
    taxIncluded: boolean
    deliveryFee: number
  }
  quoteData: {
    quoteNumber: string
    validityDays: number
    createdAt: Date
  }
}

const props = defineProps<Props>()

const emit = defineEmits<{
  back: []
  editSection: [section: 'customer' | 'products' | 'pricing']
  confirm: []
  preview: []
}>()

// Component state
const showCustomerDetails = ref(false)
const showProductDetails = ref(false)
const isSubmitting = ref(false)

// Computed values
const hasAddressInfo = computed(
  () => props.customerData.province || props.customerData.city || props.customerData.address
)

const totalQuantity = computed(() =>
  props.selectedProducts.reduce((sum, item) => sum + item.quantity, 0)
)

const productsSubtotal = computed(() =>
  props.selectedProducts.reduce((sum, item) => sum + item.subtotal, 0)
)

const discountAmount = computed(() => {
  const { discountType, discountValue } = props.pricingConfig
  if (discountValue <= 0) return 0

  return discountType === 'percentage'
    ? (productsSubtotal.value * discountValue) / 100
    : discountValue
})

const afterDiscountTotal = computed(() =>
  Math.max(0, productsSubtotal.value - discountAmount.value)
)

const taxAmount = computed(() => {
  const base = props.pricingConfig.taxIncluded ? productsSubtotal.value : afterDiscountTotal.value
  return (base * props.pricingConfig.taxRate) / 100
})

const finalTotal = computed(
  () => afterDiscountTotal.value + taxAmount.value + props.pricingConfig.deliveryFee
)

// Methods
const getCustomerTypeName = (type: string) => {
  return type === 'individual' ? '个人客户' : '企业客户'
}

const formatDate = (date: Date) => {
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

const formatExpiryDate = () => {
  const expiry = new Date(props.quoteData.createdAt)
  expiry.setDate(expiry.getDate() + props.quoteData.validityDays)
  return formatDate(expiry)
}

const getPaymentTerms = () => {
  return '立即付款' // This could be configurable
}

const getQuoteNote = () => {
  return '本报价仅对本次询价有效，如有变动恕不另行通知。'
}

const editSection = (section: 'customer' | 'products' | 'pricing') => {
  emit('editSection', section)
}

const goBack = () => {
  emit('back')
}

const previewQuote = () => {
  emit('preview')
}

const confirmQuote = async () => {
  if (isSubmitting.value) return

  isSubmitting.value = true
  try {
    emit('confirm')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style lang="scss" scoped>
@import '@/styles/design-tokens.scss';

.quote-review {
  min-height: 100vh;
  background: $gray-50;
  padding-bottom: calc(140px + #{$safe-area-bottom}); // Space for fixed action bar
}

// Sticky progress header - NO z-index conflicts
.review-progress {
  background: linear-gradient(135deg, $success 0%, $success-dark 100%);
  color: $white;
  padding: $space-4 $space-4 $space-5;
  margin-top: calc(44px + #{$safe-area-top}); // Account for nav header

  .progress-content {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: $space-4;
  }

  .progress-info {
    display: flex;
    align-items: flex-start;
    gap: $space-3;
    flex: 1;
  }

  .progress-icon {
    color: $success-light;
    flex-shrink: 0;
  }

  .progress-title {
    font-size: $text-lg;
    font-weight: $font-semibold;
    margin: 0 0 $space-1;
    color: $white;
  }

  .progress-subtitle {
    font-size: $text-sm;
    color: $success-light;
    margin: 0;
    line-height: 1.4;
  }

  .progress-total {
    text-align: right;
    flex-shrink: 0;
  }

  .total-label {
    font-size: $text-xs;
    color: $success-light;
    display: block;
    margin-bottom: $space-1;
  }

  .total-amount {
    font-size: $text-xl;
    font-weight: $font-bold;
    color: $white;
  }
}

// Clean scrollable content area
.review-content {
  padding: $space-4;
  max-width: 100%;
}

// Card component styles
.review-card {
  background: $white;
  border-radius: $radius-lg;
  border: 1px solid $gray-200;
  margin-bottom: $space-4;
  overflow: hidden;

  &:last-child {
    margin-bottom: 0;
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $space-4 $space-5;
  border-bottom: 1px solid $gray-100;
  background: $gray-50;
}

.card-title {
  display: flex;
  align-items: center;
  gap: $space-2;
  font-size: $text-base;
  font-weight: $font-semibold;
  color: $gray-900;
}

.card-icon {
  color: $primary-500;
}

.edit-btn,
.preview-btn {
  display: flex;
  align-items: center;
  gap: $space-1;
  padding: $space-2 $space-3;
  font-size: $text-sm;
  color: $primary-500;
  background: $primary-50;
  border: 1px solid $primary-200;
  border-radius: $radius-base;
  cursor: pointer;
  transition: $transition-base;

  &:hover {
    background: $primary-100;
    border-color: $primary-300;
  }

  &:active {
    transform: translateY(1px);
  }
}

// Quote summary specific styles
.quote-summary-card {
  border-color: $success-light;
  box-shadow: 0 2px 4px rgba($success, 0.1);
}

.quote-meta {
  padding: $space-5;
}

.meta-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $space-3;

  &:last-child {
    margin-bottom: 0;
  }
}

.meta-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $space-4;

  .meta-item {
    margin-bottom: 0;
  }
}

.meta-label {
  font-size: $text-sm;
  color: $gray-600;
}

.meta-value {
  font-size: $text-sm;
  font-weight: $font-medium;
  color: $gray-900;
}

// Customer info styles
.customer-info {
  padding: $space-5;
}

.customer-primary {
  margin-bottom: $space-4;
}

.info-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $space-4;
  margin-bottom: $space-4;

  &:last-child {
    margin-bottom: 0;
  }
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: $space-1;
}

.info-label {
  font-size: $text-xs;
  color: $gray-600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.info-value {
  font-size: $text-sm;
  color: $gray-900;
  font-weight: $font-medium;

  &.customer-type {
    color: $primary-500;
    background: $primary-50;
    padding: $space-1 $space-2;
    border-radius: $radius-base;
    font-size: $text-xs;
    display: inline-block;
    width: fit-content;
  }
}

// Progressive disclosure components
.details-toggle {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: $space-3 0;
  font-size: $text-sm;
  font-weight: $font-medium;
  color: $gray-900;
  background: none;
  border: none;
  border-top: 1px solid $gray-100;
  cursor: pointer;
  transition: $transition-base;

  &:hover {
    color: $primary-500;
  }
}

.toggle-icon {
  color: $gray-600;
  transition: transform 0.2s ease-out;

  &--rotated {
    transform: rotate(180deg);
  }
}

.details-content {
  padding: $space-4 0 0;
  animation: slideDown 0.2s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// Products summary styles
.products-summary {
  padding: $space-5;
}

.products-overview {
  margin-bottom: $space-1;
}

.overview-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: $space-4;
}

.stat-item {
  text-align: center;
  padding: $space-3;
  background: $gray-50;
  border-radius: $radius-base;
}

.stat-label {
  display: block;
  font-size: $text-xs;
  color: $gray-600;
  margin-bottom: $space-1;
}

.stat-value {
  display: block;
  font-size: $text-sm;
  font-weight: $font-semibold;
  color: $gray-900;
}

.product-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: $space-4 0;
  border-bottom: 1px solid $gray-100;

  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
}

.product-info {
  flex: 1;
}

.product-name {
  font-size: $text-sm;
  font-weight: $font-medium;
  color: $gray-900;
  margin-bottom: $space-1;
}

.product-meta {
  font-size: $text-xs;
  color: $gray-600;
}

.product-model {
  margin-right: $space-2;
}

.product-sku {
  color: $primary-500;
  background: $primary-50;
  padding: $space-0 $space-1;
  border-radius: $radius-sm;
}

.product-pricing {
  text-align: right;
  flex-shrink: 0;
}

.pricing-line {
  display: flex;
  flex-direction: column;
  gap: $space-1;
  margin-bottom: $space-1;
}

.price-unit,
.price-qty {
  font-size: $text-xs;
  color: $gray-600;
}

.price-subtotal {
  font-size: $text-sm;
  font-weight: $font-semibold;
  color: $gray-900;
}

// Pricing breakdown styles
.pricing-breakdown {
  padding: $space-5;
}

.pricing-section {
  margin-bottom: $space-5;

  &:last-child {
    margin-bottom: 0;
  }
}

.section-title {
  font-size: $text-sm;
  font-weight: $font-semibold;
  color: $gray-600;
  margin: 0 0 $space-3;
  padding-bottom: $space-2;
  border-bottom: 1px solid $gray-100;
}

.pricing-line {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $space-2;

  &:last-child {
    margin-bottom: 0;
  }

  &.discount-line .line-value {
    color: $success;

    &.savings {
      font-weight: $font-semibold;
    }
  }
}

.line-label {
  font-size: $text-sm;
  color: $gray-600;
}

.line-value {
  font-size: $text-sm;
  font-weight: $font-medium;
  color: $gray-900;
}

.pricing-total {
  padding: $space-4;
  background: $gray-50;
  border-radius: $radius-base;
  border: 2px solid $primary-200;
}

.total-line {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.total-label {
  font-size: $text-base;
  font-weight: $font-semibold;
  color: $gray-900;
}

.total-value {
  font-size: $text-xl;
  font-weight: $font-bold;
  color: $primary-500;
}

// Terms styles
.terms-content {
  padding: $space-5;
}

.terms-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: $space-3;
  margin-bottom: $space-4;
}

.term-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $space-3;
  background: $gray-50;
  border-radius: $radius-base;
}

.term-label {
  font-size: $text-sm;
  color: $gray-600;
}

.term-value {
  font-size: $text-sm;
  font-weight: $font-medium;
  color: $gray-900;
}

.terms-note {
  padding: $space-3;
  background: $secondary-50;
  border-radius: $radius-base;
  border-left: 4px solid $secondary-500;

  p {
    font-size: $text-sm;
    color: $gray-600;
    margin: 0;
    line-height: 1.5;
  }
}

// Confirmation card
.confirmation-card {
  border-color: $success-light;
  background: linear-gradient(135deg, $primary-50 0%, $success-light 100%);
}

.confirmation-content {
  padding: $space-6 $space-5;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: $space-4;
}

.confirmation-text {
  display: flex;
  align-items: center;
  gap: $space-3;
  flex: 1;
}

.confirmation-icon {
  color: $success;
}

.confirmation-title {
  font-size: $text-base;
  font-weight: $font-semibold;
  color: $gray-900;
  margin: 0 0 $space-1;
}

.confirmation-subtitle {
  font-size: $text-sm;
  color: $gray-600;
  margin: 0;
}

.confirmation-total {
  text-align: right;
}

.final-total {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: $space-1;
}

.final-label {
  font-size: $text-sm;
  color: $gray-600;
}

.final-amount {
  font-size: $text-2xl;
  font-weight: $font-bold;
  color: $success;
}

// Fixed action bar - NO z-index conflicts
.action-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: $white;
  border-top: 1px solid $gray-200;
  padding: $space-4;
  padding-bottom: calc(#{$space-4} + #{$safe-area-bottom});
  box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.1);
}

.action-content {
  display: flex;
  gap: $space-3;
  margin-bottom: $space-3;
}

.action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $space-2;
  padding: $space-3 $space-4;
  font-size: $text-base;
  font-weight: $font-semibold;
  border-radius: $radius-lg;
  cursor: pointer;
  transition: $transition-base;
  min-height: 48px; // Touch target

  &--secondary {
    background: $gray-100;
    color: $gray-900;
    border: 1px solid $gray-300;

    &:hover {
      background: $gray-200;
      border-color: $gray-400;
    }
  }

  &--primary {
    background: linear-gradient(135deg, $success 0%, $success-dark 100%);
    color: $white;
    border: 1px solid $success;

    &:hover {
      background: linear-gradient(135deg, $success-dark 0%, $success-dark 100%);
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba($success, 0.3);
    }

    &:disabled {
      background: $gray-300;
      color: $gray-500;
      border-color: $gray-300;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }
  }

  &:active {
    transform: translateY(1px);
  }
}

.action-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $space-2 0;
  border-top: 1px solid $gray-100;
}

.summary-info {
  display: flex;
  align-items: center;
  gap: $space-2;
  font-size: $text-sm;
  color: $gray-600;
}

.summary-icon {
  color: $primary-500;
}

.summary-total {
  font-size: $text-lg;
  font-weight: $font-bold;
  color: $success;
}

// Responsive design
@media (min-width: $breakpoint-md) {
  .review-content {
    max-width: 768px;
    margin: 0 auto;
    padding: $space-6;
  }

  .review-progress {
    padding: $space-6 $space-6 $space-8;

    .progress-content {
      max-width: 768px;
      margin: 0 auto;
    }
  }

  .action-bar {
    .action-content {
      max-width: 768px;
      margin: 0 auto $space-3;
    }

    .action-summary {
      max-width: 768px;
      margin: 0 auto;
    }
  }

  .info-row {
    grid-template-columns: repeat(3, 1fr);
  }

  .overview-stats {
    gap: $space-6;
  }

  .terms-grid {
    grid-template-columns: 1fr 1fr;
    gap: $space-4;
  }
}

// Reduced motion accessibility
@media (prefers-reduced-motion: reduce) {
  .details-content {
    animation: none;
  }

  .toggle-icon {
    transition: none;
  }

  .action-btn {
    transition: none;

    &:hover {
      transform: none;
    }
  }
}
</style>
