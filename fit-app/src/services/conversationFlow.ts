import type {
  VoiceCommandResult,
  VoiceAction,
  WorkoutContext
} from '../types/voice';
import { AICoachService } from './aiService';
import { FitnessNLP } from './naturalLanguageProcessor';

interface ConversationFlow {
  type: 'SET_LOGGING' | 'WORKOUT_SETUP' | 'FORM_DISCUSSION' | 'NUTRITION_CHAT' | 'MOTIVATION_SESSION';
  step: string;
  data: Record<string, unknown>;
  startedAt: Date;
  timeout?: number;
  expectedResponses?: string[];
}

interface ConversationTurn {
  userInput: string;
  aiResponse: string;
  timestamp: Date;
  flowType?: string;
  confidence: number;
}

interface ConversationResponse {
  text: string;
  emotion: 'encouraging' | 'celebratory' | 'instructional' | 'questioning' | 'neutral' | 'apologetic';
  expectsResponse: boolean;
  timeout?: number;
  suggestions?: string[];
  actions?: { text: string; action: VoiceAction; parameters?: any }[];
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

interface SetLoggingFlow extends ConversationFlow {
  type: 'SET_LOGGING';
  step: 'AWAITING_EXERCISE' | 'AWAITING_REPS' | 'AWAITING_WEIGHT' | 'CONFIRMING' | 'COMPLETE';
  data: {
    exercise?: string;
    reps?: number;
    weight?: number;
    unit?: string;
    partialInput?: string;
  };
}

interface WorkoutSetupFlow extends ConversationFlow {
  type: 'WORKOUT_SETUP';
  step: 'CHOOSING_TYPE' | 'SELECTING_EXERCISES' | 'SETTING_GOALS' | 'READY_TO_START';
  data: {
    workoutType?: string;
    selectedExercises?: string[];
    targetDuration?: number;
    goals?: string[];
  };
}

interface FormDiscussionFlow extends ConversationFlow {
  type: 'FORM_DISCUSSION';
  step: 'IDENTIFYING_EXERCISE' | 'GATHERING_FEEDBACK' | 'PROVIDING_ANALYSIS' | 'FOLLOW_UP';
  data: {
    exercise?: string;
    userFeedback?: string;
    specificConcerns?: string[];
    analysisProvided?: boolean;
  };
}

export class ConversationFlowManager {
  private currentFlow: ConversationFlow | null = null;
  private conversationHistory: ConversationTurn[] = [];
  private aiService: AICoachService;
  private nlp: FitnessNLP;
  private flowTimeout: NodeJS.Timeout | null = null;

  constructor() {
    this.aiService = AICoachService.getInstance();
    this.nlp = new FitnessNLP();
  }

  async processUserInput(
    transcript: string, 
    context: WorkoutContext
  ): Promise<ConversationResponse> {
    // Clear any existing timeout
    if (this.flowTimeout) {
      clearTimeout(this.flowTimeout);
      this.flowTimeout = null;
    }

    // Parse the voice input
    const command = await this.nlp.parseVoiceInput(transcript, context);
    
    // Handle based on current conversation flow
    if (this.currentFlow) {
      const response = await this.continueFlow(command, transcript, context);
      this.addToHistory(transcript, response.text, command.confidence);
      this.setFlowTimeout(response);
      return response;
    } else {
      const response = await this.startNewFlow(command, context);
      this.addToHistory(transcript, response.text, command.confidence);
      this.setFlowTimeout(response);
      return response;
    }
  }

  private async continueFlow(
    command: VoiceCommandResult, 
    transcript: string, 
    context: WorkoutContext
  ): Promise<ConversationResponse> {
    switch (this.currentFlow?.type) {
      case 'SET_LOGGING':
        return this.handleSetLoggingFlow(command, transcript, context);
      case 'WORKOUT_SETUP':
        return this.handleWorkoutSetupFlow(command, transcript, context);
      case 'FORM_DISCUSSION':
        return this.handleFormDiscussionFlow(command, transcript, context);
      case 'NUTRITION_CHAT':
        return this.handleNutritionChatFlow(command, transcript, context);
      case 'MOTIVATION_SESSION':
        return this.handleMotivationSessionFlow(command, transcript, context);
      default:
        return this.startNewFlow(command, context);
    }
  }

