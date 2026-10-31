import React, { useState } from 'react';
import TrafficMap from '../map/TrafficMap';
import WardDetailDrawer from '../drawers/WardDetailDrawer';
import RoadSegmentDrawer from '../drawers/RoadSegmentDrawer';
import RedZoneDetailDrawer from '../drawers/RedZoneDetailDrawer';
import TrafficConditionEditorDrawer from '../sandbox/TrafficConditionEditorDrawer';
import SimulationTimelineScrubber from '../sandbox/SimulationTimelineScrubber';
import { trafficStore, OPERATIONAL_MODES } from '../../services/trafficStore';

export default function MapView({
  selectedCityId,
  trafficData,
  orchestratorOutput,
  selectedProviderId,
  fitTrigger,
  resetTrigger,
  focusCoords,
  focusTrigger,
  showLegend,
  onToggleLegend,
  onNavigateTo,
  isActive = true,
  // Props for sandbox drawing and visual alignments
  isDrawingSegment = false,
  onFinishDrawingSegment = null,
  activeDispatchRoute = null,
  activeProposalAlignment = null,
  currentMode = OPERATIONAL_MODES.LIVE,
}) {
  // Layer Toggles
  const [showZones, setShowZones] = useState(true);
  const [showFacilities, setShowFacilities] = useState(true);
  const [showDrainage, setShowDrainage] = useState(true);
  const [showTrafficOverlay, setShowTrafficOverlay] = useState(true);

  // Selected Entities
  const [selectedWard, setSelectedWard] = useState(null);
  const [selectedRoad, setSelectedRoad] = useState(null);
  const [selectedRedZone, setSelectedRedZone] = useState(null);
  const [editingSegment, setEditingSegment] = useState(null);

  const redZones = orchestratorOutput?.detection?.redZones || [];
  const policeUnits = orchestratorOutput?.policeDispatch?.recommendations || [];

  const handleSelectWard = (wardData) => {
    setSelectedRoad(null);
    setSelectedRedZone(null);
    setEditingSegment(null);
    setSelectedWard(wardData);
  };

  const handleSelectRoad = (roadData) => {
    setSelectedWard(null);
    setSelectedRedZone(null);
    // In Simulation or Hybrid mode, open condition editor directly
    if (currentMode === OPERATIONAL_MODES.SIMULATION || currentMode === OPERATIONAL_MODES.HYBRID) {
      setEditingSegment(roadData);
      setSelectedRoad(null);
    } else {
      setSelectedRoad(roadData);
      setEditingSegment(null);
    }
  };

  const handleSelectRedZone = (rzData) => {
    setSelectedWard(null);
    setSelectedRoad(null);
    setEditingSegment(null);
    setSelectedRedZone(rzData);
  };

  const handleSegmentDrawn = (coords) => {
    if (!coords || coords.length < 2) {
      if (onFinishDrawingSegment) onFinishDrawingSegment();
      return;
    }

    // Create custom segment in trafficStore
    const newSeg = trafficStore.addCustomDrawnSegment(selectedCityId, {
      coordinates: coords,
      corridorName: `Custom Segment ${Date.now().toString().slice(-4)}`,
      congestionLevel: 'SEVERE',
      currentSpeedKmH: 12,
      freeFlowSpeedKmH: 50,
    });

    if (onFinishDrawingSegment) onFinishDrawingSegment();
    setEditingSegment(newSeg);
  };

  return (
    <div style={{ width: '100%', height: '100%', flex: 1, minHeight: 0, position: 'relative', overflow: 'hidden', display: 'flex' }}>
      {/* 1. Leaflet Interactive GIS Map Container */}
      <TrafficMap
        selectedCityId={selectedCityId}
        trafficData={trafficData}
        selectedSegment={editingSegment || selectedRoad}
        onSelectSegment={handleSelectRoad}
        focusTrigger={focusTrigger}
        focusCoords={focusCoords}
        showFacilities={showFacilities}
        showDrainage={showDrainage}
        showZones={showZones}
        showTrafficOverlay={showTrafficOverlay}
        redZones={redZones}
        onSelectRedZone={handleSelectRedZone}
        onSelectWard={handleSelectWard}
        selectedProviderId={selectedProviderId}
        fitTrigger={fitTrigger}
        resetTrigger={resetTrigger}
        isActive={isActive}
        isDrawingSegment={isDrawingSegment}
        onSegmentDrawn={handleSegmentDrawn}
        activeDispatchRoute={activeDispatchRoute}
        activeProposalAlignment={activeProposalAlignment}
      />

      {/* 2. Floating Simulation Timeline Scrubber (When in Simulation or Hybrid Mode) */}
      {(currentMode === OPERATIONAL_MODES.SIMULATION || currentMode === OPERATIONAL_MODES.HYBRID) && (
        <SimulationTimelineScrubber
          cityId={selectedCityId}
          onTimeChange={() => {}}
        />
      )}

      {/* 3. Floating Layers & Legend Drawer (Collapsible) */}
      {showLegend && (
        <div
          className="hud-panel hud-top-left"
          style={{
            width: '280px',
            padding: '1rem',
            background: 'var(--color-surface-0)',
            border: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '0.75rem',
              borderBottom: '1px solid var(--color-divider)',
              paddingBottom: '0.5rem',
            }}
          >
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              GIS Layers & Visibility
            </span>
            <button
              onClick={onToggleLegend}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--color-text-tertiary)',
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              ✕
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {/* Ward Boundaries Toggle */}
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.75rem',
                cursor: 'pointer',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ width: '12px', height: '12px', border: '1.5px dashed #3b82f6', borderRadius: '2px', background: 'rgba(59, 130, 246, 0.2)' }} />
                <span>Municipal Wards</span>
              </span>
              <input
                type="checkbox"
                checked={showZones}
                onChange={(e) => setShowZones(e.target.checked)}
                style={{ accentColor: 'var(--color-primary)' }}
              />
            </label>

            {/* TomTom Traffic Raster Flow Toggle */}
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.75rem',
                cursor: 'pointer',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '2px', background: 'linear-gradient(90deg, #10b981 0%, #ef4444 100%)' }} />
                <span>TomTom Flow Heatmap</span>
              </span>
              <input
                type="checkbox"
                checked={showTrafficOverlay}
                onChange={(e) => setShowTrafficOverlay(e.target.checked)}
                style={{ accentColor: 'var(--color-primary)' }}
              />
            </label>

            {/* Police Posts Toggle */}
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.75rem',
                cursor: 'pointer',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>🚓</span>
                <span>Verified Police Posts</span>
              </span>
              <input
                type="checkbox"
                checked={showFacilities}
                onChange={(e) => setShowFacilities(e.target.checked)}
                style={{ accentColor: 'var(--color-primary)' }}
              />
            </label>

            {/* Drainage Corridors Toggle */}
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.75rem',
                cursor: 'pointer',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ width: '12px', height: '3px', background: '#06b6d4' }} />
                <span>Stormwater Drainage</span>
              </span>
              <input
                type="checkbox"
                checked={showDrainage}
                onChange={(e) => setShowDrainage(e.target.checked)}
                style={{ accentColor: 'var(--color-primary)' }}
              />
            </label>
          </div>

          {/* Traffic Velocity Legend */}
          <div style={{ marginTop: '0.875rem', borderTop: '1px solid var(--color-divider)', paddingTop: '0.625rem' }}>
            <span style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-tertiary)' }}>
              Velocity Index
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.6875rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
                  <span>Free Flow (&gt; 55 km/h)</span>
                </span>
                <span style={{ color: 'var(--color-text-tertiary)' }}>Normal</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.6875rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#fb923c' }} />
                  <span>Moderate Delay (25-55)</span>
                </span>
                <span style={{ color: 'var(--color-text-tertiary)' }}>Friction</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.6875rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#dc2626' }} />
                  <span>Severe Red Zone (&lt; 25)</span>
                </span>
                <span style={{ color: 'var(--color-critical)', fontWeight: 700 }}>Choked</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Contextual Side Drawers */}
      {selectedWard && (
        <WardDetailDrawer
          ward={selectedWard}
          onClose={() => setSelectedWard(null)}
          redZones={redZones}
          policeUnits={policeUnits}
          onSelectRedZone={handleSelectRedZone}
        />
      )}

      {selectedRoad && (
        <RoadSegmentDrawer
          segment={selectedRoad}
          onClose={() => setSelectedRoad(null)}
          onInspectRedZone={handleSelectRedZone}
        />
      )}

      {selectedRedZone && (
        <RedZoneDetailDrawer
          redZone={selectedRedZone}
          onClose={() => setSelectedRedZone(null)}
          onDispatchPolice={() => onNavigateTo && onNavigateTo('police_dispatch')}
          onInspectRoute={() => onNavigateTo && onNavigateTo('routing')}
        />
      )}

      {/* 5. Live Traffic Condition Editor Drawer (Sandbox Mode) */}
      {editingSegment && (
        <TrafficConditionEditorDrawer
          segment={editingSegment}
          cityId={selectedCityId}
          onClose={() => setEditingSegment(null)}
          onUpdate={(updatedProps) => {
            setEditingSegment((prev) => ({ ...prev, ...updatedProps }));
          }}
          onDelete={() => setEditingSegment(null)}
          onCreateRedZone={() => {
            if (onNavigateTo) onNavigateTo('red_zones');
          }}
        />
      )}
    </div>
  );
}
