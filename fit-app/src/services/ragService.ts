import { Pinecone } from '@pinecone-database/pinecone';
import { OpenAI } from 'openai';

interface FitnessDocument {
  id: string;
  content: string;
  metadata: {
    category: 'exercise' | 'nutrition' | 'physiology' | 'psychology';
    subcategory?: string;
    exercise_name?: string;
    muscle_groups?: string[];
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    tags?: string[];
  };
}

interface RetrievalResult {
  id: string;
  content: string;
  score: number;
  metadata: any;
}

interface CachedResponse {
  query: string;
  response: string;
  timestamp: number;
  trajectory?: string[];
}

export class FitnessRAGService {
  private pinecone: Pinecone;
  private openai: OpenAI;
  private index: any;
  private cache: Map<string, CachedResponse> = new Map();

  constructor() {
    this.pinecone = new Pinecone({
      apiKey: import.meta.env.VITE_PINECONE_API_KEY || ''
    });
    
    this.openai = new OpenAI({
      apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
      dangerouslyAllowBrowser: true
    });
  }

  async initialize() {
    try {
      // Initialize Pinecone index
      const indexName = 'fitness-knowledge';
      const indexList = await this.pinecone.listIndexes();
      
      if (!indexList.indexes?.find(idx => idx.name === indexName)) {
        await this.pinecone.createIndex({
          name: indexName,
          dimension: 1536, // OpenAI embedding dimension
          metric: 'cosine',
          spec: {
            serverless: {
              cloud: 'aws',
              region: 'us-east-1'
            }
          }
        });
      }
      
      this.index = this.pinecone.index(indexName);
    } catch (error) {
      console.error('Failed to initialize Pinecone:', error);
    }
  }

  // Generate embeddings for text
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: text,
      });
      return response.data[0].embedding;
    } catch (error) {
      console.error('Failed to generate embedding:', error);
      return [];
    }
  }

  // Implement speculative RAG with conversation trajectory prediction
  async speculativeRetrieve(
    query: string, 
    conversationHistory: any[]
  ): Promise<RetrievalResult[]> {
    try {
      // Generate query embedding
      const queryEmbedding = await this.generateEmbedding(query);
      
      // Predict conversation trajectory based on history
      const trajectoryEmbedding = await this.predictTrajectory(conversationHistory);
      
      // Combine embeddings for speculative retrieval
      const combinedEmbedding = this.combineEmbeddings(queryEmbedding, trajectoryEmbedding);
      
      // Search for relevant documents
      const results = await this.vectorSimilaritySearch(combinedEmbedding, 10);
      
      return results;
    } catch (error) {
      console.error('Speculative retrieval failed:', error);
      return [];
    }
  }

  // Predict conversation trajectory for pre-fetching
  private async predictTrajectory(conversationHistory: any[]): Promise<number[]> {
    if (conversationHistory.length === 0) {
      return new Array(1536).fill(0);
    }

    // Analyze conversation pattern
    const recentContext = conversationHistory.slice(-5).map(msg => msg.content).join(' ');
    const trajectoryPrompt = `Based on this fitness conversation: "${recentContext}", predict the next likely topics or questions.`;
    
    const trajectoryEmbedding = await this.generateEmbedding(trajectoryPrompt);
    return trajectoryEmbedding;
  }

  // Combine embeddings with weighted average
  private combineEmbeddings(embedding1: number[], embedding2: number[], weight1 = 0.7): number[] {
    const weight2 = 1 - weight1;
    return embedding1.map((val, idx) => val * weight1 + embedding2[idx] * weight2);
  }

  // Vector similarity search
  async vectorSimilaritySearch(
    embedding: number[], 
    topK: number = 5
  ): Promise<RetrievalResult[]> {
    try {
      if (!this.index) {
        console.warn('Pinecone index not initialized');
        return [];
      }

      const queryResponse = await this.index.query({
        vector: embedding,
        topK,
        includeMetadata: true,
        includeValues: false,
      });

      return queryResponse.matches?.map((match: any) => ({
        id: match.id,
        content: match.metadata?.content || '',
        score: match.score || 0,
        metadata: match.metadata || {}
      })) || [];
    } catch (error) {
      console.error('Vector search failed:', error);
      return [];
    }
  }

  // Semantic caching with vector similarity (50ms response target)
  async semanticCache(query: string): Promise<CachedResponse | null> {
    const startTime = Date.now();
    
    try {
      // Quick exact match check
      if (this.cache.has(query)) {
        const cached = this.cache.get(query)!;
        if (Date.now() - cached.timestamp < 24 * 60 * 60 * 1000) { // 24 hour TTL
          console.log(`Cache hit (exact match): ${Date.now() - startTime}ms`);
          return cached;
        }
      }

      // Semantic similarity search
      const embedding = await this.generateEmbedding(query);
      const similarResponse = await this.findSimilarCachedResponse(embedding, 0.95);
      
      if (similarResponse) {
        console.log(`Cache hit (semantic): ${Date.now() - startTime}ms`);
        return similarResponse;
      }

      return null;
    } catch (error) {
      console.error('Semantic cache error:', error);
      return null;
    }
  }

  // Find similar cached responses
  private async findSimilarCachedResponse(
    embedding: number[], 
    threshold: number
  ): Promise<CachedResponse | null> {
    let bestMatch: CachedResponse | null = null;
    let bestScore = 0;

    // Check all cached responses
    for (const [cachedQuery, cachedResponse] of this.cache.entries()) {
      const cachedEmbedding = await this.generateEmbedding(cachedQuery);
      const similarity = this.cosineSimilarity(embedding, cachedEmbedding);
      
      if (similarity > threshold && similarity > bestScore) {
        bestScore = similarity;
        bestMatch = cachedResponse;
      }
    }

    return bestMatch;
  }

  // Calculate cosine similarity
  private cosineSimilarity(vec1: number[], vec2: number[]): number {
    const dotProduct = vec1.reduce((sum, val, idx) => sum + val * vec2[idx], 0);
    const mag1 = Math.sqrt(vec1.reduce((sum, val) => sum + val * val, 0));
    const mag2 = Math.sqrt(vec2.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (mag1 * mag2);
  }

  // Cache a response
  async cacheResponse(query: string, response: string, trajectory?: string[]): Promise<void> {
    this.cache.set(query, {
      query,
      response,
      timestamp: Date.now(),
      trajectory
    });

    // Limit cache size
    if (this.cache.size > 1000) {
      const oldestKey = Array.from(this.cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)[0][0];
      this.cache.delete(oldestKey);
    }
  }

  // Index fitness documents
  async indexFitnessDocuments(documents: FitnessDocument[]): Promise<void> {
    try {
      const vectors = await Promise.all(
        documents.map(async (doc) => {
          const embedding = await this.generateEmbedding(doc.content);
          return {
            id: doc.id,
            values: embedding,
            metadata: {
              ...doc.metadata,
              content: doc.content
            }
          };
        })
      );

      // Batch upsert to Pinecone
      const batchSize = 100;
      for (let i = 0; i < vectors.length; i += batchSize) {
        const batch = vectors.slice(i, i + batchSize);
        await this.index.upsert(batch);
      }

      console.log(`Indexed ${documents.length} fitness documents`);
    } catch (error) {
      console.error('Failed to index documents:', error);
    }
  }
}

// Export singleton instance
export const fitnessRAG = new FitnessRAGService();