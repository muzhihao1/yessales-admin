<template>
  <BaseModal :visible="visible" title="日志详情" width="800px" @close="$emit('close')">
    <view v-if="log" class="log-details">
      <!-- Basic information -->
      <view class="details-section">
        <view class="section-header">
          <text class="section-title">基本信息</text>
          <view class="log-level-badge" :class="`level-${log.level}`">
            <view class="level-dot" :style="{ backgroundColor: getLevelColor(log.level) }"></view>
            <text>{{ getLevelText(log.level) }}</text>
          </view>
        </view>

        <view class="details-grid">
          <view class="detail-item">
            <text class="detail-label">时间</text>
            <text class="detail-value">{{ formatFullTime(log.timestamp) }}</text>
          </view>

          <view class="detail-item">
            <text class="detail-label">分类</text>
            <text class="detail-value">{{ getCategoryText(log.category) }}</text>
          </view>

          <view class="detail-item">
            <text class="detail-label">操作</text>
            <text class="detail-value">{{ getActionText(log.action) }}</text>
          </view>

          <view class="detail-item" v-if="log.duration_ms">
            <text class="detail-label">耗时</text>
            <text class="detail-value">{{ log.duration_ms }}ms</text>
          </view>
        </view>
      </view>

      <!-- User information -->
      <view v-if="log.user_id" class="details-section">
        <view class="section-header">
          <text class="section-title">用户信息</text>
        </view>

        <view class="details-grid">
          <view class="detail-item">
            <text class="detail-label">用户名</text>
            <text class="detail-value">{{ log.user_name || log.user_id }}</text>
          </view>

          <view class="detail-item" v-if="log.user_role">
            <text class="detail-label">角色</text>
            <text class="detail-value">{{ getRoleText(log.user_role) }}</text>
          </view>

          <view class="detail-item" v-if="log.ip_address">
            <text class="detail-label">IP地址</text>
            <text class="detail-value">{{ log.ip_address }}</text>
          </view>

          <view class="detail-item" v-if="log.session_id">
            <text class="detail-label">会话ID</text>
            <text class="detail-value code-text">{{ log.session_id }}</text>
          </view>
        </view>
      </view>

      <!-- Resource information -->
      <view v-if="log.resource_type" class="details-section">
        <view class="section-header">
          <text class="section-title">资源信息</text>
        </view>

        <view class="details-grid">
          <view class="detail-item">
            <text class="detail-label">资源类型</text>
            <text class="detail-value">{{ log.resource_type }}</text>
          </view>

          <view class="detail-item" v-if="log.resource_id">
            <text class="detail-label">资源ID</text>
            <text class="detail-value code-text">{{ log.resource_id }}</text>
          </view>

          <view class="detail-item" v-if="log.resource_name">
            <text class="detail-label">资源名</text>
            <text class="detail-value">{{ log.resource_name }}</text>
          </view>
        </view>
      </view>

      <!-- Message -->
      <view class="details-section">
        <view class="section-header">
          <text class="section-title">消息内容</text>
        </view>

        <view class="message-content">
          <text class="message-text">{{ log.message }}</text>
        </view>
      </view>

      <!-- Error information -->
      <view v-if="log.error_code || log.stack_trace" class="details-section">
        <view class="section-header">
          <text class="section-title">错误信息</text>
        </view>

        <view class="details-grid">
          <view v-if="log.error_code" class="detail-item">
            <text class="detail-label">错误代码</text>
            <text class="detail-value error-code">{{ log.error_code }}</text>
          </view>
        </view>

        <view v-if="log.stack_trace" class="stack-trace">
          <text class="stack-label">堆栈跟踪</text>
          <view class="code-block">
            <text class="code-text">{{ log.stack_trace }}</text>
          </view>
        </view>
      </view>

      <!-- Request details -->
      <view v-if="log.request_id || log.correlation_id || log.user_agent" class="details-section">
        <view class="section-header">
          <text class="section-title">请求详情</text>
        </view>

        <view class="details-grid">
          <view v-if="log.request_id" class="detail-item">
            <text class="detail-label">请求ID</text>
            <text class="detail-value code-text">{{ log.request_id }}</text>
          </view>

          <view v-if="log.correlation_id" class="detail-item">
            <text class="detail-label">关联ID</text>
            <text class="detail-value code-text">{{ log.correlation_id }}</text>
          </view>

          <view v-if="log.user_agent" class="detail-item full-width">
            <text class="detail-label">用户代理</text>
            <text class="detail-value">{{ log.user_agent }}</text>
          </view>
        </view>
      </view>

      <!-- Additional details -->
      <view v-if="log.details && Object.keys(log.details).length > 0" class="details-section">
        <view class="section-header">
          <text class="section-title">详细信息</text>
          <button class="toggle-json" @click="showRawJson = !showRawJson">
            <text>{{ showRawJson ? '格式化视图' : 'JSON视图' }}</text>
          </button>
        </view>

        <view v-if="!showRawJson" class="formatted-details">
          <view v-for="(value, key) in log.details" :key="key" class="detail-item">
            <text class="detail-label">{{ formatDetailKey(key) }}</text>
            <text class="detail-value">{{ formatDetailValue(value) }}</text>
          </view>
        </view>

        <view v-else class="json-details">
          <view class="code-block">
            <text class="code-text">{{ JSON.stringify(log.details, null, 2) }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- Actions -->
    <template #footer>
      <view class="modal-actions">
        <!-- Resolution actions for errors -->
        <view v-if="isError && !isResolved" class="error-actions">
          <button class="resolve-btn" @click="handleResolve">
            <text>标记为已处理</text>
          </button>

          <button class="escalate-btn" @click="handleEscalate">
            <text>上报问题</text>
          </button>
        </view>

        <!-- Copy actions -->
        <button class="copy-btn" @click="copyLogDetails">
          <text>复制详情</text>
        </button>

        <!-- Export single log -->
        <button class="export-btn" @click="exportSingleLog">
          <text>导出日志</text>
        </button>

        <!-- Close button -->
        <button class="close-btn" @click="$emit('close')">
          <text>关闭</text>
        </button>
      </view>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import BaseModal from '@/components/common/BaseModal.vue'
import type { LogAction, LogCategory, LogEntry, LogLevel } from '@/types/logs'

// Props and emits
interface Props {
  log: LogEntry | null
  visible: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
  resolve: [log: LogEntry, notes?: string]
}>()

// State
const showRawJson = ref(false)

// Computed properties
const isError = computed(() => props.log?.level === 'error' || props.log?.level === 'critical')

const isResolved = computed(() => props.log?.details?.resolved === true)

// Methods
function getLevelColor(level: LogLevel): string {
  const colors = {
    info: '#3b82f6',
    warn: '#f59e0b',
    error: '#ef4444',
    debug: '#6b7280',
    critical: '#dc2626'
  }
  return colors[level] || '#6b7280'
}

function getLevelText(level: LogLevel): string {
  const texts = {
    info: '信息',
    warn: '警告',
    error: '错误',
    debug: '调试',
    critical: '严重'
  }
  return texts[level] || level
}

function getCategoryText(category: LogCategory): string {
  const texts = {
    auth: '认证',
    user: '用户',
    customer: '客户',
    product: '产品',
    quote: '报价',
    system: '系统',
    security: '安全',
    api: 'API',
    data: '数据',
    export: '导出'
  }
  return texts[category] || category
}

function getActionText(action: LogAction): string {
  const texts = {
    create: '创建',
    read: '查看',
    update: '更新',
    delete: '删除',
    login: '登录',
    logout: '登出',
    register: '注册',
    approve: '批准',
    reject: '拒绝',
    assign: '分配',
    export: '导出',
    import: '导入',
    backup: '备份',
    config_change: '配置变更',
    role_change: '角色变更',
    access_denied: '访问拒绝',
    security_violation: '安全违规'
  }
  return texts[action] || action
}

function getRoleText(role: string): string {
  const texts = {
    admin: '系统管理员',
    sales_manager: '销售经理',
    sales_rep: '销售代表',
    viewer: '查看者'
  }
  return texts[role] || role
}

function formatFullTime(timestamp: string): string {
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short'
  })
}

