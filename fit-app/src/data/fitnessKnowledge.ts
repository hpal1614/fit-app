// Comprehensive Fitness Knowledge Database
export interface ExerciseGuide {
  id: string;
  name: string;
  category: 'strength' | 'cardio' | 'flexibility' | 'balance' | 'power';
  muscleGroups: string[];
  equipment: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  description: string;
  properForm: string[];
  commonMistakes: string[];
  variations: string[];
  benefits: string[];
  safetyTips: string[];
  repRange: { min: number; max: number };
  sets: { min: number; max: number };
  restTime: { min: number; max: number };
  embeddings?: number[]; // For vector search
}

export interface NutritionKnowledge {
  id: string;
  topic: string;
  category: 'macros' | 'timing' | 'supplements' | 'hydration' | 'meal-planning';
  content: string;
  keyPoints: string[];
  scientificEvidence: string;
  practicalTips: string[];
  commonMisconceptions: string[];
  embeddings?: number[];
}

export interface WorkoutPrinciple {
  id: string;
  name: string;
  category: 'programming' | 'recovery' | 'progression' | 'technique';
  description: string;
  application: string[];
  examples: string[];
  embeddings?: number[];
}

// Exercise Database
export const exerciseDatabase: ExerciseGuide[] = [
  {
    id: "squat-barbell",
    name: "Barbell Back Squat",
    category: "strength",
    muscleGroups: ["quadriceps", "glutes", "hamstrings", "core"],
    equipment: ["barbell", "squat rack"],
    difficulty: "intermediate",
    description: "The barbell back squat is a compound exercise that targets the entire lower body and core.",
    properForm: [
      "Position the barbell on your upper traps, not your neck",
      "Stand with feet shoulder-width apart, toes slightly pointed out",
      "Keep your chest up and maintain a neutral spine",
      "Initiate the movement by pushing your hips back",
      "Lower until thighs are parallel to the ground or below",
      "Drive through your heels to return to standing",
      "Keep knees tracking over toes throughout the movement"
    ],
    commonMistakes: [
      "Knees caving inward (valgus collapse)",
      "Heels coming off the ground",
      "Excessive forward lean",
      "Not reaching proper depth",
      "Bouncing at the bottom",
      "Looking up excessively"
    ],
    variations: [
      "Front Squat",
      "Goblet Squat",
      "Box Squat",
      "Pause Squat",
      "Bulgarian Split Squat"
    ],
    benefits: [
      "Builds overall lower body strength",
      "Improves core stability",
      "Enhances athletic performance",
      "Increases bone density",
      "Boosts testosterone and growth hormone"
    ],
    safetyTips: [
      "Always use safety bars in the squat rack",
      "Warm up thoroughly before heavy sets",
      "Consider using a belt for heavy loads",
      "Never squat with a rounded back",
      "Have a spotter for max attempts"
    ],
    repRange: { min: 1, max: 20 },
    sets: { min: 3, max: 6 },
    restTime: { min: 120, max: 300 }
  },
  {
    id: "bench-press",
    name: "Barbell Bench Press",
    category: "strength",
    muscleGroups: ["chest", "triceps", "front deltoids"],
    equipment: ["barbell", "bench", "rack"],
    difficulty: "intermediate",
    description: "The bench press is a fundamental upper body exercise for building chest, shoulder, and tricep strength.",
    properForm: [
      "Lie flat on bench with eyes under the bar",
      "Grip bar slightly wider than shoulder-width",
      "Create an arch in your back while keeping glutes on bench",
      "Retract and depress shoulder blades",
      "Lower bar to chest with control",
      "Press bar up and slightly back to starting position",
      "Keep wrists straight and elbows at 45-degree angle"
    ],
    commonMistakes: [
      "Bouncing bar off chest",
      "Flaring elbows too wide",
      "Losing shoulder blade position",
      "Feet not firmly planted",
      "Uneven bar path",
      "Lifting hips off bench"
    ],
    variations: [
      "Incline Bench Press",
      "Decline Bench Press",
      "Dumbbell Bench Press",
      "Close-Grip Bench Press",
      "Pause Bench Press"
    ],
    benefits: [
      "Develops upper body pushing strength",
      "Builds chest muscle mass",
      "Improves shoulder stability",
      "Transfers to athletic movements",
      "Enhances bone density in upper body"
    ],
    safetyTips: [
      "Always use a spotter for heavy sets",
      "Use safety pins when training alone",
      "Warm up shoulders thoroughly",
      "Never use thumbless grip",
      "Control the descent - don't drop the bar"
    ],
    repRange: { min: 1, max: 15 },
    sets: { min: 3, max: 5 },
    restTime: { min: 120, max: 300 }
  },
  {
    id: "deadlift",
    name: "Conventional Deadlift",
    category: "strength",
    muscleGroups: ["hamstrings", "glutes", "erector spinae", "traps", "lats"],
    equipment: ["barbell"],
    difficulty: "intermediate",
    description: "The deadlift is a full-body compound exercise that builds total body strength and power.",
    properForm: [
      "Stand with feet hip-width apart, toes under the bar",
      "Hinge at hips and grip bar just outside legs",
      "Keep back neutral, chest up, shoulders over bar",
      "Take slack out of bar by engaging lats",
      "Drive through heels and extend hips and knees simultaneously",
      "Lock out with hips and knees fully extended",
      "Lower bar with control by pushing hips back first"
    ],
    commonMistakes: [
      "Rounding the lower back",
      "Bar drifting away from body",
      "Hyperextending at lockout",
      "Jerking the bar off floor",
      "Not engaging lats",
      "Squatting instead of hinging"
    ],
    variations: [
      "Sumo Deadlift",
      "Romanian Deadlift",
      "Trap Bar Deadlift",
      "Deficit Deadlift",
      "Rack Pulls"
    ],
    benefits: [
      "Builds total body strength",
      "Improves posture",
      "Enhances grip strength",
      "Increases muscle mass",
      "Boosts metabolic rate"
    ],
    safetyTips: [
      "Always maintain neutral spine",
      "Use mixed grip or straps for heavy loads",
      "Don't train to failure frequently",
      "Reset between reps if needed",
      "Consider using a belt for max attempts"
    ],
    repRange: { min: 1, max: 12 },
    sets: { min: 3, max: 5 },
    restTime: { min: 180, max: 300 }
  },
  {
    id: "plank",
    name: "Plank",
    category: "strength",
    muscleGroups: ["core", "shoulders", "glutes"],
    equipment: ["none"],
    difficulty: "beginner",
    description: "The plank is an isometric core exercise that builds stability and endurance.",
    properForm: [
      "Start in push-up position on forearms",
      "Keep body in straight line from head to heels",
      "Engage core and glutes",
      "Keep hips level - don't sag or pike",
      "Breathe normally throughout hold",
      "Maintain neutral neck position"
    ],
    commonMistakes: [
      "Hips sagging toward ground",
      "Hips too high in air",
      "Holding breath",
      "Looking up or down excessively",
      "Shoulders not over elbows",
      "Not engaging glutes"
    ],
    variations: [
      "Side Plank",
      "Plank with Leg Lifts",
      "Plank Jacks",
      "Mountain Climbers",
      "Plank to Push-up"
    ],
    benefits: [
      "Improves core stability",
      "Enhances posture",
      "Reduces back pain risk",
      "Builds mental toughness",
      "No equipment needed"
    ],
    safetyTips: [
      "Start with shorter holds",
      "Focus on form over duration",
      "Stop if lower back hurts",
      "Progress gradually",
      "Use knee variation if needed"
    ],
    repRange: { min: 20, max: 180 }, // seconds
    sets: { min: 3, max: 5 },
    restTime: { min: 30, max: 60 }
  },
  {
    id: "running",
    name: "Running",
    category: "cardio",
    muscleGroups: ["legs", "core", "cardiovascular system"],
    equipment: ["running shoes"],
    difficulty: "beginner",
    description: "Running is a fundamental cardiovascular exercise that improves endurance and overall fitness.",
    properForm: [
      "Land on midfoot under center of gravity",
      "Keep cadence around 170-180 steps per minute",
      "Maintain upright posture with slight forward lean",
      "Arms bent at 90 degrees, swinging forward and back",
      "Breathe rhythmically through nose and mouth",
      "Keep shoulders relaxed"
    ],
    commonMistakes: [
      "Overstriding (heel striking far ahead)",
      "Running too fast too soon",
      "Ignoring pain signals",
      "Poor breathing patterns",
      "Tensing upper body",
      "Not warming up properly"
    ],
    variations: [
      "Interval Running",
      "Hill Sprints",
      "Tempo Runs",
      "Long Slow Distance",
      "Fartlek Training"
    ],
    benefits: [
      "Improves cardiovascular health",
      "Burns calories efficiently",
      "Strengthens bones",
      "Reduces stress",
      "Improves mental health"
    ],
    safetyTips: [
      "Increase mileage gradually (10% rule)",
      "Invest in proper running shoes",
      "Run on varied surfaces",
      "Include rest days",
      "Stay hydrated"
    ],
    repRange: { min: 20, max: 90 }, // minutes
    sets: { min: 1, max: 1 },
    restTime: { min: 1440, max: 2880 } // 1-2 days
  }
];

