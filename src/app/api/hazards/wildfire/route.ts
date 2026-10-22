/* ════════════════════════════════════════════════════════
   Sentinel City Intelligence API — /api/hazards/wildfire
   Multi-Hazard Wildfire Intelligence Feed:
   - NASA FIRMS Active VIIRS/MODIS Thermal Hotspots
   - Pre-Fire Risk Grid (H3 Hexagonal Surface & GeoJSON)
   - Heuristic Directional Fire Spread Vectors
   - Municipal Fire Brigade & Forest Range Stations
   - Simulated Emergency Dispatch Queue
   ════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from "next/server";
import { isValidCity, DEFAULT_CITY } from "@/lib/city-context";
import { getActiveFireObservations } from "@/modules/hazards/connectors/firms";
import { generateCityFireRiskGrid, getFireRiskCategory } from "@/modules/hazards/fire-risk-engine";
import { estimateFireSpread } from "@/modules/hazards/fire-spread-estimator";
import { loadCityEmergencyStations, getSimulatedDispatches } from "@/modules/hazards/emergency-dispatch";
import { h3ListToFeatureCollection } from "@/modules/hazards/h3-grid";
import { fetchCityWeather } from "@/modules/hazards/connectors/open-meteo";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const cityParam = searchParams.get("city") || DEFAULT_CITY;

    if (!isValidCity(cityParam)) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_CITY", message: `City '${cityParam}' is invalid.` } },
        { status: 400 }
      );
    }

    const city = cityParam.toLowerCase() as "mumbai" | "pune" | "nagpur";

    // 1. Fetch current weather telemetry for meteorological fire variables
    const weather = await fetchCityWeather(city);

    // 2. Ingest / retrieve active satellite thermal observations (NASA FIRMS)
    const firmsData = await getActiveFireObservations(city);

    // 3. Compute pre-fire risk H3 surface grid
    const drySpellDays = weather.rainfallRateMmH > 0 ? 0 : 12;
    const riskAssessments = generateCityFireRiskGrid(city, weather, drySpellDays);

    // Convert risk grid to GeoJSON FeatureCollection for direct Leaflet/MapLibre rendering
    const riskGeoJSON = h3ListToFeatureCollection(
      riskAssessments.map((a) => {
        const cat = getFireRiskCategory(a.riskScore);
        return {
          h3Index: a.h3Index,
          properties: {
            riskScore: a.riskScore,
            riskLevel: a.riskLevel,
            displayLabel: cat.displayLabel,
            color: cat.color,
            temp: a.weatherInputs.temperatureCelsius,
            rh: a.weatherInputs.relativeHumidity,
            windKmh: a.weatherInputs.windSpeedKmh,
            drySpellDays: a.weatherInputs.drySpellDays,
            slopeDeg: a.terrainInputs?.slopeDegrees,
            elevationM: a.terrainInputs?.elevationMeters,
            isExperimental: true,
          },
        };
      })
    );

    // 4. Compute preliminary directional fire spread vectors for active detections
    const spreadVectors = firmsData.observations.map((obs) => {
      return estimateFireSpread({
        originLat: obs.latitude,
        originLon: obs.longitude,
        windSpeedKmh: weather.windSpeedKmh ?? 15,
        windDirectionDegrees: weather.windDirectionDegrees ?? 240,
        slopeDegrees: 8.0,
        slopeAspectDegrees: 210,
        timeHorizonHours: 2,
        gustKmh: weather.windGustsKmh ?? 22,
      });
    });

    // 5. Load authentic municipal Fire Brigade & Forest Department stations
    const emergencyStations = loadCityEmergencyStations(city);

    // 6. Retrieve active simulated dispatch records
    const dispatches = getSimulatedDispatches(city);

    return NextResponse.json({
      success: true,
      data: {
        city,
        weather: {
          temperatureCelsius: weather.temperatureCelsius,
          relativeHumidity: weather.relativeHumidity,
          windSpeedKmh: weather.windSpeedKmh,
          windGustsKmh: weather.windGustsKmh,
          windDirectionDegrees: weather.windDirectionDegrees,
          weatherDescription: weather.weatherDescription,
          rainfallRateMmH: weather.rainfallRateMmH,
        },
        activeDetections: {
          count: firmsData.deduplicatedCount,
          source: firmsData.source,
          isFallback: firmsData.isFallback,
          retrievedAt: firmsData.retrievedAt,
          notes: firmsData.notes,
          observations: firmsData.observations,
        },
        preFireRisk: {
          cellsEvaluated: riskAssessments.length,
          modelVersion: "FIRE_RISK_SCREENING_V1.2",
          riskGeoJSON,
          sampleAssessments: riskAssessments.slice(0, 10),
        },
        fireSpreadEstimations: spreadVectors,
        emergencyStations: {
          count: emergencyStations.length,
          stations: emergencyStations,
        },
        simulatedDispatches: dispatches,
      },
      meta: {
        city,
        timestamp: new Date().toISOString(),
        disclaimer:
          "Wildfire intelligence combines NASA FIRMS satellite thermal observations with Open-Meteo weather screening models. Fire spread outputs are kinematic estimates and must not replace municipal incident command decisions.",
      },
    });
  } catch (err) {
    console.error("[API /api/hazards/wildfire] Error:", err);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: (err as Error).message } },
      { status: 500 }
    );
  }
}
