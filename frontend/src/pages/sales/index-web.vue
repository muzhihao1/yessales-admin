<template>
  <div class="sales-home">
    <!-- 品牌标识区域 -->
    <div class="brand-section">
      <div class="brand-header">
        <img class="brand-logo" src="/static/logo.png" alt="Logo" />
        <div class="brand-info">
          <h1 class="brand-title">耶氏台球斗南销售中心</h1>
          <p class="brand-subtitle">专业台球设备报价系统</p>
        </div>
      </div>
      <div class="welcome-text">
        <p class="welcome-msg">欢迎使用报价系统，为您提供专业的台球设备报价服务</p>
      </div>
    </div>

    <!-- 主要业务功能区 -->
    <div class="main-features">
      <div class="feature-grid">
        <!-- 新建报价 -->
        <div class="feature-card primary" @click="createQuote">
          <div class="feature-icon">
            <span class="icon-text">📋</span>
          </div>
          <div class="feature-content">
            <h3 class="feature-title">新建报价</h3>
            <p class="feature-desc">创建新的台球设备报价单</p>
          </div>
          <div class="feature-arrow">
            <span class="arrow-text">→</span>
          </div>
        </div>

        <!-- 历史报价 -->
        <div class="feature-card secondary" @click="viewHistory">
          <div class="feature-icon">
            <span class="icon-text">📄</span>
          </div>
          <div class="feature-content">
            <h3 class="feature-title">历史报价</h3>
            <p class="feature-desc">查看和管理历史报价记录</p>
          </div>
          <div class="feature-arrow">
            <span class="arrow-text">→</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 快捷功能区 -->
    <div class="quick-actions">
      <h2 class="section-title">快捷功能</h2>
      <div class="action-grid">
        <div class="action-item" @click="quickProduct">
          <div class="action-icon product">
            <span class="icon-text">🎱</span>
          </div>
          <span class="action-label">产品目录</span>
        </div>

        <div class="action-item" @click="quickCustomer">
          <div class="action-icon customer">
            <span class="icon-text">👤</span>
          </div>
          <span class="action-label">客户信息</span>
        </div>

        <div class="action-item" @click="quickCalculator">
          <div class="action-icon calculator">
            <span class="icon-text">🧮</span>
          </div>
          <span class="action-label">价格计算</span>
        </div>

        <div class="action-item" @click="quickContact">
          <div class="action-icon contact">
            <span class="icon-text">📞</span>
          </div>
          <span class="action-label">联系我们</span>
        </div>
      </div>
    </div>

    <!-- 最近活动 -->
    <div class="recent-activity" v-if="recentQuotes.length > 0">
      <h2 class="section-title">最近报价</h2>
      <div class="activity-list">
        <div
          v-for="quote in recentQuotes"
          :key="quote.id"
          class="activity-item"
          @click="viewQuoteDetail(quote.id)"
        >
          <div class="activity-info">
            <h4 class="activity-title">{{ quote.quote_no }}</h4>
            <p class="activity-customer">{{ quote.customer_name || '客户信息' }}</p>
            <p class="activity-time">{{ formatDate(quote.created_at) }}</p>
          </div>
          <div class="activity-amount">
            <span class="amount-value">¥{{ quote.total_price.toFixed(2) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部信息 -->
    <div class="footer-info">
      <div class="company-info">
        <h3 class="company-name">耶氏台球斗南销售中心</h3>
        <p class="company-desc">专业提供台球桌、配件及相关设备销售</p>
        <p class="contact-info">服务热线：400-888-8888</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const recentQuotes = ref<any[]>([])

// 主要业务功能
function createQuote() {
  console.log('📝 创建新报价')
  router.push('/sales/quote/create')
}

function viewHistory() {
  console.log('📋 查看历史报价')
  router.push('/sales/history')
}

// 快捷功能 - 使用标准 Web API
function quickProduct() {
  console.log('🎱 产品目录')
  alert('产品目录功能开发中')
}

function quickCustomer() {
  console.log('👤 客户信息')
  alert('客户信息功能开发中')
}

function quickCalculator() {
  console.log('🧮 价格计算')
  alert('价格计算功能开发中')
}

function quickContact() {
  console.log('📞 联系我们')
  alert('联系功能开发中')
}

function viewQuoteDetail(id: string) {
  console.log('📄 查看报价详情:', id)
  router.push(`/sales/quote/preview?id=${id}`)
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
        margin-bottom: 8px;
        letter-spacing: 0.5px;
      }

      .brand-subtitle {
        font-size: 14px;
        opacity: 0.9;
      }
    }
  }

  .welcome-text {
    .welcome-msg {
      font-size: 16px;
      line-height: 1.5;
      opacity: 0.9;
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
    cursor: pointer;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
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
        margin-bottom: 4px;
      }

      .feature-desc {
        font-size: 14px;
        opacity: 0.8;
        margin: 0;
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
    cursor: pointer;

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
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
    cursor: pointer;

    &:last-child {
      border-bottom: none;
    }

    &:hover {
      background-color: #f9fafb;
    }

    .activity-info {
      flex: 1;

      .activity-title {
        font-size: 16px;
        font-weight: 600;
        color: #374151;
        margin: 0 0 4px 0;
      }

      .activity-customer {
        font-size: 14px;
        color: #6b7280;
        margin: 0 0 4px 0;
      }

      .activity-time {
        font-size: 12px;
        color: #9ca3af;
        margin: 0;
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
      margin: 0 0 8px 0;
    }

    .company-desc {
      font-size: 14px;
      color: #6b7280;
      margin: 0 0 8px 0;
    }

    .contact-info {
      font-size: 14px;
      color: #2563eb;
      font-weight: 500;
      margin: 0;
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
