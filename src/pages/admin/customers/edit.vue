<template>
  <div class="customer-edit-page">
    <!-- Header -->
    <div class="page-header">
      <span class="page-title">{{ isEditMode ? '编辑客户' : '新增客户' }}</span>
      <div class="header-actions">
        <button class="action-btn cancel-btn" @click="handleCancel">取消</button>
        <button class="action-btn save-btn" @click="handleSave" :loading="saving">
          {{ isEditMode ? '更新' : '保存' }}
        </button>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="loading && isEditMode" class="loading-container">
      <span class="loading-text">加载客户信息中...</span>
    </div>

    <!-- Edit Form -->
    <div v-else class="form-container">
      <!-- Basic Information -->
      <div class="form-section">
        <span class="section-title">基本信息</span>

        <div class="form-row">
          <div class="form-item">
            <span class="form-label">客户姓名 *</span>
            <input
              v-model="formData.name"
              class="form-input"
              placeholder="请输入客户姓名"
              :class="{ error: errors.name }"
            />
            <span v-if="errors.name" class="error-text">{{ errors.name }}</span>
          </div>

          <div class="form-item">
            <span class="form-label">联系电话 *</span>
            <input
              v-model="formData.phone"
              class="form-input"
              placeholder="请输入手机号"
              type="tel"
              :class="{ error: errors.phone }"
            />
            <span v-if="errors.phone" class="error-text">{{ errors.phone }}</span>
          </div>
        </div>

        <div class="form-row">
          <div class="form-item">
            <span class="form-label">客户类型 *</span>
            <select
              v-model="customerTypeIndex"
              class="form-select"
              :class="{ error: errors.customer_type }"
              @change="handleCustomerTypeChange"
            >
              <option v-for="(option, index) in customerTypeOptions" :key="index" :value="index">
                {{ option.label }}
              </option>
            </select>
            <span v-if="errors.customer_type" class="error-text">{{ errors.customer_type }}</span>
          </div>

          <div class="form-item">
            <span class="form-label">客户状态</span>
            <select v-model="statusIndex" class="form-select" @change="handleStatusChange">
              <option v-for="(option, index) in statusOptions" :key="index" :value="index">
                {{ option.label }}
              </option>
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-item">
            <span class="form-label">客户来源</span>
            <select v-model="sourceIndex" class="form-select" @change="handleSourceChange">
              <option v-for="(option, index) in sourceOptions" :key="index" :value="index">
                {{ option.label }}
              </option>
            </select>
          </div>

          <div class="form-item" v-if="formData.customer_type === 'individual'">
            <span class="form-label">性别</span>
            <select v-model="genderIndex" class="form-select" @change="handleGenderChange">
              <option v-for="(option, index) in genderOptions" :key="index" :value="index">
                {{ option.label }}
              </option>
            </select>
          </div>
        </div>

        <!-- Business specific fields -->
        <div v-if="formData.customer_type === 'business'" class="business-fields">
          <div class="form-row">
            <div class="form-item">
              <span class="form-label">公司名称 *</span>
              <input
                v-model="formData.company"
                class="form-input"
                placeholder="请输入公司名称"
                :class="{ error: errors.company }"
              />
              <span v-if="errors.company" class="error-text">{{ errors.company }}</span>
            </div>

            <div class="form-item">
              <span class="form-label">法定代表人</span>
              <input
                v-model="formData.legal_representative"
                class="form-input"
                placeholder="请输入法定代表人"
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-item">
              <span class="form-label">营业执照号</span>
              <input
                v-model="formData.business_license"
                class="form-input"
                placeholder="请输入营业执照号"
              />
            </div>

            <div class="form-item">
              <span class="form-label">税务登记号</span>
              <input v-model="formData.tax_id" class="form-input" placeholder="请输入税务登记号" />
            </div>
          </div>
        </div>

        <!-- Individual specific fields -->
        <div v-if="formData.customer_type === 'individual'" class="individual-fields">
          <div class="form-row">
            <div class="form-item">
              <span class="form-label">出生日期</span>
              <input
                type="date"
                v-model="formData.birthday"
                class="form-input"
                @change="handleBirthdayChange"
              />
            </div>

            <div class="form-item">
              <span class="form-label">职业</span>
              <input v-model="formData.occupation" class="form-input" placeholder="请输入职业" />
            </div>
          </div>
        </div>
      </div>

      <!-- Contact Information -->
      <div class="form-section">
        <span class="section-title">联系方式</span>

        <div class="form-row">
          <div class="form-item">
            <span class="form-label">电子邮箱</span>
            <input
              v-model="formData.email"
              class="form-input"
              placeholder="请输入邮箱地址"
              type="text"
              :class="{ error: errors.email }"
            />
            <span v-if="errors.email" class="error-text">{{ errors.email }}</span>
          </div>

          <div class="form-item">
            <span class="form-label">微信号</span>
            <input v-model="formData.wechat_id" class="form-input" placeholder="请输入微信号" />
          </div>
        </div>

        <div class="form-row">
          <div class="form-item">
            <span class="form-label">偏好联系方式</span>
            <select
              v-model="contactMethodIndex"
              class="form-select"
              @change="handleContactMethodChange"
            >
              <option v-for="(option, index) in contactMethodOptions" :key="index" :value="index">
                {{ option.label }}
              </option>
            </select>
          </div>

          <div class="form-item">
            <span class="form-label">联系时间偏好</span>
            <input
              v-model="formData.contact_time_preference"
              class="form-input"
              placeholder="如：工作日上午9-12点"
            />
          </div>
        </div>
      </div>

      <!-- Address Information -->
      <div class="form-section">
        <span class="section-title">地址信息</span>

        <div class="form-row">
          <div class="form-item">
            <span class="form-label">城市</span>
            <input v-model="formData.city" class="form-input" placeholder="请输入城市" />
          </div>

          <div class="form-item">
            <span class="form-label">区域</span>
            <input v-model="formData.district" class="form-input" placeholder="请输入区域/区县" />
          </div>
        </div>

        <div class="form-item">
          <span class="form-label">详细地址</span>
          <input v-model="formData.address" class="form-input" placeholder="请输入详细地址" />
        </div>
      </div>

      <!-- Additional Information -->
      <div class="form-section">
        <span class="section-title">备注信息</span>

        <div class="form-item">
          <span class="form-label">备注</span>
          <textarea
            v-model="formData.notes"
            class="form-textarea"
            placeholder="请输入客户备注信息..."
            maxlength="500"
          />
          <span class="char-count">{{ (formData.notes || '').length }}/500</span>
        </div>
      </div>
    </div>

    <!-- Confirmation Modal -->
    <div v-if="showConfirmModal" class="modal-overlay" @click.self="cancelAction">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ confirmModalTitle }}</h3>
          <button class="modal-close" @click="cancelAction">&times;</button>
        </div>
        <div class="modal-body">
          <span>{{ confirmModalContent }}</span>
        </div>
        <div class="modal-footer">
          <button class="modal-btn modal-cancel" @click="cancelAction">取消</button>
          <button class="modal-btn modal-confirm" @click="confirmAction">确认</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCustomersStore } from '@/stores/customers'
