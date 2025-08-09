<!--
  Quote Wizard - Step 2: Product Selection
  Visual product selection with enhanced UX patterns
-->
<template>
  <view class="step-products">
    <view class="step-header">
      <text class="step-title">选择产品</text>
      <text class="step-subtitle">
        浏览产品目录，点击产品卡片进行选择
        <text v-if="maxSelection"> (最多{{ maxSelection }}种)</text>
      </text>
    </view>

    <!-- Search and Filter Bar -->
    <view class="search-filter-bar">
      <view class="search-box">
        <text class="search-icon">🔍</text>
        <input
          v-model="searchKeyword"
          class="search-input"
          placeholder="搜索产品名称、型号"
          @input="handleSearch"
        />
        <view v-if="searchKeyword" class="clear-search" @click="clearSearch">
          <text>×</text>
        </view>
      </view>

      <!-- Quick Filter Chips -->
      <scroll-view class="filter-chips" scroll-x :show-scrollbar="false">
        <view class="chips-container">
          <view
            class="filter-chip"
            :class="{ 'filter-chip--active': activeCategory === 'all' }"
            @click="selectCategory('all')"
          >
            全部
          </view>
          <view
            v-for="category in categories"
            :key="category.id"
            class="filter-chip"
            :class="{ 'filter-chip--active': activeCategory === category.id }"
            @click="selectCategory(category.id)"
          >
            <text class="chip-icon">{{ category.icon }}</text>
            <text class="chip-name">{{ category.name }}</text>
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- Selected Products Summary (Sticky when items selected) -->
    <view v-if="localSelectedProducts.length > 0" class="selected-summary">
      <view class="summary-header" @click="showSelectedDetails = !showSelectedDetails">
        <text class="summary-title"> 已选 {{ localSelectedProducts.length }} 种产品 </text>
        <text class="summary-total"> 合计：¥{{ selectedTotal.toFixed(2) }} </text>
        <text class="expand-icon">{{ showSelectedDetails ? '▲' : '▼' }}</text>
      </view>

      <!-- Selected Items List (Collapsible) -->
      <view v-if="showSelectedDetails" class="selected-list">
        <view
          v-for="(item, index) in localSelectedProducts"
          :key="`${item.product.id}-${item.skuId}`"
          class="selected-item"
        >
          <image
            class="item-image"
            :src="item.product.image || '/static/images/default-product.png'"
            mode="aspectFill"
          />
          <view class="item-info">
            <text class="item-name">{{ item.product.name }}</text>
            <text class="item-spec">
              {{ item.product.model }}
              <text v-if="item.skuName"> - {{ item.skuName }}</text>
            </text>
            <text class="item-price">¥{{ item.price }} × {{ item.quantity }}</text>
          </view>
          <view class="item-actions">
            <text class="item-subtotal">¥{{ item.subtotal.toFixed(2) }}</text>
            <SalesButton size="mini" type="danger" @click="removeSelectedItem(index)">
              移除
            </SalesButton>
          </view>
        </view>
      </view>
    </view>

    <!-- Product Grid -->
    <view class="products-container">
      <!-- Loading State -->
      <view v-if="loading" class="loading-state">
        <view class="loading-spinner"></view>
        <text class="loading-text">加载产品中...</text>
      </view>

      <!-- Empty State -->
      <view v-else-if="filteredProducts.length === 0" class="empty-state">
        <text class="empty-icon">📦</text>
        <text class="empty-title">没有找到产品</text>
        <text class="empty-subtitle">
          {{ searchKeyword ? '尝试其他搜索关键词' : '该分类暂无产品' }}
        </text>
        <SalesButton v-if="searchKeyword" type="plain" @click="clearSearch" size="small">
          清除搜索条件
        </SalesButton>
      </view>

      <!-- Product Cards Grid -->
      <view v-else class="product-grid">
        <view
          v-for="product in filteredProducts"
          :key="product.id"
          class="product-card"
          :class="{
            'product-card--selected': isProductSelected(product.id),
            'product-card--disabled': isProductDisabled(product.id)
          }"
          @click="handleProductSelect(product)"
        >
          <!-- Product Image with Badge -->
          <view class="card-image-wrapper">
            <image
              class="card-image"
              :src="product.image || '/static/images/default-product.png'"
              mode="aspectFill"
              lazy-load
            />

            <!-- Selection Badge -->
            <view v-if="isProductSelected(product.id)" class="selection-badge">
              <text class="badge-text">{{ getSelectedQuantity(product.id) }}</text>
            </view>

            <!-- Quick Add Button -->
            <view v-else class="quick-add-btn" @click.stop="quickAddProduct(product)">
              <text class="add-icon">+</text>
            </view>

            <!-- Price Tag -->
            <view class="price-tag">
              <text class="price-text">¥{{ product.price }}</text>
            </view>
          </view>

          <!-- Product Info -->
          <view class="card-info">
            <text class="product-name">{{ product.name }}</text>
            <text class="product-model">{{ product.model }}</text>
            <view class="product-meta">
              <text class="product-unit">{{ product.unit || '个' }}</text>
              <text v-if="product.stock" class="product-stock"> 库存: {{ product.stock }} </text>
            </view>
          </view>
        </view>
      </view>

      <!-- Load More -->
      <view v-if="hasMore && !loading" class="load-more">
        <SalesButton type="plain" @click="loadMore"> 加载更多产品 </SalesButton>
      </view>
    </view>

    <!-- Bottom Actions -->
    <view class="step-actions">
      <SalesButton type="default" @click="goBack"> 上一步 </SalesButton>

      <SalesButton
        type="primary"
        @click="handleNext"
        :disabled="localSelectedProducts.length === 0"
        class="next-button"
      >
        下一步：价格配置
        <text v-if="localSelectedProducts.length > 0" class="action-count">
          ({{ localSelectedProducts.length }})
        </text>
      </SalesButton>
    </view>

    <!-- SKU Selection Modal -->
    <uni-popup ref="skuModalRef" type="bottom" :mask-click="false">
      <view class="sku-modal" v-if="selectedProduct">
        <view class="sku-header">
          <text class="sku-title">选择规格</text>
          <view class="sku-close" @click="closeSkuModal">
            <text>×</text>
          </view>
        </view>

        <view class="sku-product">
          <image
            class="sku-image"
            :src="selectedProduct.image || '/static/images/default-product.png'"
            mode="aspectFill"
          />
          <view class="sku-info">
            <text class="sku-name">{{ selectedProduct.name }}</text>
            <text class="sku-model">{{ selectedProduct.model }}</text>
            <text class="sku-base-price">基础价格：¥{{ selectedProduct.price }}</text>
          </view>
        </view>

        <!-- SKU Options -->
        <view v-if="selectedProduct.skuOptions?.length" class="sku-options">
          <text class="option-label">规格选择</text>
          <view class="option-grid">
            <view
              v-for="sku in selectedProduct.skuOptions"
              :key="sku.id"
              class="option-item"
              :class="{ 'option-item--selected': selectedSkuId === sku.id }"
              @click="selectSku(sku)"
            >
              <text class="option-name">{{ sku.name }}</text>
              <text v-if="sku.price" class="option-price">
                {{ sku.price > 0 ? '+' : '' }}¥{{ sku.price }}
              </text>
            </view>
          </view>
        </view>

        <!-- Quantity Selector -->
        <view class="quantity-section">
          <text class="quantity-label">数量</text>
          <view class="quantity-controls">
            <SalesButton
              size="small"
              type="default"
              @click="decreaseQuantity"
              :disabled="modalQuantity <= 1"
            >
              -
            </SalesButton>
            <input
              v-model.number="modalQuantity"
              type="number"
              class="quantity-input"
              min="1"
              @blur="validateQuantity"
            />
            <SalesButton size="small" type="default" @click="increaseQuantity"> + </SalesButton>
          </view>
        </view>

        <!-- Price Preview -->
        <view class="price-preview">
          <text class="preview-label">小计：</text>
          <text class="preview-price">¥{{ modalSubtotal.toFixed(2) }}</text>
        </view>

        <!-- Modal Actions -->
        <view class="sku-actions">
          <SalesButton type="default" @click="closeSkuModal"> 取消 </SalesButton>
          <SalesButton type="primary" @click="confirmSkuSelection"> 确认添加 </SalesButton>
        </view>
      </view>
    </uni-popup>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import SalesButton from '../SalesButton.vue'