  private async startNewFlow(
    command: VoiceCommandResult,
    context: WorkoutContext
  ): Promise<ConversationResponse> {
    switch (command.action) {
      case 'LOG_EXERCISE':
        return this.startSetLoggingFlow(command, context);
      case 'START_WORKOUT':
        return this.startWorkoutSetupFlow(command, context);
      case 'FORM_ANALYSIS':
        return this.startFormDiscussionFlow(command, context);
      case 'NUTRITION_QUERY':
        return this.startNutritionChatFlow(command, context);
      case 'MOTIVATION_REQUEST':
        return this.startMotivationSessionFlow(command, context);
      default:
        return this.handleDirectCommand(command, context);
    }
  }

  private async startSetLoggingFlow(
    command: VoiceCommandResult,
    context: WorkoutContext
  ): Promise<ConversationResponse> {
    const { exercise, reps, weight } = command.parameters;

    if (exercise && reps && weight) {
      // Complete set logging in one go
      await this.logSet(exercise, reps, weight, context);
      return {
        text: `Perfect! Logged ${reps} reps of ${exercise} at ${weight} pounds. How did that feel? Was it challenging or could you do more?`,
        emotion: 'celebratory',
        expectsResponse: true,
        timeout: 10000,
        suggestions: ['It felt good', 'Pretty challenging', 'I could do more']
      };
    }

    // Start partial logging flow
    this.currentFlow = {
      type: 'SET_LOGGING',
      step: exercise ? (reps ? 'AWAITING_WEIGHT' : 'AWAITING_REPS') : 'AWAITING_EXERCISE',
      data: { exercise, reps, weight },
      startedAt: new Date(),
      timeout: 15000
    } as SetLoggingFlow;

    if (!exercise) {
      return {
        text: "I'd love to help you log a set! Which exercise did you just complete?",
        emotion: 'questioning',
        expectsResponse: true,
        timeout: 15000,
        suggestions: ['Bench press', 'Squats', 'Deadlift']
      };
    } else if (!reps) {
      return {
        text: `Great! How many reps of ${exercise} did you complete?`,
        emotion: 'encouraging',
        expectsResponse: true,
        timeout: 10000
      };
    } else {
      return {
        text: `Awesome ${reps} reps of ${exercise}! What weight did you use?`,
        emotion: 'encouraging',
        expectsResponse: true,
        timeout: 10000
      };
    }
  }

