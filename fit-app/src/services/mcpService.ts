import { MCPContext, MCPResponse, ToolSchema, ToolResult, MCPPlugin, ToolHandler } from '../types/mcp';
import { formCoachingService } from './formCoachingService';
import WorkoutService from './workoutService';
import { biometricAnalysis } from './biometricAnalysisService';
import { nutritionService } from './nutritionService';
import { exerciseDatabaseService } from './exerciseDatabaseService';

export class MCPService {
  private tools = new Map<string, ToolHandler>();
  private plugins = new Map<string, MCPPlugin>();
  private initialized = false;
  private workoutService: WorkoutService;

  constructor() {
    this.workoutService = WorkoutService.getInstance();
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
      description: 'Analyze exercise form from video or image',
      parameters: {
        media: { type: 'blob', required: true },
        exercise: { type: 'string', required: true },
        angle: { type: 'string', enum: ['front', 'side', 'back'] }
      }
    }, async (params) => {
      try {
        const result = await formCoachingService.analyzeForm(params.media, params.exercise);
        return { success: true, data: result };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    // Workout planning tool
    this.registerTool('plan_workout', {
      name: 'plan_workout',
      description: 'Generate personalized workout plan',
      parameters: {
        goal: { type: 'string', required: true, enum: ['strength', 'hypertrophy', 'endurance', 'fat_loss', 'athletic'] },
        duration: { type: 'number', required: true },
        equipment: { type: 'array' },
        experience: { type: 'string', enum: ['beginner', 'intermediate', 'advanced'] }
      }
    }, async (params) => {
      try {
        const result = await this.workoutService.generateWorkout(params);
        return { success: true, data: result };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    // Biometric analysis tool
    this.registerTool('analyze_biometrics', {
      name: 'analyze_biometrics',
      description: 'Analyze biometric data and provide insights',
      parameters: {
        heartRate: { type: 'number' },
        hrv: { type: 'number' },
        bloodOxygen: { type: 'number' },
        temperature: { type: 'number' },
        activity: { type: 'string' }
      }
    }, async (params) => {
      try {
        const result = await biometricAnalysis.analyzeMetrics(params);
        return { success: true, data: result };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    // Nutrition analysis tool
    this.registerTool('analyze_nutrition', {
      name: 'analyze_nutrition',
      description: 'Analyze food image or description for nutritional content',
      parameters: {
        input: { type: 'string | blob', required: true },
        goals: { type: 'object' },
        restrictions: { type: 'array' }
      }
    }, async (params) => {
      try {
        const result = await nutritionService.analyzeFood(params.input, params.goals);
        return { success: true, data: result };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    // Exercise lookup tool
    this.registerTool('lookup_exercise', {
      name: 'lookup_exercise',
      description: 'Get detailed information about an exercise',
      parameters: {
        name: { type: 'string', required: true },
        includeVariations: { type: 'boolean' },
        muscleGroup: { type: 'string' }
      }
    }, async (params) => {
      try {
        const result = await exerciseDatabaseService.getExerciseInfo(params.name, params);
        return { success: true, data: result };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    // Progress tracking tool
    this.registerTool('track_progress', {
      name: 'track_progress',
      description: 'Track and analyze fitness progress',
      parameters: {
        metric: { type: 'string', required: true, enum: ['weight', 'strength', 'endurance', 'body_composition'] },
        data: { type: 'array', required: true },
        timeframe: { type: 'string', enum: ['week', 'month', 'quarter', 'year'] }
      }
    }, async (params) => {
      try {
        const result = await this.workoutService.analyzeProgress(params);
        return { success: true, data: result };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });
  }

  private registerTool(name: string, schema: ToolSchema, handler: ToolHandler): void {
    this.tools.set(name, handler);
    console.log(`Registered MCP tool: ${name}`);
  }

  async executeTool(toolName: string, parameters: any): Promise<ToolResult> {
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
        error: `Tool execution failed: ${error.message}` 
      };
    }
  }

  async processMultimodalContext(context: MCPContext): Promise<MCPResponse> {
    const toolsUsed: string[] = [];
    let content = '';
    let confidence = 0;

    try {
      // Analyze context and determine which tools to use
      if (context.image) {
        // Use form analysis for images
        const formResult = await this.executeTool('analyze_form', {
          media: context.image,
          exercise: context.metadata.workoutState?.currentExercise || 'unknown'
        });
        
        if (formResult.success) {
          toolsUsed.push('analyze_form');
          content += formResult.data.feedback + '\n';
          confidence += 0.3;
        }
      }

      if (context.audio) {
        // Process voice commands
        // This would integrate with voice service
        toolsUsed.push('voice_processing');
        confidence += 0.2;
      }

      if (context.text) {
        // Process text query
        const textAnalysis = await this.analyzeTextIntent(context.text);
        
        if (textAnalysis.tool) {
          const result = await this.executeTool(textAnalysis.tool, textAnalysis.parameters);
          if (result.success) {
            toolsUsed.push(textAnalysis.tool);
            content += result.data.message || JSON.stringify(result.data);
            confidence += 0.5;
          }
        }
      }

      return {
        content: content || 'No relevant analysis could be performed',
        context,
        tools_used: toolsUsed,
        confidence: Math.min(confidence, 1)
      };
    } catch (error) {
      console.error('MCP processing error:', error);
      return {
        content: 'Error processing multimodal context',
        context,
        tools_used: toolsUsed,
        confidence: 0
      };
    }
  }

  private async analyzeTextIntent(text: string): Promise<{ tool: string | null; parameters: any }> {
    // Simple intent detection - in production this would use NLP
    const lowerText = text.toLowerCase();

    if (lowerText.includes('workout') || lowerText.includes('plan')) {
      return {
        tool: 'plan_workout',
        parameters: {
          goal: 'strength',
          duration: 60,
          experience: 'intermediate'
        }
      };
    }

    if (lowerText.includes('exercise') || lowerText.includes('how to')) {
      const exerciseName = this.extractExerciseName(text);
      return {
        tool: 'lookup_exercise',
        parameters: {
          name: exerciseName,
          includeVariations: true
        }
      };
    }

    if (lowerText.includes('nutrition') || lowerText.includes('calories')) {
      return {
        tool: 'analyze_nutrition',
        parameters: {
          input: text,
          goals: {}
        }
      };
    }

    return { tool: null, parameters: {} };
  }

  private extractExerciseName(text: string): string {
    // Simple extraction - would be more sophisticated in production
    const commonExercises = ['squat', 'deadlift', 'bench press', 'pull up', 'push up'];
    for (const exercise of commonExercises) {
      if (text.toLowerCase().includes(exercise)) {
        return exercise;
      }
    }
    return 'unknown';
  }

  // Plugin management
  async registerPlugin(plugin: MCPPlugin): Promise<void> {
    try {
      await plugin.initialize();
      this.plugins.set(plugin.id, plugin);
      
      // Register plugin tools
      for (const tool of plugin.tools) {
        this.registerTool(tool.name, tool, async (params) => {
          return await plugin.execute(tool.name, params);
        });
      }
      
      console.log(`Registered MCP plugin: ${plugin.name} v${plugin.version}`);
    } catch (error) {
      console.error(`Failed to register plugin ${plugin.name}:`, error);
    }
  }

  getAvailableTools(): ToolSchema[] {
    const tools: ToolSchema[] = [];
    
    // This would return all registered tool schemas
    // For now, returning a simplified list
    return tools;
  }
}

export const mcpService = new MCPService();