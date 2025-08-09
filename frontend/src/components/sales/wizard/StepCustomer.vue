<!--
  Quote Wizard - Step 1: Customer Information
  Focused, mobile-optimized customer data collection
-->
<template>
  <view class="step-customer">
    <view class="step-header">
      <text class="step-title">客户信息</text>
      <text class="step-subtitle">请填写客户的基本信息，带 * 为必填项</text>
    </view>

    <!-- Essential Information First -->
    <view class="customer-card">
      <view class="card-title">
        <text class="title-icon">👤</text>
        <text class="title-text">基本信息</text>
      </view>

      <view class="form-group">
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
            <view v-if="localForm.customerName && !errors.customerName" class="success-icon">
              ✓
            </view>
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
            <view v-if="isValidPhone && !errors.customerPhone" class="success-icon"> ✓ </view>
          </template>
          <template #help>
            <text v-if="localForm.customerPhone && !errors.customerPhone" class="format-hint">
              {{ formatPhoneDisplay(localForm.customerPhone) }}
            </text>
          </template>
        </SalesInput>
      </view>

      <!-- Customer Type Selection -->
      <view class="form-group">
        <text class="group-label">客户类型</text>
        <text class="group-hint">选择合适的客户类型，享受对应优惠</text>

        <view class="customer-types">
          <view
            v-for="type in customerTypes"
            :key="type.value"
            class="type-card"
            :class="{ 'type-card--selected': localForm.customerType === type.value }"
            @click="selectCustomerType(type.value)"
          >
            <text class="type-icon">{{ type.icon }}</text>
            <text class="type-name">{{ type.label }}</text>
            <text class="type-discount" v-if="type.discount"> {{ type.discount }}% 优惠 </text>
          </view>
        </view>
      </view>
    </view>

    <!-- Contact Information (Progressive Disclosure) -->
    <view class="customer-card">
      <view class="card-title">
        <text class="title-icon">📞</text>
        <text class="title-text">联系方式</text>
        <text class="optional-badge">选填</text>
      </view>

      <view class="form-group">
        <SalesInput
          v-model="localForm.customerWechat"
          label="微信号"
          placeholder="微信号/手机号均可"
          :error="errors.customerWechat"
          @blur="validateWechat"
        >
          <template #prefix>
            <text class="input-icon">💬</text>
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
            <text class="input-icon">📧</text>
          </template>
        </SalesInput>
      </view>
    </view>

    <!-- Address Information (Collapsible) -->
    <view class="customer-card">
      <view class="card-title" @click="showAddressSection = !showAddressSection">
        <text class="title-icon">📍</text>
        <text class="title-text">地址信息</text>
        <text class="optional-badge">选填</text>
        <text class="collapse-icon">{{ showAddressSection ? '▲' : '▼' }}</text>
      </view>

      <view v-if="showAddressSection" class="address-content">
        <!-- Simplified Location Picker -->
        <view class="location-row">
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
        </view>

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
      </view>
    </view>

    <!-- Quick Actions -->
    <view class="quick-actions">
      <view class="save-option" @click="toggleSaveCustomer">
        <view class="checkbox" :class="{ 'checkbox--checked': localForm.saveCustomer }">
          <text v-if="localForm.saveCustomer" class="checkbox-check">✓</text>
        </view>
        <text class="option-text">保存客户信息，便于下次使用</text>
      </view>
    </view>

    <!-- Mobile CTA -->
    <view class="step-actions">
      <SalesButton type="primary" :block="true" @click="handleNext" :disabled="!isValidStep">
        下一步：选择产品
      </SalesButton>
    </view>
  </view>
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
  customerType: 'individual' | 'company' | 'dealer' | 'club'
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
  customerType: props.form.customerType || 'individual',
  customerRemark: props.form.customerRemark || '',
  saveCustomer: props.form.saveCustomer || true
})

// UI state
const showAddressSection = ref(false)
const locationLoading = ref(false)

// Customer types with benefits
const customerTypes = [
  {
    value: 'individual',
    label: '个人客户',
    icon: '👤',
    discount: 0,
    description: '个人购买'
  },
  {
    value: 'company',
    label: '企业客户',
    icon: '🏢',
    discount: 5,
    description: '企业采购'
  },
  {
    value: 'dealer',
    label: '经销商',
    icon: '🤝',
    discount: 10,
    description: '批发合作'
  },
  {
    value: 'club',
    label: '俱乐部',
    icon: '🎯',
    discount: 8,
    description: '场馆采购'
  }
]

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

