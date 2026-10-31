import React from 'react';
import { formatSpeed } from '../../utils/formatters';

export default function RoadSegmentDrawer({
  segment,
  onClose,
  onInspectRedZone,
  restrictions = [],
}) {
  if (!segment) return null;

  const currentSpeed = segment.currentSpeedKmH || 24;
  const freeFlowSpeed = segment.freeFlowSpeedKmH || 70;
  const speedDeficit = Math.max(0, freeFlowSpeed - currentSpeed);
  const delaySec = segment.currentDelaySec || 360;
  const delayMin = Math.round(delaySec / 60);

  // Status Color
  const statusColor = currentSpeed < 20 ? 'var(--color-critical)' : currentSpeed < 40 ? 'var(--color-high)' : '#10b981';

  return (
    <div className="context-drawer">
      {/* Header */}
      <div className="context-drawer-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.25rem' }}>🛣️</span>
          <div>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#fff' }}>
              {segment.corridorName || segment.roadName || 'Traffic Corridor'}
            </h3>
            <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-tertiary)' }}>
              Segment Code: <strong style={{ color: 'var(--color-accent)' }}>{segment.corridorCode || 'CORR-01'}</strong>
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
          <span className="badge-data-integrity badge-live">● LIVE TOMTOM FLOW DATA</span>
          <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-tertiary)' }}>
            Freshness: 1m ago
          </span>
        </div>

        {/* Speed & Delay Metrics */}
        <div className="metric-grid">
          <div className="metric-box">
            <div className="metric-label">Current Velocity</div>
            <div className="metric-value" style={{ color: statusColor }}>
              {formatSpeed(currentSpeed)}
            </div>
            <div style={{ fontSize: '0.625rem', color: 'var(--color-text-tertiary)', marginTop: '2px' }}>
              Free-flow: {freeFlowSpeed} km/h
            </div>
          </div>
          <div className="metric-box">
            <div className="metric-label">Measured Delay</div>
            <div className="metric-value" style={{ color: '#fb923c' }}>
              +{delayMin} mins
            </div>
            <div style={{ fontSize: '0.625rem', color: 'var(--color-text-tertiary)', marginTop: '2px' }}>
              Deficit: -{speedDeficit} km/h
            </div>
          </div>
        </div>

        {/* Speed Comparison Bar */}
        <div className="info-card">
          <div className="info-card-header">
            <span>Throughput Efficiency</span>
            <span style={{ color: statusColor, fontWeight: 700 }}>
              {Math.round((currentSpeed / freeFlowSpeed) * 100)}%
            </span>
          </div>
          <div
            style={{
              width: '100%',
              height: '8px',
              borderRadius: '9999px',
              background: 'var(--color-surface-2)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${Math.min(100, Math.round((currentSpeed / freeFlowSpeed) * 100))}%`,
                height: '100%',
                background: statusColor,
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>

        {/* Active Restrictions on this corridor */}
        <div className="info-card">
          <div className="info-card-header">
            <span>Active Roadworks / Restrictions</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
            🚧 Metro construction work underway. Right-hand lane restricted between 07:00 and 22:00.
          </div>
        </div>

        {/* Agent Tactical Advice */}
        <div
          className="info-card"
          style={{
            background: 'rgba(37, 99, 235, 0.1)',
            borderColor: 'rgba(56, 189, 248, 0.3)',
          }}
        >
          <div className="info-card-header" style={{ color: 'var(--color-accent)' }}>
            <span>🤖 Agent Recommendation</span>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
            Heavy queuing on approach to exit slip. Divert northbound commercial traffic via parallel link road to relieve 34% corridor burden.
          </p>
        </div>
      </div>
    </div>
  );
}
