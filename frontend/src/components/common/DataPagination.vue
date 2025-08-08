<template>
  <view class="data-pagination">
    <view class="pagination-info">
      <text class="page-info">
        第 {{ currentPage }} 页 / 共 {{ totalPages }} 页
      </text>
      <text class="item-info">
        共 {{ totalItems }} 条记录
      </text>
    </view>
    
    <view class="pagination-controls">
      <button 
        class="pagination-btn" 
        :class="{ 'btn-disabled': currentPage <= 1 }"
        :disabled="currentPage <= 1"
        @click="goToPage(1)"
      >
        首页
      </button>
      
      <button 
        class="pagination-btn" 
        :class="{ 'btn-disabled': currentPage <= 1 }"
        :disabled="currentPage <= 1"
        @click="goToPage(currentPage - 1)"
      >
        上一页
      </button>
      
      <view class="page-input">
        <input 
          v-model="pageInput"
          type="number"
          :min="1"
          :max="totalPages"
          class="page-number-input"
          @keyup.enter="goToInputPage"
        />
      </view>
      
      <button 
        class="pagination-btn"
        :class="{ 'btn-disabled': currentPage >= totalPages }"
        :disabled="currentPage >= totalPages"
        @click="goToPage(currentPage + 1)"
      >
        下一页
      </button>
      
      <button 
        class="pagination-btn"
        :class="{ 'btn-disabled': currentPage >= totalPages }"
        :disabled="currentPage >= totalPages"
        @click="goToPage(totalPages)"
      >
        末页
      </button>
    </view>
    
    <view class="page-size-selector">
      <text class="label">每页显示：</text>
      <select 
        :value="pageSize"
        @change="handlePageSizeChange"
        class="page-size-select"
      >
        <option value="10">10</option>
        <option value="20">20</option>
        <option value="50">50</option>
        <option value="100">100</option>
      </select>
      <text class="label">条</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

interface Props {
  currentPage: number
  totalPages: number
  totalItems: number
  pageSize: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'page-change': [page: number]
  'page-size-change': [pageSize: number]
}>()

const pageInput = ref(props.currentPage)

watch(() => props.currentPage, (newPage) => {
  pageInput.value = newPage
})

function goToPage(page: number) {
  if (page >= 1 && page <= props.totalPages && page !== props.currentPage) {
    emit('page-change', page)
  }
}

function goToInputPage() {
  const page = parseInt(pageInput.value.toString())
  if (page >= 1 && page <= props.totalPages) {
    goToPage(page)
  } else {
    pageInput.value = props.currentPage
  }
}

function handlePageSizeChange(event: Event) {
  const target = event.target as HTMLSelectElement
  const newPageSize = parseInt(target.value)
  emit('page-size-change', newPageSize)
}
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.data-pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $spacing-md;
  background: $bg-color-white;
  border-top: 1px solid $border-color;
  border-radius: 0 0 8px 8px;
  gap: $spacing-md;
  
  .pagination-info {
    display: flex;
    flex-direction: column;
    gap: $spacing-xs;
    
    .page-info,
    .item-info {
      font-size: $font-size-small;
      color: $text-color-secondary;
    }
  }
  
  .pagination-controls {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    
    .pagination-btn {
      padding: $spacing-xs $spacing-sm;
      border: 1px solid $border-color;
      background: $bg-color-white;
      color: $text-color;
      border-radius: 4px;
      cursor: pointer;
      font-size: $font-size-base;
      transition: all 0.3s ease;
      
      &:hover:not(.btn-disabled) {
        border-color: $primary-color;
        color: $primary-color;
      }
      
      &.btn-disabled {
        color: $text-color-placeholder;
        cursor: not-allowed;
        opacity: 0.6;
      }
    }
    
    .page-input {
      .page-number-input {
        width: 60px;
        padding: $spacing-xs;
        border: 1px solid $border-color;
        border-radius: 4px;
        text-align: center;
        font-size: $font-size-base;
        
        &:focus {
          outline: none;
          border-color: $primary-color;
        }
      }
    }
  }
  
  .page-size-selector {
    display: flex;
    align-items: center;
    gap: $spacing-xs;
    
    .label {
      font-size: $font-size-small;
      color: $text-color-secondary;
    }
    
    .page-size-select {
      padding: $spacing-xs;
      border: 1px solid $border-color;
      border-radius: 4px;
      background: $bg-color-white;
      font-size: $font-size-base;
      
      &:focus {
        outline: none;
        border-color: $primary-color;
      }
    }
  }
}

// Responsive design
@media (max-width: 768px) {
  .data-pagination {
    flex-direction: column;
    align-items: stretch;
    gap: $spacing-sm;
    
    .pagination-info {
      flex-direction: row;
      justify-content: space-between;
    }
    
    .pagination-controls {
      justify-content: center;
    }
    
    .page-size-selector {
      justify-content: center;
    }
  }
}
</style>