<template>
  <div class="app-container">
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'

// Simple Vue 3 App without UniApp dependencies
onMounted(() => {
  console.log('✅ App mounted successfully')
  document.title = '耶氏台球报价系统'
})
</script>

<style lang="scss">
.app-container {
  width: 100%;
  height: 100%;
}

// Basic global styles
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  background-color: #f5f5f5;
}

#app {
  height: 100vh;
}
</style>