import type { SelectedProduct } from '@/components/business/ProductSelector.vue'
import type { Category, Product } from '@/types/api'

interface Props {
  selectedProducts: SelectedProduct[]
  categories: Category[]
  maxSelection?: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:selectedProducts': [products: SelectedProduct[]]
  next: []
  back: []
}>()

// State
const searchKeyword = ref('')
const activeCategory = ref('all')
const loading = ref(false)
const hasMore = ref(true)
const page = ref(1)
const showSelectedDetails = ref(false)

// Local selected products to prevent prop mutation
const localSelectedProducts = ref<SelectedProduct[]>([...props.selectedProducts])

// Product data
const products = ref<Product[]>([])

// SKU Modal state
const skuModalRef = ref()
const selectedProduct = ref<Product | null>(null)
const selectedSkuId = ref('')
const modalQuantity = ref(1)
const editingIndex = ref(-1)

// Mock product data
const generateMockProducts = (categoryId?: string) => {
  const mockProducts: Product[] = []
  const productNames = {
    tables: ['星牌台球桌', '乔氏台球桌', '亚林台球桌', '康溪台球桌'],
    cues: ['高端枫木球杆', '专业碳纤维球杆', '初学者套装球杆', '定制雕花球杆'],
    balls: ['亚美利加台球', '比利时aramith球', '国产优质台球', '练习专用球'],
    accessories: ['台球三角架', '球杆架', '台球刷', '球杆皮头'],
    maintenance: ['台呢清洁剂', '球杆保养油', '台球桌罩', '专业维修工具']
  }

  const categoryNames = categoryId === 'all' ? Object.keys(productNames) : [categoryId || 'tables']

  categoryNames.forEach(cat => {
    productNames[cat]?.forEach((name, i) => {
      mockProducts.push({
        id: `${cat}-${i}`,
        name,
        model: `${cat.toUpperCase()}-${Math.random().toString(36).substring(7)}`,
        price: Math.floor(Math.random() * 5000) + 500,
        unit: cat === 'tables' ? '张' : cat === 'cues' ? '支' : '个',
        categoryId: cat,
        stock: Math.floor(Math.random() * 50) + 10,
        image: `/static/images/products/${cat}-${i + 1}.jpg`,
        skuOptions:
          Math.random() > 0.6
            ? [
                { id: `${cat}-${i}-sku1`, name: '标准版', price: 0 },
                { id: `${cat}-${i}-sku2`, name: '豪华版', price: 200 },
                { id: `${cat}-${i}-sku3`, name: '定制版', price: 500 }
              ]
            : undefined
      })
    })
  })

  return mockProducts
}

