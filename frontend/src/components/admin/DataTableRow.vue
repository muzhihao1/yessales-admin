<template>
  <div
    ref="rowRef"
    class="data-table-row"
    :class="[
      {
        'row-selected': selected,
        'row-hover': !disabled,
        'row-disabled': disabled,
        'touch-optimized': touchOptimized,
        'virtual-row': isVirtualMode
      },
      `size-${size}`
    ]"
    :style="virtualRowStyle"
    @click="handleRowClick"
  >
    <!-- 选择框 -->
    <div v-if="selectable" class="row-cell row-selector" @click.stop>
      <checkbox
        :checked="selected"
        :disabled="disabled"
        @change="handleSelectionChange"
        :class="{ 'checkbox-touch': touchOptimized }"
      />
    </div>

    <!-- 数据单元格 -->
    <div
      v-for="column in columns"
      :key="column.key"
      class="row-cell"
      :class="[
        `cell-${column.key}`,
        `align-${column.align || 'left'}`,
        { 'cell-sortable': column.sortable }
      ]"
      :style="{ width: column.width, flex: column.flex }"
    >
      <!-- 自定义单元格内容插槽 -->
      <slot
        :name="`cell-${column.key}`"
        :item="item"
        :column="column"
        :value="getColumnValue(column.key)"
      >
        <!-- 默认单元格内容 -->
        <div class="cell-content">
          <!-- 状态标签 -->
          <div
            v-if="isStatusColumn(column.key)"
            class="status-tag"
            :class="`status-${getStatusType(getColumnValue(column.key))}`"
          >
            {{ getStatusLabel(getColumnValue(column.key)) }}
          </div>

          <!-- 图片显示 -->
          <img
            v-else-if="isImageColumn(column.key)"
            :src="getColumnValue(column.key)"
            class="cell-image"
            :class="{ 'image-placeholder': !getColumnValue(column.key) }"
            alt=""
            @error="handleImageError"
          />

          <!-- 价格显示 -->
          <span v-else-if="isPriceColumn(column.key)" class="cell-price">
            ¥{{ formatPrice(getColumnValue(column.key)) }}
          </span>

          <!-- 日期显示 -->
          <span v-else-if="isDateColumn(column.key)" class="cell-date">
            {{ formatDate(getColumnValue(column.key)) }}
          </span>

          <!-- 长文本截断 -->
          <span
            v-else-if="isLongTextColumn(column.key)"
            class="cell-long-text"
            :class="{ 'text-expanded': expandedTexts.has(column.key) }"
            @click.stop="toggleTextExpansion(column.key)"
          >
            {{
              expandedTexts.has(column.key)
                ? getColumnValue(column.key)
                : truncateText(getColumnValue(column.key), 50)
            }}
            <span v-if="needsTruncation(column.key)" class="expand-toggle">
              {{ expandedTexts.has(column.key) ? '收起' : '展开' }}
            </span>
          </span>

          <!-- 默认文本显示 -->
          <span v-else class="cell-text">
            {{ getColumnValue(column.key) || '-' }}
          </span>
        </div>
      </slot>
    </div>

    <!-- 操作按钮 -->
    <div v-if="actions && actions.length > 0" class="row-cell row-actions">
      <ActionButtonGroup
        :actions="actions"
        :item="item"
        :size="actionButtonSize"
        :touch-optimized="touchOptimized"
        :max-visible="maxVisibleActions"
        @action="handleAction"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, onMounted, onUnmounted, ref } from 'vue'
import ActionButtonGroup from './ActionButtonGroup.vue'
import type { ActionItem } from './ActionButtonGroup.vue'

/**
 * 增强数据表格行组件
 *
 * 功能说明：
 * - 提供统一的表格行展示和交互体验
 * - 支持行选择、状态显示、操作按钮等功能
 * - 自动处理不同数据类型的格式化显示
 * - iPad和移动端触控优化
 * - 符合PRD的品牌视觉和交互要求
 *
 * PRD要求对应：
 * - 状态标签颜色区分 (PRD Line 763, 839)
 * - 列表行悬停高亮 (PRD Line 737)
 * - iPad适配优化 (PRD Line 111, 179)
 * - 品牌视觉统一 (PRD Line 189, 261)
 *
 * @author Terminal 3 (Admin Frontend Team)
 */

