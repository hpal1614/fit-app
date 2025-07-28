import { EventEmitter } from 'events';

interface VoiceServiceConfig {
  recognition: {
    continuous: boolean;
    interimResults: boolean;
    language: string;
  };
  synthesis: {
    voice: string;
    rate: number;
    pitch: number;
    volume: number;
  };
}

export class UnifiedVoiceService extends EventEmitter {
  private recognition: SpeechRecognition | null = null;
  private synthesis: SpeechSynthesis;
  private config: VoiceServiceConfig;
  private isListening = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  constructor(config?: Partial<VoiceServiceConfig>) {
    super();
    this.synthesis = window.speechSynthesis;
    this.config = this.initializeConfig(config);
    this.initializeRecognition();
  }

  private initializeConfig(config?: Partial<VoiceServiceConfig>): VoiceServiceConfig {
    return {
      recognition: {
        continuous: config?.recognition?.continuous ?? true,
        interimResults: config?.recognition?.interimResults ?? true,
        language: config?.recognition?.language ?? 'en-US',
        ...config?.recognition
      },
      synthesis: {
        voice: config?.synthesis?.voice ?? 'Google US English',
        rate: config?.synthesis?.rate ?? 1.0,
        pitch: config?.synthesis?.pitch ?? 1.0,
        volume: config?.synthesis?.volume ?? 1.0,
        ...config?.synthesis
      }
    };
  }

  private initializeRecognition(): void {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn('Speech recognition not supported');
      return;
    }

    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    this.recognition = new SpeechRecognitionAPI();

    if (this.recognition) {
      this.recognition.continuous = this.config.recognition.continuous;
      this.recognition.interimResults = this.config.recognition.interimResults;
      this.recognition.lang = this.config.recognition.language;

      this.recognition.onstart = () => {
        this.isListening = true;
        this.emit('recognition:start');
      };

      this.recognition.onresult = (event: SpeechRecognitionEvent) => {
        const results = event.results;
        const currentResult = results[results.length - 1];
        const transcript = currentResult[0].transcript;
        
        if (currentResult.isFinal) {
          this.emit('recognition:final', transcript);
        } else {
          this.emit('recognition:interim', transcript);
        }
      };

      this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error);
        this.emit('recognition:error', event.error);
        this.isListening = false;
      };

      this.recognition.onend = () => {
        this.isListening = false;
        this.emit('recognition:end');
      };
    }
  }

  // Speech Recognition Methods
  startListening(): boolean {
    if (!this.recognition) {
      console.error('Speech recognition not initialized');
      return false;
    }

    if (this.isListening) {
      console.warn('Already listening');
      return false;
    }

    try {
      this.recognition.start();
      return true;
    } catch (error) {
      console.error('Failed to start recognition:', error);
      return false;
    }
  }

  stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
  }

  abortListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.abort();
    }
  }

  // Speech Synthesis Methods
  speak(text: string, options?: Partial<SpeechSynthesisUtterance>): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.synthesis) {
        reject(new Error('Speech synthesis not supported'));
        return;
      }

      // Cancel any ongoing speech
      this.cancelSpeech();

      const utterance = new SpeechSynthesisUtterance(text);
      
      // Apply config
      utterance.rate = options?.rate || this.config.synthesis.rate;
      utterance.pitch = options?.pitch || this.config.synthesis.pitch;
      utterance.volume = options?.volume || this.config.synthesis.volume;
      
      // Set voice
      const voices = this.synthesis.getVoices();
      const selectedVoice = voices.find(voice => 
        voice.name.includes(this.config.synthesis.voice) ||
        voice.lang.startsWith(this.config.recognition.language.split('-')[0])
      );
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      utterance.onstart = () => {
        this.emit('synthesis:start');
      };

      utterance.onend = () => {
        this.currentUtterance = null;
        this.emit('synthesis:end');
        resolve();
      };

      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        this.emit('synthesis:error', event);
        reject(event);
      };

      this.currentUtterance = utterance;
      this.synthesis.speak(utterance);
    });
  }

  pauseSpeech(): void {
    if (this.synthesis && this.synthesis.speaking) {
      this.synthesis.pause();
      this.emit('synthesis:pause');
    }
  }

  resumeSpeech(): void {
    if (this.synthesis && this.synthesis.paused) {
      this.synthesis.resume();
      this.emit('synthesis:resume');
    }
  }

  cancelSpeech(): void {
    if (this.synthesis) {
      this.synthesis.cancel();
      this.currentUtterance = null;
      this.emit('synthesis:cancel');
    }
  }

  // Voice Commands Processing
  processVoiceCommand(transcript: string): {
    command: string;
    parameters: Record<string, any>;
    confidence: number;
  } | null {
    const lowerTranscript = transcript.toLowerCase().trim();
    
    // Workout logging patterns
    const workoutPatterns = [
      {
        pattern: /(?:i )?(?:just )?(?:did |completed |finished )?(\d+) (?:reps?|repetitions?) (?:of |on |with )?(.+?)(?:\s+(?:at|with|using)\s+(\d+)\s*(?:pounds?|lbs?|kilograms?|kgs?)?)?$/i,
        handler: (matches: RegExpMatchArray) => ({
          command: 'log_exercise',
          parameters: {
            exercise: matches[2].trim(),
            reps: parseInt(matches[1]),
            weight: matches[3] ? parseInt(matches[3]) : undefined
          },
          confidence: 0.9
        })
      },
      {
        pattern: /^(?:start|begin) (?:a )?(?:new )?workout$/i,
        handler: () => ({
          command: 'start_workout',
          parameters: {},
          confidence: 0.95
        })
      },
      {
        pattern: /^(?:end|finish|stop) (?:the )?workout$/i,
        handler: () => ({
          command: 'end_workout',
          parameters: {},
          confidence: 0.95
        })
      },
      {
        pattern: /^(?:start|begin) (?:a )?(?:rest )?timer(?: for (\d+) (?:seconds?|minutes?))?$/i,
        handler: (matches: RegExpMatchArray) => ({
          command: 'start_timer',
          parameters: {
            duration: matches[1] ? parseInt(matches[1]) : 60,
            unit: matches[0].includes('minute') ? 'minutes' : 'seconds'
          },
          confidence: 0.9
        })
      }
    ];

    // Check each pattern
    for (const { pattern, handler } of workoutPatterns) {
      const matches = lowerTranscript.match(pattern);
      if (matches) {
        return handler(matches);
      }
    }

    // If no pattern matches, return as general query
    return {
      command: 'general_query',
      parameters: { query: transcript },
      confidence: 0.7
    };
  }

  // Utility Methods
  getAvailableVoices(): SpeechSynthesisVoice[] {
    return this.synthesis ? this.synthesis.getVoices() : [];
  }

  setVoice(voiceName: string): void {
    this.config.synthesis.voice = voiceName;
  }

  setLanguage(language: string): void {
    this.config.recognition.language = language;
    if (this.recognition) {
      this.recognition.lang = language;
    }
  }

  isSupported(): { recognition: boolean; synthesis: boolean } {
    return {
      recognition: !!this.recognition,
      synthesis: !!this.synthesis
    };
  }

  getStatus(): {
    isListening: boolean;
    isSpeaking: boolean;
    isPaused: boolean;
  } {
    return {
      isListening: this.isListening,
      isSpeaking: this.synthesis?.speaking || false,
      isPaused: this.synthesis?.paused || false
    };
  }
}

// Export singleton instance
export const unifiedVoiceService = new UnifiedVoiceService();