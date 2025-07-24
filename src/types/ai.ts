import { WorkoutContext, Exercise, Workout, ProgressMetrics } from './workout';

export interface AICoachConfig {
  model: AIModel;
  apiEndpoint?: string;
  localModel?: LocalModelConfig;
  personality: AIPersonality;
  expertise: ExpertiseLevel;
  responseStyle: ResponseStyle;
  contextWindow: number;
  maxTokens: number;
  temperature: number;
}

export interface LocalModelConfig {
  modelPath: string;
  quantization: '4bit' | '8bit' | '16bit';
  maxMemory: number; // MB
  enableGPU: boolean;
}

export interface AIPersonality {
  name: string;
  role: 'trainer' | 'coach' | 'motivator' | 'analyst';
  tone: 'professional' | 'friendly' | 'motivational' | 'scientific';
  expertise: ExpertiseArea[];
  communication: CommunicationStyle;
  encouragementStyle: EncouragementStyle;
}

export interface CommunicationStyle {
  verbosity: 'concise' | 'detailed' | 'comprehensive';
  technicality: 'basic' | 'intermediate' | 'advanced';
  examples: boolean;
  analogies: boolean;
  dataVisualization: boolean;
}

export interface EncouragementStyle {
  frequency: 'minimal' | 'moderate' | 'frequent';
  type: 'gentle' | 'motivational' | 'tough-love' | 'data-driven';
  personalization: boolean;
  goalOriented: boolean;
}

