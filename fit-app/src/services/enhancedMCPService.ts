import { MCPContext, MCPResponse, ToolResult, MCPPlugin } from '../types/mcp';
import { mcpService } from './mcpService';
import { StreamController } from '../utils/streamController';

export interface StreamingMCPResponse extends MCPResponse {
  stream?: ReadableStream<string>;
  isStreaming: boolean;
}

export interface MCPConversationTurn {
  id: string;
  timestamp: Date;
  context: MCPContext;
  response: MCPResponse;
  tools_used: string[];
}

export interface MCPConversationState {
  id: string;
  turns: MCPConversationTurn[];
  metadata: {
    startTime: Date;
    lastUpdate: Date;
    totalTools: number;
    primaryIntent: string;
  };
}

export class EnhancedMCPService {
  private conversations = new Map<string, MCPConversationState>();
  private streamControllers = new Map<string, StreamController>();
  private contextCache = new Map<string, MCPContext>();
  private maxContextHistory = 10;

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    // Register additional enhanced tools
    await this.registerEnhancedTools();
  }

  private async registerEnhancedTools(): Promise<void> {
    // Real-time coaching tool
    mcpService.registerTool('realtime_coach', {
      name: 'realtime_coach',
      description: 'Provide real-time coaching with streaming responses',
      parameters: {
        activity: { type: 'string', required: true },
        metrics: { type: 'object', required: true },
        stream: { type: 'boolean', required: false }
      }
    }, this.realtimeCoachHandler.bind(this));

    // Adaptive workout tool
    mcpService.registerTool('adaptive_workout', {
      name: 'adaptive_workout',
      description: 'Adapt workout in real-time based on performance',
      parameters: {
        currentExercise: { type: 'string', required: true },
        performance: { type: 'object', required: true },
        fatigue: { type: 'number', required: true }
      }
    }, this.adaptiveWorkoutHandler.bind(this));

    // Nutrition camera analysis
    mcpService.registerTool('nutrition_camera', {
      name: 'nutrition_camera',
      description: 'Analyze food from camera with detailed macro breakdown',
      parameters: {
        image: { type: 'blob', required: true },
        mealType: { type: 'string', enum: ['breakfast', 'lunch', 'dinner', 'snack'], required: false }
      }
    }, this.nutritionCameraHandler.bind(this));

    // Recovery optimization
    mcpService.registerTool('recovery_optimizer', {
      name: 'recovery_optimizer',
      description: 'Optimize recovery based on biometric and workout data',
      parameters: {
        workoutIntensity: { type: 'number', required: true },
        biometrics: { type: 'object', required: true },
        sleepData: { type: 'object', required: false }
      }
    }, this.recoveryOptimizerHandler.bind(this));
  }

  // Enhanced context processing with streaming
  async processContextStreaming(
    context: Partial<MCPContext>,
    options: {
      stream?: boolean;
      conversationId?: string;
      includeHistory?: boolean;
    } = {}
  ): Promise<StreamingMCPResponse> {
    const conversationId = options.conversationId || `conv-${Date.now()}`;
    const fullContext = this.buildFullContext(context, conversationId, options.includeHistory);

    if (options.stream) {
      return await this.processWithStreaming(fullContext, conversationId);
    }

    const response = await mcpService.processContext(fullContext);
    this.updateConversation(conversationId, fullContext, response);

    return {
      ...response,
      isStreaming: false
    };
  }

  private buildFullContext(
    partialContext: Partial<MCPContext>,
    conversationId: string,
    includeHistory: boolean = true
  ): MCPContext {
    const conversation = this.conversations.get(conversationId);
    const history = includeHistory && conversation ? 
      this.summarizeHistory(conversation) : undefined;

    return {
      id: `ctx-${Date.now()}`,
      ...partialContext,
      metadata: {
        timestamp: new Date(),
        conversationId,
        history,
        ...partialContext.metadata
      }
    };
  }

  private summarizeHistory(conversation: MCPConversationState): any {
    const recentTurns = conversation.turns.slice(-5);
    return {
      turnCount: conversation.turns.length,
      recentTopics: recentTurns.map(t => t.response.content.substring(0, 50)),
      toolsUsed: [...new Set(recentTurns.flatMap(t => t.tools_used))],
      primaryIntent: conversation.metadata.primaryIntent
    };
  }

  private async processWithStreaming(
    context: MCPContext,
    conversationId: string
  ): Promise<StreamingMCPResponse> {
    const streamController = new StreamController();
    this.streamControllers.set(conversationId, streamController);

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Process context and get initial response
          const response = await mcpService.processContext(context);
          
          // Stream the response content
          const chunks = response.content.split(' ');
          for (const chunk of chunks) {
            controller.enqueue(chunk + ' ');
            await new Promise(resolve => setTimeout(resolve, 50)); // Simulate streaming
          }

          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },

      cancel() {
        streamController.abort();
      }
    });

    // Create initial response structure
    const response: StreamingMCPResponse = {
      content: '',
      context,
      tools_used: [],
      confidence: 0,
      stream,
      isStreaming: true
    };

    return response;
  }

  // Tool Handlers
  private async realtimeCoachHandler(params: any): Promise<ToolResult> {
    try {
      const { activity, metrics, stream } = params;
      
      // Analyze current performance
      const analysis = this.analyzePerformance(metrics);
      
      // Generate coaching cues
      const cues = this.generateRealtimeCues(activity, analysis);

      if (stream) {
        // Return streaming response
        return {
          success: true,
          data: {
            cues,
            stream: true,
            updateInterval: 5000 // Update every 5 seconds
          }
        };
      }

      return {
        success: true,
        data: { cues, analysis }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Realtime coaching failed'
      };
    }
  }

  private async adaptiveWorkoutHandler(params: any): Promise<ToolResult> {
    try {
      const { currentExercise, performance, fatigue } = params;
      
      // Determine if adaptation is needed
      const needsAdaptation = fatigue > 7 || performance.repsCompleted < performance.targetReps * 0.7;
      
      if (!needsAdaptation) {
        return {
          success: true,
          data: {
            recommendation: 'Continue as planned',
            adjustments: null
          }
        };
      }

      // Generate adaptations
      const adjustments = {
        reduceWeight: fatigue > 8,
        reduceSets: fatigue > 7,
        extendRest: true,
        alternativeExercise: this.suggestAlternative(currentExercise, fatigue),
        motivationalCue: this.getMotivationalMessage(performance, fatigue)
      };

      return {
        success: true,
        data: {
          recommendation: 'Adapt workout based on current state',
          adjustments,
          reasoning: `Fatigue level: ${fatigue}/10, Performance: ${Math.round((performance.repsCompleted / performance.targetReps) * 100)}%`
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Adaptive workout failed'
      };
    }
  }

  private async nutritionCameraHandler(params: any): Promise<ToolResult> {
    try {
      const { image, mealType } = params;
      
      // Simulate food recognition (in production, would use vision API)
      const recognizedFoods = [
        { name: 'Grilled Chicken', amount: '150g', confidence: 0.92 },
        { name: 'Brown Rice', amount: '200g', confidence: 0.88 },
        { name: 'Broccoli', amount: '100g', confidence: 0.85 }
      ];

      // Calculate nutritional information
      const nutrition = {
        calories: 485,
        protein: 42,
        carbs: 58,
        fat: 8,
        fiber: 6,
        micronutrients: {
          vitaminC: '80% DV',
          iron: '15% DV',
          calcium: '8% DV'
        }
      };

      // Generate recommendations
      const recommendations = this.generateNutritionRecommendations(nutrition, mealType);

      return {
        success: true,
        data: {
          recognizedFoods,
          nutrition,
          recommendations,
          mealScore: 8.5,
          healthNotes: [
            'Excellent protein content',
            'Good balance of macros',
            'Consider adding healthy fats'
          ]
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Nutrition analysis failed'
      };
    }
  }

  private async recoveryOptimizerHandler(params: any): Promise<ToolResult> {
    try {
      const { workoutIntensity, biometrics, sleepData } = params;
      
      // Calculate recovery score
      const recoveryScore = this.calculateRecoveryScore(workoutIntensity, biometrics, sleepData);
      
      // Generate recovery plan
      const recoveryPlan = {
        immediateActions: [
          'Hydrate with 500ml water + electrolytes',
          'Consume protein within 30 minutes',
          'Light stretching for 10 minutes'
        ],
        nextDayPlan: this.getNextDayPlan(recoveryScore),
        nutritionFocus: [
          'Increase protein to 1.6g/kg body weight',
          'Anti-inflammatory foods (berries, leafy greens)',
          'Adequate carbs for glycogen replenishment'
        ],
        sleepOptimization: this.getSleepRecommendations(sleepData),
        supplementSuggestions: this.getSupplementSuggestions(recoveryScore, biometrics)
      };

      return {
        success: true,
        data: {
          recoveryScore,
          recoveryPlan,
          estimatedRecoveryTime: `${Math.round(24 + (10 - recoveryScore) * 4)} hours`,
          nextWorkoutReadiness: recoveryScore > 7 ? 'ready' : 'light activity only'
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Recovery optimization failed'
      };
    }
  }

  // Helper methods
  private analyzePerformance(metrics: any): any {
    return {
      heartRateZone: this.calculateHeartRateZone(metrics.heartRate),
      formQuality: metrics.formScore || 85,
      fatigue: metrics.perceivedExertion || 5,
      efficiency: this.calculateEfficiency(metrics)
    };
  }

  private generateRealtimeCues(activity: string, analysis: any): string[] {
    const cues: string[] = [];
    
    if (analysis.heartRateZone > 4) {
      cues.push('Consider reducing intensity - you\'re in peak zone');
    }
    
    if (analysis.formQuality < 80) {
      cues.push('Focus on form - quality over quantity');
    }
    
    if (analysis.fatigue > 7) {
      cues.push('High fatigue detected - consider rest or lighter weight');
    }

    return cues.length > 0 ? cues : ['Great job! Maintain current pace'];
  }

  private calculateHeartRateZone(heartRate: number): number {
    // Simplified zone calculation
    const maxHR = 220 - 30; // Assuming age 30
    const percentage = (heartRate / maxHR) * 100;
    
    if (percentage < 50) return 1;
    if (percentage < 60) return 2;
    if (percentage < 70) return 3;
    if (percentage < 80) return 4;
    return 5;
  }

  private calculateEfficiency(metrics: any): number {
    // Simple efficiency calculation
    const targetMet = (metrics.repsCompleted / metrics.targetReps) * 100;
    const formPenalty = (100 - (metrics.formScore || 85)) / 2;
    return Math.max(0, Math.min(100, targetMet - formPenalty));
  }

  private suggestAlternative(exercise: string, fatigue: number): string {
    // Simple alternative suggestions
    const alternatives: { [key: string]: string } = {
      'barbell squat': 'goblet squat',
      'deadlift': 'romanian deadlift',
      'bench press': 'dumbbell press',
      'pull-up': 'lat pulldown'
    };
    
    return alternatives[exercise.toLowerCase()] || 'bodyweight variation';
  }

  private getMotivationalMessage(performance: any, fatigue: number): string {
    if (fatigue > 8) {
      return 'Listen to your body - rest is part of progress!';
    }
    
    if (performance.repsCompleted >= performance.targetReps) {
      return 'Crushing it! Consider increasing weight next set';
    }
    
    return 'Stay focused - every rep counts!';
  }

  private generateNutritionRecommendations(nutrition: any, mealType?: string): string[] {
    const recommendations: string[] = [];
    
    if (nutrition.protein < 30) {
      recommendations.push('Consider adding more protein for muscle recovery');
    }
    
    if (nutrition.fiber < 5) {
      recommendations.push('Add more vegetables or whole grains for fiber');
    }
    
    if (mealType === 'pre-workout' && nutrition.carbs < 40) {
      recommendations.push('Increase carbs for better workout energy');
    }
    
    return recommendations;
  }

  private calculateRecoveryScore(intensity: number, biometrics: any, sleep?: any): number {
    let score = 10;
    
    // Deduct based on workout intensity
    score -= (intensity / 10) * 2;
    
    // Adjust based on HRV
    if (biometrics.hrv < 50) score -= 2;
    
    // Adjust based on sleep
    if (sleep && sleep.duration < 7) score -= 1;
    if (sleep && sleep.quality < 70) score -= 1;
    
    return Math.max(0, Math.min(10, score));
  }

  private getNextDayPlan(recoveryScore: number): string[] {
    if (recoveryScore < 5) {
      return [
        'Rest day or light yoga',
        'Focus on mobility work',
        'Prioritize sleep (8+ hours)'
      ];
    }
    
    if (recoveryScore < 7) {
      return [
        'Light cardio or technique work',
        'Reduced volume training',
        'Active recovery activities'
      ];
    }
    
    return [
      'Normal training can resume',
      'Consider progressive overload',
      'Monitor fatigue levels'
    ];
  }

  private getSleepRecommendations(sleepData?: any): string[] {
    const recommendations: string[] = [
      'Maintain consistent sleep schedule',
      'Create cool, dark sleeping environment'
    ];
    
    if (sleepData && sleepData.duration < 7) {
      recommendations.push('Aim for 7-9 hours of sleep');
    }
    
    return recommendations;
  }

  private getSupplementSuggestions(recoveryScore: number, biometrics: any): string[] {
    const suggestions: string[] = [];
    
    if (recoveryScore < 6) {
      suggestions.push('Magnesium for muscle recovery');
      suggestions.push('Omega-3 for inflammation');
    }
    
    if (biometrics.stressLevel > 7) {
      suggestions.push('Ashwagandha for stress management');
    }
    
    suggestions.push('Creatine for strength and recovery');
    
    return suggestions;
  }

  // Conversation management
  private updateConversation(
    conversationId: string,
    context: MCPContext,
    response: MCPResponse
  ): void {
    const conversation = this.conversations.get(conversationId) || {
      id: conversationId,
      turns: [],
      metadata: {
        startTime: new Date(),
        lastUpdate: new Date(),
        totalTools: 0,
        primaryIntent: this.detectPrimaryIntent(context)
      }
    };

    const turn: MCPConversationTurn = {
      id: `turn-${Date.now()}`,
      timestamp: new Date(),
      context,
      response,
      tools_used: response.tools_used
    };

    conversation.turns.push(turn);
    conversation.metadata.lastUpdate = new Date();
    conversation.metadata.totalTools += response.tools_used.length;

    // Maintain max history
    if (conversation.turns.length > this.maxContextHistory) {
      conversation.turns = conversation.turns.slice(-this.maxContextHistory);
    }

    this.conversations.set(conversationId, conversation);
  }

  private detectPrimaryIntent(context: MCPContext): string {
    if (context.text) {
      const text = context.text.toLowerCase();
      if (text.includes('workout') || text.includes('exercise')) return 'workout';
      if (text.includes('nutrition') || text.includes('food')) return 'nutrition';
      if (text.includes('recovery') || text.includes('rest')) return 'recovery';
      if (text.includes('progress') || text.includes('track')) return 'progress';
    }
    
    return 'general';
  }

  // Public methods
  getConversation(conversationId: string): MCPConversationState | undefined {
    return this.conversations.get(conversationId);
  }

  clearConversation(conversationId: string): void {
    this.conversations.delete(conversationId);
    const controller = this.streamControllers.get(conversationId);
    if (controller) {
      controller.abort();
      this.streamControllers.delete(conversationId);
    }
  }

  exportConversation(conversationId: string): any {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) return null;

    return {
      ...conversation,
      export_date: new Date(),
      summary: this.generateConversationSummary(conversation)
    };
  }

  private generateConversationSummary(conversation: MCPConversationState): any {
    return {
      duration: new Date().getTime() - conversation.metadata.startTime.getTime(),
      totalTurns: conversation.turns.length,
      toolsUsed: [...new Set(conversation.turns.flatMap(t => t.tools_used))],
      topics: this.extractTopics(conversation),
      outcomes: this.extractOutcomes(conversation)
    };
  }

  private extractTopics(conversation: MCPConversationState): string[] {
    // Simple topic extraction
    const topics = new Set<string>();
    conversation.turns.forEach(turn => {
      turn.tools_used.forEach(tool => {
        topics.add(tool.replace(/_/g, ' '));
      });
    });
    return Array.from(topics);
  }

  private extractOutcomes(conversation: MCPConversationState): string[] {
    // Extract key outcomes from conversation
    const outcomes: string[] = [];
    conversation.turns.forEach(turn => {
      if (turn.tools_used.includes('generate_workout')) {
        outcomes.push('Generated personalized workout plan');
      }
      if (turn.tools_used.includes('analyze_nutrition')) {
        outcomes.push('Analyzed nutritional content');
      }
      if (turn.tools_used.includes('track_progress')) {
        outcomes.push('Reviewed fitness progress');
      }
    });
    return outcomes;
  }
}

// Singleton instance
export const enhancedMCPService = new EnhancedMCPService();