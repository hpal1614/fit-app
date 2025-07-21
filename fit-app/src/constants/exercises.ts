import type { 
  Exercise, 
  WorkoutTemplate
} from '../types/workout';
import { 
  ExerciseCategory, 
  MuscleGroup, 
  EquipmentType, 
  WorkoutType 
} from '../types/workout';

// Comprehensive exercise database
export const EXERCISE_DATABASE: Exercise[] = [
  // Chest Exercises
  {
    id: 'bench-press',
    name: 'Bench Press',
    category: ExerciseCategory.COMPOUND,
    primaryMuscles: [MuscleGroup.CHEST],
    secondaryMuscles: [MuscleGroup.SHOULDERS, MuscleGroup.TRICEPS],
    equipment: [EquipmentType.BARBELL],
    instructions: [
      'Lie on the bench with your eyes under the bar',
      'Grip the bar with hands slightly wider than shoulder-width',
      'Plant your feet firmly on the ground',
      'Unrack the bar and position it over your chest',
      'Lower the bar to your chest with control',
      'Press the bar back up to starting position'
    ],
    tips: [
      'Keep your shoulder blades retracted and down',
      'Maintain a slight arch in your back',
      'Don\'t bounce the bar off your chest',
      'Breathe in during the descent, exhale during the press'
    ],
    difficulty: 3,
    variations: ['Incline Bench Press', 'Decline Bench Press', 'Dumbbell Bench Press'],
    warnings: ['Use a spotter for heavy weights', 'Warm up thoroughly before lifting']
  },
  
  {
    id: 'incline-bench-press',
    name: 'Incline Bench Press',
    category: ExerciseCategory.COMPOUND,
    primaryMuscles: [MuscleGroup.CHEST],
    secondaryMuscles: [MuscleGroup.SHOULDERS, MuscleGroup.TRICEPS],
    equipment: [EquipmentType.BARBELL],
    instructions: [
      'Set the bench to a 30-45 degree incline',
      'Lie back with your head and shoulders supported',
      'Grip the bar with hands shoulder-width apart',
      'Unrack and lower the bar to your upper chest',
      'Press the bar straight up, not back toward your head'
    ],
    tips: [
      'Focus on the upper chest muscles',
      'Don\'t set the incline too steep (over 45 degrees)',
      'Keep your core engaged throughout'
    ],
    difficulty: 3
  },

  // Back Exercises
  {
    id: 'deadlift',
    name: 'Deadlift',
    category: ExerciseCategory.COMPOUND,
    primaryMuscles: [MuscleGroup.BACK, MuscleGroup.GLUTES, MuscleGroup.HAMSTRINGS],
    secondaryMuscles: [MuscleGroup.CORE, MuscleGroup.FOREARMS],
    equipment: [EquipmentType.BARBELL],
    instructions: [
      'Stand with feet hip-width apart, bar over mid-foot',
      'Bend at hips and knees to grip the bar',
      'Keep your back straight and chest up',
      'Drive through your heels to lift the bar',
      'Stand up tall, pulling shoulders back',
      'Lower the bar by pushing hips back first'
    ],
    tips: [
      'Keep the bar close to your body throughout',
      'Don\'t round your back under any circumstance',
      'Think "push the floor away" rather than "pull the bar up"',
      'Engage your lats to keep the bar close'
    ],
    difficulty: 4,
    variations: ['Romanian Deadlift', 'Sumo Deadlift', 'Trap Bar Deadlift'],
    warnings: ['Master the movement with light weight first', 'Consider using lifting straps for grip']
  },

  {
    id: 'pull-up',
    name: 'Pull-up',
    category: ExerciseCategory.COMPOUND,
    primaryMuscles: [MuscleGroup.BACK],
    secondaryMuscles: [MuscleGroup.BICEPS, MuscleGroup.CORE],
    equipment: [EquipmentType.BODYWEIGHT],
    instructions: [
      'Hang from the bar with palms facing away',
      'Use a grip slightly wider than shoulder-width',
      'Pull yourself up until your chin clears the bar',
      'Lower yourself with control to full arm extension',
      'Avoid swinging or kipping'
    ],
    tips: [
      'Engage your lats by pulling your elbows down and back',
      'Keep your core tight to avoid swinging',
      'Focus on the negative (lowering) portion',
      'Use assistance bands or machine if needed'
    ],
    difficulty: 4,
    variations: ['Chin-up', 'Wide-Grip Pull-up', 'Weighted Pull-up']
  },

  // Leg Exercises
  {
    id: 'squat',
    name: 'Back Squat',
    category: ExerciseCategory.COMPOUND,
    primaryMuscles: [MuscleGroup.QUADS, MuscleGroup.GLUTES],
    secondaryMuscles: [MuscleGroup.HAMSTRINGS, MuscleGroup.CORE],
    equipment: [EquipmentType.BARBELL],
    instructions: [
      'Position the bar on your upper back (trapezius)',
      'Stand with feet shoulder-width apart',
      'Keep your chest up and core braced',
      'Initiate the movement by sitting back with your hips',
      'Lower until thighs are parallel to the floor',
      'Drive through your heels to return to standing'
    ],
    tips: [
      'Keep your knees tracking over your toes',
      'Maintain the natural curve in your lower back',
      'Go only as deep as your mobility allows',
      'Focus on sitting back rather than just bending knees'
    ],
    difficulty: 4,
    variations: ['Front Squat', 'Goblet Squat', 'Bulgarian Split Squat'],
    warnings: ['Use safety bars set at appropriate height', 'Warm up with bodyweight squats first']
  },

  {
    id: 'lunges',
    name: 'Lunges',
    category: ExerciseCategory.COMPOUND,
    primaryMuscles: [MuscleGroup.QUADS, MuscleGroup.GLUTES],
    secondaryMuscles: [MuscleGroup.HAMSTRINGS, MuscleGroup.CORE],
    equipment: [EquipmentType.BODYWEIGHT, EquipmentType.DUMBBELL],
    instructions: [
      'Stand tall with feet hip-width apart',
      'Step forward with one leg into a long stride',
      'Lower your body until both knees are at 90 degrees',
      'Keep your front knee over your ankle',
      'Push off your front foot to return to starting position'
    ],
    tips: [
      'Keep most of your weight on your front leg',
      'Don\'t let your front knee cave inward',
      'Take a large enough step to maintain balance',
      'Keep your torso upright throughout'
    ],
    difficulty: 2,
    variations: ['Reverse Lunges', 'Walking Lunges', 'Lateral Lunges']
  },

  // Shoulder Exercises
  {
    id: 'overhead-press',
    name: 'Overhead Press',
    category: ExerciseCategory.COMPOUND,
    primaryMuscles: [MuscleGroup.SHOULDERS],
    secondaryMuscles: [MuscleGroup.TRICEPS, MuscleGroup.CORE],
    equipment: [EquipmentType.BARBELL],
    instructions: [
      'Stand with feet shoulder-width apart',
      'Hold the bar at shoulder level with forearms vertical',
      'Brace your core and glutes',
      'Press the bar straight up overhead',
      'Move your head slightly back to clear the bar path',
      'Lower the bar with control to starting position'
    ],
    tips: [
      'Keep your core tight throughout the movement',
      'Don\'t arch your back excessively',
      'Press the bar in a straight line overhead',
      'Squeeze your glutes to maintain stability'
    ],
    difficulty: 3,
    variations: ['Dumbbell Shoulder Press', 'Seated Press', 'Push Press']
  },

  // Arm Exercises
  {
    id: 'dumbbell-curl',
    name: 'Dumbbell Bicep Curl',
    category: ExerciseCategory.ISOLATION,
    primaryMuscles: [MuscleGroup.BICEPS],
    secondaryMuscles: [MuscleGroup.FOREARMS],
    equipment: [EquipmentType.DUMBBELL],
    instructions: [
      'Stand with a dumbbell in each hand, arms at your sides',
      'Keep your elbows close to your torso',
      'Curl the weights while contracting your biceps',
      'Continue until dumbbells are at shoulder level',
      'Lower the weights slowly to starting position'
    ],
    tips: [
      'Don\'t swing the weights or use momentum',
      'Keep your wrists straight and strong',
      'Focus on the squeeze at the top',
      'Control the negative portion of the movement'
    ],
    difficulty: 2,
    variations: ['Hammer Curls', 'Barbell Curls', 'Cable Curls']
  },

  {
    id: 'tricep-dip',
    name: 'Tricep Dips',
    category: ExerciseCategory.COMPOUND,
    primaryMuscles: [MuscleGroup.TRICEPS],
    secondaryMuscles: [MuscleGroup.SHOULDERS, MuscleGroup.CHEST],
    equipment: [EquipmentType.BODYWEIGHT],
    instructions: [
      'Position yourself between parallel bars or on a bench',
      'Support your weight on your arms with elbows straight',
      'Lower your body by bending your elbows',
      'Go down until you feel a stretch in your shoulders',
      'Push yourself back up to the starting position'
    ],
    tips: [
      'Keep your body upright, don\'t lean too far forward',
      'Don\'t go too deep if you feel shoulder discomfort',
      'Focus on using your triceps, not your legs',
      'Keep your elbows pointing straight back'
    ],
    difficulty: 3,
    variations: ['Bench Dips', 'Assisted Dips', 'Weighted Dips']
  },

  // Core Exercises
  {
    id: 'plank',
    name: 'Plank',
    category: ExerciseCategory.ISOLATION,
    primaryMuscles: [MuscleGroup.CORE],
    secondaryMuscles: [MuscleGroup.SHOULDERS, MuscleGroup.GLUTES],
    equipment: [EquipmentType.BODYWEIGHT],
    instructions: [
      'Start in a push-up position with forearms on the ground',
      'Keep your body in a straight line from head to heels',
      'Engage your core and squeeze your glutes',
      'Hold this position while breathing normally',
      'Don\'t let your hips sag or pike up'
    ],
    tips: [
      'Focus on quality over duration',
      'Keep your neck in a neutral position',
      'Breathe steadily throughout the hold',
      'Think about pulling your belly button to your spine'
    ],
    difficulty: 2,
    variations: ['Side Plank', 'Plank with Leg Lift', 'Mountain Climbers']
  },

  // Push-up
  {
    id: 'push-up',
    name: 'Push-up',
    category: ExerciseCategory.COMPOUND,
    primaryMuscles: [MuscleGroup.CHEST],
    secondaryMuscles: [MuscleGroup.SHOULDERS, MuscleGroup.TRICEPS, MuscleGroup.CORE],
    equipment: [EquipmentType.BODYWEIGHT],
    instructions: [
      'Start in a plank position with hands under shoulders',
      'Lower your body until your chest nearly touches the floor',
      'Keep your body in a straight line throughout',
      'Push through your palms to return to starting position',
      'Maintain core engagement throughout'
    ],
    tips: [
      'Don\'t let your hips sag or pike up',
      'Keep your head in a neutral position',
      'Lower yourself slowly and push up explosively',
      'Modify on knees if needed'
    ],
    difficulty: 2,
    variations: ['Incline Push-up', 'Diamond Push-up', 'Wide-Grip Push-up']
  }
];