// Computed
const filteredProducts = computed(() => {
  let result = products.value

  // Filter by category
  if (activeCategory.value !== 'all') {
    result = result.filter(p => p.categoryId === activeCategory.value)
  }

  // Filter by search
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(
      p => p.name.toLowerCase().includes(keyword) || p.model?.toLowerCase().includes(keyword)
    )
  }

  return result
})

const selectedTotal = computed(() => {
  return localSelectedProducts.value.reduce((sum, item) => sum + item.subtotal, 0)
})

const modalSubtotal = computed(() => {
  if (!selectedProduct.value) return 0

  const basePrice = selectedProduct.value.price
  const skuPrice =
    selectedProduct.value.skuOptions?.find(s => s.id === selectedSkuId.value)?.price || 0
  const finalPrice = basePrice + skuPrice

  return finalPrice * modalQuantity.value
})

// Methods
const loadProducts = async () => {
  if (loading.value) return

  loading.value = true

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500))

  const newProducts = generateMockProducts(activeCategory.value)

  if (page.value === 1) {
    products.value = newProducts
  } else {
    products.value = [...products.value, ...newProducts]
  }

  hasMore.value = page.value < 3 // Simulate 3 pages max
  loading.value = false
}

const handleSearch = () => {
  // Simple debounce
  clearTimeout(handleSearch.timer)
  handleSearch.timer = setTimeout(() => {
    resetAndLoad()
  }, 300)
}

const clearSearch = () => {
  searchKeyword.value = ''
  resetAndLoad()
}

const selectCategory = (categoryId: string) => {
  activeCategory.value = categoryId
  resetAndLoad()
}

const resetAndLoad = () => {
  page.value = 1
  products.value = []
  loadProducts()
}

const loadMore = () => {
  if (!loading.value && hasMore.value) {
    page.value++
    loadProducts()
  }
}

const isProductSelected = (productId: string) => {
  return localSelectedProducts.value.some(item => item.product.id === productId)
}

const isProductDisabled = (productId: string) => {
  return (
    props.maxSelection &&
    !isProductSelected(productId) &&
    localSelectedProducts.value.length >= props.maxSelection
  )
}

const getSelectedQuantity = (productId: string) => {
  const item = localSelectedProducts.value.find(item => item.product.id === productId)
  return item?.quantity || 0
}

