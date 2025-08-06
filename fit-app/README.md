# 🏋️‍♂️ FIT APP - AI-Powered Fitness Companion

A modern, full-stack fitness application with AI coaching, workout planning, and cloud storage. Built with React, TypeScript, Supabase, and cutting-edge AI technologies.

![FIT APP](./public/vite.svg)

## ✨ Features

### 🧠 AI-Powered Coaching
- **Intelligent AI Chat** - Multi-provider AI system (OpenRouter, Groq, Google AI)
- **Voice Recognition** - Natural language workout logging
- **Smart Workout Generation** - AI creates personalized workout plans
- **PDF Workout Parser** - Upload and extract workout plans from PDFs

### 💪 Workout Management
- **Workout Planner** - Create, save, and manage workout templates
- **Day-wise Scheduling** - Organize workouts by day of the week
- **Exercise Library** - Comprehensive exercise database
- **Progress Tracking** - Log sets, reps, and track personal records

### 🔐 User System
- **Authentication** - Secure sign-up/sign-in with Supabase
- **Cloud Storage** - Workout data synced across devices
- **User Profiles** - Personalized fitness journey tracking
- **Data Backup** - Automatic local + cloud storage

### 📱 Modern UI/UX
- **Responsive Design** - Works perfectly on mobile and desktop
- **Dark Mode** - Beautiful dark theme
- **Glass Morphism** - Modern, elegant interface
- **Smooth Animations** - Framer Motion powered interactions

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Supabase account (free tier works great)
- AI API keys (optional for enhanced features)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/hpal1614/fit-app.git
cd fit-app
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
# Copy the setup script
chmod +x setup-env.sh
./setup-env.sh

# Or manually create .env file
cp .env.example .env
```

4. **Add your API keys to `.env`**
```env
# Supabase (Required for authentication and cloud storage)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# AI Providers (Optional - app works without them)
VITE_OPENROUTER_API_KEY=your_openrouter_key
VITE_GROQ_API_KEY=your_groq_key
VITE_GOOGLE_AI_API_KEY=your_google_ai_key
```

5. **Start the development server**
```bash
npm run dev
```

6. **Open your browser**
Navigate to `http://localhost:5173`

## 🗄️ Database Setup

### Supabase Setup (Recommended)

1. **Create a Supabase project**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Copy your project URL and anon key

2. **Set up the database schema**
   - Go to SQL Editor in your Supabase dashboard
   - Copy and run the content from `supabase-schema.sql`
   - This creates all necessary tables and security policies

3. **Test the connection**
   - Restart your dev server
   - Check browser console for "Supabase service initialized"
   - Try signing up for a new account

### Local Storage (Fallback)
The app automatically falls back to local storage if Supabase is not configured.

## 🏗️ Architecture

### Frontend Stack
- **React 18** - Modern React with hooks
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Smooth animations

### Backend Services
- **Supabase** - Database, authentication, real-time features
- **AI Providers** - OpenRouter, Groq, Google AI for intelligent features
- **Local Storage** - IndexedDB for offline functionality

### Key Components
```
src/
├── components/
│   ├── HomeDashboard.tsx      # Main app interface
│   ├── WorkoutPlanner.tsx     # Workout creation and management
│   ├── AuthModal.tsx          # User authentication
│   └── nimbus/               # Advanced UI components
├── services/
│   ├── supabaseService.ts    # Supabase integration
│   ├── hybridStorageService.ts # Smart storage management
│   ├── workoutStorageService.ts # Workout data management
│   └── aiService.ts          # AI provider management
└── hooks/
    ├── useAI.ts              # AI chat functionality
    ├── useWorkout.ts         # Workout state management
    └── useVoice.ts           # Voice recognition
```

## 🎯 Core Features

### 1. AI Workout Generation
- Generate personalized workout plans based on goals
- AI analyzes fitness level and equipment availability
- Creates progressive training programs

### 2. PDF Workout Import
- Upload workout PDFs from coaches or programs
- AI extracts exercises, sets, and reps
- Automatically creates weekly schedules

### 3. Workout Planning
- Create custom workout templates
- Schedule workouts by day of the week
- Track progress and personal records

### 4. User Authentication
- Secure sign-up and sign-in
- Cloud data synchronization
- User profile management

## 🔧 Development

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Environment Variables
```env
# Required for full functionality
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional AI features
VITE_OPENROUTER_API_KEY=your_openrouter_key
VITE_GROQ_API_KEY=your_groq_key
VITE_GOOGLE_AI_API_KEY=your_google_ai_key

# Feature flags
VITE_ENABLE_VOICE_AI=true
VITE_ENABLE_WORKOUT_GENERATION=true
VITE_ENABLE_MULTI_PROVIDER=true
```

### Code Structure
- **Components** - Reusable UI components
- **Services** - Business logic and API calls
- **Hooks** - Custom React hooks for state management
- **Types** - TypeScript type definitions
- **Constants** - App constants and configurations

## 🚢 Deployment

### Vercel (Recommended)
```bash
npm run build
npx vercel --prod
```

### Netlify
```bash
npm run build
npx netlify deploy --prod
```

### Manual Deployment
```bash
npm run build
# Upload dist/ folder to your hosting provider
```

## 🧪 Testing

### Manual Testing Checklist
- [ ] User registration and login
- [ ] Workout plan creation
- [ ] PDF upload and parsing
- [ ] AI chat functionality
- [ ] Data persistence across sessions
- [ ] Mobile responsiveness
- [ ] Dark mode toggle

### Automated Testing
```bash
npm run test        # Run unit tests
npm run test:e2e    # Run end-to-end tests
```

## 🔒 Security

- **Row Level Security (RLS)** - Users can only access their own data
- **Environment Variables** - Sensitive data not in code
- **Input Validation** - All user inputs validated
- **HTTPS Only** - Secure connections enforced

## 📊 Performance

- **Code Splitting** - Lazy loading for optimal performance
- **Image Optimization** - Optimized assets and lazy loading
- **Caching Strategy** - Intelligent caching for better UX
- **Bundle Size** - Optimized for fast loading

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Supabase** - Database and authentication
- **OpenAI/OpenRouter** - AI capabilities
- **Groq** - Fast AI inference
- **Google AI** - Alternative AI provider
- **React Team** - Amazing framework
- **Vite Team** - Fast build tool

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/hpal1614/fit-app/issues)
- **Documentation**: Check the `/docs` folder for detailed guides
- **Community**: Join our discussions

---

**Built with ❤️ for the fitness community**

*Your AI-powered fitness journey starts here! 🚀*
