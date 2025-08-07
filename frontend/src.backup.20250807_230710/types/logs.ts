/**
 * Operations Log Types and Interfaces
 * 
 * Defines the structure for system operation logging and audit trails.
 * Used for tracking user actions, system events, and security auditing.
 */

export type LogLevel = 'info' | 'warn' | 'error' | 'debug' | 'critical'

export type LogCategory = 
  | 'auth'           // Authentication and authorization
  | 'user'           // User management operations
  | 'customer'       // Customer management operations
  | 'product'        // Product management operations
  | 'quote'          // Quote management operations
  | 'system'         // System configuration changes
  | 'security'       // Security events and violations
  | 'api'            // API requests and responses
  | 'data'           // Data operations and migrations
  | 'export'         // Data export operations

export type LogAction = 
  | 'create' | 'read' | 'update' | 'delete'  // CRUD operations
  | 'login' | 'logout' | 'register'          // Authentication
  | 'approve' | 'reject' | 'assign'          // Workflow actions
  | 'export' | 'import' | 'backup'           // Data operations
  | 'config_change' | 'role_change'          // System changes
  | 'access_denied' | 'security_violation'   // Security events

export interface LogEntry {
  id: string
  timestamp: string
  level: LogLevel
  category: LogCategory
  action: LogAction
  user_id: string | null
  user_name?: string
  user_role?: string
  resource_type?: string
  resource_id?: string
  resource_name?: string
  ip_address?: string
  user_agent?: string
  session_id?: string
  message: string
  details?: Record<string, any>
  duration_ms?: number
  error_code?: string
  stack_trace?: string
  request_id?: string
  correlation_id?: string
  created_at: string
  updated_at?: string
}

export interface LogFilter {
  level?: LogLevel[]
  category?: LogCategory[]
  action?: LogAction[]
  user_id?: string
  resource_type?: string
  resource_id?: string
  date_from?: string
  date_to?: string
  search?: string
  ip_address?: string
  session_id?: string
  request_id?: string
}

export interface LogSearchResult {
  entries: LogEntry[]
  total: number
  page: number
  per_page: number
  has_next: boolean
  has_previous: boolean
}

export interface LogStatistics {
  total_entries: number
  entries_by_level: Record<LogLevel, number>
  entries_by_category: Record<LogCategory, number>
  entries_by_action: Record<LogAction, number>
  top_users: Array<{
    user_id: string
    user_name: string
    count: number
  }>
  recent_activity: LogEntry[]
  error_summary: Array<{
    error_code: string
    count: number
    last_occurrence: string
  }>
  security_events: number
  failed_logins: number
  data_operations: number
}

export interface LogExportOptions {
  format: 'json' | 'csv' | 'xlsx'
  filters?: LogFilter
  include_details?: boolean
  date_range?: {
    start: string
    end: string
  }
  max_entries?: number
}

export interface SecurityEvent {
  id: string
  timestamp: string
  event_type: 'failed_login' | 'suspicious_activity' | 'permission_violation' | 'data_breach_attempt'
  severity: 'low' | 'medium' | 'high' | 'critical'
  user_id?: string
  ip_address: string
  description: string
  resolved: boolean
  resolved_by?: string
  resolved_at?: string
  resolution_notes?: string
}

export interface SystemEvent {
  id: string
  timestamp: string
  event_type: 'startup' | 'shutdown' | 'config_change' | 'backup' | 'maintenance'
  component: string
  description: string
  status: 'success' | 'warning' | 'error'
  details?: Record<string, any>
  duration_ms?: number
}

// Log display helpers
export interface LogDisplayOptions {
  show_technical_details: boolean
  show_stack_traces: boolean
  show_request_details: boolean
  group_by_session: boolean
  highlight_errors: boolean
  auto_refresh: boolean
  refresh_interval: number
}

// Log retention policy
export interface LogRetentionPolicy {
  info_logs_days: number
  warn_logs_days: number
  error_logs_days: number
  critical_logs_days: number
  security_logs_days: number
  archive_after_days: number
  auto_cleanup: boolean
}