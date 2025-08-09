<!--
  YesSales Quote Creation Wizard - Multi-Step UX Pattern
  Implements progressive disclosure for better completion rates
-->
<template>
  <view class="quote-wizard">
    <SalesHeader title="新建报价" :show-back="true" :fixed="true" />

    <!-- Progress Indicator -->
    <view class="wizard-progress">
      <view class="progress-container">
        <view class="progress-bar">
          <view class="progress-fill" :style="{ width: `${(currentStep / totalSteps) * 100}%` }" />
        </view>
        <view class="progress-steps">
          <view
            v-for="(step, index) in steps"
            :key="index"
            class="progress-step"
            :class="{
              'progress-step--active': currentStep > index,
              'progress-step--current': currentStep === index + 1
            }"
          >
            <view class="step-circle">
              <text v-if="currentStep > index + 1" class="step-check">✓</text>
              <text v-else class="step-number">{{ index + 1 }}</text>
            </view>
            <text class="step-label">{{ step.name }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- Wizard Content -->
    <view class="wizard-content">
      <!-- Step 1: Customer Information -->
      <StepCustomer
        v-if="currentStep === 1"
        v-model:form="customerForm"
        :errors="customerErrors"
        @next="handleCustomerNext"
        @validate="validateCustomerStep"
        @update:form="handleCustomerFormUpdate"
      />

      <!-- Step 2: Product Selection -->
      <StepProducts
        v-else-if="currentStep === 2"
        v-model:selectedProducts="selectedProducts"
        :categories="categories"
        @next="handleProductsNext"
        @back="currentStep = 1"
      />

      <!-- Step 3: Pricing Configuration -->
      <StepPricing
        v-else-if="currentStep === 3"
        v-model:config="pricingConfig"
        :selectedProducts="selectedProducts"
        :customerType="customerForm.customerType"
        @next="handlePricingNext"
        @back="currentStep = 2"
      />

      <!-- Step 4: Review & Submit -->
      <StepReview
        v-else-if="currentStep === 4"
        :customerForm="customerForm"
        :selectedProducts="selectedProducts"
        :pricingConfig="pricingConfig"
        :quoteMetadata="quoteMetadata"
        :totalPrice="totalPrice"
        @submit="handleSubmit"
        @back="currentStep = 3"
        :submitting="submitting"
      />
    </view>

    <!-- Mobile Bottom Navigation -->
    <view class="wizard-nav" v-if="showNavigation">
      <SalesButton
        v-if="currentStep > 1"
        type="default"
        @click="goBack"
        :block="false"
        class="nav-back"
      >
        上一步
      </SalesButton>

      <view class="nav-spacer" />

      <SalesButton
        v-if="currentStep < totalSteps"
        type="primary"
        @click="goNext"
        :block="false"
        :disabled="!canProceed"
        class="nav-next"
      >
        下一步
      </SalesButton>

      <SalesButton
        v-else
        type="primary"
        @click="handleSubmit"
        :loading="submitting"
        :block="false"
        class="nav-submit"
      >
        生成报价
      </SalesButton>
    </view>

    <!-- Price Summary Sticky (Steps 2-4) -->
    <view v-if="currentStep >= 2 && selectedProducts.length > 0" class="price-sticky">
      <view class="price-summary">
        <text class="price-label">合计：</text>
        <text class="price-value">¥{{ totalPrice.toFixed(2) }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import SalesHeader from './SalesHeader.vue'
import SalesButton from './SalesButton.vue'
import StepCustomer from './wizard/StepCustomer.vue'
import StepProducts from './wizard/StepProducts.vue'
import StepPricing from './wizard/StepPricing.vue'
import StepReview from './wizard/StepReview.vue'
import type { SelectedProduct } from '@/components/business/ProductSelector.vue'
import type { Category } from '@/types/api'
import { QuotesApi } from '@/api'
import { analytics, navigation, storage, toast } from '@/utils/platform-adapter'

// Wizard configuration
const totalSteps = 4
const currentStep = ref(1)
const submitting = ref(false)

const steps = [
  { name: '客户信息', icon: '👤' },
  { name: '选择产品', icon: '📦' },
  { name: '价格配置', icon: '💰' },
  { name: '确认提交', icon: '✓' }
]

// Form data
const customerForm = reactive({
  customerName: '',
  customerPhone: '',
  customerWechat: '',
  customerEmail: '',
  customerProvince: '',
  customerCity: '',
  customerAddress: '',
  customerType: 'individual' as 'individual' | 'company' | 'dealer' | 'club',
  customerRemark: '',
  saveCustomer: true
})

const customerErrors = reactive({
  customerName: '',
  customerPhone: '',
  customerWechat: '',
  customerEmail: '',
  customerAddress: ''
})

const selectedProducts = ref<SelectedProduct[]>([])

const pricingConfig = reactive({
  discountType: 'percentage' as 'percentage' | 'fixed',
  discountValue: 0,
  taxRate: 13,
  taxIncluded: false,
  deliveryFee: 0,
  installationFee: 0,
  otherCharges: [] as Array<{
    id: string
    name: string
    amount: number
    type: 'fixed' | 'percentage'
  }>
})

const quoteMetadata = reactive({
  quoteNumber: '',
  validityDays: 30,
  paymentTerms: 'immediate' as 'immediate' | '30days' | '60days' | 'cod',
  specialTerms: '',
  images: []
})

// Categories (mock data)
const categories = ref<Category[]>([
  { id: 'tables', name: '台球桌', icon: '🎱' },
  { id: 'cues', name: '球杆', icon: '🎯' },
  { id: 'balls', name: '台球', icon: '⚪' },
  { id: 'accessories', name: '配件', icon: '🔧' },
  { id: 'maintenance', name: '维护用品', icon: '🧽' }
])

// Computed properties
const showNavigation = computed(() => {
  // Show navigation on mobile, hide if using in-step controls
  return true
})

const canProceed = computed(() => {
  switch (currentStep.value) {
    case 1:
      return customerForm.customerName && customerForm.customerPhone
    case 2:
      return selectedProducts.value.length > 0
    case 3:
      return true
    case 4:
      return true
    default:
      return false
  }
})

const subtotal = computed(() => {
  return selectedProducts.value.reduce((sum, item) => sum + item.subtotal, 0)
})

const totalPrice = computed(() => {
  let total = subtotal.value

  // Apply discounts
  if (pricingConfig.discountType === 'percentage') {
    total = total * (1 - pricingConfig.discountValue / 100)
  } else {
    total = total - pricingConfig.discountValue
  }

  // Add fees
  total += pricingConfig.deliveryFee + pricingConfig.installationFee

  // Add other charges
  pricingConfig.otherCharges.forEach(charge => {
    if (charge.type === 'percentage') {
      total += total * (charge.amount / 100)
    } else {
      total += charge.amount
    }
  })

  // Add tax if not included
  if (!pricingConfig.taxIncluded) {
    total += total * (pricingConfig.taxRate / 100)
  }

  return Math.max(0, total)
})

// Methods
const goNext = () => {
  if (canProceed.value && currentStep.value < totalSteps) {
    currentStep.value++
    saveDraft()

    // Track step progression for analytics
    analytics.report('wizard_step_complete', {
      step: currentStep.value - 1,
      step_name: steps[currentStep.value - 2]?.name
    })
  }
}

const goBack = () => {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

const handleCustomerFormUpdate = (formData: typeof customerForm) => {
  console.log('QuoteWizard: Received form update', formData)
  Object.assign(customerForm, formData)
}

const handleCustomerNext = () => {
  if (validateCustomerStep()) {
    goNext()
  }
}

const handleProductsNext = () => {
  if (selectedProducts.value.length > 0) {
    goNext()
  } else {
    toast.show('请选择至少一个产品', 'none')
  }
}

const handlePricingNext = () => {
  goNext()
}

const validateCustomerStep = (): boolean => {
  let isValid = true

  // Reset errors
  Object.keys(customerErrors).forEach(key => {
    customerErrors[key] = ''
  })

  // Validate required fields
  if (!customerForm.customerName.trim()) {
    customerErrors.customerName = '请输入客户姓名'
    isValid = false
  }

  if (!customerForm.customerPhone.trim()) {
    customerErrors.customerPhone = '请输入联系电话'
    isValid = false
  } else if (!/^1[3-9]\d{9}$/.test(customerForm.customerPhone)) {
    customerErrors.customerPhone = '请输入正确的手机号码'
    isValid = false
  }

  // Validate optional email format
  if (
    customerForm.customerEmail &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerForm.customerEmail)
  ) {
    customerErrors.customerEmail = '请输入正确的邮箱格式'
    isValid = false
  }

  return isValid
}

const generateQuoteNumber = () => {
  const today = new Date()
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '')
  const randomSuffix = Math.floor(Math.random() * 9999)
    .toString()
    .padStart(4, '0')
  quoteMetadata.quoteNumber = `YS-${dateStr}-${randomSuffix}`
}

const saveDraft = () => {
  try {
    const draftData = {
      currentStep: currentStep.value,
      customerForm,
      selectedProducts: selectedProducts.value,
      pricingConfig,
      quoteMetadata,
      timestamp: Date.now()
    }
    storage.setJSON('quote_wizard_draft', draftData)
  } catch (error) {
    console.warn('Failed to save draft:', error)
  }
}

const loadDraft = () => {
  try {
    const draft = storage.getJSON('quote_wizard_draft')
    if (draft && Date.now() - draft.timestamp < 24 * 60 * 60 * 1000) {
      // 24 hours
      currentStep.value = draft.currentStep || 1
      Object.assign(customerForm, draft.customerForm || {})
      selectedProducts.value = draft.selectedProducts || []
      Object.assign(pricingConfig, draft.pricingConfig || {})
      Object.assign(quoteMetadata, draft.quoteMetadata || {})
    }
  } catch (error) {
    console.warn('Failed to load draft:', error)
  }
}

const handleSubmit = async () => {
  if (!canProceed.value) return

  submitting.value = true

  try {
    const request = {
      customer: customerForm,
      items: selectedProducts.value.map(item => ({
        product_id: item.product.id,
        product_name: item.product.name,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.subtotal
      })),
      pricing: {
        subtotal: subtotal.value,
        discount:
          pricingConfig.discountType === 'percentage'
            ? { type: 'percentage', value: pricingConfig.discountValue }
            : { type: 'fixed', value: pricingConfig.discountValue },
        finalTotal: totalPrice.value
      },
      quote: quoteMetadata
    }

    const response = await QuotesApi.createQuote(request)

    if (response.success) {
      // Clear draft
      storage.removeItem('quote_wizard_draft')

      toast.success('报价创建成功')

      // Navigate to preview
      setTimeout(() => {
        navigation.redirectTo(`/sales/quote/preview?id=${response.data?.id}`)
      }, 1500)
    } else {
      throw new Error(response.error?.message || '创建失败')
    }
  } catch (error) {
    toast.error((error as Error).message || '创建失败，请重试')
  } finally {
    submitting.value = false
  }
}

// Lifecycle
onMounted(() => {
  loadDraft()
  generateQuoteNumber()

  // Track wizard start
  analytics.report('quote_wizard_start', {
    user_type: 'sales',
    timestamp: Date.now()
  })
})
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.quote-wizard {
  min-height: 100vh;
  background-color: $bg-color-page;
  padding-bottom: 120px; // Space for navigation
}

// Progress Indicator
.wizard-progress {
  background-color: $bg-color-white;
  border-bottom: 1px solid $border-color-lighter;
  padding: $spacing-base $spacing-base 0;
  margin-top: calc(44px + var(--status-bar-height, 0));
}

.progress-container {
  max-width: 500px;
  margin: 0 auto;
}

.progress-bar {
  height: 4px;
  background-color: $border-color-lighter;
  border-radius: 2px;
  margin-bottom: $spacing-lg;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, $primary-color, $primary-light);
  border-radius: 2px;
  transition: width 0.3s ease;
}

