import axios, { AxiosInstance } from 'axios';

// Terra API types
export interface TerraUser {
  user_id: string;
  provider: string;
  last_webhook_update?: string;
  reference_id?: string;
}

export interface BiometricData {
  heart_rate?: number;
  heart_rate_variability?: number;
  respiratory_rate?: number;
  oxygen_saturation?: number;
  temperature?: number;
  calories_burned?: number;
  steps?: number;
  distance?: number;
  active_minutes?: number;
  sleep_duration?: number;
  sleep_quality?: number;
  stress_level?: number;
  recovery_score?: number;
  timestamp: Date;
}

export interface WorkoutBiometrics {
  avg_heart_rate: number;
  max_heart_rate: number;
  min_heart_rate: number;
  heart_rate_zones: HeartRateZone[];
  calories_burned: number;
  duration_minutes: number;
  intensity_score: number;
}

export interface HeartRateZone {
  zone: 'rest' | 'warmup' | 'fat_burn' | 'cardio' | 'peak';
  minutes: number;
  min_hr: number;
  max_hr: number;
  percentage: number;
}

export interface SleepData {
  duration_hours: number;
  sleep_stages: {
    deep: number;
    light: number;
    rem: number;
    awake: number;
  };
  sleep_score: number;
  hrv_avg: number;
  respiratory_rate_avg: number;
  temperature_deviation: number;
}

export interface RecoveryMetrics {
  recovery_score: number;
  hrv_trend: 'improving' | 'stable' | 'declining';
  sleep_quality: number;
  stress_level: 'low' | 'moderate' | 'high';
  readiness_score: number;
  recommendations: string[];
}

interface TerraConfig {
  apiKey: string;
  devId: string;
  webhookSecret?: string;
  baseUrl?: string;
}

export class TerraService {
  private api: AxiosInstance;
  private config: TerraConfig;
  private currentUser: TerraUser | null = null;
  private biometricCallbacks: ((data: BiometricData) => void)[] = [];
  private isStreaming = false;
  private streamingInterval: NodeJS.Timeout | null = null;
  
  // Simulated biometric data for development
  private simulatedData = {
    heartRate: 70,
    hrv: 45,
    stress: 30,
    calories: 0,
    steps: 0
  };

  constructor(config: TerraConfig) {
    this.config = config;
    this.api = axios.create({
      baseURL: config.baseUrl || 'https://api.tryterra.co/v2',
      headers: {
        'X-API-Key': config.apiKey,
        'dev-id': config.devId,
        'Content-Type': 'application/json'
      }
    });
  }

  // Generate authentication URL for user to connect their wearable
  async generateAuthUrl(provider: 'GARMIN' | 'FITBIT' | 'APPLE' | 'WHOOP' | 'OURA' | 'GOOGLE_FIT'): Promise<string> {
    try {
      const response = await this.api.post('/auth/generateAuthUrl', {
        providers: provider,
        auth_success_redirect_url: `${window.location.origin}/wearable-connected`,
        auth_failure_redirect_url: `${window.location.origin}/wearable-error`
      });

      return response.data.url;
    } catch (error) {
      console.error('Failed to generate auth URL:', error);
      // Return a simulated URL for development
      return `${window.location.origin}/wearable-connect-simulation?provider=${provider}`;
    }
  }

  // Get user data after authentication
  async getUser(userId: string): Promise<TerraUser> {
    try {
      const response = await this.api.get(`/userInfo?user_id=${userId}`);
      this.currentUser = response.data.user;
      return this.currentUser;
    } catch (error) {
      console.error('Failed to get user:', error);
      // Return simulated user for development
      this.currentUser = {
        user_id: userId,
        provider: 'SIMULATED'
      };
      return this.currentUser;
    }
  }

  // Subscribe to real-time biometric updates
  subscribeToBiometrics(callback: (data: BiometricData) => void): () => void {
    this.biometricCallbacks.push(callback);

    // Start streaming if not already
    if (!this.isStreaming) {
      this.startBiometricStream();
    }

    // Return unsubscribe function
    return () => {
      this.biometricCallbacks = this.biometricCallbacks.filter(cb => cb !== callback);
      if (this.biometricCallbacks.length === 0) {
        this.stopBiometricStream();
      }
    };
  }

