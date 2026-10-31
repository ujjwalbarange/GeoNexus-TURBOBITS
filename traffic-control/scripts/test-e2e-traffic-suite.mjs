/**
 * End-to-end Automated Functional Test Suite for Sentinel Traffic Control
 */
import { trafficStore, OPERATIONAL_MODES } from '../src/services/trafficStore.js';
import { policeStore } from '../src/services/policeStore.js';
import { RedZoneDetector } from '../src/agents/traffic-detection/redZoneDetector.js';
import { generateStatutoryPdf } from '../src/services/pdfReportGenerator.js';
import fs from 'fs';
const corridorProposalsData = JSON.parse(fs.readFileSync(new URL('../data/infrastructure/bridges/corridor_proposals.json', import.meta.url)));
const recurringPatternsData = JSON.parse(fs.readFileSync(new URL('../data/patterns/recurring_patterns.json', import.meta.url)));
import { themeManager } from '../src/services/themeManager.js';

console.log('====================================================');
console.log('🚦 STARTING END-TO-END FUNCTIONAL VERIFICATION SUITE');
console.log('====================================================\n');

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    testsPassed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    testsFailed++;
  }
}

// ──────────────────────────────────────────────────────────────────
// TEST 1: Theme Manager (Light / Dark Mode matching Root UI)
// ──────────────────────────────────────────────────────────────────
console.log('[MODULE 1] Theme Manager & Dual-Mode Styling:');
const initialTheme = themeManager.getTheme();
assert(initialTheme === 'dark' || initialTheme === 'light', 'Theme initializes with a valid state');
const toggledTheme = themeManager.toggleTheme();
assert(toggledTheme !== initialTheme, `Theme toggled successfully from ${initialTheme} to ${toggledTheme}`);
themeManager.setTheme('dark');
assert(themeManager.getTheme() === 'dark', 'Theme restored to dark mode');

// ──────────────────────────────────────────────────────────────────
// TEST 2: Central Traffic Data Sandbox & Operational Modes
// ──────────────────────────────────────────────────────────────────
console.log('\n[MODULE 2] Central Traffic Data Sandbox & Dynamic Modes:');
trafficStore.setMode(OPERATIONAL_MODES.LIVE);
assert(trafficStore.operationalMode === 'LIVE', 'Operational mode switches to LIVE');

trafficStore.setMode(OPERATIONAL_MODES.SIMULATION);
assert(trafficStore.operationalMode === 'SIMULATION', 'Operational mode switches to SIMULATION');

trafficStore.setMode(OPERATIONAL_MODES.HYBRID);
assert(trafficStore.operationalMode === 'HYBRID', 'Operational mode switches to HYBRID');

// ──────────────────────────────────────────────────────────────────
// TEST 3: Click-to-Draw Traffic Segment & Condition Editor
// ──────────────────────────────────────────────────────────────────
console.log('\n[MODULE 3] Custom Traffic Segment Drawing & Overrides:');
const customSeg = trafficStore.createCustomSegment('mumbai', [
  [19.0760, 72.8777],
  [19.0800, 72.8850],
  [19.0850, 72.8900]
], {
  name: 'BKC Connector Test Link',
  severity: 'CRITICAL',
  currentSpeed: 5,
  freeFlowSpeed: 50,
  congestionRatio: 0.10,
  delayMinutes: 32,
});
assert(customSeg && (customSeg.id.startsWith('CUST-') || customSeg.id.startsWith('custom_seg_')), `Custom simulated segment created: ${customSeg.id}`);
assert(customSeg.isCustomSimulated === true, 'Custom segment labeled as isCustomSimulated (Transparency requirement)');

// Update Segment Properties live
trafficStore.updateSegmentOverride('mumbai', customSeg.id, {
  currentSpeed: 15,
  severity: 'HEAVY',
  delayMinutes: 18,
});
const effectiveData = trafficStore.getEffectiveTrafficData('mumbai');
const foundSeg = effectiveData.segments.find(s => s.id === customSeg.id);
assert(foundSeg && foundSeg.currentSpeedKmH === 15, 'Segment properties update immediately without reload');
assert(foundSeg && (foundSeg.severity === 'HEAVY' || foundSeg.congestionLevel === 'HEAVY'), 'Segment severity updated to HEAVY');

// ──────────────────────────────────────────────────────────────────
// TEST 4: Manual Red Zone Creation & Detection Engine Rebuild
// ──────────────────────────────────────────────────────────────────
console.log('\n[MODULE 4] Red Zone Detection Pipeline:');
const manualRz = trafficStore.createRedZone('nagpur', [
  [21.1458, 79.0882],
  [21.1500, 79.0950]
], {
  name: 'Nagpur Sitabuldi Interchange',
  severity: 'CRITICAL',
  currentSpeed: 3,
  freeFlowSpeed: 45,
});
assert(manualRz && (manualRz.id.startsWith('RZ-') || manualRz.id.startsWith('custom_seg_')), `Manual Red Zone created: ${manualRz.id}`);
assert(manualRz.sourceClassification === 'SIMULATED', 'Manual red zone carries SIMULATED badge');

