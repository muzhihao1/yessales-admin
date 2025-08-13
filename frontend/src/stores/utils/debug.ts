/**
 * Store Debugging Utilities
 *
 * Provides comprehensive debugging tools for store development including
 * state inspection, action logging, performance profiling, and time travel debugging.
 */

import { computed, reactive, ref, watch } from 'vue'
import { defineStore } from 'pinia'

/**
 * Action log entry
 */
export interface ActionLogEntry {
  id: string
  timestamp: number
  store: string
  action: string
  payload?: any
  duration: number
  result?: any
  error?: any
  stackTrace?: string
}

/**
 * State snapshot
 */
export interface StateSnapshot {
  id: string
  timestamp: number
  store: string
  state: any
  action?: string // Action that caused this state
}

/**
 * Performance metrics
 */
export interface PerformanceMetrics {
  store: string
  action: string
  count: number
  totalTime: number
  averageTime: number
  minTime: number
  maxTime: number
  lastExecution: number
}

/**
 * Memory usage info
 */
export interface MemoryUsage {
  store: string
  estimatedSize: number
  itemCount: number
  lastUpdated: number
}

/**
 * Store dependency relationship
 */
export interface StoreDependency {
  source: string
  target: string
  type: 'read' | 'write' | 'watch'
  count: number
  lastAccess: number
}

/**
 * Debug configuration
 */
export interface DebugConfig {
  enableActionLogging?: boolean
  enableStateSnapshots?: boolean
  enablePerformanceProfiling?: boolean
  enableMemoryTracking?: boolean
  enableDependencyTracking?: boolean
  maxLogEntries?: number
  maxSnapshots?: number
  logLevel?: 'debug' | 'info' | 'warn' | 'error'
  isActive?: boolean
}

/**
 * Default debug configuration
 */
const DEFAULT_DEBUG_CONFIG: Required<DebugConfig> = {
  enableActionLogging: true,
  enableStateSnapshots: true,
  enablePerformanceProfiling: true,
  enableMemoryTracking: true,
  enableDependencyTracking: true,
  maxLogEntries: 1000,
  maxSnapshots: 100,
  logLevel: 'debug',
  isActive: true
}

/**
 * Estimate object size in bytes (approximate)
 */
function estimateObjectSize(obj: any): number {
  try {
    const jsonString = JSON.stringify(obj)
    return new Blob([jsonString]).size
  } catch {
    return 0
  }
}

/**
 * Count items in object
 */
function countItems(obj: any): number {
  if (Array.isArray(obj)) {
    return obj.length
  }
  if (obj && typeof obj === 'object') {
    return Object.keys(obj).length
  }
  return 1
}

/**
 * Generate unique ID
 */
function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Get stack trace
 */
function getStackTrace(): string {
  try {
    throw new Error()
  } catch (error: any) {
    return error.stack || ''
  }
}

/**
 * Global debug store
 */
