import type { AIResponse, AIRequestType } from '../types/ai';
import type { WorkoutContext } from '../types/workout';

interface FallbackResponse extends AIResponse {
  isFallback: true;
  fallbackReason: string;
}

export class AIFallbackService {
  private static fallbackResponses = new Map<AIRequestType, string[]>([
    ['motivation', [
      "Great job showing up today! Every workout counts towards your goals.",
      "You're doing amazing! Keep pushing forward, one rep at a time.",
      "Remember why you started. You've got this!",
      "Your dedication is inspiring. Let's make today count!",
      "Progress happens one workout at a time. You're on the right track!"
    ]],
    ['workout-planning', [
      "Here's a balanced workout: Start with 5 minutes of warm-up, then do 3 sets of 10 squats, 3 sets of 10 push-ups, 3 sets of 20 seconds plank, and finish with 5 minutes of stretching.",
      "Try this full-body routine: 3 rounds of 15 jumping jacks, 10 burpees, 15 mountain climbers, and 20 high knees. Rest 1 minute between rounds.",
      "Focus on compound movements today: Deadlifts (3x8), Bench Press (3x10), Rows (3x10), and Overhead Press (3x8). Rest 2 minutes between sets."
    ]],
    ['form-analysis', [
      "Remember to keep your core engaged throughout the movement. Focus on controlled, steady motions rather than speed.",
      "Maintain proper alignment: keep your back straight, shoulders back, and breathe steadily throughout the exercise.",
      "Form tip: Start with lighter weight to perfect your technique. Quality over quantity always wins!"
    ]],
    ['general-advice', [
      "Consistency is key to reaching your fitness goals. Aim for at least 3-4 workouts per week.",
      "Don't forget to stay hydrated! Drink water before, during, and after your workout.",
      "Recovery is just as important as training. Make sure you're getting enough sleep and rest days."
    ]],
    ['exercise-explanation', [
      "This exercise targets multiple muscle groups for efficient training. Focus on proper form to maximize benefits and prevent injury.",
      "Start with a weight that allows you to complete all reps with good form. You can increase the weight as you get stronger.",
      "This movement helps build functional strength that translates to daily activities. Take your time to learn it properly."
    ]],
    ['nutrition-advice', [
      "Fuel your workouts with a balanced diet. Include protein, complex carbs, and healthy fats in your meals.",
      "Post-workout nutrition tip: Have a protein source within 30 minutes after training to support muscle recovery.",
      "Stay consistent with your nutrition. Small, sustainable changes lead to long-term results."
    ]],
    ['progress-analysis', [
      "You're making progress! Keep tracking your workouts to see how far you've come.",
      "Every workout is a step forward. Celebrate the small wins along your fitness journey.",
      "Compare yourself to who you were yesterday, not to others. Your progress is unique to you."
    ]]
  ]);

  private static contextualFallbacks = new Map<string, string[]>([
    ['squats', [
      "For squats: Keep your feet shoulder-width apart, chest up, and drive through your heels.",
      "Squat tip: Imagine sitting back into a chair. Keep your knees tracking over your toes.",
      "Focus on depth in your squats - aim for thighs parallel to the ground if your mobility allows."
    ]],
    ['bench_press', [
      "Bench press form: Keep your feet flat on the floor, maintain a slight arch in your back, and grip the bar evenly.",
      "Control the weight on the way down, pause briefly at your chest, then drive up powerfully.",
      "Bench press tip: Keep your shoulder blades pulled back and down throughout the movement."
    ]],
    ['deadlift', [
      "Deadlift setup: Stand with feet hip-width apart, grip the bar just outside your legs, keep your back straight.",
      "Drive through your heels and hips to lift the bar. Keep it close to your body throughout the movement.",
      "Remember: The deadlift is a hip hinge movement. Push your hips back first, then bend your knees."
    ]]
  ]);

