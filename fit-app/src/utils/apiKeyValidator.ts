interface APIKeyStatus {
  key: string;
  isPresent: boolean;
  isValid: boolean;
  error?: string;
  provider: string;
  lastChecked: Date;
}

interface APIKeyValidationReport {
  timestamp: Date;
  allKeysPresent: boolean;
  allKeysValid: boolean;
  apiKeys: {
    openrouter: APIKeyStatus;
    groq: APIKeyStatus;
    googleAI: APIKeyStatus;
    openAI: APIKeyStatus;
    supabase?: APIKeyStatus;
  };
  recommendations: string[];
}

export class APIKeyValidator {
  private static readonly API_ENDPOINTS = {
    openrouter: 'https://openrouter.ai/api/v1/models',
    groq: 'https://api.groq.com/openai/v1/models',
    googleAI: 'https://generativelanguage.googleapis.com/v1beta/models',
    openAI: 'https://api.openai.com/v1/models'
  };

  static async validateAllKeys(): Promise<APIKeyValidationReport> {
    console.log('🔑 Starting API Key Validation...');
    
    const report: APIKeyValidationReport = {
      timestamp: new Date(),
      allKeysPresent: false,
      allKeysValid: false,
      apiKeys: {
        openrouter: await this.validateOpenRouterKey(),
        groq: await this.validateGroqKey(),
        googleAI: await this.validateGoogleAIKey(),
        openAI: await this.validateOpenAIKey()
      },
      recommendations: []
    };

    // Check Supabase keys if they exist
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (supabaseUrl || supabaseKey) {
      report.apiKeys.supabase = await this.validateSupabaseKeys();
    }

    // Calculate summary
    const keyStatuses = Object.values(report.apiKeys);
    report.allKeysPresent = keyStatuses.every(status => status.isPresent);
    report.allKeysValid = keyStatuses.filter(status => status.isPresent).every(status => status.isValid);

    // Generate recommendations
    this.generateRecommendations(report);

    console.log('🔑 API Key Validation Complete:', report);
    return report;
  }

