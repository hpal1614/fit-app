import React, { useState } from 'react';
import { 
  Upload, 
  Brain, 
  Target, 
  Calendar, 
  Play, 
  FileText, 
  Zap, 
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Clock,
  Dumbbell,
  Users,
  Star,
  Download,
  Share2,
  Edit,
  Trash2,
  Plus,
  Search,
  Filter,
  Grid,
  List
} from 'lucide-react';
import { WorkoutGenerator } from './WorkoutGenerator';
import { NimbusPDFUploader } from './nimbus/pdf/NimbusPDFUploader';
import { NimbusWorkoutGenerator } from '../nimbus/components/NimbusWorkoutGenerator';
import { workoutStorageService, StoredWorkoutTemplate } from '../services/workoutStorageService';

interface WorkoutTemplate {
  id: string;
  name: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // weeks
  category: 'strength' | 'cardio' | 'flexibility' | 'full-body' | 'sports';
  goals: string[];
  equipment: string[];
  daysPerWeek: number;
  estimatedTime: number; // minutes per session
  rating: number;
  downloads: number;
  isCustom?: boolean;
  isAI?: boolean;
  schedule?: {
    day: string;
    name: string;
    exercises: number;
  }[];
}

interface WorkoutPlannerProps {
  onStartWorkout: (template: WorkoutTemplate) => void;
  onBack: () => void;
}

