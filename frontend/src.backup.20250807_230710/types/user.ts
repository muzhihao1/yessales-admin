export interface User {
  id: string
  email: string
  name: string
  phone?: string
  avatar?: string
  role: UserRole
  status: UserStatus
  department?: string
  position?: string
  last_login_at?: string
  created_at: string
  updated_at: string
  created_by?: string
  // Permissions
  permissions?: string[]
  // Profile fields
  bio?: string
  location?: string
  timezone?: string
  language?: string
  // Performance metrics (for sales reps)
  sales_quota?: number
  sales_achieved?: number
  quota_period?: string
}

export type UserRole = 'admin' | 'sales_manager' | 'sales_rep' | 'viewer'

export type UserStatus = 'active' | 'inactive' | 'pending' | 'suspended'

export interface UserFilters {
  page?: number
  pageSize?: number
  search?: string
  role?: UserRole
  status?: UserStatus
  department?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  startDate?: string
  endDate?: string
}

export interface UserStatistics {
  total: number
  active: number
  inactive: number
  admin: number
  sales_manager: number
  sales_rep: number
  viewer: number
}

export interface UserInvitation {
  email: string
  role: UserRole
  invited_by: string
  invited_at: string
  expires_at: string
  status: 'pending' | 'accepted' | 'expired'
}

export interface CreateUserData {
  email: string
  name: string
  role: UserRole
  department?: string
  position?: string
  phone?: string
  send_invite?: boolean
}

export interface UpdateUserData {
  name?: string
  phone?: string
  role?: UserRole
  status?: UserStatus
  department?: string
  position?: string
  bio?: string
  location?: string
  timezone?: string
  language?: string
  sales_quota?: number
  quota_period?: string
}

export interface UserPermission {
  id: string
  name: string
  description: string
  resource: string
  action: string
}

export interface UserRoleDetail {
  id: string
  name: string
  description: string
  permissions: UserPermission[]
  is_system: boolean
  created_at: string
  updated_at: string
}

export interface PasswordResetData {
  temporary_password: string
  reset_required: boolean
  expires_at: string
}