/* ═══════════════════════════════════════════════════════════════════════
   Sentinel City Intelligence — Shared Environmental Observation Contract
   Phase 1 Server-Side Data Architecture
   
   Enforces strict provenance, coordinate resolution, temporal metadata,
   honesty indicators (no zero-filled fallback numbers), and typed distinctions
   between observed sensors, numerical model nowcasts, forecasts, and warnings.
   ═══════════════════════════════════════════════════════════════════════ */

export type ObservationDataType =
  | "OBSERVED"          // Direct physical sensor or station AWS/ARG reading
  | "MODEL_NOWCAST"      // High-resolution numerical model analysis (current hour)
  | "FORECAST"           // Projected meteorological prediction (+1h to +7d)
  | "REANALYSIS"         // Historical calibrated reanalysis (ERA5/CERRA)
  | "CAP_WARNING"        // Official emergency warning (NDMA SACHET / IMD CAP)
  | "STATIC_GEOGRAPHY"   // Validated GIS spatial boundary, contour, or DEM sink
  | "SCENARIO";          // Hydrodynamic simulation or what-if scenario

export type DataQualityStatus =
  | "VALIDATED"          // Received fresh, schema-validated, within physical bounds
  | "PROVISIONAL"        // Received fresh, but single-station or provisional feed
  | "STALE"              // Retained from cache beyond freshness TTL; feed unreachable
  | "UNAVAILABLE";       // Remote service failed/timed out; parameter is missing (NOT 0)

export interface Coordinates {
  lat: number;
  lon: number;
}

export interface EnvironmentalObservationParameter {
  key: string;                                   // e.g., "rainfall_rate", "precipitation_probability", "us_aqi", "wave_height"
  label: string;                                 // Human-readable: "Instantaneous Rain Rate", "PM2.5"
  value: number | string | null;                 // Explicitly null when unavailable; never fabricated
  unit: string;                                  // "mm/h", "°C", "%", "km/h", "m", "m³/s", "AQI"
  isUnavailable: boolean;                        // True if feed failed or parameter omitted
  quality: DataQualityStatus;                    // VALIDATED, PROVISIONAL, STALE, UNAVAILABLE
  note?: string;                                 // E.g. "Sensor offline", "Coarse 11km model cell"
}

export interface EnvironmentalObservationSnapshot {
  /** Stable snapshot ULID identifier */
  snapshotId: string;

  /** Target administrative municipality */
  city: "mumbai" | "pune" | "nagpur";

  /** Hyperlocal zone, ward, or locality label if resolved */
  sourceLocation: string;
  zoneOrWard?: string;

  /** Geographic precision: requested user/ward location vs effective grid cell */
  requestedCoordinates: Coordinates;
  effectiveCoordinates: Coordinates;
  spatialResolution: string;                     // e.g. "Station Point", "~11 km ECMWF Grid", "1 km WRF"
  temporalResolution: string;                    // e.g. "15-minute", "Hourly", "24-hour aggregate"

  /** Provenance and source metadata */
  provider: string;                              // e.g. "Open-Meteo", "NDMA SACHET", "IMD AWS"
  endpointOrProduct: string;                     // e.g. "/v1/forecast", "air-quality", "marine"
  modelIdentifier?: string;                      // e.g. "ECMWF IFS 0.25°", "Copernicus GEMS", "Seamless v4"
  dataType: ObservationDataType;
  sourceUrl: string;
  providerAttribution: string;
  license: string;                               // e.g. "CC-BY 4.0", "Open Government Data License India"

  /** Timestamps strictly tracking data life-cycle */
  timestamps: {
    requestedAt: string;                         // ISO UTC timestamp when our server dispatched request
    retrievedAt: string;                         // ISO UTC timestamp when response was parsed
    issuedAt?: string;                           // ISO UTC when provider generated this model run / warning
    validAt: string;                             // ISO UTC for which this observation or forecast is valid
  };

  /** Caching and staleness */
  cacheExpiry: string;                           // ISO UTC when in-memory cache expires
  staleness: {
    isStale: boolean;                            // True if served from stale fallback cache
    ageSeconds: number;                          // Seconds elapsed since observation validAt
  };

