<template>
  <view class="virtual-products-demo-page">
    <AdminLayout>
      <!-- 页面标题 -->
      <view class="page-header">
        <view class="header-left">
          <text class="page-title">产品管理 - 虚拟滚动演示</text>
          <text class="page-subtitle">展示10万+数据的流畅滚动体验</text>
        </view>
        <view class="header-right">
          <button class="admin-btn admin-btn-secondary" @click="toggleVirtualMode">
            {{ virtualEnabled ? '切换到传统模式' : '切换到虚拟滚动' }}
          </button>
          <button class="admin-btn admin-btn-primary" @click="handleCreate">
            <text>+ 添加产品</text>
          </button>
        </view>
      </view>

      <!-- 性能指标显示 -->
      <view class="performance-metrics admin-card">
        <view class="metric-item">
          <text class="metric-label">数据总量:</text>
          <text class="metric-value">{{ totalItems.toLocaleString() }} 条</text>
        </view>
        <view class="metric-item">
          <text class="metric-label">渲染模式:</text>
          <text class="metric-value">{{ virtualEnabled ? '虚拟滚动' : '传统分页' }}</text>
        </view>
        <view class="metric-item">
          <text class="metric-label">DOM节点数:</text>
          <text class="metric-value">{{
            virtualEnabled ? '~50个' : `${Math.min(totalItems, pageSize)}个`
          }}</text>
        </view>
        <view class="metric-item">
          <text class="metric-label">内存使用:</text>
          <text class="metric-value">{{ virtualEnabled ? '固定' : '随数据量增加' }}</text>
        </view>
      </view>

      <!-- 搜索和筛选 -->
      <view class="filter-section admin-card">
        <view class="filter-row">
          <view class="filter-item filter-search">
            <input
              v-model="searchKeyword"
              class="search-input"
              type="text"
              placeholder="搜索产品名称或型号"
              @confirm="handleSearch"
            />
            <button class="search-btn" @click="handleSearch">搜索</button>
          </view>

          <view class="filter-item">
            <picker
              mode="selector"
              :range="categoryOptions"
              :value="categoryIndex"
              @change="handleCategoryChange"
            >
              <view class="filter-picker">
                <text>{{ selectedCategory || '全部分类' }}</text>
                <text class="picker-arrow">▼</text>
              </view>
            </picker>
          </view>

          <button class="filter-reset" @click="handleReset">重置</button>
        </view>
      </view>

      <!-- 虚拟滚动表格 -->
      <view v-if="virtualEnabled" class="virtual-table admin-card">
        <!-- Table Header -->
        <view class="table-header">
          <view class="header-row">
            <view v-if="tableEnhancements.selectedCount.value > 0" class="header-selector">
              <checkbox
                :checked="tableEnhancements.selectAll.value"
                :indeterminate="tableEnhancements.indeterminate.value"
                @change="handleSelectAll"
              />
            </view>
            <view
              v-for="column in tableColumns"
              :key="column.key"
              class="header-cell"
              :class="[`align-${column.align || 'left'}`, { sortable: column.sortable }]"
              :style="{ width: column.width, flex: column.flex }"
              @click="column.sortable && handleSort(column.key)"
            >
              <text class="header-title">{{ column.title }}</text>
              <text v-if="column.sortable" class="sort-icon">
                {{ getSortIcon(column.key) }}
              </text>
            </view>
          </view>
        </view>

        <!-- Virtual Table Container -->
        <VirtualTableContainer
          :load-data="loadVirtualData"
          :columns="enhancedColumns"
          :actions="productActions"
          :selectable="true"
          :is-selected="id => tableEnhancements.isSelected(id)"
          :preset="'default'"
          :container-height="600"
          :page-size="50"
          :touch-optimized="true"
          :show-debug-info="showDebugInfo"
          @select="handleRowSelect"
          @click="handleRowClick"
          @action="handleRowAction"
          @height-change="handleRowHeightChange"
          @error="handleVirtualError"
        >
          <!-- Custom product image cell -->
          <template #cell-image="{ item }">
            <image
              v-if="item.image_url"
              :src="item.image_url"
              mode="aspectFill"
              class="product-image"
            />
            <view v-else class="product-image-placeholder">
              <text>📷</text>
            </view>
          </template>

          <!-- Custom product info cell -->
          <template #cell-name="{ item }">
            <view class="product-info">
              <text class="product-name">{{ item.name }}</text>
              <text class="product-model">型号: {{ item.model }}</text>
            </view>
          </template>

          <!-- Empty state -->
          <template #empty>
            <view class="custom-empty-state">
              <text class="empty-icon">📦</text>
              <text class="empty-text">暂无产品数据</text>
              <text class="empty-subtitle">添加产品来开始管理您的库存</text>
              <button class="empty-action" @click="handleCreate">添加产品</button>
            </view>
          </template>
        </VirtualTableContainer>
      </view>

      <!-- 传统分页表格 -->
      <view v-else class="traditional-table admin-card">
        <!-- Table Header -->
        <view class="table-header">
          <view class="header-row">
            <view v-if="tableEnhancements.selectedCount.value > 0" class="header-selector">
              <checkbox
                :checked="tableEnhancements.selectAll.value"
                :indeterminate="tableEnhancements.indeterminate.value"
                @change="handleSelectAll"
              />
            </view>
            <view
              v-for="column in tableColumns"
              :key="column.key"
              class="header-cell"
              :class="[`align-${column.align || 'left'}`, { sortable: column.sortable }]"
              :style="{ width: column.width, flex: column.flex }"
              @click="column.sortable && handleSort(column.key)"
            >
              <text class="header-title">{{ column.title }}</text>
              <text v-if="column.sortable" class="sort-icon">
                {{ getSortIcon(column.key) }}
              </text>
            </view>
          </view>
        </view>

        <!-- Table Body -->
        <view class="table-body">
          <!-- Loading State -->
          <TableLoadingSkeleton
            v-if="tableEnhancements.state.loading"
            :rows="pageSize"
            :columns="tableColumns.length"
            :has-selection="true"
            :show-header="false"
          />

          <!-- Data Rows -->
          <template v-else>
            <DataTableRow
              v-for="product in currentPageData"
              :key="product.id"
              :item="product"
              :columns="enhancedColumns"
              :selectable="true"
              :selected="tableEnhancements.isSelected(product.id)"
              :actions="productActions"
              :touch-optimized="true"
              @select="handleRowSelect"
              @click="handleRowClick"
              @action="handleRowAction"
            >
              <!-- Same slot content as virtual table -->
              <template #cell-image="{ item }">
                <image
                  v-if="item.image_url"
                  :src="item.image_url"
                  mode="aspectFill"
                  class="product-image"
                />
                <view v-else class="product-image-placeholder">
                  <text>📷</text>
                </view>
              </template>

              <template #cell-name="{ item }">
                <view class="product-info">
                  <text class="product-name">{{ item.name }}</text>
                  <text class="product-model">型号: {{ item.model }}</text>
                </view>
              </template>
            </DataTableRow>
          </template>

          <!-- Empty State -->
          <view
            v-if="!tableEnhancements.state.loading && currentPageData.length === 0"
            class="empty-state"
          >
            <text class="empty-text">暂无产品数据</text>
            <button class="empty-action" @click="handleCreate">添加产品</button>
          </view>
        </view>

        <!-- Pagination -->
        <view class="table-pagination">
          <view class="pagination-info">
            共 {{ totalItems.toLocaleString() }} 条，第 {{ currentPage }}/{{ totalPages }} 页
          </view>
          <view class="pagination-controls">
            <button
              class="pagination-btn"
              :disabled="currentPage <= 1"
              @click="handlePageChange(currentPage - 1)"
            >
              上一页
            </button>
            <button
              class="pagination-btn"
              :disabled="currentPage >= totalPages"
              @click="handlePageChange(currentPage + 1)"
            >
              下一页
            </button>
          </view>
        </view>
      </view>

      <!-- Batch Operations Bar -->
      <BatchOperationBar
        :selected-count="tableEnhancements.selectedCount.value"
        :operations="batchOperations"
        :show-progress="batchOperating"
        :current-progress="batchProgress"
        :progress-text="batchProgressText"
        :select-all-checked="tableEnhancements.selectAll.value"
        :select-all-indeterminate="tableEnhancements.indeterminate.value"
        @operation="handleBatchOperation"
        @clear-selection="tableEnhancements.clearSelection"
        @select-all="handleSelectAll"
      />

      <!-- Debug Panel -->
      <view v-if="showDebugInfo" class="debug-panel admin-card">
        <view class="debug-header">
          <text class="debug-title">调试信息</text>
          <button class="debug-toggle" @click="showDebugInfo = false">✕</button>
        </view>
        <view class="debug-content">
          <view class="debug-item">
            <text>选中项: {{ tableEnhancements.selectedCount.value }}</text>
          </view>
          <view class="debug-item">
            <text>当前筛选: {{ JSON.stringify(filters) }}</text>
          </view>
          <view class="debug-item">
            <text>当前排序: {{ sortBy }} {{ sortOrder }}</text>
          </view>
          <view v-if="virtualEnabled" class="debug-item">
            <text>虚拟滚动状态: 活跃</text>
          </view>
        </view>
      </view>

      <!-- Floating Debug Toggle -->
      <button v-if="!showDebugInfo" class="debug-float-btn" @click="showDebugInfo = true">
        🐛
      </button>
    </AdminLayout>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import {
  type VirtualScrollingConfig,
  useTableEnhancements
} from '@/composables/useTableEnhancements'
import VirtualTableContainer from '@/components/admin/table/VirtualTableContainer.vue'
import DataTableRow from '@/components/admin/DataTableRow.vue'
import TableLoadingSkeleton from '@/components/admin/TableLoadingSkeleton.vue'
import BatchOperationBar from '@/components/admin/BatchOperationBar.vue'
import AdminLayout from '@/layouts/AdminLayout.vue'

