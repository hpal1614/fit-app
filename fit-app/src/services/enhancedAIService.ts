import { aiService as baseAIService } from './aiService';
import { fitnessRAG } from './ragService';
import { conversationGraph } from './conversationGraph';
import { semanticCache } from './semanticCache';
import { convertToIndexableDocuments } from './fitnessKnowledge';
import type { AIResponse, Message, UserProfile, WorkoutContext, FitnessGoals } from '../types';

export class EnhancedAIService {
  private initialized = false;
  private conversationHistory: Message[] = [];
  private userProfile: UserProfile = {
    id: '',
    name: '',
    age: 0,
    experienceLevel: 'intermediate',
    goals: [],
    equipment: []
  };
  private workoutContext: WorkoutContext = {
    currentExercise: '',
    intensity: 'medium',
    duration: 0,
    caloriesBurned: 0
  };
  private fitnessGoals: FitnessGoals = {
    primaryGoal: 'general_fitness',
    targetWeight: 0,
    targetBodyFat: 0,
    weeklyWorkoutTarget: 3
  };

  constructor() {
    this.initialize();
  }

  async initialize() {
    if (this.initialized) return;

    try {
      // Initialize RAG system
      await fitnessRAG.initialize();
      
      // Index fitness knowledge base
      const documents = convertToIndexableDocuments();
      await fitnessRAG.indexFitnessDocuments(documents);
      
      // Preload popular cache responses
      await semanticCache.preloadPopularResponses();
      
      // Set up cache cleanup interval (every hour)
      setInterval(() => {
        semanticCache.cleanupExpiredEntries();
      }, 60 * 60 * 1000);

      this.initialized = true;
      console.log('Enhanced AI Service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize AI service:', error);
    }
  }

  async sendMessage(message: string): Promise<AIResponse> {
    const startTime = Date.now();
    
    try {
      // Check semantic cache first
      const cachedResponse = await semanticCache.findSimilarResponse(
        message,
        this.workoutContext,
        0.85
      );

      if (cachedResponse) {
        console.log(`Cache hit! Response time: ${Date.now() - startTime}ms`);
        return {
          message: cachedResponse.response_text,
          suggestions: this.extractSuggestions(cachedResponse.response_text),
          metadata: {
            cached: true,
            similarity: cachedResponse.similarity,
            responseTime: Date.now() - startTime
          }
        };
      }

      // Process through LangGraph conversation orchestration
      const response = await conversationGraph.processMessage(
        message,
        this.userProfile,
        this.workoutContext,
        this.fitnessGoals,
        this.conversationHistory
      );

      // Update conversation history
      this.conversationHistory.push({
        role: 'user',
        content: message,
        timestamp: new Date()
      });
      
      this.conversationHistory.push({
        role: 'assistant',
        content: response,
        timestamp: new Date()
      });

      // Keep history manageable (last 50 messages)
      if (this.conversationHistory.length > 50) {
        this.conversationHistory = this.conversationHistory.slice(-50);
      }

      // Cache the response
      await semanticCache.cacheResponse(message, response, this.workoutContext);

      const responseTime = Date.now() - startTime;
      console.log(`AI response generated in ${responseTime}ms`);

      return {
        message: response,
        suggestions: this.extractSuggestions(response),
        metadata: {
          cached: false,
          responseTime
        }
      };
    } catch (error) {
      console.error('AI service error:', error);
      
      // Fallback response
      return {
        message: "I apologize, but I'm having trouble processing your request right now. Could you please try rephrasing your question?",
        suggestions: ['Try a different question', 'Check your internet connection'],
        metadata: {
          error: true,
          responseTime: Date.now() - startTime
        }
      };
    }
  }

  // Update user profile for personalized responses
  updateUserProfile(profile: Partial<UserProfile>) {
    this.userProfile = { ...this.userProfile, ...profile };
  }

  // Update workout context for contextual responses
  updateWorkoutContext(context: Partial<WorkoutContext>) {
    this.workoutContext = { ...this.workoutContext, ...context };
  }

  // Update fitness goals
  updateFitnessGoals(goals: Partial<FitnessGoals>) {
    this.fitnessGoals = { ...this.fitnessGoals, ...goals };
  }

  // Extract actionable suggestions from AI response
  private extractSuggestions(response: string): string[] {
    const suggestions: string[] = [];
    
    // Extract numbered lists
    const numberedMatches = response.match(/\d+\.\s+([^\n]+)/g);
    if (numberedMatches) {
      suggestions.push(...numberedMatches.map(s => s.replace(/^\d+\.\s+/, '')));
    }
    
    // Extract bullet points
    const bulletMatches = response.match(/[•\-\*]\s+([^\n]+)/g);
    if (bulletMatches) {
      suggestions.push(...bulletMatches.map(s => s.replace(/^[•\-\*]\s+/, '')));
    }
    
    // Limit to top 3 suggestions
    return suggestions.slice(0, 3);
  }

  // Get conversation history
  getConversationHistory(): Message[] {
    return this.conversationHistory;
  }

  // Clear conversation history
  clearConversationHistory() {
    this.conversationHistory = [];
  }

  // Get cache metrics
  async getCacheMetrics() {
    return await semanticCache.getCacheMetrics();
  }

  // Invalidate cache for specific patterns
  async invalidateCache(pattern: string) {
    await semanticCache.invalidatePattern(pattern);
  }
}

export const aiService = new EnhancedAIService();