  /** Observation parameters payload */
  parameters: Record<string, EnvironmentalObservationParameter>;

  /** Validation errors or feed anomaly diagnostics */
  validationErrors: string[];
}

/**
 * Helper to build an honest unavailable parameter
 */
export function createUnavailableParameter(
  key: string,
  label: string,
  unit: string,
  reason: string = "Provider feed offline or parameter unavailable"
): EnvironmentalObservationParameter {
  return {
    key,
    label,
    value: null,
    unit,
    isUnavailable: true,
    quality: "UNAVAILABLE",
    note: reason,
  };
}

/**
 * Helper to build a validated parameter
 */
export function createValidatedParameter(
  key: string,
  label: string,
  value: number | string | null | undefined,
  unit: string,
  isStale: boolean = false
): EnvironmentalObservationParameter {
  if (value === null || value === undefined) {
    return createUnavailableParameter(key, label, unit, "Parameter omitted by remote source");
  }

  return {
    key,
    label,
    value,
    unit,
    isUnavailable: false,
    quality: isStale ? "STALE" : "VALIDATED",
  };
}

// ─── Unified Multi-Hazard Abstraction ─────────────────────────────────────────

export type UnifiedHazardType =
  | "FLOOD"
  | "WILDFIRE"
  | "URBAN_FIRE"
  | "THERMAL_ANOMALY";

export interface HazardTypeMeta {
  type: UnifiedHazardType;
  label: string;
  icon: string;
  color: string;
  badgeBg: string;
  badgeBorder: string;
  description: string;
}

export const HAZARD_TYPE_META: Record<UnifiedHazardType, HazardTypeMeta> = {
  FLOOD: {
    type: "FLOOD",
    label: "Urban Flood & Waterlogging",
    icon: "🌊",
    color: "#0284c7",
    badgeBg: "rgba(2, 132, 199, 0.12)",
    badgeBorder: "rgba(2, 132, 199, 0.35)",
    description: "Inundation, stormwater surcharge, depression sinks, and coastal surge",
  },
  WILDFIRE: {
    type: "WILDFIRE",
    label: "Wildfire & Forest Fire",
    icon: "🔥",
    color: "#ea580c",
    badgeBg: "rgba(234, 88, 12, 0.12)",
    badgeBorder: "rgba(234, 88, 12, 0.35)",
    description: "Pre-fire vegetation risk, forest edge thermal anomalies, and spread vectors",
  },
  URBAN_FIRE: {
    type: "URBAN_FIRE",
    label: "Urban Structural Fire",
    icon: "🚒",
    color: "#dc2626",
    badgeBg: "rgba(220, 38, 38, 0.12)",
    badgeBorder: "rgba(220, 38, 38, 0.35)",
    description: "High-density residential, commercial or industrial fire incidents",
  },
  THERMAL_ANOMALY: {
    type: "THERMAL_ANOMALY",
    label: "Satellite Thermal Anomaly",
    icon: "🛰️",
    color: "#f59e0b",
    badgeBg: "rgba(245, 158, 11, 0.12)",
    badgeBorder: "rgba(245, 158, 11, 0.35)",
    description: "Unconfirmed satellite brightness-temperature and fire radiative power detection",
  },
};

// ─── Active Satellite Thermal Detection Contract ──────────────────────────────

export interface SatelliteThermalObservation {
  id: string;
  city: "mumbai" | "pune" | "nagpur";
  hazardType: "WILDFIRE" | "URBAN_FIRE" | "THERMAL_ANOMALY";
  sourceId: string; // e.g. "NASA_FIRMS_VIIRS", "NASA_FIRMS_MODIS"
  sourceObservationId: string;
  satellite: string; // "NOAA-20", "NOAA-21", "Suomi-NPP", "Terra", "Aqua"
  instrument: string; // "VIIRS", "MODIS"
  latitude: number;
  longitude: number;
  h3Index: string; // H3 index (resolution 8 by default)
  h3Resolution: number;
  brightnessKelvin: number | null;
  brightT31Kelvin: number | null;
  fireRadiativePowerMW: number | null;
  confidenceRaw: string;
  confidenceCategory: "LOW" | "NOMINAL" | "HIGH";
  daynight: "D" | "N" | null;
  isSimulated: boolean;
  observedAt: string; // ISO 8601 UTC
  acquiredDate: string;
  acquiredTime: string;
  ingestedAt: string;
  provenance: {
    sourceUrl: string;
    retrievedAt: string;
    datasetVersion: string;
    license: string;
  };
  rawPayload: Record<string, unknown>;
}