  // Start real-time biometric streaming
  private startBiometricStream(): void {
    if (this.isStreaming) return;
    
    this.isStreaming = true;
    
    // Simulate real-time data stream
    this.streamingInterval = setInterval(() => {
      // Simulate workout intensity affecting heart rate
      const workoutIntensity = this.simulatedData.calories > 100 ? 1.5 : 1;
      const baseHR = 70;
      const variability = Math.random() * 10 - 5;
      
      this.simulatedData.heartRate = Math.round(baseHR * workoutIntensity + variability);
      this.simulatedData.hrv = Math.round(45 + Math.random() * 10 - 5);
      this.simulatedData.stress = Math.round(30 + (workoutIntensity - 1) * 40);
      this.simulatedData.calories += workoutIntensity * 0.5;
      this.simulatedData.steps += Math.random() > 0.5 ? 1 : 0;

      const data: BiometricData = {
        heart_rate: this.simulatedData.heartRate,
        heart_rate_variability: this.simulatedData.hrv,
        stress_level: this.simulatedData.stress,
        calories_burned: Math.round(this.simulatedData.calories),
        steps: this.simulatedData.steps,
        timestamp: new Date()
      };

      // Notify all subscribers
      this.biometricCallbacks.forEach(callback => callback(data));
    }, 1000); // Update every second
  }

  // Stop biometric streaming
  private stopBiometricStream(): void {
    if (this.streamingInterval) {
      clearInterval(this.streamingInterval);
      this.streamingInterval = null;
    }
    this.isStreaming = false;
  }

  // Get historical workout data
  async getWorkoutData(startDate: Date, endDate: Date): Promise<WorkoutBiometrics[]> {
    if (!this.currentUser) {
      throw new Error('No user connected');
    }

    try {
      const response = await this.api.get('/activity', {
        params: {
          user_id: this.currentUser.user_id,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          to_webhook: false
        }
      });

      return this.parseWorkoutData(response.data);
    } catch (error) {
      console.error('Failed to get workout data:', error);
      // Return simulated data
      return this.generateSimulatedWorkouts();
    }
  }

  // Get sleep data
  async getSleepData(date: Date): Promise<SleepData> {
    if (!this.currentUser) {
      throw new Error('No user connected');
    }

    try {
      const response = await this.api.get('/sleep', {
        params: {
          user_id: this.currentUser.user_id,
          start_date: date.toISOString(),
          end_date: new Date(date.getTime() + 24 * 60 * 60 * 1000).toISOString(),
          to_webhook: false
        }
      });

      return this.parseSleepData(response.data);
    } catch (error) {
      console.error('Failed to get sleep data:', error);
      // Return simulated data
      return this.generateSimulatedSleep();
    }
  }

  // Get recovery metrics
  async getRecoveryMetrics(): Promise<RecoveryMetrics> {
    if (!this.currentUser) {
      throw new Error('No user connected');
    }

    try {
      // Get recent data for analysis
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days
      
      const [sleepData, workoutData] = await Promise.all([
        this.getSleepData(new Date(endDate.getTime() - 24 * 60 * 60 * 1000)),
        this.getWorkoutData(startDate, endDate)
      ]);

      return this.calculateRecoveryMetrics(sleepData, workoutData);
    } catch (error) {
      console.error('Failed to get recovery metrics:', error);
      return this.generateSimulatedRecovery();
    }
  }

  // Calculate heart rate zones based on age
  calculateHeartRateZones(age: number): { zone: string; min: number; max: number }[] {
    const maxHR = 220 - age;
    
    return [
      { zone: 'rest', min: 0, max: Math.round(maxHR * 0.5) },
      { zone: 'warmup', min: Math.round(maxHR * 0.5), max: Math.round(maxHR * 0.6) },
      { zone: 'fat_burn', min: Math.round(maxHR * 0.6), max: Math.round(maxHR * 0.7) },
      { zone: 'cardio', min: Math.round(maxHR * 0.7), max: Math.round(maxHR * 0.85) },
      { zone: 'peak', min: Math.round(maxHR * 0.85), max: maxHR }
    ];
  }

  // Analyze workout intensity
  analyzeWorkoutIntensity(biometrics: WorkoutBiometrics): string {
    const { intensity_score, heart_rate_zones } = biometrics;
    
    const peakMinutes = heart_rate_zones.find(z => z.zone === 'peak')?.minutes || 0;
    const cardioMinutes = heart_rate_zones.find(z => z.zone === 'cardio')?.minutes || 0;
    
    if (intensity_score > 80 || peakMinutes > 10) {
      return 'high';
    } else if (intensity_score > 50 || cardioMinutes > 20) {
      return 'moderate';
    } else {
      return 'low';
    }
  }

