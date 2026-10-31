/**
 * Traffic Data Sandbox & Central Observation Engine
 * Supports:
 * - MODE A: LIVE (Real traffic observations)
 * - MODE B: SIMULATION (Fully editable manual observations & custom drawn segments)
 * - MODE C: HYBRID (Live background with simulated selective overrides)
 * 
 * Rules:
 * - Never overwrites original live API response.
 * - Maintains separate records for live vs simulated segments.
 * - Reactive state updates across Map, Detection, Dispatch, Intelligence, and Reports.
 */

import { eventBus, EVENT_TYPES } from './eventBus.js';
import { CITY_CORRIDOR_GEOMETRIES } from './corridorGeometry.js';
import { TRAFFIC_LEVELS } from '../config/mapConfig.js';
import { TrafficCacheManager } from './trafficCache.js';
import { trafficApiClient } from './trafficApi.js';
import { normalizeTrafficData } from './trafficNormalizer.js';

export const OPERATIONAL_MODES = {
  LIVE: 'LIVE',
  SIMULATION: 'SIMULATION',
  HYBRID: 'HYBRID',
};

// Default configurable detection thresholds (adjustable in sandbox)
export const DEFAULT_DETECTION_THRESHOLDS = {
  criticalRatio: 0.10, // Below 0.10 = Critical Standstill / Blocked
  severeRatio: 0.25,   // 0.10 - 0.25 = Severe Gridlock
  heavyRatio: 0.50,    // 0.25 - 0.50 = Heavy Congestion
  moderateRatio: 0.75, // 0.50 - 0.75 = Moderate Traffic
  standstillSpeedKmH: 4,
  criticalDelayMins: 15,
};

// Pre-packaged authentic simulation scenarios
export const BUILT_IN_SCENARIOS = {
  mumbai_peak_monsoon: {
    id: 'mumbai_peak_monsoon',
    title: 'Mumbai Monsoon Surge & WEH Standstill',
    cityId: 'mumbai',
    description: 'High precipitation waterlogging over King Circle nullah and heavy evening peak on Western Express Highway.',
    overrides: {
      'mum_weh_01': {
        currentSpeedKmH: 8,
        freeFlowSpeedKmH: 70,
        congestionLevel: 'BLOCKED',
        color: '#991b1b',
        delaySeconds: 1800,
        description: 'Waterlogging at Milan Subway slip road causing severe queueing back to Bandra.',
        incident: 'SEVERE_WATERLOGGING',
      },
      'mum_eeh_02': {
        currentSpeedKmH: 14,
        freeFlowSpeedKmH: 60,
        congestionLevel: 'SEVERE',
        color: '#dc2626',
        delaySeconds: 1200,
        description: 'Sion Circle bottleneck with commercial heavy vehicles stalled.',
        incident: 'JUNCTION_GRIDLOCK',
      },
    },
    simulationTimeHours: 1.5,
  },
  nagpur_freight_choke: {
    id: 'nagpur_freight_choke',
    title: 'Nagpur Outer Ring Road & Wardha Rd Freight Bottleneck',
    cityId: 'nagpur',
    description: 'Inter-state multi-axle freight convoys converging on Wardha Road interchange during shift change.',
    overrides: {
      'nag_wrd_01': {
        currentSpeedKmH: 9,
        freeFlowSpeedKmH: 60,
        congestionLevel: 'BLOCKED',
        color: '#991b1b',
        delaySeconds: 1500,
        description: 'Overloaded freight vehicle breakdown blocking two arterial lanes near MIHAN entrance.',
        incident: 'HEAVY_VEHICLE_BREAKDOWN',
      },
      'nag_orr_02': {
        currentSpeedKmH: 18,
        freeFlowSpeedKmH: 70,
        congestionLevel: 'SEVERE',
        color: '#dc2626',
        delaySeconds: 900,
        description: 'Queue spillover from grade separator ramp construction.',
        incident: 'ROAD_CONSTRUCTION_RESTRICTION',
      },
    },
    simulationTimeHours: 1.0,
  },
  pune_hinjawadi_standstill: {
    id: 'pune_hinjawadi_standstill',
    title: 'Pune Hinjawadi Phase-3 Shift-Change Standstill',
    cityId: 'pune',
    description: 'Mass private tech bus departure creating gridlock on Shivaji Chowk - Wakad flyover connector.',
    overrides: {
      'pun_hin_01': {
        currentSpeedKmH: 5,
        freeFlowSpeedKmH: 50,
        congestionLevel: 'BLOCKED',
        color: '#991b1b',
        delaySeconds: 2100,
        description: 'High-density private tech bus staging blocking rotary clearance.',
        incident: 'BUS_QUEUE_GRIDLOCK',
      },
      'pun_mpe_02': {
        currentSpeedKmH: 22,
        freeFlowSpeedKmH: 80,
        congestionLevel: 'SEVERE',
        color: '#dc2626',
        delaySeconds: 1100,
        description: 'Expressway toll plaza approach heavy vehicle queueing.',
        incident: 'TOLL_PLAZA_BACKLOG',
      },
    },
    simulationTimeHours: 2.0,
  },
};