  private async handleSetLoggingFlow(
    command: VoiceCommandResult,
    transcript: string,
    context: WorkoutContext
  ): Promise<ConversationResponse> {
    const flow = this.currentFlow as SetLoggingFlow;
    
    switch (flow.step) {
      case 'AWAITING_EXERCISE':
        const exercise = this.extractExerciseName(transcript);
        if (exercise) {
          flow.data.exercise = exercise;
          flow.step = 'AWAITING_REPS';
          return {
            text: `Got it, ${exercise}! How many reps did you complete?`,
            emotion: 'encouraging',
            expectsResponse: true,
            timeout: 10000
          };
        }
        return {
          text: "I didn't catch the exercise name. Could you tell me which exercise you completed? For example, 'bench press' or 'squats'.",
          emotion: 'questioning',
          expectsResponse: true,
          timeout: 15000,
          suggestions: ['Bench press', 'Squats', 'Deadlift', 'Cancel']
        };

      case 'AWAITING_REPS':
        const reps = this.extractNumber(transcript);
        if (reps && reps > 0 && reps <= 100) {
          flow.data.reps = reps;
          flow.step = 'AWAITING_WEIGHT';
          return {
            text: `Perfect, ${reps} reps! What weight did you use for your ${flow.data.exercise}?`,
            emotion: 'encouraging',
            expectsResponse: true,
            timeout: 10000
          };
        }
        return {
          text: "I need the number of reps you completed. Try saying just the number, like 'eight' or '10'.",
          emotion: 'instructional',
          expectsResponse: true,
          timeout: 10000
        };

      case 'AWAITING_WEIGHT':
        const weight = this.extractWeight(transcript);
        if (weight && weight.value > 0) {
          flow.data.weight = weight.value;
          flow.data.unit = weight.unit;
          
          // Complete the logging
          await this.logSet(flow.data.exercise!, flow.data.reps!, weight.value, context);
          this.clearFlow();
          
          return {
            text: `Excellent! Logged ${flow.data.reps} reps of ${flow.data.exercise} at ${weight.value} ${weight.unit}. ${this.getEncouragingComment(flow.data.reps!, weight.value)} Ready for your next set?`,
            emotion: 'celebratory',
            expectsResponse: true,
            timeout: 8000,
            suggestions: ['Yes, ready', 'Need a break', 'Different exercise'],
            actions: [
              { text: 'Start rest timer', action: 'START_REST_TIMER' },
              { text: 'Next exercise', action: 'NEXT_EXERCISE' }
            ]
          };
        }
        return {
          text: "I need the weight you used. Try saying something like '185 pounds' or '80 kilos'.",
          emotion: 'instructional',
          expectsResponse: true,
          timeout: 10000
        };

      default:
        this.clearFlow();
        return this.handleDirectCommand(command, context);
    }
  }

  private async startFormDiscussionFlow(
    command: VoiceCommandResult,
    context: WorkoutContext
  ): Promise<ConversationResponse> {
    const exercise = command.parameters.exercise || context.currentExercise?.exercise.name;

    if (!exercise) {
      this.currentFlow = {
        type: 'FORM_DISCUSSION',
        step: 'IDENTIFYING_EXERCISE',
        data: {},
        startedAt: new Date(),
        timeout: 15000
      } as FormDiscussionFlow;

      return {
        text: "I'd love to help with your form! Which exercise would you like me to analyze?",
        emotion: 'questioning',
        expectsResponse: true,
        timeout: 15000,
        suggestions: ['Current exercise', 'Bench press', 'Squats', 'Deadlift']
      };
    }

    // Get AI form analysis
    const analysis = await this.aiService.getCoachingResponse(
      `Provide form analysis for ${exercise}. Give 3 key form points and common mistakes to watch for.`,
      context,
      'form-analysis'
    );

    this.currentFlow = {
      type: 'FORM_DISCUSSION',
      step: 'FOLLOW_UP',
      data: { exercise, analysisProvided: true },
      startedAt: new Date(),
      timeout: 20000
    } as FormDiscussionFlow;

    return {
      text: `${analysis.content}\n\nHow does your ${exercise} feel? Any specific areas you're concerned about?`,
      emotion: 'instructional',
      expectsResponse: true,
      timeout: 20000,
      suggestions: ['Feels good', 'Having trouble with depth', 'Hard to balance', 'Different exercise']
    };
  }