/**
 * 虚拟滚动产品管理演示页面
 *
 * 功能展示：
 * - 10万+数据的流畅虚拟滚动
 * - 传统分页模式对比
 * - 性能指标实时显示
 * - 完整的表格功能支持
 * - 调试信息和性能监控
 *
 * @author Terminal 3 (Admin Frontend Team)
 */

// 响应式数据
const virtualEnabled = ref(true)
const showDebugInfo = ref(false)
const totalItems = ref(100000) // 10万条数据演示
const pageSize = ref(20)
const currentPage = ref(1)
const searchKeyword = ref('')
const selectedCategory = ref('')
const categoryIndex = ref(0)
const batchOperating = ref(false)
const batchProgress = ref(0)
const batchProgressText = ref('')

// 筛选状态
const filters = reactive({
  keyword: '',
  category: '',
  status: ''
})

// 排序状态
const sortBy = ref('created_at')
const sortOrder = ref<'asc' | 'desc'>('desc')

// 表格列配置
const tableColumns = [
  { key: 'image', title: '图片', width: '80px', align: 'center' as const },
  { key: 'name', title: '产品信息', flex: '2', sortable: true },
  { key: 'category', title: '分类', width: '120px', sortable: true },
  { key: 'price', title: '价格', width: '120px', align: 'right' as const, sortable: true },
  { key: 'stock', title: '库存', width: '100px', align: 'center' as const, sortable: true },
  { key: 'status', title: '状态', width: '100px', align: 'center' as const },
  { key: 'created_at', title: '创建时间', width: '160px', sortable: true }
]

