import type {
  VoiceConfig,
  VoiceState,
  VoiceCommandResult,
  VoiceInput,
  VoiceError,
  VoiceAction,
  VoiceEventListener,
  VoiceEvent,
  SpeechOptions,
  VoiceErrorType
} from '../types/voice';
import type { WorkoutContext } from '../types/workout';
import { VOICE_COMMAND_CONFIG, EXERCISE_ALIASES, WEIGHT_UNITS } from '../constants/voiceCommands';

// Extend the global interface for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
  
  interface SpeechRecognitionEvent extends Event {
    readonly resultIndex: number;
    readonly results: SpeechRecognitionResultList;
  }
  
  interface SpeechRecognitionErrorEvent extends Event {
    readonly error: string;
    readonly message: string;
  }
}

export class VoiceService {
  private recognition: any | null = null;
  private synthesis: SpeechSynthesis;
  private config: VoiceConfig;
  private state: VoiceState;
  private eventListeners: Map<string, VoiceEventListener[]> = new Map();
  private isInitialized = false;
  // private currentUtterance: SpeechSynthesisUtterance | null = null;
  private recognitionTimeout: NodeJS.Timeout | null = null;

  constructor(config?: Partial<VoiceConfig>) {
    this.synthesis = window.speechSynthesis;
    this.config = { ...VOICE_COMMAND_CONFIG, ...config } as VoiceConfig;
    
    this.state = {
      mode: 'idle',
      isInitialized: false,
      isListening: false,
      isSpeaking: false,
      isProcessing: false,
      continuousMode: this.config.recognition.continuous
    };
  }