export interface TableColumn {
  key: string
  label: string
  width?: string
  flex?: string
  align?: 'left' | 'center' | 'right'
  sortable?: boolean
  type?: 'text' | 'status' | 'image' | 'price' | 'date' | 'longtext'
}

interface Props {
  /** 数据项 */
  item: Record<string, any>
  /** 列配置 */
  columns: TableColumn[]
  /** 是否可选择 */
  selectable?: boolean
  /** 是否已选中 */
  selected?: boolean
  /** 是否禁用 */
  disabled?: boolean
  /** 操作按钮配置 */
  actions?: ActionItem[]
  /** 尺寸 */
  size?: 'small' | 'medium' | 'large'
  /** 触控优化（iPad/移动端） */
  touchOptimized?: boolean
  /** 操作按钮尺寸 */
  actionButtonSize?: 'small' | 'medium' | 'large'
  /** 最大可见操作按钮数 */
  maxVisibleActions?: number

  // 虚拟滚动支持
  /** 虚拟滚动索引 */
  virtualIndex?: number
  /** 虚拟滚动行高 */
  virtualHeight?: number
}

const props = withDefaults(defineProps<Props>(), {
  selectable: false,
  selected: false,
  disabled: false,
  actions: () => [],
  size: 'medium',
  touchOptimized: true,
  actionButtonSize: 'small',
  maxVisibleActions: 3,
  virtualIndex: undefined,
  virtualHeight: undefined
})

const emit = defineEmits<{
  select: [selected: boolean, item: Record<string, any>]
  click: [item: Record<string, any>]
  action: [actionKey: string, item: Record<string, any>]
  'height-change': [id: string | number, height: number]
}>()

// 展开的长文本记录
const expandedTexts = ref<Set<string>>(new Set())

// 虚拟滚动支持
const rowRef = ref<HTMLElement>()
const isVirtualMode = computed(() => props.virtualIndex !== undefined)

// 虚拟滚动样式
const virtualRowStyle = computed(() => {
  if (!isVirtualMode.value) return {}

  return {
    height: props.virtualHeight ? `${props.virtualHeight}px` : 'auto',
    transform:
      props.virtualIndex !== undefined
        ? `translateY(${props.virtualIndex * (props.virtualHeight || 60)}px)`
        : 'none',
    position: 'absolute' as const,
    top: '0px',
    left: '0px', 
    right: '0px',
    zIndex: 1
  }
})

// 从表格上下文获取状态映射配置（如果有）
const statusConfig = inject<Record<string, { label: string; type: string }>>('statusConfig', {})
// dateFormat is available if needed for custom formatting
// const dateFormat = inject<string>('dateFormat', 'YYYY-MM-DD HH:mm')

// 获取列值
const getColumnValue = (key: string) => {
  return key.split('.').reduce((obj, k) => obj?.[k], props.item)
}

// 判断列类型
const isStatusColumn = (key: string) => {
  return key.toLowerCase().includes('status') || key.toLowerCase().includes('state')
}

const isImageColumn = (key: string) => {
  return (
    key.toLowerCase().includes('image') ||
    key.toLowerCase().includes('avatar') ||
    key.toLowerCase().includes('photo')
  )
}

const isPriceColumn = (key: string) => {
  return (
    key.toLowerCase().includes('price') ||
    key.toLowerCase().includes('amount') ||
    key.toLowerCase().includes('cost')
  )
}

const isDateColumn = (key: string) => {
  return (
    key.toLowerCase().includes('time') ||
    key.toLowerCase().includes('date') ||
    key.toLowerCase().includes('created') ||
    key.toLowerCase().includes('updated')
  )
}

const isLongTextColumn = (key: string) => {
  const value = getColumnValue(key)
  return typeof value === 'string' && value.length > 50
}

