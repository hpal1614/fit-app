import { useState, useEffect, useCallback, useRef } from 'react';
import { realtimeVoice } from '../services/realtimeVoice';
import { emotionalVoice } from '../services/emotionalVoice';
import { webrtcVoice } from '../services/webrtcService';
import { aiService } from '../services/aiService';

interface VoiceMode {
  provider: 'openai-realtime' | 'elevenlabs' | 'webrtc';
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
    mode = 'openai-realtime',
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
  const [metrics, setMetrics] = useState<any>({});
  
  const recognitionRef = useRef<any>(null);
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
        // Initialize based on selected mode
        switch (currentMode) {
          case 'openai-realtime':
            await realtimeVoice.initialize();
            if (enableEmotionalAdaptation) {
              await realtimeVoice.adaptEmotionalTone(workoutIntensity);
            }
            break;
            
          case 'elevenlabs':
            await emotionalVoice.initialize();
            if (enableEmotionalAdaptation) {
              await emotionalVoice.adaptToWorkoutContext({
                intensity: workoutIntensity
              });
            }
            break;
            
          case 'webrtc':
            await webrtcVoice.initialize('user-123', 'client');
            break;
        }

        setIsInitialized(true);

        // Start listening if autoStart is enabled
        if (autoStart) {
          await startListening();
        }
      } catch (error) {
        console.error('Failed to initialize voice service:', error);
      }
    };

    initializeVoice();

    // Cleanup on unmount
    return () => {
      stopListening();
      if (currentMode === 'openai-realtime') {
        realtimeVoice.dispose();
      } else if (currentMode === 'elevenlabs') {
        emotionalVoice.dispose();
      } else if (currentMode === 'webrtc') {
        webrtcVoice.dispose();
      }
    };
  }, [currentMode]);

  // Update metrics periodically
  useEffect(() => {
    const updateMetrics = () => {
      let newMetrics = {};
      
      switch (currentMode) {
        case 'openai-realtime':
          newMetrics = realtimeVoice.getMetrics();
          break;
        case 'elevenlabs':
          newMetrics = emotionalVoice.getMetrics();
          break;
        case 'webrtc':
          newMetrics = webrtcVoice.getMetrics();
          break;
      }
      
      setMetrics(newMetrics);
    };

    const interval = setInterval(updateMetrics, 1000);
    return () => clearInterval(interval);
  }, [currentMode]);

  // Start listening
  const startListening = useCallback(async () => {
    if (!isInitialized || isListening) return;

    setIsListening(true);
    
    switch (currentMode) {
      case 'openai-realtime':
        // OpenAI Realtime handles its own speech recognition
        console.log('Realtime voice listening started');
        break;
        
      case 'elevenlabs':
      case 'webrtc':
        // Use Web Speech API for speech recognition
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
          const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
          recognitionRef.current = new SpeechRecognition();
          
          recognitionRef.current.continuous = true;
          recognitionRef.current.interimResults = true;
          recognitionRef.current.lang = 'en-US';
          
          recognitionRef.current.onresult = async (event: any) => {
            const last = event.results.length - 1;
            const text = event.results[last][0].transcript;
            
            setTranscript(text);
            
            if (event.results[last].isFinal) {
              // Process the final transcript
              await processVoiceInput(text);
            }
          };
          
          recognitionRef.current.onerror = (event: any) => {
            console.error('Speech recognition error:', event.error);
            setIsListening(false);
          };
          
          recognitionRef.current.start();
        }
        break;
    }
  }, [isInitialized, isListening, currentMode]);

  // Stop listening
  const stopListening = useCallback(() => {
    setIsListening(false);
    
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    
    if (currentMode === 'openai-realtime') {
      realtimeVoice.handleInterruption();
    }
  }, [currentMode]);

  // Process voice input
  const processVoiceInput = useCallback(async (text: string) => {
    try {
      // Update AI service with workout context
      aiService.updateWorkoutContext(workoutContextRef.current);
      
      // Get AI response
      const aiResponse = await aiService.sendMessage(text);
      setResponse(aiResponse.message);
      
      // Speak the response
      await speak(aiResponse.message);
    } catch (error) {
      console.error('Failed to process voice input:', error);
    }
  }, []);

  // Speak text using selected voice service
  const speak = useCallback(async (text: string) => {
    if (!isInitialized) return;
    
    setIsSpeaking(true);
    
    try {
      switch (currentMode) {
        case 'openai-realtime':
          // OpenAI Realtime handles speech synthesis internally
          console.log('Speaking via Realtime API:', text);
          break;
          
        case 'elevenlabs':
          await emotionalVoice.streamText(text, workoutContextRef.current);
          break;
          
        case 'webrtc':
          // For WebRTC, we'd typically send the text to the coach
          // who would speak it, or use TTS on their end
          webrtcVoice.sendWorkoutContext({
            type: 'ai-response',
            text: text
          });
          
          // Fallback to browser TTS for demo
          if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 1.1;
            utterance.pitch = 1.0;
            utterance.onend = () => setIsSpeaking(false);
            speechSynthesis.speak(utterance);
          }
          break;
      }
    } catch (error) {
      console.error('Failed to speak:', error);
    } finally {
      setTimeout(() => setIsSpeaking(false), 1000); // Fallback
    }
  }, [isInitialized, currentMode]);

  // Switch voice mode
  const switchMode = useCallback(async (newMode: VoiceMode['provider']) => {
    if (newMode === currentMode) return;
    
    // Stop current mode
    stopListening();
    
    // Dispose current service
    switch (currentMode) {
      case 'openai-realtime':
        realtimeVoice.dispose();
        break;
      case 'elevenlabs':
        emotionalVoice.dispose();
        break;
      case 'webrtc':
        webrtcVoice.dispose();
        break;
    }
    
    // Switch to new mode
    setCurrentMode(newMode);
    setIsInitialized(false);
  }, [currentMode, stopListening]);

  // Update workout context
  const updateWorkoutContext = useCallback((context: any) => {
    workoutContextRef.current = { ...workoutContextRef.current, ...context };
    
    // Update voice services with new context
    switch (currentMode) {
      case 'openai-realtime':
        realtimeVoice.updateContext(context);
        break;
      case 'webrtc':
        webrtcVoice.sendWorkoutContext(context);
        break;
    }
  }, [currentMode]);

  // Set emotional tone
  const setEmotionalTone = useCallback(async (intensity: 'low' | 'medium' | 'high') => {
    workoutContextRef.current.intensity = intensity;
    
    if (!enableEmotionalAdaptation) return;
    
    switch (currentMode) {
      case 'openai-realtime':
        await realtimeVoice.adaptEmotionalTone(intensity);
        break;
      case 'elevenlabs':
        await emotionalVoice.adaptToWorkoutContext({
          ...workoutContextRef.current,
          intensity
        });
        break;
    }
  }, [currentMode, enableEmotionalAdaptation]);

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