import React, { useState, useEffect } from 'react';
import { TRAFFIC_LEVELS } from '../../config/mapConfig';
import { trafficStore } from '../../services/trafficStore';

export default function TrafficConditionEditorDrawer({
  segment,
  cityId,
  onClose,
  onUpdate,
  onDelete,
  onCreateRedZone,
}) {
  if (!segment) return null;

  const [currentSpeed, setCurrentSpeed] = useState(segment.currentSpeedKmH ?? 45);
  const [freeFlowSpeed, setFreeFlowSpeed] = useState(segment.freeFlowSpeedKmH ?? 60);
  const [severity, setSeverity] = useState(segment.congestionLevel || 'FREE_FLOW');
  const [delayMins, setDelayMins] = useState(segment.delaySeconds ? Math.round(segment.delaySeconds / 60) : 5);
  const [incidentType, setIncidentType] = useState(segment.incident || 'NONE');
  const [description, setDescription] = useState(segment.description || '');
  const [isEnabled, setIsEnabled] = useState(segment.enabled !== false);

  useEffect(() => {
    setCurrentSpeed(segment.currentSpeedKmH ?? 45);
    setFreeFlowSpeed(segment.freeFlowSpeedKmH ?? 60);
    setSeverity(segment.congestionLevel || 'FREE_FLOW');
    setDelayMins(segment.delaySeconds ? Math.round(segment.delaySeconds / 60) : 5);
    setIncidentType(segment.incident || 'NONE');
    setDescription(segment.description || '');
    setIsEnabled(segment.enabled !== false);
  }, [segment]);

  const congestionRatio = freeFlowSpeed > 0 ? +(currentSpeed / freeFlowSpeed).toFixed(2) : 1.0;

  // Auto-calculate severity from speed change or let user manually override
  const handleSpeedChange = (newSpeed) => {
    setCurrentSpeed(newSpeed);
    const r = freeFlowSpeed > 0 ? newSpeed / freeFlowSpeed : 1.0;
    if (r <= 0.10 || newSpeed <= 4) setSeverity('BLOCKED');
    else if (r <= 0.25) setSeverity('SEVERE');
    else if (r <= 0.50) setSeverity('HEAVY');
    else if (r <= 0.75) setSeverity('MODERATE');
    else setSeverity('FREE_FLOW');
  };

  const handleSeveritySelect = (levelKey) => {
    setSeverity(levelKey);
    const lvl = TRAFFIC_LEVELS[levelKey];
    if (lvl) {
      if (levelKey === 'BLOCKED') setCurrentSpeed(4);
      else if (levelKey === 'SEVERE') setCurrentSpeed(Math.round(freeFlowSpeed * 0.20));
      else if (levelKey === 'HEAVY') setCurrentSpeed(Math.round(freeFlowSpeed * 0.40));
      else if (levelKey === 'MODERATE') setCurrentSpeed(Math.round(freeFlowSpeed * 0.65));
      else setCurrentSpeed(freeFlowSpeed);
    }
  };

  const handleSave = () => {
    const updated = {
      currentSpeedKmH: currentSpeed,
      freeFlowSpeedKmH: freeFlowSpeed,
      speedRatio: congestionRatio,
      delaySeconds: delayMins * 60,
      congestionLevel: severity,
      color: TRAFFIC_LEVELS[severity]?.color || '#3b82f6',
      incident: incidentType === 'NONE' ? null : incidentType,
      description,
      enabled: isEnabled,
    };

    trafficStore.updateSegmentCondition(cityId, segment.id, updated);
    if (onUpdate) onUpdate(updated);
  };

  const handleMarkAsRedZone = () => {
    handleSeveritySelect('BLOCKED');
    setDelayMins(30);
    setIncidentType('CRITICAL_STANDSTILL');
    trafficStore.createManualRedZone(cityId, segment.id);
    if (onCreateRedZone) onCreateRedZone(segment);
  };

  const isCustomDrawn = segment.source === 'SIMULATED_CUSTOM' || segment.id.startsWith('custom_seg_');

  return (
    <div className="context-drawer" style={{ width: '400px' }}>
      <div className="context-drawer-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1rem' }}>🎛️</span>
            <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              Traffic Condition Editor
            </span>
          </div>
          <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-tertiary)' }}>
            Segment ID: {segment.id}
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
        {/* Source and Status Badges */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span className={`badge-data-integrity ${segment.source?.includes('SIMULATED') ? 'badge-simulated' : 'badge-live'}`}>
            ● SOURCE: {segment.source || 'LIVE'}
          </span>
          {isCustomDrawn && (
            <span style={{ fontSize: '0.6875rem', color: '#8b5cf6', fontWeight: 700 }}>
              CUSTOM DRAWN LINK
            </span>
          )}
        </div>

        {/* Road Name */}
        <div className="detail-item">
          <span className="detail-label">Road / Corridor Name</span>
          <span className="detail-value" style={{ fontWeight: 700 }}>
            {segment.corridorName}
          </span>
        </div>

        {/* Severity Selector Pills */}
        <div>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '6px', display: 'block' }}>
            Congestion Severity Level
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '4px' }}>
            {Object.keys(TRAFFIC_LEVELS).filter((k) => k !== 'UNKNOWN').map((k) => {
              const lvl = TRAFFIC_LEVELS[k];
              const isSel = severity === k;
              return (
                <button
                  key={k}
                  onClick={() => handleSeveritySelect(k)}
                  style={{
                    padding: '6px 2px',
                    borderRadius: 'var(--radius-sm)',
                    border: `1.5px solid ${isSel ? lvl.color : 'var(--color-border)'}`,
                    background: isSel ? `${lvl.color}25` : 'var(--color-surface-1)',
                    color: isSel ? lvl.color : 'var(--color-text-tertiary)',
                    fontSize: '0.625rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {lvl.label.split(' ')[0]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Speed Slider & Metrics */}
        <div style={{ background: 'var(--color-surface-1)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
              Current Speed (km/h)
            </span>
            <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-primary)' }}>
              {currentSpeed} km/h
            </span>
          </div>
          <input
            type="range"
            min="2"
            max="100"
            value={currentSpeed}
            onChange={(e) => handleSpeedChange(Number(e.target.value))}
            style={{ width: '100%', cursor: 'pointer' }}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '10px' }}>
            <div>
              <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-tertiary)' }}>Free-flow Speed</span>
              <input
                type="number"
                min="20"
                max="120"
                value={freeFlowSpeed}
                onChange={(e) => setFreeFlowSpeed(Number(e.target.value))}
                className="search-input"
                style={{ padding: '4px 8px', fontSize: '0.75rem', marginTop: '2px' }}
              />
            </div>
            <div>
              <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-tertiary)' }}>Congestion Ratio</span>
              <div style={{ fontSize: '0.875rem', fontWeight: 800, marginTop: '6px', color: congestionRatio < 0.25 ? 'var(--color-critical)' : 'var(--color-accent)' }}>
                {congestionRatio} ({(congestionRatio * 100).toFixed(0)}%)
              </div>
            </div>
          </div>
        </div>

        {/* Travel Delay & Incident Type */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div>
            <label style={{ fontSize: '0.6875rem', color: 'var(--color-text-tertiary)', display: 'block', marginBottom: '2px' }}>
              Delay (Minutes)
            </label>
            <input
              type="number"
              min="0"
              max="180"
              value={delayMins}
              onChange={(e) => setDelayMins(Number(e.target.value))}
              className="search-input"
              style={{ padding: '6px 8px', fontSize: '0.75rem' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '0.6875rem', color: 'var(--color-text-tertiary)', display: 'block', marginBottom: '2px' }}>
              Incident Classification
            </label>
            <select
              value={incidentType}
              onChange={(e) => setIncidentType(e.target.value)}
              className="jurisdiction-select"
              style={{ padding: '5px 8px', fontSize: '0.75rem' }}
            >
              <option value="NONE">None (Typical Flow)</option>
              <option value="ROAD_BLOCKAGE">🚨 Complete Road Blockage</option>
              <option value="SEVERE_WATERLOGGING">🌊 Monsoon Waterlogging</option>
              <option value="HEAVY_VEHICLE_BREAKDOWN">🚛 Heavy Vehicle Breakdown</option>
              <option value="ROAD_CONSTRUCTION_RESTRICTION">🚧 Metro / Road Construction</option>
              <option value="SIGNAL_FAILURE">🚦 Traffic Signal Malfunction</option>
            </select>
          </div>
        </div>

        {/* Description / Notes */}
        <div>
          <label style={{ fontSize: '0.6875rem', color: 'var(--color-text-tertiary)', display: 'block', marginBottom: '2px' }}>
            Operational Description
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="search-input"
            style={{ padding: '6px 8px', fontSize: '0.75rem' }}
            placeholder="e.g. Lane constriction due to water buildup"
          />
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
          <button onClick={handleSave} className="btn btn-primary" style={{ width: '100%' }}>
            <span>💾 Apply & Update Map Flow</span>
          </button>

          <button onClick={handleMarkAsRedZone} className="btn btn-critical" style={{ width: '100%' }}>
            <span>🚨 Convert to Severe Red Zone</span>
          </button>

          {isCustomDrawn && (
            <button
              onClick={() => {
                trafficStore.deleteCustomSegment(cityId, segment.id);
                if (onDelete) onDelete(segment.id);
                onClose();
              }}
              className="btn btn-outline"
              style={{ width: '100%', color: 'var(--color-critical)', borderColor: 'var(--color-critical-border)' }}
            >
              <span>🗑️ Delete Custom Segment</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
