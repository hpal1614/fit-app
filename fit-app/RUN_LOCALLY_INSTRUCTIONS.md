# Running the AI Fitness Coach App Locally

## Quick Start (From this Remote Environment)

If you're seeing port conflicts or old code running on port 5173, follow these steps:

1. **Kill all existing processes:**
```bash
pkill -f "npm run dev" || true
pkill -f vite || true
```

2. **Clear Vite cache and restart:**
```bash
rm -rf node_modules/.vite
npm run dev
```

## Download and Run Locally on Your Mac

### Method 1: Direct Download (Recommended)

1. **From this remote environment, create a downloadable archive:**
```bash
cd /workspace
tar -czf fit-app-complete.tar.gz fit-app/ --exclude='node_modules' --exclude='dist' --exclude='.git'
```

2. **Download the archive to your local machine**
   - The file will be available at: `/workspace/fit-app-complete.tar.gz`
   - Download it using your remote environment's file transfer method

3. **On your local Mac, extract and set up:**
```bash
# Navigate to where you want the project
cd ~/

# Extract the archive
tar -xzf fit-app-complete.tar.gz

# Enter the directory
cd fit-app

# Install dependencies
npm install

# Start the development server
npm run dev
```

### Method 2: Git Clone (If repository is accessible)

```bash
# Clone the repository
git clone [your-repository-url] ~/fit-app

# Enter the directory
cd ~/fit-app

# Install dependencies
npm install

# Start the development server
npm run dev
```

## Fixing Common Issues

### Port 5173 Already in Use

If port 5173 is showing old code or is stuck:

1. **On Mac, find and kill the process:**
```bash
# Find process on port 5173
lsof -ti:5173

# Kill it (replace PID with the number from above)
kill -9 [PID]

# Or do it in one command
lsof -ti:5173 | xargs kill -9
```

2. **Use a different port:**
```bash
# Run on port 3000 instead
npm run dev -- --port 3000
```

### Clear All Caches

```bash
# Clear Vite cache
rm -rf node_modules/.vite

# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Environment Variables

Make sure you have a `.env` file with your API keys:

```bash
# Create .env file
cp .env.example .env

# Edit it with your API keys
nano .env  # or use your preferred editor
```

Required API keys:
- VITE_OPENROUTER_API_KEY
- VITE_GROQ_API_KEY
- VITE_GOOGLE_AI_API_KEY
- VITE_OPENAI_API_KEY
- VITE_ELEVENLABS_API_KEY
- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY
- VITE_PINECONE_API_KEY
- VITE_PINECONE_ENVIRONMENT
- VITE_PINECONE_INDEX_NAME
- VITE_LANGSMITH_API_KEY

## Running with Different Configurations

### Development Mode (default)
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm run preview
```

### With Custom Port
```bash
npm run dev -- --port 3000
```

### With Host Access (for mobile testing)
```bash
npm run dev -- --host
```

## Troubleshooting Checklist

1. ✅ Correct directory: `cd ~/fit-app` (or wherever you extracted)
2. ✅ Dependencies installed: `npm install`
3. ✅ Environment variables: `.env` file exists with API keys
4. ✅ Port available: No other process on 5173
5. ✅ Node version: 18+ (`node --version`)
6. ✅ Clean state: No cache issues

## Still Having Issues?

1. **Complete Reset:**
```bash
# From the fit-app directory
rm -rf node_modules package-lock.json .vite dist
npm cache clean --force
npm install
npm run dev
```

2. **Check for errors:**
```bash
# Run type checking
npm run typecheck

# Run linting
npm run lint
```

3. **Use verbose logging:**
```bash
# Run with debug info
DEBUG=vite:* npm run dev
```

## Contact Support

If you're still experiencing issues, please provide:
- The exact error message
- Output of `npm --version` and `node --version`
- Contents of any error logs
- Which step in the process failed