  private async handleFormDiscussionFlow(
    command: VoiceCommandResult,
    transcript: string,
    context: WorkoutContext
  ): Promise<ConversationResponse> {
    const flow = this.currentFlow as FormDiscussionFlow;

    if (flow.step === 'IDENTIFYING_EXERCISE') {
      const exercise = this.extractExerciseName(transcript) || context.currentExercise?.exercise.name;
      if (exercise) {
        // Get AI form analysis
        const analysis = await this.aiService.getCoachingResponse(
          `Provide form analysis for ${exercise}. Give 3 key form points and common mistakes to watch for.`,
          context,
          'form-analysis'
        );

        flow.data.exercise = exercise;
        flow.step = 'FOLLOW_UP';

        return {
          text: `${analysis.content}\n\nHow does your ${exercise} feel? Any specific areas you're concerned about?`,
          emotion: 'instructional',
          expectsResponse: true,
          timeout: 20000,
          suggestions: ['Feels good', 'Having trouble', 'Need more tips']
        };
      }
    }

    if (flow.step === 'FOLLOW_UP') {
      const followUpResponse = await this.aiService.getCoachingResponse(
        `User feedback on ${flow.data.exercise}: "${transcript}". Provide specific tips based on their concern.`,
        context,
        'form-analysis'
      );

      this.clearFlow();

      return {
        text: `${followUpResponse.content}\n\nKeep focusing on these cues and your form will keep improving! Need help with anything else?`,
        emotion: 'encouraging',
        expectsResponse: true,
        timeout: 15000,
        suggestions: ['Another exercise', 'Start workout', 'I\'m good thanks']
      };
    }

    this.clearFlow();
    return this.handleDirectCommand(command, context);
  }

  private async startMotivationSessionFlow(
    command: VoiceCommandResult,
    context: WorkoutContext
  ): Promise<ConversationResponse> {
    const motivationResponse = await this.aiService.getCoachingResponse(
      command.parameters.context || 'User needs motivation',
      context,
      'motivation'
    );

    this.currentFlow = {
      type: 'MOTIVATION_SESSION',
      step: 'PROVIDING_SUPPORT',
      data: { context: command.parameters.context },
      startedAt: new Date(),
      timeout: 15000
    };

    return {
      text: `${motivationResponse.content}\n\nWhat's making it challenging today? I'm here to help you push through!`,
      emotion: 'encouraging',
      expectsResponse: true,
      timeout: 15000,
      suggestions: ['Feeling tired', 'Not seeing progress', 'Just need a push', 'I\'m good now']
    };
  }

  private async handleMotivationSessionFlow(
    _command: VoiceCommandResult,
    transcript: string,
    context: WorkoutContext
  ): Promise<ConversationResponse> {
    const personalizedMotivation = await this.aiService.getCoachingResponse(
      `User's challenge: "${transcript}". Provide personalized motivation and actionable advice.`,
      context,
      'motivation'
    );

    this.clearFlow();

    return {
      text: `${personalizedMotivation.content}\n\nYou've got this! Ready to get back to crushing your workout?`,
      emotion: 'encouraging',
      expectsResponse: true,
      timeout: 10000,
      suggestions: ['Let\'s do this', 'Start rest timer', 'Next exercise'],
      actions: [
        { text: 'Continue workout', action: 'NEXT_EXERCISE' },
        { text: 'Take a break', action: 'START_REST_TIMER' }
      ]
    };
  }

  private async startWorkoutSetupFlow(
    command: VoiceCommandResult,
    context: WorkoutContext
  ): Promise<ConversationResponse> {
    if (context.activeWorkout) {
      return {
        text: "You already have an active workout! Would you like to continue with it or start a new one?",
        emotion: 'questioning',
        expectsResponse: true,
        timeout: 10000,
        suggestions: ['Continue current', 'Start new', 'End current first']
      };
    }

    const workoutType = command.parameters.workoutType;
    if (workoutType) {
      return {
        text: `Great choice! Starting your ${workoutType} workout. Let's begin with your first exercise!`,
        emotion: 'encouraging',
        expectsResponse: false,
        actions: [
          { text: 'Start workout', action: 'START_WORKOUT', parameters: { workoutType } }
        ]
      };
    }

    this.currentFlow = {
      type: 'WORKOUT_SETUP',
      step: 'CHOOSING_TYPE',
      data: {},
      startedAt: new Date(),
      timeout: 20000
    } as WorkoutSetupFlow;

    return {
      text: "Let's start your workout! What type of training are you doing today?",
      emotion: 'encouraging',
      expectsResponse: true,
      timeout: 20000,
      suggestions: ['Push workout', 'Pull workout', 'Leg day', 'Full body', 'Custom']
    };
  }

