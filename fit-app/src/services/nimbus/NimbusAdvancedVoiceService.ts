/**
 * Nimbus Advanced Voice Service
 * OpenAI Realtime API-level voice experience with hands-free workout logging
 */

export interface NimbusVoiceState {
  isListening: boolean;
  isSpeaking: boolean;
  isProcessing: boolean;
  isInterrupted: boolean;
  mode: 'idle' | 'continuous' | 'push_to_talk' | 'workout_mode';
  confidence: number;
  transcript: string;
  finalTranscript: string;
  waveformData: NimbusWaveformData | null;
  emotionalTone: NimbusEmotionalTone;
  workoutContext: NimbusWorkoutContext | null;
}

export interface NimbusWaveformData {
  frequencies: Float32Array;
  volumes: Float32Array;
  peak: number;
  average: number;
  noiseLevel: number;
  voiceActivity: boolean;
}

export type NimbusEmotionalTone = 'neutral' | 'encouraging' | 'motivational' | 'calm' | 'celebratory' | 'corrective';

export interface NimbusWorkoutContext {
  isActive: boolean;
  currentExercise?: string;
  currentSet?: number;
  totalSets?: number;
  restTimeRemaining?: number;
  intensity: 'warm_up' | 'working' | 'rest' | 'cool_down';
  lastPerformance?: {
    weight: number;
    reps: number;
    difficulty: 1 | 2 | 3 | 4 | 5;
  };
}

export interface NimbusVoiceConfig {
  continuous?: boolean;
  voiceActivityThreshold?: number;
  noiseReduction?: boolean;
  emotionalAdaptation?: boolean;
  language?: string;
  maxAlternatives?: number;
}

export class NimbusAdvancedVoiceService {
  private recognition: any = null;
  private synthesis: SpeechSynthesis;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private microphone: MediaStreamAudioSourceNode | null = null;
  private state: NimbusVoiceState;
  private eventEmitter: EventTarget;
  private silenceTimer: number | null = null;
  private waveformUpdateInterval: number | null = null;
  private voiceActivityThreshold = 0.01;
  private noiseReductionEnabled = true;
  private interruptionEnabled = true;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private config: NimbusVoiceConfig;

  constructor(config: NimbusVoiceConfig = {}) {
    this.synthesis = window.speechSynthesis;
    this.eventEmitter = new EventTarget();
    this.config = config;
    this.state = {
      isListening: false,
      isSpeaking: false,
      isProcessing: false,
      isInterrupted: false,
      mode: 'idle',
      confidence: 0,
      transcript: '',
      finalTranscript: '',
      waveformData: null,
      emotionalTone: 'neutral',
      workoutContext: null
    };
    
    this.initialize(config);
  }

  private async initialize(config: NimbusVoiceConfig): Promise<void> {
    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      this.recognition = new SpeechRecognitionAPI();
      this.setupSpeechRecognition();
    } else {
      console.warn('Speech recognition not supported in this browser');
    }

