import React from 'react';
import { Dumbbell, BookOpen, Camera, MessageCircle } from 'lucide-react';

interface TabConfig {
  id: string;
  name: string;
  icon: React.ReactNode;
}

export const BottomNavigation: React.FC<{
  activeTab: string;
  onTabChange: (tabId: string) => void;
  workoutActive?: boolean;
}> = ({ activeTab, onTabChange, workoutActive }) => {
  const tabs: TabConfig[] = [
    {
      id: 'logger',
      name: 'Logger',
      icon: <Dumbbell size={20} />
    },
    {
      id: 'workouts',
      name: 'Workouts',
      icon: <BookOpen size={20} />
    },
    {
      id: 'nutrition',
      name: 'Nutrition',
      icon: <Camera size={20} />
    },
    {
      id: 'coach',
      name: 'AI Coach',
      icon: <MessageCircle size={20} />
    }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 z-50">
      <div className="flex items-center justify-around py-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              flex flex-col items-center py-2 px-4 rounded-lg transition-all duration-200
              ${activeTab === tab.id
                ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20'
                : 'text-gray-500 dark:text-gray-400 hover:text-blue-600'
              }
              ${tab.id === 'logger' && workoutActive ? 'animate-pulse' : ''}
            `}
          >
            <div className="relative">
              {tab.icon}
              {tab.id === 'logger' && workoutActive && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              )}
            </div>
            <span className="text-xs mt-1 font-medium">{tab.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
