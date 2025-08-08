<template>
  <view class="chart-widget">
    <!-- Header -->
    <view class="chart-header">
      <view class="chart-title-section">
        <text class="chart-title">{{ title }}</text>
        <text v-if="subtitle" class="chart-subtitle">{{ subtitle }}</text>
      </view>
      <view class="chart-actions">
        <button
          v-if="showRefresh"
          class="action-btn refresh-btn"
          @click="handleRefresh"
          :loading="refreshing"
        >
          <text class="action-icon">🔄</text>
        </button>
        <button v-if="showExport" class="action-btn export-btn" @click="handleExport">
          <text class="action-icon">📊</text>
        </button>
        <picker
          v-if="timeRanges.length > 0"
          mode="selector"
          :range="timeRanges"
          :range-key="'label'"
          :value="selectedTimeRangeIndex"
          @change="handleTimeRangeChange"
        >
          <view class="time-range-picker">
            <text>{{ timeRanges[selectedTimeRangeIndex]?.label || '选择时间' }}</text>
            <text class="picker-arrow">▼</text>
          </view>
        </picker>
      </view>
    </view>

    <!-- Loading State -->
    <view v-if="loading" class="chart-loading">
      <text class="loading-text">加载中...</text>
      <view class="loading-skeleton"></view>
    </view>

    <!-- Error State -->
    <view v-else-if="error" class="chart-error">
      <text class="error-text">{{ error }}</text>
      <button class="retry-btn" @click="handleRefresh">重试</button>
    </view>

    <!-- Chart Content -->
    <view v-else class="chart-content">
      <!-- Line Chart -->
      <view v-if="type === 'line'" class="line-chart">
        <view class="chart-canvas" ref="chartCanvas">
          <canvas
            v-if="canvasId"
            :canvas-id="canvasId"
            class="chart-canvas-element"
            @touchstart="handleTouchStart"
            @touchmove="handleTouchMove"
            @touchend="handleTouchEnd"
          />
          <view v-else class="chart-placeholder">
            <svg viewBox="0 0 400 200" class="placeholder-svg">
              <!-- Grid lines -->
              <defs>
                <pattern id="grid" width="40" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 20" fill="none" stroke="#e0e0e0" stroke-width="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />

              <!-- Sample line -->
              <path
                :d="sampleLinePath"
                fill="none"
                :stroke="primaryColor"
                stroke-width="2"
                stroke-linecap="round"
              />

              <!-- Data points -->
              <circle
                v-for="(point, index) in samplePoints"
                :key="index"
                :cx="point.x"
                :cy="point.y"
                r="3"
                :fill="primaryColor"
              />
            </svg>
          </view>
        </view>

        <!-- Legend -->
        <view v-if="legend.length > 0" class="chart-legend">
          <view v-for="item in legend" :key="item.key" class="legend-item">
            <view class="legend-color" :style="{ backgroundColor: item.color }" />
            <text class="legend-label">{{ item.label }}</text>
          </view>
        </view>
      </view>

      <!-- Bar Chart -->
      <view v-else-if="type === 'bar'" class="bar-chart">
        <view class="chart-canvas">
          <svg viewBox="0 0 400 200" class="chart-svg">
            <!-- Y-axis -->
            <line x1="40" y1="20" x2="40" y2="180" stroke="#e0e0e0" stroke-width="1" />
            <!-- X-axis -->
            <line x1="40" y1="180" x2="380" y2="180" stroke="#e0e0e0" stroke-width="1" />

            <!-- Bars -->
            <rect
              v-for="(bar, index) in barData"
              :key="index"
              :x="bar.x"
              :y="bar.y"
              :width="bar.width"
              :height="bar.height"
              :fill="bar.color || primaryColor"
              rx="2"
            />

            <!-- Labels -->
            <text
              v-for="(label, index) in barLabels"
              :key="index"
              :x="label.x"
              :y="label.y"
              text-anchor="middle"
              fill="#666"
              font-size="12"
            >
              {{ label.text }}
            </text>
          </svg>
        </view>
      </view>

      <!-- Pie Chart -->
      <view v-else-if="type === 'pie'" class="pie-chart">
        <view class="pie-container">
          <svg viewBox="0 0 200 200" class="pie-svg">
            <path
              v-for="(segment, index) in pieSegments"
              :key="index"
              :d="segment.path"
              :fill="segment.color"
              :stroke="'white'"
              stroke-width="2"
            />
            <!-- Center hole for donut chart -->
            <circle v-if="donut" cx="100" cy="100" :r="donutInnerRadius" fill="white" />
          </svg>

          <!-- Center value for donut -->
          <view v-if="donut && centerValue" class="donut-center">
            <text class="center-value">{{ centerValue.value }}</text>
            <text class="center-label">{{ centerValue.label }}</text>
          </view>
        </view>

        <!-- Pie Legend -->
        <view class="pie-legend">
          <view v-for="item in pieData" :key="item.name" class="pie-legend-item">
            <view class="legend-color" :style="{ backgroundColor: item.color }" />
            <text class="legend-label">{{ item.name }}</text>
            <text class="legend-value">{{ item.value }}</text>
            <text class="legend-percentage">{{ getPercentage(item.value) }}%</text>
          </view>
        </view>
      </view>

      <!-- Number Display -->
      <view v-else-if="type === 'number'" class="number-display">
        <text
          class="number-value"
          :class="{ 'trend-up': trend === 'up', 'trend-down': trend === 'down' }"
        >
          {{ formatNumber(numberValue) }}
        </text>
        <view v-if="trend" class="trend-indicator">
          <text class="trend-icon">{{ trend === 'up' ? '↗' : '↘' }}</text>
          <text class="trend-text">{{ trendText }}</text>
        </view>
      </view>

      <!-- Progress Chart -->
      <view v-else-if="type === 'progress'" class="progress-chart">
        <view class="progress-item" v-for="item in progressData" :key="item.name">
          <view class="progress-header">
            <text class="progress-name">{{ item.name }}</text>
            <text class="progress-value">{{ item.value }}/{{ item.total }}</text>
          </view>
          <view class="progress-bar">
            <view
              class="progress-fill"
              :style="{
                width: `${(item.value / item.total) * 100}%`,
                backgroundColor: item.color || primaryColor
              }"
            />
          </view>
          <text class="progress-percentage"
            >{{ Math.round((item.value / item.total) * 100) }}%</text
          >
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'

