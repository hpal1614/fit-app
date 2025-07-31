# API Setup Guide for Nimbus Fitness App

## Overview

The Nimbus Fitness App uses multiple AI providers and services to deliver a comprehensive fitness experience. This guide will help you configure all required API keys.

## Quick Setup

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Add your API keys to the `.env` file

3. Restart your development server

## API Providers

### 1. OpenRouter (Primary AI Provider)
- **Purpose**: Main AI chat and workout generation
- **Models**: Access to GPT-3.5, GPT-4, Claude, and more
- **Get Key**: https://openrouter.ai/keys
- **Variable**: `VITE_OPENROUTER_API_KEY`

### 2. Groq (Fast Inference)
- **Purpose**: Fast AI responses for real-time features
- **Models**: Mixtral, LLaMA 2
- **Get Key**: https://console.groq.com/keys
- **Variable**: `VITE_GROQ_API_KEY`

### 3. Google AI (Gemini)
- **Purpose**: Alternative AI provider, image analysis
- **Models**: Gemini Pro
- **Get Key**: https://makersuite.google.com/app/apikey
- **Variable**: `VITE_GOOGLE_AI_API_KEY`

### 4. ElevenLabs (Voice Synthesis)
- **Purpose**: High-quality voice synthesis for coach personalities
- **Get Key**: https://elevenlabs.io/api
- **Variable**: `VITE_ELEVENLABS_API_KEY`

### 5. Supabase (Database)
- **Purpose**: User data, workout history, preferences
- **Get Key**: https://supabase.com/dashboard
- **Variables**: 
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`

### 6. LangChain (Optional)
- **Purpose**: Advanced AI orchestration
- **Get Key**: https://smith.langchain.com/
- **Variable**: `VITE_LANGCHAIN_API_KEY`

## Feature Flags

Control which features are enabled:

```env
VITE_ENABLE_VOICE_AI=true          # Enable voice personalities
VITE_ENABLE_WORKOUT_GENERATION=true # Enable AI workout generation
VITE_ENABLE_MULTI_PROVIDER=true    # Enable fallback between providers
```

## Security Best Practices

1. **Never commit `.env` files** - They're in `.gitignore` for a reason
2. **Use environment-specific files**:
   - `.env.local` for local development
   - `.env.production` for production (set in hosting platform)
3. **Rotate keys regularly**
4. **Monitor usage** to detect any unusual activity

## Troubleshooting

### API Key Not Working?
1. Check for extra spaces or quotes in your `.env` file
2. Ensure the key starts with the correct prefix (e.g., `sk-` for OpenRouter)
3. Verify the key hasn't expired or been revoked

### Provider Fallback
The app automatically falls back through providers in this order:
1. OpenRouter → 2. Groq → 3. Google AI → 4. Local fallback

### Rate Limits
- OpenRouter: 60 requests/minute
- Groq: 30 requests/minute  
- Google AI: 60 requests/minute

## Cost Optimization

1. **Use Groq** for simple queries (it's fast and cheap)
2. **Use OpenRouter** for complex reasoning
3. **Enable caching** to reduce API calls
4. **Monitor usage** in each provider's dashboard

## Support

If you're having issues with API setup:
1. Check the browser console for error messages
2. Verify all required environment variables are set
3. Test each provider individually using their playground/console