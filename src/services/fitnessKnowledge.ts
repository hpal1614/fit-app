interface ExerciseData {
  id: string;
  name: string;
  category: string;
  muscleGroups: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  equipment: string[];
  description: string;
  formCues: string[];
  commonMistakes: string[];
  safetyTips: string[];
  mediaPipeKeypoints?: string[];
  biomechanics?: {
    primaryMovers: string[];
    synergists: string[];
    stabilizers: string[];
    movementPattern: string;
  };
}

interface NutritionData {
  id: string;
  topic: string;
  content: string;
  macroGuidelines?: {
    protein: { min: number; max: number; unit: string };
    carbs: { min: number; max: number; unit: string };
    fats: { min: number; max: number; unit: string };
  };
  timingRecommendations?: string[];
}

interface TrainingPrinciple {
  id: string;
  name: string;
  description: string;
  application: string[];
  scientificBasis: string;
}

export const FITNESS_KNOWLEDGE_BASE = {
  exercises: {
    // Compound Movements
    squat: {
      id: 'squat-001',
      name: 'Barbell Back Squat',
      category: 'compound',
      muscleGroups: ['quadriceps', 'glutes', 'hamstrings', 'core'],
      difficulty: 'intermediate',
      equipment: ['barbell', 'squat rack'],
      description: 'The barbell back squat is a fundamental compound exercise that targets the entire lower body and core. It\'s considered the king of all exercises for building leg strength and muscle mass.',
      formCues: [
        'Position the barbell on your upper traps, not your neck',
        'Feet shoulder-width apart with toes slightly pointed outward',
        'Maintain a neutral spine throughout the movement',
        'Initiate the movement by pushing hips back',
        'Descend until hips are just below knee level',
        'Drive through heels to return to starting position',
        'Keep knees tracking over toes',
        'Maintain tight core throughout'
      ],
      commonMistakes: [
        'Knees caving inward (valgus collapse)',
        'Excessive forward lean',
        'Rising hips first (good morning squat)',
        'Not reaching proper depth',
        'Heels coming off the ground',
        'Looking up excessively',
        'Breathing incorrectly'
      ],
      safetyTips: [
        'Always use safety bars in the squat rack',
        'Warm up thoroughly with bodyweight squats',
        'Start with just the bar to practice form',
        'Use a spotter for heavy sets',
        'Never round your lower back',
        'Stop if you feel pain in knees or back'
      ],
      mediaPipeKeypoints: ['left_hip', 'right_hip', 'left_knee', 'right_knee', 'left_ankle', 'right_ankle'],
      biomechanics: {
        primaryMovers: ['quadriceps', 'gluteus maximus'],
        synergists: ['hamstrings', 'adductors', 'gastrocnemius'],
        stabilizers: ['erector spinae', 'rectus abdominis', 'obliques'],
        movementPattern: 'knee-dominant bilateral squat'
      }
    } as ExerciseData,
    
    deadlift: {
      id: 'deadlift-001',
      name: 'Conventional Deadlift',
      category: 'compound',
      muscleGroups: ['hamstrings', 'glutes', 'erector spinae', 'traps', 'lats'],
      difficulty: 'intermediate',
      equipment: ['barbell'],
      description: 'The deadlift is a fundamental hip-hinge movement that works the entire posterior chain. It\'s one of the best exercises for building total-body strength and muscle mass.',
      formCues: [
        'Stand with feet hip-width apart, toes under the bar',
        'Bend at hips and knees to grip the bar just outside legs',
        'Keep back straight and chest up',
        'Engage lats by thinking "protect your armpits"',
        'Drive through heels and push floor away',
        'Keep bar close to body throughout the lift',
        'Fully extend hips and knees at the top',
        'Lower with control by pushing hips back first'
      ],
      commonMistakes: [
        'Rounding the lower back',
        'Bar drifting away from body',
        'Hyperextending at the top',
        'Not engaging lats',
        'Squatting instead of hinging',
        'Jerking the bar off the floor',
        'Not maintaining neutral neck position'
      ],
      safetyTips: [
        'Always maintain a neutral spine',
        'Start with light weight to perfect form',
        'Use proper footwear with flat, hard soles',
        'Reset between reps if needed',
        'Stop if form breaks down',
        'Consider using straps for grip on heavy sets'
      ],
      mediaPipeKeypoints: ['left_shoulder', 'right_shoulder', 'left_hip', 'right_hip', 'left_knee', 'right_knee'],
      biomechanics: {
        primaryMovers: ['gluteus maximus', 'hamstrings', 'erector spinae'],
        synergists: ['quadriceps', 'trapezius', 'latissimus dorsi', 'rhomboids'],
        stabilizers: ['rectus abdominis', 'obliques', 'forearms'],
        movementPattern: 'hip-dominant bilateral hinge'
      }
    } as ExerciseData,
    
    benchPress: {
      id: 'bench-press-001',
      name: 'Barbell Bench Press',
      category: 'compound',
      muscleGroups: ['chest', 'triceps', 'anterior deltoids'],
      difficulty: 'intermediate',
      equipment: ['barbell', 'bench'],
      description: 'The barbell bench press is the primary horizontal pushing exercise for building upper body strength and muscle mass, particularly in the chest, shoulders, and triceps.',
      formCues: [
        'Lie flat with eyes directly under the bar',
        'Plant feet firmly on the floor',
        'Maintain slight arch in lower back',
        'Grip bar slightly wider than shoulder-width',
        'Pull shoulder blades together and down',
        'Lower bar to chest with control',
        'Touch chest lightly at nipple line',
        'Press bar up and slightly back to starting position'
      ],
      commonMistakes: [
        'Bouncing bar off chest',
        'Flaring elbows too wide',
        'Lifting hips off bench',
        'Not maintaining tight upper back',
        'Uneven bar path',
        'Wrists bent backward',
        'Feet not planted firmly'
      ],
      safetyTips: [
        'Always use a spotter for heavy sets',
        'Use safety bars if training alone',
        'Warm up shoulders thoroughly',
        'Keep wrists straight and stacked',
        'Never use false grip without experience',
        'Control the weight at all times'
      ],
      mediaPipeKeypoints: ['left_shoulder', 'right_shoulder', 'left_elbow', 'right_elbow', 'left_wrist', 'right_wrist'],
      biomechanics: {
        primaryMovers: ['pectoralis major', 'triceps brachii'],
        synergists: ['anterior deltoid', 'serratus anterior'],
        stabilizers: ['rotator cuff', 'biceps brachii', 'core musculature'],
        movementPattern: 'horizontal push'
      }
    } as ExerciseData,
    
    // Add more exercises...
  },
  
  nutrition: {
    proteinTiming: {
      id: 'nutrition-001',
      topic: 'Protein Timing for Muscle Growth',
      content: 'Research shows that distributing protein intake throughout the day optimizes muscle protein synthesis. Aim for 20-40g of high-quality protein every 3-4 hours, with special attention to the post-workout window.',
      macroGuidelines: {
        protein: { min: 1.6, max: 2.2, unit: 'g/kg bodyweight' },
        carbs: { min: 3, max: 5, unit: 'g/kg bodyweight' },
        fats: { min: 0.8, max: 1.2, unit: 'g/kg bodyweight' }
      },
      timingRecommendations: [
        'Consume 20-40g protein within 2 hours post-workout',
        'Have a protein source with each meal',
        'Consider casein protein before bed',
        'Pre-workout protein can enhance performance'
      ]
    } as NutritionData,
    
    carbCycling: {
      id: 'nutrition-002',
      topic: 'Carbohydrate Cycling for Performance',
      content: 'Strategic carbohydrate timing can optimize performance and body composition. Higher carb intake on training days fuels performance, while lower intake on rest days may enhance fat oxidation.',
      macroGuidelines: {
        protein: { min: 2.0, max: 2.5, unit: 'g/kg bodyweight' },
        carbs: { min: 1, max: 5, unit: 'g/kg bodyweight' },
        fats: { min: 0.8, max: 1.5, unit: 'g/kg bodyweight' }
      },
      timingRecommendations: [
        'High carbs (4-5g/kg) on intense training days',
        'Moderate carbs (2-3g/kg) on moderate training days',
        'Low carbs (1-2g/kg) on rest days',
        'Time carbs around workouts for best results'
      ]
    } as NutritionData,
    
    hydration: {
      id: 'nutrition-003',
      topic: 'Hydration for Athletic Performance',
      content: 'Proper hydration is crucial for performance and recovery. Even mild dehydration (2% body weight loss) can significantly impair strength, power, and endurance.',
      timingRecommendations: [
        'Drink 500-600ml 2-3 hours before exercise',
        'Consume 200-300ml 10-20 minutes before exercise',
        'Drink 200-250ml every 15-20 minutes during exercise',
        'Replace 150% of fluid lost through sweat post-exercise',
        'Monitor urine color - pale yellow indicates good hydration'
      ]
    } as NutritionData,
    
    // Add more nutrition topics...
  },
  
  physiology: {
    progressiveOverload: {
      id: 'physio-001',
      name: 'Progressive Overload',
      description: 'The gradual increase of stress placed upon the body during exercise training. This is the fundamental principle that drives all training adaptations.',
      application: [
        'Increase weight by 2.5-5% when all sets and reps are completed',
        'Add 1-2 reps per set before increasing weight',
        'Increase training volume by no more than 10% per week',
        'Vary overload methods: weight, reps, sets, tempo, rest periods'
      ],
      scientificBasis: 'Progressive overload triggers mechanotransduction in muscle fibers, activating mTOR pathway and satellite cells, leading to muscle protein synthesis and hypertrophy.'
    } as TrainingPrinciple,
    
    supercompensation: {
      id: 'physio-002',
      name: 'Supercompensation',
      description: 'The post-training period when the body adapts to stress by increasing performance capacity above baseline levels.',
      application: [
        'Allow 48-72 hours between training same muscle groups',
        'Time hardest workouts when fully recovered',
        'Use deload weeks every 4-6 weeks',
        'Monitor performance indicators for optimal timing'
      ],
      scientificBasis: 'Training creates homeostatic disruption. During recovery, the body adapts by increasing capacity to handle future stress, resulting in improved performance.'
    } as TrainingPrinciple,
    
    specificAdaptation: {
      id: 'physio-003',
      name: 'Specific Adaptation to Imposed Demands (SAID)',
      description: 'The body adapts specifically to the type of demand placed on it. Training should mimic the desired outcome.',
      application: [
        'Train movement patterns specific to your goals',
        'Use rep ranges specific to desired adaptation',
        'Match training velocity to sport requirements',
        'Include sport-specific exercises in programming'
      ],
      scientificBasis: 'Neural adaptations, muscle fiber type shifts, and metabolic changes occur specifically in response to training stimulus characteristics.'
    } as TrainingPrinciple,
    
    // Add more physiology principles...
  },
  
  psychology: {
    goalSetting: {
      id: 'psych-001',
      name: 'SMART Goal Setting',
      description: 'Effective goal setting using Specific, Measurable, Achievable, Relevant, and Time-bound criteria.',
      application: [
        'Set specific performance targets (e.g., "Squat 315 lbs")',
        'Create measurable milestones',
        'Ensure goals are challenging but achievable',
        'Align goals with personal values',
        'Set deadlines for accountability'
      ],
      scientificBasis: 'Goal setting theory shows that specific, challenging goals lead to higher performance through increased focus, effort, persistence, and strategy development.'
    } as TrainingPrinciple,
    
    intrinsicMotivation: {
      id: 'psych-002',
      name: 'Building Intrinsic Motivation',
      description: 'Developing internal drive for training through autonomy, mastery, and purpose.',
      application: [
        'Focus on personal improvement over comparison',
        'Track progress to see mastery development',
        'Connect training to larger life goals',
        'Celebrate small victories',
        'Find training methods you enjoy'
      ],
      scientificBasis: 'Self-Determination Theory shows intrinsic motivation leads to better adherence and performance than extrinsic rewards alone.'
    } as TrainingPrinciple,
    
    // Add more psychology principles...
  }
};

