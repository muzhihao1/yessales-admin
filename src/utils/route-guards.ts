/**
 * Route Guards - Permission and Authentication Control
 *
 * This module provides route-level access control for the admin panel,
 * ensuring users are authenticated and have appropriate permissions.
 */

import { useAuthStore } from '@/stores/auth'
import type { User } from '@/types/models'

// Vue Router types for navigation guards
interface RouteLocationNormalized {
  path: string
  name?: string | symbol
  params: Record<string, string | string[]>
  query: Record<string, string | string[]>
  meta: Record<string, any>
}

type NavigationGuardNext = (to?: any) => void

interface Router {
  beforeEach: (guard: (to: RouteLocationNormalized, from: RouteLocationNormalized, next: NavigationGuardNext) => void | Promise<void>) => void
}

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
  ] as string[],

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
  if ((ROUTE_PERMISSIONS.PUBLIC as string[]).includes(routePath)) {
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
    if ((routes as string[]).includes(routePath)) {
      return (userPermissions as string[]).includes(permissionLevel)
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
 * Navigation interceptor for Vue Router
 * Call this in router/index.ts or main.ts with Vue Router instance
 */
export function setupRouteGuards(router: Router) {
  // Add global beforeEach guard
  router.beforeEach(async (to: RouteLocationNormalized, _from: RouteLocationNormalized, next: NavigationGuardNext) => {
    const routePath = to.path.startsWith('/') ? to.path.substring(1) : to.path

    const guardResult = await routeGuard(routePath)

    if (!guardResult.allowed) {
      console.warn(`Route access denied: ${routePath} - ${guardResult.reason}`)

      // Show notification for access denial
      alert(guardResult.reason || '访问被拒绝')

      if (guardResult.redirectTo) {
        // Redirect to appropriate page
        next(guardResult.redirectTo)
      } else {
        // Prevent navigation
        next(false)
      }
    } else {
      // Allow navigation
      next()
    }
  })
}

/**
 * Page-level route guard composable
 * Use this in Vue components to check permissions on mount
 */
export function useRouteGuard() {
  const checkRoutePermission = async (routePath?: string) => {
    // Get current route path from window location or passed parameter
    const currentPath = routePath || window.location.pathname
    const normalizedPath = currentPath.startsWith('/') ? currentPath.substring(1) : currentPath

    const guardResult = await routeGuard(normalizedPath)

    if (!guardResult.allowed) {
      console.warn(`Page access denied: ${normalizedPath} - ${guardResult.reason}`)

      // Show notification for access denial
      alert(guardResult.reason || '访问被拒绝')

      if (guardResult.redirectTo) {
        setTimeout(() => {
          window.location.href = guardResult.redirectTo!
        }, 1500)
      } else {
        setTimeout(() => {
          window.history.back()
        }, 1500)
      }
    }

    return guardResult
  }

  return {
    checkRoutePermission
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
