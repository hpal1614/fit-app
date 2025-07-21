import { Exercise } from '../types';

export const EXERCISE_DATABASE: Exercise[] = [
  // Chest Exercises
  {
    id: 'bench-press',
    name: 'Bench Press',
    category: 'chest',
    muscleGroups: ['chest', 'triceps', 'shoulders'],
    equipment: ['barbell'],
    instructions: [
      'Lie flat on bench with feet planted on the ground',
      'Grip barbell with hands slightly wider than shoulder-width',
      'Lower bar to chest with control',
      'Press bar up explosively until arms are fully extended',
      'Keep shoulder blades retracted throughout movement'
    ],
    tips: [
      'Keep your back in natural arch',
      'Drive through your heels',
      'Keep wrists straight and strong',
      'Control the descent, explosive on the way up',
      'Breathe in on the descent, out on the press'
    ]
  },
  {
    id: 'incline-bench-press',
    name: 'Incline Bench Press',
    category: 'chest',
    muscleGroups: ['chest', 'triceps', 'shoulders'],
    equipment: ['barbell'],
    instructions: [
      'Set bench to 30-45 degree incline',
      'Lie back with feet planted firmly',
      'Grip barbell with hands slightly wider than shoulders',
      'Lower bar to upper chest',
      'Press up explosively'
    ],
    tips: [
      'Focus on upper chest engagement',
      'Don\'t let elbows flare too wide',
      'Keep core tight throughout',
      'Use full range of motion'
    ]
  },
  {
    id: 'dumbbell-press',
    name: 'Dumbbell Bench Press',
    category: 'chest',
    muscleGroups: ['chest', 'triceps', 'shoulders'],
    equipment: ['dumbbell'],
    instructions: [
      'Lie on bench with dumbbell in each hand',
      'Start with dumbbells at chest level',
      'Press dumbbells up and slightly together',
      'Lower with control to chest level',
      'Maintain constant tension'
    ],
    tips: [
      'Go deeper than barbell allows',
      'Focus on stretch at bottom',
      'Squeeze chest at top',
      'Control the weight throughout'
    ]
  },
  {
    id: 'push-ups',
    name: 'Push-ups',
    category: 'chest',
    muscleGroups: ['chest', 'triceps', 'shoulders'],
    equipment: ['bodyweight'],
    instructions: [
      'Start in plank position with hands under shoulders',
      'Lower body until chest nearly touches ground',
      'Push up explosively to starting position',
      'Keep body in straight line throughout',
      'Engage core and glutes'
    ],
    tips: [
      'Don\'t let hips sag or pike up',
      'Full range of motion',
      'Control the descent',
      'Breathe properly',
      'Modify on knees if needed'
    ]
  },

  // Back Exercises
  {
    id: 'deadlift',
    name: 'Deadlift',
    category: 'back',
    muscleGroups: ['lower-back', 'lats', 'traps', 'hamstrings', 'glutes'],
    equipment: ['barbell'],
    instructions: [
      'Stand with feet hip-width apart, bar over mid-foot',
      'Bend at hips and knees to grip bar',
      'Keep chest up and back straight',
      'Drive through heels and pull bar up close to body',
      'Stand tall with shoulders back',
      'Reverse movement to lower bar'
    ],
    tips: [
      'Keep bar close to body throughout',
      'Drive with legs first, then hips',
      'Don\'t round your back',
      'Look straight ahead',
      'Full hip extension at top'
    ]
  },
  {
    id: 'barbell-row',
    name: 'Barbell Row',
    category: 'back',
    muscleGroups: ['lats', 'rhomboids', 'traps', 'biceps'],
    equipment: ['barbell'],
    instructions: [
      'Stand with feet hip-width apart, holding barbell',
      'Hinge at hips to lean forward about 45 degrees',
      'Keep back straight and chest up',
      'Pull barbell to lower chest/upper abdomen',
      'Lower with control'
    ],
    tips: [
      'Squeeze shoulder blades together',
      'Don\'t use momentum',
      'Keep elbows close to body',
      'Full range of motion',
      'Strong core engagement'
    ]
  },
  {
    id: 'pull-ups',
    name: 'Pull-ups',
    category: 'back',
    muscleGroups: ['lats', 'rhomboids', 'biceps'],
    equipment: ['bodyweight'],
    instructions: [
      'Hang from bar with arms fully extended',
      'Use overhand grip, hands shoulder-width apart',
      'Pull body up until chin clears bar',
      'Lower with control to full extension',
      'Maintain straight body line'
    ],
    tips: [
      'Start from dead hang',
      'Lead with chest',
      'Squeeze lats at top',
      'Control the descent',
      'Use assistance if needed'
    ]
  },
  {
    id: 'lat-pulldown',
    name: 'Lat Pulldown',
    category: 'back',
    muscleGroups: ['lats', 'rhomboids', 'biceps'],
    equipment: ['machine'],
    instructions: [
      'Sit at lat pulldown machine',
      'Grip bar wider than shoulder-width',
      'Lean back slightly and pull bar to upper chest',
      'Squeeze shoulder blades together',
      'Return to starting position with control'
    ],
    tips: [
      'Don\'t pull behind neck',
      'Focus on lat engagement',
      'Don\'t use momentum',
      'Full stretch at top'
    ]
  },

  // Leg Exercises
  {
    id: 'squat',
    name: 'Back Squat',
    category: 'legs',
    muscleGroups: ['quads', 'glutes', 'hamstrings'],
    equipment: ['barbell'],
    instructions: [
      'Position barbell on upper back/traps',
      'Stand with feet shoulder-width apart',
      'Lower by pushing hips back and bending knees',
      'Descend until hips are below knees',
      'Drive through heels to return to standing'
    ],
    tips: [
      'Keep chest up and core tight',
      'Knees track over toes',
      'Go to full depth',
      'Drive through whole foot',
      'Maintain neutral spine'
    ]
  },
  {
    id: 'front-squat',
    name: 'Front Squat',
    category: 'legs',
    muscleGroups: ['quads', 'glutes', 'core'],
    equipment: ['barbell'],
    instructions: [
      'Position barbell on front deltoids',
      'Keep elbows high and chest up',
      'Descend into squat position',
      'Keep torso upright throughout',
      'Drive up through heels'
    ],
    tips: [
      'More quad-dominant than back squat',
      'Requires good mobility',
      'Keep elbows up',
      'Core engagement crucial'
    ]
  },
  {
    id: 'romanian-deadlift',
    name: 'Romanian Deadlift',
    category: 'legs',
    muscleGroups: ['hamstrings', 'glutes', 'lower-back'],
    equipment: ['barbell'],
    instructions: [
      'Hold barbell with overhand grip',
      'Stand with feet hip-width apart',
      'Hinge at hips, pushing them back',
      'Lower bar while keeping legs mostly straight',
      'Feel stretch in hamstrings, then return to standing'
    ],
    tips: [
      'Focus on hip hinge movement',
      'Keep bar close to body',
      'Feel the stretch',
      'Don\'t round back'
    ]
  },
  {
    id: 'leg-press',
    name: 'Leg Press',
    category: 'legs',
    muscleGroups: ['quads', 'glutes', 'hamstrings'],
    equipment: ['machine'],
    instructions: [
      'Sit in leg press machine',
      'Place feet on platform shoulder-width apart',
      'Lower weight until knees reach 90 degrees',
      'Press through heels to return to start',
      'Don\'t lock knees at top'
    ],
    tips: [
      'Control the descent',
      'Full range of motion',
      'Keep core engaged',
      'Feet placement affects muscle emphasis'
    ]
  },

  // Shoulder Exercises
  {
    id: 'overhead-press',
    name: 'Overhead Press',
    category: 'shoulders',
    muscleGroups: ['shoulders', 'triceps', 'core'],
    equipment: ['barbell'],
    instructions: [
      'Stand with feet shoulder-width apart',
      'Hold barbell at shoulder height',
      'Press bar straight up overhead',
      'Lock out arms at top',
      'Lower with control to shoulders'
    ],
    tips: [
      'Keep core tight',
      'Don\'t arch back excessively',
      'Bar path should be straight',
      'Full lockout overhead'
    ]
  },
  {
    id: 'lateral-raise',
    name: 'Lateral Raise',
    category: 'shoulders',
    muscleGroups: ['shoulders'],
    equipment: ['dumbbell'],
    instructions: [
      'Stand with dumbbells at sides',
      'Raise arms out to sides',
      'Lift until arms are parallel to floor',
      'Lower with control',
      'Keep slight bend in elbows'
    ],
    tips: [
      'Don\'t use momentum',
      'Control the weight',
      'Focus on side deltoids',
      'Quality over quantity'
    ]
  },
  {
    id: 'rear-delt-fly',
    name: 'Rear Delt Fly',
    category: 'shoulders',
    muscleGroups: ['shoulders', 'rhomboids'],
    equipment: ['dumbbell'],
    instructions: [
      'Bend forward at hips holding dumbbells',
      'With slight elbow bend, raise arms out to sides',
      'Squeeze shoulder blades together',
      'Lower with control',
      'Focus on rear deltoids'
    ],
    tips: [
      'Don\'t use momentum',
      'Feel it in rear delts',
      'Keep chest up',
      'Light weight, high quality'
    ]
  },

  // Arm Exercises
  {
    id: 'bicep-curl',
    name: 'Bicep Curl',
    category: 'arms',
    muscleGroups: ['biceps'],
    equipment: ['dumbbell'],
    instructions: [
      'Stand with dumbbells at sides',
      'Keep elbows at sides',
      'Curl weights up toward shoulders',
      'Squeeze biceps at top',
      'Lower with control'
    ],
    tips: [
      'Don\'t swing the weights',
      'Keep elbows stationary',
      'Full range of motion',
      'Control the negative'
    ]
  },
  {
    id: 'tricep-dips',
    name: 'Tricep Dips',
    category: 'arms',
    muscleGroups: ['triceps', 'shoulders'],
    equipment: ['bodyweight'],
    instructions: [
      'Sit on edge of bench or chair',
      'Place hands on edge, fingers forward',
      'Lower body by bending elbows',
      'Push back up to starting position',
      'Keep body close to bench'
    ],
    tips: [
      'Don\'t go too low',
      'Keep elbows close to body',
      'Control the movement',
      'Modify difficulty with leg position'
    ]
  },
  {
    id: 'close-grip-bench',
    name: 'Close Grip Bench Press',
    category: 'arms',
    muscleGroups: ['triceps', 'chest', 'shoulders'],
    equipment: ['barbell'],
    instructions: [
      'Lie on bench with narrow grip on barbell',
      'Keep elbows close to sides',
      'Lower bar to chest',
      'Press up explosively',
      'Focus on tricep engagement'
    ],
    tips: [
      'Hands about shoulder-width apart',
      'Keep elbows tucked',
      'Feel it in triceps',
      'Don\'t go too narrow on grip'
    ]
  },

  // Core Exercises
  {
    id: 'plank',
    name: 'Plank',
    category: 'core',
    muscleGroups: ['abs', 'obliques'],
    equipment: ['bodyweight'],
    instructions: [
      'Start in push-up position',
      'Lower to forearms',
      'Keep body in straight line',
      'Hold position',
      'Breathe normally'
    ],
    tips: [
      'Don\'t let hips sag or pike up',
      'Engage glutes and core',
      'Look down at floor',
      'Build time gradually'
    ]
  },
  {
    id: 'russian-twists',
    name: 'Russian Twists',
    category: 'core',
    muscleGroups: ['abs', 'obliques'],
    equipment: ['bodyweight'],
    instructions: [
      'Sit with knees bent, lean back slightly',
      'Lift feet off ground',
      'Rotate torso left and right',
      'Touch ground beside hips',
      'Keep chest up'
    ],
    tips: [
      'Control the rotation',
      'Don\'t just move arms',
      'Engage core throughout',
      'Can add weight for difficulty'
    ]
  },
  {
    id: 'hanging-leg-raise',
    name: 'Hanging Leg Raise',
    category: 'core',
    muscleGroups: ['abs'],
    equipment: ['bodyweight'],
    instructions: [
      'Hang from pull-up bar',
      'Keep legs straight or slightly bent',
      'Raise legs until parallel to ground',
      'Lower with control',
      'Don\'t swing'
    ],
    tips: [
      'Control the movement',
      'Focus on abs, not hip flexors',
      'Don\'t use momentum',
      'Can bend knees to modify'
    ]
  }
];

