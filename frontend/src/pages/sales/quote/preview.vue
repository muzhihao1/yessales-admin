<template>
  <div class="quote-preview">
    <SalesHeader title="报价单预览" :show-back="true" :fixed="true" />

    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <span class="loading-text">加载报价单...</span>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-container">
      <span class="error-text">{{ error }}</span>
      <SalesButton @click="loadQuoteData">重试</SalesButton>
    </div>

    <!-- Quote Document -->
    <div v-else-if="quoteData" class="quote-document">
      <!-- Document Header -->
      <div class="document-header">
        <div class="header-row">
          <div class="company-section">
            <img
              class="company-logo"
              src="/logo.svg"
                            @error="handleLogoError"
            />
            <div class="company-info">
              <span class="company-name">耶氏台球斗南销售中心</span>
              <span class="company-subtitle">专业台球设备供应商</span>
              <span class="company-contact">电话：400-888-8888</span>
              <span class="company-address">地址：昆明市斗南花卉市场</span>
            </div>
          </div>

          <div class="quote-info">
            <span class="quote-title">报价单</span>
            <span class="quote-number">{{ quoteData.quote.quoteNumber }}</span>
            <div class="quote-meta">
              <span class="meta-item">日期：{{ formatDate(quoteData.createdAt) }}</span>
              <span class="meta-item">有效期至：{{ getValidUntilDate() }}</span>
              <div class="quote-status" :class="`status-${quoteData.status || 'draft'}`">
                {{ getStatusText(quoteData.status || 'draft') }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Customer & Company Info -->
      <div class="info-section">
        <div class="info-card">
          <span class="info-title">客户信息</span>
          <div class="info-content">
            <div class="info-row">
              <span class="info-label">客户姓名</span>
              <span class="info-value">{{ quoteData.customer.name }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">联系电话</span>
              <span class="info-value">{{ quoteData.customer.phone }}</span>
            </div>
            <div v-if="quoteData.customer.wechat" class="info-row">
              <span class="info-label">微信号</span>
              <span class="info-value">{{ quoteData.customer.wechat }}</span>
            </div>
            <div v-if="quoteData.customer.email" class="info-row">
              <span class="info-label">邮箱</span>
              <span class="info-value">{{ quoteData.customer.email }}</span>
            </div>
            <div v-if="quoteData.customer.address" class="info-row">
              <span class="info-label">地址</span>
              <span class="info-value">
                {{ quoteData.customer.province }}{{ quoteData.customer.city
                }}{{ quoteData.customer.address }}
              </span>
            </div>
            <div class="info-row">
              <span class="info-label">客户类型</span>
              <span class="info-value">{{ getCustomerTypeText(quoteData.customer.type) }}</span>
            </div>
            <div v-if="quoteData.customer.remark" class="info-row">
              <span class="info-label">备注</span>
              <span class="info-value">{{ quoteData.customer.remark }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Products Table -->
      <div class="products-section">
        <span class="section-title">产品明细</span>

        <div class="products-table">
          <!-- Table Header -->
          <div class="table-header">
            <span class="header-cell product-name">产品名称</span>
            <span class="header-cell product-model">型号规格</span>
            <span class="header-cell product-quantity">数量</span>
            <span class="header-cell product-price">单价</span>
            <span class="header-cell product-total">小计</span>
          </div>

          <!-- Table Rows -->
          <div v-for="(item, index) in quoteData.items" :key="index" class="table-row">
            <div class="table-cell product-name">
              <span class="cell-title">{{ item.product_name }}</span>
            </div>
            <div class="table-cell product-model">
              <span class="cell-content">{{ item.product_model }}</span>
              <span v-if="item.sku_name" class="cell-sku">{{ item.sku_name }}</span>
            </div>
            <div class="table-cell product-quantity">
              <span class="cell-content">{{ item.quantity }}</span>
            </div>
            <div class="table-cell product-price">
              <span class="cell-content">¥{{ formatPrice(item.unit_price) }}</span>
            </div>
            <div class="table-cell product-total">
              <span class="cell-total">¥{{ formatPrice(item.total_price) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Price Summary -->
      <div class="summary-section">
        <div class="summary-card">
          <span class="summary-title">价格汇总</span>

          <div class="summary-rows">
            <div class="summary-row">
              <span class="summary-label">产品小计</span>
              <span class="summary-value">¥{{ formatPrice(quoteData.pricing.subtotal) }}</span>
            </div>

            <div v-if="quoteData.pricing.discount.amount > 0" class="summary-row discount-row">
              <span class="summary-label">
                折扣优惠
                <span class="discount-detail">
                  ({{
                    quoteData.pricing.discount.type === 'percentage'
                      ? `${quoteData.pricing.discount.value}%`
                      : `¥${formatPrice(quoteData.pricing.discount.value)}`
                  }})
                </span>
              </span>
              <span class="summary-value discount-value"
                >-¥{{ formatPrice(quoteData.pricing.discount.amount) }}</span
              >
            </div>

            <div class="summary-row subtotal-row">
              <span class="summary-label">折扣后小计</span>
              <span class="summary-value"
                >¥{{
                  formatPrice(quoteData.pricing.subtotal - quoteData.pricing.discount.amount)
                }}</span
              >
            </div>

            <div v-if="quoteData.pricing.additionalCharges.deliveryFee > 0" class="summary-row">
              <span class="summary-label">配送费</span>
              <span class="summary-value"
                >+¥{{ formatPrice(quoteData.pricing.additionalCharges.deliveryFee) }}</span
              >
            </div>

            <div
              v-if="quoteData.pricing.additionalCharges.installationFee > 0"
              class="summary-row"
            >
              <span class="summary-label">安装费</span>
              <span class="summary-value"
                >+¥{{ formatPrice(quoteData.pricing.additionalCharges.installationFee) }}</span
              >
            </div>

            <div
              v-if="quoteData.pricing.additionalCharges.otherCharges.length > 0"
              class="summary-row"
            >
              <span class="summary-label">其他费用</span>
              <span class="summary-value">+¥{{ formatPrice(getOtherChargesTotal()) }}</span>
            </div>

            <div v-if="quoteData.pricing.tax.amount > 0" class="summary-row">
              <span class="summary-label">税费 ({{ quoteData.pricing.tax.rate }}%)</span>
              <span class="summary-value">+¥{{ formatPrice(quoteData.pricing.tax.amount) }}</span>
            </div>

            <div class="summary-row total-row">
              <span class="summary-label">合计金额</span>
              <span class="summary-value total-value"
                >¥{{ formatPrice(quoteData.pricing.finalTotal) }}</span
              >
            </div>
          </div>
        </div>
      </div>

      <!-- Terms & Conditions -->
      <div class="terms-section">
        <span class="section-title">付款条件与说明</span>

        <div class="terms-content">
          <div class="terms-row">
            <span class="terms-label">付款条件：</span>
            <span class="terms-value">{{ getPaymentTermsText(quoteData.quote.paymentTerms) }}</span>
          </div>

          <div v-if="quoteData.quote.specialTerms" class="terms-row">
            <span class="terms-label">特殊条款：</span>
            <span class="terms-value">{{ quoteData.quote.specialTerms }}</span>
          </div>

          <div v-if="quoteData.quote.notes" class="terms-row">
            <span class="terms-label">备注说明：</span>
            <span class="terms-value">{{ quoteData.quote.notes }}</span>
          </div>

          <div class="standard-terms">
            <span class="terms-title">标准条款：</span>
            <span class="terms-text"
              >1. 本报价单有效期为 {{ quoteData.quote.validityDays }} 天。</span
            >
            <span class="terms-text">2. 产品价格以报价单确认时为准，如有变动以书面通知为准。</span>
            <span class="terms-text">3. 配送及安装服务需提前预约，具体时间双方协商确定。</span>
            <span class="terms-text">4. 产品质量保证按照国家相关标准执行。</span>
          </div>
        </div>
      </div>

      <!-- Document Footer -->
      <div class="document-footer">
        <div class="signature-section">
          <div class="signature-block">
            <span class="signature-label">销售代表：</span>
            <div class="signature-line"></div>
            <span class="signature-date">日期：________________</span>
          </div>

          <div class="signature-block">
            <span class="signature-label">客户确认：</span>
            <div class="signature-line"></div>
            <span class="signature-date">日期：________________</span>
          </div>
        </div>

        <div class="footer-info">
          <span class="footer-text"
            >感谢您选择耶氏台球设备，我们将为您提供最优质的产品和服务！</span
          >
        </div>
      </div>
    </div>

    <!-- Action Buttons -->
    <div v-if="quoteData && !loading" class="quote-actions">
      <div class="actions-row">
        <SalesButton type="default" @click="editQuote"> 编辑报价 </SalesButton>

        <SalesButton type="plain" @click="printQuote"> 打印报价 </SalesButton>

        <SalesButton type="primary" @click="saveQuote" :loading="saving"> 保存报价 </SalesButton>
      </div>

      <div class="actions-row">
        <SalesButton type="success" :block="true" @click="sendQuote"> 发送给客户 </SalesButton>
      </div>
    </div>
  </div>
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
  window.history.back()
}

const printQuote = () => {
  // Web implementation - directly use browser print
  if (window.print) {
    window.print()
  } else {
    console.warn('请使用浏览器打开进行打印')
    alert('请使用浏览器打开进行打印')
  }
}

const saveQuote = async () => {
  try {
    saving.value = true

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))

    console.log('报价单保存成功')
    alert('报价单保存成功')

    // Navigate to quote list or home
    setTimeout(() => {
      window.location.href = '/pages/sales/history/index'
    }, 1500)
  } catch (err) {
    console.error('保存失败，请重试')
    alert('保存失败，请重试')
  } finally {
    saving.value = false
  }
}

const sendQuote = () => {
  const options = ['微信发送', '邮件发送', '短信发送', '复制链接']
  const actions = ['微信', '邮件', '短信', '链接']
  
  // Simple implementation using prompts for web
  const optionsText = options.map((option, index) => `${index + 1}. ${option}`).join('\n')
  const userChoice = prompt(`请选择发送方式:\n${optionsText}\n\n请输入选项编号 (1-4):`)
  
  if (userChoice) {
    const choiceIndex = parseInt(userChoice) - 1
    if (choiceIndex >= 0 && choiceIndex < actions.length) {
      console.log(`通过${actions[choiceIndex]}发送`)
      alert(`通过${actions[choiceIndex]}发送`)
    } else {
      alert('无效的选择')
    }
  }
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
