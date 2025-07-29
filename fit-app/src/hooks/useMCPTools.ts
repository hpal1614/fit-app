import { useState, useCallback } from 'react';
import { useMCP } from '../providers/MCPProvider';
import { MCPContext, MCPResponse, ToolResult } from '../types/mcp';

interface UseMCPToolsReturn {
  loading: boolean;
  error: string | null;
  lastResponse: MCPResponse | null;
  
  // Tool execution methods
  analyzeForm: (image: Blob, exercise: string) => Promise<any>;
  generateWorkout: (goal: string, duration: number, equipment?: string[]) => Promise<any>;
  analyzeBiometrics: (metrics: any) => Promise<any>;
  analyzeNutrition: (input: string | Blob) => Promise<any>;
  lookupExercise: (name: string) => Promise<any>;
  trackProgress: (metric: string, data: any[]) => Promise<any>;
  
  // Context processing
  processMultimodalInput: (context: Partial<MCPContext>) => Promise<MCPResponse>;
}

export const useMCPTools = (): UseMCPToolsReturn => {
  const { executeTool, processContext } = useMCP();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResponse, setLastResponse] = useState<MCPResponse | null>(null);

  const handleToolExecution = useCallback(async (toolName: string, parameters: any) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await executeTool(toolName, parameters);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Tool execution failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [executeTool]);

  const analyzeForm = useCallback(async (image: Blob, exercise: string) => {
    return handleToolExecution('analyze_form', { media: image, exercise });
  }, [handleToolExecution]);

  const generateWorkout = useCallback(async (
    goal: string, 
    duration: number, 
    equipment?: string[]
  ) => {
    return handleToolExecution('plan_workout', {
      goal,
      duration,
      equipment: equipment || [],
      experience: 'intermediate' // Default, could be parameterized
    });
  }, [handleToolExecution]);

  const analyzeBiometrics = useCallback(async (metrics: {
    heartRate?: number;
    hrv?: number;
    bloodOxygen?: number;
    temperature?: number;
    activity?: string;
  }) => {
    return handleToolExecution('analyze_biometrics', metrics);
  }, [handleToolExecution]);

  const analyzeNutrition = useCallback(async (input: string | Blob) => {
    return handleToolExecution('analyze_nutrition', {
      input,
      goals: {}, // Could be parameterized
      restrictions: []
    });
  }, [handleToolExecution]);

  const lookupExercise = useCallback(async (name: string) => {
    return handleToolExecution('lookup_exercise', {
      name,
      includeVariations: true
    });
  }, [handleToolExecution]);

  const trackProgress = useCallback(async (
    metric: string,
    data: any[],
    timeframe: string = 'month'
  ) => {
    return handleToolExecution('track_progress', {
      metric,
      data,
      timeframe
    });
  }, [handleToolExecution]);

  const processMultimodalInput = useCallback(async (
    contextInput: Partial<MCPContext>
  ): Promise<MCPResponse> => {
    setLoading(true);
    setError(null);
    
    try {
      // Create a full context with defaults
      const fullContext: MCPContext = {
        id: `mcp-${Date.now()}`,
        ...contextInput,
        metadata: {
          timestamp: new Date(),
          userContext: {},
          ...contextInput.metadata
        }
      };
      
      const response = await processContext(fullContext);
      setLastResponse(response);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Context processing failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [processContext]);

  return {
    loading,
    error,
    lastResponse,
    analyzeForm,
    generateWorkout,
    analyzeBiometrics,
    analyzeNutrition,
    lookupExercise,
    trackProgress,
    processMultimodalInput
  };
};