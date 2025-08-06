<template>
  <view :class="['product-selector', `product-selector--${mode}`]">
    <!-- Modal wrapper for modal mode -->
    <uni-popup
      v-if="mode === 'modal'"
      ref="popupRef"
      type="bottom"
      :mask-click="false"
      @change="handlePopupChange"
    >
      <view class="selector-modal">
        <view class="selector-content">
          <ProductSelectorContent
            :categories="categories"
            :selected-products="selectedProducts"
            :max-selection="maxSelection"
            @confirm="handleConfirm"
            @cancel="handleCancel"
          />
        </view>
      </view>
    </uni-popup>

    <!-- Direct content for page mode -->
    <view v-else class="selector-page">
      <ProductSelectorContent
        :categories="categories"
        :selected-products="selectedProducts"
        :max-selection="maxSelection"
        @confirm="handleConfirm"
        @cancel="handleCancel"
      />
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import ProductSelectorContent from './ProductSelectorContent.vue'
import type { Product, Category } from '@/types/api'

export interface SelectedProduct {
  product: Product
  quantity: number
  skuId?: string
  skuName?: string
  price: number
  subtotal: number
}

interface Props {
  mode?: 'modal' | 'page'
  show?: boolean
  selectedProducts?: SelectedProduct[]
  categories?: Category[]
  maxSelection?: number
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'modal',
  show: false,
  selectedProducts: () => [],
  categories: () => [],
  maxSelection: undefined
})

const emit = defineEmits<{
  confirm: [products: SelectedProduct[]]
  cancel: []
  'update:show': [value: boolean]
}>()

const popupRef = ref()

watch(() => props.show, async (newVal) => {
  if (props.mode === 'modal' && popupRef.value) {
    await nextTick()
    if (newVal) {
      popupRef.value.open()
    } else {
      popupRef.value.close()
    }
  }
})

const handlePopupChange = (e: { show: boolean }) => {
  emit('update:show', e.show)
}

const handleConfirm = (products: SelectedProduct[]) => {
  emit('confirm', products)
  if (props.mode === 'modal') {
    emit('update:show', false)
  }
}

const handleCancel = () => {
  emit('cancel')
  if (props.mode === 'modal') {
    emit('update:show', false)
  }
}
</script>

<style scoped>
.product-selector {
  width: 100%;
  height: 100%;
}

/* Modal mode styles */
.selector-modal {
  background-color: #fff;
  border-radius: 24rpx 24rpx 0 0;
  overflow: hidden;
  height: 90vh;
  display: flex;
  flex-direction: column;
}

.selector-content {
  flex: 1;
  overflow: hidden;
}

/* Page mode styles */
.selector-page {
  width: 100%;
  height: 100%;
  background-color: #f5f5f5;
}
</style>