// 增强列配置（包含类型信息）
const enhancedColumns = computed(() =>
  tableColumns.map(col => ({
    ...col,
    type:
      col.key === 'price'
        ? 'price'
        : col.key === 'created_at'
          ? 'date'
          : col.key === 'status'
            ? 'status'
            : col.key === 'image'
              ? 'image'
              : 'text'
  }))
)

// 分类选项
const categoryOptions = ['全部分类', '台球桌', '地毯', '配件', '其他']

// 产品操作配置
const productActions = [
  { key: 'view', label: '查看', icon: '👁', type: 'default' as const },
  { key: 'edit', label: '编辑', icon: '✏️', type: 'primary' as const },
  { key: 'images', label: '图片管理', icon: '🖼', type: 'default' as const },
  {
    key: 'delete',
    label: '删除',
    icon: '🗑',
    type: 'danger' as const,
    visible: (item: any) => item.status !== 'deleted'
  }
]

// 批量操作配置
const batchOperations = [
  { key: 'export', label: '批量导出', icon: '📤', type: 'default' as const },
  { key: 'enable', label: '批量启用', icon: '✅', type: 'default' as const },
  { key: 'disable', label: '批量禁用', icon: '❌', type: 'warning' as const },
  { key: 'delete', label: '批量删除', icon: '🗑', type: 'danger' as const }
]

// 虚拟滚动配置
const virtualScrollingConfig: VirtualScrollingConfig = {
  enabled: true,
  preset: 'default',
  itemHeight: 80,
  containerHeight: 600,
  pageSize: 50,
  loadData: async (page: number, pageSize: number, filters?, sort?) => {
    // 模拟数据加载
    await new Promise(resolve => setTimeout(resolve, 100))

    const startIndex = (page - 1) * pageSize
    const items = generateMockProducts(startIndex, pageSize, filters, sort)

    return {
      items,
      total: totalItems.value,
      hasMore: startIndex + pageSize < totalItems.value
    }
  }
}

// 表格增强功能
const tableEnhancements = useTableEnhancements(
  { pageSize: pageSize.value },
  virtualEnabled.value ? virtualScrollingConfig : undefined
)

// 传统分页数据
const currentPageData = ref<any[]>([])
const totalPages = computed(() => Math.ceil(totalItems.value / pageSize.value))

