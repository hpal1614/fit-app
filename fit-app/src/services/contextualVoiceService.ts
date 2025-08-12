// Enhanced Voice Service with Contextual Memory
export interface WorkoutContext {
  currentExercise: {
    name: string;
    index: number;
    totalSets: number;
    completedSets: number;
  };
  currentSet: {
    weight: number;
    reps: number;
    rpe: number;
    setNumber: number;
  };
  previousSets: Array<{
    weight: number;
    reps: number;
    rpe: number;
    timestamp: Date;
  }>;
  exerciseHistory: Array<{
    weight: number;
    reps: number;
    rpe: number;
    date: Date;
  }>;
  workoutProgress: {
    totalExercises: number;
    currentExerciseIndex: number;
    overallProgress: number;
  };
  restTimer: {
    isRunning: boolean;
    timeRemaining: number;
  };
  personalRecords: {
    oneRepMax: number;
    bestSet: { weight: number; reps: number };
  };
  preferences: {
    defaultIncrement: number;
    targetRPE: number;
    preferredRestTime: number;
  };
}

export interface ConversationMemory {
  lastCommands: Array<{
    command: string;
    timestamp: Date;
    context: WorkoutContext;
  }>;
  sessionGoals: string[];
  userMentions: Map<string, any>; // Things user has mentioned
  adaptations: Map<string, any>; // Things we've learned about the user
}

class ContextualVoiceService {
  private recognition: any = null;
  private synthesis: SpeechSynthesis | null = null;
  private isListening = false;
  private isSupported = false;
  private wakeWordDetected = false;
  private lastProcessedTranscript = '';
  private processingTimeout: NodeJS.Timeout | null = null;

  // Contextual Memory
  private workoutContext: WorkoutContext | null = null;
  private conversationMemory: ConversationMemory = {
    lastCommands: [],
    sessionGoals: [],
    userMentions: new Map(),
    adaptations: new Map()
  };

  constructor() {
    this.initializeServices();
  }

  private initializeServices() {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      this.recognition = new SpeechRecognitionClass();
      this.isSupported = true;
    }

