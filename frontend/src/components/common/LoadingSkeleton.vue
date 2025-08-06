<template>
  <view class="loading-skeleton" :class="[`skeleton-${variant}`, customClass]">
    <!-- 卡片骨架 -->
    <view v-if="variant === 'card'" class="skeleton-card">
      <view v-if="showImage" class="skeleton-image"></view>
      <view class="skeleton-content">
        <view class="skeleton-title"></view>
        <view v-if="showSubtitle" class="skeleton-subtitle"></view>
        <view v-if="showText" class="skeleton-text">
          <view v-for="line in textLines" :key="line" class="skeleton-line" :style="getLineWidth(line)"></view>
        </view>
        <view v-if="showActions" class="skeleton-actions">
          <view v-for="action in actionCount" :key="action" class="skeleton-action"></view>
        </view>
      </view>
    </view>
    
    <!-- 列表骨架 -->
    <view v-else-if="variant === 'list'" class="skeleton-list">
      <view v-for="item in itemCount" :key="item" class="skeleton-list-item">
        <view v-if="showAvatar" class="skeleton-avatar" :class="`avatar-${avatarSize}`"></view>
        <view class="skeleton-list-content">
          <view class="skeleton-list-title"></view>
          <view v-if="showDescription" class="skeleton-list-description"></view>
          <view v-if="showMeta" class="skeleton-list-meta">
            <view class="skeleton-meta-item"></view>
            <view class="skeleton-meta-item short"></view>
          </view>
        </view>
        <view v-if="showActions" class="skeleton-list-action"></view>
      </view>
    </view>
    
    <!-- 产品卡片骨架 -->
    <view v-else-if="variant === 'product'" class="skeleton-product">
      <view v-for="product in itemCount" :key="product" class="skeleton-product-item">
        <view class="skeleton-product-image"></view>
        <view class="skeleton-product-info">
          <view class="skeleton-product-name"></view>
          <view class="skeleton-product-model"></view>
          <view class="skeleton-product-price"></view>
        </view>
      </view>
    </view>
    
    <!-- 表单骨架 -->
    <view v-else-if="variant === 'form'" class="skeleton-form">
      <view v-for="field in itemCount" :key="field" class="skeleton-form-field">
        <view class="skeleton-form-label"></view>
        <view class="skeleton-form-input" :class="getFormInputType(field)"></view>
      </view>
    </view>
    
    <!-- 统计卡片骨架 -->
    <view v-else-if="variant === 'stats'" class="skeleton-stats">
      <view v-for="stat in itemCount" :key="stat" class="skeleton-stat-item">
        <view class="skeleton-stat-icon"></view>
        <view class="skeleton-stat-content">
          <view class="skeleton-stat-number"></view>
          <view class="skeleton-stat-label"></view>
        </view>
      </view>
    </view>
    
    <!-- 通用骨架 -->
    <view v-else class="skeleton-generic">
      <view v-for="line in itemCount" :key="line" class="skeleton-line" :style="getLineWidth(line)"></view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  // 骨架类型
  variant?: 'card' | 'list' | 'product' | 'form' | 'stats' | 'generic'
  // 项目数量
  itemCount?: number
  // 文本行数
  textLines?: number
  // 动作按钮数量
  actionCount?: number
  // 显示选项
  showImage?: boolean
  showAvatar?: boolean
  showSubtitle?: boolean
  showText?: boolean
  showActions?: boolean
  showDescription?: boolean
  showMeta?: boolean
  // 头像大小
  avatarSize?: 'small' | 'medium' | 'large'
  // 自定义类名
  customClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'generic',
  itemCount: 3,
  textLines: 2,
  actionCount: 2,
  showImage: true,
  showAvatar: true,
  showSubtitle: true,
  showText: true,
  showActions: true,
  showDescription: true,
  showMeta: false,
  avatarSize: 'medium',
  customClass: ''
})

