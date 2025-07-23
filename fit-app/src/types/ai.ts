import type { Exercise, WorkoutContext, ProgressMetrics, PersonalRecord } from './workout';

// Re-export commonly used types
export type { WorkoutContext, Exercise } from './workout';

// AI Coach configuration
export interface AICoachConfig {
  provider: 'openai' | 'anthropic' | 'local' | 'hybrid';
  model: string;
  apiKey?: string; // Should be handled by backend proxy
  baseUrl?: string;
  maxTokens: number;
  temperature: number;
  enableLocalFallback: boolean;
  enableCaching: boolean;
  enableAnalytics: boolean;
  personalityProfile: AIPersonality;
  expertise: AIExpertiseLevel;
  responseStyle: AIResponseStyle;
}

export type AIPersonality = 
  | 'supportive' // Encouraging and understanding
  | 'motivational' // High energy and pushing
  | 'analytical' // Data-driven and precise
  | 'friendly' // Casual and approachable
  | 'professional' // Formal and expert-like
  | 'custom';

export type AIExpertiseLevel = 
  | 'beginner_friendly' // Simple explanations
  | 'intermediate' // Balanced detail
  | 'advanced' // Technical and comprehensive
  | 'adaptive'; // Adjusts to user level

export type AIResponseStyle = 
  | 'concise' // Brief and to the point
  | 'detailed' // Comprehensive explanations
  | 'conversational' // Natural dialogue
  | 'structured' // Organized and formatted
  | 'adaptive'; // Adjusts to context

// Request types
export type AIRequestType = 
  | 'general-advice'
  | 'form-analysis'
  | 'nutrition-advice'
  | 'nutrition'
  | 'motivation'
  | 'exercise-explanation'
  | 'workout-planning'
  | 'workout_planning'
  | 'workout_plan'
  | 'progress-analysis'
  | 'injury-prevention'
  | 'weight-calculation'
  | 'rest-guidance'
  | 'equipment-substitute'
  | 'recovery-advice'
  | 'general';

export interface AIRequest {
  type: AIRequestType;
  query: string;
  context: WorkoutContext;
  userProfile?: UserProfile;
  conversationHistory?: AIMessage[];
  metadata?: Record<string, any>;
  priority: 'low' | 'normal' | 'high';
  timestamp: Date;
}

export interface AIResponse {
  content: string;
  type: AIRequestType;
  confidence: number; // 0 to 1
  sources?: string[]; // References or citations
  followUpQuestions?: string[];
  actionItems?: string[];
  relatedTopics?: string[];
  metadata?: {
    tokensUsed?: number;
    processingTime?: number;
    model?: string;
    cached?: boolean;
    provider?: string;
    priority?: number;
    retryCount?: number;
    teamResponse?: boolean;
    fallbackReason?: string;
  };
  timestamp: Date;
  isComplete: boolean;
  needsClarification?: boolean;
  safetyFlags?: string[];
}

// Specialized AI responses
export interface FormAnalysis {
  exercise: Exercise;
  overallScore: number; // 1-10
  strengths: string[];
  areasForImprovement: string[];
  specificTips: {
    setup: string[];
    execution: string[];
    breathing: string[];
    common_mistakes: string[];
  };
  recommendedProgression: string;
  alternativeExercises?: Exercise[];
  videoTimestamps?: {
    description: string;
    timeInSeconds: number;
  }[];
  safetyWarnings?: string[];
}

export interface NutritionAdvice {
  mealType: 'pre-workout' | 'post-workout' | 'general' | 'recovery';
  recommendations: {
    macros: {
      protein: { grams: number; percentage: number };
      carbs: { grams: number; percentage: number };
      fats: { grams: number; percentage: number };
    };
    hydration: {
      waterIntake: number; // liters
      electrolyteNeeds: boolean;
    };
    timing: string;
    specificFoods: string[];
    supplementSuggestions?: string[];
  };
  reasoning: string;
  personalizations: string[];
  restrictions?: string[]; // dietary restrictions considered
}