function formatDetailKey(key: string): string {
  // Convert snake_case to readable text
  return key
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function formatDetailValue(value: any): string {
  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2)
  }
  return String(value)
}

function copyLogDetails() {
  if (!props.log) return

  const details = [
    `时间: ${formatFullTime(props.log.timestamp)}`,
    `级别: ${getLevelText(props.log.level)}`,
    `分类: ${getCategoryText(props.log.category)}`,
    `操作: ${getActionText(props.log.action)}`,
    `用户: ${props.log.user_name || '系统'}`,
    `消息: ${props.log.message}`,
    props.log.resource_name ? `资源: ${props.log.resource_name}` : '',
    props.log.error_code ? `错误代码: ${props.log.error_code}` : '',
    props.log.details ? `详情: ${JSON.stringify(props.log.details, null, 2)}` : ''
  ]
    .filter(Boolean)
    .join('\n')

  // Use clipboard API if available, otherwise show modal with text
  if (navigator.clipboard) {
    navigator.clipboard
      .writeText(details)
      .then(() => {
        console.log('已复制到剪贴板')
        alert('已复制到剪贴板')
      })
      .catch(() => {
        showCopyModal(details)
      })
  } else {
    showCopyModal(details)
  }
}

function showCopyModal(text: string) {
  alert(`复制以下内容:\n${text}`)
}

