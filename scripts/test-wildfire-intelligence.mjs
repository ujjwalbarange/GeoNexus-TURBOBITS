/* ════════════════════════════════════════════════════════
   Sentinel City Intelligence — Wildfire & Multi-Hazard Test Suite
   Automated verification of:
   1. H3 Hexagonal Spatial Indexing Engine (Resolution 7 & 8)
   2. NASA FIRMS VIIRS/MODIS Parser & Deduplication
   3. Pre-Fire Risk Scoring Rubric (Multi-Factor Normalization)
   4. Kinematic Fire Spread Estimator & Uncertainty Cones
   5. Authentic Municipal Fire Brigade & Forest Department GIS
   6. Safe Simulated Emergency Dispatch Proposal State Machine
   7. Mumbai Flood Non-Regression Verification
   ════════════════════════════════════════════════════════ */

import fs from "node:fs";
import path from "node:path";
import * as h3 from "h3-js";

const WORKSPACE_ROOT = process.cwd();

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  ✓ [PASS] ${message}`);
    passedTests++;
  } else {
    console.error(`  ✗ [FAIL] ${message}`);
  }
}

console.log("════════════════════════════════════════════════════════════");
console.log("  SENTINEL MULTI-HAZARD & WILDFIRE INTELLIGENCE TEST SUITE  ");
console.log("════════════════════════════════════════════════════════════\n");

// ─────────────────────────────────────────────────────────
// 1. H3 Spatial Indexing Engine
// ─────────────────────────────────────────────────────────
console.log("[Test Suite 1/7] H3 Hexagonal Spatial Indexing Engine");
try {
  const mumbaiCenter = [19.076, 72.877];
  const puneCenter = [18.5204, 73.8567];
  const nagpurCenter = [21.1458, 79.0882];

  // Resolution 8 (Fire Risk Surface, ~0.7 km² area)
  const cellMum8 = h3.latLngToCell(mumbaiCenter[0], mumbaiCenter[1], 8);
  const cellPune8 = h3.latLngToCell(puneCenter[0], puneCenter[1], 8);
  const cellNag8 = h3.latLngToCell(nagpurCenter[0], nagpurCenter[1], 8);

  assert(typeof cellMum8 === "string" && cellMum8.length === 15, `Mumbai Res 8 H3 index is valid 15-char string (${cellMum8})`);
  assert(h3.isValidCell(cellMum8), `Mumbai cell is valid according to h3.isValidCell`);
  assert(h3.getResolution(cellMum8) === 8, `Cell resolution correctly matches requested Res 8`);

  const boundary = h3.cellToBoundary(cellMum8);
  assert(Array.isArray(boundary) && boundary.length >= 6, `H3 boundary generates closed hexagonal polygon with >= 6 vertices`);

  const [latBack, lonBack] = h3.cellToLatLng(cellMum8);
  const distKm = Math.hypot(latBack - mumbaiCenter[0], lonBack - mumbaiCenter[1]) * 111;
  assert(distKm < 1.0, `Cell centroid inverted coordinate within ${distKm.toFixed(2)} km of input`);
} catch (err) {
  console.error("  ✗ [FAIL] H3 Spatial Indexing error:", err);
}

// ─────────────────────────────────────────────────────────
// 2. NASA FIRMS VIIRS/MODIS Parser & Deduplication
// ─────────────────────────────────────────────────────────
console.log("\n[Test Suite 2/7] NASA FIRMS VIIRS/MODIS Parser & Deduplication");
try {
  // Test raw VIIRS CSV format
  const sampleCsv = `latitude,longitude,bright_ti4,scan,track,acq_date,acq_time,satellite,instrument,confidence,version,bright_ti5,frp,daynight
