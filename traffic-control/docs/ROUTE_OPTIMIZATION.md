# Module Four: Road Construction & Route Optimization

## 1. Overview
The **Route Optimization Agent** (`src/agents/route-optimization/routeOptimizationAgent.js`) monitors temporary traffic restrictions and barricades from `data/restrictions/road_restrictions.json` alongside live Red Zones.

---

## 2. Active Restriction Categories

- **PARTIAL_LANE_CLOSURE**: Metro rail construction, road widening, bridge expansion joint repairs.
- **HEAVY_VEHICLE_RESTRICTION**: Height/weight barriers on aging railway overbridges.
- **COMPLETE_CLOSURE**: Emergency sinkhole repairs, VIP movement, or flood inundation.

---

## 3. Alternative Route Evaluation Algorithm

When a restriction or critical Red Zone is active:
1. Apply speed penalty or impedance to the restricted road segment.
2. Search connected parallel arterials (e.g. SV Road / Link Road for Western Express Highway).
3. Validate that alternative routes do not cross an active P0/P1 Red Zone.
4. Output delta distance (+km) and estimated travel time savings (minutes).
5. Mark verified diversion routes with status `VERIFIED_DIVERSION_OPEN`.
