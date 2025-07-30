# 🔑 AI Fitness Coach - API Key Setup Guide

## ⚠️ Current Status: API Keys Invalid

All three AI service API keys are currently invalid or misconfigured. Follow this guide to get your AI chat working.

## 📋 Required API Keys

You need at least ONE of these (all three recommended for best reliability):

### 1. OpenRouter API Key
**Best for:** High-quality responses with Claude 3.5
**Cost:** Pay-per-use, very affordable (~$0.01 per conversation)

**Steps:**
1. Go to https://openrouter.ai
2. Click "Sign Up" (you can use Google/GitHub)
3. Go to https://openrouter.ai/keys
4. Click "Create Key"
5. Add $5 credit (lasts for thousands of messages)
6. Copy your key starting with `sk-or-v1-`

### 2. Groq API Key
**Best for:** Super fast responses
**Cost:** FREE (with rate limits)

**Steps:**
1. Go to https://console.groq.com
2. Sign up for free account
3. Go to API Keys section
4. Create a new API key
5. Copy your key starting with `gsk_`

### 3. Google AI (Gemini) API Key
**Best for:** Free tier available
**Cost:** FREE (with limits)

**Steps:**
1. Go to https://makersuite.google.com/app/apikey
2. Sign in with Google account
3. Click "Create API Key"
4. Select or create a project
5. Copy your key starting with `AIza`

## 🔧 Setup Instructions

1. **Update your .env file:**
```bash
# In fit-app directory
nano .env
```

2. **Replace the invalid keys with your new ones:**
```env
# Core AI APIs
VITE_OPENROUTER_API_KEY=your-new-openrouter-key-here
VITE_GROQ_API_KEY=your-new-groq-key-here
VITE_GOOGLE_AI_API_KEY=your-new-google-ai-key-here
```

3. **Restart the development server:**
```bash
# Stop the server (Ctrl+C) then:
npm run dev
```

## ✅ Testing Your Setup

Run the test script to verify:
```bash
node test-ai-api.js
```

You should see:
- ✅ OpenRouter API working!
- ✅ Groq API working!
- ✅ Google AI API working!

## 🚀 Quick Fix Priority

If you want to get started quickly:
1. **Groq** is the fastest to set up (completely free)
2. **Google AI** is also free but may have stricter rate limits
3. **OpenRouter** gives the best quality but requires payment

## 💡 Troubleshooting

**"Invalid API Key" errors:**
- Make sure you copied the ENTIRE key
- Check for extra spaces or line breaks
- Ensure the key starts with the correct prefix

**"Unauthorized" errors:**
- OpenRouter: Add credit to your account
- Groq: Wait if you hit rate limits
- Google: Enable the Gemini API in your project

**Still not working?**
- Clear browser cache
- Check browser console for errors
- Make sure .env file is in the fit-app directory
- Restart the dev server after changing .env

## 🎯 Next Steps

Once your API keys are working:
1. Test the AI chat in the app
2. Try different prompts
3. The system will automatically failover between providers
4. Monitor which provider gives best results for your needs

Need help? The fallback responses will still provide basic fitness guidance while you set up the APIs!