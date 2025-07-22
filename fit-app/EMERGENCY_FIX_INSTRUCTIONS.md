# 🚨 EMERGENCY FIX INSTRUCTIONS

## Current Issues:
- ❌ AI not responding (OpenRouter, Groq, Google all failing)
- ❌ Voice not listening or speaking  
- ❌ Coffee icon hanging forever
- ❌ UI is desktop-only, unusable on mobile

## Emergency Fixes Created:

### 1. **AI Fix** (`src/hooks/useAI.ts`)
- ✅ Created emergency AI hook with 5-second timeout
- ✅ Fallback responses if APIs fail
- ✅ Console logging for debugging

### 2. **Voice Fix** (`src/hooks/useVoiceEmergency.ts`)
- ✅ Basic but working voice synthesis
- ✅ Simple speech recognition
- ✅ Browser compatibility checks

### 3. **Emergency App** (`src/AppEmergency.tsx`)
- ✅ Mobile-first layout with bottom navigation
- ✅ Test buttons for AI and Voice
- ✅ No hanging states (timeouts on everything)

## How to Test:

1. **Use the Emergency App:**
   ```bash
   # Replace your main App with the emergency version
   cp src/AppEmergency.tsx src/App.tsx
   ```

2. **Update Voice Import:**
   In any component using voice, change:
   ```typescript
   import { useVoice } from './hooks/useVoice';
   ```
   To:
   ```typescript
   import { useVoice } from './hooks/useVoiceEmergency';
   ```

3. **Test the Features:**
   - Click "Test AI Response" - should get a response or fallback
   - Click "Test AI + Voice" - AI response should be spoken
   - Click "Test Voice Input" - should start listening

## API Keys Check:
Make sure you have these in your `.env` file:
```
VITE_OPENROUTER_API_KEY=your-key-here
VITE_GROQ_API_KEY=your-key-here  
VITE_GOOGLE_AI_API_KEY=your-key-here
```

## Next Steps:
1. Test each emergency feature
2. Check console logs for API errors
3. Once working, integrate with the new 4-tab navigation
4. Add back advanced features one by one

The emergency fixes are designed to ALWAYS work, even if APIs fail!
