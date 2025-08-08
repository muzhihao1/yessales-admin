<template>
  <view class="product-selector-content">
    <!-- Header -->
    <view class="selector-header">
      <view class="header-top">
        <text class="header-title">选择产品</text>
        <view class="header-close" @click="handleCancel">
          <text class="close-icon">×</text>
        </view>
      </view>

      <!-- Search bar -->
      <view class="search-container">
        <view class="search-box">
          <image class="search-icon" src="/static/icons/search.png" mode="aspectFit" />
          <input
            v-model="searchKeyword"
            class="search-input"
            placeholder="搜索产品名称或型号"
            @input="handleSearch"
          />
          <view v-if="searchKeyword" class="clear-icon" @click="clearSearch">
            <text>×</text>
          </view>
        </view>
      </view>

      <!-- Category tabs -->
      <scroll-view class="category-tabs" scroll-x :show-scrollbar="false">
        <view class="tabs-content">
          <view
            class="tab-item"
            :class="{ 'tab-item--active': activeCategoryId === 'all' }"
            @click="selectCategory('all')"
          >
            全部
          </view>
          <view
            v-for="category in categories"
            :key="category.id"
            class="tab-item"
            :class="{ 'tab-item--active': activeCategoryId === category.id }"
            @click="selectCategory(category.id)"
          >
            {{ category.name }}
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- Product list -->
    <scroll-view class="product-scroll" scroll-y :show-scrollbar="false" @scrolltolower="loadMore">
      <!-- Loading state -->
      <view v-if="loading" class="loading-container">
        <view class="loading-spinner"></view>
        <text class="loading-text">加载中...</text>
      </view>

      <!-- Product grid -->
      <view v-else-if="filteredProducts.length > 0" class="product-grid">
        <view
          v-for="product in filteredProducts"
          :key="product.id"
          class="product-item"
          @click="handleProductClick(product)"
        >
          <view class="product-image-wrapper">
            <image
              class="product-image"
              :src="product.image || '/static/images/default-product.png'"
              mode="aspectFill"
            />
            <view v-if="getSelectedItem(product.id)" class="selected-badge">
              <text class="selected-count">{{ getSelectedItem(product.id)?.quantity }}</text>
            </view>
          </view>
          <view class="product-info">
            <text class="product-name">{{ product.name }}</text>
            <text class="product-model">{{ product.model }}</text>
            <view class="product-price-row">
              <text class="product-price">¥{{ product.price }}</text>
              <text class="product-unit">/{{ product.unit || '个' }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- Empty state -->
      <view v-else class="empty-container">
        <image class="empty-icon" src="/static/images/empty-product.png" mode="aspectFit" />
        <text class="empty-text">暂无产品</text>
      </view>

      <!-- Load more -->
      <view v-if="hasMore && !loading" class="load-more">
        <text class="load-more-text">上拉加载更多</text>
      </view>
    </scroll-view>

    <!-- Bottom summary -->
    <view class="selector-footer">
      <view class="summary-info">
        <text class="summary-text">
          已选 <text class="summary-count">{{ selectedItems.length }}</text> 种产品
        </text>
        <text class="summary-amount">
          合计：<text class="amount-value">¥{{ totalAmount.toFixed(2) }}</text>
        </text>
      </view>
      <view class="footer-actions">
        <button class="btn-cancel" @click="handleCancel">取消</button>
        <button class="btn-confirm" :disabled="selectedItems.length === 0" @click="handleConfirm">
          确定({{ selectedItems.length }})
        </button>
      </view>
    </view>

    <!-- SKU/Quantity popup -->
    <uni-popup ref="skuPopupRef" type="bottom" :mask-click="false">
      <view class="sku-popup" v-if="currentProduct">
        <view class="sku-header">
          <image
            class="sku-image"
            :src="currentProduct.image || '/static/images/default-product.png'"
            mode="aspectFill"
          />
          <view class="sku-info">
            <text class="sku-name">{{ currentProduct.name }}</text>
            <text class="sku-price">¥{{ currentProduct.price }}</text>
          </view>
          <view class="sku-close" @click="closeSkuPopup">
            <text>×</text>
          </view>
        </view>

        <!-- SKU options -->
        <view
          v-if="currentProduct.skuOptions && currentProduct.skuOptions.length > 0"
          class="sku-options"
        >
          <text class="sku-label">选择规格</text>
          <view class="sku-list">
            <view
              v-for="sku in currentProduct.skuOptions"
              :key="sku.id"
              class="sku-item"
              :class="{ 'sku-item--active': selectedSkuId === sku.id }"
              @click="selectSku(sku)"
            >
              {{ sku.name }}
            </view>
          </view>
        </view>

        <!-- Quantity input -->
        <view class="quantity-section">
          <text class="quantity-label">购买数量</text>
          <view class="quantity-control">
            <button
              class="qty-btn qty-btn--minus"
              :disabled="quantity <= 1"
              @click="decreaseQuantity"
            >
              -
            </button>
            <input
              v-model.number="quantity"
              type="number"
              class="qty-input"
              @blur="validateQuantity"
            />
            <button class="qty-btn qty-btn--plus" @click="increaseQuantity">+</button>
          </view>
        </view>

        <!-- Subtotal -->
        <view class="sku-subtotal">
          <text class="subtotal-label">小计：</text>
          <text class="subtotal-amount">¥{{ (currentProduct.price * quantity).toFixed(2) }}</text>
        </view>

        <!-- Confirm button -->
        <button class="sku-confirm" @click="confirmSelection">
          {{ editingIndex !== -1 ? '修改' : '加入' }}选择
        </button>
      </view>
    </uni-popup>
  </view>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import type { Category, Product } from '@/types/api'
import type { SelectedProduct } from './ProductSelector.vue'

interface Props {
  categories: Category[]
  selectedProducts: SelectedProduct[]
  maxSelection?: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  confirm: [products: SelectedProduct[]]
  cancel: []
}>()

// State
const searchKeyword = ref('')
const activeCategoryId = ref<string>('all')
const products = ref<Product[]>([])
const loading = ref(false)
const hasMore = ref(false)
const page = ref(1)
const pageSize = 20

// Selection state
const selectedItems = ref<SelectedProduct[]>([...props.selectedProducts])
const currentProduct = ref<Product | null>(null)
const selectedSkuId = ref<string>('')
const quantity = ref(1)
const editingIndex = ref(-1)

// Popup refs
const skuPopupRef = ref()

// Mock data loading
const loadProducts = async (reset = false) => {
  if (reset) {
    page.value = 1
    products.value = []
  }

  loading.value = true

  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 500))

  // Mock products
  const mockProducts: Product[] = []
  for (let i = 0; i < pageSize; i++) {
    const id = `prod-${page.value}-${i}`
    mockProducts.push({
      id,
      name: `产品 ${page.value}-${i}`,
      model: `MODEL-${Math.random().toString(36).substring(7).toUpperCase()}`,
      price: Math.floor(Math.random() * 1000) + 100,
      unit: ['个', '件', '套', '箱'][Math.floor(Math.random() * 4)],
      categoryId:
        activeCategoryId.value === 'all'
          ? props.categories[Math.floor(Math.random() * props.categories.length)]?.id
          : activeCategoryId.value,
      image: `/static/images/product-${(i % 5) + 1}.jpg`,
      skuOptions:
        Math.random() > 0.5
          ? [
              { id: `${id}-sku-1`, name: '标准版', price: 0 },
              { id: `${id}-sku-2`, name: '升级版', price: 100 },
              { id: `${id}-sku-3`, name: '豪华版', price: 200 }
            ]
          : undefined
    })
  }

  products.value = [...products.value, ...mockProducts]
  hasMore.value = page.value < 5
  loading.value = false
}

