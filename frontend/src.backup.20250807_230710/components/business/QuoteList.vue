<template>
  <view class="quote-list">
    <!-- Loading state -->
    <view v-if="loading" class="loading-container">
      <view class="loading-spinner"></view>
      <text class="loading-text">加载中...</text>
    </view>

    <!-- Empty state -->
    <view v-else-if="!quotes || quotes.length === 0" class="empty-container">
      <image 
        class="empty-icon" 
        src="/static/images/empty-quote.png" 
        mode="aspectFit"
      />
      <text class="empty-text">{{ emptyText || '暂无报价单' }}</text>
    </view>

    <!-- Quote list -->
    <view v-else class="quote-items">
      <view 
        v-for="quote in quotes" 
        :key="quote.id"
        class="quote-card"
        @click="handleQuoteClick(quote)"
      >
        <!-- Quote header -->
        <view class="quote-header">
          <view class="quote-number">{{ quote.quoteNumber }}</view>
          <view 
            class="quote-status"
            :class="`quote-status--${quote.status}`"
          >
            {{ getStatusText(quote.status) }}
          </view>
        </view>

        <!-- Customer info -->
        <view class="customer-info">
          <view class="customer-name">{{ quote.customerName }}</view>
          <view v-if="quote.companyName" class="company-name">{{ quote.companyName }}</view>
        </view>

        <!-- Quote details -->
        <view class="quote-details">
          <view class="detail-item">
            <text class="detail-label">产品数量：</text>
            <text class="detail-value">{{ quote.itemCount || 0 }}种</text>
          </view>
          <view class="detail-item">
            <text class="detail-label">总数量：</text>
            <text class="detail-value">{{ quote.totalQuantity || 0 }}件</text>
          </view>
        </view>

        <!-- Quote footer -->
        <view class="quote-footer">
          <view class="quote-date">
            <text class="date-label">创建时间：</text>
            <text class="date-value">{{ formatDate(quote.createdAt) }}</text>
          </view>
          <view class="quote-amount">
            <text class="amount-label">总金额：</text>
            <text class="amount-value">¥{{ formatAmount(quote.totalAmount) }}</text>
          </view>
        </view>

        <!-- Action buttons -->
        <view class="quote-actions" @click.stop>
          <button 
            v-if="showActions && (quote.status === 'draft' || quote.status === 'sent')"
            class="action-btn action-btn--edit"
            @click="handleEdit(quote)"
          >
            编辑
          </button>
          <button 
            v-if="showActions && quote.status === 'draft'"
            class="action-btn action-btn--send"
            @click="handleSend(quote)"
          >
            发送
          </button>
          <button 
            class="action-btn action-btn--view"
            @click="handleView(quote)"
          >
            查看
          </button>
        </view>
      </view>
    </view>

    <!-- Load more -->
    <view v-if="hasMore && !loading" class="load-more" @click="handleLoadMore">
      <text class="load-more-text">加载更多</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Quote } from '@/types/api'

interface Props {
  quotes?: Quote[]
  loading?: boolean
  emptyText?: string
  showActions?: boolean
  hasMore?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  quotes: () => [],
  loading: false,
  emptyText: '暂无报价单',
  showActions: true,
  hasMore: false
})

const emit = defineEmits<{
  click: [quote: Quote]
  edit: [quote: Quote]
  send: [quote: Quote]
  view: [quote: Quote]
  'load-more': []
}>()

const statusMap: Record<string, string> = {
  draft: '草稿',
  sent: '已发送',
  viewed: '已查看',
  confirmed: '已确认',
  rejected: '已拒绝',
  expired: '已过期'
}

const getStatusText = (status: string) => {
  return statusMap[status] || status
}

