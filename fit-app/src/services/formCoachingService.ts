import { poseDetection } from './poseDetectionService';
import { cameraService } from './cameraService';
import { voiceService } from './voiceService';
import { emotionalVoice } from './emotionalVoice';
import { aiService } from './enhancedAIService';

interface CoachingConfig {
  voiceEnabled: boolean;
  visualEnabled: boolean;
  feedbackDelay: number;
  strictnessLevel: 'beginner' | 'intermediate' | 'advanced';
}

interface CoachingSession {
  exercise: string;
  startTime: number;
  totalReps: number;
  formScores: number[];
  corrections: string[];
  improvements: string[];
}

interface VoiceFeedback {
  message: string;
  priority: 'immediate' | 'normal' | 'encouragement';
  emotion: 'calm' | 'encouraging' | 'urgent';
}

export class FormCoachingService {
  private config: CoachingConfig = {
    voiceEnabled: true,
    visualEnabled: true,
    feedbackDelay: 3000, // 3 seconds between voice feedbacks
    strictnessLevel: 'intermediate'
  };

  private currentSession: CoachingSession | null = null;
  private lastFeedbackTime = 0;
  private feedbackQueue: VoiceFeedback[] = [];
  private isProcessingFeedback = false;
  private previousFormScore = 100;
  private consecutiveGoodReps = 0;
  private lastCorrection: string = '';
  private correctionCount: Map<string, number> = new Map();

  // Feedback templates
  private feedbackTemplates = {
    formImprovement: [
      "Great adjustment! Your form is looking better.",
      "That's it! Keep that form going.",
      "Excellent correction! You're getting it.",
      "Perfect! That's exactly what we're looking for."
    ],
    formDecline: [
      "Let's refocus on your form.",
      "Remember to maintain proper technique.",
      "Don't let your form slip - quality over quantity.",
      "Focus on control through the entire movement."
    ],
    encouragement: [
      "You're doing great! Keep it up!",
      "Strong work! Stay focused.",
      "Excellent effort! You've got this.",
      "Looking strong! Keep pushing."
    ],
    repCount: [
      "That's {count} reps! Nice work!",
      "{count} down! Keep that rhythm.",
      "Rep {count} complete! Maintain that form.",
      "{count} solid reps! You're crushing it!"
    ],
    finalPush: [
      "Last few reps! Make them count!",
      "Almost there! Finish strong!",
      "Final push! Give it everything!",
      "Home stretch! Perfect form to the end!"
    ]
  };

  async startSession(exercise: string): Promise<void> {
    // Initialize services
    await poseDetection.initialize();
    poseDetection.setCurrentExercise(exercise);

    // Set emotional tone based on exercise intensity
    const intensity = this.getExerciseIntensity(exercise);
    if (this.config.voiceEnabled) {
      await voiceService.setEmotionalTone(intensity);
    }

    this.currentSession = {
      exercise,
      startTime: Date.now(),
      totalReps: 0,
      formScores: [],
      corrections: [],
      improvements: []
    };

    this.correctionCount.clear();
    this.consecutiveGoodReps = 0;

    // Initial greeting
    this.queueFeedback({
      message: `Let's work on your ${exercise}. I'll help you maintain perfect form throughout.`,
      priority: 'normal',
      emotion: 'encouraging'
    });
  }

  async processFrame(canvas: HTMLCanvasElement): Promise<any> {
    if (!this.currentSession) return null;

    try {
      // Detect poses
      const poses = await poseDetection.detectPose(canvas);
      
      if (poses.length === 0) {
        return null;
      }

      const pose = poses[0];
      
      // Analyze form
      const formAnalysis = await poseDetection.analyzeForm(pose);
      
      // Update session stats
      this.currentSession.formScores.push(formAnalysis.formScore);
      
      // Process rep count changes
      if (formAnalysis.repCount > this.currentSession.totalReps) {
        this.currentSession.totalReps = formAnalysis.repCount;
        this.handleNewRep(formAnalysis);
      }

      // Provide form feedback
      this.analyzeAndProvideFeedback(formAnalysis);

      // Process voice feedback queue
      this.processVoiceFeedbackQueue();

      return { pose, formAnalysis };
    } catch (error) {
      console.error('Form coaching error:', error);
      return null;
    }
  }