import type { CreateCustomerData, Customer, UpdateCustomerData } from '@/types/customer'

const route = useRoute()
const router = useRouter()
const customersStore = useCustomersStore()

// State
const loading = ref(false)
const saving = ref(false)
const customerId = ref('')
const originalCustomer = ref<Customer | null>(null)

// Form mode
const isEditMode = computed(() => !!customerId.value)

// Form data
const formData = reactive<CreateCustomerData & UpdateCustomerData>({
  name: '',
  phone: '',
  email: '',
  wechat_id: '',
  company: '',
  address: '',
  city: '',
  district: '',
  customer_type: 'individual',
  status: 'active',
  source: 'walk_in',
  notes: '',
  birthday: '',
  gender: undefined,
  occupation: '',
  business_license: '',
  tax_id: '',
  legal_representative: '',
  preferred_contact_method: 'phone',
  contact_time_preference: ''
})

// Form errors
const errors = reactive<Record<string, string>>({})

// Picker indices
const customerTypeIndex = ref(0)
const statusIndex = ref(0)
const sourceIndex = ref(0)
const genderIndex = ref(0)
const contactMethodIndex = ref(0)

// Options
const customerTypeOptions = [
  { value: 'individual', label: '个人客户' },
  { value: 'business', label: '企业客户' }
]

