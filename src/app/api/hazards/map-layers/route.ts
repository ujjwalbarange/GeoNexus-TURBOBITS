/* ════════════════════════════════════════════════════════
   Sentinel City Intelligence API — /api/hazards/map-layers
   Returns city-specific GeoJSON layers for GIS map rendering.
   Strict city isolation: Mumbai layers are never returned for Pune/Nagpur.
   ════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { isValidCity, DEFAULT_CITY } from "@/lib/city-context";
import { mumbaiFloodAdapter } from "@/modules/hazards/mumbai-flood-adapter";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const cityParam = searchParams.get("city") || DEFAULT_CITY;
    const requestedLayers = (searchParams.get("layers") || "hotspots,sinks,drainage,coastal").split(",");

    if (!isValidCity(cityParam)) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_CITY", message: `City '${cityParam}' is invalid.` } },
        { status: 400 }
      );
    }

    const citySlug = cityParam.toLowerCase();
    let layers: Record<string, any> = {};

    if (citySlug === "mumbai") {
      // Use verified Mumbai spatial adapter
      layers = mumbaiFloodAdapter.getMapLayerCollection(requestedLayers);
      // Also load Mumbai Fire Brigade stations if fire or fire_stations requested
      if (requestedLayers.includes("fire") || requestedLayers.includes("fire_stations")) {
        const firePath = path.resolve(process.cwd(), "data", "mumbai", "mumbai_fire_brigade_clean.geojson");
        if (fs.existsSync(firePath)) {
          try {
            layers["fire"] = JSON.parse(fs.readFileSync(firePath, "utf-8"));
          } catch {}
        }
      }
      if (requestedLayers.includes("forest") || requestedLayers.includes("environment")) {
        const envPath = path.resolve(process.cwd(), "data", "mumbai", "mumbai_garden_and_environment_dept.geojson");
        if (fs.existsSync(envPath)) {
          try {
            layers["forest"] = JSON.parse(fs.readFileSync(envPath, "utf-8"));
          } catch {}
        }
      }
    } else if (citySlug === "pune") {
      // Return Pune civic, drainage, waterways & emergency GeoJSON layers
      const puneDir = path.resolve(process.cwd(), "data", "pune");
      const puneLayerMap: Record<string, string> = {
        drainage: "pune_drainage_department_coordinates.geojson",
        disaster: "pune_disaster_management_departments.geojson",
        water_supply: "pune_water_supply_department_coordinates.geojson",
        fire: "pune_fire_brigade_stations.geojson",
        forest: "pune_forest_department_coordinates.geojson",
        zonal: "pune_pmc_zonal_boundaries.geojson",
        waterways: "pune_waterways.geojson",
        hospitals: "pune_emergency_hospitals.geojson",
      };

      for (const [layerKey, fileName] of Object.entries(puneLayerMap)) {
        const fullPath = path.join(puneDir, fileName);
        if (fs.existsSync(fullPath)) {
          try {
            layers[layerKey] = JSON.parse(fs.readFileSync(fullPath, "utf-8"));
          } catch {}
        }
      }
    } else if (citySlug === "nagpur") {
      // Return Nagpur administrative, drainage, waterways & emergency GeoJSON layers
      const nagpurDir = path.resolve(process.cwd(), "data", "geodata");
      const nagpurLayerMap: Record<string, string> = {
        zonal: "nagpur_nmc_zonal_boundaries.geojson",
        fire: "nagpur_fire_department.geojson",
        forest: "nagpur_territorial_forest_dept_clean.geojson",
        water_works: "nagpur_nmc_water_works.geojson",
        solid_waste: "nagpur_nmc_solid_waste_management.geojson",
        police: "nagpur_city_police.geojson",
        waterways: "nagpur_waterways.geojson",
        hospitals: "nagpur_emergency_hospitals.geojson",
      };

      for (const [layerKey, fileName] of Object.entries(nagpurLayerMap)) {
        const fullPath = path.join(nagpurDir, fileName);
        if (fs.existsSync(fullPath)) {
          try {
            layers[layerKey] = JSON.parse(fs.readFileSync(fullPath, "utf-8"));
          } catch {}
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        city: citySlug,
        layers,
        supportedLayersCount: Object.keys(layers).length,
      },
      meta: {
        city: citySlug,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error("[API /api/hazards/map-layers] Error:", err);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: (err as Error).message } },
      { status: 500 }
    );
  }
}
