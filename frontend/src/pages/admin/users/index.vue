<template>
  <div class="users-page">
    <!-- Header -->
    <div class="page-header">
      <div class="header-content">
        <span class="page-title">用户管理</span>
        <div class="header-stats">
          <span class="stat-item">
            <span class="stat-value">{{ usersStore.totalCount }}</span>
            <span class="stat-label">总用户</span>
          </span>
          <span class="stat-item">
            <span class="stat-value">{{ usersStore.statistics.active }}</span>
            <span class="stat-label">活跃用户</span>
          </span>
          <span class="stat-item">
            <span class="stat-value">{{
              usersStore.statistics.admin + usersStore.statistics.sales_manager
            }}</span>
            <span class="stat-label">管理员</span>
          </span>
        </div>
      </div>
      <div class="header-actions">
        <button class="action-btn add-btn" @click="handleAddUser">
          <span class="btn-icon">+</span>
          添加用户
        </button>
        <button class="action-btn invite-btn" @click="handleInviteUser">
          <span class="btn-icon">📧</span>
          邀请用户
        </button>
        <button class="action-btn export-btn" @click="handleExport" :loading="exporting">
          <span class="btn-icon">📊</span>
          导出数据
        </button>
      </div>
    </div>

    <!-- Filters -->
    <div class="filters-section">
      <div class="filters-row">
        <div class="filter-item">
          <input
            v-model="searchQuery"
            class="search-input"
            placeholder="搜索姓名、邮箱或手机号"
            @input="debounceSearch"
          />
        </div>
        <div class="filter-item">
          <div class="filter-picker" @click="showRoleSelect = !showRoleSelect">
            <span>{{ roleOptions[roleIndex].label }}</span>
            <span class="picker-arrow">▼</span>
          </div>
          <div v-if="showRoleSelect" class="picker-options">
            <div 
              v-for="(option, index) in roleOptions" 
              :key="index"
              class="picker-option"
              @click="selectRole(option, index)"
            >
              {{ option.label }}
            </div>
          </div>
        </div>
        <div class="filter-item">
          <div class="filter-picker" @click="showStatusSelect = !showStatusSelect">
            <span>{{ statusOptions[statusIndex].label }}</span>
            <span class="picker-arrow">▼</span>
          </div>
          <div v-if="showStatusSelect" class="picker-options">
            <div 
              v-for="(option, index) in statusOptions" 
              :key="index"
              class="picker-option"
              @click="selectStatus(option, index)"
            >
              {{ option.label }}
            </div>
          </div>
        </div>
        <div class="filter-item">
          <input
            v-model="departmentFilter"
            class="search-input"
            placeholder="部门筛选"
            @input="debounceSearch"
          />
        </div>
        <button class="filter-reset" @click="resetFilters">重置</button>
      </div>
    </div>

    <!-- Data Table -->
    <DataTable
      :columns="columns"
      :data="usersStore.users"
      :loading="usersStore.loading"
      :total="usersStore.totalCount"
      :page-size="pageSize"
      :current-page="currentPage"
      row-key="id"
      @page-change="handlePageChange"
      @sort-change="handleSortChange"
    >
      <template #user="{ row }">
        <div class="user-cell">
          <div class="user-avatar">
            <img v-if="row.avatar" :src="row.avatar" class="avatar-img" />
            <span v-else class="avatar-placeholder">
              {{ row.name.charAt(0).toUpperCase() }}
            </span>
          </div>
          <div class="user-info">
            <span class="user-name">{{ row.name }}</span>
            <span class="user-email">{{ row.email }}</span>
            <span v-if="row.phone" class="user-phone">{{ row.phone }}</span>
          </div>
        </div>
      </template>

      <template #role="{ row }">
        <div :class="['role-badge', `role-${row.role}`]">
          <span>{{ getRoleLabel(row.role) }}</span>
        </div>
      </template>

      <template #status="{ row }">
        <div :class="['status-badge', `status-${row.status}`]">
          <span>{{ getStatusLabel(row.status) }}</span>
        </div>
      </template>

      <template #department="{ row }">
        <span class="department-cell">{{ row.department || '-' }}</span>
      </template>

      <template #last_login="{ row }">
        <span class="date-cell">
          {{ row.last_login_at ? formatDate(row.last_login_at) : '从未登录' }}
        </span>
      </template>

      <template #created_at="{ row }">
        <span class="date-cell">{{ formatDate(row.created_at) }}</span>
      </template>

      <template #actions="{ row }">
        <div class="actions-cell">
          <button class="action-btn action-view" @click="handleView(row)">查看</button>
          <button class="action-btn action-edit" @click="handleEdit(row)">编辑</button>
          <button
            v-if="row.status === 'active'"
            class="action-btn action-deactivate"
            @click="handleDeactivate(row)"
          >
            禁用
          </button>
          <button
            v-else-if="row.status === 'inactive'"
            class="action-btn action-activate"
            @click="handleActivate(row)"
          >
            启用
          </button>
          <button class="action-btn action-reset" @click="handleResetPassword(row)">
            重置密码
          </button>
          <button
            v-if="row.role !== 'admin'"
            class="action-btn action-delete"
            @click="handleDelete(row)"
          >
            删除
          </button>
        </div>
      </template>
    </DataTable>

    <!-- Add User Modal -->
    <div v-if="showAddModal" class="modal-overlay" @click.self="cancelAddUser">
      <div class="modal-content">
        <div class="modal-header">
          <h3>添加用户</h3>
          <button class="modal-close" @click="cancelAddUser">&times;</button>
        </div>
        <div class="user-form">
          <div class="form-item">
            <span class="form-label">姓名 *</span>
            <input v-model="newUser.name" class="form-input" placeholder="请输入用户姓名" />
          </div>
          <div class="form-item">
            <span class="form-label">邮箱 *</span>
            <input
              v-model="newUser.email"
              class="form-input"
              placeholder="请输入邮箱地址"
              type="email"
            />
          </div>
          <div class="form-item">
            <span class="form-label">手机号</span>
            <input v-model="newUser.phone" class="form-input" placeholder="请输入手机号" />
          </div>
          <div class="form-item">
            <span class="form-label">角色 *</span>
            <div class="form-picker" @click="showNewUserRoleSelect = !showNewUserRoleSelect">
              <span>{{ roleOptions[newUserRoleIndex + 1]?.label || '请选择角色' }}</span>
              <span class="picker-arrow">▼</span>
            </div>
            <div v-if="showNewUserRoleSelect" class="picker-options">
              <div 
                v-for="(option, index) in roleOptions.slice(1)" 
                :key="index"
                class="picker-option"
                @click="selectNewUserRole(option, index)"
              >
                {{ option.label }}
              </div>
            </div>
          </div>
          <div class="form-item">
            <span class="form-label">部门</span>
            <input v-model="newUser.department" class="form-input" placeholder="请输入部门" />
          </div>
          <div class="form-item">
            <span class="form-label">职位</span>
            <input v-model="newUser.position" class="form-input" placeholder="请输入职位" />
          </div>
          <div class="form-checkbox">
            <input type="checkbox" v-model="newUser.send_invite" />
            <span class="checkbox-label">发送邀请邮件</span>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="cancelAddUser">取消</button>
          <button class="btn btn-primary" @click="confirmAddUser">确认</button>
        </div>
      </div>
    </div>

    <!-- Invite User Modal -->
    <div v-if="showInviteModal" class="modal-overlay" @click.self="cancelInviteUser">
      <div class="modal-content">
        <div class="modal-header">
          <h3>邀请用户</h3>
          <button class="modal-close" @click="cancelInviteUser">&times;</button>
        </div>
        <div class="invite-form">
          <div class="form-item">
            <span class="form-label">邮箱地址 *</span>
            <input
              v-model="inviteEmail"
              class="form-input"
              placeholder="请输入邀请邮箱"
              type="email"
            />
          </div>
          <div class="form-item">
            <span class="form-label">角色 *</span>
            <div class="form-picker" @click="showInviteRoleSelect = !showInviteRoleSelect">
              <span>{{ roleOptions[inviteRoleIndex + 1]?.label || '请选择角色' }}</span>
              <span class="picker-arrow">▼</span>
            </div>
            <div v-if="showInviteRoleSelect" class="picker-options">
              <div 
                v-for="(option, index) in roleOptions.slice(1)" 
                :key="index"
                class="picker-option"
                @click="selectInviteRole(option, index)"
              >
                {{ option.label }}
              </div>
            </div>
          </div>
          <div class="form-note">
            <span>邀请邮件将发送到指定邮箱，用户可通过邮件中的链接完成注册。</span>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="cancelInviteUser">取消</button>
          <button class="btn btn-primary" @click="confirmInviteUser">确认</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUsersStore } from '@/stores/users'
