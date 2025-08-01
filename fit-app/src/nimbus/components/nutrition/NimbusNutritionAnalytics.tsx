import React, { useState, useEffect } from 'react';
import { TrendingUp, Target, Lightbulb, Calendar, BarChart3, PieChart, Activity } from 'lucide-react';
import { NimbusAnalyticsData, NimbusNutritionInsight } from '../../../types/nimbus/NimbusNutrition';
import { nimbusNutritionAnalytics } from '../../services/NimbusNutritionAnalytics';
import { NimbusButton } from '../NimbusButton';
import { NimbusCard } from '../NimbusCard';

interface NimbusNutritionAnalyticsProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NimbusNutritionAnalytics: React.FC<NimbusNutritionAnalyticsProps> = ({
  isOpen,
  onClose
}) => {
  const [analyticsData, setAnalyticsData] = useState<NimbusAnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState<'week' | 'month'>('week');
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    if (isOpen) {
      loadAnalytics();
    }
  }, [isOpen, timeRange, selectedDate]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      let data: NimbusAnalyticsData;
      
      if (timeRange === 'week') {
        const weekStart = new Date(selectedDate);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        data = await nimbusNutritionAnalytics.getWeeklyAnalytics(weekStart);
      } else {
        data = await nimbusNutritionAnalytics.getMonthlyAnalytics(
          selectedDate.getFullYear(),
          selectedDate.getMonth() + 1
        );
      }
      
      setAnalyticsData(data);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'decreasing':
        return <TrendingUp className="w-4 h-4 text-red-500 transform rotate-180" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return 'text-green-600 dark:text-green-400';
      case 'decreasing':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getInsightPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-red-500 bg-red-50 dark:bg-red-900/20';
      case 'medium':
        return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
      case 'low':
        return 'border-blue-500 bg-blue-50 dark:bg-blue-900/20';
      default:
        return 'border-gray-300 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
      <NimbusCard variant="default" padding="lg" className="w-full max-w-6xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary-500" />
            Nutrition Analytics
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Time Range Selector */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex rounded-lg border border-gray-300 dark:border-gray-600">
            <button
              onClick={() => setTimeRange('week')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                timeRange === 'week'
                  ? 'bg-primary-500 text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setTimeRange('month')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                timeRange === 'month'
                  ? 'bg-primary-500 text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              Month
            </button>
          </div>
          
          <input
            type="date"
            value={selectedDate.toISOString().split('T')[0]}
            onChange={(e) => setSelectedDate(new Date(e.target.value))}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading analytics...</p>
            </div>
          </div>
        ) : analyticsData ? (
          <div className="space-y-6">
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <NimbusCard variant="glass" padding="md" className="text-center">
                <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                  {analyticsData.averageDailyCalories.toFixed(0)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Avg Daily Calories</div>
                <div className="flex items-center justify-center mt-2">
                  {getTrendIcon(analyticsData.trends.caloriesTrend)}
                  <span className={`text-xs ml-1 ${getTrendColor(analyticsData.trends.caloriesTrend)}`}>
                    {analyticsData.trends.caloriesTrend}
                  </span>
                </div>
              </NimbusCard>

              <NimbusCard variant="glass" padding="md" className="text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {analyticsData.averageDailyProtein.toFixed(1)}g
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Avg Daily Protein</div>
                <div className="flex items-center justify-center mt-2">
                  {getTrendIcon(analyticsData.trends.proteinTrend)}
                  <span className={`text-xs ml-1 ${getTrendColor(analyticsData.trends.proteinTrend)}`}>
                    {analyticsData.trends.proteinTrend}
                  </span>
                </div>
              </NimbusCard>

              <NimbusCard variant="glass" padding="md" className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {analyticsData.consistencyScore.toFixed(0)}%
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Consistency Score</div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                  <div
                    className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${analyticsData.consistencyScore}%` }}
                  ></div>
                </div>
              </NimbusCard>

              <NimbusCard variant="glass" padding="md" className="text-center">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {analyticsData.totalEntries}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Entries</div>
                <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  {analyticsData.totalDays} days tracked
                </div>
              </NimbusCard>
            </div>

            {/* Goal Progress */}
            <NimbusCard variant="default" padding="lg">
              <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-primary-500" />
                Goal Progress
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(analyticsData.goalProgress).map(([macro, progress]) => (
                  <div key={macro} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="capitalize font-medium">{macro}</span>
                      <span className="text-gray-600 dark:text-gray-400">
                        {progress.actual.toFixed(1)}/{progress.target}g
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          progress.percentage >= 100 ? 'bg-green-500' : 'bg-primary-500'
                        }`}
                        style={{ width: `${Math.min(100, progress.percentage)}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-500 text-right">
                      {progress.percentage.toFixed(0)}%
                    </div>
                  </div>
                ))}
              </div>
            </NimbusCard>

            {/* Insights */}
            {analyticsData.insights.length > 0 && (
              <NimbusCard variant="default" padding="lg">
                <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-yellow-500" />
                  AI Insights ({analyticsData.insights.length})
                </h4>
                <div className="space-y-3">
                  {analyticsData.insights.map((insight, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border-l-4 ${getInsightPriorityColor(insight.priority)}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h5 className="font-medium text-gray-900 dark:text-white mb-1">
                            {insight.title}
                          </h5>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {insight.message}
                          </p>
                          {insight.actionable && insight.suggestedActions && (
                            <div className="space-y-1">
                              <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                Suggested Actions:
                              </p>
                              <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                                {insight.suggestedActions.map((action, actionIndex) => (
                                  <li key={actionIndex} className="flex items-center gap-2">
                                    <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                                    {action}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full capitalize ${
                          insight.priority === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' :
                          insight.priority === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400' :
                          'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                        }`}>
                          {insight.priority}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </NimbusCard>
            )}

            {/* Meal Distribution */}
            <NimbusCard variant="default" padding="lg">
              <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <PieChart className="w-5 h-5 text-primary-500" />
                Meal Distribution
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  {Object.entries(analyticsData.mealDistribution).map(([meal, calories]) => {
                    const totalCalories = Object.values(analyticsData.mealDistribution).reduce((sum, cal) => sum + cal, 0);
                    const percentage = totalCalories > 0 ? (calories / totalCalories) * 100 : 0;
                    
                    return (
                      <div key={meal} className="flex items-center justify-between">
                        <span className="text-sm font-medium capitalize">
                          {meal.replace('-', ' ')}
                        </span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600 dark:text-gray-400 w-16 text-right">
                            {calories.toFixed(0)} cal
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                <div className="space-y-3">
                  <h5 className="font-medium text-gray-900 dark:text-white">Top Foods</h5>
                  {analyticsData.topFoods.slice(0, 5).map((food, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span className="truncate flex-1">{food.food}</span>
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <span>{food.frequency}x</span>
                        <span>•</span>
                        <span>{food.totalCalories.toFixed(0)} cal</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </NimbusCard>
          </div>
        ) : (
          <div className="text-center py-12">
            <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">No analytics data available</p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
              Start logging your meals to see detailed analytics
            </p>
          </div>
        )}

        <div className="flex justify-end mt-6">
          <NimbusButton variant="secondary" onClick={onClose}>
            Close
          </NimbusButton>
        </div>
      </NimbusCard>
    </div>
  );
}; 