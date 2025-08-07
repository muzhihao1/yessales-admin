export interface Customer {
  id: string;
  name: string;
  phone: string;
  wechat?: string;
  address?: string;
  remark?: string;
  created_at: string;
  updated_at?: string;
}

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
  updated_at?: string;
  skus?: ProductSku[];
}

export interface ProductSku {
  id: string;
  product_id: string;
  spec?: string;
  color?: string;
  price: number;
  stock: number;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface Accessory {
  id: string;
  name: string;
  price: number;
  unit: string;
  image_url?: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface User {
  id: string;
  username: string;
  role: 'admin' | 'sales';
  name: string;
  phone?: string;
  is_active: boolean;
  last_login_at?: string;
  created_at: string;
  updated_at?: string;
}

export interface Quote {
  id: string;
  quote_no: string;
  customer_id: string;
  sales_id?: string;
  total_price: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  remark?: string;
  created_at: string;
  updated_at?: string;
  customer?: Customer;
  sales?: User;
  items?: QuoteItem[];
}

export interface QuoteItem {
  id?: string;
  quote_id?: string;
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
  created_at?: string;
}

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
}