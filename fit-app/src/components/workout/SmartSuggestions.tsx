import React, { useEffect, useState } from 'react';
import styles from '../../styles/workout-logger.module.css';

interface Suggestion {
  id: string;
  text: string;
  icon: string;
}

interface SmartSuggestionsProps {
  suggestions: Suggestion[];
}

export const SmartSuggestions: React.FC<SmartSuggestionsProps> = ({ suggestions }) => {
  const [visibleSuggestions, setVisibleSuggestions] = useState<Suggestion[]>([]);

  useEffect(() => {
    // Show new suggestions
    suggestions.forEach((suggestion, index) => {
      if (!visibleSuggestions.find(s => s.id === suggestion.id)) {
        setTimeout(() => {
          setVisibleSuggestions(prev => [...prev, suggestion]);
          
          // Auto-hide after 4 seconds
          setTimeout(() => {
            setVisibleSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
          }, 4000);
        }, index * 500); // Stagger multiple suggestions
      }
    });
  }, [suggestions]);

  return (
    <>
      {visibleSuggestions.map((suggestion, index) => (
        <div 
          key={suggestion.id}
          className={styles.smartSuggestion}
          style={{
            top: `${20 + (index * 80)}px`,
            animationDelay: `${index * 0.1}s`
          }}
        >
          <div className={styles.suggestionContent}>
            <span className={styles.suggestionIcon}>{suggestion.icon}</span>
            <span className={styles.suggestionText}>{suggestion.text}</span>
          </div>
        </div>
      ))}
    </>
  );
};