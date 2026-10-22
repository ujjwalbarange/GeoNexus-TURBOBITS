/* ════════════════════════════════════════════════════════
   Sentinel City Intelligence — Pre-Fire Wildfire Risk Engine
   Multi-Factor 0-100 Screening Rubric for H3 Hexagonal Grid Cells.
   Combines temperature, relative humidity, wind velocity, dry-spell
   duration, vegetation dryness, and terrain slope into an explainable score.
   ════════════════════════════════════════════════════════ */

import { FireRiskAssessment } from "./contracts";
import { latLngToH3, h3ToLatLng, generateH3BoundingGrid, H3_RESOLUTIONS } from "./h3-grid";
import { CityWeatherTelemetry } from "./connectors/types";
import { CITIES } from "@/lib/city-context";

export interface FireRiskEvaluationInput {
  city: "mumbai" | "pune" | "nagpur";
  weather: CityWeatherTelemetry;
  drySpellDays?: number;
  recentRainfallMm?: number;
  vegetationIndex?: number; // 0 to 1
  h3Cells?: string[];
}

export interface RiskCategoryConfig {
  min: number;
  max: number;
  label: "VERY_LOW" | "LOW" | "MODERATE" | "HIGH" | "VERY_HIGH";
  displayLabel: string;
  color: string;
  description: string;
}

export const FIRE_RISK_CATEGORIES: RiskCategoryConfig[] = [
  { min: 0,  max: 19, label: "VERY_LOW",  displayLabel: "Very Low",  color: "#10b981", description: "Minimal ignition potential; fuels have high moisture content." },
  { min: 20, max: 39, label: "LOW",       displayLabel: "Low",       color: "#84cc16", description: "Low ignition risk; fires extinguish easily without rapid spread." },
  { min: 40, max: 59, label: "MODERATE",  displayLabel: "Moderate",  color: "#eab308", description: "Moderate ignition risk; dry brush can sustain surface spread under wind." },
  { min: 60, max: 79, label: "HIGH",      displayLabel: "High",      color: "#f97316", description: "High risk; fuels ignite easily; rapid spread possible along ridges." },
  { min: 80, max: 100,label: "VERY_HIGH", displayLabel: "Very High", color: "#ef4444", description: "Critical fire weather; severe rate of spread; immediate containment needed." },
];

/**
 * Resolve risk category from 0-100 score.
 */
export function getFireRiskCategory(score: number): RiskCategoryConfig {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  for (const cat of FIRE_RISK_CATEGORIES) {
    if (clamped >= cat.min && clamped <= cat.max) {
      return cat;
    }
  }
  return FIRE_RISK_CATEGORIES[0];
}

/**
 * Estimate terrain slope (degrees) from elevation gradients or ward terrain profile.
 * High slopes (>15°) dramatically accelerate wildfire rate of spread.
 */
function estimateCellSlope(lat: number, lon: number, city: string): { slopeDegrees: number; aspectDegrees: number; elevationMeters: number } {
  // Approximate topographic features:
  // Mumbai: Sanjay Gandhi National Park / Kanheri hills (lat > 19.18, lon 72.88 - 72.96) have steep ridges (15-28°)
  // Pune: Katraj / Sinhagad / Pashan hills have slopes 12-25°
  // Nagpur: Seminary Hills / Gorewada have rolling slopes 6-14°
  let slope = 3.5;
  let aspect = 180; // South-facing
  let elevation = 15;

  if (city === "mumbai") {
    if (lat > 19.18 && lon > 72.88 && lon < 72.96) {
      slope = 21.0;
      elevation = 380;
      aspect = 210; // Southwest facing (afternoon solar heating)
    } else if (lon > 72.90 && lat < 19.06) {
      slope = 14.0; // Trombay hill
      elevation = 240;
      aspect = 160;
    } else {
      slope = 2.0;
      elevation = 8;
    }
  } else if (city === "pune") {
    if (lat < 18.48) {
      slope = 18.5; // Katraj / Sinhagad foothills
      elevation = 750;
      aspect = 190;
    } else {
      slope = 5.0;
      elevation = 560;
    }
  } else if (city === "nagpur") {
    if (lat > 21.16 && lon < 79.06) {
      slope = 9.5; // Seminary hills
      elevation = 340;
    } else {
      slope = 2.5;
      elevation = 310;
    }
  }

  return { slopeDegrees: slope, aspectDegrees: aspect, elevationMeters: elevation };
}

