/**
 * Store Persistence Utility
 *
 * Provides automatic and manual persistence of store state to local storage
 * with selective field persistence, encryption support, and migration handling.
 */

import { onUnmounted, watch } from 'vue'
import { defineStore } from 'pinia'
import CryptoJS from 'crypto-js'

/**
 * Persistence configuration
 */
export interface PersistenceConfig {
  key: string // Storage key
  storage?: 'sync' | 'async' // Storage type (uni.setStorageSync vs uni.setStorage)

  // Selective persistence
  include?: string[] // Only persist these fields
  exclude?: string[] // Don't persist these fields

  // Data transformation
  serialize?: (state: any) => any
  deserialize?: (state: any) => any

  // Security
  encrypt?: boolean
  encryptionKey?: string

  // Behavior
  debounce?: number // Debounce persistence in ms (default: 1000)
  auto?: boolean // Auto-persist on state change (default: true)

  // Migration
  version?: number
  migrate?: (oldState: any, oldVersion: number) => any

  // Validation
  validator?: (state: any) => boolean
}

/**
 * Persistence metadata
 */
interface PersistenceMetadata {
  version: number
  timestamp: number
  checksum?: string
}

/**
 * Persisted state structure
 */
interface PersistedState {
  data: any
  metadata: PersistenceMetadata
}

/**
 * Default persistence configuration
 */
const DEFAULT_CONFIG: Required<
  Omit<
    PersistenceConfig,
    'include' | 'exclude' | 'serialize' | 'deserialize' | 'encryptionKey' | 'migrate' | 'validator'
  >
> = {
  key: 'store_state',
  storage: 'sync',
  encrypt: false,
  debounce: 1000,
  auto: true,
  version: 1
}

/**
 * Encryption utilities
 */
const encryption = {
  encrypt(data: string, key: string): string {
    return CryptoJS.AES.encrypt(data, key).toString()
  },

  decrypt(encryptedData: string, key: string): string {
    const bytes = CryptoJS.AES.decrypt(encryptedData, key)
    return bytes.toString(CryptoJS.enc.Utf8)
  },

  generateChecksum(data: any): string {
    const jsonString = JSON.stringify(data)
    return CryptoJS.MD5(jsonString).toString()
  }
}

/**
 * Storage operations
 */
const storage = {
  async set(key: string, value: any, useSync = true): Promise<void> {
    try {
      // Convert to JSON string for storage
      const jsonValue = JSON.stringify(value)
      
      if (useSync) {
        // Synchronous localStorage operation
        localStorage.setItem(key, jsonValue)
      } else {
        // Simulate async operation for compatibility
        return new Promise((resolve, reject) => {
          try {
            localStorage.setItem(key, jsonValue)
            resolve()
          } catch (error) {
            reject(error)
          }
        })
      }
    } catch (error) {
      console.error('Failed to save to storage:', error)
      throw error
    }
  },

  async get(key: string, useSync = true): Promise<any> {
    try {
      if (useSync) {
        // Synchronous localStorage operation
        const jsonValue = localStorage.getItem(key)
        return jsonValue ? JSON.parse(jsonValue) : null
      } else {
        // Simulate async operation for compatibility
        return new Promise((resolve, reject) => {
          try {
            const jsonValue = localStorage.getItem(key)
            resolve(jsonValue ? JSON.parse(jsonValue) : null)
          } catch (error) {
            console.warn('Failed to parse stored data:', error)
            resolve(null)
          }
        })
      }
    } catch (error) {
      console.warn('Failed to load from storage:', error)
      return null
    }
  },

  async remove(key: string, useSync = true): Promise<void> {
    try {
      if (useSync) {
        // Synchronous localStorage operation
        localStorage.removeItem(key)
      } else {
        // Simulate async operation for compatibility
        return new Promise((resolve, reject) => {
          try {
            localStorage.removeItem(key)
            resolve()
          } catch (error) {
            reject(error)
          }
        })
      }
    } catch (error) {
      console.warn('Failed to remove from storage:', error)
    }
  }
}

/**
 * Filter state based on include/exclude configuration
 */
function filterState(state: any, config: PersistenceConfig): any {
  if (!state || typeof state !== 'object') {
    return state
  }

  let filteredState = { ...state }

  // Apply include filter
  if (config.include && config.include.length > 0) {
    const included: any = {}
    config.include.forEach(key => {
      if (key in state) {
        included[key] = state[key]
      }
    })
    filteredState = included
  }

  // Apply exclude filter
  if (config.exclude && config.exclude.length > 0) {
    config.exclude.forEach(key => {
      delete filteredState[key]
    })
  }

  return filteredState
}

/**
 * Global persistence store for managing all persistence operations
 */
