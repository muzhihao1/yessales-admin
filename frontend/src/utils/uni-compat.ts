/**
 * UniApp API Compatibility Layer for Web Environment
 * Provides fallback implementations for UniApp APIs when running in standard web environment
 */

export interface UniModal {
  showModal(options: {
    title?: string
    content?: string
    showCancel?: boolean
    cancelText?: string
    confirmText?: string
    success?: (res: { confirm: boolean; cancel: boolean }) => void
    fail?: (err: any) => void
    complete?: () => void
  }): void
}

export interface UniToast {
  showToast(options: {
    title: string
    icon?: 'success' | 'error' | 'loading' | 'none'
    image?: string
    duration?: number
    mask?: boolean
    success?: () => void
    fail?: (err: any) => void
    complete?: () => void
  }): void

  hideToast(): void
}

export interface UniNavigation {
  navigateTo(options: {
    url: string
    animationType?: string
    animationDuration?: number
    success?: () => void
    fail?: (err: any) => void
    complete?: () => void
  }): void

  navigateBack(options?: {
    delta?: number
    animationType?: string
    animationDuration?: number
    success?: () => void
    fail?: (err: any) => void
    complete?: () => void
  }): void

  setNavigationBarTitle(options: {
    title: string
    success?: () => void
    fail?: (err: any) => void
    complete?: () => void
  }): void
}

export interface UniAPI extends UniModal, UniToast, UniNavigation {
  // Additional uni APIs can be added here
}

/**
 * Web implementation of UniApp APIs using native browser APIs
 */
class WebUniAPI implements UniAPI {
  showModal(options: {
    title?: string
    content?: string
    showCancel?: boolean
    cancelText?: string
    confirmText?: string
    success?: (res: { confirm: boolean; cancel: boolean }) => void
    fail?: (err: any) => void
    complete?: () => void
  }): void {
    try {
      const result = window.confirm(
        options.title && options.content
          ? `${options.title}\n\n${options.content}`
          : options.content || options.title || '确认操作?'
      )

      if (options.success) {
        options.success({
          confirm: result,
          cancel: !result
        })
      }
    } catch (error) {
      if (options.fail) {
        options.fail(error)
      }
    } finally {
      if (options.complete) {
        options.complete()
      }
    }
  }

  showToast(options: {
    title: string
    icon?: 'success' | 'error' | 'loading' | 'none'
    image?: string
    duration?: number
    mask?: boolean
    success?: () => void
    fail?: (err: any) => void
    complete?: () => void
  }): void {
    try {
      // Create toast element
      const toast = document.createElement('div')
      toast.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        font-size: 14px;
        z-index: 10000;
        max-width: 200px;
        text-align: center;
        word-break: break-all;
        pointer-events: none;
      `

      // Add icon if specified
      let iconText = ''
      switch (options.icon) {
        case 'success':
          iconText = '✓ '
          break
        case 'error':
          iconText = '✗ '
          break
        case 'loading':
          iconText = '⟳ '
          break
        default:
          break
      }

      toast.textContent = iconText + options.title
      document.body.appendChild(toast)

      // Auto remove after duration
      const duration = options.duration || 1500
      setTimeout(() => {
        if (toast.parentNode) {
          document.body.removeChild(toast)
        }
      }, duration)

      if (options.success) {
        options.success()
      }
    } catch (error) {
      if (options.fail) {
        options.fail(error)
      }
    } finally {
      if (options.complete) {
        options.complete()
      }
    }
  }

  hideToast(): void {
    // Remove all existing toasts
    const toasts = document.querySelectorAll('[style*="z-index: 10000"]')
    toasts.forEach(toast => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast)
      }
    })
  }

  navigateTo(options: {
    url: string
    animationType?: string
    animationDuration?: number
    success?: () => void
    fail?: (err: any) => void
    complete?: () => void
  }): void {
    try {
      // Convert UniApp path to web route
      let webPath = options.url

      // Remove leading slash if present and convert to hash route
      if (webPath.startsWith('/')) {
        webPath = webPath.substring(1)
      }

      // Convert pages/admin/dashboard/index to /admin/dashboard
      webPath = webPath.replace(/^pages\//, '/').replace(/\/index$/, '')

      // Use Vue Router if available, otherwise fallback to hash navigation
      if (window.location.hash) {
        window.location.hash = '#' + webPath
      } else {
        window.location.pathname = webPath
      }

      if (options.success) {
        options.success()
      }
    } catch (error) {
      if (options.fail) {
        options.fail(error)
      }
    } finally {
      if (options.complete) {
        options.complete()
      }
    }
  }

  navigateBack(options?: {
    delta?: number
    animationType?: string
    animationDuration?: number
    success?: () => void
    fail?: (err: any) => void
    complete?: () => void
  }): void {
    try {
      const delta = options?.delta || 1
      window.history.go(-delta)

      if (options?.success) {
        options.success()
      }
    } catch (error) {
      if (options?.fail) {
        options.fail(error)
      }
    } finally {
      if (options?.complete) {
        options.complete()
      }
    }
  }

  setNavigationBarTitle(options: {
    title: string
    success?: () => void
    fail?: (err: any) => void
    complete?: () => void
  }): void {
    try {
      document.title = options.title

      if (options.success) {
        options.success()
      }
    } catch (error) {
      if (options.fail) {
        options.fail(error)
      }
    } finally {
      if (options.complete) {
        options.complete()
      }
    }
  }
}

/**
 * Initialize UniApp compatibility layer for web environment
 */
export function initializeUniCompat(): void {
  if (typeof window !== 'undefined' && !window.uni) {
    // Only initialize if uni is not already defined
    ;(window as any).uni = new WebUniAPI()
    console.log('UniApp compatibility layer initialized for web environment')
  }
}

/**
 * Check if we're running in a web environment without UniApp runtime
 */
export function isWebEnvironment(): boolean {
  return typeof window !== 'undefined' && !window.uni
}
