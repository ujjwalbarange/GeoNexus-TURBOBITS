import React, { useState } from 'react';
import corridorProposalsData from '../../../data/infrastructure/bridges/corridor_proposals.json';
import InfrastructureProposalDrawer from '../drawers/InfrastructureProposalDrawer';

export default function InfrastructureView({
  selectedCityId,
  onNavigateToMap,
  onViewProposalAlignment,
}) {
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [activeProposalDrawer, setActiveProposalDrawer] = useState(null);

  // Filter proposals strictly for active city
  const cityProposals = corridorProposalsData.filter((p) => {
    if (p.cityId !== selectedCityId) return false;
    if (selectedCategory !== 'ALL' && p.category !== selectedCategory) return false;
    return true;
  });

  const categories = [
    'ALL',
    'Grade Separator',
    'Elevated Arterial Corridor',
    'Rotatory Multi-Tier Flyover',
    'Double-Decker Metro-Flyover',
    'Road Underpass',
  ];

  const handleViewAlignment = (prop) => {
    if (onViewProposalAlignment) {
      onViewProposalAlignment(prop);
    } else if (onNavigateToMap) {
      onNavigateToMap();
    }
  };

  return (
    <div className="view-panel">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>
            Infrastructure Intelligence & Capital Proposals
          </h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
            Jurisdiction: <strong style={{ color: 'var(--color-primary)' }}>{selectedCityId.toUpperCase()}</strong> · Long-term structural engineering justifications for bridges, flyovers, and elevated grade separation.
          </p>
        </div>
        <span className="badge-data-integrity badge-estimated">● STATUTORY PWD / MMRDA DOSSIER</span>
      </div>

      {/* Structural Categories Filter */}
      <div className="segmented-control" style={{ width: 'fit-content', flexWrap: 'wrap' }}>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`segmented-btn ${selectedCategory === cat ? 'active' : ''}`}
            style={{ fontSize: '0.6875rem' }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Proposals Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.25rem' }}>
        {cityProposals.length === 0 ? (
          <div
            className="info-card"
            style={{
              padding: '3rem',
              textAlign: 'center',
              color: 'var(--color-text-tertiary)',
              gridColumn: '1 / -1',
              background: 'var(--color-surface-0)',
              border: '1px solid var(--color-border)',
            }}
          >
            No capital proposals matching category in {selectedCityId.toUpperCase()}.
          </div>
        ) : (
          cityProposals.map((prop) => (
            <div
              key={prop.id}
              className="info-card"
              style={{
                background: 'var(--color-surface-0)',
                border: '1px solid var(--color-border)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                <div>
                  <h3 style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>
                    {prop.title}
                  </h3>
                  <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-tertiary)' }}>
                    Proposal ID: {prop.id} · Category: <strong style={{ color: 'var(--color-accent)' }}>{prop.category}</strong>
                  </span>
                </div>

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
                  Score: {prop.feasibilityScore}/100
                </span>
              </div>

              {/* Capital Cost & Expected Relief */}
              <div className="metric-grid">
                <div className="metric-box">
                  <div className="metric-label">Estimated Capital Cost</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                    {prop.estCost}
                  </div>
                  <div style={{ fontSize: '0.625rem', color: 'var(--color-text-tertiary)' }}>
                    State / Municipal Budget
                  </div>
                </div>
                <div className="metric-box">
                  <div className="metric-label">Junction Location</div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-text-primary)', marginTop: '2px' }}>
                    {prop.junctionName}
                  </div>
                  <div style={{ fontSize: '0.625rem', color: 'var(--color-text-tertiary)' }}>
                    High Saturation Bottleneck
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                <strong>Bottleneck Problem:</strong> {prop.problemDescription}
              </div>

              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                <strong>Expected Benefits:</strong> {prop.expectedBenefits}
              </div>

              <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-tertiary)' }}>
                <strong>Structural Specs:</strong> {prop.architecturalConcept?.planType || prop.proposedInfrastructureType}
              </div>

              {/* Action Buttons: View Alignment & Open Architectural Concept */}
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto', paddingTop: '0.5rem' }}>
                <button
                  onClick={() => handleViewAlignment(prop)}
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                >
                  <span>🗺️ View Proposed Alignment</span>
                </button>
                <button
                  onClick={() => setActiveProposalDrawer(prop)}
                  className="btn btn-secondary"
                >
                  <span>📐 Architectural Concept</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Floating Architectural Concept Drawer */}
      {activeProposalDrawer && (
        <InfrastructureProposalDrawer
          proposal={activeProposalDrawer}
          onClose={() => setActiveProposalDrawer(null)}
          onViewAlignmentOnMap={(prop) => {
            setActiveProposalDrawer(null);
            handleViewAlignment(prop);
          }}
        />
      )}
    </div>
  );
}
