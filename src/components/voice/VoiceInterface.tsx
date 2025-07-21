import React from 'react';
import { VoiceState, VoiceError } from '../../types';
import { Mic, MicOff, Volume2, AlertCircle, Loader } from 'lucide-react';

interface VoiceInterfaceProps {
  voiceState: VoiceState | null;
  isInitialized: boolean;
  error: VoiceError | null;
  transcript: string;
  confidence: number;
  onToggle: () => void;
  onClearError: () => void;
}

export function VoiceInterface({
  voiceState,
  isInitialized,
  error,
  transcript,
  confidence,
  onToggle,
  onClearError
}: VoiceInterfaceProps) {
  const mode = voiceState?.mode || 'idle';
  const isListening = voiceState?.isListening || false;
  const isSpeaking = voiceState?.isSpeaking || false;
  const isProcessing = voiceState?.isProcessing || false;

  const getStatusColor = () => {
    if (error) return 'bg-fitness-red';
    if (isListening) return 'bg-voice-listening';
    if (isSpeaking) return 'bg-voice-speaking';
    if (isProcessing) return 'bg-voice-processing';
    return 'bg-gray-600';
  };

  const getStatusText = () => {
    if (error) return 'Error';
    if (!isInitialized) return 'Initializing...';
    if (isListening) return 'Listening...';
    if (isSpeaking) return 'Speaking...';
    if (isProcessing) return 'Processing...';
    return 'Ready';
  };

  const getStatusIcon = () => {
    if (error) return <AlertCircle className="w-6 h-6" />;
    if (!isInitialized || isProcessing) return <Loader className="w-6 h-6 animate-spin" />;
    if (isSpeaking) return <Volume2 className="w-6 h-6" />;
    if (isListening) return <Mic className="w-6 h-6" />;
    return <MicOff className="w-6 h-6" />;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Voice Assistant
        </h2>
        <div className={`px-3 py-1 rounded-full text-xs font-medium text-white ${getStatusColor()}`}>
          {getStatusText()}
        </div>
      </div>

      {/* Main Voice Button */}
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          {/* Ripple effect for listening state */}
          {isListening && (
            <>
              <div className="absolute inset-0 rounded-full bg-voice-listening animate-ping opacity-20" />
              <div className="absolute inset-0 rounded-full bg-voice-listening animate-pulse opacity-40" />
            </>
          )}
          
          {/* Main button */}
          <button
            onClick={onToggle}
            disabled={!isInitialized || isSpeaking || isProcessing}
            className={`
              relative w-20 h-20 rounded-full flex items-center justify-center
              transition-all duration-300 ease-in-out transform hover:scale-105
              disabled:opacity-50 disabled:cursor-not-allowed
              ${getStatusColor()}
              ${isListening ? 'animate-pulse-slow' : ''}
              shadow-lg hover:shadow-xl
            `}
          >
            {getStatusIcon()}
          </button>
        </div>

        {/* Voice waves animation */}
        {(isListening || isSpeaking) && (
          <div className="flex items-center space-x-1">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className={`voice-wave h-6 ${
                  isListening ? 'bg-voice-listening' : 'bg-voice-speaking'
                }`}
                style={{
                  animationDelay: `${i * 0.1}s`,
                  height: `${Math.random() * 20 + 10}px`
                }}
              />
            ))}
          </div>
        )}

        {/* Action text */}
        <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
          {!isInitialized ? 'Setting up voice recognition...' :
           error ? 'Voice recognition error' :
           isListening ? 'I\'m listening. Say a command!' :
           isSpeaking ? 'Speaking your response...' :
           isProcessing ? 'Processing your command...' :
           'Tap to start voice commands'}
        </p>
      </div>

      {/* Transcript Display */}
      {transcript && (
        <div className="space-y-2">
          <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <span className="font-medium">You said:</span> "{transcript}"
            </p>
            
            {/* Confidence indicator */}
            <div className="mt-2 flex items-center space-x-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">Confidence:</span>
              <div className="flex-1 bg-gray-300 dark:bg-gray-600 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    confidence > 0.8 ? 'bg-fitness-green' :
                    confidence > 0.6 ? 'bg-fitness-orange' : 'bg-fitness-red'
                  }`}
                  style={{ width: `${confidence * 100}%` }}
                />
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {Math.round(confidence * 100)}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-red-800 dark:text-red-200">
                Voice Error
              </h4>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                {error.message}
              </p>
              {error.type === 'permission_denied' && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                  Please allow microphone access in your browser settings.
                </p>
              )}
            </div>
            <button
              onClick={onClearError}
              className="text-red-500 hover:text-red-700 dark:hover:text-red-300"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Voice Commands Help */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
        <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
          Example Commands:
        </h4>
        <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
          <li>• "Start workout" or "Start chest workout"</li>
          <li>• "Log bench press for 8 reps at 185 pounds"</li>
          <li>• "What's my squat personal record?"</li>
          <li>• "Start rest timer"</li>
          <li>• "I need motivation"</li>
          <li>• "What should I eat after my workout?"</li>
        </ul>
      </div>

      {/* Initialization Status */}
      {!isInitialized && (
        <div className="flex items-center justify-center space-x-2 text-gray-500 dark:text-gray-400">
          <Loader className="w-4 h-4 animate-spin" />
          <span className="text-sm">Initializing voice recognition...</span>
        </div>
      )}
    </div>
  );
}