/* ════════════════════════════════════════════════════════
   Sentinel City Intelligence — Emergency Dispatch Proposal Modal
   Safe Simulated Operational Workflow
   - Station Candidate Ranking with Road Network ETAs
   - Cross-Departmental Coordination (Fire Brigade + Forest Dept)
   - Operational Authorization and Dispatch Confirmation
   - Strict Simulation Sandbox Isolation
   ════════════════════════════════════════════════════════ */

"use client";

import React, { useState, useEffect } from "react";

interface EmergencyDispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  city: string;
  observation: any | null; // Satellite observation or incident
  onDispatchSuccess?: (dispatchRecord: any) => void;
}

export function EmergencyDispatchModal({
  isOpen,
  onClose,
  city,
  observation,
  onDispatchSuccess,
}: EmergencyDispatchModalProps) {
  const [loading, setLoading] = useState(false);
  const [rankingData, setRankingData] = useState<any>(null);
  const [createdRecord, setCreatedRecord] = useState<any>(null);
  const [authorizing, setAuthorizing] = useState(false);
  const [notes, setNotes] = useState("");
  const [selectedStationId, setSelectedStationId] = useState<string>("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Fetch ranking when modal opens with observation
  useEffect(() => {
    if (!isOpen || !observation) {
      setRankingData(null);
      setCreatedRecord(null);
      setStatusMessage(null);
      return;
    }

    async function loadRanking() {
      try {
        setLoading(true);
        const res = await fetch("/api/hazards/dispatch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "RANK_ONLY",
            city,
            targetLat: observation.latitude,
            targetLon: observation.longitude,
            hazardType: observation.hazardType || "WILDFIRE",
          }),
        });

        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            setRankingData(json.data);
            if (json.data.rankedStations && json.data.rankedStations.length > 0) {
              setSelectedStationId(json.data.rankedStations[0].station.id);
            }
          }
        }
      } catch (err) {
        console.error("[EmergencyDispatchModal] Ranking error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadRanking();
  }, [isOpen, observation, city]);

  if (!isOpen || !observation) return null;

  // Propose Dispatch Preview
  const handlePropose = async () => {
    try {
      setAuthorizing(true);
      const res = await fetch("/api/hazards/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "PROPOSE",
          city,
          targetLat: observation.latitude,
          targetLon: observation.longitude,
          hazardType: observation.hazardType || "WILDFIRE",
          observationId: observation.id,
          notes: notes || `Operational dispatch proposed for hotspot ${observation.id} via Sentinel Command Center`,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setCreatedRecord(json.data);
          setStatusMessage(`Proposal ${json.data.dispatchReference} created successfully.`);
        }
      }
    } catch (err) {
      console.error("[EmergencyDispatchModal] Propose error:", err);
    } finally {
      setAuthorizing(false);
    }
  };

  // Authorize & Confirm Simulated Dispatch
  const handleAuthorize = async () => {
    if (!createdRecord) {
      await handlePropose();
    }
    const targetId = createdRecord?.id;
    if (!targetId) return;

    try {
      setAuthorizing(true);
      const res = await fetch("/api/hazards/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "APPROVE",
          city,
          dispatchId: targetId,
          actorId: "MUNICIPAL_DISPATCH_SUPERVISOR_01",
          notes: `Authorized for field deployment: ${notes || "Immediate response approved."}`,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setCreatedRecord(json.data);
          setStatusMessage(`✓ Dispatch ${json.data.dispatchReference} AUTHORIZED & SIMULATED UNITS EN ROUTE.`);
          onDispatchSuccess?.(json.data);
          setTimeout(() => {
            onClose();
          }, 2400);
        }
      }
    } catch (err) {
      console.error("[EmergencyDispatchModal] Authorize error:", err);
    } finally {
      setAuthorizing(false);
    }
  };

  const rankedStations = rankingData?.rankedStations || [];
  const brightnessCelsius = observation.brightnessKelvin
    ? (observation.brightnessKelvin - 273.15).toFixed(1)
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-surface-0 border border-border rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600/20 border border-rose-500/40 flex items-center justify-center text-xl">
              🚨
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight text-white flex items-center gap-2">
                <span>Emergency Unit Dispatch Proposal</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  Simulated Preview
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                City: <b className="text-slate-200 capitalize">{city}</b> · Automated Station Ranking & Road ETA
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-lg p-1 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-text-primary text-xs flex-1">
          {/* Status Alert */}
          {statusMessage && (
            <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-emerald-300 font-semibold flex items-center gap-2">
              <span>✓</span>
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Target Thermal Anomaly Details */}
          <div className="bg-surface-1 border border-border rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <span className="font-bold text-xs uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                <span>🔥</span> Target Anomaly Details
              </span>
              <span className="font-mono text-[11px] text-text-tertiary">
                ID: {observation.id}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              <div className="bg-surface-0 p-2.5 rounded-xl border border-border">
                <span className="text-[10px] text-text-tertiary block">Latitude / Longitude</span>
                <span className="font-mono font-bold text-xs">
                  {observation.latitude.toFixed(4)}, {observation.longitude.toFixed(4)}
                </span>
              </div>

              <div className="bg-surface-0 p-2.5 rounded-xl border border-border">
                <span className="text-[10px] text-text-tertiary block">Satellite Instrument</span>
                <span className="font-semibold text-xs text-accent">
                  {observation.satelliteInstrument || "NASA FIRMS"}
                </span>
              </div>

              <div className="bg-surface-0 p-2.5 rounded-xl border border-border">
                <span className="text-[10px] text-text-tertiary block">Brightness Temp</span>
                <span className="font-mono font-bold text-xs text-rose-500">
                  {brightnessCelsius ? `${brightnessCelsius}°C` : "N/A"}
                </span>
              </div>

              <div className="bg-surface-0 p-2.5 rounded-xl border border-border">
                <span className="text-[10px] text-text-tertiary block">Radiative Power (FRP)</span>
                <span className="font-mono font-bold text-xs text-orange-500">
                  {observation.frpMegawatts ? `${observation.frpMegawatts.toFixed(1)} MW` : "N/A"}
                </span>
              </div>
            </div>
          </div>

          {/* Candidate Emergency Stations Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                <span>🚒</span> Ranked Responding Stations ({rankedStations.length})
              </h4>
              <span className="text-[10px] text-text-tertiary">
                Sorted by Road Distance & Estimated Turnout ETA
              </span>
            </div>

            {loading ? (
              <div className="p-8 text-center text-text-tertiary border border-border rounded-2xl bg-surface-1">
                <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Calculating road network ETAs via authentic municipal GIS...
              </div>
            ) : rankedStations.length === 0 ? (
              <div className="p-4 text-center text-text-tertiary border border-border rounded-2xl bg-surface-1">
                No stations found for this jurisdiction.
              </div>
            ) : (
              <div className="border border-border rounded-2xl overflow-hidden divide-y divide-border">
                {rankedStations.map((cand: any, idx: number) => {
                  const stn = cand.station;
                  const isSelected = selectedStationId === stn.id;
                  const isForest = stn.stationType === "FOREST_RANGE";

                  return (
                    <div
                      key={stn.id || idx}
                      onClick={() => setSelectedStationId(stn.id)}
                      className={`p-3 transition-colors cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? "bg-accent/10 border-l-4 border-l-accent"
                          : "hover:bg-surface-1"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-surface-2 flex items-center justify-center font-bold text-[11px] text-text-secondary">
                          #{idx + 1}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-text-primary">
                              {isForest ? "🌲" : "🚒"} {stn.stationName}
                            </span>
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                                isForest
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                  : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                              }`}
                            >
                              {stn.department}
                            </span>
                          </div>
                          {stn.contactPhone && (
                            <span className="text-[10px] text-text-tertiary block mt-0.5">
                              📞 {stn.contactPhone}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="font-mono font-bold text-xs text-text-primary">
                          ~{cand.estimatedTravelMinutes} mins ETA
                        </div>
                        <div className="text-[10px] text-text-tertiary">
                          {cand.distanceKm} km · {cand.routingMethod === "OSRM" ? "Road Routing" : "Urban Winding"}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Supervisor Authorization Notes */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-text-primary">
              Incident Command Authorization Notes:
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter deployment instructions (e.g. Deploy 2 water tenders with brush suppression foam)..."
              rows={2}
              className="w-full p-2.5 bg-surface-1 border border-border rounded-xl text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/40"
            />
          </div>

          {/* Safe Simulation Sandbox Notice */}
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-700 dark:text-amber-300 space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <span>⚠️</span>
              <span>Simulated Operational Mode (Controlled Drill Sandbox)</span>
            </p>
            <p className="text-[10px] leading-relaxed opacity-90">
              Dispatches executed in this environment update internal state machines, generate auditable references, and verify road arrival times. Live cellular sirens and public emergency broadcasts are blocked in simulation mode.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-border bg-surface-1 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-border rounded-xl text-xs font-semibold text-text-secondary hover:bg-surface-2 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            {!createdRecord ? (
              <button
                onClick={handlePropose}
                disabled={authorizing || loading}
                className="px-4 py-2 bg-surface-2 hover:bg-surface-3 border border-border text-text-primary rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                <span>📝</span>
                <span>{authorizing ? "Generating..." : "Generate Proposal Record"}</span>
              </button>
            ) : null}

            <button
              onClick={handleAuthorize}
              disabled={authorizing}
              className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              <span>🚨</span>
              <span>
                {authorizing
                  ? "Authorizing..."
                  : createdRecord
                  ? `Authorize ${createdRecord.dispatchReference}`
                  : "Authorize & Dispatch Units"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
