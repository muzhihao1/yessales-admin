<template>
  <view
    :class="['stat-card', `stat-card-${theme}`, { clickable: clickable }]"
    @click="handleClick"
  >
    <!-- 背景装饰 -->
    <view class="card-bg-decoration"></view>
    
    <!-- 卡片内容 -->
    <view class="card-content">
      <!-- 图标区域 -->
      <view class="icon-wrapper" :style="{ backgroundColor: iconBgColor }">
        <text class="icon" :style="{ color: iconColor }">{{ icon }}</text>
      </view>
      
      <!-- 数据区域 -->
      <view class="data-wrapper">
        <view class="value-section">
          <text class="value">{{ formattedValue }}</text>
          <text v-if="unit" class="unit">{{ unit }}</text>
        </view>
        <text class="label">{{ label }}</text>
      </view>
      
      <!-- 趋势区域 -->
      <view v-if="showTrend && trend !== undefined" class="trend-wrapper">
        <view :class="['trend-indicator', trendDirection]">
          <text class="trend-arrow">{{ trendArrow }}</text>
          <text class="trend-value">{{ Math.abs(trend) }}%</text>
        </view>
        <text v-if="trendLabel" class="trend-label">{{ trendLabel }}</text>
      </view>
    </view>
    
    <!-- 加载状态 -->
    <view v-if="loading" class="card-loading">
      <view class="loading-overlay"></view>
      <view class="loading-spinner"></view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'

export type StatCardTheme = 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'default'

interface Props {
  // 基础属性
  label: string                    // 统计项标签
  value: number | string          // 统计值
  icon?: string                   // 图标
  unit?: string                   // 单位
  
  // 主题和样式
  theme?: StatCardTheme           // 主题色
  iconColor?: string              // 图标颜色（覆盖主题色）
  iconBgColor?: string            // 图标背景色（覆盖主题色）
  
  // 趋势相关
  trend?: number                  // 趋势百分比（正数上升，负数下降）
  trendLabel?: string             // 趋势说明文字
  showTrend?: boolean             // 是否显示趋势
  
  // 行为相关
  clickable?: boolean             // 是否可点击
  loading?: boolean               // 加载状态
  
  // 格式化
  prefix?: string                 // 值前缀（如 ¥、$）
  suffix?: string                 // 值后缀
  decimal?: number                // 小数位数
  thousandSeparator?: boolean     // 是否显示千分位
}

const props = withDefaults(defineProps<Props>(), {
  icon: '📊',
  theme: 'default',
  showTrend: true,
  clickable: false,
  loading: false,
  decimal: 0,
  thousandSeparator: true,
})

const emit = defineEmits<{
  click: []
}>()

// 主题配置
const themeConfig: Record<StatCardTheme, { color: string; bgColor: string }> = {
  primary: { color: '#2563eb', bgColor: '#eff6ff' },
  success: { color: '#22c55e', bgColor: '#f0fdf4' },
  warning: { color: '#f59e0b', bgColor: '#fffbeb' },
  danger: { color: '#ef4444', bgColor: '#fef2f2' },
  info: { color: '#6366f1', bgColor: '#eef2ff' },
  default: { color: '#6b7280', bgColor: '#f3f4f6' },
}

// 格式化数值
const formattedValue = computed(() => {
  if (typeof props.value === 'string') {
    return props.value
  }
  
  let num = props.value
  
  // 处理小数位
  if (props.decimal > 0) {
    num = Number(num.toFixed(props.decimal))
  }
  
  // 千分位分隔
  let str = num.toString()
  if (props.thousandSeparator) {
    const parts = str.split('.')
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    str = parts.join('.')
  }
  
  // 添加前缀和后缀
  if (props.prefix) str = props.prefix + str
  if (props.suffix) str = str + props.suffix
  
  return str
})

// 趋势方向
const trendDirection = computed(() => {
  if (props.trend === undefined || props.trend === 0) return 'neutral'
  return props.trend > 0 ? 'up' : 'down'
})

// 趋势箭头
const trendArrow = computed(() => {
  if (trendDirection.value === 'up') return '↑'
  if (trendDirection.value === 'down') return '↓'
  return '→'
})

// 图标颜色（优先使用自定义颜色）
const iconColor = computed(() => {
  return props.iconColor || themeConfig[props.theme].color
})

// 图标背景色（优先使用自定义背景色）
const iconBgColor = computed(() => {
  return props.iconBgColor || themeConfig[props.theme].bgColor
})

// 处理点击事件
const handleClick = () => {
  if (props.clickable && !props.loading) {
    emit('click')
  }
}
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.stat-card {
  position: relative;
  background-color: $bg-color-white;
  border-radius: $border-radius-lg;
  box-shadow: $box-shadow-base;
  padding: $spacing-lg;
  transition: $transition-base;
  overflow: hidden;
  
  &.clickable {
    cursor: pointer;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: $box-shadow-light;
    }
    
    &:active {
      transform: translateY(0);
    }
  }
  
  // 主题变体
  @each $theme, $config in (
    primary: $primary-color,
    success: $success-color,
    warning: $warning-color,
    danger: $danger-color,
    info: $info-color,
  ) {
    &.stat-card-#{$theme} {
      .card-bg-decoration {
        background: linear-gradient(
          135deg,
          transparentize($config, 0.95) 0%,
          transparentize($config, 0.98) 100%
        );
      }
    }
  }
}

.card-bg-decoration {
  position: absolute;
  top: 0;
  right: 0;
  width: 150px;
  height: 150px;
  border-radius: 50%;
  transform: translate(30px, -30px);
  background: linear-gradient(
    135deg,
    rgba(0, 0, 0, 0.02) 0%,
    rgba(0, 0, 0, 0.01) 100%
  );
}

.card-content {
  position: relative;
  z-index: 1;
}

.icon-wrapper {
  width: 64px;
  height: 64px;
  border-radius: $border-radius-lg;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: $spacing-base;
  
  .icon {
    font-size: 28px;
  }
}

.data-wrapper {
  margin-bottom: $spacing-sm;
  
  .value-section {
    display: flex;
    align-items: baseline;
    margin-bottom: $spacing-xs;
    
    .value {
      font-size: 32px;
      font-weight: $font-weight-bold;
      color: $text-color;
      line-height: 1.2;
    }
    
    .unit {
      font-size: $font-size-large;
      color: $text-color-secondary;
      margin-left: 4px;
    }
  }
  
  .label {
    font-size: $font-size-base;
    color: $text-color-secondary;
  }
}

.trend-wrapper {
  display: flex;
  flex-direction: column;
  gap: 4px;
  
  .trend-indicator {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: $font-size-small;
    font-weight: $font-weight-medium;
    
    &.up {
      color: $success-color;
    }
    
    &.down {
      color: $danger-color;
    }
    
    &.neutral {
      color: $text-color-regular;
    }
    
    .trend-arrow {
      font-size: $font-size-base;
    }
  }
  
  .trend-label {
    font-size: $font-size-extra-small;
    color: $text-color-placeholder;
  }
}

.card-loading {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  
  .loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(255, 255, 255, 0.8);
  }
  
  .loading-spinner {
    @include loading;
    position: relative;
    z-index: 1;
  }
}

/* 响应式设计 */
@include respond-to('phone') {
  .stat-card {
    padding: $spacing-base;
  }
  
  .icon-wrapper {
    width: 48px;
    height: 48px;
    
    .icon {
      font-size: 24px;
    }
  }
  
  .data-wrapper {
    .value-section {
      .value {
        font-size: 24px;
      }
      
      .unit {
        font-size: $font-size-base;
      }
    }
  }
}
</style>