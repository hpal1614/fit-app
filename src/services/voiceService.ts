import {
  VoiceConfig,
  VoiceCommand,
  VoiceCommandResult,
  VoiceInput,
  VoiceState,
  VoiceMode,
  SpeechOptions,
  VoiceResponse,
  VoiceError,
  VoiceErrorType,
  WorkoutContext,
  SpeechRecognitionResult,
  VoiceAction
} from '../types';
import { FITNESS_VOICE_COMMANDS, EXERCISE_ALIASES, WEIGHT_UNITS, VOICE_COMMAND_CONFIG } from '../constants/voiceCommands';

export class VoiceService {
  private recognition: SpeechRecognition | null = null;
  private synthesis: SpeechSynthesis;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isListening = false;
  private isSpeaking = false;
  private isProcessing = false;
  private context: WorkoutContext | null = null;
  private config: VoiceConfig;
  private state: VoiceState;
  private lastTranscript = '';
  private confidenceThreshold = 0.7;
  private retryCount = 0;
  private maxRetries = 3;
  
  // Event listeners
  private onStateChange?: (state: VoiceState) => void;
  private onCommandRecognized?: (result: VoiceCommandResult) => void;
  private onError?: (error: VoiceError) => void;
  private onTranscript?: (transcript: string, confidence: number) => void;

  constructor(config?: Partial<VoiceConfig>) {
    this.synthesis = window.speechSynthesis;
    this.config = this.getDefaultConfig();
    if (config) {
      this.config = { ...this.config, ...config };
    }
    
    this.state = {
      mode: 'idle',
      isListening: false,
      isSpeaking: false,
      isProcessing: false,
      currentTranscript: '',
      confidence: 0,
      lastActivity: new Date(),
      sessionActive: false
    };

    this.confidenceThreshold = this.config.recognition.confidenceThreshold;
    this.maxRetries = this.config.maxRetries;
  }

  // Initialize the voice service
  async initialize(): Promise<boolean> {
    try {
      // Check browser support
      if (!this.checkBrowserSupport()) {
        throw new Error('Browser does not support required speech APIs');
      }

      // Initialize speech recognition
      await this.initializeSpeechRecognition();
      
      // Initialize speech synthesis
      await this.initializeSpeechSynthesis();

      // Test permissions
      await this.requestPermissions();

      this.updateState({ mode: 'idle', sessionActive: true });
      return true;
    } catch (error) {
      const voiceError: VoiceError = {
        type: 'recognition_failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
        context: { initialization: true }
      };
      this.handleError(voiceError);
      return false;
    }
  }

  // Check if browser supports required APIs
  private checkBrowserSupport(): boolean {
    const hasSpeechRecognition = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    const hasSpeechSynthesis = 'speechSynthesis' in window;
    return hasSpeechRecognition && hasSpeechSynthesis;
  }

  // Initialize speech recognition
  private async initializeSpeechRecognition(): Promise<void> {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      throw new Error('Speech recognition not supported');
    }

    this.recognition = new SpeechRecognition();
    const config = this.config.recognition;
    
    // Configure recognition
    this.recognition.continuous = config.continuous;
    this.recognition.interimResults = config.interimResults;
    this.recognition.lang = config.language;
    this.recognition.maxAlternatives = 3;

    // Set up event listeners
    this.recognition.onstart = () => {
      this.updateState({ 
        mode: 'listening', 
        isListening: true, 
        currentTranscript: '',
        lastActivity: new Date() 
      });
    };

    this.recognition.onresult = (event) => {
      this.handleRecognitionResult(event);
    };

    this.recognition.onerror = (event) => {
      this.handleRecognitionError(event);
    };