const statusOptions = [
  { value: 'active', label: '活跃' },
  { value: 'inactive', label: '停用' },
  { value: 'potential', label: '潜在客户' },
  { value: 'blacklist', label: '黑名单' }
]

const sourceOptions = [
  { value: 'walk_in', label: '到店咨询' },
  { value: 'referral', label: '朋友推荐' },
  { value: 'online', label: '网络咨询' },
  { value: 'phone', label: '电话咨询' },
  { value: 'exhibition', label: '展会' },
  { value: 'other', label: '其他' }
]

const genderOptions = [
  { value: undefined, label: '不选择' },
  { value: 'male', label: '男' },
  { value: 'female', label: '女' },
  { value: 'other', label: '其他' }
]

const contactMethodOptions = [
  { value: 'phone', label: '电话' },
  { value: 'wechat', label: '微信' },
  { value: 'email', label: '邮件' }
]

// Confirmation modal
const showConfirmModal = ref(false)
const confirmModalTitle = ref('')
const confirmModalContent = ref('')
const confirmAction = ref<() => void>(() => {})

// Initialize
onMounted(() => {
  const id = route.query.id as string
  if (id) {
    customerId.value = id
    loadCustomer()
  }
})

// Load customer data for editing
async function loadCustomer() {
  if (!customerId.value) return

  loading.value = true
  try {
    const customer = await customersStore.fetchCustomerById(customerId.value, false, false)
    originalCustomer.value = customer

    // Populate form data
    Object.keys(formData).forEach(key => {
      if (key in customer && customer[key as keyof Customer] !== undefined) {
        ;(formData as any)[key] = customer[key as keyof Customer]
      }
    })

    // Set picker indices based on loaded data
    updatePickerIndices()
  } catch (error) {
    console.error('加载客户信息失败:', error)
    alert('加载客户信息失败')
    handleCancel()
  } finally {
    loading.value = false
  }
}

function updatePickerIndices() {
  // Update customer type index
  const typeIndex = customerTypeOptions.findIndex(option => option.value === formData.customer_type)
  if (typeIndex !== -1) customerTypeIndex.value = typeIndex

  // Update status index
  const statusIndexValue = statusOptions.findIndex(option => option.value === formData.status)
  if (statusIndexValue !== -1) statusIndex.value = statusIndexValue

  // Update source index
  const sourceIndexValue = sourceOptions.findIndex(option => option.value === formData.source)
  if (sourceIndexValue !== -1) sourceIndex.value = sourceIndexValue

  // Update gender index
  const genderIndexValue = genderOptions.findIndex(option => option.value === formData.gender)
  if (genderIndexValue !== -1) genderIndex.value = genderIndexValue

  // Update contact method index
  const contactIndexValue = contactMethodOptions.findIndex(
    option => option.value === formData.preferred_contact_method
  )
  if (contactIndexValue !== -1) contactMethodIndex.value = contactIndexValue
}

// Handle picker changes
function handleCustomerTypeChange(e: any) {
  customerTypeIndex.value = e.detail.value
  formData.customer_type = customerTypeOptions[e.detail.value].value as any

  // Clear business/individual specific fields when switching
  if (formData.customer_type === 'individual') {
    formData.company = ''
    formData.business_license = ''
    formData.tax_id = ''
    formData.legal_representative = ''
  } else {
    formData.birthday = ''
    formData.gender = undefined
    formData.occupation = ''
  }

  clearFieldError('customer_type')
}

function handleStatusChange(e: any) {
  statusIndex.value = e.detail.value
  formData.status = statusOptions[e.detail.value].value as any
}

function handleSourceChange(e: any) {
  sourceIndex.value = e.detail.value
  formData.source = sourceOptions[e.detail.value].value as any
}

function handleGenderChange(e: any) {
  genderIndex.value = e.detail.value
  formData.gender = genderOptions[e.detail.value].value as any
}

function handleContactMethodChange(e: any) {
  contactMethodIndex.value = e.detail.value
  formData.preferred_contact_method = contactMethodOptions[e.detail.value].value as any
}

function handleBirthdayChange(e: any) {
  formData.birthday = e.detail.value
}

