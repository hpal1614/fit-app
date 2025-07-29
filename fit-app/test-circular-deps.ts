console.log('Testing circular dependency fix...\n');

async function testCircularDeps() {
  try {
    console.log('1. Testing aiServiceFactory...');
    const { aiServiceFactory } = await import('./src/services/aiServiceFactory');
    console.log('✅ aiServiceFactory loaded');
    
    console.log('\n2. Testing AICoachService...');
    const { AICoachService } = await import('./src/services/aiService');
    console.log('✅ AICoachService loaded');
    
    console.log('\n3. Testing ProductionAIService...');
    const { ProductionAIService } = await import('./src/services/productionAIService');
    console.log('✅ ProductionAIService loaded');
    
    console.log('\n4. Creating ProductionAIService instance...');
    const prodService = new ProductionAIService();
    console.log('✅ ProductionAIService instance created');
    
    console.log('\n5. Testing health check...');
    const health = await prodService.healthCheck();
    console.log('✅ Health check result:', health);
    
    console.log('\n✅ All tests passed! Circular dependency is fixed.');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    console.error('\nStack trace:', error.stack);
  }
}

testCircularDeps();