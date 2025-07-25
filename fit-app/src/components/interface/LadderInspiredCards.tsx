import React from 'react';
import { ArrowRight, TrendingUp, Target, Zap } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    direction: 'up' | 'down';
    value: string;
  };
  color: 'blue' | 'green' | 'purple' | 'orange' | 'pink';
  onClick?: () => void;
}

export const LadderStatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  color,
  onClick
}) => {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600',
    pink: 'from-pink-500 to-pink-600'
  };

  return (
    <button
      onClick={onClick}
      className="w-full p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all duration-200 hover:scale-105 text-left"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl bg-gradient-to-r ${colorClasses[color]} text-white`}>
          <Target size={20} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
            trend.direction === 'up' 
              ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300'
              : 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300'
          }`}>
            <TrendingUp size={12} className={trend.direction === 'down' ? 'rotate-180' : ''} />
            {trend.value}
          </div>
        )}
      </div>
      
      <div className="space-y-1">
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {title}
        </h3>
        <div className="text-2xl font-bold text-gray-900 dark:text-white">
          {value}
        </div>
        {subtitle && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {subtitle}
          </p>
        )}
      </div>
      
      <div className="flex items-center justify-end mt-4 text-gray-400">
        <ArrowRight size={16} />
      </div>
    </button>
  );
};

interface ActionCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  action: string;
  color: 'blue' | 'green' | 'purple' | 'orange';
  onClick?: () => void;
}

export const LadderActionCard: React.FC<ActionCardProps> = ({
  title,
  description,
  icon,
  action,
  color,
  onClick
}) => {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600 shadow-blue-500/25',
    green: 'from-green-500 to-green-600 shadow-green-500/25',
    purple: 'from-purple-500 to-purple-600 shadow-purple-500/25',
    orange: 'from-orange-500 to-orange-600 shadow-orange-500/25'
  };

  return (
    <div className={`p-6 rounded-2xl bg-gradient-to-r ${colorClasses[color]} text-white shadow-lg`}>
      <div className="flex items-start justify-between mb-4">
        <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
          {icon}
        </div>
        <Zap size={20} className="text-white/60" />
      </div>
      
      <div className="space-y-3">
        <h3 className="text-xl font-bold">
          {title}
        </h3>
        <p className="text-white/80 text-sm leading-relaxed">
          {description}
        </p>
        
        <button
          onClick={onClick}
          className="w-full mt-4 py-3 px-4 bg-white/20 hover:bg-white/30 rounded-xl font-medium transition-all duration-200 backdrop-blur-sm"
        >
          {action}
        </button>
      </div>
    </div>
  );
};

export const LadderProgressCard: React.FC<{
  title: string;
  progress: number;
  total: number;
  unit: string;
  color: 'blue' | 'green' | 'purple';
}> = ({ title, progress, total, unit, color }) => {
  const percentage = Math.min((progress / total) * 100, 100);
  
  const colorClasses = {
    blue: 'text-blue-600 dark:text-blue-400',
    green: 'text-green-600 dark:text-green-400', 
    purple: 'text-purple-600 dark:text-purple-400'
  };

  const bgClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500'
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {title}
        </h3>
        <span className={`text-2xl font-bold ${colorClasses[color]}`}>
          {Math.round(percentage)}%
        </span>
      </div>
      
      <div className="space-y-3">
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>{progress} {unit}</span>
          <span>{total} {unit}</span>
        </div>
        
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
          <div 
            className={`h-3 rounded-full transition-all duration-500 ${bgClasses[color]}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {total - progress} {unit} remaining
        </div>
      </div>
    </div>
  );
};