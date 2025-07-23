import { biometricAnalysis } from './biometricAnalysisService';
import { terraService, BiometricData, WorkoutBiometrics } from './terraService';
import { voiceService } from './voiceService';
import { aiService } from './enhancedAIService';

interface BiometricWorkout {
  id: string;
  name: string;
  originalDuration: number;
  adaptedDuration: number;
  originalIntensity: 'low' | 'moderate' | 'high';
  adaptedIntensity: 'low' | 'moderate' | 'high';
  exercises: BiometricExercise[];
  restPeriods: number[];
  targetHeartRateZones: string[];
}

interface BiometricExercise {
  id: string;
  name: string;
  originalSets: number;
  adaptedSets: number;
  originalReps: number;
  adaptedReps: number;
  originalWeight?: number;
  adaptedWeight?: number;
  restBetweenSets: number;
  targetHeartRateZone?: string;
  alternatives: string[];
}

interface WorkoutProgress {
  workoutId: string;
  startTime: Date;
  currentExerciseIndex: number;
  currentSetIndex: number;
  completedExercises: string[];
  biometricEvents: BiometricEvent[];
  averageHeartRate: number;
  maxHeartRate: number;
  caloriesBurned: number;
  zoneMinutes: { [zone: string]: number };
}

interface BiometricEvent {
  timestamp: Date;
  type: 'warning' | 'adaptation' | 'achievement';
  message: string;
  biometricData: BiometricData;
}

export class BiometricWorkoutService {
  private currentWorkout: BiometricWorkout | null = null;
  private workoutProgress: WorkoutProgress | null = null;
  private isMonitoring = false;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private biometricUnsubscribe: (() => void) | null = null;
  
  // Thresholds for real-time adaptations
  private readonly ADAPTATION_THRESHOLDS = {
    heartRateHigh: 0.9, // 90% of max HR
    heartRateLow: 0.5,  // 50% of max HR
    hrvDrop: 20,        // 20% drop from baseline
    stressHigh: 80,     // High stress level
    fatigueThreshold: 0.7 // 70% of workout complete with high stress
  };

  // Start a biometric-aware workout
  async startWorkout(
    workout: BiometricWorkout,
    userAge: number,
    baselineHRV?: number
  ): Promise<void> {
    // Get workout adaptation based on recovery
    const adaptation = await biometricAnalysis.getWorkoutAdaptation();
    
    // Apply adaptations to workout
    this.currentWorkout = this.applyWorkoutAdaptations(workout, adaptation);
    
    // Initialize progress tracking
    this.workoutProgress = {
      workoutId: workout.id,
      startTime: new Date(),
      currentExerciseIndex: 0,
      currentSetIndex: 0,
      completedExercises: [],
      biometricEvents: [],
      averageHeartRate: 0,
      maxHeartRate: 0,
      caloriesBurned: 0,
      zoneMinutes: {}
    };

    // Start biometric monitoring
    this.startBiometricMonitoring(userAge, baselineHRV);

    // Voice announcement
    await voiceService.speak(
      `Starting ${this.currentWorkout.name}. ` +
      `Today's workout has been adapted based on your recovery. ` +
      `Let's begin with ${this.currentWorkout.exercises[0].name}.`
    );
  }

  // Apply adaptations to workout plan
  private applyWorkoutAdaptations(
    workout: BiometricWorkout,
    adaptation: any
  ): BiometricWorkout {
    const adapted = { ...workout };

    // Adapt duration
    adapted.adaptedDuration = Math.round(
      workout.originalDuration * adaptation.volumeModifier
    );

    // Adapt intensity
    if (adaptation.intensityModifier < 0.8) {
      adapted.adaptedIntensity = 'low';
    } else if (adaptation.intensityModifier > 1.1) {
      adapted.adaptedIntensity = 'high';
    } else {
      adapted.adaptedIntensity = workout.originalIntensity;
    }

    // Adapt exercises
    adapted.exercises = workout.exercises.map(exercise => {
      const adaptedExercise = { ...exercise };

      // Check for exercise swaps
      const swap = adaptation.exerciseSwaps[exercise.id];
      if (swap) {
        adaptedExercise.name = swap;
        adaptedExercise.id = swap;
      }

      // Adapt sets and reps
      adaptedExercise.adaptedSets = Math.round(
        exercise.originalSets * adaptation.volumeModifier
      );
      adaptedExercise.adaptedReps = Math.round(
        exercise.originalReps * adaptation.intensityModifier
      );

      // Adapt weight if applicable
      if (exercise.originalWeight) {
        adaptedExercise.adaptedWeight = Math.round(
          exercise.originalWeight * adaptation.intensityModifier
        );
      }

      // Adapt rest periods
      adaptedExercise.restBetweenSets = Math.round(
        exercise.restBetweenSets * adaptation.restModifier
      );

      return adaptedExercise;
    });

    // Adapt rest periods between exercises
    adapted.restPeriods = workout.restPeriods.map(rest =>
      Math.round(rest * adaptation.restModifier)
    );

    return adapted;
  }

