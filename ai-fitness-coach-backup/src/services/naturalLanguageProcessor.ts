import type {
  VoiceCommandResult,
  VoiceAction,
  WorkoutContext
} from '../types/voice';
import { IntelligentAIService } from './intelligentAIService';

interface VoiceCommandIntent {
  action: VoiceAction;
  parameters: Record<string, any>;
  confidence: number;
  reasoning: string;
}

interface NumberWordMapping {
  [key: string]: number;
}

interface ExerciseMapping {
  [key: string]: string;
}

export class FitnessNLP {
  private aiService: IntelligentAIService;
  
  private exerciseDatabase: ExerciseMapping = {
    'bench': 'bench press',
    'squats': 'squat',
    'squat': 'squat', 
    'deadlift': 'deadlift',
    'deadlifts': 'deadlift',
    'rows': 'bent over row',
    'row': 'bent over row',
    'curls': 'bicep curl',
    'curl': 'bicep curl',
    'press': 'shoulder press',
    'overhead press': 'overhead press',
    'ohp': 'overhead press',
    'pullups': 'pull up',
    'pullup': 'pull up',
    'chin ups': 'chin up',
    'chinups': 'chin up',
    'pushups': 'push up',
    'pushup': 'push up',
    'dips': 'dip',
    'dip': 'dip',
    'lat pulldown': 'lat pulldown',
    'pulldown': 'lat pulldown',
    'leg press': 'leg press',
    'leg curl': 'leg curl',
    'leg extension': 'leg extension',
    'calf raise': 'calf raise',
    'calf raises': 'calf raise',
    'tricep extension': 'tricep extension',
    'lateral raise': 'lateral raise',
    'side raise': 'lateral raise',
    'shrugs': 'shrug',
    'shrug': 'shrug',
    'plank': 'plank',
    'planks': 'plank',
    'crunches': 'crunch',
    'crunch': 'crunch',
    'sit ups': 'sit up',
    'situps': 'sit up'
  };

  private numberWords: NumberWordMapping = {
    'zero': 0, 'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
    'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
    'eleven': 11, 'twelve': 12, 'thirteen': 13, 'fourteen': 14, 'fifteen': 15,
    'sixteen': 16, 'seventeen': 17, 'eighteen': 18, 'nineteen': 19, 'twenty': 20,
    'twenty one': 21, 'twenty two': 22, 'twenty three': 23, 'twenty four': 24, 'twenty five': 25,
    'thirty': 30, 'thirty five': 35, 'forty': 40, 'forty five': 45, 'fifty': 50,
    'sixty': 60, 'seventy': 70, 'eighty': 80, 'ninety': 90, 'hundred': 100,
    'one hundred': 100, 'one twenty five': 125, 'one fifty': 150, 'one seventy five': 175,
    'two hundred': 200, 'two twenty five': 225, 'two fifty': 250, 'two seventy five': 275,
    'three hundred': 300, 'three twenty five': 325, 'three fifty': 350, 'three seventy five': 375,
    'four hundred': 400, 'four fifty': 450, 'five hundred': 500
  };

  constructor() {
    this.aiService = new IntelligentAIService();
  }

  async parseVoiceInput(transcript: string, context: WorkoutContext): Promise<VoiceCommandResult> {
    const normalized = this.normalizeTranscript(transcript);
    
    // Try different parsing strategies in order of confidence
    const strategies = [
      () => this.parseSetLogging(normalized),
      () => this.parseWorkoutControl(normalized),
      () => this.parseQuestions(normalized),
      () => this.parseMotivation(normalized),
      () => this.parseNavigation(normalized),
      () => this.parseFormAnalysis(normalized),
      () => this.parseNutrition(normalized)
    ];

    for (const strategy of strategies) {
      const result = strategy();
      if (result.confidence > 0.7) {
        return {
          ...result,
          transcript: transcript,
          timestamp: new Date(),
          success: true
        };
      }
    }

    // If no pattern matches clearly, use AI for interpretation
    return this.parseWithAI(transcript, context);
  }

