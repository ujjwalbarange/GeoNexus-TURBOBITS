import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../../styles/map.css';
import { CITIES } from '../../config/cities';
import { MAP_PROVIDERS, DEFAULT_MAP_PROVIDER_ID } from '../../config/mapConfig';
import { TrafficMapLayerManager } from '../../services/trafficLayer';
import { trafficApiClient } from '../../services/trafficApi';
import MapControls from '../controls/MapControls';

export default function TrafficMap({
  selectedCityId,
  trafficData,
  selectedSegment,
  onSelectSegment,
  focusTrigger,
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const baseTileLayerRef = useRef(null);
  const tomtomTileLayerRef = useRef(null);
  const trafficLayerManagerRef = useRef(null);

  const [selectedProviderId, setSelectedProviderId] = useState(DEFAULT_MAP_PROVIDER_ID);
  const [showTrafficOverlay, setShowTrafficOverlay] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const currentCity = CITIES[selectedCityId] || CITIES.mumbai;

  // 1. Initialize Map Instance on Mount
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const initialCity = CITIES[selectedCityId] || CITIES.mumbai;
    const provider = MAP_PROVIDERS.find((p) => p.id === selectedProviderId) || MAP_PROVIDERS[0];

    // Create Map with Canvas Renderer for smooth 60fps performance
    const map = L.map(mapContainerRef.current, {
      center: initialCity.center,
      zoom: initialCity.defaultZoom,
      minZoom: 9,
      maxZoom: 19,
      zoomControl: false, // Custom controls used
      preferCanvas: true,
      attributionControl: true,
    });

    // Add Base Tile Layer
    const baseTileLayer = L.tileLayer(provider.url, {
      subdomains: provider.subdomains || 'abc',
      maxZoom: provider.maxZoom || 19,
      attribution: provider.attribution,
    }).addTo(map);

    baseTileLayerRef.current = baseTileLayer;

    // Add TomTom Live Flow Overlay Tile Layer (if configured)
    const tomtomUrl = trafficApiClient.getTrafficTileUrl('relative0');
    if (tomtomUrl) {
      const tomtomTileLayer = L.tileLayer(tomtomUrl, {
        maxZoom: 19,
        opacity: 0.85,
        attribution: '&copy; <a href="https://www.tomtom.com" target="_blank" rel="noreferrer">TomTom</a>',
      }).addTo(map);
      tomtomTileLayerRef.current = tomtomTileLayer;
    }

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

    // Ensure base tile stays below TomTom traffic tile overlay
    newBaseTileLayer.addTo(map);
    if (tomtomTileLayerRef.current && map.hasLayer(tomtomTileLayerRef.current)) {
      tomtomTileLayerRef.current.bringToFront();
    }

    baseTileLayerRef.current = newBaseTileLayer;
  }, [selectedProviderId]);

  // 4. Toggle TomTom Flow Tile Layer + Vector Layers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // A. TomTom raster tile overlay toggle
    if (tomtomTileLayerRef.current) {
      if (showTrafficOverlay && !map.hasLayer(tomtomTileLayerRef.current)) {
        map.addLayer(tomtomTileLayerRef.current);
        tomtomTileLayerRef.current.bringToFront();
      } else if (!showTrafficOverlay && map.hasLayer(tomtomTileLayerRef.current)) {
        map.removeLayer(tomtomTileLayerRef.current);
      }
    }

    // B. Interactive corridor vectors
    const manager = trafficLayerManagerRef.current;
    if (!manager) return;

    if (!showTrafficOverlay) {
      manager.clear();
      return;
    }

    const segments = trafficData?.segments || [];
    manager.renderSegments(segments, selectedSegment?.id || null);
  }, [trafficData, showTrafficOverlay, selectedSegment]);

  // 5. Handle external Focus Trigger on segment
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

  // Map Control Actions
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
      {/* Map Controls */}
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

      {/* Actual Map DOM target */}
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
