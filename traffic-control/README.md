# 🚦 Standalone Traffic Control Dashboard — Mumbai, Nagpur & Pune

A dedicated, high-performance Traffic Operations Center and road-corridor visualization application for **Mumbai**, **Nagpur**, and **Pune**.

Developed as a strictly isolated standalone application within `traffic-control/`.

---

## ✨ Features

- **Isolated Architecture**: Operates independently with its own `package.json`, Vite build system, dependencies, and styles.
- **Interactive Multi-City Map**:
  - Seamless switching between **Mumbai** (`19.0760, 72.8777`), **Nagpur** (`21.1458, 79.0882`), and **Pune** (`18.5204, 73.8567`).
  - Native Leaflet hardware-accelerated canvas rendering (`preferCanvas: true`) for 60fps interaction.
  - Basemap styles: CARTO Dark Matter (Ops Theme), OpenStreetMap Standard, Esri Satellite Imagery, MapTiler Streets.
- **Live Traffic API Architecture**:
  - Modular `trafficApi.js` and `trafficNormalizer.js` ready to ingest external traffic endpoints (GeoJSON, TomTom, HERE, custom REST).
  - Configurable polling intervals (default: 30s) and manual refresh triggers.
  - Runtime endpoint configuration widget inside the UI.
- **Traffic Congestion Color Standards**:
  - 🟢 **Green** — Free-flowing traffic ($\ge 80\%$ speed limit)
  - 🟡 **Yellow** — Moderate traffic ($55\% - 79\%$)
  - 🟠 **Orange** — Heavy traffic ($30\% - 54\%$)
  - 🔴 **Red** — Severe congestion ($10\% - 29\%$)
  - 🔴 **Dark Red** — Standstill / Blocked road ($< 10\%$ or closure)
  - ⚪ **Slate Gray** — No Live Coverage / Awaiting feed
- **Zero Synthetic Deception**: Never manufactures fake traffic data; unmeasured corridors are marked as `UNKNOWN / Standby`.

---

## 🚀 Quick Start

```bash
# 1. Enter the project directory
cd traffic-control

# 2. Install dependencies
npm install

# 3. Start local development server
npm run dev
```

Visit [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📁 Project Structure

```text
traffic-control/
├── src/
│   ├── components/
│   │   ├── layout/       # Header, navigation, brand
│   │   ├── map/          # Interactive Leaflet map canvas
│   │   ├── traffic/      # Legends, status badges, corridor cards
│   │   ├── controls/     # City switcher, zoom, styles, fullscreen
│   │   └── dashboard/    # Sliding operations & telemetry panel
│   ├── pages/            # DashboardPage orchestrator
│   ├── services/         # API client, normalizer, Leaflet layer manager
│   ├── hooks/            # useTrafficData lifecycle & polling hook
│   ├── utils/            # Time and speed formatters
│   ├── config/           # Cities, coordinates, basemap providers
│   ├── styles/           # Vanilla CSS tokens & Leaflet dark overrides
│   ├── App.jsx           # Root application component
│   └── main.jsx          # React DOM entrypoint
├── public/               # Favicon and static assets
├── docs/                 # ARCHITECTURE.md, MAP_SERVICES.md, DEVELOPMENT_WORKFLOW.md
├── .env.example          # Environment variable template
├── package.json          # Isolated dependencies & scripts
├── vite.config.js        # Vite build configuration
├── index.html            # Standalone HTML container
└── README.md
```

---

## 🔒 Repository Isolation Guarantee

This project does **NOT**:
- Modify any files in the parent directory.
- Touch root dependencies or `package.json`.
- Expose private credentials in client code.
