-- ══════════════════════════════════════════════════════════════════════════════
-- Sentinel City Intelligence — Wildfire & Thermal Intelligence Schema (005)
-- Multi-Hazard Disaster Intelligence Extension
-- Compatibility: MySQL 8.0+ / TiDB Cloud Serverless
-- Enforces: CHAR(26) ULIDs, UTC timestamps, JSON payloads, strict multi-tenancy
-- ══════════════════════════════════════════════════════════════════════════════

-- ============================================================
-- 1. Wildfire & Thermal Hotspot Observations (Satellite Telemetry)
-- ============================================================
CREATE TABLE IF NOT EXISTS hazard_wildfire_observations (
  id CHAR(26) NOT NULL PRIMARY KEY,
  city VARCHAR(20) NOT NULL,
  hazard_type VARCHAR(50) NOT NULL DEFAULT 'WILDFIRE',
  source_id VARCHAR(50) NOT NULL,                    -- e.g. 'NASA_FIRMS_VIIRS', 'NASA_FIRMS_MODIS', 'ISRO_MOSDAC'
  source_observation_id VARCHAR(100) NOT NULL,       -- Stable hash of lat, lon, acq_date, acq_time
  satellite VARCHAR(50) NOT NULL,                    -- 'NOAA-20', 'NOAA-21', 'Suomi-NPP', 'Terra', 'Aqua'
  instrument VARCHAR(50) NOT NULL,                   -- 'VIIRS', 'MODIS'
  latitude DECIMAL(10, 7) NOT NULL,
  longitude DECIMAL(10, 7) NOT NULL,
  h3_index VARCHAR(20) NOT NULL,                     -- H3 hexagonal cell (resolution 8)
  h3_resolution TINYINT NOT NULL DEFAULT 8,
  brightness_kelvin DECIMAL(7, 2) NULL,              -- Brightness temperature I-4 / 21
  bright_t31_kelvin DECIMAL(7, 2) NULL,              -- Channel 31 brightness temp (K)
  frp_mw DECIMAL(9, 2) NULL,                         -- Fire Radiative Power (MW)
  confidence_raw VARCHAR(20) NOT NULL,               -- 'nominal', 'high', 'low' or percentage
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
-- 2. Pre-Fire Risk Assessments (H3 Hexagonal Spatial Cells)
-- ============================================================
CREATE TABLE IF NOT EXISTS fire_risk_assessments (
  id CHAR(26) NOT NULL PRIMARY KEY,
  city VARCHAR(20) NOT NULL,
  h3_index VARCHAR(20) NOT NULL,
  h3_resolution TINYINT NOT NULL DEFAULT 8,
  risk_score INT NOT NULL,                           -- 0 to 100
  risk_level ENUM('VERY_LOW', 'LOW', 'MODERATE', 'HIGH', 'VERY_HIGH') NOT NULL,
  temperature_celsius DECIMAL(5, 2) NULL,
  relative_humidity DECIMAL(5, 2) NULL,
  wind_speed_kmh DECIMAL(5, 2) NULL,
  wind_direction_deg INT NULL,
  dry_spell_days INT NOT NULL DEFAULT 0,
  vegetation_dryness_index DECIMAL(4, 3) NULL,       -- 0.000 to 1.000
  slope_degrees DECIMAL(5, 2) NULL,
  contributing_factors JSON NOT NULL,                -- [{factor, weightPercent, value, contribution}]
  model_version VARCHAR(30) NOT NULL DEFAULT 'FIRE_RISK_SCREENING_V1',
  assessed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  valid_until DATETIME NOT NULL,
  is_experimental TINYINT(1) NOT NULL DEFAULT 1,
  KEY idx_fire_risk_h3_time (h3_index, assessed_at),
  KEY idx_fire_risk_city_level (city, risk_level, assessed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 3. Emergency Stations (Fire Brigade & Forest Range Offices)
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
  apparatus_inventory JSON NULL,                     -- ['Water Tender', 'Foam Crash Tender', 'Hydraulic Platform']
  source_dataset VARCHAR(100) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY idx_station_code (station_code),
  KEY idx_station_city_type (city, station_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 4. Hazard Dispatch Records (Operational Response)
-- ============================================================
CREATE TABLE IF NOT EXISTS hazard_dispatch_records (
  id CHAR(26) NOT NULL PRIMARY KEY,
  dispatch_reference VARCHAR(30) NOT NULL,           -- e.g. DSP-MUM-2026-0001
  city VARCHAR(20) NOT NULL,
  hazard_type VARCHAR(50) NOT NULL,                  -- 'WILDFIRE', 'URBAN_FIRE', 'THERMAL_ANOMALY', 'FLOOD'
  incident_id CHAR(26) NULL,
  observation_id CHAR(26) NULL,
  target_lat DECIMAL(10, 7) NOT NULL,
  target_lon DECIMAL(10, 7) NOT NULL,
  assigned_station_id CHAR(26) NOT NULL,
  estimated_travel_minutes DECIMAL(5, 1) NOT NULL,
  estimated_distance_km DECIMAL(6, 2) NOT NULL,
  routing_engine VARCHAR(50) NOT NULL DEFAULT 'OSRM_HYBRID',
  route_geometry JSON NULL,                          -- GeoJSON LineString for travel path
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
