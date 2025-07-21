import type { VoiceCommand, VoiceConfig } from '../types/voice';

// Fitness voice commands with natural language patterns
export const FITNESS_VOICE_COMMANDS: VoiceCommand[] = [
  // Workout Session Control
  {
    patterns: [
      'start workout',
      'begin workout',
      'start my workout',
      'let\'s start',
      'begin session',
      'start training'
    ],
    action: 'START_WORKOUT',
    confidence: 0.95,
    context: ['workout_idle'],
    description: 'Start a new workout session',
    examples: ['start workout', 'begin my workout']
  },
  {
    patterns: [
      'end workout',
      'finish workout',
      'complete workout',
      'done with workout',
      'stop workout',
      'workout complete'
    ],
    action: 'END_WORKOUT',
    confidence: 0.95,
    context: ['workout_active'],
    description: 'End the current workout session',
    examples: ['end workout', 'workout complete']
  },

  // Exercise Logging - Multiple patterns for natural language
  {
    patterns: [
      'log (\\w+(?:\\s+\\w+)*) (\\d+) (?:reps?|repetitions?) (?:at|with|@) (\\d+(?:\\.\\d+)?) (?:pounds?|lbs?|kg|kilos?)',
      'I did (\\w+(?:\\s+\\w+)*) (\\d+) (?:times|reps?) (?:at|with) (\\d+(?:\\.\\d+)?) (?:pounds?|lbs?|kg|kilos?)',
      'add (\\w+(?:\\s+\\w+)*) (\\d+) (?:reps?|repetitions?) (\\d+(?:\\.\\d+)?) (?:pounds?|lbs?|kg|kilos?)',
      '(\\d+) (?:reps?|repetitions?) (?:of )?(?:at|with|@) (\\d+(?:\\.\\d+)?) (?:pounds?|lbs?|kg|kilos?)',
      'logged? (\\d+) (?:at|with|@) (\\d+(?:\\.\\d+)?)(?:\\s+(?:pounds?|lbs?|kg|kilos?))?'
    ],
    action: 'LOG_EXERCISE',
    confidence: 0.9,
    context: ['workout_active', 'set_logging'],
    description: 'Log exercise sets with reps and weight',
    examples: [
      'log bench press 8 reps at 185 pounds',
      'I did squats 10 times with 225 lbs',
      'add deadlift 5 reps 315 kg'
    ]
  },

  // Quick set logging (for current exercise)
  {
    patterns: [
      '(\\d+) (?:reps?|repetitions?)',
      'did (\\d+)',
      'completed (\\d+)',
      '(\\d+) done',
      'finished (\\d+)'
    ],
    action: 'LOG_EXERCISE',
    confidence: 0.85,
    context: ['workout_active', 'set_logging'],
    description: 'Log reps for current exercise with last used weight',
    examples: ['8 reps', 'did 12', 'completed 10']
  },

  // Rest Timer Commands
  {
    patterns: [
      'rest (?:for )?(\\d+) (?:seconds?|secs?)',
      'take (\\d+) (?:seconds?|secs?) (?:rest|break)',
      'set (?:rest )?timer (?:for )?(\\d+) (?:seconds?|secs?)',
      'break (?:for )?(\\d+) (?:seconds?|secs?)'
    ],
    action: 'REST_TIMER',
    confidence: 0.9,
    context: ['workout_active'],
    description: 'Start a rest timer for specified seconds',
    examples: ['rest for 90 seconds', 'take 60 secs break']
  },
  {
    patterns: [
      'rest (?:for )?(\\d+) (?:minutes?|mins?)',
      'take (\\d+) (?:minutes?|mins?) (?:rest|break)',
      'set (?:rest )?timer (?:for )?(\\d+) (?:minutes?|mins?)',
      'break (?:for )?(\\d+) (?:minutes?|mins?)'
    ],
    action: 'REST_TIMER',
    confidence: 0.9,
    context: ['workout_active'],
    description: 'Start a rest timer for specified minutes',
    examples: ['rest for 2 minutes', 'take 1 min break']
  },

  // Exercise Navigation
  {
    patterns: [
      'next exercise',
      'move to next',
      'skip to next',
      'next one',
      'continue',
      'move on'
    ],
    action: 'NEXT_EXERCISE',
    confidence: 0.95,
    context: ['workout_active'],
    description: 'Move to the next exercise in the workout',
    examples: ['next exercise', 'move to next']
  },
  {
    patterns: [
      'previous exercise',
      'go back',
      'last exercise',
      'back one',
      'undo'
    ],
    action: 'PREVIOUS_EXERCISE',
    confidence: 0.9,
    context: ['workout_active'],
    description: 'Go back to the previous exercise',
    examples: ['previous exercise', 'go back']
  },

  // Progress and Personal Records
  {
    patterns: [
      'what(?:\'s| is) my (\\w+(?:\\s+\\w+)*) (?:personal )?record',
      'show (?:my )?(\\w+(?:\\s+\\w+)*) (?:PR|personal record|max)',
      'how much can I (\\w+(?:\\s+\\w+)*)',
      '(\\w+(?:\\s+\\w+)*) (?:PR|personal record|max)'
    ],
    action: 'GET_PROGRESS',
    confidence: 0.85,
    context: ['any'],
    description: 'Get personal record for an exercise',
    examples: ['what\'s my bench press record', 'show my squat PR']
  },

  // AI Coaching Queries
  {
    patterns: [
      'analyze my form (?:on |for )?(\\w+(?:\\s+\\w+)*)',
      'check my (\\w+(?:\\s+\\w+)*) form',
      'how(?:\'s| is) my (\\w+(?:\\s+\\w+)*) (?:form|technique)',
      'form (?:check|analysis) (?:for |on )?(\\w+(?:\\s+\\w+)*)'
    ],
    action: 'FORM_ANALYSIS',
    confidence: 0.8,
    context: ['any'],
    description: 'Get AI form analysis for an exercise',
    examples: ['analyze my form on deadlift', 'check my squat form']
  },
  {
    patterns: [
      'what should I eat (?:before|after) (?:my )?workout',
      'nutrition advice',
      'meal recommendations?',
      'what to eat',
      'pre workout (?:nutrition|meal)',
      'post workout (?:nutrition|meal)'
    ],
    action: 'NUTRITION_QUERY',
    confidence: 0.8,
    context: ['any'],
    description: 'Get nutrition advice from AI coach',
    examples: ['what should I eat before workout', 'nutrition advice']
  },
  {
    patterns: [
      'motivate me',
      'I need motivation',
      'encourage me',
      'pump me up',
      'give me motivation',
      'I don\'t (?:want to|feel like) (?:working out|training)'
    ],
    action: 'MOTIVATION_REQUEST',
    confidence: 0.9,
    context: ['any'],
    description: 'Get motivational message from AI coach',
    examples: ['motivate me', 'I need motivation']
  },

  // Exercise Information
  {
    patterns: [
      'what (?:muscles |muscle groups )?does (\\w+(?:\\s+\\w+)*) work',
      'how (?:do I |to )?do (\\w+(?:\\s+\\w+)*)',
      'explain (\\w+(?:\\s+\\w+)*)',
      'teach me (\\w+(?:\\s+\\w+)*)',
      '(\\w+(?:\\s+\\w+)*) (?:instructions?|tutorial)',
      'how to (?:do |perform )?(\\w+(?:\\s+\\w+)*)'
    ],
    action: 'EXERCISE_INFO',
    confidence: 0.85,
    context: ['any'],
    description: 'Get information about an exercise',
    examples: ['what muscles does deadlift work', 'how do I do squats']
  },

  // Weight Calculations
  {
    patterns: [
      'what(?:\'s| is) (\\d+)% of my (\\w+(?:\\s+\\w+)*) (?:max|PR)',
      'calculate (\\d+)% of (\\d+(?:\\.\\d+)?) (?:pounds?|lbs?|kg|kilos?)',
      '(\\d+) percent of my (\\w+(?:\\s+\\w+)*) (?:max|PR)',
      'what(?:\'s| is) (\\d+)% of (\\d+(?:\\.\\d+)?)'
    ],
    action: 'WEIGHT_CALCULATION',
    confidence: 0.9,
    context: ['any'],
    description: 'Calculate percentage of max weight',
    examples: ['what\'s 80% of my bench max', 'calculate 90% of 225 pounds']
  },

  // General Help and Control
  {
    patterns: [
      'help',
      'what can (?:I say|you do)',
      'commands',
      'voice commands',
      'how do I',
      'assistance'
    ],
    action: 'HELP',
    confidence: 0.95,
    context: ['any'],
    description: 'Show available voice commands',
    examples: ['help', 'what can I say']
  },
  {
    patterns: [
      'cancel',
      'stop',
      'never mind',
      'forget it',
      'abort'
    ],
    action: 'CANCEL_COMMAND',
    confidence: 0.95,
    context: ['any'],
    description: 'Cancel current operation',
    examples: ['cancel', 'never mind']
  }
];

