import React, { useState } from 'react';
import { Plus, Download, Sparkles, User, FileText } from 'lucide-react';
import { AIWorkoutGenerator } from './workout/AIWorkoutGenerator';
import { CustomWorkoutBuilder } from './workout/CustomWorkoutBuilder';
import { PDFWorkoutUploader } from './workout/PDFWorkoutUploader';
import { WorkoutPlanCard } from './workout/WorkoutPlanCard';
import type { WorkoutPlan } from '../types/workout';

export const WorkoutsTab: React.FC<{
  workoutContext: any;
  aiService: any;
}> = ({ workoutContext, aiService }) => {
  const [activeSection, setActiveSection] = useState<'browse' | 'generate' | 'custom' | 'upload'>('browse');
  const [workoutPlans, setWorkoutPlans] = useState<WorkoutPlan[]>([]);

  const handleGenerateAIWorkout = async (userProfile: any) => {
    const prompt = \`Generate a personalized workout plan:
    
    User Profile: \${JSON.stringify(userProfile)}
    
    Create a complete workout plan with:
    - Day-by-day breakdown
    - Progressive overload schedule
    - Exercise alternatives
    - Form cues and safety notes
    
    Target the user's specific goals and equipment availability.\`;
    
    const response = await aiService.getCoachingResponse(prompt, workoutContext, 'workout-planning');
    const generatedPlan = parseAIWorkoutPlan(response.content);
    setWorkoutPlans(prev => [generatedPlan, ...prev]);
    setActiveSection('browse');
  };

  const parseAIWorkoutPlan = (content: string): WorkoutPlan => {
    return {
      id: Date.now().toString(),
      name: "AI Generated Workout",
      description: content.substring(0, 100) + "...",
      type: 'ai_generated',
      difficulty: 'intermediate',
      daysPerWeek: 3,
      estimatedDuration: 60,
      targetGoals: ['strength', 'muscle'],
      equipment: ['barbell', 'dumbbell'],
      schedule: [],
      createdAt: new Date(),
      timesCompleted: 0
    };
  };

  return (
    <div className="flex flex-col h-full pb-20">
      <div className="p-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <h1 className="text-2xl font-bold">Workouts</h1>
        <p className="text-blue-100 text-sm">AI-powered personalized training</p>
      </div>

      <div className="p-4 grid grid-cols-3 gap-3">
        <button
          onClick={() => setActiveSection('generate')}
          className="flex flex-col items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-2 border-blue-600 text-blue-600 hover:bg-blue-100 transition-colors"
        >
          <Sparkles size={24} />
          <span className="text-sm font-medium mt-1">AI Generate</span>
        </button>
        
        <button
          onClick={() => setActiveSection('custom')}
          className="flex flex-col items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border-2 border-green-600 text-green-600 hover:bg-green-100 transition-colors"
        >
          <User size={24} />
          <span className="text-sm font-medium mt-1">Create Custom</span>
        </button>
        
        <button
          onClick={() => setActiveSection('upload')}
          className="flex flex-col items-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border-2 border-orange-600 text-orange-600 hover:bg-orange-100 transition-colors"
        >
          <FileText size={24} />
          <span className="text-sm font-medium mt-1">Upload PDF</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeSection === 'browse' && (
          <div className="p-4 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Your Workout Plans</h2>
            
            {workoutPlans.length === 0 ? (
              <div className="text-center py-12">
                <Sparkles size={48} className="mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-2">
                  No workout plans yet
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
                  Generate an AI workout, create your own, or upload a PDF
                </p>
                <button
                  onClick={() => setActiveSection('generate')}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Generate AI Workout
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {workoutPlans.map((plan) => (
                  <WorkoutPlanCard 
                    key={plan.id} 
                    plan={plan}
                    onStart={() => {}}
                    onEdit={() => {}}
                    onShare={() => {}}
                  />
                ))}
              </div>
            )}
          </div>
        )}
        
        {activeSection === 'generate' && (
          <AIWorkoutGenerator 
            onGenerate={handleGenerateAIWorkout}
            onBack={() => setActiveSection('browse')}
          />
        )}
        
        {activeSection === 'custom' && (
          <CustomWorkoutBuilder 
            onSave={(plan) => {
              setWorkoutPlans(prev => [plan, ...prev]);
              setActiveSection('browse');
            }}
            onBack={() => setActiveSection('browse')}
            aiService={aiService}
          />
        )}
        
        {activeSection === 'upload' && (
          <PDFWorkoutUploader 
            onUpload={(plan) => {
              setWorkoutPlans(prev => [plan, ...prev]);
              setActiveSection('browse');
            }}
            onBack={() => setActiveSection('browse')}
            aiService={aiService}
          />
        )}
      </div>
    </div>
  );
};
