/**
 * Store Error Handler Utility
 *
 * Provides centralized error handling for all Pinia stores with consistent
 * error categorization, user-friendly messaging, and retry mechanisms.
 */

import { useAuthStore } from '@/stores/auth'
import type { ApiResponse } from '@/types/api'

/**
 * Error categories for different types of failures
 */
export enum ErrorCategory {
  NETWORK = 'NETWORK',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  VALIDATION = 'VALIDATION',
  BUSINESS_LOGIC = 'BUSINESS_LOGIC',
  SYSTEM = 'SYSTEM',
  UNKNOWN = 'UNKNOWN'
}

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

/**
 * Standardized error structure
 */
export interface StoreError {
  category: ErrorCategory
  severity: ErrorSeverity
  code: string
  message: string
  userMessage: string
  details?: any
  retryable: boolean
  timestamp: number
  context?: {
    store: string
    action: string
    payload?: any
  }
}

/**
 * Error handler configuration
 */
export interface ErrorHandlerConfig {
  showToast?: boolean
  logError?: boolean
  retryCount?: number
  retryDelay?: number
  context?: {
    store: string
    action: string
    payload?: any
  }
}

/**
 * Default error messages in Chinese
 */
const ERROR_MESSAGES: Record<string, string> = {
  // Network errors
  NETWORK_ERROR: '网络连接失败，请检查网络后重试',
  TIMEOUT_ERROR: '请求超时，请稍后重试',
  CONNECTION_ERROR: '连接服务器失败，请检查网络连接',

  // Authentication errors
  UNAUTHORIZED: '登录已过期，请重新登录',
  INVALID_CREDENTIALS: '用户名或密码错误',
  TOKEN_EXPIRED: '登录已过期，请重新登录',

  // Authorization errors
  FORBIDDEN: '您没有权限执行此操作',
  INSUFFICIENT_PERMISSIONS: '权限不足，请联系管理员',

  // Validation errors
  VALIDATION_ERROR: '输入数据有误，请检查后重试',
  REQUIRED_FIELD_MISSING: '必填字段不能为空',
  INVALID_FORMAT: '数据格式错误',

  // Business logic errors
  BUSINESS_RULE_VIOLATION: '操作违反业务规则',
  DUPLICATE_RECORD: '记录已存在，请勿重复创建',
  RECORD_NOT_FOUND: '未找到相关记录',
  INVALID_OPERATION: '当前状态下无法执行此操作',

  // System errors
  SYSTEM_ERROR: '系统错误，请稍后重试',
  DATABASE_ERROR: '数据库错误，请联系技术支持',
  INTERNAL_SERVER_ERROR: '服务器内部错误',

  // Default
  UNKNOWN_ERROR: '未知错误，请稍后重试'
}

/**
 * Categorize error based on error code or message
 */
function categorizeError(error: any): ErrorCategory {
  const errorMessage = error?.message?.toLowerCase() || ''
  const errorCode = error?.code || error?.status || 0

  // Network errors
  if (
    errorMessage.includes('network') ||
    errorMessage.includes('fetch') ||
    errorMessage.includes('timeout') ||
    errorCode === 0
  ) {
    return ErrorCategory.NETWORK
  }

  // Authentication errors
  if (
    errorCode === 401 ||
    errorMessage.includes('unauthorized') ||
    errorMessage.includes('token') ||
    errorMessage.includes('auth')
  ) {
    return ErrorCategory.AUTHENTICATION
  }

  // Authorization errors
  if (
    errorCode === 403 ||
    errorMessage.includes('forbidden') ||
    errorMessage.includes('permission')
  ) {
    return ErrorCategory.AUTHORIZATION
  }

  // Validation errors
  if (
    errorCode === 400 ||
    errorMessage.includes('validation') ||
    errorMessage.includes('invalid') ||
    errorMessage.includes('required')
  ) {
    return ErrorCategory.VALIDATION
  }

  // Business logic errors
  if (
    errorCode === 409 ||
    errorCode === 422 ||
    errorMessage.includes('conflict') ||
    errorMessage.includes('duplicate')
  ) {
    return ErrorCategory.BUSINESS_LOGIC
  }

  // System errors
  if (errorCode >= 500 || errorMessage.includes('server') || errorMessage.includes('database')) {
    return ErrorCategory.SYSTEM
  }

  return ErrorCategory.UNKNOWN
}

/**
 * Determine error severity
 */
function getErrorSeverity(category: ErrorCategory, errorCode?: number): ErrorSeverity {
  switch (category) {
    case ErrorCategory.AUTHENTICATION:
      return ErrorSeverity.HIGH
    case ErrorCategory.AUTHORIZATION:
      return ErrorSeverity.MEDIUM
    case ErrorCategory.NETWORK:
      return ErrorSeverity.MEDIUM
    case ErrorCategory.VALIDATION:
      return ErrorSeverity.LOW
    case ErrorCategory.BUSINESS_LOGIC:
      return ErrorSeverity.MEDIUM
    case ErrorCategory.SYSTEM:
      return errorCode && errorCode >= 500 ? ErrorSeverity.CRITICAL : ErrorSeverity.HIGH
    default:
      return ErrorSeverity.MEDIUM
  }
}

/**
 * Get user-friendly error message
 */
