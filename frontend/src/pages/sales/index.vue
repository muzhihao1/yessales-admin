<template>
  <view class="sales-container">
    <view class="sales-header">
      <text class="sales-title">耶氏台球报价系统</text>
    </view>
    
    <view class="sales-content">
      <SalesButton @click="createQuote">
        新建报价
      </SalesButton>
      
      <SalesButton @click="viewHistory">
        历史报价
      </SalesButton>
    </view>
  </view>
</template>

<script setup lang="ts">
import SalesButton from '@/components/sales/SalesButton.vue'

function createQuote() {
  uni.navigateTo({
    url: '/pages/sales/quote/create'
  })
}

function viewHistory() {
  uni.navigateTo({
    url: '/pages/sales/history/index'
  })
}
</script>

<style lang="scss" scoped>
.sales-container {
  padding: 20px;
}

.sales-header {
  text-align: center;
  margin-bottom: 40px;
}

.sales-title {
  font-size: 24px;
  font-weight: bold;
}

.sales-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
</style>