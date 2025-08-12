import React, { useState, useEffect } from 'react';
import { Mic, MicOff, MessageCircle, Loader2 } from 'lucide-react';
import { useContinuousVoice } from '../hooks/useContinuousVoice';
import type { WorkoutContext } from '../types/workout';

interface VoiceButtonProps {
  aiService?: any;
  workoutContext?: WorkoutContext;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showLabel?: boolean;
  autoStart?: boolean;
  onCommandProcessed?: (command: string, result: any) => void;
}

export const VoiceButton: React.FC<VoiceButtonProps> = ({
  aiService,
  workoutContext,
  className = '',
  size = 'lg',
  showLabel = true,
  autoStart = false,
  onCommandProcessed
}) => {
  const {
    isInitialized,
    conversationActive,
    isListening,
    currentTranscript,
    error,
    manualActivate,
    deactivate
  } = useContinuousVoice(aiService);

  const [isPressed, setIsPressed] = useState(false);
  const [showError, setShowError] = useState(false);

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
    
    if (!isInitialized) {
      return `${baseStyles} bg-gray-300 text-gray-500 cursor-not-allowed`;
    }
    
    if (conversationActive) {
      return `${baseStyles} bg-green-500 text-white animate-pulse scale-105 focus:ring-green-500 shadow-lg shadow-green-500/50`;
    }
    
    if (isListening) {
      return `${baseStyles} bg-blue-500 text-white animate-pulse-slow scale-110 focus:ring-blue-500 shadow-lg shadow-blue-500/50`;
    }
    
    if (error) {
      return `${baseStyles} bg-red-500 text-white focus:ring-red-500`;
    }
    
    return `${baseStyles} bg-fitness-blue hover:bg-blue-600 text-white focus:ring-fitness-blue hover:scale-105`;
  };

  // Get appropriate icon
  const getIcon = () => {
    const iconSize = size === 'sm' ? 16 : size === 'md' ? 20 : size === 'lg' ? 24 : 28;
    
    if (!isInitialized) {
      return <Loader2 size={iconSize} className="animate-spin" />;
    }
    
    if (conversationActive) {
      return <MessageCircle size={iconSize} />;
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
    if (!isInitialized) return 'Initializing...';
    if (conversationActive) return 'AI Active';
    if (isListening) return 'Listening...';
    if (error) return 'Error';
    return 'Say "Hey Coach"';
  };

  // Handle button press
  const handlePress = async () => {
    if (!isInitialized) {
      return;
    }

    setIsPressed(true);
    
    try {
      if (conversationActive) {
        deactivate();
      } else {
        manualActivate();
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

  if (!isInitialized) {
    return (
      <div className={`${sizeConfig[size]} ${className} flex items-center justify-center bg-gray-300 rounded-full text-gray-500`}>
        <Loader2 size={size === 'sm' ? 16 : size === 'md' ? 20 : size === 'lg' ? 24 : 28} className="animate-spin" />
        {showLabel && (
          <span className="ml-2 text-sm text-gray-600">Initializing...</span>
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
        disabled={!isInitialized}
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
      </button>

      {/* Status Label */}
      {showLabel && (
        <div className="mt-2 text-center">
          <span className={`text-sm font-medium ${
            error ? 'text-red-500' : 
            conversationActive ? 'text-green-600' : 
            isListening ? 'text-blue-600' : 
            'text-gray-600'
          }`}>
            {getStatusText()}
          </span>
          
          {currentTranscript && (
            <div className="mt-1 text-xs text-gray-500 max-w-xs truncate">
              "{currentTranscript}"
            </div>
          )}
        </div>
      )}

      {/* Error Message */}
      {showError && error && (
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-red-100 border border-red-300 text-red-700 px-3 py-2 rounded-lg text-sm whitespace-nowrap z-10">
          {error}
        </div>
      )}

      {/* Conversation Active Indicator */}
      {conversationActive && (
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-green-100 border border-green-300 text-green-700 px-3 py-2 rounded-lg text-sm max-w-xs z-10">
          🤖 AI Coach Active
        </div>
      )}
    </div>
  );
};

export default VoiceButton;