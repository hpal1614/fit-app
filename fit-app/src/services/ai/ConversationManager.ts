import { v4 as uuidv4 } from 'uuid';

export interface StreamingMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  isStreaming: boolean;
  isComplete: boolean;
  provider?: string;
  regenerationId?: string;
  reactions?: MessageReaction[];
}

export interface MessageReaction {
  type: 'like' | 'dislike' | 'helpful' | 'unhelpful';
  timestamp: Date;
}

export interface UserProfile {
  fitnessLevel: 'beginner' | 'intermediate' | 'advanced';
  goals: string[];
  preferences: {
    workoutTypes: string[];
    dietaryRestrictions: string[];
  };
}

export interface ConversationContext {
  conversationId: string;
  messages: StreamingMessage[];
  userProfile?: UserProfile;
  workoutContext?: any; // From workout types
  nutritionContext?: any; // From nutrition types
  preferences: {
    responseStyle: 'concise' | 'detailed' | 'motivational';
    expertise: 'beginner' | 'intermediate' | 'advanced';
    focus: 'strength' | 'cardio' | 'nutrition' | 'general';
  };
  createdAt: Date;
  updatedAt: Date;
}

export class ConversationManager {
  private contexts = new Map<string, ConversationContext>();
  private readonly STORAGE_KEY = 'ai_conversations';
  private readonly MAX_MESSAGES_IN_CONTEXT = 20;
  private readonly MAX_CONVERSATIONS = 10;

  constructor() {
    this.loadFromStorage();
  }

  createNewContext(conversationId?: string): ConversationContext {
    const id = conversationId || uuidv4();
    const now = new Date();
    
    return {
      conversationId: id,
      messages: [],
      preferences: {
        responseStyle: 'detailed',
        expertise: 'intermediate',
        focus: 'general'
      },
      createdAt: now,
      updatedAt: now
    };
  }

  getContext(conversationId: string): ConversationContext {
    if (!this.contexts.has(conversationId)) {
      const newContext = this.createNewContext(conversationId);
      this.contexts.set(conversationId, newContext);
      this.saveToStorage();
    }
    return this.contexts.get(conversationId)!;
  }

  updateContext(conversationId: string, message: StreamingMessage) {
    const context = this.getContext(conversationId);
    context.messages.push(message);
    context.updatedAt = new Date();
    
    // Keep only last N messages for context efficiency
    if (context.messages.length > this.MAX_MESSAGES_IN_CONTEXT) {
      // Keep system messages and recent messages
      const systemMessages = context.messages.filter(m => m.role === 'system');
      const recentMessages = context.messages
        .filter(m => m.role !== 'system')
        .slice(-this.MAX_MESSAGES_IN_CONTEXT);
      
      context.messages = [...systemMessages, ...recentMessages];
    }
    
    this.saveToStorage();
  }

  addReaction(conversationId: string, messageId: string, reaction: MessageReaction) {
    const context = this.getContext(conversationId);
    const message = context.messages.find(m => m.id === messageId);
    
    if (message) {
      if (!message.reactions) {
        message.reactions = [];
      }
      
      // Remove existing reaction of same type from user
      message.reactions = message.reactions.filter(r => r.type !== reaction.type);
      message.reactions.push(reaction);
      
      this.saveToStorage();
    }
  }

  getConversationSummary(conversationId: string): string {
    const context = this.getContext(conversationId);
    const messages = context.messages.filter(m => m.role !== 'system');
    
    if (messages.length === 0) return 'New conversation';
    
    // Get first user message as summary
    const firstUserMessage = messages.find(m => m.role === 'user');
    if (firstUserMessage) {
      return firstUserMessage.content.substring(0, 50) + 
        (firstUserMessage.content.length > 50 ? '...' : '');
    }
    
    return 'Fitness coaching conversation';
  }

  getAllConversations(): ConversationContext[] {
    return Array.from(this.contexts.values())
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  deleteConversation(conversationId: string) {
    this.contexts.delete(conversationId);
    this.saveToStorage();
  }

  clearAllConversations() {
    this.contexts.clear();
    this.saveToStorage();
  }

  // Compress conversation for AI context
  compressContext(messages: StreamingMessage[]): string {
    if (messages.length <= 10) {
      return this.formatMessages(messages);
    }

    // Keep system messages
    const systemMessages = messages.filter(m => m.role === 'system');
    
    // Keep last 8 messages verbatim
    const recentMessages = messages.filter(m => m.role !== 'system').slice(-8);
    
    // Summarize older messages
    const olderMessages = messages.filter(m => m.role !== 'system').slice(0, -8);
    
    let compressed = '';
    
    if (systemMessages.length > 0) {
      compressed += this.formatMessages(systemMessages) + '\n\n';
    }
    
    if (olderMessages.length > 0) {
      compressed += `[Previous context: ${olderMessages.length} messages exchanged about fitness topics]\n\n`;
    }
    
    compressed += 'Recent conversation:\n' + this.formatMessages(recentMessages);
    
    return compressed;
  }

  private formatMessages(messages: StreamingMessage[]): string {
    return messages
      .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n\n');
  }

  private saveToStorage() {
    try {
      // Limit stored conversations
      if (this.contexts.size > this.MAX_CONVERSATIONS) {
        const sorted = this.getAllConversations();
        const toKeep = sorted.slice(0, this.MAX_CONVERSATIONS);
        
        this.contexts.clear();
        toKeep.forEach(ctx => this.contexts.set(ctx.conversationId, ctx));
      }

      const data = Array.from(this.contexts.entries()).map(([id, context]) => ({
        id,
        context: {
          ...context,
          messages: context.messages.map(m => ({
            ...m,
            timestamp: m.timestamp.toISOString()
          })),
          createdAt: context.createdAt.toISOString(),
          updatedAt: context.updatedAt.toISOString()
        }
      }));

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save conversations:', error);
    }
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return;

      const data = JSON.parse(stored);
      
      data.forEach((item: any) => {
        const context: ConversationContext = {
          ...item.context,
          messages: item.context.messages.map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp)
          })),
          createdAt: new Date(item.context.createdAt),
          updatedAt: new Date(item.context.updatedAt)
        };
        
        this.contexts.set(item.id, context);
      });
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  }

  // Export conversation as JSON
  exportConversation(conversationId: string): string {
    const context = this.getContext(conversationId);
    return JSON.stringify(context, null, 2);
  }

  // Export as markdown
  exportAsMarkdown(conversationId: string): string {
    const context = this.getContext(conversationId);
    let markdown = `# Fitness Coaching Conversation\n\n`;
    markdown += `**Date:** ${context.createdAt.toLocaleDateString()}\n\n`;
    
    context.messages.forEach(msg => {
      if (msg.role === 'user') {
        markdown += `### You:\n${msg.content}\n\n`;
      } else if (msg.role === 'assistant') {
        markdown += `### AI Coach:\n${msg.content}\n\n`;
      }
    });
    
    return markdown;
  }
}

// Export singleton instance
export const conversationManager = new ConversationManager();