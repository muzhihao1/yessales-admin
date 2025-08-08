/**
 * Device Detection Utilities
 *
 * Provides comprehensive device detection and capability analysis
 * specifically optimized for Uniapp cross-platform development.
 */

import { computed, reactive, ref } from 'vue'

/**
 * Device information interface
 */
export interface DeviceInfo {
  // Basic device info
  platform: 'ios' | 'android' | 'web' | 'mp-weixin' | 'mp-alipay' | 'mp-baidu' | 'unknown'
  system: string
  model: string
  brand: string

  // Screen information
  screenWidth: number
  screenHeight: number
  windowWidth: number
  windowHeight: number
  pixelRatio: number

  // Safe area information
  statusBarHeight: number
  safeAreaTop: number
  safeAreaBottom: number
  safeAreaLeft: number
  safeAreaRight: number

  // Device capabilities
  capabilities: DeviceCapabilities

  // Network information
  networkType: string

  // Performance characteristics
  performanceLevel: 'high' | 'medium' | 'low'

  // Additional metadata
  isTablet: boolean
  isPhone: boolean
  isLandscape: boolean
  hasNotch: boolean
  supportsDarkMode: boolean
}

/**
 * Device capabilities
 */
export interface DeviceCapabilities {
  camera: boolean
  microphone: boolean
  gps: boolean
  gyroscope: boolean
  accelerometer: boolean
  compass: boolean
  bluetooth: boolean
  nfc: boolean
  fingerprint: boolean
  faceId: boolean
  vibrate: boolean
}

/**
 * Device category definitions
 */
export interface DeviceCategory {
  name: string
  minWidth: number
  maxWidth: number
  minHeight: number
  maxHeight: number
  pixelRatioRange: [number, number]
  isTablet: boolean
}

/**
 * Common device categories
 */
export const DEVICE_CATEGORIES: DeviceCategory[] = [
  {
    name: 'iPhone SE',
    minWidth: 320,
    maxWidth: 320,
    minHeight: 568,
    maxHeight: 568,
    pixelRatioRange: [2, 2],
    isTablet: false
  },
  {
    name: 'iPhone 6/7/8',
    minWidth: 375,
    maxWidth: 375,
    minHeight: 667,
    maxHeight: 667,
    pixelRatioRange: [2, 2],
    isTablet: false
  },
  {
    name: 'iPhone 6/7/8 Plus',
    minWidth: 414,
    maxWidth: 414,
    minHeight: 736,
    maxHeight: 736,
    pixelRatioRange: [3, 3],
    isTablet: false
  },
  {
    name: 'iPhone X/11/12/13',
    minWidth: 375,
    maxWidth: 375,
    minHeight: 812,
    maxHeight: 812,
    pixelRatioRange: [3, 3],
    isTablet: false
  },
  {
    name: 'iPhone 12/13 Pro Max',
    minWidth: 428,
    maxWidth: 428,
    minHeight: 926,
    maxHeight: 926,
    pixelRatioRange: [3, 3],
    isTablet: false
  },
  {
    name: 'Android Small',
    minWidth: 320,
    maxWidth: 360,
    minHeight: 640,
    maxHeight: 720,
    pixelRatioRange: [2, 3],
    isTablet: false
  },
  {
    name: 'Android Medium',
    minWidth: 360,
    maxWidth: 400,
    minHeight: 720,
    maxHeight: 800,
    pixelRatioRange: [2, 3],
    isTablet: false
  },
  {
    name: 'Android Large',
    minWidth: 400,
    maxWidth: 450,
    minHeight: 800,
    maxHeight: 900,
    pixelRatioRange: [2, 4],
    isTablet: false
  },
  {
    name: 'iPad',
    minWidth: 768,
    maxWidth: 768,
    minHeight: 1024,
    maxHeight: 1024,
    pixelRatioRange: [1, 2],
    isTablet: true
  },
  {
    name: 'iPad Pro',
    minWidth: 1024,
    maxWidth: 1024,
    minHeight: 1366,
    maxHeight: 1366,
    pixelRatioRange: [2, 2],
    isTablet: true
  },
  {
    name: 'Android Tablet Small',
    minWidth: 600,
    maxWidth: 800,
    minHeight: 960,
    maxHeight: 1280,
    pixelRatioRange: [1, 2],
    isTablet: true
  },
  {
    name: 'Android Tablet Large',
    minWidth: 800,
    maxWidth: 1200,
    minHeight: 1280,
    maxHeight: 1920,
    pixelRatioRange: [1, 3],
    isTablet: true
  }
]

