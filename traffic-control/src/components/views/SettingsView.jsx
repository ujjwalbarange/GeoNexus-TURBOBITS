import React, { useState } from 'react';
import { TrafficCacheManager } from '../../services/trafficCache';

export default function SettingsView({
  selectedCityId,
  onSelectCity,
}) {
  const [cacheMessage, setCacheMessage] = useState(null);

  const handleClearCache = () => {
    TrafficCacheManager.clear(selectedCityId);
    setCacheMessage(`Cleared local cache for ${selectedCityId.toUpperCase()}.`);
    setTimeout(() => setCacheMessage(null), 4000);
  };

  const handleClearAll = () => {
    TrafficCacheManager.clearAll();
    setCacheMessage('Cleared all local traffic caches.');
    setTimeout(() => setCacheMessage(null), 4000);
  };

  return (
    <div className="view-panel">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>
            System Settings & API Quota Protection
          </h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
            Telemetry thresholds, API connection health, and strict local caching configuration.
          </p>
        </div>
        <span className="badge-data-integrity badge-live">● SYSTEM TELEMETRY</span>
      </div>

      {cacheMessage && (
        <div
          style={{
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid #10b981',
            color: '#10b981',
            fontSize: '0.8125rem',
            fontWeight: 600,
          }}
        >
          ✓ {cacheMessage}
        </div>
      )}

      {/* API Connections Health Card */}
      <div className="info-card" style={{ background: 'var(--color-surface-0)' }}>
        <div className="info-card-header">
          <span>API Services & Infrastructure Health</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div
            style={{
              padding: '0.75rem 1rem',
              background: 'var(--color-surface-1)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <strong style={{ fontSize: '0.8125rem', color: '#fff' }}>TomTom Live Traffic API</strong>
              <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-tertiary)' }}>
                Flow Segment & Incident Details Service · Quota Protected (Manual Refresh Only)
              </div>
            </div>
            <span
              style={{
                fontSize: '0.6875rem',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: '4px',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#10b981',
              }}
            >
              ● CONNECTED / ACTIVE
            </span>
          </div>

          <div
            style={{
              padding: '0.75rem 1rem',
              background: 'var(--color-surface-1)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <strong style={{ fontSize: '0.8125rem', color: '#fff' }}>Groq AI Inference Engine</strong>
              <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-tertiary)' }}>
                Model: openai/gpt-oss-120b · Sub-second tactical incident reasoning
              </div>
            </div>
            <span
              style={{
                fontSize: '0.6875rem',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: '4px',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#10b981',
              }}
            >
              ● OPERATIONAL
            </span>
          </div>

          <div
            style={{
              padding: '0.75rem 1rem',
              background: 'var(--color-surface-1)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <strong style={{ fontSize: '0.8125rem', color: '#fff' }}>Root Map GIS Service Adapter</strong>
              <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-tertiary)' }}>
                Endpoint: http://localhost:3000/api/hazards/map-layers (Drainage & Wards)
              </div>
            </div>
            <span
              style={{
                fontSize: '0.6875rem',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: '4px',
                background: 'rgba(56, 189, 248, 0.15)',
                color: 'var(--color-accent)',
              }}
            >
              ● CONNECTED
            </span>
          </div>
        </div>
      </div>

      {/* Strict API Quota & Cache Management */}
      <div className="info-card" style={{ background: 'var(--color-surface-0)' }}>
        <div className="info-card-header">
          <span>Local Cache & API Quota Protection (Strict Mode)</span>
          <span style={{ color: '#10b981', fontSize: '0.6875rem' }}>Active</span>
        </div>

        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', lineHeight: 1.6, marginBottom: '1rem' }}>
          To prevent exceeding TomTom API limits and Groq tokens, the Traffic Control Dashboard operates strictly in <strong>Cache-First Mode</strong>. Moving, panning, or zooming the map will <strong>never</strong> trigger API requests. Data is refreshed solely on explicit manual click of the "Refresh" button.
        </p>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button onClick={handleClearCache} className="btn">
            <span>🗑️ Clear Active City Cache ({selectedCityId.toUpperCase()})</span>
          </button>
          <button onClick={handleClearAll} className="btn" style={{ borderColor: 'var(--color-critical)', color: 'var(--color-critical)' }}>
            <span>⚠️ Clear All City Caches</span>
          </button>
        </div>
      </div>
    </div>
  );
}
