import { terraService, BiometricData, WorkoutBiometrics, RecoveryMetrics, SleepData } from './terraService';
import { aiService } from './enhancedAIService';
import { emotionalVoice } from './emotionalVoice';
import { voiceService } from './voiceService';

interface BiometricInsight {
  type: 'warning' | 'info' | 'success';
  title: string;
  message: string;
  recommendation?: string;
  timestamp: Date;
}

interface WorkoutAdaptation {
  intensityModifier: number; // 0.5 to 1.5
  volumeModifier: number;    // 0.5 to 1.5
  restModifier: number;      // 0.5 to 2.0
  exerciseSwaps: { [exercise: string]: string };
  reasons: string[];
}

interface ZoneTarget {
  zone: string;
  targetMinutes: number;
  actualMinutes: number;
  percentComplete: number;
}

export class BiometricAnalysisService {
  private currentBiometrics: BiometricData | null = null;
  private biometricHistory: BiometricData[] = [];
  private insights: BiometricInsight[] = [];
  private lastVoiceFeedback = 0;
  private voiceFeedbackInterval = 30000; // 30 seconds
  private userAge = 30; // Default, should be set from user profile
  
  // Thresholds for alerts
  private readonly THRESHOLDS = {
    heartRate: {
      resting: { min: 40, max: 80 },
      maxPercentage: 0.95 // 95% of max HR
    },
    hrv: {
      low: 30,
      optimal: 50
    },
    stress: {
      high: 70,
      moderate: 40
    },
    recovery: {
      poor: 50,
      good: 70,
      excellent: 85
    }
  };

  // Subscribe to real-time biometrics
  startMonitoring(userAge?: number): () => void {
    if (userAge) this.userAge = userAge;
    
    return terraService.subscribeToBiometrics((data) => {
      this.processBiometricUpdate(data);
    });
  }

  // Process incoming biometric data
  private processBiometricUpdate(data: BiometricData): void {
    this.currentBiometrics = data;
    this.biometricHistory.push(data);
    
    // Keep only last 300 data points (5 minutes at 1Hz)
    if (this.biometricHistory.length > 300) {
      this.biometricHistory.shift();
    }

    // Analyze for insights
    this.analyzeBiometrics(data);
    
    // Provide voice feedback if needed
    this.provideVoiceFeedback();
  }

  // Analyze biometrics for insights and warnings
  private analyzeBiometrics(data: BiometricData): void {
    const maxHR = 220 - this.userAge;
    
    // Heart rate analysis
    if (data.heart_rate) {
      const hrPercentage = data.heart_rate / maxHR;
      
      if (hrPercentage > this.THRESHOLDS.heartRate.maxPercentage) {
        this.addInsight({
          type: 'warning',
          title: 'Heart Rate Near Maximum',
          message: `Your heart rate (${data.heart_rate} bpm) is at ${Math.round(hrPercentage * 100)}% of max`,
          recommendation: 'Consider reducing intensity or taking a break',
          timestamp: new Date()
        });
      }
    }

    // HRV analysis
    if (data.heart_rate_variability) {
      if (data.heart_rate_variability < this.THRESHOLDS.hrv.low) {
        this.addInsight({
          type: 'warning',
          title: 'Low HRV Detected',
          message: `Your HRV (${data.heart_rate_variability}ms) indicates high stress or fatigue`,
          recommendation: 'Focus on recovery and stress management',
          timestamp: new Date()
        });
      }
    }

    // Stress level analysis
    if (data.stress_level && data.stress_level > this.THRESHOLDS.stress.high) {
      this.addInsight({
        type: 'warning',
        title: 'High Stress Detected',
        message: 'Your body is showing signs of elevated stress',
        recommendation: 'Try breathing exercises or reduce workout intensity',
        timestamp: new Date()
      });
    }
  }

  // Add insight and manage history
  private addInsight(insight: BiometricInsight): void {
    // Avoid duplicate insights within 5 minutes
    const recentSimilar = this.insights.find(i => 
      i.title === insight.title && 
      (Date.now() - i.timestamp.getTime()) < 300000
    );
    
    if (!recentSimilar) {
      this.insights.push(insight);
      // Keep only last 10 insights
      if (this.insights.length > 10) {
        this.insights.shift();
      }
    }
  }

  // Provide voice feedback for important insights
  private async provideVoiceFeedback(): Promise<void> {
    const now = Date.now();
    if (now - this.lastVoiceFeedback < this.voiceFeedbackInterval) return;

    const recentWarning = this.insights.find(i => 
      i.type === 'warning' && 
      (now - i.timestamp.getTime()) < 60000
    );

    if (recentWarning && recentWarning.recommendation) {
      this.lastVoiceFeedback = now;
      
      // Adapt voice tone based on urgency
      await emotionalVoice.adaptToWorkoutContext({
        intensity: 'high',
        exerciseType: 'cardio'
      });
      
      await voiceService.speak(recentWarning.recommendation);
    }
  }

