import React, { useState } from 'react';
import styles from '../../styles/workout-logger.module.css';

interface ExerciseHeaderProps {
  workoutName: string;
  currentExerciseIndex: number;
  totalExercises: number;
  exerciseName: string;
  currentSet: number;
  totalSets: number;
  onTemplateToggle: () => void;
}

export const ExerciseHeader: React.FC<ExerciseHeaderProps> = ({
  workoutName,
  currentExerciseIndex,
  totalExercises,
  exerciseName,
  currentSet,
  totalSets,
  onTemplateToggle
}) => {
  const [isTemplateExpanded, setIsTemplateExpanded] = useState(false);

  const handleTemplateToggle = () => {
    setIsTemplateExpanded(!isTemplateExpanded);
    onTemplateToggle();
  };

  return (
    <div className={styles.exerciseHeader}>
      <div className={styles.workoutMeta}>
        {workoutName} • Exercise {currentExerciseIndex}/{totalExercises}
      </div>
      <h1 className={styles.exerciseTitle}>{exerciseName}</h1>
      <div className={styles.setInfo}>
        Set {currentSet} of {totalSets}
      </div>
      
      <div className={styles.templateToggle}>
        <button 
          className={`${styles.templateBtn} ${isTemplateExpanded ? styles.expanded : ''}`}
          onClick={handleTemplateToggle}
        >
          <span className={styles.templateText}>What's Next?</span>
          <span className={styles.templateArrow}>⌄</span>
        </button>
      </div>
    </div>
  );
};