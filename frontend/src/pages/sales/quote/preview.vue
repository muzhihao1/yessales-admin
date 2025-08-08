<template>
  <view class="quote-preview">
    <SalesHeader title="报价单预览" :show-back="true" :fixed="true" />

    <!-- Loading State -->
    <view v-if="loading" class="loading-container">
      <view class="loading-spinner"></view>
      <text class="loading-text">加载报价单...</text>
    </view>

    <!-- Error State -->
    <view v-else-if="error" class="error-container">
      <text class="error-text">{{ error }}</text>
      <SalesButton @click="loadQuoteData">重试</SalesButton>
    </view>

    <!-- Quote Document -->
    <view v-else-if="quoteData" class="quote-document">
      <!-- Document Header -->
      <view class="document-header">
        <view class="header-row">
          <view class="company-section">
            <image
              class="company-logo"
              src="/static/logo.png"
              mode="aspectFit"
              @error="handleLogoError"
            />
            <view class="company-info">
              <text class="company-name">耶氏台球斗南销售中心</text>
              <text class="company-subtitle">专业台球设备供应商</text>
              <text class="company-contact">电话：400-888-8888</text>
              <text class="company-address">地址：昆明市斗南花卉市场</text>
            </view>
          </view>

          <view class="quote-info">
            <text class="quote-title">报价单</text>
            <text class="quote-number">{{ quoteData.quote.quoteNumber }}</text>
            <view class="quote-meta">
              <text class="meta-item">日期：{{ formatDate(quoteData.createdAt) }}</text>
              <text class="meta-item">有效期至：{{ getValidUntilDate() }}</text>
              <view class="quote-status" :class="`status-${quoteData.status || 'draft'}`">
                {{ getStatusText(quoteData.status || 'draft') }}
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- Customer & Company Info -->
      <view class="info-section">
        <view class="info-card">
          <text class="info-title">客户信息</text>
          <view class="info-content">
            <view class="info-row">
              <text class="info-label">客户姓名</text>
              <text class="info-value">{{ quoteData.customer.name }}</text>
            </view>
            <view class="info-row">
              <text class="info-label">联系电话</text>
              <text class="info-value">{{ quoteData.customer.phone }}</text>
            </view>
            <view v-if="quoteData.customer.wechat" class="info-row">
              <text class="info-label">微信号</text>
              <text class="info-value">{{ quoteData.customer.wechat }}</text>
            </view>
            <view v-if="quoteData.customer.email" class="info-row">
              <text class="info-label">邮箱</text>
              <text class="info-value">{{ quoteData.customer.email }}</text>
            </view>
            <view v-if="quoteData.customer.address" class="info-row">
              <text class="info-label">地址</text>
              <text class="info-value">
                {{ quoteData.customer.province }}{{ quoteData.customer.city
                }}{{ quoteData.customer.address }}
              </text>
            </view>
            <view class="info-row">
              <text class="info-label">客户类型</text>
              <text class="info-value">{{ getCustomerTypeText(quoteData.customer.type) }}</text>
            </view>
            <view v-if="quoteData.customer.remark" class="info-row">
              <text class="info-label">备注</text>
              <text class="info-value">{{ quoteData.customer.remark }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- Products Table -->
      <view class="products-section">
        <text class="section-title">产品明细</text>

        <view class="products-table">
          <!-- Table Header -->
          <view class="table-header">
            <text class="header-cell product-name">产品名称</text>
            <text class="header-cell product-model">型号规格</text>
            <text class="header-cell product-quantity">数量</text>
            <text class="header-cell product-price">单价</text>
            <text class="header-cell product-total">小计</text>
          </view>

          <!-- Table Rows -->
          <view v-for="(item, index) in quoteData.items" :key="index" class="table-row">
            <view class="table-cell product-name">
              <text class="cell-title">{{ item.product_name }}</text>
            </view>
            <view class="table-cell product-model">
              <text class="cell-content">{{ item.product_model }}</text>
              <text v-if="item.sku_name" class="cell-sku">{{ item.sku_name }}</text>
            </view>
            <view class="table-cell product-quantity">
              <text class="cell-content">{{ item.quantity }}</text>
            </view>
            <view class="table-cell product-price">
              <text class="cell-content">¥{{ formatPrice(item.unit_price) }}</text>
            </view>
            <view class="table-cell product-total">
              <text class="cell-total">¥{{ formatPrice(item.total_price) }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- Price Summary -->
      <view class="summary-section">
        <view class="summary-card">
          <text class="summary-title">价格汇总</text>

          <view class="summary-rows">
            <view class="summary-row">
              <text class="summary-label">产品小计</text>
              <text class="summary-value">¥{{ formatPrice(quoteData.pricing.subtotal) }}</text>
            </view>

            <view v-if="quoteData.pricing.discount.amount > 0" class="summary-row discount-row">
              <text class="summary-label">
                折扣优惠
                <text class="discount-detail">
                  ({{
                    quoteData.pricing.discount.type === 'percentage'
                      ? `${quoteData.pricing.discount.value}%`
                      : `¥${formatPrice(quoteData.pricing.discount.value)}`
                  }})
                </text>
              </text>
              <text class="summary-value discount-value"
                >-¥{{ formatPrice(quoteData.pricing.discount.amount) }}</text
              >
            </view>

            <view class="summary-row subtotal-row">
              <text class="summary-label">折扣后小计</text>
              <text class="summary-value"
                >¥{{
                  formatPrice(quoteData.pricing.subtotal - quoteData.pricing.discount.amount)
                }}</text
              >
            </view>

            <view v-if="quoteData.pricing.additionalCharges.deliveryFee > 0" class="summary-row">
              <text class="summary-label">配送费</text>
              <text class="summary-value"
                >+¥{{ formatPrice(quoteData.pricing.additionalCharges.deliveryFee) }}</text
              >
            </view>

            <view
              v-if="quoteData.pricing.additionalCharges.installationFee > 0"
              class="summary-row"
            >
              <text class="summary-label">安装费</text>
              <text class="summary-value"
                >+¥{{ formatPrice(quoteData.pricing.additionalCharges.installationFee) }}</text
              >
            </view>

            <view
              v-if="quoteData.pricing.additionalCharges.otherCharges.length > 0"
              class="summary-row"
            >
              <text class="summary-label">其他费用</text>
              <text class="summary-value">+¥{{ formatPrice(getOtherChargesTotal()) }}</text>
            </view>

            <view v-if="quoteData.pricing.tax.amount > 0" class="summary-row">
              <text class="summary-label">税费 ({{ quoteData.pricing.tax.rate }}%)</text>
              <text class="summary-value">+¥{{ formatPrice(quoteData.pricing.tax.amount) }}</text>
            </view>

            <view class="summary-row total-row">
              <text class="summary-label">合计金额</text>
              <text class="summary-value total-value"
                >¥{{ formatPrice(quoteData.pricing.finalTotal) }}</text
              >
            </view>
          </view>
        </view>
      </view>

      <!-- Terms & Conditions -->
      <view class="terms-section">
        <text class="section-title">付款条件与说明</text>

        <view class="terms-content">
          <view class="terms-row">
            <text class="terms-label">付款条件：</text>
            <text class="terms-value">{{ getPaymentTermsText(quoteData.quote.paymentTerms) }}</text>
          </view>

          <view v-if="quoteData.quote.specialTerms" class="terms-row">
            <text class="terms-label">特殊条款：</text>
            <text class="terms-value">{{ quoteData.quote.specialTerms }}</text>
          </view>

          <view v-if="quoteData.quote.notes" class="terms-row">
            <text class="terms-label">备注说明：</text>
            <text class="terms-value">{{ quoteData.quote.notes }}</text>
          </view>

          <view class="standard-terms">
            <text class="terms-title">标准条款：</text>
            <text class="terms-text"
              >1. 本报价单有效期为 {{ quoteData.quote.validityDays }} 天。</text
            >
            <text class="terms-text">2. 产品价格以报价单确认时为准，如有变动以书面通知为准。</text>
            <text class="terms-text">3. 配送及安装服务需提前预约，具体时间双方协商确定。</text>
            <text class="terms-text">4. 产品质量保证按照国家相关标准执行。</text>
          </view>
        </view>
      </view>

      <!-- Document Footer -->
      <view class="document-footer">
        <view class="signature-section">
          <view class="signature-block">
            <text class="signature-label">销售代表：</text>
            <view class="signature-line"></view>
            <text class="signature-date">日期：________________</text>
          </view>

          <view class="signature-block">
            <text class="signature-label">客户确认：</text>
            <view class="signature-line"></view>
            <text class="signature-date">日期：________________</text>
          </view>
        </view>

        <view class="footer-info">
          <text class="footer-text"
            >感谢您选择耶氏台球设备，我们将为您提供最优质的产品和服务！</text
          >
        </view>
      </view>
    </view>

    <!-- Action Buttons -->
    <view v-if="quoteData && !loading" class="quote-actions">
      <view class="actions-row">
        <SalesButton type="default" @click="editQuote"> 编辑报价 </SalesButton>

        <SalesButton type="plain" @click="printQuote"> 打印报价 </SalesButton>

        <SalesButton type="primary" @click="saveQuote" :loading="saving"> 保存报价 </SalesButton>
      </view>

      <view class="actions-row">
        <SalesButton type="success" :block="true" @click="sendQuote"> 发送给客户 </SalesButton>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import SalesHeader from '@/components/sales/SalesHeader.vue'
import SalesButton from '@/components/sales/SalesButton.vue'
import { QuotesApi } from '@/api'

interface QuoteData {
  id: string
  status: 'draft' | 'sent' | 'approved' | 'rejected'
  createdAt: string
  customer: {
    name: string
    phone: string
    wechat: string
    email: string
    province: string
    city: string
    address: string
    type: string
    remark: string
  }
  items: Array<{
    product_id: string
    product_name: string
    product_model: string
    sku_id?: string
    sku_name?: string
    quantity: number
    unit_price: number
    total_price: number
  }>
  pricing: {
    subtotal: number
    discount: {
      type: 'percentage' | 'fixed'
      value: number
      amount: number
    }
    tax: {
      rate: number
      amount: number
      included: boolean
    }
    additionalCharges: {
      deliveryFee: number
      installationFee: number
      otherCharges: Array<{
        name: string
        amount: number
        type: 'fixed' | 'percentage'
      }>
      total: number
    }
    finalTotal: number
  }
  quote: {
    quoteNumber: string
    validityDays: number
    paymentTerms: string
    specialTerms: string
    notes: string
  }
}

// State
const loading = ref(true)
const saving = ref(false)
const error = ref('')
const quoteData = ref<QuoteData | null>(null)
const quoteId = ref('')

// Get quote ID from URL parameters
onMounted(() => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  const options = currentPage.options

  if (options.id) {
    quoteId.value = options.id
    loadQuoteData()
  } else {
    error.value = '缺少报价单ID参数'
  }
})

// Load quote data
const loadQuoteData = async () => {
  try {
    loading.value = true
    error.value = ''

    // For development, use mock data
    // In production, this would call: const response = await QuotesApi.getQuote(quoteId.value);

    // Mock quote data
    await new Promise(resolve => setTimeout(resolve, 800)) // Simulate API delay

    quoteData.value = {
      id: quoteId.value,
      status: 'draft',
      createdAt: new Date().toISOString(),
      customer: {
        name: '张先生',
        phone: '13800138000',
        wechat: 'zhangsan2024',
        email: 'zhang@example.com',
        province: '云南省',
        city: '昆明市',
        address: '五华区东风西路123号',
        type: 'individual',
        remark: '需要专业安装服务'
      },
      items: [
        {
          product_id: '1',
          product_name: '星牌台球桌',
          product_model: 'XW116-9A',
          sku_name: '标准版',
          quantity: 1,
          unit_price: 15800,
          total_price: 15800
        },
        {
          product_id: '2',
          product_name: '专业台球杆',
          product_model: 'Master Pro',
          quantity: 2,
          unit_price: 850,
          total_price: 1700
        }
      ],
      pricing: {
        subtotal: 17500,
        discount: {
          type: 'percentage',
          value: 5,
          amount: 875
        },
        tax: {
          rate: 13,
          amount: 2161.25,
          included: false
        },
        additionalCharges: {
          deliveryFee: 300,
          installationFee: 500,
          otherCharges: [],
          total: 800
        },
        finalTotal: 19586.25
      },
      quote: {
        quoteNumber: `YS-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-0001`,
        validityDays: 30,
        paymentTerms: 'immediate',
        specialTerms: '需要提前预约安装时间',
        notes: '所有产品均为全新正品，提供质保服务'
      }
    }
  } catch (err) {
    console.error('Failed to load quote data:', err)
    error.value = '加载报价单失败，请重试'
  } finally {
    loading.value = false
  }
}

// Computed properties
const getValidUntilDate = () => {
  if (!quoteData.value) return ''
  const validUntil = new Date(quoteData.value.createdAt)
  validUntil.setDate(validUntil.getDate() + quoteData.value.quote.validityDays)
  return validUntil.toLocaleDateString('zh-CN')
}

const getOtherChargesTotal = () => {
  if (!quoteData.value) return 0
  return quoteData.value.pricing.additionalCharges.otherCharges.reduce((sum, charge) => {
    if (charge.type === 'percentage') {
      return sum + (quoteData.value!.pricing.subtotal * charge.amount) / 100
    }
    return sum + charge.amount
  }, 0)
}

// Helper functions
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('zh-CN')
}

