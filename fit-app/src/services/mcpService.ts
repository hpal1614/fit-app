import { MCPContext, MCPResponse, ToolSchema, ToolResult, MCPPlugin, ToolHandler } from '../types/mcp';
import { WorkoutService } from './workoutService';
import { DatabaseService } from './databaseService';
import { BiometricService } from './biometricService';

export class MCPService {
  private tools = new Map<string, ToolHandler>();
  private plugins = new Map<string, MCPPlugin>();
  private initialized = false;
  private contextStore = new Map<string, MCPContext>();
  
  // Services
  private workoutService: WorkoutService;
  private databaseService: DatabaseService;
  private biometricService: BiometricService;

  constructor() {
    this.workoutService = new WorkoutService();
    this.databaseService = new DatabaseService();
    this.biometricService = new BiometricService();
    this.initialize();
  }

  private async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Register built-in fitness tools
      await this.registerBuiltInTools();
      
      this.initialized = true;
      console.log('MCP Service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize MCP service:', error);
    }
  }

  private async registerBuiltInTools(): Promise<void> {
    // Form analysis tool
    this.registerTool('analyze_form', {
      name: 'analyze_form',
      description: 'Analyze exercise form from camera feed',
      parameters: {
        exercise: { type: 'string', required: true },
        image: { type: 'blob', required: true }
      }
    }, this.analyzeFormHandler.bind(this));

    // Workout generation tool
    this.registerTool('generate_workout', {
      name: 'generate_workout',
      description: 'Generate personalized workout based on user parameters',
      parameters: {
        fitnessLevel: { type: 'string', enum: ['beginner', 'intermediate', 'advanced'], required: true },
        goals: { type: 'array', required: true },
        duration: { type: 'number', required: true },
        equipment: { type: 'array', required: false }
      }
    }, this.generateWorkoutHandler.bind(this));

    // Nutrition analysis tool
    this.registerTool('analyze_nutrition', {
      name: 'analyze_nutrition',
      description: 'Analyze food image or text for nutritional content',
      parameters: {
        input: { type: 'string', required: false },
        image: { type: 'blob', required: false }
      }
    }, this.analyzeNutritionHandler.bind(this));

    // Biometric monitoring tool
    this.registerTool('monitor_biometrics', {
      name: 'monitor_biometrics',
      description: 'Get current biometric readings and recommendations',
      parameters: {
        metrics: { type: 'array', enum: ['heart_rate', 'hrv', 'sleep', 'recovery'], required: true }
      }
    }, this.monitorBiometricsHandler.bind(this));

    // Voice coaching tool
    this.registerTool('voice_coach', {
      name: 'voice_coach',
      description: 'Provide real-time voice coaching during workout',
      parameters: {
        exercise: { type: 'string', required: true },
        phase: { type: 'string', enum: ['warmup', 'working', 'rest', 'cooldown'], required: true },
        metrics: { type: 'object', required: false }
      }
    }, this.voiceCoachHandler.bind(this));

    // Exercise recommendation tool
    this.registerTool('recommend_exercises', {
      name: 'recommend_exercises',
      description: 'Recommend exercises based on muscle groups and equipment',
      parameters: {
        muscleGroups: { type: 'array', required: true },
        equipment: { type: 'array', required: false },
        difficulty: { type: 'string', enum: ['beginner', 'intermediate', 'advanced'], required: false }
      }
    }, this.recommendExercisesHandler.bind(this));

    // Progress tracking tool
    this.registerTool('track_progress', {
      name: 'track_progress',
      description: 'Track and analyze workout progress',
      parameters: {
        metric: { type: 'string', enum: ['strength', 'endurance', 'weight', 'measurements'], required: true },
        timeframe: { type: 'string', enum: ['week', 'month', '3months', 'year'], required: false }
      }
    }, this.trackProgressHandler.bind(this));
  }

  // Tool Handlers
  private async analyzeFormHandler(params: any): Promise<ToolResult> {
    try {
      // Implementation for form analysis
      // This would integrate with pose detection service
      return {
        success: true,
        data: {
          exercise: params.exercise,
          formScore: 85,
          corrections: [
            'Keep your back straight',
            'Lower your hips slightly',
            'Maintain neutral spine'
          ],
          goodPoints: [
            'Good knee alignment',
            'Proper breathing pattern'
          ]
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Form analysis failed'
      };
    }
  }

  private async generateWorkoutHandler(params: any): Promise<ToolResult> {
    try {
      const workout = await this.workoutService.generateWorkout({
        fitnessLevel: params.fitnessLevel,
        goals: params.goals,
        duration: params.duration,
        equipment: params.equipment || []
      });

      return {
        success: true,
        data: workout
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Workout generation failed'
      };
    }
  }

  private async analyzeNutritionHandler(params: any): Promise<ToolResult> {
    try {
      // Placeholder for nutrition analysis
      return {
        success: true,
        data: {
          calories: 450,
          protein: 35,
          carbs: 45,
          fat: 15,
          fiber: 8,
          suggestions: [
            'Add more vegetables for fiber',
            'Good protein content',
            'Consider reducing simple carbs'
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

  private async monitorBiometricsHandler(params: any): Promise<ToolResult> {
    try {
      const biometrics = await this.biometricService.getCurrentMetrics(params.metrics);
      
      return {
        success: true,
        data: biometrics
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Biometric monitoring failed'
      };
    }
  }

  private async voiceCoachHandler(params: any): Promise<ToolResult> {
    try {
      // Generate coaching cues based on exercise and phase
      const cues = this.generateCoachingCues(params.exercise, params.phase, params.metrics);
      
      return {
        success: true,
        data: {
          cues,
          encouragement: this.getEncouragement(params.phase),
          nextPhase: this.getNextPhase(params.phase)
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Voice coaching failed'
      };
    }
  }

  private async recommendExercisesHandler(params: any): Promise<ToolResult> {
    try {
      const exercises = await this.workoutService.recommendExercises({
        muscleGroups: params.muscleGroups,
        equipment: params.equipment || [],
        difficulty: params.difficulty || 'intermediate'
      });

      return {
        success: true,
        data: exercises
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Exercise recommendation failed'
      };
    }
  }

  private async trackProgressHandler(params: any): Promise<ToolResult> {
    try {
      const progress = await this.databaseService.getProgress({
        metric: params.metric,
        timeframe: params.timeframe || 'month'
      });

      return {
        success: true,
        data: progress
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Progress tracking failed'
      };
    }
  }

  // Helper methods
  private generateCoachingCues(exercise: string, phase: string, metrics?: any): string[] {
    const cues: string[] = [];
    
    switch (phase) {
      case 'warmup':
        cues.push('Start with light weight to warm up your muscles');
        cues.push('Focus on full range of motion');
        break;
      case 'working':
        cues.push('Maintain proper form throughout the movement');
        cues.push('Control the weight on both concentric and eccentric phases');
        break;
      case 'rest':
        cues.push('Take deep breaths to recover');
        cues.push('Stay hydrated');
        break;
      case 'cooldown':
        cues.push('Slow down the pace');
        cues.push('Focus on stretching the worked muscles');
        break;
    }

    return cues;
  }

  private getEncouragement(phase: string): string {
    const encouragements = {
      warmup: "Great start! Let's prepare your body for an amazing workout.",
      working: "You're doing fantastic! Keep pushing, you've got this!",
      rest: "Good job! Use this time to recover and prepare for the next set.",
      cooldown: "Excellent work today! Let's cool down properly."
    };
    
    return encouragements[phase as keyof typeof encouragements] || "Keep it up!";
  }

  private getNextPhase(currentPhase: string): string {
    const phaseOrder = ['warmup', 'working', 'rest', 'cooldown'];
    const currentIndex = phaseOrder.indexOf(currentPhase);
    
    if (currentIndex === -1 || currentIndex === phaseOrder.length - 1) {
      return 'complete';
    }
    
    return phaseOrder[currentIndex + 1];
  }

  // Public API
  public registerTool(name: string, schema: ToolSchema, handler: ToolHandler): void {
    this.tools.set(name, handler);
    console.log(`Registered tool: ${name}`);
  }

  public async executeTool(toolName: string, parameters: any): Promise<ToolResult> {
    const handler = this.tools.get(toolName);
    
    if (!handler) {
      return {
        success: false,
        error: `Tool '${toolName}' not found`
      };
    }

    try {
      return await handler(parameters);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Tool execution failed'
      };
    }
  }

  public async processContext(context: MCPContext): Promise<MCPResponse> {
    // Store context for reference
    this.contextStore.set(context.id, context);

    // Determine which tools to use based on context
    const toolsToUse: string[] = [];
    const toolResults: ToolResult[] = [];

    // Analyze context and determine appropriate tools
    if (context.image) {
      // If image is present, might be form analysis or nutrition
      if (context.metadata.workoutState) {
        toolsToUse.push('analyze_form');
      } else {
        toolsToUse.push('analyze_nutrition');
      }
    }

    if (context.text) {
      // Parse text for intent
      const text = context.text.toLowerCase();
      
      if (text.includes('workout') || text.includes('exercise')) {
        toolsToUse.push('generate_workout');
      }
      if (text.includes('form') || text.includes('technique')) {
        toolsToUse.push('analyze_form');
      }
      if (text.includes('progress') || text.includes('track')) {
        toolsToUse.push('track_progress');
      }
      if (text.includes('heart') || text.includes('biometric')) {
        toolsToUse.push('monitor_biometrics');
      }
    }

    // Execute selected tools
    for (const tool of toolsToUse) {
      const result = await this.executeTool(tool, context);
      toolResults.push(result);
    }

    // Compile response
    const response: MCPResponse = {
      content: this.generateResponseContent(toolResults),
      context,
      tools_used: toolsToUse,
      confidence: this.calculateConfidence(toolResults)
    };

    return response;
  }

  private generateResponseContent(results: ToolResult[]): string {
    const successfulResults = results.filter(r => r.success);
    
    if (successfulResults.length === 0) {
      return "I encountered some issues processing your request. Please try again.";
    }

    // Combine results into coherent response
    let content = "";
    
    for (const result of successfulResults) {
      if (result.data) {
        content += this.formatResultData(result.data) + "\n\n";
      }
    }

    return content.trim();
  }

  private formatResultData(data: any): string {
    // Format data based on its structure
    if (typeof data === 'string') {
      return data;
    }
    
    if (Array.isArray(data)) {
      return data.join('\n');
    }
    
    if (typeof data === 'object') {
      return JSON.stringify(data, null, 2);
    }
    
    return String(data);
  }

  private calculateConfidence(results: ToolResult[]): number {
    if (results.length === 0) return 0;
    
    const successCount = results.filter(r => r.success).length;
    return (successCount / results.length) * 100;
  }

  public async registerPlugin(plugin: MCPPlugin): Promise<void> {
    await plugin.initialize();
    this.plugins.set(plugin.id, plugin);
    
    // Register plugin tools
    for (const tool of plugin.tools) {
      this.registerTool(tool.name, tool, async (params) => {
        return await plugin.execute(tool.name, params);
      });
    }
    
    console.log(`Registered plugin: ${plugin.name} v${plugin.version}`);
  }

  public getAvailableTools(): ToolSchema[] {
    const tools: ToolSchema[] = [];
    
    // Add built-in tools
    const builtInTools = [
      'analyze_form',
      'generate_workout',
      'analyze_nutrition',
      'monitor_biometrics',
      'voice_coach',
      'recommend_exercises',
      'track_progress'
    ];
    
    for (const toolName of builtInTools) {
      // In a real implementation, we'd store schemas separately
      tools.push({
        name: toolName,
        description: `Built-in tool: ${toolName}`,
        parameters: {}
      });
    }
    
    // Add plugin tools
    for (const plugin of this.plugins.values()) {
      tools.push(...plugin.tools);
    }
    
    return tools;
  }

  public clearContext(contextId: string): void {
    this.contextStore.delete(contextId);
  }

  public getContext(contextId: string): MCPContext | undefined {
    return this.contextStore.get(contextId);
  }
}

// Singleton instance
export const mcpService = new MCPService();