  private static async validateOpenRouterKey(): Promise<APIKeyStatus> {
    const key = import.meta.env.VITE_OPENROUTER_API_KEY;
    const status: APIKeyStatus = {
      key: 'VITE_OPENROUTER_API_KEY',
      isPresent: !!key,
      isValid: false,
      provider: 'OpenRouter',
      lastChecked: new Date()
    };

    if (!key) {
      status.error = 'API key not found';
      return status;
    }

    try {
      const response = await fetch(this.API_ENDPOINTS.openrouter, {
        headers: {
          'Authorization': `Bearer ${key}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'AI Fitness Coach'
        }
      });

      if (response.ok) {
        status.isValid = true;
        const data = await response.json();
        console.log(`✅ OpenRouter: ${data.data?.length || 0} models available`);
      } else {
        status.error = `HTTP ${response.status}: ${response.statusText}`;
      }
    } catch (error) {
      status.error = error instanceof Error ? error.message : 'Network error';
    }

    return status;
  }

  private static async validateGroqKey(): Promise<APIKeyStatus> {
    const key = import.meta.env.VITE_GROQ_API_KEY;
    const status: APIKeyStatus = {
      key: 'VITE_GROQ_API_KEY',
      isPresent: !!key,
      isValid: false,
      provider: 'Groq',
      lastChecked: new Date()
    };

    if (!key) {
      status.error = 'API key not found';
      return status;
    }

    try {
      const response = await fetch(this.API_ENDPOINTS.groq, {
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        status.isValid = true;
        const data = await response.json();
        console.log(`✅ Groq: ${data.data?.length || 0} models available`);
      } else {
        status.error = `HTTP ${response.status}: ${response.statusText}`;
      }
    } catch (error) {
      status.error = error instanceof Error ? error.message : 'Network error';
    }

    return status;
  }

  private static async validateGoogleAIKey(): Promise<APIKeyStatus> {
    const key = import.meta.env.VITE_GOOGLE_AI_API_KEY;
    const status: APIKeyStatus = {
      key: 'VITE_GOOGLE_AI_API_KEY',
      isPresent: !!key,
      isValid: false,
      provider: 'Google AI',
      lastChecked: new Date()
    };

    if (!key) {
      status.error = 'API key not found';
      return status;
    }

    try {
      const response = await fetch(`${this.API_ENDPOINTS.googleAI}?key=${key}`);

      if (response.ok) {
        status.isValid = true;
        const data = await response.json();
        console.log(`✅ Google AI: ${data.models?.length || 0} models available`);
      } else {
        status.error = `HTTP ${response.status}: ${response.statusText}`;
        if (response.status === 400) {
          status.error += ' (Invalid API key)';
        }
      }
    } catch (error) {
      status.error = error instanceof Error ? error.message : 'Network error';
    }

    return status;
  }

  private static async validateOpenAIKey(): Promise<APIKeyStatus> {
    const key = import.meta.env.VITE_OPENAI_API_KEY;
    const status: APIKeyStatus = {
      key: 'VITE_OPENAI_API_KEY',
      isPresent: !!key,
      isValid: false,
      provider: 'OpenAI',
      lastChecked: new Date()
    };

    if (!key) {
      status.error = 'API key not found';
      return status;
    }

    try {
      const response = await fetch(this.API_ENDPOINTS.openAI, {
        headers: {
          'Authorization': `Bearer ${key}`
        }
      });

      if (response.ok) {
        status.isValid = true;
        const data = await response.json();
        console.log(`✅ OpenAI: ${data.data?.length || 0} models available`);
      } else {
        status.error = `HTTP ${response.status}: ${response.statusText}`;
      }
    } catch (error) {
      status.error = error instanceof Error ? error.message : 'Network error';
    }

    return status;
  }

  private static async validateSupabaseKeys(): Promise<APIKeyStatus> {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    const status: APIKeyStatus = {
      key: 'VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY',
      isPresent: !!(url && key),
      isValid: false,
      provider: 'Supabase',
      lastChecked: new Date()
    };

    if (!url || !key) {
      status.error = 'Supabase URL or key not found';
      return status;
    }

    try {
      const response = await fetch(`${url}/rest/v1/`, {
        headers: {
          'apikey': key,
          'Authorization': `Bearer ${key}`
        }
      });

      // Supabase returns 404 for root endpoint, but that's expected
      if (response.ok || response.status === 404) {
        status.isValid = true;
        console.log('✅ Supabase: Connection verified');
      } else {
        status.error = `HTTP ${response.status}: ${response.statusText}`;
      }
    } catch (error) {
      status.error = error instanceof Error ? error.message : 'Network error';
    }

    return status;
  }

  private static generateRecommendations(report: APIKeyValidationReport): void {
    const { apiKeys } = report;

    // Check for missing keys
    Object.entries(apiKeys).forEach(([provider, status]) => {
      if (!status.isPresent) {
        report.recommendations.push(
          `Add ${status.key} to your .env file. Check .env.example for the format.`
        );
      } else if (!status.isValid) {
        report.recommendations.push(
          `${status.provider} API key is invalid: ${status.error}. Please check your key.`
        );
      }
    });

    // Check for at least one working AI provider
    const workingAIProviders = ['openrouter', 'groq', 'googleAI', 'openAI']
      .filter(provider => apiKeys[provider as keyof typeof apiKeys]?.isValid);

    if (workingAIProviders.length === 0) {
      report.recommendations.push(
        '⚠️ No working AI providers found! Add at least one valid API key for AI features to work.'
      );
    } else if (workingAIProviders.length === 1) {
      report.recommendations.push(
        `Only ${workingAIProviders[0]} is working. Consider adding more providers for better reliability.`
      );
    }

    // If everything is good
    if (report.allKeysPresent && report.allKeysValid) {
      report.recommendations.push('✅ All API keys are properly configured and working!');
    }
  }

  static getMissingKeys(): string[] {
    const keys = [
      { name: 'VITE_OPENROUTER_API_KEY', value: import.meta.env.VITE_OPENROUTER_API_KEY },
      { name: 'VITE_GROQ_API_KEY', value: import.meta.env.VITE_GROQ_API_KEY },
      { name: 'VITE_GOOGLE_AI_API_KEY', value: import.meta.env.VITE_GOOGLE_AI_API_KEY },
      { name: 'VITE_OPENAI_API_KEY', value: import.meta.env.VITE_OPENAI_API_KEY }
    ];

    return keys.filter(key => !key.value).map(key => key.name);
  }

  static hasMinimumKeys(): boolean {
    // At least one AI provider key should be present
    return !!(
      import.meta.env.VITE_OPENROUTER_API_KEY ||
      import.meta.env.VITE_GROQ_API_KEY ||
      import.meta.env.VITE_GOOGLE_AI_API_KEY ||
      import.meta.env.VITE_OPENAI_API_KEY
    );
  }
}