/**
 * Police Resource & Dispatch Store
 * Manages:
 * - Police units per city (Mumbai, Nagpur, Pune)
 * - Real-time availability & location tracking
 * - Full interactive dispatch lifecycle:
 *   AVAILABLE -> INITIATE DISPATCH -> APPROVED -> DISPATCHED -> EN_ROUTE -> ON_SITE -> COMPLETED / CANCELLED
 * - Response routing & destination visualization
 * - Dispatch history audit trail
 */

import { eventBus, EVENT_TYPES } from './eventBus.js';
import rawPoliceResources from '../../data/police/police_resources.json' with { type: 'json' };

class PoliceStore {
  constructor() {
    this.resources = new Map();
    this.dispatches = new Map(); // id -> dispatchRecord
    this.dispatchHistory = [];
    this.activeRoute = null; // currently highlighted dispatch route on map

    this._initializeResources();
  }

  _initializeResources() {
    // Clone raw police resources with deep copy
    rawPoliceResources.forEach((r) => {
      this.resources.set(r.id, {
        ...r,
        dutyStatus: r.dutyStatus || 'ON_DUTY',
        availabilityStatus: r.availabilityStatus || 'AVAILABLE',
        currentAssignment: r.currentAssignedIncident || null,
        isCustom: false,
        source: 'VERIFIED_DEPARTMENT',
      });
    });
  }

  /**
   * Get all resources for a city
   * @param {string} cityId 'mumbai' | 'nagpur' | 'pune'
   */
  getResourcesForCity(cityId) {
    const list = [];
    this.resources.forEach((r) => {
      if (r.cityId === cityId) {
        list.push({ ...r });
      }
    });
    return list;
  }