// Validation
function validateForm(): boolean {
  clearErrors()
  let isValid = true

  // Required fields validation
  if (!formData.name?.trim()) {
    errors.name = '请输入客户姓名'
    isValid = false
  }

  if (!formData.phone?.trim()) {
    errors.phone = '请输入联系电话'
    isValid = false
  } else if (!/^1[3-9]\d{9}$/.test(formData.phone)) {
    errors.phone = '请输入正确的手机号码'
    isValid = false
  }

  if (!formData.customer_type) {
    errors.customer_type = '请选择客户类型'
    isValid = false
  }

  // Business specific validation
  if (formData.customer_type === 'business' && !formData.company?.trim()) {
    errors.company = '企业客户请输入公司名称'
    isValid = false
  }

  // Email validation
  if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    errors.email = '请输入正确的邮箱地址'
    isValid = false
  }

  return isValid
}

function clearErrors() {
  Object.keys(errors).forEach(key => {
    delete errors[key]
  })
}

function clearFieldError(field: string) {
  if (errors[field]) {
    delete errors[field]
  }
}

// Actions
async function handleSave() {
  if (!validateForm()) {
    console.log('请完善必填信息')
    alert('请完善必填信息')
    return
  }

  confirmModalTitle.value = isEditMode.value ? '确认更新' : '确认保存'
  confirmModalContent.value = isEditMode.value ? '确定要更新客户信息吗？' : '确定要保存新客户吗？'

  confirmAction.value = isEditMode.value ? performUpdate : performCreate
  showConfirmModal.value = true
}

async function performCreate() {
  saving.value = true
  try {
    await customersStore.createCustomer(formData as CreateCustomerData)
    console.log('客户创建成功')
    alert('客户创建成功')

    setTimeout(() => {
      router.back()
    }, 1500)
  } catch (error) {
    console.error('创建失败:', error)
    alert('创建失败，请重试')
  } finally {
    saving.value = false
  }
}

async function performUpdate() {
  if (!customerId.value) return

  saving.value = true
  try {
    await customersStore.updateCustomer(customerId.value, formData as UpdateCustomerData)
    console.log('客户信息更新成功')
    alert('客户信息更新成功')

    setTimeout(() => {
      router.back()
    }, 1500)
  } catch (error) {
    console.error('更新失败:', error)
    alert('更新失败，请重试')
  } finally {
    saving.value = false
  }
}

function handleCancel() {
  // Check if form has changes
  const hasChanges = checkFormChanges()

  if (hasChanges) {
    confirmModalTitle.value = '确认离开'
    confirmModalContent.value = '您有未保存的更改，确定要离开吗？'
    confirmAction.value = () => {
      router.back()
    }
    showConfirmModal.value = true
  } else {
    router.back()
  }
}

function checkFormChanges(): boolean {
  if (!isEditMode.value) {
    // For create mode, check if any field has content
    return Object.values(formData).some(value =>
      typeof value === 'string' ? value.trim() : value !== undefined
    )
  }

  if (!originalCustomer.value) return false

  // For edit mode, compare with original data
  return Object.keys(formData).some(key => {
    const currentValue = (formData as any)[key]
    const originalValue = (originalCustomer.value as any)[key]
    return currentValue !== originalValue
  })
}

function cancelAction() {
  showConfirmModal.value = false
}
</script>

<style lang="scss">
@import '@/styles/variables.scss';

