import { useState, useCallback, useRef } from 'react';
import { aiService } from '../services/aiService';
import { freeAIService } from '../services/freeAIService';

interface StreamingAIOptions {
  onChunk?: (chunk: string) => void;
  onComplete?: (fullResponse: string) => void;
  onError?: (error: Error) => void;
}

export const useStreamingAI = (options: StreamingAIOptions = {}) => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentResponse, setCurrentResponse] = useState('');
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const streamResponse = useCallback(async (message: string) => {
    console.log('🚀 Starting streaming response for:', message);
    
    // Reset state
    setIsStreaming(true);
    setError(null);
    setCurrentResponse('');
    
    // Create abort controller for cancellation
    abortControllerRef.current = new AbortController();
    
    try {
      // Get response from real AI service
      console.log('useStreamingAI - Calling AI service with:', {
        message: message.substring(0, 50) + '...',
        type: 'general-advice'
      });
      
      const aiResponse = await aiService.getResponse({
        message,
        type: 'general-advice',
        context: {
          isActive: false,
          startTime: new Date(),
          exercises: []
        }
      });
      
      console.log('useStreamingAI - Got AI response:', {
        hasContent: !!aiResponse.content,
        contentLength: aiResponse.content?.length,
        contentPreview: aiResponse.content?.substring(0, 50) + '...'
      });
      
      const responseText = aiResponse.content;
      const words = responseText.split(' ');
      let accumulatedResponse = '';
      
      for (let i = 0; i < words.length; i++) {
        if (abortControllerRef.current?.signal.aborted) {
          break;
        }
        
        const word = words[i];
        const chunk = i === 0 ? word : ' ' + word;
        accumulatedResponse += chunk;
        
        // Update state and call callbacks
        setCurrentResponse(accumulatedResponse);
        options.onChunk?.(chunk);
        
        // Simulate typing delay like ChatGPT (30-80ms per word)
        await new Promise(resolve => setTimeout(resolve, Math.random() * 50 + 30));
      }
      
      options.onComplete?.(accumulatedResponse);
      
    } catch (err) {
      console.error('Streaming error - Failed to get AI response:', err);
      console.error('Error details:', {
        message: err.message,
        stack: err.stack,
        aiServiceAvailable: !!aiService,
        messageProvided: message
      });
      
      // Try free AI service as fallback
      console.log('Trying free AI service...');
      try {
        const freeResponse = await freeAIService.getResponse(message);
        const words = freeResponse.split(' ');
        let accumulatedResponse = '';
        
        for (let i = 0; i < words.length; i++) {
          if (abortControllerRef.current?.signal.aborted) {
            break;
          }
          
          const word = words[i];
          const chunk = i === 0 ? word : ' ' + word;
          accumulatedResponse += chunk;
          
          setCurrentResponse(accumulatedResponse);
          options.onChunk?.(chunk);
          
          await new Promise(resolve => setTimeout(resolve, Math.random() * 50 + 30));
        }
        
        options.onComplete?.(accumulatedResponse);
        return;
      } catch (freeAIError) {
        console.error('Free AI service also failed:', freeAIError);
      }
      
      // Final fallback to hardcoded response
      const fallbackResponse = await generateStreamingResponse(message);
      const words = fallbackResponse.split(' ');
      let accumulatedResponse = '';
      
      for (let i = 0; i < words.length; i++) {
        if (abortControllerRef.current?.signal.aborted) {
          break;
        }
        
        const word = words[i];
        const chunk = i === 0 ? word : ' ' + word;
        accumulatedResponse += chunk;
        
        setCurrentResponse(accumulatedResponse);
        options.onChunk?.(chunk);
        
        await new Promise(resolve => setTimeout(resolve, Math.random() * 50 + 30));
      }
      
      options.onComplete?.(accumulatedResponse);
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  }, [options]);

  const stopStreaming = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsStreaming(false);
  }, []);

  return {
    streamResponse,
    stopStreaming,
    isStreaming,
    currentResponse,
    error
  };
};

