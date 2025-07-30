// Test environment variables loading
export function testEnvVars() {
  console.log('🔍 Environment Variables Test:');
  console.log('OpenRouter:', import.meta.env.VITE_OPENROUTER_API_KEY?.substring(0, 30) + '...');
  console.log('Groq:', import.meta.env.VITE_GROQ_API_KEY?.substring(0, 30) + '...');
  console.log('Google AI:', import.meta.env.VITE_GOOGLE_AI_API_KEY?.substring(0, 30) + '...');
  console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
  console.log('ElevenLabs:', import.meta.env.VITE_ELEVENLABS_API_KEY?.substring(0, 30) + '...');
  
  return {
    openrouter: !!import.meta.env.VITE_OPENROUTER_API_KEY,
    groq: !!import.meta.env.VITE_GROQ_API_KEY,
    google: !!import.meta.env.VITE_GOOGLE_AI_API_KEY,
    supabase: !!import.meta.env.VITE_SUPABASE_URL,
    elevenlabs: !!import.meta.env.VITE_ELEVENLABS_API_KEY
  };
}

// Auto-run on load
if (typeof window !== 'undefined') {
  (window as any).testEnvVars = testEnvVars;
  console.log('💡 Run window.testEnvVars() to check environment variables');
}