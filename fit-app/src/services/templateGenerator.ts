import type { Workout, Exercise, Set } from '../types/workout';

export interface UserProfile {
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  primaryGoal: 'weight_loss' | 'muscle_building' | 'strength' | 'athletic' | 'maintenance';
  equipment: 'gym' | 'home' | 'minimal';
  timePerSession: 30 | 45 | 60 | 90;
  daysPerWeek: 3 | 4 | 5 | 6;
  currentWeight?: number;
  targetWeight?: number;
  activityLevel?: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active';
  dietaryPreferences?: 'omnivore' | 'vegetarian' | 'vegan';
  foodAllergies?: string[];
  budget?: 'budget_friendly' | 'premium';
}

export interface WorkoutTemplate {
  name: string;
  description: string;
  workouts: Workout[];
  progressionPlan: string;
  notes: string[];
}

export interface NutritionTemplate {
  name: string;
  description: string;
  dailyCalories: number;
  macros: {
    protein: number;
    carbs: number;
    fats: number;
  };
  mealPlan: {
    breakfast: string[];
    lunch: string[];
    dinner: string[];
    snacks: string[];
  };
  timing: {
    preWorkout: string;
    postWorkout: string;
    mealSpacing: string;
  };
  supplements?: string[];
  notes: string[];
}

export class TemplateGenerator {
  private static exercises = {
    beginner: {
      gym: {
        upper: ['Bench Press', 'Dumbbell Rows', 'Overhead Press', 'Bicep Curls', 'Tricep Pushdowns', 'Lat Pulldowns'],
        lower: ['Squats', 'Romanian Deadlifts', 'Lunges', 'Leg Press', 'Calf Raises', 'Planks'],
        full: ['Deadlifts', 'Squats', 'Bench Press', 'Pull-ups', 'Planks', 'Mountain Climbers']
      },
      home: {
        upper: ['Push-ups', 'Inverted Rows', 'Pike Push-ups', 'Diamond Push-ups', 'Superman'],
        lower: ['Bodyweight Squats', 'Lunges', 'Glute Bridges', 'Calf Raises', 'Wall Sits'],
        full: ['Push-ups', 'Squats', 'Lunges', 'Planks', 'Mountain Climbers', 'Burpees']
      },
      minimal: {
        upper: ['Push-ups', 'Inverted Rows', 'Pike Push-ups'],
        lower: ['Bodyweight Squats', 'Lunges', 'Glute Bridges'],
        full: ['Push-ups', 'Squats', 'Lunges', 'Planks']
      }
    },
    intermediate: {
      gym: {
        upper: ['Bench Press', 'Pull-ups', 'Overhead Press', 'Barbell Rows', 'Dips', 'Incline Dumbbell Press'],
        lower: ['Squats', 'Deadlifts', 'Lunges', 'Leg Press', 'Romanian Deadlifts', 'Bulgarian Split Squats'],
        full: ['Deadlifts', 'Squats', 'Pull-ups', 'Push-ups', 'Planks', 'Burpees']
      },
      home: {
        upper: ['Diamond Push-ups', 'Pull-ups', 'Pike Push-ups', 'Archer Push-ups', 'Handstand Practice'],
        lower: ['Pistol Squats', 'Jump Lunges', 'Single-leg Glute Bridges', 'Calf Raises', 'Wall Sits'],
        full: ['Burpees', 'Mountain Climbers', 'Planks', 'Jump Squats', 'Push-ups', 'Lunges']
      },
      minimal: {
        upper: ['Diamond Push-ups', 'Pull-ups', 'Pike Push-ups'],
        lower: ['Pistol Squats', 'Jump Lunges', 'Single-leg Glute Bridges'],
        full: ['Burpees', 'Mountain Climbers', 'Planks', 'Jump Squats']
      }
    },
    advanced: {
      gym: {
        upper: ['Weighted Pull-ups', 'Weighted Dips', 'Barbell Bench Press', 'Overhead Press', 'Barbell Rows'],
        lower: ['Back Squats', 'Deadlifts', 'Front Squats', 'Romanian Deadlifts', 'Lunges'],
        full: ['Deadlifts', 'Squats', 'Pull-ups', 'Push-ups', 'Planks', 'Burpees']
      },
      home: {
        upper: ['One-arm Push-ups', 'Muscle-ups', 'Handstand Push-ups', 'Archer Pull-ups', 'Planche Progressions'],
        lower: ['Pistol Squats', 'Jump Lunges', 'Single-leg Deadlifts', 'Calf Raises', 'Wall Sits'],
        full: ['Burpees', 'Mountain Climbers', 'Planks', 'Jump Squats', 'Push-ups', 'Lunges']
      },
      minimal: {
        upper: ['One-arm Push-ups', 'Muscle-ups', 'Handstand Push-ups'],
        lower: ['Pistol Squats', 'Jump Lunges', 'Single-leg Deadlifts'],
        full: ['Burpees', 'Mountain Climbers', 'Planks', 'Jump Squats']
      }
    }
  };