export const WorkoutPlanner: React.FC<WorkoutPlannerProps> = ({ 
  onStartWorkout, 
  onBack 
}) => {
  const [currentView, setCurrentView] = useState<'main' | 'upload' | 'generate' | 'templates' | 'template-detail'>('main');
  const [selectedTemplate, setSelectedTemplate] = useState<WorkoutTemplate | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Mock pre-built templates
  const preBuiltTemplates: WorkoutTemplate[] = [
    {
      id: 'strength-beginner',
      name: 'Beginner Strength Builder',
      description: 'Perfect for those new to strength training. Build foundational strength with compound movements.',
      difficulty: 'beginner',
      duration: 8,
      category: 'strength',
      goals: ['strength', 'muscle'],
      equipment: ['dumbbells', 'barbell', 'bench'],
      daysPerWeek: 3,
      estimatedTime: 45,
      rating: 4.8,
      downloads: 1250,
      schedule: [
        { day: 'Monday', name: 'Upper Body', exercises: 6 },
        { day: 'Wednesday', name: 'Lower Body', exercises: 5 },
        { day: 'Friday', name: 'Full Body', exercises: 7 }
      ]
    },
    {
      id: 'cardio-intermediate',
      name: 'Cardio Blast',
      description: 'High-intensity cardio workouts to boost endurance and burn calories.',
      difficulty: 'intermediate',
      duration: 6,
      category: 'cardio',
      goals: ['endurance', 'weight-loss'],
      equipment: ['bodyweight', 'treadmill', 'bike'],
      daysPerWeek: 4,
      estimatedTime: 30,
      rating: 4.6,
      downloads: 890,
      schedule: [
        { day: 'Monday', name: 'HIIT', exercises: 8 },
        { day: 'Tuesday', name: 'Steady State', exercises: 1 },
        { day: 'Thursday', name: 'Tabata', exercises: 6 },
        { day: 'Saturday', name: 'Long Distance', exercises: 1 }
      ]
    },
    {
      id: 'full-body-advanced',
      name: 'Advanced Full Body',
      description: 'Comprehensive full-body workouts for experienced lifters. Maximum efficiency and results.',
      difficulty: 'advanced',
      duration: 12,
      category: 'full-body',
      goals: ['strength', 'muscle', 'athletic'],
      equipment: ['barbell', 'dumbbells', 'kettlebells', 'cable'],
      daysPerWeek: 4,
      estimatedTime: 75,
      rating: 4.9,
      downloads: 2100,
      schedule: [
        { day: 'Monday', name: 'Push', exercises: 8 },
        { day: 'Tuesday', name: 'Pull', exercises: 8 },
        { day: 'Thursday', name: 'Legs', exercises: 7 },
        { day: 'Saturday', name: 'Full Body', exercises: 10 }
      ]
    },
    {
      id: 'flexibility-beginner',
      name: 'Flexibility & Mobility',
      description: 'Improve flexibility and joint mobility with stretching and yoga-based movements.',
      difficulty: 'beginner',
      duration: 4,
      category: 'flexibility',
      goals: ['flexibility', 'recovery'],
      equipment: ['bodyweight', 'yoga-mat'],
      daysPerWeek: 5,
      estimatedTime: 20,
      rating: 4.7,
      downloads: 650,
      schedule: [
        { day: 'Monday', name: 'Upper Body Stretch', exercises: 8 },
        { day: 'Tuesday', name: 'Lower Body Stretch', exercises: 8 },
        { day: 'Wednesday', name: 'Core & Balance', exercises: 6 },
        { day: 'Friday', name: 'Full Body Flow', exercises: 10 },
        { day: 'Sunday', name: 'Recovery', exercises: 5 }
      ]
    }
  ];

  const filteredTemplates = preBuiltTemplates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDifficulty = filterDifficulty === 'all' || template.difficulty === filterDifficulty;
    const matchesCategory = filterCategory === 'all' || template.category === filterCategory;
    
    return matchesSearch && matchesDifficulty && matchesCategory;
  });

  const handlePDFUpload = async (workout: any) => {
    // This would integrate with the PDF uploader service
    console.log('Processing PDF workout:', workout);
    
    // Validate that we have actual parsed data
    if (!workout || !workout.schedule || workout.schedule.length === 0) {
      console.error('❌ No valid workout data parsed from PDF');
      alert('Could not extract workout data from PDF. Please ensure the PDF contains clear workout information.');
      return;
    }
    
    // Create a custom template from the parsed PDF data ONLY
    const customTemplate: StoredWorkoutTemplate = {
      id: `custom-${Date.now()}`,
      name: workout.name || 'Uploaded PDF Workout',
      description: workout.description || 'AI-processed workout plan from your uploaded PDF.',
      difficulty: workout.difficulty || 'intermediate',
      duration: workout.duration || 8,
      category: workout.category || 'full-body',
      goals: workout.goals || ['strength', 'muscle'],
      equipment: workout.equipment || ['dumbbells', 'barbell'],
      daysPerWeek: workout.daysPerWeek || 4,
      estimatedTime: workout.estimatedTime || 60,
      rating: workout.rating || 0,
      downloads: workout.downloads || 0,
      isCustom: true,
      createdAt: new Date(),
      schedule: workout.schedule // Use ONLY the parsed schedule, no fallback
    };
    
    // Save template to storage
    await workoutStorageService.saveWorkoutTemplate(customTemplate);
    setSelectedTemplate(customTemplate);
    setCurrentView('template-detail');
  };

  const handleAIGeneration = async (config: any) => {
    // This would integrate with the AI workout generator
    console.log('Generating AI workout:', config);
    // Simulate AI generation
    setTimeout(async () => {
      const aiTemplate: StoredWorkoutTemplate = {
        id: `ai-${Date.now()}`,
        name: `AI Generated - ${config.goals.join(', ')}`,
        description: 'Personalized workout plan generated by AI based on your goals and preferences.',
        difficulty: config.experienceLevel,
        duration: 8,
        category: 'full-body',
        goals: config.goals,
        equipment: config.equipment,
        daysPerWeek: config.daysPerWeek,
        estimatedTime: config.sessionDuration,
        rating: 0,
        downloads: 0,
        isAI: true,
        createdAt: new Date(),
        schedule: [
          { 
            day: 'Monday', 
            name: 'Day 1', 
            exercises: [
              { id: '1', name: 'Squats', sets: 4, reps: '8-12', restTime: 120, notes: 'Barbell or dumbbell squats' },
              { id: '2', name: 'Bench Press', sets: 4, reps: '8-12', restTime: 120, notes: 'Focus on form' },
              { id: '3', name: 'Rows', sets: 3, reps: '10-12', restTime: 90, notes: 'Bent-over rows' },
              { id: '4', name: 'Overhead Press', sets: 3, reps: '8-10', restTime: 90, notes: 'Military press' },
              { id: '5', name: 'Deadlifts', sets: 3, reps: '6-8', restTime: 180, notes: 'Romanian deadlifts' },
              { id: '6', name: 'Plank', sets: 3, reps: '45-60s', restTime: 60, notes: 'Core stability' }
            ]
          },
          { 
            day: 'Wednesday', 
            name: 'Day 2', 
            exercises: [
              { id: '7', name: 'Lunges', sets: 3, reps: '10 each leg', restTime: 90, notes: 'Walking lunges' },
              { id: '8', name: 'Pull-ups', sets: 3, reps: '6-10', restTime: 120, notes: 'Assisted if needed' },
              { id: '9', name: 'Dips', sets: 3, reps: '8-12', restTime: 90, notes: 'Tricep dips' },
              { id: '10', name: 'Calf Raises', sets: 4, reps: '15-20', restTime: 60, notes: 'Standing raises' },
              { id: '11', name: 'Russian Twists', sets: 3, reps: '20 each side', restTime: 60, notes: 'Core rotation' }
            ]
          },
          { 
            day: 'Friday', 
            name: 'Day 3', 
            exercises: [
              { id: '12', name: 'Leg Press', sets: 4, reps: '10-15', restTime: 120, notes: 'Machine or bodyweight' },
              { id: '13', name: 'Incline Press', sets: 3, reps: '8-12', restTime: 120, notes: 'Dumbbell incline' },
              { id: '14', name: 'Lat Pulldowns', sets: 3, reps: '10-12', restTime: 90, notes: 'Wide grip' },
              { id: '15', name: 'Lateral Raises', sets: 3, reps: '12-15', restTime: 60, notes: 'Side deltoids' },
              { id: '16', name: 'Bicep Curls', sets: 3, reps: '12-15', restTime: 60, notes: 'Dumbbell curls' },
              { id: '17', name: 'Tricep Extensions', sets: 3, reps: '12-15', restTime: 60, notes: 'Overhead extensions' },
              { id: '18', name: 'Mountain Climbers', sets: 3, reps: '30', restTime: 60, notes: 'Cardio finisher' }
            ]
          }
        ]
      };
      
      // Save template to storage
      await workoutStorageService.saveWorkoutTemplate(aiTemplate);
      setSelectedTemplate(aiTemplate);
      setCurrentView('template-detail');
    }, 3000);
  };

  const renderMainView = () => (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button 
          onClick={onBack}
          className="flex items-center space-x-2 text-white/80 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
        <h1 className="text-3xl font-bold text-white">Workout Planner</h1>
        <div className="w-20"></div> {/* Spacer for centering */}
      </div>

      {/* Three Options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Option 1: Upload PDF */}
        <div 
          className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:bg-blue-500/30 transition-all duration-200 cursor-pointer"
          onClick={() => setCurrentView('upload')}
        >
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto">
              <Upload className="w-8 h-8 text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold text-white">Upload PDF</h3>
            <p className="text-white/70 text-sm">
              Have a workout plan from your coach or trainer? Upload it and we'll create a template for you.
            </p>
            <div className="flex items-center justify-center space-x-2 text-blue-400 text-sm">
              <span>AI Processing</span>
              <Zap className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Option 2: AI Generation */}
        <div 
          className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:bg-purple-500/30 transition-all duration-200 cursor-pointer"
          onClick={() => setCurrentView('generate')}
        >
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto">
              <Brain className="w-8 h-8 text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold text-white">AI Generate</h3>
            <p className="text-white/70 text-sm">
              Let our AI create a personalized workout plan based on your goals and preferences.
            </p>
            <div className="flex items-center justify-center space-x-2 text-purple-400 text-sm">
              <span>Personalized</span>
              <Target className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Option 3: Pre-built Templates */}
        <div 
          className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:bg-green-500/30 transition-all duration-200 cursor-pointer"
          onClick={() => setCurrentView('templates')}
        >
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
              <FileText className="w-8 h-8 text-green-400" />
            </div>
            <h3 className="text-xl font-semibold text-white">Pre-built Templates</h3>
            <p className="text-white/70 text-sm">
              Choose from our curated collection of proven workout plans for different goals.
            </p>
            <div className="flex items-center justify-center space-x-2 text-green-400 text-sm">
              <span>Proven Plans</span>
              <Star className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Start */}
      <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 backdrop-blur-lg rounded-xl p-6 border border-white/20">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-white">Quick Start</h3>
            <p className="text-white/70">Start with a popular template or create your own</p>
          </div>
          <button
            onClick={() => setCurrentView('templates')}
            className="bg-gradient-to-r from-orange-600 to-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-orange-700 hover:to-red-700 transition-all duration-200 flex items-center space-x-2"
          >
            <Play className="w-5 h-5" />
            <span>Browse Templates</span>
          </button>
        </div>
      </div>
    </div>
  );

  const renderUploadView = () => (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <button 
          onClick={() => setCurrentView('main')}
          className="flex items-center space-x-2 text-white/80 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Planner</span>
        </button>
        <h2 className="text-2xl font-bold text-white">Upload Workout PDF</h2>
        <div className="w-32"></div>
      </div>

      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20">
        <NimbusPDFUploader 
          onWorkoutParsed={handlePDFUpload}
          onError={(error) => console.error('PDF upload error:', error)}
        />
      </div>
    </div>
  );

  const renderGenerateView = () => (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <button 
          onClick={() => setCurrentView('main')}
          className="flex items-center space-x-2 text-white/80 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Planner</span>
        </button>
        <h2 className="text-2xl font-bold text-white">AI Workout Generator</h2>
        <div className="w-32"></div>
      </div>

      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20">
        <NimbusWorkoutGenerator 
          onGenerate={handleAIGeneration}
          onBack={() => setCurrentView('main')}
        />
      </div>
    </div>
  );

  const renderTemplatesView = () => (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <button 
          onClick={() => setCurrentView('main')}
          className="flex items-center space-x-2 text-white/80 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Planner</span>
        </button>
        <h2 className="text-2xl font-bold text-white">Workout Templates</h2>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-white/20' : 'bg-white/10'}`}
          >
            <Grid className="w-5 h-5 text-white" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-white/20' : 'bg-white/10'}`}
          >
            <List className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/60" />
          <input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white/10 backdrop-blur-lg rounded-lg border border-white/20 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={filterDifficulty}
          onChange={(e) => setFilterDifficulty(e.target.value)}
          className="px-4 py-3 bg-white/10 backdrop-blur-lg rounded-lg border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Difficulties</option>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-4 py-3 bg-white/10 backdrop-blur-lg rounded-lg border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Categories</option>
          <option value="strength">Strength</option>
          <option value="cardio">Cardio</option>
          <option value="flexibility">Flexibility</option>
          <option value="full-body">Full Body</option>
          <option value="sports">Sports</option>
        </select>
      </div>

      {/* Templates Grid/List */}
      <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
        {filteredTemplates.map((template) => (
          <div
            key={template.id}
            className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-200 cursor-pointer"
            onClick={() => {
              setSelectedTemplate(template);
              setCurrentView('template-detail');
            }}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">{template.name}</h3>
                <p className="text-white/70 text-sm mb-2">{template.description}</p>
              </div>
              {template.isCustom && (
                <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full text-xs">Custom</span>
              )}
              {template.isAI && (
                <span className="bg-purple-500/20 text-purple-400 px-2 py-1 rounded-full text-xs">AI</span>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/60">Difficulty:</span>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  template.difficulty === 'beginner' ? 'bg-green-500/20 text-green-400' :
                  template.difficulty === 'intermediate' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-red-500/20 text-red-400'
                }`}>
                  {template.difficulty}
                </span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/60">Duration:</span>
                <span className="text-white">{template.duration} weeks</span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/60">Time per session:</span>
                <span className="text-white">{template.estimatedTime} min</span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/60">Days per week:</span>
                <span className="text-white">{template.daysPerWeek}</span>
              </div>
            </div>

            <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/20">
              <div className="flex items-center space-x-2">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <span className="text-white text-sm">{template.rating}</span>
                <span className="text-white/60 text-sm">({template.downloads})</span>
              </div>
              <ArrowRight className="w-4 h-4 text-white/60" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderTemplateDetail = () => {
    if (!selectedTemplate) return null;

    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => setCurrentView('templates')}
            className="flex items-center space-x-2 text-white/80 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Templates</span>
          </button>
          <h2 className="text-2xl font-bold text-white">{selectedTemplate.name}</h2>
          <div className="flex items-center space-x-2">
            <button className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
              <Share2 className="w-5 h-5 text-white" />
            </button>
            <button className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
              <Download className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Plan Overview</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-white/60">Description:</span>
                  <span className="text-white text-right">{selectedTemplate.description}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Difficulty:</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    selectedTemplate.difficulty === 'beginner' ? 'bg-green-500/20 text-green-400' :
                    selectedTemplate.difficulty === 'intermediate' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {selectedTemplate.difficulty}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Duration:</span>
                  <span className="text-white">{selectedTemplate.duration} weeks</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Sessions per week:</span>
                  <span className="text-white">{selectedTemplate.daysPerWeek}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Time per session:</span>
                  <span className="text-white">{selectedTemplate.estimatedTime} minutes</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Goals & Equipment</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-white/60 text-sm">Goals:</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedTemplate.goals.map((goal) => (
                      <span key={goal} className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full text-xs">
                        {goal}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-white/60 text-sm">Equipment needed:</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedTemplate.equipment.map((item) => (
                      <span key={item} className="bg-green-500/20 text-green-400 px-2 py-1 rounded-full text-xs">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Weekly Schedule */}
        {selectedTemplate.schedule && (
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <h3 className="text-lg font-semibold text-white mb-4">Weekly Schedule</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {selectedTemplate.schedule.map((day) => (
                <div key={day.day} className="bg-white/5 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-white">{day.day}</h4>
                    <span className="text-white/60 text-sm">{Array.isArray(day.exercises) ? day.exercises.length : day.exercises} exercises</span>
                  </div>
                  <p className="text-white/70 text-sm mb-3">{day.name}</p>
                  
                  {/* Show exercises if they exist */}
                  {Array.isArray(day.exercises) && day.exercises.length > 0 && (
                    <div className="space-y-2">
                      {day.exercises.slice(0, 3).map((exercise, index) => (
                        <div key={index} className="text-white/80 text-sm">
                          • {exercise.name} - {exercise.sets}×{exercise.reps}
                        </div>
                      ))}
                      {day.exercises.length > 3 && (
                        <div className="text-white/60 text-xs">
                          +{day.exercises.length - 3} more exercises
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
                  <button
          onClick={async () => {
            if (selectedTemplate) {
              await workoutStorageService.activateWorkoutTemplate(selectedTemplate.id);
              onStartWorkout(selectedTemplate);
            }
          }}
          className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 px-6 rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition-all duration-200 flex items-center justify-center space-x-2"
        >
          <Play className="w-5 h-5" />
          <span>Start This Plan</span>
        </button>
          <button className="flex-1 bg-white/10 text-white py-4 px-6 rounded-lg font-semibold hover:bg-white/20 transition-all duration-200 flex items-center justify-center space-x-2">
            <Edit className="w-5 h-5" />
            <span>Customize Plan</span>
          </button>
        </div>
      </div>
    );
  };

  // Render based on current view
  switch (currentView) {
    case 'upload':
      return renderUploadView();
    case 'generate':
      return renderGenerateView();
    case 'templates':
      return renderTemplatesView();
    case 'template-detail':
      return renderTemplateDetail();
    default:
      return renderMainView();
  }
}; 