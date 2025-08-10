<template>
  <div class="product-edit-page">
    <AdminLayout>
      <!-- 页面标题 -->
      <div class="page-header">
        <h2 class="page-title">{{ isEditMode ? '编辑产品' : '添加产品' }}</h2>
        <button class="back-btn" @click="handleBack">
          <span>← 返回列表</span>
        </button>
      </div>

      <!-- 表单 -->
      <div class="edit-form admin-card">
        <form @submit.prevent="handleSubmit">
          <!-- 基本信息 -->
          <div class="form-section">
            <h3 class="section-title">基本信息</h3>

            <div class="admin-form-item">
              <label class="admin-form-label required">产品名称</label>
              <input
                v-model="formData.name"
                class="admin-form-control"
                type="text"
                placeholder="请输入产品名称"
                maxlength="100"
              />
              <span v-if="errors.name" class="form-error">{{ errors.name }}</span>
            </div>

            <div class="admin-form-item">
              <label class="admin-form-label required">产品型号</label>
              <input
                v-model="formData.model"
                class="admin-form-control"
                type="text"
                placeholder="请输入产品型号"
                maxlength="50"
              />
              <span v-if="errors.model" class="form-error">{{ errors.model }}</span>
            </div>

            <div class="admin-form-item">
              <label class="admin-form-label required">产品分类</label>
              <div class="form-picker" @click="showCategorySelect = !showCategorySelect">
                <span :class="['picker-text', { placeholder: !formData.category }]">
                  {{ formData.category || '请选择产品分类' }}
                </span>
                <span class="picker-arrow">▼</span>
              </div>
              <div v-if="showCategorySelect" class="picker-options">
                <div 
                  v-for="(option, index) in categoryOptions" 
                  :key="index"
                  class="picker-option"
                  @click.stop="selectCategory(option, index)"
                >
                  {{ option }}
                </div>
              </div>
              <span v-if="errors.category" class="form-error">{{ errors.category }}</span>
            </div>

            <div class="form-row">
              <div class="admin-form-item">
                <label class="admin-form-label required">价格</label>
                <input
                  v-model.number="formData.price"
                  class="admin-form-control"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                />
                <span v-if="errors.price" class="form-error">{{ errors.price }}</span>
              </div>

              <div class="admin-form-item">
                <label class="admin-form-label required">单位</label>
                <div class="form-picker" @click="showUnitSelect = !showUnitSelect">
                  <span>{{ formData.unit }}</span>
                  <span class="picker-arrow">▼</span>
                </div>
                <div v-if="showUnitSelect" class="picker-options">
                  <div 
                    v-for="(option, index) in unitOptions" 
                    :key="index"
                    class="picker-option"
                    @click.stop="selectUnit(option, index)"
                  >
                    {{ option }}
                  </div>
                </div>
                <span v-if="errors.unit" class="form-error">{{ errors.unit }}</span>
              </div>
            </div>

            <div class="admin-form-item">
              <label class="admin-form-label">产品描述</label>
              <textarea
                v-model="formData.description"
                class="admin-form-control form-textarea"
                placeholder="请输入产品描述"
                maxlength="500"
              />
            </div>
          </div>

          <!-- 产品图片 -->
          <div class="form-section">
            <h3 class="section-title">产品图片</h3>

            <div class="image-upload">
              <div v-if="formData.image_url" class="image-preview">
                <img :src="formData.image_url" alt="产品图片" />
                <button type="button" class="remove-btn" @click="removeImage">
                  <span>×</span>
                </button>
              </div>

              <button v-else type="button" class="upload-btn" @click="chooseImage">
                <span class="upload-icon">+</span>
                <span class="upload-text">上传图片</span>
              </button>
              <input 
                ref="fileInput" 
                type="file" 
                accept="image/*" 
                @change="handleImageUpload" 
                style="display: none;" 
              />

              <p class="upload-tips">建议尺寸：800x800px，支持 JPG、PNG 格式</p>
            </div>
          </div>

          <!-- 状态设置 -->
          <div class="form-section">
            <h3 class="section-title">状态设置</h3>

            <div class="admin-form-item">
              <div class="switch-item">
                <label class="switch-label">是否上架</label>
                <input
                  type="checkbox"
                  v-model="formData.is_active"
                  class="form-switch"
                />
              </div>
              <p class="form-help">下架后产品将不在销售端显示</p>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="form-actions">
            <button
              class="admin-btn admin-btn-primary"
              type="submit"
              :disabled="isSubmitting"
            >
              {{ isSubmitting ? '保存中...' : '保存' }}
            </button>
            <button type="button" class="admin-btn admin-btn-default" @click="handleCancel">取消</button>
          </div>
        </form>
      </div>
    </AdminLayout>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProductsStore } from '@/stores/products'
import AdminLayout from '@/components/admin/AdminLayout.vue'
import type { Product } from '@/types/models'

const productsStore = useProductsStore()
const route = useRoute()
const router = useRouter()

// 页面参数
const productId = ref<string>((route.params.id as string) || (route.query.id as string) || '')
const isEditMode = computed(() => !!productId.value)

