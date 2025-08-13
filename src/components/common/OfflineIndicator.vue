<template>
  <view class="offline-indicator-container">
    <!-- Network Status Banner -->
    <view
      v-if="showNetworkBanner"
      class="network-banner"
      :class="{
        'banner-offline': isOffline,
        'banner-online': !isOffline && wasOffline,
        'banner-syncing': isSyncing
      }"
      @click="handleBannerClick"
    >
      <view class="banner-content">
        <view class="banner-icon">
          <text v-if="isOffline">📵</text>
          <text v-else-if="isSyncing">🔄</text>
          <text v-else>📶</text>
        </view>
        <view class="banner-text">
          <text class="banner-title">{{ bannerTitle }}</text>
          <text v-if="bannerSubtitle" class="banner-subtitle">{{ bannerSubtitle }}</text>
        </view>
        <view v-if="showProgress" class="banner-progress">
          <view class="progress-bar">
            <view class="progress-fill" :style="{ width: `${syncProgress}%` }"></view>
          </view>
          <text class="progress-text">{{ syncProgress }}%</text>
        </view>
      </view>
    </view>

    <!-- Floating Sync Button -->
    <view
      v-if="showSyncButton"
      class="sync-button"
      :class="{ 'button-syncing': isSyncing }"
      @click="handleSyncClick"
    >
      <view class="sync-icon">
        <text v-if="isSyncing">🔄</text>
        <text v-else-if="pendingCount > 0">💾</text>
        <text v-else>✅</text>
      </view>
      <view v-if="pendingCount > 0" class="sync-badge">
        {{ pendingCount }}
      </view>
    </view>

    <!-- Offline Status Detail Modal -->
    <uni-popup ref="statusModal" type="center" :mask-click="true">
      <view class="status-modal">
        <view class="modal-header">
          <text class="modal-title">离线状态详情</text>
          <text class="modal-close" @click="closeStatusModal">✕</text>
        </view>

        <view class="modal-content">
          <!-- Network Status -->
          <view class="status-section">
            <view class="section-title">网络状态</view>
            <view class="status-row">
              <text class="status-label">连接状态:</text>
              <text class="status-value" :class="{ 'text-offline': isOffline }">
                {{ isOffline ? '离线' : '在线' }}
              </text>
            </view>
            <view v-if="networkInfo.connectionType" class="status-row">
              <text class="status-label">连接类型:</text>
              <text class="status-value">{{ connectionTypeText }}</text>
            </view>
            <view v-if="lastSyncTime > 0" class="status-row">
              <text class="status-label">最后同步:</text>
              <text class="status-value">{{ formatTime(lastSyncTime) }}</text>
            </view>
          </view>

          <!-- Sync Status -->
          <view class="status-section">
            <view class="section-title">同步状态</view>
            <view class="status-row">
              <text class="status-label">待同步操作:</text>
              <text class="status-value text-primary">{{ pendingCount }}</text>
            </view>
            <view v-if="failedCount > 0" class="status-row">
              <text class="status-label">失败操作:</text>
              <text class="status-value text-error">{{ failedCount }}</text>
            </view>
            <view v-if="conflictCount > 0" class="status-row">
              <text class="status-label">冲突操作:</text>
              <text class="status-value text-warning">{{ conflictCount }}</text>
            </view>
          </view>

          <!-- Sync Progress -->
          <view v-if="isSyncing" class="status-section">
            <view class="section-title">同步进度</view>
            <view class="progress-container">
              <view class="progress-bar-large">
                <view class="progress-fill-large" :style="{ width: `${syncProgress}%` }"></view>
              </view>
              <text class="progress-percentage">{{ syncProgress }}%</text>
            </view>
          </view>

          <!-- Actions -->
          <view class="modal-actions">
            <button
              v-if="!isSyncing && pendingCount > 0"
              class="action-button primary"
              @click="triggerSync"
            >
              立即同步
            </button>
            <button v-if="failedCount > 0" class="action-button secondary" @click="clearFailed">
              清除失败
            </button>
            <button class="action-button secondary" @click="closeStatusModal">关闭</button>
          </view>
        </view>
      </view>
    </uni-popup>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useOfflineSync } from '@/services/offline'
// Native date formatting instead of date-fns to avoid dependency

/**
 * Props
 */
interface Props {
  showBanner?: boolean
  showSyncButton?: boolean
  autoHide?: boolean
  hideDelay?: number
}

const props = withDefaults(defineProps<Props>(), {
  showBanner: true,
  showSyncButton: true,
  autoHide: true,
  hideDelay: 5000
})

/**
 * Offline sync composable
 */
