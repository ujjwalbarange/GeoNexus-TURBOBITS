import React, { useState } from 'react';
import { formatSpeed } from '../../utils/formatters';

export default function RedZoneDetailDrawer({
  redZone,
  onClose,
  onDispatchPolice,
  onInspectRoute,
}) {
  const [tacticalPlanApproved, setTacticalPlanApproved] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiTacticalAdvice, setAiTacticalAdvice] = useState(null);

  if (!redZone) return null;

  const currentSpeed = redZone.currentSpeedKmH || 14;
  const freeFlowSpeed = redZone.freeFlowSpeedKmH || 80;
  const delayMin = redZone.delayMinutes || 24;

  const handleApprovePlan = () => {
    setTacticalPlanApproved(true);
  };

  const handleRunAiAnalysis = async () => {
    setIsAnalyzing(true);
    // Simulate real AI analysis trace
    setTimeout(() => {
      setAiTacticalAdvice({
        risk: 'High risk of lateral propagation into parallel arterials within 15 minutes if unmitigated.',
        directive: '1. Override signal controller to 90s outbound green. 2. Station traffic unit at entry slip for manual metering. 3. Broadcast variable message signs (VMS) advisory.',
        advisory: 'Severe congestion near junction. Motorists advised to divert via Link Road.',
      });
      setIsAnalyzing(false);
    }, 800);
  };

  return (
    <div className="context-drawer" style={{ width: '420px' }}>
      {/* Header */}
      <div className="context-drawer-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'var(--color-critical-bg)',
              border: '1.5px solid var(--color-critical)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
            }}
          >
            🚨
          </div>
          <div>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#fff' }}>
              {redZone.corridorName || 'Congestion Red Zone'}
            </h3>
            <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-tertiary)' }}>
              Incident: <strong style={{ color: 'var(--color-critical)' }}>{redZone.id}</strong>
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

      {/* Body */}
      <div className="context-drawer-body">
        {/* Source Integrity Badge & Severity */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span className="badge-data-integrity badge-live">● DETECTED INCIDENT (LIVE)</span>
          <span
            style={{
              fontSize: '0.6875rem',
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: '4px',
              background: redZone.severity === 'CRITICAL' ? 'var(--color-critical-bg)' : 'var(--color-high-bg)',
              color: redZone.severity === 'CRITICAL' ? 'var(--color-critical)' : 'var(--color-high)',
              border: '1px solid currentColor',
            }}
          >
            {redZone.severity || 'CRITICAL'} SEVERITY
          </span>
        </div>

        {/* Speed & Delay Metrics */}
        <div className="metric-grid">
          <div className="metric-box">
            <div className="metric-label">Current Velocity</div>
            <div className="metric-value" style={{ color: 'var(--color-critical)' }}>
              {formatSpeed(currentSpeed)}
            </div>
            <div style={{ fontSize: '0.625rem', color: 'var(--color-text-tertiary)', marginTop: '2px' }}>
              Free-flow: {freeFlowSpeed} km/h
            </div>
          </div>
          <div className="metric-box">
            <div className="metric-label">Queue Delay</div>
            <div className="metric-value" style={{ color: '#fb923c' }}>
              +{delayMin} mins
            </div>
            <div style={{ fontSize: '0.625rem', color: 'var(--color-text-tertiary)', marginTop: '2px' }}>
              Congestion: {redZone.affectedLengthKm || 2.4} km
            </div>
          </div>
        </div>

        {/* Affected Road Segments */}
        <div className="info-card">
          <div className="info-card-header">
            <span>Affected Road Corridors</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
            📍 Junction: <strong>{redZone.junction || redZone.corridorName}</strong>
            <br />
            Affected span: Km marker 12.4 to 14.8 (Northbound carriage)
          </div>
        </div>

        {/* Alternative Routes */}
        <div className="info-card">
          <div className="info-card-header">
            <span>Recommended Diversion Route</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
            Divert traffic via SV Road / Link Road. Estimated travel time saving: <strong>18 mins</strong>.
          </div>
          {onInspectRoute && (
            <button
              onClick={() => onInspectRoute(redZone)}
              className="btn"
              style={{ width: '100%', fontSize: '0.75rem' }}
            >
              <span>🧭 View Detour on Map</span>
            </button>
          )}
        </div>

        {/* Police Availability & Deployment */}
        <div className="info-card">
          <div className="info-card-header">
            <span>Police Dispatch Recommendation</span>
            <span style={{ color: '#10b981', fontSize: '0.6875rem' }}>Unit Verified</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.625rem' }}>
            Recommended Unit: <strong>UNIT-T1 (Inspector S. Patil)</strong> stationed 1.8 km away at Western Traffic Chowki.
          </div>
          <button
            onClick={() => onDispatchPolice && onDispatchPolice(redZone)}
            className="btn btn-primary"
            style={{ width: '100%' }}
          >
            <span>🚓 Dispatch Police Unit Now</span>
          </button>
        </div>

        {/* AI Agent Tactical Analysis */}
        <div
          className="info-card"
          style={{
            background: 'rgba(37, 99, 235, 0.08)',
            borderColor: 'rgba(56, 189, 248, 0.3)',
          }}
        >
          <div className="info-card-header" style={{ color: 'var(--color-accent)' }}>
            <span>⚡ AI Tactical Reasoning (Groq LLM)</span>
            {!aiTacticalAdvice && !isAnalyzing && (
              <button
                onClick={handleRunAiAnalysis}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--color-accent)',
                  borderRadius: '4px',
                  color: 'var(--color-accent)',
                  padding: '2px 6px',
                  fontSize: '0.6875rem',
                  cursor: 'pointer',
                }}
              >
                Run Tactical LLM
              </button>
            )}
          </div>

          {isAnalyzing && (
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', fontStyle: 'italic' }}>
              Querying Groq openai/gpt-oss-120b for tactical guidance...
            </div>
          )}

          {aiTacticalAdvice ? (
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              <div><strong>Risk:</strong> {aiTacticalAdvice.risk}</div>
              <div><strong>Directive:</strong> {aiTacticalAdvice.directive}</div>
              <div><strong>Advisory:</strong> <em>"{aiTacticalAdvice.advisory}"</em></div>
            </div>
          ) : !isAnalyzing && (
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
              Click "Run Tactical LLM" to generate an authoritative on-ground directive for traffic officers.
            </p>
          )}
        </div>

        {/* Approval Status & Actions */}
        <div style={{ borderTop: '1px solid var(--color-divider)', paddingTop: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.625rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>Approval State:</span>
            <span
              style={{
                fontSize: '0.6875rem',
                fontWeight: 800,
                color: tacticalPlanApproved ? '#10b981' : '#f59e0b',
              }}
            >
              {tacticalPlanApproved ? '✓ APPROVED BY OPERATOR' : '⏳ AWAITING OPERATOR REVIEW'}
            </span>
          </div>

          {!tacticalPlanApproved ? (
            <button
              onClick={handleApprovePlan}
              className="btn btn-primary"
              style={{ width: '100%', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
            >
              <span>✓ Approve Tactical Action Plan</span>
            </button>
          ) : (
            <div
              style={{
                padding: '0.5rem',
                borderRadius: '6px',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                fontSize: '0.75rem',
                color: '#10b981',
                textAlign: 'center',
                fontWeight: 600,
              }}
            >
              Plan approved and transmitted to Traffic Police Division.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
