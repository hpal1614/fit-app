import * as poseDetection from '@tensorflow-models/pose-detection';
import '@mediapipe/pose';
import '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';

// Key point indices for MediaPipe Pose
export enum PoseKeypoint {
  NOSE = 0,
  LEFT_EYE_INNER = 1,
  LEFT_EYE = 2,
  LEFT_EYE_OUTER = 3,
  RIGHT_EYE_INNER = 4,
  RIGHT_EYE = 5,
  RIGHT_EYE_OUTER = 6,
  LEFT_EAR = 7,
  RIGHT_EAR = 8,
  MOUTH_LEFT = 9,
  MOUTH_RIGHT = 10,
  LEFT_SHOULDER = 11,
  RIGHT_SHOULDER = 12,
  LEFT_ELBOW = 13,
  RIGHT_ELBOW = 14,
  LEFT_WRIST = 15,
  RIGHT_WRIST = 16,
  LEFT_HIP = 17,
  RIGHT_HIP = 18,
  LEFT_KNEE = 19,
  RIGHT_KNEE = 20,
  LEFT_ANKLE = 21,
  RIGHT_ANKLE = 22,
  LEFT_HEEL = 23,
  RIGHT_HEEL = 24,
  LEFT_FOOT_INDEX = 25,
  RIGHT_FOOT_INDEX = 26
}

interface Keypoint {
  x: number;
  y: number;
  z?: number;
  score: number;
  name?: string;
}

interface Pose {
  keypoints: Keypoint[];
  score: number;
}

interface FormError {
  joint: string;
  error: string;
  severity: 'minor' | 'major' | 'critical';
  correction: string;
}

interface FormAnalysis {
  exercise: string;
  formScore: number;
  errors: FormError[];
  repCount: number;
  tempo: number;
  suggestions: string[];
}

export class PoseDetectionService {
  private detector: poseDetection.PoseDetector | null = null;
  private isInitialized = false;
  private currentExercise: string = '';
  private repCount = 0;
  private previousPose: Pose | null = null;
  private repPhase: 'eccentric' | 'concentric' | 'rest' = 'rest';
  private phaseStartTime = 0;
  private repTimes: number[] = [];
  
  // Exercise-specific angle thresholds
  private exerciseRules = {
    squat: {
      hipAngleMin: 70,
      hipAngleMax: 170,
      kneeAngleMin: 70,
      kneeAngleMax: 170,
      kneeOverToes: false,
      backAngleRange: [70, 110]
    },
    pushup: {
      elbowAngleMin: 70,
      elbowAngleMax: 170,
      shoulderAngleRange: [70, 110],
      hipAlignment: true,
      bodyAngleRange: [170, 190]
    },
    deadlift: {
      hipAngleMin: 45,
      hipAngleMax: 170,
      kneeAngleMin: 120,
      kneeAngleMax: 170,
      backAngleRange: [160, 180],
      shoulderOverBar: true
    },
    bicepCurl: {
      elbowAngleMin: 30,
      elbowAngleMax: 170,
      shoulderStability: true,
      wristAlignment: true
    },
    shoulderPress: {
      elbowAngleMin: 70,
      elbowAngleMax: 170,
      shoulderAngleMin: 70,
      shoulderAngleMax: 180,
      wristOverElbow: true
    }
  };

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Initialize TensorFlow.js backend
      await poseDetection.util.isMobile()
        ? await import('@tensorflow/tfjs-backend-webgl')
        : await import('@tensorflow/tfjs-backend-webgl');

      // Create pose detector with MediaPipe
      this.detector = await poseDetection.createDetector(
        poseDetection.SupportedModels.MediaPipePose,
        {
          runtime: 'mediapipe',
          modelType: 'heavy', // Use heavy model for best accuracy
          solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/pose',
          enableSmoothing: true,
          enableSegmentation: false,
          smoothSegmentation: false,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        }
      );

