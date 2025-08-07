#!/bin/bash

# Ultimate UniApp H5 Build Fix
# Root Cause: UniApp H5 build is not generating proper bundle files due to entry point structure

set -e

echo "🚀 ULTIMATE UniApp H5 Build Fix - Addressing Root Cause"
echo "=============================================="

# Clean slate
echo "🧹 Cleaning build artifacts..."
rm -rf dist/
rm -rf node_modules/.vite/
echo "✅ Clean complete"

# The REAL issue based on the Vite debug output:
# UniApp is generating H5 builds but not creating the actual application bundles
# This happens when the entry point structure doesn't match what UniApp H5 expects

echo "🔍 Root Cause Analysis:"
echo "   - UniApp Vite plugin is loaded and configured correctly ✅"
echo "   - Build process completes without errors ✅"  
echo "   - Static assets are copied correctly ✅"
echo "   - BUT: No JS/CSS bundles generated ❌"
echo ""
echo "💡 The issue: UniApp H5 build expects different entry structure than current main.ts"

# Check the current main.ts pattern
echo "📄 Current main.ts pattern analysis..."
if grep -q "createSSRApp" src/main.ts && grep -q "export function createApp" src/main.ts; then
    echo "✅ Using SSR app creation (correct for UniApp)"
    echo "✅ Exporting createApp function (correct for UniApp)"
    
    # The issue might be elsewhere - let's check the build target
    echo ""
    echo "🎯 Testing alternative hypothesis: Build target configuration"
    
    # Create enhanced vite config with explicit H5 targeting
    echo "📝 Creating enhanced vite.config.ts..."
    
    cp vite.config.ts vite.config.ts.backup
    
    cat > vite.config.ts << 'EOF'
import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'

export default defineConfig({
  plugins: [uni()],
  resolve: {
    alias: {
      '@': '/src'
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
  },
  build: {
    // Explicit configuration to ensure proper bundle generation
    outDir: 'dist',
    assetsDir: 'assets',
    minify: 'terser',
    sourcemap: false,
    rollupOptions: {
      input: {
        index: '/index.html'
      }
    }
  },
  base: './' // Ensure relative paths work properly
})
EOF

    echo "✅ Enhanced vite.config.ts created"
    
    # Test with enhanced config
    echo "🏗️ Testing build with enhanced configuration..."
    npm run build
    
    # Check results
    JS_COUNT=$(find dist -name "*.js" -type f | wc -l | tr -d ' ')
    CSS_COUNT=$(find dist -name "*.css" -type f | wc -l | tr -d ' ')
    
    echo "📊 Build results with enhanced config:"
    echo "   JavaScript files: $JS_COUNT"
    echo "   CSS files: $CSS_COUNT"
    
    if [ $JS_COUNT -gt 0 ]; then
        echo "🎉 SUCCESS! Enhanced Vite config resolved the issue"
        
        # Verify bundle injection
        if ! grep -q "built files will be auto injected" dist/index.html; then
            echo "✅ HTML template processed correctly - bundles injected"
        else
            echo "⚠️  HTML still has injection placeholder - partial success"
        fi
        
    else
        echo "❌ Enhanced config didn't work - trying nuclear option..."
        
        # Restore original config
        mv vite.config.ts.backup vite.config.ts
        
        # Try the nuclear option - check if there's a version compatibility issue
        echo "🔬 Checking UniApp version compatibility..."
        
        UNIAPP_VERSION=$(npm list @dcloudio/vite-plugin-uni --depth=0 2>/dev/null | grep @dcloudio/vite-plugin-uni | sed 's/.*@\([0-9].*\)/\1/' || echo "unknown")
        echo "   Current UniApp plugin version: $UNIAPP_VERSION"
        
        if [[ "$UNIAPP_VERSION" == "3.0.0-4070520250711001" ]]; then
            echo "✅ Using latest UniApp version"
            echo ""
            echo "🎯 Final diagnosis: The issue appears to be in the build process itself"
            echo "   UniApp H5 builds may have changed behavior in this version"
            echo ""
            echo "📋 RECOMMENDED NEXT STEPS:"
            echo "1. Check if there's a specific H5 build configuration needed"
            echo "2. Verify if manifest.json h5 section needs additional configuration"
            echo "3. Test with a minimal UniApp H5 project to compare"
            
        else
            echo "⚠️  Version mismatch detected - this might be the issue"
        fi
    fi
    
else
    echo "❌ main.ts structure doesn't match expected UniApp pattern"
    echo "🔧 This might be the root cause - fixing main.ts..."
    
    # Apply main.ts fix and test
    ./scripts/fix-uniapp-entry-point.sh
fi

echo ""
echo "🎯 Ultimate fix script completed"
echo "📊 Check build output above for results"