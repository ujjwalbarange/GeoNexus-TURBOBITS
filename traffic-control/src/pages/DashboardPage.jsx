import React, { useState, useMemo } from 'react';
import Header from '../components/layout/Header';
import TopCommandBar from '../components/controls/TopCommandBar';
import TrafficMap from '../components/map/TrafficMap';
import AgentControlCenter from '../components/agent/AgentControlCenter';
import { useTrafficData } from '../hooks/useTrafficData';
import { TrafficControlOrchestrator } from '../agents/orchestrator/trafficOrchestrator';
import { DEFAULT_CITY } from '../config/cities';

export default function DashboardPage() {
  const [selectedCityId, setSelectedCityId] = useState(
    import.meta.env.VITE_DEFAULT_CITY || DEFAULT_CITY
  );

  // Active Agent Module View ('red_zones', 'police_dispatch', 'patterns', 'routing', 'infrastructure', 'reports', or null)
  const [activeModuleTab, setActiveModuleTab] = useState('red_zones');

  // Selected corridor / segment
  const [selectedSegment, setSelectedSegment] = useState(null);
  const [focusTrigger, setFocusTrigger] = useState(0);
  const [focusCoords, setFocusCoords] = useState(null);

  // GIS Infrastructure Layer Toggles
  const [showFacilities, setShowFacilities] = useState(true);
  const [showDrainage, setShowDrainage] = useState(true);
  const [showZones, setShowZones] = useState(false);
  const [showTrafficOverlay, setShowTrafficOverlay] = useState(true);

  // Strict Cache-First Traffic Hook (zero polling, explicit refresh only)
  const {
    trafficData,
    loading,
    error,
    lastRefreshedAt,
    isCached,
    refresh,
  } = useTrafficData(selectedCityId);

  // Run Central Multi-Module Agent Orchestrator Pipeline
  const orchestratorOutput = useMemo(() => {
    return TrafficControlOrchestrator.runAnalysis(trafficData, selectedCityId);
  }, [trafficData, selectedCityId]);

  const handleSelectCity = (newCityId) => {
    setSelectedCityId(newCityId);
    setSelectedSegment(null);
    setFocusCoords(null);
  };

  const handleFocusCoordinates = (coords) => {
    setFocusCoords(coords);
    setFocusTrigger((prev) => prev + 1);
  };

  const handleSelectRedZone = (redZone) => {
    setActiveModuleTab('red_zones');
    handleFocusCoordinates(redZone.centerCoordinates);
  };

  return (
    <div className="app-container" style={{ display: 'flex', flexDirection: 'column', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      {/* ─── 1. TOP SECTION: Mission Header, City Selector, Explicit Refresh & Cache Badge ─── */}
      <Header
        selectedCityId={selectedCityId}
        onSelectCity={handleSelectCity}
        trafficData={trafficData}
        lastRefreshedAt={lastRefreshedAt}
        loading={loading}
        isCached={isCached}
        onRefresh={refresh}
      />

      {/* ─── 2. TOP SECTION: Agent Command Bar, Module Switcher, KPIs & GIS Layer Toggles ─── */}
      <TopCommandBar
        selectedCityId={selectedCityId}
        activeModuleTab={activeModuleTab}
        onSelectModuleTab={(tabId) => setActiveModuleTab(activeModuleTab === tabId ? null : tabId)}
        orchestratorOutput={orchestratorOutput}
        showFacilities={showFacilities}
        onToggleFacilities={() => setShowFacilities(!showFacilities)}
        showDrainage={showDrainage}
        onToggleDrainage={() => setShowDrainage(!showDrainage)}
        showZones={showZones}
        onToggleZones={() => setShowZones(!showZones)}
        showTrafficOverlay={showTrafficOverlay}
        onToggleTrafficOverlay={() => setShowTrafficOverlay(!showTrafficOverlay)}
      />

      {/* ─── 3. BOTTOM SECTION: Interactive Traffic Map (Limited strictly to city bounds) ─── */}
      <main className="dashboard-body" style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <TrafficMap
          selectedCityId={selectedCityId}
          trafficData={trafficData}
          selectedSegment={selectedSegment}
          onSelectSegment={setSelectedSegment}
          focusTrigger={focusTrigger}
          focusCoords={focusCoords}
          showFacilities={showFacilities}
          showDrainage={showDrainage}
          showZones={showZones}
          showTrafficOverlay={showTrafficOverlay}
          onToggleTrafficOverlay={() => setShowTrafficOverlay(!showTrafficOverlay)}
          redZones={orchestratorOutput?.detection?.redZones || []}
          onSelectRedZone={handleSelectRedZone}
        />

        {/* Floating Agent Intelligence Drawer (opens over map when a module tab is selected) */}
        <AgentControlCenter
          activeTab={activeModuleTab}
          onClose={() => setActiveModuleTab(null)}
          orchestratorOutput={orchestratorOutput}
          onFocusCoordinates={handleFocusCoordinates}
        />
      </main>
    </div>
  );
}
