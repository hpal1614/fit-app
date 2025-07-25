import { BrowserVectorStore, VectorItem } from './BrowserVectorStore';
import { getAllKnowledgeItems } from '../../data/fitnessKnowledge';

interface KnowledgeItem {
  id: string;
  type: 'exercise' | 'nutrition' | 'principle';
  content: string;
  metadata: any;
  vector?: number[];
}

interface SearchResult {
  item: KnowledgeItem;
  score: number;
}

export class RAGService {
  private vectorStore: BrowserVectorStore;
  private knowledgeMap: Map<string, KnowledgeItem> = new Map();
  private initialized = false;
  private embeddingCache = new Map<string, number[]>();

  constructor() {
    this.vectorStore = new BrowserVectorStore('fitness-knowledge');
  }

  async initialize() {
    if (this.initialized) return;

    try {
      // Check if we need to seed the knowledge base
      if (!this.vectorStore.hasData()) {
        await this.seedKnowledgeBase();
      } else {
        // Load knowledge map from existing items
        const items = this.vectorStore.getAllItems();
        for (const item of items) {
          const knowledgeItem = item.metadata.knowledgeItem;
          if (knowledgeItem) {
            this.knowledgeMap.set(knowledgeItem.id, knowledgeItem);
          }
        }
      }

      this.initialized = true;
      console.log('RAG Service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize RAG Service:', error);
      throw error;
    }
  }

  private async seedKnowledgeBase() {
    console.log('Seeding knowledge base...');
    const items = getAllKnowledgeItems();
    const vectorItems: VectorItem[] = [];
    
    for (const item of items) {
      const embedding = await this.generateEmbedding(item.content);
      const knowledgeItem: KnowledgeItem = {
        ...item,
        vector: embedding
      };
      
      vectorItems.push({
        id: item.id,
        vector: embedding,
        metadata: { 
          id: item.id,
          knowledgeItem: knowledgeItem
        }
      });
      
      this.knowledgeMap.set(item.id, knowledgeItem);
    }
    
    await this.vectorStore.addItems(vectorItems);
    console.log(`Seeded ${items.length} knowledge items`);
  }

  async search(query: string, topK: number = 5): Promise<SearchResult[]> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const queryEmbedding = await this.generateEmbedding(query);
      const results = await this.vectorStore.query(queryEmbedding, topK);
      
