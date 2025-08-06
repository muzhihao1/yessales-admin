/**
 * System Settings Types and Interfaces
 * 
 * Defines the structure for system configuration, user preferences,
 * business rules, and administrative settings.
 */

export interface SystemSettings {
  id: string
  category: SettingsCategory
  key: string
  value: any
  label: string
  description?: string
  type: SettingsType
  options?: SettingsOption[]
  validation?: ValidationRule[]
  is_public: boolean
  is_required: boolean
  default_value: any
  updated_by?: string
  updated_at: string
  created_at: string
}

export type SettingsCategory = 
  | 'general'           // 常规设置
  | 'business'          // 业务规则
  | 'security'          // 安全设置
  | 'notification'      // 通知设置
  | 'integration'       // 集成设置
  | 'appearance'        // 外观设置
  | 'backup'            // 备份设置
  | 'maintenance'       // 维护设置

export type SettingsType = 
  | 'string'
  | 'number'
  | 'boolean'
  | 'select'
  | 'multiselect'
  | 'json'
  | 'password'
  | 'email'
  | 'url'
  | 'color'
  | 'file'

export interface SettingsOption {
  value: any
  label: string
  description?: string
  disabled?: boolean
}

export interface ValidationRule {
  type: 'required' | 'min' | 'max' | 'pattern' | 'custom'
  value?: any
  message: string
}

export interface SettingsGroup {
  category: SettingsCategory
  title: string
  description: string
  icon: string
  settings: SystemSettings[]
  permissions?: string[]
}

// Business Rules Settings
export interface BusinessRuleSettings {
  // Pricing settings
  default_tax_rate: number
  max_discount_percentage: number
  min_quote_amount: number
  max_quote_amount: number
  default_currency: string
  price_precision: number
  
  // Quote settings
  quote_validity_days: number
  auto_quote_numbering: boolean
  quote_number_prefix: string
  require_customer_approval: boolean
  max_quote_items: number
  
  // Customer settings
  default_payment_terms: string
  max_credit_limit: number
  customer_approval_required: boolean
  duplicate_customer_check: boolean
  
  // Product settings
  low_stock_threshold: number
  auto_reorder_enabled: boolean
  product_approval_required: boolean
  allow_negative_stock: boolean
}

// Security Settings
export interface SecuritySettings {
  // Authentication
  password_min_length: number
  password_require_uppercase: boolean
  password_require_lowercase: boolean
  password_require_numbers: boolean
  password_require_symbols: boolean
  password_expiry_days: number
  max_login_attempts: number
  lockout_duration_minutes: number
  
  // Session management
  session_timeout_minutes: number
  remember_me_enabled: boolean
  concurrent_sessions_allowed: number
  force_logout_on_password_change: boolean
  
  // Two-factor authentication
  two_factor_enabled: boolean
  two_factor_required_roles: string[]
  backup_codes_enabled: boolean
  
  // Audit and monitoring
  login_audit_enabled: boolean
  action_audit_enabled: boolean
  failed_login_notification: boolean
  suspicious_activity_detection: boolean
}

// Notification Settings
export interface NotificationSettings {
  // Email notifications
  email_enabled: boolean
  smtp_host: string
  smtp_port: number
  smtp_username: string
  smtp_password: string
  smtp_encryption: 'none' | 'tls' | 'ssl'
  from_email: string
  from_name: string
  
  // Notification types
  quote_created_notification: boolean
  quote_approved_notification: boolean
  quote_rejected_notification: boolean
  low_stock_notification: boolean
  new_user_notification: boolean
  system_error_notification: boolean
  
  // Recipients
  admin_notification_emails: string[]
  error_notification_emails: string[]
  
  // In-app notifications
  push_notifications_enabled: boolean
  notification_sound_enabled: boolean
  notification_auto_dismiss: boolean
  notification_retention_days: number
}

// Integration Settings
export interface IntegrationSettings {
  // API settings
  api_rate_limit: number
  api_key_expiry_days: number
  webhook_enabled: boolean
  webhook_urls: string[]
  webhook_secret: string
  
  // Third-party integrations
  google_analytics_id?: string
  sentry_dsn?: string
  monitoring_enabled: boolean
  
  // External services
  sms_provider: 'none' | 'twilio' | 'aliyun'
  sms_api_key?: string
  sms_api_secret?: string
  
  // File storage
  file_storage_provider: 'local' | 'supabase' | 'aws' | 'aliyun'
  max_file_size_mb: number
  allowed_file_types: string[]
  auto_cleanup_days: number
}

// Backup Settings
export interface BackupSettings {
  // Automatic backup
  auto_backup_enabled: boolean
  backup_frequency: 'daily' | 'weekly' | 'monthly'
  backup_time: string
  backup_retention_days: number
  
