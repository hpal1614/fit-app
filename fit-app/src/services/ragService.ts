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
  private knowledgeBase: KnowledgeItem[];
  private initialized = false;

  constructor() {
    this.knowledgeBase = this.getDefaultKnowledgeBase();
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      console.log('🚀 RAG Service initializing...');
      console.log('📚 Knowledge base items:', this.knowledgeBase.length);
      this.initialized = true;
      console.log('✅ RAG Service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize RAG service:', error);
    }
  }

  async query(query: string): Promise<RAGQueryResult> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      console.log('🔍 RAG Query:', query);
      
      // Simple keyword-based search
      const queryLower = query.toLowerCase();
      const queryWords = queryLower.split(/\s+/);
      
      // Score each knowledge item based on keyword matches
      const scoredItems = this.knowledgeBase.map(item => {
        const itemText = `${item.title} ${item.content} ${item.tags.join(' ')}`.toLowerCase();
        let score = 0;
        
        // Check for exact matches
        for (const word of queryWords) {
          if (itemText.includes(word)) {
            score += 2; // Higher weight for exact matches
          }
        }
        
        // Check for partial matches
        for (const word of queryWords) {
          for (const tag of item.tags) {
            if (tag.includes(word) || word.includes(tag)) {
              score += 1;
            }
          }
        }
        
        // Check title matches (highest priority)
        if (item.title.toLowerCase().includes(queryLower)) {
          score += 5;
        }
        
        return { item, score };
      });
      
      // Sort by score and get top results
      const topResults = scoredItems
        .filter(result => result.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);
      
      console.log('🏆 Top results:', topResults.map(r => ({
        title: r.item.title,
        score: r.score
      })));
      
      if (topResults.length === 0) {
        return {
          answer: "I don't have specific information about that in my knowledge base. Could you try asking about exercises, nutrition, or training principles?",
          sources: [],
          confidence: 0.1,
          followUpQuestions: []
        };
      }
      
      // Format response
      const topResult = topResults[0];
      const sources = topResults.map(r => ({
        title: r.item.title,
        type: r.item.type,
        relevance: Math.min(r.score / 10, 1.0) // Normalize to 0-1
      }));
      
      const answer = this.generateAnswer(query, topResult.item);
      const confidence = Math.min(0.3 + (topResult.score / 10), 0.95);
      const followUpQuestions = this.generateFollowUpQuestions(query, topResult.item);
      
      console.log('✅ RAG Response generated:', {
        answerLength: answer.length,
        sourcesCount: sources.length,
        confidence: confidence,
        topScore: topResult.score
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

  // Test method to verify the system
  async testEmbeddingSystem(): Promise<void> {
    console.log('�� Testing RAG system...');
    
    const testQueries = ['pushup', 'protein', 'squat', 'how to exercise'];
    
    for (const query of testQueries) {
      console.log(`\n🔍 Testing query: "${query}"`);
      const result = await this.query(query);
      console.log(`📊 Top source: ${result.sources[0]?.title || 'None'} (${Math.round(result.confidence * 100)}% confidence)`);
    }
  }

  private generateAnswer(query: string, topItem: KnowledgeItem): string {
    const queryLower = query.toLowerCase();
    
    if (queryLower.includes('how') || queryLower.includes('form') || queryLower.includes('perform')) {
      return `Here's how to perform ${topItem.title}:\n\n${topItem.content}`;
    }
    
    if (queryLower.includes('what') || queryLower.includes('explain')) {
      return `${topItem.title} is ${topItem.content}`;
    }
    
    return `Here's what I know about ${topItem.title}:\n\n${topItem.content}`;
  }

  private generateFollowUpQuestions(query: string, topItem: KnowledgeItem): string[] {
    if (topItem.type === 'exercise') {
      return [
        `What muscles does ${topItem.title} work?`,
        `How many sets and reps for ${topItem.title}?`,
        `What are common mistakes with ${topItem.title}?`,
        'Can you suggest an alternative exercise?'
      ];
    }

    if (topItem.type === 'nutrition') {
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
        tags: ['legs', 'compound', 'strength', 'quads', 'hamstrings', 'glutes', 'squat', 'squats']
      },
      {
        id: 'deadlift-basics',
        title: 'Deadlift',
        content: 'The deadlift is a powerful full-body exercise primarily targeting the posterior chain. Setup: Stand with feet hip-width apart, bar over mid-foot. Bend at hips and knees to grip the bar. Keep back straight, chest up. Drive through heels and extend hips and knees simultaneously. Lock out at the top with shoulders back. This exercise works your hamstrings, glutes, lower back, and core muscles.',
        type: 'exercise',
        tags: ['back', 'compound', 'strength', 'power', 'hamstrings', 'glutes', 'core', 'deadlift', 'deadlifts']
      },
      {
        id: 'bench-press-basics',
        title: 'Bench Press',
        content: 'The bench press is the primary upper body pushing exercise for chest, shoulders, and triceps. Lie on bench with eyes under the bar, grip slightly wider than shoulders, lower the bar to chest with control, press up powerfully while keeping feet planted and maintaining arch in back. Keep your core tight and don\'t bounce the bar off your chest.',
        type: 'exercise',
        tags: ['chest', 'compound', 'upper-body', 'shoulders', 'triceps', 'bench', 'press']
      },
      {
        id: 'pull-up-basics',
        title: 'Pull-up',
        content: 'Pull-ups are an excellent upper body pulling exercise that targets your back, biceps, and shoulders. Hang from a pull-up bar with hands slightly wider than shoulders, pull your body up until your chin is over the bar, then lower with control. Keep your core engaged and avoid swinging. If you can\'t do full pull-ups, start with assisted pull-ups or negative pull-ups.',
        type: 'exercise',
        tags: ['back', 'compound', 'upper-body', 'biceps', 'shoulders', 'pull', 'pullup', 'pullups']
      },
      {
        id: 'push-up-basics',
        title: 'Push-up',
        content: 'Push-ups are a fundamental bodyweight exercise for chest, shoulders, and triceps. Start in a plank position with hands slightly wider than shoulders, lower your body until your chest nearly touches the ground, then push back up. Keep your body in a straight line from head to heels. Modify by doing knee push-ups if needed.',
        type: 'exercise',
        tags: ['chest', 'bodyweight', 'upper-body', 'shoulders', 'triceps', 'push', 'pushup', 'pushups']
      },
      {
        id: 'lunge-basics',
        title: 'Lunge',
        content: 'Lunges are a great unilateral leg exercise that targets quads, hamstrings, and glutes while improving balance. Step forward with one leg, lower your body until both knees are bent at 90 degrees, then push back to starting position. Keep your torso upright and core engaged. You can do walking lunges, reverse lunges, or lateral lunges.',
        type: 'exercise',
        tags: ['legs', 'unilateral', 'quads', 'hamstrings', 'glutes', 'balance', 'lunge', 'lunges']
      },
      {
        id: 'plank-basics',
        title: 'Plank',
        content: 'The plank is an isometric core exercise that builds stability and endurance. Start in push-up position but rest on forearms, keep body in straight line from head to heels, engage core and glutes, breathe normally while holding position. Start with 30 seconds and progress to longer holds.',
        type: 'exercise',
        tags: ['core', 'isometric', 'stability', 'plank', 'planks', 'abs']
      },
      
      // Nutrition Knowledge
      {
        id: 'protein-basics',
        title: 'Protein Requirements',
        content: 'Protein is essential for muscle building and recovery. General recommendations: 0.8-1.2g per pound of body weight for active individuals, 1.2-1.6g for those building muscle, and up to 2g for intense training. Good sources include lean meats, fish, eggs, dairy, legumes, and protein powders. Spread protein intake throughout the day for optimal absorption.',
        type: 'nutrition',
        tags: ['protein', 'muscle', 'recovery', 'macros', 'nutrition']
      },
      {
        id: 'carbohydrates-basics',
        title: 'Carbohydrates for Fitness',
        content: 'Carbohydrates are your body\'s primary energy source for exercise. Complex carbs like whole grains, fruits, and vegetables provide sustained energy. Simple carbs can be useful before/during intense workouts. Aim for 3-7g per pound of body weight depending on activity level. Time carbs around workouts for optimal performance.',
        type: 'nutrition',
        tags: ['carbs', 'energy', 'fuel', 'macros', 'performance', 'carbohydrates']
      },
      {
        id: 'fats-basics',
        title: 'Healthy Fats',
        content: 'Fats are essential for hormone production, vitamin absorption, and overall health. Focus on healthy fats from avocados, nuts, olive oil, and fatty fish. Aim for 0.3-0.5g per pound of body weight. Avoid trans fats and limit saturated fats. Fats help with satiety and should be included in every meal.',
        type: 'nutrition',
        tags: ['fats', 'hormones', 'health', 'macros', 'satiety', 'fat']
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
        tags: ['progression', 'strength', 'adaptation', 'growth', 'progressive', 'overload']
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