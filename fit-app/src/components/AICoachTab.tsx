import React from 'react';
import { AmazingAICoach } from './AmazingAICoach';

export const AICoachTab: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-dark pb-20">
      {/* Header */}
      <div className="glass border-b border-white/20 p-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold text-white mb-2">AI Fitness Coach</h1>
          <p className="text-white/80">Your personal AI trainer and nutritionist</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-4">
        <div className="h-[calc(100vh-200px)]">
          <AmazingAICoach 
            workoutContext={{}}
          />
        </div>
      </div>
    </div>
  );
};
