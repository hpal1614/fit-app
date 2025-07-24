import 'webrtc-adapter';
import { io, Socket } from 'socket.io-client';

interface RTCConfig {
  iceServers: RTCIceServer[];
  iceCandidatePoolSize: number;
}

interface AudioConfig {
  echoCancellation: boolean;
  noiseSuppression: boolean;
  autoGainControl: boolean;
  sampleRate: number;
  channelCount: number;
  latency: string;
}

interface SessionInfo {
  sessionId: string;
  userId: string;
  role: 'coach' | 'client';
  roomId?: string;
}

export class WebRTCVoiceService {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private audioContext: AudioContext;
  private socket: Socket | null = null;
  private sessionInfo: SessionInfo;
  private dataChannel: RTCDataChannel | null = null;
  
  // Audio processing nodes
  private compressor: DynamicsCompressorNode | null = null;
  private noiseGate: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  
  // Performance tracking
  private metrics = {
    latency: [] as number[],
    packetLoss: 0,
    jitter: [] as number[],
    connectionTime: 0
  };

  constructor() {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    this.sessionInfo = {
      sessionId: this.generateSessionId(),
      userId: '',
      role: 'client'
    };
  }

  async initialize(userId: string, role: 'coach' | 'client' = 'client'): Promise<void> {
    this.sessionInfo.userId = userId;
    this.sessionInfo.role = role;

    try {
      // Set up local audio stream
      await this.setupLocalStream();
      
      // Connect to signaling server
      await this.connectSignalingServer();
      
      // Set up WebRTC connection
      this.setupPeerConnection();
      
      console.log('WebRTC voice service initialized');
    } catch (error) {
      console.error('Failed to initialize WebRTC:', error);
      throw error;
    }
  }

