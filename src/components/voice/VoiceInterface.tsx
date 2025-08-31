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
    if (error) return 'bg-error';
    if (isListening) return 'bg-primary';
    if (isSpeaking) return 'bg-secondary';
    if (isProcessing) return 'bg-accent';
    return 'bg-gray-500';
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
    <div className="card p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Voice Assistant
        </h2>
        <div className={`px-4 py-2 rounded-xl text-sm font-medium text-white ${getStatusColor()}`}>
          {getStatusText()}
        </div>
      </div>

      {/* Test Wake-Word Toggle */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600 dark:text-gray-300">Test mode: say "Hey Coach" to wake</span>
        <button
          onClick={onToggle}
          className="px-3 py-1.5 text-xs rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
        >
          {isListening ? 'Stop Test' : 'Start Test'}
        </button>
      </div>

      {/* Main Voice Button */}
      <div className="flex flex-col items-center space-y-6">
        <div className="relative">
          {/* Ripple effect for listening state */}
          {isListening && (
            <>
              <div className="absolute inset-0 rounded-full bg-primary animate-ping opacity-20" />
              <div className="absolute inset-0 rounded-full bg-primary animate-pulse opacity-40" />
            </>
          )}
          
          {/* Main button */}
          <button
            onClick={onToggle}
            disabled={!isInitialized || isSpeaking || isProcessing}
            className={`
              relative w-24 h-24 rounded-full flex items-center justify-center
              transition-all duration-300 ease-in-out transform hover:scale-105
              disabled:opacity-50 disabled:cursor-not-allowed
              ${getStatusColor()}
              ${isListening ? 'animate-pulse-slow' : ''}
              shadow-soft hover:shadow-medium
            `}
          >
            {getStatusIcon()}
          </button>
        </div>

        {/* Voice waves animation */}
        {(isListening || isSpeaking) && (
          <div className="flex items-center space-x-2">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className={`voice-wave h-8 ${
                  isListening ? 'bg-primary' : 'bg-secondary'
                }`}
                style={{
                  animationDelay: `${i * 0.1}s`,
                  animationDuration: '1.5s'
                }}
              />
            ))}
          </div>
        )}

        {/* Status message */}
        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {isListening && "I'm listening... Speak naturally!"}
            {isSpeaking && "Speaking response..."}
            {isProcessing && "Processing your request..."}
            {!isListening && !isSpeaking && !isProcessing && !error && "Tap to start listening"}
            {error && "Voice recognition error"}
          </p>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-error/10 border border-error/20 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-error">Voice Recognition Error</h3>
            <button
              onClick={onClearError}
              className="text-error hover:text-red-700 dark:hover:text-red-400 transition-colors"
            >
              ✕
            </button>
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {error.message}
          </p>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            Error Code: {error.code}
          </div>
        </div>
      )}

      {/* Transcript Display */}
      {transcript && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white">Transcript</h3>
          <div className="bg-gray-50 dark:bg-dark-700 rounded-xl p-4">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              "{transcript}"
            </p>
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                <span>Confidence</span>
                <span>{Math.round(confidence * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-dark-600 rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${confidence * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Voice Commands Help */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white">Voice Commands</h3>
        <div className="grid grid-cols-1 gap-2 text-xs">
          <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-dark-700 rounded-lg">
            <span className="text-gray-700 dark:text-gray-300">"Start workout"</span>
            <span className="text-primary font-medium">Begin session</span>
          </div>
          <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-dark-700 rounded-lg">
            <span className="text-gray-700 dark:text-gray-300">"Log bench press 8 reps 185"</span>
            <span className="text-primary font-medium">Record set</span>
          </div>
          <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-dark-700 rounded-lg">
            <span className="text-gray-700 dark:text-gray-300">"What's my squat PR?"</span>
            <span className="text-primary font-medium">Get records</span>
          </div>
          <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-dark-700 rounded-lg">
            <span className="text-gray-700 dark:text-gray-300">"Give me motivation"</span>
            <span className="text-primary font-medium">Get inspired</span>
          </div>
        </div>
      </div>
    </div>
  );
}