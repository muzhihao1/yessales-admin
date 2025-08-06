// API 响应格式
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    field?: string;
  };
  pagination?: {
    page: number;
    page_size: number;
    total: number;
  };
}

// 分页请求参数
export interface PaginationParams {
  page?: number;
  page_size?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

// 产品列表请求参数
export interface ProductListParams extends PaginationParams {
  category?: string;
  is_active?: boolean;
  search?: string;
}

// 报价单列表请求参数
export interface QuoteListParams extends PaginationParams {
  status?: 'pending' | 'approved' | 'rejected' | 'completed';
  customer_id?: string;
  sales_id?: string;
  start_date?: string;
  end_date?: string;
  search?: string;
}

// 创建报价单请求
export interface CreateQuoteRequest {
  customer_id?: string;
  customer?: {
    name: string;
    phone: string;
    wechat?: string;
    address?: string;
    remark?: string;
  };
  items: Array<{
    type: 'product' | 'accessory';
    product_id?: string;
    product_sku_id?: string;
    accessory_id?: string;
    name: string;
    model?: string;
    spec?: string;
    unit_price: number;
    quantity: number;
    total_price: number;
  }>;
  remark?: string;
}

// 更新报价单请求
export interface UpdateQuoteRequest {
  status?: 'pending' | 'approved' | 'rejected' | 'completed';
  remark?: string;
  items?: CreateQuoteRequest['items'];
}

// 登录请求
export interface LoginRequest {
  username: string;
  password: string;
}

// 登录响应
export interface LoginResponse {
  token: string;
  user: {
    id: string;
    username: string;
    role: 'admin' | 'sales';
    name: string;
  };
}

// 创建用户请求
export interface CreateUserRequest {
  username: string;
  password: string;
  role: 'admin' | 'sales';
  name: string;
  phone?: string;
}

// 文件上传响应
export interface FileUploadResponse {
  url: string;
  filename: string;
  size: number;
}

// 统计数据响应
export interface StatisticsResponse {
  quotes_count: number;
  quotes_amount: number;
  products_count: number;
  customers_count: number;
  monthly_trend: Array<{
    month: string;
    count: number;
    amount: number;
  }>;
  category_distribution: Array<{
    category: string;
    count: number;
    amount: number;
  }>;
}

// 错误代码枚举
export enum ErrorCode {
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  INVALID_INPUT = 'INVALID_INPUT',
  DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',
  SERVER_ERROR = 'SERVER_ERROR'
}