// Computed
const filteredProducts = computed(() => {
  let result = products.value

  // Filter by category
  if (activeCategoryId.value !== 'all') {
    result = result.filter(p => p.categoryId === activeCategoryId.value)
  }

  // Filter by search keyword
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(
      p => p.name.toLowerCase().includes(keyword) || p.model?.toLowerCase().includes(keyword)
    )
  }

  return result
})

const totalAmount = computed(() => {
  return selectedItems.value.reduce((sum, item) => sum + item.subtotal, 0)
})

// Methods
const handleSearch = () => {
  // Debounce search
  loadProducts(true)
}

const clearSearch = () => {
  searchKeyword.value = ''
  loadProducts(true)
}

const selectCategory = (categoryId: string) => {
  activeCategoryId.value = categoryId
  loadProducts(true)
}

const loadMore = () => {
  if (!loading.value && hasMore.value) {
    page.value++
    loadProducts()
  }
}

const getSelectedItem = (productId: string) => {
  return selectedItems.value.find(item => item.product.id === productId)
}

const handleProductClick = (product: Product) => {
  currentProduct.value = product

  const existingItem = getSelectedItem(product.id)
  if (existingItem) {
    editingIndex.value = selectedItems.value.indexOf(existingItem)
    quantity.value = existingItem.quantity
    selectedSkuId.value = existingItem.skuId || ''
  } else {
    editingIndex.value = -1
    quantity.value = 1
    selectedSkuId.value = product.skuOptions?.[0]?.id || ''
  }

  skuPopupRef.value?.open()
}