const {
  isOffline,
  isOnline,
  hasPendingChanges,
  syncProgress,
  isSyncing,
  pendingCount,
  failedCount,
  conflictCount,
  sync,
  clearFailed,
  networkStatus,
  lastSyncTime
} = useOfflineSync()

/**
 * Local state
 */
const statusModal = ref()
const wasOffline = ref(false)
const showNetworkBanner = ref(false)
const bannerHideTimer = ref<number>()

/**
 * Network info
 */
const networkInfo = computed(() => networkStatus)

const connectionTypeText = computed(() => {
  const type = networkInfo.value.connectionType
  const typeMap: Record<string, string> = {
    wifi: 'WiFi',
    '2g': '2G',
    '3g': '3G',
    '4g': '4G',
    '5g': '5G',
    ethernet: '以太网',
    none: '无连接'
  }
  return typeMap[type || ''] || '未知'
})

/**
 * Banner state
 */
const bannerTitle = computed(() => {
  if (isSyncing) {
    return '正在同步数据...'
  } else if (isOffline) {
    return '网络已断开'
  } else if (wasOffline.value) {
    return '网络已恢复'
  } else {
    return '网络正常'
  }
})

const bannerSubtitle = computed(() => {
  if (isSyncing) {
    return `同步中 ${pendingCount.value} 项更改`
  } else if (isOffline) {
    return pendingCount.value > 0
      ? `${pendingCount.value} 项更改待同步`
      : '离线模式，数据将稍后同步'
  } else if (wasOffline.value && pendingCount.value === 0) {
    return '所有数据已同步'
  } else {
    return null
  }
})

const showProgress = computed(() => isSyncing && syncProgress < 100)
const showSyncButton = computed(
  () => props.showSyncButton && (pendingCount.value > 0 || failedCount.value > 0)
)

/**
 * Watch network status
 */
watch(
  () => isOffline,
  offline => {
    if (offline) {
      // Going offline
      wasOffline.value = false
      showNetworkBanner.value = true
      clearBannerTimer()
    } else if (wasOffline.value || pendingCount.value > 0) {
      // Coming back online
      showNetworkBanner.value = true

      // Auto-hide banner after delay
      if (props.autoHide) {
        setBannerTimer()
      }
    }
  },
  { immediate: true }
)

watch(isSyncing, syncing => {
  if (syncing) {
    showNetworkBanner.value = true
    clearBannerTimer()
  } else {
    // Hide banner after sync completes
    if (props.autoHide && !isOffline) {
      setBannerTimer()
    }

    // Mark as was offline for recovery banner
    if (!isOffline) {
      wasOffline.value = true
      setTimeout(() => {
        wasOffline.value = false
      }, props.hideDelay)
    }
  }
})

/**
 * Banner timer management
 */
function setBannerTimer() {
  clearBannerTimer()
  bannerHideTimer.value = setTimeout(() => {
    showNetworkBanner.value = false
    wasOffline.value = false
  }, props.hideDelay) as unknown as number
}

function clearBannerTimer() {
  if (bannerHideTimer.value) {
    clearTimeout(bannerHideTimer.value)
    bannerHideTimer.value = undefined
  }
}

/**
 * Event handlers
 */
function handleBannerClick() {
  openStatusModal()
}

function handleSyncClick() {
  if (isSyncing) {
    openStatusModal()
  } else {
    triggerSync()
  }
}

function openStatusModal() {
  statusModal.value?.open()
}

function closeStatusModal() {
  statusModal.value?.close()
}

async function triggerSync() {
  try {
    await sync()
    // Web implementation - show sync success feedback
    console.log('Sync completed successfully: 同步完成')
    // Could implement toast notification library here
  } catch (error) {
    // Web implementation - show sync failure feedback  
    console.error('Sync failed: 同步失败', error)
    alert('同步失败，请检查网络连接')
  }
}

function formatTime(timestamp: number): string {
  if (timestamp === 0) return '从未'

  try {
    const now = Date.now()
    const diff = now - timestamp
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (seconds < 60) {
      return '刚刚'
    } else if (minutes < 60) {
      return `${minutes}分钟前`
    } else if (hours < 24) {
      return `${hours}小时前`
    } else if (days < 7) {
      return `${days}天前`
    } else {
      return new Date(timestamp).toLocaleDateString('zh-CN')
    }
  } catch {
    return '未知'
  }
}

/**
 * Lifecycle
 */
onMounted(() => {
  // Initial state
  if (isOffline || pendingCount.value > 0) {
    showNetworkBanner.value = true
  }
})

onUnmounted(() => {
  clearBannerTimer()
})
</script>

<style lang="scss" scoped>
.offline-indicator-container {
  position: relative;
  z-index: 9999;
}

