<template>
  <view class="data-table">
    <table class="table">
      <thead>
        <tr>
          <th 
            v-for="column in columns" 
            :key="column.key"
            :class="{ 'sortable': column.sortable }"
            @click="handleSort(column)"
          >
            <view class="th-content">
              <text>{{ column.title }}</text>
              <text 
                v-if="column.sortable" 
                class="sort-indicator"
                :class="getSortClass(column.key)"
              >
                ↕
              </text>
            </view>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="loading">
          <td :colspan="columns.length" class="loading-row">
            <view class="loading-content">
              <text>加载中...</text>
            </view>
          </td>
        </tr>
        <tr v-else-if="!data || data.length === 0">
          <td :colspan="columns.length" class="empty-row">
            <view class="empty-content">
              <text>暂无数据</text>
            </view>
          </td>
        </tr>
        <tr v-else v-for="(row, index) in data" :key="row.id || index" class="data-row">
          <td v-for="column in columns" :key="column.key" :class="column.class">
            <slot 
              :name="column.key" 
              :row="row" 
              :value="getColumnValue(row, column.key)" 
              :index="index"
            >
              {{ getColumnValue(row, column.key) }}
            </slot>
          </td>
        </tr>
      </tbody>
    </table>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Column {
  key: string
  title: string
  sortable?: boolean
  class?: string
  width?: string
}

interface Props {
  columns: Column[]
  data: any[]
  loading?: boolean
  sortBy?: string
  sortDirection?: 'asc' | 'desc'
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  sortBy: '',
  sortDirection: 'asc'
})

const emit = defineEmits<{
  sort: [column: string, direction: 'asc' | 'desc']
}>()

function getColumnValue(row: any, key: string) {
  return key.split('.').reduce((obj, k) => obj?.[k], row) || ''
}

function handleSort(column: Column) {
  if (!column.sortable) return
  
  let newDirection: 'asc' | 'desc' = 'asc'
  
  if (props.sortBy === column.key) {
    newDirection = props.sortDirection === 'asc' ? 'desc' : 'asc'
  }
  
  emit('sort', column.key, newDirection)
}

function getSortClass(columnKey: string): string {
  if (props.sortBy !== columnKey) return ''
  
  return props.sortDirection === 'asc' ? 'sort-asc' : 'sort-desc'
}
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.data-table {
  background: $bg-color-white;
  border-radius: 8px;
  border: 1px solid $border-color;
  overflow: hidden;
  
  .table {
    width: 100%;
    border-collapse: collapse;
    
    thead {
      background: $bg-color;
      
      th {
        padding: $spacing-md;
        text-align: left;
        font-weight: 500;
        color: $text-color;
        border-bottom: 1px solid $border-color;
        
        &.sortable {
          cursor: pointer;
          transition: background-color 0.3s ease;
          
          &:hover {
            background: rgba($primary-color, 0.05);
          }
        }
        
        .th-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          
          .sort-indicator {
            font-size: $font-size-small;
            color: $text-color-placeholder;
            margin-left: $spacing-xs;
            
            &.sort-asc {
              color: $primary-color;
              transform: rotate(180deg);
            }
            
            &.sort-desc {
              color: $primary-color;
            }
          }
        }
      }
    }
    
    tbody {
      tr {
        border-bottom: 1px solid $border-color-light;
        transition: background-color 0.3s ease;
        
        &:hover:not(.loading-row):not(.empty-row) {
          background: rgba($primary-color, 0.02);
        }
        
        &:last-child {
          border-bottom: none;
        }
        
        td {
          padding: $spacing-md;
          color: $text-color;
          vertical-align: top;
          
          &:first-child {
            border-left: none;
          }
          
          &:last-child {
            border-right: none;
          }
        }
        
        &.loading-row,
        &.empty-row {
          td {
            text-align: center;
            padding: $spacing-lg;
            color: $text-color-secondary;
            font-style: italic;
          }
        }
        
        &.loading-row td {
          background: rgba($primary-color, 0.02);
        }
      }
    }
  }
}

// Responsive design
@media (max-width: 768px) {
  .data-table {
    .table {
      font-size: $font-size-small;
      
      thead th {
        padding: $spacing-sm;
      }
      
      tbody td {
        padding: $spacing-sm;
      }
    }
  }
}
</style>