import googleFitnessService from './googleFitnessService';
import { BiometricData, WorkoutMetrics } from '../types/workout';

export interface RecoveryMetrics {
  recoveryScore: number;
  readiness: number;
  hrv: number;
  restingHeartRate: number;
  bodyTemperature: number;
  respiratoryRate: number;
  bloodOxygen: number;
  muscleSoreness: number;
  timestamp: Date;
}

export interface SleepData {
  duration: number;
  quality: number;
  deepSleep: number;
  remSleep: number;
  lightSleep: number;
  awakeTime: number;
  latency: number;
  efficiency: number;
  timestamp: Date;
}

export interface WorkoutBiometrics extends WorkoutMetrics {
  vo2Max?: number;
  lactateThreshold?: number;
  anaerobicThreshold?: number;
  trainingEffect?: number;
  epoc?: number;
}

export interface HeartRateZone {
  name: string;
  min: number;
  max: number;
  percentage: number;
  duration: number;
  caloriesBurned: number;
}

export interface PersonalizedRecommendations {
  workoutIntensity: 'light' | 'moderate' | 'intense' | 'rest';
  suggestedDuration: number;
  focusAreas: string[];
  nutritionTips: string[];
  hydrationGoal: number;
  recoveryActivities: string[];
  optimalWorkoutTime: string;
}

class BiometricService {
  private mockData = false;

  async initialize(): Promise<void> {
    await googleFitnessService.initialize();
  }

  async authenticate(): Promise<boolean> {
    return await googleFitnessService.authenticate();
  }

  async generateAuthUrl(provider: string): Promise<string> {
    // Google Fitness uses OAuth, return a placeholder URL
    return 'https://accounts.google.com/oauth/authorize?client_id=YOUR_CLIENT_ID&scope=fitness';
  }

  async getUser(userId: string): Promise<any> {
    return {
      id: userId,
      name: 'Fitness User',
      provider: 'google_fit',
      connected: googleFitnessService.isConnected()
    };
  }

  async subscribeToBiometrics(callback: (data: BiometricData) => void): Promise<() => void> {
    // Poll for biometric data every 30 seconds
    const interval = setInterval(async () => {
      const data = await googleFitnessService.getBiometricData('current-user');
      if (data) {
        callback(data);
      }
    }, 30000);

    // Get initial data
    const initialData = await googleFitnessService.getBiometricData('current-user');
    if (initialData) {
      callback(initialData);
    }

    return () => clearInterval(interval);
  }

  async getBiometricData(userId: string): Promise<BiometricData | null> {
    return await googleFitnessService.getBiometricData(userId);
  }

  async getWorkoutMetrics(workoutId: string): Promise<WorkoutMetrics | null> {
    return await googleFitnessService.getWorkoutMetrics(workoutId);
  }

  async getRecoveryMetrics(): Promise<RecoveryMetrics> {
    const biometrics = await googleFitnessService.getBiometricData('current-user');
    
    if (!biometrics) {
      return this.generateMockRecoveryMetrics();
    }

    // Calculate recovery metrics based on available data
    const recoveryScore = this.calculateRecoveryScore(biometrics);
    const readiness = this.calculateReadiness(biometrics);

    return {
      recoveryScore,
      readiness,
      hrv: biometrics.heartRateVariability || 45,
      restingHeartRate: biometrics.heartRate || 65,
      bodyTemperature: biometrics.temperature || 98.6,
      respiratoryRate: 14 + Math.random() * 4, // Mock as Google Fit doesn't provide this
      bloodOxygen: biometrics.bloodOxygen || 98,
      muscleSoreness: 2 + Math.random() * 3, // Mock value
      timestamp: new Date()
    };
  }

  async getSleepData(date: Date): Promise<SleepData | null> {
    // Google Fitness API doesn't provide detailed sleep data in the basic API
    // Return mock data or integrate with Google Fit sleep tracking
    return this.generateMockSleepData();
  }

