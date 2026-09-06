import { BigQuery, Query } from '@google-cloud/bigquery';
import { LRUCache } from 'lru-cache';
import crypto from 'crypto';

// Initialize BigQuery Client
// It automatically picks up GOOGLE_APPLICATION_CREDENTIALS from the environment
const bigquery = new BigQuery();

// Initialize the LRU Cache
// Cache up to 100 queries, TTL of 15 minutes
const queryCache = new LRUCache<string, any[]>({
  max: 100,
  ttl: 1000 * 60 * 15, // 15 minutes
});

/**
 * Generates a deterministic cache key based on the query string and parameters.
 */
function generateCacheKey(query: string, params?: Record<string, any>): string {
  const payload = JSON.stringify({ query, params });
  return crypto.createHash('sha256').update(payload).digest('hex');
}

/**
 * Executes a BigQuery SQL query with caching.
 */
export async function executeCachedQuery<T = any>(
  query: string,
  params?: Record<string, any>
): Promise<T[]> {
  const cacheKey = generateCacheKey(query, params);
  
  // Check Cache
  const cachedData = queryCache.get(cacheKey);
  if (cachedData) {
    console.log(`\n[BigQuery Cache Hit] Query served from memory: ${cacheKey.substring(0, 8)}`);
    return cachedData as T[];
  }

  // Cache Miss - Query BigQuery
  console.log(`\n[BigQuery Cache Miss] Executing query...`);
  const options: Query = {
    query,
    params,
  };

  try {
    const [rows] = await bigquery.query(options);
    queryCache.set(cacheKey, rows);
    return rows as T[];
  } catch (error: any) {
    console.error('BigQuery execution failed:', error);
    // Since this is a scaffold, if GCP isn't configured, we'll throw a friendly error
    // so the fallback mock engine in nodes.ts can catch it.
    throw new Error(`BigQuery Error: ${error.message}`);
  }
}

/**
 * Utility to clear the cache if a budget shift occurs.
 */
export function invalidateQueryCache(): void {
  queryCache.clear();
  console.log('\n[BigQuery Cache] Cleared to fetch fresh state.');
}
