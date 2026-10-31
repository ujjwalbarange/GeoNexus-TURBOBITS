import React from 'react';
import { TRAFFIC_LEVELS } from '../../config/mapConfig';

export default function TrafficLegend() {
  const legendItems = [
    TRAFFIC_LEVELS.FREE_FLOW,
    TRAFFIC_LEVELS.MODERATE,
    TRAFFIC_LEVELS.HEAVY,
    TRAFFIC_LEVELS.SEVERE,
    TRAFFIC_LEVELS.BLOCKED,
    TRAFFIC_LEVELS.UNKNOWN,
  ];

  return (
    <div className="info-card">
      <div className="info-card-header">
        <span>🚦 Traffic Layer Legend</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {legendItems.map((lvl) => (
          <div key={lvl.level} className="legend-item">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                className="legend-color-bar"
                style={{
                  backgroundColor: lvl.color,
                  boxShadow: `0 0 8px ${lvl.glowColor || lvl.color}`,
                }}
              />
              <div>
                <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#f8fafc' }}>
                  {lvl.label}
                </div>
                <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>
                  {lvl.description}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
