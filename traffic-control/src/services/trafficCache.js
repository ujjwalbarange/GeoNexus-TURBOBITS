/**
 * Traffic Data Cache Manager
 * Enforces strict API quota conservation:
 * - Caches traffic telemetry per city in localStorage + in-memory store
 * - Prevents redundant network calls when panning, scrolling, switching cities, or reloading
 * - Network fetches occur ONLY when the operator explicitly clicks the Refresh button
 */

const CACHE_PREFIX = 'traffic_ctrl_cache_';
const memoryCache = new Map();

export class TrafficCacheManager {
  /**
   * Get cached data for city
   * @param {string} cityId 'mumbai' | 'nagpur' | 'pune'
   */
  static get(cityId) {
    // 1. Check memory cache first
    if (memoryCache.has(cityId)) {
      return memoryCache.get(cityId);
    }

    // 2. Check localStorage
    try {
      const key = `${CACHE_PREFIX}${cityId}`;
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        memoryCache.set(cityId, parsed);
        return parsed;
      }
    } catch (e) {
      console.warn('[TrafficCache] LocalStorage read error:', e);
    }

    return null;
  }

  /**
   * Store data in cache
   * @param {string} cityId
   * @param {Object} data
   */
  static set(cityId, data) {
    const record = {
      cityId,
      cachedAt: new Date().toISOString(),
      data,
    };

    memoryCache.set(cityId, record);

    try {
      const key = `${CACHE_PREFIX}${cityId}`;
      localStorage.setItem(key, JSON.stringify(record));
    } catch (e) {
      console.warn('[TrafficCache] LocalStorage write error:', e);
    }

    return record;
  }

  /**
   * Invalidate city cache
   */
  static clear(cityId) {
    memoryCache.delete(cityId);
    try {
      localStorage.removeItem(`${CACHE_PREFIX}${cityId}`);
    } catch (e) {}
  }

  /**
   * Clear all cities
   */
  static clearAll() {
    memoryCache.clear();
    try {
      const keys = Object.keys(localStorage);
      for (const k of keys) {
        if (k.startsWith(CACHE_PREFIX)) {
          localStorage.removeItem(k);
        }
      }
    } catch (e) {}
  }
}
