/**
 * Traffic API Client Service
 * Live TomTom Traffic Integration + Generic REST/GeoJSON Adapter
 * 
 * Supports:
 * - TomTom Real-Time Traffic Flow Tile URL generation (whole-city raster overlay)
 * - TomTom Flow Segment Data queries for verified city road corridors
 * - TomTom Live Incident Details & Congestion Delay tracking
 * - Dynamic key & endpoint updates
 */

import { CITY_CORRIDOR_GEOMETRIES } from './corridorGeometry';

const TOMTOM_BASE_URL = 'https://api.tomtom.com';
const DEFAULT_TIMEOUT_MS = 10000;

// Representative GPS Probe points for verified city corridors
export const CITY_PROBE_POINTS = {
  mumbai: [
    { id: 'mum_weh', name: 'Western Express Highway (Andheri)', point: '19.1136,72.8697', corridorCode: 'WEH' },
    { id: 'mum_eeh', name: 'Eastern Express Highway (Ghatkopar)', point: '19.0830,72.9090', corridorCode: 'EEH' },
    { id: 'mum_bwsl', name: 'Bandra-Worli Sea Link', point: '19.0400,72.8250', corridorCode: 'BWSL' },
    { id: 'mum_efw', name: 'Eastern Freeway (Wadala)', point: '18.9950,72.8550', corridorCode: 'EFW' },
    { id: 'mum_sph', name: 'Sion-Panvel Highway (Mankhurd)', point: '19.0620,72.9550', corridorCode: 'SPH' },
  ],
  nagpur: [
    { id: 'ngp_wardha_rd', name: 'Wardha Road (Ajni Square)', point: '21.1080,79.0680', corridorCode: 'WRD' },
    { id: 'ngp_central_ave', name: 'Central Avenue (Mayo Hospital)', point: '21.1490,79.1020', corridorCode: 'CAR' },
    { id: 'ngp_amravati_rd', name: 'Amravati Road (Ravi Nagar)', point: '21.1480,79.0540', corridorCode: 'AMR' },
    { id: 'ngp_kamptee_rd', name: 'Kamptee Road (Gaddigodam)', point: '21.1720,79.0960', corridorCode: 'KMP' },
    { id: 'ngp_ring_rd', name: 'Outer Ring Road (Ambazari)', point: '21.1350,79.0250', corridorCode: 'ORR' },
  ],
  pune: [
    { id: 'pun_hinjawadi', name: 'Hinjawadi IT Corridor (Phase 1)', point: '18.5940,73.7420', corridorCode: 'HIN' },
    { id: 'pun_nagar_rd', name: 'Nagar Road (Viman Nagar)', point: '18.5620,73.9240', corridorCode: 'NGR' },
    { id: 'pun_mpe_conn', name: 'Mumbai-Pune Expressway Link (Dehu Rd)', point: '18.6650,73.7540', corridorCode: 'MPE' },
    { id: 'pun_solapur_rd', name: 'Pune-Solapur Road (Fatima Nagar)', point: '18.5050,73.9110', corridorCode: 'SOL' },
    { id: 'pun_bypass', name: 'Katraj-Dehu Road Bypass (Chandani Chowk)', point: '18.5130,73.7820', corridorCode: 'BYP' },
  ],
};

export class TrafficApiClient {
  constructor(apiKey = import.meta.env.VITE_TOMTOM_API_KEY || '') {
    this.apiKey = apiKey.trim();
    this.customEndpoint = (import.meta.env.VITE_TRAFFIC_API_URL || '').trim();
  }

  isConfigured() {
    return Boolean(this.apiKey || this.customEndpoint);
  }

  setApiKey(key) {
    this.apiKey = (key || '').trim();
  }

  setEndpoint(url) {
    this.customEndpoint = (url || '').trim();
  }

  /**
   * Returns TomTom Live Traffic Raster Flow Tile URL template for Leaflet
   * style: 'relative0' | 'relative' | 'absolute'
   */
  getTrafficTileUrl(style = 'relative0') {
    if (!this.apiKey) return null;
    return `https://api.tomtom.com/traffic/map/4/tile/flow/${style}/{z}/{x}/{y}.png?key=${this.apiKey}`;
  }

