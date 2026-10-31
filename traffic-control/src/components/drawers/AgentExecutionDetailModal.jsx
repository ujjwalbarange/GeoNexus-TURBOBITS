import React from 'react';

export default function AgentExecutionDetailModal({
  execution,
  onClose,
}) {
  if (!execution) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="context-drawer-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <span style={{ fontSize: '1.25rem' }}>⚡</span>
            <div>
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#fff' }}>
                Agent Execution Inspector
              </h3>
              <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-tertiary)' }}>
                Execution ID: <strong style={{ color: 'var(--color-accent)' }}>{execution.id}</strong>
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
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
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Status & Timing */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span
              style={{
                fontSize: '0.6875rem',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: '4px',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#10b981',
                border: '1px solid rgba(16, 185, 129, 0.3)',
              }}
            >
              ● {execution.status}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', fontFamily: 'JetBrains Mono' }}>
              Duration: {execution.durationMs}ms · {new Date(execution.timestamp).toLocaleTimeString()}
            </span>
          </div>

          {/* Module Name */}
          <div className="info-card">
            <div className="info-card-header">
              <span>Agent Sub-Module</span>
            </div>
            <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#fff' }}>
              {execution.module}
            </div>
          </div>

          {/* Input Data Sources */}
          <div className="info-card">
            <div className="info-card-header">
              <span>Input Data Sources</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
              {execution.inputs || 'Real-time telemetry and geofenced city datasets.'}
            </div>
          </div>

          {/* Analysis Performed */}
          <div className="info-card">
            <div className="info-card-header">
              <span>Analysis Performed</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
              {execution.analysis}
            </div>
          </div>

          {/* Result & Recommendation */}
          <div className="metric-grid">
            <div className="metric-box">
              <div className="metric-label">Execution Result</div>
              <div style={{ fontSize: '0.8125rem', color: '#10b981', fontWeight: 600 }}>
                {execution.result}
              </div>
            </div>
            <div className="metric-box">
              <div className="metric-label">Related Incident</div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--color-accent)', fontWeight: 600 }}>
                {execution.incidentId || 'System Wide'}
              </div>
            </div>
          </div>

          {/* Recommendation */}
          <div
            className="info-card"
            style={{
              background: 'rgba(37, 99, 235, 0.1)',
              borderColor: 'rgba(56, 189, 248, 0.3)',
            }}
          >
            <div className="info-card-header" style={{ color: 'var(--color-accent)' }}>
              <span>Generated Recommendation</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
              {execution.recommendation}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
