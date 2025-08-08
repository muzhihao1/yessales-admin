/**
 * Global type definitions for YesSales application
 */

import type { UniAPI } from '@/utils/uni-compat'

declare global {
  interface Window {
    uni?: UniAPI
  }
}