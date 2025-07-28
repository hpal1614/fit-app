import React from 'react';
import { Dumbbell, Apple, Brain, User } from 'lucide-react';
import type { TabId } from './layout/AppLayout';

interface Tab {
  id: TabId;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  badge?: number;
}

export const BottomNavigation: React.FC<{
  activeTab: string;
  onTabChange: (tab: TabId) => void;
  workoutActive?: boolean;
}> = ({ activeTab, onTabChange, workoutActive }) => {
  const tabs: Tab[] = [
    {
      id: 'workout',
      label: 'Workout',
      icon: Dumbbell,
      badge: workoutActive ? 1 : undefined
    },
    {
      id: 'nutrition',
      label: 'Nutrition',
      icon: Apple,
    },
    {
      id: 'ai-coach',
      label: 'AI Coach',
      icon: Brain,
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: User,
    }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-black border-t border-gray-800 z-50">
      <div className="flex items-center justify-around py-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              flex flex-col items-center py-3 px-4 rounded-lg transition-all duration-200
              ${activeTab === tab.id
                ? 'bg-green-bright text-black'
                : 'text-gray-400 hover:text-green-bright'
              }
            `}
            style={{
              background: activeTab === tab.id ? 'var(--green-bright)' : 'transparent',
              color: activeTab === tab.id ? 'var(--primary-black)' : undefined
            }}
          >
            <div className="relative">
              <tab.icon 
                size={24} 
                className={activeTab === tab.id ? 'text-black' : ''}
              />
              {tab.badge && (
                <div 
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{
                    background: 'var(--green-bright)',
                    color: 'var(--primary-black)'
                  }}
                >
                  {tab.badge}
                </div>
              )}
            </div>
            <span className="text-xs mt-1 font-medium">{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};