class TrafficStore {
  constructor() {
    this.mode = OPERATIONAL_MODES.LIVE;
    this.thresholds = { ...DEFAULT_DETECTION_THRESHOLDS };
    
    // Per-city live data cache
    this.liveData = {
      mumbai: null,
      nagpur: null,
      pune: null,
    };

    // Per-city simulated segment overrides: Map<segmentId, simulatedProperties>
    this.simulatedOverrides = {
      mumbai: new Map(),
      nagpur: new Map(),
      pune: new Map(),
    };

    // Per-city custom user-drawn road segments: Array<customSegment>
    this.customDrawnSegments = {
      mumbai: [],
      nagpur: [],
      pune: [],
    };

    // Simulation playback engine state
    this.simulationState = {
      isRunning: false,
      speedMultiplier: 1, // 1x, 2x, 5x
      currentTimeHours: 1.0, // 0.0 to 3.0 hours
      maxTimeHours: 3.0,
      activeScenarioId: null,
    };

    this.timerId = null;

    // Load persisted state from localStorage if available
    this._loadPersistedState();
  }

  _loadPersistedState() {
    try {
      const savedMode = localStorage.getItem('traffic_ctrl_mode');
      if (savedMode && OPERATIONAL_MODES[savedMode]) {
        this.mode = savedMode;
      }
      const savedThresholds = localStorage.getItem('traffic_ctrl_thresholds');
      if (savedThresholds) {
        this.thresholds = { ...this.thresholds, ...JSON.parse(savedThresholds) };
      }
    } catch (e) {}
  }

  _persistState() {
    try {
      localStorage.setItem('traffic_ctrl_mode', this.mode);
      localStorage.setItem('traffic_ctrl_thresholds', JSON.stringify(this.thresholds));
    } catch (e) {}
  }

  get operationalMode() {
    return this.mode;
  }

  set operationalMode(newMode) {
    this.setMode(newMode);
  }

  getMode() {
    return this.mode;
  }

  setMode(newMode) {
    if (!OPERATIONAL_MODES[newMode]) return;
    this.mode = newMode;
    this._persistState();
    eventBus.publish(EVENT_TYPES.TRAFFIC_OBSERVATION_UPDATED, { mode: this.mode }, this.mode);
  }

  subscribe(callback) {
    const unsub1 = eventBus.subscribe(EVENT_TYPES.TRAFFIC_OBSERVATION_UPDATED, callback);
    const unsub2 = eventBus.subscribe(EVENT_TYPES.TRAFFIC_SEGMENT_CHANGED, callback);
    const unsub3 = eventBus.subscribe(EVENT_TYPES.RED_ZONE_CREATED, callback);
    return () => {
      unsub1();
      unsub2();
      unsub3();
    };
  }

  get simulationTimeHours() {
    return this.simulationState.currentTimeHours;
  }

  setSimulationTime(hours) {
    this.simulationState.currentTimeHours = Math.max(0, Math.min(this.simulationState.maxTimeHours, Number(hours)));
    eventBus.publish(EVENT_TYPES.TRAFFIC_OBSERVATION_UPDATED, { currentTimeHours: this.simulationState.currentTimeHours }, this.mode);
  }