  // Get workout adaptation based on recovery metrics
  async getWorkoutAdaptation(): Promise<WorkoutAdaptation> {
    try {
      const recovery = await terraService.getRecoveryMetrics();
      const recentWorkouts = await this.getRecentWorkouts();
      
      return this.calculateWorkoutAdaptation(recovery, recentWorkouts);
    } catch (error) {
      console.error('Failed to get workout adaptation:', error);
      return this.getDefaultAdaptation();
    }
  }

  // Calculate workout modifications based on recovery
  private calculateWorkoutAdaptation(
    recovery: RecoveryMetrics, 
    recentWorkouts: WorkoutBiometrics[]
  ): WorkoutAdaptation {
    const adaptation: WorkoutAdaptation = {
      intensityModifier: 1.0,
      volumeModifier: 1.0,
      restModifier: 1.0,
      exerciseSwaps: {},
      reasons: []
    };

    // Adjust based on recovery score
    if (recovery.recovery_score < this.THRESHOLDS.recovery.poor) {
      adaptation.intensityModifier = 0.7;
      adaptation.volumeModifier = 0.8;
      adaptation.restModifier = 1.5;
      adaptation.reasons.push('Low recovery score - reducing intensity and volume');
      
      // Suggest exercise swaps for lower impact
      adaptation.exerciseSwaps = {
        'squat': 'gobletSquat',
        'deadlift': 'romanianDeadlift',
        'burpees': 'mountainClimbers',
        'jumpingJacks': 'marchingInPlace'
      };
    } else if (recovery.recovery_score > this.THRESHOLDS.recovery.excellent) {
      adaptation.intensityModifier = 1.1;
      adaptation.volumeModifier = 1.1;
      adaptation.reasons.push('Excellent recovery - ready for challenging workout');
    }

    // Adjust based on sleep quality
    if (recovery.sleep_quality < 60) {
      adaptation.intensityModifier *= 0.9;
      adaptation.restModifier *= 1.2;
      adaptation.reasons.push('Poor sleep quality - extended rest periods');
    }

    // Adjust based on stress level
    if (recovery.stress_level === 'high') {
      adaptation.volumeModifier *= 0.8;
      adaptation.reasons.push('High stress - reduced workout volume');
    }

    // Adjust based on HRV trend
    if (recovery.hrv_trend === 'declining') {
      adaptation.intensityModifier *= 0.85;
      adaptation.reasons.push('Declining HRV trend - monitoring for overtraining');
    }

    // Check recent workout load
    const avgIntensity = recentWorkouts.reduce((sum, w) => sum + w.intensity_score, 0) / recentWorkouts.length;
    if (avgIntensity > 75) {
      adaptation.restModifier *= 1.3;
      adaptation.reasons.push('High recent training load - increased rest');
    }

    return adaptation;
  }

  // Get zone targets for current workout
  getZoneTargets(workoutType: 'strength' | 'cardio' | 'hiit' | 'recovery'): ZoneTarget[] {
    const targets: ZoneTarget[] = [];
    
    switch (workoutType) {
      case 'cardio':
        targets.push(
          { zone: 'warmup', targetMinutes: 5, actualMinutes: 0, percentComplete: 0 },
          { zone: 'fat_burn', targetMinutes: 20, actualMinutes: 0, percentComplete: 0 },
          { zone: 'cardio', targetMinutes: 15, actualMinutes: 0, percentComplete: 0 },
          { zone: 'peak', targetMinutes: 5, actualMinutes: 0, percentComplete: 0 }
        );
        break;
      
      case 'hiit':
        targets.push(
          { zone: 'warmup', targetMinutes: 5, actualMinutes: 0, percentComplete: 0 },
          { zone: 'cardio', targetMinutes: 10, actualMinutes: 0, percentComplete: 0 },
          { zone: 'peak', targetMinutes: 10, actualMinutes: 0, percentComplete: 0 }
        );
        break;
      
      case 'strength':
        targets.push(
          { zone: 'warmup', targetMinutes: 5, actualMinutes: 0, percentComplete: 0 },
          { zone: 'fat_burn', targetMinutes: 30, actualMinutes: 0, percentComplete: 0 }
        );
        break;
      
      case 'recovery':
        targets.push(
          { zone: 'rest', targetMinutes: 10, actualMinutes: 0, percentComplete: 0 },
          { zone: 'warmup', targetMinutes: 20, actualMinutes: 0, percentComplete: 0 }
        );
        break;
    }
    
    return targets;
  }