  static generateWorkoutTemplate(profile: UserProfile): WorkoutTemplate {
    const { experienceLevel, primaryGoal, equipment, timePerSession, daysPerWeek } = profile;
    
    let workouts: Workout[] = [];
    let progressionPlan = '';
    let notes: string[] = [];

    // Determine workout split based on days per week
    let workoutSplit: { [key: string]: string[] } = {};
    
    if (daysPerWeek === 3) {
      workoutSplit = {
        'Day 1': ['upper'],
        'Day 2': ['lower'],
        'Day 3': ['full']
      };
    } else if (daysPerWeek === 4) {
      workoutSplit = {
        'Day 1': ['upper'],
        'Day 2': ['lower'],
        'Day 3': ['upper'],
        'Day 4': ['lower']
      };
      
      // Add more specific muscle group targeting for 4-day split
      if (primaryGoal === 'muscle_building') {
        workoutSplit = {
          'Day 1': ['upper'], // Push: Chest, Shoulders, Triceps
          'Day 2': ['lower'], // Legs: Quads, Hamstrings, Calves
          'Day 3': ['upper'], // Pull: Back, Biceps
          'Day 4': ['lower']  // Legs + Core: Glutes, Core, Cardio
        };
      }
    } else if (daysPerWeek === 5) {
      workoutSplit = {
        'Day 1': ['upper'],
        'Day 2': ['lower'],
        'Day 3': ['upper'],
        'Day 4': ['lower'],
        'Day 5': ['full']
      };
    } else if (daysPerWeek === 6) {
      workoutSplit = {
        'Day 1': ['upper'],
        'Day 2': ['lower'],
        'Day 3': ['upper'],
        'Day 4': ['lower'],
        'Day 5': ['upper'],
        'Day 6': ['lower']
      };
    }

    // Generate workouts for each day
    Object.entries(workoutSplit).forEach(([dayName, muscleGroups]) => {
      const exercises: Exercise[] = [];
      
      muscleGroups.forEach(group => {
        const availableExercises = this.exercises[experienceLevel][equipment][group];
        const exercisesPerGroup = Math.min(4, Math.floor(timePerSession / 15));
        
        for (let i = 0; i < exercisesPerGroup; i++) {
          const exerciseName = availableExercises[i % availableExercises.length];
          const sets: Set[] = [];
          
          // Determine sets and reps based on goal and experience
          let setsCount = 3;
          let repsRange = '8-12';
          
          if (primaryGoal === 'strength') {
            setsCount = 4;
            repsRange = '3-6';
          } else if (primaryGoal === 'weight_loss') {
            setsCount = 3;
            repsRange = '12-15';
          } else if (primaryGoal === 'muscle_building') {
            if (experienceLevel === 'beginner') {
              setsCount = 3;
              repsRange = '8-12';
            } else {
              setsCount = 4;
              repsRange = '8-12';
            }
          } else if (experienceLevel === 'beginner') {
            setsCount = 2;
            repsRange = '8-12';
          }
          
          for (let j = 0; j < setsCount; j++) {
            sets.push({
              id: `${j + 1}`,
              reps: repsRange,
              weight: experienceLevel === 'beginner' ? 'Bodyweight' : 'Progressive',
              rest: '60-90 seconds',
              completed: false
            });
          }
          
          exercises.push({
            id: `${group}-${i}`,
            name: exerciseName,
            category: group,
            sets: sets,
            notes: experienceLevel === 'beginner' ? 'Focus on form' : 'Progressive overload'
          });
        }
      });
      
      workouts.push({
        id: dayName.toLowerCase().replace(' ', '-'),
        name: dayName,
        exercises: exercises,
        date: new Date(),
        duration: timePerSession,
        notes: `Focus on ${muscleGroups.join(' and ')} muscles`
      });
    });

    // Generate progression plan
    if (experienceLevel === 'beginner') {
      progressionPlan = 'Week 1-2: Focus on form and consistency. Week 3-4: Increase reps by 2-3. Week 5-6: Add 1 set to each exercise. Week 7-8: Increase difficulty (e.g., weighted exercises).';
    } else if (experienceLevel === 'intermediate') {
      progressionPlan = 'Week 1-2: Increase weight by 5-10%. Week 3-4: Add 1-2 reps to each set. Week 5-6: Decrease rest time by 15 seconds. Week 7-8: Add 1 set to compound movements.';
    } else {
      progressionPlan = 'Week 1-2: Increase weight by 2.5-5%. Week 3-4: Add 1 rep to each set. Week 5-6: Implement drop sets on last set. Week 7-8: Add supersets for similar muscle groups.';
    }

    // Generate notes
    notes = [
      `Rest ${daysPerWeek === 3 ? '1-2 days' : daysPerWeek === 4 ? '1 day' : '1 day'} between similar muscle groups`,
      'Warm up for 5-10 minutes before each workout',
      'Cool down and stretch for 5-10 minutes after each workout',
      'Stay hydrated throughout your workout',
      'Listen to your body and adjust intensity as needed'
    ];

    if (primaryGoal === 'weight_loss') {
      notes.push('Add 10-15 minutes of cardio after strength training');
    } else if (primaryGoal === 'strength') {
      notes.push('Focus on compound movements and progressive overload');
    }

    return {
      name: `${experienceLevel.charAt(0).toUpperCase() + experienceLevel.slice(1)} ${primaryGoal.replace('_', ' ')} Program`,
      description: `A ${daysPerWeek}-day ${experienceLevel} workout program designed for ${primaryGoal.replace('_', ' ')} using ${equipment} equipment.`,
      workouts: workouts,
      progressionPlan: progressionPlan,
      notes: notes
    };
  }

