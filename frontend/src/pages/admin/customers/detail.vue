<template>
  <view class="customer-detail-page">
    <!-- Loading state -->
    <view v-if="loading" class="loading-container">
      <text class="loading-text">加载中...</text>
    </view>

    <!-- Error state -->
    <view v-else-if="error" class="error-container">
      <text class="error-text">{{ error }}</text>
      <button class="retry-btn" @click="loadCustomer">重试</button>
    </view>

    <!-- Customer details -->
    <view v-else-if="customer" class="customer-content">
      <!-- Header -->
      <view class="detail-header">
        <view class="header-info">
          <text class="customer-name">{{ customersStore.getCustomerDisplayName(customer) }}</text>
          <view class="customer-badges">
            <view :class="['type-badge', `type-${customer.customer_type}`]">
              <text>{{ getCustomerTypeLabel(customer.customer_type) }}</text>
            </view>
            <view :class="['status-badge', `status-${customer.status}`]">
              <text>{{ getStatusLabel(customer.status) }}</text>
            </view>
            <view :class="['source-badge', `source-${customer.source}`]">
              <text>{{ getSourceLabel(customer.source) }}</text>
            </view>
          </view>
        </view>
        <view class="header-actions">
          <button class="action-btn action-edit" @click="handleEdit">编辑客户</button>
          <button class="action-btn action-quote" @click="handleCreateQuote">新建报价</button>
          <button class="action-btn action-contact" @click="handleAddContact">记录联系</button>
        </view>
      </view>

      <!-- Basic Information -->
      <view class="detail-section">
        <text class="section-title">基本信息</text>
        <view class="info-grid">
          <view class="info-item">
            <text class="info-label">客户姓名</text>
            <text class="info-value">{{ customer.name }}</text>
          </view>
          <view class="info-item">
            <text class="info-label">联系电话</text>
            <text class="info-value">{{ customer.phone }}</text>
          </view>
          <view class="info-item">
            <text class="info-label">电子邮箱</text>
            <text class="info-value">{{ customer.email || '-' }}</text>
          </view>
          <view class="info-item">
            <text class="info-label">微信号</text>
            <text class="info-value">{{ customer.wechat_id || '-' }}</text>
          </view>
          <view class="info-item" v-if="customer.customer_type === 'business'">
            <text class="info-label">公司名称</text>
            <text class="info-value">{{ customer.company || '-' }}</text>
          </view>
          <view class="info-item" v-if="customer.customer_type === 'business'">
            <text class="info-label">营业执照</text>
            <text class="info-value">{{ customer.business_license || '-' }}</text>
          </view>
          <view class="info-item">
            <text class="info-label">所在城市</text>
            <text class="info-value">{{ customer.city || '-' }}</text>
          </view>
          <view class="info-item">
            <text class="info-label">所在区域</text>
            <text class="info-value">{{ customer.district || '-' }}</text>
          </view>
          <view class="info-item full-width">
            <text class="info-label">详细地址</text>
            <text class="info-value">{{ customer.address || '-' }}</text>
          </view>
        </view>
      </view>

      <!-- Business Statistics -->
      <view class="detail-section">
        <text class="section-title">业务统计</text>
        <view class="stats-grid">
          <StatCard
            title="总报价数"
            :value="customer.total_quotes || 0"
            icon="📄"
            theme="primary"
          />
          <StatCard
            title="成交金额"
            :value="formatAmount(customer.total_amount || 0)"
            icon="💰"
            theme="success"
          />
          <StatCard
            title="最后报价"
            :value="customer.last_quote_at ? formatDate(customer.last_quote_at) : '无记录'"
            icon="📅"
            theme="info"
          />
          <StatCard
            title="客户来源"
            :value="getSourceLabel(customer.source)"
            icon="📍"
            theme="default"
          />
        </view>
      </view>

      <!-- Contact Preferences -->
      <view class="detail-section" v-if="customer.preferred_contact_method">
        <text class="section-title">联系偏好</text>
        <view class="info-grid">
          <view class="info-item">
            <text class="info-label">偏好联系方式</text>
            <text class="info-value">{{
              getContactMethodLabel(customer.preferred_contact_method)
            }}</text>
          </view>
          <view class="info-item">
            <text class="info-label">联系时间偏好</text>
            <text class="info-value">{{ customer.contact_time_preference || '-' }}</text>
          </view>
        </view>
      </view>

      <!-- Notes -->
      <view class="detail-section" v-if="customer.notes">
        <text class="section-title">备注信息</text>
        <text class="notes-content">{{ customer.notes }}</text>
      </view>

      <!-- Quote History -->
      <view class="detail-section">
        <view class="section-header">
          <text class="section-title">报价历史</text>
          <text class="section-count">({{ customer.quotes?.length || 0 }})</text>
        </view>

        <view v-if="customer.quotes && customer.quotes.length > 0" class="quotes-list">
          <view
            v-for="quote in customer.quotes"
            :key="quote.id"
            class="quote-item"
            @click="handleViewQuote(quote)"
          >
            <view class="quote-main">
              <text class="quote-number">{{ quote.quote_number }}</text>
              <text class="quote-amount">¥{{ formatAmount(quote.total_amount) }}</text>
            </view>
            <view class="quote-details">
              <text class="quote-items">{{ quote.items_count }} 个产品</text>
              <text class="quote-date">{{ formatDate(quote.created_at) }}</text>
            </view>
            <view :class="['quote-status', `status-${quote.status}`]">
              <text>{{ getQuoteStatusLabel(quote.status) }}</text>
            </view>
          </view>
        </view>

        <view v-else class="empty-state">
          <text class="empty-text">暂无报价记录</text>
          <button class="empty-action" @click="handleCreateQuote">创建第一个报价</button>
        </view>
      </view>

      <!-- Recent Activities -->
      <view class="detail-section">
        <view class="section-header">
          <text class="section-title">最近活动</text>
          <text class="section-count">({{ customer.recent_activities?.length || 0 }})</text>
        </view>

        <view
          v-if="customer.recent_activities && customer.recent_activities.length > 0"
          class="activities-list"
        >
          <view
            v-for="activity in customer.recent_activities"
            :key="activity.id"
            class="activity-item"
          >
            <view class="activity-icon">
              <text>{{ getActivityIcon(activity.type) }}</text>
            </view>
            <view class="activity-content">
              <text class="activity-description">{{ activity.description }}</text>
              <text class="activity-date">{{ formatDateTime(activity.created_at) }}</text>
              <text v-if="activity.created_by" class="activity-user">
                操作人: {{ activity.created_by || '系统' }}
              </text>
            </view>
          </view>
        </view>

        <view v-else class="empty-state">
          <text class="empty-text">暂无活动记录</text>
        </view>
      </view>

      <!-- Timeline -->
      <view class="detail-section">
        <text class="section-title">客户时间线</text>
        <view class="timeline">
          <view class="timeline-item">
            <view class="timeline-dot"></view>
            <view class="timeline-content">
              <text class="timeline-title">客户创建</text>
              <text class="timeline-date">{{ formatDateTime(customer.created_at) }}</text>
              <text class="timeline-user">创建人: {{ customer.created_by_name || '系统' }}</text>
            </view>
          </view>

          <view v-if="customer.updated_at !== customer.created_at" class="timeline-item">
            <view class="timeline-dot timeline-dot-info"></view>
            <view class="timeline-content">
              <text class="timeline-title">信息更新</text>
              <text class="timeline-date">{{ formatDateTime(customer.updated_at) }}</text>
              <text class="timeline-user">更新人: {{ customer.updated_by_name || '系统' }}</text>
            </view>
          </view>

          <view v-if="customer.last_quote_at" class="timeline-item">
            <view class="timeline-dot timeline-dot-success"></view>
            <view class="timeline-content">
              <text class="timeline-title">最后报价</text>
              <text class="timeline-date">{{ formatDateTime(customer.last_quote_at) }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- Add Contact Activity Modal -->
    <modal
      v-model:visible="showContactModal"
      title="记录联系活动"
      @confirm="confirmAddContact"
      @cancel="cancelAddContact"
    >
      <view class="contact-form">
        <view class="form-item">
          <text class="form-label">活动类型</text>
          <picker
            mode="selector"
            :range="contactTypeOptions"
            :range-key="'label'"
            :value="contactTypeIndex"
            @change="handleContactTypeChange"
          >
            <view class="form-picker">
              <text>{{ contactTypeOptions[contactTypeIndex].label }}</text>
              <text class="picker-arrow">▼</text>
            </view>
          </picker>
        </view>

        <view class="form-item">
          <text class="form-label">活动描述</text>
          <textarea
            v-model="contactDescription"
            class="form-textarea"
            placeholder="请输入联系内容和结果..."
            maxlength="500"
          />
        </view>

        <view class="form-item">
          <text class="form-label">联系时间</text>
          <picker mode="date" :value="contactDate" @change="handleContactDateChange">
            <view class="form-picker">
              <text>{{ contactDate || '选择日期' }}</text>
              <text class="picker-arrow">▼</text>
            </view>
          </picker>
        </view>
      </view>
    </modal>
  </view>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from '@dcloudio/uni-app'
import { useCustomersStore } from '@/stores/customers'
import type { CustomerActivity, CustomerDetail, CustomerQuoteSummary } from '@/types/customer'
import StatCard from '@/components/admin/StatCard.vue'

const route = useRoute()
const router = useRouter()
const customersStore = useCustomersStore()

// State
const customer = ref<CustomerDetail | null>(null)
const loading = ref(false)
const error = ref('')
const showContactModal = ref(false)

// Contact activity form
const contactTypeIndex = ref(0)
const contactDescription = ref('')
const contactDate = ref('')

const contactTypeOptions = [
  { value: 'contact_made', label: '电话联系' },
  { value: 'quote_created', label: '报价沟通' },
  { value: 'customer_updated', label: '信息更新' }
]

// Load customer on mount
onMounted(() => {
  const id = route.query.id as string
  if (id) {
    loadCustomer(id)
  } else {
    error.value = '客户ID不存在'
  }
})

// Load customer details
async function loadCustomer(id?: string) {
  const customerId = id || (route.query.id as string)
  if (!customerId) {
    error.value = '客户ID不存在'
    return
  }

  loading.value = true
  error.value = ''

  try {
    const data = await customersStore.fetchCustomerById(customerId, true, true)
    customer.value = data
  } catch (err) {
    error.value = '加载客户信息失败，请重试'
    console.error('Failed to load customer:', err)
  } finally {
    loading.value = false
  }
}

// Handle actions
function handleEdit() {
  if (!customer.value) return
  uni.navigateTo({
    url: `/pages/admin/customers/edit?id=${customer.value.id}`
  })
}

function handleCreateQuote() {
  if (!customer.value) return
  uni.navigateTo({
    url: `/pages/admin/quotes/edit?customer_id=${customer.value.id}`
  })
}

function handleViewQuote(quote: CustomerQuoteSummary) {
  uni.navigateTo({
    url: `/pages/admin/quotes/detail?id=${quote.id}`
  })
}

function handleAddContact() {
  contactTypeIndex.value = 0
  contactDescription.value = ''
  contactDate.value = new Date().toISOString().split('T')[0]
  showContactModal.value = true
}

function handleContactTypeChange(e: any) {
  contactTypeIndex.value = e.detail.value
}

function handleContactDateChange(e: any) {
  contactDate.value = e.detail.value
}

async function confirmAddContact() {
  if (!customer.value || !contactDescription.value) {
    uni.showToast({
      title: '请填写活动描述',
      icon: 'none'
    })
    return
  }

  try {
    const activityType = contactTypeOptions[contactTypeIndex.value]
      .value as CustomerActivity['type']
    await customersStore.addCustomerActivity(customer.value.id, {
      type: activityType,
      description: contactDescription.value,
      metadata: {
        contact_date: contactDate.value
      }
    })

    uni.showToast({
      title: '活动记录成功',
      icon: 'success'
    })

    showContactModal.value = false
    // Reload customer to get updated activities
    loadCustomer()
  } catch (error) {
    uni.showToast({
      title: '记录活动失败',
      icon: 'none'
    })
  }
}

function cancelAddContact() {
  showContactModal.value = false
}

// Utility functions
function formatAmount(amount: number): string {
  return amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

function formatDate(date: string): string {
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatDateTime(date: string): string {
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function getCustomerTypeLabel(type: string): string {
  const typeMap: Record<string, string> = {
    individual: '个人客户',
    business: '企业客户'
  }
  return typeMap[type] || type
}

function getStatusLabel(status: string): string {
  const statusMap: Record<string, string> = {
    active: '活跃',
    inactive: '停用',
    potential: '潜在客户',
    blacklist: '黑名单'
  }
  return statusMap[status] || status
}

function getSourceLabel(source: string): string {
  const sourceMap: Record<string, string> = {
    walk_in: '到店咨询',
    referral: '朋友推荐',
    online: '网络咨询',
    phone: '电话咨询',
    exhibition: '展会',
    other: '其他'
  }
  return sourceMap[source] || source
}

function getContactMethodLabel(method: string): string {
  const methodMap: Record<string, string> = {
    phone: '电话',
    wechat: '微信',
    email: '邮件'
  }
  return methodMap[method] || method
}

function getQuoteStatusLabel(status: string): string {
  const statusMap: Record<string, string> = {
    draft: '草稿',
    submitted: '待审批',
    approved: '已批准',
    rejected: '已拒绝'
  }
  return statusMap[status] || status
}

function getActivityIcon(type: string): string {
  const iconMap: Record<string, string> = {
    quote_created: '📝',
    quote_approved: '✅',
    quote_rejected: '❌',
    customer_updated: '✏️',
    contact_made: '📞'
  }
  return iconMap[type] || '📋'
}
</script>

<style lang="scss">
@import '@/styles/variables.scss';

.customer-detail-page {
  min-height: 100vh;
  background-color: $background-color;
  padding: 20px;

  .loading-container,
  .error-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 400px;
    gap: 16px;

    .loading-text {
      font-size: 16px;
      color: $text-secondary;
    }

    .error-text {
      font-size: 16px;
      color: $danger-color;
    }

    .retry-btn {
      padding: 10px 20px;
      background: $primary-color;
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      cursor: pointer;
    }
  }

  .customer-content {
    max-width: 1200px;
    margin: 0 auto;

    .detail-header {
      background: white;
      padding: 24px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      flex-wrap: wrap;
      gap: 16px;

      .header-info {
        .customer-name {
          font-size: 24px;
          font-weight: 600;
          color: $text-primary;
          margin-bottom: 12px;
          display: block;
        }

        .customer-badges {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;

          .type-badge,
          .status-badge,
          .source-badge {
            display: inline-flex;
            padding: 4px 12px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 500;
          }

          .type-badge {
            &.type-individual {
              background: #e3f2fd;
              color: #1565c0;
            }

            &.type-business {
              background: #f3e5f5;
              color: #7b1fa2;
            }
          }

          .status-badge {
            &.status-active {
              background: #d4edda;
              color: #155724;
            }

            &.status-inactive {
              background: #f8d7da;
              color: #721c24;
            }

            &.status-potential {
              background: #fff3cd;
              color: #856404;
            }

            &.status-blacklist {
              background: #f0f0f0;
              color: #666;
            }
          }

          .source-badge {
            background: #f8f9fa;
            color: #495057;
          }
        }
      }

      .header-actions {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;

        .action-btn {
          padding: 10px 20px;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;

          &.action-edit {
            background: $primary-color;
            color: white;

            &:hover {
              background: darken($primary-color, 10%);
            }
          }

          &.action-quote {
            background: $success-color;
            color: white;

            &:hover {
              background: darken($success-color, 10%);
            }
          }

          &.action-contact {
            background: white;
            color: $text-primary;
            border: 1px solid $border-color;

            &:hover {
              background: #f5f5f5;
            }
          }
        }
      }
    }

    .detail-section {
      background: white;
      padding: 24px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      margin-bottom: 20px;

      .section-title {
        font-size: 18px;
        font-weight: 600;
        color: $text-primary;
        margin-bottom: 20px;
        display: block;
      }

      .section-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 20px;

        .section-title {
          margin-bottom: 0;
        }

        .section-count {
          font-size: 14px;
          color: $text-secondary;
        }
      }

      .info-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 20px;

        .info-item {
          display: flex;
          flex-direction: column;
          gap: 8px;

          &.full-width {
            grid-column: 1 / -1;
          }

          .info-label {
            font-size: 13px;
            color: $text-secondary;
            font-weight: 500;
          }

          .info-value {
            font-size: 15px;
            color: $text-primary;
          }
        }
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 20px;
      }

      .notes-content {
        font-size: 14px;
        line-height: 1.6;
        color: $text-primary;
        white-space: pre-wrap;
      }

      .quotes-list {
        display: flex;
        flex-direction: column;
        gap: 16px;

        .quote-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          border: 1px solid $border-color;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;

          &:hover {
            border-color: $primary-color;
            box-shadow: 0 2px 8px rgba(0, 123, 255, 0.15);
          }

          .quote-main {
            display: flex;
            flex-direction: column;
            gap: 4px;

            .quote-number {
              font-weight: 500;
              color: $text-primary;
            }

            .quote-amount {
              font-size: 16px;
              font-weight: 600;
              color: $primary-color;
            }
          }

          .quote-details {
            display: flex;
            flex-direction: column;
            gap: 4px;
            align-items: center;

            .quote-items {
              font-size: 13px;
              color: $text-secondary;
            }

            .quote-date {
              font-size: 12px;
              color: $text-secondary;
            }
          }

          .quote-status {
            display: inline-flex;
            padding: 4px 12px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 500;

            &.status-draft {
              background: #f0f0f0;
              color: #666;
            }

            &.status-submitted {
              background: #fff3cd;
              color: #856404;
            }

            &.status-approved {
              background: #d4edda;
              color: #155724;
            }

            &.status-rejected {
              background: #f8d7da;
              color: #721c24;
            }
          }
        }
      }

      .activities-list {
        display: flex;
        flex-direction: column;
        gap: 16px;

        .activity-item {
          display: flex;
          gap: 12px;
          padding: 12px 0;
          border-bottom: 1px solid #f0f0f0;

          &:last-child {
            border-bottom: none;
          }

          .activity-icon {
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f8f9fa;
            border-radius: 50%;
            font-size: 16px;
            flex-shrink: 0;
          }

          .activity-content {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 4px;

            .activity-description {
              font-size: 14px;
              color: $text-primary;
              line-height: 1.5;
            }

            .activity-date {
              font-size: 12px;
              color: $text-secondary;
            }

            .activity-user {
              font-size: 12px;
              color: $text-secondary;
            }
          }
        }
      }

      .timeline {
        position: relative;
        padding-left: 30px;

        &::before {
          content: '';
          position: absolute;
          left: 8px;
          top: 8px;
          bottom: 8px;
          width: 2px;
          background: $border-color;
        }

        .timeline-item {
          position: relative;
          margin-bottom: 24px;

          &:last-child {
            margin-bottom: 0;
          }

          .timeline-dot {
            position: absolute;
            left: -26px;
            top: 4px;
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: white;
            border: 3px solid $primary-color;

            &.timeline-dot-info {
              border-color: #17a2b8;
            }

            &.timeline-dot-success {
              border-color: $success-color;
            }
          }

          .timeline-content {
            display: flex;
            flex-direction: column;
            gap: 4px;

            .timeline-title {
              font-weight: 500;
              color: $text-primary;
            }

            .timeline-date {
              font-size: 14px;
              color: $text-secondary;
            }

            .timeline-user {
              font-size: 13px;
              color: $text-secondary;
            }
          }
        }
      }

      .empty-state {
        text-align: center;
        padding: 40px 20px;

        .empty-text {
          display: block;
          margin-bottom: 16px;
          font-size: 14px;
          color: $text-secondary;
        }

        .empty-action {
          padding: 8px 16px;
          background: $primary-color;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          cursor: pointer;
        }
      }
    }
  }

  // Contact form styles
  .contact-form {
    .form-item {
      margin-bottom: 20px;

      .form-label {
        display: block;
        margin-bottom: 8px;
        font-size: 14px;
        color: $text-primary;
        font-weight: 500;
      }

      .form-textarea {
        width: 100%;
        min-height: 100px;
        padding: 12px;
        border: 1px solid $border-color;
        border-radius: 6px;
        font-size: 14px;
        resize: vertical;

        &:focus {
          border-color: $primary-color;
          outline: none;
        }
      }

      .form-picker {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px;
        border: 1px solid $border-color;
        border-radius: 6px;
        font-size: 14px;
        cursor: pointer;

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
}

// Responsive design
@media (max-width: 768px) {
  .customer-detail-page {
    padding: 16px;

    .customer-content {
      .detail-header {
        flex-direction: column;
        align-items: flex-start;

        .header-actions {
          width: 100%;

          .action-btn {
            flex: 1;
            justify-content: center;
          }
        }
      }

      .detail-section {
        padding: 16px;

        .stats-grid {
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        }

        .info-grid {
          grid-template-columns: 1fr;
        }

        .quotes-list {
          .quote-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;

            .quote-details {
              align-items: flex-start;
            }
          }
        }
      }
    }
  }
}
</style>