// 计算随机宽度模拟真实内容
function getLineWidth(lineIndex: number): { width: string } {
  const widths = ['85%', '75%', '90%', '65%', '80%']
  return { width: widths[lineIndex % widths.length] }
}

// 获取表单输入类型
function getFormInputType(fieldIndex: number): string {
  const types = ['input', 'textarea', 'select']
  return types[fieldIndex % types.length]
}
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/animations.scss';

.loading-skeleton {
  width: 100%;
  
  // 通用骨架样式
  .skeleton-line,
  .skeleton-title,
  .skeleton-subtitle,
  .skeleton-text,
  .skeleton-image,
  .skeleton-avatar,
  .skeleton-action,
  .skeleton-list-title,
  .skeleton-list-description,
  .skeleton-meta-item,
  .skeleton-product-image,
  .skeleton-product-name,
  .skeleton-product-model,
  .skeleton-product-price,
  .skeleton-form-label,
  .skeleton-form-input,
  .skeleton-stat-icon,
  .skeleton-stat-number,
  .skeleton-stat-label {
    background: $border-color-lighter;
    border-radius: $border-radius-sm;
    @extend .skeleton-loading;
  }
}

// ========== 卡片骨架 ==========
.skeleton-card {
  background: $bg-color-white;
  border-radius: $border-radius-lg;
  padding: $spacing-md;
  border: 1px solid $border-color;
  
  .skeleton-image {
    width: 100%;
    height: 120px;
    margin-bottom: $spacing-md;
    border-radius: $border-radius-base;
  }
  
  .skeleton-content {
    .skeleton-title {
      height: 20px;
      width: 70%;
      margin-bottom: $spacing-sm;
    }
    
    .skeleton-subtitle {
      height: 16px;
      width: 50%;
      margin-bottom: $spacing-md;
    }
    
    .skeleton-text {
      margin-bottom: $spacing-md;
      
      .skeleton-line {
        height: 14px;
        margin-bottom: $spacing-xs;
      }
    }
    
    .skeleton-actions {
      display: flex;
      gap: $spacing-sm;
      
      .skeleton-action {
        height: 32px;
        width: 80px;
        border-radius: $border-radius-base;
      }
    }
  }
}

// ========== 列表骨架 ==========
.skeleton-list {
  .skeleton-list-item {
    display: flex;
    align-items: center;
    padding: $spacing-md;
    background: $bg-color-white;
    border-radius: $border-radius-base;
    border: 1px solid $border-color;
    margin-bottom: $spacing-sm;
    
    &:last-child {
      margin-bottom: 0;
    }
    
    .skeleton-avatar {
      border-radius: $border-radius-circle;
      margin-right: $spacing-md;
      flex-shrink: 0;
      
      &.avatar-small {
        width: 32px;
        height: 32px;
      }
      
      &.avatar-medium {
        width: 48px;
        height: 48px;
      }
      
      &.avatar-large {
        width: 64px;
        height: 64px;
      }
    }
    
    .skeleton-list-content {
      flex: 1;
      
      .skeleton-list-title {
        height: 18px;
        width: 60%;
        margin-bottom: $spacing-xs;
      }
      
      .skeleton-list-description {
        height: 14px;
        width: 80%;
        margin-bottom: $spacing-xs;
      }
      
      .skeleton-list-meta {
        display: flex;
        gap: $spacing-md;
        
        .skeleton-meta-item {
          height: 12px;
          
          &:not(.short) {
            width: 60px;
          }
          
          &.short {
            width: 40px;
          }
        }
      }
    }
    
    .skeleton-list-action {
      width: 24px;
      height: 24px;
      border-radius: $border-radius-sm;
      flex-shrink: 0;
    }
  }
}

