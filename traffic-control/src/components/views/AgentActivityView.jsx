import React, { useState, useEffect } from 'react';
import { agentActivityService } from '../../services/agentActivityService';
import AgentExecutionDetailModal from '../drawers/AgentExecutionDetailModal';

export default function AgentActivityView({
  selectedCityId,
  orchestratorOutput,
}) {
  const [status, setStatus] = useState(agentActivityService.getStatus());
  const [history, setHistory] = useState(agentActivityService.getHistory());
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedExecution, setSelectedExecution] = useState(null);
  const [isDiagnosticRunning, setIsDiagnosticRunning] = useState(false);

  useEffect(() => {
    const unsubscribe = agentActivityService.subscribe((data) => {
      setStatus(data.status);
      setHistory([...data.history]);
    });
    return () => unsubscribe();
  }, []);

  const handleRunDiagnostic = async () => {
    setIsDiagnosticRunning(true);
    await agentActivityService.runDiagnosticCycle(selectedCityId);
    setIsDiagnosticRunning(false);
  };

  const filteredHistory = history.filter((item) => {
    if (selectedCategory === 'ALL') return true;
    return item.category === selectedCategory;
  });

  return (
    <div className="view-panel">
      {/* Top Header & Live Diagnostic Trigger */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>⚡ AI Agent Live Activity Center</span>
            <span
              style={{
                fontSize: '0.6875rem',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: '9999px',
                background: status === 'IDLE' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.2)',
                color: status === 'IDLE' ? '#10b981' : '#f59e0b',
                border: '1px solid currentColor',
              }}
            >
              ● {status === 'IDLE' ? 'AGENT ONLINE · IDLE' : status}
            </span>
          </h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
            Full observability of autonomous reasoning, sensor ingestion, police matching, and tactical recommendations.
          </p>
        </div>

        <button
          onClick={handleRunDiagnostic}
          disabled={isDiagnosticRunning}
          className="btn btn-primary"
          style={{ padding: '0.625rem 1.25rem' }}
        >
          <span>{isDiagnosticRunning ? '⚡ Running Agent Cycle...' : '▶ Run Agent Diagnostic Cycle'}</span>
        </button>
      </div>

      {/* Agent Status Ribbon */}
      <div
        className="info-card"
        style={{
          background: 'var(--color-surface-0)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: '#10b981',
              boxShadow: '0 0 10px #10b981',
              animation: 'pulse-ring 2s infinite',
            }}
          />
          <div>
            <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#fff' }}>
              Autonomous Traffic Orchestrator
            </div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-tertiary)' }}>
              Engine: Groq LLM (openai/gpt-oss-120b) + Leaflet GIS Spatial Engine
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem', fontFamily: 'JetBrains Mono' }}>
          <span style={{ color: 'var(--color-text-tertiary)' }}>
            Cycles Recorded: <strong style={{ color: '#fff' }}>{history.length}</strong>
          </span>
          <span style={{ color: 'var(--color-text-tertiary)' }}>
            Error Rate: <strong style={{ color: '#10b981' }}>0.0%</strong>
          </span>
        </div>
      </div>

      {/* Log Category Filter Tabs */}
      <div className="segmented-control" style={{ width: 'fit-content' }}>
        {[
          { id: 'ALL', label: 'All Logs' },
          { id: 'ingestion', label: 'Data Ingestion' },
          { id: 'detection', label: 'Traffic Detection' },
          { id: 'police', label: 'Police Availability' },
          { id: 'routing', label: 'Route Analysis' },
          { id: 'infrastructure', label: 'Infrastructure' },
          { id: 'reporting', label: 'Reporting' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedCategory(tab.id)}
            className={`segmented-btn ${selectedCategory === tab.id ? 'active' : ''}`}
            style={{ fontSize: '0.6875rem' }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Chronological Execution Timeline */}
      <div className="info-card" style={{ background: 'var(--color-surface-0)' }}>
        <div className="info-card-header">
          <span>Live Execution Timeline & Operational Logs</span>
          <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-tertiary)' }}>
            Click any entry to inspect input datasets and LLM output
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {filteredHistory.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
              No execution records in this category.
            </div>
          ) : (
            filteredHistory.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedExecution(item)}
                style={{
                  padding: '0.875rem',
                  background: 'var(--color-surface-1)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', minWidth: 0 }}>
                  <div
                    style={{
                      fontFamily: 'JetBrains Mono',
                      fontSize: '0.6875rem',
                      color: 'var(--color-text-tertiary)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {new Date(item.timestamp).toLocaleTimeString()}
                  </div>

                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <strong style={{ fontSize: '0.8125rem', color: '#fff' }}>
                        {item.module}
                      </strong>
                      <span
                        style={{
                          fontSize: '0.625rem',
                          fontFamily: 'JetBrains Mono',
                          padding: '1px 4px',
                          borderRadius: '3px',
                          background: 'rgba(255, 255, 255, 0.08)',
                          color: 'var(--color-text-secondary)',
                        }}
                      >
                        {item.id}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', truncate: true, marginTop: '2px' }}>
                      {item.analysis}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                  <span
                    style={{
                      fontSize: '0.6875rem',
                      fontWeight: 700,
                      color: '#10b981',
                      fontFamily: 'JetBrains Mono',
                    }}
                  >
                    {item.durationMs}ms
                  </span>
                  <span
                    style={{
                      fontSize: '0.6875rem',
                      fontWeight: 800,
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: 'rgba(16, 185, 129, 0.15)',
                      color: '#10b981',
                    }}
                  >
                    {item.status}
                  </span>
                  <span style={{ fontSize: '0.875rem', color: 'var(--color-accent)' }}>
                    ↗
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Execution Detail Modal */}
      {selectedExecution && (
        <AgentExecutionDetailModal
          execution={selectedExecution}
          onClose={() => setSelectedExecution(null)}
        />
      )}
    </div>
  );
}
