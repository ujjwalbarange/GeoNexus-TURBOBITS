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
  focusCoords,
  showFacilities = true,
  showDrainage = true,
  showZones = false,
  showTrafficOverlay = true,
  onToggleTrafficOverlay,
  redZones = [],
  onSelectRedZone,
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
  const redZonesLayerGroupRef = useRef(null);

  const [selectedProviderId, setSelectedProviderId] = useState(DEFAULT_MAP_PROVIDER_ID);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const currentCity = CITIES[selectedCityId] || CITIES.mumbai;

  // 1. Initialize Map on Mount with OpenStreetMap Default & Strict City MaxBounds
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const initialCity = CITIES[selectedCityId] || CITIES.mumbai;
    const provider = MAP_PROVIDERS.find((p) => p.id === selectedProviderId) || MAP_PROVIDERS[0];

    // Hardware-accelerated canvas map with strict city boundary isolation
    const map = L.map(mapContainerRef.current, {
      center: initialCity.center,
      zoom: initialCity.defaultZoom,
      minZoom: 10,
      maxZoom: 18,
      maxBounds: initialCity.bounds,
      maxBoundsViscosity: 1.0, // Strictly lock viewport within city bounds
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

    // Add TomTom Live Flow Overlay Tile Layer — bounded STRICTLY to city bounds to save API quota
    const tomtomUrl = trafficApiClient.getTrafficTileUrl('relative0');
    if (tomtomUrl) {
      const tomtomTileLayer = L.tileLayer(tomtomUrl, {
        maxZoom: 18,
        opacity: 0.85,
        bounds: initialCity.bounds, // Prevents loading tiles outside the selected city
        attribution: '&copy; <a href="https://www.tomtom.com" target="_blank" rel="noreferrer">TomTom</a>',
      });

      if (showTrafficOverlay) {
        tomtomTileLayer.addTo(map);
      }
      tomtomTileLayerRef.current = tomtomTileLayer;
    }

    // Initialize Layer Groups
    facilitiesLayerGroupRef.current = L.layerGroup().addTo(map);
    drainageLayerGroupRef.current = L.layerGroup().addTo(map);
    zonesLayerGroupRef.current = L.layerGroup().addTo(map);
    redZonesLayerGroupRef.current = L.layerGroup().addTo(map);

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

  // 2. Smoothly flyTo city when selectedCityId changes + update strict city bounds
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const city = CITIES[selectedCityId] || CITIES.mumbai;

    // Update strict city pan bounds
    map.setMaxBounds(city.bounds);

    map.flyTo(city.center, city.defaultZoom, {
      duration: 1.2,
      easeLinearity: 0.25,
    });

    // Update TomTom tile bounds to new city
    if (tomtomTileLayerRef.current) {
      tomtomTileLayerRef.current.options.bounds = city.bounds;
    }
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
      facilitiesLayerGroupRef.current?.clearLayers();
      drainageLayerGroupRef.current?.clearLayers();
      zonesLayerGroupRef.current?.clearLayers();

      const mapData = await rootMapService.fetchCityMapData(selectedCityId);

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

  // 5. Render Detected Red Zones Overlays
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !redZonesLayerGroupRef.current) return;

    redZonesLayerGroupRef.current.clearLayers();

    if (redZones && redZones.length > 0) {
      redZones.forEach((rz) => {
        if (!rz.coordinates || rz.coordinates.length < 2) return;

        // Visual pulsing halo polyline
        const halo = L.polyline(rz.coordinates, {
          color: rz.color || '#ef4444',
          weight: 14,
          opacity: 0.35,
          lineCap: 'round',
          interactive: false,
        });

        // Interactive red zone line
        const rzLine = L.polyline(rz.coordinates, {
          color: rz.color || '#ef4444',
          weight: 7,
          opacity: 0.95,
          lineCap: 'round',
        });

        rzLine.bindTooltip(`
          <div style="font-family: 'Inter', sans-serif; font-size: 12px; color: #fff;">
            <div style="font-weight: 700; color: #ef4444;">🚨 RED ZONE: ${rz.corridorName}</div>
            <div style="font-size: 11px; color: #f8fafc;">Delay: +${rz.delayMinutes} mins · ${rz.currentSpeedKmH || 15} km/h</div>
          </div>
        `, { sticky: true, className: 'traffic-tooltip-dark' });

        rzLine.on('click', () => {
          if (onSelectRedZone) onSelectRedZone(rz);
        });

        redZonesLayerGroupRef.current.addLayer(halo);
        redZonesLayerGroupRef.current.addLayer(rzLine);
      });
    }
  }, [redZones, onSelectRedZone]);

  // 6. Toggle TomTom Flow Tile Layer + Vector Layers
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

  // 7. External Focus Trigger
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (focusCoords && focusCoords.length === 2) {
      map.flyTo(focusCoords, 14, { duration: 1.0 });
    } else if (selectedSegment && selectedSegment.coordinates?.length > 0 && focusTrigger) {
      const bounds = L.latLngBounds(selectedSegment.coordinates);
      map.flyToBounds(bounds, {
        padding: [80, 80],
        maxZoom: 15,
        duration: 1.0,
      });
    }
  }, [focusTrigger, focusCoords, selectedSegment]);

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
        onToggleTrafficOverlay={onToggleTrafficOverlay}
        selectedProviderId={selectedProviderId}
        onSelectProvider={setSelectedProviderId}
        onToggleFullscreen={handleToggleFullscreen}
        isFullscreen={isFullscreen}
      />

      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
