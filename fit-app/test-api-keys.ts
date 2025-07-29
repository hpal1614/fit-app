import { APIKeyValidator } from './src/utils/apiKeyValidator';

async function testAPIKeys() {
  console.log('🔑 Testing API Keys Configuration...\n');
  
  try {
    // Check if minimum keys are present
    const hasMinimumKeys = APIKeyValidator.hasMinimumKeys();
    console.log(`Minimum keys present: ${hasMinimumKeys ? '✅ YES' : '❌ NO'}`);
    
    // Get missing keys
    const missingKeys = APIKeyValidator.getMissingKeys();
    if (missingKeys.length > 0) {
      console.log('\nMissing keys:');
      missingKeys.forEach(key => console.log(`  ❌ ${key}`));
    }
    
    // Validate all keys
    console.log('\n🔍 Validating API Keys...\n');
    const report = await APIKeyValidator.validateAllKeys();
    
    // Display results
    console.log('📊 API Key Validation Results:\n');
    
    Object.entries(report.apiKeys).forEach(([provider, status]) => {
      const icon = status.isValid ? '✅' : status.isPresent ? '⚠️' : '❌';
      console.log(`${icon} ${status.provider}:`);
      console.log(`   Key: ${status.key}`);
      console.log(`   Present: ${status.isPresent ? 'Yes' : 'No'}`);
      console.log(`   Valid: ${status.isValid ? 'Yes' : 'No'}`);
      if (status.error) {
        console.log(`   Error: ${status.error}`);
      }
      console.log('');
    });
    
    // Display recommendations
    if (report.recommendations.length > 0) {
      console.log('📋 Recommendations:\n');
      report.recommendations.forEach(rec => {
        console.log(`• ${rec}`);
      });
    }
    
    // Overall status
    console.log('\n📊 Overall Status:');
    console.log(`All keys present: ${report.allKeysPresent ? '✅' : '❌'}`);
    console.log(`All keys valid: ${report.allKeysValid ? '✅' : '❌'}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testAPIKeys();