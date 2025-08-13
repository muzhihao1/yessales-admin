#!/bin/bash

# YesSales Sales Route 404 Fix Script
# Addresses the "sales:1 Failed to load resource" dynamic import issue

set -e

echo "🔧 YesSales Sales Route 404 Fix"
echo "================================"

# Check if we're in the frontend directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the frontend directory"
    exit 1
fi

echo "📋 Diagnosis Summary:"
echo "   - Issue: 'sales:1 Failed to load resource: 404'"
echo "   - Root Cause: Dynamic import chunk resolution failure"
echo "   - Solution: Enhanced chunk naming + error handling"
echo ""

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf dist/
rm -rf node_modules/.vite/
echo "✅ Build cache cleared"

# Install dependencies
echo "📦 Installing dependencies..."
npm ci
echo "✅ Dependencies installed"

# Validate TypeScript
echo "🔍 Validating TypeScript..."
npm run type-check
echo "✅ TypeScript validation passed"

# Build with enhanced error reporting
echo "🔨 Building with enhanced configuration..."
NODE_ENV=production npm run build

# Verify build output
echo "🔍 Verifying build output..."

if [ ! -f "dist/index.html" ]; then
    echo "❌ Build failed: index.html not found"
    exit 1
fi

# Check for expected chunk files
CHUNK_COUNT=$(find dist/assets -name "*.js" | wc -l)
if [ "$CHUNK_COUNT" -lt 5 ]; then
    echo "❌ Build warning: Expected more JavaScript chunks (found: $CHUNK_COUNT)"
fi

echo "✅ Build verification passed"
echo "   - Found $CHUNK_COUNT JavaScript chunks"
echo "   - Index.html exists"

# Display chunk analysis
echo ""
echo "📊 Generated Chunks:"
find dist/assets -name "*.js" | head -10 | while read -r file; do
    size=$(du -h "$file" | cut -f1)
    echo "   - $(basename "$file") ($size)"
done

# Deployment instructions
echo ""
echo "🚀 Deployment Instructions:"
echo "=========================="
echo ""
echo "1. Test locally first:"
echo "   npm run preview"
echo "   # Visit http://localhost:4173/sales"
echo ""
echo "2. Deploy to Vercel:"
echo "   # The dist/ directory is ready for deployment"
echo "   # Vercel will automatically detect the build output"
echo ""
echo "3. Monitor for errors:"
echo "   # Open browser dev tools and check for:"
echo "   # - 'Failed to load SalesIndex component' messages"
echo "   # - Chunk loading errors"
echo "   # - Navigation logs starting with 🧭"
echo ""
echo "4. Verification steps:"
echo "   a. Visit /sales directly"
echo "   b. Navigate from / to /sales"
echo "   c. Check Network tab for 404s"
echo "   d. Verify console for error logs"

# Create deployment checklist
cat > deployment-checklist.md << EOF
# Sales Route 404 Fix - Deployment Checklist

## Pre-deployment
- [ ] Build completed successfully
- [ ] TypeScript validation passed
- [ ] Local preview works (\`npm run preview\`)
- [ ] /sales route loads without errors

## Post-deployment
- [ ] Visit production URL/sales directly
- [ ] Navigate from home to /sales
- [ ] Check browser Network tab for 404 errors
- [ ] Verify console logs show navigation messages (🧭)
- [ ] No "sales:1" errors in console

## Troubleshooting
If issues persist:
1. Check Vercel deployment logs
2. Verify all chunks are being served correctly
3. Check browser dev tools for specific error messages
4. Test in incognito mode to avoid cache issues

## Fixed Components
- Router with explicit chunk names
- Enhanced error handling for dynamic imports
- Chunk loading failure recovery
- Improved build configuration
EOF

echo ""
echo "📝 Created deployment-checklist.md for verification steps"
echo ""
echo "✅ Sales Route 404 Fix Complete!"
echo ""
echo "🎯 Next Steps:"
echo "   1. Test locally: npm run preview"
echo "   2. Deploy to Vercel"
echo "   3. Follow deployment-checklist.md"
echo ""
echo "💡 The fix addresses dynamic import resolution by:"
echo "   - Adding explicit webpack chunk names"
echo "   - Enhanced error handling and logging"
echo "   - Chunk loading failure recovery"
echo "   - Improved build configuration"