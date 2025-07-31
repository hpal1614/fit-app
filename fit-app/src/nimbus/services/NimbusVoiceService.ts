import type { WorkoutContext } from '../../types/workout';

export interface VoicePersonality {
  id: string;
  name: string;
  description: string;
  avatar: string; // Emoji or icon
  traits: {
    energy: number; // 0-100
    strictness: number; // 0-100
    humor: number; // 0-100
    empathy: number; // 0-100
  };
  voiceSettings: {
    rate: number; // 0.5-2
    pitch: number; // 0-2
    volume: number; // 0-1
    voicePreference?: string; // Specific voice name if available
  };
  phrases: {
    greeting: string[];
    encouragement: string[];
    completion: string[];
    rest: string[];
    struggle: string[];
    achievement: string[];
  };
}

export interface EmotionalState {
  energy: number; // 0-100
  motivation: number; // 0-100
  fatigue: number; // 0-100
  confidence: number; // 0-100
}

interface NimbusVoiceConfig {
  defaultPersonality?: string;
  emotionalAdaptation?: boolean;
  contextAwareness?: boolean;
  voiceEngine?: 'native' | 'elevenlabs' | 'azure';
}

export class NimbusVoiceService {
  private config: NimbusVoiceConfig;
  private recognition: any | null = null;
  private synthesis: SpeechSynthesis;
  private currentPersonality: VoicePersonality;
  private personalities: Map<string, VoicePersonality>;
  private emotionalState: EmotionalState;
  private isListening = false;
  private isSpeaking = false;
  
  constructor(config: NimbusVoiceConfig = {}) {
    this.config = {
      defaultPersonality: 'motivator',
      emotionalAdaptation: true,
      contextAwareness: true,
      voiceEngine: 'native',
      ...config
    };
    
    this.synthesis = window.speechSynthesis;
    this.personalities = this.initializePersonalities();
    this.currentPersonality = this.personalities.get(this.config.defaultPersonality!) || this.getDefaultPersonality();
    
    this.emotionalState = {
      energy: 80,
      motivation: 80,
      fatigue: 20,
      confidence: 75
    };
    
    this.initializeRecognition();
  }
  