export const useDebugStore = defineStore('debug', () => {
  // Configuration
  const config = ref<Required<DebugConfig>>(DEFAULT_DEBUG_CONFIG)

  // Action logs
  const actionLogs = reactive<ActionLogEntry[]>([])

  // State snapshots
  const stateSnapshots = reactive<StateSnapshot[]>([])

  // Performance metrics
  const performanceMetrics = reactive<Map<string, PerformanceMetrics>>(new Map())

  // Memory usage tracking
  const memoryUsage = reactive<Map<string, MemoryUsage>>(new Map())

  // Store dependencies
  const dependencies = reactive<Map<string, StoreDependency>>(new Map())

  // Debug session info
  const session = reactive({
    startTime: Date.now(),
    totalActions: 0,
    totalErrors: 0,
    isActive: true
  })

  // Computed properties
  const recentActions = computed(() => actionLogs.slice(-50).reverse())

  const errorActions = computed(() => actionLogs.filter(log => log.error))

  const slowActions = computed(() =>
    actionLogs.filter(log => log.duration > 100).sort((a, b) => b.duration - a.duration)
  )

  const totalMemoryUsage = computed(() =>
    Array.from(memoryUsage.values()).reduce((total, usage) => total + usage.estimatedSize, 0)
  )

  const performanceStats = computed(() => {
    const stats = Array.from(performanceMetrics.values())
    return {
      total: stats.length,
      slowest: stats.reduce(
        (slowest, current) => (current.maxTime > (slowest?.maxTime || 0) ? current : slowest),
        null
      ),
      fastest: stats.reduce(
        (fastest, current) =>
          current.minTime < (fastest?.minTime || Infinity) ? current : fastest,
        null
      ),
      mostUsed: stats.reduce(
        (mostUsed, current) => (current.count > (mostUsed?.count || 0) ? current : mostUsed),
        null
      )
    }
  })

  // Actions
  function updateConfig(newConfig: Partial<DebugConfig>) {
    Object.assign(config.value, newConfig)
  }

  function logAction(
    store: string,
    action: string,
    payload?: any,
    duration?: number,
    result?: any,
    error?: any
  ) {
    if (!config.value.enableActionLogging) return

    const logEntry: ActionLogEntry = {
      id: generateId(),
      timestamp: Date.now(),
      store,
      action,
      payload: payload ? JSON.parse(JSON.stringify(payload)) : undefined,
      duration: duration || 0,
      result: result ? JSON.parse(JSON.stringify(result)) : undefined,
      error: error ? { message: error.message, stack: error.stack } : undefined,
      stackTrace: config.value.logLevel === 'debug' ? getStackTrace() : undefined
    }

    actionLogs.push(logEntry)

    // Update session stats
    session.totalActions++
    if (error) session.totalErrors++

    // Trim logs if needed
    if (actionLogs.length > config.value.maxLogEntries) {
      actionLogs.splice(0, actionLogs.length - config.value.maxLogEntries)
    }

    // Console logging based on level
    if (error && ['debug', 'info', 'warn', 'error'].includes(config.value.logLevel)) {
      console.error(`[${store}] ${action} failed:`, error)
    } else if (
      duration &&
      duration > 100 &&
      ['debug', 'info', 'warn'].includes(config.value.logLevel)
    ) {
      console.warn(`[${store}] ${action} took ${duration}ms`)
    } else if (config.value.logLevel === 'debug') {
      console.log(`[${store}] ${action}`, { payload, result })
    }
  }

  function takeStateSnapshot(store: string, state: any, action?: string) {
    if (!config.value.enableStateSnapshots) return

    const snapshot: StateSnapshot = {
      id: generateId(),
      timestamp: Date.now(),
      store,
      state: JSON.parse(JSON.stringify(state)),
      action
    }

    stateSnapshots.push(snapshot)

    // Trim snapshots if needed
    if (stateSnapshots.length > config.value.maxSnapshots) {
      stateSnapshots.splice(0, stateSnapshots.length - config.value.maxSnapshots)
    }
  }

  function recordPerformance(store: string, action: string, duration: number) {
    if (!config.value.enablePerformanceProfiling) return

    const key = `${store}:${action}`
    const existing = performanceMetrics.get(key)

    if (existing) {
      existing.count++
      existing.totalTime += duration
      existing.averageTime = existing.totalTime / existing.count
      existing.minTime = Math.min(existing.minTime, duration)
      existing.maxTime = Math.max(existing.maxTime, duration)
      existing.lastExecution = Date.now()
    } else {
      performanceMetrics.set(key, {
        store,
        action,
        count: 1,
        totalTime: duration,
        averageTime: duration,
        minTime: duration,
        maxTime: duration,
        lastExecution: Date.now()
      })
    }
  }

  function trackMemoryUsage(store: string, state: any) {
    if (!config.value.enableMemoryTracking) return

    const size = estimateObjectSize(state)
    const itemCount = countItems(state)

    memoryUsage.set(store, {
      store,
      estimatedSize: size,
      itemCount,
      lastUpdated: Date.now()
    })
  }

  function trackDependency(source: string, target: string, type: StoreDependency['type']) {
    if (!config.value.enableDependencyTracking) return

    const key = `${source}->${target}:${type}`
    const existing = dependencies.get(key)

    if (existing) {
      existing.count++
      existing.lastAccess = Date.now()
    } else {
      dependencies.set(key, {
        source,
        target,
        type,
        count: 1,
        lastAccess: Date.now()
      })
    }
  }

  function clearLogs() {
    actionLogs.length = 0
    stateSnapshots.length = 0
    performanceMetrics.clear()
    memoryUsage.clear()
    dependencies.clear()

    session.totalActions = 0
    session.totalErrors = 0
    session.startTime = Date.now()
  }

  function exportDebugData() {
    return {
      session: { ...session },
      config: { ...config.value },
      actionLogs: [...actionLogs],
      stateSnapshots: [...stateSnapshots],
      performanceMetrics: Object.fromEntries(performanceMetrics),
      memoryUsage: Object.fromEntries(memoryUsage),
      dependencies: Object.fromEntries(dependencies)
    }
  }

  function getActionHistory(store?: string, action?: string) {
    return actionLogs.filter(log => {
      if (store && log.store !== store) return false
      if (action && log.action !== action) return false
      return true
    })
  }

  function getStateHistory(store: string) {
    return stateSnapshots.filter(snapshot => snapshot.store === store)
  }

  function getPerformanceReport(store?: string) {
    const metrics = Array.from(performanceMetrics.values())
    const filtered = store ? metrics.filter(m => m.store === store) : metrics

    return {
      total: filtered.length,
      metrics: filtered.sort((a, b) => b.averageTime - a.averageTime),
      summary: {
        totalActions: filtered.reduce((sum, m) => sum + m.count, 0),
        totalTime: filtered.reduce((sum, m) => sum + m.totalTime, 0),
        averageTime:
          filtered.length > 0
            ? filtered.reduce((sum, m) => sum + m.averageTime, 0) / filtered.length
            : 0
      }
    }
  }

  function getDependencyGraph() {
    const nodes = new Set<string>()
    const edges: Array<{ source: string; target: string; type: string; weight: number }> = []

    for (const dep of dependencies.values()) {
      nodes.add(dep.source)
      nodes.add(dep.target)
      edges.push({
        source: dep.source,
        target: dep.target,
        type: dep.type,
        weight: dep.count
      })
    }

    return {
      nodes: Array.from(nodes),
      edges
    }
  }

  return {
    // Configuration
    config: computed(() => config.value),
    updateConfig,

    // Logging
    logAction,
    takeStateSnapshot,
    recordPerformance,
    trackMemoryUsage,
    trackDependency,

    // Data access
    actionLogs: computed(() => actionLogs),
    stateSnapshots: computed(() => stateSnapshots),
    performanceMetrics: computed(() => performanceMetrics),
    memoryUsage: computed(() => memoryUsage),
    dependencies: computed(() => dependencies),

    // Computed stats
    recentActions,
    errorActions,
    slowActions,
    totalMemoryUsage,
    performanceStats,
    session: computed(() => session),

    // Utilities
    clearLogs,
    exportDebugData,
    getActionHistory,
    getStateHistory,
    getPerformanceReport,
    getDependencyGraph
  }
})

