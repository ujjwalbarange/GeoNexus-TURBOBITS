/* ════════════════════════════════════════════════════════
   Sentinel City Intelligence — H3 Hexagonal Spatial Engine
   Uber H3 Grid Indexing, Aggregation, and GeoJSON Generation
   ════════════════════════════════════════════════════════ */

import * as h3 from "h3-js";

export const H3_RESOLUTIONS = {
  REGIONAL_WILDFIRE: 7, // ~5.16 km² area, ~1.22 km edge
  LOCAL_RISK_SURFACE: 8, // ~0.74 km² area, ~461 m edge (Default for wildfire risk)
  URBAN_FLOOD: 9,        // ~0.10 km² area, ~174 m edge (Default for urban ward screening)
} as const;

export interface H3CellPolygon {
  h3Index: string;
  resolution: number;
  center: [number, number]; // [lat, lon]
  coordinates: [number, number][]; // [lat, lon][]
  geojsonCoordinates: [number, number][][]; // [[lon, lat], ...] RFC 7946
}

export interface H3AggregateMetric<T = any> {
  h3Index: string;
  count: number;
  items: T[];
  avgValue?: number;
  maxValue?: number;
  sumValue?: number;
}

/**
 * Convert geographic coordinates to H3 index string.
 */
export function latLngToH3(lat: number, lon: number, resolution: number = H3_RESOLUTIONS.LOCAL_RISK_SURFACE): string {
  if (typeof lat !== "number" || typeof lon !== "number" || isNaN(lat) || isNaN(lon)) {
    throw new Error(`Invalid coordinates for H3 indexing: lat=${lat}, lon=${lon}`);
  }
  return h3.latLngToCell(lat, lon, resolution);
}

/**
 * Get the center coordinates [lat, lon] for an H3 index.
 */
export function h3ToLatLng(h3Index: string): [number, number] {
  return h3.cellToLatLng(h3Index);
}

/**
 * Get boundary vertices of an H3 cell.
 * Returns array of [lat, lon] coordinates.
 */
export function getH3Boundary(h3Index: string): [number, number][] {
  return h3.cellToBoundary(h3Index);
}

/**
 * Convert an H3 index to a GeoJSON Feature Polygon.
 * Coordinates are formatted as GeoJSON RFC 7946 standard: [lon, lat].
 */
export function h3ToGeoJSONFeature(
  h3Index: string,
  properties: Record<string, unknown> = {}
): GeoJSON.Feature<GeoJSON.Polygon> {
  const boundary = h3.cellToBoundary(h3Index);
  // Convert [lat, lon] to GeoJSON standard [lon, lat] and close the polygon ring
  const ring: [number, number][] = boundary.map(([lat, lon]) => [lon, lat]);
  if (ring.length > 0) {
    ring.push([ring[0][0], ring[0][1]]);
  }

  const [centerLat, centerLon] = h3.cellToLatLng(h3Index);
  const resolution = h3.getResolution(h3Index);

  return {
    type: "Feature",
    id: h3Index,
    geometry: {
      type: "Polygon",
      coordinates: [ring],
    },
    properties: {
      ...properties,
      h3Index,
      resolution,
      centerLat,
      centerLon,
    },
  };
}

/**
 * Convert a list of H3 indexes into a GeoJSON FeatureCollection.
 */
export function h3ListToFeatureCollection(
  cells: Array<{ h3Index: string; properties?: Record<string, unknown> }>
): GeoJSON.FeatureCollection<GeoJSON.Polygon> {
  return {
    type: "FeatureCollection",
    features: cells.map((c) => h3ToGeoJSONFeature(c.h3Index, c.properties || {})),
  };
}

/**
 * Aggregate spatial point observations into H3 cells.
 */
export function aggregatePointsToH3<T extends { latitude: number; longitude: number }>(
  points: T[],
  resolution: number = H3_RESOLUTIONS.LOCAL_RISK_SURFACE,
  valueExtractor?: (item: T) => number | null
): Map<string, H3AggregateMetric<T>> {
  const cellMap = new Map<string, H3AggregateMetric<T>>();

  for (const point of points) {
    if (point.latitude == null || point.longitude == null || isNaN(point.latitude) || isNaN(point.longitude)) {
      continue;
    }

    const cell = latLngToH3(point.latitude, point.longitude, resolution);
    const existing = cellMap.get(cell) || {
      h3Index: cell,
      count: 0,
      items: [],
      sumValue: 0,
      maxValue: -Infinity,
    };

    existing.count += 1;
    existing.items.push(point);

    if (valueExtractor) {
      const val = valueExtractor(point);
      if (typeof val === "number" && !isNaN(val)) {
        existing.sumValue = (existing.sumValue ?? 0) + val;
        existing.maxValue = Math.max(existing.maxValue ?? -Infinity, val);
      }
    }

    cellMap.set(cell, existing);
  }

  // Calculate averages
  for (const [, metric] of cellMap) {
    if (metric.count > 0 && metric.sumValue !== undefined) {
      metric.avgValue = metric.sumValue / metric.count;
    }
  }

  return cellMap;
}

/**
 * Get neighboring H3 cells within radius k.
 */
export function getH3Neighbors(h3Index: string, kRingRadius: number = 1): string[] {
  return h3.gridDisk(h3Index, kRingRadius);
}

/**
 * Verify whether an H3 cell string is valid.
 */
export function isValidH3Cell(h3Index: string): boolean {
  return h3.isValidCell(h3Index);
}

/**
 * Generate a grid of H3 cells covering a bounding box [southwest, northeast].
 */
export function generateH3BoundingGrid(
  southwest: [number, number],
  northeast: [number, number],
  resolution: number = H3_RESOLUTIONS.LOCAL_RISK_SURFACE
): string[] {
  const [minLat, minLon] = southwest;
  const [maxLat, maxLon] = northeast;

  // Create bounding polygon [lon, lat]
  const polygonCoords: [number, number][] = [
    [minLat, minLon],
    [maxLat, minLon],
    [maxLat, maxLon],
    [minLat, maxLon],
    [minLat, minLon],
  ];

  try {
    return h3.polygonToCells(polygonCoords, resolution);
  } catch (err) {
    console.warn("[H3] polygonToCells fallback for bounding grid:", err);
    // Simple centroid grid fallback
    const cells = new Set<string>();
    const latStep = 0.015;
    const lonStep = 0.015;
    for (let lat = minLat; lat <= maxLat; lat += latStep) {
      for (let lon = minLon; lon <= maxLon; lon += lonStep) {
        cells.add(h3.latLngToCell(lat, lon, resolution));
      }
    }
    return Array.from(cells);
  }
}
