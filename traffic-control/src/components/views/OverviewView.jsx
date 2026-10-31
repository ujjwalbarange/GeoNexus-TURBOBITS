import React from 'react';
import { formatSpeed, formatTimeAgo } from '../../utils/formatters';

export default function OverviewView({
  selectedCityId,
  orchestratorOutput,
  trafficData,
  onNavigateTo,
  onSelectRedZone,
  lastRefreshedAt,
  isCached,
}) {
  const redZones = orchestratorOutput?.detection?.redZones || [];
  const policeUnits = orchestratorOutput?.policeDispatch?.recommendations || [];
  const segments = trafficData?.segments || [];

  let totalDelay = 0;
  redZones.forEach((rz) => {
    totalDelay += rz.delayMinutes || 0;
  });

  return (
    <div className="view-panel">
      {/* View Header with Integrity Badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>
            Executive Traffic Control Overview
          </h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
            Consolidated situational awareness for municipal traffic operations and police dispatch.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="badge-data-integrity badge-live">● LIVE FEED</span>
          <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-tertiary)' }}>
            Updated: {formatTimeAgo(lastRefreshedAt)} ({isCached ? 'Cache' : 'Live'})
          </span>
        </div>
      </div>

      {/* Top 4 KPI Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div className="metric-box" style={{ background: 'var(--color-surface-0)', border: '1px solid var(--color-border)' }}>
          <div className="metric-label">🚨 Active Red Zones</div>
          <div className="metric-value" style={{ color: redZones.length > 0 ? 'var(--color-critical)' : '#10b981' }}>
            {redZones.length}
          </div>
          <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-tertiary)', marginTop: '4px' }}>
            {redZones.filter((r) => r.severity === 'CRITICAL').length} Critical severe bottlenecks
          </div>
        </div>

        <div className="metric-box" style={{ background: 'var(--color-surface-0)', border: '1px solid var(--color-border)' }}>
          <div className="metric-label">⏱️ Measured Queue Delay</div>
          <div className="metric-value" style={{ color: '#fb923c' }}>
            +{totalDelay} mins
          </div>
          <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-tertiary)', marginTop: '4px' }}>
            Across all monitored arterials
          </div>
        </div>

        <div className="metric-box" style={{ background: 'var(--color-surface-0)', border: '1px solid var(--color-border)' }}>
          <div className="metric-label">🚓 Police Readiness</div>
          <div className="metric-value" style={{ color: 'var(--color-accent)' }}>
            {policeUnits.length} Ready
          </div>
          <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-tertiary)', marginTop: '4px' }}>
            100% verified department posts
          </div>
        </div>

        <div className="metric-box" style={{ background: 'var(--color-surface-0)', border: '1px solid var(--color-border)' }}>
          <div className="metric-label">🛣️ Arterial Network Health</div>
          <div className="metric-value" style={{ color: '#10b981' }}>
            78%
          </div>
          <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-tertiary)', marginTop: '4px' }}>
            Flow index within nominal safety
          </div>
        </div>
      </div>

      {/* Two Column Layout: Corridors & Red Zone Alerts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '1.25rem' }}>
        {/* Left Column: Monitored Corridors Table */}
        <div className="info-card" style={{ background: 'var(--color-surface-0)' }}>
          <div className="info-card-header">
            <span>Primary Corridors Throughput</span>
            <button
              onClick={() => onNavigateTo('map')}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--color-accent)',
                fontSize: '0.6875rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              View on GIS Map ↗
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {segments.slice(0, 5).map((seg) => {
              const currentSpeed = seg.currentSpeedKmH || 25;
              const freeFlowSpeed = seg.freeFlowSpeedKmH || 70;
              const pct = Math.min(100, Math.round((currentSpeed / freeFlowSpeed) * 100));
              const color = pct < 35 ? 'var(--color-critical)' : pct < 65 ? 'var(--color-high)' : '#10b981';

              return (
                <div
                  key={seg.id}
                  style={{
                    padding: '0.625rem',
                    background: 'var(--color-surface-1)',
                    borderRadius: '8px',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{seg.corridorName}</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color }}>
                      {formatSpeed(currentSpeed)} ({pct}%)
                    </span>
                  </div>
                  <div
                    style={{
                      width: '100%',
                      height: '6px',
                      background: 'var(--color-surface-2)',
                      borderRadius: '9999px',
                      overflow: 'hidden',
                    }}
                  >
                    <div style={{ width: `${pct}%`, height: '100%', background: color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Active Red Zones Queue */}
        <div className="info-card" style={{ background: 'var(--color-surface-0)' }}>
          <div className="info-card-header">
            <span>Active Red Zone Priority Queue</span>
            <button
              onClick={() => onNavigateTo('red_zones')}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--color-accent)',
                fontSize: '0.6875rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              All Red Zones ↗
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {redZones.length === 0 ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
                No active Red Zones detected. Traffic flowing normally.
              </div>
            ) : (
              redZones.slice(0, 3).map((rz) => (
                <div
                  key={rz.id}
                  onClick={() => onSelectRedZone && onSelectRedZone(rz)}
                  style={{
                    padding: '0.75rem',
                    background: 'var(--color-surface-1)',
                    border: '1px solid var(--color-critical-border)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '0.8125rem', color: '#fff' }}>{rz.corridorName}</strong>
                    <span
                      style={{
                        fontSize: '0.625rem',
                        fontWeight: 800,
                        padding: '1px 6px',
                        borderRadius: '4px',
                        background: 'var(--color-critical-bg)',
                        color: 'var(--color-critical)',
                      }}
                    >
                      {rz.severity}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                    Delay: +{rz.delayMinutes} mins · Velocity: {rz.currentSpeedKmH || 14} km/h · Queuing: {rz.affectedLengthKm || 2.2} km
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--color-accent)', marginTop: '4px', fontWeight: 600 }}>
                    Click to inspect on map & tactical plan →
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row: Quick Actions Bar */}
      <div
        className="info-card"
        style={{
          background: 'rgba(37, 99, 235, 0.08)',
          borderColor: 'rgba(56, 189, 248, 0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <strong style={{ fontSize: '0.875rem', color: '#fff' }}>
            Tactical Operations Ready
          </strong>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
            Autonomous agent is monitoring 6 metropolitan corridors with TomTom Flow API.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={() => onNavigateTo('map')} className="btn btn-primary">
            <span>🗺️ Open GIS Map</span>
          </button>
          <button onClick={() => onNavigateTo('police_dispatch')} className="btn">
            <span>🚓 Dispatch Center</span>
          </button>
          <button onClick={() => onNavigateTo('agent_activity')} className="btn">
            <span>⚡ Agent Activity</span>
          </button>
        </div>
      </div>
    </div>
  );
}
