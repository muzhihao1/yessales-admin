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
    setPageSize
  }
})
