import { ragService } from './RAGService';
import { enhancedAIService } from './EnhancedAIService';
import { ConversationContext, StreamingMessage } from './ConversationManager';

interface IntelligentResponse {
  content: string;
  sources: string[];
  confidence: number;
  suggestions: string[];
}

export class IntelligentAIService {
  private ragInitialized = false;

  async initialize() {
    if (!this.ragInitialized) {
      await ragService.initialize();
      this.ragInitialized = true;
    }
  }

  async processQueryWithRAG(
    query: string,
    context: ConversationContext,
    onChunk?: (chunk: string) => void,
    onComplete?: (response: StreamingMessage) => void,
    onError?: (error: Error) => void
  ): Promise<IntelligentResponse> {
    try {
      await this.initialize();

      // First, search the knowledge base
      const { response: ragResponse, sources } = await ragService.generateContextualResponse(
        query,
        context
      );

      // Analyze the query to determine the type of response needed
      const queryType = this.analyzeQueryType(query);
      
      // Build enhanced prompt with RAG context
      const enhancedPrompt = this.buildEnhancedPrompt(query, ragResponse, queryType, context);

      // Stream the response using the enhanced AI service
      let fullResponse = '';
      
      await enhancedAIService.streamResponse(
        enhancedPrompt,
        context,
        (chunk) => {
          fullResponse = chunk;
          onChunk?.(chunk);
        },
        (completeMessage) => {
          onComplete?.(completeMessage);
        },
        onError || ((error) => console.error('AI Error:', error))
      );

      // Generate follow-up suggestions
      const suggestions = this.generateSuggestions(query, queryType, sources);

      return {
        content: fullResponse || ragResponse,
        sources: sources.map(s => `${s.item.type}: ${s.item.id}`),
        confidence: sources[0]?.score || 0.5,
        suggestions
      };
    } catch (error) {
      onError?.(error as Error);
      throw error;
    }
  }

  private analyzeQueryType(query: string): string {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('how to') || lowerQuery.includes('form') || lowerQuery.includes('perform')) {
      return 'instruction';
    } else if (lowerQuery.includes('workout') || lowerQuery.includes('routine') || lowerQuery.includes('program')) {
      return 'programming';
    } else if (lowerQuery.includes('eat') || lowerQuery.includes('nutrition') || lowerQuery.includes('diet')) {
      return 'nutrition';
    } else if (lowerQuery.includes('why') || lowerQuery.includes('benefit') || lowerQuery.includes('science')) {
      return 'explanation';
    } else if (lowerQuery.includes('pain') || lowerQuery.includes('injury') || lowerQuery.includes('hurt')) {
      return 'safety';
    } else {
      return 'general';
    }
  }

  private buildEnhancedPrompt(
    query: string,
    ragContext: string,
    queryType: string,
    conversationContext: ConversationContext
  ): string {
    let prompt = `You are an expert fitness coach with access to a comprehensive knowledge base. `;
    
    switch (queryType) {
      case 'instruction':
        prompt += `Provide clear, step-by-step instructions. Focus on proper form and safety. `;
        break;
      case 'programming':
        prompt += `Create a structured workout plan based on scientific principles. Include sets, reps, and progression. `;
        break;
      case 'nutrition':
        prompt += `Give evidence-based nutrition advice. Include practical tips and meal suggestions. `;
        break;
      case 'safety':
        prompt += `Prioritize safety and injury prevention. Recommend seeing a healthcare professional if needed. `;
        break;
    }

    prompt += `\n\nRelevant Knowledge:\n${ragContext}\n\n`;
    prompt += `User Question: ${query}\n\n`;
    prompt += `Provide a helpful, accurate response based on the knowledge provided. Be specific and actionable.`;

    return prompt;
  }

  private generateSuggestions(query: string, queryType: string, sources: any[]): string[] {
    const suggestions: string[] = [];

    // Type-specific suggestions
    switch (queryType) {
      case 'instruction':
        suggestions.push('Show me common mistakes to avoid');
        suggestions.push('What are the variations of this exercise?');
        suggestions.push('How do I progress this movement?');
        break;
      case 'programming':
        suggestions.push('Create a weekly workout schedule');
        suggestions.push('How do I track progress?');
        suggestions.push('What about rest and recovery?');
        break;
      case 'nutrition':
        suggestions.push('What are good protein sources?');
        suggestions.push('How should I time my meals?');
        suggestions.push('Calculate my daily calorie needs');
        break;
      case 'safety':
        suggestions.push('What are safe alternatives?');
        suggestions.push('How long should recovery take?');
        suggestions.push('When should I see a doctor?');
        break;
      default:
        suggestions.push('Tell me more about this topic');
        suggestions.push('Give me a practical example');
        suggestions.push('What are the key principles?');
    }

    // Add source-based suggestions if available
    if (sources.length > 0 && sources[0].item.type === 'exercise') {
      suggestions.push('Show me similar exercises');
    }

    return suggestions.slice(0, 3);
  }

  // Specialized methods for different fitness queries
  async getExerciseGuidance(exerciseName: string): Promise<IntelligentResponse> {
    const query = `How to perform ${exerciseName} with proper form`;
    return this.processQueryWithRAG(query, {} as ConversationContext);
  }

  async createWorkoutPlan(goal: string, experience: string, equipment: string[]): Promise<IntelligentResponse> {
    const query = `Create a ${experience} level workout plan for ${goal} using ${equipment.join(', ')}`;
    return this.processQueryWithRAG(query, {} as ConversationContext);
  }

  async getNutritionPlan(goal: string, restrictions: string[]): Promise<IntelligentResponse> {
    const query = `Create a nutrition plan for ${goal} with these restrictions: ${restrictions.join(', ')}`;
    return this.processQueryWithRAG(query, {} as ConversationContext);
  }

  async analyzeFormFromDescription(description: string): Promise<IntelligentResponse> {
    const query = `Analyze this exercise form: ${description}. What corrections are needed?`;
    return this.processQueryWithRAG(query, {} as ConversationContext);
  }
}

// Export singleton instance
export const intelligentAIService = new IntelligentAIService();