/**
 * Cache Manager Utility
 *
 * Provides intelligent caching for API responses with TTL, invalidation,
 * memory management, and offline support for store operations.
 */

import { computed, reactive, ref } from 'vue'
import { defineStore } from 'pinia'

/**
 * Cache entry structure
 */
export interface CacheEntry<T = any> {
  key: string
  data: T
  timestamp: number
  ttl: number // Time to live in milliseconds
  tags: string[] // For group invalidation
  size: number // Approximate memory size in bytes
  accessCount: number
  lastAccessed: number
}

/**
 * Cache configuration
 */
export interface CacheConfig {
  ttl?: number // Default TTL in milliseconds (default: 5 minutes)
  maxSize?: number // Max cache size in bytes (default: 10MB)
  maxEntries?: number // Max number of entries (default: 1000)
  enablePersistence?: boolean // Persist to local storage
  storagePrefix?: string // Local storage key prefix
  tags?: string[] // Tags for group operations
}

/**
 * Cache operation statistics
 */
export interface CacheStats {
  hits: number
  misses: number
  size: number
  entries: number
  hitRate: number
  memoryUsage: number
}

/**
 * Default cache configuration
 */
const DEFAULT_CONFIG: Required<CacheConfig> = {
  ttl: 5 * 60 * 1000, // 5 minutes
  maxSize: 10 * 1024 * 1024, // 10MB
  maxEntries: 1000,
  enablePersistence: true,
  storagePrefix: 'yessales_cache',
  tags: []
}

/**
 * Estimate object size in bytes (approximate)
 */
function estimateSize(obj: any): number {
  const jsonString = JSON.stringify(obj)
  return new Blob([jsonString]).size
}

/**
 * Global cache store using Pinia
 */
