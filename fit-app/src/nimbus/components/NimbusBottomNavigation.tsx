import React from 'react';
import { NimbusTheme } from '../theme';

export interface NavigationItem {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number | boolean;
}

export interface NimbusBottomNavigationProps {
  items: NavigationItem[];
  activeKey: string;
  onNavigate: (key: string) => void;
  className?: string;
}

export const NimbusBottomNavigation: React.FC<NimbusBottomNavigationProps> = ({
  items,
  activeKey,
  onNavigate,
  className = ''
}) => {
  return (
    <nav 
      className={`
        fixed bottom-0 left-0 right-0 z-50
        bg-white dark:bg-neutral-900
        border-t border-neutral-200 dark:border-neutral-800
        backdrop-blur-lg bg-opacity-90 dark:bg-opacity-90
        ${className}
      `}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="flex items-center justify-around py-2 px-4 max-w-lg mx-auto">
        {items.map((item) => {
          const isActive = activeKey === item.key;
          const Icon = item.icon;
          
          return (
            <button
              key={item.key}
              onClick={() => onNavigate(item.key)}
              className={`
                relative flex flex-col items-center gap-1 px-3 py-2 rounded-lg
                transition-all duration-200 ease-out
                focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-inset
                ${isActive 
                  ? 'text-primary-600 dark:text-primary-400' 
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300'
                }
              `}
              aria-current={isActive ? 'page' : undefined}
              aria-label={item.label}
            >
              {/* Icon container with active indicator */}
              <div className="relative">
                <Icon 
                  className={`
                    w-6 h-6 transition-transform duration-200
                    ${isActive ? 'scale-110' : 'scale-100'}
                  `}
                />
                
                {/* Badge */}
                {item.badge !== undefined && (
                  <div className={`
                    absolute -top-1 -right-1
                    ${typeof item.badge === 'number' 
                      ? 'min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center'
                      : 'w-2 h-2 rounded-full'
                    }
                    ${isActive
                      ? 'bg-primary-500 text-white'
                      : 'bg-red-500 text-white'
                    }
                  `}>
                    {typeof item.badge === 'number' && item.badge}
                  </div>
                )}
              </div>
              
              {/* Label */}
              <span className={`
                text-[10px] font-medium transition-all duration-200
                ${isActive ? 'opacity-100' : 'opacity-70'}
              `}>
                {item.label}
              </span>
              
              {/* Active indicator dot */}
              {isActive && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2">
                  <div className="w-1 h-1 bg-primary-500 rounded-full" />
                </div>
              )}
            </button>
          );
        })}
      </div>
      
      {/* Safe area padding for devices with home indicator */}
      <div className="h-safe-area-inset-bottom bg-inherit" />
    </nav>
  );
};