export const usePersistenceStore = defineStore('persistence', () => {
  const activeWatchers = new Map<string, () => void>()
  const debounceTimers = new Map<string, number>()

  /**
   * Save state to storage
   */
  async function saveState(key: string, state: any, config: PersistenceConfig): Promise<void> {
    try {
      const finalConfig = { ...DEFAULT_CONFIG, ...config }

      // Filter state
      let dataToSave = filterState(state, finalConfig)

      // Apply serialization
      if (finalConfig.serialize) {
        dataToSave = finalConfig.serialize(dataToSave)
      }

      // Validate state
      if (finalConfig.validator && !finalConfig.validator(dataToSave)) {
        console.warn('State validation failed, skipping persistence')
        return
      }

      // Create metadata
      const metadata: PersistenceMetadata = {
        version: finalConfig.version,
        timestamp: Date.now(),
        checksum: encryption.generateChecksum(dataToSave)
      }

      const persistedState: PersistedState = {
        data: dataToSave,
        metadata
      }

      // Serialize to JSON
      let serializedState = JSON.stringify(persistedState)

      // Encrypt if configured
      if (finalConfig.encrypt && finalConfig.encryptionKey) {
        serializedState = encryption.encrypt(serializedState, finalConfig.encryptionKey)
      }

      // Save to storage
      await storage.set(finalConfig.key, serializedState, finalConfig.storage === 'sync')
    } catch (error) {
      console.error('Failed to save state:', error)
      throw error
    }
  }

  /**
   * Load state from storage
   */
  async function loadState(config: PersistenceConfig): Promise<any> {
    try {
      const finalConfig = { ...DEFAULT_CONFIG, ...config }

      // Load from storage
      let serializedState = await storage.get(finalConfig.key, finalConfig.storage === 'sync')

      if (!serializedState) {
        return null
      }

      // Decrypt if configured
      if (finalConfig.encrypt && finalConfig.encryptionKey) {
        try {
          serializedState = encryption.decrypt(serializedState, finalConfig.encryptionKey)
        } catch (error) {
          console.error('Failed to decrypt state:', error)
          return null
        }
      }

      // Parse JSON
      const persistedState: PersistedState = JSON.parse(serializedState)

      // Verify checksum
      const currentChecksum = encryption.generateChecksum(persistedState.data)
      if (persistedState.metadata.checksum !== currentChecksum) {
        console.warn('State checksum mismatch, data may be corrupted')
      }

      // Handle migration
      let data = persistedState.data

      if (finalConfig.migrate && persistedState.metadata.version < finalConfig.version) {
        console.log(
          `Migrating state from version ${persistedState.metadata.version} to ${finalConfig.version}`
        )
        data = finalConfig.migrate(data, persistedState.metadata.version)
      }

      // Apply deserialization
      if (finalConfig.deserialize) {
        data = finalConfig.deserialize(data)
      }

      // Validate restored state
      if (finalConfig.validator && !finalConfig.validator(data)) {
        console.warn('Restored state validation failed')
        return null
      }

      return data
    } catch (error) {
      console.error('Failed to load state:', error)
      return null
    }
  }

  /**
   * Setup automatic persistence for a store
   */
  function setupAutoPersistence(
    storeId: string,
    storeState: any,
    config: PersistenceConfig
  ): () => void {
    const finalConfig = { ...DEFAULT_CONFIG, ...config }

    if (!finalConfig.auto) {
      return () => {} // No-op cleanup function
    }

    // Create debounced save function
    const debouncedSave = () => {
      // Clear existing timer
      const existingTimer = debounceTimers.get(storeId)
      if (existingTimer) {
        clearTimeout(existingTimer)
      }

      // Set new timer
      const timer = setTimeout(async () => {
        try {
          await saveState(finalConfig.key, storeState, finalConfig)
        } catch (error) {
          console.error(`Auto-persistence failed for ${storeId}:`, error)
        }
        debounceTimers.delete(storeId)
      }, finalConfig.debounce)

      debounceTimers.set(storeId, timer)
    }

    // Setup watcher
    const stopWatcher = watch(() => storeState, debouncedSave, { deep: true, immediate: false })

    // Store cleanup function
    const cleanup = () => {
      stopWatcher()
      const timer = debounceTimers.get(storeId)
      if (timer) {
        clearTimeout(timer)
        debounceTimers.delete(storeId)
      }
      activeWatchers.delete(storeId)
    }

    activeWatchers.set(storeId, cleanup)

    return cleanup
  }

  /**
   * Manual save for immediate persistence
   */
  async function manualSave(
    storeId: string,
    storeState: any,
    config: PersistenceConfig
  ): Promise<void> {
    await saveState(config.key, storeState, config)
  }

  /**
   * Clear persisted state
   */
  async function clearPersistedState(config: PersistenceConfig): Promise<void> {
    const finalConfig = { ...DEFAULT_CONFIG, ...config }
    await storage.remove(finalConfig.key, finalConfig.storage === 'sync')
  }

  /**
   * Cleanup all watchers
   */
  function cleanupAll(): void {
    activeWatchers.forEach(cleanup => cleanup())
    activeWatchers.clear()

    debounceTimers.forEach(timer => clearTimeout(timer))
    debounceTimers.clear()
  }

  return {
    saveState,
    loadState,
    setupAutoPersistence,
    manualSave,
    clearPersistedState,
    cleanupAll,

    // State
    activeWatchers: Array.from(activeWatchers.keys()),
    pendingOperations: Array.from(debounceTimers.keys())
  }
})

