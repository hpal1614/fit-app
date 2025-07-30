// Test AI API Configuration
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

console.log('Testing AI API Configuration...\n');

// Check API Keys
const apiKeys = {
  openrouter: process.env.VITE_OPENROUTER_API_KEY,
  groq: process.env.VITE_GROQ_API_KEY,
  google: process.env.VITE_GOOGLE_AI_API_KEY
};

console.log('API Keys Status:');
console.log('================');
console.log(`OpenRouter: ${apiKeys.openrouter ? '✅ Found (' + apiKeys.openrouter.substring(0, 20) + '...)' : '❌ Missing'}`);
console.log(`Groq: ${apiKeys.groq ? '✅ Found (' + apiKeys.groq.substring(0, 20) + '...)' : '❌ Missing'}`);
console.log(`Google AI: ${apiKeys.google ? '✅ Found (' + apiKeys.google.substring(0, 20) + '...)' : '❌ Missing'}`);

// Test OpenRouter API
async function testOpenRouter() {
  if (!apiKeys.openrouter) {
    console.log('\n❌ Skipping OpenRouter test - API key missing');
    return;
  }
  
  console.log('\n🧪 Testing OpenRouter API...');
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKeys.openrouter}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:5173',
        'X-Title': 'AI Fitness Coach Test'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-sonnet',
        messages: [
          { role: 'system', content: 'You are a fitness coach.' },
          { role: 'user', content: 'Hello, test' }
        ],
        max_tokens: 10
      })
    });
    
    const data = await response.json();
    if (response.ok) {
      console.log('✅ OpenRouter API working!');
      console.log('Response:', data.choices?.[0]?.message?.content || 'No content');
    } else {
      console.log('❌ OpenRouter API error:', data.error || response.statusText);
    }
  } catch (error) {
    console.log('❌ OpenRouter connection error:', error.message);
  }
}

// Test Groq API
async function testGroq() {
  if (!apiKeys.groq) {
    console.log('\n❌ Skipping Groq test - API key missing');
    return;
  }
  
  console.log('\n🧪 Testing Groq API...');
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKeys.groq}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-70b-versatile',
        messages: [
          { role: 'system', content: 'You are a fitness coach.' },
          { role: 'user', content: 'Hello, test' }
        ],
        max_tokens: 10
      })
    });
    
    const data = await response.json();
    if (response.ok) {
      console.log('✅ Groq API working!');
      console.log('Response:', data.choices?.[0]?.message?.content || 'No content');
    } else {
      console.log('❌ Groq API error:', data.error || response.statusText);
    }
  } catch (error) {
    console.log('❌ Groq connection error:', error.message);
  }
}

// Test Google AI API
async function testGoogleAI() {
  if (!apiKeys.google) {
    console.log('\n❌ Skipping Google AI test - API key missing');
    return;
  }
  
  console.log('\n🧪 Testing Google AI (Gemini) API...');
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKeys.google}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: 'System: You are a fitness coach.\n\nUser: Hello, test'
          }]
        }],
        generationConfig: {
          maxOutputTokens: 10,
          temperature: 0.7
        }
      })
    });
    
    const data = await response.json();
    if (response.ok) {
      console.log('✅ Google AI API working!');
      console.log('Response:', data.candidates?.[0]?.content?.parts?.[0]?.text || 'No content');
    } else {
      console.log('❌ Google AI API error:', data.error || response.statusText);
    }
  } catch (error) {
    console.log('❌ Google AI connection error:', error.message);
  }
}

// Run all tests
async function runTests() {
  await testOpenRouter();
  await testGroq();
  await testGoogleAI();
  console.log('\n✅ API testing complete!');
}

runTests().catch(console.error);