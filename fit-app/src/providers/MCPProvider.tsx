import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { mcpService } from '../services/mcpService';
import { MCPContext as MCPContextType, MCPResponse, ToolSchema } from '../types/mcp';

interface MCPProviderState {
  isInitialized: boolean;
  availableTools: ToolSchema[];
  processContext: (context: MCPContextType) => Promise<MCPResponse>;
  executeTool: (toolName: string, parameters: any) => Promise<any>;
}

const MCPContext = createContext<MCPProviderState | undefined>(undefined);

export const useMCP = () => {
  const context = useContext(MCPContext);
  if (!context) {
    throw new Error('useMCP must be used within MCPProvider');
  }
  return context;
};

interface MCPProviderProps {
  children: ReactNode;
}

export const MCPProvider: React.FC<MCPProviderProps> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [availableTools, setAvailableTools] = useState<ToolSchema[]>([]);

  useEffect(() => {
    // Initialize MCP service
    const initializeMCP = async () => {
      try {
        // Service initializes itself in constructor
        setIsInitialized(true);
        
        // Get available tools
        const tools = mcpService.getAvailableTools();
        setAvailableTools(tools);
        
        console.log('MCP Provider initialized');
      } catch (error) {
        console.error('Failed to initialize MCP:', error);
      }
    };

    initializeMCP();
  }, []);

  const processContext = async (context: MCPContextType): Promise<MCPResponse> => {
    try {
      return await mcpService.processMultimodalContext(context);
    } catch (error) {
      console.error('MCP context processing error:', error);
      return {
        content: 'Error processing context',
        context,
        tools_used: [],
        confidence: 0
      };
    }
  };

  const executeTool = async (toolName: string, parameters: any) => {
    try {
      const result = await mcpService.executeTool(toolName, parameters);
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error || 'Tool execution failed');
      }
    } catch (error) {
      console.error('MCP tool execution error:', error);
      throw error;
    }
  };

  const value: MCPProviderState = {
    isInitialized,
    availableTools,
    processContext,
    executeTool
  };

  return <MCPContext.Provider value={value}>{children}</MCPContext.Provider>;
};