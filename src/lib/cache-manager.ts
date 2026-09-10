/**
 * Attendex Asynchronous High-Performance Cache Manager
 * Provides in-memory edge caching, TTL management, stampede deduplication,
 * and tag-based invalidation across institutional API routes.
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
  tags: string[];
  createdAt: number;
}

class CacheManager {
  private cache = new Map<string, CacheEntry<any>>();
  private inFlight = new Map<string, Promise<any>>();
  private stats = {
    hits: 0,
    misses: 0,
  };

  /**
   * Retrieves data from cache or runs asynchronous fetcher function.
   * Prevents concurrent stampedes by deduplicating in-flight promises.
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlSeconds: number = 60,
    tags: string[] = []
  ): Promise<{ data: T; isCached: boolean; ageSeconds: number }> {
    const now = Date.now();
    const existing = this.cache.get(key);

    if (existing && existing.expiresAt > now) {
      this.stats.hits++;
      const ageSeconds = Math.round((now - existing.createdAt) / 1000);
      return { data: existing.data as T, isCached: true, ageSeconds };
    }

    // Deduplicate in-flight fetcher promises to avoid database stampedes
    if (this.inFlight.has(key)) {
      const data = await this.inFlight.get(key);
      return { data, isCached: true, ageSeconds: 0 };
    }

    this.stats.misses++;
    const fetchPromise = (async () => {
      try {
        const freshData = await fetcher();
        this.cache.set(key, {
          data: freshData,
          expiresAt: Date.now() + ttlSeconds * 1000,
          tags,
          createdAt: Date.now(),
        });
        return freshData;
      } finally {
        this.inFlight.delete(key);
      }
    })();

    this.inFlight.set(key, fetchPromise);
    const result = await fetchPromise;
    return { data: result, isCached: false, ageSeconds: 0 };
  }

  /**
   * Invalidates all cache entries matching the specified tags.
   */
  invalidateTags(tags: string[]): number {
    const targetTags = new Set(tags);
    let count = 0;

    for (const [key, entry] of this.cache.entries()) {
      const hasMatchingTag = entry.tags.some((tag) => targetTags.has(tag));
      if (hasMatchingTag) {
        this.cache.delete(key);
        count++;
      }
    }

    return count;
  }

  /**
   * Invalidates an explicit key or key prefix.
   */
  invalidateKey(keyPrefix: string): number {
    let count = 0;
    for (const key of this.cache.keys()) {
      if (key === keyPrefix || key.startsWith(keyPrefix)) {
        this.cache.delete(key);
        count++;
      }
    }
    return count;
  }

  /**
   * Clears the entire cache.
   */
  clear(): void {
    this.cache.clear();
    this.inFlight.clear();
  }

  /**
   * Returns current cache telemetry metrics.
   */
  getStats() {
    return {
      size: this.cache.size,
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRatio:
        this.stats.hits + this.stats.misses > 0
          ? (this.stats.hits / (this.stats.hits + this.stats.misses)).toFixed(3)
          : "0.000",
    };
  }
}

// Global singleton instance across Next.js worker contexts
const globalForCache = globalThis as unknown as { attendexCacheManager?: CacheManager };
export const cacheManager = globalForCache.attendexCacheManager || new CacheManager();
if (process.env.NODE_ENV !== "production") globalForCache.attendexCacheManager = cacheManager;
