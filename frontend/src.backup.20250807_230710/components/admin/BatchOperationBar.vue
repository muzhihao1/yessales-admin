<template>
  <transition name="batch-bar">
    <view v-if="selectedCount > 0" class="batch-operation-bar">
      <view class="batch-info">
        <checkbox
          :checked="selectAllChecked"
          :indeterminate="selectAllIndeterminate"
          @change="handleSelectAllChange"
          class="batch-select-all"
        />
        <text class="selection-text">
          已选择 <text class="selection-count">{{ selectedCount }}</text> 项
        </text>
        <button class="clear-selection" @click="handleClearSelection">
          <uni-icons type="close" size="14" />
          <text>清空</text>
        </button>
      </view>

      <view class="batch-operations">
        <template v-for="operation in availableOperations" :key="operation.key">
          <button
            class="operation-btn"
            :class="[
              `btn-${operation.type || 'default'}`,
              { 'btn-loading': loadingOperations.has(operation.key) }
            ]"
            :disabled="operation.disabled || loadingOperations.has(operation.key)"
            @click="handleOperationClick(operation)"
          >
            <uni-icons
              v-if="operation.icon && !loadingOperations.has(operation.key)"
              :type="operation.icon"
              size="16"
            />
            <view v-if="loadingOperations.has(operation.key)" class="loading-spinner">
              <uni-icons type="spinner-cycle" size="16" />
            </view>
            <text class="btn-text">{{ operation.label }}</text>
            <view v-if="showProgress && operation.progress !== undefined" class="progress-badge">
              {{ operation.progress }}%
            </view>
          </button>
        </template>
      </view>

      <!-- 进度条 -->
      <view v-if="showProgress && currentProgress > 0" class="progress-container">
        <view class="progress-bar">
          <view class="progress-fill" :style="{ width: currentProgress + '%' }"></view>
        </view>
        <text class="progress-text">{{ progressText }}</text>
      </view>
    </view>
  </transition>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { showModal, showToast } from '@/utils/ui'

/**
 * 批量操作栏组件
 *
 * 功能说明：
 * - 当有项目被选中时显示批量操作栏
 * - 支持全选/取消全选功能
 * - 提供批量删除、导出、状态修改等常用操作
 * - 显示操作进度和反馈
 * - 符合PRD的二次确认要求
 *
 * PRD要求对应：
 * - 支持快捷键和批量操作，提升效率 (PRD Line 187)
 * - 重要操作需二次确认，防止误操作 (PRD Line 181)
 * - 批量导入产品信息 (PRD Line 173)
 * - 数据导出功能 (PRD Line 97)
 * - 操作成功气泡提示 (PRD Line 845)
 *
 * @author Terminal 3 (Admin Frontend Team)
 */

export interface BatchOperation {
  key: string
  label: string
  icon?: string
  type?: 'default' | 'primary' | 'success' | 'warning' | 'danger'
  disabled?: boolean
  hidden?: boolean
  requiresConfirmation?: boolean
  confirmMessage?: string
  confirmTitle?: string
  progress?: number
  permission?: string
}

interface Props {
  /** 选中的项目数量 */
  selectedCount: number
  /** 批量操作配置 */
  operations: BatchOperation[]
  /** 是否显示进度条 */
  showProgress?: boolean
  /** 当前进度（0-100） */
  currentProgress?: number
  /** 进度描述文字 */
  progressText?: string
  /** 全选状态 */
  selectAllChecked?: boolean
  /** 全选中间状态 */
  selectAllIndeterminate?: boolean
  /** 最大宽度（超出显示横向滚动） */
  maxWidth?: string
}

const props = withDefaults(defineProps<Props>(), {
  selectedCount: 0,
  operations: () => [],
  showProgress: false,
  currentProgress: 0,
  progressText: '',
  selectAllChecked: false,
  selectAllIndeterminate: false,
  maxWidth: '100%'
})

const emit = defineEmits<{
  operation: [operationKey: string, selectedCount: number]
  clearSelection: []
  selectAll: [checked: boolean]
}>()

// 正在加载的操作
const loadingOperations = ref<Set<string>>(new Set())

// 过滤可用的操作
const availableOperations = computed(() => {
  return props.operations.filter(op => {
    if (op.hidden) return false
    // 这里可以添加权限检查
    // if (op.permission && !hasPermission(op.permission)) return false
    return true
  })
})

