import React, { useState } from 'react';
import type { CalendarDay } from '../../services/calendarService';
import type { WorkoutTemplate } from '../../types/workout';
import Card, { CardHeader, CardContent } from './Card';
import { CheckCircleIcon, XCircleIcon, DumbbellIcon, RepeatIcon, PlusIcon } from './Icons';

interface WorkoutCalendarProps {
  day: CalendarDay;
  isToday: boolean;
  isWorkoutActive: boolean;
  onViewDetails: () => void;
  onSwapWorkout: () => void;
  onStartWorkout: () => void;
  onCompleteWorkout: () => void;
  onSelectTemplate: () => void;
}

const WorkoutCalendar: React.FC<WorkoutCalendarProps> = ({ 
  day, 
  isToday, 
  isWorkoutActive,
  onViewDetails, 
  onSwapWorkout,
  onStartWorkout,
  onCompleteWorkout,
  onSelectTemplate
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const workout = day?.workout;

  const StatItem: React.FC<{label: string, value: React.ReactNode}> = ({label, value}) => (
    <div className="text-center">
        <p className="text-xs sm:text-sm text-gray-400">{label}</p>
        <p className="text-lg sm:text-xl font-bold text-gray-100">{value}</p>
    </div>
  );

  // Controls now visible whenever there is a workout (disable Start when not today)
  const shouldShowWorkoutControls = !!workout && !isWorkoutActive;
  const shouldShowActiveWorkoutControls = isToday && isWorkoutActive;
  const shouldShowTemplateSelection = !workout;

  const getStatusIcon = () => {
    switch (day.status) {
      case 'completed':
        return <CheckCircleIcon className="w-6 h-6 text-lime-400" />;
      case 'missed':
        return <XCircleIcon className="w-6 h-6 text-red-400" />;
      case 'in-progress':
        return <DumbbellIcon className="w-6 h-6 text-blue-400" />;
      case 'upcoming':
      default:
        return <DumbbellIcon className="w-6 h-6 text-gray-400" />;
    }
  };

  const getStatusText = () => {
    switch (day.status) {
      case 'completed':
        return 'Completed';
      case 'missed':
        return 'Missed';
      case 'in-progress':
        return 'In Progress';
      case 'upcoming':
      default:
        return workout ? 'Scheduled' : 'No Workout';
    }
  };

  const formatDayLabel = (dateLike: unknown) => {
    const d = dateLike instanceof Date ? dateLike : new Date(dateLike as any);
    return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const headerTitle = isToday ? "Today's Focus" : `Focus • ${formatDayLabel((day as any)?.date)}`;

  return (
    <Card>
      <CardHeader title={headerTitle}>
        {isToday && !isWorkoutActive && (
          <button
            onClick={onSelectTemplate}
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
            aria-label="Choose workout template"
          >
            <PlusIcon className="w-5 h-5" />
          </button>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {workout ? (
          <div onClick={onViewDetails} className="bg-black/20 rounded-xl p-4 cursor-pointer hover:bg-black/30 transition-colors">
              <div className="flex justify-between items-start mb-4">
                  <div>
                      <h4 className="text-lg font-bold text-white">{workout.name}</h4>
                      <p className="text-sm text-gray-400">{workout.category}</p>
                      <p className="text-xs text-gray-500 mt-1">{getStatusText()}</p>
                  </div>
                  {getStatusIcon()}
              </div>

              <div className="grid grid-cols-3 gap-4 border-t border-white/10 pt-4">
                <StatItem label="Duration" value={`${workout.estimatedDuration || 'N/A'} min`} />
                <StatItem label="Exercises" value={workout.exercises?.length || 0} />
                <StatItem label="Difficulty" value={`${workout.difficulty}/5`} />
              </div>
          </div>
        ) : (
          <div className="flex items-center justify-center text-center h-[140px] bg-black/20 rounded-xl">
            <div>
              <h3 className="text-xl font-bold">No Workout</h3>
              <p className="text-gray-400">Select a template to get started</p>
            </div>
          </div>
        )}

        {/* Workout Controls - visible for any day with a workout; Start disabled if not today */}
        {shouldShowWorkoutControls && (
          <div className="mt-4 border-t border-white/10 pt-4">
              <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={onStartWorkout}
                    disabled={!isToday}
                    aria-disabled={!isToday}
                    title={!isToday ? 'Start is available only on today' : 'Start Workout'}
                    className={`w-full text-center font-bold py-3 px-4 rounded-lg text-sm transition-all duration-200 hover:scale-105 ${
                      !isToday
                        ? 'bg-lime-600/30 text-lime-200/60 cursor-not-allowed'
                        : 'bg-lime-600 hover:bg-lime-500 active:bg-lime-600 text-black shadow-sm hover:shadow-md'
                    }`}
                  >
                      Start Workout
                  </button>
                  <button 
                    onClick={onSwapWorkout} 
                    className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold py-3 px-4 rounded-lg text-sm transition-all duration-200 hover:scale-105"
                  >
                      <RepeatIcon className="w-4 h-4" />
                      <span>Swap Workout</span>
                  </button>
              </div>
              {!isToday && (
                <p className="mt-2 text-xs text-gray-400 text-center">Start is available on the current day. Use Swap or choose a template for this date.</p>
              )}
          </div>
        )}

        {/* Active Workout Controls */}
        {shouldShowActiveWorkoutControls && (
          <div className="mt-4 border-t border-white/10 pt-4">
              <div className="grid grid-cols-1 gap-4">
                  <button 
                    onClick={onCompleteWorkout}
                    className="w-full text-center bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg text-sm transition-all duration-200 hover:scale-105"
                  >
                      Complete Workout
                  </button>
                  <div className="text-center text-sm text-gray-400">
                      <p>Workout in progress...</p>
                      <p className="text-xs mt-1">Use the workout controls above to log exercises</p>
                  </div>
              </div>
          </div>
        )}

        {/* Template Selection */}
        {shouldShowTemplateSelection && (
          <div className="mt-4 border-t border-white/10 pt-4">
              <button 
                onClick={onSelectTemplate}
                className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold py-3 px-4 rounded-lg text-sm transition-all duration-200 hover:scale-105"
              >
                  <PlusIcon className="w-4 h-4" />
                  <span>Select Workout Template</span>
              </button>
          </div>
         )}
      </CardContent>
    </Card>
  );
};

export default WorkoutCalendar;
