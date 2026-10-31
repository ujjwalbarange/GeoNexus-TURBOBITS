import React, { useState, useMemo, useEffect } from 'react';
import { CITIES } from '../../config/cities';
import { MAP_PROVIDERS } from '../../config/mapConfig';
import { formatTimeAgo } from '../../utils/formatters';
import { themeManager } from '../../services/themeManager';
import { eventBus, EVENT_TYPES } from '../../services/eventBus';

export default function TopBar({
  selectedCityId,
  activeNavId,
  viewMode = '2D',
  onChangeViewMode,
  selectedProviderId,
  onSelectProviderId,
  onFitCity,
  onResetView,
  showLegend,
  onToggleLegend,
  onRefresh,
  loading,
  isCached,
  lastRefreshedAt,
  onOpenMobileMenu,
  onSelectSearchResult,
  redZones = [],
  policeUnits = [],
  corridors = [],
  operationalMode = 'LIVE',
  onOpenSandbox = null,
}) {
  const [currentTheme, setCurrentTheme] = useState(themeManager.getTheme());

  useEffect(() => {
    const unsub = eventBus.subscribe(EVENT_TYPES.THEME_CHANGED, (evt) => {
      setCurrentTheme(evt?.payload?.theme || themeManager.getTheme());
    });
    return unsub;
  }, []);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);

  const currentCity = CITIES[selectedCityId] || CITIES.mumbai;

  // Search Results across red zones, corridors, and police stations
  const searchResults = useMemo(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) return [];
    const q = searchQuery.toLowerCase();

    const matchedRedZones = (redZones || [])
      .filter((rz) => rz.corridorName?.toLowerCase().includes(q) || rz.id?.toLowerCase().includes(q))
      .slice(0, 3)
      .map((rz) => ({
        type: 'Red Zone',
        id: rz.id,
        title: rz.corridorName,
        subtitle: `Severity: ${rz.severity} · Delay +${rz.delayMinutes}m`,
        coords: rz.centerCoordinates,
        data: rz,
      }));

    const matchedCorridors = (corridors || [])
      .filter((c) => c.name?.toLowerCase().includes(q) || c.code?.toLowerCase().includes(q))
      .slice(0, 3)
      .map((c) => ({
        type: 'Corridor',
        id: c.code,
        title: c.name,
        subtitle: `Traffic Corridor (${c.code})`,
        coords: c.coordinates?.[0] || null,
        data: c,
      }));

    const matchedPolice = (policeUnits || [])
      .filter((p) => p.name?.toLowerCase().includes(q) || p.unitCode?.toLowerCase().includes(q))
      .slice(0, 3)
      .map((p) => ({
        type: 'Police Unit',
        id: p.unitCode || p.id,
        title: p.name || p.unitCode,
        subtitle: `Station: ${p.stationName || p.departmentName || 'Traffic Division'}`,
        coords: [p.latitude, p.longitude],
        data: p,
      }));

    return [...matchedRedZones, ...matchedCorridors, ...matchedPolice];
  }, [searchQuery, redZones, corridors, policeUnits]);

  return (
    <header className="top-command-bar">
      {/* Left: Mobile Toggle, City Emoji, Title, Search & Locality Dropdown */}
      <div className="top-bar-left">
        <button
          onClick={onOpenMobileMenu}
          className="btn-ctrl"
          style={{ display: 'none' }} /* Visible on mobile via CSS */
          title="Toggle Navigation Menu"
        >
          ☰
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.25rem' }}>
            {selectedCityId === 'mumbai' ? '🌆' : selectedCityId === 'nagpur' ? '🏛️' : '🏙️'}
          </span>
          <div>
            <h2 className="top-city-title">
              {currentCity.name} — Traffic Operations
            </h2>
            <p className="top-city-sub">Sentinel Intelligent Traffic Control Unit</p>
          </div>
        </div>

        {/* Live Search Container */}
        <div className="search-container">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSearchOpen(true);
            }}
            placeholder={`Search ${currentCity.name} corridors, red zones, police...`}
            className="search-input"
          />

          {searchOpen && searchResults.length > 0 && (
            <div className="search-dropdown">
              {searchResults.map((item) => (
                <button
                  key={`${item.type}-${item.id}`}
                  onClick={() => {
                    if (onSelectSearchResult) onSelectSearchResult(item);
                    setSearchQuery('');
                    setSearchOpen(false);
                  }}
                  className="search-dropdown-item"
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.75rem' }}>{item.title}</div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-tertiary)' }}>
                      {item.subtitle}
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: '0.625rem',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: 'rgba(56, 189, 248, 0.15)',
                      color: 'var(--color-accent)',
                    }}
                  >
                    {item.type} ↗
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right: 2D/3D Mode, Tile Styles, Fit City, Reset, Legend & Manual Refresh */}
      <div className="top-bar-controls">
        {/* 2D / 3D Canvas Switcher */}
        <div className="segmented-control">
          <button
            onClick={() => onChangeViewMode && onChangeViewMode('2D')}
            className={`segmented-btn ${viewMode === '2D' ? 'active' : ''}`}
            title="2D OpenStreetMap Canvas"
          >
            <span>🗺️</span>
            <span>2D</span>
          </button>
          <button
            onClick={() => onChangeViewMode && onChangeViewMode('3D')}
            className={`segmented-btn ${viewMode === '3D' ? 'active' : ''}`}
            title="3D Perspective Mode"
          >
            <span>⛰️</span>
            <span>3D</span>
          </button>
        </div>

        {/* Tile Provider Selector */}
        <div className="segmented-control">
          {MAP_PROVIDERS.map((provider) => (
            <button
              key={provider.id}
              onClick={() => onSelectProviderId && onSelectProviderId(provider.id)}
              className={`segmented-btn ${selectedProviderId === provider.id ? 'active' : ''}`}
              title={provider.name}
            >
              <span>{provider.icon || '🌐'}</span>
              <span style={{ display: selectedProviderId === provider.id ? 'inline' : 'none' }}>
                {provider.name}
              </span>
            </button>
          ))}
        </div>

        {/* Fit City */}
        <button onClick={onFitCity} className="btn-ctrl" title="Fit to municipal boundaries">
          <span>🎯</span>
          <span>Fit City</span>
        </button>

        {/* Reset View */}
        <button onClick={onResetView} className="btn-ctrl" title="Reset default city center & zoom">
          <span>↺</span>
          <span>Reset</span>
        </button>

        {/* Toggle Layers & Legend */}
        <button
          onClick={onToggleLegend}
          className={`btn-ctrl ${showLegend ? 'active' : ''}`}
          style={{
            borderColor: showLegend ? 'var(--color-accent)' : undefined,
            color: showLegend ? 'var(--color-accent)' : undefined,
          }}
          title="Toggle GIS Layers & Legend"
        >
          <span>📊</span>
          <span>Layers</span>
        </button>

        {/* Operational Mode Badge / Sandbox Launcher */}
        <button
          onClick={onOpenSandbox}
          className="btn-ctrl"
          style={{
            borderColor: operationalMode === 'LIVE' ? '#10b981' : operationalMode === 'HYBRID' ? '#8b5cf6' : '#f59e0b',
            color: operationalMode === 'LIVE' ? '#10b981' : operationalMode === 'HYBRID' ? '#c084fc' : '#f59e0b',
            fontWeight: 800,
            fontSize: '0.6875rem',
            padding: '4px 8px',
          }}
          title="Active Traffic Mode. Click to configure Traffic Sandbox."
        >
          <span>● {operationalMode}</span>
        </button>

        {/* Dedicated Sandbox Launcher */}
        <button
          onClick={onOpenSandbox}
          className="btn-ctrl"
          title="Open Traffic Data Sandbox & Scenario Studio"
          style={{ background: 'rgba(56, 189, 248, 0.1)', borderColor: 'var(--color-accent)', color: 'var(--color-accent)' }}
        >
          <span>🧪</span>
          <span>Sandbox</span>
        </button>

        {/* Theme Switcher Toggle (Light "Civic Horizon" / Dark "Graphite Obsidian") */}
        <button
          onClick={() => themeManager.toggleTheme()}
          className="btn-ctrl"
          title={`Switch Theme (Currently ${currentTheme === 'light' ? 'Civic Light' : 'Obsidian Dark'})`}
        >
          <span>{currentTheme === 'light' ? '🌙' : '☀️'}</span>
        </button>

        {/* Strict Explicit Refresh Button */}
        <button
          onClick={onRefresh}
          disabled={loading}
          className="btn-ctrl btn-refresh"
          title={`Manual Refresh (Zero automated background calls). Last refreshed: ${formatTimeAgo(lastRefreshedAt)}`}
        >
          <span style={{ display: 'inline-block', animation: loading ? 'spin 1s infinite linear' : undefined }}>
            🔄
          </span>
          <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
          <span
            style={{
              fontSize: '0.625rem',
              padding: '1px 4px',
              borderRadius: '4px',
              background: isCached ? 'rgba(16, 185, 129, 0.25)' : 'rgba(56, 189, 248, 0.25)',
              color: isCached ? '#10b981' : '#38bdf8',
              fontWeight: 800,
            }}
          >
            {isCached ? 'CACHE' : 'LIVE'}
          </span>
        </button>
      </div>
    </header>
  );
}
