<!--
  Enhanced Product Card Component
  Mobile-first design with visual appeal and touch-friendly interactions
-->
<template>
  <view
    class="product-card"
    :class="{
      'product-card--selected': isSelected,
      'product-card--disabled': disabled
    }"
    @click="handleCardClick"
  >
    <!-- Product Image Section -->
    <view class="card-image-section">
      <image
        class="product-image"
        :src="product.image || '/static/images/default-product.png'"
        mode="aspectFill"
        lazy-load
        @error="handleImageError"
      />

      <!-- Price Badge (Top Left) -->
      <view class="price-badge">
        <text class="price-text">¥{{ product.price }}</text>
        <text v-if="product.unit" class="price-unit">/{{ product.unit }}</text>
      </view>

      <!-- Stock Badge (Top Right) -->
      <view v-if="product.stock !== undefined" class="stock-badge" :class="stockBadgeClass">
        <text class="stock-text">{{ stockText }}</text>
      </view>

      <!-- Selection Badge (Center) -->
      <view v-if="isSelected" class="selection-badge">
        <text class="selection-count">{{ selectedQuantity }}</text>
      </view>

      <!-- Quick Add Button -->
      <view
        v-else-if="!disabled && showQuickAdd"
        class="quick-add-button"
        @click.stop="handleQuickAdd"
      >
        <text class="add-icon">+</text>
      </view>

      <!-- Image Overlay for Better Text Contrast -->
      <view class="image-overlay"></view>
    </view>

    <!-- Product Information Section -->
    <view class="card-info-section">
      <!-- Product Name -->
      <text class="product-name" :title="product.name">{{ product.name }}</text>

      <!-- Product Model/SKU -->
      <text class="product-model" v-if="product.model">{{ product.model }}</text>

      <!-- Product Features/Tags -->
      <view v-if="product.features?.length" class="product-features">
        <text v-for="feature in displayFeatures" :key="feature" class="feature-tag">
          {{ feature }}
        </text>
      </view>

      <!-- Product Rating (if available) -->
      <view v-if="product.rating" class="product-rating">
        <view class="rating-stars">
          <text
            v-for="star in 5"
            :key="star"
            class="star"
            :class="{ 'star--filled': star <= Math.floor(product.rating) }"
          >
            ★
          </text>
        </view>
        <text class="rating-text">{{ product.rating.toFixed(1) }}</text>
      </view>

      <!-- Price and Actions Row -->
      <view class="card-bottom-row">
        <view class="price-section">
          <text class="current-price">¥{{ product.price }}</text>
          <text
            v-if="product.originalPrice && product.originalPrice > product.price"
            class="original-price"
          >
            ¥{{ product.originalPrice }}
          </text>
        </view>

        <!-- Action Buttons -->
        <view class="action-buttons">
          <SalesButton
            v-if="!isSelected"
            size="small"
            type="primary"
            @click.stop="handleSelect"
            :disabled="disabled"
          >
            选择
          </SalesButton>

          <SalesButton v-else size="mini" type="default" @click.stop="handleEdit">
            编辑
          </SalesButton>

          <!-- Favorite Button (if functionality exists) -->
          <view
            v-if="showFavorite"
            class="favorite-button"
            :class="{ 'favorite-button--active': isFavorite }"
            @click.stop="toggleFavorite"
          >
            <text class="favorite-icon">{{ isFavorite ? '❤️' : '🤍' }}</text>
          </view>
        </view>
      </view>

      <!-- Additional Info Toggle -->
      <view v-if="hasAdditionalInfo" class="info-toggle" @click.stop="toggleInfo">
        <text class="toggle-text">{{ showInfo ? '收起' : '详情' }}</text>
        <text class="toggle-icon">{{ showInfo ? '▲' : '▼' }}</text>
      </view>

      <!-- Expandable Additional Information -->
      <view v-if="showInfo" class="additional-info">
        <text v-if="product.description" class="product-description">
          {{ product.description }}
        </text>

        <view v-if="product.specifications?.length" class="specifications">
          <text class="spec-title">规格参数</text>
          <view class="spec-list">
            <view v-for="spec in product.specifications" :key="spec.name" class="spec-item">
              <text class="spec-name">{{ spec.name }}</text>
              <text class="spec-value">{{ spec.value }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- Loading State -->
    <view v-if="loading" class="card-loading">
      <view class="loading-spinner"></view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import SalesButton from './SalesButton.vue'
import type { Product } from '@/types/api'

interface Props {
  product: Product
  isSelected?: boolean
  selectedQuantity?: number
  disabled?: boolean
  showQuickAdd?: boolean
  showFavorite?: boolean
  isFavorite?: boolean
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isSelected: false,
  selectedQuantity: 0,
  disabled: false,
  showQuickAdd: true,
  showFavorite: false,
  isFavorite: false,
  loading: false
})

