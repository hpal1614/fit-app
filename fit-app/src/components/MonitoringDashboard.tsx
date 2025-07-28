import React, { useState, useEffect } from 'react';
import { Activity, AlertTriangle, CheckCircle, Clock, Cpu, Database, Globe, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { healthCheck } from '../services/healthCheckService';
import { monitoring } from '../services/monitoringService';
import { circuitBreaker } from '../services/circuitBreakerService';
import { rateLimiter } from '../services/rateLimiterService';
import { unifiedAIService } from '../services/ai/UnifiedAIService';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface MonitoringDashboardProps {
  onClose?: () => void;
}

interface ServiceStatus {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  latency?: number;
  metadata?: any;
}

export const MonitoringDashboard: React.FC<MonitoringDashboardProps> = ({ onClose }) => {
  const [systemHealth, setSystemHealth] = useState<any>(null);
  const [healthTrends, setHealthTrends] = useState<any>(null);
  const [circuitBreakerStatus, setCircuitBreakerStatus] = useState<any>(null);
  const [rateLimiterStats, setRateLimiterStats] = useState<any>(null);
  const [aiMetrics, setAIMetrics] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'services' | 'metrics' | 'logs'>('overview');
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  // Fetch health data
  const fetchHealthData = async () => {
    try {
      // Get system health
      const health = await healthCheck.checkHealth();
      setSystemHealth(health);

      // Get health trends
      const trends = healthCheck.getHealthTrends();
      setHealthTrends(trends);

      // Get circuit breaker status
      const cbStatus = circuitBreaker.healthCheck();
      setCircuitBreakerStatus(cbStatus);

      // Get rate limiter stats
      const rlStats = rateLimiter.getStats();
      setRateLimiterStats(rlStats);

      // Get AI metrics
      // AI metrics can be accessed through unified service if needed
    const aiMetrics = { requestCount: 0, errorCount: 0, avgResponseTime: 0 };
      setAIMetrics(aiMetrics);
    } catch (error) {
      console.error('Failed to fetch health data:', error);
    }
  };

  // Auto-refresh data
  useEffect(() => {
    fetchHealthData();
    
    const interval = setInterval(fetchHealthData, 5000); // Refresh every 5 seconds
    setRefreshInterval(interval);
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-500';
      case 'degraded': return 'text-yellow-500';
      case 'unhealthy': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="text-green-500" size={20} />;
      case 'degraded': return <AlertTriangle className="text-yellow-500" size={20} />;
      case 'unhealthy': return <AlertTriangle className="text-red-500" size={20} />;
      default: return <Activity className="text-gray-500" size={20} />;
    }
  };

  // Format uptime
  const formatUptime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  // Format bytes
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Service latency chart data
  const latencyChartData = {
    labels: Object.keys(healthTrends?.avgLatency || {}),
    datasets: [
      {
        label: 'Average Latency (ms)',
        data: Object.values(healthTrends?.avgLatency || {}),
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1
      }
    ]
  };

  // Error rate chart data
  const errorRateChartData = {
    labels: Object.keys(healthTrends?.errorRate || {}),
    datasets: [
      {
        label: 'Error Rate (%)',
        data: Object.values(healthTrends?.errorRate || {}).map((v: any) => v.toFixed(2)),
        backgroundColor: 'rgba(239, 68, 68, 0.5)',
        borderColor: 'rgb(239, 68, 68)',
        borderWidth: 1
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)'
        }
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)'
        }
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gray-800 p-4 flex items-center justify-between border-b border-gray-700">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Activity className="text-blue-500" />
            System Monitoring
          </h2>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700">
          {[
            { id: 'overview', label: 'Overview', icon: Globe },
            { id: 'services', label: 'Services', icon: Cpu },
            { id: 'metrics', label: 'Metrics', icon: Activity },
            { id: 'logs', label: 'Logs', icon: Database }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 px-4 py-3 flex items-center justify-center gap-2 transition-all ${
                activeTab === tab.id
                  ? 'bg-gray-800 text-white border-b-2 border-blue-500'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              <tab.icon size={18} />
              <span className="text-sm font-medium">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Overview Tab */}
          {activeTab === 'overview' && systemHealth && (
            <div className="space-y-6">
              {/* System Status */}
              <div className="bg-gray-800 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-white">System Status</h3>
                  <div className={`flex items-center gap-2 ${getStatusColor(systemHealth.status)}`}>
                    {getStatusIcon(systemHealth.status)}
                    <span className="capitalize font-medium">{systemHealth.status}</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-700 rounded-lg p-4">
                    <div className="text-sm text-gray-400 mb-1">Uptime</div>
                    <div className="text-xl font-medium text-white">
                      {formatUptime(systemHealth.metrics.uptime)}
                    </div>
                  </div>
                  
                  <div className="bg-gray-700 rounded-lg p-4">
                    <div className="text-sm text-gray-400 mb-1">Memory Usage</div>
                    <div className="text-xl font-medium text-white">
                      {formatBytes(systemHealth.metrics.memory.heapUsed)}
                    </div>
                  </div>
                  
                  <div className="bg-gray-700 rounded-lg p-4">
                    <div className="text-sm text-gray-400 mb-1">Uptime %</div>
                    <div className="text-xl font-medium text-white">
                      {healthTrends?.uptimePercentage?.toFixed(2)}%
                    </div>
                  </div>
                  
                  <div className="bg-gray-700 rounded-lg p-4">
                    <div className="text-sm text-gray-400 mb-1">Services</div>
                    <div className="text-xl font-medium text-white">
                      {systemHealth.services.length}
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Circuit Breakers */}
                <div className="bg-gray-800 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-400 mb-3">Circuit Breakers</h4>
                  {circuitBreakerStatus && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-300">Total Breakers</span>
                        <span className="text-sm font-medium text-white">
                          {circuitBreakerStatus.breakers.length}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-300">Open Circuits</span>
                        <span className={`text-sm font-medium ${
                          circuitBreakerStatus.breakers.filter((b: any) => b.state === 'open').length > 0
                            ? 'text-red-500'
                            : 'text-green-500'
                        }`}>
                          {circuitBreakerStatus.breakers.filter((b: any) => b.state === 'open').length}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* AI Metrics */}
                <div className="bg-gray-800 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-400 mb-3">AI Performance</h4>
                  {aiMetrics && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-300">Total Requests</span>
                        <span className="text-sm font-medium text-white">
                          {aiMetrics.requestCount}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-300">Avg Tokens/Request</span>
                        <span className="text-sm font-medium text-white">
                          {Math.round(aiMetrics.averageTokensPerRequest.prompt + 
                                     aiMetrics.averageTokensPerRequest.completion)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-800 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-400 mb-3">Service Latency</h4>
                  <div className="h-48">
                    <Bar data={latencyChartData} options={chartOptions} />
                  </div>
                </div>
                
                <div className="bg-gray-800 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-400 mb-3">Error Rates</h4>
                  <div className="h-48">
                    <Bar data={errorRateChartData} options={chartOptions} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Services Tab */}
          {activeTab === 'services' && systemHealth && (
            <div className="space-y-4">
              {systemHealth.services.map((service: ServiceStatus) => (
                <motion.div
                  key={service.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gray-800 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(service.status)}
                      <h4 className="text-lg font-medium text-white capitalize">
                        {service.name.replace(/([A-Z])/g, ' $1').trim()}
                      </h4>
                    </div>
                    <div className="flex items-center gap-4">
                      {service.latency && (
                        <div className="flex items-center gap-1 text-sm text-gray-400">
                          <Clock size={14} />
                          <span>{service.latency}ms</span>
                        </div>
                      )}
                      <span className={`text-sm font-medium capitalize ${getStatusColor(service.status)}`}>
                        {service.status}
                      </span>
                    </div>
                  </div>
                  
                  {service.error && (
                    <div className="mt-2 p-2 bg-red-900/20 border border-red-600 rounded text-sm text-red-400">
                      {service.error}
                    </div>
                  )}
                  
                  {service.metadata && (
                    <div className="mt-2 text-sm text-gray-400">
                      <pre className="whitespace-pre-wrap">
                        {JSON.stringify(service.metadata, null, 2)}
                      </pre>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}

          {/* Metrics Tab */}
          {activeTab === 'metrics' && (
            <div className="space-y-6">
              {/* Rate Limiters */}
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-lg font-medium text-white mb-4">Rate Limiters</h3>
                <div className="space-y-3">
                  {rateLimiterStats && Array.from(rateLimiterStats.entries()).map(([name, stats]: [string, any]) => {
                    const usage = rateLimiter.getUsage(name);
                    return (
                      <div key={name} className="bg-gray-700 rounded-lg p-3">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-white">{name}</span>
                          <span className="text-xs text-gray-400">
                            {stats.config.maxRequests} req / {stats.config.windowMs / 1000}s
                          </span>
                        </div>
                        {usage && (
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-400">Usage</span>
                              <span className="text-gray-300">
                                {usage.current} / {usage.limit} ({usage.percentage.toFixed(1)}%)
                              </span>
                            </div>
                            <div className="w-full bg-gray-600 rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full transition-all ${
                                  usage.percentage > 80 ? 'bg-red-500' :
                                  usage.percentage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                                }`}
                                style={{ width: `${Math.min(100, usage.percentage)}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Circuit Breaker Details */}
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-lg font-medium text-white mb-4">Circuit Breakers</h3>
                <div className="space-y-3">
                  {circuitBreakerStatus?.breakers.map((breaker: any) => (
                    <div key={breaker.name} className="bg-gray-700 rounded-lg p-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-white">{breaker.name}</span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          breaker.state === 'closed' ? 'bg-green-900 text-green-300' :
                          breaker.state === 'open' ? 'bg-red-900 text-red-300' :
                          'bg-yellow-900 text-yellow-300'
                        }`}>
                          {breaker.state.toUpperCase()}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-gray-400">Requests:</span>
                          <span className="text-gray-300 ml-1">{breaker.metrics.requests}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Failures:</span>
                          <span className="text-gray-300 ml-1">{breaker.metrics.failures}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Timeouts:</span>
                          <span className="text-gray-300 ml-1">{breaker.metrics.timeouts}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Fallbacks:</span>
                          <span className="text-gray-300 ml-1">{breaker.metrics.fallbacks}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Logs Tab */}
          {activeTab === 'logs' && (
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-medium text-white mb-4">Recent Events</h3>
              <div className="space-y-2">
                <div className="p-3 bg-gray-700 rounded text-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="text-yellow-500" size={14} />
                    <span className="text-gray-300">System monitoring dashboard opened</span>
                  </div>
                  <span className="text-xs text-gray-500">Just now</span>
                </div>
                <div className="text-center text-gray-500 text-sm py-4">
                  Live logs will appear here...
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-800 border-t border-gray-700 flex items-center justify-between">
          <div className="text-sm text-gray-400">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm text-gray-400">Auto-refresh: 5s</span>
          </div>
        </div>
      </div>
    </div>
  );
};