  /**
   * Add a new unit (for simulation & operational management)
   */
  addResource(unitData) {
    const id = unitData.id || `pol_custom_${Date.now()}`;
    const newUnit = {
      id,
      unitCode: unitData.unitCode || `TP-${unitData.cityId.toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
      cityId: unitData.cityId,
      officerInCharge: unitData.officerInCharge || 'Officer On Duty',
      policeStation: unitData.policeStation || 'Metropolitan Traffic Division',
      location: {
        name: unitData.locationName || 'Patrol Beat Station',
        coordinates: unitData.coordinates || [19.0760, 72.8777],
      },
      dutyStatus: unitData.dutyStatus || 'ON_DUTY',
      availabilityStatus: unitData.availabilityStatus || 'AVAILABLE',
      deploymentType: unitData.deploymentType || 'MOTORCYCLE_PATROL',
      capability: unitData.capability || 'CONGESTION_CLEARANCE',
      currentAssignment: null,
      lastLocationUpdate: new Date().toISOString(),
      isCustom: true,
      source: 'SIMULATED',
    };

    this.resources.set(id, newUnit);
    eventBus.publish(EVENT_TYPES.POLICE_AVAILABILITY_CHANGED, { unit: newUnit, action: 'ADDED' }, 'SIMULATED');
    return newUnit;
  }

  /**
   * Update resource status or location
   */
  updateResource(id, updates) {
    if (this.resources.has(id)) {
      const existing = this.resources.get(id);
      Object.assign(existing, updates, { lastLocationUpdate: new Date().toISOString() });
      this.resources.set(id, existing);
      eventBus.publish(EVENT_TYPES.POLICE_AVAILABILITY_CHANGED, { unit: existing, action: 'UPDATED' }, existing.source);
      return existing;
    }
    return null;
  }

  /**
   * Delete a simulated unit
   */
  deleteResource(id) {
    if (this.resources.has(id)) {
      this.resources.delete(id);
      eventBus.publish(EVENT_TYPES.POLICE_AVAILABILITY_CHANGED, { unitId: id, action: 'DELETED' }, 'SIMULATED');
    }
  }

  /**
   * Find nearest available units to a red zone coordinate
   */
  findNearestUnits(cityId, targetCoords, maxDistanceKm = 25) {
    const cityUnits = this.getResourcesForCity(cityId);
    const [tLat, tLng] = targetCoords;

    const evaluated = cityUnits.map((u) => {
      const coords = u.location?.coordinates || [tLat, tLng];
      const distKm = this._haversine(tLat, tLng, coords[0], coords[1]);
      const etaMinutes = Math.max(3, Math.round((distKm / 28) * 60)); // emergency patrol avg 28 km/h in city traffic

      return {
        ...u,
        distanceKm: +distKm.toFixed(2),
        etaMinutes,
      };
    });

    // Sort by proximity
    evaluated.sort((a, b) => a.distanceKm - b.distanceKm);

    return evaluated.filter((u) => u.distanceKm <= maxDistanceKm);
  }

  /**
   * Create a new dispatch request for an incident
   */
  createDispatch({ incident, unit, reason }) {
    const dispatchId = `disp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const [uLat, uLng] = unit.location?.coordinates || [19.0760, 72.8777];
    const [dLat, dLng] = incident.centerCoordinates || [19.0760, 72.8777];
    const distKm = +this._haversine(uLat, uLng, dLat, dLng).toFixed(2);
    const etaMins = Math.max(3, Math.round((distKm / 28) * 60));

    // Synthesize response route geometry
    const routeCoordinates = this._interpolateRoute([uLat, uLng], [dLat, dLng]);

    const dispatchRecord = {
      id: dispatchId,
      incidentId: incident.id,
      incidentName: incident.corridorName,
      incidentSeverity: incident.severity,
      cityId: incident.cityId,
      unitId: unit.id,
      unitCode: unit.unitCode,
      officerInCharge: unit.officerInCharge,
      policeStation: unit.policeStation,
      startLocation: {
        name: unit.location?.name || 'Base Division',
        coordinates: [uLat, uLng],
      },
      destinationLocation: {
        name: incident.corridorName,
        coordinates: [dLat, dLng],
      },
      routeCoordinates,
      distanceKm: distKm,
      etaMinutes: etaMins,
      status: 'APPROVED', // APPROVED -> DISPATCHED -> EN_ROUTE -> ON_SITE -> COMPLETED
      reason: reason || `Proximity dispatch (${distKm} km, ETA: ${etaMins}m) to clear ${incident.severityLabel}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      source: 'SIMULATED',
    };

    // Update unit status to DEPLOYED
    this.updateResource(unit.id, {
      availabilityStatus: 'DEPLOYED',
      currentAssignment: incident.id,
    });

    this.dispatches.set(dispatchId, dispatchRecord);
    this.dispatchHistory.unshift({ ...dispatchRecord, action: 'DISPATCH_APPROVED' });
    this.activeRoute = {
      dispatchId,
      coordinates: routeCoordinates,
      unitCode: unit.unitCode,
      destinationName: incident.corridorName,
    };

    eventBus.publish(EVENT_TYPES.DISPATCH_APPROVED, { dispatch: dispatchRecord }, 'SIMULATED');
    return dispatchRecord;
  }

  /**
   * Step through the dispatch lifecycle:
   * APPROVED -> DISPATCHED -> EN_ROUTE -> ON_SITE -> COMPLETED / CANCELLED
   */
  advanceDispatchStatus(dispatchId, newStatus) {
    const record = this.dispatches.get(dispatchId);
    if (!record) return null;

    record.status = newStatus;
    record.updatedAt = new Date().toISOString();

    if (newStatus === 'COMPLETED' || newStatus === 'CANCELLED') {
      // Free unit back to AVAILABLE
      this.updateResource(record.unitId, {
        availabilityStatus: 'AVAILABLE',
        currentAssignment: null,
      });

      if (this.activeRoute && this.activeRoute.dispatchId === dispatchId) {
        this.activeRoute = null;
      }
    }

    this.dispatchHistory.unshift({
      ...record,
      action: `STATUS_CHANGED_TO_${newStatus}`,
      timestamp: new Date().toISOString(),
    });

    eventBus.publish(EVENT_TYPES.UNIT_DISPATCHED, { dispatch: record, newStatus }, 'SIMULATED');
    return record;
  }

  getActiveRoute() {
    return this.activeRoute;
  }

  setActiveRoute(route) {
    this.activeRoute = route;
  }

  getDispatchesForCity(cityId) {
    const list = [];
    this.dispatches.forEach((d) => {
      if (d.cityId === cityId) {
        list.push({ ...d });
      }
    });
    return list;
  }

  getDispatchHistory(limit = 20) {
    return this.dispatchHistory.slice(0, limit);
  }

  _haversine(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  _interpolateRoute(start, end) {
    const [lat1, lng1] = start;
    const [lat2, lng2] = end;
    
    // Create realistic road detour path with 5 intermediate waypoints
    const midLat = (lat1 + lat2) / 2;
    const midLng = (lng1 + lng2) / 2;
    const offset = 0.004;

    return [
      [lat1, lng1],
      [lat1 * 0.75 + midLat * 0.25, lng1 * 0.75 + midLng * 0.25 + offset],
      [midLat, midLng + offset * 0.7],
      [midLat * 0.35 + lat2 * 0.65, midLng * 0.35 + lng2 * 0.65 - offset * 0.5],
      [lat2, lng2],
    ];
  }
}

export const policeStore = new PoliceStore();