// Generate AI-like responses
async function generateStreamingResponse(message: string): Promise<string> {
  const lowerMessage = message.toLowerCase();
  
  // Exercise form responses
  if (lowerMessage.includes('squat')) {
    return "For proper squat form, start with your feet shoulder-width apart, toes slightly pointed outward. Keep your chest up and core engaged throughout the movement. As you descend, push your hips back as if sitting in a chair, keeping your knees tracking over your toes. Go down until your thighs are parallel to the ground or as low as your mobility allows. Drive through your heels to stand back up, squeezing your glutes at the top. Remember to maintain a neutral spine and avoid letting your knees cave inward.";
  }
  
  if (lowerMessage.includes('bench press')) {
    return "The bench press requires proper setup for safety and effectiveness. Lie on the bench with your eyes directly under the bar. Plant your feet firmly on the ground, creating a slight arch in your lower back while keeping your shoulders and glutes pressed into the bench. Grip the bar slightly wider than shoulder-width, with wrists straight. Lower the bar with control to your chest, touching lightly at nipple level. Press the bar back up in a slight arc, finishing with arms fully extended but not locked out. Keep your core tight throughout the movement.";
  }
  
  if (lowerMessage.includes('deadlift')) {
    return "The deadlift is a powerful compound movement that requires careful attention to form. Stand with feet hip-width apart, toes under the barbell. Bend at the hips and knees to grip the bar just outside your legs. Keep your back straight, chest up, and shoulders slightly in front of the bar. Take a deep breath, brace your core, and drive through your heels to lift the bar. Keep it close to your body as you stand up, finishing with hips and knees fully extended. Lower the bar with control by pushing your hips back first, then bending your knees once the bar passes them.";
  }
  
  // Nutrition responses
  if (lowerMessage.includes('protein')) {
    return "Protein intake is crucial for muscle recovery and growth. As a general guideline, aim for 0.7 to 1 gram of protein per pound of body weight daily. Good protein sources include lean meats like chicken and turkey, fish such as salmon and tuna, eggs, Greek yogurt, cottage cheese, and plant-based options like lentils, chickpeas, and quinoa. Spread your protein intake throughout the day, consuming 20-40 grams per meal for optimal muscle protein synthesis. Post-workout, try to consume protein within 2 hours for best recovery results.";
  }
  
  if (lowerMessage.includes('pre-workout') || lowerMessage.includes('before workout')) {
    return "Pre-workout nutrition is important for optimal performance. Eat a balanced meal 2-3 hours before training, containing complex carbohydrates for sustained energy and moderate protein for muscle support. Good options include oatmeal with banana and almond butter, whole grain toast with eggs, or a chicken and rice bowl. If eating closer to your workout (30-60 minutes), choose easily digestible options like a banana with peanut butter, Greek yogurt with berries, or a small protein shake. Stay hydrated by drinking 16-20 ounces of water 2 hours before exercise.";
  }
  
  // Training advice
  if (lowerMessage.includes('beginner')) {
    return "As a beginner, focus on building a solid foundation with compound movements and proper form. Start with a full-body workout routine 3 times per week, allowing at least one rest day between sessions. Begin with bodyweight exercises or light weights to master movement patterns. Key exercises to include are squats, push-ups, rows, and planks. Gradually increase weight or difficulty as you become comfortable with the movements. Remember, consistency is more important than intensity at this stage. Track your progress and celebrate small wins along the way.";
  }
  
  // Default motivational response
  return "Great question! I'm here to support your fitness journey every step of the way. Whether you're looking to build strength, improve endurance, or enhance your overall health, consistency and proper form are key. Remember to listen to your body, progress at your own pace, and celebrate every achievement, no matter how small. What specific aspect of your training would you like to focus on today? I can help with exercise form, workout programming, nutrition advice, or recovery strategies.";
}