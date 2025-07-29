import React, { useState, useEffect } from 'react';
import styles from '../../styles/workout-logger.module.css';

interface StickyCarouselProps {
  workoutProgress: number; // 0-100
  isResting: boolean;
  restDuration: number; // seconds
  onRestComplete: () => void;
}

export const StickyCarousel: React.FC<StickyCarouselProps> = ({
  workoutProgress,
  isResting,
  restDuration,
  onRestComplete
}) => {
  const [timeRemaining, setTimeRemaining] = useState(restDuration);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isResting) {
      setTimeRemaining(restDuration);
      setIsPaused(false);
    }
  }, [isResting, restDuration]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isResting && !isPaused && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            onRestComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isResting, isPaused, timeRemaining, onRestComplete]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const adjustTime = (adjustment: number) => {
    setTimeRemaining(prev => Math.max(0, prev + adjustment));
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  // Determine timer state for styling
  const getTimerState = () => {
    if (!isResting) return 'complete';
    if (timeRemaining <= 10) return 'danger';
    if (timeRemaining <= 30) return 'warning';
    return 'normal';
  };

  return (
    <div className={styles.stickyCarousel}>
      <div className={styles.carouselTrack}>
        {/* Progress Card */}
        <div className={`${styles.carouselCard} ${styles.progressCard}`}>
          <div className={styles.miniProgressRing}>
            <div 
              className={styles.miniProgressCircle}
              style={{ '--progress': workoutProgress } as React.CSSProperties}
            >
              <div className={styles.miniProgressValue}>
                {Math.round(workoutProgress)}%
              </div>
            </div>
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 600 }}>Workout</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Progress</div>
          </div>
        </div>

        {/* Timer Card */}
        {isResting && (
          <div className={`${styles.carouselCard} ${styles.timerCard} ${styles[getTimerState()]}`}>
            <div className={styles.timerValue}>{formatTime(timeRemaining)}</div>
            <div className={styles.timerControls}>
              <button 
                className={styles.timerControlBtn}
                onClick={() => adjustTime(-30)}
              >
                -30
              </button>
              <button 
                className={`${styles.timerControlBtn} ${styles.playPause}`}
                onClick={togglePause}
              >
                {isPaused ? '▶' : '⏸'}
              </button>
              <button 
                className={styles.timerControlBtn}
                onClick={() => adjustTime(30)}
              >
                +30
              </button>
            </div>
          </div>
        )}

        {/* Additional cards can be added here */}
        <div className={styles.carouselCard}>
          <div style={{ fontSize: '14px', fontWeight: 600 }}>Next Up</div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            View upcoming exercises
          </div>
        </div>
      </div>
    </div>
  );
};