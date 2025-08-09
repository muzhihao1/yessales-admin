<template>
  <div class="test-page">
    <h1>测试页面</h1>
    <p>如果您看到这个页面，说明Vue应用程序正在工作。</p>
    <button @click="testClick">点击测试</button>
    <p v-if="clicked">按钮已被点击！</p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const clicked = ref(false)

const testClick = () => {
  clicked.value = true
  console.log('测试点击成功')
}
</script>

<style scoped>
.test-page {
  padding: 20px;
  max-width: 600px;
  margin: 0 auto;
}

h1 {
  color: #333;
}

button {
  background: #007bff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
}

button:hover {
  background: #0056b3;
}
</style>