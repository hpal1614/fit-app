import { useState, useEffect, useCallback } from 'react';
import type {
  VoiceState,
  VoiceCommandResult,
  VoiceError,
  SpeechOptions
} from '../types/voice';
import type { WorkoutContext } from '../types/workout';
import { unifiedVoiceService } from '../services/ai/UnifiedVoiceService';

interface UseVoiceOptions {
  autoStart?: boolean;
  enableWakeWord?: boolean;
  workoutContext?: WorkoutContext;
}

export interface UseVoiceReturn {
  // State
  state: VoiceState;
  isListening: boolean;
  transcript: string;
  error: VoiceError | null;
  confidence: number;
  lastCommand: VoiceCommandResult | null;
  isSupported: boolean;

  // Methods
  startListening: () => Promise<boolean>;
  stopListening: () => void;
  speak: (text: string, options?: SpeechOptions) => Promise<boolean>;
  clearTranscript: () => void;
  processCommand: (text: string) => VoiceCommandResult | null;
}

export function useVoice(options: UseVoiceOptions = {}): UseVoiceReturn {
  const {
    autoStart = false,
    workoutContext
  } = options;

  // State management
  const [state, setState] = useState<VoiceState>({
    state: 'idle',
    isListening: false,
    isProcessing: false,
    isSpeaking: false,
    error: null
  });

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<VoiceError | null>(null);
  const [confidence, setConfidence] = useState(0);
  const [lastCommand, setLastCommand] = useState<VoiceCommandResult | null>(null);

  // Initialize voice service
  useEffect(() => {
    // Set up event listeners
    unifiedVoiceService.on('recognition:start', () => {
      setIsListening(true);
      setState(prev => ({ ...prev, isListening: true, state: 'listening' }));
    });
    
    unifiedVoiceService.on('recognition:end', () => {
      setIsListening(false);
      setState(prev => ({ ...prev, isListening: false, state: 'idle' }));
    });

    unifiedVoiceService.on('recognition:error', (err) => {
      const errorMessage = err as string;
      setError({ message: errorMessage, code: 'RECOGNITION_ERROR' });
      setState(prev => ({ ...prev, error: { message: errorMessage, code: 'RECOGNITION_ERROR' } }));
    });

    unifiedVoiceService.on('recognition:final', (text) => {
      setTranscript(text as string);
    });

    unifiedVoiceService.on('recognition:interim', (text) => {
      setTranscript(text as string);
    });

    if (autoStart) {
      unifiedVoiceService.startListening();
    }

    // Cleanup
    return () => {
      unifiedVoiceService.removeAllListeners();
    };
  }, [autoStart]);

  // Methods
  const startListening = useCallback(async (): Promise<boolean> => {
    try {
      const success = unifiedVoiceService.startListening();
      if (success) {
        setError(null);
      }
      return success;
    } catch (err) {
      setError({ message: 'Failed to start listening', code: 'START_ERROR' });
      return false;
    }
  }, []);

  const stopListening = useCallback(() => {
    unifiedVoiceService.stopListening();
  }, []);

  const speak = useCallback(async (text: string, options?: SpeechOptions): Promise<boolean> => {
    try {
      await unifiedVoiceService.speak(text, options);
      return true;
    } catch (err) {
      setError({ message: 'Failed to speak', code: 'SPEAK_ERROR' });
      return false;
    }
  }, []);

  const clearTranscript = useCallback(() => {
    setTranscript('');
  }, []);

  const processCommand = useCallback((text: string): VoiceCommandResult | null => {
    const command = unifiedVoiceService.processVoiceCommand(text);
    if (command) {
      const result: VoiceCommandResult = {
        command: command.command,
        parameters: command.parameters,
        confidence: command.confidence,
        transcript: text,
        timestamp: Date.now()
      };
      setLastCommand(result);
      setConfidence(command.confidence);
      return result;
    }
    return null;
  }, []);

  const { recognition, synthesis } = unifiedVoiceService.isSupported();
  const isSupported = recognition && synthesis;

  return {
    // State
    state,
    isListening,
    transcript,
    error,
    confidence,
    lastCommand,
    isSupported,

    // Methods
    startListening,
    stopListening,
    speak,
    clearTranscript,
    processCommand
  };
}