function exportSingleLog() {
  if (!props.log) return

  const logData = {
    ...props.log,
    exported_at: new Date().toISOString(),
    export_type: 'single_log'
  }

  // Simulate file download
  const filename = `log_${props.log.id}_${new Date().toISOString().split('T')[0]}.json`

  console.log(`已导出: ${filename}`)
  alert(`已导出: ${filename}`)

  console.log('Exported log:', logData)
}

function handleResolve() {
  if (!props.log) return

  const userInput = prompt('处理错误\n请输入处理说明（可选）：', '')
  if (userInput !== null) {
    emit('resolve', props.log!, userInput || undefined)
    console.log('已标记为已处理')
    alert('已标记为已处理')
  }
}

function handleEscalate() {
  if (!props.log) return

  const options = ['发送邮件给管理员', '创建工单', '标记为关键问题']
  const choice = confirm(`选择操作：\n1. ${options[0]}\n2. ${options[1]}\n3. ${options[2]}\n\n点击确定选择第一个选项，取消则跳过`)
  
  if (choice) {
    const actions = ['email', 'ticket', 'critical']
    const action = actions[0] // Default to first option for simplicity
    
    console.log('已发送邮件')
    alert('已发送邮件')
    console.log('Escalated log:', props.log, 'action:', action)
  }
}
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.log-details {
  max-height: 70vh;
  overflow-y: auto;

  .details-section {
    margin-bottom: $spacing-lg;
    border-bottom: 1px solid $border-color;
    padding-bottom: $spacing-md;

    &:last-child {
      border-bottom: none;
      margin-bottom: 0;
      padding-bottom: 0;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: $spacing-md;

      .section-title {
        font-size: $font-size-large;
        font-weight: 600;
        color: $text-color;
      }

      .log-level-badge {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 4px 10px;
        border-radius: $border-radius-lg;
        font-size: $font-size-small;
        font-weight: 500;

        &.level-info {
          background: rgba($info-color, 0.1);
          color: $info-color;
        }

        &.level-warn {
          background: rgba($warning-color, 0.1);
          color: $warning-color;
        }

        &.level-error {
          background: rgba($danger-color, 0.1);
          color: $danger-color;
        }

        &.level-critical {
          background: rgba($danger-color, 0.2);
          color: $danger-dark;
        }

        &.level-debug {
          background: rgba($text-color-secondary, 0.1);
          color: $text-color-secondary;
        }

        .level-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
      }

      .toggle-json {
        padding: 4px 8px;
        border: 1px solid $border-color;
        border-radius: $border-radius-sm;
        background: $bg-color;
        color: $text-color-secondary;
        font-size: $font-size-small;
        cursor: pointer;

        &:hover {
          background: $bg-color-white;
        }
      }
    }

    .details-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: $spacing-md;

      .detail-item {
        display: flex;
        flex-direction: column;
        gap: $spacing-xs;

        &.full-width {
          grid-column: 1 / -1;
        }

        .detail-label {
          font-size: $font-size-small;
          font-weight: 500;
          color: $text-color-secondary;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .detail-value {
          font-size: $font-size-medium;
          color: $text-color;
          word-break: break-word;

          &.code-text {
            font-family: 'Monaco', 'Consolas', monospace;
            background: $bg-color;
            padding: 2px 6px;
            border-radius: $border-radius-sm;
            font-size: $font-size-small;
          }

          &.error-code {
            color: $danger-color;
            font-weight: 500;
            font-family: 'Monaco', 'Consolas', monospace;
          }
        }
      }
    }

    .message-content {
      padding: $spacing-md;
      background: $bg-color;
      border-radius: $border-radius-base;
      border-left: 4px solid $primary-color;

      .message-text {
        font-size: $font-size-medium;
        color: $text-color;
        line-height: 1.5;
        word-break: break-word;
      }
    }

    .stack-trace {
      margin-top: $spacing-md;

      .stack-label {
        display: block;
        font-size: $font-size-small;
        font-weight: 500;
        color: $text-color-secondary;
        margin-bottom: $spacing-xs;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
    }

    .code-block {
      background: #f8f9fa;
      border: 1px solid $border-color;
      border-radius: $border-radius-base;
      padding: $spacing-md;
      overflow-x: auto;

      .code-text {
        font-family: 'Monaco', 'Consolas', monospace;
        font-size: $font-size-small;
        color: $text-color;
        line-height: 1.4;
        white-space: pre-wrap;
      }
    }

    .formatted-details {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: $spacing-md;
    }

    .json-details {
      margin-top: $spacing-sm;
    }
  }
}

.modal-actions {
  display: flex;
  gap: $spacing-sm;
  align-items: center;

  .error-actions {
    display: flex;
    gap: $spacing-sm;
    margin-right: auto;

    .resolve-btn,
    .escalate-btn {
      padding: 6px 12px;
      border-radius: $border-radius-sm;
      font-size: $font-size-small;
      cursor: pointer;
    }

    .resolve-btn {
      background: $success-color;
      color: white;
      border: 1px solid $success-color;

      &:hover {
        background: darken($success-color, 10%);
      }
    }

    .escalate-btn {
      background: $warning-color;
      color: white;
      border: 1px solid $warning-color;

      &:hover {
        background: darken($warning-color, 10%);
      }
    }
  }

  .copy-btn,
  .export-btn,
  .close-btn {
    padding: 8px 16px;
    border-radius: $border-radius-sm;
    font-size: $font-size-small;
    cursor: pointer;
  }

  .copy-btn,
  .export-btn {
    background: $bg-color;
    color: $text-color;
    border: 1px solid $border-color;

    &:hover {
      background: $bg-color-white;
    }
  }

  .close-btn {
    background: $primary-color;
    color: white;
    border: 1px solid $primary-color;

    &:hover {
      background: darken($primary-color, 10%);
    }
  }
}

// Responsive design
@media (max-width: 768px) {
  .log-details {
    max-height: 60vh;

    .details-section {
      .details-grid {
        grid-template-columns: 1fr;
      }

      .section-header {
        flex-direction: column;
        align-items: stretch;
        gap: $spacing-sm;
      }
    }
  }

  .modal-actions {
    flex-direction: column;

    .error-actions {
      margin-right: 0;
      width: 100%;
      justify-content: center;
    }
  }
}
</style>
