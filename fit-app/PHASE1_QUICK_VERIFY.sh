#!/bin/bash

echo "🔍 Phase 1 Quick Verification Script"
echo "===================================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if dev server is running
echo "1️⃣ Checking development server..."
if lsof -i :5173 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Dev server is running on port 5173${NC}"
    echo "   Visit: http://localhost:5173"
else
    echo -e "${YELLOW}⚠️  Dev server not running. Start with: npm run dev${NC}"
fi

# Check critical files
echo ""
echo "2️⃣ Checking critical files..."
FILES=(
    "src/components/BottomNavigation.tsx"
    "src/components/WorkoutsTab.tsx"
    "src/hooks/useAI.ts"
    "src/hooks/useVoice.ts"
    "src/App.tsx"
)

all_present=true
for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ $file exists${NC}"
    else
        echo -e "${RED}❌ $file missing!${NC}"
        all_present=false
    fi
done

# Check TypeScript compilation
echo ""
echo "3️⃣ Checking TypeScript compilation..."
if npm run build > /dev/null 2>&1; then
    echo -e "${GREEN}✅ TypeScript compilation successful${NC}"
else
    echo -e "${RED}❌ TypeScript compilation failed!${NC}"
    echo "   Run 'npm run build' to see errors"
fi

# Check for WorkoutPlan interface
echo ""
echo "4️⃣ Checking WorkoutPlan interface..."
if grep -q "interface WorkoutPlan" src/types/workout.ts; then
    echo -e "${GREEN}✅ WorkoutPlan interface found${NC}"
else
    echo -e "${RED}❌ WorkoutPlan interface missing!${NC}"
fi

# Summary
echo ""
echo "📊 VERIFICATION SUMMARY:"
echo "========================"

if $all_present && npm run build > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Phase 1 appears to be complete!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Open http://localhost:5173 in your browser"
    echo "2. Test mobile view (F12 → Device Toggle)"
    echo "3. Navigate through all 4 tabs"
    echo "4. Test AI chat (should respond in <5 seconds)"
    echo "5. Check console for errors (F12 → Console)"
else
    echo -e "${RED}❌ Phase 1 has issues that need fixing${NC}"
    echo ""
    echo "Please check the errors above and fix them before proceeding."
fi

echo ""
echo "🎯 Grade Status: D+ (Basic functionality)"
echo "🚀 Ready for: Phase 2 (Foundation Rebuild) → C+ Grade"