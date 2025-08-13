/**
 * Real-time Data Service
 *
 * Provides real-time data synchronization using Supabase's real-time capabilities.
 * Automatically updates stores when database changes occur.
 */

import { supabase } from '@/api/config'
import { useAuthStore } from '@/stores/auth'
import { useCustomersStore } from '@/stores/customers'
import { useProductsStore } from '@/stores/products'
import { useQuotesStore } from '@/stores/quotes'
import { useUsersStore } from '@/stores/users'
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'

/**
 * Real-time subscription manager
 */
class RealtimeService {
  private channels: Map<string, RealtimeChannel> = new Map()
  private isConnected = false
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000

  /**
   * Initialize real-time service
   */
  async initialize() {
    console.log('🔄 Initializing real-time service...')

    try {
      // Subscribe to all required tables
      await this.subscribeToCustomers()
      await this.subscribeToProducts()
      await this.subscribeToQuotes()
      await this.subscribeToUsers()

      this.isConnected = true
      this.reconnectAttempts = 0
      console.log('✅ Real-time service initialized successfully')
    } catch (error) {
      console.error('❌ Failed to initialize real-time service:', error)
      this.handleConnectionError()
    }
  }

  /**
   * Subscribe to customers table changes
   */
  private async subscribeToCustomers() {
    const channel = supabase
      .channel('customers-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'customers'
        },
        payload => this.handleCustomersChange(payload)
      )
      .subscribe(status => {
        console.log('📊 Customers subscription status:', status)
      })

