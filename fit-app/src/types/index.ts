import type * as React from 'react';

// Re-export all types from individual modules
export * from './workout';
export * from './voice';
export * from './ai';

// Import specific types needed in this file
import type { 
  WorkoutPreferences
} from './workout';
import type { 
  AIPersonality, 
  AIResponseStyle, 
  AIExpertiseLevel,
  UserProfile
} from './ai';
import type { VoiceConfig } from './voice';
import type { AICoachConfig } from './ai';

// Application-wide types
export interface AppState {
  user: User | null;
  isOnline: boolean;
  isLoading: boolean;
  error: AppError | null;
  settings: AppSettings;
  navigation: NavigationState;
  performance: PerformanceMetrics;
  analytics: AnalyticsEvent[];
  sync: SyncState;
  theme: Theme;
  features: FeatureFlags;
  device: DeviceInfo;
}

export interface User {
  id: string;
  email?: string;
  name?: string;
  avatar?: string;
  profile: UserProfile;
  preferences: UserPreferences;
  subscription?: {
    plan: 'free' | 'premium' | 'pro';
    expiresAt?: Date;
    features: string[];
  };
  createdAt: Date;
  lastLoginAt: Date;
  isVerified: boolean;
}

export interface UserPreferences {
  // Workout preferences
  workout: WorkoutPreferences;
  
  // Voice preferences
  voice: {
    enabled: boolean;
    wakeWordEnabled: boolean;
    continuousListening: boolean;
    voiceSelection: string;
    speechRate: number;
    autoSpeak: boolean;
  };
  
  // AI preferences
  ai: {
    personalityProfile: AIPersonality;
    responseStyle: AIResponseStyle;
    expertiseLevel: AIExpertiseLevel;
    enableAnalytics: boolean;
    enablePersonalization: boolean;
  };
  
  // App preferences
  app: {
    theme: 'light' | 'dark' | 'auto';
    language: string;
    units: 'metric' | 'imperial';
    privacy: {
      shareData: boolean;
      enableAnalytics: boolean;
      enableCrashReporting: boolean;
    };
    notifications: {
      workoutReminders: boolean;
      restTimers: boolean;
      personalRecords: boolean;
      motivationalMessages: boolean;
    };
  };
}

export interface AppSettings {
  version: string;
  environment: 'development' | 'staging' | 'production';
  apiBaseUrl: string;
  features: FeatureFlags;
  debug: boolean;
  maintenance: {
    enabled: boolean;
    message?: string;
    estimatedDuration?: number;
  };
  limits: {
    maxWorkoutDuration: number; // minutes
    maxSetsPerExercise: number;
    maxExercisesPerWorkout: number;
    maxCacheSize: number; // MB
  };
}

export interface ConnectivityState {
  isOnline: boolean;
  connectionType: 'wifi' | 'cellular' | 'ethernet' | 'unknown';
  effectiveType: 'slow-2g' | '2g' | '3g' | '4g' | '5g' | 'unknown';
  downlink: number; // Mbps
  rtt: number; // milliseconds
  saveData: boolean;
}

export interface NavigationState {
  currentRoute: string;
  previousRoute?: string;
  routeParams: Record<string, string>;
  canGoBack: boolean;
  tabIndex: number;
  modalStack: string[];
  drawerOpen: boolean;
}

export interface AppError {
  id: string;
  type: 'validation' | 'network' | 'auth' | 'permission' | 'unknown';
  code?: string;
  message: string;
  details?: string;
  stack?: string;
  timestamp: Date;
  recoverable: boolean;
  reported: boolean;
  userAction?: string;
  context?: Record<string, unknown>;
}

export interface PerformanceMetrics {
  appStartTime: number;
  firstRenderTime: number;
  interactionReadyTime: number;
  memoryUsage: {
    total: number;
    used: number;
    available: number;
  };
  bundleSize: {
    initial: number;
    loaded: number;
    cached: number;
  };
  apiMetrics: {
    averageResponseTime: number;
    successRate: number;
    errorRate: number;
    totalRequests: number;
  };
  renderMetrics: {
    averageFps: number;
    slowFrames: number;
    totalFrames: number;
  };
}

export interface AnalyticsEvent {
  id: string;
  type: string;
  category: 'workout' | 'voice' | 'ai' | 'navigation' | 'error' | 'performance';
  action: string;
  label?: string;
  value?: number;
  metadata?: Record<string, unknown>;
  timestamp: Date;
  sessionId: string;
  userId?: string;
}

export interface SyncState {
  lastSyncAt?: Date;
  isSyncing: boolean;
  syncProgress: number; // 0 to 1
  pendingChanges: number;
  conflicts: Array<{
    id: string;
    type: string;
    localData: any;
    remoteData: any;
    timestamp: Date;
  }>;
  syncErrors: Array<{
    type: string;
    message: string;
    timestamp: Date;
    retryCount: number;
  }>;
}

export interface Theme {
  name: string;
  mode: 'light' | 'dark';
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  customColors?: Record<string, string>;
}

export interface FeatureFlags {
  voiceCommands: boolean;
  aiCoaching: boolean;
  socialFeatures: boolean;
  premiumFeatures: boolean;
  betaFeatures: boolean;
  debugMode: boolean;
  offlineMode: boolean;
  analytics: boolean;
  crashReporting: boolean;
  performanceMonitoring: boolean;
  experimentalUI: boolean;
  advancedWorkoutPlanning: boolean;
  nutritionTracking: boolean;
  socialChallenges: boolean;
  wearableIntegration: boolean;
}

export interface DeviceInfo {
  platform: 'web' | 'ios' | 'android' | 'desktop';
  operatingSystem: string;
  browser?: string;
  version: string;
  screenSize: {
    width: number;
    height: number;
    pixelRatio: number;
  };
  capabilities: {
    speechRecognition: boolean;
    speechSynthesis: boolean;
    camera: boolean;
    microphone: boolean;
    geolocation: boolean;
    notifications: boolean;
    localStorage: boolean;
    indexedDB: boolean;
    webWorkers: boolean;
    webAssembly: boolean;
  };
  performance: {
    hardwareConcurrency: number;
    memory?: number; // GB
    connection?: ConnectivityState;
  };
}

// Utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? never : K;
}[keyof T];

export type OptionalKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? K : never;
}[keyof T];

// API response wrapper
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: {
    timestamp: string;
    requestId: string;
    version: string;
  };
}

// Configuration types
export interface AppConfig {
  api: {
    baseUrl: string;
    timeout: number;
    retryAttempts: number;
    retryDelay: number;
  };
  voice: VoiceConfig;
  ai: AICoachConfig;
  storage: {
    quota: number; // MB
    compressionEnabled: boolean;
    encryptionEnabled: boolean;
  };
  analytics: {
    enabled: boolean;
    sampleRate: number;
    debugMode: boolean;
  };
  performance: {
    enableMetrics: boolean;
    reportingInterval: number; // milliseconds
    maxEventQueue: number;
  };
}