export interface MotivationalMessage {
  message: string;
  tone: 'encouraging' | 'challenging' | 'celebratory' | 'supportive';
  context: string; // why this message was generated
  personalizations: string[]; // user-specific elements
  actionCall?: string; // specific action to take
  affirmations?: string[];
}

// WorkoutPlan interface moved to workout.ts to avoid duplicate exports

export interface Progression {
  exercise: Exercise;
  currentStats: {
    weight: number;
    reps: number;
    sets: number;
    volume: number;
  };
  recommendations: {
    nextSession: {
      weight?: number;
      reps?: number;
      sets?: number;
      restTime?: number;
    };
    shortTerm: string[]; // 1-2 weeks
    longTerm: string[]; // 1-3 months
  };
  reasoning: string;
  alternatives?: {
    description: string;
    modification: string;
  }[];
  periodization?: {
    phase: string;
    duration: string;
    focus: string;
  };
}

// Conversation management
export interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  type?: AIRequestType;
  metadata?: Record<string, any>;
  reactions?: {
    helpful: boolean;
    accurate: boolean;
    followedAdvice: boolean;
  };
}

export interface ConversationContext {
  messages: AIMessage[];
  currentTopic?: AIRequestType;
  userGoals: string[];
  recentActivity: string[];
  personalContext: UserProfile;
  sessionLength: number; // minutes
}

// User profiling for AI personalization
export interface UserProfile {
  experience: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  goals: ('strength' | 'hypertrophy' | 'endurance' | 'weight_loss' | 'general_fitness')[];
  preferences: {
    workoutLength: number; // minutes
    workoutFrequency: number; // per week
    intensityPreference: 'low' | 'moderate' | 'high' | 'variable';
    equipmentAccess: string[];
    dietaryRestrictions: string[];
    injuryHistory: string[];
  };
  currentStats: {
    weight?: number;
    height?: number;
    bodyFat?: number;
    mainLifts?: PersonalRecord[];
  };
  progressMetrics: ProgressMetrics;
}

// Caching and performance
export interface AICache {
  query: string;
  response: AIResponse;
  context: string; // hashed context for cache invalidation
  timestamp: Date;
  accessCount: number;
  lastAccessed: Date;
  expiresAt: Date;
}

export interface AIAnalytics {
  totalQueries: number;
  queryTypes: Record<AIRequestType, number>;
  averageResponseTime: number;
  userSatisfaction: {
    helpful: number;
    accurate: number;
    actionable: number;
  };
  topQueries: {
    query: string;
    count: number;
    averageRating: number;
  }[];
  improvementAreas: string[];
}

// Safety and content filtering
export interface SafetyCheck {
  isHealthAdviceSafe: boolean;
  containsMedicalClaims: boolean;
  needsDisclaimer: boolean;
  flaggedContent: string[];
  confidence: number;
  recommendations: string[];
}

export interface ContentFilter {
  medicalAdvice: boolean;
  supplementRecommendations: boolean;
  extremeAdvice: boolean;
  personalData: boolean;
  appropriateForAge: boolean;
}

// Error handling
export interface AIError {
  type: 'rate_limit' | 'api_error' | 'content_filter' | 'context_too_long' | 'service_unavailable' | 'initialization_error' | 'request_error' | 'analysis_error' | 'planning_error';
  message: string;
  retryAfter?: number; // seconds
  fallbackAvailable?: boolean;
  timestamp: Date;
  recoverable?: boolean;
}

// Local AI capabilities
export interface LocalAIModel {
  name: string;
  size: number; // MB
  capabilities: AIRequestType[];
  accuracy: number; // 0 to 1
  speed: number; // responses per second
  memoryRequirement: number; // MB
  isLoaded: boolean;
}

export interface LocalAIConfig {
  enableLocalModel: boolean;
  modelPreference: string;
  fallbackToRemote: boolean;
  maxLocalModelSize: number; // MB
  offlineMode: boolean;
}