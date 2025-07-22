import type { Exercise } from '../types/workout';
import { EXERCISE_ALIASES } from '../constants/voiceCommands';
import { getExerciseById, EXERCISE_DATABASE } from '../constants/exercises';
import { AICoachService } from './aiService';

// Natural Language Understanding Types
export interface NLPResult {
  intent: string;
  confidence: number;
  entities: NLPEntity[];
  context: NLPContext;
  alternatives: NLPAlternative[];
  originalText: string;
  normalizedText: string;
  timestamp: Date;
  aiInterpretation?: string;
}

export interface NLPEntity {
  type: 'exercise' | 'reps' | 'weight' | 'sets' | 'duration' | 'rest' | 'date' | 'muscle_group';
  value: any;
  text: string;
  position: [number, number];
  confidence: number;
  metadata?: Record<string, any>;
}

export interface NLPContext {
  previousIntent?: string;
  currentExercise?: string;
  recentEntities: NLPEntity[];
  userPatterns: UserPattern[];
  conversationState: 'idle' | 'exercise_logging' | 'asking_clarification' | 'providing_feedback';
  userPreferences: UserPreferences;
}

export interface NLPAlternative {
  intent: string;
  confidence: number;
  reason: string;
}

export interface UserPattern {
  pattern: string;
  frequency: number;
  lastUsed: Date;
  success: boolean;
  entities: string[];
  corrections: Array<{correctedTo: string, date: Date}>;
}

export interface UserPreferences {
  preferredUnits: 'lbs' | 'kg';
  commonExercises: string[];
  typicalRepRanges: Record<string, [number, number]>;
  typicalWeightRanges: Record<string, [number, number]>;
}

// Number word mappings - comprehensive list
const NUMBER_WORDS: Record<string, number> = {
  'zero': 0, 'one': 1, 'two': 2, 'three': 3, 'four': 4,
  'five': 5, 'six': 6, 'seven': 7, 'eight': 8, 'nine': 9,
  'ten': 10, 'eleven': 11, 'twelve': 12, 'thirteen': 13, 'fourteen': 14,
  'fifteen': 15, 'sixteen': 16, 'seventeen': 17, 'eighteen': 18, 'nineteen': 19,
  'twenty': 20, 'thirty': 30, 'forty': 40, 'fifty': 50, 'sixty': 60,
  'seventy': 70, 'eighty': 80, 'ninety': 90, 'hundred': 100,
  // Common weight numbers
  'twenty five': 25, 'thirty five': 35, 'forty five': 45,
  'one hundred': 100, 'one twenty five': 125, 'one thirty five': 135,
  'one forty five': 145, 'one fifty': 150, 'one seventy five': 175,
  'two hundred': 200, 'two twenty five': 225, 'two fifty': 250,
  'two seventy five': 275, 'three hundred': 300, 'three fifteen': 315,
  'three twenty five': 325, 'three fifty': 350, 'three sixty five': 365,
  'four hundred': 400, 'four oh five': 405, 'four twenty five': 425,
  'four fifty': 450, 'four ninety five': 495, 'five hundred': 500,
};

export class EnhancedNLPService {
  private userPatterns: Map<string, UserPattern[]> = new Map();
  private context: NLPContext;
  private aiService: AICoachService;
  
  constructor() {
    this.loadUserPatterns();
    this.aiService = AICoachService.getInstance();
    this.context = {
      recentEntities: [],
      userPatterns: [],
      conversationState: 'idle',
      userPreferences: this.loadUserPreferences()
    };
  }

