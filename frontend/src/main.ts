import { createApp } from 'vue'
import router from '@/router'
import App from './App.vue'
import { createAppPinia } from '@/stores'

// Standard Vue 3 application entry point
const app = createApp(App)
const pinia = createAppPinia()

app.use(router)
app.use(pinia)

app.mount('#app')
