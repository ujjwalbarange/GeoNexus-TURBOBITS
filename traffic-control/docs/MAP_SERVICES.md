# Map Services & Traffic API Integration Guide

## 1. Map Providers & Tile Sources

The application is pre-configured with four complementary tile providers tailored for traffic operations:

| Provider | Theme / Mode | URL Template | Authentication | Optimal Use Case |
| :--- | :--- | :--- | :--- | :--- |
| **CARTO Dark Matter** | Dark Operations (Default) | `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png` | None (Open access) | Primary nighttime & command center operations; maximum contrast for traffic neon lines |
| **OpenStreetMap Standard** | Standard Cartography | `https://tile.openstreetmap.org/{z}/{x}/{y}.png` | None (Attribution required) | Daylight urban street inspection |
| **Esri World Imagery** | Satellite Imagery | `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}` | None (Open access) | Terrain & highway infrastructure correlation |
| **MapTiler Streets** | Vector Raster Tiles | `https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key={KEY}` | `VITE_MAPTILER_API_KEY` | High-DPI street labels and administrative overlays |

---

## 2. Traffic Color Standards & Classification Heuristics

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

## 3. Traffic API Integration Architecture

The API client (`src/services/trafficApi.js`) and normalizer (`src/services/trafficNormalizer.js`) accept multiple response shapes:

### Supported Input Formats:

#### Format A: GeoJSON FeatureCollection
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "LineString",
        "coordinates": [[72.8402, 19.0544], [72.8520, 19.0833]]
      },
      "properties": {
        "segment_id": "mum_weh_01",
        "name": "Western Express Highway",
        "currentSpeed": 38,
        "freeFlowSpeed": 80,
        "delay": 420
      }
    }
  ]
}
```

#### Format B: REST Segment Array
```json
{
  "status": "success",
  "city": "mumbai",
  "segments": [
    {
      "id": "mum_weh_01",
      "roadName": "Western Express Highway",
      "code": "WEH",
      "coordinates": [[19.0544, 72.8402], [19.0833, 72.8520]],
      "currentSpeed": 45,
      "speedLimit": 80,
      "delay": 180
    }
  ]
}
```

---

## 4. Environment Variables

| Variable | Required | Default | Purpose |
| :--- | :--- | :--- | :--- |
| `VITE_MAPTILER_API_KEY` | Optional | `vfych9w2Nh5AGjIQ7jgL` | MapTiler vector basemap client key |
| `VITE_TRAFFIC_API_URL` | Optional | `""` | User-provided live traffic API endpoint URL |
| `VITE_TRAFFIC_API_KEY` | Optional | `""` | Bearer token / API key for traffic feed |
| `VITE_TRAFFIC_REFRESH_INTERVAL_MS` | Optional | `30000` | Polling frequency (30,000ms = 30s) |
| `VITE_DEFAULT_CITY` | Optional | `mumbai` | Initial selected city (`mumbai`, `nagpur`, `pune`) |

---

## 5. Security & Rate Limiting Guidelines

1. **Browser-Safe Keys Only**: Only public tile keys with HTTP referrer restrictions should exist in client `.env` files.
2. **Local Proxy Option**: If the live traffic provider requires a private secret key or lacks CORS headers, run a lightweight local proxy adapter (e.g. Express or Vite dev proxy) rather than exposing credentials in client code.
3. **Abuse Prevention**: Polling is throttled to 30s intervals by default to respect provider rate limits.
