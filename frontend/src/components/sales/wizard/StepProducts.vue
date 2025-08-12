<!--
  Quote Wizard - Step 2: Product Selection
  Visual product selection with enhanced UX patterns
-->
<template>
  <div class="step-customer">
    <!-- Main Header Card -->
    <div class="customer-card">
      <div class="card-title">
        <span class="title-icon">🎱</span>
        <h3 class="title-text">产品选择</h3>
      </div>
      <p class="step-subtitle">
        浏览产品目录，点击产品卡片进行选择
        <span v-if="maxSelection"> (最多{{ maxSelection }}种)</span>
      </p>
    </div>

    <!-- Search and Filter Section -->
    <div class="customer-card">
      <div class="card-title">
        <span class="title-icon">🔍</span>
        <h3 class="title-text">搜索筛选</h3>
      </div>

      <div class="form-group">
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input
            v-model="searchKeyword"
            class="search-input"
            placeholder="搜索产品名称、型号"
            @input="handleSearch"
          />
          <div v-if="searchKeyword" class="clear-search" @click="clearSearch">
            <span>×</span>
          </div>
        </div>

        <!-- Quick Filter Chips -->
        <div class="filter-chips">
          <div class="chips-container">
            <div
              class="filter-chip"
              :class="{ 'filter-chip--active': activeCategory === 'all' }"
              @click="selectCategory('all')"
            >
              全部
            </div>
            <div
              v-for="category in categories"
              :key="category.id"
              class="filter-chip"
              :class="{ 'filter-chip--active': activeCategory === category.id }"
              @click="selectCategory(category.id)"
            >
              <span class="chip-icon">{{ category.icon }}</span>
              <span class="chip-name">{{ category.name }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Selected Products Summary -->
    <div v-if="localSelectedProducts.length > 0" class="customer-card">
      <div class="card-title">
        <span class="title-icon">✅</span>
        <h3 class="title-text">已选产品</h3>
        <span class="optional-badge">{{ localSelectedProducts.length }}种</span>
      </div>

      <div class="summary-header" @click="showSelectedDetails = !showSelectedDetails">
        <span class="summary-total"> 合计：¥{{ selectedTotal.toFixed(2) }} </span>
        <span class="collapse-icon">{{ showSelectedDetails ? '▲' : '▼' }}</span>
      </div>

      <!-- Selected Items List (Collapsible) -->
      <div v-if="showSelectedDetails" class="selected-list">
        <div
          v-for="(item, index) in localSelectedProducts"
          :key="`${item.product.id}-${item.skuId}`"
          class="selected-item"
        >
          <img
            class="item-image"
            :src="item.product.image || '/static/images/default-product.png'"
            style="object-fit: cover"
            alt="Product image"
          />
          <div class="item-info">
            <span class="item-name">{{ item.product.name }}</span>
            <span class="item-spec">
              {{ item.product.model }}
              <span v-if="item.skuName"> - {{ item.skuName }}</span>
            </span>
            <span class="item-price">¥{{ item.price }} × {{ item.quantity }}</span>
          </div>
          <div class="item-actions">
            <span class="item-subtotal">¥{{ item.subtotal.toFixed(2) }}</span>
            <SalesButton size="small" type="danger" @click="removeSelectedItem(index)">
              移除
            </SalesButton>
          </div>
        </div>
      </div>
    </div>

    <!-- Product Catalog -->
    <div class="customer-card">
      <div class="card-title">
        <span class="title-icon">🛍️</span>
        <h3 class="title-text">产品目录</h3>
      </div>

      <div class="products-container">
        <!-- Loading State -->
        <div v-if="loading" class="loading-state">
          <div class="loading-spinner"></div>
          <span class="loading-text">加载产品中...</span>
        </div>

        <!-- Empty State -->
        <div v-else-if="filteredProducts.length === 0" class="empty-state">
          <span class="empty-icon">📦</span>
          <span class="empty-title">没有找到产品</span>
          <span class="empty-subtitle">
            {{ searchKeyword ? '尝试其他搜索关键词' : '该分类暂无产品' }}
          </span>
          <SalesButton v-if="searchKeyword" type="default" @click="clearSearch" size="small">
            清除搜索条件
          </SalesButton>
        </div>

        <!-- Product Cards Grid -->
        <div v-else class="product-grid">
          <div
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
            <div class="card-image-wrapper">
              <img
                class="card-image"
                :src="product.image || '/static/images/default-product.png'"
                style="object-fit: cover"
                loading="lazy"
                alt="Product image"
              />

              <!-- Selection Badge -->
              <div v-if="isProductSelected(product.id)" class="selection-badge">
                <span class="badge-text">{{ getSelectedQuantity(product.id) }}</span>
              </div>

              <!-- Quick Add Button -->
              <div v-else class="quick-add-btn" @click.stop="quickAddProduct(product)">
                <span class="add-icon">+</span>
              </div>

              <!-- Price Tag -->
              <div class="price-tag">
                <span class="price-text">¥{{ product.price }}</span>
              </div>
            </div>

            <!-- Product Info -->
            <div class="card-info">
              <span class="product-name">{{ product.name }}</span>
              <span class="product-model">{{ product.model }}</span>
              <div class="product-meta">
                <span class="product-unit">{{ product.unit || '个' }}</span>
                <span v-if="product.stock" class="product-stock"> 库存: {{ product.stock }} </span>
              </div>
            </div>
          </div>

          <!-- Load More -->
          <div v-if="hasMore && !loading" class="load-more">
            <SalesButton type="default" @click="loadMore"> 加载更多产品 </SalesButton>
          </div>
        </div>
      </div>

      <!-- SKU Selection Modal -->
      <div v-if="showSkuModal && selectedProduct" class="modal-overlay" @click="closeSkuModal">
        <div class="sku-modal" @click.stop>
          <div class="sku-header">
            <span class="sku-title">选择规格</span>
            <div class="sku-close" @click="closeSkuModal">
              <span>×</span>
            </div>
          </div>

          <div class="sku-product">
            <img
              class="sku-image"
              :src="selectedProduct.image || '/static/images/default-product.png'"
              style="object-fit: cover"
              alt="Product image"
            />
            <div class="sku-info">
              <span class="sku-name">{{ selectedProduct.name }}</span>
              <span class="sku-model">{{ selectedProduct.model }}</span>
              <span class="sku-base-price">基础价格：¥{{ selectedProduct.price }}</span>
            </div>
          </div>

          <!-- SKU Options -->
          <div v-if="selectedProduct.skuOptions?.length" class="sku-options">
            <span class="option-label">规格选择</span>
            <div class="option-grid">
              <div
                v-for="sku in selectedProduct.skuOptions"
                :key="sku.id"
                class="option-item"
                :class="{ 'option-item--selected': selectedSkuId === sku.id }"
                @click="selectSku(sku)"
              >
                <span class="option-name">{{ sku.name }}</span>
                <span v-if="sku.price" class="option-price">
                  {{ sku.price > 0 ? '+' : '' }}¥{{ sku.price }}
                </span>
              </div>
            </div>
          </div>

          <!-- Quantity Selector -->
          <div class="quantity-section">
            <span class="quantity-label">数量</span>
            <div class="quantity-controls">
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
            </div>
          </div>

          <!-- Price Preview -->
          <div class="price-preview">
            <span class="preview-label">小计：</span>
            <span class="preview-price">¥{{ modalSubtotal.toFixed(2) }}</span>
          </div>

          <!-- Modal Actions -->
          <div class="sku-actions">
            <SalesButton type="default" @click="closeSkuModal"> 取消 </SalesButton>
            <SalesButton type="primary" @click="confirmSkuSelection"> 确认添加 </SalesButton>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive as _reactive, computed, onMounted, ref, watch } from 'vue'
