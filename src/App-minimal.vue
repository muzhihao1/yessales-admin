<template>
  <div class="app-container">
    <h1>Minimal App Test</h1>
    <RouterView />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'

onMounted(() => {
  console.log('Minimal App mounted successfully')
})
</script>

<style>
.app-container {
  width: 100%;
  height: 100%;
  padding: 20px;
}

h1 {
  color: #2563eb;
  margin-bottom: 20px;
}
</style>
