import React, { useEffect, useState } from 'react';
import { WorkoutLogger } from './workout/WorkoutLogger';
import { WorkoutTemplate } from '../types/workout';
import { EXERCISE_DATABASE } from '../constants/exercises';
import { useWorkout } from '../hooks/useWorkout';

export const WorkoutLoggerDemo: React.FC = () => {
  const { currentWorkout, startWorkout, isWorkoutActive } = useWorkout();
  const [workoutTemplate, setWorkoutTemplate] = useState<WorkoutTemplate | null>(null);

  // Create a sample workout template if no workout is active
  const defaultTemplate: WorkoutTemplate = {
    id: 'default-workout',
    name: 'Full Body Workout',
    description: 'Professional workout with AI coaching',
    exercises: [
      {
        exerciseId: EXERCISE_DATABASE[0].id,
        exercise: EXERCISE_DATABASE[0], // Bench Press
        targetSets: 3,
        targetReps: 8,
        targetWeight: 135,
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

  useEffect(() => {
    // If there's a current workout, convert it to a template format
    if (currentWorkout) {
      const template: WorkoutTemplate = {
        id: currentWorkout.id,
        name: currentWorkout.name || 'Current Workout',
        description: 'Active workout session',
        exercises: currentWorkout.exercises.map((ex, index) => ({
          exerciseId: ex.exerciseId,
          exercise: ex.exercise,
          targetSets: ex.targetSets || 3,
          targetReps: ex.targetReps || 8,
          targetWeight: ex.targetWeight || 100,
          restTimeBetweenSets: ex.restTimeBetweenSets || 90,
          order: index
        })),
        category: 'strength' as any,
        difficulty: 'intermediate' as any,
        estimatedDuration: 45,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      setWorkoutTemplate(template);
    } else {
      setWorkoutTemplate(defaultTemplate);
    }
  }, [currentWorkout]);

  const handleWorkoutComplete = () => {
    console.log('Workout completed!');
    // The workout logger will handle ending the workout
  };

  const handleStartWorkout = async () => {
    if (!isWorkoutActive) {
      try {
        // Start a workout with the default template
        await startWorkout(defaultTemplate.id, defaultTemplate.exercises.map(e => e.exercise));
      } catch (error) {
        console.error('Failed to start workout:', error);
      }
    }
  };

  // Show loading state while setting up
  if (!workoutTemplate) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '50vh',
        color: '#888'
      }}>
        Loading workout...
      </div>
    );
  }

  // If no workout is active, show start button
  if (!isWorkoutActive) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '50vh',
        padding: '20px'
      }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '20px', color: '#fff' }}>
          Ready to Start Your Workout?
        </h2>
        <p style={{ marginBottom: '30px', color: '#888', textAlign: 'center' }}>
          Experience the professional workout logger with AI coaching
        </p>
        <button
          onClick={handleStartWorkout}
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
          Start Workout
        </button>
      </div>
    );
  }

  return (
    <WorkoutLogger
      workoutTemplate={workoutTemplate}
      onWorkoutComplete={handleWorkoutComplete}
    />
  );
};