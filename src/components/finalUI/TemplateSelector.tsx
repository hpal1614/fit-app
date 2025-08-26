import React, { useState, useEffect } from 'react';
import type { WorkoutTemplate } from '../../types/workout';
import Card, { CardHeader, CardContent } from './Card';
import { SearchIcon, StarIcon, ClockIcon, DumbbellIcon, UploadIcon, SparklesIcon, CalendarIcon } from './Icons';
import { PDFWorkoutUploader } from '../workout/PDFWorkoutUploader';
import { getWorkoutService } from '../../services/workoutService';


interface TemplateSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: WorkoutTemplate) => void;
  getWorkoutTemplates: () => Promise<WorkoutTemplate[]>;
}

type TabKey = 'upload' | 'ai' | 'library';

const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  isOpen,
  onClose,
  onSelectTemplate,
  getWorkoutTemplates
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>('library');
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<WorkoutTemplate[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');

  // AI Builder state
  const [aiName, setAiName] = useState('Custom Program');
  const [aiDifficulty, setAiDifficulty] = useState<'beginner'|'intermediate'|'advanced'|'expert'>('intermediate');
  const [aiCategory, setAiCategory] = useState<'strength'|'cardio'|'flexibility'|'bodybuilding'|'yoga'|'pilates'|'crossfit'|'sports'|'rehabilitation'|'weight-loss'|'muscle-gain'|'endurance'|'powerlifting'|'functional'>('strength');
  const [aiDays, setAiDays] = useState(4);
  const [aiFocus, setAiFocus] = useState('full-body');
  const [aiDuration, setAiDuration] = useState(45);
  const [aiEquipment, setAiEquipment] = useState<'gym'|'home'|'mixed'>('gym');
  const [aiExperience, setAiExperience] = useState<'new'|'returning'|'experienced'>('returning');
  const [aiGoals, setAiGoals] = useState<string[]>(['build-muscle']);
  const [aiInjuries, setAiInjuries] = useState<string[]>([]);
  const [aiTimePerSession, setAiTimePerSession] = useState(60);
  
  // Modern UI state
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  
  // Mobile-first step navigation
  const [currentStep, setCurrentStep] = useState(0);
  const totalSteps = 6;

  // Manual Workout Creation state
  const [isManualCreation, setIsManualCreation] = useState(false);
  const [manualStep, setManualStep] = useState(0);
  const manualTotalSteps = 7;
  const [manualName, setManualName] = useState('');
  const [manualDescription, setManualDescription] = useState('');
  const [manualCategory, setManualCategory] = useState<'strength'|'cardio'|'flexibility'|'bodybuilding'|'yoga'|'pilates'|'crossfit'|'sports'|'rehabilitation'|'weight-loss'|'muscle-gain'|'endurance'|'powerlifting'|'functional'>('strength');
  const [manualDifficulty, setManualDifficulty] = useState<'beginner'|'intermediate'|'advanced'|'expert'>('intermediate');
  const [manualDuration, setManualDuration] = useState(45);
  const [manualDays, setManualDays] = useState(3);
  const [manualWeeks, setManualWeeks] = useState(4);
  const [manualDaysData, setManualDaysData] = useState<Array<{
    dayNumber: number;
    name: string;
    exercises: Array<{
      exerciseId: string;
      exerciseName: string;
      isCustom: boolean;
      sets: number;
      reps: string;
      rest: number;
      notes?: string;
    }>;
  }>>([]);
  const [availableExercises, setAvailableExercises] = useState<Array<{
    id: string;
    name: string;
    category: string;
    muscleGroups: string[];
  }>>([]);
  const [exerciseSearchQuery, setExerciseSearchQuery] = useState('');
  const [showExerciseSelector, setShowExerciseSelector] = useState(false);
  const [showCustomExerciseForm, setShowCustomExerciseForm] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showExerciseEditor, setShowExerciseEditor] = useState(false);
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [customExerciseData, setCustomExerciseData] = useState({
    name: '',
    category: 'strength',
    muscleGroups: [] as string[],
    instructions: [] as string[],
    equipment: [] as string[]
  });

  // Load templates when component mounts
  useEffect(() => {
    if (isOpen) {
      loadTemplates();
      setActiveTab('library');
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openDropdown && !(event.target as Element).closest('.dropdown-container')) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdown]);

  // Filter templates based on search, category, and type
  useEffect(() => {
    let filtered = templates;
    if (searchQuery) {
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (template.description?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        template.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(template => template.category === selectedCategory);
    }
    if (selectedType !== 'all') {
      filtered = filtered.filter(template => template.type === selectedType);
    }
    setFilteredTemplates(filtered);
  }, [templates, searchQuery, selectedCategory, selectedType]);

  const loadTemplates = async () => {
    setIsLoading(true);
    try {
      // Initialize default templates if none exist
      const workoutService = getWorkoutService();
      await workoutService.initializeDefaultTemplates();
      
      const loadedTemplates = await getWorkoutTemplates();
      setTemplates(loadedTemplates);
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load available exercises for manual creation
  const loadAvailableExercises = async () => {
    try {
      // Comprehensive exercise database
      const exercises = [
        // Chest Exercises
        { id: 'bench-press', name: 'Bench Press', category: 'strength', muscleGroups: ['chest', 'triceps', 'shoulders'] },
        { id: 'incline-bench-press', name: 'Incline Bench Press', category: 'strength', muscleGroups: ['chest', 'triceps', 'shoulders'] },
        { id: 'decline-bench-press', name: 'Decline Bench Press', category: 'strength', muscleGroups: ['chest', 'triceps'] },
        { id: 'dumbbell-press', name: 'Dumbbell Bench Press', category: 'strength', muscleGroups: ['chest', 'triceps', 'shoulders'] },
        { id: 'push-ups', name: 'Push-ups', category: 'strength', muscleGroups: ['chest', 'triceps', 'shoulders', 'core'] },
        { id: 'dips', name: 'Dips', category: 'strength', muscleGroups: ['chest', 'triceps', 'shoulders'] },
        { id: 'chest-flyes', name: 'Chest Flyes', category: 'strength', muscleGroups: ['chest'] },
        
        // Back Exercises
        { id: 'pull-ups', name: 'Pull-ups', category: 'strength', muscleGroups: ['back', 'biceps'] },
        { id: 'chin-ups', name: 'Chin-ups', category: 'strength', muscleGroups: ['back', 'biceps'] },
        { id: 'lat-pulldowns', name: 'Lat Pulldowns', category: 'strength', muscleGroups: ['back', 'biceps'] },
        { id: 'barbell-rows', name: 'Barbell Rows', category: 'strength', muscleGroups: ['back', 'biceps'] },
        { id: 'dumbbell-rows', name: 'Dumbbell Rows', category: 'strength', muscleGroups: ['back', 'biceps'] },
        { id: 'deadlifts', name: 'Deadlifts', category: 'strength', muscleGroups: ['back', 'legs', 'glutes'] },
        { id: 'romanian-deadlifts', name: 'Romanian Deadlifts', category: 'strength', muscleGroups: ['back', 'hamstrings', 'glutes'] },
        
        // Shoulder Exercises
        { id: 'overhead-press', name: 'Overhead Press', category: 'strength', muscleGroups: ['shoulders', 'triceps'] },
        { id: 'dumbbell-press', name: 'Dumbbell Shoulder Press', category: 'strength', muscleGroups: ['shoulders', 'triceps'] },
        { id: 'lateral-raises', name: 'Lateral Raises', category: 'strength', muscleGroups: ['shoulders'] },
        { id: 'front-raises', name: 'Front Raises', category: 'strength', muscleGroups: ['shoulders'] },
        { id: 'rear-delt-flyes', name: 'Rear Delt Flyes', category: 'strength', muscleGroups: ['shoulders', 'back'] },
        
        // Arm Exercises
        { id: 'bicep-curls', name: 'Bicep Curls', category: 'strength', muscleGroups: ['biceps'] },
        { id: 'hammer-curls', name: 'Hammer Curls', category: 'strength', muscleGroups: ['biceps', 'forearms'] },
        { id: 'tricep-dips', name: 'Tricep Dips', category: 'strength', muscleGroups: ['triceps'] },
        { id: 'tricep-pushdowns', name: 'Tricep Pushdowns', category: 'strength', muscleGroups: ['triceps'] },
        { id: 'skull-crushers', name: 'Skull Crushers', category: 'strength', muscleGroups: ['triceps'] },
        
        // Leg Exercises
        { id: 'squats', name: 'Squats', category: 'strength', muscleGroups: ['quadriceps', 'glutes', 'hamstrings'] },
        { id: 'front-squats', name: 'Front Squats', category: 'strength', muscleGroups: ['quadriceps', 'glutes', 'core'] },
        { id: 'leg-press', name: 'Leg Press', category: 'strength', muscleGroups: ['quadriceps', 'glutes'] },
        { id: 'lunges', name: 'Lunges', category: 'strength', muscleGroups: ['quadriceps', 'glutes', 'hamstrings'] },
        { id: 'leg-curls', name: 'Leg Curls', category: 'strength', muscleGroups: ['hamstrings'] },
        { id: 'leg-extensions', name: 'Leg Extensions', category: 'strength', muscleGroups: ['quadriceps'] },
        { id: 'calf-raises', name: 'Calf Raises', category: 'strength', muscleGroups: ['calves'] },
        { id: 'glute-bridges', name: 'Glute Bridges', category: 'strength', muscleGroups: ['glutes', 'hamstrings'] },
        
        // Core Exercises
        { id: 'plank', name: 'Plank', category: 'core', muscleGroups: ['abs', 'core', 'shoulders'] },
        { id: 'side-plank', name: 'Side Plank', category: 'core', muscleGroups: ['abs', 'obliques', 'shoulders'] },
        { id: 'crunches', name: 'Crunches', category: 'core', muscleGroups: ['abs'] },
        { id: 'sit-ups', name: 'Sit-ups', category: 'core', muscleGroups: ['abs'] },
        { id: 'russian-twists', name: 'Russian Twists', category: 'core', muscleGroups: ['abs', 'obliques'] },
        { id: 'mountain-climbers', name: 'Mountain Climbers', category: 'core', muscleGroups: ['abs', 'shoulders'] },
        { id: 'leg-raises', name: 'Leg Raises', category: 'core', muscleGroups: ['abs'] },
        { id: 'hanging-leg-raises', name: 'Hanging Leg Raises', category: 'core', muscleGroups: ['abs'] },
        
        // Cardio Exercises
        { id: 'burpees', name: 'Burpees', category: 'cardio', muscleGroups: ['full body'] },
        { id: 'jumping-jacks', name: 'Jumping Jacks', category: 'cardio', muscleGroups: ['full body'] },
        { id: 'mountain-climbers-cardio', name: 'Mountain Climbers', category: 'cardio', muscleGroups: ['full body'] },
        { id: 'high-knees', name: 'High Knees', category: 'cardio', muscleGroups: ['full body'] },
        { id: 'jump-rope', name: 'Jump Rope', category: 'cardio', muscleGroups: ['full body'] },
        { id: 'box-jumps', name: 'Box Jumps', category: 'cardio', muscleGroups: ['legs', 'glutes'] },
        
        // Bodyweight Exercises
        { id: 'pull-ups-bodyweight', name: 'Pull-ups', category: 'bodyweight', muscleGroups: ['back', 'biceps'] },
        { id: 'push-ups-bodyweight', name: 'Push-ups', category: 'bodyweight', muscleGroups: ['chest', 'triceps', 'shoulders'] },
        { id: 'squats-bodyweight', name: 'Bodyweight Squats', category: 'bodyweight', muscleGroups: ['legs', 'glutes'] },
        { id: 'lunges-bodyweight', name: 'Bodyweight Lunges', category: 'bodyweight', muscleGroups: ['legs', 'glutes'] },
        { id: 'plank-bodyweight', name: 'Plank', category: 'bodyweight', muscleGroups: ['core', 'shoulders'] },
        
        // Isolation Exercises
        { id: 'bicep-curls-isolation', name: 'Bicep Curls', category: 'isolation', muscleGroups: ['biceps'] },
        { id: 'tricep-extensions', name: 'Tricep Extensions', category: 'isolation', muscleGroups: ['triceps'] },
        { id: 'lateral-raises-isolation', name: 'Lateral Raises', category: 'isolation', muscleGroups: ['shoulders'] },
        { id: 'calf-raises-isolation', name: 'Calf Raises', category: 'isolation', muscleGroups: ['calves'] },
        
        // Compound Exercises
        { id: 'clean-and-press', name: 'Clean and Press', category: 'compound', muscleGroups: ['full body'] },
        { id: 'thrusters', name: 'Thrusters', category: 'compound', muscleGroups: ['full body'] },
        { id: 'burpees-compound', name: 'Burpees', category: 'compound', muscleGroups: ['full body'] },
        { id: 'man-makers', name: 'Man Makers', category: 'compound', muscleGroups: ['full body'] }
      ];
      
      setAvailableExercises(exercises);
    } catch (error) {
      console.error('Error loading exercises:', error);
      // Fallback to basic exercises if something goes wrong
      const fallbackExercises = [
        { id: '1', name: 'Push-ups', category: 'strength', muscleGroups: ['chest', 'triceps', 'shoulders'] },
        { id: '2', name: 'Squats', category: 'strength', muscleGroups: ['legs', 'glutes'] },
        { id: '3', name: 'Pull-ups', category: 'strength', muscleGroups: ['back', 'biceps'] },
        { id: '4', name: 'Deadlifts', category: 'strength', muscleGroups: ['back', 'legs'] },
        { id: '5', name: 'Bench Press', category: 'strength', muscleGroups: ['chest', 'triceps'] }
      ];
      setAvailableExercises(fallbackExercises);
    }
  };

  // Initialize manual days data
  const initializeManualDays = (days: number) => {
    const daysData = Array.from({ length: days }, (_, index) => ({
      dayNumber: index + 1,
      name: `Day ${index + 1}`,
      exercises: []
    }));
    setManualDaysData(daysData);
  };

  // Map StoredWorkoutTemplate-like to WorkoutTemplate (for PDF uploader output)
  const mapStoredToWorkoutTemplate = (stored: any): WorkoutTemplate => {
    return {
      id: stored.id || `tpl-${Date.now()}`,
      name: stored.name || 'Imported Plan',
      description: stored.description || '',
      category: stored.category || 'strength',
      difficulty: (stored.difficulty || 'intermediate') as any,
      estimatedDuration: stored.estimatedTime || 45,
      exercises: [],
      createdAt: new Date(),
      updatedAt: new Date()
    } as WorkoutTemplate;
  };

  const handlePDFUploaded = async (stored: any) => {
    const mapped = mapStoredToWorkoutTemplate(stored);
    mapped.type = 'uploaded';
    
    // Save the template to the database
    const workoutService = getWorkoutService();
    await workoutService.saveWorkoutTemplate(mapped);
    
    onSelectTemplate(mapped);
    onClose();
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'strength': 'bg-red-500/20 text-red-400',
      'cardio': 'bg-blue-500/20 text-blue-400',
      'flexibility': 'bg-green-500/20 text-green-400',
      'hiit': 'bg-orange-500/20 text-orange-400',
      'yoga': 'bg-purple-500/20 text-purple-400',
      'pilates': 'bg-pink-500/20 text-pink-400'
    };
    return colors[category.toLowerCase()] || 'bg-gray-500/20 text-gray-400';
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner':
        return 'text-green-400';
      case 'intermediate':
        return 'text-yellow-400';
      case 'advanced':
      case 'expert':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getDifficultyDisplay = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner':
        return '1/5';
      case 'intermediate':
        return '3/5';
      case 'advanced':
        return '4/5';
      case 'expert':
        return '5/5';
      default:
        return 'N/A';
    }
  };

  // Haptic feedback function
  const triggerHaptic = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  };

  // Mobile-first step navigation component
  const StepProgress = () => (
    <div className="flex items-center space-x-2 mb-6">
      <button 
        onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
        className="p-2 rounded-lg hover:bg-gray-800/80 transition-colors"
      >
        <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <div className="flex-1 bg-gray-700 rounded-full h-1">
        <div 
          className="bg-lime-500 h-1 rounded-full transition-all duration-500"
          style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
        />
      </div>
      <span className="text-sm text-gray-400 font-medium">
        {currentStep + 1} of {totalSteps}
      </span>
    </div>
  );

  // Manual creation step navigation component
  const ManualStepProgress = () => (
    <div className="flex items-center space-x-2 mb-6">
      <button 
        onClick={() => setManualStep(Math.max(0, manualStep - 1))}
        className="p-2 rounded-lg hover:bg-gray-800/80 transition-colors"
      >
        <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <div className="flex-1 bg-gray-700 rounded-full h-1">
        <div 
          className="bg-lime-500 h-1 rounded-full transition-all duration-500"
          style={{ width: `${((manualStep + 1) / manualTotalSteps) * 100}%` }}
        />
      </div>
      <span className="text-sm text-gray-400 font-medium">
        {manualStep + 1} of {manualTotalSteps}
      </span>
    </div>
  );

  // Mobile-first option selector
  const MobileOptionSelector = ({ 
    options, 
    selectedValue, 
    onSelect, 
    multiSelect = false 
  }: {
    options: { value: string; label: string; description?: string }[];
    selectedValue: string | string[];
    onSelect: (value: string) => void;
    multiSelect?: boolean;
  }) => {
    const isSelected = (value: string) => {
      if (multiSelect) {
        return Array.isArray(selectedValue) && selectedValue.includes(value);
      }
      return selectedValue === value;
    };

    return (
      <div className="space-y-2">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => {
              triggerHaptic();
              onSelect(option.value);
            }}
            className={`w-full p-2.5 sm:p-3 rounded-lg border-2 transition-all duration-300 text-left ${
              isSelected(option.value)
                ? 'border-lime-500 bg-lime-900/20 text-white'
                : 'border-gray-700 bg-gray-800/80 text-gray-300 hover:border-gray-600 hover:bg-gray-700/80'
            }`}
          >
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="flex-1">
                <div className="font-semibold text-sm sm:text-base">{option.label}</div>
                {option.description && (
                  <div className="text-xs text-gray-400 mt-0.5">{option.description}</div>
                )}
              </div>
              {isSelected(option.value) && (
                <div className="w-4 h-4 sm:w-5 sm:h-5 bg-lime-500 rounded-full flex items-center justify-center">
                  <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-black" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
    );
  };

  // Modern dropdown component
  const ModernDropdown = ({ 
    id, 
    label, 
    value, 
    options, 
    onChange, 
    placeholder = "Select option" 
  }: {
    id: string;
    label: string;
    value: string;
    options: { value: string; label: string; icon?: string }[];
    onChange: (value: string) => void;
    placeholder?: string;
  }) => {
    const isOpen = openDropdown === id;
    const selectedOption = options.find(opt => opt.value === value);

    return (
      <div className="relative dropdown-container">
        <label className="block text-sm text-gray-300 mb-2">{label}</label>
        <button
          onClick={() => {
            triggerHaptic();
            setOpenDropdown(isOpen ? null : id);
          }}
          className={`w-full px-4 py-3 bg-gray-700/80 border rounded-lg text-left transition-all duration-300 transform ${
            isOpen 
              ? 'border-lime-500 bg-gray-600/80 scale-[1.02] shadow-lg shadow-lime-500/20' 
              : 'border-gray-600/50 hover:border-gray-500 hover:bg-gray-600/80 hover:scale-[1.01]'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {selectedOption?.icon && (
                <span className="text-lg">{selectedOption.icon}</span>
              )}
              <span className="text-white font-medium">
                {selectedOption?.label || placeholder}
              </span>
            </div>
            <div className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </button>
        
        {/* Dropdown Menu */}
        <div className={`absolute z-50 w-full mt-2 transition-all duration-300 transform origin-top ${
          isOpen 
            ? 'opacity-100 scale-y-100' 
            : 'opacity-0 scale-y-95 pointer-events-none'
        }`}>
          <div className="bg-gray-800/95 backdrop-blur-sm border border-gray-600/50 rounded-lg shadow-2xl overflow-hidden">
            {options.map((option, index) => (
              <button
                key={option.value}
                onClick={() => {
                  triggerHaptic();
                  onChange(option.value);
                  setOpenDropdown(null);
                }}
                className={`w-full px-4 py-3 text-left transition-all duration-200 flex items-center space-x-3 hover:bg-gray-700/80 ${
                  value === option.value ? 'bg-lime-900/20 text-lime-300' : 'text-gray-300 hover:text-white'
                } ${index === 0 ? 'rounded-t-lg' : ''} ${index === options.length - 1 ? 'rounded-b-lg' : ''}`}
                style={{
                  animationDelay: `${index * 50}ms`
                }}
              >
                {option.icon && (
                  <span className="text-lg">{option.icon}</span>
                )}
                <span className="font-medium">{option.label}</span>
                {value === option.value && (
                  <div className="ml-auto">
                    <svg className="w-5 h-5 text-lime-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Modern number input with slider
  const ModernNumberInput = ({ 
    label, 
    value, 
    onChange, 
    min, 
    max, 
    step = 1,
    unit = ""
  }: {
    label: string;
    value: number;
    onChange: (value: number) => void;
    min: number;
    max: number;
    step?: number;
    unit?: string;
  }) => {
    return (
      <div>
        <label className="block text-sm text-gray-300 mb-2">{label}</label>
        <div className="relative">
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => {
              triggerHaptic();
              onChange(parseInt(e.target.value));
            }}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between items-center mt-3">
            <span className="text-xs text-gray-400">{min}{unit}</span>
            <div className="bg-lime-900/20 border border-lime-500/50 rounded-lg px-3 py-1">
              <span className="text-lime-300 font-bold text-lg">{value}{unit}</span>
            </div>
            <span className="text-xs text-gray-400">{max}{unit}</span>
          </div>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-gray-900/95 border border-gray-700/50 rounded-xl w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-2xl lg:max-w-4xl xl:max-w-5xl overflow-hidden shadow-2xl">
        <CardHeader title="Choose Your Template">
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-gray-800"
          >
            ✕
          </button>
        </CardHeader>
        
        {/* Tabs */}
        <div className="px-2 sm:px-4 pt-3">
          <div className="flex gap-1 bg-gray-800/80 rounded-lg p-1 w-full border border-gray-700/50">
            <button
              onClick={() => setActiveTab('upload')}
              className={`flex-1 flex items-center justify-center gap-1 py-2 sm:py-3 rounded-md text-xs sm:text-sm font-medium transition-all duration-200 ${activeTab==='upload'?'bg-gray-200 text-gray-900 shadow-md':'text-gray-300 hover:text-white hover:bg-gray-700/50'}`}
            >
              <UploadIcon className="w-3 h-3 sm:w-4 sm:h-4" /> Upload
            </button>
            <button
              onClick={() => setActiveTab('ai')}
              className={`flex-1 flex items-center justify-center gap-1 py-2 sm:py-3 rounded-md text-xs sm:text-sm font-medium transition-all duration-200 ${activeTab==='ai'?'bg-gray-200 text-gray-900 shadow-md':'text-gray-300 hover:text-white hover:bg-gray-700/50'}`}
            >
              <SparklesIcon className="w-3 h-3 sm:w-4 sm:h-4" /> Build with AI
            </button>
            <button
              onClick={() => setActiveTab('library')}
              className={`flex-1 flex items-center justify-center gap-1 py-2 sm:py-3 rounded-md text-xs sm:text-sm font-medium transition-all duration-200 ${activeTab==='library'?'bg-gray-200 text-gray-900 shadow-md':'text-gray-300 hover:text-white hover:bg-gray-700/50'}`}
            >
              <DumbbellIcon className="w-3 h-3 sm:w-4 sm:h-4" /> Library
            </button>
          </div>
        </div>

        <CardContent className="max-h-[75vh] sm:max-h-[70vh] overflow-y-auto px-2 sm:px-4">
          {activeTab === 'upload' && !isManualCreation && (
            <div className="bg-transparent">
              <PDFWorkoutUploader
                onUpload={handlePDFUploaded}
                onBack={onClose}
                aiService={{ getCoachingResponse: async () => ({ content: '' }) }}
              />
              <div className="mt-6 pt-6 border-t border-gray-700/50">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-white mb-2">Or create your own</h3>
                  <p className="text-gray-400 text-sm mb-4">Design a completely custom workout from scratch</p>
                  <button
                    onClick={() => {
                      triggerHaptic();
                      setIsManualCreation(true);
                      setManualStep(0);
                    }}
                    className="w-full px-4 py-3 bg-lime-500 text-black font-semibold rounded-lg hover:bg-lime-400 transition-all duration-200"
                  >
                    Start Manual Creation
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'upload' && isManualCreation && (
            <div className="min-h-[50vh] flex flex-col">
              <ManualStepProgress />

              {manualStep === 0 && (
                <div className="flex-1 flex flex-col justify-center">
                  <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 sm:mb-3 text-center">
                    What should we call
                    <br />your workout?
                  </h2>
                  <p className="text-gray-400 text-center mb-4 sm:mb-6 text-xs sm:text-sm">
                    Give your custom workout a memorable name
                  </p>
                  <div className="space-y-3">
                    <input
                      value={manualName}
                      onChange={(e) => setManualName(e.target.value)}
                      placeholder="e.g., My Custom Strength Plan"
                      className="w-full px-4 py-3 bg-gray-800/80 border-2 border-gray-700 rounded-lg text-white text-base font-medium placeholder-gray-400 focus:outline-none focus:border-lime-500 transition-all duration-200"
                    />
                    <button
                      onClick={() => setManualStep(1)}
                      disabled={!manualName.trim()}
                      className="w-full px-4 py-3 bg-lime-500 text-black font-semibold rounded-lg hover:bg-lime-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Continue
                    </button>
                  </div>
                </div>
              )}

              {manualStep === 1 && (
                <div className="flex-1 flex flex-col justify-center">
                  <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 sm:mb-3 text-center">
                    What type of workout
                    <br />is this?
                  </h2>
                  <p className="text-gray-400 text-center mb-4 sm:mb-6 text-xs sm:text-sm">
                    Choose the category that best describes your workout
                  </p>
                  <MobileOptionSelector
                    options={[
                      { value: 'strength', label: 'Strength Training', description: 'Building muscle and power' },
                      { value: 'cardio', label: 'Cardiovascular', description: 'Improving endurance and heart health' },
                      { value: 'flexibility', label: 'Flexibility & Mobility', description: 'Stretching and range of motion' },
                      { value: 'bodybuilding', label: 'Bodybuilding', description: 'Muscle hypertrophy and definition' },
                      { value: 'functional', label: 'Functional Training', description: 'Real-world movement patterns' }
                    ]}
                    selectedValue={manualCategory}
                    onSelect={(value) => {
                      setManualCategory(value as any);
                      setManualStep(2);
                    }}
                  />
                </div>
              )}

              {manualStep === 2 && (
                <div className="flex-1 flex flex-col justify-center">
                  <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 sm:mb-3 text-center">
                    What's the difficulty
                    <br />level?
                  </h2>
                  <p className="text-gray-400 text-center mb-4 sm:mb-6 text-xs sm:text-sm">
                    This helps users understand the intensity
                  </p>
                  <MobileOptionSelector
                    options={[
                      { value: 'beginner', label: 'Beginner', description: 'Suitable for fitness newcomers' },
                      { value: 'intermediate', label: 'Intermediate', description: 'For those with some experience' },
                      { value: 'advanced', label: 'Advanced', description: 'Challenging for experienced athletes' },
                      { value: 'expert', label: 'Expert', description: 'Maximum intensity and complexity' }
                    ]}
                    selectedValue={manualDifficulty}
                    onSelect={(value) => {
                      setManualDifficulty(value as any);
                      setManualStep(3);
                    }}
                  />
                </div>
              )}

              {manualStep === 3 && (
                <div className="flex-1 flex flex-col justify-center">
                  <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 sm:mb-3 text-center">
                    How many days per week
                    <br />will you train?
                  </h2>
                  <p className="text-gray-400 text-center mb-4 sm:mb-6 text-xs sm:text-sm">
                    Choose the frequency that fits your schedule
                  </p>
                  <ModernNumberInput
                    label="Training Days"
                    value={manualDays}
                    onChange={(value) => {
                      setManualDays(value);
                      initializeManualDays(value);
                    }}
                    min={1}
                    max={7}
                    step={1}
                    unit=" days"
                  />
                  <div className="mt-6 space-y-3">
                    <button
                      onClick={() => setManualStep(4)}
                      className="w-full px-4 py-3 bg-lime-500 text-black font-semibold rounded-lg hover:bg-lime-400 transition-all duration-200"
                    >
                      Continue
                    </button>
                    <button
                      onClick={() => setManualStep(2)}
                      className="w-full px-4 py-3 border-2 border-gray-700 rounded-lg text-gray-300 hover:border-gray-600 transition-all duration-200"
                    >
                      Back
                    </button>
                  </div>
                </div>
              )}

              {manualStep === 4 && (
                <div className="flex-1 flex flex-col justify-center">
                  <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 sm:mb-3 text-center">
                    How long will each
                    <br />workout take?
                  </h2>
                  <p className="text-gray-400 text-center mb-4 sm:mb-6 text-xs sm:text-sm">
                    Estimate the duration including rest periods
                  </p>
                  <div className="space-y-4">
                    <ModernNumberInput
                      label="Program Weeks"
                      value={manualWeeks}
                      onChange={setManualWeeks}
                      min={1}
                      max={12}
                      step={1}
                      unit=" weeks"
                    />
                    <ModernNumberInput
                      label="Workout Duration"
                      value={manualDuration}
                      onChange={setManualDuration}
                      min={15}
                      max={120}
                      step={5}
                      unit=" minutes"
                    />
                  </div>
                  <div className="mt-6 space-y-3">
                    <button
                      onClick={() => {
                        loadAvailableExercises();
                        setManualStep(6);
                      }}
                      className="w-full px-4 py-3 bg-lime-500 text-black font-semibold rounded-lg hover:bg-lime-400 transition-all duration-200"
                    >
                      Continue
                    </button>
                    <button
                      onClick={() => setManualStep(4)}
                      className="w-full px-4 py-3 border-2 border-gray-700 rounded-lg text-gray-300 hover:border-gray-600 transition-all duration-200"
                    >
                      Back
                    </button>
                  </div>
                </div>
              )}

              {manualStep === 5 && (
                <div className="flex-1 flex flex-col justify-center">
                  <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 sm:mb-3 text-center">
                    Design your {manualWeeks}-week program
                  </h2>
                  <p className="text-gray-400 text-center mb-4 sm:mb-6 text-xs sm:text-sm">
                    Add exercises to each training day
                  </p>
                  
                  <div className="space-y-3 mb-6">
                    {manualDaysData.map((day, dayIndex) => (
                      <div key={dayIndex} className="bg-gray-800/80 border border-gray-700/50 rounded-lg p-3">
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="font-semibold text-white text-sm">{day.name}</h4>
                          <div className="text-xs text-gray-400">{day.exercises.length} exercises</div>
                        </div>
                        
                        {day.exercises.length > 0 && (
                          <div className="space-y-2 mb-3">
                            {day.exercises.map((exercise, exIndex) => (
                              <div key={exIndex} className="bg-gray-700/50 rounded-lg p-3 border border-gray-600/50">
                                <div className="flex justify-between items-start mb-2">
                                  <div className="flex-1">
                                    <div className="text-sm font-medium text-white">{exercise.exerciseName}</div>
                                    <div className="text-xs text-gray-400 mt-1">
                                      {exercise.isCustom ? 'Custom Exercise' : 'From Database'}
                                    </div>
                                  </div>
                                  <div className="flex space-x-2">
                                    <button
                                      onClick={() => {
                                        setCurrentDayIndex(dayIndex);
                                        setCurrentExerciseIndex(exIndex);
                                        setShowExerciseEditor(true);
                                      }}
                                      className="text-lime-400 hover:text-lime-300 text-xs px-2 py-1 rounded border border-lime-500/50 hover:bg-lime-500/10 transition-all duration-200"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => {
                                        const newDaysData = [...manualDaysData];
                                        newDaysData[dayIndex].exercises.splice(exIndex, 1);
                                        setManualDaysData(newDaysData);
                                      }}
                                      className="text-red-400 hover:text-red-300 text-xs px-2 py-1 rounded border border-red-500/50 hover:bg-red-500/10 transition-all duration-200"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-3 gap-2 text-xs">
                                  <div className="bg-gray-600/50 rounded p-2 text-center">
                                    <div className="text-gray-400">Sets</div>
                                    <div className="text-white font-medium">{exercise.sets}</div>
                                  </div>
                                  <div className="bg-gray-600/50 rounded p-2 text-center">
                                    <div className="text-gray-400">Reps</div>
                                    <div className="text-white font-medium">{exercise.reps}</div>
                                  </div>
                                  <div className="bg-gray-600/50 rounded p-2 text-center">
                                    <div className="text-gray-400">Rest</div>
                                    <div className="text-white font-medium">{exercise.rest}s</div>
                                  </div>
                                </div>
                                
                                {exercise.notes && (
                                  <div className="text-xs text-gray-500 mt-2 italic">
                                    "{exercise.notes}"
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        
                        <button
                          onClick={() => {
                            setCurrentDayIndex(dayIndex);
                            setShowExerciseSelector(true);
                          }}
                          className="w-full px-3 py-2 border-2 border-dashed border-gray-600 rounded-lg text-gray-400 hover:border-gray-500 hover:text-gray-300 transition-all duration-200 text-sm"
                        >
                          + Add Exercise to {day.name}
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-3">
                    <button
                      onClick={() => setManualStep(6)}
                      disabled={manualDaysData.every(day => day.exercises.length === 0)}
                      className="w-full px-4 py-3 bg-lime-500 text-black font-semibold rounded-lg hover:bg-lime-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Continue to Review
                    </button>
                    <button
                      onClick={() => setManualStep(4)}
                      className="w-full px-4 py-3 border-2 border-gray-700 rounded-lg text-gray-300 hover:border-gray-600 transition-all duration-200"
                    >
                      Back
                    </button>
                  </div>
                </div>
              )}

              {manualStep === 6 && (
                <div className="flex-1 flex flex-col justify-center">
                  <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 sm:mb-3 text-center">
                    Review your {manualWeeks}-week program
                  </h2>
                  <p className="text-gray-400 text-center mb-4 sm:mb-6 text-xs sm:text-sm">
                    Make sure everything looks perfect before creating
                  </p>
                  
                  <div className="bg-gray-800/80 border border-gray-700/50 rounded-lg p-4 mb-6">
                    <h3 className="font-bold text-white text-lg mb-2">{manualName}</h3>
                    <div className="flex items-center space-x-2 mb-3">
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(manualCategory)}`}>
                        {manualCategory}
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(manualDifficulty)}`}>
                        {getDifficultyDisplay(manualDifficulty)}
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-400 mb-3">
                      <div className="flex items-center space-x-1">
                        <ClockIcon className="w-4 h-4" />
                        <span>{manualDuration} min per day</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <DumbbellIcon className="w-4 h-4" />
                        <span>{manualDays} days per week</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <CalendarIcon className="w-4 h-4" />
                        <span>{manualWeeks} weeks total</span>
                      </div>
                    </div>
                  </div>

                  {/* Detailed Program Review */}
                  <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
                    {manualDaysData.map((day, dayIndex) => (
                      <div key={dayIndex} className="bg-gray-800/80 border border-gray-700/50 rounded-lg p-3">
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="font-semibold text-white text-sm">{day.name}</h4>
                          <div className="text-xs text-gray-400">{day.exercises.length} exercises</div>
                        </div>
                        
                        {day.exercises.length > 0 ? (
                          <div className="space-y-2">
                            {day.exercises.map((exercise, exIndex) => (
                              <div key={exIndex} className="bg-gray-700/50 rounded-lg p-2 border border-gray-600/50">
                                <div className="flex justify-between items-start mb-2">
                                  <div className="flex-1">
                                    <div className="text-sm font-medium text-white">{exercise.exerciseName}</div>
                                    <div className="text-xs text-gray-400 mt-1">
                                      {exercise.isCustom ? 'Custom Exercise' : 'From Database'}
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-3 gap-2 text-xs">
                                  <div className="bg-gray-600/50 rounded p-1.5 text-center">
                                    <div className="text-gray-400">Sets</div>
                                    <div className="text-white font-medium">{exercise.sets}</div>
                                  </div>
                                  <div className="bg-gray-600/50 rounded p-1.5 text-center">
                                    <div className="text-gray-400">Reps</div>
                                    <div className="text-white font-medium">{exercise.reps}</div>
                                  </div>
                                  <div className="bg-gray-600/50 rounded p-1.5 text-center">
                                    <div className="text-gray-400">Rest</div>
                                    <div className="text-white font-medium">{exercise.rest}s</div>
                                  </div>
                                </div>
                                
                                {exercise.notes && (
                                  <div className="text-xs text-gray-500 mt-2 italic">
                                    "{exercise.notes}"
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-4 text-gray-500 text-sm">
                            No exercises added yet
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="space-y-3">
                    <button
                      onClick={async () => {
                        const template: WorkoutTemplate = {
                          id: `manual-${Date.now()}`,
                          name: manualName,
                          description: `${manualWeeks}-week ${manualCategory} program with ${manualDays} days per week and ${manualDaysData.reduce((total, day) => total + day.exercises.length, 0)} total exercises`,
                          category: manualCategory,
                          difficulty: manualDifficulty,
                          estimatedDuration: manualDuration,
                          type: 'custom',
                          exercises: manualDaysData.flatMap((day, dayIndex) => 
                            day.exercises.map((ex, exIndex) => ({
                              exerciseId: ex.exerciseId,
                              exercise: {
                                id: ex.exerciseId,
                                name: ex.exerciseName,
                                category: 'strength' as any,
                                muscleGroups: [],
                                equipment: [],
                                instructions: [],
                                tips: []
                              },
                              targetSets: ex.sets,
                              targetReps: parseInt(ex.reps.split('-')[0]) || 10,
                              targetWeight: 0,
                              notes: ex.notes,
                              order: dayIndex * 100 + exIndex
                            }))
                          ),
                          createdAt: new Date(),
                          updatedAt: new Date()
                        } as WorkoutTemplate;
                        
                        // Save the template to the database
                        const workoutService = getWorkoutService();
                        await workoutService.saveWorkoutTemplate(template);
                        
                        onSelectTemplate(template);
                        onClose();
                      }}
                      className="w-full px-4 py-3 bg-lime-500 text-black font-semibold rounded-lg hover:bg-lime-400 transition-all duration-200"
                    >
                      Create Program
                    </button>
                    <button
                      onClick={() => setManualStep(5)}
                      className="w-full px-4 py-3 border-2 border-gray-700 rounded-lg text-gray-300 hover:border-gray-600 transition-all duration-200"
                    >
                      Back
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

                    {activeTab === 'ai' && (
            <div className="min-h-[50vh] flex flex-col">
              <StepProgress />

              {currentStep === 0 && (
                <div className="flex-1 flex flex-col justify-center">
                  <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 sm:mb-3 text-center">
                    What's your main motivation
                    <br />for working out?
                  </h2>
                  <p className="text-gray-400 text-center mb-4 sm:mb-6 text-xs sm:text-sm">
                    This helps us create a program tailored to your goals
                  </p>
                  <MobileOptionSelector
                    options={[
                      { value: 'build-muscle', label: 'Getting more visible muscles', description: 'Focus on muscle growth and definition' },
                      { value: 'lose-weight', label: 'Getting leaner', description: 'Focus on fat loss and toning' },
                      { value: 'increase-strength', label: 'Getting stronger', description: 'Focus on strength and power' },
                      { value: 'general-fitness', label: 'Getting bigger', description: 'Focus on overall size and mass' }
                    ]}
                    selectedValue={aiGoals[0] || ''}
                    onSelect={(value) => {
                      setAiGoals([value]);
                      setCurrentStep(1);
                    }}
                  />
                </div>
              )}

              {currentStep === 1 && (
                <div className="flex-1 flex flex-col justify-center">
                  <h2 className="text-2xl font-bold text-white mb-3 text-center">
                    What's your current
                    <br />fitness level?
                  </h2>
                  <p className="text-gray-400 text-center mb-6 text-sm">
                    Be honest - this ensures the right intensity for you
                  </p>
                  <MobileOptionSelector
                    options={[
                      { value: 'beginner', label: 'Beginner', description: 'New to fitness or returning after a long break' },
                      { value: 'intermediate', label: 'Average', description: 'Some experience with regular workouts' },
                      { value: 'advanced', label: 'Advanced', description: 'Experienced with consistent training' }
                    ]}
                    selectedValue={aiDifficulty}
                    onSelect={(value) => {
                      setAiDifficulty(value as any);
                      setCurrentStep(2);
                    }}
                  />
                </div>
              )}

              {currentStep === 2 && (
                <div className="flex-1 flex flex-col justify-center">
                  <h2 className="text-2xl font-bold text-white mb-3 text-center">
                    Where will you mainly
                    <br />work out?
                  </h2>
                  <p className="text-gray-400 text-center mb-6 text-sm">
                    This affects the equipment and exercises we'll include
                  </p>
                  <MobileOptionSelector
                    options={[
                      { value: 'gym', label: 'At the gym', description: 'Full access to gym equipment' },
                      { value: 'home', label: 'At home', description: 'Limited equipment, bodyweight focus' },
                      { value: 'mixed', label: 'Mixed', description: 'Some equipment available' }
                    ]}
                    selectedValue={aiEquipment}
                    onSelect={(value) => {
                      setAiEquipment(value as any);
                      setCurrentStep(3);
                    }}
                  />
                </div>
              )}

              {currentStep === 3 && (
                <div className="flex-1 flex flex-col justify-center">
                  <h2 className="text-2xl font-bold text-white mb-3 text-center">
                    What days of the week
                    <br />do you plan on working out?
                  </h2>
                  <p className="text-gray-400 text-center mb-6 text-sm">
                    Choose your preferred workout frequency
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, index) => (
                      <button
                        key={day}
                        onClick={() => {
                          triggerHaptic();
                          setAiDays(index + 1);
                          setCurrentStep(4);
                        }}
                        className={`p-3 rounded-lg border-2 transition-all duration-300 ${
                          aiDays === index + 1
                            ? 'border-lime-500 bg-lime-900/20 text-white'
                            : 'border-gray-700 bg-gray-800/80 text-gray-300 hover:border-gray-600'
                        }`}
                      >
                        <div className="text-xs font-semibold">{day}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{index + 1} day{index > 0 ? 's' : ''}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {currentStep === 4 && (
                <div className="flex-1 flex flex-col justify-center">
                  <h2 className="text-2xl font-bold text-white mb-3 text-center">
                    How much time can you
                    <br />spend per session?
                  </h2>
                  <p className="text-gray-400 text-center mb-6 text-sm">
                    We'll optimize your workouts for this duration
                  </p>
                  <div className="space-y-2">
                    {[30, 45, 60, 75, 90].map((minutes) => (
                      <button
                        key={minutes}
                        onClick={() => {
                          triggerHaptic();
                          setAiTimePerSession(minutes);
                          setCurrentStep(5);
                        }}
                        className={`w-full p-3 rounded-lg border-2 transition-all duration-300 text-left ${
                          aiTimePerSession === minutes
                            ? 'border-lime-500 bg-lime-900/20 text-white'
                            : 'border-gray-700 bg-gray-800/80 text-gray-300 hover:border-gray-600'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-base">{minutes} minutes</div>
                            <div className="text-xs text-gray-400">
                              {minutes <= 45 ? 'Quick & efficient' : 
                               minutes <= 60 ? 'Standard session' : 
                               minutes <= 75 ? 'Comprehensive workout' : 'Extended training'}
                            </div>
                          </div>
                          {aiTimePerSession === minutes && (
                            <div className="w-5 h-5 bg-lime-500 rounded-full flex items-center justify-center">
                              <svg className="w-3 h-3 text-black" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {currentStep === 5 && (
                <div className="flex-1 flex flex-col justify-center">
                  <h2 className="text-2xl font-bold text-white mb-3 text-center">
                    What should we call
                    <br />your program?
                  </h2>
                  <p className="text-gray-400 text-center mb-6 text-sm">
                    Give your custom workout plan a name
                  </p>
                  <div className="space-y-3">
                    <input
                      value={aiName}
                      onChange={(e) => setAiName(e.target.value)}
                      placeholder="e.g., My Strength Journey"
                      className="w-full px-4 py-3 bg-gray-800/80 border-2 border-gray-700 rounded-lg text-white text-base font-medium placeholder-gray-400 focus:outline-none focus:border-lime-500 transition-all duration-200"
                    />
                    <div className="flex space-x-3">
                      <button
                        onClick={() => setCurrentStep(4)}
                        className="flex-1 px-4 py-3 border-2 border-gray-700 rounded-lg text-gray-300 hover:border-gray-600 transition-all duration-200"
                      >
                        Back
                      </button>
                      <button
                        onClick={async () => {
                          const template: WorkoutTemplate = {
                            id: `ai-${Date.now()}`,
                            name: aiName || 'Custom Program',
                            description: `${aiDays} day program focused on ${aiGoals[0]}. ${aiDifficulty} level, ${aiTimePerSession} min sessions.`,
                            category: aiGoals[0] === 'build-muscle' ? 'strength' : 
                                     aiGoals[0] === 'lose-weight' ? 'weight-loss' : 
                                     aiGoals[0] === 'increase-strength' ? 'strength' : 'general-fitness',
                            difficulty: aiDifficulty,
                            estimatedDuration: aiTimePerSession,
                            type: 'ai',
                            exercises: [],
                            createdAt: new Date(),
                            updatedAt: new Date()
                          } as WorkoutTemplate;
                          
                          // Save the template to the database
                          const workoutService = getWorkoutService();
                          await workoutService.saveWorkoutTemplate(template);
                          
                          onSelectTemplate(template);
                          onClose();
                        }}
                        className="flex-1 px-4 py-3 bg-lime-500 text-black font-semibold rounded-lg hover:bg-lime-400 transition-all duration-200"
                      >
                        Create Program
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'library' && (
            <>
              {/* Search and Filters */}
              <div className="mb-3 sm:mb-6 space-y-2 sm:space-y-4">
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search templates..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-gray-800/80 border border-gray-700/50 rounded-lg sm:rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-gray-600 focus:ring-2 focus:ring-gray-600/20 transition-all duration-200 text-sm"
                  />
                </div>
                
                {/* Category Filter */}
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                      selectedCategory === 'all' 
                        ? 'bg-gray-200 text-gray-900 shadow-md' 
                        : 'bg-gray-800/80 text-gray-300 hover:text-white hover:bg-gray-700/50 border border-gray-700/50'
                    }`}
                  >
                    All Categories
                  </button>
                  {Array.from(new Set(templates.map(t => t.category))).map(category => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                        selectedCategory === category 
                          ? 'bg-gray-200 text-gray-900 shadow-md' 
                          : 'bg-gray-800/80 text-gray-300 hover:text-white hover:bg-gray-700/50 border border-gray-700/50'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>

                {/* Type Filter */}
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  <button
                    onClick={() => setSelectedType('all')}
                    className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                      selectedType === 'all' 
                        ? 'bg-gray-200 text-gray-900 shadow-md' 
                        : 'bg-gray-800/80 text-gray-300 hover:text-white hover:bg-gray-700/50 border border-gray-700/50'
                    }`}
                  >
                    All Types
                  </button>
                  <button
                    onClick={() => setSelectedType('prebuilt')}
                    className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                      selectedType === 'prebuilt' 
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50' 
                        : 'bg-gray-800/80 text-gray-300 hover:text-white hover:bg-gray-700/50 border border-gray-700/50'
                    }`}
                  >
                    Pre-built
                  </button>
                  <button
                    onClick={() => setSelectedType('ai')}
                    className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                      selectedType === 'ai' 
                        ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50' 
                        : 'bg-gray-800/80 text-gray-300 hover:text-white hover:bg-gray-700/50 border border-gray-700/50'
                    }`}
                  >
                    AI Generated
                  </button>
                  <button
                    onClick={() => setSelectedType('custom')}
                    className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                      selectedType === 'custom' 
                        ? 'bg-green-500/20 text-green-400 border border-green-500/50' 
                        : 'bg-gray-800/80 text-gray-300 hover:text-white hover:bg-gray-700/50 border border-gray-700/50'
                    }`}
                  >
                    Custom
                  </button>
                  <button
                    onClick={() => setSelectedType('uploaded')}
                    className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                      selectedType === 'uploaded' 
                        ? 'bg-orange-500/20 text-orange-400 border border-orange-500/50' 
                        : 'bg-gray-800/80 text-gray-300 hover:text-white hover:bg-gray-700/50 border border-gray-700/50'
                    }`}
                  >
                    Uploaded
                  </button>
                </div>
              </div>

              {/* Templates Grid */}
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="text-gray-400 mt-4">Loading templates...</p>
                </div>
              ) : filteredTemplates.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400">No templates found</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
                  {filteredTemplates.map((template) => (
                    <div
                      key={template.id}
                      onClick={() => { onSelectTemplate(template); onClose(); }}
                      className="bg-gray-800/80 border border-gray-700/50 rounded-lg sm:rounded-xl p-2.5 sm:p-4 cursor-pointer hover:bg-gray-700/80 transition-all duration-200 hover:scale-105 hover:shadow-lg hover:border-gray-600"
                    >
                      {/* Template Header */}
                      <div className="flex justify-between items-start mb-1.5 sm:mb-3">
                        <h3 className="font-semibold text-white text-sm leading-tight">
                          {template.name}
                        </h3>
                        <div className="flex flex-col items-end space-y-1">
                          <div className={`px-1 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium ${getCategoryColor(template.category)}`}>
                            {template.category}
                          </div>
                          {template.type && (
                            <div className={`px-1 sm:px-2 py-0.5 rounded-full text-xs font-medium ${
                              template.type === 'prebuilt' ? 'bg-blue-500/20 text-blue-400' :
                              template.type === 'ai' ? 'bg-purple-500/20 text-purple-400' :
                              template.type === 'custom' ? 'bg-green-500/20 text-green-400' :
                              template.type === 'uploaded' ? 'bg-orange-500/20 text-orange-400' :
                              'bg-gray-500/20 text-gray-400'
                            }`}>
                              {template.type}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Template Description */}
                      {template.description && (
                        <p className="text-gray-400 text-xs mb-1.5 sm:mb-3 line-clamp-2">
                          {template.description}
                        </p>
                      )}

                      {/* Template Stats */}
                      <div className="space-y-1 sm:space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center space-x-1 text-gray-400">
                            <ClockIcon className="w-3 h-3" />
                            <span>Duration</span>
                          </div>
                          <span className="text-white">
                            {template.estimatedDuration || 'N/A'} min
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center space-x-1 text-gray-400">
                            <DumbbellIcon className="w-3 h-3" />
                            <span>Exercises</span>
                          </div>
                          <span className="text-white">
                            {template.exercises?.length || 0}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center space-x-1 text-gray-400">
                            <StarIcon className="w-3 h-3" />
                            <span>Difficulty</span>
                          </div>
                          <span className={`font-medium ${getDifficultyColor(template.difficulty as any)}`}>
                            {getDifficultyDisplay(String(template.difficulty))}
                          </span>
                        </div>
                      </div>

                      {/* Select Button */}
                      <button className="w-full mt-2 sm:mt-4 text-xs sm:text-sm font-semibold text-gray-900 bg-gray-200 py-1.5 sm:py-2 px-2 sm:px-3 rounded-lg transition-all duration-200 hover:bg-[#334a18] hover:text-[#bdf164] hover:font-bold active:bg-[#a4e635] active:text-black active:font-bold">
                        Use This Template
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Exercise Selector Modal */}
          {showExerciseSelector && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
              <div className="bg-gray-900/95 border border-gray-700/50 rounded-xl w-full max-w-md max-h-[80vh] overflow-hidden shadow-2xl">
                <div className="p-4 border-b border-gray-700/50">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-white">
                      Add Exercise to {manualDaysData[currentDayIndex]?.name}
                    </h3>
                    <button
                      onClick={() => setShowExerciseSelector(false)}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
                  {/* Search and Add Custom */}
                  <div className="flex space-x-2">
                    <div className="relative flex-1">
                      <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search exercises..."
                        value={exerciseSearchQuery}
                        onChange={(e) => setExerciseSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-800/80 border border-gray-700/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent text-sm"
                      />
                    </div>
                    <button
                      onClick={() => {
                        setShowCustomExerciseForm(true);
                        setCustomExerciseData({
                          name: '',
                          category: 'strength',
                          muscleGroups: [],
                          instructions: [],
                          equipment: []
                        });
                      }}
                      className="px-4 py-2 bg-lime-500 text-black font-semibold rounded-lg hover:bg-lime-400 transition-all duration-200 text-sm whitespace-nowrap"
                    >
                      + Custom
                    </button>
                  </div>

                  {/* Exercise List */}
                  <div className="space-y-2">
                    {availableExercises
                      .filter(ex => ex.name.toLowerCase().includes(exerciseSearchQuery.toLowerCase()))
                      .map((exercise) => (
                        <button
                          key={exercise.id}
                          onClick={() => {
                            const newExercise = {
                              exerciseId: exercise.id,
                              exerciseName: exercise.name,
                              isCustom: false,
                              sets: 3,
                              reps: '8-12',
                              rest: 60,
                              notes: ''
                            };
                            
                            const newDaysData = [...manualDaysData];
                            newDaysData[currentDayIndex].exercises.push(newExercise);
                            setManualDaysData(newDaysData);
                            setShowExerciseSelector(false);
                            setExerciseSearchQuery('');
                          }}
                          className="w-full p-3 bg-gray-800/80 border border-gray-700/50 rounded-lg text-left hover:bg-gray-700/80 transition-all duration-200"
                        >
                          <div className="font-medium text-white text-sm">{exercise.name}</div>
                          <div className="text-xs text-gray-400 mt-1">
                            {exercise.category} • {exercise.muscleGroups.join(', ')}
                          </div>
                        </button>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Custom Exercise Form Modal */}
          {showCustomExerciseForm && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[70]">
              <div className="bg-gray-900/95 border border-gray-700/50 rounded-xl w-full max-w-md max-h-[90vh] overflow-hidden shadow-2xl">
                <div className="p-4 border-b border-gray-700/50">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-white">
                      Create Custom Exercise
                    </h3>
                    <button
                      onClick={() => setShowCustomExerciseForm(false)}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
                  {/* Exercise Name */}
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Exercise Name *</label>
                    <input
                      type="text"
                      value={customExerciseData.name}
                      onChange={(e) => setCustomExerciseData({...customExerciseData, name: e.target.value})}
                      placeholder="e.g., My Custom Squat Variation"
                      className="w-full px-3 py-2 bg-gray-800/80 border border-gray-700/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent text-sm"
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Category</label>
                    <div className="relative">
                      <button
                        onClick={() => setShowCategoryPicker(!showCategoryPicker)}
                        className="w-full px-3 py-2 bg-gray-800/80 border border-gray-700/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent text-sm flex items-center justify-between"
                      >
                        <span className="capitalize">{customExerciseData.category}</span>
                        <svg className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${showCategoryPicker ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      
                      {showCategoryPicker && (
                        <div className="absolute z-50 w-full mt-1 bg-gray-800/95 border border-gray-700/50 rounded-lg shadow-2xl max-h-48 overflow-hidden">
                          <div className="max-h-48 overflow-y-auto">
                            {[
                              { value: 'strength', label: 'Strength Training', description: 'Building muscle and power' },
                              { value: 'cardio', label: 'Cardiovascular', description: 'Improving heart health and endurance' },
                              { value: 'flexibility', label: 'Flexibility & Mobility', description: 'Stretching and range of motion' },
                              { value: 'core', label: 'Core & Stability', description: 'Abdominal and core strength' },
                              { value: 'isolation', label: 'Isolation', description: 'Targeting specific muscle groups' },
                              { value: 'compound', label: 'Compound Movements', description: 'Multi-joint functional exercises' },
                              { value: 'bodyweight', label: 'Bodyweight', description: 'No equipment required' },
                              { value: 'plyometric', label: 'Plyometric', description: 'Explosive power training' }
                            ].map((category) => (
                              <button
                                key={category.value}
                                onClick={() => {
                                  setCustomExerciseData({...customExerciseData, category: category.value});
                                  setShowCategoryPicker(false);
                                }}
                                className={`w-full p-3 text-left transition-all duration-200 hover:bg-gray-700/80 ${
                                  customExerciseData.category === category.value 
                                    ? 'bg-lime-900/20 border-l-4 border-lime-500' 
                                    : 'border-l-4 border-transparent'
                                }`}
                              >
                                <div className="flex items-center space-x-3">
                                  <div className="flex-1">
                                    <div className="font-medium text-white text-sm">{category.label}</div>
                                    <div className="text-xs text-gray-400">{category.description}</div>
                                  </div>
                                  {customExerciseData.category === category.value && (
                                    <svg className="w-4 h-4 text-lime-400" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  )}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Muscle Groups */}
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Target Muscles</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['chest', 'back', 'shoulders', 'biceps', 'triceps', 'abs', 'obliques', 'quadriceps', 'hamstrings', 'glutes', 'calves'].map((muscle) => (
                        <label key={muscle} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={customExerciseData.muscleGroups.includes(muscle)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setCustomExerciseData({
                                  ...customExerciseData,
                                  muscleGroups: [...customExerciseData.muscleGroups, muscle]
                                });
                              } else {
                                setCustomExerciseData({
                                  ...customExerciseData,
                                  muscleGroups: customExerciseData.muscleGroups.filter(m => m !== muscle)
                                });
                              }
                            }}
                            className="rounded border-gray-600 text-lime-500 focus:ring-lime-500 focus:ring-offset-gray-800"
                          />
                          <span className="text-sm text-gray-300 capitalize">{muscle}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Equipment */}
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Equipment</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['bodyweight', 'dumbbell', 'barbell', 'cable', 'machine', 'resistance band', 'kettlebell'].map((equipment) => (
                        <label key={equipment} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={customExerciseData.equipment.includes(equipment)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setCustomExerciseData({
                                  ...customExerciseData,
                                  equipment: [...customExerciseData.equipment, equipment]
                                });
                              } else {
                                setCustomExerciseData({
                                  ...customExerciseData,
                                  equipment: customExerciseData.equipment.filter(eq => eq !== equipment)
                                });
                              }
                            }}
                            className="rounded border-gray-600 text-lime-500 focus:ring-lime-500 focus:ring-offset-gray-800"
                          />
                          <span className="text-sm text-gray-300 capitalize">{equipment}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Instructions */}
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Instructions (Optional)</label>
                    <textarea
                      value={customExerciseData.instructions.join('\n')}
                      onChange={(e) => setCustomExerciseData({
                        ...customExerciseData,
                        instructions: e.target.value.split('\n').filter(line => line.trim())
                      })}
                      placeholder="Enter step-by-step instructions, one per line..."
                      rows={4}
                      className="w-full px-3 py-2 bg-gray-800/80 border border-gray-700/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent text-sm resize-none"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-3 pt-4">
                    <button
                      onClick={() => {
                        if (customExerciseData.name.trim()) {
                          const customExercise = {
                            exerciseId: `custom-${Date.now()}`,
                            exerciseName: customExerciseData.name,
                            isCustom: true,
                            sets: 3,
                            reps: '8-12',
                            rest: 60,
                            notes: `Custom ${customExerciseData.category} exercise targeting ${customExerciseData.muscleGroups.join(', ')}`
                          };
                          
                          const newDaysData = [...manualDaysData];
                          newDaysData[currentDayIndex].exercises.push(customExercise);
                          setManualDaysData(newDaysData);
                          setShowCustomExerciseForm(false);
                          setShowExerciseSelector(false);
                        }
                      }}
                      disabled={!customExerciseData.name.trim()}
                      className="flex-1 px-4 py-2 bg-lime-500 text-black font-semibold rounded-lg hover:bg-lime-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      Create Exercise
                    </button>
                    <button
                      onClick={() => setShowCustomExerciseForm(false)}
                      className="px-4 py-2 border-2 border-gray-700 rounded-lg text-gray-300 hover:border-gray-600 transition-all duration-200 text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Exercise Editor Modal */}
          {showExerciseEditor && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[80]">
              <div className="bg-gray-900/95 border border-gray-700/50 rounded-xl w-full max-w-md max-h-[90vh] overflow-hidden shadow-2xl">
                <div className="p-4 border-b border-gray-700/50">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-white">
                      Edit Exercise
                    </h3>
                    <button
                      onClick={() => setShowExerciseEditor(false)}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
                  {(() => {
                    const currentExercise = manualDaysData[currentDayIndex]?.exercises[currentExerciseIndex];
                    if (!currentExercise) return null;

                    return (
                      <>
                        {/* Exercise Name */}
                        <div>
                          <label className="block text-sm text-gray-300 mb-2">Exercise Name</label>
                          <input
                            type="text"
                            value={currentExercise.exerciseName}
                            onChange={(e) => {
                              const newDaysData = [...manualDaysData];
                              newDaysData[currentDayIndex].exercises[currentExerciseIndex].exerciseName = e.target.value;
                              setManualDaysData(newDaysData);
                            }}
                            className="w-full px-3 py-2 bg-gray-800/80 border border-gray-700/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent text-sm"
                          />
                        </div>

                        {/* Sets */}
                        <div>
                          <label className="block text-sm text-gray-300 mb-2">Sets</label>
                          <input
                            type="number"
                            min="1"
                            max="20"
                            value={currentExercise.sets}
                            onChange={(e) => {
                              const newDaysData = [...manualDaysData];
                              newDaysData[currentDayIndex].exercises[currentExerciseIndex].sets = parseInt(e.target.value) || 1;
                              setManualDaysData(newDaysData);
                            }}
                            className="w-full px-3 py-2 bg-gray-800/80 border border-gray-700/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent text-sm"
                          />
                        </div>

                        {/* Reps */}
                        <div>
                          <label className="block text-sm text-gray-300 mb-2">Reps</label>
                          <input
                            type="text"
                            value={currentExercise.reps}
                            onChange={(e) => {
                              const newDaysData = [...manualDaysData];
                              newDaysData[currentDayIndex].exercises[currentExerciseIndex].reps = e.target.value;
                              setManualDaysData(newDaysData);
                            }}
                            placeholder="e.g., 8-12, 15, 5-8"
                            className="w-full px-3 py-2 bg-gray-800/80 border border-gray-700/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent text-sm"
                          />
                        </div>

                        {/* Rest Time */}
                        <div>
                          <label className="block text-sm text-gray-300 mb-2">Rest Time (seconds)</label>
                          <input
                            type="number"
                            min="0"
                            max="300"
                            value={currentExercise.rest}
                            onChange={(e) => {
                              const newDaysData = [...manualDaysData];
                              newDaysData[currentDayIndex].exercises[currentExerciseIndex].rest = parseInt(e.target.value) || 0;
                              setManualDaysData(newDaysData);
                            }}
                            className="w-full px-3 py-2 bg-gray-800/80 border border-gray-700/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent text-sm"
                          />
                        </div>

                        {/* Notes */}
                        <div>
                          <label className="block text-sm text-gray-300 mb-2">Notes (Optional)</label>
                          <textarea
                            value={currentExercise.notes || ''}
                            onChange={(e) => {
                              const newDaysData = [...manualDaysData];
                              newDaysData[currentDayIndex].exercises[currentExerciseIndex].notes = e.target.value;
                              setManualDaysData(newDaysData);
                            }}
                            placeholder="Add any notes or instructions..."
                            rows={3}
                            className="w-full px-3 py-2 bg-gray-800/80 border border-gray-700/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent text-sm resize-none"
                          />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex space-x-3 pt-4">
                          <button
                            onClick={() => setShowExerciseEditor(false)}
                            className="flex-1 px-4 py-2 bg-lime-500 text-black font-semibold rounded-lg hover:bg-lime-400 transition-all duration-200 text-sm"
                          >
                            Save Changes
                          </button>
                          <button
                            onClick={() => setShowExerciseEditor(false)}
                            className="px-4 py-2 border-2 border-gray-700 rounded-lg text-gray-300 hover:border-gray-600 transition-all duration-200 text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </div>
    </div>
  );
};

export default TemplateSelector;
