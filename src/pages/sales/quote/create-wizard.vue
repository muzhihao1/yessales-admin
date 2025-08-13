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

// Set page title - Web implementation
document.title = '新建报价 - 耶氏台球报价系统'

// Track page view for analytics - Web implementation
console.log('Analytics: Page view', {
  page_name: 'quote_create_wizard',
  page_type: 'sales',
  timestamp: Date.now()
})

// Could integrate with Google Analytics or other web analytics here
// Example: gtag('event', 'page_view', { page_title: '新建报价' })
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
