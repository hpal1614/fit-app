export interface User {
  name: string;
  initials: string;
  level: number;
  xp: number;
  xpGoal: number;
  streak: number;
  totalXp: number;
  location: string;
}

export interface Workout {
  title: string;
  type: string;
  duration: number;
  calories: number;
  xp: number;
  exercises: { name: string; sets: string }[];
}

export enum WorkoutStatus {
  Completed = 'completed',
  Missed = 'missed',
  Upcoming = 'upcoming',
}

export interface WorkoutDay {
  day: string;
  date: number;
  status: WorkoutStatus;
  workout: Workout | null;
}

export interface MacroNutrients {
  protein: { current: number; goal: number };
  carbs: { current: number; goal: number };
  fats: { current: number; goal: number };
}

export interface MealMacros {
    protein: number;
    carbs: number;
    fats: number;
}

export interface NutritionData {
  macros: MacroNutrients;
  water: { current: number; goal: number };
  meals: {
      breakfast: MealMacros;
      lunch: MealMacros;
      dinner: MealMacros;
      snack: MealMacros;
  };
}

export enum AchievementRarity {
    Common = 'Common',
    Rare = 'Rare',
    Epic = 'Epic',
    Legendary = 'Legendary',
}

export interface Achievement {
    id: number;
    title: string;
    description: string;
    icon: string;
    unlocked: boolean;
    rarity: AchievementRarity;
    progress?: { current: number; goal: number };
}

export interface AnalyticsData {
    levelXp: { current: number; goal: number };
    streaks: { title: string; days: number }[];
    weeklyGoals: { title: string; completed: boolean }[];
    personalRecords: { title: string; value: string }[];
    achievements: Achievement[];
}

export interface GymStatus {
    occupancy: number;
    statusText: string;
    peakTimes: string;
    lastUpdated: string;
    hourlyForecast: { time: string; occupancy: number; isCurrent: boolean }[];
}

export interface Class {
    id: number;
    name: string;
    instructor: string;
    time: string;
    category: string;
    spotsLeft: number;
    enrolled: boolean;
}


