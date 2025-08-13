/**
 * Real-time Status Composable
 *
 * Provides reactive real-time connection status and utilities for
 * displaying connection state to users.
 */

import { computed, onMounted, onUnmounted, ref } from 'vue'
import { realtimeService } from '@/services/realtime'

export function useRealtimeStatus() {
  const status = ref(realtimeService.getConnectionStatus())
  const lastUpdateTime = ref<Date | null>(null)
  let statusInterval: NodeJS.Timeout | null = null

  // Reactive computed properties
  const connectionStatus = computed(() => ({
    isConnected: status.value.isConnected,
    channelCount: status.value.channelCount,
    channels: status.value.channels,
    statusText: status.value.isConnected ? '已连接' : '未连接',
    statusIcon: status.value.isConnected ? '🟢' : '🔴',
    lastUpdate: lastUpdateTime.value,

    // Connection quality indicators
    isHealthy: status.value.isConnected && status.value.channelCount > 0,
    hasAllChannels: status.value.channelCount >= 3, // customers, products, quotes
    connectionQuality: getConnectionQuality()
  }))

  // Connection quality assessment
  function getConnectionQuality(): 'excellent' | 'good' | 'poor' | 'disconnected' {
    if (!status.value.isConnected) return 'disconnected'
    if (status.value.channelCount >= 4) return 'excellent' // All channels including users
    if (status.value.channelCount >= 3) return 'good' // Core channels
    return 'poor' // Some channels missing
  }

  // Update status periodically
  function updateStatus() {
    const newStatus = realtimeService.getConnectionStatus()

    // Check if status changed
    if (JSON.stringify(status.value) !== JSON.stringify(newStatus)) {
      status.value = newStatus
      lastUpdateTime.value = new Date()
    }
  }

  // Initialize status monitoring
  onMounted(() => {
    updateStatus()

    // Update status every 5 seconds
    statusInterval = setInterval(updateStatus, 5000)
  })

  // Cleanup on unmount
  onUnmounted(() => {
    if (statusInterval) {
      clearInterval(statusInterval)
      statusInterval = null
    }
  })

  // Utility functions
  const statusUtils = {
    /**
     * Get status color for UI indicators
     */
    getStatusColor(): string {
      switch (connectionStatus.value.connectionQuality) {
        case 'excellent':
          return '#10b981' // green-500
        case 'good':
          return '#3b82f6' // blue-500
        case 'poor':
          return '#f59e0b' // amber-500
        case 'disconnected':
          return '#ef4444' // red-500
        default:
          return '#6b7280' // gray-500
      }
    },

    /**
     * Get detailed status message
     */
    getStatusMessage(): string {
      const { isConnected, channelCount } = status.value

      if (!isConnected) {
        return '实时更新已断开，数据可能不是最新的'
      }

      if (channelCount === 0) {
        return '正在连接实时更新服务...'
      }

      if (channelCount < 3) {
        return `实时更新部分可用 (${channelCount}/4 个频道)`
      }

      if (channelCount >= 4) {
        return '实时更新服务运行正常'
      }

      return `实时更新已连接 (${channelCount} 个频道)`
    },

    /**
     * Get connection status badge props
     */
    getBadgeProps() {
      return {
        text: connectionStatus.value.statusText,
        color: this.getStatusColor(),
        icon: connectionStatus.value.statusIcon,
        pulse: !connectionStatus.value.isConnected
      }
    },

    /**
     * Show connection status toast
     */
    showStatusToast() {
      console.log('Connection status:', this.getStatusMessage())
      alert(this.getStatusMessage())
    },

    /**
     * Format last update time
     */
    formatLastUpdate(): string {
      if (!lastUpdateTime.value) return '未知'

      const now = new Date()
      const diff = now.getTime() - lastUpdateTime.value.getTime()
      const seconds = Math.floor(diff / 1000)
      const minutes = Math.floor(seconds / 60)
      const hours = Math.floor(minutes / 60)

      if (seconds < 60) return `${seconds}秒前`
      if (minutes < 60) return `${minutes}分钟前`
      if (hours < 24) return `${hours}小时前`

      return lastUpdateTime.value.toLocaleDateString('zh-CN')
    }
  }

  // Actions
  const actions = {
    /**
     * Manually refresh connection status
     */
    refresh() {
      updateStatus()
    },

    /**
     * Attempt to reconnect real-time service
     */
    async reconnect() {
      try {
        console.log('重新连接中...')

        await realtimeService.reconnect()
        updateStatus()

        console.log('重新连接成功')
        alert('重新连接成功')
      } catch (error) {
        console.error('重新连接失败')
        alert('重新连接失败')
        console.error('Reconnection failed:', error)
      }
    },

    /**
     * Toggle real-time updates (disconnect/reconnect)
     */
    async toggle() {
      if (status.value.isConnected) {
        await realtimeService.disconnect()
        console.log('实时更新已关闭')
        alert('实时更新已关闭')
      } else {
        await this.reconnect()
      }
      updateStatus()
    },

    /**
     * Show detailed connection info
     */
    showConnectionDetails() {
      const details = [
        `连接状态: ${connectionStatus.value.statusText}`,
        `频道数量: ${status.value.channelCount}`,
        `连接质量: ${getConnectionQuality()}`,
        `最后更新: ${statusUtils.formatLastUpdate()}`,
        `活跃频道: ${status.value.channels.join(', ')}`
      ].join('\n')

      alert(`实时连接详情\n\n${details}`)
    }
  }

  return {
    // Reactive state
    connectionStatus,
    status: status.value,
    lastUpdateTime,

    // Utilities
    statusUtils,

    // Actions
    actions,

    // Convenience accessors
    isConnected: connectionStatus.value.isConnected,
    isHealthy: connectionStatus.value.isHealthy,
    channelCount: status.value.channelCount,
    connectionQuality: connectionStatus.value.connectionQuality
  }
}

/**
 * Simple real-time indicator component props
 */
export function useRealtimeIndicator() {
  const { connectionStatus, statusUtils, actions } = useRealtimeStatus()

  return {
    // Props for indicator component
    indicatorProps: computed(() => ({
      color: statusUtils.getStatusColor(),
      text: connectionStatus.value.statusText,
      icon: connectionStatus.value.statusIcon,
      pulse: !connectionStatus.value.isConnected,
      title: statusUtils.getStatusMessage()
    })),

    // Click handler for indicator
    onIndicatorClick: actions.showConnectionDetails,

    // Connection state
    isConnected: connectionStatus.value.isConnected,
    quality: connectionStatus.value.connectionQuality
  }
}