/**
 * Device detection state
 */
const deviceInfo = reactive<Partial<DeviceInfo>>({})
const isInitialized = ref(false)
const detectionError = ref<string | null>(null)

/**
 * Detect device information using Uniapp APIs
 */
export async function detectDevice(): Promise<DeviceInfo> {
  try {
    // Get system information
    const systemInfo = await new Promise<UniApp.GetSystemInfoResult>((resolve, reject) => {
      uni.getSystemInfo({
        success: resolve,
        fail: reject
      })
    })

    // Get network information
    const networkInfo = await new Promise<UniApp.GetNetworkTypeResult>(resolve => {
      uni.getNetworkType({
        success: resolve,
        fail: () => resolve({ networkType: 'unknown' as any })
      })
    })

    // Detect device capabilities
    const capabilities = await detectCapabilities()

    // Calculate performance level
    const performanceLevel = calculatePerformanceLevel(systemInfo)

    // Determine device category
    const category = determineDeviceCategory(systemInfo)

    // Check for notch/safe area
    const hasNotch = systemInfo.safeArea
      ? systemInfo.safeArea.top > systemInfo.statusBarHeight
      : false

    // Detect dark mode support
    const supportsDarkMode = systemInfo.theme !== undefined

    const info: DeviceInfo = {
      platform: systemInfo.platform as DeviceInfo['platform'],
      system: systemInfo.system,
      model: systemInfo.model,
      brand: systemInfo.brand,

      screenWidth: systemInfo.screenWidth,
      screenHeight: systemInfo.screenHeight,
      windowWidth: systemInfo.windowWidth,
      windowHeight: systemInfo.windowHeight,
      pixelRatio: systemInfo.pixelRatio,

      statusBarHeight: systemInfo.statusBarHeight || 0,
      safeAreaTop: systemInfo.safeArea?.top || 0,
      safeAreaBottom: systemInfo.safeArea?.bottom || systemInfo.screenHeight,
      safeAreaLeft: systemInfo.safeArea?.left || 0,
      safeAreaRight: systemInfo.safeArea?.right || systemInfo.screenWidth,

      capabilities,
      networkType: networkInfo.networkType,
      performanceLevel,

      isTablet: category.isTablet,
      isPhone: !category.isTablet,
      isLandscape: systemInfo.windowWidth > systemInfo.windowHeight,
      hasNotch,
      supportsDarkMode
    }

    // Update global state
    Object.assign(deviceInfo, info)
    isInitialized.value = true
    detectionError.value = null

    console.log('📱 Device detected:', info)

    return info
  } catch (error) {
    console.error('Failed to detect device:', error)
    detectionError.value = error instanceof Error ? error.message : 'Unknown detection error'
    throw error
  }
}

/**
 * Detect device capabilities
 */
async function detectCapabilities(): Promise<DeviceCapabilities> {
  const capabilities: DeviceCapabilities = {
    camera: false,
    microphone: false,
    gps: false,
    gyroscope: false,
    accelerometer: false,
    compass: false,
    bluetooth: false,
    nfc: false,
    fingerprint: false,
    faceId: false,
    vibrate: false
  }

  // Test camera capability
  try {
    await new Promise((resolve, reject) => {
      uni.getSetting({
        success: res => {
          capabilities.camera = res.authSetting['scope.camera'] !== false
          resolve(true)
        },
        fail: reject
      })
    })
  } catch (e) {
    // Camera detection failed
  }

  // Test microphone capability
  try {
    await new Promise((resolve, reject) => {
      uni.getSetting({
        success: res => {
          capabilities.microphone = res.authSetting['scope.record'] !== false
          resolve(true)
        },
        fail: reject
      })
    })
  } catch (e) {
    // Microphone detection failed
  }

  // Test GPS capability
  try {
    await new Promise((resolve, reject) => {
      uni.getSetting({
        success: res => {
          capabilities.gps = res.authSetting['scope.userLocation'] !== false
          resolve(true)
        },
        fail: reject
      })
    })
  } catch (e) {
    // GPS detection failed
  }

  // Test vibration capability
  try {
    capabilities.vibrate = true // Most mobile devices support vibration
  } catch (e) {
    // Vibration not supported
  }

  // Platform-specific capability detection
  if (deviceInfo.platform === 'ios') {
    capabilities.faceId = true // Assume modern iOS devices have Face ID capability
    capabilities.fingerprint = true
  } else if (deviceInfo.platform === 'android') {
    capabilities.fingerprint = true
    capabilities.nfc = true // Most Android devices have NFC
  }

  return capabilities
}