  private async setupLocalStream(): Promise<void> {
    const audioConfig: AudioConfig = {
      echoCancellation: true,        // Essential for gym environments
      noiseSuppression: true,        // Filter background gym noise
      autoGainControl: true,         // Compensate for distance variations
      sampleRate: 16000,            // Optimized for voice
      channelCount: 1,              // Mono sufficient for coaching
      latency: 'interactive'        // Prioritize low latency
    };

    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: audioConfig as MediaTrackConstraints,
        video: false
      });

      // Set up audio processing
      this.setupAudioProcessing();
    } catch (error) {
      console.error('Failed to get user media:', error);
      throw error;
    }
  }

  private setupPeerConnection(): void {
    const config: RTCConfig = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        // Add TURN servers for better connectivity
        {
          urls: 'turn:turnserver.com:3478',
          username: import.meta.env.VITE_TURN_USERNAME || '',
          credential: import.meta.env.VITE_TURN_CREDENTIAL || ''
        }
      ],
      iceCandidatePoolSize: 10
    };

    this.peerConnection = new RTCPeerConnection(config);

    // Add local stream tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        this.peerConnection!.addTrack(track, this.localStream!);
      });
    }

    // Set up event handlers
    this.peerConnection.onicecandidate = this.handleIceCandidate.bind(this);
    this.peerConnection.ontrack = this.handleRemoteTrack.bind(this);
    this.peerConnection.onconnectionstatechange = this.handleConnectionStateChange.bind(this);
    this.peerConnection.oniceconnectionstatechange = this.handleIceConnectionStateChange.bind(this);

    // Set up data channel for low-latency metadata
    this.setupDataChannel();

    // Optimize for voice communication
    this.optimizeForVoice();
  }

  private setupDataChannel(): void {
    if (!this.peerConnection) return;

    // Create data channel for metadata and control messages
    const dataChannelOptions = {
      ordered: false,        // Don't guarantee order for lower latency
      maxRetransmits: 2,    // Limited retransmits for time-sensitive data
      protocol: 'fitness-metadata'
    };

    this.dataChannel = this.peerConnection.createDataChannel('fitness-metadata', dataChannelOptions);

    this.dataChannel.onopen = () => {
      console.log('Data channel opened');
      this.sendMetadata({ type: 'ping', timestamp: Date.now() });
    };

    this.dataChannel.onmessage = (event) => {
      this.handleDataChannelMessage(event.data);
    };

    this.dataChannel.onerror = (error) => {
      console.error('Data channel error:', error);
    };
  }

  private async optimizeForVoice(): Promise<void> {
    if (!this.peerConnection) return;

    // Get sender for audio track
    const audioSender = this.peerConnection.getSenders()
      .find(sender => sender.track?.kind === 'audio');

    if (audioSender) {
      const params = audioSender.getParameters();
      
      // Optimize for voice with Opus codec
      if (!params.encodings) {
        params.encodings = [{}];
      }

      params.encodings[0] = {
        ...params.encodings[0],
        maxBitrate: 64000,        // 64 kbps for voice
        dtx: true,                // Discontinuous transmission
        networkPriority: 'high',  // High priority for voice
        priority: 'high'
      };

      await audioSender.setParameters(params);

      // Force Opus codec if available
      const transceivers = this.peerConnection.getTransceivers();
      transceivers.forEach(transceiver => {
        if (transceiver.sender.track?.kind === 'audio') {
          const codecs = RTCRtpSender.getCapabilities('audio')?.codecs || [];
          const opusCodec = codecs.find(codec => codec.mimeType.toLowerCase() === 'audio/opus');
          
          if (opusCodec) {
            transceiver.setCodecPreferences([opusCodec]);
          }
        }
      });
    }
  }

  private setupAudioProcessing(): void {
    if (!this.localStream) return;

    const source = this.audioContext.createMediaStreamSource(this.localStream);

    // Dynamic range compression for consistent volume
    this.compressor = this.audioContext.createDynamicsCompressor();
    this.compressor.threshold.value = -24;
    this.compressor.knee.value = 30;
    this.compressor.ratio.value = 12;
    this.compressor.attack.value = 0.003;
    this.compressor.release.value = 0.25;

    // Noise gate to reduce background noise
    this.noiseGate = this.audioContext.createGain();
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 256;

    // Connect processing chain
    source.connect(this.analyser);
    this.analyser.connect(this.compressor);
    this.compressor.connect(this.noiseGate);

    // Implement noise gate logic
    this.implementNoiseGate();

    // Create processed stream
    const destination = this.audioContext.createMediaStreamDestination();
    this.noiseGate.connect(destination);

    // Replace original track with processed track
    const processedTrack = destination.stream.getAudioTracks()[0];
    const originalTrack = this.localStream.getAudioTracks()[0];
    
    if (this.peerConnection && this.peerConnection.getSenders().length > 0) {
      const sender = this.peerConnection.getSenders()
        .find(s => s.track === originalTrack);
      
      if (sender) {
        sender.replaceTrack(processedTrack);
      }
    }
  }

  private implementNoiseGate(): void {
    if (!this.analyser || !this.noiseGate) return;

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const noiseThreshold = 30; // Adjust based on environment

    const checkAudioLevel = () => {
      this.analyser!.getByteFrequencyData(dataArray);
      
      // Calculate average volume
      const average = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;
      
      // Apply noise gate
      if (average < noiseThreshold) {
        this.noiseGate!.gain.setTargetAtTime(0, this.audioContext.currentTime, 0.1);
      } else {
        this.noiseGate!.gain.setTargetAtTime(1, this.audioContext.currentTime, 0.1);
      }
      
      requestAnimationFrame(checkAudioLevel);
    };

    checkAudioLevel();
  }

  private async connectSignalingServer(): Promise<void> {
    const serverUrl = import.meta.env.VITE_SIGNALING_SERVER_URL || 'wss://localhost:3001';
    
    this.socket = io(serverUrl, {
      transports: ['websocket'],
      auth: {
        userId: this.sessionInfo.userId,
        role: this.sessionInfo.role,
        sessionId: this.sessionInfo.sessionId
      }
    });

    this.socket.on('connect', () => {
      console.log('Connected to signaling server');
      this.socket!.emit('join-room', {
        roomId: this.sessionInfo.roomId || 'default-gym',
        role: this.sessionInfo.role
      });
    });

    this.socket.on('offer', async (data: any) => {
      await this.handleOffer(data);
    });

    this.socket.on('answer', async (data: any) => {
      await this.handleAnswer(data);
    });

    this.socket.on('ice-candidate', async (data: any) => {
      await this.handleRemoteIceCandidate(data);
    });

    this.socket.on('user-joined', (data: any) => {
      console.log('User joined:', data);
      if (this.sessionInfo.role === 'coach') {
        // Coach initiates connection
        this.createOffer();
      }
    });

    this.socket.on('error', (error: any) => {
      console.error('Signaling error:', error);
    });
  }

  private async createOffer(): Promise<void> {
    if (!this.peerConnection) return;

    try {
      const offer = await this.peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: false
      });

      await this.peerConnection.setLocalDescription(offer);

      // Send offer through signaling server
      this.socket?.emit('offer', {
        offer: offer,
        to: 'all' // Broadcast to all clients in room
      });
    } catch (error) {
      console.error('Failed to create offer:', error);
    }
  }

  private async handleOffer(data: any): Promise<void> {
    if (!this.peerConnection) return;

    try {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
      
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);

      this.socket?.emit('answer', {
        answer: answer,
        to: data.from
      });
    } catch (error) {
      console.error('Failed to handle offer:', error);
    }
  }

  private async handleAnswer(data: any): Promise<void> {
    if (!this.peerConnection) return;

    try {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
    } catch (error) {
      console.error('Failed to handle answer:', error);
    }
  }

  private handleIceCandidate(event: RTCPeerConnectionIceEvent): void {
    if (event.candidate) {
      this.socket?.emit('ice-candidate', {
        candidate: event.candidate
      });
    }
  }

  private async handleRemoteIceCandidate(data: any): Promise<void> {
    if (!this.peerConnection) return;

    try {
      await this.peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
    } catch (error) {
      console.error('Failed to add ICE candidate:', error);
    }
  }

  private handleRemoteTrack(event: RTCTrackEvent): void {
    console.log('Received remote track');
    
    if (!this.remoteStream) {
      this.remoteStream = new MediaStream();
    }

    this.remoteStream.addTrack(event.track);

    // Play remote audio
    const audio = new Audio();
    audio.srcObject = this.remoteStream;
    audio.autoplay = true;
    
    // Apply audio processing to remote stream if needed
    this.processRemoteAudio(this.remoteStream);
  }

  private processRemoteAudio(stream: MediaStream): void {
    const source = this.audioContext.createMediaStreamSource(stream);
    const gainNode = this.audioContext.createGain();
    
    // Adjust volume if needed
    gainNode.gain.value = 1.0;
    
    source.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
  }

  private handleConnectionStateChange(): void {
    const state = this.peerConnection?.connectionState;
    console.log('Connection state:', state);

    if (state === 'connected') {
      this.metrics.connectionTime = Date.now();
      this.startLatencyMeasurement();
    }
  }

  private handleIceConnectionStateChange(): void {
    const state = this.peerConnection?.iceConnectionState;
    console.log('ICE connection state:', state);

    if (state === 'failed' || state === 'disconnected') {
      this.attemptReconnection();
    }
  }

  private handleDataChannelMessage(data: string): void {
    try {
      const message = JSON.parse(data);
      
      switch (message.type) {
        case 'ping':
          // Respond to ping for latency measurement
          this.sendMetadata({
            type: 'pong',
            originalTimestamp: message.timestamp,
            timestamp: Date.now()
          });
          break;
          
        case 'pong':
          // Calculate round-trip latency
          const latency = (Date.now() - message.originalTimestamp) / 2;
          this.metrics.latency.push(latency);
          console.log(`Voice latency: ${latency}ms`);
          break;
          
        case 'workout-update':
          // Handle workout context updates
          this.handleWorkoutUpdate(message.data);
          break;
      }
    } catch (error) {
      console.error('Failed to parse data channel message:', error);
    }
  }

  private sendMetadata(data: any): void {
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      this.dataChannel.send(JSON.stringify(data));
    }
  }

  private startLatencyMeasurement(): void {
    // Measure latency every 5 seconds
    setInterval(() => {
      this.sendMetadata({ type: 'ping', timestamp: Date.now() });
    }, 5000);
  }

  private handleWorkoutUpdate(data: any): void {
    // Process workout context updates received via data channel
    console.log('Workout update received:', data);
  }

  private async attemptReconnection(): Promise<void> {
    console.log('Attempting WebRTC reconnection...');
    
    // Clean up existing connection
    if (this.peerConnection) {
      this.peerConnection.close();
    }

    // Wait before reconnecting
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Reinitialize connection
    this.setupPeerConnection();
    
    // Rejoin room
    this.socket?.emit('join-room', {
      roomId: this.sessionInfo.roomId || 'default-gym',
      role: this.sessionInfo.role
    });
  }

  // Public methods

  async joinRoom(roomId: string): Promise<void> {
    this.sessionInfo.roomId = roomId;
    
    if (this.socket?.connected) {
      this.socket.emit('join-room', {
        roomId: roomId,
        role: this.sessionInfo.role
      });
    }
  }

  setMute(muted: boolean): void {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = !muted;
      });
    }
  }

  setVolume(volume: number): void {
    // Volume should be between 0 and 1
    const clampedVolume = Math.max(0, Math.min(1, volume));
    
    if (this.noiseGate) {
      this.noiseGate.gain.value = clampedVolume;
    }
  }

  sendWorkoutContext(context: any): void {
    this.sendMetadata({
      type: 'workout-update',
      data: context
    });
  }

  getMetrics(): any {
    const avgLatency = this.metrics.latency.length > 0
      ? this.metrics.latency.reduce((a, b) => a + b, 0) / this.metrics.latency.length
      : 0;

    return {
      averageLatency: Math.round(avgLatency),
      connectionState: this.peerConnection?.connectionState,
      iceConnectionState: this.peerConnection?.iceConnectionState,
      audioLevel: this.getAudioLevel(),
      packetLoss: this.metrics.packetLoss
    };
  }

  private getAudioLevel(): number {
    if (!this.analyser) return 0;

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyser.getByteFrequencyData(dataArray);

    const average = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;
    return average / 255; // Normalize to 0-1
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Clean up resources
  dispose(): void {
    // Close peer connection
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    // Disconnect from signaling server
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    // Close audio context
    this.audioContext.close();
  }
}

// Export singleton instance
export const webrtcVoice = new WebRTCVoiceService();