// 生成模拟产品数据
function generateMockProducts(startIndex: number, count: number, filters?: any, sort?: any) {
  const categories = ['台球桌', '地毯', '配件']
  const statuses = ['active', 'inactive', 'discontinued']
  const products = []

  for (let i = 0; i < count; i++) {
    const index = startIndex + i
    const product = {
      id: `product_${index}`,
      name: `产品名称 ${index + 1}`,
      model: `MODEL-${String(index + 1).padStart(6, '0')}`,
      category: categories[index % categories.length],
      price: Math.floor(Math.random() * 10000) + 500,
      stock: Math.floor(Math.random() * 100),
      status: statuses[index % statuses.length],
      image_url: index % 3 === 0 ? `https://picsum.photos/60/60?random=${index}` : null,
      created_at: new Date(
        Date.now() - Math.floor(Math.random() * 365 * 24 * 60 * 60 * 1000)
      ).toISOString()
    }

    // 应用筛选
    if (filters?.keyword && !product.name.includes(filters.keyword)) continue
    if (filters?.category && product.category !== filters.category) continue
    if (filters?.status && product.status !== filters.status) continue

    products.push(product)
  }

  // 应用排序
  if (sort?.by) {
    products.sort((a, b) => {
      const aVal = a[sort.by]
      const bVal = b[sort.by]
      const result = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
      return sort.order === 'desc' ? -result : result
    })
  }

  return products
}

// 虚拟滚动数据加载
const loadVirtualData = async (page: number, pageSize: number) => {
  return virtualScrollingConfig.loadData(page, pageSize, filters, {
    by: sortBy.value,
    order: sortOrder.value
  })
}

// 加载传统分页数据
async function loadTraditionalData() {
  if (virtualEnabled.value) return

  tableEnhancements.setLoading(true)
  try {
    const data = await loadVirtualData(currentPage.value, pageSize.value)
    currentPageData.value = data.items
    tableEnhancements.setData(data.items, data.total)
  } catch (error) {
    tableEnhancements.setError('数据加载失败')
  }
}

// 事件处理
const handleSearch = () => {
  filters.keyword = searchKeyword.value
  if (virtualEnabled.value) {
    tableEnhancements.virtualScrolling?.refresh()
  } else {
    currentPage.value = 1
    loadTraditionalData()
  }
}

const handleCategoryChange = (event: any) => {
  categoryIndex.value = event.detail.value
  selectedCategory.value = categoryOptions[categoryIndex.value]
  filters.category = selectedCategory.value === '全部分类' ? '' : selectedCategory.value

  if (virtualEnabled.value) {
    tableEnhancements.virtualScrolling?.refresh()
  } else {
    currentPage.value = 1
    loadTraditionalData()
  }
}

const handleReset = () => {
  searchKeyword.value = ''
  selectedCategory.value = ''
  categoryIndex.value = 0
  Object.assign(filters, { keyword: '', category: '', status: '' })

  if (virtualEnabled.value) {
    tableEnhancements.virtualScrolling?.refresh()
  } else {
    currentPage.value = 1
    loadTraditionalData()
  }
}

const handleSort = (column: string) => {
  if (sortBy.value === column) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortBy.value = column
    sortOrder.value = 'asc'
  }

  if (virtualEnabled.value) {
    tableEnhancements.virtualScrolling?.refresh()
  } else {
    loadTraditionalData()
  }
}

const getSortIcon = (column: string) => {
  if (sortBy.value !== column) return '↕️'
  return sortOrder.value === 'asc' ? '↑' : '↓'
}

const handlePageChange = (page: number) => {
  currentPage.value = page
  loadTraditionalData()
}

const toggleVirtualMode = () => {
  virtualEnabled.value = !virtualEnabled.value

  // 重新初始化表格增强功能
  if (!virtualEnabled.value) {
    loadTraditionalData()
  }
}

// 表格行事件处理
const handleRowSelect = (id: string | number, selected: boolean) => {
  tableEnhancements.toggleSelection(id as string)
}

const handleRowClick = (item: any) => {
  console.log('Row clicked:', item)
}

const handleRowAction = (action: string, item: any) => {
  console.log('Row action:', action, item)
}

const handleSelectAll = () => {
  // 虚拟滚动模式下选择所有可见项
  const items = virtualEnabled.value
    ? tableEnhancements.virtualScrolling?.visibleItems.value || []
    : currentPageData.value

  tableEnhancements.toggleSelectAll(items)
}

const handleBatchOperation = (operation: string) => {
  console.log('Batch operation:', operation, tableEnhancements.selectedIds.value)
}