const emit = defineEmits<{
  select: [product: Product]
  quickAdd: [product: Product]
  edit: [product: Product]
  favorite: [product: Product, favorite: boolean]
}>()

// Local state
const showInfo = ref(false)

// Computed properties
const stockBadgeClass = computed(() => {
  if (!props.product.stock) return ''

  if (props.product.stock <= 5) {
    return 'stock-badge--low'
  } else if (props.product.stock <= 20) {
    return 'stock-badge--medium'
  } else {
    return 'stock-badge--high'
  }
})

const stockText = computed(() => {
  const stock = props.product.stock
  if (stock === undefined) return ''

  if (stock === 0) return '缺货'
  if (stock <= 5) return `仅${stock}件`
  if (stock <= 20) return '现货'
  return '充足'
})

const displayFeatures = computed(() => {
  // Show only first 2-3 features to avoid overcrowding
  return props.product.features?.slice(0, 3) || []
})

const hasAdditionalInfo = computed(() => {
  return props.product.description || props.product.specifications?.length
})

// Methods
const handleCardClick = () => {
  if (props.disabled) return
  handleSelect()
}

const handleSelect = () => {
  emit('select', props.product)
}

const handleQuickAdd = () => {
  emit('quickAdd', props.product)

  // Haptic feedback on supported devices - Web implementation
  if ('vibrate' in navigator) {
    try {
      // Short vibration for light haptic feedback
      navigator.vibrate(50) // 50ms vibration
    } catch (error) {
      console.warn('Vibration not supported or failed:', error)
    }
  }
}

const handleEdit = () => {
  emit('edit', props.product)
}

const toggleFavorite = () => {
  const newFavoriteState = !props.isFavorite
  emit('favorite', props.product, newFavoriteState)

  // Show feedback - Web implementation
  const message = newFavoriteState ? '已添加收藏' : '已取消收藏'
  console.log('Favorite toggle:', message)
  
  // For less intrusive feedback, could implement a toast notification library
  // For now, just log the action (could show brief alert for important actions)
  if (newFavoriteState) {
    console.log(`✅ Added ${props.product.name} to favorites`)
  }
}

const toggleInfo = () => {
  showInfo.value = !showInfo.value
}

const handleImageError = () => {
  // Could implement fallback image logic here
  console.warn(`Failed to load image for product: ${props.product.name}`)
}
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.product-card {
  @include card;
  padding: 0;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
  overflow: hidden;
  background-color: $bg-color-white;
  position: relative;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  }

  &:active {
    transform: translateY(0);
  }

  &--selected {
    border-color: $primary-color;
    background-color: $primary-bg;

    .card-info-section {
      background-color: rgba(37, 99, 235, 0.05);
    }
  }

  &--disabled {
    opacity: 0.6;
    cursor: not-allowed;

    &:hover {
      transform: none;
      box-shadow: $box-shadow-base;
    }
  }
}

// Image Section
.card-image-section {
  position: relative;
  height: 180px;
  overflow: hidden;
}

.product-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  background-color: $bg-color-page;
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    135deg,
    rgba(0, 0, 0, 0.1) 0%,
    rgba(0, 0, 0, 0.05) 50%,
    rgba(0, 0, 0, 0.2) 100%
  );
  pointer-events: none;
}

.price-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  background: linear-gradient(135deg, $danger-color, $danger-light);
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: $font-size-small;
  font-weight: $font-weight-semibold;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  z-index: 2;
}

.price-text {
  font-size: $font-size-small;
  font-weight: $font-weight-bold;
}

.price-unit {
  font-size: $font-size-extra-small;
  opacity: 0.9;
  margin-left: 2px;
}

.stock-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: $font-size-extra-small;
  font-weight: $font-weight-medium;
  z-index: 2;

  &--high {
    background-color: $success-color;
    color: white;
  }

  &--medium {
    background-color: $warning-color;
    color: white;
  }

  &--low {
    background-color: $danger-color;
    color: white;
  }
}

.selection-badge {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 50px;
  height: 50px;
  background: linear-gradient(135deg, $primary-color, $primary-light);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: $font-size-large;
  font-weight: $font-weight-bold;
  box-shadow: 0 4px 15px rgba(37, 99, 235, 0.4);
  z-index: 2;
  animation: scaleIn 0.3s ease-out;
}

.quick-add-button {
  position: absolute;
  bottom: 8px;
  right: 8px;
  width: 36px;
  height: 36px;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: $font-size-large;
  font-weight: $font-weight-bold;
  transition: all 0.2s ease;
  z-index: 2;

  &:hover {
    background-color: rgba(0, 0, 0, 0.8);
    transform: scale(1.1);
  }

  &:active {
    transform: scale(0.95);
  }
}

// Information Section
.card-info-section {
  padding: $spacing-base;
  background-color: $bg-color-white;
}

