<template>
  <view class="comprehensive-test-page">
    <!-- Header with navigation -->
    <SalesHeader title="综合功能测试" :show-back="true" @back="goBack" />
    
    <!-- Test Suite Component -->
    <ComprehensiveTestSuite />
  </view>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import SalesHeader from '@/components/sales/SalesHeader.vue'
import ComprehensiveTestSuite from '@/components/testing/ComprehensiveTestSuite.vue'

function goBack() {
  // Navigate back to previous page or test index
  if (typeof window !== 'undefined' && window.history.length > 1) {
    window.history.back()
  } else {
    uni.navigateBack()
  }
}

onMounted(() => {
  console.log('🧪 Comprehensive Test Suite loaded')
  
  // Set navigation bar title for UniApp compatibility
  uni.setNavigationBarTitle({
    title: '综合功能测试'
  })
})
</script>

<style lang="scss" scoped>
.comprehensive-test-page {
  min-height: 100vh;
  background: #f8fafc;
}
</style>