const formatPrice = (price: number) => {
  return price.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

const getStatusText = (status: string) => {
  const statusMap = {
    draft: '草稿',
    sent: '已发送',
    approved: '已确认',
    rejected: '已拒绝'
  }
  return statusMap[status] || '未知状态'
}

const getCustomerTypeText = (type: string) => {
  const typeMap = {
    individual: '个人客户',
    company: '企业客户',
    dealer: '经销商',
    club: '俱乐部'
  }
  return typeMap[type] || '未知类型'
}

const getPaymentTermsText = (terms: string) => {
  const termsMap = {
    immediate: '立即付款',
    '30days': '30天账期',
    '60days': '60天账期',
    cod: '货到付款'
  }
  return termsMap[terms] || '其他'
}

// Action handlers
const editQuote = () => {
  uni.navigateBack()
}

const printQuote = () => {
  // #ifdef H5
  window.print()
  // #endif

  // #ifndef H5
  uni.showToast({
    title: '请使用浏览器打开进行打印',
    icon: 'none'
  })
  // #endif
}

const saveQuote = async () => {
  try {
    saving.value = true

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))

    uni.showToast({
      title: '报价单保存成功',
      icon: 'success'
    })

    // Navigate to quote list or home
    setTimeout(() => {
      uni.navigateTo({
        url: '/pages/sales/history/index'
      })
    }, 1500)
  } catch (err) {
    uni.showToast({
      title: '保存失败，请重试',
      icon: 'none'
    })
  } finally {
    saving.value = false
  }
}

