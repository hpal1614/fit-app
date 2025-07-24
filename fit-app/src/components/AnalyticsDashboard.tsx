import React from 'react';
import { TrendingUp, Calendar, Target, BarChart3, Activity, Award } from 'lucide-react';

interface AnalyticsData {
  workoutFrequency: number[];
  strengthProgress: { exercise: string; progress: number }[];
  volumeProgress: number[];
  personalRecords: { exercise: string; weight: number; date: string }[];
}

export const AnalyticsDashboard: React.FC = () => {
  // Mock data - replace with real data later
  const analyticsData: AnalyticsData = {
    workoutFrequency: [4, 5, 3, 6, 4, 5, 6], // Last 7 days
    strengthProgress: [
      { exercise: 'Bench Press', progress: 12.5 },
      { exercise: 'Deadlift', progress: 15.0 },
      { exercise: 'Squat', progress: 10.0 }
    ],
    volumeProgress: [18000, 19500, 20100, 21000, 20800, 22000, 23500],
    personalRecords: [
      { exercise: 'Bench Press', weight: 110, date: '2024-01-20' },
      { exercise: 'Deadlift', weight: 180, date: '2024-01-18' },
      { exercise: 'Squat', weight: 140, date: '2024-01-15' }
    ]
  };

  const maxFrequency = Math.max(...analyticsData.workoutFrequency);
  const maxVolume = Math.max(...analyticsData.volumeProgress);

  return (
    <div className="space-y-6">
      {/* Weekly Overview */}
      <div className="bg-gray-900/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-800">
        <div className="flex items-center space-x-2 mb-4">
          <Calendar className="w-5 h-5 text-lime-400" />
          <h2 className="text-xl font-bold">Weekly Activity</h2>
        </div>
        
        <div className="flex items-end justify-between h-32 mb-2">
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div className="w-full mx-1 bg-gray-700 rounded-t relative">
                <div 
                  className="absolute bottom-0 w-full bg-gradient-to-t from-lime-400 to-green-500 rounded-t transition-all duration-500"
                  style={{ 
                    height: `${(analyticsData.workoutFrequency[index] / maxFrequency) * 100}%` 
                  }}
                />
              </div>
              <span className="text-xs text-gray-400 mt-2">{day}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Strength Progress */}
      <div className="bg-gray-900/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-800">
        <div className="flex items-center space-x-2 mb-4">
          <TrendingUp className="w-5 h-5 text-lime-400" />
          <h2 className="text-xl font-bold">Strength Progress</h2>
        </div>
        
        <div className="space-y-3">
          {analyticsData.strengthProgress.map((item, index) => (
            <div key={index}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium">{item.exercise}</span>
                <span className="text-sm text-lime-400">+{item.progress}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-lime-400 to-green-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(item.progress * 5, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Volume Trend */}
      <div className="bg-gray-900/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-800">
        <div className="flex items-center space-x-2 mb-4">
          <BarChart3 className="w-5 h-5 text-lime-400" />
          <h2 className="text-xl font-bold">Total Volume (lbs)</h2>
        </div>
        
        <div className="flex items-end justify-between h-24">
          {analyticsData.volumeProgress.map((volume, index) => (
            <div key={index} className="flex-1 mx-0.5">
              <div 
                className="w-full bg-gradient-to-t from-blue-400 to-purple-500 rounded-t"
                style={{ 
                  height: `${(volume / maxVolume) * 100}%` 
                }}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-xs text-gray-400">7 days ago</span>
          <span className="text-xs text-gray-400">Today</span>
        </div>
      </div>

      {/* Personal Records */}
      <div className="bg-gray-900/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-800">
        <div className="flex items-center space-x-2 mb-4">
          <Award className="w-5 h-5 text-lime-400" />
          <h2 className="text-xl font-bold">Recent PRs</h2>
        </div>
        
        <div className="space-y-3">
          {analyticsData.personalRecords.map((pr, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-xl">
              <div>
                <div className="font-medium">{pr.exercise}</div>
                <div className="text-sm text-gray-400">{pr.date}</div>
              </div>
              <div className="text-xl font-bold text-lime-400">{pr.weight} lbs</div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-900/80 backdrop-blur-lg rounded-2xl p-4 border border-gray-800">
          <Activity className="w-8 h-8 text-orange-400 mb-2" />
          <div className="text-2xl font-bold">87%</div>
          <div className="text-sm text-gray-400">Consistency Rate</div>
        </div>
        <div className="bg-gray-900/80 backdrop-blur-lg rounded-2xl p-4 border border-gray-800">
          <Target className="w-8 h-8 text-purple-400 mb-2" />
          <div className="text-2xl font-bold">12</div>
          <div className="text-sm text-gray-400">PRs This Month</div>
        </div>
      </div>
    </div>
  );
};