import type { WorkoutContext, AIRequestType } from '../types';
import { fixedAIService } from './fixedAIService';
import { AICoachService } from './aiService';
import { enhancedAIService } from './enhancedAIService';
import { productionAI } from './productionAIService';
import { IntelligentAIService } from './intelligentAIService';

interface AIResponse {
  content: string;
  type: AIRequestType;
  confidence: number;
  timestamp: Date;
  isComplete: boolean;
  provider?: string;
  metadata?: any;
}

interface UnifiedAIConfig {
  enableAllServices: boolean;
  priorityOrder: string[];
  fallbackEnabled: boolean;
}

/**
 * UnifiedAIService - Coordinates all AI services to work together
 * Provides intelligent fallback and load balancing between services
 */
class UnifiedAIService {
  private services: Map<string, any> = new Map();
  private initialized = false;
  private config: UnifiedAIConfig = {
    enableAllServices: true,
    priorityOrder: ['fixed', 'production', 'enhanced', 'team', 'intelligent', 'fallback'],
    fallbackEnabled: true
  };

  constructor() {
    this.initialize();
  }

  private async initialize() {
    if (this.initialized) return;

    console.log('🚀 Initializing Unified AI Service...');

    // Register all available AI services
    try {
      // 1. Fixed AI Service (with BMI calculator and API key validation)
      this.services.set('fixed', fixedAIService);
      console.log('✅ Fixed AI Service registered');
    } catch (error) {
      console.warn('⚠️ Fixed AI Service not available:', error);
    }

    try {
      // 2. Production AI Service (with circuit breakers and monitoring)
      if (productionAI) {
        this.services.set('production', productionAI);
        console.log('✅ Production AI Service registered');
      }
    } catch (error) {
      console.warn('⚠️ Production AI Service not available:', error);
    }

    try {
      // 3. Enhanced AI Service (with semantic analysis)
      if (enhancedAIService) {
        this.services.set('enhanced', enhancedAIService);
        console.log('✅ Enhanced AI Service registered');
      }
    } catch (error) {
      console.warn('⚠️ Enhanced AI Service not available:', error);
    }

    try {
      // 4. Team AI Service (from AICoachService)
      const aiCoach = AICoachService.getInstance();
      if (aiCoach) {
        this.services.set('team', aiCoach);
        console.log('✅ Team AI Service registered');
      }
    } catch (error) {
      console.warn('⚠️ Team AI Service not available:', error);
    }

    try {
      // 5. Intelligent AI Service
      const intelligentService = new IntelligentAIService();
      this.services.set('intelligent', intelligentService);
      console.log('✅ Intelligent AI Service registered');
    } catch (error) {
      console.warn('⚠️ Intelligent AI Service not available:', error);
    }

    console.log(`🎯 Unified AI Service ready with ${this.services.size} providers`);
    this.initialized = true;
  }

  /**
   * Main method to get AI response - tries all services in priority order
   */
  async getCoachingResponse(
    query: string,
    context: WorkoutContext,
    requestType: AIRequestType = 'general'
  ): Promise<AIResponse> {
    await this.initialize();

    console.log('🤖 Unified AI Request:', {
      query: query.substring(0, 50) + '...',
      type: requestType,
      availableServices: Array.from(this.services.keys())
    });

    // Try services in priority order
    for (const serviceName of this.config.priorityOrder) {
      const service = this.services.get(serviceName);
      if (!service) continue;

      try {
        console.log(`🎯 Trying ${serviceName} service...`);
        
        let response: AIResponse;
        
        // Call the appropriate method based on service type
        switch (serviceName) {
          case 'fixed':
            response = await service.getCoachingResponse(query, context, requestType);
            break;
            
          case 'production':
            const prodResponse = await service.sendMessage(query, { context, type: requestType });
            response = this.formatResponse(prodResponse, requestType, serviceName);
            break;
            
          case 'enhanced':
            const enhancedResponse = await service.sendMessage(query, { requestType });
            response = this.formatResponse(enhancedResponse, requestType, serviceName);
            break;
            
          case 'team':
            response = await service.getCoachingResponse(query, context, requestType);
            break;
            
          case 'intelligent':
            const intelligentResponse = await service.getIntelligentResponse(query, { context, requestType });
            response = this.formatResponse(intelligentResponse, requestType, serviceName);
            break;
            
          default:
            continue;
        }

        if (response && response.content) {
          console.log(`✅ Success with ${serviceName} service`);
          return response;
        }
      } catch (error) {
        console.warn(`❌ ${serviceName} service failed:`, error);
        continue;
      }
    }

    // All services failed - use intelligent fallback
    console.log('🔄 All services failed, using unified fallback');
    return this.getUnifiedFallback(query, requestType);
  }

  /**
   * Format various service responses into unified format
   */
  private formatResponse(
    rawResponse: any,
    requestType: AIRequestType,
    provider: string
  ): AIResponse {
    // Handle different response formats
    let content = '';
    
    if (typeof rawResponse === 'string') {
      content = rawResponse;
    } else if (rawResponse?.content) {
      content = rawResponse.content;
    } else if (rawResponse?.text) {
      content = rawResponse.text;
    } else if (rawResponse?.message) {
      content = rawResponse.message;
    } else if (rawResponse?.response) {
      content = rawResponse.response;
    }

    return {
      content: content || 'No response generated',
      type: requestType,
      confidence: rawResponse?.confidence || 0.8,
      timestamp: new Date(),
      isComplete: true,
      provider: provider,
      metadata: rawResponse?.metadata || {}
    };
  }

