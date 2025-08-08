/**
 * Store Validation Middleware
 *
 * Provides comprehensive validation for store operations including
 * schema validation, business rules, type safety, and custom validators.
 */

import { computed, reactive } from 'vue'
import { defineStore } from 'pinia'
import { handleStoreError } from './error-handler'

/**
 * Validation rule types
 */
export type ValidationRule<T = any> = {
  message: string
  validator: (value: T, context?: any) => boolean | Promise<boolean>
}

/**
 * Field validation schema
 */
export interface FieldSchema {
  type?: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'date'
  required?: boolean
  min?: number
  max?: number
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  enum?: any[]
  custom?: ValidationRule[]
}

/**
 * Object validation schema
 */
export interface ValidationSchema {
  [field: string]: FieldSchema | ValidationSchema
}

/**
 * Validation result
 */
export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
}

/**
 * Validation error
 */
export interface ValidationError {
  field: string
  message: string
  value: any
  rule: string
}

/**
 * Validation warning
 */
export interface ValidationWarning {
  field: string
  message: string
  value: any
  rule: string
}

/**
 * Business rule validator
 */
export interface BusinessRule<T = any> {
  name: string
  message: string
  validator: (data: T, context?: any) => boolean | Promise<boolean>
  level: 'error' | 'warning'
}

/**
 * Validation context
 */
export interface ValidationContext {
  store: string
  action: string
  operation: 'create' | 'update' | 'delete' | 'query'
  userId?: string
  timestamp: number
}

/**
 * Built-in validators
 */
const builtInValidators = {
  required: (value: any): boolean => {
    if (value === null || value === undefined) return false
    if (typeof value === 'string' && value.trim() === '') return false
    if (Array.isArray(value) && value.length === 0) return false
    return true
  },

  email: (value: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(value)
  },

  phone: (value: string): boolean => {
    const phoneRegex = /^1[3-9]\d{9}$/
    return phoneRegex.test(value.replace(/\s|-/g, ''))
  },

  idCard: (value: string): boolean => {
    const idCardRegex = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/
    return idCardRegex.test(value)
  },

  url: (value: string): boolean => {
    try {
      new URL(value)
      return true
    } catch {
      return false
    }
  },

  positiveNumber: (value: number): boolean => {
    return typeof value === 'number' && value > 0
  },

  nonNegativeNumber: (value: number): boolean => {
    return typeof value === 'number' && value >= 0
  },

  integer: (value: number): boolean => {
    return Number.isInteger(value)
  },

  dateString: (value: string): boolean => {
    return !isNaN(Date.parse(value))
  },

  futureDate: (value: string | Date): boolean => {
    const date = typeof value === 'string' ? new Date(value) : value
    return date.getTime() > Date.now()
  },

  pastDate: (value: string | Date): boolean => {
    const date = typeof value === 'string' ? new Date(value) : value
    return date.getTime() < Date.now()
  }
}

/**
 * Validate single field against schema
 */
