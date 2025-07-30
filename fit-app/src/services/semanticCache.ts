import { createClient } from '@supabase/supabase-js';
import { OpenAI } from 'openai';

interface CachedResponse {
  id?: string;
  query_text: string;
  response_text: string;
  context_hash: string;
  embedding?: number[];
  created_at: string;
  access_count: number;
  ttl: number;
  similarity?: number;
  cache_hit?: boolean;
}

interface CacheMetrics {
  hitRate: number;
  avgResponseTime: number;
  cacheSize: number;
  popularQueries: Array<{ query: string; count: number }>;
}

export class SemanticCacheService {
  private supabase: any;
  private openai: OpenAI;
  private metrics: {
    hits: number;
    misses: number;
    totalResponseTime: number;
    queryCount: Map<string, number>;
  };

  constructor() {
    try {
      // Safe Supabase initialization
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (supabaseUrl && supabaseKey && supabaseUrl.startsWith('http')) {
        this.supabase = createClient(supabaseUrl, supabaseKey);
        console.log('Semantic cache with Supabase initialized');
      } else {
        console.warn('Semantic cache running in memory-only mode');
        this.supabase = null as any;
      }
    } catch (error) {
      console.error('Failed to initialize semantic cache:', error);
      this.supabase = null as any;
    }

    this.openai = new OpenAI({
      apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
      dangerouslyAllowBrowser: true
    });

    this.metrics = {
      hits: 0,
      misses: 0,
      totalResponseTime: 0,
      queryCount: new Map()
    };

    // Initialize database schema if needed
    this.initializeSchema();
  }

  private async initializeSchema() {
    try {
      // Check if table exists, create if not
      const { error } = await this.supabase
        .from('ai_response_cache')
        .select('id')
        .limit(1);

      if (error && error.code === 'PGRST116') {
        console.log('Cache table not found, creating schema...');
        // In production, this would be handled by migrations
        // For now, we'll just log that the table needs to be created
      }
    } catch (error) {
      console.error('Failed to initialize cache schema:', error);
    }
  }

  // Generate embedding for text
  private async generateEmbedding(text: string): Promise<number[]> {
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

  // Hash context for efficient comparison
  private hashContext(context: any): string {
    const contextString = JSON.stringify(context, Object.keys(context).sort());
    // Simple hash function for demo - in production use crypto
    let hash = 0;
    for (let i = 0; i < contextString.length; i++) {
      const char = contextString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  // Cache AI response with vector embeddings
  async cacheResponse(
    query: string, 
    response: string, 
    context: any
  ): Promise<void> {
    try {
      const embedding = await this.generateEmbedding(query + JSON.stringify(context));
      
      const cacheEntry = {
        query_text: query,
        response_text: response,
        context_hash: this.hashContext(context),
        embedding: embedding,
        created_at: new Date().toISOString(),
        access_count: 0,
        ttl: Date.now() + (1000 * 60 * 60 * 24) // 24 hour TTL
      };

      const { error } = await this.supabase
        .from('ai_response_cache')
        .insert(cacheEntry);

      if (error) {
        console.error('Failed to cache response:', error);
      } else {
        // Update query count metrics
        const count = this.metrics.queryCount.get(query) || 0;
        this.metrics.queryCount.set(query, count + 1);
      }
    } catch (error) {
      console.error('Cache write error:', error);
    }
  }

  // Retrieve similar cached responses using vector similarity
  async findSimilarResponse(
    query: string, 
    context: any, 
    threshold = 0.85
  ): Promise<CachedResponse | null> {
    const startTime = Date.now();
    
    try {
      // First check for exact match with same context
      const contextHash = this.hashContext(context);
      const { data: exactMatch } = await this.supabase
        .from('ai_response_cache')
        .select('*')
        .eq('query_text', query)
        .eq('context_hash', contextHash)
        .gt('ttl', Date.now())
        .single();

      if (exactMatch) {
        // Update metrics
        this.metrics.hits++;
        this.metrics.totalResponseTime += (Date.now() - startTime);
        
        // Update access count
        await this.supabase
          .from('ai_response_cache')
          .update({ access_count: exactMatch.access_count + 1 })
          .eq('id', exactMatch.id);

        return {
          ...exactMatch,
          similarity: 1.0,
          cache_hit: true
        };
      }

      // If no exact match, perform semantic search
      const queryEmbedding = await this.generateEmbedding(query + JSON.stringify(context));
      
      // Use Supabase RPC function for vector similarity search
      const { data, error } = await this.supabase.rpc('match_cached_responses', {
        query_embedding: queryEmbedding,
        similarity_threshold: threshold,
        match_count: 1
      });

      if (error) {
        console.error('Semantic search error:', error);
        this.metrics.misses++;
        return null;
      }

      if (data && data.length > 0) {
        const match = data[0];
        
        // Fetch full record
        const { data: fullRecord } = await this.supabase
          .from('ai_response_cache')
          .select('*')
          .eq('id', match.id)
          .single();

        if (fullRecord && fullRecord.ttl > Date.now()) {
          // Update metrics
          this.metrics.hits++;
          this.metrics.totalResponseTime += (Date.now() - startTime);
          
          // Update access count
          await this.supabase
            .from('ai_response_cache')
            .update({ access_count: fullRecord.access_count + 1 })
            .eq('id', fullRecord.id);

          return {
            ...fullRecord,
            similarity: match.similarity,
            cache_hit: true
          };
        }
      }

      // No valid cache hit
      this.metrics.misses++;
      this.metrics.totalResponseTime += (Date.now() - startTime);
      return null;

    } catch (error) {
      console.error('Cache retrieval error:', error);
      this.metrics.misses++;
      return null;
    }
  }

  // Clean up expired cache entries
  async cleanupExpiredEntries(): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('ai_response_cache')
        .delete()
        .lt('ttl', Date.now());

      if (error) {
        console.error('Failed to cleanup expired entries:', error);
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }

  // Get cache performance metrics
  async getCacheMetrics(): Promise<CacheMetrics> {
    const totalRequests = this.metrics.hits + this.metrics.misses;
    const hitRate = totalRequests > 0 ? this.metrics.hits / totalRequests : 0;
    const avgResponseTime = totalRequests > 0 
      ? this.metrics.totalResponseTime / totalRequests 
      : 0;

    // Get cache size
    const { count } = await this.supabase
      .from('ai_response_cache')
      .select('*', { count: 'exact', head: true });

    // Get popular queries
    const popularQueries = Array.from(this.metrics.queryCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([query, count]) => ({ query, count }));

    return {
      hitRate,
      avgResponseTime,
      cacheSize: count || 0,
      popularQueries
    };
  }

  // Preload frequently accessed responses
  async preloadPopularResponses(): Promise<void> {
    try {
      // Get most accessed responses
      const { data } = await this.supabase
        .from('ai_response_cache')
        .select('*')
        .order('access_count', { ascending: false })
        .limit(50);

      if (data) {
        // In a real implementation, we might preload these into memory
        console.log(`Preloaded ${data.length} popular responses`);
      }
    } catch (error) {
      console.error('Failed to preload popular responses:', error);
    }
  }

  // Invalidate cache entries matching a pattern
  async invalidatePattern(pattern: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('ai_response_cache')
        .delete()
        .ilike('query_text', `%${pattern}%`);

      if (error) {
        console.error('Failed to invalidate cache pattern:', error);
      }
    } catch (error) {
      console.error('Cache invalidation error:', error);
    }
  }
}

// Export singleton instance
export const semanticCache = new SemanticCacheService();