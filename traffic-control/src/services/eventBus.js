/**
 * Central Event-Driven Architecture for Sentinel Traffic Control
 * Coordinates real-time updates between:
 * Traffic Sandbox, Red Zone Detection, Police Dispatch, Traffic Intelligence,
 * Infrastructure Planning, and Government Reports.
 */

class TrafficEventBus {
  constructor() {
    this.listeners = new Map();
    this.eventHistory = [];
    this.maxHistory = 100;
  }

  /**
   * Subscribe to an event
   * @param {string} eventType
   * @param {Function} callback
   * @returns {Function} unsubscribe function
   */
  subscribe(eventType, callback) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType).add(callback);

    return () => {
      const set = this.listeners.get(eventType);
      if (set) {
        set.delete(callback);
        if (set.size === 0) {
          this.listeners.delete(eventType);
        }
      }
    };
  }

  /**
   * Publish a structured system event
   * @param {string} eventType
   * @param {Object} payload
   * @param {string} source 'LIVE' | 'SIMULATED' | 'HYBRID' | 'SYSTEM'
   */
  publish(eventType, payload = {}, source = 'SYSTEM') {
    const event = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      type: eventType,
      timestamp: new Date().toISOString(),
      source,
      payload,
    };

    this.eventHistory.unshift(event);
    if (this.eventHistory.length > this.maxHistory) {
      this.eventHistory.pop();
    }

    const set = this.listeners.get(eventType);
    if (set) {
      set.forEach((cb) => {
        try {
          cb(event);
        } catch (err) {
          console.error(`[EventBus] Error in handler for ${eventType}:`, err);
        }
      });
    }

    // Also trigger wildcard subscribers
    const wildcards = this.listeners.get('*');
    if (wildcards) {
      wildcards.forEach((cb) => {
        try {
          cb(event);
        } catch (err) {
          console.error(`[EventBus] Error in wildcard handler:`, err);
        }
      });
    }

    return event;
  }

  getHistory(limit = 20) {
    return this.eventHistory.slice(0, limit);
  }

  clearHistory() {
    this.eventHistory = [];
  }
}

export const eventBus = new TrafficEventBus();

// Standard Event Type Definitions
export const EVENT_TYPES = {
  TRAFFIC_OBSERVATION_UPDATED: 'TRAFFIC_OBSERVATION_UPDATED',
  TRAFFIC_SEGMENT_CHANGED: 'TRAFFIC_SEGMENT_CHANGED',
  RED_ZONE_CREATED: 'RED_ZONE_CREATED',
  RED_ZONE_UPDATED: 'RED_ZONE_UPDATED',
  RED_ZONE_RESOLVED: 'RED_ZONE_RESOLVED',
  POLICE_AVAILABILITY_CHANGED: 'POLICE_AVAILABILITY_CHANGED',
  DISPATCH_RECOMMENDED: 'DISPATCH_RECOMMENDED',
  DISPATCH_APPROVED: 'DISPATCH_APPROVED',
  UNIT_DISPATCHED: 'UNIT_DISPATCHED',
  UNIT_ARRIVED: 'UNIT_ARRIVED',
  DISPATCH_COMPLETED: 'DISPATCH_COMPLETED',
  ROAD_RESTRICTION_CREATED: 'ROAD_RESTRICTION_CREATED',
  ROUTE_RECOMMENDATION_CREATED: 'ROUTE_RECOMMENDATION_CREATED',
  INTELLIGENCE_REPORT_GENERATED: 'INTELLIGENCE_REPORT_GENERATED',
  INFRASTRUCTURE_PROPOSAL_SELECTED: 'INFRASTRUCTURE_PROPOSAL_SELECTED',
  GOVERNMENT_REPORT_GENERATED: 'GOVERNMENT_REPORT_GENERATED',
  THEME_CHANGED: 'THEME_CHANGED',
};
