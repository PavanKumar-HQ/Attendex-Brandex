import test from "node:test";
import assert from "node:assert";
import { cacheManager } from "./cache-manager";

test("CacheManager: returns fresh data on first query (MISS) and cached on second (HIT)", async () => {
  let callCount = 0;
  const fetcher = async () => {
    callCount++;
    return { timestamp: Date.now(), counter: callCount };
  };

  const key = "test:query:1";
  cacheManager.invalidateKey(key);

  // First call -> Cache MISS
  const res1 = await cacheManager.getOrSet(key, fetcher, 10, ["test_tag"]);
  assert.strictEqual(res1.isCached, false);
  assert.strictEqual(res1.data.counter, 1);
  assert.strictEqual(callCount, 1);

  // Second call -> Cache HIT (0ms instant)
  const res2 = await cacheManager.getOrSet(key, fetcher, 10, ["test_tag"]);
  assert.strictEqual(res2.isCached, true);
  assert.strictEqual(res2.data.counter, 1);
  assert.strictEqual(callCount, 1); // Fetcher was NOT called again
});

test("CacheManager: tag-based invalidation clears cached items", async () => {
  let callCount = 0;
  const fetcher = async () => {
    callCount++;
    return { data: `value-${callCount}` };
  };

  const key = "test:tag_invalidation";
  cacheManager.invalidateKey(key);

  await cacheManager.getOrSet(key, fetcher, 60, ["pulse_tag"]);
  assert.strictEqual(callCount, 1);

  // Invalidate by tag
  const invalidatedCount = cacheManager.invalidateTags(["pulse_tag"]);
  assert.strictEqual(invalidatedCount >= 1, true);

  // Next query must trigger fetcher again
  const freshRes = await cacheManager.getOrSet(key, fetcher, 60, ["pulse_tag"]);
  assert.strictEqual(freshRes.isCached, false);
  assert.strictEqual(freshRes.data.data, "value-2");
  assert.strictEqual(callCount, 2);
});

test("CacheManager: prevents concurrent stampede on same key", async () => {
  let fetcherCalls = 0;
  const slowFetcher = async () => {
    fetcherCalls++;
    await new Promise((r) => setTimeout(r, 20));
    return { done: true };
  };

  const key = "test:stampede";
  cacheManager.invalidateKey(key);

  // Fire 5 concurrent requests simultaneously
  const results = await Promise.all([
    cacheManager.getOrSet(key, slowFetcher, 10),
    cacheManager.getOrSet(key, slowFetcher, 10),
    cacheManager.getOrSet(key, slowFetcher, 10),
    cacheManager.getOrSet(key, slowFetcher, 10),
    cacheManager.getOrSet(key, slowFetcher, 10),
  ]);

  assert.strictEqual(fetcherCalls, 1); // Exactly 1 fetcher execution despite 5 concurrent calls
  for (const r of results) {
    assert.strictEqual(r.data.done, true);
  }
});
