import type { User, AnalyticsData, GymStatus, Class } from '../types/finalUI';
import { AchievementRarity } from '../types/finalUI';

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
