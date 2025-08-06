<template>
  <view class="dashboard-page">
    <AdminLayout>
      <!-- 页面标题 -->
      <view class="page-header">
        <text class="page-title">仪表盘</text>
        <text class="page-subtitle">欢迎回来，{{ authStore.userName }}</text>
      </view>

      <!-- 统计卡片 -->
      <view class="stat-cards">
        <view class="stat-card" v-for="stat in statistics" :key="stat.key">
          <view class="stat-icon" :style="{ backgroundColor: stat.bgColor }">
            <text :style="{ color: stat.color }">{{ stat.icon }}</text>
          </view>
          <view class="stat-content">
            <text class="stat-value">{{ stat.value }}</text>
            <text class="stat-label">{{ stat.label }}</text>
          </view>
          <view class="stat-trend" v-if="stat.trend">
            <text :class="['trend-value', stat.trend > 0 ? 'up' : 'down']">
              {{ stat.trend > 0 ? '+' : '' }}{{ stat.trend }}%
            </text>
            <text class="trend-label">较上月</text>
          </view>
        </view>
      </view>

      <!-- 图表区域 -->
      <view class="chart-section">
        <view class="chart-card">
          <view class="card-header">
            <text class="card-title">销售趋势</text>
            <view class="chart-tabs">
              <text 
                v-for="tab in chartTabs" 
                :key="tab.key"
                :class="['tab-item', { active: activeChartTab === tab.key }]"
                @click="activeChartTab = tab.key"
              >
                {{ tab.label }}
              </text>
            </view>
          </view>
          <view class="chart-container">
            <!-- 这里将集成 ECharts 图表 -->
            <view class="chart-placeholder">
              <text>销售趋势图表</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 最近报价单 -->
      <view class="recent-section">
        <view class="section-header">
          <text class="section-title">最近报价单</text>
          <text class="section-link" @click="navigateToQuotes">查看全部 →</text>
        </view>
        
        <view class="quote-list">
          <view v-if="recentQuotes.length === 0" class="empty-state">
            <text class="empty-text">暂无报价单数据</text>
          </view>
          
          <view v-else class="quote-table">
            <view class="table-header">
              <text class="col col-no">报价单号</text>
              <text class="col col-customer">客户</text>
              <text class="col col-amount">金额</text>
              <text class="col col-status">状态</text>
              <text class="col col-date">创建时间</text>
              <text class="col col-action">操作</text>
            </view>
            
            <view 
              v-for="quote in recentQuotes" 
              :key="quote.id"
              class="table-row"
            >
              <text class="col col-no">{{ quote.quote_no }}</text>
              <text class="col col-customer">{{ quote.customer?.name || '-' }}</text>
              <text class="col col-amount">¥{{ quote.total_price.toFixed(2) }}</text>
              <view class="col col-status">
                <text :class="['status-badge', `status-${quote.status}`]">
                  {{ getStatusText(quote.status) }}
                </text>
              </view>
              <text class="col col-date">{{ formatDate(quote.created_at) }}</text>
              <view class="col col-action">
                <text class="action-link" @click="viewQuote(quote.id)">查看</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 快捷操作 -->
      <view class="quick-actions">
        <text class="section-title">快捷操作</text>
        <view class="action-grid">
          <view 
            v-for="action in quickActions" 
            :key="action.key"
            class="action-item"
            @click="handleQuickAction(action.key)"
          >
            <view class="action-icon" :style="{ backgroundColor: action.bgColor }">
              <text :style="{ color: action.color }">{{ action.icon }}</text>
            </view>
            <text class="action-label">{{ action.label }}</text>
          </view>
        </view>
      </view>
    </AdminLayout>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import AdminLayout from '@/components/admin/AdminLayout.vue'
import { useAuthStore } from '@/stores/auth'
import type { Quote } from '@/types/models'

const authStore = useAuthStore()

const activeChartTab = ref('week')
const recentQuotes = ref<Quote[]>([])

