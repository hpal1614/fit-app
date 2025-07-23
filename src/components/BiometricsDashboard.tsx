import React, { useState, useEffect } from 'react';
import { Heart, Activity, Moon, Brain, TrendingUp, AlertTriangle, Watch, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { useBiometrics } from '../hooks/useBiometrics';
import { format } from 'date-fns';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface BiometricsDashboardProps {
  userAge?: number;
  onClose?: () => void;
}

const wearableProviders = [
  { id: 'APPLE', name: 'Apple Watch', icon: '⌚' },
  { id: 'GARMIN', name: 'Garmin', icon: '⌚' },
  { id: 'FITBIT', name: 'Fitbit', icon: '⌚' },
  { id: 'WHOOP', name: 'Whoop', icon: '💪' },
  { id: 'OURA', name: 'Oura Ring', icon: '💍' },
  { id: 'GOOGLE_FIT', name: 'Google Fit', icon: '📱' }
];

export const BiometricsDashboard: React.FC<BiometricsDashboardProps> = ({ userAge = 30, onClose }) => {
  const {
    isConnected,
    isConnecting,
    provider,
    error,
    currentBiometrics,
    heartRateTrend,
    insights,
    recoveryMetrics,
    sleepData,
    workoutAdaptation,
    connectWearable,
    disconnect,
    refreshRecoveryData,
    getSleepAnalysis,
    zoneTargets,
    updateZoneTargets
  } = useBiometrics({ userAge });

  const [activeTab, setActiveTab] = useState<'realtime' | 'recovery' | 'sleep' | 'insights'>('realtime');
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [sleepAnalysis, setSleepAnalysis] = useState<any>(null);

  // Load sleep analysis
  useEffect(() => {
    if (isConnected && activeTab === 'sleep') {
      getSleepAnalysis().then(setSleepAnalysis);
    }
  }, [isConnected, activeTab, getSleepAnalysis]);

  // Heart rate chart configuration
  const chartData = {
    labels: heartRateTrend.timestamps.slice(-60).map(t => format(t, 'HH:mm:ss')),
    datasets: [
      {
        label: 'Heart Rate',
        data: heartRateTrend.values.slice(-60),
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.4,
        fill: true
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.5)',
          maxTicksLimit: 6
        }
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.5)'
        },
        min: 40,
        max: 200
      }
    }
  };

  const getZoneColor = (zone: string) => {
    switch (zone) {
      case 'rest': return 'bg-gray-500';
      case 'warmup': return 'bg-blue-500';
      case 'fat_burn': return 'bg-green-500';
      case 'cardio': return 'bg-yellow-500';
      case 'peak': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getRecoveryColor = (score: number) => {
    if (score >= 85) return 'text-green-500';
    if (score >= 70) return 'text-yellow-500';
    if (score >= 50) return 'text-orange-500';
    return 'text-red-500';
  };

  const getStressIcon = (level: string) => {
    switch (level) {
      case 'low': return '😌';
      case 'moderate': return '😐';
      case 'high': return '😰';
      default: return '😐';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gray-800 p-4 flex items-center justify-between border-b border-gray-700">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Activity className="text-red-500" />
            Biometrics Dashboard
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

        {/* Connection Status */}
        {!isConnected && (
          <div className="p-6 bg-gray-800 border-b border-gray-700">
            <h3 className="text-lg font-medium text-white mb-4">Connect Your Wearable Device</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {wearableProviders.map(provider => (
                <button
                  key={provider.id}
                  onClick={() => {
                    setSelectedProvider(provider.id);
                    connectWearable(provider.id);
                  }}
                  disabled={isConnecting}
                  className={`p-4 rounded-lg border transition-all ${
                    selectedProvider === provider.id
                      ? 'border-blue-500 bg-blue-500/20'
                      : 'border-gray-600 hover:border-gray-500'
                  } ${isConnecting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="text-3xl mb-2">{provider.icon}</div>
                  <div className="text-sm text-gray-300">{provider.name}</div>
                </button>
              ))}
            </div>
            {error && (
              <div className="mt-4 p-3 bg-red-900/20 border border-red-600 rounded-lg">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}
          </div>
        )}

        {/* Connected Content */}
        {isConnected && (
          <>
            {/* Tabs */}
            <div className="flex border-b border-gray-700">
              {[
                { id: 'realtime', label: 'Real-time', icon: Heart },
                { id: 'recovery', label: 'Recovery', icon: TrendingUp },
                { id: 'sleep', label: 'Sleep', icon: Moon },
                { id: 'insights', label: 'Insights', icon: Brain }
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

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              {/* Real-time Tab */}
              {activeTab === 'realtime' && (
                <div className="space-y-6">
                  {/* Current Metrics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="bg-gray-800 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Heart className="text-red-500" size={20} />
                        <span className="text-xs text-gray-400">BPM</span>
                      </div>
                      <div className="text-3xl font-bold text-white">
                        {currentBiometrics?.heart_rate || '--'}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">Heart Rate</div>
                    </motion.div>

                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="bg-gray-800 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Activity className="text-green-500" size={20} />
                        <span className="text-xs text-gray-400">ms</span>
                      </div>
                      <div className="text-3xl font-bold text-white">
                        {currentBiometrics?.heart_rate_variability || '--'}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">HRV</div>
                    </motion.div>

                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="bg-gray-800 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Brain className="text-yellow-500" size={20} />
                        <span className="text-xs text-gray-400">%</span>
                      </div>
                      <div className="text-3xl font-bold text-white">
                        {currentBiometrics?.stress_level || '--'}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">Stress</div>
                    </motion.div>

                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="bg-gray-800 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-orange-500">🔥</span>
                        <span className="text-xs text-gray-400">kcal</span>
                      </div>
                      <div className="text-3xl font-bold text-white">
                        {currentBiometrics?.calories_burned || 0}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">Calories</div>
                    </motion.div>
                  </div>

                  {/* Heart Rate Chart */}
                  <div className="bg-gray-800 rounded-lg p-4">
                    <h3 className="text-lg font-medium text-white mb-4">Heart Rate Trend</h3>
                    <div className="h-64">
                      <Line data={chartData} options={chartOptions} />
                    </div>
                  </div>

                  {/* Zone Targets */}
                  {zoneTargets.length > 0 && (
                    <div className="bg-gray-800 rounded-lg p-4">
                      <h3 className="text-lg font-medium text-white mb-4">Heart Rate Zones</h3>
                      <div className="space-y-3">
                        {zoneTargets.map((zone, index) => (
                          <div key={index}>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm text-gray-300 capitalize">{zone.zone}</span>
                              <span className="text-sm text-gray-400">
                                {zone.actualMinutes.toFixed(1)} / {zone.targetMinutes} min
                              </span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all ${getZoneColor(zone.zone)}`}
                                style={{ width: `${zone.percentComplete}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Recovery Tab */}
              {activeTab === 'recovery' && recoveryMetrics && (
                <div className="space-y-6">
                  {/* Recovery Score */}
                  <div className="bg-gray-800 rounded-lg p-6 text-center">
                    <h3 className="text-lg font-medium text-gray-400 mb-4">Recovery Score</h3>
                    <div className={`text-6xl font-bold ${getRecoveryColor(recoveryMetrics.recovery_score)}`}>
                      {recoveryMetrics.recovery_score}%
                    </div>
                    <div className="mt-2 text-gray-400">
                      {recoveryMetrics.recovery_score >= 85 ? 'Excellent' :
                       recoveryMetrics.recovery_score >= 70 ? 'Good' :
                       recoveryMetrics.recovery_score >= 50 ? 'Fair' : 'Poor'}
                    </div>
                  </div>

                  {/* Key Metrics */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="bg-gray-800 rounded-lg p-4">
                      <div className="text-sm text-gray-400 mb-1">HRV Trend</div>
                      <div className="text-xl font-medium text-white capitalize">
                        {recoveryMetrics.hrv_trend}
                      </div>
                    </div>

                    <div className="bg-gray-800 rounded-lg p-4">
                      <div className="text-sm text-gray-400 mb-1">Sleep Quality</div>
                      <div className="text-xl font-medium text-white">
                        {recoveryMetrics.sleep_quality}%
                      </div>
                    </div>

                    <div className="bg-gray-800 rounded-lg p-4">
                      <div className="text-sm text-gray-400 mb-1">Stress Level</div>
                      <div className="text-xl font-medium text-white flex items-center gap-2">
                        <span className="capitalize">{recoveryMetrics.stress_level}</span>
                        <span>{getStressIcon(recoveryMetrics.stress_level)}</span>
                      </div>
                    </div>

                    <div className="bg-gray-800 rounded-lg p-4">
                      <div className="text-sm text-gray-400 mb-1">Readiness</div>
                      <div className="text-xl font-medium text-white">
                        {recoveryMetrics.readiness_score}%
                      </div>
                    </div>
                  </div>

                  {/* Recommendations */}
                  {recoveryMetrics.recommendations.length > 0 && (
                    <div className="bg-gray-800 rounded-lg p-4">
                      <h3 className="text-lg font-medium text-white mb-3">Recommendations</h3>
                      <ul className="space-y-2">
                        {recoveryMetrics.recommendations.map((rec, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <ChevronRight className="text-blue-500 mt-0.5" size={16} />
                            <span className="text-sm text-gray-300">{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Workout Adaptation */}
                  {workoutAdaptation && (
                    <div className="bg-gray-800 rounded-lg p-4">
                      <h3 className="text-lg font-medium text-white mb-3">Today's Workout Adaptation</h3>
                      
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="text-center">
                          <div className="text-sm text-gray-400">Intensity</div>
                          <div className="text-xl font-medium text-white">
                            {Math.round(workoutAdaptation.intensityModifier * 100)}%
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm text-gray-400">Volume</div>
                          <div className="text-xl font-medium text-white">
                            {Math.round(workoutAdaptation.volumeModifier * 100)}%
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm text-gray-400">Rest</div>
                          <div className="text-xl font-medium text-white">
                            {Math.round(workoutAdaptation.restModifier * 100)}%
                          </div>
                        </div>
                      </div>

                      {workoutAdaptation.reasons.length > 0 && (
                        <div className="border-t border-gray-700 pt-3">
                          <p className="text-xs text-gray-400 mb-2">Reasons:</p>
                          <ul className="space-y-1">
                            {workoutAdaptation.reasons.map((reason: string, index: number) => (
                              <li key={index} className="text-xs text-gray-300">• {reason}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Sleep Tab */}
              {activeTab === 'sleep' && sleepData && (
                <div className="space-y-6">
                  {/* Sleep Score */}
                  <div className="bg-gray-800 rounded-lg p-6 text-center">
                    <h3 className="text-lg font-medium text-gray-400 mb-4">Sleep Score</h3>
                    <div className={`text-6xl font-bold ${getRecoveryColor(sleepData.sleep_score)}`}>
                      {sleepData.sleep_score}
                    </div>
                    <div className="mt-2 text-gray-400">
                      {sleepData.duration_hours.toFixed(1)} hours
                    </div>
                  </div>

                  {/* Sleep Stages */}
                  <div className="bg-gray-800 rounded-lg p-4">
                    <h3 className="text-lg font-medium text-white mb-4">Sleep Stages</h3>
                    <div className="space-y-3">
                      {Object.entries(sleepData.sleep_stages).map(([stage, hours]) => (
                        <div key={stage}>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm text-gray-300 capitalize">{stage}</span>
                            <span className="text-sm text-gray-400">{(hours as number).toFixed(1)}h</span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${
                                stage === 'deep' ? 'bg-purple-500' :
                                stage === 'rem' ? 'bg-blue-500' :
                                stage === 'light' ? 'bg-green-500' : 'bg-gray-500'
                              }`}
                              style={{ width: `${(hours as number / sleepData.duration_hours) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Sleep Metrics */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-800 rounded-lg p-4">
                      <div className="text-sm text-gray-400 mb-1">Average HRV</div>
                      <div className="text-xl font-medium text-white">{sleepData.hrv_avg} ms</div>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-4">
                      <div className="text-sm text-gray-400 mb-1">Respiratory Rate</div>
                      <div className="text-xl font-medium text-white">{sleepData.respiratory_rate_avg} brpm</div>
                    </div>
                  </div>

                  {/* Sleep Analysis */}
                  {sleepAnalysis && (
                    <div className="bg-gray-800 rounded-lg p-4">
                      <h3 className="text-lg font-medium text-white mb-3">Sleep Analysis</h3>
                      
                      <div className="mb-4">
                        <span className="text-sm text-gray-400">Quality: </span>
                        <span className={`text-sm font-medium capitalize ${
                          sleepAnalysis.quality === 'excellent' ? 'text-green-500' :
                          sleepAnalysis.quality === 'good' ? 'text-yellow-500' :
                          sleepAnalysis.quality === 'fair' ? 'text-orange-500' : 'text-red-500'
                        }`}>
                          {sleepAnalysis.quality}
                        </span>
                      </div>

                      {sleepAnalysis.insights.length > 0 && (
                        <div className="mb-4">
                          <p className="text-sm font-medium text-gray-400 mb-2">Insights:</p>
                          <ul className="space-y-1">
                            {sleepAnalysis.insights.map((insight: string, index: number) => (
                              <li key={index} className="text-sm text-gray-300">• {insight}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {sleepAnalysis.recommendations.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-gray-400 mb-2">Recommendations:</p>
                          <ul className="space-y-1">
                            {sleepAnalysis.recommendations.map((rec: string, index: number) => (
                              <li key={index} className="text-sm text-gray-300">• {rec}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Insights Tab */}
              {activeTab === 'insights' && (
                <div className="space-y-4">
                  {insights.length === 0 ? (
                    <div className="text-center py-8">
                      <Brain className="mx-auto text-gray-600 mb-4" size={48} />
                      <p className="text-gray-400">No insights yet. Start a workout to see real-time analysis.</p>
                    </div>
                  ) : (
                    <AnimatePresence>
                      {insights.map((insight, index) => (
                        <motion.div
                          key={`${insight.title}-${index}`}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          className={`bg-gray-800 rounded-lg p-4 border-l-4 ${
                            insight.type === 'warning' ? 'border-red-500' :
                            insight.type === 'info' ? 'border-blue-500' : 'border-green-500'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            {insight.type === 'warning' && <AlertTriangle className="text-red-500 mt-0.5" size={20} />}
                            <div className="flex-1">
                              <h4 className="font-medium text-white">{insight.title}</h4>
                              <p className="text-sm text-gray-400 mt-1">{insight.message}</p>
                              {insight.recommendation && (
                                <p className="text-sm text-blue-400 mt-2">💡 {insight.recommendation}</p>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  )}
                </div>
              )}
            </div>

            {/* Footer - Connected Device */}
            <div className="p-4 bg-gray-800 border-t border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Watch className="text-green-500" size={16} />
                <span className="text-sm text-gray-300">Connected to {provider}</span>
              </div>
              <button
                onClick={() => {
                  disconnect();
                  setSelectedProvider(null);
                }}
                className="text-sm text-red-400 hover:text-red-300 transition-colors"
              >
                Disconnect
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};