# PHASE 1 — WILDFIRE INTELLIGENCE AUDIT & MULTI-HAZARD INTEGRATION PLAN
## Unified Multi-Hazard Disaster Intelligence Platform (Flood + Wildfire + Civic Response)

**Audited Repository:** `GeoNexus-TURBOBITS` (Urban Link / Sentinel City Intelligence)  
**Date:** October 2026  
**Status:** Phase 1 Complete — Architecture, Asset Inventory & Risk Matrix Verified  
**Target Coverage:** Mumbai (BMC), Pune (PMC), Nagpur (NMC)

---

## 1. Executive Summary & Audit Findings

The existing codebase is an enterprise Next.js (v16.3.1 with App Router, Turbopack, Tailwind CSS v4, and Leaflet GIS) application named **Urban Link / Sentinel City Intelligence**. It features:
1. **Urban Flood Screening & Simulation:** Dedicated 24 BMC ward spatial screening engine (`src/modules/simulation/engine.ts`), hydrodynamic coastal lockout logic (>= 4.5m tide), and 10 verified GeoJSON layers in Mumbai (`data/mumbai/flood_spatial/`).
2. **Civic Issue Reporting & Operations:** Multi-department triage across 17 municipal departments (`src/modules/routing/`), with field worker rosters and TiDB Cloud storage.
3. **Telemetry Intelligence:** Server-side connectors for Open-Meteo (Weather, AQI, Marine Surge, River Discharge), NDMA SACHET (CAP warnings), and USGS (Seismology).
4. **Verified Civic Facility GIS:** Authentic fire brigade stations, forest department offices, and municipal boundary datasets for **all three cities** (`data/mumbai/mumbai_fire_brigade_clean.geojson`, `data/pune/pune_fire_brigade_stations.geojson`, `data/geodata/nagpur_fire_department.geojson`, etc.).

This audit establishes the integration of **Wildfire Intelligence, Satellite Heatmaps, H3 Hexagonal Spatial Risk Analysis, and Emergency Dispatch** as a non-destructive extension of the existing disaster intelligence architecture.

---

## 2. Reusable vs. Modified vs. New Component Matrix

### A. Existing Components Reusable Directly (Zero Breaking Changes)
| Component / Module | Location | Reusability Justification |
| :--- | :--- | :--- |
| **Mumbai Flood Vector Adapter** | `src/modules/hazards/mumbai-flood-adapter.ts` | Retains all 10 verified Mumbai flood layers (hotspots, depression basins, nullahs, coastal surge). Fire models will NOT modify flood calculations. |
| **Spatial Flood Simulation Engine** | `src/modules/simulation/engine.ts` | Retains all 7 monotonic rainfall scenarios and BMC ward demographic exposure logic. |
| **Point-in-Polygon Engine** | `src/modules/geo/point-in-polygon.ts` | Fast ray-casting containment algorithm reused for ward and boundary resolution. |
| **Canonical Mumbai GIS** | `src/modules/geo/canonical-gis.ts` | 24 BMC ward boundary resolver and topology bounds. |
| **City Context & Multi-Tenancy** | `src/lib/city-context.ts` | Multi-city switching (Mumbai, Pune, Nagpur) with coordinate centers, bounds, and municipal helplines. |
| **TiDB Database Client** | `src/lib/db.ts` | MySQL2 connection pool with TLS 1.2+ for TiDB Cloud. |
| **Environmental Telemetry Core** | `src/modules/hazards/connectors/open-meteo.ts` | Reused to fetch relative humidity, ambient temperature, wind speed, wind gusts, and precipitation. |
| **Citizen Reporting Pipeline** | `src/app/(citizen)/...`, `src/modules/ai/engine.ts` | Full voice/multimedia complaint ingestion and worker task routing preserved. |

### B. Components Requiring Extension / Modification
| Component / Module | Location | Required Modifications |
| :--- | :--- | :--- |
| **Hazard Type Contracts** | `src/modules/hazards/contracts.ts` & `src/modules/hazards/connectors/types.ts` | Add unified hazard types: `"WILDFIRE"`, `"URBAN_FIRE"`, `"THERMAL_ANOMALY"` alongside existing `"flood"`, `"rainfall"`, `"coastal_surge"`. |
| **Assessment Engine** | `src/modules/hazards/assessment-engine.ts` | Support hazard mode selector (`"FLOOD"` vs `"FIRE"` vs `"COMBINED"`). Maintain independent mathematical rubrics for each hazard. |
| **GIS Map Layers API** | `src/app/api/hazards/map-layers/route.ts` | Ingest and serve new fire layers: active satellite hotspots, pre-fire risk H3 grids, fire stations, forest boundary vectors. |
| **Admin Command Map** | `src/app/(admin)/admin/map/page.tsx` & `src/components/admin/osm-incident-map.tsx` | Add Hazard Mode Switcher (Flood, Fire, Combined), Active Fire Detections layer, Pre-fire Risk Heatmap toggle with opacity slider, and H3 inspection popups. |
| **Operational Routing Engine** | `src/modules/routing/engine.ts` & `src/modules/routing/registry.ts` | Add fire-specific incident categories (`fire_rescue`, `forest_fire`, `industrial_thermal`), linking to municipal Fire Brigade and Forest Range stations. |
| **Citizen Hazard Map** | `src/components/citizen/citizen-hazard-map-inner.tsx` | Display nearby verified fire brigade stations, active fire alerts, and fire precaution advisories. |

