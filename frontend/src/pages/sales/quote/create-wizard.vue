<!--
  YesSales Quote Creation - New Wizard Implementation
  Improved UX with multi-step process and real-time feedback
-->
<template>
  <view class="create-quote-page">
    <QuoteWizard />
  </view>
</template>

<script setup lang="ts">
import QuoteWizard from '@/components/sales/QuoteWizard.vue'

// Page configuration
defineOptions({
  name: 'CreateQuoteWizard'
})

// Set page title and meta
uni.setNavigationBarTitle({
  title: '新建报价'
})

// Track page view for analytics
uni.reportAnalytics('page_view', {
  page_name: 'quote_create_wizard',
  page_type: 'sales',
  timestamp: Date.now()
})
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.create-quote-page {
  min-height: 100vh;
  background-color: $bg-color-page;
}

/* Global page styles for this route */
:deep(.uni-page-body) {
  background-color: $bg-color-page;
}

/* Hide default navigation bar since QuoteWizard has its own */
/* #ifdef H5 */
.create-quote-page {
  padding-top: 0;
}
/* #endif */
</style>
