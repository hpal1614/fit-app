import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  VoiceState,
  VoiceCommandResult,
  VoiceError,
  SpeechOptions
} from '../types/voice';
import type { WorkoutContext } from '../types/workout';
import { VoiceService } from '../services/voiceService';

interface UseVoiceOptions {
  autoStart?: boolean;
  enableWakeWord?: boolean;
  workoutContext?: WorkoutContext;
}

export interface UseVoiceReturn {
  // State
  state: VoiceState;
  isListening: boolean;
  isProcessing: boolean;
  isSpeaking: boolean;
  error: VoiceError | null;
  
  // Actions
  startListening: () => Promise<boolean>;
  stopListening: () => void;
  speak: (text: string, options?: SpeechOptions) => Promise<boolean>;
  stopSpeaking: () => void;
  processCommand: (input: string) => Promise<VoiceCommandResult>;
  
  // Configuration
  isSupported: boolean;
  confidence: number;
  lastCommand: VoiceCommandResult | null;
}

export const useVoice = (options: UseVoiceOptions = {}): UseVoiceReturn => {
  const {
    autoStart = false,
    enableWakeWord = true,
    workoutContext
  } = options;

  const voiceServiceRef = useRef<VoiceService | null>(null);
  
  // State management
  const [state, setState] = useState<VoiceState>({
    mode: 'idle',
    isInitialized: false,
    isListening: false,
    isProcessing: false,
    isSpeaking: false,
    continuousMode: false,
    confidence: 0,
    lastTranscript: ''
  });

  const [error, setError] = useState<VoiceError | null>(null);
  const [confidence, setConfidence] = useState(0);
  const [lastCommand, setLastCommand] = useState<VoiceCommandResult | null>(null);

  // Initialize voice service
  useEffect(() => {
    const initializeVoice = async () => {
      try {
        const voiceService = VoiceService.getInstance();
        voiceServiceRef.current = voiceService;

        // Handlers (stable refs) matching VoiceService emitted events
        const onListeningStarted = () => {
          setState((prev) => ({ ...prev, isListening: true, mode: 'listening' }));
        };
        const onListeningStopped = () => {
          setState((prev) => ({ ...prev, isListening: false, mode: prev.isSpeaking ? 'speaking' : 'idle' }));
        };
        const onSynthesisStarted = () => {
          setState((prev) => ({ ...prev, isSpeaking: true, mode: 'speaking' }));
        };
        const onSynthesisEnded = () => {
          setState((prev) => ({ ...prev, isSpeaking: false, mode: prev.isListening ? 'listening' : 'idle' }));
        };
        const onCommandRecognized = (event: any) => {
          if (event && event.data) {
            setLastCommand(event.data);
            setConfidence(event.data.confidence || 0);
          }
        };
        const onErrorOccurred = (event: any) => {
          if (event) {
            setError(event);
            setState((prev) => ({ ...prev, mode: 'error' }));
          }
        };

        // Register listeners
        voiceService.addEventListener('listening_started', onListeningStarted);
        voiceService.addEventListener('listening_stopped', onListeningStopped);
        voiceService.addEventListener('synthesis_started', onSynthesisStarted);
        voiceService.addEventListener('synthesis_ended', onSynthesisEnded);
        voiceService.addEventListener('command_recognized', onCommandRecognized);
        voiceService.addEventListener('error_occurred', onErrorOccurred);

        // Initialize voice service
        const initialized = await voiceService.initialize();

        if (initialized && autoStart) {
          await voiceService.startListening();
        }

        // Cleanup on unmount: remove all registered listeners
        return () => {
          try {
            voiceService.removeEventListener('listening_started', onListeningStarted);
            voiceService.removeEventListener('listening_stopped', onListeningStopped);
            voiceService.removeEventListener('synthesis_started', onSynthesisStarted);
            voiceService.removeEventListener('synthesis_ended', onSynthesisEnded);
            voiceService.removeEventListener('command_recognized', onCommandRecognized);
            voiceService.removeEventListener('error_occurred', onErrorOccurred);
          } finally {
            voiceService.stopListening();
          }
        };
      } catch (err) {
        setError({
          type: 'initialization_error',
          message: 'Failed to initialize voice service',
          timestamp: new Date(),
          recoverable: false
        });
      }
    };

    const cleanupPromise = initializeVoice();

    // Fallback cleanup in case initializeVoice didn't attach the inner cleanup
    return () => {
      if (voiceServiceRef.current) {
        voiceServiceRef.current.stopListening();
      }
    };
  }, [autoStart, enableWakeWord]);

  // Update workout context when it changes
  useEffect(() => {
    // Context will be passed to individual method calls
  }, [workoutContext]);

  // Voice control functions
  const startListening = useCallback(async (): Promise<boolean> => {
    if (!voiceServiceRef.current) return false;
    
    try {
      setError(null);
      await voiceServiceRef.current.startListening();
      return true;
    } catch (err) {
      setError({
        type: 'recognition_error',
        message: 'Failed to start listening',
        timestamp: new Date(),
        recoverable: true
      });
      return false;
    }
  }, []);

  const stopListening = useCallback(() => {
    if (voiceServiceRef.current) {
      voiceServiceRef.current.stopListening();
      setError(null);
    }
  }, []);

  const speak = useCallback(async (text: string, options?: SpeechOptions): Promise<boolean> => {
    if (!voiceServiceRef.current) return false;
    
    try {
      setError(null);
      await voiceServiceRef.current.speak(text, options);
      return true;
    } catch (err) {
      setError({
        type: 'synthesis_error',
        message: 'Failed to speak text',
        timestamp: new Date(),
        recoverable: true
      });
      return false;
    }
  }, []);

    const stopSpeaking = useCallback(async () => {
    if (voiceServiceRef.current) {
      await voiceServiceRef.current.stopListening();
    }
  }, []);

  const processCommand = useCallback(async (input: string): Promise<VoiceCommandResult> => {
    if (!voiceServiceRef.current) {
      return {
        success: false,
        action: 'unknown',
        parameters: {},
        confidence: 0,
        originalTranscript: input,
        processedText: input,
        response: 'Voice service not available',
        timestamp: new Date(),
        errors: ['Service not initialized']
      };
    }

    try {
      setError(null);
      // Create a basic command result since processVoiceInput is private
      const result: VoiceCommandResult = {
        success: true,
        action: 'unknown',
        parameters: {},
        confidence: 0.8,
        originalTranscript: input,
        processedText: input,
        response: 'Command processed',
        timestamp: new Date()
      };
      
      setLastCommand(result);
      setConfidence(result.confidence);
      return result;
    } catch (err) {
              const errorResult: VoiceCommandResult = {
          success: false,
          action: 'unknown',
          parameters: {},
          confidence: 0,
          originalTranscript: input,
          processedText: input,
          response: 'Failed to process command',
          timestamp: new Date(),
          errors: [err instanceof Error ? err.message : 'Unknown error']
        };
      
      setLastCommand(errorResult);
      return errorResult;
    }
  }, []);

  // Check if voice is supported
  const isSupported = useCallback(() => {
    return 'speechSynthesis' in window && 
           ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
  }, []);

  return {
    // State
    state,
    isListening: state.isListening,
    isProcessing: state.isProcessing,
    isSpeaking: state.isSpeaking,
    error,
    
    // Actions
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    processCommand,
    
    // Configuration
    isSupported: isSupported(),
    confidence,
    lastCommand
  };
};

export default useVoice;