// Wake words for voice activation
export const WAKE_WORDS = [
  'hey coach',
  'coach',
  'fitness coach',
  'trainer'
];

// Exercise name aliases for better recognition
export const EXERCISE_ALIASES: Record<string, string[]> = {
  'bench-press': ['bench press', 'bench', 'bp', 'chest press'],
  'squat': ['squats', 'back squat', 'barbell squat'],
  'deadlift': ['deadlifts', 'dl', 'dead lift'],
  'overhead-press': ['overhead press', 'ohp', 'military press', 'shoulder press'],
  'pull-up': ['pull ups', 'pullups', 'chin ups', 'chinups'],
  'push-up': ['push ups', 'pushups', 'press ups'],
  'barbell-row': ['barbell row', 'bent over row', 'rows'],
  'dumbbell-curl': ['bicep curl', 'bicep curls', 'curls', 'db curl'],
  'tricep-dip': ['tricep dips', 'dips', 'triceps dips'],
  'lat-pulldown': ['lat pulldown', 'lat pulls', 'pulldowns']
};

// Weight unit variations
export const WEIGHT_UNITS = {
  pounds: ['pounds', 'pound', 'lbs', 'lb'],
  kilograms: ['kilograms', 'kilogram', 'kg', 'kgs', 'kilos', 'kilo']
};