// Exercise categories for organization
export const EXERCISE_CATEGORIES = {
  [ExerciseCategory.COMPOUND]: 'Compound Movements',
  [ExerciseCategory.ISOLATION]: 'Isolation Exercises',
  [ExerciseCategory.CARDIO]: 'Cardiovascular',
  [ExerciseCategory.FLEXIBILITY]: 'Flexibility & Mobility',
  [ExerciseCategory.PLYOMETRIC]: 'Plyometric & Power',
  [ExerciseCategory.FUNCTIONAL]: 'Functional Training'
};

// Muscle group definitions
export const MUSCLE_GROUPS = {
  [MuscleGroup.CHEST]: 'Chest',
  [MuscleGroup.BACK]: 'Back',
  [MuscleGroup.SHOULDERS]: 'Shoulders',
  [MuscleGroup.BICEPS]: 'Biceps',
  [MuscleGroup.TRICEPS]: 'Triceps',
  [MuscleGroup.FOREARMS]: 'Forearms',
  [MuscleGroup.CORE]: 'Core',
  [MuscleGroup.QUADS]: 'Quadriceps',
  [MuscleGroup.HAMSTRINGS]: 'Hamstrings',
  [MuscleGroup.GLUTES]: 'Glutes',
  [MuscleGroup.CALVES]: 'Calves',
  [MuscleGroup.FULL_BODY]: 'Full Body'
};

