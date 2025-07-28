import React from 'react';
import { AIChatInterface } from '../ai/UnifiedAIChatInterface';
import type { WorkoutContext } from '../../types/workout';

interface AICoachTabProps {
  workoutContext: WorkoutContext;
}

export const AICoachTab: React.FC<AICoachTabProps> = ({ workoutContext }) => {
  return (
    <div className="h-[calc(100vh-8rem)]"> {/* Full height minus header and nav */}
      <AIChatInterface 
        theme="black-green"
        enableVoice={true}
        enableMCP={true}
        workoutContext={workoutContext}
      />
    </div>
  );
};