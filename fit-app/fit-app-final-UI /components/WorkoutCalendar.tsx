import React, { useState } from 'react';
import { WorkoutDay, WorkoutStatus } from '../types';
import Card, { CardHeader, CardContent } from './ui/Card';
import { CheckCircleIcon, XCircleIcon, DumbbellIcon, RepeatIcon, PlusIcon, UploadIcon, SparklesIcon } from './Icons';

interface WorkoutCalendarProps {
  day: WorkoutDay;
  isToday: boolean;
  onViewDetails: () => void;
  onSwapWorkout: () => void;
}

const WorkoutCalendar: React.FC<WorkoutCalendarProps> = ({ day, isToday, onViewDetails, onSwapWorkout }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const workout = day?.workout;

  const StatItem: React.FC<{label: string, value: React.ReactNode}> = ({label, value}) => (
    <div className="text-center">
        <p className="text-xs sm:text-sm text-gray-400">{label}</p>
        <p className="text-lg sm:text-xl font-bold text-gray-100">{value}</p>
    </div>
  );

  return (
    <Card>
      <CardHeader title="Today's Focus">
        {isToday && (
          <div className="relative">
            <button
              onClick={() => setIsMenuOpen(prev => !prev)}
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
              aria-haspopup="true"
              aria-expanded={isMenuOpen}
              aria-label="Add workout options"
            >
              <PlusIcon className="w-5 h-5" />
            </button>
            {isMenuOpen && (
              <div className="absolute top-full right-0 mt-2 w-56 bg-gray-900/90 backdrop-blur-md border border-white/10 rounded-lg shadow-xl z-20 animate-fade-in-down origin-top-right">
                <ul className="py-2">
                  <li>
                    <a href="#" className="flex items-center gap-3 px-4 py-2 text-sm text-gray-200 hover:bg-white/5 transition-colors">
                      <UploadIcon className="w-4 h-4 text-gray-400" />
                      <span>Upload new workout</span>
                    </a>
                  </li>
                  <li>
                    <a href="#" className="flex items-center gap-3 px-4 py-2 text-sm text-gray-200 hover:bg-white/5 transition-colors">
                      <SparklesIcon className="w-4 h-4 text-gray-400" />
                      <span>Create with AI</span>
                    </a>
                  </li>
                </ul>
              </div>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {workout ? (
          <div onClick={onViewDetails} className="bg-black/20 rounded-xl p-4 cursor-pointer hover:bg-black/30 transition-colors">
              <div className="flex justify-between items-start mb-4">
                  <div>
                      <h4 className="text-lg font-bold text-white">{workout.title}</h4>
                      <p className="text-sm text-gray-400">{workout.type}</p>
                  </div>
                  {day.status === WorkoutStatus.Completed && <CheckCircleIcon className="w-6 h-6 text-lime-400" />}
                  {day.status === WorkoutStatus.Missed && <XCircleIcon className="w-6 h-6 text-red-400" />}
                  {day.status === WorkoutStatus.Upcoming && <DumbbellIcon className="w-6 h-6 text-gray-400" />}
              </div>

              <div className="grid grid-cols-3 gap-4 border-t border-white/10 pt-4">
                <StatItem label="Duration" value={`${workout.duration} min`} />
                <StatItem label="Calories" value={`${workout.calories} kcal`} />
                <StatItem label="XP Gained" value={<span className="text-lime-400">+{workout.xp}</span>} />
              </div>
          </div>
        ) : (
          <div className="flex items-center justify-center text-center h-[140px] bg-black/20 rounded-xl">
            <div>
              <h3 className="text-xl font-bold">Rest Day</h3>
              <p className="text-gray-400">Enjoy your recovery!</p>
            </div>
          </div>
        )}

        {isToday && (
          <div className="mt-4 border-t border-white/10 pt-4">
              {workout ? (
                  <div className="grid grid-cols-2 gap-4">
                      <button className="w-full text-center bg-[var(--color-accent)] text-black font-bold py-3 px-4 rounded-lg text-sm transition-transform hover:scale-105">
                          Start Workout
                      </button>
                      <button onClick={onSwapWorkout} className="w-full flex items-center justify-center gap-2 bg-white/10 text-white font-bold py-3 px-4 rounded-lg text-sm transition-transform hover:scale-105">
                          <RepeatIcon className="w-4 h-4" />
                          <span>Swap Workout</span>
                      </button>
                  </div>
              ) : (
                  <button className="w-full flex items-center justify-center gap-2 bg-white/10 text-white font-bold py-3 px-4 rounded-lg text-sm transition-transform hover:scale-105">
                      <PlusIcon className="w-4 h-4" />
                      <span>Add Custom Workout</span>
                  </button>
              )}
          </div>
         )}
      </CardContent>
    </Card>
  );
};

export default WorkoutCalendar;