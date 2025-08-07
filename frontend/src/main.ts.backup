import { createSSRApp } from 'vue'
import App from './App.vue'
import Modal from '@/components/admin/Modal.vue'
import { createAppPinia, initializeStores } from '@/stores'
import { initializeApi } from '@/api'

export function createApp() {
  const app = createSSRApp(App)
  const pinia = createAppPinia()
  
  app.use(pinia)
  
  // Register global components
  app.component('Modal', Modal)
  
  // 初始化API和Stores
  const initializeAppSystems = async () => {
    try {
      // 1. 初始化API客户端
      initializeApi();
      
      // 2. 初始化Stores
      await initializeStores();
      
      console.log('🎉 应用系统初始化完成');
    } catch (error) {
      console.error('💥 应用系统初始化失败:', error);
      // 错误处理已在initializeStores中完成
    }
  };
  
  // 在应用挂载后初始化
  app.mixin({
    async mounted() {
      if (this.$el === this.$root.$el) {
        // 只在根组件挂载时执行一次
        await initializeAppSystems();
      }
    },
  });
  
  return {
    app,
    pinia
  }
}