  // Update zone progress during workout
  updateZoneProgress(targets: ZoneTarget[], currentHR: number): ZoneTarget[] {
    const zones = terraService.calculateHeartRateZones(this.userAge);
    
    // Find current zone
    const currentZone = zones.find(z => currentHR >= z.min && currentHR <= z.max);
    if (!currentZone) return targets;
    
    // Update actual minutes for current zone
    return targets.map(target => {
      if (target.zone === currentZone.zone) {
        const newActual = target.actualMinutes + 1/60; // Add 1 second
        const percentComplete = Math.min(100, (newActual / target.targetMinutes) * 100);
        
        return {
          ...target,
          actualMinutes: newActual,
          percentComplete: Math.round(percentComplete)
        };
      }
      return target;
    });
  }

  // Get AI-powered insights
  async getAIInsights(workoutSummary: any): Promise<string> {
    const recovery = await terraService.getRecoveryMetrics();
    const recentWorkouts = await this.getRecentWorkouts();
    
    const prompt = `Based on this biometric data:
      - Current recovery score: ${recovery.recovery_score}%
      - HRV trend: ${recovery.hrv_trend}
      - Sleep quality: ${recovery.sleep_quality}%
      - Stress level: ${recovery.stress_level}
      - Recent workout intensity average: ${recentWorkouts.reduce((sum, w) => sum + w.intensity_score, 0) / recentWorkouts.length}%
      
      And this workout summary:
      - Exercise: ${workoutSummary.exercise}
      - Duration: ${workoutSummary.duration} minutes
      - Average heart rate: ${workoutSummary.avgHeartRate} bpm
      - Calories burned: ${workoutSummary.calories}
      
      Provide personalized recommendations for recovery and next workout.`;

    try {
      const response = await aiService.sendMessage(prompt);
      return response.message;
    } catch (error) {
      console.error('Failed to get AI insights:', error);
      return 'Focus on recovery with proper hydration and nutrition. Listen to your body for the next workout intensity.';
    }
  }

  // Get recent workout history
  private async getRecentWorkouts(): Promise<WorkoutBiometrics[]> {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days
    
    return terraService.getWorkoutData(startDate, endDate);
  }

  // Get sleep analysis
  async getSleepAnalysis(): Promise<{
    quality: 'poor' | 'fair' | 'good' | 'excellent';
    insights: string[];
    recommendations: string[];
  }> {
    const sleepData = await terraService.getSleepData(new Date(Date.now() - 24 * 60 * 60 * 1000));
    
    let quality: 'poor' | 'fair' | 'good' | 'excellent';
    const insights: string[] = [];
    const recommendations: string[] = [];

    // Determine quality
    if (sleepData.sleep_score >= 85) {
      quality = 'excellent';
    } else if (sleepData.sleep_score >= 70) {
      quality = 'good';
    } else if (sleepData.sleep_score >= 50) {
      quality = 'fair';
    } else {
      quality = 'poor';
    }

    // Duration insights
    if (sleepData.duration_hours < 7) {
      insights.push(`Only ${sleepData.duration_hours.toFixed(1)} hours of sleep - below recommended 7-9 hours`);
      recommendations.push('Try to get to bed 30 minutes earlier tonight');
    }

    // Sleep stages insights
    const deepSleepPercent = (sleepData.sleep_stages.deep / sleepData.duration_hours) * 100;
    if (deepSleepPercent < 15) {
      insights.push('Low deep sleep percentage - important for physical recovery');
      recommendations.push('Avoid screens 1 hour before bed to improve deep sleep');
    }

    // HRV insights
    if (sleepData.hrv_avg < 40) {
      insights.push('Lower than optimal HRV during sleep');
      recommendations.push('Consider stress reduction techniques before bed');
    }

    // Temperature insights
    if (Math.abs(sleepData.temperature_deviation) > 1) {
      insights.push('Significant temperature deviation during sleep');
      recommendations.push('Ensure bedroom temperature is between 60-67°F (15-19°C)');
    }

    return { quality, insights, recommendations };
  }

  // Get current metrics
  getCurrentBiometrics(): BiometricData | null {
    return this.currentBiometrics;
  }

  // Get recent insights
  getRecentInsights(): BiometricInsight[] {
    return [...this.insights].reverse(); // Most recent first
  }

  // Get heart rate trends
  getHeartRateTrend(): { timestamps: Date[]; values: number[] } {
    const timestamps = this.biometricHistory.map(b => b.timestamp);
    const values = this.biometricHistory.map(b => b.heart_rate || 0);
    
    return { timestamps, values };
  }

  // Get default adaptation when data is unavailable
  private getDefaultAdaptation(): WorkoutAdaptation {
    return {
      intensityModifier: 1.0,
      volumeModifier: 1.0,
      restModifier: 1.0,
      exerciseSwaps: {},
      reasons: ['Using standard workout parameters']
    };
  }

