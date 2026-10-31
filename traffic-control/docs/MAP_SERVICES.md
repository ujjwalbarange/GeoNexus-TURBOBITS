# Map Services & Traffic API Integration Guide

## 1. Map Providers & Tile Sources

The application uses **OpenStreetMap (OSM)** as its default, primary cartographic basemap, with optional toggles for Dark Ops, Vector, and Satellite modes:

| Provider | Theme / Mode | URL Template | Authentication | Optimal Use Case |
| :--- | :--- | :--- | :--- | :--- |
| **OpenStreetMap Standard** | Standard Cartography (Default) | `https://tile.openstreetmap.org/{z}/{x}/{y}.png` | None (Attribution required) | Primary default street-level traffic navigation & infrastructure inspection |
| **CARTO Dark Matter** | Dark Operations (Night Theme) | `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png` | None (Open access) | Low-light control room monitoring; high contrast for traffic neon lines |
| **MapTiler Streets** | Vector Raster Tiles | `https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key={KEY}` | `VITE_MAPTILER_API_KEY` | High-DPI street labels and administrative overlays |
| **Esri World Imagery** | Satellite Imagery | `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}` | None (Open access) | Terrain & highway infrastructure correlation |

---

## 2. Root Project Map Services Integration

`traffic-control/` connects directly to the root Next.js project (`http://localhost:3000`) to reuse its spatial datasets and endpoints without code duplication:

| Endpoint | Source in Root | Purpose in Traffic Dashboard |
| :--- | :--- | :--- |
| `/api/admin/map-data?city={city}` | `src/app/api/admin/map-data/route.ts` | Ingests real municipal facilities (Police Stations, Traffic Posts, Fire Stations, Hospitals) and Ward/Zone boundaries |
| `/api/hazards/map-layers?city={city}` | `src/app/api/hazards/map-layers/route.ts` | Ingests verified GeoJSON drainage networks and natural waterways for flood/monsoon traffic risk correlation |

All root GIS layers can be toggled on or off from the **Root Project Map Services** card in the dashboard sidebar.

---

## 3. Traffic Color Standards & Classification Heuristics

Congestion classification strictly follows the prompt requirements:

```text
Speed Ratio = Current Measured Speed (km/h) / Free-Flow Speed Limit (km/h)
```

| Congestion Level | Color Hex | Speed Ratio Threshold | Description |
| :--- | :--- | :--- | :--- |
| **FREE_FLOW** | `#10b981` (Green) | Ratio $\ge 0.80$ | Free-flowing, speeds at or near legal limits |
| **MODERATE** | `#facc15` (Yellow) | $0.55 \le \text{Ratio} < 0.80$ | Noticeable queueing, minor intermittent delays |
| **HEAVY** | `#f97316` (Orange) | $0.30 \le \text{Ratio} < 0.55$ | Significant congestion, start-stop conditions |
| **SEVERE** | `#ef4444` (Red) | $0.10 \le \text{Ratio} < 0.30$ | Critical gridlock, prolonged stationary intervals |
| **BLOCKED** | `#991b1b` (Dark Red) | $\text{Ratio} < 0.10$ or Speed $\le 2$ km/h | Standstill or physical corridor closure / incident |
| **UNKNOWN** | `#64748b` (Slate) | Unmeasured / Standby | Telemetry currently unavailable from provider |

> **Ethical Telemetry Guarantee**: No synthetic or fake congestion data is fabricated. When a corridor does not have active sensor measurements, it is represented transparently with `UNKNOWN` status.

---

## 4. Live TomTom Traffic Engine Integration

The dashboard integrates TomTom Traffic Services using the provided key:

1. **Live Traffic Flow Tiles (Whole-City Coverage)**:
   ```text
   https://api.tomtom.com/traffic/map/4/tile/flow/relative0/{z}/{x}/{y}.png?key={VITE_TOMTOM_API_KEY}
   ```
2. **Corridor Flow Segment Data**:
   ```text
   https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/12/json?point={lat},{lng}&unit=KMPH&key={VITE_TOMTOM_API_KEY}
   ```
3. **Live Incident Details**:
   ```text
   https://api.tomtom.com/traffic/services/5/incidentDetails?bbox={minLon},{minLat},{maxLon},{maxLat}&key={VITE_TOMTOM_API_KEY}
   ```

---

## 5. Environment Variables

| Variable | Required | Default | Purpose |
| :--- | :--- | :--- | :--- |
| `VITE_ROOT_API_URL` | Optional | `http://localhost:3000` | Root project map services URL |
| `VITE_DEFAULT_MAP_STYLE` | Optional | `osm-standard` | Default basemap (`osm-standard`) |
| `VITE_TOMTOM_API_KEY` | Recommended | Provided | TomTom Live Traffic API Key |
| `VITE_MAPTILER_API_KEY` | Optional | `vfych9w2Nh5AGjIQ7jgL` | MapTiler vector basemap client key |
| `VITE_TRAFFIC_REFRESH_INTERVAL_MS` | Optional | `30000` | Polling frequency (30 seconds) |
| `VITE_DEFAULT_CITY` | Optional | `mumbai` | Initial selected city (`mumbai`, `nagpur`, `pune`) |
