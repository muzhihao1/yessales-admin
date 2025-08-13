<template>
  <div class="table-loading-skeleton">
    <!-- Header Skeleton (if needed) -->
    <div v-if="showHeader" class="skeleton-header">
      <div v-if="hasSelection" class="skeleton-checkbox"></div>
      <div 
        v-for="index in columns" 
        :key="index" 
        class="skeleton-header-cell"
        :class="`column-${index}`"
      ></div>
    </div>

    <!-- Body Skeleton Rows -->
    <div class="skeleton-body">
      <div 
        v-for="row in rows" 
        :key="row" 
        class="skeleton-row"
        :class="`row-${row}`"
      >
        <!-- Selection Checkbox Column -->
        <div v-if="hasSelection" class="skeleton-checkbox"></div>
        
        <!-- Data Columns -->
        <div 
          v-for="col in columns" 
          :key="col" 
          class="skeleton-cell"
          :class="`col-${col}`"
        >
          <div class="skeleton-content" :style="getCellWidth(col)"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 表格加载骨架屏组件
 * 
 * 功能说明：
 * - 为数据表格提供加载状态的骨架屏效果
 * - 支持动态行数和列数配置
 * - 支持选择框列的骨架显示
 * - 提供平滑的加载动画效果
 * - 适配不同表格布局需求
 *
 * @author Terminal 3 (Admin Frontend Team)
 */

interface Props {
  /** 骨架屏行数 */
  rows: number
  /** 骨架屏列数 */  
  columns: number
  /** 是否显示选择框列 */
  hasSelection?: boolean
  /** 是否显示表头骨架 */
  showHeader?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  rows: 5,
  columns: 4,
  hasSelection: false,
  showHeader: false
})

// 获取单元格宽度（模拟不同列的宽度变化）
const getCellWidth = (columnIndex: number) => {
  const widths = ['60%', '80%', '70%', '90%', '65%', '75%']
  const width = widths[(columnIndex - 1) % widths.length]
  return { width }
}
</script>

<style lang="scss" scoped>
.table-loading-skeleton {
  width: 100%;
  
  .skeleton-header {
    display: flex;
    align-items: center;
    padding: 12px 16px;
    border-bottom: 1px solid var(--border-color-light, #e5e7eb);
    background: var(--color-grey-25, #f9fafb);
    
    .skeleton-checkbox {
      width: 16px;
      height: 16px;
      border-radius: 2px;
      margin-right: 12px;
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: skeleton-loading 1.5s infinite;
    }
    
    .skeleton-header-cell {
      flex: 1;
      height: 16px;
      margin-right: 16px;
      border-radius: 4px;
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: skeleton-loading 1.5s infinite;
      
      &:last-child {
        margin-right: 0;
      }
    }
  }
  
  .skeleton-body {
    .skeleton-row {
      display: flex;
      align-items: center;
      padding: 16px;
      border-bottom: 1px solid var(--border-color-lighter, #f3f4f6);
      
      &:hover {
        background: var(--color-grey-25, #f9fafb);
      }
      
      .skeleton-checkbox {
        width: 16px;
        height: 16px;
        border-radius: 2px;
        margin-right: 12px;
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 200% 100%;
        animation: skeleton-loading 1.5s infinite;
      }
      
      .skeleton-cell {
        flex: 1;
        margin-right: 16px;
        
        &:last-child {
          margin-right: 0;
        }
        
        .skeleton-content {
          height: 16px;
          border-radius: 4px;
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: skeleton-loading 1.5s infinite;
        }
      }
    }
  }
}

@keyframes skeleton-loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

// 不同行的延迟动画效果
@for $i from 1 through 10 {
  .skeleton-row.row-#{$i} {
    .skeleton-content,
    .skeleton-checkbox {
      animation-delay: #{$i * 0.1}s;
    }
  }
}

// 不同列的延迟动画效果  
@for $i from 1 through 8 {
  .skeleton-cell.col-#{$i} .skeleton-content {
    animation-delay: #{$i * 0.05}s;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .table-loading-skeleton {
    .skeleton-header,
    .skeleton-row {
      padding: 12px;
    }
    
    .skeleton-cell {
      margin-right: 8px;
    }
  }
}
</style>