  private async handleWorkoutSetupFlow(
    command: VoiceCommandResult,
    transcript: string,
    context: WorkoutContext
  ): Promise<ConversationResponse> {
    const flow = this.currentFlow as WorkoutSetupFlow;

    if (flow.step === 'CHOOSING_TYPE') {
      const workoutType = this.extractWorkoutType(transcript);
      if (workoutType) {
        this.clearFlow();
        return {
          text: `Perfect! Starting your ${workoutType} workout. Let's get started!`,
          emotion: 'encouraging',
          expectsResponse: false,
          actions: [
            { text: 'Start workout', action: 'START_WORKOUT', parameters: { workoutType } }
          ]
        };
      }
    }

    this.clearFlow();
    return this.handleDirectCommand(command, context);
  }

  private async startNutritionChatFlow(
    command: VoiceCommandResult,
    context: WorkoutContext
  ): Promise<ConversationResponse> {
    const nutritionResponse = await this.aiService.getCoachingResponse(
      command.parameters.query || 'General nutrition advice',
      context,
      'nutrition-advice'
    );

    return {
      text: `${nutritionResponse.content}\n\nDo you have any specific nutrition questions or goals you'd like to discuss?`,
      emotion: 'instructional',
      expectsResponse: true,
      timeout: 15000,
      suggestions: ['Weight loss', 'Muscle gain', 'Pre-workout', 'Post-workout', 'I\'m good thanks']
    };
  }

  private async handleNutritionChatFlow(
    _command: VoiceCommandResult,
    transcript: string,
    context: WorkoutContext
  ): Promise<ConversationResponse> {
    const nutritionResponse = await this.aiService.getCoachingResponse(
      `Nutrition question: "${transcript}"`,
      context,
      'nutrition-advice'
    );

    this.clearFlow();

    return {
      text: `${nutritionResponse.content}\n\nHope that helps! Remember to stay consistent with your nutrition goals.`,
      emotion: 'instructional',
      expectsResponse: true,
      timeout: 10000,
      suggestions: ['More questions', 'Back to workout', 'Thanks']
    };
  }

  private async handleDirectCommand(
    command: VoiceCommandResult,
    context: WorkoutContext
  ): Promise<ConversationResponse> {
    switch (command.action) {
      case 'HELP':
        return {
          text: "I can help you log sets, analyze form, provide motivation, give nutrition advice, and control your workout. Try saying things like 'Log bench press 8 reps at 185 pounds' or 'How's my squat form?'",
          emotion: 'instructional',
          expectsResponse: true,
          timeout: 15000,
          suggestions: ['Log a set', 'Form help', 'Motivation', 'Start workout']
        };

      case 'EXERCISE_INFO':
        const exerciseInfo = await this.aiService.getCoachingResponse(
          `Explain the ${command.parameters.exercise} exercise: muscles worked, form tips, and benefits.`,
          context,
          'exercise-explanation'
        );
        return {
          text: exerciseInfo.content,
          emotion: 'instructional',
          expectsResponse: true,
          timeout: 15000,
          suggestions: ['Another exercise', 'Form tips', 'Start workout']
        };

      default:
        const generalResponse = await this.aiService.getCoachingResponse(
          command.originalTranscript || 'General fitness question',
          context,
          'general-advice'
        );
        return {
          text: generalResponse.content,
          emotion: 'neutral',
          expectsResponse: true,
          timeout: 10000,
          suggestions: ['More help', 'Start workout', 'Log a set']
        };
    }
  }

  // Utility methods
  private extractExerciseName(transcript: string): string | null {
    // Use NLP to extract exercise name
    const exercises = ['bench press', 'squat', 'deadlift', 'pull up', 'push up', 'row', 'curl', 'press'];
    const normalized = transcript.toLowerCase();
    
    for (const exercise of exercises) {
      if (normalized.includes(exercise)) {
        return exercise;
      }
    }
    
    return null;
  }

