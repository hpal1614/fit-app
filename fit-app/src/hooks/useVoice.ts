import { useState, useCallback, useRef } from 'react';

// Extended types for voice state
interface VoiceState {
  lastTranscript: string;
  interimTranscript?: string;
  finalTranscript?: string;
}

interface UseVoiceOptions {
  autoStart?: boolean;
  enableWakeWord?: boolean;
  workoutContext?: any;
}

export const useVoice = (options: UseVoiceOptions = {}) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number>(0);
  const [lastCommand, setLastCommand] = useState<any>(null);
  const [state, setState] = useState<VoiceState>({
    lastTranscript: '',
    interimTranscript: '',
    finalTranscript: ''
  });
  
  const recognitionRef = useRef<any>(null);

  // Check if voice features are supported
  const isSupported = useCallback(() => {
    return !!(window.speechSynthesis && 
      (window.SpeechRecognition || window.webkitSpeechRecognition));
  }, []);

  // Speak text with fallback
  const speak = useCallback(async (text: string): Promise<boolean> => {
    if (!window.speechSynthesis) {
      console.log('📢 Voice output:', text); // Fallback to console
      return false;
    }

    try {
      setIsSpeaking(true);
      setError(null);

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.volume = 0.8;

      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => {
        setIsSpeaking(false);
        setError('Speech synthesis failed');
      };

      window.speechSynthesis.speak(utterance);
      return true;
    } catch (err) {
      setIsSpeaking(false);
      setError('Speech not available');
      console.log('📢 Voice output:', text); // Fallback
      return false;
    }
  }, []);

  // Stop speaking
  const stopSpeaking = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, []);

  // Start listening with permission handling
  const startListening = useCallback(async (): Promise<boolean> => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setError('Speech recognition not supported');
      return false;
    }

    try {
      // Check microphone permission first
      if (navigator.mediaDevices) {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      }

      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onstart = () => {
        setIsListening(true);
        setError(null);
        setIsProcessing(false);
      };

      recognitionRef.current.onresult = (event: any) => {
        const current = event.resultIndex;
        const transcript = event.results[current][0].transcript;
        const isFinal = event.results[current].isFinal;
        const confidence = event.results[current][0].confidence || 0.9;

        setConfidence(confidence);
        
        setState(prev => ({
          ...prev,
          lastTranscript: transcript,
          interimTranscript: !isFinal ? transcript : '',
          finalTranscript: isFinal ? transcript : prev.finalTranscript
        }));

        if (isFinal) {
          // Simulate command processing
          setIsProcessing(true);
          setTimeout(() => {
            setLastCommand({ 
              text: transcript, 
              confidence, 
              timestamp: new Date() 
            });
            setIsProcessing(false);
          }, 500);
        }
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        setIsProcessing(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        setIsListening(false);
        setIsProcessing(false);
        if (event.error === 'not-allowed') {
          setError('Microphone permission denied');
        } else {
          setError('Voice recognition failed');
        }
      };

      recognitionRef.current.start();
      return true;
    } catch (err) {
      setIsListening(false);
      setIsProcessing(false);
      setError('Microphone permission required');
      return false;
    }
  }, []);

  // Stop listening
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
    setIsProcessing(false);
  }, []);

  return {
    // States
    isListening,
    isProcessing,
    isSpeaking,
    error,
    confidence,
    lastCommand,
    state,
    
    // Actions
    speak,
    stopSpeaking,
    startListening,
    stopListening,
    
    // Utils
    isSupported: isSupported()
  };
};