  private initializePersonalities(): Map<string, VoicePersonality> {
    const personalities = new Map<string, VoicePersonality>();
    
    // The Motivator - Balanced and encouraging
    personalities.set('motivator', {
      id: 'motivator',
      name: 'The Motivator',
      description: 'Encouraging and supportive, always finding the positive',
      avatar: '💪',
      traits: {
        energy: 75,
        strictness: 40,
        humor: 60,
        empathy: 85
      },
      voiceSettings: {
        rate: 1.1,
        pitch: 1.1,
        volume: 0.9
      },
      phrases: {
        greeting: [
          "Hey there, champion! Ready to crush this workout?",
          "Welcome back! Let's make today amazing!",
          "Great to see you! Time to show those muscles who's boss!"
        ],
        encouragement: [
          "You're doing amazing! Keep that energy up!",
          "That's it! Feel the burn, embrace the growth!",
          "Incredible form! You're getting stronger with every rep!"
        ],
        completion: [
          "Fantastic job! You absolutely crushed it!",
          "That's a wrap! You should be proud of yourself!",
          "Mission accomplished! Rest up, you've earned it!"
        ],
        rest: [
          "Take a breather, you've earned it. Stay hydrated!",
          "Rest up, champion. Next set's gonna be even better!",
          "Good work! Use this time to catch your breath and reset."
        ],
        struggle: [
          "I see you pushing through! That's what champions do!",
          "It's tough, but you're tougher! Just a few more!",
          "This is where you grow! You've got this!"
        ],
        achievement: [
          "NEW PERSONAL BEST! You're on fire!",
          "That's what I'm talking about! Breaking barriers!",
          "Incredible! You just leveled up!"
        ]
      }
    });
    
    // The Drill Sergeant - Tough love approach
    personalities.set('sergeant', {
      id: 'sergeant',
      name: 'Drill Sergeant',
      description: 'No-nonsense, high-intensity motivation through discipline',
      avatar: '🪖',
      traits: {
        energy: 95,
        strictness: 90,
        humor: 20,
        empathy: 30
      },
      voiceSettings: {
        rate: 1.2,
        pitch: 0.8,
        volume: 1.0
      },
      phrases: {
        greeting: [
          "ATTENTION! Time to work, recruit!",
          "Drop and give me twenty! Just kidding... or am I?",
          "No excuses today! Let's see what you're made of!"
        ],
        encouragement: [
          "MOVE IT! That's what I want to see!",
          "PUSH! PUSH! Don't you dare quit on me!",
          "OUTSTANDING! Keep that intensity!"
        ],
        completion: [
          "WORKOUT COMPLETE! You survived another day!",
          "DISMISSED! Hit the showers, you've earned it!",
          "That's how it's done! HOOAH!"
        ],
        rest: [
          "Rest period! But stay focused!",
          "Catch your breath, but stay ready!",
          "Hydrate! Next set in T-minus..."
        ],
        struggle: [
          "PAIN IS WEAKNESS LEAVING THE BODY!",
          "DIG DEEP! Find that warrior spirit!",
          "NO QUITTING! Push through!"
        ],
        achievement: [
          "NOW THAT'S WHAT I CALL EXCELLENCE!",
          "RECORD BROKEN! Outstanding performance!",
          "You just made me proud, recruit!"
        ]
      }
    });
    
    // The Zen Master - Calm and mindful
    personalities.set('zen', {
      id: 'zen',
      name: 'Zen Master',
      description: 'Peaceful and mindful, focusing on mind-body connection',
      avatar: '🧘',
      traits: {
        energy: 40,
        strictness: 20,
        humor: 30,
        empathy: 95
      },
      voiceSettings: {
        rate: 0.9,
        pitch: 1.0,
        volume: 0.7
      },
      phrases: {
        greeting: [
          "Welcome, friend. Let's begin this journey together.",
          "Namaste. Today we honor our body through movement.",
          "Breathe deeply. Your practice awaits."
        ],
        encouragement: [
          "Beautiful form. Feel the energy flowing through you.",
          "Stay present. Each movement is a meditation.",
          "Excellent. You're in perfect harmony with your body."
        ],
        completion: [
          "Well done. Honor the work you've completed today.",
          "Your practice is complete. Rest in this accomplishment.",
          "Namaste. You've grown stronger in body and spirit."
        ],
        rest: [
          "Rest is part of the journey. Breathe deeply.",
          "Listen to your body. Recovery is sacred.",
          "Use this moment to center yourself."
        ],
        struggle: [
          "Breathe through the challenge. You are stronger than you know.",
          "This difficulty is your teacher. What is it showing you?",
          "Stay calm. Your strength comes from within."
        ],
        achievement: [
          "A milestone reached. Celebrate this moment mindfully.",
          "Your dedication has borne fruit. Be proud.",
          "Excellence achieved through patience and practice."
        ]
      }
    });
    
    // The Comedian - Humor-focused motivation
    personalities.set('comedian', {
      id: 'comedian',
      name: 'The Comedian',
      description: 'Keeps you laughing through the burn with witty commentary',
      avatar: '🎭',
      traits: {
        energy: 70,
        strictness: 25,
        humor: 95,
        empathy: 70
      },
      voiceSettings: {
        rate: 1.15,
        pitch: 1.2,
        volume: 0.85
      },
      phrases: {
        greeting: [
          "Welcome to the gun show! Tickets are free but the pain costs extra!",
          "Ready to get swole-arious? Let's pump some iron and some jokes!",
          "Time to exercise! And by exercise, I mean complain while moving!"
        ],
        encouragement: [
          "Looking good! And by good, I mean sweaty. Very sweaty.",
          "You're crushing it! Like my dreams of eating pizza tonight!",
          "Beast mode: ACTIVATED! Regular human mode: On vacation!"
        ],
        completion: [
          "Done! You can now legally eat a whole pizza. I don't make the rules!",
          "Workout complete! Your muscles are now writing thank you notes!",
          "Finished! Time to practice your 'I worked out' humble brag!"
        ],
        rest: [
          "Rest time! Also known as 'why did I do this to myself' time!",
          "Catch your breath! Your lungs are probably filing a complaint!",
          "Break time! Your muscles are having a staff meeting about this abuse!"
        ],
        struggle: [
          "It burns! But so does my cooking, and people still eat it!",
          "Almost there! Your muscles are just being drama queens!",
          "Push through! Think of all the mirror selfies you'll take!"
        ],
        achievement: [
          "NEW RECORD! Your old record is crying in the corner!",
          "BOOM! You just made your past self jealous!",
          "Achievement unlocked! +1000 bragging rights!"
        ]
      }
    });
    
    return personalities;
  }
  
