import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { ApiService } from '@/api'
import type { User, UserFilters, UserStatistics } from '@/types/user'

export const useUsersStore = defineStore('users', () => {
  // State
  const users = ref<User[]>([])
  const currentUser = ref<User | null>(null)
  const totalCount = ref(0)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Statistics
  const statistics = computed<UserStatistics>(() => {
    const stats = {
      total: users.value.length,
      active: 0,
      inactive: 0,
      admin: 0,
      sales_manager: 0,
      sales_rep: 0,
      viewer: 0
    }

    users.value.forEach(user => {
      if (user.status === 'active') {
        stats.active++
      } else {
        stats.inactive++
      }

      switch (user.role) {
        case 'admin':
          stats.admin++
          break
        case 'sales_manager':
          stats.sales_manager++
          break
        case 'sales_rep':
          stats.sales_rep++
          break
        case 'viewer':
          stats.viewer++
          break
      }
    })

    return stats
  })

  // Actions
  async function fetchUsers(filters: UserFilters = {}) {
    loading.value = true
    error.value = null

    try {
      const response = await ApiService.get('/api/users', {
        params: {
          page: filters.page || 1,
          pageSize: filters.pageSize || 20,
          search: filters.search,
          role: filters.role,
          status: filters.status,
          department: filters.department,
          sortBy: filters.sortBy || 'created_at',
          sortOrder: filters.sortOrder || 'desc'
        }
      })

      users.value = response.data.data
      totalCount.value = response.data.total
    } catch (err: any) {
      error.value = err.message || '获取用户列表失败'
      console.error('Failed to fetch users:', err)
    } finally {
      loading.value = false
    }
  }

  async function fetchUserById(id: string) {
    loading.value = true
    error.value = null

    try {
      const response = await ApiService.get(`/api/users/${id}`)
      currentUser.value = response.data
      return response.data
    } catch (err: any) {
      error.value = err.message || '获取用户详情失败'
      console.error('Failed to fetch user:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createUser(userData: Partial<User>) {
    loading.value = true
    error.value = null

    try {
      const response = await ApiService.post('/api/users', userData)
      users.value.unshift(response.data)
      totalCount.value++
      return response.data
    } catch (err: any) {
      error.value = err.message || '创建用户失败'
      console.error('Failed to create user:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateUser(id: string, userData: Partial<User>) {
    loading.value = true
    error.value = null

    try {
      const response = await ApiService.put(`/api/users/${id}`, userData)
      const index = users.value.findIndex(u => u.id === id)
      if (index !== -1) {
        users.value[index] = response.data
      }
      if (currentUser.value?.id === id) {
        currentUser.value = response.data
      }
      return response.data
    } catch (err: any) {
      error.value = err.message || '更新用户失败'
      console.error('Failed to update user:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteUser(id: string) {
    loading.value = true
    error.value = null

    try {
      await ApiService.delete(`/api/users/${id}`)
      users.value = users.value.filter(u => u.id !== id)
      totalCount.value--
    } catch (err: any) {
      error.value = err.message || '删除用户失败'
      console.error('Failed to delete user:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function activateUser(id: string) {
    return updateUser(id, { status: 'active' })
  }

  async function deactivateUser(id: string) {
    return updateUser(id, { status: 'inactive' })
  }

  async function updateUserRole(id: string, role: string) {
    return updateUser(id, { role })
  }

  async function resetUserPassword(id: string) {
    loading.value = true
    error.value = null

    try {
      const response = await ApiService.post(`/api/users/${id}/reset-password`)
      return response.data
    } catch (err: any) {
      error.value = err.message || '重置密码失败'
      console.error('Failed to reset password:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function inviteUser(email: string, role: string) {
    loading.value = true
    error.value = null

    try {
      const response = await ApiService.post('/api/users/invite', { email, role })
      return response.data
    } catch (err: any) {
      error.value = err.message || '邀请用户失败'
      console.error('Failed to invite user:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function exportUsers(filters: UserFilters = {}) {
    loading.value = true
    error.value = null

    try {
      const response = await ApiService.get('/api/users/export', {
        params: filters,
        responseType: 'blob'
      })

      // Create download link
      const blob = new Blob([response.data], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `users_${new Date().toISOString().split('T')[0]}.csv`
      link.click()
      window.URL.revokeObjectURL(url)
    } catch (err: any) {
      error.value = err.message || '导出用户失败'
      console.error('Failed to export users:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  function clearError() {
    error.value = null
  }

  return {
    // State
    users,
    currentUser,
    totalCount,
    loading,
    error,
    statistics,

    // Actions
    fetchUsers,
    fetchUserById,
    createUser,
    updateUser,
    deleteUser,
    activateUser,
    deactivateUser,
    updateUserRole,
    resetUserPassword,
    inviteUser,
    exportUsers,
    clearError
  }
})