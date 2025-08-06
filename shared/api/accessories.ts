import { supabase, handleError, getPaginationParams } from './client'
import type { Accessory } from '../types/models'
import type { ApiResponse, PaginationParams } from '../types/api'

export const accessoriesApi = {
  /**
   * 获取配件列表
   */
  async getAccessories(params: PaginationParams & { search?: string } = {}): Promise<ApiResponse<Accessory[]>> {
    try {
      const { page = 1, page_size = 20, search, sort_by = 'created_at', sort_order = 'desc' } = params
      const { from, to } = getPaginationParams(page, page_size)

      let query = supabase
        .from('accessories')
        .select('*', { count: 'exact' })
        .eq('is_active', true)
        .range(from, to)
        .order(sort_by, { ascending: sort_order === 'asc' })

      if (search) {
        query = query.ilike('name', `%${search}%`)
      }

      const { data, error, count } = await query

      if (error) throw error

      return {
        success: true,
        data: data as Accessory[],
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
   * 获取配件详情
   */
  async getAccessory(id: string): Promise<ApiResponse<Accessory>> {
    try {
      const { data, error } = await supabase
        .from('accessories')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error

      return {
        success: true,
        data: data as Accessory
      }
    } catch (error) {
      return handleError(error)
    }
  },

  /**
   * 创建配件
   */
  async createAccessory(accessory: Omit<Accessory, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<Accessory>> {
    try {
      const { data, error } = await supabase
        .from('accessories')
        .insert(accessory)
        .select()
        .single()

      if (error) throw error

      return {
        success: true,
        data: data as Accessory
      }
    } catch (error) {
      return handleError(error)
    }
  },

  /**
   * 更新配件
   */
  async updateAccessory(id: string, updates: Partial<Accessory>): Promise<ApiResponse<Accessory>> {
    try {
      const { data, error } = await supabase
        .from('accessories')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      return {
        success: true,
        data: data as Accessory
      }
    } catch (error) {
      return handleError(error)
    }
  },

  /**
   * 删除配件（软删除）
   */
  async deleteAccessory(id: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase
        .from('accessories')
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
   * 批量导入配件
   */
  async importAccessories(accessories: Array<Omit<Accessory, 'id' | 'created_at' | 'updated_at'>>): Promise<ApiResponse<Accessory[]>> {
    try {
      const { data, error } = await supabase
        .from('accessories')
        .insert(accessories)
        .select()

      if (error) throw error

      return {
        success: true,
        data: data as Accessory[]
      }
    } catch (error) {
      return handleError(error)
    }
  },

  /**
   * 获取所有配件（用于选择器）
   */
  async getAllAccessories(): Promise<ApiResponse<Accessory[]>> {
    try {
      const { data, error } = await supabase
        .from('accessories')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (error) throw error

      return {
        success: true,
        data: data as Accessory[]
      }
    } catch (error) {
      return handleError(error)
    }
  }
}