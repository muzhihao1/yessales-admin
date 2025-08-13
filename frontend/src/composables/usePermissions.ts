/**
 * Permission Composable
 *
 * Provides reactive permission checking and role-based access control
 * for Vue components in the admin panel.
 */

import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { canAccessFeature, hasRoutePermission } from '@/utils/route-guards'
import type { User } from '@/types/models'

export function usePermissions() {
  const authStore = useAuthStore()

  // Reactive computed properties for common permission checks
  const permissions = computed(() => {
    const user = authStore.user

    return {
      // User authentication status
      isAuthenticated: authStore.isAuthenticated,
      isAdmin: user?.role === 'admin',
      isManager: user?.role === 'admin',
      isSalesRep: user?.role === 'sales_rep',
      isViewer: user?.role === 'viewer',

      // Feature-based permissions
      canManageUsers: canAccessFeature('user_management'),
      canManageProducts: canAccessFeature('product_management'),
      canManageCustomers: canAccessFeature('customer_management'),
      canApproveQuotes: canAccessFeature('quote_approval'),
      canExportData: canAccessFeature('quote_export'),
      canViewLogs: canAccessFeature('system_logs'),
      canAccessSettings: canAccessFeature('system_settings'),
      canManageRoles: canAccessFeature('user_roles'),

      // UI element permissions
      showAdminMenu: user?.role === 'admin',
      showUserManagement: canAccessFeature('user_management'),
      showSystemSettings: canAccessFeature('system_settings'),
      showAdvancedFeatures: user?.role === 'admin',

      // Action permissions
      canEditOwnProfile: !!user,
      canDeleteRecords: user?.role === 'admin',
      canBulkOperations: user?.role === 'admin',
      canViewAllData: user?.role === 'admin',

      // Current user info
      currentUser: user,
      userRole: user?.role || null,
      userName: user?.name || user?.username || ''
    }
  })

  // Methods for dynamic permission checking
  const checkPermission = {
    /**
     * Check if user can access a specific route
     */
    canAccessRoute(routePath: string): boolean {
      return hasRoutePermission(authStore.user, routePath)
    },

    /**
     * Check if user can access a specific feature
     */
    canAccessFeature(featureName: string): boolean {
      return canAccessFeature(featureName)
    },

    /**
     * Check if user has specific role
     */
    hasRole(role: string): boolean {
      return authStore.user?.role === role
    },

    /**
     * Check if user has any of the specified roles
     */
    hasAnyRole(roles: string[]): boolean {
      return roles.includes(authStore.user?.role || '')
    },

    /**
     * Check if user can perform action on resource
     */
    canPerformAction(action: string, resource?: string): boolean {
      const user = authStore.user
      if (!user) return false

      // Define action-resource permission matrix
      const actionPermissions: Record<string, Record<string, string[]>> = {
        create: {
          user: ['admin'],
          product: ['admin'],
          customer: ['admin', 'sales'],
          quote: ['admin', 'sales']
        },
        edit: {
          user: ['admin'],
          product: ['admin'],
          customer: ['admin', 'sales'],
          quote: ['admin', 'sales']
        },
        delete: {
          user: ['admin'],
          product: ['admin'],
          customer: ['admin'],
          quote: ['admin']
        },
        view: {
          user: ['admin'],
          product: ['admin', 'sales'],
          customer: ['admin', 'sales'],
          quote: ['admin', 'sales']
        },
        approve: {
          quote: ['admin']
        },
        export: {
          data: ['admin']
        }
      }

      const allowedRoles = actionPermissions[action]?.[resource || 'default'] || []
      return allowedRoles.includes(user.role)
    },

    /**
     * Check if user can access admin panel
     */
    canAccessAdminPanel(): boolean {
      return this.hasAnyRole(['admin', 'sales'])
    },

    /**
     * Check if user owns a resource (for edit/delete permissions)
     */
    ownsResource(resourceUserId: string): boolean {
      return authStore.user?.id === resourceUserId
    },

    /**
     * Check if user can edit/delete their own content or has admin privileges
     */
    canModifyResource(resourceUserId: string): boolean {
      return this.ownsResource(resourceUserId) || this.hasAnyRole(['admin'])
    }
  }

  // Utility functions for UI components
  const uiHelpers = {
    /**
     * Get appropriate error message for permission denied
     */
    getPermissionDeniedMessage(action?: string): string {
      const messages: Record<string, string> = {
        view: '您没有权限查看此内容',
        edit: '您没有权限编辑此内容',
        delete: '您没有权限删除此内容',
        create: '您没有权限创建此内容',
        access: '您没有权限访问此功能'
      }

      return messages[action || 'access'] || '权限不足'
    },

    /**
     * Show permission denied toast
     */
    showPermissionDenied(action?: string): void {
      const message = this.getPermissionDeniedMessage(action)
      console.warn('Permission denied:', message)
      alert(message)
    },

    /**
     * Get user role display name
     */
    getRoleDisplayName(role?: string): string {
      const roleNames: Record<string, string> = {
        admin: '系统管理员',
        sales: '销售代表'
      }

      return roleNames[role || authStore.user?.role || ''] || '未知角色'
    },

    /**
     * Get role badge color
     */
    getRoleBadgeColor(role?: string): string {
      const colors: Record<string, string> = {
        admin: '#ef4444',
        sales: '#3b82f6'
      }

      return colors[role || authStore.user?.role || ''] || '#6b7280'
    }
  }

  return {
    permissions,
    checkPermission,
    uiHelpers,

    // Direct access to commonly used properties
    isAuthenticated: permissions.value.isAuthenticated,
    isAdmin: permissions.value.isAdmin,
    isManager: permissions.value.isManager,
    currentUser: permissions.value.currentUser,
    userRole: permissions.value.userRole
  }
}
