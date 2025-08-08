<template>
  <view class="sales-container">
    <SalesHeader
      title="耶氏台球报价系统"
      :show-back="false"
      :fixed="true"
    />
    
    <Transition name="fade-up" appear>
      <view class="sales-page">
        <!-- Logo 和品牌展示 -->
        <Transition name="scale" appear>
          <view class="sales-hero">
            <image
              class="sales-logo animate-scale-in"
              src="/static/logo.png"
              mode="aspectFit"
              @error="handleLogoError"
            />
            <text class="sales-title stagger-item">耶氏台球斗南销售中心</text>
            <text class="sales-subtitle stagger-item">专业台球设备报价系统</text>
            <Transition name="fade-up">
              <view v-if="!statsLoading" class="sales-stats">
                <view class="stat-item stagger-item">
                  <text class="stat-number">{{ totalQuotes }}</text>
                  <text class="stat-label">累计报价</text>
                </view>
                <view class="stat-divider"></view>
                <view class="stat-item stagger-item">
                  <text class="stat-number">{{ todayQuotes }}</text>
                  <text class="stat-label">今日新增</text>
                </view>
              </view>
            </Transition>
            
            <!-- 统计数据加载骨架 -->
            <view v-if="statsLoading" class="stats-skeleton">
              <LoadingSkeleton 
                variant="stats" 
                :item-count="2" 
                :show-actions="false" 
                custom-class="stats-skeleton-content"
              />
            </view>
          </view>
        </Transition>
      
      <!-- 快速入口 -->
      <view class="sales-section">
        <view class="sales-section-title">
          <text class="section-title-text">快速服务</text>
          <text class="section-subtitle">选择您需要的服务</text>
        </view>
        
        <Transition name="fade-up">
          <view class="sales-grid">
            <SalesButton
              class="sales-grid-item primary-item stagger-item enhanced-button"
              @click="navigateToCreate"
            >
              <view class="sales-grid-content">
                <view class="sales-grid-icon sales-grid-icon-primary">
                  <text>📝</text>
                </view>
                <text class="sales-grid-text">新建报价</text>
                <text class="sales-grid-desc">快速创建新的报价单</text>
              </view>
            </SalesButton>
            
            <SalesButton
              class="sales-grid-item stagger-item enhanced-button"
              @click="navigateToHistory"
            >
              <view class="sales-grid-content">
                <view class="sales-grid-icon sales-grid-icon-success">
                  <text>📋</text>
                </view>
                <text class="sales-grid-text">我的报价</text>
                <text class="sales-grid-desc">查看历史报价记录</text>
              </view>
            </SalesButton>
            
            <SalesButton
              class="sales-grid-item stagger-item enhanced-button"
              @click="navigateToProducts"
            >
              <view class="sales-grid-content">
                <view class="sales-grid-icon sales-grid-icon-info">
                  <text>🛍️</text>
                </view>
                <text class="sales-grid-text">产品浏览</text>
                <text class="sales-grid-desc">浏览全部产品目录</text>
              </view>
            </SalesButton>
            
            <SalesButton
              class="sales-grid-item stagger-item enhanced-button"
              @click="showContactInfo"
            >
              <view class="sales-grid-content">
                <view class="sales-grid-icon sales-grid-icon-warning">
                  <text>📞</text>
                </view>
                <text class="sales-grid-text">联系我们</text>
                <text class="sales-grid-desc">获取更多帮助</text>
              </view>
            </SalesButton>
          </view>
        </Transition>
      </view>
      
      <!-- 产品推荐轮播 -->
      <view class="sales-section">
        <view class="sales-section-title">
          <text class="section-title-text">热门产品</text>
          <text class="section-subtitle">精选推荐商品</text>
        </view>
        
        <!-- Loading state with skeleton -->
        <template v-if="productsLoading">
          <Transition name="fade">
            <view class="products-loading">
              <LoadingSkeleton 
                variant="product" 
                :item-count="6" 
                custom-class="product-skeleton"
              />
            </view>
          </Transition>
        </template>
        
        <!-- Error state -->
        <template v-else-if="productsError">
          <view class="products-error">
            <text class="error-text">{{ productsError }}</text>
            <SalesButton size="small" @click="loadProducts">重试</SalesButton>
          </view>
        </template>
        
        <!-- Product carousel with animations -->
        <template v-else-if="hotProducts.length > 0">
          <Transition name="fade-up">
          <view class="product-carousel">
            <scroll-view
              scroll-x
              class="carousel-scroll"
              :show-scrollbar="false"
              :scroll-with-animation="true"
            >
              <view class="carousel-list">
                <Transition
                  v-for="(product, index) in hotProducts"
                  :key="product.id"
                  name="slide-left"
                  appear
                  :style="{ 'animation-delay': `${index * 0.1}s` }"
                >
                  <view
                    class="product-card stagger-item enhanced-card"
                    @click="viewProductWithFeedback(product)"
                  >
                    <view class="product-image-wrapper">
                      <image
                        class="product-image"
                        :src="product.image_url || '/static/images/default-product.png'"
                        mode="aspectFill"
                        @error="handleProductImageError($event, product)"
                        @load="onImageLoad"
                      />
                      <Transition name="scale">
                        <view v-if="product.isHot" class="product-badge hot-badge animate-pulse">热销</view>
                      </Transition>
                      <Transition name="scale">
                        <view v-if="product.isNew" class="product-badge new-badge animate-bounce">新品</view>
                      </Transition>
                    </view>
                    <view class="product-info">
                      <text class="product-name">{{ product.name }}</text>
                      <text class="product-model">{{ product.model }}</text>
                      <view class="product-price-row">
                        <text class="product-price">¥{{ formatPrice(product.price) }}</text>
                        <text class="product-unit">/{{ product.unit }}</text>
                      </view>
                    </view>
                  </view>
                </Transition>
              </view>
            </scroll-view>
          
            <!-- View all products button -->
            <SalesButton 
              class="view-all-btn enhanced-button"
              type="plain"
              @click="navigateToProducts"
            >
              查看全部产品 →
            </SalesButton>
          </view>
          </Transition>
        </template>
        
        <!-- Empty state -->
        <template v-else>
          <view class="products-empty">
          <image 
            class="empty-icon" 
            src="/static/images/empty-product.png" 
            mode="aspectFit"
          />
          <text class="empty-text">暂无推荐产品</text>
          </view>
        </template>
      </view>
    </Transition>

    <!-- Footer -->
    <SalesFooter 
      company-name="耶氏台球斗南销售中心"
      slogan="专业台球设备供应商"
      :show-contact="true"
      phone="400-888-8888"
      :show-bottom-bar="true"
      :bottom-bar-items="bottomBarItems"
      :active-index="0"
      @bar-item-click="handleBottomBarClick"
    />
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ApiService } from '@/api'
import SalesHeader from '@/components/sales/SalesHeader.vue'
import SalesButton from '@/components/sales/SalesButton.vue'
import SalesFooter from '@/components/layout/SalesFooter.vue'
import LoadingSkeleton from '@/components/common/LoadingSkeleton.vue'
import type { Product } from '@/types/models'

