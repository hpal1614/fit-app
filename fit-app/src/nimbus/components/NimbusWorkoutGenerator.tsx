import React, { useState } from 'react';
import { ArrowLeft, Zap, Dumbbell, Target, Clock, Calendar, AlertCircle, ChevronRight, RefreshCw } from 'lucide-react';
import { NimbusCard } from './NimbusCard';
import { NimbusButton } from './NimbusButton';
import { nimbusWorkoutGenerator, WorkoutGenerationConfig, GeneratedWorkout } from '../services/NimbusWorkoutGenerator';
import type { WorkoutPlan } from '../../types/workout';

interface NimbusWorkoutGeneratorProps {
  onGenerate: (plan: WorkoutPlan) => Promise<void>;
  onBack: () => void;
}

export const NimbusWorkoutGenerator: React.FC<NimbusWorkoutGeneratorProps> = ({
  onGenerate,
  onBack
}) => {
  const [step, setStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedWorkout, setGeneratedWorkout] = useState<GeneratedWorkout | null>(null);
  const [showAlternatives, setShowAlternatives] = useState<string | null>(null);
  
  const [config, setConfig] = useState<WorkoutGenerationConfig>({
    experienceLevel: 'intermediate',
    goals: [],
    daysPerWeek: 3,
    sessionDuration: 60,
    equipment: [],
    limitations: [],
    preferences: {
      includeCardio: false,
      includeStretching: true
    }
  });

  const availableGoals = [
    { id: 'strength', label: 'Build Strength', icon: '💪' },
    { id: 'muscle', label: 'Build Muscle', icon: '🏋️' },
    { id: 'endurance', label: 'Improve Endurance', icon: '🏃' },
    { id: 'weight-loss', label: 'Lose Weight', icon: '⚖️' },
    { id: 'flexibility', label: 'Increase Flexibility', icon: '🧘' },
    { id: 'athletic', label: 'Athletic Performance', icon: '⚡' }
  ];

  const availableEquipment = [
    'Barbell', 'Dumbbells', 'Kettlebells', 'Pull-up Bar', 
    'Resistance Bands', 'Cable Machine', 'Squat Rack', 
    'Bench', 'Treadmill', 'Bodyweight Only'
  ];

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const workout = await nimbusWorkoutGenerator.generateWorkoutPlan(config);
      setGeneratedWorkout(workout);
      setStep(5); // Go to review step
    } catch (error) {
      console.error('Failed to generate workout:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleConfirmPlan = async () => {
    if (generatedWorkout) {
      await onGenerate(generatedWorkout.plan);
    }
  };

  const renderProgressBar = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-2">
        {[1, 2, 3, 4].map((num) => (
          <div
            key={num}
            className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors ${
              step >= num
                ? 'bg-primary-500 text-white'
                : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-500'
            }`}
          >
            {num}
          </div>
        ))}
      </div>
      <div className="relative h-1 bg-neutral-200 dark:bg-neutral-700 rounded-full">
        <div
          className="absolute top-0 left-0 h-full bg-primary-500 rounded-full transition-all duration-300"
          style={{ width: `${((step - 1) / 3) * 100}%` }}
        />
      </div>
    </div>
  );

  if (isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-primary-200 rounded-full" />
          <div className="absolute top-0 left-0 w-20 h-20 border-4 border-primary-500 rounded-full animate-spin border-t-transparent" />
        </div>
        <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mt-6 mb-2">
          Nimbus AI is crafting your perfect workout...
        </h3>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center max-w-md">
          Analyzing your goals, experience, and equipment to create a personalized plan with smart alternatives
        </p>
      </div>
    );
  }

  // Step 5: Review generated plan
  if (step === 5 && generatedWorkout) {
    const { plan, alternatives, progressionStrategy, estimatedCalories, difficulty } = generatedWorkout;
    
    return (
      <div className="h-full overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <button onClick={() => setStep(4)} className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white">
              <ArrowLeft size={20} />
              <span>Back to options</span>
            </button>
            <NimbusButton
              variant="ghost"
              size="sm"
              icon={<RefreshCw className="w-4 h-4" />}
              onClick={handleGenerate}
            >
              Regenerate
            </NimbusButton>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
              {plan.name}
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400">
              {plan.description}
            </p>
          </div>

          {/* Plan overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <NimbusCard variant="bordered" padding="sm">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary-500" />
                <div>
                  <p className="text-xs text-neutral-500">Duration</p>
                  <p className="font-semibold">{plan.duration} weeks</p>
                </div>
              </div>
            </NimbusCard>
            
            <NimbusCard variant="bordered" padding="sm">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-secondary-500" />
                <div>
                  <p className="text-xs text-neutral-500">Difficulty</p>
                  <p className="font-semibold">{difficulty}/10</p>
                </div>
              </div>
            </NimbusCard>
            
            <NimbusCard variant="bordered" padding="sm">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                <div>
                  <p className="text-xs text-neutral-500">Est. Calories</p>
                  <p className="font-semibold">{estimatedCalories}</p>
                </div>
              </div>
            </NimbusCard>
            
            <NimbusCard variant="bordered" padding="sm">
              <div className="flex items-center gap-2">
                <Dumbbell className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-xs text-neutral-500">Progression</p>
                  <p className="font-semibold capitalize">{progressionStrategy.type}</p>
                </div>
              </div>
            </NimbusCard>
          </div>

          {/* Workout days */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
              Weekly Schedule
            </h3>
            
            {plan.schedule.map((day) => (
              <NimbusCard key={day.day} variant="bordered" className="overflow-hidden">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-neutral-900 dark:text-white">
                      Day {day.day}: {day.name}
                    </h4>
                    <span className="text-sm text-neutral-500">
                      {day.exercises.length} exercises
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    {day.exercises.slice(0, 3).map((exercise) => (
                      <div key={exercise.id} className="flex items-center justify-between py-2 border-b border-neutral-100 dark:border-neutral-800 last:border-0">
                        <div className="flex-1">
                          <p className="font-medium text-neutral-800 dark:text-neutral-200">
                            {exercise.name}
                          </p>
                          <p className="text-sm text-neutral-500">
                            {exercise.sets} sets × {exercise.reps} reps • Rest: {exercise.rest}s
                          </p>
                        </div>
                        
                        {alternatives.has(exercise.id) && (
                          <NimbusButton
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowAlternatives(
                              showAlternatives === exercise.id ? null : exercise.id
                            )}
                          >
                            {alternatives.get(exercise.id)!.length} alts
                          </NimbusButton>
                        )}
                      </div>
                    ))}
                    
                    {/* Show alternatives dropdown */}
                    {showAlternatives && day.exercises.find(e => e.id === showAlternatives) && (
                      <div className="mt-2 p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                        <p className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-2">
                          Alternative Exercises:
                        </p>
                        <div className="space-y-1">
                          {alternatives.get(showAlternatives)?.slice(0, 3).map((alt) => (
                            <div key={alt.id} className="flex items-center justify-between text-sm">
                              <span className="text-neutral-700 dark:text-neutral-300">
                                {alt.name}
                              </span>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                alt.difficulty === 'easier' 
                                  ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                                  : alt.difficulty === 'harder'
                                  ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                                  : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                              }`}>
                                {alt.difficulty}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {day.exercises.length > 3 && (
                    <p className="text-sm text-neutral-500 mt-2">
                      +{day.exercises.length - 3} more exercises
                    </p>
                  )}
                </div>
              </NimbusCard>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 mt-6">
            <NimbusButton
              variant="ghost"
              fullWidth
              onClick={() => setStep(4)}
            >
              Modify Plan
            </NimbusButton>
            <NimbusButton
              variant="primary"
              fullWidth
              onClick={handleConfirmPlan}
            >
              Start This Plan
            </NimbusButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center mb-6">
        <button onClick={onBack} className="mr-3">
          <ArrowLeft size={24} className="text-neutral-600 dark:text-neutral-400" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
            Nimbus AI Workout Generator
          </h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Let's create your perfect training plan
          </p>
        </div>
      </div>

      {renderProgressBar()}

      {/* Step 1: Experience Level */}
      {step === 1 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">What's your fitness experience?</h3>
          <div className="space-y-3">
            {[
              { value: 'beginner', label: 'Beginner', desc: 'New to fitness or returning after a break' },
              { value: 'intermediate', label: 'Intermediate', desc: '6+ months of consistent training' },
              { value: 'advanced', label: 'Advanced', desc: '2+ years of serious training' }
            ].map((level) => (
              <NimbusCard
                key={level.value}
                variant={config.experienceLevel === level.value ? 'bordered' : 'default'}
                interactive
                onClick={() => setConfig(prev => ({ ...prev, experienceLevel: level.value as any }))}
                className={config.experienceLevel === level.value ? 'ring-2 ring-primary-500' : ''}
              >
                <div>
                  <div className="font-medium">{level.label}</div>
                  <div className="text-sm text-neutral-500 dark:text-neutral-400">
                    {level.desc}
                  </div>
                </div>
              </NimbusCard>
            ))}
          </div>
          
          <NimbusButton
            variant="primary"
            fullWidth
            onClick={() => setStep(2)}
          >
            Next
          </NimbusButton>
        </div>
      )}

      {/* Step 2: Goals */}
      {step === 2 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">What are your fitness goals?</h3>
          <p className="text-sm text-neutral-500">Select all that apply</p>
          
          <div className="grid grid-cols-2 gap-3">
            {availableGoals.map((goal) => {
              const isSelected = config.goals.includes(goal.id);
              
              return (
                <NimbusCard
                  key={goal.id}
                  variant={isSelected ? 'bordered' : 'default'}
                  interactive
                  onClick={() => {
                    setConfig(prev => ({
                      ...prev,
                      goals: isSelected
                        ? prev.goals.filter(g => g !== goal.id)
                        : [...prev.goals, goal.id]
                    }));
                  }}
                  className={isSelected ? 'ring-2 ring-primary-500' : ''}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-1">{goal.icon}</div>
                    <div className="text-sm font-medium">{goal.label}</div>
                  </div>
                </NimbusCard>
              );
            })}
          </div>
          
          <NimbusButton
            variant="primary"
            fullWidth
            onClick={() => setStep(3)}
            disabled={config.goals.length === 0}
          >
            Next
          </NimbusButton>
        </div>
      )}

      {/* Step 3: Schedule & Equipment */}
      {step === 3 && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold">Training Schedule</h3>
          
          <div>
            <label className="block text-sm font-medium mb-2">
              Days per week
            </label>
            <div className="flex gap-2">
              {[2, 3, 4, 5, 6].map((days) => (
                <NimbusButton
                  key={days}
                  variant={config.daysPerWeek === days ? 'primary' : 'ghost'}
                  onClick={() => setConfig(prev => ({ ...prev, daysPerWeek: days }))}
                >
                  {days}
                </NimbusButton>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">
              Session duration (minutes)
            </label>
            <div className="flex gap-2">
              {[30, 45, 60, 75, 90].map((duration) => (
                <NimbusButton
                  key={duration}
                  variant={config.sessionDuration === duration ? 'primary' : 'ghost'}
                  onClick={() => setConfig(prev => ({ ...prev, sessionDuration: duration }))}
                >
                  {duration}
                </NimbusButton>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">
              Available equipment
            </label>
            <div className="flex flex-wrap gap-2">
              {availableEquipment.map((item) => {
                const isSelected = config.equipment.includes(item);
                
                return (
                  <button
                    key={item}
                    onClick={() => {
                      setConfig(prev => ({
                        ...prev,
                        equipment: isSelected
                          ? prev.equipment.filter(e => e !== item)
                          : [...prev.equipment, item]
                      }));
                    }}
                    className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                      isSelected
                        ? 'bg-primary-500 text-white'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                    }`}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
          </div>
          
          <NimbusButton
            variant="primary"
            fullWidth
            onClick={() => setStep(4)}
          >
            Next
          </NimbusButton>
        </div>
      )}

      {/* Step 4: Limitations & Preferences */}
      {step === 4 && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold">Any limitations or preferences?</h3>
          
          <div>
            <label className="block text-sm font-medium mb-2">
              Physical limitations or injuries
            </label>
            <textarea
              className="w-full px-3 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
              rows={3}
              placeholder="e.g., Bad knees, lower back issues..."
              onChange={(e) => {
                const limitations = e.target.value.split(',').map(l => l.trim()).filter(Boolean);
                setConfig(prev => ({ ...prev, limitations }));
              }}
            />
          </div>
          
          <div className="space-y-3">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={config.preferences?.includeCardio}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  preferences: { ...prev.preferences, includeCardio: e.target.checked }
                }))}
                className="w-4 h-4 rounded text-primary-500"
              />
              <span className="text-sm">Include cardio exercises</span>
            </label>
            
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={config.preferences?.includeStretching}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  preferences: { ...prev.preferences, includeStretching: e.target.checked }
                }))}
                className="w-4 h-4 rounded text-primary-500"
              />
              <span className="text-sm">Include stretching/mobility work</span>
            </label>
          </div>
          
          <NimbusButton
            variant="primary"
            fullWidth
            onClick={handleGenerate}
            icon={<Zap className="w-4 h-4" />}
          >
            Generate AI Workout Plan
          </NimbusButton>
        </div>
      )}
    </div>
  );
};