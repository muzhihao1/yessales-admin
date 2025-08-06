// 由 Supabase CLI 生成的数据库类型
export type Database = {
  public: {
    Tables: {
      customers: {
        Row: {
          id: string
          name: string
          phone: string
          wechat: string | null
          address: string | null
          remark: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          phone: string
          wechat?: string | null
          address?: string | null
          remark?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          phone?: string
          wechat?: string | null
          address?: string | null
          remark?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          name: string
          model: string
          category: string
          price: number
          unit: string
          image_url: string | null
          description: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          model: string
          category: string
          price?: number
          unit?: string
          image_url?: string | null
          description?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          model?: string
          category?: string
          price?: number
          unit?: string
          image_url?: string | null
          description?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      product_skus: {
        Row: {
          id: string
          product_id: string
          spec: string | null
          color: string | null
          price: number
          stock: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          product_id: string
          spec?: string | null
          color?: string | null
          price: number
          stock?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          spec?: string | null
          color?: string | null
          price?: number
          stock?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      accessories: {
        Row: {
          id: string
          name: string
          price: number
          unit: string
          image_url: string | null
          description: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          price?: number
          unit?: string
          image_url?: string | null
          description?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          price?: number
          unit?: string
          image_url?: string | null
          description?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          username: string
          password_hash: string
          role: 'admin' | 'sales'
          name: string
          phone: string | null
          is_active: boolean
          last_login_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          username: string
          password_hash: string
          role: 'admin' | 'sales'
          name: string
          phone?: string | null
          is_active?: boolean
          last_login_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          password_hash?: string
          role?: 'admin' | 'sales'
          name?: string
          phone?: string | null
          is_active?: boolean
          last_login_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      quotes: {
        Row: {
          id: string
          quote_no: string
          customer_id: string
          sales_id: string | null
          total_price: number
          status: 'pending' | 'approved' | 'rejected' | 'completed'
          remark: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          quote_no: string
          customer_id: string
          sales_id?: string | null
          total_price?: number
          status?: 'pending' | 'approved' | 'rejected' | 'completed'
          remark?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          quote_no?: string
          customer_id?: string
          sales_id?: string | null
          total_price?: number
          status?: 'pending' | 'approved' | 'rejected' | 'completed'
          remark?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      quote_items: {
        Row: {
          id: string
          quote_id: string
          product_id: string | null
          product_sku_id: string | null
          accessory_id: string | null
          type: 'product' | 'accessory'
          name: string
          model: string | null
          spec: string | null
          unit_price: number
          quantity: number
          total_price: number
          image_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          quote_id: string
          product_id?: string | null
          product_sku_id?: string | null
          accessory_id?: string | null
          type: 'product' | 'accessory'
          name: string
          model?: string | null
          spec?: string | null
          unit_price: number
          quantity?: number
          total_price: number
          image_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          quote_id?: string
          product_id?: string | null
          product_sku_id?: string | null
          accessory_id?: string | null
          type?: 'product' | 'accessory'
          name?: string
          model?: string | null
          spec?: string | null
          unit_price?: number
          quantity?: number
          total_price?: number
          image_url?: string | null
          created_at?: string
        }
      }
      operation_logs: {
        Row: {
          id: string
          user_id: string | null
          action: string
          target_type: string
          target_id: string | null
          detail: any | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          action: string
          target_type: string
          target_id?: string | null
          detail?: any | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          action?: string
          target_type?: string
          target_id?: string | null
          detail?: any | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}