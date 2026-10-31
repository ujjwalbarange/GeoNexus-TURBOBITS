import React from 'react';
import { formatTimeAgo } from '../../utils/formatters';

export default function TelemetryRibbon({
  orchestratorOutput,
  trafficData,
  isCached,
  lastRefreshedAt,
  agentStatus = 'IDLE',
}) {
  const redZones = orchestratorOutput?.detection?.redZones || [];
  const policeRecommendations = orchestratorOutput?.policeDispatch?.recommendations || [];
  const criticalCount = redZones.filter((r) => r.severity === 'CRITICAL').length;

  let totalDelayMins = 0;
  redZones.forEach((rz) => {
    totalDelayMins += rz.delayMinutes || 0;
  });

  return (
    <div className="telemetry-ribbon">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {/* Active Red Zones */}
        <div className="telemetry-item">
          <span className="telemetry-label">🚨 Red Zones:</span>
          <span
            className="telemetry-val"
            style={{ color: redZones.length > 0 ? 'var(--color-critical)' : '#10b981' }}
          >
            {redZones.length} ({criticalCount} Critical)
          </span>
        </div>

        {/* Total Network Delay */}
        <div className="telemetry-item">
          <span className="telemetry-label">⏱️ Total Delay:</span>
          <span className="telemetry-val" style={{ color: '#fb923c' }}>
            +{totalDelayMins} mins
          </span>
        </div>

        {/* Police Readiness */}
        <div className="telemetry-item">
          <span className="telemetry-label">🚓 Dispatch Queue:</span>
          <span className="telemetry-val" style={{ color: '#38bdf8' }}>
            {policeRecommendations.length} Units Ready
          </span>
        </div>

        {/* Corridors Monitored */}
        <div className="telemetry-item">
          <span className="telemetry-label">🛣️ Corridors:</span>
          <span className="telemetry-val">
            {trafficData?.segments?.length || 6} Monitored
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {/* Data Freshness & Attribution */}
        <div className="telemetry-item">
          <span className="telemetry-label">Data:</span>
          <span
            className="telemetry-val"
            style={{ color: isCached ? '#10b981' : '#38bdf8' }}
          >
            {isCached ? 'CACHED' : 'LIVE'} ({formatTimeAgo(lastRefreshedAt)})
          </span>
        </div>

        {/* AI Agent Status Pill */}
        <div
          className="telemetry-item"
          style={{
            background: 'rgba(37, 99, 235, 0.15)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
          }}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: agentStatus === 'ERROR' ? '#ef4444' : agentStatus === 'ANALYZING' ? '#fb923c' : '#10b981',
              boxShadow: '0 0 6px currentColor',
            }}
          />
          <span className="telemetry-label">Agent:</span>
          <span className="telemetry-val" style={{ color: '#38bdf8' }}>
            {agentStatus}
          </span>
        </div>
      </div>
    </div>
  );
}
