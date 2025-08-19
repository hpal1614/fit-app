import { useState, useCallback } from 'react';
import { TemplateGenerator, type UserProfile } from '../services/templateGenerator';

interface UseStreamingAIOptions {
  onChunk?: (chunk: string) => void;
  onComplete?: (fullResponse: string) => void;
  onError?: (error: Error) => void;
}

export const useStreamingAI = (options: UseStreamingAIOptions = {}) => {
  const [isStreaming, setIsStreaming] = useState(false);
  const { onChunk, onComplete, onError } = options;

  const streamResponse = useCallback(async (message: string) => {
    setIsStreaming(true);
    try {
      const lowerMessage = message.toLowerCase();
      let responses: string[] = [];

      // BMI Calculation (tight trigger)
      const bmiTrigger =
        lowerMessage.includes('bmi') ||
        lowerMessage.includes('body mass index') ||
        /calculate\s+(my\s+)?bmi/.test(lowerMessage) ||
        /what\s+is\s+(my\s+)?bmi/.test(lowerMessage);

      if (bmiTrigger) {
        const heightMatch = message.match(/(\d+(?:\.\d+)?)\s*(cm|feet|ft|'|")/i);
        const weightMatch = message.match(/(\d+(?:\.\d+)?)\s*(kg|lbs|pounds)/i);
        if (heightMatch && weightMatch) {
          let heightInMeters = 0;
          let weightInKg = 0;
          if (heightMatch[2].toLowerCase() === 'cm') {
            heightInMeters = parseFloat(heightMatch[1]) / 100;
          } else {
            const feet = parseFloat(heightMatch[1]);
            const inches = message.match(/(\d+)\s*"/i)?.[1] || '0';
            heightInMeters = (feet * 12 + parseFloat(inches)) * 0.0254;
          }
          weightInKg = weightMatch[2].toLowerCase() === 'kg' ? parseFloat(weightMatch[1]) : parseFloat(weightMatch[1]) * 0.453592;
          const bmi = weightInKg / (heightInMeters * heightInMeters);
          const bmiCategory = bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Normal weight' : bmi < 30 ? 'Overweight' : 'Obese';
          const advice = bmi < 18.5
            ? 'Consider increasing your caloric intake with nutrient-rich foods and strength training.'
            : bmi < 25
            ? 'Maintain your healthy weight with balanced nutrition and regular exercise.'
            : bmi < 30
            ? 'Focus on a balanced diet and regular cardio to achieve a healthier weight.'
            : 'Consider consulting with a healthcare provider for a personalized weight management plan.';
          responses = [
            `Perfect! I've calculated your BMI. `,
            `Your BMI is ${bmi.toFixed(1)}, which falls into the "${bmiCategory}" category. `,
            `${advice} `,
            `Remember, BMI is just one indicator—muscle mass and overall fitness also matter. `,
            `Would you like a workout or nutrition plan based on your BMI?`
          ];
        } else {
          responses = [
            "I'd be happy to help you calculate your BMI! ",
            "Please provide your height (cm or feet/inches) and weight (kg or lbs). ",
            "For example: 'I'm 175cm and 70kg' or 'I'm 5'8\" and 154 lbs'. "
          ];
        }
      }
      // Workout planning and weight loss program requests
      else if (
        lowerMessage.includes('workout') ||
        lowerMessage.includes('routine') ||
        lowerMessage.includes('exercise') ||
        lowerMessage.includes('program') ||
        lowerMessage.includes('training') ||
        lowerMessage.includes('plan') ||
        lowerMessage.includes('8 week') ||
        lowerMessage.includes('8-week') ||
        lowerMessage.includes('weeks program') ||
        lowerMessage.includes('template') ||
        (lowerMessage.includes('lose') && lowerMessage.includes('weight'))
      ) {
        const experienceLevel = lowerMessage.includes('beginner') ? 'beginner' : lowerMessage.includes('advanced') ? 'advanced' : 'intermediate';
        const primaryGoal = 'weight_loss';
        const equipment = lowerMessage.includes('home') ? 'home' : 'gym';
        const timePerSession = lowerMessage.includes('30') ? 30 : lowerMessage.includes('45') ? 45 : 60;
        const daysPerWeek = lowerMessage.includes('3') ? 3 : lowerMessage.includes('5') ? 5 : 4;
        const profile: UserProfile = { experienceLevel, primaryGoal, equipment, timePerSession, daysPerWeek } as any;
        try {
          const template = TemplateGenerator.generateWorkoutTemplate(profile);
          let workoutTable = '';
          template.workouts.forEach((workout: any) => {
            workoutTable += `\n📅 **${workout.name}** (${workout.notes})\n`;
            workoutTable += `| Exercise | Sets | Reps | Rest |\n`;
            workoutTable += `|----------|------|------|------|\n`;
            workout.exercises.forEach((exercise: any) => {
              const sets = exercise.sets.length;
              const reps = exercise.sets[0]?.reps || '8-12';
              const rest = exercise.sets[0]?.rest || '60-90s';
              workoutTable += `| ${exercise.name} | ${sets} | ${reps} | ${rest} |\n`;
            });
            workoutTable += `\n`;
          });
          responses = [
            `Great! I'll create an 8-week weight loss program tailored to you. `,
            `**Template: ${template.name}** `,
            `**Description:** ${template.description} `,
            `\n${workoutTable}`,
            `\n**Progression Plan:** ${template.progressionPlan} `,
            `\n**Notes:** ${template.notes.join(', ')} `,
            `\nWant to adjust time, equipment, or days? Tell me and I'll refine it.`
          ];
        } catch (e) {
          responses = [
            'I can generate your program, but I need a few details: experience level, equipment (home/gym), time per session, and days per week.'
          ];
        }
      }
      // Fallback generic coaching
      else {
        responses = [
          "I'm here to help! Tell me if you want workouts, nutrition, or form tips, and I'll tailor it for you."
        ];
      }

      // Stream out the response tokens
      const full = responses.join('');
      if (onChunk) onChunk(full);
      if (onComplete) onComplete(full);
    } catch (err) {
      if (onError) onError(err as Error);
    } finally {
      setIsStreaming(false);
    }
  }, [onChunk, onComplete, onError]);

  return { isStreaming, streamResponse, stopStreaming: () => setIsStreaming(false) };
};

export type UseStreamingAIReturn = ReturnType<typeof useStreamingAI>;