// 处理操作点击
const handleOperationClick = async (operation: BatchOperation) => {
  if (operation.disabled || loadingOperations.value.has(operation.key)) return

  try {
    // 需要确认的操作
    if (operation.requiresConfirmation) {
      const title = operation.confirmTitle || '确认批量操作'
      const message =
        operation.confirmMessage ||
        `确定要对选中的 ${props.selectedCount} 个项目执行"${operation.label}"操作吗？`

      const result = await showModal({
        title,
        content: message,
        showCancel: true,
        confirmColor: operation.type === 'danger' ? '#e53e3e' : '#007aff'
      })

      if (!result.confirm) return
    }

    // 设置加载状态
    loadingOperations.value.add(operation.key)

    // 触发操作事件
    emit('operation', operation.key, props.selectedCount)

    // 显示开始提示
    if (props.selectedCount > 1) {
      showToast(`开始${operation.label} ${props.selectedCount} 个项目...`)
    }
  } catch (error) {
    console.error('批量操作失败:', error)
    showToast(`${operation.label}失败`, 'error')
  }
}

// 清除操作加载状态
const clearOperationLoading = (operationKey: string) => {
  loadingOperations.value.delete(operationKey)
}

// 清除所有加载状态
const clearAllLoading = () => {
  loadingOperations.value.clear()
}

// 处理全选变化
const handleSelectAllChange = (event: any) => {
  emit('selectAll', event.detail.value)
}

// 处理清空选择
const handleClearSelection = () => {
  emit('clearSelection')
}

// 监听进度变化，完成时清除加载状态
watch(
  () => props.currentProgress,
  (newProgress, oldProgress) => {
    if (oldProgress > 0 && newProgress === 0) {
      // 进度完成，清除所有加载状态
      setTimeout(() => {
        clearAllLoading()
      }, 500)
    }
  }
)

// 暴露方法供父组件调用
defineExpose({
  clearOperationLoading,
  clearAllLoading
})

// 预定义的常用批量操作（符合PRD要求）
export const commonBatchOperations: Record<string, BatchOperation[]> = {
  // 报价单管理批量操作
  quotes: [
    {
      key: 'export',
      label: '批量导出',
      icon: 'download',
      type: 'primary',
      requiresConfirmation: false
    },
    {
      key: 'audit',
      label: '批量审核',
      icon: 'checkmarkempty',
      type: 'success',
      requiresConfirmation: true,
      confirmMessage: '确定要批量审核选中的报价单吗？'
    },
    {
      key: 'delete',
      label: '批量删除',
      icon: 'trash',
      type: 'danger',
      requiresConfirmation: true,
      confirmMessage: '确定要删除选中的报价单吗？此操作不可撤销。'
    }
  ],

  // 产品管理批量操作 (PRD Line 855: 批量导入)
  products: [
    {
      key: 'export',
      label: '批量导出',
      icon: 'download',
      type: 'default',
      requiresConfirmation: false
    },
    {
      key: 'enable',
      label: '批量启用',
      icon: 'checkmarkempty',
      type: 'success',
      requiresConfirmation: false
    },
    {
      key: 'disable',
      label: '批量停用',
      icon: 'close',
      type: 'warning',
      requiresConfirmation: true,
      confirmMessage: '确定要停用选中的产品吗？'
    },
    {
      key: 'delete',
      label: '批量删除',
      icon: 'trash',
      type: 'danger',
      requiresConfirmation: true,
      confirmMessage: '确定要删除选中的产品吗？此操作不可撤销。'
    }
  ],

  // 客户管理批量操作 (PRD Line 883: 导出)
  customers: [
    {
      key: 'export',
      label: '批量导出',
      icon: 'download',
      type: 'primary',
      requiresConfirmation: false
    }
  ],

  // 用户管理批量操作
  users: [
    {
      key: 'export',
      label: '批量导出',
      icon: 'download',
      type: 'default',
      requiresConfirmation: false
    },
    {
      key: 'enable',
      label: '批量启用',
      icon: 'checkmarkempty',
      type: 'success',
      requiresConfirmation: false
    },
    {
      key: 'disable',
      label: '批量禁用',
      icon: 'close',
      type: 'warning',
      requiresConfirmation: true,
      confirmMessage: '确定要禁用选中的用户账号吗？'
    }
  ]
}
</script>

