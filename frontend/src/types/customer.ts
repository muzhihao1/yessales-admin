export interface Customer {
  id: string
  name: string
  phone: string
  email?: string
  wechat_id?: string
  company?: string
  // Address information
  address?: string
  city?: string
  district?: string
  // Business information
  customer_type: CustomerType
  status: CustomerStatus
  source: CustomerSource
  // Metadata
  created_at: string
  updated_at: string
  created_by?: string
  // Statistics - calculated fields
  total_quotes?: number
  total_amount?: number
  last_quote_at?: string
  // Additional profile fields
  notes?: string
  birthday?: string
  gender?: 'male' | 'female' | 'other'
  occupation?: string
  // Business specific fields
  business_license?: string
  tax_id?: string
  legal_representative?: string
  // Contact preferences
  preferred_contact_method?: 'phone' | 'wechat' | 'email'
  contact_time_preference?: string
}

export type CustomerType = 'individual' | 'business'

export type CustomerStatus = 'active' | 'inactive' | 'potential' | 'blacklist'

export type CustomerSource = 'walk_in' | 'referral' | 'online' | 'phone' | 'exhibition' | 'other'

export interface CustomerFilters {
  page?: number
  pageSize?: number
  search?: string
  customer_type?: CustomerType
  status?: CustomerStatus
  source?: CustomerSource
  city?: string
  district?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  startDate?: string
  endDate?: string
  // Advanced filters
  hasQuotes?: boolean
  minAmount?: number
  maxAmount?: number
  lastQuoteBefore?: string
  lastQuoteAfter?: string
}

export interface CustomerStatistics {
  total: number
  individual: number
  business: number
  active: number
  inactive: number
  potential: number
  blacklist: number
  // Source statistics
  walk_in: number
  referral: number
  online: number
  phone: number
  exhibition: number
  other: number
  // Business metrics
  total_revenue: number
  average_quote_value: number
  active_customers_with_quotes: number
}

export interface CustomerSummary {
  id: string
  name: string
  phone: string
  customer_type: CustomerType
  status: CustomerStatus
  total_quotes: number
  total_amount: number
  last_quote_at?: string
  created_at: string
}

export interface CreateCustomerData {
  name: string
  phone: string
  email?: string
  wechat_id?: string
  company?: string
  address?: string
  city?: string
  district?: string
  customer_type: CustomerType
  source: CustomerSource
  notes?: string
  birthday?: string
  gender?: 'male' | 'female' | 'other'
  occupation?: string
  // Business specific
  business_license?: string
  tax_id?: string
  legal_representative?: string
  // Contact preferences
  preferred_contact_method?: 'phone' | 'wechat' | 'email'
  contact_time_preference?: string
}

export interface UpdateCustomerData {
  name?: string
  phone?: string
  email?: string
  wechat_id?: string
  company?: string
  address?: string
  city?: string
  district?: string
  customer_type?: CustomerType
  status?: CustomerStatus
  source?: CustomerSource
  notes?: string
  birthday?: string
  gender?: 'male' | 'female' | 'other'
  occupation?: string
  business_license?: string
  tax_id?: string
  legal_representative?: string
  preferred_contact_method?: 'phone' | 'wechat' | 'email'
  contact_time_preference?: string
}

export interface CustomerQuoteSummary {
  id: string
  quote_number: string
  total_amount: number
  status: 'draft' | 'submitted' | 'approved' | 'rejected'
  created_at: string
  items_count: number
}

export interface CustomerActivity {
  id: string
  type: 'quote_created' | 'quote_approved' | 'quote_rejected' | 'customer_updated' | 'contact_made'
  description: string
  created_at: string
  created_by?: string
  metadata?: Record<string, any>
}

export interface CustomerDetail extends Customer {
  quotes: CustomerQuoteSummary[]
  recent_activities: CustomerActivity[]
  created_by_name?: string
  updated_by_name?: string
}

export interface CustomerExportData {
  customer_type?: CustomerType
  status?: CustomerStatus
  source?: CustomerSource
  city?: string
  district?: string
  startDate?: string
  endDate?: string
  includeQuoteHistory?: boolean
  includeActivities?: boolean
  format?: 'csv' | 'excel'
  customerIds?: Array<string | number>
}

// Validation schemas
export interface CustomerValidationRules {
  name: {
    required: boolean
    minLength: number
    maxLength: number
  }
  phone: {
    required: boolean
    pattern: RegExp
  }
  email: {
    required: boolean
    pattern: RegExp
  }
  wechat_id: {
    required: boolean
    minLength: number
    maxLength: number
  }
  company: {
    required: boolean
    maxLength: number
  }
  business_license: {
    required: boolean
    pattern: RegExp
  }
}

// Helper functions type definitions
export type CustomerFormMode = 'create' | 'edit' | 'view'

export interface CustomerFormConfig {
  mode: CustomerFormMode
  showBusinessFields: boolean
  requiredFields: string[]
  readonlyFields: string[]
}
