export interface Customer {
  id: string
  name: string
  phone: string
  email?: string
  wechat?: string
  wechat_id?: string // Alias for wechat for compatibility
  address?: string
  remark?: string
  assigned_to?: string
  credit_limit?: number
  // Additional business properties for validation
  customer_type?: 'direct' | 'distributor' | 'partner' | 'online'
  status?: 'active' | 'inactive' | 'prospect' | 'lost'
  priority_level?: 'low' | 'medium' | 'high' | 'critical'
  payment_terms?: 'cash' | '15_days' | '30_days' | '60_days' | '90_days'
  industry?: string
  company_size?: string
  location?: string
  created_at: string
  updated_at?: string
}

export interface Product {
  id: string
  name: string
  sku?: string // SKU code for validation
  model: string
  category: string
  categoryId?: string // For compatibility with components expecting categoryId
  price: number
  cost?: number // Product cost for validation
  unit: string
  image?: string // Alias for image_url
  image_url?: string
  description?: string
  is_active: boolean
  isNew?: boolean // For marking new products
  stock_quantity?: number
  stock?: number // Alias for stock_quantity for component compatibility
  min_stock_level?: number // Minimum stock level for validation
  status?: 'active' | 'inactive' | 'discontinued'
  skuOptions?: Array<{ id: string; name: string; price: number }> // For product selector compatibility
  features?: string[] // Product features list
  rating?: number // Product rating (0-5)
  originalPrice?: number // Original price before discount
  specifications?: Record<string, string> // Product specifications
  // Additional validation properties
  brand?: string
  supplier?: string
  warranty_period?: number // Warranty period in months
  created_at: string
  updated_at?: string
  skus?: ProductSku[]
}

export interface ProductSku {
  id: string
  product_id: string
  spec?: string
  color?: string
  price: number
  stock: number
  is_active: boolean
  created_at: string
  updated_at?: string
}

export interface Accessory {
  id: string
  name: string
  price: number
  unit: string
  image_url?: string
  description?: string
  is_active: boolean
  created_at: string
  updated_at?: string
}

export interface User {
  id: string
  username: string
  email?: string
  role: 'admin' | 'sales'
  name: string
  phone?: string
  is_active: boolean
  last_login_at?: string
  created_at: string
  updated_at?: string
}

export interface Quote {
  id: string
  quote_no: string
  quote_number?: string // Alias for quote_no for compatibility
  customer_id: string
  sales_id?: string
  total_price: number
  tax_amount?: number
  final_amount?: number
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'completed'
  valid_until?: string
  created_by?: string
  approved_by?: string
  notes?: string
  remark?: string
  created_at: string
  updated_at?: string
  customer?: Customer
  sales?: User
  items?: QuoteItem[]
}

export interface QuoteItem {
  id?: string
  quote_id?: string
  product_id?: string
  product_sku_id?: string
  accessory_id?: string
  type: 'product' | 'accessory'
  name: string
  model?: string
  spec?: string
  unit_price: number
  quantity: number
  total_price: number
  image_url?: string
  created_at?: string
}

export interface OperationLog {
  id: string
  user_id?: string
  action: string
  target_type: string
  target_id?: string
  detail?: any
  ip_address?: string
  user_agent?: string
  created_at: string
}
