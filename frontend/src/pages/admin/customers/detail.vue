<template>
  <div class="customer-detail-page">
    <!-- Loading state -->
    <div v-if="loading" class="loading-container">
      <span class="loading-text">加载中...</span>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="error-container">
      <span class="error-text">{{ error }}</span>
      <button class="retry-btn" @click="loadCustomer">重试</button>
    </div>

    <!-- Customer details -->
    <div v-else-if="customer" class="customer-content">
      <!-- Header -->
      <div class="detail-header">
        <div class="header-info">
          <span class="customer-name">{{ customersStore.getCustomerDisplayName(customer) }}</span>
          <div class="customer-badges">
            <div :class="['type-badge', `type-${customer.customer_type}`]">
              <span>{{ getCustomerTypeLabel(customer.customer_type) }}</span>
            </div>
            <div :class="['status-badge', `status-${customer.status}`]">
              <span>{{ getStatusLabel(customer.status) }}</span>
            </div>
            <div :class="['source-badge', `source-${customer.source}`]">
              <span>{{ getSourceLabel(customer.source) }}</span>
            </div>
          </div>
        </div>
        <div class="header-actions">
          <button class="action-btn action-edit" @click="handleEdit">编辑客户</button>
          <button class="action-btn action-quote" @click="handleCreateQuote">新建报价</button>
          <button class="action-btn action-contact" @click="handleAddContact">记录联系</button>
        </div>
      </div>

      <!-- Basic Information -->
      <div class="detail-section">
        <span class="section-title">基本信息</span>
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">客户姓名</span>
            <span class="info-value">{{ customer.name }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">联系电话</span>
            <span class="info-value">{{ customer.phone }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">电子邮箱</span>
            <span class="info-value">{{ customer.email || '-' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">微信号</span>
            <span class="info-value">{{ customer.wechat_id || '-' }}</span>
          </div>
          <div class="info-item" v-if="customer.customer_type === 'business'">
            <span class="info-label">公司名称</span>
            <span class="info-value">{{ customer.company || '-' }}</span>
          </div>
          <div class="info-item" v-if="customer.customer_type === 'business'">
            <span class="info-label">营业执照</span>
            <span class="info-value">{{ customer.business_license || '-' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">所在城市</span>
            <span class="info-value">{{ customer.city || '-' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">所在区域</span>
            <span class="info-value">{{ customer.district || '-' }}</span>
          </div>
          <div class="info-item full-width">
            <span class="info-label">详细地址</span>
            <span class="info-value">{{ customer.address || '-' }}</span>
          </div>
        </div>
      </div>

      <!-- Business Statistics -->
      <div class="detail-section">
        <span class="section-title">业务统计</span>
        <div class="stats-grid">
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
        </div>
      </div>

      <!-- Contact Preferences -->
      <div class="detail-section" v-if="customer.preferred_contact_method">
        <span class="section-title">联系偏好</span>
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">偏好联系方式</span>
            <span class="info-value">{{
              getContactMethodLabel(customer.preferred_contact_method)
            }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">联系时间偏好</span>
            <span class="info-value">{{ customer.contact_time_preference || '-' }}</span>
          </div>
        </div>
      </div>

      <!-- Notes -->
      <div class="detail-section" v-if="customer.notes">
        <span class="section-title">备注信息</span>
        <span class="notes-content">{{ customer.notes }}</span>
      </div>

      <!-- Quote History -->
      <div class="detail-section">
        <div class="section-header">
          <span class="section-title">报价历史</span>
          <span class="section-count">({{ customer.quotes?.length || 0 }})</span>
        </div>

        <div v-if="customer.quotes && customer.quotes.length > 0" class="quotes-list">
          <div
            v-for="quote in customer.quotes"
            :key="quote.id"
            class="quote-item"
            @click="handleViewQuote(quote)"
          >
            <div class="quote-main">
              <span class="quote-number">{{ quote.quote_number }}</span>
              <span class="quote-amount">¥{{ formatAmount(quote.total_amount) }}</span>
            </div>
            <div class="quote-details">
              <span class="quote-items">{{ quote.items_count }} 个产品</span>
              <span class="quote-date">{{ formatDate(quote.created_at) }}</span>
            </div>
            <div :class="['quote-status', `status-${quote.status}`]">
              <span>{{ getQuoteStatusLabel(quote.status) }}</span>
            </div>
          </div>
        </div>

        <div v-else class="empty-state">
          <span class="empty-text">暂无报价记录</span>
          <button class="empty-action" @click="handleCreateQuote">创建第一个报价</button>
        </div>
      </div>

      <!-- Recent Activities -->
      <div class="detail-section">
        <div class="section-header">
          <span class="section-title">最近活动</span>
          <span class="section-count">({{ customer.recent_activities?.length || 0 }})</span>
        </div>

        <div
          v-if="customer.recent_activities && customer.recent_activities.length > 0"
          class="activities-list"
        >
          <div
            v-for="activity in customer.recent_activities"
            :key="activity.id"
            class="activity-item"
          >
            <div class="activity-icon">
              <span>{{ getActivityIcon(activity.type) }}</span>
            </div>
            <div class="activity-content">
              <span class="activity-description">{{ activity.description }}</span>
              <span class="activity-date">{{ formatDateTime(activity.created_at) }}</span>
              <span v-if="activity.created_by" class="activity-user">
                操作人: {{ activity.created_by || '系统' }}
              </span>
            </div>
          </div>
        </div>

        <div v-else class="empty-state">
          <span class="empty-text">暂无活动记录</span>
        </div>
      </div>

      <!-- Timeline -->
      <div class="detail-section">
        <span class="section-title">客户时间线</span>
        <div class="timeline">
          <div class="timeline-item">
            <div class="timeline-dot"></div>
            <div class="timeline-content">
              <span class="timeline-title">客户创建</span>
              <span class="timeline-date">{{ formatDateTime(customer.created_at) }}</span>
              <span class="timeline-user">创建人: {{ customer.created_by_name || '系统' }}</span>
            </div>
          </div>

          <div v-if="customer.updated_at !== customer.created_at" class="timeline-item">
            <div class="timeline-dot timeline-dot-info"></div>
            <div class="timeline-content">
              <span class="timeline-title">信息更新</span>
              <span class="timeline-date">{{ formatDateTime(customer.updated_at) }}</span>
              <span class="timeline-user">更新人: {{ customer.updated_by_name || '系统' }}</span>
            </div>
          </div>

          <div v-if="customer.last_quote_at" class="timeline-item">
            <div class="timeline-dot timeline-dot-success"></div>
            <div class="timeline-content">
              <span class="timeline-title">最后报价</span>
              <span class="timeline-date">{{ formatDateTime(customer.last_quote_at) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Contact Activity Modal -->
    <div v-if="showContactModal" class="modal-overlay" @click.self="cancelAddContact">
      <div class="modal-content">
        <div class="modal-header">
          <h3>记录联系活动</h3>
          <button class="modal-close" @click="cancelAddContact">&times;</button>
        </div>
        <div class="contact-form">
        <div class="form-item">
          <span class="form-label">活动类型</span>
          <select v-model="contactTypeIndex" class="form-select" @change="handleContactTypeChange">
            <option v-for="(option, index) in contactTypeOptions" :key="index" :value="index">
              {{ option.label }}
            </option>
          </select>
        </div>

        <div class="form-item">
          <span class="form-label">活动描述</span>
          <textarea
            v-model="contactDescription"
            class="form-textarea"
            placeholder="请输入联系内容和结果..."
            maxlength="500"
          />
        </div>

        <div class="form-item">
          <span class="form-label">联系时间</span>
          <input 
            type="date" 
            v-model="contactDate" 
            class="form-input" 
            @change="handleContactDateChange"
          />
        </div>
        </div>
        <div class="modal-footer">
          <button class="modal-btn modal-cancel" @click="cancelAddContact">取消</button>
          <button class="modal-btn modal-confirm" @click="confirmAddContact">确认</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
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
  router.push(`/admin/customers/edit?id=${customer.value.id}`)
}

function handleCreateQuote() {
  if (!customer.value) return
  router.push(`/admin/quotes/edit?customer_id=${customer.value.id}`)
}

function handleViewQuote(quote: CustomerQuoteSummary) {
  router.push(`/admin/quotes/detail?id=${quote.id}`)
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
    console.log('请填写活动描述')
    alert('请填写活动描述')
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

    console.log('活动记录成功')
    alert('活动记录成功')

    showContactModal.value = false
    // Reload customer to get updated activities
    loadCustomer()
  } catch (error) {
    console.error('记录活动失败:', error)
    alert('记录活动失败')
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
  background-color: $bg-color;
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
      color: $text-color-secondary;
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
          color: $text-color;
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
            color: $text-color;
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
        color: $text-color;
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
          color: $text-color-secondary;
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
            color: $text-color-secondary;
            font-weight: 500;
          }

          .info-value {
            font-size: 15px;
            color: $text-color;
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
        color: $text-color;
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
              color: $text-color;
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
              color: $text-color-secondary;
            }

            .quote-date {
              font-size: 12px;
              color: $text-color-secondary;
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
              color: $text-color;
              line-height: 1.5;
            }

            .activity-date {
              font-size: 12px;
              color: $text-color-secondary;
            }

            .activity-user {
              font-size: 12px;
              color: $text-color-secondary;
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
              color: $text-color;
            }

            .timeline-date {
              font-size: 14px;
              color: $text-color-secondary;
            }

            .timeline-user {
              font-size: 13px;
              color: $text-color-secondary;
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
          color: $text-color-secondary;
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

  // Modal styles
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }

  .modal-content {
    background: white;
    border-radius: 8px;
    padding: 0;
    max-width: 500px;
    width: 90%;
    max-height: 90vh;
    overflow-y: auto;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px;
    border-bottom: 1px solid $border-color;

    h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: $text-color;
    }

    .modal-close {
      background: none;
      border: none;
      font-size: 24px;
      color: $text-color-secondary;
      cursor: pointer;
      padding: 0;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;

      &:hover {
        color: $text-color;
      }
    }
  }

  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding: 20px 24px;
    border-top: 1px solid $border-color;

    .modal-btn {
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.3s ease;

      &.modal-cancel {
        background: white;
        color: $text-color-secondary;
        border: 1px solid $border-color;

        &:hover {
          background: #f5f5f5;
        }
      }

      &.modal-confirm {
        background: $primary-color;
        color: white;
        border: 1px solid $primary-color;

        &:hover {
          background: darken($primary-color, 10%);
        }
      }
    }
  }

  // Contact form styles
  .contact-form {
    padding: 20px 24px;
    .form-item {
      margin-bottom: 20px;

      .form-label {
        display: block;
        margin-bottom: 8px;
        font-size: 14px;
        color: $text-color;
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
          color: $text-color-secondary;
        }
      }

      .form-select {
        width: 100%;
        padding: 12px;
        border: 1px solid $border-color;
        border-radius: 6px;
        font-size: 14px;
        background: white;
        cursor: pointer;

        &:focus {
          border-color: $primary-color;
          outline: none;
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
