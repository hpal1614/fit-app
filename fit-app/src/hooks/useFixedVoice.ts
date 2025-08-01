import { useState, useEffect, useCallback, useRef } from 'react';
import { getFixedVoiceService, SimpleVoiceState } from '../services/fixedVoiceService';

export function useFixedVoice() {
  const [state, setState] = useState<SimpleVoiceState>({
    isListening: false,
    isSpeaking: false,
    error: null,
    transcript: '',
    confidence: 0,
    permissionGranted: false
  });
  
  const [isInitialized, setIsInitialized] = useState(false);
  const voiceServiceRef = useRef(getFixedVoiceService());
  const voiceService = voiceServiceRef.current;

  // Initialize voice service
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const initVoice = async () => {
      console.log('🎤 Initializing voice hook...');
      
      // Subscribe to state changes
      unsubscribe = voiceService.onStateChange((newState) => {
        console.log('🎤 Voice state updated:', newState);
        setState(newState);
      });

      // Initialize the service
      const success = await voiceService.initialize();
      setIsInitialized(success);
      
      if (success) {
        console.log('✅ Voice hook initialized successfully');
      } else {
        console.error('❌ Voice hook initialization failed');
      }
    };

    initVoice();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [voiceService]);

  // Start listening with user interaction
  const startListening = useCallback(async () => {
    console.log('🎤 Hook: Start listening called');
    
    if (!isInitialized) {
      console.log('⚠️ Voice not initialized, initializing now...');
      const success = await voiceService.initialize();
      if (!success) {
        console.error('❌ Failed to initialize voice service');
        return false;
      }
      setIsInitialized(true);
    }

    const success = await voiceService.startListening();
    console.log('🎤 Start listening result:', success);
    return success;
  }, [voiceService, isInitialized]);

  // Stop listening
  const stopListening = useCallback(() => {
    console.log('🛑 Hook: Stop listening called');
    voiceService.stopListening();
  }, [voiceService]);

  // Speak text
  const speak = useCallback(async (text: string) => {
    console.log('🔊 Hook: Speak called with:', text);
    try {
      await voiceService.speak(text);
      return true;
    } catch (error) {
      console.error('❌ Speak failed:', error);
      return false;
    }
  }, [voiceService]);

  // Toggle listening
  const toggleListening = useCallback(async () => {
    console.log('🔄 Hook: Toggle listening called, current state:', state.isListening);
    
    if (state.isListening) {
      stopListening();
    } else {
      return await startListening();
    }
  }, [state.isListening, startListening, stopListening]);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    // State
    isListening: state.isListening,
    isSpeaking: state.isSpeaking,
    error: state.error,
    transcript: state.transcript,
    confidence: state.confidence,
    permissionGranted: state.permissionGranted,
    isInitialized,

    // Actions
    startListening,
    stopListening,
    speak,
    toggleListening,
    clearError,

    // Computed
    isActive: state.isListening || state.isSpeaking,
    hasError: !!state.error
  };
} 