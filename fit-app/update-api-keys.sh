#!/bin/bash

echo "🔑 API Key Update Helper"
echo "========================"
echo ""
echo "Please provide your actual API keys:"
echo ""

# Read OpenRouter API Key
echo -n "Enter your OpenRouter API Key (starts with sk-or-v1-): "
read openrouter_key

# Read Groq API Key
echo -n "Enter your Groq API Key (starts with gsk_): "
read groq_key

# Read Google AI API Key
echo -n "Enter your Google AI API Key (starts with AIzaSy): "
read google_key

# Update .env file
sed -i '' "s|VITE_OPENROUTER_API_KEY=sk-or-v1-3de2b9e8...|VITE_OPENROUTER_API_KEY=$openrouter_key|g" .env
sed -i '' "s|VITE_GROQ_API_KEY=gsk_FsypkrCrt...|VITE_GROQ_API_KEY=$groq_key|g" .env
sed -i '' "s|VITE_GOOGLE_AI_API_KEY=AIzaSyBcdJy...|VITE_GOOGLE_AI_API_KEY=$google_key|g" .env

echo ""
echo "✅ API keys updated successfully!"
echo "🚀 You can now run: npm run dev" 