import { aiService } from './aiService';

interface RealtimeConfig {
  apiKey: string;
  voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
  turnDetection: {
    type: 'server_vad';
    threshold?: number;
    prefixPadding?: number;
    silenceDuration?: number;
  };
  instructions: string;
}

interface AudioProcessor {
  processAudio(audioData: ArrayBuffer): Promise<ArrayBuffer>;
  detectSpeech(audioData: ArrayBuffer): boolean;
  normalizeVolume(audioData: ArrayBuffer): ArrayBuffer;
}

export class RealtimeVoiceService {
  private audioContext: AudioContext;
  private mediaStream: MediaStream | null = null;
  private audioProcessor: ScriptProcessorNode | null = null;
  private websocket: WebSocket | null = null;
  private config: RealtimeConfig;
  private isConnected = false;
  private audioQueue: ArrayBuffer[] = [];
  private isSpeaking = false;
  private conversationContext: any = {};
  
  // Performance metrics
  private metrics = {
    latency: [] as number[],
    interruptions: 0,
    successfulExchanges: 0
  };

  constructor() {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Configure for fitness coaching
    this.config = {
      apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
      voice: 'alloy',
      turnDetection: {
        type: 'server_vad',
        threshold: 0.5,
        prefixPadding: 300,
        silenceDuration: 200
      },
      instructions: `You are an expert fitness coach with deep knowledge of exercise physiology, 
                     biomechanics, and motivational psychology. Provide real-time coaching with 
                     appropriate energy levels based on workout intensity. Be concise in voice 
                     responses but informative. Adjust your tone based on the user's energy level.`
    };
  }

