import type { WorkoutContext } from './workout';

// Voice configuration
export interface VoiceConfig {
  // Speech Recognition (Input)
  recognition: {
    engine: 'browser' | 'whisper' | 'azure';
    continuous: boolean;
    interimResults: boolean;
    language: string;
    noiseReduction: boolean;
    maxAlternatives: number;
    timeout: number; // milliseconds
  };
  
  // Speech Synthesis (Output)
  synthesis: {
    voice: 'neural' | 'standard';
    rate: number; // 0.1 to 10
    pitch: number; // 0 to 2
    volume: number; // 0 to 1
    ssmlSupport: boolean;
    voiceName?: string;
  };
  
  // Voice Commands
  commands: VoiceCommand[];
  wakeWord?: string; // "Hey Coach"
  wakeWordEnabled: boolean;
  confidenceThreshold: number; // 0 to 1
}

// Voice command structure
export interface VoiceCommand {
  patterns: string[]; // regex patterns or natural language templates
  action: VoiceAction;
  parameters?: VoiceParameter[];
  confidence: number; // minimum confidence level
  context?: VoiceContext[]; // when this command is valid
  description: string;
  examples: string[];
  requiresConfirmation?: boolean;
  aliases?: string[];
}

export type VoiceAction = 
  | 'LOG_EXERCISE'
  | 'START_WORKOUT'
  | 'END_WORKOUT'
  | 'ADD_EXERCISE'
  | 'REST_TIMER'
  | 'NEXT_EXERCISE'
  | 'PREVIOUS_EXERCISE'
  | 'REPEAT_LAST'
  | 'GET_PROGRESS'
  | 'AI_COACHING'
  | 'SESSION_CONTROL'
  | 'WEIGHT_CALCULATION'
  | 'EXERCISE_INFO'
  | 'NUTRITION_QUERY'
  | 'MOTIVATION_REQUEST'
  | 'FORM_ANALYSIS'
  | 'WORKOUT_PLANNING'
  | 'PERSONAL_RECORD'
  | 'SET_PREFERENCE'
  | 'CANCEL_COMMAND'
  | 'HELP';

export type VoiceContext = 
  | 'workout_active'
  | 'workout_idle'
  | 'exercise_selection'
  | 'set_logging'
  | 'rest_period'
  | 'workout_complete'
  | 'ai_conversation'
  | 'any';

export interface VoiceParameter {
  name: string;
  type: 'string' | 'number' | 'exercise' | 'weight' | 'reps' | 'time' | 'boolean';
  required: boolean;
  validation?: RegExp | ((value: any) => boolean);
  defaultValue?: any;
  aliases?: string[];
}

// Voice command processing
export interface VoiceCommandResult {
  success: boolean;
  action: VoiceAction;
  parameters: Record<string, any>;
  confidence: number;
  originalTranscript: string;
  processedText: string;
  timestamp: Date;
  context?: WorkoutContext;
  errors?: string[];
  suggestions?: string[];
}

export interface VoiceInput {
  transcript: string;
  confidence: number;
  isFinal: boolean;
  timestamp: Date;
  alternatives?: Array<{
    transcript: string;
    confidence: number;
  }>;
}

// Voice state management
export type VoiceMode = 'idle' | 'listening' | 'processing' | 'speaking' | 'error';

export interface VoiceState {
  mode: VoiceMode;
  isInitialized: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  currentTranscript?: string;
  confidence?: number;
  lastCommand?: VoiceCommandResult;
  error?: VoiceError;
  context?: WorkoutContext;
  wakeWordDetected?: boolean;
  continuousMode: boolean;
}

// Speech synthesis options
export interface SpeechOptions {
  voice?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
  emotion?: VoiceEmotion;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  interrupt?: boolean; // interrupt current speech
  ssml?: boolean; // use SSML markup
  language?: string;
}

export type VoiceEmotion = 
  | 'neutral'
  | 'encouraging'
  | 'celebratory'
  | 'motivational'
  | 'concerned'
  | 'excited'
  | 'calm'
  | 'focused';

// Voice response structure
export interface VoiceResponse {
  text: string;
  ssml?: string; // SSML markup version
  emotion: VoiceEmotion;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  context?: WorkoutContext;
  followUpAction?: VoiceAction;
  expectsResponse?: boolean;
  timeout?: number; // milliseconds to wait for response
}

// Error handling
export interface VoiceError {
  type: VoiceErrorType;
  message: string;
  code?: string;
  recoverable: boolean;
  suggestedAction?: string;
  timestamp: Date;
}

export type VoiceErrorType = 
  | 'recognition_failed'
  | 'synthesis_failed'
  | 'no_microphone'
  | 'permission_denied'
  | 'network_error'
  | 'unsupported_browser'
  | 'command_not_recognized'
  | 'low_confidence'
  | 'context_mismatch'
  | 'parameter_validation_failed'
  | 'timeout'
  | 'service_unavailable';

// Voice analytics and training
export interface VoiceUsageMetrics {
  totalCommands: number;
  successfulCommands: number;
  failedCommands: number;
  averageConfidence: number;
  mostUsedCommands: Array<{
    action: VoiceAction;
    count: number;
    averageConfidence: number;
  }>;
  errorFrequency: Array<{
    type: VoiceErrorType;
    count: number;
  }>;
  improvementSuggestions: string[];
}

// Voice personalization
export interface VoicePersonalization {
  preferredVoice: string;
  speechRate: number;
  customCommands: VoiceCommand[];
  trainingData: Array<{
    spoken: string;
    intended: VoiceAction;
    parameters: Record<string, any>;
    timestamp: Date;
  }>;
  contextPreferences: {
    [key in VoiceContext]?: {
      enabledCommands: VoiceAction[];
      customResponses: Record<string, string>;
    };
  };
}

// Event system
export type VoiceEventType = 
  | 'listening_started'
  | 'listening_stopped'
  | 'speech_detected'
  | 'command_recognized'
  | 'command_executed'
  | 'synthesis_started'
  | 'synthesis_ended'
  | 'error_occurred'
  | 'wake_word_detected'
  | 'context_changed';

export interface VoiceEvent {
  type: VoiceEventType;
  data?: any;
  timestamp: Date;
  context?: WorkoutContext;
}

export type VoiceEventListener = (event: VoiceEvent) => void;