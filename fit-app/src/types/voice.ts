import { WorkoutContext } from './workout';

export interface VoiceConfig {
  // Speech Recognition (Input)
  recognition: {
    engine: 'browser' | 'whisper' | 'azure';
    continuous: boolean;
    interimResults: boolean;
    language: string;
    noiseReduction: boolean;
    confidenceThreshold: number;
  };
  
  // Speech Synthesis (Output)
  synthesis: {
    voice: 'neural' | 'standard';
    rate: number;
    pitch: number;
    volume: number;
    ssmlSupport: boolean;
    preferredVoice?: string;
  };
  
  // Voice Commands
  commands: VoiceCommand[];
  wakeWord?: string; // "Hey Coach"
  timeoutDuration: number; // ms
  maxRetries: number;
}

export interface VoiceCommand {
  id: string;
  patterns: string[];
  action: VoiceAction;
  parameters?: Record<string, any>;
  confidence: number;
  context?: VoiceCommandContext[];
  aliases?: string[];
  description: string;
  examples: string[];
}

export interface VoiceCommandContext {
  type: 'workout_active' | 'exercise_selected' | 'rest_period' | 'session_ended';
  required?: boolean;
}

export interface VoiceCommandResult {
  action: VoiceAction;
  parameters: Record<string, any>;
  confidence: number;
  transcript: string;
  timestamp: Date;
  success: boolean;
  error?: string;
  originalTranscript?: string;
  processedText?: string;
  response?: string;
}

export interface VoiceInput {
  transcript: string;
  confidence: number;
  isFinal: boolean;
  timestamp: Date;
  context?: WorkoutContext;
}

export interface SpeechOptions {
  priority: SpeechPriority;
  interrupt: boolean;
  ssml?: boolean;
  voice?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
}

export interface VoiceResponse {
  text: string;
  ssml?: string;
  emotion?: VoiceEmotion;
  priority: SpeechPriority;
  context?: any;
}

export interface VoiceState {
  mode: VoiceMode;
  isListening: boolean;
  isSpeaking: boolean;
  isProcessing: boolean;
  currentTranscript: string;
  lastTranscript?: string;
  confidence: number;
  error?: VoiceError;
  lastActivity: Date;
  sessionActive: boolean;
}

export interface VoiceSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  commands: VoiceCommandResult[];
  totalCommands: number;
  successfulCommands: number;
  averageConfidence: number;
  context: WorkoutContext;
}

export interface VoiceAnalytics {
  totalSessions: number;
  totalCommands: number;
  successRate: number;
  averageConfidence: number;
  mostUsedCommands: VoiceCommandUsage[];
  errorPatterns: VoiceErrorPattern[];
  improvementSuggestions: string[];
}

export interface VoiceCommandUsage {
  action: VoiceAction;
  count: number;
  successRate: number;
  averageConfidence: number;
}

export interface VoiceErrorPattern {
  type: VoiceErrorType;
  count: number;
  contexts: string[];
  suggestions: string[];
}

export interface VoiceError {
  type: VoiceErrorType;
  message: string;
  timestamp: Date;
  context?: any;
  recovery?: VoiceRecovery;
  recoverable?: boolean;
}

export interface VoiceRecovery {
  strategy: RecoveryStrategy;
  message: string;
  action?: () => void;
}

// Voice Recognition Interfaces
export interface SpeechRecognitionConfig {
  continuous: boolean;
  interimResults: boolean;
  language: string;
  maxAlternatives: number;
  serviceURI?: string;
}

export interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
  alternatives: SpeechAlternative[];
}

export interface SpeechAlternative {
  transcript: string;
  confidence: number;
}

// Speech Synthesis Interfaces
export interface SpeechSynthesisConfig {
  voice?: SpeechSynthesisVoice;
  volume: number;
  rate: number;
  pitch: number;
  lang: string;
}

export interface VoiceTraining {
  userId: string;
  personalizedCommands: PersonalizedCommand[];
  adaptedPatterns: string[];
  confidenceAdjustments: Record<string, number>;
  lastTraining: Date;
}

export interface PersonalizedCommand {
  originalPattern: string;
  userPattern: string;
  frequency: number;
  confidence: number;
}