### C. Brand New Modules Required
| New Module Name | Intended Location | Purpose & Functionality |
| :--- | :--- | :--- |
| **NASA FIRMS Connector** | `src/modules/hazards/connectors/firms.ts` | Ingestion of VIIRS (S-NPP, NOAA-20/21) and MODIS active fire hotspots with deduplication, confidence filtering, and mock fallback. |
| **H3 Spatial Grid Engine** | `src/modules/hazards/h3-grid.ts` | Hexagonal spatial indexing (H3 res 7/8 for regional fire, res 8/9 for urban), binning fire detections, and computing cell geometries. |
| **Pre-Fire Risk Estimator** | `src/modules/hazards/fire-risk-engine.ts` | Multi-factor pre-fire risk scoring rubric (0–100) using vegetation dryness, temp, relative humidity, wind speed, dry-spell days, and terrain slope. |
| **Heuristic Fire Spread Estimator**| `src/modules/hazards/fire-spread-estimator.ts` | Directional fire spread vector and uncertainty cone calculation based on wind direction, wind speed, and terrain aspect. |
| **Emergency Station Dispatch Engine**| `src/modules/hazards/emergency-dispatch.ts` | Road-distance and ETA ranking for Fire Brigade and Forest Range offices, with safe preview / simulated dispatch mode. |
| **Unified 2D/3D Map View** | `src/components/maps/unified-hazard-canvas.tsx` | Coordinated 2D Leaflet and 3D terrain viewer (supporting pitch, extruded H3 cells, wind arrows, and active fire markers). |

---

## 3. Database Schema Migration Plan

We extend the database schema non-destructively by creating migration `005-wildfire-intelligence.sql` (and TypeScript representation `src/db/schema/005-wildfire-intelligence.ts`).

### Proposed Tables:
1. `hazard_wildfire_observations`: Stores satellite thermal detections (NASA FIRMS VIIRS/MODIS) with latitude, longitude, observation time, brightness temperature (K), FRP (MW), confidence level, sensor/satellite, and H3 resolution 8 index. Unique constraint on `(source_observation_id, satellite, observed_at)` prevents duplicate ingestion.
2. `fire_risk_assessments`: Hexagonal H3 pre-fire risk assessments with 0–100 risk score, risk level, contributing meteorological/environmental factor weights, and input freshness indicators.
3. `emergency_stations`: Verified inventory of Fire Brigade stations and Forest Department range offices with municipal jurisdiction, apparatus count, and coordinates.
4. `hazard_dispatch_records`: Authorized dispatch workflow records linking active fire incidents or observations to recommended stations, estimated ETA (minutes), route geometry, and authorization status (`PREVIEW_SIMULATED`, `AWAITING_AUTHORIZATION`, `DISPATCHED`).

---

## 4. External Datasets & Credentials Checklist

| Dataset / Service | Status | Credential / Configuration | Transparent Fallback When Missing |
| :--- | :--- | :--- | :--- |
| **NASA FIRMS (VIIRS & MODIS)** | REST API | `NASA_FIRMS_MAP_KEY` (Free registration) | High-fidelity local historical fire detection samples for Mumbai, Pune, and Nagpur (clearly labeled as sample/historical). |
| **Open-Meteo Weather** | REST API | None required (Open & free) | In-memory cached observation; offline fallback telemetry. |
| **Municipal Fire Stations GIS** | Local GeoJSON | Bundled in repository (`data/mumbai/`, `data/pune/`, `data/geodata/`) | 100% active and local; 0 external API calls needed. |
| **Copernicus GLO-30 DEM** | Pre-processed JSON | Bundled in `data/mumbai/terrain/` | Terrain profile dataset already resident locally. |
| **OSRM Routing Engine** | REST Service | `OSRM_ROUTING_URL` (Defaults to public OSRM demo or local haversine road-network approximation) | Haversine distance with road winding factor ($1.35\times$) and average municipal response velocity ($35\text{ km/h}$). |

---

## 5. Architectural Isolation & Non-Regression Rules

1. **Flood Model Protection:** `src/modules/simulation/engine.ts` and `src/modules/hazards/mumbai-flood-adapter.ts` will remain completely separate. No wildfire risk formula will touch flood depth, stormwater outfall gates, or tidal surge calculations.
2. **Civic Workflow Continuity:** All existing civic issue tables (`incidents`, `incident_departments`, `tasks`, `workers`) and AI complaint triage remain untouched. Fire incidents utilize `fire_brigade` and `forest_wildlife` rules already configured in `src/lib/department-registry.ts`.
3. **No Fabricated Satellite Rasters:** We will render authentic vector point detections and computed H3 hexagonal aggregations. Isolated point detections will NEVER be blurred into fake continuous thermal satellite imagery.
4. **No Autonomous Real-World Dispatch:** Real sirens or emergency calls are strictly barred. The system operates in a safe `PREVIEW_SIMULATED` dispatch mode with human-in-the-loop authorization controls.
5. **Clear Epistemic Status:** All UI widgets will explicitly tag data as `OBSERVED SATELLITE`, `HEURISTIC ESTIMATE`, `PRE-FIRE RISK MODEL`, or `SIMULATION PREVIEW`.