  // Start real-time biometric monitoring
  private startBiometricMonitoring(userAge: number, baselineHRV?: number): void {
    this.isMonitoring = true;
    
    // Subscribe to biometric updates
    this.biometricUnsubscribe = biometricAnalysis.startMonitoring(userAge);

    // Check biometrics every 5 seconds
    this.monitoringInterval = setInterval(() => {
      this.checkBiometricsAndAdapt(userAge, baselineHRV);
    }, 5000);
  }

  // Check biometrics and make real-time adaptations
  private async checkBiometricsAndAdapt(
    userAge: number,
    baselineHRV?: number
  ): Promise<void> {
    if (!this.currentWorkout || !this.workoutProgress) return;

    const current = biometricAnalysis.getCurrentBiometrics();
    if (!current) return;

    const maxHR = 220 - userAge;
    const hrPercentage = (current.heart_rate || 0) / maxHR;

    // Update workout metrics
    this.updateWorkoutMetrics(current);

    // Check for high heart rate
    if (hrPercentage > this.ADAPTATION_THRESHOLDS.heartRateHigh) {
      await this.handleHighHeartRate(current, hrPercentage);
    }

    // Check for low heart rate during intense exercise
    if (
      this.currentWorkout.adaptedIntensity === 'high' &&
      hrPercentage < this.ADAPTATION_THRESHOLDS.heartRateLow
    ) {
      await this.handleLowHeartRate(current);
    }

    // Check for HRV drop
    if (
      baselineHRV &&
      current.heart_rate_variability &&
      current.heart_rate_variability < baselineHRV * (1 - this.ADAPTATION_THRESHOLDS.hrvDrop / 100)
    ) {
      await this.handleHRVDrop(current);
    }

    // Check for high stress
    if (current.stress_level && current.stress_level > this.ADAPTATION_THRESHOLDS.stressHigh) {
      await this.handleHighStress(current);
    }

    // Check for fatigue
    const workoutProgress = this.calculateWorkoutProgress();
    if (
      workoutProgress > this.ADAPTATION_THRESHOLDS.fatigueThreshold &&
      current.stress_level &&
      current.stress_level > 60
    ) {
      await this.handleFatigue(current);
    }
  }

  // Handle high heart rate
  private async handleHighHeartRate(
    biometrics: BiometricData,
    hrPercentage: number
  ): Promise<void> {
    this.addBiometricEvent({
      timestamp: new Date(),
      type: 'warning',
      message: `Heart rate at ${Math.round(hrPercentage * 100)}% of maximum`,
      biometricData: biometrics
    });

    // Suggest rest if very high
    if (hrPercentage > 0.95) {
      await voiceService.speak(
        'Your heart rate is very high. Let\'s take a 30-second break.'
      );
      
      // Extend current rest period
      if (this.currentWorkout) {
        const currentExercise = this.currentWorkout.exercises[this.workoutProgress!.currentExerciseIndex];
        currentExercise.restBetweenSets += 30;
      }
    }
  }

  // Handle low heart rate
  private async handleLowHeartRate(biometrics: BiometricData): Promise<void> {
    this.addBiometricEvent({
      timestamp: new Date(),
      type: 'adaptation',
      message: 'Heart rate lower than expected for workout intensity',
      biometricData: biometrics
    });

    // Suggest intensity increase
    await voiceService.speak(
      'Your heart rate is low. Try increasing your pace or intensity.'
    );
  }

  // Handle HRV drop
  private async handleHRVDrop(biometrics: BiometricData): Promise<void> {
    this.addBiometricEvent({
      timestamp: new Date(),
      type: 'warning',
      message: 'Significant HRV drop detected',
      biometricData: biometrics
    });

    // Reduce remaining sets
    if (this.currentWorkout) {
      const currentExercise = this.currentWorkout.exercises[this.workoutProgress!.currentExerciseIndex];
      if (currentExercise.adaptedSets > 1) {
        currentExercise.adaptedSets = Math.max(1, currentExercise.adaptedSets - 1);
        
        await voiceService.speak(
          'Your body is showing signs of fatigue. Reducing sets for this exercise.'
        );
      }
    }
  }

