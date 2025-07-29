export * from './useAI';
export * from './useVoice';
export * from './useWorkout';
export * from './useMCP';
export * from './useMobile';

export type { UseVoiceReturn } from './useVoice';
export type { UseWorkoutReturn } from './useWorkout';

// Export specific hooks that might have been renamed
export { useVoice } from './useVoice';
export { useAI } from './useAI';
export { useWorkout } from './useWorkout';
export { useFormAnalysis } from './useFormAnalysis';
export { useBiometrics } from './useBiometrics';
export { useMCP } from './useMCP';