  static generateFallbackResponse(
    requestType: AIRequestType,
    context?: WorkoutContext,
    error?: string
  ): FallbackResponse {
    const responses = this.fallbackResponses.get(requestType) || this.fallbackResponses.get('general-advice')!;
    const baseResponse = responses[Math.floor(Math.random() * responses.length)];

    // Add contextual information if available
    let enhancedResponse = baseResponse;
    if (context?.currentExercise) {
      const exerciseName = context.currentExercise.toLowerCase();
      const contextualResponses = this.contextualFallbacks.get(exerciseName);
      if (contextualResponses) {
        const contextualAddition = contextualResponses[Math.floor(Math.random() * contextualResponses.length)];
        enhancedResponse = `${baseResponse}\n\n${contextualAddition}`;
      }
    }

    return {
      content: enhancedResponse,
      type: requestType,
      confidence: 0.5,
      timestamp: new Date(),
      isComplete: true,
      isFallback: true,
      fallbackReason: error || 'AI service temporarily unavailable',
      metadata: {
        provider: 'fallback',
        cached: false,
        fallback: true
      }
    };
  }

  static async generateWorkoutPlan(preferences: any): Promise<any> {
    const workouts = [
      {
        name: "Full Body Strength",
        exercises: [
          { name: "Squats", sets: 3, reps: 10, restSeconds: 90 },
          { name: "Push-ups", sets: 3, reps: 12, restSeconds: 60 },
          { name: "Lunges", sets: 3, reps: 10, restSeconds: 60 },
          { name: "Plank", sets: 3, duration: 30, restSeconds: 45 }
        ]
      },
      {
        name: "Upper Body Focus",
        exercises: [
          { name: "Bench Press", sets: 4, reps: 8, restSeconds: 120 },
          { name: "Rows", sets: 3, reps: 10, restSeconds: 90 },
          { name: "Shoulder Press", sets: 3, reps: 10, restSeconds: 90 },
          { name: "Bicep Curls", sets: 3, reps: 12, restSeconds: 60 }
        ]
      },
      {
        name: "Lower Body Power",
        exercises: [
          { name: "Deadlifts", sets: 4, reps: 6, restSeconds: 180 },
          { name: "Leg Press", sets: 3, reps: 12, restSeconds: 90 },
          { name: "Calf Raises", sets: 3, reps: 15, restSeconds: 45 },
          { name: "Leg Curls", sets: 3, reps: 12, restSeconds: 60 }
        ]
      }
    ];

    return {
      success: true,
      workout: workouts[Math.floor(Math.random() * workouts.length)],
      isFallback: true,
      message: "Here's a pre-designed workout plan. For personalized plans, the AI coach will be available soon."
    };
  }

  static getQuickTips(category: string): string[] {
    const tips = {
      warmup: [
        "Start with 5-10 minutes of light cardio to prepare your body",
        "Dynamic stretches help prevent injury and improve performance",
        "Gradually increase intensity during your warm-up"
      ],
      cooldown: [
        "Spend 5-10 minutes cooling down after your workout",
        "Static stretching helps improve flexibility when muscles are warm",
        "Deep breathing during cooldown aids recovery"
      ],
      hydration: [
        "Drink water before you feel thirsty",
        "Aim for 16-20 oz of water 2 hours before exercise",
        "Sip water every 15-20 minutes during your workout"
      ],
      recovery: [
        "Get 7-9 hours of quality sleep for optimal recovery",
        "Active recovery days can help reduce muscle soreness",
        "Proper nutrition supports muscle repair and growth"
      ]
    };

    return tips[category] || tips.recovery;
  }

  static isServiceAvailable(): boolean {
    // This can be enhanced to check actual service status
    return true; // Fallbacks are always available
  }

  static logFallbackUsage(requestType: AIRequestType, reason: string) {
    console.log(`[AIFallback] Used fallback for ${requestType}. Reason: ${reason}`);
    // In production, this could send telemetry or analytics
  }
}