// 页面状态
const productsLoading = ref(false)
const productsError = ref('')
const statsLoading = ref(false)
const imagesLoaded = ref(0)

// 热门产品
const hotProducts = ref<Product[]>([])

// 统计数据
const totalQuotes = ref(0)
const todayQuotes = ref(0)

// 底部导航配置
const bottomBarItems = ref([
  {
    text: '首页',
    icon: '/static/icons/home.png',
    activeIcon: '/static/icons/home-active.png',
    page: '/pages/sales/index'
  },
  {
    text: '新建报价',
    icon: '/static/icons/create.png', 
    activeIcon: '/static/icons/create-active.png',
    page: '/pages/sales/quote/create'
  },
  {
    text: '我的报价',
    icon: '/static/icons/quotes.png',
    activeIcon: '/static/icons/quotes-active.png', 
    page: '/pages/sales/history/index'
  },
  {
    text: '设置',
    icon: '/static/icons/settings.png',
    activeIcon: '/static/icons/settings-active.png',
    page: '/pages/sales/settings/index'
  }
])

onMounted(() => {
  loadProducts()
  loadStats()
})

// 加载产品数据
const loadProducts = async () => {
  try {
    productsLoading.value = true
    productsError.value = ''
    
    // 调用真实API获取产品数据
    const response = await ApiService.getProducts({ limit: 6 })
    
    if (response.success && response.data) {
      // 获取前6个产品作为热门产品，并添加标签
      const products = response.data.map((product, index) => ({
        ...product,
        isHot: index < 2, // 前2个标记为热销
        isNew: index >= 4 // 后2个标记为新品
      }))
      
      hotProducts.value = products
    } else {
      throw new Error(response.error?.message || '获取产品数据失败')
    }
  } catch (error) {
    console.error('Failed to load products:', error)
    productsError.value = error.message || '加载产品失败，请重试'
  } finally {
    productsLoading.value = false
  }
}

