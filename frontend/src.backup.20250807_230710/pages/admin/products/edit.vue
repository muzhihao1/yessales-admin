<template>
  <view class="product-edit-page">
    <AdminLayout>
      <!-- 页面标题 -->
      <view class="page-header">
        <text class="page-title">{{ isEditMode ? '编辑产品' : '添加产品' }}</text>
        <button class="back-btn" @click="handleBack">
          <text>← 返回列表</text>
        </button>
      </view>

      <!-- 表单 -->
      <view class="edit-form admin-card">
        <form @submit.prevent="handleSubmit">
          <!-- 基本信息 -->
          <view class="form-section">
            <text class="section-title">基本信息</text>

            <view class="admin-form-item">
              <text class="admin-form-label required">产品名称</text>
              <input
                v-model="formData.name"
                class="admin-form-control"
                type="text"
                placeholder="请输入产品名称"
                maxlength="100"
              />
              <text v-if="errors.name" class="form-error">{{ errors.name }}</text>
            </view>

            <view class="admin-form-item">
              <text class="admin-form-label required">产品型号</text>
              <input
                v-model="formData.model"
                class="admin-form-control"
                type="text"
                placeholder="请输入产品型号"
                maxlength="50"
              />
              <text v-if="errors.model" class="form-error">{{ errors.model }}</text>
            </view>

            <view class="admin-form-item">
              <text class="admin-form-label required">产品分类</text>
              <picker
                mode="selector"
                :range="categoryOptions"
                :value="categoryIndex"
                @change="handleCategoryChange"
              >
                <view class="form-picker">
                  <text :class="['picker-text', { placeholder: !formData.category }]">
                    {{ formData.category || '请选择产品分类' }}
                  </text>
                  <text class="picker-arrow">▼</text>
                </view>
              </picker>
              <text v-if="errors.category" class="form-error">{{ errors.category }}</text>
            </view>

            <view class="form-row">
              <view class="admin-form-item">
                <text class="admin-form-label required">价格</text>
                <input
                  v-model.number="formData.price"
                  class="admin-form-control"
                  type="digit"
                  placeholder="0.00"
                />
                <text v-if="errors.price" class="form-error">{{ errors.price }}</text>
              </view>

              <view class="admin-form-item">
                <text class="admin-form-label required">单位</text>
                <picker
                  mode="selector"
                  :range="unitOptions"
                  :value="unitIndex"
                  @change="handleUnitChange"
                >
                  <view class="form-picker">
                    <text>{{ formData.unit }}</text>
                    <text class="picker-arrow">▼</text>
                  </view>
                </picker>
                <text v-if="errors.unit" class="form-error">{{ errors.unit }}</text>
              </view>
            </view>

            <view class="admin-form-item">
              <text class="admin-form-label">产品描述</text>
              <textarea
                v-model="formData.description"
                class="admin-form-control form-textarea"
                placeholder="请输入产品描述"
                maxlength="500"
              />
            </view>
          </view>

          <!-- 产品图片 -->
          <view class="form-section">
            <text class="section-title">产品图片</text>

            <view class="image-upload">
              <view v-if="formData.image_url" class="image-preview">
                <image :src="formData.image_url" mode="aspectFill" />
                <button class="remove-btn" @click="removeImage">
                  <text>×</text>
                </button>
              </view>

              <button v-else class="upload-btn" @click="chooseImage">
                <text class="upload-icon">+</text>
                <text class="upload-text">上传图片</text>
              </button>

              <text class="upload-tips">建议尺寸：800x800px，支持 JPG、PNG 格式</text>
            </view>
          </view>

          <!-- 状态设置 -->
          <view class="form-section">
            <text class="section-title">状态设置</text>

            <view class="admin-form-item">
              <view class="switch-item">
                <text class="switch-label">是否上架</text>
                <switch
                  :checked="formData.is_active"
                  @change="handleStatusChange"
                  color="#2563eb"
                />
              </view>
              <text class="form-help">下架后产品将不在销售端显示</text>
            </view>
          </view>

          <!-- 操作按钮 -->
          <view class="form-actions">
            <button
              class="admin-btn admin-btn-primary"
              type="submit"
              :loading="isSubmitting"
              :disabled="isSubmitting"
            >
              {{ isSubmitting ? '保存中...' : '保存' }}
            </button>
            <button class="admin-btn admin-btn-default" @click="handleCancel">取消</button>
          </view>
        </form>
      </view>
    </AdminLayout>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useProductsStore } from '@/stores/products'
import AdminLayout from '@/components/admin/AdminLayout.vue'
import type { Product } from '@/types/models'

const productsStore = useProductsStore()

// 页面参数
const productId = ref<string>('')
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
    uni.showToast({
      title: '产品不存在',
      icon: 'none'
    })
    setTimeout(() => {
      uni.navigateBack()
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

// 事件处理
const handleCategoryChange = (e: any) => {
  formData.value.category = categoryOptions[e.detail.value]
}

const handleUnitChange = (e: any) => {
  formData.value.unit = unitOptions[e.detail.value]
}

const handleStatusChange = (e: any) => {
  formData.value.is_active = e.detail.value
}

const chooseImage = () => {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: res => {
      const tempFilePath = res.tempFilePaths[0]
      uploadImage(tempFilePath)
    }
  })
}

const uploadImage = async (filePath: string) => {
  uni.showLoading({ title: '上传中...' })

  try {
    // TODO: 实现图片上传到 Supabase Storage
    // 这里暂时使用本地路径
    formData.value.image_url = filePath

    uni.hideLoading()
    uni.showToast({
      title: '上传成功',
      icon: 'success'
    })
  } catch (error) {
    uni.hideLoading()
    uni.showToast({
      title: '上传失败',
      icon: 'none'
    })
  }
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
      uni.showToast({
        title: isEditMode.value ? '更新成功' : '添加成功',
        icon: 'success'
      })

      setTimeout(() => {
        uni.navigateBack()
      }, 1500)
    } else {
      uni.showToast({
        title: result.error || '操作失败',
        icon: 'none'
      })
    }
  } catch (error) {
    uni.showToast({
      title: '操作失败',
      icon: 'none'
    })
  } finally {
    isSubmitting.value = false
  }
}

const handleCancel = () => {
  uni.showModal({
    title: '提示',
    content: '确定要放弃当前编辑吗？',
    success: res => {
      if (res.confirm) {
        uni.navigateBack()
      }
    }
  })
}

const handleBack = () => {
  uni.navigateBack()
}

// 页面加载
onLoad(options => {
  if (options?.id) {
    productId.value = options.id
    loadProduct()
  }
})
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
}

.image-upload {
  .image-preview {
    position: relative;
    width: 200px;
    height: 200px;
    border-radius: $border-radius-base;
    overflow: hidden;
    margin-bottom: $spacing-sm;

    image {
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
