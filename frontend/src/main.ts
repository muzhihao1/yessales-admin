import { createApp } from 'vue'
import router from '@/router'
import App from './App.vue'
import { createAppPinia } from '@/stores'
import { installUniWebAdapter } from '@/utils/uni-web-adapter'

// Standard Vue 3 application entry point
const app = createApp(App)
const pinia = createAppPinia()

// 安装UniApp Web适配器
app.use(installUniWebAdapter)
app.use(router)
app.use(pinia)

app.mount('#app')
