// Fixed Voice Service for enhanced workout logger
export interface VoiceCommand {
  command: string;
  confidence: number;
  timestamp: Date;
}

export interface VoiceServiceConfig {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
}

class FixedVoiceService {
  private recognition: any = null;
  private synthesis: SpeechSynthesis | null = null;
  private isListening = false;
  private isSupported = false;

  constructor() {
    this.initializeServices();
  }

  private initializeServices() {
    // Initialize speech recognition
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      this.recognition = new SpeechRecognitionClass();
      this.isSupported = true;
    }

    // Initialize speech synthesis
    if ('speechSynthesis' in window) {
      this.synthesis = window.speechSynthesis;
    }
  }

  async startListening(config: VoiceServiceConfig = {}): Promise<boolean> {
    if (!this.recognition || this.isListening) return false;

    try {
      this.recognition.continuous = config.continuous ?? true;
      this.recognition.interimResults = config.interimResults ?? true;
      this.recognition.lang = config.language ?? 'en-US';

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

  onResult(callback: (result: string, confidence: number) => void): void {
    if (!this.recognition) return;

    this.recognition.onresult = (event: any) => {
      const result = event.results[event.resultIndex];
      const transcript = result[0].transcript;
      const confidence = result[0].confidence;
      callback(transcript, confidence);
    };
  }

  onError(callback: (error: string) => void): void {
    if (!this.recognition) return;

    this.recognition.onerror = (event: any) => {
      callback(event.error);
    };
  }

  isServiceSupported(): boolean {
    return this.isSupported;
  }

  getCurrentState() {
    return {
      isListening: this.isListening,
      isSupported: this.isSupported
    };
  }
}

// Export singleton instance
export const getFixedVoiceService = () => new FixedVoiceService();
