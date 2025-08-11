/**
 * Route Guards - Permission and Authentication Control
 *
 * This module provides route-level access control for the admin panel,
 * ensuring users are authenticated and have appropriate permissions.
 */

import { useAuthStore } from '@/stores/auth'
import type { User } from '@/types/models'

/**
 * Route categories and their required permissions
 */
export const ROUTE_PERMISSIONS = {
  // Public routes (no authentication required)
  PUBLIC: [
    'pages/sales/index',
    'pages/sales/quote/create',
    'pages/sales/quote/preview',
    'pages/sales/history/index',
    'pages/sales/history/detail',
    'pages/admin/login/index'
  ],

  // Routes requiring basic authentication
  AUTHENTICATED: ['pages/admin/dashboard/index'],

  // Routes requiring admin or sales manager permissions
  MANAGER: [
    'pages/admin/quotes/index',
    'pages/admin/quotes/detail',
    'pages/admin/products/index',
    'pages/admin/products/edit',
    'pages/admin/customers/index',
    'pages/admin/customers/detail',
    'pages/admin/customers/edit'
  ],

  // Routes requiring admin permissions only
  ADMIN_ONLY: [
    'pages/admin/users/index',
    'pages/admin/users/edit',
    'pages/admin/logs/index',
    'pages/admin/settings/index'
  ]
} as const

/**
 * User roles and their permission levels
 */
export const ROLE_PERMISSIONS = {
  admin: ['PUBLIC', 'AUTHENTICATED', 'MANAGER', 'ADMIN_ONLY'],
  sales_manager: ['PUBLIC', 'AUTHENTICATED', 'MANAGER'],
  sales_rep: ['PUBLIC', 'AUTHENTICATED'],
  viewer: ['PUBLIC', 'AUTHENTICATED']
} as const

/**
 * Check if a user has permission to access a specific route
 */
export function hasRoutePermission(user: User | null, routePath: string): boolean {
  // Allow access to public routes
  if (ROUTE_PERMISSIONS.PUBLIC.includes(routePath)) {
    return true
  }

  // Require authentication for all other routes
  if (!user) {
    return false
  }

  // Get user role permissions
  const userPermissions = ROLE_PERMISSIONS[user.role as keyof typeof ROLE_PERMISSIONS] || []

  // Check route permission requirements
  for (const [permissionLevel, routes] of Object.entries(ROUTE_PERMISSIONS)) {
    if (routes.includes(routePath)) {
      return userPermissions.includes(permissionLevel)
    }
  }

  // Default deny for unknown routes
  return false
}

/**
 * Get redirect path for unauthorized access
 */
export function getRedirectPath(user: User | null, _routePath: string): string {
  // If user is not authenticated, redirect to login
  if (!user) {
    return '/pages/admin/login/index'
  }

  // If user lacks permissions, redirect to dashboard
  return '/pages/admin/dashboard/index'
}

/**
 * Route guard interceptor - call this before navigation
 */
export async function routeGuard(routePath: string): Promise<{
  allowed: boolean
  redirectTo?: string
  reason?: string
}> {
  try {
    const authStore = useAuthStore()

    // Ensure we have current user info
    if (!authStore.user && authStore.token) {
      // Try to get current user if we have a token but no user info
      const userResponse = await authStore.getCurrentUser()
      if (!userResponse.success) {
        authStore.logout()
        return {
          allowed: false,
          redirectTo: '/pages/admin/login/index',
          reason: 'Session expired'
        }
      }
    }

    const user = authStore.user

    // Check route permission
    if (hasRoutePermission(user, routePath)) {
      return { allowed: true }
    }

    // Handle unauthorized access
    const redirectTo = getRedirectPath(user, routePath)
    const reason = !user ? 'Authentication required' : 'Insufficient permissions'

    return {
      allowed: false,
      redirectTo,
      reason
    }
  } catch (error) {
    console.error('Route guard error:', error)
    return {
      allowed: false,
      redirectTo: '/pages/admin/login/index',
      reason: 'Route guard error'
    }
  }
}

/**
 * Check if current user can access a specific feature
 */
export function canAccessFeature(feature: string): boolean {
  const authStore = useAuthStore()
  const user = authStore.user

  if (!user) return false

  const featurePermissions: Record<string, string[]> = {
    user_management: ['admin'],
    system_settings: ['admin'],
    user_roles: ['admin'],
    system_logs: ['admin', 'sales_manager'],
    product_management: ['admin', 'sales_manager'],
    customer_management: ['admin', 'sales_manager'],
    quote_approval: ['admin', 'sales_manager'],
    quote_export: ['admin', 'sales_manager'],
    dashboard_access: ['admin', 'sales_manager', 'sales_rep', 'viewer']
  }

  const allowedRoles = featurePermissions[feature] || []
  return allowedRoles.includes(user.role)
}

