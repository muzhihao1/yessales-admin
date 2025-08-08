/**
 * Test Setup Configuration
 *
 * Global setup for all test files including mocks, utilities, and environment setup.
 */

import { vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

// Mock uni-app globals
const mockUni = {
  // Navigation
  navigateTo: vi.fn().mockResolvedValue({}),
  navigateBack: vi.fn().mockResolvedValue({}),
  redirectTo: vi.fn().mockResolvedValue({}),
  reLaunch: vi.fn().mockResolvedValue({}),
  switchTab: vi.fn().mockResolvedValue({}),

  // Storage
  getStorageSync: vi.fn().mockReturnValue(''),
  setStorageSync: vi.fn(),
  removeStorageSync: vi.fn(),
  getStorage: vi.fn().mockResolvedValue({ data: '' }),
  setStorage: vi.fn().mockResolvedValue({}),
  removeStorage: vi.fn().mockResolvedValue({}),

  // UI Interactions
  showToast: vi.fn(),
  showModal: vi.fn().mockResolvedValue({ confirm: true, cancel: false }),
  showActionSheet: vi.fn().mockResolvedValue({ tapIndex: 0 }),
  showLoading: vi.fn(),
  hideLoading: vi.fn(),

  // System
  getSystemInfoSync: vi.fn().mockReturnValue({
    platform: 'devtools',
    system: 'Windows 10',
    version: '1.0.0',
    pixelRatio: 1,
    screenWidth: 375,
    screenHeight: 667,
    windowWidth: 375,
    windowHeight: 667,
    statusBarHeight: 20,
    language: 'zh_CN',
    fontSizeSetting: 16
  }),

  // Network
  request: vi.fn().mockResolvedValue({
    statusCode: 200,
    data: {},
    header: {},
    cookies: []
  }),

  // File operations
  chooseImage: vi.fn().mockResolvedValue({
    tempFilePaths: ['temp://test.jpg'],
    tempFiles: [{ path: 'temp://test.jpg', size: 1024 }]
  }),

  // Location
  getLocation: vi.fn().mockResolvedValue({
    latitude: 39.9042,
    longitude: 116.4074,
    accuracy: 20
  }),

  // Device
  getDeviceInfo: vi.fn().mockResolvedValue({
    deviceBrand: 'devtools',
    deviceModel: 'devtools',
    deviceType: 'phone',
    deviceOrientation: 'portrait',
    devicePixelRatio: 1
  }),

  // Page lifecycle
  onLoad: vi.fn(),
  onShow: vi.fn(),
  onHide: vi.fn(),
  onUnload: vi.fn(),
  onReady: vi.fn(),

  // Utils
  setNavigationBarTitle: vi.fn(),
  setNavigationBarColor: vi.fn(),

  // Events
  $on: vi.fn(),
  $off: vi.fn(),
  $emit: vi.fn(),

  // Clipboard
  setClipboardData: vi.fn().mockResolvedValue({}),
  getClipboardData: vi.fn().mockResolvedValue({ data: 'test' }),

  // Animation
  createAnimation: vi.fn().mockReturnValue({
    translateX: vi.fn().mockReturnThis(),
    translateY: vi.fn().mockReturnThis(),
    scale: vi.fn().mockReturnThis(),
    opacity: vi.fn().mockReturnThis(),
    rotate: vi.fn().mockReturnThis(),
    step: vi.fn().mockReturnThis(),
    export: vi.fn().mockReturnValue({})
  })
}

// Mock plus (5+ App runtime)
const mockPlus = {
  runtime: {
    version: '1.0.0',
    innerVersion: '1.0.0'
  },
  os: {
    name: 'Android',
    version: '10'
  },
  device: {
    model: 'test-device',
    vendor: 'test-vendor',
    uuid: 'test-uuid'
  },
  storage: {
    getItem: vi.fn().mockReturnValue(''),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn()
  }
}

// Setup global mocks
globalThis.uni = mockUni as any
globalThis.plus = mockPlus as any
globalThis.getCurrentPages = vi.fn().mockReturnValue([])
globalThis.getApp = vi.fn().mockReturnValue({
  globalData: {}
})

// Mock console methods for cleaner test output
const originalConsole = console
globalThis.console = {
  ...originalConsole,
  warn: vi.fn(),
  error: vi.fn(),
  log: vi.fn(),
  info: vi.fn(),
  debug: vi.fn()
}

// Mock window and document for DOM tests
Object.defineProperty(window, 'location', {
  writable: true,
  value: {
    href: 'http://localhost:3000',
    origin: 'http://localhost:3000',
    protocol: 'http:',
    host: 'localhost:3000',
    hostname: 'localhost',
    port: '3000',
    pathname: '/',
    search: '',
    hash: '',
    assign: vi.fn(),
    replace: vi.fn(),
    reload: vi.fn()
  }
})

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

// Mock sessionStorage
Object.defineProperty(window, 'sessionStorage', {
  value: localStorageMock
})

// Mock navigator
Object.defineProperty(window, 'navigator', {
  writable: true,
  value: {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    language: 'zh-CN',
    languages: ['zh-CN', 'zh', 'en'],
    platform: 'Win32',
    cookieEnabled: true,
    onLine: true,
    clipboard: {
      writeText: vi.fn().mockResolvedValue(undefined),
      readText: vi.fn().mockResolvedValue('test')
    }
  }
})

// Mock IntersectionObserver
globalThis.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}))

