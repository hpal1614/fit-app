#!/bin/bash

echo "🚀 AI Fitness Coach - Quick Start"
echo "================================"

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env and add your API keys!"
    echo ""
fi

# Install dependencies if needed
if [ ! -d node_modules ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "To start the app:"
echo "  npm run dev"
echo ""
echo "Then open: http://localhost:5173"
echo ""
echo "Available commands:"
echo "  npm run dev    - Start development server"
echo "  npm run build  - Build for production"
echo "  npm run lint   - Run ESLint"
echo ""
echo "Voice commands to try:"
echo "  'Start workout'"
echo "  'Log set 10 reps 135 pounds'"
echo "  'Next exercise'"
echo "  'What should I eat after workout?'"
echo ""
echo "Enjoy your AI-powered fitness journey! 💪"