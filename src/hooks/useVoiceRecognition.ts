import { useState, useEffect, useCallback, useRef } from 'react';
import { VoiceState, VoiceCommandResult, VoiceError, WorkoutContext } from '../types';
import { getVoiceService } from '../services/voiceService';

export function useVoiceRecognition(context?: WorkoutContext) {
  const [voiceState, setVoiceState] = useState<VoiceState | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<VoiceError | null>(null);
  const [lastCommand, setLastCommand] = useState<VoiceCommandResult | null>(null);
  const [transcript, setTranscript] = useState('');
  const [confidence, setConfidence] = useState(0);

  const voiceServiceRef = useRef(getVoiceService());
  const voiceService = voiceServiceRef.current;

  // Initialize voice service
  useEffect(() => {
    const initializeVoice = async () => {
      try {
        const success = await voiceService.initialize();
        setIsInitialized(success);
        if (!success) {
          setError({
            type: 'recognition_failed',
            message: 'Failed to initialize voice recognition',
            timestamp: new Date()
          });
        }
      } catch (err) {
        setError({
          type: 'recognition_failed',
          message: err instanceof Error ? err.message : 'Unknown error',
          timestamp: new Date()
        });
      }
    };

    initializeVoice();

    // Set up event listeners
    voiceService.onStateChanged((state) => {
      setVoiceState(state);
      setError(state.error || null);
    });

    voiceService.onCommandRecognition((result) => {
      setLastCommand(result);
    });

    voiceService.onErrorOccurred((err) => {
      setError(err);
    });

    voiceService.onTranscriptReceived((text, conf) => {
      setTranscript(text);
      setConfidence(conf);
    });

    return () => {
      voiceService.destroy();
    };
  }, [voiceService]);

  // Start listening
  const startListening = useCallback(async () => {
    if (!isInitialized) return false;
    
    try {
      await voiceService.startListening(context);
      return true;
    } catch (err) {
      setError({
        type: 'recognition_failed',
        message: err instanceof Error ? err.message : 'Failed to start listening',
        timestamp: new Date()
      });
      return false;
    }
  }, [voiceService, isInitialized, context]);

  // Stop listening
  const stopListening = useCallback(() => {
    voiceService.stopListening();
  }, [voiceService]);

  // Speak text
  const speak = useCallback(async (text: string, options?: any) => {
    try {
      await voiceService.speak(text, options);
      return true;
    } catch (err) {
      setError({
        type: 'synthesis_failed',
        message: err instanceof Error ? err.message : 'Failed to speak',
        timestamp: new Date()
      });
      return false;
    }
  }, [voiceService]);

  // Toggle listening
  const toggleListening = useCallback(() => {
    if (voiceState?.isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [voiceState?.isListening, startListening, stopListening]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Get current voice mode
  const mode = voiceState?.mode || 'idle';
  const isListening = voiceState?.isListening || false;
  const isSpeaking = voiceState?.isSpeaking || false;
  const isProcessing = voiceState?.isProcessing || false;

  return {
    // State
    voiceState,
    isInitialized,
    error,
    lastCommand,
    transcript,
    confidence,
    mode,
    isListening,
    isSpeaking,
    isProcessing,

    // Actions
    startListening,
    stopListening,
    speak,
    toggleListening,
    clearError,

    // Computed
    isActive: isListening || isSpeaking || isProcessing,
    canListen: isInitialized && !isSpeaking && !isProcessing,
    hasError: error !== null
  };
}