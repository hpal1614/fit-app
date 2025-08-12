import { VoiceService } from './voiceService';

export class ContinuousVoiceService extends VoiceService {
  private conversationActive = false;
  private conversationHistory: ConversationMessage[] = [];
  private userContext: UserWorkoutContext = {};
  private wakeWordActive = false;
  private conversationTimeout: NodeJS.Timeout | null = null;
  private WAKE_WORDS = ['hey coach', 'coach'];
  private CONVERSATION_TIMEOUT = 3 * 60 * 1000; // 3 minutes
  private aiService: any;
  public onStateChange?: (state: any) => void;
  public onError?: (error: any) => void;

  constructor(config?: any, aiService?: any) {
    super(config);
    this.aiService = aiService;
  }

  // Setup continuous listening
  private setupContinuousListening() {
    // This will be called during initialization
    console.log('🔧 Setting up continuous voice listening...');
  }

  // Always listen for wake word
  async startWakeWordListening() {
    try {
      this.wakeWordActive = true;
      console.log('👂 Starting wake word listening...');
      
      // Use the parent class's startListening method
      await this.startListening();
      console.log('👂 Listening for "hey coach"...');
      
    } catch (error) {
      console.error('❌ Wake word listening failed:', error);
    }
  }

  // Detect wake word
  detectWakeWord(transcript: string): boolean {
    return this.WAKE_WORDS.some(word => transcript.includes(word));
  }

  // Activate conversation mode
  async activateConversation() {
    this.conversationActive = true;
    console.log('🤖 Conversation activated!');
    
    // Load user context
    await this.loadUserContext();
    
    // Generate contextual greeting
    const greeting = await this.generateGreeting();
    await this.speak(greeting);
    
    // Start conversation timeout
    this.startConversationTimeout();
    
    // Update UI
    this.updateState({ 
      mode: 'conversation_active',
      conversationActive: true 
    });
  }

  // Load current workout context
  async loadUserContext() {
    try {
      // Get current workout data (integrate with your services)
      const currentWorkout = await this.getCurrentWorkout();
      const workoutHistory = await this.getWorkoutHistory();
      const todaysProgress = await this.getTodaysProgress();
      
      this.userContext = {
        currentWorkout,
        workoutHistory,
        todaysProgress,
        isInWorkout: !!currentWorkout,
        currentExercise: currentWorkout?.currentExercise,
        timeOfDay: this.getTimeOfDay()
      };
      
      console.log('📊 Context loaded:', this.userContext);
    } catch (error) {
      console.error('❌ Context loading failed:', error);
      this.userContext = {};
    }
  }

  // Generate contextual greeting
  async generateGreeting(): Promise<string> {
    const prompt = `You're an AI fitness coach. User said "hey coach" to activate you.

CONTEXT:
- Time: ${this.userContext.timeOfDay}
- In workout: ${this.userContext.isInWorkout}
- Current workout: ${this.userContext.currentWorkout?.name || 'None'}
- Current exercise: ${this.userContext.currentExercise?.name || 'None'}

Generate a brief, natural greeting (1-2 sentences) that:
1. Acknowledges their situation
2. Offers helpful next steps
3. Sounds like a friendly training partner

Examples:
- "Hey! I see you're in your chest workout. How's the bench press going?"
- "Good morning! Ready to start today's upper body session?"
- "What's up! Looks like you're between exercises. What's next?"

Keep it conversational and motivating!`;

    try {
      const response = await this.aiService.getCoachingResponse(
        prompt,
        { type: 'greeting', context: this.userContext },
        'conversation'
      );
      return response.content.trim();
    } catch (error) {
      return this.getFallbackGreeting();
    }
  }

  // Handle conversation input
  async handleConversationInput(transcript: string) {
    console.log('💬 User:', transcript);
    
    // Check for conversation end commands
    if (this.isEndCommand(transcript)) {
      await this.speak("Going to sleep. Say 'hey coach' when you need me!");
      this.deactivateConversation();
      return;
    }

    // Reset timeout
    this.resetConversationTimeout();
    
    // Add to conversation history
    this.conversationHistory.push({
      role: 'user',
      content: transcript,
      timestamp: new Date()
    });

    // Generate AI response
    const response = await this.generateContextualResponse(transcript);
    
    // Add AI response to history
    this.conversationHistory.push({
      role: 'assistant',
      content: response,
      timestamp: new Date()
    });

    // Speak response
    await this.speak(response);

    // Update context if needed
    await this.updateContextFromInput(transcript);
  }

