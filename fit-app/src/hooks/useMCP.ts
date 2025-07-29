import { useState, useCallback, useEffect, useRef } from 'react';
import { MCPContext, MCPResponse, ToolResult } from '../types/mcp';
import { mcpService } from '../services/mcpService';

interface UseMCPOptions {
  autoProcess?: boolean;
  onToolExecuted?: (toolName: string, result: ToolResult) => void;
  onError?: (error: Error) => void;
}

interface UseMCPReturn {
  // State
  isProcessing: boolean;
  lastResponse: MCPResponse | null;
  error: Error | null;
  availableTools: string[];
  
  // Actions
  processContext: (context: Partial<MCPContext>) => Promise<MCPResponse>;
  executeTool: (toolName: string, parameters: any) => Promise<ToolResult>;
  clearContext: (contextId: string) => void;
  reset: () => void;
}

export function useMCP(options: UseMCPOptions = {}): UseMCPReturn {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResponse, setLastResponse] = useState<MCPResponse | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [availableTools, setAvailableTools] = useState<string[]>([]);
  
  const contextIdRef = useRef<string>(`context-${Date.now()}`);

  useEffect(() => {
    // Get available tools on mount
    const tools = mcpService.getAvailableTools();
    setAvailableTools(tools.map(t => t.name));
  }, []);

  const processContext = useCallback(async (partialContext: Partial<MCPContext>): Promise<MCPResponse> => {
    setIsProcessing(true);
    setError(null);

    try {
      // Create full context
      const context: MCPContext = {
        id: contextIdRef.current,
        ...partialContext,
        metadata: {
          timestamp: new Date(),
          userContext: partialContext.metadata?.userContext || {},
          workoutState: partialContext.metadata?.workoutState,
          nutritionState: partialContext.metadata?.nutritionState,
          ...partialContext.metadata
        }
      };

      // Process context through MCP service
      const response = await mcpService.processContext(context);
      
      setLastResponse(response);
      
      // Call tool execution callback if provided
      if (options.onToolExecuted) {
        response.tools_used.forEach(toolName => {
          options.onToolExecuted!(toolName, { success: true, data: response });
        });
      }

      return response;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to process context');
      setError(error);
      
      if (options.onError) {
        options.onError(error);
      }
      
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [options]);

  const executeTool = useCallback(async (toolName: string, parameters: any): Promise<ToolResult> => {
    setIsProcessing(true);
    setError(null);

    try {
      const result = await mcpService.executeTool(toolName, parameters);
      
      if (options.onToolExecuted) {
        options.onToolExecuted(toolName, result);
      }

      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to execute tool');
      setError(error);
      
      if (options.onError) {
        options.onError(error);
      }
      
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [options]);

  const clearContext = useCallback((contextId: string) => {
    mcpService.clearContext(contextId);
  }, []);

  const reset = useCallback(() => {
    setLastResponse(null);
    setError(null);
    setIsProcessing(false);
    contextIdRef.current = `context-${Date.now()}`;
  }, []);

  return {
    // State
    isProcessing,
    lastResponse,
    error,
    availableTools,
    
    // Actions
    processContext,
    executeTool,
    clearContext,
    reset
  };
}

// Specific MCP hooks for different features
export function useMCPFormAnalysis() {
  const mcp = useMCP({
    onError: (error) => console.error('Form analysis error:', error)
  });

  const analyzeForm = useCallback(async (exercise: string, imageBlob: Blob) => {
    return await mcp.executeTool('analyze_form', {
      exercise,
      image: imageBlob
    });
  }, [mcp]);

  return {
    ...mcp,
    analyzeForm
  };
}

export function useMCPWorkoutGeneration() {
  const mcp = useMCP({
    onError: (error) => console.error('Workout generation error:', error)
  });

  const generateWorkout = useCallback(async (params: {
    fitnessLevel: 'beginner' | 'intermediate' | 'advanced';
    goals: string[];
    duration: number;
    equipment?: string[];
  }) => {
    return await mcp.executeTool('generate_workout', {
      ...params,
      equipment: params.equipment || []
    });
  }, [mcp]);

  return {
    ...mcp,
    generateWorkout
  };
}

export function useMCPBiometrics() {
  const mcp = useMCP({
    onError: (error) => console.error('Biometrics error:', error)
  });

  const monitorBiometrics = useCallback(async (metrics: string[]) => {
    return await mcp.executeTool('monitor_biometrics', {
      metrics
    });
  }, [mcp]);

  return {
    ...mcp,
    monitorBiometrics
  };
}

export function useMCPNutrition() {
  const mcp = useMCP({
    onError: (error) => console.error('Nutrition analysis error:', error)
  });

  const analyzeNutrition = useCallback(async (input?: string, imageBlob?: Blob) => {
    return await mcp.executeTool('analyze_nutrition', {
      input,
      image: imageBlob
    });
  }, [mcp]);

  return {
    ...mcp,
    analyzeNutrition
  };
}

export function useMCPVoiceCoaching() {
  const mcp = useMCP({
    onError: (error) => console.error('Voice coaching error:', error)
  });

  const getVoiceCoaching = useCallback(async (
    exercise: string,
    phase: 'warmup' | 'working' | 'rest' | 'cooldown',
    metrics?: any
  ) => {
    return await mcp.executeTool('voice_coach', {
      exercise,
      phase,
      metrics
    });
  }, [mcp]);

  return {
    ...mcp,
    getVoiceCoaching
  };
}

export function useMCPProgress() {
  const mcp = useMCP({
    onError: (error) => console.error('Progress tracking error:', error)
  });

  const trackProgress = useCallback(async (
    metric: 'strength' | 'endurance' | 'weight' | 'measurements',
    timeframe?: 'week' | 'month' | '3months' | 'year'
  ) => {
    return await mcp.executeTool('track_progress', {
      metric,
      timeframe
    });
  }, [mcp]);

  return {
    ...mcp,
    trackProgress
  };
}