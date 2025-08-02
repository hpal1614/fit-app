import React, { useEffect, useState, useRef } from 'react';
import { Clock, Play, Pause, SkipForward, Volume2, VolumeX } from 'lucide-react';

interface RestTimerProps {
  timeRemaining: number;
  onComplete?: () => void;
  onSkip?: () => void;
  onClose?: () => void;
  className?: string;
  isVisible?: boolean;
  soundEnabled?: boolean;
  onSoundToggle?: (enabled: boolean) => void;
}

export const RestTimer: React.FC<RestTimerProps> = ({
  timeRemaining,
  onComplete,
  onSkip,
  onClose,
  className = '',
  isVisible = false,
  soundEnabled = true,
  onSoundToggle
}) => {
  const [isPaused, setIsPaused] = useState(false);
  const [showCompletionMessage, setShowCompletionMessage] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const completionAudioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio elements
  useEffect(() => {
    // Create audio for timer completion (whistle sound)
    completionAudioRef.current = new Audio();
    // Using a simple beep sound for completion
    completionAudioRef.current.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT';
    completionAudioRef.current.volume = 0.7;
    
    // Create audio for button clicks
    audioRef.current = new Audio();
    audioRef.current.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT';
    audioRef.current.volume = 0.3;
  }, []);

  // Handle completion
  useEffect(() => {
    if (timeRemaining <= 0 && onComplete) {
      setShowCompletionMessage(true);
      
      // Play completion sound
      if (soundEnabled && completionAudioRef.current) {
        completionAudioRef.current.play().catch(console.error);
      }
      
      // Hide completion message after 3 seconds
      setTimeout(() => {
        setShowCompletionMessage(false);
        onComplete();
      }, 3000);
    }
  }, [timeRemaining, onComplete, soundEnabled]);

  // Play button sound
  const playButtonSound = () => {
    if (soundEnabled && audioRef.current) {
      audioRef.current.play().catch(console.error);
    }
  };

  // Format time display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate progress percentage
  const getProgress = (): number => {
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

  // Handle pause/resume
  const handlePauseResume = () => {
    setIsPaused(!isPaused);
    playButtonSound();
  };

  // Handle skip
  const handleSkip = () => {
    playButtonSound();
    if (onSkip) onSkip();
  };

  // Handle close
  const handleClose = () => {
    playButtonSound();
    if (onClose) onClose();
  };

  // Handle sound toggle
  const handleSoundToggle = () => {
    const newSoundEnabled = !soundEnabled;
    if (onSoundToggle) onSoundToggle(newSoundEnabled);
    playButtonSound();
  };

  if (!isVisible) return null;

  return (
    <div className={`fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 ${className}`}>
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm animate-fade-in-up">
        <div className="text-center">
          {/* Header with close button */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Clock size={24} className="text-gray-600" />
              <h3 className="text-xl font-bold text-gray-900">Rest Time</h3>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleSoundToggle}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title={soundEnabled ? 'Mute Sound' : 'Unmute Sound'}
              >
                {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </button>
              <button
                onClick={handleClose}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title="Close Timer"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Completion Message */}
          {showCompletionMessage ? (
            <div className="py-8">
              <div className="text-6xl mb-4">🎉</div>
              <h4 className="text-2xl font-bold text-fitness-green mb-2">
                Rest Complete!
              </h4>
              <p className="text-lg text-gray-600 mb-4">
                Let's get started with another set!
              </p>
              <div className="text-sm text-gray-500">
                💪 You're doing great! Keep pushing!
              </div>
            </div>
          ) : (
            <>
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
              </div>

              {/* Action Buttons */}
              <div className="flex justify-center space-x-3">
                {timeRemaining > 0 && (
                  <>
                    <button
                      onClick={handlePauseResume}
                      className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
                    >
                      {isPaused ? <Play size={16} /> : <Pause size={16} />}
                      <span>{isPaused ? 'Resume' : 'Pause'}</span>
                    </button>
                    
                    {onSkip && (
                      <button
                        onClick={handleSkip}
                        className="bg-fitness-blue text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
                      >
                        <SkipForward size={16} />
                        <span>Skip Rest</span>
                      </button>
                    )}
                  </>
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
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default RestTimer;