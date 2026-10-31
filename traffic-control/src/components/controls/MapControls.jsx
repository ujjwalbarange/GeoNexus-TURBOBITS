import React, { useState } from 'react';
import { MAP_PROVIDERS } from '../../config/mapConfig';

export default function MapControls({
  onZoomIn,
  onZoomOut,
  onResetView,
  showTrafficOverlay,
  onToggleTrafficOverlay,
  selectedProviderId,
  onSelectProvider,
  onToggleFullscreen,
  isFullscreen,
}) {
  const [styleMenuOpen, setStyleMenuOpen] = useState(false);

  return (
    <div
      style={{
        position: 'absolute',
        top: '1rem',
        left: '1rem',
        zIndex: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
    >
      {/* Zoom In & Out */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--glass-bg)',
          backdropFilter: 'var(--glass-blur)',
          WebkitBackdropFilter: 'var(--glass-blur)',
          border: '1px solid var(--border-card)',
          borderRadius: '10px',
          boxShadow: 'var(--glass-shadow)',
          overflow: 'hidden',
        }}
      >
        <button
          className="btn btn-icon"
          onClick={onZoomIn}
          style={{ borderRadius: 0, border: 'none', borderBottom: '1px solid var(--border-subtle)' }}
          title="Zoom In"
        >
          ➕
        </button>
        <button
          className="btn btn-icon"
          onClick={onZoomOut}
          style={{ borderRadius: 0, border: 'none' }}
          title="Zoom Out"
        >
          ➖
        </button>
      </div>

      {/* Reset Center */}
      <button
        className="btn btn-icon"
        onClick={onResetView}
        style={{
          background: 'var(--glass-bg)',
          backdropFilter: 'var(--glass-blur)',
          WebkitBackdropFilter: 'var(--glass-blur)',
          border: '1px solid var(--border-card)',
          boxShadow: 'var(--glass-shadow)',
        }}
        title="Reset Map to City Center"
      >
        🎯
      </button>

      {/* Traffic Layer Toggle */}
      <button
        className="btn btn-icon"
        onClick={onToggleTrafficOverlay}
        style={{
          background: showTrafficOverlay ? 'linear-gradient(135deg, #0ea5e9, #2563eb)' : 'var(--glass-bg)',
          color: '#fff',
          border: '1px solid var(--border-card)',
          boxShadow: 'var(--glass-shadow)',
        }}
        title={showTrafficOverlay ? 'Hide Traffic Overlay' : 'Show Traffic Overlay'}
      >
        🚦
      </button>

      {/* Style Selector */}
      <div style={{ position: 'relative' }}>
        <button
          className="btn btn-icon"
          onClick={() => setStyleMenuOpen(!styleMenuOpen)}
          style={{
            background: styleMenuOpen ? 'var(--bg-dark-700)' : 'var(--glass-bg)',
            border: '1px solid var(--border-card)',
            boxShadow: 'var(--glass-shadow)',
          }}
          title="Select Basemap Theme"
        >
          🗺️
        </button>

        {styleMenuOpen && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: '42px',
              width: '180px',
              background: 'var(--glass-bg)',
              backdropFilter: 'var(--glass-blur)',
              WebkitBackdropFilter: 'var(--glass-blur)',
              border: '1px solid var(--border-card)',
              borderRadius: '12px',
              padding: '6px',
              boxShadow: 'var(--glass-shadow)',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-tertiary)', padding: '4px 8px', textTransform: 'uppercase' }}>
              Map Styles
            </div>
            {MAP_PROVIDERS.map((prov) => {
              const isSelected = prov.id === selectedProviderId;
              return (
                <button
                  key={prov.id}
                  onClick={() => {
                    onSelectProvider(prov.id);
                    setStyleMenuOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 8px',
                    borderRadius: '6px',
                    border: 'none',
                    background: isSelected ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                    color: isSelected ? '#38bdf8' : 'var(--text-secondary)',
                    fontFamily: 'inherit',
                    fontSize: '12px',
                    fontWeight: isSelected ? 600 : 500,
                    cursor: 'pointer',
                    textAlign: 'left',
                    width: '100%',
                  }}
                >
                  <span>{prov.icon}</span>
                  <span>{prov.shortName}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Fullscreen Mode */}
      <button
        className="btn btn-icon"
        onClick={onToggleFullscreen}
        style={{
          background: isFullscreen ? 'var(--bg-dark-700)' : 'var(--glass-bg)',
          border: '1px solid var(--border-card)',
          boxShadow: 'var(--glass-shadow)',
        }}
        title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen Map'}
      >
        {isFullscreen ? '🗗' : '🗖'}
      </button>
    </div>
  );
}