/**
 * Debug composable for individual stores
 */
export function useStoreDebug(store: string) {
  const debugStore = useDebugStore()

  /**
   * Wrap store action with debugging
   */
  function debugAction<T>(actionName: string, actionFn: (...args: any[]) => T, context?: any) {
    return async (...args: any[]): Promise<T> => {
      const startTime = performance.now()
      let result: T
      let error: any

      try {
        result = await actionFn.apply(context, args)
        return result
      } catch (e) {
        error = e
        throw e
      } finally {
        const duration = performance.now() - startTime

        debugStore.logAction(
          store,
          actionName,
          args.length > 0 ? args : undefined,
          duration,
          result,
          error
        )

        debugStore.recordPerformance(store, actionName, duration)
      }
    }
  }

  /**
   * Watch store state for debugging
   */
  function watchStoreState(storeState: any) {
    // Track memory usage
    watch(
      () => storeState,
      newState => {
        debugStore.trackMemoryUsage(store, newState)
        debugStore.takeStateSnapshot(store, newState)
      },
      { deep: true, immediate: true }
    )
  }

  /**
   * Track dependency on another store
   */
  function trackDependency(targetStore: string, type: StoreDependency['type'] = 'read') {
    debugStore.trackDependency(store, targetStore, type)
  }

  /**
   * Get debug info for this store
   */
  function getDebugInfo() {
    return {
      actionHistory: debugStore.getActionHistory(store),
      stateHistory: debugStore.getStateHistory(store),
      performanceReport: debugStore.getPerformanceReport(store),
      memoryUsage: debugStore.memoryUsage.get(store),
      recentErrors: debugStore.errorActions.filter(action => action.store === store)
    }
  }

  return {
    debugAction,
    watchStoreState,
    trackDependency,
    getDebugInfo,

    // Access to global debug store
    global: debugStore
  }
}

