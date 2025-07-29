import type { AICoachConfig } from '../types/ai';

// Service factory to break circular dependencies
class AIServiceFactory {
  private instances = new Map<string, any>();
  private initializing = new Map<string, Promise<any>>();

  async getBaseAIService(config?: Partial<AICoachConfig>) {
    if (this.instances.has('base')) {
      return this.instances.get('base');
    }

    // Prevent multiple simultaneous initializations
    if (this.initializing.has('base')) {
      return this.initializing.get('base');
    }

    const initPromise = (async () => {
      try {
        // Dynamic import to avoid circular dependency
        const { AICoachService } = await import('./aiService');
        const instance = new AICoachService(config);
        this.instances.set('base', instance);
        this.initializing.delete('base');
        return instance;
      } catch (error) {
        this.initializing.delete('base');
        throw error;
      }
    })();

    this.initializing.set('base', initPromise);
    return initPromise;
  }

  async getEnhancedAIService() {
    if (this.instances.has('enhanced')) {
      return this.instances.get('enhanced');
    }

    if (this.initializing.has('enhanced')) {
      return this.initializing.get('enhanced');
    }

    const initPromise = (async () => {
      try {
        const { EnhancedAIService } = await import('./enhancedAIService');
        const instance = new EnhancedAIService();
        this.instances.set('enhanced', instance);
        this.initializing.delete('enhanced');
        return instance;
      } catch (error) {
        this.initializing.delete('enhanced');
        throw error;
      }
    })();

    this.initializing.set('enhanced', initPromise);
    return initPromise;
  }

  async getProductionAIService(config?: any) {
    if (this.instances.has('production')) {
      return this.instances.get('production');
    }

    if (this.initializing.has('production')) {
      return this.initializing.get('production');
    }

    const initPromise = (async () => {
      try {
        const { ProductionAIService } = await import('./productionAIService');
        const instance = new ProductionAIService(config);
        this.instances.set('production', instance);
        this.initializing.delete('production');
        return instance;
      } catch (error) {
        this.initializing.delete('production');
        throw error;
      }
    })();

    this.initializing.set('production', initPromise);
    return initPromise;
  }

  clearInstances() {
    this.instances.clear();
    this.initializing.clear();
  }
}

export const aiServiceFactory = new AIServiceFactory();