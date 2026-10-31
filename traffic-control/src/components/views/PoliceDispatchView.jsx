import React, { useState, useEffect } from 'react';
import { policeStore } from '../../services/policeStore';
import { eventBus, EVENT_TYPES } from '../../services/eventBus';

export default function PoliceDispatchView({
  selectedCityId,
  orchestratorOutput,
  onNavigateToMap,
  onInspectRouteOnMap,
}) {
  const [activeTab, setActiveTab] = useState('incidents'); // 'incidents' | 'resources' | 'deployments' | 'history'
  const [resources, setResources] = useState([]);
  const [dispatches, setDispatches] = useState([]);
  const [history, setHistory] = useState([]);
  
  // Dispatch Modal State
  const [selectedIncidentForDispatch, setSelectedIncidentForDispatch] = useState(null);
  const [selectedUnitId, setSelectedUnitId] = useState('');
  const [dispatchReason, setDispatchReason] = useState('');

  // Add Resource Modal State
  const [isAddUnitOpen, setIsAddUnitOpen] = useState(false);
  const [newUnitCode, setNewUnitCode] = useState('');
  const [newOfficerName, setNewOfficerName] = useState('');
  const [newStation, setNewStation] = useState('');
  const [newDeployType, setNewDeployType] = useState('MOTORCYCLE_PATROL');

  // Load and subscribe to real-time policeStore updates
  const loadStoreData = () => {
    setResources(policeStore.getResourcesForCity(selectedCityId));
    setDispatches(policeStore.getDispatchesForCity(selectedCityId));
    setHistory(policeStore.getDispatchHistory(30));
  };

  useEffect(() => {
    loadStoreData();

    const unsub1 = eventBus.subscribe(EVENT_TYPES.POLICE_AVAILABILITY_CHANGED, loadStoreData);
    const unsub2 = eventBus.subscribe(EVENT_TYPES.DISPATCH_APPROVED, loadStoreData);
    const unsub3 = eventBus.subscribe(EVENT_TYPES.UNIT_DISPATCHED, loadStoreData);

    return () => {
      unsub1();
      unsub2();
      unsub3();
    };
  }, [selectedCityId]);

  const redZones = orchestratorOutput?.detection?.redZones || [];
  const availableUnits = resources.filter((r) => r.availabilityStatus === 'AVAILABLE');
  const deployedUnits = resources.filter((r) => r.availabilityStatus === 'DEPLOYED');

  const handleOpenDispatchModal = (rz) => {
    setSelectedIncidentForDispatch(rz);
    // Find nearest units
    const nearest = policeStore.findNearestUnits(selectedCityId, rz.centerCoordinates || [19.076, 72.877]);
    const firstAvail = nearest.find((u) => u.availabilityStatus === 'AVAILABLE');
    setSelectedUnitId(firstAvail ? firstAvail.id : (nearest[0]?.id || ''));
    setDispatchReason(`Proximity clearance dispatch for severe congestion on ${rz.corridorName}`);
  };

  const handleConfirmDispatch = () => {
    if (!selectedIncidentForDispatch || !selectedUnitId) return;

    const unit = resources.find((r) => r.id === selectedUnitId);
    if (!unit) return;

    const dispatchRecord = policeStore.createDispatch({
      incident: selectedIncidentForDispatch,
      unit,
      reason: dispatchReason,
    });

    setSelectedIncidentForDispatch(null);
    loadStoreData();

    if (onInspectRouteOnMap) {
      onInspectRouteOnMap(dispatchRecord.routeCoordinates, dispatchRecord);
    }
  };

  const handleAdvanceStatus = (dispatchId, nextStatus) => {
    policeStore.advanceDispatchStatus(dispatchId, nextStatus);
    loadStoreData();
  };

  const handleAddUnit = (e) => {
    e.preventDefault();
    if (!newOfficerName || !newStation) return;

    policeStore.addResource({
      cityId: selectedCityId,
      unitCode: newUnitCode || `TP-${selectedCityId.toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
      officerInCharge: newOfficerName,
      policeStation: newStation,
      deploymentType: newDeployType,
      coordinates: selectedCityId === 'nagpur' ? [21.1458, 79.0882] : selectedCityId === 'pune' ? [18.5204, 73.8567] : [19.0760, 72.8777],
    });

    setIsAddUnitOpen(false);
    setNewOfficerName('');
    setNewStation('');
    setNewUnitCode('');
    loadStoreData();
  };

  return (
    <div className="view-panel">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>
            Traffic Police Dispatch & Resource Command
          </h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
            Authoritative police unit coordination matching verified stations and mobile patrols to acute choke points.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button onClick={() => setIsAddUnitOpen(true)} className="btn btn-secondary" style={{ fontSize: '0.75rem' }}>
            <span>➕ Add Patrol Unit</span>
          </button>
          <span className="badge-data-integrity badge-live">● VERIFIED DEPARTMENT & SIMULATED</span>
        </div>
      </div>

      {/* Top 4 Metric Boxes */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <div className="metric-box" style={{ background: 'var(--color-surface-0)', border: '1px solid var(--color-border)' }}>
          <div className="metric-label">Total Department Units</div>
          <div className="metric-value">{resources.length}</div>
          <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-tertiary)', marginTop: '4px' }}>
            Jurisdiction: {selectedCityId.toUpperCase()}
          </div>
        </div>

        <div className="metric-box" style={{ background: 'var(--color-surface-0)', border: '1px solid var(--color-border)' }}>
          <div className="metric-label">Available for Dispatch</div>
          <div className="metric-value" style={{ color: '#10b981' }}>{availableUnits.length}</div>
          <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-tertiary)', marginTop: '4px' }}>
            Ready for intervention
          </div>
        </div>

        <div className="metric-box" style={{ background: 'var(--color-surface-0)', border: '1px solid var(--color-border)' }}>
          <div className="metric-label">Currently Deployed</div>
          <div className="metric-value" style={{ color: 'var(--color-primary)' }}>{deployedUnits.length}</div>
          <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-tertiary)', marginTop: '4px' }}>
            On-ground response active
          </div>
        </div>

        <div className="metric-box" style={{ background: 'var(--color-surface-0)', border: '1px solid var(--color-border)' }}>
          <div className="metric-label">Active Red Zone Incidents</div>
          <div className="metric-value" style={{ color: redZones.length > 0 ? 'var(--color-critical)' : 'var(--color-text-secondary)' }}>
            {redZones.length}
          </div>
          <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-tertiary)', marginTop: '4px' }}>
            Pending clearance
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="segmented-control" style={{ width: 'fit-content' }}>
        <button
          onClick={() => setActiveTab('incidents')}
          className={`segmented-btn ${activeTab === 'incidents' ? 'active' : ''}`}
        >
          🚨 Active Incidents ({redZones.length})
        </button>
        <button
          onClick={() => setActiveTab('resources')}
          className={`segmented-btn ${activeTab === 'resources' ? 'active' : ''}`}
        >
          🚓 Resource Inventory ({resources.length})
        </button>
        <button
          onClick={() => setActiveTab('deployments')}
          className={`segmented-btn ${activeTab === 'deployments' ? 'active' : ''}`}
        >
          🧭 Field Deployments ({dispatches.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`segmented-btn ${activeTab === 'history' ? 'active' : ''}`}
        >
          📋 Dispatch Audit Log
        </button>
      </div>

      {/* ─── TAB 1: ACTIVE INCIDENTS & DISPATCH INITIATION ─── */}
      {activeTab === 'incidents' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {redZones.length === 0 ? (
            <div
              className="info-card"
              style={{
                background: 'var(--color-surface-0)',
                padding: '3rem',
                textAlign: 'center',
                color: 'var(--color-text-tertiary)',
              }}
            >
              <span style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem' }}>🟢</span>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                No Active Red Zones in {selectedCityId.toUpperCase()}
              </h3>
              <p style={{ fontSize: '0.8125rem', maxWidth: '420px', margin: '0.5rem auto 1rem' }}>
                All monitored corridors are flowing normally. You can use the Traffic Sandbox to simulate acute congestion or draw a blockage line.
              </p>
              <button onClick={onNavigateToMap} className="btn btn-secondary">
                <span>🗺️ Open Live Traffic Map</span>
              </button>
            </div>
          ) : (
            redZones.map((rz) => {
              const assignedDispatch = dispatches.find((d) => d.incidentId === rz.id && d.status !== 'COMPLETED');

              return (
                <div
                  key={rz.id}
                  className="info-card"
                  style={{
                    background: 'var(--color-surface-0)',
                    border: `1.5px solid ${rz.severity === 'DARK_RED' ? '#991b1b' : 'var(--color-border)'}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1.25rem' }}>🚨</span>
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                          {rz.corridorName}
                        </h3>
                        {rz.isSimulated && (
                          <span className="badge-data-integrity badge-simulated">● SIMULATED INCIDENT</span>
                        )}
                      </div>
                      <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-tertiary)' }}>
                        Incident Ref: {rz.id} · Priority: <strong style={{ color: rz.color }}>{rz.severityLabel}</strong>
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {assignedDispatch ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#3b82f6', background: 'rgba(59,130,246,0.12)', padding: '4px 10px', borderRadius: 'var(--radius-pill)' }}>
                            🚓 Unit {assignedDispatch.unitCode} ({assignedDispatch.status})
                          </span>
                          <button
                            onClick={() => {
                              policeStore.setActiveRoute({
                                dispatchId: assignedDispatch.id,
                                coordinates: assignedDispatch.routeCoordinates,
                                unitCode: assignedDispatch.unitCode,
                                destinationName: assignedDispatch.destinationLocation.name,
                              });
                              if (onNavigateToMap) onNavigateToMap();
                            }}
                            className="btn btn-secondary"
                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                          >
                            <span>🗺️ View Route</span>
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleOpenDispatchModal(rz)}
                          className="btn btn-primary"
                        >
                          <span>🚨 INITIATE DISPATCH</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="metric-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                    <div className="metric-box">
                      <div className="metric-label">Current Velocity</div>
                      <div style={{ fontSize: '1rem', fontWeight: 800, color: rz.color }}>
                        {rz.currentSpeedKmH || 4} km/h
                      </div>
                    </div>
                    <div className="metric-box">
                      <div className="metric-label">Free-flow Speed</div>
                      <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>
                        {rz.freeFlowSpeedKmH || 60} km/h
                      </div>
                    </div>
                    <div className="metric-box">
                      <div className="metric-label">Congestion Ratio</div>
                      <div style={{ fontSize: '1rem', fontWeight: 800, color: rz.color }}>
                        {rz.speedRatio} ({(rz.speedRatio * 100).toFixed(0)}%)
                      </div>
                    </div>
                    <div className="metric-box">
                      <div className="metric-label">Est. Queue Delay</div>
                      <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-critical)' }}>
                        +{rz.delayMinutes} mins
                      </div>
                    </div>
                  </div>

                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                    <strong>Incident Description:</strong> {rz.description}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ─── TAB 2: RESOURCE INVENTORY & MANAGEMENT ─── */}
      {activeTab === 'resources' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
            {resources.map((res) => {
              const isAvail = res.availabilityStatus === 'AVAILABLE';
              const isDeployed = res.availabilityStatus === 'DEPLOYED';

              return (
                <div
                  key={res.id}
                  className="info-card"
                  style={{
                    background: 'var(--color-surface-0)',
                    border: '1px solid var(--color-border)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.625rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <span style={{ fontSize: '1.1rem' }}>🚓</span>
                        <strong style={{ fontSize: '0.875rem', color: 'var(--color-text-primary)' }}>
                          {res.unitCode}
                        </strong>
                        {res.isCustom && (
                          <span className="badge-data-integrity badge-simulated">SIMULATED</span>
                        )}
                      </div>
                      <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-tertiary)' }}>
                        {res.policeStation}
                      </span>
                    </div>

                    <span
                      style={{
                        fontSize: '0.6875rem',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-pill)',
                        background: isAvail ? 'rgba(16, 185, 129, 0.15)' : isDeployed ? 'rgba(59, 130, 246, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        color: isAvail ? '#10b981' : isDeployed ? '#3b82f6' : '#ef4444',
                        border: `1px solid ${isAvail ? 'rgba(16, 185, 129, 0.3)' : isDeployed ? 'rgba(59, 130, 246, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                      }}
                    >
                      ● {res.availabilityStatus}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <div><strong>Officer in Charge:</strong> {res.officerInCharge}</div>
                    <div><strong>Beat Location:</strong> {res.location?.name || 'Metropolitan Sector'}</div>
                    <div><strong>Specialty:</strong> {res.capability} ({res.deploymentType})</div>
                  </div>

                  {/* Manual Availability Toggle (Simulation Mode) */}
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto', paddingTop: '0.5rem', borderTop: '1px solid var(--color-divider)' }}>
                    <select
                      value={res.availabilityStatus}
                      onChange={(e) => {
                        policeStore.updateResource(res.id, { availabilityStatus: e.target.value });
                        loadStoreData();
                      }}
                      className="jurisdiction-select"
                      style={{ flex: 1, padding: '4px 8px', fontSize: '0.6875rem' }}
                    >
                      <option value="AVAILABLE">Mark AVAILABLE</option>
                      <option value="DEPLOYED">Mark DEPLOYED</option>
                      <option value="BUSY">Mark BUSY</option>
                      <option value="OFF_DUTY">Mark OFF_DUTY</option>
                    </select>

                    {res.isCustom && (
                      <button
                        onClick={() => {
                          policeStore.deleteResource(res.id);
                          loadStoreData();
                        }}
                        className="btn btn-outline"
                        style={{ padding: '4px 8px', fontSize: '0.6875rem', color: 'var(--color-critical)' }}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── TAB 3: FIELD DEPLOYMENTS & LIFECYCLE ─── */}
      {activeTab === 'deployments' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {dispatches.length === 0 ? (
            <div className="info-card" style={{ background: 'var(--color-surface-0)', padding: '2rem', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
              No active field deployments at this time. Go to Active Incidents to initiate a dispatch.
            </div>
          ) : (
            dispatches.map((disp) => {
              const statusOrder = ['APPROVED', 'DISPATCHED', 'EN_ROUTE', 'ON_SITE', 'COMPLETED'];
              const curIndex = statusOrder.indexOf(disp.status);

              return (
                <div
                  key={disp.id}
                  className="info-card"
                  style={{
                    background: 'var(--color-surface-0)',
                    border: '1px solid var(--color-border)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1.25rem' }}>🚓</span>
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                          Deployment {disp.unitCode} → {disp.destinationLocation.name}
                        </h3>
                      </div>
                      <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-tertiary)' }}>
                        Officer: {disp.officerInCharge} ({disp.policeStation}) · Distance: <strong>{disp.distanceKm} km</strong> (ETA: ~{disp.etaMinutes}m)
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => {
                          policeStore.setActiveRoute({
                            dispatchId: disp.id,
                            coordinates: disp.routeCoordinates,
                            unitCode: disp.unitCode,
                            destinationName: disp.destinationLocation.name,
                          });
                          if (onNavigateToMap) onNavigateToMap();
                        }}
                        className="btn btn-secondary"
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                      >
                        <span>🗺️ View Response Route on Map</span>
                      </button>
                    </div>
                  </div>

                  {/* Lifecycle Progression Progress Bar */}
                  <div style={{ display: 'flex', gap: '4px', background: 'var(--color-surface-1)', padding: '4px', borderRadius: 'var(--radius-pill)' }}>
                    {statusOrder.map((s, idx) => {
                      const isPastOrCurrent = idx <= curIndex;
                      const isCurrent = s === disp.status;
                      return (
                        <div
                          key={s}
                          style={{
                            flex: 1,
                            textAlign: 'center',
                            fontSize: '0.625rem',
                            fontWeight: 700,
                            padding: '4px 2px',
                            borderRadius: 'var(--radius-pill)',
                            background: isCurrent ? 'var(--color-primary)' : isPastOrCurrent ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                            color: isCurrent ? '#ffffff' : isPastOrCurrent ? 'var(--color-primary)' : 'var(--color-text-tertiary)',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          {s.replace('_', ' ')}
                        </div>
                      );
                    })}
                  </div>

                  {/* State Advance Action Controls */}
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
                      Advance Lifecycle Step:
                    </span>
                    {disp.status === 'APPROVED' && (
                      <button onClick={() => handleAdvanceStatus(disp.id, 'DISPATCHED')} className="btn btn-primary" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>
                        Mark Unit Dispatched →
                      </button>
                    )}
                    {disp.status === 'DISPATCHED' && (
                      <button onClick={() => handleAdvanceStatus(disp.id, 'EN_ROUTE')} className="btn btn-primary" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>
                        Mark Unit En Route →
                      </button>
                    )}
                    {disp.status === 'EN_ROUTE' && (
                      <button onClick={() => handleAdvanceStatus(disp.id, 'ON_SITE')} className="btn btn-primary" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>
                        Mark Unit Arrived On-Site →
                      </button>
                    )}
                    {disp.status === 'ON_SITE' && (
                      <button onClick={() => handleAdvanceStatus(disp.id, 'COMPLETED')} className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.75rem', color: '#10b981' }}>
                        ✓ Complete Incident Intervention
                      </button>
                    )}
                    {disp.status !== 'COMPLETED' && (
                      <button onClick={() => handleAdvanceStatus(disp.id, 'CANCELLED')} className="btn btn-ghost" style={{ padding: '4px 8px', fontSize: '0.75rem', color: 'var(--color-critical)' }}>
                        Cancel Dispatch
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ─── TAB 4: DISPATCH AUDIT LOG & HISTORY ─── */}
      {activeTab === 'history' && (
        <div className="info-card" style={{ background: 'var(--color-surface-0)', padding: '1rem' }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--color-text-primary)' }}>
            Statutory Police Deployment Audit Trail
          </h3>
          {history.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--color-text-tertiary)', padding: '2rem' }}>
              No recorded dispatch events in this session.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {history.map((h, i) => (
                <div
                  key={i}
                  style={{
                    padding: '0.5rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--color-surface-1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.75rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>🚓</span>
                    <strong>{h.unitCode}</strong>
                    <span style={{ color: 'var(--color-text-secondary)' }}>
                      action: <strong style={{ color: 'var(--color-primary)' }}>{h.action}</strong> at {h.destinationLocation?.name}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-tertiary)' }}>
                    {new Date(h.timestamp || h.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── MODAL: INITIATE DISPATCH CONFIGURATION ─── */}
      {selectedIncidentForDispatch && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(6px)',
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
          onClick={() => setSelectedIncidentForDispatch(null)}
        >
          <div
            style={{
              background: 'var(--color-surface-0)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-xl)',
              width: '100%',
              maxWidth: '560px',
              padding: '1.5rem',
              boxShadow: 'var(--shadow-xl)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              color: 'var(--color-text-primary)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.5rem' }}>🚔</span>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 800 }}>
                  Configure Police Dispatch Intervention
                </h3>
              </div>
              <button
                onClick={() => setSelectedIncidentForDispatch(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--color-text-tertiary)', fontSize: '18px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ background: 'var(--color-surface-1)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-tertiary)' }}>Target Incident Destination</div>
              <strong style={{ fontSize: '0.9375rem', color: 'var(--color-critical)' }}>
                {selectedIncidentForDispatch.corridorName}
              </strong>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                Delay: +{selectedIncidentForDispatch.delayMinutes} mins · Velocity: {selectedIncidentForDispatch.currentSpeedKmH} km/h
              </div>
            </div>

            {/* Select Unit from Nearest Units */}
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                Select Available Responding Patrol Unit
              </label>
              <select
                value={selectedUnitId}
                onChange={(e) => setSelectedUnitId(e.target.value)}
                className="jurisdiction-select"
                style={{ width: '100%', padding: '0.5rem' }}
              >
                {policeStore
                  .findNearestUnits(selectedCityId, selectedIncidentForDispatch.centerCoordinates || [19.076, 72.877])
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.unitCode} ({u.officerInCharge}) — {u.distanceKm} km away (ETA: ~{u.etaMinutes}m) [{u.availabilityStatus}]
                    </option>
                  ))}
              </select>
            </div>

            {/* Rationale / Instructions */}
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                Tactical Directive / Dispatch Reason
              </label>
              <textarea
                value={dispatchReason}
                onChange={(e) => setDispatchReason(e.target.value)}
                className="search-input"
                rows="2"
                style={{ width: '100%', resize: 'none', padding: '0.5rem' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button onClick={handleConfirmDispatch} className="btn btn-primary" style={{ flex: 1 }}>
                <span>✓ Authorize & Dispatch Unit</span>
              </button>
              <button onClick={() => setSelectedIncidentForDispatch(null)} className="btn btn-ghost">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: ADD TEST / SIMULATED UNIT ─── */}
      {isAddUnitOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(6px)',
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
          onClick={() => setIsAddUnitOpen(false)}
        >
          <form
            onSubmit={handleAddUnit}
            style={{
              background: 'var(--color-surface-0)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-xl)',
              width: '100%',
              maxWidth: '460px',
              padding: '1.5rem',
              boxShadow: 'var(--shadow-xl)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              color: 'var(--color-text-primary)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 800 }}>➕ Add Simulated Patrol Unit</h3>
              <button
                type="button"
                onClick={() => setIsAddUnitOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--color-text-tertiary)', fontSize: '18px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '2px' }}>
                Unit Call Sign / Code
              </label>
              <input
                type="text"
                placeholder="e.g. TP-MUM-BAND-09"
                value={newUnitCode}
                onChange={(e) => setNewUnitCode(e.target.value)}
                className="search-input"
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '2px' }}>
                Officer In Charge
              </label>
              <input
                type="text"
                placeholder="e.g. Inspector R. K. Sawant"
                value={newOfficerName}
                onChange={(e) => setNewOfficerName(e.target.value)}
                required
                className="search-input"
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '2px' }}>
                Police Station / Beat
              </label>
              <input
                type="text"
                placeholder="e.g. Western Division HQ"
                value={newStation}
                onChange={(e) => setNewStation(e.target.value)}
                required
                className="search-input"
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '2px' }}>
                Deployment Type
              </label>
              <select
                value={newDeployType}
                onChange={(e) => setNewDeployType(e.target.value)}
                className="jurisdiction-select"
                style={{ width: '100%', padding: '0.5rem' }}
              >
                <option value="MOTORCYCLE_PATROL">🏍️ Motorcycle Quick Interceptor</option>
                <option value="INTERCEPTOR_SUV">🚙 Patrol SUV Interceptor</option>
                <option value="JUNCTION_POST">🛑 Static Junction Point Duty</option>
                <option value="CRANE_TOW_UNIT">🏗️ Heavy Tow Clearance Vehicle</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                <span>Save Unit</span>
              </button>
              <button type="button" onClick={() => setIsAddUnitOpen(false)} className="btn btn-ghost">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
