import React from 'react';
import { Timer, Square } from 'lucide-react';

interface WorkoutTimerProps {
  timeRemaining: number;
  isResting: boolean;
  onStop: () => void;
  formatTime: (seconds: number) => string;
}

export function WorkoutTimer({
  timeRemaining,
  isResting,
  onStop,
  formatTime
}: WorkoutTimerProps) {
  const progress = (timeRemaining / 60) * 100; // Assuming 60 seconds default

  return (
    <div className="card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center">
            <Timer className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Rest Timer</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Take a break and recover</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
          <span className="text-sm text-accent font-medium">Active</span>
        </div>
      </div>

      {/* Timer Display */}
      <div className="text-center space-y-4">
        <div className="relative">
          {/* Circular Progress */}
          <div className="w-32 h-32 mx-auto relative">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
              {/* Background circle */}
              <circle
                cx="60"
                cy="60"
                r="54"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-gray-200 dark:text-gray-700"
              />
              {/* Progress circle */}
              <circle
                cx="60"
                cy="60"
                r="54"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                className="text-accent transition-all duration-1000 ease-linear"
                style={{
                  strokeDasharray: `${2 * Math.PI * 54}`,
                  strokeDashoffset: `${2 * Math.PI * 54 * (1 - progress / 100)}`
                }}
              />
            </svg>
            
            {/* Time Display */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 dark:text-white">
                  {formatTime(timeRemaining)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  remaining
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 dark:bg-dark-600 rounded-full h-2">
          <div 
            className="bg-accent h-2 rounded-full transition-all duration-1000 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Stop Button */}
        <button
          onClick={onStop}
          className="btn-ghost border-2 border-accent/20 text-accent hover:bg-accent/10 px-6 py-3 rounded-xl transition-all duration-200 flex items-center space-x-2"
        >
          <Square className="w-4 h-4" />
          <span>Stop Timer</span>
        </button>
      </div>

      {/* Timer Tips */}
      <div className="bg-accent/5 border border-accent/20 rounded-xl p-4">
        <h4 className="text-sm font-medium text-accent mb-2">Rest Tips</h4>
        <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
          <li>• Take deep breaths to recover</li>
          <li>• Stay hydrated during your rest</li>
          <li>• Prepare mentally for your next set</li>
          <li>• Stretch lightly if needed</li>
        </ul>
      </div>
    </div>
  );
}