.progress-steps {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: $spacing-sm;
}

.progress-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding-bottom: $spacing-base;
}

.step-circle {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: $border-color-light;
  color: $text-color-placeholder;
  font-size: $font-size-small;
  font-weight: $font-weight-semibold;
  margin-bottom: $spacing-xs;
  transition: $transition-base;

  .progress-step--active & {
    background-color: $primary-color;
    color: white;
  }

  .progress-step--current & {
    background-color: $primary-light;
    color: white;
    transform: scale(1.1);
  }
}

.step-check {
  font-size: 14px;
}

.step-label {
  font-size: $font-size-small;
  color: $text-color-secondary;
  transition: $transition-base;

  .progress-step--active &,
  .progress-step--current & {
    color: $text-color;
    font-weight: $font-weight-medium;
  }
}

// Wizard Content
.wizard-content {
  padding: $spacing-base;
  max-width: 600px;
  margin: 0 auto;
}

// Bottom Navigation
.wizard-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: $bg-color-white;
  border-top: 1px solid $border-color-lighter;
  padding: $spacing-base;
  padding-bottom: calc(#{$spacing-base} + env(safe-area-inset-bottom));
  display: flex;
  align-items: center;
  gap: $spacing-base;
  z-index: $z-index-fixed;
}

.nav-spacer {
  flex: 1;
}

