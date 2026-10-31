import React, { useState, useMemo, useEffect } from 'react';
import Sidebar from '../components/layout/Sidebar';
import TopBar from '../components/layout/TopBar';
import TelemetryRibbon from '../components/layout/TelemetryRibbon';
import ErrorBoundary from '../components/common/ErrorBoundary';

// 10 Dedicated View Components
import OverviewView from '../components/views/OverviewView';
import MapView from '../components/views/MapView';
import RedZonesView from '../components/views/RedZonesView';
import PoliceDispatchView from '../components/views/PoliceDispatchView';
import TrafficIntelligenceView from '../components/views/TrafficIntelligenceView';
import RouteOptimizationView from '../components/views/RouteOptimizationView';
import InfrastructureView from '../components/views/InfrastructureView';
import GovernmentReportsView from '../components/views/GovernmentReportsView';
import AgentActivityView from '../components/views/AgentActivityView';
import SettingsView from '../components/views/SettingsView';

// Interactive Traffic Sandbox Modal
import TrafficSandboxModal from '../components/sandbox/TrafficSandboxModal';

import { useTrafficData } from '../hooks/useTrafficData';
import { TrafficControlOrchestrator } from '../agents/orchestrator/trafficOrchestrator';
import { trafficStore, OPERATIONAL_MODES } from '../services/trafficStore';
import { DEFAULT_CITY } from '../config/cities';
import { DEFAULT_MAP_PROVIDER_ID } from '../config/mapConfig';