  createCustomSegment(cityId, coordinates, props = {}) {
    return this.addCustomDrawnSegment(cityId, {
      coordinates,
      corridorName: props.name || props.corridorName || 'Custom Simulated Segment',
      currentSpeedKmH: props.currentSpeed ?? props.currentSpeedKmH ?? 12,
      freeFlowSpeedKmH: props.freeFlowSpeed ?? props.freeFlowSpeedKmH ?? 50,
      delaySeconds: (props.delayMinutes ? props.delayMinutes * 60 : props.delaySeconds) ?? 900,
      congestionLevel: props.severity || props.congestionLevel || 'SEVERE',
      isCustomSimulated: true,
      ...props,
    });
  }

  updateSegmentOverride(cityId, segmentId, overrides = {}) {
    const mapped = {
      ...overrides,
      currentSpeedKmH: overrides.currentSpeed ?? overrides.currentSpeedKmH,
      freeFlowSpeedKmH: overrides.freeFlowSpeed ?? overrides.freeFlowSpeedKmH,
      delaySeconds: (overrides.delayMinutes ? overrides.delayMinutes * 60 : overrides.delaySeconds),
      congestionLevel: overrides.severity || overrides.congestionLevel,
    };
    return this.updateSegmentCondition(cityId, segmentId, mapped);
  }

  createRedZone(cityId, segmentOrPoints, props = {}) {
    if (Array.isArray(segmentOrPoints)) {
      const seg = this.createCustomSegment(cityId, segmentOrPoints, {
        severity: 'CRITICAL',
        color: '#991b1b',
        ...props,
      });
      return {
        id: seg.id,
        sourceClassification: 'SIMULATED',
        severity: 'CRITICAL',
        corridorName: seg.corridorName,
        centerCoordinates: segmentOrPoints[0] || [19.076, 72.877],
      };
    }
    const rzId = this.createManualRedZone(cityId, segmentOrPoints || {
      coordinates: [[19.076, 72.877], [19.080, 72.885]],
      corridorName: props.name || 'Emergency Red Zone',
      ...props,
    });
    return {
      id: rzId,
      sourceClassification: 'SIMULATED',
      severity: props.severity || 'CRITICAL',
      corridorName: props.name || 'Emergency Red Zone',
      centerCoordinates: [19.076, 72.877],
    };
  }

  getThresholds() {
    return { ...this.thresholds };
  }

  setThresholds(newThresholds) {
    this.thresholds = { ...this.thresholds, ...newThresholds };
    this._persistState();
    eventBus.publish(EVENT_TYPES.TRAFFIC_OBSERVATION_UPDATED, { thresholds: this.thresholds }, this.mode);
  }

  /**
   * Ingest live observations array or full payload from TomTom API / useTrafficData hook
   */
  ingestLiveObservations(cityId, segmentsOrPayload) {
    if (!cityId) return;
    const payload = Array.isArray(segmentsOrPayload)
      ? { segments: segmentsOrPayload, isLiveFeed: true }
      : (segmentsOrPayload && segmentsOrPayload.segments ? segmentsOrPayload : { segments: [], isLiveFeed: true });

    this.liveData[cityId] = payload;
    TrafficCacheManager.set(cityId, payload);
    eventBus.publish(EVENT_TYPES.TRAFFIC_OBSERVATION_UPDATED, { cityId }, 'LIVE');
  }

  /**
   * Set live data received from TomTom API or root cache
   */
  setLiveData(cityId, data) {
    this.ingestLiveObservations(cityId, data);
  }

