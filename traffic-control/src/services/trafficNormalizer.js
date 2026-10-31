/**
 * Traffic Response Normalizer
 * Converts varied external traffic API formats into a standardized internal model.
 * 
 * Target Schema for Each Traffic Road Segment:
 * {
 *   id: string,
 *   corridorName: string,
 *   corridorCode: string,
 *   type: string,
 *   coordinates: Array<[number, number]>, // [lat, lng]
 *   currentSpeedKmH: number | null,
 *   freeFlowSpeedKmH: number | null,
 *   speedRatio: number | null, // currentSpeed / freeFlowSpeed (0.0 to 1.0+)
 *   delaySeconds: number | null,
 *   congestionLevel: 'FREE_FLOW' | 'MODERATE' | 'HEAVY' | 'SEVERE' | 'BLOCKED' | 'UNKNOWN',
 *   color: string,
 *   glowColor: string,
 *   description: string,
 *   lastUpdated: string,
 *   isLive: boolean,
 *   source: string,
 * }
 */

import { TRAFFIC_LEVELS } from '../config/mapConfig';
import { CITY_CORRIDOR_GEOMETRIES } from './corridorGeometry';

/**
 * Determine congestion severity level and color from speed ratio or delay
 */
export function calculateCongestionLevel(currentSpeed, freeFlowSpeed, delaySec = 0) {
  if (currentSpeed === null || currentSpeed === undefined || freeFlowSpeed <= 0) {
    return TRAFFIC_LEVELS.UNKNOWN;
  }

  // Complete standstill or blocked road
  if (currentSpeed <= 2 || delaySec > 1800) {
    return TRAFFIC_LEVELS.BLOCKED;
  }

  const ratio = currentSpeed / freeFlowSpeed;

  if (ratio >= TRAFFIC_LEVELS.FREE_FLOW.minSpeedRatio) {
    return TRAFFIC_LEVELS.FREE_FLOW;
  }
  if (ratio >= TRAFFIC_LEVELS.MODERATE.minSpeedRatio) {
    return TRAFFIC_LEVELS.MODERATE;
  }
  if (ratio >= TRAFFIC_LEVELS.HEAVY.minSpeedRatio) {
    return TRAFFIC_LEVELS.HEAVY;
  }
  if (ratio >= TRAFFIC_LEVELS.SEVERE.minSpeedRatio) {
    return TRAFFIC_LEVELS.SEVERE;
  }
  return TRAFFIC_LEVELS.BLOCKED;
}

/**
 * Main normalization pipeline
 * @param {Object} apiResult - Output from trafficApiClient.fetchLiveTraffic()
 * @param {string} cityId - 'mumbai' | 'nagpur' | 'pune'
 */