import type { CreateUserData, User } from '@/types/user'
import DataTable from '@/components/admin/DataTable.vue'
import type { TableColumn } from '@/components/admin/DataTable.vue'

const router = useRouter()
const usersStore = useUsersStore()

// Table configuration
const columns: TableColumn[] = [
  {
    key: 'user',
    title: '用户',
    width: '250px'
  },
  {
    key: 'role',
    title: '角色',
    width: '120px',
    align: 'center'
  },
  {
    key: 'status',
    title: '状态',
    width: '100px',
    align: 'center'
  },
  {
    key: 'department',
    title: '部门',
    width: '120px'
  },
  {
    key: 'last_login',
    title: '最后登录',
    width: '150px',
    sortable: true
  },
  {
    key: 'created_at',
    title: '创建时间',
    width: '150px',
    sortable: true
  },
  {
    key: 'actions',
    title: '操作',
    width: '250px',
    align: 'center'
  }
]

// Filter states
const searchQuery = ref('')
const departmentFilter = ref('')
const roleIndex = ref(0)
const statusIndex = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)
const exporting = ref(false)

const roleOptions = [
  { value: '', label: '全部角色' },
  { value: 'admin', label: '系统管理员' },
  { value: 'sales_manager', label: '销售经理' },
  { value: 'sales_rep', label: '销售代表' },
  { value: 'viewer', label: '查看者' }
]

