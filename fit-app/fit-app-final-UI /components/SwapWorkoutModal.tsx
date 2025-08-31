import React from 'react';
import { Workout } from '../types';
import Card, { CardHeader, CardContent } from './ui/Card';
import { XIcon, DumbbellIcon } from './Icons';

interface SwapWorkoutModalProps {
  workouts: Workout[];
  onClose: () => void;
  onSwap: (workout: Workout) => void;
}

const SwapWorkoutModal: React.FC<SwapWorkoutModalProps> = ({ workouts, onClose, onSwap }) => {
  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <Card className="animate-fade-in-up">
          <CardHeader title="Swap Workout">
            <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10">
              <XIcon className="w-5 h-5" />
            </button>
          </CardHeader>
          <CardContent>
            <h5 className="font-semibold mb-4 text-gray-300">Choose a session to swap with today's workout:</h5>
            {workouts.length > 0 ? (
                <ul className="space-y-3 max-h-80 overflow-y-auto">
                {workouts.map(workout => (
                    <li key={workout.title}>
                    <button 
                        onClick={() => onSwap(workout)}
                        className="w-full flex items-center justify-between p-4 bg-white/5 rounded-lg text-left hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-lime-400"
                    >
                        <div>
                            <p className="font-semibold text-gray-100">{workout.title}</p>
                            <p className="text-sm text-gray-400">{workout.type}</p>
                        </div>
                        <DumbbellIcon className="w-6 h-6 text-gray-500" />
                    </button>
                    </li>
                ))}
                </ul>
            ) : (
                <p className="text-center text-gray-400 py-8">No other upcoming workouts available to swap.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SwapWorkoutModal;
