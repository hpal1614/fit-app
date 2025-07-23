interface VoiceSettings {
  stability: number;
  similarity_boost: number;
  style: number;
  use_speaker_boost: boolean;
}

interface EmotionalConfig {
  stability: number;
  similarity: number;
  expressiveness: number;
}

interface WorkoutContext {
  intensity: 'low' | 'medium' | 'high';
  exerciseType?: string;
  repCount?: number;
  setNumber?: number;
  fatigueLevelDetected?: number;
  userMood?: 'motivated' | 'neutral' | 'struggling';
}

export class EmotionalVoiceService {
  private websocket: WebSocket | null = null;
  private voiceId: string = 'EXAVITQu4vr4xnSDxMaL'; // Default voice ID
  private customVoiceId: string | null = null;
  private voiceSettings: VoiceSettings;
  private audioContext: AudioContext;
  private isStreaming = false;
  private audioQueue: ArrayBuffer[] = [];
  private streamId: string | null = null;
  
  // Performance tracking
  private metrics = {
    latency: [] as number[],
    streamingLatency: [] as number[],
    emotionalAdaptations: 0
  };

  constructor() {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    this.voiceSettings = {
      stability: 0.8,        // High stability for clear instructions
      similarity_boost: 0.9, // Maintain voice consistency
      style: 0.5,           // Balanced expressiveness
      use_speaker_boost: true
    };
  }

  async initialize(): Promise<void> {
    try {
      // Connect to ElevenLabs WebSocket for ultra-low latency
      await this.connectWebSocket();
      console.log('ElevenLabs Flash v2.5 initialized');
    } catch (error) {
      console.error('Failed to initialize ElevenLabs:', error);
      throw error;
    }
  }

  private async connectWebSocket(): Promise<void> {
    const wsUrl = `wss://api.elevenlabs.io/v1/text-to-speech/${this.voiceId}/stream-input?model_id=eleven_flash_v2_5&optimize_streaming_latency=4`;
    
    this.websocket = new WebSocket(wsUrl, {
      headers: {
        'xi-api-key': import.meta.env.VITE_ELEVENLABS_API_KEY || ''
      }
    } as any);

    this.websocket.binaryType = 'arraybuffer';

    this.websocket.onopen = () => {
      console.log('Connected to ElevenLabs WebSocket');
      this.sendInitialConfiguration();
    };

    this.websocket.onmessage = (event) => {
      this.handleStreamingAudio(event.data);
    };

    this.websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.reconnect();
    };