// ========== 增强交互方法 ==========

// 带触觉反馈的产品查看
const viewProductWithFeedback = (product: Product) => {
  // 添加触觉反馈（仅在支持的设备上）
  try {
    uni.vibrateShort({
      type: 'light'
    })
  } catch (error) {
    // 忽略不支持触觉反馈的设备
  }
  
  // 调用原有方法
  viewProduct(product)
}

// 图片加载完成处理
const onImageLoad = () => {
  imagesLoaded.value++
}

// 添加成功提示动画
const showSuccessToast = (message: string) => {
  uni.showToast({
    title: message,
    icon: 'success',
    duration: 2000
  })
  
  // 添加轻微震动反馈
  try {
    uni.vibrateShort({
      type: 'light'
    })
  } catch (error) {
    // 忽略不支持的设备
  }
}

// 加载统计数据（增强版）
const loadStats = async () => {
  statsLoading.value = true
  
  try {
    // 调用真实API获取统计数据
    const response = await ApiService.getSalesStats()
    
    if (response.success && response.data) {
      totalQuotes.value = response.data.totalQuotes
      
      // 获取今日报价单数据
      const today = new Date().toISOString().split('T')[0]
      const todayResponse = await ApiService.getQuotes({
        startDate: today,
        endDate: today
      })
      
      if (todayResponse.success && todayResponse.data) {
        todayQuotes.value = todayResponse.data.length
      } else {
        todayQuotes.value = 0
      }
      
      // 短暂延迟以显示加载动画
      await new Promise(resolve => setTimeout(resolve, 300))
      
    } else {
      console.warn('获取统计数据失败，使用默认值')
      totalQuotes.value = 0
      todayQuotes.value = 0
    }
  } catch (error) {
    console.error('Failed to load stats:', error)
    // 使用默认值，不影响页面正常显示
    totalQuotes.value = 0
    todayQuotes.value = 0
  } finally {
    statsLoading.value = false
  }
}

