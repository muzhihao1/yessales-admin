import { computed, reactive, ref, toRefs, watch } from 'vue'
import { useToast } from './useToast'

interface ValidationRule {
  required?: boolean
  min?: number
  max?: number
  pattern?: RegExp
  validator?: (value: any) => boolean | string | Promise<boolean | string>
  message?: string
  trigger?: 'blur' | 'input' | 'manual'
}

interface FieldConfig {
  rules: ValidationRule[]
  label: string
  value?: any
}

interface ValidationState {
  isValid: boolean
  isValidating: boolean
  message: string
  hasError: boolean
  hasSuccess: boolean
}

interface FormConfig {
  [key: string]: FieldConfig
}

// Built-in validation rules
export const ValidationRules = {
  // 必填项
  required: (message?: string): ValidationRule => ({
    required: true,
    message: message || '此项为必填项',
    trigger: 'blur'
  }),

  // 中文姓名
  chineseName: (message?: string): ValidationRule => ({
    pattern: /^[\u4e00-\u9fa5a-zA-Z\s]{2,20}$/,
    message: message || '请输入2-20位中文或英文姓名',
    trigger: 'blur'
  }),

  // 手机号
  phone: (message?: string): ValidationRule => ({
    pattern: /^1[3-9]\d{9}$/,
    message: message || '请输入正确的11位手机号码',
    trigger: 'blur'
  }),

  // 邮箱
  email: (message?: string): ValidationRule => ({
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: message || '请输入正确的邮箱格式',
    trigger: 'blur'
  }),

  // 微信号
  wechat: (message?: string): ValidationRule => ({
    pattern: /^[a-zA-Z][a-zA-Z0-9_-]{5,19}$/,
    message: message || '微信号格式不正确，应为6-20位字母数字组合',
    trigger: 'blur'
  }),

  // 身份证号
  idCard: (message?: string): ValidationRule => ({
    pattern:
      /^[1-9]\d{5}(18|19|([23]\d))\d{2}((0[1-9])|(10|11|12))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/,
    message: message || '请输入正确的身份证号码',
    trigger: 'blur'
  }),

  // 长度限制
  length: (min: number, max?: number, message?: string): ValidationRule => ({
    min,
    max: max || min,
    message: message || (max ? `长度应在${min}-${max}个字符之间` : `长度应为${min}个字符`),
    trigger: 'blur'
  }),

  // 数字
  number: (min?: number, max?: number, message?: string): ValidationRule => ({
    pattern: /^\d+(\.\d+)?$/,
    message: message || '请输入有效数字',
    validator: (value: string) => {
      const num = parseFloat(value)
      if (min !== undefined && num < min) return `数值不能小于${min}`
      if (max !== undefined && num > max) return `数值不能大于${max}`
      return true
    },
    trigger: 'blur'
  }),

  // 正整数
  positiveInteger: (min?: number, max?: number, message?: string): ValidationRule => ({
    pattern: /^[1-9]\d*$/,
    message: message || '请输入正整数',
    validator: (value: string) => {
      const num = parseInt(value)
      if (min !== undefined && num < min) return `数值不能小于${min}`
      if (max !== undefined && num > max) return `数值不能大于${max}`
      return true
    },
    trigger: 'blur'
  }),

  // 自定义异步验证
  async: (
    validator: (value: any) => Promise<boolean | string>,
    message?: string
  ): ValidationRule => ({
    validator,
    message: message || '验证失败',
    trigger: 'blur'
  }),

  // 确认密码
  confirmPassword: (getPassword: () => string, message?: string): ValidationRule => ({
    validator: (value: string) => {
      return value === getPassword() || message || '两次输入的密码不一致'
    },
    trigger: 'blur'
  })
}

