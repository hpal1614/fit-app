export interface SimpleVoiceState {
  isListening: boolean;
  isSpeaking: boolean;
  error: string | null;
  transcript: string;
  confidence: number;
  permissionGranted: boolean;
}

export class FixedVoiceService {
  private recognition: any = null;
  private synthesis: SpeechSynthesis;
  private state: SimpleVoiceState = {
    isListening: false,
    isSpeaking: false,
    error: null,
    transcript: '',
    confidence: 0,
    permissionGranted: false
  };
  
  private listeners: Array<(state: SimpleVoiceState) => void> = [];
  private restartAttempts = 0;
  private maxRestartAttempts = 3;

  constructor() {
    this.synthesis = window.speechSynthesis;
  }

  // Initialize with proper error handling
  async initialize(): Promise<boolean> {
    console.log('🎤 Starting voice service initialization...');
    
    try {
      // Step 1: Check browser support
      if (!this.checkBrowserSupport()) {
        this.setError('Voice features not supported in this browser');
        return false;
      }

      // Step 2: Request microphone permission FIRST
      const permissionGranted = await this.requestMicrophonePermission();
      if (!permissionGranted) {
        this.setError('Microphone permission denied. Please allow microphone access.');
        return false;
      }

      // Step 3: Initialize speech recognition
      const recognitionReady = await this.initializeSpeechRecognition();
      if (!recognitionReady) {
        this.setError('Failed to initialize speech recognition');
        return false;
      }

      console.log('✅ Voice service initialized successfully');
      this.state.error = null;
      this.notifyListeners();
      return true;

    } catch (error) {
      console.error('❌ Voice initialization failed:', error);
      this.setError(`Initialization failed: ${error.message}`);
      return false;
    }
  }

  // Check browser support
  private checkBrowserSupport(): boolean {
    const hasRecognition = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
    const hasSynthesis = !!window.speechSynthesis;
    const hasMediaDevices = !!navigator.mediaDevices?.getUserMedia;

    console.log('Browser support check:', {
      recognition: hasRecognition,
      synthesis: hasSynthesis,
      mediaDevices: hasMediaDevices
    });

    return hasRecognition && hasSynthesis && hasMediaDevices;
  }

  // Request microphone permission with proper handling
  private async requestMicrophonePermission(): Promise<boolean> {
    try {
      console.log('🎤 Requesting microphone permission...');
      
      // First check if permission is already granted
      const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      console.log('Current microphone permission:', permissionStatus.state);

      if (permissionStatus.state === 'granted') {
        this.state.permissionGranted = true;
        return true;
      }

      // Request access to microphone
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      console.log('✅ Microphone permission granted');
      
      // Stop the stream immediately (we just needed permission)
      stream.getTracks().forEach(track => track.stop());
      
      this.state.permissionGranted = true;
      return true;

    } catch (error) {
      console.error('❌ Microphone permission denied:', error);
      this.state.permissionGranted = false;
      
      if (error.name === 'NotAllowedError') {
        this.setError('Microphone access denied. Please click the microphone icon in your browser address bar and allow access.');
      } else if (error.name === 'NotFoundError') {
        this.setError('No microphone found. Please connect a microphone and try again.');
      } else {
        this.setError(`Microphone error: ${error.message}`);
      }
      
      return false;
    }
  }

  // Initialize speech recognition with robust event handling
  private async initializeSpeechRecognition(): Promise<boolean> {
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        throw new Error('Speech Recognition API not available');
      }

      this.recognition = new SpeechRecognition();
      
      // Configure recognition
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';
      this.recognition.maxAlternatives = 1;

      // Set up event handlers with detailed logging
      this.recognition.onstart = () => {
        console.log('🎤 Speech recognition started');
        this.state.isListening = true;
        this.state.error = null;
        this.restartAttempts = 0;
        this.notifyListeners();
      };

      this.recognition.onresult = (event: any) => {
        console.log('🎤 Speech recognition result received');
        
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcript = result[0].transcript;
          const confidence = result[0].confidence || 0;

          if (result.isFinal) {
            finalTranscript += transcript;
            console.log('🎤 Final transcript:', transcript, 'Confidence:', confidence);
          } else {
            interimTranscript += transcript;
            console.log('🎤 Interim transcript:', transcript);
          }

          this.state.confidence = confidence;
        }

