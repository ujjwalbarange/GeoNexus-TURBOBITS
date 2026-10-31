# Module One: Live Traffic Detection & Red Zone Identification

## 1. Overview
The **Traffic Detection Agent** (`src/agents/traffic-detection/redZoneDetector.js`) continuously monitors incoming normalized corridor speeds, travel times, and incident telemetry.

---

## 2. Red Zone Identification Heuristics

A road segment is classified as a **Red Zone** if:
1. `congestionLevel === 'SEVERE'` or `congestionLevel === 'BLOCKED'`.
2. Speed Ratio ($\frac{\text{Current Speed}}{\text{Free-Flow Speed Limit}}$) $\le 0.35$.
3. Current measured speed $\le 15$ km/h on an arterial or expressway.

### Severity Tiers:
- **RED**: Severe traffic gridlock ($0.10 \le \text{Speed Ratio} < 0.35$). Queue delay $> 10$ mins.
- **DARK RED**: Critical standstill or physical blockage ($\text{Speed Ratio} < 0.10$ or speed $\le 2$ km/h). Queue delay $> 25$ mins.

---

## 3. Red Zone Output Schema

```json
{
  "id": "rz_mumbai_weh_1",
  "corridorName": "Western Express Highway (Andheri)",
  "corridorCode": "WEH",
  "cityId": "mumbai",
  "severity": "DARK_RED",
  "severityLabel": "Critical Standstill / Road Blockage",
  "color": "#991b1b",
  "currentSpeedKmH": 8,
  "freeFlowSpeedKmH": 80,
  "speedRatio": 0.10,
  "delayMinutes": 28,
  "affectedLengthKm": 3.6,
  "congestionStartedAt": "2026-10-31T13:40:00Z",
  "durationMinutes": 28,
  "coordinates": [[19.1136, 72.8697], ...],
  "requiresIntervention": true,
  "interventionStatus": "PENDING_EVALUATION"
}
```

---

## 4. Map Visualization

- Bounded corridor halos pulsing in `#ef4444` (Severe) or `#991b1b` (Critical Blockage).
- Interactive tooltip displaying real queue delay and current speed.
- Click to open the **Agent Control Center** for immediate police dispatch recommendation inspection.