    this.recognition.onend = () => {
      this.updateState({ 
        mode: 'idle', 
        isListening: false,
        lastActivity: new Date() 
      });
      
      // Auto-restart if continuous listening is enabled
      if (this.config.recognition.continuous && this.state.sessionActive) {
        setTimeout(() => this.startListening(), 100);
      }
    };
  }

  // Initialize speech synthesis
  private async initializeSpeechSynthesis(): Promise<void> {
    if (!this.synthesis) {
      throw new Error('Speech synthesis not supported');
    }

    // Wait for voices to load
    return new Promise((resolve) => {
      const checkVoices = () => {
        const voices = this.synthesis.getVoices();
        if (voices.length > 0) {
          resolve();
        } else {
          // Wait for voiceschanged event
          this.synthesis.addEventListener('voiceschanged', () => {
            resolve();
          }, { once: true });
        }
      };
      checkVoices();
    });
  }

  // Request microphone permissions
  private async requestPermissions(): Promise<void> {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (error) {
      throw new Error('Microphone permission denied');
    }
  }

  // Start listening for voice commands
  async startListening(context?: WorkoutContext): Promise<void> {
    if (!this.recognition || this.isListening) {
      return;
    }

    try {
      if (context) {
        this.context = context;
      }

      this.retryCount = 0;
      this.recognition.start();
    } catch (error) {
      const voiceError: VoiceError = {
        type: 'recognition_failed',
        message: 'Failed to start listening',
        timestamp: new Date(),
        context: { startListening: true }
      };
      this.handleError(voiceError);
    }
  }

  // Stop listening
  stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
  }

  // Speak text using speech synthesis
  async speak(text: string, options?: SpeechOptions): Promise<void> {
    if (this.isSpeaking) {
      // If high priority, interrupt current speech
      if (options?.interrupt) {
        this.synthesis.cancel();
      } else {
        return;
      }
    }

    try {
      const utterance = new SpeechSynthesisUtterance(text);
      const synthConfig = this.config.synthesis;
      
      // Configure utterance
      utterance.rate = options?.rate || synthConfig.rate;
      utterance.pitch = options?.pitch || synthConfig.pitch;
      utterance.volume = options?.volume || synthConfig.volume;
      utterance.lang = this.config.recognition.language;

      // Set voice if specified
      if (options?.voice || synthConfig.preferredVoice) {
        const voices = this.synthesis.getVoices();
        const preferredVoice = voices.find(voice => 
          voice.name === (options?.voice || synthConfig.preferredVoice)
        );
        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }
      }

      // Set up event listeners
      utterance.onstart = () => {
        this.updateState({ 
          mode: 'speaking', 
          isSpeaking: true,
          lastActivity: new Date() 
        });
      };

      utterance.onend = () => {
        this.updateState({ 
          mode: 'idle', 
          isSpeaking: false,
          lastActivity: new Date() 
        });
        this.currentUtterance = null;
      };

      utterance.onerror = (event) => {
        const voiceError: VoiceError = {
          type: 'synthesis_failed',
          message: `Speech synthesis error: ${event.error}`,
          timestamp: new Date(),
          context: { text, options }
        };
        this.handleError(voiceError);
      };

      this.currentUtterance = utterance;
      this.synthesis.speak(utterance);

    } catch (error) {
      const voiceError: VoiceError = {
        type: 'synthesis_failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
        context: { text, options }
      };
      this.handleError(voiceError);
    }
  }

  // Process voice command
  processVoiceCommand(transcript: string): VoiceCommandResult {
    this.updateState({ mode: 'processing', isProcessing: true });

    try {
      const normalizedTranscript = this.normalizeTranscript(transcript);
      const bestMatch = this.findBestCommandMatch(normalizedTranscript);

      if (!bestMatch) {
        throw new Error('No matching command found');
      }

      const result: VoiceCommandResult = {
        action: bestMatch.command.action,
        parameters: bestMatch.parameters,
        confidence: bestMatch.confidence,
        transcript: transcript,
        timestamp: new Date(),
        success: true
      };

      this.updateState({ mode: 'idle', isProcessing: false });
      
      if (this.onCommandRecognized) {
        this.onCommandRecognized(result);
      }

      return result;

    } catch (error) {
      const result: VoiceCommandResult = {
        action: 'CLARIFY',
        parameters: {},
        confidence: 0,
        transcript: transcript,
        timestamp: new Date(),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };

      this.updateState({ mode: 'idle', isProcessing: false });
      return result;
    }
  }

  // Handle speech recognition results
  private handleRecognitionResult(event: SpeechRecognitionEvent): void {
    const results = Array.from(event.results);
    const lastResult = results[results.length - 1];
    
    if (lastResult) {
      const transcript = lastResult[0].transcript;
      const confidence = lastResult[0].confidence;
      
      this.updateState({ 
        currentTranscript: transcript,
        confidence: confidence 
      });

      if (this.onTranscript) {
        this.onTranscript(transcript, confidence);
      }

      // Process final results
      if (lastResult.isFinal) {
        if (confidence >= this.confidenceThreshold) {
          const result = this.processVoiceCommand(transcript);
          this.lastTranscript = transcript;
        } else {
          // Low confidence, ask for clarification
          this.speak("I didn't catch that clearly. Could you repeat?");
        }
      }
    }
  }

  // Handle speech recognition errors
  private handleRecognitionError(event: SpeechRecognitionErrorEvent): void {
    let errorType: VoiceErrorType = 'recognition_failed';
    let message = 'Speech recognition error';

    switch (event.error) {
      case 'no-speech':
        errorType = 'timeout';
        message = 'No speech detected';
        break;
      case 'audio-capture':
        errorType = 'permission_denied';
        message = 'Microphone access denied';
        break;
      case 'not-allowed':
        errorType = 'permission_denied';
        message = 'Speech recognition not allowed';
        break;
      case 'network':
        errorType = 'network_error';
        message = 'Network error during recognition';
        break;
      default:
        message = `Recognition error: ${event.error}`;
    }

    const voiceError: VoiceError = {
      type: errorType,
      message,
      timestamp: new Date(),
      context: { recognitionError: event.error }
    };

    this.handleError(voiceError);
  }

  // Normalize transcript for better matching
  private normalizeTranscript(transcript: string): string {
    let normalized = transcript.toLowerCase().trim();
    
    // Replace exercise aliases
    Object.entries(EXERCISE_ALIASES).forEach(([canonical, aliases]) => {
      aliases.forEach(alias => {
        const regex = new RegExp(`\\b${alias.toLowerCase()}\\b`, 'g');
        normalized = normalized.replace(regex, canonical);
      });
    });

    // Normalize weight units
    Object.entries(WEIGHT_UNITS).forEach(([canonical, alternatives]) => {
      alternatives.forEach(alt => {
        const regex = new RegExp(`\\b${alt.toLowerCase()}\\b`, 'g');
        normalized = normalized.replace(regex, canonical);
      });
    });

    return normalized;
  }

  // Find best matching command
  private findBestCommandMatch(transcript: string): {
    command: VoiceCommand;
    confidence: number;
    parameters: Record<string, any>;
  } | null {
    let bestMatch: {
      command: VoiceCommand;
      confidence: number;
      parameters: Record<string, any>;
    } | null = null;

    for (const command of FITNESS_VOICE_COMMANDS) {
      // Check context requirements
      if (command.context && !this.isContextValid(command.context)) {
        continue;
      }

      for (const pattern of command.patterns) {
        const match = this.matchPattern(transcript, pattern);
        if (match && match.confidence >= command.confidence) {
          if (!bestMatch || match.confidence > bestMatch.confidence) {
            bestMatch = {
              command,
              confidence: match.confidence,
              parameters: match.parameters
            };
          }
        }
      }
    }

    return bestMatch;
  }

  // Match transcript against pattern
  private matchPattern(transcript: string, pattern: string): {
    confidence: number;
    parameters: Record<string, any>;
  } | null {
    // Convert pattern to regex, replacing * with capture groups
    const regexPattern = pattern
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // Escape regex chars
      .replace(/\\\*/g, '([\\w\\s]+?)'); // Replace * with capture groups

    const regex = new RegExp(`^${regexPattern}$`, 'i');
    const match = transcript.match(regex);

    if (!match) {
      return null;
    }

    // Extract parameters from captures
    const parameters: Record<string, any> = {};
    const captures = match.slice(1);
    
    // Simple parameter extraction based on pattern
    if (pattern.includes('* for * reps at * pounds')) {
      parameters.exercise = captures[0]?.trim();
      parameters.reps = parseInt(captures[1]) || 0;
      parameters.weight = parseFloat(captures[2]) || 0;
      parameters.unit = 'lbs';
    } else if (pattern.includes('* for * reps at * kg')) {
      parameters.exercise = captures[0]?.trim();
      parameters.reps = parseInt(captures[1]) || 0;
      parameters.weight = parseFloat(captures[2]) || 0;
      parameters.unit = 'kg';
    } else if (pattern.includes('* sets of * at *')) {
      parameters.sets = parseInt(captures[0]) || 0;
      parameters.reps = parseInt(captures[1]) || 0;
      parameters.weight = parseFloat(captures[2]) || 0;
    } else if (captures.length > 0) {
      // Generic parameter extraction
      parameters.value = captures[0]?.trim();
    }

    // Calculate confidence based on exact match
    const confidence = 0.9; // Simplified confidence calculation
    
    return { confidence, parameters };
  }

  // Check if context is valid for command
  private isContextValid(requiredContexts: any[]): boolean {
    if (!this.context) return false;

    return requiredContexts.some(reqContext => {
      switch (reqContext.type) {
        case 'workout_active':
          return this.context?.activeWorkout !== null;
        case 'exercise_selected':
          return this.context?.currentExercise !== null;
        case 'rest_period':
          return this.context?.activeWorkout !== null && this.context?.currentSet > 0;
        default:
          return true;
      }
    });
  }

  // Update voice state
  private updateState(updates: Partial<VoiceState>): void {
    this.state = { ...this.state, ...updates };
    
    // Update internal flags
    this.isListening = this.state.isListening;
    this.isSpeaking = this.state.isSpeaking;
    this.isProcessing = this.state.isProcessing;

    if (this.onStateChange) {
      this.onStateChange(this.state);
    }
  }

  // Handle errors
  private handleError(error: VoiceError): void {
    this.updateState({ 
      mode: 'error', 
      error,
      lastActivity: new Date() 
    });

    if (this.onError) {
      this.onError(error);
    }

    // Auto-recovery for some errors
    this.attemptErrorRecovery(error);
  }

  // Attempt error recovery
  private attemptErrorRecovery(error: VoiceError): void {
    if (this.retryCount >= this.maxRetries) {
      return;
    }

    switch (error.type) {
      case 'timeout':
      case 'no_speech':
        setTimeout(() => {
          this.retryCount++;
          this.startListening(this.context || undefined);
        }, 1000);
        break;
      case 'low_confidence':
        this.speak("Could you please repeat that?");
        break;
      default:
        // For other errors, reset to idle state
        setTimeout(() => {
          this.updateState({ mode: 'idle', error: undefined });
        }, 2000);
    }
  }

  // Get default configuration
  private getDefaultConfig(): VoiceConfig {
    return {
      recognition: {
        engine: 'browser',
        continuous: true,
        interimResults: true,
        language: 'en-US',
        noiseReduction: true,
        confidenceThreshold: 0.7
      },
      synthesis: {
        voice: 'neural',
        rate: 1.0,
        pitch: 1.0,
        volume: 1.0,
        ssmlSupport: false
      },
      commands: FITNESS_VOICE_COMMANDS,
      wakeWord: 'hey coach',
      timeoutDuration: 5000,
      maxRetries: 3
    };
  }

  // Public getters
  getState(): VoiceState {
    return { ...this.state };
  }

  getContext(): WorkoutContext | null {
    return this.context;
  }

  isActive(): boolean {
    return this.state.sessionActive;
  }

  // Set event listeners
  onStateChanged(callback: (state: VoiceState) => void): void {
    this.onStateChange = callback;
  }

  onCommandRecognition(callback: (result: VoiceCommandResult) => void): void {
    this.onCommandRecognized = callback;
  }

  onErrorOccurred(callback: (error: VoiceError) => void): void {
    this.onError = callback;
  }

  onTranscriptReceived(callback: (transcript: string, confidence: number) => void): void {
    this.onTranscript = callback;
  }

  // Cleanup
  destroy(): void {
    this.stopListening();
    if (this.synthesis) {
      this.synthesis.cancel();
    }
    this.updateState({ sessionActive: false });
  }
}

// Singleton instance
let voiceServiceInstance: VoiceService | null = null;

export function getVoiceService(config?: Partial<VoiceConfig>): VoiceService {
  if (!voiceServiceInstance) {
    voiceServiceInstance = new VoiceService(config);
  }
  return voiceServiceInstance;
}