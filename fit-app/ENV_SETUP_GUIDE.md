# 🔑 Environment Variables Setup Guide

## ✅ What's Already Done

Your `.env` file has been created with:
- ✅ **Supabase credentials** (your actual keys)
- ⚠️ **AI API keys** (placeholder values - need to update)

## 📝 Update Your API Keys

### Option 1: Manual Update (Recommended)

1. **Open the `.env` file** in your code editor
2. **Replace the placeholder values** with your actual API keys:

```env
# Supabase Configuration (✅ Already correct)
VITE_SUPABASE_URL=https://puujzrqumtxvzbvhrtsr.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1dWp6cnF1bXR4dnpidmhydHNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyNzU4NzcsImV4cCI6MjA2ODg1MTg3N30._yrG1Pp-Oh3OPWaGRIHotr4d3SLFgOe4qd6r_tEXOiM

# AI API Keys (⚠️ Update these with your actual keys)
VITE_OPENROUTER_API_KEY=sk-or-v1-3de2b9e8...  # Replace with your actual key
VITE_GROQ_API_KEY=gsk_FsypkrCrt...            # Replace with your actual key
VITE_GOOGLE_AI_API_KEY=AIzaSyBcdJy...         # Replace with your actual key

# Feature Flags (✅ Already correct)
VITE_ENABLE_VOICE_AI=true
VITE_ENABLE_WORKOUT_GENERATION=true
VITE_ENABLE_MULTI_PROVIDER=true
```

### Option 2: Use the Helper Script

```bash
# Run the helper script
chmod +x update-api-keys.sh
./update-api-keys.sh
```

## 🔑 Where to Get Your API Keys

### 1. OpenRouter API Key
- Go to [openrouter.ai/keys](https://openrouter.ai/keys)
- Create account or sign in
- Generate a new API key
- Copy the key (starts with `sk-or-v1-`)

### 2. Groq API Key
- Go to [console.groq.com/keys](https://console.groq.com/keys)
- Create account or sign in
- Generate a new API key
- Copy the key (starts with `gsk_`)

### 3. Google AI API Key
- Go to [makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)
- Create account or sign in
- Generate a new API key
- Copy the key (starts with `AIzaSy`)

## 🧪 Test Your Setup

### 1. Restart Development Server
```bash
npm run dev
```

### 2. Check Console Messages
Open browser console (F12) and look for:
```
Supabase service initialized
Hybrid storage: Using Supabase with user: [email]
```

### 3. Test AI Features
1. Go to AI Coach tab
2. Type "Hello" and send
3. You should get a response within 5 seconds

### 4. Test Authentication
1. Click "Sign In" button
2. Create a new account
3. Verify you can sign in/out

## 🚨 Troubleshooting

### Issue: "API key not working"
**Solution:**
1. Check the key format (correct prefix)
2. Verify the key is active
3. Check for extra spaces or quotes

### Issue: "Supabase not initialized"
**Solution:**
1. Verify `.env` file exists
2. Check Supabase credentials are correct
3. Restart development server

### Issue: "AI features not working"
**Solution:**
1. Update API keys with actual values
2. Check API key permissions
3. Verify internet connection

## ✅ Success Checklist

- [ ] `.env` file created
- [ ] Supabase credentials added
- [ ] AI API keys updated with actual values
- [ ] Development server restarted
- [ ] Console shows "Supabase service initialized"
- [ ] Can create user account
- [ ] AI features working
- [ ] Data persists after refresh

## 🎉 You're Ready!

Once all items are checked, your app will have:
- ✅ **User authentication** with Supabase
- ✅ **AI-powered features** with multiple providers
- ✅ **Data persistence** across devices
- ✅ **Fallback systems** for reliability

**Your fitness app is now production-ready!** 🚀 