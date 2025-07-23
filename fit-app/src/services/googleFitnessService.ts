import { BiometricData, WorkoutMetrics } from '../types/workout';

interface GoogleFitnessConfig {
  apiKey: string;
  clientId?: string;
  scopes?: string[];
}

interface FitnessDataPoint {
  startTimeNanos: string;
  endTimeNanos: string;
  value: any[];
  dataTypeName: string;
}

class GoogleFitnessService {
  private config: GoogleFitnessConfig;
  private accessToken: string | null = null;
  private isInitialized = false;
  private mockMode = false;

  constructor() {
    this.config = {
      apiKey: import.meta.env.VITE_GOOGLE_FITNESS_API_KEY || '',
      scopes: [
        'https://www.googleapis.com/auth/fitness.activity.read',
        'https://www.googleapis.com/auth/fitness.body.read',
        'https://www.googleapis.com/auth/fitness.location.read',
        'https://www.googleapis.com/auth/fitness.nutrition.read'
      ]
    };

    // Enable mock mode if no API key
    this.mockMode = !this.config.apiKey;
  }

  async initialize(): Promise<void> {
    if (this.mockMode) {
      console.log('Google Fitness: Running in mock mode');
      this.isInitialized = true;
      return;
    }

    try {
      // Load Google API client library
      await this.loadGoogleApi();
      
      // Initialize the API client
      await gapi.client.init({
        apiKey: this.config.apiKey,
        discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/fitness/v1/rest'],
      });

      this.isInitialized = true;
      console.log('Google Fitness API initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Google Fitness API:', error);
      this.mockMode = true;
      this.isInitialized = true;
    }
  }

