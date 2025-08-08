/**
 * Comprehensive Permission System Tests
 *
 * Tests all aspects of the role-based access control system including
 * route guards, feature permissions, and UI element visibility.
 */

import { beforeEach, describe, expect, test, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import {
  ROLE_PERMISSIONS,
  ROUTE_PERMISSIONS,
  canAccessFeature,
  hasRoutePermission,
  routeGuard
} from '@/utils/route-guards'
import { useAuthStore } from '@/stores/auth'
import { usePermissions } from '@/composables/usePermissions'
import type { User } from '@/types/models'

// Mock uni API
const mockUni = {
  showToast: vi.fn(),
  navigateTo: vi.fn(),
  redirectTo: vi.fn(),
  reLaunch: vi.fn(),
  switchTab: vi.fn(),
  getStorageSync: vi.fn(),
  setStorageSync: vi.fn(),
  removeStorageSync: vi.fn()
}

global.uni = mockUni as any

describe('Permission System Tests', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('Route Permissions', () => {
    describe('Public Routes', () => {
      test('should allow access to sales pages without authentication', () => {
        const publicRoutes = ROUTE_PERMISSIONS.PUBLIC

        publicRoutes.forEach(route => {
          expect(hasRoutePermission(null, route)).toBe(true)
        })
      })

      test('should allow authenticated users to access public routes', () => {
        const user: User = {
          id: '1',
          username: 'testuser',
          role: 'sales_rep',
          name: 'Test User',
          is_active: true,
          created_at: new Date().toISOString()
        }

        ROUTE_PERMISSIONS.PUBLIC.forEach(route => {
          expect(hasRoutePermission(user, route)).toBe(true)
        })
      })
    })

    describe('Authenticated Routes', () => {
      test('should deny access to unauthenticated users', () => {
        ROUTE_PERMISSIONS.AUTHENTICATED.forEach(route => {
          expect(hasRoutePermission(null, route)).toBe(false)
        })
      })

      test('should allow access to all authenticated users', () => {
        const roles = ['viewer', 'sales_rep', 'sales_manager', 'admin']

        roles.forEach(role => {
          const user: User = {
            id: '1',
            username: 'testuser',
            role: role as any,
            name: 'Test User',
            is_active: true,
            created_at: new Date().toISOString()
          }

          ROUTE_PERMISSIONS.AUTHENTICATED.forEach(route => {
            expect(hasRoutePermission(user, route)).toBe(true)
          })
        })
      })
    })

    describe('Manager Routes', () => {
      test('should deny access to viewers and sales reps', () => {
        const restrictedRoles = ['viewer', 'sales_rep']

        restrictedRoles.forEach(role => {
          const user: User = {
            id: '1',
            username: 'testuser',
            role: role as any,
            name: 'Test User',
            is_active: true,
            created_at: new Date().toISOString()
          }

          ROUTE_PERMISSIONS.MANAGER.forEach(route => {
            expect(hasRoutePermission(user, route)).toBe(false)
          })
        })
      })

      test('should allow access to managers and admins', () => {
        const allowedRoles = ['sales_manager', 'admin']

        allowedRoles.forEach(role => {
          const user: User = {
            id: '1',
            username: 'testuser',
            role: role as any,
            name: 'Test User',
            is_active: true,
            created_at: new Date().toISOString()
          }

          ROUTE_PERMISSIONS.MANAGER.forEach(route => {
            expect(hasRoutePermission(user, route)).toBe(true)
          })
        })
      })
    })

    describe('Admin-only Routes', () => {
      test('should deny access to non-admin users', () => {
        const nonAdminRoles = ['viewer', 'sales_rep', 'sales_manager']

        nonAdminRoles.forEach(role => {
          const user: User = {
            id: '1',
            username: 'testuser',
            role: role as any,
            name: 'Test User',
            is_active: true,
            created_at: new Date().toISOString()
          }

          ROUTE_PERMISSIONS.ADMIN_ONLY.forEach(route => {
            expect(hasRoutePermission(user, route)).toBe(false)
          })
        })
      })

      test('should allow access to admin users only', () => {
        const admin: User = {
          id: '1',
          username: 'admin',
          role: 'admin',
          name: 'Admin User',
          is_active: true,
          created_at: new Date().toISOString()
        }

        ROUTE_PERMISSIONS.ADMIN_ONLY.forEach(route => {
          expect(hasRoutePermission(admin, route)).toBe(true)
        })
      })
    })
  })

  describe('Feature Permissions', () => {
    test('admin should have access to all features', () => {
      const authStore = useAuthStore()
      authStore.user = {
        id: '1',
        username: 'admin',
        role: 'admin',
        name: 'Admin User',
        is_active: true,
        created_at: new Date().toISOString()
      }

      const features = [
        'user_management',
        'system_settings',
        'system_logs',
        'product_management',
        'customer_management',
        'quote_approval',
        'dashboard_access'
      ]

      features.forEach(feature => {
        expect(canAccessFeature(feature)).toBe(true)
      })
    })

    test('sales_manager should have limited access', () => {
      const authStore = useAuthStore()
      authStore.user = {
        id: '1',
        username: 'manager',
        role: 'sales_manager',
        name: 'Manager User',
        is_active: true,
        created_at: new Date().toISOString()
      }

      // Should have access to
      expect(canAccessFeature('product_management')).toBe(true)
      expect(canAccessFeature('customer_management')).toBe(true)
      expect(canAccessFeature('quote_approval')).toBe(true)
      expect(canAccessFeature('system_logs')).toBe(true)
      expect(canAccessFeature('dashboard_access')).toBe(true)

      // Should not have access to
      expect(canAccessFeature('user_management')).toBe(false)
      expect(canAccessFeature('system_settings')).toBe(false)
    })

    test('sales_rep should have basic access only', () => {
      const authStore = useAuthStore()
      authStore.user = {
        id: '1',
        username: 'salesrep',
        role: 'sales_rep',
        name: 'Sales Rep',
        is_active: true,
        created_at: new Date().toISOString()
      }

      // Should have access to
      expect(canAccessFeature('dashboard_access')).toBe(true)

      // Should not have access to
      expect(canAccessFeature('user_management')).toBe(false)
      expect(canAccessFeature('system_settings')).toBe(false)
      expect(canAccessFeature('product_management')).toBe(false)
      expect(canAccessFeature('customer_management')).toBe(false)
      expect(canAccessFeature('quote_approval')).toBe(false)
      expect(canAccessFeature('system_logs')).toBe(false)
    })

    test('viewer should have read-only access', () => {
      const authStore = useAuthStore()
      authStore.user = {
        id: '1',
        username: 'viewer',
        role: 'viewer',
        name: 'Viewer User',
        is_active: true,
        created_at: new Date().toISOString()
      }

      // Should have access to
      expect(canAccessFeature('dashboard_access')).toBe(true)

      // Should not have access to
      expect(canAccessFeature('user_management')).toBe(false)
      expect(canAccessFeature('system_settings')).toBe(false)
      expect(canAccessFeature('product_management')).toBe(false)
      expect(canAccessFeature('customer_management')).toBe(false)
      expect(canAccessFeature('quote_approval')).toBe(false)
      expect(canAccessFeature('system_logs')).toBe(false)
    })
  })

  describe('Route Guard Integration', () => {
    test('should redirect unauthenticated user to login', async () => {
      const authStore = useAuthStore()
      authStore.user = null
      authStore.token = null

      const result = await routeGuard('pages/admin/dashboard/index')

      expect(result.allowed).toBe(false)
      expect(result.redirectTo).toBe('/pages/admin/login/index')
      expect(result.reason).toBe('Authentication required')
    })

    test('should allow authenticated user to access permitted route', async () => {
      const authStore = useAuthStore()
      authStore.user = {
        id: '1',
        username: 'manager',
        role: 'sales_manager',
        name: 'Manager User',
        is_active: true,
        created_at: new Date().toISOString()
      }
      authStore.token = 'valid-token'

      const result = await routeGuard('pages/admin/products/index')

      expect(result.allowed).toBe(true)
    })

    test('should deny access and redirect to dashboard for insufficient permissions', async () => {
      const authStore = useAuthStore()
      authStore.user = {
        id: '1',
        username: 'salesrep',
        role: 'sales_rep',
        name: 'Sales Rep',
        is_active: true,
        created_at: new Date().toISOString()
      }
      authStore.token = 'valid-token'

      const result = await routeGuard('pages/admin/users/index')

      expect(result.allowed).toBe(false)
      expect(result.redirectTo).toBe('/pages/admin/dashboard/index')
      expect(result.reason).toBe('Insufficient permissions')
    })
  })

  describe('Permissions Composable', () => {
    test('should return correct permissions for admin user', () => {
      const authStore = useAuthStore()
      authStore.user = {
        id: '1',
        username: 'admin',
        role: 'admin',
        name: 'Admin User',
        is_active: true,
        created_at: new Date().toISOString()
      }
      authStore.token = 'valid-token'

      const { permissions } = usePermissions()

      expect(permissions.value.isAdmin).toBe(true)
      expect(permissions.value.isManager).toBe(true)
      expect(permissions.value.canManageUsers).toBe(true)
      expect(permissions.value.canManageProducts).toBe(true)
      expect(permissions.value.canAccessSettings).toBe(true)
      expect(permissions.value.showAdminMenu).toBe(true)
    })

    test('should return correct permissions for sales manager', () => {
      const authStore = useAuthStore()
      authStore.user = {
        id: '1',
        username: 'manager',
        role: 'sales_manager',
        name: 'Manager User',
        is_active: true,
        created_at: new Date().toISOString()
      }
      authStore.token = 'valid-token'

      const { permissions } = usePermissions()

      expect(permissions.value.isAdmin).toBe(false)
      expect(permissions.value.isManager).toBe(true)
      expect(permissions.value.canManageUsers).toBe(false)
      expect(permissions.value.canManageProducts).toBe(true)
      expect(permissions.value.canAccessSettings).toBe(false)
      expect(permissions.value.showAdminMenu).toBe(false)
    })

    test('should return correct permissions for sales rep', () => {
      const authStore = useAuthStore()
      authStore.user = {
        id: '1',
        username: 'salesrep',
        role: 'sales_rep',
        name: 'Sales Rep',
        is_active: true,
        created_at: new Date().toISOString()
      }
      authStore.token = 'valid-token'

      const { permissions } = usePermissions()

      expect(permissions.value.isAdmin).toBe(false)
      expect(permissions.value.isManager).toBe(false)
      expect(permissions.value.canManageUsers).toBe(false)
      expect(permissions.value.canManageProducts).toBe(false)
      expect(permissions.value.canAccessSettings).toBe(false)
      expect(permissions.value.showAdminMenu).toBe(false)
    })
  })

  describe('Permission Checking Methods', () => {
    test('canPerformAction should work correctly for different roles', () => {
      const { checkPermission } = usePermissions()

      // Test admin permissions
      const authStore = useAuthStore()
      authStore.user = {
        id: '1',
        username: 'admin',
        role: 'admin',
        name: 'Admin User',
        is_active: true,
        created_at: new Date().toISOString()
      }

      expect(checkPermission.canPerformAction('create', 'user')).toBe(true)
      expect(checkPermission.canPerformAction('delete', 'user')).toBe(true)
      expect(checkPermission.canPerformAction('edit', 'product')).toBe(true)
      expect(checkPermission.canPerformAction('approve', 'quote')).toBe(true)

      // Test sales manager permissions
      authStore.user.role = 'sales_manager'

      expect(checkPermission.canPerformAction('create', 'user')).toBe(false)
      expect(checkPermission.canPerformAction('delete', 'user')).toBe(false)
      expect(checkPermission.canPerformAction('edit', 'product')).toBe(true)
      expect(checkPermission.canPerformAction('approve', 'quote')).toBe(true)

      // Test sales rep permissions
      authStore.user.role = 'sales_rep'

      expect(checkPermission.canPerformAction('create', 'quote')).toBe(true)
      expect(checkPermission.canPerformAction('edit', 'product')).toBe(false)
      expect(checkPermission.canPerformAction('approve', 'quote')).toBe(false)
    })

    test('hasRole should check roles correctly', () => {
      const { checkPermission } = usePermissions()
      const authStore = useAuthStore()

      authStore.user = {
        id: '1',
        username: 'admin',
        role: 'admin',
        name: 'Admin User',
        is_active: true,
        created_at: new Date().toISOString()
      }

      expect(checkPermission.hasRole('admin')).toBe(true)
      expect(checkPermission.hasRole('sales_manager')).toBe(false)
      expect(checkPermission.hasAnyRole(['admin', 'sales_manager'])).toBe(true)
      expect(checkPermission.hasAnyRole(['sales_rep', 'viewer'])).toBe(false)
    })

    test('resource ownership should work correctly', () => {
      const { checkPermission } = usePermissions()
      const authStore = useAuthStore()

      authStore.user = {
        id: 'user123',
        username: 'testuser',
        role: 'sales_rep',
        name: 'Test User',
        is_active: true,
        created_at: new Date().toISOString()
      }

      // User owns the resource
      expect(checkPermission.ownsResource('user123')).toBe(true)
      expect(checkPermission.canModifyResource('user123')).toBe(true)

      // User doesn't own the resource, but can still modify as sales rep
      expect(checkPermission.ownsResource('other-user')).toBe(false)
      expect(checkPermission.canModifyResource('other-user')).toBe(false)

      // Manager can modify others' resources
      authStore.user.role = 'sales_manager'
      expect(checkPermission.canModifyResource('other-user')).toBe(true)
    })
  })

  describe('Edge Cases', () => {
    test('should handle null user gracefully', () => {
      expect(hasRoutePermission(null, 'pages/admin/dashboard/index')).toBe(false)
      expect(hasRoutePermission(null, 'pages/sales/index')).toBe(true)
    })

    test('should handle unknown routes', () => {
      const user: User = {
        id: '1',
        username: 'admin',
        role: 'admin',
        name: 'Admin User',
        is_active: true,
        created_at: new Date().toISOString()
      }

      // Unknown route should default to deny
      expect(hasRoutePermission(user, 'pages/unknown/route')).toBe(false)
    })

    test('should handle invalid roles', () => {
      const user: User = {
        id: '1',
        username: 'testuser',
        role: 'invalid_role' as any,
        name: 'Test User',
        is_active: true,
        created_at: new Date().toISOString()
      }

      // Invalid role should have no permissions
      expect(hasRoutePermission(user, 'pages/admin/dashboard/index')).toBe(false)
      expect(hasRoutePermission(user, 'pages/sales/index')).toBe(true) // Public route
    })

    test('should handle missing user properties', () => {
      const incompleteUser = {
        id: '1',
        role: 'admin'
      } as User

      // Should still work with minimal user object
      expect(hasRoutePermission(incompleteUser, 'pages/admin/users/index')).toBe(true)
    })
  })

  describe('UI Helper Functions', () => {
    test('should provide correct role display names', () => {
      const { uiHelpers } = usePermissions()

      expect(uiHelpers.getRoleDisplayName('admin')).toBe('系统管理员')
      expect(uiHelpers.getRoleDisplayName('sales_manager')).toBe('销售经理')
      expect(uiHelpers.getRoleDisplayName('sales_rep')).toBe('销售代表')
      expect(uiHelpers.getRoleDisplayName('viewer')).toBe('查看者')
      expect(uiHelpers.getRoleDisplayName('unknown')).toBe('未知角色')
    })

    test('should provide correct role badge colors', () => {
      const { uiHelpers } = usePermissions()

      expect(uiHelpers.getRoleBadgeColor('admin')).toBe('#ef4444')
      expect(uiHelpers.getRoleBadgeColor('sales_manager')).toBe('#f59e0b')
      expect(uiHelpers.getRoleBadgeColor('sales_rep')).toBe('#3b82f6')
      expect(uiHelpers.getRoleBadgeColor('viewer')).toBe('#6b7280')
    })

    test('should provide correct permission denied messages', () => {
      const { uiHelpers } = usePermissions()

      expect(uiHelpers.getPermissionDeniedMessage('view')).toBe('您没有权限查看此内容')
      expect(uiHelpers.getPermissionDeniedMessage('edit')).toBe('您没有权限编辑此内容')
      expect(uiHelpers.getPermissionDeniedMessage('delete')).toBe('您没有权限删除此内容')
      expect(uiHelpers.getPermissionDeniedMessage()).toBe('权限不足')
    })
  })
})