const statistics = ref([
  {
    key: 'total',
    label: '总报价单',
    value: '0',
    icon: '📋',
    color: '#2563eb',
    bgColor: '#eff6ff',
    trend: 12.5,
  },
  {
    key: 'pending',
    label: '待审核',
    value: '0',
    icon: '⏳',
    color: '#f59e0b',
    bgColor: '#fffbeb',
    trend: -3.2,
  },
  {
    key: 'approved',
    label: '已通过',
    value: '0',
    icon: '✅',
    color: '#22c55e',
    bgColor: '#f0fdf4',
    trend: 8.7,
  },
  {
    key: 'revenue',
    label: '总金额',
    value: '¥0',
    icon: '💰',
    color: '#6366f1',
    bgColor: '#eef2ff',
    trend: 15.3,
  },
])

const chartTabs = [
  { key: 'week', label: '本周' },
  { key: 'month', label: '本月' },
  { key: 'year', label: '本年' },
]

const quickActions = [
  {
    key: 'new-quote',
    label: '新建报价',
    icon: '➕',
    color: '#2563eb',
    bgColor: '#eff6ff',
  },
  {
    key: 'add-product',
    label: '添加产品',
    icon: '📦',
    color: '#22c55e',
    bgColor: '#f0fdf4',
  },
  {
    key: 'view-reports',
    label: '查看报表',
    icon: '📊',
    color: '#6366f1',
    bgColor: '#eef2ff',
  },
  {
    key: 'export-data',
    label: '导出数据',
    icon: '📤',
    color: '#f59e0b',
    bgColor: '#fffbeb',
  },
]

