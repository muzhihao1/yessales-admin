<template>
  <view class="business-rules-settings">
    <view class="settings-section">
      <text class="section-title">报价规则</text>
      
      <view class="settings-group">
        <view class="setting-item">
          <view class="setting-label">
            <text class="label-text">报价有效期</text>
            <text class="label-desc">报价单的默认有效天数</text>
          </view>
          <view class="setting-control">
            <input
              v-model.number="localSettings.quote_validity_days"
              class="setting-input"
              type="number"
              min="1"
              max="365"
              @blur="handleUpdate('quote_validity_days', localSettings.quote_validity_days)"
            />
            <text class="unit">天</text>
          </view>
        </view>
        
        <view class="setting-item">
          <view class="setting-label">
            <text class="label-text">默认折扣率</text>
            <text class="label-desc">新报价单的默认折扣率</text>
          </view>
          <view class="setting-control">
            <input
              v-model.number="localSettings.default_discount_rate"
              class="setting-input"
              type="number"
              min="0"
              max="100"
              step="0.1"
              @blur="handleUpdate('default_discount_rate', localSettings.default_discount_rate)"
            />
            <text class="unit">%</text>
          </view>
        </view>
        
        <view class="setting-item">
          <view class="setting-label">
            <text class="label-text">最大折扣率</text>
            <text class="label-desc">销售人员可设置的最大折扣率</text>
          </view>
          <view class="setting-control">
            <input
              v-model.number="localSettings.max_discount_rate"
              class="setting-input"
              type="number"
              min="0"
              max="100"
              step="0.1"
              @blur="handleUpdate('max_discount_rate', localSettings.max_discount_rate)"
            />
            <text class="unit">%</text>
          </view>
        </view>
      </view>
    </view>
    
    <view class="settings-section">
      <text class="section-title">审批规则</text>
      
      <view class="settings-group">
        <view class="setting-item">
          <view class="setting-label">
            <text class="label-text">启用审批流程</text>
            <text class="label-desc">开启后报价单需要审批后才能发送给客户</text>
          </view>
          <switch
            :checked="localSettings.enable_approval_workflow"
            @change="handleSwitchChange('enable_approval_workflow', $event)"
            color="#2563eb"
          />
        </view>
        
        <view class="setting-item">
          <view class="setting-label">
            <text class="label-text">自动审批金额</text>
            <text class="label-desc">小于此金额的报价单自动审批通过</text>
          </view>
          <view class="setting-control">
            <input
              v-model.number="localSettings.auto_approval_amount"
              class="setting-input"
              type="number"
              min="0"
              @blur="handleUpdate('auto_approval_amount', localSettings.auto_approval_amount)"
            />
            <text class="unit">元</text>
          </view>
        </view>
      </view>
    </view>
    
    <view class="settings-section">
      <text class="section-title">价格计算</text>
      
      <view class="settings-group">
        <view class="setting-item">
          <view class="setting-label">
            <text class="label-text">价格精度</text>
            <text class="label-desc">价格显示的小数位数</text>
          </view>
          <picker
            mode="selector"
            :range="precisionOptions"
            :value="precisionIndex"
            @change="handlePrecisionChange"
          >
            <view class="setting-picker">
              <text>{{ localSettings.price_precision || 2 }} 位小数</text>
              <text class="picker-arrow">▼</text>
            </view>
          </picker>
        </view>
        
        <view class="setting-item">
          <view class="setting-label">
            <text class="label-text">税率</text>
            <text class="label-desc">默认增值税率</text>
          </view>
          <view class="setting-control">
            <input
              v-model.number="localSettings.default_tax_rate"
              class="setting-input"
              type="number"
              min="0"
              max="100"
              step="0.01"
              @blur="handleUpdate('default_tax_rate', localSettings.default_tax_rate)"
            />
            <text class="unit">%</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

interface Props {
  settings: Record<string, any>
}

const props = defineProps<Props>()

const emit = defineEmits<{
  update: [key: string, value: any]
}>()

// Local settings state
const localSettings = ref<Record<string, any>>({
  quote_validity_days: 30,
  default_discount_rate: 0,
  max_discount_rate: 20,
  enable_approval_workflow: false,
  auto_approval_amount: 10000,
  price_precision: 2,
  default_tax_rate: 13,
  ...props.settings
})

// Options
const precisionOptions = ['0', '1', '2', '3', '4']

// Computed properties
const precisionIndex = computed(() => {
  return precisionOptions.findIndex(option => option === String(localSettings.value.price_precision))
})

// Methods
function handleUpdate(key: string, value: any) {
  localSettings.value[key] = value
  emit('update', key, value)
}

function handleSwitchChange(key: string, e: any) {
  const value = e.detail.value
  localSettings.value[key] = value
  emit('update', key, value)
}

function handlePrecisionChange(e: any) {
  const selectedPrecision = parseInt(precisionOptions[e.detail.value])
  localSettings.value.price_precision = selectedPrecision
  emit('update', 'price_precision', selectedPrecision)
}

// Watch for props changes
watch(() => props.settings, (newSettings) => {
  localSettings.value = { ...localSettings.value, ...newSettings }
}, { deep: true })
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.business-rules-settings {
  .settings-section {
    margin-bottom: $spacing-xl;
    
    &:last-child {
      margin-bottom: 0;
    }
    
    .section-title {
      font-size: $font-size-large;
      font-weight: 600;
      color: $text-color;
      display: block;
      margin-bottom: $spacing-lg;
      padding-bottom: $spacing-xs;
      border-bottom: 2px solid $primary-color;
    }
  }
  
  .settings-group {
    background: $bg-color-white;
    border-radius: $border-radius-lg;
    border: 1px solid $border-color;
    overflow: hidden;
    
    .setting-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: $spacing-lg;
      border-bottom: 1px solid $border-color-light;
      
      &:last-child {
        border-bottom: none;
      }
      
      .setting-label {
        flex: 1;
        margin-right: $spacing-lg;
        
        .label-text {
          font-size: $font-size-base;
          font-weight: 500;
          color: $text-color;
          display: block;
          margin-bottom: $spacing-xs;
        }
        
        .label-desc {
          font-size: $font-size-small;
          color: $text-color-secondary;
          line-height: 1.4;
        }
      }
      
      .setting-control {
        display: flex;
        align-items: center;
        gap: $spacing-xs;
        
        .unit {
          font-size: $font-size-base;
          color: $text-color-secondary;
        }
      }
      
      .setting-input {
        width: 120px;
        padding: $spacing-sm $spacing-base;
        border: 1px solid $border-color;
        border-radius: $border-radius-base;
        font-size: $font-size-base;
        text-align: right;
        
        &:focus {
          border-color: $primary-color;
          outline: none;
        }
      }
      
      .setting-picker {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 140px;
        padding: $spacing-sm $spacing-base;
        border: 1px solid $border-color;
        border-radius: $border-radius-base;
        background: $bg-color-white;
        cursor: pointer;
        
        &:hover {
          border-color: $primary-color;
        }
        
        .picker-arrow {
          font-size: 12px;
          color: $text-color-secondary;
        }
      }
    }
  }
}

// Responsive design
@media (max-width: 768px) {
  .business-rules-settings {
    .settings-group {
      .setting-item {
        flex-direction: column;
        align-items: stretch;
        gap: $spacing-base;
        
        .setting-label {
          margin-right: 0;
        }
        
        .setting-control,
        .setting-input,
        .setting-picker {
          width: 100%;
        }
        
        .setting-control {
          justify-content: flex-start;
        }
      }
    }
  }
}
</style>