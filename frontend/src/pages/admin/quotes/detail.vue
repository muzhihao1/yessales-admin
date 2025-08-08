<template>
  <view class="quote-detail-page">
    <!-- Loading state -->
    <view v-if="loading" class="loading-container">
      <text class="loading-text">加载中...</text>
    </view>

    <!-- Error state -->
    <view v-else-if="error" class="error-container">
      <text class="error-text">{{ error }}</text>
      <button class="retry-btn" @click="loadQuote">重试</button>
    </view>

    <!-- Quote details -->
    <view v-else-if="quote" class="quote-content">
      <!-- Header -->
      <view class="detail-header">
        <view class="header-info">
          <text class="quote-number">{{ quote.quote_number }}</text>
          <view :class="['status-badge', `status-${quote.status}`]">
            <text>{{ getStatusLabel(quote.status) }}</text>
          </view>
        </view>
        <view class="header-actions">
          <button
            v-if="quote.status === 'submitted'"
            class="action-btn action-approve"
            @click="handleApprove"
          >
            批准报价
          </button>
          <button
            v-if="quote.status === 'submitted'"
            class="action-btn action-reject"
            @click="handleReject"
          >
            拒绝报价
          </button>
          <button
            v-if="quote.status === 'draft'"
            class="action-btn action-edit"
            @click="handleEdit"
          >
            编辑报价
          </button>
          <button class="action-btn action-print" @click="handlePrint">打印报价单</button>
        </view>
      </view>

      <!-- Customer Information -->
      <view class="detail-section">
        <text class="section-title">客户信息</text>
        <view class="info-grid">
          <view class="info-item">
            <text class="info-label">客户姓名</text>
            <text class="info-value">{{ quote.customer_name }}</text>
          </view>
          <view class="info-item">
            <text class="info-label">联系电话</text>
            <text class="info-value">{{ quote.customer_phone }}</text>
          </view>
          <view class="info-item">
            <text class="info-label">电子邮箱</text>
            <text class="info-value">{{ quote.customer_email || '-' }}</text>
          </view>
          <view class="info-item">
            <text class="info-label">公司名称</text>
            <text class="info-value">{{ quote.customer_company || '-' }}</text>
          </view>
          <view class="info-item">
            <text class="info-label">送货地址</text>
            <text class="info-value">{{ quote.delivery_address || '-' }}</text>
          </view>
        </view>
      </view>

      <!-- Product Items -->
      <view class="detail-section">
        <text class="section-title">产品明细</text>
        <view class="products-table">
          <view class="table-header">
            <text class="col col-product">产品</text>
            <text class="col col-quantity">数量</text>
            <text class="col col-price">单价</text>
            <text class="col col-subtotal">小计</text>
          </view>
          <view v-for="item in quote.items" :key="item.id" class="table-row">
            <view class="col col-product">
              <text class="product-name">{{ item.product_name }}</text>
              <text class="product-sku">SKU: {{ item.product_sku }}</text>
            </view>
            <text class="col col-quantity">{{ item.quantity }}</text>
            <text class="col col-price">¥{{ formatAmount(item.unit_price) }}</text>
            <text class="col col-subtotal">¥{{ formatAmount(item.subtotal) }}</text>
          </view>
        </view>
      </view>

      <!-- Summary -->
      <view class="detail-section">
        <view class="summary-grid">
          <view class="summary-item">
            <text class="summary-label">小计</text>
            <text class="summary-value">¥{{ formatAmount(quote.subtotal) }}</text>
          </view>
          <view class="summary-item">
            <text class="summary-label">税额 ({{ (quote.tax_rate * 100).toFixed(0) }}%)</text>
            <text class="summary-value">¥{{ formatAmount(quote.tax_amount) }}</text>
          </view>
          <view class="summary-item summary-total">
            <text class="summary-label">总计</text>
            <text class="summary-value">¥{{ formatAmount(quote.total_amount) }}</text>
          </view>
        </view>
      </view>

      <!-- Notes -->
      <view v-if="quote.notes" class="detail-section">
        <text class="section-title">备注信息</text>
        <text class="notes-content">{{ quote.notes }}</text>
      </view>

      <!-- Terms and Conditions -->
      <view v-if="quote.terms_conditions" class="detail-section">
        <text class="section-title">条款和条件</text>
        <text class="terms-content">{{ quote.terms_conditions }}</text>
      </view>

      <!-- Timeline -->
      <view class="detail-section">
        <text class="section-title">时间线</text>
        <view class="timeline">
          <view class="timeline-item">
            <view class="timeline-dot"></view>
            <view class="timeline-content">
              <text class="timeline-title">创建时间</text>
              <text class="timeline-date">{{ formatDateTime(quote.created_at) }}</text>
              <text class="timeline-user">{{ quote.created_by_name || '系统' }}</text>
            </view>
          </view>
          <view v-if="quote.submitted_at" class="timeline-item">
            <view class="timeline-dot"></view>
            <view class="timeline-content">
              <text class="timeline-title">提交审批</text>
              <text class="timeline-date">{{ formatDateTime(quote.submitted_at) }}</text>
            </view>
          </view>
          <view v-if="quote.approved_at" class="timeline-item">
            <view class="timeline-dot timeline-dot-success"></view>
            <view class="timeline-content">
              <text class="timeline-title">批准通过</text>
              <text class="timeline-date">{{ formatDateTime(quote.approved_at) }}</text>
              <text class="timeline-user">{{ quote.approved_by_name || '系统' }}</text>
            </view>
          </view>
          <view v-if="quote.rejected_at" class="timeline-item">
            <view class="timeline-dot timeline-dot-danger"></view>
            <view class="timeline-content">
              <text class="timeline-title">拒绝审批</text>
              <text class="timeline-date">{{ formatDateTime(quote.rejected_at) }}</text>
              <text class="timeline-user">{{ quote.rejected_by_name || '系统' }}</text>
              <text v-if="quote.rejection_reason" class="timeline-reason">
                原因：{{ quote.rejection_reason }}
              </text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- Reject Modal -->
    <modal
      v-model:visible="showRejectModal"
      title="拒绝报价单"
      @confirm="confirmReject"
      @cancel="cancelReject"
    >
      <view class="reject-modal">
        <text class="modal-label">拒绝原因（可选）：</text>
        <textarea
          v-model="rejectReason"
          class="reject-textarea"
          placeholder="请输入拒绝原因..."
          maxlength="200"
        />
      </view>
    </modal>
  </view>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuotesStore } from '@/stores/quotes'