const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    pending: '待审核',
    approved: '已通过',
    rejected: '已拒绝',
    completed: '已完成',
  }
  return statusMap[status] || status
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${month}-${day} ${hours}:${minutes}`
}

const navigateToQuotes = () => {
  uni.navigateTo({ url: '/pages/admin/quotes/index' })
}

const viewQuote = (id: string) => {
  uni.navigateTo({ url: `/pages/admin/quotes/detail?id=${id}` })
}

const handleQuickAction = (key: string) => {
  switch (key) {
    case 'new-quote':
      uni.navigateTo({ url: '/pages/sales/quote/create' })
      break
    case 'add-product':
      uni.navigateTo({ url: '/pages/admin/products/edit' })
      break
    case 'view-reports':
      uni.navigateTo({ url: '/pages/admin/reports/index' })
      break
    case 'export-data':
      uni.showToast({ title: '功能开发中', icon: 'none' })
      break
  }
}

const loadDashboardData = async () => {
  // TODO: 调用 API 获取仪表盘数据
  // 这里先使用模拟数据
  statistics.value[0].value = '156'
  statistics.value[1].value = '23'
  statistics.value[2].value = '98'
  statistics.value[3].value = '¥128,560'
  
  // 模拟最近报价单数据
  recentQuotes.value = [
    {
      id: '1',
      quote_no: '20240120-001',
      customer_id: '1',
      total_price: 12580,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      customer: {
        id: '1',
        name: '张先生',
        phone: '13800138000',
        created_at: new Date().toISOString(),
      },
    },
    {
      id: '2',
      quote_no: '20240120-002',
      customer_id: '2',
      total_price: 25800,
      status: 'approved',
      created_at: new Date(Date.now() - 86400000).toISOString(),
      updated_at: new Date().toISOString(),
      customer: {
        id: '2',
        name: '李女士',
        phone: '13900139000',
        created_at: new Date().toISOString(),
      },
    },
  ]
}

onMounted(() => {
  loadDashboardData()
})
</script>

<style lang="scss" scoped>
.dashboard-page {
  width: 100%;
  min-height: 100vh;
}

.page-header {
  margin-bottom: 24px;

  .page-title {
    font-size: 24px;
    font-weight: 600;
    color: #303133;
    display: block;
    margin-bottom: 8px;
  }

  .page-subtitle {
    font-size: 14px;
    color: #909399;
  }
}

.stat-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  margin-bottom: 30px;

  .stat-card {
    background-color: #fff;
    border-radius: 8px;
    padding: 24px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    display: flex;
    align-items: center;
    position: relative;
    overflow: hidden;

    .stat-icon {
      width: 64px;
      height: 64px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;
      margin-right: 20px;
      flex-shrink: 0;
    }

    .stat-content {
      flex: 1;

      .stat-value {
        font-size: 28px;
        font-weight: 600;
        color: #303133;
        display: block;
        margin-bottom: 4px;
      }

      .stat-label {
        font-size: 14px;
        color: #909399;
      }
    }

    .stat-trend {
      position: absolute;
      top: 20px;
      right: 20px;
      text-align: right;

      .trend-value {
        font-size: 14px;
        font-weight: 500;
        display: block;

        &.up {
          color: #22c55e;
        }

        &.down {
          color: #ef4444;
        }
      }

      .trend-label {
        font-size: 12px;
        color: #c0c4cc;
      }
    }
  }
}

.chart-section {
  margin-bottom: 30px;

  .chart-card {
    background-color: #fff;
    border-radius: 8px;
    padding: 24px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);

    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;

      .card-title {
        font-size: 18px;
        font-weight: 600;
        color: #303133;
      }

      .chart-tabs {
        display: flex;
        gap: 4px;

        .tab-item {
          padding: 6px 16px;
          font-size: 14px;
          color: #606266;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.3s;

          &.active {
            background-color: #eff6ff;
            color: #2563eb;
          }
        }
      }
    }

    .chart-container {
      height: 300px;

      .chart-placeholder {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: #f5f7fa;
        border-radius: 4px;
        color: #909399;
      }
    }
  }
}

.recent-section {
  background-color: #fff;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  margin-bottom: 30px;

  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;

    .section-title {
      font-size: 18px;
      font-weight: 600;
      color: #303133;
    }

    .section-link {
      font-size: 14px;
      color: #2563eb;
      cursor: pointer;

      &:hover {
        color: #1d4ed8;
      }
    }
  }

  .empty-state {
    padding: 60px 0;
    text-align: center;

    .empty-text {
      font-size: 14px;
      color: #909399;
    }
  }

  .quote-table {
    .table-header,
    .table-row {
      display: flex;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px solid #ebeef5;
    }

    .table-header {
      font-weight: 500;
      color: #909399;
      font-size: 12px;
    }

    .table-row {
      &:hover {
        background-color: #f5f7fa;
      }
    }

    .col {
      flex: 1;
      padding: 0 8px;
      font-size: 14px;
      color: #606266;

      &.col-no {
        flex: 0 0 140px;
      }

      &.col-customer {
        flex: 0 0 120px;
      }

      &.col-amount {
        flex: 0 0 120px;
        text-align: right;
      }

      &.col-status {
        flex: 0 0 100px;
      }

      &.col-date {
        flex: 0 0 120px;
      }

      &.col-action {
        flex: 0 0 80px;
        text-align: center;
      }
    }

    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      font-size: 12px;
      border-radius: 4px;

      &.status-pending {
        background-color: #fffbeb;
        color: #f59e0b;
      }

      &.status-approved {
        background-color: #f0fdf4;
        color: #22c55e;
      }

      &.status-rejected {
        background-color: #fef2f2;
        color: #ef4444;
      }

      &.status-completed {
        background-color: #eef2ff;
        color: #6366f1;
      }
    }

    .action-link {
      color: #2563eb;
      cursor: pointer;

      &:hover {
        color: #1d4ed8;
      }
    }
  }
}

.quick-actions {
  .section-title {
    font-size: 18px;
    font-weight: 600;
    color: #303133;
    margin-bottom: 20px;
    display: block;
  }

  .action-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 16px;

    .action-item {
      background-color: #fff;
      border-radius: 8px;
      padding: 24px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      display: flex;
      flex-direction: column;
      align-items: center;
      cursor: pointer;
      transition: all 0.3s;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
      }

      .action-icon {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        margin-bottom: 12px;
      }

      .action-label {
        font-size: 14px;
        color: #606266;
      }
    }
  }
}

/* 响应式布局 */
@media (max-width: 768px) {
  .stat-cards {
    grid-template-columns: 1fr;
  }

  .chart-section .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .quote-table {
    overflow-x: auto;

    .table-header,
    .table-row {
      min-width: 600px;
    }
  }

  .action-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>