  private analyzeAndProvideFeedback(formAnalysis: any): void {
    const currentTime = Date.now();
    
    // Don't provide feedback too frequently
    if (currentTime - this.lastFeedbackTime < this.config.feedbackDelay) {
      return;
    }

    // Check for critical errors that need immediate feedback
    const criticalErrors = formAnalysis.errors.filter((e: any) => e.severity === 'critical');
    if (criticalErrors.length > 0) {
      const error = criticalErrors[0];
      
      // Track how many times we've given this correction
      const correctionKey = `${error.joint}-${error.error}`;
      const count = (this.correctionCount.get(correctionKey) || 0) + 1;
      this.correctionCount.set(correctionKey, count);

      // Vary the feedback based on repetition
      let message = error.correction;
      if (count > 2) {
        message = `Really focus on this: ${error.correction}`;
      } else if (count > 4) {
        message = `Let's pause and reset. ${error.correction}`;
      }

      this.queueFeedback({
        message,
        priority: 'immediate',
        emotion: 'urgent'
      });

      this.lastCorrection = correctionKey;
      this.lastFeedbackTime = currentTime;
      return;
    }

    // Check for form improvements
    if (formAnalysis.formScore > this.previousFormScore + 10) {
      const improvement = this.feedbackTemplates.formImprovement[
        Math.floor(Math.random() * this.feedbackTemplates.formImprovement.length)
      ];
      
      this.queueFeedback({
        message: improvement,
        priority: 'normal',
        emotion: 'encouraging'
      });

      this.lastFeedbackTime = currentTime;
      this.currentSession?.improvements.push(improvement);
    }

    // Check for form decline
    else if (formAnalysis.formScore < this.previousFormScore - 15) {
      const decline = this.feedbackTemplates.formDecline[
        Math.floor(Math.random() * this.feedbackTemplates.formDecline.length)
      ];
      
      this.queueFeedback({
        message: decline,
        priority: 'normal',
        emotion: 'calm'
      });

      this.lastFeedbackTime = currentTime;
    }

    // Provide encouragement for consistent good form
    else if (formAnalysis.formScore >= 80) {
      this.consecutiveGoodReps++;
      
      if (this.consecutiveGoodReps % 5 === 0) {
        const encouragement = this.feedbackTemplates.encouragement[
          Math.floor(Math.random() * this.feedbackTemplates.encouragement.length)
        ];
        
        this.queueFeedback({
          message: encouragement,
          priority: 'encouragement',
          emotion: 'encouraging'
        });

        this.lastFeedbackTime = currentTime;
      }
    } else {
      this.consecutiveGoodReps = 0;
    }

    // Tempo feedback
    if (formAnalysis.tempo > 0) {
      if (formAnalysis.tempo < 2 && Math.random() < 0.1) {
        this.queueFeedback({
          message: "Slow down your tempo for better muscle engagement.",
          priority: 'normal',
          emotion: 'calm'
        });
        this.lastFeedbackTime = currentTime;
      } else if (formAnalysis.tempo > 5 && Math.random() < 0.1) {
        this.queueFeedback({
          message: "Try to maintain a more controlled tempo.",
          priority: 'normal',
          emotion: 'calm'
        });
        this.lastFeedbackTime = currentTime;
      }
    }

    this.previousFormScore = formAnalysis.formScore;
  }

  private handleNewRep(formAnalysis: any): void {
    const repCount = formAnalysis.repCount;
    
    // Rep milestone feedback
    if (repCount % 5 === 0 && repCount > 0) {
      const template = this.feedbackTemplates.repCount[
        Math.floor(Math.random() * this.feedbackTemplates.repCount.length)
      ];
      const message = template.replace('{count}', repCount.toString());
      
      this.queueFeedback({
        message,
        priority: 'normal',
        emotion: 'encouraging'
      });
    }

    // Final push encouragement
    const targetReps = this.getTargetReps(this.currentSession!.exercise);
    if (repCount >= targetReps - 3 && repCount < targetReps) {
      const finalPush = this.feedbackTemplates.finalPush[
        Math.floor(Math.random() * this.feedbackTemplates.finalPush.length)
      ];
      
      this.queueFeedback({
        message: finalPush,
        priority: 'normal',
        emotion: 'encouraging'
      });
    }

    // Form feedback on each rep
    if (formAnalysis.formScore < 70) {
      this.currentSession?.corrections.push(
        `Rep ${repCount}: ${formAnalysis.errors[0]?.correction || 'Focus on form'}`
      );
    }
  }

  private queueFeedback(feedback: VoiceFeedback): void {
    // Remove any existing feedback of lower priority
    if (feedback.priority === 'immediate') {
      this.feedbackQueue = this.feedbackQueue.filter(f => f.priority === 'immediate');
    }

    this.feedbackQueue.push(feedback);
  }