export function normalizeTrafficData(apiResult, cityId) {
  const registeredCorridors = CITY_CORRIDOR_GEOMETRIES[cityId] || [];

  // 1. If API is not configured or failed, output base corridors with UNKNOWN status
  if (!apiResult || !apiResult.success || !apiResult.data) {
    const fallbackSegments = registeredCorridors.map((c) => ({
      id: c.id,
      corridorName: c.name,
      corridorCode: c.corridorCode,
      type: c.type,
      coordinates: c.coordinates,
      currentSpeedKmH: null,
      freeFlowSpeedKmH: c.speedLimitKmH,
      speedRatio: null,
      delaySeconds: null,
      congestionLevel: TRAFFIC_LEVELS.UNKNOWN.level,
      color: TRAFFIC_LEVELS.UNKNOWN.color,
      glowColor: TRAFFIC_LEVELS.UNKNOWN.glowColor,
      strokeWeight: TRAFFIC_LEVELS.UNKNOWN.strokeWeight,
      description: apiResult?.message || 'Awaiting Live Traffic API feed',
      lastUpdated: apiResult?.timestamp || new Date().toISOString(),
      isLive: false,
      source: 'GeoNexus Road Network Baseline',
    }));

    return {
      cityId,
      isLiveFeed: false,
      status: apiResult?.status || 'AWAITING_API_ENDPOINT',
      statusMessage: apiResult?.message || 'Live traffic API endpoint not configured.',
      totalSegments: fallbackSegments.length,
      measuredSegments: 0,
      averageSpeedKmH: null,
      cityCongestionIndex: null, // Zero fake numbers
      lastUpdated: apiResult?.timestamp || new Date().toISOString(),
      segments: fallbackSegments,
    };
  }

  const rawData = apiResult.data;
  const segments = [];

  // 2. Handle GeoJSON FeatureCollection response
  if (rawData.type === 'FeatureCollection' && Array.isArray(rawData.features)) {
    for (const feat of rawData.features) {
      const geom = feat.geometry;
      const props = feat.properties || {};

      let coords = [];
      if (geom.type === 'LineString') {
        coords = geom.coordinates.map(([lng, lat]) => [lat, lng]);
      } else if (geom.type === 'MultiLineString') {
        coords = (geom.coordinates[0] || []).map(([lng, lat]) => [lat, lng]);
      }

      if (coords.length > 0) {
        const curSpd = props.currentSpeed ?? props.speed ?? null;
        const ffSpd = props.freeFlowSpeed ?? props.freeflow_speed ?? 60;
        const delay = props.delay ?? props.delay_seconds ?? 0;
        const levelConfig = calculateCongestionLevel(curSpd, ffSpd, delay);

        segments.push({
          id: props.id || props.segment_id || `seg_${segments.length + 1}`,
          corridorName: props.road_name || props.name || 'Segment',
          corridorCode: props.code || 'SEC',
          type: props.type || 'Corridor',
          coordinates: coords,
          currentSpeedKmH: curSpd,
          freeFlowSpeedKmH: ffSpd,
          speedRatio: curSpd !== null && ffSpd > 0 ? +(curSpd / ffSpd).toFixed(2) : null,
          delaySeconds: delay,
          congestionLevel: levelConfig.level,
          color: levelConfig.color,
          glowColor: levelConfig.glowColor,
          strokeWeight: levelConfig.strokeWeight,
          description: props.description || levelConfig.description,
          lastUpdated: props.timestamp || apiResult.timestamp,
          isLive: true,
          source: 'Live Traffic Stream',
        });
      }
    }
  } 
  // 3. Handle array of road segment objects
  else if (Array.isArray(rawData.segments || rawData.data || rawData)) {
    const list = rawData.segments || rawData.data || rawData;
    for (const item of list) {
      const coords = item.coordinates || item.polyline || [];
      const curSpd = item.currentSpeed ?? item.speed ?? null;
      const ffSpd = item.freeFlowSpeed ?? item.speedLimit ?? 60;
      const delay = item.delay ?? 0;
      const levelConfig = calculateCongestionLevel(curSpd, ffSpd, delay);

      segments.push({
        id: item.id || `seg_${segments.length + 1}`,
        corridorName: item.roadName || item.name || 'Corridor Segment',
        corridorCode: item.code || 'COR',
        type: item.type || 'Arterial',
        coordinates: coords,
        currentSpeedKmH: curSpd,
        freeFlowSpeedKmH: ffSpd,
        speedRatio: curSpd !== null && ffSpd > 0 ? +(curSpd / ffSpd).toFixed(2) : null,
        delaySeconds: delay,
        congestionLevel: levelConfig.level,
        color: levelConfig.color,
        glowColor: levelConfig.glowColor,
        strokeWeight: levelConfig.strokeWeight,
        description: item.description || levelConfig.description,
        lastUpdated: item.timestamp || apiResult.timestamp,
        isLive: true,
        source: 'Live Traffic Stream',
      });
    }
  }

  // Calculate live citywide summary only if valid measurements exist
  const measured = segments.filter((s) => s.currentSpeedKmH !== null);
  const avgSpeed = measured.length > 0
    ? +(measured.reduce((acc, s) => acc + s.currentSpeedKmH, 0) / measured.length).toFixed(1)
    : null;

  const congestionIndex = measured.length > 0
    ? +(100 - (measured.reduce((acc, s) => acc + (s.speedRatio || 1), 0) / measured.length) * 100).toFixed(0)
    : null;

  return {
    cityId,
    isLiveFeed: true,
    status: 'ONLINE',
    statusMessage: `Receiving live telemetry for ${segments.length} road corridors.`,
    totalSegments: segments.length,
    measuredSegments: measured.length,
    averageSpeedKmH: avgSpeed,
    cityCongestionIndex: congestionIndex,
    lastUpdated: apiResult.timestamp,
    segments,
  };
}