/**
 * Persistence composable for individual stores
 */
export function usePersistence(storeId: string, defaultConfig: Partial<PersistenceConfig> = {}) {
  const persistenceStore = usePersistenceStore()

  const config: PersistenceConfig = {
    key: `yessales_${storeId}`,
    ...defaultConfig
  }

  /**
   * Initialize persistence for a store
   */
  async function initializePersistence(storeState: any): Promise<any> {
    try {
      // Load existing state
      const persistedState = await persistenceStore.loadState(config)

      if (persistedState) {
        // Merge persisted state with current state (persisted takes precedence)
        Object.assign(storeState, persistedState)
      }

      // Setup auto-persistence
      const cleanup = persistenceStore.setupAutoPersistence(storeId, storeState, config)

      // Cleanup on unmount
      onUnmounted(cleanup)

      return persistedState
    } catch (error) {
      console.error(`Failed to initialize persistence for ${storeId}:`, error)
      return null
    }
  }

  /**
   * Manually save current state
   */
  async function saveNow(storeState: any): Promise<void> {
    await persistenceStore.manualSave(storeId, storeState, config)
  }

  /**
   * Clear persisted state
   */
  async function clearPersisted(): Promise<void> {
    await persistenceStore.clearPersistedState(config)
  }

  /**
   * Check if state is persisted
   */
  async function isPersisted(): Promise<boolean> {
    try {
      const state = await persistenceStore.loadState(config)
      return state !== null
    } catch {
      return false
    }
  }

  return {
    initializePersistence,
    saveNow,
    clearPersisted,
    isPersisted,
    config
  }
}

/**
 * Predefined persistence configurations for different types of data
 */
export const persistencePatterns = {
  /**
   * User authentication state
   */
  auth: (): Partial<PersistenceConfig> => ({
    include: ['user', 'token'],
    encrypt: true,
    encryptionKey: 'yessales_auth_key_2024',
    version: 1
  }),

  /**
   * User preferences and settings
   */
  preferences: (): Partial<PersistenceConfig> => ({
    exclude: ['isLoading', 'error'],
    version: 1
  }),

  /**
   * Cached data with expiration
   */
  cache: (ttl: number = 24 * 60 * 60 * 1000): Partial<PersistenceConfig> => ({
    validator: state => {
      const now = Date.now()
      return state && state.timestamp && now - state.timestamp < ttl
    },
    serialize: state => ({
      ...state,
      timestamp: Date.now()
    }),
    version: 1
  }),

  /**
   * Draft data (quotes, forms, etc.)
   */
  drafts: (): Partial<PersistenceConfig> => ({
    include: ['drafts', 'currentDraft'],
    debounce: 2000, // Save drafts less frequently
    version: 1
  }),

  /**
   * Critical app state
   */
  critical: (): Partial<PersistenceConfig> => ({
    debounce: 500, // Save immediately
    encrypt: true,
    encryptionKey: 'yessales_critical_key_2024',
    validator: state => state && typeof state === 'object',
    version: 1
  }),

  /**
   * Temporary session data
   */
  session: (): Partial<PersistenceConfig> => ({
    auto: false, // Manual saves only
    validator: state => {
      // Only persist if session is still valid
      const sessionTimeout = 2 * 60 * 60 * 1000 // 2 hours
      const now = Date.now()
      return state && state.lastActivity && now - state.lastActivity < sessionTimeout
    },
    version: 1
  })
}

/**
 * Migration utilities
 */
export const migrationHelpers = {
  /**
   * Add new fields with default values
   */
  addFields: (defaults: Record<string, any>) => (oldState: any) => ({
    ...defaults,
    ...oldState
  }),

  /**
   * Remove deprecated fields
   */
  removeFields: (fieldsToRemove: string[]) => (oldState: any) => {
    const newState = { ...oldState }
    fieldsToRemove.forEach(field => delete newState[field])
    return newState
  },

  /**
   * Rename fields
   */
  renameFields: (fieldMapping: Record<string, string>) => (oldState: any) => {
    const newState = { ...oldState }

    Object.entries(fieldMapping).forEach(([oldName, newName]) => {
      if (oldName in newState) {
        newState[newName] = newState[oldName]
        delete newState[oldName]
      }
    })

    return newState
  },

  /**
   * Transform field values
   */
  transformFields: (transformers: Record<string, (value: any) => any>) => (oldState: any) => {
    const newState = { ...oldState }

    Object.entries(transformers).forEach(([field, transformer]) => {
      if (field in newState) {
        newState[field] = transformer(newState[field])
      }
    })

    return newState
  }
}
