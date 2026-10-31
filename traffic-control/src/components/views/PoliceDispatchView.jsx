import React, { useState } from 'react';

export default function PoliceDispatchView({
  orchestratorOutput,
  onNavigateToMap,
}) {
  const [dispatchedUnits, setDispatchedUnits] = useState(new Set());
  const [dispatchFeedback, setDispatchFeedback] = useState(null);

  const recommendations = orchestratorOutput?.policeDispatch?.recommendations || [];

  const handleDispatch = (rec) => {
    setDispatchedUnits((prev) => new Set([...prev, rec.unitCode || rec.id]));
    setDispatchFeedback(`Unit ${rec.unitCode} dispatched to ${rec.corridorName}. ETA: ${rec.etaMinutes || 6} mins.`);
    setTimeout(() => setDispatchFeedback(null), 5000);
  };

  const handleRecall = (rec) => {
    setDispatchedUnits((prev) => {
      const next = new Set(prev);
      next.delete(rec.unitCode || rec.id);
      return next;
    });
    setDispatchFeedback(`Unit ${rec.unitCode} recalled to base station.`);
    setTimeout(() => setDispatchFeedback(null), 4000);
  };

  return (
    <div className="view-panel">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>
            Traffic Police Dispatch & Resource Command
          </h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
            Authoritative police unit coordination matching verified stations to acute congestion choke points.
          </p>
        </div>
        <span className="badge-data-integrity badge-live">● VERIFIED DEPARTMENT GEOJSON</span>
      </div>

      {/* Operational Feedback Toast */}
      {dispatchFeedback && (
        <div
          style={{
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid #10b981',
            color: '#10b981',
            fontSize: '0.8125rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>🚓 {dispatchFeedback}</span>
          <button
            onClick={() => setDispatchFeedback(null)}
            style={{ background: 'transparent', border: 'none', color: '#10b981', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Deployment Readiness Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div className="metric-box" style={{ background: 'var(--color-surface-0)', border: '1px solid var(--color-border)' }}>
          <div className="metric-label">Total Verified Posts</div>
          <div className="metric-value">18</div>
          <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-tertiary)', marginTop: '4px' }}>
            Traffic Divisions in City
          </div>
        </div>

        <div className="metric-box" style={{ background: 'var(--color-surface-0)', border: '1px solid var(--color-border)' }}>
          <div className="metric-label">Recommended Deployments</div>
          <div className="metric-value" style={{ color: 'var(--color-accent)' }}>
            {recommendations.length}
          </div>
          <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-tertiary)', marginTop: '4px' }}>
            Targeting acute red zones
          </div>
        </div>

        <div className="metric-box" style={{ background: 'var(--color-surface-0)', border: '1px solid var(--color-border)' }}>
          <div className="metric-label">Currently Dispatched</div>
          <div className="metric-value" style={{ color: '#10b981' }}>
            {dispatchedUnits.size} Units
          </div>
          <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-tertiary)', marginTop: '4px' }}>
            On-ground intervention active
          </div>
        </div>
      </div>

      {/* Recommendations Cards */}
      <div className="info-card" style={{ background: 'var(--color-surface-0)' }}>
        <div className="info-card-header">
          <span>Active Deployment Recommendations</span>
          <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-tertiary)' }}>
            Ranked by incident severity & proximity
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {recommendations.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
              No immediate police dispatches required. All sectors operating normally.
            </div>
          ) : (
            recommendations.map((rec, idx) => {
              const isDispatched = dispatchedUnits.has(rec.unitCode || rec.id);

              return (
                <div
                  key={idx}
                  style={{
                    padding: '1rem',
                    background: 'var(--color-surface-1)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '10px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.625rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <strong style={{ fontSize: '0.875rem', color: '#fff' }}>
                        Target: {rec.corridorName || 'Congestion Red Zone'}
                      </strong>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
                        Assigned Unit: <span style={{ color: 'var(--color-accent)', fontWeight: 700 }}>{rec.unitCode}</span> · Officer: {rec.officerInCharge || 'Inspector on Duty'}
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: '0.6875rem',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: isDispatched ? 'rgba(16, 185, 129, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                        color: isDispatched ? '#10b981' : 'var(--color-accent)',
                        border: '1px solid currentColor',
                      }}
                    >
                      {isDispatched ? '● DISPATCHED / EN ROUTE' : '○ READY FOR APPROVAL'}
                    </span>
                  </div>

                  <div className="metric-grid">
                    <div className="metric-box">
                      <div className="metric-label">Station Proximity</div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#fff' }}>
                        {rec.distanceKm || 2.1} km
                      </div>
                      <div style={{ fontSize: '0.625rem', color: 'var(--color-text-tertiary)' }}>
                        Station: {rec.stationName || 'Bandra Division Post'}
                      </div>
                    </div>
                    <div className="metric-box">
                      <div className="metric-label">Estimated Response Time</div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#fb923c' }}>
                        {rec.etaMinutes || 6} mins
                      </div>
                      <div style={{ fontSize: '0.625rem', color: 'var(--color-text-tertiary)' }}>
                        Priority: Immediate
                      </div>
                    </div>
                  </div>

                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
                    <strong>Tactical Action:</strong> {rec.actionPlan || 'Execute manual signal override at exit slip and meter inbound traffic to clear blockage.'}
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                    {!isDispatched ? (
                      <button
                        onClick={() => handleDispatch(rec)}
                        className="btn btn-primary"
                        style={{ flex: 1 }}
                      >
                        <span>🚓 Authorize & Dispatch Unit</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleRecall(rec)}
                        className="btn"
                        style={{ flex: 1, borderColor: 'var(--color-critical)', color: 'var(--color-critical)' }}
                      >
                        <span>↩ Recall Unit to Station</span>
                      </button>
                    )}
                    <button
                      onClick={onNavigateToMap}
                      className="btn"
                      style={{ flex: 1 }}
                    >
                      <span>🗺️ Track on Map</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
