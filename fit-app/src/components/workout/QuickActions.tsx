import React from 'react';
import styles from '../../styles/workout-logger.module.css';

interface QuickActionsProps {
  onSwitchExercise: () => void;
  onDifficultyFeedback: (feedback: 'too_easy' | 'perfect' | 'too_hard') => void;
  onPainReport: () => void;
  onDropSet: () => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  onSwitchExercise,
  onDifficultyFeedback,
  onPainReport,
  onDropSet
}) => {
  return (
    <div className={styles.quickActions}>
      <button 
        className={styles.quickActionBtn}
        onClick={onSwitchExercise}
      >
        <div className={styles.quickActionIcon}>🔄</div>
        <div className={styles.quickActionLabel}>Switch Exercise</div>
      </button>
      
      <button 
        className={styles.quickActionBtn}
        onClick={() => onDifficultyFeedback('too_easy')}
      >
        <div className={styles.quickActionIcon}>💭</div>
        <div className={styles.quickActionLabel}>Difficulty</div>
      </button>
      
      <button 
        className={styles.quickActionBtn}
        onClick={onPainReport}
      >
        <div className={styles.quickActionIcon}>⚠️</div>
        <div className={styles.quickActionLabel}>Report Pain</div>
      </button>
      
      <button 
        className={styles.quickActionBtn}
        onClick={onDropSet}
      >
        <div className={styles.quickActionIcon}>⬇️</div>
        <div className={styles.quickActionLabel}>Drop Set</div>
      </button>
    </div>
  );
};