import type { Quote } from '@/types/quote'

const route = useRoute()
const router = useRouter()
const quotesStore = useQuotesStore()

// State
const quote = ref<Quote | null>(null)
const loading = ref(false)
const error = ref('')
const showRejectModal = ref(false)
const rejectReason = ref('')

// Load quote on mount
onMounted(() => {
  const id = route.query.id as string
  if (id) {
    loadQuote(id)
  } else {
    error.value = '报价单ID不存在'
  }
})

// Load quote details
async function loadQuote(id?: string) {
  const quoteId = id || (route.query.id as string)
  if (!quoteId) {
    error.value = '报价单ID不存在'
    return
  }

  loading.value = true
  error.value = ''

  try {
    const data = await quotesStore.fetchQuoteById(quoteId)
    quote.value = data
  } catch (err) {
    error.value = '加载报价单失败，请重试'
    console.error('Failed to load quote:', err)
  } finally {
    loading.value = false
  }
}

// Handle actions
function handleEdit() {
  if (!quote.value) return
  uni.navigateTo({
    url: `/pages/admin/quotes/edit?id=${quote.value.id}`
  })
}

async function handleApprove() {
  if (!quote.value) return

  uni.showModal({
    title: '确认批准',
    content: `确定要批准报价单 ${quote.value.quote_number} 吗？`,
    success: async res => {
      if (res.confirm) {
        try {
          await quotesStore.approveQuote(quote.value!.id)
          uni.showToast({
            title: '批准成功',
            icon: 'success'
          })
          // Reload quote to get updated status
          loadQuote()
        } catch (error) {
          uni.showToast({
            title: '批准失败',
            icon: 'none'
          })
        }
      }
    }
  })
}

