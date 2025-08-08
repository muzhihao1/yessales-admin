/**
 * Operations Log Store
 *
 * Manages system operation logs, audit trails, and security events.
 * Provides centralized access to log data with filtering, search, and export capabilities.
 */

import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type {
  LogAction,
  LogCategory,
  LogEntry,
  LogExportOptions,
  LogFilter,
  LogLevel,
  LogSearchResult,
  LogStatistics,
  SecurityEvent,
  SystemEvent
} from '@/types/logs'

export const useLogsStore = defineStore('logs', () => {
  // State
  const logs = ref<LogEntry[]>([])
  const securityEvents = ref<SecurityEvent[]>([])
  const systemEvents = ref<SystemEvent[]>([])
  const currentFilter = ref<LogFilter>({})
  const searchResult = ref<LogSearchResult | null>(null)
  const statistics = ref<LogStatistics | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Pagination state
  const currentPage = ref(1)
  const pageSize = ref(50)
  const totalEntries = ref(0)

  // Real-time updates
  const autoRefresh = ref(false)
  const refreshInterval = ref(30000) // 30 seconds

  // Computed properties
  const hasLogs = computed(() => logs.value.length > 0)
  const totalPages = computed(() => Math.ceil(totalEntries.value / pageSize.value))
  const hasPreviousPage = computed(() => currentPage.value > 1)
  const hasNextPage = computed(() => currentPage.value < totalPages.value)

  const filteredLogs = computed(() => {
    if (!currentFilter.value || Object.keys(currentFilter.value).length === 0) {
      return logs.value
    }

    return logs.value.filter(log => {
      // Filter by log level
      if (currentFilter.value.level?.length && !currentFilter.value.level.includes(log.level)) {
        return false
      }

      // Filter by category
      if (
        currentFilter.value.category?.length &&
        !currentFilter.value.category.includes(log.category)
      ) {
        return false
      }

      // Filter by action
      if (currentFilter.value.action?.length && !currentFilter.value.action.includes(log.action)) {
        return false
      }

      // Filter by user
      if (currentFilter.value.user_id && log.user_id !== currentFilter.value.user_id) {
        return false
      }

      // Filter by resource type
      if (
        currentFilter.value.resource_type &&
        log.resource_type !== currentFilter.value.resource_type
      ) {
        return false
      }

      // Filter by date range
      if (currentFilter.value.date_from && log.timestamp < currentFilter.value.date_from) {
        return false
      }

      if (currentFilter.value.date_to && log.timestamp > currentFilter.value.date_to) {
        return false
      }

      // Search in message and details
      if (currentFilter.value.search) {
        const searchTerm = currentFilter.value.search.toLowerCase()
        const searchableText = [
          log.message,
          log.user_name,
          log.resource_name,
          JSON.stringify(log.details || {})
        ]
          .join(' ')
          .toLowerCase()

        if (!searchableText.includes(searchTerm)) {
          return false
        }
      }

      return true
    })
  })

  const criticalEvents = computed(() =>
    logs.value.filter(log => log.level === 'critical' || log.level === 'error')
  )

  const recentActivity = computed(() =>
    logs.value
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10)
  )

  // Actions
  async function fetchLogs(filters?: LogFilter) {
    loading.value = true
    error.value = null

    try {
      // Update current filter
      if (filters) {
        currentFilter.value = { ...filters }
      }

      // Mock API call - replace with actual API integration
      const mockLogs: LogEntry[] = [
        {
          id: '1',
          timestamp: new Date().toISOString(),
          level: 'info',
          category: 'auth',
          action: 'login',
          user_id: 'user123',
          user_name: '张三',
          user_role: 'sales_manager',
          ip_address: '192.168.1.100',
          session_id: 'sess_123',
          message: '用户成功登录系统',
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          timestamp: new Date(Date.now() - 300000).toISOString(),
          level: 'warn',
          category: 'security',
          action: 'access_denied',
          user_id: 'user456',
          user_name: '李四',
          user_role: 'sales_rep',
          resource_type: 'user',
          resource_id: 'user789',
          ip_address: '192.168.1.101',
          message: '用户尝试访问权限不足的资源',
          details: { attempted_resource: '/admin/users/delete', required_role: 'admin' },
          created_at: new Date(Date.now() - 300000).toISOString()
        }
      ]

      logs.value = mockLogs
      totalEntries.value = mockLogs.length

      // Create search result
      searchResult.value = {
        entries: filteredLogs.value.slice(
          (currentPage.value - 1) * pageSize.value,
          currentPage.value * pageSize.value
        ),
        total: filteredLogs.value.length,
        page: currentPage.value,
        per_page: pageSize.value,
        has_next: hasNextPage.value,
        has_previous: hasPreviousPage.value
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取日志失败'
      console.error('Failed to fetch logs:', err)
    } finally {
      loading.value = false
    }
  }

  async function fetchStatistics() {
    loading.value = true
    error.value = null

    try {
      // Mock statistics - replace with actual API integration
      statistics.value = {
        total_entries: 1250,
        entries_by_level: {
          info: 800,
          warn: 300,
          error: 120,
          debug: 25,
          critical: 5
        },
        entries_by_category: {
          auth: 450,
          user: 200,
          customer: 300,
          product: 150,
          quote: 100,
          system: 30,
          security: 15,
          api: 5,
          data: 0,
          export: 0
        },
        entries_by_action: {
          create: 300,
          read: 500,
          update: 250,
          delete: 50,
          login: 100,
          logout: 50,
          approve: 30,
          reject: 10,
          assign: 40,
          export: 20,
          import: 5,
          backup: 3,
          config_change: 8,
          role_change: 2,
          access_denied: 15,
          security_violation: 2
        },
        top_users: [
          { user_id: 'user123', user_name: '张三', count: 450 },
          { user_id: 'user456', user_name: '李四', count: 320 },
          { user_id: 'user789', user_name: '王五', count: 280 }
        ],
        recent_activity: recentActivity.value,
        error_summary: [
          { error_code: 'AUTH001', count: 15, last_occurrence: new Date().toISOString() },
          {
            error_code: 'PERM002',
            count: 8,
            last_occurrence: new Date(Date.now() - 3600000).toISOString()
          }
        ],
        security_events: 17,
        failed_logins: 25,
        data_operations: 50
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取统计信息失败'
      console.error('Failed to fetch statistics:', err)
    } finally {
      loading.value = false
    }
  }

  async function searchLogs(searchTerm: string) {
    const searchFilter: LogFilter = {
      ...currentFilter.value,
      search: searchTerm
    }

    await fetchLogs(searchFilter)
  }

  async function applyFilter(filter: LogFilter) {
    currentPage.value = 1 // Reset to first page when applying new filter
    await fetchLogs(filter)
  }

  function clearFilter() {
    currentFilter.value = {}
    currentPage.value = 1
    fetchLogs()
  }

  async function changePage(page: number) {
    if (page >= 1 && page <= totalPages.value) {
      currentPage.value = page
      await fetchLogs(currentFilter.value)
    }
  }

  async function exportLogs(options: LogExportOptions) {
    loading.value = true
    error.value = null

    try {
      // Mock export functionality - replace with actual API integration
      const exportData = {
        format: options.format,
        entries: filteredLogs.value,
        total: filteredLogs.value.length,
        exported_at: new Date().toISOString(),
        filters_applied: currentFilter.value
      }

      // Simulate file download
      const filename = `logs_export_${new Date().toISOString().split('T')[0]}.${options.format}`

      uni.showToast({
        title: `导出完成: ${filename}`,
        icon: 'success'
      })

      return exportData
    } catch (err) {
      error.value = err instanceof Error ? err.message : '导出日志失败'
      console.error('Failed to export logs:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchSecurityEvents() {
    loading.value = true
    error.value = null

    try {
      // Mock security events - replace with actual API integration
      securityEvents.value = [
        {
          id: 'sec1',
          timestamp: new Date().toISOString(),
          event_type: 'failed_login',
          severity: 'medium',
          user_id: 'user999',
          ip_address: '192.168.1.200',
          description: '连续多次登录失败',
          resolved: false
        }
      ]
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取安全事件失败'
      console.error('Failed to fetch security events:', err)
    } finally {
      loading.value = false
    }
  }

  async function resolveSecurityEvent(eventId: string, notes?: string) {
    loading.value = true
    error.value = null

    try {
      const event = securityEvents.value.find(e => e.id === eventId)
      if (event) {
        event.resolved = true
        event.resolved_at = new Date().toISOString()
        event.resolution_notes = notes

        uni.showToast({
          title: '安全事件已处理',
          icon: 'success'
        })
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '处理安全事件失败'
      console.error('Failed to resolve security event:', err)
    } finally {
      loading.value = false
    }
  }

  function startAutoRefresh() {
    autoRefresh.value = true
    const interval = setInterval(() => {
      if (autoRefresh.value) {
        fetchLogs(currentFilter.value)
      } else {
        clearInterval(interval)
      }
    }, refreshInterval.value)
  }

  function stopAutoRefresh() {
    autoRefresh.value = false
  }

  // Utility functions
  function getLogLevelColor(level: LogLevel): string {
    const colors = {
      info: '#3b82f6', // blue
      warn: '#f59e0b', // amber
      error: '#ef4444', // red
      debug: '#6b7280', // gray
      critical: '#dc2626' // dark red
    }
    return colors[level] || '#6b7280'
  }

  function getLogLevelText(level: LogLevel): string {
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

  return {
    // State
    logs,
    securityEvents,
    systemEvents,
    currentFilter,
    searchResult,
    statistics,
    loading,
    error,
    currentPage,
    pageSize,
    totalEntries,
    autoRefresh,
    refreshInterval,

    // Computed
    hasLogs,
    totalPages,
    hasPreviousPage,
    hasNextPage,
    filteredLogs,
    criticalEvents,
    recentActivity,

    // Actions
    fetchLogs,
    fetchStatistics,
    searchLogs,
    applyFilter,
    clearFilter,
    changePage,
    exportLogs,
    fetchSecurityEvents,
    resolveSecurityEvent,
    startAutoRefresh,
    stopAutoRefresh,

    // Utilities
    getLogLevelColor,
    getLogLevelText,
    getCategoryText,
    getActionText
  }
})