// Nutrition Knowledge Database
export const nutritionDatabase: NutritionKnowledge[] = [
  {
    id: "protein-basics",
    topic: "Protein Requirements for Muscle Growth",
    category: "macros",
    content: "Protein is essential for muscle repair and growth. The optimal intake varies based on activity level and goals.",
    keyPoints: [
      "General recommendation: 0.8-1g per kg body weight",
      "Athletes: 1.6-2.2g per kg body weight",
      "Spread intake throughout the day (20-40g per meal)",
      "Complete proteins contain all essential amino acids",
      "Leucine threshold: 2.5-3g per meal for muscle protein synthesis"
    ],
    scientificEvidence: "Research shows 1.6g/kg/day optimizes muscle protein synthesis for most individuals (Morton et al., 2018)",
    practicalTips: [
      "Include protein at every meal",
      "Combine plant proteins for complete amino acid profile",
      "Post-workout protein within 3-4 hour window",
      "Consider casein before bed for overnight recovery"
    ],
    commonMisconceptions: [
      "More protein always equals more muscle",
      "You must consume protein immediately after training",
      "Plant proteins can't build muscle",
      "Protein damages kidneys in healthy individuals"
    ]
  },
  {
    id: "carb-timing",
    topic: "Carbohydrate Timing for Performance",
    category: "timing",
    content: "Strategic carbohydrate timing can optimize performance and recovery while supporting body composition goals.",
    keyPoints: [
      "Pre-workout: 1-4g/kg 1-4 hours before",
      "During workout: 30-60g/hour for sessions >60 minutes",
      "Post-workout: 0.8-1.2g/kg within 4 hours",
      "Higher carb days on training days",
      "Lower carb on rest days for fat loss"
    ],
    scientificEvidence: "Carbohydrate intake of 5-7g/kg/day supports moderate training; 7-12g/kg for intense training (Burke et al., 2011)",
    practicalTips: [
      "Focus on complex carbs for sustained energy",
      "Simple carbs post-workout for faster recovery",
      "Pair carbs with protein for better absorption",
      "Time largest carb intake around training"
    ],
    commonMisconceptions: [
      "Carbs make you fat",
      "Keto is best for all athletes",
      "Fruit is bad because of sugar",
      "You need carbs immediately post-workout"
    ]
  },
  {
    id: "hydration-performance",
    topic: "Hydration for Athletic Performance",
    category: "hydration",
    content: "Proper hydration is crucial for performance, recovery, and overall health. Even mild dehydration impairs performance.",
    keyPoints: [
      "Daily baseline: 35-40ml per kg body weight",
      "Exercise: 400-800ml per hour depending on sweat rate",
      "Monitor urine color (pale yellow optimal)",
      "Include electrolytes for sessions >60 minutes",
      "Pre-hydrate 2-4 hours before exercise"
    ],
    scientificEvidence: "2% dehydration can decrease performance by 10-20% (Cheuvront & Kenefick, 2014)",
    practicalTips: [
      "Weigh yourself before/after exercise",
      "Drink 150% of fluid lost through sweat",
      "Add sodium to drinks for heavy sweaters",
      "Keep water bottle visible as reminder"
    ],
    commonMisconceptions: [
      "Thirst is a reliable indicator",
      "Clear urine is always the goal",
      "Sports drinks needed for all exercise",
      "You can't drink too much water"
    ]
  },
  {
    id: "creatine-supplementation",
    topic: "Creatine: The Most Researched Supplement",
    category: "supplements",
    content: "Creatine monohydrate is the most studied and effective legal supplement for improving strength and muscle mass.",
    keyPoints: [
      "Dosage: 3-5g daily (no loading needed)",
      "Timing doesn't matter - consistency does",
      "Increases phosphocreatine stores by 10-40%",
      "Safe for long-term use",
      "May improve cognitive function"
    ],
    scientificEvidence: "Meta-analyses show 5-15% improvements in strength and work capacity (Kreider et al., 2017)",
    practicalTips: [
      "Use creatine monohydrate (most researched)",
      "Mix with warm liquid for better dissolution",
      "Take with meals to reduce stomach upset",
      "Expect 1-2kg weight gain from water"
    ],
    commonMisconceptions: [
      "Creatine is a steroid",
      "It damages kidneys",
      "You need to cycle off",
      "Loading phase is necessary"
    ]
  }
];