    if ('speechSynthesis' in window) {
      this.synthesis = window.speechSynthesis;
    }
  }

  // Update workout context (called from EnhancedWorkoutLogger)
  updateWorkoutContext(context: WorkoutContext) {
    this.workoutContext = context;
    console.log('🧠 Workout context updated:', context);
  }

  // Smart command processing with context
  private processContextualCommand(transcript: string): string {
    const command = transcript.toLowerCase().trim();
    
    // Remember this command
    if (this.workoutContext) {
      this.conversationMemory.lastCommands.push({
        command: transcript,
        timestamp: new Date(),
        context: { ...this.workoutContext }
      });

      // Keep only last 10 commands
      if (this.conversationMemory.lastCommands.length > 10) {
        this.conversationMemory.lastCommands.shift();
      }
    }

    // Contextual command interpretations
    if (!this.workoutContext) {
      return this.processBasicCommand(command);
    }

    const ctx = this.workoutContext;

    // RELATIVE COMMANDS (using context)
    if (command.includes('add') || command.includes('increase')) {
      const amount = this.extractNumber(command) || ctx.preferences.defaultIncrement;
      return `ADJUST_WEIGHT:${ctx.currentSet.weight + amount}`;
    }

    if (command.includes('reduce') || command.includes('decrease') || command.includes('lower')) {
      const amount = this.extractNumber(command) || ctx.preferences.defaultIncrement;
      return `ADJUST_WEIGHT:${ctx.currentSet.weight - amount}`;
    }

    // CONTEXTUAL REPS
    if (command.includes('same weight') || command.includes('keep weight')) {
      const reps = this.extractNumber(command);
      if (reps) {
        return `LOG_SET:${ctx.currentSet.weight}:${reps}`;
      }
      return `CONFIRM:Keeping weight at ${ctx.currentSet.weight} lbs`;
    }

    // SMART SUGGESTIONS BASED ON HISTORY
    if (command.includes('suggest') || command.includes('recommend')) {
      return this.generateSmartSuggestion();
    }

    // PROGRESS QUESTIONS
    if (command.includes('how') && (command.includes('doing') || command.includes('progress'))) {
      return this.generateProgressReport();
    }

    // COMPARISON QUESTIONS  
    if (command.includes('last time') || command.includes('previous')) {
      return this.compareWithHistory();
    }

    // PR QUESTIONS
    if (command.includes('personal record') || command.includes('best') || command.includes('max')) {
      return `REPORT:Your 1RM for ${ctx.currentExercise.name} is ${ctx.personalRecords.oneRepMax} lbs. Best set was ${ctx.personalRecords.bestSet.weight} × ${ctx.personalRecords.bestSet.reps}.`;
    }

    // REST TIMER CONTEXT
    if (command.includes('timer') || command.includes('rest')) {
      if (ctx.restTimer.isRunning) {
        return `REPORT:Rest timer running - ${ctx.restTimer.timeRemaining} seconds remaining.`;
      } else {
        return 'START_TIMER';
      }
    }

    // WORKOUT NAVIGATION
    if (command.includes('next')) {
      if (ctx.currentSet.setNumber >= ctx.currentExercise.totalSets) {
        return 'NEXT_EXERCISE';
      } else {
        return `REPORT:You have ${ctx.currentExercise.totalSets - ctx.currentSet.setNumber} sets left for ${ctx.currentExercise.name}.`;
      }
    }

    // EXERCISE STATUS
    if (command.includes('where') || command.includes('what exercise') || command.includes('current')) {
      return `REPORT:Exercise ${ctx.workoutProgress.currentExerciseIndex + 1} of ${ctx.workoutProgress.totalExercises}: ${ctx.currentExercise.name}. Set ${ctx.currentSet.setNumber} of ${ctx.currentExercise.totalSets}. Currently set to ${ctx.currentSet.weight} lbs × ${ctx.currentSet.reps} reps.`;
    }

    // FALLBACK TO BASIC PROCESSING
    return this.processBasicCommand(command);
  }

  private generateSmartSuggestion(): string {
    if (!this.workoutContext) return 'REPORT:No context available for suggestions.';

    const ctx = this.workoutContext;
    const lastSet = ctx.previousSets[ctx.previousSets.length - 1];

    if (!lastSet) {
      return `REPORT:Starting with ${ctx.currentSet.weight} lbs for ${ctx.currentSet.reps} reps.`;
    }

    // Smart suggestions based on last RPE
    if (lastSet.rpe <= 2) {
      const suggestedWeight = lastSet.weight + ctx.preferences.defaultIncrement;
      return `SUGGEST_WEIGHT:${suggestedWeight}:Last set was too easy (RPE ${lastSet.rpe}). Try ${suggestedWeight} lbs.`;
    } else if (lastSet.rpe >= 4) {
      const suggestedWeight = lastSet.weight - ctx.preferences.defaultIncrement;
      return `SUGGEST_WEIGHT:${suggestedWeight}:Last set was tough (RPE ${lastSet.rpe}). Try ${suggestedWeight} lbs.`;
    } else {
      return `REPORT:${lastSet.weight} lbs worked well last time (RPE ${lastSet.rpe}). Stick with it!`;
    }
  }

  private generateProgressReport(): string {
    if (!this.workoutContext) return 'REPORT:No workout data available.';

    const ctx = this.workoutContext;
    const progress = Math.round(ctx.workoutProgress.overallProgress);
    const setsCompleted = ctx.currentExercise.completedSets;
    const totalSets = ctx.currentExercise.totalSets;

    return `REPORT:Workout is ${progress}% complete. On ${ctx.currentExercise.name}: ${setsCompleted} of ${totalSets} sets done.`;
  }

  private compareWithHistory(): string {
    if (!this.workoutContext?.exerciseHistory.length) {
      return 'REPORT:No previous data available for comparison.';
    }

    const ctx = this.workoutContext;
    const lastWorkout = ctx.exerciseHistory[ctx.exerciseHistory.length - 1];
    const currentWeight = ctx.currentSet.weight;
    const currentReps = ctx.currentSet.reps;

    if (currentWeight > lastWorkout.weight) {
      return `REPORT:Great progress! You're up ${currentWeight - lastWorkout.weight} lbs from last time (${lastWorkout.weight} lbs).`;
    } else if (currentWeight === lastWorkout.weight && currentReps > lastWorkout.reps) {
      return `REPORT:Nice! Same weight but more reps than last time (${lastWorkout.reps} reps).`;
    } else {
      return `REPORT:Last time you did ${lastWorkout.weight} lbs × ${lastWorkout.reps} reps (RPE ${lastWorkout.rpe}).`;
    }
  }

  private processBasicCommand(command: string): string {
    // Weight commands
    const weightMatch = command.match(/(?:set|adjust|change).*?(?:weight.*?)?(\d+)/);
    if (weightMatch) {
      return `ADJUST_WEIGHT:${weightMatch[1]}`;
    }

    // Rep commands  
    const repsMatch = command.match(/(\d+)\s*reps?/);
    if (repsMatch) {
      return `ADJUST_REPS:${repsMatch[1]}`;
    }

    // Logging commands
    if (command.includes('log') || command.includes('done') || command.includes('complete')) {
      return 'LOG_SET';
    }

    // Timer commands
    if (command.includes('start') && command.includes('timer')) {
      return 'START_TIMER';
    }
    
    if (command.includes('stop') && command.includes('timer')) {
      return 'STOP_TIMER';
    }

    // Help
    if (command.includes('help')) {
      return 'HELP';
    }

    return `UNKNOWN:${command}`;
  }

  private extractNumber(text: string): number | null {
    const match = text.match(/\d+/);
    return match ? parseInt(match[0]) : null;
  }

  // Learning and adaptation
  private learnFromInteraction(command: string, success: boolean) {
    const key = command.toLowerCase().trim();
    
    if (success) {
      const currentCount = this.conversationMemory.adaptations.get(key) || 0;
      this.conversationMemory.adaptations.set(key, currentCount + 1);
    }

    // Learn user preferences
    if (command.includes('add') && this.extractNumber(command)) {
      const amount = this.extractNumber(command)!;
      this.conversationMemory.userMentions.set('preferred_increment', amount);
    }
  }

  // Enhanced processing with memory
  onResult(callback: (result: string, confidence: number) => void): void {
    if (!this.recognition) return;

    this.recognition.onresult = (event: any) => {
      const lastResult = event.results[event.results.length - 1];
      if (!lastResult) return;

      const transcript = lastResult[0].transcript.trim();
      const confidence = lastResult[0].confidence || 0.9;
      const isFinal = lastResult.isFinal;

      if (transcript === this.lastProcessedTranscript) return;

      if (isFinal || (confidence > 0.8 && this.detectWakeWord(transcript))) {
        if (!this.wakeWordDetected && this.detectWakeWord(transcript)) {
          this.wakeWordDetected = true;
          this.lastProcessedTranscript = transcript;
          callback('WAKE_WORD_DETECTED', confidence);
          return;
        }

        if (this.wakeWordDetected && !this.detectWakeWord(transcript)) {
          this.debounceProcessing(() => {
            this.lastProcessedTranscript = transcript;
            
            // Process with context
            const contextualResponse = this.processContextualCommand(transcript);
            console.log(`🧠 Contextual processing: "${transcript}" → "${contextualResponse}"`);
            
            callback(contextualResponse, confidence);
            this.wakeWordDetected = false;
          }, 500);
        }
      }
    };
  }

  private detectWakeWord(transcript: string): boolean {
    const lowerTranscript = transcript.toLowerCase().trim();
    return ['hey coach', 'coach'].some(word => lowerTranscript.includes(word));
  }

  private debounceProcessing(callback: () => void, delay: number = 1000) {
    if (this.processingTimeout) clearTimeout(this.processingTimeout);
    this.processingTimeout = setTimeout(callback, delay);
  }

  // Standard interface methods
  async startListening(): Promise<boolean> {
    if (!this.recognition || this.isListening) return false;
    try {
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';
      this.recognition.start();
      this.isListening = true;
      return true;
    } catch (error) {
      console.error('Failed to start voice recognition:', error);
      return false;
    }
  }

  stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
      this.wakeWordDetected = false;
    }
  }

  async speak(text: string): Promise<void> {
    if (!this.synthesis) return;
    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();
      this.synthesis!.speak(utterance);
    });
  }

  async initialize(): Promise<boolean> {
    return this.isSupported;
  }

  onStateChange(callback: (state: any) => void): void {
    this.onResult((transcript, confidence) => {
      if (transcript === 'WAKE_WORD_DETECTED') {
        callback({
          isListening: this.isListening,
          transcript: '',
          confidence,
          isSupported: this.isSupported,
          wakeWordActivated: true
        });
      } else {
        callback({
          isListening: this.isListening,
          transcript,
          confidence,
          isSupported: this.isSupported,
          wakeWordDetected: this.wakeWordDetected,
          contextualResponse: transcript // Pass the processed response
        });
      }
    });
  }

  onError(callback: (error: string) => void): void {
    if (!this.recognition) return;
    this.recognition.onerror = (event: any) => {
      console.error('🎤 Speech recognition error:', event.error);
      callback(event.error);
      this.wakeWordDetected = false;
      this.lastProcessedTranscript = '';
    };
  }

  destroy(): void {
    this.stopListening();
    if (this.processingTimeout) {
      clearTimeout(this.processingTimeout);
    }
  }

  isServiceSupported(): boolean {
    return this.isSupported;
  }

  getCurrentState() {
    return {
      isListening: this.isListening,
      isSupported: this.isSupported,
      wakeWordDetected: this.wakeWordDetected,
      hasContext: !!this.workoutContext
    };
  }

  // Get conversation memory for debugging
  getConversationMemory() {
    return this.conversationMemory;
  }
}

// Export singleton instance
export const getContextualVoiceService = () => new ContextualVoiceService();
