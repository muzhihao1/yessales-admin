<template>
  <view v-if="visible" class="modal-overlay" @click="handleOverlayClick">
    <view class="modal-container" :style="{ width: width }" @click.stop>
      <view class="modal-header">
        <text class="modal-title">{{ title }}</text>
        <button class="close-btn" @click="handleClose">×</button>
      </view>
      
      <view class="modal-content">
        <slot />
      </view>
      
      <view v-if="$slots.footer" class="modal-footer">
        <slot name="footer" />
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
/**
 * Base Modal Component
 * 
 * A reusable modal wrapper component that provides:
 * - Overlay backdrop
 * - Modal container with customizable width
 * - Header with title and close button
 * - Content slot for modal body
 * - Optional footer slot
 * - Close on overlay click (optional)
 */

interface Props {
  visible: boolean
  title: string
  width?: string
  closeOnOverlay?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  width: '600px',
  closeOnOverlay: true
})

const emit = defineEmits<{
  close: []
}>()

function handleClose() {
  emit('close')
}

function handleOverlayClick() {
  if (props.closeOnOverlay) {
    handleClose()
  }
}
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-container {
  background: $bg-color-white;
  border-radius: $border-radius-lg;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  animation: slideUp 0.3s ease;
  max-width: 95vw;
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $spacing-lg;
  border-bottom: 1px solid $border-color;
  
  .modal-title {
    font-size: $font-size-large;
    font-weight: 600;
    color: $text-color;
  }
  
  .close-btn {
    width: 32px;
    height: 32px;
    border: none;
    background: none;
    font-size: 24px;
    color: $text-color-secondary;
    cursor: pointer;
    border-radius: $border-radius-base;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
    
    &:hover {
      background: $bg-color;
      color: $text-color;
    }
  }
}

.modal-content {
  max-height: calc(90vh - 120px);
  overflow-y: auto;
  padding: $spacing-lg;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: $spacing-base;
  padding: $spacing-lg;
  border-top: 1px solid $border-color;
  background: $bg-color;
}

// Responsive design
@media (max-width: 768px) {
  .modal-container {
    width: 95vw !important;
    max-height: 95vh;
    margin: 0 10px;
  }
  
  .modal-header {
    padding: $spacing-md;
    
    .modal-title {
      font-size: $font-size-medium;
    }
  }
  
  .modal-content {
    padding: $spacing-md;
    max-height: calc(95vh - 100px);
  }
  
  .modal-footer {
    padding: $spacing-md;
    flex-wrap: wrap;
    
    > * {
      flex: 1;
      min-width: 120px;
    }
  }
}

@media (max-width: 480px) {
  .modal-header {
    flex-direction: column;
    align-items: stretch;
    gap: $spacing-sm;
    
    .close-btn {
      align-self: flex-end;
      position: absolute;
      top: $spacing-sm;
      right: $spacing-sm;
    }
  }
}
</style>