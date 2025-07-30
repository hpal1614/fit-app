import { aiService as baseAIService } from './aiService';
import { fitnessRAG } from './ragService';
import { conversationGraph } from './conversationGraph';
import { semanticCache } from './semanticCache';
import { convertToIndexableDocuments } from './fitnessKnowledge';
import type { AIResponse, Message, UserProfile, WorkoutContext, FitnessGoals } from '../types';

class EnhancedAIService {
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
      // Load dependencies with error handling
      let fitnessRAG: any = null;
      let semanticCache: any = null;
      let convertToIndexableDocuments: any = null;

      try {
        const ragModule = await import('./ragService').catch(() => ({ fitnessRAG: null }));
        const cacheModule = await import('./semanticCache').catch(() => ({ semanticCache: null }));
        const knowledgeModule = await import('./fitnessKnowledge').catch(() => ({ convertToIndexableDocuments: null }));

        fitnessRAG = ragModule.fitnessRAG;
        semanticCache = cacheModule.semanticCache;
        convertToIndexableDocuments = knowledgeModule.convertToIndexableDocuments;
      } catch (error) {
        console.warn('Failed to load some AI service dependencies:', error);
      }

      // Initialize RAG system if available
      if (fitnessRAG && typeof fitnessRAG.initialize === 'function') {
        await fitnessRAG.initialize();
        
        // Index fitness knowledge base if method exists
        if (typeof fitnessRAG.indexFitnessDocuments === 'function' && convertToIndexableDocuments) {
          try {
            const documents = convertToIndexableDocuments();
            await fitnessRAG.indexFitnessDocuments(documents);
            console.log('Fitness documents indexed successfully');
          } catch (error) {
            console.warn('Failed to index fitness documents:', error);
          }
        } else {
          console.warn('indexFitnessDocuments method not available, using fallback');
        }
      } else {
        console.warn('fitnessRAG not available, using fallback AI service');
      }
      
      // Preload popular cache responses if available
      if (semanticCache && typeof semanticCache.preloadPopularResponses === 'function') {
        try {
          await semanticCache.preloadPopularResponses();
        } catch (error) {
          console.warn('Failed to preload cache responses:', error);
        }
      }
      
      // Set up cache cleanup interval if available
      if (semanticCache && typeof semanticCache.cleanupExpiredEntries === 'function') {
        setInterval(() => {
          try {
            semanticCache.cleanupExpiredEntries();
          } catch (error) {
            console.error('Cache cleanup error:', error);
          }
        }, 60 * 60 * 1000);
      }

      this.initialized = true;
      console.log('Enhanced AI Service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize AI service:', error);
      // Initialize with basic service as fallback
      this.initialized = true;
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
      
      // Use simple fallback response
      return this.getSimpleResponse(message, startTime);
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

  private getSimpleResponse(message: string, startTime: number): AIResponse {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('workout') || lowerMessage.includes('exercise')) {
      return {
        message: 'Great! I\'m here to help with your workout. What specific exercise are you working on?',
        suggestions: ['Form tips', 'Weight recommendations', 'Rep ranges'],
        metadata: { cached: false, responseTime: Date.now() - startTime }
      };
    }
    
    if (lowerMessage.includes('nutrition') || lowerMessage.includes('diet')) {
      return {
        message: 'Nutrition is crucial for fitness success! What aspect of nutrition would you like to discuss?',
        suggestions: ['Meal planning', 'Protein intake', 'Hydration'],
        metadata: { cached: false, responseTime: Date.now() - startTime }
      };
    }
    
    return {
      message: 'I\'m your AI fitness coach! I can help with workouts, nutrition, form tips, and motivation. What would you like to know?',
      suggestions: ['Start a workout', 'Nutrition advice', 'Exercise form'],
      metadata: { cached: false, responseTime: Date.now() - startTime }
    };
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