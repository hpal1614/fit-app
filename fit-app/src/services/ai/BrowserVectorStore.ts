// Browser-compatible vector store implementation
export interface VectorItem {
  id: string;
  vector: number[];
  metadata: any;
}

export class BrowserVectorStore {
  private items: VectorItem[] = [];
  private dimension: number = 384;

  constructor(private storeName: string) {
    this.loadFromStorage();
  }

  // Add item to the store
  async addItem(item: VectorItem): Promise<void> {
    this.items.push(item);
    this.saveToStorage();
  }

  // Add multiple items
  async addItems(items: VectorItem[]): Promise<void> {
    this.items.push(...items);
    this.saveToStorage();
  }

  // Query for similar items using cosine similarity
  async query(queryVector: number[], topK: number = 5): Promise<Array<{ item: VectorItem; score: number }>> {
    const results = this.items.map(item => ({
      item,
      score: this.cosineSimilarity(queryVector, item.vector)
    }));

    // Sort by score (descending) and take top K
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }

  // Calculate cosine similarity between two vectors
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

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) return 0;
    
    return dotProduct / (normA * normB);
  }

  // Clear all items
  clear(): void {
    this.items = [];
    this.saveToStorage();
  }

  // Get all items
  getAllItems(): VectorItem[] {
    return [...this.items];
  }

  // Get item count
  size(): number {
    return this.items.length;
  }

  // Save to localStorage
  private saveToStorage(): void {
    try {
      const key = `vector_store_${this.storeName}`;
      const data = JSON.stringify(this.items);
      localStorage.setItem(key, data);
    } catch (error) {
      console.error('Failed to save vector store:', error);
    }
  }

  // Load from localStorage
  private loadFromStorage(): void {
    try {
      const key = `vector_store_${this.storeName}`;
      const data = localStorage.getItem(key);
      if (data) {
        this.items = JSON.parse(data);
      }
    } catch (error) {
      console.error('Failed to load vector store:', error);
      this.items = [];
    }
  }

  // Check if store has been initialized
  hasData(): boolean {
    return this.items.length > 0;
  }
}