/* ════════════════════════════════════════════════════════
   Sentinel City Intelligence — Wildfire & Thermal Schema (005)
   All tables use CHAR(26) ULIDs, UTC timestamps, JSON payloads
   Strict city multi-tenancy: VARCHAR(20) NOT NULL
   ════════════════════════════════════════════════════════ */

export const SCHEMA_VERSION = "005";

export interface WildfireObservationRecord {
  id: string;
  city: string;
  hazard_type: string;
  source_id: string;
  source_observation_id: string;
  satellite: string;
  instrument: string;
  latitude: number;
  longitude: number;
  h3_index: string;
  h3_resolution: number;
  brightness_kelvin: number | null;
  bright_t31_kelvin: number | null;
  frp_mw: number | null;
  confidence_raw: string;
  confidence_category: "LOW" | "NOMINAL" | "HIGH";
  daynight: "D" | "N" | null;
  is_simulated: number;
  observed_at: string;
  acquired_date: string;
  acquired_time: string;
  ingested_at: string;
  raw_payload: Record<string, unknown>;
}

export interface FireRiskAssessmentRecord {
  id: string;
  city: string;
  h3_index: string;
  h3_resolution: number;
  risk_score: number;
  risk_level: "VERY_LOW" | "LOW" | "MODERATE" | "HIGH" | "VERY_HIGH";
  temperature_celsius: number | null;
  relative_humidity: number | null;
  wind_speed_kmh: number | null;
  wind_direction_deg: number | null;
  dry_spell_days: number;
  vegetation_dryness_index: number | null;
  slope_degrees: number | null;
  contributing_factors: Array<{
    factor: string;
    weightPercent: number;
    value: string | number;
    contribution: number;
    description: string;
  }>;
  model_version: string;
  assessed_at: string;
  valid_until: string;
  is_experimental: number;
}

export interface EmergencyStationRecord {
  id: string;
  station_code: string;
  city: string;
  name: string;
  station_type: "MUNICIPAL_FIRE_BRIGADE" | "FOREST_DEPARTMENT" | "DISASTER_CELL" | "CIVIL_DEFENSE";
  jurisdiction_ward: string | null;
  latitude: number;
  longitude: number;
  contact_phone: string | null;
  operational_status: "OPERATIONAL" | "STANDBY" | "COMMITTED" | "MAINTENANCE";
  apparatus_inventory: string[] | null;
  source_dataset: string;
  created_at: string;
}

export interface HazardDispatchRecord {
  id: string;
  dispatch_reference: string;
  city: string;
  hazard_type: string;
  incident_id: string | null;
  observation_id: string | null;
  target_lat: number;
  target_lon: number;
  assigned_station_id: string;
  estimated_travel_minutes: number;
  estimated_distance_km: number;
  routing_engine: string;
  route_geometry: any | null;
  dispatch_mode: "PREVIEW_SIMULATED" | "AUTHORIZED_DISPATCH" | "STANDBY_ALERT";
  status: "PROPOSED" | "APPROVED" | "ACKNOWLEDGED" | "EN_ROUTE" | "ON_SCENE" | "RESOLVED" | "CANCELLED";
  authorized_by: string | null;
  authorized_at: string | null;
  created_at: string;
  updated_at: string;
}

