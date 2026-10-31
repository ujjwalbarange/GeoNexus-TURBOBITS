import React, { useState } from 'react';
import { trafficStore, OPERATIONAL_MODES, BUILT_IN_SCENARIOS } from '../../services/trafficStore';

export default function TrafficSandboxModal({
  isOpen,
  onClose,
  cityId,
  currentMode,
  onModeChange,
  isDrawingSegment,
  onToggleDrawSegment,
  onCreateRedZoneClick,
}) {
  if (!isOpen) return null;

  const [thresholds, setThresholds] = useState(trafficStore.getThresholds());
  const [importStatus, setImportStatus] = useState(null);
  const [selectedScenarioId, setSelectedScenarioId] = useState('');

  const handleModeSelect = (mode) => {
    trafficStore.setMode(mode);
    if (onModeChange) onModeChange(mode);
  };

  const handleThresholdChange = (key, val) => {
    const updated = { ...thresholds, [key]: Number(val) };
    setThresholds(updated);
    trafficStore.setThresholds(updated);
  };

  const handleLoadScenario = (scenId) => {
    if (!scenId) return;
    const ok = trafficStore.loadScenario(scenId);
    if (ok) {
      setSelectedScenarioId(scenId);
      setImportStatus({ success: true, message: `Loaded scenario: ${BUILT_IN_SCENARIOS[scenId].title}` });
      setTimeout(() => setImportStatus(null), 4000);
    }
  };

  const handleExportJson = () => {
    const jsonStr = trafficStore.exportScenario(cityId, `${cityId.toUpperCase()} Traffic Simulation Snapshot`);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sentinel_${cityId}_traffic_scenario_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      const res = trafficStore.importScenario(content);
      setImportStatus(res);
      setTimeout(() => setImportStatus(null), 5000);
    };
    reader.readAsText(file);
  };

  const handleResetSimulation = () => {
    trafficStore.resetAllSimulation(cityId);
    setImportStatus({ success: true, message: 'All simulated overrides and custom lines reset to baseline.' });
    setTimeout(() => setImportStatus(null), 3500);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(6px)',
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--color-surface-0)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-xl)',
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-xl)',
          overflow: 'hidden',
          color: 'var(--color-text-primary)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--color-divider)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.5rem' }}>🧪</span>
            <div>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 800 }}>
                Traffic Data Sandbox & Simulation Lab
              </h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
                Active Jurisdiction: <strong style={{ color: 'var(--color-primary)' }}>{cityId.toUpperCase()}</strong>
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--color-text-tertiary)',
              fontSize: '20px',
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Notification Alert */}
          {importStatus && (
            <div
              style={{
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                background: importStatus.success ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                border: `1px solid ${importStatus.success ? '#10b981' : '#ef4444'}`,
                color: importStatus.success ? '#10b981' : '#ef4444',
                fontSize: '0.8125rem',
                fontWeight: 600,
              }}
            >
              {importStatus.message}
            </div>
          )}

          {/* 1. Operational Data Source Mode Selection */}
          <div>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              1. Operational Data Source Mode
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.75rem' }}>
              Switch how traffic conditions are sourced across the entire platform. Original live data records are never overwritten.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
              {/* Mode A: LIVE */}
              <div
                onClick={() => handleModeSelect(OPERATIONAL_MODES.LIVE)}
                style={{
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  border: `2px solid ${currentMode === OPERATIONAL_MODES.LIVE ? '#10b981' : 'var(--color-border)'}`,
                  background: currentMode === OPERATIONAL_MODES.LIVE ? 'rgba(16, 185, 129, 0.08)' : 'var(--color-surface-1)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.25rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 800, fontSize: '0.8125rem', color: '#10b981' }}>MODE A: LIVE</span>
                  {currentMode === OPERATIONAL_MODES.LIVE && <span>✓</span>}
                </div>
                <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-secondary)' }}>
                  Fetches live traffic from API/cache. Real road observations only.
                </span>
              </div>

              {/* Mode B: SIMULATION */}
              <div
                onClick={() => handleModeSelect(OPERATIONAL_MODES.SIMULATION)}
                style={{
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  border: `2px solid ${currentMode === OPERATIONAL_MODES.SIMULATION ? '#f59e0b' : 'var(--color-border)'}`,
                  background: currentMode === OPERATIONAL_MODES.SIMULATION ? 'rgba(245, 158, 11, 0.08)' : 'var(--color-surface-1)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.25rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 800, fontSize: '0.8125rem', color: '#f59e0b' }}>MODE B: SIMULATION</span>
                  {currentMode === OPERATIONAL_MODES.SIMULATION && <span>✓</span>}
                </div>
                <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-secondary)' }}>
                  Full manual simulation control. Draw custom links & test scenarios.
                </span>
              </div>

              {/* Mode C: HYBRID */}
              <div
                onClick={() => handleModeSelect(OPERATIONAL_MODES.HYBRID)}
                style={{
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  border: `2px solid ${currentMode === OPERATIONAL_MODES.HYBRID ? '#8b5cf6' : 'var(--color-border)'}`,
                  background: currentMode === OPERATIONAL_MODES.HYBRID ? 'rgba(139, 92, 246, 0.08)' : 'var(--color-surface-1)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.25rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 800, fontSize: '0.8125rem', color: '#8b5cf6' }}>MODE C: HYBRID</span>
                  {currentMode === OPERATIONAL_MODES.HYBRID && <span>✓</span>}
                </div>
                <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-secondary)' }}>
                  Live baseline feeds with selective simulated road overrides.
                </span>
              </div>
            </div>
          </div>

          {/* 2. Interactive Map Tools (Drawing & Red Zone Creation) */}
          <div>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              2. Interactive Traffic Line Tools
            </h3>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => {
                  onToggleDrawSegment();
                  onClose();
                }}
                className={`btn ${isDrawingSegment ? 'btn-critical' : 'btn-primary'}`}
              >
                <span>{isDrawingSegment ? '🛑 Stop Drawing Points' : '✏️ Draw Custom Traffic Segment'}</span>
              </button>

              <button
                onClick={() => {
                  onCreateRedZoneClick();
                  onClose();
                }}
                className="btn btn-critical"
              >
                <span>🚨 Create Red Zone on Map</span>
              </button>

              <button
                onClick={handleResetSimulation}
                className="btn btn-outline"
              >
                <span>↺ Reset Simulation to Default</span>
              </button>
            </div>
            <p style={{ fontSize: '0.6875rem', color: 'var(--color-text-tertiary)', marginTop: '0.5rem' }}>
              Clicking "Draw Custom Traffic Segment" enables click-to-draw on the Live Traffic Map. Click points to outline a polyline and double-click to finalize.
            </p>
          </div>

          {/* 3. Configurable Red Zone Detection Thresholds */}
          <div style={{ background: 'var(--color-surface-1)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              3. Detection Threshold Tuning (Red Zone Engine)
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.6875rem', color: 'var(--color-text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Critical Ratio (Standstill)</span>
                  <strong>{thresholds.criticalRatio}</strong>
                </label>
                <input
                  type="range"
                  min="0.05"
                  max="0.20"
                  step="0.01"
                  value={thresholds.criticalRatio}
                  onChange={(e) => handleThresholdChange('criticalRatio', e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.6875rem', color: 'var(--color-text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Severe Ratio (Gridlock)</span>
                  <strong>{thresholds.severeRatio}</strong>
                </label>
                <input
                  type="range"
                  min="0.15"
                  max="0.40"
                  step="0.01"
                  value={thresholds.severeRatio}
                  onChange={(e) => handleThresholdChange('severeRatio', e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.6875rem', color: 'var(--color-text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Standstill Velocity Trigger</span>
                  <strong>{thresholds.standstillSpeedKmH} km/h</strong>
                </label>
                <input
                  type="range"
                  min="2"
                  max="10"
                  step="1"
                  value={thresholds.standstillSpeedKmH}
                  onChange={(e) => handleThresholdChange('standstillSpeedKmH', e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.6875rem', color: 'var(--color-text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Critical Delay Threshold</span>
                  <strong>{thresholds.criticalDelayMins} mins</strong>
                </label>
                <input
                  type="range"
                  min="5"
                  max="45"
                  step="5"
                  value={thresholds.criticalDelayMins}
                  onChange={(e) => handleThresholdChange('criticalDelayMins', e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          </div>

          {/* 4. Pre-Packaged Scenarios & JSON Import/Export */}
          <div>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              4. Scenario Management & Portability
            </h3>
            
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <select
                value={selectedScenarioId}
                onChange={(e) => handleLoadScenario(e.target.value)}
                className="jurisdiction-select"
                style={{ flex: 1, padding: '0.5rem' }}
              >
                <option value="">📂 Select Built-in Scenario...</option>
                {Object.values(BUILT_IN_SCENARIOS).map((scen) => (
                  <option key={scen.id} value={scen.id}>
                    {scen.title} ({scen.cityId.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <button onClick={handleExportJson} className="btn btn-secondary">
                <span>⬇️ Export Scenario JSON</span>
              </button>

              <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
                <span>⬆️ Import Scenario JSON</span>
                <input type="file" accept=".json" onChange={handleImportFile} style={{ display: 'none' }} />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
