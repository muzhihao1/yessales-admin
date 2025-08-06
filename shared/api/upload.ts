import { supabase, handleError } from './client'
import type { ApiResponse, FileUploadResponse } from '../types/api'

export const uploadApi = {
  /**
   * 上传图片
   */
  async uploadImage(file: File, folder: string = 'products'): Promise<ApiResponse<FileUploadResponse>> {
    try {
      // 验证文件类型
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
      if (!allowedTypes.includes(file.type)) {
        return {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: `不支持的文件类型。允许的类型：${allowedTypes.join(', ')}`
          }
        }
      }

      // 验证文件大小 (5MB)
      const maxSize = 5 * 1024 * 1024
      if (file.size > maxSize) {
        return {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: '文件大小不能超过 5MB'
          }
        }
      }

      // 创建表单数据
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', folder)

      // 调用 Edge Function
      const { data, error } = await supabase.functions.invoke('upload-image', {
        body: formData
      })

      if (error) throw error

      if (!data.success) {
        throw new Error(data.error.message)
      }

      return {
        success: true,
        data: data.data as FileUploadResponse
      }
    } catch (error) {
      return handleError(error)
    }
  },

  /**
   * 上传多个图片
   */
  async uploadMultipleImages(files: File[], folder: string = 'products'): Promise<ApiResponse<FileUploadResponse[]>> {
    try {
      const uploadPromises = files.map(file => this.uploadImage(file, folder))
      const results = await Promise.all(uploadPromises)

      // 检查是否有上传失败的文件
      const failedUploads = results.filter(result => !result.success)
      if (failedUploads.length > 0) {
        return {
          success: false,
          error: {
            code: 'UPLOAD_ERROR',
            message: `${failedUploads.length} 个文件上传失败`
          }
        }
      }

      const successfulUploads = results.map(result => result.data!).filter(Boolean)

      return {
        success: true,
        data: successfulUploads
      }
    } catch (error) {
      return handleError(error)
    }
  },

  /**
   * 删除图片
   */
  async deleteImage(filePath: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase.storage
        .from('quotation-images')
        .remove([filePath])

      if (error) throw error

      return {
        success: true
      }
    } catch (error) {
      return handleError(error)
    }
  },

  /**
   * 获取图片列表
   */
  async getImages(folder: string = 'products'): Promise<ApiResponse<any[]>> {
    try {
      const { data, error } = await supabase.storage
        .from('quotation-images')
        .list(folder, {
          limit: 100,
          offset: 0,
          sortBy: { column: 'created_at', order: 'desc' }
        })

      if (error) throw error

      // 为每个文件生成公开 URL
      const filesWithUrls = data.map(file => {
        const { data: { publicUrl } } = supabase.storage
          .from('quotation-images')
          .getPublicUrl(`${folder}/${file.name}`)

        return {
          ...file,
          url: publicUrl,
          path: `${folder}/${file.name}`
        }
      })

      return {
        success: true,
        data: filesWithUrls
      }
    } catch (error) {
      return handleError(error)
    }
  },

  /**
   * 获取图片公开 URL
   */
  getPublicUrl(filePath: string): string {
    const { data } = supabase.storage
      .from('quotation-images')
      .getPublicUrl(filePath)

    return data.publicUrl
  },

  /**
   * 批量上传产品图片
   */
  async uploadProductImages(productId: string, files: File[]): Promise<ApiResponse<FileUploadResponse[]>> {
    return this.uploadMultipleImages(files, `products/${productId}`)
  },

  /**
   * 上传报价单图片
   */
  async uploadQuoteImages(quoteId: string, files: File[]): Promise<ApiResponse<FileUploadResponse[]>> {
    return this.uploadMultipleImages(files, `quotes/${quoteId}`)
  }
}