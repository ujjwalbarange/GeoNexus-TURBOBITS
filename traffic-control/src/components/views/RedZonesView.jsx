import React, { useState } from 'react';
import { formatSpeed } from '../../utils/formatters';

export default function RedZonesView({
  orchestratorOutput,
  onSelectRedZone,
  onNavigateToMap,
}) {
  const [filterSeverity, setFilterSeverity] = useState('ALL');

  const redZones = orchestratorOutput?.detection?.redZones || [];

  const filteredRedZones = redZones.filter((rz) => {
    if (filterSeverity === 'ALL') return true;
    return rz.severity === filterSeverity;
  });

  return (
    <div className="view-panel">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>
            Red Zone Detection & Congestion Hotspots
          </h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
            Automated cluster detection identifying persistent and acute geometric bottlenecks.
          </p>
        </div>
        <span className="badge-data-integrity badge-live">● REAL-TIME TOMTOM METRICS</span>
      </div>

      {/* Severity Filter Tabs */}
      <div className="segmented-control" style={{ width: 'fit-content' }}>
        {['ALL', 'CRITICAL', 'SEVERE', 'MODERATE'].map((sev) => (
          <button
            key={sev}
            onClick={() => setFilterSeverity(sev)}
            className={`segmented-btn ${filterSeverity === sev ? 'active' : ''}`}
          >
            {sev} ({sev === 'ALL' ? redZones.length : redZones.filter((r) => r.severity === sev).length})
          </button>
        ))}
      </div>

      {/* Red Zones Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
        {filteredRedZones.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-tertiary)', gridColumn: '1 / -1' }}>
            No red zones matching "{filterSeverity}" filter.
          </div>
        ) : (
          filteredRedZones.map((rz) => {
            const currentSpeed = rz.currentSpeedKmH || 14;
            const freeFlowSpeed = rz.freeFlowSpeedKmH || 80;

            return (
              <div
                key={rz.id}
                className="info-card"
                style={{
                  background: 'var(--color-surface-0)',
                  border: '1px solid var(--color-critical-border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#fff' }}>
                      {rz.corridorName}
                    </h3>
                    <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-tertiary)' }}>
                      Incident ID: {rz.id}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: '0.625rem',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: rz.severity === 'CRITICAL' ? 'var(--color-critical-bg)' : 'var(--color-high-bg)',
                      color: rz.severity === 'CRITICAL' ? 'var(--color-critical)' : 'var(--color-high)',
                      border: '1px solid currentColor',
                    }}
                  >
                    {rz.severity}
                  </span>
                </div>

                <div className="metric-grid">
                  <div className="metric-box">
                    <div className="metric-label">Velocity Deficit</div>
                    <div className="metric-value" style={{ color: 'var(--color-critical)' }}>
                      {formatSpeed(currentSpeed)}
                    </div>
                    <div style={{ fontSize: '0.625rem', color: 'var(--color-text-tertiary)' }}>
                      Limit: {freeFlowSpeed} km/h
                    </div>
                  </div>
                  <div className="metric-box">
                    <div className="metric-label">Delay</div>
                    <div className="metric-value" style={{ color: '#fb923c' }}>
                      +{rz.delayMinutes} mins
                    </div>
                    <div style={{ fontSize: '0.625rem', color: 'var(--color-text-tertiary)' }}>
                      Queue: {rz.affectedLengthKm || 2.4} km
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
                  Choke point identified at <strong>{rz.junction || rz.corridorName}</strong>. Spillback causing lateral delay on adjacent connectors.
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                  <button
                    onClick={() => {
                      if (onSelectRedZone) onSelectRedZone(rz);
                      if (onNavigateToMap) onNavigateToMap();
                    }}
                    className="btn btn-primary"
                    style={{ flex: 1 }}
                  >
                    <span>🗺️ Inspect on Map</span>
                  </button>
                  <button
                    onClick={() => onSelectRedZone && onSelectRedZone(rz)}
                    className="btn"
                    style={{ flex: 1 }}
                  >
                    <span>⚡ Tactical Plan</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
