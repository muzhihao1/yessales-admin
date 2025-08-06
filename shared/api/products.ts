import { supabase, handleError, getPaginationParams } from './client'
import type { Product, ProductSKU } from '../types/models'
import type { ApiResponse, ProductListParams } from '../types/api'

export const productsApi = {
  /**
   * 获取产品列表
   */
  async getProducts(params: ProductListParams = {}): Promise<ApiResponse<Product[]>> {
    try {
      const { page = 1, page_size = 20, category, is_active, search, sort_by = 'created_at', sort_order = 'desc' } = params
      const { from, to } = getPaginationParams(page, page_size)

      let query = supabase
        .from('products')
        .select('*, product_skus(*)', { count: 'exact' })
        .range(from, to)
        .order(sort_by, { ascending: sort_order === 'asc' })

      // 应用过滤条件
      if (category) {
        query = query.eq('category', category)
      }
      if (is_active !== undefined) {
        query = query.eq('is_active', is_active)
      }
      if (search) {
        query = query.or(`name.ilike.%${search}%,model.ilike.%${search}%`)
      }

      const { data, error, count } = await query

      if (error) throw error

      return {
        success: true,
        data: data as Product[],
        pagination: {
          page,
          page_size,
          total: count || 0
        }
      }
    } catch (error) {
      return handleError(error)
    }
  },

  /**
   * 获取产品详情
   */
  async getProduct(id: string): Promise<ApiResponse<Product>> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, product_skus(*)')
        .eq('id', id)
        .single()

      if (error) throw error

      return {
        success: true,
        data: data as Product
      }
    } catch (error) {
      return handleError(error)
    }
  },

  /**
   * 创建产品
   */
  async createProduct(product: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<Product>> {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert(product)
        .select()
        .single()

      if (error) throw error

      return {
        success: true,
        data: data as Product
      }
    } catch (error) {
      return handleError(error)
    }
  },

  /**
   * 更新产品
   */
  async updateProduct(id: string, updates: Partial<Product>): Promise<ApiResponse<Product>> {
    try {
      const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      return {
        success: true,
        data: data as Product
      }
    } catch (error) {
      return handleError(error)
    }
  },

  /**
   * 删除产品（软删除）
   */
  async deleteProduct(id: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: false })
        .eq('id', id)

      if (error) throw error

      return {
        success: true
      }
    } catch (error) {
      return handleError(error)
    }
  },

  /**
   * 获取产品SKU列表
   */
  async getProductSKUs(productId: string): Promise<ApiResponse<ProductSKU[]>> {
    try {
      const { data, error } = await supabase
        .from('product_skus')
        .select('*')
        .eq('product_id', productId)
        .eq('is_active', true)
        .order('price', { ascending: true })

      if (error) throw error

      return {
        success: true,
        data: data as ProductSKU[]
      }
    } catch (error) {
      return handleError(error)
    }
  },

  /**
   * 创建产品SKU
   */
  async createProductSKU(sku: Omit<ProductSKU, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<ProductSKU>> {
    try {
      const { data, error } = await supabase
        .from('product_skus')
        .insert(sku)
        .select()
        .single()

      if (error) throw error

      return {
        success: true,
        data: data as ProductSKU
      }
    } catch (error) {
      return handleError(error)
    }
  },

  /**
   * 更新产品SKU
   */
  async updateProductSKU(id: string, updates: Partial<ProductSKU>): Promise<ApiResponse<ProductSKU>> {
    try {
      const { data, error } = await supabase
        .from('product_skus')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      return {
        success: true,
        data: data as ProductSKU
      }
    } catch (error) {
      return handleError(error)
    }
  },

  /**
   * 批量导入产品
   */
  async importProducts(products: Array<Omit<Product, 'id' | 'created_at' | 'updated_at'>>): Promise<ApiResponse<Product[]>> {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert(products)
        .select()

      if (error) throw error

      return {
        success: true,
        data: data as Product[]
      }
    } catch (error) {
      return handleError(error)
    }
  },

  /**
   * 获取产品分类列表
   */
  async getCategories(): Promise<ApiResponse<string[]>> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('category')
        .eq('is_active', true)

      if (error) throw error

      // 去重
      const categories = [...new Set(data.map(item => item.category))].filter(Boolean)

      return {
        success: true,
        data: categories
      }
    } catch (error) {
      return handleError(error)
    }
  }
}