const closeSkuPopup = () => {
  skuPopupRef.value?.close()
  currentProduct.value = null
  editingIndex.value = -1
}

const selectSku = (sku: { id: string; name: string; price?: number }) => {
  selectedSkuId.value = sku.id
}

const increaseQuantity = () => {
  quantity.value++
}

const decreaseQuantity = () => {
  if (quantity.value > 1) {
    quantity.value--
  }
}

const validateQuantity = () => {
  if (quantity.value < 1 || isNaN(quantity.value)) {
    quantity.value = 1
  }
}

const confirmSelection = () => {
  if (!currentProduct.value) return

  const selectedSku = currentProduct.value.skuOptions?.find(s => s.id === selectedSkuId.value)
  const price = currentProduct.value.price + (selectedSku?.price || 0)

  const newItem: SelectedProduct = {
    product: currentProduct.value,
    quantity: quantity.value,
    skuId: selectedSkuId.value || undefined,
    skuName: selectedSku?.name || undefined,
    price,
    subtotal: price * quantity.value
  }

  if (editingIndex.value !== -1) {
    selectedItems.value[editingIndex.value] = newItem
  } else {
    if (props.maxSelection && selectedItems.value.length >= props.maxSelection) {
      uni.showToast({
        title: `最多选择${props.maxSelection}种产品`,
        icon: 'none'
      })
      return
    }
    selectedItems.value.push(newItem)
  }

  closeSkuPopup()
}

const handleConfirm = () => {
  emit('confirm', [...selectedItems.value])
}

const handleCancel = () => {
  emit('cancel')
}

// Initialize
loadProducts()

// Watch for prop changes
watch(
  () => props.selectedProducts,
  newVal => {
    selectedItems.value = [...newVal]
  }
)
</script>

<style scoped>
.product-selector-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
}

/* Header */
.selector-header {
  background-color: #fff;
  border-bottom: 1rpx solid #e5e7eb;
}

.header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 32rpx;
}

.header-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #1a1a1a;
}

.header-close {
  width: 48rpx;
  height: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-icon {
  font-size: 48rpx;
  color: #6b7280;
}

/* Search */
.search-container {
  padding: 0 32rpx 20rpx;
}

.search-box {
  display: flex;
  align-items: center;
  background-color: #f3f4f6;
  border-radius: 36rpx;
  padding: 0 24rpx;
  height: 72rpx;
}

.search-icon {
  width: 32rpx;
  height: 32rpx;
  margin-right: 16rpx;
}

.search-input {
  flex: 1;
  font-size: 28rpx;
  color: #1a1a1a;
}

.clear-icon {
  width: 36rpx;
  height: 36rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  font-size: 32rpx;
}

/* Category tabs */
.category-tabs {
  height: 88rpx;
  background-color: #fff;
}

.tabs-content {
  display: flex;
  padding: 20rpx 32rpx;
  gap: 24rpx;
}

.tab-item {
  padding: 12rpx 32rpx;
  background-color: #f3f4f6;
  border-radius: 36rpx;
  font-size: 28rpx;
  color: #4b5563;
  white-space: nowrap;
  transition: all 0.2s ease;
}

.tab-item--active {
  background-color: #ff6b6b;
  color: #fff;
}

/* Product scroll */
.product-scroll {
  flex: 1;
  padding: 16rpx;
}

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
  to {
    transform: rotate(360deg);
  }
}

.loading-text {
  margin-top: 20rpx;
  font-size: 28rpx;
  color: #999;
}

/* Product grid */
.product-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16rpx;
}

.product-item {
  background-color: #fff;
  border-radius: 16rpx;
  overflow: hidden;
  transition: all 0.2s ease;
}

.product-item:active {
  transform: scale(0.98);
}

.product-image-wrapper {
  position: relative;
  width: 100%;
  padding-bottom: 100%;
}

