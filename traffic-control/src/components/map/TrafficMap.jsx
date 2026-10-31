import React, { useEffect, useRef } from 'react';
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
  isActive = true,
  // New Interactive Sandbox & Visual Architecture Capabilities
  isDrawingSegment = false,
  onSegmentDrawn = null,
  activeDispatchRoute = null,
  activeProposalAlignment = null,
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
  const dispatchRouteLayerGroupRef = useRef(null);
  const proposalAlignmentLayerGroupRef = useRef(null);
  const drawingLayerGroupRef = useRef(null);

  // In-progress drawn coordinates
  const drawnPointsRef = useRef([]);

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

    const cityBounds = initialCity.bounds;
    // Cushioned envelope so screen aspect ratio never breaks or clamps to NaN
    const paddedBounds = [
      [cityBounds[0][0] - 0.25, cityBounds[0][1] - 0.25],
      [cityBounds[1][0] + 0.25, cityBounds[1][1] + 0.25],
    ];

    // Hardware-accelerated canvas Leaflet
    const map = L.map(mapContainerRef.current, {
      center: initialCity.center,
      zoom: initialCity.defaultZoom || 12,
      minZoom: 9,
      maxZoom: 18,
      maxBounds: paddedBounds,
      maxBoundsViscosity: 0.8,
      zoomControl: false,
      preferCanvas: true,
      attributionControl: true,
    });

    // Base Tile Layer (Default: OpenStreetMap)
    const baseTileLayer = L.tileLayer(provider.url, {
      subdomains: provider.subdomains || 'abc',
      maxZoom: provider.maxZoom || 19,
      attribution: provider.attribution,
    });
    baseTileLayer.addTo(map);

    baseTileLayerRef.current = baseTileLayer;

    // TomTom Live Flow Overlay Tile Layer
    const tomtomUrl = trafficApiClient.getTrafficTileUrl('relative0');
    if (tomtomUrl) {
      const tomtomTileLayer = L.tileLayer(tomtomUrl, {
        maxZoom: 18,
        opacity: 0.85,
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
    proposalAlignmentLayerGroupRef.current = L.layerGroup().addTo(map);
    dispatchRouteLayerGroupRef.current = L.layerGroup().addTo(map);
    redZonesLayerGroupRef.current = L.layerGroup().addTo(map);
    drawingLayerGroupRef.current = L.layerGroup().addTo(map);

    // Interactive Corridor Vector Layer Manager
    const trafficManager = new TrafficMapLayerManager(map);
    trafficManager.setSelectCallback((seg) => {
      if (onSelectSegment) onSelectSegment(seg);
    });
    trafficLayerManagerRef.current = trafficManager;

    mapInstanceRef.current = map;

    // Invalidate size immediately and after layout settles
    const invalidate = () => map.invalidateSize();
    requestAnimationFrame(invalidate);
    const timer1 = setTimeout(invalidate, 100);
    const timer2 = setTimeout(invalidate, 300);
    const timer3 = setTimeout(invalidate, 600);
    window.addEventListener('resize', invalidate);

    return () => {
      window.removeEventListener('resize', invalidate);
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      try {
        if (trafficManager) trafficManager.destroy();
        if (map) map.remove();
      } catch (e) {
        console.warn('[TrafficMap] map removal warning:', e);
      }
      if (mapContainerRef.current) {
        delete mapContainerRef.current._leaflet_id;
      }
      mapInstanceRef.current = null;
    };
  }, []);

  // 2. Handle Tab Visibility / Active state (Fixes black screen when switching to Live Traffic Map)
  useEffect(() => {
    if (isActive && mapInstanceRef.current) {
      const invalidate = () => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      };
      requestAnimationFrame(invalidate);
      const t1 = setTimeout(invalidate, 50);
      const t2 = setTimeout(invalidate, 150);
      const t3 = setTimeout(invalidate, 400);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    }
  }, [isActive]);

  // 3. City Switching: flyTo city center and update boundary bounds
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const city = CITIES[selectedCityId] || CITIES.mumbai;
    const cityBounds = city.bounds;
    const paddedBounds = [
      [cityBounds[0][0] - 0.25, cityBounds[0][1] - 0.25],
      [cityBounds[1][0] + 0.25, cityBounds[1][1] + 0.25],
    ];

    map.setMaxBounds(paddedBounds);
    map.flyTo(city.center, city.defaultZoom || 12, {
      duration: 1.0,
      easeLinearity: 0.25,
    });
  }, [selectedCityId]);

  // 4. Tile Provider Switching
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

  // 5. Ingest and Render Authentic Ward / Zonal Boundaries
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !wardsLayerGroupRef.current) return;

    wardsLayerGroupRef.current.clearLayers();

    if (!showZones) return;

    async function loadBoundaries() {
      try {
        const geojson = await geoDataService.getCityBoundaries(selectedCityId);
        if (!geojson || !geojson.features || !mapInstanceRef.current) return;

        const layer = L.geoJSON(geojson, {
          style: () => ({
            color: '#3b82f6',
            weight: 1.5,
            fillColor: '#3b82f6',
            fillOpacity: 0.08,
            opacity: 0.8,
            dashArray: '3, 4',
          }),
          onEachFeature: (feature, l) => {
            const wardInfo = geoDataService.extractWardInfo(feature, selectedCityId);

            l.bindTooltip(`
              <div style="font-family: 'Inter', sans-serif; font-size: 11px; padding: 2px;">
                <strong style="color: #0f172a; font-size: 12px;">${wardInfo.name}</strong><br/>
                <span style="color: #64748b;">${wardInfo.areaSqKm ? `Area: ${wardInfo.areaSqKm} km²` : 'Municipal Sector'}</span><br/>
                <span style="color: #2563eb; font-weight: 700;">Click to view Sector Intelligence →</span>
              </div>
            `, { sticky: true, className: 'ward-tooltip' });

            l.on('click', (e) => {
              L.DomEvent.stopPropagation(e);
              if (onSelectWard) onSelectWard(wardInfo);
            });
          },
        });

        wardsLayerGroupRef.current.addLayer(layer);
      } catch (err) {
        console.warn('[TrafficMap] Failed to render boundaries:', err);
      }
    }

    loadBoundaries();
  }, [selectedCityId, showZones, onSelectWard]);

  // 6. Ingest and Render Verified Police Posts
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !policeLayerGroupRef.current) return;

    policeLayerGroupRef.current.clearLayers();

    if (!showFacilities) return;

    async function loadPolice() {
      try {
        const geojson = await geoDataService.getCityPoliceUnits(selectedCityId);
        if (!geojson || !geojson.features || !mapInstanceRef.current) return;

        geojson.features.forEach((feat) => {
          const coords = feat.geometry?.coordinates;
          if (!coords || coords.length < 2) return;
          const [lon, lat] = coords;
          if (isNaN(lat) || isNaN(lon)) return;

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
      } catch (err) {
        console.warn('[TrafficMap] Failed to render police posts:', err);
      }
    }

    loadPolice();
  }, [selectedCityId, showFacilities, onSelectPolice]);

  // 7. Ingest and Render Drainage Corridors (Root Map Service Integration)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !drainageLayerGroupRef.current) return;

    drainageLayerGroupRef.current.clearLayers();

    if (!showDrainage) return;

    async function loadDrainage() {
      try {
        const layersData = await rootMapService.fetchCityLayers(selectedCityId, ['drainage', 'waterways']);
        const drainageGeo = layersData.layers?.drainage || layersData.layers?.waterways;

        if (drainageGeo && mapInstanceRef.current) {
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
      } catch (err) {
        console.warn('[TrafficMap] Failed to load drainage:', err);
      }
    }

    loadDrainage();
  }, [selectedCityId, showDrainage]);

  // 8. Render Detected Red Zones Overlays with Pulsing Halos
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

  // 9. Render Vector Corridors from TomTom API data
  useEffect(() => {
    if (trafficLayerManagerRef.current && trafficData?.segments) {
      trafficLayerManagerRef.current.renderSegments(
        trafficData.segments,
        selectedSegment?.id || selectedSegment
      );
    }
  }, [trafficData, selectedSegment]);

  // 10. TomTom Flow Tile Layer Toggle
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

  // 11. Fit City & Reset View Triggers
  useEffect(() => {
    if (fitTrigger > 0 && mapInstanceRef.current) {
      const city = CITIES[selectedCityId] || CITIES.mumbai;
      mapInstanceRef.current.fitBounds(city.bounds, { padding: [20, 20], maxZoom: 14 });
    }
  }, [fitTrigger, selectedCityId]);

  useEffect(() => {
    if (resetTrigger > 0 && mapInstanceRef.current) {
      const city = CITIES[selectedCityId] || CITIES.mumbai;
      mapInstanceRef.current.setView(city.center, city.defaultZoom || 12);
    }
  }, [resetTrigger, selectedCityId]);

  // 12. Focus Coordinates on demand
  useEffect(() => {
    if (focusCoords && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(focusCoords, 15, {
        duration: 1.0,
      });
    }
  }, [focusTrigger, focusCoords]);

  // 13. Interactive Map Drawing Tool (Draw Traffic Segment)
  const [pointCount, setPointCount] = React.useState(0);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (!isDrawingSegment) {
      if (drawingLayerGroupRef.current) drawingLayerGroupRef.current.clearLayers();
      drawnPointsRef.current = [];
      setPointCount(0);
      map.getContainer().style.cursor = '';
      return;
    }

    map.getContainer().style.cursor = 'crosshair';

    const handleMapClick = (e) => {
      const pt = [e.latlng.lat, e.latlng.lng];
      drawnPointsRef.current.push(pt);
      setPointCount(drawnPointsRef.current.length);

      // Render marker at waypoint
      const marker = L.circleMarker(pt, {
        radius: 6,
        fillColor: '#8b5cf6',
        color: '#ffffff',
        weight: 2,
        fillOpacity: 1,
      });

      if (drawingLayerGroupRef.current) {
        drawingLayerGroupRef.current.addLayer(marker);
        if (drawnPointsRef.current.length >= 2) {
          const polyline = L.polyline(drawnPointsRef.current, {
            color: '#8b5cf6',
            weight: 5,
            dashArray: '5, 5',
            opacity: 0.9,
          });
          drawingLayerGroupRef.current.addLayer(polyline);
        }
      }
    };

    map.on('click', handleMapClick);

    return () => {
      map.off('click', handleMapClick);
      map.getContainer().style.cursor = '';
    };
  }, [isDrawingSegment]);

  // 14. Render Police Dispatch Route & Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !dispatchRouteLayerGroupRef.current) return;

    dispatchRouteLayerGroupRef.current.clearLayers();
    if (!activeDispatchRoute || !activeDispatchRoute.coordinates || activeDispatchRoute.coordinates.length < 2) return;

    const coords = activeDispatchRoute.coordinates;
    const startPt = coords[0];
    const endPt = coords[coords.length - 1];

    // Response route polyline
    const routeLine = L.polyline(coords, {
      color: '#0052cc',
      weight: 6,
      opacity: 0.9,
      dashArray: '8, 8',
    });

    const routeGlow = L.polyline(coords, {
      color: '#38bdf8',
      weight: 12,
      opacity: 0.45,
    });

    // Start marker: Police Unit
    const unitIcon = L.divIcon({
      className: 'dispatch-unit-marker',
      html: `
        <div style="width: 32px; height: 32px; border-radius: 8px; background: #0052cc; border: 2px solid #fff; display: flex; align-items: center; justify-content: center; font-size: 16px; box-shadow: 0 4px 12px rgba(0,82,204,0.5);">
          🚓
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });
    const startMarker = L.marker(startPt, { icon: unitIcon });
    startMarker.bindTooltip(`🚓 Unit ${activeDispatchRoute.unitCode || 'TP-01'} (Dispatched)`, { sticky: true });

    // End marker: Target Red Zone
    const destIcon = L.divIcon({
      className: 'dispatch-dest-marker',
      html: `
        <div style="width: 32px; height: 32px; border-radius: 50%; background: #dc2626; border: 2px solid #fff; display: flex; align-items: center; justify-content: center; font-size: 16px; box-shadow: 0 0 16px #dc2626;">
          🚨
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });
    const endMarker = L.marker(endPt, { icon: destIcon });
    endMarker.bindTooltip(`🚨 Incident Destination: ${activeDispatchRoute.destinationName}`, { sticky: true });

    dispatchRouteLayerGroupRef.current.addLayer(routeGlow);
    dispatchRouteLayerGroupRef.current.addLayer(routeLine);
    dispatchRouteLayerGroupRef.current.addLayer(startMarker);
    dispatchRouteLayerGroupRef.current.addLayer(endMarker);

    // Smoothly fit bounds to encompass the complete dispatch response
    map.fitBounds(L.latLngBounds(coords), { padding: [60, 60], maxZoom: 15 });
  }, [activeDispatchRoute]);

  // 15. Render Proposed Infrastructure Alignment & Focus
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !proposalAlignmentLayerGroupRef.current) return;

    proposalAlignmentLayerGroupRef.current.clearLayers();
    if (!activeProposalAlignment) return;

    const coords = activeProposalAlignment.coordinates;
    if (!coords || coords.length < 2) return;

    // Glowing footprint
    const glow = L.polyline(coords, {
      color: '#f59e0b',
      weight: 14,
      opacity: 0.45,
      lineCap: 'round',
    });

    // Core engineering alignment
    const line = L.polyline(coords, {
      color: '#f59e0b',
      weight: 6,
      opacity: 0.95,
      lineCap: 'round',
    });

    // Centerline dashed marking
    const centerline = L.polyline(coords, {
      color: '#ffffff',
      weight: 2,
      dashArray: '5, 8',
      opacity: 0.9,
    });

    const midCoord = coords[Math.floor(coords.length / 2)];
    const badgeIcon = L.divIcon({
      className: 'infra-badge-marker',
      html: `
        <div style="padding: 4px 8px; border-radius: 6px; background: #f59e0b; color: #000; font-weight: 800; font-size: 11px; display: flex; align-items: center; gap: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.5); white-space: nowrap; border: 1.5px solid #fff;">
          🌉 ${activeProposalAlignment.title || 'Proposed Alignment'}
        </div>
      `,
      iconSize: [140, 28],
      iconAnchor: [70, 14],
    });

    const badgeMarker = L.marker(midCoord, { icon: badgeIcon });

    proposalAlignmentLayerGroupRef.current.addLayer(glow);
    proposalAlignmentLayerGroupRef.current.addLayer(line);
    proposalAlignmentLayerGroupRef.current.addLayer(centerline);
    proposalAlignmentLayerGroupRef.current.addLayer(badgeMarker);

    // Zoom specifically to proposal area bounds with high precision
    const bounds = activeProposalAlignment.bounds || L.latLngBounds(coords);
    map.fitBounds(bounds, { padding: [80, 80], maxZoom: 16 });
  }, [activeProposalAlignment]);

  const handleFinishDrawing = () => {
    if (drawnPointsRef.current.length < 2) {
      alert('Please click at least 2 points on the map to define the road segment.');
      return;
    }
    if (onSegmentDrawn) {
      onSegmentDrawn([...drawnPointsRef.current]);
    }
    drawnPointsRef.current = [];
    setPointCount(0);
    if (drawingLayerGroupRef.current) drawingLayerGroupRef.current.clearLayers();
  };

  const handleCancelDrawing = () => {
    drawnPointsRef.current = [];
    setPointCount(0);
    if (drawingLayerGroupRef.current) drawingLayerGroupRef.current.clearLayers();
    if (onSegmentDrawn) onSegmentDrawn(null);
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', flex: 1, minHeight: 0 }}>
      {/* Floating Drawing Controller Toast */}
      {isDrawingSegment && (
        <div
          style={{
            position: 'absolute',
            top: '1rem',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 35,
            padding: '0.625rem 1.25rem',
            background: 'var(--color-surface-0)',
            border: '2px solid #8b5cf6',
            borderRadius: 'var(--radius-pill)',
            boxShadow: 'var(--shadow-xl)',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1rem' }}>✏️</span>
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#8b5cf6' }}>
              Drawing Segment ({pointCount} points)
            </span>
          </div>

          <button
            onClick={handleFinishDrawing}
            className="btn btn-primary"
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
            disabled={pointCount < 2}
          >
            <span>💾 Save & Edit Properties</span>
          </button>

          <button
            onClick={handleCancelDrawing}
            className="btn btn-ghost"
            style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem' }}
          >
            ✕ Cancel
          </button>
        </div>
      )}

      <div
        ref={mapContainerRef}
        style={{
          width: '100%',
          height: '100%',
          minHeight: '100%',
          flex: 1,
          position: 'relative',
          background: '#0f172a',
        }}
      />
    </div>
  );
}
