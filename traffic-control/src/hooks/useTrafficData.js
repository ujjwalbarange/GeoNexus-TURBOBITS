/**
 * Custom React Hook: useTrafficData
 * Coordinates API fetching, normalization, automatic polling intervals,
 * and data state management for the active city.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { trafficApiClient } from '../services/trafficApi';
import { normalizeTrafficData } from '../services/trafficNormalizer';

const DEFAULT_INTERVAL = parseInt(import.meta.env.VITE_TRAFFIC_REFRESH_INTERVAL_MS || '30000', 10);

export function useTrafficData(cityId) {
  const [trafficData, setTrafficData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefreshedAt, setLastRefreshedAt] = useState(null);
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [customEndpoint, setCustomEndpoint] = useState(import.meta.env.VITE_TRAFFIC_API_URL || '');

  const intervalRef = useRef(null);

  const fetchTraffic = useCallback(async (showSpinner = false) => {
    if (showSpinner) setLoading(true);
    setError(null);

    try {
      const apiResult = await trafficApiClient.fetchLiveTraffic(cityId);
      const normalized = normalizeTrafficData(apiResult, cityId);
      setTrafficData(normalized);
      setLastRefreshedAt(new Date());

      if (!apiResult.success && apiResult.status !== 'AWAITING_API_ENDPOINT') {
        setError(apiResult.message);
      }
    } catch (err) {
      setError(err.message || 'Error fetching traffic data');
    } finally {
      setLoading(false);
    }
  }, [cityId]);

  // Initial fetch on city change
  useEffect(() => {
    fetchTraffic(true);
  }, [fetchTraffic]);

  // Periodic polling interval
  useEffect(() => {
    if (!isAutoRefresh) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      fetchTraffic(false);
    }, DEFAULT_INTERVAL);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isAutoRefresh, fetchTraffic]);

  const toggleAutoRefresh = () => {
    setIsAutoRefresh((prev) => !prev);
  };

  const setApiEndpoint = (url, key = '') => {
    trafficApiClient.setEndpoint(url, key);
    setCustomEndpoint(url);
    fetchTraffic(true);
  };

  return {
    trafficData,
    loading,
    error,
    lastRefreshedAt,
    isAutoRefresh,
    toggleAutoRefresh,
    refresh: () => fetchTraffic(true),
    customEndpoint,
    setApiEndpoint,
  };
}
