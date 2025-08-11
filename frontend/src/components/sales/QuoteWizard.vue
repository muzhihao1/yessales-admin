<!--
  YesSales Professional Quote Creation Wizard
  Modern multi-step UX with professional billiards branding
-->
<template>
  <div class="quote-wizard">
    <SalesHeader title="新建报价" :show-back="true" :fixed="true" />

    <!-- Professional Progress Indicator -->
    <div class="wizard-progress">
      <div class="progress-container">
        <div class="progress-header">
          <h2 class="wizard-title">创建专业报价</h2>
          <div class="step-counter">
            <span class="current-step">{{ currentStep }}</span>
            <span class="step-separator">/</span>
            <span class="total-steps">{{ totalSteps }}</span>
          </div>
        </div>

        <div class="progress-track">
          <div class="progress-fill" :style="{ width: `${(currentStep / totalSteps) * 100}%` }" />
        </div>

        <div class="progress-steps">
          <div
            v-for="(step, index) in steps"
            :key="index"
            class="progress-step"
            :class="{
              'progress-step--completed': currentStep > index + 1,
              'progress-step--active': currentStep === index + 1,
              'progress-step--pending': currentStep < index + 1
            }"
          >
            <div class="step-indicator">
              <div class="step-icon">
                <svg
                  v-if="currentStep > index + 1"
                  class="check-icon"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                </svg>
                <span v-else class="step-number">{{ index + 1 }}</span>
              </div>
            </div>
            <div class="step-content">
              <div class="step-name">{{ step.name }}</div>
              <div class="step-description">{{ step.description }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Professional Wizard Content -->
    <div class="wizard-content">
      <div class="content-card">
        <!-- Step 1: Customer Information -->
        <div v-if="currentStep === 1" class="step-container">
          <div class="step-header">
            <div class="step-icon-large">👤</div>
            <h3 class="step-title">客户信息</h3>
            <p class="step-subtitle">请填写完整的客户联系信息，便于后续跟进</p>
          </div>
          <StepCustomer
            v-model:form="customerForm"
            :errors="customerErrors"
            @next="handleCustomerNext"
            @validate="validateCustomerStep"
            @update:form="handleCustomerFormUpdate"
          />
        </div>

        <!-- Step 2: Product Selection -->
        <div v-else-if="currentStep === 2" class="step-container">
          <div class="step-header">
            <div class="step-icon-large">🎱</div>
            <h3 class="step-title">产品选择</h3>
            <p class="step-subtitle">从我们的专业台球设备目录中选择所需产品</p>
          </div>
          <StepProducts
            v-model:selectedProducts="selectedProducts"
            :categories="categories"
            @next="handleProductsNext"
            @back="currentStep = 1"
          />
        </div>

        <!-- Step 3: Pricing Configuration -->
        <div v-else-if="currentStep === 3" class="step-container">
          <div class="step-header">
            <div class="step-icon-large">💰</div>
            <h3 class="step-title">价格配置</h3>
            <p class="step-subtitle">设置折扣、税费和其他费用</p>
          </div>
          <StepPricing
            v-model:config="pricingConfig"
            :selectedProducts="selectedProducts"
            :customerType="customerForm.customerType"
            @next="handlePricingNext"
            @back="currentStep = 2"
          />
        </div>

        <!-- Step 4: Review & Submit -->
        <div v-else-if="currentStep === 4" class="step-container">
          <div class="step-header">
            <div class="step-icon-large">✓</div>
            <h3 class="step-title">确认提交</h3>
            <p class="step-subtitle">请仔细核对报价信息，确认无误后提交</p>
          </div>
          <StepReviewRedesigned
            :customerData="mappedCustomerData"
            :selectedProducts="selectedProducts"
            :pricingConfig="mappedPricingConfig"
            :quoteData="mappedQuoteData"
            @confirm="handleSubmit"
            @back="currentStep = 3"
            @editSection="handleEditSection"
            @preview="handlePreview"
          />
        </div>
      </div>
    </div>

    <!-- Professional Navigation Bar -->
    <div class="wizard-navigation" v-if="showNavigation">
      <div class="nav-container">
        <button
          v-if="currentStep > 1"
          class="nav-btn nav-btn--secondary"
          @click="goBack"
          :disabled="submitting"
        >
          <svg class="nav-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12l4.58-4.59z" />
          </svg>
          <span>上一步</span>
        </button>

        <div class="nav-progress">
          <span class="nav-step-info">第 {{ currentStep }} 步，共 {{ totalSteps }} 步</span>
        </div>

        <button
          v-if="currentStep < totalSteps"
          class="nav-btn nav-btn--primary"
          @click="goNext"
          :disabled="!canProceed || submitting"
        >
          <span>下一步</span>
          <svg class="nav-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12l-4.58 4.59z" />
          </svg>
        </button>

        <button
          v-else
          class="nav-btn nav-btn--primary nav-btn--submit"
          @click="handleSubmit"
          :disabled="!canProceed || submitting"
        >
          <div v-if="submitting" class="loading-spinner"></div>
          <span>{{ submitting ? '生成中...' : '生成报价' }}</span>
          <svg v-if="!submitting" class="nav-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Professional Price Summary (hidden on review step) -->
    <div
      v-if="currentStep >= 2 && currentStep < 4 && selectedProducts.length > 0"
      class="price-summary-card"
    >
      <div class="summary-header">
        <svg class="summary-icon" viewBox="0 0 24 24" fill="currentColor">
          <path
            d="M7 4V2C7 1.45 7.45 1 8 1H16C16.55 1 17 1.45 17 2V4H20C20.55 4 21 4.45 21 5S20.55 6 20 6H19V19C19 20.1 18.1 21 17 21H7C5.9 21 5 20.1 5 19V6H4C3.45 6 3 5.55 3 5S3.45 4 4 4H7ZM9 3V4H15V3H9ZM7 6V19H17V6H7Z"
          />
        </svg>
        <span class="summary-title">报价合计</span>
      </div>
      <div class="summary-amount">
        <span class="currency">¥</span>
        <span class="price">{{ totalPrice.toFixed(2) }}</span>
      </div>
      <div class="summary-details">
        <span class="item-count">共 {{ selectedProducts.length }} 项产品</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, readonly, ref } from 'vue'
