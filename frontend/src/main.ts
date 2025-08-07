import { createApp } from 'vue'
import App from './App.vue'
import { createAppPinia } from '@/stores'

// Standard Vue 3 application entry point
const app = createApp(App)
const pinia = createAppPinia()

app.use(pinia)

app.mount('#app')