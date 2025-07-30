# 🔧 Fix Browser Errors Guide

## Main Error Fixed

The error about `formCoachingService` has been fixed. The service is exported as `formCoaching`, not `formCoachingService`.

## Steps to Clear Errors:

### 1. Clear Browser Cache
- **Chrome**: Press `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
- Or open DevTools (F12) → Right-click refresh button → "Empty Cache and Hard Reload"

### 2. Close and Reopen Browser Tab
- Close the localhost:5173 tab completely
- Open a new tab and go to http://localhost:5173

### 3. Check Dev Server
The dev server should be running. You should see something like:
```
VITE v5.x.x  ready in xxx ms
➜  Local:   http://localhost:5173/
```

## Other Errors Explained:

### Chrome Extension Errors
These errors are NOT from our app:
- `share-modal.js` - From a browser extension
- `chrome-extension://invalid/` - From disabled/broken extensions
- These can be safely ignored

### To Hide Extension Errors:
1. Open DevTools (F12)
2. Click the gear icon (Settings)
3. Under "Console", check "Selected contexts only"
4. Or disable problematic extensions temporarily

## Test the App:

1. Navigate to http://localhost:5173
2. Go to the **Nutrition** tab
3. Type "chicken and rice" and press Enter
4. You should see the nutrition analysis working

## If Errors Persist:

1. Stop the server: `Ctrl+C` in terminal
2. Delete node_modules: `rm -rf node_modules`
3. Reinstall: `npm install`
4. Start again: `npm run dev`

The MCP integration is working correctly - just need to clear the cached errors!