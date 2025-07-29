import { AIHealthCheck } from './src/utils/aiHealthCheck';

async function testAIServices() {
  console.log('🧪 Starting AI Services Test...\n');
  
  try {
    // Run the health check
    const report = await AIHealthCheck.diagnoseAIServices();
    
    // Display results
    console.log('📊 API Keys Status:');
    Object.entries(report.environment.apiKeysPresent).forEach(([key, present]) => {
      console.log(`  ${present ? '✅' : '❌'} ${key.toUpperCase()}`);
    });
    
    console.log('\n📊 Services Status:');
    console.log(`  AICoachService: ${report.aiService.status} ${report.aiService.error ? `(${report.aiService.error})` : ''}`);
    console.log(`  IntelligentAIService: ${report.enhancedAI.status} ${report.enhancedAI.error ? `(${report.enhancedAI.error})` : ''}`);
    console.log(`  ProductionAIService: ${report.productionAI.status} ${report.productionAI.error ? `(${report.productionAI.error})` : ''}`);
    
    console.log('\n📊 Providers Status:');
    Object.entries(report.providers).forEach(([provider, status]) => {
      console.log(`  ${provider}: ${status.status} ${status.error ? `(${status.error})` : ''}`);
    });
    
    console.log('\n📋 Recommendations:');
    report.recommendations.forEach(rec => {
      console.log(`  • ${rec}`);
    });
    
    // Test quick check
    const isHealthy = await AIHealthCheck.quickTest();
    console.log(`\n🏥 Overall Health: ${isHealthy ? '✅ HEALTHY' : '❌ UNHEALTHY'}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testAIServices();
}