// Helper function to convert knowledge base to indexable documents
export function convertToIndexableDocuments() {
  const documents: any[] = [];
  
  // Convert exercises
  Object.values(FITNESS_KNOWLEDGE_BASE.exercises).forEach(exercise => {
    documents.push({
      id: exercise.id,
      content: `${exercise.name}: ${exercise.description} Form cues: ${exercise.formCues.join('. ')} Common mistakes: ${exercise.commonMistakes.join('. ')} Safety tips: ${exercise.safetyTips.join('. ')}`,
      metadata: {
        category: 'exercise',
        subcategory: exercise.category,
        exercise_name: exercise.name,
        muscle_groups: exercise.muscleGroups,
        difficulty: exercise.difficulty
      }
    });
  });
  
  // Convert nutrition
  Object.values(FITNESS_KNOWLEDGE_BASE.nutrition).forEach(nutrition => {
    documents.push({
      id: nutrition.id,
      content: `${nutrition.topic}: ${nutrition.content} ${nutrition.timingRecommendations ? 'Recommendations: ' + nutrition.timingRecommendations.join('. ') : ''}`,
      metadata: {
        category: 'nutrition',
        topic: nutrition.topic
      }
    });
  });
  
  // Convert physiology
  Object.values(FITNESS_KNOWLEDGE_BASE.physiology).forEach(principle => {
    documents.push({
      id: principle.id,
      content: `${principle.name}: ${principle.description} Application: ${principle.application.join('. ')} Scientific basis: ${principle.scientificBasis}`,
      metadata: {
        category: 'physiology',
        principle_name: principle.name
      }
    });
  });
  
  // Convert psychology
  Object.values(FITNESS_KNOWLEDGE_BASE.psychology).forEach(principle => {
    documents.push({
      id: principle.id,
      content: `${principle.name}: ${principle.description} Application: ${principle.application.join('. ')} Scientific basis: ${principle.scientificBasis}`,
      metadata: {
        category: 'psychology',
        principle_name: principle.name
      }
    });
  });
  
  return documents;
}