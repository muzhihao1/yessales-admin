import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { ProductsApi } from '@/api/products'
import type { Accessory, Product, ProductSku } from '@/types/models'
import type { QueryParams } from '@/types/api'

export const useProductsStore = defineStore('products', () => {
  // State
  const products = ref<Product[]>([])
  const accessories = ref<Accessory[]>([])
  const currentProduct = ref<Product | null>(null)
  const currentAccessory = ref<Accessory | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Pagination
  const currentPage = ref(1)
  const pageSize = ref(20)
  const total = ref(0)

  // Filters
  const searchKeyword = ref('')
  const categoryFilter = ref<string>('')
  const statusFilter = ref<boolean | null>(null)

  // Getters
  const totalPages = computed(() => Math.ceil(total.value / pageSize.value))

  const activeProducts = computed(() => products.value.filter(p => p.is_active))

  const productCategories = computed(() => {
    const categories = new Set<string>()
    products.value.forEach(p => {
      if (p.category) categories.add(p.category)
    })
    return Array.from(categories).sort()
  })

  const filteredProducts = computed(() => {
    let result = [...products.value]

    // 关键词搜索
    if (searchKeyword.value) {
      const keyword = searchKeyword.value.toLowerCase()
      result = result.filter(
        p =>
          p.name.toLowerCase().includes(keyword) ||
          p.model.toLowerCase().includes(keyword) ||
          p.description?.toLowerCase().includes(keyword)
      )
    }

    // 分类筛选
    if (categoryFilter.value) {
      result = result.filter(p => p.category === categoryFilter.value)
    }

    // 状态筛选
    if (statusFilter.value !== null) {
      result = result.filter(p => p.is_active === statusFilter.value)
    }

    return result
  })

  // Actions
  async function fetchProducts(params?: QueryParams) {
    isLoading.value = true
    error.value = null

    try {
      const queryParams: QueryParams = {
        page: currentPage.value,
        page_size: pageSize.value,
        ...params
      }

      const response = await ProductsApi.getProducts(queryParams)

      if (response.success && response.data) {
        products.value = response.data
        total.value = response.pagination?.total || response.data.length
      } else {
        error.value = response.error?.message || '获取产品列表失败'
      }
    } catch (err) {
      error.value = '网络错误，请稍后重试'
      console.error('Fetch products error:', err)
    } finally {
      isLoading.value = false
    }
  }

  async function fetchProduct(id: string) {
    isLoading.value = true
    error.value = null

    try {
      const response = await ProductsApi.getProduct(id)

      if (response.success && response.data) {
        currentProduct.value = response.data
        return response.data
      } else {
        error.value = response.error?.message || '获取产品详情失败'
        return null
      }
    } catch (err) {
      error.value = '网络错误，请稍后重试'
      console.error('Fetch product error:', err)
      return null
    } finally {
      isLoading.value = false
    }
  }

  async function createProduct(product: Partial<Product>) {
    isLoading.value = true
    error.value = null

    try {
      const response = await ProductsApi.createProduct(product)

      if (response.success && response.data) {
        products.value.unshift(response.data)
        total.value++
        return { success: true, data: response.data }
      } else {
        error.value = response.error?.message || '创建产品失败'
        return { success: false, error: error.value }
      }
    } catch (err) {
      error.value = '网络错误，请稍后重试'
      console.error('Create product error:', err)
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  async function updateProduct(id: string, product: Partial<Product>) {
    isLoading.value = true
    error.value = null

    try {
      const response = await ProductsApi.updateProduct(id, product)

      if (response.success && response.data) {
        const index = products.value.findIndex(p => p.id === id)
        if (index > -1) {
          products.value[index] = response.data
        }
        if (currentProduct.value?.id === id) {
          currentProduct.value = response.data
        }
        return { success: true, data: response.data }
      } else {
        error.value = response.error?.message || '更新产品失败'
        return { success: false, error: error.value }
      }
    } catch (err) {
      error.value = '网络错误，请稍后重试'
      console.error('Update product error:', err)
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  async function deleteProduct(id: string) {
    isLoading.value = true
    error.value = null

    try {
      const response = await ProductsApi.deleteProduct(id)

      if (response.success) {
        products.value = products.value.filter(p => p.id !== id)
        total.value--
        return { success: true }
      } else {
        error.value = response.error?.message || '删除产品失败'
        return { success: false, error: error.value }
      }
    } catch (err) {
      error.value = '网络错误，请稍后重试'
      console.error('Delete product error:', err)
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  // 配件相关方法
  async function fetchAccessories(params?: QueryParams) {
    isLoading.value = true
    error.value = null

    try {
      const response = await ProductsApi.getAccessories(params)

      if (response.success && response.data) {
        accessories.value = response.data
      } else {
        error.value = response.error?.message || '获取配件列表失败'
      }
    } catch (err) {
      error.value = '网络错误，请稍后重试'
      console.error('Fetch accessories error:', err)
    } finally {
      isLoading.value = false
    }
  }

  async function searchProducts(keyword: string) {
    if (!keyword.trim()) {
      return { success: true, data: [] }
    }

    isLoading.value = true
    error.value = null

    try {
      const response = await ProductsApi.searchProducts(keyword)

      if (response.success) {
        return { success: true, data: response.data || [] }
      } else {
        error.value = response.error?.message || '搜索产品失败'
        return { success: false, error: error.value, data: [] }
      }
    } catch (err) {
      error.value = '网络错误，请稍后重试'
      console.error('Search products error:', err)
      return { success: false, error: error.value, data: [] }
    } finally {
      isLoading.value = false
    }
  }

  // 工具方法
  function resetFilters() {
    searchKeyword.value = ''
    categoryFilter.value = ''
    statusFilter.value = null
    currentPage.value = 1
  }

  function setPage(page: number) {
    currentPage.value = page
    fetchProducts()
  }

  function setPageSize(size: number) {
    pageSize.value = size
    currentPage.value = 1
    fetchProducts()
  }

  // 批量导出产品
  async function exportProducts(productIds?: string[]) {
    isLoading.value = true
    error.value = null

    try {
      const productsToExport = productIds 
        ? products.value.filter(p => productIds.includes(p.id))
        : products.value

      // 构建CSV内容
      const headers = ['产品名称', '型号', '分类', '价格', '单位', '状态', '创建时间']
      const csvContent = [
        headers.join(','),
        ...productsToExport.map(product => [
          `"${product.name}"`,
          `"${product.model}"`,
          `"${product.category}"`,
          product.price.toString(),
          `"${product.unit}"`,
          product.is_active ? '启用' : '禁用',
          new Date(product.created_at || '').toLocaleDateString()
        ].join(','))
      ].join('\n')

      // 创建下载链接
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `products_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      return { success: true }
    } catch (err) {
      error.value = '导出产品数据失败'
      console.error('Export products error:', err)
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  // 批量更新状态
  async function batchUpdateStatus(productIds: string[], isActive: boolean) {
    isLoading.value = true
    error.value = null

    try {
      const updatePromises = productIds.map(id => 
        ProductsApi.updateProduct(id, { is_active: isActive })
      )

      const results = await Promise.allSettled(updatePromises)
      const successes = results.filter(r => r.status === 'fulfilled').length
      const failures = results.length - successes

      // 更新本地状态
      products.value = products.value.map(product => 
        productIds.includes(product.id) 
          ? { ...product, is_active: isActive }
          : product
      )

      if (failures === 0) {
        return { success: true, message: `成功更新 ${successes} 个产品状态` }
      } else {
        return { 
          success: false, 
          error: `${successes} 个成功，${failures} 个失败`,
          partial: true
        }
      }
    } catch (err) {
      error.value = '批量更新状态失败'
      console.error('Batch update status error:', err)
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  // 批量删除产品
  async function batchDeleteProducts(productIds: string[]) {
    isLoading.value = true
    error.value = null

    try {
      const deletePromises = productIds.map(id => ProductsApi.deleteProduct(id))
      const results = await Promise.allSettled(deletePromises)
      const successes = results.filter(r => r.status === 'fulfilled').length
      const failures = results.length - successes

      // 更新本地状态 - 移除成功删除的产品
      products.value = products.value.filter(product => !productIds.includes(product.id))
      total.value -= successes

      if (failures === 0) {
        return { success: true, message: `成功删除 ${successes} 个产品` }
      } else {
        return { 
          success: false, 
          error: `${successes} 个成功，${failures} 个失败`,
          partial: true
        }
      }
    } catch (err) {
      error.value = '批量删除产品失败'
      console.error('Batch delete products error:', err)
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  return {
    // State
    products,
    accessories,
    currentProduct,
    currentAccessory,
    isLoading,
    error,

    // Pagination
    currentPage,
    pageSize,
    total,
    totalPages,

    // Filters
    searchKeyword,
    categoryFilter,
    statusFilter,

    // Getters
    activeProducts,
    productCategories,
    filteredProducts,

    // Actions
    fetchProducts,
    fetchProduct,
    createProduct,
    updateProduct,
    deleteProduct,
    fetchAccessories,
    searchProducts,
    resetFilters,
    setPage,
    setPageSize,
    exportProducts,
    batchUpdateStatus,
    batchDeleteProducts
  }
})
