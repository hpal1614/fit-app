import React, { useState } from 'react';
import { Dumbbell, Calendar, Apple, MessageCircle, TrendingUp, User, Settings } from 'lucide-react';

interface LadderNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isWorkoutActive?: boolean;
}

export const LadderInspiredNavigation: React.FC<LadderNavigationProps> = ({
  activeTab,
  onTabChange,
  isWorkoutActive = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const mainTabs = [
    {
      id: 'logger',
      label: 'Workout',
      icon: Dumbbell,
      badgeCount: isWorkoutActive ? 1 : 0,
      color: 'blue'
    },
    {
      id: 'workouts', 
      label: 'Plans',
      icon: Calendar,
      badgeCount: 0,
      color: 'purple'
    },
    {
      id: 'nutrition',
      label: 'Nutrition', 
      icon: Apple,
      badgeCount: 0,
      color: 'green'
    },
    {
      id: 'coach',
      label: 'Coach',
      icon: MessageCircle,
      badgeCount: 0,
      color: 'orange'
    }
  ];

  const secondaryTabs = [
    {
      id: 'progress',
      label: 'Progress',
      icon: TrendingUp,
      color: 'pink'
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: User,
      color: 'gray'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      color: 'gray'
    }
  ];

  const getColorClasses = (color: string, isActive: boolean) => {
    const colors = {
      blue: isActive 
        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
        : 'text-gray-600 dark:text-gray-400',
      purple: isActive 
        ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' 
        : 'text-gray-600 dark:text-gray-400',
      green: isActive 
        ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' 
        : 'text-gray-600 dark:text-gray-400',
      orange: isActive 
        ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400' 
        : 'text-gray-600 dark:text-gray-400',
      pink: isActive 
        ? 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400' 
        : 'text-gray-600 dark:text-gray-400',
      gray: isActive 
        ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100' 
        : 'text-gray-600 dark:text-gray-400'
    };
    return colors[color as keyof typeof colors] || colors.gray;
  };

  return (
    <>
      {/* Floating Action Button (Ladder-style) */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`fixed bottom-24 right-6 w-14 h-14 rounded-full shadow-lg z-50 transition-all duration-300 ${
          isExpanded 
            ? 'bg-red-500 hover:bg-red-600 rotate-45' 
            : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-xl'
        } text-white flex items-center justify-center`}
      >
        <span className="text-2xl font-light">+</span>
      </button>

      {/* Expanded Menu Overlay */}
      {isExpanded && (
        <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setIsExpanded(false)} />
      )}

      {/* Expanded Menu */}
      <div className={`fixed bottom-32 right-6 z-50 transition-all duration-300 ${
        isExpanded ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
      }`}>
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-4 min-w-[200px]">
          <div className="space-y-2">
            {secondaryTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    onTabChange(tab.id);
                    setIsExpanded(false);
                  }}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                    getColorClasses(tab.color, isActive)
                  } hover:bg-gray-50 dark:hover:bg-gray-700`}
                >
                  <Icon size={20} />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-t border-gray-200 dark:border-gray-700 safe-area-pb z-40">
        <div className="flex items-center justify-around h-20 px-4">
          {mainTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex flex-col items-center justify-center flex-1 h-full relative transition-all duration-200 ${
                  isActive ? 'transform scale-110' : 'hover:scale-105'
                }`}
              >
                <div className={`p-3 rounded-2xl transition-all ${
                  getColorClasses(tab.color, isActive)
                }`}>
                  <Icon size={24} />
                  {tab.badgeCount > 0 && (
                    <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {tab.badgeCount}
                    </div>
                  )}
                </div>
                
                <span className={`text-xs mt-1 font-medium transition-colors ${
                  isActive 
                    ? `text-${tab.color}-600 dark:text-${tab.color}-400` 
                    : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {tab.label}
                </span>

                {/* Active indicator */}
                {isActive && (
                  <div className={`absolute -top-1 left-1/2 transform -translate-x-1/2 w-6 h-1 bg-${tab.color}-600 dark:bg-${tab.color}-400 rounded-full`} />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default LadderInspiredNavigation;