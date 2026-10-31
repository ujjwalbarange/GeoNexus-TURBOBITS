import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../../styles/map.css';
import { CITIES } from '../../config/cities';
import { MAP_PROVIDERS, DEFAULT_MAP_PROVIDER_ID } from '../../config/mapConfig';
import { TrafficMapLayerManager } from '../../services/trafficLayer';
import { trafficApiClient } from '../../services/trafficApi';
import { rootMapService } from '../../services/rootMapService';
import { geoDataService } from '../../services/geoDataService';

export default function TrafficMap({
  selectedCityId,
  trafficData,
  selectedSegment,
  onSelectSegment,
  focusTrigger,
  focusCoords,
  showFacilities = true,
  showDrainage = true,
  showZones = true,
  showTrafficOverlay = true,
  redZones = [],
  onSelectRedZone,
  onSelectWard,
  onSelectPolice,
  selectedProviderId = DEFAULT_MAP_PROVIDER_ID,
  fitTrigger = 0,
  resetTrigger = 0,
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const baseTileLayerRef = useRef(null);
  const tomtomTileLayerRef = useRef(null);
  const trafficLayerManagerRef = useRef(null);

  // GIS Layer Groups
  const wardsLayerGroupRef = useRef(null);
  const policeLayerGroupRef = useRef(null);
  const drainageLayerGroupRef = useRef(null);
  const redZonesLayerGroupRef = useRef(null);

  const currentCity = CITIES[selectedCityId] || CITIES.mumbai;

  // 1. Initialize Leaflet Map on Mount
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Fix Leaflet Default Icon assets
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });

    const initialCity = CITIES[selectedCityId] || CITIES.mumbai;
    const provider = MAP_PROVIDERS.find((p) => p.id === selectedProviderId) || MAP_PROVIDERS[0];

    // Hardware-accelerated canvas Leaflet with strict city bounds isolation
    const map = L.map(mapContainerRef.current, {
      center: initialCity.center,
      zoom: initialCity.defaultZoom,
      minZoom: 10,
      maxZoom: 18,
      maxBounds: initialCity.bounds,
      maxBoundsViscosity: 1.0, // Prevents panning outside city
      zoomControl: false,
      preferCanvas: true,
      attributionControl: true,
    });

    // Base Tile Layer (Default: OpenStreetMap)
    const baseTileLayer = L.tileLayer(provider.url, {
      subdomains: provider.subdomains || 'abc',
      maxZoom: provider.maxZoom || 19,
      attribution: provider.attribution,
    }).addTo(map);

    baseTileLayerRef.current = baseTileLayer;

    // TomTom Live Flow Overlay Tile Layer — bounded strictly to city bounds
    const tomtomUrl = trafficApiClient.getTrafficTileUrl('relative0');
    if (tomtomUrl) {
      const tomtomTileLayer = L.tileLayer(tomtomUrl, {
        maxZoom: 18,
        opacity: 0.85,
        bounds: initialCity.bounds,
        attribution: '&copy; <a href="https://www.tomtom.com" target="_blank" rel="noreferrer">TomTom</a>',
      });

      if (showTrafficOverlay) {
        tomtomTileLayer.addTo(map);
      }
      tomtomTileLayerRef.current = tomtomTileLayer;
    }

    // Initialize Layer Groups in proper z-order
    wardsLayerGroupRef.current = L.layerGroup().addTo(map);
    drainageLayerGroupRef.current = L.layerGroup().addTo(map);
    policeLayerGroupRef.current = L.layerGroup().addTo(map);
    redZonesLayerGroupRef.current = L.layerGroup().addTo(map);

    // Interactive Corridor Vector Layer Manager
    const trafficManager = new TrafficMapLayerManager(map);
    trafficManager.setSelectCallback((seg) => {
      if (onSelectSegment) onSelectSegment(seg);
    });
    trafficLayerManagerRef.current = trafficManager;

    mapInstanceRef.current = map;

    // Handle container sizing
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

  // 2. City Switching: flyTo city center and update strict boundary bounds
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const city = CITIES[selectedCityId] || CITIES.mumbai;
    map.setMaxBounds(city.bounds);
    map.flyTo(city.center, city.defaultZoom, {
      duration: 1.2,
      easeLinearity: 0.25,
    });

    if (tomtomTileLayerRef.current) {
      tomtomTileLayerRef.current.options.bounds = city.bounds;
    }
  }, [selectedCityId]);

  // 3. Tile Provider Switching
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !baseTileLayerRef.current) return;

    const provider = MAP_PROVIDERS.find((p) => p.id === selectedProviderId) || MAP_PROVIDERS[0];
    map.removeLayer(baseTileLayerRef.current);

    const newBase = L.tileLayer(provider.url, {
      subdomains: provider.subdomains || 'abc',
      maxZoom: provider.maxZoom || 19,
      attribution: provider.attribution,
    }).addTo(map);

    if (tomtomTileLayerRef.current && map.hasLayer(tomtomTileLayerRef.current)) {
      tomtomTileLayerRef.current.bringToFront();
    }

    baseTileLayerRef.current = newBase;
  }, [selectedProviderId]);

  // 4. Ingest and Render Authentic Ward / Zonal Boundaries
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !wardsLayerGroupRef.current) return;

    wardsLayerGroupRef.current.clearLayers();

    if (!showZones) return;

    async function loadBoundaries() {
      const geojson = await geoDataService.getCityBoundaries(selectedCityId);
      if (!geojson || !geojson.features) return;

      const layer = L.geoJSON(geojson, {
        style: (feat) => {
          return {
            color: '#3b82f6',
            weight: 1.5,
            fillColor: '#3b82f6',
            fillOpacity: 0.08,
            opacity: 0.8,
            dashArray: '3, 4',
          };
        },
        onEachFeature: (feature, l) => {
          const wardInfo = geoDataService.extractWardInfo(feature, selectedCityId);

          // Tooltip on hover
          l.bindTooltip(`
            <div style="font-family: 'Inter', sans-serif; font-size: 11px; padding: 2px;">
              <strong style="color: #0f172a; font-size: 12px;">${wardInfo.name}</strong><br/>
              <span style="color: #64748b;">${wardInfo.areaSqKm ? `Area: ${wardInfo.areaSqKm} km²` : 'Municipal Sector'}</span><br/>
              <span style="color: #2563eb; font-weight: 700;">Click to view Sector Intelligence →</span>
            </div>
          `, { sticky: true, className: 'ward-tooltip' });

          // Click to open contextual Ward Drawer
          l.on('click', (e) => {
            L.DomEvent.stopPropagation(e);
            if (onSelectWard) onSelectWard(wardInfo);
          });
        },
      });

      wardsLayerGroupRef.current.addLayer(layer);
    }

    loadBoundaries();
  }, [selectedCityId, showZones, onSelectWard]);

  // 5. Ingest and Render Verified Police Posts
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !policeLayerGroupRef.current) return;

    policeLayerGroupRef.current.clearLayers();

    if (!showFacilities) return;

    async function loadPolice() {
      const geojson = await geoDataService.getCityPoliceUnits(selectedCityId);
      if (!geojson || !geojson.features) return;

      geojson.features.forEach((feat) => {
        const coords = feat.geometry?.coordinates;
        if (!coords || coords.length < 2) return;
        const [lon, lat] = coords;

        const p = feat.properties || {};
        const stationName = p.name || p.NAME || p.station_name || 'Traffic Police Post';

        const policeIcon = L.divIcon({
          className: 'custom-police-marker',
          html: `
            <div style="
              width: 28px;
              height: 28px;
              border-radius: 8px;
              background: #0f172a;
              border: 1.5px solid #3b82f6;
              box-shadow: 0 2px 8px rgba(0,0,0,0.5);
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 14px;
              cursor: pointer;
            ">🚓</div>
          `,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
          popupAnchor: [0, -14],
        });

        const marker = L.marker([lat, lon], { icon: policeIcon });

        marker.bindPopup(`
          <div style="font-family: 'Inter', sans-serif; font-size: 12px; color: #0f172a; padding: 4px; max-width: 220px;">
            <strong style="color: #2563eb; font-size: 13px;">🚓 ${stationName}</strong>
            <div style="color: #64748b; margin-top: 2px;">Metropolitan Police Traffic Division</div>
            <div style="color: #10b981; font-weight: 700; margin-top: 4px;">● VERIFIED ON-DUTY POST</div>
          </div>
        `);

        marker.on('click', () => {
          if (onSelectPolice) onSelectPolice({ name: stationName, latitude: lat, longitude: lon, properties: p });
        });

        policeLayerGroupRef.current.addLayer(marker);
      });
    }

    loadPolice();
  }, [selectedCityId, showFacilities, onSelectPolice]);

  // 6. Ingest and Render Drainage Corridors (Root Map Service Integration)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !drainageLayerGroupRef.current) return;

    drainageLayerGroupRef.current.clearLayers();

    if (!showDrainage) return;

    async function loadDrainage() {
      const layersData = await rootMapService.fetchCityLayers(selectedCityId, ['drainage', 'waterways']);
      const drainageGeo = layersData.layers?.drainage || layersData.layers?.waterways;

      if (drainageGeo) {
        const geoLayer = L.geoJSON(drainageGeo, {
          style: {
            color: '#06b6d4',
            weight: 2.5,
            opacity: 0.75,
          },
          onEachFeature: (feature, layer) => {
            if (feature.properties?.name) {
              layer.bindTooltip(`🌊 Stormwater: ${feature.properties.name}`, { sticky: true });
            }
          },
        });
        drainageLayerGroupRef.current.addLayer(geoLayer);
      }
    }

    loadDrainage();
  }, [selectedCityId, showDrainage]);

  // 7. Render Detected Red Zones Overlays with Pulsing Halos
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
          weight: 16,
          opacity: 0.35,
          lineCap: 'round',
          interactive: false,
        });

        // Core interactive red zone line
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
            <div style="font-size: 10px; color: #38bdf8; font-weight: 600;">Click to open Tactical Action Plan →</div>
          </div>
        `, { sticky: true, className: 'traffic-tooltip-dark' });

        rzLine.on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          if (onSelectRedZone) onSelectRedZone(rz);
        });

        // Add start marker
        const startPoint = rz.coordinates[0];
        const icon = L.divIcon({
          className: 'rz-start-marker',
          html: `
            <div style="
              width: 24px;
              height: 24px;
              border-radius: 50%;
              background: #dc2626;
              border: 2px solid #ffffff;
              box-shadow: 0 0 12px #dc2626;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 11px;
              color: #fff;
              font-weight: bold;
              cursor: pointer;
            ">🚨</div>
          `,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        const startMarker = L.marker(startPoint, { icon });
        startMarker.on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          if (onSelectRedZone) onSelectRedZone(rz);
        });

        redZonesLayerGroupRef.current.addLayer(halo);
        redZonesLayerGroupRef.current.addLayer(rzLine);
        redZonesLayerGroupRef.current.addLayer(startMarker);
      });
    }
  }, [redZones, onSelectRedZone]);

  // 8. Render Vector Corridors from TomTom API data
  useEffect(() => {
    if (trafficLayerManagerRef.current && trafficData?.segments) {
      trafficLayerManagerRef.current.renderCorridors(trafficData.segments, selectedSegment);
    }
  }, [trafficData, selectedSegment]);

  // 9. TomTom Flow Tile Layer Toggle
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !tomtomTileLayerRef.current) return;

    if (showTrafficOverlay && !map.hasLayer(tomtomTileLayerRef.current)) {
      map.addLayer(tomtomTileLayerRef.current);
      tomtomTileLayerRef.current.bringToFront();
    } else if (!showTrafficOverlay && map.hasLayer(tomtomTileLayerRef.current)) {
      map.removeLayer(tomtomTileLayerRef.current);
    }
  }, [showTrafficOverlay]);

  // 10. Fit City & Reset View Triggers
  useEffect(() => {
    if (fitTrigger > 0 && mapInstanceRef.current) {
      const city = CITIES[selectedCityId] || CITIES.mumbai;
      mapInstanceRef.current.fitBounds(city.bounds, { padding: [20, 20], maxZoom: 14 });
    }
  }, [fitTrigger, selectedCityId]);

  useEffect(() => {
    if (resetTrigger > 0 && mapInstanceRef.current) {
      const city = CITIES[selectedCityId] || CITIES.mumbai;
      mapInstanceRef.current.setView(city.center, city.defaultZoom);
    }
  }, [resetTrigger, selectedCityId]);

  // 11. Focus Coordinates on demand
  useEffect(() => {
    if (focusCoords && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(focusCoords, 15, {
        duration: 1.0,
      });
    }
  }, [focusTrigger, focusCoords]);

  return (
    <div
      ref={mapContainerRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        background: '#090d16',
      }}
    />
  );
}