  private normalizeTranscript(transcript: string): string {
    return transcript
      .toLowerCase()
      .trim()
      // Handle common speech recognition errors
      .replace(/\bto\b/g, 'two')
      .replace(/\bfor\b/g, 'four')
      // Normalize units
      .replace(/\bpounds?\b/g, 'lbs')
      .replace(/\bkilos?\b/g, 'kg')
      .replace(/\bkilograms?\b/g, 'kg')
      // Normalize rep terminology
      .replace(/\breps?\b/g, 'reps')
      .replace(/\brepetitions?\b/g, 'reps')
      .replace(/\btimes?\b/g, 'reps')
      // Handle contractions
      .replace(/\bi'm\b/g, 'i am')
      .replace(/\bcan't\b/g, 'cannot')
      .replace(/\bwon't\b/g, 'will not')
      .replace(/\bdon't\b/g, 'do not');
  }

  private parseSetLogging(transcript: string): VoiceCommandIntent {
    // Enhanced patterns for natural set logging
    const patterns = [
      // "I just did eight reps of bench at two twenty five"
      /(?:i just |i |just )?(?:did|finished|completed) (\w+(?:\s+\w+)*) (?:reps? )?(?:of |for |on )?(\w+(?:\s+\w+)*) (?:at |with |for |@) (\w+(?:\s+\w+)*) ?(?:lbs?|kg|pounds?)?/i,
      // "Bench press 225 for 8 reps"
      /(\w+(?:\s+\w+)*) (\w+(?:\s+\w+)*) (?:for |at |x) (\w+(?:\s+\w+)*) (?:reps?)?/i,
      // "Just finished a set of squats, ten reps at one thirty five"
      /(?:just |i )?(?:finished|completed|did) (?:a set of |)(\w+(?:\s+\w+)*),? (\w+(?:\s+\w+)*) (?:reps? )?(?:at |with |for) (\w+(?:\s+\w+)*)/i,
      // "Log bench press 8 reps 185 pounds"
      /log (\w+(?:\s+\w+)*) (\w+(?:\s+\w+)*) (?:reps? )?(\w+(?:\s+\w+)*) ?(?:lbs?|kg|pounds?)?/i,
      // "8 reps bench press 185"
      /(\w+(?:\s+\w+)*) (?:reps? )?(\w+(?:\s+\w+)*) (\w+(?:\s+\w+)*)/i
    ];

    for (const pattern of patterns) {
      const match = transcript.match(pattern);
      if (match) {
        const components = this.parseSetComponents(match.slice(1));
        
        if (components.exercise && components.reps && components.weight) {
          return {
            action: 'LOG_EXERCISE',
            parameters: {
              exercise: this.normalizeExerciseName(components.exercise),
              reps: components.reps,
              weight: components.weight,
              unit: components.unit || 'lbs'
            },
            confidence: 0.9,
            reasoning: `Detected set logging for ${components.exercise}: ${components.reps} reps at ${components.weight} ${components.unit}`
          };
        }
      }
    }

    return { action: 'unknown', parameters: {}, confidence: 0, reasoning: 'No set logging pattern detected' };
  }

  private parseWorkoutControl(transcript: string): VoiceCommandIntent {
    const workoutPatterns = [
      { pattern: /(?:start|begin) (?:my |a |the )?([a-z ]+) workout/i, action: 'START_WORKOUT' },
      { pattern: /(?:start|begin) workout/i, action: 'START_WORKOUT' },
      { pattern: /(?:end|finish|complete|stop) (?:my |the )?workout/i, action: 'END_WORKOUT' },
      { pattern: /workout (?:complete|done|finished)/i, action: 'END_WORKOUT' },
      { pattern: /(?:take a |start |need a )?(?:break|rest|pause)/i, action: 'START_REST_TIMER' },
      { pattern: /(?:next|move to|go to) (?:exercise|movement)/i, action: 'NEXT_EXERCISE' },
      { pattern: /(?:previous|last|go back|back to) (?:exercise|movement)/i, action: 'PREVIOUS_EXERCISE' },
      { pattern: /(?:skip|pass) (?:this |the )?(?:exercise|movement)/i, action: 'SKIP_EXERCISE' }
    ];

    for (const { pattern, action } of workoutPatterns) {
      const match = transcript.match(pattern);
      if (match) {
        const parameters: any = {};
        if (match[1] && action === 'START_WORKOUT') {
          parameters.workoutType = match[1].trim();
        }
        
        return {
          action: action as VoiceAction,
          parameters,
          confidence: 0.95,
          reasoning: `Detected workout control command: ${action}`
        };
      }
    }

    return { action: 'unknown', parameters: {}, confidence: 0, reasoning: 'No workout control pattern detected' };
  }

  private parseQuestions(transcript: string): VoiceCommandIntent {
    const questionPatterns = [
      // Form questions
      { pattern: /(?:how (?:is|was)|check) my (\w+(?:\s+\w+)*) (?:form|technique)/i, action: 'FORM_ANALYSIS' },
      { pattern: /(?:analyze|check) (?:my )?(?:form )?(?:on |for )?(\w+(?:\s+\w+)*)/i, action: 'FORM_ANALYSIS' },
      
      // Exercise information
      { pattern: /(?:what muscles does|how to do|explain|teach me|tell me about) (\w+(?:\s+\w+)*)/i, action: 'EXERCISE_INFO' },
      { pattern: /(?:how do i|how to) (?:do |perform )?(\w+(?:\s+\w+)*)/i, action: 'EXERCISE_INFO' },
      
      // Progress questions
      { pattern: /what(?:'s| is) my (\w+(?:\s+\w+)*) (?:pr|max|record|personal record)/i, action: 'GET_PROGRESS' },
      { pattern: /show (?:my )?(\w+(?:\s+\w+)*) (?:pr|max|record)/i, action: 'GET_PROGRESS' },
      
      // Weight calculations
      { pattern: /what(?:'s| is) (\w+(?:\s+\w+)*)% of (?:my )?(\w+(?:\s+\w+)*) (?:max|pr)/i, action: 'WEIGHT_CALCULATION' },
      { pattern: /calculate (\w+(?:\s+\w+)*)% of (\w+(?:\s+\w+)*)/i, action: 'WEIGHT_CALCULATION' }
    ];

    for (const { pattern, action } of questionPatterns) {
      const match = transcript.match(pattern);
      if (match) {
        const parameters: any = {};
        
        if (action === 'FORM_ANALYSIS' || action === 'EXERCISE_INFO' || action === 'GET_PROGRESS') {
          parameters.exercise = this.normalizeExerciseName(match[1]);
        } else if (action === 'WEIGHT_CALCULATION') {
          parameters.percentage = this.parseNumber(match[1]);
          parameters.exercise = this.normalizeExerciseName(match[2]);
        }
        
        return {
          action: action as VoiceAction,
          parameters,
          confidence: 0.85,
          reasoning: `Detected question about ${action.toLowerCase().replace('_', ' ')}`
        };
      }
    }

    return { action: 'unknown', parameters: {}, confidence: 0, reasoning: 'No question pattern detected' };
  }

  private parseMotivation(transcript: string): VoiceCommandIntent {
    const motivationPatterns = [
      /(?:motivate me|i need motivation|pump me up|encourage me)/i,
      /(?:i (?:don't|do not) (?:want to|feel like)) (?:work out|working out|train|training)/i,
      /(?:give me|need) (?:some )?(?:motivation|encouragement)/i,
      /(?:i'm|i am) (?:tired|exhausted|feeling weak|struggling)/i,
      /(?:this is|it's) (?:hard|difficult|tough|challenging)/i
    ];

    for (const pattern of motivationPatterns) {
      if (pattern.test(transcript)) {
        return {
          action: 'MOTIVATION_REQUEST',
          parameters: { context: transcript },
          confidence: 0.9,
          reasoning: 'Detected request for motivation or encouragement'
        };
      }
    }

    return { action: 'unknown', parameters: {}, confidence: 0, reasoning: 'No motivation pattern detected' };
  }

  private parseNavigation(transcript: string): VoiceCommandIntent {
    const navigationPatterns = [
      { pattern: /(?:show|open|go to) (?:my )?(?:stats|statistics|progress)/i, action: 'SHOW_STATS' },
      { pattern: /(?:show|open|view) (?:my )?(?:history|workout history|past workouts)/i, action: 'SHOW_HISTORY' },
      { pattern: /(?:open|show|go to) (?:settings|preferences|options)/i, action: 'SHOW_SETTINGS' },
      { pattern: /(?:help|what can you do|commands|voice commands)/i, action: 'HELP' }
    ];

    for (const { pattern, action } of navigationPatterns) {
      if (pattern.test(transcript)) {
        return {
          action: action as VoiceAction,
          parameters: {},
          confidence: 0.85,
          reasoning: `Detected navigation command: ${action}`
        };
      }
    }

    return { action: 'unknown', parameters: {}, confidence: 0, reasoning: 'No navigation pattern detected' };
  }

  private parseFormAnalysis(transcript: string): VoiceCommandIntent {
    const formPatterns = [
      /(?:analyze|check|review) (?:my )?(?:form|technique) (?:on |for )?(\w+(?:\s+\w+)*)/i,
      /(?:how (?:is|was)|rate) my (\w+(?:\s+\w+)*) (?:form|technique)/i,
      /(?:form check|technique check) (?:on |for )?(\w+(?:\s+\w+)*)/i,
      /am i doing (\w+(?:\s+\w+)*) (?:correctly|right|properly)/i
    ];

    for (const pattern of formPatterns) {
      const match = transcript.match(pattern);
      if (match) {
        return {
          action: 'FORM_ANALYSIS',
          parameters: { exercise: this.normalizeExerciseName(match[1]) },
          confidence: 0.9,
          reasoning: `Detected form analysis request for ${match[1]}`
        };
      }
    }

    return { action: 'unknown', parameters: {}, confidence: 0, reasoning: 'No form analysis pattern detected' };
  }

  private parseNutrition(transcript: string): VoiceCommandIntent {
    const nutritionPatterns = [
      /what should i eat (?:before|after) (?:my )?workout/i,
      /(?:nutrition|meal|food) (?:advice|recommendations?|suggestions?)/i,
      /what (?:to eat|should i eat|can i eat)/i,
      /(?:pre|post) workout (?:nutrition|meal|food)/i,
      /(?:i'm|i am) (?:hungry|should i eat)/i
    ];

    for (const pattern of nutritionPatterns) {
      if (pattern.test(transcript)) {
        const timing = transcript.includes('before') ? 'pre-workout' :
                      transcript.includes('after') ? 'post-workout' : 'general';
        
        return {
          action: 'NUTRITION_QUERY',
          parameters: { timing, query: transcript },
          confidence: 0.8,
          reasoning: `Detected nutrition query with timing: ${timing}`
        };
      }
    }

    return { action: 'unknown', parameters: {}, confidence: 0, reasoning: 'No nutrition pattern detected' };
  }

  private async parseWithAI(transcript: string, context: WorkoutContext): Promise<VoiceCommandResult> {
    const prompt = `Parse this fitness voice command and extract the intent. The user is using voice to control their workout app.

USER SAID: "${transcript}"

WORKOUT CONTEXT: ${context.activeWorkout ? `Active workout: ${context.currentExercise?.exercise.name || 'Unknown exercise'}` : 'No active workout'}

Determine the most likely intent from these options:
- LOG_EXERCISE: User wants to log a set (reps/weight for an exercise)
- START_WORKOUT/END_WORKOUT: Control workout session
- FORM_ANALYSIS: User wants form feedback
- MOTIVATION_REQUEST: User needs motivation/encouragement
- EXERCISE_INFO: User wants to learn about an exercise
- NUTRITION_QUERY: User asking about nutrition/food
- GET_PROGRESS: User wants to see their progress/PRs
- NEXT_EXERCISE/PREVIOUS_EXERCISE: Navigate between exercises
- HELP: User needs help or doesn't know what to say
- CLARIFY: Command unclear, need clarification

Extract parameters if applicable:
- exercise: exercise name (normalized)
- reps: number of repetitions
- weight: weight amount
- unit: lbs or kg

Return ONLY this JSON format:
{
  "action": "ACTION_NAME",
  "parameters": {"exercise": "...", "reps": 0, "weight": 0},
  "confidence": 0.0-1.0,
  "reasoning": "Why you chose this action"
}`;

    try {
      const aiResponse = await this.aiService.getCoachingResponse(prompt, context, 'general-advice');
      const parsed = JSON.parse(aiResponse.content);
      
      return {
        success: true,
        action: parsed.action,
        parameters: parsed.parameters || {},
        confidence: parsed.confidence || 0.5,
        transcript: transcript,
        timestamp: new Date(),
        reasoning: parsed.reasoning || 'AI interpretation'
      };
    } catch (error) {
      console.warn('AI parsing failed:', error);
      
      // Fallback to asking user for clarification
      return {
        success: false,
        action: 'CLARIFY',
        parameters: { originalTranscript: transcript },
        confidence: 0.3,
        transcript: transcript,
        timestamp: new Date(),
        reasoning: 'Could not parse command, requesting clarification'
      };
    }
  }

  private parseSetComponents(components: string[]): {
    exercise?: string;
    reps?: number;
    weight?: number;
    unit?: string;
  } {
    const result: any = {};
    
    // Try to identify which component is which based on context
    for (const component of components) {
      const trimmed = component.trim();
      
      // Check if it's a number (reps or weight)
      const number = this.parseNumber(trimmed);
      if (number !== null) {
        // Heuristic: smaller numbers (< 50) are likely reps, larger are weights
        if (number <= 50 && !result.reps) {
          result.reps = number;
        } else if (!result.weight) {
          result.weight = number;
        }
      } else if (this.isExerciseName(trimmed)) {
        result.exercise = trimmed;
      }
    }
    
    // Handle edge cases and missing components
    if (!result.unit && result.weight) {
      // Default to lbs for weights over 50, kg for lower weights
      result.unit = result.weight > 50 ? 'lbs' : 'kg';
    }
    
    return result;
  }

  private parseNumber(text: string): number | null {
    // First try direct number parsing
    const directNumber = parseFloat(text);
    if (!isNaN(directNumber)) {
      return directNumber;
    }
    
    // Try word-to-number conversion
    const normalized = text.toLowerCase().trim();
    
    // Handle compound numbers like "twenty five"
    const words = normalized.split(/\s+/);
    let total = 0;
    
    for (const word of words) {
      if (this.numberWords[word] !== undefined) {
        total += this.numberWords[word];
      } else {
        // Try the complete phrase
        if (this.numberWords[normalized] !== undefined) {
          return this.numberWords[normalized];
        }
        return null;
      }
    }
    
    return total > 0 ? total : null;
  }

  private isExerciseName(text: string): boolean {
    const normalized = text.toLowerCase().trim();
    
    // Check exact matches
    if (this.exerciseDatabase[normalized]) {
      return true;
    }
    
    // Check partial matches
    for (const exercise of Object.keys(this.exerciseDatabase)) {
      if (normalized.includes(exercise) || exercise.includes(normalized)) {
        return true;
      }
    }
    
    // Check for common exercise keywords
    const exerciseKeywords = [
      'press', 'curl', 'extension', 'raise', 'row', 'pull', 'push', 
      'squat', 'deadlift', 'bench', 'fly', 'shrug', 'dip', 'plank'
    ];
    
    return exerciseKeywords.some(keyword => normalized.includes(keyword));
  }

  private normalizeExerciseName(name: string): string {
    const normalized = name.toLowerCase().trim();
    
    // Direct lookup
    if (this.exerciseDatabase[normalized]) {
      return this.exerciseDatabase[normalized];
    }
    
    // Fuzzy matching
    for (const [key, value] of Object.entries(this.exerciseDatabase)) {
      if (normalized.includes(key) || key.includes(normalized)) {
        return value;
      }
    }
    
    // Return original if no match found
    return name;
  }

  // Public method to add new exercise mappings dynamically
  addExerciseMapping(spoken: string, canonical: string): void {
    this.exerciseDatabase[spoken.toLowerCase()] = canonical;
  }

  // Public method to add new number word mappings
  addNumberMapping(word: string, value: number): void {
    this.numberWords[word.toLowerCase()] = value;
  }

  // Get suggestions for unclear commands
  getSuggestions(transcript: string): string[] {
    const suggestions = [
      "Try saying: 'Log bench press 8 reps at 185 pounds'",
      "Try saying: 'Start my workout'",
      "Try saying: 'How's my squat form?'",
      "Try saying: 'I need motivation'",
      "Try saying: 'What should I eat after workout?'"
    ];
    
    // Context-specific suggestions based on transcript
    if (transcript.includes('log') || transcript.includes('did')) {
      suggestions.unshift("Try: 'Log [exercise] [reps] reps at [weight] pounds'");
    }
    
    if (transcript.includes('how') || transcript.includes('what')) {
      suggestions.unshift("Try asking: 'How do I do squats?' or 'What muscles does bench press work?'");
    }
    
    return suggestions.slice(0, 3);
  }

  // Validate parsed command for safety and completeness
  validateCommand(result: VoiceCommandIntent): { valid: boolean; issues: string[] } {
    const issues: string[] = [];
    
    if (result.action === 'LOG_EXERCISE') {
      if (!result.parameters.exercise) {
        issues.push('Missing exercise name');
      }
      if (!result.parameters.reps || result.parameters.reps <= 0) {
        issues.push('Missing or invalid rep count');
      }
      if (!result.parameters.weight || result.parameters.weight <= 0) {
        issues.push('Missing or invalid weight');
      }
      if (result.parameters.weight && result.parameters.weight > 1000) {
        issues.push('Weight seems unusually high - please confirm');
      }
    }
    
    return {
      valid: issues.length === 0,
      issues
    };
  }
}