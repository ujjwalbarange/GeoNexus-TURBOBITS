/**
 * GeoDataService — Municipal Wards, Administrative Zones & Police Posts GIS Provider
 * Loads authentic GeoJSON boundaries and facility points from /data/geo/
 * strictly local and isolated for standalone Traffic Control operations.
 */

class GeoDataService {
  constructor() {
    this.cache = new Map();
  }

  /**
   * Fetch city ward / zonal boundaries
   * @param {string} cityId 'mumbai' | 'nagpur' | 'pune'
   */
  async getCityBoundaries(cityId) {
    const key = `boundaries_${cityId}`;
    if (this.cache.has(key)) return this.cache.get(key);

    const fileMap = {
      mumbai: '/data/geo/mumbai_wards.geojson',
      pune: '/data/geo/pune_zones.geojson',
      nagpur: '/data/geo/nagpur_zones.geojson',
    };

    const url = fileMap[cityId] || fileMap.mumbai;

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
      const geojson = await res.json();
      this.cache.set(key, geojson);
      return geojson;
    } catch (err) {
      console.warn(`[GeoDataService] Failed to load boundaries for ${cityId}:`, err);
      return { type: 'FeatureCollection', features: [] };
    }
  }

  /**
   * Fetch city verified police facilities & posts
   * @param {string} cityId 'mumbai' | 'nagpur' | 'pune'
   */
  async getCityPoliceUnits(cityId) {
    const key = `police_${cityId}`;
    if (this.cache.has(key)) return this.cache.get(key);

    const fileMap = {
      mumbai: '/data/geo/mumbai_police.geojson',
      pune: '/data/geo/pune_police.geojson',
      nagpur: '/data/geo/nagpur_police.geojson',
    };

    const url = fileMap[cityId] || fileMap.mumbai;

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
      const geojson = await res.json();
      this.cache.set(key, geojson);
      return geojson;
    } catch (err) {
      console.warn(`[GeoDataService] Failed to load police units for ${cityId}:`, err);
      return { type: 'FeatureCollection', features: [] };
    }
  }

  /**
   * Clean and normalize ward / zone feature properties
   */
  extractWardInfo(feature, cityId) {
    if (!feature || !feature.properties) {
      return {
        id: 'UNKNOWN',
        name: 'Unknown Ward / Zone',
        areaSqKm: null,
        cityId,
      };
    }

    const p = feature.properties;
    let wardId = p.Name || p.NAME2 || p.zone_id || p.ward_id || p.OBJECTID || 'UNKNOWN';
    wardId = String(wardId).trim();

    let wardName = p.ward_name || p.zone_name || p.Name || p.NAME2 || `Ward ${wardId}`;
    wardName = String(wardName).trim();

    // Friendly Mumbai Ward names mapping
    const MUMBAI_WARD_NAMES = {
      'A': 'Ward A (Colaba / Churchgate / Fort)',
      'B': 'Ward B (Sandhurst Road / Dongri)',
      'C': 'Ward C (Marine Lines / Pydhonie)',
      'D': 'Ward D (Malabar Hill / Grant Road)',
      'E': 'Ward E (Byculla / Mumbai Central)',
      'F/N': 'Ward F/North (Matunga / Sion / Wadala)',
      'F/S': 'Ward F/South (Parel / Sewri)',
      'G/N': 'Ward G/North (Dadar / Mahim / Dharavi)',
      'G/S': 'Ward G/South (Worli / Lower Parel / Prabhadevi)',
      'H/E': 'Ward H/East (Bandra East / Santacruz East / BKC)',
      'H/W': 'Ward H/West (Bandra West / Khar / Santacruz West)',
      'K/E': 'Ward K/East (Andheri East / Jogeshwari East)',
      'K/W': 'Ward K/West (Andheri West / Juhu / Versova)',
      'P/N': 'Ward P/North (Malad / Marve)',
      'P/S': 'Ward P/South (Goregaon)',
      'R/N': 'Ward R/North (Dahisar)',
      'R/C': 'Ward R/Central (Borivali)',
      'R/S': 'Ward R/South (Kandivali)',
      'L': 'Ward L (Kurla / Chunabhatti / Sakinaka)',
      'M/E': 'Ward M/East (Govandi / Mankhurd / Chembur East)',
      'M/W': 'Ward M/West (Chembur West / Tilak Nagar)',
      'N': 'Ward N (Ghatkopar / Vikhroli West)',
      'S': 'Ward S (Bhandup / Powai / Kanjurmarg)',
      'T': 'Ward T (Mulund / Nahur)',
    };

    if (cityId === 'mumbai' && MUMBAI_WARD_NAMES[wardId]) {
      wardName = MUMBAI_WARD_NAMES[wardId];
    }

    const shapeArea = p.Shape__Area || p.area_sqkm;
    const areaSqKm = shapeArea ? (shapeArea > 1000 ? (shapeArea / 1000000).toFixed(2) : Number(shapeArea).toFixed(2)) : null;

    return {
      id: wardId,
      name: wardName,
      areaSqKm,
      cityId,
      properties: p,
      geometry: feature.geometry,
    };
  }
}

export const geoDataService = new GeoDataService();