// 表单数据
const formData = ref<Partial<Product>>({
  name: '',
  model: '',
  category: '',
  price: 0,
  unit: '台',
  description: '',
  image_url: '',
  is_active: true
})

// 表单验证错误
const errors = ref<Record<string, string>>({})

// 提交状态
const isSubmitting = ref(false)

// UI 状态
const showCategorySelect = ref(false)
const showUnitSelect = ref(false)
const fileInput = ref<HTMLInputElement>()

// 选项数据
const categoryOptions = ['台球桌', '地毯', '球杆', '台球', '其他配件']
const categoryIndex = computed(() => {
  return categoryOptions.indexOf(formData.value.category || '')
})

const unitOptions = ['台', '个', '套', '块', '张', '米', '平方米']
const unitIndex = computed(() => {
  return unitOptions.indexOf(formData.value.unit || '台')
})

// 加载产品数据
const loadProduct = async () => {
  if (!productId.value) return

  const product = await productsStore.fetchProduct(productId.value)
  if (product) {
    formData.value = { ...product }
  } else {
    console.warn('产品不存在')
    alert('产品不存在')
    setTimeout(() => {
      router.back()
    }, 1500)
  }
}

// 表单验证
const validateForm = (): boolean => {
  errors.value = {}

  if (!formData.value.name?.trim()) {
    errors.value.name = '请输入产品名称'
  }

  if (!formData.value.model?.trim()) {
    errors.value.model = '请输入产品型号'
  }

  if (!formData.value.category) {
    errors.value.category = '请选择产品分类'
  }

  if (!formData.value.price || formData.value.price <= 0) {
    errors.value.price = '请输入正确的价格'
  }

  if (!formData.value.unit) {
    errors.value.unit = '请选择单位'
  }

  return Object.keys(errors.value).length === 0
}

// 选择器事件处理
const selectCategory = (option: string, index: number) => {
  formData.value.category = option
  showCategorySelect.value = false
}

const selectUnit = (option: string, index: number) => {
  formData.value.unit = option
  showUnitSelect.value = false
}

// 图片上传处理
const chooseImage = () => {
  if (fileInput.value) {
    fileInput.value.click()
  }
}

const handleImageUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  
  if (!file) return

  // 验证文件类型
  if (!file.type.startsWith('image/')) {
    alert('请选择图片文件')
    return
  }

  // 验证文件大小 (5MB)
  if (file.size > 5 * 1024 * 1024) {
    alert('图片大小不能超过5MB')
    return
  }

  try {
    console.log('开始上传图片...')
    
    // 创建预览URL
    const previewUrl = URL.createObjectURL(file)
    formData.value.image_url = previewUrl

    // TODO: 实现实际的图片上传到 Supabase Storage
    // const uploadResult = await uploadFile(file, 'products', `product-${Date.now()}`)
    // formData.value.image_url = uploadResult.url

    console.log('图片上传成功')
  } catch (error) {
    console.error('图片上传失败:', error)
    alert('图片上传失败，请重试')
  }
}

const uploadImage = async (filePath: string) => {
  // This function is kept for compatibility but not used
  console.log('Legacy uploadImage function called')
}

const removeImage = () => {
  formData.value.image_url = ''
}

const handleSubmit = async () => {
  if (!validateForm()) {
    return
  }

  isSubmitting.value = true

  try {
    let result
    if (isEditMode.value) {
      result = await productsStore.updateProduct(productId.value, formData.value)
    } else {
      result = await productsStore.createProduct(formData.value)
    }

    if (result.success) {
      const message = isEditMode.value ? '更新成功' : '添加成功'
      console.log(message)
      alert(message)

      setTimeout(() => {
        router.back()
      }, 1500)
    } else {
      const errorMessage = result.error || '操作失败'
      console.error(errorMessage)
      alert(errorMessage)
    }
  } catch (error) {
    console.error('操作失败:', error)
    alert('操作失败，请重试')
  } finally {
    isSubmitting.value = false
  }
}

const handleCancel = () => {
  const confirmed = confirm('确定要放弃当前编辑吗？')
  if (confirmed) {
    router.back()
  }
}

const handleBack = () => {
  router.back()
}

// 页面加载
onMounted(() => {
  if (productId.value) {
    loadProduct()
  }
  
  // 添加文档点击监听器以关闭下拉框
  document.addEventListener('click', handleDocumentClick)
})

// 清理事件监听器
onUnmounted(() => {
  document.removeEventListener('click', handleDocumentClick)
})

// 处理文档点击事件以关闭下拉框
const handleDocumentClick = (event: Event) => {
  const target = event.target as HTMLElement
  
  // 如果点击的不是下拉框或其内部元素，关闭所有下拉框
  if (!target.closest('.form-picker')) {
    showCategorySelect.value = false
    showUnitSelect.value = false
  }
}
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.product-edit-page {
  width: 100%;
  min-height: 100vh;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: $spacing-lg;

  .page-title {
    font-size: 24px;
    font-weight: $font-weight-semibold;
    color: $text-color;
  }

  .back-btn {
    padding: 8px 16px;
    background-color: white;
    border: 1px solid $border-color;
    border-radius: $border-radius-base;
    color: $text-color-secondary;
    font-size: $font-size-base;
    cursor: pointer;

    &:hover {
      border-color: $primary-color;
      color: $primary-color;
    }
  }
}

