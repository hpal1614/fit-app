// Test if each API key works individually

// Test Groq
async function testGroq() {
  const key = import.meta.env.VITE_GROQ_API_KEY;
  if (!key) {
    console.log('❌ Groq key not loaded');
    return;
  }
  
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 10
      })
    });
    
    if (response.ok) {
      console.log('✅ Groq key WORKS!');
    } else {
      console.log('❌ Groq key INVALID:', response.status, await response.text());
    }
  } catch (error) {
    console.log('❌ Groq test failed:', error);
  }
}

// Test Google
async function testGoogle() {
  const key = import.meta.env.VITE_GOOGLE_AI_API_KEY;
  if (!key) {
    console.log('❌ Google key not loaded');
    return;
  }
  
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'Hello' }] }]
      })
    });
    
    if (response.ok) {
      console.log('✅ Google key WORKS!');
    } else {
      console.log('❌ Google key INVALID:', response.status, await response.text());
    }
  } catch (error) {
    console.log('❌ Google test failed:', error);
  }
}

// Test OpenRouter
async function testOpenRouter() {
  const key = import.meta.env.VITE_OPENROUTER_API_KEY;
  if (!key) {
    console.log('❌ OpenRouter key not loaded');
    return;
  }
  
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3.1-8b-instruct:free',
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 10
      })
    });
    
    if (response.ok) {
      console.log('✅ OpenRouter key WORKS!');
    } else {
      console.log('❌ OpenRouter key INVALID:', response.status, await response.text());
    }
  } catch (error) {
    console.log('❌ OpenRouter test failed:', error);
  }
}

// Run tests
console.log('🧪 Testing API keys...');
testGroq();
testGoogle();
testOpenRouter();

// Also check what environment variables are available
console.log('📋 All VITE env vars:', Object.keys(import.meta.env).filter(k => k.startsWith('VITE_')));