export function useFormValidation<T extends FormConfig>(config: T) {
  const toast = useToast()

  // Form data
  const formData = reactive<{ [K in keyof T]: any }>({} as any)

  // Validation states
  const validationStates = reactive<{ [K in keyof T]: ValidationState }>({} as any)

  // Initialize form data and validation states
  for (const [key, field] of Object.entries(config)) {
    formData[key as keyof T] = field.value || ''
    validationStates[key as keyof T] = {
      isValid: false,
      isValidating: false,
      message: '',
      hasError: false,
      hasSuccess: false
    }
  }

  // Global form state
  const isFormValid = computed(() => {
    return Object.values(validationStates).every(state => state.isValid && !state.hasError)
  })

  const isFormValidating = computed(() => {
    return Object.values(validationStates).some(state => state.isValidating)
  })

  const formErrors = computed(() => {
    const errors: { [key: string]: string } = {}
    for (const [key, state] of Object.entries(validationStates)) {
      if (state.hasError && state.message) {
        errors[key] = state.message
      }
    }
    return errors
  })

  // Validate single field
  const validateField = async (
    fieldName: keyof T,
    showToast: boolean = false
  ): Promise<boolean> => {
    const field = config[fieldName]
    const value = formData[fieldName]
    const state = validationStates[fieldName]

    state.isValidating = true
    state.hasError = false
    state.hasSuccess = false
    state.message = ''

    try {
      for (const rule of field.rules) {
        // Required check
        if (rule.required && (!value || (typeof value === 'string' && !value.trim()))) {
          state.hasError = true
          state.message = rule.message || '此项为必填项'
          break
        }

        // Skip other validations if value is empty and not required
        if (!rule.required && (!value || (typeof value === 'string' && !value.trim()))) {
          continue
        }

        // Length validation
        if (rule.min !== undefined || rule.max !== undefined) {
          const len = typeof value === 'string' ? value.length : 0
          if (rule.min !== undefined && len < rule.min) {
            state.hasError = true
            state.message = rule.message || `最少需要${rule.min}个字符`
            break
          }
          if (rule.max !== undefined && len > rule.max) {
            state.hasError = true
            state.message = rule.message || `最多允许${rule.max}个字符`
            break
          }
        }

        // Pattern validation
        if (rule.pattern && !rule.pattern.test(String(value))) {
          state.hasError = true
          state.message = rule.message || '格式不正确'
          break
        }

        // Custom validator
        if (rule.validator) {
          const result = await rule.validator(value)
          if (result !== true) {
            state.hasError = true
            state.message = typeof result === 'string' ? result : rule.message || '验证失败'
            break
          }
        }
      }

      state.isValid = !state.hasError
      state.hasSuccess = !state.hasError && value

      // Show toast for validation errors if requested
      if (showToast && state.hasError) {
        toast.validationError(field.label, state.message)
      }

      return state.isValid
    } catch (error) {
      state.hasError = true
      state.message = '验证过程出错'
      if (showToast) {
        toast.error(`${field.label}验证失败`)
      }
      return false
    } finally {
      state.isValidating = false
    }
  }

  // Validate all fields
  const validateForm = async (showToast: boolean = true): Promise<boolean> => {
    const results = await Promise.all(
      Object.keys(config).map(key => validateField(key as keyof T, false))
    )

    const isValid = results.every(result => result)

    if (showToast) {
      if (isValid) {
        toast.formSuccess('表单验证通过')
      } else {
        const firstError = Object.entries(formErrors.value)[0]
        if (firstError) {
          const [fieldKey, message] = firstError
          const fieldLabel = config[fieldKey as keyof T]?.label || fieldKey
          toast.validationError(fieldLabel, message)
        }
      }
    }

    return isValid
  }

  // Reset field
  const resetField = (fieldName: keyof T) => {
    formData[fieldName] = config[fieldName].value || ''
    validationStates[fieldName] = {
      isValid: false,
      isValidating: false,
      message: '',
      hasError: false,
      hasSuccess: false
    }
  }

  // Reset form
  const resetForm = () => {
    Object.keys(config).forEach(key => {
      resetField(key as keyof T)
    })
  }

  // Get field error
  const getFieldError = (fieldName: keyof T): string => {
    return validationStates[fieldName].message
  }

  // Check if field has error
  const hasFieldError = (fieldName: keyof T): boolean => {
    return validationStates[fieldName].hasError
  }

  // Check if field is valid
  const isFieldValid = (fieldName: keyof T): boolean => {
    return validationStates[fieldName].isValid
  }

  // Set field value with validation
  const setFieldValue = async (fieldName: keyof T, value: any, validate: boolean = false) => {
    formData[fieldName] = value

    if (validate) {
      await validateField(fieldName)
    }
  }

  // Watch for form data changes and trigger real-time validation
  for (const [key, field] of Object.entries(config)) {
    const hasInputTrigger = field.rules.some(rule => rule.trigger === 'input')

    if (hasInputTrigger) {
      watch(
        () => formData[key as keyof T],
        (newValue, oldValue) => {
          if (newValue !== oldValue && newValue) {
            // Debounce validation for input trigger
            setTimeout(() => {
              validateField(key as keyof T)
            }, 300)
          }
        }
      )
    }
  }

  return {
    // Form data
    formData: toRefs(formData),

    // Validation states
    validationStates: toRefs(validationStates),

    // Computed properties
    isFormValid,
    isFormValidating,
    formErrors,

    // Methods
    validateField,
    validateForm,
    resetField,
    resetForm,
    getFieldError,
    hasFieldError,
    isFieldValid,
    setFieldValue,

    // Raw reactive objects (for advanced usage)
    $formData: formData,
    $validationStates: validationStates
  }
}

export default useFormValidation