  /**
   * Main NLP processing function - uses AI for true natural language understanding
   */
  async processText(text: string, context?: Partial<NLPContext>): Promise<NLPResult> {
    const normalizedText = this.normalizeText(text);
    
    // Update context
    if (context) {
      this.context = { ...this.context, ...context };
    }
    
    // Try AI-powered understanding for complex natural language
    const aiResult = await this.aiPoweredUnderstanding(text);
    
    // Extract entities based on AI understanding
    const entities = await this.extractEntities(normalizedText, text, aiResult.intent);
    
    // Learn from this interaction
    this.learnPattern(text, aiResult.intent, entities);
    
    // Build result
    const result: NLPResult = {
      intent: aiResult.intent,
      confidence: aiResult.confidence,
      entities,
      context: this.context,
      alternatives: aiResult.alternatives || [],
      originalText: text,
      normalizedText,
      timestamp: new Date(),
      aiInterpretation: aiResult.interpretation
    };
    
    // Update context for next interaction
    this.updateContext(result);
    
    return result;
  }

  /**
   * AI-powered natural language understanding
   */
  private async aiPoweredUnderstanding(text: string): Promise<{
    intent: string;
    confidence: number;
    interpretation: string;
    alternatives: NLPAlternative[];
    extractedData?: any;
  }> {
    try {
      const prompt = `Analyze this fitness voice command and extract the intent and data:

Text: "${text}"

Context: ${this.context.currentExercise ? `Currently doing ${this.context.currentExercise}` : 'No active exercise'}
Previous intent: ${this.context.previousIntent || 'none'}

Possible intents:
- log_exercise: User wants to log a workout set
- quick_log: User is quickly logging reps for current exercise  
- ask_ai: User has a question or needs advice
- motivation: User needs encouragement
- form_analysis: User wants form feedback
- nutrition: User has nutrition questions
- workout_control: User wants to start/end/control workout
- rest_timer: User wants to set a rest timer

Parse and extract:
1. Primary intent (from list above)
2. Exercise name (if mentioned) - common names: bench press, squat, deadlift, etc.
3. Numbers (could be reps or weight) - handle word numbers like "eight", "two twenty five"
4. Confidence (0-1)
5. Brief explanation of understanding

Examples:
"I just did eight bench at two twenty five" 
→ intent: log_exercise, exercise: bench press, reps: 8, weight: 225, confidence: 0.95

"10 reps"
→ intent: quick_log, reps: 10, confidence: 0.9

Return as JSON with structure:
{
  "intent": "string",
  "confidence": number,
  "exercise": "string or null",
  "reps": number or null,
  "weight": number or null,
  "explanation": "string"
}`;

      const response = await this.aiService.getCoachingResponse(
        prompt,
        {} as any,
        'general-advice'
      );

      // Try to parse JSON from response
      let parsed: any;
      try {
        // Extract JSON from response if wrapped in markdown
        const jsonMatch = response.content.match(/```json\n([\s\S]*?)\n```/) || 
                         response.content.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : response.content;
        parsed = JSON.parse(jsonStr);
      } catch {
        // Fallback parsing
        return this.fallbackParsing(text);
      }

      return {
        intent: parsed.intent || 'unknown',
        confidence: parsed.confidence || 0.7,
        interpretation: parsed.explanation || 'AI understanding',
        alternatives: [],
        extractedData: {
          exercise: parsed.exercise,
          reps: parsed.reps,
          weight: parsed.weight
        }
      };

    } catch (error) {
      console.error('AI understanding failed:', error);
      return this.fallbackParsing(text);
    }
  }

  /**
   * Fallback parsing when AI fails
   */
  private fallbackParsing(text: string): any {
    const lower = text.toLowerCase();
    
    // Simple pattern matching as fallback
    if (lower.includes('did') || lower.includes('completed') || lower.includes('finished')) {
      return {
        intent: 'log_exercise',
        confidence: 0.6,
        interpretation: 'Pattern-based fallback',
        alternatives: []
      };
    }
    
    if (lower.includes('how') || lower.includes('what') || lower.includes('help')) {
      return {
        intent: 'ask_ai',
        confidence: 0.5,
        interpretation: 'Question detected',
        alternatives: []
      };
    }
    
    return {
      intent: 'unknown',
      confidence: 0.1,
      interpretation: 'Could not understand',
      alternatives: []
    };
  }

