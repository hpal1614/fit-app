// Enhanced fitness knowledge with detailed exercise analysis
export interface AdvancedExerciseKnowledge {
  id: string;
  name: string;
  category: 'strength' | 'cardio' | 'flexibility' | 'plyometric' | 'mobility';
  primaryMuscles: string[];
  secondaryMuscles: string[];
  equipment: string[];
  difficulty: 1 | 2 | 3 | 4 | 5;
  biomechanics: {
    movementPattern: string;
    planeOfMotion: string[];
    jointActions: string[];
  };
  formCues: {
    setup: string[];
    execution: string[];
    breathing: string[];
    commonMistakes: string[];
  };
  progressions: {
    easier: string[];
    harder: string[];
  };
  injuryPrevention: {
    contraindications: string[];
    modifications: string[];
    warmupNeeded: string[];
  };
  programming: {
    strengthReps: string;
    hypertrophyReps: string;
    enduranceReps: string;
    restPeriods: { strength: number; hypertrophy: number; endurance: number };
  };
}

export const ADVANCED_EXERCISE_DATABASE: AdvancedExerciseKnowledge[] = [
  {
    id: 'squat-barbell-back',
    name: 'Barbell Back Squat',
    category: 'strength',
    primaryMuscles: ['quadriceps', 'glutes'],
    secondaryMuscles: ['hamstrings', 'core', 'calves', 'erector-spinae'],
    equipment: ['barbell', 'squat-rack', 'plates'],
    difficulty: 4,
    biomechanics: {
      movementPattern: 'Hip-dominant with knee flexion',
      planeOfMotion: ['sagittal'],
      jointActions: ['hip flexion/extension', 'knee flexion/extension', 'ankle dorsiflexion/plantarflexion']
    },
    formCues: {
      setup: [
        'Bar on upper traps (high bar) or rear delts (low bar)',
        'Hands evenly spaced, tight upper back',
        'Feet shoulder-width apart, toes slightly out',
        'Core braced, chest up'
      ],
      execution: [
        'Initiate by pushing hips back',
        'Descend by bending knees and hips simultaneously',
        'Keep knees tracking over toes',
        'Descend until hip crease below knee',
        'Drive through whole foot to ascend'
      ],
      breathing: [
        'Deep breath at top, hold during descent',
        'Exhale forcefully through sticking point',
        'Reset breathing at top of each rep'
      ],
      commonMistakes: [
        'Knee valgus (knees caving in)',
        'Forward lean with chest drop',
        'Rising onto toes',
        'Partial range of motion',
        'Butt wink (lumbar flexion at bottom)'
      ]
    },
    progressions: {
      easier: ['Goblet squat', 'Box squat', 'Wall squat', 'Assisted squat'],
      harder: ['Front squat', 'Overhead squat', 'Pause squat', 'Single-leg squat']
    },
    injuryPrevention: {
      contraindications: ['Acute knee injury', 'Acute lower back injury', 'Severe ankle mobility restrictions'],
      modifications: ['Reduce range of motion', 'Use heel elevation', 'Switch to goblet squat'],
      warmupNeeded: ['Hip flexor stretches', 'Ankle mobility', 'Glute activation', 'Thoracic spine mobility']
    },
    programming: {
      strengthReps: '1-6 reps',
      hypertrophyReps: '6-12 reps',
      enduranceReps: '12+ reps',
      restPeriods: { strength: 180, hypertrophy: 90, endurance: 60 }
    }
  },
  {
    id: 'deadlift-conventional',
    name: 'Conventional Deadlift',
    category: 'strength',
    primaryMuscles: ['hamstrings', 'glutes', 'erector-spinae'],
    secondaryMuscles: ['quadriceps', 'lats', 'traps', 'rhomboids', 'forearms'],
    equipment: ['barbell', 'plates'],
    difficulty: 5,
    biomechanics: {
      movementPattern: 'Hip hinge with knee extension',
      planeOfMotion: ['sagittal'],
      jointActions: ['hip extension', 'knee extension', 'spinal extension']
    },
    formCues: {
      setup: [
        'Bar over mid-foot, close to shins',
        'Feet hip-width apart, toes forward',
        'Grip outside legs, hands evenly spaced',
        'Shoulders over bar, neutral spine'
      ],
      execution: [
        'Initiate by driving legs into floor',
        'Keep bar close to body throughout',
        'Extend hips and knees simultaneously',
        'Finish with hips fully extended, shoulders back',
        'Reverse movement to lower'
      ],
      breathing: [
        'Big breath before lift, hold during ascent',
        'Exhale at top or during descent',
        'Reset breathing between reps'
      ],
      commonMistakes: [
        'Bar drifting away from body',
        'Rounded back',
        'Hyperextending at top',
        'Knees caving in',
        'Looking up (cervical hyperextension)'
      ]
    },
    progressions: {
      easier: ['Romanian deadlift', 'Rack pulls', 'Sumo deadlift', 'Trap bar deadlift'],
      harder: ['Deficit deadlift', 'Pause deadlift', 'Single-leg deadlift', 'Snatch-grip deadlift']
    },
    injuryPrevention: {
      contraindications: ['Acute lower back injury', 'Herniated disc (acute phase)', 'Severe hamstring strain'],
      modifications: ['Elevate bar height', 'Use trap bar', 'Reduce load', 'Focus on Romanian deadlift'],
      warmupNeeded: ['Hip flexor stretches', 'Hamstring activation', 'Thoracic spine mobility', 'Core activation']
    },
    programming: {
      strengthReps: '1-5 reps',
      hypertrophyReps: '5-8 reps',
      enduranceReps: '8+ reps',
      restPeriods: { strength: 240, hypertrophy: 120, endurance: 90 }
    }
  },
  {
    id: 'bench-press-barbell',
    name: 'Barbell Bench Press',
    category: 'strength',
    primaryMuscles: ['chest', 'triceps'],
    secondaryMuscles: ['front-deltoids', 'serratus-anterior'],
    equipment: ['barbell', 'bench', 'rack'],
    difficulty: 3,
    biomechanics: {
      movementPattern: 'Horizontal push',
      planeOfMotion: ['transverse', 'sagittal'],
      jointActions: ['shoulder horizontal adduction', 'elbow extension', 'scapular protraction']
    },
    formCues: {
      setup: [
        'Eyes under or slightly behind bar',
        'Shoulder blades retracted and depressed',
        'Slight arch in lower back, glutes on bench',
        'Feet flat on floor, creating leg drive'
      ],
      execution: [
        'Unrack with arms locked, bar over shoulders',
        'Lower bar to chest with control',
        'Touch chest lightly at nipple line',
        'Press bar up and slightly back to start',
        'Keep forearms vertical throughout'
      ],
      breathing: [
        'Deep breath before descent',
        'Hold breath during descent and initial press',
        'Exhale through sticking point'
      ],
      commonMistakes: [
        'Bouncing bar off chest',
        'Flaring elbows too wide',
        'Losing shoulder blade position',
        'Feet coming off floor',
        'Uneven bar path'
      ]
    },
    progressions: {
      easier: ['Dumbbell press', 'Push-ups', 'Machine chest press', 'Incline bench press'],
      harder: ['Pause bench press', 'Close-grip bench press', 'Spoto press', 'Board press']
    },
    injuryPrevention: {
      contraindications: ['Shoulder impingement', 'Acute pec strain', 'Elbow tendonitis'],
      modifications: ['Use dumbbells', 'Reduce range of motion', 'Neutral grip', 'Lower weight'],
      warmupNeeded: ['Shoulder dislocations', 'Band pull-aparts', 'Light warm-up sets', 'Rotator cuff work']
    },
    programming: {
      strengthReps: '1-5 reps',
      hypertrophyReps: '6-12 reps',
      enduranceReps: '12+ reps',
      restPeriods: { strength: 180, hypertrophy: 90, endurance: 60 }
    }
  },
  {
    id: 'pull-up',
    name: 'Pull-up',
    category: 'strength',
    primaryMuscles: ['lats', 'biceps'],
    secondaryMuscles: ['rhomboids', 'middle-traps', 'rear-deltoids', 'core'],
    equipment: ['pull-up-bar'],
    difficulty: 3,
    biomechanics: {
      movementPattern: 'Vertical pull',
      planeOfMotion: ['frontal', 'sagittal'],
      jointActions: ['shoulder adduction', 'elbow flexion', 'scapular depression']
    },
    formCues: {
      setup: [
        'Hang from bar with overhand grip, hands shoulder-width',
        'Arms fully extended, core engaged',
        'Shoulders slightly active, not completely relaxed',
        'Legs straight or crossed behind'
      ],
      execution: [
        'Pull by driving elbows down and back',
        'Lead with chest toward bar',
        'Continue until chin clears bar',
        'Lower with control to full extension',
        'Maintain hollow body position'
      ],
      breathing: [
        'Inhale at bottom position',
        'Exhale during pulling phase',
        'Control breathing throughout'
      ],
      commonMistakes: [
        'Using momentum/kipping',
        'Not achieving full range of motion',
        'Pulling with arms only',
        'Letting shoulders shrug up',
        'Looking up excessively'
      ]
    },
    progressions: {
      easier: ['Band-assisted pull-ups', 'Negative pull-ups', 'Inverted rows', 'Lat pulldowns'],
      harder: ['Weighted pull-ups', 'L-sit pull-ups', 'Wide-grip pull-ups', 'Muscle-ups']
    },
    injuryPrevention: {
      contraindications: ['Shoulder impingement', 'Elbow tendonitis', 'Bicep strain'],
      modifications: ['Use assistance', 'Reduce range of motion', 'Switch to chin-ups', 'Use neutral grip'],
      warmupNeeded: ['Shoulder circles', 'Band pull-aparts', 'Scapular pull-ups', 'Light lat work']
    },
    programming: {
      strengthReps: '1-6 reps',
      hypertrophyReps: '6-12 reps',
      enduranceReps: '12+ reps',
      restPeriods: { strength: 150, hypertrophy: 90, endurance: 60 }
    }
  },
  {
    id: 'push-up',
    name: 'Push-up',
    category: 'strength',
    primaryMuscles: ['chest', 'triceps'],
    secondaryMuscles: ['front-deltoids', 'core'],
    equipment: ['bodyweight'],
    difficulty: 2,
    biomechanics: {
      movementPattern: 'Horizontal push',
      planeOfMotion: ['transverse', 'sagittal'],
      jointActions: ['shoulder horizontal adduction', 'elbow extension', 'scapular protraction']
    },
    formCues: {
      setup: [
        'Hands slightly wider than shoulders',
        'Body in straight line from head to heels',
        'Core and glutes engaged',
        'Shoulders over wrists'
      ],
      execution: [
        'Lower body as one unit',
        'Descend until chest nearly touches floor',
        'Keep elbows at 45-degree angle',
        'Push through palms to return',
        'Fully extend arms at top'
      ],
      breathing: [
        'Inhale during descent',
        'Exhale during push phase',
        'Maintain steady rhythm'
      ],
      commonMistakes: [
        'Sagging hips',
        'Piking hips up',
        'Flaring elbows wide',
        'Partial range of motion',
        'Head dropping down'
      ]
    },
    progressions: {
      easier: ['Knee push-ups', 'Incline push-ups', 'Wall push-ups', 'Negative push-ups'],
      harder: ['Diamond push-ups', 'Decline push-ups', 'Plyometric push-ups', 'One-arm push-ups']
    },
    injuryPrevention: {
      contraindications: ['Wrist pain', 'Shoulder impingement', 'Lower back pain'],
      modifications: ['Use push-up handles', 'Elevate hands', 'Reduce range', 'Do from knees'],
      warmupNeeded: ['Wrist circles', 'Shoulder rolls', 'Plank holds', 'Arm circles']
    },
    programming: {
      strengthReps: '5-10 reps',
      hypertrophyReps: '10-20 reps',
      enduranceReps: '20+ reps',
      restPeriods: { strength: 90, hypertrophy: 60, endurance: 45 }
    }
  }
];

