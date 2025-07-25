import { useState, useCallback } from 'react';

// Emergency AI Hook with 5-second timeout and fallbacks
export const useAI = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Timeout wrapper to prevent hanging requests
  const withTimeout = <T>(promise: Promise<T>, ms: number = 5000): Promise<T> => {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), ms)
      ),
    ]);
  };

  // Fallback responses for when AI fails
  const getFallbackResponse = (type: string): string => {
    const fallbacks = {
      motivation: "Keep pushing! You're doing great. Every rep counts toward your goals!",
      workout: "Try 3 sets of 8-12 reps with proper form. Rest 60-90 seconds between sets.",
      nutrition: "Focus on whole foods: lean proteins, complex carbs, and healthy fats.",
      form: "Keep your core engaged, maintain proper posture, and control the movement.",
      general: "I'm here to help with your fitness journey. What specific area would you like guidance on?"
    };
    return fallbacks[type as keyof typeof fallbacks] || fallbacks.general;
  };

  // Main AI query function with timeout and fallback
  const askCoach = useCallback(async (
    question: string,
    context?: any,
    type: string = 'general'
  ): Promise<{ content: string; success: boolean }> => {
    setIsLoading(true);
    setError(null);

    try {
      // Try each provider with timeout
      const providers = [
        { name: 'OpenRouter', url: 'https://openrouter.ai/api/v1/chat/completions' },
        { name: 'Groq', url: 'https://api.groq.com/openai/v1/chat/completions' }
      ];

      for (const provider of providers) {
        try {
          const apiKey = provider.name === 'OpenRouter' 
            ? import.meta.env.VITE_OPENROUTER_API_KEY
            : import.meta.env.VITE_GROQ_API_KEY;

          if (!apiKey) continue;

          const response = await withTimeout(
            fetch(provider.url, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'HTTP-Referer': window.location.origin
              },
              body: JSON.stringify({
                model: provider.name === 'OpenRouter' ? 'gpt-3.5-turbo' : 'llama3-8b-8192',
                messages: [
                  {
                    role: 'system',
                    content: 'You are a helpful AI fitness coach. Provide practical, safe fitness advice.'
                  },
                  {
                    role: 'user', 
                    content: question
                  }
                ],
                max_tokens: 500,
                temperature: 0.7
              })
            }),
            5000 // 5 second timeout
          );

          if (response.ok) {
            const data = await response.json();
            const content = data.choices?.[0]?.message?.content || getFallbackResponse(type);
            
            console.log(`✅ ${provider.name} AI response successful`);
            setIsLoading(false);
            return { content, success: true };
          }
        } catch (providerError) {
          console.warn(`⚠️ ${provider.name} failed:`, providerError);
          continue; // Try next provider
        }
      }

      // All providers failed - use fallback
      console.log('⚠️ All AI providers failed, using fallback response');
      const fallback = getFallbackResponse(type);
      setIsLoading(false);
      return { content: fallback, success: false };

    } catch (error) {
      console.error('❌ AI request failed:', error);
      setError('AI temporarily unavailable');
      const fallback = getFallbackResponse(type);
      setIsLoading(false);
      return { content: fallback, success: false };
    }
  }, []);

  // Voice-enabled AI response
  const askCoachWithVoice = useCallback(async (
    question: string,
    speak?: (text: string) => Promise<void>
  ) => {
    const response = await askCoach(question);
    if (speak) {
      await speak(response.content);
    }
    return response;
  }, [askCoach]);

  return {
    askCoach,
    askCoachWithVoice,
    isLoading,
    error,
    isAvailable: true // Always available with fallbacks
  };
};
