<template>
  <BaseModal
    :visible="visible"
    title="导出日志"
    width="600px"
    @close="$emit('close')"
  >
    <view class="export-form">
      <!-- Export format selection -->
      <view class="form-section">
        <text class="section-title">导出格式</text>
        <view class="format-options">
          <label 
            v-for="format in formatOptions"
            :key="format.value"
            class="format-option"
            :class="{ active: selectedFormat === format.value }"
          >
            <input 
              type="radio"
              :value="format.value"
              v-model="selectedFormat"
              class="format-radio"
            />
            <view class="format-info">
              <text class="format-name">{{ format.label }}</text>
              <text class="format-desc">{{ format.description }}</text>
            </view>
            <text class="format-icon">{{ format.icon }}</text>
          </label>
        </view>
      </view>

      <!-- Date range selection -->
      <view class="form-section">
        <text class="section-title">时间范围</text>
        <view class="date-range-options">
          <view class="quick-ranges">
            <button 
              v-for="range in quickRanges"
              :key="range.value"
              class="quick-range"
              :class="{ active: selectedQuickRange === range.value }"
              @click="selectQuickRange(range.value)"
            >
              <text>{{ range.label }}</text>
            </button>
          </view>
          
          <view class="custom-range">
            <view class="range-inputs">
              <view class="date-input">
                <text class="input-label">开始时间</text>
                <picker 
                  mode="date"
                  :value="startDate"
                  @change="onStartDateChange"
                >
                  <view class="date-picker">
                    {{ startDate || '选择开始日期' }}
                  </view>
                </picker>
              </view>
              
              <view class="date-input">
                <text class="input-label">结束时间</text>
                <picker 
                  mode="date"
                  :value="endDate"
                  @change="onEndDateChange"
                >
                  <view class="date-picker">
                    {{ endDate || '选择结束日期' }}
                  </view>
                </picker>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- Filter options -->
      <view class="form-section">
        <text class="section-title">筛选条件</text>
        <view class="filter-options">
          <view class="filter-row">
            <view class="filter-group">
              <text class="filter-label">日志级别</text>
              <view class="checkbox-group">
                <label 
                  v-for="level in levelOptions"
                  :key="level.value"
                  class="checkbox-item"
                >
                  <input 
                    type="checkbox"
                    :value="level.value"
                    v-model="selectedLevels"
                  />
                  <view class="checkbox-content">
                    <view 
                      class="level-dot"
                      :style="{ backgroundColor: level.color }"
                    ></view>
                    <text>{{ level.label }}</text>
                  </view>
                </label>
              </view>
            </view>
            
            <view class="filter-group">
              <text class="filter-label">分类</text>
              <view class="checkbox-group">
                <label 
                  v-for="category in categoryOptions"
                  :key="category.value"
                  class="checkbox-item"
                >
                  <input 
                    type="checkbox"
                    :value="category.value"
                    v-model="selectedCategories"
                  />
                  <text>{{ category.label }}</text>
                </label>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- Export options -->
      <view class="form-section">
        <text class="section-title">导出选项</text>
        <view class="export-options">
          <label class="option-item">
            <input 
              type="checkbox"
              v-model="includeDetails"
            />
            <view class="option-content">
              <text class="option-title">包含详细信息</text>
              <text class="option-desc">导出日志的完整详细信息和元数据</text>
            </view>
          </label>
          
          <label class="option-item">
            <input 
              type="checkbox"
              v-model="includeStackTraces"
            />
            <view class="option-content">
              <text class="option-title">包含堆栈跟踪</text>
              <text class="option-desc">对于错误日志，包含完整的堆栈跟踪信息</text>
            </view>
          </label>
          
          <label class="option-item">
            <input 
              type="checkbox"
              v-model="compressFile"
            />
            <view class="option-content">
              <text class="option-title">压缩文件</text>
              <text class="option-desc">将导出文件压缩为ZIP格式</text>
            </view>
          </label>
        </view>
        
        <view class="max-entries">
          <text class="input-label">最大条目数</text>
          <input 
            type="number"
            v-model.number="maxEntries"
            min="1"
            max="100000"
            placeholder="10000"
            class="number-input"
          />
          <text class="input-hint">留空表示导出所有匹配的日志</text>
        </view>
      </view>

      <!-- Preview information -->
      <view class="form-section">
        <text class="section-title">导出预览</text>
        <view class="preview-info">
          <view class="preview-item">
            <text class="preview-label">预计条目数</text>
            <text class="preview-value">{{ estimatedCount }} 条</text>
          </view>
          
          <view class="preview-item">
            <text class="preview-label">文件大小</text>
            <text class="preview-value">约 {{ estimatedSize }}</text>
          </view>
          
          <view class="preview-item">
            <text class="preview-label">文件名</text>
            <text class="preview-value">{{ generatedFilename }}</text>
          </view>
        </view>
        
        <view v-if="hasFilters" class="applied-filters">
          <text class="filters-title">应用的筛选条件:</text>
          <view class="filter-tags">
            <view 
              v-for="filter in appliedFilters"
              :key="filter.key"
              class="filter-tag"
            >
              <text>{{ filter.label }}: {{ filter.value }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- Actions -->
    <template #footer>
      <view class="modal-actions">
        <button 
          class="preview-btn"
          @click="previewExport"
          :disabled="loading"
        >
          <text>预览</text>
        </button>
        
        <button 
          class="export-btn"
          @click="handleExport"
          :disabled="loading || estimatedCount === 0"
        >
          <text>{{ loading ? '导出中...' : '导出' }}</text>
        </button>
        
        <button 
          class="cancel-btn"
          @click="$emit('close')"
          :disabled="loading"
        >
          <text>取消</text>
        </button>
      </view>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import BaseModal from '@/components/common/BaseModal.vue'
import type { LogFilter, LogExportOptions, LogLevel, LogCategory } from '@/types/logs'

// Props and emits
interface Props {
  visible: boolean
  filters?: LogFilter
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
  export: [options: LogExportOptions]
}>()

// State
const loading = ref(false)
const selectedFormat = ref<'json' | 'csv' | 'xlsx'>('json')
const selectedQuickRange = ref('last_7_days')
const startDate = ref('')
const endDate = ref('')
const selectedLevels = ref<LogLevel[]>(['info', 'warn', 'error', 'critical'])
const selectedCategories = ref<LogCategory[]>([])
const includeDetails = ref(true)
const includeStackTraces = ref(true)
const compressFile = ref(false)
const maxEntries = ref<number | null>(10000)

// Options
const formatOptions = [
  {
    value: 'json',
    label: 'JSON',
    description: '结构化数据格式，适合程序处理',
    icon: '📄'
  },
  {
    value: 'csv',
    label: 'CSV',
    description: '逗号分隔值，适合Excel处理',
    icon: '📊'
  },
  {
    value: 'xlsx',
    label: 'Excel',
    description: 'Excel工作簿格式',
    icon: '📈'
  }
]

const quickRanges = [
  { value: 'last_hour', label: '最近1小时' },
  { value: 'last_24_hours', label: '最近24小时' },
  { value: 'last_7_days', label: '最近7天' },
  { value: 'last_30_days', label: '最近30天' },
  { value: 'custom', label: '自定义时间' }
]

const levelOptions = [
  { value: 'debug', label: '调试', color: '#6b7280' },
  { value: 'info', label: '信息', color: '#3b82f6' },
  { value: 'warn', label: '警告', color: '#f59e0b' },
  { value: 'error', label: '错误', color: '#ef4444' },
  { value: 'critical', label: '严重', color: '#dc2626' }
]

const categoryOptions = [
  { value: 'auth', label: '认证' },
  { value: 'user', label: '用户' },
  { value: 'customer', label: '客户' },
  { value: 'product', label: '产品' },
  { value: 'quote', label: '报价' },
  { value: 'system', label: '系统' },
  { value: 'security', label: '安全' },
  { value: 'api', label: 'API' },
  { value: 'data', label: '数据' },
  { value: 'export', label: '导出' }
]

// Computed properties
const estimatedCount = computed(() => {
  // Mock calculation based on filters
  let baseCount = 1000
  
  if (selectedQuickRange.value === 'last_hour') baseCount = 50
  else if (selectedQuickRange.value === 'last_24_hours') baseCount = 200
  else if (selectedQuickRange.value === 'last_7_days') baseCount = 800
  else if (selectedQuickRange.value === 'last_30_days') baseCount = 1500
  
  // Apply level filters
  const levelRatio = selectedLevels.value.length / levelOptions.length
  baseCount = Math.floor(baseCount * levelRatio)
  
  // Apply category filters
  if (selectedCategories.value.length > 0) {
    const categoryRatio = selectedCategories.value.length / categoryOptions.length
    baseCount = Math.floor(baseCount * categoryRatio)
  }
  
  // Apply max entries limit
  if (maxEntries.value && baseCount > maxEntries.value) {
    baseCount = maxEntries.value
  }
  
  return Math.max(0, baseCount)
})

const estimatedSize = computed(() => {
  const avgSize = selectedFormat.value === 'json' ? 800 : 
                 selectedFormat.value === 'csv' ? 300 : 500
  const totalBytes = estimatedCount.value * avgSize
  
  if (totalBytes < 1024) return `${totalBytes} B`
  if (totalBytes < 1024 * 1024) return `${(totalBytes / 1024).toFixed(1)} KB`
  return `${(totalBytes / (1024 * 1024)).toFixed(1)} MB`
})

const generatedFilename = computed(() => {
  const timestamp = new Date().toISOString().split('T')[0]
  const range = selectedQuickRange.value === 'custom' 
    ? `${startDate.value}_${endDate.value}`
    : selectedQuickRange.value
  
  return `logs_${range}_${timestamp}.${selectedFormat.value}${compressFile.value ? '.zip' : ''}`
})

const hasFilters = computed(() => {
  return selectedLevels.value.length < levelOptions.length ||
         selectedCategories.value.length > 0 ||
         startDate.value ||
         endDate.value
})

const appliedFilters = computed(() => {
  const filters = []
  
  if (selectedLevels.value.length < levelOptions.length) {
    const levels = selectedLevels.value.map(l => 
      levelOptions.find(opt => opt.value === l)?.label
    ).join(', ')
    filters.push({ key: 'levels', label: '级别', value: levels })
  }
  
  if (selectedCategories.value.length > 0) {
    const categories = selectedCategories.value.map(c => 
      categoryOptions.find(opt => opt.value === c)?.label
    ).join(', ')
    filters.push({ key: 'categories', label: '分类', value: categories })
  }
  
  if (startDate.value || endDate.value) {
    const range = `${startDate.value || '开始'} - ${endDate.value || '结束'}`
    filters.push({ key: 'date', label: '时间', value: range })
  }
  
  return filters
})

// Methods
function selectQuickRange(range: string) {
  selectedQuickRange.value = range
  
  const now = new Date()
  const today = now.toISOString().split('T')[0]
  
  switch (range) {
    case 'last_hour':
      startDate.value = new Date(now.getTime() - 60 * 60 * 1000).toISOString().split('T')[0]
      endDate.value = today
      break
    case 'last_24_hours':
      startDate.value = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      endDate.value = today
      break
    case 'last_7_days':
      startDate.value = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      endDate.value = today
      break
    case 'last_30_days':
      startDate.value = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      endDate.value = today
      break
    case 'custom':
      // Keep existing dates
      break
  }
}

function onStartDateChange(event: any) {
  startDate.value = event.detail.value
  selectedQuickRange.value = 'custom'
}

function onEndDateChange(event: any) {
  endDate.value = event.detail.value
  selectedQuickRange.value = 'custom'
}

function previewExport() {
  const options = buildExportOptions()
  
  uni.showModal({
    title: '导出预览',
    content: `格式: ${selectedFormat.value.toUpperCase()}\n预计条目: ${estimatedCount.value}\n文件大小: ${estimatedSize.value}\n文件名: ${generatedFilename.value}`,
    showCancel: false,
    confirmText: '确定'
  })
}

function handleExport() {
  loading.value = true
  
  const options = buildExportOptions()
  
  // Simulate export delay
  setTimeout(() => {
    loading.value = false
    emit('export', options)
    
    uni.showToast({
      title: '导出完成',
      icon: 'success'
    })
    
    emit('close')
  }, 2000)
}

function buildExportOptions(): LogExportOptions {
  const filters: LogFilter = {}
  
  if (selectedLevels.value.length < levelOptions.length) {
    filters.level = selectedLevels.value
  }
  
  if (selectedCategories.value.length > 0) {
    filters.category = selectedCategories.value
  }
  
  if (startDate.value) {
    filters.date_from = startDate.value + 'T00:00:00Z'
  }
  
  if (endDate.value) {
    filters.date_to = endDate.value + 'T23:59:59Z'
  }
  
  return {
    format: selectedFormat.value,
    filters: Object.keys(filters).length > 0 ? filters : undefined,
    include_details: includeDetails.value,
    date_range: startDate.value && endDate.value ? {
      start: startDate.value + 'T00:00:00Z',
      end: endDate.value + 'T23:59:59Z'
    } : undefined,
    max_entries: maxEntries.value || undefined
  }
}

// Initialize from props
onMounted(() => {
  if (props.filters) {
    if (props.filters.level) {
      selectedLevels.value = props.filters.level
    }
    if (props.filters.category) {
      selectedCategories.value = props.filters.category
    }
    if (props.filters.date_from) {
      startDate.value = props.filters.date_from.split('T')[0]
    }
    if (props.filters.date_to) {
      endDate.value = props.filters.date_to.split('T')[0]
    }
  }
})

// Watch for date changes to update quick range
watch([startDate, endDate], () => {
  const isQuickRange = quickRanges.some(range => {
    if (range.value === 'custom') return false
    
    selectQuickRange(range.value)
    return startDate.value === startDate.value && endDate.value === endDate.value
  })
  
  if (!isQuickRange) {
    selectedQuickRange.value = 'custom'
  }
})
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.export-form {
  max-height: 70vh;
  overflow-y: auto;
  
  .form-section {
    margin-bottom: $spacing-lg;
    padding-bottom: $spacing-md;
    border-bottom: 1px solid $color-border;
    
    &:last-child {
      border-bottom: none;
      margin-bottom: 0;
      padding-bottom: 0;
    }
    
    .section-title {
      display: block;
      font-size: $font-size-lg;
      font-weight: 600;
      color: $color-text-primary;
      margin-bottom: $spacing-md;
    }
  }
}

.format-options {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
  
  .format-option {
    display: flex;
    align-items: center;
    gap: $spacing-md;
    padding: $spacing-md;
    border: 1px solid $color-border;
    border-radius: $border-radius-md;
    cursor: pointer;
    transition: all 0.3s ease;
    
    &:hover {
      border-color: $color-primary;
      background: rgba($color-primary, 0.05);
    }
    
    &.active {
      border-color: $color-primary;
      background: rgba($color-primary, 0.1);
    }
    
    .format-radio {
      width: 16px;
      height: 16px;
    }
    
    .format-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: $spacing-xs;
      
      .format-name {
        font-size: $font-size-md;
        font-weight: 500;
        color: $color-text-primary;
      }
      
      .format-desc {
        font-size: $font-size-sm;
        color: $color-text-secondary;
      }
    }
    
    .format-icon {
      font-size: 24px;
    }
  }
}

