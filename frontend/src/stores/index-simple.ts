import { createPinia } from 'pinia'

/**
 * 创建并配置Pinia实例 - 简化版用于web构建
 */
export function createAppPinia() {
  const pinia = createPinia()

  console.log('✅ Pinia initialized in simple mode')
  return pinia
}

/**
 * 简化的初始化函数
 */
export async function initializeStores() {
  console.log('✅ Stores initialized successfully (simple mode)')
}

// 导出简化的auth store
export { useAuthStore } from './auth'