  async getWorkoutData(startDate: Date, endDate: Date): Promise<WorkoutBiometrics[]> {
    // In a real implementation, this would query multiple workout sessions
    const metrics = await googleFitnessService.getWorkoutMetrics('latest');
    
    if (!metrics) {
      return [this.generateMockWorkoutBiometrics()];
    }

    return [{
      ...metrics,
      vo2Max: 45 + Math.random() * 10,
      lactateThreshold: 150 + Math.random() * 20,
      anaerobicThreshold: 160 + Math.random() * 20,
      trainingEffect: 3 + Math.random() * 2,
      epoc: 50 + Math.random() * 100
    }];
  }

  calculateHeartRateZones(age: number): HeartRateZone[] {
    const maxHR = 220 - age;
    
    return [
      {
        name: 'Rest',
        min: 0,
        max: maxHR * 0.5,
        percentage: 10,
        duration: 600,
        caloriesBurned: 50
      },
      {
        name: 'Fat Burn',
        min: maxHR * 0.5,
        max: maxHR * 0.7,
        percentage: 30,
        duration: 1800,
        caloriesBurned: 150
      },
      {
        name: 'Cardio',
        min: maxHR * 0.7,
        max: maxHR * 0.85,
        percentage: 40,
        duration: 2400,
        caloriesBurned: 250
      },
      {
        name: 'Peak',
        min: maxHR * 0.85,
        max: maxHR,
        percentage: 20,
        duration: 1200,
        caloriesBurned: 200
      }
    ];
  }

  getPersonalizedRecommendations(
    recovery: RecoveryMetrics,
    workoutHistory: WorkoutBiometrics[],
    sleep: SleepData | null
  ): PersonalizedRecommendations {
    const avgIntensity = workoutHistory.reduce((sum, w) => {
      const intensityScore = w.intensity === 'high' ? 3 : w.intensity === 'moderate' ? 2 : 1;
      return sum + intensityScore;
    }, 0) / workoutHistory.length;

    let workoutIntensity: 'light' | 'moderate' | 'intense' | 'rest';
    if (recovery.recoveryScore < 50) {
      workoutIntensity = 'rest';
    } else if (recovery.recoveryScore < 70) {
      workoutIntensity = 'light';
    } else if (avgIntensity > 2.5) {
      workoutIntensity = 'moderate';
    } else {
      workoutIntensity = 'intense';
    }

    const sleepQuality = sleep?.quality || 70;
    const suggestedDuration = sleepQuality > 80 ? 60 : 45;

    return {
      workoutIntensity,
      suggestedDuration,
      focusAreas: this.determineFocusAreas(recovery, workoutHistory),
      nutritionTips: this.generateNutritionTips(recovery, workoutIntensity),
      hydrationGoal: this.calculateHydrationGoal(workoutIntensity),
      recoveryActivities: this.getRecoveryActivities(recovery),
      optimalWorkoutTime: this.determineOptimalWorkoutTime(sleep)
    };
  }

  async streamHeartRate(callback: (heartRate: number) => void): Promise<() => void> {
    return await googleFitnessService.streamHeartRate(callback);
  }

  isConnected(): boolean {
    return googleFitnessService.isConnected();
  }

  async disconnect(): Promise<void> {
    await googleFitnessService.disconnect();
  }

  // Private helper methods
  private calculateRecoveryScore(biometrics: BiometricData): number {
    const hrvScore = Math.min(100, (biometrics.heartRateVariability || 45) * 2);
    const hrScore = Math.max(0, 100 - Math.abs((biometrics.heartRate || 70) - 60));
    const stressScore = Math.max(0, 100 - (biometrics.stressLevel || 50));
    
    return (hrvScore + hrScore + stressScore) / 3;
  }

  private calculateReadiness(biometrics: BiometricData): number {
    const recovery = this.calculateRecoveryScore(biometrics);
    const hydration = biometrics.hydrationLevel || 75;
    const oxygen = biometrics.bloodOxygen || 98;
    
    return (recovery + hydration + oxygen) / 3;
  }

  private determineFocusAreas(recovery: RecoveryMetrics, history: WorkoutBiometrics[]): string[] {
    const areas = [];
    
    if (recovery.hrv < 40) areas.push('Stress management');
    if (recovery.muscleSoreness > 3) areas.push('Active recovery');
    if (history.length > 0 && history[0].intensity === 'high') areas.push('Low-intensity cardio');
    
    return areas.length > 0 ? areas : ['Balanced training'];
  }

