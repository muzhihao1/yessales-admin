export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    field?: string
  }
  pagination?: {
    page: number
    page_size: number
    total: number
  }
}

export interface ApiError {
  code: string
  message: string
  field?: string
}

export interface PaginationParams {
  page?: number
  page_size?: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

export interface QueryParams extends PaginationParams {
  search?: string
  filters?: Record<string, any>
}

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  access_token: string
  token_type: string
  expires_in: number
  refresh_token: string
  user: {
    id: string
    username: string
    role: 'admin' | 'sales'
    name: string
  }
}

export interface CreateQuoteRequest {
  customer: {
    name: string
    phone: string
    wechat?: string
    address?: string
    remark?: string
  }
  items: Array<{
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
  }>
  remark?: string
}

export interface UploadFileResponse {
  url: string
  path: string
  size: number
  type: string
}