// Run Detection Engine
const detectedRedZones = RedZoneDetector.detect(effectiveData, 'mumbai');
assert(Array.isArray(detectedRedZones), 'RedZoneDetector processes normalized observations and returns array');
console.log(`  ℹ Detected ${detectedRedZones.length} red zones in Mumbai under active simulation thresholds`);

// ──────────────────────────────────────────────────────────────────
// TEST 5: Scenario Management (Save, Load, Export, Import)
// ──────────────────────────────────────────────────────────────────
console.log('\n[MODULE 5] Scenario Management & Time Scrubbing:');
const loaded = trafficStore.loadScenario('mumbai_peak_monsoon');
assert(loaded === true, 'Built-in scenario "mumbai_peak_monsoon" loaded successfully');

const exportedJson = trafficStore.exportScenario('mumbai', 'Monsoon Test Export');
assert(typeof exportedJson === 'string' && exportedJson.length > 50, 'Scenario exported to valid JSON string');

const parsedJson = JSON.parse(exportedJson);
assert(parsedJson.title === 'Monsoon Test Export', 'Exported JSON contains valid schema and scenario title');

// Test timeline scrubber (T = 0 to 3.0h)
trafficStore.setSimulationTime(1.5);
assert(trafficStore.simulationTimeHours === 1.5, 'Simulation timeline set to T=1.5h');
trafficStore.setSimulationTime(2.5);
assert(trafficStore.simulationTimeHours === 2.5, 'Simulation timeline set to T=2.5h');

// ──────────────────────────────────────────────────────────────────
// TEST 6: Police Resource Management & 5-Stage Dispatch Lifecycle
// ──────────────────────────────────────────────────────────────────
console.log('\n[MODULE 6] Police Dispatch Command & Resource Lifecycle:');
const nagpurUnits = policeStore.getResourcesForCity('nagpur');
assert(nagpurUnits.length >= 2, `Nagpur police resources loaded (${nagpurUnits.length} units)`);

// Add a new simulated unit
const newUnit = policeStore.addResource({
  cityId: 'nagpur',
  unitCode: 'TP-NAG-TEST-01',
  officerInCharge: 'Inspector A. Deshmukh',
  policeStation: 'Sitabuldi Traffic Division',
  deploymentType: 'INTERCEPTOR_VAN',
  coordinates: [21.1458, 79.0882],
});
assert(newUnit && (newUnit.id.startsWith('UNIT-') || newUnit.id.startsWith('pol_')), `Added simulated police unit: ${newUnit.unitCode}`);
assert(newUnit.availabilityStatus === 'AVAILABLE', 'New unit status is AVAILABLE');

// Create Dispatch
const nearest = policeStore.findNearestUnits('nagpur', [21.1458, 79.0882]);
assert(nearest.length > 0, `Nearest units query found ${nearest.length} units`);

const dispatchRecord = policeStore.createDispatch({
  incident: manualRz,
  unit: newUnit,
  reason: 'Immediate clearance of Sitabuldi Interchange choke point',
});
assert(dispatchRecord && dispatchRecord.status === 'APPROVED', 'Dispatch created with status APPROVED');
assert(newUnit.availabilityStatus === 'DEPLOYED', 'Assigned unit status transitioned to DEPLOYED');
assert(dispatchRecord.routeCoordinates.length >= 2, `Response route generated with ${dispatchRecord.routeCoordinates.length} waypoints`);

// Advance Lifecycle: APPROVED -> DISPATCHED -> EN_ROUTE -> ON_SITE -> COMPLETED
policeStore.advanceDispatchStatus(dispatchRecord.id, 'DISPATCHED');
assert(dispatchRecord.status === 'DISPATCHED', 'Lifecycle advanced to DISPATCHED');

policeStore.advanceDispatchStatus(dispatchRecord.id, 'EN_ROUTE');
assert(dispatchRecord.status === 'EN_ROUTE', 'Lifecycle advanced to EN_ROUTE');

policeStore.advanceDispatchStatus(dispatchRecord.id, 'ON_SITE');
assert(dispatchRecord.status === 'ON_SITE', 'Lifecycle advanced to ON_SITE');

policeStore.advanceDispatchStatus(dispatchRecord.id, 'COMPLETED');
assert(dispatchRecord.status === 'COMPLETED', 'Lifecycle advanced to COMPLETED');
assert(newUnit.availabilityStatus === 'AVAILABLE', 'Unit returned to AVAILABLE upon completion');

// ──────────────────────────────────────────────────────────────────
// TEST 7: Infrastructure Proposals & Alignment Highlighting
// ──────────────────────────────────────────────────────────────────
console.log('\n[MODULE 7] Infrastructure Intelligence & Proposal Alignment:');
const nagpurProposals = corridorProposalsData.filter(p => p.cityId === 'nagpur');
assert(nagpurProposals.length >= 2, `Found ${nagpurProposals.length} capital proposals for Nagpur`);

