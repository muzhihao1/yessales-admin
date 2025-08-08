<template>
  <view class="app-container">
    <router-view />
  </view>
</template>

<script setup lang="ts">
import { onHide, onLaunch, onShow } from '@dcloudio/uni-app'
import { setupRouteGuards } from '@/utils/route-guards'
import { useAuthStore } from '@/stores/auth'
import { realtimeService } from '@/services/realtime'

onLaunch(async () => {
  console.log('App Launch')

  // Initialize route guards
  setupRouteGuards()

  // Initialize auth store and check for existing session
  const authStore = useAuthStore()
  await authStore.initializeAuth()

  // Initialize real-time service if user is authenticated
  if (authStore.isAuthenticated) {
    await realtimeService.initialize()
  }
})

onShow(async () => {
  console.log('App Show')

  // Check auth status when app becomes active
  const authStore = useAuthStore()
  await authStore.checkAuthStatus()

  // Reconnect real-time service if user is authenticated
  if (authStore.isAuthenticated && !realtimeService.getConnectionStatus().isConnected) {
    await realtimeService.reconnect()
  }
})

onHide(async () => {
  console.log('App Hide')

  // Disconnect real-time service to save resources
  if (realtimeService.getConnectionStatus().isConnected) {
    await realtimeService.disconnect()
  }
})
</script>

<style lang="scss">
@import './styles/global.scss';

.app-container {
  width: 100%;
  height: 100%;
}
</style>