.date-range-options {
  .quick-ranges {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-sm;
    margin-bottom: $spacing-md;
    
    .quick-range {
      padding: 6px 12px;
      border: 1px solid $color-border;
      border-radius: $border-radius-sm;
      background: $color-bg-white;
      color: $color-text-primary;
      font-size: $font-size-sm;
      cursor: pointer;
      transition: all 0.3s ease;
      
      &:hover {
        border-color: $color-primary;
      }
      
      &.active {
        background: $color-primary;
        color: white;
        border-color: $color-primary;
      }
    }
  }
  
  .custom-range {
    .range-inputs {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: $spacing-md;
      
      .date-input {
        display: flex;
        flex-direction: column;
        gap: $spacing-xs;
        
        .input-label {
          font-size: $font-size-sm;
          font-weight: 500;
          color: $color-text-secondary;
        }
        
        .date-picker {
          padding: 8px 12px;
          border: 1px solid $color-border;
          border-radius: $border-radius-sm;
          background: $color-bg-white;
          font-size: $font-size-sm;
          color: $color-text-primary;
          cursor: pointer;
          
          &:hover {
            border-color: $color-primary;
          }
        }
      }
    }
  }
}

.filter-options {
  .filter-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: $spacing-lg;
    
    .filter-group {
      .filter-label {
        display: block;
        font-size: $font-size-sm;
        font-weight: 500;
        color: $color-text-secondary;
        margin-bottom: $spacing-sm;
      }
      
      .checkbox-group {
        display: flex;
        flex-direction: column;
        gap: $spacing-sm;
        
        .checkbox-item {
          display: flex;
          align-items: center;
          gap: $spacing-sm;
          cursor: pointer;
          
          input[type="checkbox"] {
            width: 16px;
            height: 16px;
          }
          
          .checkbox-content {
            flex: 1;
            display: flex;
            align-items: center;
            gap: $spacing-xs;
            
            .level-dot {
              width: 8px;
              height: 8px;
              border-radius: 50%;
            }
            
            text {
              font-size: $font-size-sm;
              color: $color-text-primary;
            }
          }
        }
      }
    }
  }
}

