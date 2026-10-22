/* ════════════════════════════════════════════════════════
   Sentinel City Intelligence API — /api/hazards/dispatch
   Operational Emergency Dispatch Workflow (Safe Simulated Mode)
   Supports station candidate ranking, road ETA routing,
   and supervisor preview authorization.
   ════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from "next/server";
import { isValidCity, DEFAULT_CITY } from "@/lib/city-context";
import {
  createSimulatedDispatch,
  getSimulatedDispatches,
  updateDispatchStatus,
  rankCandidateStations,
} from "@/modules/hazards/emergency-dispatch";

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
    const dispatches = getSimulatedDispatches(city);

    return NextResponse.json({
      success: true,
      data: {
        city,
        total: dispatches.length,
        dispatches,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: (err as Error).message } },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action = "PROPOSE", city = DEFAULT_CITY, targetLat, targetLon, hazardType = "WILDFIRE", dispatchId, actorId, notes } = body;

    if (!isValidCity(city)) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_CITY", message: `City '${city}' is invalid.` } },
        { status: 400 }
      );
    }

    const citySlug = city.toLowerCase() as "mumbai" | "pune" | "nagpur";

    if (action === "RANK_ONLY") {
      if (typeof targetLat !== "number" || typeof targetLon !== "number") {
        return NextResponse.json(
          { success: false, error: { code: "BAD_COORDS", message: "targetLat and targetLon are required numbers." } },
          { status: 400 }
        );
      }

      const ranking = await rankCandidateStations(targetLat, targetLon, citySlug, hazardType);
      return NextResponse.json({ success: true, data: ranking });
    }

    if (action === "PROPOSE") {
      if (typeof targetLat !== "number" || typeof targetLon !== "number") {
        return NextResponse.json(
          { success: false, error: { code: "BAD_COORDS", message: "targetLat and targetLon are required numbers." } },
          { status: 400 }
        );
      }

      const record = await createSimulatedDispatch(citySlug, hazardType, targetLat, targetLon, {
        notes,
        incidentId: body.incidentId,
        observationId: body.observationId,
      });

      return NextResponse.json({
        success: true,
        data: record,
        message: `Proposed dispatch preview ${record.dispatchReference} created. Awaiting supervisor review.`,
      });
    }

    if (action === "APPROVE" || action === "ACKNOWLEDGE" || action === "CANCEL") {
      if (!dispatchId) {
        return NextResponse.json(
          { success: false, error: { code: "MISSING_ID", message: "dispatchId is required." } },
          { status: 400 }
        );
      }

      const newStatus = action === "APPROVE" ? "APPROVED" : action === "ACKNOWLEDGE" ? "ACKNOWLEDGED" : "CANCELLED";
      const updated = updateDispatchStatus(dispatchId, newStatus, actorId || "ADMIN_OFFICER");

      if (!updated) {
        return NextResponse.json(
          { success: false, error: { code: "NOT_FOUND", message: `Dispatch '${dispatchId}' not found.` } },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: updated,
        message: `Dispatch ${updated.dispatchReference} status transitioned to ${newStatus}.`,
      });
    }

    return NextResponse.json(
      { success: false, error: { code: "INVALID_ACTION", message: `Action '${action}' not supported.` } },
      { status: 400 }
    );
  } catch (err) {
    console.error("[API /api/hazards/dispatch] Error:", err);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: (err as Error).message } },
      { status: 500 }
    );
  }
}
