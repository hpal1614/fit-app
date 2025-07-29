import React from 'react';
import styles from '../../styles/workout-logger.module.css';

interface RepCounterProps {
  reps: number;
  onRepsChange: (newReps: number) => void;
  onTouchStart?: (e: React.TouchEvent) => void;
  onTouchEnd?: (e: React.TouchEvent) => void;
}

export const RepCounter: React.FC<RepCounterProps> = ({
  reps,
  onRepsChange,
  onTouchStart,
  onTouchEnd
}) => {
  return (
    <div className={styles.repCounter}>
      <button 
        className={styles.repBtn}
        onClick={() => onRepsChange(Math.max(0, reps - 1))}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        −
      </button>
      <div className={styles.repDisplay}>
        <div className={styles.repValue}>{reps}</div>
        <div className={styles.repLabel}>reps</div>
      </div>
      <button 
        className={styles.repBtn}
        onClick={() => onRepsChange(reps + 1)}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        +
      </button>
    </div>
  );
};