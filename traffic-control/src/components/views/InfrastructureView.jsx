import React, { useState } from 'react';

export default function InfrastructureView({
  selectedCityId,
  onNavigateToMap,
}) {
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const proposals = [
    {
      id: 'PROP-MUM-01',
      title: 'Kalanagar-BKC Multi-Tier Elevated Grade Separator',
      city: 'mumbai',
      category: 'Rotatory Multi-Tier Flyover',
      junction: 'Western Express Highway & BKC Connector Junction',
      estCost: '₹340 Crores',
      reliefPct: '52% Throughput Increase',
      feasibilityScore: 92,
      justification: 'Separates weaving conflicts between Sea Link northbound exit traffic and BKC commercial ingress, eliminating 28 mins of daily queueing.',
      structuralSpecs: 'Twin-deck prestressed concrete segmental box girder with 4 ramps.',
    },
    {
      id: 'PROP-MUM-02',
      title: 'Sion-Dharavi River Nullaho Elevated Link',
      city: 'mumbai',
      category: 'Elevated Arterial Corridor',
      junction: 'Sion Circle to Bandra-Kurla Complex Southern Link',
      estCost: '₹480 Crores',
      reliefPct: '44% Throughput Increase',
      feasibilityScore: 86,
      justification: 'Bypasses severe waterlogging depression at King Circle during monsoon downpours, maintaining year-round commercial transit.',
      structuralSpecs: 'Elevated viaduct elevated 6.5m above 100-year flood datum line.',
    },
    {
      id: 'PROP-PUN-01',
      title: 'Hinjawadi IT Corridor Double-Decker Metro-Flyover',
      city: 'pune',
      category: 'Double-Decker Metro-Flyover',
      junction: 'Shivaji Chowk to Phase-3 Hinjawadi Tech Park',
      estCost: '₹620 Crores',
      reliefPct: '64% Throughput Increase',
      feasibilityScore: 94,
      justification: 'Combines Metro Line 3 viaduct with 4-lane elevated vehicular bypass, resolving massive shift-change gridlock.',
      structuralSpecs: 'Integrated pier structure supporting highway level at +8.5m and rail deck at +15.5m.',
    },
    {
      id: 'PROP-NAG-01',
      title: 'Nagpur Outer Ring Road Grade Separated Rotary',
      city: 'nagpur',
      category: 'Grade Separator',
      junction: 'Wardha Road (NH-44) & Outer Ring Road Interchange',
      estCost: '₹210 Crores',
      reliefPct: '48% Throughput Increase',
      feasibilityScore: 89,
      justification: 'Separates inter-city heavy freight trucks from MIHAN tech corridor commuter flows.',
      structuralSpecs: 'Four-leaf cloverleaf interchange with grade-separated underpass.',
    },
  ];

  const cityProposals = proposals.filter((p) => {
    if (selectedCategory !== 'ALL' && p.category !== selectedCategory) return false;
    return p.city === selectedCityId;
  });

  return (
    <div className="view-panel">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>
            Infrastructure Intelligence & Capital Proposals
          </h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
            Long-term structural engineering justifications for bridges, flyovers, and elevated grade separation.
          </p>
        </div>
        <span className="badge-data-integrity badge-estimated">● STATUTORY PWD / MMRDA DOSSIER</span>
      </div>

      {/* Structural Categories Filter */}
      <div className="segmented-control" style={{ width: 'fit-content' }}>
        {['ALL', 'Grade Separator', 'Elevated Arterial Corridor', 'Rotatory Multi-Tier Flyover', 'Double-Decker Metro-Flyover'].map((cat) => (
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
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-tertiary)', gridColumn: '1 / -1' }}>
            No proposals matching category in {selectedCityId.toUpperCase()}.
          </div>
        ) : (
          cityProposals.map((prop) => (
            <div
              key={prop.id}
              className="info-card"
              style={{
                background: 'var(--color-surface-0)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#fff' }}>
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
                    borderRadius: '4px',
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: '#10b981',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                  }}
                >
                  Score: {prop.feasibilityScore}/100
                </span>
              </div>

              <div className="metric-grid">
                <div className="metric-box">
                  <div className="metric-label">Estimated Capital Cost</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>
                    {prop.estCost}
                  </div>
                  <div style={{ fontSize: '0.625rem', color: 'var(--color-text-tertiary)' }}>
                    State / Municipal Budget
                  </div>
                </div>
                <div className="metric-box">
                  <div className="metric-label">Congestion Alleviation</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#10b981' }}>
                    {prop.reliefPct}
                  </div>
                  <div style={{ fontSize: '0.625rem', color: 'var(--color-text-tertiary)' }}>
                    Measured Flow Gain
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                <strong>Engineering Justification:</strong> {prop.justification}
              </div>

              <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-tertiary)' }}>
                <strong>Structural Specification:</strong> {prop.structuralSpecs}
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                <button
                  onClick={onNavigateToMap}
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                >
                  <span>🗺️ View Proposed Alignment</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
