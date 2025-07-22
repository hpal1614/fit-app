import type { AIMessage } from '../types/ai';
import type { WorkoutContext } from '../types/workout';

export interface ConversationMemory {
  messages: AIMessage[];
  context: ConversationContext;
  shortTermMemory: ShortTermMemory;
  longTermMemory: LongTermMemory;
  metadata: ConversationMetadata;
}

export interface ConversationContext {
  currentTopic?: string;
  activeGoals: string[];
  userMood: 'positive' | 'neutral' | 'struggling' | 'motivated';
  workoutPhase: 'pre-workout' | 'during-workout' | 'post-workout' | 'rest-day';
  recentAchievements: Achievement[];
}

export interface ShortTermMemory {
  recentExercises: Array<{exercise: string, sets: number, timestamp: Date}>;
  recentQuestions: Array<{question: string, category: string, timestamp: Date}>;
  currentWorkoutData: {
    exercises: string[];
    totalSets: number;
    startTime?: Date;
  };
  temporaryPreferences: Record<string, any>;
}

export interface LongTermMemory {
  userProfile: {
    fitnessLevel: 'beginner' | 'intermediate' | 'advanced';
    goals: string[];
    preferences: UserMemoryPreferences;
    patterns: UserPatterns;
  };
  historicalData: {
    favoriteExercises: string[];
    typicalWorkoutDuration: number;
    preferredWorkoutTimes: string[];
    commonQuestions: string[];
  };
  achievements: Achievement[];
}

export interface UserMemoryPreferences {
  communicationStyle: 'technical' | 'casual' | 'motivational';
  feedbackFrequency: 'minimal' | 'moderate' | 'detailed';
  encouragementLevel: 'low' | 'medium' | 'high';
  preferredCoachingStyle: string[];
}

export interface UserPatterns {
  workoutFrequency: number; // per week
  consistencyScore: number; // 0-100
  progressionRate: number; // percentage
  commonMistakes: string[];
  strengths: string[];
}

export interface Achievement {
  type: 'pr' | 'consistency' | 'milestone' | 'improvement';
  description: string;
  date: Date;
  value?: number;
}

export interface ConversationMetadata {
  sessionId: string;
  startTime: Date;
  lastInteraction: Date;
  messageCount: number;
  topicsDiscussed: string[];
  userSatisfaction?: number;
}

export class ConversationMemoryService {
  private memory: ConversationMemory;
  private readonly MAX_SHORT_TERM_MESSAGES = 20;
  private readonly MAX_CONVERSATION_HISTORY = 100;
  
  constructor() {
    this.memory = this.loadMemory() || this.initializeMemory();
  }

  /**
   * Add a message to conversation memory
   */
  addMessage(message: AIMessage, context?: WorkoutContext): void {
    // Add to messages
    this.memory.messages.push(message);
    
    // Maintain message limit
    if (this.memory.messages.length > this.MAX_CONVERSATION_HISTORY) {
      this.memory.messages = this.memory.messages.slice(-this.MAX_CONVERSATION_HISTORY);
    }
    
    // Update metadata
    this.memory.metadata.lastInteraction = new Date();
    this.memory.metadata.messageCount++;
    
    // Extract and learn from message
    this.extractInsights(message, context);
    
    // Update context based on message
    this.updateContext(message);
    
    // Save to storage
    this.saveMemory();
  }

  /**
   * Get contextual memory for AI responses
   */
  getContextualMemory(limit: number = 10): {
    recentConversation: AIMessage[];
    relevantContext: ConversationContext;
    userPreferences: UserMemoryPreferences;
    suggestions: string[];
  } {
    const recentConversation = this.memory.messages.slice(-limit);
    
    return {
      recentConversation,
      relevantContext: this.memory.context,
      userPreferences: this.memory.longTermMemory.userProfile.preferences,
      suggestions: this.generateContextualSuggestions()
    };
  }

