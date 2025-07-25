// Workout Types
export * from './workout';

// Voice Types
export * from './voice';

// AI Types
export * from './ai';

// App State Types
export interface AppState {
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  user: User | null;
  settings: AppSettings;
  connectivity: ConnectivityState;
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  avatar?: string;
  preferences: UserPreferences;
  subscription: Subscription;
  stats: UserStats;
  createdAt: Date;
  lastActive: Date;
}

export interface UserPreferences {
    theme: 'light' | 'dark' | 'auto';
    language: string;
  timezone: string;
    units: 'metric' | 'imperial';
  notifications: NotificationSettings;
  privacy: PrivacySettings;
  accessibility: AccessibilitySettings;
}

export interface NotificationSettings {
      workoutReminders: boolean;
  progressUpdates: boolean;
      motivationalMessages: boolean;
  formReminders: boolean;
  achievementCelebrations: boolean;
  restTimerAlerts: boolean;
  emailDigest: boolean;
  pushNotifications: boolean;
}

export interface PrivacySettings {
  dataSharing: boolean;
  analytics: boolean;
  voiceDataRetention: number; // days
  shareProgress: boolean;
  publicProfile: boolean;
}

export interface AccessibilitySettings {
  largeText: boolean;
  highContrast: boolean;
  voiceNavigation: boolean;
  screenReader: boolean;
  reducedMotion: boolean;
  hapticFeedback: boolean;
}

export interface Subscription {
  tier: 'free' | 'pro' | 'coach';
  status: 'active' | 'inactive' | 'trial' | 'cancelled';
  expiresAt?: Date;
  features: SubscriptionFeature[];
  billingCycle: 'monthly' | 'yearly';
}

export interface SubscriptionFeature {
  name: string;
  description: string;
  enabled: boolean;
  category: 'voice' | 'ai' | 'analytics' | 'sync' | 'support';
}

export interface UserStats {
  totalWorkouts: number;
  totalSets: number;
  totalReps: number;
  totalVolume: number; // lbs or kg
  totalDuration: number; // minutes
  streak: number;
  achievementCount: number;
  joinDate: Date;
  lastWorkout: Date;
  favoriteExercises: string[];
  strengthRecords: number;
}

export interface AppSettings {
  apiEndpoint: string;
  offlineMode: boolean;
  syncEnabled: boolean;
  debugMode: boolean;
  betaFeatures: boolean;
  cacheSize: number; // MB
  autoBackup: boolean;
  backupFrequency: 'daily' | 'weekly' | 'monthly';
}

export interface ConnectivityState {
  isOnline: boolean;
  connectionType: 'wifi' | 'cellular' | 'ethernet' | 'unknown';
  networkSpeed: 'slow' | 'medium' | 'fast';
  lastSync: Date | null;
  pendingSync: number;
  apiStatus: 'connected' | 'degraded' | 'offline';
}

// Navigation Types
export interface NavigationState {
  currentRoute: string;
  history: string[];
  canGoBack: boolean;
  params: Record<string, any>;
}

export interface Route {
  path: string;
  component: React.ComponentType;
  name: string;
  requiresAuth: boolean;
  requiresSubscription?: SubscriptionTier;
  breadcrumb?: string;
  meta?: RouteMeta;
}

export interface RouteMeta {
  title: string;
  description?: string;
  keywords?: string[];
  voiceNavigable: boolean;
  gestureSupport: boolean;
}

export type SubscriptionTier = 'free' | 'pro' | 'coach';

// Error Types
export interface AppError {
  id: string;
  type: ErrorType;
  message: string;
  details?: string;
  timestamp: Date;
  context?: Record<string, any>;
  severity: ErrorSeverity;
  recoverable: boolean;
  reportable: boolean;
}

export type ErrorType = 
  | 'network' | 'voice' | 'ai' | 'storage' | 'validation' 
  | 'permission' | 'subscription' | 'sync' | 'unknown';

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

// Performance Types
export interface PerformanceMetrics {
  renderTime: number;
  bundleSize: number;
  memoryUsage: number;
  apiLatency: number;
  voiceLatency: number;
  cacheHitRate: number;
    errorRate: number;
  crashRate: number;
}

