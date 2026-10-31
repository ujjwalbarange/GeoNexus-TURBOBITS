/**
 * Custom React Hook: useTrafficData
 * Strict API Quota Conservation:
 * - NO automatic background polling.
 * - Cache-first architecture: Loads from local cache when switching cities or revisiting.
 * - API queries executed ONLY upon explicit operator click of the Refresh button.
 */

import { useState, useEffect, useCallback } from 'react';
import { trafficApiClient } from '../services/trafficApi';
import { normalizeTrafficData } from '../services/trafficNormalizer';
import { TrafficCacheManager } from '../services/trafficCache';

export function useTrafficData(cityId) {
  const [trafficData, setTrafficData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastRefreshedAt, setLastRefreshedAt] = useState(null);
  const [isCached, setIsCached] = useState(false);
  const [customEndpoint, setCustomEndpoint] = useState(import.meta.env.VITE_TRAFFIC_API_URL || '');

  /**
   * Load data for city
   * @param {boolean} forceFetch - If true, bypasses cache and hits the TomTom API
   */
  const loadData = useCallback(async (forceFetch = false) => {
    setError(null);

    // 1. If not forcing a refresh, check cache first to preserve API limits
    if (!forceFetch) {
      const cached = TrafficCacheManager.get(cityId);
      if (cached && cached.data) {
        setTrafficData(cached.data);
        setLastRefreshedAt(new Date(cached.cachedAt));
        setIsCached(true);
        setLoading(false);
        return;
      }
    }

    // 2. Fetch from live API only on initial empty state or explicit user click
    setLoading(true);
    setIsCached(false);

    try {
      const apiResult = await trafficApiClient.fetchLiveTraffic(cityId);
      const normalized = normalizeTrafficData(apiResult, cityId);

      // Store in persistent cache
      TrafficCacheManager.set(cityId, normalized);

      setTrafficData(normalized);
      setLastRefreshedAt(new Date());

      if (!apiResult.success && apiResult.status !== 'AWAITING_API_KEY') {
        setError(apiResult.message);
      }
    } catch (err) {
      setError(err.message || 'Error fetching traffic telemetry');
    } finally {
      setLoading(false);
    }
  }, [cityId]);

  // City change: load from cache (zero network calls if previously cached)
  useEffect(() => {
    loadData(false);
  }, [cityId, loadData]);

  // Explicit user-triggered refresh
  const handleExplicitRefresh = () => {
    loadData(true);
  };

  const setApiEndpoint = (url, key = '') => {
    trafficApiClient.setEndpoint(url, key);
    setCustomEndpoint(url);
    handleExplicitRefresh();
  };

  return {
    trafficData,
    loading,
    error,
    lastRefreshedAt,
    isCached,
    refresh: handleExplicitRefresh,
    customEndpoint,
    setApiEndpoint,
  };
}
