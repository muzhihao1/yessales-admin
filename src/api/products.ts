import ApiClient from './client'
import { supabase } from './config'
import type { Accessory, Product, ProductSku } from '@/types/models'
import type { ApiResponse, QueryParams } from '@/types/api'

export class ProductsApi {
  static async getProducts(params?: QueryParams): Promise<ApiResponse<Product[]>> {
    return ApiClient.request<Product[]>('GET', 'products', {
      query: {
        ...params,
        is_active: true
      },
      select: '*, skus:product_skus(*)'
    })
  }

  static async getProduct(id: string): Promise<ApiResponse<Product>> {
    return ApiClient.request<Product>('GET', 'products', {
      id,
      select: '*, skus:product_skus(*)'
    })
  }

  static async createProduct(product: Partial<Product>): Promise<ApiResponse<Product>> {
    return ApiClient.request<Product>('POST', 'products', {
      data: product
    })
  }

  static async updateProduct(id: string, product: Partial<Product>): Promise<ApiResponse<Product>> {
    return ApiClient.request<Product>('PUT', 'products', {
      id,
      data: {
        ...product,
        updated_at: new Date().toISOString()
      }
    })
  }

  static async deleteProduct(id: string): Promise<ApiResponse> {
    return ApiClient.request('DELETE', 'products', { id })
  }

  static async getProductSkus(productId: string): Promise<ApiResponse<ProductSku[]>> {
    return ApiClient.request<ProductSku[]>('GET', 'product_skus', {
      query: {
        product_id: productId,
        is_active: true
      }
    })
  }

  static async getAccessories(params?: QueryParams): Promise<ApiResponse<Accessory[]>> {
    return ApiClient.request<Accessory[]>('GET', 'accessories', {
      query: {
        ...params,
        is_active: true
      }
    })
  }

  static async getAccessory(id: string): Promise<ApiResponse<Accessory>> {
    return ApiClient.request<Accessory>('GET', 'accessories', { id })
  }

  static async createAccessory(accessory: Partial<Accessory>): Promise<ApiResponse<Accessory>> {
    return ApiClient.request<Accessory>('POST', 'accessories', {
      data: accessory
    })
  }

  static async updateAccessory(
    id: string,
    accessory: Partial<Accessory>
  ): Promise<ApiResponse<Accessory>> {
    return ApiClient.request<Accessory>('PUT', 'accessories', {
      id,
      data: {
        ...accessory,
        updated_at: new Date().toISOString()
      }
    })
  }

  static async deleteAccessory(id: string): Promise<ApiResponse> {
    return ApiClient.request('DELETE', 'accessories', { id })
  }

  static async searchProducts(keyword: string): Promise<ApiResponse<Product[]>> {
    const { data, error } = await supabase
      .from('products')
      .select('*, skus:product_skus(*)')
      .or(`name.ilike.%${keyword}%,model.ilike.%${keyword}%`)
      .eq('is_active', true)
      .limit(20)

    if (error) {
      return ApiClient.handleError(error)
    }

    return {
      success: true,
      data: data || []
    }
  }
}

export default ProductsApi
