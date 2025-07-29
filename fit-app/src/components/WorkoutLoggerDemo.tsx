import React, { useState } from 'react';
import { WorkoutLogger } from './workout/WorkoutLogger';
import { WorkoutTemplate } from '../types/workout';
import { EXERCISE_DATABASE } from '../constants/exercises';

export const WorkoutLoggerDemo: React.FC = () => {
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);

  // Create a sample workout template
  const sampleWorkoutTemplate: WorkoutTemplate = {
    id: 'demo-workout',
    name: 'Chest Day',
    description: 'Professional chest workout with the new logger',
    exercises: [
      {
        exerciseId: EXERCISE_DATABASE[0].id,
        exercise: EXERCISE_DATABASE[0], // Bench Press
        targetSets: 3,
        targetReps: 8,
        targetWeight: 190,
        restTimeBetweenSets: 120,
        order: 0
      },
      {
        exerciseId: EXERCISE_DATABASE[1].id,
        exercise: EXERCISE_DATABASE[1], // Incline Bench Press
        targetSets: 3,
        targetReps: 10,
        targetWeight: 60,
        restTimeBetweenSets: 90,
        order: 1
      },
      {
        exerciseId: EXERCISE_DATABASE[2].id,
        exercise: EXERCISE_DATABASE[2], // Next exercise
        targetSets: 4,
        targetReps: 12,
        targetWeight: 40,
        restTimeBetweenSets: 60,
        order: 2
      }
    ],
    category: 'strength' as any,
    difficulty: 'intermediate' as any,
    estimatedDuration: 45,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const handleWorkoutComplete = () => {
    setIsWorkoutActive(false);
    console.log('Workout completed!');
  };

  if (!isWorkoutActive) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '20px',
        background: '#000',
        color: '#fff'
      }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '20px' }}>
          Workout Logger Demo
        </h1>
        <p style={{ marginBottom: '30px', color: '#888', textAlign: 'center' }}>
          Experience the professional HTML workout logger converted to React with real AI integration
        </p>
        <button
          onClick={() => setIsWorkoutActive(true)}
          style={{
            padding: '16px 32px',
            fontSize: '18px',
            fontWeight: 600,
            background: '#00ff88',
            color: '#000',
            border: 'none',
            borderRadius: '12px',
            cursor: 'pointer',
            transition: 'transform 0.2s'
          }}
        >
          Start Chest Day Workout
        </button>
      </div>
    );
  }

  return (
    <WorkoutLogger
      workoutTemplate={sampleWorkoutTemplate}
      onWorkoutComplete={handleWorkoutComplete}
    />
  );
};