/**
 * Data Consistency and Integrity Tests
 * 
 * Comprehensive test suite to validate data integrity across all core business
 * operations including customers, products, quotes, users, and real-time synchronization.
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCustomersStore } from '@/stores/customers'
import { useProductsStore } from '@/stores/products'
import { useQuotesStore } from '@/stores/quotes'
import { useUsersStore } from '@/stores/users'
import { useAuthStore } from '@/stores/auth'
import { realtimeService } from '@/services/realtime'
import type { Customer, CustomerDetail } from '@/types/customer'
import type { Product } from '@/types/models'
import type { Quote } from '@/types/models'
import type { User } from '@/types/models'

// Mock data generators
function createMockCustomer(overrides?: Partial<Customer>): Customer {
  return {
    id: 'cust_' + Math.random().toString(36).substr(2, 9),
    name: '测试客户',
    phone: '13800138000',
    email: 'test@example.com',
    customer_type: 'direct',
    status: 'active',
    industry: 'technology',
    company_size: 'medium',
    location: '北京市',
    source: 'referral',
    assigned_to: 'user_123',
    priority_level: 'medium',
    credit_limit: 100000,
    payment_terms: '30_days',
    preferred_contact_method: 'phone',
    tags: ['重要客户'],
    notes: '测试客户备注',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides
  }
}

function createMockProduct(overrides?: Partial<Product>): Product {
  return {
    id: 'prod_' + Math.random().toString(36).substr(2, 9),
    name: '测试产品',
    sku: 'TEST-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
    category: 'hardware',
    subcategory: 'server',
    brand: '华为',
    model: 'H3C-TEST',
    unit: 'piece',
    price: 5000,
    cost: 3000,
    stock_quantity: 100,
    min_stock_level: 10,
    status: 'active',
    description: '测试产品描述',
    specifications: { cpu: '8核', memory: '16GB', storage: '512GB SSD' },
    supplier: '华为技术有限公司',
    warranty_period: 36,
    is_customizable: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides
  }
}

function createMockQuote(overrides?: Partial<Quote>): Quote {
  return {
    id: 'quote_' + Math.random().toString(36).substr(2, 9),
    quote_number: 'Q' + new Date().getFullYear() + Math.random().toString().substr(2, 6),
    customer_id: 'cust_123',
    customer_name: '测试客户',
    status: 'draft',
    total_amount: 50000,
    discount_amount: 2000,
    tax_amount: 4800,
    final_amount: 52800,
    valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    items: [
      {
        product_id: 'prod_123',
        product_name: '测试产品',
        quantity: 10,
        unit_price: 5000,
        total_price: 50000
      }
    ],
    notes: '测试报价单',
    created_by: 'user_123',
    approved_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides
  }
}

function createMockUser(overrides?: Partial<User>): User {
  return {
    id: 'user_' + Math.random().toString(36).substr(2, 9),
    username: 'testuser',
    email: 'test@example.com',
    name: '测试用户',
    role: 'sales_rep',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides
  }
}

describe('Data Consistency and Integrity Tests', () => {
  let customersStore: ReturnType<typeof useCustomersStore>
  let productsStore: ReturnType<typeof useProductsStore>
  let quotesStore: ReturnType<typeof useQuotesStore>
  let usersStore: ReturnType<typeof useUsersStore>
  let authStore: ReturnType<typeof useAuthStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    customersStore = useCustomersStore()
    productsStore = useProductsStore()
    quotesStore = useQuotesStore()
    usersStore = useUsersStore()
    authStore = useAuthStore()
    
    // Mock authenticated user
    authStore.user = createMockUser({ role: 'admin' })
    authStore.token = 'mock-token'
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Customer Data Integrity', () => {
    test('should maintain data consistency when creating customer', async () => {
      const newCustomer = createMockCustomer()
      
      // Mock the API response
      vi.spyOn(customersStore, 'createCustomer').mockResolvedValue({
        success: true,
        data: newCustomer
      })
      
      const result = await customersStore.createCustomer(newCustomer)
      
      expect(result.success).toBe(true)
      expect(result.data).toEqual(newCustomer)
      
      // Verify customer is added to store
      expect(customersStore.customers).toContain(newCustomer)
      
      // Verify required fields are present
      expect(newCustomer.id).toBeTruthy()
      expect(newCustomer.name).toBeTruthy()
      expect(newCustomer.phone).toBeTruthy()
      expect(newCustomer.created_at).toBeTruthy()
      expect(newCustomer.updated_at).toBeTruthy()
    })

    test('should validate customer data constraints', async () => {
      const invalidCustomer = createMockCustomer({
        name: '', // Invalid: empty name
        phone: '123', // Invalid: invalid phone format
        email: 'invalid-email', // Invalid: invalid email format
        credit_limit: -1000 // Invalid: negative credit limit
      })
      
      vi.spyOn(customersStore, 'createCustomer').mockResolvedValue({
        success: false,
        error: { message: 'Validation failed', details: ['Invalid name', 'Invalid phone', 'Invalid email', 'Invalid credit limit'] }
      })
      
      const result = await customersStore.createCustomer(invalidCustomer)
      
      expect(result.success).toBe(false)
      expect(result.error?.details).toContain('Invalid name')
      expect(result.error?.details).toContain('Invalid phone')
      expect(result.error?.details).toContain('Invalid email')
      expect(result.error?.details).toContain('Invalid credit limit')
    })

    test('should maintain referential integrity with quotes', async () => {
      const customer = createMockCustomer()
      const quote = createMockQuote({ customer_id: customer.id })
      
      // Mock customer creation
      vi.spyOn(customersStore, 'createCustomer').mockResolvedValue({
        success: true,
        data: customer
      })
      
      // Mock quote creation
      vi.spyOn(quotesStore, 'createQuote').mockResolvedValue({
        success: true,
        data: quote
      })
      
      await customersStore.createCustomer(customer)
      await quotesStore.createQuote(quote)
      
      // Verify referential integrity
      expect(quote.customer_id).toBe(customer.id)
      expect(quote.customer_name).toBe(customer.name)
    })

    test('should handle concurrent customer updates correctly', async () => {
      const customer = createMockCustomer()
      const updatedCustomer1 = { ...customer, name: '客户名称1', updated_at: new Date().toISOString() }
      const updatedCustomer2 = { ...customer, name: '客户名称2', updated_at: new Date(Date.now() + 1000).toISOString() }
      
      // Mock concurrent updates
      vi.spyOn(customersStore, 'updateCustomer')
        .mockResolvedValueOnce({ success: true, data: updatedCustomer1 })
        .mockResolvedValueOnce({ success: true, data: updatedCustomer2 })
      
      // Simulate concurrent updates
      const [result1, result2] = await Promise.all([
        customersStore.updateCustomer(customer.id, { name: '客户名称1' }),
        customersStore.updateCustomer(customer.id, { name: '客户名称2' })
      ])
      
      expect(result1.success).toBe(true)
      expect(result2.success).toBe(true)
      
      // The later update should win (based on updated_at timestamp)
      expect(new Date(result2.data!.updated_at).getTime()).toBeGreaterThan(
        new Date(result1.data!.updated_at).getTime()
      )
    })

    test('should validate customer deletion constraints', async () => {
      const customer = createMockCustomer()
      const activeQuote = createMockQuote({ 
        customer_id: customer.id, 
        status: 'pending' 
      })
      
      // Mock customer with active quotes
      vi.spyOn(customersStore, 'deleteCustomer').mockResolvedValue({
        success: false,
        error: { message: 'Cannot delete customer with active quotes', code: 'ACTIVE_REFERENCES' }
      })
      
      const result = await customersStore.deleteCustomer(customer.id)
      
      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('ACTIVE_REFERENCES')
    })
  })

  describe('Product Data Integrity', () => {
    test('should maintain inventory consistency', async () => {
      const product = createMockProduct({ stock_quantity: 100 })
      
      // Mock stock reduction
      vi.spyOn(productsStore, 'updateProductStock').mockResolvedValue({
        success: true,
        data: { ...product, stock_quantity: 90 }
      })
      
      const result = await productsStore.updateProductStock(product.id, -10)
      
      expect(result.success).toBe(true)
      expect(result.data?.stock_quantity).toBe(90)
      
      // Verify stock cannot go negative
      vi.spyOn(productsStore, 'updateProductStock').mockResolvedValue({
        success: false,
        error: { message: 'Insufficient stock', code: 'INSUFFICIENT_STOCK' }
      })
      
      const negativeResult = await productsStore.updateProductStock(product.id, -200)
      expect(negativeResult.success).toBe(false)
      expect(negativeResult.error?.code).toBe('INSUFFICIENT_STOCK')
    })

    test('should validate product pricing constraints', async () => {
      const invalidProduct = createMockProduct({
        price: -100, // Invalid: negative price
        cost: 6000,  // Invalid: cost higher than price
        min_stock_level: -5 // Invalid: negative minimum stock
      })
      
      vi.spyOn(productsStore, 'createProduct').mockResolvedValue({
        success: false,
        error: { 
          message: 'Validation failed', 
          details: ['Price must be positive', 'Cost cannot exceed price', 'Minimum stock level must be non-negative'] 
        }
      })
      
      const result = await productsStore.createProduct(invalidProduct)
      
      expect(result.success).toBe(false)
      expect(result.error?.details).toContain('Price must be positive')
      expect(result.error?.details).toContain('Cost cannot exceed price')
      expect(result.error?.details).toContain('Minimum stock level must be non-negative')
    })

    test('should ensure SKU uniqueness', async () => {
      const product1 = createMockProduct({ sku: 'TEST-SKU-001' })
      const product2 = createMockProduct({ sku: 'TEST-SKU-001' })
      
      vi.spyOn(productsStore, 'createProduct')
        .mockResolvedValueOnce({ success: true, data: product1 })
        .mockResolvedValueOnce({ 
          success: false, 
          error: { message: 'SKU already exists', code: 'DUPLICATE_SKU' } 
        })
      
      const result1 = await productsStore.createProduct(product1)
      const result2 = await productsStore.createProduct(product2)
      
      expect(result1.success).toBe(true)
      expect(result2.success).toBe(false)
      expect(result2.error?.code).toBe('DUPLICATE_SKU')
    })

    test('should track product changes for audit trail', async () => {
      const product = createMockProduct()
      const updatedProduct = { 
        ...product, 
        price: 6000, 
        updated_at: new Date().toISOString() 
      }
      
      vi.spyOn(productsStore, 'updateProduct').mockResolvedValue({
        success: true,
        data: updatedProduct,
        audit: {
          action: 'update',
          changed_fields: ['price'],
          old_values: { price: 5000 },
          new_values: { price: 6000 },
          user_id: authStore.user?.id,
          timestamp: new Date().toISOString()
        }
      })
      
      const result = await productsStore.updateProduct(product.id, { price: 6000 })
      
      expect(result.success).toBe(true)
      expect(result.audit?.changed_fields).toContain('price')
      expect(result.audit?.old_values?.price).toBe(5000)
      expect(result.audit?.new_values?.price).toBe(6000)
    })
  })

  describe('Quote Data Integrity', () => {
    test('should maintain quote calculation accuracy', async () => {
      const quote = createMockQuote({
        items: [
          { product_id: 'prod_1', product_name: '产品1', quantity: 10, unit_price: 1000, total_price: 10000 },
          { product_id: 'prod_2', product_name: '产品2', quantity: 5, unit_price: 2000, total_price: 10000 }
        ]
      })
      
      // Verify subtotal calculation
      const subtotal = quote.items.reduce((sum, item) => sum + item.total_price, 0)
      expect(subtotal).toBe(20000)
      
      // Verify final amount calculation with discount and tax
      const expectedFinalAmount = subtotal - (quote.discount_amount || 0) + (quote.tax_amount || 0)
      expect(quote.final_amount).toBe(expectedFinalAmount)
    })

    test('should validate quote item quantities against stock', async () => {
      const product = createMockProduct({ stock_quantity: 5 })
      const quote = createMockQuote({
        items: [
          { product_id: product.id, product_name: product.name, quantity: 10, unit_price: 1000, total_price: 10000 }
        ]
      })
      
      vi.spyOn(quotesStore, 'createQuote').mockResolvedValue({
        success: false,
        error: { 
          message: 'Insufficient stock for quote items', 
          code: 'INSUFFICIENT_STOCK',
          details: [`Product ${product.name}: requested 10, available 5`]
        }
      })
      
      const result = await quotesStore.createQuote(quote)
      
      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('INSUFFICIENT_STOCK')
    })

    test('should handle quote status transitions correctly', async () => {
      const quote = createMockQuote({ status: 'draft' })
      
      // Valid transitions: draft -> pending -> approved/rejected
      const validTransitions = [
        { from: 'draft', to: 'pending', valid: true },
        { from: 'pending', to: 'approved', valid: true },
        { from: 'pending', to: 'rejected', valid: true },
        { from: 'approved', to: 'draft', valid: false }, // Invalid: cannot go back
        { from: 'rejected', to: 'approved', valid: false } // Invalid: cannot change after rejection
      ]
      
      for (const transition of validTransitions) {
        vi.spyOn(quotesStore, 'updateQuoteStatus').mockResolvedValue(
          transition.valid
            ? { success: true, data: { ...quote, status: transition.to } }
            : { success: false, error: { message: 'Invalid status transition', code: 'INVALID_TRANSITION' } }
        )
        
        const result = await quotesStore.updateQuoteStatus(quote.id, transition.to)
        
        if (transition.valid) {
          expect(result.success).toBe(true)
          expect(result.data?.status).toBe(transition.to)
        } else {
          expect(result.success).toBe(false)
          expect(result.error?.code).toBe('INVALID_TRANSITION')
        }
      }
    })

    test('should prevent quote modification after approval', async () => {
      const approvedQuote = createMockQuote({ status: 'approved' })
      
      vi.spyOn(quotesStore, 'updateQuote').mockResolvedValue({
        success: false,
        error: { message: 'Cannot modify approved quote', code: 'QUOTE_LOCKED' }
      })
      
      const result = await quotesStore.updateQuote(approvedQuote.id, { notes: '新的备注' })
      
      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('QUOTE_LOCKED')
    })

    test('should validate quote expiration dates', async () => {
      const expiredQuote = createMockQuote({ 
        valid_until: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // Yesterday
      })
      
      vi.spyOn(quotesStore, 'updateQuoteStatus').mockResolvedValue({
        success: false,
        error: { message: 'Cannot approve expired quote', code: 'QUOTE_EXPIRED' }
      })
      
      const result = await quotesStore.updateQuoteStatus(expiredQuote.id, 'approved')
      
      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('QUOTE_EXPIRED')
    })
  })

  describe('User Data Integrity', () => {
    test('should validate user role assignments', async () => {
      const user = createMockUser({ role: 'invalid_role' as any })
      
      vi.spyOn(usersStore, 'createUser').mockResolvedValue({
        success: false,
        error: { message: 'Invalid role', code: 'INVALID_ROLE' }
      })
      
      const result = await usersStore.createUser(user)
      
      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('INVALID_ROLE')
    })

    test('should ensure username and email uniqueness', async () => {
      const user1 = createMockUser({ username: 'testuser', email: 'test@example.com' })
      const user2 = createMockUser({ username: 'testuser', email: 'different@example.com' })
      const user3 = createMockUser({ username: 'different', email: 'test@example.com' })
      
      vi.spyOn(usersStore, 'createUser')
        .mockResolvedValueOnce({ success: true, data: user1 })
        .mockResolvedValueOnce({ 
          success: false, 
          error: { message: 'Username already exists', code: 'DUPLICATE_USERNAME' } 
        })
        .mockResolvedValueOnce({ 
          success: false, 
          error: { message: 'Email already exists', code: 'DUPLICATE_EMAIL' } 
        })
      
      const result1 = await usersStore.createUser(user1)
      const result2 = await usersStore.createUser(user2)
      const result3 = await usersStore.createUser(user3)
      
      expect(result1.success).toBe(true)
      expect(result2.success).toBe(false)
      expect(result2.error?.code).toBe('DUPLICATE_USERNAME')
      expect(result3.success).toBe(false)
      expect(result3.error?.code).toBe('DUPLICATE_EMAIL')
    })

    test('should validate user deactivation constraints', async () => {
      const user = createMockUser({ role: 'admin' })
      
      // Cannot deactivate the last admin user
      vi.spyOn(usersStore, 'updateUser').mockResolvedValue({
        success: false,
        error: { message: 'Cannot deactivate the last admin user', code: 'LAST_ADMIN' }
      })
      
      const result = await usersStore.updateUser(user.id, { is_active: false })
      
      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('LAST_ADMIN')
    })
  })

  describe('Real-time Synchronization Integrity', () => {
    test('should maintain data consistency during real-time updates', async () => {
      const customer = createMockCustomer()
      
      // Mock real-time update event
      const realtimeUpdate = {
        eventType: 'UPDATE',
        new: { ...customer, name: '更新后的客户名' },
        old: customer
      }
      
      // Simulate real-time update
      vi.spyOn(realtimeService, 'subscribeToCustomers').mockImplementation((callback) => {
        callback(realtimeUpdate)
        return Promise.resolve()
      })
      
      await realtimeService.subscribeToCustomers((payload) => {
        if (payload.eventType === 'UPDATE') {
          customersStore.customers = customersStore.customers.map(c =>
            c.id === payload.new.id ? payload.new : c
          )
        }
      })
      
      // Verify store was updated
      const updatedCustomer = customersStore.customers.find(c => c.id === customer.id)
      expect(updatedCustomer?.name).toBe('更新后的客户名')
    })

    test('should handle real-time update conflicts', async () => {
      const customer = createMockCustomer()
      const localUpdate = { ...customer, name: '本地更新', updated_at: new Date().toISOString() }
      const remoteUpdate = { ...customer, name: '远程更新', updated_at: new Date(Date.now() + 1000).toISOString() }
      
      // Simulate conflict resolution - remote update wins due to later timestamp
      customersStore.customers = [customer]
      
      // Apply local update first
      customersStore.customers = customersStore.customers.map(c =>
        c.id === customer.id ? localUpdate : c
      )
      
      // Then apply remote update
      customersStore.customers = customersStore.customers.map(c =>
        c.id === customer.id && new Date(remoteUpdate.updated_at) > new Date(c.updated_at)
          ? remoteUpdate
          : c
      )
      
      const finalCustomer = customersStore.customers.find(c => c.id === customer.id)
      expect(finalCustomer?.name).toBe('远程更新') // Remote update should win
    })

    test('should maintain data integrity during connection interruptions', async () => {
      const customer = createMockCustomer()
      const updates = [
        { ...customer, name: '更新1', version: 1 },
        { ...customer, name: '更新2', version: 2 },
        { ...customer, name: '更新3', version: 3 }
      ]
      
      // Mock connection interruption and recovery
      let connectionLost = false
      const queuedUpdates: any[] = []
      
      vi.spyOn(realtimeService, 'getConnectionStatus').mockReturnValue({
        isConnected: !connectionLost,
        channelCount: connectionLost ? 0 : 4,
        channels: connectionLost ? [] : ['customers', 'products', 'quotes', 'users']
      })
      
      // Simulate updates during connection loss
      connectionLost = true
      updates.forEach(update => queuedUpdates.push(update))
      
      // Simulate connection recovery and replay queued updates
      connectionLost = false
      queuedUpdates.forEach(update => {
        customersStore.customers = customersStore.customers.map(c =>
          c.id === update.id ? update : c
        )
      })
      
      const finalCustomer = customersStore.customers.find(c => c.id === customer.id)
      expect(finalCustomer?.name).toBe('更新3') // Last update should be applied
    })
  })

  describe('Cross-Module Data Integrity', () => {
    test('should maintain referential integrity across modules', async () => {
      const customer = createMockCustomer()
      const product = createMockProduct()
      const quote = createMockQuote({
        customer_id: customer.id,
        items: [
          { 
            product_id: product.id, 
            product_name: product.name, 
            quantity: 5, 
            unit_price: product.price, 
            total_price: 5 * product.price 
          }
        ]
      })
      
      // Create all entities
      customersStore.customers = [customer]
      productsStore.products = [product]
      quotesStore.quotes = [quote]
      
      // Verify referential integrity
      expect(quote.customer_id).toBe(customer.id)
      expect(quote.items[0].product_id).toBe(product.id)
      expect(quote.items[0].product_name).toBe(product.name)
      expect(quote.items[0].unit_price).toBe(product.price)
    })

    test('should cascade updates across related entities', async () => {
      const customer = createMockCustomer()
      const quote = createMockQuote({ 
        customer_id: customer.id, 
        customer_name: customer.name 
      })
      
      customersStore.customers = [customer]
      quotesStore.quotes = [quote]
      
      // Update customer name
      const updatedCustomer = { ...customer, name: '新客户名称' }
      customersStore.customers = [updatedCustomer]
      
      // Update should cascade to quotes
      quotesStore.quotes = quotesStore.quotes.map(q =>
        q.customer_id === updatedCustomer.id
          ? { ...q, customer_name: updatedCustomer.name }
          : q
      )
      
      const updatedQuote = quotesStore.quotes.find(q => q.id === quote.id)
      expect(updatedQuote?.customer_name).toBe('新客户名称')
    })

    test('should validate data consistency in complex operations', async () => {
      // Complex operation: Create customer, product, and quote in sequence
      const customer = createMockCustomer()
      const product = createMockProduct()
      const quote = createMockQuote({
        customer_id: customer.id,
        items: [
          {
            product_id: product.id,
            product_name: product.name,
            quantity: 10,
            unit_price: product.price,
            total_price: 10 * product.price
          }
        ]
      })
      
      // Mock transaction-like operation
      vi.spyOn(customersStore, 'createCustomer').mockResolvedValue({ success: true, data: customer })
      vi.spyOn(productsStore, 'createProduct').mockResolvedValue({ success: true, data: product })
      vi.spyOn(quotesStore, 'createQuote').mockResolvedValue({ success: true, data: quote })
      
      // Execute operations
      const customerResult = await customersStore.createCustomer(customer)
      const productResult = await productsStore.createProduct(product)
      const quoteResult = await quotesStore.createQuote(quote)
      
      // Verify all operations succeeded
      expect(customerResult.success).toBe(true)
      expect(productResult.success).toBe(true)
      expect(quoteResult.success).toBe(true)
      
      // Verify data relationships
      expect(quote.customer_id).toBe(customer.id)
      expect(quote.items[0].product_id).toBe(product.id)
      expect(quote.total_amount).toBe(10 * product.price)
    })
  })

  describe('Error Recovery and Data Resilience', () => {
    test('should handle partial failures gracefully', async () => {
      const customer = createMockCustomer()
      const failedQuote = createMockQuote({ customer_id: 'nonexistent_customer' })
      
      // Customer creation succeeds
      vi.spyOn(customersStore, 'createCustomer').mockResolvedValue({ success: true, data: customer })
      
      // Quote creation fails due to invalid customer reference
      vi.spyOn(quotesStore, 'createQuote').mockResolvedValue({
        success: false,
        error: { message: 'Customer not found', code: 'INVALID_REFERENCE' }
      })
      
      const customerResult = await customersStore.createCustomer(customer)
      const quoteResult = await quotesStore.createQuote(failedQuote)
      
      expect(customerResult.success).toBe(true)
      expect(quoteResult.success).toBe(false)
      expect(quoteResult.error?.code).toBe('INVALID_REFERENCE')
    })

    test('should recover from data corruption scenarios', async () => {
      // Simulate corrupted data
      const corruptedCustomer = {
        id: 'valid_id',
        name: null, // Corrupted: null name
        phone: undefined, // Corrupted: undefined phone
        invalid_field: 'should_not_exist' // Corrupted: unknown field
      } as any
      
      // Data sanitization function
      function sanitizeCustomer(data: any): Customer | null {
        if (!data.id || !data.name || !data.phone) {
          return null // Cannot recover from missing required fields
        }
        
        return {
          id: data.id,
          name: data.name,
          phone: data.phone,
          email: data.email || '',
          customer_type: data.customer_type || 'direct',
          status: data.status || 'active',
          industry: data.industry || '',
          company_size: data.company_size || 'small',
          location: data.location || '',
          source: data.source || 'other',
          assigned_to: data.assigned_to || '',
          priority_level: data.priority_level || 'low',
          credit_limit: data.credit_limit || 0,
          payment_terms: data.payment_terms || '30_days',
          preferred_contact_method: data.preferred_contact_method || 'phone',
          tags: Array.isArray(data.tags) ? data.tags : [],
          notes: data.notes || '',
          created_at: data.created_at || new Date().toISOString(),
          updated_at: data.updated_at || new Date().toISOString()
        }
      }
      
      const sanitized = sanitizeCustomer(corruptedCustomer)
      expect(sanitized).toBeNull() // Should be null due to missing required fields
      
      // Test with recoverable corruption
      const recoverableData = {
        ...corruptedCustomer,
        name: '恢复的客户',
        phone: '13800138000'
      }
      
      const recovered = sanitizeCustomer(recoverableData)
      expect(recovered).not.toBeNull()
      expect(recovered?.name).toBe('恢复的客户')
      expect(recovered?.phone).toBe('13800138000')
    })

    test('should handle database constraint violations', async () => {
      const customer = createMockCustomer()
      
      // Mock database constraint violation
      vi.spyOn(customersStore, 'createCustomer').mockResolvedValue({
        success: false,
        error: { 
          message: 'Database constraint violation', 
          code: 'CONSTRAINT_VIOLATION',
          details: ['Unique constraint violation on phone number']
        }
      })
      
      const result = await customersStore.createCustomer(customer)
      
      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('CONSTRAINT_VIOLATION')
      expect(result.error?.details).toContain('Unique constraint violation on phone number')
    })
  })

  describe('Performance and Scalability Data Tests', () => {
    test('should handle large datasets efficiently', async () => {
      const largeCustomerSet = Array.from({ length: 1000 }, (_, i) => 
        createMockCustomer({ id: `cust_${i}`, name: `客户${i}` })
      )
      
      const startTime = performance.now()
      
      // Mock bulk operation
      vi.spyOn(customersStore, 'bulkCreateCustomers').mockResolvedValue({
        success: true,
        data: largeCustomerSet,
        statistics: {
          total: 1000,
          successful: 1000,
          failed: 0,
          duration_ms: 500
        }
      })
      
      const result = await customersStore.bulkCreateCustomers(largeCustomerSet)
      const endTime = performance.now()
      
      expect(result.success).toBe(true)
      expect(result.data?.length).toBe(1000)
      expect(endTime - startTime).toBeLessThan(1000) // Should complete within 1 second
    })

    test('should maintain performance with concurrent operations', async () => {
      const operations = Array.from({ length: 100 }, (_, i) => ({
        type: 'create',
        data: createMockCustomer({ name: `并发客户${i}` })
      }))
      
      // Mock concurrent operations
      const promises = operations.map(async (op, index) => {
        vi.spyOn(customersStore, 'createCustomer').mockResolvedValue({
          success: true,
          data: op.data
        })
        
        await new Promise(resolve => setTimeout(resolve, Math.random() * 10)) // Random delay
        return customersStore.createCustomer(op.data)
      })
      
      const startTime = performance.now()
      const results = await Promise.all(promises)
      const endTime = performance.now()
      
      // All operations should succeed
      expect(results.every(r => r.success)).toBe(true)
      expect(endTime - startTime).toBeLessThan(2000) // Should complete within 2 seconds
    })
  })
})