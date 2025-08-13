/**
 * Platform Adapter - Web-only implementation
 *
 * This utility provides a unified API for web environments.
 * Converted from UniApp hybrid to pure web implementation.
 */

/**
 * Check if running in UniApp environment
 */
export const isUniApp = (): boolean => {
  return false // Always false for web-only implementation
}

/**
 * Check if running in standard web environment
 */
export const isWeb = (): boolean => {
  return typeof window !== 'undefined'
}

/**
 * Storage API abstraction
 */
export const storage = {
  /**
   * Get item from storage
   */
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key)
    } catch (error) {
      console.error('Storage getItem error:', error)
      return null
    }
  },

  /**
   * Set item in storage
   */
  setItem: (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value)
    } catch (error) {
      console.error('Storage setItem error:', error)
    }
  },

  /**
   * Remove item from storage
   */
  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.error('Storage removeItem error:', error)
    }
  },

  /**
   * Get JSON object from storage
   */
  getJSON: (key: string): any => {
    const value = storage.getItem(key)
    if (!value) return null

    try {
      return JSON.parse(value)
    } catch (error) {
      console.error('Storage getJSON parse error:', error)
      return null
    }
  },

  /**
   * Set JSON object to storage
   */
  setJSON: (key: string, value: any): void => {
    try {
      const jsonString = JSON.stringify(value)
      storage.setItem(key, jsonString)
    } catch (error) {
      console.error('Storage setJSON stringify error:', error)
    }
  }
}

/**
 * Toast/Alert API abstraction
 */
export const toast = {
  /**
   * Show toast message
   */
  show: (title: string, icon: 'success' | 'error' | 'none' = 'none', duration = 2000) => {
    // Use browser alert for now - could be replaced with a toast library
    alert(title)
  },

  /**
   * Show success toast
   */
  success: (title: string, duration = 2000) => {
    toast.show(title, 'success', duration)
  },

  /**
   * Show error toast
   */
  error: (title: string, duration = 2000) => {
    toast.show(title, 'error', duration)
  }
}

/**
 * Modal/Dialog API abstraction
 */
export const dialog = {
  /**
   * Show modal dialog
   */
  confirm: (options: {
    title?: string
    content: string
    confirmText?: string
    cancelText?: string
  }) => {
    return new Promise<boolean>(resolve => {
      const result = confirm(`${options.title || '提示'}\n${options.content}`)
      resolve(result)
    })
  }
}

/**
 * Loading API abstraction
 */
export const loading = {
  /**
   * Show loading
   */
  show: (title = '加载中...') => {
    // For web, could implement a loading overlay
    console.log('Loading:', title)
  },

  /**
   * Hide loading
   */
  hide: () => {
    // For web, hide loading overlay
    console.log('Loading hidden')
  }
}

/**
 * Location API abstraction
 */
export const location = {
  /**
   * Get current position
   */
  getCurrentPosition: () => {
    return new Promise<{ latitude: number; longitude: number }>((resolve, reject) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          position => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            })
          },
          error => {
            reject(error)
          }
        )
      } else {
        reject(new Error('Geolocation not supported'))
      }
    })
  }
}

/**
 * Media API abstraction
 */
export const media = {
  /**
   * Choose image
   */
  chooseImage: (
    options: {
      count?: number
      sizeType?: string[]
      sourceType?: string[]
    } = {}
  ) => {
    return new Promise<{ tempFiles: any[] }>((resolve, reject) => {
      // For web, use file input
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'image/*'
      input.multiple = (options.count || 1) > 1

      input.onchange = e => {
        const files = (e.target as HTMLInputElement).files
        if (files) {
          const tempFiles = Array.from(files).map(file => ({
            path: URL.createObjectURL(file),
            size: file.size
          }))
          resolve({ tempFiles })
        } else {
          reject(new Error('No files selected'))
        }
      }

      input.click()
    })
  },

  /**
   * Preview image
   */
  previewImage: (options: { current?: number; urls: string[] }) => {
    // For web, open in new window
    const url = options.urls[options.current || 0]
    window.open(url, '_blank')
  }
}

/**
 * Haptic feedback abstraction
 */
export const haptic = {
  /**
   * Light vibration
   */
  vibrate: (type: 'light' | 'medium' | 'heavy' = 'light') => {
    if ('vibrate' in navigator) {
      // Web Vibration API
      const patterns = {
        light: 50,
        medium: 100,
        heavy: 200
      }
      navigator.vibrate(patterns[type])
    }
  }
}

/**
 * Analytics abstraction
 */
export const analytics = {
  /**
   * Report analytics event
   */
  report: (eventName: string, data: any = {}) => {
    // For web, could integrate with Google Analytics, etc.
    console.log('Analytics:', eventName, data)
  }
}

/**
 * Enhanced navigation with router integration
 */
export const navigation = {
  /**
   * Navigate to a page
   */
  navigateTo: (url: string) => {
    // For web, assume Vue Router is available globally
    if (typeof window !== 'undefined' && (window as any).__VUE_ROUTER__) {
      ;(window as any).__VUE_ROUTER__.push(url)
    } else {
      window.location.href = url
    }
  },

  /**
   * Redirect to a page (replace current)
   */
  redirectTo: (url: string) => {
    if (typeof window !== 'undefined' && (window as any).__VUE_ROUTER__) {
      ;(window as any).__VUE_ROUTER__.replace(url)
    } else {
      window.location.replace(url)
    }
  },

  /**
   * Go back to previous page
   */
  goBack: (delta = 1) => {
    if (typeof window !== 'undefined' && (window as any).__VUE_ROUTER__) {
      ;(window as any).__VUE_ROUTER__.go(-delta)
    } else {
      window.history.go(-delta)
    }
  },

  /**
   * Switch to tab page
   */
  switchTab: (url: string) => {
    navigation.navigateTo(url)
  },

  /**
   * Relaunch app to a page
   */
  reLaunch: (url: string) => {
    window.location.href = url
  }
}

/**
 * Device info abstraction
 */
export const device = {
  /**
   * Get system info
   */
  getSystemInfo: () => {
    return {
      platform: 'web',
      system: navigator.userAgent,
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight
    }
  }
}
