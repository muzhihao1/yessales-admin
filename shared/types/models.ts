// 客户模型
export interface Customer {
  id: string;
  name: string;
  phone: string;
  wechat?: string;
  address?: string;
  remark?: string;
  created_at: string;
  updated_at: string;
}

// 产品模型
export interface Product {
  id: string;
  name: string;
  model: string;
  category: string;
  price: number;
  unit: string;
  image_url?: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  skus?: ProductSKU[];
}

// 产品SKU模型
export interface ProductSKU {
  id: string;
  product_id: string;
  spec?: string;
  color?: string;
  price: number;
  stock: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// 配件模型
export interface Accessory {
  id: string;
  name: string;
  price: number;
  unit: string;
  image_url?: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// 用户模型
export interface User {
  id: string;
  username: string;
  role: 'admin' | 'sales';
  name: string;
  phone?: string;
  is_active: boolean;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
}

// 报价单模型
export interface Quote {
  id: string;
  quote_no: string;
  customer_id: string;
  sales_id?: string;
  total_price: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  remark?: string;
  created_at: string;
  updated_at: string;
  // 关联数据
  customer?: Customer;
  sales?: User;
  items?: QuoteItem[];
}

// 报价单明细模型
export interface QuoteItem {
  id: string;
  quote_id: string;
  product_id?: string;
  product_sku_id?: string;
  accessory_id?: string;
  type: 'product' | 'accessory';
  name: string;
  model?: string;
  spec?: string;
  unit_price: number;
  quantity: number;
  total_price: number;
  image_url?: string;
  created_at: string;
}

// 操作日志模型
export interface OperationLog {
  id: string;
  user_id?: string;
  action: string;
  target_type: string;
  target_id?: string;
  detail?: any;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  user?: User;
}