  /**
   * Fetch Live Traffic Flow Segments for specified city
   * @param {string} cityId 'mumbai' | 'nagpur' | 'pune'
   */
  async fetchLiveTraffic(cityId) {
    if (!this.isConfigured()) {
      return {
        success: false,
        status: 'AWAITING_API_KEY',
        city: cityId,
        timestamp: new Date().toISOString(),
        message: 'No TomTom API key or endpoint configured.',
        data: null,
      };
    }

    // 1. If custom generic endpoint is supplied, query that first
    if (this.customEndpoint) {
      try {
        const controller = new AbortController();
        const tid = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
        const res = await fetch(`${this.customEndpoint}?city=${cityId}`, { signal: controller.signal });
        clearTimeout(tid);
        if (res.ok) {
          const json = await res.json();
          return {
            success: true,
            status: 'OK',
            source: 'Custom Traffic API',
            city: cityId,
            timestamp: new Date().toISOString(),
            data: json,
          };
        }
      } catch (err) {
        console.warn('[TrafficAPI] Custom endpoint failed, falling back to TomTom:', err);
      }
    }

    // 2. Query TomTom Flow Segment API for City Corridors
    const probes = CITY_PROBE_POINTS[cityId] || [];
    const baseCorridors = CITY_CORRIDOR_GEOMETRIES[cityId] || [];

    try {
      const probePromises = probes.map(async (probe, idx) => {
        const url = `${TOMTOM_BASE_URL}/traffic/services/4/flowSegmentData/absolute/12/json?point=${probe.point}&unit=KMPH&key=${this.apiKey}`;
        const controller = new AbortController();
        const tid = setTimeout(() => controller.abort(), 6000);

        try {
          const res = await fetch(url, { signal: controller.signal });
          clearTimeout(tid);
          if (!res.ok) return null;
          const json = await res.json();
          const flow = json.flowSegmentData;
          if (!flow) return null;

          const baseGeo = baseCorridors.find((c) => c.corridorCode === probe.corridorCode);

          // Use real TomTom geometry if returned, otherwise fallback to our verified corridor polyline
          let coords = [];
          if (flow.coordinates && Array.isArray(flow.coordinates.coordinate)) {
            coords = flow.coordinates.coordinate.map((c) => [c.latitude, c.longitude]);
          }
          if (coords.length < 2 && baseGeo) {
            coords = baseGeo.coordinates;
          }

          return {
            id: probe.id,
            roadName: probe.name,
            code: probe.corridorCode,
            type: baseGeo?.type || 'Arterial',
            coordinates: coords,
            currentSpeed: flow.currentSpeed,
            freeFlowSpeed: flow.freeFlowSpeed,
            currentTravelTime: flow.currentTravelTime,
            freeFlowTravelTime: flow.freeFlowTravelTime,
            delay: Math.max(0, (flow.currentTravelTime || 0) - (flow.freeFlowTravelTime || 0)),
            confidence: flow.confidence,
            roadClosure: flow.roadClosure || false,
            timestamp: new Date().toISOString(),
          };
        } catch (e) {
          clearTimeout(tid);
          return null;
        }
      });

      const results = await Promise.all(probePromises);
      const validSegments = results.filter(Boolean);

      return {
        success: true,
        status: 'OK',
        source: 'TomTom Live Traffic Engine',
        city: cityId,
        timestamp: new Date().toISOString(),
        message: `Connected to TomTom Live Traffic Engine: ${validSegments.length} verified corridor probes measured.`,
        data: {
          segments: validSegments,
        },
      };
    } catch (err) {
      return {
        success: false,
        status: 'NETWORK_ERROR',
        city: cityId,
        timestamp: new Date().toISOString(),
        message: `TomTom API query error: ${err.message}`,
        data: null,
      };
    }
  }

  /**
   * Fetch Live Incidents from TomTom for City Bounding Box
   * @param {Array} bbox [minLat, minLon, maxLat, maxLon] or [[s, w], [n, e]]
   */
  async fetchLiveIncidents(bbox) {
    if (!this.apiKey) return { count: 0, incidents: [] };

    let minLat, minLon, maxLat, maxLon;
    if (Array.isArray(bbox) && bbox.length === 2 && Array.isArray(bbox[0])) {
      minLat = bbox[0][0];
      minLon = bbox[0][1];
      maxLat = bbox[1][0];
      maxLon = bbox[1][1];
    } else {
      return { count: 0, incidents: [] };
    }

    const url = `${TOMTOM_BASE_URL}/traffic/services/5/incidentDetails?bbox=${minLon},${minLat},${maxLon},${maxLat}&fields={incidents{type,geometry{type,coordinates},properties{iconCategory,magnitudeOfDelay,events{description,code},startTime,endTime,from,to,length}}}&language=en-GB&timeValidityFilter=present&key=${this.apiKey}`;

    try {
      const res = await fetch(url);
      if (!res.ok) return { count: 0, incidents: [] };
      const json = await res.json();
      return {
        count: json.incidents?.length || 0,
        incidents: json.incidents || [],
      };
    } catch (e) {
      return { count: 0, incidents: [] };
    }
  }
}

export const trafficApiClient = new TrafficApiClient();
