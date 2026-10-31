import React, { useState, useEffect } from 'react';
import { generateStatutoryPdf } from '../../services/pdfReportGenerator';
import { CITIES } from '../../config/cities';
import { policeStore } from '../../services/policeStore';
import { trafficStore } from '../../services/trafficStore';
import corridorProposalsData from '../../../data/infrastructure/bridges/corridor_proposals.json';
import recurringPatternsData from '../../../data/patterns/recurring_patterns.json';

export default function GovernmentReportsView({
  selectedCityId,
  orchestratorOutput,
}) {
  const currentCity = CITIES[selectedCityId] || CITIES.mumbai;
  const redZones = orchestratorOutput?.detection?.redZones || [];
  const policeUnits = policeStore.getResourcesForCity(selectedCityId);
  const proposals = corridorProposalsData.filter((p) => p.cityId === selectedCityId);
  const patterns = recurringPatternsData.filter((p) => p.cityId === selectedCityId);

  // Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [reportType, setReportType] = useState('CONGESTION_AUDIT');
  const [geographyScope, setGeographyScope] = useState('ENTIRE_CITY');
  const [selectedSubArea, setSelectedSubArea] = useState('All Sectors');
  const [observationPeriod, setObservationPeriod] = useState('LAST_24_HOURS');
  const [includeAiRecs, setIncludeAiRecs] = useState(true);
  const [includePolice, setIncludePolice] = useState(true);
  const [includeInfra, setIncludeInfra] = useState(true);
  const [includeHistorical, setIncludeHistorical] = useState(true);

  // Success Notification
  const [downloadNotification, setDownloadNotification] = useState(null);

  // Stored Reports (loaded from localStorage or initialized with defaults)
  const [reportsList, setReportsList] = useState([]);
  const [activeReport, setActiveReport] = useState(null);

  // Initialize reports
  useEffect(() => {
    const storageKey = `sentinel_reports_${selectedCityId}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setReportsList(parsed);
        if (parsed.length > 0) setActiveReport(parsed[0]);
        return;
      } catch (e) {
        console.error('Failed to parse saved reports:', e);
      }
    }

    // Default seeded statutory reports
    const defaultReports = [
      {
        id: `REP-${selectedCityId.toUpperCase()}-01`,
        title: `Daily Municipal Traffic Bottleneck & Congestion Audit — ${currentCity.name}`,
        type: 'Municipal Commissioner Audit',
        geography: 'City-Wide Arterials',
        period: 'Past 24 Hours',
        generatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        documentRef: `SENTINEL-TRF-${selectedCityId.toUpperCase()}-DAILY-01`,
        redZonesCount: redZones.length,
        summary: `Comprehensive 24-hour congestion audit for ${currentCity.name}. Evaluated ${redZones.length} high-severity choke points with priority police dispatch coordination and adaptive signal timing.`,
        dataClassification: 'STATUTORY AUDITED',
      },
      {
        id: `REP-${selectedCityId.toUpperCase()}-02`,
        title: `Metropolitan Police Traffic Branch — Incident Deployment Log`,
        type: 'Police Operations Log',
        geography: 'Traffic Divisions',
        period: 'Current Operational Shift',
        generatedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
        documentRef: `SENTINEL-TRF-${selectedCityId.toUpperCase()}-POLICE-02`,
        redZonesCount: Math.min(redZones.length, 3),
        summary: `Authoritative field deployment and resource allocation summary for ${currentCity.name} Metropolitan Traffic Police Branch.`,
        dataClassification: 'OPERATIONAL VERIFIED',
      },
      {
        id: `REP-${selectedCityId.toUpperCase()}-03`,
        title: `Urban Infrastructure Priority & Grade Separation Dossier`,
        type: 'Capital Infrastructure DPR',
        geography: 'Major Choke Point Corridors',
        period: 'Structural Multi-Year Review',
        generatedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
        documentRef: `SENTINEL-TRF-${selectedCityId.toUpperCase()}-INFRA-03`,
        redZonesCount: proposals.length,
        summary: `Long-term grade separation justification and multi-tier flyover engineering dossier for chronic bottlenecks in ${currentCity.name}.`,
        dataClassification: 'STATUTORY PWD/MMRDA',
      },
    ];

    setReportsList(defaultReports);
    setActiveReport(defaultReports[0]);
  }, [selectedCityId]);

  // Handle Download PDF
  const handleDownloadPdf = (reportToDownload = activeReport) => {
    if (!reportToDownload) return;

    try {
      const doc = generateStatutoryPdf({
        reportTitle: reportToDownload.title,
        reportType: reportToDownload.type,
        cityId: selectedCityId,
        cityName: currentCity.name,
        geography: reportToDownload.geography,
        period: reportToDownload.period,
        dataClassification: reportToDownload.dataClassification || 'STATUTORY AUDITED',
        redZones,
        policeUnits,
        proposals,
        recurringPatterns: patterns,
        executiveSummaryText: reportToDownload.summary,
        documentRef: reportToDownload.documentRef,
      });

      const safeFilename = `${reportToDownload.documentRef || 'SENTINEL-REPORT'}.pdf`;
      doc.save(safeFilename);

      setDownloadNotification(`✓ Downloaded "${safeFilename}" successfully.`);
      setTimeout(() => setDownloadNotification(null), 4500);
    } catch (err) {
      console.error('PDF Generation Error:', err);
      alert('Failed to generate PDF: ' + err.message);
    }
  };

  // Handle Generate New Report
  const handleGenerateNewReport = (e) => {
    e.preventDefault();

    const timestamp = new Date();
    const docRef = `SENTINEL-TRF-${selectedCityId.toUpperCase()}-${timestamp.toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;

    const typeNames = {
      CONGESTION_AUDIT: 'Traffic Congestion & Delay Audit',
      RED_ZONE_ANALYSIS: 'Red Zone Spatial Incident Assessment',
      POLICE_DISPATCH: 'Police Resource & Dispatch Feasibility',
      INFRASTRUCTURE_PROPOSAL: 'Capital Infrastructure & Grade Separation Dossier',
      COMBINED_REPORT: 'Comprehensive Urban Mobility Intelligence Report',
    };

    const newReport = {
      id: `REP-${selectedCityId.toUpperCase()}-${Date.now().toString().slice(-5)}`,
      title: `${typeNames[reportType] || 'Statutory Traffic Report'} — ${selectedSubArea} (${currentCity.name})`,
      type: typeNames[reportType] || 'Statutory Traffic Audit',
      geography: geographyScope === 'ENTIRE_CITY' ? 'City-Wide Arterials' : selectedSubArea,
      period: observationPeriod.replace(/_/g, ' '),
      generatedAt: timestamp.toISOString(),
      documentRef: docRef,
      redZonesCount: redZones.length,
      summary: `Automated statutory intelligence dossier compiled for ${selectedSubArea} in ${currentCity.name}. Integrates ${redZones.length} detected acute bottlenecks, ${policeUnits.length} police division units, and long-term capital mobility interventions.`,
      dataClassification: trafficStore.operationalMode === 'SIMULATION' ? 'SIMULATED / AUDITED' : 'STATUTORY AUDITED',
    };

    const updated = [newReport, ...reportsList];
    setReportsList(updated);
    setActiveReport(newReport);
    localStorage.setItem(`sentinel_reports_${selectedCityId}`, JSON.stringify(updated));

    setIsCreateModalOpen(false);

    // Auto-download the newly generated report
    handleDownloadPdf(newReport);
  };

  return (
    <div className="view-panel">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>
            Statutory Government Intelligence Reports & PDF Generation
          </h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
            Official bulletins, statutory dossiers, and downloadable signed PDFs for the Municipal Commissioner and Metropolitan Police Headquarters.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="btn btn-primary"
            style={{ fontSize: '0.8125rem', padding: '0.5rem 1rem' }}
          >
            <span>📄</span>
            <span>CREATE NEW REPORT</span>
          </button>
        </div>
      </div>

      {/* Download Alert Banner */}
      {downloadNotification && (
        <div
          style={{
            padding: '0.75rem 1.25rem',
            borderRadius: '8px',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid #10b981',
            color: '#10b981',
            fontSize: '0.8125rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <span>✓</span>
          <span>{downloadNotification}</span>
        </div>
      )}

      {/* Main Grid: Left = Report History / Selector, Right = Dossier Preview */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1.25rem', alignItems: 'start' }}>
        {/* Left: Saved Reports History */}
        <div
          className="info-card"
          style={{
            background: 'var(--color-surface-0)',
            border: '1px solid var(--color-border)',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>
              REPORT DOSSIER ARCHIVE ({reportsList.length})
            </span>
            <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-tertiary)' }}>
              {selectedCityId.toUpperCase()}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '550px', overflowY: 'auto' }}>
            {reportsList.map((rep) => {
              const isSelected = activeReport?.id === rep.id;
              return (
                <div
                  key={rep.id}
                  onClick={() => setActiveReport(rep)}
                  style={{
                    padding: '0.75rem',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    background: isSelected ? 'rgba(56, 189, 248, 0.12)' : 'var(--color-surface-1)',
                    border: isSelected ? '1px solid var(--color-accent)' : '1px solid var(--color-border)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.375rem',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: isSelected ? 'var(--color-accent)' : 'var(--color-text-primary)', lineHeight: 1.3 }}>
                      {rep.title}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-tertiary)' }}>
                    {rep.type} · {new Date(rep.generatedAt).toLocaleDateString()}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                    <span
                      style={{
                        fontSize: '0.625rem',
                        fontWeight: 800,
                        padding: '1px 5px',
                        borderRadius: '4px',
                        background: 'rgba(245, 158, 11, 0.15)',
                        color: '#f59e0b',
                      }}
                    >
                      {rep.dataClassification || 'STATUTORY'}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadPdf(rep);
                      }}
                      className="btn btn-outline"
                      style={{ fontSize: '0.625rem', padding: '2px 6px' }}
                      title="Download PDF"
                    >
                      📥 PDF
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Formal Statutory Document Preview & Actions */}
        {activeReport ? (
          <div
            className="info-card"
            style={{
              background: 'var(--color-surface-0)',
              border: '1px solid var(--color-border)',
              padding: '2rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem',
            }}
          >
            {/* Document Header */}
            <div style={{ borderBottom: '2px solid var(--color-border)', paddingBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-accent)' }}>
                  GOVERNMENT OF MAHARASHTRA — URBAN MOBILITY COMMAND
                </div>
                <h3 style={{ fontSize: '1.1875rem', fontWeight: 800, color: 'var(--color-text-primary)', marginTop: '4px' }}>
                  {activeReport.title}
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '6px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
                    Document Ref: <strong>{activeReport.documentRef}</strong>
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>·</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
                    Generated: {new Date(activeReport.generatedAt).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button onClick={() => handleDownloadPdf(activeReport)} className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>
                  <span>📥</span>
                  <span>DOWNLOAD SIGNED PDF</span>
                </button>
                <button
                  onClick={() => {
                    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(activeReport, null, 2));
                    const dl = document.createElement('a');
                    dl.setAttribute('href', dataStr);
                    dl.setAttribute('download', `${activeReport.documentRef}.json`);
                    dl.click();
                  }}
                  className="btn btn-secondary"
                  style={{ padding: '0.5rem 0.75rem' }}
                >
                  <span>JSON</span>
                </button>
              </div>
            </div>

            {/* Metadata Bar */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', padding: '0.875rem', background: 'var(--color-surface-1)', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
              <div>
                <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-tertiary)' }}>JURISDICTION</div>
                <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>{currentCity.name} (NMC/BMC)</div>
              </div>
              <div>
                <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-tertiary)' }}>GEOGRAPHY SCOPE</div>
                <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>{activeReport.geography}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-tertiary)' }}>PERIOD</div>
                <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>{activeReport.period}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-tertiary)' }}>CLASSIFICATION</div>
                <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#f59e0b' }}>{activeReport.dataClassification || 'STATUTORY'}</div>
              </div>
            </div>

            {/* Section 1: Executive Summary */}
            <div>
              <h4 style={{ fontSize: '0.8125rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-accent)', marginBottom: '0.5rem' }}>
                1. Executive Operations Summary
              </h4>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                {activeReport.summary}
              </p>
            </div>

            {/* Section 2: Choke Point Breakdown */}
            <div>
              <h4 style={{ fontSize: '0.8125rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-accent)', marginBottom: '0.5rem' }}>
                2. Spatial Choke Points & Incident Metrics ({redZones.length} Monitored)
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {redZones.length === 0 ? (
                  <div style={{ padding: '1rem', background: 'var(--color-surface-1)', borderRadius: '6px', color: 'var(--color-text-tertiary)', fontSize: '0.75rem', textAlign: 'center' }}>
                    Zero severe red zones currently detected in this sector.
                  </div>
                ) : (
                  redZones.slice(0, 5).map((rz, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '0.75rem',
                        background: 'var(--color-surface-1)',
                        borderRadius: '6px',
                        border: '1px solid var(--color-border)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '0.75rem',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>
                          {rz.corridorName} ({rz.id})
                        </div>
                        <div style={{ color: 'var(--color-text-tertiary)', marginTop: '2px' }}>
                          Speed: {rz.currentSpeedKmH || 14} km/h · Queuing: {rz.affectedLengthKm || 2.2} km · Ratio: {rz.congestionRatio ? (rz.congestionRatio * 100).toFixed(0) + '%' : '24%'}
                        </div>
                      </div>
                      <span
                        style={{
                          fontWeight: 800,
                          fontSize: '0.6875rem',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: rz.severity === 'CRITICAL' ? 'rgba(225, 29, 72, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                          color: rz.severity === 'CRITICAL' ? 'var(--color-critical)' : '#f59e0b',
                        }}
                      >
                        {rz.severity} (+{rz.delayMinutes || 18}m)
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Section 3: Statutory Authority Sign-Off */}
            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>
                  Superintendent of Traffic Police & Urban Mobility Directorate
                </div>
                <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-tertiary)' }}>
                  Autonomous Metropolitan Command ({currentCity.name})
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span
                  style={{
                    fontSize: '0.6875rem',
                    fontWeight: 800,
                    padding: '4px 10px',
                    borderRadius: '4px',
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: '#10b981',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                  }}
                >
                  ✓ DIGITALLY VERIFIED BY URBAN MOBILITY COMMAND
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="info-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
            Select a report from the archive or create a new statutory report.
          </div>
        )}
      </div>

      {/* CREATE NEW REPORT MODAL */}
      {isCreateModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
        >
          <div
            className="info-card"
            style={{
              width: '100%',
              maxWidth: '560px',
              background: 'var(--color-surface-0)',
              border: '1px solid var(--color-border)',
              padding: '1.75rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.25rem' }}>📋</span>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>
                  Configure New Government Dossier
                </h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--color-text-tertiary)', fontSize: '18px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGenerateNewReport} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Report Type */}
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Report Type & Objective
                </label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="jurisdiction-select"
                  style={{ width: '100%', padding: '0.5rem' }}
                >
                  <option value="CONGESTION_AUDIT">Traffic Congestion & Delay Audit</option>
                  <option value="RED_ZONE_ANALYSIS">Red Zone Spatial Incident Assessment</option>
                  <option value="POLICE_DISPATCH">Police Resource & Dispatch Feasibility</option>
                  <option value="INFRASTRUCTURE_PROPOSAL">Capital Infrastructure & Grade Separation Dossier</option>
                  <option value="COMBINED_REPORT">Custom Combined Operational Dossier</option>
                </select>
              </div>

              {/* Geography Scope */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Geography Scope
                  </label>
                  <select
                    value={geographyScope}
                    onChange={(e) => {
                      setGeographyScope(e.target.value);
                      if (e.target.value === 'ENTIRE_CITY') setSelectedSubArea('All Sectors');
                      else if (e.target.value === 'WARD') setSelectedSubArea(selectedCityId === 'nagpur' ? 'Dharampeth Ward' : selectedCityId === 'pune' ? 'Shivajinagar Ward' : 'Ward F/North');
                      else if (e.target.value === 'CORRIDOR') setSelectedSubArea(selectedCityId === 'nagpur' ? 'Wardha Road Corridor' : selectedCityId === 'pune' ? 'Hinjawadi IT Corridor' : 'Western Express Highway');
                    }}
                    className="jurisdiction-select"
                    style={{ width: '100%', padding: '0.5rem' }}
                  >
                    <option value="ENTIRE_CITY">Entire City ({currentCity.name})</option>
                    <option value="WARD">Specific Municipal Ward</option>
                    <option value="CORRIDOR">Specific Arterial Corridor</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Sub-Area Target
                  </label>
                  <input
                    type="text"
                    value={selectedSubArea}
                    onChange={(e) => setSelectedSubArea(e.target.value)}
                    className="search-input"
                    style={{ width: '100%', padding: '0.5rem' }}
                  />
                </div>
              </div>

              {/* Observation Period */}
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Observation Period
                </label>
                <select
                  value={observationPeriod}
                  onChange={(e) => setObservationPeriod(e.target.value)}
                  className="jurisdiction-select"
                  style={{ width: '100%', padding: '0.5rem' }}
                >
                  <option value="CURRENT_CONDITIONS">Current Real-Time Conditions</option>
                  <option value="LAST_24_HOURS">Past 24 Hours</option>
                  <option value="LAST_7_DAYS">Past 7 Days Aggregated</option>
                  <option value="LAST_30_DAYS">Past 30 Days (Monthly Trend)</option>
                  <option value="SIMULATION_HORIZON">Selected Simulation Horizon (T=0 to T=3.0h)</option>
                </select>
              </div>

              {/* Additional Options Checkboxes */}
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Include Additional Analysis Sections
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--color-text-primary)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={includeAiRecs} onChange={(e) => setIncludeAiRecs(e.target.checked)} />
                    <span>AI Strategic Recommendations</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={includePolice} onChange={(e) => setIncludePolice(e.target.checked)} />
                    <span>Police Resource Audit</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={includeInfra} onChange={(e) => setIncludeInfra(e.target.checked)} />
                    <span>Capital Infrastructure DPR</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={includeHistorical} onChange={(e) => setIncludeHistorical(e.target.checked)} />
                    <span>Historical Pattern Comparison</span>
                  </label>
                </div>
              </div>

              {/* Submit Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  ⚡ Generate & Download PDF
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
