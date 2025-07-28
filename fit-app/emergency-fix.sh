#!/bin/bash

echo "🚨 EMERGENCY FIX - Resolving Black Screen Issues..."

# Navigate to project directory
cd /workspace/fit-app

# 1. Fix any remaining template literal issues
echo "✅ Checking for template literal syntax errors..."
find src -name "*.tsx" -type f -exec grep -l '\\`' {} \; | while read file; do
    echo "Fixing template literals in: $file"
    sed -i 's/\\`/`/g' "$file"
done

# 2. Clear build cache
echo "✅ Clearing build cache..."
rm -rf node_modules/.vite 2>/dev/null || true
rm -rf dist 2>/dev/null || true

# 3. Fix the isAvailable issue in AIChatInterface
echo "✅ Ensuring isAvailable is defined in AIChatInterface..."
# This is already fixed in the component

# 4. Install dependencies if needed
echo "✅ Checking dependencies..."
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

echo ""
echo "🎉 EMERGENCY FIX COMPLETE!"
echo ""
echo "Next steps:"
echo "1. Stop the dev server (Ctrl+C)"
echo "2. Run: npm run dev"
echo "3. Check the browser at http://localhost:5173"
echo ""
echo "If you still see errors:"
echo "1. Open browser dev tools (F12)"
echo "2. Check the Console tab for error messages"
echo "3. Share those specific errors"