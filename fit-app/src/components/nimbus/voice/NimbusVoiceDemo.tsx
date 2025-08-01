/**
 * Nimbus Voice Demo
 * Showcase of advanced voice intelligence features
 */

import React, { useState } from 'react';
import { NimbusWorkoutVoiceController, NimbusActiveWorkout } from './NimbusWorkoutVoiceController';
import { NimbusWorkoutCommand, NimbusNutritionCommand } from '../../../services/nimbus/NimbusAdvancedVoiceService';
import { NimbusCard } from '../../../nimbus/components/NimbusCard';
import { NimbusButton } from '../../../nimbus/components/NimbusButton';
import { Play, Pause, RotateCcw, Dumbbell, Timer, Trophy } from 'lucide-react';

export const NimbusVoiceDemo: React.FC = () => {
  const [workout, setWorkout] = useState<NimbusActiveWorkout>({
    isActive: false,
    name: 'Upper Body Strength',
    currentExercise: {
      name: 'Bench Press',
      sets: 4
    },
    currentSet: 1,
    currentExerciseIndex: 0,
    exercises: [
      { name: 'Bench Press', sets: 4 },
      { name: 'Overhead Press', sets: 3 },
      { name: 'Barbell Rows', sets: 3 },
      { name: 'Pull-ups', sets: 3 }
    ],
    restTimeRemaining: 0,
    lastSetPerformance: {
      weight: 80,
      reps: 8,
      difficulty: 3
    }
  });

  const [workoutLog, setWorkoutLog] = useState<Array<{ type: string; message: string; timestamp: Date }>>([]);
  const [nutritionLog, setNutritionLog] = useState<Array<{ type: string; message: string; timestamp: Date }>>([]);

  const handleWorkoutCommand = (command: NimbusWorkoutCommand) => {
    const logEntry = {
      type: 'workout',
      message: `Voice Command: ${command.originalTranscript} → ${command.type}`,
      timestamp: new Date()
    };
    setWorkoutLog(prev => [logEntry, ...prev.slice(0, 9)]); // Keep last 10 entries

    // Simulate workout actions
    switch (command.type) {
      case 'log_set':
        setWorkout(prev => ({
          ...prev,
          currentSet: Math.min(prev.currentSet + 1, prev.currentExercise?.sets || 4),
          lastSetPerformance: {
            weight: command.data.weight,
            reps: command.data.reps,
            difficulty: Math.floor(Math.random() * 3) + 2
          }
        }));
        break;
      case 'start_rest_timer':
        setWorkout(prev => ({
          ...prev,
          restTimeRemaining: command.data.seconds
        }));
        // Simulate timer countdown
        const timer = setInterval(() => {
          setWorkout(prev => {
            if (prev.restTimeRemaining <= 1) {
              clearInterval(timer);
              return { ...prev, restTimeRemaining: 0 };
            }
            return { ...prev, restTimeRemaining: prev.restTimeRemaining - 1 };
          });
        }, 1000);
        break;
      case 'start_exercise':
        setWorkout(prev => ({
          ...prev,
          currentExercise: { name: command.data.exerciseName, sets: 4 },
          currentSet: 1
        }));
        break;
    }
  };

  const handleNutritionCommand = (command: NimbusNutritionCommand) => {
    const logEntry = {
      type: 'nutrition',
      message: `Voice Command: ${command.originalTranscript} → ${command.type}`,
      timestamp: new Date()
    };
    setNutritionLog(prev => [logEntry, ...prev.slice(0, 9)]); // Keep last 10 entries
  };

  const handleAIConversation = async (transcript: string): Promise<string> => {
    // Simulate AI response delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const responses = [
      "I'm here to help with your workout! Keep pushing!",
      "That's the spirit! You're doing amazing!",
      "Focus on your form and breathe properly.",
      "Remember to stay hydrated during your workout.",
      "You're building strength with every rep!"
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const startWorkout = () => {
    setWorkout(prev => ({ ...prev, isActive: true }));
  };

  const pauseWorkout = () => {
    setWorkout(prev => ({ ...prev, isActive: false }));
  };

  const resetWorkout = () => {
    setWorkout({
      isActive: false,
      name: 'Upper Body Strength',
      currentExercise: {
        name: 'Bench Press',
        sets: 4
      },
      currentSet: 1,
      currentExerciseIndex: 0,
      exercises: [
        { name: 'Bench Press', sets: 4 },
        { name: 'Overhead Press', sets: 3 },
        { name: 'Barbell Rows', sets: 3 },
        { name: 'Pull-ups', sets: 3 }
      ],
      restTimeRemaining: 0,
      lastSetPerformance: {
        weight: 80,
        reps: 8,
        difficulty: 3
      }
    });
    setWorkoutLog([]);
    setNutritionLog([]);
  };

  return (
    <div className="nimbus-voice-demo p-4 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          🎙️ Nimbus Voice Intelligence Demo
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Experience OpenAI Realtime API-level voice features with hands-free workout logging
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Voice Controller */}
        <div className="lg:col-span-2">
          <NimbusWorkoutVoiceController
            workout={workout}
            onWorkoutCommand={handleWorkoutCommand}
            onNutritionCommand={handleNutritionCommand}
            onAIConversation={handleAIConversation}
          />
        </div>

        {/* Workout Controls */}
        <div className="space-y-4">
          <NimbusCard variant="default" padding="md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Dumbbell className="w-5 h-5" />
              Workout Controls
            </h3>
            <div className="space-y-3">
              <NimbusButton
                variant={workout.isActive ? "secondary" : "primary"}
                size="md"
                icon={workout.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                onClick={workout.isActive ? pauseWorkout : startWorkout}
                className="w-full"
              >
                {workout.isActive ? 'Pause Workout' : 'Start Workout'}
              </NimbusButton>
              
              <NimbusButton
                variant="secondary"
                size="md"
                icon={<RotateCcw className="w-4 h-4" />}
                onClick={resetWorkout}
                className="w-full"
              >
                Reset Demo
              </NimbusButton>
            </div>
          </NimbusCard>

          {/* Current Workout Status */}
          <NimbusCard variant="default" padding="md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Workout Status
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Exercise:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {workout.currentExercise?.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Set:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {workout.currentSet} / {workout.currentExercise?.sets}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Last Set:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {workout.lastSetPerformance?.weight}kg × {workout.lastSetPerformance?.reps}
                </span>
              </div>
              {workout.restTimeRemaining > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Rest:</span>
                  <span className="font-medium text-blue-600 dark:text-blue-400">
                    {Math.floor(workout.restTimeRemaining / 60)}:{(workout.restTimeRemaining % 60).toString().padStart(2, '0')}
                  </span>
                </div>
              )}
            </div>
          </NimbusCard>

          {/* Voice Commands Guide */}
          <NimbusCard variant="default" padding="md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              🎯 Try These Commands
            </h3>
            <div className="space-y-2 text-sm">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                <p className="font-medium text-blue-700 dark:text-blue-300">Workout:</p>
                <p className="text-blue-600 dark:text-blue-400">"185 for 8 reps"</p>
                <p className="text-blue-600 dark:text-blue-400">"Start 2 minute timer"</p>
              </div>
              <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded">
                <p className="font-medium text-green-700 dark:text-green-300">Nutrition:</p>
                <p className="text-green-600 dark:text-green-400">"Ate 200g chicken"</p>
                <p className="text-green-600 dark:text-green-400">"Drank 500ml water"</p>
              </div>
              <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded">
                <p className="font-medium text-purple-700 dark:text-purple-300">General:</p>
                <p className="text-purple-600 dark:text-purple-400">"I need motivation"</p>
                <p className="text-purple-600 dark:text-purple-400">"How's my form?"</p>
              </div>
            </div>
          </NimbusCard>
        </div>
      </div>

      {/* Activity Logs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Workout Log */}
        <NimbusCard variant="default" padding="md">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <Dumbbell className="w-5 h-5" />
            Workout Commands
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {workoutLog.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-sm">No workout commands yet. Start speaking!</p>
            ) : (
              workoutLog.map((entry, index) => (
                <div key={index} className="p-2 bg-gray-50 dark:bg-gray-800 rounded text-sm">
                  <p className="text-gray-900 dark:text-white">{entry.message}</p>
                  <p className="text-gray-500 dark:text-gray-400 text-xs">
                    {entry.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </NimbusCard>

        {/* Nutrition Log */}
        <NimbusCard variant="default" padding="md">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            🥗 Nutrition Commands
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {nutritionLog.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-sm">No nutrition commands yet. Start speaking!</p>
            ) : (
              nutritionLog.map((entry, index) => (
                <div key={index} className="p-2 bg-gray-50 dark:bg-gray-800 rounded text-sm">
                  <p className="text-gray-900 dark:text-white">{entry.message}</p>
                  <p className="text-gray-500 dark:text-gray-400 text-xs">
                    {entry.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </NimbusCard>
      </div>

      {/* Feature Highlights */}
      <NimbusCard variant="default" padding="lg">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          🚀 Advanced Voice Intelligence Features
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="text-2xl mb-2">🎙️</div>
            <h4 className="font-medium text-blue-700 dark:text-blue-300">Continuous Listening</h4>
            <p className="text-sm text-blue-600 dark:text-blue-400">No button pressing required</p>
          </div>
          <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="text-2xl mb-2">🔄</div>
            <h4 className="font-medium text-green-700 dark:text-green-300">Voice Interruption</h4>
            <p className="text-sm text-green-600 dark:text-green-400">Cut off AI mid-sentence naturally</p>
          </div>
          <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <div className="text-2xl mb-2">🌊</div>
            <h4 className="font-medium text-purple-700 dark:text-purple-300">Real-time Waveform</h4>
            <p className="text-sm text-purple-600 dark:text-purple-400">Beautiful audio visualization</p>
          </div>
          <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
            <div className="text-2xl mb-2">🧠</div>
            <h4 className="font-medium text-orange-700 dark:text-orange-300">Smart Parsing</h4>
            <p className="text-sm text-orange-600 dark:text-orange-400">Understands complex commands</p>
          </div>
        </div>
      </NimbusCard>
    </div>
  );
}; 