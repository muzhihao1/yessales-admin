<template>
  <view class="sales-form-item">
    <label v-if="label" class="sales-form-label" :class="{ required: required }">
      {{ label }}
    </label>
    
    <picker
      :mode="mode"
      :value="pickerValue"
      :range="pickerRange"
      :range-key="rangeKey"
      :disabled="disabled"
      @change="handleChange"
      @cancel="handleCancel"
    >
      <view 
        class="sales-selector"
        :class="{ 
          'sales-selector-placeholder': !displayValue,
          'sales-selector-error': !!error,
          'sales-selector-disabled': disabled 
        }"
      >
        <text class="sales-selector-text">
          {{ displayValue || placeholder }}
        </text>
        <text class="sales-selector-arrow">▼</text>
      </view>
    </picker>
    
    <view v-if="error" class="sales-form-error">{{ error }}</view>
    <view v-if="help && !error" class="sales-form-help">{{ help }}</view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';

interface Option {
  label: string;
  value: any;
}

interface Props {
  modelValue: any;
  options: Option[] | string[] | number[];
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  help?: string;
  mode?: 'selector' | 'multiSelector' | 'time' | 'date';
  rangeKey?: string;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  options: () => [],
  placeholder: '请选择',
  required: false,
  disabled: false,
  mode: 'selector',
  rangeKey: 'label',
});

const emit = defineEmits<{
  'update:modelValue': [value: any];
  'change': [value: any];
  'cancel': [];
}>();

// 计算picker需要的数据格式
const isObjectArray = computed(() => {
  return props.options.length > 0 && typeof props.options[0] === 'object';
});

const pickerRange = computed(() => {
  if (isObjectArray.value) {
    return props.options as Option[];
  }
  // 如果是简单数组，转换为对象数组
  return (props.options as (string | number)[]).map(item => ({
    label: String(item),
    value: item,
  }));
});

// 计算当前选中的索引
const pickerValue = computed(() => {
  if (props.mode === 'time' || props.mode === 'date') {
    return props.modelValue || '';
  }
  
  const index = pickerRange.value.findIndex(item => {
    return item.value === props.modelValue;
  });
  
  return index >= 0 ? index : 0;
});

// 显示的文本
const displayValue = computed(() => {
  if (props.mode === 'time' || props.mode === 'date') {
    return props.modelValue || '';
  }
  
  if (!props.modelValue && props.modelValue !== 0) {
    return '';
  }
  
  if (isObjectArray.value) {
    const option = (props.options as Option[]).find(
      item => item.value === props.modelValue
    );
    return option?.label || '';
  }
  
  return String(props.modelValue);
});

// 处理选择变化
const handleChange = (event: any) => {
  if (props.mode === 'time' || props.mode === 'date') {
    const value = event.detail.value;
    emit('update:modelValue', value);
    emit('change', value);
    return;
  }
  
  const index = event.detail.value;
  if (index >= 0 && index < pickerRange.value.length) {
    const selectedOption = pickerRange.value[index];
    const value = selectedOption.value;
    emit('update:modelValue', value);
    emit('change', value);
  }
};

// 处理取消
const handleCancel = () => {
  emit('cancel');
};
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.sales-form-item {
  margin-bottom: $spacing-md;
}

.sales-form-label {
  display: block;
  margin-bottom: $spacing-xs;
  font-size: $font-size-base;
  font-weight: 500;
  color: $text-color-secondary;
  
  &.required::before {
    content: '*';
    color: $danger-color;
    margin-right: 4px;
  }
}

.sales-selector {
  @include flex-between;
  width: 100%;
  height: 44px;
  padding: 0 $spacing-base;
  font-size: $font-size-base;
  line-height: 44px;
  color: $text-color;
  background-color: $bg-color-white;
  border: 1px solid $border-color;
  border-radius: $border-radius-base;
  transition: $transition-base;
  
  &:active:not(.sales-selector-disabled) {
    background-color: $bg-color;
  }
  
  &-placeholder {
    .sales-selector-text {
      color: $text-color-placeholder;
    }
  }
  
  &-error {
    border-color: $danger-color;
  }
  
  &-disabled {
    background-color: $bg-color;
    cursor: not-allowed;
    
    .sales-selector-text {
      color: $text-color-placeholder;
    }
    
    .sales-selector-arrow {
      color: $text-color-placeholder;
    }
  }
}

.sales-selector-text {
  flex: 1;
  @include text-ellipsis;
}

.sales-selector-arrow {
  font-size: 12px;
  color: $text-color-regular;
  margin-left: $spacing-xs;
}

.sales-form-error {
  margin-top: $spacing-xs;
  font-size: $font-size-small;
  color: $danger-color;
}

.sales-form-help {
  margin-top: $spacing-xs;
  font-size: $font-size-small;
  color: $text-color-regular;
}
</style>