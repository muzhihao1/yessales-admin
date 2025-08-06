<template>
  <view class="realtime-indicator" @click="onIndicatorClick">
    <view 
      :class="['status-dot', { 'pulse': indicatorProps.pulse }]"
      :style="{ backgroundColor: indicatorProps.color }"
    ></view>
    <text class="status-text">{{ indicatorProps.text }}</text>
    <text class="status-icon">{{ indicatorProps.icon }}</text>
  </view>
</template>

<script setup lang="ts">
import { useRealtimeIndicator } from '@/composables/useRealtimeStatus'

const { indicatorProps, onIndicatorClick, isConnected, quality } = useRealtimeIndicator()
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.realtime-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 12px;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateY(-1px);
  }
  
  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    transition: all 0.3s ease;
    
    &.pulse {
      animation: pulse 2s infinite;
    }
  }
  
  .status-text {
    color: rgba(255, 255, 255, 0.9);
    font-weight: 500;
    font-size: 11px;
  }
  
  .status-icon {
    font-size: 10px;
  }
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.7;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

// Dark theme adjustments
.dark {
  .realtime-indicator {
    background: rgba(0, 0, 0, 0.3);
    border-color: rgba(255, 255, 255, 0.1);
    
    &:hover {
      background: rgba(0, 0, 0, 0.4);
    }
    
    .status-text {
      color: rgba(255, 255, 255, 0.8);
    }
  }
}

// Responsive design
@media (max-width: 768px) {
  .realtime-indicator {
    padding: 4px 8px;
    gap: 6px;
    
    .status-text {
      display: none; // Hide text on mobile, show only dot and icon
    }
    
    .status-dot {
      width: 6px;
      height: 6px;
    }
    
    .status-icon {
      font-size: 12px;
    }
  }
}
</style>