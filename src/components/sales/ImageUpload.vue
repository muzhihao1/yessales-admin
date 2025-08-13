<template>
  <div class="sales-image-upload">
    <div v-if="label" class="sales-form-label" :class="{ required: required }">
      {{ label }}
    </div>

    <div class="sales-image-list">
      <!-- 已上传的图片 -->
      <div v-for="(item, index) in imageList" :key="index" class="sales-image-item">
        <img
          :src="item.url"
          class="sales-image-preview"
          @click="previewImage(index)"
        />
        <div v-if="!disabled" class="sales-image-delete" @click.stop="deleteImage(index)">
          <span class="sales-image-delete-icon">×</span>
        </div>
      </div>

      <!-- 上传按钮 -->
      <div
        v-if="imageList.length < maxCount && !disabled"
        class="sales-image-item sales-image-add"
        @click="chooseImage"
      >
        <span class="sales-image-add-icon">+</span>
        <span class="sales-image-add-text">{{ uploadText }}</span>
      </div>
    </div>

    <!-- 隐藏的文件输入 -->
    <input
      ref="fileInput"
      type="file"
      multiple
      accept="image/*"
      style="display: none"
      @change="handleFileSelect"
    />

    <div v-if="error" class="sales-form-error">{{ error }}</div>
    <div v-if="help && !error" class="sales-form-help">{{ help }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ApiClient } from '@/api'

interface ImageItem {
  url: string
  path?: string
  size?: number
  name?: string
}

interface Props {
  modelValue: ImageItem[]
  label?: string
  required?: boolean
  maxCount?: number
  maxSize?: number // 单位：MB
  disabled?: boolean
  error?: string
  help?: string
  uploadText?: string
  sourceType?: ('album' | 'camera')[]
  sizeType?: ('original' | 'compressed')[]
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => [],
  maxCount: 9,
  maxSize: 10, // 10MB
  disabled: false,
  uploadText: '上传图片',
  sourceType: () => ['album', 'camera'],
  sizeType: () => ['compressed']
})

const emit = defineEmits<{
  'update:modelValue': [value: ImageItem[]]
  change: [value: ImageItem[]]
  'upload-start': []
  'upload-success': [file: ImageItem]
  'upload-fail': [error: Error]
}>()

const imageList = ref<ImageItem[]>([])
const fileInput = ref<HTMLInputElement | null>(null)

// 监听外部传入的值
watch(
  () => props.modelValue,
  newVal => {
    imageList.value = newVal || []
  },
  { immediate: true, deep: true }
)

// 选择图片
const chooseImage = () => {
  if (fileInput.value) {
    // 设置文件数量限制
    const remainCount = props.maxCount - imageList.value.length
    if (remainCount <= 0) {
      alert('已达到最大上传数量')
      return
    }
    
    fileInput.value.click()
  }
}

// 处理文件选择
const handleFileSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const files = target.files
  
  if (!files || files.length === 0) {
    console.warn('选择图片失败')
    alert('选择图片失败')
    return
  }

  // 检查文件数量限制
  const remainCount = props.maxCount - imageList.value.length
  const selectedFiles = Array.from(files).slice(0, remainCount)

  // 检查文件大小和类型
  const maxSizeBytes = props.maxSize * 1024 * 1024
  const validFiles = selectedFiles.filter(file => {
    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件')
      return false
    }
    
    if (file.size > maxSizeBytes) {
      console.warn(`图片大小不能超过${props.maxSize}MB`)
      alert(`图片大小不能超过${props.maxSize}MB`)
      return false
    }
    return true
  })

  if (validFiles.length === 0) {
    target.value = '' // 清空input
    return
  }

  // 显示加载提示
  console.log('上传中...')
  emit('upload-start')

  try {
    // 上传图片
    const uploadPromises = validFiles.map(file => uploadFile(file))
    const results = await Promise.all(uploadPromises)

    // 更新图片列表
    const newImages = results.filter(item => item !== null) as ImageItem[]
    const updatedList = [...imageList.value, ...newImages]
    imageList.value = updatedList

    emit('update:modelValue', updatedList)
    emit('change', updatedList)

    console.log('上传完成')

    if (newImages.length > 0) {
      console.log('上传成功')
      alert('上传成功')
    }
  } catch (error) {
    console.error('上传失败:', error)
    alert('上传失败')
    emit('upload-fail', error as Error)
  } finally {
    target.value = '' // 清空input以允许重复选择同一文件
  }
}