  private getDefaultPersonality(): VoicePersonality {
    return this.personalities.get('motivator')!;
  }
  
  /**
   * Set the current voice personality
   */
  setPersonality(personalityId: string): void {
    const personality = this.personalities.get(personalityId);
    if (personality) {
      this.currentPersonality = personality;
      console.log(`🎭 Voice personality changed to: ${personality.name}`);
    }
  }
  
  /**
   * Get all available personalities
   */
  getPersonalities(): VoicePersonality[] {
    return Array.from(this.personalities.values());
  }
  
  /**
   * Update emotional state based on workout context
   */
  updateEmotionalState(context: WorkoutContext): void {
    if (!this.config.emotionalAdaptation) return;
    
    // Analyze workout intensity and progress
    const workoutIntensity = this.calculateWorkoutIntensity(context);
    const progressRate = this.calculateProgressRate(context);
    
    // Update emotional state
    this.emotionalState.energy = Math.max(20, 100 - (context.duration || 0) / 600); // Decreases over time
    this.emotionalState.fatigue = Math.min(80, (context.duration || 0) / 300); // Increases over time
    this.emotionalState.motivation = Math.max(40, progressRate * 100);
    this.emotionalState.confidence = Math.min(95, 50 + (context.currentSet || 0) * 10);
  }
  
  /**
   * Get contextual phrase based on personality and situation
   */
  private getContextualPhrase(category: keyof VoicePersonality['phrases'], context?: WorkoutContext): string {
    const phrases = this.currentPersonality.phrases[category];
    
    // Apply emotional adaptation
    if (this.config.emotionalAdaptation && context) {
      this.updateEmotionalState(context);
      
      // Modify phrase selection based on emotional state
      if (this.emotionalState.fatigue > 60 && category === 'encouragement') {
        // Switch to more empathetic encouragement when user is tired
        const empathyPhrases = this.currentPersonality.phrases.struggle;
        return empathyPhrases[Math.floor(Math.random() * empathyPhrases.length)];
      }
    }
    
    return phrases[Math.floor(Math.random() * phrases.length)];
  }
  
  /**
   * Speak with personality-aware voice synthesis
   */
  async speak(text: string, context?: WorkoutContext): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        if (!this.synthesis || this.isSpeaking) {
          resolve();
          return;
        }
        
        this.isSpeaking = true;
        
        // Get contextual text if not provided
        if (!text && context) {
          text = this.generateContextualResponse(context);
        }
        
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Apply personality voice settings
        utterance.rate = this.currentPersonality.voiceSettings.rate;
        utterance.pitch = this.currentPersonality.voiceSettings.pitch;
        utterance.volume = this.currentPersonality.voiceSettings.volume;
        
        // Apply emotional modulation
        if (this.config.emotionalAdaptation) {
          utterance.rate *= (0.8 + (this.emotionalState.energy / 500)); // Slower when tired
          utterance.pitch *= (0.9 + (this.emotionalState.motivation / 500)); // Lower when less motivated
        }
        
        // Try to use personality-specific voice if available
        if (this.currentPersonality.voiceSettings.voicePreference) {
          const voices = this.synthesis.getVoices();
          const preferredVoice = voices.find(v => 
            v.name.includes(this.currentPersonality.voiceSettings.voicePreference!)
          );
          if (preferredVoice) {
            utterance.voice = preferredVoice;
          }
        }
        
        utterance.onend = () => {
          this.isSpeaking = false;
          resolve();
        };
        
        utterance.onerror = (event) => {
          this.isSpeaking = false;
          reject(new Error(`Speech synthesis failed: ${event.error}`));
        };
        
