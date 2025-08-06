<template>
  <view class="product-list">
    <!-- Loading state -->
    <view v-if="loading" class="loading-container">
      <view class="loading-spinner"></view>
      <text class="loading-text">加载中...</text>
    </view>

    <!-- Empty state -->
    <view v-else-if="!products || products.length === 0" class="empty-container">
      <image 
        class="empty-icon" 
        src="/static/images/empty-product.png" 
        mode="aspectFit"
      />
      <text class="empty-text">{{ emptyText || '暂无产品' }}</text>
    </view>

    <!-- Product list -->
    <view v-else class="product-grid">
      <view 
        v-for="product in products" 
        :key="product.id"
        class="product-card"
        :class="{ 
          'product-card--selected': selectable && isSelected(product.id),
          'product-card--selectable': selectable 
        }"
        @click="handleProductClick(product)"
      >
        <!-- Selection checkbox -->
        <view v-if="selectable" class="product-checkbox">
          <view 
            class="checkbox-icon"
            :class="{ 'checkbox-icon--checked': isSelected(product.id) }"
          >
            <text v-if="isSelected(product.id)" class="checkbox-check">✓</text>
          </view>
        </view>

        <!-- Product image -->
        <view class="product-image-container">
          <image 
            class="product-image" 
            :src="product.image || '/static/images/default-product.png'"
            mode="aspectFill"
            @error="handleImageError($event, product)"
          />
          <view v-if="product.isNew" class="product-badge">新品</view>
        </view>

        <!-- Product info -->
        <view class="product-info">
          <view class="product-name">{{ product.name }}</view>
          <view class="product-model">{{ product.model }}</view>
          <view class="product-price-row">
            <text class="product-price">¥{{ formatPrice(product.price) }}</text>
            <text class="product-unit">/{{ product.unit || '个' }}</text>
          </view>
          
          <!-- SKU options if available -->
          <view v-if="product.skuOptions && product.skuOptions.length > 0" class="product-sku">
            <text class="sku-label">规格：</text>
            <text class="sku-count">{{ product.skuOptions.length }}种可选</text>
          </view>
        </view>

        <!-- Action button -->
        <view v-if="!selectable" class="product-action" @click.stop="handleViewDetail(product)">
          <text class="action-text">查看详情</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Product } from '@/types/api'

interface Props {
  products?: Product[]
  loading?: boolean
  emptyText?: string
  selectable?: boolean
  selectedIds?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  products: () => [],
  loading: false,
  emptyText: '暂无产品',
  selectable: false,
  selectedIds: () => []
})

const emit = defineEmits<{
  select: [product: Product]
  'view-detail': [product: Product]
}>()

const isSelected = (productId: string) => {
  return props.selectedIds.includes(productId)
}

const handleProductClick = (product: Product) => {
  if (props.selectable) {
    emit('select', product)
  } else {
    handleViewDetail(product)
  }
}

const handleViewDetail = (product: Product) => {
  emit('view-detail', product)
}

const formatPrice = (price: number | undefined) => {
  if (price === undefined || price === null) return '0.00'
  return price.toFixed(2)
}

const handleImageError = (event: any, product: Product) => {
  // Replace with default image on error
  event.target.src = '/static/images/default-product.png'
}
</script>

<style scoped>
.product-list {
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

/* Product grid */
.product-grid {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

/* Product card */
.product-card {
  display: flex;
  align-items: center;
  padding: 20rpx;
  background-color: #fff;
  border-radius: 16rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  position: relative;
}

.product-card--selectable {
  cursor: pointer;
}

.product-card--selected {
  background-color: #fff5f5;
  border: 2rpx solid #ff6b6b;
}

.product-card:active {
  transform: scale(0.98);
}

/* Selection checkbox */
.product-checkbox {
  margin-right: 16rpx;
}

.checkbox-icon {
  width: 36rpx;
  height: 36rpx;
  border: 2rpx solid #d1d5db;
  border-radius: 8rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #fff;
  transition: all 0.2s ease;
}

.checkbox-icon--checked {
  background-color: #ff6b6b;
  border-color: #ff6b6b;
}

.checkbox-check {
  color: #fff;
  font-size: 24rpx;
  font-weight: bold;
}

/* Product image */
.product-image-container {
  position: relative;
  width: 160rpx;
  height: 160rpx;
  flex-shrink: 0;
  margin-right: 20rpx;
}

.product-image {
  width: 100%;
  height: 100%;
  border-radius: 12rpx;
  object-fit: cover;
}

.product-badge {
  position: absolute;
  top: 8rpx;
  left: 8rpx;
  background-color: #ff6b6b;
  color: #fff;
  font-size: 20rpx;
  padding: 4rpx 12rpx;
  border-radius: 20rpx;
  font-weight: 500;
}

/* Product info */
.product-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.product-name {
  font-size: 30rpx;
  font-weight: 600;
  color: #1a1a1a;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.product-model {
  font-size: 24rpx;
  color: #666;
}

.product-price-row {
  display: flex;
  align-items: baseline;
  margin-top: 8rpx;
}

.product-price {
  font-size: 32rpx;
  font-weight: 600;
  color: #ff6b6b;
}

.product-unit {
  font-size: 24rpx;
  color: #999;
  margin-left: 4rpx;
}

.product-sku {
  display: flex;
  align-items: center;
  margin-top: 8rpx;
}

.sku-label {
  font-size: 24rpx;
  color: #666;
}

.sku-count {
  font-size: 24rpx;
  color: #ff6b6b;
  margin-left: 8rpx;
}

/* Action button */
.product-action {
  padding: 12rpx 24rpx;
  background-color: #ff6b6b;
  border-radius: 24rpx;
  margin-left: 16rpx;
}

.action-text {
  font-size: 24rpx;
  color: #fff;
  font-weight: 500;
}

/* Responsive adjustments */
@media (min-width: 768px) {
  .product-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20rpx;
  }
}

@media (min-width: 1024px) {
  .product-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>