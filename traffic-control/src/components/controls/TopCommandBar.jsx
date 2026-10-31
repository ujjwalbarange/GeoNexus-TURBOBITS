import React from 'react';
import { CITIES } from '../../config/cities';

export default function TopCommandBar({
  selectedCityId,
  activeModuleTab,
  onSelectModuleTab,
  orchestratorOutput,
  showFacilities,
  onToggleFacilities,
  showDrainage,
  onToggleDrainage,
  showZones,
  onToggleZones,
  showTrafficOverlay,
  onToggleTrafficOverlay,
}) {
  const currentCity = CITIES[selectedCityId] || CITIES.mumbai;
  const kpis = orchestratorOutput?.kpis || {};
  const highestPriority = orchestratorOutput?.highestPriority || 'NORMAL';

  const MODULE_TABS = [
    { id: 'red_zones', label: '🚦 Red Zones & Traffic', badge: kpis.activeRedZones || 0, badgeColor: '#ef4444' },
    { id: 'police_dispatch', label: '🚓 Police Dispatch', badge: kpis.dispatchRecommendationsCount || 0, badgeColor: '#38bdf8' },
    { id: 'patterns', label: '📈 Recurring Patterns', badge: kpis.recurringPatternsCount || 0, badgeColor: '#facc15' },
    { id: 'routing', label: '🚧 Closures & Alt Routes', badge: kpis.activeRestrictions || 0, badgeColor: '#f97316' },
    { id: 'infrastructure', label: '🌉 Bridge & Infra Intelligence', badge: kpis.infrastructureProposalsCount || 0, badgeColor: '#a78bfa' },
    { id: 'reports', label: '📋 Government Reports', badge: kpis.governmentReportsCount || 0, badgeColor: '#10b981' },
  ];

  return (
    <div
      style={{
        background: 'var(--bg-dark-900)',
        borderBottom: '1px solid var(--border-card)',
        padding: '0.75rem 1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.625rem',
        zIndex: 25,
      }}
    >
      {/* Top Row: Module Switcher Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
          {MODULE_TABS.map((tab) => {
            const isActive = activeModuleTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectModuleTab(tab.id)}
                style={{
                  background: isActive ? 'linear-gradient(135deg, #1e293b, #334155)' : 'rgba(255, 255, 255, 0.04)',
                  border: isActive ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
                  color: isActive ? '#fff' : 'var(--text-secondary)',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease',
                  boxShadow: isActive ? '0 2px 8px rgba(56, 189, 248, 0.25)' : 'none',
                }}
              >
                <span>{tab.label}</span>
                {tab.badge > 0 && (
                  <span
                    style={{
                      background: tab.badgeColor,
                      color: '#070a13',
                      fontSize: '10px',
                      fontWeight: 800,
                      padding: '1px 5px',
                      borderRadius: '9999px',
                    }}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Priority Status Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '4px 10px',
              borderRadius: '6px',
              background:
                highestPriority === 'P0_EMERGENCY'
                  ? 'rgba(153, 27, 27, 0.3)'
                  : highestPriority === 'P1_CRITICAL'
                  ? 'rgba(239, 68, 68, 0.2)'
                  : 'rgba(16, 185, 129, 0.15)',
              border:
                highestPriority === 'P0_EMERGENCY'
                  ? '1px solid #991b1b'
                  : highestPriority === 'P1_CRITICAL'
                  ? '1px solid #ef4444'
                  : '1px solid #10b981',
              color:
                highestPriority === 'P0_EMERGENCY'
                  ? '#f87171'
                  : highestPriority === 'P1_CRITICAL'
                  ? '#ef4444'
                  : '#10b981',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            STATUS: {highestPriority}
          </span>
        </div>
      </div>

      {/* Bottom Row: KPI Ribbon & Quick GIS Map Filters */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
          fontSize: '12px',
        }}
      >
        {/* KPI Chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <div
            style={{
              background: 'var(--bg-dark-850)',
              border: '1px solid var(--border-subtle)',
              padding: '4px 8px',
              borderRadius: '6px',
              display: 'flex',
              gap: '6px',
              alignItems: 'center',
            }}
          >
            <span style={{ color: 'var(--text-tertiary)', fontSize: '11px' }}>🚨 Red Zones:</span>
            <span style={{ fontWeight: 700, color: kpis.activeRedZones > 0 ? '#ef4444' : '#10b981' }}>
              {kpis.activeRedZones || 0}
            </span>
          </div>

          <div
            style={{
              background: 'var(--bg-dark-850)',
              border: '1px solid var(--border-subtle)',
              padding: '4px 8px',
              borderRadius: '6px',
              display: 'flex',
              gap: '6px',
              alignItems: 'center',
            }}
          >
            <span style={{ color: 'var(--text-tertiary)', fontSize: '11px' }}>👮 Available Police:</span>
            <span style={{ fontWeight: 700, color: '#38bdf8' }}>
              {kpis.availablePoliceUnits || 0} / {kpis.totalPoliceUnits || 0}
            </span>
          </div>

          <div
            style={{
              background: 'var(--bg-dark-850)',
              border: '1px solid var(--border-subtle)',
              padding: '4px 8px',
              borderRadius: '6px',
              display: 'flex',
              gap: '6px',
              alignItems: 'center',
            }}
          >
            <span style={{ color: 'var(--text-tertiary)', fontSize: '11px' }}>🚧 Closures / Diversions:</span>
            <span style={{ fontWeight: 700, color: '#f97316' }}>{kpis.activeRestrictions || 0}</span>
          </div>

          <div
            style={{
              background: 'var(--bg-dark-850)',
              border: '1px solid var(--border-subtle)',
              padding: '4px 8px',
              borderRadius: '6px',
              display: 'flex',
              gap: '6px',
              alignItems: 'center',
            }}
          >
            <span style={{ color: 'var(--text-tertiary)', fontSize: '11px' }}>🌉 Infrastructure Proposals:</span>
            <span style={{ fontWeight: 700, color: '#a78bfa' }}>{kpis.infrastructureProposalsCount || 0}</span>
          </div>

          <div
            style={{
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              padding: '4px 8px',
              borderRadius: '6px',
              fontSize: '11px',
              color: '#10b981',
              fontWeight: 600,
            }}
          >
            🛡️ Strict Manual Refresh Active (Zero background API burn)
          </div>
        </div>

        {/* Quick Map GIS Layer Checkboxes */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '11px', color: 'var(--text-secondary)' }}>
            <input type="checkbox" checked={showTrafficOverlay} onChange={onToggleTrafficOverlay} />
            <span>Traffic Overlay</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '11px', color: 'var(--text-secondary)' }}>
            <input type="checkbox" checked={showFacilities} onChange={onToggleFacilities} />
            <span>Facilities</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '11px', color: 'var(--text-secondary)' }}>
            <input type="checkbox" checked={showDrainage} onChange={onToggleDrainage} />
            <span>Drainage</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '11px', color: 'var(--text-secondary)' }}>
            <input type="checkbox" checked={showZones} onChange={onToggleZones} />
            <span>Wards</span>
          </label>
        </div>
      </div>
    </div>
  );
}
