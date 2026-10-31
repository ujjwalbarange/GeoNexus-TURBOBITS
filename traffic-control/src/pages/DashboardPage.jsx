import React, { useState, useMemo } from 'react';
import Sidebar from '../components/layout/Sidebar';
import TopBar from '../components/layout/TopBar';
import TelemetryRibbon from '../components/layout/TelemetryRibbon';

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

import { useTrafficData } from '../hooks/useTrafficData';
import { TrafficControlOrchestrator } from '../agents/orchestrator/trafficOrchestrator';
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

  // Selected red zone from anywhere in the app
  const [activeRedZone, setActiveRedZone] = useState(null);

  // Strict Cache-First Traffic Hook (zero background polling loops; explicit refresh only)
  const {
    trafficData,
    loading,
    error,
    lastRefreshedAt,
    isCached,
    refresh,
  } = useTrafficData(selectedCityId);

  // Central Multi-Module Agent Orchestrator Pipeline
  const orchestratorOutput = useMemo(() => {
    return TrafficControlOrchestrator.runAnalysis(trafficData, selectedCityId);
  }, [trafficData, selectedCityId]);

  const handleSelectCity = (newCityId) => {
    setSelectedCityId(newCityId);
    setFocusCoords(null);
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
      />

      {/* ─── 2. Main Application Shell ─── */}
      <div className="main-wrapper">
        {/* Top Control Bar with Search, 2D/3D switcher, Fit City, Reset, and Manual Refresh */}
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
          corridors={trafficData?.segments || []}
        />

        {/* Telemetry Ribbon with KPIs, delays, and agent status */}
        <TelemetryRibbon
          orchestratorOutput={orchestratorOutput}
          trafficData={trafficData}
          isCached={isCached}
          lastRefreshedAt={lastRefreshedAt}
          agentStatus={loading ? 'FETCHING_DATA' : 'ONLINE'}
        />

        {/* ─── 3. Viewport (Renders the active of the 10 navigation views) ─── */}
        <main className="content-viewport">
          {activeNavId === 'overview' && (
            <OverviewView
              selectedCityId={selectedCityId}
              orchestratorOutput={orchestratorOutput}
              trafficData={trafficData}
              onNavigateTo={setActiveNavId}
              onSelectRedZone={handleInspectRedZoneOnMap}
              lastRefreshedAt={lastRefreshedAt}
              isCached={isCached}
            />
          )}

          {activeNavId === 'map' && (
            <MapView
              selectedCityId={selectedCityId}
              trafficData={trafficData}
              orchestratorOutput={orchestratorOutput}
              selectedProviderId={selectedProviderId}
              fitTrigger={fitTrigger}
              resetTrigger={resetTrigger}
              focusCoords={focusCoords}
              focusTrigger={focusTrigger}
              showLegend={showLegend}
              onToggleLegend={() => setShowLegend(!showLegend)}
              onNavigateTo={setActiveNavId}
            />
          )}

          {activeNavId === 'red_zones' && (
            <RedZonesView
              orchestratorOutput={orchestratorOutput}
              onSelectRedZone={handleInspectRedZoneOnMap}
              onNavigateToMap={() => setActiveNavId('map')}
            />
          )}

          {activeNavId === 'police_dispatch' && (
            <PoliceDispatchView
              orchestratorOutput={orchestratorOutput}
              onNavigateToMap={() => setActiveNavId('map')}
            />
          )}

          {activeNavId === 'patterns' && (
            <TrafficIntelligenceView
              selectedCityId={selectedCityId}
              orchestratorOutput={orchestratorOutput}
            />
          )}

          {activeNavId === 'routing' && (
            <RouteOptimizationView
              selectedCityId={selectedCityId}
              orchestratorOutput={orchestratorOutput}
              onNavigateToMap={() => setActiveNavId('map')}
            />
          )}

          {activeNavId === 'infrastructure' && (
            <InfrastructureView
              selectedCityId={selectedCityId}
              onNavigateToMap={() => setActiveNavId('map')}
            />
          )}

          {activeNavId === 'reports' && (
            <GovernmentReportsView
              selectedCityId={selectedCityId}
              orchestratorOutput={orchestratorOutput}
            />
          )}

          {activeNavId === 'agent_activity' && (
            <AgentActivityView
              selectedCityId={selectedCityId}
              orchestratorOutput={orchestratorOutput}
            />
          )}

          {activeNavId === 'settings' && (
            <SettingsView
              selectedCityId={selectedCityId}
              onSelectCity={handleSelectCity}
            />
          )}
        </main>
      </div>
    </div>
  );
}
