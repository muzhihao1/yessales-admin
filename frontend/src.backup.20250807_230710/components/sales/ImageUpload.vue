<template>
  <view class="sales-image-upload">
    <view v-if="label" class="sales-form-label" :class="{ required: required }">
      {{ label }}
    </view>
    
    <view class="sales-image-list">
      <!-- 已上传的图片 -->
      <view
        v-for="(item, index) in imageList"
        :key="index"
        class="sales-image-item"
      >
        <image
          :src="item.url"
          mode="aspectFill"
          class="sales-image-preview"
          @click="previewImage(index)"
        />
        <view
          v-if="!disabled"
          class="sales-image-delete"
          @click.stop="deleteImage(index)"
        >
          <text class="sales-image-delete-icon">×</text>
        </view>
      </view>
      
      <!-- 上传按钮 -->
      <view
        v-if="imageList.length < maxCount && !disabled"
        class="sales-image-item sales-image-add"
        @click="chooseImage"
      >
        <text class="sales-image-add-icon">+</text>
        <text class="sales-image-add-text">{{ uploadText }}</text>
      </view>
    </view>
    
    <view v-if="error" class="sales-form-error">{{ error }}</view>
    <view v-if="help && !error" class="sales-form-help">{{ help }}</view>
  </view>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { ApiClient } from '@/api';

interface ImageItem {
  url: string;
  path?: string;
  size?: number;
  name?: string;
}

interface Props {
  modelValue: ImageItem[];
  label?: string;
  required?: boolean;
  maxCount?: number;
  maxSize?: number; // 单位：MB
  disabled?: boolean;
  error?: string;
  help?: string;
  uploadText?: string;
  sourceType?: ('album' | 'camera')[];
  sizeType?: ('original' | 'compressed')[];
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => [],
  maxCount: 9,
  maxSize: 10, // 10MB
  disabled: false,
  uploadText: '上传图片',
  sourceType: () => ['album', 'camera'],
  sizeType: () => ['compressed'],
});

const emit = defineEmits<{
  'update:modelValue': [value: ImageItem[]];
  'change': [value: ImageItem[]];
  'upload-start': [];
  'upload-success': [file: ImageItem];
  'upload-fail': [error: Error];
}>();

const imageList = ref<ImageItem[]>([]);

// 监听外部传入的值
watch(
  () => props.modelValue,
  (newVal) => {
    imageList.value = newVal || [];
  },
  { immediate: true, deep: true }
);

// 选择图片
const chooseImage = () => {
  const remainCount = props.maxCount - imageList.value.length;
  
  uni.chooseImage({
    count: remainCount,
    sizeType: props.sizeType,
    sourceType: props.sourceType,
    success: async (res) => {
      // 检查文件大小
      const maxSizeBytes = props.maxSize * 1024 * 1024;
      const validFiles = res.tempFiles.filter((file) => {
        if (file.size && file.size > maxSizeBytes) {
          uni.showToast({
            title: `图片大小不能超过${props.maxSize}MB`,
            icon: 'none',
          });
          return false;
        }
        return true;
      });
      
      if (validFiles.length === 0) return;
      
      // 显示加载提示
      uni.showLoading({ title: '上传中...' });
      emit('upload-start');
      
      try {
        // 上传图片
        const uploadPromises = validFiles.map((file) => uploadFile(file));
        const results = await Promise.all(uploadPromises);
        
        // 更新图片列表
        const newImages = results.filter((item) => item !== null) as ImageItem[];
        const updatedList = [...imageList.value, ...newImages];
        imageList.value = updatedList;
        
        emit('update:modelValue', updatedList);
        emit('change', updatedList);
        
        uni.hideLoading();
        
        if (newImages.length > 0) {
          uni.showToast({
            title: '上传成功',
            icon: 'success',
          });
        }
      } catch (error) {
        uni.hideLoading();
        uni.showToast({
          title: '上传失败',
          icon: 'none',
        });
        emit('upload-fail', error as Error);
      }
    },
    fail: () => {
      uni.showToast({
        title: '选择图片失败',
        icon: 'none',
      });
    },
  });
};

// 上传单个文件
const uploadFile = async (file: any): Promise<ImageItem | null> => {
  try {
    // 在实际项目中，这里应该调用真实的上传 API
    // 目前使用 Mock 数据，直接返回本地路径
    const mockUploadedFile: ImageItem = {
      url: file.path,
      path: file.path,
      size: file.size,
      name: file.name || `image_${Date.now()}.jpg`,
    };
    
    emit('upload-success', mockUploadedFile);
    return mockUploadedFile;
    
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
    //     path: file.path,
    //     size: file.size,
    //     name: file.name,
    //   };
    //   emit('upload-success', uploadedFile);
    //   return uploadedFile;
    // }
    // return null;
  } catch (error) {
    console.error('Upload error:', error);
    return null;
  }
};

// 预览图片
const previewImage = (index: number) => {
  const urls = imageList.value.map((item) => item.url);
  uni.previewImage({
    current: index,
    urls,
  });
};

// 删除图片
const deleteImage = (index: number) => {
  uni.showModal({
    title: '提示',
    content: '确定要删除这张图片吗？',
    success: (res) => {
      if (res.confirm) {
        imageList.value.splice(index, 1);
        emit('update:modelValue', imageList.value);
        emit('change', imageList.value);
      }
    },
  });
};
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