/* Network Banner */
.network-banner {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10000;
  padding: 12rpx 32rpx;
  backdrop-filter: blur(10px);
  border-bottom: 1rpx solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;

  &.banner-offline {
    background: linear-gradient(90deg, rgba(239, 68, 68, 0.9), rgba(220, 38, 38, 0.9));
    color: white;
  }

  &.banner-online {
    background: linear-gradient(90deg, rgba(34, 197, 94, 0.9), rgba(22, 163, 74, 0.9));
    color: white;
  }

  &.banner-syncing {
    background: linear-gradient(90deg, rgba(59, 130, 246, 0.9), rgba(37, 99, 235, 0.9));
    color: white;
  }
}

.banner-content {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.banner-icon {
  font-size: 32rpx;

  text {
    animation: pulse 2s infinite;
  }
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.banner-text {
  flex: 1;

  .banner-title {
    display: block;
    font-size: 28rpx;
    font-weight: 600;
    line-height: 1.2;
  }

  .banner-subtitle {
    display: block;
    font-size: 24rpx;
    opacity: 0.9;
    line-height: 1.2;
    margin-top: 4rpx;
  }
}

.banner-progress {
  display: flex;
  align-items: center;
  gap: 16rpx;
  min-width: 120rpx;
}

.progress-bar {
  flex: 1;
  height: 8rpx;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 4rpx;
  overflow: hidden;

  .progress-fill {
    height: 100%;
    background: white;
    border-radius: 4rpx;
    transition: width 0.3s ease;
  }
}

.progress-text {
  font-size: 24rpx;
  font-weight: 600;
  min-width: 60rpx;
  text-align: right;
}

/* Sync Button */
.sync-button {
  position: fixed;
  bottom: 160rpx;
  right: 32rpx;
  width: 96rpx;
  height: 96rpx;
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 24rpx rgba(59, 130, 246, 0.4);
  z-index: 1000;
  transition: all 0.3s ease;

  &:active {
    transform: scale(0.95);
  }

  &.button-syncing {
    animation: rotate 1s linear infinite;
  }
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.sync-icon {
  font-size: 40rpx;
  color: white;
}

.sync-badge {
  position: absolute;
  top: -8rpx;
  right: -8rpx;
  min-width: 32rpx;
  height: 32rpx;
  background: #ef4444;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20rpx;
  color: white;
  font-weight: 600;
  padding: 0 8rpx;
  border: 2rpx solid white;
}

/* Status Modal */
.status-modal {
  width: 640rpx;
  background: white;
  border-radius: 16rpx;
  overflow: hidden;
  box-shadow: 0 24rpx 48rpx rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32rpx;
  border-bottom: 1rpx solid #e5e7eb;
  background: #f9fafb;

  .modal-title {
    font-size: 32rpx;
    font-weight: 600;
    color: #111827;
  }

  .modal-close {
    font-size: 36rpx;
    color: #6b7280;
    padding: 8rpx;
    margin: -8rpx;
  }
}

.modal-content {
  padding: 32rpx;
}

.status-section {
  margin-bottom: 32rpx;

  &:last-child {
    margin-bottom: 0;
  }
}

.section-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #374151;
  margin-bottom: 16rpx;
}

.status-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12rpx 0;

  .status-label {
    font-size: 26rpx;
    color: #6b7280;
  }

  .status-value {
    font-size: 26rpx;
    color: #111827;
    font-weight: 500;

    &.text-primary {
      color: #3b82f6;
    }

    &.text-error {
      color: #ef4444;
    }

    &.text-warning {
      color: #f59e0b;
    }

    &.text-offline {
      color: #ef4444;
    }
  }
}

.progress-container {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.progress-bar-large {
  flex: 1;
  height: 16rpx;
  background: #e5e7eb;
  border-radius: 8rpx;
  overflow: hidden;

  .progress-fill-large {
    height: 100%;
    background: linear-gradient(90deg, #3b82f6, #1d4ed8);
    border-radius: 8rpx;
    transition: width 0.3s ease;
  }
}

.progress-percentage {
  font-size: 24rpx;
  color: #3b82f6;
  font-weight: 600;
  min-width: 60rpx;
  text-align: right;
}

.modal-actions {
  display: flex;
  gap: 16rpx;
  margin-top: 32rpx;
  padding-top: 32rpx;
  border-top: 1rpx solid #e5e7eb;
}

.action-button {
  flex: 1;
  height: 80rpx;
  border: none;
  border-radius: 8rpx;
  font-size: 26rpx;
  font-weight: 500;
  transition: all 0.2s ease;

  &.primary {
    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
    color: white;

    &:active {
      transform: scale(0.98);
    }
  }

  &.secondary {
    background: #f3f4f6;
    color: #374151;

    &:active {
      background: #e5e7eb;
    }
  }
}
</style>
