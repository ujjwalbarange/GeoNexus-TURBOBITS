import React, { useState } from 'react';
import TrafficLegend from '../traffic/TrafficLegend';
import TrafficSegmentCard from '../traffic/TrafficSegmentCard';
import { CITIES } from '../../config/cities';
import { formatTimeAgo, formatTimestamp, formatSpeed } from '../../utils/formatters';

export default function TrafficInfoPanel({
  selectedCityId,
  trafficData,
  lastRefreshedAt,
  loading,
  isOpen,
  onClose,
  selectedSegment,
  onSelectSegment,
  onFocusSegment,
  customEndpoint,
  onUpdateEndpoint,
  showFacilities,
  onToggleFacilities,
  showDrainage,
  onToggleDrainage,
  showZones,
  onToggleZones,
}) {
  const [endpointInput, setEndpointInput] = useState(customEndpoint || '');
  const [showConfig, setShowConfig] = useState(false);

  const city = CITIES[selectedCityId] || CITIES.mumbai;
  const isOnline = trafficData?.isLiveFeed && trafficData?.status === 'ONLINE';

  const handleSaveEndpoint = (e) => {
    e.preventDefault();
    onUpdateEndpoint(endpointInput);
    setShowConfig(false);
  };

  return (
    <aside className={`sidebar-panel ${!isOpen ? 'collapsed' : ''}`} aria-label="Traffic Operations Panel">
      <div className="sidebar-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.25rem' }}>📊</span>
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#fff' }}>
              {city.name} Operations
            </div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>
              OpenStreetMap & Root Services
            </div>
          </div>
        </div>

        <button
          className="btn btn-icon"
          onClick={onClose}
          style={{ width: '28px', height: '28px' }}
          title="Close panel"
        >
          ✕
        </button>
      </div>

      <div className="sidebar-content">
        {/* City Summary Card */}
        <div className="info-card">
          <div className="info-card-header">
            <span>Citywide Metrics</span>
            <span
              style={{
                fontSize: '10px',
                padding: '2px 6px',
                borderRadius: '4px',
                background: isOnline ? 'rgba(16, 185, 129, 0.15)' : 'rgba(234, 179, 8, 0.15)',
                color: isOnline ? '#10b981' : '#facc15',
                fontWeight: 600,
              }}
            >
              {isOnline ? 'TOMTOM LIVE' : 'STANDBY'}
            </span>
          </div>

          <div className="metric-grid">
            <div className="metric-box">
              <div className="metric-label">MEASURED CORRIDORS</div>
              <div className="metric-value">{trafficData?.totalSegments || city.corridors.length}</div>
            </div>

            <div className="metric-box">
              <div className="metric-label">ACTIVE SECTORS</div>
              <div className="metric-value" style={{ color: trafficData?.measuredSegments > 0 ? '#10b981' : 'var(--text-tertiary)' }}>
                {trafficData?.measuredSegments || 0}
              </div>
            </div>

            <div className="metric-box">
              <div className="metric-label">AVG CORRIDOR SPEED</div>
              <div className="metric-value" style={{ color: trafficData?.averageSpeedKmH ? '#38bdf8' : 'var(--text-tertiary)' }}>
                {trafficData?.averageSpeedKmH ? formatSpeed(trafficData.averageSpeedKmH) : '—'}
              </div>
            </div>

            <div className="metric-box">
              <div className="metric-label">CONGESTION INDEX</div>
              <div className="metric-value" style={{ color: trafficData?.cityCongestionIndex ? '#f97316' : 'var(--text-tertiary)' }}>
                {trafficData?.cityCongestionIndex !== null && trafficData?.cityCongestionIndex !== undefined
                  ? `${trafficData.cityCongestionIndex}%`
                  : '—'}
              </div>
            </div>
          </div>

          <div style={{ marginTop: '10px', fontSize: '11px', color: 'var(--text-tertiary)', display: 'flex', justifyContent: 'space-between' }}>
            <span>Last Polled:</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-secondary)' }}>
              {formatTimeAgo(lastRefreshedAt)} ({formatTimestamp(lastRefreshedAt)})
            </span>
          </div>
        </div>

        {/* Root Project GIS Infrastructure Services */}
        <div className="info-card">
          <div className="info-card-header">
            <span>🏛️ Root Project Map Services</span>
            <span style={{ fontSize: '10px', color: '#10b981', fontWeight: 600 }}>CONNECTED</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* Facilities toggle */}
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', cursor: 'pointer' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>🏢</span>
                <span>Emergency Facilities & Posts</span>
              </span>
              <input
                type="checkbox"
                checked={showFacilities}
                onChange={onToggleFacilities}
                style={{ cursor: 'pointer' }}
              />
            </label>

            {/* Drainage / Waterways toggle */}
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', cursor: 'pointer' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>🚰</span>
                <span>Drainage & Waterway Networks</span>
              </span>
              <input
                type="checkbox"
                checked={showDrainage}
                onChange={onToggleDrainage}
                style={{ cursor: 'pointer' }}
              />
            </label>

            {/* Zonal Boundaries toggle */}
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', cursor: 'pointer' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>🗺️</span>
                <span>Municipal Ward Boundaries</span>
              </span>
              <input
                type="checkbox"
                checked={showZones}
                onChange={onToggleZones}
                style={{ cursor: 'pointer' }}
              />
            </label>
          </div>
        </div>

        {/* Selected Segment Inspection (if active) */}
        {selectedSegment && (
          <TrafficSegmentCard
            segment={selectedSegment}
            onClose={() => onSelectSegment(null)}
            onFocus={onFocusSegment}
          />
        )}

        {/* API Telemetry & Connection Status */}
        <div className="info-card">
          <div className="info-card-header">
            <span>📡 Live TomTom Traffic Feed</span>
            <button
              onClick={() => setShowConfig(!showConfig)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#38bdf8',
                fontSize: '11px',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              {showConfig ? 'Hide Config' : 'Configure URL'}
            </button>
          </div>

          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            {trafficData?.statusMessage || 'TomTom flow engine active.'}
          </div>

          {showConfig && (
            <form onSubmit={handleSaveEndpoint} style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                Live Traffic API Endpoint URL:
              </label>
              <input
                type="url"
                value={endpointInput}
                onChange={(e) => setEndpointInput(e.target.value)}
                placeholder="https://api.traffic-provider.com/v1/live"
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-card)',
                  background: 'var(--bg-dark-900)',
                  color: '#fff',
                  fontSize: '12px',
                  fontFamily: "'JetBrains Mono', monospace",
                  outline: 'none',
                }}
              />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, fontSize: '11px' }}>
                  Save & Connect
                </button>
                <button
                  type="button"
                  className="btn"
                  style={{ fontSize: '11px' }}
                  onClick={() => {
                    setEndpointInput('');
                    onUpdateEndpoint('');
                  }}
                >
                  Clear
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Active Corridors List */}
        <div className="info-card">
          <div className="info-card-header">
            <span>🛣️ Key Corridors ({city.corridors.length})</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto' }}>
            {trafficData?.segments?.map((seg) => {
              const isSelected = selectedSegment?.id === seg.id;
              return (
                <div
                  key={seg.id}
                  onClick={() => onSelectSegment(seg)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    background: isSelected ? 'rgba(56, 189, 248, 0.15)' : 'var(--bg-dark-900)',
                    border: isSelected ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.05)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: seg.color,
                        boxShadow: `0 0 6px ${seg.color}`,
                        flexShrink: 0,
                      }}
                    />
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: '#fff' }}>
                        {seg.corridorCode}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', maxWidth: '170px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {seg.corridorName}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '11px', fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", color: seg.color }}>
                      {formatSpeed(seg.currentSpeedKmH)}
                    </div>
                    <div style={{ fontSize: '9px', color: 'var(--text-tertiary)' }}>
                      {seg.freeFlowSpeedKmH ? `Limit: ${seg.freeFlowSpeedKmH}` : ''}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <TrafficLegend />
      </div>
    </aside>
  );
}