    this.websocket.onclose = () => {
      console.log('Disconnected from ElevenLabs');
      this.isStreaming = false;
    };
  }

  private sendInitialConfiguration(): void {
    if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) return;

    const config = {
      text: ' ',
      voice_settings: this.voiceSettings,
      generation_config: {
        chunk_length_schedule: [75], // 75ms chunks for ultra-low latency
      }
    };

    this.websocket.send(JSON.stringify(config));
  }

  // Real-time emotional adaptation based on workout context
  async adaptToWorkoutContext(context: WorkoutContext): Promise<void> {
    const emotionalConfig = this.calculateEmotionalConfig(context);
    
    this.voiceSettings = {
      stability: emotionalConfig.stability,
      similarity_boost: emotionalConfig.similarity,
      style: emotionalConfig.expressiveness,
      use_speaker_boost: true
    };

    this.metrics.emotionalAdaptations++;
    
    // Apply settings to next audio generation
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      this.sendVoiceSettings();
    }
  }

  private calculateEmotionalConfig(context: WorkoutContext): EmotionalConfig {
    let config: EmotionalConfig = {
      stability: 0.8,
      similarity: 0.9,
      expressiveness: 0.5
    };

    // Adjust based on workout intensity
    switch (context.intensity) {
      case 'low':
        // Calm, instructional tone
        config.stability = 0.9;
        config.expressiveness = 0.3;
        break;
      
      case 'medium':
        // Encouraging, balanced tone
        config.stability = 0.8;
        config.expressiveness = 0.6;
        break;
      
      case 'high':
        // Highly energetic, motivational tone
        config.stability = 0.7;
        config.expressiveness = 0.9;
        break;
    }

    // Further adjust based on user state
    if (context.userMood === 'struggling') {
      // More supportive, less intense
      config.stability += 0.1;
      config.expressiveness = Math.max(0.4, config.expressiveness - 0.2);
    } else if (context.userMood === 'motivated') {
      // Match their energy
      config.expressiveness = Math.min(1.0, config.expressiveness + 0.1);
    }

    // Fatigue adjustment
    if (context.fatigueLevelDetected && context.fatigueLevelDetected > 0.7) {
      // Calmer, more supportive when user is fatigued
      config.stability = 0.9;
      config.expressiveness = Math.max(0.3, config.expressiveness - 0.3);
    }

    return config;
  }

  // Stream text to speech with emotional adaptation
  async streamText(text: string, context?: WorkoutContext): Promise<void> {
    if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }

    const startTime = Date.now();
    
    // Adapt voice to context if provided
    if (context) {
      await this.adaptToWorkoutContext(context);
    }

    // Generate unique stream ID
    this.streamId = `stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Send text for streaming
    const message = {
      text: text,
      voice_settings: this.voiceSettings,
      generation_config: {
        chunk_length_schedule: [75], // 75ms chunks
      },
      stream_id: this.streamId
    };

    this.websocket.send(JSON.stringify(message));
    this.isStreaming = true;

    // Track latency
    this.metrics.streamingLatency.push(Date.now() - startTime);
  }

  private sendVoiceSettings(): void {
    if (!this.websocket) return;

    const message = {
      voice_settings: this.voiceSettings
    };

    this.websocket.send(JSON.stringify(message));
  }

  private handleStreamingAudio(data: ArrayBuffer | string): void {
    if (typeof data === 'string') {
      // Handle JSON messages
      const message = JSON.parse(data);
      if (message.error) {
        console.error('ElevenLabs error:', message.error);
      }
      return;
    }

    // Handle audio data
    this.audioQueue.push(data);
    
    if (!this.isStreaming) {
      this.playAudioQueue();
    }
  }

  private async playAudioQueue(): Promise<void> {
    if (this.audioQueue.length === 0) {
      this.isStreaming = false;
      return;
    }

    this.isStreaming = true;
    const audioData = this.audioQueue.shift()!;
    
    try {
      // Decode MP3 audio data
      const audioBuffer = await this.audioContext.decodeAudioData(audioData);
      
      // Play audio
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioContext.destination);
      
      source.onended = () => {
        this.playAudioQueue(); // Play next chunk
      };
      
      source.start();
      
      // Track actual playback latency
      const latency = Date.now() - (source as any).startTime;
      if (latency) {
        this.metrics.latency.push(latency);
      }
    } catch (error) {
      console.error('Audio playback error:', error);
      this.playAudioQueue(); // Continue with next chunk
    }
  }

  // Standard TTS API fallback for non-streaming needs
  async synthesizeSpeech(text: string, context?: WorkoutContext): Promise<ArrayBuffer> {
    const startTime = Date.now();
    
    if (context) {
      await this.adaptToWorkoutContext(context);
    }

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${this.voiceId}/stream`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': import.meta.env.VITE_ELEVENLABS_API_KEY || ''
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_flash_v2_5', // SPECIFIC MODEL VERSION
        voice_settings: this.voiceSettings,
        optimize_streaming_latency: 4, // Maximum optimization for 75ms target
        output_format: 'mp3_44100_128' // Optimized for quality vs latency
      })
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.statusText}`);
    }

    const audioData = await response.arrayBuffer();
    
    // Track latency
    const latency = Date.now() - startTime;
    this.metrics.latency.push(latency);
    console.log(`TTS latency: ${latency}ms`);
    
    return audioData;
  }

  // Voice cloning for personalized coaching
  async createCustomCoachVoice(audioSample: ArrayBuffer, name: string = 'Personal_Trainer_Voice'): Promise<string> {
    // Validate audio sample (must be at least 6 seconds)
    if (audioSample.byteLength < 6 * 44100 * 2) { // Assuming 44.1kHz, 16-bit
      throw new Error('Audio sample must be at least 6 seconds long');
    }

    const formData = new FormData();
    formData.append('name', name);
    formData.append('files', new Blob([audioSample], { type: 'audio/wav' }), 'voice_sample.wav');
    formData.append('description', 'Personalized fitness coach voice created with user sample');

    const response = await fetch('https://api.elevenlabs.io/v1/voices/add', {
      method: 'POST',
      headers: {
        'xi-api-key': import.meta.env.VITE_ELEVENLABS_API_KEY || ''
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Voice cloning failed: ${response.statusText}`);
    }

    const result = await response.json();
    this.customVoiceId = result.voice_id;
    
    console.log(`Custom voice created: ${this.customVoiceId}`);
    return this.customVoiceId;
  }

  // Switch between voices
  setVoice(voiceId: string): void {
    this.voiceId = voiceId;
    
    // Reconnect WebSocket with new voice
    if (this.websocket) {
      this.websocket.close();
      this.connectWebSocket();
    }
  }

  // Use custom voice if available
  useCustomVoice(): void {
    if (this.customVoiceId) {
      this.setVoice(this.customVoiceId);
    }
  }

  // Get available voices
  async getAvailableVoices(): Promise<any[]> {
    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: {
        'xi-api-key': import.meta.env.VITE_ELEVENLABS_API_KEY || ''
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch voices: ${response.statusText}`);
    }

    const data = await response.json();
    return data.voices;
  }

  // Get performance metrics
  getMetrics(): any {
    const avgLatency = this.metrics.latency.length > 0
      ? this.metrics.latency.reduce((a, b) => a + b, 0) / this.metrics.latency.length
      : 0;

    const avgStreamingLatency = this.metrics.streamingLatency.length > 0
      ? this.metrics.streamingLatency.reduce((a, b) => a + b, 0) / this.metrics.streamingLatency.length
      : 0;

    return {
      averageLatency: Math.round(avgLatency),
      averageStreamingLatency: Math.round(avgStreamingLatency),
      emotionalAdaptations: this.metrics.emotionalAdaptations,
      targetLatency: 75,
      achievingTarget: avgLatency <= 75
    };
  }

  // Reconnection logic
  private async reconnect(): Promise<void> {
    console.log('Attempting to reconnect to ElevenLabs...');
    
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
    await this.connectWebSocket();
  }

  // Clean up resources
  dispose(): void {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }

    this.audioQueue = [];
    this.isStreaming = false;
  }
}

// Export singleton instance
export const emotionalVoice = new EmotionalVoiceService();