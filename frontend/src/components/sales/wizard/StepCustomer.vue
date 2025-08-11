<!--
  Quote Wizard - Step 1: Customer Information
  Focused, mobile-optimized customer data collection
-->
<template>
  <div class="step-customer">
    <div class="step-header">
      <h2 class="step-title">客户信息</h2>
      <p class="step-subtitle">请填写客户的基本信息，带 * 为必填项</p>
    </div>

    <!-- Essential Information First -->
    <div class="customer-card">
      <div class="card-title">
        <span class="title-icon">👤</span>
        <h3 class="title-text">基本信息</h3>
      </div>

      <div class="form-group">
        <SalesInput
          v-model="localForm.customerName"
          label="客户姓名 *"
          placeholder="请输入真实姓名"
          :required="true"
          :error="errors.customerName"
          @input="handleNameInput"
          @blur="validateName"
        >
          <template #suffix>
            <span v-if="localForm.customerName && !errors.customerName" class="success-icon">
              ✓
            </span>
          </template>
        </SalesInput>

        <SalesInput
          v-model="localForm.customerPhone"
          label="联系电话 *"
          placeholder="请输入11位手机号码"
          type="tel"
          :maxlength="11"
          :required="true"
          :error="errors.customerPhone"
          @input="handlePhoneInput"
          @blur="validatePhone"
        >
          <template #suffix>
            <span v-if="isValidPhone && !errors.customerPhone" class="success-icon"> ✓ </span>
          </template>
          <template #help>
            <span v-if="localForm.customerPhone && !errors.customerPhone" class="format-hint">
              {{ formatPhoneDisplay(localForm.customerPhone) }}
            </span>
          </template>
        </SalesInput>
      </div>
    </div>

    <!-- Contact Information (Progressive Disclosure) -->
    <div class="customer-card">
      <div class="card-title">
        <span class="title-icon">📞</span>
        <h3 class="title-text">联系方式</h3>
        <span class="optional-badge">选填</span>
      </div>

      <div class="form-group">
        <SalesInput
          v-model="localForm.customerWechat"
          label="微信号"
          placeholder="微信号/手机号均可"
          :error="errors.customerWechat"
          @blur="validateWechat"
        >
          <template #prefix>
            <span class="input-icon">💬</span>
          </template>
          <template #suffix>
            <SalesButton
              v-if="localForm.customerWechat && !localForm.customerPhone"
              size="mini"
              type="plain"
              @click="copyWechatToPhone"
            >
              同步
            </SalesButton>
          </template>
        </SalesInput>

        <SalesInput
          v-model="localForm.customerEmail"
          label="邮箱地址"
          placeholder="用于发送报价单"
          type="email"
          :error="errors.customerEmail"
          @blur="validateEmail"
        >
          <template #prefix>
            <span class="input-icon">📧</span>
          </template>
        </SalesInput>
      </div>
    </div>

    <!-- Address Information (Collapsible) -->
    <div class="customer-card">
      <div class="card-title" @click="showAddressSection = !showAddressSection">
        <span class="title-icon">📍</span>
        <h3 class="title-text">地址信息</h3>
        <span class="optional-badge">选填</span>
        <span class="collapse-icon">{{ showAddressSection ? '▲' : '▼' }}</span>
      </div>

      <div v-if="showAddressSection" class="address-content">
        <!-- Simplified Location Picker -->
        <div class="location-row">
          <SalesSelector
            v-model="localForm.customerProvince"
            label="省份"
            placeholder="选择省份"
            :options="provinceOptions"
            @change="handleProvinceChange"
            class="location-select"
          />
          <SalesSelector
            v-model="localForm.customerCity"
            label="城市"
            placeholder="选择城市"
            :options="cityOptions"
            :disabled="!localForm.customerProvince"
            @change="handleCityChange"
            class="location-select"
          />
        </div>

        <SalesInput
          v-model="localForm.customerAddress"
          label="详细地址"
          placeholder="街道、门牌号、小区楼栋等"
          :maxlength="100"
          :error="errors.customerAddress"
        >
          <template #suffix>
            <SalesButton
              size="mini"
              type="plain"
              @click="getCurrentLocation"
              :loading="locationLoading"
            >
              定位
            </SalesButton>
          </template>
        </SalesInput>

        <!-- Remarks -->
        <SalesTextarea
          v-model="localForm.customerRemark"
          label="备注信息"
          placeholder="特殊要求、偏好等"
          :maxlength="200"
          :show-count="true"
          :auto-height="true"
        />
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="quick-actions">
      <div class="save-option" @click="toggleSaveCustomer">
        <div class="checkbox" :class="{ 'checkbox--checked': localForm.saveCustomer }">
          <span v-if="localForm.saveCustomer" class="checkbox-check">✓</span>
        </div>
        <span class="option-text">保存客户信息，便于下次使用</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import SalesInput from '../SalesInput.vue'
