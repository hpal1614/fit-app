import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Target, Zap, Calendar, Trophy, Activity, Users } from 'lucide-react';
import { NimbusAdvancedAnalytics, NimbusComprehensiveAnalytics } from '../../../services/nimbus/NimbusAdvancedAnalytics';

export const NimbusAdvancedAnalyticsDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<NimbusComprehensiveAnalytics | null>(null);
  const [timeframe, setTimeframe] = useState<'week' | 'month' | '3months' | 'year' | 'all'>('month');
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'workouts' | 'nutrition' | 'ai' | 'predictions'>('overview');

  const analyticsService = new NimbusAdvancedAnalytics();

  useEffect(() => {
    loadAnalytics();
  }, [timeframe]);

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      const data = await analyticsService.generateAnalytics(timeframe);
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="nimbus-analytics-dashboard p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="nimbus-analytics-dashboard p-6">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-gray-500 dark:text-gray-400">No analytics data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="nimbus-analytics-dashboard p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Advanced Analytics
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Comprehensive insights into your fitness journey
              </p>
            </div>
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="3months">Last 3 Months</option>
              <option value="year">Last Year</option>
              <option value="all">All Time</option>
            </select>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'workouts', label: 'Workouts', icon: Activity },
              { id: 'nutrition', label: 'Nutrition', icon: Target },
              { id: 'ai', label: 'AI Usage', icon: Zap },
              { id: 'predictions', label: 'Predictions', icon: TrendingUp }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md transition-colors ${
                  activeTab === tab.id
                    ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="text-sm font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="nimbus-glass rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Workouts</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {analytics.workoutStats.totalWorkouts}
                    </p>
                  </div>
                  <Activity className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
              </div>

              <div className="nimbus-glass rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Current Streak</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {analytics.workoutStats.consistency.currentStreak} days
                    </p>
                  </div>
                  <Trophy className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>

              <div className="nimbus-glass rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Nutrition Score</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {analytics.nutritionStats.nutritionScore}/100
                    </p>
                  </div>
                  <Target className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
              </div>

              <div className="nimbus-glass rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">AI Questions</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {analytics.aiUsageStats.totalQuestions}
                    </p>
                  </div>
                  <Zap className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </div>

            {/* Progress Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="nimbus-glass rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Strength Progress
                </h3>
                <div className="space-y-4">
                  {analytics.workoutStats.strengthProgress.slice(0, 5).map((progress, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {progress.exercise}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${Math.min(progress.progressPercentage, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            +{progress.progressPercentage}%
                          </span>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {progress.currentMax} lbs
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          from {progress.initialMax} lbs
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="nimbus-glass rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Macro Consistency
                </h3>
                <div className="space-y-4">
                  {[
                    { name: 'Protein', rate: analytics.nutritionStats.macroConsistency.proteinGoalHitRate, color: 'bg-red-500' },
                    { name: 'Carbs', rate: analytics.nutritionStats.macroConsistency.carbsGoalHitRate, color: 'bg-blue-500' },
                    { name: 'Fat', rate: analytics.nutritionStats.macroConsistency.fatGoalHitRate, color: 'bg-yellow-500' }
                  ].map((macro, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {macro.name}
                      </span>
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className={`${macro.color} h-2 rounded-full transition-all duration-500`}
                            style={{ width: `${macro.rate}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-500 dark:text-gray-400 w-12 text-right">
                          {macro.rate}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Workouts Tab */}
        {activeTab === 'workouts' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="nimbus-glass rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Workout Stats
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Total Sets</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {analytics.workoutStats.totalSets.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Total Reps</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {analytics.workoutStats.totalReps.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Total Volume</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {analytics.workoutStats.totalVolume.toLocaleString()} lbs
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Avg Duration</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {analytics.workoutStats.averageWorkoutDuration} min
                    </span>
                  </div>
                </div>
              </div>

              <div className="nimbus-glass rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Consistency
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Weekly Average</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {analytics.workoutStats.consistency.weeklyAverage} workouts
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Current Streak</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {analytics.workoutStats.consistency.currentStreak} days
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Longest Streak</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {analytics.workoutStats.consistency.longestStreak} days
                    </span>
                  </div>
                </div>
              </div>

              <div className="nimbus-glass rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Top Exercises
                </h3>
                <div className="space-y-3">
                  {analytics.workoutStats.strengthProgress.slice(0, 5).map((progress, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm text-gray-900 dark:text-white truncate">
                        {progress.exercise}
                      </span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {progress.currentMax} lbs
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Nutrition Tab */}
        {activeTab === 'nutrition' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="nimbus-glass rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Daily Nutrition
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Avg Calories</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {analytics.nutritionStats.averageDailyCalories.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Nutrition Score</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {analytics.nutritionStats.nutritionScore}/100
                    </span>
                  </div>
                </div>
              </div>

              <div className="nimbus-glass rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Favorite Foods
                </h3>
                <div className="space-y-3">
                  {analytics.nutritionStats.favoriteFoods.map((food, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm text-gray-900 dark:text-white">
                        {food.name}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {food.frequency}x
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AI Usage Tab */}
        {activeTab === 'ai' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="nimbus-glass rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  AI Interaction Stats
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Total Questions</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {analytics.aiUsageStats.totalQuestions}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Avg Response Time</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {analytics.aiUsageStats.averageResponseTime}s
                    </span>
                  </div>
                </div>
              </div>

              <div className="nimbus-glass rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Voice Commands
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Total Commands</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {analytics.aiUsageStats.voiceUsage.totalCommands}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Avg Confidence</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {(analytics.aiUsageStats.voiceUsage.averageConfidence * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="nimbus-glass rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Top AI Topics
              </h3>
              <div className="flex flex-wrap gap-2">
                {analytics.aiUsageStats.topTopics.map((topic, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400 rounded-full text-sm"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Predictions Tab */}
        {activeTab === 'predictions' && (
          <div className="space-y-6">
            <div className="nimbus-glass rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Next Personal Records
              </h3>
              <div className="space-y-4">
                {analytics.predictions.nextPR.map((prediction, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {prediction.exercise}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Current: {prediction.currentMax} lbs → Predicted: {prediction.predictedMax} lbs
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {new Date(prediction.estimatedDate).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {(prediction.confidence * 100).toFixed(0)}% confidence
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 