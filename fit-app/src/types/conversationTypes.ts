export interface QuickReply {
  id: string;
  text: string;
  value: string;
  icon: string; // SVG icon name
  category: ReplyCategory;
  color?: string;
  metadata?: Record<string, any>;
}

export type ReplyCategory =
  | 'experience'
  | 'goal'
  | 'equipment'
  | 'time'
  | 'frequency'
  | 'medical'
  | 'lifestyle'
  | 'dietary'
  | 'mental_health'
  | 'location'
  | 'budget'
  | 'schedule'
  | 'body_type';

export interface ConversationState {
  phase: ConversationPhase;
  collectedData: UserProfile;
  missingFields: string[];
  scenarioType: ScenarioType;
  customizations: string[];
  flags: ConversationFlags;
}

export type ConversationPhase =
  | 'greeting'
  | 'basic_info'
  | 'lifestyle_assessment'
  | 'medical_screening'
  | 'customization'
  | 'template_generation'
  | 'template_review'
  | 'completion';

export type ScenarioType =
  | 'standard_beginner'
  | 'gym_intimidation'
  | 'injury_recovery'
  | 'pregnancy'
  | 'senior'
  | 'shift_worker'
  | 'busy_parent'
  | 'traveler'
  | 'budget_constraint'
  | 'mental_health'
  | 'competitive_athlete'
  | 'plateau_breaker'
  | 'returning_user';

export interface ConversationFlags {
  needsMedicalClearance: boolean;
  hasPhysicalLimitations: boolean;
  needsMotivationalSupport: boolean;
  hasDietaryRestrictions: boolean;
  needsPrivacyConsiderations: boolean;
  requiresModifications: boolean;
}

export interface UserProfile {
  age?: number;
  sex?: 'male' | 'female' | 'other';
  experienceLevel?: 'beginner' | 'intermediate' | 'advanced';
  primaryGoal?: string;
  equipment?: string[] | string;
  timePerSession?: string | number;
  daysPerWeek?: number;
  medical?: {
    injuries?: string[];
    conditions?: string[];
    pregnancy?: boolean;
    clearedForExercise?: boolean;
  };
  lifestyle?: {
    shiftWork?: boolean;
    parent?: boolean;
    travelFrequency?: 'low' | 'medium' | 'high';
  };
  dietary?: {
    restrictions?: string[];
    preferences?: string[];
  };
  currentWeight?: number;
  targetWeight?: number;
  activityLevel?: string;
  dietaryPreferences?: string;
  budget?: string;
}