import SalesTextarea from '../SalesTextarea.vue'
import SalesButton from '../SalesButton.vue'
import SalesSelector from '../SalesSelector.vue'
import { dialog, location, toast } from '@/utils/platform-adapter'

interface CustomerForm {
  customerName: string
  customerPhone: string
  customerWechat: string
  customerEmail: string
  customerProvince: string
  customerCity: string
  customerAddress: string
  customerRemark: string
  saveCustomer: boolean
}

interface Props {
  form: CustomerForm
  errors: Record<string, string>
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:form': [form: CustomerForm]
  'update:errors': [errors: Record<string, string>]
  next: []
  validate: []
}>()

// Local reactive form to prevent prop mutation
const localForm = reactive({
  customerName: props.form.customerName || '',
  customerPhone: props.form.customerPhone || '',
  customerWechat: props.form.customerWechat || '',
  customerEmail: props.form.customerEmail || '',
  customerProvince: props.form.customerProvince || '',
  customerCity: props.form.customerCity || '',
  customerAddress: props.form.customerAddress || '',
  customerRemark: props.form.customerRemark || '',
  saveCustomer: props.form.saveCustomer || true
})

// UI state
const showAddressSection = ref(false)
const locationLoading = ref(false)

// Mock location data
const provinceOptions = ref([
  { label: '云南省', value: 'yunnan' },
  { label: '四川省', value: 'sichuan' },
  { label: '贵州省', value: 'guizhou' }
])

const cityOptions = ref<Array<{ label: string; value: string }>>([])

const cityMap = {
  yunnan: [
    { label: '昆明市', value: 'kunming' },
    { label: '大理州', value: 'dali' },
    { label: '丽江市', value: 'lijiang' }
  ],
  sichuan: [
    { label: '成都市', value: 'chengdu' },
    { label: '绵阳市', value: 'mianyang' }
  ],
  guizhou: [
    { label: '贵阳市', value: 'guiyang' },
    { label: '遵义市', value: 'zunyi' }
  ]
}

// Computed
const isValidPhone = computed(() => {
  return /^1[3-9]\d{9}$/.test(localForm.customerPhone)
})

const _isValidStep = computed(() => {
  return (
    localForm.customerName.trim().length >= 2 &&
    isValidPhone.value &&
    !props.errors.customerName &&
    !props.errors.customerPhone
  )
})

// Helper function to clear specific error
const clearError = (fieldName: string) => {
  const updatedErrors = { ...props.errors }
  delete updatedErrors[fieldName]
  emit('update:errors', updatedErrors)
}

// Helper function to set specific error
const setError = (fieldName: string, message: string) => {
  const updatedErrors = { ...props.errors, [fieldName]: message }
  emit('update:errors', updatedErrors)
}

// Methods
const handleNameInput = (value: string | Event) => {
  // Handle both string values and event objects
  const inputValue =
    typeof value === 'string' ? value : (value.target as HTMLInputElement)?.value || ''
  localForm.customerName = inputValue.trim()
  if (inputValue.trim()) {
    clearError('customerName')
  }
  emitFormUpdate()
}

const handlePhoneInput = (value: string | Event) => {
  // Handle both string values and event objects
  const inputValue =
    typeof value === 'string' ? value : (value.target as HTMLInputElement)?.value || ''
  const phoneNumber = inputValue.replace(/\D/g, '')
  localForm.customerPhone = phoneNumber
  if (phoneNumber) {
    clearError('customerPhone')
  }
  emitFormUpdate()
}

const validateName = () => {
  const name = localForm.customerName.trim()

  if (!name) {
    setError('customerName', '请输入客户姓名')
    return false
  }

  if (name.length < 2) {
    setError('customerName', '姓名至少2个字符')
    return false
  }

  if (name.length > 20) {
    setError('customerName', '姓名不能超过20个字符')
    return false
  }

  if (!/^[\u4e00-\u9fa5a-zA-Z\s]+$/.test(name)) {
    setError('customerName', '姓名只能包含中文、英文和空格')
    return false
  }

  clearError('customerName')
  return true
}

const validatePhone = () => {
  const phone = localForm.customerPhone.trim()

  if (!phone) {
    setError('customerPhone', '请输入手机号码')
    return false
  }

  if (!isValidPhone.value) {
    setError('customerPhone', '请输入正确的11位手机号码')
    return false
  }

  clearError('customerPhone')
  return true
}

const validateWechat = () => {
  const wechat = localForm.customerWechat.trim()

  if (wechat && wechat.length < 6) {
    setError('customerWechat', '微信号至少6位')
    return false
  }

  clearError('customerWechat')
  return true
}

