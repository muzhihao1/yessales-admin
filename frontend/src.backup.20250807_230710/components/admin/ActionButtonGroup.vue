<template>
  <view class="action-button-group" :class="[
    `direction-${direction}`,
    `size-${size}`,
    { 'touch-optimized': touchOptimized }
  ]">
    <template v-for="action in visibleActions" :key="action.key">
      <!-- 普通按钮 -->
      <button
        v-if="!action.dropdown"
        class="action-btn"
        :class="[
          `btn-${action.type || 'default'}`,
          { 'btn-loading': action.loading, 'btn-disabled': action.disabled }
        ]"
        :disabled="action.disabled || action.loading"
        @click="handleActionClick(action)"
      >
        <uni-icons 
          v-if="action.icon" 
          :type="action.icon" 
          :size="getIconSize()"
          :color="getIconColor(action)"
        />
        <text v-if="showText" class="btn-text">{{ action.label }}</text>
        <view v-if="action.loading" class="loading-indicator">
          <uni-icons type="spinner-cycle" :size="getIconSize()" />
        </view>
      </button>

      <!-- 下拉菜单按钮 -->
      <view v-else class="dropdown-wrapper" :class="{ 'dropdown-open': dropdownOpen === action.key }">
        <button
          class="action-btn btn-dropdown"
          :class="`btn-${action.type || 'default'}`"
          @click="toggleDropdown(action.key)"
        >
          <uni-icons 
            v-if="action.icon" 
            :type="action.icon" 
            :size="getIconSize()"
            :color="getIconColor(action)"
          />
          <text v-if="showText" class="btn-text">{{ action.label }}</text>
          <uni-icons 
            type="down" 
            :size="12" 
            class="dropdown-arrow"
            :class="{ 'arrow-up': dropdownOpen === action.key }"
          />
        </button>
        
        <view v-if="dropdownOpen === action.key" class="dropdown-menu">
          <view
            v-for="subAction in action.dropdown"
            :key="subAction.key"
            class="dropdown-item"
            :class="`item-${subAction.type || 'default'}`"
            @click="handleActionClick(subAction)"
          >
            <uni-icons 
              v-if="subAction.icon" 
              :type="subAction.icon" 
              :size="16"
              :color="getIconColor(subAction)"
            />
            <text class="item-text">{{ subAction.label }}</text>
          </view>
        </view>
      </view>
    </template>

    <!-- 更多操作按钮 -->
    <view v-if="hasMoreActions" class="more-actions" :class="{ 'more-open': moreActionsOpen }">
      <button class="action-btn btn-more" @click="toggleMoreActions">
        <uni-icons type="more-filled" :size="getIconSize()" />
      </button>
      
      <view v-if="moreActionsOpen" class="more-menu">
        <view
          v-for="action in hiddenActions"
          :key="action.key"
          class="more-item"
          :class="`item-${action.type || 'default'}`"
          @click="handleActionClick(action)"
        >
          <uni-icons 
            v-if="action.icon" 
            :type="action.icon" 
            :size="16"
            :color="getIconColor(action)"
          />
          <text class="item-text">{{ action.label }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { showModal } from '@/utils/ui'

/**
 * 操作按钮组组件
 * 
 * 功能说明：
 * - 为数据表格行提供标准化的操作按钮
 * - 支持不同类型的操作（查看、编辑、删除、审核等）
 * - 自动适配iPad和移动端的触控优化
 * - 支持确认对话框和权限控制
 * - 符合PRD要求的二次确认机制
 * 
 * PRD要求对应：
 * - 报价单管理：[审核][修改][删除][查看详情] (PRD Line 829)
 * - 产品管理：[新增][批量导入][图片管理] (PRD Line 855)
 * - 客户管理：[查看][导出] (PRD Line 883)
 * - 重要操作需二次确认 (PRD Line 181, 833)
 * - iPad适配优化 (PRD Line 111, 179)
 * 
 * @author Terminal 3 (Admin Frontend Team)
 */

export interface ActionItem {
  key: string
  label: string
  icon?: string
  type?: 'default' | 'primary' | 'success' | 'warning' | 'danger'
  disabled?: boolean
  loading?: boolean
  hidden?: boolean
  requiresConfirmation?: boolean
  confirmMessage?: string
  confirmTitle?: string
  permission?: string
  dropdown?: ActionItem[]
}

interface Props {
  /** 操作项列表 */
  actions: ActionItem[]
  /** 数据项（用于权限检查和确认信息） */
  item?: Record<string, any>
  /** 按钮尺寸 */
  size?: 'small' | 'medium' | 'large'
  /** 排列方向 */
  direction?: 'horizontal' | 'vertical'
  /** 最大可见按钮数（超出显示更多按钮） */
  maxVisible?: number
  /** 是否显示文字 */
  showText?: boolean
  /** 是否启用触控优化（iPad/移动端） */
  touchOptimized?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  actions: () => [],
  size: 'medium',
  direction: 'horizontal',
  maxVisible: 4,
  showText: false,
  touchOptimized: true
})