// Enums and Types
export type VoiceAction = 
  // Workout Logging
  | 'LOG_EXERCISE'
  | 'ADD_SET'
  | 'COMPLETE_SET'
  | 'SKIP_EXERCISE'
  | 'END_WORKOUT'
  | 'START_WORKOUT'
  | 'PAUSE_WORKOUT'
  | 'RESUME_WORKOUT'
  
  // Progress Queries
  | 'GET_PROGRESS'
  | 'GET_PERSONAL_RECORD'
  | 'GET_WORKOUT_HISTORY'
  | 'GET_EXERCISE_STATS'
  
  // AI Coaching
  | 'AI_COACHING'
  | 'FORM_ANALYSIS'
  | 'NUTRITION_ADVICE'
  | 'MOTIVATION'
  | 'WORKOUT_SUGGESTION'
  | 'REST_GUIDANCE'
  | 'SESSION_CONTROL'
  | 'TIMER_START'
  | 'TIMER_STOP'
  | 'TIMER_RESET'
  | 'NEXT_EXERCISE'
  | 'PREVIOUS_EXERCISE'
  | 'NAVIGATE'
  | 'SHOW_STATS'
  | 'SHOW_HISTORY'
  | 'SHOW_SETTINGS'
  | 'CHANGE_SETTINGS'
  | 'ADJUST_VOLUME'
  | 'CHANGE_VOICE'
  | 'TOGGLE_COACHING'
  | 'CLARIFY'
  | 'REPEAT'
  | 'CANCEL'
  | 'HELP'
  | 'NUTRITION_QUERY'
  | 'MOTIVATION_REQUEST'
  | 'START_REST_TIMER'
  | 'EXERCISE_INFO'
  | 'unknown';

export type VoiceMode = 'listening' | 'speaking' | 'processing' | 'idle' | 'error';

export type SpeechPriority = 'high' | 'medium' | 'low';

export type VoiceEmotion = 
  | 'encouraging' | 'motivational' | 'calm' | 'excited' | 'focused' | 'supportive';

export type VoiceErrorType = 
  | 'recognition_failed'
  | 'low_confidence'
  | 'command_not_found'
  | 'context_invalid'
  | 'synthesis_failed'
  | 'permission_denied'
  | 'network_error'
  | 'timeout'
  | 'noise_interference';

export type RecoveryStrategy = 
  | 'retry'
  | 'clarify'
  | 'fallback_text'
  | 'context_switch'
  | 'manual_override';

// Advanced Voice Features
export interface VoicePersonality {
  tone: 'professional' | 'friendly' | 'motivational' | 'casual';
  enthusiasm: number; // 1-10
  formality: number; // 1-10
  humor: boolean;
  encouragement: boolean;
  personalizedGreeting: string;
}

export interface VoiceAccessibility {
  visualIndicators: boolean;
  hapticFeedback: boolean;
  alternativeInputs: boolean;
  textFallback: boolean;
  slowSpeech: boolean;
  clearEnunciation: boolean;
}

export interface VoicePrivacy {
  localProcessing: boolean;
  dataRetention: number; // days
  anonymization: boolean;
  optOut: boolean;
  encryptTranscripts: boolean;
}

// Context-Aware Voice Features
export interface ContextualResponse {
  context: WorkoutContext;
  response: VoiceResponse;
  followUpSuggestions: string[];
  adaptiveParameters: Record<string, any>;
}

export interface VoiceWorkoutGuide {
  exerciseInstructions: ExerciseVoiceGuide[];
  restPeriodGuidance: RestPeriodGuide[];
  motivationalCues: MotivationalCue[];
  formReminders: FormReminder[];
}

export interface ExerciseVoiceGuide {
  exerciseId: string;
  setupInstructions: string[];
  executionCues: string[];
  breathingGuidance: string[];
  commonMistakes: string[];
  encouragement: string[];
}

export interface RestPeriodGuide {
  duration: number;
  encouragement: string[];
  preparation: string[];
  timeReminders: string[];
}

export interface MotivationalCue {
  context: 'start' | 'middle' | 'struggle' | 'finish' | 'achievement';
  messages: string[];
  timing: 'immediate' | 'delayed';
}

export interface FormReminder {
  exerciseCategory: string;
  checkpoints: string[];
  corrections: string[];
  frequency: 'every_set' | 'as_needed' | 'periodic';
}

export type { WorkoutContext } from './workout';