import SalesButton from '../SalesButton.vue'
import { toast } from '@/utils/platform-adapter'
import { ProductsApi } from '@/api/products'
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
const showSkuModal = ref(false)
const selectedProduct = ref<Product | null>(null)
const selectedSkuId = ref('')
const modalQuantity = ref(1)
const editingIndex = ref(-1)

// Mock product data
const generateMockProducts = (categoryId?: string) => {
  const mockProducts: Product[] = []
  const productNames = {
    台球桌: ['星牌台球桌', '乔氏台球桌', '亚林台球桌', '康溪台球桌'],
    球杆: ['高端枫木球杆', '专业碳纤维球杆', '初学者套装球杆', '定制雕花球杆'],
    台球: ['亚美利加台球', '比利时aramith球', '国产优质台球', '练习专用球'],
    地毯: ['专业台球毯', '耐磨型毯面', '高档羊毛毯', '维护用绒毯'],
    其他配件: ['台球三角架', '球杆架', '台球刷', '球杆皮头', '台呢清洁剂', '球杆保养油']
  }

  const categoryNames = categoryId === 'all' ? Object.keys(productNames) : [categoryId || '台球桌']

  categoryNames.forEach(cat => {
    productNames[cat]?.forEach((name, i) => {
      mockProducts.push({
        id: `${cat}-${i}`,
        name,
        model: `${cat.substring(0, 2).toUpperCase()}-${Math.random().toString(36).substring(7)}`,
        price: Math.floor(Math.random() * 5000) + 500,
        unit: cat === '台球桌' ? '张' : cat === '球杆' ? '支' : '个',
        category: cat,
        stock: Math.floor(Math.random() * 50) + 10,
        image: `/static/images/products/${cat}-${i + 1}.jpg`,
        is_active: true,
        created_at: new Date().toISOString(),
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

  try {
    // Use real API to fetch products
    const queryParams = {
      page: page.value,
      page_size: 10, // 10 products per page
      search: searchKeyword.value || undefined,
      category: activeCategory.value !== 'all' ? activeCategory.value : undefined,
      is_active: true // Only show active products in sales
    }

    const response = await ProductsApi.getProducts(queryParams)

    if (response.success && response.data) {
      if (page.value === 1) {
        products.value = response.data
      } else {
        products.value = [...products.value, ...response.data]
      }

      // Check if there are more pages
      const totalPages = Math.ceil((response.pagination?.total || 0) / 10)
      hasMore.value = page.value < totalPages
    } else {
      console.error('Failed to load products:', response.error)
      // Fallback to mock data if API fails
      const mockProducts = generateMockProducts(activeCategory.value)
      if (page.value === 1) {
        products.value = mockProducts
      } else {
        products.value = [...products.value, ...mockProducts]
      }
      hasMore.value = page.value < 3
    }
  } catch (error) {
    console.error('Error loading products:', error)
    // Fallback to mock data if API fails
    const mockProducts = generateMockProducts(activeCategory.value)
    if (page.value === 1) {
      products.value = mockProducts
    } else {
      products.value = [...products.value, ...mockProducts]
    }
    hasMore.value = page.value < 3
  } finally {
    loading.value = false
  }
}

let searchTimer: ReturnType<typeof setTimeout> | null = null

const handleSearch = () => {
  // Simple debounce
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
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
    toast.show(`最多选择${props.maxSelection}种产品`, 'none')
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

  toast.show('已添加到选择', 'success', 1000)
}

const handleProductSelect = (product: Product) => {
  if (isProductDisabled(product.id)) {
    toast.show(`最多选择${props.maxSelection}种产品`, 'none')
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

  showSkuModal.value = true
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

  toast.success(editingIndex.value !== -1 ? '已更新选择' : '已添加到选择')
}

const removeSelectedItem = (index: number) => {
  localSelectedProducts.value.splice(index, 1)
  emitUpdate()
}

const closeSkuModal = () => {
  showSkuModal.value = false
  selectedProduct.value = null
  editingIndex.value = -1
}

const emitUpdate = () => {
  emit('update:selectedProducts', [...localSelectedProducts.value])
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
@import '@/styles/design-tokens.scss';
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.step-customer {
  max-width: 500px;
  margin: 0 auto;
}

.customer-card {
  @include card;
  margin-bottom: $space-6;
  padding: $space-6;
  border-radius: $radius-2xl;
}

.card-title {
  display: flex;
  align-items: center;
  margin-bottom: $space-4;
  cursor: pointer;
  position: relative;
}

.title-icon {
  font-size: $text-lg;
  margin-right: $space-3;
}

.title-text {
  font-size: $text-lg;
  font-weight: $font-semibold;
  color: $gray-900;
  flex: 1;
  margin: 0;
}

.optional-badge {
  background-color: $primary-100;
  color: $primary-700;
  font-size: $text-xs;
  padding: $space-1 $space-3;
  border-radius: $radius-full;
  margin-right: $space-2;
  font-weight: $font-medium;
}

.collapse-icon {
  font-size: $text-sm;
  color: $gray-500;
  transition: $transition-base;
}

.step-subtitle {
  font-size: $text-sm;
  color: $gray-600;
  line-height: $leading-relaxed;
  margin: 0;
}

.form-group {
  margin-bottom: $space-6;

  &:last-child {
    margin-bottom: 0;
  }
}

// Search and Filter - using consistent card styling
.search-box {
  display: flex;
  align-items: center;
  background-color: $gray-50;
  border-radius: $radius-lg;
  padding: $space-3 $space-4;
  margin-bottom: $space-4;
}

.search-icon {
  font-size: $text-base;
  margin-right: $space-3;
  color: $gray-500;
}

.search-input {
  flex: 1;
  font-size: $text-base;
  color: $gray-900;
  background: transparent;
  border: none;

  &::placeholder {
    color: $gray-500;
  }

  &:focus {
    outline: none;
  }
}

.clear-search {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: $gray-500;
  font-size: $text-lg;
  cursor: pointer;

  &:hover {
    color: $gray-700;
  }
}

.filter-chips {
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    display: none;
  }
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

// Selected Summary - using consistent card styling
.summary-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $space-4;
  cursor: pointer;
  background-color: $gray-50;
  border-radius: $radius-lg;
  margin-bottom: $space-4;
  transition: $transition-base;

  &:hover {
    background-color: $gray-100;
  }
}

.summary-total {
  font-size: $text-lg;
  font-weight: $font-bold;
  color: $primary-600;
}

.selected-list {
  border-top: 1px solid $gray-200;
  padding-top: $space-4;
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

// Products Container - nested within card
.products-container {
  // Container is now within customer-card, no additional margin needed
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

// Modal Overlay
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: $z-index-modal;
  padding: $spacing-base;
}

// SKU Modal
.sku-modal {
  width: 100%;
  max-width: 500px;
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
