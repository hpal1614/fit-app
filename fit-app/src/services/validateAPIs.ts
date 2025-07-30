// API Key Validation Script
export async function validateAllAPIs() {
  console.log('🔑 Validating All API Keys...\n');
  
  const results = {
    openrouter: false,
    groq: false,
    google: false,
    supabase: false,
    elevenlabs: false,
    pinecone: false
  };

  // 1. Test OpenRouter API
  console.log('1️⃣ Testing OpenRouter API...');
  try {
    const openrouterKey = import.meta.env.VITE_OPENROUTER_API_KEY;
    if (!openrouterKey) {
      console.log('❌ OpenRouter: No API key found');
    } else {
      console.log(`   Key: ${openrouterKey.substring(0, 20)}...`);
      const response = await fetch('https://openrouter.ai/api/v1/models', {
        headers: {
          'Authorization': `Bearer ${openrouterKey}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        console.log('✅ OpenRouter: API key is VALID');
        results.openrouter = true;
      } else {
        console.log(`❌ OpenRouter: API key is INVALID (${response.status} ${response.statusText})`);
      }
    }
  } catch (error) {
    console.log('❌ OpenRouter: Network error', error);
  }

  // 2. Test Groq API
  console.log('\n2️⃣ Testing Groq API...');
  try {
    const groqKey = import.meta.env.VITE_GROQ_API_KEY;
    if (!groqKey) {
      console.log('❌ Groq: No API key found');
    } else {
      console.log(`   Key: ${groqKey.substring(0, 20)}...`);
      const response = await fetch('https://api.groq.com/openai/v1/models', {
        headers: {
          'Authorization': `Bearer ${groqKey}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        console.log('✅ Groq: API key is VALID');
        results.groq = true;
      } else {
        console.log(`❌ Groq: API key is INVALID (${response.status} ${response.statusText})`);
      }
    }
  } catch (error) {
    console.log('❌ Groq: Network error', error);
  }

  // 3. Test Google AI API
  console.log('\n3️⃣ Testing Google AI API...');
  try {
    const googleKey = import.meta.env.VITE_GOOGLE_AI_API_KEY;
    if (!googleKey) {
      console.log('❌ Google AI: No API key found');
    } else {
      console.log(`   Key: ${googleKey.substring(0, 20)}...`);
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${googleKey}`);
      if (response.ok) {
        console.log('✅ Google AI: API key is VALID');
        results.google = true;
      } else {
        console.log(`❌ Google AI: API key is INVALID (${response.status} ${response.statusText})`);
      }
    }
  } catch (error) {
    console.log('❌ Google AI: Network error', error);
  }

  // 4. Test Supabase
  console.log('\n4️⃣ Testing Supabase...');
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
      console.log('❌ Supabase: Missing URL or key');
    } else {
      console.log(`   URL: ${supabaseUrl}`);
      console.log(`   Key: ${supabaseKey.substring(0, 30)}...`);
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      });
      if (response.ok || response.status === 404) {
        console.log('✅ Supabase: Connection is VALID');
        results.supabase = true;
      } else {
        console.log(`❌ Supabase: Connection FAILED (${response.status} ${response.statusText})`);
      }
    }
  } catch (error) {
    console.log('❌ Supabase: Network error', error);
  }

  // 5. Test ElevenLabs
  console.log('\n5️⃣ Testing ElevenLabs API...');
  try {
    const elevenLabsKey = import.meta.env.VITE_ELEVENLABS_API_KEY;
    if (!elevenLabsKey) {
      console.log('❌ ElevenLabs: No API key found');
    } else {
      console.log(`   Key: ${elevenLabsKey.substring(0, 20)}...`);
      const response = await fetch('https://api.elevenlabs.io/v1/user', {
        headers: {
          'xi-api-key': elevenLabsKey
        }
      });
      if (response.ok) {
        console.log('✅ ElevenLabs: API key is VALID');
        results.elevenlabs = true;
      } else {
        console.log(`❌ ElevenLabs: API key is INVALID (${response.status} ${response.statusText})`);
      }
    }
  } catch (error) {
    console.log('❌ ElevenLabs: Network error', error);
  }

  // 6. Test Pinecone
  console.log('\n6️⃣ Testing Pinecone API...');
  try {
    const pineconeKey = import.meta.env.VITE_PINECONE_API_KEY;
    const pineconeEnv = import.meta.env.VITE_PINECONE_ENVIRONMENT;
    if (!pineconeKey) {
      console.log('❌ Pinecone: No API key found');
    } else {
      console.log(`   Key: ${pineconeKey.substring(0, 20)}...`);
      console.log(`   Environment: ${pineconeEnv}`);
      const response = await fetch(`https://api.pinecone.io/indexes`, {
        headers: {
          'Api-Key': pineconeKey,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        console.log('✅ Pinecone: API key is VALID');
        results.pinecone = true;
      } else {
        console.log(`❌ Pinecone: API key is INVALID (${response.status} ${response.statusText})`);
      }
    }
  } catch (error) {
    console.log('❌ Pinecone: Network error', error);
  }

  // Summary
  console.log('\n📊 SUMMARY:');
  console.log('===========');
  const working = Object.values(results).filter(v => v).length;
  const total = Object.keys(results).length;
  console.log(`✅ Working APIs: ${working}/${total}`);
  console.log(`❌ Failed APIs: ${total - working}/${total}`);
  
  console.log('\n🎯 RECOMMENDATION:');
  if (results.groq || results.openrouter || results.google) {
    console.log('At least one AI API is working! The app should function.');
  } else {
    console.log('No AI APIs are working. The app will use the free AI fallback.');
  }
  
  return results;
}

// Auto-register to window for easy testing
if (typeof window !== 'undefined') {
  window.validateAPIs = validateAllAPIs;
  console.log('💡 Run window.validateAPIs() to check all API keys');
}