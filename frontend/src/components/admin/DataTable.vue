<template>
  <view class="admin-data-table">
    <!-- 表格头部工具栏 -->
    <view v-if="showToolbar" class="table-toolbar">
      <view class="toolbar-left">
        <slot name="toolbar-left">
          <text v-if="selectedRows.length > 0" class="selected-count">
            已选择 {{ selectedRows.length }} 项
          </text>
        </slot>
      </view>
      <view class="toolbar-right">
        <slot name="toolbar-right"></slot>
      </view>
    </view>

    <!-- 表格主体 -->
    <view class="table-wrapper">
      <!-- 加载状态 -->
      <view v-if="loading" class="table-loading">
        <view class="loading-spinner"></view>
        <text class="loading-text">加载中...</text>
      </view>

      <!-- 空状态 -->
      <view v-else-if="!data || data.length === 0" class="table-empty">
        <text class="empty-icon">📋</text>
        <text class="empty-text">{{ emptyText }}</text>
        <slot name="empty"></slot>
      </view>

      <!-- 表格内容 -->
      <view v-else class="table-content">
        <scroll-view scroll-x class="table-scroll">
          <view class="table">
            <!-- 表头 -->
            <view class="table-header">
              <view class="table-row">
                <view v-if="showSelection" class="table-cell cell-checkbox">
                  <checkbox
                    :checked="isAllSelected"
                    :indeterminate="isIndeterminate"
                    @change="handleSelectAll"
                  />
                </view>
                <view
                  v-for="column in columns"
                  :key="column.key"
                  :class="['table-cell', `cell-${column.key}`, { sortable: column.sortable }]"
                  :style="getCellStyle(column)"
                  @click="handleSort(column)"
                >
                  <text class="cell-text">{{ column.title }}</text>
                  <view v-if="column.sortable" class="sort-icon">
                    <text
                      :class="[
                        'arrow',
                        'arrow-up',
                        { active: sortKey === column.key && sortOrder === 'asc' }
                      ]"
                      >▲</text
                    >
                    <text
                      :class="[
                        'arrow',
                        'arrow-down',
                        { active: sortKey === column.key && sortOrder === 'desc' }
                      ]"
                      >▼</text
                    >
                  </view>
                </view>
                <view v-if="showActions" class="table-cell cell-actions">
                  <text class="cell-text">操作</text>
                </view>
              </view>
            </view>

            <!-- 表体 -->
            <view class="table-body">
              <view
                v-for="(row, index) in displayData"
                :key="getRowKey(row, index)"
                :class="[
                  'table-row',
                  { selected: isRowSelected(row), hover: hoveredRow === index }
                ]"
                @mouseenter="hoveredRow = index"
                @mouseleave="hoveredRow = -1"
                @click="handleRowClick(row, index)"
              >
                <view v-if="showSelection" class="table-cell cell-checkbox">
                  <checkbox
                    :checked="isRowSelected(row)"
                    @change="e => handleRowSelect(row, e.detail.value)"
                    @click.stop
                  />
                </view>
                <view
                  v-for="column in columns"
                  :key="column.key"
                  :class="['table-cell', `cell-${column.key}`]"
                  :style="getCellStyle(column)"
                >
                  <slot :name="`cell-${column.key}`" :row="row" :column="column" :index="index">
                    <text class="cell-text">{{ getCellValue(row, column) }}</text>
                  </slot>
                </view>
                <view v-if="showActions" class="table-cell cell-actions">
                  <slot name="actions" :row="row" :index="index">
                    <view class="action-buttons">
                      <button
                        v-for="action in actions"
                        :key="action.key"
                        :class="['action-btn', `btn-${action.type || 'default'}`]"
                        @click.stop="handleAction(action, row, index)"
                      >
                        {{ action.label }}
                      </button>
                    </view>
                  </slot>
                </view>
              </view>
            </view>
          </view>
        </scroll-view>
      </view>
    </view>

    <!-- 分页 -->
    <view v-if="showPagination && total > 0" class="table-pagination">
      <view class="pagination-info">
        <text>共 {{ total }} 条记录</text>
      </view>
      <view class="pagination-controls">
        <button
          class="page-btn"
          :disabled="currentPage === 1"
          @click="handlePageChange(currentPage - 1)"
        >
          上一页
        </button>
        <text class="page-number">{{ currentPage }} / {{ totalPages }}</text>
        <button
          class="page-btn"
          :disabled="currentPage === totalPages"
          @click="handlePageChange(currentPage + 1)"
        >
          下一页
        </button>
      </view>
      <view class="page-size-selector">
        <picker
          mode="selector"
          :range="pageSizeOptions"
          :value="pageSizeIndex"
          @change="handlePageSizeChange"
        >
          <view class="uni-input">{{ pageSize }} 条/页</view>
        </picker>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