/**
 * Calculate device performance level
 */
function calculatePerformanceLevel(
  systemInfo: UniApp.GetSystemInfoResult
): 'high' | 'medium' | 'low' {
  // Performance scoring based on various factors
  let score = 0

  // Screen resolution factor
  const totalPixels = systemInfo.screenWidth * systemInfo.screenHeight * systemInfo.pixelRatio
  if (totalPixels > 2000000)
    score += 3 // High resolution
  else if (totalPixels > 1000000)
    score += 2 // Medium resolution
  else score += 1 // Low resolution

  // Platform factor
  if (systemInfo.platform === 'ios')
    score += 2 // iOS generally performs better
  else if (systemInfo.platform === 'android') score += 1

  // Model/brand factor (heuristic)
  const model = systemInfo.model.toLowerCase()
  const brand = systemInfo.brand?.toLowerCase() || ''

  if (brand.includes('apple') || model.includes('iphone') || model.includes('ipad')) {
    score += 2
  } else if (brand.includes('samsung') || brand.includes('google') || brand.includes('oneplus')) {
    score += 2
  } else if (brand.includes('xiaomi') || brand.includes('huawei') || brand.includes('oppo')) {
    score += 1
  }

  // System version factor (newer versions typically perform better)
  if (systemInfo.system) {
    const versionMatch = systemInfo.system.match(/(\d+)/)
    if (versionMatch) {
      const version = parseInt(versionMatch[1])
      if (systemInfo.platform === 'ios' && version >= 14) score += 1
      else if (systemInfo.platform === 'android' && version >= 10) score += 1
    }
  }

  // Calculate performance level
  if (score >= 7) return 'high'
  else if (score >= 4) return 'medium'
  else return 'low'
}

/**
 * Determine device category
 */
function determineDeviceCategory(systemInfo: UniApp.GetSystemInfoResult): DeviceCategory {
  const width = systemInfo.windowWidth
  const height = systemInfo.windowHeight
  const pixelRatio = systemInfo.pixelRatio

  // Find matching category
  for (const category of DEVICE_CATEGORIES) {
    if (
      width >= category.minWidth &&
      width <= category.maxWidth &&
      height >= category.minHeight &&
      height <= category.maxHeight &&
      pixelRatio >= category.pixelRatioRange[0] &&
      pixelRatio <= category.pixelRatioRange[1]
    ) {
      return category
    }
  }

  // Default category based on size
  const isTablet = width >= 600 || height >= 900

  return {
    name: isTablet ? 'Unknown Tablet' : 'Unknown Phone',
    minWidth: width,
    maxWidth: width,
    minHeight: height,
    maxHeight: height,
    pixelRatioRange: [pixelRatio, pixelRatio],
    isTablet
  }
}

/**
 * Get device orientation
 */
export function getOrientation(): 'portrait' | 'landscape' {
  if (!deviceInfo.windowWidth || !deviceInfo.windowHeight) return 'portrait'
  return deviceInfo.windowWidth > deviceInfo.windowHeight ? 'landscape' : 'portrait'
}

/**
 * Check if device is in dark mode
 */
export function isDarkMode(): boolean {
  if (typeof uni !== 'undefined') {
    try {
      const systemInfo = uni.getSystemInfoSync()
      return systemInfo.theme === 'dark'
    } catch (e) {
      return false
    }
  }

  // Fallback for web
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  }

  return false
}

/**
 * Get safe area insets
 */
