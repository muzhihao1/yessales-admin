<template>
  <view class="sales-home">
    <!-- 品牌标识区域 -->
    <view class="brand-section">
      <view class="brand-header">
        <image class="brand-logo" src="/static/logo.png" mode="aspectFit" />
        <view class="brand-info">
          <text class="brand-title">耶氏台球斗南销售中心</text>
          <text class="brand-subtitle">专业台球设备报价系统</text>
        </view>
      </view>
      <view class="welcome-text">
        <text class="welcome-msg">欢迎使用报价系统，为您提供专业的台球设备报价服务</text>
      </view>
    </view>

    <!-- 主要业务功能区 -->
    <view class="main-features">
      <view class="feature-grid">
        <!-- 新建报价 -->
        <view class="feature-card primary" @click="createQuote">
          <view class="feature-icon">
            <text class="icon-text">📋</text>
          </view>
          <view class="feature-content">
            <text class="feature-title">新建报价</text>
            <text class="feature-desc">创建新的台球设备报价单</text>
          </view>
          <view class="feature-arrow">
            <text class="arrow-text">→</text>
          </view>
        </view>

        <!-- 历史报价 -->
        <view class="feature-card secondary" @click="viewHistory">
          <view class="feature-icon">
            <text class="icon-text">📄</text>
          </view>
          <view class="feature-content">
            <text class="feature-title">历史报价</text>
            <text class="feature-desc">查看和管理历史报价记录</text>
          </view>
          <view class="feature-arrow">
            <text class="arrow-text">→</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 快捷功能区 -->
    <view class="quick-actions">
      <text class="section-title">快捷功能</text>
      <view class="action-grid">
        <view class="action-item" @click="quickProduct">
          <view class="action-icon product">
            <text class="icon-text">🎱</text>
          </view>
          <text class="action-label">产品目录</text>
        </view>

        <view class="action-item" @click="quickCustomer">
          <view class="action-icon customer">
            <text class="icon-text">👤</text>
          </view>
          <text class="action-label">客户信息</text>
        </view>

        <view class="action-item" @click="quickCalculator">
          <view class="action-icon calculator">
            <text class="icon-text">🧮</text>
          </view>
          <text class="action-label">价格计算</text>
        </view>

        <view class="action-item" @click="quickContact">
          <view class="action-icon contact">
            <text class="icon-text">📞</text>
          </view>
          <text class="action-label">联系我们</text>
        </view>
      </view>
    </view>

    <!-- 最近活动 -->
    <view class="recent-activity" v-if="recentQuotes.length > 0">
      <text class="section-title">最近报价</text>
      <view class="activity-list">
        <view 
          v-for="quote in recentQuotes" 
          :key="quote.id"
          class="activity-item"
          @click="viewQuoteDetail(quote.id)"
        >
          <view class="activity-info">
            <text class="activity-title">{{ quote.quote_no }}</text>
            <text class="activity-customer">{{ quote.customer_name || '客户信息' }}</text>
            <text class="activity-time">{{ formatDate(quote.created_at) }}</text>
          </view>
          <view class="activity-amount">
            <text class="amount-value">¥{{ quote.total_price.toFixed(2) }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 底部信息 -->
    <view class="footer-info">
      <view class="company-info">
        <text class="company-name">耶氏台球斗南销售中心</text>
        <text class="company-desc">专业提供台球桌、配件及相关设备销售</text>
        <text class="contact-info">服务热线：400-888-8888</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const recentQuotes = ref<any[]>([])

// 主要业务功能
function createQuote() {
  console.log('📝 创建新报价')
  
  // 兼容多环境路由
  if (typeof window !== 'undefined' && window.location) {
    router.push('/sales/quote/create')
  } else {
    uni.navigateTo({
      url: '/pages/sales/quote/create'
    })
  }
}

function viewHistory() {
  console.log('📋 查看历史报价')
  
  // 兼容多环境路由
  if (typeof window !== 'undefined' && window.location) {
    router.push('/sales/history')
  } else {
    uni.navigateTo({
      url: '/pages/sales/history/index'
    })
  }
}

// 快捷功能
function quickProduct() {
  console.log('🎱 产品目录')
  // TODO: 实现产品目录功能
  uni.showToast({
    title: '产品目录功能开发中',
    icon: 'none'
  })
}

function quickCustomer() {
  console.log('👤 客户信息')
  // TODO: 实现客户信息功能
  uni.showToast({
    title: '客户信息功能开发中',
    icon: 'none'
  })
}

function quickCalculator() {
  console.log('🧮 价格计算')
  // TODO: 实现价格计算器
  uni.showToast({
    title: '价格计算功能开发中',
    icon: 'none'
  })
}

function quickContact() {
  console.log('📞 联系我们')
  // TODO: 实现联系功能
  uni.showToast({
    title: '联系功能开发中',
    icon: 'none'
  })
}

function viewQuoteDetail(id: string) {
  console.log('📄 查看报价详情:', id)
  
  // 兼容多环境路由
  if (typeof window !== 'undefined' && window.location) {
    router.push(`/sales/quote/preview?id=${id}`)
  } else {
    uni.navigateTo({
      url: `/pages/sales/quote/preview?id=${id}`
    })
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
.sales-home {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  padding: 0;
}

// 品牌标识区域
.brand-section {
  background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
  color: white;
  padding: 32px 20px;
  text-align: center;

  .brand-header {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 24px;

    .brand-logo {
      width: 80px;
      height: 80px;
      margin-bottom: 16px;
      border-radius: 12px;
      background-color: rgba(255, 255, 255, 0.1);
    }

    .brand-info {
      .brand-title {
        font-size: 24px;
        font-weight: 600;
        display: block;
        margin-bottom: 8px;
        letter-spacing: 0.5px;
      }

      .brand-subtitle {
        font-size: 14px;
        opacity: 0.9;
        display: block;
      }
    }
  }

  .welcome-text {
    .welcome-msg {
      font-size: 16px;
      line-height: 1.5;
      opacity: 0.9;
      display: block;
    }
  }
}

// 主要功能区域
.main-features {
  padding: 32px 20px;

  .feature-grid {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .feature-card {
    background: white;
    border-radius: 16px;
    padding: 24px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
    display: flex;
    align-items: center;
    position: relative;
    transition: all 0.3s ease;

    &:active {
      transform: scale(0.98);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    &.primary {
      background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
      color: white;

      .feature-arrow .arrow-text {
        color: white;
      }
    }

    &.secondary {
      border: 2px solid #e5e7eb;

      &:hover {
        border-color: #3b82f6;
      }
    }

    .feature-icon {
      width: 56px;
      height: 56px;
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 16px;

      .icon-text {
        font-size: 28px;
      }
    }

    .feature-content {
      flex: 1;

      .feature-title {
        font-size: 18px;
        font-weight: 600;
        display: block;
        margin-bottom: 4px;
      }

      .feature-desc {
        font-size: 14px;
        opacity: 0.8;
        display: block;
      }
    }

    .feature-arrow {
      .arrow-text {
        font-size: 20px;
        color: #6b7280;
        font-weight: bold;
      }
    }
  }
}

// 快捷功能
.quick-actions {
  padding: 0 20px 32px;

  .section-title {
    font-size: 20px;
    font-weight: 600;
    color: #374151;
    margin-bottom: 20px;
    display: block;
  }

  .action-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }

  .action-item {
    background: white;
    border-radius: 12px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    transition: all 0.3s ease;

    &:active {
      transform: translateY(1px);
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    }

    .action-icon {
      width: 48px;
      height: 48px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 12px;

      &.product {
        background: linear-gradient(135deg, #fef3c7 0%, #fbbf24 100%);
      }

      &.customer {
        background: linear-gradient(135deg, #e0f2fe 0%, #0284c7 100%);
      }

      &.calculator {
        background: linear-gradient(135deg, #f3e8ff 0%, #8b5cf6 100%);
      }

      &.contact {
        background: linear-gradient(135deg, #f0fdf4 0%, #22c55e 100%);
      }

      .icon-text {
        font-size: 24px;
      }
    }

    .action-label {
      font-size: 14px;
      font-weight: 500;
      color: #374151;
    }
  }
}

// 最近活动
.recent-activity {
  padding: 0 20px 32px;

  .section-title {
    font-size: 20px;
    font-weight: 600;
    color: #374151;
    margin-bottom: 20px;
    display: block;
  }

  .activity-list {
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    overflow: hidden;
  }

  .activity-item {
    display: flex;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid #f3f4f6;
    transition: background-color 0.3s ease;

    &:last-child {
      border-bottom: none;
    }

    &:active {
      background-color: #f9fafb;
    }

    .activity-info {
      flex: 1;

      .activity-title {
        font-size: 16px;
        font-weight: 600;
        color: #374151;
        display: block;
        margin-bottom: 4px;
      }

      .activity-customer {
        font-size: 14px;
        color: #6b7280;
        display: block;
        margin-bottom: 4px;
      }

      .activity-time {
        font-size: 12px;
        color: #9ca3af;
        display: block;
      }
    }

    .activity-amount {
      .amount-value {
        font-size: 16px;
        font-weight: 600;
        color: #059669;
      }
    }
  }
}

// 底部信息
.footer-info {
  padding: 32px 20px;
  margin-top: 40px;
  background: #f8fafc;
  border-top: 1px solid #e5e7eb;

  .company-info {
    text-align: center;

    .company-name {
      font-size: 18px;
      font-weight: 600;
      color: #374151;
      display: block;
      margin-bottom: 8px;
    }

    .company-desc {
      font-size: 14px;
      color: #6b7280;
      display: block;
      margin-bottom: 8px;
    }

    .contact-info {
      font-size: 14px;
      color: #2563eb;
      font-weight: 500;
      display: block;
    }
  }
}

/* 平板和桌面端适配 */
@media (min-width: 768px) {
  .main-features .feature-grid {
    flex-direction: row;
  }

  .quick-actions .action-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

/* 小屏幕适配 */
@media (max-width: 375px) {
  .brand-section {
    padding: 24px 16px;
  }

  .main-features {
    padding: 24px 16px;
  }

  .quick-actions {
    padding: 0 16px 24px;
  }

  .recent-activity {
    padding: 0 16px 24px;
  }
}
</style>