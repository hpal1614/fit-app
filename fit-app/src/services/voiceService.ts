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
import { EnhancedNLPService } from './nlpService';
import { ConversationMemoryService } from './conversationMemoryService';
import { UserLearningService } from './userLearningService';
import { ConversationFlowManager } from './conversationFlow';

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
  
  // AI-powered services
  private nlpService: EnhancedNLPService;
  private memoryService: ConversationMemoryService;
  private learningService: UserLearningService;
  private conversationFlow: ConversationFlowManager;

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
    
    // Initialize AI services
    this.nlpService = EnhancedNLPService.getInstance();
    this.memoryService = ConversationMemoryService.getInstance();
    this.learningService = UserLearningService.getInstance();
    this.conversationFlow = new ConversationFlowManager();
  }

  async initialize(): Promise<boolean> {
    try {
      console.log('🎤 Initializing Voice Service...');
      
      // Check if we're in a browser environment
      if (typeof window === 'undefined') {
        console.log('⚠️ Not in browser environment, voice disabled');
        return false;
      }

      // Check for speech synthesis support (more basic check first)
      if (!window.speechSynthesis) {
        console.log('⚠️ Speech synthesis not supported');
        return false;
      }

      // Check for speech recognition support
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        console.log('⚠️ Speech recognition not supported, but service will work in limited mode');
        // Continue initialization for synthesis-only mode
        this.isInitialized = true;
        return true;
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
        // Check if synthesis is available
        if (!this.synthesis || !window.speechSynthesis) {
          console.log('🔊 Speech synthesis not available, skipping speak:', text);
          resolve();
          return;
        }

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

  async processVoiceCommand(transcript: string): Promise<VoiceCommandResult> {
    // Use AI-powered NLP instead of regex patterns
    const nlpResult = await this.nlpService.processText(transcript, {
      currentExercise: this.state.context?.currentExercise?.exercise.name,
      previousIntent: this.nlpService.getContext().previousIntent
    });
    
    // Handle conversation flow
    if (this.conversationFlow.isInFlow()) {
      const response = await this.conversationFlow.processUserInput(transcript, this.state.context || {} as WorkoutContext);
      
      // Add to conversation memory
      this.memoryService.addMessage({
        id: Date.now().toString(),
        role: 'user',
        content: transcript,
        timestamp: new Date(),
        type: nlpResult.intent as any
      }, this.state.context);
      
      // Speak the response
      await this.speak(response.text);
      
      return {
        success: true,
        action: nlpResult.intent as VoiceAction,
        parameters: this.extractParametersFromNLP(nlpResult),
        confidence: nlpResult.confidence,
        originalTranscript: transcript,
        transcript: transcript,
        processedText: nlpResult.normalizedText,
        timestamp: new Date(),
        context: this.state.context,
        aiResponse: response.text
      };
    }
    
    // Convert NLP result to voice command result
    const parameters = this.extractParametersFromNLP(nlpResult);
    
    // Learn from this interaction
    const predictions = this.learningService.predictUserNeeds(this.state.context || {} as WorkoutContext);
    
    // Map NLP intent to voice action
    const action = this.mapIntentToAction(nlpResult.intent);
    
    const result: VoiceCommandResult = {
      success: nlpResult.confidence > 0.5,
      action,
      parameters,
      confidence: nlpResult.confidence,
      originalTranscript: transcript,
      transcript: transcript,
      processedText: nlpResult.normalizedText,
      timestamp: new Date(),
      context: this.state.context,
      aiInterpretation: nlpResult.aiInterpretation,
      suggestions: predictions.suggestedActions
    };
    
    // Add to conversation memory
    this.memoryService.addMessage({
      id: Date.now().toString(),
      role: 'user',
      content: transcript,
      timestamp: new Date(),
      type: nlpResult.intent as any
    }, this.state.context);
    
    // Learn from this interaction
    await this.learningService.learnFromInteraction(
      nlpResult,
      this.state.context || {} as WorkoutContext,
      result.success ? 'success' : 'failure'
    );
    
    this.state.lastCommand = result;
    this.emitEvent('command_recognized', result);
    return result;
  }

  private async processVoiceInput(input: VoiceInput): Promise<void> {
    if (input.confidence < this.config.confidenceThreshold) {
      this.handleError({
        type: 'low_confidence',
        message: `Low confidence transcript: ${input.transcript}`,
        recoverable: true,
        timestamp: new Date()
      });
      return;
    }

    const result = await this.processVoiceCommand(input.transcript);
    this.emitEvent('command_executed', result);
  }
  
  private extractParametersFromNLP(nlpResult: any): Record<string, any> {
    const parameters: Record<string, any> = {};
    
    // Extract exercise
    const exerciseEntity = nlpResult.entities.find((e: any) => e.type === 'exercise');
    if (exerciseEntity) {
      parameters.exercise = exerciseEntity.value;
      parameters.exerciseName = exerciseEntity.text;
    }
    
    // Extract reps
    const repsEntity = nlpResult.entities.find((e: any) => e.type === 'reps');
    if (repsEntity) {
      parameters.reps = repsEntity.value;
    }
    
    // Extract weight
    const weightEntity = nlpResult.entities.find((e: any) => e.type === 'weight');
    if (weightEntity) {
      parameters.weight = weightEntity.value;
      parameters.unit = this.state.context?.userPreferences?.defaultWeightUnit || 'lbs';
    }
    
    // Extract from AI interpretation if available
    if (nlpResult.aiInterpretation && nlpResult.extractedData) {
      if (nlpResult.extractedData.exercise && !parameters.exercise) {
        parameters.exercise = nlpResult.extractedData.exercise;
      }
      if (nlpResult.extractedData.reps && !parameters.reps) {
        parameters.reps = nlpResult.extractedData.reps;
      }
      if (nlpResult.extractedData.weight && !parameters.weight) {
        parameters.weight = nlpResult.extractedData.weight;
      }
    }
    
    return parameters;
  }
  
  private mapIntentToAction(intent: string): VoiceAction {
    const intentActionMap: Record<string, VoiceAction> = {
      'log_exercise': 'LOG_EXERCISE',
      'quick_log': 'LOG_EXERCISE',
      'ask_ai': 'AI_COACHING',
      'motivation': 'MOTIVATION_REQUEST',
      'form_analysis': 'FORM_ANALYSIS',
      'nutrition': 'NUTRITION_QUERY',
      'workout_control': 'START_WORKOUT',
      'start_workout': 'START_WORKOUT',
      'end_workout': 'END_WORKOUT',
      'rest_timer': 'REST_TIMER',
      'next_exercise': 'NEXT_EXERCISE',
      'previous_exercise': 'PREVIOUS_EXERCISE'
    };
    
    return intentActionMap[intent] || 'HELP';
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