const statusOptions = [
  { value: '', label: '全部状态' },
  { value: 'active', label: '活跃' },
  { value: 'inactive', label: '停用' },
  { value: 'pending', label: '待激活' },
  { value: 'suspended', label: '暂停' }
]

// Modal states
const showAddModal = ref(false)
const showInviteModal = ref(false)

// Custom dropdown states
const showRoleSelect = ref(false)
const showStatusSelect = ref(false)
const showNewUserRoleSelect = ref(false)
const showInviteRoleSelect = ref(false)

// Form states
const newUser = ref<CreateUserData>({
  email: '',
  name: '',
  role: 'viewer',
  phone: '',
  department: '',
  position: '',
  send_invite: true
})

const newUserRoleIndex = ref(3) // Default to viewer
const inviteEmail = ref('')
const inviteRoleIndex = ref(3) // Default to viewer

// Load users on mount
onMounted(() => {
  loadUsers()
})

// Debounced search
let searchTimer: NodeJS.Timeout
const debounceSearch = () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    currentPage.value = 1
    loadUsers()
  }, 500)
}

// Load users with filters
async function loadUsers() {
  const filters: any = {
    page: currentPage.value,
    pageSize: pageSize.value
  }

  if (searchQuery.value) {
    filters.search = searchQuery.value
  }

  if (departmentFilter.value) {
    filters.department = departmentFilter.value
  }

  const selectedRole = roleOptions[roleIndex.value].value
  if (selectedRole) {
    filters.role = selectedRole
  }

  const selectedStatus = statusOptions[statusIndex.value].value
  if (selectedStatus) {
    filters.status = selectedStatus
  }

  await usersStore.fetchUsers(filters)
}

// Handle filter changes
function selectRole(option: any, index: number) {
  roleIndex.value = index
  showRoleSelect.value = false
  currentPage.value = 1
  loadUsers()
}

function selectStatus(option: any, index: number) {
  statusIndex.value = index
  showStatusSelect.value = false
  currentPage.value = 1
  loadUsers()
}

function selectNewUserRole(option: any, index: number) {
  newUserRoleIndex.value = index
  newUser.value.role = option.value as any
  showNewUserRoleSelect.value = false
}

function selectInviteRole(option: any, index: number) {
  inviteRoleIndex.value = index
  showInviteRoleSelect.value = false
}

function resetFilters() {
  searchQuery.value = ''
  departmentFilter.value = ''
  roleIndex.value = 0
  statusIndex.value = 0
  currentPage.value = 1
  loadUsers()
}

// Handle table events
function handlePageChange(page: number) {
  currentPage.value = page
  loadUsers()
}

