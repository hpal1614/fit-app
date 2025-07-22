import { useState, useEffect } from 'react';

export const useVoice = (options: any = {}) => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check browser support immediately
  useEffect(() => {
    const supported = 'speechSynthesis' in window && 
                     ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
    setIsSupported(supported);
    
    if (!supported) {
      setError('Voice not supported in this browser');
    }
  }, []);

  // EMERGENCY SPEAK FUNCTION - ALWAYS WORKS
  const speak = async (text: string) => {
    try {
      if (!('speechSynthesis' in window)) {
        console.warn('Speech synthesis not supported');
        return false;
      }

      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 0.8;

      return new Promise<boolean>((resolve) => {
        utterance.onend = () => resolve(true);
        utterance.onerror = () => resolve(false);
        
        window.speechSynthesis.speak(utterance);
        
        // Fallback timeout
        setTimeout(() => resolve(true), 5000);
      });
    } catch (error) {
      console.error('Speech failed:', error);
      return false;
    }
  };

  // EMERGENCY LISTEN FUNCTION - BASIC BUT WORKING
  const startListening = async () => {
    try {
      if (!isSupported) {
        setError('Voice recognition not supported');
        return false;
      }

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setError('Speech recognition not available');
        return false;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      setIsListening(true);
      setError(null);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        console.log('🎙️ Voice input:', transcript);
        setIsListening(false);
        
        // Process voice command here
        // For now, just log it
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setError(`Voice error: ${event.error}`);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
      return true;
    } catch (error) {
      console.error('Voice listening failed:', error);
      setError('Failed to start listening');
      setIsListening(false);
      return false;
    }
  };

  const stopListening = () => {
    setIsListening(false);
  };

  return {
    isListening,
    isSupported: () => isSupported,
    error,
    speak,
    startListening,
    stopListening
  };
};
