import React from 'react';
import { 
  Activity, 
  Apple, 
  BarChart3, 
  Camera, 
  Mic, 
  Search, 
  // Settings, 
  Users,
  Dumbbell,
  Heart,
  Target,
  // Trophy
} from 'lucide-react';

interface HomePageProps {
  onNavigate: (view: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const features = [
    {
      title: 'Nutrition Tracker',
      description: 'Track your daily nutrition with our comprehensive food database',
      icon: Apple,
      color: 'bg-blue-500',
      view: 'nutrition'
    },
    {
      title: 'Workout Logger',
      description: 'Log your workouts and track your fitness progress',
      icon: Dumbbell,
      color: 'bg-green-500',
      view: 'workout'
    },
    {
      title: 'Health Analytics',
      description: 'View detailed analytics and insights about your health',
      icon: BarChart3,
      color: 'bg-purple-500',
      view: 'analytics'
    },
    {
      title: 'Barcode Scanner',
      description: 'Scan food barcodes for instant nutrition information',
      icon: Camera,
      color: 'bg-orange-500',
      view: 'scanner'
    },
    {
      title: 'Voice Commands',
      description: 'Use voice commands to log food and workouts',
      icon: Mic,
      color: 'bg-pink-500',
      view: 'voice'
    },
    {
      title: 'Social Features',
      description: 'Connect with friends and share your fitness journey',
      icon: Users,
      color: 'bg-indigo-500',
      view: 'social'
    }
  ];

  const stats = [
    { label: 'Foods in Database', value: '2M+', icon: Search },
    { label: 'API Sources', value: '5', icon: Activity },
    { label: 'Australian Products', value: '500K+', icon: Target },
    { label: 'Health Score', value: '95%', icon: Heart }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
              Fit App
            </h1>
            <p className="text-xl md:text-2xl text-white/80 mb-8 max-w-3xl mx-auto">
              Your comprehensive fitness and nutrition companion with AI-powered insights, 
              multi-source nutrition data, and Australian market optimization.
            </p>
            <div className="flex flex-wrap justify-center gap-4 mb-12">
              <button
                onClick={() => onNavigate('nutrition')}
                className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors flex items-center space-x-2"
              >
                <Apple className="w-6 h-6" />
                <span>Start Tracking Nutrition</span>
              </button>
              <button
                onClick={() => onNavigate('workout')}
                className="bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors flex items-center space-x-2"
              >
                <Dumbbell className="w-6 h-6" />
                <span>Log Workout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-white/5 backdrop-blur-lg border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="flex justify-center mb-4">
                  <stat.icon className="w-8 h-8 text-blue-400" />
                </div>
                <div className="text-3xl font-bold text-white mb-2">{stat.value}</div>
                <div className="text-white/60 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">
            Everything You Need for Your Fitness Journey
          </h2>
          <p className="text-xl text-white/60 max-w-2xl mx-auto">
            From nutrition tracking to workout logging, we've got you covered with 
            the most comprehensive fitness platform available.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              onClick={() => onNavigate(feature.view)}
              className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6 hover:bg-white/20 transition-all duration-300 cursor-pointer group"
            >
              <div className={`w-12 h-12 ${feature.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-white/60">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to Transform Your Health?
            </h2>
            <p className="text-xl text-white/90 mb-8">
              Join thousands of users who are already achieving their fitness goals with Fit App.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <button
                onClick={() => onNavigate('nutrition')}
                className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Get Started
              </button>
              <button
                onClick={() => onNavigate('test')}
                className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
              >
                Try Demo
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-black/20 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="flex justify-center space-x-6 mb-4">
              <button
                onClick={() => onNavigate('debug')}
                className="text-white/60 hover:text-white transition-colors"
              >
                Debug
              </button>
              <button
                onClick={() => onNavigate('test')}
                className="text-white/60 hover:text-white transition-colors"
              >
                API Test
              </button>
              <button
                onClick={() => onNavigate('comprehensive')}
                className="text-white/60 hover:text-white transition-colors"
              >
                Comprehensive Test
              </button>
            </div>
            <p className="text-white/40 text-sm">
              © 2024 Fit App. Powered by UltimateNutritionAPI with 5+ data sources.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
