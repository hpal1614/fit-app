import React from 'react';
import { User, Trophy, Target, Activity, Settings, LogOut } from 'lucide-react';

export const ProfileTab: React.FC = () => {
  const userStats = {
    workoutsCompleted: 127,
    currentStreak: 14,
    totalWeight: 45230,
    personalRecords: 8
  };

  return (
    <div className="space-y-6">
      {/* User Profile Card */}
      <div className="card">
        <div className="flex items-center gap-4 mb-6">
          <div 
            className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold"
            style={{ background: 'var(--primary-green)', color: 'var(--primary-black)' }}
          >
            JD
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">John Doe</h2>
            <p style={{ color: 'var(--gray-light)' }}>Intermediate • Team Alpha</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 rounded-lg" style={{ background: 'var(--dark-bg)' }}>
            <Trophy size={24} className="mx-auto mb-2" style={{ color: 'var(--primary-green)' }} />
            <div className="text-2xl font-bold text-white">{userStats.workoutsCompleted}</div>
            <div className="text-sm" style={{ color: 'var(--gray-light)' }}>Workouts</div>
          </div>
          <div className="text-center p-4 rounded-lg" style={{ background: 'var(--dark-bg)' }}>
            <Activity size={24} className="mx-auto mb-2" style={{ color: 'var(--primary-green)' }} />
            <div className="text-2xl font-bold text-white">{userStats.currentStreak}</div>
            <div className="text-sm" style={{ color: 'var(--gray-light)' }}>Day Streak</div>
          </div>
          <div className="text-center p-4 rounded-lg" style={{ background: 'var(--dark-bg)' }}>
            <Target size={24} className="mx-auto mb-2" style={{ color: 'var(--primary-green)' }} />
            <div className="text-2xl font-bold text-white">{userStats.totalWeight.toLocaleString()}</div>
            <div className="text-sm" style={{ color: 'var(--gray-light)' }}>lbs Lifted</div>
          </div>
          <div className="text-center p-4 rounded-lg" style={{ background: 'var(--dark-bg)' }}>
            <Trophy size={24} className="mx-auto mb-2" style={{ color: 'var(--primary-green)' }} />
            <div className="text-2xl font-bold text-white">{userStats.personalRecords}</div>
            <div className="text-sm" style={{ color: 'var(--gray-light)' }}>PRs</div>
          </div>
        </div>
      </div>

      {/* Settings */}
      <div className="card">
        <h3 className="text-lg font-bold text-white mb-4">Settings</h3>
        
        <div className="space-y-2">
          <button className="w-full p-4 rounded-lg flex items-center justify-between hover:bg-gray-800 transition-colors" style={{ background: 'var(--dark-bg)' }}>
            <div className="flex items-center gap-3">
              <User size={20} style={{ color: 'var(--gray-light)' }} />
              <span>Edit Profile</span>
            </div>
            <span style={{ color: 'var(--gray-dark)' }}>→</span>
          </button>

          <button className="w-full p-4 rounded-lg flex items-center justify-between hover:bg-gray-800 transition-colors" style={{ background: 'var(--dark-bg)' }}>
            <div className="flex items-center gap-3">
              <Target size={20} style={{ color: 'var(--gray-light)' }} />
              <span>Fitness Goals</span>
            </div>
            <span style={{ color: 'var(--gray-dark)' }}>→</span>
          </button>

          <button className="w-full p-4 rounded-lg flex items-center justify-between hover:bg-gray-800 transition-colors" style={{ background: 'var(--dark-bg)' }}>
            <div className="flex items-center gap-3">
              <Settings size={20} style={{ color: 'var(--gray-light)' }} />
              <span>App Settings</span>
            </div>
            <span style={{ color: 'var(--gray-dark)' }}>→</span>
          </button>

          <button className="w-full p-4 rounded-lg flex items-center justify-between hover:bg-gray-800 transition-colors" style={{ background: 'var(--dark-bg)' }}>
            <div className="flex items-center gap-3">
              <LogOut size={20} style={{ color: 'var(--error)' }} />
              <span style={{ color: 'var(--error)' }}>Log Out</span>
            </div>
            <span style={{ color: 'var(--gray-dark)' }}>→</span>
          </button>
        </div>
      </div>
    </div>
  );
};