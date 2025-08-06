<template>
  <view class="table-loading-skeleton">
    <view class="skeleton-row skeleton-header" v-if="showHeader">
      <view class="skeleton-checkbox" v-if="hasSelection"></view>
      <view 
        class="skeleton-cell" 
        v-for="column in columns" 
        :key="column"
        :style="{ width: getColumnWidth(column) }"
      >
        <view class="skeleton-text skeleton-text-header"></view>
      </view>
      <view class="skeleton-actions" v-if="hasActions">
        <view class="skeleton-text skeleton-text-small"></view>
      </view>
    </view>
    
    <view 
      class="skeleton-row skeleton-body" 
      v-for="row in rows" 
      :key="row"
    >
      <view class="skeleton-checkbox" v-if="hasSelection">
        <view class="skeleton-checkbox-box"></view>
      </view>
      <view 
        class="skeleton-cell" 
        v-for="column in columns" 
        :key="column"
        :style="{ width: getColumnWidth(column) }"
      >
        <view class="skeleton-text" :class="getSkeletonTextClass(column)"></view>
      </view>
      <view class="skeleton-actions" v-if="hasActions">
        <view class="skeleton-action-btn" v-for="action in 3" :key="action"></view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'

/**
 * 数据表格加载骨架屏组件
 * 
 * 功能说明：
 * - 为数据表格提供优雅的加载状态展示
 * - 支持自定义行数、列数和布局配置
 * - 提供流畅的加载动画效果
 * - 响应式设计，适配不同屏幕尺寸
 * - 支持选择框和操作按钮区域
 * 
 * 使用场景：
 * - 客户列表加载时
 * - 产品列表加载时
 * - 报价记录加载时
 * - 任何需要表格数据加载状态的页面
 * 
 * @author Terminal 3 (Admin Frontend Team)
 */

interface Props {
  /** 骨架屏行数 */
  rows?: number
  /** 表格列配置 */
  columns?: string[]
  /** 是否显示表头 */
  showHeader?: boolean
  /** 是否有选择功能 */
  hasSelection?: boolean
  /** 是否有操作按钮 */
  hasActions?: boolean
  /** 骨架屏尺寸 */
  size?: 'small' | 'medium' | 'large'
}

const props = withDefaults(defineProps<Props>(), {
  rows: 5,
  columns: () => ['name', 'status', 'date', 'value'],
  showHeader: true,
  hasSelection: true,
  hasActions: true,
  size: 'medium'
})

// 获取列宽度
const getColumnWidth = (column: string) => {
  const widthMap: Record<string, string> = {
    name: '25%',
    status: '15%',
    date: '20%',
    value: '15%',
    email: '25%',
    phone: '20%',
    company: '20%',
    category: '15%',
    price: '15%',
    quantity: '10%'
  }
  return widthMap[column] || '20%'
}

// 获取骨架文本样式类
const getSkeletonTextClass = (column: string) => {
  const classMap: Record<string, string> = {
    name: 'skeleton-text-long',
    email: 'skeleton-text-long', 
    company: 'skeleton-text-long',
    status: 'skeleton-text-short',
    date: 'skeleton-text-medium',
    value: 'skeleton-text-short',
    price: 'skeleton-text-short',
    phone: 'skeleton-text-medium',
    category: 'skeleton-text-short',
    quantity: 'skeleton-text-short'
  }
  return classMap[column] || 'skeleton-text-medium'
}
</script>

<style lang="scss" scoped>
.table-loading-skeleton {
  width: 100%;
  
  .skeleton-row {
    display: flex;
    align-items: center;
    padding: 12px;
    border-bottom: 1px solid var(--border-color-light);
    
    &.skeleton-header {
      background: var(--color-grey-50);
      font-weight: 500;
      
      .skeleton-text-header {
        height: 16px;
        background: var(--color-grey-200);
      }
    }
    
    &.skeleton-body {
      background: #fff;
      
      &:hover {
        background: var(--color-grey-25);
      }
    }
  }
  
  .skeleton-checkbox {
    width: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    
    .skeleton-checkbox-box {
      width: 16px;
      height: 16px;
      border-radius: 3px;
      background: var(--color-grey-200);
    }
  }
  
  .skeleton-cell {
    padding: 0 8px;
    display: flex;
    align-items: center;
  }
  
  .skeleton-text {
    height: 14px;
    border-radius: 4px;
    background: var(--color-grey-200);
    position: relative;
    overflow: hidden;
    
    // 动画效果
    &::after {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(
        90deg,
        transparent,
        rgba(255, 255, 255, 0.6),
        transparent
      );
      animation: skeleton-loading 1.5s infinite;
    }
    
    &.skeleton-text-short {
      width: 60px;
    }
    
    &.skeleton-text-medium {
      width: 100px;
    }
    
    &.skeleton-text-long {
      width: 140px;
    }
    
    &.skeleton-text-header {
      width: 80px;
      height: 16px;
    }
    
    &.skeleton-text-small {
      width: 40px;
      height: 12px;
    }
  }
  
  .skeleton-actions {
    width: 120px;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
    
    .skeleton-action-btn {
      width: 28px;
      height: 28px;
      border-radius: 4px;
      background: var(--color-grey-200);
      position: relative;
      overflow: hidden;
      
      &::after {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(
          90deg,
          transparent,
          rgba(255, 255, 255, 0.6),
          transparent
        );
        animation: skeleton-loading 1.5s infinite;
      }
    }
  }
}

// 骨架屏加载动画
@keyframes skeleton-loading {
  0% {
    left: -100%;
  }
  100% {
    left: 100%;
  }
}

// 尺寸变体
.table-loading-skeleton {
  &.size-small {
    .skeleton-row {
      padding: 8px;
    }
    
    .skeleton-text {
      height: 12px;
      
      &.skeleton-text-header {
        height: 14px;
      }
    }
    
    .skeleton-actions .skeleton-action-btn {
      width: 24px;
      height: 24px;
    }
  }
  
  &.size-large {
    .skeleton-row {
      padding: 16px;
    }
    
    .skeleton-text {
      height: 16px;
      
      &.skeleton-text-header {
        height: 18px;
      }
    }
    
    .skeleton-actions .skeleton-action-btn {
      width: 32px;
      height: 32px;
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .table-loading-skeleton {
    .skeleton-row {
      padding: 8px;
    }
    
    .skeleton-cell {
      padding: 0 4px;
      
      // 在移动端隐藏部分列
      &:nth-child(n+4) {
        display: none;
      }
    }
    
    .skeleton-actions {
      width: 80px;
      
      .skeleton-action-btn {
        width: 24px;
        height: 24px;
        
        &:nth-child(n+3) {
          display: none;
        }
      }
    }
    
    .skeleton-text {
      &.skeleton-text-long {
        width: 100px;
      }
      
      &.skeleton-text-medium {
        width: 80px;
      }
    }
  }
}

@media (max-width: 480px) {
  .table-loading-skeleton {
    .skeleton-cell {
      // 移动端只显示前两列
      &:nth-child(n+3) {
        display: none;
      }
    }
  }
}
</style>