function handleSortChange(sortConfig: { key: string; order: 'asc' | 'desc' }) {
  // Implement sorting logic if needed
  loadUsers()
}

// Handle user actions
function handleView(user: User) {
  router.push(`/admin/users/detail?id=${user.id}`)
}

function handleEdit(user: User) {
  router.push(`/admin/users/edit?id=${user.id}`)
}

async function handleActivate(user: User) {
  try {
    await usersStore.activateUser(user.id)
    console.log('启用成功')
    alert('启用成功')
    loadUsers()
  } catch (error) {
    console.error('启用失败:', error)
    alert('启用失败')
  }
}

async function handleDeactivate(user: User) {
  if (confirm(`确定要禁用用户 ${user.name} 吗？`)) {
    try {
      await usersStore.deactivateUser(user.id)
      console.log('禁用成功')
      alert('禁用成功')
      loadUsers()
    } catch (error) {
      console.error('禁用失败:', error)
      alert('禁用失败')
    }
  }
}

async function handleResetPassword(user: User) {
  if (confirm(`确定要重置用户 ${user.name} 的密码吗？`)) {
    try {
      const result = await usersStore.resetUserPassword(user.id)
      alert(`密码重置成功\n临时密码：${result.temporary_password}\n请通知用户尽快修改密码`)
    } catch (error) {
      console.error('重置失败:', error)
      alert('重置失败')
    }
  }
}

async function handleDelete(user: User) {
  if (confirm(`确定要删除用户 ${user.name} 吗？此操作不可撤销。`)) {
    try {
      await usersStore.deleteUser(user.id)
      console.log('删除成功')
      alert('删除成功')
      loadUsers()
    } catch (error) {
      console.error('删除失败:', error)
      alert('删除失败')
    }
  }
}

// Handle modals
function handleAddUser() {
  newUser.value = {
    email: '',
    name: '',
    role: 'viewer',
    phone: '',
    department: '',
    position: '',
    send_invite: true
  }
  newUserRoleIndex.value = 3
  showAddModal.value = true
}

async function confirmAddUser() {
  if (!newUser.value.name || !newUser.value.email) {
    alert('请填写必填项')
    return
  }

  try {
    await usersStore.createUser(newUser.value)
    console.log('添加成功')
    alert('添加成功')
    showAddModal.value = false
    loadUsers()
  } catch (error) {
    console.error('添加失败:', error)
    alert('添加失败')
  }
}

function cancelAddUser() {
  showAddModal.value = false
}

function handleInviteUser() {
  inviteEmail.value = ''
  inviteRoleIndex.value = 3
  showInviteModal.value = true
}

async function confirmInviteUser() {
  if (!inviteEmail.value) {
    alert('请输入邮箱')
    return
  }

  const selectedRole = roleOptions[inviteRoleIndex.value + 1].value
  try {
    await usersStore.inviteUser(inviteEmail.value, selectedRole)
    console.log('邀请发送成功')
    alert('邀请发送成功')
    showInviteModal.value = false
  } catch (error) {
    console.error('邀请发送失败:', error)
    alert('邀请发送失败')
  }
}

function cancelInviteUser() {
  showInviteModal.value = false
}

