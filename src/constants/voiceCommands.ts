import { VoiceCommand } from '../types';

export const FITNESS_VOICE_COMMANDS: VoiceCommand[] = [
  // Workout Logging Commands
  {
    id: 'log-exercise-weight-reps',
    patterns: [
      'log * for * reps at * pounds',
      'log * for * reps at * lbs',
      'I did * for * reps at * pounds',
      'I did * for * reps at * lbs',
      'add * for * reps at * pounds',
      'add * for * reps at * lbs',
      'record * for * reps at * pounds',
      'record * for * reps at * lbs',
      '* for * reps at * pounds',
      '* for * reps at * lbs'
    ],
    action: 'LOG_EXERCISE',
    confidence: 0.95,
    context: [{ type: 'workout_active' }],
    description: 'Log an exercise with weight and reps',
    examples: [
      'log bench press for 8 reps at 185 pounds',
      'I did squats for 10 reps at 225 lbs'
    ]
  },
  {
    id: 'log-exercise-weight-reps-kg',
    patterns: [
      'log * for * reps at * kilos',
      'log * for * reps at * kg',
      'I did * for * reps at * kilos',
      'I did * for * reps at * kg',
      'add * for * reps at * kilos',
      'add * for * reps at * kg',
      '* for * reps at * kilos',
      '* for * reps at * kg'
    ],
    action: 'LOG_EXERCISE',
    confidence: 0.95,
    context: [{ type: 'workout_active' }],
    description: 'Log an exercise with weight in kilograms and reps',
    examples: [
      'log bench press for 8 reps at 85 kg',
      'I did squats for 10 reps at 100 kilos'
    ]
  },
  {
    id: 'log-exercise-sets',
    patterns: [
      'add * sets of * at * pounds',
      'add * sets of * at * lbs',
      'add * sets of * at * kg',
      'add * sets of * at * kilos',
      'I did * sets of * at * pounds',
      'I did * sets of * at * lbs',
      'I did * sets of * at * kg',
      'I did * sets of * at * kilos',
      'log * sets of * at * pounds',
      'log * sets of * at * lbs',
      'log * sets of * at * kg',
      'log * sets of * at * kilos'
    ],
    action: 'LOG_EXERCISE',
    confidence: 0.9,
    context: [{ type: 'workout_active' }],
    description: 'Log multiple sets of an exercise',
    examples: [
      'add 3 sets of 10 at 185 pounds',
      'I did 4 sets of 8 at 90 kg'
    ]
  },
  {
    id: 'complete-set',
    patterns: [
      'done',
      'finished',
      'complete',
      'set done',
      'finished set',
      'completed that set',
      'that set is done',
      'finished that one'
    ],
    action: 'COMPLETE_SET',
    confidence: 0.85,
    context: [{ type: 'exercise_selected' }],
    description: 'Mark the current set as complete',
    examples: [
      'done',
      'finished set',
      'complete'
    ]
  },
  {
    id: 'add-weight-to-set',
    patterns: [
      'add * pounds',
      'add * lbs',
      'add * kg',
      'add * kilos',
      'increase by * pounds',
      'increase by * lbs',
      'increase by * kg',
      'increase by * kilos',
      'up * pounds',
      'up * lbs',
      'up * kg',
      'up * kilos'
    ],
    action: 'ADD_SET',
    confidence: 0.9,
    context: [{ type: 'exercise_selected' }],
    description: 'Add weight to the current exercise',
    examples: [
      'add 10 pounds',
      'increase by 5 kg',
      'up 15 lbs'
    ]
  },

  // Progress and Stats Queries
  {
    id: 'get-personal-record',
    patterns: [
      "what's my * personal record",
      "what's my * PR",
      "what's my * max",
      "what's my best *",
      "how much can I * max",
      "my * personal record",
      "my * PR",
      "my * max",
      "personal record for *",
      "PR for *",
      "max for *"
    ],
    action: 'GET_PERSONAL_RECORD',
    confidence: 0.9,
    description: 'Get personal record for an exercise',
    examples: [
      "what's my bench press personal record",
      "how much can I squat max",
      "my deadlift PR"
    ]
  },
  {
    id: 'show-progress',
    patterns: [
      'show me my * progress',
      'how am I doing with *',
      'my * progress',
      'progress on *',
      'how is my * improving',
      'show * progress',
      'display * progress'
    ],
    action: 'GET_PROGRESS',
    confidence: 0.85,
    description: 'Show progress for a specific exercise or muscle group',
    examples: [
      'show me my squat progress',
      'how am I doing with chest exercises',
      'my upper body progress'
    ]
  },
  {
    id: 'workout-history',
    patterns: [
      'show my workout history',
      'my workout history',
      'previous workouts',
      'past workouts',
      'workout log',
      'my workouts',
      'show workouts',
      'display workout history'
    ],
    action: 'GET_WORKOUT_HISTORY',
    confidence: 0.9,
    description: 'Display workout history',
    examples: [
      'show my workout history',
      'my previous workouts',
      'workout log'
    ]
  },

  // AI Coaching Commands
  {
    id: 'form-analysis',
    patterns: [
      'analyze my form on *',
      'check my form for *',
      'how is my * form',
      'form check for *',
      'analyze * form',
      'check * form',
      'is my * form good',
      'help with * form'
    ],
    action: 'FORM_ANALYSIS',
    confidence: 0.85,
    description: 'Get AI analysis of exercise form',
    examples: [
      'analyze my form on bench press',
      'check my squat form',
      'how is my deadlift form'
    ]
  },
  {
    id: 'nutrition-advice',
    patterns: [
      'what should I eat after *',
      'what should I eat before *',
      'nutrition for *',
      'what to eat for *',
      'meal advice for *',
      'food for *',
      'pre workout nutrition',
      'post workout nutrition',
      'nutrition advice'
    ],
    action: 'NUTRITION_ADVICE',
    confidence: 0.8,
    description: 'Get nutrition advice',
    examples: [
      'what should I eat after leg day',
      'pre workout nutrition',
      'what to eat for muscle gain'
    ]
  },
  {
    id: 'motivation',
    patterns: [
      'motivate me',
      'I need motivation',
      "I don't feel like working out",
      'encourage me',
      'pump me up',
      'give me motivation',
      'I need encouragement',
      'inspire me',
      'help me get motivated'
    ],
    action: 'MOTIVATION',
    confidence: 0.9,
    description: 'Get motivational encouragement',
    examples: [
      'motivate me',
      "I don't feel like working out",
      'I need encouragement'
    ]
  },
  {
    id: 'exercise-advice',
    patterns: [
      'how do I improve my *',
      'how to get better at *',
      'tips for *',
      'advice for *',
      'help me with *',
      'how to do * better',
      'improve * technique',
      'better * form'
    ],
    action: 'AI_COACHING',
    confidence: 0.85,
    description: 'Get coaching advice for exercises',
    examples: [
      'how do I improve my bench press',
      'tips for better squats',
      'help me with deadlifts'
    ]
  },

  // Session Control Commands
  {
    id: 'start-workout',
    patterns: [
      'start workout',
      'begin workout',
      'start session',
      'begin session',
      'start training',
      'let\'s workout',
      'time to workout',
      'begin training'
    ],
    action: 'START_WORKOUT',
    confidence: 0.95,
    description: 'Start a new workout session',
    examples: [
      'start workout',
      'begin session',
      'let\'s workout'
    ]
  },
  {
    id: 'start-specific-workout',
    patterns: [
      'start * workout',
      'begin * workout',
      'start * session',
      'begin * session',
      'start * training',
      'let\'s do * workout',
      'time for * workout'
    ],
    action: 'START_WORKOUT',
    confidence: 0.9,
    description: 'Start a specific type of workout',
    examples: [
      'start chest workout',
      'begin leg session',
      'let\'s do push workout'
    ]
  },
  {
    id: 'end-workout',
    patterns: [
      'end workout',
      'finish workout',
      'complete workout',
      'end session',
      'finish session',
      'done with workout',
      'workout complete',
      'I\'m done'
    ],
    action: 'END_WORKOUT',
    confidence: 0.9,
    context: [{ type: 'workout_active' }],
    description: 'End the current workout session',
    examples: [
      'end workout',
      'finish session',
      'I\'m done'
    ]
  },
  {
    id: 'pause-workout',
    patterns: [
      'pause workout',
      'pause session',
      'take a break',
      'break time',
      'pause training',
      'hold on',
      'wait',
      'pause'
    ],
    action: 'PAUSE_WORKOUT',
    confidence: 0.85,
    context: [{ type: 'workout_active' }],
    description: 'Pause the current workout',
    examples: [
      'pause workout',
      'take a break',
      'hold on'
    ]
  },
  {
    id: 'resume-workout',
    patterns: [
      'resume workout',
      'continue workout',
      'resume session',
      'continue session',
      'back to workout',
      'let\'s continue',
      'resume'
    ],
    action: 'RESUME_WORKOUT',
    confidence: 0.9,
    description: 'Resume a paused workout',
    examples: [
      'resume workout',
      'continue session',
      'let\'s continue'
    ]
  },
  {
    id: 'next-exercise',
    patterns: [
      'next exercise',
      'move to next',
      'next',
      'skip to next',
      'continue to next',
      'what\'s next',
      'next one'
    ],
    action: 'NEXT_EXERCISE',
    confidence: 0.9,
    context: [{ type: 'workout_active' }],
    description: 'Move to the next exercise',
    examples: [
      'next exercise',
      'what\'s next',
      'move to next'
    ]
  },
  {
    id: 'skip-exercise',
    patterns: [
      'skip exercise',
      'skip this',
      'skip *',
      'I can\'t do this',
      'move past this',
      'skip this exercise'
    ],
    action: 'SKIP_EXERCISE',
    confidence: 0.85,
    context: [{ type: 'exercise_selected' }],
    description: 'Skip the current exercise',
    examples: [
      'skip exercise',
      'skip this',
      'I can\'t do this'
    ]
  },

  // Timer Commands
  {
    id: 'start-timer',
    patterns: [
      'start timer',
      'start rest timer',
      'begin timer',
      'timer start',
      'start rest',
      'rest timer'
    ],
    action: 'TIMER_START',
    confidence: 0.9,
    description: 'Start the rest timer',
    examples: [
      'start timer',
      'start rest timer',
      'begin timer'
    ]
  },
  {
    id: 'stop-timer',
    patterns: [
      'stop timer',
      'end timer',
      'timer stop',
      'cancel timer',
      'turn off timer'
    ],
    action: 'TIMER_STOP',
    confidence: 0.9,
    description: 'Stop the rest timer',
    examples: [
      'stop timer',
      'end timer',
      'cancel timer'
    ]
  },
  {
    id: 'rest-guidance',
    patterns: [
      'how long should I rest',
      'how much rest',
      'rest time',
      'how long to rest',
      'recommended rest',
      'rest period'
    ],
    action: 'REST_GUIDANCE',
    confidence: 0.85,
    description: 'Get rest time recommendations',
    examples: [
      'how long should I rest',
      'how much rest',
      'recommended rest time'
    ]
  },

  // Navigation Commands
  {
    id: 'show-stats',
    patterns: [
      'show stats',
      'show statistics',
      'my stats',
      'display stats',
      'statistics',
      'show my stats'
    ],
    action: 'SHOW_STATS',
    confidence: 0.9,
    description: 'Display workout statistics',
    examples: [
      'show stats',
      'my statistics',
      'display stats'
    ]
  },
  {
    id: 'show-settings',
    patterns: [
      'show settings',
      'open settings',
      'settings',
      'preferences',
      'options',
      'configuration'
    ],
    action: 'SHOW_SETTINGS',
    confidence: 0.9,
    description: 'Open settings menu',
    examples: [
      'show settings',
      'open settings',
      'preferences'
    ]
  },

  // Weight and Exercise Queries
  {
    id: 'weight-calculation',
    patterns: [
      'what\'s * percent of my * max',
      'what\'s * % of my * max',
      'calculate * percent of *',
      'calculate * % of *',
      '* percent of * pounds',
      '* % of * pounds',
      '* percent of * kg',
      '* % of * kg'
    ],
    action: 'AI_COACHING',
    confidence: 0.85,
    description: 'Calculate percentage of max weight',
    examples: [
      'what\'s 80 percent of my bench max',
      'calculate 75% of 300 pounds',
      'what\'s 90% of my squat max'
    ]
  },
  {
    id: 'exercise-info',
    patterns: [
      'what muscles does * work',
      'what does * target',
      'muscles worked by *',
      'what is *',
      'how do you do *',
      'explain *',
      'tell me about *'
    ],
    action: 'AI_COACHING',
    confidence: 0.8,
    description: 'Get information about exercises',
    examples: [
      'what muscles does deadlift work',
      'what does bench press target',
      'how do you do squats'
    ]
  },

  // Error Handling and Help
  {
    id: 'help',
    patterns: [
      'help',
      'what can you do',
      'commands',
      'what can I say',
      'voice commands',
      'how to use',
      'instructions'
    ],
    action: 'HELP',
    confidence: 0.95,
    description: 'Get help with voice commands',
    examples: [
      'help',
      'what can you do',
      'voice commands'
    ]
  },
  {
    id: 'repeat',
    patterns: [
      'repeat',
      'say that again',
      'what did you say',
      'repeat that',
      'come again',
      'pardon'
    ],
    action: 'REPEAT',
    confidence: 0.9,
    description: 'Repeat the last response',
    examples: [
      'repeat',
      'say that again',
      'what did you say'
    ]
  },
  {
    id: 'cancel',
    patterns: [
      'cancel',
      'never mind',
      'stop',
      'forget it',
      'cancel that',
      'abort'
    ],
    action: 'CANCEL',
    confidence: 0.9,
    description: 'Cancel the current action',
    examples: [
      'cancel',
      'never mind',
      'stop'
    ]
  },
  {
    id: 'clarify',
    patterns: [
      'I don\'t understand',
      'what do you mean',
      'clarify',
      'explain that',
      'I\'m confused',
      'can you clarify'
    ],
    action: 'CLARIFY',
    confidence: 0.85,
    description: 'Ask for clarification',
    examples: [
      'I don\'t understand',
      'what do you mean',
      'can you clarify'
    ]
  }
];