  // Handle high stress
  private async handleHighStress(biometrics: BiometricData): Promise<void> {
    this.addBiometricEvent({
      timestamp: new Date(),
      type: 'warning',
      message: 'High stress level detected',
      biometricData: biometrics
    });

    // Suggest breathing exercise
    await voiceService.speak(
      'High stress detected. Let\'s do a quick breathing exercise. ' +
      'Breathe in for 4, hold for 4, out for 4.'
    );
  }

  // Handle fatigue
  private async handleFatigue(biometrics: BiometricData): Promise<void> {
    this.addBiometricEvent({
      timestamp: new Date(),
      type: 'adaptation',
      message: 'Fatigue detected in final phase of workout',
      biometricData: biometrics
    });

    // Offer to end workout early
    await voiceService.speak(
      'You\'re doing great but showing signs of fatigue. ' +
      'Consider this your last set if you need to.'
    );
  }

  // Move to next exercise
  async nextExercise(): Promise<void> {
    if (!this.currentWorkout || !this.workoutProgress) return;

    // Mark current exercise as complete
    const currentExercise = this.currentWorkout.exercises[this.workoutProgress.currentExerciseIndex];
    this.workoutProgress.completedExercises.push(currentExercise.id);

    // Move to next exercise
    this.workoutProgress.currentExerciseIndex++;
    this.workoutProgress.currentSetIndex = 0;

    if (this.workoutProgress.currentExerciseIndex < this.currentWorkout.exercises.length) {
      const nextExercise = this.currentWorkout.exercises[this.workoutProgress.currentExerciseIndex];
      
      // Get rest period
      const restPeriod = this.currentWorkout.restPeriods[this.workoutProgress.currentExerciseIndex - 1] || 60;
      
      await voiceService.speak(
        `Great job! Rest for ${restPeriod} seconds. ` +
        `Next up: ${nextExercise.adaptedSets} sets of ${nextExercise.adaptedReps} ${nextExercise.name}.`
      );
    } else {
      // Workout complete
      await this.endWorkout();
    }
  }

  // Complete current set
  async completeSet(): Promise<void> {
    if (!this.currentWorkout || !this.workoutProgress) return;

    const currentExercise = this.currentWorkout.exercises[this.workoutProgress.currentExerciseIndex];
    this.workoutProgress.currentSetIndex++;

    if (this.workoutProgress.currentSetIndex < currentExercise.adaptedSets) {
      // More sets remaining
      await voiceService.speak(
        `Set ${this.workoutProgress.currentSetIndex} complete. ` +
        `Rest for ${currentExercise.restBetweenSets} seconds.`
      );
    } else {
      // Exercise complete
      await this.nextExercise();
    }
  }

  // End workout
  async endWorkout(): Promise<any> {
    if (!this.workoutProgress) return null;

    // Stop monitoring
    this.stopBiometricMonitoring();

    // Calculate summary
    const duration = (Date.now() - this.workoutProgress.startTime.getTime()) / 1000 / 60; // minutes
    const summary = {
      workoutId: this.workoutProgress.workoutId,
      duration: Math.round(duration),
      exercisesCompleted: this.workoutProgress.completedExercises.length,
      averageHeartRate: Math.round(this.workoutProgress.averageHeartRate),
      maxHeartRate: this.workoutProgress.maxHeartRate,
      caloriesBurned: Math.round(this.workoutProgress.caloriesBurned),
      zoneMinutes: this.workoutProgress.zoneMinutes,
      biometricEvents: this.workoutProgress.biometricEvents
    };

    // Get AI insights
    const insights = await biometricAnalysis.getAIInsights(summary);

    // Voice summary
    await voiceService.speak(
      `Workout complete! You burned ${summary.caloriesBurned} calories ` +
      `with an average heart rate of ${summary.averageHeartRate}. ` +
      'Great job today!'
    );

    // Clean up
    this.currentWorkout = null;
    this.workoutProgress = null;

    return { summary, insights };
  }

  // Stop biometric monitoring
  private stopBiometricMonitoring(): void {
    this.isMonitoring = false;

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    if (this.biometricUnsubscribe) {
      this.biometricUnsubscribe();
      this.biometricUnsubscribe = null;
    }
  }

