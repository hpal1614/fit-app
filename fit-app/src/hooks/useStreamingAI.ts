import { useState, useCallback } from 'react';

export interface StreamingMessage {
  id: string;
  content: string;
  isComplete: boolean;
  timestamp: Date;
}

export interface UseStreamingAIResult {
  isStreaming: boolean;
  currentMessage: StreamingMessage | null;
  error: string | null;
  sendMessage: (message: string) => Promise<void>;
  stopStreaming: () => void;
}

export const useStreamingAI = (): UseStreamingAIResult => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentMessage, setCurrentMessage] = useState<StreamingMessage | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (message: string) => {
    setIsStreaming(true);
    setError(null);
    
    const messageId = Date.now().toString();
    setCurrentMessage({
      id: messageId,
      content: '',
      isComplete: false,
      timestamp: new Date()
    });

    try {
      // Simulate streaming response
      const responses = [
        "I understand you're looking for fitness guidance. ",
        "Based on your current workout context, ",
        "I recommend focusing on proper form and progressive overload. ",
        "Make sure to maintain good posture throughout each exercise, ",
        "and gradually increase weight or reps as you get stronger. ",
        "Remember to listen to your body and rest when needed!"
      ];

      for (let i = 0; i < responses.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 200));
        
        setCurrentMessage(prev => prev ? {
          ...prev,
          content: prev.content + responses[i],
          isComplete: i === responses.length - 1
        } : null);
      }
    } catch (err) {
      setError('Failed to get AI response');
      console.error('Streaming AI error:', err);
    } finally {
      setIsStreaming(false);
    }
  }, []);

  const stopStreaming = useCallback(() => {
    setIsStreaming(false);
    setCurrentMessage(prev => prev ? { ...prev, isComplete: true } : null);
  }, []);

  return {
    isStreaming,
    currentMessage,
    error,
    sendMessage,
    stopStreaming
  };
};
