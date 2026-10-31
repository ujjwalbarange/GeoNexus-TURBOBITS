/**
 * Map Configuration & Tile Providers for Traffic Control Dashboard
 */

export const MAP_PROVIDERS = [
  {
    id: 'carto-dark',
    name: 'Dark Matter (Ops Theme)',
    shortName: 'Dark Ops',
    icon: '🌙',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    subdomains: 'abcd',
    maxZoom: 19,
    attribution: '&copy; <a href="https://carto.com/" target="_blank" rel="noreferrer">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
  },
  {
    id: 'osm-standard',
    name: 'OpenStreetMap Standard',
    shortName: 'Street OSM',
    icon: '🗺️',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    subdomains: 'abc',
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
  },
  {
    id: 'esri-satellite',
    name: 'Esri Satellite Imagery',
    shortName: 'Satellite',
    icon: '🛰️',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    maxZoom: 18,
    attribution: 'Tiles &copy; Esri, Maxar, Earthstar Geographics',
  },
  {
    id: 'maptiler-streets',
    name: 'MapTiler Streets',
    shortName: 'Vector',
    icon: '📍',
    url: `https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${import.meta.env.VITE_MAPTILER_API_KEY || 'vfych9w2Nh5AGjIQ7jgL'}`,
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.maptiler.com/" target="_blank" rel="noreferrer">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>',
  },
];

export const DEFAULT_MAP_PROVIDER_ID = 'carto-dark';

/**
 * Traffic Congestion Severity Standards
 * Defined strictly according to user design specifications.
 */
export const TRAFFIC_LEVELS = {
  FREE_FLOW: {
    level: 'FREE_FLOW',
    label: 'Free-flowing',
    color: '#10b981', // Green
    glowColor: 'rgba(16, 185, 129, 0.4)',
    strokeWeight: 4.5,
    minSpeedRatio: 0.8, // Actual speed >= 80% free-flow speed
    description: 'Smooth, uninhibited traffic flow at or near speed limit',
  },
  MODERATE: {
    level: 'MODERATE',
    label: 'Moderate',
    color: '#facc15', // Yellow
    glowColor: 'rgba(250, 204, 21, 0.4)',
    strokeWeight: 5,
    minSpeedRatio: 0.55, // 55% - 79% free-flow speed
    description: 'Noticeable vehicle buildup; minor intermittent delays',
  },
  HEAVY: {
    level: 'HEAVY',
    label: 'Heavy',
    color: '#f97316', // Orange
    glowColor: 'rgba(249, 115, 22, 0.5)',
    strokeWeight: 5.5,
    minSpeedRatio: 0.3, // 30% - 54% free-flow speed
    description: 'Significant queueing, start-stop conditions',
  },
  SEVERE: {
    level: 'SEVERE',
    label: 'Severe Congestion',
    color: '#ef4444', // Red
    glowColor: 'rgba(239, 68, 68, 0.6)',
    strokeWeight: 6.5,
    minSpeedRatio: 0.1, // 10% - 29% free-flow speed
    description: 'Critical gridlock with prolonged stationary intervals',
  },
  BLOCKED: {
    level: 'BLOCKED',
    label: 'Extremely Congested / Blocked',
    color: '#991b1b', // Dark Red
    glowColor: 'rgba(153, 27, 27, 0.8)',
    strokeWeight: 7,
    minSpeedRatio: 0, // < 10% speed or complete standstill / closure
    description: 'Standstill or physical road blockage / hazard closure',
  },
  UNKNOWN: {
    level: 'UNKNOWN',
    label: 'No Live Coverage',
    color: '#64748b', // Slate gray
    glowColor: 'rgba(100, 116, 139, 0.2)',
    strokeWeight: 3,
    minSpeedRatio: null,
    description: 'Live telemetry currently unavailable for this corridor',
  },
};
