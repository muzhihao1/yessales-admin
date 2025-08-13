#!/bin/bash

# Quick Build Verification Script
# 5-minute verification of UniApp H5 fix

set -e

echo "🔍 UniApp H5 Build Verification"
echo "==============================="

# Clean build
echo "🧹 Clean build..."
rm -rf dist/
npm run build >/dev/null 2>&1

# Check bundle generation
JS_COUNT=$(find dist -name "*.js" -type f | wc -l | tr -d ' ')
CSS_COUNT=$(find dist -name "*.css" -type f | wc -l | tr -d ' ')

echo "📊 BUILD RESULTS:"
echo "   JavaScript files: $JS_COUNT"
echo "   CSS files: $CSS_COUNT"

# Check HTML processing
if [ -f "dist/index.html" ]; then
    SCRIPT_COUNT=$(grep -c "<script" dist/index.html || echo "0")
    LINK_COUNT=$(grep -c "<link.*stylesheet" dist/index.html || echo "0")
    
    echo "   Script tags: $SCRIPT_COUNT"
    echo "   CSS link tags: $LINK_COUNT"
    
    if grep -q "built files will be auto injected" dist/index.html; then
        echo "❌ HTML still contains injection placeholder"
        HTML_PROCESSED=false
    else
        echo "✅ HTML template properly processed"
        HTML_PROCESSED=true
    fi
else
    echo "❌ No index.html generated"
    HTML_PROCESSED=false
fi

# Overall assessment
echo ""
echo "🎯 VERIFICATION RESULTS:"

if [ $JS_COUNT -gt 0 ] && [ $CSS_COUNT -gt 0 ] && [ "$HTML_PROCESSED" = true ]; then
    echo "🎉 SUCCESS! Build is working correctly"
    echo "✅ JavaScript bundles generated"
    echo "✅ CSS bundles generated" 
    echo "✅ HTML template processed"
    echo ""
    echo "🚀 DEPLOYMENT READY!"
    echo "   Your UniApp H5 application should now load properly"
    echo "   Deploy to Vercel and test functionality"
    
elif [ $JS_COUNT -gt 0 ] || [ $CSS_COUNT -gt 0 ]; then
    echo "⚠️  PARTIAL SUCCESS"
    echo "   Some bundles generated but issues remain"
    echo "   Check build configuration for remaining issues"
    
else
    echo "❌ BUILD STILL BROKEN"
    echo "   No bundles generated - fundamental issue persists"
    echo "   Execute dependency refresh: rm -rf node_modules/ && npm install"
    echo "   Then run this verification script again"
fi

# Show file structure for debugging
echo ""
echo "📁 Generated file structure:"
if [ -d "dist" ]; then
    find dist -type f | head -10
else
    echo "   No dist directory found"
fi

echo ""
echo "🔍 Verification completed"