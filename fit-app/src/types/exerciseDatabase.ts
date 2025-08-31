// Lightweight exercise schema for the hybrid local database

export type ExerciseDifficulty = 'beginner' | 'intermediate' | 'advanced';
export type ExerciseCategoryLite = 'compound' | 'isolation' | 'cardio' | 'flexibility';
export type ExerciseSource = 'wger' | 'exercisedb' | 'custom';

export interface AIEnhancements {
  formCues: string[];
  commonMistakes: string[];
  safetyTips: string[];
  modifications: string[];
  progressions: string[];
}

export interface ExerciseRecord {
  id: string; // stable slug id
  name: string;
  slug?: string;
  instructions: string[];
  primaryMuscles: string[];
  secondaryMuscles: string[];
  equipment: string[];
  difficulty: ExerciseDifficulty;
  category: ExerciseCategoryLite;
  gifUrl?: string;
  imageUrl?: string;
  source: ExerciseSource;
  aliases: string[];
  aiEnhanced: boolean;
  ai?: AIEnhancements;
  metadata?: {
    wgerId?: number;
    exerciseDbId?: string;
    language?: string;
    lastUpdated: string; // ISO
    version: number;
  };
  // Precomputed search helpers
  searchName?: string;
  searchAliases?: string[];
}

export interface MediaCacheRecord {
  id: string; // `${exerciseId}:gif` or similar
  exerciseId: string;
  type: 'gif' | 'image';
  mimeType: string;
  blob: Blob;
  updatedAt: string; // ISO
}

export interface ExerciseDatabaseMeta {
  id: string; // 'meta'
  version: number; // dataset schema/content version
  seededAt?: string; // ISO
  datasetUrl?: string;
}





