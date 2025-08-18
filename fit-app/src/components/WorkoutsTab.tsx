import React, { useState } from 'react';
import { WorkoutGenerator } from './WorkoutGenerator';
import { WorkoutDashboard } from './WorkoutDashboard';
import { NimbusWorkoutGenerator } from '../nimbus/components/NimbusWorkoutGenerator';
import { PDFWorkoutUploader } from './workout/PDFWorkoutUploader';
import { getAIService } from '../services/aiService';

export const WorkoutsTab: React.FC = () => {
  const [activeMode, setActiveMode] = useState<'dashboard' | 'generator' | 'nimbus' | 'pdf'>('dashboard');

  const handleWorkoutGenerated = (workout: any) => {
    console.log('Workout generated:', workout);
    // You can add logic here to save or navigate to the workout
  };

  const handlePDFUpload = (plan: any) => {
    console.log('PDF workout uploaded:', plan);
    // You can add logic here to save or navigate to the workout
  };

  const handleBack = () => {
    setActiveMode('dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-dark pb-20">
      {/* Header */}
      <div className="glass border-b border-white/20 p-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold text-white mb-2">Workout Management</h1>
          <p className="text-white/80">Generate, plan, and track your workouts</p>
        </div>
      </div>

      {/* Mode Selector */}
      <div className="p-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => setActiveMode('dashboard')}
              className={`px-4 py-2 rounded-xl transition-colors ${
                activeMode === 'dashboard'
                  ? 'bg-primary text-white'
                  : 'bg-white/10 text-white/80 hover:bg-white/20'
              }`}
            >
              📊 Dashboard
            </button>
            <button
              onClick={() => setActiveMode('generator')}
              className={`px-4 py-2 rounded-xl transition-colors ${
                activeMode === 'generator'
                  ? 'bg-primary text-white'
                  : 'bg-white/10 text-white/80 hover:bg-white/20'
              }`}
            >
              🤖 AI Generator
            </button>
            <button
              onClick={() => setActiveMode('nimbus')}
              className={`px-4 py-2 rounded-xl transition-colors ${
                activeMode === 'nimbus'
                  ? 'bg-primary text-white'
                  : 'bg-white/10 text-white/80 hover:bg-white/20'
              }`}
            >
              ⚡ Nimbus
            </button>
            <button
              onClick={() => setActiveMode('pdf')}
              className={`px-4 py-2 rounded-xl transition-colors ${
                activeMode === 'pdf'
                  ? 'bg-primary text-white'
                  : 'bg-white/10 text-white/80 hover:bg-white/20'
              }`}
            >
              📄 PDF Upload
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4">
        {activeMode === 'dashboard' && (
          <div className="card">
            <WorkoutDashboard />
          </div>
        )}
        {activeMode === 'generator' && (
          <div className="card">
            <WorkoutGenerator onWorkoutGenerated={handleWorkoutGenerated} />
          </div>
        )}
        {activeMode === 'nimbus' && (
          <div className="card">
            <NimbusWorkoutGenerator onWorkoutGenerated={handleWorkoutGenerated} />
          </div>
        )}
        {activeMode === 'pdf' && (
          <div className="card">
            <PDFWorkoutUploader 
              onUpload={handlePDFUpload}
              onBack={handleBack}
              aiService={getAIService()}
            />
          </div>
        )}
      </div>
    </div>
  );
};