.edit-form {
  max-width: 800px;
}

.form-section {
  margin-bottom: $spacing-xl;

  .section-title {
    font-size: $font-size-large;
    font-weight: $font-weight-medium;
    color: $text-color;
    margin-bottom: $spacing-lg;
    display: block;
  }
}

.admin-form-item {
  margin-bottom: $spacing-lg;

  .admin-form-label {
    display: block;
    margin-bottom: $spacing-xs;
    font-size: $font-size-base;
    font-weight: $font-weight-medium;
    color: $text-color-secondary;

    &.required::before {
      content: '*';
      color: $danger-color;
      margin-right: 4px;
    }
  }

  .admin-form-control {
    width: 100%;
    height: 40px;
    padding: 0 $spacing-base;
    border: 1px solid $border-color;
    border-radius: $border-radius-base;
    font-size: $font-size-base;
    transition: $transition-base;

    &:focus {
      border-color: $primary-color;
      outline: none;
    }

    &.form-textarea {
      min-height: 100px;
      padding: $spacing-sm $spacing-base;
      resize: vertical;
      line-height: 1.5;
    }
  }

  .form-picker {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    height: 40px;
    padding: 0 $spacing-base;
    border: 1px solid $border-color;
    border-radius: $border-radius-base;
    background-color: white;
    cursor: pointer;
    transition: $transition-base;

    &:hover {
      border-color: $primary-color;
    }

    .picker-text {
      font-size: $font-size-base;
      color: $text-color;

      &.placeholder {
        color: $text-color-placeholder;
      }
    }

    .picker-arrow {
      font-size: 12px;
      color: $text-color-regular;
      transition: transform 0.2s;
    }
  }

  .picker-options {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    z-index: 10;
    background: white;
    border: 1px solid $border-color;
    border-top: none;
    border-radius: 0 0 $border-radius-base $border-radius-base;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    max-height: 200px;
    overflow-y: auto;

    .picker-option {
      padding: 10px $spacing-base;
      font-size: $font-size-base;
      color: $text-color;
      cursor: pointer;
      transition: background-color 0.2s;

      &:hover {
        background-color: $bg-color;
      }

      &:active {
        background-color: lighten($primary-color, 40%);
      }
    }
  }

  .form-error {
    display: block;
    margin-top: 4px;
    font-size: $font-size-small;
    color: $danger-color;
  }

  .form-help {
    display: block;
    margin-top: 4px;
    font-size: $font-size-small;
    color: $text-color-regular;
  }
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $spacing-base;
}

.switch-item {
  display: flex;
  align-items: center;
  justify-content: space-between;

  .switch-label {
    font-size: $font-size-base;
    color: $text-color;
  }

  .form-switch {
    position: relative;
    width: 48px;
    height: 24px;
    -webkit-appearance: none;
    background-color: #ccc;
    border-radius: 12px;
    outline: none;
    cursor: pointer;
    transition: background-color 0.3s;

    &:checked {
      background-color: $primary-color;
    }

    &:before {
      content: '';
      position: absolute;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      top: 2px;
      left: 2px;
      background-color: white;
      transition: transform 0.3s;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }

    &:checked:before {
      transform: translateX(24px);
    }
  }
}

.image-upload {
  .image-preview {
    position: relative;
    width: 200px;
    height: 200px;
    border-radius: $border-radius-base;
    overflow: hidden;
    margin-bottom: $spacing-sm;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .remove-btn {
      position: absolute;
      top: 8px;
      right: 8px;
      width: 32px;
      height: 32px;
      background-color: rgba(0, 0, 0, 0.6);
      color: white;
      border: none;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      cursor: pointer;

      &:hover {
        background-color: rgba(0, 0, 0, 0.8);
      }
    }
  }

  .upload-btn {
    width: 200px;
    height: 200px;
    border: 2px dashed $border-color;
    border-radius: $border-radius-base;
    background-color: $bg-color;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: $transition-base;
    margin-bottom: $spacing-sm;

    &:hover {
      border-color: $primary-color;
      background-color: lighten($bg-color, 2%);
    }

    .upload-icon {
      font-size: 48px;
      color: $text-color-placeholder;
      margin-bottom: $spacing-xs;
    }

    .upload-text {
      font-size: $font-size-base;
      color: $text-color-secondary;
    }
  }

  .upload-tips {
    font-size: $font-size-small;
    color: $text-color-regular;
  }
}

.form-actions {
  display: flex;
  gap: $spacing-base;
  margin-top: $spacing-xl;
  padding-top: $spacing-lg;
  border-top: 1px solid $border-color-lighter;

  .admin-btn {
    min-width: 100px;
  }
}

/* 响应式设计 */
@include respond-to('phone') {
  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
