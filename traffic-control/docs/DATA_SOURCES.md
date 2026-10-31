# Data Sources & Integration Specifications

## 1. Live Telemetry Providers

| Source | Type | Endpoint / Integration | Usage & Quota Rules |
| :--- | :--- | :--- | :--- |
| **TomTom Traffic Flow Segments** | Live REST API | `https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/12/json` | Sampled strictly on verified corridor probe points for Mumbai, Nagpur, and Pune. Cached in localStorage; queried ONLY on manual refresh. |
| **TomTom Traffic Flow Tiles** | Raster Overlay | `https://api.tomtom.com/traffic/map/4/tile/flow/relative0/{z}/{x}/{y}.png` | Bounded strictly to `city.bounds`. Zero requests generated outside designated city geofence. |
| **TomTom Incident Details** | Live REST API | `https://api.tomtom.com/traffic/services/5/incidentDetails` | Bounded to city bounding boxes. |

---

## 2. Root Project Map Services

| Service | Root Endpoint | Data Ingested |
| :--- | :--- | :--- |
| **Emergency & Traffic Facilities** | `http://localhost:3000/api/admin/map-data` | Verified locations of Police Stations, Traffic Divisions, Fire Stations, and Hospitals. |
| **Stormwater & Waterway GIS** | `http://localhost:3000/api/hazards/map-layers` | GeoJSON stormwater drainage lines and waterways for flood-related traffic choke points. |
| **Municipal Wards / Zones** | `http://localhost:3000/api/admin/map-data` | Zonal boundaries for administrative reporting. |

---

## 3. Local Structured Datasets

| Dataset | Location | Records |
| :--- | :--- | :--- |
| **Bridge & Infrastructure Classifications** | `data/infrastructure/bridges/bridge_classifications.json` | 8 structural bridge types with engineering criteria |
| **Corridor Infrastructure Proposals** | `data/infrastructure/bridges/corridor_proposals.json` | Saki Naka, Sitabuldi, and Hinjawadi grade separation dossiers |
| **Traffic Police Resources** | `data/police/police_resources.json` | Unit IDs, duty statuses, and patrol coordinates |
| **Road Restrictions & Construction** | `data/restrictions/road_restrictions.json` | Active metro works and bridge repair closures |
| **Recurring Traffic Patterns** | `data/patterns/recurring_patterns.json` | Peak windows, propagation distances, and intervention recommendations |
