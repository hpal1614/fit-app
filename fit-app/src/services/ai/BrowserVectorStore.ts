// Browser-compatible vector store implementation
export interface VectorItem {
  id: string;
  vector: number[];
  metadata: any;
}

export class BrowserVectorStore {
  private storageKey: string;
  private items: VectorItem[] = [];

  constructor(namespace: string = 'fitness-vectors') {
    this.storageKey = `vector-store-${namespace}`;
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        this.items = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load vector store:', error);
      this.items = [];
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.items));
    } catch (error) {
      console.error('Failed to save vector store:', error);
    }
  }

  async addItem(item: VectorItem): Promise<void> {
    this.items.push(item);
    this.saveToStorage();
  }

  async addItems(items: VectorItem[]): Promise<void> {
    this.items.push(...items);
    this.saveToStorage();
  }

  async query(queryVector: number[], k: number = 5): Promise<Array<{ item: VectorItem; score: number }>> {
    // Simple cosine similarity search
    const results = this.items
      .map(item => ({
        item,
        score: this.cosineSimilarity(queryVector, item.vector)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, k);
    
    return results;
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

  hasData(): boolean {
    return this.items.length > 0;
  }

  clear(): void {
    this.items = [];
    this.saveToStorage();
  }
}