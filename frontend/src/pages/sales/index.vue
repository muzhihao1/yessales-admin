<template>
  <div class="sales-home">
    <!-- Professional Hero Section -->
    <header class="hero-section">
      <div class="hero-content">
        <div class="brand-identity">
          <div class="brand-logo">
            <div class="logo-placeholder">🎱</div>
          </div>
          <div class="brand-info">
            <h1 class="brand-title">耶氏台球斗南销售中心</h1>
            <p class="brand-subtitle">专业台球设备报价系统</p>
          </div>
        </div>
        <p class="hero-description">为您提供专业、高效、准确的台球设备报价服务，助力您的业务决策</p>
      </div>
      <div class="hero-decoration">
        <div class="decoration-circle decoration-circle--1"></div>
        <div class="decoration-circle decoration-circle--2"></div>
        <div class="decoration-circle decoration-circle--3"></div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="main-content">
      <!-- Primary Actions -->
      <section class="primary-actions">
        <div class="actions-grid">
          <button class="action-card action-card--primary" @click="createQuote">
            <div class="action-card__icon">
              <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
                <path
                  d="M19 3H5C3.9 3 3 3.9 3 5v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"
                />
              </svg>
            </div>
            <div class="action-card__content">
              <h3 class="action-card__title">新建报价</h3>
              <p class="action-card__description">创建新的台球设备报价单</p>
            </div>
            <div class="action-card__arrow">
              <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
              </svg>
            </div>
          </button>

          <button class="action-card action-card--secondary" @click="viewHistory">
            <div class="action-card__icon">
              <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
                <path
                  d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"
                />
              </svg>
            </div>
            <div class="action-card__content">
              <h3 class="action-card__title">历史报价</h3>
              <p class="action-card__description">查看和管理历史报价记录</p>
            </div>
            <div class="action-card__arrow">
              <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
              </svg>
            </div>
          </button>
        </div>
      </section>

      <!-- Quick Tools -->
      <section class="quick-tools">
        <h2 class="section-title">快捷工具</h2>
        <div class="tools-grid">
          <button class="tool-card" @click="quickProduct">
            <div class="tool-card__icon tool-card__icon--product">
              <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
                <path
                  d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                />
              </svg>
            </div>
            <span class="tool-card__label">产品目录</span>
          </button>

          <button class="tool-card" @click="quickCustomer">
            <div class="tool-card__icon tool-card__icon--customer">
              <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
                <path
                  d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
                />
              </svg>
            </div>
            <span class="tool-card__label">客户信息</span>
          </button>

          <button class="tool-card" @click="quickCalculator">
            <div class="tool-card__icon tool-card__icon--calculator">
              <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
                <path
                  d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5.97 4.06L14.09 6l1.41 1.41L16.91 6l1.06 1.06L16.91 8.12l1.06 1.06L16.91 10.24 15.5 8.83 14.09 10.24 13.03 9.18 14.44 7.77l-1.41-1.71z"
                />
              </svg>
            </div>
            <span class="tool-card__label">价格计算</span>
          </button>

          <button class="tool-card" @click="quickContact">
            <div class="tool-card__icon tool-card__icon--contact">
              <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
                <path
                  d="M6.62 10.79c1.44 2.83 3.76 5.15 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"
                />
              </svg>
            </div>
            <span class="tool-card__label">联系我们</span>
          </button>
        </div>
      </section>

      <!-- Recent Activity -->
      <section class="recent-activity" v-if="recentQuotes.length > 0">
        <div class="section-header">
          <h2 class="section-title">最近报价</h2>
          <button class="view-all-btn" @click="viewHistory">
            <span>查看全部</span>
            <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
            </svg>
          </button>
        </div>

        <div class="activity-list">
          <div
            v-for="quote in recentQuotes"
            :key="quote.id"
            class="activity-item"
            @click="viewQuoteDetail(quote.id)"
          >
            <div class="activity-content">
              <div class="activity-header">
                <h4 class="activity-title">{{ quote.quote_no }}</h4>
                <div class="activity-badge activity-badge--pending">待确认</div>
              </div>
              <div class="activity-details">
                <p class="activity-customer">{{ quote.customer_name || '客户信息' }}</p>
                <time class="activity-time">{{ formatDate(quote.created_at) }}</time>
              </div>
            </div>
            <div class="activity-amount">
              <span class="amount-value">¥{{ quote.total_price.toFixed(2) }}</span>
              <svg class="icon activity-arrow" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
              </svg>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- Professional Footer -->
    <footer class="app-footer">
      <div class="footer-content">
        <div class="company-info">
          <h3 class="company-name">耶氏台球斗南销售中心</h3>
          <p class="company-desc">专业提供台球桌、配件及相关设备销售</p>
        </div>
        <div class="contact-info">
          <div class="contact-item">
            <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M6.62 10.79c1.44 2.83 3.76 5.15 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"
              />
            </svg>
            <span class="contact-text">服务热线：400-888-8888</span>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { navigation, toast } from '@/utils/platform-adapter'

