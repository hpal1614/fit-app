import React from 'react';
import { Mic, MicOff, Volume2, AlertCircle } from 'lucide-react';
import { useFixedVoice } from '../../hooks/useFixedVoice';

export const FixedVoiceButton: React.FC<{
  onTranscript?: (transcript: string) => void;
  className?: string;
}> = ({ onTranscript, className = '' }) => {
  const {
    isListening,
    isSpeaking,
    error,
    transcript,
    confidence,
    permissionGranted,
    isInitialized,
    startListening,
    stopListening,
    speak,
    toggleListening,
    clearError
  } = useFixedVoice();

  // Handle transcript changes
  React.useEffect(() => {
    if (transcript && onTranscript) {
      console.log('📝 Transcript received:', transcript);
      onTranscript(transcript);
    }
  }, [transcript, onTranscript]);

  // Test speech function
  const testSpeech = async () => {
    await speak("Voice test successful! I can hear you now.");
  };

  const getButtonStyle = () => {
    if (error) return 'bg-red-500 hover:bg-red-600';
    if (isListening) return 'bg-blue-500 hover:bg-blue-600 animate-pulse';
    if (isSpeaking) return 'bg-green-500 hover:bg-green-600';
    return 'bg-gray-500 hover:bg-gray-600';
  };

  const getStatusText = () => {
    if (!isInitialized) return 'Initializing...';
    if (error) return 'Error - Click to retry';
    if (!permissionGranted) return 'Permission needed';
    if (isListening) return 'Listening... Speak now!';
    if (isSpeaking) return 'Speaking...';
    return 'Click to start listening';
  };

  return (
    <div className={`voice-button-container ${className}`}>
      {/* Main Voice Button */}
      <div className="flex flex-col items-center space-y-3">
        <button
          onClick={error ? clearError : toggleListening}
          disabled={!isInitialized && !error}
          className={`
            w-16 h-16 rounded-full flex items-center justify-center
            text-white font-semibold transition-all duration-300
            shadow-lg hover:shadow-xl transform hover:scale-105
            ${getButtonStyle()}
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
        >
          {error ? (
            <AlertCircle className="w-6 h-6" />
          ) : isListening ? (
            <Mic className="w-6 h-6" />
          ) : isSpeaking ? (
            <Volume2 className="w-6 h-6" />
          ) : (
            <MicOff className="w-6 h-6" />
          )}
        </button>

        {/* Status Text */}
        <p className="text-sm text-center text-gray-600 dark:text-gray-400 max-w-xs">
          {getStatusText()}
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
              <button
                onClick={clearError}
                className="mt-2 text-xs text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 underline"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transcript Display */}
      {transcript && (
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-700 dark:text-blue-400 mb-1">
            You said:
          </p>
          <p className="text-gray-900 dark:text-white font-medium">
            "{transcript}"
          </p>
          {confidence > 0 && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Confidence: {Math.round(confidence * 100)}%
            </p>
          )}
        </div>
      )}

      {/* Debug Panel (remove in production) */}
      <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-xs">
        <p className="font-medium mb-2">Debug Info:</p>
        <div className="space-y-1">
          <p>Initialized: {isInitialized ? '✅' : '❌'}</p>
          <p>Permission: {permissionGranted ? '✅' : '❌'}</p>
          <p>Listening: {isListening ? '✅' : '❌'}</p>
          <p>Speaking: {isSpeaking ? '✅' : '❌'}</p>
          <p>Error: {error ? '❌' : '✅'}</p>
        </div>
        
        {/* Test Button */}
        <button
          onClick={testSpeech}
          className="mt-2 px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
        >
          Test Speech
        </button>
      </div>
    </div>
  );
}; 