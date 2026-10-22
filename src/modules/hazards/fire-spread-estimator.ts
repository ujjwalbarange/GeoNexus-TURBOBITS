/* ════════════════════════════════════════════════════════
   Sentinel City Intelligence — Heuristic Fire Spread Estimator
   Directional spread vector, wind-slope resultant, uncertainty cone,
   and neighboring H3 cell arrival-time heuristic estimation.
   ════════════════════════════════════════════════════════ */

import { FireSpreadVector } from "./contracts";
import { latLngToH3, h3ToLatLng, getH3Neighbors } from "./h3-grid";

export interface FireSpreadInput {
  originLat: number;
  originLon: number;
  windSpeedKmh: number;
  windDirectionDegrees: number; // Meteorological direction wind is coming FROM (0=N, 90=E, 180=S, 270=W)
  slopeDegrees?: number;
  slopeAspectDegrees?: number;  // Direction the slope faces
  timeHorizonHours?: number;    // default 2h
  gustKmh?: number;
}

/**
 * Helper: Bearing between two points in degrees (0-360).
 */
function calculateBearingDegrees(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const y = Math.sin(deltaLambda) * Math.cos(phi2);
  const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);
  const theta = Math.atan2(y, x);
  return (theta * 180 / Math.PI + 360) % 360;
}

/**
 * Estimate preliminary directional fire spread vector and downwind H3 cell exposure.
 */
export function estimateFireSpread(input: FireSpreadInput): FireSpreadVector {
  const {
    originLat,
    originLon,
    windSpeedKmh,
    windDirectionDegrees,
    slopeDegrees = 0,
    slopeAspectDegrees = 0,
    timeHorizonHours = 2,
    gustKmh = windSpeedKmh * 1.3,
  } = input;

  const originH3 = latLngToH3(originLat, originLon, 8);

  // Direction the wind blows TOWARDS (opposite of meteorological "coming from")
  const windBlowsTowardsDeg = (windDirectionDegrees + 180) % 360;

  // Slope effect: fires spread faster uphill (convective pre-heating)
  // Uphill direction is opposite to slope aspect (aspect is downslope direction)
  const uphillDirectionDeg = (slopeAspectDegrees + 180) % 360;
  const slopeForcingFactor = Math.min(1.5, Math.tan((slopeDegrees * Math.PI) / 180) * 2.0);

  // Vector resultant of wind and uphill slope
  const windRad = (windBlowsTowardsDeg * Math.PI) / 180;
  const slopeRad = (uphillDirectionDeg * Math.PI) / 180;

  // Weight wind 75% and slope 25% for urban-forest interface
  const vx = Math.sin(windRad) * windSpeedKmh + Math.sin(slopeRad) * (slopeForcingFactor * 10);
  const vy = Math.cos(windRad) * windSpeedKmh + Math.cos(slopeRad) * (slopeForcingFactor * 10);

  const resultantBearing = (Math.atan2(vx, vy) * 180 / Math.PI + 360) % 360;

  // Base forward spread speed (Rothermel-inspired screening approximation)
  // Base rate in dry deciduous / scrub: ~0.3 km/h in calm conditions, scaling with wind
  const baseRateKmh = 0.35;
  const windMultiplier = Math.max(1.0, 1.0 + Math.pow(windSpeedKmh / 15, 1.4));
  const slopeMultiplier = 1.0 + slopeForcingFactor;
  const predictedSpreadSpeedKmh = Math.min(12.0, baseRateKmh * windMultiplier * slopeMultiplier);

  // Uncertainty cone widens when gusts are high relative to sustained wind
  const gustRatio = gustKmh / Math.max(1, windSpeedKmh);
  const uncertaintyCone = Math.min(65, Math.max(30, 35 * gustRatio));

  // Determine affected neighboring H3 resolution 8 cells (k-ring = 2)
  const candidateCells = getH3Neighbors(originH3, 2);
  const potentiallyAffectedCells: FireSpreadVector["potentiallyAffectedH3Cells"] = [];

  for (const cell of candidateCells) {
    if (cell === originH3) continue;

    const [cLat, cLon] = h3ToLatLng(cell);
    const bearingToCell = calculateBearingDegrees(originLat, originLon, cLat, cLon);

    // Calculate angular difference
    let diff = Math.abs(bearingToCell - resultantBearing);
    if (diff > 180) diff = 360 - diff;

    // Inside uncertainty cone?
    if (diff <= uncertaintyCone) {
      // Distance from origin in km
      const dLat = (cLat - originLat) * 111.0;
      const dLon = (cLon - originLon) * 111.0 * Math.cos((originLat * Math.PI) / 180);
      const distKm = Math.sqrt(dLat * dLat + dLon * dLon);

      // Arrival time in minutes
      const arrivalMinutes = Math.round((distKm / Math.max(0.5, predictedSpreadSpeedKmh)) * 60);

      // Probability decreases with angle off the centerline and distance
      const angularWeight = 1.0 - (diff / uncertaintyCone) * 0.6;
      const distanceWeight = Math.max(0.2, 1.0 - (distKm / (predictedSpreadSpeedKmh * timeHorizonHours)));
      const probability = Math.max(0.05, Math.min(0.95, angularWeight * distanceWeight));

      if (arrivalMinutes <= timeHorizonHours * 60) {
        potentiallyAffectedCells.push({
          h3Index: cell,
          estimatedArrivalMinutes: arrivalMinutes,
          probabilityScore: parseFloat(probability.toFixed(2)),
        });
      }
    }
  }

  // Sort by earliest arrival time
  potentiallyAffectedCells.sort((a, b) => a.estimatedArrivalMinutes - b.estimatedArrivalMinutes);

  return {
    originLat,
    originLon,
    h3OriginCell: originH3,
    predictedSpreadDirectionDeg: Math.round(resultantBearing),
    predictedSpreadSpeedKmh: parseFloat(predictedSpreadSpeedKmh.toFixed(1)),
    uncertaintyConeDegrees: Math.round(uncertaintyCone),
    timeHorizonHours,
    potentiallyAffectedH3Cells: potentiallyAffectedCells,
    assumptions: [
      `Effective wind forcing toward ${Math.round(resultantBearing)}° at ${windSpeedKmh.toFixed(1)} km/h (gusts ${gustKmh.toFixed(1)} km/h).`,
      slopeDegrees > 0 ? `Uphill slope inclination of ${slopeDegrees.toFixed(1)}° contributes convective pre-heating toward ${Math.round(uphillDirectionDeg)}°.` : "Terrain assumed flat with zero topographic acceleration.",
      "Dead fuel moisture assumed below 10% in dry deciduous scrub understory.",
    ],
    disclaimer:
      "HEURISTIC ESTIMATE ONLY: This directional spread vector is a kinematic screening tool based on surface wind and slope forcing. It is NOT a validated physical fire-spread model (such as Rothermel / FARSITE / WRF-SFIRE). Do NOT present this directional cone as a certified arrival-time prediction or evacuation order.",
  };
}
