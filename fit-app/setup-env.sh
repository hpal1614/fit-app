#!/bin/bash

# Setup script for .env file
echo "🚀 Setting up environment variables for Fit App..."

# Create .env file
cat > .env << 'EOF'
# Supabase Configuration
VITE_SUPABASE_URL=https://puujzrqumtxvzbvhrtsr.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1dWp6cnF1bXR4dnpidmhydHNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyNzU4NzcsImV4cCI6MjA2ODg1MTg3N30._yrG1Pp-Oh3OPWaGRIHotr4d3SLFgOe4qd6r_tEXOiM

# AI API Keys
VITE_OPENROUTER_API_KEY=sk-or-v1-3de2b9e8...
VITE_GROQ_API_KEY=gsk_FsypkrCrt...
VITE_GOOGLE_AI_API_KEY=AIzaSyBcdJy...

# Feature Flags
VITE_ENABLE_VOICE_AI=true
VITE_ENABLE_WORKOUT_GENERATION=true
VITE_ENABLE_MULTI_PROVIDER=true

# Optional: Voice Synthesis (ElevenLabs)
# VITE_ELEVENLABS_API_KEY=your_elevenlabs_key_here

# Optional: LangChain (for advanced AI orchestration)
# VITE_LANGCHAIN_API_KEY=your_langchain_key_here
EOF

echo "✅ .env file created successfully!"
echo "📝 Please update the AI API keys with your actual values:"
echo "   - VITE_OPENROUTER_API_KEY"
echo "   - VITE_GROQ_API_KEY" 
echo "   - VITE_GOOGLE_AI_API_KEY"
echo ""
echo "🔧 Next steps:"
echo "1. Update the API keys in .env file"
echo "2. Run: npm run dev"
echo "3. Test the app at http://localhost:5178" 