  private async processVoiceFeedbackQueue(): Promise<void> {
    if (!this.config.voiceEnabled || this.isProcessingFeedback || this.feedbackQueue.length === 0) {
      return;
    }

    // Sort by priority
    this.feedbackQueue.sort((a, b) => {
      const priorityOrder = { immediate: 0, normal: 1, encouragement: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    const feedback = this.feedbackQueue.shift()!;
    this.isProcessingFeedback = true;

    try {
      // Set emotional tone
      const workoutIntensity = this.mapEmotionToIntensity(feedback.emotion);
      await emotionalVoice.adaptToWorkoutContext({
        intensity: workoutIntensity,
        exerciseType: this.currentSession?.exercise
      });

      // Speak the feedback
      await voiceService.speak(feedback.message);
    } catch (error) {
      console.error('Voice feedback error:', error);
    } finally {
      this.isProcessingFeedback = false;
    }
  }

  private getExerciseIntensity(exercise: string): 'low' | 'medium' | 'high' {
    const highIntensity = ['burpees', 'jumpingJacks', 'mountainClimbers', 'boxJumps'];
    const lowIntensity = ['plank', 'yoga', 'stretching', 'cooldown'];
    
    if (highIntensity.includes(exercise)) return 'high';
    if (lowIntensity.includes(exercise)) return 'low';
    return 'medium';
  }

  private mapEmotionToIntensity(emotion: string): 'low' | 'medium' | 'high' {
    switch (emotion) {
      case 'urgent': return 'high';
      case 'encouraging': return 'medium';
      case 'calm': return 'low';
      default: return 'medium';
    }
  }

  private getTargetReps(exercise: string): number {
    // Default target reps based on exercise type
    const targets: { [key: string]: number } = {
      squat: 12,
      pushup: 10,
      deadlift: 8,
      bicepCurl: 12,
      shoulderPress: 10,
      plank: 1, // For time-based exercises
      default: 10
    };

    return targets[exercise] || targets.default;
  }

  async endSession(): Promise<any> {
    if (!this.currentSession) return null;

    const duration = Date.now() - this.currentSession.startTime;
    const avgFormScore = this.currentSession.formScores.length > 0
      ? this.currentSession.formScores.reduce((a, b) => a + b, 0) / this.currentSession.formScores.length
      : 0;

    const summary = {
      exercise: this.currentSession.exercise,
      duration: Math.round(duration / 1000), // seconds
      totalReps: this.currentSession.totalReps,
      avgFormScore: Math.round(avgFormScore),
      corrections: this.currentSession.corrections,
      improvements: this.currentSession.improvements,
      topIssues: this.getTopIssues()
    };

    // Provide session summary
    const summaryMessage = this.generateSessionSummary(summary);
    
    this.queueFeedback({
      message: summaryMessage,
      priority: 'normal',
      emotion: 'calm'
    });

    // Process remaining feedback
    await this.processVoiceFeedbackQueue();

    // Get AI insights
    const aiInsights = await this.getAIInsights(summary);

    this.currentSession = null;
    this.correctionCount.clear();

    return { ...summary, aiInsights };
  }

  private getTopIssues(): string[] {
    const issues = Array.from(this.correctionCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([issue, _count]) => {
        const [joint, error] = issue.split('-');
        return `${joint}: ${error}`;
      });

    return issues;
  }

  private generateSessionSummary(summary: any): string {
    let message = `Great workout! You completed ${summary.totalReps} reps with an average form score of ${summary.avgFormScore}%. `;

    if (summary.avgFormScore >= 80) {
      message += "Excellent form throughout! ";
    } else if (summary.avgFormScore >= 60) {
      message += "Good effort with room for improvement. ";
    } else {
      message += "Let's work on your form in the next session. ";
    }

    if (summary.topIssues.length > 0) {
      message += `Focus areas for next time: ${summary.topIssues[0]}.`;
    }

    return message;
  }

  private async getAIInsights(summary: any): Promise<string> {
    try {
      const prompt = `Based on this workout session:
        - Exercise: ${summary.exercise}
        - Reps: ${summary.totalReps}
        - Average Form Score: ${summary.avgFormScore}%
        - Main issues: ${summary.topIssues.join(', ')}
        
        Provide 2-3 specific tips to improve form for next time.`;

      const response = await aiService.sendMessage(prompt);
      return response.message;
    } catch (error) {
      console.error('AI insights error:', error);
      return 'Keep practicing and focus on maintaining proper form throughout each rep.';
    }
  }

  setConfig(config: Partial<CoachingConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): CoachingConfig {
    return { ...this.config };
  }

  getCurrentSession(): CoachingSession | null {
    return this.currentSession;
  }

  dispose(): void {
    this.currentSession = null;
    this.feedbackQueue = [];
    this.correctionCount.clear();
  }
}

// Export singleton instance
export const formCoaching = new FormCoachingService();