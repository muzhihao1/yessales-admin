import { createApp as createVueApp } from 'vue'
import App from './App.vue'
import Modal from '@/components/admin/Modal.vue'
import { createAppPinia, initializeStores } from '@/stores'
import { initializeApi } from '@/api'

// Hybrid UniApp H5 Pattern: Export for UniApp runtime, use createApp for H5 bundles
export function createApp() {
  const app = createVueApp(App)
  const pinia = createAppPinia()
  
  app.use(pinia)
  
  // Register global components
  app.component('Modal', Modal)
  
  // Initialize app systems
  const initializeAppSystems = async () => {
    try {
      // 1. Initialize API client
      initializeApi();
      
      // 2. Initialize Stores  
      await initializeStores();
      
      console.log('🎉 应用系统初始化完成');
    } catch (error) {
      console.error('💥 应用系统初始化失败:', error);
    }
  };
  
  // Initialize on app mount
  app.mixin({
    async mounted() {
      if (this.$el === this.$root.$el) {
        await initializeAppSystems();
      }
    },
  });
  
  return {
    app,
    pinia
  }
}
