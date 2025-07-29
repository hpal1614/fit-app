import React, { useEffect } from 'react';
import styles from '../../styles/workout-logger.module.css';

interface VoiceInterfaceProps {
  isListening: boolean;
  transcript: string;
  onToggleVoice: () => void;
  onVoiceCommand: (transcript: string) => void;
}

export const VoiceInterface: React.FC<VoiceInterfaceProps> = ({
  isListening,
  transcript,
  onToggleVoice,
  onVoiceCommand
}) => {
  // Process transcript when it changes
  useEffect(() => {
    if (transcript && transcript.trim() !== '') {
      // Debounce to wait for complete phrase
      const timer = setTimeout(() => {
        onVoiceCommand(transcript);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [transcript, onVoiceCommand]);

  return (
    <div className={styles.voiceCardClean}>
      <div className={styles.voiceDisplay}>
        <div className={styles.voiceStatus}>
          <span className={styles.voiceIcon}>🎤</span>
          <span className={styles.voiceText}>
            {isListening 
              ? transcript || 'Listening...' 
              : 'Tap to speak or use buttons below'}
          </span>
        </div>
        <button 
          className={`${styles.voiceTrigger} ${isListening ? styles.active : ''}`}
          onClick={onToggleVoice}
        >
          <span className={styles.voiceTriggerIcon}>🎤</span>
        </button>
      </div>
    </div>
  );
};