// Equipment types
export const EQUIPMENT_TYPES = {
  [EquipmentType.BARBELL]: 'Barbell',
  [EquipmentType.DUMBBELL]: 'Dumbbell',
  [EquipmentType.CABLE]: 'Cable Machine',
  [EquipmentType.MACHINE]: 'Weight Machine',
  [EquipmentType.BODYWEIGHT]: 'Bodyweight',
  [EquipmentType.KETTLEBELL]: 'Kettlebell',
  [EquipmentType.RESISTANCE_BAND]: 'Resistance Bands',
  [EquipmentType.CARDIO_MACHINE]: 'Cardio Equipment'
};

// Pre-built workout templates
export const WORKOUT_TEMPLATES: WorkoutTemplate[] = [
  {
    id: 'upper-body-strength',
    name: 'Upper Body Strength',
    description: 'Focus on building strength in chest, back, shoulders, and arms',
    type: WorkoutType.STRENGTH,
    exercises: [
      { exerciseId: 'bench-press', targetSets: 4, targetReps: 6, restTime: 180, orderIndex: 0 },
      { exerciseId: 'pull-up', targetSets: 3, targetReps: 8, restTime: 120, orderIndex: 1 },
      { exerciseId: 'overhead-press', targetSets: 3, targetReps: 8, restTime: 120, orderIndex: 2 },
      { exerciseId: 'dumbbell-curl', targetSets: 3, targetReps: 12, restTime: 90, orderIndex: 3 },
      { exerciseId: 'tricep-dip', targetSets: 3, targetReps: 10, restTime: 90, orderIndex: 4 }
    ],
    estimatedDuration: 75,
    difficulty: 4,
    tags: ['strength', 'upper-body', 'compound'],
    isCustom: false,
    createdAt: new Date(),
  },
  
  {
    id: 'lower-body-power',
    name: 'Lower Body Power',
    description: 'Build leg strength and power with compound movements',
    type: WorkoutType.STRENGTH,
    exercises: [
      { exerciseId: 'squat', targetSets: 4, targetReps: 5, restTime: 180, orderIndex: 0 },
      { exerciseId: 'deadlift', targetSets: 3, targetReps: 5, restTime: 180, orderIndex: 1 },
      { exerciseId: 'lunges', targetSets: 3, targetReps: 12, restTime: 90, orderIndex: 2 }
    ],
    estimatedDuration: 60,
    difficulty: 4,
    tags: ['strength', 'lower-body', 'power'],
    isCustom: false,
    createdAt: new Date(),
  },
  
  {
    id: 'full-body-beginner',
    name: 'Full Body Beginner',
    description: 'Perfect starter workout covering all major muscle groups',
    type: WorkoutType.STRENGTH,
    exercises: [
      { exerciseId: 'push-up', targetSets: 3, targetReps: 10, restTime: 60, orderIndex: 0 },
      { exerciseId: 'squat', targetSets: 3, targetReps: 12, restTime: 60, orderIndex: 1 },
      { exerciseId: 'pull-up', targetSets: 3, targetReps: 5, restTime: 90, orderIndex: 2 },
      { exerciseId: 'lunges', targetSets: 2, targetReps: 10, restTime: 60, orderIndex: 3 },
      { exerciseId: 'plank', targetSets: 3, targetReps: 30, restTime: 60, orderIndex: 4 }
    ],
    estimatedDuration: 45,
    difficulty: 2,
    tags: ['beginner', 'full-body', 'bodyweight'],
    isCustom: false,
    createdAt: new Date(),
  }
];