    this.channels.set('customers', channel)
  }

  /**
   * Subscribe to products table changes
   */
  private async subscribeToProducts() {
    const channel = supabase
      .channel('products-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products'
        },
        payload => this.handleProductsChange(payload)
      )
      .subscribe(status => {
        console.log('🛍️ Products subscription status:', status)
      })

    this.channels.set('products', channel)
  }

  /**
   * Subscribe to quotes table changes
   */
  private async subscribeToQuotes() {
    const channel = supabase
      .channel('quotes-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'quotes'
        },
        payload => this.handleQuotesChange(payload)
      )
      .subscribe(status => {
        console.log('📄 Quotes subscription status:', status)
      })

    this.channels.set('quotes', channel)
  }

  /**
   * Subscribe to users table changes (admin only)
   */
  private async subscribeToUsers() {
    const authStore = useAuthStore()

    // Only admins and managers can subscribe to user changes
    if (!authStore.user || !['admin', 'sales_manager'].includes(authStore.user.role)) {
      console.log('⚠️ User subscription skipped - insufficient permissions')
      return
    }

    const channel = supabase
      .channel('users-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users'
        },
        payload => this.handleUsersChange(payload)
      )
      .subscribe(status => {
        console.log('👥 Users subscription status:', status)
      })

    this.channels.set('users', channel)
  }

  /**
   * Handle customers table changes
   */
  private handleCustomersChange(payload: RealtimePostgresChangesPayload<any>) {
    console.log('📊 Customer change detected:', payload.eventType, payload.new || payload.old)

    const customersStore = useCustomersStore()

    switch (payload.eventType) {
      case 'INSERT':
        if (payload.new) {
          customersStore.customers.unshift(payload.new)
          customersStore.totalCount++
          this.showChangeNotification('客户', '新增', payload.new.name)
        }
        break

      case 'UPDATE':
        if (payload.new) {
          const index = customersStore.customers.findIndex(c => c.id === payload.new.id)
          if (index !== -1) {
            customersStore.customers[index] = { ...customersStore.customers[index], ...payload.new }
          }

          // Update current customer if it's being viewed
          if (customersStore.currentCustomer?.id === payload.new.id) {
            customersStore.currentCustomer = { ...customersStore.currentCustomer, ...payload.new }
          }

          this.showChangeNotification('客户', '更新', payload.new.name)
        }
        break

      case 'DELETE':
        if (payload.old) {
          customersStore.customers = customersStore.customers.filter(c => c.id !== payload.old.id)
          customersStore.totalCount--

          // Clear current customer if it was deleted
          if (customersStore.currentCustomer?.id === payload.old.id) {
            customersStore.currentCustomer = null
          }

          this.showChangeNotification('客户', '删除', payload.old.name)
        }
        break
    }
  }

  /**
   * Handle products table changes
   */
  private handleProductsChange(payload: RealtimePostgresChangesPayload<any>) {
    console.log('🛍️ Product change detected:', payload.eventType, payload.new || payload.old)

    const productsStore = useProductsStore()

    switch (payload.eventType) {
      case 'INSERT':
        if (payload.new) {
          productsStore.products.unshift(payload.new)
          productsStore.total++
          this.showChangeNotification('产品', '新增', payload.new.name)
        }
        break

      case 'UPDATE':
        if (payload.new) {
          const index = productsStore.products.findIndex(p => p.id === payload.new.id)
          if (index !== -1) {
            productsStore.products[index] = { ...productsStore.products[index], ...payload.new }
          }

          // Update current product if it's being viewed
          if (productsStore.currentProduct?.id === payload.new.id) {
            productsStore.currentProduct = { ...productsStore.currentProduct, ...payload.new }
          }

          this.showChangeNotification('产品', '更新', payload.new.name)
        }
        break

      case 'DELETE':
        if (payload.old) {
          productsStore.products = productsStore.products.filter(p => p.id !== payload.old.id)
          productsStore.total--

          // Clear current product if it was deleted
          if (productsStore.currentProduct?.id === payload.old.id) {
            productsStore.currentProduct = null
          }

          this.showChangeNotification('产品', '删除', payload.old.name)
        }
        break
    }
  }

  /**
   * Handle quotes table changes
   */
  private handleQuotesChange(payload: RealtimePostgresChangesPayload<any>) {
    console.log('📄 Quote change detected:', payload.eventType, payload.new || payload.old)

    const quotesStore = useQuotesStore()

    switch (payload.eventType) {
      case 'INSERT':
        if (payload.new) {
          quotesStore.quotes.unshift(payload.new)
          quotesStore.total++
          this.showChangeNotification('报价单', '新增', payload.new.quote_no)
        }
        break

      case 'UPDATE':
        if (payload.new) {
          const index = quotesStore.quotes.findIndex(q => q.id === payload.new.id)
          if (index !== -1) {
            quotesStore.quotes[index] = { ...quotesStore.quotes[index], ...payload.new }
          }

          // Update current quote if it's being viewed
          if (quotesStore.currentQuote?.id === payload.new.id) {
            quotesStore.currentQuote = { ...quotesStore.currentQuote, ...payload.new }
          }

          // Show special notification for status changes
          if (payload.old && payload.old.status !== payload.new.status) {
            this.showStatusChangeNotification(
              '报价单',
              payload.new.quote_no,
              payload.old.status,
              payload.new.status
            )
          } else {
            this.showChangeNotification('报价单', '更新', payload.new.quote_no)
          }
        }
        break

      case 'DELETE':
        if (payload.old) {
          quotesStore.quotes = quotesStore.quotes.filter(q => q.id !== payload.old.id)
          quotesStore.total--

          // Clear current quote if it was deleted
          if (quotesStore.currentQuote?.id === payload.old.id) {
            quotesStore.currentQuote = null
          }

          this.showChangeNotification('报价单', '删除', payload.old.quote_no)
        }
        break
    }
  }

  /**
   * Handle users table changes
   */
  private handleUsersChange(payload: RealtimePostgresChangesPayload<any>) {
    console.log('👥 User change detected:', payload.eventType, payload.new || payload.old)

    const usersStore = useUsersStore()

    switch (payload.eventType) {
      case 'INSERT':
        if (payload.new) {
          usersStore.users.unshift(payload.new)
          usersStore.totalCount++
          this.showChangeNotification('用户', '新增', payload.new.name || payload.new.username)
        }
        break

      case 'UPDATE':
        if (payload.new) {
          const index = usersStore.users.findIndex(u => u.id === payload.new.id)
          if (index !== -1) {
            usersStore.users[index] = { ...usersStore.users[index], ...payload.new }
          }

          // Update current user if it's being viewed
          if (usersStore.currentUser?.id === payload.new.id) {
            usersStore.currentUser = { ...usersStore.currentUser, ...payload.new }
          }

          this.showChangeNotification('用户', '更新', payload.new.name || payload.new.username)
        }
        break

      case 'DELETE':
        if (payload.old) {
          usersStore.users = usersStore.users.filter(u => u.id !== payload.old.id)
          usersStore.totalCount--

          // Clear current user if it was deleted
          if (usersStore.currentUser?.id === payload.old.id) {
            usersStore.currentUser = null
          }

          this.showChangeNotification('用户', '删除', payload.old.name || payload.old.username)
        }
        break
    }
  }

  /**
   * Show change notification to user
   */
  private showChangeNotification(entityType: string, action: string, name: string) {
    // Only show notifications if user is not actively editing
    // Web implementation - check current location path
    const currentPath = window.location.pathname

    // Don't show notifications on edit pages to avoid disrupting user input
    if (currentPath.includes('/edit')) {
      return
    }

    // Web implementation - use console log and alert for notifications
    const message = `${entityType}${action}: ${name}`
    console.log('Real-time notification:', message)
    
    // For less disruptive notifications, use a toast-like approach
    // This could be replaced with a proper toast notification library in the future
    if (entityType !== '用户') { // Don't show intrusive alerts for user changes
      // You could implement a custom toast notification here
      console.log(`📢 ${message}`)
    }
  }

  /**
   * Show status change notification
   */
  private showStatusChangeNotification(
    entityType: string,
    name: string,
    oldStatus: string,
    newStatus: string
  ) {
    const statusMap: Record<string, string> = {
      pending: '待审批',
      approved: '已批准',
      rejected: '已拒绝',
      completed: '已完成',
      draft: '草稿',
      active: '活跃',
      inactive: '停用'
    }

    const oldStatusText = statusMap[oldStatus] || oldStatus
    const newStatusText = statusMap[newStatus] || newStatus

    // Web implementation - use console log for status change notifications
    const message = `${entityType} ${name} 状态变更: ${oldStatusText} → ${newStatusText}`
    console.log('Status change notification:', message)
    
    // For important status changes (like approvals), show alert
    if (newStatus === 'approved' || newStatus === 'rejected') {
      alert(message)
    }
  }

  /**
   * Handle connection errors
   */
  private handleConnectionError() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      console.log(
        `🔄 Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`
      )

      setTimeout(() => {
        this.initialize()
      }, this.reconnectDelay * this.reconnectAttempts) // Exponential backoff
    } else {
      console.error('❌ Max reconnection attempts reached. Real-time updates disabled.')
      
      // Web implementation - use console error and alert for critical connection failures
      const message = '实时更新连接失败'
      console.error('Real-time connection failed:', message)
      alert(message)
    }
  }

  /**
   * Disconnect all subscriptions
   */
  async disconnect() {
    console.log('🔌 Disconnecting real-time service...')

    for (const [name, channel] of this.channels) {
      await supabase.removeChannel(channel)
      console.log(`📡 Unsubscribed from ${name}`)
    }

    this.channels.clear()
    this.isConnected = false
    console.log('✅ Real-time service disconnected')
  }

  /**
   * Reconnect to real-time service
   */
  async reconnect() {
    await this.disconnect()
    await this.initialize()
  }

  /**
   * Get connection status
   */
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      channelCount: this.channels.size,
      channels: Array.from(this.channels.keys())
    }
  }

  /**
   * Subscribe to a custom table
   */
  async subscribeToTable(
    tableName: string,
    callback: (payload: RealtimePostgresChangesPayload<any>) => void
  ) {
    const channelName = `${tableName}-channel`

    if (this.channels.has(channelName)) {
      console.warn(`⚠️ Already subscribed to ${tableName}`)
      return
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: tableName
        },
        callback
      )
      .subscribe(status => {
        console.log(`📡 ${tableName} subscription status:`, status)
      })

    this.channels.set(channelName, channel)
  }

  /**
   * Unsubscribe from a custom table
   */
  async unsubscribeFromTable(tableName: string) {
    const channelName = `${tableName}-channel`
    const channel = this.channels.get(channelName)

    if (channel) {
      await supabase.removeChannel(channel)
      this.channels.delete(channelName)
      console.log(`📡 Unsubscribed from ${tableName}`)
    }
  }
}

// Create singleton instance
export const realtimeService = new RealtimeService()

/**
 * Composable for using real-time features in components
 */
export function useRealtime() {
  return {
    realtimeService,

    /**
     * Get connection status
     */
    getStatus: () => realtimeService.getConnectionStatus(),

    /**
     * Subscribe to table changes
     */
    subscribe: (tableName: string, callback: (payload: any) => void) =>
      realtimeService.subscribeToTable(tableName, callback),

    /**
     * Unsubscribe from table changes
     */
    unsubscribe: (tableName: string) => realtimeService.unsubscribeFromTable(tableName),

    /**
     * Reconnect to real-time service
     */
    reconnect: () => realtimeService.reconnect(),

    /**
     * Check if connected
     */
    isConnected: () => realtimeService.getConnectionStatus().isConnected
  }
}