.nav-back,
.nav-next,
.nav-submit {
  min-width: 100px;
  height: $touch-target-comfortable;
}

// Price Sticky
.price-sticky {
  position: fixed;
  top: calc(44px + var(--status-bar-height, 0) + 80px);
  right: $spacing-base;
  background-color: $primary-color;
  color: white;
  padding: $spacing-sm $spacing-base;
  border-radius: $border-radius-lg;
  box-shadow: $box-shadow-light;
  z-index: $z-index-sticky;
  animation: slideInRight 0.3s ease-out;
}

.price-summary {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
}

.price-label {
  font-size: $font-size-small;
  opacity: 0.9;
}

.price-value {
  font-size: $font-size-medium;
  font-weight: $font-weight-semibold;
}

// Animations
@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

// Responsive Design
@media (max-width: $breakpoint-sm) {
  .progress-steps {
    gap: $spacing-xs;
  }

  .step-label {
    font-size: $font-size-extra-small;
  }

  .price-sticky {
    right: $spacing-sm;
  }
}

@media (min-width: $breakpoint-lg) {
  .wizard-content {
    padding: $spacing-xl;
  }

  .wizard-nav {
    justify-content: center;
    max-width: 600px;
    margin: 0 auto;
    left: 50%;
    transform: translateX(-50%);
    border-radius: $border-radius-lg $border-radius-lg 0 0;
  }
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .progress-fill,
  .step-circle {
    transition: none;
  }

  .price-sticky {
    animation: none;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .quote-wizard {
    background-color: #1a1a1a;
  }

  .wizard-progress,
  .wizard-nav {
    background-color: #2d2d2d;
    border-color: #404040;
  }

  .price-sticky {
    background-color: $primary-dark;
  }
}
</style>
