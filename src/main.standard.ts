import { createApp } from 'vue'
import App from './App.standard.vue'
import router from './router'
import { createAppPinia } from '@/stores'
import { initializeUniCompat } from '@/utils/uni-compat'

// Initialize UniApp compatibility layer for web environment
initializeUniCompat()

// Create Vue 3 application
const app = createApp(App)

// Setup Pinia store
const pinia = createAppPinia()
app.use(pinia)

// Setup Vue Router
app.use(router)

// Global error handler
app.config.errorHandler = (err, vm, info) => {
  console.error('Vue Error:', err)
  console.error('Component:', vm)
  console.error('Info:', info)

  // Show user-friendly error message - Web implementation
  console.error('Application Error: 应用出现错误，请刷新页面')
  alert('应用出现错误，请刷新页面')
}

// Performance monitoring
if (process.env.NODE_ENV === 'development') {
  app.config.performance = true
}

console.log('YesSales Standard Web Application Starting...')
console.log('Environment:', process.env.NODE_ENV)
console.log('Base URL:', router.options.history.base)

app.mount('#app')
