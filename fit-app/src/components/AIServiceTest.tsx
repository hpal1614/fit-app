import React, { useState, useEffect } from 'react';
import { unifiedAIService } from '../services/unifiedAIService';
import { Bot, CheckCircle, XCircle, Loader } from 'lucide-react';

export const AIServiceTest: React.FC = () => {
  const [serviceStatus, setServiceStatus] = useState<Record<string, boolean>>({});
  const [healthStatus, setHealthStatus] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [testResult, setTestResult] = useState<string>('');

  useEffect(() => {
    checkAllServices();
  }, []);

  const checkAllServices = async () => {
    setLoading(true);
    
    // Get service status
    const status = unifiedAIService.getServicesStatus();
    setServiceStatus(status);
    
    // Run health check
    try {
      const health = await unifiedAIService.healthCheck();
      setHealthStatus(health);
    } catch (error) {
      console.error('Health check failed:', error);
    }
    
    setLoading(false);
  };

  const testAIResponse = async (query: string) => {
    setTestResult('Testing...');
    try {
      const response = await unifiedAIService.getCoachingResponse(
        query,
        {},
        'general'
      );
      setTestResult(`✅ Response from ${response.provider}: ${response.content.substring(0, 100)}...`);
    } catch (error) {
      setTestResult(`❌ Error: ${error}`);
    }
  };

  const services = [
    { id: 'fixed', name: 'Fixed AI Service', description: 'BMI calculator, API validation' },
    { id: 'production', name: 'Production AI', description: 'Circuit breakers, monitoring' },
    { id: 'enhanced', name: 'Enhanced AI', description: 'Semantic analysis' },
    { id: 'team', name: 'Team AI', description: 'Multi-provider support' },
    { id: 'intelligent', name: 'Intelligent AI', description: 'Advanced NLP' }
  ];

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <div className="flex items-center mb-6">
        <Bot className="w-8 h-8 text-blue-600 mr-3" />
        <h2 className="text-2xl font-bold">All AI Services Status</h2>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <>
          {/* Service Status Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {services.map(service => (
              <div key={service.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">{service.name}</h3>
                  {serviceStatus[service.id] ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {service.description}
                </p>
                {healthStatus[service.id] && (
                  <div className="mt-2 text-xs">
                    Status: {healthStatus[service.id].status}
                    {healthStatus[service.id].responseTime && (
                      <span className="ml-2">
                        ({healthStatus[service.id].responseTime}ms)
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Test Buttons */}
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3">Test AI Responses:</h3>
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                onClick={() => testAIResponse('Calculate my BMI')}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Test BMI Calculator
              </button>
              <button
                onClick={() => testAIResponse('I need motivation')}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
              >
                Test Motivation
              </button>
              <button
                onClick={() => testAIResponse('What should I eat?')}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Test Nutrition
              </button>
              <button
                onClick={() => testAIResponse('Check my form')}
                className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
              >
                Test Form Analysis
              </button>
            </div>
            
            {testResult && (
              <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded text-sm">
                {testResult}
              </div>
            )}
          </div>

          {/* Refresh Button */}
          <button
            onClick={checkAllServices}
            className="mt-4 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Refresh Status
          </button>
        </>
      )}
    </div>
  );
};