function handleReject() {
  rejectReason.value = ''
  showRejectModal.value = true
}

async function confirmReject() {
  if (!quote.value) return

  try {
    await quotesStore.rejectQuote(quote.value.id, rejectReason.value)
    uni.showToast({
      title: '拒绝成功',
      icon: 'success'
    })
    showRejectModal.value = false
    // Reload quote to get updated status
    loadQuote()
  } catch (error) {
    uni.showToast({
      title: '拒绝失败',
      icon: 'none'
    })
  }
}

function cancelReject() {
  showRejectModal.value = false
  rejectReason.value = ''
}

function handlePrint() {
  // TODO: Implement print functionality
  uni.showToast({
    title: '打印功能开发中',
    icon: 'none'
  })
}

// Utility functions
function formatAmount(amount: number): string {
  return amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

function formatDateTime(date: string): string {
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function getStatusLabel(status: string): string {
  const statusMap: Record<string, string> = {
    draft: '草稿',
    submitted: '待审批',
    approved: '已批准',
    rejected: '已拒绝'
  }
  return statusMap[status] || status
}
</script>

<style lang="scss">
@import '@/styles/variables.scss';

.quote-detail-page {
  min-height: 100vh;
  background-color: $bg-color;
  padding: 20px;

  .loading-container,
  .error-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 400px;
    gap: 16px;

    .loading-text {
      font-size: 16px;
      color: $text-color-secondary;
    }

    .error-text {
      font-size: 16px;
      color: $danger-color;
    }

    .retry-btn {
      padding: 10px 20px;
      background: $primary-color;
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      cursor: pointer;
    }
  }

  .quote-content {
    max-width: 1200px;
    margin: 0 auto;

    .detail-header {
      background: white;
      padding: 24px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;

      .header-info {
        display: flex;
        align-items: center;
        gap: 16px;

        .quote-number {
          font-size: 24px;
          font-weight: 600;
          color: $text-color;
        }

        .status-badge {
          display: inline-flex;
          padding: 6px 16px;
          border-radius: 4px;
          font-size: 14px;
          font-weight: 500;

          &.status-draft {
            background: #f0f0f0;
            color: #666;
          }

          &.status-submitted {
            background: #fff3cd;
            color: #856404;
          }

          &.status-approved {
            background: #d4edda;
            color: #155724;
          }

          &.status-rejected {
            background: #f8d7da;
            color: #721c24;
          }
        }
      }

      .header-actions {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;

        .action-btn {
          padding: 10px 20px;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;

          &.action-approve {
            background: $success-color;
            color: white;

            &:hover {
              background: darken($success-color, 10%);
            }
          }

          &.action-reject {
            background: $danger-color;
            color: white;

            &:hover {
              background: darken($danger-color, 10%);
            }
          }

          &.action-edit {
            background: $primary-color;
            color: white;

            &:hover {
              background: darken($primary-color, 10%);
            }
          }

          &.action-print {
            background: white;
            color: $text-color;
            border: 1px solid $border-color;

            &:hover {
              background: #f5f5f5;
            }
          }
        }
      }
    }

    .detail-section {
      background: white;
      padding: 24px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      margin-bottom: 20px;

      .section-title {
        font-size: 18px;
        font-weight: 600;
        color: $text-color;
        margin-bottom: 20px;
        display: block;
      }

      .info-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 20px;

        .info-item {
          display: flex;
          flex-direction: column;
          gap: 8px;

          .info-label {
            font-size: 13px;
            color: $text-color-secondary;
          }

          .info-value {
            font-size: 15px;
            color: $text-color;
            font-weight: 500;
          }
        }
      }

      .products-table {
        .table-header {
          display: flex;
          padding: 12px 16px;
          background: #f8f9fa;
          border-radius: 6px 6px 0 0;
          font-weight: 600;
          font-size: 14px;
          color: $text-color-secondary;
        }

        .table-row {
          display: flex;
          padding: 16px;
          border-bottom: 1px solid $border-color;
          align-items: center;

          &:last-child {
            border-bottom: none;
          }
        }

        .col {
          &.col-product {
            flex: 2;
            display: flex;
            flex-direction: column;
            gap: 4px;

            .product-name {
              font-weight: 500;
              color: $text-color;
            }

            .product-sku {
              font-size: 12px;
              color: $text-color-secondary;
            }
          }

          &.col-quantity,
          &.col-price,
          &.col-subtotal {
            flex: 1;
            text-align: right;
          }

          &.col-quantity {
            color: $text-color-secondary;
          }

          &.col-price,
          &.col-subtotal {
            font-weight: 500;
            color: $text-color;
          }
        }
      }

      .summary-grid {
        display: flex;
        flex-direction: column;
        gap: 12px;
        max-width: 400px;
        margin-left: auto;

        .summary-item {
          display: flex;
          justify-content: space-between;
          align-items: center;

          .summary-label {
            font-size: 14px;
            color: $text-color-secondary;
          }

          .summary-value {
            font-size: 16px;
            font-weight: 500;
            color: $text-color;
          }

          &.summary-total {
            padding-top: 12px;
            border-top: 2px solid $border-color;

            .summary-label {
              font-size: 16px;
              font-weight: 600;
              color: $text-color;
            }

            .summary-value {
              font-size: 20px;
              font-weight: 600;
              color: $primary-color;
            }
          }
        }
      }

      .notes-content,
      .terms-content {
        font-size: 14px;
        line-height: 1.6;
        color: $text-color;
        white-space: pre-wrap;
      }

      .timeline {
        position: relative;
        padding-left: 30px;

        &::before {
          content: '';
          position: absolute;
          left: 8px;
          top: 8px;
          bottom: 8px;
          width: 2px;
          background: $border-color;
        }

        .timeline-item {
          position: relative;
          margin-bottom: 24px;

          &:last-child {
            margin-bottom: 0;
          }

          .timeline-dot {
            position: absolute;
            left: -26px;
            top: 4px;
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: white;
            border: 3px solid $primary-color;

            &.timeline-dot-success {
              border-color: $success-color;
            }

            &.timeline-dot-danger {
              border-color: $danger-color;
            }
          }

          .timeline-content {
            display: flex;
            flex-direction: column;
            gap: 4px;

            .timeline-title {
              font-weight: 500;
              color: $text-color;
            }

            .timeline-date {
              font-size: 14px;
              color: $text-color-secondary;
            }

            .timeline-user {
              font-size: 13px;
              color: $text-color-secondary;
            }

            .timeline-reason {
              font-size: 14px;
              color: $danger-color;
              margin-top: 4px;
            }
          }
        }
      }
    }
  }

  // Reject modal
  .reject-modal {
    padding: 20px 0;

    .modal-label {
      display: block;
      margin-bottom: 12px;
      font-size: 14px;
      color: $text-color;
    }

    .reject-textarea {
      width: 100%;
      min-height: 100px;
      padding: 12px;
      border: 1px solid $border-color;
      border-radius: 6px;
      font-size: 14px;
      resize: vertical;

      &:focus {
        border-color: $primary-color;
        outline: none;
      }
    }
  }
}

// Responsive design
@media (max-width: 768px) {
  .quote-detail-page {
    padding: 16px;

    .quote-content {
      .detail-header {
        flex-direction: column;
        align-items: flex-start;

        .header-actions {
          width: 100%;

          .action-btn {
            flex: 1;
          }
        }
      }

      .detail-section {
        padding: 16px;

        .products-table {
          overflow-x: auto;

          .table-header,
          .table-row {
            min-width: 600px;
          }
        }

        .summary-grid {
          max-width: 100%;
        }
      }
    }
  }
}
</style>
