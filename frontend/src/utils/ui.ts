/**
 * UI utility functions for common user interface interactions
 * @author Terminal 3 (Admin Frontend Team)
 */

export interface ModalOptions {
  title: string
  content: string
  showCancel?: boolean
  cancelText?: string
  confirmText?: string
  type?: 'info' | 'warning' | 'error' | 'success'
}

export interface ModalResult {
  confirm: boolean
  cancel: boolean
}

export type ToastType = 'success' | 'error' | 'warning' | 'info'

/**
 * Show a modal dialog
 */
export const showModal = async (options: ModalOptions): Promise<ModalResult> => {
  const {
    title,
    content,
    showCancel = true,
    cancelText = '取消',
    confirmText = '确定',
    type = 'info'
  } = options

  return new Promise((resolve) => {
    // In a real implementation, this would show a modal component
    // For now, use uni.showModal or browser confirm as fallback
    
    if (typeof uni !== 'undefined' && uni.showModal) {
      uni.showModal({
        title,
        content,
        showCancel,
        cancelText,
        confirmText,
        success: (res) => {
          resolve({
            confirm: res.confirm || false,
            cancel: res.cancel || false
          })
        },
        fail: () => {
          resolve({
            confirm: false,
            cancel: true
          })
        }
      })
    } else {
      // Fallback for web environment
      const result = window.confirm(`${title}\n\n${content}`)
      resolve({
        confirm: result,
        cancel: !result
      })
    }
  })
}

/**
 * Show a toast notification
 */
export const showToast = (
  message: string, 
  type: ToastType = 'success',
  duration: number = 2000
): void => {
  if (typeof uni !== 'undefined' && uni.showToast) {
    // UniApp environment
    uni.showToast({
      title: message,
      icon: type === 'error' ? 'error' : type === 'success' ? 'success' : 'none',
      duration
    })
  } else {
    // Web environment fallback
    console.log(`[${type.toUpperCase()}] ${message}`)
    
    // Could implement a custom toast notification here
    // For now, just use console output
    if (type === 'error') {
      console.error(message)
    } else if (type === 'warning') {
      console.warn(message)
    } else {
      console.info(message)
    }
  }
}

/**
 * Show loading indicator
 */
export const showLoading = (title: string = '加载中...'): void => {
  if (typeof uni !== 'undefined' && uni.showLoading) {
    uni.showLoading({
      title,
      mask: true
    })
  }
}

/**
 * Hide loading indicator
 */
export const hideLoading = (): void => {
  if (typeof uni !== 'undefined' && uni.hideLoading) {
    uni.hideLoading()
  }
}

/**
 * Show action sheet
 */
export interface ActionSheetOptions {
  itemList: string[]
  title?: string
  itemColor?: string
}

export const showActionSheet = (options: ActionSheetOptions): Promise<{tapIndex: number}> => {
  return new Promise((resolve, reject) => {
    if (typeof uni !== 'undefined' && uni.showActionSheet) {
      uni.showActionSheet({
        ...options,
        success: (res) => resolve(res),
        fail: (err) => reject(err)
      })
    } else {
      // Web fallback - could implement custom action sheet
      reject(new Error('Action sheet not supported in web environment'))
    }
  })
}

/**
 * Copy text to clipboard
 */
export const copyToClipboard = (text: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (typeof uni !== 'undefined' && uni.setClipboardData) {
      uni.setClipboardData({
        data: text,
        success: () => {
          showToast('已复制到剪贴板')
          resolve()
        },
        fail: (err) => reject(err)
      })
    } else if (navigator.clipboard) {
      // Modern browser clipboard API
      navigator.clipboard.writeText(text)
        .then(() => {
          showToast('已复制到剪贴板')
          resolve()
        })
        .catch(reject)
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = text
      document.body.appendChild(textArea)
      textArea.select()
      
      try {
        document.execCommand('copy')
        showToast('已复制到剪贴板')
        resolve()
      } catch (err) {
        reject(err)
      } finally {
        document.body.removeChild(textArea)
      }
    }
  })
}

/**
 * Debounce function
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate: boolean = false
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    const later = () => {
      timeout = null
      if (!immediate) func(...args)
    }
    
    const callNow = immediate && !timeout
    
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(later, wait)
    
    if (callNow) func(...args)
  }
}

/**
 * Throttle function
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle = false
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

/**
 * Format file size
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Validate email format
 */
export const validateEmail = (email: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

/**
 * Validate phone number format (简单的中国手机号验证)
 */
export const validatePhone = (phone: string): boolean => {
  const re = /^1[3-9]\d{9}$/
  return re.test(phone)
}

/**
 * Generate unique ID
 */
export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36)
}

/**
 * Deep clone object
 */
export const deepClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') return obj
  if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as unknown as T
  if (typeof obj === 'object') {
    const clonedObj = {} as T
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        clonedObj[key] = deepClone(obj[key])
      }
    }
    return clonedObj
  }
  return obj
}