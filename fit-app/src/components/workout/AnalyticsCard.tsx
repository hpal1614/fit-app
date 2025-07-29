import React from 'react';
import { Workout, Exercise } from '../../types/workout';
import styles from '../../styles/workout-logger.module.css';

interface AnalyticsCardProps {
  currentWorkout?: Workout;
  currentExercise?: Exercise;
}

export const AnalyticsCard: React.FC<AnalyticsCardProps> = ({
  currentWorkout,
  currentExercise
}) => {
  // Calculate workout duration
  const workoutDuration = currentWorkout?.startTime 
    ? Math.floor((Date.now() - new Date(currentWorkout.startTime).getTime()) / 1000 / 60)
    : 0;

  // Calculate total volume
  const totalVolume = currentWorkout?.exercises?.reduce((total, exercise) => {
    return total + exercise.sets.reduce((setTotal, set) => {
      return setTotal + (set.weight * set.reps);
    }, 0);
  }, 0) || 0;

  // Calculate calories (rough estimate)
  const estimatedCalories = Math.round(workoutDuration * 7); // ~7 cal/min for strength training

  return (
    <div className={styles.card}>
      <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: 600 }}>
        Session Analytics
      </h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '4px' }}>
            Duration
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700 }}>
            {workoutDuration} min
          </div>
        </div>
        
        <div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '4px' }}>
            Total Volume
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700 }}>
            {(totalVolume / 1000).toFixed(1)}k
          </div>
        </div>
        
        <div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '4px' }}>
            Sets Completed
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700 }}>
            {currentWorkout?.exercises?.reduce((total, ex) => total + ex.sets.length, 0) || 0}
          </div>
        </div>
        
        <div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '4px' }}>
            Est. Calories
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700 }}>
            {estimatedCalories}
          </div>
        </div>
      </div>
      
      {currentExercise && (
        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ color: 'var(--accent)', fontSize: '14px', fontWeight: 500 }}>
            🎯 Current Exercise PR: {currentExercise.personalRecord || 'Not set'}
          </div>
        </div>
      )}
    </div>
  );
};