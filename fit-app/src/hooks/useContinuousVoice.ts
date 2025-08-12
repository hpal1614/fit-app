import { useState, useEffect, useRef } from 'react';
import { ContinuousVoiceService } from '../services/continuousVoiceService';

export const useContinuousVoice = (aiService: any) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [conversationActive, setConversationActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const voiceServiceRef = useRef<ContinuousVoiceService | null>(null);

  useEffect(() => {
    const initializeVoice = async () => {
      try {
        const voiceService = new ContinuousVoiceService({}, aiService);
        
        // Set up event listeners
        voiceService.onStateChange = (state) => {
          setConversationActive(state.conversationActive || false);
          setIsListening(state.isListening || false);
          setCurrentTranscript(state.currentTranscript || '');
        };
        
        voiceService.onError = (error) => {
          setError(error.message);
        };

        // Initialize and start wake word listening
        const initialized = await voiceService.initialize();
        if (initialized) {
          await voiceService.startWakeWordListening();
          setIsInitialized(true);
        }
        
        voiceServiceRef.current = voiceService;
        
      } catch (error) {
        setError('Failed to initialize voice service');
        console.error('Voice initialization error:', error);
      }
    };

    if (aiService) {
      initializeVoice();
    }

    return () => {
      if (voiceServiceRef.current) {
        voiceServiceRef.current.deactivateConversation();
      }
    };
  }, [aiService]);

  const manualActivate = () => {
    if (voiceServiceRef.current) {
      voiceServiceRef.current.activateConversation();
    }
  };

  const deactivate = () => {
    if (voiceServiceRef.current) {
      voiceServiceRef.current.deactivateConversation();
    }
  };

  return {
    isInitialized,
    conversationActive,
    isListening,
    currentTranscript,
    error,
    manualActivate,
    deactivate
  };
};