const formatDate = (dateString: string | undefined) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}`
}

const formatAmount = (amount: number | undefined) => {
  if (amount === undefined || amount === null) return '0.00'
  return amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

const handleQuoteClick = (quote: Quote) => {
  emit('click', quote)
}

const handleEdit = (quote: Quote) => {
  emit('edit', quote)
}

const handleSend = (quote: Quote) => {
  emit('send', quote)
}

const handleView = (quote: Quote) => {
  emit('view', quote)
}

const handleLoadMore = () => {
  emit('load-more')
}
</script>

<style scoped>
.quote-list {
  padding: 16rpx;
  background-color: #f5f5f5;
  min-height: 200rpx;
}

/* Loading state */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80rpx 0;
}

.loading-spinner {
  width: 40rpx;
  height: 40rpx;
  border: 3rpx solid #e0e0e0;
  border-top-color: #ff6b6b;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  margin-top: 20rpx;
  font-size: 28rpx;
  color: #999;
}

/* Empty state */
.empty-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100rpx 0;
}

.empty-icon {
  width: 200rpx;
  height: 200rpx;
  opacity: 0.6;
}

.empty-text {
  margin-top: 24rpx;
  font-size: 28rpx;
  color: #999;
}

/* Quote items */
.quote-items {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

/* Quote card */
.quote-card {
  background-color: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  cursor: pointer;
}

.quote-card:active {
  transform: scale(0.98);
}

/* Quote header */
.quote-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.quote-number {
  font-size: 32rpx;
  font-weight: 600;
  color: #1a1a1a;
}

.quote-status {
  padding: 8rpx 16rpx;
  border-radius: 20rpx;
  font-size: 24rpx;
  font-weight: 500;
}

.quote-status--draft {
  background-color: #f3f4f6;
  color: #6b7280;
}

.quote-status--sent {
  background-color: #e0f2fe;
  color: #0369a1;
}

.quote-status--viewed {
  background-color: #f3e8ff;
  color: #7c3aed;
}

.quote-status--confirmed {
  background-color: #d1fae5;
  color: #065f46;
}

.quote-status--rejected {
  background-color: #fee2e2;
  color: #dc2626;
}

.quote-status--expired {
  background-color: #fef3c7;
  color: #d97706;
}

/* Customer info */
.customer-info {
  margin-bottom: 16rpx;
}

.customer-name {
  font-size: 28rpx;
  font-weight: 500;
  color: #374151;
  margin-bottom: 4rpx;
}

.company-name {
  font-size: 24rpx;
  color: #6b7280;
}

/* Quote details */
.quote-details {
  display: flex;
  gap: 32rpx;
  margin-bottom: 16rpx;
}

.detail-item {
  display: flex;
  align-items: center;
}

.detail-label {
  font-size: 24rpx;
  color: #6b7280;
}

.detail-value {
  font-size: 24rpx;
  color: #1a1a1a;
  font-weight: 500;
}

/* Quote footer */
.quote-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16rpx;
  border-top: 1rpx solid #e5e7eb;
  margin-bottom: 16rpx;
}

.quote-date {
  display: flex;
  align-items: center;
}

.date-label {
  font-size: 24rpx;
  color: #6b7280;
}

.date-value {
  font-size: 24rpx;
  color: #374151;
}

.quote-amount {
  display: flex;
  align-items: baseline;
}

.amount-label {
  font-size: 24rpx;
  color: #6b7280;
  margin-right: 8rpx;
}

.amount-value {
  font-size: 32rpx;
  font-weight: 600;
  color: #ff6b6b;
}

/* Action buttons */
.quote-actions {
  display: flex;
  gap: 16rpx;
  justify-content: flex-end;
}

.action-btn {
  padding: 8rpx 24rpx;
  border-radius: 20rpx;
  font-size: 24rpx;
  font-weight: 500;
  border: none;
  transition: all 0.2s ease;
}

.action-btn--edit {
  background-color: #f3f4f6;
  color: #374151;
}

.action-btn--edit:active {
  background-color: #e5e7eb;
}

.action-btn--send {
  background-color: #ff6b6b;
  color: #fff;
}

.action-btn--send:active {
  background-color: #ff5252;
}

.action-btn--view {
  background-color: #e0f2fe;
  color: #0369a1;
}

.action-btn--view:active {
  background-color: #bae6fd;
}

/* Load more */
.load-more {
  display: flex;
  justify-content: center;
  padding: 32rpx 0;
}

.load-more-text {
  font-size: 28rpx;
  color: #6b7280;
  padding: 16rpx 32rpx;
  background-color: #f3f4f6;
  border-radius: 24rpx;
}

.load-more-text:active {
  background-color: #e5e7eb;
}

/* Responsive adjustments */
@media (min-width: 768px) {
  .quote-items {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20rpx;
  }
}

@media (min-width: 1024px) {
  .quote-items {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>