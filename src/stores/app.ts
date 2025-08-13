import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { checkApiHealth } from '@/api'

/**
 * 全局应用状态管理
 * 管理应用级别的状态：网络状态、加载状态、错误处理、设置等
 */
export const useAppStore = defineStore('app', () => {
  // ============= 网络和连接状态 =============
  const isOnline = ref(true)
  const apiHealthy = ref(true)
  const lastNetworkCheck = ref<Date | null>(null)

  // ============= 全局加载状态 =============
  const globalLoading = ref(false)
  const loadingTasks = ref(new Set<string>())
  const loadingMessage = ref('加载中...')

  // ============= 错误处理 =============
  const globalError = ref<{
    code?: string
    message: string
    timestamp: Date
    details?: any
  } | null>(null)
  const errorHistory = ref<
    Array<{
      code?: string
      message: string
      timestamp: Date
      details?: any
    }>
  >([])

  // ============= 应用设置 =============
  const settings = ref({
    autoSave: true,
    offlineMode: false,
    notificationsEnabled: true,
    cacheEnabled: true,
    debugMode: false,
    pageSize: 20,
    preferences: {
      language: 'zh-CN',
      timezone: 'Asia/Shanghai',
      dateFormat: 'YYYY-MM-DD',
      currency: 'CNY'
    },
    business: {
      companyName: '耶氏台球斗南销售中心',
      contactInfo: '',
      defaultTaxRate: 0.13,
      quotationValidDays: 30
    }
  })

  // ============= UI状态 =============
  const modalStack = ref<
    Array<{
      id: string
      component: string
      props?: any
      options?: any
    }>
  >([])

  const sidebarCollapsed = ref(false)
  const currentRoute = ref('')
  const previousRoute = ref('')

  // ============= 通知系统 =============
  const notifications = ref<
    Array<{
      id: string
      type: 'success' | 'error' | 'warning' | 'info'
      title: string
      message?: string
      timestamp: Date
      read: boolean
      persistent?: boolean
      actions?: Array<{
        label: string
        action: () => void
      }>
    }>
  >([])

  // ============= 离线数据同步 =============
  const pendingSyncActions = ref<
    Array<{
      id: string
      action: string
      data: any
      timestamp: Date
      retryCount: number
    }>
  >([])

  const syncInProgress = ref(false)
  const lastSyncTime = ref<Date | null>(null)

  // ============= 系统信息 =============
  const systemInfo = ref({
    platform: '',
    version: '',
    brand: '',
    model: '',
    screenWidth: 0,
    screenHeight: 0,
    pixelRatio: 1,
    statusBarHeight: 0,
    navigationBarHeight: 0
  })

  // ============= Getters =============
  const hasActiveLoading = computed(() => loadingTasks.value.size > 0 || globalLoading.value)

  const unreadNotifications = computed(() => notifications.value.filter(n => !n.read))

  const hasUnreadNotifications = computed(() => unreadNotifications.value.length > 0)

  const isOfflineMode = computed(() => !isOnline.value || settings.value.offlineMode)

  const hasPendingSync = computed(() => pendingSyncActions.value.length > 0)

  // ============= Actions =============

  /**
   * 网络状态管理
   */
  function setOnlineStatus(online: boolean) {
    const wasOffline = !isOnline.value
    isOnline.value = online
    lastNetworkCheck.value = new Date()

    if (online && wasOffline) {
      // 网络恢复，触发同步
      showNotification({
        type: 'success',
        title: '网络已连接',
        message: '正在同步离线数据...'
      })
      syncOfflineData()
    } else if (!online) {
      showNotification({
        type: 'warning',
        title: '网络已断开',
        message: '应用将以离线模式运行',
        persistent: true
      })
    }
  }

  async function checkNetworkStatus() {
    try {
      // 检查网络连接 - Web implementation
      const networkConnected = navigator.onLine
      setOnlineStatus(networkConnected)

      // 检查API健康状态
      if (isOnline.value) {
        const healthy = await checkApiHealth()
        apiHealthy.value = healthy

        if (!healthy) {
          showNotification({
            type: 'warning',
            title: 'API服务异常',
            message: '部分功能可能受限'
          })
        }
      }
    } catch (error) {
      console.error('Network check failed:', error)
      apiHealthy.value = false
    }
  }

  /**
   * 加载状态管理
   */
  function startLoading(taskId?: string, message?: string) {
    if (taskId) {
      loadingTasks.value.add(taskId)
    } else {
      globalLoading.value = true
    }

    if (message) {
      loadingMessage.value = message
    }
  }

  function stopLoading(taskId?: string) {
    if (taskId) {
      loadingTasks.value.delete(taskId)
    } else {
      globalLoading.value = false
    }

    // 如果没有其他加载任务，重置加载消息
    if (loadingTasks.value.size === 0 && !globalLoading.value) {
      loadingMessage.value = '加载中...'
    }
  }

  function clearAllLoading() {
    globalLoading.value = false
    loadingTasks.value.clear()
    loadingMessage.value = '加载中...'
  }

  /**
   * 错误处理
   */
  function setGlobalError(error: { code?: string; message: string; details?: any }) {
    const errorObj = {
      ...error,
      timestamp: new Date()
    }

    globalError.value = errorObj
    errorHistory.value.unshift(errorObj)

    // 限制错误历史长度
    if (errorHistory.value.length > 50) {
      errorHistory.value = errorHistory.value.slice(0, 50)
    }

    // 显示错误通知
    showNotification({
      type: 'error',
      title: '系统错误',
      message: error.message,
      persistent: true
    })
  }

  function clearGlobalError() {
    globalError.value = null
  }

  /**
   * 设置管理
   */
  function updateSettings(newSettings: Partial<typeof settings.value>) {
    settings.value = { ...settings.value, ...newSettings }

    // 持久化设置 - Web implementation
    try {
      localStorage.setItem('app_settings', JSON.stringify(settings.value))
    } catch (error) {
      console.error('Failed to save settings:', error)
    }

    // 应用设置变更
    applySettings()
  }

  function applySettings() {
    // 应用基础设置
    console.log('✅ 应用设置已更新')
  }

  function loadSettings() {
    try {
      // Web implementation
      const savedSettingsJson = localStorage.getItem('app_settings')
      if (savedSettingsJson) {
        const savedSettings = JSON.parse(savedSettingsJson)
        settings.value = { ...settings.value, ...savedSettings }
        applySettings()
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
    }
  }

  /**
   * 通知系统
   */
  function showNotification(notification: {
    type: 'success' | 'error' | 'warning' | 'info'
    title: string
    message?: string
    persistent?: boolean
    actions?: Array<{
      label: string
      action: () => void
    }>
  }) {
    const id = `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const notificationObj = {
      id,
      ...notification,
      timestamp: new Date(),
      read: false
    }

    notifications.value.unshift(notificationObj)

    // 如果是非持久化通知，3秒后自动移除
    if (!notification.persistent) {
      setTimeout(() => {
        removeNotification(id)
      }, 3000)
    }

    // 显示系统通知 - Web implementation
    if (settings.value.notificationsEnabled) {
      const duration = notification.persistent ? 5000 : 2000
      console.log(`Notification: ${notification.title}`)
      
      // For critical notifications, also show alert
      if (notification.type === 'error' || notification.persistent) {
        alert(notification.title)
      }
    }
  }

  function markNotificationAsRead(id: string) {
    const notification = notifications.value.find(n => n.id === id)
    if (notification) {
      notification.read = true
    }
  }

  function removeNotification(id: string) {
    const index = notifications.value.findIndex(n => n.id === id)
    if (index > -1) {
      notifications.value.splice(index, 1)
    }
  }

  function clearAllNotifications() {
    notifications.value = []
  }

  /**
   * Modal管理
   */
  function openModal(modal: { id?: string; component: string; props?: any; options?: any }) {
    const id = modal.id || `modal_${Date.now()}`
    modalStack.value.push({
      id,
      component: modal.component,
      props: modal.props,
      options: modal.options
    })
    return id
  }

  function closeModal(id?: string) {
    if (id) {
      const index = modalStack.value.findIndex(m => m.id === id)
      if (index > -1) {
        modalStack.value.splice(index, 1)
      }
    } else {
      modalStack.value.pop()
    }
  }

  function closeAllModals() {
    modalStack.value = []
  }

  /**
   * 离线数据同步
   */
  function addPendingSync(action: { action: string; data: any }) {
    const id = `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    pendingSyncActions.value.push({
      id,
      ...action,
      timestamp: new Date(),
      retryCount: 0
    })

    // 如果在线，立即尝试同步
    if (isOnline.value && !syncInProgress.value) {
      syncOfflineData()
    }
  }

  async function syncOfflineData() {
    if (syncInProgress.value || pendingSyncActions.value.length === 0) {
      return
    }

    syncInProgress.value = true

    try {
      const actionsToSync = [...pendingSyncActions.value]

      for (const syncAction of actionsToSync) {
        try {
          // 这里执行具体的同步逻辑
          // 根据action类型调用对应的API

          // 同步成功，从待同步列表中移除
          const index = pendingSyncActions.value.findIndex(a => a.id === syncAction.id)
          if (index > -1) {
            pendingSyncActions.value.splice(index, 1)
          }
        } catch (error) {
          // 同步失败，增加重试次数
          syncAction.retryCount++

          // 如果重试次数过多，移除该同步项
          if (syncAction.retryCount > 3) {
            const index = pendingSyncActions.value.findIndex(a => a.id === syncAction.id)
            if (index > -1) {
              pendingSyncActions.value.splice(index, 1)
            }

            showNotification({
              type: 'error',
              title: '数据同步失败',
              message: `操作 ${syncAction.action} 同步失败，已跳过`
            })
          }
        }
      }

      lastSyncTime.value = new Date()

      if (pendingSyncActions.value.length === 0) {
        showNotification({
          type: 'success',
          title: '数据同步完成',
          message: '所有离线数据已同步'
        })
      }
    } catch (error) {
      console.error('Sync failed:', error)
      showNotification({
        type: 'error',
        title: '同步异常',
        message: '数据同步过程中发生错误'
      })
    } finally {
      syncInProgress.value = false
    }
  }

  /**
   * 系统信息管理
   */
  function updateSystemInfo() {
    try {
      // Web implementation - get browser/system info
      systemInfo.value = {
        platform: 'web',
        version: navigator.userAgent,
        brand: 'Browser',
        model: navigator.platform,
        screenWidth: screen.width,
        screenHeight: screen.height,
        pixelRatio: window.devicePixelRatio || 1,
        statusBarHeight: 0, // Not applicable in web
        navigationBarHeight: 44 // Default navigation bar height
      }
    } catch (error) {
      console.error('Failed to get system info:', error)
    }
  }

  /**
   * 路由管理
   */
  function setCurrentRoute(route: string) {
    previousRoute.value = currentRoute.value
    currentRoute.value = route
  }

  /**
   * 初始化应用状态
   */
  async function initializeApp() {
    try {
      // 加载设置
      loadSettings()

      // 更新系统信息
      updateSystemInfo()

      // 检查网络状态
      await checkNetworkStatus()

      // 监听网络状态变化 - Web implementation
      window.addEventListener('online', () => {
        setOnlineStatus(true)
      })
      
      window.addEventListener('offline', () => {
        setOnlineStatus(false)
      })

      // 设置定期健康检查
      setInterval(() => {
        if (isOnline.value) {
          checkNetworkStatus()
        }
      }, 30000) // 每30秒检查一次

      console.log('✅ App store initialized')
    } catch (error) {
      console.error('❌ App initialization failed:', error)
      setGlobalError({
        code: 'INIT_FAILED',
        message: '应用初始化失败',
        details: error
      })
    }
  }

  return {
    // State
    isOnline,
    apiHealthy,
    lastNetworkCheck,
    globalLoading,
    loadingTasks,
    loadingMessage,
    globalError,
    errorHistory,
    settings,
    modalStack,
    sidebarCollapsed,
    currentRoute,
    previousRoute,
    notifications,
    pendingSyncActions,
    syncInProgress,
    lastSyncTime,
    systemInfo,

    // Getters
    hasActiveLoading,
    unreadNotifications,
    hasUnreadNotifications,
    isOfflineMode,
    hasPendingSync,

    // Actions
    setOnlineStatus,
    checkNetworkStatus,
    startLoading,
    stopLoading,
    clearAllLoading,
    setGlobalError,
    clearGlobalError,
    updateSettings,
    loadSettings,
    showNotification,
    markNotificationAsRead,
    removeNotification,
    clearAllNotifications,
    openModal,
    closeModal,
    closeAllModals,
    addPendingSync,
    syncOfflineData,
    updateSystemInfo,
    setCurrentRoute,
    initializeApp
  }
})
