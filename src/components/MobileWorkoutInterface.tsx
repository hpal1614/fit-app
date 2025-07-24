import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipForward, Heart, Activity, Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWorkout } from '../hooks/useWorkout';
import { useVoice } from '../hooks/useVoice';
import { useBiometrics } from '../hooks/useBiometrics';
import { mobileOptimization } from '../services/mobileOptimizationService';

interface MobileWorkoutInterfaceProps {
  workoutId?: string;
}

export const MobileWorkoutInterface: React.FC<MobileWorkoutInterfaceProps> = ({ workoutId }) => {
  const { 
    currentExercise, 
    currentSet, 
    timeRemaining,
    isActive,
    isPaused,
    startWorkout,
    pauseWorkout,
    resumeWorkout,
    nextExercise,
    completeSet
  } = useWorkout();

  const { isListening, toggleListening } = useVoice();
  const { currentBiometrics, isConnected } = useBiometrics({ autoConnect: true });
  
  const [showStats, setShowStats] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Setup touch gestures
  useEffect(() => {
    if (!containerRef.current) return;

    const unsubscribeSwipe = mobileOptimization.registerSwipeGesture(
      containerRef.current,
      (direction) => {
        switch (direction) {
          case 'left':
            if (isActive) nextExercise();
            break;
          case 'right':
            setShowStats(!showStats);
            break;
          case 'up':
            if (isActive) completeSet();
            break;
        }
        mobileOptimization.vibrate(50);
      }
    );

    return () => unsubscribeSwipe();
  }, [isActive, showStats]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getHeartRateColor = (hr: number): string => {
    const percentage = hr / 190;
    if (percentage > 0.9) return 'text-red-500';
    if (percentage > 0.8) return 'text-orange-500';
    if (percentage > 0.7) return 'text-yellow-500';
    return 'text-green-500';
  };

  return (
    <div ref={containerRef} className="fixed inset-0 bg-gray-900 overflow-hidden">
      {/* Status Bar */}
      <div className="absolute top-0 left-0 right-0 bg-gray-800/90 backdrop-blur-sm z-10 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isConnected && currentBiometrics?.heart_rate && (
              <div className="flex items-center gap-1">
                <Heart className={getHeartRateColor(currentBiometrics.heart_rate)} size={20} />
                <span className={`text-sm font-medium ${getHeartRateColor(currentBiometrics.heart_rate)}`}>
                  {currentBiometrics.heart_rate}
                </span>
              </div>
            )}
            
            <button
              onClick={toggleListening}
              className={`p-2 rounded-full transition-colors ${
                isListening ? 'bg-red-500' : 'bg-gray-700'
              }`}
            >
              {isListening ? <Volume2 size={20} /> : <VolumeX size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="h-full pt-20 pb-32 flex items-center justify-center">
        <AnimatePresence mode="wait">
          {!showStats ? (
            // Exercise View
            <motion.div
              key="exercise"
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              className="text-center px-6"
            >
              {currentExercise ? (
                <>
                  <h1 className="text-3xl font-bold text-white mb-8">
                    {currentExercise.name}
                  </h1>

                  <div className="text-6xl font-bold text-white mb-4">
                    {formatTime(timeRemaining)}
                  </div>

                  <div className="text-gray-400 mb-8">
                    Set {currentSet} of {currentExercise.sets}
                  </div>

                  <div className="text-2xl text-gray-300">
                    {currentExercise.reps} reps
                    {currentExercise.weight && ` • ${currentExercise.weight} lbs`}
                  </div>
                </>
              ) : (
                <button
                  onClick={() => startWorkout(workoutId || 'default')}
                  className="bg-blue-600 text-white px-8 py-4 rounded-full text-lg font-medium"
                >
                  Start Workout
                </button>
              )}
            </motion.div>
          ) : (
            // Stats View
            <motion.div
              key="stats"
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
              className="px-6 w-full max-w-sm"
            >
              <h2 className="text-2xl font-bold text-white mb-6">Stats</h2>
              
              <div className="space-y-4">
                {currentBiometrics?.heart_rate && (
                  <div className="bg-gray-800 rounded-xl p-4">
                    <div className="text-gray-400 mb-1">Heart Rate</div>
                    <div className="text-3xl font-bold text-white">
                      {currentBiometrics.heart_rate} bpm
                    </div>
                  </div>
                )}

                <div className="bg-gray-800 rounded-xl p-4">
                  <div className="text-gray-400 mb-1">Calories</div>
                  <div className="text-3xl font-bold text-white">
                    {currentBiometrics?.calories_burned || 0}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-gray-800/90 backdrop-blur-sm p-6">
        <div className="flex items-center justify-around">
          <button
            onClick={() => {
              if (!isActive) {
                startWorkout(workoutId || 'default');
              } else if (isPaused) {
                resumeWorkout();
              } else {
                pauseWorkout();
              }
            }}
            className="p-6 rounded-full bg-blue-600 shadow-lg"
          >
            {!isActive || isPaused ? <Play size={32} /> : <Pause size={32} />}
          </button>

          <button
            onClick={nextExercise}
            className="p-4 rounded-full bg-gray-700"
            disabled={!isActive}
          >
            <SkipForward size={24} />
          </button>
        </div>
      </div>
    </div>
  );
};