.product-name {
  font-size: $font-size-base;
  font-weight: $font-weight-semibold;
  color: $text-color;
  display: block;
  margin-bottom: $spacing-xs;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.4;
}

.product-model {
  font-size: $font-size-small;
  color: $text-color-secondary;
  display: block;
  margin-bottom: $spacing-sm;
  font-family: 'Courier New', monospace;
}

.product-features {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: $spacing-sm;
}

.feature-tag {
  background-color: $info-bg;
  color: $info-color;
  padding: 2px 6px;
  border-radius: 8px;
  font-size: $font-size-extra-small;
  font-weight: $font-weight-medium;
}

.product-rating {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
  margin-bottom: $spacing-sm;
}

.rating-stars {
  display: flex;
  gap: 1px;
}

.star {
  font-size: $font-size-small;
  color: #ddd;

  &--filled {
    color: #ffc107;
  }
}

.rating-text {
  font-size: $font-size-small;
  color: $text-color-secondary;
  font-weight: $font-weight-medium;
}

.card-bottom-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $spacing-sm;
}

.price-section {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
}

.current-price {
  font-size: $font-size-medium;
  font-weight: $font-weight-bold;
  color: $danger-color;
}

.original-price {
  font-size: $font-size-small;
  color: $text-color-secondary;
  text-decoration: line-through;
}

.action-buttons {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
}

.favorite-button {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: $transition-base;

  &--active {
    animation: pulse 0.6s ease-in-out;
  }
}

.favorite-icon {
  font-size: $font-size-base;
}

// Info Toggle
.info-toggle {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: $spacing-xs;
  padding: $spacing-xs;
  background-color: $bg-color-page;
  border-radius: $border-radius-base;
  cursor: pointer;
  transition: $transition-base;
  margin-top: $spacing-sm;

  &:hover {
    background-color: $border-color-light;
  }
}

.toggle-text {
  font-size: $font-size-small;
  color: $text-color-secondary;
  font-weight: $font-weight-medium;
}

.toggle-icon {
  font-size: $font-size-small;
  color: $text-color-secondary;
  transition: transform 0.2s ease;
}

// Additional Info
.additional-info {
  margin-top: $spacing-sm;
  padding-top: $spacing-sm;
  border-top: 1px solid $border-color-extra-light;
  animation: slideDown 0.3s ease-out;
}

.product-description {
  font-size: $font-size-small;
  color: $text-color-secondary;
  line-height: 1.5;
  margin-bottom: $spacing-sm;
}

.specifications {
  margin-top: $spacing-sm;
}

.spec-title {
  font-size: $font-size-small;
  font-weight: $font-weight-semibold;
  color: $text-color;
  display: block;
  margin-bottom: $spacing-xs;
}

.spec-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.spec-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: $bg-color-page;
  padding: $spacing-xs;
  border-radius: $border-radius-sm;
}

.spec-name {
  font-size: $font-size-extra-small;
  color: $text-color-secondary;
}

.spec-value {
  font-size: $font-size-extra-small;
  color: $text-color;
  font-weight: $font-weight-medium;
}

// Loading State
.card-loading {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid $border-color-light;
  border-top-color: $primary-color;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

// Animations
@keyframes scaleIn {
  from {
    transform: translate(-50%, -50%) scale(0.8);
    opacity: 0;
  }
  to {
    transform: translate(-50%, -50%) scale(1);
    opacity: 1;
  }
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
}

@keyframes slideDown {
  from {
    opacity: 0;
    max-height: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    max-height: 200px;
    transform: translateY(0);
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

// Responsive Design
@media (max-width: $breakpoint-sm) {
  .card-image-section {
    height: 150px;
  }

  .card-bottom-row {
    flex-direction: column;
    align-items: stretch;
    gap: $spacing-sm;
  }

  .price-section {
    justify-content: center;
  }

  .action-buttons {
    justify-content: center;
  }

  .product-features {
    justify-content: center;
  }
}

@media (min-width: $breakpoint-lg) {
  .product-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 35px rgba(0, 0, 0, 0.2);
  }

  .card-image-section {
    height: 200px;
  }
}

// Dark mode support
@media (prefers-color-scheme: dark) {
  .product-card {
    background-color: #2d2d2d;
    border-color: #404040;
  }

  .card-info-section {
    background-color: #2d2d2d;
  }

  .product-name {
    color: #ffffff;
  }

  .info-toggle {
    background-color: #404040;

    &:hover {
      background-color: #505050;
    }
  }
}

// Accessibility
.product-card:focus {
  outline: 2px solid $primary-color;
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  .product-card,
  .selection-badge,
  .additional-info,
  .loading-spinner {
    animation: none;
    transition: none;
  }

  .quick-add-button:hover {
    transform: none;
  }
}
</style>