export default function DashboardPage() {
  const [selectedCityId, setSelectedCityId] = useState(
    import.meta.env.VITE_DEFAULT_CITY || DEFAULT_CITY
  );

  // Active Navigation View ('overview', 'map', 'red_zones', 'police_dispatch', 'patterns', 'routing', 'infrastructure', 'reports', 'agent_activity', 'settings')
  const [activeNavId, setActiveNavId] = useState('overview');

  // Map Controls State
  const [viewMode, setViewMode] = useState('2D');
  const [selectedProviderId, setSelectedProviderId] = useState(DEFAULT_MAP_PROVIDER_ID);
  const [fitTrigger, setFitTrigger] = useState(0);
  const [resetTrigger, setResetTrigger] = useState(0);
  const [focusCoords, setFocusCoords] = useState(null);
  const [focusTrigger, setFocusTrigger] = useState(0);
  const [showLegend, setShowLegend] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Interactive Sandbox & Dynamic Operations State
  const [isSandboxOpen, setIsSandboxOpen] = useState(false);
  const [isDrawingSegment, setIsDrawingSegment] = useState(false);
  const [activeDispatchRoute, setActiveDispatchRoute] = useState(null);
  const [activeProposalAlignment, setActiveProposalAlignment] = useState(null);
  const [activeRedZone, setActiveRedZone] = useState(null);
  const [storeTick, setStoreTick] = useState(0);

  // Subscribe to central reactive traffic store updates (changes in simulation, timeline, or mode)
  useEffect(() => {
    const unsub = trafficStore.subscribe(() => {
      setStoreTick((prev) => prev + 1);
    });
    return unsub;
  }, []);

  // Strict Cache-First Traffic Hook (zero background polling loops; explicit refresh only)
  const {
    trafficData: liveTrafficData,
    loading,
    error,
    lastRefreshedAt,
    isCached,
    refresh,
  } = useTrafficData(selectedCityId);

  // Ingest live observations into central store
  useEffect(() => {
    if (liveTrafficData?.segments && liveTrafficData.segments.length > 0) {
      trafficStore.ingestLiveObservations(selectedCityId, liveTrafficData.segments);
    }
  }, [liveTrafficData, selectedCityId]);

  // Reactive Effective Traffic Data (harmonizes LIVE, SIMULATION, and HYBRID modes)
  const effectiveTrafficData = useMemo(() => {
    return trafficStore.getEffectiveTrafficData(selectedCityId);
  }, [selectedCityId, storeTick, liveTrafficData]);

  // Central Multi-Module Agent Orchestrator Pipeline
  const orchestratorOutput = useMemo(() => {
    return TrafficControlOrchestrator.runAnalysis(effectiveTrafficData, selectedCityId);
  }, [effectiveTrafficData, selectedCityId]);

  const handleSelectCity = (newCityId) => {
    setSelectedCityId(newCityId);
    setFocusCoords(null);
    setActiveDispatchRoute(null);
    setActiveProposalAlignment(null);
  };

  const handleFitCity = () => {
    setFitTrigger((prev) => prev + 1);
  };

  const handleResetView = () => {
    setResetTrigger((prev) => prev + 1);
  };

  const handleSelectSearchResult = (result) => {
    if (result.coords) {
      setFocusCoords(result.coords);
      setFocusTrigger((prev) => prev + 1);
      setActiveNavId('map');
    }
  };

  const handleInspectRedZoneOnMap = (rz) => {
    setActiveRedZone(rz);
    if (rz.centerCoordinates) {
      setFocusCoords(rz.centerCoordinates);
      setFocusTrigger((prev) => prev + 1);
    }
    setActiveNavId('map');
  };

  // Handler for Infrastructure "View Proposed Alignment"
  const handleViewProposalAlignment = (prop) => {
    setActiveProposalAlignment(prop);
    if (prop.coordinates) {
      setFocusCoords(prop.coordinates);
      setFocusTrigger((prev) => prev + 1);
    }
    setActiveNavId('map');
  };

  // Handler for Police Dispatch "Inspect Route on Map"
  const handleInspectRouteOnMap = (routeCoords, dispatchRecord) => {
    setActiveDispatchRoute(routeCoords);
    if (routeCoords && routeCoords.length > 0) {
      setFocusCoords(routeCoords[0]);
      setFocusTrigger((prev) => prev + 1);
    }
    setActiveNavId('map');
  };

  return (
    <div className="app-shell">
      {/* ─── 1. Desktop Persistent Sidebar (250px) / Mobile Drawer ─── */}
      <Sidebar
        activeNavId={activeNavId}
        onSelectNav={setActiveNavId}
        selectedCityId={selectedCityId}
        onSelectCity={handleSelectCity}
        orchestratorOutput={orchestratorOutput}
        lastRefreshedAt={lastRefreshedAt}
        isCached={isCached}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        onOpenSandbox={() => setIsSandboxOpen(true)}
      />

      {/* ─── 2. Main Application Shell ─── */}
      <div className="main-wrapper">
        {/* Top Control Bar with Search, 2D/3D switcher, Fit City, Reset, Manual Refresh, Mode Pill, and Theme Toggle */}
        <TopBar
          selectedCityId={selectedCityId}
          activeNavId={activeNavId}
          viewMode={viewMode}
          onChangeViewMode={setViewMode}
          selectedProviderId={selectedProviderId}
          onSelectProviderId={setSelectedProviderId}
          onFitCity={handleFitCity}
          onResetView={handleResetView}
          showLegend={showLegend}
          onToggleLegend={() => setShowLegend(!showLegend)}
          onRefresh={refresh}
          loading={loading}
          isCached={isCached}
          lastRefreshedAt={lastRefreshedAt}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onSelectSearchResult={handleSelectSearchResult}
          redZones={orchestratorOutput?.detection?.redZones || []}
          policeUnits={orchestratorOutput?.policeDispatch?.recommendations || []}
          corridors={effectiveTrafficData?.segments || []}
          operationalMode={trafficStore.operationalMode}
          onOpenSandbox={() => setIsSandboxOpen(true)}
        />

        {/* Telemetry Ribbon with KPIs, delays, and agent status */}
        <TelemetryRibbon
          orchestratorOutput={orchestratorOutput}
          trafficData={effectiveTrafficData}
          isCached={isCached}
          lastRefreshedAt={lastRefreshedAt}
          agentStatus={loading ? 'FETCHING_DATA' : 'ONLINE'}
        />

        {/* ─── 3. Viewport (Renders the active of the 10 navigation views) ─── */}
        <main className="content-viewport">
          {activeNavId === 'overview' && (
            <ErrorBoundary fallbackTitle="Overview Dashboard Unavailable">
              <OverviewView
                selectedCityId={selectedCityId}
                orchestratorOutput={orchestratorOutput}
                trafficData={effectiveTrafficData}
                onNavigateTo={setActiveNavId}
                onSelectRedZone={handleInspectRedZoneOnMap}
                lastRefreshedAt={lastRefreshedAt}
                isCached={isCached}
              />
            </ErrorBoundary>
          )}

          {activeNavId === 'map' && (
            <ErrorBoundary fallbackTitle="Live Traffic Map Unavailable">
              <MapView
                selectedCityId={selectedCityId}
                trafficData={effectiveTrafficData}
                orchestratorOutput={orchestratorOutput}
                selectedProviderId={selectedProviderId}
                fitTrigger={fitTrigger}
                resetTrigger={resetTrigger}
                focusCoords={focusCoords}
                focusTrigger={focusTrigger}
                showLegend={showLegend}
                onToggleLegend={() => setShowLegend(!showLegend)}
                onNavigateTo={setActiveNavId}
                isDrawingSegment={isDrawingSegment}
                onFinishDrawingSegment={() => setIsDrawingSegment(false)}
                activeDispatchRoute={activeDispatchRoute}
                activeProposalAlignment={activeProposalAlignment}
                currentMode={trafficStore.operationalMode}
              />
            </ErrorBoundary>
          )}

          {activeNavId === 'red_zones' && (
            <ErrorBoundary fallbackTitle="Red Zone Detection Unavailable">
              <RedZonesView
                orchestratorOutput={orchestratorOutput}
                onSelectRedZone={handleInspectRedZoneOnMap}
                onNavigateToMap={() => setActiveNavId('map')}
              />
            </ErrorBoundary>
          )}

          {activeNavId === 'police_dispatch' && (
            <ErrorBoundary fallbackTitle="Police Dispatch Command Unavailable">
              <PoliceDispatchView
                selectedCityId={selectedCityId}
                orchestratorOutput={orchestratorOutput}
                onNavigateToMap={() => setActiveNavId('map')}
                onInspectRouteOnMap={handleInspectRouteOnMap}
              />
            </ErrorBoundary>
          )}

          {activeNavId === 'patterns' && (
            <ErrorBoundary fallbackTitle="Traffic Intelligence Engine Unavailable">
              <TrafficIntelligenceView
                selectedCityId={selectedCityId}
                orchestratorOutput={orchestratorOutput}
              />
            </ErrorBoundary>
          )}

          {activeNavId === 'routing' && (
            <ErrorBoundary fallbackTitle="Route Optimization Engine Unavailable">
              <RouteOptimizationView
                selectedCityId={selectedCityId}
                orchestratorOutput={orchestratorOutput}
                onNavigateToMap={() => setActiveNavId('map')}
              />
            </ErrorBoundary>
          )}

          {activeNavId === 'infrastructure' && (
            <ErrorBoundary fallbackTitle="Infrastructure Intelligence Unavailable">
              <InfrastructureView
                selectedCityId={selectedCityId}
                onNavigateToMap={() => setActiveNavId('map')}
                onViewProposalAlignment={handleViewProposalAlignment}
              />
            </ErrorBoundary>
          )}

          {activeNavId === 'reports' && (
            <ErrorBoundary fallbackTitle="Government Reporting System Unavailable">
              <GovernmentReportsView
                selectedCityId={selectedCityId}
                orchestratorOutput={orchestratorOutput}
              />
            </ErrorBoundary>
          )}

          {activeNavId === 'agent_activity' && (
            <ErrorBoundary fallbackTitle="Agent Activity Monitor Unavailable">
              <AgentActivityView
                selectedCityId={selectedCityId}
                orchestratorOutput={orchestratorOutput}
              />
            </ErrorBoundary>
          )}

          {activeNavId === 'settings' && (
            <ErrorBoundary fallbackTitle="Settings & Configuration Unavailable">
              <SettingsView
                selectedCityId={selectedCityId}
                onSelectCity={handleSelectCity}
              />
            </ErrorBoundary>
          )}
        </main>
      </div>

      {/* ─── 4. Traffic Data Sandbox Modal ─── */}
      <TrafficSandboxModal
        isOpen={isSandboxOpen}
        onClose={() => setIsSandboxOpen(false)}
        cityId={selectedCityId}
        currentMode={trafficStore.operationalMode}
        onModeChange={(newMode) => {
          trafficStore.setMode(newMode);
        }}
        isDrawingSegment={isDrawingSegment}
        onToggleDrawSegment={() => {
          setIsDrawingSegment(!isDrawingSegment);
          setIsSandboxOpen(false);
          setActiveNavId('map');
        }}
        onCreateRedZoneClick={() => {
          // Manual Red Zone creation trigger
          setIsSandboxOpen(false);
          setActiveNavId('map');
          trafficStore.createRedZone(selectedCityId, null, {
            name: `${selectedCityId.toUpperCase()} Emergency Red Zone`,
            severity: 'CRITICAL',
            currentSpeed: 6,
            freeFlowSpeed: 50,
          });
        }}
      />
    </div>
  );
}
