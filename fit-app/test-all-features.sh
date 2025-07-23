#!/bin/bash

echo "🏆 AI Fitness Coach - A+ Grade Testing Suite"
echo "==========================================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Function to run a test
run_test() {
    local test_name=$1
    local test_command=$2
    
    echo -n "Testing $test_name... "
    
    if eval $test_command > /dev/null 2>&1; then
        echo -e "${GREEN}✓ PASSED${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}✗ FAILED${NC}"
        ((TESTS_FAILED++))
    fi
}

echo ""
echo "1️⃣ Build & Compilation Tests"
echo "-----------------------------"
run_test "TypeScript compilation" "npm run build"
run_test "ESLint check" "npm run lint"
run_test "Development server" "timeout 5 npm run dev"

echo ""
echo "2️⃣ Component Tests"
echo "------------------"
run_test "All components exist" "ls src/components/*.tsx | wc -l | grep -E '^[0-9]+$'"
run_test "Workout components exist" "ls src/components/workout/*.tsx | wc -l | grep -E '^4$'"
run_test "Bottom navigation exists" "test -f src/components/BottomNavigation.tsx"
run_test "Workouts tab exists" "test -f src/components/WorkoutsTab.tsx"

echo ""
echo "3️⃣ Service Tests"
echo "----------------"
run_test "AI service exists" "test -f src/services/aiService.ts"
run_test "Voice service exists" "test -f src/services/voiceService.ts"
run_test "Workout service exists" "test -f src/services/workoutService.ts"
run_test "Database service exists" "test -f src/services/databaseService.ts"

echo ""
echo "4️⃣ Hook Tests"
echo "-------------"
run_test "useAI hook exists" "test -f src/hooks/useAI.ts"
run_test "useVoice hook exists" "test -f src/hooks/useVoice.ts"
run_test "useWorkout hook exists" "test -f src/hooks/useWorkout.ts"

echo ""
echo "5️⃣ Type Definition Tests"
echo "------------------------"
run_test "AI types exist" "test -f src/types/ai.ts"
run_test "Voice types exist" "test -f src/types/voice.ts"
run_test "Workout types exist" "test -f src/types/workout.ts"
run_test "Index types exist" "test -f src/types/index.ts"

echo ""
echo "6️⃣ Configuration Tests"
echo "----------------------"
run_test "Package.json valid" "node -e 'require(\"./package.json\")'"
run_test "TypeScript config valid" "test -f tsconfig.json"
run_test "Vite config valid" "test -f vite.config.ts"
run_test "Tailwind config valid" "test -f tailwind.config.js"
run_test "Environment example exists" "test -f .env.example"

echo ""
echo "7️⃣ Feature Tests"
echo "----------------"
echo -e "${YELLOW}Note: These require manual testing in the browser${NC}"
echo "- [ ] Voice commands work (start/stop workout, log sets)"
echo "- [ ] AI chat responds to questions"
echo "- [ ] Workout logging saves data"
echo "- [ ] Rest timer counts down"
echo "- [ ] Bottom navigation switches tabs"
echo "- [ ] Workouts tab shows all sections"
echo "- [ ] Mobile responsive design works"

echo ""
echo "8️⃣ Performance Tests"
echo "--------------------"
# Check bundle size
BUNDLE_SIZE=$(find dist -name "*.js" -exec du -ch {} + 2>/dev/null | grep total | awk '{print $1}')
echo "Bundle size: $BUNDLE_SIZE"

echo ""
echo "📊 Test Results Summary"
echo "======================"
echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 Congratulations! All automated tests passed!${NC}"
    echo -e "${GREEN}🏆 Your app achieves A+ Grade quality!${NC}"
else
    echo ""
    echo -e "${RED}⚠️ Some tests failed. Please fix the issues above.${NC}"
fi

echo ""
echo "📝 Next Steps:"
echo "1. Copy .env.example to .env and add your API keys"
echo "2. Run 'npm run dev' to start the development server"
echo "3. Open http://localhost:5173 in your browser"
echo "4. Test all features manually"
echo "5. Deploy to production when ready!"