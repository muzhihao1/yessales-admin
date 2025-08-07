/**
 * Data Validation Utilities
 * 
 * Comprehensive validation functions to ensure data integrity across
 * all business entities and operations.
 */

import type { Customer, CustomerDetail } from '@/types/customer'
import type { Product, Quote, User } from '@/types/models'
import type { LogEntry } from '@/types/logs'

// Validation result interface
export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

// Common validation patterns
export const VALIDATION_PATTERNS = {
  PHONE: /^1[3-9]\d{9}$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  SKU: /^[A-Z0-9]{3,}-[A-Z0-9]{3,}$/,
  QUOTE_NUMBER: /^Q\d{4}\d{6}$/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
}

// Business rules constants
export const BUSINESS_RULES = {
  MIN_CUSTOMER_NAME_LENGTH: 2,
  MAX_CUSTOMER_NAME_LENGTH: 100,
  MIN_PRODUCT_PRICE: 0.01,
  MAX_PRODUCT_PRICE: 999999.99,
  MIN_STOCK_QUANTITY: 0,
  MAX_STOCK_QUANTITY: 999999,
  MIN_QUOTE_VALIDITY_DAYS: 1,
  MAX_QUOTE_VALIDITY_DAYS: 365,
  MIN_CREDIT_LIMIT: 0,
  MAX_CREDIT_LIMIT: 10000000
}

/**
 * Customer Data Validation
 */