  /**
   * Extract insights from messages for learning
   */
  private extractInsights(message: AIMessage, context?: WorkoutContext): void {
    // Update short-term memory
    if (message.type === 'form-analysis' || message.type === 'exercise-explanation') {
      const exerciseMention = this.extractExerciseMention(message.content);
      if (exerciseMention) {
        this.memory.shortTermMemory.recentExercises.push({
          exercise: exerciseMention,
          sets: 0,
          timestamp: message.timestamp
        });
      }
    }
    
    // Track questions
    if (message.role === 'user' && message.content.includes('?')) {
      this.memory.shortTermMemory.recentQuestions.push({
        question: message.content,
        category: message.type || 'general',
        timestamp: message.timestamp
      });
    }
    
    // Update user mood based on content analysis
    this.analyzeUserMood(message);
    
    // Learn user patterns
    if (context?.activeWorkout) {
      this.updateWorkoutPatterns(context);
    }
  }

  /**
   * Update conversation context based on messages
   */
  private updateContext(message: AIMessage): void {
    // Update current topic
    if (message.type) {
      this.memory.context.currentTopic = message.type;
    }
    
    // Track topics discussed
    if (message.type && !this.memory.metadata.topicsDiscussed.includes(message.type)) {
      this.memory.metadata.topicsDiscussed.push(message.type);
    }
    
    // Update workout phase based on context
    const now = new Date();
    const hour = now.getHours();
    
    if (message.content.toLowerCase().includes('warm up') || 
        message.content.toLowerCase().includes('getting started')) {
      this.memory.context.workoutPhase = 'pre-workout';
    } else if (message.content.toLowerCase().includes('finished') || 
               message.content.toLowerCase().includes('completed')) {
      this.memory.context.workoutPhase = 'post-workout';
    }
  }

  /**
   * Analyze user mood from message content
   */
  private analyzeUserMood(message: AIMessage): void {
    if (message.role !== 'user') return;
    
    const content = message.content.toLowerCase();
    
    // Positive indicators
    if (content.includes('great') || content.includes('awesome') || 
        content.includes('feeling good') || content.includes('crushed it')) {
      this.memory.context.userMood = 'positive';
    }
    // Struggling indicators
    else if (content.includes('tired') || content.includes('hard') || 
             content.includes('struggling') || content.includes("can't")) {
      this.memory.context.userMood = 'struggling';
    }
    // Motivated indicators
    else if (content.includes('ready') || content.includes("let's go") || 
             content.includes('pumped') || content.includes('motivated')) {
      this.memory.context.userMood = 'motivated';
    }
  }

  /**
   * Update workout patterns from context
   */
  private updateWorkoutPatterns(context: WorkoutContext): void {
    if (!context.activeWorkout) return;
    
    // Update favorite exercises
    const exercises = context.activeWorkout.exercises.map(e => e.exercise.name);
    exercises.forEach(exercise => {
      if (!this.memory.longTermMemory.historicalData.favoriteExercises.includes(exercise)) {
        this.memory.longTermMemory.historicalData.favoriteExercises.push(exercise);
      }
    });
    
    // Update typical workout duration
    if (context.workoutDuration) {
      const currentAvg = this.memory.longTermMemory.historicalData.typicalWorkoutDuration || 0;
      this.memory.longTermMemory.historicalData.typicalWorkoutDuration = 
        (currentAvg + context.workoutDuration) / 2;
    }
  }

  /**
   * Generate contextual suggestions based on memory
   */
  private generateContextualSuggestions(): string[] {
    const suggestions: string[] = [];
    
    // Based on user mood
    if (this.memory.context.userMood === 'struggling') {
      suggestions.push('Would you like some motivation?');
      suggestions.push('Should we adjust the workout intensity?');
    } else if (this.memory.context.userMood === 'motivated') {
      suggestions.push('Ready to push your limits?');
      suggestions.push('Want to try a new personal record?');
    }
    
    // Based on workout phase
    if (this.memory.context.workoutPhase === 'pre-workout') {
      suggestions.push('Need a warm-up routine?');
      suggestions.push('Want to review your workout plan?');
    } else if (this.memory.context.workoutPhase === 'post-workout') {
      suggestions.push('How about some stretching?');
      suggestions.push('Need post-workout nutrition advice?');
    }
    
    // Based on recent questions
    const recentTopics = this.memory.shortTermMemory.recentQuestions
      .map(q => q.category)
      .filter((v, i, a) => a.indexOf(v) === i);
    
    if (recentTopics.includes('form-analysis')) {
      suggestions.push('Want to review form for another exercise?');
    }
    
    return suggestions.slice(0, 3);
  }

