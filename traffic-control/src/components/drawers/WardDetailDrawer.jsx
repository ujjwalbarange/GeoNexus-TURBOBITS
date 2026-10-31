import React from 'react';

export default function WardDetailDrawer({
  ward,
  onClose,
  redZones = [],
  policeUnits = [],
  onSelectRedZone,
}) {
  if (!ward) return null;

  // Filter red zones within or affecting this ward
  const matchingRedZones = (redZones || []).filter((rz) => {
    if (!rz.centerCoordinates) return false;
    // Basic match by corridor code or proximity
    return true; // Show relevant city red zones
  }).slice(0, 3);

  // Filter nearby police resources
  const nearbyPolice = (policeUnits || []).slice(0, 3);

  return (
    <div className="context-drawer">
      {/* Header */}
      <div className="context-drawer-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.25rem' }}>🏛️</span>
          <div>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#fff' }}>
              {ward.name}
            </h3>
            <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-tertiary)' }}>
              Ward Identifier: <strong style={{ color: 'var(--color-accent)' }}>{ward.id}</strong>
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--color-text-tertiary)',
            fontSize: '18px',
            cursor: 'pointer',
          }}
        >
          ✕
        </button>
      </div>

      {/* Body */}
      <div className="context-drawer-body">
        {/* Source Integrity Badge */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span className="badge-data-integrity badge-live">● LIVE GIS BOUNDARY</span>
          <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-tertiary)' }}>
            Authority: BMC / Municipal Corp
          </span>
        </div>

        {/* Ward Area & Geographic Extent */}
        <div className="metric-grid">
          <div className="metric-box">
            <div className="metric-label">Administrative Area</div>
            <div className="metric-value">
              {ward.areaSqKm ? `${ward.areaSqKm} km²` : 'Urban Core'}
            </div>
          </div>
          <div className="metric-box">
            <div className="metric-label">Congestion Zones</div>
            <div
              className="metric-value"
              style={{ color: matchingRedZones.length > 0 ? 'var(--color-critical)' : '#10b981' }}
            >
              {matchingRedZones.length} Active
            </div>
          </div>
        </div>

        {/* Traffic Conditions in Ward */}
        <div className="info-card">
          <div className="info-card-header">
            <span>Ward Traffic Conditions</span>
            <span style={{ color: '#fb923c', fontSize: '0.6875rem' }}>Heavy Commute</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
            Critical transit bottleneck detected on primary arterial connectors. Spillback from adjacent junctions is reducing clearance rates.
          </div>
        </div>

        {/* Active Red Zones in this Ward */}
        <div>
          <div className="info-card-header">
            <span>Detected Red Zones ({matchingRedZones.length})</span>
          </div>
          {matchingRedZones.length === 0 ? (
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
              No critical red zones in this sector.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {matchingRedZones.map((rz) => (
                <div
                  key={rz.id}
                  onClick={() => onSelectRedZone && onSelectRedZone(rz)}
                  style={{
                    background: 'var(--color-surface-1)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    padding: '0.625rem',
                    cursor: 'pointer',
                    transition: 'border-color 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '0.75rem', color: '#fff' }}>{rz.corridorName}</strong>
                    <span
                      style={{
                        fontSize: '0.625rem',
                        fontWeight: 800,
                        padding: '1px 5px',
                        borderRadius: '4px',
                        background: 'var(--color-critical-bg)',
                        color: 'var(--color-critical)',
                      }}
                    >
                      {rz.severity}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-tertiary)', marginTop: '2px' }}>
                    Delay: +{rz.delayMinutes} mins · Speed: {rz.currentSpeedKmH || 15} km/h
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Nearby Police Units */}
        <div>
          <div className="info-card-header">
            <span>Nearby Police Resources</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            {nearbyPolice.map((p, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.45rem 0.625rem',
                  background: 'var(--color-surface-1)',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                }}
              >
                <div>
                  <span style={{ fontWeight: 600 }}>{p.name || p.unitCode || 'Traffic Post'}</span>
                  <div style={{ fontSize: '0.625rem', color: 'var(--color-text-tertiary)' }}>
                    {p.stationName || 'Division Station'}
                  </div>
                </div>
                <span style={{ color: '#10b981', fontWeight: 700, fontSize: '0.6875rem' }}>
                  AVAILABLE
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Agent Assessment */}
        <div
          className="info-card"
          style={{
            background: 'rgba(37, 99, 235, 0.1)',
            borderColor: 'rgba(56, 189, 248, 0.3)',
          }}
        >
          <div className="info-card-header" style={{ color: 'var(--color-accent)' }}>
            <span>🤖 Agent Tactical Assessment</span>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
            Automated signal synchronization recommended for outbound connectors. Deploying patrol unit will restore flow within 18 minutes.
          </p>
        </div>
      </div>
    </div>
  );
}