  /**
   * Extract entities with advanced NLP techniques
   */
  private async extractEntities(normalizedText: string, originalText: string, intent: string): Promise<NLPEntity[]> {
    const entities: NLPEntity[] = [];
    
    // Extract exercise names
    const exerciseEntity = this.extractExercise(normalizedText, originalText);
    if (exerciseEntity) {
      entities.push(exerciseEntity);
    }
    
    // Extract numbers (both digits and word numbers)
    const numberEntities = this.extractNumbers(normalizedText, originalText);
    entities.push(...numberEntities);
    
    // Resolve entity types based on context
    if (intent === 'log_exercise' || intent === 'quick_log') {
      this.resolveExerciseLogEntities(entities, originalText);
    }
    
    return entities;
  }

  /**
   * Extract exercise names using fuzzy matching
   */
  private extractExercise(normalizedText: string, originalText: string): NLPEntity | null {
    // Check common aliases
    for (const [exerciseId, aliases] of Object.entries(EXERCISE_ALIASES)) {
      for (const alias of aliases) {
        const aliasLower = alias.toLowerCase();
        const index = normalizedText.indexOf(aliasLower);
        if (index !== -1) {
          return {
            type: 'exercise',
            value: exerciseId,
            text: alias,
            position: [index, index + alias.length],
            confidence: 0.95,
            metadata: { matched: 'alias' }
          };
        }
      }
    }
    
    // Fuzzy match against exercise database
    let bestMatch: { exercise: Exercise, score: number } | null = null;
    
    for (const exercise of EXERCISE_DATABASE) {
      const score = this.fuzzyMatch(normalizedText, exercise.name.toLowerCase());
      if (score > 0.7 && (!bestMatch || score > bestMatch.score)) {
        bestMatch = { exercise, score };
      }
    }
    
    if (bestMatch) {
      const exercise = bestMatch.exercise;
      const index = originalText.toLowerCase().indexOf(exercise.name.toLowerCase());
      return {
        type: 'exercise',
        value: exercise.id,
        text: exercise.name,
        position: [index !== -1 ? index : 0, index !== -1 ? index + exercise.name.length : exercise.name.length],
        confidence: bestMatch.score,
        metadata: { matched: 'fuzzy', exercise }
      };
    }
    
    return null;
  }

  /**
   * Advanced number extraction including word numbers
   */
  private extractNumbers(normalizedText: string, originalText: string): NLPEntity[] {
    const entities: NLPEntity[] = [];
    const words = normalizedText.split(/\s+/);
    
    // First extract digit numbers
    const digitPattern = /\b(\d+(?:\.\d+)?)\b/g;
    let match;
    while ((match = digitPattern.exec(originalText)) !== null) {
      entities.push({
        type: 'reps', // Will be resolved later
        value: parseFloat(match[1]),
        text: match[1],
        position: [match.index, match.index + match[1].length],
        confidence: 1.0,
        metadata: { source: 'digit' }
      });
    }
    
    // Extract word numbers with position tracking
    let currentPos = 0;
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const nextWord = i < words.length - 1 ? words[i + 1] : '';
      const twoWords = `${word} ${nextWord}`;
      const nextNextWord = i < words.length - 2 ? words[i + 2] : '';
      const threeWords = `${word} ${nextWord} ${nextNextWord}`;
      
      // Find position in original text
      const wordIndex = originalText.toLowerCase().indexOf(word, currentPos);
      if (wordIndex !== -1) {
        currentPos = wordIndex + word.length;
      }
      
      // Check three-word combinations (e.g., "two twenty five")
      if (NUMBER_WORDS[threeWords]) {
        const index = originalText.toLowerCase().indexOf(threeWords);
        entities.push({
          type: 'weight', // Multi-word numbers are often weights
          value: NUMBER_WORDS[threeWords],
          text: threeWords,
          position: [index !== -1 ? index : 0, index !== -1 ? index + threeWords.length : threeWords.length],
          confidence: 0.9,
          metadata: { source: 'word_number' }
        });
        i += 2; // Skip processed words
      }
      // Check two-word combinations
      else if (NUMBER_WORDS[twoWords]) {
        const index = originalText.toLowerCase().indexOf(twoWords);
        entities.push({
          type: 'weight',
          value: NUMBER_WORDS[twoWords],
          text: twoWords,
          position: [index !== -1 ? index : 0, index !== -1 ? index + twoWords.length : twoWords.length],
          confidence: 0.9,
          metadata: { source: 'word_number' }
        });
        i += 1;
      }
      // Check single words
      else if (NUMBER_WORDS[word]) {
        entities.push({
          type: 'reps', // Single word numbers often reps
          value: NUMBER_WORDS[word],
          text: word,
          position: [wordIndex !== -1 ? wordIndex : 0, wordIndex !== -1 ? wordIndex + word.length : word.length],
          confidence: 0.85,
          metadata: { source: 'word_number' }
        });
      }
    }
    