  static generateNutritionTemplate(profile: UserProfile): NutritionTemplate {
    const { primaryGoal, currentWeight, targetWeight, activityLevel, dietaryPreferences, budget } = profile;
    
    // Calculate BMR using Mifflin-St Jeor Equation (simplified)
    const bmr = currentWeight ? currentWeight * 10 : 2000; // Default if weight not provided
    
    // Calculate TDEE based on activity level
    let tdee = bmr;
    if (activityLevel === 'sedentary') tdee = bmr * 1.2;
    else if (activityLevel === 'lightly_active') tdee = bmr * 1.375;
    else if (activityLevel === 'moderately_active') tdee = bmr * 1.55;
    else if (activityLevel === 'very_active') tdee = bmr * 1.725;
    
    // Adjust calories based on goal
    let dailyCalories = tdee;
    if (primaryGoal === 'weight_loss') {
      dailyCalories = tdee - 500; // 500 calorie deficit
    } else if (primaryGoal === 'muscle_building') {
      dailyCalories = tdee + 300; // 300 calorie surplus
    }
    
    // Calculate macros
    let proteinRatio = 0.25; // 25% protein
    let carbRatio = 0.45; // 45% carbs
    let fatRatio = 0.30; // 30% fats
    
    if (primaryGoal === 'muscle_building') {
      proteinRatio = 0.30; // 30% protein for muscle building
      carbRatio = 0.50; // 50% carbs
      fatRatio = 0.20; // 20% fats
    } else if (primaryGoal === 'weight_loss') {
      proteinRatio = 0.35; // 35% protein for satiety
      carbRatio = 0.35; // 35% carbs
      fatRatio = 0.30; // 30% fats
    }
    
    const macros = {
      protein: Math.round((dailyCalories * proteinRatio) / 4), // 4 calories per gram
      carbs: Math.round((dailyCalories * carbRatio) / 4), // 4 calories per gram
      fats: Math.round((dailyCalories * fatRatio) / 9) // 9 calories per gram
    };
    
    // Generate meal plan based on preferences
    const mealPlan = this.generateMealPlan(dietaryPreferences, budget, primaryGoal);
    
    // Generate timing recommendations
    const timing = {
      preWorkout: primaryGoal === 'muscle_building' ? 'Eat 2-3 hours before: Complex carbs + protein' : 'Eat 1-2 hours before: Light carbs + protein',
      postWorkout: 'Within 30 minutes: Protein + carbs (20-30g protein, 30-60g carbs)',
      mealSpacing: 'Eat every 3-4 hours to maintain stable blood sugar and energy levels'
    };
    
    // Generate supplements
    const supplements = [];
    if (primaryGoal === 'muscle_building') {
      supplements.push('Whey protein powder', 'Creatine monohydrate (5g daily)');
    } else if (primaryGoal === 'weight_loss') {
      supplements.push('Multivitamin', 'Omega-3 fatty acids');
    }
    
    // Generate notes
    const notes = [
      'Drink at least 8-10 glasses of water daily',
      'Eat slowly and mindfully',
      'Include a variety of colorful vegetables',
      'Limit processed foods and added sugars',
      'Plan and prep meals ahead of time'
    ];
    
    if (primaryGoal === 'weight_loss') {
      notes.push('Use smaller plates to control portion sizes');
      notes.push('Keep a food diary to track intake');
    } else if (primaryGoal === 'muscle_building') {
      notes.push('Eat protein with every meal');
      notes.push('Don\'t skip post-workout nutrition');
    }
    
    return {
      name: `${primaryGoal.replace('_', ' ').charAt(0).toUpperCase() + primaryGoal.replace('_', ' ').slice(1)} Nutrition Plan`,
      description: `A personalized nutrition plan designed for ${primaryGoal.replace('_', ' ')} with ${dailyCalories} calories daily.`,
      dailyCalories: Math.round(dailyCalories),
      macros: macros,
      mealPlan: mealPlan,
      timing: timing,
      supplements: supplements.length > 0 ? supplements : undefined,
      notes: notes
    };
  }
  