async function validateField(
  field: string,
  value: any,
  schema: FieldSchema,
  context?: ValidationContext
): Promise<{ errors: ValidationError[]; warnings: ValidationWarning[] }> {
  const errors: ValidationError[] = []
  const warnings: ValidationWarning[] = []

  // Required validation
  if (schema.required && !builtInValidators.required(value)) {
    errors.push({
      field,
      message: `${field} 是必填项`,
      value,
      rule: 'required'
    })
    return { errors, warnings } // Skip other validations if required fails
  }

  // Skip other validations if value is empty and not required
  if (!builtInValidators.required(value)) {
    return { errors, warnings }
  }

  // Type validation
  if (schema.type) {
    const expectedType = schema.type
    const actualType = Array.isArray(value) ? 'array' : typeof value

    if (expectedType === 'date' && typeof value === 'string') {
      if (!builtInValidators.dateString(value)) {
        errors.push({
          field,
          message: `${field} 必须是有效的日期格式`,
          value,
          rule: 'type'
        })
      }
    } else if (expectedType !== actualType) {
      errors.push({
        field,
        message: `${field} 类型错误，期望 ${expectedType}，实际 ${actualType}`,
        value,
        rule: 'type'
      })
    }
  }

  // String validations
  if (typeof value === 'string') {
    if (schema.minLength && value.length < schema.minLength) {
      errors.push({
        field,
        message: `${field} 长度不能少于 ${schema.minLength} 个字符`,
        value,
        rule: 'minLength'
      })
    }

    if (schema.maxLength && value.length > schema.maxLength) {
      errors.push({
        field,
        message: `${field} 长度不能超过 ${schema.maxLength} 个字符`,
        value,
        rule: 'maxLength'
      })
    }

    if (schema.pattern && !schema.pattern.test(value)) {
      errors.push({
        field,
        message: `${field} 格式不正确`,
        value,
        rule: 'pattern'
      })
    }
  }

  // Number validations
  if (typeof value === 'number') {
    if (schema.min !== undefined && value < schema.min) {
      errors.push({
        field,
        message: `${field} 不能小于 ${schema.min}`,
        value,
        rule: 'min'
      })
    }

    if (schema.max !== undefined && value > schema.max) {
      errors.push({
        field,
        message: `${field} 不能大于 ${schema.max}`,
        value,
        rule: 'max'
      })
    }
  }

  // Array validations
  if (Array.isArray(value)) {
    if (schema.min !== undefined && value.length < schema.min) {
      errors.push({
        field,
        message: `${field} 至少需要 ${schema.min} 个项目`,
        value,
        rule: 'min'
      })
    }

    if (schema.max !== undefined && value.length > schema.max) {
      errors.push({
        field,
        message: `${field} 最多允许 ${schema.max} 个项目`,
        value,
        rule: 'max'
      })
    }
  }

  // Enum validation
  if (schema.enum && !schema.enum.includes(value)) {
    errors.push({
      field,
      message: `${field} 必须是以下值之一: ${schema.enum.join(', ')}`,
      value,
      rule: 'enum'
    })
  }

  // Custom validation rules
  if (schema.custom) {
    for (const rule of schema.custom) {
      try {
        const isValid = await rule.validator(value, context)
        if (!isValid) {
          errors.push({
            field,
            message: rule.message,
            value,
            rule: 'custom'
          })
        }
      } catch (error) {
        console.error('Custom validation rule error:', error)
        errors.push({
          field,
          message: '验证过程中发生错误',
          value,
          rule: 'custom'
        })
      }
    }
  }

  return { errors, warnings }
}

/**
 * Validate object against schema
 */
