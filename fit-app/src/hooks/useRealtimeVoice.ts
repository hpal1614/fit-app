import { useState, useEffect, useCallback, useRef } from 'react';
import { voiceService } from '../services/voiceService';

interface VoiceMode {
  provider: 'openai-realtime' | 'elevenlabs' | 'webrtc' | 'browser';
  latencyTarget: number;
  features: string[];
}

interface UseRealtimeVoiceOptions {
  mode?: VoiceMode['provider'];
  autoStart?: boolean;
  workoutIntensity?: 'low' | 'medium' | 'high';
  enableEmotionalAdaptation?: boolean;
}

interface UseRealtimeVoiceReturn {
  isInitialized: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  currentMode: VoiceMode['provider'];
  transcript: string;
  response: string;
  metrics: any;
  startListening: () => Promise<void>;
  stopListening: () => void;
  speak: (text: string) => Promise<void>;
  switchMode: (mode: VoiceMode['provider']) => Promise<void>;
  updateWorkoutContext: (context: any) => void;
  setEmotionalTone: (intensity: 'low' | 'medium' | 'high') => Promise<void>;
}

export function useRealtimeVoice(options: UseRealtimeVoiceOptions = {}): UseRealtimeVoiceReturn {
  const {
    mode = 'browser',
    autoStart = false,
    workoutIntensity = 'medium',
    enableEmotionalAdaptation = true
  } = options;

  const [isInitialized, setIsInitialized] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentMode, setCurrentMode] = useState<VoiceMode['provider']>(mode);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [metrics, setMetrics] = useState<any>({
    averageLatency: 150,
    quality: 'medium',
    emotionalAdaptations: 0
  });
  
  const workoutContextRef = useRef<any>({
    intensity: workoutIntensity,
    exerciseType: null,
    repCount: 0,
    setNumber: 0
  });

  // Initialize voice services
  useEffect(() => {
    const initializeVoice = async () => {
      try {
        await voiceService.initialize(currentMode);
        setIsInitialized(true);

        if (autoStart) {
          await startListening();
        }
      } catch (error) {
        console.error('Failed to initialize voice service:', error);
      }
    };

    initializeVoice();
  }, [currentMode]);

  // Start listening
  const startListening = useCallback(async () => {
    if (!isInitialized || isListening) return;

    setIsListening(true);
    
    voiceService.startListening((text: string, isFinal: boolean) => {
      setTranscript(text);
      
      if (isFinal) {
        // Process the final transcript
        setResponse(`I heard you say: "${text}". Let me help you with that!`);
      }
    });
  }, [isInitialized, isListening]);

  // Stop listening
  const stopListening = useCallback(() => {
    setIsListening(false);
    voiceService.stopListening();
  }, []);

  // Speak text using selected voice service
  const speak = useCallback(async (text: string) => {
    if (!isInitialized) return;
    
    setIsSpeaking(true);
    
    try {
      await voiceService.speak(text, workoutContextRef.current);
    } catch (error) {
      console.error('Failed to speak:', error);
    } finally {
      setIsSpeaking(false);
    }
  }, [isInitialized]);

  // Switch voice mode
  const switchMode = useCallback(async (newMode: VoiceMode['provider']) => {
    if (newMode === currentMode) return;
    
    stopListening();
    await voiceService.switchMode(newMode);
    setCurrentMode(newMode);
  }, [currentMode, stopListening]);

  // Update workout context
  const updateWorkoutContext = useCallback((context: any) => {
    workoutContextRef.current = { ...workoutContextRef.current, ...context };
  }, []);

  // Set emotional tone
  const setEmotionalTone = useCallback(async (intensity: 'low' | 'medium' | 'high') => {
    workoutContextRef.current.intensity = intensity;
    
    if (enableEmotionalAdaptation) {
      await voiceService.setEmotionalTone(intensity);
      setMetrics(prev => ({
        ...prev,
        emotionalAdaptations: prev.emotionalAdaptations + 1
      }));
    }
  }, [enableEmotionalAdaptation]);

  return {
    isInitialized,
    isListening,
    isSpeaking,
    currentMode,
    transcript,
    response,
    metrics,
    startListening,
    stopListening,
    speak,
    switchMode,
    updateWorkoutContext,
    setEmotionalTone
  };
}