// 格式化价格
const formatPrice = (price: number) => {
  return price.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

// 导航到新建报价
const navigateToCreate = () => {
  uni.navigateTo({
    url: '/pages/sales/quote/create'
  })
}

// 导航到历史报价
const navigateToHistory = () => {
  uni.navigateTo({
    url: '/pages/sales/history/index'
  })
}

// 导航到产品浏览
const navigateToProducts = () => {
  uni.navigateTo({
    url: '/pages/sales/products/index',
    fail: () => {
      // 如果页面不存在，先提示
      uni.showToast({
        title: '产品浏览页面开发中',
        icon: 'none'
      })
    }
  })
}

// 显示联系信息
const showContactInfo = () => {
  uni.showModal({
    title: '联系我们',
    content: '电话：400-888-8888\n地址：昆明市斗南花卉市场\n微信：yessales2024\n营业时间：9:00-18:00',
    showCancel: false,
    confirmText: '我知道了'
  })
}

// 查看产品详情
const viewProduct = (product: Product) => {
  uni.showModal({
    title: product.name,
    content: `型号：${product.model}\n价格：¥${formatPrice(product.price)}/${product.unit}\n\n${product.description || '专业台球设备，品质保证'}\n\n是否立即创建报价？`,
    success: (res) => {
      if (res.confirm) {
        // 可以传递产品信息到报价页面
        uni.navigateTo({
          url: `/pages/sales/quote/create?productId=${product.id}`
        })
      }
    }
  })
}

// 处理Logo加载错误
const handleLogoError = () => {
  console.warn('Logo failed to load, using fallback')
}

// 处理产品图片加载错误
const handleProductImageError = (event: any, product: Product) => {
  event.target.src = '/static/images/default-product.png'
  console.warn(`Product image failed to load for ${product.name}`)
}

// 底部导航点击处理
const handleBottomBarClick = (item: any, index: number) => {
  if (index === 0) {
    // 当前就是首页，不需要跳转
    return
  }
  
  uni.switchTab({
    url: item.page,
    fail: () => {
      uni.navigateTo({
        url: item.page,
        fail: () => {
          uni.showToast({
            title: '页面开发中',
            icon: 'none'
          })
        }
      })
    }
  })
}
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';
@import '@/styles/animations.scss';
@import '@/styles/responsive.scss';

.sales-container {
  min-height: 100vh;
  background-color: $bg-color-page;
  padding-bottom: 120rpx; // 为底部导航留出空间
}

.sales-page {
  @include responsive-container;
  padding-top: calc(44px + var(--status-bar-height, 0) + #{$spacing-base-responsive});
  padding-bottom: $spacing-xl-responsive;
  @include safe-area-padding;
  
  // 优化移动端间距
  @include mobile-only {
    padding-left: $mobile-padding-x;
    padding-right: $mobile-padding-x;
  }
}

// 品牌展示区
.sales-hero {
  @include card;
  @include flex-center;
  flex-direction: column;
  padding: $spacing-xl-responsive;
  margin-bottom: $spacing-lg-responsive;
  background: linear-gradient(135deg, $primary-color 0%, #ff8a8a 100%);
  color: #fff;
  position: relative;
  overflow: hidden;
  
  // 移动端优化间距
  @include mobile-only {
    padding: $spacing-lg $spacing-md;
    margin-bottom: $mobile-margin-section;
  }
  
  &::before {
    content: '';
    position: absolute;
    top: -50%;
    right: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
    pointer-events: none;
  }
}

.sales-logo {
  width: clamp(60px, 15vw, 80px);
  height: clamp(60px, 15vw, 80px);
  margin-bottom: $spacing-base-responsive;
  border-radius: $border-radius-base;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  
  // 移动端稍小
  @include mobile-only {
    width: 64px;
    height: 64px;
  }
}

.sales-title {
  @include responsive-text($font-size-large, $font-size-extra-large);
  font-weight: $font-weight-bold;
  margin-bottom: $spacing-xs;
  text-align: center;
  
  @include mobile-only {
    font-size: $font-size-medium;
  }
}

.sales-subtitle {
  @include responsive-text($font-size-small, $font-size-base);
  opacity: 0.9;
  margin-bottom: $spacing-lg-responsive;
  text-align: center;
  
  @include mobile-only {
    font-size: $font-size-extra-small;
  }
}

// 统计数据
.sales-stats {
  display: flex;
  align-items: center;
  gap: $spacing-lg;
  margin-top: $spacing-base;
}

.stat-item {
  @include flex-center;
  flex-direction: column;
  gap: $spacing-xs;
}

.stat-number {
  font-size: $font-size-extra-large;
  font-weight: $font-weight-bold;
  color: #fff;
}

.stat-label {
  font-size: $font-size-small;
  opacity: 0.8;
  color: #fff;
}

.stat-divider {
  width: 1px;
  height: 40rpx;
  background-color: rgba(255,255,255,0.3);
}

// 节标题增强
.sales-section {
  margin-bottom: $spacing-xl;
  
  &:last-child {
    margin-bottom: 0;
  }
}

.sales-section-title {
  margin-bottom: $spacing-lg;
}

.section-title-text {
  display: block;
  font-size: $font-size-large;
  font-weight: $font-weight-semibold;
  color: $text-color;
  margin-bottom: $spacing-xs;
}

.section-subtitle {
  display: block;
  font-size: $font-size-small;
  color: $text-color-secondary;
}

// 快速入口网格增强
.sales-grid {
  @include responsive-grid(1, 2, 2, $spacing-base-responsive);
  
  @include mobile-only {
    gap: $spacing-sm;
  }
  
  // iPad 横屏优化
  @include media-min($breakpoint-xl) {
    grid-template-columns: repeat(3, 1fr);
    
    .primary-item {
      grid-column: 1 / -1; // 保持主按钮全宽
    }
  }
}

.sales-grid-item {
  @include touch-target($touch-target-comfortable);
  @include touch-feedback;
  background-color: transparent;
  border: none;
  padding: 0;
  transition: $transition-base;
  
  &.primary-item {
    grid-column: 1 / -1; // 主要按钮占满宽度
    
    .sales-grid-content {
      background: linear-gradient(135deg, $primary-color 0%, #ff8a8a 100%);
      color: #fff;
      
      .sales-grid-icon {
        background-color: rgba(255,255,255,0.2);
        color: #fff;
      }
      
      .sales-grid-text,
      .sales-grid-desc {
        color: #fff;
      }
    }
  }
  
  // 移动端增大触摸目标
  @include mobile-only {
    min-height: $touch-target-large;
  }
}

.sales-grid-content {
  @include card;
  @include flex-center;
  flex-direction: column;
  padding: $spacing-lg-responsive;
  width: 100%;
  height: 100%;
  min-height: $touch-target-large;
  
  // 移动端优化内边距
  @include mobile-only {
    padding: $spacing-md;
    min-height: $touch-target-comfortable;
  }
}

.sales-grid-icon {
  width: clamp(40px, 10vw, 48px);
  height: clamp(40px, 10vw, 48px);
  border-radius: $border-radius-circle;
  @include flex-center;
  margin-bottom: $spacing-sm-responsive;
  font-size: clamp(18px, 5vw, 24px);
  
  // 移动端调整
  @include mobile-only {
    width: 40px;
    height: 40px;
    font-size: 20px;
  }
  
  &-primary {
    background-color: $primary-bg;
    color: $primary-color;
  }
  
  &-success {
    background-color: $success-bg;
    color: $success-color;
  }
  
  &-info {
    background-color: $info-bg;
    color: $info-color;
  }
  
  &-warning {
    background-color: $warning-bg;
    color: $warning-color;
  }
}

.sales-grid-text {
  @include responsive-text($font-size-small, $font-size-base);
  font-weight: $font-weight-semibold;
  color: $text-color;
  margin-bottom: $spacing-xs;
  text-align: center;
  
  @include mobile-only {
    font-size: $font-size-small;
  }
}

.sales-grid-desc {
  @include responsive-text($font-size-extra-small, $font-size-small);
  color: $text-color-secondary;
  text-align: center;
  line-height: 1.4;
  @include text-ellipsis(2);
  
  @include mobile-only {
    font-size: $font-size-extra-small;
    @include text-ellipsis(1); // 移动端只显示一行
  }
}

// 产品轮播增强
.product-carousel {
  position: relative;
}

.carousel-scroll {
  margin: 0 -$spacing-base;
  padding: 0 $spacing-base;
}

.carousel-list {
  display: flex;
  gap: $spacing-base;
  padding-bottom: $spacing-sm;
}

.product-card {
  flex-shrink: 0;
  width: 160rpx;
  background-color: $bg-color-white;
  border-radius: $border-radius-base;
  overflow: hidden;
  box-shadow: $box-shadow-base;
  transition: $transition-base;
  
  &:active {
    transform: scale(0.98);
  }
}

.product-image-wrapper {
  position: relative;
  width: 160rpx;
  height: 120rpx;
}

.product-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-badge {
  position: absolute;
  top: 8rpx;
  right: 8rpx;
  padding: 4rpx 12rpx;
  border-radius: 20rpx;
  font-size: $font-size-extra-small;
  font-weight: $font-weight-semibold;
  color: #fff;
  
  &.hot-badge {
    background-color: $danger-color;
  }
  
  &.new-badge {
    background-color: $success-color;
  }
}

.product-info {
  padding: $spacing-sm;
}

.product-name {
  display: block;
  font-size: $font-size-small;
  font-weight: $font-weight-medium;
  color: $text-color;
  @include text-ellipsis;
  margin-bottom: $spacing-xs;
}

.product-model {
  display: block;
  font-size: $font-size-extra-small;
  color: $text-color-secondary;
  @include text-ellipsis;
  margin-bottom: $spacing-xs;
}

.product-price-row {
  display: flex;
  align-items: baseline;
}

.product-price {
  font-size: $font-size-base;
  font-weight: $font-weight-semibold;
  color: $danger-color;
}

.product-unit {
  font-size: $font-size-extra-small;
  color: $text-color-secondary;
  margin-left: 4rpx;
}

.view-all-btn {
  margin-top: $spacing-base;
  width: 100%;
}

// ========== 增强动画和交互效果 ==========

// 页面进入动画
.sales-page {
  animation: fade-up 0.6s $ease-out-smooth;
}

// Logo 缩放动画
.sales-logo {
  &.animate-scale-in {
    animation: scale-in 0.8s $ease-out-back;
  }
}

@keyframes scale-in {
  from {
    transform: scale(0);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

// 统计骨架样式
.stats-skeleton {
  display: flex;
  justify-content: center;
  gap: $spacing-lg;
  
  .stats-skeleton-content {
    background: transparent;
  }
}

// 增强按钮效果
.enhanced-button {
  @include button-press-feedback;
  @include ripple-effect;
  
  &:hover {
    box-shadow: 0 6px 20px rgba($primary-color, 0.3);
  }
}

// 增强卡片效果
.enhanced-card {
  @include card-hover-effect;
  transition: all $animation-duration-base $ease-out-smooth;
  
  &:active {
    transform: scale(0.98) translateY(2px);
  }
}

// 产品徽章动画
.product-badge {
  &.animate-pulse {
    animation: pulse 2s infinite;
  }
  
  &.animate-bounce {
    animation: bounce-gentle 1s infinite;
  }
}

@keyframes bounce-gentle {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-2px);
  }
}

// 产品骨架优化
.product-skeleton {
  margin: 0 -$spacing-base;
  padding: 0 $spacing-base;
}

// 加载状态增强
.products-loading {
  @include flex-center;
  padding: $spacing-xl 0;
  
  .product-skeleton {
    animation: fade-in $animation-duration-base ease-out;
  }
}

@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// 图片加载优化
.product-image {
  transition: opacity $animation-duration-base ease-out;
  
  &:not(.loaded) {
    opacity: 0;
  }
  
  &.loaded {
    opacity: 1;
  }
}

// 错误状态
.products-error {
  @include flex-center;
  flex-direction: column;
  padding: $spacing-xl 0;
  gap: $spacing-base;
  
  .error-text {
    font-size: $font-size-small;
    color: $danger-color;
    text-align: center;
  }
}

// 空状态
.products-empty {
  @include flex-center;
  flex-direction: column;
  padding: $spacing-xl 0;
  
  .empty-icon {
    width: 120rpx;
    height: 120rpx;
    opacity: 0.6;
    margin-bottom: $spacing-base;
  }
  
  .empty-text {
    font-size: $font-size-small;
    color: $text-color-secondary;
  }
}

// ========== 移动端专项优化 ==========

// 全局移动端优化
@include mobile-only {
  .sales-container {
    padding-bottom: calc(120rpx + $safe-area-bottom); // 考虑安全区域
  }
  
  .sales-page {
    @include keyboard-aware-padding;
  }
  
  // 优化触摸滚动
  .sales-page,
  .product-carousel {
    @include smooth-scroll;
  }
  
  // 减少动画复杂度
  @include reduced-motion-safe;
  
  // 优化文字可读性
  * {
    @include readable-text;
  }
  
  // 增强焦点可见性
  button, .enhanced-button, .sales-grid-item {
    @include focus-visible($primary-color, 3px);
  }
}

// iPad适配优化
@include tablet-up {
  .sales-grid {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: $spacing-lg;
  }
  
  .sales-hero {
    padding: $spacing-xl $spacing-xl * 2;
  }
  
  .sales-logo {
    width: 96px;
    height: 96px;
  }
  
  .sales-title {
    font-size: $font-size-extra-large * 1.2;
  }
}

// 高分辨率屏优化
@include retina {
  .sales-logo,
  .sales-grid-icon {
    image-rendering: -webkit-optimize-contrast;
  }
}

// 触摸设备专项优化
@include touch-device {
  // 移除hover效果，避免粘滞
  .enhanced-button:hover,
  .enhanced-card:hover,
  .sales-grid-item:hover {
    transform: none;
    box-shadow: inherit;
  }
  
  // 增强触摸反馈
  .enhanced-button,
  .sales-grid-item {
    @include touch-feedback(0.96, 0.15s);
  }
  
  // 优化滚动条
  .carousel-scroll {
    @include hide-scrollbar;
  }
}

// 非触摸设备保持hover效果
@include hover-device {
  .enhanced-button:hover,
  .enhanced-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
  }
}

// 暗黑模式适配
@include dark-mode {
  .sales-hero {
    background: linear-gradient(135deg, darken($primary-color, 10%) 0%, #1a1a2e 100%);
  }
  
  .sales-grid-content {
    background-color: #2a2a3e;
    border-color: #3a3a4e;
  }
}

// 高对比度模式
@include high-contrast {
  .sales-grid-content,
  .enhanced-button {
    border: 2px solid;
  }
  
  .sales-grid-icon {
    border: 1px solid;
  }
}

// 横屏模式优化
@include landscape {
  @include mobile-only {
    .sales-hero {
      flex-direction: row;
      text-align: left;
      
      .sales-logo {
        margin-right: $spacing-lg;
        margin-bottom: 0;
      }
      
      .sales-title,
      .sales-subtitle {
        text-align: left;
      }
    }
    
    .sales-grid {
      grid-template-columns: repeat(4, 1fr);
      
      .primary-item {
        grid-column: 1 / 3; // 横屏时主按钮占据前两列
      }
    }
  }
}

// 性能优化
.sales-page,
.sales-hero,
.sales-grid-item,
.product-carousel {
  @include gpu-accelerated;
}

// 无障碍支持
.sales-grid-item {
  &:focus {
    outline: 3px solid $primary-color;
    outline-offset: 2px;
  }
  
  // 提供更好的语义化信息
  &[aria-pressed="true"] {
    background-color: rgba($primary-color, 0.1);
  }
}

/* #ifdef H5 */
.sales-page {
  padding-top: calc(44px + #{$spacing-base});
}

.sales-container {
  padding-bottom: 0; // H5端不需要底部导航空间
}
/* #endif */

/* 响应式设计 */
@media (min-width: 768px) {
  .sales-grid {
    grid-template-columns: repeat(3, 1fr);
    
    .primary-item {
      grid-column: 1 / 2; // 平板上主按钮不占满宽
    }
  }
  
  .carousel-list {
    gap: $spacing-lg;
  }
  
  .product-card {
    width: 200rpx;
  }
  
  .product-image-wrapper {
    width: 200rpx;
    height: 150rpx;
  }
}

@media (min-width: 1024px) {
  .sales-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
</style>