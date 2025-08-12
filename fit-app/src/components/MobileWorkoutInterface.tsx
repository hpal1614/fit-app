import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Timer, Award, MessageCircle, Dumbbell } from 'lucide-react';
import type { Exercise } from '../types';

// Mock useWorkoutContext for now
const useWorkoutContext = () => ({
  currentExercise: null,
  completeSet: () => {},
  nextExercise: () => {}
});

interface MobileWorkoutInterfaceProps {
  exercise: Exercise;
  onBack: () => void;
  onNext: () => void;
  onComplete: () => void;
}

const MobileWorkoutInterface: React.FC<MobileWorkoutInterfaceProps> = ({
  exercise,
  onBack,
  onNext,
  onComplete,
}) => {
  const { currentExercise, completeSet, nextExercise } = useWorkoutContext();
  const [workoutTime, setWorkoutTime] = useState(0);

  useEffect(() => {
    if (currentExercise && (currentExercise as any).startTime) {
      const interval = setInterval(() => {
        setWorkoutTime(Math.floor((Date.now() - (currentExercise as any).startTime!.getTime()) / 1000));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [currentExercise, completeSet, nextExercise]);

  return (
    <div className="flex flex-col items-center justify-center h-full p-4">
      <div className="flex justify-between items-center w-full mb-4">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-200">
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-2xl font-bold">{exercise.name}</h2>
        <button onClick={onNext} className="p-2 rounded-full hover:bg-gray-200">
          <ChevronRight size={24} />
        </button>
      </div>

      <div className="flex flex-col items-center mb-4">
        <Dumbbell size={100} className="text-primary-500 mb-2" />
        <p className="text-4xl font-bold text-primary-600">{workoutTime}</p>
        <p className="text-lg text-gray-600">seconds</p>
      </div>

      <div className="flex justify-center space-x-4 mb-4">
        <button className="p-3 rounded-full bg-primary-500 text-white hover:bg-primary-600">
          <Timer size={24} />
        </button>
        <button className="p-3 rounded-full bg-primary-500 text-white hover:bg-primary-600">
          <Award size={24} />
        </button>
        <button className="p-3 rounded-full bg-primary-500 text-white hover:bg-primary-600">
          <MessageCircle size={24} />
        </button>
      </div>

      <button
        onClick={onComplete}
        className="w-full p-4 rounded-lg bg-primary-600 text-white text-lg font-bold hover:bg-primary-700 transition-colors"
      >
        Complete Workout
      </button>
    </div>
  );
};

export default MobileWorkoutInterface;
