import React, { useEffect, useState } from 'react';
import { Clock, Play, Pause, SkipForward } from 'lucide-react';

interface RestTimerProps {
  timeRemaining: number;
  onComplete?: () => void;
  onSkip?: () => void;
  className?: string;
}

export const RestTimer: React.FC<RestTimerProps> = ({
  timeRemaining,
  onComplete,
  onSkip,
  className = ''
}) => {
  const [isPaused, setIsPaused] = useState(false);

  // Handle completion
  useEffect(() => {
    if (timeRemaining <= 0 && onComplete) {
      onComplete();
    }
  }, [timeRemaining, onComplete]);

  // Format time display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate progress percentage
  const getProgress = (): number => {
    // Assume initial rest time was around 60-120 seconds
    const estimatedTotal = Math.max(60, timeRemaining + 30);
    return ((estimatedTotal - timeRemaining) / estimatedTotal) * 100;
  };

  // Get color based on time remaining
  const getTimerColor = (): string => {
    if (timeRemaining <= 10) return 'text-red-500';
    if (timeRemaining <= 30) return 'text-yellow-500';
    return 'text-fitness-blue';
  };

  // Get ring color
  const getRingColor = (): string => {
    if (timeRemaining <= 10) return 'stroke-red-500';
    if (timeRemaining <= 30) return 'stroke-yellow-500';
    return 'stroke-fitness-blue';
  };

  return (
    <div className={`bg-white rounded-2xl shadow-lg p-6 ${className}`}>
      <div className="text-center">
        {/* Header */}
        <div className="flex items-center justify-center space-x-2 mb-4">
          <Clock size={24} className="text-gray-600" />
          <h3 className="text-xl font-bold text-gray-900">Rest Time</h3>
        </div>

        {/* Circular Progress Timer */}
        <div className="relative w-32 h-32 mx-auto mb-6">
          <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
            {/* Background circle */}
            <circle
              cx="60"
              cy="60"
              r="50"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="8"
            />
            
            {/* Progress circle */}
            <circle
              cx="60"
              cy="60"
              r="50"
              fill="none"
              strokeWidth="8"
              strokeDasharray={2 * Math.PI * 50}
              strokeDashoffset={2 * Math.PI * 50 * (1 - getProgress() / 100)}
              className={`transition-all duration-1000 ${getRingColor()}`}
              strokeLinecap="round"
            />
          </svg>
          
          {/* Time display */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className={`text-3xl font-bold ${getTimerColor()}`}>
                {formatTime(timeRemaining)}
              </div>
              <div className="text-sm text-gray-500">remaining</div>
            </div>
          </div>
        </div>

        {/* Status Messages */}
        <div className="mb-6">
          {timeRemaining > 30 && (
            <p className="text-gray-600">Take your time to recover properly</p>
          )}
          
          {timeRemaining <= 30 && timeRemaining > 10 && (
            <p className="text-yellow-600 font-medium">Get ready for your next set!</p>
          )}
          
          {timeRemaining <= 10 && timeRemaining > 0 && (
            <p className="text-red-600 font-bold animate-pulse">
              Next set starting soon!
            </p>
          )}
          
          {timeRemaining <= 0 && (
            <p className="text-fitness-green font-bold">
              Rest complete! Ready for your next set?
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center space-x-3">
          {timeRemaining > 0 && (
            <>
              <button
                onClick={() => setIsPaused(!isPaused)}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
              >
                {isPaused ? <Play size={16} /> : <Pause size={16} />}
                <span>{isPaused ? 'Resume' : 'Pause'}</span>
              </button>
              
              {onSkip && (
                <button
                  onClick={onSkip}
                  className="bg-fitness-blue text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
                >
                  <SkipForward size={16} />
                  <span>Skip Rest</span>
                </button>
              )}
            </>
          )}
          
          {timeRemaining <= 0 && onSkip && (
            <button
              onClick={onSkip}
              className="bg-fitness-green text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors font-medium"
            >
              Start Next Set
            </button>
          )}
        </div>

        {/* Rest Tips */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Rest Time Tips</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Stay hydrated during your rest</li>
            <li>• Keep moving lightly to maintain blood flow</li>
            <li>• Focus on your breathing and form for the next set</li>
            <li>• Adjust rest time based on how you feel</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default RestTimer;