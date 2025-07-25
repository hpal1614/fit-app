import { StateGraph, END } from '@langchain/langgraph';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, AIMessage, SystemMessage } from '@langchain/core/messages';
import { fitnessRAG } from './ragService';
import { WorkoutContext, FitnessGoals, UserProfile } from '../types';

interface ConversationState {
  messages: unknown[];
  userProfile: UserProfile;
  workoutContext: WorkoutContext;
  fitnessGoals: FitnessGoals;
  conversationIntent: 'coaching' | 'planning' | 'motivation' | 'correction' | 'education';
  retrievedContext?: string[];
  emotionalTone?: 'supportive' | 'energetic' | 'calm' | 'challenging';
  currentResponse?: string;
}

interface ContextLayers {
  sessionLevel: unknown[];  // Recent conversation
  userLevel: UserProfile;  // User preferences and history
  domainLevel: string[];  // Fitness knowledge
}

export class FitnessConversationGraph {
  private graph: StateGraph<ConversationState>;
  private model: ChatOpenAI;
  
  constructor() {
    this.model = new ChatOpenAI({
      modelName: 'gpt-4-turbo-preview',
      temperature: 0.7,
      openAIApiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
    });

    // Initialize state graph
    this.graph = new StateGraph<ConversationState>({
      channels: {
        messages: {
          value: (x: unknown[], y: unknown[]) => [...x, ...y],
          default: () => [],
        },
        userProfile: {
          value: (x: any, y: any) => ({ ...x, ...y }),
          default: () => ({}),
        },
        workoutContext: {
          value: (x: any, y: any) => ({ ...x, ...y }),
          default: () => ({}),
        },
        fitnessGoals: {
          value: (x: any, y: any) => ({ ...x, ...y }),
          default: () => ({}),
        },
        conversationIntent: {
          value: (x: any, y: any) => y || x,
          default: () => 'coaching',
        },
        retrievedContext: {
          value: (x: any, y: any) => y || x,
          default: () => [],
        },
        emotionalTone: {
          value: (x: any, y: any) => y || x,
          default: () => 'supportive',
        },
        currentResponse: {
          value: (x: any, y: any) => y || x,
          default: () => '',
        },
      },
    });

    // Define conversation flow nodes
    this.graph
      .addNode('analyze_intent', this.analyzeIntent.bind(this))
      .addNode('retrieve_context', this.retrieveContext.bind(this))
      .addNode('generate_response', this.generateResponse.bind(this))
      .addNode('adapt_coaching_style', this.adaptCoachingStyle.bind(this))
      .addNode('form_correction', this.formCorrection.bind(this))
      .addNode('motivational_boost', this.motivationalBoost.bind(this))
      .addNode('educational_content', this.educationalContent.bind(this))
      .addNode('workout_planning', this.workoutPlanning.bind(this));

    // Define conversation edges with conditional routing
    this.graph
      .addEdge('__start__', 'analyze_intent')
      .addEdge('analyze_intent', 'retrieve_context')
      .addConditionalEdges(
        'retrieve_context',
        this.routeBasedOnIntent.bind(this),
        {
          coaching: 'adapt_coaching_style',
          correction: 'form_correction',
          motivation: 'motivational_boost',
          education: 'educational_content',
          planning: 'workout_planning',
        }
      )
      .addEdge('adapt_coaching_style', 'generate_response')
      .addEdge('form_correction', 'generate_response')
      .addEdge('motivational_boost', 'generate_response')
      .addEdge('educational_content', 'generate_response')
      .addEdge('workout_planning', 'generate_response')
      .addEdge('generate_response', END);
  }

  // Analyze user intent from message
  private async analyzeIntent(state: ConversationState): Promise<Partial<ConversationState>> {
    const lastMessage = state.messages[state.messages.length - 1];
    if (!lastMessage) return {};

    const intentPrompt = `Analyze the user's fitness-related message and categorize the intent.
    
    User message: "${lastMessage.content}"
    Workout context: ${JSON.stringify(state.workoutContext)}
    
    Categories:
    - coaching: General fitness coaching, workout guidance
    - correction: Form correction, technique questions
    - motivation: Need encouragement, feeling tired/unmotivated
    - education: Questions about fitness concepts, nutrition, physiology
    - planning: Workout planning, program design, goal setting
    
    Respond with only the category name.`;

    const response = await this.model.invoke([new SystemMessage(intentPrompt)]);
    const intent = response.content.toString().trim().toLowerCase() as ConversationState['conversationIntent'];

    // Determine emotional tone based on context
    let emotionalTone: ConversationState['emotionalTone'] = 'supportive';
    if (state.workoutContext?.intensity === 'high') {
      emotionalTone = 'energetic';
    } else if (intent === 'motivation') {
      emotionalTone = 'supportive';
    } else if (intent === 'correction') {
      emotionalTone = 'calm';
    }

    return {
      conversationIntent: intent,
      emotionalTone,
    };
  }

  // Retrieve relevant context using RAG
  private async retrieveContext(state: ConversationState): Promise<Partial<ConversationState>> {
    const lastMessage = state.messages[state.messages.length - 1];
    if (!lastMessage) return {};

    // Use speculative RAG to retrieve relevant fitness knowledge
    const retrievalResults = await fitnessRAG.speculativeRetrieve(
      lastMessage.content,
      state.messages
    );

    const retrievedContext = retrievalResults.map(r => r.content);

    return {
      retrievedContext,
    };
  }

  // Route based on detected intent
  private routeBasedOnIntent(state: ConversationState): string {
    return state.conversationIntent || 'coaching';
  }