// Default voice configuration
export const VOICE_COMMAND_CONFIG: Partial<VoiceConfig> = {
  recognition: {
    engine: 'browser',
    continuous: true,
    interimResults: true,
    language: 'en-US',
    noiseReduction: true,
    maxAlternatives: 3,
    timeout: 10000
  },
  synthesis: {
    voice: 'neural',
    rate: 1.0,
    pitch: 1.0,
    volume: 0.8,
    ssmlSupport: false
  },
  commands: FITNESS_VOICE_COMMANDS,
  wakeWord: 'hey coach',
  wakeWordEnabled: false,
  confidenceThreshold: 0.7
};

// Command context mappings
export const CONTEXT_COMMANDS: Record<string, string[]> = {
  workout_idle: ['START_WORKOUT', 'EXERCISE_INFO', 'GET_PROGRESS', 'HELP'],
  workout_active: ['LOG_EXERCISE', 'REST_TIMER', 'NEXT_EXERCISE', 'END_WORKOUT'],
  set_logging: ['LOG_EXERCISE', 'REST_TIMER'],
  rest_period: ['NEXT_EXERCISE', 'END_WORKOUT'],
  any: ['HELP', 'CANCEL_COMMAND', 'AI_COACHING', 'NUTRITION_QUERY', 'MOTIVATION_REQUEST']
};

// Response templates for voice feedback
export const VOICE_RESPONSE_TEMPLATES = {
  workout_started: [
    'Great! Your workout has started. What exercise would you like to begin with?',
    'Workout session started! Let\'s get moving. What\'s first?',
    'Ready to train! Tell me your first exercise.'
  ],
  set_logged: [
    'Nice work! Set logged: {reps} reps at {weight}. Rest up or continue?',
    'Great set! {reps} reps at {weight} recorded. Ready for the next one?',
    'Excellent! Logged {reps} reps at {weight}. How are you feeling?'
  ],
  personal_record: [
    'Incredible! That\'s a new personal record! {exercise} - {weight}!',
    'Amazing! You just hit a new PR on {exercise}! Congratulations!',
    'Outstanding! New personal best: {exercise} at {weight}!'
  ],
  rest_started: [
    'Rest timer started for {duration}. Take your time and recover.',
    'Timer set for {duration}. Use this time to breathe and prepare.',
    'Resting for {duration}. Stay hydrated and get ready for the next set.'
  ],
  workout_ended: [
    'Fantastic workout! You completed {duration} with {totalSets} sets.',
    'Great job! Workout finished in {duration}. Well done!',
    'Excellent session! {duration} of solid training completed.'
  ]
};