/* ════════════════════════════════════════════════════════
   Sentinel City Intelligence — Citizen Multi-Hazard Banner
   Displays real-time official warnings, precipitation intensity,
   AQI category, and verified emergency muster helpline.
   ════════════════════════════════════════════════════════ */

"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useCityContext } from "@/components/providers/city-provider";

interface HazardFeedData {
  city: string;
  activeAlerts: Array<{
    id: string;
    alert_reference?: string;
    alertReference?: string;
    severity: string;
    title: string;
    headline: string;
    description: string;
    recommended_actions?: string[];
  }>;
  assessment?: {
    riskScore: number;
    riskLevel: string;
    explanation: string;
  };
  currentTelemetry?: {
    weather?: {
      temperatureCelsius: number;
      rainfallRateMmH: number;
      weatherDescription: string;
      windSpeedKmh: number;
    };
    airQuality?: {
      usAqi: number;
      category: string;
    };
    marine?: {
      waveHeightMeters: number;
      surgeRisk: string;
    };
  };
}

export function SentinelHazardBanner({ onOpenAssistant }: { onOpenAssistant?: () => void }) {
  const { city, cityConfig } = useCityContext();
  const [feed, setFeed] = useState<HazardFeedData | null>(null);
  const [wildfire, setWildfire] = useState<any>(null);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function loadData() {
      try {
        const [feedRes, fireRes] = await Promise.all([
          fetch(`/api/hazards/feed?city=${city}`),
          fetch(`/api/hazards/wildfire?city=${city}`),
        ]);
        if (feedRes.ok) {
          const json = await feedRes.json();
          if (json.success && mounted) {
            setFeed(json.data);
          }
        }
        if (fireRes.ok) {
          const fireJson = await fireRes.json();
          if (fireJson.success && mounted) {
            setWildfire(fireJson.data);
          }
        }
      } catch (err) {
        console.warn("[SentinelBanner] Non-fatal feed fetch error:", err);
      }
    }
    loadData();
    const interval = setInterval(loadData, 60000); // refresh every minute
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [city]);

  if (!feed) return null;

  const weather = feed.currentTelemetry?.weather;
  const aqi = feed.currentTelemetry?.airQuality;
  const assessment = feed.assessment;
  const activeAlerts = feed.activeAlerts || [];
  const primaryAlert = activeAlerts[0];

  const hasHighRisk = (assessment?.riskScore || 0) >= 60 || activeAlerts.length > 0;

  return (
    <div className="w-full mb-4 animate-fadeIn">
      {/* ─── Urgent Alert Banner (If Alert Exists) ─── */}
      {primaryAlert && !collapsed && (
        <div className="mb-3 p-4 rounded-2xl bg-gradient-to-r from-rose-900/90 via-red-900/80 to-amber-950/90 border border-rose-500/50 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="text-2xl p-2 bg-rose-500/20 rounded-xl border border-rose-400/30 animate-pulse">
              🚨
            </span>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-rose-500 text-white font-mono">
                  {primaryAlert.severity || "OFFICIAL WARNING"}
                </span>
                <span className="text-xs text-rose-200 font-mono">
                  {primaryAlert.alert_reference || primaryAlert.alertReference || "ALT-MUM"}
                </span>
              </div>
              <h4 className="font-bold text-sm text-white">{primaryAlert.title}</h4>
              <p className="text-xs text-rose-100/90 line-clamp-1">{primaryAlert.headline}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            {onOpenAssistant && (
              <button
                onClick={onOpenAssistant}
                className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-rose-950 font-bold rounded-xl text-xs transition-colors shadow-sm cursor-pointer"
              >
                Ask Sentinel AI 🤖
              </button>
            )}
            <button
              onClick={() => setCollapsed(true)}
              className="text-rose-300 hover:text-white text-xs px-2 py-1 rounded"
              title="Dismiss banner"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* ─── Satellite Thermal / Fire Hotspot Notification Banner ─── */}
      {!primaryAlert && (wildfire?.activeDetections?.count || 0) > 0 && !collapsed && (
        <div className="mb-3 p-4 rounded-2xl bg-gradient-to-r from-orange-950/90 via-red-950/85 to-amber-950/90 border border-orange-500/50 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="text-2xl p-2 bg-orange-500/20 rounded-xl border border-orange-400/30 animate-pulse">
              🔥
            </span>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-orange-600 text-white font-mono">
                  THERMAL ADVISORY
                </span>
                <span className="text-xs text-orange-200 font-mono">
                  NASA FIRMS · {cityConfig.name.toUpperCase()}
                </span>
              </div>
              <h4 className="font-bold text-sm text-white">
                {wildfire.activeDetections.count} Active Satellite Thermal Anomaly Detected
              </h4>
              <p className="text-xs text-orange-100/90">
                Satellite instruments detected elevated surface thermal signatures. Municipal Fire Brigade & Forest Rangers alerted.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <Link
              href="/admin/map"
              className="px-3.5 py-1.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs transition-colors shadow-sm cursor-pointer"
            >
              Inspect Map ↗
            </Link>
            <button
              onClick={() => setCollapsed(true)}
              className="text-orange-300 hover:text-white text-xs px-2 py-1 rounded"
              title="Dismiss banner"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* ─── Compact Sentinel Live Condition Bar ─── */}
      <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5 px-3.5 py-2 rounded-2xl bg-surface-1 border border-border text-xs text-text-secondary shadow-2xs">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <div className="flex items-center gap-1.5 font-medium text-text-primary">
            <span>🛡️</span>
            <span className="font-bold text-accent">{cityConfig.name} Sentinel:</span>
          </div>

          {weather && (
            <div className="flex items-center gap-1.5 font-mono">
              <span>🌧️</span>
              <span className="font-semibold text-text-primary">{weather.rainfallRateMmH.toFixed(1)} mm/h</span>
              <span className="text-text-tertiary">· {weather.temperatureCelsius}°C</span>
            </div>
          )}

          {aqi && (
            <div className="flex items-center gap-1.5 font-mono">
              <span>🌿</span>
              <span>AQI</span>
              <span className={`font-bold ${
                aqi.usAqi <= 50 ? "text-emerald-600 dark:text-emerald-400" : aqi.usAqi <= 100 ? "text-amber-600 dark:text-amber-400" : "text-rose-600 dark:text-rose-400"
              }`}>
                {aqi.usAqi} ({aqi.category})
              </span>
            </div>
          )}

          {assessment && (
            <div className="flex items-center gap-1.5">
              <span>Risk:</span>
              <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] font-mono ${
                assessment.riskScore >= 75 ? "bg-rose-500/20 text-rose-600" : assessment.riskScore >= 60 ? "bg-amber-500/20 text-amber-600" : "bg-emerald-500/20 text-emerald-600"
              }`}>
                {assessment.riskScore}/100 {assessment.riskLevel}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2.5 shrink-0 ml-auto sm:ml-0">
          <a
            href={`tel:${cityConfig.hazardCapabilities?.emergencyHelpline || "1916"}`}
            className="text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1"
          >
            <span>📞 Helpline:</span>
            <span>{cityConfig.hazardCapabilities?.emergencyHelpline || "1916"}</span>
          </a>

          {onOpenAssistant && (
            <button
              onClick={onOpenAssistant}
              className="text-xs font-bold text-accent hover:underline flex items-center gap-1 cursor-pointer pl-2 border-l border-border"
            >
              <span>AI Advisor ↗</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
