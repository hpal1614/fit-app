import React, { useState } from 'react';
import { useWorkout } from '../../hooks/useWorkout';
import styles from '../../styles/WorkoutLogger.module.css';

interface EnhancedWorkoutLoggerProps {
  currentExercise?: any;
  onLogSet?: (setData: any) => void;
}

export const EnhancedWorkoutLogger: React.FC<EnhancedWorkoutLoggerProps> = ({
  currentExercise,
  onLogSet
}) => {
  const { workoutContext } = useWorkout();
  const [currentWeight, setCurrentWeight] = useState(135);
  const [currentReps, setCurrentReps] = useState(8);

  const adjustWeight = (amount: number) => {
    setCurrentWeight(prev => Math.max(0, prev + amount));
  };

  const adjustReps = (amount: number) => {
    setCurrentReps(prev => Math.max(1, prev + amount));
  };

  const logSet = () => {
    console.log(`Logging: ${currentWeight}lbs x ${currentReps} reps`);
    if (onLogSet) {
      onLogSet({ weight: currentWeight, reps: currentReps });
    }
  };

  return (
    <div className={styles.device}>
      {/* Exercise Header */}
      <div className={styles.exerciseHeader}>
        <div className={styles.workoutMeta}>Chest Day • Exercise 2/6</div>
        <h1 className={styles.exerciseTitle}>
          {currentExercise?.name || 'Bench Press'}
        </h1>
        <div className={styles.setInfo}>Set 3 of 3 • Personal record zone</div>
      </div>

      {/* Previous Set */}
      <div className={styles.previousCard}>
        <div className={styles.previousLabel}>Previous Set</div>
        <div className={styles.previousValue}>
          {currentWeight - 5} lbs × {currentReps} reps • RPE 7/10
        </div>
      </div>

      {/* Weight Control */}
      <div className={styles.card}>
        <div className={styles.cardLabel}>Weight</div>
        <div className={styles.weightControl}>
          <button 
            className={styles.weightBtn} 
            onClick={() => adjustWeight(-2.5)}
          >
            −
          </button>
          <div className={styles.weightDisplay}>
            <div className={styles.weightValue}>{currentWeight}</div>
            <div className={styles.weightUnit}>lbs</div>
          </div>
          <button 
            className={styles.weightBtn} 
            onClick={() => adjustWeight(2.5)}
          >
            +
          </button>
        </div>
      </div>

      {/* Rep Counter */}
      <div className={styles.card}>
        <div className={styles.cardLabel}>Reps</div>
        <div className={styles.repControl}>
          <div className={styles.repSectionLeft}>
            <div className={styles.repLabel}>Current</div>
            <div className={styles.repValue}>{currentReps}</div>
          </div>
          <div className={styles.repButtons}>
            <button 
              className={styles.repBtn} 
              onClick={() => adjustReps(-1)}
            >
              −
            </button>
            <button 
              className={styles.repBtn} 
              onClick={() => adjustReps(1)}
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* Log Button */}
      <div className={styles.card}>
        <button className={styles.logBtn} onClick={logSet}>
          Log Set
        </button>
      </div>
    </div>
  );
};