import SalesHeader from './SalesHeader.vue'
import SalesButton from './SalesButton.vue'
import StepCustomer from './wizard/StepCustomer.vue'
import StepProducts from './wizard/StepProducts.vue'
import StepPricing from './wizard/StepPricing.vue'
import StepReviewRedesigned from './wizard/StepReviewRedesigned.vue'
import type { SelectedProduct } from '@/components/business/ProductSelector.vue'
import type { Category } from '@/types/api'
import { QuotesApi } from '@/api'
import { analytics, navigation, storage, toast } from '@/utils/platform-adapter'

// Wizard configuration
const totalSteps = readonly(ref(4))
const currentStep = ref(1)
const submitting = ref(false)

const steps = [
  { name: '客户信息', icon: '👤', description: '填写客户基本信息和联系方式' },
  { name: '产品选择', icon: '🎱', description: '选择台球设备和配件产品' },
  { name: '价格配置', icon: '💰', description: '设置价格、折扣和费用' },
  { name: '确认提交', icon: '✓', description: '核对信息并生成报价单' }
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

// Categories (matching admin interface)
const categories = ref<Category[]>([
  { id: '台球桌', name: '台球桌', icon: '🎱' },
  { id: '地毯', name: '地毯', icon: '🟫' },
  { id: '球杆', name: '球杆', icon: '🎯' },
  { id: '台球', name: '台球', icon: '⚪' },
  { id: '其他配件', name: '其他配件', icon: '🔧' }
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

// Computed mappings for StepReviewRedesigned component
const mappedCustomerData = computed(() => ({
  name: customerForm.customerName,
  phone: customerForm.customerPhone,
  email: customerForm.customerEmail || undefined,
  type:
    customerForm.customerType === 'individual' ? ('individual' as const) : ('business' as const),
  province: customerForm.customerProvince || undefined,
  city: customerForm.customerCity || undefined,
  address: customerForm.customerAddress || undefined,
  wechat: customerForm.customerWechat || undefined
}))

const mappedPricingConfig = computed(() => ({
  discountType: pricingConfig.discountType,
  discountValue: pricingConfig.discountValue,
  taxRate: pricingConfig.taxRate,
  taxIncluded: pricingConfig.taxIncluded,
  deliveryFee: pricingConfig.deliveryFee
}))

const mappedQuoteData = computed(() => ({
  quoteNumber: quoteMetadata.quoteNumber,
  validityDays: quoteMetadata.validityDays,
  createdAt: new Date()
}))

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

// New event handlers for StepReviewRedesigned
const handleEditSection = (section: 'customer' | 'products' | 'pricing') => {
  // Navigate back to the appropriate step
  switch (section) {
    case 'customer':
      currentStep.value = 1
      break
    case 'products':
      currentStep.value = 2
      break
    case 'pricing':
      currentStep.value = 3
      break
  }
}

const handlePreview = () => {
  // For now, just show a toast - could implement preview modal later
  toast.show('预览功能即将推出', 'none')
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
@import '@/styles/design-tokens.scss';

.quote-wizard {
  min-height: 100vh;
  background-color: $gray-50;
  padding-bottom: 100px; // Space for navigation
}

// Professional Progress Section
.wizard-progress {
  background: linear-gradient(135deg, $primary-600 0%, $primary-800 100%);
  color: $white;
  padding: $space-3 $space-4 $space-4;
  margin-top: calc(44px + #{$safe-area-top});
  box-shadow: $shadow-lg;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: -50%;
    right: -10%;
    width: 200px;
    height: 200px;
    background: rgba($white, 0.1);
    border-radius: 50%;
  }

  &::after {
    content: '';
    position: absolute;
    bottom: -30%;
    left: -5%;
    width: 150px;
    height: 150px;
    background: rgba($white, 0.05);
    border-radius: 50%;
  }

  @media (min-width: $breakpoint-md) {
    padding: $space-4 $space-6 $space-5;
  }
}

.progress-container {
  max-width: 1200px;
  margin: 0 auto;
  position: relative;
  z-index: 2;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $space-3;
}

.wizard-title {
  font-size: $text-2xl;
  font-weight: $font-bold;
  margin: 0;

  @media (min-width: $breakpoint-md) {
    font-size: $text-3xl;
  }
}

.step-counter {
  display: flex;
  align-items: center;
  gap: $space-1;
  background: rgba($white, 0.15);
  padding: $space-2 $space-4;
  border-radius: $radius-full;
  backdrop-filter: blur(10px);

  .current-step,
  .total-steps {
    font-size: $text-lg;
    font-weight: $font-bold;
  }

  .step-separator {
    font-size: $text-base;
    opacity: 0.7;
    margin: 0 $space-1;
  }
}

.progress-track {
  height: 6px;
  background: rgba($white, 0.2);
  border-radius: $radius-full;
  overflow: hidden;
  margin-bottom: $space-4;

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, $white, rgba($white, 0.9));
    border-radius: inherit;
    transition: width $transition-base;
    box-shadow: 0 0 10px rgba($white, 0.5);
  }
}

.progress-steps {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: $space-4;

  @media (max-width: $breakpoint-sm) {
    gap: $space-2;
  }
}

.progress-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  opacity: 0.6;
  transition: all $transition-base;

  &--completed,
  &--active {
    opacity: 1;
  }

  &--active {
    transform: scale(1.05);
  }
}

.step-indicator {
  margin-bottom: $space-3;
}

.step-icon {
  width: 48px;
  height: 48px;
  background: rgba($white, 0.15);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all $transition-base;
  backdrop-filter: blur(10px);
  border: 2px solid rgba($white, 0.2);

  .progress-step--completed & {
    background: $white;
    color: $primary-600;
    border-color: $white;
  }

  .progress-step--active & {
    background: rgba($white, 0.25);
    border-color: $white;
    box-shadow: 0 0 20px rgba($white, 0.3);
  }

  .check-icon {
    width: 24px;
    height: 24px;
  }

  .step-number {
    font-size: $text-lg;
    font-weight: $font-bold;
    color: currentColor;
  }

  @media (max-width: $breakpoint-sm) {
    width: 40px;
    height: 40px;

    .check-icon {
      width: 20px;
      height: 20px;
    }

    .step-number {
      font-size: $text-base;
    }
  }
}

.step-content {
  .step-name {
    font-size: $text-base;
    font-weight: $font-semibold;
    margin-bottom: $space-1;

    @media (max-width: $breakpoint-sm) {
      font-size: $text-sm;
    }
  }

  .step-description {
    font-size: $text-xs;
    opacity: 0.8;
    line-height: $leading-tight;

    @media (max-width: $breakpoint-sm) {
      display: none;
    }
  }
}

// Professional Wizard Content
.wizard-content {
  max-width: 800px;
  margin: 0 auto;
  padding: $space-6 $space-4;

  @media (min-width: $breakpoint-md) {
    padding: $space-8 $space-6;
  }
}

.content-card {
  background: $white;
  border-radius: $radius-2xl;
  box-shadow: $shadow-xl;
  overflow: hidden;
  border: 1px solid $gray-200;
}

.step-container {
  padding: $space-8;

  @media (max-width: $breakpoint-sm) {
    padding: $space-6;
  }
}

.step-header {
  text-align: center;
  margin-bottom: $space-8;
  padding-bottom: $space-6;
  border-bottom: 2px solid $gray-200;

  .step-icon-large {
    width: 80px;
    height: 80px;
    background: linear-gradient(135deg, $primary-500, $primary-600);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2.5rem;
    margin: 0 auto $space-4;
    box-shadow: $shadow-lg;
  }

  .step-title {
    font-size: $text-2xl;
    font-weight: $font-bold;
    color: $gray-900;
    margin: 0 0 $space-2;

    @media (min-width: $breakpoint-md) {
      font-size: $text-3xl;
    }
  }

  .step-subtitle {
    font-size: $text-base;
    color: $gray-600;
    line-height: $leading-relaxed;
    max-width: 500px;
    margin: 0 auto;

    @media (min-width: $breakpoint-md) {
      font-size: $text-lg;
    }
  }
}

// Professional Navigation
.wizard-navigation {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: $white;
  border-top: 1px solid $gray-200;
  box-shadow: $shadow-xl;
  z-index: $z-index-fixed;
  padding: $space-4;
  padding-bottom: calc(#{$space-4} + #{$safe-area-bottom});

  @media (min-width: $breakpoint-md) {
    padding: $space-6;
    padding-bottom: calc(#{$space-6} + #{$safe-area-bottom});
  }
}

.nav-container {
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $space-4;
}

.nav-btn {
  display: flex;
  align-items: center;
  gap: $space-2;
  height: $button-height-base;
  padding: 0 $space-6;
  border-radius: $radius-xl;
  font-size: $text-base;
  font-weight: $font-medium;
  border: none;
  cursor: pointer;
  transition: all $transition-base;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .nav-icon {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
  }

  &--secondary {
    background: $gray-100;
    color: $gray-700;
    border: 2px solid $gray-300;

    &:hover:not(:disabled) {
      background: $gray-200;
      border-color: $gray-400;
      transform: translateY(-1px);
    }
  }

  &--primary {
    background: linear-gradient(135deg, $primary-500, $primary-600);
    color: $white;
    border: 2px solid $primary-600;
    min-width: 120px;

    &:hover:not(:disabled) {
      background: linear-gradient(135deg, $primary-600, $primary-700);
      transform: translateY(-1px);
      box-shadow: $shadow-lg;
    }

    &--submit {
      background: linear-gradient(135deg, $success, $success-dark);
      border-color: $success-dark;
      position: relative;

      &:hover:not(:disabled) {
        background: linear-gradient(135deg, $success-dark, $success);
      }
    }
  }
}

.nav-progress {
  flex: 1;
  text-align: center;

  .nav-step-info {
    font-size: $text-sm;
    color: $gray-600;
    font-weight: $font-medium;
  }
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba($white, 0.3);
  border-top: 2px solid $white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-right: $space-2;
}

// Professional Price Summary
.price-summary-card {
  position: fixed;
  top: 140px;
  right: $space-6;
  background: linear-gradient(135deg, $primary-600, $primary-800);
  color: $white;
  padding: $space-6;
  border-radius: $radius-2xl;
  box-shadow: $shadow-2xl;
  min-width: 200px;
  z-index: $z-index-sticky;
  animation: slideInRight 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba($white, 0.1);

  @media (max-width: $breakpoint-md) {
    right: $space-4;
    top: 120px;
    min-width: 160px;
    padding: $space-4;
  }

  @media (max-width: $breakpoint-sm) {
    position: static;
    margin: $space-4 $space-4 0;
    animation: none;
  }
}

.summary-header {
  display: flex;
  align-items: center;
  gap: $space-2;
  margin-bottom: $space-4;

  .summary-icon {
    width: 20px;
    height: 20px;
    opacity: 0.9;
  }

  .summary-title {
    font-size: $text-sm;
    font-weight: $font-medium;
    opacity: 0.9;
  }
}

.summary-amount {
  display: flex;
  align-items: baseline;
  gap: $space-1;
  margin-bottom: $space-3;

  .currency {
    font-size: $text-lg;
    font-weight: $font-semibold;
  }

  .price {
    font-size: $text-2xl;
    font-weight: $font-bold;
    line-height: $leading-none;
  }
}

.summary-details {
  .item-count {
    font-size: $text-xs;
    opacity: 0.8;
  }
}

// Animations
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(100%) scale(0.8);
  }
  to {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
}

// Responsive optimizations
@media (max-width: $breakpoint-sm) {
  .wizard-progress {
    padding: $space-2 $space-3 $space-3;
  }

  .wizard-title {
    font-size: $text-xl;
  }

  .step-counter {
    padding: $space-1 $space-3;

    .current-step,
    .total-steps {
      font-size: $text-base;
    }
  }

  .progress-steps {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .nav-container {
    gap: $space-2;
  }

  .nav-btn {
    height: $button-height-sm;
    padding: 0 $space-4;
    font-size: $text-sm;

    .nav-icon {
      width: 16px;
      height: 16px;
    }

    &--primary {
      min-width: 100px;
    }
  }
}

// Accessibility improvements
@media (prefers-reduced-motion: reduce) {
  .progress-fill,
  .step-icon,
  .progress-step,
  .nav-btn {
    transition: none;
  }

  .price-summary-card {
    animation: none;
  }

  .loading-spinner {
    animation: none;
  }
}

// Print styles
@media print {
  .wizard-navigation,
  .price-summary-card {
    display: none;
  }

  .quote-wizard {
    background: $white;
  }

  .wizard-progress {
    background: $gray-100;
    color: $gray-900;
    box-shadow: none;
  }
}
</style>
