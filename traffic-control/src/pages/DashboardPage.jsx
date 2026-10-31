import React, { useState } from 'react';
import Header from '../components/layout/Header';
import TrafficMap from '../components/map/TrafficMap';
import TrafficInfoPanel from '../components/dashboard/TrafficInfoPanel';
import { useTrafficData } from '../hooks/useTrafficData';
import { DEFAULT_CITY } from '../config/cities';

export default function DashboardPage() {
  const [selectedCityId, setSelectedCityId] = useState(
    import.meta.env.VITE_DEFAULT_CITY || DEFAULT_CITY
  );
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedSegment, setSelectedSegment] = useState(null);
  const [focusTrigger, setFocusTrigger] = useState(0);

  // Root Map Services Layer Toggles
  const [showFacilities, setShowFacilities] = useState(true);
  const [showDrainage, setShowDrainage] = useState(true);
  const [showZones, setShowZones] = useState(false);

  const {
    trafficData,
    loading,
    error,
    lastRefreshedAt,
    isAutoRefresh,
    toggleAutoRefresh,
    refresh,
    customEndpoint,
    setApiEndpoint,
  } = useTrafficData(selectedCityId);

  const handleSelectCity = (newCityId) => {
    setSelectedCityId(newCityId);
    setSelectedSegment(null);
  };

  const handleFocusSegment = (segment) => {
    setSelectedSegment(segment);
    setFocusTrigger((prev) => prev + 1);
  };

  return (
    <div className="app-container">
      {/* Top Telemetry & Control Navigation */}
      <Header
        selectedCityId={selectedCityId}
        onSelectCity={handleSelectCity}
        trafficData={trafficData}
        lastRefreshedAt={lastRefreshedAt}
        loading={loading}
        onRefresh={refresh}
        isAutoRefresh={isAutoRefresh}
        onToggleAutoRefresh={toggleAutoRefresh}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Main Operations Body */}
      <main className="dashboard-body">
        {/* Central Map Canvas (OpenStreetMap Default + TomTom Live Traffic + Root Services) */}
        <TrafficMap
          selectedCityId={selectedCityId}
          trafficData={trafficData}
          selectedSegment={selectedSegment}
          onSelectSegment={setSelectedSegment}
          focusTrigger={focusTrigger}
          showFacilities={showFacilities}
          showDrainage={showDrainage}
          showZones={showZones}
        />

        {/* Sliding Operations Panel */}
        <TrafficInfoPanel
          selectedCityId={selectedCityId}
          trafficData={trafficData}
          lastRefreshedAt={lastRefreshedAt}
          loading={loading}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          selectedSegment={selectedSegment}
          onSelectSegment={setSelectedSegment}
          onFocusSegment={handleFocusSegment}
          customEndpoint={customEndpoint}
          onUpdateEndpoint={setApiEndpoint}
          showFacilities={showFacilities}
          onToggleFacilities={() => setShowFacilities(!showFacilities)}
          showDrainage={showDrainage}
          onToggleDrainage={() => setShowDrainage(!showDrainage)}
          showZones={showZones}
          onToggleZones={() => setShowZones(!showZones)}
        />
      </main>
    </div>
  );
}