  async initialize(): Promise<boolean> {
    try {
      // Check for speech recognition support
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        this.handleError({
          type: 'unsupported_browser',
          message: 'Speech recognition not supported in this browser',
          recoverable: false,
          suggestedAction: 'Use a modern browser with speech recognition support',
          timestamp: new Date()
        });
        return false;
      }

      // Initialize speech recognition
      this.recognition = new SpeechRecognition();
      this.setupRecognition();

      // Check microphone permissions
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (error) {
        this.handleError({
          type: 'permission_denied',
          message: 'Microphone permission denied',
          recoverable: true,
          suggestedAction: 'Please allow microphone access for voice commands',
          timestamp: new Date()
        });
        return false;
      }

      this.isInitialized = true;
      this.state.isInitialized = true;
      this.state.mode = 'idle';
      
      this.emitEvent('listening_started', { initialized: true });
      return true;

    } catch (error) {
      this.handleError({
        type: 'recognition_failed',
        message: `Failed to initialize voice service: ${error}`,
        recoverable: false,
        timestamp: new Date()
      });
      return false;
    }
  }

  private setupRecognition(): void {
    if (!this.recognition) return;

    // Configure recognition settings
    this.recognition.continuous = this.config.recognition.continuous;
    this.recognition.interimResults = this.config.recognition.interimResults;
    this.recognition.lang = this.config.recognition.language;
    this.recognition.maxAlternatives = this.config.recognition.maxAlternatives;

    // Event handlers
    this.recognition.onstart = () => {
      this.state.isListening = true;
      this.state.mode = 'listening';
      this.emitEvent('listening_started');
      
      // Set timeout for recognition
      if (this.config.recognition.timeout > 0) {
        this.recognitionTimeout = setTimeout(() => {
          this.stopListening();
        }, this.config.recognition.timeout);
      }
    };

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      this.clearRecognitionTimeout();
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;
        const confidence = result[0].confidence;
        
        const voiceInput: VoiceInput = {
          transcript: transcript.trim(),
          confidence,
          isFinal: result.isFinal,
          timestamp: new Date(),
          alternatives: Array.from(result).map((alt: SpeechRecognitionAlternative) => ({
            transcript: alt.transcript,
            confidence: alt.confidence
          }))
        };

        if (result.isFinal) {
          this.state.currentTranscript = transcript;
          this.state.confidence = confidence;
          this.processVoiceInput(voiceInput);
        }
      }
    };

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      this.clearRecognitionTimeout();
      let errorType: VoiceErrorType = 'recognition_failed';
      
      switch (event.error) {
        case 'no-speech':
          errorType = 'timeout';
          break;
        case 'audio-capture':
          errorType = 'no_microphone';
          break;
        case 'not-allowed':
          errorType = 'permission_denied';
          break;
        case 'network':
          errorType = 'network_error';
          break;
        default:
          errorType = 'recognition_failed';
      }

      this.handleError({
        type: errorType,
        message: `Speech recognition error: ${event.error}`,
        recoverable: true,
        timestamp: new Date()
      });
    };

    this.recognition.onend = () => {
      this.clearRecognitionTimeout();
      this.state.isListening = false;
      
      if (this.state.mode === 'listening') {
        this.state.mode = 'idle';
      }
      
      this.emitEvent('listening_stopped');
      
      // Auto-restart if in continuous mode and no error
      if (this.config.recognition.continuous && !this.state.error) {
        setTimeout(() => this.startListening(), 100);
      }
    };
  }

  async startListening(context?: WorkoutContext): Promise<void> {
    if (!this.isInitialized || !this.recognition) {
      throw new Error('Voice service not initialized');
    }

    if (this.state.isListening) {
      return; // Already listening
    }

    try {
      this.state.context = context;
      this.state.error = undefined;
      this.recognition.start();
    } catch (error) {
      this.handleError({
        type: 'recognition_failed',
        message: `Failed to start listening: ${error}`,
        recoverable: true,
        timestamp: new Date()
      });
    }
  }

  async stopListening(): Promise<void> {
    if (this.recognition && this.state.isListening) {
      this.recognition.stop();
    }
    this.clearRecognitionTimeout();
  }

  async speak(text: string, options?: SpeechOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Stop current speech if interruption is allowed
        if (options?.interrupt && this.state.isSpeaking) {
          this.synthesis.cancel();
        }

        const utterance = new SpeechSynthesisUtterance(text);
        
        // Apply voice options
        if (options?.voice) {
          const voices = this.synthesis.getVoices();
          const selectedVoice = voices.find(voice => voice.name === options.voice);
          if (selectedVoice) {
            utterance.voice = selectedVoice;
          }
        }

        utterance.rate = options?.rate || this.config.synthesis.rate;
        utterance.pitch = options?.pitch || this.config.synthesis.pitch;
        utterance.volume = options?.volume || this.config.synthesis.volume;
        utterance.lang = options?.language || 'en-US';

        utterance.onstart = () => {
          this.state.isSpeaking = true;
          this.state.mode = 'speaking';
          // this.currentUtterance = utterance;
          this.emitEvent('synthesis_started', { text });
        };

        utterance.onend = () => {
          this.state.isSpeaking = false;
          this.state.mode = 'idle';
          // this.currentUtterance = null;
          this.emitEvent('synthesis_ended', { text });
          resolve();
        };

        utterance.onerror = (event) => {
          this.state.isSpeaking = false;
          this.state.mode = 'idle';
          // this.currentUtterance = null;
          this.handleError({
            type: 'synthesis_failed',
            message: `Speech synthesis failed: ${event.error}`,
            recoverable: true,
            timestamp: new Date()
          });
          reject(new Error(`Speech synthesis failed: ${event.error}`));
        };

        this.synthesis.speak(utterance);

      } catch (error) {
        this.handleError({
          type: 'synthesis_failed',
          message: `Failed to speak: ${error}`,
          recoverable: true,
          timestamp: new Date()
        });
        reject(error);
      }
    });
  }

  processVoiceCommand(transcript: string): VoiceCommandResult {
    const normalizedTranscript = this.normalizeTranscript(transcript);
    let bestMatch: VoiceCommandResult | null = null;
    let highestConfidence = 0;

    // Check each command pattern
    for (const command of this.config.commands) {
      for (const pattern of command.patterns) {
        const match = this.matchPattern(normalizedTranscript, pattern);
        
        if (match && match.confidence >= command.confidence) {
          if (match.confidence > highestConfidence) {
            highestConfidence = match.confidence;
            bestMatch = {
              success: true,
              action: command.action,
              parameters: match.parameters,
              confidence: match.confidence,
              originalTranscript: transcript,
              processedText: normalizedTranscript,
              timestamp: new Date(),
              context: this.state.context
            };
          }
        }
      }
    }

    if (bestMatch && bestMatch.confidence >= this.config.confidenceThreshold) {
      this.state.lastCommand = bestMatch;
      this.emitEvent('command_recognized', bestMatch);
      return bestMatch;
    }

    // No command recognized
    const failureResult: VoiceCommandResult = {
      success: false,
      action: 'HELP' as VoiceAction,
      parameters: {},
      confidence: 0,
      originalTranscript: transcript,
      processedText: normalizedTranscript,
      timestamp: new Date(),
      context: this.state.context,
      errors: ['Command not recognized'],
      suggestions: this.getSuggestions(normalizedTranscript)
    };

    this.emitEvent('command_recognized', failureResult);
    return failureResult;
  }

  private processVoiceInput(input: VoiceInput): void {
    if (input.confidence < this.config.confidenceThreshold) {
      this.handleError({
        type: 'low_confidence',
        message: `Low confidence transcript: ${input.transcript}`,
        recoverable: true,
        timestamp: new Date()
      });
      return;
    }

    const result = this.processVoiceCommand(input.transcript);
    this.emitEvent('command_executed', result);
  }

  private normalizeTranscript(transcript: string): string {
    let normalized = transcript.toLowerCase().trim();
    
    // Replace exercise aliases
    for (const [exerciseId, aliases] of Object.entries(EXERCISE_ALIASES)) {
      for (const alias of aliases) {
        const aliasRegex = new RegExp(`\\b${alias}\\b`, 'gi');
        normalized = normalized.replace(aliasRegex, exerciseId.replace('-', ' '));
      }
    }

    // Normalize weight units
    for (const [unit, variations] of Object.entries(WEIGHT_UNITS)) {
      for (const variation of variations) {
        const variationRegex = new RegExp(`\\b${variation}\\b`, 'gi');
        normalized = normalized.replace(variationRegex, unit);
      }
    }

    // Remove filler words
    const fillerWords = ['um', 'uh', 'like', 'you know', 'actually', 'basically'];
    for (const filler of fillerWords) {
      const fillerRegex = new RegExp(`\\b${filler}\\b`, 'gi');
      normalized = normalized.replace(fillerRegex, '');
    }

    // Clean up extra spaces
    normalized = normalized.replace(/\s+/g, ' ').trim();
    
    return normalized;
  }

  private matchPattern(transcript: string, pattern: string): { confidence: number; parameters: Record<string, any> } | null {
    try {
      const regex = new RegExp(pattern, 'i');
      const match = transcript.match(regex);
      
      if (match) {
        const parameters: Record<string, any> = {};
        
        // Extract parameters from regex groups
        if (match.length > 1) {
          match.slice(1).forEach((group, index) => {
            if (group !== undefined) {
              parameters[`param${index + 1}`] = group.trim();
              
              // Try to parse as number
              const numValue = parseFloat(group);
              if (!isNaN(numValue)) {
                parameters[`param${index + 1}_number`] = numValue;
              }
            }
          });
        }

        // Calculate confidence based on match quality
        const confidence = this.calculateConfidence(transcript, pattern, match);
        
        return { confidence, parameters };
      }
    } catch (error) {
      console.warn('Invalid regex pattern:', pattern);
    }
    
    return null;
  }

  private calculateConfidence(transcript: string, _pattern: string, match: RegExpMatchArray): number {
    // Base confidence from match length vs transcript length
    let confidence = match[0].length / transcript.length;
    
    // Boost for exact matches
    if (match[0] === transcript) {
      confidence += 0.2;
    }
    
    // Reduce for partial matches
    if (match[0].length < transcript.length * 0.5) {
      confidence *= 0.7;
    }
    
    // Ensure confidence is between 0 and 1
    return Math.min(Math.max(confidence, 0), 1);
  }

  private getSuggestions(transcript: string): string[] {
    const suggestions: string[] = [];
    
    // Find similar commands based on keywords
    const keywords = transcript.split(' ');
    
    for (const command of this.config.commands) {
      for (const example of command.examples) {
        const exampleWords = example.toLowerCase().split(' ');
        const commonWords = keywords.filter(word => 
          exampleWords.some(exampleWord => 
            exampleWord.includes(word) || word.includes(exampleWord)
          )
        );
        
        if (commonWords.length > 0) {
          suggestions.push(example);
        }
      }
    }
    
    return suggestions.slice(0, 3); // Return top 3 suggestions
  }

  private handleError(error: VoiceError): void {
    this.state.error = error;
    this.state.mode = 'error';
    this.emitEvent('error_occurred', error);
    
    // Attempt recovery for recoverable errors
    if (error.recoverable) {
      setTimeout(() => {
        this.attemptRecovery(error.type);
      }, 1000);
    }
  }

  private attemptRecovery(errorType: VoiceErrorType): void {
    switch (errorType) {
      case 'timeout':
      case 'recognition_failed':
        if (this.isInitialized && !this.state.isListening) {
          this.startListening(this.state.context);
        }
        break;
      case 'synthesis_failed':
        // Clear current utterance and reset state
        this.synthesis.cancel();
        this.state.isSpeaking = false;
        this.state.mode = 'idle';
        break;
    }
  }

  private clearRecognitionTimeout(): void {
    if (this.recognitionTimeout) {
      clearTimeout(this.recognitionTimeout);
      this.recognitionTimeout = null;
    }
  }

  private emitEvent(type: string, data?: any): void {
    const event: VoiceEvent = {
      type: type as any,
      data,
      timestamp: new Date(),
      context: this.state.context
    };

    const listeners = this.eventListeners.get(type) || [];
    listeners.forEach(listener => listener(event));
  }

  // Public API methods
  getState(): VoiceState {
    return { ...this.state };
  }

  addEventListener(type: string, listener: VoiceEventListener): void {
    if (!this.eventListeners.has(type)) {
      this.eventListeners.set(type, []);
    }
    this.eventListeners.get(type)!.push(listener);
  }

  removeEventListener(type: string, listener: VoiceEventListener): void {
    const listeners = this.eventListeners.get(type);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  updateConfig(config: Partial<VoiceConfig>): void {
    this.config = { ...this.config, ...config };
    
    if (this.recognition) {
      this.setupRecognition();
    }
  }

  getAvailableVoices(): SpeechSynthesisVoice[] {
    return this.synthesis.getVoices();
  }

  destroy(): void {
    this.stopListening();
    this.synthesis.cancel();
    this.clearRecognitionTimeout();
    this.eventListeners.clear();
    this.isInitialized = false;
  }

  // Singleton pattern
  private static instance: VoiceService;
  
  static getInstance(config?: Partial<VoiceConfig>): VoiceService {
    if (!VoiceService.instance) {
      VoiceService.instance = new VoiceService(config);
    }
    return VoiceService.instance;
  }
}

let voiceServiceInstance: VoiceService | null = null;

export function getVoiceService(config?: Partial<VoiceConfig>): VoiceService {
  if (!voiceServiceInstance) {
    voiceServiceInstance = new VoiceService(config);
  }
  return voiceServiceInstance;
}