# 🤖 CURSOR AI INSTRUCTIONS - READ THIS FIRST

## 🚨 CRITICAL RULES FOR CURSOR

### ✅ FILES YOU CAN MODIFY:
- `src/components/active/*` - ONLY these components
- `src/services/*` - All service files  
- `src/hooks/*` - All custom hooks
- `src/types/*` - Type definitions
- `src/utils/*` - Utility functions

### ❌ FILES YOU MUST NEVER TOUCH:
- `src/components/backup/*` - These are backups
- `src/components/archive/*` - These are old/unused
- `src/legacy/*` - Legacy code
- Any file with `.old`, `.backup`, `.legacy` in the name
- `src/App.tsx.backup` - This is a backup file

### 🎯 CURRENT ACTIVE UI COMPONENTS:
1. **Main Chat**: `src/components/active/AIChatInterface.tsx`
2. **Voice Control**: `src/components/active/VoiceButton.tsx`  
3. **Voice Assistant**: `src/components/active/VoiceAssistant.tsx`
4. **Voice Coach**: `src/components/active/VoiceCoachInterface.tsx`
5. **Workout Interface**: `src/components/active/WorkoutDashboard.tsx`
6. **Mobile Interface**: `src/components/active/MobileWorkoutInterface.tsx`
7. **Form Analysis**: `src/components/active/FormAnalysisInterface.tsx`
8. **Nutrition Tab**: `src/components/active/NutritionTab.tsx`
9. **Workout Generator**: `src/components/active/WorkoutGenerator.tsx`
10. **Workout Logger**: `src/components/active/WorkoutLoggerTab.tsx`
11. **Workouts Tab**: `src/components/active/WorkoutsTab.tsx`
12. **Workout Stats**: `src/components/active/WorkoutStats.tsx`

### 📝 WHEN MAKING UI CHANGES:
1. ALWAYS ask: "Which specific file should I modify?"
2. ONLY modify files in `src/components/active/`
3. NEVER create new files without asking first
4. ALWAYS show which file you're changing before making changes

### 🔄 BEFORE ANY CHANGE:
Cursor should say: "I'm modifying src/components/active/[FILENAME].tsx"

### 🚫 IMPORT RULES:
- ALWAYS import from `src/components/active/*` for UI components
- NEVER import from `src/components/` directly
- NEVER import from backup or archive folders

### 📁 FOLDER STRUCTURE:
```
src/
├── components/
│   ├── active/           # ← ONLY files Cursor should modify
│   ├── backup/           # ← Old versions (NEVER modify)
│   ├── archive/          # ← Unused components
│   └── ai/              # ← AI-specific components (check before modifying)
│       └── IntelligentAIChat.tsx
├── services/            # ← Service files (OK to modify)
├── hooks/              # ← Custom hooks (OK to modify)
├── types/              # ← Type definitions (OK to modify)
└── legacy/             # ← Old code (DO NOT TOUCH)
```