/**
 * Time travel debugging utilities
 */
export const timeTravel = {
  /**
   * Restore store state from snapshot
   */
  restoreState(storeInstance: any, snapshotId: string) {
    const debugStore = useDebugStore()
    const snapshot = debugStore.stateSnapshots.find(s => s.id === snapshotId)

    if (!snapshot) {
      console.warn(`Snapshot ${snapshotId} not found`)
      return false
    }

    try {
      Object.assign(storeInstance, snapshot.state)
      console.log(`Restored state from snapshot ${snapshotId}`)
      return true
    } catch (error) {
      console.error('Failed to restore state:', error)
      return false
    }
  },

  /**
   * Replay actions from a specific point in time
   */
  replayActions(fromTimestamp: number, toTimestamp?: number, storeFilter?: string) {
    const debugStore = useDebugStore()
    const actions = debugStore.actionLogs.filter(action => {
      if (action.timestamp < fromTimestamp) return false
      if (toTimestamp && action.timestamp > toTimestamp) return false
      if (storeFilter && action.store !== storeFilter) return false
      return true
    })

    console.log(`Replaying ${actions.length} actions from ${new Date(fromTimestamp)}`)

    // This would need to be implemented by each store to actually replay actions
    return actions
  },

  /**
   * Compare two state snapshots
   */
  compareSnapshots(snapshot1Id: string, snapshot2Id: string) {
    const debugStore = useDebugStore()
    const snap1 = debugStore.stateSnapshots.find(s => s.id === snapshot1Id)
    const snap2 = debugStore.stateSnapshots.find(s => s.id === snapshot2Id)

    if (!snap1 || !snap2) {
      console.warn('One or both snapshots not found')
      return null
    }

    // Simple diff implementation
    const diff = {
      added: [] as string[],
      modified: [] as string[],
      removed: [] as string[]
    }

    const keys1 = Object.keys(snap1.state)
    const keys2 = Object.keys(snap2.state)

    // Find added and modified keys
    for (const key of keys2) {
      if (!keys1.includes(key)) {
        diff.added.push(key)
      } else if (JSON.stringify(snap1.state[key]) !== JSON.stringify(snap2.state[key])) {
        diff.modified.push(key)
      }
    }

    // Find removed keys
    for (const key of keys1) {
      if (!keys2.includes(key)) {
        diff.removed.push(key)
      }
    }

    return diff
  }
}

/**
 * Development-only debugging helpers
 */
export const devTools = {
  /**
   * Enable debugging for development
   */
  enable(config?: Partial<DebugConfig>) {
    if (process.env.NODE_ENV !== 'development') {
      console.warn('Debug tools should only be enabled in development')
      return
    }

    const debugStore = useDebugStore()
    debugStore.updateConfig({ ...config, isActive: true })

    // Add global debugging methods
    ;(window as any).__YESSALES_DEBUG__ = {
      debug: debugStore,
      timeTravel,
      exportData: debugStore.exportDebugData,
      clearLogs: debugStore.clearLogs
    }

    console.log('YesSales debug tools enabled')
  },

  /**
   * Disable debugging
   */
  disable() {
    const debugStore = useDebugStore()
    debugStore.updateConfig({ isActive: false })

    delete (window as any).__YESSALES_DEBUG__

    console.log('YesSales debug tools disabled')
  },

  /**
   * Generate performance report
   */
  generatePerformanceReport() {
    const debugStore = useDebugStore()
    const report = debugStore.getPerformanceReport()

    console.table(report.metrics)
    console.log('Performance Summary:', report.summary)

    return report
  },

  /**
   * Visualize store dependencies
   */
  visualizeDependencies() {
    const debugStore = useDebugStore()
    const graph = debugStore.getDependencyGraph()

    console.log('Store Dependency Graph:', graph)

    // In a real implementation, this could generate a visual graph
    return graph
  }
}