export interface ChartLegendItem {
  key: string
  label: string
  color: string
}

export interface TimeRange {
  value: string
  label: string
}

export interface PieDataItem {
  name: string
  value: number
  color: string
}

export interface ProgressDataItem {
  name: string
  value: number
  total: number
  color?: string
}

export interface BarDataPoint {
  x: number
  y: number
  width: number
  height: number
  color?: string
}

export interface CenterValue {
  value: string
  label: string
}

interface Props {
  title: string
  subtitle?: string
  type: 'line' | 'bar' | 'pie' | 'number' | 'progress'
  data?: any[]
  loading?: boolean
  error?: string
  showRefresh?: boolean
  showExport?: boolean
  timeRanges?: TimeRange[]
  selectedTimeRange?: string
  legend?: ChartLegendItem[]
  primaryColor?: string
  height?: string
  // Number chart props
  numberValue?: number
  trend?: 'up' | 'down'
  trendText?: string
  // Pie chart props
  pieData?: PieDataItem[]
  donut?: boolean
  centerValue?: CenterValue
  // Progress chart props
  progressData?: ProgressDataItem[]
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  error: '',
  showRefresh: true,
  showExport: false,
  timeRanges: () => [],
  selectedTimeRange: '',
  legend: () => [],
  primaryColor: '#007AFF',
  height: '300px',
  numberValue: 0,
  pieData: () => [],
  donut: false,
  progressData: () => []
})

const emit = defineEmits<{
  refresh: []
  export: []
  'time-range-change': [value: string]
}>()

// State
const refreshing = ref(false)
const canvasId = ref('')
const selectedTimeRangeIndex = ref(0)
const chartCanvas = ref<any>(null)

// Constants
const donutInnerRadius = 40

// Computed
const sampleLinePath = computed(() => {
  // Sample line chart path for placeholder
  return 'M50,150 Q100,80 150,120 T250,90 T350,110'
})

const samplePoints = computed(() => [
  { x: 50, y: 150 },
  { x: 150, y: 120 },
  { x: 250, y: 90 },
  { x: 350, y: 110 }
])

const barData = computed<BarDataPoint[]>(() => {
  if (!props.data || props.data.length === 0) {
    // Sample data for placeholder
    return [
      { x: 60, y: 100, width: 30, height: 80, color: props.primaryColor },
      { x: 120, y: 80, width: 30, height: 100, color: props.primaryColor },
      { x: 180, y: 120, width: 30, height: 60, color: props.primaryColor },
      { x: 240, y: 90, width: 30, height: 90, color: props.primaryColor }
    ]
  }

  const maxValue = Math.max(...props.data.map(d => d.value))
  const chartWidth = 340 // 380 - 40 (left margin)
  const chartHeight = 160 // 180 - 20 (top margin)
  const barWidth = (chartWidth / props.data.length) * 0.6
  const spacing = chartWidth / props.data.length

  return props.data.map((item, index) => {
    const height = (item.value / maxValue) * chartHeight
    return {
      x: 40 + index * spacing + spacing * 0.2,
      y: 180 - height,
      width: barWidth,
      height,
      color: item.color || props.primaryColor
    }
  })
})