const quickAddProduct = (product: Product) => {
  if (isProductDisabled(product.id)) {
    uni.showToast({
      title: `最多选择${props.maxSelection}种产品`,
      icon: 'none'
    })
    return
  }

  // If has SKU options, open modal
  if (product.skuOptions?.length) {
    handleProductSelect(product)
    return
  }

  // Direct add with quantity 1
  const newItem: SelectedProduct = {
    product,
    quantity: 1,
    price: product.price,
    subtotal: product.price
  }

  localSelectedProducts.value.push(newItem)
  emitUpdate()

  uni.showToast({
    title: '已添加到选择',
    icon: 'success',
    duration: 1000
  })
}

const handleProductSelect = (product: Product) => {
  if (isProductDisabled(product.id)) {
    uni.showToast({
      title: `最多选择${props.maxSelection}种产品`,
      icon: 'none'
    })
    return
  }

  selectedProduct.value = product

  // Check if already selected for editing
  const existingIndex = localSelectedProducts.value.findIndex(
    item => item.product.id === product.id
  )
  if (existingIndex !== -1) {
    editingIndex.value = existingIndex
    const existingItem = localSelectedProducts.value[existingIndex]
    modalQuantity.value = existingItem.quantity
    selectedSkuId.value = existingItem.skuId || ''
  } else {
    editingIndex.value = -1
    modalQuantity.value = 1
    selectedSkuId.value = product.skuOptions?.[0]?.id || ''
  }

  skuModalRef.value?.open()
}

const selectSku = (sku: { id: string; name: string; price?: number }) => {
  selectedSkuId.value = sku.id
}

const increaseQuantity = () => {
  modalQuantity.value++
}

const decreaseQuantity = () => {
  if (modalQuantity.value > 1) {
    modalQuantity.value--
  }
}

const validateQuantity = () => {
  if (modalQuantity.value < 1 || isNaN(modalQuantity.value)) {
    modalQuantity.value = 1
  }
}

const confirmSkuSelection = () => {
  if (!selectedProduct.value) return

  const selectedSku = selectedProduct.value.skuOptions?.find(s => s.id === selectedSkuId.value)
  const finalPrice = selectedProduct.value.price + (selectedSku?.price || 0)

  const newItem: SelectedProduct = {
    product: selectedProduct.value,
    quantity: modalQuantity.value,
    skuId: selectedSkuId.value || undefined,
    skuName: selectedSku?.name || undefined,
    price: finalPrice,
    subtotal: finalPrice * modalQuantity.value
  }

  if (editingIndex.value !== -1) {
    localSelectedProducts.value[editingIndex.value] = newItem
  } else {
    localSelectedProducts.value.push(newItem)
  }

  emitUpdate()
  closeSkuModal()

  uni.showToast({
    title: editingIndex.value !== -1 ? '已更新选择' : '已添加到选择',
    icon: 'success'
  })
}

const removeSelectedItem = (index: number) => {
  localSelectedProducts.value.splice(index, 1)
  emitUpdate()
}

const closeSkuModal = () => {
  skuModalRef.value?.close()
  selectedProduct.value = null
  editingIndex.value = -1
}

const emitUpdate = () => {
  emit('update:selectedProducts', [...localSelectedProducts.value])
}

const goBack = () => {
  emit('back')
}

const handleNext = () => {
  if (localSelectedProducts.value.length === 0) {
    uni.showToast({
      title: '请选择至少一个产品',
      icon: 'none'
    })
    return
  }

  emit('next')
}

// Watch for external changes
watch(
  () => props.selectedProducts,
  newProducts => {
    localSelectedProducts.value = [...newProducts]
  },
  { deep: true }
)

// Lifecycle
onMounted(() => {
  loadProducts()
})
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.step-products {
  min-height: 100vh;
}

.step-header {
  text-align: center;
  margin-bottom: $spacing-lg;
}

.step-title {
  font-size: $font-size-extra-large;
  font-weight: $font-weight-semibold;
  color: $text-color;
  display: block;
  margin-bottom: $spacing-xs;
}

.step-subtitle {
  font-size: $font-size-small;
  color: $text-color-secondary;
  line-height: 1.4;
}

// Search and Filter
.search-filter-bar {
  @include card;
  margin-bottom: $spacing-base;
  padding: $spacing-base;
}

.search-box {
  display: flex;
  align-items: center;
  background-color: $bg-color-page;
  border-radius: $border-radius-lg;
  padding: $spacing-sm $spacing-base;
  margin-bottom: $spacing-base;
}

.search-icon {
  font-size: $font-size-base;
  margin-right: $spacing-sm;
  color: $text-color-secondary;
}