// ─── Pre-Fire Risk Assessment (H3 Hexagonal Cell) ─────────────────────────────

export interface FireRiskAssessment {
  id: string;
  city: "mumbai" | "pune" | "nagpur";
  h3Index: string;
  h3Resolution: number;
  riskScore: number; // 0 to 100
  riskLevel: "VERY_LOW" | "LOW" | "MODERATE" | "HIGH" | "VERY_HIGH";
  factors: Array<{
    factor: string;
    weightPercent: number;
    value: string | number;
    contribution: number;
    description: string;
  }>;
  weatherInputs: {
    temperatureCelsius: number;
    relativeHumidity: number;
    windSpeedKmh: number;
    windDirectionDegrees: number;
    recentRainfallMm: number;
    drySpellDays: number;
  };
  terrainInputs?: {
    slopeDegrees: number;
    aspectDegrees: number;
    elevationMeters: number;
  };
  vegetationInputs?: {
    drynessIndex: number; // 0 to 1
    vegetationClass?: string;
  };
  modelTimestamp: string;
  validUntil: string;
  modelVersion: string;
  isExperimental: boolean;
  uncertaintyDisclaimer: string;
}

// ─── Emergency Station & Response Dispatch Contracts ──────────────────────────

export interface EmergencyStation {
  stationId: string;
  stationCode: string;
  city: "mumbai" | "pune" | "nagpur";
  name: string;
  type: "MUNICIPAL_FIRE_BRIGADE" | "FOREST_DEPARTMENT" | "DISASTER_CELL" | "CIVIL_DEFENSE";
  jurisdictionWardOrZone: string;
  latitude: number;
  longitude: number;
  contactPhone: string;
  operationalStatus: "OPERATIONAL" | "STANDBY" | "COMMITTED" | "MAINTENANCE";
  apparatus: string[];
  sourceDataset: string;
}

export interface HazardDispatchRecord {
  dispatchId: string;
  dispatchReference: string;
  city: "mumbai" | "pune" | "nagpur";
  hazardType: "WILDFIRE" | "URBAN_FIRE" | "THERMAL_ANOMALY" | "FLOOD";
  incidentId?: string;
  observationId?: string;
  targetLatitude: number;
  targetLongitude: number;
  recommendedStation: EmergencyStation;
  alternativeStations: Array<{
    station: EmergencyStation;
    estimatedMinutes: number;
    distanceKm: number;
  }>;
  estimatedTravelMinutes: number;
  estimatedDistanceKm: number;
  routingMethod: "OSRM_NETWORK" | "HAVERSINE_SURFACE_ROAD_APPROX";
  routeGeometry?: {
    type: "LineString";
    coordinates: [number, number][]; // [lon, lat]
  } | null;
  dispatchMode: "PREVIEW_SIMULATED" | "AUTHORIZED_DISPATCH" | "STANDBY_ALERT";
  status: "PROPOSED" | "APPROVED" | "ACKNOWLEDGED" | "EN_ROUTE" | "ON_SCENE" | "RESOLVED" | "CANCELLED";
  authorizedBy?: string | null;
  authorizedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  operationalNotes: string;
}

// ─── Fire Spread Heuristic Vector ─────────────────────────────────────────────

export interface FireSpreadVector {
  originLat: number;
  originLon: number;
  h3OriginCell: string;
  predictedSpreadDirectionDeg: number; // Meteorological compass direction (0° North, 90° East)
  predictedSpreadSpeedKmh: number;
  uncertaintyConeDegrees: number; // typically 30° to 60°
  timeHorizonHours: number;
  potentiallyAffectedH3Cells: Array<{
    h3Index: string;
    estimatedArrivalMinutes: number;
    probabilityScore: number; // 0.0 to 1.0
  }>;
  assumptions: string[];
  disclaimer: string;
}

