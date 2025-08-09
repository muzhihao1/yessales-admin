<template>
  <view class="sales-container">
    <!-- Use the enhanced QuoteWizard component for better UX -->
    <QuoteWizard />
  </view>
</template>

<script setup lang="ts">
import QuoteWizard from '@/components/sales/QuoteWizard.vue'
</script>

<style lang="scss" scoped>
.sales-container {
  min-height: 100vh;
  background-color: #f5f5f5;
}
</style>