export const useCacheStore = defineStore('cache', () => {
  // Cache storage
  const cache = reactive<Map<string, CacheEntry>>(new Map())

  // Statistics
  const stats = reactive({
    hits: 0,
    misses: 0,
    evictions: 0,
    operations: 0
  })

  // Computed properties
  const cacheStats = computed<CacheStats>(() => {
    const size = Array.from(cache.values()).reduce((total, entry) => total + entry.size, 0)
    const entries = cache.size
    const hitRate = stats.operations > 0 ? (stats.hits / stats.operations) * 100 : 0

    return {
      hits: stats.hits,
      misses: stats.misses,
      size: entries,
      entries,
      hitRate,
      memoryUsage: size
    }
  })

  const isNearCapacity = computed(() => {
    const currentSize = Array.from(cache.values()).reduce((total, entry) => total + entry.size, 0)
    return (
      currentSize > DEFAULT_CONFIG.maxSize * 0.8 || cache.size > DEFAULT_CONFIG.maxEntries * 0.8
    )
  })

  // Core cache operations
  function set<T>(key: string, data: T, config: Partial<CacheConfig> = {}): void {
    const finalConfig = { ...DEFAULT_CONFIG, ...config }
    const now = Date.now()

    const entry: CacheEntry<T> = {
      key,
      data,
      timestamp: now,
      ttl: finalConfig.ttl,
      tags: finalConfig.tags,
      size: estimateSize(data),
      accessCount: 0,
      lastAccessed: now
    }

    // Check if we need to evict entries first
    evictIfNeeded()

    // Store in memory cache
    cache.set(key, entry)

    // Persist to local storage if enabled
    if (finalConfig.enablePersistence) {
      try {
        const storageKey = `${finalConfig.storagePrefix}_${key}`
        uni.setStorageSync(storageKey, {
          data,
          timestamp: now,
          ttl: finalConfig.ttl,
          tags: finalConfig.tags
        })
      } catch (error) {
        console.warn('Failed to persist cache entry to storage:', error)
      }
    }
  }

  function get<T>(key: string): T | null {
    stats.operations++

    const entry = cache.get(key) as CacheEntry<T> | undefined

    if (!entry) {
      stats.misses++

      // Try to load from persistent storage
      const persistedData = loadFromStorage<T>(key)
      if (persistedData) {
        stats.hits++
        return persistedData
      }

      return null
    }

    const now = Date.now()

    // Check if entry has expired
    if (now - entry.timestamp > entry.ttl) {
      cache.delete(key)
      removeFromStorage(key)
      stats.misses++
      return null
    }

    // Update access statistics
    entry.accessCount++
    entry.lastAccessed = now

    stats.hits++
    return entry.data
  }

  function has(key: string): boolean {
    const entry = cache.get(key)

    if (!entry) {
      return hasInStorage(key)
    }

    const now = Date.now()

    // Check if expired
    if (now - entry.timestamp > entry.ttl) {
      cache.delete(key)
      removeFromStorage(key)
      return false
    }

    return true
  }

  function remove(key: string): boolean {
    const hasEntry = cache.has(key)
    cache.delete(key)
    removeFromStorage(key)
    return hasEntry
  }

  function clear(): void {
    cache.clear()
    clearStorage()
    resetStats()
  }

  // Tag-based operations
  function invalidateByTag(tag: string): number {
    let invalidated = 0

    for (const [key, entry] of cache.entries()) {
      if (entry.tags.includes(tag)) {
        cache.delete(key)
        removeFromStorage(key)
        invalidated++
      }
    }

    return invalidated
  }

  function getByTag(tag: string): CacheEntry[] {
    return Array.from(cache.values()).filter(entry => entry.tags.includes(tag))
  }

  // Cache maintenance
  function evictIfNeeded(): void {
    const currentSize = Array.from(cache.values()).reduce((total, entry) => total + entry.size, 0)

    if (currentSize > DEFAULT_CONFIG.maxSize || cache.size > DEFAULT_CONFIG.maxEntries) {
      evictLeastRecentlyUsed(Math.max(1, Math.floor(cache.size * 0.2))) // Evict 20%
    }
  }

  function evictLeastRecentlyUsed(count: number): void {
    const entries = Array.from(cache.entries())
      .sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed)
      .slice(0, count)

    for (const [key] of entries) {
      cache.delete(key)
      removeFromStorage(key)
      stats.evictions++
    }
  }

  function evictExpired(): number {
    const now = Date.now()
    let evicted = 0

    for (const [key, entry] of cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        cache.delete(key)
        removeFromStorage(key)
        evicted++
      }
    }

    return evicted
  }

  // Storage persistence helpers
  function loadFromStorage<T>(key: string): T | null {
    try {
      const storageKey = `${DEFAULT_CONFIG.storagePrefix}_${key}`
      const stored = uni.getStorageSync(storageKey)

      if (!stored) return null

      const now = Date.now()

      // Check if expired
      if (now - stored.timestamp > stored.ttl) {
        uni.removeStorageSync(storageKey)
        return null
      }

      // Restore to memory cache
      set(key, stored.data, {
        ttl: stored.ttl - (now - stored.timestamp),
        tags: stored.tags
      })

      return stored.data
    } catch (error) {
      console.warn('Failed to load from storage:', error)
      return null
    }
  }

  function hasInStorage(key: string): boolean {
    try {
      const storageKey = `${DEFAULT_CONFIG.storagePrefix}_${key}`
      return !!uni.getStorageSync(storageKey)
    } catch {
      return false
    }
  }

  function removeFromStorage(key: string): void {
    try {
      const storageKey = `${DEFAULT_CONFIG.storagePrefix}_${key}`
      uni.removeStorageSync(storageKey)
    } catch (error) {
      console.warn('Failed to remove from storage:', error)
    }
  }

  function clearStorage(): void {
    try {
      const info = uni.getStorageInfoSync()
      info.keys
        .filter(key => key.startsWith(DEFAULT_CONFIG.storagePrefix))
        .forEach(key => uni.removeStorageSync(key))
    } catch (error) {
      console.warn('Failed to clear storage:', error)
    }
  }

  function resetStats(): void {
    stats.hits = 0
    stats.misses = 0
    stats.evictions = 0
    stats.operations = 0
  }

  return {
    // State
    cacheStats,
    isNearCapacity,

    // Core operations
    set,
    get,
    has,
    remove,
    clear,

    // Tag operations
    invalidateByTag,
    getByTag,

    // Maintenance
    evictIfNeeded,
    evictExpired,
    evictLeastRecentlyUsed,

    // Statistics
    resetStats,

    // Debug helpers
    getAllKeys: () => Array.from(cache.keys()),
    getAllEntries: () => Array.from(cache.values()),
    getEntry: (key: string) => cache.get(key)
  }
})

/**
 * Cache composable for individual stores
 */
