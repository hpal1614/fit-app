import React, { useState } from 'react';
import { WorkoutGeneratorService, WorkoutGoal, AvailableEquipment, GeneratedWorkout } from '../services/WorkoutGeneratorService';

export const WorkoutGenerator: React.FC = () => {
  const [workoutGoal, setWorkoutGoal] = useState<WorkoutGoal>({
    type: 'general-fitness',
    timeline: 'medium-term',
    experience: 'intermediate'
  });
  
  const [equipment, setEquipment] = useState<AvailableEquipment>({
    freeWeights: true,
    machines: false,
    cardioEquipment: false,
    bodyweightOnly: false,
    resistanceBands: false,
    kettlebells: false
  });
  
  const [timeAvailable, setTimeAvailable] = useState(60);
  const [generatedWorkout, setGeneratedWorkout] = useState<GeneratedWorkout | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const workoutGenerator = new WorkoutGeneratorService();

  const handleGenerateWorkout = async () => {
    setIsGenerating(true);
    
    // Simulate some processing time
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const workout = workoutGenerator.generateWorkout(workoutGoal, equipment, timeAvailable);
    setGeneratedWorkout(workout);
    setIsGenerating(false);
  };

  const handleQuickWorkout = async (focus: 'upper' | 'lower' | 'full-body' | 'core') => {
    setIsGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const workout = workoutGenerator.generateQuickWorkout(timeAvailable, equipment, focus);
    setGeneratedWorkout(workout);
    setIsGenerating(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">🎯 Intelligent Workout Generator</h1>
        <p className="text-gray-600">AI-powered workout creation based on your goals and equipment</p>
      </div>

      {!generatedWorkout ? (
        <div className="space-y-6">
          {/* Quick Workout Options */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold mb-4">Quick Workouts</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { key: 'full-body', label: 'Full Body', icon: '💪' },
                { key: 'upper', label: 'Upper Body', icon: '🏋️' },
                { key: 'lower', label: 'Lower Body', icon: '🦵' },
                { key: 'core', label: 'Core', icon: '🎯' }
              ].map((option) => (
                <button
                  key={option.key}
                  onClick={() => handleQuickWorkout(option.key as any)}
                  disabled={isGenerating}
                  className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg border border-indigo-200 hover:from-indigo-100 hover:to-purple-100 transition-colors disabled:opacity-50"
                >
                  <div className="text-2xl mb-2">{option.icon}</div>
                  <div className="font-medium text-gray-900">{option.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Workout Builder */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold mb-4">Custom Workout</h2>
            
            {/* Goal Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">Primary Goal</label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {[
                  { key: 'strength', label: 'Strength', icon: '💪' },
                  { key: 'hypertrophy', label: 'Muscle Growth', icon: '🏗️' },
                  { key: 'endurance', label: 'Endurance', icon: '🏃' },
                  { key: 'weight-loss', label: 'Weight Loss', icon: '🔥' },
                  { key: 'general-fitness', label: 'General Fitness', icon: '⚡' }
                ].map((goal) => (
                  <button
                    key={goal.key}
                    onClick={() => setWorkoutGoal(prev => ({ ...prev, type: goal.key as any }))}
                    className={`p-3 rounded-lg border-2 transition-colors ${
                      workoutGoal.type === goal.key
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-lg mb-1">{goal.icon}</div>
                    <div className="text-sm font-medium">{goal.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Experience Level */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">Experience Level</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: 'beginner', label: 'Beginner', desc: '< 6 months' },
                  { key: 'intermediate', label: 'Intermediate', desc: '6 months - 2 years' },
                  { key: 'advanced', label: 'Advanced', desc: '2+ years' }
                ].map((level) => (
                  <button
                    key={level.key}
                    onClick={() => setWorkoutGoal(prev => ({ ...prev, experience: level.key as any }))}
                    className={`p-3 rounded-lg border-2 transition-colors ${
                      workoutGoal.experience === level.key
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium">{level.label}</div>
                    <div className="text-xs text-gray-500">{level.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Available Equipment */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">Available Equipment</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { key: 'bodyweightOnly', label: 'Bodyweight Only', icon: '🤸' },
                  { key: 'freeWeights', label: 'Free Weights', icon: '🏋️' },
                  { key: 'machines', label: 'Machines', icon: '⚙️' },
                  { key: 'kettlebells', label: 'Kettlebells', icon: '⚫' },
                  { key: 'resistanceBands', label: 'Resistance Bands', icon: '🔗' },
                  { key: 'cardioEquipment', label: 'Cardio Equipment', icon: '🚴' }
                ].map((eq) => (
                  <label key={eq.key} className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={equipment[eq.key as keyof AvailableEquipment]}
                      onChange={(e) => setEquipment(prev => ({
                        ...prev,
                        [eq.key]: e.target.checked
                      }))}
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <span className="text-lg">{eq.icon}</span>
                    <span className="text-sm font-medium text-gray-700">{eq.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Time Available */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Time Available: {timeAvailable} minutes
              </label>
              <input
                type="range"
                min="15"
                max="120"
                step="15"
                value={timeAvailable}
                onChange={(e) => setTimeAvailable(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>15 min</span>
                <span>60 min</span>
                <span>120 min</span>
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerateWorkout}
              disabled={isGenerating}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 px-6 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Generating Your Perfect Workout...
                </div>
              ) : (
                '🚀 Generate Custom Workout'
              )}
            </button>
          </div>
        </div>
      ) : (
        /* Generated Workout Display */
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{generatedWorkout.name}</h2>
              <p className="text-gray-600">
                {generatedWorkout.estimatedDuration} minutes • {generatedWorkout.exercises.length} exercises
              </p>
            </div>
            <button
              onClick={() => setGeneratedWorkout(null)}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors"
            >
              Generate New
            </button>
          </div>

          {/* Workout Overview */}
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div className="bg-indigo-50 p-4 rounded-lg">
              <div className="text-sm text-indigo-600 font-medium">Goal</div>
              <div className="text-lg font-semibold text-indigo-900 capitalize">
                {generatedWorkout.goal.type.replace('-', ' ')}
              </div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-sm text-green-600 font-medium">Experience</div>
              <div className="text-lg font-semibold text-green-900 capitalize">
                {generatedWorkout.goal.experience}
              </div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-sm text-purple-600 font-medium">Rest Between Sets</div>
              <div className="text-lg font-semibold text-purple-900">
                {generatedWorkout.restPeriods[0]}-{generatedWorkout.restPeriods[1]}s
              </div>
            </div>
          </div>

          {/* Exercises */}
          <div className="space-y-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Exercises</h3>
            {generatedWorkout.exercises.map((exercise, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{exercise.name}</h4>
                    <p className="text-sm text-gray-600 mb-2">
                      Targets: {exercise.primaryMuscles.join(', ')}
                    </p>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {exercise.sets} sets
                      </span>
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                        {exercise.reps} reps
                      </span>
                      <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">
                        {exercise.restBetweenSets}s rest
                      </span>
                      {exercise.rpe && (
                        <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded">
                          RPE {exercise.rpe}
                        </span>
                      )}
                    </div>
                    {exercise.notes && (
                      <p className="text-sm text-gray-600 mt-2 italic">💡 {exercise.notes}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-700">#{index + 1}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Workout Notes */}
          {generatedWorkout.notes.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-yellow-800 mb-2">📝 Workout Notes</h4>
              <ul className="space-y-1">
                {generatedWorkout.notes.map((note, index) => (
                  <li key={index} className="text-sm text-yellow-700">• {note}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Progression Strategy */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-semibold text-green-800 mb-2">📈 Progression Strategy</h4>
            <p className="text-sm text-green-700">{generatedWorkout.progressionStrategy}</p>
          </div>
        </div>
      )}
    </div>
  );
};