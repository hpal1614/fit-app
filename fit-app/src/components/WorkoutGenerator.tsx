import React, { useState } from 'react';
import {
  Dumbbell,
  Target,
  Clock,
  ChevronRight,
  Sparkles,
  Zap,
  Flame,
  Heart,
  Timer,
  CheckCircle,
  Play,
  X
} from 'lucide-react';
import {
  workoutGeneratorService,
  WorkoutGoal,
  ExperienceLevel,
  EquipmentType,
  WorkoutPlan
} from '../services/workoutGeneratorService';

export const WorkoutGenerator: React.FC = () => {
  const [step, setStep] = useState<'config' | 'workout'>('config');
  const [selectedGoal, setSelectedGoal] = useState<WorkoutGoal>('hypertrophy');
  const [selectedExperience, setSelectedExperience] = useState<ExperienceLevel>('intermediate');
  const [selectedDuration, setSelectedDuration] = useState(45);
  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentType[]>(['dumbbells']);
  const [generatedWorkout, setGeneratedWorkout] = useState<WorkoutPlan | null>(null);
  const [showQuickWorkouts, setShowQuickWorkouts] = useState(true);

  const goals: { value: WorkoutGoal; label: string; icon: React.ReactNode; description: string }[] = [
    {
      value: 'strength',
      label: 'Strength',
      icon: <Dumbbell className="w-5 h-5" />,
      description: 'Heavy weights, low reps'
    },
    {
      value: 'hypertrophy',
      label: 'Muscle Growth',
      icon: <Target className="w-5 h-5" />,
      description: 'Moderate weights, medium reps'
    },
    {
      value: 'endurance',
      label: 'Endurance',
      icon: <Heart className="w-5 h-5" />,
      description: 'Light weights, high reps'
    },
    {
      value: 'fat_loss',
      label: 'Fat Loss',
      icon: <Flame className="w-5 h-5" />,
      description: 'Circuit training, minimal rest'
    },
    {
      value: 'athletic',
      label: 'Athletic',
      icon: <Zap className="w-5 h-5" />,
      description: 'Power and explosiveness'
    }
  ];

  const experienceLevels: { value: ExperienceLevel; label: string; description: string }[] = [
    { value: 'beginner', label: 'Beginner', description: '0-6 months' },
    { value: 'intermediate', label: 'Intermediate', description: '6-24 months' },
    { value: 'advanced', label: 'Advanced', description: '2+ years' }
  ];

  const equipment: { value: EquipmentType; label: string; icon: string }[] = [
    { value: 'none', label: 'Bodyweight', icon: '🤸' },
    { value: 'dumbbells', label: 'Dumbbells', icon: '🏋️' },
    { value: 'barbell', label: 'Barbell', icon: '🏋️‍♂️' },
    { value: 'resistance_bands', label: 'Bands', icon: '🔗' },
    { value: 'machines', label: 'Machines', icon: '⚙️' },
    { value: 'cables', label: 'Cables', icon: '🎯' }
  ];

  const handleGenerateWorkout = () => {
    const workout = workoutGeneratorService.generateWorkout({
      goal: selectedGoal,
      experience: selectedExperience,
      duration: selectedDuration,
      equipment: selectedEquipment
    });
    setGeneratedWorkout(workout);
    setStep('workout');
  };

  const handleQuickWorkout = (type: string, duration: number) => {
    // Generate quick workout based on type
    let goal: WorkoutGoal = 'hypertrophy';
    let equipment: EquipmentType[] = ['dumbbells', 'none'];

    switch(type) {
      case 'full_body':
        goal = 'hypertrophy';
        break;
      case 'upper':
      case 'lower':
        goal = 'strength';
        break;
      case 'core':
        goal = 'endurance';
        equipment = ['none'];
        break;
      case 'hiit':
        goal = 'fat_loss';
        equipment = ['none'];
        break;
    }

    const workout = workoutGeneratorService.generateWorkout({
      goal,
      experience: selectedExperience,
      duration,
      equipment
    });
    setGeneratedWorkout(workout);
    setStep('workout');
  };

  const quickWorkouts = workoutGeneratorService.getQuickWorkouts();

  if (step === 'workout' && generatedWorkout) {
    return (
      <div className="bg-gray-900 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-500" />
            {generatedWorkout.name}
          </h2>
          <button
            onClick={() => {
              setStep('config');
              setGeneratedWorkout(null);
            }}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Workout Info */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <Clock className="w-6 h-6 mx-auto mb-2 text-blue-500" />
            <p className="text-sm text-gray-400">Duration</p>
            <p className="font-semibold">{generatedWorkout.duration} min</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <Target className="w-6 h-6 mx-auto mb-2 text-green-500" />
            <p className="text-sm text-gray-400">Goal</p>
            <p className="font-semibold capitalize">{generatedWorkout.goal.replace('_', ' ')}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <Dumbbell className="w-6 h-6 mx-auto mb-2 text-purple-500" />
            <p className="text-sm text-gray-400">Exercises</p>
            <p className="font-semibold">{generatedWorkout.exercises.length}</p>
          </div>
        </div>

        {/* Warmup */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 text-gray-300">Warmup</h3>
          <div className="bg-gray-800 rounded-lg p-4">
            <ul className="space-y-2">
              {generatedWorkout.warmup.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  <span className="text-sm text-gray-300">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Main Workout */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 text-gray-300">Workout</h3>
          <div className="space-y-4">
            {generatedWorkout.exercises.map((exercise, idx) => (
              <div key={exercise.id} className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-white flex items-center gap-2">
                      <span className="text-purple-500">{idx + 1}.</span>
                      {exercise.name}
                    </h4>
                    <p className="text-sm text-gray-400 mt-1">
                      {exercise.muscleGroups.join(', ')} • {exercise.equipment || 'bodyweight'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-purple-400">
                      {exercise.sets} × {exercise.reps}
                    </p>
                    <p className="text-sm text-gray-400">
                      Rest: {exercise.rest}s
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <details className="cursor-pointer">
                    <summary className="text-sm text-gray-400 hover:text-gray-300">
                      Instructions & Tips
                    </summary>
                    <div className="mt-2 space-y-2">
                      <div>
                        <p className="text-xs font-semibold text-gray-500 mb-1">Instructions:</p>
                        <ul className="space-y-1">
                          {exercise.instructions.map((instruction, i) => (
                            <li key={i} className="text-sm text-gray-400 flex items-start gap-2">
                              <span className="text-purple-500">{i + 1}.</span>
                              {instruction}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 mb-1">Tips:</p>
                        <ul className="space-y-1">
                          {exercise.tips.map((tip, i) => (
                            <li key={i} className="text-sm text-gray-400 flex items-start gap-2">
                              <span className="text-purple-500">•</span>
                              {tip}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </details>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cooldown */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 text-gray-300">Cooldown</h3>
          <div className="bg-gray-800 rounded-lg p-4">
            <ul className="space-y-2">
              {generatedWorkout.cooldown.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-500 mt-0.5" />
                  <span className="text-sm text-gray-300">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 rounded-lg p-4 border border-purple-800/30">
          <p className="text-sm text-gray-300">
            <span className="font-semibold text-purple-400">Pro Tip:</span> {generatedWorkout.notes}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6">
          <button className="flex-1 bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
            <Play className="w-5 h-5" />
            Start Workout
          </button>
          <button className="px-6 py-3 rounded-lg font-medium bg-gray-800 hover:bg-gray-700 transition-colors">
            Save for Later
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-xl p-6">
      <h2 className="text-2xl font-bold mb-6 text-white flex items-center gap-2">
        <Sparkles className="w-6 h-6 text-purple-500" />
        AI Workout Generator
      </h2>

      {/* Quick Workouts */}
      {showQuickWorkouts && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 text-gray-300">Quick Workouts</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {quickWorkouts.map((qw) => (
              <button
                key={qw.name}
                onClick={() => handleQuickWorkout(qw.type, qw.duration)}
                className="bg-gray-800 hover:bg-gray-700 rounded-lg p-4 transition-colors text-left group"
              >
                <p className="font-medium text-white group-hover:text-purple-400 transition-colors">
                  {qw.name}
                </p>
                <p className="text-sm text-gray-400 flex items-center gap-1 mt-1">
                  <Clock className="w-4 h-4" />
                  {qw.duration} min
                </p>
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowQuickWorkouts(false)}
            className="text-sm text-gray-500 hover:text-gray-400 mt-3"
          >
            Hide quick workouts
          </button>
        </div>
      )}

      {/* Custom Workout Builder */}
      <div className="space-y-6">
        {/* Goal Selection */}
        <div>
          <h3 className="text-lg font-semibold mb-3 text-gray-300">Training Goal</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {goals.map((goal) => (
              <button
                key={goal.value}
                onClick={() => setSelectedGoal(goal.value)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedGoal === goal.value
                    ? 'border-purple-500 bg-purple-900/30'
                    : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                }`}
              >
                <div className="flex flex-col items-center text-center">
                  <div className={`mb-2 ${selectedGoal === goal.value ? 'text-purple-400' : 'text-gray-400'}`}>
                    {goal.icon}
                  </div>
                  <p className="font-medium text-white">{goal.label}</p>
                  <p className="text-xs text-gray-400 mt-1">{goal.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Experience Level */}
        <div>
          <h3 className="text-lg font-semibold mb-3 text-gray-300">Experience Level</h3>
          <div className="grid grid-cols-3 gap-3">
            {experienceLevels.map((level) => (
              <button
                key={level.value}
                onClick={() => setSelectedExperience(level.value)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedExperience === level.value
                    ? 'border-purple-500 bg-purple-900/30'
                    : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                }`}
              >
                <p className="font-medium text-white">{level.label}</p>
                <p className="text-sm text-gray-400">{level.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Duration */}
        <div>
          <h3 className="text-lg font-semibold mb-3 text-gray-300">
            Duration: {selectedDuration} minutes
          </h3>
          <div className="bg-gray-800 rounded-lg p-4">
            <input
              type="range"
              min="15"
              max="120"
              step="15"
              value={selectedDuration}
              onChange={(e) => setSelectedDuration(Number(e.target.value))}
              className="w-full accent-purple-500"
            />
            <div className="flex justify-between text-sm text-gray-400 mt-2">
              <span>15 min</span>
              <span>60 min</span>
              <span>120 min</span>
            </div>
          </div>
        </div>

        {/* Equipment */}
        <div>
          <h3 className="text-lg font-semibold mb-3 text-gray-300">Available Equipment</h3>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {equipment.map((eq) => (
              <button
                key={eq.value}
                onClick={() => {
                  setSelectedEquipment(prev =>
                    prev.includes(eq.value)
                      ? prev.filter(e => e !== eq.value)
                      : [...prev, eq.value]
                  );
                }}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedEquipment.includes(eq.value)
                    ? 'border-purple-500 bg-purple-900/30'
                    : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                }`}
              >
                <p className="text-2xl mb-1">{eq.icon}</p>
                <p className="text-sm text-white">{eq.label}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerateWorkout}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-6 py-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2"
        >
          <Sparkles className="w-5 h-5" />
          Generate Custom Workout
        </button>
      </div>
    </div>
  );
};