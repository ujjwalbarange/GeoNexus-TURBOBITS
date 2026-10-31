import React, { useState } from 'react';
import { formatTimestamp, formatSpeed } from '../../utils/formatters';
import { aiReasoningService } from '../../services/aiReasoningService';

export default function AgentControlCenter({
  activeTab,
  onClose,
  orchestratorOutput,
  onFocusCoordinates,
}) {
  const [authorizedActions, setAuthorizedActions] = useState({});
  const [aiOutput, setAiOutput] = useState({});
  const [aiLoading, setAiLoading] = useState(false);
  const [operatorQuestion, setOperatorQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState([]);

  if (!activeTab) return null;

  const cityId = orchestratorOutput?.cityId || 'mumbai';
  const detection = orchestratorOutput?.detection || {};
  const dispatch = orchestratorOutput?.dispatch || {};
  const patterns = orchestratorOutput?.patterns || {};
  const routings = orchestratorOutput?.routings || {};
  const infrastructure = orchestratorOutput?.infrastructure || {};
  const reports = orchestratorOutput?.reports || [];

  const handleAuthorizeDispatch = (recId) => {
    setAuthorizedActions((prev) => ({
      ...prev,
      [recId]: {
        status: 'AUTHORIZED',
        authorizedAt: new Date().toLocaleTimeString(),
      },
    }));
  };

  // AI Tactical Incident Analysis
  const handleGenerateTacticalBrief = async (redZone) => {
    const key = `tactical_${redZone.id}`;
    setAiLoading(true);
    const rec = dispatch.recommendations?.find((r) => r.redZoneId === redZone.id);
    const result = await aiReasoningService.analyzeIncidentTactics(redZone, rec?.recommendedUnit);
    setAiOutput((prev) => ({ ...prev, [key]: result.content }));
    setAiLoading(false);
  };

  // AI Bottleneck Causality Analysis
  const handleExplainCausality = async (pattern) => {
    const key = `causality_${pattern.id}`;
    setAiLoading(true);
    const result = await aiReasoningService.explainBottleneckCausality(pattern);
    setAiOutput((prev) => ({ ...prev, [key]: result.content }));
    setAiLoading(false);
  };

  // AI Infrastructure Engineering Review
  const handleEvaluateInfrastructure = async (prop) => {
    const key = `infra_${prop.id}`;
    setAiLoading(true);
    const result = await aiReasoningService.evaluateBridgeFeasibility(prop);
    setAiOutput((prev) => ({ ...prev, [key]: result.content }));
    setAiLoading(false);
  };

  // Interactive Operator Query
  const handleAskAgent = async (e) => {
    e.preventDefault();
    if (!operatorQuestion.trim() || aiLoading) return;

    const q = operatorQuestion.trim();
    setOperatorQuestion('');
    setChatHistory((prev) => [...prev, { role: 'operator', text: q }]);
    setAiLoading(true);

    const result = await aiReasoningService.chatWithTrafficAgent(q, cityId, detection.redZones || []);
    setChatHistory((prev) => [...prev, { role: 'agent', text: result.content, model: result.model }]);
    setAiLoading(false);
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: '1rem',
        right: '1rem',
        width: '460px',
        maxHeight: 'calc(100% - 2rem)',
        background: 'var(--glass-bg)',
        backdropFilter: 'var(--glass-blur)',
        WebkitBackdropFilter: 'var(--glass-blur)',
        border: '1px solid var(--border-card)',
        borderRadius: '16px',
        boxShadow: 'var(--glass-shadow)',
        zIndex: 30,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        color: '#fff',
      }}
    >
      {/* Drawer Header */}
      <div
        style={{
          padding: '0.875rem 1.25rem',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(255, 255, 255, 0.02)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.25rem' }}>
            {activeTab === 'red_zones' && '🚨'}
            {activeTab === 'police_dispatch' && '🚓'}
            {activeTab === 'patterns' && '📈'}
            {activeTab === 'routing' && '🚧'}
            {activeTab === 'infrastructure' && '🌉'}
            {activeTab === 'reports' && '📋'}
          </span>
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>
                {activeTab === 'red_zones' && 'Live Red Zones & Traffic Detection'}
                {activeTab === 'police_dispatch' && 'Police Dispatch Intelligence'}
                {activeTab === 'patterns' && 'Recurring Bottleneck Intelligence'}
                {activeTab === 'routing' && 'Closures & Alternative Routes'}
                {activeTab === 'infrastructure' && 'Bridge & Infrastructure Intelligence'}
                {activeTab === 'reports' && 'Government Reporting & Audit'}
              </span>
              <span style={{ fontSize: '9px', background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', padding: '1px 5px', borderRadius: '4px' }}>
                GROQ 120B AI
              </span>
            </div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>
              Deterministic Engine + Multi-Module Reasoning
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-tertiary)',
            fontSize: '16px',
            cursor: 'pointer',
            padding: '4px',
          }}
          title="Close panel"
        >
          ✕
        </button>
      </div>

      {/* Main Scrollable Content */}
      <div style={{ padding: '1.25rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
        {/* MODULE 1: RED ZONES */}
        {activeTab === 'red_zones' && (
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
              Identified {detection.count || 0} active critical congestion sectors requiring traffic authority attention.
            </div>

            {detection.redZones?.length === 0 ? (
              <div className="info-card" style={{ textAlign: 'center', padding: '1.5rem' }}>
                <span style={{ fontSize: '1.75rem' }}>🟢</span>
                <p style={{ marginTop: '6px', fontWeight: 600 }}>No Critical Red Zones Active</p>
                <p style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Corridors are currently free-flowing or moderate.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {detection.redZones.map((rz) => {
                  const aiKey = `tactical_${rz.id}`;
                  const brief = aiOutput[aiKey];

                  return (
                    <div key={rz.id} className="info-card" style={{ borderLeft: `4px solid ${rz.color}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <span style={{ fontSize: '10px', background: 'rgba(255,255,255,0.1)', padding: '2px 5px', borderRadius: '4px' }}>
                            {rz.corridorCode}
                          </span>
                          <div style={{ fontWeight: 700, fontSize: '13px', marginTop: '4px' }}>{rz.corridorName}</div>
                        </div>
                        <span style={{ fontSize: '10px', fontWeight: 700, color: rz.color }}>
                          {rz.severityLabel}
                        </span>
                      </div>

                      <div className="metric-grid" style={{ margin: '8px 0' }}>
                        <div className="metric-box">
                          <div className="metric-label">SPEED</div>
                          <div className="metric-value" style={{ color: rz.color }}>{formatSpeed(rz.currentSpeedKmH)}</div>
                        </div>
                        <div className="metric-box">
                          <div className="metric-label">QUEUE DELAY</div>
                          <div className="metric-value">+{rz.delayMinutes}m</div>
                        </div>
                      </div>

                      <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginBottom: '8px' }}>
                        Duration: ~{rz.durationMinutes} mins · Affected corridor: ~{rz.affectedLengthKm} km
                      </div>

                      <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                        <button
                          className="btn"
                          style={{ flex: 1, fontSize: '11px' }}
                          onClick={() => onFocusCoordinates(rz.centerCoordinates)}
                        >
                          🎯 Focus Map
                        </button>
                        <button
                          className="btn btn-primary"
                          style={{ flex: 1.4, fontSize: '11px' }}
                          disabled={aiLoading}
                          onClick={() => handleGenerateTacticalBrief(rz)}
                        >
                          🧠 AI Tactical Brief
                        </button>
                      </div>

                      {/* AI Tactical Brief Card */}
                      {brief && (
                        <div
                          style={{
                            marginTop: '10px',
                            background: 'rgba(15, 23, 42, 0.9)',
                            border: '1px solid rgba(56, 189, 248, 0.3)',
                            borderRadius: '8px',
                            padding: '10px',
                            fontSize: '11px',
                            lineHeight: '1.4',
                          }}
                        >
                          <div style={{ color: '#38bdf8', fontWeight: 700, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span>🧠 Groq 120B Tactical Directive:</span>
                          </div>
                          <div style={{ color: '#e2e8f0', whiteSpace: 'pre-line' }}>{brief}</div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* MODULE 2: POLICE DISPATCH */}
        {activeTab === 'police_dispatch' && (
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
              Proximity-based police resource allocation. Requires human operator authorization before deployment.
            </div>

            {dispatch.recommendations?.map((rec) => {
              const isAuth = authorizedActions[rec.id];
              return (
                <div key={rec.id} className="info-card" style={{ marginBottom: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 700, fontSize: '13px' }}>{rec.corridorName}</div>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: isAuth ? 'rgba(16, 185, 129, 0.2)' : 'rgba(234, 179, 8, 0.2)',
                        color: isAuth ? '#10b981' : '#facc15',
                      }}
                    >
                      {isAuth ? 'AUTHORIZED' : rec.status}
                    </span>
                  </div>

                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '6px 0' }}>{rec.reason}</p>

                  {rec.recommendedUnit && (
                    <div style={{ background: 'var(--bg-dark-900)', padding: '8px', borderRadius: '8px', fontSize: '11px', marginBottom: '8px' }}>
                      <div style={{ fontWeight: 600, color: '#38bdf8' }}>
                        👮 Recommended Unit: {rec.recommendedUnit.unitCode} ({rec.recommendedUnit.officerInCharge})
                      </div>
                      <div style={{ color: 'var(--text-tertiary)', marginTop: '2px' }}>
                        Stationed: {rec.recommendedUnit.currentLocation} ({rec.recommendedUnit.distanceKm} km away) · ETA ~{rec.recommendedUnit.estimatedEtaMins} mins
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      className="btn btn-primary"
                      style={{ flex: 1, fontSize: '11px' }}
                      disabled={Boolean(isAuth)}
                      onClick={() => handleAuthorizeDispatch(rec.id)}
                    >
                      {isAuth ? `✓ Authorized at ${isAuth.authorizedAt}` : '🛡️ Authorize Dispatch Recommendation'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* MODULE 3: RECURRING PATTERNS */}
        {activeTab === 'patterns' && (
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
              Historical bottleneck patterns identified by machine observations across peak commute windows.
            </div>

            {patterns.patterns?.map((pat) => {
              const aiKey = `causality_${pat.id}`;
              const explanation = aiOutput[aiKey];

              return (
                <div key={pat.id} className="info-card" style={{ marginBottom: '10px' }}>
                  <div style={{ fontWeight: 700, fontSize: '13px' }}>{pat.location}</div>
                  <div style={{ fontSize: '10px', color: '#facc15', margin: '4px 0' }}>
                    PEAK WINDOWS: {pat.peakWindows?.map((p) => `${p.period} (${p.time})`).join(' · ')}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    <strong>Root Cause:</strong> {pat.primaryContributingFactor}
                  </div>
                  <div style={{ background: 'var(--bg-dark-900)', padding: '8px', borderRadius: '6px', fontSize: '11px', marginBottom: '8px' }}>
                    <div style={{ color: '#10b981', fontWeight: 600 }}>Proposed Intervention:</div>
                    <div>{pat.recommendedInterventions?.[0]?.description}</div>
                    <div style={{ color: 'var(--text-tertiary)', fontSize: '10px', marginTop: '2px' }}>
                      Expected Gain: {pat.recommendedInterventions?.[0]?.expectedDelayReduction}
                    </div>
                  </div>

                  <button
                    className="btn"
                    style={{ width: '100%', fontSize: '11px' }}
                    disabled={aiLoading}
                    onClick={() => handleExplainCausality(pat)}
                  >
                    🧠 Deep-Dive Bottleneck Causality (AI)
                  </button>

                  {explanation && (
                    <div
                      style={{
                        marginTop: '8px',
                        background: 'rgba(15, 23, 42, 0.9)',
                        border: '1px solid rgba(250, 204, 21, 0.3)',
                        borderRadius: '8px',
                        padding: '10px',
                        fontSize: '11px',
                        lineHeight: '1.4',
                      }}
                    >
                      <div style={{ color: '#facc15', fontWeight: 700, marginBottom: '4px' }}>
                        🧠 Groq 120B Engineering Analysis:
                      </div>
                      <div style={{ color: '#e2e8f0', whiteSpace: 'pre-line' }}>{explanation}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* MODULE 4: ROAD RESTRICTIONS & ROUTING */}
        {activeTab === 'routing' && (
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
              Active road closures, metro construction barricades, and verified alternative diversion routes.
            </div>

            {routings.routings?.map((r) => (
              <div key={r.id} className="info-card" style={{ marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div style={{ fontWeight: 700, fontSize: '13px' }}>{r.roadName}</div>
                  <span style={{ fontSize: '10px', color: '#f97316', fontWeight: 700 }}>{r.restrictionType}</span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '4px 0' }}>
                  Cause: {r.cause} ({r.laneImpact})
                </div>

                <div style={{ background: 'var(--bg-dark-900)', padding: '8px', borderRadius: '6px', fontSize: '11px', marginTop: '6px' }}>
                  <div style={{ color: '#38bdf8', fontWeight: 600 }}>Verified Alternative Diversion:</div>
                  {r.alternativeRoutes?.map((alt, i) => (
                    <div key={i} style={{ marginTop: '2px' }}>
                      🛣️ {alt.routeName} (+{alt.additionalDistanceKm} km, saves {Math.abs(alt.estimatedDeltaMins)}m travel time)
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* MODULE 5: INFRASTRUCTURE & BRIDGES */}
        {activeTab === 'infrastructure' && (
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
              Urban grade-separation and bridge feasibility proposals for chronic structural bottlenecks.
            </div>

            {infrastructure.proposals?.map((prop) => {
              const aiKey = `infra_${prop.id}`;
              const review = aiOutput[aiKey];

              return (
                <div key={prop.id} className="info-card" style={{ marginBottom: '10px', borderLeft: '4px solid #a78bfa' }}>
                  <div style={{ fontWeight: 700, fontSize: '13px' }}>{prop.junctionName}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', margin: '2px 0' }}>
                    Choke Point: {prop.identifiedBottleneck}
                  </div>

                  <div style={{ background: 'var(--bg-dark-900)', padding: '8px', borderRadius: '6px', fontSize: '11px', margin: '8px 0' }}>
                    <div style={{ color: '#a78bfa', fontWeight: 700 }}>
                      Proposed: {prop.recommendedInfrastructure.name}
                    </div>
                    <div style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {prop.recommendedInfrastructure.configuration}
                    </div>
                    <div style={{ color: '#38bdf8', marginTop: '4px', fontSize: '10px' }}>
                      Est. Capital Cost: {prop.recommendedInfrastructure.preliminaryCostCategory}
                    </div>
                  </div>

                  <button
                    className="btn"
                    style={{ width: '100%', fontSize: '11px', marginBottom: '6px' }}
                    disabled={aiLoading}
                    onClick={() => handleEvaluateInfrastructure(prop)}
                  >
                    🧠 Civil Engineering Review (AI)
                  </button>

                  {review && (
                    <div
                      style={{
                        marginTop: '8px',
                        background: 'rgba(15, 23, 42, 0.9)',
                        border: '1px solid rgba(167, 139, 250, 0.3)',
                        borderRadius: '8px',
                        padding: '10px',
                        fontSize: '11px',
                        lineHeight: '1.4',
                      }}
                    >
                      <div style={{ color: '#a78bfa', fontWeight: 700, marginBottom: '4px' }}>
                        🧠 Groq 120B Structural Feasibility Brief:
                      </div>
                      <div style={{ color: '#e2e8f0', whiteSpace: 'pre-line' }}>{review}</div>
                    </div>
                  )}

                  <div style={{ fontSize: '10px', color: '#f87171', marginTop: '4px' }}>
                    ⚠️ Preliminary planning estimate. Requires professional geotechnical and structural assessment.
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* MODULE 6: GOVERNMENT REPORTS */}
        {activeTab === 'reports' && (
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
              Statutory government incident and planning dossiers ready for authority review and PDF export.
            </div>

            {reports.map((rpt) => (
              <div key={rpt.reportId} className="info-card" style={{ marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span style={{ fontSize: '10px', fontFamily: "'JetBrains Mono', monospace", color: '#38bdf8' }}>
                      {rpt.reportId}
                    </span>
                    <div style={{ fontWeight: 700, fontSize: '12px', marginTop: '2px' }}>{rpt.title}</div>
                  </div>
                  <span style={{ fontSize: '9px', fontWeight: 700, color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                    {rpt.priority}
                  </span>
                </div>

                <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '6px 0' }}>
                  {rpt.summary}
                </p>

                <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginBottom: '8px' }}>
                  Target Authority: {rpt.requiredAuthority}
                </div>

                <button
                  className="btn"
                  style={{ width: '100%', fontSize: '11px' }}
                  onClick={() => alert(`Exporting ${rpt.reportId} as structured statutory government PDF record...`)}
                >
                  📄 Export Statutory Dossier
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Interactive Chat with Traffic Control AI */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '10px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>💬 Operator AI Tactical Query</span>
          </div>

          {chatHistory.length > 0 && (
            <div style={{ maxHeight: '140px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '8px' }}>
              {chatHistory.map((msg, i) => (
                <div
                  key={i}
                  style={{
                    padding: '6px 8px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    background: msg.role === 'operator' ? 'rgba(56, 189, 248, 0.15)' : 'var(--bg-dark-900)',
                    border: msg.role === 'operator' ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid var(--border-subtle)',
                  }}
                >
                  <strong style={{ color: msg.role === 'operator' ? '#38bdf8' : '#10b981' }}>
                    {msg.role === 'operator' ? 'Operator: ' : 'AI Agent: '}
                  </strong>
                  <span>{msg.text}</span>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleAskAgent} style={{ display: 'flex', gap: '6px' }}>
            <input
              type="text"
              value={operatorQuestion}
              onChange={(e) => setOperatorQuestion(e.target.value)}
              placeholder="Ask AI agent (e.g. explain WEH congestion)..."
              disabled={aiLoading}
              style={{
                flex: 1,
                padding: '6px 8px',
                borderRadius: '6px',
                border: '1px solid var(--border-card)',
                background: 'var(--bg-dark-900)',
                color: '#fff',
                fontSize: '11px',
                outline: 'none',
              }}
            />
            <button type="submit" className="btn btn-primary" disabled={aiLoading || !operatorQuestion.trim()} style={{ fontSize: '11px', padding: '4px 10px' }}>
              {aiLoading ? '...' : 'Ask'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