function getUserMessage(category: ErrorCategory, error: any): string {
  const errorCode = error?.code || error?.status
  const errorMessage = error?.message || ''

  // Try to match specific error codes first
  if (errorCode === 401) return ERROR_MESSAGES.UNAUTHORIZED
  if (errorCode === 403) return ERROR_MESSAGES.FORBIDDEN
  if (errorCode === 404) return ERROR_MESSAGES.RECORD_NOT_FOUND
  if (errorCode === 409) return ERROR_MESSAGES.DUPLICATE_RECORD
  if (errorCode === 422) return ERROR_MESSAGES.VALIDATION_ERROR
  if (errorCode >= 500) return ERROR_MESSAGES.SYSTEM_ERROR

  // Try to match error message keywords
  if (errorMessage.toLowerCase().includes('timeout')) {
    return ERROR_MESSAGES.TIMEOUT_ERROR
  }
  if (errorMessage.toLowerCase().includes('network')) {
    return ERROR_MESSAGES.NETWORK_ERROR
  }

  // Fall back to category-based messages
  switch (category) {
    case ErrorCategory.NETWORK:
      return ERROR_MESSAGES.NETWORK_ERROR
    case ErrorCategory.AUTHENTICATION:
      return ERROR_MESSAGES.UNAUTHORIZED
    case ErrorCategory.AUTHORIZATION:
      return ERROR_MESSAGES.FORBIDDEN
    case ErrorCategory.VALIDATION:
      return ERROR_MESSAGES.VALIDATION_ERROR
    case ErrorCategory.BUSINESS_LOGIC:
      return ERROR_MESSAGES.BUSINESS_RULE_VIOLATION
    case ErrorCategory.SYSTEM:
      return ERROR_MESSAGES.SYSTEM_ERROR
    default:
      return ERROR_MESSAGES.UNKNOWN_ERROR
  }
}

/**
 * Check if error is retryable
 */
function isRetryable(category: ErrorCategory, errorCode?: number): boolean {
  // Retryable categories
  if (category === ErrorCategory.NETWORK) return true
  if (category === ErrorCategory.SYSTEM && errorCode && errorCode >= 500) return true

  // Non-retryable errors
  if (category === ErrorCategory.AUTHENTICATION) return false
  if (category === ErrorCategory.AUTHORIZATION) return false
  if (category === ErrorCategory.VALIDATION) return false
  if (category === ErrorCategory.BUSINESS_LOGIC) return false

  return false
}

/**
 * Main error handling function
 */
export async function handleStoreError(
  error: any,
  config: ErrorHandlerConfig = {}
): Promise<StoreError> {
  const { showToast = true, logError = true, context } = config

  // Categorize the error
  const category = categorizeError(error)
  const severity = getErrorSeverity(category, error?.status || error?.code)
  const userMessage = getUserMessage(category, error)
  const retryable = isRetryable(category, error?.status || error?.code)

  // Create standardized error object
  const storeError: StoreError = {
    category,
    severity,
    code: error?.code || error?.status || 'UNKNOWN',
    message: error?.message || 'Unknown error occurred',
    userMessage,
    details: error,
    retryable,
    timestamp: Date.now(),
    context
  }

  // Log error for debugging
  if (logError) {
    console.error('Store Error:', {
      ...storeError,
      originalError: error
    })
  }

  // Show user notification
  if (showToast) {
    uni.showToast({
      title: userMessage,
      icon: 'none',
      duration: 3000
    })
  }

  // Handle authentication errors by redirecting to login
  if (category === ErrorCategory.AUTHENTICATION) {
    const authStore = useAuthStore()
    await authStore.logout()

    // Redirect to login page if not already there
    const pages = getCurrentPages()
    const currentPage = pages[pages.length - 1]

    if (currentPage?.route !== 'pages/admin/login/index') {
      uni.reLaunch({
        url: '/pages/admin/login/index'
      })
    }
  }

  return storeError
}

/**
 * Retry mechanism for retryable errors
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  config: {
    maxRetries?: number
    delay?: number
    backoff?: boolean
    context?: ErrorHandlerConfig['context']
  } = {}
): Promise<T> {
  const { maxRetries = 3, delay = 1000, backoff = true, context } = config

  let lastError: any

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error

      const storeError = await handleStoreError(error, {
        showToast: false, // Don't show toast for retry attempts
        logError: attempt === maxRetries, // Only log on final failure
        context
      })

      // Don't retry if error is not retryable
      if (!storeError.retryable) {
        throw error
      }

      // Don't retry on final attempt
      if (attempt === maxRetries) {
        break
      }

      // Wait before retrying
      const waitTime = backoff ? delay * Math.pow(2, attempt - 1) : delay
      await new Promise(resolve => setTimeout(resolve, waitTime))

      console.log(`Retrying operation (attempt ${attempt + 1}/${maxRetries}) after ${waitTime}ms`)
    }
  }

  // All retries failed, handle the final error
  await handleStoreError(lastError, {
    showToast: true,
    logError: true,
    context
  })

  throw lastError
}

/**
 * Wrapper function for store actions with error handling
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  config: ErrorHandlerConfig = {}
): Promise<T | null> {
  try {
    return await operation()
  } catch (error) {
    await handleStoreError(error, config)
    return null
  }
}

/**
 * API response error handler
 */
export async function handleApiResponse<T>(
  response: ApiResponse<T>,
  config: ErrorHandlerConfig = {}
): Promise<T | null> {
  if (response.success && response.data) {
    return response.data
  }

  // Handle API error response
  const error = {
    code: response.error?.code || 'API_ERROR',
    message: response.error?.message || 'API request failed',
    status: response.error?.status
  }

  await handleStoreError(error, config)
  return null
}
