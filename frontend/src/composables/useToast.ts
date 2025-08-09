import { createApp, nextTick, ref } from 'vue'
import EnhancedToast from '@/components/common/EnhancedToast.vue'

interface ToastOptions {
  type?: 'success' | 'error' | 'warning' | 'info' | 'loading'
  title?: string
  message: string
  duration?: number
  position?: 'top' | 'center' | 'bottom'
  closable?: boolean
  showProgress?: boolean
  actionText?: string
  vibrate?: boolean
  onAction?: () => void
  onClick?: () => void
  onClose?: () => void
}

interface ToastInstance {
  id: string
  close: () => void
  update: (options: Partial<ToastOptions>) => void
}

class ToastManager {
  private instances: Map<string, any> = new Map()
  private containerId = 'toast-container'

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  private getContainer(): HTMLElement {
    let container = document.getElementById(this.containerId)
    if (!container) {
      container = document.createElement('div')
      container.id = this.containerId
      container.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        pointer-events: none;
        z-index: 9999;
      `
      document.body.appendChild(container)
    }
    return container
  }

  show(options: ToastOptions): ToastInstance {
    const id = this.generateId()

    // Create a wrapper div for this toast
    const wrapper = document.createElement('div')
    wrapper.style.pointerEvents = 'auto'

    // Create Vue app instance
    const app = createApp(EnhancedToast, {
      ...options,
      onClose: () => {
        this.remove(id)
        options.onClose?.()
      },
      onAction: () => {
        options.onAction?.()
      },
      onClick: () => {
        options.onClick?.()
      }
    })

    const vm = app.mount(wrapper)

    // Add to container
    const container = this.getContainer()
    container.appendChild(wrapper)

    // Store instance
    const instance = {
      id,
      app,
      wrapper,
      vm,
      close: () => this.remove(id),
      update: (newOptions: Partial<ToastOptions>) => {
        // Update component props
        Object.assign(vm.$props, newOptions)
      }
    }

    this.instances.set(id, instance)

    return {
      id,
      close: () => this.remove(id),
      update: (newOptions: Partial<ToastOptions>) => instance.update(newOptions)
    }
  }

  remove(id: string) {
    const instance = this.instances.get(id)
    if (instance) {
      // Remove from DOM
      instance.wrapper.remove()
      // Unmount Vue instance
      instance.app.unmount()
      // Remove from instances
      this.instances.delete(id)
    }
  }

  clear() {
    this.instances.forEach((_, id) => {
      this.remove(id)
    })
  }

  // Convenience methods
  success(message: string, options?: Partial<ToastOptions>): ToastInstance {
    return this.show({
      type: 'success',
      message,
      duration: 3000,
      showProgress: true,
      vibrate: false,
      ...options
    })
  }

  error(message: string, options?: Partial<ToastOptions>): ToastInstance {
    return this.show({
      type: 'error',
      message,
      duration: 5000,
      closable: true,
      vibrate: true,
      ...options
    })
  }

  warning(message: string, options?: Partial<ToastOptions>): ToastInstance {
    return this.show({
      type: 'warning',
      message,
      duration: 4000,
      showProgress: true,
      vibrate: true,
      ...options
    })
  }

  info(message: string, options?: Partial<ToastOptions>): ToastInstance {
    return this.show({
      type: 'info',
      message,
      duration: 3000,
      showProgress: true,
      ...options
    })
  }

  loading(message: string, options?: Partial<ToastOptions>): ToastInstance {
    return this.show({
      type: 'loading',
      message,
      duration: 0, // Don't auto-dismiss loading toasts
      closable: false,
      ...options
    })
  }

  // Form-specific feedback methods
  validationError(field: string, message: string): ToastInstance {
    return this.error(`${field}: ${message}`, {
      title: '表单验证错误',
      position: 'top',
      duration: 4000
    })
  }

  formSuccess(message: string = '操作成功'): ToastInstance {
    return this.success(message, {
      title: '操作成功',
      showProgress: true,
      duration: 2000
    })
  }

  networkError(action: string = '网络请求'): ToastInstance {
    return this.error('网络连接异常，请检查网络设置后重试', {
      title: `${action}失败`,
      actionText: '重试',
      duration: 0,
      closable: true
    })
  }
}

// Create global instance
const toastManager = new ToastManager()

// Composable function
export function useToast() {
  // For H5 platform, use the enhanced toast manager
  // #ifdef H5
  return {
    show: (options: ToastOptions) => toastManager.show(options),
    success: (message: string, options?: Partial<ToastOptions>) =>
      toastManager.success(message, options),
    error: (message: string, options?: Partial<ToastOptions>) =>
      toastManager.error(message, options),
    warning: (message: string, options?: Partial<ToastOptions>) =>
      toastManager.warning(message, options),
    info: (message: string, options?: Partial<ToastOptions>) => toastManager.info(message, options),
    loading: (message: string, options?: Partial<ToastOptions>) =>
      toastManager.loading(message, options),
    clear: () => toastManager.clear(),

    // Form-specific methods
    validationError: (field: string, message: string) =>
      toastManager.validationError(field, message),
    formSuccess: (message?: string) => toastManager.formSuccess(message),
    networkError: (action?: string) => toastManager.networkError(action)
  }
  // #endif

  // For other platforms, fall back to uni.showToast
  // #ifndef H5
  return {
    show: (options: ToastOptions) => {
      uni.showToast({
        title: options.message,
        icon:
          options.type === 'success' ? 'success' : options.type === 'loading' ? 'loading' : 'none',
        duration: options.duration || 3000
      })

      return {
        id: Date.now().toString(),
        close: () => uni.hideToast(),
        update: () => {}
      }
    },

    success: (message: string) => {
      uni.showToast({
        title: message,
        icon: 'success',
        duration: 2000
      })
      return { id: '', close: () => {}, update: () => {} }
    },

    error: (message: string) => {
      uni.showToast({
        title: message,
        icon: 'none',
        duration: 3000
      })
      if (uni.vibrateShort) {
        uni.vibrateShort()
      }
      return { id: '', close: () => {}, update: () => {} }
    },

    warning: (message: string) => {
      uni.showToast({
        title: message,
        icon: 'none',
        duration: 3000
      })
      return { id: '', close: () => {}, update: () => {} }
    },

    info: (message: string) => {
      uni.showToast({
        title: message,
        icon: 'none',
        duration: 2500
      })
      return { id: '', close: () => {}, update: () => {} }
    },

    loading: (message: string) => {
      uni.showLoading({
        title: message
      })
      return {
        id: '',
        close: () => uni.hideLoading(),
        update: () => {}
      }
    },

    clear: () => {
      uni.hideToast()
      uni.hideLoading()
    },

    // Form-specific methods
    validationError: (field: string, message: string) => {
      uni.showToast({
        title: `${field}: ${message}`,
        icon: 'none',
        duration: 3000
      })
      return { id: '', close: () => {}, update: () => {} }
    },

    formSuccess: (message: string = '操作成功') => {
      uni.showToast({
        title: message,
        icon: 'success',
        duration: 2000
      })
      return { id: '', close: () => {}, update: () => {} }
    },

    networkError: () => {
      uni.showToast({
        title: '网络连接异常，请检查网络设置',
        icon: 'none',
        duration: 3000
      })
      return { id: '', close: () => {}, update: () => {} }
    }
  }
  // #endif
}

export default useToast

// Global toast instance for direct use
export const toast = toastManager
