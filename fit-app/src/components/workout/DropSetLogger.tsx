import React, { useState } from 'react';
import styles from '../../styles/workout-logger.module.css';

interface DropSetData {
  startWeight: number;
  startReps: number;
  finishWeight: number;
  finishReps: number;
}

interface DropSetLoggerProps {
  startWeight: number;
  onComplete: (data: DropSetData) => void;
}

export const DropSetLogger: React.FC<DropSetLoggerProps> = ({
  startWeight,
  onComplete
}) => {
  const [startReps, setStartReps] = useState(3);
  const [finishWeight, setFinishWeight] = useState(Math.round(startWeight * 0.8));
  const [finishReps, setFinishReps] = useState(5);

  const handleComplete = () => {
    onComplete({
      startWeight,
      startReps,
      finishWeight,
      finishReps
    });
  };

  return (
    <div className={styles.dropSetCompact}>
      <div className={styles.dropInputRow}>
        <div className={styles.dropInputGroup}>
          <label>Started:</label>
          <span className={styles.dropWeightDisplay}>{startWeight}kg</span>
          <input 
            type="number" 
            className={styles.dropRepsInput}
            value={startReps}
            onChange={(e) => setStartReps(Number(e.target.value))}
          />
          <span className={styles.dropUnit}>reps</span>
        </div>
        
        <span className={styles.dropArrowCompact}>→</span>
        
        <div className={styles.dropInputGroup}>
          <label>Finished:</label>
          <span className={styles.dropWeightDisplay}>{finishWeight}kg</span>
          <input 
            type="number" 
            className={styles.dropRepsInput}
            value={finishReps}
            onChange={(e) => setFinishReps(Number(e.target.value))}
          />
          <span className={styles.dropUnit}>reps</span>
        </div>
      </div>
      
      <button 
        onClick={handleComplete}
        style={{
          marginTop: '12px',
          padding: '8px 16px',
          background: 'var(--accent)',
          color: 'var(--bg-deep)',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          width: '100%',
          fontWeight: 600
        }}
      >
        Log Drop Set
      </button>
    </div>
  );
};