export interface TableColumn {
  key: string
  title: string
  width?: string
  align?: 'left' | 'center' | 'right'
  sortable?: boolean
  formatter?: (value: any, row: any) => string
}

export interface TableAction {
  key: string
  label: string
  type?: 'primary' | 'success' | 'warning' | 'danger' | 'default'
  handler?: (row: any, index: number) => void
}

interface Props {
  columns: TableColumn[]
  data: any[]
  loading?: boolean
  showSelection?: boolean
  showActions?: boolean
  showToolbar?: boolean
  showPagination?: boolean
  actions?: TableAction[]
  emptyText?: string
  rowKey?: string | ((row: any) => string)
  total?: number
  currentPage?: number
  pageSize?: number
  pageSizeOptions?: number[]
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  showSelection: false,
  showActions: true,
  showToolbar: true,
  showPagination: true,
  actions: () => [],
  emptyText: '暂无数据',
  rowKey: 'id',
  total: 0,
  currentPage: 1,
  pageSize: 20,
  pageSizeOptions: () => [10, 20, 50, 100]
})

const emit = defineEmits<{
  'update:currentPage': [page: number]
  'update:pageSize': [size: number]
  'sort-change': [{ key: string; order: 'asc' | 'desc' | null }]
  'row-click': [row: any, index: number]
  'row-select': [rows: any[]]
  'action-click': [action: TableAction, row: any, index: number]
}>()

const selectedRows = ref<any[]>([])
const sortKey = ref<string | null>(null)
const sortOrder = ref<'asc' | 'desc' | null>(null)
const hoveredRow = ref(-1)

const displayData = computed(() => {
  const result = [...props.data]

  // 客户端排序
  if (sortKey.value && sortOrder.value) {
    result.sort((a, b) => {
      const aVal = a[sortKey.value!]
      const bVal = b[sortKey.value!]

      if (aVal === bVal) return 0

      if (sortOrder.value === 'asc') {
        return aVal > bVal ? 1 : -1
      } else {
        return aVal < bVal ? 1 : -1
      }
    })
  }

  return result
})

const totalPages = computed(() => {
  return Math.ceil(props.total / props.pageSize)
})

const pageSizeIndex = computed(() => {
  return props.pageSizeOptions.indexOf(props.pageSize)
})

const isAllSelected = computed(() => {
  return props.data.length > 0 && selectedRows.value.length === props.data.length
})

const isIndeterminate = computed(() => {
  return selectedRows.value.length > 0 && selectedRows.value.length < props.data.length
})

const getRowKey = (row: any, index: number): string => {
  if (typeof props.rowKey === 'function') {
    return props.rowKey(row)
  }
  return row[props.rowKey] || index.toString()
}

const getCellValue = (row: any, column: TableColumn): string => {
  const value = row[column.key]
  if (column.formatter) {
    return column.formatter(value, row)
  }
  return value?.toString() || '-'
}

const getCellStyle = (column: TableColumn) => {
  const style: any = {}
  if (column.width) {
    style.width = column.width
    style.minWidth = column.width
  }
  if (column.align) {
    style.textAlign = column.align
  }
  return style
}

const isRowSelected = (row: any): boolean => {
  const key = getRowKey(row, 0)
  return selectedRows.value.some(r => getRowKey(r, 0) === key)
}

const handleSelectAll = (e: any) => {
  if (e.detail.value) {
    selectedRows.value = [...props.data]
  } else {
    selectedRows.value = []
  }
  emit('row-select', selectedRows.value)
}

const handleRowSelect = (row: any, checked: boolean) => {
  const key = getRowKey(row, 0)
  if (checked) {
    if (!isRowSelected(row)) {
      selectedRows.value.push(row)
    }
  } else {
    selectedRows.value = selectedRows.value.filter(r => getRowKey(r, 0) !== key)
  }
  emit('row-select', selectedRows.value)
}

const handleSort = (column: TableColumn) => {
  if (!column.sortable) return

  if (sortKey.value === column.key) {
    if (sortOrder.value === 'asc') {
      sortOrder.value = 'desc'
    } else if (sortOrder.value === 'desc') {
      sortKey.value = null
      sortOrder.value = null
    }
  } else {
    sortKey.value = column.key
    sortOrder.value = 'asc'
  }

  emit('sort-change', {
    key: sortKey.value || '',
    order: sortOrder.value
  })
}

const handleRowClick = (row: any, index: number) => {
  emit('row-click', row, index)
}

const handleAction = (action: TableAction, row: any, index: number) => {
  if (action.handler) {
    action.handler(row, index)
  }
  emit('action-click', action, row, index)
}

const handlePageChange = (page: number) => {
  emit('update:currentPage', page)
}

