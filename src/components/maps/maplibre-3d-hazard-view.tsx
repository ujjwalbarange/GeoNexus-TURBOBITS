/* ════════════════════════════════════════════════════════
   Sentinel City Intelligence — 3D Hazard Terrain Canvas
   Powered by MapLibre GL with hardware-accelerated WebGL rendering
   Features:
   - 55° perspective pitch and terrain tilt
   - 3D extruded H3 hexagonal risk columns (height proportional to Pre-Fire Risk Score)
   - 3D active thermal anomaly markers with pulse animation
   - Fire brigade & forest ranger emergency stations
   - Directional fire spread vectors
   - Dynamic popup inspection for 3D cells and hotspots
   ════════════════════════════════════════════════════════ */

"use client";

import React, { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

interface MapLibre3DHazardViewProps {
  center: [number, number]; // [lat, lon]
  zoom?: number;
  pitch?: number;
  bearing?: number;
  cityName: string;
  hazardMode?: "ALL" | "FLOOD" | "FIRE";
  showFireDetections?: boolean;
  showFireRiskHeatmap?: boolean;
  showFireStations?: boolean;
  showFireSpreadVector?: boolean;
  fireObservations?: any[];
  fireRiskGeoJSON?: any;
  fireSpreadVectors?: any[];
  emergencyStations?: any[];
  onProposeDispatch?: (obs: any) => void;
  onSelectH3Cell?: (cellProperties: any) => void;
}

export default function MapLibre3DHazardView({
  center,
  zoom = 12,
  pitch = 55,
  bearing = -15,
  cityName,
  hazardMode = "ALL",
  showFireDetections = true,
  showFireRiskHeatmap = true,
  showFireStations = true,
  showFireSpreadVector = true,
  fireObservations = [],
  fireRiskGeoJSON,
  fireSpreadVectors = [],
  emergencyStations = [],
  onProposeDispatch,
  onSelectH3Cell,
}: MapLibre3DHazardViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [currentPitch, setCurrentPitch] = useState(pitch);

  // Initialize MapLibre GL Map
  useEffect(() => {
    if (!containerRef.current) return;

    // Center in MapLibre is [lng, lat]
    const mapCenter: [number, number] = [center[1], center[0]];

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        sources: {
          "carto-dark": {
            type: "raster",
            tiles: [
              "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
              "https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
              "https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
              "https://d.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
            ],
            tileSize: 256,
            attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap contributors',
          },
        },
        layers: [
          {
            id: "carto-dark-tiles",
            type: "raster",
            source: "carto-dark",
            minzoom: 0,
            maxzoom: 20,
          },
        ],
      },
      center: mapCenter,
      zoom: zoom,
      pitch: pitch,
      bearing: bearing,
      maxPitch: 80,
    });

    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right");
    map.addControl(new maplibregl.FullscreenControl(), "top-right");

    map.on("load", () => {
      setMapLoaded(true);
    });

    map.on("pitch", () => {
      setCurrentPitch(Math.round(map.getPitch()));
    });

    mapRef.current = map;

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update center when prop changes
  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.easeTo({
      center: [center[1], center[0]],
      duration: 1200,
    });
  }, [center]);

  // Manage Extruded 3D H3 Hexagon Columns
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    const sourceId = "h3-fire-risk-source";
    const layerId = "h3-fire-risk-extrusion";

    // Clean up existing layer/source if toggled off or invalid
    if (map.getLayer(layerId)) map.removeLayer(layerId);
    if (map.getSource(sourceId)) map.removeSource(sourceId);

    if (
      (hazardMode === "ALL" || hazardMode === "FIRE") &&
      showFireRiskHeatmap &&
      fireRiskGeoJSON &&
      fireRiskGeoJSON.features &&
      fireRiskGeoJSON.features.length > 0
    ) {
      map.addSource(sourceId, {
        type: "geojson",
        data: fireRiskGeoJSON,
      });

      map.addLayer({
        id: layerId,
        type: "fill-extrusion",
        source: sourceId,
        paint: {
          // Color based on feature property 'color'
          "fill-extrusion-color": [
            "case",
            ["has", "color"],
            ["get", "color"],
            "#eab308",
          ],
          // Height scaled by riskScore: 0 to 100 scaled to 0 to 2500m
          "fill-extrusion-height": [
            "*",
            ["coalesce", ["get", "riskScore"], 10],
            22,
          ],
          "fill-extrusion-base": 0,
          "fill-extrusion-opacity": 0.82,
        },
      });

      // Click event on 3D hex columns
      map.on("click", layerId, (e: any) => {
        if (!e.features || e.features.length === 0) return;
        const feat = e.features[0];
        const p = feat.properties as any;
        onSelectH3Cell?.(p);

        new maplibregl.Popup({ closeButton: true, maxWidth: "300px" })
          .setLngLat(e.lngLat)
          .setHTML(`
            <div style="font-family: system-ui, sans-serif; font-size: 12px; padding: 4px; color: #0f172a;">
              <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 6px;">
                <span style="font-weight: 700; font-size: 11px; text-transform: uppercase; color: #64748b;">3D H3 Risk Column</span>
                <span style="background: ${p.color || "#eab308"}; color: white; padding: 2px 6px; border-radius: 4px; font-weight: 700; font-family: monospace;">
                  ${p.riskScore}/100 • ${p.displayLabel || "EVALUATED"}
                </span>
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 6px; font-size: 11px; background: #f8fafc; padding: 6px; border-radius: 6px;">
                <div>🌡️ Temp: <b>${p.temp || 32}°C</b></div>
                <div>💧 Humidity: <b>${p.rh || 45}%</b></div>
                <div>💨 Wind: <b>${p.windKmh || 18} km/h</b></div>
                <div>☀️ Dry Spell: <b>${p.drySpellDays ?? 12}d</b></div>
              </div>
              <div style="font-size: 10px; color: #94a3b8; font-style: italic;">
                Hex: <code style="color: #6366f1;">${p.h3Index}</code>
              </div>
            </div>
          `)
          .addTo(map);
      });

      map.on("mouseenter", layerId, () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", layerId, () => {
        map.getCanvas().style.cursor = "";
      });
    }
  }, [mapLoaded, hazardMode, showFireRiskHeatmap, fireRiskGeoJSON]);

  // Manage Spread Vector Lines in 3D
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    const sourceId = "fire-spread-vectors-source";
    const layerId = "fire-spread-vectors-line";

    if (map.getLayer(layerId)) map.removeLayer(layerId);
    if (map.getSource(sourceId)) map.removeSource(sourceId);

    if (
      (hazardMode === "ALL" || hazardMode === "FIRE") &&
      showFireSpreadVector &&
      fireSpreadVectors &&
      fireSpreadVectors.length > 0
    ) {
      const lineFeatures = fireSpreadVectors
        .filter((v) => v && v.originLat && v.originLon)
        .map((vec) => {
          const rad = (vec.predictedSpreadDirectionDeg * Math.PI) / 180;
          const lengthKm = 2.5;
          const endLat = vec.originLat + (lengthKm / 111.0) * Math.cos(rad);
          const endLon =
            vec.originLon +
            (lengthKm / (111.0 * Math.cos((vec.originLat * Math.PI) / 180))) * Math.sin(rad);

          return {
            type: "Feature" as const,
            geometry: {
              type: "LineString" as const,
              coordinates: [
                [vec.originLon, vec.originLat],
                [endLon, endLat],
              ],
            },
            properties: {
              heading: vec.predictedSpreadDirectionDeg,
              speedKmh: vec.predictedSpreadSpeedKmh,
              uncertainty: vec.uncertaintyConeDegrees,
            },
          };
        });

      map.addSource(sourceId, {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: lineFeatures,
        },
      });

      map.addLayer({
        id: layerId,
        type: "line",
        source: sourceId,
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": "#ea580c",
          "line-width": 4,
          "line-dasharray": [2, 2],
        },
      });
    }
  }, [mapLoaded, hazardMode, showFireSpreadVector, fireSpreadVectors]);

  // Manage 3D HTML Markers (Fire Hotspots & Stations)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    // Clear existing markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Add Active Fire Hotspots
    if ((hazardMode === "ALL" || hazardMode === "FIRE") && showFireDetections) {
      fireObservations.forEach((obs) => {
        if (!obs.latitude || !obs.longitude) return;

        const el = document.createElement("div");
        el.className = "fire-hotspot-marker-3d";
        el.innerHTML = `
          <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
            <div style="position: absolute; inset: -4px; border-radius: 9999px; background: rgba(239, 68, 68, 0.5); animation: pulse 1.6s infinite;"></div>
            <div style="width: 28px; height: 28px; border-radius: 9999px; background: radial-gradient(circle, #f97316 0%, #dc2626 100%); border: 2px solid white; box-shadow: 0 0 16px rgba(239, 68, 68, 0.9); display: flex; align-items: center; justify-content: center; font-size: 15px;">🔥</div>
          </div>
        `;

        const popup = new maplibregl.Popup({ offset: 25, maxWidth: "320px" }).setHTML(`
          <div style="font-family: system-ui, sans-serif; font-size: 12px; padding: 4px; color: #0f172a;">
            <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #fee2e2; padding-bottom: 6px; margin-bottom: 6px;">
              <span style="font-weight: 800; color: #b91c1c; display: flex; align-items: center; gap: 4px;">🔥 Active Thermal Hotspot</span>
              <span style="background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; padding: 2px 6px; border-radius: 4px; font-weight: 700; font-size: 10px;">
                ${obs.confidenceCategory || "NOMINAL"}
              </span>
            </div>
            <div style="background: #fff1f2; border: 1px solid #fecdd3; border-radius: 6px; padding: 8px; margin-bottom: 8px; font-size: 11px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
                <span style="color: #64748b;">Source Sensor:</span>
                <b>${obs.satelliteInstrument}</b>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
                <span style="color: #64748b;">Brightness Temp:</span>
                <b>${obs.brightnessKelvin ? (obs.brightnessKelvin - 273.15).toFixed(1) + "°C" : "N/A"}</b>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
                <span style="color: #64748b;">Fire Radiative Power:</span>
                <b>${obs.frpMegawatts ? obs.frpMegawatts.toFixed(1) + " MW" : "N/A"}</b>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #64748b;">Coordinates:</span>
                <span style="font-family: monospace;">${obs.latitude.toFixed(4)}, ${obs.longitude.toFixed(4)}</span>
              </div>
            </div>
            <button id="dispatch-btn-${obs.id}" style="width: 100%; background: #dc2626; color: white; border: none; padding: 7px; border-radius: 6px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; font-size: 11px;">
              🚨 Propose Emergency Dispatch
            </button>
          </div>
        `);

        popup.on("open", () => {
          const btn = document.getElementById(`dispatch-btn-${obs.id}`);
          if (btn) {
            btn.onclick = () => {
              onProposeDispatch?.(obs);
            };
          }
        });

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([obs.longitude, obs.latitude])
          .setPopup(popup)
          .addTo(map);

        markersRef.current.push(marker);
      });
    }

    // Add Emergency Stations
    if ((hazardMode === "ALL" || hazardMode === "FIRE") && showFireStations) {
      emergencyStations.forEach((stn) => {
        if (!stn.latitude || !stn.longitude) return;

        const isForest = stn.stationType === "FOREST_RANGE";
        const iconEmoji = isForest ? "🌲" : "🚒";
        const borderColor = isForest ? "#16a34a" : "#dc2626";

        const el = document.createElement("div");
        el.className = "emergency-station-marker-3d";
        el.innerHTML = `
          <div style="
            width: 26px;
            height: 26px;
            border-radius: 6px;
            background: white;
            border: 2px solid ${borderColor};
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 13px;
            cursor: pointer;
          ">${iconEmoji}</div>
        `;

        const popup = new maplibregl.Popup({ offset: 20, maxWidth: "280px" }).setHTML(`
          <div style="font-family: system-ui, sans-serif; font-size: 12px; padding: 4px; color: #0f172a;">
            <div style="font-weight: 800; font-size: 13px; margin-bottom: 2px; color: #0f172a;">${iconEmoji} ${stn.stationName}</div>
            <div style="font-size: 10px; color: #64748b; font-weight: 600; text-transform: uppercase; margin-bottom: 6px;">${stn.department}</div>
            ${stn.contactPhone ? `<div style="font-size: 11px; margin-bottom: 4px;">📞 <b>${stn.contactPhone}</b></div>` : ""}
            <div style="font-size: 10px; color: #94a3b8; font-family: monospace;">📍 ${stn.latitude.toFixed(4)}, ${stn.longitude.toFixed(4)}</div>
          </div>
        `);

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([stn.longitude, stn.latitude])
          .setPopup(popup)
          .addTo(map);

        markersRef.current.push(marker);
      });
    }
  }, [mapLoaded, hazardMode, showFireDetections, showFireStations, fireObservations, emergencyStations]);

  // Reset Pitch to 55°
  const handleResetPitch = () => {
    if (!mapRef.current) return;
    mapRef.current.easeTo({ pitch: 55, bearing: -15, duration: 800 });
  };

  // Rotate camera 45°
  const handleRotateCamera = () => {
    if (!mapRef.current) return;
    const nextBearing = (mapRef.current.getBearing() + 45) % 360;
    mapRef.current.easeTo({ bearing: nextBearing, duration: 800 });
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-950">
      <div ref={containerRef} className="w-full h-full" />

      {/* 3D Pitch & Camera Overlay Controls */}
      <div className="absolute bottom-6 left-6 z-10 flex items-center gap-2 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 px-3 py-2 rounded-2xl shadow-2xl text-white text-xs font-sans">
        <span className="flex items-center gap-1.5 font-bold text-amber-400">
          <span>⛰️</span>
          <span>3D Pitch:</span>
          <span className="font-mono text-white bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
            {currentPitch}°
          </span>
        </span>

        <div className="w-[1px] h-4 bg-slate-700 mx-1" />

        <button
          onClick={handleResetPitch}
          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg font-bold transition-all cursor-pointer text-[11px]"
          title="Reset to 55° perspective pitch"
        >
          Reset Pitch (55°)
        </button>

        <button
          onClick={handleRotateCamera}
          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg font-bold transition-all cursor-pointer text-[11px]"
          title="Rotate camera 45° clockwise"
        >
          ↻ Rotate
        </button>
      </div>

      {/* 3D Extrusion Height Scale Legend */}
      {showFireRiskHeatmap && (
        <div className="absolute bottom-6 right-6 z-10 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 p-3 rounded-2xl shadow-2xl text-white text-xs font-sans space-y-1.5">
          <div className="font-bold text-[11px] text-slate-300 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-700/60 pb-1">
            <span>📊</span>
            <span>3D Risk Extrusion Height</span>
          </div>
          <div className="flex items-center justify-between gap-3 text-[10px]">
            <span className="text-slate-400">Low Risk (0-25)</span>
            <span className="font-mono text-emerald-400">0 - 500m</span>
          </div>
          <div className="flex items-center justify-between gap-3 text-[10px]">
            <span className="text-slate-400">Moderate (26-50)</span>
            <span className="font-mono text-amber-400">500 - 1,100m</span>
          </div>
          <div className="flex items-center justify-between gap-3 text-[10px]">
            <span className="text-slate-400">High Risk (51-75)</span>
            <span className="font-mono text-orange-400">1,100 - 1,650m</span>
          </div>
          <div className="flex items-center justify-between gap-3 text-[10px]">
            <span className="text-slate-400">Extreme (76-100)</span>
            <span className="font-mono text-rose-500 font-bold">1,650 - 2,200m</span>
          </div>
        </div>
      )}
    </div>
  );
}