.search-input {
  flex: 1;
  font-size: $font-size-base;
  color: $text-color;
  background: transparent;
  border: none;
}

.clear-search {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: $text-color-secondary;
  font-size: $font-size-large;
  cursor: pointer;
}

.filter-chips {
  height: 40px;
}

.chips-container {
  display: flex;
  gap: $spacing-sm;
  padding-right: $spacing-base;
}

.filter-chip {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
  padding: $spacing-xs $spacing-base;
  background-color: $bg-color-page;
  border-radius: $border-radius-lg;
  font-size: $font-size-small;
  color: $text-color-secondary;
  white-space: nowrap;
  cursor: pointer;
  transition: $transition-base;
  border: 1px solid transparent;

  &--active {
    background-color: $primary-color;
    color: white;
    border-color: $primary-color;
  }

  &:active {
    transform: scale(0.95);
  }
}

.chip-icon {
  font-size: $font-size-small;
}

// Selected Summary
.selected-summary {
  @include card;
  margin-bottom: $spacing-base;
  padding: 0;
  border-left: 4px solid $primary-color;
}

.summary-header {
  display: flex;
  align-items: center;
  padding: $spacing-base;
  cursor: pointer;
}

.summary-title {
  font-size: $font-size-base;
  font-weight: $font-weight-medium;
  color: $text-color;
  flex: 1;
}

.summary-total {
  font-size: $font-size-base;
  font-weight: $font-weight-semibold;
  color: $primary-color;
  margin-right: $spacing-sm;
}

.expand-icon {
  font-size: $font-size-small;
  color: $text-color-secondary;
}

.selected-list {
  border-top: 1px solid $border-color-lighter;
  padding: $spacing-base;
  padding-top: 0;
}

.selected-item {
  display: flex;
  align-items: center;
  padding: $spacing-sm 0;
  border-bottom: 1px solid $border-color-extra-light;

  &:last-child {
    border-bottom: none;
  }
}

.item-image {
  width: 50px;
  height: 50px;
  border-radius: $border-radius-base;
  margin-right: $spacing-base;
  background-color: $bg-color-page;
}

.item-info {
  flex: 1;
}

.item-name {
  font-size: $font-size-small;
  font-weight: $font-weight-medium;
  color: $text-color;
  display: block;
  margin-bottom: 2px;
}

.item-spec,
.item-price {
  font-size: $font-size-extra-small;
  color: $text-color-secondary;
  display: block;
}

.item-actions {
  text-align: right;
}

.item-subtotal {
  font-size: $font-size-base;
  font-weight: $font-weight-semibold;
  color: $danger-color;
  display: block;
  margin-bottom: $spacing-xs;
}

// Products Container
.products-container {
  margin-bottom: 80px; // Space for actions
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: $spacing-xl 0;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid $border-color-light;
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

.loading-text {
  font-size: $font-size-base;
  color: $text-color-secondary;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: $spacing-base;
  opacity: 0.6;
}

.empty-title {
  font-size: $font-size-large;
  font-weight: $font-weight-medium;
  color: $text-color;
  margin-bottom: $spacing-xs;
}

.empty-subtitle {
  font-size: $font-size-base;
  color: $text-color-secondary;
  text-align: center;
  margin-bottom: $spacing-base;
}

// Product Grid
.product-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $spacing-base;
}

.product-card {
  @include card;
  padding: 0;
  cursor: pointer;
  transition: $transition-base;
  border: 2px solid transparent;
  overflow: hidden;

  &:active {
    transform: scale(0.98);
  }

  &--selected {
    border-color: $primary-color;
    background-color: $primary-bg;
  }

  &--disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.card-image-wrapper {
  position: relative;
  width: 100%;
  height: 150px;
  overflow: hidden;
}

.card-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  background-color: $bg-color-page;
}

.selection-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  background-color: $primary-color;
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: $font-size-small;
  font-weight: $font-weight-bold;
}

.quick-add-btn {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: $font-size-large;
  font-weight: $font-weight-bold;
}

.price-tag {
  position: absolute;
  top: 8px;
  left: 8px;
  background-color: $danger-color;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: $font-size-extra-small;
  font-weight: $font-weight-medium;
}

.card-info {
  padding: $spacing-base;
}