// Exercise categories for easy filtering
export const EXERCISE_CATEGORIES = {
  chest: 'Chest',
  back: 'Back',
  shoulders: 'Shoulders',
  arms: 'Arms',
  legs: 'Legs',
  core: 'Core',
  cardio: 'Cardio',
  'full-body': 'Full Body'
} as const;

// Muscle groups for targeting
export const MUSCLE_GROUPS = {
  chest: 'Chest',
  triceps: 'Triceps',
  shoulders: 'Shoulders',
  biceps: 'Biceps',
  lats: 'Lats',
  traps: 'Traps',
  rhomboids: 'Rhomboids',
  'lower-back': 'Lower Back',
  quads: 'Quadriceps',
  hamstrings: 'Hamstrings',
  glutes: 'Glutes',
  calves: 'Calves',
  abs: 'Abs',
  obliques: 'Obliques'
} as const;

// Equipment types
export const EQUIPMENT_TYPES = {
  barbell: 'Barbell',
  dumbbell: 'Dumbbell',
  kettlebell: 'Kettlebell',
  machine: 'Machine',
  cable: 'Cable',
  bodyweight: 'Bodyweight',
  'resistance-band': 'Resistance Band',
  suspension: 'Suspension Trainer',
  'medicine-ball': 'Medicine Ball',
  'foam-roller': 'Foam Roller'
} as const;