.export-options {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
  
  .option-item {
    display: flex;
    align-items: flex-start;
    gap: $spacing-sm;
    cursor: pointer;
    
    input[type="checkbox"] {
      width: 16px;
      height: 16px;
      margin-top: 2px;
    }
    
    .option-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: $spacing-xs;
      
      .option-title {
        font-size: $font-size-sm;
        font-weight: 500;
        color: $color-text-primary;
      }
      
      .option-desc {
        font-size: $font-size-xs;
        color: $color-text-secondary;
      }
    }
  }
  
  .max-entries {
    display: flex;
    flex-direction: column;
    gap: $spacing-xs;
    
    .input-label {
      font-size: $font-size-sm;
      font-weight: 500;
      color: $color-text-secondary;
    }
    
    .number-input {
      padding: 8px 12px;
      border: 1px solid $color-border;
      border-radius: $border-radius-sm;
      font-size: $font-size-sm;
      width: 200px;
      
      &:focus {
        border-color: $color-primary;
        outline: none;
      }
    }
    
    .input-hint {
      font-size: $font-size-xs;
      color: $color-text-placeholder;
    }
  }
}

.preview-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: $spacing-md;
  margin-bottom: $spacing-md;
  
  .preview-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: $spacing-sm;
    background: $color-bg-light;
    border-radius: $border-radius-sm;
    
    .preview-label {
      font-size: $font-size-sm;
      color: $color-text-secondary;
      font-weight: 500;
    }
    
    .preview-value {
      font-size: $font-size-sm;
      color: $color-text-primary;
      font-weight: 600;
    }
  }
}