  // Get personalized recommendations based on biometrics
  getPersonalizedRecommendations(recovery: RecoveryMetrics, recentWorkouts: WorkoutBiometrics[]): string[] {
    const recommendations: string[] = [];

    // Recovery-based recommendations
    if (recovery.recovery_score < 50) {
      recommendations.push('Consider a rest day or light recovery workout');
      recommendations.push('Focus on mobility and stretching today');
    } else if (recovery.recovery_score < 70) {
      recommendations.push('Moderate intensity workout recommended');
      recommendations.push('Avoid high-intensity intervals today');
    } else {
      recommendations.push('You\'re well recovered - ready for intense training!');
    }

    // Sleep-based recommendations
    if (recovery.sleep_quality < 60) {
      recommendations.push('Poor sleep detected - reduce workout intensity by 20%');
      recommendations.push('Consider meditation or yoga for better sleep');
    }

    // Stress-based recommendations
    if (recovery.stress_level === 'high') {
      recommendations.push('High stress detected - try breathwork exercises');
      recommendations.push('Keep workout under 45 minutes today');
    }

    // HRV trend recommendations
    if (recovery.hrv_trend === 'declining') {
      recommendations.push('HRV trending down - monitor for overtraining');
      recommendations.push('Ensure adequate protein and hydration');
    }

    return recommendations;
  }

  // Helper methods for data parsing
  private parseWorkoutData(data: any): WorkoutBiometrics[] {
    // Parse Terra API response format
    return data.data?.map((workout: any) => ({
      avg_heart_rate: workout.heart_rate_data?.avg_hr_bpm || 0,
      max_heart_rate: workout.heart_rate_data?.max_hr_bpm || 0,
      min_heart_rate: workout.heart_rate_data?.min_hr_bpm || 0,
      heart_rate_zones: this.parseHeartRateZones(workout.heart_rate_data?.hr_zones),
      calories_burned: workout.calories_data?.total_burned_calories || 0,
      duration_minutes: workout.metadata?.duration_seconds / 60 || 0,
      intensity_score: this.calculateIntensityScore(workout)
    })) || [];
  }

  private parseHeartRateZones(zones: any): HeartRateZone[] {
    if (!zones) return [];
    
    return Object.entries(zones).map(([zone, data]: [string, any]) => ({
      zone: zone as any,
      minutes: data.duration_seconds / 60,
      min_hr: data.min_hr_bpm,
      max_hr: data.max_hr_bpm,
      percentage: data.percentage
    }));
  }

  private parseSleepData(data: any): SleepData {
    const sleepData = data.data?.[0];
    
    return {
      duration_hours: sleepData?.sleep_durations_data?.total_sleep_duration_seconds / 3600 || 0,
      sleep_stages: {
        deep: sleepData?.sleep_durations_data?.deep_sleep_duration_seconds / 3600 || 0,
        light: sleepData?.sleep_durations_data?.light_sleep_duration_seconds / 3600 || 0,
        rem: sleepData?.sleep_durations_data?.rem_sleep_duration_seconds / 3600 || 0,
        awake: sleepData?.sleep_durations_data?.awake_duration_seconds / 3600 || 0
      },
      sleep_score: sleepData?.metadata?.sleep_score || 0,
      hrv_avg: sleepData?.hrv_data?.avg_hrv || 0,
      respiratory_rate_avg: sleepData?.respiratory_rate_data?.avg_rate || 0,
      temperature_deviation: sleepData?.temperature_data?.deviation || 0
    };
  }

  private calculateIntensityScore(workout: any): number {
    // Calculate based on heart rate zones and duration
    const peakMinutes = workout.heart_rate_data?.hr_zones?.peak?.duration_seconds / 60 || 0;
    const cardioMinutes = workout.heart_rate_data?.hr_zones?.cardio?.duration_seconds / 60 || 0;
    const totalMinutes = workout.metadata?.duration_seconds / 60 || 1;
    
    return Math.round((peakMinutes * 2 + cardioMinutes) / totalMinutes * 100);
  }

