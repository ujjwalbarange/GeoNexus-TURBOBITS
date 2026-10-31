# Standalone Traffic Control Dashboard — Architecture Specification

## 1. Executive Overview

The **Traffic Control Dashboard** is a completely independent, high-performance operational web application engineered specifically for real-time metropolitan traffic surveillance and road corridor management across **Mumbai**, **Nagpur**, and **Pune**.

The application operates as an isolated standalone product inside `traffic-control/`, with zero runtime, build-time, or dependency overlap with the root repository.

---

## 2. Component Hierarchy

```text
src/main.jsx
└── src/App.jsx
    └── src/pages/DashboardPage.jsx
        ├── src/components/layout/Header.jsx
        │   ├── Brand & Operational Badge
        │   ├── src/components/controls/CitySelector.jsx (Mumbai / Nagpur / Pune)
        │   ├── Status Indicator (Live Feed Active / Standby)
        │   └── Telemetry Refresh Controller
        │
        ├── src/components/map/TrafficMap.jsx
        │   ├── Leaflet Map Instance (preferCanvas: true)
        │   ├── src/components/controls/MapControls.jsx (Zoom, Center, Styles, Fullscreen)
        │   ├── Base TileLayer (CARTO Dark Matter / OSM / MapTiler / Satellite)
        │   └── src/services/trafficLayer.js (TrafficMapLayerManager)
        │       ├── Neon Glow Backdrop Polylines
        │       ├── Segment Foreground Polylines
        │       └── Interactive Dark Tooltips
        │
        └── src/components/dashboard/TrafficInfoPanel.jsx
            ├── Citywide Summary Metrics (Total, Measured, Avg Speed, Congestion Index)
            ├── src/components/traffic/TrafficSegmentCard.jsx (Selected Corridor Inspector)
            ├── Live Traffic API Config Widget (Dynamic URL ingestion)
            ├── Key Corridors List & Quick Focus Actions
            └── src/components/traffic/TrafficLegend.jsx (Color Standards)
```

---

## 3. Map Rendering Architecture

```text
┌────────────────────────────────────────────────────────┐
│                   Leaflet Map Canvas                   │
│               (Hardware Accelerated Canvas)            │
└──────────────────────────┬─────────────────────────────┘
                           │
             ┌─────────────┴─────────────┐
             ▼                           ▼
┌─────────────────────────┐ ┌─────────────────────────┐
│     Raster Basemap      │ │   Vector Traffic Layer  │
│      (CARTO Dark,       │ │      (LayerGroup)       │
│       OSM Standard,     │ │ ┌─────────────────────┐ │
│       Esri Satellite,   │ │ │  Glow Backdrop Line │ │
│      MapTiler Streets)  │ │ ├─────────────────────┤ │
│                         │ │ │ Foreground Line     │ │
│                         │ │ ├─────────────────────┤ │
│                         │ │ │ Hover Tooltip       │ │
│                         │ │ └─────────────────────┘ │
└─────────────────────────┘ └─────────────────────────┘
```

### Key Technical Characteristics:
1. **Hardware-Accelerated Rendering**: Leaflet is initialized with `preferCanvas: true`, bypassing heavy DOM SVG node creation for vector lines, guaranteeing 60fps pan and zoom even with dense multi-point road segments.
2. **Smooth Geographic Transition**: Switching cities triggers Leaflet's native `map.flyTo([lat, lng], zoom, { duration: 1.4 })` animation curve without reloading the application or remounting DOM canvas nodes.
3. **Container Invalidation**: Window resize and sidebar toggle events automatically trigger `map.invalidateSize()` to eliminate grey tiles or viewport rendering glitches.

---

## 4. Traffic Telemetry Data Flow

```text
┌──────────────────────────────────────────────────────────┐
│                     User Action / Timer                  │
│       (Initial Mount / 30s Polling / Manual Refresh)     │
└────────────────────────────┬─────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────┐
│              src/services/trafficApi.js                  │
│        (HTTP Client, Headers, Timeout, AbortSignal)      │
└────────────────────────────┬─────────────────────────────┘
                             │
            ┌────────────────┴────────────────┐
            ▼ (Live JSON Feed)                ▼ (No API / Error)
┌───────────────────────────────┐ ┌───────────────────────────────┐
│ src/services/                 │ │ src/services/                 │
│ trafficNormalizer.js          │ │ trafficNormalizer.js          │
│ • Parse GeoJSON / Segments    │ │ • Ingest registered corridors │
│ • Calculate speed ratio       │ │ • Assign UNKNOWN status       │
│ • Map congestion levels       │ │ • Zero artificial estimates   │
│ • Compute average speed       │ │ • Mark status as STANDBY      │
└───────────────┬───────────────┘ └───────────────┬───────────────┘
                │                                 │
                └────────────────┬────────────────┘
                                 │
                                 ▼
┌──────────────────────────────────────────────────────────┐
│               src/hooks/useTrafficData.js                │
│      (Normalized internal model stored in React state)   │
└────────────────────────────┬─────────────────────────────┘
                             │
             ┌───────────────┴───────────────┐
             ▼                               ▼
┌─────────────────────────────┐ ┌─────────────────────────────┐
│  TrafficMapLayerManager     │ │  TrafficInfoPanel / UI      │
│  Vector polylines updated   │ │  Metrics & diagnostics      │
└─────────────────────────────┘ └─────────────────────────────┘
```

---

## 5. Separation of Concerns

- **UI Components** (`src/components/`): Strictly presentational and reactive. They consume data and trigger callback actions without knowing API networking protocols.
- **Data Hook** (`src/hooks/useTrafficData.js`): Coordinates lifecycle, polling cadence, and state bindings.
- **Services** (`src/services/`): Pure JavaScript modules without JSX or React bindings:
  - `trafficApi.js`: Network communications, authorization, abort signals.
  - `trafficNormalizer.js`: Schema translation, speed ratio heuristics, severity color assignment.
  - `trafficLayer.js`: Leaflet vector polyline bindings and event dispatchers.
  - `corridorGeometry.js`: Geographic GPS polylines for verified corridors.
