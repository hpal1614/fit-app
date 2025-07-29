import React, { useRef, useState, useCallback } from 'react';
import styles from '../../styles/workout-logger.module.css';

interface DifficultySliderProps {
  difficulty: number; // 1-10 scale
  onDifficultyChange: (difficulty: number) => void;
}

export const DifficultySlider: React.FC<DifficultySliderProps> = ({
  difficulty,
  onDifficultyChange
}) => {
  const sliderRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const calculateDifficulty = useCallback((clientX: number) => {
    if (!sliderRef.current) return;
    
    const rect = sliderRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    const newDifficulty = Math.round((percentage / 100) * 9) + 1; // 1-10 scale
    
    onDifficultyChange(newDifficulty);
  }, [onDifficultyChange]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    calculateDifficulty(e.clientX);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      calculateDifficulty(e.clientX);
    }
  }, [isDragging, calculateDifficulty]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    calculateDifficulty(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging) {
      calculateDifficulty(e.touches[0].clientX);
    }
  };

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const percentage = ((difficulty - 1) / 9) * 100;

  return (
    <div className={styles.difficultySection}>
      <div className={styles.difficultyLabel}>
        How difficult was that? (RPE {difficulty}/10)
      </div>
      <div 
        className={styles.difficultySlider}
        ref={sliderRef}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleMouseUp}
      >
        <div className={styles.sliderTrack}>
          <div 
            className={styles.sliderFill}
            style={{ width: `${percentage}%` }}
          />
          <div 
            className={styles.sliderHandle}
            style={{ left: `${percentage}%` }}
          />
        </div>
      </div>
      <div className={styles.difficultyLabels}>
        <span>Easy</span>
        <span>Perfect</span>
        <span>Hard</span>
      </div>
    </div>
  );
};