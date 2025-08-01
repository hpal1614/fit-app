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
    console.log('🔧 BrowserVectorStore initialized with key:', this.storageKey);
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      console.log('📥 Loading from storage:', this.storageKey, 'Found:', !!stored);
      if (stored) {
        this.items = JSON.parse(stored);
        console.log('✅ Loaded', this.items.length, 'items from storage');
      } else {
        console.log('⚠️ No stored data found');
      }
    } catch (error) {
      console.error('❌ Failed to load vector store:', error);
      this.items = [];
    }
  }

  private saveToStorage(): void {
    try {
      const data = JSON.stringify(this.items);
      localStorage.setItem(this.storageKey, data);
      console.log('💾 Saved', this.items.length, 'items to storage');
    } catch (error) {
      console.error('❌ Failed to save vector store:', error);
    }
  }

  async addItem(item: VectorItem): Promise<void> {
    console.log('➕ Adding item:', item.id, 'Vector length:', item.vector.length);
    this.items.push(item);
    this.saveToStorage();
  }

  async addItems(items: VectorItem[]): Promise<void> {
    console.log('➕ Adding', items.length, 'items to vector store');
    this.items.push(...items);
    this.saveToStorage();
  }

  async query(queryVector: number[], k: number = 5): Promise<Array<{ item: VectorItem; score: number }>> {
    console.log('🔍 Querying vector store with', this.items.length, 'items');
    console.log('🔍 Query vector length:', queryVector.length);
    
    if (this.items.length === 0) {
      console.log('⚠️ No items in vector store to query');
      return [];
    }

    // Simple cosine similarity search
    const results = this.items
      .map(item => {
        const score = this.cosineSimilarity(queryVector, item.vector);
        console.log(`📊 Score for "${item.metadata.title}":`, score);
        return {
          item,
          score
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, k);
    
    console.log('🏆 Top results:', results.map(r => ({
      title: r.item.metadata.title,
      score: r.score
    })));
    
    return results;
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      console.log('⚠️ Vector length mismatch:', a.length, 'vs', b.length);
      return 0;
    }
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    if (normA === 0 || normB === 0) {
      console.log('⚠️ Zero norm detected:', { normA, normB });
      return 0;
    }
    
    const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    return similarity;
  }

  hasData(): boolean {
    const hasData = this.items.length > 0;
    console.log('📊 Vector store has data:', hasData, 'Items:', this.items.length);
    return hasData;
  }

  clear(): void {
    console.log('🗑️ Clearing vector store');
    this.items = [];
    this.saveToStorage();
  }
}