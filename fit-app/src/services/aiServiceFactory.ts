import type { AICoachConfig } from '../types/ai';

// Service factory to break circular dependencies
class AIServiceFactory {
  private instances = new Map<string, any>();

  getBaseAIService(config?: Partial<AICoachConfig>) {
    if (!this.instances.has('base')) {
      // Lazy import to avoid circular dependency
      const { AICoachService } = require('./aiService');
      this.instances.set('base', new AICoachService(config));
    }
    return this.instances.get('base');
  }

  getEnhancedAIService() {
    if (!this.instances.has('enhanced')) {
      // Lazy import to avoid circular dependency
      const { EnhancedAIService } = require('./enhancedAIService');
      this.instances.set('enhanced', new EnhancedAIService());
    }
    return this.instances.get('enhanced');
  }

  getProductionAIService(config?: any) {
    if (!this.instances.has('production')) {
      // Lazy import to avoid circular dependency
      const { ProductionAIService } = require('./productionAIService');
      this.instances.set('production', new ProductionAIService(config));
    }
    return this.instances.get('production');
  }

  clearInstances() {
    this.instances.clear();
  }
}

export const aiServiceFactory = new AIServiceFactory();