      this.isInitialized = true;
      console.log('Pose detection service initialized');
    } catch (error) {
      console.error('Failed to initialize pose detection:', error);
      throw error;
    }
  }

  async detectPose(imageSource: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement): Promise<Pose[]> {
    if (!this.detector) {
      throw new Error('Pose detector not initialized');
    }

    try {
      const poses = await this.detector.estimatePoses(imageSource, {
        flipHorizontal: false
      });

      return poses.map(pose => ({
        keypoints: pose.keypoints.map(kp => ({
          x: kp.x,
          y: kp.y,
          z: (kp as any).z || 0,
          score: kp.score || 0,
          name: kp.name
        })),
        score: (pose as any).score || this.calculatePoseScore(pose.keypoints)
      }));
    } catch (error) {
      console.error('Pose detection error:', error);
      return [];
    }
  }

  setCurrentExercise(exercise: string): void {
    this.currentExercise = exercise.toLowerCase();
    this.repCount = 0;
    this.repPhase = 'rest';
    this.repTimes = [];
  }

  async analyzeForm(pose: Pose): Promise<FormAnalysis> {
    if (!this.currentExercise || !this.exerciseRules[this.currentExercise]) {
      return {
        exercise: this.currentExercise,
        formScore: 0,
        errors: [],
        repCount: this.repCount,
        tempo: 0,
        suggestions: ['No exercise selected or rules not defined']
      };
    }

    const errors: FormError[] = [];
    const rules = this.exerciseRules[this.currentExercise];

    // Analyze based on exercise type
    switch (this.currentExercise) {
      case 'squat':
        errors.push(...this.analyzeSquatForm(pose, rules));
        break;
      case 'pushup':
        errors.push(...this.analyzePushupForm(pose, rules));
        break;
      case 'deadlift':
        errors.push(...this.analyzeDeadliftForm(pose, rules));
        break;
      case 'bicepCurl':
        errors.push(...this.analyzeBicepCurlForm(pose, rules));
        break;
      case 'shoulderPress':
        errors.push(...this.analyzeShoulderPressForm(pose, rules));
        break;
    }

    // Count reps
    this.updateRepCount(pose);

    // Calculate form score
    const formScore = this.calculateFormScore(errors);

    // Calculate tempo
    const tempo = this.calculateTempo();

    // Generate suggestions
    const suggestions = this.generateSuggestions(errors, tempo);

    return {
      exercise: this.currentExercise,
      formScore,
      errors,
      repCount: this.repCount,
      tempo,
      suggestions
    };
  }

  private analyzeSquatForm(pose: Pose, rules: any): FormError[] {
    const errors: FormError[] = [];
    const keypoints = pose.keypoints;

    // Calculate hip angle
    const hipAngle = this.calculateAngle(
      keypoints[PoseKeypoint.LEFT_SHOULDER],
      keypoints[PoseKeypoint.LEFT_HIP],
      keypoints[PoseKeypoint.LEFT_KNEE]
    );

    // Calculate knee angle
    const kneeAngle = this.calculateAngle(
      keypoints[PoseKeypoint.LEFT_HIP],
      keypoints[PoseKeypoint.LEFT_KNEE],
      keypoints[PoseKeypoint.LEFT_ANKLE]
    );

    // Check depth
    if (hipAngle > rules.hipAngleMin + 20) {
      errors.push({
        joint: 'Hip',
        error: 'Not going deep enough',
        severity: 'major',
        correction: 'Lower your hips below parallel'
      });
    }

    // Check knee position
    if (keypoints[PoseKeypoint.LEFT_KNEE].x > keypoints[PoseKeypoint.LEFT_FOOT_INDEX].x + 50) {
      errors.push({
        joint: 'Knee',
        error: 'Knees going too far forward',
        severity: 'major',
        correction: 'Push your hips back and keep knees behind toes'
      });
    }

    // Check back angle
    const backAngle = this.calculateBackAngle(pose);
    if (backAngle < rules.backAngleRange[0] || backAngle > rules.backAngleRange[1]) {
      errors.push({
        joint: 'Back',
        error: 'Back angle incorrect',
        severity: 'critical',
        correction: 'Keep your chest up and maintain neutral spine'
      });
    }

    // Check knee alignment
    const kneeDistance = Math.abs(
      keypoints[PoseKeypoint.LEFT_KNEE].x - keypoints[PoseKeypoint.RIGHT_KNEE].x
    );
    const shoulderDistance = Math.abs(
      keypoints[PoseKeypoint.LEFT_SHOULDER].x - keypoints[PoseKeypoint.RIGHT_SHOULDER].x
    );
    
    if (kneeDistance < shoulderDistance * 0.8) {
      errors.push({
        joint: 'Knee',
        error: 'Knees caving inward',
        severity: 'major',
        correction: 'Push your knees out in line with your toes'
      });
    }

    return errors;
  }

  private analyzePushupForm(pose: Pose, rules: any): FormError[] {
    const errors: FormError[] = [];
    const keypoints = pose.keypoints;

    // Calculate elbow angle
    const elbowAngle = this.calculateAngle(
      keypoints[PoseKeypoint.LEFT_SHOULDER],
      keypoints[PoseKeypoint.LEFT_ELBOW],
      keypoints[PoseKeypoint.LEFT_WRIST]
    );

    // Check elbow depth
    if (elbowAngle > rules.elbowAngleMin + 20) {
      errors.push({
        joint: 'Elbow',
        error: 'Not going low enough',
        severity: 'major',
        correction: 'Lower your chest closer to the ground'
      });
    }

    // Check body alignment
    const bodyAngle = this.calculateAngle(
      keypoints[PoseKeypoint.LEFT_SHOULDER],
      keypoints[PoseKeypoint.LEFT_HIP],
      keypoints[PoseKeypoint.LEFT_ANKLE]
    );

    if (bodyAngle < rules.bodyAngleRange[0] || bodyAngle > rules.bodyAngleRange[1]) {
      errors.push({
        joint: 'Core',
        error: 'Body not in straight line',
        severity: 'major',
        correction: 'Engage your core and keep body straight'
      });
    }

    // Check hand position
    const handWidth = Math.abs(
      keypoints[PoseKeypoint.LEFT_WRIST].x - keypoints[PoseKeypoint.RIGHT_WRIST].x
    );
    const shoulderWidth = Math.abs(
      keypoints[PoseKeypoint.LEFT_SHOULDER].x - keypoints[PoseKeypoint.RIGHT_SHOULDER].x
    );

    if (handWidth < shoulderWidth * 1.2) {
      errors.push({
        joint: 'Hand',
        error: 'Hands too narrow',
        severity: 'minor',
        correction: 'Place hands slightly wider than shoulders'
      });
    }

    return errors;
  }

  private analyzeDeadliftForm(pose: Pose, rules: any): FormError[] {
    const errors: FormError[] = [];
    const keypoints = pose.keypoints;

    // Check back angle (should be relatively straight)
    const backAngle = this.calculateBackAngle(pose);
    if (backAngle < rules.backAngleRange[0]) {
      errors.push({
        joint: 'Back',
        error: 'Back is rounded',
        severity: 'critical',
        correction: 'Keep your back straight and chest up'
      });
    }

    // Check hip hinge
    const hipAngle = this.calculateAngle(
      keypoints[PoseKeypoint.LEFT_SHOULDER],
      keypoints[PoseKeypoint.LEFT_HIP],
      keypoints[PoseKeypoint.LEFT_KNEE]
    );

    if (hipAngle > rules.hipAngleMax - 20) {
      errors.push({
        joint: 'Hip',
        error: 'Not hinging at hips enough',
        severity: 'major',
        correction: 'Push your hips back more'
      });
    }

    // Check shoulder position
    if (rules.shoulderOverBar) {
      const shoulderX = keypoints[PoseKeypoint.LEFT_SHOULDER].x;
      const handX = keypoints[PoseKeypoint.LEFT_WRIST].x;
      
      if (Math.abs(shoulderX - handX) > 50) {
        errors.push({
          joint: 'Shoulder',
          error: 'Shoulders not over the bar',
          severity: 'major',
          correction: 'Keep shoulders directly over or slightly in front of the bar'
        });
      }
    }

    return errors;
  }

  private analyzeBicepCurlForm(pose: Pose, rules: any): FormError[] {
    const errors: FormError[] = [];
    const keypoints = pose.keypoints;

    // Check elbow angle
    const elbowAngle = this.calculateAngle(
      keypoints[PoseKeypoint.LEFT_SHOULDER],
      keypoints[PoseKeypoint.LEFT_ELBOW],
      keypoints[PoseKeypoint.LEFT_WRIST]
    );

    // Check for full range of motion
    if (this.repPhase === 'concentric' && elbowAngle > rules.elbowAngleMin + 10) {
      errors.push({
        joint: 'Elbow',
        error: 'Not curling all the way up',
        severity: 'minor',
        correction: 'Bring the weight closer to your shoulders'
      });
    }

    // Check shoulder stability
    if (rules.shoulderStability) {
      const shoulderMovement = this.calculateJointMovement(
        keypoints[PoseKeypoint.LEFT_SHOULDER],
        this.previousPose?.keypoints[PoseKeypoint.LEFT_SHOULDER]
      );
      
      if (shoulderMovement > 30) {
        errors.push({
          joint: 'Shoulder',
          error: 'Using momentum/swinging',
          severity: 'major',
          correction: 'Keep your elbows locked at your sides'
        });
      }
    }

    // Check wrist alignment
    if (rules.wristAlignment) {
      const wristAngle = this.calculateWristAngle(pose);
      if (wristAngle < 150 || wristAngle > 210) {
        errors.push({
          joint: 'Wrist',
          error: 'Wrists are bent',
          severity: 'minor',
          correction: 'Keep wrists straight and neutral'
        });
      }
    }

    return errors;
  }

  private analyzeShoulderPressForm(pose: Pose, rules: any): FormError[] {
    const errors: FormError[] = [];
    const keypoints = pose.keypoints;

    // Check elbow angle
    const elbowAngle = this.calculateAngle(
      keypoints[PoseKeypoint.LEFT_SHOULDER],
      keypoints[PoseKeypoint.LEFT_ELBOW],
      keypoints[PoseKeypoint.LEFT_WRIST]
    );

    // Check shoulder angle
    const shoulderAngle = this.calculateAngle(
      keypoints[PoseKeypoint.LEFT_HIP],
      keypoints[PoseKeypoint.LEFT_SHOULDER],
      keypoints[PoseKeypoint.LEFT_ELBOW]
    );

    // Check for full extension
    if (this.repPhase === 'concentric' && elbowAngle < rules.elbowAngleMax - 10) {
      errors.push({
        joint: 'Elbow',
        error: 'Not fully extending arms',
        severity: 'minor',
        correction: 'Press all the way up until arms are straight'
      });
    }

    // Check wrist over elbow alignment
    if (rules.wristOverElbow) {
      const wristX = keypoints[PoseKeypoint.LEFT_WRIST].x;
      const elbowX = keypoints[PoseKeypoint.LEFT_ELBOW].x;
      
      if (Math.abs(wristX - elbowX) > 30) {
        errors.push({
          joint: 'Wrist',
          error: 'Wrists not aligned over elbows',
          severity: 'major',
          correction: 'Keep wrists directly over your elbows'
        });
      }
    }

    // Check for excessive back arch
    const backAngle = this.calculateBackAngle(pose);
    if (backAngle < 160) {
      errors.push({
        joint: 'Back',
        error: 'Excessive back arch',
        severity: 'major',
        correction: 'Engage your core and avoid arching your back'
      });
    }

    return errors;
  }

  private updateRepCount(pose: Pose): void {
    if (!this.previousPose) {
      this.previousPose = pose;
      return;
    }

    // Calculate primary joint angle based on exercise
    let currentAngle = 0;
    let previousAngle = 0;

    switch (this.currentExercise) {
      case 'squat':
      case 'deadlift':
        currentAngle = this.calculateAngle(
          pose.keypoints[PoseKeypoint.LEFT_SHOULDER],
          pose.keypoints[PoseKeypoint.LEFT_HIP],
          pose.keypoints[PoseKeypoint.LEFT_KNEE]
        );
        previousAngle = this.calculateAngle(
          this.previousPose.keypoints[PoseKeypoint.LEFT_SHOULDER],
          this.previousPose.keypoints[PoseKeypoint.LEFT_HIP],
          this.previousPose.keypoints[PoseKeypoint.LEFT_KNEE]
        );
        break;
      
      case 'pushup':
      case 'bicepCurl':
      case 'shoulderPress':
        currentAngle = this.calculateAngle(
          pose.keypoints[PoseKeypoint.LEFT_SHOULDER],
          pose.keypoints[PoseKeypoint.LEFT_ELBOW],
          pose.keypoints[PoseKeypoint.LEFT_WRIST]
        );
        previousAngle = this.calculateAngle(
          this.previousPose.keypoints[PoseKeypoint.LEFT_SHOULDER],
          this.previousPose.keypoints[PoseKeypoint.LEFT_ELBOW],
          this.previousPose.keypoints[PoseKeypoint.LEFT_WRIST]
        );
        break;
    }

    // Detect rep phases
    const angleChange = currentAngle - previousAngle;
    const threshold = 10; // degrees

    if (this.repPhase === 'rest' && Math.abs(angleChange) > threshold) {
      this.repPhase = angleChange > 0 ? 'eccentric' : 'concentric';
      this.phaseStartTime = Date.now();
    } else if (this.repPhase === 'eccentric' && angleChange < -threshold) {
      this.repPhase = 'concentric';
    } else if (this.repPhase === 'concentric' && angleChange > threshold) {
      // Rep completed
      this.repCount++;
      this.repPhase = 'eccentric';
      
      // Record rep time
      const repTime = Date.now() - this.phaseStartTime;
      this.repTimes.push(repTime);
      
      // Keep only last 10 rep times
      if (this.repTimes.length > 10) {
        this.repTimes.shift();
      }
    }

    this.previousPose = pose;
  }

  private calculateAngle(a: Keypoint, b: Keypoint, c: Keypoint): number {
    const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
    let angle = Math.abs(radians * 180 / Math.PI);
    if (angle > 180) {
      angle = 360 - angle;
    }
    return angle;
  }

  private calculateBackAngle(pose: Pose): number {
    const keypoints = pose.keypoints;
    
    // Calculate angle between neck, mid-back, and hip
    const neck = {
      x: (keypoints[PoseKeypoint.LEFT_SHOULDER].x + keypoints[PoseKeypoint.RIGHT_SHOULDER].x) / 2,
      y: (keypoints[PoseKeypoint.LEFT_SHOULDER].y + keypoints[PoseKeypoint.RIGHT_SHOULDER].y) / 2,
      score: 1
    };
    
    const midBack = {
      x: (keypoints[PoseKeypoint.LEFT_SHOULDER].x + keypoints[PoseKeypoint.LEFT_HIP].x) / 2,
      y: (keypoints[PoseKeypoint.LEFT_SHOULDER].y + keypoints[PoseKeypoint.LEFT_HIP].y) / 2,
      score: 1
    };
    
    const hip = {
      x: (keypoints[PoseKeypoint.LEFT_HIP].x + keypoints[PoseKeypoint.RIGHT_HIP].x) / 2,
      y: (keypoints[PoseKeypoint.LEFT_HIP].y + keypoints[PoseKeypoint.RIGHT_HIP].y) / 2,
      score: 1
    };
    
    return this.calculateAngle(neck, midBack, hip);
  }

  private calculateWristAngle(pose: Pose): number {
    const keypoints = pose.keypoints;
    
    // Create a virtual point for forearm direction
    const forearmPoint = {
      x: keypoints[PoseKeypoint.LEFT_ELBOW].x + 
         (keypoints[PoseKeypoint.LEFT_ELBOW].x - keypoints[PoseKeypoint.LEFT_SHOULDER].x),
      y: keypoints[PoseKeypoint.LEFT_ELBOW].y + 
         (keypoints[PoseKeypoint.LEFT_ELBOW].y - keypoints[PoseKeypoint.LEFT_SHOULDER].y),
      score: 1
    };
    
    return this.calculateAngle(
      keypoints[PoseKeypoint.LEFT_ELBOW],
      keypoints[PoseKeypoint.LEFT_WRIST],
      forearmPoint
    );
  }

  private calculateJointMovement(current?: Keypoint, previous?: Keypoint): number {
    if (!current || !previous) return 0;
    
    const dx = current.x - previous.x;
    const dy = current.y - previous.y;
    
    return Math.sqrt(dx * dx + dy * dy);
  }

  private calculateFormScore(errors: FormError[]): number {
    let score = 100;
    
    errors.forEach(error => {
      switch (error.severity) {
        case 'minor':
          score -= 5;
          break;
        case 'major':
          score -= 15;
          break;
        case 'critical':
          score -= 25;
          break;
      }
    });
    
    return Math.max(0, score);
  }

  private calculateTempo(): number {
    if (this.repTimes.length < 2) return 0;
    
    const avgRepTime = this.repTimes.reduce((a, b) => a + b, 0) / this.repTimes.length;
    return Math.round(avgRepTime / 1000); // Convert to seconds
  }

  private generateSuggestions(errors: FormError[], tempo: number): string[] {
    const suggestions: string[] = [];
    
    // Add form corrections
    const criticalErrors = errors.filter(e => e.severity === 'critical');
    const majorErrors = errors.filter(e => e.severity === 'major');
    
    if (criticalErrors.length > 0) {
      suggestions.push(`⚠️ Critical: ${criticalErrors[0].correction}`);
    }
    
    if (majorErrors.length > 0 && suggestions.length < 3) {
      suggestions.push(`⚡ Important: ${majorErrors[0].correction}`);
    }
    
    // Add tempo feedback
    if (tempo > 0) {
      if (tempo < 2) {
        suggestions.push('💨 Slow down your reps for better control');
      } else if (tempo > 5) {
        suggestions.push('🚀 Speed up your tempo slightly');
      }
    }
    
    // Add encouragement if form is good
    if (errors.length === 0) {
      suggestions.push('💪 Perfect form! Keep it up!');
    }
    
    return suggestions.slice(0, 3);
  }

  private calculatePoseScore(keypoints: poseDetection.Keypoint[]): number {
    const scores = keypoints.map(kp => kp.score || 0);
    return scores.reduce((a, b) => a + b, 0) / scores.length;
  }

  getRepCount(): number {
    return this.repCount;
  }

  resetRepCount(): void {
    this.repCount = 0;
    this.repPhase = 'rest';
    this.repTimes = [];
  }

  dispose(): void {
    if (this.detector) {
      this.detector.dispose();
      this.detector = null;
    }
    this.isInitialized = false;
  }
}

// Export singleton instance
export const poseDetection = new PoseDetectionService();