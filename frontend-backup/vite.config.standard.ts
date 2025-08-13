import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

// Custom plugin to rename index.standard.html to index.html
const renameIndexPlugin = () => {
  return {
    name: 'rename-index',
    generateBundle(options, bundle) {
      // Find the HTML file and rename it
      const htmlFile = Object.keys(bundle).find(name => name.endsWith('.html'))
      if (htmlFile && htmlFile !== 'index.html') {
        bundle['index.html'] = bundle[htmlFile]
        delete bundle[htmlFile]
      }
    }
  }
}

export default defineConfig({
  plugins: [vue(), renameIndexPlugin()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      input: resolve(__dirname, 'index.standard.html')
    }
  },
  server: {
    port: 3001,
    proxy: {
      '/api': {
        target: process.env.VITE_SUPABASE_URL || 'http://localhost:54321',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})