// Workout Principles Database
export const workoutPrinciples: WorkoutPrinciple[] = [
  {
    id: "progressive-overload",
    name: "Progressive Overload",
    category: "progression",
    description: "The fundamental principle of strength and muscle development - gradually increasing demands on the musculoskeletal system.",
    application: [
      "Increase weight by 2.5-5% when completing all sets/reps",
      "Add 1-2 reps per set before increasing weight",
      "Increase total volume (sets x reps x weight)",
      "Decrease rest periods for metabolic stress",
      "Improve technique and range of motion",
      "Increase time under tension"
    ],
    examples: [
      "Week 1: 3x8 @ 100lbs = 2,400lbs volume",
      "Week 2: 3x9 @ 100lbs = 2,700lbs volume",
      "Week 3: 3x8 @ 105lbs = 2,520lbs volume",
      "Week 4: 3x10 @ 105lbs = 3,150lbs volume"
    ]
  },
  {
    id: "recovery-adaptation",
    name: "Recovery and Adaptation",
    category: "recovery",
    description: "Muscles grow during rest, not during training. Optimal recovery is essential for progress.",
    application: [
      "Sleep 7-9 hours per night",
      "Take 1-2 full rest days per week",
      "Deload every 4-6 weeks",
      "Manage life stress",
      "Proper nutrition timing",
      "Active recovery on rest days"
    ],
    examples: [
      "48-72 hours between training same muscle group",
      "Deload week: 50-60% normal volume",
      "Active recovery: light cardio, yoga, swimming",
      "Sleep hygiene: consistent schedule, cool room, no screens"
    ]
  },
  {
    id: "specificity",
    name: "Specificity (SAID Principle)",
    category: "programming",
    description: "Specific Adaptation to Imposed Demands - the body adapts specifically to the type of demand placed on it.",
    application: [
      "Train movements similar to your sport",
      "Use rep ranges specific to goals",
      "Practice at competition intensity",
      "Mimic competition conditions",
      "Progressive skill development"
    ],
    examples: [
      "Powerlifting: Heavy singles, doubles, triples",
      "Bodybuilding: 8-12 reps, multiple angles",
      "Endurance: High volume, lower intensity",
      "Sports: Movement patterns that transfer"
    ]
  },
  {
    id: "periodization",
    name: "Periodization",
    category: "programming",
    description: "Systematic planning of athletic training to optimize performance and prevent overtraining.",
    application: [
      "Vary intensity and volume over time",
      "Plan peaks for competition",
      "Include recovery phases",
      "Progress from general to specific",
      "Monitor fatigue and adaptation"
    ],
    examples: [
      "Linear: Gradual increase in intensity",
      "Undulating: Daily/weekly variation",
      "Block: Focus on one quality at a time",
      "Conjugate: Multiple qualities trained together"
    ]
  }
];

// Function to get all knowledge items for initial embedding
export function getAllKnowledgeItems() {
  const items = [];
  
  // Add exercises
  for (const exercise of exerciseDatabase) {
    items.push({
      id: exercise.id,
      type: 'exercise',
      content: `${exercise.name}: ${exercise.description}. Proper form: ${exercise.properForm.join('. ')}. Benefits: ${exercise.benefits.join('. ')}`,
      metadata: exercise
    });
  }
  
  // Add nutrition knowledge
  for (const nutrition of nutritionDatabase) {
    items.push({
      id: nutrition.id,
      type: 'nutrition',
      content: `${nutrition.topic}: ${nutrition.content}. Key points: ${nutrition.keyPoints.join('. ')}. Tips: ${nutrition.practicalTips.join('. ')}`,
      metadata: nutrition
    });
  }
  
  // Add workout principles
  for (const principle of workoutPrinciples) {
    items.push({
      id: principle.id,
      type: 'principle',
      content: `${principle.name}: ${principle.description}. Application: ${principle.application.join('. ')}`,
      metadata: principle
    });
  }
  
  return items;
}