/**
 * Integration Tests for Route Guard Navigation
 */
describe('Route Guard Navigation Integration', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  test('should intercept navigation and redirect unauthenticated users', async () => {
    const authStore = useAuthStore()
    authStore.user = null
    authStore.token = null

    // Mock the getCurrentUser method to return failure
    authStore.getCurrentUser = vi.fn().mockResolvedValue({
      success: false,
      error: { message: 'Not authenticated' }
    })

    const result = await routeGuard('pages/admin/products/index')

    expect(result.allowed).toBe(false)
    expect(result.redirectTo).toBe('/pages/admin/login/index')
  })

  test('should allow navigation for users with sufficient permissions', async () => {
    const authStore = useAuthStore()
    authStore.user = {
      id: '1',
      username: 'manager',
      role: 'sales_manager',
      name: 'Manager User',
      is_active: true,
      created_at: new Date().toISOString()
    }
    authStore.token = 'valid-token'

    const result = await routeGuard('pages/admin/products/index')

    expect(result.allowed).toBe(true)
    expect(result.redirectTo).toBeUndefined()
  })
})

/**
 * Performance Tests
 */
describe('Permission System Performance', () => {
  test('should handle permission checks efficiently', () => {
    const user: User = {
      id: '1',
      username: 'admin',
      role: 'admin',
      name: 'Admin User',
      is_active: true,
      created_at: new Date().toISOString()
    }

    const start = performance.now()

    // Perform 1000 permission checks
    for (let i = 0; i < 1000; i++) {
      hasRoutePermission(user, 'pages/admin/users/index')
      canAccessFeature('user_management')
    }

    const end = performance.now()
    const duration = end - start

    // Should complete 2000 checks in under 10ms
    expect(duration).toBeLessThan(10)
  })
})