  // Adapt coaching style based on user profile and context
  private async adaptCoachingStyle(state: ConversationState): Promise<Partial<ConversationState>> {
    const coachingPrompt = `You are an expert fitness coach providing personalized guidance.
    
    User Profile: ${JSON.stringify(state.userProfile)}
    Current Workout: ${JSON.stringify(state.workoutContext)}
    Fitness Goals: ${JSON.stringify(state.fitnessGoals)}
    Emotional Tone: ${state.emotionalTone}
    
    Adapt your coaching style to match the user's needs and current situation.
    Be ${state.emotionalTone} and focus on their specific goals.`;

    const messages = [
      new SystemMessage(coachingPrompt),
      ...state.messages,
    ];

    const response = await this.model.invoke(messages);

    return {
      currentResponse: response.content.toString(),
    };
  }

  // Provide form correction guidance
  private async formCorrection(state: ConversationState): Promise<Partial<ConversationState>> {
    const formPrompt = `You are an expert fitness coach specializing in exercise form and technique.
    
    Retrieved Exercise Knowledge: ${state.retrievedContext?.join('\n\n')}
    Current Exercise: ${state.workoutContext?.currentExercise}
    
    Provide clear, specific form correction advice. Focus on:
    1. Safety first - identify any dangerous form issues
    2. Key form cues for proper execution
    3. Common mistakes to avoid
    4. Practical tips for improvement
    
    Be clear, concise, and encouraging.`;

    const messages = [
      new SystemMessage(formPrompt),
      ...state.messages,
    ];

    const response = await this.model.invoke(messages);

    return {
      currentResponse: response.content.toString(),
    };
  }

  // Provide motivational support
  private async motivationalBoost(state: ConversationState): Promise<Partial<ConversationState>> {
    const motivationPrompt = `You are an expert fitness coach providing motivational support.
    
    User Profile: ${JSON.stringify(state.userProfile)}
    Fitness Goals: ${JSON.stringify(state.fitnessGoals)}
    Current Progress: ${JSON.stringify(state.workoutContext)}
    
    Provide genuine, personalized encouragement that:
    1. Acknowledges their current feelings
    2. Reminds them of their progress and goals
    3. Offers practical strategies to push through
    4. Uses their past successes as motivation
    
    Be authentic, empathetic, and energizing without being overly cheery.`;

    const messages = [
      new SystemMessage(motivationPrompt),
      ...state.messages,
    ];

    const response = await this.model.invoke(messages);

    return {
      currentResponse: response.content.toString(),
    };
  }

  // Provide educational content
  private async educationalContent(state: ConversationState): Promise<Partial<ConversationState>> {
    const educationPrompt = `You are an expert fitness educator explaining fitness concepts clearly.
    
    Retrieved Knowledge: ${state.retrievedContext?.join('\n\n')}
    
    Explain the concept in a way that:
    1. Is scientifically accurate but accessible
    2. Relates to the user's practical needs
    3. Includes actionable takeaways
    4. Avoids overwhelming jargon
    
    Make complex fitness science understandable and applicable.`;

    const messages = [
      new SystemMessage(educationPrompt),
      ...state.messages,
    ];

    const response = await this.model.invoke(messages);

    return {
      currentResponse: response.content.toString(),
    };
  }

  // Create workout plans
  private async workoutPlanning(state: ConversationState): Promise<Partial<ConversationState>> {
    const planningPrompt = `You are an expert fitness programmer creating personalized workout plans.
    
    User Profile: ${JSON.stringify(state.userProfile)}
    Fitness Goals: ${JSON.stringify(state.fitnessGoals)}
    Available Equipment: ${state.userProfile?.equipment || 'unknown'}
    Experience Level: ${state.userProfile?.experienceLevel || 'intermediate'}
    
    Create a workout plan that:
    1. Aligns with their specific goals
    2. Matches their experience level
    3. Uses available equipment
    4. Follows progressive overload principles
    5. Includes proper warm-up and cool-down
    
    Format the plan clearly with sets, reps, and rest periods.`;

    const messages = [
      new SystemMessage(planningPrompt),
      ...state.messages,
    ];

    const response = await this.model.invoke(messages);

    return {
      currentResponse: response.content.toString(),
    };
  }

  // Generate final response
  private async generateResponse(state: ConversationState): Promise<Partial<ConversationState>> {
    // Add the AI response to messages
    const aiMessage = new AIMessage(state.currentResponse || '');
    
    return {
      messages: [aiMessage],
    };
  }

  // Hierarchical context management
  private async manageContext(state: ConversationState): Promise<ContextLayers> {
    return {
      sessionLevel: state.messages.slice(-20), // Recent 20 messages
      userLevel: state.userProfile,
      domainLevel: state.retrievedContext || [],
    };
  }

  // Public method to run conversation
  async processMessage(
    message: string,
    userProfile: UserProfile,
    workoutContext: WorkoutContext,
    fitnessGoals: FitnessGoals,
    conversationHistory: unknown[] = []
  ): Promise<string> {
    const humanMessage = new HumanMessage(message);
    
    const initialState: ConversationState = {
      messages: [...conversationHistory, humanMessage],
      userProfile,
      workoutContext,
      fitnessGoals,
      conversationIntent: 'coaching',
    };

    const config = {
      recursionLimit: 10,
    };

    const result = await this.graph.invoke(initialState, config);
    
    // Cache the response for future similar queries
    if (result.currentResponse) {
      await fitnessRAG.cacheResponse(message, result.currentResponse);
    }
    
    return result.currentResponse || 'I apologize, but I couldn\'t generate a response. Please try again.';
  }

  // Create compiled graph
  compile() {
    return this.graph.compile();
  }
}

// Export singleton instance
export const conversationGraph = new FitnessConversationGraph();