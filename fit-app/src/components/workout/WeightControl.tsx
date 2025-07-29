import React from 'react';
import styles from '../../styles/workout-logger.module.css';

interface WeightControlProps {
  weight: number;
  unit: 'kg' | 'lbs';
  increment: number;
  onWeightChange: (newWeight: number) => void;
  onIncrementChange: (increment: number) => void;
  onTouchStart?: (e: React.TouchEvent) => void;
  onTouchEnd?: (e: React.TouchEvent) => void;
}

export const WeightControl: React.FC<WeightControlProps> = ({
  weight,
  unit,
  increment,
  onWeightChange,
  onIncrementChange,
  onTouchStart,
  onTouchEnd
}) => {
  const increments = [1, 2.5, 5, 10];

  return (
    <>
      <div className={styles.weightControl}>
        <button 
          className={styles.weightBtn}
          onClick={() => onWeightChange(weight - increment)}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          −
        </button>
        <div className={styles.weightDisplay}>
          <div className={styles.weightValue}>{weight}</div>
          <div className={styles.weightUnit}>{unit}</div>
        </div>
        <button 
          className={styles.weightBtn}
          onClick={() => onWeightChange(weight + increment)}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          +
        </button>
      </div>
      
      <div className={styles.incrementPills}>
        {increments.map((inc) => (
          <button
            key={inc}
            className={`${styles.pill} ${increment === inc ? styles.active : ''}`}
            onClick={() => onIncrementChange(inc)}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            {inc}{unit === 'kg' ? 'kg' : 'lbs'}
          </button>
        ))}
      </div>
    </>
  );
};