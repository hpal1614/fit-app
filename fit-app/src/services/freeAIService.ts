// Free AI Service - Uses Hugging Face Inference API (no key required for public models)
export class FreeAIService {
  private readonly baseURL = 'https://api-inference.huggingface.co/models';
  private readonly model = 'microsoft/DialoGPT-medium';
  
  async getResponse(message: string): Promise<string> {
    try {
      // First, try to use the Hugging Face API (free, no auth required)
      const response = await fetch(`${this.baseURL}/${this.model}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: message,
          parameters: {
            max_length: 200,
            temperature: 0.7,
            top_p: 0.9
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        const reply = data.generated_text || data[0]?.generated_text || '';
        if (reply && reply.trim()) {
          return reply.trim();
        }
      }
    } catch (error) {
      console.log('Free AI API failed, using local responses');
    }

    // Fallback to intelligent local responses
    return this.getLocalResponse(message);
  }

  private getLocalResponse(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    // Exercise-specific responses
    if (lowerMessage.includes('squat')) {
      return "For squats, focus on keeping your knees aligned with your toes, chest up, and weight on your heels. Start with bodyweight squats before adding weight. Aim for 3 sets of 12-15 reps for beginners, and gradually increase the difficulty as you get stronger.";
    }
    
    if (lowerMessage.includes('bench press')) {
      return "Bench press technique: Keep your feet flat on the floor, maintain a slight arch in your lower back, and grip the bar slightly wider than shoulder-width. Lower the bar to your chest with control, then press up powerfully. Start with just the bar and focus on form.";
    }
    
    if (lowerMessage.includes('deadlift')) {
      return "Deadlifts are excellent for overall strength! Keep the bar close to your body, engage your core, and lift with your legs and hips, not your back. Start with light weight to master the form. Romanian deadlifts are a great variation for beginners.";
    }
    
    // Nutrition responses
    if (lowerMessage.includes('protein') || lowerMessage.includes('diet')) {
      return "For muscle building, aim for 0.8-1g of protein per pound of body weight. Good sources include chicken, fish, eggs, Greek yogurt, and legumes. Spread your protein intake throughout the day for optimal absorption.";
    }
    
    if (lowerMessage.includes('calories') || lowerMessage.includes('weight loss')) {
      return "For healthy weight loss, create a moderate calorie deficit of 300-500 calories per day. Focus on whole foods, plenty of vegetables, lean proteins, and complex carbs. Don't cut calories too drastically - slow and steady wins the race!";
    }
    
    // Workout planning
    if (lowerMessage.includes('workout') || lowerMessage.includes('routine')) {
      return "A great beginner routine is 3 days per week: Day 1 - Upper body (push/pull), Day 2 - Lower body (squats, lunges), Day 3 - Full body. Include compound movements, start with lighter weights, and focus on progressive overload.";
    }
    
    if (lowerMessage.includes('cardio')) {
      return "Mix steady-state cardio with HIIT for best results. Try 20-30 minutes of moderate cardio 3x per week, plus 1-2 HIIT sessions. Walking, cycling, and swimming are excellent low-impact options that complement strength training.";
    }
    
    // Recovery and injury prevention
    if (lowerMessage.includes('sore') || lowerMessage.includes('recovery')) {
      return "Recovery is crucial! Get 7-9 hours of sleep, stay hydrated, and consider active recovery like light walking or yoga. Proper nutrition, especially protein and carbs post-workout, helps muscle repair. Listen to your body - rest when needed.";
    }
    
    if (lowerMessage.includes('stretch') || lowerMessage.includes('flexibility')) {
      return "Incorporate dynamic stretching before workouts and static stretching after. Hold stretches for 20-30 seconds without bouncing. Focus on major muscle groups, especially tight areas like hip flexors, hamstrings, and shoulders.";
    }
    
    // Form and technique
    if (lowerMessage.includes('form') || lowerMessage.includes('technique')) {
      return "Perfect form is more important than heavy weight! Start with bodyweight or light weights, use mirrors to check your form, and consider recording yourself. Don't hesitate to ask for help or hire a trainer for a few sessions to learn proper technique.";
    }
    
    // Motivation
    if (lowerMessage.includes('motivat') || lowerMessage.includes('tired')) {
      return "Consistency beats perfection! Even a 20-minute workout is better than none. Set small, achievable goals, track your progress, and celebrate victories. Remember why you started - your health is worth the effort!";
    }
    
    // Default response with helpful prompts
    return "I'm here to help with your fitness journey! I can assist with exercise form, workout planning, nutrition advice, and recovery tips. What specific aspect of fitness would you like to know more about?";
  }
}

export const freeAIService = new FreeAIService();