const validateEmail = () => {
  const email = localForm.customerEmail.trim()

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    setError('customerEmail', '请输入正确的邮箱格式')
    return false
  }

  clearError('customerEmail')
  return true
}

const formatPhoneDisplay = (phone: string) => {
  if (phone.length === 11) {
    return phone.replace(/(\d{3})(\d{4})(\d{4})/, '$1 $2 $3')
  }
  return phone
}

const copyWechatToPhone = () => {
  const wechat = localForm.customerWechat.trim()
  if (/^1[3-9]\d{9}$/.test(wechat)) {
    localForm.customerPhone = wechat
    validatePhone()
    emitFormUpdate()
    toast.success('已同步到手机号')
  } else {
    toast.show('微信号格式不是手机号', 'none')
  }
}

const handleProvinceChange = (province: string) => {
  localForm.customerProvince = province
  localForm.customerCity = ''
  cityOptions.value = cityMap[province] || []
  emitFormUpdate()
}

const handleCityChange = (city: string) => {
  localForm.customerCity = city
  emitFormUpdate()
}

const getCurrentLocation = () => {
  locationLoading.value = true

  location
    .getCurrentPosition()
    .then(_res => {
      // Simulate reverse geocoding
      setTimeout(() => {
        localForm.customerAddress = '昆明市五华区东风西路123号'
        locationLoading.value = false
        emitFormUpdate()
        toast.success('定位成功')
      }, 1000)
    })
    .catch(() => {
      locationLoading.value = false
      dialog.confirm({
        title: '定位失败',
        content: '无法获取位置信息，请手动输入'
      })
    })
}

const toggleSaveCustomer = () => {
  localForm.saveCustomer = !localForm.saveCustomer
  emitFormUpdate()
}

const emitFormUpdate = () => {
  const formData = { ...localForm }
  console.log('Emitting form update:', formData)
  emit('update:form', formData)
}

const _handleNext = () => {
  if (validateName() && validatePhone() && validateWechat() && validateEmail()) {
    emit('next')
  }
}

// Initialize parent form on mount
onMounted(() => {
  emitFormUpdate()
})

// Watch for external form changes
watch(
  () => props.form,
  newForm => {
    Object.assign(localForm, newForm)
  },
  { deep: true }
)
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.step-customer {
  max-width: 500px;
  margin: 0 auto;
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

.customer-card {
  @include card;
  margin-bottom: $spacing-lg;
  padding: $spacing-lg;
  border-radius: $border-radius-lg;
}

.card-title {
  display: flex;
  align-items: center;
  margin-bottom: $spacing-base;
  cursor: pointer;
  position: relative;
}

.title-icon {
  font-size: $font-size-large;
  margin-right: $spacing-sm;
}

.title-text {
  font-size: $font-size-medium;
  font-weight: $font-weight-medium;
  color: $text-color;
  flex: 1;
}

.optional-badge {
  background-color: $info-bg;
  color: $info-color;
  font-size: $font-size-extra-small;
  padding: 2px 8px;
  border-radius: 12px;
  margin-right: $spacing-sm;
}

.collapse-icon {
  font-size: $font-size-small;
  color: $text-color-secondary;
  transition: $transition-base;
}

.form-group {
  margin-bottom: $spacing-lg;

  &:last-child {
    margin-bottom: 0;
  }
}

.group-label {
  font-size: $font-size-base;
  font-weight: $font-weight-medium;
  color: $text-color;
  display: block;
  margin-bottom: $spacing-xs;
}

.group-hint {
  font-size: $font-size-small;
  color: $text-color-secondary;
  display: block;
  margin-bottom: $spacing-base;
}

.success-icon {
  color: $success-color;
  font-size: $font-size-base;
  font-weight: $font-weight-semibold;
}

.input-icon {
  font-size: $font-size-base;
  margin-right: $spacing-xs;
}

.format-hint {
  font-size: $font-size-small;
  color: $primary-color;
  margin-top: $spacing-xs;
}

// Address Section
.address-content {
  animation: slideDown 0.3s ease-out;
}

.location-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $spacing-base;
  margin-bottom: $spacing-base;
}

// Quick Actions
.quick-actions {
  margin-bottom: $spacing-xl;
}

.save-option {
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

.option-text {
  font-size: $font-size-base;
  color: $text-color;
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
    max-height: 500px;
    transform: translateY(0);
  }
}

// Responsive Design
@media (max-width: $breakpoint-sm) {
  .location-row {
    grid-template-columns: 1fr;
    gap: $spacing-sm;
  }

  .customer-card {
    padding: $spacing-base;
  }
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .type-card,
  .collapse-icon {
    transition: none;
  }

  .address-content {
    animation: none;
  }
}

/* Focus states for keyboard navigation */
.save-option:focus {
  outline: 2px solid $primary-color;
  outline-offset: 2px;
}
</style>
