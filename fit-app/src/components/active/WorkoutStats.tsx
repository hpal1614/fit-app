import React from 'react';
import { X, Trophy, Clock, Target, TrendingUp, Award, Zap } from 'lucide-react';
import type { Workout } from '../../types/workout';

interface WorkoutStatsProps {
  workout: Workout | null;
  onClose: () => void;
  className?: string;
}

export const WorkoutStats: React.FC<WorkoutStatsProps> = ({
  workout,
  onClose,
  className = ''
}) => {
  if (!workout) {
    return null;
  }

  // Calculate statistics
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins}m ${secs}s`;
    }
    return `${mins}m ${secs}s`;
  };

  const completedExercises = workout.exercises.filter(ex => ex.completedSets.length > 0);
  const completionRate = Math.round((completedExercises.length / workout.exercises.length) * 100);
  
  // Personal records
  const newPRs = workout.personalRecords || [];
  
  // Calculate volume (total weight lifted)
  const totalVolume = workout.exercises.reduce(
    (total, ex) => total + ex.completedSets.reduce(
      (exTotal, set) => exTotal + (set.weight * set.reps), 0
    ), 0
  );

  // Average rest time
  const totalRestTime = workout.exercises.reduce(
    (total, ex) => total + ex.completedSets.reduce(
      (exTotal, set) => exTotal + (set.restTime || 0), 0
    ), 0
  );
  const avgRestTime = (workout.totalSets || 0) > 0 ? Math.round(totalRestTime / (workout.totalSets || 1)) : 0;

  // Get achievement level
  const getAchievementLevel = (): { title: string; icon: React.ReactNode; color: string } => {
    if (completionRate === 100 && newPRs.length > 0) {
      return {
        title: 'Legendary Performance!',
        icon: <Award className="text-yellow-500" size={48} />,
        color: 'bg-yellow-50 border-yellow-200'
      };
    } else if (completionRate === 100) {
      return {
        title: 'Perfect Workout!',
        icon: <Trophy className="text-gold-500" size={48} />,
        color: 'bg-orange-50 border-orange-200'
      };
    } else if (completionRate >= 80) {
      return {
        title: 'Great Session!',
        icon: <Target className="text-green-500" size={48} />,
        color: 'bg-green-50 border-green-200'
      };
    } else if (completionRate >= 60) {
      return {
        title: 'Good Effort!',
        icon: <TrendingUp className="text-blue-500" size={48} />,
        color: 'bg-blue-50 border-blue-200'
      };
    } else {
      return {
        title: 'Keep Going!',
        icon: <Zap className="text-purple-500" size={48} />,
        color: 'bg-purple-50 border-purple-200'
      };
    }
  };

  const achievement = getAchievementLevel();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className={`bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto ${className}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Workout Complete!</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100"
          >
            <X size={24} />
          </button>
        </div>

        {/* Achievement Banner */}
        <div className={`p-6 border-b border-gray-200 ${achievement.color}`}>
          <div className="text-center">
            {achievement.icon}
            <h3 className="text-2xl font-bold text-gray-900 mt-2">{achievement.title}</h3>
            <p className="text-gray-600 mt-1">{workout.name}</p>
          </div>
        </div>

        {/* Main Stats Grid */}
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {/* Duration */}
            <div className="stat-card bg-blue-50 p-4 rounded-lg text-center">
              <Clock className="mx-auto mb-2 text-blue-600" size={24} />
              <div className="text-2xl font-bold text-blue-900">{formatDuration(workout.totalDuration || 0)}</div>
              <div className="text-sm text-blue-600">Duration</div>
            </div>

            {/* Total Sets */}
            <div className="stat-card bg-green-50 p-4 rounded-lg text-center">
              <Target className="mx-auto mb-2 text-green-600" size={24} />
              <div className="text-2xl font-bold text-green-900">{workout.totalSets}</div>
              <div className="text-sm text-green-600">Sets</div>
            </div>

            {/* Total Reps */}
            <div className="stat-card bg-purple-50 p-4 rounded-lg text-center">
              <TrendingUp className="mx-auto mb-2 text-purple-600" size={24} />
              <div className="text-2xl font-bold text-purple-900">{workout.totalReps}</div>
              <div className="text-sm text-purple-600">Reps</div>
            </div>

            {/* Total Weight */}
            <div className="stat-card bg-orange-50 p-4 rounded-lg text-center">
              <Trophy className="mx-auto mb-2 text-orange-600" size={24} />
              <div className="text-2xl font-bold text-orange-900">{totalVolume.toLocaleString()}</div>
              <div className="text-sm text-orange-600">lbs Volume</div>
            </div>
          </div>

          {/* Completion Progress */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Workout Completion</span>
              <span className="text-sm font-medium text-gray-900">{completionRate}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-fitness-blue h-3 rounded-full transition-all duration-300"
                style={{ width: `${completionRate}%` }}
              ></div>
            </div>
            <div className="text-sm text-gray-600 mt-1">
              {completedExercises.length} of {workout.exercises.length} exercises completed
            </div>
          </div>

          {/* Personal Records */}
          {newPRs.length > 0 && (
            <div className="mb-6">
              <h4 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
                <Award className="mr-2 text-yellow-500" size={20} />
                New Personal Records! 🎉
              </h4>
              <div className="space-y-2">
                {newPRs.map((pr, index) => (
                  <div key={index} className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-yellow-900">Exercise #{pr.exerciseId}</span>
                      <span className="text-yellow-700">
                        {pr.reps} reps @ {pr.weight}lbs (1RM: {pr.oneRepMax}lbs)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Exercise Breakdown */}
          <div className="mb-6">
            <h4 className="text-lg font-bold text-gray-900 mb-3">Exercise Breakdown</h4>
            <div className="space-y-3">
              {workout.exercises.map((exercise, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">{exercise.exercise.name}</span>
                    <span className="text-sm text-gray-600">
                      {exercise.completedSets.length} sets completed
                    </span>
                  </div>
                  
                  {exercise.completedSets.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div className="text-gray-600">
                        <span className="font-medium">Best Set:</span>
                        <br />
                        {Math.max(...exercise.completedSets.map(s => s.reps))} reps @{' '}
                        {Math.max(...exercise.completedSets.map(s => s.weight))}lbs
                      </div>
                      <div className="text-gray-600">
                        <span className="font-medium">Total Volume:</span>
                        <br />
                        {exercise.completedSets.reduce((total, set) => total + (set.weight * set.reps), 0)}lbs
                      </div>
                      <div className="text-gray-600">
                        <span className="font-medium">Total Reps:</span>
                        <br />
                        {exercise.completedSets.reduce((total, set) => total + set.reps, 0)}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Additional Stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Average Rest Time</div>
              <div className="text-xl font-bold text-gray-900">{avgRestTime}s</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Workout Type</div>
              <div className="text-xl font-bold text-gray-900 capitalize">{workout.type}</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 bg-fitness-blue text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-600 transition-colors"
            >
              Done
            </button>
            <button
              onClick={() => {
                // Share workout functionality could be implemented here
                if (navigator.share) {
                  navigator.share({
                    title: 'My Workout Stats',
                    text: `Just completed a ${formatDuration(workout.totalDuration || 0)} workout with ${workout.totalSets || 0} sets and ${workout.totalReps || 0} reps!`,
                  });
                }
              }}
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700"
            >
              Share
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkoutStats;