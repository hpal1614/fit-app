import { useState, useCallback } from 'react';
import { TemplateGenerator, type UserProfile, type WorkoutTemplate, type NutritionTemplate } from '../services/templateGenerator';

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
      // Enhanced fitness coaching responses based on user input
      let responses: string[] = [];
      
      const lowerMessage = message.toLowerCase();
      
      // BMI Calculation
      if (lowerMessage.includes('bmi') || lowerMessage.includes('calculate') || lowerMessage.includes('weight') || lowerMessage.includes('height')) {
        // Check if user provided measurements
        const heightMatch = message.match(/(\d+(?:\.\d+)?)\s*(cm|feet|ft|'|")/i);
        const weightMatch = message.match(/(\d+(?:\.\d+)?)\s*(kg|lbs|pounds)/i);
        
        if (heightMatch && weightMatch) {
          // Calculate BMI
          let heightInMeters = 0;
          let weightInKg = 0;
          
          // Convert height to meters
          if (heightMatch[2].toLowerCase() === 'cm') {
            heightInMeters = parseFloat(heightMatch[1]) / 100;
          } else {
            // Convert feet/inches to meters
            const feet = parseFloat(heightMatch[1]);
            const inches = message.match(/(\d+)\s*"/i)?.[1] || '0';
            heightInMeters = (feet * 12 + parseFloat(inches)) * 0.0254;
          }
          
          // Convert weight to kg
          if (weightMatch[2].toLowerCase() === 'kg') {
            weightInKg = parseFloat(weightMatch[1]);
          } else {
            weightInKg = parseFloat(weightMatch[1]) * 0.453592;
          }
          
          const bmi = weightInKg / (heightInMeters * heightInMeters);
          let bmiCategory = '';
          let healthAdvice = '';
          
          if (bmi < 18.5) {
            bmiCategory = 'Underweight';
            healthAdvice = 'Consider increasing your caloric intake with nutrient-rich foods and strength training to build healthy weight.';
          } else if (bmi < 25) {
            bmiCategory = 'Normal weight';
            healthAdvice = 'Great! Maintain your healthy weight with balanced nutrition and regular exercise.';
          } else if (bmi < 30) {
            bmiCategory = 'Overweight';
            healthAdvice = 'Focus on a balanced diet and regular cardio exercise to achieve a healthier weight.';
          } else {
            bmiCategory = 'Obese';
            healthAdvice = 'Consider consulting with a healthcare provider for a personalized weight management plan.';
          }
          
          responses = [
            `Perfect! I've calculated your BMI. `,
            `Your BMI is ${bmi.toFixed(1)}, which falls into the "${bmiCategory}" category. `,
            `${healthAdvice} `,
            `Remember, BMI is just one health indicator - factors like muscle mass, age, and overall fitness also matter. `,
            `Would you like personalized workout or nutrition advice based on your BMI?`
          ];
        } else {
          responses = [
            "I'd be happy to help you calculate your BMI! ",
            "To calculate your BMI, I'll need your height and weight. ",
            "Please provide your height (in cm or feet/inches) and weight (in kg or lbs). ",
            "For example: 'I'm 175cm and 70kg' or 'I'm 5'8\" and 154 lbs'. ",
            "Once you share those details, I can calculate your BMI and provide personalized health insights!"
          ];
        }
      }
      // Workout Planning - Enhanced Template Detection
      else if (lowerMessage.includes('workout') || lowerMessage.includes('routine') || lowerMessage.includes('exercise') || 
               lowerMessage.includes('program') || lowerMessage.includes('training') || lowerMessage.includes('plan') ||
               lowerMessage.includes('8 week') || lowerMessage.includes('weeks') || lowerMessage.includes('template')) {
        
        // Enhanced template keyword detection
        const templateKeywords = [
          'template', 'plan', 'routine', 'program', 'workout', 'training',
          'create workout', 'make workout', 'generate workout', 'design workout',
          'week program', 'weeks program', '8 week', 'weekly plan', 'create', 'make', 'generate'
        ];
        
        const isTemplateRequest = templateKeywords.some(keyword => lowerMessage.includes(keyword));
        
        if (isTemplateRequest) {
          // Enhanced parameter extraction with more variations
          const experienceLevel = lowerMessage.includes('beginner') || lowerMessage.includes('novice') || lowerMessage.includes('new') ? 'beginner' : 
                                 lowerMessage.includes('intermediate') || lowerMessage.includes('some experience') ? 'intermediate' : 
                                 lowerMessage.includes('advanced') || lowerMessage.includes('expert') || lowerMessage.includes('experienced') ? 'advanced' : null;
          
          const primaryGoal = lowerMessage.includes('muscle building') || lowerMessage.includes('gain muscle') || lowerMessage.includes('build muscle') ? 'muscle_building' :
                             lowerMessage.includes('weight loss') || lowerMessage.includes('lose weight') || lowerMessage.includes('fat loss') ? 'weight_loss' :
                             lowerMessage.includes('strength') || lowerMessage.includes('get stronger') ? 'strength' :
                             lowerMessage.includes('athletic') || lowerMessage.includes('performance') ? 'athletic' : null;
          
          const equipment = lowerMessage.includes('gym') || lowerMessage.includes('fitness center') ? 'gym' :
                           lowerMessage.includes('home') || lowerMessage.includes('house') ? 'home' :
                           lowerMessage.includes('minimal') || lowerMessage.includes('bodyweight') ? 'minimal' : null;
          
          const timePerSession = lowerMessage.includes('90') || lowerMessage.includes('90min') ? 90 :
                                lowerMessage.includes('60') || lowerMessage.includes('60min') || lowerMessage.includes('hour') ? 60 :
                                lowerMessage.includes('45') || lowerMessage.includes('45min') ? 45 :
                                lowerMessage.includes('30') || lowerMessage.includes('30min') ? 30 : null;
          
          const daysPerWeek = lowerMessage.includes('6') || lowerMessage.includes('6x') || lowerMessage.includes('6 times') ? 6 :
                             lowerMessage.includes('5') || lowerMessage.includes('5x') || lowerMessage.includes('5 times') ? 5 :
                             lowerMessage.includes('4') || lowerMessage.includes('4x') || lowerMessage.includes('4 times') ? 4 :
                             lowerMessage.includes('3') || lowerMessage.includes('3x') || lowerMessage.includes('3 times') ? 3 : null;
          
          // Check if all required parameters are provided
          if (experienceLevel && primaryGoal && equipment && timePerSession && daysPerWeek) {
            // Generate workout template immediately
            try {
              const profile: UserProfile = {
                experienceLevel,
                primaryGoal,
                equipment,
                timePerSession,
                daysPerWeek
              };
              
              const template = TemplateGenerator.generateWorkoutTemplate(profile);
              
              // Generate detailed workout response in tabular format
              let workoutTable = '';
              template.workouts.forEach((workout, index) => {
                workoutTable += `\n📅 **${workout.name}** (${workout.notes})\n`;
                workoutTable += `| Exercise | Sets | Reps | Rest |\n`;
                workoutTable += `|----------|------|------|------|\n`;
                
                workout.exercises.forEach(exercise => {
                  const sets = exercise.sets.length;
                  const reps = exercise.sets[0]?.reps || '8-12';
                  const rest = exercise.sets[0]?.rest || '60-90s';
                  workoutTable += `| ${exercise.name} | ${sets} | ${reps} | ${rest} |\n`;
                });
                workoutTable += `\n`;
              });
              
              responses = [
                `Perfect! I've created your personalized workout template! 💪 `,
                `**Template: ${template.name}** `,
                `**Description:** ${template.description} `,
                `\n${workoutTable}`,
                `\n**Progression Plan:** ${template.progressionPlan} `,
                `\n**Notes:** ${template.notes.join(', ')} `,
                `\n💾 **Save Template:** Click the "Save Template" button below to use this in your workout logger! `,
                `\n🤔 **Need Changes?** Let me know if you want to modify exercises, sets, reps, or add/remove workouts! `,
                `\n🍎 **Want Nutrition Plan?** Just ask for a 'nutrition plan' to complement your workouts! 🎯`
              ];
            } catch (error) {
              responses = [
                "I'm having trouble generating your workout template. ",
                "Please make sure you've provided all the required information: ",
                "experience level, goal, equipment, time, and frequency. ",
                "Try asking again with all the details! 💪"
              ];
            }
          } else {
            // Ask for missing parameters with better formatting
            const missingParams = [];
            if (!experienceLevel) missingParams.push('• Experience level (beginner/intermediate/advanced)');
            if (!primaryGoal) missingParams.push('• Primary goal (muscle building/weight loss/strength/athletic)');
            if (!equipment) missingParams.push('• Equipment available (gym/home/minimal)');
            if (!timePerSession) missingParams.push('• Time per session (30/45/60/90 minutes)');
            if (!daysPerWeek) missingParams.push('• Days per week (3/4/5/6)');
            
            responses = [
              "I'll help you create a workout template! 💪 ",
              "I need a few more details to personalize your plan: ",
              "\n" + missingParams.join('\n') + "\n",
              "Once you provide these details, I'll generate your complete workout template! 🎯"
            ];
          }
        } else if (lowerMessage.includes('8 week') || lowerMessage.includes('weeks program')) {
          // Special handling for duration-based requests
          responses = [
            "I'll help you create an 8-week workout program! 💪 ",
            "To personalize your program, I need to know: ",
            "• Experience level (beginner/intermediate/advanced) ",
            "• Primary goal (muscle building/weight loss/strength/athletic) ",
            "• Equipment available (gym/home/minimal) ",
            "• Time per session (30/45/60/90 minutes) ",
            "• Days per week (3/4/5/6) ",
            "Once you provide these details, I'll create your complete 8-week program! 🎯"
          ];
        } else if (lowerMessage.includes('beginner') || lowerMessage.includes('start') || lowerMessage.includes('new')) {
          responses = [
            "Ah, a fresh warrior ready to conquer the fitness world! 💪 ",
            "Let's start you off with a killer 3-day routine: Monday (upper body), Wednesday (lower body), Friday (full body). ",
            "We'll begin with bodyweight exercises: push-ups, squats, planks, and lunges - the classics that never fail! ",
            "Aim for 2-3 sets of 8-12 reps, with 60-90 seconds rest between sets. ",
            "Remember, perfect form beats heavy weights every time! ",
            "Start with 20-30 minute sessions and watch yourself transform! 🔥"
          ];
        } else if (lowerMessage.includes('cardio') || lowerMessage.includes('running') || lowerMessage.includes('aerobic')) {
          responses = [
            "Great choice for cardio! ",
            "Start with 20-30 minutes of moderate cardio 3-4 times per week. ",
            "Try walking, jogging, cycling, or swimming to build endurance. ",
            "Use the 'talk test' - you should be able to hold a conversation while exercising. ",
            "Gradually increase intensity and duration as your fitness improves. ",
            "Remember to warm up for 5-10 minutes before cardio sessions!"
          ];
        } else {
          responses = [
            "Great question about workouts! ",
            "Based on your needs, I'd recommend starting with a balanced routine. ",
            "Focus on compound movements like squats, deadlifts, and push-ups. ",
            "Aim for 3-4 sets of 8-12 reps for strength building. ",
            "Remember to warm up properly and cool down after each session. ",
            "Consistency is more important than intensity when starting out!"
          ];
        }
      }
      // Form and Technique
      else if (lowerMessage.includes('form') || lowerMessage.includes('technique') || lowerMessage.includes('proper')) {
        responses = [
          "Excellent focus on form! ",
          "Proper technique is crucial for preventing injuries and maximizing results. ",
          "Always maintain a neutral spine and engage your core. ",
          "Control the movement throughout the full range of motion. ",
          "If you're unsure about your form, consider working with a trainer. ",
          "Quality over quantity - it's better to do fewer reps with perfect form!"
        ];
      }
      // Nutrition
      else if (lowerMessage.includes('nutrition') || lowerMessage.includes('diet') || lowerMessage.includes('food') || lowerMessage.includes('eat')) {
        // Check for nutrition template creation requests
        if (lowerMessage.includes('create') || lowerMessage.includes('make') || lowerMessage.includes('generate') || lowerMessage.includes('plan') || lowerMessage.includes('meal plan')) {
          // Enhanced parameter extraction for nutrition
          const primaryGoal = lowerMessage.includes('muscle building') ? 'muscle_building' :
                             lowerMessage.includes('weight loss') ? 'weight_loss' :
                             lowerMessage.includes('maintenance') ? 'maintenance' : null;
          
          const activityLevel = lowerMessage.includes('very active') ? 'very_active' :
                               lowerMessage.includes('moderately active') ? 'moderately_active' :
                               lowerMessage.includes('lightly active') ? 'lightly_active' :
                               lowerMessage.includes('sedentary') ? 'sedentary' : null;
          
          const dietaryPreferences = lowerMessage.includes('vegan') ? 'vegan' :
                                    lowerMessage.includes('vegetarian') ? 'vegetarian' : 'omnivore';
          
          const budget = lowerMessage.includes('budget') ? 'budget_friendly' : 'premium';
          
          // Extract weight information
          const weightMatch = lowerMessage.match(/(\d+)\s*kg/);
          const currentWeight = weightMatch ? parseInt(weightMatch[1]) : null;
          
          // Check if we have enough information to generate a template
          if (primaryGoal && activityLevel && currentWeight) {
            // Generate nutrition template immediately
            try {
              const profile: UserProfile = {
                experienceLevel: 'beginner', // Default for nutrition
                primaryGoal,
                equipment: 'gym', // Default for nutrition
                timePerSession: 60, // Default for nutrition
                daysPerWeek: 3, // Default for nutrition
                currentWeight,
                targetWeight: primaryGoal === 'weight_loss' ? currentWeight - 5 : currentWeight + 5,
                activityLevel,
                dietaryPreferences,
                budget
              };
              
              const template = TemplateGenerator.generateNutritionTemplate(profile);
              
              responses = [
                `Excellent! I've created your personalized nutrition plan! 🍎 `,
                `Template: ${template.name} `,
                `Description: ${template.description} `,
                `Daily Calories: ${template.dailyCalories} `,
                `Macros - Protein: ${template.macros.protein}g, Carbs: ${template.macros.carbs}g, Fats: ${template.macros.fats}g `,
                `This nutrition template is ready to use in your logging system! `,
                `Would you also like a workout plan to complement your nutrition? Just ask for a 'workout plan'! 🎯`
              ];
            } catch (error) {
              responses = [
                "I'm having trouble generating your nutrition template. ",
                "Please make sure you've provided all the required information: ",
                "goal, weight, activity level, preferences, and restrictions. ",
                "Try asking again with all the details! 🍎"
              ];
            }
          } else {
            // Ask for missing parameters
            const missingParams = [];
            if (!primaryGoal) missingParams.push('primary goal (weight loss/muscle building/maintenance)');
            if (!currentWeight) missingParams.push('current weight (e.g., 70kg)');
            if (!activityLevel) missingParams.push('activity level (sedentary/lightly active/moderately active/very active)');
            
            responses = [
              "Excellent! I'll create a personalized nutrition plan for you! 🍎 ",
              "I just need a few more details: ",
              missingParams.join(', ') + ". ",
              "Once you share these details, I'll generate a complete nutrition template you can use in the logging system! 🎯"
            ];
          }
        } else
        if (lowerMessage.includes('protein') || lowerMessage.includes('muscle')) {
          responses = [
            "Protein is essential for muscle building and recovery! ",
            "Aim for 1.6-2.2g of protein per kg of body weight daily. ",
            "Great sources include: chicken breast, fish, eggs, Greek yogurt, and legumes. ",
            "Time your protein intake - have protein within 30 minutes after your workout. ",
            "Consider protein shakes as a convenient post-workout option. ",
            "Remember, whole foods are always better than supplements!"
          ];
        } else if (lowerMessage.includes('water') || lowerMessage.includes('hydrate') || lowerMessage.includes('drink')) {
          responses = [
            "Hydration is crucial for performance and recovery! ",
            "Aim for at least 8-10 glasses of water daily, more if you're active. ",
            "Drink water before, during, and after your workouts. ",
            "Monitor your hydration by checking urine color - it should be light yellow. ",
            "Add electrolytes for intense workouts lasting over 60 minutes. ",
            "Start your day with a glass of water to kickstart your metabolism!"
          ];
        } else if (lowerMessage.includes('weight loss') || lowerMessage.includes('lose weight')) {
          responses = [
            "Sustainable weight loss requires a balanced approach! ",
            "Create a moderate calorie deficit of 300-500 calories per day. ",
            "Focus on whole foods: lean proteins, vegetables, fruits, and whole grains. ",
            "Don't skip meals - eat 3 balanced meals plus 1-2 healthy snacks. ",
            "Combine diet with regular exercise for best results. ",
            "Aim for 1-2 pounds of weight loss per week for sustainable results!"
          ];
        } else {
          responses = [
            "Nutrition is key to your fitness success! ",
            "Focus on whole foods: lean proteins, complex carbs, and healthy fats. ",
            "Stay hydrated - aim for at least 8 glasses of water daily. ",
            "Time your meals around your workouts for optimal performance. ",
            "Don't forget about post-workout nutrition to aid recovery. ",
            "Remember, consistency in nutrition is just as important as consistency in training!"
          ];
        }
      }
      // Motivation
      else if (lowerMessage.includes('motivation') || lowerMessage.includes('inspire') || lowerMessage.includes('motivate')) {
        responses = [
          "You've got this! ",
          "Remember why you started this fitness journey. ",
          "Every workout, no matter how small, is progress toward your goals. ",
          "Focus on how you feel after a workout, not just the numbers. ",
          "Surround yourself with positive influences and celebrate small wins. ",
          "You're stronger than you think - keep pushing forward!"
        ];
      }
      // Greetings and general questions
      else if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey') || lowerMessage.length < 10) {
        responses = [
          "Hey there, fitness warrior! 💪 ",
          "I'm your AI trainer, and I'm here to help you crush your fitness goals! ",
          "Ready to get stronger, faster, and more awesome? ",
          "What are we working on today? Workouts, nutrition, or maybe some motivation? ",
          "Let's make today count! 🔥"
        ];
      }
      // Template Generation - Check for detailed user information
      else if (lowerMessage.includes('beginner') || lowerMessage.includes('intermediate') || lowerMessage.includes('advanced') || 
               lowerMessage.includes('weight loss') || lowerMessage.includes('muscle building') || lowerMessage.includes('strength') ||
               lowerMessage.includes('gym') || lowerMessage.includes('home') || lowerMessage.includes('minimal') ||
               lowerMessage.includes('30') || lowerMessage.includes('45') || lowerMessage.includes('60') || lowerMessage.includes('90') ||
               lowerMessage.includes('sedentary') || lowerMessage.includes('active') || lowerMessage.includes('vegetarian') || 
               lowerMessage.includes('vegan') || lowerMessage.includes('allergy') || lowerMessage.includes('budget')) {
        
        // Check if this looks like a template request with details
        const hasExperienceLevel = lowerMessage.includes('beginner') || lowerMessage.includes('intermediate') || lowerMessage.includes('advanced');
        const hasGoal = lowerMessage.includes('weight loss') || lowerMessage.includes('muscle building') || lowerMessage.includes('strength') || lowerMessage.includes('athletic');
        const hasEquipment = lowerMessage.includes('gym') || lowerMessage.includes('home') || lowerMessage.includes('minimal');
        const hasTime = lowerMessage.includes('30') || lowerMessage.includes('45') || lowerMessage.includes('60') || lowerMessage.includes('90');
        
        if (hasExperienceLevel && hasGoal && hasEquipment && hasTime) {
          // Generate workout template
          try {
            // Extract user profile from message
            const profile: UserProfile = {
              experienceLevel: lowerMessage.includes('beginner') ? 'beginner' : 
                              lowerMessage.includes('intermediate') ? 'intermediate' : 'advanced',
              primaryGoal: lowerMessage.includes('weight loss') ? 'weight_loss' :
                          lowerMessage.includes('muscle building') ? 'muscle_building' :
                          lowerMessage.includes('strength') ? 'strength' : 'athletic',
              equipment: lowerMessage.includes('gym') ? 'gym' :
                        lowerMessage.includes('home') ? 'home' : 'minimal',
              timePerSession: lowerMessage.includes('90') ? 90 :
                             lowerMessage.includes('60') ? 60 :
                             lowerMessage.includes('45') ? 45 : 30,
              daysPerWeek: lowerMessage.includes('6') ? 6 :
                          lowerMessage.includes('5') ? 5 :
                          lowerMessage.includes('4') ? 4 : 3
            };
            
            const template = TemplateGenerator.generateWorkoutTemplate(profile);
            
            responses = [
              `Perfect! I've created your personalized workout template! 💪 `,
              `Template: ${template.name} `,
              `Description: ${template.description} `,
              `Progression Plan: ${template.progressionPlan} `,
              `This template includes ${template.workouts.length} workouts and is ready to use in your logging system! `,
              `Would you also like a nutrition plan to complement your workouts? Just ask for a 'nutrition plan'! 🎯`
            ];
          } catch (error) {
            responses = [
              "I'm having trouble generating your workout template. ",
              "Please make sure you've provided all the required information: ",
              "experience level, goal, equipment, time, and frequency. ",
              "Try asking again with all the details! 💪"
            ];
          }
        } else if (lowerMessage.includes('weight') && (lowerMessage.includes('loss') || lowerMessage.includes('gain') || lowerMessage.includes('maintenance'))) {
          // Generate nutrition template
          try {
            // Extract user profile from message
            const profile: UserProfile = {
              experienceLevel: 'beginner', // Default for nutrition
              primaryGoal: lowerMessage.includes('weight loss') ? 'weight_loss' :
                          lowerMessage.includes('muscle building') ? 'muscle_building' : 'maintenance',
              equipment: 'gym', // Default for nutrition
              timePerSession: 60, // Default for nutrition
              daysPerWeek: 3, // Default for nutrition
              currentWeight: 70, // Default, should be extracted from message
              targetWeight: 65, // Default, should be extracted from message
              activityLevel: lowerMessage.includes('very active') ? 'very_active' :
                            lowerMessage.includes('moderately active') ? 'moderately_active' :
                            lowerMessage.includes('lightly active') ? 'lightly_active' : 'sedentary',
              dietaryPreferences: lowerMessage.includes('vegan') ? 'vegan' :
                                 lowerMessage.includes('vegetarian') ? 'vegetarian' : 'omnivore',
              budget: lowerMessage.includes('budget') ? 'budget_friendly' : 'premium'
            };
            
            const template = TemplateGenerator.generateNutritionTemplate(profile);
            
            // Generate nutrition template in tabular format
            let nutritionTable = '';
            nutritionTable += `\n📊 **Daily Nutrition Summary**\n`;
            nutritionTable += `| Nutrient | Amount |\n`;
            nutritionTable += `|----------|--------|\n`;
            nutritionTable += `| Calories | ${template.dailyCalories} |\n`;
            nutritionTable += `| Protein | ${template.macros.protein}g |\n`;
            nutritionTable += `| Carbs | ${template.macros.carbs}g |\n`;
            nutritionTable += `| Fats | ${template.macros.fats}g |\n`;
            
            nutritionTable += `\n🍽️ **Meal Plan**\n`;
            nutritionTable += `| Meal | Options |\n`;
            nutritionTable += `|------|--------|\n`;
            nutritionTable += `| Breakfast | ${template.mealPlan.breakfast.join(', ')} |\n`;
            nutritionTable += `| Lunch | ${template.mealPlan.lunch.join(', ')} |\n`;
            nutritionTable += `| Dinner | ${template.mealPlan.dinner.join(', ')} |\n`;
            nutritionTable += `| Snacks | ${template.mealPlan.snacks.join(', ')} |\n`;
            
            nutritionTable += `\n⏰ **Timing**\n`;
            nutritionTable += `| When | Recommendation |\n`;
            nutritionTable += `|------|----------------|\n`;
            nutritionTable += `| Pre-workout | ${template.timing.preWorkout} |\n`;
            nutritionTable += `| Post-workout | ${template.timing.postWorkout} |\n`;
            nutritionTable += `| Meal spacing | ${template.timing.mealSpacing} |\n`;
            
            if (template.supplements && template.supplements.length > 0) {
              nutritionTable += `\n💊 **Supplements**\n`;
              nutritionTable += `| Supplement |\n`;
              nutritionTable += `|------------|\n`;
              template.supplements.forEach(supplement => {
                nutritionTable += `| ${supplement} |\n`;
              });
            }
            
            responses = [
              `Excellent! I've created your personalized nutrition plan! 🍎 `,
              `**Template: ${template.name}** `,
              `**Description:** ${template.description} `,
              `\n${nutritionTable}`,
              `\n**Notes:** ${template.notes.join(', ')} `,
              `\n💾 **Save Template:** Click the "Save Template" button below to use this in your nutrition logger! `,
              `\n🤔 **Need Changes?** Let me know if you want to modify calories, macros, or meal options! `,
              `\n💪 **Want Workout Plan?** Just ask for a 'workout plan' to complement your nutrition! 🎯`
            ];
          } catch (error) {
            responses = [
              "I'm having trouble generating your nutrition template. ",
              "Please make sure you've provided all the required information: ",
              "goal, weight, activity level, preferences, and restrictions. ",
              "Try asking again with all the details! 🍎"
            ];
          }
        } else {
          responses = [
            "Great! I can see you're providing details for a personalized plan! ",
            "To create the perfect template, I need a bit more information. ",
            "For workouts: experience level, goal, equipment, time, and frequency. ",
            "For nutrition: goal, weight, activity level, preferences, and restrictions. ",
            "Once I have all the details, I'll generate a complete template for you! ",
            "What specific plan would you like me to create? 💪🍎"
          ];
        }
      }
      // Default response for other questions - Smart trainer deflection
      else {
        // Check if it's a non-fitness question (like geography, history, etc.)
        const nonFitnessKeywords = ['capital', 'country', 'president', 'history', 'geography', 'weather', 'politics', 'news', 'movie', 'music', 'celebrity'];
        const isNonFitnessQuestion = nonFitnessKeywords.some(keyword => lowerMessage.includes(keyword));
        
        if (isNonFitnessQuestion) {
          // Give a quick, friendly answer first, then smoothly redirect
          let quickAnswer = "";
          if (lowerMessage.includes('capital') && lowerMessage.includes('india')) {
            quickAnswer = "New Delhi! 🇮🇳 ";
          } else if (lowerMessage.includes('capital') && lowerMessage.includes('usa')) {
            quickAnswer = "Washington, D.C.! 🇺🇸 ";
          } else if (lowerMessage.includes('capital') && lowerMessage.includes('uk')) {
            quickAnswer = "London! 🇬🇧 ";
          } else if (lowerMessage.includes('weather')) {
            quickAnswer = "I'm not a weather app, but I can tell you it's always sunny in the gym! ☀️ ";
          } else {
            quickAnswer = "That's a great question! ";
          }
          
          responses = [
            quickAnswer,
            "But you know what's even more interesting? ",
            "Your fitness journey! 😄 ",
            "I'm here to help you get stronger, faster, and more awesome. ",
            "What fitness goal are we crushing today? ",
            "Workouts, nutrition, or maybe some motivation? 💪"
          ];
        } else {
          responses = [
            "That's an interesting question! ",
            "But you know what's even more exciting? ",
            "Your fitness transformation! 💪 ",
            "I'm here to help you become the best version of yourself. ",
            "What fitness goal are we working on today? ",
            "Workouts, nutrition, form, or motivation - what's your focus?"
          ];
        }
      }

      let fullResponse = '';
      
      for (let i = 0; i < responses.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 150 + Math.random() * 200));
        
        const chunk = responses[i];
        fullResponse += chunk;
        
        // Call onChunk callback for streaming effect
        onChunk?.(chunk);
      }
      
      // Call onComplete callback with full response
      onComplete?.(fullResponse);
      
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to get AI response');
      onError?.(error);
    } finally {
      setIsStreaming(false);
    }
  }, [onChunk, onComplete, onError]);

  const stopStreaming = useCallback(() => {
    setIsStreaming(false);
  }, []);

  return {
    streamResponse,
    isStreaming,
    stopStreaming
  };
};