const router = useRouter()
const recentQuotes = ref<any[]>([])

// 主要业务功能
function createQuote() {
  console.log('📝 创建新报价')

  // 兼容多环境路由
  if (typeof window !== 'undefined' && window.location) {
    router.push('/sales/quote/create')
  } else {
    navigation.navigateTo('/pages/sales/quote/create')
  }
}

function viewHistory() {
  console.log('📋 查看历史报价')

  // 兼容多环境路由
  if (typeof window !== 'undefined' && window.location) {
    router.push('/sales/history')
  } else {
    navigation.navigateTo('/pages/sales/history/index')
  }
}

// 快捷功能
function quickProduct() {
  console.log('🎱 产品目录')
  // TODO: 实现产品目录功能
  toast.show('产品目录功能开发中', 'none')
}

function quickCustomer() {
  console.log('👤 客户信息')
  // TODO: 实现客户信息功能
  toast.show('客户信息功能开发中', 'none')
}

function quickCalculator() {
  console.log('🧮 价格计算')
  // TODO: 实现价格计算器
  toast.show('价格计算功能开发中', 'none')
}

function quickContact() {
  console.log('📞 联系我们')
  // TODO: 实现联系功能
  toast.show('联系功能开发中', 'none')
}

function viewQuoteDetail(id: string) {
  console.log('📄 查看报价详情:', id)

  // 兼容多环境路由
  if (typeof window !== 'undefined' && window.location) {
    router.push(`/sales/quote/preview?id=${id}`)
  } else {
    navigation.navigateTo(`/pages/sales/quote/preview?id=${id}`)
  }
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${month}-${day} ${hours}:${minutes}`
}

// 加载最近报价数据
const loadRecentQuotes = async () => {
  try {
    // TODO: 实际从API获取数据
    // 模拟数据
    recentQuotes.value = [
      {
        id: '1',
        quote_no: 'YS-' + new Date().getFullYear() + '-001',
        customer_name: '张先生',
        total_price: 15800,
        created_at: new Date().toISOString()
      },
      {
        id: '2',
        quote_no: 'YS-' + new Date().getFullYear() + '-002',
        customer_name: '李女士',
        total_price: 28600,
        created_at: new Date(Date.now() - 86400000).toISOString()
      }
    ]
  } catch (error) {
    console.error('加载最近报价失败:', error)
  }
}

onMounted(async () => {
  console.log('🏠 销售端首页已加载')
  await loadRecentQuotes()
})
</script>

<style lang="scss" scoped>
@import '@/styles/design-tokens.scss';

.sales-home {
  min-height: 100vh;
  background-color: $gray-50;
}

// Professional Hero Section
.hero-section {
  position: relative;
  background: linear-gradient(135deg, $primary-700 0%, $primary-900 100%);
  color: $white;
  padding: $space-12 $space-4 $space-16;
  overflow: hidden;

  @media (min-width: $breakpoint-md) {
    padding: $space-20 $space-8 $space-24;
  }
}

.hero-content {
  position: relative;
  z-index: 2;
  max-width: 1200px;
  margin: 0 auto;
  text-align: center;
}

.brand-identity {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: $space-8;

  @media (min-width: $breakpoint-md) {
    flex-direction: row;
    justify-content: center;
    text-align: left;
  }
}

.brand-logo {
  margin-bottom: $space-4;

  @media (min-width: $breakpoint-md) {
    margin-bottom: 0;
    margin-right: $space-6;
  }

  .logo-placeholder {
    width: 80px;
    height: 80px;
    background: rgba($white, 0.15);
    border-radius: $radius-2xl;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2.5rem;
    backdrop-filter: blur(10px);
    border: 2px solid rgba($white, 0.2);
  }
}

.brand-info {
  text-align: center;

  @media (min-width: $breakpoint-md) {
    text-align: left;
  }

  .brand-title {
    font-size: $text-2xl;
    font-weight: $font-bold;
    margin-bottom: $space-2;

    @media (min-width: $breakpoint-md) {
      font-size: $text-3xl;
    }
  }

  .brand-subtitle {
    font-size: $text-lg;
    opacity: 0.9;
    margin: 0;
  }
}

.hero-description {
  font-size: $text-lg;
  line-height: $leading-relaxed;
  opacity: 0.95;
  max-width: 600px;
  margin: 0 auto;

  @media (min-width: $breakpoint-md) {
    font-size: $text-xl;
  }
}

// Hero Decorations
.hero-decoration {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
  overflow: hidden;

  .decoration-circle {
    position: absolute;
    border-radius: 50%;
    background: rgba($white, 0.05);

    &--1 {
      width: 200px;
      height: 200px;
      top: -100px;
      right: -100px;
    }

    &--2 {
      width: 300px;
      height: 300px;
      bottom: -150px;
      left: -150px;
    }

    &--3 {
      width: 120px;
      height: 120px;
      top: 50%;
      left: 10%;
      opacity: 0.3;
    }
  }
}

// Main Content
.main-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: $space-8 $space-4;

  @media (min-width: $breakpoint-md) {
    padding: $space-12 $space-8;
  }
}

// Primary Actions
.primary-actions {
  margin-bottom: $space-12;
}

.actions-grid {
  display: grid;
  gap: $space-4;

  @media (min-width: $breakpoint-md) {
    grid-template-columns: repeat(2, 1fr);
    gap: $space-6;
  }
}

.action-card {
  background-color: $white;
  border-radius: $radius-xl;
  box-shadow: $shadow-base;
  border: 2px solid transparent;
  display: flex;
  align-items: center;
  padding: $space-6;
  cursor: pointer;
  transition: all $transition-base;
  text-align: left;
  width: 100%;

  &:hover {
    transform: translateY(-2px);
    box-shadow: $shadow-lg;
  }

  &:active {
    transform: translateY(0);
  }

  &--primary {
    background: linear-gradient(135deg, $primary-500 0%, $primary-700 100%);
    color: $white;
    border-color: $primary-600;

    &:hover {
      box-shadow: $shadow-xl;
    }
  }

  &--secondary {
    border-color: $gray-200;

    &:hover {
      border-color: $primary-300;
    }
  }

  &__icon {
    width: 64px;
    height: 64px;
    border-radius: $radius-xl;
    background: rgba($white, 0.15);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: $space-4;
    backdrop-filter: blur(10px);

    .action-card--secondary & {
      background: $primary-50;
      color: $primary-600;
    }

    .icon {
      width: 32px;
      height: 32px;
    }
  }

  &__content {
    flex: 1;
  }

  &__title {
    font-size: $text-xl;
    font-weight: $font-semibold;
    margin-bottom: $space-1;
  }

  &__description {
    font-size: $text-sm;
    opacity: 0.8;
    margin: 0;

    .action-card--primary & {
      opacity: 0.9;
    }
  }

  &__arrow {
    margin-left: $space-2;

    .icon {
      width: 24px;
      height: 24px;
      opacity: 0.7;

      .action-card--primary & {
        opacity: 1;
      }
    }
  }
}

// Quick Tools
.quick-tools {
  margin-bottom: $space-12;
}

.section-title {
  font-size: $text-2xl;
  font-weight: $font-semibold;
  color: $gray-900;
  margin-bottom: $space-6;
  padding-bottom: $space-2;
  border-bottom: 3px solid $primary-500;
  display: inline-block;
}

.tools-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $space-4;

  @media (min-width: $breakpoint-sm) {
    grid-template-columns: repeat(4, 1fr);
  }
}

.tool-card {
  background-color: $white;
  border-radius: $radius-xl;
  box-shadow: $shadow-base;
  border: 2px solid transparent;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: $space-5;
  text-align: center;
  cursor: pointer;
  transition: all $transition-base;

  &:hover {
    transform: translateY(-4px);
    box-shadow: $shadow-lg;
    border-color: $primary-200;
  }

  &:active {
    transform: translateY(-2px);
  }

  &__icon {
    width: 56px;
    height: 56px;
    border-radius: $radius-xl;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: $space-3;

    .icon {
      width: 28px;
      height: 28px;
      color: $white;
    }

    &--product {
      background: linear-gradient(135deg, #ffb74d 0%, $warning 100%);
    }

    &--customer {
      background: linear-gradient(135deg, #64b5f6 0%, $info 100%);
    }

    &--calculator {
      background: linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%);
    }

    &--contact {
      background: linear-gradient(135deg, #81c784 0%, $success 100%);
    }
  }

  &__label {
    font-size: $text-sm;
    font-weight: $font-medium;
    color: $gray-700;
  }
}

// Recent Activity
.recent-activity {
  margin-bottom: $space-12;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: $space-6;
}

.view-all-btn {
  display: flex;
  align-items: center;
  gap: $space-1;
  color: $primary-600;
  font-size: $text-sm;
  font-weight: $font-medium;
  background: none;
  border: none;
  cursor: pointer;
  padding: $space-2 $space-3;
  border-radius: $radius-lg;
  transition: all $transition-fast;

  &:hover {
    background-color: $primary-50;
    color: $primary-700;
  }

  .icon {
    width: 16px;
    height: 16px;
  }
}

.activity-list {
  background-color: $white;
  border-radius: $radius-xl;
  box-shadow: $shadow-base;
  border: 1px solid $gray-200;
  overflow: hidden;
}

.activity-item {
  display: flex;
  align-items: center;
  padding: $space-4 $space-5;
  border-bottom: 1px solid $gray-200;
  cursor: pointer;
  transition: background-color $transition-fast;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background-color: $gray-50;
  }

  &:active {
    background-color: $gray-100;
  }
}

.activity-content {
  flex: 1;
}

.activity-header {
  display: flex;
  align-items: center;
  gap: $space-3;
  margin-bottom: $space-2;
}

.activity-title {
  font-size: $text-lg;
  font-weight: $font-semibold;
  color: $gray-900;
  margin: 0;
}

.activity-badge {
  font-size: $text-xs;
  font-weight: $font-medium;
  padding: $space-1 $space-2;
  border-radius: $radius-full;

  &--pending {
    background-color: #fef3c7;
    color: #92400e;
  }
}

.activity-details {
  display: flex;
  align-items: center;
  gap: $space-4;
}

.activity-customer {
  font-size: $text-sm;
  color: $gray-600;
  margin: 0;
}

.activity-time {
  font-size: $text-xs;
  color: $gray-500;
}

.activity-amount {
  display: flex;
  align-items: center;
  gap: $space-2;

  .amount-value {
    font-size: $text-xl;
    font-weight: $font-bold;
    color: $primary-600;
  }

  .activity-arrow {
    width: 20px;
    height: 20px;
    color: $gray-400;
  }
}

// Professional Footer
.app-footer {
  background-color: $white;
  border-top: 1px solid $gray-200;
  margin-top: $space-16;
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: $space-8 $space-4;
  display: flex;
  flex-direction: column;
  gap: $space-6;

  @media (min-width: $breakpoint-md) {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
}

.company-info {
  text-align: center;

  @media (min-width: $breakpoint-md) {
    text-align: left;
  }

  .company-name {
    font-size: $text-xl;
    font-weight: $font-semibold;
    color: $gray-900;
    margin-bottom: $space-2;
  }

  .company-desc {
    font-size: $text-base;
    color: $gray-600;
    margin: 0;
  }
}

.contact-info {
  text-align: center;

  @media (min-width: $breakpoint-md) {
    text-align: right;
  }
}

.contact-item {
  display: flex;
  align-items: center;
  gap: $space-2;
  justify-content: center;

  @media (min-width: $breakpoint-md) {
    justify-content: flex-end;
  }

  .icon {
    width: 20px;
    height: 20px;
    color: $primary-600;
  }

  .contact-text {
    font-size: $text-base;
    font-weight: $font-medium;
    color: $primary-600;
  }
}

// Icon base styles
.icon {
  fill: currentColor;
  flex-shrink: 0;
}

// Responsive optimizations
@media (max-width: $breakpoint-sm) {
  .hero-section {
    padding: $space-8 $space-4 $space-12;
  }

  .main-content {
    padding: $space-6 $space-4;
  }

  .actions-grid {
    gap: $space-3;
  }

  .action-card {
    padding: $space-4;

    &__icon {
      width: 56px;
      height: 56px;
      margin-right: $space-3;
    }

    &__title {
      font-size: $text-lg;
    }
  }

  .tools-grid {
    gap: $space-3;
  }

  .tool-card {
    padding: $space-4;

    &__icon {
      width: 48px;
      height: 48px;
      margin-bottom: $space-2;
    }
  }
}
</style>
