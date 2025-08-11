<template>
  <view class="sales-form-item">
    <label v-if="label" class="sales-form-label" :class="{ required: required }">
      {{ label }}
    </label>
    <textarea
      class="sales-input sales-input-textarea"
      :class="{ 'sales-input-error': !!error, 'sales-input-disabled': disabled }"
      :value="modelValue"
      :placeholder="placeholder"
      :maxlength="maxlength"
      :disabled="disabled"
      :auto-height="autoHeight"
      @input="handleInput"
      @blur="handleBlur"
      @focus="handleFocus"
    />
    <view v-if="showCount && maxlength" class="sales-textarea-count">
      {{ modelValue.length }}/{{ maxlength }}
    </view>
    <view v-if="error" class="sales-form-error">{{ error }}</view>
    <view v-if="help && !error" class="sales-form-help">{{ help }}</view>
  </view>
</template>

<script setup lang="ts">
import { defineEmits, defineProps } from 'vue'

interface Props {
  modelValue: string
  label?: string
  placeholder?: string
  required?: boolean
  maxlength?: number
  disabled?: boolean
  error?: string
  help?: string
  autoHeight?: boolean
  showCount?: boolean
}

const _props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  maxlength: 500,
  required: false,
  disabled: false,
  autoHeight: true,
  showCount: true
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  blur: [event: Event]
  focus: [event: Event]
}>()

const handleInput = (event: Event) => {
  const target = event.target as HTMLTextAreaElement
  emit('update:modelValue', target.value)
}

const handleBlur = (event: Event) => {
  emit('blur', event)
}

const handleFocus = (event: Event) => {
  emit('focus', event)
}
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.sales-form-item {
  margin-bottom: $spacing-md;
  position: relative;
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

.sales-input-textarea {
  min-height: 100px;
  padding: $spacing-sm $spacing-base;
  line-height: 1.5;
  resize: vertical;

  &[auto-height='true'] {
    min-height: 80px;
  }
}

.sales-textarea-count {
  position: absolute;
  right: $spacing-sm;
  bottom: $spacing-sm;
  font-size: $font-size-small;
  color: $text-color-placeholder;
  pointer-events: none;
}

.sales-input {
  @include input-base;
  width: 100%;
  font-size: $font-size-base;
  color: $text-color;
  background-color: $bg-color-white;
  border: 1px solid $border-color;
  border-radius: $border-radius-base;
  transition: $transition-base;

  &::placeholder {
    color: $text-color-placeholder;
  }

  &:hover:not(:disabled) {
    border-color: $primary-color;
  }

  &:focus {
    outline: none;
    border-color: $primary-color;
    box-shadow: 0 0 0 2px rgba($primary-color, 0.1);
  }

  &-error {
    border-color: $danger-color;

    &:hover:not(:disabled),
    &:focus {
      border-color: $danger-color;
      box-shadow: 0 0 0 2px rgba($danger-color, 0.1);
    }
  }

  &-disabled {
    background-color: $bg-color;
    color: $text-color-placeholder;
    cursor: not-allowed;
  }
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
