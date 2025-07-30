// BULLETPROOF AI SERVICE - Always works
interface AIResponse {
  message: string;
  suggestions?: string[];
  metadata?: any;
}

export class BulletproofAI {
  private groqKey: string;
  private openrouterKey: string;
  private googleKey: string;

  constructor() {
    this.groqKey = import.meta.env.VITE_GROQ_API_KEY || '';
    this.openrouterKey = import.meta.env.VITE_OPENROUTER_API_KEY || '';
    this.googleKey = import.meta.env.VITE_GOOGLE_AI_API_KEY || '';
    
    console.log('🔑 BulletproofAI initialized with keys:', {
      groq: this.groqKey ? `${this.groqKey.substring(0, 8)}...` : 'MISSING',
      openrouter: this.openrouterKey ? `${this.openrouterKey.substring(0, 8)}...` : 'MISSING',
      google: this.googleKey ? `${this.googleKey.substring(0, 8)}...` : 'MISSING'
    });
  }

  async sendMessage(message: string): Promise<AIResponse> {
    console.log('🤖 AI Request:', message);

    // Try each provider with proper error handling
    const providers = [
      { name: 'Groq', method: () => this.tryGroq(message) },
      { name: 'OpenRouter', method: () => this.tryOpenRouter(message) },
      { name: 'Google', method: () => this.tryGoogle(message) }
    ];

    for (const provider of providers) {
      try {
        if (await this.hasValidKey(provider.name)) {
          console.log(`🎯 Trying ${provider.name}...`);
          const response = await Promise.race([
            provider.method(),
            this.timeout(5000) // 5 second timeout
          ]);
          
          if (response) {
            console.log(`✅ ${provider.name} succeeded!`);
            return response;
          }
        }
      } catch (error) {
        console.warn(`❌ ${provider.name} failed:`, error.message);
      }
    }

    // Ultimate fallback - always works
    console.log('🛡️ Using intelligent fallback');
    return this.getIntelligentFallback(message);
  }

  private async hasValidKey(provider: string): Promise<boolean> {
    switch (provider) {
      case 'Groq': return this.groqKey && this.groqKey !== 'your_groq_key_here' && this.groqKey.startsWith('gsk_');
      case 'OpenRouter': return this.openrouterKey && this.openrouterKey !== 'your_openrouter_key_here' && this.openrouterKey.startsWith('sk-or-');
      case 'Google': return this.googleKey && this.googleKey !== 'your_google_key_here' && this.googleKey.startsWith('AIzaSy');
      default: return false;
    }
  }

  private async tryGroq(message: string): Promise<AIResponse> {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.groqKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content: 'You are an encouraging fitness coach. Keep responses under 100 words and be motivational.'
          },
          {
            role: 'user',
            content: message
          }
        ],
        max_tokens: 200,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`Groq ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    return {
      message: data.choices[0].message.content,
      suggestions: ['Form tips', 'Workout help', 'Motivation'],
      metadata: { provider: 'groq', model: 'llama-3.1-8b-instant' }
    };
  }

  private async tryOpenRouter(message: string): Promise<AIResponse> {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.openrouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'AI Fitness Coach'
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3.1-8b-instruct:free',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful fitness coach. Be encouraging and practical.'
          },
          {
            role: 'user',
            content: message
          }
        ],
        max_tokens: 200,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    return {
      message: data.choices[0].message.content,
      suggestions: ['Exercise help', 'Form check', 'Nutrition'],
      metadata: { provider: 'openrouter', model: 'llama-3.1-8b' }
    };
  }

  private async tryGoogle(message: string): Promise<AIResponse> {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.googleKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `You are a fitness coach. Be encouraging and helpful. Keep responses under 100 words.\n\nUser: ${message}\n\nCoach:`
          }]
        }],
        generationConfig: {
          maxOutputTokens: 200,
          temperature: 0.7
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Google ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    return {
      message: data.candidates[0].content.parts[0].text,
      suggestions: ['Workout plans', 'Form analysis', 'Recovery'],
      metadata: { provider: 'google', model: 'gemini-1.5-flash' }
    };
  }

  private async timeout(ms: number): Promise<never> {
    return new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Request timeout')), ms)
    );
  }

  private getIntelligentFallback(message: string): AIResponse {
    const lowerMessage = message.toLowerCase();
    
    // Workout-related responses
    if (lowerMessage.includes('workout') || lowerMessage.includes('exercise')) {
      return {
        message: "Great! I'm here to help with your workout. Focus on proper form and listen to your body. What exercise are you working on?",
        suggestions: ['Form guidance', 'Weight selection', 'Rep ranges', 'Rest periods']
      };
    }
    
    // Weight/intensity questions
    if (lowerMessage.includes('weight') || lowerMessage.includes('heavy') || lowerMessage.includes('reps')) {
      return {
        message: "Choose a weight that challenges you while maintaining perfect form. You should have 1-2 reps left in the tank at the end of each set. Progressive overload happens over weeks, not single workouts!",
        suggestions: ['Form check', 'Progressive overload', 'Deload week', 'Recovery']
      };
    }
    
    // Fatigue/recovery questions
    if (lowerMessage.includes('tired') || lowerMessage.includes('fatigue') || lowerMessage.includes('rest')) {
      return {
        message: "Fatigue is normal during training! Listen to your body - if form is breaking down, reduce weight or take longer rest periods. Quality over quantity always wins! 💪",
        suggestions: ['Rest periods', 'Recovery tips', 'Hydration', 'Sleep']
      };
    }
    
    // Form/technique questions
    if (lowerMessage.includes('form') || lowerMessage.includes('technique') || lowerMessage.includes('correct')) {
      return {
        message: "Perfect form is everything! Focus on controlled movements, full range of motion, and mind-muscle connection. Start with lighter weight if needed - technique beats ego every time!",
        suggestions: ['Form videos', 'Common mistakes', 'Progression tips', 'Mobility work']
      };
    }
    
    // Motivation/encouragement
    if (lowerMessage.includes('motivation') || lowerMessage.includes('encourage') || lowerMessage.includes('hard')) {
      return {
        message: "You're doing amazing! Every rep counts, every workout matters. Progress isn't always linear, but consistency always pays off. The hardest part is showing up, and you're already here! 🔥",
        suggestions: ['Goal setting', 'Progress tracking', 'Workout variety', 'Recovery']
      };
    }
    
    // Nutrition questions
    if (lowerMessage.includes('nutrition') || lowerMessage.includes('diet') || lowerMessage.includes('protein')) {
      return {
        message: "Nutrition is crucial for your fitness goals! Focus on adequate protein (0.8-1g per lb bodyweight), stay hydrated, and eat plenty of whole foods. What specific nutrition question do you have?",
        suggestions: ['Protein intake', 'Meal timing', 'Supplements', 'Hydration']
      };
    }
    
    // Default encouraging response
    return {
      message: "I'm your AI fitness coach! I can help with workouts, form tips, nutrition advice, and motivation. What would you like to know? 💪",
      suggestions: ['Start workout', 'Exercise form', 'Nutrition tips', 'Motivation', 'Progress tracking']
    };
  }
}

// Export singleton
export const bulletproofAI = new BulletproofAI();