/**
 * Navigation interceptor for Uniapp
 * Call this in app.vue or main.js
 */
export function setupRouteGuards() {
  // Save original navigation methods
  const originalNavigateTo = uni.navigateTo
  const originalRedirectTo = uni.redirectTo
  const originalReLaunch = uni.reLaunch
  const originalSwitchTab = uni.switchTab

  // Override navigation methods with route guards
  uni.navigateTo = async function (options: UniApp.NavigateToOptions) {
    const url = options.url.split('?')[0] // Remove query parameters
    const routePath = url.startsWith('/') ? url.substring(1) : url

    const guardResult = await routeGuard(routePath)

    if (!guardResult.allowed) {
      console.warn(`Route access denied: ${routePath} - ${guardResult.reason}`)

      if (guardResult.redirectTo) {
        uni.showToast({
          title: guardResult.reason || '访问被拒绝',
          icon: 'none',
          duration: 2000
        })

        // Redirect to appropriate page
        return originalRedirectTo.call(this, {
          url: guardResult.redirectTo
        })
      }

      return Promise.reject(new Error(guardResult.reason))
    }

    return originalNavigateTo.call(this, options)
  }

  uni.redirectTo = async function (options: UniApp.RedirectToOptions) {
    const url = options.url.split('?')[0]
    const routePath = url.startsWith('/') ? url.substring(1) : url

    const guardResult = await routeGuard(routePath)

    if (!guardResult.allowed && guardResult.redirectTo) {
      console.warn(`Route access denied: ${routePath} - ${guardResult.reason}`)
      options.url = guardResult.redirectTo
    }

    return originalRedirectTo.call(this, options)
  }

  uni.reLaunch = async function (options: UniApp.ReLaunchOptions) {
    const url = options.url.split('?')[0]
    const routePath = url.startsWith('/') ? url.substring(1) : url

    const guardResult = await routeGuard(routePath)

    if (!guardResult.allowed && guardResult.redirectTo) {
      console.warn(`Route access denied: ${routePath} - ${guardResult.reason}`)
      options.url = guardResult.redirectTo
    }

    return originalReLaunch.call(this, options)
  }

  uni.switchTab = async function (options: UniApp.SwitchTabOptions) {
    const url = options.url.split('?')[0]
    const routePath = url.startsWith('/') ? url.substring(1) : url

    const guardResult = await routeGuard(routePath)

    if (!guardResult.allowed) {
      console.warn(`Tab access denied: ${routePath} - ${guardResult.reason}`)

      uni.showToast({
        title: guardResult.reason || '访问被拒绝',
        icon: 'none'
      })

      // For tab navigation, we can't easily redirect, so just prevent the action
      return Promise.reject(new Error(guardResult.reason))
    }

    return originalSwitchTab.call(this, options)
  }
}

/**
 * Page-level route guard mixin
 * Use this in page components to check permissions on load
 */
export const routeGuardMixin = {
  async onLoad() {
    const pages = getCurrentPages()
    const currentPage = pages[pages.length - 1]
    const routePath = currentPage.route

    if (routePath) {
      const guardResult = await routeGuard(routePath)

      if (!guardResult.allowed) {
        console.warn(`Page access denied: ${routePath} - ${guardResult.reason}`)

        uni.showToast({
          title: guardResult.reason || '访问被拒绝',
          icon: 'none'
        })

        if (guardResult.redirectTo) {
          setTimeout(() => {
            uni.redirectTo({
              url: guardResult.redirectTo!
            })
          }, 1500)
        } else {
          setTimeout(() => {
            uni.navigateBack()
          }, 1500)
        }
      }
    }
  }
}

/**
 * Utility to check permissions in templates
 */
export const permissionUtils = {
  hasRoutePermission,
  canAccessFeature,

  // Template helper functions
  isAdmin(): boolean {
    const authStore = useAuthStore()
    return authStore.user?.role === 'admin'
  },

  isManager(): boolean {
    const authStore = useAuthStore()
    return ['admin', 'sales_manager'].includes(authStore.user?.role || '')
  },

  canManageUsers(): boolean {
    return this.isAdmin()
  },

  canManageProducts(): boolean {
    return this.isManager()
  },

  canViewLogs(): boolean {
    return this.isManager()
  }
}
