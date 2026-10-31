# Traffic Control Dashboard — Development Workflow

## 1. Quick Start

Run the following commands strictly from inside the `traffic-control/` directory:

```bash
# 1. Navigate to the isolated project
cd traffic-control

# 2. Copy the environment configuration template
cp .env.example .env.local

# 3. Install isolated dependencies
npm install

# 4. Start the development server
npm run dev
```

The application will start on **`http://localhost:5173`**.

---

## 2. Adding a New Metropolitan City

To add a 4th city (e.g. Nashik, Thane, or Chhatrapati Sambhajinagar):

1. **Register the City in `src/config/cities.js`**:
   ```javascript
   export const CITIES = {
     // ... existing mumbai, nagpur, pune
     nashik: {
       id: 'nashik',
       name: 'Nashik',
       nativeName: 'नाशिक',
       region: 'Nashik Metropolitan Region',
       center: [19.9975, 73.7898],
       defaultZoom: 12,
       minZoom: 10,
       maxZoom: 18,
       bounds: [[19.85, 73.65], [20.15, 73.95]],
       corridors: [
         { name: 'Mumbai Naka - Dwarka Circle', code: 'MND' },
         { name: 'Gangapur Road', code: 'GPR' },
       ],
       badgeColor: '#10b981',
     },
   };
   ```

2. **Add GPS Corridors in `src/services/corridorGeometry.js`**:
   ```javascript
   export const CITY_CORRIDOR_GEOMETRIES = {
     // ...
     nashik: [
       {
         id: 'nsk_gangapur_rd',
         name: 'Gangapur Road Corridor',
         corridorCode: 'GPR',
         type: 'Arterial',
         coordinates: [
           [19.9975, 73.7898],
           [20.0120, 73.7650],
         ],
         speedLimitKmH: 50,
       },
     ],
   };
   ```

The `CitySelector` and `TrafficMap` will automatically render the new city pill and bind its flyTo coordinates dynamically.

---

## 3. Integrating Live Traffic APIs

When the user provides their live traffic API URL and documentation:

1. **Option A: Via `.env.local`**:
   ```env
   VITE_TRAFFIC_API_URL=https://api.your-traffic-provider.com/v1/live
   VITE_TRAFFIC_API_KEY=your_optional_key_here
   ```

2. **Option B: Dynamically in the Running UI**:
   - Open the **Operations Panel** on the right.
   - Click **Configure URL** under the *Live Traffic API Feed* card.
   - Enter the live endpoint URL and click **Save & Connect**.

3. **Custom Adapter**:
   If the API uses unique field names, adjust `src/services/trafficNormalizer.js` to map its fields into the standardized segment schema.

---

## 4. Testing Map Layers Independently

You can verify vector rendering performance and color accuracy independently by inspecting the layer manager:

```javascript
import { TrafficMapLayerManager } from './src/services/trafficLayer';

// Verify clear and update operations
const manager = new TrafficMapLayerManager(mapInstance);
manager.renderSegments(testSegments);
```

---

## 5. Build & Production Bundle

To build the standalone bundle:

```bash
cd traffic-control
npm run build
npm run preview
```
