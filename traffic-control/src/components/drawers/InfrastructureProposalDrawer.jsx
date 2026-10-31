import React from 'react';

export default function InfrastructureProposalDrawer({
  proposal,
  onClose,
  onViewAlignmentOnMap,
}) {
  if (!proposal) return null;

  const concept = proposal.architecturalConcept || {};

  return (
    <div className="context-drawer" style={{ width: '450px' }}>
      {/* Header */}
      <div className="context-drawer-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.25rem' }}>🌉</span>
            <span style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>
              Capital Infrastructure Dossier
            </span>
          </div>
          <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-tertiary)' }}>
            Ref: {proposal.id} · Jurisdiction: <strong>{proposal.cityId?.toUpperCase()}</strong>
          </span>
        </div>
        <button
          onClick={onClose}
          style={{ background: 'transparent', border: 'none', color: 'var(--color-text-tertiary)', fontSize: '18px', cursor: 'pointer' }}
        >
          ✕
        </button>
      </div>

      <div className="context-drawer-body">
        {/* Title & Status */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-text-primary)', lineHeight: 1.3 }}>
              {proposal.title}
            </h3>
            <span
              style={{
                fontSize: '0.6875rem',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: 'var(--radius-pill)',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#10b981',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                whiteSpace: 'nowrap',
              }}
            >
              Feasibility: {proposal.feasibilityScore}/100
            </span>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-accent)', fontWeight: 600 }}>
            {proposal.category} ({proposal.proposedInfrastructureType})
          </span>
        </div>

        {/* Action Button: Highlight & Fly to Alignment */}
        <button
          onClick={() => {
            if (onViewAlignmentOnMap) onViewAlignmentOnMap(proposal);
          }}
          className="btn btn-primary"
          style={{ width: '100%', padding: '0.625rem', fontSize: '0.8125rem' }}
        >
          <span>🗺️ Focus & Highlight Alignment on Map</span>
        </button>

        {/* ─── VISUAL ARCHITECTURAL CONCEPT ─── */}
        <div style={{ background: 'var(--color-surface-1)', padding: '0.875rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span>📐</span> Architectural Structural Concept
          </div>

          {/* Conceptual Top-Down SVG Plan */}
          <div
            style={{
              width: '100%',
              height: '110px',
              borderRadius: 'var(--radius-sm)',
              background: '#090d16',
              border: '1px solid #1e293b',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <svg width="100%" height="100%" viewBox="0 0 380 110" style={{ position: 'absolute', inset: 0 }}>
              {/* Ground level road */}
              <line x1="20" y1="55" x2="360" y2="55" stroke="#334155" strokeWidth="24" strokeLinecap="round" />
              <line x1="20" y1="55" x2="360" y2="55" stroke="#475569" strokeWidth="1" strokeDasharray="6, 6" />
              
              {/* Elevated Viaduct deck */}
              <line x1="40" y1="35" x2="340" y2="35" stroke="#f59e0b" strokeWidth="12" strokeLinecap="round" opacity="0.9" />
              <line x1="40" y1="35" x2="340" y2="35" stroke="#ffffff" strokeWidth="1.5" strokeDasharray="4, 6" />

              {/* Piers */}
              <line x1="90" y1="35" x2="90" y2="75" stroke="#94a3b8" strokeWidth="4" />
              <line x1="190" y1="35" x2="190" y2="75" stroke="#94a3b8" strokeWidth="4" />
              <line x1="290" y1="35" x2="290" y2="75" stroke="#94a3b8" strokeWidth="4" />

              {/* Ramp inclinations */}
              <line x1="40" y1="35" x2="15" y2="55" stroke="#f59e0b" strokeWidth="6" strokeDasharray="3, 3" />
              <line x1="340" y1="35" x2="365" y2="55" stroke="#f59e0b" strokeWidth="6" strokeDasharray="3, 3" />

              {/* Labels */}
              <text x="190" y="24" fill="#f59e0b" fontSize="10" fontWeight="bold" textAnchor="middle">
                ELEVATED GRADE SEPARATOR DECK (+{concept.deckElevationM || 8.5}m)
              </text>
              <text x="190" y="95" fill="#94a3b8" fontSize="9" textAnchor="middle">
                SURFACE INTERSECTION & LOCAL TURNING SLIP LANES
              </text>
            </svg>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginTop: '8px', fontSize: '0.6875rem' }}>
            <div>
              <span style={{ color: 'var(--color-text-tertiary)' }}>Structural Plan:</span><br />
              <strong style={{ color: 'var(--color-text-primary)' }}>{concept.planType || 'Prestressed Segmental Girder'}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--color-text-tertiary)' }}>Total Project Length:</span><br />
              <strong style={{ color: 'var(--color-text-primary)' }}>{concept.totalLengthM || 1800} meters</strong>
            </div>
          </div>
        </div>

        {/* Before vs After Throughput Gain */}
        <div style={{ background: 'var(--color-surface-1)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '6px' }}>
            Flow Simulation Gain (PCU / Hour)
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6875rem', marginBottom: '2px' }}>
                <span style={{ color: 'var(--color-critical)' }}>Current Surface Flow (Congested)</span>
                <strong>{concept.beforeThroughput || '3,200 PCU/hr'}</strong>
              </div>
              <div style={{ height: '6px', borderRadius: '3px', background: 'var(--color-surface-2)', overflow: 'hidden' }}>
                <div style={{ width: '42%', height: '100%', background: 'var(--color-critical)' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6875rem', marginBottom: '2px' }}>
                <span style={{ color: '#10b981' }}>Projected Post-Intervention Throughput</span>
                <strong>{concept.afterThroughput || '7,400 PCU/hr'}</strong>
              </div>
              <div style={{ height: '6px', borderRadius: '3px', background: 'var(--color-surface-2)', overflow: 'hidden' }}>
                <div style={{ width: '92%', height: '100%', background: '#10b981' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Project Cost & Specifications */}
        <div className="metric-grid">
          <div className="metric-box">
            <div className="metric-label">Estimated Capital Cost</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-primary)' }}>
              {proposal.estCost}
            </div>
            <div style={{ fontSize: '0.625rem', color: 'var(--color-text-tertiary)' }}>
              PWD Capital Budget Allocation
            </div>
          </div>

          <div className="metric-box">
            <div className="metric-label">Junction Location</div>
            <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-text-primary)', marginTop: '2px' }}>
              {proposal.junctionName}
            </div>
          </div>
        </div>

        {/* Problem Description & Engineering Justification */}
        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
          <strong>Bottleneck Problem:</strong> {proposal.problemDescription}
        </div>

        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
          <strong>Expected Benefits:</strong> {proposal.expectedBenefits}
        </div>

        <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-tertiary)', lineHeight: 1.5 }}>
          <strong>Engineering & Utility Considerations:</strong> {proposal.engineeringConsiderations}
        </div>
      </div>
    </div>
  );
}
