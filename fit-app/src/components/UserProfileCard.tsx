import React, { useState, useRef } from 'react';
import { User, Trophy, Clock, Zap, Flame, Settings, Camera, Edit3 } from 'lucide-react';

interface UserProfileCardProps {
  userProfile: {
    name: string;
    level: string;
    team: string;
    avatar?: string;
    profileImage?: string;
  };
  userStats: {
    workoutsThisWeek: number;
    totalMinutes: number;
    caloriesBurned: number;
    currentStreak: number;
  };
  isActiveWorkout?: boolean;
  workoutDuration?: number;
  onAvatarChange?: (imageUrl: string) => void;
}

export const UserProfileCard: React.FC<UserProfileCardProps> = ({
  userProfile,
  userStats,
  isActiveWorkout,
  workoutDuration = 0,
  onAvatarChange
}) => {
  const [profileImage, setProfileImage] = useState<string | null>(userProfile.profileImage || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        setProfileImage(imageUrl);
        onAvatarChange?.(imageUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="bg-gray-900/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-800">
      {/* Active Workout Banner */}
      {isActiveWorkout && (
        <div className="mb-4 bg-gradient-to-r from-lime-400 to-green-500 rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Flame className="w-5 h-5 text-black" />
              <span className="font-bold text-black">Active Workout</span>
            </div>
            <div className="text-xl font-bold text-black">{formatTime(workoutDuration)}</div>
          </div>
        </div>
      )}

      <div className="flex items-center space-x-4 mb-4">
        <div className="relative group">
          <div className="w-16 h-16 bg-gradient-to-br from-lime-400 to-green-500 rounded-full flex items-center justify-center overflow-hidden">
            {profileImage ? (
              <img 
                src={profileImage} 
                alt={userProfile.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-8 h-8 text-black" />
            )}
          </div>
          <button
            onClick={triggerFileInput}
            className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          >
            <Camera className="w-6 h-6 text-white" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </div>
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold">{userProfile.name}</h2>
            <button className="p-1 hover:bg-gray-700/50 rounded-full transition-colors">
              <Edit3 className="w-4 h-4 text-gray-400 hover:text-white" />
            </button>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-lime-400 text-sm font-medium">{userProfile.team}</span>
            <span className="text-gray-500">•</span>
            <span className="text-gray-400 text-sm">{userProfile.level}</span>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="text-center">
          <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-1">
            <Trophy className="w-6 h-6 text-blue-400" />
          </div>
          <p className="text-lg font-bold">{userStats.workoutsThisWeek}</p>
          <p className="text-xs text-gray-400">This Week</p>
        </div>
        <div className="text-center">
          <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-1">
            <Clock className="w-6 h-6 text-purple-400" />
          </div>
          <p className="text-lg font-bold">{userStats.totalMinutes}</p>
          <p className="text-xs text-gray-400">Minutes</p>
        </div>
        <div className="text-center">
          <div className="w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-1">
            <Zap className="w-6 h-6 text-orange-400" />
          </div>
          <p className="text-lg font-bold">{userStats.caloriesBurned}</p>
          <p className="text-xs text-gray-400">Calories</p>
        </div>
        <div className="text-center">
          <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-1">
            <Flame className="w-6 h-6 text-red-400" />
          </div>
          <p className="text-lg font-bold">{userStats.currentStreak}</p>
          <p className="text-xs text-gray-400">Day Streak</p>
        </div>
      </div>
    </div>
  );
};