// Analytics Types
export interface AnalyticsEvent {
  name: string;
  properties: Record<string, any>;
  timestamp: Date;
  userId?: string;
  sessionId: string;
  category: EventCategory;
  value?: number;
}

export type EventCategory = 
  | 'workout' | 'voice' | 'ai' | 'navigation' | 'engagement' 
  | 'error' | 'performance' | 'monetization';

// Sync Types
export interface SyncState {
  lastSync: Date | null;
  pendingChanges: number;
  conflictCount: number;
  status: SyncStatus;
  nextSync: Date | null;
}

export type SyncStatus = 'idle' | 'syncing' | 'error' | 'conflict';

export interface SyncConflict {
    id: string;
  type: 'workout' | 'exercise' | 'settings' | 'progress';
    localData: unknown;
    remoteData: unknown;
    timestamp: Date;
  resolution?: ConflictResolution;
}

export type ConflictResolution = 'local' | 'remote' | 'merge' | 'manual';

// Theme Types
export interface Theme {
  name: string;
  colors: ThemeColors;
  fonts: ThemeFonts;
  spacing: ThemeSpacing;
  animations: ThemeAnimations;
  breakpoints: ThemeBreakpoints;
}

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  success: string;
  warning: string;
  error: string;
  info: string;
}

export interface ThemeFonts {
  body: string;
  heading: string;
  monospace: string;
  sizes: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    xxl: string;
  };
}

export interface ThemeSpacing {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  xxl: string;
}

export interface ThemeAnimations {
  duration: {
    fast: string;
    normal: string;
    slow: string;
  };
  easing: {
    ease: string;
    easeIn: string;
    easeOut: string;
    easeInOut: string;
  };
}

export interface ThemeBreakpoints {
  sm: string;
  md: string;
  lg: string;
  xl: string;
  xxl: string;
}

// Feature Flags
export interface FeatureFlags {
  voiceCommands: boolean;
  aiCoaching: boolean;
  advancedAnalytics: boolean;
  socialFeatures: boolean;
  offlineSync: boolean;
  betaFeatures: boolean;
  experimentalUI: boolean;
  premiumFeatures: boolean;
}

// Device Types
export interface DeviceInfo {
  platform: 'web' | 'ios' | 'android';
  userAgent: string;
  screenSize: ScreenSize;
  capabilities: DeviceCapabilities;
  performance: DevicePerformance;
}

export interface ScreenSize {
    width: number;
    height: number;
  devicePixelRatio: number;
  orientation: 'portrait' | 'landscape';
}

export interface DeviceCapabilities {
  touchSupport: boolean;
  voiceSupport: boolean;
  cameraSupport: boolean;
  bluetoothSupport: boolean;
  gpsSupport: boolean;
  accelerometerSupport: boolean;
  gyroscopeSupport: boolean;
  pushNotificationSupport: boolean;
}

export interface DevicePerformance {
  memoryLimit: number; // MB
  cpuCores: number;
  gpuSupport: boolean;
  storageQuota: number; // MB
  networkSpeed: 'slow' | 'medium' | 'fast';
}

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface UserProfile {
  id: string;
  name: string;
  age: number;
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  goals: string[];
  equipment: string[];
  injuries?: string[];
  preferences?: {
    workoutTime?: string;
    workoutDuration?: number;
    restDays?: string[];
  };
}

export interface WorkoutContext {
  currentExercise?: string;
  intensity: 'low' | 'medium' | 'high';
  duration: number;
  caloriesBurned: number;
  heartRate?: number;
  sets?: number;
  reps?: number;
  weight?: number;
}

export interface FitnessGoals {
  primaryGoal: 'muscle_gain' | 'weight_loss' | 'strength' | 'endurance' | 'general_fitness';
  targetWeight?: number;
  targetBodyFat?: number;
  weeklyWorkoutTarget: number;
  specificGoals?: string[];
  timeline?: string;
}

export interface AIResponse {
    message: string;
  suggestions?: string[];
  metadata?: {
    cached?: boolean;
    similarity?: number;
    responseTime?: number;
    error?: boolean;
  };
}