// 上传单个文件
const uploadFile = async (file: File): Promise<ImageItem | null> => {
  try {
    // 创建本地URL用于预览
    const url = URL.createObjectURL(file)
    
    // 在实际项目中，这里应该调用真实的上传 API
    // 目前使用 Mock 数据，直接返回本地URL
    const mockUploadedFile: ImageItem = {
      url,
      path: url,
      size: file.size,
      name: file.name || `image_${Date.now()}.jpg`
    }

    emit('upload-success', mockUploadedFile)
    return mockUploadedFile

    // 实际上传代码示例：
    // const response = await ApiClient.uploadFile(
    //   file,
    //   'products',
    //   `products/${Date.now()}_${file.name}`
    // );
    //
    // if (response.success && response.data) {
    //   const uploadedFile: ImageItem = {
    //     url: response.data.url,
    //     path: url,
    //     size: file.size,
    //     name: file.name,
    //   };
    //   emit('upload-success', uploadedFile);
    //   return uploadedFile;
    // }
    // return null;
  } catch (error) {
    console.error('Upload error:', error)
    return null
  }
}

// 预览图片
const previewImage = (index: number) => {
  const urls = imageList.value.map(item => item.url)
  const currentUrl = urls[index]
  
  // 在新窗口中打开图片预览
  // 简单的实现方式 - 在生产环境中可以使用更高级的图片预览组件
  const previewWindow = window.open(currentUrl, '_blank', 'width=800,height=600,scrollbars=yes')
  if (!previewWindow) {
    alert('弹窗被阻止，请允许弹窗后重试')
  }
}

// 删除图片
const deleteImage = (index: number) => {
  const confirmed = confirm('确定要删除这张图片吗？')
  if (confirmed) {
    // 如果是本地URL，需要释放内存
    const imageItem = imageList.value[index]
    if (imageItem.url && imageItem.url.startsWith('blob:')) {
      URL.revokeObjectURL(imageItem.url)
    }
    
    imageList.value.splice(index, 1)
    emit('update:modelValue', imageList.value)
    emit('change', imageList.value)
  }
}
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.sales-image-upload {
  margin-bottom: $spacing-md;
}

.sales-form-label {
  display: block;
  margin-bottom: $spacing-xs;
  font-size: $font-size-base;
  font-weight: 500;
  color: $text-color-secondary;

  &.required::before {
    content: '*';
    color: $danger-color;
    margin-right: 4px;
  }
}

.sales-image-list {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-sm;
}

.sales-image-item {
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: $border-radius-base;
  overflow: hidden;
  background-color: $bg-color;
}

.sales-image-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.sales-image-delete {
  position: absolute;
  top: 0;
  right: 0;
  width: 24px;
  height: 24px;
  background-color: rgba(0, 0, 0, 0.6);
  @include flex-center;
  border-bottom-left-radius: $border-radius-base;
}

.sales-image-delete-icon {
  color: #fff;
  font-size: 18px;
  line-height: 1;
}

.sales-image-add {
  @include flex-center;
  flex-direction: column;
  border: 1px dashed $border-color;
  background-color: $bg-color;
  cursor: pointer;
  transition: $transition-base;

  &:active {
    opacity: 0.8;
  }
}

.sales-image-add-icon {
  font-size: 28px;
  color: $text-color-placeholder;
  margin-bottom: 4px;
}

.sales-image-add-text {
  font-size: $font-size-small;
  color: $text-color-placeholder;
}

.sales-form-error {
  margin-top: $spacing-xs;
  font-size: $font-size-small;
  color: $danger-color;
}

.sales-form-help {
  margin-top: $spacing-xs;
  font-size: $font-size-small;
  color: $text-color-regular;
}
</style>