// Mock ResizeObserver
globalThis.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}))

// Mock performance
globalThis.performance = {
  ...performance,
  now: vi.fn().mockReturnValue(Date.now()),
  mark: vi.fn(),
  measure: vi.fn(),
  getEntriesByName: vi.fn().mockReturnValue([]),
  getEntriesByType: vi.fn().mockReturnValue([])
}

// Mock fetch for API tests
globalThis.fetch = vi.fn().mockResolvedValue({
  ok: true,
  status: 200,
  statusText: 'OK',
  headers: new Headers(),
  json: vi.fn().mockResolvedValue({}),
  text: vi.fn().mockResolvedValue(''),
  blob: vi.fn().mockResolvedValue(new Blob()),
  arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(0))
})

// Setup Pinia for store tests
const pinia = createPinia()
setActivePinia(pinia)

// Test utilities
export const TestUtils = {
  /**
   * Create a mock user for testing
   */
  createMockUser: (overrides = {}) => ({
    id: 'test-user-id',
    username: 'testuser',
    email: 'test@example.com',
    name: 'Test User',
    role: 'sales_rep',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides
  }),

  /**
   * Create a mock customer for testing
   */
  createMockCustomer: (overrides = {}) => ({
    id: 'test-customer-id',
    name: 'Test Customer',
    phone: '13800138000',
    email: 'customer@example.com',
    customer_type: 'direct',
    status: 'active',
    industry: 'technology',
    company_size: 'medium',
    location: 'Beijing',
    source: 'referral',
    assigned_to: 'test-user-id',
    priority_level: 'medium',
    credit_limit: 100000,
    payment_terms: '30_days',
    preferred_contact_method: 'phone',
    tags: ['important'],
    notes: 'Test customer notes',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides
  }),

  /**
   * Create a mock product for testing
   */
  createMockProduct: (overrides = {}) => ({
    id: 'test-product-id',
    name: 'Test Product',
    sku: 'TEST-001',
    category: 'hardware',
    subcategory: 'server',
    brand: 'Test Brand',
    model: 'TEST-MODEL',
    unit: 'piece',
    price: 1000,
    cost: 600,
    stock_quantity: 100,
    min_stock_level: 10,
    status: 'active',
    description: 'Test product description',
    specifications: { cpu: '4核', memory: '8GB' },
    supplier: 'Test Supplier',
    warranty_period: 12,
    is_customizable: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides
  }),

  /**
   * Create a mock quote for testing
   */
  createMockQuote: (overrides = {}) => ({
    id: 'test-quote-id',
    quote_number: 'Q2025000001',
    customer_id: 'test-customer-id',
    customer_name: 'Test Customer',
    status: 'draft',
    total_amount: 10000,
    discount_amount: 500,
    tax_amount: 950,
    final_amount: 10450,
    valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    items: [
      {
        product_id: 'test-product-id',
        product_name: 'Test Product',
        quantity: 10,
        unit_price: 1000,
        total_price: 10000
      }
    ],
    notes: 'Test quote notes',
    created_by: 'test-user-id',
    approved_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides
  }),

  /**
   * Wait for next tick
   */
  nextTick: () => new Promise(resolve => setTimeout(resolve, 0)),

  /**
   * Wait for specified time
   */
  wait: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),

  /**
   * Mock API response
   */
  mockApiResponse: (data: any, status = 200) => ({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    headers: new Headers(),
    json: vi.fn().mockResolvedValue(data),
    text: vi.fn().mockResolvedValue(JSON.stringify(data))
  }),

  /**
   * Reset all mocks
   */
  resetMocks: () => {
    vi.clearAllMocks()
    // Reset uni mock functions
    Object.values(mockUni).forEach(fn => {
      if (typeof fn === 'function' && fn.mockReset) {
        fn.mockReset()
      }
    })
  },

  /**
   * Mock Supabase client
   */
  createMockSupabaseClient: () => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: null, error: null })
        })),
        order: vi.fn(() => ({
          limit: vi.fn().mockResolvedValue({ data: [], error: null })
        })),
        limit: vi.fn().mockResolvedValue({ data: [], error: null })
      })),
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      update: vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({ data: null, error: null })
      })),
      delete: vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({ data: null, error: null })
      })),
      on: vi.fn(() => ({
        subscribe: vi.fn().mockReturnValue({
          unsubscribe: vi.fn()
        })
      }))
    })),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      signInWithPassword: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } }
      })
    },
    realtime: {
      channel: vi.fn(() => ({
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockReturnValue({
          unsubscribe: vi.fn()
        })
      }))
    }
  })
}

// Global test hooks
beforeEach(() => {
  // Reset all mocks before each test
  TestUtils.resetMocks()

  // Reset Pinia state
  setActivePinia(createPinia())
})

afterEach(() => {
  // Clean up after each test
  vi.clearAllTimers()
})

// Handle unhandled promise rejections in tests
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Promise Rejection:', reason)
  // Don't exit the process in tests
})

export default TestUtils
