// EMERGENCY AI - Hardcode keys temporarily to test
export class EmergencyAI {
  constructor() {
    // IMPORTANT: Replace these with your actual API keys!
    // Get keys from: https://console.groq.com/keys, https://openrouter.ai/keys, https://makersuite.google.com/app/apikey
    this.keys = {
      groq: 'PASTE_YOUR_GROQ_KEY_HERE', // Should start with gsk_
      openrouter: 'PASTE_YOUR_OPENROUTER_KEY_HERE', // Should start with sk-or-
      google: 'PASTE_YOUR_GOOGLE_KEY_HERE' // Should start with AIzaSy
    };
    
    console.log('🚨 Emergency AI loaded with keys:', {
      groq: this.keys.groq ? this.keys.groq.substring(0, 10) + '...' : 'MISSING',
      openrouter: this.keys.openrouter ? this.keys.openrouter.substring(0, 10) + '...' : 'MISSING',
      google: this.keys.google ? this.keys.google.substring(0, 10) + '...' : 'MISSING'
    });
  }

  async sendMessage(message) {
    console.log('🤖 Emergency AI called:', message);

    // Try Groq first
    if (this.keys.groq && this.keys.groq !== 'PASTE_YOUR_GROQ_KEY_HERE') {
      try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.keys.groq}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'llama-3.1-8b-instant',
            messages: [
              {
                role: 'system',
                content: 'You are an encouraging fitness coach. Keep responses under 100 words.'
              },
              {
                role: 'user',
                content: message
              }
            ],
            max_tokens: 150,
            temperature: 0.7
          })
        });

        if (response.ok) {
          const data = await response.json();
          console.log('✅ Groq SUCCESS!');
          return {
            message: data.choices[0].message.content,
            provider: 'groq'
          };
        } else {
          console.log('❌ Groq failed:', response.status, await response.text());
        }
      } catch (error) {
        console.log('❌ Groq error:', error);
      }
    }

    // Try Google
    if (this.keys.google && this.keys.google !== 'PASTE_YOUR_GOOGLE_KEY_HERE') {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.keys.google}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `You are a fitness coach. Be encouraging. Keep under 100 words.\n\nUser: ${message}\n\nCoach:`
              }]
            }],
            generationConfig: {
              maxOutputTokens: 150,
              temperature: 0.7
            }
          })
        });

        if (response.ok) {
          const data = await response.json();
          console.log('✅ Google SUCCESS!');
          return {
            message: data.candidates[0].content.parts[0].text,
            provider: 'google'
          };
        } else {
          console.log('❌ Google failed:', response.status, await response.text());
        }
      } catch (error) {
        console.log('❌ Google error:', error);
      }
    }

    // Try OpenRouter
    if (this.keys.openrouter && this.keys.openrouter !== 'PASTE_YOUR_OPENROUTER_KEY_HERE') {
      try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.keys.openrouter}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': window.location.origin
          },
          body: JSON.stringify({
            model: 'meta-llama/llama-3.1-8b-instruct:free',
            messages: [
              {
                role: 'system',
                content: 'You are a fitness coach. Be encouraging.'
              },
              {
                role: 'user',
                content: message
              }
            ],
            max_tokens: 150
          })
        });

        if (response.ok) {
          const data = await response.json();
          console.log('✅ OpenRouter SUCCESS!');
          return {
            message: data.choices[0].message.content,
            provider: 'openrouter'
          };
        } else {
          console.log('❌ OpenRouter failed:', response.status, await response.text());
        }
      } catch (error) {
        console.log('❌ OpenRouter error:', error);
      }
    }

    // Ultimate fallback
    console.log('🛡️ All APIs failed, using smart fallback');
    return this.getSmartFallback(message);
  }

  getSmartFallback(message) {
    const lower = message.toLowerCase();
    
    if (lower.includes('workout') || lower.includes('exercise')) {
      return {
        message: "Great! Let's plan your workout. Focus on proper form and listen to your body. What exercise are you working on?",
        provider: 'fallback'
      };
    }
    
    if (lower.includes('weight') || lower.includes('heavy')) {
      return {
        message: "Choose a weight that challenges you while maintaining perfect form. You should have 1-2 reps left in the tank!",
        provider: 'fallback'
      };
    }
    
    if (lower.includes('tired') || lower.includes('rest')) {
      return {
        message: "Rest is crucial! Take longer breaks if needed. Quality over quantity always wins! 💪",
        provider: 'fallback'
      };
    }
    
    if (lower.includes('form') || lower.includes('technique')) {
      return {
        message: "Perfect form is everything! Focus on controlled movements and mind-muscle connection. Technique beats ego every time!",
        provider: 'fallback'
      };
    }
    
    return {
      message: "I'm your AI fitness coach! I can help with workouts, form tips, nutrition, and motivation. What would you like to know? 💪",
      provider: 'fallback'
    };
  }
}

export const emergencyAI = new EmergencyAI();