    return entities;
  }

  /**
   * Resolve entity types based on context and position
   */
  private resolveExerciseLogEntities(entities: NLPEntity[], text: string): void {
    const numbers = entities.filter(e => e.type === 'reps' || e.type === 'weight');
    const exercise = entities.find(e => e.type === 'exercise');
    
    if (numbers.length === 0) return;
    
    // If only one number and we have context
    if (numbers.length === 1 && this.context.currentExercise) {
      numbers[0].type = 'reps';
      return;
    }
    
    // Use position and context clues
    numbers.sort((a, b) => a.position[0] - b.position[0]);
    
    // Look for weight indicators
    const weightPattern = /\b(?:at|with|using|@)\s+(\w+(?:\s+\w+)*)/i;
    const weightMatch = text.match(weightPattern);
    
    if (weightMatch && numbers.length >= 2) {
      // The number after "at/with" is weight
      const weightText = weightMatch[1].toLowerCase();
      const weightNumber = numbers.find(n => 
        weightText.includes(n.text.toLowerCase()) ||
        n.position[0] > weightMatch.index!
      );
      if (weightNumber) {
        weightNumber.type = 'weight';
        // Other number(s) must be reps
        numbers.filter(n => n !== weightNumber).forEach(n => n.type = 'reps');
        return;
      }
    }
    
    // Default heuristic: first number is reps, second is weight
    if (numbers.length >= 2) {
      numbers[0].type = 'reps';
      numbers[1].type = 'weight';
    }
    
    // Use user preferences if available
    if (exercise && this.context.userPreferences.typicalRepRanges[exercise.value]) {
      const [minReps, maxReps] = this.context.userPreferences.typicalRepRanges[exercise.value];
      const [minWeight, maxWeight] = this.context.userPreferences.typicalWeightRanges[exercise.value] || [0, 1000];
      
      numbers.forEach(num => {
        if (num.value >= minReps && num.value <= maxReps && num.value < 30) {
          num.type = 'reps';
        } else if (num.value >= minWeight || num.value > 50) {
          num.type = 'weight';
        }
      });
    }
  }

  /**
   * Fuzzy string matching
   */
  private fuzzyMatch(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Levenshtein distance for fuzzy matching
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  /**
   * Learn from user patterns
   */
  private learnPattern(text: string, intent: string, entities: NLPEntity[]): void {
    const pattern: UserPattern = {
      pattern: text.toLowerCase(),
      frequency: 1,
      lastUsed: new Date(),
      success: true,
      entities: entities.map(e => e.type),
      corrections: []
    };
    
    const userPatterns = this.userPatterns.get(intent) || [];
    const existingIndex = userPatterns.findIndex(p => p.pattern === pattern.pattern);
    
    if (existingIndex >= 0) {
      userPatterns[existingIndex].frequency++;
      userPatterns[existingIndex].lastUsed = new Date();
    } else {
      userPatterns.push(pattern);
      // Keep only recent patterns
      if (userPatterns.length > 50) {
        userPatterns.shift();
      }
    }
    
    // Learn preferences
    if (intent === 'log_exercise') {
      const exercise = entities.find(e => e.type === 'exercise');
      const reps = entities.find(e => e.type === 'reps');
      const weight = entities.find(e => e.type === 'weight');
      
      if (exercise && reps && weight) {
        this.updateUserPreferences(exercise.value, reps.value, weight.value);
      }
    }
    
    this.userPatterns.set(intent, userPatterns);
    this.saveUserPatterns();
  }

  /**
   * Update user preferences
   */
  private updateUserPreferences(exercise: string, reps: number, weight: number): void {
    // Track common exercises
    if (!this.context.userPreferences.commonExercises.includes(exercise)) {
      this.context.userPreferences.commonExercises.push(exercise);
      if (this.context.userPreferences.commonExercises.length > 10) {
        this.context.userPreferences.commonExercises.shift();
      }
    }
    
    // Update typical ranges
    const repRange = this.context.userPreferences.typicalRepRanges[exercise] || [reps, reps];
    this.context.userPreferences.typicalRepRanges[exercise] = [
      Math.min(repRange[0], reps),
      Math.max(repRange[1], reps)
    ];
    
    const weightRange = this.context.userPreferences.typicalWeightRanges[exercise] || [weight, weight];
    this.context.userPreferences.typicalWeightRanges[exercise] = [
      Math.min(weightRange[0], weight),
      Math.max(weightRange[1], weight)
    ];
    
    this.saveUserPreferences();
  }

  /**
   * Update context based on results
   */
  private updateContext(result: NLPResult): void {
    this.context.previousIntent = result.intent;
    this.context.recentEntities = [
      ...result.entities,
      ...this.context.recentEntities.slice(0, 5)
    ];
    
    // Update conversation state
    if (result.intent === 'log_exercise' || result.intent === 'quick_log') {
      this.context.conversationState = 'exercise_logging';
      const exerciseEntity = result.entities.find(e => e.type === 'exercise');
      if (exerciseEntity) {
        this.context.currentExercise = exerciseEntity.value;
      }
    }
  }

  /**
   * Normalize text
   */
  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Load patterns from storage
   */
  private loadUserPatterns(): void {
    try {
      const stored = localStorage.getItem('nlp_user_patterns');
      if (stored) {
        const parsed = JSON.parse(stored);
        this.userPatterns = new Map(Object.entries(parsed));
      }
    } catch (error) {
      console.error('Failed to load user patterns:', error);
    }
  }

  /**
   * Save patterns to storage
   */
  private saveUserPatterns(): void {
    try {
      const obj = Object.fromEntries(this.userPatterns);
      localStorage.setItem('nlp_user_patterns', JSON.stringify(obj));
    } catch (error) {
      console.error('Failed to save user patterns:', error);
    }
  }

  /**
   * Load user preferences
   */
  private loadUserPreferences(): UserPreferences {
    try {
      const stored = localStorage.getItem('nlp_user_preferences');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load user preferences:', error);
    }
    
    return {
      preferredUnits: 'lbs',
      commonExercises: [],
      typicalRepRanges: {},
      typicalWeightRanges: {}
    };
  }

  /**
   * Save user preferences
   */
  private saveUserPreferences(): void {
    try {
      localStorage.setItem('nlp_user_preferences', JSON.stringify(this.context.userPreferences));
    } catch (error) {
      console.error('Failed to save user preferences:', error);
    }
  }

  /**
   * Get context
   */
  getContext(): NLPContext {
    return { ...this.context };
  }

  /**
   * Clear context
   */
  clearContext(): void {
    this.context = {
      recentEntities: [],
      userPatterns: Array.from(this.userPatterns.values()).flat(),
      conversationState: 'idle',
      userPreferences: this.context.userPreferences
    };
  }

  // Singleton
  private static instance: EnhancedNLPService;
  
  static getInstance(): EnhancedNLPService {
    if (!EnhancedNLPService.instance) {
      EnhancedNLPService.instance = new EnhancedNLPService();
    }
    return EnhancedNLPService.instance;
  }
}

export default EnhancedNLPService;