// Rep ranges for different goals
export const REP_RANGES = {
  strength: { min: 1, max: 6, description: 'Strength & Power' },
  hypertrophy: { min: 6, max: 12, description: 'Muscle Growth' },
  endurance: { min: 12, max: 20, description: 'Muscular Endurance' },
  power: { min: 3, max: 8, description: 'Explosive Power' }
};

// Rest time recommendations
export const REST_TIMES = {
  strength: { seconds: 180, description: '3+ minutes for strength' },
  hypertrophy: { seconds: 90, description: '60-90 seconds for growth' },
  endurance: { seconds: 45, description: '30-60 seconds for endurance' },
  circuit: { seconds: 30, description: '15-30 seconds for circuits' }
};

// Difficulty levels
export const DIFFICULTY_LEVELS = {
  1: { label: 'Beginner', description: 'New to exercise or this movement' },
  2: { label: 'Novice', description: 'Some experience with basic movements' },
  3: { label: 'Intermediate', description: 'Comfortable with most exercises' },
  4: { label: 'Advanced', description: 'Experienced with proper form' },
  5: { label: 'Expert', description: 'Master-level technique and strength' }
};

// Helper functions for exercise management
export function getExerciseById(id: string): Exercise | undefined {
  return EXERCISE_DATABASE.find(exercise => exercise.id === id);
}

export function getExercisesByMuscleGroup(muscleGroup: MuscleGroup): Exercise[] {
  return EXERCISE_DATABASE.filter(exercise => 
    exercise.primaryMuscles.includes(muscleGroup) || 
    exercise.secondaryMuscles.includes(muscleGroup)
  );
}

export function getExercisesByEquipment(equipment: EquipmentType): Exercise[] {
  return EXERCISE_DATABASE.filter(exercise => 
    exercise.equipment.includes(equipment)
  );
}

export function getExercisesByDifficulty(difficulty: number): Exercise[] {
  return EXERCISE_DATABASE.filter(exercise => exercise.difficulty === difficulty);
}

export function searchExercises(query: string): Exercise[] {
  const lowercaseQuery = query.toLowerCase();
  return EXERCISE_DATABASE.filter(exercise =>
    exercise.name.toLowerCase().includes(lowercaseQuery) ||
    exercise.instructions.some(instruction => 
      instruction.toLowerCase().includes(lowercaseQuery)
    ) ||
    exercise.tips.some(tip => 
      tip.toLowerCase().includes(lowercaseQuery)
    )
  );
}