  /**
   * Retrieve effective segments for a city, merging Live, Simulation, and Hybrid rules
   */
  getEffectiveTrafficData(cityId) {
    const baselineCorridors = CITY_CORRIDOR_GEOMETRIES[cityId] || [];
    const liveObj = this.liveData[cityId] || TrafficCacheManager.get(cityId)?.data;
    const overrides = this.simulatedOverrides[cityId] || new Map();
    const customSegments = this.customDrawnSegments[cityId] || [];

    // Base segment list
    let baseSegments = [];
    if (liveObj && liveObj.segments && liveObj.segments.length > 0) {
      baseSegments = liveObj.segments.map((s) => ({ ...s }));
    } else {
      baseSegments = baselineCorridors.map((c) => ({
        id: c.id,
        corridorName: c.name,
        corridorCode: c.corridorCode,
        type: c.type,
        coordinates: c.coordinates,
        currentSpeedKmH: Math.round(c.speedLimitKmH * 0.8), // realistic default
        freeFlowSpeedKmH: c.speedLimitKmH,
        speedRatio: 0.80,
        delaySeconds: 120,
        congestionLevel: 'FREE_FLOW',
        color: '#16a34a',
        glowColor: 'rgba(22, 163, 74, 0.4)',
        strokeWeight: 4,
        description: 'Standard baseline municipal corridor flow',
        lastUpdated: new Date().toISOString(),
        isLive: false,
        source: 'BASELINE',
      }));
    }

    // Apply Mode logic
    let processedSegments = [];

    if (this.mode === OPERATIONAL_MODES.LIVE) {
      // MODE A: Strictly live data. Zero simulated overrides.
      processedSegments = baseSegments.map((s) => ({
        ...s,
        source: s.isLive ? 'LIVE' : 'BASELINE',
      }));
    } else if (this.mode === OPERATIONAL_MODES.SIMULATION) {
      // MODE B: Full Simulation. All simulated overrides applied; custom segments included.
      processedSegments = baseSegments.map((s) => {
        if (overrides.has(s.id)) {
          const ovr = overrides.get(s.id);
          return this._applyOverrideToSegment(s, ovr, 'SIMULATED');
        }
        return {
          ...s,
          source: 'SIMULATED',
        };
      });

      // Append user-drawn custom segments
      customSegments.forEach((cs) => {
        if (cs.enabled !== false) {
          processedSegments.push({ ...cs, source: 'SIMULATED' });
        }
      });
    } else if (this.mode === OPERATIONAL_MODES.HYBRID) {
      // MODE C: Hybrid. Live segments, with selective simulated overrides distinctly marked.
      processedSegments = baseSegments.map((s) => {
        if (overrides.has(s.id)) {
          const ovr = overrides.get(s.id);
          return this._applyOverrideToSegment(s, ovr, 'SIMULATED_OVERRIDE');
        }
        return {
          ...s,
          source: s.isLive ? 'LIVE' : 'BASELINE',
        };
      });

      // In hybrid mode, custom drawn segments are also marked as simulated overrides
      customSegments.forEach((cs) => {
        if (cs.enabled !== false) {
          processedSegments.push({ ...cs, source: 'SIMULATED_OVERRIDE' });
        }
      });
    }

    // Calculate aggregated metrics
    const measured = processedSegments.filter((s) => s.currentSpeedKmH !== null && s.currentSpeedKmH !== undefined);
    const avgSpeed = measured.length > 0
      ? +(measured.reduce((acc, s) => acc + s.currentSpeedKmH, 0) / measured.length).toFixed(1)
      : null;

    const avgRatio = measured.length > 0
      ? +(measured.reduce((acc, s) => acc + (s.speedRatio || 1), 0) / measured.length).toFixed(2)
      : 1.0;

    const cityCongestionIndex = Math.max(0, Math.min(100, Math.round((1 - avgRatio) * 100)));

    return {
      cityId,
      mode: this.mode,
      isLiveFeed: this.mode === OPERATIONAL_MODES.LIVE,
      status: this.mode,
      statusMessage: `Active Mode: ${this.mode} (${processedSegments.length} monitored road links)`,
      totalSegments: processedSegments.length,
      measuredSegments: measured.length,
      averageSpeedKmH: avgSpeed,
      cityCongestionIndex,
      lastUpdated: new Date().toISOString(),
      segments: processedSegments,
    };
  }