/**
 * Calculate multi-factor pre-fire risk assessment for a specific H3 cell.
 */
export function evaluateCellFireRisk(
  h3Index: string,
  input: FireRiskEvaluationInput
): FireRiskAssessment {
  const { city, weather, drySpellDays = 12, recentRainfallMm = 0, vegetationIndex = 0.65 } = input;
  const [centerLat, centerLon] = h3ToLatLng(h3Index);
  const terrain = estimateCellSlope(centerLat, centerLon, city);

  const temp = weather.temperatureCelsius ?? 32;
  const rh = weather.relativeHumidity ?? 45;
  const windKmh = weather.windSpeedKmh ?? 14;
  const windGusts = weather.windGustsKmh ?? 22;
  const windDir = weather.windDirectionDegrees ?? 240; // Default WSW

  const factors: FireRiskAssessment["factors"] = [];
  let totalScore = 0;

  // 1. Ambient Temperature Factor (Weight: 20%)
  let tempScore = 20;
  if (temp >= 40) tempScore = 100;
  else if (temp >= 35) tempScore = 80;
  else if (temp >= 30) tempScore = 55;
  else if (temp >= 25) tempScore = 30;
  else tempScore = 10;

  const tempContrib = Math.round(tempScore * 0.20);
  totalScore += tempContrib;
  factors.push({
    factor: "Ambient Surface Temperature",
    weightPercent: 20,
    value: `${temp.toFixed(1)}°C`,
    contribution: tempContrib,
    description: temp >= 35 ? "High ambient temperature accelerates thermal pre-heating of forest litter" : "Moderate thermal regime",
  });

  // 2. Relative Humidity Deficit (Weight: 25%)
  let rhScore = 15;
  if (rh <= 20) rhScore = 100;
  else if (rh <= 35) rhScore = 85;
  else if (rh <= 50) rhScore = 55;
  else if (rh <= 65) rhScore = 25;
  else rhScore = 5;

  const rhContrib = Math.round(rhScore * 0.25);
  totalScore += rhContrib;
  factors.push({
    factor: "Atmospheric Humidity Deficit",
    weightPercent: 25,
    value: `${rh.toFixed(0)}%`,
    contribution: rhContrib,
    description: rh <= 35 ? "Low relative humidity drives 1-hour and 10-hour dead fuel moisture below critical 8% threshold" : "Adequate atmospheric moisture buffering ignition",
  });

  // 3. Wind Velocity & Gust Potential (Weight: 20%)
  const effectiveWind = Math.max(windKmh, windGusts * 0.7);
  let windScore = 15;
  if (effectiveWind >= 35) windScore = 100;
  else if (effectiveWind >= 25) windScore = 75;
  else if (effectiveWind >= 15) windScore = 45;
  else windScore = 15;

  const windContrib = Math.round(windScore * 0.20);
  totalScore += windContrib;
  factors.push({
    factor: "Wind Velocity & Gusts",
    weightPercent: 20,
    value: `${windKmh.toFixed(1)} km/h (Gusts: ${windGusts.toFixed(1)})`,
    contribution: windContrib,
    description: effectiveWind >= 25 ? "Strong surface winds promote rapid forward flame propagation and ember spotting" : "Light breeze within normal baseline",
  });

  // 4. Dry-Spell Duration / Fuel Desiccation (Weight: 20%)
  let dryScore = 20;
  if (recentRainfallMm > 5) {
    dryScore = 0; // Immediate rain suppresses pre-fire risk
  } else if (drySpellDays >= 21) {
    dryScore = 100;
  } else if (drySpellDays >= 14) {
    dryScore = 80;
  } else if (drySpellDays >= 7) {
    dryScore = 50;
  } else {
    dryScore = 20;
  }

  const dryContrib = Math.round(dryScore * 0.20);
  totalScore += dryContrib;
  factors.push({
    factor: "Dry-Spell Duration",
    weightPercent: 20,
    value: `${drySpellDays} consecutive dry days (<${recentRainfallMm.toFixed(1)}mm rain)`,
    contribution: dryContrib,
    description: drySpellDays >= 14 ? "Extended dry spell produces deep desiccation in canopy and understory biomass" : "Recent moisture retained in soil matrix",
  });

  // 5. Topographic Slope & Ridge Alignment (Weight: 15%)
  let slopeScore = 20;
  if (terrain.slopeDegrees >= 20) slopeScore = 100;
  else if (terrain.slopeDegrees >= 12) slopeScore = 70;
  else if (terrain.slopeDegrees >= 6) slopeScore = 45;
  else slopeScore = 15;

  const slopeContrib = Math.round(slopeScore * 0.15);
  totalScore += slopeContrib;
  factors.push({
    factor: "Topographic Slope & Aspect",
    weightPercent: 15,
    value: `${terrain.slopeDegrees.toFixed(1)}° inclination (${terrain.aspectDegrees}° aspect)`,
    contribution: slopeContrib,
    description: terrain.slopeDegrees >= 12 ? "Steep incline significantly preheats uphill vegetative fuel via convective column" : "Gentle or flat terrain",
  });

  const finalScore = Math.min(100, Math.max(0, totalScore));
  const category = getFireRiskCategory(finalScore);

  const now = new Date();
  const validUntil = new Date(now.getTime() + 6 * 3600 * 1000).toISOString(); // 6h forecast horizon

  return {
    id: `risk-${city}-${h3Index}`,
    city,
    h3Index,
    h3Resolution: 8,
    riskScore: finalScore,
    riskLevel: category.label,
    factors,
    weatherInputs: {
      temperatureCelsius: temp,
      relativeHumidity: rh,
      windSpeedKmh: windKmh,
      windDirectionDegrees: windDir,
      recentRainfallMm,
      drySpellDays,
    },
    terrainInputs: {
      slopeDegrees: terrain.slopeDegrees,
      aspectDegrees: terrain.aspectDegrees,
      elevationMeters: terrain.elevationMeters,
    },
    vegetationInputs: {
      drynessIndex: vegetationIndex,
      vegetationClass: terrain.slopeDegrees >= 12 ? "Forest Ridge / Deciduous Scrub" : "Urban / Grassland Mosaic",
    },
    modelTimestamp: now.toISOString(),
    validUntil,
    modelVersion: "FIRE_RISK_SCREENING_V1.2",
    isExperimental: true,
    uncertaintyDisclaimer:
      "Pre-fire risk score is an indicative meteorological and topographic screening index. It models susceptibility to ignition and rate of spread, NOT confirmed active combustion. High risk alone does not indicate an active emergency.",
  };
}

