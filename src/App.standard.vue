<template>
  <div class="app-container">
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { realtimeService } from '@/services/realtime'

// Standard Vue 3 lifecycle hooks instead of UniApp lifecycle
onMounted(async () => {
  console.log('App Mounted')

  // Initialize route guards (disabled - handled by Vue Router)
  // setupRouteGuards()

  // Initialize auth store and check for existing session
  const authStore = useAuthStore()
  await authStore.initializeAuth()

  // Initialize real-time service if user is authenticated
  if (authStore.isAuthenticated) {
    await realtimeService.initialize()
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
