import { realtimeVoice } from './realtimeVoice';
import { emotionalVoice } from './emotionalVoice';
import { webrtcVoice } from './webrtcService';

interface VoiceConfig {
  mode: 'openai-realtime' | 'elevenlabs' | 'webrtc' | 'browser';
  language: string;
  pitch: number;
  rate: number;
  volume: number;
  preferredVoice?: string;
  emotionalAdaptation: boolean;
}

interface VoiceMetrics {
  mode: string;
  latency: number;
  quality: 'low' | 'medium' | 'high';
  emotionalTone: string;
}

class VoiceService {
  private config: VoiceConfig = {
    mode: 'browser',
    language: 'en-US',
    pitch: 1.0,
    rate: 1.0,
    volume: 1.0,
    emotionalAdaptation: true
  };

  private synthesis: SpeechSynthesis | null = null;
  private recognition: any = null;
  private isListening = false;
  private isSpeaking = false;
  private currentMode: VoiceConfig['mode'] = 'browser';

  constructor() {
    this.initializeBrowserAPIs();
  }

  private initializeBrowserAPIs(): void {
    if ('speechSynthesis' in window) {
      this.synthesis = window.speechSynthesis;
    }

    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = this.config.language;
    }
  }

  async initialize(mode: VoiceConfig['mode'] = 'browser'): Promise<void> {
    this.currentMode = mode;
    this.config.mode = mode;

    try {
      switch (mode) {
        case 'openai-realtime':
          await realtimeVoice.initialize();
          break;
        case 'elevenlabs':
          await emotionalVoice.initialize();
          break;
        case 'webrtc':
          await webrtcVoice.initialize('user-123', 'client');
          break;
        case 'browser':
          // Already initialized
          break;
      }
    } catch (error) {
      console.error(`Failed to initialize ${mode} voice service:`, error);
      // Fallback to browser mode
      this.currentMode = 'browser';
      this.config.mode = 'browser';
    }
  }

  async speak(text: string, context?: any): Promise<void> {
    if (this.isSpeaking) {
      this.stopSpeaking();
    }

    this.isSpeaking = true;

    try {
      switch (this.currentMode) {
        case 'openai-realtime':
          // OpenAI Realtime handles speech internally
          console.log('Speaking via OpenAI Realtime:', text);
          break;

        case 'elevenlabs':
          // Use ElevenLabs streaming for ultra-low latency
          await emotionalVoice.streamText(text, context);
          break;

        case 'webrtc':
          // Send text through WebRTC data channel
          webrtcVoice.sendWorkoutContext({
            type: 'tts-request',
            text: text,
            context: context
          });
          // Fallback to browser TTS
          await this.browserSpeak(text);
          break;

        case 'browser':
          await this.browserSpeak(text);
          break;
      }
    } catch (error) {
      console.error('Speech failed:', error);
      // Fallback to browser TTS
      await this.browserSpeak(text);
    } finally {
      this.isSpeaking = false;
    }
  }

  private async browserSpeak(text: string): Promise<void> {
    if (!this.synthesis) {
      console.warn('Speech synthesis not available');
      return;
    }

    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = this.config.language;
      utterance.pitch = this.config.pitch;
      utterance.rate = this.config.rate;
      utterance.volume = this.config.volume;

      if (this.config.preferredVoice) {
        const voices = this.synthesis!.getVoices();
        const voice = voices.find(v => v.name === this.config.preferredVoice);
        if (voice) {
          utterance.voice = voice;
        }
      }

      utterance.onend = () => {
        this.isSpeaking = false;
        resolve();
      };

      utterance.onerror = () => {
        this.isSpeaking = false;
        resolve();
      };

      this.synthesis!.speak(utterance);
    });
  }

  stopSpeaking(): void {
    switch (this.currentMode) {
      case 'openai-realtime':
        realtimeVoice.handleInterruption();
        break;
      case 'browser':
        if (this.synthesis) {
          this.synthesis.cancel();
        }
        break;
    }
    this.isSpeaking = false;
  }

  startListening(onResult: (text: string, isFinal: boolean) => void): void {
    if (this.isListening) return;

    switch (this.currentMode) {
      case 'openai-realtime':
        // OpenAI Realtime handles listening internally
        console.log('Listening via OpenAI Realtime');
        this.isListening = true;
        break;

      case 'browser':
      case 'elevenlabs':
      case 'webrtc':
        if (!this.recognition) {
          console.warn('Speech recognition not available');
          return;
        }

        this.recognition.onresult = (event: any) => {
          const last = event.results.length - 1;
          const text = event.results[last][0].transcript;
          const isFinal = event.results[last].isFinal;
          onResult(text, isFinal);
        };

        this.recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          this.isListening = false;
        };

        this.recognition.onend = () => {
          this.isListening = false;
        };

        this.recognition.start();
        this.isListening = true;
        break;
    }
  }

  stopListening(): void {
    switch (this.currentMode) {
      case 'openai-realtime':
        console.log('Stopping OpenAI Realtime listening');
        break;

      case 'browser':
      case 'elevenlabs':
      case 'webrtc':
        if (this.recognition && this.isListening) {
          this.recognition.stop();
        }
        break;
    }
    this.isListening = false;
  }

  async setEmotionalTone(intensity: 'low' | 'medium' | 'high'): Promise<void> {
    if (!this.config.emotionalAdaptation) return;

    switch (this.currentMode) {
      case 'openai-realtime':
        await realtimeVoice.adaptEmotionalTone(intensity);
        break;
      case 'elevenlabs':
        await emotionalVoice.adaptToWorkoutContext({ intensity });
        break;
    }
  }

  async switchMode(newMode: VoiceConfig['mode']): Promise<void> {
    if (newMode === this.currentMode) return;

    // Stop current services
    this.stopListening();
    this.stopSpeaking();

    // Dispose current service
    switch (this.currentMode) {
      case 'openai-realtime':
        realtimeVoice.dispose();
        break;
      case 'elevenlabs':
        emotionalVoice.dispose();
        break;
      case 'webrtc':
        webrtcVoice.dispose();
        break;
    }

    // Initialize new mode
    await this.initialize(newMode);
  }

  getAvailableVoices(): SpeechSynthesisVoice[] {
    if (!this.synthesis) return [];
    return this.synthesis.getVoices();
  }

  setVoiceConfig(config: Partial<VoiceConfig>): void {
    this.config = { ...this.config, ...config };
    
    if (this.recognition && config.language) {
      this.recognition.lang = config.language;
    }
  }

  getMetrics(): VoiceMetrics {
    let metrics: any = {
      mode: this.currentMode,
      latency: 0,
      quality: 'medium' as const,
      emotionalTone: 'neutral'
    };

    switch (this.currentMode) {
      case 'openai-realtime':
        const realtimeMetrics = realtimeVoice.getMetrics();
        metrics.latency = realtimeMetrics.averageLatency;
        metrics.quality = realtimeMetrics.averageLatency < 300 ? 'high' : 'medium';
        break;

      case 'elevenlabs':
        const elevenMetrics = emotionalVoice.getMetrics();
        metrics.latency = elevenMetrics.averageLatency;
        metrics.quality = elevenMetrics.achievingTarget ? 'high' : 'medium';
        metrics.emotionalTone = elevenMetrics.emotionalAdaptations > 0 ? 'adaptive' : 'neutral';
        break;

      case 'webrtc':
        const webrtcMetrics = webrtcVoice.getMetrics();
        metrics.latency = webrtcMetrics.averageLatency;
        metrics.quality = webrtcMetrics.averageLatency < 100 ? 'high' : 'medium';
        break;

      case 'browser':
        metrics.latency = 150; // Approximate browser TTS latency
        metrics.quality = 'low';
        break;
    }

    return metrics;
  }

  isAvailable(): boolean {
    switch (this.currentMode) {
      case 'browser':
        return !!this.synthesis && !!this.recognition;
      case 'openai-realtime':
      case 'elevenlabs':
      case 'webrtc':
        return true; // Assume available if initialized
      default:
        return false;
    }
  }

  getStatus(): { isListening: boolean; isSpeaking: boolean; mode: string } {
    return {
      isListening: this.isListening,
      isSpeaking: this.isSpeaking,
      mode: this.currentMode
    };
  }
}

export const voiceService = new VoiceService();