// ========== 产品卡片骨架 ==========
.skeleton-product {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: $spacing-md;
  
  .skeleton-product-item {
    background: $bg-color-white;
    border-radius: $border-radius-base;
    overflow: hidden;
    border: 1px solid $border-color;
    
    .skeleton-product-image {
      width: 100%;
      height: 120px;
    }
    
    .skeleton-product-info {
      padding: $spacing-sm;
      
      .skeleton-product-name {
        height: 16px;
        width: 85%;
        margin-bottom: $spacing-xs;
      }
      
      .skeleton-product-model {
        height: 12px;
        width: 60%;
        margin-bottom: $spacing-xs;
      }
      
      .skeleton-product-price {
        height: 16px;
        width: 50%;
      }
    }
  }
}

// ========== 表单骨架 ==========
.skeleton-form {
  .skeleton-form-field {
    margin-bottom: $spacing-lg;
    
    .skeleton-form-label {
      height: 16px;
      width: 25%;
      margin-bottom: $spacing-sm;
    }
    
    .skeleton-form-input {
      height: 40px;
      border-radius: $border-radius-base;
      
      &.textarea {
        height: 80px;
      }
      
      &.select {
        position: relative;
        
        &::after {
          content: '';
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          width: 0;
          height: 0;
          border-left: 4px solid transparent;
          border-right: 4px solid transparent;
          border-top: 4px solid $border-color;
        }
      }
    }
  }
}

// ========== 统计卡片骨架 ==========
.skeleton-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: $spacing-md;
  
  .skeleton-stat-item {
    display: flex;
    align-items: center;
    gap: $spacing-md;
    padding: $spacing-lg;
    background: $bg-color-white;
    border-radius: $border-radius-lg;
    border: 1px solid $border-color;
    
    .skeleton-stat-icon {
      width: 48px;
      height: 48px;
      border-radius: $border-radius-base;
      flex-shrink: 0;
    }
    
    .skeleton-stat-content {
      flex: 1;
      
      .skeleton-stat-number {
        height: 24px;
        width: 60%;
        margin-bottom: $spacing-xs;
      }
      
      .skeleton-stat-label {
        height: 14px;
        width: 80%;
      }
    }
  }
}

// ========== 通用骨架 ==========
.skeleton-generic {
  .skeleton-line {
    height: 16px;
    margin-bottom: $spacing-sm;
    border-radius: $border-radius-sm;
    
    &:last-child {
      margin-bottom: 0;
    }
  }
}

// ========== 响应式设计 ==========
@media (max-width: 480px) {
  .skeleton-product {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .skeleton-stats {
    grid-template-columns: 1fr;
  }
  
  .skeleton-list-item {
    flex-direction: column;
    align-items: stretch;
    
    .skeleton-avatar {
      align-self: center;
      margin-right: 0;
      margin-bottom: $spacing-sm;
    }
  }
}

@media (min-width: 768px) {
  .skeleton-product {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  }
  
  .skeleton-stats {
    grid-template-columns: repeat(3, 1fr);
  }
}

// ========== 暗黑模式支持 ==========
@media (prefers-color-scheme: dark) {
  .loading-skeleton {
    .skeleton-line,
    .skeleton-title,
    .skeleton-subtitle,
    .skeleton-text,
    .skeleton-image,
    .skeleton-avatar,
    .skeleton-action,
    .skeleton-list-title,
    .skeleton-list-description,
    .skeleton-meta-item,
    .skeleton-product-image,
    .skeleton-product-name,
    .skeleton-product-model,
    .skeleton-product-price,
    .skeleton-form-label,
    .skeleton-form-input,
    .skeleton-stat-icon,
    .skeleton-stat-number,
    .skeleton-stat-label {
      background: #374151;
    }
    
    .skeleton-loading {
      background: linear-gradient(90deg, 
        #374151 25%, 
        #4b5563 50%, 
        #374151 75%
      );
    }
  }
  
  .skeleton-card,
  .skeleton-list-item,
  .skeleton-product-item,
  .skeleton-stat-item {
    background: #1f2937;
    border-color: #374151;
  }
}</style>