// Workout templates
export const WORKOUT_TEMPLATES = [
  {
    id: 'push-day',
    name: 'Push Day',
    description: 'Chest, shoulders, and triceps',
    category: 'strength',
    difficulty: 'intermediate',
    estimatedDuration: 60,
    exercises: [
      { exerciseId: 'bench-press', targetSets: 4, targetReps: 8, order: 1 },
      { exerciseId: 'incline-bench-press', targetSets: 3, targetReps: 10, order: 2 },
      { exerciseId: 'overhead-press', targetSets: 3, targetReps: 8, order: 3 },
      { exerciseId: 'lateral-raise', targetSets: 3, targetReps: 12, order: 4 },
      { exerciseId: 'close-grip-bench', targetSets: 3, targetReps: 10, order: 5 },
      { exerciseId: 'tricep-dips', targetSets: 3, targetReps: 12, order: 6 }
    ]
  },
  {
    id: 'pull-day',
    name: 'Pull Day',
    description: 'Back and biceps',
    category: 'strength',
    difficulty: 'intermediate',
    estimatedDuration: 60,
    exercises: [
      { exerciseId: 'deadlift', targetSets: 4, targetReps: 5, order: 1 },
      { exerciseId: 'pull-ups', targetSets: 4, targetReps: 8, order: 2 },
      { exerciseId: 'barbell-row', targetSets: 3, targetReps: 8, order: 3 },
      { exerciseId: 'lat-pulldown', targetSets: 3, targetReps: 10, order: 4 },
      { exerciseId: 'bicep-curl', targetSets: 4, targetReps: 12, order: 5 },
      { exerciseId: 'rear-delt-fly', targetSets: 3, targetReps: 15, order: 6 }
    ]
  },
  {
    id: 'leg-day',
    name: 'Leg Day',
    description: 'Legs and glutes',
    category: 'strength',
    difficulty: 'intermediate',
    estimatedDuration: 75,
    exercises: [
      { exerciseId: 'squat', targetSets: 4, targetReps: 8, order: 1 },
      { exerciseId: 'romanian-deadlift', targetSets: 3, targetReps: 10, order: 2 },
      { exerciseId: 'front-squat', targetSets: 3, targetReps: 8, order: 3 },
      { exerciseId: 'leg-press', targetSets: 3, targetReps: 15, order: 4 }
    ]
  },
  {
    id: 'upper-body',
    name: 'Upper Body',
    description: 'Complete upper body workout',
    category: 'strength',
    difficulty: 'beginner',
    estimatedDuration: 45,
    exercises: [
      { exerciseId: 'push-ups', targetSets: 3, targetReps: 12, order: 1 },
      { exerciseId: 'dumbbell-press', targetSets: 3, targetReps: 10, order: 2 },
      { exerciseId: 'barbell-row', targetSets: 3, targetReps: 10, order: 3 },
      { exerciseId: 'overhead-press', targetSets: 3, targetReps: 8, order: 4 },
      { exerciseId: 'bicep-curl', targetSets: 2, targetReps: 12, order: 5 },
      { exerciseId: 'tricep-dips', targetSets: 2, targetReps: 10, order: 6 }
    ]
  },
  {
    id: 'core-blast',
    name: 'Core Blast',
    description: 'Intense core workout',
    category: 'core',
    difficulty: 'intermediate',
    estimatedDuration: 30,
    exercises: [
      { exerciseId: 'plank', targetSets: 3, targetReps: 60, order: 1 }, // 60 seconds
      { exerciseId: 'russian-twists', targetSets: 3, targetReps: 20, order: 2 },
      { exerciseId: 'hanging-leg-raise', targetSets: 3, targetReps: 10, order: 3 }
    ]
  }
];

// Common rep ranges for different goals
export const REP_RANGES = {
  strength: { min: 1, max: 5, description: 'Heavy weight, low reps for strength' },
  muscle: { min: 6, max: 12, description: 'Moderate weight, moderate reps for muscle growth' },
  endurance: { min: 13, max: 20, description: 'Light weight, high reps for endurance' },
  power: { min: 3, max: 6, description: 'Explosive movements for power development' }
};

// Rest time recommendations by exercise type
export const REST_TIMES = {
  compound: { strength: 180, muscle: 120, endurance: 60 }, // seconds
  isolation: { strength: 120, muscle: 90, endurance: 45 },
  cardio: { hiit: 30, steady: 0, recovery: 60 }
};

// Exercise difficulty levels
export const DIFFICULTY_LEVELS = {
  beginner: { description: 'New to exercise or specific movement', color: 'green' },
  intermediate: { description: 'Some experience with exercise', color: 'yellow' },
  advanced: { description: 'Experienced with proper form and technique', color: 'orange' },
  expert: { description: 'Years of experience, perfect form', color: 'red' }
};