const sendQuote = () => {
  uni.showActionSheet({
    itemList: ['微信发送', '邮件发送', '短信发送', '复制链接'],
    success: res => {
      const actions = ['微信', '邮件', '短信', '链接']
      uni.showToast({
        title: `通过${actions[res.tapIndex]}发送`,
        icon: 'success'
      })
    }
  })
}

const handleLogoError = () => {
  console.warn('Company logo failed to load')
}
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.quote-preview {
  min-height: 100vh;
  background-color: $bg-color-page;
  padding-bottom: 200rpx; // Space for action buttons
}

// Loading & Error States
.loading-container,
.error-container {
  @include flex-center;
  flex-direction: column;
  padding: $spacing-xl 0;
  margin-top: calc(44px + var(--status-bar-height, 0) + #{$spacing-base});
}

.loading-spinner {
  width: 40rpx;
  height: 40rpx;
  border: 3rpx solid #e0e0e0;
  border-top-color: $primary-color;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: $spacing-base;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-text,
.error-text {
  font-size: $font-size-base;
  color: $text-color-secondary;
  margin-bottom: $spacing-lg;
}

// Quote Document
.quote-document {
  background-color: $bg-color-white;
  border-radius: $border-radius-lg;
  margin: calc(44px + var(--status-bar-height, 0) + #{$spacing-base}) $spacing-base $spacing-base;
  box-shadow: $box-shadow-light;
  overflow: hidden;
}

// Document Header
.document-header {
  padding: $spacing-xl;
  border-bottom: 2px solid $border-color;
}

.header-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: $spacing-lg;
}

.company-section {
  display: flex;
  align-items: flex-start;
  gap: $spacing-base;
  flex: 1;
}

.company-logo {
  width: 80rpx;
  height: 80rpx;
  border-radius: $border-radius-base;
}

.company-info {
  flex: 1;
}

.company-name {
  display: block;
  font-size: $font-size-large;
  font-weight: $font-weight-bold;
  color: $text-color;
  margin-bottom: $spacing-xs;
}

.company-subtitle,
.company-contact,
.company-address {
  display: block;
  font-size: $font-size-small;
  color: $text-color-secondary;
  margin-bottom: 4rpx;
}

.quote-info {
  text-align: right;
  min-width: 200rpx;
}

.quote-title {
  display: block;
  font-size: $font-size-extra-large;
  font-weight: $font-weight-bold;
  color: $primary-color;
  margin-bottom: $spacing-xs;
}

.quote-number {
  display: block;
  font-size: $font-size-large;
  font-weight: $font-weight-semibold;
  color: $text-color;
  margin-bottom: $spacing-base;
}

.quote-meta {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.meta-item {
  font-size: $font-size-small;
  color: $text-color-secondary;
}

.quote-status {
  padding: 4rpx 12rpx;
  border-radius: 16rpx;
  font-size: $font-size-small;
  font-weight: $font-weight-medium;
  text-align: center;
  margin-top: $spacing-xs;

  &.status-draft {
    background-color: $warning-bg;
    color: $warning-color;
  }

  &.status-sent {
    background-color: $info-bg;
    color: $info-color;
  }

  &.status-approved {
    background-color: $success-bg;
    color: $success-color;
  }

  &.status-rejected {
    background-color: $danger-bg;
    color: $danger-color;
  }
}

// Info Section
.info-section {
  padding: $spacing-lg $spacing-xl;
  border-bottom: 1px solid $border-color-lighter;
}

.info-card {
  background-color: $bg-color-page;
  border-radius: $border-radius-base;
  padding: $spacing-lg;
}

.info-title {
  display: block;
  font-size: $font-size-large;
  font-weight: $font-weight-semibold;
  color: $text-color;
  margin-bottom: $spacing-base;
  padding-bottom: $spacing-sm;
  border-bottom: 1px solid $border-color-lighter;
}

.info-content {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}

.info-row {
  display: flex;
  align-items: flex-start;
  gap: $spacing-base;
}

.info-label {
  min-width: 120rpx;
  font-size: $font-size-base;
  color: $text-color-secondary;
  font-weight: $font-weight-medium;
}

.info-value {
  flex: 1;
  font-size: $font-size-base;
  color: $text-color;
}

// Products Section
.products-section {
  padding: $spacing-lg $spacing-xl;
  border-bottom: 1px solid $border-color-lighter;
}

.section-title {
  display: block;
  font-size: $font-size-large;
  font-weight: $font-weight-semibold;
  color: $text-color;
  margin-bottom: $spacing-lg;
}

.products-table {
  background-color: $bg-color-white;
  border-radius: $border-radius-base;
  overflow: hidden;
  border: 1px solid $border-color-lighter;
}

.table-header {
  display: grid;
  grid-template-columns: 2fr 1.5fr 1fr 1fr 1fr;
  background-color: $bg-color-page;
  padding: $spacing-base $spacing-sm;
  gap: $spacing-base;
  border-bottom: 1px solid $border-color;
}

.header-cell {
  font-size: $font-size-base;
  font-weight: $font-weight-semibold;
  color: $text-color;
  text-align: center;

  &.product-name {
    text-align: left;
  }
}

.table-row {
  display: grid;
  grid-template-columns: 2fr 1.5fr 1fr 1fr 1fr;
  padding: $spacing-base $spacing-sm;
  gap: $spacing-base;
  border-bottom: 1px solid $border-color-lighter;

  &:last-child {
    border-bottom: none;
  }

  &:nth-child(even) {
    background-color: rgba(0, 0, 0, 0.02);
  }
}

.table-cell {
  display: flex;
  flex-direction: column;
  justify-content: center;
  text-align: center;

  &.product-name {
    text-align: left;
  }
}

.cell-title {
  font-size: $font-size-base;
  font-weight: $font-weight-medium;
  color: $text-color;
  margin-bottom: 4rpx;
}

.cell-content {
  font-size: $font-size-base;
  color: $text-color;
}

.cell-sku {
  font-size: $font-size-small;
  color: $text-color-secondary;
  margin-top: 4rpx;
}

.cell-total {
  font-size: $font-size-base;
  font-weight: $font-weight-semibold;
  color: $danger-color;
}

// Summary Section
.summary-section {
  padding: $spacing-lg $spacing-xl;
  border-bottom: 1px solid $border-color-lighter;
}

.summary-card {
  background-color: $bg-color-page;
  border-radius: $border-radius-base;
  padding: $spacing-lg;
}

.summary-title {
  display: block;
  font-size: $font-size-large;
  font-weight: $font-weight-semibold;
  color: $text-color;
  margin-bottom: $spacing-base;
  padding-bottom: $spacing-sm;
  border-bottom: 1px solid $border-color-lighter;
}

.summary-rows {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}

.summary-row {
  @include flex-between;
  padding: $spacing-sm 0;

  &.discount-row {
    .summary-value {
      color: $success-color;
    }
  }

  &.subtotal-row {
    padding-top: $spacing-base;
    border-top: 1px solid $border-color-lighter;
    margin-top: $spacing-xs;
  }

  &.total-row {
    padding: $spacing-base 0;
    border-top: 2px solid $primary-color;
    margin-top: $spacing-base;

    .summary-label,
    .summary-value {
      font-size: $font-size-large;
      font-weight: $font-weight-bold;
    }
  }
}

.summary-label {
  font-size: $font-size-base;
  color: $text-color-secondary;
}

.summary-value {
  font-size: $font-size-base;
  font-weight: $font-weight-semibold;
  color: $text-color;

  &.discount-value {
    color: $success-color;
  }

  &.total-value {
    color: $danger-color;
  }
}

.discount-detail {
  font-size: $font-size-small;
  color: $text-color-placeholder;
  margin-left: $spacing-xs;
}

// Terms Section
.terms-section {
  padding: $spacing-lg $spacing-xl;
  border-bottom: 1px solid $border-color-lighter;
}

.terms-content {
  background-color: $bg-color-page;
  border-radius: $border-radius-base;
  padding: $spacing-lg;
}

.terms-row {
  display: flex;
  align-items: flex-start;
  gap: $spacing-base;
  margin-bottom: $spacing-base;

  &:last-child {
    margin-bottom: 0;
  }
}

.terms-label {
  min-width: 120rpx;
  font-size: $font-size-base;
  font-weight: $font-weight-medium;
  color: $text-color;
}

.terms-value {
  flex: 1;
  font-size: $font-size-base;
  color: $text-color;
}

.standard-terms {
  margin-top: $spacing-lg;
  padding-top: $spacing-lg;
  border-top: 1px solid $border-color-lighter;
}

.terms-title {
  display: block;
  font-size: $font-size-base;
  font-weight: $font-weight-semibold;
  color: $text-color;
  margin-bottom: $spacing-base;
}

.terms-text {
  display: block;
  font-size: $font-size-small;
  color: $text-color-secondary;
  line-height: 1.6;
  margin-bottom: $spacing-sm;

  &:last-child {
    margin-bottom: 0;
  }
}

// Document Footer
.document-footer {
  padding: $spacing-xl;
}

.signature-section {
  display: flex;
  justify-content: space-between;
  gap: $spacing-xl;
  margin-bottom: $spacing-xl;
}

.signature-block {
  flex: 1;
  text-align: center;
}

.signature-label {
  display: block;
  font-size: $font-size-base;
  color: $text-color;
  margin-bottom: $spacing-base;
}

.signature-line {
  height: 1px;
  background-color: $border-color;
  margin: 0 $spacing-base $spacing-base;
}

.signature-date {
  font-size: $font-size-small;
  color: $text-color-secondary;
}

.footer-info {
  text-align: center;
  padding: $spacing-lg;
  background-color: $bg-color-page;
  border-radius: $border-radius-base;
}

.footer-text {
  font-size: $font-size-base;
  color: $primary-color;
  font-weight: $font-weight-medium;
}

// Action Buttons
.quote-actions {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: $bg-color-white;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.08);
  padding: $spacing-base;
  padding-bottom: calc(#{$spacing-base} + env(safe-area-inset-bottom));
  z-index: $z-index-fixed;
}

.actions-row {
  display: flex;
  gap: $spacing-sm;
  margin-bottom: $spacing-sm;

  &:last-child {
    margin-bottom: 0;
  }
}

// Print Styles
@media print {
  .quote-preview {
    background-color: white;
    padding-bottom: 0;
  }

  .quote-document {
    margin: 0;
    box-shadow: none;
    border-radius: 0;
  }

  .quote-actions {
    display: none;
  }

  .document-header {
    page-break-after: avoid;
  }

  .products-section {
    page-break-inside: avoid;
  }

  .summary-section {
    page-break-before: avoid;
  }
}

// Responsive Design
@media (max-width: 768px) {
  .header-row {
    flex-direction: column;
    gap: $spacing-base;
  }

  .quote-info {
    text-align: left;
  }

  .table-header,
  .table-row {
    grid-template-columns: 1fr;
    gap: $spacing-sm;
  }

  .header-cell,
  .table-cell {
    text-align: left;
    border-bottom: 1px solid $border-color-lighter;
    padding-bottom: $spacing-xs;

    &:last-child {
      border-bottom: none;
    }
  }

  .table-cell {
    &::before {
      content: attr(data-label);
      font-weight: $font-weight-semibold;
      color: $text-color-secondary;
      display: block;
      margin-bottom: 4rpx;
    }
  }

  .signature-section {
    flex-direction: column;
    gap: $spacing-lg;
  }
}

@media (min-width: 1024px) {
  .quote-document {
    max-width: 800px;
    margin-left: auto;
    margin-right: auto;
  }
}
</style>
