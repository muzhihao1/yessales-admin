/**
 * Image Optimization Utilities
 * 
 * Provides comprehensive image optimization including lazy loading,
 * responsive images, compression, and caching strategies.
 */

import { ref, reactive } from 'vue'

/**
 * Image optimization configuration
 */
export interface ImageOptimizationConfig {
  // Lazy loading
  enableLazyLoading: boolean
  lazyLoadingThreshold: number // Distance from viewport in pixels
  
  // Quality settings
  defaultQuality: number // 0-100
  retinaQuality: number // Quality for high DPI displays
  
  // Format preferences
  preferWebP: boolean
  preferAvif: boolean
  fallbackFormat: 'jpg' | 'png'
  
  // Resize settings
  maxWidth: number
  maxHeight: number
  enableAutoResize: boolean
  
  // Caching
  enableCaching: boolean
  cacheExpiry: number // milliseconds
  maxCacheSize: number // MB
  
  // Progressive loading
  enableProgressiveLoading: boolean
  lowQualityPlaceholder: boolean
  blurPlaceholderQuality: number
}

/**
 * Image cache entry
 */
interface ImageCacheEntry {
  url: string
  data: string // base64 or blob URL
  size: number
  timestamp: number
  hits: number
}

/**
 * Image loading state
 */
export interface ImageLoadingState {
  loading: boolean
  loaded: boolean
  error: boolean
  progress: number
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: ImageOptimizationConfig = {
  enableLazyLoading: true,
  lazyLoadingThreshold: 100,
  
  defaultQuality: 80,
  retinaQuality: 60,
  
  preferWebP: true,
  preferAvif: false,
  fallbackFormat: 'jpg',
  
  maxWidth: 1200,
  maxHeight: 1200,
  enableAutoResize: true,
  
  enableCaching: true,
  cacheExpiry: 24 * 60 * 60 * 1000, // 24 hours
  maxCacheSize: 50, // 50MB
  
  enableProgressiveLoading: true,
  lowQualityPlaceholder: true,
  blurPlaceholderQuality: 10
}

/**
 * Global image optimization state
 */
const imageCache = reactive<Map<string, ImageCacheEntry>>(new Map())
const currentCacheSize = ref(0)
const config = ref<ImageOptimizationConfig>({ ...DEFAULT_CONFIG })

/**
 * Detect supported image formats
 */
function getSupportedFormats(): string[] {
  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 1
  const ctx = canvas.getContext('2d')
  
  const formats: string[] = ['jpg', 'png']
  
  // Check WebP support
  try {
    if (canvas.toDataURL('image/webp').indexOf('image/webp') === 5) {
      formats.unshift('webp')
    }
  } catch (e) {
    // WebP not supported
  }
  
  // Check AVIF support (newer browsers)
  try {
    if (canvas.toDataURL('image/avif').indexOf('image/avif') === 5) {
      formats.unshift('avif')
    }
  } catch (e) {
    // AVIF not supported
  }
  
  return formats
}

/**
 * Get device pixel ratio
 */
function getDevicePixelRatio(): number {
  return window.devicePixelRatio || 1
}

/**
 * Generate optimized image URL
 */
export function generateOptimizedUrl(
  originalUrl: string,
  options: {
    width?: number
    height?: number
    quality?: number
    format?: string
  } = {}
): string {
  const supportedFormats = getSupportedFormats()
  const dpr = getDevicePixelRatio()
  
  // Determine optimal format
  let format = options.format
  if (!format) {
    if (config.value.preferAvif && supportedFormats.includes('avif')) {
      format = 'avif'
    } else if (config.value.preferWebP && supportedFormats.includes('webp')) {
      format = 'webp'
    } else {
      format = config.value.fallbackFormat
    }
  }
  
  // Determine quality based on DPR
  let quality = options.quality || config.value.defaultQuality
  if (dpr > 1.5) {
    quality = config.value.retinaQuality
  }
  
  // Determine dimensions
  let width = options.width
  let height = options.height
  
  if (config.value.enableAutoResize && (!width || !height)) {
    width = width || config.value.maxWidth
    height = height || config.value.maxHeight
    
    // Adjust for device pixel ratio
    if (dpr > 1) {
      width = Math.floor(width * dpr)
      height = Math.floor(height * dpr)
    }
  }
  
  // For Uniapp, we might need to use a specific image processing service
  // This is a placeholder - replace with your actual image service
  const params = new URLSearchParams()
  if (width) params.append('w', width.toString())
  if (height) params.append('h', height.toString())
  if (quality !== config.value.defaultQuality) params.append('q', quality.toString())
  if (format !== config.value.fallbackFormat) params.append('f', format)
  
  const hasParams = params.toString()
  return hasParams ? `${originalUrl}?${params.toString()}` : originalUrl
}

/**
 * Generate placeholder image (low quality/blur)
 */
export function generatePlaceholderUrl(originalUrl: string): string {
  return generateOptimizedUrl(originalUrl, {
    width: 40,
    height: 40,
    quality: config.value.blurPlaceholderQuality,
    format: 'jpg'
  })
}

/**
 * Preload image
 */
export function preloadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    
    img.onload = () => resolve(img)
    img.onerror = reject
    
