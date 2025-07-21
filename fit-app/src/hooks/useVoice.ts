import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  VoiceState,
  VoiceCommandResult,
  VoiceInput,
  VoiceError,
  VoiceAction,
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
    confidence: 0,
    error: null,
    lastTranscript: '',
    lastCommand: null
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

        // Set up event listeners
        voiceService.addEventListener('stateChange', (event) => {
          setState(event.state);
        });

        voiceService.addEventListener('error', (event) => {
          setError(event.error);
        });

        voiceService.addEventListener('commandProcessed', (event) => {
          setLastCommand(event.result);
          setConfidence(event.result.confidence);
        });

        voiceService.addEventListener('transcriptChange', (event) => {
          // Handle intermediate transcripts
        });

        // Initialize with workout context
        const initialized = await voiceService.initialize({
          enableWakeWord,
          workoutContext
        });

        if (initialized && autoStart) {
          await voiceService.startListening();
        }

      } catch (err) {
        setError({
          type: 'initialization_error',
          message: 'Failed to initialize voice service',
          timestamp: new Date(),
          recoverable: false
        });
      }
    };

    initializeVoice();

    // Cleanup on unmount
    return () => {
      if (voiceServiceRef.current) {
        voiceServiceRef.current.stopListening();
        voiceServiceRef.current.stopSpeaking();
      }
    };
  }, [autoStart, enableWakeWord]);

  // Update workout context when it changes
  useEffect(() => {
    if (voiceServiceRef.current && workoutContext) {
      voiceServiceRef.current.updateWorkoutContext(workoutContext);
    }
  }, [workoutContext]);

  // Voice control functions
  const startListening = useCallback(async (): Promise<boolean> => {
    if (!voiceServiceRef.current) return false;
    
    try {
      setError(null);
      return await voiceServiceRef.current.startListening();
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
      return await voiceServiceRef.current.speak(text, options);
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

  const stopSpeaking = useCallback(() => {
    if (voiceServiceRef.current) {
      voiceServiceRef.current.stopSpeaking();
    }
  }, []);

  const processCommand = useCallback(async (input: string): Promise<VoiceCommandResult> => {
    if (!voiceServiceRef.current) {
      return {
        success: false,
        action: 'unknown',
        confidence: 0,
        response: 'Voice service not available',
        error: 'Service not initialized'
      };
    }

    try {
      setError(null);
      const result = await voiceServiceRef.current.processVoiceInput({
        transcript: input,
        confidence: 1.0,
        timestamp: new Date(),
        isFinal: true
      });
      
      setLastCommand(result);
      setConfidence(result.confidence);
      return result;
    } catch (err) {
      const errorResult: VoiceCommandResult = {
        success: false,
        action: 'unknown',
        confidence: 0,
        response: 'Failed to process command',
        error: err instanceof Error ? err.message : 'Unknown error'
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