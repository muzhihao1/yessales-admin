<template>
  <scroll-view
    class="virtual-list"
    :style="{ height: `${containerHeight}px` }"
    :scroll-y="true"
    :scroll-top="scrollTop"
    @scroll="handleScroll"
    enhanced
    :show-scrollbar="false"
  >
    <!-- Spacer before visible items -->
    <view
      v-if="startIndex > 0"
      :style="{ height: `${offsetBefore}px` }"
      class="virtual-spacer"
    ></view>

    <!-- Visible items -->
    <view
      v-for="(item, index) in visibleItems"
      :key="getItemKey(item, startIndex + index)"
      :style="{ height: `${itemHeight}px` }"
      class="virtual-item"
    >
      <slot
        :item="item"
        :index="startIndex + index"
        :active="startIndex + index >= activeStart && startIndex + index <= activeEnd"
      >
        <view class="default-item">{{ item }}</view>
      </slot>
    </view>

    <!-- Spacer after visible items -->
    <view
      v-if="endIndex < items.length"
      :style="{ height: `${offsetAfter}px` }"
      class="virtual-spacer"
    ></view>
  </scroll-view>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useComponentPerformance } from '@/utils/performance'

/**
 * Props
 */
interface Props {
  items: any[]
  itemHeight: number
  containerHeight: number
  overscan?: number // Number of items to render outside visible area
  keyField?: string // Field to use as key, defaults to index
  activeThreshold?: number // Threshold for marking items as active (for animations)
}

const props = withDefaults(defineProps<Props>(), {
  overscan: 5,
  keyField: '',
  activeThreshold: 100
})

/**
 * Emits
 */
interface Emits {
  (e: 'scroll', payload: { scrollTop: number; direction: 'up' | 'down' }): void
  (e: 'visible-range-change', payload: { start: number; end: number }): void
}

const emit = defineEmits<Emits>()

/**
 * Performance tracking
 */
const { startRender, endRender } = useComponentPerformance('VirtualList')

/**
 * State
 */
const scrollTop = ref(0)
const lastScrollTop = ref(0)
const scrollDirection = ref<'up' | 'down'>('down')

/**
 * Computed properties
 */
const visibleItemCount = computed(() => Math.ceil(props.containerHeight / props.itemHeight))

const totalHeight = computed(() => props.items.length * props.itemHeight)

const startIndex = computed(() => {
  const start = Math.floor(scrollTop.value / props.itemHeight)
  return Math.max(0, start - props.overscan)
})

const endIndex = computed(() => {
  const end = startIndex.value + visibleItemCount.value + props.overscan * 2
  return Math.min(props.items.length - 1, end)
})

const visibleItems = computed(() => {
  startRender()
  const result = props.items.slice(startIndex.value, endIndex.value + 1)
  nextTick(endRender)
  return result
})

const offsetBefore = computed(() => startIndex.value * props.itemHeight)

const offsetAfter = computed(() => (props.items.length - endIndex.value - 1) * props.itemHeight)

// Active items (for animations and interactions)
const activeStart = computed(() => {
  const center = scrollTop.value + props.containerHeight / 2
  const centerIndex = Math.floor(center / props.itemHeight)
  return Math.max(0, centerIndex - Math.floor(props.activeThreshold / props.itemHeight))
})

const activeEnd = computed(() => {
  const center = scrollTop.value + props.containerHeight / 2
  const centerIndex = Math.floor(center / props.itemHeight)
  return Math.min(
    props.items.length - 1,
    centerIndex + Math.floor(props.activeThreshold / props.itemHeight)
  )
})

/**
 * Methods
 */
function getItemKey(item: any, index: number): string {
  if (props.keyField && item[props.keyField] != null) {
    return String(item[props.keyField])
  }
  return String(index)
}

function handleScroll(event: any) {
  const newScrollTop = event.detail.scrollTop

  // Determine scroll direction
  if (newScrollTop > lastScrollTop.value) {
    scrollDirection.value = 'down'
  } else if (newScrollTop < lastScrollTop.value) {
    scrollDirection.value = 'up'
  }

  lastScrollTop.value = scrollTop.value
  scrollTop.value = newScrollTop

  // Emit scroll event
  emit('scroll', {
    scrollTop: newScrollTop,
    direction: scrollDirection.value
  })
}

/**
 * Public methods (exposed via defineExpose)
 */
function scrollToIndex(index: number, alignment: 'start' | 'center' | 'end' = 'start') {
  let targetScrollTop: number

  switch (alignment) {
    case 'start':
      targetScrollTop = index * props.itemHeight
      break
    case 'center':
      targetScrollTop = index * props.itemHeight - props.containerHeight / 2 + props.itemHeight / 2
      break
    case 'end':
      targetScrollTop = index * props.itemHeight - props.containerHeight + props.itemHeight
      break
  }

  targetScrollTop = Math.max(
    0,
    Math.min(targetScrollTop, totalHeight.value - props.containerHeight)
  )
  scrollTop.value = targetScrollTop
}

function scrollToTop() {
  scrollTop.value = 0
}

function scrollToBottom() {
  scrollTop.value = totalHeight.value - props.containerHeight
}

function getVisibleRange() {
  return {
    start: startIndex.value,
    end: endIndex.value,
    count: endIndex.value - startIndex.value + 1
  }
}

/**
 * Watch for visible range changes
 */
watch([startIndex, endIndex], ([newStart, newEnd], [oldStart, oldEnd]) => {
  if (newStart !== oldStart || newEnd !== oldEnd) {
    emit('visible-range-change', {
      start: newStart,
      end: newEnd
    })
  }
})

/**
 * Expose public methods
 */
defineExpose({
  scrollToIndex,
  scrollToTop,
  scrollToBottom,
  getVisibleRange
})

/**
 * Lifecycle
 */
onMounted(() => {
  console.log(
    `🔧 VirtualList initialized: ${props.items.length} items, ${visibleItemCount.value} visible`
  )
})
</script>

<style lang="scss" scoped>
.virtual-list {
  width: 100%;
  overflow-x: hidden;
  position: relative;
}

.virtual-spacer {
  width: 100%;
  flex-shrink: 0;
}

.virtual-item {
  width: 100%;
  flex-shrink: 0;
  overflow: hidden;
}

.default-item {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  border-bottom: 1rpx solid #e0e0e0;
  font-size: 28rpx;
  color: #333;
}

/* Performance optimizations */
.virtual-list {
  /* Enable hardware acceleration */
  transform: translateZ(0);
  backface-visibility: hidden;
  perspective: 1000px;

  /* Optimize scroll performance */
  -webkit-overflow-scrolling: touch;
  scroll-behavior: smooth;
}

.virtual-item {
  /* Optimize rendering */
  will-change: transform;
  contain: layout;
}

/* Fade in animation for active items */
.virtual-item {
  transition: opacity 0.2s ease;
  opacity: 0.7;
}

.virtual-item:nth-child(even) {
  opacity: 1;
}
</style>