export interface NutritionProtocol {
  id: string;
  name: string;
  goal: 'fat-loss' | 'muscle-gain' | 'performance' | 'health' | 'recovery';
  description: string;
  macroDistribution: {
    protein: { min: number; max: number; unit: 'g/kg' | 'g/lb' | '%' };
    carbs: { min: number; max: number; unit: 'g/kg' | 'g/lb' | '%' };
    fat: { min: number; max: number; unit: 'g/kg' | 'g/lb' | '%' };
  };
  timing: {
    preWorkout: string[];
    postWorkout: string[];
    general: string[];
  };
  evidenceLevel: 'high' | 'moderate' | 'limited';
  applicablePopulation: string[];
  implementation: string[];
}

export const NUTRITION_PROTOCOLS: NutritionProtocol[] = [
  {
    id: 'muscle-gain-protocol',
    name: 'Muscle Gain Protocol',
    goal: 'muscle-gain',
    description: 'Evidence-based nutrition strategy for maximizing muscle protein synthesis and supporting training adaptations.',
    macroDistribution: {
      protein: { min: 1.6, max: 2.4, unit: 'g/kg' },
      carbs: { min: 4, max: 7, unit: 'g/kg' },
      fat: { min: 0.8, max: 1.2, unit: 'g/kg' }
    },
    timing: {
      preWorkout: [
        'Consume 20-40g carbs 1-3 hours before training',
        'Include 10-20g protein if training fasted',
        'Ensure adequate hydration'
      ],
      postWorkout: [
        '20-40g high-quality protein within 2 hours',
        '0.5-1.5g/kg carbs depending on training volume',
        'Consider leucine content (2.5-3g minimum)',
        'Creatine 3-5g daily (timing flexible)'
      ],
      general: [
        'Distribute protein evenly across meals (20-40g per meal)',
        'Time carbs around training sessions',
        'Include omega-3 fatty acids daily',
        'Maintain consistent meal timing'
      ]
    },
    evidenceLevel: 'high',
    applicablePopulation: ['Trained individuals', 'Resistance training participants', 'Adults 18-65'],
    implementation: [
      'Calculate total daily protein needs based on body weight',
      'Plan 4-6 meals with balanced macros',
      'Prioritize whole foods over supplements',
      'Adjust carbs based on training demands',
      'Monitor body weight and composition changes'
    ]
  },
  {
    id: 'fat-loss-protocol',
    name: 'Fat Loss Protocol',
    goal: 'fat-loss',
    description: 'Sustainable fat loss approach maintaining muscle mass and performance during caloric deficit.',
    macroDistribution: {
      protein: { min: 2.0, max: 2.6, unit: 'g/kg' },
      carbs: { min: 2, max: 4, unit: 'g/kg' },
      fat: { min: 0.6, max: 1.0, unit: 'g/kg' }
    },
    timing: {
      preWorkout: [
        'Small carb serving (15-30g) if needed for energy',
        'Black coffee or green tea for metabolism',
        'Maintain hydration status'
      ],
      postWorkout: [
        'Prioritize protein (25-40g) within reasonable window',
        'Moderate carbs (20-40g) based on workout intensity',
        'Can delay if intermittent fasting'
      ],
      general: [
        'Higher protein to preserve muscle mass',
        'Time carbs around workouts',
        'Include fibrous vegetables at each meal',
        'Stay hydrated (can reduce hunger)'
      ]
    },
    evidenceLevel: 'high',
    applicablePopulation: ['Individuals with excess body fat', 'Those seeking body recomposition', 'Adults without metabolic conditions'],
    implementation: [
      'Create 20-25% caloric deficit from maintenance',
      'Track intake accurately for 2-4 weeks',
      'Weekly weigh-ins and measurements',
      'Adjust calories based on progress',
      'Include refeed days or diet breaks'
    ]
  },
  {
    id: 'performance-protocol',
    name: 'Athletic Performance Protocol',
    goal: 'performance',
    description: 'Optimize fuel availability and recovery for high-level athletic performance.',
    macroDistribution: {
      protein: { min: 1.4, max: 2.0, unit: 'g/kg' },
      carbs: { min: 5, max: 10, unit: 'g/kg' },
      fat: { min: 1.0, max: 1.5, unit: 'g/kg' }
    },
    timing: {
      preWorkout: [
        'Carb loading 2-4 hours before (1-4g/kg)',
        'Light protein source for satiety',
        'Optimize hydration and electrolytes',
        'Avoid high fiber/fat close to training'
      ],
      postWorkout: [
        'Immediate carbs for glycogen (1-1.2g/kg)',
        'Protein for recovery (0.25-0.3g/kg)',
        'Rehydrate with 150% fluid lost',
        'Include sodium for retention'
      ],
      general: [
        'Match carbs to training volume',
        'Consistent meal timing',
        'Adequate micronutrients',
        'Periodize nutrition with training'
      ]
    },
    evidenceLevel: 'high',
    applicablePopulation: ['Competitive athletes', 'High-volume trainers', 'Endurance and power athletes'],
    implementation: [
      'Calculate needs based on sport and training',
      'Monitor performance metrics',
      'Adjust based on competition schedule',
      'Work with sports dietitian if possible',
      'Consider supplementation strategically'
    ]
  }
];