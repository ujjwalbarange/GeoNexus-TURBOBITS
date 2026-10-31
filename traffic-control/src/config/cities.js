/**
 * City Configurations for Traffic Control Dashboard
 * Precision coordinates, bounds, default zoom levels, and key corridors
 * for Mumbai, Nagpur, and Pune metropolitan regions.
 */

export const CITIES = {
  mumbai: {
    id: 'mumbai',
    name: 'Mumbai',
    nativeName: 'मुंबई',
    region: 'Mumbai Metropolitan Region (MMR)',
    center: [19.0760, 72.8777],
    defaultZoom: 12,
    minZoom: 10,
    maxZoom: 18,
    bounds: [
      [18.8800, 72.7400], // Southwest
      [19.3200, 73.0500], // Northeast
    ],
    corridors: [
      { name: 'Western Express Highway (WEH)', code: 'WEH' },
      { name: 'Eastern Express Highway (EEH)', code: 'EEH' },
      { name: 'Bandra-Worli Sea Link (BWSL)', code: 'BWSL' },
      { name: 'Sion-Panvel Highway', code: 'SPH' },
      { name: 'SV Road / Link Road', code: 'SVR' },
      { name: 'Eastern Freeway', code: 'EFW' },
    ],
    badgeColor: '#38bdf8', // Sky blue
  },
  nagpur: {
    id: 'nagpur',
    name: 'Nagpur',
    nativeName: 'नागपूर',
    region: 'Nagpur Metropolitan Region (NMRDA)',
    center: [21.1458, 79.0882],
    defaultZoom: 12,
    minZoom: 10,
    maxZoom: 18,
    bounds: [
      [20.9800, 78.9200], // Southwest
      [21.2800, 79.2500], // Northeast
    ],
    corridors: [
      { name: 'Wardha Road Corridor', code: 'WRD' },
      { name: 'Outer Ring Road (ORR)', code: 'ORR' },
      { name: 'Amravati Road (NH-53)', code: 'AMR' },
      { name: 'Central Avenue (CA)', code: 'CAR' },
      { name: 'Kamptee Road', code: 'KMP' },
      { name: 'Hingna Industrial Road', code: 'HNG' },
    ],
    badgeColor: '#fb923c', // Orange
  },
  pune: {
    id: 'pune',
    name: 'Pune',
    nativeName: 'पुणे',
    region: 'Pune Metropolitan Region (PMRDA)',
    center: [18.5204, 73.8567],
    defaultZoom: 12,
    minZoom: 10,
    maxZoom: 18,
    bounds: [
      [18.3800, 73.6800], // Southwest
      [18.6600, 74.0200], // Northeast
    ],
    corridors: [
      { name: 'Mumbai-Pune Expressway Connector', code: 'MPE' },
      { name: 'Hinjawadi IT Corridor / Wakad', code: 'HIN' },
      { name: 'Pune-Solapur Highway (Hadapsar)', code: 'SOL' },
      { name: 'Nagar Road (Kalyani Nagar / Viman Nagar)', code: 'NGR' },
      { name: 'Katraj-Dehu Road Bypass', code: 'BYP' },
      { name: 'Senapati Bapat Road / University', code: 'SBR' },
    ],
    badgeColor: '#a78bfa', // Purple
  },
};

export const CITY_IDS = Object.keys(CITIES);
export const DEFAULT_CITY = 'mumbai';