export function getSafeAreaInsets() {
  return {
    top: deviceInfo.safeAreaTop || 0,
    bottom: (deviceInfo.screenHeight || 0) - (deviceInfo.safeAreaBottom || 0),
    left: deviceInfo.safeAreaLeft || 0,
    right: (deviceInfo.screenWidth || 0) - (deviceInfo.safeAreaRight || 0)
  }
}

/**
 * Check if device supports specific feature
 */
export function supportsFeature(feature: keyof DeviceCapabilities): boolean {
  return deviceInfo.capabilities?.[feature] || false
}

/**
 * Get device category name
 */
export function getDeviceCategoryName(): string {
  if (!deviceInfo.windowWidth || !deviceInfo.windowHeight) return 'Unknown'

  const systemInfo = {
    windowWidth: deviceInfo.windowWidth,
    windowHeight: deviceInfo.windowHeight,
    pixelRatio: deviceInfo.pixelRatio || 1
  } as UniApp.GetSystemInfoResult

  const category = determineDeviceCategory(systemInfo)
  return category.name
}

/**
 * Device detection composable
 */
export function useDeviceDetection() {
  const info = computed(() => deviceInfo as DeviceInfo)

  const isReady = computed(() => isInitialized.value)

  const error = computed(() => detectionError.value)

  const isTablet = computed(() => info.value?.isTablet || false)

  const isPhone = computed(() => info.value?.isPhone || false)

  const performanceLevel = computed(() => info.value?.performanceLevel || 'medium')

  const orientation = computed(() => getOrientation())

  const safeAreaInsets = computed(() => getSafeAreaInsets())

  const deviceCategory = computed(() => getDeviceCategoryName())

  // Auto-initialize if not already done
  if (!isInitialized.value && typeof uni !== 'undefined') {
    detectDevice().catch(console.error)
  }

  return {
    // State
    info,
    isReady,
    error,

    // Computed properties
    isTablet,
    isPhone,
    performanceLevel,
    orientation,
    safeAreaInsets,
    deviceCategory,

    // Methods
    detectDevice,
    supportsFeature,
    isDarkMode,

    // Utilities
    DEVICE_CATEGORIES
  }
}

/**
 * Development tools for device detection
 */
export const deviceDetectionDevTools = {
  /**
   * Get detailed device report
   */
  getDeviceReport() {
    if (!isInitialized.value) {
      console.warn('Device detection not initialized')
      return null
    }

    return {
      basicInfo: {
        platform: deviceInfo.platform,
        system: deviceInfo.system,
        model: deviceInfo.model,
        brand: deviceInfo.brand,
        category: getDeviceCategoryName()
      },
      screenInfo: {
        screenWidth: deviceInfo.screenWidth,
        screenHeight: deviceInfo.screenHeight,
        windowWidth: deviceInfo.windowWidth,
        windowHeight: deviceInfo.windowHeight,
        pixelRatio: deviceInfo.pixelRatio,
        isLandscape: deviceInfo.isLandscape
      },
      safeArea: {
        statusBarHeight: deviceInfo.statusBarHeight,
        safeAreaTop: deviceInfo.safeAreaTop,
        safeAreaBottom: deviceInfo.safeAreaBottom,
        hasNotch: deviceInfo.hasNotch
      },
      capabilities: deviceInfo.capabilities,
      performance: {
        level: deviceInfo.performanceLevel,
        networkType: deviceInfo.networkType
      },
      features: {
        supportsDarkMode: deviceInfo.supportsDarkMode,
        currentlyDarkMode: isDarkMode()
      }
    }
  },

  /**
   * Log device information to console
   */
  logDeviceInfo() {
    const report = this.getDeviceReport()
    if (report) {
      console.group('📱 Device Detection Report')
      console.table(report.basicInfo)
      console.table(report.screenInfo)
      console.table(report.safeArea)
      console.table(report.capabilities)
      console.table(report.performance)
      console.table(report.features)
      console.groupEnd()
    }
  },

  /**
   * Test device capabilities
   */
  async testCapabilities() {
    console.log('🧪 Testing device capabilities...')

    const tests = Object.keys(deviceInfo.capabilities || {}) as (keyof DeviceCapabilities)[]
    const results: Record<string, boolean> = {}

    for (const capability of tests) {
      results[capability] = supportsFeature(capability)
    }

    console.table(results)
    return results
  }
}
