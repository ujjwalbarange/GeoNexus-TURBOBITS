import React, { useState } from 'react';

export default function RouteOptimizationView({
  selectedCityId,
  orchestratorOutput,
  onNavigateToMap,
}) {
  const [selectedRouteIdx, setSelectedRouteIdx] = useState(0);
  const [advisoryBroadcasted, setAdvisoryBroadcasted] = useState(false);

  const routes = [
    {
      name: 'Western Express Highway (WEH) Northbound Bypass',
      origin: 'Bandra / BKC Commercial Center',
      destination: 'Andheri East / International Airport',
      primaryRoute: 'Direct WEH Mainline (Choked at Kalanagar)',
      primaryDelay: '+28 mins (Average 12 km/h)',
      recommendedDetour: 'Divert via S.V. Road & Linking Road, rejoin at Santacruz Flyover',
      timeSaved: '18 mins',
      distanceDelta: '+1.4 km',
      chokePointsAvoided: 2,
      steps: [
        'Take Left exit onto Kala Nagar Slip road towards SV Road.',
        'Proceed North on SV Road for 3.2 km through Khar West.',
        'Turn Right onto Santacruz Milan Subway connector.',
        'Rejoin WEH mainline north of the acute choke point.',
      ],
    },
    {
      name: 'Eastern Express Highway (EEH) Southbound Bypass',
      origin: 'Thane Majiwada Junction',
      destination: 'Sion / Mumbai Island City',
      primaryRoute: 'Direct EEH (Choked at Chedda Nagar & Kurla)',
      primaryDelay: '+34 mins (Average 15 km/h)',
      recommendedDetour: 'Divert via Eastern Freeway extension through Chembur',
      timeSaved: '22 mins',
      distanceDelta: '+2.1 km',
      chokePointsAvoided: 3,
      steps: [
        'Take Eastern Freeway exit ramp before Chedda Nagar merge.',
        'Maintain 75 km/h unobstructed throughput on elevated corridor.',
        'Exit directly at P. D’Mello Road / South Mumbai port terminal.',
      ],
    },
  ];

  const activeRoute = routes[selectedRouteIdx] || routes[0];

  const handleBroadcast = () => {
    setAdvisoryBroadcasted(true);
    setTimeout(() => setAdvisoryBroadcasted(false), 5000);
  };

  return (
    <div className="view-panel">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>
            Route Optimization & Dynamic Diversion
          </h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
            Real-time arterial bypass calculations diverting traffic around active choke points and roadworks.
          </p>
        </div>
        <span className="badge-data-integrity badge-estimated">● DYNAMIC TRAVEL TIME ESTIMATION</span>
      </div>

      {advisoryBroadcasted && (
        <div
          style={{
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            background: 'rgba(56, 189, 248, 0.15)',
            border: '1px solid #38bdf8',
            color: '#38bdf8',
            fontSize: '0.8125rem',
            fontWeight: 600,
          }}
        >
          ✓ Citizen Traffic Advisory broadcasted to municipal navigation feeds and variable message signs (VMS).
        </div>
      )}

      {/* Route Selectors */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        {routes.map((r, idx) => (
          <button
            key={idx}
            onClick={() => setSelectedRouteIdx(idx)}
            className={`btn ${selectedRouteIdx === idx ? 'btn-primary' : ''}`}
            style={{ fontSize: '0.75rem', padding: '0.5rem 1rem' }}
          >
            <span>🧭 {r.name}</span>
          </button>
        ))}
      </div>

      {/* Comparative Routing Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
        {/* Primary Blocked Route */}
        <div
          className="info-card"
          style={{
            background: 'var(--color-surface-0)',
            border: '1px solid var(--color-critical-border)',
          }}
        >
          <div className="info-card-header">
            <span>Primary Choked Route</span>
            <span style={{ color: 'var(--color-critical)', fontWeight: 700 }}>Severe Congestion</span>
          </div>
          <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>
            {activeRoute.primaryRoute}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#fb923c', fontWeight: 600, marginBottom: '0.75rem' }}>
            Estimated Delay: {activeRoute.primaryDelay}
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
            Severe friction from merge bottlenecks and heavy queuing. Average speed reduced to 12-15 km/h.
          </p>
        </div>

        {/* Recommended Detour Route */}
        <div
          className="info-card"
          style={{
            background: 'var(--color-surface-0)',
            border: '1px solid rgba(16, 185, 129, 0.35)',
          }}
        >
          <div className="info-card-header">
            <span>Recommended Detour Route</span>
            <span style={{ color: '#10b981', fontWeight: 700 }}>Clear Corridor</span>
          </div>
          <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>
            {activeRoute.recommendedDetour}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 700, marginBottom: '0.75rem' }}>
            Time Saved: {activeRoute.timeSaved} (Distance Delta: {activeRoute.distanceDelta})
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
            Bypasses {activeRoute.chokePointsAvoided} critical choke points. Signal timing adjusted for northbound green-wave.
          </p>
        </div>
      </div>

      {/* Step-by-Step Diversion Guidance */}
      <div className="info-card" style={{ background: 'var(--color-surface-0)' }}>
        <div className="info-card-header">
          <span>Turn-by-Turn Operational Diversion Guidance</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {activeRoute.steps.map((step, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
                fontSize: '0.8125rem',
                color: 'var(--color-text-secondary)',
              }}
            >
              <span
                style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  background: 'var(--color-surface-2)',
                  color: 'var(--color-accent)',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {idx + 1}
              </span>
              <span style={{ lineHeight: 1.5 }}>{step}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Operational Actions */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <button onClick={handleBroadcast} className="btn btn-primary" style={{ padding: '0.625rem 1.25rem' }}>
          <span>📢 Broadcast Route Advisory to Citizens</span>
        </button>
        <button onClick={onNavigateToMap} className="btn" style={{ padding: '0.625rem 1.25rem' }}>
          <span>🗺️ Inspect Diversion Alignment on GIS Map</span>
        </button>
      </div>
    </div>
  );
}
