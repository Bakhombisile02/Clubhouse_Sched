'use strict';

/**
 * In-memory cache with a configurable TTL.
 * Wraps node-cache for a simple get/set interface used by the API routes.
 */

const NodeCache = require('node-cache');

const TTL = parseInt(process.env.CACHE_TTL_SECONDS || '300', 10); // 5 minutes default

const cache = new NodeCache({ stdTTL: TTL, checkperiod: 60 });

const KEYS = {
  ALL: 'all',
  TEAMS: 'teams',
  POOLS: 'pools',
  FIXTURES: 'fixtures',
  RESULTS: 'results',
};

/**
 * Return a cached value, or call `fetcher()` to populate it.
 * @template T
 * @param {string} key
 * @param {() => Promise<T>} fetcher
 * @returns {Promise<T>}
 */
async function getOrFetch(key, fetcher) {
  const cached = cache.get(key);
  if (cached !== undefined) return cached;

  const fresh = await fetcher();
  cache.set(key, fresh);
  return fresh;
}

/** Invalidate all cached entries (triggers fresh fetch on next request). */
function invalidate() {
  cache.flushAll();
}

/** Return the number of seconds until the given key expires, or 0 if missing. */
function ttl(key) {
  return cache.getTtl(key) || 0;
}

module.exports = { getOrFetch, invalidate, ttl, KEYS };
