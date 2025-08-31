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
        {/* Visual confirmation banner for active AI Coach build */}
        <div
          id="ai-coach-visual-marker"
          className="mb-4 rounded-xl px-4 py-3 text-sm font-semibold shadow-lg"
          style={{ backgroundColor: '#a5e635', color: '#0b0b0b' }}
        >
          ✅ AI Coach Updated Mode Active
        </div>
        <div className="h-[calc(100vh-200px)]">
          <AmazingAICoach 
            workoutContext={{}}
            className="ring-4 ring-[#a5e635]"
          />
        </div>
      </div>
    </div>
  );
};