  private extractNumber(transcript: string): number | null {
    const match = transcript.match(/\b(\d+)\b/);
    if (match) {
      return parseInt(match[1]);
    }
    
    // Handle word numbers
    const numberWords: { [key: string]: number } = {
      'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
      'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
      'eleven': 11, 'twelve': 12, 'fifteen': 15, 'twenty': 20
    };
    
    for (const [word, num] of Object.entries(numberWords)) {
      if (transcript.toLowerCase().includes(word)) {
        return num;
      }
    }
    
    return null;
  }

  private extractWeight(transcript: string): { value: number; unit: string } | null {
    const weightMatch = transcript.match(/(\d+(?:\.\d+)?)\s*(lbs?|pounds?|kg|kilos?)/i);
    if (weightMatch) {
      return {
        value: parseFloat(weightMatch[1]),
        unit: weightMatch[2].toLowerCase().includes('kg') || weightMatch[2].toLowerCase().includes('kilo') ? 'kg' : 'lbs'
      };
    }
    
    // Try to extract just the number and assume lbs
    const numberMatch = transcript.match(/\b(\d+(?:\.\d+)?)\b/);
    if (numberMatch) {
      const value = parseFloat(numberMatch[1]);
      // Heuristic: numbers over 50 are likely lbs, under 50 might be kg
      return {
        value,
        unit: value > 50 ? 'lbs' : 'kg'
      };
    }
    
    return null;
  }

  private extractWorkoutType(transcript: string): string | null {
    const types = ['push', 'pull', 'legs', 'leg day', 'full body', 'cardio', 'chest', 'back', 'shoulders'];
    const normalized = transcript.toLowerCase();
    
    for (const type of types) {
      if (normalized.includes(type)) {
        return type;
      }
    }
    
    return null;
  }

  private getEncouragingComment(reps: number, weight: number): string {
    if (reps >= 10) {
      return "Nice high rep set! Great for endurance.";
    } else if (reps <= 5 && weight > 200) {
      return "Heavy lifting! That's some serious strength work.";
    } else if (reps >= 8) {
      return "Perfect rep range for building muscle!";
    }
    return "Solid work!";
  }

  private async logSet(exercise: string, reps: number, weight: number, _context: WorkoutContext): Promise<void> {
    // This would integrate with your workout service
    console.log(`Logging set: ${exercise} - ${reps} reps at ${weight} lbs`);
    // await workoutService.logSet(exercise, reps, weight);
  }

  private addToHistory(userInput: string, aiResponse: string, confidence: number): void {
    this.conversationHistory.push({
      userInput,
      aiResponse,
      timestamp: new Date(),
      flowType: this.currentFlow?.type,
      confidence
    });

    // Keep only last 10 conversations
    if (this.conversationHistory.length > 10) {
      this.conversationHistory = this.conversationHistory.slice(-10);
    }
  }

  private setFlowTimeout(response: ConversationResponse): void {
    if (response.timeout && this.currentFlow) {
      this.flowTimeout = setTimeout(() => {
        this.handleFlowTimeout();
      }, response.timeout);
    }
  }

  private handleFlowTimeout(): void {
    if (this.currentFlow) {
      console.log(`Flow ${this.currentFlow.type} timed out`);
      this.clearFlow();
    }
  }

  private clearFlow(): void {
    this.currentFlow = null;
    if (this.flowTimeout) {
      clearTimeout(this.flowTimeout);
      this.flowTimeout = null;
    }
  }

  // Public methods
  public getCurrentFlow(): ConversationFlow | null {
    return this.currentFlow;
  }

  public getConversationHistory(): ConversationTurn[] {
    return this.conversationHistory;
  }

  public cancelCurrentFlow(): void {
    this.clearFlow();
  }

  public isInFlow(): boolean {
    return this.currentFlow !== null;
  }
}