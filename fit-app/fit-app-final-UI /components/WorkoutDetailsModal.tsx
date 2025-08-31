import React from 'react';
import { Workout } from '../types';
import Card, { CardHeader, CardContent } from './ui/Card';
import { XIcon } from './Icons';

interface WorkoutDetailsModalProps {
  workout: Workout;
  onClose: () => void;
}

const StatItem: React.FC<{label: string, value: React.ReactNode}> = ({label, value}) => (
    <div className="text-center">
        <p className="text-sm text-gray-400">{label}</p>
        <p className="text-xl font-bold text-gray-100">{value}</p>
    </div>
);


const WorkoutDetailsModal: React.FC<WorkoutDetailsModalProps> = ({ workout, onClose }) => {
  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the modal
      >
        <Card className="animate-fade-in-up">
          <CardHeader title={workout.title}>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10">
              <XIcon className="w-5 h-5" />
            </button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-4 pb-4 border-b border-white/10">
              <StatItem label="Duration" value={`${workout.duration} min`} />
              <StatItem label="Calories" value={`${workout.calories} kcal`} />
              <StatItem label="XP Gained" value={<span className="text-lime-400">+{workout.xp}</span>} />
            </div>

            <h5 className="font-semibold mb-3 text-gray-300">Exercises</h5>
            <ul className="space-y-2 max-h-60 overflow-y-auto">
              {workout.exercises.map(ex => (
                <li key={ex.name} className="flex justify-between items-center p-3 bg-white/5 rounded-lg text-sm">
                  <span className="font-medium text-gray-200">{ex.name}</span>
                  <span className="font-mono text-gray-400 bg-black/20 px-2 py-1 rounded-md text-xs">{ex.sets}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WorkoutDetailsModal;