export const wildfireSchemaSql = `
-- ============================================================
-- 1. Wildfire & Thermal Hotspot Observations
-- ============================================================
CREATE TABLE IF NOT EXISTS hazard_wildfire_observations (
  id CHAR(26) NOT NULL PRIMARY KEY,
  city VARCHAR(20) NOT NULL,
  hazard_type VARCHAR(50) NOT NULL DEFAULT 'WILDFIRE',
  source_id VARCHAR(50) NOT NULL,
  source_observation_id VARCHAR(100) NOT NULL,
  satellite VARCHAR(50) NOT NULL,
  instrument VARCHAR(50) NOT NULL,
  latitude DECIMAL(10, 7) NOT NULL,
  longitude DECIMAL(10, 7) NOT NULL,
  h3_index VARCHAR(20) NOT NULL,
  h3_resolution TINYINT NOT NULL DEFAULT 8,
  brightness_kelvin DECIMAL(7, 2) NULL,
  bright_t31_kelvin DECIMAL(7, 2) NULL,
  frp_mw DECIMAL(9, 2) NULL,
  confidence_raw VARCHAR(20) NOT NULL,
  confidence_category ENUM('LOW', 'NOMINAL', 'HIGH') NOT NULL DEFAULT 'NOMINAL',
  daynight ENUM('D', 'N') NULL,
  is_simulated TINYINT(1) NOT NULL DEFAULT 0,
  observed_at DATETIME NOT NULL,
  acquired_date DATE NOT NULL,
  acquired_time VARCHAR(10) NOT NULL,
  ingested_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  raw_payload JSON NOT NULL,
  UNIQUE KEY idx_wildfire_obs_unique (source_id, source_observation_id, acquired_date),
  KEY idx_wildfire_city_time (city, observed_at),
  KEY idx_wildfire_h3 (h3_index, observed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 2. Pre-Fire Risk Assessments (H3 Hexagonal Cells)
-- ============================================================
CREATE TABLE IF NOT EXISTS fire_risk_assessments (
  id CHAR(26) NOT NULL PRIMARY KEY,
  city VARCHAR(20) NOT NULL,
  h3_index VARCHAR(20) NOT NULL,
  h3_resolution TINYINT NOT NULL DEFAULT 8,
  risk_score INT NOT NULL,
  risk_level ENUM('VERY_LOW', 'LOW', 'MODERATE', 'HIGH', 'VERY_HIGH') NOT NULL,
  temperature_celsius DECIMAL(5, 2) NULL,
  relative_humidity DECIMAL(5, 2) NULL,
  wind_speed_kmh DECIMAL(5, 2) NULL,
  wind_direction_deg INT NULL,
  dry_spell_days INT NOT NULL DEFAULT 0,
  vegetation_dryness_index DECIMAL(4, 3) NULL,
  slope_degrees DECIMAL(5, 2) NULL,
  contributing_factors JSON NOT NULL,
  model_version VARCHAR(30) NOT NULL DEFAULT 'FIRE_RISK_SCREENING_V1',
  assessed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  valid_until DATETIME NOT NULL,
  is_experimental TINYINT(1) NOT NULL DEFAULT 1,
  KEY idx_fire_risk_h3_time (h3_index, assessed_at),
  KEY idx_fire_risk_city_level (city, risk_level, assessed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 3. Emergency Stations
-- ============================================================
CREATE TABLE IF NOT EXISTS emergency_stations (
  id CHAR(26) NOT NULL PRIMARY KEY,
  station_code VARCHAR(50) NOT NULL,
  city VARCHAR(20) NOT NULL,
  name VARCHAR(200) NOT NULL,
  station_type ENUM('MUNICIPAL_FIRE_BRIGADE', 'FOREST_DEPARTMENT', 'DISASTER_CELL', 'CIVIL_DEFENSE') NOT NULL,
  jurisdiction_ward VARCHAR(50) NULL,
  latitude DECIMAL(10, 7) NOT NULL,
  longitude DECIMAL(10, 7) NOT NULL,
  contact_phone VARCHAR(50) NULL,
  operational_status ENUM('OPERATIONAL', 'STANDBY', 'COMMITTED', 'MAINTENANCE') NOT NULL DEFAULT 'OPERATIONAL',
  apparatus_inventory JSON NULL,
  source_dataset VARCHAR(100) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY idx_station_code (station_code),
  KEY idx_station_city_type (city, station_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 4. Hazard Dispatch Records
-- ============================================================
CREATE TABLE IF NOT EXISTS hazard_dispatch_records (
  id CHAR(26) NOT NULL PRIMARY KEY,
  dispatch_reference VARCHAR(30) NOT NULL,
  city VARCHAR(20) NOT NULL,
  hazard_type VARCHAR(50) NOT NULL,
  incident_id CHAR(26) NULL,
  observation_id CHAR(26) NULL,
  target_lat DECIMAL(10, 7) NOT NULL,
  target_lon DECIMAL(10, 7) NOT NULL,
  assigned_station_id CHAR(26) NOT NULL,
  estimated_travel_minutes DECIMAL(5, 1) NOT NULL,
  estimated_distance_km DECIMAL(6, 2) NOT NULL,
  routing_engine VARCHAR(50) NOT NULL DEFAULT 'OSRM_HYBRID',
  route_geometry JSON NULL,
  dispatch_mode ENUM('PREVIEW_SIMULATED', 'AUTHORIZED_DISPATCH', 'STANDBY_ALERT') NOT NULL DEFAULT 'PREVIEW_SIMULATED',
  status ENUM('PROPOSED', 'APPROVED', 'ACKNOWLEDGED', 'EN_ROUTE', 'ON_SCENE', 'RESOLVED', 'CANCELLED') NOT NULL DEFAULT 'PROPOSED',
  authorized_by VARCHAR(100) NULL,
  authorized_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY idx_dispatch_ref (dispatch_reference),
  KEY idx_dispatch_station (assigned_station_id, status),
  KEY idx_dispatch_city_status (city, status, dispatch_mode)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;
