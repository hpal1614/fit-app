import React, { useState, useEffect } from 'react';
import { Search, Bell, Settings } from 'lucide-react';
import type { TabId } from './AppLayout';

interface HeaderProps {
  activeTab: TabId;
}

export const Header: React.FC<HeaderProps> = ({ activeTab }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showNotificationBadge, setShowNotificationBadge] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const getTabTitle = () => {
    switch (activeTab) {
      case 'workout':
        return 'Workout Tracker';
      case 'nutrition':
        return 'Nutrition';
      case 'ai-coach':
        return 'AI Coach';
      case 'profile':
        return 'Profile';
      default:
        return 'FIT APP';
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-black/90 backdrop-blur-lg border-b border-gray-800 z-40">
      <div className="flex items-center justify-between p-4 max-w-7xl mx-auto">
        <div className="flex items-center space-x-4">
          <div 
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: 'var(--primary-green)' }}
          >
            <span className="text-xl font-bold text-black">F</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">{getTabTitle()}</h1>
            <p className="text-xs" style={{ color: 'var(--gray-dark)' }}>
              {currentTime.toLocaleTimeString()}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button 
            className="p-2 rounded-full transition-all duration-200 hover:bg-gray-800"
            style={{ color: 'var(--gray-light)' }}
          >
            <Search size={20} />
          </button>
          <button 
            className="p-2 rounded-full relative transition-all duration-200 hover:bg-gray-800"
            style={{ color: 'var(--gray-light)' }}
            onClick={() => setShowNotificationBadge(false)}
          >
            <Bell size={20} />
            {showNotificationBadge && (
              <div 
                className="absolute -top-1 -right-1 w-2 h-2 rounded-full"
                style={{ background: 'var(--primary-green)' }}
              />
            )}
          </button>
          <button 
            className="p-2 rounded-full transition-all duration-200 hover:bg-gray-800"
            style={{ color: 'var(--gray-light)' }}
          >
            <Settings size={20} />
          </button>
        </div>
      </div>
    </header>
  );
};