import React from 'react';
import CitySelector from '../controls/CitySelector';
import { CITIES } from '../../config/cities';
import { formatTimeAgo, formatTimestamp } from '../../utils/formatters';

export default function Header({
  selectedCityId,
  onSelectCity,
  trafficData,
  lastRefreshedAt,
  loading,
  onRefresh,
  isAutoRefresh,
  onToggleAutoRefresh,
  sidebarOpen,
  onToggleSidebar,
}) {
  const currentCity = CITIES[selectedCityId] || CITIES.mumbai;
  const isOnline = trafficData?.isLiveFeed && trafficData?.status === 'ONLINE';

  return (
    <header className="top-header">
      {/* Left: Branding */}
      <div className="brand-section">
        <div className="brand-icon-wrapper" title="Traffic Operations Center">
          🚦
        </div>
        <div>
          <div className="brand-title">
            <span>TRAFFIC CONTROL</span>
            <span
              style={{
                fontSize: '0.6875rem',
                padding: '2px 6px',
                borderRadius: '4px',
                background: 'rgba(56, 189, 248, 0.15)',
                color: '#38bdf8',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                fontWeight: 600,
              }}
            >
              STANDALONE OPS
            </span>
          </div>
          <div className="brand-subtitle">
            {currentCity.region}
          </div>
        </div>
      </div>

      {/* Center: City Switcher */}
      <div className="header-center">
        <CitySelector selectedCityId={selectedCityId} onSelectCity={onSelectCity} />
      </div>

      {/* Right: Telemetry & Controls */}
      <div className="header-actions">
        {/* Status Badge */}
        <div
          className="status-badge"
          style={{
            borderColor: isOnline ? 'rgba(16, 185, 129, 0.3)' : 'rgba(234, 179, 8, 0.3)',
            color: isOnline ? '#10b981' : '#facc15',
          }}
          title={trafficData?.statusMessage || 'API Telemetry Status'}
        >
          <span
            className="status-pulse-dot"
            style={{
              backgroundColor: isOnline ? '#10b981' : '#facc15',
              color: isOnline ? '#10b981' : '#facc15',
            }}
          />
          <span>{isOnline ? 'LIVE FEED ACTIVE' : 'AWAITING TRAFFIC API'}</span>
        </div>

        {/* Last Updated Timestamp */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            fontSize: '0.6875rem',
            color: 'var(--text-tertiary)',
            fontFamily: "'JetBrains Mono', monospace",
          }}
          title={`Last poll: ${formatTimestamp(lastRefreshedAt)}`}
        >
          <span style={{ color: 'var(--text-secondary)' }}>
            UPDATED: {formatTimeAgo(lastRefreshedAt)}
          </span>
          <span style={{ fontSize: '0.625rem' }}>
            AUTO-POLL: {isAutoRefresh ? '30s' : 'OFF'}
          </span>
        </div>

        {/* Refresh Button */}
        <button
          className="btn btn-icon"
          onClick={onRefresh}
          disabled={loading}
          title="Force immediate traffic telemetry refresh"
        >
          <span style={{ display: 'inline-block', animation: loading ? 'spin 1s linear infinite' : 'none' }}>
            🔄
          </span>
        </button>

        {/* Sidebar Panel Toggle */}
        <button
          className={`btn ${sidebarOpen ? 'btn-primary' : ''}`}
          onClick={onToggleSidebar}
          title="Toggle Traffic Operations Panel"
        >
          <span>📊</span>
          <span style={{ display: 'none', minWidth: '60px' }}>Ops Panel</span>
        </button>
      </div>

      <style>{`
        @keyframes spin {
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </header>
  );
}
