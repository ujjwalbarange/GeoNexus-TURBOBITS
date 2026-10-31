import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../../styles/map.css';
import { CITIES } from '../../config/cities';
import { MAP_PROVIDERS, DEFAULT_MAP_PROVIDER_ID } from '../../config/mapConfig';
import { TrafficMapLayerManager } from '../../services/trafficLayer';
import { trafficApiClient } from '../../services/trafficApi';
import { rootMapService } from '../../services/rootMapService';
import MapControls from '../controls/MapControls';

// Facility Icon Helpers
const FACILITY_ICONS = {
  police: '🚓',
  traffic_police: '🚦',
  fire_brigade: '🚒',
  hospital: '🏥',
  water_supply: '💧',
  drainage: '🚰',
  disaster_mgmt: '🚨',
};

export default function TrafficMap({
  selectedCityId,
  trafficData,
  selectedSegment,
  onSelectSegment,
  focusTrigger,
  showFacilities = true,
  showDrainage = true,
  showZones = false,
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const baseTileLayerRef = useRef(null);
  const tomtomTileLayerRef = useRef(null);
  const trafficLayerManagerRef = useRef(null);

  // Root GIS Layer Groups
  const facilitiesLayerGroupRef = useRef(null);
  const drainageLayerGroupRef = useRef(null);
  const zonesLayerGroupRef = useRef(null);

  const [selectedProviderId, setSelectedProviderId] = useState(DEFAULT_MAP_PROVIDER_ID);
  const [showTrafficOverlay, setShowTrafficOverlay] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const currentCity = CITIES[selectedCityId] || CITIES.mumbai;

  // 1. Initialize Map on Mount with OpenStreetMap Default
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const initialCity = CITIES[selectedCityId] || CITIES.mumbai;
    const provider = MAP_PROVIDERS.find((p) => p.id === selectedProviderId) || MAP_PROVIDERS[0];

    // Create Map with Canvas Renderer for 60fps pan/zoom
    const map = L.map(mapContainerRef.current, {
      center: initialCity.center,
      zoom: initialCity.defaultZoom,
      minZoom: 9,
      maxZoom: 19,
      zoomControl: false,
      preferCanvas: true,
      attributionControl: true,
    });

    // Add Base Tile Layer (OpenStreetMap Default)
    const baseTileLayer = L.tileLayer(provider.url, {
      subdomains: provider.subdomains || 'abc',
      maxZoom: provider.maxZoom || 19,
      attribution: provider.attribution,
    }).addTo(map);

    baseTileLayerRef.current = baseTileLayer;

    // Add TomTom Live Flow Overlay Tile Layer
    const tomtomUrl = trafficApiClient.getTrafficTileUrl('relative0');
    if (tomtomUrl) {
      const tomtomTileLayer = L.tileLayer(tomtomUrl, {
        maxZoom: 19,
        opacity: 0.85,
        attribution: '&copy; <a href="https://www.tomtom.com" target="_blank" rel="noreferrer">TomTom</a>',
      }).addTo(map);
      tomtomTileLayerRef.current = tomtomTileLayer;
    }

    // Initialize Root GIS Layer Groups
    facilitiesLayerGroupRef.current = L.layerGroup().addTo(map);
    drainageLayerGroupRef.current = L.layerGroup().addTo(map);
    zonesLayerGroupRef.current = L.layerGroup().addTo(map);

    // Initialize Interactive Vector Corridor Manager
    const trafficManager = new TrafficMapLayerManager(map);
    trafficManager.setSelectCallback((seg) => {
      onSelectSegment(seg);
    });
    trafficLayerManagerRef.current = trafficManager;

    mapInstanceRef.current = map;

    // Invalidate size on load & resize
    const invalidate = () => map.invalidateSize();
    const timer1 = setTimeout(invalidate, 100);
    const timer2 = setTimeout(invalidate, 400);
    window.addEventListener('resize', invalidate);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      window.removeEventListener('resize', invalidate);
      trafficManager.destroy();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 2. Smoothly flyTo city when selectedCityId changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const city = CITIES[selectedCityId] || CITIES.mumbai;
    map.flyTo(city.center, city.defaultZoom, {
      duration: 1.4,
      easeLinearity: 0.25,
    });
  }, [selectedCityId]);

  // 3. Switch Base Tile Provider
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !baseTileLayerRef.current) return;

    const provider = MAP_PROVIDERS.find((p) => p.id === selectedProviderId) || MAP_PROVIDERS[0];
    map.removeLayer(baseTileLayerRef.current);

    const newBaseTileLayer = L.tileLayer(provider.url, {
      subdomains: provider.subdomains || 'abc',
      maxZoom: provider.maxZoom || 19,
      attribution: provider.attribution,
    });

    newBaseTileLayer.addTo(map);

    // Keep overlays on top
    if (tomtomTileLayerRef.current && map.hasLayer(tomtomTileLayerRef.current)) {
      tomtomTileLayerRef.current.bringToFront();
    }

    baseTileLayerRef.current = newBaseTileLayer;
  }, [selectedProviderId]);

  // 4. Ingest and Render Root Project Map Services
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    async function loadRootMapServices() {
      // Clear previous layers
      facilitiesLayerGroupRef.current?.clearLayers();
      drainageLayerGroupRef.current?.clearLayers();
      zonesLayerGroupRef.current?.clearLayers();

      // A. Load Facilities & Zones from Root Project /api/admin/map-data
      const mapData = await rootMapService.fetchCityMapData(selectedCityId);

      // Render Emergency / Traffic Facilities
      if (showFacilities && mapData.facilities?.length > 0) {
        mapData.facilities.forEach((fac) => {
          if (!fac.latitude || !fac.longitude) return;
          const iconChar = FACILITY_ICONS[fac.departmentType] || '🏢';

          const markerIcon = L.divIcon({
            className: 'custom-facility-marker',
            html: `
              <div style="
                width: 26px;
                height: 26px;
                border-radius: 8px;
                background: #0f172a;
                border: 1.5px solid #38bdf8;
                box-shadow: 0 2px 6px rgba(0,0,0,0.4);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 13px;
                cursor: pointer;
              ">${iconChar}</div>
            `,
            iconSize: [26, 26],
            iconAnchor: [13, 13],
            popupAnchor: [0, -12],
          });

          const m = L.marker([fac.latitude, fac.longitude], { icon: markerIcon });
          m.bindPopup(`
            <div style="font-family: 'Inter', sans-serif; font-size: 12px; color: #0f172a; padding: 4px;">
              <strong style="font-size: 13px; color: #0284c7;">${fac.name}</strong><br/>
              <span style="color: #64748b;">${fac.departmentName || fac.departmentType}</span><br/>
              ${fac.address ? `<div style="margin-top: 4px; font-size: 11px;">${fac.address}</div>` : ''}
              ${fac.contactNumber ? `<div style="margin-top: 4px; font-weight: 600;">📞 ${fac.contactNumber}</div>` : ''}
            </div>
          `);
          facilitiesLayerGroupRef.current?.addLayer(m);
        });
      }

      // Render Wards / Zones
      if (showZones && mapData.zones?.length > 0) {
        mapData.zones.forEach((z) => {
          if (!z.polygon || z.polygon.length === 0) return;
          const latLngs = z.polygon.map(([lng, lat]) => [lat, lng]);
          const poly = L.polygon(latLngs, {
            color: '#3b82f6',
            weight: 1.5,
            fillColor: '#3b82f6',
            fillOpacity: 0.08,
            dashArray: '4, 4',
          });
          poly.bindTooltip(z.zoneName || `Zone ${z.zoneNumber}`, { sticky: true });
          zonesLayerGroupRef.current?.addLayer(poly);
        });
      }

      // B. Load Drainage & Waterways GeoJSON from Root Project /api/hazards/map-layers
      if (showDrainage) {
        const layersData = await rootMapService.fetchCityLayers(selectedCityId, ['drainage', 'waterways']);
        const drainageGeo = layersData.layers?.drainage || layersData.layers?.waterways;

        if (drainageGeo) {
          const geoLayer = L.geoJSON(drainageGeo, {
            style: {
              color: '#06b6d4',
              weight: 2.5,
              opacity: 0.7,
            },
            onEachFeature: (feature, layer) => {
              if (feature.properties?.name) {
                layer.bindTooltip(`Stormwater: ${feature.properties.name}`, { sticky: true });
              }
            },
          });
          drainageLayerGroupRef.current?.addLayer(geoLayer);
        }
      }
    }

    loadRootMapServices();
  }, [selectedCityId, showFacilities, showDrainage, showZones]);

  // 5. Toggle TomTom Flow Tile Layer + Vector Layers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tomtomTileLayerRef.current) {
      if (showTrafficOverlay && !map.hasLayer(tomtomTileLayerRef.current)) {
        map.addLayer(tomtomTileLayerRef.current);
        tomtomTileLayerRef.current.bringToFront();
      } else if (!showTrafficOverlay && map.hasLayer(tomtomTileLayerRef.current)) {
        map.removeLayer(tomtomTileLayerRef.current);
      }
    }

    const manager = trafficLayerManagerRef.current;
    if (!manager) return;

    if (!showTrafficOverlay) {
      manager.clear();
      return;
    }

    const segments = trafficData?.segments || [];
    manager.renderSegments(segments, selectedSegment?.id || null);
  }, [trafficData, showTrafficOverlay, selectedSegment]);

  // 6. External Focus Trigger
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedSegment || !focusTrigger) return;

    if (selectedSegment.coordinates && selectedSegment.coordinates.length > 0) {
      const bounds = L.latLngBounds(selectedSegment.coordinates);
      map.flyToBounds(bounds, {
        padding: [80, 80],
        maxZoom: 15,
        duration: 1.0,
      });
    }
  }, [focusTrigger, selectedSegment]);

  // Controls
  const handleZoomIn = () => mapInstanceRef.current?.zoomIn();
  const handleZoomOut = () => mapInstanceRef.current?.zoomOut();

  const handleResetView = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    map.flyTo(currentCity.center, currentCity.defaultZoom, { duration: 1.0 });
    onSelectSegment(null);
  };

  const handleToggleFullscreen = () => {
    const elem = mapContainerRef.current?.parentElement;
    if (!elem) return;

    if (!document.fullscreenElement) {
      elem.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div className="map-canvas-container" style={{ width: '100%', height: '100%', position: 'relative' }}>
      <MapControls
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetView={handleResetView}
        showTrafficOverlay={showTrafficOverlay}
        onToggleTrafficOverlay={() => setShowTrafficOverlay(!showTrafficOverlay)}
        selectedProviderId={selectedProviderId}
        onSelectProvider={setSelectedProviderId}
        onToggleFullscreen={handleToggleFullscreen}
        isFullscreen={isFullscreen}
      />

      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
