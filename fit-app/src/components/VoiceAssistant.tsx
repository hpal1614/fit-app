import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, X, Volume2, Loader2 } from 'lucide-react';
import { useVoice } from '../hooks/useVoice';
import { useAI } from '../hooks/useAI';
import { useWorkout } from '../hooks/useWorkout';

interface VoiceAssistantProps {
  workoutContext?: any;
  onClose?: () => void;
  onCommand?: (command: string, response: string) => void;
}

export const VoiceAssistant: React.FC<VoiceAssistantProps> = ({
  workoutContext,
  onClose,
  onCommand
}) => {
  const [isActive, setIsActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [conversation, setConversation] = useState<Array<{role: 'user' | 'assistant', content: string}>>([]);
  const [wakeWordDetected, setWakeWordDetected] = useState(false);
  
  const { speak, stopSpeaking } = useVoice();
  const { askCoach } = useAI();
  const workout = useWorkout();
  
  const recognitionRef = useRef<any>(null);
  const wakeWordTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize speech recognition
  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.error('Speech recognition not supported');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      console.log('Voice recognition started');
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const current = event.resultIndex;
      const transcript = event.results[current][0].transcript.toLowerCase();
      
      setTranscript(transcript);

      // Wake word detection
      if (!isActive && (transcript.includes('hey maya') || transcript.includes('hi maya'))) {
        setWakeWordDetected(true);
        setIsActive(true);
        setTranscript('');
        
        // Play activation sound
        speak('Yes, I\'m listening', { skipQueue: true });
        
        // Clear any existing timeout
        if (wakeWordTimeoutRef.current) {
          clearTimeout(wakeWordTimeoutRef.current);
        }
        
        // Set timeout to deactivate after 30 seconds of inactivity
        wakeWordTimeoutRef.current = setTimeout(() => {
          setIsActive(false);
          setWakeWordDetected(false);
        }, 30000);
      }

      // Process command if active
      if (isActive && event.results[current].isFinal) {
        processCommand(transcript);
        setTranscript('');
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      // Restart if component is still mounted
      if (recognitionRef.current) {
        recognition.start();
      }
    };

    recognitionRef.current = recognition;

    // Start listening
    recognition.start();

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
      if (wakeWordTimeoutRef.current) {
        clearTimeout(wakeWordTimeoutRef.current);
      }
    };
  }, [isActive, speak]);

  const processCommand = async (command: string) => {
    setIsProcessing(true);
    
    // Add user message to conversation
    setConversation(prev => [...prev, { role: 'user', content: command }]);

    try {
      // Check for workout-specific commands
      if (command.includes('add') && command.includes('kg')) {
        const match = command.match(/add (\d+) kg/);
        if (match) {
          const weight = parseInt(match[1]);
          // TODO: Add weight to current exercise
          const response = `Added ${weight} kg to your current set`;
          setConversation(prev => [...prev, { role: 'assistant', content: response }]);
          await speak(response);
          onCommand?.(command, response);
          return;
        }
      }

      if (command.includes('start workout')) {
        workout.startWorkout();
        const response = 'Workout started! Let\'s crush it!';
        setConversation(prev => [...prev, { role: 'assistant', content: response }]);
        await speak(response);
        onCommand?.(command, response);
        return;
      }

      if (command.includes('rest timer')) {
        const match = command.match(/(\d+) (seconds?|minutes?)/);
        if (match) {
          const duration = parseInt(match[1]);
          const unit = match[2];
          const seconds = unit.includes('minute') ? duration * 60 : duration;
          workout.startRestTimer(seconds);
          const response = `Rest timer set for ${duration} ${unit}`;
          setConversation(prev => [...prev, { role: 'assistant', content: response }]);
          await speak(response);
          onCommand?.(command, response);
          return;
        }
      }

      // General AI response
      const response = await askCoach(command, workoutContext);
      setConversation(prev => [...prev, { role: 'assistant', content: response.content }]);
      await speak(response.content);
      onCommand?.(command, response.content);

    } catch (error) {
      console.error('Error processing command:', error);
      const errorResponse = 'Sorry, I had trouble with that. Could you try again?';
      setConversation(prev => [...prev, { role: 'assistant', content: errorResponse }]);
      await speak(errorResponse);
    } finally {
      setIsProcessing(false);
      
      // Reset wake word timeout
      if (wakeWordTimeoutRef.current) {
        clearTimeout(wakeWordTimeoutRef.current);
      }
      wakeWordTimeoutRef.current = setTimeout(() => {
        setIsActive(false);
        setWakeWordDetected(false);
      }, 30000);
    }
  };

  const handleClose = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    stopSpeaking();
    onClose?.();
  };

  return (
    <>
      {/* Wake word indicator - iPhone-like border */}
      {wakeWordDetected && (
        <div className="fixed inset-0 pointer-events-none z-50">
          <div className="absolute inset-0 rounded-[40px] border-4 border-lime-400 animate-pulse" />
        </div>
      )}

      {/* Voice Assistant UI */}
      {isActive && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-50 flex items-center justify-center">
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-6 right-6 p-2 bg-gray-800 rounded-full hover:bg-gray-700 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="max-w-2xl w-full mx-auto px-6">
            {/* Animated orb */}
            <div className="flex justify-center mb-8">
              <div className="relative w-32 h-32">
                {/* Outer glow */}
                <div className={`absolute inset-0 rounded-full bg-gradient-to-r from-lime-400 to-green-500 blur-xl ${
                  isListening ? 'animate-pulse' : ''
                } ${isSpeaking ? 'animate-ping' : ''}`} />
                
                {/* Inner orb */}
                <div className={`absolute inset-2 rounded-full bg-gradient-to-r from-lime-400 to-green-500 ${
                  isListening ? 'animate-spin-slow' : ''
                }`} />
                
                {/* Center icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                  {isProcessing ? (
                    <Loader2 className="w-12 h-12 text-black animate-spin" />
                  ) : isSpeaking ? (
                    <Volume2 className="w-12 h-12 text-black animate-pulse" />
                  ) : (
                    <Mic className="w-12 h-12 text-black" />
                  )}
                </div>

                {/* Sound wave animation */}
                {isListening && !isProcessing && (
                  <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
                    <div className="flex items-end space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className="w-1 bg-lime-400 rounded-full animate-wave"
                          style={{
                            height: `${Math.random() * 20 + 10}px`,
                            animationDelay: `${i * 0.1}s`
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Status text */}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">
                {isProcessing ? 'Thinking...' : 
                 isSpeaking ? 'Speaking...' :
                 isListening ? 'Listening...' : 'Say "Hey Maya"'}
              </h2>
              
              {/* Current transcript */}
              {transcript && (
                <p className="text-gray-400 text-lg animate-fade-in">
                  {transcript}
                </p>
              )}
            </div>

            {/* Conversation history */}
            {conversation.length > 0 && (
              <div className="max-h-64 overflow-y-auto space-y-4 mb-8">
                {conversation.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-xs px-4 py-2 rounded-2xl ${
                      msg.role === 'user' 
                        ? 'bg-lime-400 text-black' 
                        : 'bg-gray-800 text-white'
                    }`}>
                      <p className="text-sm">{msg.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Quick commands */}
            <div className="flex flex-wrap justify-center gap-2">
              {['Start workout', 'Rest timer 2 minutes', 'Add 20 kg', 'How\'s my form?'].map((cmd) => (
                <button
                  key={cmd}
                  onClick={() => processCommand(cmd.toLowerCase())}
                  className="px-4 py-2 bg-gray-800 text-gray-300 rounded-full text-sm hover:bg-gray-700 transition-colors"
                >
                  {cmd}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bottom wave indicator when listening but not active */}
      {isListening && !isActive && (
        <div className="fixed bottom-0 left-0 right-0 h-1 bg-gray-800 z-40">
          <div className="h-full bg-gradient-to-r from-lime-400 to-green-500 animate-wave-horizontal" />
        </div>
      )}

      <style jsx="true">{`
        @keyframes wave {
          0%, 100% { transform: scaleY(1); }
          50% { transform: scaleY(2); }
        }
        
        @keyframes wave-horizontal {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-wave {
          animation: wave 1s ease-in-out infinite;
        }
        
        .animate-wave-horizontal {
          animation: wave-horizontal 2s linear infinite;
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        
        .animate-spin-slow {
          animation: spin 3s linear infinite;
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
};