  private calculateRecoveryMetrics(sleep: SleepData, workouts: WorkoutBiometrics[]): RecoveryMetrics {
    // Calculate recovery score based on sleep and recent workout load
    const sleepScore = sleep.sleep_score || 50;
    const workoutLoad = workouts.reduce((sum, w) => sum + w.intensity_score, 0) / workouts.length;
    const recoveryScore = Math.round((sleepScore * 0.6 + (100 - workoutLoad) * 0.4));

    // Determine HRV trend (simplified)
    const hrvTrend = sleep.hrv_avg > 45 ? 'improving' : sleep.hrv_avg > 35 ? 'stable' : 'declining';

    // Determine stress level
    const stressLevel = workoutLoad > 70 ? 'high' : workoutLoad > 40 ? 'moderate' : 'low';

    // Calculate readiness score
    const readinessScore = Math.round((recoveryScore * 0.5 + sleep.sleep_score * 0.3 + (100 - workoutLoad) * 0.2));

    return {
      recovery_score: recoveryScore,
      hrv_trend: hrvTrend,
      sleep_quality: sleep.sleep_score,
      stress_level: stressLevel,
      readiness_score: readinessScore,
      recommendations: []
    };
  }

  // Simulated data generators for development
  private generateSimulatedWorkouts(): WorkoutBiometrics[] {
    const workouts: WorkoutBiometrics[] = [];
    
    for (let i = 0; i < 7; i++) {
      workouts.push({
        avg_heart_rate: 120 + Math.random() * 30,
        max_heart_rate: 150 + Math.random() * 30,
        min_heart_rate: 80 + Math.random() * 20,
        heart_rate_zones: [
          { zone: 'rest', minutes: 5, min_hr: 60, max_hr: 100, percentage: 10 },
          { zone: 'warmup', minutes: 10, min_hr: 100, max_hr: 120, percentage: 20 },
          { zone: 'fat_burn', minutes: 20, min_hr: 120, max_hr: 140, percentage: 40 },
          { zone: 'cardio', minutes: 10, min_hr: 140, max_hr: 160, percentage: 20 },
          { zone: 'peak', minutes: 5, min_hr: 160, max_hr: 180, percentage: 10 }
        ],
        calories_burned: 300 + Math.random() * 200,
        duration_minutes: 45 + Math.random() * 30,
        intensity_score: 50 + Math.random() * 40
      });
    }
    
    return workouts;
  }

  private generateSimulatedSleep(): SleepData {
    return {
      duration_hours: 6 + Math.random() * 3,
      sleep_stages: {
        deep: 1 + Math.random(),
        light: 3 + Math.random() * 2,
        rem: 1 + Math.random(),
        awake: 0.5 + Math.random() * 0.5
      },
      sleep_score: 60 + Math.random() * 40,
      hrv_avg: 35 + Math.random() * 30,
      respiratory_rate_avg: 14 + Math.random() * 4,
      temperature_deviation: -0.5 + Math.random()
    };
  }

  private generateSimulatedRecovery(): RecoveryMetrics {
    const score = 50 + Math.random() * 50;
    return {
      recovery_score: Math.round(score),
      hrv_trend: score > 70 ? 'improving' : score > 50 ? 'stable' : 'declining',
      sleep_quality: 60 + Math.random() * 40,
      stress_level: score > 70 ? 'low' : score > 50 ? 'moderate' : 'high',
      readiness_score: Math.round(score * 0.9 + Math.random() * 10),
      recommendations: []
    };
  }

  // Cleanup
  dispose(): void {
    this.stopBiometricStream();
    this.biometricCallbacks = [];
    this.currentUser = null;
  }
}

// Helper function to safely get environment variables in browser
function getEnvVar(key: string, defaultValue = ''): string {
  // Check Vite environment variables (VITE_ prefix)
  const viteKey = key.startsWith('VITE_') ? key : `VITE_${key}`;
  
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env[viteKey] || import.meta.env[key] || defaultValue;
  }
  
  // Fallback for window-based env vars
  if (typeof window !== 'undefined' && (window as any).env) {
    return (window as any).env[key] || defaultValue;
  }
  
  return defaultValue;
}

// Create singleton instance with config from environment
export const terraService = new TerraService({
  apiKey: getEnvVar('TERRA_API_KEY', 'demo-api-key'),
  devId: getEnvVar('TERRA_DEV_ID', 'demo-dev-id')
});