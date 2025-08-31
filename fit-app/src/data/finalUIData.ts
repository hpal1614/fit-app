import type { User, WorkoutDay, NutritionData, AnalyticsData, GymStatus, Class } from '../types/finalUI';
import { WorkoutStatus, AchievementRarity } from '../types/finalUI';

export const user: User = {
  name: 'Alex',
  initials: 'A',
  level: 12,
  xp: 1850,
  xpGoal: 2500,
  streak: 24,
  totalXp: 15400,
  location: 'San Francisco'
};

export const workoutWeek: WorkoutDay[] = [
  { day: 'Mon', date: 20, status: WorkoutStatus.Completed, workout: { title: 'Full Body Strength', type: 'Strength', duration: 60, calories: 450, xp: 150, exercises: [{ name: 'Squats', sets: '3x10' }, { name: 'Bench Press', sets: '3x8' }, { name: 'Deadlifts', sets: '3x5' }] } },
  { day: 'Tue', date: 21, status: WorkoutStatus.Completed, workout: { title: 'Cardio Blast', type: 'Cardio', duration: 45, calories: 550, xp: 120, exercises: [{ name: 'Treadmill Run', sets: '30 min' }, { name: 'HIIT Sprints', sets: '10x1 min' }] } },
  { day: 'Wed', date: 22, status: WorkoutStatus.Upcoming, workout: { title: 'Upper Body Power', type: 'Strength', duration: 50, calories: 400, xp: 140, exercises: [{ name: 'Pull Ups', sets: '4xAMRAP' }, { name: 'Overhead Press', sets: '4x8' }, { name: 'Bicep Curls', sets: '3x12' }] } },
  { day: 'Thu', date: 23, status: WorkoutStatus.Missed, workout: { title: 'Active Recovery', type: 'Flexibility', duration: 30, calories: 100, xp: 50, exercises: [{ name: 'Stretching', sets: '15 min' }, { name: 'Foam Rolling', sets: '15 min' }] } },
  { day: 'Fri', date: 24, status: WorkoutStatus.Upcoming, workout: { title: 'Leg Day', type: 'Strength', duration: 75, calories: 600, xp: 200, exercises: [{ name: 'Leg Press', sets: '4x12' }, { name: 'Lunges', sets: '3x10/leg' }, { name: 'Calf Raises', sets: '4x15' }] } },
  { day: 'Sat', date: 25, status: WorkoutStatus.Upcoming, workout: null },
  { day: 'Sun', date: 26, status: WorkoutStatus.Upcoming, workout: null },
];

export const dailyNutritionData: NutritionData[] = [
    { // Mon
        macros: { protein: { current: 130, goal: 150 }, carbs: { current: 220, goal: 250 }, fats: { current: 60, goal: 70 } },
        water: { current: 3000, goal: 3000 },
        meals: {
            breakfast: { protein: 30, carbs: 60, fats: 15 },
            lunch: { protein: 50, carbs: 80, fats: 25 },
            dinner: { protein: 40, carbs: 70, fats: 15 },
            snack: { protein: 10, carbs: 10, fats: 5 },
        }
    },
    { // Tue
        macros: { protein: { current: 110, goal: 150 }, carbs: { current: 180, goal: 250 }, fats: { current: 55, goal: 70 } },
        water: { current: 2500, goal: 3000 },
        meals: {
            breakfast: { protein: 25, carbs: 50, fats: 10 },
            lunch: { protein: 45, carbs: 70, fats: 20 },
            dinner: { protein: 30, carbs: 50, fats: 20 },
            snack: { protein: 10, carbs: 10, fats: 5 },
        }
    },
    { // Wed (Today)
        macros: { protein: { current: 25, goal: 150 }, carbs: { current: 100, goal: 250 }, fats: { current: 20, goal: 70 } },
        water: { current: 1250, goal: 3000 },
        meals: {
            breakfast: { protein: 25, carbs: 100, fats: 20 },
            lunch: { protein: 0, carbs: 0, fats: 0 },
            dinner: { protein: 0, carbs: 0, fats: 0 },
            snack: { protein: 0, carbs: 0, fats: 0 },
        }
    },
    { // Thu
        macros: { protein: { current: 0, goal: 150 }, carbs: { current: 0, goal: 250 }, fats: { current: 0, goal: 70 } },
        water: { current: 0, goal: 3000 },
        meals: { breakfast: { protein: 0, carbs: 0, fats: 0 }, lunch: { protein: 0, carbs: 0, fats: 0 }, dinner: { protein: 0, carbs: 0, fats: 0 }, snack: { protein: 0, carbs: 0, fats: 0 } }
    },
    { // Fri
        macros: { protein: { current: 0, goal: 150 }, carbs: { current: 0, goal: 250 }, fats: { current: 0, goal: 70 } },
        water: { current: 0, goal: 3000 },
        meals: { breakfast: { protein: 0, carbs: 0, fats: 0 }, lunch: { protein: 0, carbs: 0, fats: 0 }, dinner: { protein: 0, carbs: 0, fats: 0 }, snack: { protein: 0, carbs: 0, fats: 0 } }
    },
    { // Sat
        macros: { protein: { current: 0, goal: 150 }, carbs: { current: 0, goal: 250 }, fats: { current: 0, goal: 70 } },
        water: { current: 0, goal: 3000 },
        meals: { breakfast: { protein: 0, carbs: 0, fats: 0 }, lunch: { protein: 0, carbs: 0, fats: 0 }, dinner: { protein: 0, carbs: 0, fats: 0 }, snack: { protein: 0, carbs: 0, fats: 0 } }
    },
    { // Sun
        macros: { protein: { current: 0, goal: 150 }, carbs: { current: 0, goal: 250 }, fats: { current: 0, goal: 70 } },
        water: { current: 0, goal: 3000 },
        meals: { breakfast: { protein: 0, carbs: 0, fats: 0 }, lunch: { protein: 0, carbs: 0, fats: 0 }, dinner: { protein: 0, carbs: 0, fats: 0 }, snack: { protein: 0, carbs: 0, fats: 0 } }
    },
];

