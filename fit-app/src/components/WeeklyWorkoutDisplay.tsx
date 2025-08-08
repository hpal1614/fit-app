import React from 'react';
import { Calendar, Play, CheckCircle, Clock, Target, Flame } from 'lucide-react';
import { DayWorkout } from '../services/workoutStorageService';

interface WeeklyWorkoutDisplayProps {
  weekWorkouts: DayWorkout[];
  onDayClick: (workout: DayWorkout) => void;
  className?: string;
}

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const WeeklyWorkoutDisplay: React.FC<WeeklyWorkoutDisplayProps> = ({
  weekWorkouts,
  onDayClick,
  className = ''
}) => {
  console.log('WeeklyWorkoutDisplay: Rendering with workouts:', weekWorkouts);
  const today = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
  
  const getDayWorkout = (dayIndex: number): DayWorkout | null => {
    const dayName = dayNames[dayIndex];
    return weekWorkouts.find(workout => 
      new Date(workout.scheduledDate).getDay() === dayIndex
    ) || null;
  };

  const getDayStatus = (dayIndex: number, workout: DayWorkout | null) => {
    if (!workout) return 'empty';
    if (workout.completed) return 'completed';
    if (dayIndex === today) return 'today';
    if (dayIndex < today) return 'missed';
    return 'upcoming';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'today': return 'bg-gradient-to-r from-green-500 to-emerald-600 border-green-400';
      case 'completed': return 'bg-gradient-to-r from-blue-500 to-indigo-600 border-blue-400';
      case 'missed': return 'bg-gradient-to-r from-gray-500 to-gray-600 border-gray-400 opacity-60';
      case 'upcoming': return 'bg-gradient-to-r from-purple-500 to-violet-600 border-purple-400';
      default: return 'bg-gradient-to-r from-gray-700 to-gray-800 border-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'today': return <Play className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'missed': return <Clock className="w-4 h-4" />;
      case 'upcoming': return <Target className="w-4 h-4" />;
      default: return <Calendar className="w-4 h-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'today': return 'Today';
      case 'completed': return 'Done';
      case 'missed': return 'Missed';
      case 'upcoming': return 'Upcoming';
      default: return 'Rest';
    }
  };

  return (
    <div className={`bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Calendar className="w-5 h-5 text-white/80" />
          <h3 className="font-semibold text-white">This Week's Plan</h3>
        </div>
        <div className="text-xs text-white/60">
          {weekWorkouts.filter(w => w.completed).length}/{weekWorkouts.length} completed
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {dayNames.map((dayName, dayIndex) => {
          const workout = getDayWorkout(dayIndex);
          const status = getDayStatus(dayIndex, workout);
          const isToday = dayIndex === today;
          
          return (
            <div
              key={dayIndex}
              onClick={() => workout && onDayClick(workout)}
              className={`
                relative p-3 rounded-lg border-2 transition-all duration-200 cursor-pointer
                ${getStatusColor(status)}
                ${workout ? 'hover:scale-105 hover:shadow-lg' : ''}
                ${isToday ? 'ring-2 ring-yellow-400 ring-opacity-50' : ''}
              `}
            >
              {/* Day Header */}
              <div className="text-center mb-2">
                <div className="text-xs font-medium text-white/80 uppercase">
                  {dayName.slice(0, 3)}
                </div>
                <div className="text-lg font-bold text-white">
                  {new Date().getDate() + (dayIndex - today)}
                </div>
              </div>

              {/* Workout Content */}
              {workout ? (
                <div className="text-center">
                  <div className="flex justify-center mb-1">
                    {getStatusIcon(status)}
                  </div>
                  <div className="text-xs font-medium text-white mb-1">
                    {workout.name}
                  </div>
                  <div className="text-xs text-white/80">
                    {workout.exercises.length} exercises
                  </div>
                  <div className="text-xs text-white/60 mt-1">
                    {getStatusText(status)}
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <div className="flex justify-center mb-1">
                    <Calendar className="w-4 h-4 text-white/60" />
                  </div>
                  <div className="text-xs text-white/60">
                    Rest Day
                  </div>
                </div>
              )}

              {/* Today Indicator */}
              {isToday && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse" />
              )}
            </div>
          );
        })}
      </div>

      {/* Today's Workout Highlight */}
      {(() => {
        const todayWorkout = getDayWorkout(today);
        if (!todayWorkout) return null;

        return (
          <div className="mt-4 p-3 bg-gradient-to-r from-green-500/20 to-emerald-600/20 rounded-lg border border-green-400/30">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <Flame className="w-4 h-4 text-green-400" />
                  <span className="text-sm font-medium text-white">Today's Workout</span>
                </div>
                <div className="text-white font-semibold">{todayWorkout.name}</div>
                <div className="text-xs text-white/80">
                  {todayWorkout.exercises.length} exercises • {todayWorkout.exercises.reduce((total, ex) => total + ex.sets, 0)} total sets
                </div>
              </div>
              <button
                onClick={() => onDayClick(todayWorkout)}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Start
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}; 