  // Update workout metrics
  private updateWorkoutMetrics(biometrics: BiometricData): void {
    if (!this.workoutProgress) return;

    // Update heart rate metrics
    if (biometrics.heart_rate) {
      // Update average (simple moving average)
      const totalSamples = Math.floor(
        (Date.now() - this.workoutProgress.startTime.getTime()) / 5000
      );
      this.workoutProgress.averageHeartRate = 
        (this.workoutProgress.averageHeartRate * (totalSamples - 1) + biometrics.heart_rate) / totalSamples;

      // Update max
      this.workoutProgress.maxHeartRate = Math.max(
        this.workoutProgress.maxHeartRate,
        biometrics.heart_rate
      );

      // Update zone minutes
      const zones = terraService.calculateHeartRateZones(30); // TODO: Use actual age
      const currentZone = zones.find(
        z => biometrics.heart_rate! >= z.min && biometrics.heart_rate! <= z.max
      );
      
      if (currentZone) {
        this.workoutProgress.zoneMinutes[currentZone.zone] = 
          (this.workoutProgress.zoneMinutes[currentZone.zone] || 0) + 5/60; // 5 seconds
      }
    }

    // Update calories
    if (biometrics.calories_burned) {
      this.workoutProgress.caloriesBurned = biometrics.calories_burned;
    }
  }

  // Add biometric event
  private addBiometricEvent(event: BiometricEvent): void {
    if (!this.workoutProgress) return;
    
    this.workoutProgress.biometricEvents.push(event);
    
    // Keep only last 20 events
    if (this.workoutProgress.biometricEvents.length > 20) {
      this.workoutProgress.biometricEvents.shift();
    }
  }

  // Calculate workout progress percentage
  private calculateWorkoutProgress(): number {
    if (!this.currentWorkout || !this.workoutProgress) return 0;

    const totalExercises = this.currentWorkout.exercises.length;
    const completedExercises = this.workoutProgress.completedExercises.length;
    
    const currentExercise = this.currentWorkout.exercises[this.workoutProgress.currentExerciseIndex];
    const currentExerciseProgress = this.workoutProgress.currentSetIndex / currentExercise.adaptedSets;

    return (completedExercises + currentExerciseProgress) / totalExercises;
  }

  // Get current workout status
  getCurrentWorkout(): BiometricWorkout | null {
    return this.currentWorkout;
  }

  // Get workout progress
  getWorkoutProgress(): WorkoutProgress | null {
    return this.workoutProgress;
  }

  // Create sample workouts
  static createSampleWorkouts(): BiometricWorkout[] {
    return [
      {
        id: 'strength-upper',
        name: 'Upper Body Strength',
        originalDuration: 45,
        adaptedDuration: 45,
        originalIntensity: 'moderate',
        adaptedIntensity: 'moderate',
        exercises: [
          {
            id: 'pushup',
            name: 'Push-ups',
            originalSets: 3,
            adaptedSets: 3,
            originalReps: 12,
            adaptedReps: 12,
            restBetweenSets: 60,
            targetHeartRateZone: 'fat_burn',
            alternatives: ['kneePushup', 'wallPushup']
          },
          {
            id: 'bicepCurl',
            name: 'Bicep Curls',
            originalSets: 3,
            adaptedSets: 3,
            originalReps: 12,
            adaptedReps: 12,
            originalWeight: 20,
            adaptedWeight: 20,
            restBetweenSets: 45,
            targetHeartRateZone: 'fat_burn',
            alternatives: ['hammerCurl', 'cableCurl']
          }
        ],
        restPeriods: [90],
        targetHeartRateZones: ['warmup', 'fat_burn']
      },
      {
        id: 'hiit-cardio',
        name: 'HIIT Cardio Blast',
        originalDuration: 20,
        adaptedDuration: 20,
        originalIntensity: 'high',
        adaptedIntensity: 'high',
        exercises: [
          {
            id: 'burpees',
            name: 'Burpees',
            originalSets: 4,
            adaptedSets: 4,
            originalReps: 10,
            adaptedReps: 10,
            restBetweenSets: 30,
            targetHeartRateZone: 'peak',
            alternatives: ['mountainClimbers', 'jumpingJacks']
          },
          {
            id: 'jumpingJacks',
            name: 'Jumping Jacks',
            originalSets: 4,
            adaptedSets: 4,
            originalReps: 30,
            adaptedReps: 30,
            restBetweenSets: 20,
            targetHeartRateZone: 'cardio',
            alternatives: ['highKnees', 'buttKicks']
          }
        ],
        restPeriods: [60],
        targetHeartRateZones: ['cardio', 'peak']
      }
    ];
  }

  // Cleanup
  dispose(): void {
    this.stopBiometricMonitoring();
    this.currentWorkout = null;
    this.workoutProgress = null;
  }
}

// Export singleton instance
export const biometricWorkout = new BiometricWorkoutService();