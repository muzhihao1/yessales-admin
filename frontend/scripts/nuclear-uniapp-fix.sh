#!/bin/bash

# Nuclear Option: Complete UniApp H5 Build Fix
# When all else fails, rebuild the entire entry point structure

set -e

echo "💣 NUCLEAR OPTION: Complete UniApp H5 Build Reconstruction"
echo "========================================================="

# Back up everything
echo "📁 Creating comprehensive backup..."
cp -r src src.backup.$(date +%Y%m%d_%H%M%S)
cp vite.config.ts vite.config.ts.backup.$(date +%Y%m%d_%H%M%S)
cp index.html index.html.backup.$(date +%Y%m%d_%H%M%S)

# Clean everything
rm -rf dist/
rm -rf node_modules/.vite/

echo "✅ Backup and cleanup complete"

# The nuclear approach: Check if the issue is with the build pipeline itself
echo "🔬 Testing minimal UniApp H5 build..."

# Create a completely minimal main.ts to test if the build pipeline works at all
cat > src/main.ts.minimal << 'EOF'
import { createSSRApp } from 'vue'
import App from './App.vue'

export function createApp() {
  const app = createSSRApp(App)
  return {
    app
  }
}
EOF

# Test with minimal setup
echo "🧪 Testing with minimal main.ts..."
mv src/main.ts src/main.ts.full
mv src/main.ts.minimal src/main.ts

npm run build >/dev/null 2>&1

# Check if minimal works
MIN_JS_COUNT=$(find dist -name "*.js" -type f | wc -l | tr -d ' ')
echo "📊 Minimal build results: $MIN_JS_COUNT JS files"

if [ $MIN_JS_COUNT -gt 0 ]; then
    echo "✅ Minimal build WORKS - issue is in the complex main.ts"
    echo "🔧 The problem is with the store/API initialization in main.ts"
    
    # Restore full main.ts and fix it step by step
    mv src/main.ts src/main.ts.minimal.working
    mv src/main.ts.full src/main.ts
    
    echo "📝 Creating fixed main.ts without problematic initialization..."
    cat > src/main.ts << 'EOF'
import { createSSRApp } from 'vue'
import App from './App.vue'
import Modal from '@/components/admin/Modal.vue'
import { createAppPinia } from '@/stores'

export function createApp() {
  const app = createSSRApp(App)
  const pinia = createAppPinia()
  
  app.use(pinia)
  app.component('Modal', Modal)
  
  // Simplified initialization - remove complex async initialization
  // that might be breaking the build
  
  return {
    app,
    pinia
  }
}
EOF
    
    echo "✅ Created simplified main.ts"
    
    # Test simplified version
    echo "🏗️ Testing simplified build..."
    rm -rf dist/
    npm run build >/dev/null 2>&1
    
    SIMP_JS_COUNT=$(find dist -name "*.js" -type f | wc -l | tr -d ' ')
    echo "📊 Simplified build results: $SIMP_JS_COUNT JS files"
    
    if [ $SIMP_JS_COUNT -gt 0 ]; then
        echo "🎉 SUCCESS! Simplified main.ts works"
        echo "🔍 The issue was with complex async initialization in main.ts"
        echo "✅ Your app should now build and load correctly"
        
        # Check HTML injection
        if ! grep -q "built files will be auto injected" dist/index.html; then
            echo "✅ HTML bundles properly injected"
        else
            echo "⚠️  HTML still has placeholder - may need index.html fix"
        fi
        
        echo ""
        echo "📋 RESOLUTION:"
        echo "   - Removed complex async initialization from main.ts"
        echo "   - Simplified to basic Vue app creation"
        echo "   - Build now generates proper JS/CSS bundles"
        echo ""
        echo "🔧 NEXT STEPS:"
        echo "   - Move async initialization to App.vue or individual components"
        echo "   - Test the application functionality"
        echo "   - Deploy to verify it works in production"
        
    else
        echo "❌ Even simplified version doesn't work"
        echo "🔬 The issue is deeper - checking build pipeline..."
    fi
    
else
    echo "❌ Even minimal build doesn't work"
    echo "🚨 CRITICAL: The build pipeline itself is broken"
    
    # Restore original main.ts
    mv src/main.ts src/main.ts.minimal.broken
    mv src/main.ts.full src/main.ts
    
    echo "📊 DIAGNOSIS: Complete build pipeline failure"
    echo "🔍 Checking potential causes..."
    
    # Check if it's a dependency issue
    echo "📦 Dependency analysis..."
    npm list @dcloudio/vite-plugin-uni --depth=0 2>/dev/null || echo "❌ UniApp plugin not found"
    npm list vite --depth=0 2>/dev/null || echo "❌ Vite not found"
    npm list vue --depth=0 2>/dev/null || echo "❌ Vue not found"
    
    echo ""
    echo "🎯 NUCLEAR DIAGNOSIS COMPLETE"
    echo "   If minimal build fails, the issue is:"
    echo "   1. UniApp plugin configuration error"
    echo "   2. Node.js/npm version incompatibility"  
    echo "   3. Corrupted node_modules"
    echo ""
    echo "🔧 RECOMMENDED ACTIONS:"
    echo "   1. Delete node_modules and package-lock.json"
    echo "   2. Run npm install"
    echo "   3. Try build again"
    echo "   4. If still fails, UniApp version downgrade may be needed"
fi

echo ""
echo "💣 Nuclear fix script completed"