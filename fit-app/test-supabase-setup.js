// Test script to verify Supabase setup
// Run this in your browser console after setting up Supabase

console.log('🧪 Testing Supabase Setup...');

// Test 1: Check environment variables
console.log('📋 Environment Variables:');
console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL ? '✅ Set' : '❌ Missing');
console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing');

// Test 2: Check if Supabase service is available
if (window.supabaseService) {
  console.log('🔧 Supabase Service: ✅ Available');
} else {
  console.log('🔧 Supabase Service: ❌ Not available');
}

// Test 3: Check hybrid storage status
if (window.hybridStorageService) {
  console.log('🔄 Hybrid Storage: ✅ Available');
  console.log('Using Supabase:', window.hybridStorageService.isUsingSupabase());
} else {
  console.log('🔄 Hybrid Storage: ❌ Not available');
}

// Test 4: Test localStorage fallback
console.log('💾 LocalStorage Test:');
try {
  localStorage.setItem('test-supabase', 'working');
  const testValue = localStorage.getItem('test-supabase');
  console.log('LocalStorage:', testValue === 'working' ? '✅ Working' : '❌ Failed');
  localStorage.removeItem('test-supabase');
} catch (error) {
  console.log('LocalStorage: ❌ Error:', error);
}

console.log('✅ Setup test complete!'); 