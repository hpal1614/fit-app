import { BrowserVectorStore, VectorItem } from './ai/BrowserVectorStore';

interface RAGQueryResult {
  answer: string;
  sources: Array<{
    title: string;
    type: string;
    relevance: number;
  }>;
  confidence: number;
  followUpQuestions: string[];
}

interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  type: 'exercise' | 'nutrition' | 'principle';
  tags: string[];
}

export class FitnessRAGService {
  private vectorStore: BrowserVectorStore;
  private knowledgeBase: KnowledgeItem[];
  private initialized = false;

  constructor() {
    this.vectorStore = new BrowserVectorStore('fitness-knowledge');
    this.knowledgeBase = this.getDefaultKnowledgeBase();
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Check if we need to seed the knowledge base
      if (!this.vectorStore.hasData()) {
        await this.seedKnowledgeBase();
      }

      this.initialized = true;
      console.log('RAG Service initialized with local vector store');
      
      // Run test to verify system
      await this.testEmbeddingSystem();
    } catch (error) {
      console.error('Failed to initialize RAG service:', error);
    }
  }

  async query(query: string): Promise<RAGQueryResult> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      console.log('🔍 RAG Query:', query);
      
      // Generate query embedding
      const queryVector = this.generateEmbedding(query);
      console.log('📊 Query embedding generated, length:', queryVector.length);

      // Check if vector store has data
      if (!this.vectorStore.hasData()) {
        console.log('⚠️ Vector store empty, seeding knowledge base...');
        await this.seedKnowledgeBase();
      }

      // Search vector store
      const results = await this.vectorStore.query(queryVector, 5);
      console.log('🔎 Search results:', results.length, 'items found');

      // Log top results for debugging
      if (results.length > 0) {
        console.log('🏆 Top result:', {
          title: results[0].item.metadata.title,
          score: results[0].score,
          type: results[0].item.metadata.type
        });
      }

      // Format response
      const sources = results.map(r => ({
        title: r.item.metadata.title,
        type: r.item.metadata.type,
        relevance: r.score
      }));

      const answer = this.generateAnswer(query, results);
      const confidence = this.calculateConfidence(results);
      const followUpQuestions = this.generateFollowUpQuestions(query, results);

      console.log('✅ RAG Response generated:', {
        answerLength: answer.length,
        sourcesCount: sources.length,
        confidence: confidence
      });

      return {
        answer,
        sources,
        confidence,
        followUpQuestions
      };
    } catch (error) {
      console.error('❌ RAG query failed:', error);
      return {
        answer: "I'm having trouble accessing my knowledge base. Could you try rephrasing your question?",
        sources: [],
        confidence: 0.1,
        followUpQuestions: []
      };
    }
  }

  // Test method to verify embedding system
  async testEmbeddingSystem(): Promise<void> {
    console.log('🧪 Testing embedding system...');
    
    // Test query
    const testQuery = 'pushup';
    console.log('🔍 Test query:', testQuery);
    
    // Generate embedding
    const queryVector = this.generateEmbedding(testQuery);
    console.log('📊 Query embedding:', queryVector.slice(0, 10), '...');
    console.log('📊 Non-zero values:', queryVector.filter(v => v > 0).length);
    
    // Check knowledge base
    console.log('📚 Knowledge base items:', this.knowledgeBase.length);
    this.knowledgeBase.forEach(item => {
      const itemVector = this.generateEmbedding(item.content);
      const similarity = this.cosineSimilarity(queryVector, itemVector);
      console.log(`📊 "${item.title}" similarity:`, similarity);
    });
    
    // Test vector store
    if (this.vectorStore.hasData()) {
      const results = await this.vectorStore.query(queryVector, 3);
      console.log('🏆 Vector store results:', results.map(r => ({
        title: r.item.metadata.title,
        score: r.score
      })));
    } else {
      console.log('⚠️ Vector store has no data');
    }
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  private async seedKnowledgeBase(): Promise<void> {
    console.log('🌱 Seeding fitness knowledge base...');
    console.log('📚 Knowledge base items:', this.knowledgeBase.length);

    try {
      const vectorItems: VectorItem[] = this.knowledgeBase.map(item => {
        const vector = this.generateEmbedding(item.content);
        console.log(`📝 Created vector for "${item.title}":`, {
          vectorLength: vector.length,
          nonZeroValues: vector.filter(v => v > 0).length
        });
        
        return {
          id: item.id,
          vector: vector,
          metadata: item
        };
      });

      await this.vectorStore.addItems(vectorItems);
      console.log(`✅ Seeded ${vectorItems.length} knowledge items successfully`);
      
      // Verify seeding
      if (this.vectorStore.hasData()) {
        console.log('✅ Vector store verification: Data confirmed');
      } else {
        console.error('❌ Vector store verification: No data found after seeding');
      }
    } catch (error) {
      console.error('❌ Failed to seed knowledge base:', error);
      throw error;
    }
  }

  private generateEmbedding(text: string): number[] {
    // Enhanced keyword-based embedding for better matching
    const keywords = [
      // Exercise keywords
      'squat', 'squats', 'deadlift', 'deadlifts', 'bench', 'bench press', 'press', 'row', 'rows', 'pull', 'pulls', 'push', 'pushes',
      'curl', 'curls', 'extension', 'extensions', 'press', 'presses', 'fly', 'flies', 'lunge', 'lunges', 'step', 'steps',
      'muscle', 'muscles', 'strength', 'power', 'endurance', 'cardio', 'hiit', 'aerobic', 'anaerobic',
      
      // Body parts
      'chest', 'back', 'shoulders', 'arms', 'biceps', 'triceps', 'legs', 'quads', 'quadriceps', 'hamstrings', 'glutes', 'calves',
      'core', 'abs', 'abdominal', 'neck', 'forearms', 'traps', 'lats', 'deltoids',
      
      // Nutrition keywords
      'protein', 'proteins', 'carbs', 'carbohydrates', 'fat', 'fats', 'calories', 'calorie', 'nutrition', 'diet', 'food', 'eating',
      'meal', 'meals', 'supplement', 'supplements', 'vitamin', 'vitamins', 'mineral', 'minerals',
      
      // Training keywords
      'form', 'technique', 'safety', 'injury', 'injuries', 'warmup', 'warm up', 'recovery', 'rest', 'training', 'workout', 'workouts',
      'exercise', 'exercises', 'beginner', 'beginners', 'intermediate', 'advanced', 'progression', 'sets', 'reps', 'repetitions',
      'weight', 'weights', 'dumbbell', 'dumbbells', 'barbell', 'barbells', 'machine', 'machines', 'bodyweight', 'body weight',
      
      // Action words
      'how', 'what', 'when', 'why', 'where', 'perform', 'performing', 'do', 'doing', 'lift', 'lifting', 'move', 'moving',
      'stand', 'standing', 'sit', 'sitting', 'lie', 'lying', 'hold', 'holding', 'grip', 'gripping'
    ];

    const textLower = text.toLowerCase();
    const words = textLower.split(/\s+/);
    
    // Create embedding with better scoring
    const embedding = keywords.map(keyword => {
      // Check for exact matches
      if (textLower.includes(keyword)) {
        return 1.0;
      }
      
      // Check for partial matches
      const keywordWords = keyword.split(/\s+/);
      let partialMatch = 0;
      
      for (const word of words) {
        for (const kw of keywordWords) {
          if (word.includes(kw) || kw.includes(word)) {
            partialMatch += 0.5;
          }
        }
      }
      
      return Math.min(partialMatch, 1.0);
    });

    // Normalize the embedding
    const sum = embedding.reduce((a, b) => a + b, 0);
    if (sum > 0) {
      return embedding.map(val => val / sum);
    }
    
    return embedding;
  }

  private generateAnswer(query: string, results: Array<{ item: VectorItem; score: number }>): string {
    if (results.length === 0) {
      return "I don't have specific information about that in my knowledge base. Could you try asking about exercises, nutrition, or training principles?";
    }

    const topResult = results[0].item.metadata as KnowledgeItem;
    const queryLower = query.toLowerCase();

    // Generate contextual answer based on query type
    if (queryLower.includes('how') || queryLower.includes('form')) {
      return `Based on my knowledge of ${topResult.title}:\n\n${topResult.content}\n\nThis is ${topResult.type === 'exercise' ? 'an exercise' : topResult.type} recommendation with ${Math.round(results[0].score * 100)}% relevance to your question.`;
    }

    if (queryLower.includes('what') || queryLower.includes('explain')) {
      return `${topResult.title} is ${topResult.content}\n\nI found this in my ${topResult.type} knowledge base.`;
    }

    // Default response
    return `Here's what I know about that:\n\n${topResult.content}\n\nThis information comes from my ${topResult.type} knowledge base.`;
  }

  private calculateConfidence(results: Array<{ score: number }>): number {
    if (results.length === 0) return 0.1;
    
    const avgScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;
    return Math.min(0.3 + (avgScore * 0.7), 0.95);
  }

  private generateFollowUpQuestions(query: string, results: any[]): string[] {
    if (results.length === 0) return [];

    const topResult = results[0].item.metadata as KnowledgeItem;

    if (topResult.type === 'exercise') {
      return [
        `What muscles does ${topResult.title} work?`,
        `How many sets and reps for ${topResult.title}?`,
        `What are common mistakes with ${topResult.title}?`,
        'Can you suggest an alternative exercise?'
      ];
    }

    if (topResult.type === 'nutrition') {
      return [
        'How much protein do I need daily?',
        'What should I eat before a workout?',
        'When should I eat after training?',
        'How do I track my macros?'
      ];
    }

    return [
      'How do I improve my form?',
      'What exercises should beginners start with?',
      'How often should I train?',
      'What are the best recovery strategies?'
    ];
  }

  private getDefaultKnowledgeBase(): KnowledgeItem[] {
    return [
      // Exercise Knowledge
      {
        id: 'squat-basics',
        title: 'Squat',
        content: 'The squat is a fundamental compound exercise that targets the quadriceps, hamstrings, and glutes. To perform: Stand with feet shoulder-width apart, lower your body by bending at the knees and hips as if sitting back into a chair, keep your chest up and core engaged, descend until thighs are parallel to the floor, then push through your heels to return to standing. Common mistakes include letting knees cave inward, not keeping chest up, and not going deep enough.',
        type: 'exercise',
        tags: ['legs', 'compound', 'strength', 'quads', 'hamstrings', 'glutes']
      },
      {
        id: 'deadlift-basics',
        title: 'Deadlift',
        content: 'The deadlift is a powerful full-body exercise primarily targeting the posterior chain. Setup: Stand with feet hip-width apart, bar over mid-foot. Bend at hips and knees to grip the bar. Keep back straight, chest up. Drive through heels and extend hips and knees simultaneously. Lock out at the top with shoulders back. This exercise works your hamstrings, glutes, lower back, and core muscles.',
        type: 'exercise',
        tags: ['back', 'compound', 'strength', 'power', 'hamstrings', 'glutes', 'core']
      },
      {
        id: 'bench-press-basics',
        title: 'Bench Press',
        content: 'The bench press is the primary upper body pushing exercise for chest, shoulders, and triceps. Lie on bench with eyes under the bar, grip slightly wider than shoulders, lower the bar to chest with control, press up powerfully while keeping feet planted and maintaining arch in back. Keep your core tight and don\'t bounce the bar off your chest.',
        type: 'exercise',
        tags: ['chest', 'compound', 'upper-body', 'shoulders', 'triceps']
      },
      {
        id: 'pull-up-basics',
        title: 'Pull-up',
        content: 'Pull-ups are an excellent upper body pulling exercise that targets your back, biceps, and shoulders. Hang from a pull-up bar with hands slightly wider than shoulders, pull your body up until your chin is over the bar, then lower with control. Keep your core engaged and avoid swinging. If you can\'t do full pull-ups, start with assisted pull-ups or negative pull-ups.',
        type: 'exercise',
        tags: ['back', 'compound', 'upper-body', 'biceps', 'shoulders']
      },
      {
        id: 'push-up-basics',
        title: 'Push-up',
        content: 'Push-ups are a fundamental bodyweight exercise for chest, shoulders, and triceps. Start in a plank position with hands slightly wider than shoulders, lower your body until your chest nearly touches the ground, then push back up. Keep your body in a straight line from head to heels. Modify by doing knee push-ups if needed.',
        type: 'exercise',
        tags: ['chest', 'bodyweight', 'upper-body', 'shoulders', 'triceps']
      },
      {
        id: 'lunge-basics',
        title: 'Lunge',
        content: 'Lunges are a great unilateral leg exercise that targets quads, hamstrings, and glutes while improving balance. Step forward with one leg, lower your body until both knees are bent at 90 degrees, then push back to starting position. Keep your torso upright and core engaged. You can do walking lunges, reverse lunges, or lateral lunges.',
        type: 'exercise',
        tags: ['legs', 'unilateral', 'quads', 'hamstrings', 'glutes', 'balance']
      },
      
      // Nutrition Knowledge
      {
        id: 'protein-basics',
        title: 'Protein Requirements',
        content: 'Protein is essential for muscle building and recovery. General recommendations: 0.8-1.2g per pound of body weight for active individuals, 1.2-1.6g for those building muscle, and up to 2g for intense training. Good sources include lean meats, fish, eggs, dairy, legumes, and protein powders. Spread protein intake throughout the day for optimal absorption.',
        type: 'nutrition',
        tags: ['protein', 'muscle', 'recovery', 'macros']
      },
      {
        id: 'carbohydrates-basics',
        title: 'Carbohydrates for Fitness',
        content: 'Carbohydrates are your body\'s primary energy source for exercise. Complex carbs like whole grains, fruits, and vegetables provide sustained energy. Simple carbs can be useful before/during intense workouts. Aim for 3-7g per pound of body weight depending on activity level. Time carbs around workouts for optimal performance.',
        type: 'nutrition',
        tags: ['carbs', 'energy', 'fuel', 'macros', 'performance']
      },
      {
        id: 'fats-basics',
        title: 'Healthy Fats',
        content: 'Fats are essential for hormone production, vitamin absorption, and overall health. Focus on healthy fats from avocados, nuts, olive oil, and fatty fish. Aim for 0.3-0.5g per pound of body weight. Avoid trans fats and limit saturated fats. Fats help with satiety and should be included in every meal.',
        type: 'nutrition',
        tags: ['fats', 'hormones', 'health', 'macros', 'satiety']
      },
      {
        id: 'hydration-basics',
        title: 'Hydration for Exercise',
        content: 'Proper hydration is crucial for performance and recovery. Drink 16-20oz of water 2-3 hours before exercise, 8-10oz 10-20 minutes before, and 7-10oz every 10-20 minutes during exercise. For workouts longer than 60 minutes, consider sports drinks with electrolytes. Monitor urine color - pale yellow indicates good hydration.',
        type: 'nutrition',
        tags: ['hydration', 'water', 'electrolytes', 'performance', 'recovery']
      },
      
      // Training Principles
      {
        id: 'progressive-overload',
        title: 'Progressive Overload',
        content: 'Progressive overload is the foundation of strength training. Gradually increase the stress placed on your body over time by adding weight, reps, sets, or reducing rest periods. This forces your body to adapt and grow stronger. Track your progress and aim for small, consistent improvements rather than big jumps.',
        type: 'principle',
        tags: ['progression', 'strength', 'adaptation', 'growth']
      },
      {
        id: 'recovery-importance',
        title: 'Recovery and Rest',
        content: 'Recovery is when your body actually gets stronger. Muscles need 48-72 hours to repair after resistance training. Include rest days, get 7-9 hours of sleep, eat properly, and consider active recovery like walking or stretching. Overtraining can lead to injury and decreased performance. Listen to your body.',
        type: 'principle',
        tags: ['recovery', 'rest', 'sleep', 'overtraining', 'injury-prevention']
      },
      {
        id: 'form-over-weight',
        title: 'Form Over Weight',
        content: 'Always prioritize proper form over lifting heavier weights. Good form prevents injuries, ensures you\'re targeting the right muscles, and leads to better long-term progress. If your form breaks down, reduce the weight. It\'s better to lift lighter with perfect form than heavy with poor form.',
        type: 'principle',
        tags: ['form', 'technique', 'safety', 'injury-prevention', 'effectiveness']
      },
      {
        id: 'consistency-key',
        title: 'Consistency is Key',
        content: 'Consistency beats perfection every time. It\'s better to work out 3 times per week consistently than to have sporadic intense sessions. Build sustainable habits that fit your lifestyle. Small, consistent efforts compound over time to create significant results. Focus on showing up regularly.',
        type: 'principle',
        tags: ['consistency', 'habits', 'sustainability', 'long-term', 'results']
      },
      {
        id: 'warmup-importance',
        title: 'Warm-up Importance',
        content: 'A proper warm-up prepares your body for exercise by increasing blood flow, raising body temperature, and improving joint mobility. Start with 5-10 minutes of light cardio, then do dynamic stretches and movement prep specific to your workout. This reduces injury risk and improves performance.',
        type: 'principle',
        tags: ['warmup', 'injury-prevention', 'performance', 'mobility', 'preparation']
      }
    ];
  }
}

export const fitnessRAG = new FitnessRAGService();