/**
 * Nimbus UI System - Main Export
 * A modern, fitness-focused component library
 */

// Theme
export { NimbusTheme, generateCSSVariables } from './theme';
export type { Theme } from './theme';

// Core Components
export { NimbusButton } from './components/NimbusButton';
export type { NimbusButtonProps } from './components/NimbusButton';

export { NimbusBottomNavigation } from './components/NimbusBottomNavigation';
export type { NimbusBottomNavigationProps, NavigationItem } from './components/NimbusBottomNavigation';

export { NimbusCard } from './components/NimbusCard';
export type { NimbusCardProps } from './components/NimbusCard';

export { NimbusStreamingChat } from './components/NimbusStreamingChat';

export { NimbusVoicePersonalitySelector } from './components/NimbusVoicePersonalitySelector';

export { NimbusWorkoutGenerator } from './components/NimbusWorkoutGenerator';

// Services
export { NimbusAIService, nimbusAI } from './services/NimbusAIService';
export { NimbusVoiceService, nimbusVoice } from './services/NimbusVoiceService';
export type { VoicePersonality, EmotionalState } from './services/NimbusVoiceService';
export { NimbusWorkoutGenerator as NimbusWorkoutGeneratorService, nimbusWorkoutGenerator } from './services/NimbusWorkoutGenerator';
export type { ExerciseAlternative, WorkoutGenerationConfig, GeneratedWorkout } from './services/NimbusWorkoutGenerator';

// Utility functions
export const cn = (...classes: (string | undefined | null | false)[]) => {
  return classes.filter(Boolean).join(' ');
};