      return results.map(result => ({
        item: this.knowledgeMap.get(result.item.id)!,
        score: result.score
      })).filter(result => result.item != null);
    } catch (error) {
      console.error('Search error:', error);
      return [];
    }
  }

  async searchByCategory(
    query: string,
    category: 'exercise' | 'nutrition' | 'principle',
    topK: number = 5
  ): Promise<SearchResult[]> {
    const allResults = await this.search(query, topK * 2);
    return allResults
      .filter(result => result.item.type === category)
      .slice(0, topK);
  }

  async getExerciseByMuscleGroup(muscleGroup: string): Promise<KnowledgeItem[]> {
    const query = `exercises for ${muscleGroup} muscle group training`;
    const results = await this.searchByCategory(query, 'exercise', 10);
    
    return results
      .filter(result => {
        const exercise = result.item.metadata;
        return exercise.muscleGroups?.includes(muscleGroup);
      })
      .map(result => result.item);
  }

  async getExercisesByEquipment(equipment: string): Promise<KnowledgeItem[]> {
    const query = `exercises using ${equipment} equipment`;
    const results = await this.searchByCategory(query, 'exercise', 10);
    
    return results
      .filter(result => {
        const exercise = result.item.metadata;
        return exercise.equipment?.includes(equipment);
      })
      .map(result => result.item);
  }

  async getNutritionAdvice(topic: string): Promise<SearchResult[]> {
    const query = `nutrition advice about ${topic}`;
    return this.searchByCategory(query, 'nutrition', 5);
  }

  async getWorkoutPrinciples(goal: string): Promise<SearchResult[]> {
    const query = `workout principles for ${goal}`;
    return this.searchByCategory(query, 'principle', 5);
  }

  // Generate contextual response with retrieved knowledge
  async generateContextualResponse(
    query: string,
    conversationContext?: any
  ): Promise<{ response: string; sources: SearchResult[] }> {
    const searchResults = await this.search(query, 5);
    
    if (searchResults.length === 0) {
      return {
        response: "I couldn't find specific information about that in my knowledge base. Could you rephrase or ask about something else?",
        sources: []
      };
    }

    // Build context from search results
    const context = searchResults
      .map(result => {
        const item = result.item;
        if (item.type === 'exercise') {
          const exercise = item.metadata;
          return `Exercise: ${exercise.name}\n${exercise.description}\nMuscles: ${exercise.muscleGroups.join(', ')}\nKey points: ${exercise.properForm.slice(0, 3).join('; ')}`;
        } else if (item.type === 'nutrition') {
          const nutrition = item.metadata;
          return `Topic: ${nutrition.topic}\n${nutrition.content}\nKey tips: ${nutrition.practicalTips.slice(0, 3).join('; ')}`;
        } else {
          const principle = item.metadata;
          return `Principle: ${principle.name}\n${principle.description}`;
        }
      })
      .join('\n\n');

    // Generate response based on context
    const response = this.synthesizeResponse(query, context, searchResults);

    return {
      response,
      sources: searchResults.slice(0, 3) // Return top 3 sources
    };
  }

  private synthesizeResponse(
    query: string,
    context: string,
    results: SearchResult[]
  ): string {
    const queryLower = query.toLowerCase();
    
    // Exercise form queries
    if (queryLower.includes('form') || queryLower.includes('how to')) {
      const exercise = results[0]?.item.metadata;
      if (exercise && results[0].item.type === 'exercise') {
        return `Here's how to perform ${exercise.name} with proper form:\n\n${exercise.properForm.join('\n• ')}\n\nCommon mistakes to avoid:\n• ${exercise.commonMistakes.slice(0, 3).join('\n• ')}\n\nRemember: ${exercise.safetyTips[0]}`;
      }
    }

    // Nutrition queries
    if (queryLower.includes('nutrition') || queryLower.includes('diet') || queryLower.includes('eat')) {
      const nutrition = results[0]?.item.metadata;
      if (nutrition && results[0].item.type === 'nutrition') {
        return `${nutrition.content}\n\nKey recommendations:\n• ${nutrition.keyPoints.slice(0, 3).join('\n• ')}\n\nPractical tip: ${nutrition.practicalTips[0]}`;
      }
    }

    // Workout programming queries
    if (queryLower.includes('program') || queryLower.includes('routine') || queryLower.includes('plan')) {
      const principle = results.find(r => r.item.type === 'principle')?.item.metadata;
      if (principle) {
        return `For effective programming, apply ${principle.name}:\n\n${principle.description}\n\nImplementation:\n• ${principle.application.slice(0, 3).join('\n• ')}`;
      }
    }

    // Default response with general context
    return `Based on my fitness knowledge:\n\n${context}\n\nWould you like more specific information about any of these topics?`;
  }

  // Simple embedding generation (in production, use OpenAI or similar)
  private async generateEmbedding(text: string): Promise<number[]> {
    // Check cache first
    if (this.embeddingCache.has(text)) {
      return this.embeddingCache.get(text)!;
    }

    // In a real implementation, this would call OpenAI's embedding API
    // For now, we'll create a simple deterministic embedding based on text features
    const embedding = this.createSimpleEmbedding(text);
    
    this.embeddingCache.set(text, embedding);
    return embedding;
  }

  private createSimpleEmbedding(text: string): number[] {
    const dimension = 384; // Standard embedding size
    const embedding = new Array(dimension).fill(0);
    const words = text.toLowerCase().split(/\s+/);
    
    // Create feature vector based on word characteristics
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      
      // Hash word to get consistent indices
      for (let j = 0; j < word.length; j++) {
        const charCode = word.charCodeAt(j);
        const index = (charCode * (i + 1) * (j + 1)) % dimension;
        embedding[index] += 1 / (words.length * word.length);
      }
    }

    // Add semantic features for fitness-specific terms
    const fitnessTerms = {
      'squat': [0, 10, 20, 30],
      'bench': [1, 11, 21, 31],
      'deadlift': [2, 12, 22, 32],
      'protein': [50, 60, 70, 80],
      'carb': [51, 61, 71, 81],
      'muscle': [100, 110, 120, 130],
      'strength': [150, 160, 170, 180],
      'cardio': [200, 210, 220, 230],
      'form': [250, 260, 270, 280],
      'recovery': [300, 310, 320, 330]
    };

    for (const [term, indices] of Object.entries(fitnessTerms)) {
      if (text.toLowerCase().includes(term)) {
        for (const idx of indices) {
          embedding[idx] += 0.5;
        }
      }
    }

    // Normalize
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    if (magnitude > 0) {
      for (let i = 0; i < embedding.length; i++) {
        embedding[i] /= magnitude;
      }
    }

    return embedding;
  }

  // Get similar exercises
  async getSimilarExercises(exerciseId: string, topK: number = 3): Promise<KnowledgeItem[]> {
    const exercise = this.knowledgeMap.get(exerciseId);
    if (!exercise) return [];

    const query = `${exercise.metadata.name} ${exercise.metadata.muscleGroups.join(' ')} exercise`;
    const results = await this.searchByCategory(query, 'exercise', topK + 1);
    
    // Filter out the same exercise
    return results
      .filter(result => result.item.id !== exerciseId)
      .slice(0, topK)
      .map(result => result.item);
  }

  // Check if index needs updating
  async updateKnowledge(newItems: KnowledgeItem[]) {
    const vectorItems: VectorItem[] = [];
    
    for (const item of newItems) {
      const embedding = await this.generateEmbedding(item.content);
      const knowledgeItem = {
        ...item,
        vector: embedding
      };
      
      vectorItems.push({
        id: item.id,
        vector: embedding,
        metadata: { 
          id: item.id,
          knowledgeItem: knowledgeItem
        }
      });
      
      this.knowledgeMap.set(item.id, knowledgeItem);
    }
    
    await this.vectorStore.addItems(vectorItems);
  }

  // Export for debugging
  getKnowledgeStats() {
    const stats = {
      totalItems: this.knowledgeMap.size,
      exercises: 0,
      nutrition: 0,
      principles: 0
    };

    for (const item of this.knowledgeMap.values()) {
      if (item.type === 'exercise') stats.exercises++;
      else if (item.type === 'nutrition') stats.nutrition++;
      else if (item.type === 'principle') stats.principles++;
    }

    return stats;
  }
}

// Export singleton instance
export const ragService = new RAGService();