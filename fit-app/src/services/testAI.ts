import { aiService } from './aiService';

export async function testAIService() {
  console.log('🧪 Testing AI Service...');
  
  // Check environment variables
  console.log('Environment variables:', {
    VITE_OPENROUTER_API_KEY: import.meta.env.VITE_OPENROUTER_API_KEY ? 'SET' : 'NOT SET',
    VITE_GROQ_API_KEY: import.meta.env.VITE_GROQ_API_KEY ? 'SET' : 'NOT SET',
    VITE_GOOGLE_AI_API_KEY: import.meta.env.VITE_GOOGLE_AI_API_KEY ? 'SET' : 'NOT SET'
  });
  
  try {
    const response = await aiService.getResponse({
      message: 'What is the best exercise for building muscle?',
      type: 'general-advice',
      context: {
        isActive: false,
        startTime: new Date(),
        exercises: []
      }
    });
    
    console.log('✅ AI Response:', {
      content: response.content,
      hasContent: !!response.content,
      contentLength: response.content?.length
    });
    
    return response;
  } catch (error) {
    console.error('❌ AI Test Failed:', error);
    throw error;
  }
}

// Auto-run test when imported
if (typeof window !== 'undefined') {
  window.testAI = testAIService;
  console.log('💡 Run window.testAI() in console to test AI service');
}