export interface AIRequest {
  query: string;
  context: WorkoutContext;
  requestType: AIRequestType;
  priority: RequestPriority;
  userId?: string;
  sessionId: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface AIResponse {
  content: string;
  confidence: number;
  sources?: AISource[];
  suggestions?: string[];
  followUpQuestions?: string[];
  actions?: AIAction[];
  metadata: AIResponseMetadata;
  cached: boolean;
  processingTime: number;
}

export interface AIResponseMetadata {
  model: string;
  tokens: TokenUsage;
  timestamp: Date;
  requestId: string;
  category: ResponseCategory;
  safety: SafetyCheck;
}

export interface TokenUsage {
  prompt: number;
  completion: number;
  total: number;
}

export interface SafetyCheck {
  passed: boolean;
  warnings: string[];
  medicalDisclaimer: boolean;
  injuryRisk: 'low' | 'medium' | 'high';
}

export interface AISource {
  type: 'research' | 'guidelines' | 'experience' | 'calculation';
  title: string;
  url?: string;
  confidence: number;
  relevance: number;
}

export interface AIAction {
  type: ActionType;
  description: string;
  parameters: Record<string, any>;
  priority: ActionPriority;
  confirmation?: boolean;
}

export interface FormAnalysis {
  exercise: Exercise;
  analysis: FormAnalysisResult;
  recommendations: FormRecommendation[];
  videoTimestamps?: VideoTimestamp[];
  confidence: number;
  safetyAssessment: SafetyAssessment;
}

export interface FormAnalysisResult {
  overallScore: number; // 1-10
  strengths: string[];
  improvements: string[];
  commonMistakes: string[];
  injuryRisks: InjuryRisk[];
  biomechanics: BiomechanicsAnalysis;
}

export interface FormRecommendation {
  type: 'technique' | 'setup' | 'breathing' | 'tempo' | 'load';
  priority: 'high' | 'medium' | 'low';
  description: string;
  instruction: string;
  expectedImprovement: string;
  timeline: string;
}

export interface BiomechanicsAnalysis {
  jointAngles: JointAngle[];
  muscleActivation: MuscleActivation[];
  forceDistribution: ForceAnalysis[];
  movementPattern: MovementPattern;
}

export interface JointAngle {
  joint: string;
  angle: number;
  optimal: number;
  deviation: number;
  phase: 'setup' | 'eccentric' | 'concentric' | 'lockout';
}

export interface MuscleActivation {
  muscle: string;
  activation: number; // percentage
  timing: 'early' | 'correct' | 'late';
  duration: number;
}

export interface ForceAnalysis {
  direction: 'vertical' | 'horizontal' | 'rotational';
  magnitude: number;
  efficiency: number;
  compensation: boolean;
}

export interface MovementPattern {
  quality: 'excellent' | 'good' | 'needs-improvement' | 'poor';
  symmetry: number; // percentage
  consistency: number; // percentage
  tempo: TempoAnalysis;
}

export interface TempoAnalysis {
  eccentric: number; // seconds
  pause: number;
  concentric: number;
  optimal: boolean;
  recommendations: string[];
}

export interface InjuryRisk {
  type: string;
  probability: number; // percentage
  severity: 'low' | 'medium' | 'high' | 'severe';
  description: string;
  prevention: string[];
}

export interface SafetyAssessment {
  riskLevel: 'safe' | 'caution' | 'unsafe';
  warnings: string[];
  stopCriteria: string[];
  modifications: string[];
}

export interface VideoTimestamp {
  time: number; // seconds
  description: string;
  type: 'good' | 'improvement' | 'error';
}

export interface NutritionAdvice {
  query: string;
  advice: NutritionRecommendation[];
  meal: MealSuggestion[];
  timing: TimingRecommendation[];
  hydration: HydrationGuidance;
  supplements?: SupplementAdvice[];
  disclaimers: string[];
}

export interface NutritionRecommendation {
  category: 'pre-workout' | 'post-workout' | 'general' | 'recovery';
  macros: MacroRecommendation;
  foods: FoodSuggestion[];
  timing: string;
  reasoning: string;
}

export interface MacroRecommendation {
  protein: number; // grams
  carbs: number;
  fat: number;
  calories: number;
  rationale: string;
}

export interface FoodSuggestion {
  name: string;
  portion: string;
  macros: { protein: number; carbs: number; fat: number; calories: number };
  benefits: string[];
  alternatives: string[];
}

export interface MealSuggestion {
  name: string;
  ingredients: string[];
  instructions: string[];
  nutrition: MacroRecommendation;
  prepTime: number; // minutes
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface TimingRecommendation {
  meal: string;
  timeBeforeWorkout?: number; // minutes
  timeAfterWorkout?: number;
  reasoning: string;
}

export interface HydrationGuidance {
  dailyIntake: number; // liters
  preWorkout: number; // ml
  duringWorkout: number; // ml per hour
  postWorkout: number; // ml
  electrolytes: boolean;
  timing: string[];
}

export interface SupplementAdvice {
  name: string;
  dosage: string;
  timing: string;
  benefits: string[];
  sideEffects: string[];
  necessity: 'essential' | 'beneficial' | 'optional';
  disclaimer: string;
}

export interface WorkoutPlan {
  id: string;
  name: string;
  description: string;
  duration: number; // weeks
  goal: FitnessGoal;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  schedule: WorkoutSchedule;
  progression: ProgressionPlan;
  exercises: PlannedExercise[];
  notes: string[];
  adjustments: PlanAdjustment[];
}

export interface WorkoutSchedule {
  daysPerWeek: number;
  sessionDuration: number; // minutes
  restDays: number[];
  flexibility: 'strict' | 'flexible' | 'adaptive';
}

export interface ProgressionPlan {
  type: 'linear' | 'undulating' | 'block' | 'adaptive';
  progressionRate: number; // percentage per week
  deloadWeeks: number[];
  adjustmentCriteria: string[];
}

export interface PlannedExercise {
  exerciseId: string;
  week: number;
  sets: number;
  reps: number | string; // can be "8-12"
  weight: number | string; // can be "75%"
  restTime: number;
  notes: string[];
  alternatives: string[];
}

export interface PlanAdjustment {
  week: number;
  type: 'volume' | 'intensity' | 'frequency' | 'exercise';
  description: string;
  reasoning: string;
}

export interface MotivationalMessage {
  message: string;
  context: MotivationalContext;
  personalizedElements: string[];
  deliveryMethod: 'voice' | 'text' | 'visual';
  timing: MessageTiming;
  effectiveness: number; // user feedback score
}

export interface MotivationalContext {
  situation: 'struggle' | 'progress' | 'milestone' | 'plateau' | 'comeback';
  userMood: 'low' | 'medium' | 'high';
  workoutType: string;
  timeOfDay: 'morning' | 'afternoon' | 'evening';
  recentPerformance: 'improving' | 'maintaining' | 'declining';
}

export interface MessageTiming {
  trigger: 'automatic' | 'user-request' | 'scheduled';
  frequency: 'rare' | 'occasional' | 'frequent';
  contextSensitive: boolean;
}

export interface AICache {
  key: string;
  response: AIResponse;
  context: WorkoutContext;
  timestamp: Date;
  hits: number;
  lastAccessed: Date;
  ttl: number; // time to live in minutes
}

export interface AIAnalytics {
  totalRequests: number;
  responseTime: ResponseTimeMetrics;
  accuracy: AccuracyMetrics;
  userSatisfaction: SatisfactionMetrics;
  topQueries: QueryAnalytics[];
  errorPatterns: ErrorPattern[];
  modelPerformance: ModelPerformance;
}

export interface ResponseTimeMetrics {
  average: number;
  p50: number;
  p95: number;
  p99: number;
  slowestQueries: string[];
}

export interface AccuracyMetrics {
  correctAdvice: number; // percentage
  factualErrors: number;
  helpfulResponses: number; // percentage
  followUpNeeded: number; // percentage
}

export interface SatisfactionMetrics {
  averageRating: number; // 1-5
  thumbsUp: number;
  thumbsDown: number;
  reportedIssues: number;
  improvements: string[];
}

export interface QueryAnalytics {
  query: string;
  frequency: number;
  satisfaction: number;
  responseTime: number;
  category: string;
}

export interface ErrorPattern {
  type: string;
  frequency: number;
  context: string[];
  resolution: string;
  impact: 'low' | 'medium' | 'high';
}

export interface ModelPerformance {
  model: string;
  latency: number;
  throughput: number;
  accuracy: number;
  costPerQuery: number;
  resourceUsage: ResourceUsage;
}

export interface ResourceUsage {
  cpu: number; // percentage
  memory: number; // MB
  gpu?: number; // percentage
  storage: number; // MB
}

// Enums and Types
export type AIModel = 
  | 'gpt-4' | 'gpt-3.5-turbo' | 'claude-3' | 'claude-2'
  | 'local-llama' | 'local-fitness-model' | 'custom';

export type ExpertiseLevel = 'general' | 'specialized' | 'expert' | 'research';

export type ExpertiseArea = 
  | 'strength-training' | 'cardio' | 'nutrition' | 'recovery'
  | 'injury-prevention' | 'sports-performance' | 'bodybuilding'
  | 'powerlifting' | 'endurance' | 'flexibility' | 'mental-health';

export type ResponseStyle = 'conversational' | 'technical' | 'educational' | 'motivational';

export type AIRequestType = 
  | 'form-analysis' | 'nutrition' | 'motivation' | 'progression'
  | 'injury-prevention' | 'exercise-explanation' | 'workout-planning'
  | 'goal-setting' | 'troubleshooting' | 'general-advice';

export type RequestPriority = 'low' | 'medium' | 'high' | 'urgent';

export type ResponseCategory = 
  | 'factual' | 'analytical' | 'motivational' | 'instructional'
  | 'cautionary' | 'personalized' | 'general';

export type ActionType = 
  | 'log-exercise' | 'adjust-weight' | 'modify-form' | 'take-rest'
  | 'see-doctor' | 'change-exercise' | 'update-goal' | 'schedule-workout';

export type ActionPriority = 'immediate' | 'soon' | 'eventual' | 'optional';

export type FitnessGoal = 
  | 'strength' | 'muscle-gain' | 'fat-loss' | 'endurance'
  | 'performance' | 'health' | 'rehabilitation' | 'maintenance';

// AI Training and Learning
export interface AILearning {
  userFeedback: UserFeedback[];
  adaptations: Adaptation[];
  personalizations: Personalization[];
  performanceMetrics: LearningMetrics;
}

export interface UserFeedback {
  responseId: string;
  rating: number; // 1-5
  feedback: string;
  category: 'accuracy' | 'helpfulness' | 'clarity' | 'tone';
  timestamp: Date;
  context: WorkoutContext;
}

export interface Adaptation {
  type: 'response-style' | 'content-depth' | 'personality' | 'expertise';
  change: string;
  reasoning: string;
  impact: number; // expected improvement percentage
  timestamp: Date;
}

export interface Personalization {
  userId: string;
  preferences: UserPreferences;
  learningHistory: LearningHistory;
  adaptedResponses: AdaptedResponse[];
}

export interface UserPreferences {
  communicationStyle: string;
  expertiseLevel: string;
  goals: string[];
  interests: string[];
  avoidances: string[];
}

export interface LearningHistory {
  interactions: number;
  successfulAdvice: number;
  preferredTopics: string[];
  responsePatterns: string[];
}

export interface AdaptedResponse {
  originalResponse: string;
  adaptedResponse: string;
  improvement: number;
  feedback: string;
}

export interface LearningMetrics {
  accuracy: number;
  improvement: number;
  // Add more fields as needed
}