// 状态处理
const getStatusType = (status: string) => {
  const statusMap: Record<string, string> = {
    // 报价状态
    pending: 'warning',
    approved: 'success',
    rejected: 'danger',
    draft: 'default',

    // 用户状态
    active: 'success',
    inactive: 'default',
    disabled: 'danger',

    // 产品状态
    available: 'success',
    unavailable: 'warning',
    discontinued: 'danger',

    // 通用状态
    success: 'success',
    warning: 'warning',
    error: 'danger',
    info: 'info',

    ...statusConfig
  }

  return statusMap[status] || 'default'
}

const getStatusLabel = (status: string) => {
  const labelMap: Record<string, string> = {
    // 报价状态
    pending: '待处理',
    approved: '已通过',
    rejected: '已拒绝',
    draft: '草稿',

    // 用户状态
    active: '启用',
    inactive: '未激活',
    disabled: '禁用',

    // 产品状态
    available: '可用',
    unavailable: '不可用',
    discontinued: '停产',

    // 通用状态
    success: '成功',
    warning: '警告',
    error: '错误',
    info: '信息'
  }

  return labelMap[status] || status
}

// 格式化价格
const formatPrice = (price: number | string) => {
  const num = typeof price === 'string' ? parseFloat(price) : price
  if (isNaN(num)) return '0.00'
  return num.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// 格式化日期
const formatDate = (date: string | Date) => {
  if (!date) return '-'
  const d = new Date(date)
  if (isNaN(d.getTime())) return date

  // 简单的日期格式化
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hour = String(d.getHours()).padStart(2, '0')
  const minute = String(d.getMinutes()).padStart(2, '0')

  return `${year}-${month}-${day} ${hour}:${minute}`
}

// 文本截断
const truncateText = (text: string | any, maxLength: number) => {
  if (typeof text !== 'string') return String(text || '')
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
}

const needsTruncation = (key: string) => {
  const value = getColumnValue(key)
  return typeof value === 'string' && value.length > 50
}

// 切换文本展开状态
const toggleTextExpansion = (key: string) => {
  if (expandedTexts.value.has(key)) {
    expandedTexts.value.delete(key)
  } else {
    expandedTexts.value.add(key)
  }
}

// 事件处理
const handleRowClick = () => {
  if (!props.disabled) {
    emit('click', props.item)
  }
}

const handleSelectionChange = (event: any) => {
  emit('select', event.detail.value, props.item)
}

const handleAction = (actionKey: string) => {
  emit('action', actionKey, props.item)
}

const handleImageError = (event: any) => {
  event.target.src = '/static/images/placeholder.png'
}

// 虚拟滚动高度变化处理
const observeHeight = () => {
  if (!isVirtualMode.value || !rowRef.value) return

  const resizeObserver = new ResizeObserver(entries => {
    for (const entry of entries) {
      const height = entry.contentRect.height
      if (height && props.item.id) {
        emit('height-change', props.item.id, height)
      }
    }
  })

  resizeObserver.observe(rowRef.value)

  return () => {
    resizeObserver.disconnect()
  }
}

// 生命周期
let cleanupHeightObserver: (() => void) | null = null

onMounted(() => {
  if (isVirtualMode.value) {
    cleanupHeightObserver = observeHeight()
  }
})

onUnmounted(() => {
  cleanupHeightObserver?.()
})
</script>

<style lang="scss" scoped>
.data-table-row {
  display: flex;
  align-items: center;
  min-height: 48px;
  padding: 0 12px;
  border-bottom: 1px solid var(--border-color-light);
  background: #fff;
  transition: all 0.2s ease;

  // 虚拟滚动模式样式
  &.virtual-row {
    position: absolute;
    width: 100%;
    contain: layout style paint;
    will-change: transform;

    // 优化渲染性能
    backface-visibility: hidden;
    transform-style: preserve-3d;
  }

  &.row-hover {
    cursor: pointer;

    &:hover {
      background: var(--color-grey-25);
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    }
  }

  &.row-selected {
    background: rgba(var(--color-primary-rgb), 0.05);
    border-left: 3px solid var(--color-primary);
  }

  &.row-disabled {
    opacity: 0.6;
    cursor: not-allowed;
    background: var(--color-grey-50);
  }

  // 尺寸变体
  &.size-small {
    min-height: 40px;
    padding: 0 8px;
  }

  &.size-large {
    min-height: 56px;
    padding: 0 16px;
  }

  // 触控优化
  &.touch-optimized {
    min-height: 52px;
    padding: 0 16px;

    &.size-small {
      min-height: 48px;
    }

    &.size-large {
      min-height: 60px;
    }
  }

  .row-cell {
    display: flex;
    align-items: center;
    padding: 8px;
    min-height: 32px;

    &.row-selector {
      flex: none;
      width: 48px;
      justify-content: center;

      checkbox {
        transform: scale(1.1);

        &.checkbox-touch {
          transform: scale(1.3);
        }
      }
    }

    &.row-actions {
      flex: none;
      width: auto;
      justify-content: flex-end;
      min-width: 120px;
    }

    &.align-center {
      justify-content: center;
    }

    &.align-right {
      justify-content: flex-end;
    }

    .cell-content {
      width: 100%;
      display: flex;
      align-items: center;
    }

    // 状态标签
    .status-tag {
      display: inline-flex;
      align-items: center;
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
      white-space: nowrap;

      &.status-success {
        color: var(--color-success);
        background: rgba(var(--color-success-rgb), 0.1);
        border: 1px solid rgba(var(--color-success-rgb), 0.2);
      }

      &.status-warning {
        color: var(--color-warning);
        background: rgba(var(--color-warning-rgb), 0.1);
        border: 1px solid rgba(var(--color-warning-rgb), 0.2);
      }

      &.status-danger {
        color: var(--color-error);
        background: rgba(var(--color-error-rgb), 0.1);
        border: 1px solid rgba(var(--color-error-rgb), 0.2);
      }

      &.status-info {
        color: var(--color-primary);
        background: rgba(var(--color-primary-rgb), 0.1);
        border: 1px solid rgba(var(--color-primary-rgb), 0.2);
      }

      &.status-default {
        color: var(--text-color-secondary);
        background: var(--color-grey-100);
        border: 1px solid var(--border-color-light);
      }
    }

    // 图片显示
    .cell-image {
      width: 32px;
      height: 32px;
      border-radius: 4px;
      border: 1px solid var(--border-color-light);
      object-fit: cover;

      &.image-placeholder {
        background: var(--color-grey-100);
        color: var(--text-color-tertiary);
      }
    }

    // 价格显示
    .cell-price {
      font-weight: 500;
      color: var(--color-primary);
      font-family: 'SF Mono', 'Monaco', 'Menlo', monospace;
    }

    // 日期显示
    .cell-date {
      color: var(--text-color-secondary);
      font-size: 13px;
      font-family: 'SF Mono', 'Monaco', 'Menlo', monospace;
    }

    // 长文本
    .cell-long-text {
      color: var(--text-color-primary);
      cursor: pointer;

      .expand-toggle {
        color: var(--color-primary);
        font-size: 12px;
        margin-left: 4px;

        &:hover {
          text-decoration: underline;
        }
      }

      &.text-expanded {
        white-space: pre-wrap;
        word-break: break-all;
      }
    }

    // 默认文本
    .cell-text {
      color: var(--text-color-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .data-table-row {
    padding: 0 8px;

    .row-cell {
      padding: 4px;

      // 移动端隐藏部分列
      &:nth-child(n + 4):not(.row-actions) {
        display: none;
      }

      &.row-actions {
        min-width: 80px;
      }

      .cell-image {
        width: 28px;
        height: 28px;
      }

      .cell-text {
        font-size: 13px;
      }

      .status-tag {
        font-size: 11px;
        padding: 3px 6px;
      }
    }
  }
}

@media (max-width: 480px) {
  .data-table-row {
    .row-cell {
      // 更小屏幕只显示前两列和操作
      &:nth-child(n + 3):not(.row-actions) {
        display: none;
      }
    }
  }
}

// iPad 优化
@media (min-width: 768px) and (max-width: 1024px) {
  .data-table-row {
    &.touch-optimized {
      .row-cell {
        padding: 10px;

        .cell-image {
          width: 36px;
          height: 36px;
        }
      }
    }
  }
}
</style>