const handlePageSizeChange = (e: any) => {
  const newSize = props.pageSizeOptions[e.detail.value]
  emit('update:pageSize', newSize)
  emit('update:currentPage', 1) // 重置到第一页
}

// 监听数据变化，清空选择
watch(
  () => props.data,
  () => {
    selectedRows.value = []
  }
)

// 暴露方法
defineExpose({
  selectedRows,
  clearSelection: () => {
    selectedRows.value = []
  }
})
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.admin-data-table {
  background-color: $bg-color-white;
  border-radius: $border-radius-base;
  overflow: hidden;
}

.table-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $spacing-base;
  border-bottom: 1px solid $border-color-lighter;

  .selected-count {
    font-size: $font-size-base;
    color: $text-color-secondary;
  }
}

.table-wrapper {
  position: relative;
  min-height: 200px;
}

.table-loading,
.table-empty {
  @include flex-center;
  flex-direction: column;
  padding: $spacing-xl 0;

  .loading-spinner {
    @include loading;
    width: 40px;
    height: 40px;
    margin-bottom: $spacing-base;
  }

  .loading-text,
  .empty-text {
    font-size: $font-size-base;
    color: $text-color-regular;
  }

  .empty-icon {
    font-size: 48px;
    margin-bottom: $spacing-base;
  }
}

.table-scroll {
  width: 100%;
  overflow-x: auto;
  @include scrollbar;
}

.table {
  width: 100%;
  min-width: 100%;
}

.table-header {
  background-color: $bg-color;
  position: sticky;
  top: 0;
  z-index: 10;

  .table-row {
    border-bottom: 1px solid $border-color;
  }

  .table-cell {
    font-weight: $font-weight-medium;
    color: $text-color-secondary;

    &.sortable {
      cursor: pointer;
      user-select: none;

      &:hover {
        background-color: darken($bg-color, 3%);
      }
    }
  }

  .sort-icon {
    display: inline-flex;
    flex-direction: column;
    margin-left: 4px;

    .arrow {
      font-size: 8px;
      line-height: 1;
      color: $text-color-placeholder;

      &.active {
        color: $primary-color;
      }
    }
  }
}

.table-body {
  .table-row {
    border-bottom: 1px solid $border-color-lighter;
    transition: $transition-base;

    &.hover {
      background-color: $bg-color;
    }

    &.selected {
      background-color: lighten($primary-color, 45%);
    }
  }
}

.table-row {
  display: flex;
  align-items: center;
  min-height: 48px;
}

.table-cell {
  flex: 1;
  padding: $spacing-sm $spacing-base;
  display: flex;
  align-items: center;

  &.cell-checkbox {
    flex: 0 0 50px;
    justify-content: center;
  }

  &.cell-actions {
    flex: 0 0 auto;
  }

  .cell-text {
    @include text-ellipsis;
    font-size: $font-size-base;
    color: $text-color;
  }
}

.action-buttons {
  display: flex;
  gap: $spacing-xs;

  .action-btn {
    padding: 4px 12px;
    font-size: $font-size-small;
    border-radius: $border-radius-sm;
    border: 1px solid transparent;
    cursor: pointer;
    transition: $transition-base;

    &.btn-primary {
      @include button-variant($primary-color);
    }

    &.btn-success {
      @include button-variant($success-color);
    }

    &.btn-danger {
      @include button-variant($danger-color);
    }

    &.btn-default {
      background-color: $bg-color-white;
      color: $text-color-regular;
      border-color: $border-color;

      &:hover {
        border-color: $primary-color;
        color: $primary-color;
      }
    }
  }
}

.table-pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $spacing-base;
  border-top: 1px solid $border-color-lighter;

  .pagination-info {
    font-size: $font-size-base;
    color: $text-color-regular;
  }

  .pagination-controls {
    display: flex;
    align-items: center;
    gap: $spacing-base;

    .page-btn {
      padding: 6px 12px;
      font-size: $font-size-base;
      background-color: $bg-color-white;
      border: 1px solid $border-color;
      border-radius: $border-radius-sm;
      cursor: pointer;
      transition: $transition-base;

      &:hover:not([disabled]) {
        border-color: $primary-color;
        color: $primary-color;
      }

      &[disabled] {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

    .page-number {
      font-size: $font-size-base;
      color: $text-color;
    }
  }

  .page-size-selector {
    .uni-input {
      padding: 6px 12px;
      font-size: $font-size-base;
      border: 1px solid $border-color;
      border-radius: $border-radius-sm;
      cursor: pointer;
    }
  }
}

/* 移动端适配 */
@include respond-to('phone') {
  .table-pagination {
    flex-wrap: wrap;
    gap: $spacing-sm;

    .pagination-info {
      width: 100%;
      text-align: center;
    }
  }
}
</style>