const handleRowHeightChange = (id: string | number, height: number) => {
  console.log('Row height changed:', id, height)
}

const handleVirtualError = (error: string) => {
  console.error('Virtual scrolling error:', error)
}

const handleCreate = () => {
  console.log('Create new product')
}

// 生命周期
onMounted(() => {
  if (!virtualEnabled.value) {
    loadTraditionalData()
  }
})
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.virtual-products-demo-page {
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    .header-left {
      .page-title {
        font-size: 24px;
        font-weight: 600;
        color: var(--text-color-primary);
        margin-bottom: 4px;
        display: block;
      }

      .page-subtitle {
        font-size: 14px;
        color: var(--text-color-secondary);
      }
    }

    .header-right {
      display: flex;
      gap: 12px;
    }
  }

  .performance-metrics {
    display: flex;
    gap: 24px;
    margin-bottom: 20px;
    padding: 16px 20px;

    .metric-item {
      display: flex;
      flex-direction: column;
      gap: 4px;

      .metric-label {
        font-size: 12px;
        color: var(--text-color-secondary);
      }

      .metric-value {
        font-size: 16px;
        font-weight: 600;
        color: var(--color-primary);
      }
    }
  }

  .debug-panel {
    position: fixed;
    top: 20px;
    right: 20px;
    width: 300px;
    max-height: 400px;
    z-index: 1000;

    .debug-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      border-bottom: 1px solid var(--border-color-light);

      .debug-title {
        font-weight: 600;
      }

      .debug-toggle {
        background: none;
        border: none;
        cursor: pointer;
      }
    }

    .debug-content {
      padding: 12px 16px;

      .debug-item {
        margin-bottom: 8px;
        font-size: 12px;
        font-family: monospace;
        color: var(--text-color-secondary);
      }
    }
  }

  .debug-float-btn {
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: var(--color-primary);
    color: white;
    border: none;
    font-size: 18px;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    z-index: 1000;

    &:hover {
      transform: scale(1.1);
    }
  }

  .custom-empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 60px 20px;

    .empty-icon {
      font-size: 64px;
      margin-bottom: 16px;
      opacity: 0.5;
    }

    .empty-text {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 8px;
    }

    .empty-subtitle {
      font-size: 14px;
      color: var(--text-color-secondary);
      margin-bottom: 20px;
    }

    .empty-action {
      padding: 10px 20px;
      background: var(--color-primary);
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
    }
  }
}

// 复用现有表格样式
.virtual-table,
.traditional-table {
  .table-header {
    display: flex;
    background: var(--color-grey-25);
    border-bottom: 1px solid var(--border-color);

    .header-row {
      display: flex;
      width: 100%;
      align-items: center;
      padding: 0 12px;
      min-height: 48px;

      .header-selector {
        width: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .header-cell {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 0 8px;
        font-weight: 600;
        color: var(--text-color-primary);

        &.sortable {
          cursor: pointer;

          &:hover {
            background: rgba(var(--color-primary-rgb), 0.1);
          }
        }

        &.align-center {
          justify-content: center;
        }

        &.align-right {
          justify-content: flex-end;
        }

        .sort-icon {
          font-size: 12px;
          opacity: 0.7;
        }
      }
    }
  }

  .table-body {
    min-height: 400px;
  }

  .table-pagination {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-top: 1px solid var(--border-color-light);

    .pagination-info {
      font-size: 14px;
      color: var(--text-color-secondary);
    }

    .pagination-controls {
      display: flex;
      gap: 8px;

      .pagination-btn {
        padding: 6px 12px;
        border: 1px solid var(--border-color);
        background: white;
        border-radius: 4px;
        cursor: pointer;

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        &:not(:disabled):hover {
          background: var(--color-grey-25);
        }
      }
    }
  }
}

.product-image {
  width: 40px;
  height: 40px;
  border-radius: 4px;
  object-fit: cover;
}

.product-image-placeholder {
  width: 40px;
  height: 40px;
  background: var(--color-grey-100);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}

.product-info {
  .product-name {
    display: block;
    font-weight: 500;
    margin-bottom: 2px;
  }

  .product-model {
    font-size: 12px;
    color: var(--text-color-secondary);
  }
}

// 响应式优化
@include respond-to('phone') {
  .virtual-products-demo-page {
    .page-header {
      flex-direction: column;
      gap: 16px;
      align-items: stretch;

      .header-right {
        justify-content: center;
      }
    }

    .performance-metrics {
      flex-direction: column;
      gap: 12px;
    }

    .debug-panel {
      position: fixed;
      top: 10px;
      left: 10px;
      right: 10px;
      width: auto;
    }
  }
}
</style>
