import React from 'react';
import type { User } from '../../types/finalUI';
import CircularProgress from './CircularProgress';
import { FireIcon, BoltIcon, BellIcon } from './Icons';

interface HeaderProps {
  user: User;
}

const Header: React.FC<HeaderProps> = ({ user }) => {
  const xpPercentage = (user.xp / user.xpGoal) * 100;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Morning';
    if (hour < 18) return 'Afternoon';
    return 'Evening';
  };

  return (
    <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
      <div className="flex items-center space-x-3">
        <div className="relative">
          <CircularProgress 
            progress={xpPercentage} 
            size={48} 
            strokeWidth={3} 
            gradientFrom="#a5e635" 
            gradientTo="#65a30d"
            trailColor="rgba(255, 255, 255, 0.1)"
          >
            <div className="w-[40px] h-[40px] bg-gradient-to-br from-gray-700 to-gray-800 rounded-full flex items-center justify-center text-lg font-bold text-white shadow-inner">
              {user.initials}
            </div>
          </CircularProgress>
          <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-purple-600 to-blue-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-gray-900">
            {user.level}
          </div>
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight text-gray-100">Good {getGreeting()}, {user.name}!</h1>
          <p className="text-sm text-gray-400">Let's make today count.</p>
        </div>
      </div>

      <div className="flex items-center space-x-3 self-end sm:self-center">
        <div className="flex items-center space-x-1.5">
          <FireIcon className="w-4 h-4 text-orange-400" />
          <div className="text-sm font-semibold">{user.streak}</div>
        </div>
        <div className="flex items-center space-x-1.5">
          <BoltIcon className="w-4 h-4 text-yellow-400" />
          <div className="text-sm font-semibold">{user.totalXp.toLocaleString()}</div>
        </div>
        <button className="relative p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
          <BellIcon className="w-4 h-4" />
          <div className="absolute top-1 right-1 w-2 h-2 bg-lime-400 rounded-full ring-2 ring-gray-900"></div>
        </button>
      </div>
    </header>
  );
};

export default Header;
