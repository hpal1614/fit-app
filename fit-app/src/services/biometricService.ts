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

export interface BiometricData {
  heartRate?: number;
  hrv?: number;
  sleepScore?: number;
  recoveryScore?: number;
  stressLevel?: number;
  steps?: number;
  calories?: number;
  activeMinutes?: number;
}

export interface BiometricMetrics {
  heart_rate?: {
    current: number;
    resting: number;
    max: number;
    zones: {
      zone1: { min: number; max: number; minutes: number };
      zone2: { min: number; max: number; minutes: number };
      zone3: { min: number; max: number; minutes: number };
      zone4: { min: number; max: number; minutes: number };
      zone5: { min: number; max: number; minutes: number };
    };
  };
  hrv?: {
    current: number;
    average: number;
    trend: 'improving' | 'stable' | 'declining';
  };
  sleep?: {
    duration: number;
    quality: number;
    deep: number;
    rem: number;
    light: number;
  };
  recovery?: {
    score: number;
    readiness: 'ready' | 'moderate' | 'rest';
    recommendations: string[];
  };
}

export class BiometricService {
  private mockData: BiometricData = {
    heartRate: 72,
    hrv: 65,
    sleepScore: 85,
    recoveryScore: 78,
    stressLevel: 3,
    steps: 8500,
    calories: 2200,
    activeMinutes: 45
  };

  constructor() {
    // Initialize biometric service
  }

  async getCurrentMetrics(metrics: string[]): Promise<BiometricMetrics> {
    const result: BiometricMetrics = {};

    if (metrics.includes('heart_rate')) {
      result.heart_rate = {
        current: this.mockData.heartRate || 72,
        resting: 60,
        max: 190,
        zones: {
          zone1: { min: 50, max: 95, minutes: 120 },
          zone2: { min: 95, max: 114, minutes: 45 },
          zone3: { min: 114, max: 133, minutes: 30 },
          zone4: { min: 133, max: 152, minutes: 15 },
          zone5: { min: 152, max: 190, minutes: 5 }
        }
      };
    }

    if (metrics.includes('hrv')) {
      result.hrv = {
        current: this.mockData.hrv || 65,
        average: 62,
        trend: 'stable'
      };
    }

    if (metrics.includes('sleep')) {
      result.sleep = {
        duration: 7.5,
        quality: this.mockData.sleepScore || 85,
        deep: 1.8,
        rem: 2.1,
        light: 3.6
      };
    }

    if (metrics.includes('recovery')) {
      result.recovery = {
        score: this.mockData.recoveryScore || 78,
        readiness: this.getReadinessLevel(this.mockData.recoveryScore || 78),
        recommendations: this.getRecoveryRecommendations(this.mockData.recoveryScore || 78)
      };
    }

    return result;
  }

  private getReadinessLevel(score: number): 'ready' | 'moderate' | 'rest' {
    if (score >= 80) return 'ready';
    if (score >= 60) return 'moderate';
    return 'rest';
  }

  private getRecoveryRecommendations(score: number): string[] {
    if (score >= 80) {
      return [
        'You are well recovered and ready for intense training',
        'Consider a challenging workout today',
        'Focus on progressive overload'
      ];
    } else if (score >= 60) {
      return [
        'Moderate intensity workout recommended',
        'Focus on form and technique',
        'Include extra mobility work'
      ];
    } else {
      return [
        'Prioritize rest and recovery',
        'Light activity or yoga recommended',
        'Focus on hydration and nutrition'
      ];
    }
  }

  async updateMetrics(data: Partial<BiometricData>): Promise<void> {
    this.mockData = { ...this.mockData, ...data };
  }

  async getHistoricalData(metric: string, days: number): Promise<any[]> {
    // Mock historical data
    const data = [];
    const now = new Date();

    for (let i = 0; i < days; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      data.push({
        date: date.toISOString(),
        value: this.generateMockValue(metric, i)
      });
    }

    return data.reverse();
  }

  private generateMockValue(metric: string, dayOffset: number): number {
    const baseValues: { [key: string]: number } = {
      heartRate: 72,
      hrv: 65,
      sleepScore: 85,
      recoveryScore: 78,
      steps: 8500,
      calories: 2200
    };

    const base = baseValues[metric] || 50;
    const variation = Math.sin(dayOffset * 0.3) * 10 + Math.random() * 5;
    
    return Math.round(base + variation);
  }

  async connectDevice(deviceType: string): Promise<boolean> {
    // Simulate device connection
    console.log(`Connecting to ${deviceType}...`);
    
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`Connected to ${deviceType}`);
        resolve(true);
      }, 1000);
    });
  }

  async startRealtimeMonitoring(callback: (data: BiometricData) => void): Promise<void> {
    // Simulate realtime data updates
    const interval = setInterval(() => {
      const variation = Math.random() * 10 - 5;
      this.mockData.heartRate = Math.round(72 + variation);
      
      callback(this.mockData);
    }, 2000);

    // Store interval ID for cleanup
    (this as any).monitoringInterval = interval;
  }

  stopRealtimeMonitoring(): void {
    if ((this as any).monitoringInterval) {
      clearInterval((this as any).monitoringInterval);
      (this as any).monitoringInterval = null;
    }
  }
}

// Export singleton instance
export const biometricService = new BiometricService();

// Re-export types
export type { BiometricData, WorkoutMetrics };