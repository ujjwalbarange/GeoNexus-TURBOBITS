# AI-Powered Traffic Control Agent — Architecture Specification

## 1. System Overview

The **Autonomous Traffic Control Agent** is an operational multi-module decision system engineered inside `traffic-control/`. It provides real-time metropolitan congestion detection, intelligent police dispatch recommendations, recurring bottleneck pattern analysis, road closure diversion routing, long-term urban bridge/infrastructure planning, and statutory government reporting across **Mumbai**, **Nagpur**, and **Pune**.

The agent is **not a generic conversational chatbot**; it is an evidence-based, deterministic decision engine with structured domain modules coordinated by a central orchestrator.

---

## 2. Central Agent Orchestrator Architecture

```text
                             ┌───────────────────────────────────┐
                             │    Traffic Control Orchestrator   │
                             │ (P0 Emergency to P4 Long-Term)   │
                             └─────────────────┬─────────────────┘
                                               │
    ┌──────────────────────────┬───────────────┴───────────────┬──────────────────────────┐
    ▼                          ▼                               ▼                          ▼
┌─────────────────────────┐ ┌─────────────────────────┐ ┌─────────────────────────┐ ┌─────────────────────────┐
│ Module 1:               │ │ Module 2:               │ │ Module 3:               │ │ Module 4:               │
│ Traffic Detection &     │ │ Police Dispatch         │ │ Recurring Pattern       │ │ Road Closures &         │
│ Red Zone Identification │ │ Intelligence Agent      │ │ Intelligence Agent      │ │ Route Optimization    │
└─────────────────────────┘ └─────────────────────────┘ └─────────────────────────┘ └─────────────────────────┘
                                               │
                               ┌───────────────┴───────────────┐
                               ▼                               ▼
                     ┌─────────────────────────┐     ┌─────────────────────────┐
                     │ Module 5:               │     │ Module 6:               │
                     │ Bridge & Infrastructure │     │ Government Reporting    │
                     │ Intelligence Agent      │     │ & Recommendation System │
                     └─────────────────────────┘     └─────────────────────────┘
```

---

## 3. Decision Priorities & Intervention Hierarchy

| Priority Level | Classification | Trigger Criteria | Action Protocol |
| :--- | :--- | :--- | :--- |
| **P0 — Emergency** | Verified Standstill / Road Blockage | Speed $< 10\%$ speed limit, delay $> 30$m, or physical closure | Immediate operator alert; auto-generates dispatch and emergency diversion dossiers |
| **P1 — Critical** | Severe Gridlock | Speed ratio $< 0.30$, severe back-propagation | Evaluates closest available police unit; generates dispatch recommendation awaiting operator approval |
| **P2 — High** | Active Construction / Road Restrictions | Barricaded lanes, metro works, or bridge load limits | Activates alternative diversion corridors avoiding congested zones |
| **P3 — Medium** | Recurring Peak Congestion | Chronic peak-hour queuing matching historical observations | Formulates operational adjustments (adaptive signal retiming, bus bay relocation) |
| **P4 — Long-Term** | Structural Infrastructure Deficit | Chronic intersection bottleneck exceeding surface capacity | Prepares preliminary urban grade-separation proposals (Flyovers, ROBs, Underpasses) |

---

## 4. Strict Safety & Ethical Rules

1. **Human-in-the-Loop Authorization**: The agent **only recommends** police deployment or emergency diversions. Official dispatches must pass through an authorized human operator.
2. **Zero Synthetic Hallucination**: Unmeasured roads are marked as `UNKNOWN` or `STANDBY`. Live speeds and travel times reflect genuine TomTom sensor data.
3. **API Quota Protection**: Data is strictly cached locally. Network queries only occur when the operator clicks the explicit **Refresh Traffic Data** button.
4. **Strict City Geofencing**: Map view and queries are locked to verified city boundaries (`maxBoundsViscosity: 1.0`).
