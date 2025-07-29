import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, XCircle, RefreshCw, Activity } from 'lucide-react';
import { AIHealthCheck } from '../utils/aiHealthCheck';

export const AIHealthCheckDashboard: React.FC = () => {
  const [report, setReport] = useState<any>(null);
  const [isChecking, setIsChecking] = useState(false);

  const runHealthCheck = async () => {
    setIsChecking(true);
    try {
      const diagnosis = await AIHealthCheck.diagnoseAIServices();
      setReport(diagnosis);
    } catch (error) {
      console.error('Health check failed:', error);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    runHealthCheck();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
    }
  };

  if (!report) {
    return (
      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 animate-pulse" />
          <span>Running AI health check...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white dark:bg-gray-900 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Activity className="w-6 h-6" />
          AI Health Check Dashboard
        </h2>
        <button
          onClick={runHealthCheck}
          disabled={isChecking}
          className="flex items-center gap-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* API Keys Status */}
      <div className="mb-6">
        <h3 className="font-semibold mb-2">API Keys Configuration</h3>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(report.environment.apiKeysPresent).map(([key, present]) => (
            <div key={key} className="flex items-center gap-2 text-sm">
              {present ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <XCircle className="w-4 h-4 text-red-500" />
              )}
              <span className="capitalize">{key}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Services Status */}
      <div className="mb-6">
        <h3 className="font-semibold mb-2">AI Services Status</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
            <span>AICoachService</span>
            <div className="flex items-center gap-2">
              {getStatusIcon(report.aiService.status)}
              {report.aiService.error && (
                <span className="text-xs text-red-500">{report.aiService.error}</span>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
            <span>IntelligentAIService</span>
            <div className="flex items-center gap-2">
              {getStatusIcon(report.enhancedAI.status)}
              {report.enhancedAI.error && (
                <span className="text-xs text-red-500">{report.enhancedAI.error}</span>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
            <span>ProductionAIService</span>
            <div className="flex items-center gap-2">
              {getStatusIcon(report.productionAI.status)}
              {report.productionAI.error && (
                <span className="text-xs text-red-500">{report.productionAI.error}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Providers Status */}
      <div className="mb-6">
        <h3 className="font-semibold mb-2">AI Providers Status</h3>
        <div className="space-y-2">
          {Object.entries(report.providers).map(([provider, status]: [string, any]) => (
            <div key={provider} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
              <span className="capitalize">{provider}</span>
              <div className="flex items-center gap-2">
                {getStatusIcon(status.status)}
                {status.error && (
                  <span className="text-xs text-red-500">{status.error}</span>
                )}
                {status.details?.modelsAvailable && (
                  <span className="text-xs text-gray-500">
                    {status.details.modelsAvailable} models
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      {report.recommendations.length > 0 && (
        <div>
          <h3 className="font-semibold mb-2">Recommendations</h3>
          <ul className="space-y-1">
            {report.recommendations.map((rec: string, index: number) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Timestamp */}
      <div className="mt-4 text-xs text-gray-500">
        Last checked: {new Date(report.timestamp).toLocaleString()}
      </div>
    </div>
  );
};