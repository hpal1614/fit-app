# AI Fitness Coach 🏋️‍♂️🤖

A revolutionary AI-powered fitness application that combines cutting-edge technologies to deliver personalized coaching, real-time form analysis, and biometric-driven workout optimization.

![AI Fitness Coach](./docs/hero-image.png)

## 🌟 Features

### Core Capabilities

- **🧠 AI Personal Trainer**: Advanced conversational AI using OpenAI GPT-4 with RAG architecture
- **🎙️ Voice Coaching**: Real-time voice synthesis with ElevenLabs and speech recognition
- **📹 Form Analysis**: Computer vision-based exercise form tracking using MediaPipe
- **⌚ Wearable Integration**: Biometric data from Apple Watch, Garmin, Fitbit via Terra API
- **📱 Progressive Web App**: Offline support, installable, mobile-optimized
- **📊 Performance Monitoring**: LangSmith integration, circuit breakers, health checks

### Technical Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Framer Motion
- **AI/ML**: OpenAI GPT-4, LangChain, RAG with Pinecone, MediaPipe
- **Voice**: ElevenLabs API, Web Speech API, WebRTC
- **Biometrics**: Terra API for wearable devices
- **Monitoring**: LangSmith, Sentry, Prometheus metrics
- **Infrastructure**: PWA, Service Workers, Circuit Breakers

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- API keys for:
  - OpenAI (GPT-4 access)
  - ElevenLabs (voice synthesis)
  - Terra (wearable integration)
  - Pinecone (vector database)
  - LangSmith (optional, for monitoring)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/ai-fitness-coach.git
cd ai-fitness-coach/fit-app
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your API keys
```

4. Start the development server:
```bash
npm start
```

The app will be available at `http://localhost:3000`

### Environment Variables

Create a `.env` file in the root directory:

```env
# AI Services
REACT_APP_OPENAI_API_KEY=your_openai_api_key
REACT_APP_PINECONE_API_KEY=your_pinecone_api_key
REACT_APP_PINECONE_ENVIRONMENT=your_pinecone_environment
REACT_APP_PINECONE_INDEX=fitness-knowledge

# Voice Services
REACT_APP_ELEVENLABS_API_KEY=your_elevenlabs_api_key
REACT_APP_ELEVENLABS_VOICE_ID=your_voice_id

# Wearable Integration
REACT_APP_TERRA_API_KEY=your_terra_api_key
REACT_APP_TERRA_DEV_ID=your_terra_dev_id

# Monitoring (Optional)
REACT_APP_LANGSMITH_API_KEY=your_langsmith_api_key
REACT_APP_SENTRY_DSN=your_sentry_dsn
```

## 📱 Progressive Web App

The app is a fully-featured PWA with:

- **Offline Support**: Service worker caching for offline functionality
- **Installable**: Add to home screen on mobile and desktop
- **Push Notifications**: Workout reminders and achievement notifications
- **Background Sync**: Sync workout data when connection is restored

### Installing the PWA

1. **Mobile**: Tap the "Install" banner or use browser's "Add to Home Screen"
2. **Desktop**: Click install icon in address bar or use browser menu

## 🏃‍♂️ Usage Guide

### 1. AI Coach Chat
- Natural conversation with your AI fitness coach
- Ask about exercises, nutrition, recovery
- Get personalized workout recommendations
- Voice input/output for hands-free interaction

### 2. Form Analysis
- Position your device to capture full body
- Select exercise and start recording
- Receive real-time form corrections
- Review detailed analysis and tips

### 3. Workout Tracking
- Pre-built workout programs
- Custom workout creation
- Real-time set/rep logging
- Voice-controlled logging
- Rest timer with notifications

### 4. Biometric Integration
- Connect Apple Watch, Garmin, Fitbit, etc.
- Real-time heart rate monitoring
- Recovery score calculation
- Workout intensity adaptation
- Sleep quality analysis

## 🔧 Architecture

### Services Architecture

```
src/services/
├── AI & Knowledge
│   ├── aiService.ts           # Core AI service with OpenAI
│   ├── ragService.ts          # RAG implementation with Pinecone
│   ├── enhancedAIService.ts   # Advanced AI features
│   └── productionAIService.ts # Production-ready AI with monitoring
│
├── Voice & Audio
│   ├── voiceService.ts        # Voice synthesis and recognition
│   └── voiceCommandService.ts # Voice command processing
│
├── Computer Vision
│   ├── poseDetectionService.ts # MediaPipe pose detection
│   └── formAnalysisService.ts  # Exercise form analysis
│
├── Biometrics
│   ├── terraService.ts         # Terra API integration
│   └── biometricAnalysisService.ts # Biometric insights
│
├── Performance & Monitoring
│   ├── monitoringService.ts    # LangSmith & metrics
│   ├── circuitBreakerService.ts # Fault tolerance
│   ├── rateLimiterService.ts   # API rate limiting
│   └── healthCheckService.ts   # System health monitoring
│
└── Mobile & PWA
    ├── mobileOptimizationService.ts # Touch gestures & mobile features
    ├── pwaService.ts               # PWA & service workers
    └── performanceOptimizationService.ts # Performance optimization
```

### Component Structure

```
src/components/
├── Core UI
│   ├── AIChatInterface.tsx     # AI chat UI
│   ├── WorkoutDashboard.tsx    # Main workout interface
│   ├── VoiceCoachInterface.tsx # Voice coaching UI
│   └── BottomNavigation.tsx    # Mobile navigation
│
├── Analysis
│   ├── FormAnalysisInterface.tsx # Form analysis UI
│   └── BiometricsDashboard.tsx   # Biometric monitoring
│
├── Mobile
│   └── MobileWorkoutInterface.tsx # Mobile-optimized workout
│
└── Monitoring
    └── MonitoringDashboard.tsx    # System monitoring UI
```

## 🧪 Testing

Run the test suite:

```bash
# Unit tests
npm test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Performance tests
npm run test:performance
```

## 📊 Performance

### Optimization Features

- **Code Splitting**: Lazy loading for all major components
- **Resource Hints**: Preconnect, prefetch, preload for critical resources
- **Image Optimization**: Lazy loading, WebP format, responsive images
- **Caching Strategy**: Service worker with cache-first/network-first strategies
- **Bundle Size**: < 300KB initial bundle

### Performance Metrics

- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3s
- **Lighthouse Score**: 95+
- **Core Web Vitals**: All green

## 🚢 Deployment

### Build for Production

```bash
npm run build
```

### Deploy to Vercel

```bash
vercel --prod
```

### Deploy to AWS

```bash
# Build and upload to S3
npm run build
aws s3 sync build/ s3://your-bucket-name

# Invalidate CloudFront
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

## 🔒 Security

- API keys stored in environment variables
- Rate limiting on all API endpoints
- Circuit breakers for external services
- Content Security Policy headers
- HTTPS enforced

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- OpenAI for GPT-4 API
- ElevenLabs for voice synthesis
- Google for MediaPipe
- Terra for wearable integration
- LangChain for RAG architecture

## 📞 Support

- **Documentation**: [docs.aifitnesscoach.com](https://docs.aifitnesscoach.com)
- **Issues**: [GitHub Issues](https://github.com/yourusername/ai-fitness-coach/issues)
- **Email**: support@aifitnesscoach.com

---

Built with ❤️ by the AI Fitness Coach Team
