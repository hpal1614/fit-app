import React from 'react';
import { BarChart3, TrendingUp, Award, Calendar } from 'lucide-react';

interface AnalyticsDashboardProps {
  className?: string;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ className = '' }) => {
  return (
    <div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>
      <div className="flex items-center space-x-3 mb-6">
        <BarChart3 className="text-fitness-blue" size={24} />
        <h2 className="text-xl font-bold text-gray-900">Analytics Dashboard</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Total Workouts</p>
              <p className="text-2xl font-bold text-blue-900">24</p>
            </div>
            <Calendar className="text-blue-500" size={32} />
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Weekly Progress</p>
              <p className="text-2xl font-bold text-green-900">+12%</p>
            </div>
            <TrendingUp className="text-green-500" size={32} />
          </div>
        </div>

        <div className="bg-yellow-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-600 font-medium">Achievements</p>
              <p className="text-2xl font-bold text-yellow-900">8</p>
            </div>
            <Award className="text-yellow-500" size={32} />
          </div>
        </div>
      </div>
    </div>
  );
};