const emit = defineEmits<{
  action: [actionKey: string, item?: Record<string, any>]
}>()

// 响应式状态
const dropdownOpen = ref<string | null>(null)
const moreActionsOpen = ref(false)

// 过滤可见的操作
const availableActions = computed(() => {
  return props.actions.filter(action => {
    if (action.hidden) return false
    // 这里可以添加权限检查逻辑
    // if (action.permission && !checkPermission(action.permission)) return false
    return true
  })
})

// 可见的操作按钮
const visibleActions = computed(() => {
  if (props.maxVisible <= 0) return availableActions.value
  return availableActions.value.slice(0, props.maxVisible)
})

// 隐藏的操作（显示在更多菜单中）
const hiddenActions = computed(() => {
  if (props.maxVisible <= 0) return []
  return availableActions.value.slice(props.maxVisible)
})

// 是否有更多操作
const hasMoreActions = computed(() => hiddenActions.value.length > 0)

// 获取图标尺寸
const getIconSize = () => {
  const sizeMap = { small: 14, medium: 16, large: 18 }
  return sizeMap[props.size]
}

// 获取图标颜色
const getIconColor = (action: ActionItem) => {
  if (action.disabled) return 'var(--text-color-disabled)'
  
  const colorMap: Record<string, string> = {
    default: 'var(--text-color-secondary)',
    primary: 'var(--color-primary)',
    success: 'var(--color-success)',
    warning: 'var(--color-warning)',
    danger: 'var(--color-error)'
  }
  
  return colorMap[action.type || 'default']
}

// 处理操作点击
const handleActionClick = async (action: ActionItem) => {
  if (action.disabled || action.loading) return

  try {
    // 需要确认的操作
    if (action.requiresConfirmation) {
      const title = action.confirmTitle || '确认操作'
      const content = action.confirmMessage || `确定要执行"${action.label}"操作吗？`
      
      const result = await showModal({
        title,
        content,
        showCancel: true,
        confirmColor: action.type === 'danger' ? '#e53e3e' : '#007aff'
      })

      if (!result.confirm) return
    }

    // 关闭所有弹出菜单
    dropdownOpen.value = null
    moreActionsOpen.value = false

    // 触发操作事件
    emit('action', action.key, props.item)
  } catch (error) {
    console.error('操作执行失败:', error)
  }
}

// 切换下拉菜单
const toggleDropdown = (key: string) => {
  dropdownOpen.value = dropdownOpen.value === key ? null : key
  moreActionsOpen.value = false
}

// 切换更多操作菜单
const toggleMoreActions = () => {
  moreActionsOpen.value = !moreActionsOpen.value
  dropdownOpen.value = null
}