    // Check cache first
    const cached = imageCache.get(url)
    if (cached && Date.now() - cached.timestamp < config.value.cacheExpiry) {
      img.src = cached.data
    } else {
      img.src = url
    }
  })
}

/**
 * Load image with progress tracking
 */
export function loadImageWithProgress(
  url: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    // Check cache first
    const cached = imageCache.get(url)
    if (cached && Date.now() - cached.timestamp < config.value.cacheExpiry) {
      cached.hits++
      resolve(cached.data)
      return
    }
    
    // For Uniapp, use uni.downloadFile for progress tracking
    uni.downloadFile({
      url,
      success: (res) => {
        if (res.statusCode === 200) {
          // Cache the result
          cacheImage(url, res.tempFilePath, 0) // Size unknown in Uniapp
          resolve(res.tempFilePath)
        } else {
          reject(new Error(`Failed to load image: ${res.statusCode}`))
        }
      },
      fail: (error) => {
        reject(error)
      }
    })
    
    // Progress tracking not directly available in uni.downloadFile
    // This is a simulation
    if (onProgress) {
      let progress = 0
      const progressInterval = setInterval(() => {
        progress += Math.random() * 20
        if (progress >= 100) {
          progress = 100
          clearInterval(progressInterval)
        }
        onProgress(progress)
      }, 100)
    }
  })
}

/**
 * Cache image data
 */
function cacheImage(url: string, data: string, size: number) {
  if (!config.value.enableCaching) return
  
  // Check cache size limit
  if (currentCacheSize.value + size > config.value.maxCacheSize * 1024 * 1024) {
    evictLeastUsedImages()
  }
  
  const entry: ImageCacheEntry = {
    url,
    data,
    size,
    timestamp: Date.now(),
    hits: 1
  }
  
  imageCache.set(url, entry)
  currentCacheSize.value += size
}

/**
 * Evict least used images from cache
 */
function evictLeastUsedImages() {
  const entries = Array.from(imageCache.entries())
  entries.sort(([, a], [, b]) => a.hits - b.hits || a.timestamp - b.timestamp)
  
  // Remove bottom 25% of entries
  const toRemove = Math.ceil(entries.length * 0.25)
  
  for (let i = 0; i < toRemove; i++) {
    const [url, entry] = entries[i]
    imageCache.delete(url)
    currentCacheSize.value -= entry.size
  }
}

/**
 * Clear image cache
 */
export function clearImageCache() {
  imageCache.clear()
  currentCacheSize.value = 0
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  const entries = Array.from(imageCache.values())
  
  return {
    totalEntries: entries.length,
    totalSize: currentCacheSize.value,
    totalSizeMB: Math.round(currentCacheSize.value / 1024 / 1024 * 100) / 100,
    hitRate: entries.length > 0 
      ? Math.round(entries.reduce((sum, entry) => sum + entry.hits, 0) / entries.length * 100) / 100
      : 0,
    oldestEntry: entries.length > 0 
      ? Math.min(...entries.map(entry => entry.timestamp))
      : 0,
    mostHitEntry: entries.length > 0
      ? entries.reduce((max, entry) => entry.hits > max.hits ? entry : max, entries[0])
      : null
  }
}

/**
 * Compress image (client-side)
 */
