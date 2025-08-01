/**
 * Nimbus Workout Voice Controller
 * Hands-free workout logging with voice commands and AI coaching
 */

import React, { useState, useEffect } from 'react';
import { NimbusAdvancedVoiceService, NimbusVoiceState, NimbusWorkoutCommand, NimbusNutritionCommand, NimbusWorkoutContext } from '../../../services/nimbus/NimbusAdvancedVoiceService';
import { NimbusWaveformVisualizer } from './NimbusWaveformVisualizer';
import { NimbusButton } from '../NimbusButton';
import { NimbusCard } from '../NimbusCard';
import { Mic, MicOff, Volume2, VolumeX, Settings, HelpCircle } from 'lucide-react';

export interface NimbusActiveWorkout {
  isActive: boolean;
  name: string;
  currentExercise?: {
    name: string;
    sets: number;
  };
  currentSet: number;
  currentExerciseIndex: number;
  exercises: Array<{ name: string; sets: number }>;
  restTimeRemaining: number;
  lastSetPerformance?: {
    weight: number;
    reps: number;
    difficulty: number;
  };
}

interface NimbusWorkoutVoiceControllerProps {
  workout: NimbusActiveWorkout;
  onWorkoutCommand: (command: NimbusWorkoutCommand) => void;
  onNutritionCommand: (command: NimbusNutritionCommand) => void;
  onAIConversation?: (transcript: string) => Promise<string>;
}