.customer-edit-page {
  min-height: 100vh;
  background-color: $bg-color;
  padding: 20px;

  .page-header {
    background: white;
    padding: 20px 24px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    margin-bottom: 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;

    .page-title {
      font-size: 20px;
      font-weight: 600;
      color: $text-color;
    }

    .header-actions {
      display: flex;
      gap: 12px;

      .action-btn {
        padding: 10px 20px;
        border: none;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.3s ease;

        &.cancel-btn {
          background: white;
          color: $text-color-secondary;
          border: 1px solid $border-color;

          &:hover {
            background: #f5f5f5;
          }
        }

        &.save-btn {
          background: $primary-color;
          color: white;

          &:hover {
            background: darken($primary-color, 10%);
          }

          &[loading='true'] {
            opacity: 0.7;
            pointer-events: none;
          }
        }
      }
    }
  }

  .loading-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 400px;

    .loading-text {
      font-size: 16px;
      color: $text-color-secondary;
    }
  }

  .form-container {
    max-width: 800px;
    margin: 0 auto;

    .form-section {
      background: white;
      padding: 24px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      margin-bottom: 20px;

      .section-title {
        font-size: 18px;
        font-weight: 600;
        color: $text-color;
        margin-bottom: 20px;
        display: block;
        padding-bottom: 10px;
        border-bottom: 2px solid $primary-color;
      }

      .form-row {
        display: flex;
        gap: 20px;
        margin-bottom: 20px;

        .form-item {
          flex: 1;
        }

        &:last-child {
          margin-bottom: 0;
        }
      }

      .form-item {
        margin-bottom: 20px;

        &:last-child {
          margin-bottom: 0;
        }

        .form-label {
          display: block;
          margin-bottom: 8px;
          font-size: 14px;
          color: $text-color;
          font-weight: 500;
        }

        .form-input {
          width: 100%;
          padding: 12px 16px;
          border: 1px solid $border-color;
          border-radius: 6px;
          font-size: 14px;
          transition: all 0.3s ease;

          &:focus {
            border-color: $primary-color;
            outline: none;
            box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
          }

          &.error {
            border-color: $danger-color;
          }
        }

        .form-textarea {
          width: 100%;
          min-height: 100px;
          padding: 12px 16px;
          border: 1px solid $border-color;
          border-radius: 6px;
          font-size: 14px;
          resize: vertical;
          line-height: 1.5;
          transition: all 0.3s ease;

          &:focus {
            border-color: $primary-color;
            outline: none;
            box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
          }
        }

        .form-picker {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          border: 1px solid $border-color;
          border-radius: 6px;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.3s ease;

          &:hover {
            border-color: $primary-color;
          }

          &.error {
            border-color: $danger-color;
          }

          .picker-arrow {
            font-size: 12px;
            color: $text-color-secondary;
            margin-left: 8px;
          }
        }

        .form-select {
          width: 100%;
          padding: 12px 16px;
          border: 1px solid $border-color;
          border-radius: 6px;
          font-size: 14px;
          background: white;
          cursor: pointer;
          transition: all 0.3s ease;

          &:focus {
            border-color: $primary-color;
            outline: none;
            box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
          }

          &.error {
            border-color: $danger-color;
          }
        }

        .error-text {
          display: block;
          margin-top: 4px;
          font-size: 12px;
          color: $danger-color;
        }

        .char-count {
          display: block;
          margin-top: 4px;
          font-size: 12px;
          color: $text-color-secondary;
          text-align: right;
        }
      }

      .business-fields,
      .individual-fields {
        margin-top: 16px;
        padding-top: 16px;
        border-top: 1px solid #f0f0f0;
      }
    }
  }

  // Modal styles
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }

  .modal-content {
    background: white;
    border-radius: 8px;
    padding: 0;
    max-width: 500px;
    width: 90%;
    max-height: 90vh;
    overflow-y: auto;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px;
    border-bottom: 1px solid $border-color;

    h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: $text-color;
    }

    .modal-close {
      background: none;
      border: none;
      font-size: 24px;
      color: $text-color-secondary;
      cursor: pointer;
      padding: 0;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;

      &:hover {
        color: $text-color;
      }
    }
  }

  .modal-body {
    padding: 20px 24px;
    font-size: 14px;
    line-height: 1.6;
    color: $text-color;
  }

  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding: 20px 24px;
    border-top: 1px solid $border-color;

    .modal-btn {
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.3s ease;

      &.modal-cancel {
        background: white;
        color: $text-color-secondary;
        border: 1px solid $border-color;

        &:hover {
          background: #f5f5f5;
        }
      }

      &.modal-confirm {
        background: $primary-color;
        color: white;
        border: 1px solid $primary-color;

        &:hover {
          background: darken($primary-color, 10%);
        }
      }
    }
  }
}

// Responsive design
@media (max-width: 768px) {
  .customer-edit-page {
    padding: 16px;

    .page-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 16px;

      .header-actions {
        width: 100%;

        .action-btn {
          flex: 1;
          justify-content: center;
        }
      }
    }

    .form-container {
      .form-section {
        padding: 16px;

        .form-row {
          flex-direction: column;
          gap: 0;
        }
      }
    }
  }
}

@media (max-width: 480px) {
  .customer-edit-page {
    padding: 12px;

    .form-container {
      .form-section {
        padding: 12px;

        .section-title {
          font-size: 16px;
        }
      }
    }
  }
}
</style>