const outerRingProp = nagpurProposals.find(p => p.id === 'prop_ngp_01');
assert(outerRingProp != null, 'Found "Nagpur Outer Ring Road Grade Separated Rotary" proposal');
assert(Array.isArray(outerRingProp.alignmentCoordinates) && outerRingProp.alignmentCoordinates.length >= 2, 'Proposal contains authentic alignmentCoordinates for map highlighting');
assert(Array.isArray(outerRingProp.bounds) && outerRingProp.bounds.length === 2, 'Proposal contains precise bounding envelope for fitBounds');
assert(outerRingProp.architecturalConcept != null, 'Proposal contains architectural concept schema');

// ──────────────────────────────────────────────────────────────────
// TEST 8: Government Reports & Authentic PDF Generation (jsPDF)
// ──────────────────────────────────────────────────────────────────
console.log('\n[MODULE 8] Statutory Government Reports & jsPDF Generation:');
const pdfDoc = generateStatutoryPdf({
  reportTitle: 'Daily Municipal Traffic Bottleneck & Congestion Audit — NAGPUR',
  reportType: 'Municipal Commissioner Audit',
  cityId: 'nagpur',
  cityName: 'Nagpur',
  geography: 'Outer Ring Road & Wardha Road Sectors',
  period: 'Past 24 Hours',
  dataClassification: 'STATUTORY AUDITED',
  redZones: [manualRz],
  policeUnits: nagpurUnits,
  proposals: nagpurProposals,
  recurringPatterns: recurringPatternsData.filter(p => p.cityId === 'nagpur'),
  executiveSummaryText: 'Audited statutory operations report for Nagpur Municipal Corporation.',
  recommendations: [
    'Enforce dedicated commercial heavy-truck lane discipline on Outer Ring Road.',
    'Implement split-phase adaptive signal timing at Sitabuldi Junction.',
    'Fast-track DPR execution for Grade Separated Rotary on MIHAN freight corridor.',
  ],
  documentRef: 'SENTINEL-TRF-NAGPUR-TEST-001',
});

assert(pdfDoc != null, 'jsPDF document instance created');
const pageCount = pdfDoc.internal.getNumberOfPages();
assert(pageCount >= 1, `PDF generated with ${pageCount} page(s)`);
const pdfArrayBuffer = pdfDoc.output('arraybuffer');
assert(pdfArrayBuffer.byteLength > 2000, `PDF output generated valid binary buffer (${pdfArrayBuffer.byteLength} bytes)`);

// ──────────────────────────────────────────────────────────────────
// TEST 9: Live Observation Ingestion & Full Orchestration Lifecycle
// ──────────────────────────────────────────────────────────────────
console.log('\n[MODULE 9] Ingest Live Observations & Multi-Module Orchestrator:');
const mockLiveSegments = [
  {
    id: 'live_seg_test_01',
    corridorName: 'Outer Ring Road (North Sector)',
    corridorCode: 'ORR',
    type: 'Express Highway',
    coordinates: [[21.1458, 79.0882], [21.1500, 79.0950]],
    currentSpeedKmH: 8,
    freeFlowSpeedKmH: 60,
    speedRatio: 0.13,
    delaySeconds: 1200,
    congestionLevel: 'SEVERE',
    isLive: true,
  }
];

// Test ingestLiveObservations function
assert(typeof trafficStore.ingestLiveObservations === 'function', 'trafficStore.ingestLiveObservations is a registered function');
trafficStore.ingestLiveObservations('nagpur', mockLiveSegments);

const effectiveAfterIngest = trafficStore.getEffectiveTrafficData('nagpur');
assert(effectiveAfterIngest.segments.length > 0, `Effective traffic data populated after ingest (${effectiveAfterIngest.segments.length} segments)`);

// Test orchestrator runAnalysis on all 3 cities without throwing
import('../src/agents/orchestrator/trafficOrchestrator.js').then(({ TrafficControlOrchestrator }) => {
  ['mumbai', 'nagpur', 'pune'].forEach((city) => {
    const data = trafficStore.getEffectiveTrafficData(city);
    const orch = TrafficControlOrchestrator.runAnalysis(data, city);
    assert(orch != null && orch.highestPriority != null, `Orchestrator analysis completed successfully for ${city.toUpperCase()} (Priority: ${orch.highestPriority})`);
    assert(orch.infrastructure != null && orch.infrastructure.proposalsCount >= 0, `Infrastructure module integrated in ${city.toUpperCase()}`);
  });
});

// ──────────────────────────────────────────────────────────────────
// TEST SUMMARY
// ──────────────────────────────────────────────────────────────────
console.log('\n====================================================');
console.log(`🏁 VERIFICATION COMPLETE: ${testsPassed} PASSED, ${testsFailed} FAILED`);
console.log('====================================================');

if (testsFailed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
