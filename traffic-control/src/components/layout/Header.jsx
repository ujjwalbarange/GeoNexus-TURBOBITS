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
  isCached,
  onRefresh,
}) {
  const currentCity = CITIES[selectedCityId] || CITIES.mumbai;
  const isOnline = trafficData?.isLiveFeed && trafficData?.status === 'ONLINE';

  return (
    <header className="top-header" style={{ height: '60px' }}>
      {/* Left: Branding & Metro Jurisdiction */}
      <div className="brand-section">
        <div className="brand-icon-wrapper" title="Autonomous Traffic Operations Center">
          🚦
        </div>
        <div>
          <div className="brand-title">
            <span>TRAFFIC CONTROL AI</span>
            <span
              style={{
                fontSize: '0.625rem',
                padding: '2px 6px',
                borderRadius: '4px',
                background: 'rgba(56, 189, 248, 0.15)',
                color: '#38bdf8',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                fontWeight: 700,
              }}
            >
              MISSION CONTROL
            </span>
          </div>
          <div className="brand-subtitle">
            {currentCity.region}
          </div>
        </div>
      </div>

      {/* Center: City Switcher (Top of the app) */}
      <div className="header-center">
        <CitySelector selectedCityId={selectedCityId} onSelectCity={onSelectCity} />
      </div>

      {/* Right: API Quota Protection & Manual Refresh Button */}
      <div className="header-actions">
        {/* Cache / Live State Badge */}
        <div
          className="status-badge"
          style={{
            borderColor: isCached ? 'rgba(56, 189, 248, 0.3)' : 'rgba(16, 185, 129, 0.3)',
            color: isCached ? '#38bdf8' : '#10b981',
            background: isCached ? 'rgba(56, 189, 248, 0.1)' : 'rgba(16, 185, 129, 0.1)',
          }}
          title={isCached ? 'Loaded from local persistent cache (Zero API usage)' : 'Live data loaded from TomTom'}
        >
          <span>{isCached ? '💾 CACHED' : '🟢 LIVE API'}</span>
          <span style={{ color: 'var(--text-tertiary)', fontSize: '10px' }}>
            ({formatTimeAgo(lastRefreshedAt)})
          </span>
        </div>

        {/* Strict Explicit Refresh Button */}
        <button
          className="btn btn-primary"
          onClick={onRefresh}
          disabled={loading}
          style={{
            padding: '6px 14px',
            fontSize: '0.75rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
          title="Click to fetch latest TomTom traffic data. Strictly manual to prevent API quota burn."
        >
          <span style={{ display: 'inline-block', animation: loading ? 'spin 1s linear infinite' : 'none' }}>
            🔄
          </span>
          <span>{loading ? 'Calling TomTom API...' : 'Refresh Traffic Data'}</span>
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
