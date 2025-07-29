import { AICoachService } from '../services/aiService';
import { IntelligentAIService } from '../services/intelligentAIService';
import { ProductionAIService } from '../services/productionAIService';
import { APIKeyValidator } from './apiKeyValidator';

interface ServiceStatus {
  status: 'healthy' | 'failed' | 'unknown';
  error: string | null;
  details?: any;
}

interface DiagnosisReport {
  timestamp: Date;
  aiService: ServiceStatus;
  enhancedAI: ServiceStatus;
  productionAI: ServiceStatus;
  providers: {
    openrouter: ServiceStatus;
    groq: ServiceStatus;
    googleAI: ServiceStatus;
  };
  environment: {
    apiKeysPresent: {
      openrouter: boolean;
      groq: boolean;
      googleAI: boolean;
      openAI: boolean;
    };
    nodeEnv: string;
    importErrors: string[];
  };
  recommendations: string[];
}

export class AIHealthCheck {
  static async diagnoseAIServices(): Promise<DiagnosisReport> {
    const report: DiagnosisReport = {
      timestamp: new Date(),
      aiService: { status: 'unknown', error: null },
      enhancedAI: { status: 'unknown', error: null },
      productionAI: { status: 'unknown', error: null },
      providers: {
        openrouter: { status: 'unknown', error: null },
        groq: { status: 'unknown', error: null },
        googleAI: { status: 'unknown', error: null }
      },
      environment: {
        apiKeysPresent: {
          openrouter: !!import.meta.env.VITE_OPENROUTER_API_KEY,
          groq: !!import.meta.env.VITE_GROQ_API_KEY,
          googleAI: !!import.meta.env.VITE_GOOGLE_AI_API_KEY,
          openAI: !!import.meta.env.VITE_OPENAI_API_KEY
        },
        nodeEnv: import.meta.env.MODE || 'development',
        importErrors: []
      },
      recommendations: []
    };

    console.log('🏥 Starting AI Health Check...', {
      apiKeys: report.environment.apiKeysPresent
    });

    // Test base AI Service
    try {
      console.log('Testing AICoachService...');
      const aiService = AICoachService.getInstance();
      
      // Simple test to see if it can handle a basic request
      const testResponse = await Promise.race([
        aiService.getCoachingResponse('Test', {}, 'general-advice'),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout after 3s')), 3000)
        )
      ]);
      
      if (testResponse) {
        report.aiService.status = 'healthy';
        report.aiService.details = { 
          hasResponse: true,
          provider: testResponse.metadata?.provider 
        };
      }
    } catch (error) {
      report.aiService.status = 'failed';
      report.aiService.error = error instanceof Error ? error.message : 'Unknown error';
      report.environment.importErrors.push(`AICoachService: ${error}`);
    }

    // Test Intelligent AI Service
    try {
      console.log('Testing IntelligentAIService...');
      const intelligentAI = new IntelligentAIService();
      
      // Check if it initializes properly
      report.enhancedAI.status = 'healthy';
      report.enhancedAI.details = { initialized: true };
    } catch (error) {
      report.enhancedAI.status = 'failed';
      report.enhancedAI.error = error instanceof Error ? error.message : 'Unknown error';
      report.environment.importErrors.push(`IntelligentAIService: ${error}`);
    }

    // Test Production AI Service
    try {
      console.log('Testing ProductionAIService...');
      const productionAI = new ProductionAIService();
      
      // Test health check endpoint
      const health = await productionAI.healthCheck();
      report.productionAI.status = health.healthy ? 'healthy' : 'failed';
      report.productionAI.details = health;
    } catch (error) {
      report.productionAI.status = 'failed';
      report.productionAI.error = error instanceof Error ? error.message : 'Unknown error';
      report.environment.importErrors.push(`ProductionAIService: ${error}`);
    }

    // Test each provider individually using the API key validator
    const apiKeyReport = await APIKeyValidator.validateAllKeys();
    
    // Map API key validation results to our report
    report.providers.openrouter = {
      status: apiKeyReport.apiKeys.openrouter.isValid ? 'healthy' : 'failed',
      error: apiKeyReport.apiKeys.openrouter.error || null,
      details: apiKeyReport.apiKeys.openrouter
    };
    
    report.providers.groq = {
      status: apiKeyReport.apiKeys.groq.isValid ? 'healthy' : 'failed',
      error: apiKeyReport.apiKeys.groq.error || null,
      details: apiKeyReport.apiKeys.groq
    };
    
    report.providers.googleAI = {
      status: apiKeyReport.apiKeys.googleAI.isValid ? 'healthy' : 'failed',
      error: apiKeyReport.apiKeys.googleAI.error || null,
      details: apiKeyReport.apiKeys.googleAI
    };

    // Update environment info with API key validation
    report.environment.apiKeysPresent = {
      openrouter: apiKeyReport.apiKeys.openrouter.isPresent,
      groq: apiKeyReport.apiKeys.groq.isPresent,
      googleAI: apiKeyReport.apiKeys.googleAI.isPresent,
      openAI: apiKeyReport.apiKeys.openAI.isPresent
    };

    // Generate recommendations
    this.generateRecommendations(report);
    
    // Add API key validator recommendations
    report.recommendations.push(...apiKeyReport.recommendations);

    console.log('🏥 AI Health Check Complete:', report);
    return report;
  }



  private static generateRecommendations(report: DiagnosisReport): void {
    // Check for missing API keys
    const missingKeys = Object.entries(report.environment.apiKeysPresent)
      .filter(([_, present]) => !present)
      .map(([key]) => key);
    
    if (missingKeys.length > 0) {
      report.recommendations.push(
        `Configure missing API keys: ${missingKeys.join(', ')}. Check .env.example for guidance.`
      );
    }

    // Check for import errors
    if (report.environment.importErrors.length > 0) {
      report.recommendations.push(
        'Fix import/circular dependency errors in AI services. Consider using dependency injection.'
      );
    }

    // Check for failed services
    const failedServices = [];
    if (report.aiService.status === 'failed') failedServices.push('AICoachService');
    if (report.enhancedAI.status === 'failed') failedServices.push('IntelligentAIService');
    if (report.productionAI.status === 'failed') failedServices.push('ProductionAIService');
    
    if (failedServices.length > 0) {
      report.recommendations.push(
        `Investigate and fix failed services: ${failedServices.join(', ')}`
      );
    }

    // Check for provider issues
    const failedProviders = Object.entries(report.providers)
      .filter(([_, status]) => status.status === 'failed')
      .map(([provider]) => provider);
    
    if (failedProviders.length > 0) {
      report.recommendations.push(
        `Fix provider connectivity issues: ${failedProviders.join(', ')}`
      );
    }

    // If everything is healthy
    if (report.recommendations.length === 0) {
      report.recommendations.push('All AI services are healthy! ✅');
    }
  }

  static async quickTest(): Promise<boolean> {
    try {
      const report = await this.diagnoseAIServices();
      const allHealthy = 
        report.aiService.status === 'healthy' ||
        report.enhancedAI.status === 'healthy' ||
        report.productionAI.status === 'healthy';
      
      const hasWorkingProvider = Object.values(report.providers)
        .some(p => p.status === 'healthy');
      
      return allHealthy && hasWorkingProvider;
    } catch (error) {
      console.error('Quick test failed:', error);
      return false;
    }
  }
}

// Export for use in components/hooks
export const runAIHealthCheck = () => AIHealthCheck.diagnoseAIServices();
export const isAIHealthy = () => AIHealthCheck.quickTest();