  _applyOverrideToSegment(baseSeg, override, sourceLabel) {
    const ffSpeed = override.freeFlowSpeedKmH ?? baseSeg.freeFlowSpeedKmH ?? 60;
    const curSpeed = override.currentSpeedKmH ?? baseSeg.currentSpeedKmH ?? ffSpeed;
    const ratio = ffSpeed > 0 ? +(curSpeed / ffSpeed).toFixed(2) : 1.0;
    const delaySec = override.delaySeconds ?? (curSpeed < ffSpeed ? Math.round(((ffSpeed - curSpeed) / ffSpeed) * 1200) : 0);

    // Determine level config based on ratio or explicit level
    let levelConfig = TRAFFIC_LEVELS.FREE_FLOW;
    if (override.congestionLevel) {
      levelConfig = TRAFFIC_LEVELS[override.congestionLevel] || TRAFFIC_LEVELS.UNKNOWN;
    } else if (ratio < this.thresholds.criticalRatio || curSpeed <= this.thresholds.standstillSpeedKmH) {
      levelConfig = TRAFFIC_LEVELS.BLOCKED;
    } else if (ratio < this.thresholds.severeRatio) {
      levelConfig = TRAFFIC_LEVELS.SEVERE;
    } else if (ratio < this.thresholds.heavyRatio) {
      levelConfig = TRAFFIC_LEVELS.HEAVY;
    } else if (ratio < this.thresholds.moderateRatio) {
      levelConfig = TRAFFIC_LEVELS.MODERATE;
    }

    return {
      ...baseSeg,
      currentSpeedKmH: curSpeed,
      freeFlowSpeedKmH: ffSpeed,
      speedRatio: ratio,
      delaySeconds: delaySec,
      congestionLevel: levelConfig.level,
      color: levelConfig.color,
      glowColor: levelConfig.glowColor,
      strokeWeight: levelConfig.strokeWeight,
      description: override.description || baseSeg.description || levelConfig.description,
      incident: override.incident || null,
      source: sourceLabel,
      isLive: false,
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Update or create simulated properties for a specific road corridor
   */
  updateSegmentCondition(cityId, segmentId, properties) {
    // If it's a custom drawn segment, update it directly
    const customList = this.customDrawnSegments[cityId] || [];
    const customIdx = customList.findIndex((s) => s.id === segmentId);
    if (customIdx !== -1) {
      customList[customIdx] = {
        ...customList[customIdx],
        ...properties,
        congestionLevel: properties.congestionLevel || properties.severity || customList[customIdx].congestionLevel,
        currentSpeedKmH: properties.currentSpeedKmH ?? customList[customIdx].currentSpeedKmH,
        lastUpdated: new Date().toISOString(),
      };
      this.customDrawnSegments[cityId] = customList;
    }

    const map = this.simulatedOverrides[cityId] || new Map();
    const existing = map.get(segmentId) || {};
    const updated = { ...existing, ...properties, updatedAt: new Date().toISOString() };
    map.set(segmentId, updated);
    this.simulatedOverrides[cityId] = map;

    eventBus.publish(EVENT_TYPES.TRAFFIC_SEGMENT_CHANGED, { cityId, segmentId, properties: updated }, 'SIMULATED');
    eventBus.publish(EVENT_TYPES.TRAFFIC_OBSERVATION_UPDATED, { cityId }, this.mode);
  }

  /**
   * Reset condition override for a specific corridor
   */
  resetSegmentCondition(cityId, segmentId) {
    const map = this.simulatedOverrides[cityId];
    if (map && map.has(segmentId)) {
      map.delete(segmentId);
      eventBus.publish(EVENT_TYPES.TRAFFIC_SEGMENT_CHANGED, { cityId, segmentId, action: 'RESET' }, 'SIMULATED');
      eventBus.publish(EVENT_TYPES.TRAFFIC_OBSERVATION_UPDATED, { cityId }, this.mode);
    }
  }

  /**
   * Add a custom user-drawn simulated traffic line
   */
  addCustomDrawnSegment(cityId, segmentData) {
    const custom = {
      id: segmentData.id || `custom_seg_${cityId}_${Date.now()}`,
      corridorName: segmentData.corridorName || 'Custom Simulated Segment',
      corridorCode: segmentData.corridorCode || 'SIM',
      type: 'Custom Simulated Arterial',
      coordinates: segmentData.coordinates || [],
      currentSpeedKmH: segmentData.currentSpeedKmH ?? 12,
      freeFlowSpeedKmH: segmentData.freeFlowSpeedKmH ?? 50,
      speedRatio: segmentData.freeFlowSpeedKmH ? +(segmentData.currentSpeedKmH / segmentData.freeFlowSpeedKmH).toFixed(2) : 0.24,
      delaySeconds: segmentData.delaySeconds ?? 900,
      congestionLevel: segmentData.congestionLevel || 'SEVERE',
      color: segmentData.color || '#ef4444',
      glowColor: segmentData.glowColor || 'rgba(239, 68, 68, 0.4)',
      strokeWeight: 5,
      description: segmentData.description || 'Manually drawn simulated traffic segment',
      lastUpdated: new Date().toISOString(),
      isLive: false,
      source: 'SIMULATED_CUSTOM',
      isCustomSimulated: segmentData.isCustomSimulated ?? true,
      enabled: true,
    };

    if (!this.customDrawnSegments[cityId]) {
      this.customDrawnSegments[cityId] = [];
    }
    this.customDrawnSegments[cityId].push(custom);

    eventBus.publish(EVENT_TYPES.TRAFFIC_SEGMENT_CHANGED, { cityId, segment: custom, action: 'CREATED' }, 'SIMULATED');
    eventBus.publish(EVENT_TYPES.TRAFFIC_OBSERVATION_UPDATED, { cityId }, this.mode);

    return custom;
  }

  /**
   * Delete a custom user-drawn simulated segment
   */
  deleteCustomSegment(cityId, segmentId) {
    if (this.customDrawnSegments[cityId]) {
      this.customDrawnSegments[cityId] = this.customDrawnSegments[cityId].filter((s) => s.id !== segmentId);
      eventBus.publish(EVENT_TYPES.TRAFFIC_SEGMENT_CHANGED, { cityId, segmentId, action: 'DELETED' }, 'SIMULATED');
      eventBus.publish(EVENT_TYPES.TRAFFIC_OBSERVATION_UPDATED, { cityId }, this.mode);
    }
  }

  /**
   * 1-Click "Create Red Zone" for a corridor or coordinate set
   */
  createManualRedZone(cityId, segmentIdOrData) {
    let segmentId = typeof segmentIdOrData === 'string' ? segmentIdOrData : segmentIdOrData.id;
    
    // If it's a new custom geometry
    if (typeof segmentIdOrData === 'object' && segmentIdOrData.coordinates) {
      const custom = this.addCustomDrawnSegment(cityId, {
        ...segmentIdOrData,
        congestionLevel: 'BLOCKED',
        currentSpeedKmH: 4,
        freeFlowSpeedKmH: 60,
        color: '#991b1b',
        delaySeconds: 1800,
      });
      segmentId = custom.id;
    } else {
      // Existing segment: override to BLOCKED
      this.updateSegmentCondition(cityId, segmentId, {
        congestionLevel: 'BLOCKED',
        currentSpeedKmH: 4,
        color: '#991b1b',
        delaySeconds: 1800,
        incident: 'MANUALLY_CREATED_RED_ZONE',
        description: 'Critical congestion corridor designated by operator.',
      });
    }

    eventBus.publish(EVENT_TYPES.RED_ZONE_CREATED, { cityId, segmentId }, 'SIMULATED');
    return segmentId;
  }

  /**
   * Load a complete simulation scenario
   */
  loadScenario(scenarioId) {
    const scenario = BUILT_IN_SCENARIOS[scenarioId];
    if (!scenario) return false;

    const cityId = scenario.cityId;
    this.mode = OPERATIONAL_MODES.SIMULATION;
    this.simulationState.activeScenarioId = scenarioId;
    this.simulationState.currentTimeHours = scenario.simulationTimeHours || 1.0;

    // Apply scenario overrides
    const map = new Map();
    Object.entries(scenario.overrides).forEach(([segId, props]) => {
      map.set(segId, props);
    });
    this.simulatedOverrides[cityId] = map;

    this._persistState();
    eventBus.publish(EVENT_TYPES.TRAFFIC_OBSERVATION_UPDATED, { cityId, scenarioId }, 'SIMULATED');
    return true;
  }

  /**
   * Export all simulated overrides and custom segments as JSON
   */
  exportScenario(cityId, scenarioName = 'Custom Traffic Scenario') {
    const overridesObj = {};
    const map = this.simulatedOverrides[cityId] || new Map();
    map.forEach((val, key) => {
      overridesObj[key] = val;
    });

    const exportData = {
      version: '1.0',
      title: scenarioName,
      cityId,
      exportedAt: new Date().toISOString(),
      mode: this.mode,
      thresholds: this.thresholds,
      overrides: overridesObj,
      customSegments: this.customDrawnSegments[cityId] || [],
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Import scenario from JSON string
   */
  importScenario(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      const cityId = data.cityId || 'mumbai';

      if (data.overrides) {
        const map = new Map();
        Object.entries(data.overrides).forEach(([k, v]) => {
          map.set(k, v);
        });
        this.simulatedOverrides[cityId] = map;
      }

      if (Array.isArray(data.customSegments)) {
        this.customDrawnSegments[cityId] = data.customSegments;
      }

      if (data.thresholds) {
        this.thresholds = { ...this.thresholds, ...data.thresholds };
      }

      this.mode = OPERATIONAL_MODES.SIMULATION;
      this._persistState();
      eventBus.publish(EVENT_TYPES.TRAFFIC_OBSERVATION_UPDATED, { cityId }, 'SIMULATED');
      return { success: true, message: `Imported scenario for ${cityId.toUpperCase()}` };
    } catch (e) {
      return { success: false, message: e.message };
    }
  }

  /**
   * Reset all simulation data for a city
   */
  resetAllSimulation(cityId) {
    if (cityId) {
      this.simulatedOverrides[cityId] = new Map();
      this.customDrawnSegments[cityId] = [];
    } else {
      this.simulatedOverrides = { mumbai: new Map(), nagpur: new Map(), pune: new Map() };
      this.customDrawnSegments = { mumbai: [], nagpur: [], pune: [] };
    }
    this.simulationState.activeScenarioId = null;
    this.simulationState.currentTimeHours = 1.0;
    eventBus.publish(EVENT_TYPES.TRAFFIC_OBSERVATION_UPDATED, { cityId }, this.mode);
  }

  /**
   * Simulation Playback Engine: Starts gradual progression of congestion
   */
  startSimulation(cityId, onTick) {
    if (this.simulationState.isRunning) return;
    this.simulationState.isRunning = true;

    this.timerId = setInterval(() => {
      this.simulationState.currentTimeHours += (0.05 * this.simulationState.speedMultiplier);
      if (this.simulationState.currentTimeHours >= this.simulationState.maxTimeHours) {
        this.simulationState.currentTimeHours = 0.5; // loop back
      }

      // Progressively deteriorate or alleviate traffic based on time curve
      const factor = Math.sin((this.simulationState.currentTimeHours / this.simulationState.maxTimeHours) * Math.PI);
      const map = this.simulatedOverrides[cityId] || new Map();
      
      // If no overrides exist yet, simulate dynamic flow on first 2 corridors
      const corridors = CITY_CORRIDOR_GEOMETRIES[cityId] || [];
      if (map.size === 0 && corridors.length > 0) {
        const primary = corridors[0];
        const secondary = corridors[1] || corridors[0];
        
        const simSpeed1 = Math.max(5, Math.round(primary.speedLimitKmH * (1 - factor * 0.85)));
        this.updateSegmentCondition(cityId, primary.id, {
          currentSpeedKmH: simSpeed1,
          freeFlowSpeedKmH: primary.speedLimitKmH,
          delaySeconds: Math.round(factor * 1800),
          description: `Dynamic peak wave at T=${this.simulationState.currentTimeHours.toFixed(1)}h`,
        });
      }

      if (onTick) onTick(this.simulationState.currentTimeHours);
    }, 1000);
  }

  pauseSimulation() {
    this.simulationState.isRunning = false;
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  setSimulationSpeed(multiplier) {
    this.simulationState.speedMultiplier = multiplier;
  }
}

export const trafficStore = new TrafficStore();
