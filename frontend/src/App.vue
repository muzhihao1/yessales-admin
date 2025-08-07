<template>
  <div class="app-container">
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { setupRouteGuards } from '@/utils/route-guards'
import { useAuthStore } from '@/stores/auth'
import { realtimeService } from '@/services/realtime'
import { domainRouter } from '@/utils/domain-router'

// Standard Vue 3 lifecycle hooks instead of UniApp lifecycle
onMounted(async () => {
  console.log('App Mounted')
  
  // 1. 首先执行域名路由检查和自动重定向
  console.log(`[App] Current domain: ${window.location.hostname}`)
  console.log(`[App] App type: ${domainRouter.getAppType()}`)
  
  // 设置页面标题
  document.title = domainRouter.getAppTitle()
  
  // 执行自动重定向（如果需要）
  domainRouter.autoRedirect()
  
  // 2. Initialize route guards
  setupRouteGuards()
  
  // 3. Initialize auth store and check for existing session
  const authStore = useAuthStore()
  await authStore.initializeAuth()
  
  // 4. 根据应用类型决定是否初始化实时服务
  if (domainRouter.isAdminAccess()) {
    // 管理端需要认证后才初始化实时服务
    if (authStore.isAuthenticated) {
      await realtimeService.initialize()
    }
  } else if (domainRouter.isSalesAccess()) {
    // 销售端可能不需要认证，但可以有基础的实时功能
    console.log('[App] Sales app initialized')
  }
})

// Handle window visibility changes instead of UniApp show/hide
document.addEventListener('visibilitychange', async () => {
  const authStore = useAuthStore()
  
  if (document.hidden) {
    console.log('App Hidden')
    // Disconnect real-time service to save resources
    if (realtimeService.getConnectionStatus().isConnected) {
      await realtimeService.disconnect()
    }
  } else {
    console.log('App Shown')
    // Check auth status when app becomes active
    await authStore.checkAuthStatus()
    
    // Reconnect real-time service if user is authenticated
    if (authStore.isAuthenticated && !realtimeService.getConnectionStatus().isConnected) {
      await realtimeService.reconnect()
    }
  }
})

onUnmounted(() => {
  console.log('App Unmounted')
})
</script>

<style lang="scss">
@import './styles/global.scss';

.app-container {
  width: 100%;
  height: 100%;
}
</style>