  private static generateMealPlan(dietaryPreferences?: string, budget?: string, goal?: string) {
    const isBudget = budget === 'budget_friendly';
    const isMuscleBuilding = goal === 'muscle_building';
    
    const breakfast = isBudget ? 
      ['Oatmeal with banana and peanut butter', 'Greek yogurt with berries', 'Eggs with whole grain toast'] :
      ['Protein smoothie with berries and almond milk', 'Avocado toast with eggs', 'Greek yogurt parfait with granola'];
    
    const lunch = isBudget ?
      ['Chicken breast with brown rice and vegetables', 'Tuna salad with whole grain bread', 'Bean and vegetable soup'] :
      ['Grilled salmon with quinoa and roasted vegetables', 'Turkey and avocado wrap', 'Mediterranean salad with chickpeas'];
    
    const dinner = isBudget ?
      ['Lean ground beef with sweet potato and broccoli', 'Baked chicken with brown rice', 'Lentil curry with rice'] :
      ['Grilled steak with roasted vegetables', 'Baked cod with quinoa and asparagus', 'Stir-fried tofu with vegetables'];
    
    const snacks = isBudget ?
      ['Apple with peanut butter', 'Greek yogurt', 'Carrots with hummus'] :
      ['Protein bar', 'Mixed nuts and dried fruit', 'Smoothie with protein powder'];
    
    return { breakfast, lunch, dinner, snacks };
  }
}