.applied-filters {
  .filters-title {
    display: block;
    font-size: $font-size-sm;
    font-weight: 500;
    color: $color-text-secondary;
    margin-bottom: $spacing-xs;
  }
  
  .filter-tags {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-xs;
    
    .filter-tag {
      padding: 4px 8px;
      background: rgba($color-primary, 0.1);
      color: $color-primary;
      border-radius: $border-radius-sm;
      font-size: $font-size-xs;
    }
  }
}

.modal-actions {
  display: flex;
  gap: $spacing-sm;
  justify-content: flex-end;
  
  .preview-btn,
  .export-btn,
  .cancel-btn {
    padding: 8px 16px;
    border-radius: $border-radius-sm;
    font-size: $font-size-sm;
    cursor: pointer;
    transition: all 0.3s ease;
    
    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }
  
  .preview-btn {
    background: $color-bg-light;
    color: $color-text-primary;
    border: 1px solid $color-border;
    
    &:hover:not(:disabled) {
      background: $color-bg-white;
    }
  }
  
  .export-btn {
    background: $color-primary;
    color: white;
    border: 1px solid $color-primary;
    
    &:hover:not(:disabled) {
      background: darken($color-primary, 10%);
    }
  }
  
  .cancel-btn {
    background: $color-bg-white;
    color: $color-text-secondary;
    border: 1px solid $color-border;
    
    &:hover:not(:disabled) {
      background: $color-bg-light;
    }
  }
}

// Responsive design
@media (max-width: 768px) {
  .date-range-options {
    .custom-range .range-inputs {
      grid-template-columns: 1fr;
    }
  }
  
  .filter-options {
    .filter-row {
      grid-template-columns: 1fr;
    }
  }
  
  .preview-info {
    grid-template-columns: 1fr;
  }
  
  .modal-actions {
    flex-direction: column;
  }
}
</style>