  async initialize(): Promise<void> {
    try {
      // Request microphone access
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000
        }
      });

      // Set up audio processing
      this.setupAudioProcessing();
      
      // Connect to realtime endpoint
      await this.connectToRealtimeAPI();
      
      console.log('Realtime voice service initialized');
    } catch (error) {
      console.error('Failed to initialize realtime voice:', error);
      throw error;
    }
  }

  private async connectToRealtimeAPI(): Promise<void> {
    // In production, this would connect to OpenAI's realtime API
    // For now, we'll simulate the connection with WebSocket
    const wsUrl = import.meta.env.VITE_REALTIME_WS_URL || 'wss://api.openai.com/v1/realtime';
    
    this.websocket = new WebSocket(wsUrl);
    
    this.websocket.onopen = () => {
      this.isConnected = true;
      this.sendConfiguration();
      console.log('Connected to realtime API');
    };

    this.websocket.onmessage = async (event) => {
      const data = JSON.parse(event.data);
      await this.handleRealtimeMessage(data);
    };

    this.websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.reconnect();
    };

    this.websocket.onclose = () => {
      this.isConnected = false;
      console.log('Disconnected from realtime API');
    };
  }

  private sendConfiguration(): void {
    if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) return;

    const config = {
      type: 'session.update',
      session: {
        modalities: ['text', 'audio'],
        instructions: this.config.instructions,
        voice: this.config.voice,
        input_audio_format: 'pcm16',
        output_audio_format: 'pcm16',
        input_audio_transcription: {
          model: 'whisper-1'
        },
        turn_detection: this.config.turnDetection,
        tools: [],
        tool_choice: 'auto',
        temperature: 0.8,
        max_response_output_tokens: 4096
      }
    };

    this.websocket.send(JSON.stringify(config));
  }

  private setupAudioProcessing(): void {
    if (!this.mediaStream) return;

    const source = this.audioContext.createMediaStreamSource(this.mediaStream);
    this.audioProcessor = this.audioContext.createScriptProcessor(4096, 1, 1);

    this.audioProcessor.onaudioprocess = (event) => {
      if (!this.isConnected) return;

      const inputData = event.inputBuffer.getChannelData(0);
      const audioData = this.convertFloat32ToPCM16(inputData);
      
      // Send audio chunks to the API
      this.sendAudioChunk(audioData);
    };

    source.connect(this.audioProcessor);
    this.audioProcessor.connect(this.audioContext.destination);
  }

  private convertFloat32ToPCM16(float32Array: Float32Array): ArrayBuffer {
    const buffer = new ArrayBuffer(float32Array.length * 2);
    const view = new DataView(buffer);
    
    for (let i = 0; i < float32Array.length; i++) {
      const sample = Math.max(-1, Math.min(1, float32Array[i]));
      view.setInt16(i * 2, sample * 0x7FFF, true);
    }
    
    return buffer;
  }

  private sendAudioChunk(audioData: ArrayBuffer): void {
    if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) return;

    const base64Audio = this.arrayBufferToBase64(audioData);
    
    const message = {
      type: 'input_audio_buffer.append',
      audio: base64Audio
    };

    this.websocket.send(JSON.stringify(message));
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private async handleRealtimeMessage(data: any): Promise<void> {
    const startTime = Date.now();

    switch (data.type) {
      case 'response.audio.delta':
        // Received audio chunk
        const audioData = this.base64ToArrayBuffer(data.delta);
        this.audioQueue.push(audioData);
        
        // Start playing if not already
        if (!this.isSpeaking) {
          this.playAudioQueue();
        }
        break;

      case 'response.audio.done':
        // Audio response complete
        const latency = Date.now() - startTime;
        this.metrics.latency.push(latency);
        this.metrics.successfulExchanges++;
        console.log(`Response latency: ${latency}ms`);
        break;

      case 'response.text.done':
        // Text response available
        if (data.text) {
          // Update AI service with the response for consistency
          await aiService.sendMessage(data.text);
        }
        break;

      case 'input_audio_buffer.speech_started':
        // User started speaking - prepare for interruption
        this.handleInterruption();
        break;

      case 'input_audio_buffer.speech_stopped':
        // User stopped speaking
        this.commitAudioBuffer();
        break;

      case 'error':
        console.error('Realtime API error:', data.error);
        break;
    }
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  private async playAudioQueue(): Promise<void> {
    if (this.audioQueue.length === 0) {
      this.isSpeaking = false;
      return;
    }

    this.isSpeaking = true;
    const audioData = this.audioQueue.shift()!;
    
    // Convert PCM16 to Float32 for Web Audio API
    const float32Array = this.convertPCM16ToFloat32(audioData);
    
    // Create audio buffer
    const audioBuffer = this.audioContext.createBuffer(1, float32Array.length, 16000);
    audioBuffer.getChannelData(0).set(float32Array);
    
    // Play audio
    const source = this.audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.audioContext.destination);
    
    source.onended = () => {
      this.playAudioQueue(); // Play next chunk
    };
    
    source.start();
  }

  private convertPCM16ToFloat32(pcm16: ArrayBuffer): Float32Array {
    const view = new DataView(pcm16);
    const float32 = new Float32Array(pcm16.byteLength / 2);
    
    for (let i = 0; i < float32.length; i++) {
      const sample = view.getInt16(i * 2, true);
      float32[i] = sample / 0x7FFF;
    }
    
    return float32;
  }

  // Real-time interruption handling
  async handleInterruption(): Promise<void> {
    if (!this.websocket || !this.isSpeaking) return;

    this.metrics.interruptions++;
    
    // Cancel current response
    const cancelMessage = {
      type: 'response.cancel'
    };
    
    this.websocket.send(JSON.stringify(cancelMessage));
    
    // Clear audio queue
    this.audioQueue = [];
    this.isSpeaking = false;
    
    console.log('Response interrupted by user');
  }

  // Commit audio buffer to trigger response
  private commitAudioBuffer(): void {
    if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) return;

    const message = {
      type: 'input_audio_buffer.commit'
    };

    this.websocket.send(JSON.stringify(message));
  }

  // Contextual emotion adaptation for fitness coaching
  async adaptEmotionalTone(workoutIntensity: 'low' | 'medium' | 'high'): Promise<void> {
    const emotionalConfig = {
      low: { 
        instructions: 'Be calm, instructional, and supportive. Focus on form and technique.',
        voice: 'nova' as const,
        temperature: 0.7
      },
      medium: { 
        instructions: 'Be encouraging and energetic. Provide motivation while maintaining clarity.',
        voice: 'alloy' as const,
        temperature: 0.8
      },
      high: { 
        instructions: 'Be highly energetic and motivational! Push the user with enthusiasm!',
        voice: 'echo' as const,
        temperature: 0.9
      }
    };

    const config = emotionalConfig[workoutIntensity];
    
    this.config.instructions = config.instructions;
    this.config.voice = config.voice;
    
    // Update session configuration
    this.sendConfiguration();
    
    // Update conversation context
    this.conversationContext.workoutIntensity = workoutIntensity;
  }

  // Add conversation context
  updateContext(context: any): void {
    this.conversationContext = { ...this.conversationContext, ...context };
    
    // Send context update
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      const message = {
        type: 'conversation.item.create',
        item: {
          type: 'message',
          role: 'system',
          content: [{
            type: 'text',
            text: `Current workout context: ${JSON.stringify(context)}`
          }]
        }
      };
      
      this.websocket.send(JSON.stringify(message));
    }
  }

  // Get performance metrics
  getMetrics(): any {
    const avgLatency = this.metrics.latency.length > 0
      ? this.metrics.latency.reduce((a, b) => a + b, 0) / this.metrics.latency.length
      : 0;

    return {
      averageLatency: Math.round(avgLatency),
      interruptions: this.metrics.interruptions,
      successfulExchanges: this.metrics.successfulExchanges,
      interruptionRate: this.metrics.successfulExchanges > 0
        ? (this.metrics.interruptions / this.metrics.successfulExchanges) * 100
        : 0
    };
  }

  // Reconnection logic
  private async reconnect(): Promise<void> {
    console.log('Attempting to reconnect...');
    this.isConnected = false;
    
    // Clean up existing connection
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }

    // Wait before reconnecting
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Attempt reconnection
    await this.connectToRealtimeAPI();
  }

  // Clean up resources
  dispose(): void {
    if (this.audioProcessor) {
      this.audioProcessor.disconnect();
      this.audioProcessor = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }

    this.audioContext.close();
  }
}

// Export singleton instance
export const realtimeVoice = new RealtimeVoiceService();