export async function validateData(
  data: any,
  schema: ValidationSchema,
  context?: ValidationContext
): Promise<ValidationResult> {
  const errors: ValidationError[] = []
  const warnings: ValidationWarning[] = []

  // Validate each field in schema
  for (const [field, fieldSchema] of Object.entries(schema)) {
    if (typeof fieldSchema === 'object' && !('type' in fieldSchema)) {
      // Nested object validation
      if (data[field] && typeof data[field] === 'object') {
        const nestedResult = await validateData(
          data[field],
          fieldSchema as ValidationSchema,
          context
        )
        errors.push(
          ...nestedResult.errors.map(error => ({
            ...error,
            field: `${field}.${error.field}`
          }))
        )
        warnings.push(
          ...nestedResult.warnings.map(warning => ({
            ...warning,
            field: `${field}.${warning.field}`
          }))
        )
      }
    } else {
      // Field validation
      const fieldResult = await validateField(
        field,
        data[field],
        fieldSchema as FieldSchema,
        context
      )
      errors.push(...fieldResult.errors)
      warnings.push(...fieldResult.warnings)
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Business rules validation store
 */
export const useValidationStore = defineStore('validation', () => {
  // Business rules registry
  const businessRules = reactive<Map<string, BusinessRule[]>>(new Map())

  // Validation schemas registry
  const schemas = reactive<Map<string, ValidationSchema>>(new Map())

  // Validation statistics
  const stats = reactive({
    totalValidations: 0,
    passedValidations: 0,
    failedValidations: 0,
    averageValidationTime: 0
  })

  const validationStats = computed(() => ({
    ...stats,
    successRate:
      stats.totalValidations > 0 ? (stats.passedValidations / stats.totalValidations) * 100 : 0
  }))

  /**
   * Register business rules for a store
   */
  function registerBusinessRules(store: string, rules: BusinessRule[]): void {
    businessRules.set(store, rules)
  }

  /**
   * Register validation schema for a store
   */
  function registerSchema(key: string, schema: ValidationSchema): void {
    schemas.set(key, schema)
  }

  /**
   * Validate data with business rules
   */
  async function validateWithBusinessRules(
    store: string,
    data: any,
    context?: ValidationContext
  ): Promise<ValidationResult> {
    const rules = businessRules.get(store) || []
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    for (const rule of rules) {
      try {
        const isValid = await rule.validator(data, context)

        if (!isValid) {
          const validationItem = {
            field: 'business',
            message: rule.message,
            value: data,
            rule: rule.name
          }

          if (rule.level === 'error') {
            errors.push(validationItem)
          } else {
            warnings.push(validationItem)
          }
        }
      } catch (error) {
        console.error(`Business rule validation error (${rule.name}):`, error)
        errors.push({
          field: 'business',
          message: '业务规则验证失败',
          value: data,
          rule: rule.name
        })
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * Full validation combining schema and business rules
   */
  async function validateComplete(
    store: string,
    data: any,
    schemaKey?: string,
    context?: ValidationContext
  ): Promise<ValidationResult> {
    const startTime = performance.now()

    try {
      const results: ValidationResult[] = []

      // Schema validation
      if (schemaKey && schemas.has(schemaKey)) {
        const schema = schemas.get(schemaKey)!
        const schemaResult = await validateData(data, schema, context)
        results.push(schemaResult)
      }

      // Business rules validation
      const businessResult = await validateWithBusinessRules(store, data, context)
      results.push(businessResult)

      // Combine results
      const combinedResult: ValidationResult = {
        isValid: results.every(r => r.isValid),
        errors: results.flatMap(r => r.errors),
        warnings: results.flatMap(r => r.warnings)
      }

      // Update statistics
      stats.totalValidations++
      if (combinedResult.isValid) {
        stats.passedValidations++
      } else {
        stats.failedValidations++
      }

      const endTime = performance.now()
      const duration = endTime - startTime
      stats.averageValidationTime =
        (stats.averageValidationTime * (stats.totalValidations - 1) + duration) /
        stats.totalValidations

      return combinedResult
    } catch (error) {
      stats.totalValidations++
      stats.failedValidations++

      console.error('Validation error:', error)
      return {
        isValid: false,
        errors: [
          {
            field: 'system',
            message: '验证系统错误',
            value: data,
            rule: 'system'
          }
        ],
        warnings: []
      }
    }
  }

  return {
    // State
    validationStats,

    // Registry
    registerBusinessRules,
    registerSchema,

    // Validation
    validateData,
    validateWithBusinessRules,
    validateComplete,

    // Utilities
    getBusinessRules: (store: string) => businessRules.get(store) || [],
    getSchema: (key: string) => schemas.get(key),
    clearStats: () => {
      stats.totalValidations = 0
      stats.passedValidations = 0
      stats.failedValidations = 0
      stats.averageValidationTime = 0
    }
  }
})

/**
 * Validation composable for stores
 */
export function useValidation(store: string) {
  const validationStore = useValidationStore()

  /**
   * Validate data for this store
   */
  async function validate(
    data: any,
    schemaKey?: string,
    operation?: ValidationContext['operation'],
    userId?: string
  ): Promise<ValidationResult> {
    const context: ValidationContext = {
      store,
      action: 'validate',
      operation: operation || 'query',
      userId,
      timestamp: Date.now()
    }

    return await validationStore.validateComplete(store, data, schemaKey, context)
  }

  /**
   * Validate and throw error if invalid
   */
  async function validateOrThrow(
    data: any,
    schemaKey?: string,
    operation?: ValidationContext['operation'],
    userId?: string
  ): Promise<void> {
    const result = await validate(data, schemaKey, operation, userId)

    if (!result.isValid) {
      const errorMessage = result.errors.map(e => e.message).join('; ')
      throw new Error(`数据验证失败: ${errorMessage}`)
    }
  }

  /**
   * Register schema for this store
   */
  function registerSchema(key: string, schema: ValidationSchema): void {
    validationStore.registerSchema(`${store}:${key}`, schema)
  }

  /**
   * Register business rules for this store
   */
  function registerBusinessRules(rules: BusinessRule[]): void {
    validationStore.registerBusinessRules(store, rules)
  }

  return {
    validate,
    validateOrThrow,
    registerSchema,
    registerBusinessRules,

    // Built-in validators
    validators: builtInValidators,

    // Access to global store
    global: validationStore
  }
}

/**
 * Predefined validation schemas for common data types
 */
export const commonSchemas = {
  // User data validation
  user: (): ValidationSchema => ({
    username: {
      type: 'string',
      required: true,
      minLength: 3,
      maxLength: 50,
      pattern: /^[a-zA-Z0-9_]+$/
    },
    email: {
      type: 'string',
      required: true,
      custom: [
        {
          message: '请输入有效的邮箱地址',
          validator: value => builtInValidators.email(value)
        }
      ]
    },
    password: {
      type: 'string',
      required: true,
      minLength: 6,
      maxLength: 128
    },
    name: {
      type: 'string',
      required: true,
      minLength: 1,
      maxLength: 100
    },
    role: {
      type: 'string',
      required: true,
      enum: ['admin', 'sales_manager', 'sales_rep', 'viewer']
    }
  }),

  // Customer data validation
  customer: (): ValidationSchema => ({
    name: {
      type: 'string',
      required: true,
      minLength: 1,
      maxLength: 200
    },
    phone: {
      type: 'string',
      required: true,
      custom: [
        {
          message: '请输入有效的手机号码',
          validator: value => builtInValidators.phone(value)
        }
      ]
    },
    email: {
      type: 'string',
      required: false,
      custom: [
        {
          message: '请输入有效的邮箱地址',
          validator: value => !value || builtInValidators.email(value)
        }
      ]
    },
    address: {
      type: 'string',
      required: false,
      maxLength: 500
    }
  }),

  // Product data validation
  product: (): ValidationSchema => ({
    name: {
      type: 'string',
      required: true,
      minLength: 1,
      maxLength: 200
    },
    model: {
      type: 'string',
      required: true,
      minLength: 1,
      maxLength: 100
    },
    category: {
      type: 'string',
      required: true,
      enum: ['billiard_table', 'accessory', 'maintenance', 'other']
    },
    price: {
      type: 'number',
      required: true,
      custom: [
        {
          message: '价格必须大于0',
          validator: value => builtInValidators.positiveNumber(value)
        }
      ]
    },
    is_active: {
      type: 'boolean',
      required: true
    }
  }),

  // Quote data validation
  quote: (): ValidationSchema => ({
    customer_name: {
      type: 'string',
      required: true,
      minLength: 1,
      maxLength: 200
    },
    customer_phone: {
      type: 'string',
      required: true,
      custom: [
        {
          message: '请输入有效的手机号码',
          validator: value => builtInValidators.phone(value)
        }
      ]
    },
    items: {
      type: 'array',
      required: true,
      min: 1
    },
    total_price: {
      type: 'number',
      required: true,
      custom: [
        {
          message: '总价必须大于0',
          validator: value => builtInValidators.positiveNumber(value)
        }
      ]
    },
    status: {
      type: 'string',
      required: true,
      enum: ['draft', 'pending', 'approved', 'rejected']
    }
  })
}