// Wake word configuration
export const WAKE_WORDS = [
  'hey coach',
  'coach',
  'fitness coach',
  'trainer'
];

// Voice command aliases for better recognition
export const EXERCISE_ALIASES: Record<string, string[]> = {
  'bench press': ['bench', 'chest press', 'flat bench'],
  'squat': ['squats', 'back squat', 'barbell squat'],
  'deadlift': ['deadlifts', 'dead lift'],
  'overhead press': ['shoulder press', 'military press', 'ohp'],
  'barbell row': ['bent over row', 'barbell rows', 'bb row'],
  'pull up': ['pullup', 'pull ups', 'pullups', 'chin up', 'chinup'],
  'push up': ['pushup', 'push ups', 'pushups'],
  'dip': ['dips', 'tricep dips'],
  'lat pulldown': ['lat pull down', 'pulldown'],
  'leg press': ['legpress'],
  'leg curl': ['hamstring curl', 'lying leg curl'],
  'leg extension': ['quad extension'],
  'calf raise': ['calf raises', 'standing calf raise'],
  'bicep curl': ['bicep curls', 'dumbbell curl', 'barbell curl'],
  'tricep extension': ['tricep extensions', 'overhead extension'],
  'lateral raise': ['side raise', 'lateral raises'],
  'front raise': ['front raises'],
  'rear delt fly': ['reverse fly', 'rear fly'],
  'shrug': ['shrugs', 'shoulder shrug'],
  'plank': ['planks', 'front plank'],
  'crunch': ['crunches', 'sit up', 'sit ups']
};

// Common weight units and their alternatives
export const WEIGHT_UNITS: Record<string, string[]> = {
  'pounds': ['lbs', 'lb', 'pound'],
  'kilograms': ['kg', 'kgs', 'kilo', 'kilos', 'kilogram']
};

// Voice command processing configuration
export const VOICE_COMMAND_CONFIG = {
  confidenceThreshold: 0.7,
  maxRetries: 3,
  timeoutMs: 5000,
  contextSensitive: true,
  fuzzyMatching: true,
  learningEnabled: true
};