  // Generate contextual AI response
  async generateContextualResponse(userInput: string): Promise<string> {
    const recentConversation = this.conversationHistory
      .slice(-4)
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');

    const prompt = `You're an AI fitness coach having a conversation with a user during their workout.

CURRENT CONTEXT:
- In workout: ${this.userContext.isInWorkout}
- Current workout: ${this.userContext.currentWorkout?.name || 'None'}
- Current exercise: ${this.userContext.currentExercise?.name || 'None'}
- Time: ${this.userContext.timeOfDay}

RECENT CONVERSATION:
${recentConversation}

USER JUST SAID: "${userInput}"

GUIDELINES:
1. Be conversational and supportive like a workout buddy
2. Give relevant fitness advice based on context
3. Acknowledge their progress and encourage them
4. Keep responses brief (1-2 sentences) unless they ask for details
5. Use their workout context to make responses relevant
6. If they mention completing exercises, acknowledge and guide next steps

Generate a helpful, encouraging response:`;

    try {
      const response = await this.aiService.getCoachingResponse(
        prompt,
        { 
          type: 'conversation',
          context: this.userContext,
          userInput: userInput
        },
        'conversation'
      );
      return response.content.trim();
    } catch (error) {
      return this.getFallbackResponse();
    }
  }

  // Conversation timeout management
  startConversationTimeout() {
    this.conversationTimeout = setTimeout(() => {
      this.handleTimeout();
    }, this.CONVERSATION_TIMEOUT);
  }

  resetConversationTimeout() {
    if (this.conversationTimeout) {
      clearTimeout(this.conversationTimeout);
    }
    this.startConversationTimeout();
  }

  async handleTimeout() {
    if (this.userContext.isInWorkout) {
      await this.speak("Still here if you need me! How's your workout going?");
      this.resetConversationTimeout();
    } else {
      await this.speak("Going to sleep to save battery. Say 'hey coach' when you need me!");
      this.deactivateConversation();
    }
  }

  // Deactivate conversation
  deactivateConversation() {
    this.conversationActive = false;
    
    if (this.conversationTimeout) {
      clearTimeout(this.conversationTimeout);
    }
    
    this.updateState({ 
      mode: 'wake_word_listening',
      conversationActive: false 
    });
    
    // Resume wake word listening
    this.startWakeWordListening();
  }

  // Helper methods
  isEndCommand(transcript: string): boolean {
    const endCommands = ['stop talking', 'go to sleep', 'silence', 'stop'];
    return endCommands.some(cmd => transcript.toLowerCase().includes(cmd));
  }

  getTimeOfDay(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
  }

  getFallbackGreeting(): string {
    return "Hey! I'm here to help with your workout. What can I do for you?";
  }

  getFallbackResponse(): string {
    return "I'm here to help! What would you like to do next?";
  }

  // Integration methods (implement based on your existing services)
  async getCurrentWorkout() {
    try {
      // Import and use the workout service
      const workoutServiceModule = await import('./workoutService');
      return await workoutServiceModule.default.getCurrentWorkout();
    } catch (error) {
      console.log('No current workout found');
      return null;
    }
  }

  async getWorkoutHistory() {
    try {
      // Import and use the workout service
      const workoutServiceModule = await import('./workoutService');
      return await workoutServiceModule.default.getWorkoutHistory(5);
    } catch (error) {
      console.log('No workout history found');
      return [];
    }
  }

  async getTodaysProgress() {
    try {
      // Import and use the workout service
      const workoutServiceModule = await import('./workoutService');
      return await workoutServiceModule.default.getTodaysProgress();
    } catch (error) {
      console.log('No progress data found');
      return null;
    }
  }

  async updateContextFromInput(input: string) {
    // Check if user mentioned completing exercises
    const exerciseComplete = /finished|completed|done with/i.test(input);
    if (exerciseComplete) {
      await this.loadUserContext(); // Refresh context
    }
  }

  // Override parent methods for better integration
  async initialize(): Promise<boolean> {
    const initialized = await super.initialize();
    if (initialized) {
      await this.startWakeWordListening();
    }
    return initialized;
  }

  // Override processVoiceInput to handle wake word detection
  protected processVoiceInput(input: any): void {
    const transcript = input.transcript.toLowerCase();
    console.log('🎤 Heard:', transcript);
    
    if (this.detectWakeWord(transcript) && !this.conversationActive) {
      this.activateConversation();
    } else if (this.conversationActive) {
      this.handleConversationInput(transcript);
    } else {
      // If not in conversation mode and no wake word, just log it
      console.log('👂 Wake word not detected, continuing to listen...');
    }
  }

  // Update state with additional properties
  updateState(newState: any) {
    // Get the current state from parent
    const currentState = (this as any).state || {};
    
    // Update state with additional properties
    const updatedState = {
      ...currentState,
      ...newState,
      conversationActive: this.conversationActive,
      wakeWordActive: this.wakeWordActive
    };

    // Emit state change event
    if (this.onStateChange) {
      this.onStateChange(updatedState);
    }
  }
}

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface UserWorkoutContext {
  currentWorkout?: any;
  workoutHistory?: any[];
  todaysProgress?: any;
  isInWorkout?: boolean;
  currentExercise?: any;
  timeOfDay?: string;
}