.product-name {
  font-size: $font-size-base;
  font-weight: $font-weight-medium;
  color: $text-color;
  display: block;
  margin-bottom: $spacing-xs;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-model {
  font-size: $font-size-small;
  color: $text-color-secondary;
  display: block;
  margin-bottom: $spacing-xs;
}

.product-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.product-unit,
.product-stock {
  font-size: $font-size-extra-small;
  color: $text-color-regular;
}

// Load More
.load-more {
  text-align: center;
  padding: $spacing-lg 0;
}

// Step Actions
.step-actions {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: $bg-color-white;
  border-top: 1px solid $border-color-lighter;
  padding: $spacing-base;
  padding-bottom: calc(#{$spacing-base} + env(safe-area-inset-bottom));
  display: flex;
  gap: $spacing-base;
  z-index: $z-index-fixed;
}

.next-button {
  flex: 2;
  position: relative;
}

.action-count {
  margin-left: $spacing-xs;
  background-color: rgba(255, 255, 255, 0.2);
  padding: 2px 6px;
  border-radius: 10px;
  font-size: $font-size-extra-small;
}

// SKU Modal
.sku-modal {
  background-color: $bg-color-white;
  border-radius: $border-radius-lg $border-radius-lg 0 0;
  padding: $spacing-lg;
  padding-bottom: calc(#{$spacing-lg} + env(safe-area-inset-bottom));
  max-height: 70vh;
  overflow-y: auto;
}

.sku-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $spacing-lg;
}

.sku-title {
  font-size: $font-size-large;
  font-weight: $font-weight-semibold;
  color: $text-color;
}

.sku-close {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: $font-size-extra-large;
  color: $text-color-secondary;
  cursor: pointer;
}

.sku-product {
  display: flex;
  align-items: flex-start;
  margin-bottom: $spacing-lg;
}

.sku-image {
  width: 80px;
  height: 80px;
  border-radius: $border-radius-base;
  margin-right: $spacing-base;
  background-color: $bg-color-page;
}

.sku-info {
  flex: 1;
}

.sku-name {
  font-size: $font-size-medium;
  font-weight: $font-weight-medium;
  color: $text-color;
  display: block;
  margin-bottom: $spacing-xs;
}

.sku-model {
  font-size: $font-size-small;
  color: $text-color-secondary;
  display: block;
  margin-bottom: $spacing-xs;
}

.sku-base-price {
  font-size: $font-size-base;
  color: $danger-color;
  font-weight: $font-weight-semibold;
}

.sku-options {
  margin-bottom: $spacing-lg;
}

.option-label {
  font-size: $font-size-base;
  font-weight: $font-weight-medium;
  color: $text-color;
  display: block;
  margin-bottom: $spacing-sm;
}

.option-grid {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-sm;
}

.option-item {
  padding: $spacing-sm $spacing-base;
  background-color: $bg-color-page;
  border: 1px solid $border-color-light;
  border-radius: $border-radius-base;
  cursor: pointer;
  transition: $transition-base;

  &--selected {
    background-color: $primary-bg;
    border-color: $primary-color;
    color: $primary-color;
  }
}

.option-name {
  font-size: $font-size-small;
  display: block;
}

.option-price {
  font-size: $font-size-extra-small;
  color: $success-color;
  font-weight: $font-weight-medium;
}

.quantity-section {
  margin-bottom: $spacing-lg;
}

.quantity-label {
  font-size: $font-size-base;
  font-weight: $font-weight-medium;
  color: $text-color;
  display: block;
  margin-bottom: $spacing-sm;
}

.quantity-controls {
  display: flex;
  align-items: center;
  gap: $spacing-base;
}

.quantity-input {
  flex: 1;
  height: 40px;
  text-align: center;
  font-size: $font-size-base;
  border: 1px solid $border-color;
  border-radius: $border-radius-base;
  background-color: $bg-color-white;
}

.price-preview {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $spacing-base;
  background-color: $bg-color-page;
  border-radius: $border-radius-base;
  margin-bottom: $spacing-lg;
}

.preview-label {
  font-size: $font-size-base;
  color: $text-color-secondary;
}

.preview-price {
  font-size: $font-size-large;
  font-weight: $font-weight-semibold;
  color: $danger-color;
}

.sku-actions {
  display: flex;
  gap: $spacing-base;
}

// Responsive Design
@media (min-width: $breakpoint-lg) {
  .product-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: $breakpoint-xl) {
  .product-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (max-width: $breakpoint-sm) {
  .customer-types {
    grid-template-columns: 1fr;
  }
}

/* Accessibility and reduced motion */
@media (prefers-reduced-motion: reduce) {
  .product-card,
  .loading-spinner {
    animation: none;
    transition: none;
  }
}
</style>