export function compressImage(
  file: File,
  options: {
    maxWidth?: number
    maxHeight?: number
    quality?: number
    format?: string
  } = {}
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    
    img.onload = () => {
      // Calculate dimensions
      let { width, height } = img
      const maxWidth = options.maxWidth || config.value.maxWidth
      const maxHeight = options.maxHeight || config.value.maxHeight
      
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height)
        width *= ratio
        height *= ratio
      }
      
      canvas.width = width
      canvas.height = height
      
      // Draw image
      ctx!.drawImage(img, 0, 0, width, height)
      
      // Convert to blob
      const quality = (options.quality || config.value.defaultQuality) / 100
      const format = options.format || `image/${config.value.fallbackFormat}`
      
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error('Failed to compress image'))
        }
      }, format, quality)
    }
    
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}

/**
 * Image optimization composable
 */
export function useImageOptimization() {
  const loadingStates = reactive<Map<string, ImageLoadingState>>(new Map())
  
  function createLoadingState(url: string): ImageLoadingState {
    const state = {
      loading: false,
      loaded: false,
      error: false,
      progress: 0
    }
    
    loadingStates.set(url, state)
    return state
  }
  
  function getLoadingState(url: string): ImageLoadingState {
    return loadingStates.get(url) || createLoadingState(url)
  }
  
  async function loadOptimizedImage(
    originalUrl: string,
    options: {
      width?: number
      height?: number
      quality?: number
      usePlaceholder?: boolean
    } = {}
  ): Promise<{
    optimizedUrl: string
    placeholderUrl?: string
    state: ImageLoadingState
  }> {
    const optimizedUrl = generateOptimizedUrl(originalUrl, options)
    const placeholderUrl = options.usePlaceholder 
      ? generatePlaceholderUrl(originalUrl) 
      : undefined
    
    const state = getLoadingState(optimizedUrl)
    
    if (!state.loaded && !state.loading) {
      state.loading = true
      state.error = false
      
      try {
        await loadImageWithProgress(optimizedUrl, (progress) => {
          state.progress = progress
        })
        
        state.loaded = true
        state.loading = false
        state.progress = 100
      } catch (error) {
        state.error = true
        state.loading = false
        state.progress = 0
        console.error('Failed to load optimized image:', error)
      }
    }
    
    return {
      optimizedUrl,
      placeholderUrl,
      state
    }
  }
  
  return {
    loadingStates: loadingStates,
    loadOptimizedImage,
    getLoadingState,
    clearStates: () => loadingStates.clear()
  }
}

/**
 * Lazy loading intersection observer
 */
class LazyLoadObserver {
  private observer: IntersectionObserver | null = null
  private elements = new WeakMap<Element, () => void>()
  
  constructor(threshold = config.value.lazyLoadingThreshold) {
    if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const callback = this.elements.get(entry.target)
              if (callback) {
                callback()
                this.unobserve(entry.target)
              }
            }
          })
        },
        {
          rootMargin: `${threshold}px`
        }
      )
    }
  }
  
  observe(element: Element, callback: () => void) {
    if (this.observer) {
      this.elements.set(element, callback)
      this.observer.observe(element)
    } else {
      // Fallback: load immediately
      callback()
    }
  }
  
  unobserve(element: Element) {
    if (this.observer) {
      this.observer.unobserve(element)
      this.elements.delete(element)
    }
  }
  
  disconnect() {
    if (this.observer) {
      this.observer.disconnect()
      this.elements = new WeakMap()
    }
  }
}

// Global lazy load observer
export const lazyLoadObserver = new LazyLoadObserver()

/**
 * Update image optimization configuration
 */
export function updateImageConfig(newConfig: Partial<ImageOptimizationConfig>) {
  Object.assign(config.value, newConfig)
}

/**
 * Get current configuration
 */
export function getImageConfig(): ImageOptimizationConfig {
  return { ...config.value }
}

/**
 * Image optimization utilities
 */
export const imageUtils = {
  getSupportedFormats,
  generateOptimizedUrl,
  generatePlaceholderUrl,
  preloadImage,
  loadImageWithProgress,
  compressImage,
  clearImageCache,
  getCacheStats,
  updateImageConfig,
  getImageConfig
}