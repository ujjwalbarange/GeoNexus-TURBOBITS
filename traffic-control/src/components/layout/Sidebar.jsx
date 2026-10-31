import React from 'react';
import { CITIES } from '../../config/cities';
import { formatTimeAgo } from '../../utils/formatters';

export const NAVIGATION_ITEMS = [
  { id: 'overview', label: 'Overview', icon: '🏛️' },
  { id: 'map', label: 'Live Traffic Map', icon: '🗺️' },
  { id: 'red_zones', label: 'Red Zone Detection', icon: '🚨' },
  { id: 'police_dispatch', label: 'Police Dispatch', icon: '🚓' },
  { id: 'patterns', label: 'Traffic Intelligence', icon: '📈' },
  { id: 'routing', label: 'Route Optimization', icon: '🧭' },
  { id: 'infrastructure', label: 'Infrastructure Intelligence', icon: '🌉' },
  { id: 'reports', label: 'Government Reports', icon: '📋' },
  { id: 'agent_activity', label: 'Agent Activity', icon: '⚡' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
];

export default function Sidebar({
  activeNavId,
  onSelectNav,
  selectedCityId,
  onSelectCity,
  orchestratorOutput,
  lastRefreshedAt,
  isCached,
  isOpenMobile,
  onCloseMobile,
}) {
  const redZoneCount = orchestratorOutput?.detection?.redZones?.length || 0;
  const dispatchCount = orchestratorOutput?.policeDispatch?.recommendations?.length || 0;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(3px)',
            zIndex: 40,
          }}
        />
      )}

      <aside
        className="app-sidebar"
        style={{
          transform: isOpenMobile ? 'translateX(0)' : undefined,
          display: isOpenMobile ? 'flex' : undefined,
        }}
      >
        {/* Brand Header */}
        <div className="sidebar-brand">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div className="brand-badge">🚦</div>
            <div>
              <span className="brand-title">SENTINEL</span>
              <span className="brand-sub">Traffic Control Unit</span>
            </div>
          </div>
          {isOpenMobile && (
            <button
              onClick={onCloseMobile}
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
          )}
        </div>

        {/* Jurisdiction Switcher */}
        <div className="jurisdiction-box">
          <div className="jurisdiction-label-row">
            <span className="jurisdiction-title">Jurisdiction</span>
            <span className="jurisdiction-code">{selectedCityId}</span>
          </div>
          <select
            value={selectedCityId}
            onChange={(e) => onSelectCity(e.target.value)}
            className="jurisdiction-select"
          >
            <option value="mumbai">🌆 Mumbai (BMC)</option>
            <option value="nagpur">🏛️ Nagpur (NMC)</option>
            <option value="pune">🏙️ Pune (PMC)</option>
          </select>
        </div>

        {/* Navigation Items */}
        <nav className="sidebar-nav">
          {NAVIGATION_ITEMS.map((item) => {
            const isActive = activeNavId === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectNav(item.id);
                  if (onCloseMobile) onCloseMobile();
                }}
                className={`nav-link-item ${isActive ? 'active' : ''}`}
              >
                {isActive && <span className="nav-active-indicator" />}
                <span className="nav-link-icon">{item.icon}</span>
                <span className="nav-link-label">{item.label}</span>

                {/* Badges for active events */}
                {item.id === 'red_zones' && redZoneCount > 0 && (
                  <span
                    className="nav-link-badge"
                    style={{ background: 'var(--color-critical)' }}
                  >
                    {redZoneCount}
                  </span>
                )}
                {item.id === 'police_dispatch' && dispatchCount > 0 && (
                  <span
                    className="nav-link-badge"
                    style={{ background: 'var(--color-primary)' }}
                  >
                    {dispatchCount}
                  </span>
                )}
                {item.id === 'agent_activity' && (
                  <span
                    style={{
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      background: '#10b981',
                      boxShadow: '0 0 6px #10b981',
                    }}
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="sidebar-footer">
          <div className="footer-status-row">
            <span>Cache Status:</span>
            <span style={{ color: isCached ? '#10b981' : '#38bdf8', fontWeight: 700 }}>
              {isCached ? '● LOCAL CACHE' : '○ LIVE SYNC'}
            </span>
          </div>
          <div className="footer-status-row">
            <span>Last Sync:</span>
            <span>{formatTimeAgo(lastRefreshedAt)}</span>
          </div>
          <div className="footer-agent-pill">
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: '#10b981',
                animation: 'pulse-ring 2s infinite',
              }}
            />
            <span>Agent: Autonomous Online</span>
          </div>
        </div>
      </aside>
    </>
  );
}
