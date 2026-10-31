/**
 * Root Project Map Services Adapter
 * Integrates map infrastructure and GIS layers served by the root application:
 * - /api/admin/map-data (Facilities, Wards/Zones, and Incident coordinates)
 * - /api/hazards/map-layers (GeoJSON Drainage, Waterways, Hospitals, Emergency Posts)
 */

const ROOT_API_URL = import.meta.env.VITE_ROOT_API_URL || 'http://localhost:3000';

export class RootMapService {
  constructor(baseUrl = ROOT_API_URL) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  /**
   * Fetch city facilities, zones, and incidents from root project
   * @param {string} cityId 'mumbai' | 'nagpur' | 'pune'
   */
  async fetchCityMapData(cityId) {
    try {
      const res = await fetch(`${this.baseUrl}/api/admin/map-data?city=${cityId}`);
      if (!res.ok) {
        return { success: false, facilities: [], zones: [], incidents: [] };
      }
      const data = await res.json();
      return {
        success: data.success || false,
        facilities: data.facilities || [],
        zones: data.zones || [],
        incidents: data.incidents || [],
      };
    } catch (err) {
      console.warn('[RootMapService] Map data fetch error:', err.message);
      return { success: false, facilities: [], zones: [], incidents: [] };
    }
  }

  /**
   * Fetch city GeoJSON GIS layers from root project
   * @param {string} cityId 'mumbai' | 'nagpur' | 'pune'
   * @param {Array<string>} requestedLayers ['drainage', 'waterways', 'fire', 'hospitals']
   */
  async fetchCityLayers(cityId, requestedLayers = ['drainage', 'waterways', 'fire', 'hospitals']) {
    try {
      const layersParam = requestedLayers.join(',');
      const res = await fetch(`${this.baseUrl}/api/hazards/map-layers?city=${cityId}&layers=${layersParam}`);
      if (!res.ok) {
        return { success: false, layers: {} };
      }
      const data = await res.json();
      return {
        success: data.success || false,
        layers: data.data?.layers || {},
      };
    } catch (err) {
      console.warn('[RootMapService] GIS layers fetch error:', err.message);
      return { success: false, layers: {} };
    }
  }
}

export const rootMapService = new RootMapService();