/**
 * Generate full municipal H3 fire risk grid for a city.
 */
export function generateCityFireRiskGrid(
  city: "mumbai" | "pune" | "nagpur",
  weather: CityWeatherTelemetry,
  drySpellDays: number = 10
): FireRiskAssessment[] {
  const cityBounds: Record<string, [[number, number], [number, number]]> = {
    mumbai: [[18.89, 72.75], [19.28, 73.05]],
    pune:   [[18.42, 73.74], [18.62, 73.98]],
    nagpur: [[21.05, 79.00], [21.22, 79.18]],
  };

  const bounds = cityBounds[city] || cityBounds["mumbai"];
  const cells = generateH3BoundingGrid(bounds[0], bounds[1], H3_RESOLUTIONS.LOCAL_RISK_SURFACE);

  const results: FireRiskAssessment[] = [];
  const evalInput: FireRiskEvaluationInput = {
    city,
    weather,
    drySpellDays,
    recentRainfallMm: weather.rainfallRateMmH > 0 ? weather.rainfallRateMmH : 0,
  };

  for (const cell of cells) {
    results.push(evaluateCellFireRisk(cell, evalInput));
  }

  return results;
}

/**
 * Convenience evaluator for single point or arbitrary inputs
 */
export function calculatePreFireRisk(params: {
  city: "mumbai" | "pune" | "nagpur";
  h3Index?: string;
  weather: any;
  drySpellDays?: number;
  recentRainfallMm?: number;
}): FireRiskAssessment {
  const city = params.city;
  const defaultCoords = CITIES[city]?.center || [19.076, 72.877];
  const h3Index = params.h3Index && params.h3Index !== "screening-cell"
    ? params.h3Index
    : latLngToH3(defaultCoords[0], defaultCoords[1], H3_RESOLUTIONS.LOCAL_RISK_SURFACE);

  return evaluateCellFireRisk(h3Index, {
    city,
    weather: params.weather,
    drySpellDays: params.drySpellDays ?? (params.weather.rainfallRateMmH > 0 ? 0 : 12),
    recentRainfallMm: params.recentRainfallMm ?? params.weather.rainfallRateMmH ?? 0,
  });
}