export const NimbusWorkoutVoiceController: React.FC<NimbusWorkoutVoiceControllerProps> = ({
  workout,
  onWorkoutCommand,
  onNutritionCommand,
  onAIConversation
}) => {
  const [voiceService] = useState(() => new NimbusAdvancedVoiceService({
    continuous: true,
    voiceActivityThreshold: 0.015,
    noiseReduction: true,
    emotionalAdaptation: true
  }));
  
  const [isActive, setIsActive] = useState(false);
  const [voiceState, setVoiceState] = useState<NimbusVoiceState>();
  const [showHelp, setShowHelp] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    // Update workout context when workout changes
    voiceService.updateWorkoutContext({
      isActive: workout.isActive,
      currentExercise: workout.currentExercise?.name,
      currentSet: workout.currentSet,
      totalSets: workout.currentExercise?.sets,
      restTimeRemaining: workout.restTimeRemaining,
      intensity: determineWorkoutIntensity(workout),
      lastPerformance: workout.lastSetPerformance
    });
  }, [workout, voiceService]);

  useEffect(() => {
    // Set up event listeners
    voiceService.addEventListener('stateChange', (e: any) => {
      setVoiceState(e.detail);
    });

    voiceService.addEventListener('workoutCommand', (e: any) => {
      const command = e.detail as NimbusWorkoutCommand;
      onWorkoutCommand(command);
    });

    voiceService.addEventListener('nutritionCommand', (e: any) => {
      const command = e.detail as NimbusNutritionCommand;
      onNutritionCommand(command);
    });

    voiceService.addEventListener('conversationInput', async (e: any) => {
      // Handle general AI conversation
      const { transcript } = e.detail;
      if (onAIConversation) {
        try {
          const response = await onAIConversation(transcript);
          await voiceService.speak(response, {
            tone: 'encouraging',
            interruptible: true,
            workoutContext: voiceService.getState().workoutContext
          });
        } catch (error) {
          console.error('AI conversation error:', error);
          await voiceService.speak("I'm having trouble processing that right now. Let's focus on your workout!", {
            tone: 'calm',
            interruptible: true
          });
        }
      } else {
        // Default response
        const response = getDefaultAICoachResponse(transcript, workout);
        await voiceService.speak(response, {
          tone: 'encouraging',
          interruptible: true,
          workoutContext: voiceService.getState().workoutContext
        });
      }
    });

    return () => {
      voiceService.destroy();
    };
  }, [voiceService, onWorkoutCommand, onNutritionCommand, onAIConversation, workout]);

  const toggleVoiceMode = async () => {
    if (isActive) {
      voiceService.stopListening();
      setIsActive(false);
    } else {
      try {
        const success = await voiceService.startContinuousListening();
        setIsActive(success);
        
        if (success) {
          await voiceService.speak("Voice coaching activated. I'm listening for your commands.", {
            tone: 'encouraging',
            interruptible: false
          });
        }
      } catch (error) {
        console.error('Failed to start voice mode:', error);
        alert('Please allow microphone access to use voice features.');
      }
    }
  };

  const determineWorkoutIntensity = (workout: NimbusActiveWorkout): 'warm_up' | 'working' | 'rest' | 'cool_down' => {
    if (workout.restTimeRemaining > 0) return 'rest';
    if (workout.currentSet === 1) return 'warm_up';
    if (workout.currentExerciseIndex === workout.exercises.length - 1) return 'cool_down';
    return 'working';
  };

  const getDefaultAICoachResponse = (transcript: string, workout: NimbusActiveWorkout): string => {
    const lowerTranscript = transcript.toLowerCase();
    
    // Contextual responses based on workout state
    if (workout.restTimeRemaining > 0) {
      return "Take your time to recover. Focus on your breathing and stay hydrated.";
    }
    
    if (lowerTranscript.includes('tired') || lowerTranscript.includes('exhausted')) {
      return "I know you're tired, but you're doing amazing! Push through this last set. You've got this!";
    }
    
    if (lowerTranscript.includes('motivation') || lowerTranscript.includes('motivate')) {
      return "Remember why you started! Every rep is making you stronger. Keep pushing!";
    }
    
    if (lowerTranscript.includes('form') || lowerTranscript.includes('technique')) {
      return "Great focus on form! Quality over quantity always wins. Keep that perfect technique!";
    }
    
    if (lowerTranscript.includes('weight') || lowerTranscript.includes('heavy')) {
      return "The weight is challenging, but that's how you grow! Trust your strength!";
    }
    
    return "I'm here to support your workout. Keep pushing and stay focused!";
  };

  const getStatusColor = () => {
    if (voiceState?.isListening) return 'text-blue-500';
    if (voiceState?.isSpeaking) return 'text-green-500';
    if (voiceState?.isProcessing) return 'text-yellow-500';
    return 'text-gray-400';
  };

  const getStatusText = () => {
    if (voiceState?.isListening) return 'Listening...';
    if (voiceState?.isSpeaking) return 'Speaking...';
    if (voiceState?.isProcessing) return 'Processing...';
    return 'Idle';
  };

  return (
    <div className="nimbus-workout-voice-controller space-y-4">
      {/* Main Voice Interface */}
      <NimbusCard variant="default" padding="lg" className="nimbus-glass">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Mic className="w-5 h-5" />
            Voice Coach
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHelp(!showHelp)}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <Settings className="w-5 h-5" />
            </button>
            <NimbusButton
              variant={isActive ? "destructive" : "primary"}
              size="sm"
              icon={isActive ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              onClick={toggleVoiceMode}
            >
              {isActive ? 'Stop' : 'Start Voice'}
            </NimbusButton>
          </div>
        </div>

        {/* Waveform Visualization */}
        <div className="mb-4 flex justify-center">
          <NimbusWaveformVisualizer
            waveformData={voiceState?.waveformData || null}
            isListening={voiceState?.isListening || false}
            isSpeaking={voiceState?.isSpeaking || false}
            style="bars"
            size="lg"
            color="#3B82F6"
            showVoiceActivity={true}
            showNoiseLevel={true}
          />
        </div>

        {/* Status and Transcript */}
        <div className="space-y-3">
          {/* Current Status */}
          <div className="text-center">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor()} bg-gray-100 dark:bg-gray-800`}>
              {voiceState?.isListening ? '🎤' :
               voiceState?.isSpeaking ? '🔊' :
               voiceState?.isProcessing ? '⚡' : '💤'} {getStatusText()}
            </span>
          </div>

          {/* Live Transcript */}
          {voiceState?.transcript && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">You're saying:</p>
              <p className="text-gray-900 dark:text-white font-medium">{voiceState.transcript}</p>
              {voiceState.confidence > 0 && (
                <div className="mt-2 flex items-center space-x-2">
                  <span className="text-xs text-gray-500">Confidence:</span>
                  <div className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        voiceState.confidence > 0.8 ? 'bg-green-500' :
                        voiceState.confidence > 0.6 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${voiceState.confidence * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500">
                    {Math.round(voiceState.confidence * 100)}%
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </NimbusCard>

      {/* Voice Commands Help */}
      {showHelp && (
        <NimbusCard variant="default" padding="md" className="nimbus-glass">
          <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <HelpCircle className="w-4 h-4" />
            Voice Commands
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <p className="text-blue-600 dark:text-blue-400 font-medium">🏋️ Workout Logging:</p>
              <div className="space-y-1 text-gray-600 dark:text-gray-400">
                <p>"185 for 8 reps"</p>
                <p>"Start 3 minute timer"</p>
                <p>"Next exercise"</p>
                <p>"Skip this set"</p>
                <p>"End workout"</p>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-green-600 dark:text-green-400 font-medium">🥗 Nutrition:</p>
              <div className="space-y-1 text-gray-600 dark:text-gray-400">
                <p>"Ate 200g chicken"</p>
                <p>"Had a protein shake"</p>
                <p>"Drank 500ml water"</p>
                <p>"Just finished lunch"</p>
              </div>
            </div>
          </div>
          <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs text-blue-700 dark:text-blue-300">
            💡 <strong>Tip:</strong> You can interrupt me anytime by speaking. Just say what you need!
          </div>
        </NimbusCard>
      )}

      {/* Voice Settings */}
      {showSettings && (
        <NimbusCard variant="default" padding="md" className="nimbus-glass">
          <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Voice Settings
          </h4>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Voice Activity Threshold</span>
              <span className="text-gray-900 dark:text-white font-medium">Medium</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Noise Reduction</span>
              <span className="text-green-500 font-medium">Enabled</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Emotional Adaptation</span>
              <span className="text-green-500 font-medium">Enabled</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Language</span>
              <span className="text-gray-900 dark:text-white font-medium">Australian English</span>
            </div>
          </div>
        </NimbusCard>
      )}

      {/* Workout Context Display */}
      {workout.isActive && (
        <NimbusCard variant="default" padding="sm" className="nimbus-glass">
          <div className="text-center text-sm">
            <p className="text-gray-600 dark:text-gray-400">
              Current: <span className="font-medium text-gray-900 dark:text-white">
                {workout.currentExercise?.name || 'No exercise'}
              </span>
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              Set {workout.currentSet} of {workout.currentExercise?.sets || 0}
            </p>
            {workout.restTimeRemaining > 0 && (
              <p className="text-blue-600 dark:text-blue-400 font-medium">
                Rest: {Math.floor(workout.restTimeRemaining / 60)}:{(workout.restTimeRemaining % 60).toString().padStart(2, '0')}
              </p>
            )}
          </div>
        </NimbusCard>
      )}
    </div>
  );
}; 