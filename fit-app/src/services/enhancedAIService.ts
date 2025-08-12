import { conversationGraph } from './conversationGraph';
import { UserProfile, WorkoutContext, FitnessGoals } from '../types';

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

export class EnhancedAIService {
  private initialized = false;
  private userProfile: UserProfile = {};
  private workoutContext: WorkoutContext = {};
  private fitnessGoals: FitnessGoals = {};
  private conversationHistory: any[] = [];

  async initialize(): Promise<void> {
    try {
      console.log('🚀 Initializing Enhanced AI Service...');
      this.initialized = true;
      console.log('✅ Enhanced AI Service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize AI service:', error);
    }
  }

  async sendMessage(message: string): Promise<AIResponse> {
    const startTime = Date.now();
    
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      // Process through conversation graph
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

      // Keep history manageable (last 20 messages)
      if (this.conversationHistory.length > 20) {
        this.conversationHistory = this.conversationHistory.slice(-20);
      }

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

  private extractSuggestions(response: string): string[] {
    // Simple suggestion extraction
    const suggestions = [
      'Tell me about your workout goals',
      'Ask about proper form',
      'Get nutrition advice',
      'Plan your next workout'
    ];
    
    return suggestions.slice(0, 2); // Return 2 random suggestions
  }

  updateUserProfile(profile: Partial<UserProfile>) {
    this.userProfile = { ...this.userProfile, ...profile };
  }

  updateWorkoutContext(context: Partial<WorkoutContext>) {
    this.workoutContext = { ...this.workoutContext, ...context };
  }

  updateFitnessGoals(goals: Partial<FitnessGoals>) {
    this.fitnessGoals = { ...this.fitnessGoals, ...goals };
  }

  getConversationHistory() {
    return [...this.conversationHistory];
  }

  clearConversationHistory() {
    this.conversationHistory = [];
  }

  async invalidateCache(pattern: string) {
    console.log('Cache invalidation requested for pattern:', pattern);
    // Placeholder for cache invalidation
  }
}

// Export singleton instance
export const enhancedAIService = new EnhancedAIService();