export function validateCustomer(customer: Partial<Customer>): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Required fields validation
  if (!customer.name || customer.name.trim().length === 0) {
    errors.push('客户名称不能为空')
  } else if (customer.name.length < BUSINESS_RULES.MIN_CUSTOMER_NAME_LENGTH) {
    errors.push(`客户名称至少需要${BUSINESS_RULES.MIN_CUSTOMER_NAME_LENGTH}个字符`)
  } else if (customer.name.length > BUSINESS_RULES.MAX_CUSTOMER_NAME_LENGTH) {
    errors.push(`客户名称不能超过${BUSINESS_RULES.MAX_CUSTOMER_NAME_LENGTH}个字符`)
  }

  if (!customer.phone || customer.phone.trim().length === 0) {
    errors.push('客户电话不能为空')
  } else if (!VALIDATION_PATTERNS.PHONE.test(customer.phone)) {
    errors.push('客户电话格式不正确')
  }

  // Email validation (optional but must be valid if provided)
  if (customer.email) {
    if (!VALIDATION_PATTERNS.EMAIL.test(customer.email)) {
      errors.push('客户邮箱格式不正确')
    }
  }

  // Customer type validation
  const validCustomerTypes = ['direct', 'distributor', 'partner', 'online']
  if (customer.customer_type && !validCustomerTypes.includes(customer.customer_type)) {
    errors.push('客户类型无效')
  }

  // Status validation
  const validStatuses = ['active', 'inactive', 'prospect', 'lost']
  if (customer.status && !validStatuses.includes(customer.status)) {
    errors.push('客户状态无效')
  }

  // Credit limit validation
  if (customer.credit_limit !== undefined) {
    if (customer.credit_limit < BUSINESS_RULES.MIN_CREDIT_LIMIT) {
      errors.push('信用额度不能为负数')
    } else if (customer.credit_limit > BUSINESS_RULES.MAX_CREDIT_LIMIT) {
      errors.push(`信用额度不能超过${BUSINESS_RULES.MAX_CREDIT_LIMIT.toLocaleString()}`)
    }
  }

  // Priority level validation
  const validPriorityLevels = ['low', 'medium', 'high', 'critical']
  if (customer.priority_level && !validPriorityLevels.includes(customer.priority_level)) {
    errors.push('优先级无效')
  }

  // Payment terms validation
  const validPaymentTerms = ['cash', '15_days', '30_days', '60_days', '90_days']
  if (customer.payment_terms && !validPaymentTerms.includes(customer.payment_terms)) {
    errors.push('付款条件无效')
  }

  // Warnings for optional but recommended fields
  if (!customer.industry) {
    warnings.push('建议填写客户所属行业')
  }

  if (!customer.company_size) {
    warnings.push('建议填写公司规模')
  }

  if (!customer.location) {
    warnings.push('建议填写客户地址')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Product Data Validation
 */
export function validateProduct(product: Partial<Product>): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Required fields validation
  if (!product.name || product.name.trim().length === 0) {
    errors.push('产品名称不能为空')
  }

  if (!product.sku || product.sku.trim().length === 0) {
    errors.push('产品SKU不能为空')
  } else if (!VALIDATION_PATTERNS.SKU.test(product.sku)) {
    errors.push('产品SKU格式不正确，应为 XXX-XXX 格式')
  }

  // Price validation
  if (product.price === undefined || product.price === null) {
    errors.push('产品价格不能为空')
  } else if (product.price < BUSINESS_RULES.MIN_PRODUCT_PRICE) {
    errors.push(`产品价格不能低于${BUSINESS_RULES.MIN_PRODUCT_PRICE}`)
  } else if (product.price > BUSINESS_RULES.MAX_PRODUCT_PRICE) {
    errors.push(`产品价格不能超过${BUSINESS_RULES.MAX_PRODUCT_PRICE.toLocaleString()}`)
  }

  // Cost validation
  if (product.cost !== undefined && product.cost !== null) {
    if (product.cost < 0) {
      errors.push('产品成本不能为负数')
    }
    if (product.price !== undefined && product.cost > product.price) {
      errors.push('产品成本不能高于售价')
    }
  }

  // Stock quantity validation
  if (product.stock_quantity === undefined || product.stock_quantity === null) {
    errors.push('库存数量不能为空')
  } else if (product.stock_quantity < BUSINESS_RULES.MIN_STOCK_QUANTITY) {
    errors.push('库存数量不能为负数')
  } else if (product.stock_quantity > BUSINESS_RULES.MAX_STOCK_QUANTITY) {
    errors.push(`库存数量不能超过${BUSINESS_RULES.MAX_STOCK_QUANTITY.toLocaleString()}`)
  }

  // Minimum stock level validation
  if (product.min_stock_level !== undefined && product.min_stock_level !== null) {
    if (product.min_stock_level < 0) {
      errors.push('最低库存不能为负数')
    }
    if (product.stock_quantity !== undefined && product.min_stock_level > product.stock_quantity) {
      warnings.push('当前库存低于最低库存水平')
    }
  }

  // Category validation
  const validCategories = ['hardware', 'software', 'service', 'accessory']
  if (product.category && !validCategories.includes(product.category)) {
    errors.push('产品类别无效')
  }

  // Status validation
  const validStatuses = ['active', 'inactive', 'discontinued']
  if (product.status && !validStatuses.includes(product.status)) {
    errors.push('产品状态无效')
  }

  // Unit validation
  const validUnits = ['piece', 'set', 'kg', 'meter', 'liter', 'hour', 'day', 'month', 'year']
  if (product.unit && !validUnits.includes(product.unit)) {
    errors.push('产品单位无效')
  }

  // Warranty period validation
  if (product.warranty_period !== undefined && product.warranty_period !== null) {
    if (product.warranty_period < 0) {
      errors.push('保修期不能为负数')
    } else if (product.warranty_period > 120) {
      warnings.push('保修期超过10年，请确认是否正确')
    }
  }

  // Warnings for optional but recommended fields
  if (!product.description) {
    warnings.push('建议填写产品描述')
  }

  if (!product.brand) {
    warnings.push('建议填写产品品牌')
  }

  if (!product.supplier) {
    warnings.push('建议填写供应商信息')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Quote Data Validation
 */
export function validateQuote(quote: Partial<Quote>): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Required fields validation
  if (!quote.quote_number || quote.quote_number.trim().length === 0) {
    errors.push('报价单号不能为空')
  } else if (!VALIDATION_PATTERNS.QUOTE_NUMBER.test(quote.quote_number)) {
    errors.push('报价单号格式不正确')
  }

  if (!quote.customer_id || quote.customer_id.trim().length === 0) {
    errors.push('客户ID不能为空')
  }

  if (!quote.customer_name || quote.customer_name.trim().length === 0) {
    errors.push('客户名称不能为空')
  }

  // Status validation
  const validStatuses = ['draft', 'pending', 'approved', 'rejected', 'expired']
  if (quote.status && !validStatuses.includes(quote.status)) {
    errors.push('报价单状态无效')
  }

  // Items validation
  if (!quote.items || quote.items.length === 0) {
    errors.push('报价单至少需要包含一个产品')
  } else {
    quote.items.forEach((item, index) => {
      if (!item.product_id) {
        errors.push(`第${index + 1}个产品的ID不能为空`)
      }
      
      if (!item.product_name) {
        errors.push(`第${index + 1}个产品的名称不能为空`)
      }
      
      if (item.quantity === undefined || item.quantity === null || item.quantity <= 0) {
        errors.push(`第${index + 1}个产品的数量必须大于0`)
      }
      
      if (item.unit_price === undefined || item.unit_price === null || item.unit_price < 0) {
        errors.push(`第${index + 1}个产品的单价不能为负数`)
      }
      
      if (item.total_price === undefined || item.total_price === null) {
        errors.push(`第${index + 1}个产品的总价不能为空`)
      } else if (item.quantity && item.unit_price && Math.abs(item.total_price - (item.quantity * item.unit_price)) > 0.01) {
        errors.push(`第${index + 1}个产品的总价计算不正确`)
      }
    })
  }

  // Amount validation
  if (quote.total_amount === undefined || quote.total_amount === null) {
    errors.push('报价总金额不能为空')
  } else if (quote.total_amount < 0) {
    errors.push('报价总金额不能为负数')
  }

  if (quote.discount_amount !== undefined && quote.discount_amount !== null) {
    if (quote.discount_amount < 0) {
      errors.push('折扣金额不能为负数')
    }
    if (quote.total_amount !== undefined && quote.discount_amount > quote.total_amount) {
      errors.push('折扣金额不能超过总金额')
    }
  }

  if (quote.tax_amount !== undefined && quote.tax_amount !== null && quote.tax_amount < 0) {
    errors.push('税额不能为负数')
  }

  if (quote.final_amount === undefined || quote.final_amount === null) {
    errors.push('最终金额不能为空')
  } else if (quote.final_amount < 0) {
    errors.push('最终金额不能为负数')
  }

  // Calculate expected final amount
  if (quote.total_amount !== undefined && quote.final_amount !== undefined) {
    const expectedFinalAmount = quote.total_amount - (quote.discount_amount || 0) + (quote.tax_amount || 0)
    if (Math.abs(quote.final_amount - expectedFinalAmount) > 0.01) {
      errors.push('最终金额计算不正确')
    }
  }

  // Valid until validation
  if (!quote.valid_until) {
    errors.push('报价有效期不能为空')
  } else {
    const validUntil = new Date(quote.valid_until)
    const today = new Date()
    const diffDays = Math.ceil((validUntil.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays < BUSINESS_RULES.MIN_QUOTE_VALIDITY_DAYS) {
      errors.push(`报价有效期至少需要${BUSINESS_RULES.MIN_QUOTE_VALIDITY_DAYS}天`)
    } else if (diffDays > BUSINESS_RULES.MAX_QUOTE_VALIDITY_DAYS) {
      warnings.push(`报价有效期超过${BUSINESS_RULES.MAX_QUOTE_VALIDITY_DAYS}天，请确认是否正确`)
    }
  }

  // Created by validation
  if (!quote.created_by) {
    errors.push('创建人不能为空')
  }

  // Warnings
  if (!quote.notes || quote.notes.trim().length === 0) {
    warnings.push('建议填写报价备注')
  }

  if (quote.status === 'draft' && quote.items && quote.items.length > 10) {
    warnings.push('报价单包含较多产品，建议分批处理')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * User Data Validation
 */
export function validateUser(user: Partial<User>): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Required fields validation
  if (!user.username || user.username.trim().length === 0) {
    errors.push('用户名不能为空')
  } else if (user.username.length < 3) {
    errors.push('用户名至少需要3个字符')
  } else if (user.username.length > 50) {
    errors.push('用户名不能超过50个字符')
  } else if (!/^[a-zA-Z0-9_]+$/.test(user.username)) {
    errors.push('用户名只能包含字母、数字和下划线')
  }

  if (!user.email || user.email.trim().length === 0) {
    errors.push('邮箱地址不能为空')
  } else if (!VALIDATION_PATTERNS.EMAIL.test(user.email)) {
    errors.push('邮箱地址格式不正确')
  }

  if (!user.name || user.name.trim().length === 0) {
    errors.push('姓名不能为空')
  } else if (user.name.length > 100) {
    errors.push('姓名不能超过100个字符')
  }

  // Role validation
  const validRoles = ['admin', 'sales_manager', 'sales_rep', 'viewer']
  if (!user.role) {
    errors.push('用户角色不能为空')
  } else if (!validRoles.includes(user.role)) {
    errors.push('用户角色无效')
  }

  // Status validation
  if (user.is_active === undefined || user.is_active === null) {
    errors.push('用户状态不能为空')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Log Entry Validation
 */
export function validateLogEntry(log: Partial<LogEntry>): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Required fields validation
  if (!log.timestamp) {
    errors.push('日志时间戳不能为空')
  } else {
    const timestamp = new Date(log.timestamp)
    if (isNaN(timestamp.getTime())) {
      errors.push('日志时间戳格式不正确')
    }
  }

  if (!log.level) {
    errors.push('日志级别不能为空')
  } else {
    const validLevels = ['debug', 'info', 'warn', 'error', 'critical']
    if (!validLevels.includes(log.level)) {
      errors.push('日志级别无效')
    }
  }

  if (!log.category) {
    errors.push('日志分类不能为空')
  } else {
    const validCategories = ['auth', 'user', 'customer', 'product', 'quote', 'system', 'security', 'api', 'data', 'export']
    if (!validCategories.includes(log.category)) {
      errors.push('日志分类无效')
    }
  }

  if (!log.action) {
    errors.push('日志操作不能为空')
  } else {
    const validActions = ['create', 'read', 'update', 'delete', 'login', 'logout', 'register', 'approve', 'reject', 'assign', 'export', 'import', 'backup', 'config_change', 'role_change', 'access_denied', 'security_violation']
    if (!validActions.includes(log.action)) {
      errors.push('日志操作无效')
    }
  }

  if (!log.message || log.message.trim().length === 0) {
    errors.push('日志消息不能为空')
  }

  // Optional field validation
  if (log.user_id && !VALIDATION_PATTERNS.UUID.test(log.user_id)) {
    errors.push('用户ID格式不正确')
  }

  if (log.duration_ms !== undefined && log.duration_ms !== null && log.duration_ms < 0) {
    errors.push('执行时间不能为负数')
  }

  if (log.ip_address) {
    // Basic IP address validation
    const ipPattern = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
    if (!ipPattern.test(log.ip_address)) {
      errors.push('IP地址格式不正确')
    }
  }

  // Warnings for security-related logs
  if (log.level === 'error' || log.level === 'critical') {
    if (!log.error_code) {
      warnings.push('建议为错误日志添加错误代码')
    }
    if (!log.stack_trace && log.level === 'critical') {
      warnings.push('建议为严重错误添加堆栈跟踪信息')
    }
  }

  if (log.category === 'security' && !log.ip_address) {
    warnings.push('建议为安全相关日志记录IP地址')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Cross-entity Referential Integrity Validation
 */
export function validateReferentialIntegrity(entities: {
  customers?: Customer[]
  products?: Product[]
  quotes?: Quote[]
  users?: User[]
}): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  const { customers = [], products = [], quotes = [], users = [] } = entities

  // Create lookup maps for efficient validation
  const customerIds = new Set(customers.map(c => c.id))
  const productIds = new Set(products.map(p => p.id))
  const userIds = new Set(users.map(u => u.id))

  // Validate quote references
  quotes.forEach((quote, index) => {
    // Customer reference validation
    if (!customerIds.has(quote.customer_id)) {
      errors.push(`报价单 ${quote.quote_number} 引用了不存在的客户ID: ${quote.customer_id}`)
    }

    // Product reference validation in quote items
    quote.items.forEach((item, itemIndex) => {
      if (!productIds.has(item.product_id)) {
        errors.push(`报价单 ${quote.quote_number} 第${itemIndex + 1}个产品引用了不存在的产品ID: ${item.product_id}`)
      }
    })

    // User reference validation
    if (quote.created_by && !userIds.has(quote.created_by)) {
      errors.push(`报价单 ${quote.quote_number} 的创建者ID不存在: ${quote.created_by}`)
    }

    if (quote.approved_by && !userIds.has(quote.approved_by)) {
      errors.push(`报价单 ${quote.quote_number} 的审批者ID不存在: ${quote.approved_by}`)
    }
  })

  // Validate customer assignments
  customers.forEach((customer) => {
    if (customer.assigned_to && !userIds.has(customer.assigned_to)) {
      errors.push(`客户 ${customer.name} 的负责人ID不存在: ${customer.assigned_to}`)
    }
  })

  // Check for orphaned data
  const referencedCustomerIds = new Set(quotes.map(q => q.customer_id))
  const unreferencedCustomers = customers.filter(c => !referencedCustomerIds.has(c.id))
  if (unreferencedCustomers.length > 0) {
    warnings.push(`发现${unreferencedCustomers.length}个没有关联报价单的客户`)
  }

  const referencedProductIds = new Set(quotes.flatMap(q => q.items.map(i => i.product_id)))
  const unreferencedProducts = products.filter(p => !referencedProductIds.has(p.id))
  if (unreferencedProducts.length > 0) {
    warnings.push(`发现${unreferencedProducts.length}个没有被引用的产品`)
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Business Logic Validation
 */
export function validateBusinessLogic(data: {
  quote: Quote
  customer: Customer
  products: Product[]
}): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  const { quote, customer, products } = data

  // Stock availability validation
  quote.items.forEach((item, index) => {
    const product = products.find(p => p.id === item.product_id)
    if (product) {
      if (product.stock_quantity < item.quantity) {
        errors.push(`第${index + 1}个产品库存不足：需要${item.quantity}，可用${product.stock_quantity}`)
      }
      
      if (product.status !== 'active') {
        errors.push(`第${index + 1}个产品已停用，无法添加到报价单`)
      }
      
      // Price validation
      if (Math.abs(item.unit_price - product.price) > 0.01) {
        warnings.push(`第${index + 1}个产品价格与系统价格不一致`)
      }
    }
  })

  // Customer credit limit validation
  if (customer.credit_limit && quote.final_amount > customer.credit_limit) {
    warnings.push(`报价金额超过客户信用额度：${quote.final_amount.toLocaleString()} > ${customer.credit_limit.toLocaleString()}`)
  }

  // Customer status validation
  if (customer.status !== 'active') {
    warnings.push('客户状态非活跃，请确认是否继续')
  }

  // Quote expiration validation
  const validUntil = new Date(quote.valid_until)
  const today = new Date()
  if (validUntil < today) {
    errors.push('报价单已过期')
  }

  // Large order validation
  const totalQuantity = quote.items.reduce((sum, item) => sum + item.quantity, 0)
  if (totalQuantity > 1000) {
    warnings.push('大批量订单，建议拆分处理')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Utility function to validate all entities in a batch
 */
export function validateBatch<T>(
  items: T[],
  validator: (item: T) => ValidationResult,
  entityName: string
): ValidationResult {
  const allErrors: string[] = []
  const allWarnings: string[] = []
  let validCount = 0

  items.forEach((item, index) => {
    const result = validator(item)
    if (result.isValid) {
      validCount++
    } else {
      result.errors.forEach(error => {
        allErrors.push(`${entityName} ${index + 1}: ${error}`)
      })
    }
    result.warnings.forEach(warning => {
      allWarnings.push(`${entityName} ${index + 1}: ${warning}`)
    })
  })

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
    warnings: [
      ...allWarnings,
      `批量验证完成：${validCount}/${items.length} 条记录通过验证`
    ]
  }
}

/**
 * Sanitize data by removing invalid or potentially harmful content
 */
export function sanitizeData<T extends Record<string, any>>(
  data: T,
  allowedFields: string[]
): Partial<T> {
  const sanitized: Partial<T> = {}
  
  allowedFields.forEach(field => {
    if (data[field] !== undefined) {
      let value = data[field]
      
      // Basic sanitization
      if (typeof value === 'string') {
        // Remove potential XSS content
        value = value.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        value = value.replace(/javascript:/gi, '')
        value = value.replace(/on\w+\s*=/gi, '')
        
        // Trim whitespace
        value = value.trim()
      }
      
      sanitized[field as keyof T] = value
    }
  })
  
  return sanitized
}

export default {
  validateCustomer,
  validateProduct,
  validateQuote,
  validateUser,
  validateLogEntry,
  validateReferentialIntegrity,
  validateBusinessLogic,
  validateBatch,
  sanitizeData,
  VALIDATION_PATTERNS,
  BUSINESS_RULES
}