  private generateNutritionTips(recovery: RecoveryMetrics, intensity: string): string[] {
    const tips = ['Stay hydrated throughout the day'];
    
    if (recovery.recoveryScore < 70) {
      tips.push('Increase protein intake for recovery');
      tips.push('Add anti-inflammatory foods');
    }
    
    if (intensity === 'intense') {
      tips.push('Consume complex carbs 2-3 hours before workout');
      tips.push('Post-workout protein within 30 minutes');
    }
    
    return tips;
  }

  private calculateHydrationGoal(intensity: string): number {
    const base = 2000; // ml
    const multiplier = intensity === 'intense' ? 1.5 : intensity === 'moderate' ? 1.3 : 1.1;
    return Math.round(base * multiplier);
  }

  private getRecoveryActivities(recovery: RecoveryMetrics): string[] {
    const activities = [];
    
    if (recovery.muscleSoreness > 3) {
      activities.push('Foam rolling', 'Light stretching');
    }
    
    if (recovery.hrv < 40) {
      activities.push('Meditation', 'Breathing exercises');
    }
    
    if (recovery.recoveryScore < 60) {
      activities.push('Light walk', 'Yoga');
    }
    
    return activities.length > 0 ? activities : ['Active recovery'];
  }

  private determineOptimalWorkoutTime(sleep: SleepData | null): string {
    if (!sleep || sleep.quality > 80) {
      return 'Morning (6-9 AM)';
    } else if (sleep.quality > 60) {
      return 'Late morning (10 AM-12 PM)';
    } else {
      return 'Afternoon (2-5 PM)';
    }
  }

  // Mock data generators
  private generateMockRecoveryMetrics(): RecoveryMetrics {
    return {
      recoveryScore: 70 + Math.random() * 25,
      readiness: 65 + Math.random() * 30,
      hrv: 40 + Math.random() * 30,
      restingHeartRate: 55 + Math.random() * 15,
      bodyTemperature: 98.6 + (Math.random() - 0.5),
      respiratoryRate: 14 + Math.random() * 4,
      bloodOxygen: 96 + Math.random() * 3,
      muscleSoreness: 1 + Math.random() * 4,
      timestamp: new Date()
    };
  }

  private generateMockSleepData(): SleepData {
    const duration = 6 + Math.random() * 3; // 6-9 hours
    return {
      duration: duration * 3600, // Convert to seconds
      quality: 60 + Math.random() * 35,
      deepSleep: duration * 0.15 + Math.random() * 0.1,
      remSleep: duration * 0.2 + Math.random() * 0.1,
      lightSleep: duration * 0.5 + Math.random() * 0.1,
      awakeTime: duration * 0.05 + Math.random() * 0.05,
      latency: 10 + Math.random() * 20,
      efficiency: 80 + Math.random() * 15,
      timestamp: new Date()
    };
  }

  private generateMockWorkoutBiometrics(): WorkoutBiometrics {
    return {
      duration: 3600,
      caloriesBurned: 300 + Math.random() * 200,
      averageHeartRate: 120 + Math.random() * 20,
      maxHeartRate: 160 + Math.random() * 20,
      minHeartRate: 80 + Math.random() * 20,
      steps: Math.floor(3000 + Math.random() * 3000),
      distance: 3 + Math.random() * 3,
      pace: 5 + Math.random() * 3,
      activeDuration: 2700 + Math.random() * 900,
      restDuration: 300 + Math.random() * 300,
      intensity: ['low', 'moderate', 'high'][Math.floor(Math.random() * 3)] as any,
      timestamp: new Date(),
      vo2Max: 40 + Math.random() * 15,
      lactateThreshold: 140 + Math.random() * 30,
      anaerobicThreshold: 150 + Math.random() * 30,
      trainingEffect: 2 + Math.random() * 3,
      epoc: 30 + Math.random() * 120
    };
  }
}

// Export singleton instance
export const biometricService = new BiometricService();

// Re-export types
export type { BiometricData, WorkoutMetrics };