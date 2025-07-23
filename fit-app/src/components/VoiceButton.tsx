import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2, Loader2 } from 'lucide-react';
import { useVoice } from '../hooks/useVoice';
import type { WorkoutContext } from '../types/workout';

interface VoiceButtonProps {
  workoutContext?: WorkoutContext;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showLabel?: boolean;
  autoStart?: boolean;
  onCommandProcessed?: (command: string, result: unknown) => void;
}

export const VoiceButton: React.FC<VoiceButtonProps> = ({
  workoutContext,
  className = '',
  size = 'lg',
  showLabel = true,
  autoStart = false,
  onCommandProcessed
}) => {
  const {
    isListening,
    isProcessing,
    isSpeaking,
    error,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    isSupported,
    confidence,
    lastCommand,
    state
  } = useVoice({ 
    autoStart, 
    enableWakeWord: true, 
    workoutContext 
  });

  const [isPressed, setIsPressed] = useState(false);
  const [showError, setShowError] = useState(false);

  // Handle command processing callback
  useEffect(() => {
    if (lastCommand && onCommandProcessed) {
      onCommandProcessed(state.lastTranscript || '', lastCommand);
    }
  }, [lastCommand, onCommandProcessed, state.lastTranscript]);

  // Handle error display
  useEffect(() => {
    if (error) {
      setShowError(true);
      const timer = setTimeout(() => setShowError(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Size configurations
  const sizeConfig = {
    sm: 'w-12 h-12 text-sm',
    md: 'w-16 h-16 text-base',
    lg: 'w-20 h-20 text-lg',
    xl: 'w-24 h-24 text-xl'
  };

  // State-based styling
  const getButtonStyles = () => {
    const baseStyles = 'voice-button transition-all duration-300 ease-in-out transform focus:outline-none focus:ring-4 focus:ring-opacity-50';
    
    if (isProcessing) {
      return `${baseStyles} bg-voice-processing text-white animate-pulse scale-105 focus:ring-voice-processing`;
    }
    
    if (isListening) {
      return `${baseStyles} bg-voice-listening text-white animate-pulse-slow scale-110 focus:ring-voice-listening shadow-lg shadow-voice-listening/50`;
    }
    
    if (isSpeaking) {
      return `${baseStyles} bg-voice-speaking text-white animate-bounce-subtle scale-105 focus:ring-voice-speaking`;
    }
    
    if (error) {
      return `${baseStyles} bg-voice-error text-white focus:ring-voice-error`;
    }
    
    return `${baseStyles} bg-fitness-blue hover:bg-blue-600 text-white focus:ring-fitness-blue hover:scale-105`;
  };

  // Get appropriate icon
  const getIcon = () => {
    const iconSize = size === 'sm' ? 16 : size === 'md' ? 20 : size === 'lg' ? 24 : 28;
    
    if (isProcessing) {
      return <Loader2 size={iconSize} className="animate-spin" />;
    }
    
    if (isSpeaking) {
      return <Volume2 size={iconSize} />;
    }
    
    if (isListening) {
      return <Mic size={iconSize} />;
    }
    
    if (error) {
      return <MicOff size={iconSize} />;
    }
    
    return <Mic size={iconSize} />;
  };

  // Get status text
  const getStatusText = () => {
    if (isProcessing) return 'Processing...';
    if (isListening) return 'Listening...';
    if (isSpeaking) return 'Speaking...';
    if (error) return 'Error';
    return 'Voice Commands';
  };

  // Handle button press
  const handlePress = async () => {
    if (!isSupported) {
      await speak('Voice commands are not supported in this browser');
      return;
    }

    setIsPressed(true);
    
    try {
      if (isListening) {
        stopListening();
      } else if (isSpeaking) {
        stopSpeaking();
      } else {
        const started = await startListening();
        if (!started) {
          await speak('Unable to start voice recognition');
        }
      }
    } catch (err) {
      console.error('Voice control error:', err);
    } finally {
      setTimeout(() => setIsPressed(false), 150);
    }
  };

  // Keyboard support
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      handlePress();
    }
  };

  // Render confidence indicator
  const renderConfidenceIndicator = () => {
    if (!isListening || confidence === 0) return null;
    
    return (
      <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
        <div className="bg-white bg-opacity-90 rounded-full px-2 py-1 text-xs font-medium text-gray-700">
          {Math.round(confidence * 100)}%
        </div>
      </div>
    );
  };

  // Render voice waves animation
  const renderVoiceWaves = () => {
    if (!isListening) return null;
    
    return (
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="flex space-x-1">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="voice-wave bg-white opacity-60"
              style={{
                animationDelay: `${i * 0.1}s`,
                animationDuration: '1.5s'
              }}
            />
          ))}
        </div>
      </div>
    );
  };

  if (!isSupported) {
    return (
      <div className={`${sizeConfig[size]} ${className} flex items-center justify-center bg-gray-400 rounded-full text-white`}>
        <MicOff size={size === 'sm' ? 16 : size === 'md' ? 20 : size === 'lg' ? 24 : 28} />
        {showLabel && (
          <span className="ml-2 text-sm text-gray-600">Voice not supported</span>
        )}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Main Voice Button */}
      <button
        onClick={handlePress}
        onKeyDown={handleKeyDown}
        disabled={isProcessing}
        className={`
          ${getButtonStyles()}
          ${sizeConfig[size]}
          ${isPressed ? 'scale-95' : ''}
          disabled:opacity-50 disabled:cursor-not-allowed
          relative overflow-hidden
        `}
        aria-label={getStatusText()}
        role="button"
        tabIndex={0}
      >
        {getIcon()}
        {renderVoiceWaves()}
        {renderConfidenceIndicator()}
      </button>

      {/* Status Label */}
      {showLabel && (
        <div className="mt-2 text-center">
          <span className={`text-sm font-medium ${
            error ? 'text-voice-error' : 
            isListening ? 'text-voice-listening' : 
            isSpeaking ? 'text-voice-speaking' : 
            isProcessing ? 'text-voice-processing' : 
            'text-gray-600'
          }`}>
            {getStatusText()}
          </span>
          
          {state.lastTranscript && (
            <div className="mt-1 text-xs text-gray-500 max-w-xs truncate">
              "{state.lastTranscript}"
            </div>
          )}
        </div>
      )}

      {/* Error Message */}
      {showError && error && (
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-red-100 border border-red-300 text-red-700 px-3 py-2 rounded-lg text-sm whitespace-nowrap z-10">
          {error.message}
          {error.recoverable && (
            <button
              onClick={handlePress}
              className="ml-2 text-red-600 hover:text-red-800 underline"
            >
              Retry
            </button>
          )}
        </div>
      )}

      {/* Last Command Feedback */}
      {lastCommand && lastCommand.success && (
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-green-100 border border-green-300 text-green-700 px-3 py-2 rounded-lg text-sm max-w-xs z-10">
          ✓ {lastCommand.response}
        </div>
      )}
    </div>
  );
};

export default VoiceButton;