export const analyticsData: AnalyticsData = {
  levelXp: { current: 1850, goal: 2500 },
  streaks: [
    { title: 'Workout Streak', days: 24 },
    { title: 'Perfect Nutrition', days: 7 },
    { title: 'Early Riser', days: 12 },
  ],
  weeklyGoals: [
    { title: '5 Workouts', completed: true },
    { title: '10k Steps Daily', completed: true },
    { title: '8h Sleep', completed: false },
  ],
  personalRecords: [
    { title: 'Bench Press', value: '225 lbs' },
    { title: '5k Run', value: '22:15' },
    { title: 'Squat', value: '315 lbs' },
  ],
  achievements: [
    { id: 1, title: 'Marathoner', description: 'Run a full marathon.', icon: 'trophy', unlocked: true, rarity: AchievementRarity.Epic },
    { id: 2, title: 'Century Club', description: 'Complete 100 workouts.', icon: 'dumbbell', unlocked: true, rarity: AchievementRarity.Rare },
    { id: 3, title: 'Consistency King', description: '30-day workout streak.', icon: 'fire', unlocked: false, rarity: AchievementRarity.Rare, progress: { current: 24, goal: 30 } },
    { id: 4, title: 'Hydration Hero', description: 'Drink 8 glasses of water for 7 straight days.', icon: 'droplet', unlocked: true, rarity: AchievementRarity.Common },
    { id: 5, title: 'Olympian', description: 'Reach Level 50.', icon: 'star', unlocked: false, rarity: AchievementRarity.Legendary, progress: { current: 12, goal: 50 } },
  ],
};

export const gymStatus: GymStatus = {
  occupancy: 75,
  statusText: 'Busy',
  peakTimes: '5 PM - 7 PM',
  lastUpdated: '2 min ago',
  hourlyForecast: [
    { time: '12 AM', occupancy: 10, isCurrent: false },
    { time: '1 AM', occupancy: 5, isCurrent: false },
    { time: '2 AM', occupancy: 5, isCurrent: false },
    { time: '3 AM', occupancy: 5, isCurrent: false },
    { time: '4 AM', occupancy: 10, isCurrent: false },
    { time: '5 AM', occupancy: 20, isCurrent: false },
    { time: '6 AM', occupancy: 35, isCurrent: false },
    { time: '7 AM', occupancy: 50, isCurrent: false },
    { time: '8 AM', occupancy: 45, isCurrent: false },
    { time: '9 AM', occupancy: 30, isCurrent: false },
    { time: '10 AM', occupancy: 25, isCurrent: false },
    { time: '11 AM', occupancy: 30, isCurrent: false },
    { time: '12 PM', occupancy: 40, isCurrent: false },
    { time: '1 PM', occupancy: 35, isCurrent: false },
    { time: '2 PM', occupancy: 30, isCurrent: false },
    { time: '3 PM', occupancy: 40, isCurrent: false },
    { time: '4 PM', occupancy: 60, isCurrent: false },
    { time: '5 PM', occupancy: 75, isCurrent: true },
    { time: '6 PM', occupancy: 85, isCurrent: false },
    { time: '7 PM', occupancy: 80, isCurrent: false },
    { time: '8 PM', occupancy: 50, isCurrent: false },
    { time: '9 PM', occupancy: 35, isCurrent: false },
    { time: '10 PM', occupancy: 20, isCurrent: false },
    { time: '11 PM', occupancy: 15, isCurrent: false },
  ]
};

export const upcomingClasses: Class[] = [
  { id: 1, name: 'Yoga Flow', instructor: 'Maria', time: '6:00 PM', category: 'Flexibility', spotsLeft: 5, enrolled: false },
  { id: 2, name: 'HIIT', instructor: 'John', time: '7:00 PM', category: 'Cardio', spotsLeft: 0, enrolled: true },
  { id: 3, name: 'Powerlifting', instructor: 'Chris', time: '8:00 PM', category: 'Strength', spotsLeft: 2, enrolled: false },
];