  /**
   * Extract exercise mention from text
   */
  private extractExerciseMention(text: string): string | null {
    // Simple extraction - could be enhanced with NLP
    const exerciseKeywords = ['bench press', 'squat', 'deadlift', 'curl', 'press', 'row'];
    const lowerText = text.toLowerCase();
    
    for (const keyword of exerciseKeywords) {
      if (lowerText.includes(keyword)) {
        return keyword;
      }
    }
    
    return null;
  }

  /**
   * Get memory summary for AI context
   */
  getMemorySummary(): string {
    const recentTopics = this.memory.metadata.topicsDiscussed.slice(-3);
    const mood = this.memory.context.userMood;
    const phase = this.memory.context.workoutPhase;
    
    return `User mood: ${mood}, Workout phase: ${phase}, Recent topics: ${recentTopics.join(', ')}`;
  }

  /**
   * Record achievement
   */
  recordAchievement(achievement: Achievement): void {
    this.memory.context.recentAchievements.push(achievement);
    this.memory.longTermMemory.achievements.push(achievement);
    
    // Keep only recent achievements in context
    if (this.memory.context.recentAchievements.length > 5) {
      this.memory.context.recentAchievements.shift();
    }
    
    this.saveMemory();
  }

  /**
   * Update user preferences based on interactions
   */
  updateUserPreferences(updates: Partial<UserMemoryPreferences>): void {
    this.memory.longTermMemory.userProfile.preferences = {
      ...this.memory.longTermMemory.userProfile.preferences,
      ...updates
    };
    this.saveMemory();
  }

  /**
   * Clear short-term memory (e.g., after workout)
   */
  clearShortTermMemory(): void {
    this.memory.shortTermMemory = {
      recentExercises: [],
      recentQuestions: [],
      currentWorkoutData: {
        exercises: [],
        totalSets: 0
      },
      temporaryPreferences: {}
    };
    this.saveMemory();
  }

  /**
   * Initialize empty memory
   */
  private initializeMemory(): ConversationMemory {
    return {
      messages: [],
      context: {
        activeGoals: [],
        userMood: 'neutral',
        workoutPhase: 'rest-day',
        recentAchievements: []
      },
      shortTermMemory: {
        recentExercises: [],
        recentQuestions: [],
        currentWorkoutData: {
          exercises: [],
          totalSets: 0
        },
        temporaryPreferences: {}
      },
      longTermMemory: {
        userProfile: {
          fitnessLevel: 'intermediate',
          goals: [],
          preferences: {
            communicationStyle: 'casual',
            feedbackFrequency: 'moderate',
            encouragementLevel: 'medium',
            preferredCoachingStyle: []
          },
          patterns: {
            workoutFrequency: 0,
            consistencyScore: 0,
            progressionRate: 0,
            commonMistakes: [],
            strengths: []
          }
        },
        historicalData: {
          favoriteExercises: [],
          typicalWorkoutDuration: 0,
          preferredWorkoutTimes: [],
          commonQuestions: []
        },
        achievements: []
      },
      metadata: {
        sessionId: this.generateSessionId(),
        startTime: new Date(),
        lastInteraction: new Date(),
        messageCount: 0,
        topicsDiscussed: []
      }
    };
  }

  /**
   * Load memory from storage
   */
  private loadMemory(): ConversationMemory | null {
    try {
      const stored = localStorage.getItem('conversation_memory');
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convert date strings back to Date objects
        parsed.messages.forEach((msg: any) => {
          msg.timestamp = new Date(msg.timestamp);
        });
        parsed.metadata.startTime = new Date(parsed.metadata.startTime);
        parsed.metadata.lastInteraction = new Date(parsed.metadata.lastInteraction);
        return parsed;
      }
    } catch (error) {
      console.error('Failed to load conversation memory:', error);
    }
    return null;
  }

  /**
   * Save memory to storage
   */
  private saveMemory(): void {
    try {
      localStorage.setItem('conversation_memory', JSON.stringify(this.memory));
    } catch (error) {
      console.error('Failed to save conversation memory:', error);
    }
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Singleton
  private static instance: ConversationMemoryService;
  
  static getInstance(): ConversationMemoryService {
    if (!ConversationMemoryService.instance) {
      ConversationMemoryService.instance = new ConversationMemoryService();
    }
    return ConversationMemoryService.instance;
  }
}

export default ConversationMemoryService;