  private async loadGoogleApi(): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => {
        gapi.load('client:auth2', () => {
          resolve();
        });
      };
      script.onerror = reject;
      document.body.appendChild(script);
    });
  }

  async authenticate(): Promise<boolean> {
    if (this.mockMode) return true;

    try {
      const authInstance = gapi.auth2.getAuthInstance();
      if (!authInstance) {
        await gapi.auth2.init({
          client_id: this.config.clientId,
          scope: this.config.scopes?.join(' ')
        });
      }

      const user = await gapi.auth2.getAuthInstance().signIn();
      this.accessToken = user.getAuthResponse().access_token;
      return true;
    } catch (error) {
      console.error('Authentication failed:', error);
      return false;
    }
  }

  async getBiometricData(userId: string): Promise<BiometricData | null> {
    if (!this.isInitialized) await this.initialize();

    if (this.mockMode) {
      return this.generateMockBiometricData();
    }

    try {
      const now = Date.now();
      const dayAgo = now - 24 * 60 * 60 * 1000;

      // Fetch heart rate data
      const heartRateData = await this.getDataset(
        'com.google.heart_rate.bpm',
        dayAgo,
        now
      );

      // Fetch step count
      const stepData = await this.getDataset(
        'com.google.step_count.delta',
        dayAgo,
        now
      );

      // Fetch calories
      const calorieData = await this.getDataset(
        'com.google.calories.expended',
        dayAgo,
        now
      );

      // Process and return the most recent data
      return {
        heartRate: this.extractLatestValue(heartRateData, 'fpVal') || 75,
        heartRateVariability: this.calculateHRV(heartRateData) || 45,
        bloodOxygen: 98, // Google Fit doesn't provide SpO2 directly
        temperature: 98.6, // Not available in Google Fit
        hydrationLevel: 75, // Estimated
        timestamp: new Date(),
        stressLevel: this.calculateStressLevel(heartRateData)
      };
    } catch (error) {
      console.error('Error fetching biometric data:', error);
      return this.generateMockBiometricData();
    }
  }

  async getWorkoutMetrics(workoutId: string): Promise<WorkoutMetrics | null> {
    if (!this.isInitialized) await this.initialize();

    if (this.mockMode) {
      return this.generateMockWorkoutMetrics();
    }

    try {
      const sessions = await this.getActivitySessions();
      const latestSession = sessions[0];

      if (!latestSession) {
        return this.generateMockWorkoutMetrics();
      }

      const startTime = parseInt(latestSession.startTimeMillis);
      const endTime = parseInt(latestSession.endTimeMillis);

      // Get detailed metrics for the session
      const [heartRateData, stepData, calorieData, distanceData] = await Promise.all([
        this.getDataset('com.google.heart_rate.bpm', startTime, endTime),
        this.getDataset('com.google.step_count.delta', startTime, endTime),
        this.getDataset('com.google.calories.expended', startTime, endTime),
        this.getDataset('com.google.distance.delta', startTime, endTime)
      ]);

      return {
        duration: (endTime - startTime) / 1000, // Convert to seconds
        caloriesBurned: this.sumValues(calorieData, 'fpVal') || 250,
        averageHeartRate: this.calculateAverage(heartRateData, 'fpVal') || 120,
        maxHeartRate: this.calculateMax(heartRateData, 'fpVal') || 145,
        minHeartRate: this.calculateMin(heartRateData, 'fpVal') || 95,
        steps: this.sumValues(stepData, 'intVal') || 0,
        distance: this.sumValues(distanceData, 'fpVal') || 0,
        pace: this.calculatePace(distanceData, endTime - startTime),
        activeDuration: this.calculateActiveDuration(heartRateData),
        restDuration: (endTime - startTime) / 1000 - this.calculateActiveDuration(heartRateData),
        intensity: this.calculateIntensity(heartRateData),
        timestamp: new Date(endTime)
      };
    } catch (error) {
      console.error('Error fetching workout metrics:', error);
      return this.generateMockWorkoutMetrics();
    }
  }

  private async getDataset(
    dataTypeName: string,
    startTimeMillis: number,
    endTimeMillis: number
  ): Promise<FitnessDataPoint[]> {
    if (!this.accessToken) {
      throw new Error('Not authenticated');
    }

    const response = await gapi.client.fitness.users.dataset.aggregate({
      userId: 'me',
      requestBody: {
        aggregateBy: [{
          dataTypeName: dataTypeName
        }],
        bucketByTime: { durationMillis: 86400000 }, // 1 day
        startTimeMillis: startTimeMillis.toString(),
        endTimeMillis: endTimeMillis.toString()
      }
    });

    return response.result.bucket?.[0]?.dataset?.[0]?.point || [];
  }

  private async getActivitySessions(): Promise<any[]> {
    if (!this.accessToken) {
      throw new Error('Not authenticated');
    }

    const now = Date.now();
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;

    const response = await gapi.client.fitness.users.sessions.list({
      userId: 'me',
      startTime: new Date(weekAgo).toISOString(),
      endTime: new Date(now).toISOString()
    });

    return response.result.session || [];
  }

  private extractLatestValue(dataPoints: FitnessDataPoint[], valueField: string): number | null {
    if (!dataPoints || dataPoints.length === 0) return null;
    
    const latestPoint = dataPoints[dataPoints.length - 1];
    return latestPoint.value[0]?.[valueField] || null;
  }

  private calculateAverage(dataPoints: FitnessDataPoint[], valueField: string): number {
    if (!dataPoints || dataPoints.length === 0) return 0;
    
    const sum = dataPoints.reduce((acc, point) => {
      return acc + (point.value[0]?.[valueField] || 0);
    }, 0);
    
    return sum / dataPoints.length;
  }

  private calculateMax(dataPoints: FitnessDataPoint[], valueField: string): number {
    if (!dataPoints || dataPoints.length === 0) return 0;
    
    return Math.max(...dataPoints.map(point => point.value[0]?.[valueField] || 0));
  }

  private calculateMin(dataPoints: FitnessDataPoint[], valueField: string): number {
    if (!dataPoints || dataPoints.length === 0) return 0;
    
    return Math.min(...dataPoints.map(point => point.value[0]?.[valueField] || Infinity));
  }

  private sumValues(dataPoints: FitnessDataPoint[], valueField: string): number {
    if (!dataPoints || dataPoints.length === 0) return 0;
    
    return dataPoints.reduce((sum, point) => {
      return sum + (point.value[0]?.[valueField] || 0);
    }, 0);
  }

  private calculateHRV(heartRateData: FitnessDataPoint[]): number {
    // Simplified HRV calculation based on heart rate variability
    if (!heartRateData || heartRateData.length < 2) return 45;
    
    const values = heartRateData.map(point => point.value[0]?.fpVal || 0);
    const differences = [];
    
    for (let i = 1; i < values.length; i++) {
      differences.push(Math.abs(values[i] - values[i - 1]));
    }
    
    const avgDiff = differences.reduce((a, b) => a + b, 0) / differences.length;
    return Math.min(80, Math.max(20, avgDiff * 10)); // Scale to reasonable HRV range
  }

  private calculateStressLevel(heartRateData: FitnessDataPoint[]): number {
    // Estimate stress based on heart rate patterns
    const avgHR = this.calculateAverage(heartRateData, 'fpVal');
    const hrv = this.calculateHRV(heartRateData);
    
    // Higher HR and lower HRV indicate higher stress
    const stressFromHR = Math.min(100, Math.max(0, (avgHR - 60) * 2));
    const stressFromHRV = Math.min(100, Math.max(0, 100 - hrv));
    
    return (stressFromHR + stressFromHRV) / 2;
  }

  private calculatePace(distanceData: FitnessDataPoint[], durationMillis: number): number {
    const totalDistance = this.sumValues(distanceData, 'fpVal');
    if (totalDistance === 0) return 0;
    
    const durationMinutes = durationMillis / 60000;
    return durationMinutes / (totalDistance / 1000); // min/km
  }

  private calculateActiveDuration(heartRateData: FitnessDataPoint[]): number {
    // Count time where heart rate is above resting (>90 bpm)
    const activeThreshold = 90;
    let activeDuration = 0;
    
    heartRateData.forEach(point => {
      if ((point.value[0]?.fpVal || 0) > activeThreshold) {
        const duration = parseInt(point.endTimeNanos) - parseInt(point.startTimeNanos);
        activeDuration += duration / 1000000000; // Convert nanos to seconds
      }
    });
    
    return activeDuration;
  }

  private calculateIntensity(heartRateData: FitnessDataPoint[]): 'low' | 'moderate' | 'high' {
    const avgHR = this.calculateAverage(heartRateData, 'fpVal');
    
    if (avgHR < 100) return 'low';
    if (avgHR < 140) return 'moderate';
    return 'high';
  }

  private generateMockBiometricData(): BiometricData {
    return {
      heartRate: 75 + Math.random() * 10,
      heartRateVariability: 40 + Math.random() * 20,
      bloodOxygen: 96 + Math.random() * 3,
      temperature: 98.6 + (Math.random() - 0.5),
      hydrationLevel: 70 + Math.random() * 20,
      timestamp: new Date(),
      stressLevel: 30 + Math.random() * 40
    };
  }

  private generateMockWorkoutMetrics(): WorkoutMetrics {
    return {
      duration: 3600,
      caloriesBurned: 250 + Math.random() * 150,
      averageHeartRate: 110 + Math.random() * 30,
      maxHeartRate: 140 + Math.random() * 20,
      minHeartRate: 80 + Math.random() * 20,
      steps: Math.floor(3000 + Math.random() * 2000),
      distance: 3 + Math.random() * 2,
      pace: 5 + Math.random() * 2,
      activeDuration: 2700 + Math.random() * 600,
      restDuration: 300 + Math.random() * 300,
      intensity: ['low', 'moderate', 'high'][Math.floor(Math.random() * 3)] as any,
      timestamp: new Date()
    };
  }

  // Stream real-time heart rate data
  async streamHeartRate(callback: (heartRate: number) => void): Promise<() => void> {
    if (this.mockMode) {
      // Mock streaming
      const interval = setInterval(() => {
        callback(70 + Math.random() * 30);
      }, 1000);
      
      return () => clearInterval(interval);
    }

    // For real implementation, you'd use Google Fit's real-time API
    // This is a placeholder for the actual implementation
    console.log('Real-time streaming not implemented for Google Fitness API');
    
    // Return mock streaming as fallback
    const interval = setInterval(() => {
      callback(70 + Math.random() * 30);
    }, 1000);
    
    return () => clearInterval(interval);
  }

  isConnected(): boolean {
    return this.isInitialized && (this.mockMode || !!this.accessToken);
  }

  async disconnect(): Promise<void> {
    if (!this.mockMode && gapi.auth2) {
      const authInstance = gapi.auth2.getAuthInstance();
      if (authInstance) {
        await authInstance.signOut();
      }
    }
    
    this.accessToken = null;
    console.log('Disconnected from Google Fitness API');
  }
}

// Create singleton instance
const googleFitnessService = new GoogleFitnessService();

// Declare gapi types
declare const gapi: any;

export default googleFitnessService;