async function handleExport() {
  exporting.value = true
  try {
    await usersStore.exportUsers({
      role: roleOptions[roleIndex.value].value,
      status: statusOptions[statusIndex.value].value,
      search: searchQuery.value,
      department: departmentFilter.value
    })
    console.log('导出成功')
    alert('导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    alert('导出失败')
  } finally {
    exporting.value = false
  }
}

// Utility functions
function formatDate(date: string): string {
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function getRoleLabel(role: string): string {
  const roleMap: Record<string, string> = {
    admin: '系统管理员',
    sales_manager: '销售经理',
    sales_rep: '销售代表',
    viewer: '查看者'
  }
  return roleMap[role] || role
}

function getStatusLabel(status: string): string {
  const statusMap: Record<string, string> = {
    active: '活跃',
    inactive: '停用',
    pending: '待激活',
    suspended: '暂停'
  }
  return statusMap[status] || status
}
</script>

<style lang="scss">
@import '@/styles/variables.scss';

.users-page {
  padding: 20px;
  background-color: $bg-color;
  min-height: 100vh;

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 24px;
    background: white;
    padding: 24px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

    .header-content {
      .page-title {
        font-size: 24px;
        font-weight: 600;
        color: $text-color;
        margin-bottom: 12px;
        display: block;
      }

      .header-stats {
        display: flex;
        gap: 24px;

        .stat-item {
          display: flex;
          flex-direction: column;
          gap: 4px;

          .stat-value {
            font-size: 20px;
            font-weight: 600;
            color: $primary-color;
          }

          .stat-label {
            font-size: 12px;
            color: $text-color-secondary;
          }
        }
      }
    }

    .header-actions {
      display: flex;
      gap: 12px;

      .action-btn {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 16px;
        border: none;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.3s ease;

        &.add-btn {
          background: $primary-color;
          color: white;

          &:hover {
            background: darken($primary-color, 10%);
          }
        }

        &.invite-btn {
          background: $success-color;
          color: white;

          &:hover {
            background: darken($success-color, 10%);
          }
        }

        &.export-btn {
          background: white;
          color: $text-color;
          border: 1px solid $border-color;

          &:hover {
            background: #f5f5f5;
          }

          &[loading='true'] {
            opacity: 0.7;
            pointer-events: none;
          }
        }

        .btn-icon {
          font-size: 16px;
        }
      }
    }
  }

  .filters-section {
    background: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    margin-bottom: 20px;

    .filters-row {
      display: flex;
      gap: 16px;
      align-items: center;
      flex-wrap: wrap;

      .filter-item {
        flex: 1;
        min-width: 200px;

        .search-input {
          width: 100%;
          padding: 10px 16px;
          border: 1px solid $border-color;
          border-radius: 6px;
          font-size: 14px;
          transition: all 0.3s ease;

          &:focus {
            border-color: $primary-color;
            outline: none;
          }
        }

        .filter-picker {
          position: relative;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 16px;
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
            color: $text-color-secondary;
          }
        }
        
        .picker-options {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          z-index: 10;
          background: white;
          border: 1px solid $border-color;
          border-top: none;
          border-radius: 0 0 6px 6px;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          max-height: 200px;
          overflow-y: auto;
          
          .picker-option {
            padding: 8px 16px;
            font-size: 14px;
            color: $text-color;
            cursor: pointer;
            transition: background-color 0.2s;
            
            &:hover {
              background-color: #f5f5f5;
            }
          }
        }
      }

      .filter-reset {
        padding: 10px 20px;
        background: white;
        color: $text-color-secondary;
        border: 1px solid $border-color;
        border-radius: 6px;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.3s ease;

        &:hover {
          color: $primary-color;
          border-color: $primary-color;
        }
      }
    }
  }

  // Custom cell styles
  .user-cell {
    display: flex;
    align-items: center;
    gap: 12px;

    .user-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      background: $primary-color;

      .avatar-img {
        width: 100%;
        height: 100%;
      }

      .avatar-placeholder {
        color: white;
        font-weight: 600;
        font-size: 16px;
      }
    }

    .user-info {
      display: flex;
      flex-direction: column;
      gap: 2px;

      .user-name {
        font-weight: 500;
        color: $text-color;
      }

      .user-email {
        font-size: 12px;
        color: $text-color-secondary;
      }

      .user-phone {
        font-size: 12px;
        color: $text-color-secondary;
      }
    }
  }

  .role-badge,
  .status-badge {
    display: inline-flex;
    padding: 4px 12px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 500;
  }

  .role-badge {
    &.role-admin {
      background: #ff6b6b;
      color: white;
    }

    &.role-sales_manager {
      background: #4ecdc4;
      color: white;
    }

    &.role-sales_rep {
      background: #45b7d1;
      color: white;
    }

    &.role-viewer {
      background: #96ceb4;
      color: white;
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

    &.status-pending {
      background: #fff3cd;
      color: #856404;
    }

    &.status-suspended {
      background: #f0f0f0;
      color: #666;
    }
  }

  .department-cell {
    font-size: 14px;
    color: $text-color-secondary;
  }

  .date-cell {
    font-size: 13px;
    color: $text-color-secondary;
  }

  .actions-cell {
    display: flex;
    gap: 6px;
    justify-content: center;
    flex-wrap: wrap;

    .action-btn {
      padding: 4px 8px;
      border: none;
      border-radius: 4px;
      font-size: 12px;
      cursor: pointer;
      transition: all 0.3s ease;

      &.action-view {
        background: #e9ecef;
        color: #495057;

        &:hover {
          background: #dee2e6;
        }
      }

      &.action-edit {
        background: $primary-color;
        color: white;

        &:hover {
          background: darken($primary-color, 10%);
        }
      }

      &.action-activate {
        background: $success-color;
        color: white;

        &:hover {
          background: darken($success-color, 10%);
        }
      }

      &.action-deactivate {
        background: $warning-color;
        color: white;

        &:hover {
          background: darken($warning-color, 10%);
        }
      }

      &.action-reset {
        background: #17a2b8;
        color: white;

        &:hover {
          background: darken(#17a2b8, 10%);
        }
      }

      &.action-delete {
        background: $danger-color;
        color: white;

        &:hover {
          background: darken($danger-color, 10%);
        }
      }
    }
  }

  // Form styles
  .user-form,
  .invite-form {
    .form-item {
      margin-bottom: 20px;

      .form-label {
        display: block;
        margin-bottom: 8px;
        font-size: 14px;
        color: $text-color;
        font-weight: 500;
      }

      .form-input {
        width: 100%;
        padding: 12px;
        border: 1px solid $border-color;
        border-radius: 6px;
        font-size: 14px;

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
    }

    .form-checkbox {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 16px;

      .checkbox-label {
        font-size: 14px;
        color: $text-color;
      }
    }

    .form-note {
      margin-top: 16px;
      padding: 12px;
      background: #f8f9fa;
      border-radius: 6px;
      font-size: 13px;
      color: $text-color-secondary;
      line-height: 1.5;
    }
  }
}

// Responsive design
@media (max-width: 768px) {
  .users-page {
    padding: 16px;

    .page-header {
      flex-direction: column;
      gap: 16px;

      .header-content {
        width: 100%;

        .page-title {
          font-size: 20px;
        }

        .header-stats {
          gap: 16px;

          .stat-item {
            .stat-value {
              font-size: 18px;
            }
          }
        }
      }

      .header-actions {
        width: 100%;
        flex-wrap: wrap;

        .action-btn {
          flex: 1;
          justify-content: center;
        }
      }
    }

    .filters-section {
      .filters-row {
        flex-direction: column;

        .filter-item {
          width: 100%;
          min-width: auto;
        }

        .filter-reset {
          width: 100%;
        }
      }
    }

    .actions-cell {
      flex-direction: column;
      gap: 4px;

      .action-btn {
        width: 60px;
        text-align: center;
      }
    }
  }

  // Modal styles
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .modal-content {
    background: white;
    border-radius: 8px;
    max-width: 500px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  }

  .modal-header {
    padding: 20px 24px;
    border-bottom: 1px solid $border-color;
    display: flex;
    justify-content: space-between;
    align-items: center;

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
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;

      &:hover {
        background: #f5f5f5;
      }
    }
  }

  .modal-footer {
    padding: 20px 24px;
    border-top: 1px solid $border-color;
    display: flex;
    justify-content: flex-end;
    gap: 12px;

    .btn {
      padding: 8px 16px;
      border: 1px solid $border-color;
      border-radius: 4px;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.3s ease;

      &.btn-secondary {
        background: white;
        color: $text-color-secondary;

        &:hover {
          background: #f5f5f5;
        }
      }

      &.btn-primary {
        background: $primary-color;
        color: white;
        border-color: $primary-color;

        &:hover {
          background: darken($primary-color, 10%);
        }
      }
    }
  }

  .user-form,
  .invite-form {
    padding: 20px 24px;

    .form-item {
      position: relative;
      margin-bottom: 20px;

      .form-label {
        display: block;
        margin-bottom: 8px;
        font-size: 14px;
        color: $text-color;
        font-weight: 500;
      }

      .form-input {
        width: 100%;
        padding: 12px;
        border: 1px solid $border-color;
        border-radius: 6px;
        font-size: 14px;

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
    }

    .form-checkbox {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 16px;

      .checkbox-label {
        font-size: 14px;
        color: $text-color;
      }
    }

    .form-note {
      margin-top: 16px;
      padding: 12px;
      background: #f8f9fa;
      border-radius: 6px;
      font-size: 13px;
      color: $text-color-secondary;
      line-height: 1.5;
    }
  }
}
</style>
