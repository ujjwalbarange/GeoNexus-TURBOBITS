import React from 'react';
import { TRAFFIC_LEVELS } from '../../config/mapConfig';
import { formatSpeed, formatTimestamp } from '../../utils/formatters';

export default function TrafficSegmentCard({ segment, onClose, onFocus }) {
  if (!segment) return null;

  const level = TRAFFIC_LEVELS[segment.congestionLevel] || TRAFFIC_LEVELS.UNKNOWN;

  return (
    <div
      className="info-card"
      style={{
        borderLeft: `4px solid ${segment.color}`,
        background: 'var(--bg-dark-850)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: '4px',
                background: 'rgba(255, 255, 255, 0.1)',
                color: '#fff',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {segment.corridorCode}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{segment.type}</span>
          </div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff', marginTop: '4px' }}>
            {segment.corridorName}
          </div>
        </div>

        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-tertiary)',
            cursor: 'pointer',
            fontSize: '14px',
            padding: '2px',
          }}
          title="Deselect corridor"
        >
          ✕
        </button>
      </div>

      {/* Metrics Row */}
      <div className="metric-grid" style={{ margin: '10px 0' }}>
        <div className="metric-box">
          <div className="metric-label">CURRENT SPEED</div>
          <div className="metric-value" style={{ color: segment.color }}>
            {formatSpeed(segment.currentSpeedKmH)}
          </div>
        </div>

        <div className="metric-box">
          <div className="metric-label">SPEED LIMIT / FF</div>
          <div className="metric-value">
            {formatSpeed(segment.freeFlowSpeedKmH)}
          </div>
        </div>
      </div>

      {/* Status & Diagnostics */}
      <div
        style={{
          background: 'var(--bg-dark-900)',
          borderRadius: '8px',
          padding: '8px 10px',
          fontSize: '11px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--text-tertiary)' }}>Condition:</span>
          <span style={{ fontWeight: 600, color: segment.color }}>{level.label}</span>
        </div>

        {segment.delaySeconds !== null && (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-tertiary)' }}>Estimated Delay:</span>
            <span style={{ fontWeight: 600, color: segment.delaySeconds > 300 ? '#ef4444' : '#f8fafc' }}>
              {Math.round(segment.delaySeconds / 60)} mins
            </span>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--text-tertiary)' }}>Data Source:</span>
          <span style={{ color: 'var(--text-secondary)' }}>{segment.source}</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--text-tertiary)' }}>Telemetry Stamp:</span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-tertiary)' }}>
            {formatTimestamp(segment.lastUpdated)}
          </span>
        </div>
      </div>

      {onFocus && (
        <button
          className="btn"
          style={{ width: '100%', marginTop: '10px', fontSize: '11px' }}
          onClick={() => onFocus(segment)}
        >
          <span>🎯 Focus Map on Corridor</span>
        </button>
      )}
    </div>
  );
}