    // Initialize Web Audio API for waveform visualization
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      await this.setupAudioAnalysis();
    } catch (error) {
      console.warn('Web Audio API not available:', error);
    }

    this.applyConfig(config);
  }

  private setupSpeechRecognition(): void {
    if (!this.recognition) return;

    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.maxAlternatives = this.config.maxAlternatives || 3;
    this.recognition.lang = this.config.language || 'en-AU'; // Australian English for better accent recognition

    this.recognition.onstart = () => {
      this.state.isListening = true;
      this.emit('stateChange', this.state);
      this.emit('listeningStarted');
    };

    this.recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      this.state.transcript = interimTranscript;
      this.state.finalTranscript = finalTranscript;
      this.state.confidence = event.results[0]?.confidence || 0;

      this.emit('transcript', {
        transcript: interimTranscript,
        finalTranscript,
        confidence: this.state.confidence
      });

      // Process final transcript for workout logging
      if (finalTranscript.trim()) {
        this.processFinalTranscript(finalTranscript.trim());
      }

      this.resetSilenceTimer();
    };

    this.recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      this.emit('error', { type: 'recognition_error', message: event.error });
      
      // Auto-restart on network error
      if (event.error === 'network' && this.state.mode === 'continuous') {
        setTimeout(() => this.startContinuousListening(), 1000);
      }
    };

    this.recognition.onend = () => {
      this.state.isListening = false;
      this.emit('stateChange', this.state);
      
      // Auto-restart for continuous mode
      if (this.state.mode === 'continuous') {
        setTimeout(() => this.recognition?.start(), 100);
      }
    };
  }

  private async setupAudioAnalysis(): Promise<void> {
    if (!this.audioContext) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.microphone = this.audioContext.createMediaStreamSource(stream);
      this.analyser = this.audioContext.createAnalyser();
      
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.3;
      
      this.microphone.connect(this.analyser);
      this.startWaveformUpdates();
    } catch (error) {
      console.error('Microphone access denied:', error);
      throw new Error('Microphone permission required for voice features');
    }
  }

  private startWaveformUpdates(): void {
    if (!this.analyser) return;

    const updateWaveform = () => {
      const frequencies = new Float32Array(this.analyser!.frequencyBinCount);
      const volumes = new Float32Array(this.analyser!.frequencyBinCount);
      
      this.analyser!.getFloatFrequencyData(frequencies);
      this.analyser!.getFloatTimeDomainData(volumes);

      // Calculate audio metrics
      let sum = 0;
      let peak = 0;
      let voiceActivity = false;

      for (let i = 0; i < volumes.length; i++) {
        const volume = Math.abs(volumes[i]);
        sum += volume;
        peak = Math.max(peak, volume);
        
        if (volume > this.voiceActivityThreshold) {
          voiceActivity = true;
        }
      }

      const average = sum / volumes.length;
      const noiseLevel = this.calculateNoiseLevel(frequencies);

      this.state.waveformData = {
        frequencies,
        volumes,
        peak,
        average,
        noiseLevel,
        voiceActivity
      };

      this.emit('waveformUpdate', this.state.waveformData);
      this.waveformUpdateInterval = requestAnimationFrame(updateWaveform);
    };

    updateWaveform();
  }

  private calculateNoiseLevel(frequencies: Float32Array): number {
    // Calculate noise level based on frequency distribution
    let noiseSum = 0;
    let count = 0;
    
    for (let i = 0; i < frequencies.length; i++) {
      if (frequencies[i] < -60) { // Low amplitude frequencies
        noiseSum += Math.abs(frequencies[i]);
        count++;
      }
    }
    
    return count > 0 ? noiseSum / count / 100 : 0;
  }

  private resetSilenceTimer(): void {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
    }
    
    this.silenceTimer = window.setTimeout(() => {
      this.state.transcript = '';
      this.emit('transcript', { transcript: '', finalTranscript: '', confidence: 0 });
    }, 3000); // Clear transcript after 3 seconds of silence
  }

  private clearSilenceTimer(): void {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
  }

  private applyConfig(config: NimbusVoiceConfig): void {
    this.voiceActivityThreshold = config.voiceActivityThreshold || 0.01;
    this.noiseReductionEnabled = config.noiseReduction ?? true;
    this.interruptionEnabled = config.interruptionEnabled ?? true;
  }

  // Start continuous listening mode
  async startContinuousListening(): Promise<boolean> {
    if (!this.recognition) {
      throw new Error('Speech recognition not supported');
    }

    try {
      this.state.mode = 'continuous';
      this.recognition.start();
      return true;
    } catch (error) {
      console.error('Failed to start continuous listening:', error);
      return false;
    }
  }

  // Stop listening
  stopListening(): void {
    if (this.recognition) {
      this.state.mode = 'idle';
      this.recognition.stop();
    }
    this.clearSilenceTimer();
  }

  // Enhanced speech with interruption support
  async speak(
    text: string,
    options: {
      tone?: NimbusEmotionalTone;
      interruptible?: boolean;
      priority?: 'low' | 'medium' | 'high';
      workoutContext?: NimbusWorkoutContext;
    } = {}
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      // Stop current speech if interruption is enabled
      if (options.interruptible && this.isSpeaking()) {
        this.stopSpeaking();
      }

      const utterance = new SpeechSynthesisUtterance(text);
      this.currentUtterance = utterance;
      
      // Apply emotional tone
      this.applyEmotionalTone(utterance, options.tone || 'neutral', options.workoutContext);
      
      utterance.onstart = () => {
        this.state.isSpeaking = true;
        this.state.emotionalTone = options.tone || 'neutral';
        this.emit('stateChange', this.state);
        this.emit('speakingStarted', { text, tone: options.tone });
      };

      utterance.onend = () => {
        this.state.isSpeaking = false;
        this.currentUtterance = null;
        this.emit('stateChange', this.state);
        this.emit('speakingEnded');
        resolve();
      };

      utterance.onerror = (error) => {
        this.state.isSpeaking = false;
        this.currentUtterance = null;
        this.emit('stateChange', this.state);
        reject(error);
      };

      // Handle interruption during speech
      if (options.interruptible) {
        const interruptHandler = () => {
          if (this.state.isListening && this.currentUtterance === utterance) {
            this.stopSpeaking();
            this.emit('interrupted');
          }
        };
        
        this.addEventListener('listeningStarted', interruptHandler, { once: true });
      }

      this.synthesis.speak(utterance);
    });
  }

  // Stop speaking (for interruption)
  stopSpeaking(): void {
    if (this.synthesis.speaking) {
      this.synthesis.cancel();
    }
    this.state.isSpeaking = false;
    this.currentUtterance = null;
    this.emit('stateChange', this.state);
  }

  // Apply emotional tone based on context
  private applyEmotionalTone(
    utterance: SpeechSynthesisUtterance,
    tone: NimbusEmotionalTone,
    workoutContext?: NimbusWorkoutContext
  ): void {
    const toneSettings = {
      neutral: { rate: 1.0, pitch: 1.0, volume: 0.8 },
      encouraging: { rate: 1.1, pitch: 1.1, volume: 0.9 },
      motivational: { rate: 1.2, pitch: 1.2, volume: 1.0 },
      calm: { rate: 0.8, pitch: 0.9, volume: 0.7 },
      celebratory: { rate: 1.3, pitch: 1.3, volume: 1.0 },
      corrective: { rate: 0.9, pitch: 1.0, volume: 0.8 }
    };

    const settings = toneSettings[tone];
    utterance.rate = settings.rate;
    utterance.pitch = settings.pitch;
    utterance.volume = settings.volume;

    // Adapt further based on workout context
    if (workoutContext?.isActive) {
      if (workoutContext.intensity === 'working') {
        utterance.rate *= 1.1; // Slightly faster during working sets
        utterance.volume *= 1.1; // Slightly louder during exercise
      } else if (workoutContext.intensity === 'rest') {
        utterance.rate *= 0.9; // Slower during rest
        utterance.pitch *= 0.95; // Slightly lower pitch for calm
      }
    }
  }

  // Process final transcript for intelligent parsing
  private async processFinalTranscript(transcript: string): Promise<void> {
    this.state.isProcessing = true;
    this.emit('stateChange', this.state);

    try {
      // Check if this is a workout command
      const workoutCommand = await this.parseWorkoutCommand(transcript);
      if (workoutCommand) {
        this.emit('workoutCommand', workoutCommand);
        await this.respondToWorkoutCommand(workoutCommand);
        return;
      }

      // Check if this is a nutrition command
      const nutritionCommand = await this.parseNutritionCommand(transcript);
      if (nutritionCommand) {
        this.emit('nutritionCommand', nutritionCommand);
        await this.respondToNutritionCommand(nutritionCommand);
        return;
      }

      // General AI conversation
      this.emit('conversationInput', { transcript });
      
    } catch (error) {
      console.error('Error processing transcript:', error);
      await this.speak("Sorry, I had trouble understanding that. Could you try again?", {
        tone: 'calm',
        interruptible: true
      });
    } finally {
      this.state.isProcessing = false;
      this.emit('stateChange', this.state);
    }
  }

  // Advanced workout command parsing
  private async parseWorkoutCommand(transcript: string): Promise<NimbusWorkoutCommand | null> {
    const lowerTranscript = transcript.toLowerCase();
    
    // Patterns for different workout commands
    const patterns = {
      logSet: /(?:(?:did|completed?|finished|logged)\s+)?(\d+(?:\.\d+)?)\s*(?:kg|kilos?|pounds?|lbs?)?\s+(?:for|x|\*|times?)\s+(\d+)\s+(?:reps?|repetitions?)/i,
      startExercise: /(?:starting|beginning|doing|next is)\s+(.+?)(?:\s|$)/i,
      restTimer: /(?:start|set|begin)\s+(?:a\s+)?(?:(\d+)\s+(?:minute?|min)\s*)?(?:(\d+)\s+(?:second?|sec))?\s+(?:rest\s+)?timer/i,
      skipExercise: /(?:skip|next|move on|done with)\s+(?:this\s+)?(?:exercise|set)?/i,
      endWorkout: /(?:end|finish|complete|stop)\s+(?:the\s+)?workout/i,
      adjustWeight: /(?:increase|decrease|add|remove|up|down)\s+(?:by\s+)?(\d+(?:\.\d+)?)\s*(?:kg|kilos?|pounds?|lbs?)?/i
    };

    // Log set command (most common)
    const setMatch = transcript.match(patterns.logSet);
    if (setMatch) {
      const weight = parseFloat(setMatch[1]);
      const reps = parseInt(setMatch[2]);
      return {
        type: 'log_set',
        data: { weight, reps },
        originalTranscript: transcript,
        confidence: this.state.confidence
      };
    }

    // Start exercise command
    const exerciseMatch = transcript.match(patterns.startExercise);
    if (exerciseMatch) {
      return {
        type: 'start_exercise',
        data: { exerciseName: exerciseMatch[1].trim() },
        originalTranscript: transcript,
        confidence: this.state.confidence
      };
    }

    // Rest timer command
    const restMatch = transcript.match(patterns.restTimer);
    if (restMatch) {
      const minutes = parseInt(restMatch[1] || '0');
      const seconds = parseInt(restMatch[2] || '0');
      const totalSeconds = minutes * 60 + seconds || 90; // Default 90 seconds
      return {
        type: 'start_rest_timer',
        data: { seconds: totalSeconds },
        originalTranscript: transcript,
        confidence: this.state.confidence
      };
    }

    return null;
  }

  // Advanced nutrition command parsing
  private async parseNutritionCommand(transcript: string): Promise<NimbusNutritionCommand | null> {
    const nutritionPatterns = {
      logFood: /(?:ate|had|consumed|logged)\s+(\d+(?:\.\d+)?)\s*(?:g|grams?|ml|oz|cups?)?\s+(?:of\s+)?(.+)/i,
      logMeal: /(?:just\s+(?:ate|had|finished))\s+(.+?)(?:\s+for\s+(breakfast|lunch|dinner|snack))?/i,
      waterIntake: /(?:drank|had)\s+(\d+(?:\.\d+)?)\s*(?:ml|liters?|cups?|glasses?)\s+(?:of\s+)?water/i
    };

    const foodMatch = transcript.match(nutritionPatterns.logFood);
    if (foodMatch) {
      return {
        type: 'log_food',
        data: {
          quantity: parseFloat(foodMatch[1]),
          foodName: foodMatch[2].trim()
        },
        originalTranscript: transcript,
        confidence: this.state.confidence
      };
    }

    return null;
  }

  // Contextual responses to workout commands
  private async respondToWorkoutCommand(command: NimbusWorkoutCommand): Promise<void> {
    const responses = {
      log_set: [
        `Great set! ${command.data.weight}kg for ${command.data.reps} reps logged.`,
        `Nice work! That's ${command.data.weight}kg x ${command.data.reps} in the books.`,
        `Excellent! ${command.data.reps} reps at ${command.data.weight}kg recorded.`
      ],
      start_exercise: [
        `Starting ${command.data.exerciseName}. Let's crush this!`,
        `Time for ${command.data.exerciseName}. You've got this!`,
        `Switching to ${command.data.exerciseName}. Focus on form!`
      ],
      start_rest_timer: [
        `Rest timer started for ${command.data.seconds} seconds. Breathe deep and recover.`,
        `${command.data.seconds} second rest timer is running. Stay hydrated!`,
        `Timer set! Take ${command.data.seconds} seconds to recover properly.`
      ]
    };

    const responseOptions = responses[command.type];
    const response = responseOptions[Math.floor(Math.random() * responseOptions.length)];
    
    await this.speak(response, {
      tone: command.type === 'log_set' ? 'encouraging' : 'motivational',
      interruptible: true,
      workoutContext: this.state.workoutContext
    });
  }

  // Contextual responses to nutrition commands
  private async respondToNutritionCommand(command: NimbusNutritionCommand): Promise<void> {
    const responses = {
      log_food: [
        `Logged ${command.data.quantity} of ${command.data.foodName}. Great nutrition tracking!`,
        `Added ${command.data.foodName} to your nutrition log. Keep it up!`,
        `Recorded ${command.data.quantity} ${command.data.foodName}. Your body will thank you!`
      ]
    };

    const responseOptions = responses[command.type];
    const response = responseOptions[Math.floor(Math.random() * responseOptions.length)];
    
    await this.speak(response, {
      tone: 'encouraging',
      interruptible: true
    });
  }

  // Event system
  private emit(eventType: string, data?: any): void {
    this.eventEmitter.dispatchEvent(new CustomEvent(eventType, { detail: data }));
  }

  addEventListener(eventType: string, callback: EventListener, options?: AddEventListenerOptions): void {
    this.eventEmitter.addEventListener(eventType, callback, options);
  }

  removeEventListener(eventType: string, callback: EventListener): void {
    this.eventEmitter.removeEventListener(eventType, callback);
  }

  // Utility methods
  isListening(): boolean { return this.state.isListening; }
  isSpeaking(): boolean { return this.state.isSpeaking; }
  getState(): NimbusVoiceState { return { ...this.state }; }
  
  updateWorkoutContext(context: NimbusWorkoutContext): void {
    this.state.workoutContext = context;
    this.emit('workoutContextUpdated', context);
  }

  // Cleanup
  destroy(): void {
    this.stopListening();
    this.stopSpeaking();
    
    if (this.waveformUpdateInterval) {
      cancelAnimationFrame(this.waveformUpdateInterval);
    }
    
    if (this.audioContext) {
      this.audioContext.close();
    }
  }
}

// Command interfaces
export interface NimbusWorkoutCommand {
  type: 'log_set' | 'start_exercise' | 'start_rest_timer' | 'skip_exercise' | 'end_workout' | 'adjust_weight';
  data: any;
  originalTranscript: string;
  confidence: number;
}

export interface NimbusNutritionCommand {
  type: 'log_food' | 'log_meal' | 'water_intake';
  data: any;
  originalTranscript: string;
  confidence: number;
} 