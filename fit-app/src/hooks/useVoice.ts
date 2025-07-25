import { useState, useCallback, useRef } from 'react';

export const useVoice = () => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        setIsListening(false);
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
  }, []);

  return {
    speak,
    startListening,
    stopListening,
    isListening,
    isSpeaking,
    isSupported: isSupported(),
    error
  };
};