export function useCache(namespace: string, defaultConfig: Partial<CacheConfig> = {}) {
  const cacheStore = useCacheStore()
  const config = { ...DEFAULT_CONFIG, ...defaultConfig }

  // Namespace key helper
  function namespacedKey(key: string): string {
    return `${namespace}:${key}`
  }

  // Store-specific cache operations
  function set<T>(key: string, data: T, overrideConfig?: Partial<CacheConfig>): void {
    const finalConfig = { ...config, ...overrideConfig }
    cacheStore.set(namespacedKey(key), data, finalConfig)
  }

  function get<T>(key: string): T | null {
    return cacheStore.get<T>(namespacedKey(key))
  }

  function has(key: string): boolean {
    return cacheStore.has(namespacedKey(key))
  }

  function remove(key: string): boolean {
    return cacheStore.remove(namespacedKey(key))
  }

  function clear(): void {
    // Clear all entries for this namespace
    const allKeys = cacheStore.getAllKeys()
    const namespacePrefix = `${namespace}:`

    allKeys.filter(key => key.startsWith(namespacePrefix)).forEach(key => cacheStore.remove(key))
  }

  function invalidateByTag(tag: string): number {
    return cacheStore.invalidateByTag(tag)
  }

  // Advanced caching patterns
  async function getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    cacheConfig?: Partial<CacheConfig>
  ): Promise<T> {
    // Try to get from cache first
    const cached = get<T>(key)
    if (cached !== null) {
      return cached
    }

    // Fetch fresh data
    const data = await fetcher()

    // Cache the result
    set(key, data, cacheConfig)

    return data
  }

  function memoize<TArgs extends any[], TReturn>(
    fn: (...args: TArgs) => Promise<TReturn>,
    keyGenerator?: (...args: TArgs) => string,
    cacheConfig?: Partial<CacheConfig>
  ) {
    return async (...args: TArgs): Promise<TReturn> => {
      const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args)

      return await getOrSet(key, () => fn(...args), cacheConfig)
    }
  }

  return {
    // Basic operations
    set,
    get,
    has,
    remove,
    clear,
    invalidateByTag,

    // Advanced patterns
    getOrSet,
    memoize,

    // Utilities
    namespacedKey,
    config,

    // Access to global cache store
    global: cacheStore
  }
}

/**
 * Cache decorator for store methods
 */
export function cached(
  cacheKey: string | ((...args: any[]) => string),
  config?: Partial<CacheConfig>
) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value

    descriptor.value = async function (...args: any[]) {
      const cache = useCache(target.constructor.name)

      const key =
        typeof cacheKey === 'function' ? cacheKey(...args) : `${cacheKey}_${JSON.stringify(args)}`

      return await cache.getOrSet(key, () => method.apply(this, args), config)
    }

    return descriptor
  }
}

/**
 * Cache invalidation patterns
 */
export const cachePatterns = {
  /**
   * User-specific cache pattern
   */
  user: (userId: string) => ({
    tags: ['user', `user:${userId}`],
    ttl: 10 * 60 * 1000 // 10 minutes
  }),

  /**
   * Product cache pattern
   */
  product: (productId?: string) => ({
    tags: productId ? ['product', `product:${productId}`] : ['product'],
    ttl: 30 * 60 * 1000 // 30 minutes
  }),

  /**
   * Quote cache pattern
   */
  quote: (quoteId?: string) => ({
    tags: quoteId ? ['quote', `quote:${quoteId}`] : ['quote'],
    ttl: 5 * 60 * 1000 // 5 minutes
  }),

  /**
   * Customer cache pattern
   */
  customer: (customerId?: string) => ({
    tags: customerId ? ['customer', `customer:${customerId}`] : ['customer'],
    ttl: 15 * 60 * 1000 // 15 minutes
  }),

  /**
   * System settings cache pattern
   */
  settings: () => ({
    tags: ['settings'],
    ttl: 60 * 60 * 1000 // 1 hour
  }),

  /**
   * Short-lived cache for frequent operations
   */
  shortLived: () => ({
    tags: ['short'],
    ttl: 1 * 60 * 1000 // 1 minute
  }),

  /**
   * Long-lived cache for stable data
   */
  longLived: () => ({
    tags: ['long'],
    ttl: 24 * 60 * 60 * 1000 // 24 hours
  })
}

/**
 * Global cache operations
 */
export const globalCache = {
  /**
   * Invalidate all user-related cache
   */
  invalidateUser(userId?: string) {
    const cache = useCacheStore()
    if (userId) {
      cache.invalidateByTag(`user:${userId}`)
    } else {
      cache.invalidateByTag('user')
    }
  },

  /**
   * Invalidate all product-related cache
   */
  invalidateProducts(productId?: string) {
    const cache = useCacheStore()
    if (productId) {
      cache.invalidateByTag(`product:${productId}`)
    } else {
      cache.invalidateByTag('product')
    }
  },

  /**
   * Clear all cache on logout
   */
  clearAllOnLogout() {
    const cache = useCacheStore()
    cache.clear()
  },

  /**
   * Maintenance: clean expired entries
   */
  cleanExpired() {
    const cache = useCacheStore()
    return cache.evictExpired()
  }
}