        this.synthesis.speak(utterance);
        
      } catch (error) {
        this.isSpeaking = false;
        reject(error);
      }
    });
  }
  
  /**
   * Generate contextual response based on workout state
   */
  private generateContextualResponse(context: WorkoutContext): string {
    if (!context) {
      return this.getContextualPhrase('greeting');
    }
    
    // Starting workout
    if (context.isActive && context.duration < 60) {
      return this.getContextualPhrase('greeting', context);
    }
    
    // During exercise
    if (context.currentExercise) {
      // Check if struggling (rest time exceeded, or low completion rate)
      if (context.restTime && context.restTime > 120) {
        return this.getContextualPhrase('struggle', context);
      }
      
      // Normal encouragement
      return this.getContextualPhrase('encouragement', context);
    }
    
    // Rest period
    if (context.restTime && context.restTime > 0) {
      return this.getContextualPhrase('rest', context);
    }
    
    // Workout completion
    if (!context.isActive && context.exercises && context.exercises.length > 0) {
      return this.getContextualPhrase('completion', context);
    }
    
    // Achievement (PR, milestone, etc.)
    if (this.detectAchievement(context)) {
      return this.getContextualPhrase('achievement', context);
    }
    
    // Default encouragement
    return this.getContextualPhrase('encouragement', context);
  }
  
  /**
   * Initialize speech recognition
   */
  private initializeRecognition(): void {
    if (typeof window === 'undefined') return;
    
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    
    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';
    
    this.recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0].transcript)
        .join('');
      
      // Process voice command
      this.processVoiceCommand(transcript);
    };
    
    this.recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      this.isListening = false;
    };
    
    this.recognition.onend = () => {
      this.isListening = false;
    };
  }
  
  /**
   * Start listening for voice commands
   */
  async startListening(): Promise<void> {
    if (!this.recognition || this.isListening) return;
    
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      this.recognition.start();
      this.isListening = true;
    } catch (error) {
      console.error('Failed to start voice recognition:', error);
    }
  }
  
  /**
   * Stop listening
   */
  stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }
  
  /**
   * Process voice commands
   */
  private processVoiceCommand(transcript: string): void {
    const command = transcript.toLowerCase();
    
    // Personality switching commands
    if (command.includes('change personality') || command.includes('switch coach')) {
      if (command.includes('motivator')) {
        this.setPersonality('motivator');
      } else if (command.includes('sergeant') || command.includes('drill')) {
        this.setPersonality('sergeant');
      } else if (command.includes('zen') || command.includes('calm')) {
        this.setPersonality('zen');
      } else if (command.includes('funny') || command.includes('comedian')) {
        this.setPersonality('comedian');
      }
    }
  }
  
  /**
   * Calculate workout intensity
   */
  private calculateWorkoutIntensity(context: WorkoutContext): number {
    if (!context.exercises || context.exercises.length === 0) return 0;
    
    // Simple intensity calculation based on sets completed and time
    const setsPerMinute = (context.totalSets || 0) / ((context.duration || 1) / 60);
    return Math.min(100, setsPerMinute * 10);
  }
  
  /**
   * Calculate progress rate
   */
  private calculateProgressRate(context: WorkoutContext): number {
    if (!context.exercises || context.exercises.length === 0) return 0;
    
    const completedSets = context.exercises.reduce((total, exercise) => 
      total + (exercise.sets?.length || 0), 0
    );
    
    const targetSets = context.exercises.length * 3; // Assume 3 sets per exercise
    return completedSets / targetSets;
  }
  
  /**
   * Detect achievements
   */
  private detectAchievement(context: WorkoutContext): boolean {
    // Check for personal records, streaks, milestones
    // This is a simplified version
    return context.totalSets ? context.totalSets % 10 === 0 : false;
  }
  
  /**
   * Get current state
   */
  getState() {
    return {
      isListening: this.isListening,
      isSpeaking: this.isSpeaking,
      currentPersonality: this.currentPersonality,
      emotionalState: this.emotionalState
    };
  }
}

// Export singleton instance
export const nimbusVoice = new NimbusVoiceService();