export interface MCPContext {
  id: string;
  text?: string;
  image?: Blob;
  audio?: Blob;
  metadata: {
    timestamp: Date;
    userContext: any;
    workoutState?: any;
    nutritionState?: any;
  };
}

export interface MCPResponse {
  content: string;
  context: MCPContext;
  tools_used: string[];
  confidence: number;
}

export interface ToolSchema {
  name: string;
  description: string;
  parameters: {
    [key: string]: {
      type: string;
      required?: boolean;
      enum?: string[];
      format?: string;
    };
  };
}

export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: any;
}

export interface MCPPlugin {
  id: string;
  name: string;
  version: string;
  tools: ToolSchema[];
  initialize(): Promise<void>;
  execute(toolName: string, parameters: any): Promise<ToolResult>;
}

export type ToolHandler = (parameters: any) => Promise<ToolResult>;