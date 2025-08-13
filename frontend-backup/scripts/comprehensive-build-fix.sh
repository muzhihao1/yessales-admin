#!/bin/bash

# Comprehensive UniApp H5 Build Fix Script
# Addresses multiple potential causes of missing JS/CSS bundles

set -e

echo "🔧 Starting comprehensive UniApp H5 build diagnosis and fix..."

# Function to check file existence and content
check_file() {
    local file="$1"
    local description="$2"
    
    if [ -f "$file" ]; then
        echo "✅ $description exists: $file"
        return 0
    else
        echo "❌ $description missing: $file"
        return 1
    fi
}

# 1. ENVIRONMENT CHECK
echo "🌍 Environment Verification:"
echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"
echo "Current directory: $(pwd)"

# Check critical files
check_file "src/main.ts" "Main entry point"
check_file "src/App.vue" "Root component"  
check_file "vite.config.ts" "Vite configuration"
check_file "src/pages.json" "UniApp pages config"
check_file "src/manifest.json" "UniApp manifest"

echo ""

# 2. VITE CONFIGURATION ANALYSIS
echo "🔍 Analyzing Vite configuration..."
cat vite.config.ts

echo ""

# 3. PACKAGE.JSON BUILD SCRIPTS
echo "📦 Build script configuration:"
grep -A 5 -B 1 '"build"' package.json

echo ""

# 4. CLEAN BUILD TEST
echo "🧹 Clean build test..."
rm -rf dist/
rm -rf node_modules/.vite/
echo "✅ Cleaned dist/ and vite cache"

# 5. DETAILED BUILD WITH DEBUG
echo "🏗️ Running build with detailed output..."
DEBUG=vite:* npm run build 2>&1 | tee build-debug.log || true

# 6. BUILD OUTPUT ANALYSIS
echo ""
echo "📊 Analyzing build results..."

if [ -d "dist" ]; then
    echo "✅ dist/ directory exists"
    echo "📁 Directory structure:"
    find dist -type f | head -20
    
    # Check for actual bundles
    JS_FILES=$(find dist -name "*.js" -type f | wc -l | tr -d ' ')
    CSS_FILES=$(find dist -name "*.css" -type f | wc -l | tr -d ' ')
    
    echo "📈 Bundle count:"
    echo "   JavaScript files: $JS_FILES"
    echo "   CSS files: $CSS_FILES"
    
    # Check main HTML file
    if [ -f "dist/index.html" ]; then
        echo "📄 Main HTML analysis:"
        echo "   Title: $(grep '<title>' dist/index.html | sed 's/.*<title>\(.*\)<\/title>.*/\1/')"
        
        if grep -q "built files will be auto injected" dist/index.html; then
            echo "❌ Still contains injection placeholder"
        else
            echo "✅ No injection placeholder found"
        fi
        
        # Check for injected assets
        SCRIPT_COUNT=$(grep -c "<script" dist/index.html || echo "0")
        LINK_COUNT=$(grep -c "<link.*stylesheet" dist/index.html || echo "0")
        
        echo "   Script tags: $SCRIPT_COUNT"
        echo "   CSS link tags: $LINK_COUNT"
    fi
    
    # Check UniApp specific structure
    if [ -d "dist/build/h5" ]; then
        echo "📁 UniApp H5 structure found:"
        find dist/build/h5 -type f | head -10
    fi
    
else
    echo "❌ No dist/ directory found - build completely failed"
fi

# 7. IDENTIFY SPECIFIC ISSUES
echo ""
echo "🎯 Issue Analysis:"

if [ $JS_FILES -eq 0 ]; then
    echo "❌ CRITICAL: No JavaScript bundles generated"
    echo "   Possible causes:"
    echo "   - UniApp Vite plugin not processing correctly"
    echo "   - Entry point not being recognized"
    echo "   - Build target mismatch"
fi

if [ -f "dist/index.html" ] && grep -q "built files will be auto injected" dist/index.html; then
    echo "❌ CRITICAL: HTML template not processed"
    echo "   This indicates Vite's HTML processing is not working"
fi

# 8. CREATE DIAGNOSTIC REPORT
echo ""
echo "📝 Creating diagnostic report..."
cat > build-diagnostic-report.md << EOF
# UniApp H5 Build Diagnostic Report

## Build Environment
- Node: $(node --version)
- NPM: $(npm --version)
- Date: $(date)

## Build Results
- JavaScript files: $JS_FILES
- CSS files: $CSS_FILES  
- Script tags in HTML: $SCRIPT_COUNT
- CSS link tags in HTML: $LINK_COUNT

## Key Issues Identified
$(if [ $JS_FILES -eq 0 ]; then echo "- No JavaScript bundles generated"; fi)
$(if grep -q "built files will be auto injected" dist/index.html 2>/dev/null; then echo "- HTML template injection failed"; fi)

## Next Steps Required
1. Verify UniApp Vite plugin configuration
2. Check entry point compatibility
3. Test with simplified build target

## Build Log Location
- Detailed log: build-debug.log
- Generated: $(date)
EOF

echo "✅ Diagnostic report saved: build-diagnostic-report.md"
echo "✅ Detailed build log saved: build-debug.log"

echo ""
echo "🎯 Comprehensive diagnosis completed!"
echo "📊 Review build-diagnostic-report.md for summary"