        this.state.transcript = interimTranscript || finalTranscript;
        this.notifyListeners();

        // Process final transcript
        if (finalTranscript.trim()) {
          this.processFinalTranscript(finalTranscript.trim());
        }
      };

      this.recognition.onerror = (event: any) => {
        console.error('❌ Speech recognition error:', event.error);
        
        const errorMessages = {
          'no-speech': 'No speech detected. Try speaking louder or closer to the microphone.',
          'audio-capture': 'Audio capture failed. Check your microphone connection.',
          'not-allowed': 'Microphone permission denied. Please allow microphone access.',
          'network': 'Network error. Check your internet connection.',
          'service-not-allowed': 'Speech recognition service not allowed.',
          'bad-grammar': 'Speech recognition error occurred.',
          'language-not-supported': 'Language not supported.'
        };

        const errorMessage = errorMessages[event.error as keyof typeof errorMessages] 
          || `Speech recognition error: ${event.error}`;
        
        this.setError(errorMessage);

        // Don't try to restart on certain errors
        if (['not-allowed', 'service-not-allowed'].includes(event.error)) {
          this.state.isListening = false;
          this.notifyListeners();
          return;
        }

        // Auto-restart on recoverable errors
        this.attemptRestart();
      };

      this.recognition.onend = () => {
        console.log('🎤 Speech recognition ended');
        this.state.isListening = false;
        this.notifyListeners();

        // Auto-restart if we were in continuous mode and didn't stop intentionally
        if (this.restartAttempts < this.maxRestartAttempts && !this.state.error) {
          console.log('🔄 Auto-restarting speech recognition...');
          setTimeout(() => this.attemptRestart(), 100);
        }
      };

      return true;

    } catch (error) {
      console.error('❌ Failed to initialize speech recognition:', error);
      this.setError(`Recognition setup failed: ${error.message}`);
      return false;
    }
  }

  // Start listening with user gesture activation
  async startListening(): Promise<boolean> {
    console.log('🎤 Starting listening...');
    
    if (!this.state.permissionGranted) {
      const granted = await this.requestMicrophonePermission();
      if (!granted) return false;
    }

    if (!this.recognition) {
      this.setError('Speech recognition not initialized');
      return false;
    }

    try {
      // CRITICAL: Resume audio context with user gesture
      if (window.AudioContext) {
        const audioContext = new AudioContext();
        if (audioContext.state === 'suspended') {
          await audioContext.resume();
          console.log('✅ Audio context resumed');
        }
        audioContext.close();
      }

      // Start recognition
      this.recognition.start();
      console.log('🎤 Recognition start() called');
      
      return true;

    } catch (error) {
      console.error('❌ Failed to start listening:', error);
      
      if (error.name === 'InvalidStateError') {
        // Recognition is already running, this is actually OK
        console.log('ℹ️ Recognition already running');
        return true;
      }
      
      this.setError(`Failed to start listening: ${error.message}`);
      return false;
    }
  }

  // Stop listening
  stopListening(): void {
    console.log('🛑 Stopping listening...');
    
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (error) {
        console.error('Error stopping recognition:', error);
      }
    }
    
    this.state.isListening = false;
    this.state.transcript = '';
    this.restartAttempts = this.maxRestartAttempts; // Prevent auto-restart
    this.notifyListeners();
  }

  // Attempt to restart recognition
  private attemptRestart(): void {
    if (this.restartAttempts >= this.maxRestartAttempts) {
      console.log('⚠️ Max restart attempts reached');
      this.setError('Voice recognition stopped. Click the microphone button to restart.');
      return;
    }

    this.restartAttempts++;
    console.log(`🔄 Restart attempt ${this.restartAttempts}/${this.maxRestartAttempts}`);

    setTimeout(() => {
      if (this.recognition && !this.state.isListening) {
        try {
          this.recognition.start();
        } catch (error) {
          console.error('Failed to restart recognition:', error);
          this.setError('Failed to restart voice recognition');
        }
      }
    }, 1000);
  }

  // Process final transcript
  private processFinalTranscript(transcript: string): void {
    console.log('🗣️ Processing final transcript:', transcript);
    
    // Emit event for components to handle
    this.listeners.forEach(listener => {
      try {
        listener({
          ...this.state,
          transcript: transcript
        });
      } catch (error) {
        console.error('Error in transcript listener:', error);
      }
    });
  }

  // Speak with better error handling
  async speak(text: string, options: { voice?: string; rate?: number; pitch?: number } = {}): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!text.trim()) {
        resolve();
        return;
      }

      console.log('🔊 Speaking:', text);

      // Check if speech synthesis is supported and available
      if (!this.synthesis) {
        console.warn('🔊 Speech synthesis not available');
        resolve(); // Don't reject, just resolve silently
        return;
      }

      // Wait for voices to be loaded if needed
      if (this.synthesis.getVoices().length === 0) {
        console.log('🔊 Waiting for voices to load...');
        this.synthesis.onvoiceschanged = () => {
          this.synthesis.onvoiceschanged = null; // Remove listener
          this.attemptSpeak(text, options, resolve, reject);
        };
        return;
      }

      this.attemptSpeak(text, options, resolve, reject);
    });
  }

  // Attempt to speak with retry logic
  private attemptSpeak(
    text: string, 
    options: { voice?: string; rate?: number; pitch?: number } = {},
    resolve: () => void,
    reject: (error: any) => void,
    attempt: number = 1
  ): void {
    try {
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Set basic properties
      utterance.rate = options.rate || 1.0;
      utterance.pitch = options.pitch || 1.0;
      utterance.volume = 1.0;
      utterance.lang = 'en-US';

      // Try to set a voice if available
      const voices = this.synthesis.getVoices();
      if (voices.length > 0) {
        // Prefer English voices
        const englishVoice = voices.find(voice => 
          voice.lang.startsWith('en') && voice.default
        ) || voices.find(voice => 
          voice.lang.startsWith('en')
        ) || voices[0];
        
        if (englishVoice) {
          utterance.voice = englishVoice;
          console.log('🔊 Using voice:', englishVoice.name);
        }
      }

      utterance.onstart = () => {
        console.log('🔊 Speech started');
        this.state.isSpeaking = true;
        this.notifyListeners();
      };

      utterance.onend = () => {
        console.log('🔊 Speech ended successfully');
        this.state.isSpeaking = false;
        this.notifyListeners();
        resolve();
      };

      utterance.onerror = (error) => {
        console.error('🔊 Speech error:', error);
        
        // Handle specific error types
        if (error.error === 'interrupted' || error.error === 'canceled') {
          console.log('🔊 Speech was interrupted or canceled');
          this.state.isSpeaking = false;
          this.notifyListeners();
          resolve(); // Don't reject for interruptions
          return;
        }

        // Retry logic for certain errors
        if (attempt < 3 && (error.error === 'network' || error.error === 'not-allowed')) {
          console.log(`🔊 Retrying speech (attempt ${attempt + 1}/3)...`);
          setTimeout(() => {
            this.attemptSpeak(text, options, resolve, reject, attempt + 1);
          }, 1000);
          return;
        }

        // Final failure
        console.error('🔊 Speech failed after retries:', error.error);
        this.state.isSpeaking = false;
        this.notifyListeners();
        
        // Don't reject, just resolve to prevent app crashes
        resolve();
      };

      // Cancel any current speech
      this.synthesis.cancel();
      
      // Start speaking
      this.synthesis.speak(utterance);
      
    } catch (error) {
      console.error('🔊 Speech setup error:', error);
      this.state.isSpeaking = false;
      this.notifyListeners();
      resolve(); // Don't reject, just resolve
    }
  }

  // Subscribe to state changes
  onStateChange(listener: (state: SimpleVoiceState) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Set error state
  private setError(message: string): void {
    console.error('❌ Voice error:', message);
    this.state.error = message;
    this.notifyListeners();
  }

  // Notify all listeners
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener({ ...this.state });
      } catch (error) {
        console.error('Error in state listener:', error);
      }
    });
  }

  // Get current state
  getState(): SimpleVoiceState {
    return { ...this.state };
  }

  // Cleanup
  destroy(): void {
    this.stopListening();
    this.synthesis.cancel();
    this.listeners = [];
  }
}

// Create singleton instance
let voiceServiceInstance: FixedVoiceService | null = null;

export function getFixedVoiceService(): FixedVoiceService {
  if (!voiceServiceInstance) {
    voiceServiceInstance = new FixedVoiceService();
  }
  return voiceServiceInstance;
} 