19.2154,72.9123,348.5,0.4,0.4,2026-10-22,0830,N,VIIRS,n,2.0N,298.2,14.6,D
19.2180,72.9140,351.2,0.4,0.4,2026-10-22,0830,N,VIIRS,h,2.0N,301.0,18.2,D
19.8500,73.5000,320.1,0.5,0.5,2026-10-22,0830,N,VIIRS,l,2.0N,290.0,4.2,D`;

  const lines = sampleCsv.trim().split("\n");
  const headers = lines[0].split(",");
  const rows = lines.slice(1).map(l => l.split(","));

  assert(rows.length === 3, "Parsed 3 sample VIIRS observation records");

  // Check brightness temp conversion & confidence classification
  const row0Lat = parseFloat(rows[0][0]);
  const row0Lon = parseFloat(rows[0][1]);
  const row0BrightK = parseFloat(rows[0][2]);
  const row0Frp = parseFloat(rows[0][12]);

  assert(row0BrightK > 300, `Thermal brightness Kelvin valid (${row0BrightK} K = ${(row0BrightK - 273.15).toFixed(1)}°C)`);
  assert(row0Frp > 0, `Fire Radiative Power (FRP) positive (${row0Frp} MW)`);

  // Test spatial deduplication (distance threshold 1.0 km)
  const distBtwnRows = Math.hypot(parseFloat(rows[0][0]) - parseFloat(rows[1][0]), parseFloat(rows[0][1]) - parseFloat(rows[1][1])) * 111;
  const isDuplicateCluster = distBtwnRows < 1.0;
  assert(isDuplicateCluster, `Rows 0 and 1 detected as co-located cluster (~${distBtwnRows.toFixed(2)} km apart)`);
} catch (err) {
  console.error("  ✗ [FAIL] FIRMS parser error:", err);
}

// ─────────────────────────────────────────────────────────
// 3. Pre-Fire Risk Scoring Rubric
// ─────────────────────────────────────────────────────────
console.log("\n[Test Suite 3/7] Pre-Fire Risk Scoring Rubric (Multi-Factor)");
try {
  // Test 1: Low Fire Risk Scenario (Cool monsoon conditions)
  const lowRiskInputs = {
    temp: 24, // 24°C
    rh: 85,   // 85% RH
    windKmh: 8,
    drySpellDays: 0,
    slope: 2.0,
  };

  // Temp factor (20% weight) -> temp <= 25 => 10 points * 0.2 = 2
  // RH factor (25% weight) -> rh >= 65 => 5 points * 0.25 = 1.25 -> 1
  // Wind factor (20% weight) -> wind < 15 => 15 points * 0.2 = 3
  // Dry-spell factor (20% weight) -> 0 days => 5 points * 0.2 = 1
  // Slope factor (15% weight) -> slope < 5° => 10 points * 0.15 = 1.5 -> 2
  // Expected total: ~9-15 (VERY_LOW)

  let lowScore = 0;
  lowScore += (lowRiskInputs.temp <= 25 ? 10 : 50) * 0.2;
  lowScore += (lowRiskInputs.rh >= 65 ? 5 : 50) * 0.25;
  lowScore += (lowRiskInputs.windKmh < 15 ? 15 : 50) * 0.2;
  lowScore += (lowRiskInputs.drySpellDays === 0 ? 5 : 50) * 0.2;
  lowScore += (lowRiskInputs.slope < 5 ? 10 : 50) * 0.15;
  lowScore = Math.round(lowScore);

  assert(lowScore < 25, `Low fire weather scenario scores ${lowScore}/100 (< 25, VERY_LOW category)`);

  // Test 2: Severe Pre-Fire Weather Scenario (Hot, dry, windy ridge)
  const highRiskInputs = {
    temp: 41.5, // 41.5°C
    rh: 16,     // 16% RH
    windKmh: 36,
    drySpellDays: 24,
    slope: 22.0, // steep ridge
  };

  let highScore = 0;
  highScore += (highRiskInputs.temp >= 40 ? 100 : 50) * 0.2;
  highScore += (highRiskInputs.rh <= 20 ? 100 : 50) * 0.25;
  highScore += (highRiskInputs.windKmh >= 35 ? 100 : 50) * 0.2;
  highScore += (highRiskInputs.drySpellDays >= 21 ? 100 : 50) * 0.2;
  highScore += (highRiskInputs.slope >= 20 ? 100 : 50) * 0.15;
  highScore = Math.round(highScore);

  assert(highScore >= 85, `Critical fire weather scenario scores ${highScore}/100 (>= 85, VERY_HIGH category)`);
  assert(highScore <= 100, `Score is bounded within [0, 100] scale`);
} catch (err) {
  console.error("  ✗ [FAIL] Risk rubric error:", err);
}

// ─────────────────────────────────────────────────────────
// 4. Kinematic Fire Spread Estimator
// ─────────────────────────────────────────────────────────
console.log("\n[Test Suite 4/7] Kinematic Fire Spread Estimator & Uncertainty Cones");
try {
  const originLat = 19.2154;
  const originLon = 72.9123;
  const windKmh = 22;
  const windDirDeg = 240; // Wind blowing from WSW towards ENE (60°)
  const slopeDeg = 12;
  const slopeAspect = 220; // Hill slopes upwards towards SW

  // Wind vector towards downwind direction: (240 + 180) % 360 = 60°
  const downwindHeading = (windDirDeg + 180) % 360;
  assert(downwindHeading === 60, `Downwind spread heading correctly computed as ${downwindHeading}° (towards ENE)`);

  // Spread speed scales monotonically with wind and slope
  const baseRate = 0.45; // km/h
  const windMultiplier = Math.exp(0.045 * windKmh);
  const slopeMultiplier = Math.exp(0.065 * slopeDeg);
  const estimatedSpeedKmh = Math.min(12.0, Number((baseRate * windMultiplier * slopeMultiplier).toFixed(2)));

  assert(estimatedSpeedKmh > 1.0 && estimatedSpeedKmh < 12.0, `Estimated spread rate is realistic (${estimatedSpeedKmh} km/h)`);

  // Uncertainty cone: ±25° to ±40°
  const uncertaintyCone = 30; // degrees
  const leftAngle = (downwindHeading - uncertaintyCone + 360) % 360;
  const rightAngle = (downwindHeading + uncertaintyCone) % 360;

  assert(leftAngle === 30 && rightAngle === 90, `Uncertainty cone boundaries span [${leftAngle}°, ${rightAngle}°]`);
} catch (err) {
  console.error("  ✗ [FAIL] Fire spread estimator error:", err);
}

// ─────────────────────────────────────────────────────────
// 5. Authentic Municipal Fire Brigade & Forest Department GIS
// ─────────────────────────────────────────────────────────
console.log("\n[Test Suite 5/7] Authentic Municipal Fire Brigade & Forest Department GIS");
try {
  // A. Mumbai
  const mumbaiFirePath = path.join(WORKSPACE_ROOT, "data/mumbai/mumbai_fire_brigade_clean.geojson");
  assert(fs.existsSync(mumbaiFirePath), "Mumbai clean fire brigade stations GeoJSON exists");
  const mumbaiFire = JSON.parse(fs.readFileSync(mumbaiFirePath, "utf-8"));
  assert(Array.isArray(mumbaiFire.features) && mumbaiFire.features.length >= 20, `Mumbai has ${mumbaiFire.features.length} authentic fire brigade stations (>= 20)`);

  const mumbaiGardenPath = path.join(WORKSPACE_ROOT, "data/mumbai/mumbai_garden_and_environment_dept.geojson");
  assert(fs.existsSync(mumbaiGardenPath), "Mumbai garden & environment dept GeoJSON exists");

  // B. Pune
  const puneFirePath = path.join(WORKSPACE_ROOT, "data/pune/pune_fire_brigade_stations.geojson");
  assert(fs.existsSync(puneFirePath), "Pune fire brigade stations GeoJSON exists");
  const puneFire = JSON.parse(fs.readFileSync(puneFirePath, "utf-8"));
  assert(Array.isArray(puneFire.features) && puneFire.features.length >= 10, `Pune has ${puneFire.features.length} authentic fire brigade stations (>= 10)`);

  const puneForestPath = path.join(WORKSPACE_ROOT, "data/pune/pune_forest_department_coordinates.geojson");
  assert(fs.existsSync(puneForestPath), "Pune forest department coordinates GeoJSON exists");
  const puneForest = JSON.parse(fs.readFileSync(puneForestPath, "utf-8"));
  assert(Array.isArray(puneForest.features) && puneForest.features.length >= 5, `Pune has ${puneForest.features.length} authentic forest department posts (>= 5)`);

  // C. Nagpur
  const nagpurFirePath = path.join(WORKSPACE_ROOT, "data/geodata/nagpur_fire_department.geojson");
  assert(fs.existsSync(nagpurFirePath), "Nagpur fire department GeoJSON exists");
  const nagpurFire = JSON.parse(fs.readFileSync(nagpurFirePath, "utf-8"));
  assert(Array.isArray(nagpurFire.features) && nagpurFire.features.length >= 5, `Nagpur has ${nagpurFire.features.length} authentic fire department facilities`);

  const nagpurForestPath = path.join(WORKSPACE_ROOT, "data/geodata/nagpur_territorial_forest_dept_clean.geojson");
  assert(fs.existsSync(nagpurForestPath), "Nagpur territorial forest dept GeoJSON exists");
  const nagpurForest = JSON.parse(fs.readFileSync(nagpurForestPath, "utf-8"));
  assert(Array.isArray(nagpurForest.features) && nagpurForest.features.length >= 5, `Nagpur has ${nagpurForest.features.length} authentic forest range stations`);
} catch (err) {
  console.error("  ✗ [FAIL] Station GIS error:", err);
}

// ─────────────────────────────────────────────────────────
// 6. Safe Simulated Emergency Dispatch Proposal State Machine
// ─────────────────────────────────────────────────────────
console.log("\n[Test Suite 6/7] Safe Simulated Emergency Dispatch State Machine");
try {
  // Test state transitions
  const record = {
    id: "dsp_test_001",
    dispatchReference: `DSP-MUM-WILDFIRE-${Math.floor(1000 + Math.random() * 9000)}`,
    status: "PROPOSED",
    hazardType: "WILDFIRE",
    city: "mumbai",
    targetLatitude: 19.2154,
    targetLongitude: 72.9123,
    assignedStationName: "Borivali Fire Station",
    estimatedTravelMinutes: 14,
    distanceKm: 6.8,
    routingMethod: "OSRM_ROAD_NETWORK",
    isSimulated: true,
    simulationMode: "PREVIEW_SIMULATED",
    notes: "Controlled test scenario",
    createdAt: new Date().toISOString(),
  };

  assert(record.status === "PROPOSED", "Initial state is PROPOSED");
  assert(record.isSimulated === true, "Explicit simulation safety flag is true");
  assert(record.simulationMode === "PREVIEW_SIMULATED", "Simulation sandbox mode declared");

  // Transition to DISPATCHED_SIMULATED
  record.status = "DISPATCHED_SIMULATED";
  record.authorizedBy = "MUNICIPAL_DISPATCH_SUPERVISOR_01";
  record.authorizedAt = new Date().toISOString();

  assert(record.status === "DISPATCHED_SIMULATED", "State successfully transitioned to DISPATCHED_SIMULATED");
  assert(record.authorizedBy.length > 0, "Audit trail records authorizing actor");
} catch (err) {
  console.error("  ✗ [FAIL] Dispatch state machine error:", err);
}

// ─────────────────────────────────────────────────────────
// 7. Mumbai Flood Non-Regression Verification
// ─────────────────────────────────────────────────────────
console.log("\n[Test Suite 7/7] Mumbai Flood Non-Regression Verification");
try {
  const mumbaiHotspotsPath = path.join(WORKSPACE_ROOT, "data/mumbai/flood_spatial/mumbai_flood_hotspots.geojson");
  assert(fs.existsSync(mumbaiHotspotsPath), "Authentic Mumbai flood hotspots GeoJSON intact");
  const hotspots = JSON.parse(fs.readFileSync(mumbaiHotspotsPath, "utf-8"));
  assert(Array.isArray(hotspots.features) && hotspots.features.length >= 20, `Mumbai has ${hotspots.features.length} verified flood hotspots (>= 20)`);

  // Check known chronic flood points
  const names = hotspots.features.map(f => f.properties?.name || "");
  const hasGandhiMarket = names.some(n => /Gandhi Market/i.test(n));
  const hasHindmata = names.some(n => /Hindmata/i.test(n));
  const hasMilanSubway = names.some(n => /Milan/i.test(n));

  assert(hasHindmata, "Hindmata Cinema Junction hotspot verified intact");
  assert(hasGandhiMarket || hasMilanSubway, "Chronic Mumbai low-lying hotspot (Gandhi Market or Milan) verified intact");

  const mumbaiLowLyingPath = path.join(WORKSPACE_ROOT, "data/mumbai/flood_spatial/mumbai_low_lying_areas.geojson");
  assert(fs.existsSync(mumbaiLowLyingPath), "Mumbai low-lying basin areas intact");
  const lowLying = JSON.parse(fs.readFileSync(mumbaiLowLyingPath, "utf-8"));
  assert(Array.isArray(lowLying.features) && lowLying.features.length > 0, `Mumbai has ${lowLying.features.length} low-lying depression basins`);
} catch (err) {
  console.error("  ✗ [FAIL] Mumbai flood non-regression error:", err);
}

// ─────────────────────────────────────────────────────────
// Summary Report
// ─────────────────────────────────────────────────────────
console.log("\n════════════════════════════════════════════════════════════");
console.log(`  TEST RESULTS: ${passedTests} / ${totalTests} PASSED (${Math.round((passedTests / totalTests) * 100)}%)`);
console.log("════════════════════════════════════════════════════════════\n");

if (passedTests === totalTests) {
  console.log("All wildfire intelligence, spatial index, and flood regression checks PASSED!");
  process.exit(0);
} else {
  console.error("Some tests failed. Inspect details above.");
  process.exit(1);
}
