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
    } catch (error) {
      console.error('Failed to initialize RAG service:', error);
    }
  }

  async query(query: string): Promise<RAGQueryResult> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      // Generate query embedding (simple keyword-based for demo)
      const queryVector = this.generateEmbedding(query);

      // Search vector store
      const results = await this.vectorStore.query(queryVector, 3);

      // Format response
      const sources = results.map(r => ({
        title: r.item.metadata.title,
        type: r.item.metadata.type,
        relevance: r.score
      }));

      const answer = this.generateAnswer(query, results);
      const confidence = this.calculateConfidence(results);
      const followUpQuestions = this.generateFollowUpQuestions(query, results);

      return {
        answer,
        sources,
        confidence,
        followUpQuestions
      };
    } catch (error) {
      console.error('RAG query failed:', error);
      return {
        answer: "I'm having trouble accessing my knowledge base. Could you try rephrasing your question?",
        sources: [],
        confidence: 0.1,
        followUpQuestions: []
      };
    }
  }

  private async seedKnowledgeBase(): Promise<void> {
    console.log('Seeding fitness knowledge base...');

    const vectorItems: VectorItem[] = this.knowledgeBase.map(item => ({
      id: item.id,
      vector: this.generateEmbedding(item.content),
      metadata: item
    }));

    await this.vectorStore.addItems(vectorItems);
    console.log(`Seeded ${vectorItems.length} knowledge items`);
  }

  private generateEmbedding(text: string): number[] {
    // Simple keyword-based embedding for browser compatibility
    const keywords = [
      'squat', 'deadlift', 'bench', 'press', 'row', 'pull', 'push',
      'muscle', 'strength', 'power', 'endurance', 'cardio', 'hiit',
      'protein', 'carbs', 'fat', 'calories', 'nutrition', 'diet',
      'form', 'technique', 'safety', 'injury', 'warmup', 'recovery',
      'beginner', 'intermediate', 'advanced', 'progression', 'sets', 'reps'
    ];

    const textLower = text.toLowerCase();
    return keywords.map(keyword => 
      textLower.includes(keyword) ? 1 : 0
    );
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
        content: 'The squat is a fundamental compound exercise that targets the quadriceps, hamstrings, and glutes. To perform: Stand with feet shoulder-width apart, lower your body by bending at the knees and hips as if sitting back into a chair, keep your chest up and core engaged, descend until thighs are parallel to the floor, then push through your heels to return to standing.',
        type: 'exercise',
        tags: ['legs', 'compound', 'strength']
      },
      {
        id: 'deadlift-basics',
        title: 'Deadlift',
        content: 'The deadlift is a powerful full-body exercise primarily targeting the posterior chain. Setup: Stand with feet hip-width apart, bar over mid-foot. Bend at hips and knees to grip the bar. Keep back straight, chest up. Drive through heels and extend hips and knees simultaneously. Lock out at the top with shoulders back.',
        type: 'exercise',
        tags: ['back', 'compound', 'strength', 'power']
      },
      {
        id: 'bench-press-basics',
        title: 'Bench Press',
        content: 'The bench press is the primary upper body pushing exercise for chest, shoulders, and triceps. Lie on bench with eyes under the bar, grip slightly wider than shoulders, lower the bar to chest with control, press up powerfully while keeping feet planted and maintaining arch in back.',
        type: 'exercise',
        tags: ['chest', 'compound', 'upper-body']
      },
      {
        id: 'pull-up-basics',
        title: 'Pull-up',
        content: 'Pull-ups are an excellent bodyweight exercise for back and biceps. Hang from bar with overhand grip, pull your body up until chin clears the bar, focus on pulling with your back muscles, lower with control. For beginners, use assistance bands or lat pulldown machine.',
        type: 'exercise',
        tags: ['back', 'bodyweight', 'pulling']
      },
      {
        id: 'plank-basics',
        title: 'Plank',
        content: 'The plank is an isometric core exercise that builds stability and endurance. Start in push-up position but rest on forearms, keep body in straight line from head to heels, engage core and glutes, breathe normally while holding position. Start with 30 seconds and progress to longer holds.',
        type: 'exercise',
        tags: ['core', 'isometric', 'stability']
      },
      // Nutrition Knowledge
      {
        id: 'protein-intake',
        title: 'Protein Requirements',
        content: 'For muscle building and recovery, aim for 0.7-1g of protein per pound of body weight daily. Good sources include lean meats, fish, eggs, dairy, legumes, and plant-based proteins. Spread intake throughout the day with 20-40g per meal for optimal muscle protein synthesis.',
        type: 'nutrition',
        tags: ['protein', 'macros', 'muscle-building']
      },
      {
        id: 'pre-workout-nutrition',
        title: 'Pre-Workout Nutrition',
        content: 'Eat 1-3 hours before training. Include easily digestible carbs (30-60g) for energy and moderate protein (10-20g). Examples: banana with peanut butter, oatmeal with berries, rice cakes with turkey. Avoid high fat or fiber close to workout time.',
        type: 'nutrition',
        tags: ['timing', 'energy', 'performance']
      },
      {
        id: 'hydration-basics',
        title: 'Hydration for Performance',
        content: 'Proper hydration is crucial for performance and recovery. Aim for half your body weight in ounces of water daily, more if training intensely. Drink 16-20oz 2 hours before exercise, 6-8oz every 15-20 minutes during exercise, and 16-24oz per pound lost after exercise.',
        type: 'nutrition',
        tags: ['hydration', 'performance', 'recovery']
      },
      // Training Principles
      {
        id: 'progressive-overload',
        title: 'Progressive Overload',
        content: 'Progressive overload is the fundamental principle of strength training. Gradually increase the demands on your muscles by adding weight, reps, sets, or decreasing rest time. Aim to increase load by 2.5-5% when you can complete all sets with good form.',
        type: 'principle',
        tags: ['progression', 'strength', 'fundamentals']
      },
      {
        id: 'rest-recovery',
        title: 'Rest and Recovery',
        content: 'Recovery is when muscles grow and adapt. Allow 48-72 hours between training the same muscle groups. Get 7-9 hours of quality sleep. Include active recovery days with light movement. Listen to your body and take extra rest when needed.',
        type: 'principle',
        tags: ['recovery', 'rest', 'adaptation']
      },
      {
        id: 'form-first',
        title: 'Form Over Weight',
        content: 'Perfect form should always be the priority over lifting heavy weight. Proper form prevents injury, ensures target muscles are worked effectively, and builds better movement patterns. Master bodyweight or light weight before progressing.',
        type: 'principle',
        tags: ['safety', 'technique', 'fundamentals']
      },
      {
        id: 'consistency-key',
        title: 'Consistency is Key',
        content: 'Consistency beats perfection in fitness. Aim for 3-4 quality workouts per week rather than sporadic intense sessions. Build sustainable habits, track your progress, and focus on showing up regularly. Results come from accumulated effort over time.',
        type: 'principle',
        tags: ['habits', 'mindset', 'long-term']
      }
    ];
  }
}

export const fitnessRAG = new FitnessRAGService();