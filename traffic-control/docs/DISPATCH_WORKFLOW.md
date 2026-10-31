# Module Two: Intelligent Traffic Police Dispatch Workflow

## 1. Overview
The **Police Dispatch Intelligence Agent** (`src/agents/police-dispatch/policeDispatchAgent.js`) evaluates verified traffic police resource datasets (`data/police/police_resources.json`) against detected Red Zones.

---

## 2. Resource Schema

Each resource record tracks:
- `unitCode`: Unit identifier (e.g. `TP-MUM-ANDH-01`).
- `policeStation`: Assigned traffic division.
- `officerInCharge`: Senior officer on duty.
- `location`: Last verified GPS coordinate and station name.
- `dutyStatus`: `ON_DUTY` | `OFF_DUTY`.
- `availabilityStatus`: `AVAILABLE` | `DEPLOYED` | `BUSY` | `OFF_DUTY` | `UNVERIFIED`.
- `deploymentType`: `MOTORCYCLE_PATROL` | `TRAFFIC_INTERCEPTOR` | `JUNCTION_POST` | `TOWING_UNIT`.
- `capability`: `CONGESTION_CLEARANCE` | `TRAFFIC_MANUAL_SIGNAL` | `ACCIDENT_INVESTIGATION`.

---

## 3. Decision Workflow Steps

```text
[ Red Zone Detected ]
         │
         ▼
[ Query Police Database for City Resources ]
         │
         ▼
[ Calculate Haversine Proximity & Road Travel ETA ]
         │
         ▼
[ Filter by Availability: 'AVAILABLE' only ]
         │
    ┌────┴───────────────────────────┐
    ▼                                ▼
(Unit Available within 15 km)   (No Unit Available)
    │                                │
    ▼                                ▼
Generate Recommendation:         Generate Resource Deficit Alert:
• Unit Code & Officer            • Nearest occupied unit & status
• Distance & Estimated ETA       • Escalate for inter-divisional
• Suggested manual intervention    re-allocation
    │                                │
    └────────────────┬───────────────┘
                     │
                     ▼
  [ Status: 'AWAITING_AUTHORIZATION' ]
                     │
                     ▼
  [ Operator Clicks 'Authorize Dispatch' ]
                     │
                     ▼
  [ Logged in Audit Trail with Timestamp ]
```

---

## 4. Safety Mandate

* The agent **never dispatches units automatically**.
* Recommendations remain in `AWAITING_AUTHORIZATION` until an authenticated operator authorizes the deployment.