const barLabels = computed(() => {
  if (!props.data || props.data.length === 0) {
    return [
      { x: 75, y: 195, text: '一月' },
      { x: 135, y: 195, text: '二月' },
      { x: 195, y: 195, text: '三月' },
      { x: 255, y: 195, text: '四月' }
    ]
  }

  const chartWidth = 340
  const spacing = chartWidth / props.data.length

  return props.data.map((item, index) => ({
    x: 40 + index * spacing + spacing * 0.5,
    y: 195,
    text: item.name
  }))
})

const pieSegments = computed(() => {
  if (!props.pieData || props.pieData.length === 0) return []

  const total = props.pieData.reduce((sum, item) => sum + item.value, 0)
  const centerX = 100
  const centerY = 100
  const radius = 80

  let currentAngle = -90 // Start from top

  return props.pieData.map(item => {
    const angle = (item.value / total) * 360
    const startAngle = currentAngle
    const endAngle = currentAngle + angle

    const startAngleRad = (startAngle * Math.PI) / 180
    const endAngleRad = (endAngle * Math.PI) / 180

    const x1 = centerX + radius * Math.cos(startAngleRad)
    const y1 = centerY + radius * Math.sin(startAngleRad)
    const x2 = centerX + radius * Math.cos(endAngleRad)
    const y2 = centerY + radius * Math.sin(endAngleRad)

    const largeArcFlag = angle > 180 ? 1 : 0

    const pathData = [
      `M ${centerX} ${centerY}`,
      `L ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      'Z'
    ].join(' ')

    currentAngle += angle

    return {
      path: pathData,
      color: item.color
    }
  })
})

// Methods
function handleRefresh() {
  if (refreshing.value) return
  refreshing.value = true
  emit('refresh')
  setTimeout(() => {
    refreshing.value = false
  }, 1000)
}

function handleExport() {
  emit('export')
}

function handleTimeRangeChange(e: any) {
  selectedTimeRangeIndex.value = e.detail.value
  const selectedRange = props.timeRanges[e.detail.value]
  if (selectedRange) {
    emit('time-range-change', selectedRange.value)
  }
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

function getPercentage(value: number): string {
  if (!props.pieData || props.pieData.length === 0) return '0'
  const total = props.pieData.reduce((sum, item) => sum + item.value, 0)
  return Math.round((value / total) * 100).toString()
}

// Touch events for chart interaction
function handleTouchStart(e: any) {
  // Handle touch start for chart interactions
}

function handleTouchMove(e: any) {
  // Handle touch move for chart interactions
}

function handleTouchEnd(e: any) {
  // Handle touch end for chart interactions
}

// Watch for time range changes
watch(
  () => props.selectedTimeRange,
  newVal => {
    const index = props.timeRanges.findIndex(range => range.value === newVal)
    if (index !== -1) {
      selectedTimeRangeIndex.value = index
    }
  }
)

// Initialize canvas ID for native charts
onMounted(() => {
  if (props.type === 'line') {
    canvasId.value = `chart-${Math.random().toString(36).substr(2, 9)}`
  }
})
</script>

<style lang="scss">
@import '@/styles/variables.scss';

.chart-widget {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: hidden;

  .chart-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 20px;
    border-bottom: 1px solid $border-color;

    .chart-title-section {
      .chart-title {
        font-size: 18px;
        font-weight: 600;
        color: $text-primary;
        display: block;
        margin-bottom: 4px;
      }

      .chart-subtitle {
        font-size: 14px;
        color: $text-secondary;
        display: block;
      }
    }

    .chart-actions {
      display: flex;
      align-items: center;
      gap: 12px;

      .action-btn {
        width: 32px;
        height: 32px;
        border: none;
        border-radius: 6px;
        background: #f5f5f5;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.3s ease;

        &:hover {
          background: #e8e8e8;
        }

        &[loading='true'] {
          opacity: 0.7;
          pointer-events: none;
        }

        .action-icon {
          font-size: 14px;
        }
      }

      .time-range-picker {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 6px 12px;
        border: 1px solid $border-color;
        border-radius: 6px;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.3s ease;

        &:hover {
          border-color: $primary-color;
        }

        .picker-arrow {
          font-size: 12px;
          color: $text-secondary;
        }
      }
    }
  }

  .chart-loading,
  .chart-error {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    gap: 16px;

    .loading-text,
    .error-text {
      font-size: 16px;
      color: $text-secondary;
    }

    .loading-skeleton {
      width: 80%;
      height: 120px;
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: loading 1.5s infinite;
      border-radius: 4px;
    }

    .retry-btn {
      padding: 8px 16px;
      background: $primary-color;
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      cursor: pointer;
    }
  }

  .chart-content {
    .line-chart {
      .chart-canvas {
        height: v-bind(height);
        position: relative;

        .chart-canvas-element {
          width: 100%;
          height: 100%;
        }

        .chart-placeholder {
          width: 100%;
          height: 100%;
          padding: 20px;

          .placeholder-svg {
            width: 100%;
            height: 100%;
          }
        }
      }

      .chart-legend {
        display: flex;
        justify-content: center;
        gap: 24px;
        padding: 16px 20px;
        flex-wrap: wrap;

        .legend-item {
          display: flex;
          align-items: center;
          gap: 8px;

          .legend-color {
            width: 12px;
            height: 12px;
            border-radius: 2px;
          }

          .legend-label {
            font-size: 14px;
            color: $text-primary;
          }
        }
      }
    }

    .bar-chart {
      .chart-canvas {
        height: v-bind(height);
        padding: 20px;

        .chart-svg {
          width: 100%;
          height: 100%;
        }
      }
    }

    .pie-chart {
      padding: 20px;
      display: flex;
      gap: 24px;
      align-items: center;

      .pie-container {
        flex-shrink: 0;
        position: relative;
        width: 200px;
        height: 200px;

        .pie-svg {
          width: 100%;
          height: 100%;
        }

        .donut-center {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;

          .center-value {
            display: block;
            font-size: 24px;
            font-weight: 600;
            color: $text-primary;
            margin-bottom: 4px;
          }

          .center-label {
            font-size: 14px;
            color: $text-secondary;
          }
        }
      }

      .pie-legend {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 12px;

        .pie-legend-item {
          display: flex;
          align-items: center;
          gap: 12px;

          .legend-color {
            width: 16px;
            height: 16px;
            border-radius: 2px;
            flex-shrink: 0;
          }

          .legend-label {
            flex: 1;
            font-size: 14px;
            color: $text-primary;
          }

          .legend-value {
            font-size: 14px;
            font-weight: 500;
            color: $text-primary;
            margin-right: 8px;
          }

          .legend-percentage {
            font-size: 12px;
            color: $text-secondary;
            min-width: 40px;
            text-align: right;
          }
        }
      }
    }

    .number-display {
      padding: 40px 20px;
      text-align: center;

      .number-value {
        font-size: 48px;
        font-weight: 700;
        color: $text-primary;
        display: block;
        margin-bottom: 12px;

        &.trend-up {
          color: $success-color;
        }

        &.trend-down {
          color: $danger-color;
        }
      }

      .trend-indicator {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;

        .trend-icon {
          font-size: 20px;
          color: inherit;
        }

        .trend-text {
          font-size: 14px;
          color: $text-secondary;
        }
      }
    }

    .progress-chart {
      padding: 20px;

      .progress-item {
        margin-bottom: 20px;

        &:last-child {
          margin-bottom: 0;
        }

        .progress-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;

          .progress-name {
            font-size: 14px;
            font-weight: 500;
            color: $text-primary;
          }

          .progress-value {
            font-size: 14px;
            color: $text-secondary;
          }
        }

        .progress-bar {
          height: 8px;
          background: #f0f0f0;
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 4px;

          .progress-fill {
            height: 100%;
            transition: width 0.3s ease;
            border-radius: 4px;
          }
        }

        .progress-percentage {
          font-size: 12px;
          color: $text-secondary;
          text-align: right;
          display: block;
        }
      }
    }
  }
}

@keyframes loading {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

// Responsive design
@media (max-width: 768px) {
  .chart-widget {
    .chart-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 16px;

      .chart-actions {
        width: 100%;
        justify-content: flex-end;
      }
    }

    .chart-content {
      .pie-chart {
        flex-direction: column;
        gap: 20px;

        .pie-container {
          width: 160px;
          height: 160px;
        }

        .pie-legend {
          width: 100%;
        }
      }

      .number-display {
        .number-value {
          font-size: 36px;
        }
      }
    }
  }
}
</style>