const isValidStep = computed(() => {
  return (
    localForm.customerName.trim().length >= 2 &&
    isValidPhone.value &&
    !props.errors.customerName &&
    !props.errors.customerPhone
  )
})

// Methods
const handleNameInput = (value: string | Event) => {
  // Handle both string values and event objects
  const inputValue =
    typeof value === 'string' ? value : (value.target as HTMLInputElement)?.value || ''
  localForm.customerName = inputValue.trim()
  if (inputValue.trim()) {
    props.errors.customerName = ''
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
    props.errors.customerPhone = ''
  }
  emitFormUpdate()
}

const validateName = () => {
  const name = localForm.customerName.trim()

  if (!name) {
    props.errors.customerName = '请输入客户姓名'
    return false
  }

  if (name.length < 2) {
    props.errors.customerName = '姓名至少2个字符'
    return false
  }

  if (name.length > 20) {
    props.errors.customerName = '姓名不能超过20个字符'
    return false
  }

  if (!/^[\u4e00-\u9fa5a-zA-Z\s]+$/.test(name)) {
    props.errors.customerName = '姓名只能包含中文、英文和空格'
    return false
  }

  props.errors.customerName = ''
  return true
}

const validatePhone = () => {
  const phone = localForm.customerPhone.trim()

  if (!phone) {
    props.errors.customerPhone = '请输入手机号码'
    return false
  }

  if (!isValidPhone.value) {
    props.errors.customerPhone = '请输入正确的11位手机号码'
    return false
  }

  props.errors.customerPhone = ''
  return true
}

const validateWechat = () => {
  const wechat = localForm.customerWechat.trim()

  if (wechat && wechat.length < 6) {
    props.errors.customerWechat = '微信号至少6位'
    return false
  }

  props.errors.customerWechat = ''
  return true
}

const validateEmail = () => {
  const email = localForm.customerEmail.trim()

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    props.errors.customerEmail = '请输入正确的邮箱格式'
    return false
  }

  props.errors.customerEmail = ''
  return true
}

const selectCustomerType = (type: string) => {
  localForm.customerType = type as CustomerForm['customerType']
  emitFormUpdate()

  // Show discount feedback
  const selectedType = customerTypes.find(t => t.value === type)
  if (selectedType?.discount > 0) {
    toast.success(`已选择${selectedType.label}，享${selectedType.discount}%优惠`, 2000)
  }
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
    .then(res => {
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

const handleNext = () => {
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

// Customer Types
.customer-types {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $spacing-sm;
}

.type-card {
  @include card;
  padding: $spacing-base;
  text-align: center;
  cursor: pointer;
  transition: $transition-base;
  border: 2px solid transparent;
  position: relative;

  &:active {
    transform: scale(0.98);
  }

  &--selected {
    border-color: $primary-color;
    background-color: $primary-bg;
  }
}

.type-icon {
  font-size: $font-size-extra-large;
  display: block;
  margin-bottom: $spacing-xs;
}

.type-name {
  font-size: $font-size-small;
  font-weight: $font-weight-medium;
  color: $text-color;
  display: block;
  margin-bottom: $spacing-xs;

  .type-card--selected & {
    color: $primary-color;
    font-weight: $font-weight-semibold;
  }
}

.type-discount {
  font-size: $font-size-extra-small;
  color: $success-color;
  font-weight: $font-weight-medium;
  background-color: $success-bg;
  padding: 2px 6px;
  border-radius: 8px;
  display: inline-block;
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

// Step Actions
.step-actions {
  margin-top: $spacing-xl;
  padding-top: $spacing-lg;
  border-top: 1px solid $border-color-lighter;
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
  .customer-types {
    grid-template-columns: 1fr;
  }

  .location-row {
    grid-template-columns: 1fr;
    gap: $spacing-sm;
  }

  .customer-card {
    padding: $spacing-base;
  }
}

@media (min-width: $breakpoint-lg) {
  .customer-types {
    grid-template-columns: repeat(4, 1fr);
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
.type-card:focus,
.save-option:focus {
  outline: 2px solid $primary-color;
  outline-offset: 2px;
}
</style>