// 点击外部关闭菜单
const handleClickOutside = (event: Event) => {
  const target = event.target as HTMLElement
  if (!target.closest('.action-button-group')) {
    dropdownOpen.value = null
    moreActionsOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

// 预定义的常用操作配置（符合PRD要求）
export const commonActions = {
  // 报价单管理操作 (PRD Line 829)
  quotes: {
    view: { key: 'view', label: '查看详情', icon: 'eye', type: 'default' as const },
    audit: { key: 'audit', label: '审核', icon: 'checkmarkempty', type: 'primary' as const, requiresConfirmation: true },
    edit: { key: 'edit', label: '修改', icon: 'compose', type: 'default' as const },
    delete: { key: 'delete', label: '删除', icon: 'trash', type: 'danger' as const, requiresConfirmation: true, confirmMessage: '确定要删除这个报价单吗？此操作不可撤销。' }
  },
  
  // 产品管理操作 (PRD Line 855)
  products: {
    view: { key: 'view', label: '查看', icon: 'eye', type: 'default' as const },
    edit: { key: 'edit', label: '编辑', icon: 'compose', type: 'default' as const },
    images: { key: 'images', label: '图片管理', icon: 'image', type: 'default' as const },
    delete: { key: 'delete', label: '删除', icon: 'trash', type: 'danger' as const, requiresConfirmation: true }
  },
  
  // 客户管理操作 (PRD Line 883)
  customers: {
    view: { key: 'view', label: '查看', icon: 'eye', type: 'default' as const },
    export: { key: 'export', label: '导出', icon: 'download', type: 'default' as const }
  },
  
  // 销售人员管理操作 (PRD Line 903)
  users: {
    edit: { key: 'edit', label: '编辑', icon: 'compose', type: 'default' as const },
    disable: { key: 'disable', label: '禁用', icon: 'close', type: 'warning' as const, requiresConfirmation: true },
    resetPassword: { key: 'resetPassword', label: '重置密码', icon: 'refreshempty', type: 'default' as const, requiresConfirmation: true }
  }
}
</script>

<style lang="scss" scoped>
.action-button-group {
  display: flex;
  align-items: center;
  gap: 4px;
  
  &.direction-vertical {
    flex-direction: column;
    align-items: stretch;
  }
  
  &.direction-horizontal {
    flex-direction: row;
    align-items: center;
  }
  
  .action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
    position: relative;
    background: transparent;
    
    &:hover:not(.btn-disabled) {
      transform: translateY(-1px);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    
    &:active:not(.btn-disabled) {
      transform: translateY(0);
    }
    
    &.btn-loading {
      pointer-events: none;
      opacity: 0.7;
    }
    
    &.btn-disabled {
      opacity: 0.4;
      cursor: not-allowed;
      pointer-events: none;
    }
    
    .btn-text {
      font-size: 12px;
      white-space: nowrap;
    }
    
    .loading-indicator {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      animation: spin 1s linear infinite;
    }
  }
  
  // 按钮类型样式
  .btn-default {
    color: var(--text-color-secondary);
    border: 1px solid var(--border-color-light);
    background: #fff;
    
    &:hover:not(.btn-disabled) {
      color: var(--text-color-primary);
      border-color: var(--border-color);
      background: var(--color-grey-25);
    }
  }
  
  .btn-primary {
    color: var(--color-primary);
    border: 1px solid var(--color-primary);
    background: rgba(var(--color-primary-rgb), 0.1);
    
    &:hover:not(.btn-disabled) {
      background: rgba(var(--color-primary-rgb), 0.2);
    }
  }
  
  .btn-success {
    color: var(--color-success);
    border: 1px solid var(--color-success);
    background: rgba(var(--color-success-rgb), 0.1);
    
    &:hover:not(.btn-disabled) {
      background: rgba(var(--color-success-rgb), 0.2);
    }
  }
  
  .btn-warning {
    color: var(--color-warning);
    border: 1px solid var(--color-warning);
    background: rgba(var(--color-warning-rgb), 0.1);
    
    &:hover:not(.btn-disabled) {
      background: rgba(var(--color-warning-rgb), 0.2);
    }
  }
  
  .btn-danger {
    color: var(--color-error);
    border: 1px solid var(--color-error);
    background: rgba(var(--color-error-rgb), 0.1);
    
    &:hover:not(.btn-disabled) {
      background: rgba(var(--color-error-rgb), 0.2);
    }
  }
  
  // 尺寸变体
  &.size-small .action-btn {
    min-width: 28px;
    height: 28px;
    padding: 4px 6px;
    
    .btn-text {
      font-size: 11px;
    }
  }
  
  &.size-medium .action-btn {
    min-width: 32px;
    height: 32px;
    padding: 6px 8px;
    
    .btn-text {
      font-size: 12px;
    }
  }
  
  &.size-large .action-btn {
    min-width: 36px;
    height: 36px;
    padding: 8px 10px;
    
    .btn-text {
      font-size: 13px;
    }
  }
  
  // 触控优化（iPad/移动端）
  &.touch-optimized {
    gap: 8px;
    
    .action-btn {
      min-width: 44px;
      height: 44px;
      padding: 10px 12px;
      border-radius: 6px;
      
      .btn-text {
        font-size: 14px;
      }
    }
    
    &.size-small .action-btn {
      min-width: 40px;
      height: 40px;
      padding: 8px 10px;
    }
  }
  
  // 下拉菜单
  .dropdown-wrapper {
    position: relative;
    
    .btn-dropdown {
      .dropdown-arrow {
        margin-left: 4px;
        transition: transform 0.2s;
        
        &.arrow-up {
          transform: rotate(180deg);
        }
      }
    }
    
    .dropdown-menu {
      position: absolute;
      top: 100%;
      right: 0;
      min-width: 120px;
      background: #fff;
      border: 1px solid var(--border-color-light);
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      z-index: 1000;
      overflow: hidden;
      
      .dropdown-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 12px;
        cursor: pointer;
        transition: background-color 0.2s;
        
        &:hover {
          background: var(--color-grey-50);
        }
        
        .item-text {
          font-size: 13px;
          color: var(--text-color-primary);
        }
        
        &.item-danger .item-text {
          color: var(--color-error);
        }
      }
    }
  }
  
  // 更多操作菜单
  .more-actions {
    position: relative;
    
    .btn-more {
      color: var(--text-color-tertiary);
      border: 1px solid var(--border-color-light);
      background: #fff;
      
      &:hover {
        color: var(--text-color-secondary);
        background: var(--color-grey-25);
      }
    }
    
    .more-menu {
      position: absolute;
      top: 100%;
      right: 0;
      min-width: 140px;
      background: #fff;
      border: 1px solid var(--border-color-light);
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      z-index: 1000;
      overflow: hidden;
      
      .more-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 12px;
        cursor: pointer;
        transition: background-color 0.2s;
        
        &:hover {
          background: var(--color-grey-50);
        }
        
        .item-text {
          font-size: 13px;
          color: var(--text-color-primary);
        }
        
        &.item-danger .item-text {
          color: var(--color-error);
        }
      }
    }
  }
}

// 动画
@keyframes spin {
  from {
    transform: translate(-50%, -50%) rotate(0deg);
  }
  to {
    transform: translate(-50%, -50%) rotate(360deg);
  }
}

// 响应式设计 - iPad 优化
@media (min-width: 768px) and (max-width: 1024px) {
  .action-button-group {
    &:not(.touch-optimized) {
      gap: 6px;
      
      .action-btn {
        min-width: 38px;
        height: 38px;
        padding: 8px 10px;
      }
    }
  }
}

// 手机端优化
@media (max-width: 767px) {
  .action-button-group {
    &.direction-horizontal {
      flex-wrap: wrap;
    }
    
    .action-btn {
      min-width: 36px;
      height: 36px;
      padding: 6px 8px;
      
      .btn-text {
        display: none; // 手机端隐藏文字，只显示图标
      }
    }
    
    .dropdown-menu,
    .more-menu {
      right: auto;
      left: 0;
      min-width: 100px;
      
      .dropdown-item,
      .more-item {
        padding: 12px 10px; // 增加触控区域
      }
    }
  }
}
</style>