// RAG (Retrieval-Augmented Generation) Service for fitness knowledge
export interface FitnessKnowledge {
  id: string;
  topic: string;
  content: string;
  category: 'exercise' | 'nutrition' | 'recovery' | 'technique';
  tags: string[];
  confidence: number;
}

class FitnessRAGService {
  private knowledgeBase: FitnessKnowledge[] = [];

  constructor() {
    this.initializeKnowledgeBase();
  }

  private initializeKnowledgeBase() {
    // Initialize with some basic fitness knowledge
    this.knowledgeBase = [
      {
        id: '1',
        topic: 'proper squat form',
        content: 'Keep your feet shoulder-width apart, chest up, knees tracking over toes, and descend until thighs are parallel to the ground.',
        category: 'technique',
        tags: ['squat', 'form', 'legs', 'technique'],
        confidence: 0.95
      },
      {
        id: '2',
        topic: 'post-workout nutrition',
        content: 'Consume protein and carbohydrates within 30-60 minutes after workout to optimize recovery and muscle protein synthesis.',
        category: 'nutrition',
        tags: ['nutrition', 'recovery', 'protein', 'post-workout'],
        confidence: 0.9
      },
      {
        id: '3',
        topic: 'rest between sets',
        content: 'For strength training, rest 2-3 minutes between sets. For hypertrophy, 1-2 minutes. For endurance, 30-90 seconds.',
        category: 'exercise',
        tags: ['rest', 'sets', 'training', 'timing'],
        confidence: 0.92
      }
    ];
  }

  async searchKnowledge(query: string, category?: string): Promise<FitnessKnowledge[]> {
    const lowercaseQuery = query.toLowerCase();
    
    let results = this.knowledgeBase.filter(item => {
      const matchesQuery = 
        item.topic.toLowerCase().includes(lowercaseQuery) ||
        item.content.toLowerCase().includes(lowercaseQuery) ||
        item.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery));
      
      const matchesCategory = !category || item.category === category;
      
      return matchesQuery && matchesCategory;
    });

    // Sort by relevance (simplified scoring)
    results = results.sort((a, b) => {
      const aScore = this.calculateRelevanceScore(a, lowercaseQuery);
      const bScore = this.calculateRelevanceScore(b, lowercaseQuery);
      return bScore - aScore;
    });

    return results.slice(0, 5); // Return top 5 results
  }

  private calculateRelevanceScore(item: FitnessKnowledge, query: string): number {
    let score = 0;
    
    // Topic match
    if (item.topic.toLowerCase().includes(query)) score += 10;
    
    // Content match
    if (item.content.toLowerCase().includes(query)) score += 5;
    
    // Tag matches
    item.tags.forEach(tag => {
      if (tag.toLowerCase().includes(query)) score += 3;
    });
    
    // Confidence boost
    score *= item.confidence;
    
    return score;
  }

  async getRecommendations(context: any): Promise<FitnessKnowledge[]> {
    // Provide contextual recommendations based on current workout context
    if (!context) return this.knowledgeBase.slice(0, 3);
    
    let recommendations: FitnessKnowledge[] = [];
    
    if (context.currentExercise) {
      const exerciseName = context.currentExercise.exercise?.name?.toLowerCase() || '';
      recommendations = await this.searchKnowledge(exerciseName);
    }
    
    if (recommendations.length === 0) {
      // Default recommendations
      recommendations = this.knowledgeBase
        .filter(item => item.category === 'technique' || item.category === 'exercise')
        .slice(0, 3);
    }
    
    return recommendations;
  }

  addKnowledge(knowledge: Omit<FitnessKnowledge, 'id'>): string {
    const id = Date.now().toString();
    this.knowledgeBase.push({ ...knowledge, id });
    return id;
  }

  updateKnowledge(id: string, updates: Partial<FitnessKnowledge>): boolean {
    const index = this.knowledgeBase.findIndex(item => item.id === id);
    if (index === -1) return false;
    
    this.knowledgeBase[index] = { ...this.knowledgeBase[index], ...updates };
    return true;
  }

  deleteKnowledge(id: string): boolean {
    const index = this.knowledgeBase.findIndex(item => item.id === id);
    if (index === -1) return false;
    
    this.knowledgeBase.splice(index, 1);
    return true;
  }

  getKnowledgeStats() {
    const categories = this.knowledgeBase.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: this.knowledgeBase.length,
      categories,
      averageConfidence: this.knowledgeBase.reduce((sum, item) => sum + item.confidence, 0) / this.knowledgeBase.length
    };
  }
}

// Export singleton instance
export const fitnessRAG = new FitnessRAGService();
