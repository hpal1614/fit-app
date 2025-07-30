# 🧪 MCP Testing Guide - AI Fitness App

## 🚀 Quick Start

The app should be running at: **http://localhost:5173**

## 📱 Testing Each MCP Feature

### 1. 🍎 **Nutrition Tab Testing**

Navigate to the **Nutrition** tab (4th tab in bottom navigation).

#### Test Cases:

**A. Text-Based Food Analysis**
1. Type: "chicken breast with brown rice and broccoli"
2. Click search or press Enter
3. ✅ Should see:
   - Total calories
   - Macro breakdown (Protein, Carbs, Fat)
   - Visual macro percentage bar
   - Food items list
   - AI recommendations

**B. Quick Food Examples**
1. Click any of the quick examples
2. ✅ Should auto-analyze the food

**C. Image Upload (Mock)**
1. Click "Upload food photo"
2. Select any food image
3. Click "Analyze Image"
4. ✅ Should show mock analysis (real image analysis needs API)

**Test Phrases:**
- "protein shake with banana"
- "grilled salmon, sweet potato, asparagus"
- "2 eggs with whole wheat toast"
- "Greek yogurt with berries and granola"

---

### 2. 🎯 **Workout Generator Testing**

Navigate to the **Generate** tab (2nd tab).

#### Test Cases:

**A. AI-Powered Generation**
1. Ensure "AI-Powered Generation" toggle is ON (purple)
2. Select:
   - Goal: Strength
   - Experience: Intermediate
   - Equipment: Free Weights + Bodyweight Only
   - Time: 60 minutes
3. Click "Generate AI Workout"
4. ✅ Should see:
   - AI badge on workout name
   - 4-6 exercises
   - Appropriate sets/reps for strength
   - Exercise details with muscle groups

**B. Compare with Standard Generation**
1. Toggle AI mode OFF
2. Generate with same settings
3. ✅ Compare the difference in workout quality

**C. Different Goals**
Test each goal type:
- Strength → Heavy weights, low reps
- Hypertrophy → Moderate weights, medium reps
- Endurance → Light weights, high reps

---

### 3. 💬 **AI Coach Testing**

Navigate to the **Coach** tab (5th tab).

#### Test Cases:

**A. MCP Tool Detection**
Look for the purple MCP badge in the header.

**B. Exercise Questions (uses `lookup_exercise` tool)**
Ask:
- "How do I perform a proper squat?"
- "What muscles does deadlift work?"
- "Show me bench press technique"
- "Common mistakes in pull-ups?"

✅ Should see:
- Detailed exercise information
- Tool usage indicator showing "lookup_exercise"
- Form instructions
- Common mistakes

**C. Progress Questions (uses `track_progress` tool)**
Ask:
- "How is my progress this month?"
- "Am I getting stronger?"
- "Show me my gains"

✅ Should see progress analysis

**D. Biometric Questions (uses `analyze_biometrics` tool)**
Ask:
- "My heart rate is 180, is that too high?"
- "I'm feeling tired, should I workout?"
- "What's a good recovery heart rate?"

✅ Should see biometric insights

**E. Nutrition Questions (uses `analyze_nutrition` tool)**
Ask:
- "What should I eat after workout?"
- "How many calories in a chicken salad?"
- "Best foods for muscle gain?"

✅ Should see nutritional advice

**F. General Chat (no tools)**
Ask:
- "Motivate me!"
- "Hello"
- "What's your name?"

✅ Should use streaming response without tools

**G. MCP Toggle Test**
1. Click the Activity icon to toggle MCP OFF
2. Ask an exercise question
3. ✅ Should get general response without tool usage

---

### 4. 🎙️ **Voice Integration Testing**

In the AI Coach:

1. Click the microphone button
2. Say: "How do I do a squat?"
3. ✅ Should transcribe and process with MCP
4. Response should be spoken aloud (if unmuted)

---

## 🔍 What to Look For

### ✅ **Success Indicators**

1. **MCP Badge** - Purple "MCP" badge when enabled
2. **Tool Usage** - Shows which tools were used in responses
3. **Loading States** - Smooth loading animations
4. **Error Handling** - Graceful error messages
5. **Context Awareness** - AI remembers conversation context

### ⚠️ **Potential Issues**

1. **Slow Responses** - MCP processing adds slight delay
2. **Mock Data** - Some features use mock data (image analysis, biometrics)
3. **API Keys** - Real AI responses need API keys configured

---

## 📊 Testing Checklist

- [ ] Nutrition text analysis works
- [ ] Nutrition shows macro breakdown
- [ ] Nutrition gives recommendations
- [ ] Workout AI toggle works
- [ ] AI workouts are different from standard
- [ ] AI Coach detects exercise questions
- [ ] AI Coach shows tool usage
- [ ] MCP toggle enables/disables intelligence
- [ ] Voice commands work (if supported)
- [ ] No console errors
- [ ] UI is responsive
- [ ] Loading states appear correctly

---

## 🐛 Debug Information

### Check Console
Open browser DevTools (F12) and check:
- Look for "MCP Service initialized successfully"
- Check for any red errors
- Tool execution logs

### Check Network
- API calls should show when using AI features
- Check for failed requests

### Local Storage
- Check for saved preferences
- Workout history persistence

---

## 🎯 Expected Behavior Summary

1. **Nutrition Tab** → Instant food analysis with macros
2. **Workout Generator** → AI creates smarter workouts
3. **AI Coach** → Automatically uses right tools
4. **All Features** → Smooth, integrated experience

---

## 📝 Notes

- The app uses emergency/mock implementations for some features
- Real implementations would need:
  - OpenAI/Anthropic API keys for AI
  - Image recognition API for food photos
  - Biometric device integration
  - Camera API for form analysis

---

## 🚀 Quick Test Flow

1. Go to Nutrition → Type "chicken and rice" → See analysis
2. Go to Generate → Toggle AI ON → Generate workout
3. Go to Coach → Ask "How to squat?" → See detailed response
4. Check for MCP badges and tool indicators throughout

If everything works as described, the MCP integration is successful! 🎉