.product-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.selected-badge {
  position: absolute;
  top: 16rpx;
  right: 16rpx;
  background-color: #ff6b6b;
  color: #fff;
  width: 48rpx;
  height: 48rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.selected-count {
  font-size: 24rpx;
  font-weight: 600;
}

.product-info {
  padding: 16rpx;
}

.product-name {
  font-size: 28rpx;
  font-weight: 500;
  color: #1a1a1a;
  display: block;
  margin-bottom: 8rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-model {
  font-size: 24rpx;
  color: #6b7280;
  display: block;
  margin-bottom: 12rpx;
}

.product-price-row {
  display: flex;
  align-items: baseline;
}

.product-price {
  font-size: 30rpx;
  font-weight: 600;
  color: #ff6b6b;
}

.product-unit {
  font-size: 22rpx;
  color: #9ca3af;
  margin-left: 4rpx;
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

/* Load more */
.load-more {
  text-align: center;
  padding: 32rpx 0;
}

.load-more-text {
  font-size: 26rpx;
  color: #9ca3af;
}

/* Footer */
.selector-footer {
  background-color: #fff;
  border-top: 1rpx solid #e5e7eb;
  padding: 20rpx 32rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
}

.summary-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.summary-text {
  font-size: 28rpx;
  color: #4b5563;
}

.summary-count {
  color: #ff6b6b;
  font-weight: 600;
}

.summary-amount {
  font-size: 28rpx;
  color: #4b5563;
}

.amount-value {
  font-size: 36rpx;
  font-weight: 600;
  color: #ff6b6b;
}

.footer-actions {
  display: flex;
  gap: 20rpx;
}

.btn-cancel,
.btn-confirm {
  flex: 1;
  height: 88rpx;
  border-radius: 44rpx;
  font-size: 30rpx;
  font-weight: 500;
  border: none;
}

.btn-cancel {
  background-color: #f3f4f6;
  color: #4b5563;
}

.btn-confirm {
  background-color: #ff6b6b;
  color: #fff;
}

.btn-confirm:disabled {
  opacity: 0.5;
}

/* SKU Popup */
.sku-popup {
  background-color: #fff;
  border-radius: 24rpx 24rpx 0 0;
  padding: 32rpx;
  padding-bottom: calc(32rpx + env(safe-area-inset-bottom));
}

.sku-header {
  display: flex;
  align-items: flex-start;
  margin-bottom: 32rpx;
}

.sku-image {
  width: 160rpx;
  height: 160rpx;
  border-radius: 16rpx;
  margin-right: 24rpx;
}

.sku-info {
  flex: 1;
}

.sku-name {
  font-size: 30rpx;
  font-weight: 500;
  color: #1a1a1a;
  display: block;
  margin-bottom: 16rpx;
}

.sku-price {
  font-size: 36rpx;
  font-weight: 600;
  color: #ff6b6b;
}

.sku-close {
  width: 48rpx;
  height: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48rpx;
  color: #6b7280;
}

/* SKU options */
.sku-options {
  margin-bottom: 32rpx;
}

.sku-label {
  font-size: 28rpx;
  font-weight: 500;
  color: #374151;
  display: block;
  margin-bottom: 16rpx;
}

.sku-list {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.sku-item {
  padding: 16rpx 32rpx;
  background-color: #f3f4f6;
  border-radius: 36rpx;
  font-size: 26rpx;
  color: #4b5563;
  transition: all 0.2s ease;
}

.sku-item--active {
  background-color: #ff6b6b;
  color: #fff;
}

/* Quantity section */
.quantity-section {
  margin-bottom: 32rpx;
}

.quantity-label {
  font-size: 28rpx;
  font-weight: 500;
  color: #374151;
  display: block;
  margin-bottom: 16rpx;
}

.quantity-control {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.qty-btn {
  width: 72rpx;
  height: 72rpx;
  border-radius: 12rpx;
  background-color: #f3f4f6;
  color: #374151;
  font-size: 36rpx;
  font-weight: 500;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
}

.qty-btn:disabled {
  opacity: 0.5;
}

.qty-input {
  flex: 1;
  height: 72rpx;
  text-align: center;
  font-size: 32rpx;
  font-weight: 500;
  color: #1a1a1a;
  background-color: #f9fafb;
  border: 1rpx solid #e5e7eb;
  border-radius: 12rpx;
}

/* Subtotal */
.sku-subtotal {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx 0;
  border-top: 1rpx solid #e5e7eb;
  margin-bottom: 32rpx;
}

.subtotal-label {
  font-size: 28rpx;
  color: #6b7280;
}

.subtotal-amount {
  font-size: 36rpx;
  font-weight: 600;
  color: #ff6b6b;
}

/* SKU confirm */
.sku-confirm {
  width: 100%;
  height: 88rpx;
  background-color: #ff6b6b;
  color: #fff;
  border-radius: 44rpx;
  font-size: 30rpx;
  font-weight: 500;
  border: none;
}

/* Responsive */
@media (min-width: 768px) {
  .product-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: 1024px) {
  .product-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
</style>