<style lang="scss" scoped>
.batch-operation-bar {
  position: sticky;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--color-primary);
  color: #fff;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
  z-index: 100;
  border-radius: 8px 8px 0 0;

  .batch-info {
    display: flex;
    align-items: center;
    gap: 12px;

    .batch-select-all {
      transform: scale(1.1);
    }

    .selection-text {
      font-size: 14px;
      color: rgba(255, 255, 255, 0.9);

      .selection-count {
        font-weight: 600;
        color: #fff;
        margin: 0 2px;
      }
    }

    .clear-selection {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 4px 8px;
      background: rgba(255, 255, 255, 0.2);
      border: none;
      border-radius: 4px;
      color: #fff;
      font-size: 12px;
      cursor: pointer;
      transition: background-color 0.2s;

      &:hover {
        background: rgba(255, 255, 255, 0.3);
      }
    }
  }

  .batch-operations {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;

    .operation-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 12px;
      border: 1px solid rgba(255, 255, 255, 0.3);
      border-radius: 6px;
      background: rgba(255, 255, 255, 0.1);
      color: #fff;
      font-size: 13px;
      cursor: pointer;
      transition: all 0.2s;
      white-space: nowrap;

      &:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.2);
        transform: translateY(-1px);
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      &.btn-loading {
        pointer-events: none;

        .loading-spinner {
          animation: spin 1s linear infinite;
        }
      }

      // 按钮类型变体（在深色背景上的调整）
      &.btn-success {
        border-color: var(--color-success);
        background: rgba(var(--color-success-rgb), 0.2);

        &:hover:not(:disabled) {
          background: rgba(var(--color-success-rgb), 0.3);
        }
      }

      &.btn-warning {
        border-color: var(--color-warning);
        background: rgba(var(--color-warning-rgb), 0.2);

        &:hover:not(:disabled) {
          background: rgba(var(--color-warning-rgb), 0.3);
        }
      }

      &.btn-danger {
        border-color: var(--color-error);
        background: rgba(var(--color-error-rgb), 0.2);

        &:hover:not(:disabled) {
          background: rgba(var(--color-error-rgb), 0.3);
        }
      }

      .btn-text {
        font-weight: 500;
      }

      .progress-badge {
        margin-left: 4px;
        padding: 2px 6px;
        background: rgba(255, 255, 255, 0.3);
        border-radius: 10px;
        font-size: 11px;
        font-weight: 600;
      }
    }
  }

  .progress-container {
    position: absolute;
    top: -4px;
    left: 0;
    right: 0;

    .progress-bar {
      height: 4px;
      background: rgba(255, 255, 255, 0.3);
      border-radius: 2px;
      overflow: hidden;

      .progress-fill {
        height: 100%;
        background: #fff;
        border-radius: 2px;
        transition: width 0.3s ease;
      }
    }

    .progress-text {
      position: absolute;
      top: 8px;
      right: 16px;
      font-size: 12px;
      color: rgba(255, 255, 255, 0.9);
    }
  }
}

// 动画
.batch-bar-enter-active,
.batch-bar-leave-active {
  transition: all 0.3s ease;
}

.batch-bar-enter-from {
  transform: translateY(100%);
  opacity: 0;
}

.batch-bar-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

// 响应式设计
@media (max-width: 768px) {
  .batch-operation-bar {
    flex-direction: column;
    gap: 8px;
    padding: 12px;

    .batch-info {
      width: 100%;
      justify-content: space-between;
    }

    .batch-operations {
      width: 100%;
      justify-content: center;
      overflow-x: auto;

      .operation-btn {
        padding: 10px 16px;
        min-width: 100px;
        justify-content: center;
      }
    }

    .progress-container .progress-text {
      top: 12px;
      right: 12px;
    }
  }
}

@media (max-width: 480px) {
  .batch-operation-bar {
    .batch-operations {
      .operation-btn {
        padding: 8px 12px;
        min-width: 80px;
        font-size: 12px;
      }
    }
  }
}

// iPad 优化
@media (min-width: 768px) and (max-width: 1024px) {
  .batch-operation-bar {
    padding: 14px 20px;

    .batch-operations .operation-btn {
      padding: 10px 16px;
      font-size: 14px;
    }
  }
}
</style>