  /**
   * Unified fallback with all domain knowledge
   */
  private getUnifiedFallback(query: string, requestType: AIRequestType): AIResponse {
    const lowerQuery = query.toLowerCase();
    let response = '';

    // BMI Calculator
    if (lowerQuery.includes('bmi') || lowerQuery.includes('body mass')) {
      response = `To calculate your BMI (Body Mass Index), I need your height and weight!

📊 **BMI Formula**: BMI = weight (kg) ÷ [height (m)]²

**How to provide your info:**
• "I'm 5'8" and weigh 150 pounds"
• "I'm 175cm and 70kg"

**BMI Categories:**
• Underweight: Below 18.5
• Normal: 18.5-24.9  
• Overweight: 25-29.9
• Obese: 30+

Just tell me your height and weight, and I'll calculate it for you! 📏⚖️`;
    }
    // Motivation
    else if (requestType === 'motivation' || lowerQuery.includes('motivat') || lowerQuery.includes('tired')) {
      const motivations = [
        "You've got this! 💪 Every workout brings you closer to your goals. The hardest part is showing up, and you're already here!",
        "Remember why you started! Your future self will thank you for not giving up today. Push through - greatness is on the other side of this workout!",
        "Champions are made when nobody's watching. This is your moment to prove yourself. Let's finish strong! 🔥",
        "Feeling tired? That's your body changing! Embrace the challenge - you're becoming stronger with every rep!"
      ];
      response = motivations[Math.floor(Math.random() * motivations.length)];
    }
    // Form Analysis
    else if (requestType === 'form-analysis' || lowerQuery.includes('form') || lowerQuery.includes('technique')) {
      response = `Perfect form is everything! Here's what to focus on:

🎯 **Key Form Principles:**
• **Control**: Move slowly, especially on the negative
• **Range**: Full range of motion for maximum benefit
• **Breathing**: Exhale on exertion, inhale on release
• **Mind-Muscle**: Focus on the muscle you're working

💡 Start light, master the movement, then add weight!`;
    }
    // Nutrition
    else if (requestType === 'nutrition' || lowerQuery.includes('eat') || lowerQuery.includes('diet')) {
      response = `Here's your nutrition game plan:

🥗 **Pre-Workout** (1-2 hours before):
• Complex carbs (oats, banana)
• Light protein
• Stay hydrated

🍗 **Post-Workout** (within 30-60 min):
• Protein (20-30g)
• Fast carbs to replenish
• Electrolytes

💪 **Daily Goals**:
• Protein: 0.8-1g per lb bodyweight
• Water: Half your bodyweight in ounces
• Colorful veggies with every meal`;
    }
    // Workout Planning
    else if (lowerQuery.includes('workout') || lowerQuery.includes('routine') || lowerQuery.includes('program')) {
      response = `Let's build your perfect workout plan:

📋 **Beginner (3x/week)**:
• Full body workouts
• Compound movements (squats, bench, rows)
• 3 sets x 8-12 reps

📈 **Intermediate (4-5x/week)**:
• Upper/Lower or Push/Pull/Legs split
• Mix compound and isolation
• Progressive overload weekly

🎯 **Key Principles**:
• Rest 48hrs between same muscle groups
• Track your progress
• Deload every 4-6 weeks`;
    }
    // Default
    else {
      response = `I'm your unified AI fitness coach! 🏋️‍♂️ I can help with:

• 📊 **BMI Calculator** - Tell me your height & weight
• 💪 **Workout Plans** - Customized to your goals
• 🥗 **Nutrition Advice** - Pre/post workout & daily
• 🎯 **Form Analysis** - Perfect your technique
• 🔥 **Motivation** - Keep you pushing forward

What would you like to focus on today?`;
    }

    return {
      content: response,
      type: requestType,
      confidence: 0.85,
      timestamp: new Date(),
      isComplete: true,
      provider: 'unified_fallback',
      metadata: { 
        fallback: true, 
        servicesAvailable: this.services.size,
        reason: 'all_services_failed' 
      }
    };
  }

  /**
   * Get status of all AI services
   */
  getServicesStatus(): Record<string, boolean> {
    const status: Record<string, boolean> = {};
    
    this.services.forEach((service, name) => {
      status[name] = service !== null && service !== undefined;
    });
    
    return status;
  }

  /**
   * Health check for all services
   */
  async healthCheck(): Promise<Record<string, any>> {
    const health: Record<string, any> = {};
    
    for (const [name, service] of this.services) {
      try {
        // Quick test for each service
        const testQuery = 'Hello';
        const start = Date.now();
        
        if (name === 'fixed' && service.getCoachingResponse) {
          await service.getCoachingResponse(testQuery, {}, 'general');
          health[name] = { status: 'healthy', responseTime: Date.now() - start };
        } else if (service.sendMessage) {
          await service.sendMessage(testQuery);
          health[name] = { status: 'healthy', responseTime: Date.now() - start };
        } else {
          health[name] = { status: 'unknown', reason: 'no test method' };
        }
      } catch (error) {
        health[name] = { 
          status: 'unhealthy', 
          error: error instanceof Error ? error.message : 'Unknown error' 
        };
      }
    }
    
    return health;
  }
}

// Export singleton instance
export const unifiedAIService = new UnifiedAIService();
export default unifiedAIService;