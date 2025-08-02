import React, { useEffect, useState, useRef } from 'react';
import { Clock, Play, Pause, SkipForward, Volume2, VolumeX, Settings, Plus, Minus } from 'lucide-react';

interface RestTimerProps {
  initialTime?: number;
  onComplete?: () => void;
  onSkip?: () => void;
  onClose?: () => void;
  onTimeAdjust?: (seconds: number) => void;
  className?: string;
  isVisible?: boolean;
  soundEnabled?: boolean;
  onSoundToggle?: (enabled: boolean) => void;
  onOpenSettings?: () => void;
}

export const RestTimer: React.FC<RestTimerProps> = ({
  initialTime = 120,
  onComplete,
  onSkip,
  onClose,
  onTimeAdjust,
  className = '',
  isVisible = false,
  soundEnabled = true,
  onSoundToggle,
  onOpenSettings
}) => {
  const [timeRemaining, setTimeRemaining] = useState(initialTime);
  const [isPaused, setIsPaused] = useState(false);
  const [showCompletionMessage, setShowCompletionMessage] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const completionAudioRef = useRef<HTMLAudioElement | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize audio elements
  useEffect(() => {
    // Create simple beep sound using oscillator
    const createBeep = (frequency: number, duration: number) => {
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = frequency;
        gainNode.gain.value = 0.3;
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + duration);
        
        // Cleanup after sound plays
        setTimeout(() => {
          audioContext.close();
        }, duration * 1000 + 100);
      } catch (error) {
        console.error('Error creating beep sound:', error);
      }
    };
    
    // Create sound functions
    const playCompletionSound = () => {
      if (!soundEnabled) return;
      // Play a sequence of beeps for completion
      createBeep(800, 0.2);
      setTimeout(() => createBeep(1000, 0.2), 200);
      setTimeout(() => createBeep(1200, 0.2), 400);
    };
    
    const playButtonSound = () => {
      if (!soundEnabled) return;
      createBeep(400, 0.1);
    };
    
    // Store the sound functions
    completionAudioRef.current = { play: playCompletionSound };
    audioRef.current = { play: playButtonSound };
  }, [soundEnabled]);

  // Start timer when component becomes visible
  useEffect(() => {
    if (isVisible && !isRunning) {
      setTimeRemaining(initialTime);
      setIsRunning(true);
      setIsPaused(false);
      startTimer();
    }
  }, [isVisible, initialTime]);

  // Timer logic
  const startTimer = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    
    timerIntervalRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timerIntervalRef.current!);
          timerIntervalRef.current = null;
          setIsRunning(false);
          setShowCompletionMessage(true);
          
          // Play completion sound
          if (soundEnabled && completionAudioRef.current) {
            completionAudioRef.current.play();
          }
          
          // Hide completion message after 3 seconds
          setTimeout(() => {
            setShowCompletionMessage(false);
            if (onComplete) onComplete();
          }, 3000);
          
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Pause/Resume timer
  const pauseTimer = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    setIsPaused(true);
  };

  const resumeTimer = () => {
    if (isPaused && isRunning) {
      startTimer();
      setIsPaused(false);
    }
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

  // Play button sound
  const playButtonSound = () => {
    if (soundEnabled && audioRef.current) {
      audioRef.current.play();
    }
  };

  // Format time display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get color based on time remaining
  const getTimerColor = (): string => {
    if (timeRemaining <= 10) return 'text-red-500';
    if (timeRemaining <= 30) return 'text-yellow-500';
    return 'text-blue-500';
  };

  // Handle pause/resume
  const handlePauseResume = () => {
    if (isPaused) {
      resumeTimer();
    } else {
      pauseTimer();
    }
    playButtonSound();
  };

  // Handle skip
  const handleSkip = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    setIsRunning(false);
    setIsPaused(false);
    playButtonSound();
    if (onSkip) onSkip();
  };

  // Handle close
  const handleClose = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    setIsRunning(false);
    setIsPaused(false);
    playButtonSound();
    if (onClose) onClose();
  };

  // Handle sound toggle
  const handleSoundToggle = () => {
    const newSoundEnabled = !soundEnabled;
    if (onSoundToggle) onSoundToggle(newSoundEnabled);
    // Test sound when toggling - this ensures user interaction
    if (newSoundEnabled && audioRef.current) {
      // Create a new audio context on user interaction
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 400;
        gainNode.gain.value = 0.3;
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.1);
        
        setTimeout(() => audioContext.close(), 200);
      } catch (error) {
        console.error('Error playing test sound:', error);
      }
    }
  };

  // Handle time adjustment
  const handleTimeAdjust = (seconds: number) => {
    setTimeRemaining(prev => Math.max(10, prev + seconds));
    if (onTimeAdjust) onTimeAdjust(seconds);
    playButtonSound();
  };

  if (!isVisible) return null;

  return (
    <div 
      className={`fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-end justify-center p-4 ${className}`}
      onClick={handleClose}
    >
      <div 
        className="bg-gray-900 rounded-t-2xl shadow-2xl p-4 w-full max-w-sm animate-slide-up-from-bottom"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag Handle */}
        <div className="flex justify-center mb-3">
          <div className="w-12 h-1 bg-gray-600 rounded-full"></div>
        </div>
        
        {/* Completion Message */}
        {showCompletionMessage ? (
          <div className="text-center py-4">
            <div className="text-4xl mb-2">🎉</div>
            <h4 className="text-xl font-bold text-green-400 mb-1">
              Rest Complete!
            </h4>
            <p className="text-gray-300 text-sm">
              Let's get started with another set!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock size={20} className="text-gray-400" />
                <h3 className="text-lg font-semibold text-white">Rest Timer</h3>
              </div>
              <div className="flex items-center space-x-1">
                <button
                  onClick={handleSoundToggle}
                  className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
                  title={soundEnabled ? 'Mute Sound' : 'Unmute Sound'}
                >
                  {soundEnabled ? <Volume2 size={16} className="text-gray-400" /> : <VolumeX size={16} className="text-gray-400" />}
                </button>
                <button
                  onClick={() => {
                    if (soundEnabled) {
                      // Create a new audio context on user interaction
                      try {
                        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
                        const oscillator = audioContext.createOscillator();
                        const gainNode = audioContext.createGain();
                        
                        oscillator.connect(gainNode);
                        gainNode.connect(audioContext.destination);
                        
                        // Play completion sound sequence
                        oscillator.frequency.value = 800;
                        gainNode.gain.value = 0.3;
                        
                        oscillator.start();
                        oscillator.stop(audioContext.currentTime + 0.2);
                        
                        setTimeout(() => {
                          const oscillator2 = audioContext.createOscillator();
                          const gainNode2 = audioContext.createGain();
                          
                          oscillator2.connect(gainNode2);
                          gainNode2.connect(audioContext.destination);
                          
                          oscillator2.frequency.value = 1000;
                          gainNode2.gain.value = 0.3;
                          
                          oscillator2.start();
                          oscillator2.stop(audioContext.currentTime + 0.2);
                        }, 200);
                        
                        setTimeout(() => {
                          const oscillator3 = audioContext.createOscillator();
                          const gainNode3 = audioContext.createGain();
                          
                          oscillator3.connect(gainNode3);
                          gainNode3.connect(audioContext.destination);
                          
                          oscillator3.frequency.value = 1200;
                          gainNode3.gain.value = 0.3;
                          
                          oscillator3.start();
                          oscillator3.stop(audioContext.currentTime + 0.2);
                        }, 400);
                        
                        setTimeout(() => audioContext.close(), 800);
                      } catch (error) {
                        console.error('Error playing test sound:', error);
                      }
                    }
                  }}
                  className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
                  title="Test Completion Sound"
                >
                  <span className="text-gray-400 text-sm">🔊</span>
                </button>
                {onOpenSettings && (
                  <button
                    onClick={onOpenSettings}
                    className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
                    title="Timer Settings"
                  >
                    <Settings size={16} className="text-gray-400" />
                  </button>
                )}
                <button
                  onClick={handleClose}
                  className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
                  title="Close Timer"
                >
                  <span className="text-gray-400 text-lg">✕</span>
                </button>
              </div>
            </div>

            {/* Timer Display */}
            <div className="text-center">
              <div className={`text-4xl font-bold ${getTimerColor()} mb-2`}>
                {formatTime(timeRemaining)}
              </div>
              <div className="text-sm text-gray-400 mb-4">
                {timeRemaining > 30 ? 'Take your time to recover' : 
                 timeRemaining > 10 ? 'Get ready for your next set!' : 
                 'Next set starting soon!'}
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center space-x-3">
              {/* Time Adjustment */}
              <button
                onClick={() => handleTimeAdjust(-30)}
                className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                title="Subtract 30 seconds"
              >
                <Minus size={16} className="text-gray-300" />
              </button>
              
              <button
                onClick={() => handleTimeAdjust(-10)}
                className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                title="Subtract 10 seconds"
              >
                <span className="text-gray-300 text-sm font-medium">-10</span>
              </button>

              {/* Play/Pause */}
              <button
                onClick={handlePauseResume}
                className="p-3 bg-blue-600 hover:bg-blue-700 rounded-full transition-colors"
                title={isPaused ? 'Resume' : 'Pause'}
              >
                {isPaused ? <Play size={20} className="text-white" /> : <Pause size={20} className="text-white" />}
              </button>

              <button
                onClick={() => handleTimeAdjust(10)}
                className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                title="Add 10 seconds"
              >
                <span className="text-gray-300 text-sm font-medium">+10</span>
              </button>
              
              <button
                onClick={() => handleTimeAdjust(30)}
                className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                title="Add 30 seconds"
              >
                <Plus size={16} className="text-gray-300" />
              </button>
            </div>

            {/* Skip Button */}
            {onSkip && (
              <div className="flex justify-center">
                <button
                  onClick={handleSkip}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <SkipForward size={16} />
                  <span>Skip Rest</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RestTimer;