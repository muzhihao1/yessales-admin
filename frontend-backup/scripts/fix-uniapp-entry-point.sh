#!/bin/bash

# UniApp H5 Entry Point Fix Script
# The core issue: UniApp needs proper entry point structure for H5 builds

set -e

echo "🎯 Fixing UniApp H5 entry point issue..."

# Backup current files
echo "📁 Creating backups..."
cp src/main.ts src/main.ts.backup.$(date +%Y%m%d_%H%M%S)
echo "✅ Backup created"

# Check if index.html needs to be moved to root
if [ ! -f "index.html" ] && [ -f "src/index.html" ]; then
    echo "📄 Moving index.html to root for UniApp H5..."
    cp src/index.html index.html
    echo "✅ index.html moved to root"
elif [ ! -f "index.html" ]; then
    echo "📄 Creating index.html template for UniApp H5..."
    cat > index.html << 'EOF'
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <meta name="format-detection" content="telephone=no">
    <meta name="msapplication-tap-highlight" content="no">
    <title>耶氏台球报价系统</title>
    <style>
        html, body {
            height: 100%;
            margin: 0;
            padding: 0;
        }
        #app {
            height: 100%;
        }
        .uni-loading {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            font-size: 14px;
            color: #666;
        }
    </style>
</head>
<body>
    <div id="app">
        <div class="uni-loading">加载中...</div>
    </div>
</body>
</html>
EOF
    echo "✅ index.html created"
fi

echo "🔧 Testing current build to confirm issue..."
npm run build >/dev/null 2>&1

# Check build results
JS_COUNT=$(find dist -name "*.js" -type f | wc -l | tr -d ' ')
CSS_COUNT=$(find dist -name "*.css" -type f | wc -l | tr -d ' ')

echo "📊 Current build results:"
echo "   JavaScript files: $JS_COUNT"
echo "   CSS files: $CSS_COUNT"

if [ $JS_COUNT -eq 0 ]; then
    echo "❌ CONFIRMED: No JavaScript bundles generated"
    echo "🎯 Applying UniApp H5 entry point fix..."
    
    # The issue appears to be that UniApp is not finding the proper main entry
    # Let's check if there's a missing piece in the build configuration
    
    echo "📝 Creating enhanced main.ts that ensures UniApp H5 compatibility..."
    
    # Create the corrected main.ts
    cat > src/main.ts << 'EOF'
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
EOF

    echo "✅ Updated main.ts with enhanced UniApp H5 compatibility"
    
    echo "🏗️ Testing build after entry point fix..."
    npm run build >/dev/null 2>&1
    
    # Check results again
    NEW_JS_COUNT=$(find dist -name "*.js" -type f | wc -l | tr -d ' ')
    NEW_CSS_COUNT=$(find dist -name "*.css" -type f | wc -l | tr -d ' ')
    
    echo "📊 Build results after fix:"
    echo "   JavaScript files: $NEW_JS_COUNT"
    echo "   CSS files: $NEW_CSS_COUNT"
    
    if [ $NEW_JS_COUNT -gt 0 ]; then
        echo "✅ SUCCESS: JavaScript bundles now generated!"
        echo "🎉 UniApp H5 entry point fix successful"
    else
        echo "❌ Entry point fix didn't resolve the issue"
        echo "🔍 The problem may be deeper in the UniApp configuration"
        
        echo "📋 Additional debugging information:"
        echo "1. Vite config appears correct with uni() plugin"
        echo "2. Main.ts has correct createApp export"
        echo "3. Issue may be in how UniApp processes the entry point for H5"
        
        echo "🎯 Next steps: Check UniApp version compatibility and build target"
    fi
    
else
    echo "✅ Build already generating JavaScript bundles"
    echo "🤔 The issue may have been resolved or is elsewhere"
fi

echo ""
echo "🎯 Entry point fix script completed"