  // Set user age for calculations
  setUserAge(age: number): void {
    this.userAge = age;
  }

  // MCP Integration Method
  async analyzeMetrics(params: {
    heartRate?: number;
    hrv?: number;
    bloodOxygen?: number;
    temperature?: number;
    activity?: string;
  }): Promise<{
    analysis: string;
    insights: BiometricInsight[];
    recommendations: string[];
    riskLevel: 'low' | 'moderate' | 'high';
  }> {
    const insights: BiometricInsight[] = [];
    const recommendations: string[] = [];
    let riskLevel: 'low' | 'moderate' | 'high' = 'low';
    let analysis = '';

    // Heart Rate Analysis
    if (params.heartRate) {
      const maxHR = 220 - this.userAge;
      const hrPercentage = (params.heartRate / maxHR) * 100;
      
      if (params.activity === 'resting' && params.heartRate > this.THRESHOLDS.heartRate.resting.max) {
        insights.push({
          type: 'warning',
          title: 'Elevated Resting Heart Rate',
          message: `Your resting heart rate is ${params.heartRate} bpm`,
          recommendation: 'Consider stress management techniques or consult a healthcare provider',
          timestamp: new Date()
        });
        riskLevel = 'moderate';
      } else if (hrPercentage > 95) {
        insights.push({
          type: 'warning',
          title: 'Near Maximum Heart Rate',
          message: `You're at ${hrPercentage.toFixed(0)}% of your maximum heart rate`,
          recommendation: 'Consider reducing intensity',
          timestamp: new Date()
        });
        riskLevel = 'high';
      }
      
      analysis += `Heart rate: ${params.heartRate} bpm (${hrPercentage.toFixed(0)}% of max). `;
    }

    // HRV Analysis
    if (params.hrv) {
      if (params.hrv < this.THRESHOLDS.hrv.low) {
        insights.push({
          type: 'warning',
          title: 'Low Heart Rate Variability',
          message: `HRV is ${params.hrv}ms, indicating potential fatigue`,
          recommendation: 'Consider a recovery day or lighter workout',
          timestamp: new Date()
        });
        recommendations.push('Focus on recovery: sleep, hydration, and stress management');
        if (riskLevel === 'low') riskLevel = 'moderate';
      } else if (params.hrv > this.THRESHOLDS.hrv.optimal) {
        insights.push({
          type: 'success',
          title: 'Excellent Recovery',
          message: `HRV is ${params.hrv}ms, indicating good recovery`,
          timestamp: new Date()
        });
        recommendations.push('Your body is well-recovered - great day for intense training');
      }
      
      analysis += `HRV: ${params.hrv}ms. `;
    }

    // Blood Oxygen Analysis
    if (params.bloodOxygen) {
      if (params.bloodOxygen < 95) {
        insights.push({
          type: 'warning',
          title: 'Low Blood Oxygen',
          message: `SpO2 is ${params.bloodOxygen}%`,
          recommendation: 'Monitor closely and consider medical consultation if persistent',
          timestamp: new Date()
        });
        recommendations.push('Focus on breathing exercises and avoid high-altitude training');
        riskLevel = 'high';
      }
      
      analysis += `Blood oxygen: ${params.bloodOxygen}%. `;
    }

    // Temperature Analysis
    if (params.temperature) {
      if (params.temperature > 37.5) {
        insights.push({
          type: 'warning',
          title: 'Elevated Temperature',
          message: `Body temperature is ${params.temperature}°C`,
          recommendation: 'Consider resting and monitoring for illness',
          timestamp: new Date()
        });
        recommendations.push('Avoid intense exercise until temperature normalizes');
        if (riskLevel !== 'high') riskLevel = 'moderate';
      }
      
      analysis += `Temperature: ${params.temperature}°C. `;
    }

    // General recommendations based on combined metrics
    if (riskLevel === 'high') {
      recommendations.push('Consider postponing intense exercise today');
      recommendations.push('Focus on light movement and recovery');
    } else if (riskLevel === 'moderate') {
      recommendations.push('Reduce workout intensity by 20-30%');
      recommendations.push('Monitor your body\'s response closely');
    } else {
      recommendations.push('Biometrics look good for training');
      recommendations.push('Listen to your body during the workout');
    }

    return {
      analysis: analysis.trim(),
      insights,
      recommendations,
      riskLevel
    };
  }

  // Cleanup
  dispose(): void {
    this.biometricHistory = [];
    this.insights = [];
    this.currentBiometrics = null;
  }
}

// Export singleton instance
export const biometricAnalysis = new BiometricAnalysisService();