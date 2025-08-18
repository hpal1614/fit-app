import React from 'react';

interface BottomNavigationProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  currentView,
  onNavigate
}) => {
  const tabs = [
    { id: 'home', label: 'Logger', icon: '💪', color: 'primary' },
    { id: 'workout', label: 'Workouts', icon: '🏋️', color: 'secondary' },
    { id: 'nutrition', label: 'Nutrition', icon: '🍎', color: 'success' },
    { id: 'ai-coach', label: 'AI Coach', icon: '🤖', color: 'accent' }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-200 dark:bg-gray-900/95 dark:border-gray-700 z-50">
      <div className="flex justify-around items-center h-16 px-2">
        {tabs.map((tab) => {
          const isActive = currentView === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onNavigate(tab.id)}
              className={`flex flex-col items-center justify-center flex-1 h-full rounded-lg transition-all duration-200 ${
                isActive
                  ? `bg-${tab.color} text-white shadow-lg`
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <span className="text-xl mb-1">{tab.icon}</span>
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