  // Backup location
  backup_location: 'local' | 'cloud'
  backup_encryption_enabled: boolean
  backup_compression_enabled: boolean
  
  // Backup notifications
  backup_success_notification: boolean
  backup_failure_notification: boolean
  backup_notification_emails: string[]
  
  // Restore settings
  point_in_time_recovery: boolean
  max_restore_points: number
}

// Appearance Settings
export interface AppearanceSettings {
  // Branding
  company_name: string
  company_logo_url?: string
  company_favicon_url?: string
  brand_primary_color: string
  brand_secondary_color: string
  
  // Theme
  default_theme: 'light' | 'dark' | 'auto'
  allow_theme_switching: boolean
  
  // Layout
  sidebar_collapsed_default: boolean
  page_size_options: number[]
  default_page_size: number
  
  // Localization
  default_language: string
  supported_languages: string[]
  timezone: string
  date_format: string
  time_format: '12h' | '24h'
  currency_format: string
}

// Settings form data
export interface SettingsFormData {
  general?: Partial<SystemSettings>[]
  business?: Partial<BusinessRuleSettings>
  security?: Partial<SecuritySettings>
  notification?: Partial<NotificationSettings>
  integration?: Partial<IntegrationSettings>
  backup?: Partial<BackupSettings>
  appearance?: Partial<AppearanceSettings>
}

// Settings validation result
export interface SettingsValidationResult {
  isValid: boolean
  errors: Record<string, string[]>
  warnings: Record<string, string[]>
}

// Settings import/export
export interface SettingsExportData {
  version: string
  exported_at: string
  exported_by: string
  categories: SettingsCategory[]
  settings: SystemSettings[]
  checksum: string
}

export interface SettingsImportResult {
  success: boolean
  imported_count: number
  skipped_count: number
  error_count: number
  errors: string[]
  warnings: string[]
}

// Settings change history
export interface SettingsChangeHistory {
  id: string
  setting_key: string
  old_value: any
  new_value: any
  changed_by: string
  changed_at: string
  reason?: string
  ip_address?: string
  user_agent?: string
}

// Default settings configurations
export const DEFAULT_BUSINESS_RULES: BusinessRuleSettings = {
  default_tax_rate: 0.13,
  max_discount_percentage: 20,
  min_quote_amount: 1,
  max_quote_amount: 1000000,
  default_currency: 'CNY',
  price_precision: 2,
  quote_validity_days: 30,
  auto_quote_numbering: true,
  quote_number_prefix: 'Q',
  require_customer_approval: false,
  max_quote_items: 50,
  default_payment_terms: '30_days',
  max_credit_limit: 500000,
  customer_approval_required: false,
  duplicate_customer_check: true,
  low_stock_threshold: 10,
  auto_reorder_enabled: false,
  product_approval_required: false,
  allow_negative_stock: false
}

export const DEFAULT_SECURITY_SETTINGS: SecuritySettings = {
  password_min_length: 8,
  password_require_uppercase: true,
  password_require_lowercase: true,
  password_require_numbers: true,
  password_require_symbols: false,
  password_expiry_days: 90,
  max_login_attempts: 5,
  lockout_duration_minutes: 15,
  session_timeout_minutes: 480,
  remember_me_enabled: true,
  concurrent_sessions_allowed: 3,
  force_logout_on_password_change: true,
  two_factor_enabled: false,
  two_factor_required_roles: ['admin'],
  backup_codes_enabled: false,
  login_audit_enabled: true,
  action_audit_enabled: true,
  failed_login_notification: true,
  suspicious_activity_detection: true
}

export const SETTINGS_CATEGORIES: Record<SettingsCategory, { title: string; description: string; icon: string }> = {
  general: {
    title: '常规设置',
    description: '系统基本配置和常规选项',
    icon: '⚙️'
  },
  business: {
    title: '业务规则',
    description: '业务流程、定价和报价规则配置',
    icon: '💼'
  },
  security: {
    title: '安全设置',
    description: '用户认证、权限和安全策略配置',
    icon: '🔒'
  },
  notification: {
    title: '通知设置',
    description: '邮件、短信和系统通知配置',
    icon: '🔔'
  },
  integration: {
    title: '集成设置',
    description: '第三方服务和API集成配置',
    icon: '🔗'
  },
  appearance: {
    title: '外观设置',
    description: '界面主题、品牌和本地化设置',
    icon: '🎨'
  },
  backup: {
    title: '备份设置',
    description: '数据备份和恢复策略配置',
    icon: '💾'
  },
  maintenance: {
    title: '维护设置',
    description: '系统维护和性能优化配置',
    icon: '🔧'
  }
}